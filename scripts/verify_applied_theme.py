import asyncio
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        
        # Test 1: Fresh user with Light system preference
        ctx_light = await browser.new_context(color_scheme='light', viewport={'width': 1440, 'height': 900})
        page_light = await ctx_light.new_page()
        await page_light.goto("http://127.0.0.1:3000/#/")
        try:
            await page_light.wait_for_selector('#loading-screen', state='hidden', timeout=7000)
        except:
            pass
        await page_light.wait_for_selector('.dp-hero-cards', timeout=4000)
        
        theme_light = await page_light.evaluate("document.documentElement.dataset.theme")
        print("Default theme (Light system):", theme_light)
        assert theme_light == 'cartoon', f"Expected 'cartoon', got '{theme_light}'"
        
        # Click TỐI button in header
        dark_btn = await page_light.query_selector('.dp-control-btn--theme[data-theme-val="dark"]')
        assert dark_btn is not None, "Dark button not found in header!"
        await dark_btn.click()
        await page_light.wait_for_timeout(300)
        
        theme_after_toggle = await page_light.evaluate("document.documentElement.dataset.theme")
        print("Theme after clicking TỐI:", theme_after_toggle)
        assert theme_after_toggle == 'cartoon-dark', f"Expected 'cartoon-dark', got '{theme_after_toggle}'"
        
        # Click SÁNG button in header
        light_btn = await page_light.query_selector('.dp-control-btn--theme[data-theme-val="light"]')
        assert light_btn is not None, "Light button not found in header!"
        await light_btn.click()
        await page_light.wait_for_timeout(300)
        
        theme_after_toggle_back = await page_light.evaluate("document.documentElement.dataset.theme")
        print("Theme after clicking SÁNG:", theme_after_toggle_back)
        assert theme_after_toggle_back == 'cartoon', f"Expected 'cartoon', got '{theme_after_toggle_back}'"
        
        await ctx_light.close()
        
        # Test 2: Fresh user with Dark system preference
        ctx_dark = await browser.new_context(color_scheme='dark', viewport={'width': 1440, 'height': 900})
        page_dark = await ctx_dark.new_page()
        await page_dark.goto("http://127.0.0.1:3000/#/")
        try:
            await page_dark.wait_for_selector('#loading-screen', state='hidden', timeout=7000)
        except:
            pass
        await page_dark.wait_for_selector('.dp-hero-cards', timeout=4000)
        
        theme_dark = await page_dark.evaluate("document.documentElement.dataset.theme")
        print("Default theme (Dark system):", theme_dark)
        assert theme_dark == 'cartoon-dark', f"Expected 'cartoon-dark', got '{theme_dark}'"
        
        await ctx_dark.close()
        await browser.close()
        print("ALL THEME CHECKS PASSED 100%!")

if __name__ == '__main__':
    asyncio.run(verify())

