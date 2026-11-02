// theme.js – light/dark toggle with event delegation, persist, and accessibility
const THEME_KEY = 'theme';

function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  localStorage.setItem(THEME_KEY, t);
  const groundColor = t === 'dark' ? '#000000' : '#ffffff';
  document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
    meta.setAttribute('content', groundColor);
  });
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    const isDark = t === 'dark';
    btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    const txtSpan = btn.querySelector('.dp-theme-text');
    if (txtSpan) {
      const darkLbl = btn.dataset.labelDark || 'DARK';
      const lightLbl = btn.dataset.labelLight || 'LIGHT';
      txtSpan.textContent = isDark ? darkLbl : lightLbl;
    }
  });
}

function initTheme() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlTheme = urlParams.get('theme');
  if (urlTheme === 'light' || urlTheme === 'dark') {
    applyTheme(urlTheme);
    return;
  }
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));
}

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-theme-toggle]');
  if (btn) {
    const cur = document.documentElement.dataset.theme;
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  }
});

initTheme();
window.applyTheme = applyTheme;
