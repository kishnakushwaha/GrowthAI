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
                if not url or url in processed_urls:
                    continue
                
                processed_urls.add(url)
                
                try:
                    # Scroll exactly to the link so it's clickable
                    await link.scroll_into_view_if_needed()
                    print(f"👉 Extracting lead {extracted_count + 1}...")
                    
                    # Instead of a full click, let's try a light data grab first if we can
                    # But for Website and Phone we USUALLY need the sidebar
                    await link.click()
                    
                    # Fast timeout for sidebar wait
                    await page.wait_for_selector('h1', timeout=8000)
                    await page.wait_for_timeout(1500) # Small breathing room for JS

                    detail = page.locator('div[role="main"]').last

                    # ---- BUSINESS NAME ----
                    name = "Unknown"
                    try:
                        name = await detail.locator('h1').first.inner_text()
                        name = name.strip()
                    except:
                        pass

                    if name == "Unknown":
                        # Try to get it from the link itself or parent
                        try:
                            name = await link.get_attribute('aria-label')
                        except:
                            pass

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
                    
                    # ---- EMAIL (Search in description or through website in next step) ----
                    email = "N/A" # Maps doesn't provide email directly, usually handled by Audit Engine later

                    # ---- PHONE ----
                    phone = "N/A"
                    try:
                        phone_elements = detail.locator('button[data-item-id^="phone:tel:"]')
                        if await phone_elements.count() > 0:
                            phone = await phone_elements.first.get_attribute('aria-label')
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
                            address = address.replace("Address: ", "").strip()
                    except:
                        pass

                    lead_data = {
                        "place_name": name,
                        "industry": query,
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
