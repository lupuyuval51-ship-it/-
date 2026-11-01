/* LUPU-FIT service worker. Plain JS (served as-is).
 *  - app shell + hashed assets + fonts: stale-while-revalidate (works offline after first load)
 *  - navigations: network first, fall back to the cached shell
 *  - technique clips: cache-first in `lupu-video-cache` with an LRU byte budget (default 300 MB); Range requests are
 *    answered from the cached full file so <video> keeps working offline
 *  - Priority-A clips (~10 MB) are pre-cached on install
 */
const SHELL = 'lupu-shell-v1';
const VIDEO = 'lupu-video-cache';
const META = 'lupu-meta';
const DEFAULT_BUDGET_MB = 300;

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const shell = await caches.open(SHELL);
    await shell.addAll(['/', '/manifest.webmanifest']).catch(() => undefined);
    try {
      const res = await fetch('/media/exercises/media-manifest.json');
      if (res.ok) {
        const m = await res.json();
        const vc = await caches.open(VIDEO);
        for (const id of m.priorityA || []) { await vc.add(`/media/exercises/${id}.mp4`).catch(() => undefined); await vc.add(`/media/exercises/${id}.jpg`).catch(() => undefined); }
      }
    } catch { /* offline install is fine */ }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('lupu-shell-') && k !== SHELL) await caches.delete(k);
  await self.clients.claim();
})()));

async function budgetBytes() {
  const c = await caches.open(META); const r = await c.match('/__budget');
  const mb = r ? Number(await r.text()) : DEFAULT_BUDGET_MB;
  return (Number.isFinite(mb) && mb > 0 ? mb : DEFAULT_BUDGET_MB) * 1024 * 1024;
}
async function videoUsage() {
  const c = await caches.open(VIDEO); let total = 0;
  for (const req of await c.keys()) { const r = await c.match(req); if (r) total += Number(r.headers.get('content-length')) || (await r.clone().blob()).size; }
  return total;
}
/** LRU: Cache API keys() returns insertion order, and every hit re-inserts, so the first keys are the least recently used. */
async function evict(cache, limit) {
  let total = await videoUsage();
  for (const req of await cache.keys()) { if (total <= limit) break; const r = await cache.match(req); const sz = r ? Number(r.headers.get('content-length')) || 0 : 0; await cache.delete(req); total -= sz; }
}
function rangeResponse(full, rangeHeader) {
  return full.blob().then((blob) => {
    const m = /bytes=(\d+)-(\d*)/.exec(rangeHeader); const size = blob.size;
    const start = Number(m[1]); const end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    return new Response(blob.slice(start, end + 1), { status: 206, headers: { 'Content-Type': full.headers.get('Content-Type') || 'video/mp4', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
  });
}
async function videoFetch(request) {
  const cache = await caches.open(VIDEO);
  const url = request.url.split('?')[0];
  let hit = await cache.match(url);
  if (!hit) {
    try {
      const res = await fetch(url); // always fetch the FULL file so it can be cached
      if (res.ok) { await cache.put(url, res.clone()); evict(cache, await budgetBytes()); hit = res; }
      else return res;
    } catch { return new Response('', { status: 504 }); }
  } else { await cache.delete(url); await cache.put(url, hit.clone()); } // touch = most recently used
  const range = request.headers.get('range');
  return range ? rangeResponse(hit, range) : hit;
}

// Offline boot: only the identity + profile reads keep a last-known copy, served ONLY when the network is unreachable.
const SESSION = 'lupu-session-v1';
const SESSION_PATHS = ['/api/auth/me', '/api/profile'];
async function sessionFetch(req) {
  const cache = await caches.open(SESSION);
  try {
    const res = await fetch(req);
    if (res.ok) await cache.put(req.url, res.clone());
    else if (res.status === 401) await caches.delete(SESSION);
    return res;
  } catch {
    return (await cache.match(req.url)) || new Response(JSON.stringify({ error: 'network' }), { status: 503, headers: { 'content-type': 'application/json' } });
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request; const url = new URL(req.url);
  if (url.origin === self.location.origin && url.pathname === '/api/auth/logout') e.waitUntil(caches.delete(SESSION)); // wipe the offline identity copy
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (SESSION_PATHS.includes(url.pathname)) { e.respondWith(sessionFetch(req)); return; }
  if (url.pathname.startsWith('/api/')) return; // never cache other API calls
  if (url.pathname.startsWith('/media/exercises/') && /\.(mp4|webm)$/.test(url.pathname)) { e.respondWith(videoFetch(req)); return; }
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(SHELL).then((s) => s.put('/', c)); return r; }).catch(async () => (await caches.match('/')) || new Response('offline', { status: 503 })));
    return;
  }
  e.respondWith(caches.open(SHELL).then(async (cache) => {
    const hit = await cache.match(req);
    const net = fetch(req).then((r) => { if (r.ok) cache.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});

self.addEventListener('message', (e) => {
  const d = e.data || {}; const reply = (m) => e.ports[0] && e.ports[0].postMessage(m);
  if (d.type === 'clear-video-cache') e.waitUntil(caches.delete(VIDEO).then(() => reply({ ok: true })));
  else if (d.type === 'set-video-budget') e.waitUntil(caches.open(META).then((c) => c.put('/__budget', new Response(String(d.mb)))).then(() => reply({ ok: true })));
  else if (d.type === 'video-cache-size') e.waitUntil(videoUsage().then((bytes) => reply({ bytes })));
});
