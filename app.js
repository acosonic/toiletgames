// ── Theme + language helpers ──────────────────────────────────────────────────

function _theme() {
  return localStorage.getItem('tg-theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function _lang() {
  return localStorage.getItem('tg-lang') ||
    (/^(sr|hr|bs)/i.test(navigator.language) ? 'sr' : 'en');
}

function applyTheme() {
  const dark = _theme() === 'dark';
  document.documentElement.classList.toggle('light', !dark);
  document.querySelectorAll('.theme-btn').forEach(b => b.textContent = dark ? '☀️' : '🌙');
}

function applyLang() {
  const lang = _lang();
  document.querySelectorAll('[data-' + lang + ']').forEach(el => {
    el.textContent = el.dataset[lang];
  });
  document.querySelectorAll('.lang-btn').forEach(b => b.textContent = lang === 'sr' ? 'EN' : 'СР');
  document.title = lang === 'sr' ? 'Тоалет Игрице' : 'Toilet Games';
  document.documentElement.lang = lang;
}

function toggleTheme() {
  localStorage.setItem('tg-theme', _theme() === 'dark' ? 'light' : 'dark');
  applyTheme();
}

function toggleLang() {
  localStorage.setItem('tg-lang', _lang() === 'sr' ? 'en' : 'sr');
  applyLang();
}

applyTheme();
applyLang();

// ── PWA install button ────────────────────────────────────────────────────────

(function () {
  let deferredPrompt = null;
  const installBtn = document.getElementById('installBtn');
  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isStandalone()) installBtn.classList.add('hidden');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  installBtn.addEventListener('click', async () => {
    if (isStandalone()) {
      alert(_lang() === 'sr' ? 'Апликација је већ инсталирана.' : 'App is already installed.');
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch (e) {}
      deferredPrompt = null;
      return;
    }
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (_lang() === 'sr') {
      alert(isIos
        ? 'iPhone/iPad (Safari): тапни „Подели" (□↑) → „Add to Home Screen" → „Add".'
        : 'Android (Chrome): мени (⋮) → „Install app" / „Add to Home screen".');
    } else {
      alert(isIos
        ? 'iPhone/iPad (Safari): tap Share (□↑) → "Add to Home Screen" → "Add".'
        : 'Android (Chrome): menu (⋮) → "Install app" / "Add to Home screen".');
    }
  });

  window.addEventListener('appinstalled', () => installBtn.classList.add('hidden'));
})();

// ── Service Worker ────────────────────────────────────────────────────────────

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('service-worker.js', { updateViaCache: 'none' })
      .catch(() => {});
  });
}
