import asyncio
import re
import os
try:
    import httpx
except ImportError:
    httpx = None
    print("⚠️ httpx not installed — PageSpeed API will be skipped. Run: pip install httpx")
import google.generativeai as genai
from database import supabase

# Configure Gemini Native API (Free Tier)
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

async def generate_ai_icebreaker(place_name, industry, rating, reviews):
    if not GEMINI_API_KEY:
        return None
    try:
        model = genai.GenerativeModel('gemini-1.5-flash-8b') # Fast free model
        prompt = f"""
        You are an expert sales SDR reaching out to a local business in India.
        Business Name: {place_name}
        Niche: {industry}
        Google Rating: {rating} stars ({reviews} reviews)
        
        Write a SINGLE, highly conversational, non-salesy opening icebreaker sentence. 
        It should compliment them on their rating or reviews if they are good, or express surprise if they are struggling.
        DO NOT pitch any services. Max 1 sentence. E.g., "Hey noticed your clinic in Delhi has an amazing 4.8 rating across 150 reviews, that's incredibly rare!"
        """
        response = model.generate_content(prompt)
        if response and response.text:
            return response.text.strip().replace('"', '')
        return None
    except Exception as e:
        print(f"⚠️ Failed to generate AI icebreaker: {e}")
        return None

async def fetch_pagespeed(url: str) -> dict:
    scores = {'pagespeed_mobile': None, 'pagespeed_desktop': None}
    if httpx is None:
        return scores
    api_url = f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(api_url, params={'url': url, 'strategy': 'mobile', 'category': 'performance'})
            if r.status_code == 200:
                data = r.json()
                scores['pagespeed_mobile'] = int(data['lighthouseResult']['categories']['performance']['score'] * 100)
            
            r = await client.get(api_url, params={'url': url, 'strategy': 'desktop', 'category': 'performance'})
            if r.status_code == 200:
                data = r.json()
                scores['pagespeed_desktop'] = int(data['lighthouseResult']['categories']['performance']['score'] * 100)
    except Exception as e:
        print(f"⚠️ PageSpeed failed for {url}: {e}")
    return scores

def compute_seo_score(signals: dict) -> int:
    score = 0
    if not signals.get('has_ga') and not signals.get('has_google_ads'): score += 1
    if not signals.get('has_fb_pixel'): score += 1
    if not signals.get('has_google_ads'): score += 1

    if signals.get('missing_h1'): score += 1
    if signals.get('missing_meta_desc'): score += 1
    if not signals.get('has_schema_markup'): score += 1
    if signals.get('title_quality') == 'generic': score += 1

    mobile = signals.get('pagespeed_mobile')
    if mobile is not None and mobile < 50: score += 1
    elif signals.get('is_slow_site'): score += 1
    
    if not signals.get('has_ssl'): score += 1
    return min(score, 10)

def classify_opportunity(signals: dict) -> dict:
    has_pixel = signals.get('has_fb_pixel', False)
    has_ads = signals.get('has_google_ads', False) or signals.get('has_ga', False)
    seo_score = signals.get('seo_score', 0)

    if has_ads and not has_pixel:
        return {'type': 'ads_no_retargeting', 'angle': 'Running Ads without FB Pixel — losing retargeting revenue.'}
    if not has_ads and not has_pixel:
        return {'type': 'no_tracking', 'angle': 'No GA, no FB Pixel, no Ads — zero visibility into traffic.'}
    if seo_score >= 4:
        return {'type': 'tracking_ok_seo_weak', 'angle': 'Ads infrastructure exists but core SEO is broken.'}
    
    return {'type': 'well_optimized', 'angle': None}

