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
  const installBtn = document.getElementById('installBtn');
  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isStandalone()) installBtn.classList.add('hidden');

  installBtn.addEventListener('click', async () => {
    if (isStandalone()) {
      alert(_lang() === 'sr' ? 'Апликација је већ инсталирана.' : 'App is already installed.');
      return;
    }
    if (window._dip) {
      window._dip.prompt();
      try { await window._dip.userChoice; } catch (e) {}
      window._dip = null;
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

// ── Drag-to-reorder game cards (long-press) ─────────────────────────────────────

(function () {
  const grid = document.querySelector('.games-grid');
  if (!grid) return;

  const ORDER_KEY = 'tg-order';
  const keyOf = (c) => c.getAttribute('href');

  // Restore saved order; any game not in the saved list stays in its DOM spot.
  try {
    const saved = JSON.parse(localStorage.getItem(ORDER_KEY) || 'null');
    if (Array.isArray(saved)) {
      const byKey = new Map(
        Array.from(grid.querySelectorAll('.game-card')).map((c) => [keyOf(c), c])
      );
      saved.forEach((k) => { const c = byKey.get(k); if (c) grid.appendChild(c); });
    }
  } catch (e) {}

  function saveOrder() {
    const order = Array.from(grid.querySelectorAll('.game-card')).map(keyOf);
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(order)); } catch (e) {}
  }

  const HOLD = 300;        // ms to hold (touch) before a drag begins
  const MOVE_CANCEL = 12;  // px of movement that cancels a pending touch long-press
  const MOUSE_START = 6;   // px of movement that starts a mouse drag immediately
  let src = null, ghost = null, longTimer = null, pendingCard = null, pendingMouse = false;
  let startX = 0, startY = 0, dragging = false, pointerId = null, suppress = false;

  function cleanup() {
    clearTimeout(longTimer); longTimer = null;
    if (ghost) { ghost.remove(); ghost = null; }
    if (src) src.classList.remove('tg-place');
    grid.classList.remove('tg-reordering');
    dragging = false; src = null; pointerId = null;
    pendingCard = null; pendingMouse = false;
  }

  // Browsers natively drag <a> links; kill that so our reorder takes over.
  grid.addEventListener('dragstart', (e) => e.preventDefault());

  function startDrag(card, x, y) {
    src = card;
    const r = card.getBoundingClientRect();
    ghost = card.cloneNode(true);
    ghost.classList.add('tg-ghost');
    ghost.style.width = r.width + 'px';
    ghost.style.height = r.height + 'px';
    ghost.style.left = r.left + 'px';
    ghost.style.top = r.top + 'px';
    ghost._dx = x - r.left;
    ghost._dy = y - r.top;
    document.body.appendChild(ghost);
    card.classList.add('tg-place');
    grid.classList.add('tg-reordering');
    dragging = true;
    if (navigator.vibrate) { try { navigator.vibrate(15); } catch (e) {} }
  }

  function moveGhost(x, y) {
    ghost.style.left = (x - ghost._dx) + 'px';
    ghost.style.top = (y - ghost._dy) + 'px';
    const under = document.elementFromPoint(x, y);
    const target = under && under.closest && under.closest('.game-card');
    if (target && target !== src && target.parentNode === grid) {
      const tr = target.getBoundingClientRect();
      const cy = tr.top + tr.height / 2, cx = tr.left + tr.width / 2;
      const before = y < cy - 1 || (Math.abs(y - cy) <= tr.height * 0.4 && x < cx);
      if (before) target.before(src); else target.after(src);
    }
  }

  function beginCapturedDrag(card, x, y) {
    startDrag(card, x, y);
    try { grid.setPointerCapture(pointerId); } catch (e) {}
  }

  grid.addEventListener('pointerdown', (e) => {
    if (e.button != null && e.button !== 0) return;
    const card = e.target.closest('.game-card');
    if (!card) return;
    startX = e.clientX; startY = e.clientY; pointerId = e.pointerId;
    pendingCard = card;
    if (e.pointerType === 'mouse') {
      // Desktop: grab and drag immediately on a small move — no hold needed.
      pendingMouse = true;
    } else {
      // Touch/pen: hold briefly so a tap still opens the game and lists still scroll.
      longTimer = setTimeout(() => beginCapturedDrag(card, startX, startY), HOLD);
    }
  });

  grid.addEventListener('pointermove', (e) => {
    if (dragging) { e.preventDefault(); moveGhost(e.clientX, e.clientY); return; }
    const dx = Math.abs(e.clientX - startX), dy = Math.abs(e.clientY - startY);
    if (pendingMouse && pendingCard && (dx > MOUSE_START || dy > MOUSE_START)) {
      pendingMouse = false;
      beginCapturedDrag(pendingCard, e.clientX, e.clientY);
      moveGhost(e.clientX, e.clientY);
      return;
    }
    if (longTimer && (dx > MOVE_CANCEL || dy > MOVE_CANCEL)) {
      clearTimeout(longTimer); longTimer = null;
    }
  });

  function endDrag() {
    if (dragging) { saveOrder(); suppress = true; setTimeout(() => { suppress = false; }, 60); }
    cleanup();
  }
  grid.addEventListener('pointerup', endDrag);
  grid.addEventListener('pointercancel', cleanup);

  // Stop the click that follows a drag from opening the game.
  grid.addEventListener('click', (e) => {
    if (suppress) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  // Cancel page scrolling while a drag is in progress (touch).
  grid.addEventListener('touchmove', (e) => { if (dragging) e.preventDefault(); }, { passive: false });
})();

// ── Service Worker ────────────────────────────────────────────────────────────

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('service-worker.js', { updateViaCache: 'none' })
      .then((reg) => {
        reg.update();
        // If a SW already controls this page (returning visitor), reload once when a
        // newly-installed SW takes over — so updates show up without a manual refresh.
        if (navigator.serviceWorker.controller) {
          let reloaded = false;
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (reloaded) return;
            reloaded = true;
            window.location.reload();
          });
        }
      })
      .catch(() => {});
  });
}
