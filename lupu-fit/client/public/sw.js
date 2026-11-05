/* LUPU-FIT service worker. Plain JS (served as-is).
 *  - app shell + hashed assets + fonts: stale-while-revalidate (works offline after first load); the cache is bounded
 *  - navigations: network first, fall back to the cached shell (only a good HTML page is ever kept as the shell)
 *  - technique clips: cache-first in `lupu-video-cache` with an LRU byte budget (default 300 MB); Range requests are
 *    answered from the cached full file so <video> keeps working offline. Only real video/image responses are cached.
 *  - Priority-A clips (~10 MB) are pre-cached on install
 *  - last-known identity (/api/auth/me, /api/profile): served ONLY when the network is unreachable, and wiped whenever the
 *    signed-in person can change (login, register, logout, account deletion, a 401, a different user id)
 */
const SHELL = 'lupu-shell-v2'; // v2: drops shell caches written by older builds (which could hold an HTML page under a script or clip URL)
const VIDEO = 'lupu-video-cache';
const META = 'lupu-meta';
const SESSION = 'lupu-session-v1';
const DEFAULT_BUDGET_MB = 300;
const SHELL_MAX_ENTRIES = 120; // hashed assets of old deployments would otherwise pile up forever

const isMedia = (res) => res.status === 200 && /^(video|image)\//i.test(res.headers.get('content-type') || '');
/** Something other than a page (script, style, font, image, clip...) must never be an HTML document: that is the SPA fallback of a missing file. */
const isHtml = (res) => /text\/html/i.test(res.headers.get('content-type') || '');

