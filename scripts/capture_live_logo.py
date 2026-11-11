import asyncio
import os
from playwright.async_api import async_playwright

async def run():
    artifact_dir = os.path.abspath('C:/Users/saoli/.gemini/antigravity/brain/5039a96a-55eb-4af2-bd47-45817b8fb661')
    async with async_playwright() as p:
        b = await p.chromium.launch()
        
        # 1. Desktop captures
        page_desk = await b.new_page(viewport={'width': 1280, 'height': 800})
        await page_desk.goto('http://127.0.0.1:3000/#/')
        try:
            await page_desk.wait_for_selector('#loading-screen', state='hidden', timeout=8000)
        except:
            pass
        await page_desk.wait_for_selector('#header', timeout=5000)
        await page_desk.wait_for_timeout(1000)
        
        # Desktop Light
        await page_desk.evaluate("window.applyTheme('cartoon')")
        await page_desk.wait_for_timeout(600)
        await page_desk.screenshot(
            path=os.path.join(artifact_dir, 'live_site_logo_desktop_light.png'),
            clip={'x': 0, 'y': 0, 'width': 1280, 'height': 480}
        )
        
        # Desktop Dark
        await page_desk.evaluate("window.applyTheme('cartoon-dark')")
        await page_desk.wait_for_timeout(600)
        await page_desk.screenshot(
            path=os.path.join(artifact_dir, 'live_site_logo_desktop_dark.png'),
            clip={'x': 0, 'y': 0, 'width': 1280, 'height': 480}
        )
        await page_desk.close()
        
        # 2. Mobile captures (390px)
        page_mob = await b.new_page(viewport={'width': 390, 'height': 844})
        await page_mob.goto('http://127.0.0.1:3000/#/')
        try:
            await page_mob.wait_for_selector('#loading-screen', state='hidden', timeout=8000)
        except:
            pass
        await page_mob.wait_for_selector('#header', timeout=5000)
        await page_mob.wait_for_timeout(1000)
        
        # Mobile Light
        await page_mob.evaluate("window.applyTheme('cartoon')")
        await page_mob.wait_for_timeout(600)
        await page_mob.screenshot(
            path=os.path.join(artifact_dir, 'live_site_logo_mobile_light.png'),
            clip={'x': 0, 'y': 0, 'width': 390, 'height': 450}
        )
        
        # Mobile Dark
        await page_mob.evaluate("window.applyTheme('cartoon-dark')")
        await page_mob.wait_for_timeout(600)
        await page_mob.screenshot(
            path=os.path.join(artifact_dir, 'live_site_logo_mobile_dark.png'),
            clip={'x': 0, 'y': 0, 'width': 390, 'height': 450}
        )
        await page_mob.close()
        
        await b.close()
        print('Captured all live site logo screenshots successfully!')

asyncio.run(run())

