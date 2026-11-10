import asyncio
import os
from playwright.async_api import async_playwright

async def run():
    artifact_dir = os.path.abspath('C:/Users/saoli/.gemini/antigravity/brain/5039a96a-55eb-4af2-bd47-45817b8fb661')
    async with async_playwright() as p:
        b = await p.chromium.launch()
        page = await b.new_page(viewport={'width': 1440, 'height': 900})
        await page.goto('http://127.0.0.1:3000/#/')
        try:
            await page.wait_for_selector('#loading-screen', state='hidden', timeout=7000)
        except:
            pass
        await page.wait_for_selector('#header', timeout=4000)
        await page.wait_for_timeout(1000)
        
        # Scroll to top
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(300)
        
        # Dark
        await page.evaluate("window.applyTheme('cartoon-dark')")
        await page.wait_for_timeout(600)
        await page.screenshot(path=os.path.join(artifact_dir, 'baloo2_hero_complete_dark.png'), clip={'x': 0, 'y': 0, 'width': 1440, 'height': 680})
        
        # Light
        await page.evaluate("window.applyTheme('cartoon')")
        await page.wait_for_timeout(600)
        await page.screenshot(path=os.path.join(artifact_dir, 'baloo2_hero_complete_light.png'), clip={'x': 0, 'y': 0, 'width': 1440, 'height': 680})
        
        await b.close()
        print('Captured hero complete successfully!')

if __name__ == '__main__':
    asyncio.run(run())

