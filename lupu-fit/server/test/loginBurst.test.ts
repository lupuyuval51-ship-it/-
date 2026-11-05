/** A burst of wrong logins from one address must not buy one PBKDF2 run per guess (CPU denial of service for every other sign-in). */
import { describe, expect, it, vi } from 'vitest';

const calls = vi.hoisted(() => ({ verify: 0 }));
vi.mock('../src/crypto/portableCrypto.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../src/crypto/portableCrypto.ts')>();
  return { ...real, verifyPassword: async (...a: Parameters<typeof real.verifyPassword>) => { calls.verify++; return real.verifyPassword(...a); } };
});

import { POLICIES } from '../src/core/rateLimit.ts';
import type { DbAdapter } from '../src/db/adapter.ts';
import { buildApp } from '../src/createApp.ts';
import { extraRoutes } from '../src/routes/index.ts';
import { anon, call, makeApp, register } from './helpers.ts';

const networked = (db: DbAdapter): DbAdapter => {
  const pause = () => new Promise<void>((r) => setImmediate(r));
  const wrap = (inner: DbAdapter): DbAdapter => ({
    query: async <T>(sql: string, params?: readonly unknown[]) => { const rows = await inner.query<T>(sql, params); await pause(); return rows; },
    transaction: (fn) => inner.transaction((tx) => fn(wrap(tx))),
  });
  return wrap(db);
};

describe('login counts every attempt before hashing', () => {
  it('50 parallel wrong logins from one address hash at most the threshold; the rest get 429 without hashing', async () => {
    const t = await makeApp(); await register(t, 'target', '10.20.0.1');
    const app = buildApp({ db: networked(t.db), mode: 'hosted', clock: () => t.now.t, pbkdf2Iterations: 1000, secureCookies: false, sessionTtlDays: 30 }, extraRoutes);
    calls.verify = 0;
    const rs = await Promise.all(Array.from({ length: 50 }, (_, i) => app.handle({ method: 'POST', path: '/api/auth/login', query: {}, headers: {}, body: { username: i % 2 ? 'target' : `nobody_${i}`, password: `wrong-guess-${i}` }, ip: '10.20.0.9' })));
    const threshold = POLICIES['login']!.threshold;
    expect(calls.verify).toBeLessThanOrEqual(threshold);
    expect(rs.filter((r) => r.status === 401).length).toBe(calls.verify);
    expect(rs.filter((r) => r.status === 429).length).toBe(50 - calls.verify);
  });
  it('a correct password as the threshold-th attempt still signs in (its own lock is not held against it), and does not count against the address', async () => {
    const t = await makeApp(); await register(t, 'careful', '10.21.0.1');
    for (let i = 0; i < POLICIES['login']!.threshold - 1; i++) expect((await call(t, anon('10.21.0.2'), 'POST', '/api/auth/login', { username: 'careful', password: `typo-${i}-password` })).status).toBe(401);
    expect((await call(t, anon('10.21.0.2'), 'POST', '/api/auth/login', { username: 'careful', password: 'correct-horse-battery' })).status).toBe(200);
    // the success took its own attempt back: the address has threshold-1 failures, so one more wrong guess is still a 401, not a 429
    expect((await call(t, anon('10.21.0.2'), 'POST', '/api/auth/login', { username: 'other_name', password: 'wrong-password-x' })).status).toBe(401);
    expect((await call(t, anon('10.21.0.2'), 'POST', '/api/auth/login', { username: 'other_name', password: 'wrong-password-y' })).status).toBe(429);
  });
});
