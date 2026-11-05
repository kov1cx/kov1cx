// i18n.js – load UI strings, switch language (VI / EN / FR), preserve active tab & params, localStorage
const UI_LANG_KEY = 'uiLang';
const SUPPORTED_LANGS = ['vi', 'en', 'fr'];
const DEFAULT_LANG = 'vi';

const TAB_SLUG_MAP = {
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

let currentUI = null;
window.currentUI = null;

function detectDefaultLang() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang && SUPPORTED_LANGS.includes(urlLang)) {
    return urlLang;
  }
  const saved = localStorage.getItem(UI_LANG_KEY);
  if (saved && SUPPORTED_LANGS.includes(saved)) {
    return saved;
  }
  const navLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
  if (!navLang) return DEFAULT_LANG;
  if (navLang.startsWith('vi')) return 'vi';
  if (navLang.startsWith('fr')) return 'fr';
  if (navLang.startsWith('en')) return 'en';
  return 'en';
}

function getCurrentTabInfo() {
  const hash = window.location.hash.replace(/^#\/?/, '').replace(/\/$/, '');
  if (!hash) return { tabKey: 'home', projectSlug: null, sectionAnchor: null };
  const [routePart, sectionAnchor] = hash.split('#');
  const parts = (routePart || '').split('/');
  const firstPart = parts[0];
  const projectSlug = (parts.length > 1) ? parts.slice(1).join('/') : null;
  const tabKey = TAB_SLUG_MAP[firstPart] || (sectionAnchor === 'chung-chi' ? 'skills' : 'home');
  return { tabKey, projectSlug, sectionAnchor: sectionAnchor || null };
}

async function loadUI(lang) {
  const targetLang = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
  try {
    const res = await fetch(`data/ui.${targetLang}.json`);
    const ui = await res.json();
    currentUI = ui;
    window.currentUI = ui;
    document.documentElement.lang = targetLang;

    // Update static data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const txt = key.split('.').reduce((o, k) => o?.[k], ui);
      if (txt !== undefined) {
        if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit')) {
          el.value = txt;
        } else {
          el.textContent = txt;
        }
      }
    });

    // Update language switch buttons
    document.querySelectorAll('[data-lang]').forEach(opt => {
      const isActive = opt.dataset.lang === targetLang;
      opt.classList.toggle('active', isActive);
      opt.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    localStorage.setItem(UI_LANG_KEY, targetLang);

    // If renderPortfolio is defined, re-render with new language
    if (typeof window.renderPortfolio === 'function') {
      await window.renderPortfolio(targetLang, ui);
    }
  } catch (err) {
    console.error('Failed to load UI strings for', targetLang, err);
  }
}

// Language switch click handler (strictly decoupled to [data-lang])
document.addEventListener('click', async e => {
  const opt = e.target.closest('[data-lang]');
  if (!opt) return;

  const targetLang = opt.dataset.lang;
  const curLang = document.documentElement.lang || DEFAULT_LANG;

  if (targetLang && targetLang !== curLang && SUPPORTED_LANGS.includes(targetLang)) {
    const { tabKey, projectSlug, sectionAnchor } = getCurrentTabInfo();
    try {
      const res = await fetch(`data/ui.${targetLang}.json`);
      const nextUI = await res.json();
      const nextSlug = nextUI.tabs?.[tabKey]?.slug || '';
      let nextHash = '#/';
      if (tabKey === 'home') {
        nextHash = '#/';
      } else if (tabKey === 'projects' && projectSlug) {
        nextHash = `#/${nextSlug}/${projectSlug}`;
      } else if (nextSlug) {
        nextHash = sectionAnchor ? `#/${nextSlug}#${sectionAnchor}` : `#/${nextSlug}`;
      }

      // Updating hash will preserve window.location.search (e.g. ?demo=1)
      if (window.location.hash !== nextHash) {
        window.location.hash = nextHash;
      }
    } catch (err) {
      console.warn('Could not pre-calculate translated hash:', err);
    }

    await loadUI(targetLang);
  }
});

// Keyboard support for language options
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    const opt = e.target.closest('[data-lang]');
    if (opt) {
      e.preventDefault();
      opt.click();
    }
  }
});

const initialLang = detectDefaultLang();
loadUI(initialLang);

window.loadUI = loadUI;
window.getCurrentTabInfo = getCurrentTabInfo;
window.SUPPORTED_LANGS = SUPPORTED_LANGS;
window.DEFAULT_LANG = DEFAULT_LANG;
