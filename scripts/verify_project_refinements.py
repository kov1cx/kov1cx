import asyncio
import os
from playwright.async_api import async_playwright

async def verify_refinements():
    artifacts_dir = 'C:/Users/saoli/.gemini/antigravity/brain/5039a96a-55eb-4af2-bd47-45817b8fb661'
    os.makedirs(artifacts_dir, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1400, 'height': 950})
        page = await context.new_page()
        
        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
        
        # 1. Verify Home Page (VI)
        await page.goto('http://127.0.0.1:3000/#/')
        await page.wait_for_function("() => document.getElementById('loading-screen')?.hidden === true", timeout=15000)
        await page.wait_for_timeout(800)
        
        # Check Project Section on Home
        proj_sec = page.locator('#panel-home .dp-project-featured--home')
        await proj_sec.scroll_into_view_if_needed()
        await page.wait_for_timeout(500)
        
        # Verify Metric on Home
        metric_val = await proj_sec.locator('.dp-metric__value').inner_text()
        metric_lbl = await proj_sec.locator('.dp-metric__label').inner_text()
        print(f"Home Project Metric: {metric_val}")
        print(f"Home Project Label: {metric_lbl}")
        assert "64.3%" in metric_val, f"Expected 64.3%, got: {metric_val}"
        assert "Kaggle" not in metric_lbl, f"Label still has Kaggle: {metric_lbl}"
        assert "chủ lực" in metric_lbl, f"Label missing 'chủ lực': {metric_lbl}"
        
        # Screenshot Home Project in Light Mode
        await proj_sec.screenshot(path=f"{artifacts_dir}/verified_project_refined_home_light.png")
        print("Captured verified_project_refined_home_light.png")
        
        # Switch to Dark Mode
        await page.evaluate("() => document.documentElement.setAttribute('data-theme', 'dark')")
        await page.wait_for_timeout(500)
        await proj_sec.screenshot(path=f"{artifacts_dir}/verified_project_refined_home_dark.png")
        print("Captured verified_project_refined_home_dark.png")
        await page.evaluate("() => document.documentElement.setAttribute('data-theme', 'light')")
        
        # 2. Check Project Detail Page
        await page.goto('http://127.0.0.1:3000/#/du-an/analyzing-motorcycle-part-sales-sql')
        await page.wait_for_function("() => document.getElementById('loading-screen')?.hidden === true", timeout=15000)
        await page.wait_for_timeout(800)
        
        # Verify Context Text
        detail_container = page.locator('#project-detail-view')
        context_text = await detail_container.locator('.dp-lead-text').first.inner_text()
        print(f"Detail Context Text: {context_text[:120]}...")
        assert "giả định" in context_text or "công khai" in context_text, "Context missing benchmark/public note!"
        
        # Check Chart Figure
        chart_figure = detail_container.locator('.dp-figure')
        await chart_figure.scroll_into_view_if_needed()
        await page.wait_for_timeout(500)
        caption_text = await chart_figure.locator('.dp-figure__caption').inner_text()
        print(f"Figure Caption: {caption_text}")
        assert "làm tròn" in caption_text, f"Caption missing rounding note: {caption_text}"
        
        # Screenshot Project Detail overview & chart
        await detail_container.locator('article').first.screenshot(path=f"{artifacts_dir}/verified_project_detail_top_light.png")
        print("Captured verified_project_detail_top_light.png")
        
        # 3. Check French Language Support
        await page.goto('http://127.0.0.1:3000/?lang=fr#/projets/analyzing-motorcycle-part-sales-sql')
        await page.wait_for_function("() => document.getElementById('loading-screen')?.hidden === true", timeout=15000)
        await page.wait_for_timeout(800)
        
        fr_detail = page.locator('#project-detail-view')
        fr_metric_lbl = await fr_detail.locator('.dp-metric__label').first.inner_text()
        print(f"FR Metric Label: {fr_metric_lbl}")
        assert "Top 3" in fr_metric_lbl, f"FR label issue: {fr_metric_lbl}"
        
        fr_context = await fr_detail.locator('.dp-lead-text').first.inner_text()
        print(f"FR Context Text: {fr_context[:100]}...")
        assert "simulé" in fr_context or "public" in fr_context, "FR context missing simulated/public note!"
        
        print(f"Console errors: {console_errors}")
        assert len(console_errors) == 0, f"Found console errors: {console_errors}"
        
        await browser.close()
        print("ALL REFINEMENTS VERIFIED SUCCESSFULLY!")

if __name__ == '__main__':
    asyncio.run(verify_refinements())

