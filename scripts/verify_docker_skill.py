import asyncio
import os
from playwright.async_api import async_playwright

async def verify_docker():
    artifacts_dir = 'C:/Users/saoli/.gemini/antigravity/brain/5039a96a-55eb-4af2-bd47-45817b8fb661'
    os.makedirs(artifacts_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1400, 'height': 900})
        page = await context.new_page()
        
        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
        
        # 1. Verify Home Page (VI)
        await page.goto('http://127.0.0.1:3000/#/')
        await page.wait_for_function("() => document.getElementById('loading-screen')?.hidden === true", timeout=15000)
        await page.wait_for_timeout(800)
        
        # Check Hero Skills Card
        hero_skills_card = page.locator('.dp-hero-card').nth(2)
        hero_skills_text = await hero_skills_card.inner_text()
        print("Hero Skills Card Text (VI):\n", hero_skills_text)
        assert "13 công cụ dữ liệu" in hero_skills_text, f"Expected '13 công cụ dữ liệu', got: {hero_skills_text}"
        
        # Capture Hero cards
        await page.locator('.dp-hero-cards').screenshot(path=f"{artifacts_dir}/verified_hero_cards_docker_light.png")
        print("Captured verified_hero_cards_docker_light.png")
        
        # Check Techstack on Home
        techstack_section = page.locator('#panel-home .dp-section--techstack')
        await techstack_section.scroll_into_view_if_needed()
        await page.wait_for_timeout(500)
        
        # Find Docker tile
        docker_tile = page.locator('#panel-home .dp-section--techstack .dp-techstack__tile').filter(has_text="Docker")
        docker_count = await docker_tile.count()
        print(f"Docker tile count on Home: {docker_count}")
        assert docker_count == 1, f"Expected 1 Docker tile, got {docker_count}"
        
        # Check total tiles count on home
        total_home_tiles = await page.locator('#panel-home .dp-section--techstack .dp-techstack__tile').count()
        print(f"Total tiles on Home: {total_home_tiles}")
        assert total_home_tiles == 13, f"Expected 13 tiles, got {total_home_tiles}"
        
        # Capture Techstack in Light Mode
        await techstack_section.screenshot(path=f"{artifacts_dir}/verified_techstack_with_docker_light.png")
        print("Captured verified_techstack_with_docker_light.png")
        
        # Switch to Dark Mode
        await page.evaluate("() => document.documentElement.setAttribute('data-theme', 'dark')")
        await page.wait_for_timeout(500)
        
        # Capture Techstack in Dark Mode
        await techstack_section.screenshot(path=f"{artifacts_dir}/verified_techstack_with_docker_dark.png")
        print("Captured verified_techstack_with_docker_dark.png")
        
        # Switch back to light
        await page.evaluate("() => document.documentElement.setAttribute('data-theme', 'light')")
        
        # 2. Check Skills Panel (#/ky-nang)
        await page.goto('http://127.0.0.1:3000/#/ky-nang')
        await page.wait_for_function("() => document.getElementById('loading-screen')?.hidden === true", timeout=15000)
        await page.wait_for_timeout(800)
        
        skills_docker = page.locator('#panel-skills .dp-techstack__tile').filter(has_text="Docker")
        skills_docker_count = await skills_docker.count()
        print(f"Docker tile count on #panel-skills: {skills_docker_count}")
        assert skills_docker_count == 1, f"Expected 1 Docker tile on #panel-skills, got {skills_docker_count}"
        
        skills_techstack = page.locator('#panel-skills .dp-section--techstack')
        await skills_techstack.screenshot(path=f"{artifacts_dir}/verified_panel_skills_docker_light.png")
        print("Captured verified_panel_skills_docker_light.png")
        
        # 3. Check French Language Support
        await page.goto('http://127.0.0.1:3000/?lang=fr#/')
        await page.wait_for_function("() => document.getElementById('loading-screen')?.hidden === true", timeout=15000)
        await page.wait_for_timeout(800)
        
        hero_skills_fr = await page.locator('.dp-hero-card').nth(2).inner_text()
        print("Hero Skills Card Text (FR):\n", hero_skills_fr)
        assert "13 outils de données" in hero_skills_fr, f"Expected '13 outils de données', got: {hero_skills_fr}"
        
        # Verify no console errors
        print(f"Console errors: {console_errors}")
        assert len(console_errors) == 0, f"Found console errors: {console_errors}"
        
        await browser.close()
        print("ALL DOCKER SKILL VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    asyncio.run(verify_docker())

