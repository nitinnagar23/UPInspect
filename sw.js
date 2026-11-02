// ============================================================
// sw.js: Service worker (offline shell + pinned library cache)
// UPInspect
//
//  - Same-origin files: network-first with a short timeout, falling back to
//    the cache. Online users always get the latest version (no mixed-version
//    module graphs); offline / flaky-network users get the last good copy.
//  - Pinned third-party files (jsDelivr, Google Fonts files): cache-first,
//    because their URLs are immutable.
//  - Everything else (Google Analytics ...) is left alone.
//
// IMPORTANT: fetch() calls made *inside* a service worker are governed by the
// `connect-src` directive of the CSP that this file is served with (see
// _headers), not by script-src / style-src / font-src. Every host listed in
// IMMUTABLE_HOSTS and REVALIDATE_HOSTS below must therefore also be in
// `connect-src`, otherwise the worker's fetch is blocked and the page sees a
// network error (this is what made the camera scanner say "Could not load a
// required component"). tests/html.test.js enforces this.
//
// Bump VERSION to drop old caches.
// ============================================================

(() => {
  'use strict';

  const VERSION = 'v2';
  const CORE    = `upinspect-core-${VERSION}`;
  const VENDOR  = `upinspect-vendor-${VERSION}`;

  const NETWORK_TIMEOUT_MS = 3000;

  const PRECACHE = [
    '/',
    '/index.html',
    '/css/tokens.css',
    '/css/animations.css',
    '/css/layout.css',
    '/css/components.css',
    '/css/views.css',
    '/js/main.js',
    '/js/config.js',
    '/js/state.js',
    '/js/storage.js',
    '/js/upi.js',
    '/js/libs.js',
    '/js/loader.js',
    '/js/i18n.js',
    '/js/ui.js',
    '/js/extractor.js',
    '/js/scanner.js',
    '/js/router.js',
    '/js/paylink.js',
    '/js/generator.js',
    '/js/share.js',
    '/js/locales/en.js',
    '/js/locales/hi.js',
    '/assets/favicon/site.webmanifest',
  ];

  const IMMUTABLE_HOSTS  = new Set(['cdn.jsdelivr.net', 'fonts.gstatic.com']);
  const REVALIDATE_HOSTS = new Set(['fonts.googleapis.com']);

  async function networkFirst(req, key) {
    const cache = await caches.open(CORE);
    const network = fetch(req);
    const timeout = new Promise(resolve => setTimeout(() => resolve(null), NETWORK_TIMEOUT_MS));

    const first = await Promise.race([network.catch(() => null), timeout]);
    if (first && first.ok) {
      cache.put(key, first.clone());
      return first;
    }

    const cached = await cache.match(key);
    if (cached) return cached;

    // Nothing cached: wait for the real network result.
    return (await network.catch(() => null)) ?? Response.error();
  }

  async function cacheFirst(req) {
    const cache = await caches.open(VENDOR);
    const hit = await cache.match(req);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
    return res;
  }

  async function staleWhileRevalidate(req) {
    const cache = await caches.open(VENDOR);
    const hit = await cache.match(req);
    const refresh = fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    return hit ?? (await refresh) ?? Response.error();
  }

  self.addEventListener('install', event => {
    event.waitUntil((async () => {
      const cache = await caches.open(CORE);
      // allSettled: one missing file must not abort the install
      await Promise.allSettled(PRECACHE.map(async url => {
        const res = await fetch(url, { cache: 'reload' });
        if (res.ok) await cache.put(url, res);
      }));
      await self.skipWaiting();
    })());
  });

  self.addEventListener('activate', event => {
    event.waitUntil((async () => {
      const keep = new Set([CORE, VENDOR]);
      for (const key of await caches.keys()) {
        if (key.startsWith('upinspect-') && !keep.has(key)) await caches.delete(key);
      }
      await self.clients.claim();
    })());
  });

  self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    if (url.origin === self.location.origin) {
      if (url.pathname === '/sw.js') return;                       // never cache the worker itself
      // Every navigation (/, /name@upi/Shop/500 ...) is the same app shell.
      if (req.mode === 'navigate') {
        event.respondWith(networkFirst(req, '/index.html'));
      } else {
        event.respondWith(networkFirst(req, req));
      }
    } else if (IMMUTABLE_HOSTS.has(url.host)) {
      event.respondWith(cacheFirst(req));
    } else if (REVALIDATE_HOSTS.has(url.host)) {
      event.respondWith(staleWhileRevalidate(req));
    }
  });
})();
