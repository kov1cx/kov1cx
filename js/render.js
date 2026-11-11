/* render.js – Swiss Minimalist 12-Column Continuous Grid & Tab-Routed Architecture */

(function() {
  const urlParams = new URLSearchParams(window.location.search);
  const isDemo = urlParams.get('demo') === '1';
  const isEmptyTest = urlParams.get('empty') === '1';
  const showHidden = urlParams.get('showhidden') === '1';
  const dataBase = isDemo ? 'data/_demo/' : 'data/';

  // Kick off dataset fetches immediately in parallel to prevent network waterfalls
  const initialDataPromise = isEmptyTest
    ? Promise.resolve([{}, { projects: [] }, { certificates: [] }, {}])
    : Promise.all([
        fetch(`${dataBase}profile.json`).then(r => r.json()).catch(() => ({})),
        fetch(`${dataBase}projects.json`).then(r => r.json()).catch(() => ({ projects: [] })),
        fetch(`${dataBase}certificates.json`).then(r => r.json()).catch(() => ({ certificates: [] })),
        fetch(`${dataBase}skills.json`).then(r => r.json()).catch(() => ({}))
      ]);
  let initialDataLoaded = false;
  const loadStartTime = performance.now();
  const LOADING_DURATION_MS = 3000;
  let initialLoaderDismissed = false;
  let initialRenderFinished = false;
  let loaderRafId = null;

  function tickLoadingPercent() {
    if (initialLoaderDismissed) return;
    const percentEl = document.getElementById('loading-percent');
    const elapsed = performance.now() - loadStartTime;
    const rawRatio = Math.min(1, Math.max(0, elapsed / LOADING_DURATION_MS));
    // Cap at 99% until initial data & DOM render finish AND 3000ms have elapsed
    const pct = (rawRatio >= 1 && initialRenderFinished)
      ? 100
      : Math.min(99, Math.floor(rawRatio * 100));

    if (percentEl) {
      percentEl.textContent = `${pct}%`;
    }

    if (pct >= 100) {
      initialLoaderDismissed = true;
      if (loaderRafId) {
        cancelAnimationFrame(loaderRafId);
        loaderRafId = null;
      }
      const loadingEl = document.getElementById('loading-screen');
      if (loadingEl) {
        loadingEl.classList.add('dp-loading-screen--hidden');
        loadingEl.hidden = true;
      }
      return;
    }

    loaderRafId = requestAnimationFrame(tickLoadingPercent);
  }

  loaderRafId = requestAnimationFrame(tickLoadingPercent);

  function dismissLoadingScreen() {
    initialRenderFinished = true;
    if (!initialLoaderDismissed && !loaderRafId) {
      loaderRafId = requestAnimationFrame(tickLoadingPercent);
    }
  }

  // Tab canonical keys
  const TAB_KEYS = ['home', 'profile', 'projects', 'skills', 'contact'];

  // Slug aliases (support Vietnamese, English, and French routes)
  const SLUG_TO_TAB = {
    '': 'home',
    'home': 'home',
    'ho-so': 'profile',
    'profile': 'profile',
    'parcours': 'profile',
    'du-an': 'projects',
    'projects': 'projects',
    'projets': 'projects',
    'ky-nang': 'skills',
    'skills': 'skills',
    'competences': 'skills',
    'lien-he': 'contact',
    'contact': 'contact'
  };

  // Locale mapping for Open Graph
  const LOCALE_MAP = {
    'vi': 'vi_VN',
    'en': 'en_US',
    'fr': 'fr_FR'
  };

  // State cache
  const portraitExistenceCache = new Map();

  async function checkPortraitExists(src) {
    if (!src || typeof src !== 'string' || !src.trim()) return false;
    const cleanSrc = src.trim();
    if (portraitExistenceCache.has(cleanSrc)) {
      return portraitExistenceCache.get(cleanSrc);
    }
    try {
      const res = await fetch(cleanSrc, { method: 'HEAD' });
      const ok = Boolean(res && res.ok);
      portraitExistenceCache.set(cleanSrc, ok);
      return ok;
    } catch {
      portraitExistenceCache.set(cleanSrc, false);
      return false;
    }
  }

  let globalState = {
    profile: {},
    projectsData: { projects: [] },
    certificatesData: { certificates: [] },
    skillsData: {},
    ui: {},
    validTabs: {},
    tabNumbers: {},
    activeTabKey: null,
    activeProjectSlug: null,
    activeSectionAnchor: null,
    activeLang: urlParams.get('lang') || localStorage.getItem('uiLang') || document.documentElement.lang || 'vi'
  };

  // Helper to create element
  function ce(tag, cls, txt) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (txt !== undefined && txt !== null && txt !== '') {
      if (typeof txt === 'string' && cls && (cls.includes('dp-btn') || cls.includes('dp-hero-card__badge'))) {
        const arrowMatch = txt.match(/^(.*?)\s*([→↗])$/);
        const leftArrowMatch = txt.match(/^([←])\s*(.*?)$/);
        if (arrowMatch) {
          el.appendChild(document.createTextNode(arrowMatch[1] + ' '));
          const arr = document.createElement('span');
          arr.className = cls.includes('dp-hero-card') ? 'dp-hero-card__arrow' : 'dp-btn__arrow';
          arr.setAttribute('aria-hidden', 'true');
          arr.textContent = arrowMatch[2];
          el.appendChild(arr);
        } else if (leftArrowMatch) {
          const arr = document.createElement('span');
          arr.className = cls.includes('dp-hero-card') ? 'dp-hero-card__arrow dp-hero-card__arrow--left' : 'dp-btn__arrow dp-btn__arrow--left';
          arr.setAttribute('aria-hidden', 'true');
          arr.textContent = leftArrowMatch[1];
          el.appendChild(arr);
          el.appendChild(document.createTextNode(' ' + leftArrowMatch[2]));
        } else {
          el.textContent = txt;
        }
      } else {
        el.textContent = txt;
      }
    }
    return el;
  }

  // Pad index number (01, 02...)
  function padNum(n) {
    return n < 10 ? `0${n}` : String(n);
  }

  // Replace leading ASCII hyphen-minus "-" with Unicode minus "−" (U+2212) without mutating source data
  function formatMetricValue(val) {
    if (val === undefined || val === null) return '';
    return String(val).replace(/^-/, '\u2212');
  }

  // Prevent single orphaned word on the last line of tagline/lead text without mutating source data
  function preventOrphanWord(text) {
    if (!text || typeof text !== 'string') return text;
    const trimmed = text.trim();
    return trimmed.replace(/\s+(\S+\s+\[[^\]]+\]\.?|\S+)$/, m => m.replace(/\s+/g, '\u00A0'));
  }

  // Keep institution names (taken from profile.education) on one line inside tagline/lead text,
  // so a line break never lands in the middle of a school name. Display-only; source data is untouched.
  function keepInstitutionsTogether(text, schools) {
    if (!text || typeof text !== 'string' || !Array.isArray(schools)) return text;
    let out = text;
    schools.filter(Boolean).forEach(name => {
      const s = String(name).trim();
      if (!s || !/\s/.test(s)) return;
      const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      out = out.replace(new RegExp(escaped, 'g'), m => m.replace(/\s+/g, '\u00A0'));
    });
    return out;
  }

  // Format singular/plural count string from ui.navGrid
  function formatPluralCount(countCfg, n, fallback) {
    if (!n || n <= 0) return '';
    let tmpl = fallback;
    if (typeof countCfg === 'string') {
      tmpl = countCfg;
    } else if (countCfg && typeof countCfg === 'object') {
      tmpl = (n === 1 && countCfg.one) ? countCfg.one : (countCfg.other || countCfg.one || fallback);
    }
    return String(tmpl).replace('{n}', String(n));
  }

  // Sync --dp-header-offset CSS custom property with actual rendered header height
  let headerResizeObserver = null;
  function syncHeaderOffset() {
    const headerEl = document.getElementById('header');
    if (!headerEl) return;
    const h = Math.round(headerEl.getBoundingClientRect().height || headerEl.offsetHeight || 0);
    if (h > 0) {
      document.documentElement.style.setProperty('--dp-header-offset', `${h}px`);
    }
  }
  window.addEventListener('resize', syncHeaderOffset);

  // Only show Featured / À la une badge when a block contains BOTH featured and non-featured items
  function hasMixedFeatured(items) {
    if (!Array.isArray(items) || items.length === 0) return false;
    const hasFeat = items.some(x => Boolean(x.featured));
    const hasNonFeat = items.some(x => !x.featured);
    return hasFeat && hasNonFeat;
  }

  // Multilingual field resolver with strict fallback: fr -> en -> vi, en -> vi -> fr, vi -> en -> fr
  function resolveI18n(field, lang) {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (Array.isArray(field)) return field;
    if (typeof field === 'object') {
      if (lang === 'fr') {
        const valFr = field.fr;
        if (Array.isArray(valFr) && valFr.length > 0) return valFr;
        if (typeof valFr === 'string' && valFr.trim()) return valFr.trim();
        const valEn = field.en;
        if (Array.isArray(valEn) && valEn.length > 0) return valEn;
        if (typeof valEn === 'string' && valEn.trim()) return valEn.trim();
        const valVi = field.vi;
        if (Array.isArray(valVi) && valVi.length > 0) return valVi;
        if (typeof valVi === 'string' && valVi.trim()) return valVi.trim();
        return '';
      } else if (lang === 'en') {
        const valEn = field.en;
        if (Array.isArray(valEn) && valEn.length > 0) return valEn;
        if (typeof valEn === 'string' && valEn.trim()) return valEn.trim();
        const valVi = field.vi;
        if (Array.isArray(valVi) && valVi.length > 0) return valVi;
        if (typeof valVi === 'string' && valVi.trim()) return valVi.trim();
        const valFr = field.fr;
        if (Array.isArray(valFr) && valFr.length > 0) return valFr;
        if (typeof valFr === 'string' && valFr.trim()) return valFr.trim();
        return '';
      } else {
        const valVi = field.vi;
        if (Array.isArray(valVi) && valVi.length > 0) return valVi;
        if (typeof valVi === 'string' && valVi.trim()) return valVi.trim();
        const valEn = field.en;
        if (Array.isArray(valEn) && valEn.length > 0) return valEn;
        if (typeof valEn === 'string' && valEn.trim()) return valEn.trim();
        const valFr = field.fr;
        if (Array.isArray(valFr) && valFr.length > 0) return valFr;
        if (typeof valFr === 'string' && valFr.trim()) return valFr.trim();
        return '';
      }
    }
    return String(field);
  }

  // Extract latest year integer from string for sorting newest first
  function extractLatestYear(str) {
    if (!str) return 0;
    const s = String(str);
    if (/hiện tại|present|présent|now/i.test(s)) return 9999;
    const matches = s.match(/\b(19|20)\d{2}\b/g);
    if (!matches || matches.length === 0) return 0;
    return Math.max(...matches.map(Number));
  }

  // Slug generator
  function slugify(text) {
    if (!text) return '';
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[œŒ]/g, 'oe')
      .replace(/[æÆ]/g, 'ae')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Format certificate date
  function formatCertDate(c) {
    if (!c) return '';
    return c.month ? `${c.month}/${c.year}` : (c.year || '');
  }

  // Accessible verification aria-label
  function buildVerifyAria(cTitle, ui) {
    const pattern = ui.skills?.verifyAria || 'Xác thực {title}, mở tab mới';
    return pattern.replace('{title}', cTitle);
  }

  // Build localized tab URL keeping search params before #
  function buildTabUrl(tabKey, ui, projectSlug) {
    const tabSlug = ui.tabs?.[tabKey]?.slug || '';
    let hash = '#/';
    if (tabKey === 'home') {
      hash = '#/';
    } else if (tabKey === 'projects' && projectSlug) {
      hash = `#/${tabSlug}/${projectSlug}`;
    } else if (tabSlug) {
      hash = `#/${tabSlug}`;
    }
    return `${window.location.search}${hash}`;
  }

  // Parse current route from window.location.hash
  function parseCurrentRoute() {
    const rawHash = window.location.hash.replace(/^#\/?/, '').replace(/\/$/, '');
    if (!rawHash) {
      return { tabKey: 'home', projectSlug: null, sectionAnchor: null };
    }
    const [routePart, sectionAnchor] = rawHash.split('#');
    const parts = (routePart || '').split('/');
    const firstPart = parts[0];
    const projectSlug = (parts.length > 1) ? parts.slice(1).join('/') : null;
    const tabKey = SLUG_TO_TAB[firstPart] || (sectionAnchor === 'chung-chi' ? 'skills' : 'home');
    return {
      tabKey,
      projectSlug: (tabKey === 'projects' && projectSlug) ? projectSlug : null,
      sectionAnchor: sectionAnchor || null
    };
  }

  // Build Hero Media Element (rectangular crop, no decorative fallback)
  function createHeroMediaElement(profile, ui, activeLang) {
    const media = profile.hero_media;
    if (!media || !media.src || media.type === 'none') return null;

    if (media.type === 'image') {
      const isChartOrDiagram = /\.svg$/i.test(media.src) && media.grayscale !== true;
      const figCls = isChartOrDiagram
        ? 'dp-figure'
        : 'dp-figure dp-figure--editorial';
      const figure = ce('figure', figCls);
      const img = ce('img', 'dp-figure__img');
      img.src = media.src;
      img.alt = resolveI18n(media.alt, activeLang) || '';
      img.width = 600;
      img.height = 400;
      img.loading = 'eager';
      figure.appendChild(img);

      const captionText = resolveI18n(media.caption, activeLang);
      if (captionText || media.link_project) {
        const caption = ce('figcaption', 'dp-figure__caption');
        if (captionText) {
          caption.appendChild(ce('span', '', captionText));
        }
        if (media.link_project) {
          const link = ce('a', 'dp-verify-link', '↗');
          link.href = buildTabUrl('projects', ui, media.link_project);
          link.setAttribute('aria-label', captionText || 'Dự án');
          caption.appendChild(link);
        }
        figure.appendChild(caption);
      }
      return figure;
    }

    if (media.type === 'iframe') {
      const figure = ce('figure', 'dp-figure');
      const iframe = ce('iframe', 'dp-figure__img');
      iframe.src = media.src;
      iframe.loading = 'lazy';
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      iframe.setAttribute('title', resolveI18n(media.alt, activeLang) || 'Interactive Demo');
      figure.appendChild(iframe);

      const captionText = resolveI18n(media.caption, activeLang);
      if (captionText) {
        const caption = ce('figcaption', 'dp-figure__caption', captionText);
        figure.appendChild(caption);
      }
      return figure;
    }

    return null;
  }

  // Build Project Fact Table (<dl class="dp-fact-table">) without duplicating info
  function createFactTable(project, ui, activeLang, includeResult) {
    const dl = ce('dl', 'dp-fact-table');
    let count = 0;

    if (project.year) {
      const row = ce('div', 'dp-fact-table__row');
      row.appendChild(ce('dt', 'dp-fact-table__dt', ui.projects?.meta?.year || 'NĂM'));
      row.appendChild(ce('dd', 'dp-fact-table__dd', project.year));
      dl.appendChild(row);
      count++;
    }

    const resolvedRole = resolveI18n(project.role, activeLang);
    if (resolvedRole) {
      const row = ce('div', 'dp-fact-table__row');
      row.appendChild(ce('dt', 'dp-fact-table__dt', ui.projects?.meta?.role || 'VAI TRÒ'));
      row.appendChild(ce('dd', 'dp-fact-table__dd', resolvedRole));
      dl.appendChild(row);
      count++;
    }

    if (Array.isArray(project.tags) && project.tags.length > 0) {
      const row = ce('div', 'dp-fact-table__row');
      row.appendChild(ce('dt', 'dp-fact-table__dt', ui.projects?.meta?.tech || 'CÔNG NGHỆ'));
      row.appendChild(ce('dd', 'dp-fact-table__dd', project.tags.slice(0, 4).join(' · ')));
      dl.appendChild(row);
      count++;
    }

    if (includeResult) {
      const resolvedResult = resolveI18n(project.result, activeLang);
      if (resolvedResult) {
        const row = ce('div', 'dp-fact-table__row');
        row.appendChild(ce('dt', 'dp-fact-table__dt', ui.projects?.meta?.result || 'KẾT QUẢ CHÍNH'));
        row.appendChild(ce('dd', 'dp-fact-table__dd', resolvedResult));
        dl.appendChild(row);
        count++;
      }
    }

    return count > 0 ? dl : null;
  }

  // Create Index Rail (Cols 1-3)
  function createRail(indexCode, labelText, titleText, descText, headingTag) {
    const rail = ce('div', 'dp-rail');
    const idxRow = ce('div', 'dp-rail__index');
    if (indexCode) idxRow.appendChild(ce('span', '', indexCode));
    if (labelText) idxRow.appendChild(ce('span', '', labelText));
    rail.appendChild(idxRow);

    if (titleText) {
      const hTag = headingTag || 'h2';
      const titleEl = ce(hTag, 'dp-rail__title', titleText);
      rail.appendChild(titleEl);
    }

    if (descText) {
      rail.appendChild(ce('p', 'dp-rail__desc', descText));
    }
    return rail;
  }

  // Update document title, meta tags, og:locale, and JSON-LD
  function updateMetadata(tabKey, projectSlug, ui, profile, projectsData, lang) {
    const activeLang = lang || globalState.activeLang || 'vi';
    let docTitle = ui.meta?.title || 'Portfolio';
    let metaDesc = ui.meta?.description || '';

    const personName = profile.name || '';
    const tabMeta = ui.tabs?.[tabKey] || {};
    const tabName = tabMeta.name || '';

    if (tabKey === 'home') {
      docTitle = ui.meta?.title || (personName ? `${personName} – Portfolio` : 'Portfolio');
      metaDesc = tabMeta.metaDesc || ui.meta?.description || '';
    } else if (tabKey === 'projects' && projectSlug) {
      const p = (projectsData.projects || []).find(x => x.slug === projectSlug);
      if (p) {
        const pTitle = resolveI18n(p.title, activeLang);
        const pSummary = resolveI18n(p.summary, activeLang);
        docTitle = personName ? `${pTitle} · ${personName}` : `${pTitle} · Portfolio`;
        metaDesc = pSummary || tabMeta.metaDesc || '';
      } else {
        docTitle = personName ? `${tabName} · ${personName}` : `${tabName} · Portfolio`;
        metaDesc = tabMeta.metaDesc || '';
      }
    } else {
      docTitle = personName ? `${tabName} · ${personName}` : `${tabName} · Portfolio`;
      metaDesc = tabMeta.metaDesc || ui.meta?.description || '';
    }

    document.title = docTitle;
    document.documentElement.lang = activeLang;

    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta && metaDesc) descMeta.setAttribute('content', metaDesc);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', docTitle);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && metaDesc) ogDesc.setAttribute('content', metaDesc);

    const ogLocale = document.getElementById('og-locale');
    if (ogLocale) ogLocale.setAttribute('content', LOCALE_MAP[activeLang] || 'vi_VN');

    const otherLocales = Object.entries(LOCALE_MAP)
      .filter(([l]) => l !== activeLang)
      .map(([, loc]) => loc);

    const alt1 = document.getElementById('og-locale-alt-1');
    if (alt1 && otherLocales[0]) alt1.setAttribute('content', otherLocales[0]);

    const alt2 = document.getElementById('og-locale-alt-2');
    if (alt2 && otherLocales[1]) alt2.setAttribute('content', otherLocales[1]);

    const ldScript = document.getElementById('ldjson');
    if (ldScript) {
      const resolvedRole = resolveI18n(profile.role, activeLang);
      const resolvedIntro = resolveI18n(profile.intro, activeLang);
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        'name': profile.name || 'Portfolio Owner',
        'jobTitle': resolvedRole || 'Specialist',
        'description': resolvedIntro || metaDesc || 'Portfolio',
        'url': ui.meta?.ogUrl || window.location.href,
        'knowsLanguage': ['vi', 'en', 'fr'],
        'sameAs': [
          profile.linkedin,
          profile.github,
          profile.kaggle
        ].filter(Boolean)
      };
      ldScript.textContent = JSON.stringify(schema, null, 2);
    }
  }

  // Render in-place Project Detail View (#/du-an/<slug>)
  function renderProjectDetailView(projectSlug, projectsData, ui, lang) {
    const detailContainer = document.getElementById('project-detail-view');
    const gridContainer = document.getElementById('projects-grid-view');
    if (!detailContainer || !gridContainer) return;

    if (!projectSlug) {
      gridContainer.hidden = false;
      detailContainer.hidden = true;
      detailContainer.innerHTML = '';
      return;
    }

    gridContainer.hidden = true;
    detailContainer.hidden = false;
    detailContainer.innerHTML = '';

    const p = (projectsData.projects || []).find(x => x.slug === projectSlug);
    const backUrl = buildTabUrl('projects', ui);
    const projTabNum = globalState.tabNumbers.projects || '03';

    if (!p) {
      const nfSec = ce('div', 'dp-section dp-grid');
      const nfRail = createRail(projTabNum, ui.tabs?.projects?.name || 'Dự án', '404');
      const nfContent = ce('div', 'dp-content');
      const backBtn = ce('a', 'dp-btn', ui.projects?.backToList || '← Quay lại danh sách dự án');
      backBtn.href = backUrl;
      nfContent.appendChild(backBtn);
      nfContent.appendChild(ce('p', 'dp-lead-text', ui.projects?.notFound || 'Không tìm thấy thông tin dự án yêu cầu.'));
      nfSec.appendChild(nfRail);
      nfSec.appendChild(nfContent);
      detailContainer.appendChild(nfSec);
      return;
    }

    const pTitle = resolveI18n(p.title, lang);
    const pContext = resolveI18n(p.context, lang) || resolveI18n(p.problem, lang);
    const pData = resolveI18n(p.data, lang);
    const pMethod = resolveI18n(p.method, lang) || resolveI18n(p.summary, lang);
    const pResult = resolveI18n(p.result, lang);
    const pLimitations = resolveI18n(p.limitations, lang);

    // 1. Overview & Fact Sheet Section
    const topSec = ce('article', 'dp-section dp-grid');
    const topRail = ce('div', 'dp-rail');
    const backBtn = ce('a', 'dp-btn', ui.projects?.backToList || '← Quay lại danh sách dự án');
    backBtn.href = backUrl;
    topRail.appendChild(backBtn);
    const railIdx = ce('div', 'dp-rail__index');
    railIdx.appendChild(ce('span', '', `${projTabNum} / ${ui.rail?.caseStudy || 'CASE STUDY'}`));
    topRail.appendChild(railIdx);
    topSec.appendChild(topRail);

    const topContent = ce('div', 'dp-content');
    const headerBlock = ce('div', 'dp-detail-header');
    const titleEl = ce('h2', 'dp-detail-title project-detail__title', pTitle);
    titleEl.setAttribute('tabindex', '-1');
    headerBlock.appendChild(titleEl);
    topContent.appendChild(headerBlock);

    const hasMetric = Boolean(p.result_metric && p.result_metric.value);
    const factTable = createFactTable(p, ui, lang, false);

    const linksWrap = ce('div', 'dp-project-actions');
    if (p.demoLink) {
      const demoBtn = ce('a', 'dp-btn dp-btn--solid', `${ui.projects?.demo || 'Bản thử'} ↗`);
      demoBtn.href = p.demoLink;
      demoBtn.target = '_blank';
      demoBtn.rel = 'noopener noreferrer';
      linksWrap.appendChild(demoBtn);
    }
    if (p.githubLink) {
      const ghBtn = ce('a', 'dp-btn', `${ui.projects?.sourceCode || 'Mã nguồn'} ↗`);
      ghBtn.href = p.githubLink;
      ghBtn.target = '_blank';
      ghBtn.rel = 'noopener noreferrer';
      linksWrap.appendChild(ghBtn);
    }
    if (p.pdfLink) {
      const pdfBtn = ce('a', 'dp-btn', `${ui.projects?.viewReport || 'Báo cáo PDF'} ↗`);
      pdfBtn.href = p.pdfLink;
      pdfBtn.target = '_blank';
      pdfBtn.rel = 'noopener noreferrer';
      linksWrap.appendChild(pdfBtn);
    }

    // Unified Project Overview (Balanced 2-Column: Key Metric Card + Meta Details & Actions)
    if (hasMetric || factTable || linksWrap.children.length > 0) {
      const overview = ce('div', 'dp-detail-overview');

      if (hasMetric) {
        const metricCard = ce('div', 'dp-detail-metric-card');
        const kicker = ce('span', 'dp-detail-metric-card__kicker', ui.projects?.keyMetric || 'KẾT QUẢ CỐT LÕI');
        metricCard.appendChild(kicker);

        const metricBox = ce('div', 'dp-metric');
        metricBox.appendChild(ce('span', 'dp-metric__value', formatMetricValue(p.result_metric.value)));
        const mLabel = resolveI18n(p.result_metric.label, lang);
        if (mLabel) metricBox.appendChild(ce('span', 'dp-metric__label', mLabel));
        metricCard.appendChild(metricBox);
        overview.appendChild(metricCard);
      }

      const metaCol = ce('div', `dp-detail-meta-wrap ${!hasMetric ? 'dp-detail-meta-wrap--full' : ''}`);
      if (factTable) {
        metaCol.appendChild(factTable);
      }
      if (linksWrap.children.length > 0) {
        metaCol.appendChild(linksWrap);
      }
      overview.appendChild(metaCol);

      topContent.appendChild(overview);
    }

    const figSrc = p.figure?.src || p.image;
    if (figSrc) {
      const figCls = p.grayscale ? 'dp-figure dp-figure--grayscale' : 'dp-figure';
      const figure = ce('figure', figCls);
      const img = ce('img', 'dp-figure__img');
      img.src = figSrc;
      img.srcset = p.figure?.srcset || `${figSrc} 480w, ${figSrc} 960w`;
      img.sizes = '(max-width: 700px) calc(100vw - 32px), 600px';
      img.alt = pTitle;
      img.width = 600;
      img.height = 400;
      img.loading = 'lazy';
      img.decoding = 'async';
      figure.appendChild(img);

      const capText = resolveI18n(p.figure?.caption, lang);
      if (capText) {
        figure.appendChild(ce('figcaption', 'dp-figure__caption', capText));
      }
      topContent.appendChild(figure);
    }

    topSec.appendChild(topContent);
    detailContainer.appendChild(topSec);

    let stepSecIdx = 1;
    const secLabels = ui.projects?.sections || {
      context: 'Bối cảnh & Bài toán',
      data: 'Dữ liệu đầu vào',
      method: 'Phương pháp thực hiện',
      result: 'Kết quả thực tiễn',
      limitations: 'Hạn chế & Hướng mở rộng'
    };

    // Block 1: Bối cảnh (hidden if empty)
    if (pContext) {
      const sec = ce('div', 'dp-section dp-grid');
      sec.appendChild(createRail(`${projTabNum}.${stepSecIdx++}`, ui.rail?.context || 'CONTEXT', secLabels.context, '', 'h3'));
      const content = ce('div', 'dp-content');
      content.appendChild(ce('p', 'dp-lead-text', pContext));
      sec.appendChild(content);
      detailContainer.appendChild(sec);
    }

    // Block 2: Dữ liệu (hidden if empty)
    if (pData) {
      const sec = ce('div', 'dp-section dp-grid');
      sec.appendChild(createRail(`${projTabNum}.${stepSecIdx++}`, ui.rail?.data || 'DATA', secLabels.data, '', 'h3'));
      const content = ce('div', 'dp-content');
      content.appendChild(ce('p', 'dp-lead-text', pData));
      sec.appendChild(content);
      detailContainer.appendChild(sec);
    }

    // Block 3: Phương pháp (Numbered steps in ONE continuous black field with white reading)
    if (pMethod && ((Array.isArray(pMethod) && pMethod.length > 0) || (typeof pMethod === 'string' && pMethod.trim()))) {
      const stepsArr = Array.isArray(pMethod)
        ? pMethod
        : pMethod.split(/(?<=[.!?])\s+/).filter(Boolean);

      const sec = ce('div', 'dp-section dp-grid dp-black-field');
      sec.appendChild(createRail(`${projTabNum}.${stepSecIdx++}`, ui.rail?.method || 'METHOD', secLabels.method, '', 'h3'));
      const content = ce('div', 'dp-content');
      const stepsGrid = ce('ol', 'dp-steps');

      stepsArr.forEach((stepTxt, idx) => {
        const li = ce('li', 'dp-step');
        const numRow = ce('div', 'dp-step__num');
        numRow.appendChild(ce('span', 'dp-red-mark'));
        numRow.appendChild(ce('span', '', padNum(idx + 1)));
        li.appendChild(numRow);
        li.appendChild(ce('p', 'dp-step__text', stepTxt));
        stepsGrid.appendChild(li);
      });

      content.appendChild(stepsGrid);
      sec.appendChild(content);
      detailContainer.appendChild(sec);
    }

    // Block 4: Kết quả (hidden if empty)
    if (pResult) {
      const sec = ce('div', 'dp-section dp-grid');
      sec.appendChild(createRail(`${projTabNum}.${stepSecIdx++}`, ui.rail?.results || 'RESULTS', ui.projects?.results || secLabels.result, '', 'h3'));
      const content = ce('div', 'dp-content');
      content.appendChild(ce('p', 'dp-lead-text', pResult));
      sec.appendChild(content);
      detailContainer.appendChild(sec);
    }

    // Block 5: Hạn chế (hidden if empty)
    if (pLimitations) {
      const sec = ce('div', 'dp-section dp-grid');
      sec.appendChild(createRail(`${projTabNum}.${stepSecIdx++}`, ui.rail?.limits || 'LIMITS', secLabels.limitations, '', 'h3'));
      const content = ce('div', 'dp-content');
      content.appendChild(ce('p', 'dp-lead-text', pLimitations));
      sec.appendChild(content);
      detailContainer.appendChild(sec);
    }
  }

  // Switch tab with immediate feedback (0s motion)
  function switchTab(tabKey, projectSlug, isInitial, sectionAnchor) {
    const { validTabs, ui, profile, projectsData, activeLang } = globalState;

    if (!validTabs[tabKey]) {
      const homeSlug = ui.tabs?.home?.slug || '';
      window.location.hash = homeSlug ? `#/${homeSlug}` : '#/';
      return;
    }

    const currentTabKey = globalState.activeTabKey;
    const currentProjectSlug = globalState.activeProjectSlug;
    const currentSectionAnchor = globalState.activeSectionAnchor;

    if (!isInitial && currentTabKey === tabKey && currentProjectSlug === projectSlug && currentSectionAnchor === (sectionAnchor || null)) {
      return;
    }

    const nextPanel = document.getElementById(`panel-${tabKey}`);
    if (!nextPanel) return;

    globalState.activeTabKey = tabKey;
    globalState.activeProjectSlug = projectSlug;
    globalState.activeSectionAnchor = sectionAnchor || null;

    TAB_KEYS.forEach(k => {
      const p = document.getElementById(`panel-${k}`);
      if (p) {
        p.hidden = (k !== tabKey);
      }
    });

    if (tabKey === 'projects') {
      renderProjectDetailView(projectSlug, projectsData, ui, activeLang);
    }

    const anchorEl = sectionAnchor ? nextPanel.querySelector(`#${CSS.escape(sectionAnchor)}`) : null;
    if (anchorEl) {
      anchorEl.scrollIntoView({ behavior: 'instant', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    document.querySelectorAll('.tab-item').forEach(link => {
      const match = link.dataset.tab === tabKey;
      link.classList.toggle('active', match);
      if (match) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    const navList = document.querySelector('.dp-nav__list');
    const activeNavLink = navList && navList.querySelector('.tab-item.active');
    if (navList && activeNavLink && navList.scrollWidth > navList.clientWidth) {
      const targetLeft = activeNavLink.offsetLeft - (navList.clientWidth / 2) + (activeNavLink.offsetWidth / 2);
      navList.scrollLeft = Math.max(0, targetLeft);
    }

    if (!isInitial || anchorEl) {
      let targetHeading = null;
      if (anchorEl) {
        targetHeading = anchorEl.querySelector('h1:not(.visually-hidden), h2, h3');
      }
      if (!targetHeading && tabKey === 'projects' && projectSlug) {
        targetHeading = nextPanel.querySelector('.project-detail__title');
      }
      if (!targetHeading) {
        targetHeading = nextPanel.querySelector('h1:not(.visually-hidden), h2');
      }
      if (targetHeading) {
        targetHeading.setAttribute('tabindex', '-1');
        targetHeading.focus({ preventScroll: true });
      }

      if (!isInitial || anchorEl) {
        const announcer = document.getElementById('route-announcer');
        if (announcer) {
          const tabName = (sectionAnchor === 'chung-chi')
            ? (ui.navGrid?.certificatesName || ui.skills?.certsTitle || 'Chứng chỉ')
            : (ui.tabs?.[tabKey]?.name || tabKey);
          const tmpl = ui.aria?.tabSwitched || 'Đã chuyển sang tab {tabName}';
          announcer.textContent = tmpl.replace('{tabName}', tabName);
        }
      }
    }

    updateMetadata(tabKey, projectSlug, ui, profile, projectsData, activeLang);
  }

  function handleHashRoute() {
    const { tabKey, projectSlug, sectionAnchor } = parseCurrentRoute();
    switchTab(tabKey, projectSlug, false, sectionAnchor);
  }

  window.addEventListener('hashchange', handleHashRoute);

  // Build Language & Theme controls group (Fully decoupled & styled)
  function createControlsGroup(activeLang, ui, isHeader) {
    const controls = ce('div', 'dp-header__controls');

    // 1. Language Segmented Control
    const langGroup = ce('div', 'dp-control-segmented dp-control-segmented--lang');
    if (isHeader) langGroup.id = 'lang-toggle';
    langGroup.setAttribute('role', 'group');
    langGroup.setAttribute('aria-label', ui.header?.langToggle || 'Ngôn ngữ');

    ['vi', 'en', 'fr'].forEach(l => {
      const isAct = activeLang === l;
      const btn = ce('button', `dp-control-btn dp-control-btn--lang ${isAct ? 'active' : ''}`, l.toUpperCase());
      btn.type = 'button';
      btn.dataset.lang = l;
      btn.setAttribute('aria-pressed', isAct ? 'true' : 'false');
      btn.setAttribute('aria-label', `Ngôn ngữ ${l.toUpperCase()}`);
      langGroup.appendChild(btn);
    });
    controls.appendChild(langGroup);

    // 2. Theme Segmented Control
    const curTheme = document.documentElement.dataset.theme || 'cartoon';
    const isDark = ['dark', 'cyber', 'amber', 'aurora', 'sunset', 'emerald', 'manga', 'cartoon-dark'].includes(curTheme);
    const darkLbl = ui.header?.themeDark || 'TỐI';
    const lightLbl = ui.header?.themeLight || 'SÁNG';

    const themeGroup = ce('div', 'dp-control-segmented dp-control-segmented--theme');
    if (isHeader) themeGroup.id = 'theme-toggle-group';
    themeGroup.setAttribute('role', 'group');
    themeGroup.setAttribute('aria-label', ui.header?.themeToggle || 'Chế độ giao diện');

    // Clean inline SVG icons
    const sunSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="dp-control-icon"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

    const moonSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="dp-control-icon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

    const lightBtn = ce('button', `dp-control-btn dp-control-btn--theme ${!isDark ? 'active' : ''}`);
    lightBtn.type = 'button';
    lightBtn.dataset.themeVal = 'light';
    lightBtn.setAttribute('aria-pressed', !isDark ? 'true' : 'false');
    lightBtn.innerHTML = `${sunSvg}<span>${lightLbl}</span>`;
    themeGroup.appendChild(lightBtn);

    const darkBtn = ce('button', `dp-control-btn dp-control-btn--theme ${isDark ? 'active' : ''}`);
    darkBtn.type = 'button';
    darkBtn.dataset.themeVal = 'dark';
    darkBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    darkBtn.innerHTML = `${moonSvg}<span>${darkLbl}</span>`;
    themeGroup.appendChild(darkBtn);

    controls.appendChild(themeGroup);

    return controls;
  }

  // Main render entry point
  async function renderPortfolio(lang, preloadedUI) {
    try {
      const activeLang = lang || globalState.activeLang || 'vi';
      let profile, projectsData, certificatesData, skillsData, ui;

      if (!initialDataLoaded) {
        [profile, projectsData, certificatesData, skillsData] = await initialDataPromise;
        initialDataLoaded = true;
      } else if (isEmptyTest) {
        [profile, projectsData, certificatesData, skillsData] = [{}, { projects: [] }, { certificates: [] }, {}];
      } else {
        [profile, projectsData, certificatesData, skillsData] = await Promise.all([
          fetch(`${dataBase}profile.json`).then(r => r.json()).catch(() => ({})),
          fetch(`${dataBase}projects.json`).then(r => r.json()).catch(() => ({ projects: [] })),
          fetch(`${dataBase}certificates.json`).then(r => r.json()).catch(() => ({ certificates: [] })),
          fetch(`${dataBase}skills.json`).then(r => r.json()).catch(() => ({}))
        ]);
      }
      ui = preloadedUI ? preloadedUI : await fetch(`data/ui.${activeLang}.json`).then(r => r.json()).catch(() => ({}));

      // Assign unique slugs to projects
      if (Array.isArray(projectsData.projects)) {
        const slugCounts = {};
        projectsData.projects.forEach(p => {
          if (!p.slug) {
            const rawTitle = resolveI18n(p.title, 'vi') || resolveI18n(p.title, 'en') || resolveI18n(p.title, 'fr') || 'project';
            const cleanTitle = rawTitle.replace(/\[.*?\]/g, '').trim();
            const baseSlug = slugify(cleanTitle) || 'project';
            if (slugCounts[baseSlug] === undefined) {
              slugCounts[baseSlug] = 1;
              p.slug = baseSlug;
            } else {
              slugCounts[baseSlug]++;
              p.slug = `${baseSlug}-${slugCounts[baseSlug]}`;
            }
          }
        });
      }

      // Check tab validity
      const hasEducation = Array.isArray(profile.education) && profile.education.length > 0;
      const hasExperience = Array.isArray(profile.experience) && profile.experience.length > 0;
      const hasProfileData = hasEducation || hasExperience;

      const hasProjects = Array.isArray(projectsData.projects) && projectsData.projects.length > 0;
      const isCertVisible = c => Boolean(c && (showHidden || !c.hidden));
      const visibleCerts = (certificatesData.certificates || []).filter(isCertVisible);
      const hasCertificates = visibleCerts.length > 0;
      const hasTechStack = Array.isArray(skillsData?.techStack) && skillsData.techStack.length > 0;
      const hasSkills = hasTechStack || hasCertificates;

      const hasContact = Boolean(profile.email || profile.phone || profile.linkedin || profile.github || profile.kaggle);
      const resolvedRole = resolveI18n(profile.role, activeLang);
      const resolvedTagline = resolveI18n(profile.tagline, activeLang);
      const resolvedStatus = resolveI18n(profile.status, activeLang);
      const resolvedTarget = resolveI18n(profile.target, activeLang);
      const resolvedLocation = resolveI18n(profile.location, activeLang);
      const resolvedIntro = resolveI18n(profile.intro, activeLang) || resolveI18n(profile.summary, activeLang);
      const hasHeroData = Boolean(profile.name && profile.name.trim());
      const rawPortraitSrc = (profile.portrait && typeof profile.portrait.src === 'string')
        ? profile.portrait.src.trim()
        : '';
      const hasPortrait = rawPortraitSrc ? await checkPortraitExists(rawPortraitSrc) : false;

      const validTabs = {
        home: true,
        profile: hasProfileData,
        projects: hasProjects,
        skills: hasSkills,
        contact: hasContact
      };

      // Compute sequential numbering (01, 02...) for non-empty tabs
      const tabNumbers = {};
      let seqIdx = 1;
      TAB_KEYS.forEach(tk => {
        if (validTabs[tk]) {
          tabNumbers[tk] = padNum(seqIdx++);
        }
      });

      globalState = {
        profile,
        projectsData,
        certificatesData,
        skillsData,
        ui,
        validTabs,
        tabNumbers,
        activeTabKey: globalState.activeTabKey,
        activeProjectSlug: globalState.activeProjectSlug,
        activeLang
      };

      const header = document.getElementById('header');
      const main = document.getElementById('main');
      const footer = document.getElementById('footer');

      if (!header || !main || !footer) return;

      header.innerHTML = '';
      main.innerHTML = '';
      footer.innerHTML = '';

      /* ==============================================================
       * Header: Single-Row with Left Identity & Right Numbered Index
       * ============================================================ */
      const headerGrid = ce('div', 'dp-header dp-grid');
      const brandText = (profile.name && profile.name.trim()) || (profile.initials && profile.initials.trim()) || '';

      if (brandText) {
        const brandCol = ce('div', 'dp-header__brand');
        const logoLink = ce('a', 'dp-header__logo');
        logoLink.href = buildTabUrl('home', ui);
        
        const logoIcon = ce('img', 'dp-header__logo-icon');
        logoIcon.src = 'assets/img/favicon.svg?v=20261111a';
        logoIcon.alt = 'Logo';
        logoIcon.width = 24;
        logoIcon.height = 24;
        logoLink.appendChild(logoIcon);
        
        const logoText = ce('span', 'dp-header__logo-text', brandText);
        logoLink.appendChild(logoText);
        
        brandCol.appendChild(logoLink);
        headerGrid.appendChild(brandCol);
      }

      const barCol = ce('div', `dp-header__bar ${!brandText ? 'dp-header__bar--full' : ''}`);
      const nav = ce('nav', 'dp-nav');
      nav.setAttribute('aria-label', ui.header?.indexAria || 'Index');
      const navList = ce('ul', 'dp-nav__list');

      TAB_KEYS.forEach(tabKey => {
        if (validTabs[tabKey]) {
          const li = ce('li', 'dp-nav__item');
          const a = ce('a', 'dp-nav__link tab-item');
          a.href = buildTabUrl(tabKey, ui);
          a.dataset.tab = tabKey;

          const topSpan = ce('span', 'dp-nav__top');
          const mark = ce('span', 'dp-nav__mark');
          mark.setAttribute('aria-hidden', 'true');
          const numSpan = ce('span', 'dp-nav__num', tabNumbers[tabKey]);
          topSpan.appendChild(mark);
          topSpan.appendChild(numSpan);
          const txtSpan = ce('span', 'dp-nav__text', ui.tabs?.[tabKey]?.name || tabKey);

          a.appendChild(topSpan);
          a.appendChild(txtSpan);
          li.appendChild(a);
          navList.appendChild(li);
        }
      });

      nav.appendChild(navList);
      barCol.appendChild(nav);
      barCol.appendChild(createControlsGroup(activeLang, ui, true));
      headerGrid.appendChild(barCol);
      header.appendChild(headerGrid);
      syncHeaderOffset();
      if (!headerResizeObserver && typeof ResizeObserver !== 'undefined') {
        headerResizeObserver = new ResizeObserver(syncHeaderOffset);
        headerResizeObserver.observe(header);
      }

      /* ==============================================================
       * Demo Mode Bar (?demo=1)
       * ============================================================ */
      if (isDemo) {
        const demoBar = ce('div', 'dp-demo-bar dp-grid');
        const labelCol = ce('div', 'dp-demo-bar__label');
        labelCol.appendChild(ce('span', 'dp-badge-featured', ui.demoBadge || 'DEMO'));
        const textCol = ce('p', 'dp-demo-bar__text', ui.demoNotice || '');
        demoBar.appendChild(labelCol);
        demoBar.appendChild(textCol);
        main.appendChild(demoBar);
      }

      // Helper for certificate verification link / note (no fallback text when verify_note is empty)
      function createCertVerifyElement(c, cTitleTxt) {
        if (c.verify_url) {
          const a = ce('a', 'dp-verify-link', `${ui.skills?.verifyCert || 'Xác thực'} ↗`);
          a.href = c.verify_url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.setAttribute('aria-label', buildVerifyAria(cTitleTxt, ui));
          return a;
        }
        const noteTxt = resolveI18n(c.verify_note, activeLang);
        if (noteTxt) {
          return ce('span', 'dp-meta dp-meta--muted', noteTxt);
        }
        return null;
      }

      // Lightbox modal for certificate image preview
      function openCertLightbox(c) {
        const existing = document.getElementById('dp-cert-modal');
        if (existing) existing.remove();

        const modal = ce('div', 'dp-cert-modal');
        modal.id = 'dp-cert-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        const cTitle = resolveI18n(c.title, activeLang) || c.title;
        modal.setAttribute('aria-label', cTitle);

        const backdrop = ce('div', 'dp-cert-modal__backdrop');
        modal.appendChild(backdrop);

        const dialog = ce('div', 'dp-cert-modal__dialog');

        // Header
        const header = ce('div', 'dp-cert-modal__header');
        const titleBlock = ce('div', 'dp-cert-modal__title-block');
        titleBlock.appendChild(ce('h2', 'dp-cert-modal__title', cTitle));
        const cIssuer = resolveI18n(c.issuer, activeLang) || c.issuer;
        if (cIssuer) {
          const metaText = c.verify_note
            ? `${cIssuer} · ${formatCertDate(c)} · ID: ${c.verify_note}`
            : `${cIssuer} · ${formatCertDate(c)}`;
          titleBlock.appendChild(ce('p', 'dp-cert-modal__meta', metaText));
        }
        header.appendChild(titleBlock);

        const closeBtn = ce('button', 'dp-cert-modal__close', '✕');
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', ui.skills?.closeModal || 'Đóng');
        header.appendChild(closeBtn);
        dialog.appendChild(header);

        // Body
        const body = ce('div', 'dp-cert-modal__body');
        const fullImg = ce('img', 'dp-cert-modal__img');
        fullImg.src = c.image || c.thumbnail;
        fullImg.alt = cTitle;
        fullImg.loading = 'eager';
        body.appendChild(fullImg);
        dialog.appendChild(body);

        // Footer
        const footer = ce('div', 'dp-cert-modal__footer');
        if (c.verify_url) {
          const verifyLink = ce('a', 'dp-btn dp-btn--solid', `${ui.skills?.verifyCert || 'Xác thực trực tuyến'} ↗`);
          verifyLink.href = c.verify_url;
          verifyLink.target = '_blank';
          verifyLink.rel = 'noopener noreferrer';
          footer.appendChild(verifyLink);
        }
        if (c.pdf) {
          const pdfLink = ce('a', 'dp-btn', `${ui.skills?.openOriginalPdf || 'Mở PDF gốc'} ↗`);
          pdfLink.href = c.pdf;
          pdfLink.target = '_blank';
          pdfLink.rel = 'noopener noreferrer';
          footer.appendChild(pdfLink);
        }
        const closeBtn2 = ce('button', 'dp-btn', ui.skills?.closeModal || 'Đóng');
        closeBtn2.type = 'button';
        footer.appendChild(closeBtn2);

        dialog.appendChild(footer);
        modal.appendChild(dialog);
        document.body.appendChild(modal);

        function closeModal() {
          document.removeEventListener('keydown', onKeyDown);
          modal.remove();
        }
        function onKeyDown(e) {
          if (e.key === 'Escape') closeModal();
        }

        backdrop.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);
        closeBtn2.addEventListener('click', closeModal);
        document.addEventListener('keydown', onKeyDown);
        closeBtn.focus();
      }

      // Helper to build a featured visual certificate card
      function buildFeaturedCertCard(c, showFeaturedBadge) {
        const card = ce('article', 'dp-cert-card');
        if (c.id) card.id = `cert-card-${c.id}`;

        const cTitleTxt = resolveI18n(c.title, activeLang) || c.title;
        const cIssuerTxt = resolveI18n(c.issuer, activeLang) || c.issuer;
        const imgSrc = c.thumbnail || c.image;

        // Media thumbnail
        if (imgSrc) {
          const mediaWrap = ce('div', 'dp-cert-card__media');
          mediaWrap.setAttribute('role', 'button');
          mediaWrap.setAttribute('tabindex', '0');
          mediaWrap.setAttribute('aria-label', `${ui.skills?.viewCertificate || 'Xem chứng chỉ'}: ${cTitleTxt}`);

          const img = ce('img', 'dp-cert-card__img');
          img.src = imgSrc;
          img.alt = cTitleTxt;
          img.width = 480;
          img.height = 300;
          img.loading = 'lazy';
          img.decoding = 'async';
          mediaWrap.appendChild(img);

          const zoomBadge = ce('span', 'dp-cert-card__zoom-hint', '⤢');
          zoomBadge.setAttribute('aria-hidden', 'true');
          mediaWrap.appendChild(zoomBadge);

          mediaWrap.addEventListener('click', () => openCertLightbox(c));
          mediaWrap.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openCertLightbox(c);
            }
          });

          card.appendChild(mediaWrap);
        }

        // Body
        const body = ce('div', 'dp-cert-card__body');

        if (showFeaturedBadge || (showHidden && c.hidden)) {
          const badgesRow = ce('div', 'dp-cert-card__badges');
          if (showFeaturedBadge) {
            badgesRow.appendChild(ce('span', 'dp-badge-featured', ui.skills?.featuredBadge || 'Nổi bật'));
          }
          if (showHidden && c.hidden) {
            badgesRow.appendChild(ce('span', 'dp-label', '[HIDDEN]'));
          }
          body.appendChild(badgesRow);
        }

        // Meta row: date + issuer + hours
        const metaRow = ce('div', 'dp-cert-card__meta');
        metaRow.appendChild(ce('span', 'dp-cert-card__date', formatCertDate(c)));
        if (cIssuerTxt) {
          metaRow.appendChild(ce('span', 'dp-cert-card__issuer', cIssuerTxt));
        }
        if (c.verify_note) {
          metaRow.appendChild(ce('span', 'dp-cert-card__id', `ID: ${c.verify_note}`));
        }
        if (c.hours) {
          const hoursTxt = (ui.skills?.hours || '{hours} giờ').replace('{hours}', c.hours);
          metaRow.appendChild(ce('span', 'dp-cert-card__hours', hoursTxt));
        }
        body.appendChild(metaRow);

        // Title
        const titleEl = ce('h3', 'dp-cert-card__title', cTitleTxt);
        body.appendChild(titleEl);

        // Related project (if any)
        if (c.project_id) {
          const proj = (projectsData.projects || []).find(p => p.slug === c.project_id || p.id === c.project_id);
          if (proj) {
            const projTitle = resolveI18n(proj.title, activeLang) || proj.slug;
            const pWrap = ce('p', 'dp-cert-card__related');
            const pLink = ce('a', 'dp-related-link', `${ui.skills?.relatedProject || 'Dự án liên quan'}: ${projTitle} ↗`);
            pLink.href = buildTabUrl('projects', ui, proj.slug);
            pWrap.appendChild(pLink);
            body.appendChild(pWrap);
          }
        }

        // Actions
        const actions = ce('div', 'dp-cert-card__actions');
        if (c.image) {
          const viewBtn = ce('button', 'dp-btn dp-btn--sm', `${ui.skills?.viewCertificate || 'Xem ảnh'} ⤢`);
          viewBtn.type = 'button';
          viewBtn.addEventListener('click', () => openCertLightbox(c));
          actions.appendChild(viewBtn);
        }
        if (c.verify_url) {
          const verifyBtn = ce('a', 'dp-btn dp-btn--sm dp-btn--solid', `${ui.skills?.verifyCert || 'Xác thực'} ↗`);
          verifyBtn.href = c.verify_url;
          verifyBtn.target = '_blank';
          verifyBtn.rel = 'noopener noreferrer';
          verifyBtn.setAttribute('aria-label', buildVerifyAria(cTitleTxt, ui));
          actions.appendChild(verifyBtn);
        } else if (c.pdf) {
          const pdfBtn = ce('a', 'dp-btn dp-btn--sm', `${ui.skills?.openOriginalPdf || 'Mở PDF'} ↗`);
          pdfBtn.href = c.pdf;
          pdfBtn.target = '_blank';
          pdfBtn.rel = 'noopener noreferrer';
          actions.appendChild(pdfBtn);
        }

        body.appendChild(actions);
        card.appendChild(body);
        return card;
      }

      // Helper to build a ruled certificate row [thumb 2 | date 2 | title + issuer 4 | hours + related project 2 | verify 2]
      function buildCertRow(c, showFeaturedBadge) {
        const row = ce('li', 'dp-cert-row');
        if (c.id) row.id = `cert-${c.id}`;

        const cTitleTxt = resolveI18n(c.title, activeLang) || c.title;
        const cIssuerTxt = resolveI18n(c.issuer, activeLang) || c.issuer;

        // Col 1 (2 cols): Thumbnail (if exists)
        if (c.thumbnail || c.image) {
          const thumbBox = ce('div', 'dp-cert-row__thumb');
          thumbBox.setAttribute('role', 'button');
          thumbBox.setAttribute('tabindex', '0');
          thumbBox.setAttribute('aria-label', `${ui.skills?.viewCertificate || 'Xem ảnh'}: ${cTitleTxt}`);
          const thumbImg = ce('img', 'dp-cert-row__thumb-img');
          thumbImg.src = c.thumbnail || c.image;
          thumbImg.alt = cTitleTxt;
          thumbImg.width = 80;
          thumbImg.height = 52;
          thumbImg.loading = 'lazy';
          thumbImg.decoding = 'async';
          thumbBox.appendChild(thumbImg);
          thumbBox.addEventListener('click', () => openCertLightbox(c));
          thumbBox.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openCertLightbox(c);
            }
          });
          row.appendChild(thumbBox);
        } else {
          row.appendChild(ce('div', 'dp-cert-row__thumb dp-cert-row__thumb--empty'));
        }

        // Col 2 (2 cols): Date
        row.appendChild(ce('div', 'dp-cert-row__date', formatCertDate(c)));

        // Col 3 (4 cols): Title + Issuer
        const mainCol = ce('div', 'dp-cert-row__main');
        if (showFeaturedBadge || (showHidden && c.hidden)) {
          const badgesRow = ce('div', 'dp-cert-row__badges');
          if (showFeaturedBadge) {
            badgesRow.appendChild(ce('span', 'dp-badge-featured', ui.skills?.featuredBadge || 'Nổi bật'));
          }
          if (showHidden && c.hidden) {
            badgesRow.appendChild(ce('span', 'dp-label', '[HIDDEN]'));
          }
          mainCol.appendChild(badgesRow);
        }

        mainCol.appendChild(ce('h3', 'dp-cert-row__title', cTitleTxt));
        if (cIssuerTxt) {
          mainCol.appendChild(ce('p', 'dp-cert-row__meta', cIssuerTxt));
        }
        row.appendChild(mainCol);

        // Col 4 (2 cols): Hours + Related Project
        const detailsCol = ce('div', 'dp-cert-row__details');
        if (c.hours) {
          const hoursTxt = (ui.skills?.hours || '{hours} giờ').replace('{hours}', c.hours);
          detailsCol.appendChild(ce('p', 'dp-cert-row__hours dp-meta dp-meta--muted', hoursTxt));
        }

        if (c.project_id) {
          const proj = (projectsData.projects || []).find(p => p.slug === c.project_id || p.id === c.project_id);
          if (proj) {
            const projTitle = resolveI18n(proj.title, activeLang) || proj.slug;
            const pWrap = ce('p', 'dp-cert-row__related');
            const pLink = ce('a', 'dp-related-link', `${ui.skills?.relatedProject || 'Dự án liên quan'}: ${projTitle} ↗`);
            pLink.href = buildTabUrl('projects', ui, proj.slug);
            pWrap.appendChild(pLink);
            detailsCol.appendChild(pWrap);
          }
        }
        row.appendChild(detailsCol);

        // Col 5 (2 cols): Verification Link or Note (left-aligned, or empty cell without layout hole)
        const actionCol = ce('div', 'dp-cert-row__action');
        const verifyEl = createCertVerifyElement(c, cTitleTxt);
        if (verifyEl) actionCol.appendChild(verifyEl);
        row.appendChild(actionCol);

        return row;
      }

      /* ==============================================================
       * Tab 1 Panel: Giới thiệu (Home)
       * ============================================================ */
      const panelHome = ce('section', 'tab-panel');
      panelHome.id = 'panel-home';
      panelHome.dataset.tab = 'home';
      panelHome.hidden = true;

      const introSentences = resolvedIntro
        ? resolvedIntro.split(/\r?\n|(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean)
        : [];
      const isOverviewSingleLine = introSentences.length <= 1;

      // Pre-calculate summary counts for interactive navigation pillars
      const eduSchool = hasEducation
        ? profile.education.map(e => resolveI18n(e?.school, activeLang)).find(Boolean)
        : '';
      const expCompany = (!eduSchool && hasExperience)
        ? profile.experience.map(e => resolveI18n(e?.company, activeLang) || resolveI18n(e?.organization, activeLang)).find(Boolean)
        : '';
      const profileSummaryText = eduSchool || expCompany || '';

      const totalProjectsCount = Array.isArray(projectsData.projects) ? projectsData.projects.length : 0;
      const projectsSummaryText = formatPluralCount(ui.navGrid?.projectsCount, totalProjectsCount, '{n} dự án');

      const totalSkillsCount = Array.isArray(skillsData?.techStack)
        ? skillsData.techStack.reduce((sum, g) => sum + (Array.isArray(g.items) ? g.items.length : (Array.isArray(g.skills) ? g.skills.length : 0)), 0)
        : 0;
      const skillsSummaryText = formatPluralCount(ui.navGrid?.skillsCount, totalSkillsCount, '{n} kỹ năng');

      const totalCertsCount = visibleCerts.length;
      const certsSummaryText = formatPluralCount(ui.navGrid?.certsCount, totalCertsCount, '{n} chứng chỉ');

      // 1. Opening Statement (Desktop: 12/12 cols without portrait, or 9/12 left + 3/12 right portrait)
      const openingGrid = ce('div', `dp-opening dp-grid ${hasPortrait ? 'dp-opening--with-portrait' : ''}`);
      const openingMain = ce('div', 'dp-opening__main');
      const openingIntro = ce('div', 'dp-opening__intro');
      const openingTop = ce('div', 'dp-opening__meta-item');
      const openingEyebrow = ce('div', 'dp-opening__eyebrow');
      openingEyebrow.appendChild(ce('span', 'dp-red-mark'));
      openingEyebrow.appendChild(ce('span', 'dp-label dp-label--ink', hasHeroData ? `${tabNumbers.home} / ${ui.tabs?.home?.name || 'Giới thiệu'}` : (ui.emptyProfileBadge || '01 / PORTFOLIO')));
      openingTop.appendChild(openingEyebrow);

      const h1 = ce('h1', 'dp-opening__title', hasHeroData ? profile.name : (ui.meta?.title || 'Portfolio'));
      openingTop.appendChild(h1);
      openingIntro.appendChild(openingTop);

      const subBlock = ce('div', 'dp-opening__sub');
      const heroSchoolNames = Array.isArray(profile.education)
        ? profile.education.map(e => resolveI18n(e?.school, activeLang))
        : [];
      const formatLead = txt => preventOrphanWord(keepInstitutionsTogether(txt, heroSchoolNames));
      if (isOverviewSingleLine) {
        if (resolvedRole) {
          subBlock.appendChild(ce('p', 'dp-opening__role', resolvedRole));
        }
        const mergedLead = resolvedTagline || resolvedIntro;
        if (mergedLead) {
          subBlock.appendChild(ce('p', 'dp-opening__tagline', formatLead(mergedLead)));
        }
        if (resolvedStatus) {
          subBlock.appendChild(ce('p', 'dp-meta dp-meta--muted', resolvedStatus));
        }
      } else if (resolvedTagline) {
        subBlock.appendChild(ce('p', 'dp-opening__tagline', formatLead(resolvedTagline)));
        if (resolvedStatus) {
          subBlock.appendChild(ce('p', 'dp-meta dp-meta--muted', resolvedStatus));
        }
      }
      if (subBlock.children.length > 0) {
        openingIntro.appendChild(subBlock);
      }

      // Helper to render image or iframe (with mobile/touch poster + fullscreen link fallback)
      function createMediaElement(mediaCfg, fallbackTitle, isLcp, isTall, isGrayscale) {
        if (!mediaCfg || !mediaCfg.src || mediaCfg.type === 'none') return null;
        const mType = mediaCfg.type || 'image';
        const mSrc = mediaCfg.src;
        const mAlt = resolveI18n(mediaCfg.alt, activeLang) || fallbackTitle || 'Media';
        const mCaption = resolveI18n(mediaCfg.caption, activeLang);
        const mPoster = mediaCfg.poster || '';

        if (mType === 'iframe') {
          const isTouchOrMobile = window.matchMedia('(pointer: coarse), (max-width: 700px)').matches;
          if (isTouchOrMobile) {
            const wrap = ce('div', 'dp-iframe-fallback');
            if (mPoster) {
              const figCls = `dp-figure dp-figure--hero-media ${isGrayscale ? 'dp-figure--grayscale' : ''}`;
              const figure = ce('figure', figCls);
              const img = ce('img', 'dp-figure__img');
              img.src = mPoster;
              img.srcset = `${mPoster} 480w, ${mPoster} 960w`;
              img.sizes = '(max-width: 700px) calc(100vw - 32px), (max-width: 1440px) 72vw, 960px';
              img.alt = mAlt;
              img.width = 960;
              img.height = 540;
              img.loading = 'lazy';
              img.decoding = 'async';
              figure.appendChild(img);
              if (mCaption) figure.appendChild(ce('figcaption', 'dp-figure__caption', mCaption));
              wrap.appendChild(figure);
            }
            const fsBtn = ce('a', 'dp-btn dp-btn--solid dp-iframe-fallback__btn', `${ui.hero?.openFullscreen || 'Mở toàn màn hình'} ↗`);
            fsBtn.href = mSrc;
            fsBtn.target = '_blank';
            fsBtn.rel = 'noopener noreferrer';
            wrap.appendChild(fsBtn);
            return wrap;
          }

          const figure = ce('figure', 'dp-figure dp-figure--hero-media');
          const iframe = ce('iframe', 'dp-figure__iframe');
          iframe.src = mSrc;
          iframe.title = mAlt;
          iframe.width = '960';
          iframe.height = '540';
          iframe.loading = 'lazy';
          figure.appendChild(iframe);
          if (mCaption) figure.appendChild(ce('figcaption', 'dp-figure__caption', mCaption));
          return figure;
        }

        const figCls = `dp-figure ${isTall ? 'dp-figure--tall' : 'dp-figure--hero-media'} ${isGrayscale ? 'dp-figure--grayscale' : ''}`;
        const figure = ce('figure', figCls);
        const img = ce('img', 'dp-figure__img');
        img.src = mSrc;
        img.srcset = mediaCfg.srcset || `${mSrc} 480w, ${mSrc} 960w`;
        img.sizes = isTall
          ? '(max-width: 700px) calc(100vw - 32px), 480px'
          : '(max-width: 700px) calc(100vw - 32px), (max-width: 1440px) 72vw, 960px';
        img.alt = mAlt;
        img.width = isTall ? 480 : 960;
        img.height = isTall ? 600 : 540;
        img.loading = isLcp ? 'eager' : 'lazy';
        if (isLcp) img.setAttribute('fetchpriority', 'high');
        img.decoding = 'async';
        figure.appendChild(img);
        if (mCaption) {
          figure.appendChild(ce('figcaption', 'dp-figure__caption', mCaption));
        }
        return figure;
      }

      if (
        profile.hero_media &&
        profile.hero_media.src &&
        profile.hero_media.type !== 'none' &&
        !profile.hero_media.link_project &&
        !hasProjects
      ) {
        const heroMediaEl = createMediaElement(profile.hero_media, profile.name, !hasPortrait, false, false);
        if (heroMediaEl) {
          openingIntro.appendChild(heroMediaEl);
        }
      }

      openingMain.appendChild(openingIntro);

      // 4 Interactive Navigation Pillars inside Hero (Option 2 Layout)
      const heroCardsGrid = ce('div', 'dp-hero-cards');
      const heroCardsList = [
        {
          key: 'profile',
          iconSvg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
          badge: `${tabNumbers.profile || '02'} →`,
          title: ui.heroCards?.profileTitle || (activeLang === 'vi' ? 'Hồ sơ Học vấn' : (activeLang === 'fr' ? 'Profil académique' : 'Academic Profile')),
          summary: profileSummaryText || (activeLang === 'vi' ? 'ĐH Xây dựng Hà Nội' : 'Hanoi University of Civil Engineering'),
          href: buildTabUrl('profile', ui)
        },
        {
          key: 'projects',
          iconSvg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
          badge: `${tabNumbers.projects || '03'} →`,
          title: ui.heroCards?.projectsTitle || (activeLang === 'vi' ? 'Dự án Phân tích' : (activeLang === 'fr' ? 'Projets d\'analyse' : 'Analysis Projects')),
          summary: ui.heroCards?.projectsSummaryTmpl
            ? formatPluralCount(ui.heroCards.projectsSummaryTmpl, totalProjectsCount, '{n} dự án thực chiến (SQL)')
            : (activeLang === 'vi' ? `${totalProjectsCount} dự án thực chiến (SQL)` : `${totalProjectsCount} hands-on SQL project`),
          href: buildTabUrl('projects', ui)
        },
        {
          key: 'skills',
          iconSvg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
          badge: `${tabNumbers.skills || '04'} →`,
          title: ui.heroCards?.skillsTitle || (activeLang === 'vi' ? 'Kỹ năng & Tools' : (activeLang === 'fr' ? 'Compétences & Outils' : 'Skills & Tooling')),
          summary: ui.heroCards?.skillsSummaryTmpl
            ? formatPluralCount(ui.heroCards.skillsSummaryTmpl, totalSkillsCount, '{n} công cụ dữ liệu')
            : (activeLang === 'vi' ? `${totalSkillsCount} công cụ dữ liệu` : `${totalSkillsCount} data tools`),
          href: `${window.location.search}#/ky-nang`
        },
        {
          key: 'certificates',
          iconSvg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
          badge: activeLang === 'vi' ? 'CHỨNG CHỈ →' : (activeLang === 'fr' ? 'CERTIF →' : 'CERTS →'),
          title: ui.heroCards?.certsTitle || (activeLang === 'vi' ? 'Chứng chỉ Quốc tế' : (activeLang === 'fr' ? 'Certifications' : 'Certifications')),
          summary: ui.heroCards?.certsSummaryTmpl
            ? formatPluralCount(ui.heroCards.certsSummaryTmpl, totalCertsCount, '{n} chứng chỉ xác thực')
            : (activeLang === 'vi' ? `${totalCertsCount} chứng chỉ xác thực` : `${totalCertsCount} verified certificates`),
          href: `${window.location.search}#/ky-nang#chung-chi`
        }
      ];

      heroCardsList.forEach(p => {
        const card = ce('a', 'dp-hero-card');
        card.href = p.href;

        const hdr = ce('div', 'dp-hero-card__header');
        const iconWrap = ce('span', 'dp-hero-card__icon');
        iconWrap.innerHTML = p.iconSvg;
        hdr.appendChild(iconWrap);
        hdr.appendChild(ce('span', 'dp-hero-card__badge', p.badge));
        card.appendChild(hdr);

        const bdy = ce('div', 'dp-hero-card__body');
        bdy.appendChild(ce('div', 'dp-hero-card__title', p.title));
        bdy.appendChild(ce('div', 'dp-hero-card__summary', p.summary));
        card.appendChild(bdy);

        heroCardsGrid.appendChild(card);
      });

      openingMain.appendChild(heroCardsGrid);

      // Hero Actions (Modern Style 1: Rounded 8px, Soft Borders)
      const openingActions = ce('div', 'dp-opening__actions');
      if (profile.cvLink) {
        const cvBtn = ce('a', 'dp-btn', `${ui.hero?.cv || 'Tải CV'} ↗`);
        cvBtn.href = profile.cvLink;
        cvBtn.target = '_blank';
        cvBtn.rel = 'noopener noreferrer';
        openingActions.appendChild(cvBtn);
      }
      if (hasContact) {
        const contactBtn = ce('a', 'dp-btn dp-btn--solid', `${ui.hero?.contact || 'Liên hệ ngay'} →`);
        contactBtn.href = buildTabUrl('contact', ui);
        openingActions.appendChild(contactBtn);
      }
      if (hasProjects) {
        const firstProj = (projectsData.projects || [])[0];
        const projBtnText = totalProjectsCount > 1
          ? (ui.hero?.viewProjects || 'Xem tất cả dự án')
          : (activeLang === 'vi' ? 'Xem dự án SQL' : (activeLang === 'fr' ? 'Voir le projet SQL' : 'View SQL Project'));
        const projBtn = ce('a', 'dp-btn', `${projBtnText} →`);
        projBtn.href = totalProjectsCount > 1 ? buildTabUrl('projects', ui) : buildTabUrl('projects', ui, firstProj?.slug);
        openingActions.appendChild(projBtn);
      }
      if (openingActions.children.length > 0) {
        openingMain.appendChild(openingActions);
      }

      openingGrid.appendChild(openingMain);

      // Right Column (3/12 cols on Desktop, max 360px): ONLY rendered when portrait exists
      if (hasPortrait && profile.portrait) {
        const openingAside = ce('div', 'dp-opening__aside');
        const isPortraitGrayscale = profile.portrait.grayscale !== false;
        const portraitFig = ce('figure', `dp-portrait ${isPortraitGrayscale ? 'dp-portrait--grayscale' : ''}`);
        const portraitMedia = ce('div', 'dp-portrait__media');
        const portraitSizes = '(max-width: 700px) calc(100vw - 32px), (max-width: 1440px) 25vw, 360px';

        const rawAlt = resolveI18n(profile.portrait.alt, activeLang);
        const fallbackAltTmpl = ui.hero?.portraitAlt || (
          activeLang === 'fr' ? 'Portrait de {name}' :
          activeLang === 'en' ? 'Portrait of {name}' :
          'Chân dung của {name}'
        );
        const portraitAlt = (rawAlt && String(rawAlt).trim())
          ? String(rawAlt).trim()
          : fallbackAltTmpl.replace('{name}', (profile.name && profile.name.trim()) || (ui.meta?.title || 'Portfolio'));

        const picture = document.createElement('picture');
        picture.className = 'dp-portrait__picture';

        const isSvgPortrait = /\.svg$/i.test(rawPortraitSrc);
        const basePortraitPrefix = rawPortraitSrc.replace(/(?:-(?:480|800|1200))?\.(?:avif|webp|jpe?g|png)$/i, '');

        if (!isSvgPortrait) {
          const srcAvif = document.createElement('source');
          srcAvif.type = 'image/avif';
          srcAvif.srcset = `${basePortraitPrefix}-480.avif 480w, ${basePortraitPrefix}-800.avif 800w, ${basePortraitPrefix}-1200.avif 1200w`;
          srcAvif.sizes = portraitSizes;
          picture.appendChild(srcAvif);

          const srcWebp = document.createElement('source');
          srcWebp.type = 'image/webp';
          srcWebp.srcset = `${basePortraitPrefix}-480.webp 480w, ${basePortraitPrefix}-800.webp 800w, ${basePortraitPrefix}-1200.webp 1200w`;
          srcWebp.sizes = portraitSizes;
          picture.appendChild(srcWebp);
        }

        const pImg = ce('img', 'dp-portrait__img');
        pImg.src = isSvgPortrait ? rawPortraitSrc : `${basePortraitPrefix}-800.jpg`;
        pImg.srcset = isSvgPortrait
          ? `${rawPortraitSrc} 480w, ${rawPortraitSrc} 800w, ${rawPortraitSrc} 1200w`
          : `${basePortraitPrefix}-480.jpg 480w, ${basePortraitPrefix}-800.jpg 800w, ${basePortraitPrefix}-1200.jpg 1200w`;
        pImg.sizes = portraitSizes;
        pImg.alt = portraitAlt;
        pImg.width = 800;
        pImg.height = 1000;
        pImg.setAttribute('fetchpriority', 'high');
        pImg.decoding = 'async';
        pImg.addEventListener('error', () => {
          portraitExistenceCache.set(rawPortraitSrc, false);
          openingAside.remove();
          openingGrid.classList.remove('dp-opening--with-portrait');
        });

        picture.appendChild(pImg);
        portraitMedia.appendChild(picture);

        const redSquare = ce('span', 'dp-portrait__mark');
        redSquare.setAttribute('aria-hidden', 'true');
        portraitMedia.appendChild(redSquare);
        portraitFig.appendChild(portraitMedia);

        const caption = ce('figcaption', 'dp-portrait__caption');
        if (profile.name && profile.name.trim()) {
          caption.appendChild(ce('span', 'dp-portrait__name', profile.name.trim()));
        }
        if (resolvedRole) {
          caption.appendChild(ce('span', 'dp-portrait__role', resolvedRole));
        }
        if (caption.children.length > 0) {
          portraitFig.appendChild(caption);
        }

        openingAside.appendChild(portraitFig);
        openingGrid.appendChild(openingAside);
      }

      panelHome.appendChild(openingGrid);

      let homeSubIdx = 1;

      // 2. Overview section: ONLY rendered if it has > 1 line of text (otherwise merged into Hero above)
      if (!isOverviewSingleLine && (resolvedRole || resolvedIntro)) {
        const introSec = ce('div', 'dp-section dp-grid');
        introSec.appendChild(createRail(`${tabNumbers.home}.${homeSubIdx++}`, ui.rail?.overview || 'TỔNG QUAN', ui.tabs?.home?.name || 'Giới thiệu'));

        const introContent = ce('div', 'dp-content');
        const introGrid = ce('div', 'dp-intro-grid');
        const textCol = ce('div', 'dp-intro-grid__text');

        if (resolvedRole) {
          textCol.appendChild(ce('p', 'dp-role-heading', resolvedRole));
        }
        if (resolvedIntro) {
          textCol.appendChild(ce('p', 'dp-lead-text', resolvedIntro));
        }
        introGrid.appendChild(textCol);
        introContent.appendChild(introGrid);
        introSec.appendChild(introContent);
        panelHome.appendChild(introSec);
      }

      // 3. Home Featured Projects FIRST (Desktop Col 4-12: a) title 24px + 2px bottom rule, b) [metric 3 cols | summary + button 6 cols], c) 9-col 16:9 media, d) 12px caption with thin top rule, e) view all projects button aligned with Col 4)
      const homeFeaturedProjects = hasProjects
        ? projectsData.projects.filter(p => p.featured !== false).slice(0, 3)
        : [];
      const showHomeProjBadge = hasMixedFeatured(homeFeaturedProjects);

      if (homeFeaturedProjects.length > 0) {
        const fpSec = ce('div', 'dp-section dp-grid');
        fpSec.appendChild(createRail(tabNumbers.projects || '03', ui.rail?.projects || 'DỰ ÁN', ui.projects?.title || 'Dự án tiêu biểu'));
        const fpContent = ce('div', 'dp-content');
        const fpList = ce('div', 'dp-projects-list');

        homeFeaturedProjects.forEach((p, idx) => {
          const pTitle = resolveI18n(p.title, activeLang);
          const rawProblem = resolveI18n(p.problem, activeLang) || resolveI18n(p.context, activeLang) || '';
          const rawSummary = resolveI18n(p.summary, activeLang) || '';
          const rawResult = resolveI18n(p.result, activeLang) || '';
          let descText = rawProblem
            ? (rawProblem.split(/(?<=[.!?])\s+/)[0] || rawProblem)
            : rawSummary;
          if (descText && descText.length < 130) {
            const extra = (descText !== rawSummary && rawSummary) ? rawSummary : rawResult;
            if (extra && !descText.includes(extra)) {
              descText = `${descText} ${extra}`;
            }
          }

          // Resolve hero_media for this project if available
          let resolvedMediaObj = null;
          if (p.hero_media && p.hero_media.src && p.hero_media.type !== 'none') {
            resolvedMediaObj = p.hero_media;
          } else if (p.figure?.src || p.image) {
            resolvedMediaObj = {
              type: 'image',
              src: p.figure?.src || p.image,
              srcset: p.figure?.srcset,
              alt: p.title,
              caption: p.figure?.caption
            };
          }

          const card = ce('article', 'dp-project-featured dp-project-featured--home');
          if (showHomeProjBadge && p.featured) {
            const head = ce('div', 'dp-project-featured__head');
            head.appendChild(ce('span', 'dp-badge-featured', ui.skills?.featuredBadge || 'Nổi bật'));
            card.appendChild(head);
          }

          // a) Project title (item-title 24px) with 2px rule below
          if (pTitle) {
            card.appendChild(ce('h3', 'dp-project-featured__title', pTitle));
          }

          // b) 2-part row: [result_metric + label (3 cols) | 2-3 line description + "Xem dự án →" button (6 cols)], top-aligned
          const hasMetric = Boolean(p.result_metric && p.result_metric.value);
          const rowEl = ce('div', 'dp-project-featured__row');

          if (hasMetric) {
            const metricBox = ce('div', 'dp-metric dp-metric--display dp-project-featured__metric');
            metricBox.appendChild(ce('span', 'dp-metric__value', formatMetricValue(p.result_metric.value)));
            const mLbl = resolveI18n(p.result_metric.label, activeLang);
            if (mLbl) metricBox.appendChild(ce('span', 'dp-metric__label', mLbl));
            rowEl.appendChild(metricBox);
          }

          const infoCol = ce('div', `dp-project-featured__info ${!hasMetric ? 'dp-project-featured__info--full' : ''}`);
          if (descText) {
            infoCol.appendChild(ce('p', 'dp-project-featured__summary', descText));
          }

          const actions = ce('div', 'dp-project-actions');
          const detailLinkText = activeLang === 'vi' ? 'Xem chi tiết dự án SQL' : (activeLang === 'fr' ? 'Détails du projet SQL' : 'View SQL Project Details');
          const detailLink = ce('a', 'dp-btn dp-btn--solid', `${detailLinkText} ↗`);
          detailLink.href = buildTabUrl('projects', ui, p.slug);
          actions.appendChild(detailLink);

          if ((projectsData.projects || []).length > 1) {
            const allProjBtn = ce('a', 'dp-btn--link', `${ui.hero?.viewProjects || 'Xem tất cả dự án'} →`);
            allProjBtn.href = buildTabUrl('projects', ui);
            actions.appendChild(allProjBtn);
          }

          infoCol.appendChild(actions);

          rowEl.appendChild(infoCol);
          card.appendChild(rowEl);

          // c) & d) Compact teaser media (max-height ~220px, subtle frame, clickable link to project)
          const mediaEl = createMediaElement(resolvedMediaObj, pTitle, !hasPortrait && idx === 0, false, Boolean(p.grayscale));
          if (mediaEl) {
            const mediaCol = ce('div', 'dp-project-featured__media');
            const mediaLink = ce('a', 'dp-project-featured__media-link');
            mediaLink.href = buildTabUrl('projects', ui, p.slug);
            mediaLink.setAttribute('aria-label', `${ui.projects?.viewProject || 'Xem dự án'}: ${pTitle}`);
            mediaLink.appendChild(mediaEl);
            mediaCol.appendChild(mediaLink);
            card.appendChild(mediaCol);
          }

          fpList.appendChild(card);
        });

        fpContent.appendChild(fpList);
        fpSec.appendChild(fpContent);
        panelHome.appendChild(fpSec);
      }

      // 3.5. Home Tech Stack & Core Skills (from skillsData.techStack)
      const techStackGroups = Array.isArray(skillsData?.techStack) ? skillsData.techStack : [];
      if (techStackGroups.length > 0) {
        const tsSec = ce('div', 'dp-section dp-grid dp-section--techstack');
        tsSec.appendChild(createRail(
          tabNumbers.skills || '04',
          ui.rail?.skills || 'KỸ NĂNG',
          ui.skills?.techStackTitle || 'Công nghệ & Công cụ'
        ));

        const tsContent = ce('div', 'dp-content');
        const tsWrapper = ce('div', 'dp-techstack');

        techStackGroups.forEach(grp => {
          const grpEl = ce('div', 'dp-techstack__group');
          const catTitle = resolveI18n(grp.category, activeLang) || grp.category;
          if (catTitle) {
            grpEl.appendChild(ce('h3', 'dp-techstack__heading', catTitle));
          }

          const gridEl = ce('div', 'dp-techstack__grid');
          (grp.items || []).forEach(item => {
            const tile = ce('div', 'dp-techstack__tile');
            if (item.slug) tile.dataset.slug = item.slug;
            tile.setAttribute('title', item.name);
            tile.setAttribute('tabindex', '0');
            tile.setAttribute('role', 'img');
            tile.setAttribute('aria-label', item.name);

            const img = ce('img', 'dp-techstack__icon');
            img.src = item.icon;
            img.alt = item.name;
            img.width = 34;
            img.height = 34;
            img.loading = 'lazy';
            img.decoding = 'async';
            tile.appendChild(img);

            const label = ce('span', 'dp-techstack__name', item.name);
            tile.appendChild(label);

            gridEl.appendChild(tile);
          });

          grpEl.appendChild(gridEl);
          tsWrapper.appendChild(grpEl);
        });

        tsContent.appendChild(tsWrapper);
        tsSec.appendChild(tsContent);
        panelHome.appendChild(tsSec);
      }

      // Bottom nav-tiles replaced by Hero navigation cards

      main.appendChild(panelHome);

      /* ==============================================================
       * Tab 2 Panel: Hồ sơ (Education & Experience)
       * ============================================================ */
      const panelProfile = ce('section', 'tab-panel');
      panelProfile.id = 'panel-profile';
      panelProfile.dataset.tab = 'profile';
      panelProfile.hidden = true;

      const profTabNum = tabNumbers.profile || '02';
      let profSubIdx = 1;

      if (hasEducation) {
        const eduSec = ce('div', 'dp-section dp-grid');
        eduSec.appendChild(createRail(`${profTabNum}.${profSubIdx++}`, ui.rail?.profile || ui.tabs?.profile?.name || 'HỒ SƠ', ui.profileSection?.educationTitle || 'Học vấn & Đào tạo'));

        const eduContent = ce('div', 'dp-content');
        const eduList = ce('ul', 'dp-entry-list');

        const sortedEdu = [...profile.education].sort((a, b) => {
          return extractLatestYear(resolveI18n(b.year, activeLang)) - extractLatestYear(resolveI18n(a.year, activeLang));
        });

        sortedEdu.forEach(item => {
          const li = ce('li', 'dp-profile-row');
          const itemYear = resolveI18n(item.year, activeLang);
          const itemDegree = resolveI18n(item.degree, activeLang);
          const itemSchool = resolveI18n(item.school, activeLang);
          const itemDetails = resolveI18n(item.details, activeLang);

          li.appendChild(ce('div', 'dp-profile-row__time', itemYear || ''));

          const mainCol = ce('div', 'dp-profile-row__main');
          if (itemDegree) mainCol.appendChild(ce('h3', 'dp-profile-row__title', itemDegree));
          if (itemSchool) mainCol.appendChild(ce('p', 'dp-profile-row__sub', itemSchool));
          if (itemDetails) mainCol.appendChild(ce('p', 'dp-profile-row__desc', itemDetails));
          li.appendChild(mainCol);

          eduList.appendChild(li);
        });

        eduContent.appendChild(eduList);
        eduSec.appendChild(eduContent);
        panelProfile.appendChild(eduSec);
      }

      if (hasExperience) {
        const expSec = ce('div', 'dp-section dp-grid');
        expSec.appendChild(createRail(`${profTabNum}.${profSubIdx++}`, ui.rail?.profile || ui.tabs?.profile?.name || 'HỒ SƠ', ui.profileSection?.experienceTitle || 'Kinh nghiệm làm việc'));

        const expContent = ce('div', 'dp-content');
        const expList = ce('ul', 'dp-entry-list');

        const sortedExp = [...profile.experience].sort((a, b) => {
          const pA = resolveI18n(a.period, activeLang) || resolveI18n(a.year, activeLang);
          const pB = resolveI18n(b.period, activeLang) || resolveI18n(b.year, activeLang);
          return extractLatestYear(pB) - extractLatestYear(pA);
        });

        sortedExp.forEach(item => {
          const li = ce('li', 'dp-profile-row');
          const itemPeriod = resolveI18n(item.period, activeLang) || resolveI18n(item.year, activeLang);
          const itemRole = resolveI18n(item.role, activeLang);
          const itemCompany = resolveI18n(item.company, activeLang) || resolveI18n(item.organization, activeLang);
          const itemDesc = resolveI18n(item.description, activeLang) || resolveI18n(item.details, activeLang);

          li.appendChild(ce('div', 'dp-profile-row__time', itemPeriod || ''));

          const mainCol = ce('div', 'dp-profile-row__main');
          if (itemRole) mainCol.appendChild(ce('h3', 'dp-profile-row__title', itemRole));
          if (itemCompany) mainCol.appendChild(ce('p', 'dp-profile-row__sub', itemCompany));
          if (itemDesc) mainCol.appendChild(ce('p', 'dp-profile-row__desc', itemDesc));
          li.appendChild(mainCol);

          expList.appendChild(li);
        });

        expContent.appendChild(expList);
        expSec.appendChild(expContent);
        panelProfile.appendChild(expSec);
      }

      main.appendChild(panelProfile);

      /* ==============================================================
       * Tab 3 Panel: Dự án (Projects)
       * ============================================================ */
      const panelProjects = ce('section', 'tab-panel');
      panelProjects.id = 'panel-projects';
      panelProjects.dataset.tab = 'projects';
      panelProjects.hidden = true;

      const projTabNum = tabNumbers.projects || '03';
      const gridView = ce('div', 'projects-grid-view');
      gridView.id = 'projects-grid-view';

      if (hasProjects) {
        const allTags = new Set();
        projectsData.projects.forEach(p => {
          if (Array.isArray(p.tags)) p.tags.forEach(t => allTags.add(t));
        });

        const featuredProjs = projectsData.projects.filter(p => p.featured !== false);
        const secondaryProjs = projectsData.projects.filter(p => p.featured === false);
        const showFeaturedProjBadge = hasMixedFeatured(featuredProjs);

        // Featured Projects Section (with Filter Bar at top of Col 4-12)
        const featSec = ce('div', 'dp-section dp-grid');
        featSec.id = 'projects-featured-section';
        featSec.appendChild(createRail(`${projTabNum}.1`, ui.rail?.projects || ui.tabs?.projects?.name || 'DỰ ÁN', ui.projects?.title || 'Dự án tiêu biểu'));

        const featContent = ce('div', 'dp-content');

        if (allTags.size > 0) {
          const filterBar = ce('div', 'dp-filter-bar filter-bar');
          filterBar.setAttribute('role', 'group');
          filterBar.setAttribute('aria-label', ui.projects?.technologies || 'Filter');

          const allBtn = ce('button', 'dp-filter-btn filter-btn active', ui.projects?.filterAll || 'Tất cả');
          allBtn.type = 'button';
          allBtn.dataset.filter = 'all';
          allBtn.setAttribute('aria-pressed', 'true');
          filterBar.appendChild(allBtn);

          allTags.forEach(tag => {
            const btn = ce('button', 'dp-filter-btn filter-btn', tag);
            btn.type = 'button';
            btn.dataset.filter = tag;
            btn.setAttribute('aria-pressed', 'false');
            filterBar.appendChild(btn);
          });
          featContent.appendChild(filterBar);
        }

        const featList = ce('div', 'dp-projects-list');
        featuredProjs.forEach((p, idx) => {
          const pTitle = resolveI18n(p.title, activeLang);
          const pSummary = resolveI18n(p.summary, activeLang);
          const card = ce('article', 'dp-project-featured project-card');
          card.dataset.tags = Array.isArray(p.tags) ? p.tags.join(' ') : '';

          if (showFeaturedProjBadge && p.featured) {
            const head = ce('div', 'dp-project-featured__head');
            head.appendChild(ce('span', 'dp-badge-featured', ui.skills?.featuredBadge || 'Nổi bật'));
            card.appendChild(head);
          }

          const pGrid = ce('div', 'dp-project-featured__grid');
          const figSrc = p.figure?.src || p.image;

          if (figSrc) {
            const mediaCol = ce('div', 'dp-project-featured__media');
            const figCls = `dp-figure dp-figure--tall ${p.grayscale ? 'dp-figure--grayscale' : ''}`;
            const figure = ce('figure', figCls);
            const img = ce('img', 'dp-figure__img');
            img.src = figSrc;
            img.srcset = p.figure?.srcset || `${figSrc} 480w, ${figSrc} 960w`;
            img.sizes = '(max-width: 700px) calc(100vw - 32px), 480px';
            img.alt = pTitle;
            img.width = 480;
            img.height = 600;
            img.loading = 'lazy';
            img.decoding = 'async';
            figure.appendChild(img);

            const capText = resolveI18n(p.figure?.caption, activeLang) || `${ui.projects?.figurePrefix || 'Hình'} ${idx + 1}. ${pTitle}`;
            figure.appendChild(ce('figcaption', 'dp-figure__caption', capText));
            mediaCol.appendChild(figure);
            pGrid.appendChild(mediaCol);
          }

          const bodyCol = ce('div', `dp-project-featured__body ${!figSrc ? 'dp-project-featured__body--full' : ''}`);
          bodyCol.appendChild(ce('h3', 'dp-project-featured__title', pTitle));
          if (pSummary) bodyCol.appendChild(ce('p', 'dp-project-featured__summary', pSummary));

          if (p.result_metric && p.result_metric.value) {
            const metricBox = ce('div', 'dp-metric');
            metricBox.appendChild(ce('span', 'dp-metric__value', formatMetricValue(p.result_metric.value)));
            const mLbl = resolveI18n(p.result_metric.label, activeLang);
            if (mLbl) metricBox.appendChild(ce('span', 'dp-metric__label', mLbl));
            bodyCol.appendChild(metricBox);
          }

          const factTable = createFactTable(p, ui, activeLang, true);
          if (factTable) bodyCol.appendChild(factTable);

          const actions = ce('div', 'dp-project-actions');
          const detailBtn = ce('a', 'dp-btn dp-btn--solid', `${ui.projects?.viewProject || 'Xem dự án'} →`);
          detailBtn.href = buildTabUrl('projects', ui, p.slug);
          actions.appendChild(detailBtn);

          if (p.githubLink) {
            const ghBtn = ce('a', 'dp-btn', `${ui.projects?.sourceCode || 'Mã nguồn'} ↗`);
            ghBtn.href = p.githubLink;
            ghBtn.target = '_blank';
            ghBtn.rel = 'noopener noreferrer';
            actions.appendChild(ghBtn);
          }
          if (p.demoLink) {
            const dmBtn = ce('a', 'dp-btn', `${ui.projects?.demo || 'Demo'} ↗`);
            dmBtn.href = p.demoLink;
            dmBtn.target = '_blank';
            dmBtn.rel = 'noopener noreferrer';
            actions.appendChild(dmBtn);
          }
          if (p.pdfLink) {
            const pdfBtn = ce('a', 'dp-btn', `${ui.projects?.viewReport || 'Báo cáo PDF'} ↗`);
            pdfBtn.href = p.pdfLink;
            pdfBtn.target = '_blank';
            pdfBtn.rel = 'noopener noreferrer';
            actions.appendChild(pdfBtn);
          }

          bodyCol.appendChild(actions);
          pGrid.appendChild(bodyCol);
          card.appendChild(pGrid);
          featList.appendChild(card);
        });

        featContent.appendChild(featList);
        featSec.appendChild(featContent);
        gridView.appendChild(featSec);

        // Secondary Projects 3-Column Ruled Matrix
        if (secondaryProjs.length > 0) {
          const secSec = ce('div', 'dp-section dp-grid');
          secSec.id = 'projects-secondary-section';
          secSec.appendChild(createRail(`${projTabNum}.2`, ui.rail?.archive || 'LƯU TRỮ', ui.projects?.archiveTitle || ui.tabs?.projects?.name || 'Dự án'));

          const secContent = ce('div', 'dp-content');
          const matrix3 = ce('div', 'dp-matrix-3');

          secondaryProjs.forEach(p => {
            const pTitle = resolveI18n(p.title, activeLang);
            const pSummary = resolveI18n(p.summary, activeLang);
            const cell = ce('article', 'dp-matrix-3__cell project-card');
            const cardTags = Array.isArray(p.tags) ? p.tags.join(' ') : '';
            cell.dataset.tags = cardTags;

            const topPart = ce('div', 'dp-matrix-3__top');
            if (p.year) topPart.appendChild(ce('span', 'dp-label', p.year));
            topPart.appendChild(ce('h3', 'dp-matrix-3__title', pTitle));
            if (pSummary) topPart.appendChild(ce('p', 'dp-matrix-3__desc', pSummary));
            cell.appendChild(topPart);

            const bottomPart = ce('div', 'dp-opening__meta-item');
            if (p.result_metric && p.result_metric.value) {
              bottomPart.appendChild(ce('span', 'dp-metric__value', formatMetricValue(p.result_metric.value)));
              const mLbl = resolveI18n(p.result_metric.label, activeLang);
              if (mLbl) bottomPart.appendChild(ce('span', 'dp-meta dp-meta--muted', mLbl));
            }
            if (Array.isArray(p.tags) && p.tags.length > 0) {
              bottomPart.appendChild(ce('p', 'dp-meta dp-meta--muted', p.tags.slice(0, 4).join(' · ')));
            }
            const viewLink = ce('a', 'dp-verify-link', `${ui.projects?.viewProject || 'Xem dự án'} →`);
            viewLink.href = buildTabUrl('projects', ui, p.slug);
            bottomPart.appendChild(viewLink);

            cell.appendChild(bottomPart);
            matrix3.appendChild(cell);
          });

          secContent.appendChild(matrix3);
          secSec.appendChild(secContent);
          gridView.appendChild(secSec);
        }
      }

      panelProjects.appendChild(gridView);

      const detailView = ce('div', 'project-detail-view');
      detailView.id = 'project-detail-view';
      detailView.hidden = true;
      panelProjects.appendChild(detailView);

      main.appendChild(panelProjects);

      /* ==============================================================
       * Tab 4 Panel: Kỹ năng & Chứng chỉ (Blocks A – F)
       * ============================================================ */
      const panelSkills = ce('section', 'tab-panel');
      panelSkills.id = 'panel-skills';
      panelSkills.dataset.tab = 'skills';
      panelSkills.hidden = true;

      const skillsTabNum = tabNumbers.skills || '04';
      let skillsSubIdx = 1;

      // Block 0. Visual Tech Stack & Tools (skillsData.techStack)
      const skillsTechGroups = Array.isArray(skillsData?.techStack) ? skillsData.techStack : [];
      if (skillsTechGroups.length > 0) {
        const tsSec = ce('div', 'dp-section dp-grid dp-section--techstack');
        tsSec.appendChild(createRail(
          `${skillsTabNum}.${skillsSubIdx++}`,
          ui.rail?.skills || 'KỸ NĂNG',
          ui.skills?.techStackTitle || 'Công nghệ & Công cụ'
        ));

        const tsContent = ce('div', 'dp-content');
        const tsWrapper = ce('div', 'dp-techstack');

        skillsTechGroups.forEach(grp => {
          const grpEl = ce('div', 'dp-techstack__group');
          const catTitle = resolveI18n(grp.category, activeLang) || grp.category;
          if (catTitle) {
            grpEl.appendChild(ce('h3', 'dp-techstack__heading', catTitle));
          }

          const gridEl = ce('div', 'dp-techstack__grid');
          (grp.items || []).forEach(item => {
            const tile = ce('div', 'dp-techstack__tile');
            if (item.slug) tile.dataset.slug = item.slug;
            tile.setAttribute('title', item.name);
            tile.setAttribute('tabindex', '0');
            tile.setAttribute('role', 'img');
            tile.setAttribute('aria-label', item.name);

            const img = ce('img', 'dp-techstack__icon');
            img.src = item.icon;
            img.alt = item.name;
            img.width = 34;
            img.height = 34;
            img.loading = 'lazy';
            img.decoding = 'async';
            tile.appendChild(img);

            const label = ce('span', 'dp-techstack__name', item.name);
            tile.appendChild(label);

            gridEl.appendChild(tile);
          });

          grpEl.appendChild(gridEl);
          tsWrapper.appendChild(grpEl);
        });

        tsContent.appendChild(tsWrapper);
        tsSec.appendChild(tsContent);
        panelSkills.appendChild(tsSec);
      }

      if (hasCertificates) {
        let certsAnchorAssigned = false;
        const assignCertAnchor = secEl => {
          if (!certsAnchorAssigned) {
            secEl.id = 'chung-chi';
            certsAnchorAssigned = true;
          }
        };

        const featuredCerts = visibleCerts.filter(c => c.featured).sort((a, b) => (a.order || 99) - (b.order || 99));
        const courseCerts = visibleCerts.filter(c => c.type === 'course' && c.status !== 'in_progress' && c.status !== 'planned');
        const inProgressCerts = visibleCerts.filter(c => c.status === 'in_progress' || c.status === 'planned');
        const groupedCerts = visibleCerts.filter(c => !c.featured && c.type !== 'course' && c.status !== 'in_progress' && c.status !== 'planned' && c.group && c.group.trim() !== '');
        const categoryCerts = visibleCerts.filter(c => !c.featured && c.type !== 'course' && c.status !== 'in_progress' && c.status !== 'planned' && (!c.group || c.group.trim() === '') && (c.type === 'certificate' || c.type === 'badge' || !c.type));

        // Block B. Nổi bật (featured = true, max 4)
        if (featuredCerts.length > 0) {
          const featSec = ce('div', 'dp-section dp-grid');
          assignCertAnchor(featSec);
          featSec.appendChild(createRail(`${skillsTabNum}.${skillsSubIdx++}`, ui.rail?.certificates || ui.skills?.featuredBadge || 'CHỨNG CHỈ', ui.skills?.featuredTitle || 'Chứng chỉ nổi bật'));

          const featContent = ce('div', 'dp-content');
          const topFeatCerts = featuredCerts;
          const showFeatCertBadge = hasMixedFeatured(topFeatCerts);
          const featGrid = ce('div', 'dp-cert-cards-grid');
          topFeatCerts.forEach(c => {
            featGrid.appendChild(buildFeaturedCertCard(c, showFeatCertBadge && Boolean(c.featured)));
          });
          featContent.appendChild(featGrid);
          featSec.appendChild(featContent);
          panelSkills.appendChild(featSec);
        }

        // Block C. Theo lĩnh vực (with rectangular filter buttons)
        if (categoryCerts.length > 0) {
          const catSec = ce('div', 'dp-section dp-grid certs-by-category-block');
          assignCertAnchor(catSec);
          catSec.appendChild(createRail(`${skillsTabNum}.${skillsSubIdx++}`, ui.rail?.categories || ui.tabs?.skills?.name || 'PHÂN LOẠI', ui.skills?.byCategoryTitle || 'Chứng chỉ theo lĩnh vực'));

          const catContent = ce('div', 'dp-content');
          const catMap = {};
          categoryCerts.forEach(c => {
            const cat = c.category || 'other';
            if (!catMap[cat]) catMap[cat] = [];
            catMap[cat].push(c);
          });

          Object.keys(catMap).forEach(cat => {
            catMap[cat].sort((a, b) => {
              const yA = parseInt(a.year, 10) || 0;
              const yB = parseInt(b.year, 10) || 0;
              if (yB !== yA) return yB - yA;
              const mA = parseInt(a.month, 10) || 0;
              const mB = parseInt(b.month, 10) || 0;
              if (mB !== mA) return mB - mA;
              return (a.order || 99) - (b.order || 99);
            });
          });

          const activeCats = Object.keys(catMap);

          if (activeCats.length >= 2) {
            const filterBar = ce('div', 'dp-filter-bar filter-bar filter-bar--certs');
            filterBar.setAttribute('role', 'group');
            filterBar.setAttribute('aria-label', ui.skills?.byCategoryTitle || 'Filter');

            const allBtn = ce('button', 'dp-filter-btn filter-btn active', ui.skills?.filterAll || 'Tất cả lĩnh vực');
            allBtn.type = 'button';
            allBtn.dataset.filter = 'all';
            allBtn.setAttribute('aria-pressed', 'true');
            filterBar.appendChild(allBtn);

            activeCats.forEach(catKey => {
              const catBtn = ce('button', 'dp-filter-btn filter-btn', ui.skills?.category?.[catKey] || catKey);
              catBtn.type = 'button';
              catBtn.dataset.filter = catKey;
              catBtn.setAttribute('aria-pressed', 'false');
              filterBar.appendChild(catBtn);
            });
            catContent.appendChild(filterBar);
          }

          const groupsWrap = ce('div', 'cert-category-groups');
          activeCats.forEach(catKey => {
            const groupWrap = ce('div', 'dp-cert-cat-group cert-cat-group');
            groupWrap.dataset.category = catKey;
            groupWrap.appendChild(ce('h3', 'dp-cert-cat-group__heading', ui.skills?.category?.[catKey] || catKey));

            const cList = ce('ul', 'dp-cert-list');
            catMap[catKey].forEach(c => {
              cList.appendChild(buildCertRow(c, false));
            });
            groupWrap.appendChild(cList);
            groupsWrap.appendChild(groupWrap);
          });

          catContent.appendChild(groupsWrap);
          catSec.appendChild(catContent);
          panelSkills.appendChild(catSec);
        }

        // Block D. Nhóm gom (Disclosure with 2px rule, + / - marker, keyboard & aria-expanded)
        if (groupedCerts.length > 0) {
          const grpSec = ce('div', 'dp-section dp-grid certs-grouped-block');
          assignCertAnchor(grpSec);
          grpSec.appendChild(createRail(`${skillsTabNum}.${skillsSubIdx++}`, ui.rail?.grouped || 'NHÓM GOM', ui.skills?.groupedTitle || 'Chứng chỉ & Khóa học theo nhóm'));

          const grpContent = ce('div', 'dp-content');
          const groupKeys = [];
          groupedCerts.forEach(c => {
            if (!groupKeys.includes(c.group)) groupKeys.push(c.group);
          });

          groupKeys.forEach(groupKey => {
            const itemsInGroup = groupedCerts.filter(c => c.group === groupKey);
            if (itemsInGroup.length === 0) return;

            const commonIssuer = resolveI18n(itemsInGroup[0].issuer, activeLang) || itemsInGroup[0].issuer;
            const count = itemsInGroup.length;

            const dates = itemsInGroup.map(c => {
              const y = parseInt(c.year, 10) || 0;
              const m = parseInt(c.month, 10) || 0;
              return { val: y * 100 + m, str: formatCertDate(c) };
            }).sort((a, b) => a.val - b.val);

            let dateRange = '';
            if (dates.length > 0) {
              dateRange = dates[0].val === dates[dates.length - 1].val
                ? dates[0].str
                : `${dates[0].str} – ${dates[dates.length - 1].str}`;
            }

            const modulesLabel = ui.skills?.modulesLabel || 'mô-đun bổ trợ';
            const summaryPattern = ui.skills?.groupSummary || '{issuer}: {count} {modulesLabel}, {dateRange}';
            const summaryText = summaryPattern
              .replace('{issuer}', commonIssuer)
              .replace('{count}', count)
              .replace('{modulesLabel}', modulesLabel)
              .replace('{dateRange}', dateRange);

            const details = ce('details', 'dp-disclosure');
            details.id = `group-${groupKey}`;

            const summary = ce('summary', 'dp-disclosure__summary');
            summary.setAttribute('aria-expanded', 'false');
            summary.appendChild(ce('span', 'dp-disclosure__title', summaryText));
            const marker = ce('span', 'dp-disclosure__marker', '+');
            marker.setAttribute('aria-hidden', 'true');
            summary.appendChild(marker);
            details.appendChild(summary);

            details.addEventListener('toggle', () => {
              const isOpen = details.open;
              summary.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
              marker.textContent = isOpen ? '–' : '+';
            });

            const bodyDiv = ce('div', 'dp-disclosure__body');
            const gList = ce('ul', 'dp-cert-list');
            itemsInGroup.forEach(c => {
              gList.appendChild(buildCertRow(c, false));
            });
            bodyDiv.appendChild(gList);
            details.appendChild(bodyDiv);
            grpContent.appendChild(details);
          });

          grpSec.appendChild(grpContent);
          panelSkills.appendChild(grpSec);
        }

        // Block E. Khóa đã học, không có chứng chỉ (type="course" — strictly no cert words)
        if (courseCerts.length > 0) {
          const crsSec = ce('div', 'dp-section dp-grid courses-block');
          assignCertAnchor(crsSec);
          crsSec.appendChild(createRail(`${skillsTabNum}.${skillsSubIdx++}`, ui.rail?.courses || 'KHÓA HỌC', ui.skills?.coursesTitle || 'Đã học (không có chứng chỉ)'));

          const crsContent = ce('div', 'dp-content');
          const crsList = ce('ul', 'dp-cert-list');
          courseCerts.forEach(c => {
            const row = ce('li', 'dp-cert-row');
            const cTitleTxt = resolveI18n(c.title, activeLang) || c.title;
            const cIssuerTxt = resolveI18n(c.issuer, activeLang) || c.issuer;

            row.appendChild(ce('div', 'dp-cert-row__date', formatCertDate(c)));
            const mainCol = ce('div', 'dp-cert-row__main');
            mainCol.appendChild(ce('h3', 'dp-cert-row__title', cTitleTxt));
            if (cIssuerTxt) mainCol.appendChild(ce('p', 'dp-cert-row__meta', cIssuerTxt));
            row.appendChild(mainCol);

            const detailsCol = ce('div', 'dp-cert-row__details');
            if (c.hours) {
              const hoursTxt = (ui.skills?.hours || '{hours} giờ').replace('{hours}', c.hours);
              detailsCol.appendChild(ce('p', 'dp-cert-row__hours dp-meta dp-meta--muted', hoursTxt));
            }
            if (c.project_id) {
              const proj = (projectsData.projects || []).find(p => p.slug === c.project_id || p.id === c.project_id);
              if (proj) {
                const projTitle = resolveI18n(proj.title, activeLang) || proj.slug;
                const pWrap = ce('p', 'dp-cert-row__related');
                const pLink = ce('a', 'dp-related-link', `${ui.skills?.relatedProject || 'Dự án liên quan'}: ${projTitle} ↗`);
                pLink.href = buildTabUrl('projects', ui, proj.slug);
                pWrap.appendChild(pLink);
                detailsCol.appendChild(pWrap);
              }
            }
            row.appendChild(detailsCol);
            row.appendChild(ce('div', 'dp-cert-row__action'));
            crsList.appendChild(row);
          });

          crsContent.appendChild(crsList);
          crsSec.appendChild(crsContent);
          panelSkills.appendChild(crsSec);
        }

        // Block F. Đang học & Dự kiến (status="in_progress" | "planned")
        if (inProgressCerts.length > 0) {
          const prgSec = ce('div', 'dp-section dp-grid in-progress-block');
          assignCertAnchor(prgSec);
          prgSec.appendChild(createRail(`${skillsTabNum}.${skillsSubIdx++}`, ui.rail?.planned || 'LỘ TRÌNH', ui.skills?.inProgressTitle || 'Đang học & Dự kiến'));

          const prgContent = ce('div', 'dp-content');
          const prgList = ce('ul', 'dp-cert-list');
          inProgressCerts.forEach(c => {
            const row = ce('li', 'dp-cert-row');
            const cTitleTxt = resolveI18n(c.title, activeLang) || c.title;
            const cIssuerTxt = resolveI18n(c.issuer, activeLang) || c.issuer;
            const statusText = c.status === 'in_progress'
              ? (ui.skills?.statusInProgress || 'Đang học')
              : (ui.skills?.statusPlanned || 'Dự kiến');
            const expText = c.expected ? `${ui.skills?.expectedPrefix || 'Dự kiến: '}${c.expected}` : '';

            row.appendChild(ce('div', 'dp-cert-row__date', statusText));
            const mainCol = ce('div', 'dp-cert-row__main');
            mainCol.appendChild(ce('h3', 'dp-cert-row__title', cTitleTxt));
            if (cIssuerTxt) {
              mainCol.appendChild(ce('p', 'dp-cert-row__meta', cIssuerTxt));
            }
            row.appendChild(mainCol);

            const detailsCol = ce('div', 'dp-cert-row__details');
            if (expText) {
              detailsCol.appendChild(ce('p', 'dp-cert-row__hours dp-meta dp-meta--muted', expText));
            }
            row.appendChild(detailsCol);
            row.appendChild(ce('div', 'dp-cert-row__action'));
            prgList.appendChild(row);
          });

          prgContent.appendChild(prgList);
          prgSec.appendChild(prgContent);
          panelSkills.appendChild(prgSec);
        }
      }

      main.appendChild(panelSkills);

      /* ==============================================================
       * Tab 5 Panel: Liên hệ (Contact)
       * ============================================================ */
      const panelContact = ce('section', 'tab-panel');
      panelContact.id = 'panel-contact';
      panelContact.dataset.tab = 'contact';
      panelContact.hidden = true;

      const contactTabNum = tabNumbers.contact || '05';

      // Section 1: Direct Email Statement & Ruled Links
      const directSec = ce('div', 'dp-section dp-grid');
      directSec.appendChild(createRail(`${contactTabNum}.1`, ui.rail?.contact || ui.tabs?.contact?.name || 'LIÊN HỆ', ui.contact?.title || 'Liên hệ', ui.contact?.desc || ''));

      const directContent = ce('div', 'dp-content');
      if (profile.email) {
        const stmt = ce('div', 'dp-contact-statement');
        stmt.appendChild(ce('span', 'dp-label', ui.contact?.email || 'EMAIL'));

        const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(profile.email)}&su=${encodeURIComponent(ui.contact?.gmailSubject || 'Liên hệ từ Portfolio')}`;

        const emailLink = ce('a', 'dp-contact-statement__email', profile.email);
        emailLink.href = gmailComposeUrl;
        emailLink.target = '_blank';
        emailLink.rel = 'noopener noreferrer';
        emailLink.setAttribute('title', ui.contact?.openGmail || 'Soạn thư trên Gmail ↗');
        stmt.appendChild(emailLink);

        // Action buttons bar
        const actRow = ce('div', 'dp-contact-statement__actions');

        // 1. Button: Soạn thư trên Gmail ↗
        const gmailBtn = ce('a', 'dp-btn dp-btn--sm dp-btn--solid', `${ui.contact?.openGmail || 'Soạn thư trên Gmail'}`);
        gmailBtn.href = gmailComposeUrl;
        gmailBtn.target = '_blank';
        gmailBtn.rel = 'noopener noreferrer';
        actRow.appendChild(gmailBtn);

        // 2. Button: Sao chép email
        const copyBtn = ce('button', 'dp-btn dp-btn--sm', ui.contact?.copyEmail || 'Sao chép email');
        copyBtn.type = 'button';
        copyBtn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(profile.email);
            const originalText = copyBtn.textContent;
            copyBtn.textContent = ui.contact?.copied || '✓ Đã sao chép!';
            copyBtn.classList.add('dp-btn--copied');
            setTimeout(() => {
              copyBtn.textContent = originalText;
              copyBtn.classList.remove('dp-btn--copied');
            }, 2000);
          } catch (err) {
            const ta = document.createElement('textarea');
            ta.value = profile.email;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            copyBtn.textContent = ui.contact?.copied || '✓ Đã sao chép!';
            setTimeout(() => { copyBtn.textContent = ui.contact?.copyEmail || 'Sao chép email'; }, 2000);
          }
        });
        actRow.appendChild(copyBtn);

        // 3. Subtle link: mailto
        const mailtoLink = ce('a', 'dp-link-subtle', 'mailto ↗');
        mailtoLink.href = `mailto:${profile.email}`;
        mailtoLink.setAttribute('title', 'Mở bằng ứng dụng mail mặc định (Outlook/Apple Mail)');
        actRow.appendChild(mailtoLink);

        stmt.appendChild(actRow);
        directContent.appendChild(stmt);
      }

      const channelsRows = ce('div', 'dp-contact-rows');
      if (profile.phone) {
        const row = ce('div', 'dp-contact-row');
        row.appendChild(ce('span', 'dp-label', ui.contact?.phone || 'ĐIỆN THOẠI'));
        const link = ce('a', 'dp-contact-row__value', profile.phone);
        link.href = `tel:${profile.phone.replace(/\s+/g, '')}`;
        row.appendChild(link);
        channelsRows.appendChild(row);
      }
      if (profile.github) {
        const row = ce('div', 'dp-contact-row');
        row.appendChild(ce('span', 'dp-label', ui.contact?.github || 'GITHUB'));
        const link = ce('a', 'dp-contact-row__value', `${profile.github.replace(/^https?:\/\//, '')} ↗`);
        link.href = profile.github;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        row.appendChild(link);
        channelsRows.appendChild(row);
      }
      if (profile.linkedin) {
        const row = ce('div', 'dp-contact-row');
        row.appendChild(ce('span', 'dp-label', ui.contact?.linkedin || 'LINKEDIN'));
        const link = ce('a', 'dp-contact-row__value', `${profile.linkedin.replace(/^https?:\/\//, '')} ↗`);
        link.href = profile.linkedin;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        row.appendChild(link);
        channelsRows.appendChild(row);
      }
      if (profile.kaggle) {
        const row = ce('div', 'dp-contact-row');
        row.appendChild(ce('span', 'dp-label', ui.contact?.kaggle || 'KAGGLE'));
        const link = ce('a', 'dp-contact-row__value', `${profile.kaggle.replace(/^https?:\/\//, '')} ↗`);
        link.href = profile.kaggle;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        row.appendChild(link);
        channelsRows.appendChild(row);
      }
      if (channelsRows.children.length > 0) {
        directContent.appendChild(channelsRows);
      }
      directSec.appendChild(directContent);
      panelContact.appendChild(directSec);

      // Section 2: Rectangular Contact Form
      const formSec = ce('div', 'dp-section dp-grid');
      formSec.appendChild(createRail(`${contactTabNum}.2`, ui.rail?.message || 'TIN NHẮN', ui.contact?.formSubmit || 'Gửi tin nhắn'));

      const formContent = ce('div', 'dp-content');
      const form = ce('form', 'dp-form');
      form.id = 'contact-form';
      if (profile.formspreeId) {
        form.action = `https://formspree.io/f/${profile.formspreeId}`;
      }
      if (profile.email) {
        form.dataset.recipient = profile.email;
      }

      const nameField = ce('div', 'dp-form__field');
      const nameLabel = ce('label', 'dp-form__label', ui.contact?.formName || 'Họ & Tên');
      nameLabel.setAttribute('for', 'contact-name');
      const nameInput = ce('input', 'dp-form__input');
      nameInput.type = 'text';
      nameInput.id = 'contact-name';
      nameInput.name = 'name';
      nameInput.autocomplete = 'name';
      nameInput.setAttribute('enterkeyhint', 'next');
      nameInput.required = true;
      nameInput.placeholder = ui.contact?.formNamePlaceholder || '';
      nameField.appendChild(nameLabel);
      nameField.appendChild(nameInput);
      form.appendChild(nameField);

      const emailField = ce('div', 'dp-form__field');
      const emailLabel = ce('label', 'dp-form__label', ui.contact?.formEmail || 'Email');
      emailLabel.setAttribute('for', 'contact-email');
      const emailInput = ce('input', 'dp-form__input');
      emailInput.type = 'email';
      emailInput.setAttribute('inputmode', 'email');
      emailInput.id = 'contact-email';
      emailInput.name = '_replyto';
      emailInput.autocomplete = 'email';
      emailInput.setAttribute('enterkeyhint', 'next');
      emailInput.required = true;
      emailInput.placeholder = ui.contact?.formEmailPlaceholder || '';
      emailField.appendChild(emailLabel);
      emailField.appendChild(emailInput);
      form.appendChild(emailField);

      const msgField = ce('div', 'dp-form__field');
      const msgLabel = ce('label', 'dp-form__label', ui.contact?.formMsg || 'Tin nhắn');
      msgLabel.setAttribute('for', 'contact-msg');
      const msgInput = ce('textarea', 'dp-form__textarea');
      msgInput.id = 'contact-msg';
      msgInput.name = 'message';
      msgInput.rows = 5;
      msgInput.setAttribute('enterkeyhint', 'send');
      msgInput.required = true;
      msgInput.placeholder = ui.contact?.formMsgPlaceholder || '';
      msgField.appendChild(msgLabel);
      msgField.appendChild(msgInput);
      form.appendChild(msgField);

      const submitBtn = ce('button', 'dp-form__submit', ui.contact?.formSubmit || 'Gửi tin nhắn');
      submitBtn.type = 'submit';
      form.appendChild(submitBtn);

      const statusDiv = ce('div', 'dp-form__status');
      statusDiv.id = 'form-status';
      statusDiv.setAttribute('role', 'status');
      form.appendChild(statusDiv);

      formContent.appendChild(form);
      formSec.appendChild(formContent);
      panelContact.appendChild(formSec);

      main.appendChild(panelContact);

      /* ==============================================================
       * Status Bar (replaces the old closing band) & Divided Footer (Always 4 Cells)
       * ============================================================ */
      const statusText = (resolvedStatus || '').trim();
      const statusEmail = (profile.email ? String(profile.email) : '').trim();
      const statusCv = String(profile.cvLink || profile.cv || '').trim();

      if (statusText || statusEmail) {
        const barWrap = ce('div', 'dp-statusbar-wrap');
        const contactUrl = hasContact ? buildTabUrl('contact', ui) : (statusEmail ? `mailto:${statusEmail}` : '');
        const barHref = contactUrl;
        const bar = barHref ? ce('a', 'dp-statusbar') : ce('div', 'dp-statusbar dp-statusbar--static');
        if (barHref) {
          bar.href = barHref;
          bar.setAttribute('aria-label', `${ui.hero?.contact || ui.statusBar?.contactAria || 'Chuyển sang trang liên hệ'}${statusEmail ? ` (${statusEmail})` : ''}`);
          bar.addEventListener('click', (e) => {
            if (hasContact) {
              e.preventDefault();
              const targetHash = contactUrl.replace(/^[^#]*/, '');
              if (window.location.hash !== targetHash) {
                window.location.hash = targetHash;
              } else {
                switchTab('contact', null, false);
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          });
        }
        if (!statusText) bar.classList.add('dp-statusbar--solo');

        const barLeft = ce('div', 'dp-statusbar__left');
        if (statusText) {
          const mark = ce('span', 'dp-statusbar__mark');
          mark.setAttribute('aria-hidden', 'true');
          barLeft.appendChild(mark);
          barLeft.appendChild(ce('span', 'dp-statusbar__text', statusText));
        } else {
          barLeft.appendChild(ce('span', 'dp-statusbar__email', statusEmail));
        }
        bar.appendChild(barLeft);

        if (statusText && barHref) {
          const barRight = ce('div', 'dp-statusbar__right');
          barRight.appendChild(ce('span', 'dp-statusbar__email', statusEmail || (ui.hero?.contact || 'Liên hệ')));
          const arrow = ce('span', 'dp-statusbar__arrow', '→');
          arrow.setAttribute('aria-hidden', 'true');
          barRight.appendChild(arrow);
          bar.appendChild(barRight);
        } else if (!statusText && barHref) {
          const arrow = ce('span', 'dp-statusbar__arrow', '→');
          arrow.setAttribute('aria-hidden', 'true');
          bar.appendChild(arrow);
        }
        barWrap.appendChild(bar);

        if (statusCv) {
          const cvRow = ce('a', 'dp-statusbar-cv', `${ui.hero?.cv || 'Tải CV'} ↗`);
          cvRow.href = statusCv;
          cvRow.target = '_blank';
          cvRow.rel = 'noopener noreferrer';
          cvRow.setAttribute('aria-label', `${ui.hero?.cv || 'Tải CV'} ↗ (${ui.statusBar?.cvAria || 'mở tab mới'})`);
          barWrap.appendChild(cvRow);
          barWrap.classList.add('dp-statusbar-wrap--cv');
        }
        footer.appendChild(barWrap);
      }

      // Divided Footer Grid (Always keep 4 cells)
      const externalLinks = [];
      if (profile.email) externalLinks.push({ label: profile.email, href: `mailto:${profile.email}`, ext: false });
      if (profile.github) externalLinks.push({ label: 'GitHub ↗', href: profile.github, ext: true });
      if (profile.linkedin) externalLinks.push({ label: 'LinkedIn ↗', href: profile.linkedin, ext: true });
      if (profile.kaggle) externalLinks.push({ label: 'Kaggle ↗', href: profile.kaggle, ext: true });

      const colCls = 'dp-footer__col';
      const footerGrid = ce('div', 'dp-footer-grid dp-grid');

      // Col 1: Year & Name
      const col1 = ce('div', colCls);
      const col1Top = ce('div', 'dp-footer__list');
      col1Top.appendChild(ce('span', 'dp-label', '© 2026'));
      if (hasHeroData) col1Top.appendChild(ce('p', 'dp-meta', profile.name));
      const footerLoc = resolvedLocation || (visibleFacts.find(f => /nơi ở|location|localisation/i.test(f.label))?.value || '');
      if (footerLoc) col1Top.appendChild(ce('p', 'dp-meta dp-meta--muted', footerLoc));
      col1.appendChild(col1Top);
      footerGrid.appendChild(col1);

      // Col 2: Index
      const col2 = ce('div', colCls);
      const col2List = ce('div', 'dp-footer__list');
      col2List.appendChild(ce('span', 'dp-label', ui.footer?.indexLabel || 'INDEX'));
      TAB_KEYS.forEach(tk => {
        if (validTabs[tk]) {
          const link = ce('a', 'dp-footer__link', `${tabNumbers[tk]} ${ui.tabs?.[tk]?.name || tk}`);
          link.href = buildTabUrl(tk, ui);
          col2List.appendChild(link);
        }
      });
      col2.appendChild(col2List);
      footerGrid.appendChild(col2);

      // Col 3: External Links / Status (Always keep 4th cell structure intact)
      const col3 = ce('div', colCls);
      const col3List = ce('div', 'dp-footer__list');
      col3List.appendChild(ce('span', 'dp-label', ui.footer?.linksLabel || ui.contact?.title || 'LINKS'));
      if (externalLinks.length > 0) {
        externalLinks.forEach(item => {
          const a = ce('a', 'dp-footer__link', item.label);
          a.href = item.href;
          if (item.ext) {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
          }
          col3List.appendChild(a);
        });
      } else {
        if (resolvedStatus) {
          col3List.appendChild(ce('p', 'dp-meta dp-meta--muted', resolvedStatus));
        } else if (resolvedRole) {
          col3List.appendChild(ce('p', 'dp-meta dp-meta--muted', resolvedRole));
        }
      }
      col3.appendChild(col3List);
      footerGrid.appendChild(col3);

      // Col 4: Back to top & System Info (Keeps 4-column balanced grid without duplicate controls)
      const col4 = ce('div', colCls);
      const col4Top = ce('div', 'dp-footer__list');
      col4Top.appendChild(ce('span', 'dp-label', activeLang === 'vi' ? 'ĐIỀU HƯỚNG' : (activeLang === 'fr' ? 'NAVIGATION' : 'NAVIGATION')));
      const topLink = ce('a', 'dp-footer__link dp-footer__link--top', activeLang === 'vi' ? '↑ Lên đầu trang' : (activeLang === 'fr' ? '↑ Haut de page' : '↑ Back to top'));
      topLink.href = '#main';
      topLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      col4Top.appendChild(topLink);
      col4Top.appendChild(ce('p', 'dp-meta dp-meta--muted', '© 2026 Nguyễn Nam Khánh'));
      col4.appendChild(col4Top);
      footerGrid.appendChild(col4);

      footer.appendChild(footerGrid);

      // Activate initial route
      const { tabKey, projectSlug, sectionAnchor } = parseCurrentRoute();
      switchTab(tabKey, projectSlug, true, sectionAnchor);

    } catch (err) {
      console.error('Error rendering portfolio:', err);
    } finally {
      dismissLoadingScreen();
    }
  }

  window.renderPortfolio = renderPortfolio;
  document.addEventListener('DOMContentLoaded', () => renderPortfolio());
  renderPortfolio();
})();
