import { describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import { request as httpRequest } from 'node:http';
import { buildApp } from '../src/createApp.ts';
import { extraRoutes } from '../src/routes/index.ts';
import { BoundedRateLimiter, createExpressApp } from '../src/http/express.ts';
import { PgliteAdapter } from '../src/db/pgliteAdapter.ts';
import { migrate } from '../src/db/migrate.ts';
import type { Router } from '../src/core/router.ts';

async function serve(opts: { trustProxy: number | boolean; mode?: 'hosted' | 'device'; limit?: number; adminUsernames?: string[]; largeBodies?: { global: number; perUser: number }; bodyDeadline?: { baseMs: number; perMbMs: number }; staticDir?: string }) {
  const db = await PgliteAdapter.create(); await migrate(db);
  const whoami = (r: Router) => { r.get('/api/whoami', async (ctx) => ({ json: { ip: ctx.req.ip } }), { auth: false }); };
  const api = buildApp({ db, mode: opts.mode ?? 'hosted', clock: () => new Date(), pbkdf2Iterations: 1000, secureCookies: false, sessionTtlDays: 1, ...(opts.adminUsernames ? { adminUsernames: opts.adminUsernames } : {}) }, [...extraRoutes, whoami]);
  const app = createExpressApp(api, { trustProxy: opts.trustProxy, mode: opts.mode ?? 'hosted', ...(opts.limit ? { globalLimitPerMin: opts.limit } : {}), ...(opts.largeBodies ? { largeBodies: opts.largeBodies } : {}), ...(opts.bodyDeadline ? { bodyDeadline: opts.bodyDeadline } : {}), ...(opts.staticDir ? { staticDir: opts.staticDir } : {}) });
  const server = await new Promise<import('node:http').Server>((res) => { const s = app.listen(0, '127.0.0.1', () => res(s)); });
  return { url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, close: () => new Promise<void>((r) => server.close(() => r())) };
}

describe('Express adapter', () => {
  it('serves /health and structured JSON errors (404, bad JSON)', async () => {
    const s = await serve({ trustProxy: false });
    expect((await (await fetch(`${s.url}/health`)).json())).toEqual({ ok: true, mode: 'hosted' });
    const nf = await fetch(`${s.url}/api/nope`); expect(nf.status).toBe(404); expect(await nf.json()).toEqual({ error: 'not_found' });
    const bad = await fetch(`${s.url}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{oops' });
    expect(bad.status).toBe(400); expect((await bad.json()).error).toBe('invalid_json');
    await s.close();
  });
  it('trust proxy: forwarded IP is honoured only when configured', async () => {
    const off = await serve({ trustProxy: false }); const on = await serve({ trustProxy: 1 });
    const h = { 'x-forwarded-for': '203.0.113.7' };
    expect((await (await fetch(`${off.url}/api/whoami`, { headers: h })).json()).ip).not.toContain('203.0.113.7');
    expect((await (await fetch(`${on.url}/api/whoami`, { headers: h })).json()).ip).toBe('203.0.113.7');
    await off.close(); await on.close();
  });
  it('JSON bodies over 100 KB are rejected with 413', async () => {
    const s = await serve({ trustProxy: false });
    const r = await fetch(`${s.url}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'abc', password: 'x'.repeat(150_000) }) });
    expect(r.status).toBe(413); expect((await r.json()).error).toBe('payload_too_large');
    await s.close();
  });
  it('/api/device/restore: 413 above 8 MB when hosted, accepted size in device mode (then needs auth)', async () => {
    const payload = JSON.stringify({ pad: 'x'.repeat(9 * 1024 * 1024) });
    const hosted = await serve({ trustProxy: false });
    expect((await fetch(`${hosted.url}/api/device/restore`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: payload })).status).toBe(413);
    const device = await serve({ trustProxy: false, mode: 'device' });
    expect((await fetch(`${device.url}/api/device/restore`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: payload })).status).toBe(401);
    await hosted.close(); await device.close();
  }, 60_000);
  it('global limiter returns 429 with Retry-After past the per-IP budget', async () => {
    const s = await serve({ trustProxy: false, limit: 5 });
    const codes: number[] = []; for (let i = 0; i < 8; i++) codes.push((await fetch(`${s.url}/api/health`)).status);
    expect(codes.slice(0, 5).every((c) => c === 200)).toBe(true); expect(codes.slice(5).every((c) => c === 429)).toBe(true);
    const r = await fetch(`${s.url}/api/health`); expect(r.headers.get('retry-after')).toBe('60');
    await s.close();
  });
  it('sets a session cookie with HttpOnly + SameSite over real HTTP', async () => {
    const s = await serve({ trustProxy: false });
    const r = await fetch(`${s.url}/api/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: 'user_h', password: 'correct-horse-battery' }) });
    expect(r.status).toBe(201); expect(r.headers.get('set-cookie')).toMatch(/lf_session=[0-9a-f]{64}; HttpOnly; SameSite=Lax/);
    await s.close();
  });
});

/** Registers over real HTTP and returns the cookie + CSRF headers of the new session. */
async function signUp(url: string, username: string): Promise<Record<string, string>> {
  const r = await fetch(`${url}/api/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password: 'correct-horse-battery' }) });
  const cookie = (r.headers.get('set-cookie') ?? '').split(';')[0] as string;
  return { cookie, 'x-csrf-token': ((await r.json()) as { csrfToken: string }).csrfToken };
}
/** Raw request (chunked when no content-length is given), for bodies fetch cannot send. */
function raw(url: string, path: string, headers: Record<string, string>, chunks: string[]): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = httpRequest({ host: u.hostname, port: u.port, path, method: 'POST', headers }, (res) => { let b = ''; res.on('data', (d) => { b += String(d); }); res.on('end', () => resolve({ status: res.statusCode ?? 0, body: b })); });
    req.on('error', reject);
    for (const c of chunks) req.write(c);
    req.end();
  });
}

