/**
 * Behaviour tests for client/public/sw.js: the file is plain JS served as-is, so it is loaded here into a sandbox with a fake
 * Cache Storage, a scriptable network and a fake `self`.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

const ORIGIN = 'https://app.test';
const SRC = readFileSync(resolve(__dirname, '../../public/sw.js'), 'utf8');
const abs = (u: string | Request): string => new URL(typeof u === 'string' ? u : u.url, ORIGIN).href;

class FakeCache {
  entries = new Map<string, Response>();
  async match(r: string | Request): Promise<Response | undefined> { const hit = this.entries.get(abs(r)); return hit ? hit.clone() : undefined; }
  async put(r: string | Request, res: Response): Promise<void> { if (res.status === 206) throw new TypeError('partial'); this.entries.delete(abs(r)); this.entries.set(abs(r), res.clone()); }
  async add(r: string): Promise<void> { throw new Error(`add not used: ${r}`); }
  async addAll(): Promise<void> { /* precache of the shell is not under test */ }
  async delete(r: string | Request): Promise<boolean> { return this.entries.delete(abs(r)); }
  async keys(): Promise<Request[]> { return [...this.entries.keys()].map((k) => new Request(k)); }
}
class FakeStorage {
  stores = new Map<string, FakeCache>();
  async open(n: string): Promise<FakeCache> { let c = this.stores.get(n); if (!c) { c = new FakeCache(); this.stores.set(n, c); } return c; }
  async delete(n: string): Promise<boolean> { return this.stores.delete(n); }
  async keys(): Promise<string[]> { return [...this.stores.keys()]; }
  async match(r: string): Promise<Response | undefined> { for (const c of this.stores.values()) { const h = await c.match(r); if (h) return h; } return undefined; }
}

type Handler = (e: unknown) => void;
interface Sandbox {
  caches: FakeStorage;
  net: { handler: (req: Request) => Promise<Response> | Response };
  fire: (req: Request) => Promise<Response | null>;
  install: () => Promise<void>;
  message: (data: unknown) => Promise<unknown>;
  pending: Promise<unknown>[];
}

function boot(): Sandbox {
  const handlers = new Map<string, Handler>();
  const caches = new FakeStorage();
  const net = { handler: (_req: Request): Promise<Response> | Response => new Response('', { status: 404 }) };
  const self = { addEventListener: (t: string, h: Handler) => { handlers.set(t, h); }, location: { origin: ORIGIN }, clients: { claim: async () => undefined }, skipWaiting: () => undefined };
  const fetchFn = async (input: string | Request): Promise<Response> => net.handler(typeof input === 'string' ? new Request(new URL(input, ORIGIN)) : input);
  new Function('self', 'caches', 'fetch', 'Response', 'Request', 'URL', SRC)(self, caches, fetchFn, Response, Request, URL); // scan-ok: loads our own sw.js into a test sandbox
  const pending: Promise<unknown>[] = [];
  return {
    caches, net, pending,
    install: async () => { const w: Promise<unknown>[] = []; handlers.get('install')?.({ waitUntil: (p: Promise<unknown>) => w.push(p) }); await Promise.all(w); },
    fire: async (req) => {
      let responded: Promise<Response> | null = null; const wait: Promise<unknown>[] = [];
      handlers.get('fetch')?.({ request: req, respondWith: (p: Promise<Response> | Response) => { responded = Promise.resolve(p); }, waitUntil: (p: Promise<unknown>) => wait.push(p) });
      const out = responded ? await (responded as Promise<Response>) : null;
      await Promise.all(wait); await Promise.all(pending.splice(0));
      return out;
    },
    message: async (data) => new Promise((resolveMsg) => {
      const port = { postMessage: (m: unknown) => resolveMsg(m) };
      const w: Promise<unknown>[] = [];
      handlers.get('message')?.({ data, ports: [port], waitUntil: (p: Promise<unknown>) => w.push(p) });
      void Promise.all(w).then(() => setTimeout(() => resolveMsg(null), 20));
    }),
  };
}

