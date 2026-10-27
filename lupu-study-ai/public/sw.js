/* LUPU Study AI – Service Worker
 * אסטרטגיה: נכסים סטטיים של Next (/_next/static) – cache-first; ניווטים – network-first עם נפילה למטמון;
 * בקשות /api/* אף פעם לא נשמרות במטמון (תוכן AI ופרטי משתמש). */
const VERSION = "lupu-v1";
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => c.addAll(["/offline.html"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    e.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  if (req.mode === "navigate") {
    e.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          if (res.ok) {
            const copy = res.clone();
            e.waitUntil(caches.open(PAGES).then((c) => c.put(req, copy)));
          }
          return res;
        } catch {
          return (await caches.match(req, { ignoreSearch: true })) || (await caches.match("/offline.html"));
        }
      })(),
    );
  }
});
