import asyncio
import re
import sys
import urllib.parse
from playwright.async_api import async_playwright
from database import init_db, save_lead, export_to_csv, supabase
from deep_scraper import enrich_lead

async def scrape_google_maps(query, item_limit=20):
    print(f"🚀 Starting scraper for: '{query}'")
    
    init_db()

    async with async_playwright() as p:
        print("🔧 Launching browser in lean mode...")
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote'
            ]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        search_url = f"https://www.google.com/maps/search/{urllib.parse.quote(query)}/?hl=en"
        print(f"🔗 Navigating to: {search_url}")
        await page.goto(search_url, wait_until='domcontentloaded', timeout=60000)
        
        print("⏳ Waiting for results to load (max 60s)...")
        try:
            feed_selectors = [
                'div[role="feed"]',
                'div[aria-label^="Results for"]',
                'div[role="main"]'
            ]
            
            found = False
            for selector in feed_selectors:
                try:
                    await page.wait_for_selector(selector, timeout=15000)
                    print(f"✅ Found results feed using: {selector}")
                    found = True
                    break
                except:
                    continue
            if not found:
                print("⚠️ Still waiting, taking a screenshot to debug...")
                await page.screenshot(path="scraper_debug.png")
                await page.wait_for_selector('div[role="feed"]', timeout=45000)
                print("✅ Found results feed after extra wait.")
        except Exception as e:
            print(f"❌ Could not find results feed: {str(e)}")
            await page.screenshot(path="no_feed_debug.png")
            await browser.close()
            return

        scroll_attempts = 0
        extracted_count = 0
        processed_urls = set()

        print("🔍 Starting extraction loop...")

        while extracted_count < item_limit and scroll_attempts < 15:
            place_links = await page.locator('a[href*="/maps/place/"]').all()
            if not place_links:
                place_links = await page.locator('div.q2oYwe a').all()

            print(f"📍 Found {len(place_links)} potential business links on current view (Attempt {scroll_attempts+1})")
            
            if not place_links and scroll_attempts > 2:
                print("⚠️ No links found, maybe Google is blocking? Taking screenshot.")
                await page.screenshot(path="no_links_debug.png")
            # Extract city from query (e.g. "Dentists in Agra" -> "Agra")
            city_match = re.search(r'\bin\s+([A-Za-z\s]+)$', query, re.IGNORECASE)
            search_city = city_match.group(1).strip() if city_match else ""

            for rank_index, link in enumerate(place_links, start=1):
                if extracted_count >= item_limit:
                    break
                    
                url = await link.get_attribute('href')
                if not url:
                    continue
                
                # Normalize URL to prevent false duplicates from coordinate changes
                clean_url = url.split('?')[0].split('/data=')[0].split('/@')[0]
                if clean_url in processed_urls:
                    continue
                processed_urls.add(clean_url)
                
                try:
                    # ---- BUSINESS NAME (Pre-Click from aria-label) ----
                    name = await link.get_attribute('aria-label')
                    if not name or name.strip() == "" or name == "Results":
                        continue
                    name = name.strip()
                        
                    # Fast duplicate check BEFORE clicking (saves ~10s per duplicate)
                    result = supabase.table('businesses').select('id').eq('place_name', name).execute()
                    if result.data:
                        print(f"⏭️ Skipped duplicate: {name} (Already in CRM)")
                        continue
                        
                    await link.scroll_into_view_if_needed()
                    print(f"👉 Extracting lead {extracted_count + 1}...")
                    
                    await link.click()
                    
                    # Wait for sidebar to fully load with the NEW business data
                    detail = page.locator('div[role="main"]').last
                    try:
                        # Step 1: Wait for h1 to show the new business name (confirms panel swapped)
                        safe_name_prefix = re.escape(name[:20])
                        await detail.locator('h1', has_text=re.compile(safe_name_prefix, re.IGNORECASE)).first.wait_for(timeout=8000)
                        # Step 2: Wait for contact/action buttons to load (phone/address arrive via a separate XHR after the title)
                        try:
                            await detail.locator('button[data-item-id], a[data-item-id]').first.wait_for(timeout=6000)
                        except:
                            # Some businesses have no contact info at all — that's fine, just give extra flat time
                            await page.wait_for_timeout(2000)
                    except:
                        # If name match fails entirely, give a generous flat wait
                        await page.wait_for_timeout(5000)

                    # ---- RATING & REVIEWS (aria-label based, not class names) ----
                    rating = "N/A"
                    reviews = "0"
                    try:
                        # Rating: look for any span with aria-label matching "X.X stars" pattern
                        rating_els = detail.locator('span[aria-label]')
                        count = await rating_els.count()
                        for i in range(min(count, 20)):
                            aria = await rating_els.nth(i).get_attribute('aria-label')
                            if aria and 'star' in aria.lower():
                                match = re.search(r'(\d\.?\d?)\s*star', aria, re.IGNORECASE)
                                if match:
                                    rating = match.group(1)
                                    break
                        
                        # Reviews: look for span with aria-label matching "X reviews" pattern
                        for i in range(min(count, 20)):
                            aria = await rating_els.nth(i).get_attribute('aria-label')
                            if aria and 'review' in aria.lower():
                                match = re.search(r'([\d,]+)\s*review', aria, re.IGNORECASE)
                                if match:
                                    reviews = match.group(1).replace(',', '')
                                    break
                    except:
                        pass
                    
                    # ---- PHONE, WEBSITE, ADDRESS (Robust Aria-Label Scan) ----
                    phone = "N/A"
                    website = "N/A"
                    address = "N/A"
                    try:
                        # Grab all interactive elements that might hold data
                        interactive_els = detail.locator('button[aria-label], a[aria-label], a[href]')
                        count = await interactive_els.count()
                        
                        for i in range(min(count, 50)): # Limit to 50 to avoid hanging
                            el = interactive_els.nth(i)
                            aria = await el.get_attribute('aria-label') or ""
                            href = await el.get_attribute('href') or ""
                            
                            aria_lower = aria.lower()
                            
                            # Phone Detection
                            if aria_lower.startswith("phone:") or aria_lower.startswith("call "):
                                val = aria.split(":", 1)[-1].strip() if ":" in aria else aria.replace("Call ", "").strip()
                                if val and phone == "N/A": 
                                    phone = val
                            elif href.startswith("tel:") and phone == "N/A":
                                phone = href.replace("tel:", "").strip()
                                
                            # Website Detection
                            if aria_lower.startswith("website:") or "website" in aria_lower:
                                if href and href.startswith("http") and "google.com" not in href:
                                    if website == "N/A": website = href
                            elif await el.get_attribute('data-item-id') == "authority" and website == "N/A":
                                if href: website = href
                                
                            # Address Detection
                            if aria_lower.startswith("address:"):
                                if address == "N/A": 
                                    address = aria.replace("Address:", "").strip()
                            elif aria_lower.startswith("location:"):
                                if address == "N/A":
                                    address = aria.replace("Location:", "").strip()
                                    
                    except Exception as loc_err:
                        print(f"⚠️ Locator parsing error: {loc_err}")

                    # ---- MAPS URL ----
                    maps_url = page.url

                    if (phone == "N/A" or not phone) and (website == "N/A" or not website):
                        print(f"⏭️ Skipped Dead Lead: {name} (No Phone, No Website)")
                        continue

                    if not address or rating == "N/A":
                        print(f"⏭️ Skipped Incomplete Lead: {name} (No Address or Rating)")
                        continue

                    lead_data = {
                        "place_name": name,
                        "industry": query,
                        "rating": rating,
                        "reviews": reviews,
                        "phone": phone,
                        "website": website,
                        "address": address,
                        "maps_url": maps_url,
                        "rank_position": rank_index,
                        "search_query": query,
                        "search_city": search_city
                    }
                    
                    lead_id = save_lead(lead_data)
                    if lead_id:
                        print(f"✅ {name} | ⭐ {rating} ({reviews} reviews) | 📞 {phone} | 🌐 {'Yes' if website != 'N/A' else 'No'}")
                        extracted_count += 1
                        
                        # Phase 2: Call Deep Website Scraper
                        try:
                            await enrich_lead(context, lead_id, lead_data)
                        except Exception as enrich_err:
                            print(f"⚠️ Deep enrichment error: {enrich_err}")
                        
                except Exception as e:
                    print(f"Error extracting an item: {str(e)[:120]}")
                    pass

            try:
                hover_box = page.locator('div[role="feed"]')
                await hover_box.hover()
                await page.mouse.wheel(0, 5000)
                await page.wait_for_timeout(2000)
                scroll_attempts += 1
            except:
                break

        from compute_gaps import compute_competitor_gaps
        compute_competitor_gaps(query, search_city)
        print(f"\n🎉 Finished scraping! Extracted {extracted_count} leads.")
        await browser.close()
        
        export_to_csv('leads_export.csv')

if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else "Dentist in Delhi"
    count = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    asyncio.run(scrape_google_maps(query, item_limit=count))