const get = (path: string, init: RequestInit = {}) => new Request(`${ORIGIN}${path}`, init);
const post = (path: string, body: unknown) => new Request(`${ORIGIN}${path}`, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const meOf = (id: string) => json({ user: { id, username: id }, csrfToken: 'x', onboarded: true, mode: 'hosted' });
const profileOf = (age: number) => json({ profile: { age }, targets: {} });
const online = (sb: Sandbox, routes: Record<string, () => Response>) => { sb.net.handler = (req) => { const f = routes[new URL(req.url).pathname]; return f ? f() : new Response('', { status: 404 }); }; };
const offline = (sb: Sandbox) => { sb.net.handler = () => { throw new TypeError('Failed to fetch'); }; };
const seen = async (sb: Sandbox, path: string) => { const res = await sb.fire(get(path)); return res ? { status: res.status, body: (await res.json()) as Record<string, unknown> } : null; };

let sb: Sandbox;
beforeEach(() => { sb = boot(); });

describe('last-known identity cache', () => {
  it('serves the last copy only when the network is down', async () => {
    online(sb, { '/api/auth/me': () => meOf('A'), '/api/profile': () => profileOf(30) });
    await seen(sb, '/api/auth/me'); await seen(sb, '/api/profile');
    online(sb, { '/api/auth/me': () => meOf('A'), '/api/profile': () => profileOf(31) });
    expect((await seen(sb, '/api/profile'))?.body).toMatchObject({ profile: { age: 31 } }); // online: always the network answer
    await seen(sb, '/api/auth/me');
    offline(sb);
    expect((await seen(sb, '/api/profile'))?.body).toMatchObject({ profile: { age: 31 } });
    expect((await seen(sb, '/api/auth/me'))?.body).toMatchObject({ user: { id: 'A' } });
  });

  it('logout wipes the copy even when the logout request itself fails offline', async () => {
    online(sb, { '/api/auth/me': () => meOf('A'), '/api/profile': () => profileOf(30) });
    await seen(sb, '/api/auth/me'); await seen(sb, '/api/profile');
    offline(sb);
    await sb.fire(post('/api/auth/logout', {}));
    expect((await seen(sb, '/api/profile'))?.status).toBe(503);
    expect((await seen(sb, '/api/auth/me'))?.status).toBe(503);
  });

  it('user B signing in after user A never gets A\'s profile, even when B has no profile yet and the network then drops', async () => {
    online(sb, { '/api/auth/me': () => meOf('A'), '/api/profile': () => profileOf(30) });
    await seen(sb, '/api/auth/me'); await seen(sb, '/api/profile');
    // A is gone WITHOUT a logout call (cookie lost / session expired while this tab was closed); B logs in.
    online(sb, { '/api/auth/login': () => meOf('B'), '/api/auth/me': () => meOf('B'), '/api/profile': () => json({ error: 'profile_required' }, 404) });
    await sb.fire(post('/api/auth/login', { username: 'b', password: 'x' }));
    await seen(sb, '/api/auth/me'); await seen(sb, '/api/profile'); // 404: B has not onboarded
    offline(sb);
    expect((await seen(sb, '/api/profile'))?.status).toBe(503);
    expect((await seen(sb, '/api/auth/me'))?.body).toMatchObject({ user: { id: 'B' } });
  });

  it('a different user id on /api/auth/me drops the cached profile of the previous user', async () => {
    online(sb, { '/api/auth/me': () => meOf('A'), '/api/profile': () => profileOf(30) });
    await seen(sb, '/api/auth/me'); await seen(sb, '/api/profile');
    online(sb, { '/api/auth/me': () => meOf('B') });
    await seen(sb, '/api/auth/me');
    offline(sb);
    expect((await seen(sb, '/api/profile'))?.status).toBe(503);
    expect((await seen(sb, '/api/auth/me'))?.body).toMatchObject({ user: { id: 'B' } });
  });

  it('a 401 wipes everything; a 404 on the profile removes only that copy', async () => {
    online(sb, { '/api/auth/me': () => meOf('A'), '/api/profile': () => profileOf(30) });
    await seen(sb, '/api/auth/me'); await seen(sb, '/api/profile');
    online(sb, { '/api/profile': () => json({ error: 'profile_required' }, 404), '/api/auth/me': () => meOf('A') });
    await seen(sb, '/api/profile');
    offline(sb);
    expect((await seen(sb, '/api/profile'))?.status).toBe(503);
    expect((await seen(sb, '/api/auth/me'))?.status).toBe(200);
    online(sb, { '/api/auth/me': () => json({ error: 'unauthorized' }, 401) });
    await seen(sb, '/api/auth/me');
    offline(sb);
    expect((await seen(sb, '/api/auth/me'))?.status).toBe(503);
  });

  it('account deletion wipes the copy', async () => {
    online(sb, { '/api/auth/me': () => meOf('A') });
    await seen(sb, '/api/auth/me');
    offline(sb);
    await sb.fire(new Request(`${ORIGIN}/api/account`, { method: 'DELETE', body: '{}', headers: { 'content-type': 'application/json' } }));
    expect((await seen(sb, '/api/auth/me'))?.status).toBe(503);
  });

  it('an answer that was already in flight when the person logged out is not stored afterwards', async () => {
    let release!: () => void; const gate = new Promise<void>((r) => { release = r; });
    sb.net.handler = async (req) => { if (new URL(req.url).pathname === '/api/profile') { await gate; return profileOf(30); } return json({ ok: true }); };
    const slow = sb.fire(get('/api/profile'));
    await new Promise((r) => setTimeout(r, 5));
    await sb.fire(post('/api/auth/logout', {}));
    release(); await slow;
    offline(sb);
    expect((await seen(sb, '/api/profile'))?.status).toBe(503);
  });

  it('"remember me" off (shared device) keeps no offline copy at all', async () => {
    online(sb, { '/api/auth/login': () => meOf('A'), '/api/auth/me': () => meOf('A'), '/api/profile': () => profileOf(30) });
    await sb.fire(post('/api/auth/login', { username: 'a', password: 'x', remember: false }));
    await seen(sb, '/api/auth/me'); await seen(sb, '/api/profile');
    offline(sb);
    expect((await seen(sb, '/api/profile'))?.status).toBe(503);
    online(sb, { '/api/auth/login': () => meOf('A'), '/api/auth/me': () => meOf('A'), '/api/profile': () => profileOf(30) });
    await sb.fire(post('/api/auth/login', { username: 'a', password: 'x' })); // remember again
    await seen(sb, '/api/auth/me'); await seen(sb, '/api/profile');
    offline(sb);
    expect((await seen(sb, '/api/profile'))?.status).toBe(200);
  });

  it('registering with "keep me signed in" off keeps no offline copy either', async () => {
    online(sb, { '/api/auth/register': () => meOf('A'), '/api/auth/me': () => meOf('A'), '/api/profile': () => profileOf(30) });
    await sb.fire(post('/api/auth/register', { username: 'a', password: 'x', remember: false }));
    await seen(sb, '/api/auth/me'); await seen(sb, '/api/profile');
    offline(sb);
    expect((await seen(sb, '/api/profile'))?.status).toBe(503);
  });

  it('other API calls are never intercepted or cached', async () => {
    online(sb, { '/api/sessions': () => json({ sessions: [] }) });
    expect(await sb.fire(get('/api/sessions'))).toBeNull();
    expect([...sb.caches.stores.keys()].filter((k) => k.startsWith('lupu-session'))).toEqual([]);
  });
});

describe('technique clips', () => {
  const clip = () => new Response(new Uint8Array(100), { status: 200, headers: { 'content-type': 'video/mp4', 'content-length': '100' } });
  const html = () => new Response('<!doctype html><div id="root"></div>', { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });

  it('never caches the app shell that the server returns for a missing clip, and does not keep serving one cached by an older build', async () => {
    online(sb, { '/media/exercises/push_up.mp4': html });
    const first = await sb.fire(get('/media/exercises/push_up.mp4'));
    expect(first?.headers.get('content-type')).toMatch(/html/); // passed through to the page, so the <video> shows its own error
    expect((await sb.caches.open('lupu-video-cache')).entries.size).toBe(0);
    (await sb.caches.open('lupu-video-cache')).entries.set(abs('/media/exercises/push_up.mp4'), html()); // poison left by an older build
    online(sb, { '/media/exercises/push_up.mp4': clip });
    const healed = await sb.fire(get('/media/exercises/push_up.mp4'));
    expect(healed?.headers.get('content-type')).toBe('video/mp4');
    expect((await sb.caches.open('lupu-video-cache')).entries.get(abs('/media/exercises/push_up.mp4'))?.headers.get('content-type')).toBe('video/mp4');
  });

  it('errors are passed through and not cached', async () => {
    online(sb, { '/media/exercises/x.mp4': () => new Response('nope', { status: 404, headers: { 'content-type': 'text/plain' } }) });
    expect((await sb.fire(get('/media/exercises/x.mp4')))?.status).toBe(404);
    expect((await sb.caches.open('lupu-video-cache')).entries.size).toBe(0);
  });

  it('answers Range requests offline: bounded, open-ended and suffix ranges; 416 beyond the end; the whole file otherwise', async () => {
    online(sb, { '/media/exercises/a.mp4': clip });
    await sb.fire(get('/media/exercises/a.mp4'));
    offline(sb);
    const range = async (h: string) => { const r = await sb.fire(get('/media/exercises/a.mp4', { headers: { range: h } })); return { status: r!.status, cr: r!.headers.get('content-range'), len: (await r!.arrayBuffer()).byteLength }; };
    expect(await range('bytes=0-9')).toEqual({ status: 206, cr: 'bytes 0-9/100', len: 10 });
    expect(await range('bytes=90-')).toEqual({ status: 206, cr: 'bytes 90-99/100', len: 10 });
    expect(await range('bytes=-10')).toEqual({ status: 206, cr: 'bytes 90-99/100', len: 10 });
    expect(await range('bytes=50-5000')).toEqual({ status: 206, cr: 'bytes 50-99/100', len: 50 });
    expect(await range('bytes=100-')).toEqual({ status: 416, cr: 'bytes */100', len: 0 });
    expect(await range('bytes=-0')).toEqual({ status: 416, cr: 'bytes */100', len: 0 });
    expect(await range('bytes=0-1,5-6')).toEqual({ status: 200, cr: null, len: 100 });
    expect(await range('garbage')).toEqual({ status: 200, cr: null, len: 100 });
  });

  it('pre-caches only real clips on install', async () => {
    sb.net.handler = (req) => {
      const p = new URL(req.url).pathname;
      if (p.endsWith('media-manifest.json')) return json({ priorityA: ['good', '../evil', 'bad'] });
      if (p === '/media/exercises/good.mp4') return clip();
      if (p === '/media/exercises/good.jpg') return new Response(new Uint8Array(5), { headers: { 'content-type': 'image/jpeg' } });
      return html(); // everything else: the SPA fallback
    };
    await sb.install();
    expect([...(await sb.caches.open('lupu-video-cache')).entries.keys()].sort()).toEqual([abs('/media/exercises/good.jpg'), abs('/media/exercises/good.mp4')]);
  });
});

describe('app shell', () => {
  const page = (status = 200) => new Response('<!doctype html><div id="root"></div>', { status, headers: { 'content-type': 'text/html' } });
  const nav = (path = '/') => { const r = get(path); Object.defineProperty(r, 'mode', { value: 'navigate' }); return r; };
  const asset = (path: string, destination: string) => { const r = get(path); Object.defineProperty(r, 'destination', { value: destination }); return r; };

  it('keeps a good page as the offline shell but never an error page', async () => {
    online(sb, { '/': () => page() }); await sb.fire(nav('/'));
    online(sb, { '/': () => page(502) }); expect((await sb.fire(nav('/')))?.status).toBe(502);
    offline(sb);
    const off = await sb.fire(nav('/workouts'));
    expect(off?.status).toBe(200); expect(await off?.text()).toContain('id="root"');
  });

  it('keeps the HTML shell when a JSON file or an image is opened in the app window, and never serves a non-page as the shell', async () => {
    online(sb, { '/': () => page(), '/manifest.webmanifest': () => new Response('{"name":"LUPU-FIT"}', { status: 200, headers: { 'content-type': 'application/manifest+json' } }), '/icons/a.png': () => new Response('png', { status: 200, headers: { 'content-type': 'image/png' } }) });
    await sb.fire(nav('/'));
    await sb.fire(nav('/manifest.webmanifest')); await sb.fire(nav('/icons/a.png'));
    offline(sb);
    const off = await sb.fire(nav('/'));
    expect(off?.headers.get('content-type')).toContain('text/html'); expect(await off?.text()).toContain('id="root"');
    // an older build stored JSON as the shell: answer 503 rather than raw JSON
    (await sb.caches.open('lupu-shell-v2')).entries.set(abs('/'), new Response('{"name":"LUPU-FIT"}', { headers: { 'content-type': 'application/manifest+json' } }));
    expect((await sb.fire(nav('/')))?.status).toBe(503);
  });

  it('does not store an HTML page under a script or style URL', async () => {
    online(sb, { '/assets/app-1.js': () => page() });
    await sb.fire(asset('/assets/app-1.js', 'script'));
    expect((await sb.caches.open('lupu-shell-v2')).entries.size).toBe(0);
    online(sb, { '/assets/app-1.js': () => new Response('x', { status: 200, headers: { 'content-type': 'text/javascript' } }) });
    await sb.fire(asset('/assets/app-1.js', 'script'));
    expect((await sb.caches.open('lupu-shell-v2')).entries.size).toBe(1);
  });

  it('is bounded: build files of old deployments are evicted oldest first, while dish photos and fonts are never pushed out by them', async () => {
    sb.net.handler = (req) => new Response('x', { status: 200, headers: { 'content-type': new URL(req.url).pathname.endsWith('.webp') ? 'image/webp' : 'text/javascript' } });
    await sb.fire(asset('/media/dishes/a.webp', 'image')); await sb.fire(asset('/fonts/heebo.woff2', 'font'));
    for (let i = 0; i < 170; i++) await sb.fire(asset(`/assets/chunk-${i}.js`, 'script'));
    const keys = [...(await sb.caches.open('lupu-shell-v2')).entries.keys()];
    expect(keys.filter((k) => k.includes('/assets/')).length).toBe(150);
    expect(keys).toContain(abs('/assets/chunk-169.js')); expect(keys).not.toContain(abs('/assets/chunk-0.js'));
    expect(keys).toContain(abs('/media/dishes/a.webp')); expect(keys).toContain(abs('/fonts/heebo.woff2'));
  });
});
