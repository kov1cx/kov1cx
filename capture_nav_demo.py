import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1280, "height": 1150})
        
        await page.goto("http://127.0.0.1:3000/nav_highlight_demo.html", wait_until="networkidle")
        await page.wait_for_timeout(800)
        
        # Capture Light Mode Overview
        await page.screenshot(path=r"C:\Users\saoli\.gemini\antigravity\brain\5039a96a-55eb-4af2-bd47-45817b8fb661\nav_highlight_options_light.png", full_page=True)
        
        # Switch to Dark Mode
        await page.evaluate("document.documentElement.setAttribute('data-theme', 'dark')")
        await page.wait_for_timeout(500)
        await page.screenshot(path=r"C:\Users\saoli\.gemini\antigravity\brain\5039a96a-55eb-4af2-bd47-45817b8fb661\nav_highlight_options_dark.png", full_page=True)
        
        print("Captured nav highlight options successfully!")
        await browser.close()

asyncio.run(main())

