import asyncio
import os
import re
from playwright.async_api import async_playwright

async def verify_readme():
    artifacts_dir = 'C:/Users/saoli/.gemini/antigravity/brain/5039a96a-55eb-4af2-bd47-45817b8fb661'
    os.makedirs(artifacts_dir, exist_ok=True)
    
    with open('portfolio/README.md', 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    # Extract all img src
    img_urls = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', md_content)
    print(f"Total img tags in README: {len(img_urls)}")
    for u in img_urls:
        print("  -", u[:80])
    
    # Create a test HTML file that renders these images exactly like GitHub dark mode
    html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
body {{
  background-color: #0d1117;
  color: #c9d1d9;
  font-family: -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif;
  padding: 40px;
  max-width: 900px;
  margin: 0 auto;
}}
a {{ color: #58a6ff; text-decoration: none; }}
p {{ line-height: 1.5; }}
img {{ max-width: 100%; }}
</style>
</head>
<body>
{md_content}
</body>
</html>"""
    
    test_html_path = 'portfolio/test_readme_render.html'
    with open(test_html_path, 'w', encoding='utf-8') as f:
        f.write(html)
        
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1100, 'height': 1600})
        page = await context.new_page()
        
        failed_requests = []
        page.on('requestfailed', lambda req: failed_requests.append((req.url, req.failure)))
        
        # Load local test HTML
        await page.goto(f"file:///{os.path.abspath(test_html_path).replace(os.sep, '/')}")
        await page.wait_for_timeout(3000)
        
        # Check all images for naturalWidth > 0
        img_handles = await page.locator('img').element_handles()
        print(f"\nChecking {len(img_handles)} rendered images in browser:")
        broken_count = 0
        for i, img in enumerate(img_handles):
            src = await img.get_attribute('src') or ''
            alt = await img.get_attribute('alt') or ''
            nw = await img.evaluate('(el) => el.naturalWidth')
            nh = await img.evaluate('(el) => el.naturalHeight')
            if nw == 0 or nh == 0:
                print(f"  [BROKEN] {src[:80]} (alt={alt}) -> {nw}x{nh}")
                broken_count += 1
            else:
                print(f"  [OK] {src[:60]}... -> {nw}x{nh}")
                
        print(f"\nTotal broken images: {broken_count}")
        print(f"Failed network requests: {len(failed_requests)}")
        
        # Screenshot the Applied AI & Domain Logistics section
        await page.screenshot(path=f"{artifacts_dir}/verified_readme_rendered_dark.png", full_page=True)
        print("Saved verified_readme_rendered_dark.png")
        
        await browser.close()
        
        assert broken_count == 0, f"Found {broken_count} broken images!"
        print("ALL IMAGES RENDERED CLEANLY WITHOUT ANY BROKEN ICONS!")

if __name__ == '__main__':
    asyncio.run(verify_readme())

