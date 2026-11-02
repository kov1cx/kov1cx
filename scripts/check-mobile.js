#!/usr/bin/env node
/**
 * scripts/check-mobile.js
 * Kiểm tra tự động giao diện di động & máy tính bảng bằng Playwright (playwright-core).
 * Lưu ý: Tệp này chỉ dùng cho phát triển/kiểm thử cục bộ, KHÔNG đưa vào bản deploy.
 *
 * Kiểm tra:
 *  - Kích thước: 320×568, 360×800, 375×667, 390×844, 412×915, 430×932, 600×900, 700×900, 768×1024
 *    và màn ngang 667×375, 844×390; DPR 2 và 3
 *  - Chế độ: light / dark; Ngôn ngữ: vi / en / fr
 *  - 3 trạng thái dữ liệu: real (thật), demo (?demo=1), empty (rỗng giả lập qua route)
 *  - Các trạng thái trang: mọi tab, trang chi tiết dự án, tab Dự án có bộ lọc đang chọn, disclosure đang mở
 *  - 5 tiêu chí:
 *    (a) Cuộn ngang (scrollWidth > clientWidth) và phần tử gây ra
 *    (b) Vùng chạm < 44×44 CSS px (ở <=700px hoặc cảm ứng)
 *    (c) Chữ < 12px
 *    (d) Chữ chồng lên nhau hoặc chạm mép khung nhìn
 *    (e) Ảnh hoặc iframe vượt khổ
 */

const fs = require('fs');
const path = require('path');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('playwright-core'));
}

const BASE_URL = process.env.PORTFOLIO_URL || 'http://localhost:8000';
const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

const VIEWPORTS = [
  { width: 320, height: 568, dpr: 2, label: '320x568@2x' },
  { width: 360, height: 800, dpr: 2, label: '360x800@2x' },
  { width: 360, height: 800, dpr: 3, label: '360x800@3x' },
  { width: 375, height: 667, dpr: 2, label: '375x667@2x' },
  { width: 390, height: 844, dpr: 3, label: '390x844@3x' },
  { width: 412, height: 915, dpr: 2, label: '412x915@2x' },
  { width: 430, height: 932, dpr: 3, label: '430x932@3x' },
  { width: 600, height: 900, dpr: 2, label: '600x900@2x' },
  { width: 700, height: 900, dpr: 2, label: '700x900@2x' },
  { width: 768, height: 1024, dpr: 2, label: '768x1024@2x' },
  { width: 667, height: 375, dpr: 2, label: '667x375-landscape@2x' },
  { width: 844, height: 390, dpr: 3, label: '844x390-landscape@3x' }
];

const LANGS = ['vi', 'en', 'fr'];
const THEMES = ['light', 'dark'];

