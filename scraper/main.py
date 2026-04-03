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
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        search_url = f"https://www.google.com/maps/search/{urllib.parse.quote(query)}/?hl=en"
        await page.goto(search_url)
        
        print("Waiting for results to load...")
        try:
            await page.wait_for_selector('div[role="feed"]', timeout=15000)
        except:
            print("Could not find feed. Check if the query returned results.")
            await browser.close()
            return

        scroll_attempts = 0
        extracted_count = 0
        processed_urls = set()

        while extracted_count < item_limit and scroll_attempts < 15:
            place_links = await page.locator('a[href*="/maps/place/"]').all()
            
            for link in place_links:
                if extracted_count >= item_limit:
                    break
                    
                url = await link.get_attribute('href')
                if not url or url in processed_urls:
                    continue
                
                processed_urls.add(url)
                
                try:
                    await link.scroll_into_view_if_needed()
                    await link.click()
                    
                    await page.wait_for_selector('h1', timeout=5000)
                    await page.wait_for_timeout(2000)

                    detail = page.locator('div[role="main"]').last

                    # ---- BUSINESS NAME ----
                    name = "Unknown"
                    try:
                        name = await detail.locator('h1').first.inner_text()
                        name = name.strip()
                    except:
                        pass

                    # ---- RATING & REVIEWS ----
                    rating = "N/A"
                    reviews = "0"
                    try:
                        header_div = detail.locator('div.TIHn2')
                        if await header_div.count() > 0:
                            header_text = await header_div.first.inner_text()
                            
                            rating_match = re.search(r'\b(\d\.\d)\b', header_text)
                            if rating_match:
                                rating = rating_match.group(1)
                            
                            review_match = re.search(r'\(([0-9,]+)\)', header_text)
                            if review_match:
                                reviews = review_match.group(1).replace(',', '')
                    except:
                        pass
                    
                    # ---- MAPS URL ----
                    maps_url = page.url

                    # ---- PHONE ----
                    phone = "N/A"
                    try:
                        phone_element = detail.locator('button[data-item-id^="phone:tel:"]')
                        if await phone_element.count() > 0:
                            phone = await phone_element.first.get_attribute('aria-label')
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
