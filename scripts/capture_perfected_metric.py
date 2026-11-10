import asyncio
import os
from playwright.async_api import async_playwright

async def main():
    artifact_dir = os.path.abspath('C:/Users/saoli/.gemini/antigravity/brain/5039a96a-55eb-4af2-bd47-45817b8fb661')
    os.makedirs(artifact_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        
        # 1. Desktop Dark View
        p_dt = await browser.new_page(viewport={'width': 1440, 'height': 900})
        await p_dt.goto('http://127.0.0.1:3000/#/')
        try:
            await p_dt.wait_for_selector('#loading-screen', state='hidden', timeout=7000)
        except:
            pass
        await p_dt.evaluate("window.applyTheme('cartoon-dark')")
        await p_dt.wait_for_timeout(500)
        
        proj_dt = await p_dt.query_selector('.dp-project-featured--home')
        assert proj_dt is not None, "Featured project not found on Desktop!"
        
        # Full Card in Dark Mode
        path_card_dark = os.path.join(artifact_dir, "perfected_featured_project_card_dark.png")
        await proj_dt.screenshot(path=path_card_dark)
        print("Captured Desktop Dark Card:", path_card_dark)
        
        # Close-up of Title + Metric Box (Matching User's Crop)
        metric_box = await p_dt.query_selector('.dp-project-featured__metric')
        path_metric_dark = os.path.join(artifact_dir, "perfected_metric_box_dark.png")
        await metric_box.screenshot(path=path_metric_dark)
        print("Captured Metric Box Dark:", path_metric_dark)
        
        # 2. Desktop Light View
        await p_dt.evaluate("window.applyTheme('cartoon')")
        await p_dt.wait_for_timeout(500)
        path_card_light = os.path.join(artifact_dir, "perfected_featured_project_card_light.png")
        await proj_dt.screenshot(path=path_card_light)
        print("Captured Desktop Light Card:", path_card_light)
        
        # 3. Mobile View (390px)
        p_mob = await browser.new_page(viewport={'width': 390, 'height': 844})
        await p_mob.goto('http://127.0.0.1:3000/#/')
        try:
            await p_mob.wait_for_selector('#loading-screen', state='hidden', timeout=7000)
        except:
            pass
        await p_mob.evaluate("window.applyTheme('cartoon-dark')")
        await p_mob.wait_for_timeout(500)
        proj_mob = await p_mob.query_selector('.dp-project-featured--home')
        path_card_mob = os.path.join(artifact_dir, "perfected_featured_project_mobile.png")
        await proj_mob.screenshot(path=path_card_mob)
        print("Captured Mobile Card:", path_card_mob)

        await browser.close()
        print("All perfected screenshots captured successfully!")

if __name__ == '__main__':
    asyncio.run(main())

