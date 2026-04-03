import asyncio
import re
import sys
import urllib.parse
from playwright.async_api import async_playwright
from database import init_db, save_lead, export_to_csv

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
                '--no-zygote',
                '--single-process' # Saves RAM on Free Tier
            ]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        search_url = f"https://www.google.com/maps/search/{urllib.parse.quote(query)}/?hl=en"
        print(f"🔗 Navigating to: {search_url}")
        await page.goto(search_url)
        
        print("⏳ Waiting for results to load (max 60s)...")
        try:
            # Try multiple possible selectors as Google Maps layout varies
            feed_selectors = [
                'div[role="feed"]',
                'div.m67q60-m67q60-ia-p', # Sometimes used for the list
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
                # Final attempt with longer timeout on primary selector
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
            # Re-locate the feed on every iteration to keep it fresh
            # Locator fallbacks
            place_links = await page.locator('a[href*="/maps/place/"]').all()
            if not place_links:
                # Try fallback list-item selector if maps/place doesn't work
                place_links = await page.locator('div.q2oYwe a').all()

            print(f"📍 Found {len(place_links)} potential business links on current view (Attempt {scroll_attempts+1})")
            
            if not place_links and scroll_attempts > 2:
                print("⚠️ No links found, maybe Google is blocking? Taking screenshot.")
                await page.screenshot(path="no_links_debug.png")

            # Try to grab what we can without over-scrolling first
            for link in place_links:
                if extracted_count >= item_limit:
                    break
                    
                url = await link.get_attribute('href')
                if not url:
                    continue
                
                # Google Maps heavily modifies the href with live coordinates /@lat,lng or /data= as you scroll
                clean_url = url.split('?')[0].split('/data=')[0].split('/@')[0]
                if clean_url in processed_urls:
                    continue
                processed_urls.add(clean_url)
                
                try:
                    # ---- BUSINESS NAME (Pre-Click) ----
                    # Extract the business name directly from the link's aria-label BEFORE doing anything
                    name = await link.get_attribute('aria-label')
                    if not name or name == "Results":
                        continue
                        
                    # Huge Speed Optimization: Check CRM BEFORE we waste clicking and waiting
                    from database import supabase
                    result = supabase.table('businesses').select('id').eq('place_name', name).execute()
                    if result.data:
                        print(f"⏭️ Skipped duplicate: {name} (Already in CRM)")
                        continue
                        
                    # Scroll exactly to the link so it's clickable
                    await link.scroll_into_view_if_needed()
                    print(f"👉 Extracting lead {extracted_count + 1}...")
                    
                    # We only click if it's a new lead
                    await link.click()
                    
                    # Fast timeout for sidebar wait, waiting specifically for the DOM to update to the new content
                    try:
                        detail = page.locator('div[role="main"]').last
                        # Force Playwright to wait until the h1 ACTUALLY updates to the new business name
                        await detail.locator('h1', has_text=re.compile(re.escape(name[:15]), re.IGNORECASE)).first.wait_for(timeout=8000)
                        await page.wait_for_timeout(2000) # Give React time to swap the phone number and website
                    except:
                        # Fallback pause if strict text match fails 
                        await page.wait_for_timeout(3000)

                    # ---- RATING & REVIEWS ----
                    rating = "N/A"
                    reviews = "0"
                    try:
                        # Improved rating locator
                        rating_span = detail.locator('span.ceNzR').first
                        if await rating_span.count() > 0:
                            rating_text = await rating_span.get_attribute('aria-label')
                            # e.g. "4.5 stars"
                            rating = re.search(r'\d\.\d', rating_text).group(0) if re.search(r'\d\.\d', rating_text) else "N/A"
                        
                        review_span = detail.locator('span.jANrl').first
                        if await review_span.count() > 0:
                            review_text = await review_span.inner_text()
                            # e.g. "(1,234)"
                            reviews = review_text.replace('(', '').replace(')', '').replace(',', '').strip()
                    except:
                        pass
                    
                    # ---- EMAIL ----
                    email = "N/A"

                    # ---- PHONE ----
                    phone = "N/A"
                    try:
                        phone_elements = detail.locator('button[data-item-id^="phone:tel:"]')
                        if await phone_elements.count() > 0:
                            phone = await phone_elements.first.get_attribute('aria-label')
                            if phone:
                                phone = phone.replace("Phone: ", "").strip()
                    except:
                        pass
                        
                    # ---- WEBSITE ----
                    website = "N/A"
                    try:
                        website_element = detail.locator('a[data-item-id="authority"]')
                        if await website_element.count() > 0:
                            website = await website_element.first.get_attribute('href')
                    except:
                        pass
                        
                    # ---- ADDRESS ----
                    address = "N/A"
                    try:
                        addr_element = detail.locator('button[data-item-id="address"]')
                        if await addr_element.count() > 0:
                            address = await addr_element.first.get_attribute('aria-label')
                            if address:
                                address = address.replace("Address: ", "").strip()
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
                    print(f"Error extracting an item: {str(e)[:80]}")
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