async def extract_website_data(page, url):
    try:
        print(f"⏳ Deep scraping: {url}")
        await page.route("**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,css}", lambda route: route.abort())
        await page.goto(url, wait_until="domcontentloaded", timeout=20000)
        await asyncio.sleep(2)
        
        html_content = await page.content()
        html_content_lower = html_content.lower()
        title = await page.title()

        # Phase 6: Page Title Quality
        title_quality = 'descriptive' if (title and len(title) > 25 and any(kw in title.lower() for kw in ['best', 'top', 'clinic', 'service', 'near', '|', '-'])) else 'generic'

        # Emails
        mailto_links = await page.evaluate("Array.from(document.querySelectorAll('a[href^=\"mailto:\"]')).map(a => a.href.replace('mailto:', '').split('?')[0])")
        raw_emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', html_content)
        all_emails = set([e.strip() for e in (mailto_links + raw_emails)])
        clean_emails = [e for e in all_emails if not e.endswith(('.png', '.jpg', '.webp', 'example.com', 'wixpress.com'))]
        final_email = clean_emails[0] if clean_emails else None

        # SEO & Trust
        missing_h1 = (await page.locator("h1").count()) == 0
        missing_meta_desc = (await page.locator('meta[name="description"]').count()) == 0
        has_ssl = url.startswith('https')
        has_schema_markup = 'application/ld+json' in html_content_lower
        is_mobile_friendly = 'name="viewport"' in html_content_lower
        has_contact_page = 'href="/contact' in html_content_lower or 'href="contact' in html_content_lower or '<form' in html_content_lower
        
        # Social Footprint
        has_instagram = 'instagram.com/' in html_content_lower
        has_linkedin = 'linkedin.com/' in html_content_lower

        # Pure Body Text Extraction for NLP
        try:
            body_text = await page.evaluate("document.body.innerText")
            body_text = ' '.join(body_text.split())[:2000] # Cleaned and clamped
        except:
            body_text = ""
        
        # Phase 8: Gemini NLP Website Summary
        ai_human_summary = "No website summary available."
        if body_text and len(body_text) > 100:
            prompt = f"""
            You are an expert sales auditor evaluating a local business's website.
            Based on the raw text extracted from their homepage below, write exactly TWO punchy sentences summarizing:
            1) What exactly they do and their apparent scale/pricing strategy based on the tone.
            2) A critical observation on how weak or generic their website copy is, making them ripe for digital disruption.
            
            Keep it strictly business-focused, professional, yet aggressive. No pleasantries.
            
            Text: {body_text}
            """
            try:
                model = genai.GenerativeModel('gemini-1.5-flash')
                response = await model.generate_content_async(prompt)
                if response.text:
                    ai_human_summary = response.text.strip()
            except Exception as e:
                print(f"⚠️ Gemini NLP summarization failed: {e}")

        # Phase 8: Owner Name Discovery
        owner_name = None
        if body_text and len(body_text) > 100:
            name_prompt = f"""
            Extract the name of the Owner, Founder, MD, or Principal from the following local business website text.
            If multiple names are found, pick the one that seems to be the highest authority.
            Return ONLY the name. If no clear owner name is found, return "Unknown".
            
            Text: {body_text}
            """
            try:
                name_model = genai.GenerativeModel('gemini-1.5-flash-8b')
                name_res = await name_model.generate_content_async(name_prompt)
                extracted = name_res.text.strip()
                if extracted and extracted != "Unknown" and len(extracted) < 50:
                    owner_name = extracted
            except:
                pass

        # Performance proxy
        resource_count = await page.evaluate("performance.getEntriesByType('resource').length")
        is_slow_site = resource_count > 120

        # Ads & Pixels
        has_fb_pixel = 'fbevents.js' in html_content_lower or 'fbq(' in html_content_lower
        has_google_ads = any(m in html_content_lower for m in ['adsbygoogle.js', 'gtag(\'event\'', 'googlesyndication', 'googleadservices'])
        has_ga = 'googletagmanager.com' in html_content_lower
        
        cms_stack = "Custom"
        if "wp-content" in html_content_lower: cms_stack = "WordPress"
        elif "cdn.shopify" in html_content_lower: cms_stack = "Shopify"
        elif "wixsite.com" in html_content_lower or "wixpress" in html_content_lower: cms_stack = "Wix"

        # Phase 6: Fetch Real Speed via API
        speed_scores = await fetch_pagespeed(url)
        await asyncio.sleep(1) # pacing

        signals = {
            "email": final_email,
            "has_fb_pixel": has_fb_pixel,
            "has_google_ads": has_google_ads,
            "has_ga": has_ga,
            "missing_h1": missing_h1,
            "missing_meta_desc": missing_meta_desc,
            "cms_stack": cms_stack,
            "page_title": title,
            "title_quality": title_quality,
            "has_ssl": has_ssl,
            "has_schema_markup": has_schema_markup,
            "is_mobile_friendly": is_mobile_friendly,
            "has_contact_page": has_contact_page,
            "resource_count": resource_count,
            "is_slow_site": is_slow_site,
            "has_instagram": has_instagram,
            "has_linkedin": has_linkedin,
            "ai_human_summary": ai_human_summary,
            "owner_name": owner_name,
            **speed_scores
        }
        
        seo_score = compute_seo_score(signals)
        signals['seo_score'] = seo_score
        
        opp = classify_opportunity(signals)
        signals['opportunity_type'] = opp['type']
        signals['pitch_angle'] = opp['angle']

        return signals
    except Exception as e:
        print(f"⚠️ Deep scrape failed for {url}: {e}")
        return None

