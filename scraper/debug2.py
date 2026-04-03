import asyncio
from playwright.async_api import async_playwright

async def deep_debug():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("https://www.google.com/maps/search/Dentist+in+Delhi/?hl=en")
        
        await page.wait_for_selector('a[href*="/maps/place/"]')
        await page.wait_for_timeout(2000)
        
        links = await page.locator('a[href*="/maps/place/"]').all()
        print(f"Found {len(links)} place links")
        
        if links:
            await links[0].click()
            await page.wait_for_timeout(3000)
            await page.screenshot(path="debug_detail.png")
            
            # Dump the ENTIRE detail panel HTML
            # The detail panel is usually inside a div with role="main"
            main_panel = page.locator('div[role="main"]')
            if await main_panel.count() > 0:
                html = await main_panel.first.inner_html()
                with open("debug_html.txt", "w") as f:
                    f.write(html)
                print("Saved detail panel HTML to debug_html.txt")
            
            # Also dump ALL aria-labels on the entire page
            all_elements = await page.query_selector_all('[aria-label]')
            print(f"\n--- ALL aria-labels ({len(all_elements)}) ---")
            for el in all_elements[:50]:
                tag = await el.evaluate('el => el.tagName')
                label = await el.get_attribute('aria-label')
                if label and ('star' in label.lower() or 'review' in label.lower() or 'rating' in label.lower()):
                    print(f"  *** MATCH: <{tag}> aria-label=\"{label}\"")
            
            # Dump ALL visible text in the header area
            print("\n--- ALL role=img elements ---")
            imgs = await page.query_selector_all('[role="img"]')
            for img in imgs[:20]:
                label = await img.get_attribute('aria-label')
                if label:
                    print(f"  role=img: {label}")
            
            # Check for any element containing the text pattern X.X
            print("\n--- Spans with potential ratings ---")
            spans = await page.query_selector_all('span')
            for span in spans:
                text = await span.inner_text()
                text = text.strip()
                if text and len(text) <= 5:
                    try:
                        val = float(text)
                        if 1.0 <= val <= 5.0:
                            classes = await span.get_attribute('class')
                            parent_tag = await span.evaluate('el => el.parentElement?.tagName')
                            parent_class = await span.evaluate('el => el.parentElement?.className')
                            print(f"  Rating candidate: '{text}' class={classes} parent=<{parent_tag} class=\"{parent_class}\">")
                    except:
                        pass
                        
            # Check for review count patterns like (1,234) or just numbers
            print("\n--- Buttons with review text ---")
            buttons = await page.query_selector_all('button')
            for btn in buttons:
                text = await btn.inner_text()
                if 'review' in text.lower() or 'rating' in text.lower():
                    aria = await btn.get_attribute('aria-label')
                    jsname = await btn.get_attribute('jsaction')
                    print(f"  Button: text=\"{text.strip()[:80]}\" aria=\"{aria}\"")

        await browser.close()

asyncio.run(deep_debug())