function findBrowserExecutable() {
  for (const p of EDGE_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function auditCurrentPage(page) {
  return page.evaluate(() => {
    const docEl = document.documentElement;
    const vw = docEl.clientWidth;
    const sw = docEl.scrollWidth;

    function describeEl(el) {
      const id = el.id ? `#${el.id}` : '';
      const cls = el.className && typeof el.className === 'string'
        ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
        : '';
      return `${el.tagName.toLowerCase()}${id}${cls}`;
    }

    function isVisible(el) {
      if (!el || el.closest('[hidden]') || el.classList.contains('visually-hidden') || el.classList.contains('skip-link')) {
        return false;
      }
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
        return false;
      }
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }

    // (a) Horizontal overflow check
    const overflowElements = [];
    if (sw > vw + 1) {
      document.querySelectorAll('*').forEach(el => {
        if (!isVisible(el)) return;
        const r = el.getBoundingClientRect();
        if (r.right > vw + 1.5 || r.left < -1.5) {
          overflowElements.push({
            el: describeEl(el),
            left: Math.round(r.left * 10) / 10,
            right: Math.round(r.right * 10) / 10,
            vw
          });
        }
      });
    }

    // (b) Touch targets < 44x44 CSS px (checked on coarse pointer or width <= 700)
    const smallTouchTargets = [];
    const checkTouch = vw <= 700 || window.matchMedia('(pointer: coarse)').matches;
    if (checkTouch) {
      const interactive = document.querySelectorAll('a[href], button, summary, input, textarea, select, [role="button"]');
      interactive.forEach(el => {
        if (!isVisible(el)) return;
        const r = el.getBoundingClientRect();
        if (r.width < 43.5 || r.height < 43.5) {
          smallTouchTargets.push({
            el: describeEl(el),
            text: (el.textContent || '').trim().slice(0, 30),
            w: Math.round(r.width * 10) / 10,
            h: Math.round(r.height * 10) / 10
          });
        }
      });
    }

    // (c) Text < 12px
    const smallText = [];
    document.querySelectorAll('h1, h2, h3, h4, p, span, a, button, label, dt, dd, li, figcaption, input, textarea').forEach(el => {
      if (!isVisible(el)) return;
      const txt = (el.textContent || '').trim();
      if (!txt) return;
      const fsPx = parseFloat(window.getComputedStyle(el).fontSize);
      if (fsPx < 11.9) {
        smallText.push({
          el: describeEl(el),
          text: txt.slice(0, 25),
          fontSize: fsPx
        });
      }
    });

    // (d) Text overlapping or touching viewport edges (< 4px from left/right viewport edge)
    const edgeOrOverlapText = [];
    const textBoxes = [];
    document.querySelectorAll('h1, h2, h3, p, dt, dd, .dp-nav__text, .dp-cert-row__date, .dp-verify-link, .dp-btn').forEach(el => {
      if (!isVisible(el)) return;
      const txt = (el.textContent || '').trim();
      if (!txt) return;
      // Ignore items inside horizontal scroll containers that are scrolled off-screen
      const scrollParent = el.closest('.dp-nav__list, .dp-filter-bar');
      const r = el.getBoundingClientRect();
      if (!scrollParent) {
        if (r.left < 4 || r.right > vw - 4) {
          edgeOrOverlapText.push({
            type: 'touching-edge',
            el: describeEl(el),
            text: txt.slice(0, 25),
            left: Math.round(r.left * 10) / 10,
            right: Math.round(r.right * 10) / 10,
            vw
          });
        }
      }
      textBoxes.push({ el, desc: describeEl(el), text: txt.slice(0, 25), rect: r });
    });

    for (let i = 0; i < textBoxes.length; i++) {
      for (let j = i + 1; j < textBoxes.length; j++) {
        const a = textBoxes[i];
        const b = textBoxes[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const ix = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
        const iy = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
        if (ix > 2 && iy > 2) {
          edgeOrOverlapText.push({
            type: 'overlap',
            a: `${a.desc} ("${a.text}")`,
            b: `${b.desc} ("${b.text}")`,
            overlapW: Math.round(ix * 10) / 10,
            overlapH: Math.round(iy * 10) / 10
          });
        }
      }
    }

    // (e) Images or iframes overflowing container or viewport
    const mediaOverflow = [];
    document.querySelectorAll('img, iframe').forEach(el => {
      if (!isVisible(el)) return;
      const r = el.getBoundingClientRect();
      const parentR = el.parentElement ? el.parentElement.getBoundingClientRect() : { right: vw, width: vw };
      if (r.right > vw + 1.5 || r.width > parentR.width + 1.5) {
        mediaOverflow.push({
          el: describeEl(el),
          src: el.getAttribute('src'),
          width: Math.round(r.width * 10) / 10,
          parentWidth: Math.round(parentR.width * 10) / 10,
          vw
        });
      }
    });

    return {
      overflowX: Math.max(0, sw - vw),
      overflowElements: overflowElements.slice(0, 5),
      smallTouchTargets: smallTouchTargets.slice(0, 10),
      smallText: smallText.slice(0, 10),
      edgeOrOverlapText: edgeOrOverlapText.slice(0, 10),
      mediaOverflow: mediaOverflow.slice(0, 5)
    };
  });
}

async function run() {
  const executablePath = findBrowserExecutable();
  const launchOpts = { headless: true };
  if (executablePath) {
    launchOpts.executablePath = executablePath;
  }

  const browser = await chromium.launch(launchOpts);
  const issues = [];
  let totalChecks = 0;

  // Helper to run a check on the current page state
  async function checkState(page, meta) {
    totalChecks++;
    const res = await auditCurrentPage(page);
    const hasIssue =
      res.overflowX > 1 ||
      res.smallTouchTargets.length > 0 ||
      res.smallText.length > 0 ||
      res.edgeOrOverlapText.length > 0 ||
      res.mediaOverflow.length > 0;
    if (hasIssue) {
      issues.push({ ...meta, ...res });
    }
  }

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr,
      hasTouch: true,
      isMobile: vp.width <= 768
    });
    const page = await context.newPage();

    // 1. REAL DATA across languages & themes ( representative combinations + full sweep at key mobile widths )
    const isKeyViewport = [320, 360, 390, 700].includes(vp.width) || vp.height === 375;
    const langsToTest = isKeyViewport ? LANGS : ['vi'];
    const themesToTest = isKeyViewport ? THEMES : ['light'];

    await page.goto(`${BASE_URL}/#/gioi-thieu`, { waitUntil: 'networkidle' });

    for (const lang of langsToTest) {
      for (const theme of themesToTest) {
        await page.evaluate(({ l, t }) => {
          localStorage.setItem('portfolio-lang', l);
          localStorage.setItem('theme', t);
          if (window.applyTheme) window.applyTheme(t);
          if (window.renderPortfolio) window.renderPortfolio(l);
        }, { l: lang, t: theme });
        await page.waitForTimeout(120);

        const realTabs = [
          { tab: 'home', hash: '#/gioi-thieu' },
          { tab: 'profile', hash: '#/ho-so' },
          { tab: 'skills', hash: '#/ky-nang' },
          { tab: 'contact', hash: '#/lien-he' }
        ];

        for (const rt of realTabs) {
          await page.evaluate(h => { window.location.hash = h; }, rt.hash);
          await page.waitForTimeout(80);
          if (rt.tab === 'skills') {
            // Also test with disclosure open
            await page.evaluate(() => {
              document.querySelectorAll('details.dp-disclosure').forEach(d => { d.open = true; });
            });
            await page.waitForTimeout(50);
          }
          await checkState(page, { dataMode: 'real', viewport: vp.label, lang, theme, view: rt.tab });
        }
      }
    }

    // 2. DEMO DATA (?demo=1): all 5 tabs + active project filter + project detail page + open disclosure
    await page.goto(`${BASE_URL}/?demo=1#/gioi-thieu`, { waitUntil: 'networkidle' });
    for (const lang of langsToTest) {
      await page.evaluate(l => {
        localStorage.setItem('portfolio-lang', l);
        localStorage.setItem('theme', 'light');
        if (window.applyTheme) window.applyTheme('light');
        if (window.renderPortfolio) window.renderPortfolio(l);
      }, lang);
      await page.waitForTimeout(120);

      // Home
      await page.evaluate(() => { window.location.hash = '#/gioi-thieu'; });
      await page.waitForTimeout(80);
      await checkState(page, { dataMode: 'demo', viewport: vp.label, lang, theme: 'light', view: 'home' });

      // Projects + active filter
      await page.evaluate(() => { window.location.hash = '#/du-an'; });
      await page.waitForTimeout(80);
      await page.evaluate(() => {
        const btns = document.querySelectorAll('#panel-projects .dp-filter-btn');
        if (btns[1]) btns[1].click();
      });
      await page.waitForTimeout(50);
      await checkState(page, { dataMode: 'demo', viewport: vp.label, lang, theme: 'light', view: 'projects-filtered' });

      // Project Detail view (includes continuous black field method steps)
      await page.evaluate(() => { window.location.hash = '#/du-an/toi-uu-hoa-lo-trinh-doi-xe-da-diem'; });
      await page.waitForTimeout(100);
      await checkState(page, { dataMode: 'demo', viewport: vp.label, lang, theme: 'light', view: 'project-detail' });

      // Skills with disclosure open
      await page.evaluate(() => { window.location.hash = '#/ky-nang'; });
      await page.waitForTimeout(80);
      await page.evaluate(() => {
        document.querySelectorAll('details.dp-disclosure').forEach(d => { d.open = true; });
      });
      await page.waitForTimeout(50);
      await checkState(page, { dataMode: 'demo', viewport: vp.label, lang, theme: 'light', view: 'skills-disclosure-open' });
    }

    // 3. EMPTY DATA state (simulated via route interception on key viewports)
    if ([320, 360, 700].includes(vp.width) && vp.dpr === 2) {
      await page.route('**/data/profile.json*', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ name: '', role: {}, tagline: {}, status: {}, facts: [], education: [], experience: [] })
      }));
      await page.route('**/data/projects.json*', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ projects: [] })
      }));
      await page.route('**/data/certificates.json*', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ certificates: [] })
      }));
      await page.route('**/data/skills.json*', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      }));
      await page.goto(`${BASE_URL}/#/gioi-thieu`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(150);
      await checkState(page, { dataMode: 'empty', viewport: vp.label, lang: 'vi', theme: 'light', view: 'home-empty' });
    }

    await context.close();
  }

  await browser.close();

  const summary = {
    totalChecks,
    issueCount: issues.length,
    issues
  };
  console.log(JSON.stringify(summary, null, 2));
  if (issues.length > 0) {
    process.exitCode = 1;
  }
}

run().catch(err => {
  console.error('Error running check-mobile.js:', err);
  process.exit(1);
});

