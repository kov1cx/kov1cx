import asyncio
import os
from playwright.async_api import async_playwright

font_options = [
    {
        "id": "baloo2",
        "name": "Baloo 2 (Bubbly Comic Pop)",
        "google_import": "@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&display=swap');",
        "font_family": "'Baloo 2', cursive, sans-serif"
    },
    {
        "id": "comfortaa",
        "name": "Comfortaa (Smooth Bubble Gum)",
        "google_import": "@import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@600;700&display=swap');",
        "font_family": "'Comfortaa', cursive, sans-serif"
    },
    {
        "id": "itim",
        "name": "Itim (Casual Comic Manga)",
        "google_import": "@import url('https://fonts.googleapis.com/css2?family=Itim&display=swap');",
        "font_family": "'Itim', cursive, sans-serif"
    },
    {
        "id": "mali",
        "name": "Mali (Playful Cartoon Doodle)",
        "google_import": "@import url('https://fonts.googleapis.com/css2?family=Mali:wght@600;700&display=swap');",
        "font_family": "'Mali', cursive, sans-serif"
    }
]

async def test_fonts():
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
        
        # Check what navigation selector is present
        nav_selector = await page.evaluate("""() => {
            if (document.querySelector('nav')) return 'nav';
            if (document.querySelector('.dp-nav')) return '.dp-nav';
            if (document.querySelector('.dp-header__nav')) return '.dp-header__nav';
            if (document.querySelector('[role=\"navigation\"]')) return '[role=\"navigation\"]';
            return '#header';
        }""")
        print("Detected nav selector:", nav_selector)
        
        for opt in font_options:
            print(f"Testing Font: {opt['name']}...")
            await page.evaluate("window.applyTheme('cartoon')")
            
            # Apply font to nav, buttons, headings, cards
            css = f"""
            {opt['google_import']}
            
            [data-theme="cartoon"] {nav_selector},
            [data-theme="cartoon"] {nav_selector} a,
            [data-theme="cartoon"] {nav_selector} button,
            [data-theme="cartoon"] .dp-opening__title,
            [data-theme="cartoon"] .dp-btn,
            [data-theme="cartoon"] .dp-hero-card__title,
            [data-theme="cartoon"] .dp-project-featured__title,
            [data-theme="cartoon-dark"] {nav_selector},
            [data-theme="cartoon-dark"] {nav_selector} a,
            [data-theme="cartoon-dark"] {nav_selector} button,
            [data-theme="cartoon-dark"] .dp-opening__title,
            [data-theme="cartoon-dark"] .dp-btn,
            [data-theme="cartoon-dark"] .dp-hero-card__title,
            [data-theme="cartoon-dark"] .dp-project-featured__title {{
                font-family: {opt['font_family']} !important;
            }}
            """
            await page.add_style_tag(content=css)
            await page.wait_for_timeout(600)
            
            # 1. Capture Nav bar crop (matching user's image)
            nav_el = await page.query_selector(nav_selector)
            path_nav_light = os.path.join(artifact_dir, f"font_{opt['id']}_nav_light.png")
            await nav_el.screenshot(path=path_nav_light)
            
            # 2. Switch to Dark
            await page.evaluate("window.applyTheme('cartoon-dark')")
            await page.wait_for_timeout(400)
            path_nav_dark = os.path.join(artifact_dir, f"font_{opt['id']}_nav_dark.png")
            await nav_el.screenshot(path=path_nav_dark)
            
            # 3. Capture Hero area
            header_hero_crop = os.path.join(artifact_dir, f"font_{opt['id']}_hero_preview.png")
            # crop the top 450px
            await page.screenshot(path=header_hero_crop, clip={'x': 0, 'y': 0, 'width': 1440, 'height': 520})
            print(f"  -> Saved {opt['id']} captures.")
            
        await browser.close()
        print("All font tests finished successfully!")

if __name__ == '__main__':
    asyncio.run(test_fonts())
