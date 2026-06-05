// Service worker for Тоалет Игрице.
// Bump CACHE_VERSION on every shell change.
const CACHE_VERSION = 'v95';
const CACHE_NAME = `toiletgames-${CACHE_VERSION}`;

const SCOPE = new URL(self.registration.scope).pathname;

const SHELL = [
  SCOPE,
  SCOPE + 'index.html',
  SCOPE + 'app.js',
  SCOPE + 'style.css',
  SCOPE + 'manifest.json',
  SCOPE + 'favicon.svg',
  SCOPE + 'favicon-96x96.png',
  SCOPE + 'apple-touch-icon.png',
  SCOPE + 'web-app-manifest-192x192.png',
  SCOPE + 'web-app-manifest-512x512.png',
  SCOPE + 'games/minefield.html',
  SCOPE + 'games/2048.html',
  SCOPE + 'games/snake.html',
  SCOPE + 'games/tictactoe.html',
  SCOPE + 'games/echo.html',
  SCOPE + 'games/dropfour.html',
  SCOPE + 'games/pairs.html',
  SCOPE + 'games/sudoku.html',
  SCOPE + 'games/letterbox.html',
  SCOPE + 'games/hangman.html',
  SCOPE + 'games/blackjack.html',
  SCOPE + 'games/sliding.html',
  SCOPE + 'games/match3.html',
  SCOPE + 'games/blockfall.html',
  SCOPE + 'games/brickbash.html',
  SCOPE + 'games/galaga.html',
  SCOPE + 'games/boxpusher.html',
  SCOPE + 'games/flappy.html',
  SCOPE + 'games/flappy-bird-set.png',
  SCOPE + 'games/stats.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(SHELL.map((url) => cache.add(url).catch(() => null)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names.filter((n) => n.startsWith('toiletgames-') && n !== CACHE_NAME)
           .map((n) => caches.delete(n))
    );
    await self.clients.claim();
  })());
});

function isSameOrigin(req) {
  return new URL(req.url).origin === self.location.origin;
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  const net = fetch(req).then((r) => {
    if (r && (r.ok || r.type === 'opaque')) cache.put(req, r.clone());
    return r;
  }).catch(() => null);
  return cached || net || fetch(req);
}

async function networkFirst(req) {
  try {
    const r = await fetch(req);
    if (r && r.ok) (await caches.open(CACHE_NAME)).put(req, r.clone());
    return r;
  } catch (e) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;
    if (req.mode === 'navigate') {
      const shell = await cache.match(SCOPE + 'index.html');
      if (shell) return shell;
    }
    throw e;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (!isSameOrigin(request)) return;

  const isNav = request.mode === 'navigate' ||
                (request.headers.get('accept') || '').includes('text/html');
  event.respondWith(isNav ? networkFirst(request) : staleWhileRevalidate(request));
});
