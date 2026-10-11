/*
 * FITAI service worker: makes the app shell available offline (gym basements, bad signal).
 * - The build writes /sw-assets.js (list of every built file + a content hash); all of it is
 *   precached on install, so every page and lazy route chunk works offline.
 * - Navigations: network first (always the latest app when online), cached shell when offline.
 * - /assets/*: cache first (content-hashed, immutable).
 * - /api/*: never touched by the worker — private data is never cached here; the app's own
 *   offline queue handles workout sets.
 */
/* global self, caches, importScripts, URL, Response */
importScripts('/sw-assets.js');

const VERSION = self.__SW_VERSION__ || 'dev';
const CACHE = `fitai-shell-${VERSION}`;
const SHELL = '/index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const urls = [SHELL, ...(self.__SW_ASSETS__ || [])];
      // addAll is all-or-nothing: a partial precache would give a half-working offline app.
      await cache.addAll(urls.map((u) => new Request(u, { cache: 'reload' })));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('fitai-shell-') && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          if (fresh.ok && fresh.headers.get('content-type')?.includes('text/html')) {
            const cache = await caches.open(CACHE);
            cache.put(SHELL, fresh.clone());
          }
          return fresh;
        } catch {
          const cached = await caches.match(SHELL);
          return cached || new Response('Offline', { status: 503, headers: { 'content-type': 'text/plain' } });
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        if (fresh.ok && (url.pathname.startsWith('/assets/') || /\.(?:png|svg|webmanifest|ico|woff2?)$/.test(url.pathname))) {
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch {
        return new Response('', { status: 504 });
      }
    })(),
  );
});