async function putMedia(cache, url) {
  try { const res = await fetch(url); if (isMedia(res)) await cache.put(url, res); } catch { /* offline or missing: skip */ }
}

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const shell = await caches.open(SHELL);
    await shell.addAll(['/', '/manifest.webmanifest', '/manifest.en.webmanifest']).catch(() => undefined);
    try {
      const res = await fetch('/media/exercises/media-manifest.json');
      if (res.ok) {
        const m = await res.json();
        const vc = await caches.open(VIDEO);
        for (const id of Array.isArray(m.priorityA) ? m.priorityA : []) {
          if (typeof id !== 'string' || !/^[\w-]+$/.test(id)) continue;
          await putMedia(vc, `/media/exercises/${id}.mp4`); await putMedia(vc, `/media/exercises/${id}.jpg`);
        }
      }
    } catch { /* offline install is fine */ }
    // No skipWaiting here: the page offers the new version calmly and sends 'skip-waiting' when the user agrees.
  })());
});
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if ((k.startsWith('lupu-shell-') && k !== SHELL) || (k.startsWith('lupu-session-') && k !== SESSION)) await caches.delete(k);
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
const unsatisfiable = (size) => new Response('', { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
/** Answers a Range request from the full cached file: `bytes=a-b`, `bytes=a-` and the suffix form `bytes=-n`. Anything else gets the whole file (allowed by HTTP). */
function rangeResponse(full, rangeHeader) {
  return full.blob().then((blob) => {
    const size = blob.size; const type = full.headers.get('Content-Type') || 'video/mp4';
    const m = /^bytes=(\d*)-(\d*)$/.exec(String(rangeHeader || '').trim());
    if (!m || (m[1] === '' && m[2] === '')) return new Response(blob, { status: 200, headers: { 'Content-Type': type, 'Content-Length': String(size), 'Accept-Ranges': 'bytes' } });
    let start; let end;
    if (m[1] === '') { const n = Number(m[2]); if (!(n > 0)) return unsatisfiable(size); start = Math.max(0, size - n); end = size - 1; }
    else { start = Number(m[1]); end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1); }
    if (!(start < size) || end < start) return unsatisfiable(size);
    return new Response(blob.slice(start, end + 1), { status: 206, headers: { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
  });
}
async function videoFetch(request) {
  const cache = await caches.open(VIDEO);
  const url = request.url.split('?')[0];
  let hit = await cache.match(url);
  if (hit && !isMedia(hit)) { await cache.delete(url); hit = undefined; } // an app-shell page cached under a clip URL by an older build
  if (!hit) {
    let res;
    try { res = await fetch(url); } catch { return new Response('', { status: 504 }); } // always fetch the FULL file so it can be cached
    if (!isMedia(res)) return res; // 404, error page or the SPA fallback: hand it to the page, never cache it
    await cache.put(url, res.clone()).catch(() => undefined);
    evict(cache, await budgetBytes()).catch(() => undefined);
    hit = res;
  } else { await cache.delete(url); await cache.put(url, hit.clone()); } // touch = most recently used
  const range = request.headers.get('range');
  return range ? rangeResponse(hit, range) : hit;
}

// ---- last-known identity (offline boot) ---------------------------------------------------------------------------------------------
const SESSION_PATHS = ['/api/auth/me', '/api/profile'];
/** Requests after which "who is signed in" may have changed. Bumping `epoch` also stops answers to requests that began earlier from being stored. */
const IDENTITY_WRITES = ['/api/auth/login', '/api/auth/register', '/api/auth/logout'];
let epoch = 0;
const identityKey = (path) => new URL(path, self.location.origin).href;
async function wipeSession() { epoch++; await caches.delete(SESSION); }
async function ephemeral() { return !!(await (await caches.open(META)).match('/__ephemeral')); }
/** "Remember me" off = a shared device: keep no offline copy of the identity at all. */
async function setEphemeral(on) { const c = await caches.open(META); if (on) await c.put('/__ephemeral', new Response('1')); else await c.delete('/__ephemeral'); }

async function keepIdentity(cache, key, res) {
  if (key === identityKey('/api/auth/me')) {
    try { // a different user id than the cached one: the cached profile belongs to somebody else
      const prev = await cache.match(key);
      const [a, b] = await Promise.all([prev ? prev.clone().json() : null, res.clone().json()]);
      if (a && b && a.user && b.user && a.user.id !== b.user.id) await cache.delete(identityKey('/api/profile'));
    } catch { /* unreadable: keep going */ }
  }
  await cache.put(key, res);
}
async function sessionFetch(req) {
  const key = identityKey(new URL(req.url).pathname);
  const started = epoch;
  try {
    const res = await fetch(req);
    const cache = await caches.open(SESSION);
    if (res.status === 401) await wipeSession();
    else if (res.status === 404) await cache.delete(key); // e.g. /api/profile of an account that has not onboarded: no stale copy may outlive that answer
    else if (res.ok && started === epoch && !(await ephemeral())) await keepIdentity(cache, key, res.clone()).catch(() => undefined);
    return res;
  } catch {
    const hit = (await ephemeral()) ? undefined : await (await caches.open(SESSION)).match(key);
    return hit || new Response(JSON.stringify({ error: 'network' }), { status: 503, headers: { 'content-type': 'application/json' } });
  }
}

// ---- app shell ---------------------------------------------------------------------------------------------------------------------
async function trim(cache) { const keys = await cache.keys(); for (let i = 0; i < keys.length - SHELL_MAX_ENTRIES; i++) await cache.delete(keys[i]); }
const cacheable = (req, res) => res.ok && res.status === 200 && res.type !== 'opaque' && (req.mode === 'navigate' || req.destination === 'document' || !isHtml(res));

self.addEventListener('fetch', (e) => {
  const req = e.request; const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  if (same && req.method === 'POST' && IDENTITY_WRITES.includes(url.pathname)) {
    // Read "remember me" from a COPY of the request now; the real request goes on to the network untouched.
    const remember = url.pathname === '/api/auth/login' ? req.clone().json().then((b) => !(b && b.remember === false)).catch(() => true) : Promise.resolve(true);
    e.waitUntil((async () => { await wipeSession(); await setEphemeral(!(await remember)); })());
  } else if (same && req.method === 'DELETE' && url.pathname === '/api/account') e.waitUntil(wipeSession());
  if (req.method !== 'GET' || !same) return;
  if (SESSION_PATHS.includes(url.pathname)) { e.respondWith(sessionFetch(req)); return; }
  if (url.pathname.startsWith('/api/')) return; // never cache other API calls
  if (url.pathname.startsWith('/media/exercises/') && /\.(mp4|webm)$/.test(url.pathname)) { e.respondWith(videoFetch(req)); return; }
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { if (cacheable(req, r)) { const c = r.clone(); caches.open(SHELL).then((s) => s.put('/', c)).catch(() => undefined); } return r; }).catch(async () => (await caches.match('/')) || new Response('offline', { status: 503 })));
    return;
  }
  e.respondWith(caches.open(SHELL).then(async (cache) => {
    let hit = await cache.match(req);
    if (hit && isHtml(hit) && req.destination !== 'document') { await cache.delete(req); hit = undefined; } // a page stored under an asset URL
    const net = fetch(req).then((r) => { if (cacheable(req, r)) cache.put(req, r.clone()).then(() => trim(cache)).catch(() => undefined); return r; }).catch(() => hit);
    return hit || net;
  }));
});

self.addEventListener('message', (e) => {
  const d = e.data || {}; const reply = (m) => e.ports[0] && e.ports[0].postMessage(m);
  if (d.type === 'skip-waiting') self.skipWaiting();
  else if (d.type === 'clear-video-cache') e.waitUntil(caches.delete(VIDEO).then(() => reply({ ok: true })));
  else if (d.type === 'set-video-budget') e.waitUntil(caches.open(META).then((c) => c.put('/__budget', new Response(String(d.mb)))).then(() => reply({ ok: true })));
  else if (d.type === 'video-cache-size') e.waitUntil(videoUsage().then((bytes) => reply({ bytes })));
});
