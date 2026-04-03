import asyncio
import re
import sys
import urllib.parse
from playwright.async_api import async_playwright
from database import init_db, save_lead, export_to_csv, supabase

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

            for link in place_links:
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
                    try:
                        detail = page.locator('div[role="main"]').last
                        # Wait for the h1 to match our expected name (confirms panel swapped)
                        safe_name_prefix = re.escape(name[:20])
                        await detail.locator('h1', has_text=re.compile(safe_name_prefix, re.IGNORECASE)).first.wait_for(timeout=8000)
                        # Extra wait for phone/website/address to render (they load AFTER the title)
                        await page.wait_for_timeout(2500)
                    except:
                        # If name match fails, just give it a generous flat wait
                        await page.wait_for_timeout(4000)
                        detail = page.locator('div[role="main"]').last

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
                    
                    # ---- PHONE (data-item-id is stable) ----
                    phone = "N/A"
                    try:
                        phone_btn = detail.locator('button[data-item-id^="phone:tel:"]')
                        if await phone_btn.count() > 0:
                            phone_aria = await phone_btn.first.get_attribute('aria-label')
                            if phone_aria:
                                phone = phone_aria.replace("Phone: ", "").strip()
                    except:
                        pass
                        
                    # ---- WEBSITE (data-item-id is stable) ----
                    website = "N/A"
                    try:
                        web_el = detail.locator('a[data-item-id="authority"]')
                        if await web_el.count() > 0:
                            website = await web_el.first.get_attribute('href')
                    except:
                        pass
                        
                    # ---- ADDRESS (data-item-id is stable) ----
                    address = "N/A"
                    try:
                        addr_btn = detail.locator('button[data-item-id="address"]')
                        if await addr_btn.count() > 0:
                            addr_aria = await addr_btn.first.get_attribute('aria-label')
                            if addr_aria:
                                address = addr_aria.replace("Address: ", "").strip()
                    except:
                        pass

                    # ---- MAPS URL ----
                    maps_url = page.url

                    lead_data = {
                        "place_name": name,
                        "industry": query,
                        "rating": rating,
                        "reviews": reviews,
                        "phone": phone,
                        "website": website,
                        "address": address,
                        "maps_url": maps_url
                    }
                    
                    is_new = save_lead(lead_data)
                    if is_new:
                        print(f"✅ {name} | ⭐ {rating} ({reviews} reviews) | 📞 {phone} | 🌐 {'Yes' if website != 'N/A' else 'No'}")
                        extracted_count += 1
                        
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

        print(f"\n🎉 Finished scraping! Extracted {extracted_count} leads.")
        await browser.close()
        
        export_to_csv('leads_export.csv')

if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else "Dentist in Delhi"
    count = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    asyncio.run(scrape_google_maps(query, item_limit=count))

