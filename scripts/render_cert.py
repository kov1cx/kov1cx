import asyncio
import base64
import os
from PIL import Image
from playwright.async_api import async_playwright

async def render_pdf():
    pdf_path = os.path.abspath('portfolio/certificate/AIFundamentals Certificate.pdf')
    with open(pdf_path, 'rb') as f:
        pdf_b64 = base64.b64encode(f.read()).decode('utf-8')

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
</head>
<body style="margin: 0; padding: 0; background: #ffffff;">
  <canvas id="pdf-canvas"></canvas>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdfData = atob("{pdf_b64}");
    const loadingTask = pdfjsLib.getDocument({{ data: pdfData }});
    loadingTask.promise.then(async function(pdf) {{
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({{ scale: 3.0 }});
      const canvas = document.getElementById('pdf-canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({{ canvasContext: context, viewport: viewport }}).promise;
      window.pdfRenderDone = true;
    }}).catch(err => {{
      window.pdfRenderError = err.toString();
    }});
  </script>
</body>
</html>"""

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 2400, 'height': 1600})
        await page.set_content(html_content)
        await page.wait_for_function('() => window.pdfRenderDone || window.pdfRenderError', timeout=20000)
        
        err = await page.evaluate('() => window.pdfRenderError')
        if err:
            print("Render Error:", err)
            await browser.close()
            return False
            
        canvas = page.locator('#pdf-canvas')
        temp_png = 'portfolio/assets/img/certificates/temp_ai_cert.png'
        await canvas.screenshot(path=temp_png)
        await browser.close()
        
        # Now use PIL to resize and convert to webp
        img = Image.open(temp_png)
        print(f"Original rendered canvas size: {img.size}")
        
        # Target sizes:
        # Full: 1200 x 692 (or maintain ratio)
        # Let's check aspect ratio
        ratio = img.width / img.height
        print(f"Aspect ratio: {ratio:.4f}")
        
        # Full image: width 1200, height = round(1200 / ratio)
        full_w = 1200
        full_h = round(full_w / ratio)
        full_img = img.resize((full_w, full_h), Image.Resampling.LANCZOS)
        full_path = 'portfolio/assets/img/certificates/cert-datacamp-ai-fundamentals.webp'
        full_img.save(full_path, 'WEBP', quality=92)
        print(f"Saved full image: {full_path} ({full_w}x{full_h})")
        
        # Thumb image: width 480, height = round(480 / ratio)
        thumb_w = 480
        thumb_h = round(thumb_w / ratio)
        thumb_img = img.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        thumb_path = 'portfolio/assets/img/certificates/cert-datacamp-ai-fundamentals-thumb.webp'
        thumb_img.save(thumb_path, 'WEBP', quality=88)
        print(f"Saved thumb image: {thumb_path} ({thumb_w}x{thumb_h})")
        
        # Clean up temp
        if os.path.exists(temp_png):
            os.remove(temp_png)
            
        return True

if __name__ == '__main__':
    asyncio.run(render_pdf())

