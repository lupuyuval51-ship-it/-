/* Static-only cache. Sessions, pages, uploaded files and all API responses are never cached. */
const CACHE = 'levelup-static-v1';
const PUBLIC_ASSETS = new Set(['/icons/icon.svg', '/manifest.webmanifest', '/covers/website.svg', '/covers/app.svg', '/covers/game.svg', '/covers/english.svg', '/covers/video.svg', '/covers/ai.svg', '/covers/content.svg', '/covers/business.svg']);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([...PUBLIC_ASSETS])));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('levelup-static-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !PUBLIC_ASSETS.has(url.pathname) || url.search) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(event.request);
    if (cached) return cached;
    const response = await fetch(event.request);
    if (response.ok && response.type === 'basic') await cache.put(event.request, response.clone());
    return response;
  }));
});
