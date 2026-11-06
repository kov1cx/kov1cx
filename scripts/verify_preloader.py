import asyncio
import os
import time
from playwright.async_api import async_playwright

async def verify_loader():
    artifacts_dir = 'C:/Users/saoli/.gemini/antigravity/brain/5039a96a-55eb-4af2-bd47-45817b8fb661'
    os.makedirs(artifacts_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1200, 'height': 800})
        page = await context.new_page()
        
        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
        
        t0 = time.time()
        await page.goto('http://127.0.0.1:3000/#/')
        
        # At 1.2s: check percent and take screenshot
        await page.wait_for_timeout(1200)
        pct_1200 = await page.locator('#loading-percent').inner_text()
        is_visible_1200 = await page.evaluate("() => !document.getElementById('loading-screen').hidden")
        print(f"At 1.2s: percent = {pct_1200}, visible = {is_visible_1200}")
        assert is_visible_1200, "Loading screen should be visible at 1.2s!"
        
        # Screenshot loading screen
        await page.screenshot(path=f"{artifacts_dir}/verified_preloader_active_dark.png")
        print("Captured verified_preloader_active_dark.png")
        
        # At 2.2s: check percent
        await page.wait_for_timeout(1000)
        pct_2200 = await page.locator('#loading-percent').inner_text()
        print(f"At 2.2s: percent = {pct_2200}")
        
        # Wait for loading screen to be dismissed (around 3.2s)
        await page.wait_for_function("() => document.getElementById('loading-screen')?.hidden === true", timeout=8000)
        total_duration = time.time() - t0
        print(f"Total time until dismissed: {total_duration:.2f}s")
        assert 2.8 <= total_duration <= 4.5, f"Expected around 3s, got {total_duration:.2f}s"
        
        # Check main content is visible
        main_visible = await page.locator('#main').is_visible()
        assert main_visible, "Main content should be visible after loader is dismissed!"
        
        print(f"Console errors: {console_errors}")
        assert len(console_errors) == 0, f"Found console errors: {console_errors}"
        
        await browser.close()
        print("PRELOADER 3-SECOND RESTORATION VERIFIED SUCCESSFULLY!")

if __name__ == '__main__':
    asyncio.run(verify_loader())

