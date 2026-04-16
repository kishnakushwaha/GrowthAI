import asyncio
import urllib.parse
from playwright.async_api import async_playwright

async def debug_maps():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        query = "Dentist in Delhi"
        search_url = f"https://www.google.com/maps/search/{urllib.parse.quote(query)}/?hl=en"
        await page.goto(search_url)
        await page.wait_for_selector('div[role="feed"]')
        await page.wait_for_timeout(3000)
        
        # Take screenshot of feed
        await page.screenshot(path="debug_feed.png")
        
        links = await page.locator('a[href*="/maps/place/"]').all()
        print(f"Found {len(links)} place links.")
        
        if links:
            print("Clicking first link...")
            await links[0].click()
            await page.wait_for_timeout(3000)
            await page.screenshot(path="debug_clicked.png")
            h1s = await page.locator('h1').all_inner_texts()
            print("H1s on page:", h1s)
            
            # Let's dig deeper: how is phone/website formatted?
            # Find all buttons with data-item-id
            buttons = page.locator('button[data-item-id]')
            count = await buttons.count()
            print(f"Found {count} buttons with data-item-id")
            for i in range(count):
                item_id = await buttons.nth(i).get_attribute('data-item-id')
                label = await buttons.nth(i).get_attribute('aria-label')
                print(f" - {item_id}: {label}")
                
            # Find websites
            links_item = page.locator('a[data-item-id]')
            count_links = await links_item.count()
            print(f"Found {count_links} a with data-item-id")
            for i in range(count_links):
                item_id = await links_item.nth(i).get_attribute('data-item-id')
                href = await links_item.nth(i).get_attribute('href')
                print(f" - {item_id}: {href}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_maps())
