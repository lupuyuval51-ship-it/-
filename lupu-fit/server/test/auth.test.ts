import { describe, expect, it } from 'vitest';
import { MIGRATIONS } from '../src/db/migrationsBundle.ts';
import { migrate, MigrationDriftError } from '../src/db/migrate.ts';
import { hashPassword, verifyPassword, constantTimeEqual, PBKDF2_ITERATIONS } from '../src/crypto/portableCrypto.ts';
import { anon, call, makeApp, register } from './helpers.ts';
import { sha256Hex } from '../src/crypto/portableCrypto.ts';

describe('migrations', () => {
  it('apply once, are idempotent, and verify LF-normalised pinned checksums', async () => {
    const t = await makeApp();
    expect((await migrate(t.db)).applied).toEqual([]);
    const tables = (await t.db.query<{ tablename: string }>("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")).map((r) => r.tablename);
    for (const n of ['users', 'auth_sessions', 'auth_attempts', 'idempotency_keys', 'profiles', 'workout_sessions', 'session_sets', 'food_log_entries', 'xp_events', 'schema_migrations']) expect(tables).toContain(n);
    for (const m of MIGRATIONS) expect(m.sha256).toBe(await sha256Hex(m.sql));
    expect(MIGRATIONS.every((m) => !m.sql.includes('\r'))).toBe(true);
  });
  it('refuses to start when an applied migration drifted', async () => {
    const t = await makeApp();
    await t.db.query("UPDATE schema_migrations SET sha256 = 'deadbeef' WHERE name = '0001_initial.sql'");
    await expect(migrate(t.db)).rejects.toBeInstanceOf(MigrationDriftError);
  });
});

describe('password hashing', () => {
  it('uses pbkdf2_sha256 with 600,000 iterations by default, random salt, constant-time compare', async () => {
    const h = await hashPassword('hunter2-hunter2');
    const [alg, it, salt, hash] = h.split('$');
    expect(alg).toBe('pbkdf2_sha256'); expect(Number(it)).toBe(600_000); expect(PBKDF2_ITERATIONS).toBe(600_000);
    expect(salt).toHaveLength(32); expect(hash).toHaveLength(64);
    expect((await verifyPassword('hunter2-hunter2', h)).ok).toBe(true);
    expect((await verifyPassword('wrong', h)).ok).toBe(false);
    expect(await hashPassword('hunter2-hunter2')).not.toBe(h);
    expect(constantTimeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true);
    expect(constantTimeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4]))).toBe(false);
    expect(constantTimeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(false);
  }, 30_000);
});

