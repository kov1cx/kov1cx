import asyncio
import os
from playwright.async_api import async_playwright

async def capture_all():
    artifact_dir = os.path.abspath('C:/Users/saoli/.gemini/antigravity/brain/5039a96a-55eb-4af2-bd47-45817b8fb661')
    os.makedirs(artifact_dir, exist_ok=True)
    
    themes = [
        {
            "id": "cartoon-dark",
            "name": "Pop-Art Cartoon Dark (Bubble Gum Comic Noir)",
            "home_file": "cartoon_dark_home.png",
            "certs_file": "cartoon_dark_certs.png"
        },
        {
            "id": "cartoon",
            "name": "Pop-Art Cartoon Light (Bubble Gum & Comic Sticker)",
            "home_file": "cartoon_light_home.png",
            "certs_file": "cartoon_light_certs.png"
        }
    ]
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await context.new_page()
        
        # Initial load to bypass preloader
        await page.goto("http://127.0.0.1:3000/#/")
        try:
            await page.wait_for_selector('#loading-screen', state='hidden', timeout=7000)
        except:
            pass
        await page.wait_for_selector('.dp-hero-cards', timeout=4000)
        
        for t in themes:
            print(f"Rendering & Capturing: {t['name']} ({t['id']})...")
            
            # 1. Capture Home view
            await page.goto("http://127.0.0.1:3000/#/")
            await page.wait_for_timeout(400)
            await page.evaluate(f"window.applyTheme('{t['id']}')")
            await page.wait_for_timeout(500)
            
            home_path = os.path.join(artifact_dir, t['home_file'])
            await page.screenshot(path=home_path)
            print(f"  -> Saved Home: {home_path}")
            
            # 2. Capture Certificates view
            await page.goto("http://127.0.0.1:3000/#/ky-nang#chung-chi")
            await page.wait_for_timeout(600)
            await page.evaluate(f"window.applyTheme('{t['id']}')")
            await page.wait_for_timeout(500)
            
            # Ensure certificates are rendered
            await page.wait_for_selector('.dp-cert-card', timeout=4000)
            certs_path = os.path.join(artifact_dir, t['certs_file'])
            await page.screenshot(path=certs_path)
            print(f"  -> Saved Certs: {certs_path}")
            
        await browser.close()
        print("All screenshots captured successfully!")

if __name__ == '__main__':
    asyncio.run(capture_all())

