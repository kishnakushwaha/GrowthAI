import asyncio
import re
import os
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

async def extract_website_data(page, url):
    try:
        print(f"⏳ Deep scraping: {url}")
        # Block images and fonts to speed up page load
        await page.route("**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,css}", lambda route: route.abort())
        await page.goto(url, wait_until="domcontentloaded", timeout=20000)
        
        # We give JS a quick second to mount simple dynamic tags
        await asyncio.sleep(2)
        
        html_content = await page.content()
        html_content_lower = html_content.lower()

        # 1. EMails
        # Grab from mailto links first
        mailto_links = await page.evaluate("Array.from(document.querySelectorAll('a[href^=\"mailto:\"]')).map(a => a.href.replace('mailto:', '').split('?')[0])")
        # Regex sweep for backup
        raw_emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', html_content)
        all_emails = set([e.strip() for e in (mailto_links + raw_emails)])
        # Filter out garbage formats or wix dummy emails
        clean_emails = [e for e in all_emails if not e.endswith(('.png', '.jpg', '.webp', 'example.com', 'wixpress.com'))]
        final_email = clean_emails[0] if clean_emails else None

        # 2. SEO Health
        missing_h1 = (await page.locator("h1").count()) == 0
        missing_meta_desc = (await page.locator('meta[name="description"]').count()) == 0
        
        # 3. Pixels & Trackers
        has_fb_pixel = 'fbevents.js' in html_content_lower or 'fbq(' in html_content_lower
        has_google_ads = 'gtag(' in html_content_lower or 'googletagmanager.com' in html_content_lower
        
        # 4. CMS Stack Guess
        cms_stack = "Custom"
        if "wp-content" in html_content_lower:
            cms_stack = "WordPress"
        elif "cdn.shopify" in html_content_lower:
            cms_stack = "Shopify"
        elif "wixsite.com" in html_content_lower or "wixpress" in html_content_lower:
            cms_stack = "Wix"
        elif "squarespace" in html_content_lower:
            cms_stack = "Squarespace"

        return {
            "email": final_email,
            "has_fb_pixel": has_fb_pixel,
            "has_google_ads": has_google_ads,
            "missing_h1": missing_h1,
            "missing_meta_desc": missing_meta_desc,
            "cms_stack": cms_stack
        }
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

    # Only deep scrape if they actually have a website
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
                "cms_stack": web_data.get("cms_stack")
            })

    try:
        supabase.table('website_enrichment').insert(enrichment_data).execute()
        print(f"✅ Enriched Lead {lead_id} | Email: {enrichment_data.get('extracted_email')} | SEO-H1-Missing: {enrichment_data.get('seo_missing_h1')}")
    except Exception as e:
        print(f"⚠️ Failed to save enrichment to Supabase: {e}")