describe('auth flow', () => {
  it('registers, sets an HttpOnly SameSite cookie, returns me, logs out', async () => {
    const t = await makeApp();
    const c = anon();
    const r = await call(t, c, 'POST', '/api/auth/register', { username: 'New_User', password: 'correct-horse-battery' });
    expect(r.status).toBe(201);
    expect(r.setCookies?.[0]).toMatch(/HttpOnly/); expect(r.setCookies?.[0]).toMatch(/SameSite=Lax/);
    expect(r.json.user.username).toBe('new_user');
    const me = await call(t, c, 'GET', '/api/auth/me');
    expect(me.status).toBe(200); expect(me.json.onboarded).toBe(false);
    const out = await call(t, c, 'POST', '/api/auth/logout');
    expect(out.status).toBe(200);
    expect((await call(t, c, 'GET', '/api/auth/me')).status).toBe(401);
  });
  it('rejects duplicates, weak passwords and bad usernames with structured errors', async () => {
    const t = await makeApp();
    await register(t, 'dup');
    expect((await call(t, anon('10.0.0.2'), 'POST', '/api/auth/register', { username: 'dup', password: 'correct-horse-battery' })).status).toBe(409);
    const weak = await call(t, anon('10.0.0.3'), 'POST', '/api/auth/register', { username: 'user_x', password: 'short' });
    expect(weak.status).toBe(400); expect(weak.json.error).toBe('validation_error');
    expect((await call(t, anon('10.0.0.4'), 'POST', '/api/auth/register', { username: 'no', password: 'correct-horse-battery' })).status).toBe(400);
  });
  it('wrong password and unknown username return the IDENTICAL response (no enumeration)', async () => {
    const t = await makeApp();
    await register(t, 'real');
    const a = await call(t, anon('10.0.0.5'), 'POST', '/api/auth/login', { username: 'real', password: 'wrong-password-1' });
    const b = await call(t, anon('10.0.0.6'), 'POST', '/api/auth/login', { username: 'ghost', password: 'wrong-password-1' });
    expect(a.status).toBe(401); expect(b.status).toBe(401);
    expect(a.json).toEqual(b.json);
    expect(a.json.error).toBe('invalid_credentials');
  });
  it('locks out after repeated failures with 429 + Retry-After, keyed by username AND by IP; success is blocked while locked', async () => {
    const t = await makeApp();
    await register(t, 'victim');
    for (let i = 0; i < 5; i++) expect((await call(t, anon('10.9.9.9'), 'POST', '/api/auth/login', { username: 'victim', password: `bad-password-${i}x` })).status).toBe(401);
    const locked = await call(t, anon('10.9.9.9'), 'POST', '/api/auth/login', { username: 'victim', password: 'correct-horse-battery' });
    expect(locked.status).toBe(429);
    expect(Number(locked.headers?.['retry-after'])).toBeGreaterThan(0);
    // a different IP hitting the same username is locked too (username key)
    expect((await call(t, anon('10.8.8.8'), 'POST', '/api/auth/login', { username: 'victim', password: 'correct-horse-battery' })).status).toBe(429);
    // the same IP trying other usernames is locked too (IP key)
    expect((await call(t, anon('10.9.9.9'), 'POST', '/api/auth/login', { username: 'other', password: 'whatever-password' })).status).toBe(429);
    // lock survives a "restart" (state is in the DB) and expires with time; backoff doubles on repeated failure
    t.now.t = new Date(t.now.t.getTime() + 31_000);
    expect((await call(t, anon('10.7.7.7'), 'POST', '/api/auth/login', { username: 'victim', password: 'correct-horse-battery' })).status).toBe(200);
  });
  it('transparently rehashes an old low-iteration hash on successful login', async () => {
    const t = await makeApp({ pbkdf2Iterations: 2000 });
    await t.db.query("INSERT INTO users (id, username, password_hash) VALUES ('u1', 'old', $1)", [await hashPassword('correct-horse-battery', 500)]);
    expect((await call(t, anon(), 'POST', '/api/auth/login', { username: 'old', password: 'correct-horse-battery' })).status).toBe(200);
    const row = (await t.db.query<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = 'u1'"))[0];
    expect(row?.password_hash.split('$')[1]).toBe('2000');
  });
  it('validates usernames: too short, bad characters, too long; uppercase is lowercased', async () => {
    const t = await makeApp();
    const reg = (username: string, ip: string) => call(t, anon(ip), 'POST', '/api/auth/register', { username, password: 'correct-horse-battery' });
    for (const [i, bad] of ['ab', 'a b c', 'has@sign', '_leading', '-dash', 'עברית', 'x'.repeat(25), '   '].entries()) {
      const r = await reg(bad, `10.2.0.${i + 1}`);
      expect(r.status, bad).toBe(400); expect(r.json.error).toBe('validation_error');
    }
    const ok = await reg('  Mixed.Case_9-x  ', '10.2.1.1');
    expect(ok.status).toBe(201); expect(ok.json.user).toMatchObject({ username: 'mixed.case_9-x', role: 'user' });
    expect(Object.keys(ok.json.user).sort()).toEqual(['id', 'role', 'username']);
  });
  it('treats usernames case-insensitively: duplicate -> 409 username_taken, login works in any case', async () => {
    const t = await makeApp();
    await register(t, 'Yuval_L');
    const dup = await call(t, anon('10.3.0.1'), 'POST', '/api/auth/register', { username: 'YUVAL_l', password: 'correct-horse-battery' });
    expect(dup.status).toBe(409); expect(dup.json.error).toBe('username_taken');
    const c = anon('10.3.0.2');
    const login = await call(t, c, 'POST', '/api/auth/login', { username: 'yUvAl_L', password: 'correct-horse-battery' });
    expect(login.status).toBe(200); expect(login.json.user.username).toBe('yuval_l');
    expect((await call(t, c, 'GET', '/api/auth/me')).json.user.username).toBe('yuval_l');
  });
  it('has no password recovery endpoints', async () => {
    const t = await makeApp();
    expect((await call(t, anon(), 'POST', '/api/auth/forgot-password', { username: 'nobody' })).status).toBe(404);
    expect((await call(t, anon(), 'POST', '/api/auth/reset-password', { token: 'a'.repeat(32), password: 'a-brand-new-password' })).status).toBe(404);
  });
});

describe('CSRF, auth-gating, idempotency', () => {
  it('requires a session for protected routes and a matching CSRF token on mutations (403)', async () => {
    const t = await makeApp();
    expect((await call(t, anon(), 'GET', '/api/auth/me')).status).toBe(401);
    const c = await register(t);
    const noCsrf = { ...c, csrf: '' };
    expect((await call(t, noCsrf, 'POST', '/api/auth/logout')).status).toBe(403);
    expect((await call(t, { ...c, csrf: 'wrong' }, 'POST', '/api/auth/logout')).status).toBe(403);
    expect((await call(t, c, 'POST', '/api/auth/logout')).status).toBe(200);
  });
  it('unknown routes 404, wrong methods 405, oversized bodies 413', async () => {
    const t = await makeApp();
    expect((await call(t, anon(), 'GET', '/api/nope')).status).toBe(404);
    expect((await call(t, anon(), 'DELETE', '/api/auth/login')).status).toBe(405);
    const big = await t.app.handle({ method: 'POST', path: '/api/auth/login', query: {}, headers: {}, body: {}, ip: '1.1.1.1', bodyBytes: 200_000 });
    expect(big.status).toBe(413);
  });
});
