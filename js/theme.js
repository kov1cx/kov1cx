// theme.js – light/dark/cyber/amber/paper/aurora/sunset/emerald/silk/cartoon/cartoon-dark/manga theme engine
const THEME_KEY = 'theme';
const VALID_THEMES = ['light', 'dark', 'cyber', 'amber', 'paper', 'aurora', 'sunset', 'emerald', 'silk', 'cartoon', 'cartoon-dark', 'manga'];

const THEME_GROUND_COLORS = {
  light: '#ffffff',
  dark: '#121316',
  cyber: '#0a0f1d',
  amber: '#0c0c0e',
  paper: '#f5f2eb',
  aurora: '#070913',
  sunset: '#09070f',
  emerald: '#040907',
  silk: '#faf7f2',
  cartoon: '#fefce8',
  'cartoon-dark': '#161424',
  manga: '#161224'
};

function applyTheme(t) {
  const theme = VALID_THEMES.includes(t) ? t : 'cartoon';
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  const groundColor = THEME_GROUND_COLORS[theme] || '#fefce8';
  document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
    meta.setAttribute('content', groundColor);
  });
  const isDarkTheme = ['dark', 'cyber', 'amber', 'aurora', 'sunset', 'emerald', 'manga', 'cartoon-dark'].includes(theme);
  document.querySelectorAll('[data-theme-val]').forEach(btn => {
    const isMatch = (btn.dataset.themeVal === 'dark' && isDarkTheme) || (btn.dataset.themeVal === 'light' && !isDarkTheme);
    btn.classList.toggle('active', isMatch);
    btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
  });
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    btn.setAttribute('aria-pressed', isDarkTheme ? 'true' : 'false');
    const txtSpan = btn.querySelector('.dp-theme-text');
    if (txtSpan) {
      txtSpan.textContent = theme.toUpperCase();
    }
  });
}

function initTheme() {
  const urlParams = new URLSearchParams(window.location.search);
  let urlTheme = urlParams.get('theme');
  if (!urlTheme && window.location.hash.includes('theme=')) {
    const hashQuery = window.location.hash.split('?')[1];
    if (hashQuery) {
      urlTheme = new URLSearchParams(hashQuery).get('theme');
    }
  }
  if (urlTheme && VALID_THEMES.includes(urlTheme)) {
    applyTheme(urlTheme);
    return;
  }
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) {
    if (saved === 'light') {
      applyTheme('cartoon');
      return;
    }
    if (saved === 'dark') {
      applyTheme('cartoon-dark');
      return;
    }
    if (VALID_THEMES.includes(saved)) {
      applyTheme(saved);
      return;
    }
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'cartoon-dark' : 'cartoon');
}

document.addEventListener('click', e => {
  const valBtn = e.target.closest('[data-theme-val]');
  if (valBtn) {
    const targetVal = valBtn.dataset.themeVal;
    const cur = document.documentElement.dataset.theme || 'cartoon';
    if (cur.startsWith('cartoon') || cur === 'light' || cur === 'dark') {
      applyTheme(targetVal === 'dark' ? 'cartoon-dark' : 'cartoon');
      return;
    }
    applyTheme(targetVal);
    return;
  }
  const btn = e.target.closest('[data-theme-toggle]');
  if (btn) {
    const cur = document.documentElement.dataset.theme;
    if (cur.startsWith('cartoon')) {
      applyTheme(cur === 'cartoon' ? 'cartoon-dark' : 'cartoon');
    } else {
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    }
  }
});

initTheme();
window.applyTheme = applyTheme;
