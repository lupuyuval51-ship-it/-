/*
 * LUPU-FIT service worker: makes the app shell available offline (gym basements, bad signal).
 * - The build writes /sw-assets.js (list of every built file + a content hash); all of it is
 *   precached on install, so every page and lazy route chunk works offline.
 * - Navigations: network first (always the latest app when online), cached shell when offline or
 *   when the network takes longer than NAV_TIMEOUT_MS (weak signal must not hang the launch).
 * - /assets/*: cache first (content-hashed, immutable).
 * - /dishes/*.webp (menu photos): not precached (8 MB); cached the first time they are viewed.
 * - /api/*: never touched by the worker — private data is never cached here; the app's own
 *   offline queue handles workout sets.
 * - Push (phone notifications): shows the reminder the server sent; tapping it focuses an open
 *   LUPU-FIT window and routes it in-app (no reload), or opens a new one.
 */
/* global self, caches, importScripts, URL, Response */
importScripts('/sw-assets.js');

const VERSION = self.__SW_VERSION__ || 'dev';
const CACHE = `fitai-shell-${VERSION}`;
const SHELL = '/index.html';
const NAV_TIMEOUT_MS = 3500;

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
    // Network first, but a weak gym connection must not hang the launch: after NAV_TIMEOUT_MS the
    // cached shell is shown, and the network response (if it still arrives) refreshes the cache.
    const network = fetch(req).then(async (fresh) => {
      if (fresh.ok && fresh.headers.get('content-type')?.includes('text/html')) {
        const cache = await caches.open(CACHE);
        await cache.put(SHELL, fresh.clone());
      }
      return fresh;
    });
    event.waitUntil(network.then(() => undefined, () => undefined));
    event.respondWith(
      (async () => {
        const cached = await caches.match(SHELL);
        if (!cached) {
          try {
            return await network;
          } catch {
            return new Response('Offline', { status: 503, headers: { 'content-type': 'text/plain' } });
          }
        }
        const timeout = new Promise((resolve) => setTimeout(() => resolve(null), NAV_TIMEOUT_MS));
        try {
          return (await Promise.race([network, timeout])) || cached;
        } catch {
          return cached;
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
        if (fresh.ok && (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/dishes/') || /\.(?:png|svg|webmanifest|ico|woff2?)$/.test(url.pathname))) {
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

// ---------------------------------------------------------------- Phone notifications (Web Push)
// Pages a notification may open. Anything else falls back to the dashboard.
const PUSH_PATHS = ['/', '/workouts', '/nutrition/log', '/profile'];
const safePath = (value) => (typeof value === 'string' && PUSH_PATHS.includes(value) ? value : '/');
const text = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const lang = data.lang === 'en' ? 'en' : 'he';
  // Browsers require a visible notification for every push, so there is always a title.
  const title = text(data.title, 120) || 'LUPU-FIT';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: text(data.body, 300),
      tag: text(data.tag, 64) || undefined,
      icon: '/icon-192.png',
      lang,
      dir: lang === 'he' ? 'rtl' : 'ltr',
      data: { url: safePath(data.url) },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const path = safePath(event.notification.data && event.notification.data.url);
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const open = windows.filter((c) => new URL(c.url).origin === self.location.origin);
      // Prefer the window the user saw last (focused or visible) so unsaved work is not reloaded.
      const client = open.find((c) => c.focused) || open.find((c) => c.visibilityState === 'visible') || open[0];
      if (client) {
        // The app routes in place and keeps its state (listenForPushNavigation, features/push/hooks.ts).
        client.postMessage({ type: 'fitai:navigate', path });
        try {
          await client.focus();
        } catch {
          /* focusing can be refused; the message still routes the app */
        }
        return;
      }
      await self.clients.openWindow(path);
    })(),
  );
});
