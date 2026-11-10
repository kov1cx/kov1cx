import asyncio
import os
from playwright.async_api import async_playwright

async def verify():
    artifacts_dir = 'C:/Users/saoli/.gemini/antigravity/brain/5039a96a-55eb-4af2-bd47-45817b8fb661'
    os.makedirs(artifacts_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1400, 'height': 900})
        page = await context.new_page()
        
        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
        
        # 1. Verify Home Page hero card count
        await page.goto('http://127.0.0.1:3000/#/')
        await page.wait_for_function("() => document.getElementById('loading-screen')?.hidden === true", timeout=15000)
        await page.wait_for_timeout(1000)
        
        hero_cert_card = await page.locator('.dp-hero-card').nth(3).inner_text()
        print("Hero card text:\n", hero_cert_card)
        assert "14" in hero_cert_card, f"Expected 14 in hero card, got: {hero_cert_card}"
        
        await page.locator('.dp-hero-card').nth(3).screenshot(path=f"{artifacts_dir}/verified_hero_cert_card.png")
        print("Captured verified_hero_cert_card.png")
        
        # 2. Navigate to Skills & Certs
        await page.goto('http://127.0.0.1:3000/#/ky-nang')
        await page.wait_for_function("() => document.getElementById('loading-screen')?.hidden === true", timeout=15000)
        await page.wait_for_timeout(1000)
        
        # Scroll to #chung-chi
        cert_section = page.locator('#chung-chi')
        await cert_section.scroll_into_view_if_needed()
        await page.wait_for_timeout(500)
        
        # Verify 6 featured cert cards
        cert_cards = page.locator('.dp-cert-cards-grid .dp-cert-card')
        count = await cert_cards.count()
        print(f"Featured cert cards count: {count}")
        assert count == 6, f"Expected 6 featured cert cards, found {count}"
        
        titles = []
        for i in range(count):
            t = await cert_cards.nth(i).locator('.dp-cert-card__title').inner_text()
            titles.append(t)
        print("Featured cert titles:", titles)
        assert "AI Fundamentals" in titles, "AI Fundamentals not found in featured titles!"
        
        # Screenshot the featured grid
        await page.locator('.dp-cert-cards-grid').screenshot(path=f"{artifacts_dir}/verified_featured_certs_grid_light.png")
        print("Captured verified_featured_certs_grid_light.png")
        
        # Find AI Fundamentals card and click media thumbnail to open lightbox
        ai_card = page.locator('#cert-card-cert-datacamp-ai-fundamentals')
        await ai_card.scroll_into_view_if_needed()
        await page.wait_for_timeout(500)
        
        await ai_card.screenshot(path=f"{artifacts_dir}/verified_ai_cert_card_light.png")
        print("Captured verified_ai_cert_card_light.png")
        
        # Click media thumbnail
        media_wrap = ai_card.locator('.dp-cert-card__media')
        await media_wrap.click()
        await page.wait_for_selector('#dp-cert-modal', timeout=5000)
        await page.wait_for_timeout(500)
        
        modal = page.locator('#dp-cert-modal')
        modal_title = await modal.locator('.dp-cert-modal__title').inner_text()
        print(f"Modal opened successfully: {modal_title}")
        assert "AI Fundamentals" in modal_title
        
        # Verify PDF link in modal
        pdf_link = modal.locator('a[href*="AIFundamentals"]')
        pdf_href = await pdf_link.get_attribute('href')
        print(f"Modal PDF href: {pdf_href}")
        assert "AIFundamentals Certificate.pdf" in pdf_href
        
        await page.screenshot(path=f"{artifacts_dir}/verified_ai_cert_modal_light.png")
        print("Captured verified_ai_cert_modal_light.png")
        
        # Close modal
        close_btn = modal.locator('.dp-cert-modal__close')
        await close_btn.click()
        await page.wait_for_timeout(500)
        
        # Switch to dark mode
        theme_dark_btn = page.locator('.dp-control-btn--theme[data-theme-val="dark"]')
        await theme_dark_btn.click()
        await page.wait_for_timeout(500)
        
        await page.locator('.dp-cert-cards-grid').screenshot(path=f"{artifacts_dir}/verified_featured_certs_grid_dark.png")
        print("Captured verified_featured_certs_grid_dark.png")
        
        # Re-open modal in dark mode
        await media_wrap.click()
        await page.wait_for_selector('#dp-cert-modal', timeout=5000)
        await page.wait_for_timeout(500)
        await page.screenshot(path=f"{artifacts_dir}/verified_ai_cert_modal_dark.png")
        print("Captured verified_ai_cert_modal_dark.png")
        
        print("\nConsole errors:", console_errors)
        assert len(console_errors) == 0, f"Found console errors: {console_errors}"
        
        await browser.close()
        print("\n=== ALL VERIFICATION CHECKS PASSED! ===")

if __name__ == '__main__':
    asyncio.run(verify())
