import asyncio
import os
from playwright.async_api import async_playwright

async def run():
    artifact_dir = os.path.abspath('C:/Users/saoli/.gemini/antigravity/brain/5039a96a-55eb-4af2-bd47-45817b8fb661')
    os.makedirs(artifact_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await context.new_page()
        
        await page.goto("http://127.0.0.1:3000/#/")
        try:
            await page.wait_for_selector('#loading-screen', state='hidden', timeout=7000)
        except:
            pass
        await page.wait_for_selector('.dp-hero-cards', timeout=4000)
        
        # 1. Switch to cartoon-dark
        await page.evaluate("window.applyTheme('cartoon-dark')")
        await page.wait_for_timeout(500)
        
        # Capture the hero cards container specifically
        hero_cards = await page.query_selector('.dp-hero-cards')
        assert hero_cards is not None, "Hero cards not found!"
        
        hero_cards_crop = os.path.join(artifact_dir, "fixed_hero_cards_contrast_dark.png")
        await hero_cards.screenshot(path=hero_cards_crop)
        print("Captured hero cards in cartoon-dark:", hero_cards_crop)
        
        # Capture full home view in cartoon-dark
        home_dark = os.path.join(artifact_dir, "cartoon_dark_home_fixed.png")
        await page.screenshot(path=home_dark)
        print("Captured full home in cartoon-dark:", home_dark)

        # 2. Also capture hero cards in cartoon (light)
        await page.evaluate("window.applyTheme('cartoon')")
        await page.wait_for_timeout(500)
        hero_cards_light = os.path.join(artifact_dir, "fixed_hero_cards_contrast_light.png")
        await hero_cards.screenshot(path=hero_cards_light)
        print("Captured hero cards in cartoon-light:", hero_cards_light)

        # 3. Check CSS computed styles on text elements
        title_color = await page.evaluate("() => window.getComputedStyle(document.querySelector('.dp-hero-card__title')).color")
        summary_color = await page.evaluate("() => window.getComputedStyle(document.querySelector('.dp-hero-card__summary')).color")
        badge_color = await page.evaluate("() => window.getComputedStyle(document.querySelector('.dp-hero-card__badge')).color")
        print(f"Computed styles: title={title_color}, summary={summary_color}, badge={badge_color}")

        await browser.close()
        print("Verification completed successfully!")

if __name__ == '__main__':
    asyncio.run(run())

