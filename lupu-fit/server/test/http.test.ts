import { describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import { buildApp } from '../src/createApp.ts';
import { extraRoutes } from '../src/routes/index.ts';
import { BoundedRateLimiter, createExpressApp } from '../src/http/express.ts';
import { PgliteAdapter } from '../src/db/pgliteAdapter.ts';
import { migrate } from '../src/db/migrate.ts';
import type { Router } from '../src/core/router.ts';

async function serve(opts: { trustProxy: number | boolean; mode?: 'hosted' | 'device'; limit?: number }) {
  const db = await PgliteAdapter.create(); await migrate(db);
  const whoami = (r: Router) => { r.get('/api/whoami', async (ctx) => ({ json: { ip: ctx.req.ip } }), { auth: false }); };
  const api = buildApp({ db, mode: opts.mode ?? 'hosted', clock: () => new Date(), pbkdf2Iterations: 1000, secureCookies: false, sessionTtlDays: 1 }, [...extraRoutes, whoami]);
  const app = createExpressApp(api, { trustProxy: opts.trustProxy, mode: opts.mode ?? 'hosted', ...(opts.limit ? { globalLimitPerMin: opts.limit } : {}) });
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
    const r = await fetch(`${s.url}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'a@b.co', password: 'x'.repeat(150_000) }) });
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
    const r = await fetch(`${s.url}/api/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'h@example.com', password: 'correct-horse-battery' }) });
    expect(r.status).toBe(201); expect(r.headers.get('set-cookie')).toMatch(/lf_session=[0-9a-f]{64}; HttpOnly; SameSite=Lax/);
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
