/**
 * The device worker's runtime on the full device stack (aliases, device env, PGlite in memory), without a
 * browser: boot states, the hidden device account (created, kept, recovered, re-signed-in, deleted) and the
 * one-request-at-a-time queue. The worker entry (Web Locks, postMessage) is covered by the device E2E test.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../../../../server/src/db/pool';
import { DeviceBuffer } from '../buffer';
import { deviceDatabaseStats } from '../shims/pg';
import { randomBytes, randomUUID } from '../shims/crypto';
import { createAccountStore } from './account-store';
import type { BootState } from './protocol';
import { bootDeviceRuntime, classifyBootError, type DeviceRuntime } from './runtime';
import { DEVICE_EMAIL_DOMAIN, DeviceSession, newDeviceAccount, type PageRequest } from './session';
import { createDispatcher, type Application } from '../shims/express';
import { createApp } from '../../../../server/src/app';

const PROFILE = { locale: 'he' as const, timezone: 'Asia/Jerusalem', displayName: 'אני' };
const states: BootState[] = [];
let runtime: DeviceRuntime;
const nodeBuffer = globalThis.Buffer;

const page = (method: string, url: string, body?: unknown, headers: Record<string, string> = {}): PageRequest => ({
  method,
  url,
  headers: { accept: 'application/json', ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...headers },
  body: body === undefined ? null : JSON.stringify(body),
});
const json = (res: { body: string | Uint8Array | null }) => JSON.parse(typeof res.body === 'string' ? res.body : '{}');
const header = (res: { headers: [string, string][] }, name: string) => res.headers.filter(([k]) => k.toLowerCase() === name);
const stored = () => db.maybeOne<{ email: string; password: string; cookie: string | null }>('SELECT email, password, cookie FROM device.account WHERE id = 1');
const sessions = () => db.one<{ n: number }>('SELECT count(*)::int AS n FROM auth_sessions').then((r) => r.n);

beforeAll(async () => {
  globalThis.Buffer = DeviceBuffer as unknown as typeof Buffer;
  runtime = await bootDeviceRuntime((s) => states.push(s), () => PROFILE);
});

afterAll(async () => {
  globalThis.Buffer = nodeBuffer;
  await db.close();
});

describe('boot', () => {
  it('reports each step of a first launch, in order', () => {
    expect(states.map((s) => (s.state === 'booting' ? `${s.step}${s.firstLaunch ? '*' : ''}` : s.state))).toEqual([
      'database',
      'migrating*',
      ...states.slice(2, -2).map(() => 'migrating*'),
      'content*',
      'account*',
    ]);
  });

  it('creates the hidden device account and keeps its credentials only in the database', async () => {
    const account = await stored();
    expect(account?.email).toMatch(new RegExp(`^device-[0-9a-f-]{36}@${DEVICE_EMAIL_DOMAIN.replace('.', '\\.')}$`));
    expect(account?.password).toMatch(/^[A-Za-z0-9_-]{43}a1$/);
    expect(account?.cookie).toMatch(/^fitai_session=[A-Za-z0-9_-]{43}$/);
    const user = await db.one<{ locale: string; timezone: string; display_name: string }>('SELECT locale, timezone, display_name FROM users WHERE email = $1', [account!.email]);
    expect(user).toEqual({ locale: 'he', timezone: 'Asia/Jerusalem', display_name: 'אני' });
  });

  it('classifies start-up failures for the page', () => {
    expect(classifyBootError(new DOMException('Quota exceeded', 'QuotaExceededError')).reason).toBe('storage_full');
    expect(classifyBootError(new Error('IndexedDB open failed')).reason).toBe('storage');
    expect(classifyBootError(new Error('WebAssembly.instantiate(): out of memory')).reason).toBe('unsupported');
    expect(classifyBootError(new Error('boom'))).toEqual({ reason: 'unknown', detail: 'Error: boom' });
  });
});

describe('requests from the page', () => {
  it('signs every request in with the device session; the page never sees the cookie', async () => {
    const me = await runtime.handle(page('GET', '/api/auth/me'));
    expect(me.status).toBe(200);
    expect(json(me).user.email).toBe((await stored())!.email);
    expect(header(me, 'set-cookie')).toEqual([]);
    // A mutation without any CSRF token from the page: the worker adds it.
    const settings = await runtime.handle(page('PATCH', '/api/settings', { theme: 'light' }));
    expect(settings.status).toBe(200);
  });

  it('ignores session headers set by the page', async () => {
    const res = await runtime.handle(page('GET', '/api/profile', undefined, { cookie: 'fitai_session=forged', 'x-csrf-token': 'forged', origin: 'https://evil.example' }));
    expect(res.status).toBe(200);
    const patch = await runtime.handle(page('PATCH', '/api/settings', { theme: 'dark' }, { 'x-csrf-token': 'forged', origin: 'https://evil.example' }));
    expect(patch.status).toBe(200);
  });

  it('answers routes that need a typed password with not_available_on_device; sign-out keeps the device signed in', async () => {
    for (const path of ['/api/auth/login', '/api/auth/register', '/api/auth/logout-all', '/api/auth/password', '/api/auth/password-reset/request', '/api/auth/password-reset/confirm']) {
      const res = await runtime.handle(page('POST', path, {}));
      expect(res.status, path).toBe(404);
      expect(json(res).error.code, path).toBe('not_available_on_device');
    }
    const before = await sessions();
    const out = await runtime.handle(page('POST', '/api/auth/logout', {}));
    expect(json(out)).toEqual({ ok: true });
    expect(await sessions()).toBe(before);
    expect(json(await runtime.handle(page('GET', '/api/auth/me'))).user).not.toBeNull();
  });

  it('signs in again (once) when the session is gone, and the request still succeeds', async () => {
    const { cookie: oldCookie } = (await stored())!;
    const userId = json(await runtime.handle(page('GET', '/api/auth/me'))).user.id;
    await db.exec('DELETE FROM auth_sessions');
    const profile = await runtime.handle(page('GET', '/api/profile'));
    expect(profile.status).toBe(200);
    const me = await runtime.handle(page('GET', '/api/auth/me'));
    expect(json(me).user.id).toBe(userId); // same account, new session
    expect((await stored())!.cookie).not.toBe(oldCookie);
    // /auth/me answers 200 { user: null } without a session (no 401): also signed in again.
    await db.exec('DELETE FROM auth_sessions');
    expect(json(await runtime.handle(page('GET', '/api/auth/me'))).user?.id).toBe(userId);
  });

  it('handles requests one at a time, in arrival order', async () => {
    const order: number[] = [];
    await Promise.all(
      [1, 2, 3, 4, 5].map((n) =>
        runtime.handle(page('POST', '/api/nutrition/logs/quick', { date: '2026-10-30', mealType: 'snack', name: `item ${n}`, kcal: n * 10 }, { 'idempotency-key': `order-test-${n}-abcdef` })).then((res) => {
          expect(res.status).toBe(201);
          order.push(n);
        }),
      ),
    );
    expect(order).toEqual([1, 2, 3, 4, 5]);
    const rows = await db.many<{ name: string }>("SELECT food_name->>'en' AS name FROM food_log_entries WHERE food_name->>'en' LIKE 'item %' ORDER BY created_at");
    expect(rows.map((r) => r.name)).toEqual(['item 1', 'item 2', 'item 3', 'item 4', 'item 5']);
    // The idempotency record written after each answer reached the database before the next request.
    const replay = await runtime.handle(page('POST', '/api/nutrition/logs/quick', { date: '2026-10-30', mealType: 'snack', name: 'item 1', kcal: 10 }, { 'idempotency-key': 'order-test-1-abcdef' }));
    expect(header(replay, 'idempotent-replayed')).toEqual([['Idempotent-Replayed', 'true']]);
    expect(deviceDatabaseStats()).toMatchObject({ nestedQueries: 0, nestedClients: 0 });
  });
});

describe('the device account across launches', () => {
  const app = () => createDispatcher(createApp({ serveClient: false }) as unknown as Application);
  const random = { randomUUID, randomBytes: (n: number) => new Uint8Array(randomBytes(n)) };

  it('reuses the stored session on the next launch (no new sign-in)', async () => {
    const store = await createAccountStore(db);
    const before = await sessions();
    const next = new DeviceSession({ send: app(), store, profile: () => PROFILE, ...random });
    await next.ensure();
    expect(await sessions()).toBe(before);
    expect(next.userId).toBe(json(await runtime.handle(page('GET', '/api/auth/me'))).user.id);
  });

  it('recovers when the app stopped between saving the credentials and creating the account', async () => {
    const store = await createAccountStore(db);
    const saved = await store.load();
    const pending = newDeviceAccount(random.randomUUID, random.randomBytes);
    await store.save(pending);
    const next = new DeviceSession({ send: app(), store, profile: () => PROFILE, ...random });
    await next.ensure();
    const user = await db.one<{ id: string }>('SELECT id FROM users WHERE email = $1', [pending.email]);
    expect(next.userId).toBe(user.id);
    expect((await store.load())?.email).toBe(pending.email);
    await store.save(saved!); // back to the runtime's account for the next tests
  });

  it('deletes the account without asking for a password, then starts a fresh device account', async () => {
    const { email } = (await stored())!;
    const oldId = json(await runtime.handle(page('GET', '/api/auth/me'))).user.id;
    const wrongConfirm = await runtime.handle(page('DELETE', '/api/account', { confirm: 'nope' }));
    expect(wrongConfirm.status).toBe(400);
    const res = await runtime.handle(page('DELETE', '/api/account', { confirm: 'DELETE' }));
    expect(res.status).toBe(200);
    expect(header(res, 'set-cookie')).toEqual([]);
    expect(await db.maybeOne('SELECT 1 FROM users WHERE id = $1', [oldId])).toBeNull();
    expect(await stored()).toBeNull();
    const me = json(await runtime.handle(page('GET', '/api/auth/me')));
    expect(me.user.id).not.toBe(oldId);
    expect(me.user.onboardingCompleted).toBe(false);
    expect((await stored())!.email).not.toBe(email);
  });
});
