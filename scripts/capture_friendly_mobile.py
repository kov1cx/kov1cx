import asyncio
import os
from playwright.async_api import async_playwright
from PIL import Image

async def run():
    artifact_dir = os.path.abspath('C:/Users/saoli/.gemini/antigravity/brain/5039a96a-55eb-4af2-bd47-45817b8fb661')
    async with async_playwright() as p:
        b = await p.chromium.launch()
        page = await b.new_page(viewport={'width': 390, 'height': 844})
        await page.goto('http://127.0.0.1:3000/#/')
        try:
            await page.wait_for_selector('#loading-screen', state='hidden', timeout=7000)
        except:
            pass
        await page.wait_for_selector('#header', timeout=4000)
        await page.wait_for_timeout(1000)
        
        # 1. Dark Mobile
        await page.evaluate("window.applyTheme('cartoon-dark')")
        await page.wait_for_timeout(700)
        
        # First screen view
        await page.screenshot(path=os.path.join(artifact_dir, 'mobile_friendly_dark_first_screen.png'))
        
        # Nav ribbon close-up
        nav_el = await page.query_selector('.dp-nav')
        if nav_el:
            await nav_el.screenshot(path=os.path.join(artifact_dir, 'mobile_friendly_dark_nav_ribbon.png'))
            
        # Hero cards close-up
        cards_el = await page.query_selector('.dp-hero-cards')
        if cards_el:
            await cards_el.screenshot(path=os.path.join(artifact_dir, 'mobile_friendly_dark_cards.png'))
            
        # Full page dark
        path_full_dark = os.path.join(artifact_dir, 'mobile_friendly_dark_full.png')
        await page.screenshot(path=path_full_dark, full_page=True)
        
        # 2. Light Mobile
        await page.evaluate("window.applyTheme('cartoon')")
        await page.wait_for_timeout(700)
        
        # First screen view
        await page.screenshot(path=os.path.join(artifact_dir, 'mobile_friendly_light_first_screen.png'))
        
        # Nav ribbon close-up
        if nav_el:
            await nav_el.screenshot(path=os.path.join(artifact_dir, 'mobile_friendly_light_nav_ribbon.png'))
            
        # Full page light
        path_full_light = os.path.join(artifact_dir, 'mobile_friendly_light_full.png')
        await page.screenshot(path=path_full_light, full_page=True)
        
        await b.close()
        print('Captured mobile friendly screenshots successfully!')
        
        # Slice full dark for inspection
        img_dark = Image.open(path_full_dark)
        w, h = img_dark.size
        img_dark.crop((0, 0, w, min(h, 844))).save(os.path.join(artifact_dir, 'mf_dark_s1_hero.png'))
        img_dark.crop((0, 844, w, min(h, 1688))).save(os.path.join(artifact_dir, 'mf_dark_s2_project.png'))
        img_dark.crop((0, 1688, w, min(h, 2532))).save(os.path.join(artifact_dir, 'mf_dark_s3_tools.png'))
        print('Sliced successfully!')

if __name__ == '__main__':
    asyncio.run(run())

