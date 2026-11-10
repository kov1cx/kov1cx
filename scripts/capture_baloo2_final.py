import asyncio
import os
from playwright.async_api import async_playwright

async def capture_baloo2():
    artifact_dir = os.path.abspath('C:/Users/saoli/.gemini/antigravity/brain/5039a96a-55eb-4af2-bd47-45817b8fb661')
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1440, 'height': 900})
        
        await page.goto("http://127.0.0.1:3000/#/")
        try:
            await page.wait_for_selector('#loading-screen', state='hidden', timeout=7000)
        except:
            pass
        await page.wait_for_selector('#header', timeout=4000)
        await page.wait_for_timeout(1000)
        
        # 1. Dark Mode captures
        await page.evaluate("window.applyTheme('cartoon-dark')")
        await page.wait_for_timeout(800)
        
        # Nav Dark
        nav_el = await page.query_selector('nav')
        if nav_el:
            await nav_el.screenshot(path=os.path.join(artifact_dir, "baloo2_final_nav_dark.png"))
            
        # 4 Hero Cards Dark
        cards_el = await page.query_selector('.dp-hero-cards')
        if cards_el:
            await cards_el.screenshot(path=os.path.join(artifact_dir, "baloo2_final_hero_cards_dark.png"))
            
        # Metric 64.3% Box Dark
        metric_el = await page.query_selector('.dp-project-featured--home .dp-project-featured__metric')
        if metric_el:
            await metric_el.screenshot(path=os.path.join(artifact_dir, "baloo2_final_metric_box_dark.png"))
            
        # Full Featured Project Card Dark
        project_el = await page.query_selector('.dp-project-featured--home')
        if project_el:
            await project_el.screenshot(path=os.path.join(artifact_dir, "baloo2_final_project_card_dark.png"))
            
        # Top Hero & Header Overview Dark
        await page.screenshot(
            path=os.path.join(artifact_dir, "baloo2_final_home_overview_dark.png"),
            clip={'x': 0, 'y': 0, 'width': 1440, 'height': 520}
        )
        
        # 2. Light Mode captures
        await page.evaluate("window.applyTheme('cartoon')")
        await page.wait_for_timeout(800)
        
        # Nav Light
        if nav_el:
            await nav_el.screenshot(path=os.path.join(artifact_dir, "baloo2_final_nav_light.png"))
            
        # 4 Hero Cards Light
        if cards_el:
            await cards_el.screenshot(path=os.path.join(artifact_dir, "baloo2_final_hero_cards_light.png"))
            
        # Metric 64.3% Box Light
        if metric_el:
            await metric_el.screenshot(path=os.path.join(artifact_dir, "baloo2_final_metric_box_light.png"))
            
        # Full Featured Project Card Light
        if project_el:
            await project_el.screenshot(path=os.path.join(artifact_dir, "baloo2_final_project_card_light.png"))
            
        # Top Hero & Header Overview Light
        await page.screenshot(
            path=os.path.join(artifact_dir, "baloo2_final_home_overview_light.png"),
            clip={'x': 0, 'y': 0, 'width': 1440, 'height': 520}
        )
        
        await browser.close()
        print("Captured all Baloo 2 final verification screenshots successfully!")

if __name__ == "__main__":
    asyncio.run(capture_baloo2())

