/* Vichaar service worker – makes the app open instantly and work offline.
   Bump VERSION when you deploy if you want every device to refresh immediately. */
const VERSION = 'vichaar-1.2.3';
const SHELL = [
  './', './index.html', './styles.css', './app.js', './manifest.webmanifest',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
  './fonts/cg-400.woff2', './fonts/cg-500.woff2', './fonts/cg-600.woff2', './fonts/cg-400-italic.woff2', './fonts/cg-500-italic.woff2',
  './fonts/inter-400.woff2', './fonts/inter-500.woff2', './fonts/inter-600.woff2', './fonts/tiro-400.woff2', './fonts/tiro-400-italic.woff2',
];

self.addEventListener('install', (event) => {
  // cache: 'reload' skips the browser's HTTP cache – otherwise a CDN "browser cache TTL" can hand
  // the new service worker yesterday's files and pin every phone to the old version.
  event.waitUntil(
    caches.open(VERSION)
      .then((c) => c.addAll(SHELL.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.includes('/api/')) return;

  // Pages: network first so updates land quickly, cache as fallback for offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }

  // Assets: serve from cache instantly, refresh in the background
  event.respondWith(
    caches.match(req).then((hit) => {
      // Revalidate against the server (cheap 304 when unchanged), never against the HTTP cache
      const network = fetch(req, { cache: 'no-cache' })
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || network;
    }),
  );
});