async def enrich_lead(context, lead_id, data):
    """
    Main entry point for deep scraping a single lead post-db insert.
    """
    website = data.get('website')
    place_name = data.get('place_name')
    
    # Generate AI Icebreaker regardless of website
    ai_first_line = await generate_ai_icebreaker(place_name, data.get('industry', ''), data.get('rating', ''), data.get('reviews', '0'))
    
    enrichment_data = {
        "lead_id": lead_id,
        "ai_first_line": ai_first_line,
        "extracted_email": None,
        "has_fb_pixel": False,
        "has_google_ads": False,
        "seo_missing_h1": True,
        "seo_missing_meta_desc": True,
        "cms_stack": "None"
    }

    if website and website != 'N/A' and website.strip():
        page = await context.new_page()
        web_data = await extract_website_data(page, website)
        await page.close()
        
        if web_data:
            enrichment_data.update({
                "extracted_email": web_data.get("email"),
                "has_fb_pixel": web_data.get("has_fb_pixel"),
                "has_google_ads": web_data.get("has_google_ads"),
                "seo_missing_h1": web_data.get("missing_h1"),
                "seo_missing_meta_desc": web_data.get("missing_meta_desc"),
                "cms_stack": web_data.get("cms_stack"),
                
                "page_title": web_data.get("page_title"),
                "title_quality": web_data.get("title_quality"),
                "has_ssl": web_data.get("has_ssl"),
                "has_schema_markup": web_data.get("has_schema_markup"),
                "is_mobile_friendly": web_data.get("is_mobile_friendly", False),
                "has_contact_page": web_data.get("has_contact_page", False),
                "resource_count": web_data.get("resource_count"),
                "is_slow_site": web_data.get("is_slow_site"),
                "pagespeed_mobile": web_data.get("pagespeed_mobile"),
                "pagespeed_desktop": web_data.get("pagespeed_desktop"),
                "seo_score": web_data.get("seo_score"),
                "opportunity_type": web_data.get("opportunity_type"),
                "pitch_angle": web_data.get("pitch_angle"),
                "has_instagram": web_data.get("has_instagram", False),
                "has_linkedin": web_data.get("has_linkedin", False),
                "ai_human_summary": web_data.get("ai_human_summary", "No summary."),
                "owner_name": web_data.get("owner_name")
            })
        else:
            # Website couldn't be requested or is broken
            enrichment_data.update({
                "seo_score": 10,
                "opportunity_type": "no_tracking",
                "pitch_angle": "Your website link on Google is broken and unreachable, costing you leads."
            })
    else:
        # No website exists at all
        enrichment_data.update({
            "seo_score": 10,
            "opportunity_type": "no_tracking",
            "pitch_angle": "No website listed on Google Maps — completely invisible to high-intent searchers."
        })

    try:
        supabase.table('website_enrichment').insert(enrichment_data).execute()
        
        # Phase 6 Bonus: Update the main business lead_score based on deep SEO findings
        added_penalty = enrichment_data.get("seo_score", 0) * 3
        if added_penalty > 0:
            res = supabase.table('businesses').select('lead_score').eq('id', lead_id).execute()
            if res.data:
                curr_score = res.data[0].get('lead_score') or 0
                new_score = min(100, curr_score + added_penalty)
                supabase.table('businesses').update({'lead_score': new_score}).eq('id', lead_id).execute()

        print(f"✅ Enriched & Classified Lead {lead_id} | Opp: {enrichment_data.get('opportunity_type')} | Speed: {enrichment_data.get('pagespeed_mobile')}")
    except Exception as e:
        print(f"⚠️ Failed to save enrichment to Supabase: {e}")