describe('body caps come from the matched route, and large bodies need a session first', () => {
  it('an admin clip above 100 KB reaches the route (the route allows 7 MB) instead of a parser 413', async () => {
    const s = await serve({ trustProxy: false, adminUsernames: ['boss'] });
    const h = await signUp(s.url, 'boss');
    const r = await fetch(`${s.url}/api/admin/exercises/push_up/media`, { method: 'POST', headers: { 'content-type': 'application/json', ...h }, body: JSON.stringify({ mp4Base64: 'A'.repeat(600_000), url: '/media/exercises/push_up.mp4' }) });
    expect(r.status).toBe(422); expect((await r.json()).error).toBe('invalid_media'); // parsed and validated: not an mp4
    await s.close();
  });
  it('an anonymous multi-megabyte body is refused with 401 without being parsed (it is not even valid JSON)', async () => {
    const s = await serve({ trustProxy: false });
    for (const path of ['/api/device/restore', '/api/nutrition/photo-estimate', '/api/admin/exercises/push_up/media']) {
      const r = await fetch(`${s.url}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: `{${'x'.repeat(3 * 1024 * 1024)}` });
      expect(r.status, path).toBe(401); expect((await r.json()).error).toBe('unauthorized');
    }
    const h = await signUp(s.url, 'no_csrf');
    const r = await fetch(`${s.url}/api/device/restore`, { method: 'POST', headers: { 'content-type': 'application/json', cookie: h.cookie as string }, body: `{${'x'.repeat(1024 * 1024)}` });
    expect(r.status).toBe(403);
    await s.close();
  }, 60_000);
  it('a chunked body (no Content-Length) above a route cap is 413; an unsupported Content-Encoding is 415, not 500', async () => {
    const s = await serve({ trustProxy: false });
    const h = await signUp(s.url, 'chunky');
    const body = JSON.stringify({ target: { code: 'fr', name: 'French' }, keys: { a: 'x'.repeat(90 * 1024) } });
    const r = await raw(s.url, '/api/i18n/translate', { 'content-type': 'application/json', ...h }, [body.slice(0, 1000), body.slice(1000)]);
    expect(r.status).toBe(413); // the translate route allows 64 KB
    const enc = await fetch(`${s.url}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json', 'content-encoding': 'compress' }, body: '{}' });
    expect(enc.status).toBe(415);
    const gz = await fetch(`${s.url}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json', 'content-encoding': 'gzip' }, body: '{}' });
    expect(gz.status).toBe(415); // never inflated past the cap
    await s.close();
  });
  it('only a few large bodies are read at once: beyond that the answer is 503 with Retry-After', async () => {
    const s = await serve({ trustProxy: false, largeBodies: { global: 1, perUser: 1 } });
    const a = await signUp(s.url, 'slow_a'); const b = await signUp(s.url, 'slow_b');
    const u = new URL(s.url);
    // a's restore is still uploading (first chunk sent, body not finished)
    const pending = httpRequest({ host: u.hostname, port: u.port, path: '/api/device/restore', method: 'POST', headers: { 'content-type': 'application/json', 'content-length': '400000', ...a } });
    pending.on('error', () => undefined);
    pending.write('{"version":1,');
    await new Promise((r) => setTimeout(r, 200));
    const r = await fetch(`${s.url}/api/device/restore`, { method: 'POST', headers: { 'content-type': 'application/json', ...b }, body: JSON.stringify({ pad: 'x'.repeat(200_000) }) });
    expect(r.status).toBe(503); expect(r.headers.get('retry-after')).toBe('5');
    pending.destroy();
    await new Promise((r2) => setTimeout(r2, 200));
    const again = await fetch(`${s.url}/api/device/restore`, { method: 'POST', headers: { 'content-type': 'application/json', ...b }, body: JSON.stringify({ pad: 'x'.repeat(200_000) }) });
    expect(again.status).toBe(400); // the slot was given back: parsed, then refused by the schema
    await s.close();
  });
  it('a trickling upload loses its slot at the body deadline, so it cannot block everyone else for minutes', async () => {
    const s = await serve({ trustProxy: false, largeBodies: { global: 1, perUser: 1 }, bodyDeadline: { baseMs: 400, perMbMs: 0 } });
    const a = await signUp(s.url, 'trickle_a'); const b = await signUp(s.url, 'honest_b');
    const u = new URL(s.url);
    let cut = false;
    const slow = httpRequest({ host: u.hostname, port: u.port, path: '/api/nutrition/photo-estimate', method: 'POST', headers: { 'content-type': 'application/json', 'content-length': '300000', ...a } });
    slow.on('error', () => { cut = true; }); slow.on('response', () => { cut = true; });
    slow.write('{');
    const drip = setInterval(() => { if (!slow.destroyed) slow.write(' '); }, 100);
    const photo = () => fetch(`${s.url}/api/nutrition/photo-estimate`, { method: 'POST', headers: { 'content-type': 'application/json', ...b }, body: JSON.stringify({ jpegBase64: `/9j/${'A'.repeat(200_000)}`, lang: 'en' }) });
    await new Promise((r) => setTimeout(r, 150));
    const blocked = await photo();
    expect(blocked.status).toBe(503); expect((await blocked.json()).error).toBe('rate_limited'); // the slot is held while a's body arrives
    await new Promise((r) => setTimeout(r, 700));
    const after = await photo();
    expect((await after.json()).error).toBe('ai_unavailable'); // past the deadline: b's photo is read and reaches the route
    expect(cut).toBe(true);
    clearInterval(drip); slow.destroy();
    await s.close();
  });
  it('malformed static paths get a short plain 400 without a stack trace and without logging', async () => {
    const { mkdtempSync, rmSync, writeFileSync } = await import('node:fs');
    const dir = mkdtempSync('/tmp/wf-server-static-');
    writeFileSync(`${dir}/index.html`, '<!doctype html><title>x</title>');
    const s = await serve({ trustProxy: false, staticDir: dir });
    const errors: unknown[] = []; const orig = console.error; console.error = (...a: unknown[]) => { errors.push(a); };
    try {
      for (const p of ['/%E0%A4%A', '/assets/%E0%A4%A.js', '/x/%c0']) {
        const r = await fetch(`${s.url}${p}`);
        const text = await r.text();
        expect(r.status, p).toBe(400); expect(text).toBe('Bad request'); expect(text).not.toMatch(/URIError|node_modules/);
      }
      expect(errors).toEqual([]);
      expect((await fetch(`${s.url}/`)).status).toBe(200);
    } finally { console.error = orig; await s.close(); rmSync(dir, { recursive: true, force: true }); }
  });
  it('requests outside /api have their own per-IP limit', async () => {
    const { mkdtempSync, rmSync, writeFileSync } = await import('node:fs');
    const dir = mkdtempSync('/tmp/wf-server-static-');
    writeFileSync(`${dir}/index.html`, '<!doctype html><title>x</title>');
    const s = await serve({ trustProxy: false, staticDir: dir, limit: 3 }); // static budget = 2x the API budget
    const codes: number[] = []; for (let i = 0; i < 8; i++) codes.push((await fetch(`${s.url}/%c0`)).status);
    expect(codes).toEqual([400, 400, 400, 400, 400, 400, 429, 429]);
    await s.close(); rmSync(dir, { recursive: true, force: true });
  });
  it('the global limiter counts an IPv6 /64 as one client', async () => {
    const s = await serve({ trustProxy: 1, limit: 5 });
    const codes: number[] = [];
    for (let i = 1; i <= 7; i++) codes.push((await fetch(`${s.url}/api/health`, { headers: { 'x-forwarded-for': `2001:db8:1:2::${i}` } })).status);
    expect(codes).toEqual([200, 200, 200, 200, 200, 429, 429]);
    expect((await fetch(`${s.url}/api/health`, { headers: { 'x-forwarded-for': '2001:db8:1:3::1' } })).status).toBe(200);
    await s.close();
  });
});

describe('BoundedRateLimiter', () => {
  it('never grows beyond maxKeys under an IP-spoofing flood, and sweeps expired windows', () => {
    const l = new BoundedRateLimiter(10, 1000, 100);
    for (let i = 0; i < 5000; i++) l.hit(`ip-${i}`, 0);
    expect(l.size).toBeLessThanOrEqual(100);
    l.hit('later', 5000);
    expect(l.size).toBeLessThanOrEqual(2); // expired entries were swept
    for (let i = 0; i < 10; i++) expect(l.hit('same', 6000)).toBe(true);
    expect(l.hit('same', 6000)).toBe(false);
  });
});
