import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        
        await page.goto("http://127.0.0.1:3000/#/", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        
        # 1. Capture Hero Section (Light)
        hero = await page.query_selector(".dp-opening")
        if hero:
            await hero.screenshot(path=r"C:\Users\saoli\.gemini\antigravity\brain\5039a96a-55eb-4af2-bd47-45817b8fb661\verified_brutalist_hero_light.png")
            
        # 2. Capture Header with new Tactile controls (Light)
        header = await page.query_selector(".dp-header")
        if header:
            await header.screenshot(path=r"C:\Users\saoli\.gemini\antigravity\brain\5039a96a-55eb-4af2-bd47-45817b8fb661\verified_brutalist_header_light.png")
            
        # 3. Capture Featured Project actions (Light)
        featured = await page.query_selector(".dp-project-featured--home")
        if featured:
            await featured.screenshot(path=r"C:\Users\saoli\.gemini\antigravity\brain\5039a96a-55eb-4af2-bd47-45817b8fb661\verified_brutalist_featured_light.png")
            
        # 4. Navigate to Projects tab to check Filter Bar
        await page.goto("http://127.0.0.1:3000/#/du-an", wait_until="networkidle")
        await page.wait_for_timeout(800)
        filters = await page.query_selector(".dp-filter-bar")
        if filters:
            await filters.screenshot(path=r"C:\Users\saoli\.gemini\antigravity\brain\5039a96a-55eb-4af2-bd47-45817b8fb661\verified_brutalist_filters_light.png")
            
        # 5. Navigate to Contact tab to check Form Submit
        await page.goto("http://127.0.0.1:3000/#/lien-he", wait_until="networkidle")
        await page.wait_for_timeout(800)
        contact_card = await page.query_selector(".dp-contact-form-wrap, .dp-contact-card, .dp-section")
        if contact_card:
            await contact_card.screenshot(path=r"C:\Users\saoli\.gemini\antigravity\brain\5039a96a-55eb-4af2-bd47-45817b8fb661\verified_brutalist_contact_light.png")
            
        # 6. Switch to DARK MODE and capture Hero & Filter
        await page.goto("http://127.0.0.1:3000/#/", wait_until="networkidle")
        await page.wait_for_timeout(600)
        dark_btn = await page.query_selector(".dp-theme-segmented__btn[data-theme-val='dark']")
        if dark_btn:
            await dark_btn.click()
            await page.wait_for_timeout(500)
        else:
            await page.evaluate("document.documentElement.setAttribute('data-theme', 'dark')")
            
        hero = await page.query_selector(".dp-opening")
        if hero:
            await hero.screenshot(path=r"C:\Users\saoli\.gemini\antigravity\brain\5039a96a-55eb-4af2-bd47-45817b8fb661\verified_brutalist_hero_dark.png")
            
        header = await page.query_selector(".dp-header")
        if header:
            await header.screenshot(path=r"C:\Users\saoli\.gemini\antigravity\brain\5039a96a-55eb-4af2-bd47-45817b8fb661\verified_brutalist_header_dark.png")

        print("Console errors:", console_errors)
        await browser.close()

asyncio.run(main())

