import sys
import json
import asyncio
from playwright.async_api import async_playwright

async def fetch_reviews(url):
    reviews_data = []
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = await context.new_page()
            
            # Block media to speed up
            await page.route("**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,css,js}", lambda route: route.abort())
            
            await page.goto(url, wait_until='domcontentloaded', timeout=15000)
            
            # Click the "Reviews" tab. It has aria-label="Reviews" or role="tab" containing text "Reviews"
            try:
                # Different Google Maps tab layouts
                tab_selectors = [
                    'button[aria-label*="Reviews"]',
                    'div[role="tab"]:has-text("Reviews")',
                    'button:has-text("Reviews")'
                ]
                for selector in tab_selectors:
                    elements = await page.locator(selector).all()
                    for el in elements:
                        if await el.is_visible():
                            await el.click()
                            await page.wait_for_timeout(2000)
                            break
            except Exception as tab_e:
                pass # Continue to try scraping directly
                
            # Scrape review texts
            try:
                await page.wait_for_selector('.wiI7pd', timeout=10000)
            except:
                pass
            
            review_elements = await page.locator('.wiI7pd').all()
            author_elements = await page.locator('.d4r55').all()
            
            for i in range(min(len(review_elements), 3)):
                try:
                    text = await review_elements[i].inner_text()
                    author = "Customer"
                    if i < len(author_elements):
                        author = await author_elements[i].inner_text()
                    if text and len(text) > 10:
                        reviews_data.append({"author": author.strip(), "text": text.strip(), "rating": 5})
                except:
                    pass
                    
            await browser.close()
    except Exception as e:
        pass # Return whatever we got
        
    print(json.dumps(reviews_data))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        asyncio.run(fetch_reviews(sys.argv[1]))
    else:
        print("[]")
