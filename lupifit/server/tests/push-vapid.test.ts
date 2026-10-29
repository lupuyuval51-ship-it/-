/**
 * Phone-notification keys without manual setup: without VAPID keys in the environment the server
 * creates a pair once, keeps it in `server_settings` and reuses it on every start. Keys from the
 * environment always win; PUSH_AUTO_VAPID=false keeps push off. Only this file touches the table.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import webpush from 'web-push';
import { config } from '../src/config';
import { db } from '../src/db/pool';
import {
  clearStoredVapidKeys,
  loadVapidKeys,
  pushEnabled,
  storedVapidKeys,
  vapidDetails,
  vapidProblem,
  vapidSubject,
} from '../src/modules/push/vapid';
import { onboardedUser, startTestServer, type TestServer } from './helpers/server';

const RENDER = 'https://lupu-fit.onrender.com';
const original = { push: { ...config.push }, appUrl: config.appUrl };
let server: TestServer;

const storedRow = () =>
  db.maybeOne<{ vapid_public_key: string; vapid_private_key: string }>('SELECT vapid_public_key, vapid_private_key FROM server_settings WHERE id');

beforeAll(async () => {
  server = await startTestServer();
});
afterAll(async () => {
  Object.assign(config.push, original.push);
  config.appUrl = original.appUrl;
  clearStoredVapidKeys();
  await db.exec('DELETE FROM server_settings');
  await server.close();
  await db.close();
});
beforeEach(async () => {
  // A brand-new deployment: no VAPID variables, an https app URL (Render), nothing stored yet.
  Object.assign(config.push, { vapidPublicKey: '', vapidPrivateKey: '', vapidSubject: '', autoVapid: true });
  config.appUrl = RENDER;
  clearStoredVapidKeys();
  await db.exec('DELETE FROM server_settings');
});

describe('server-generated VAPID keys', () => {
  it('are created once, stored, and reused on the next start', async () => {
    expect(pushEnabled()).toBe(false);
    expect(await loadVapidKeys(db)).toEqual({ source: 'database', created: true });
    const row = (await storedRow())!;
    expect(row.vapid_public_key).toMatch(/^[A-Za-z0-9_-]{87}$/);
    expect(vapidProblem()).toBeNull();
    expect(vapidDetails()).toEqual({ subject: RENDER, publicKey: row.vapid_public_key, privateKey: row.vapid_private_key });

    // Restart: the in-memory copy is gone and the same pair comes back from the database.
    clearStoredVapidKeys();
    expect(pushEnabled()).toBe(false);
    expect(await loadVapidKeys(db)).toEqual({ source: 'database', created: false });
    expect(vapidDetails()!.publicKey).toBe(row.vapid_public_key);
    expect(await storedRow()).toEqual(row);
  });

  it('two instances starting at the same time agree on one pair', async () => {
    const results = await Promise.all(Array.from({ length: 4 }, () => storedVapidKeys(db)));
    expect(new Set(results.map((r) => r.publicKey)).size).toBe(1);
    expect(results.filter((r) => r.created)).toHaveLength(1);
    expect((await storedRow())!.vapid_public_key).toBe(results[0]!.publicKey);
  });

  it('are offered to browsers (public key only) through the normal endpoint', async () => {
    await loadVapidKeys(db);
    const row = (await storedRow())!;
    const c = await onboardedUser(server.baseUrl);
    const res = await c.get('/api/push/public-key');
    expect(res.body).toEqual({ enabled: true, publicKey: row.vapid_public_key, devices: 0 });
    expect(JSON.stringify(res.body)).not.toContain(row.vapid_private_key);
  });

  it('never put the private key in results or problem messages', async () => {
    const result = await loadVapidKeys(db);
    const { vapid_private_key: secret } = (await storedRow())!;
    expect(JSON.stringify(result)).not.toContain(secret);
    config.push.vapidSubject = 'ops@example.com';
    expect(vapidProblem()).toBe('VAPID_SUBJECT must be a mailto: address or an https:// URL');
    await db.exec(`UPDATE server_settings SET vapid_public_key = $1`, [webpush.generateVAPIDKeys().publicKey]);
    config.push.vapidSubject = '';
    clearStoredVapidKeys();
    await loadVapidKeys(db);
    expect(vapidProblem()).toMatch(/^stored VAPID public key does not match stored VAPID private key/);
    expect(vapidProblem()).not.toContain(secret);
  });

  it('report a database problem instead of crashing, with push left off', async () => {
    const broken = { maybeOne: async () => Promise.reject(new Error('relation "server_settings" does not exist')) } as unknown as typeof db;
    expect(await loadVapidKeys(broken)).toEqual({ source: 'none', created: false, error: 'relation "server_settings" does not exist' });
    expect(pushEnabled()).toBe(false);
  });
});

describe('VAPID keys from the environment', () => {
  it('always win over a stored pair, which is left untouched', async () => {
    await loadVapidKeys(db);
    const before = await storedRow();
    const env = webpush.generateVAPIDKeys();
    Object.assign(config.push, { vapidPublicKey: env.publicKey, vapidPrivateKey: env.privateKey });
    expect(await loadVapidKeys(db)).toEqual({ source: 'env', created: false });
    expect(vapidDetails()).toEqual({ subject: RENDER, publicKey: env.publicKey, privateKey: env.privateKey });
    expect(await storedRow()).toEqual(before);
  });

  it('mean nothing is generated or stored', async () => {
    const env = webpush.generateVAPIDKeys();
    Object.assign(config.push, { vapidPublicKey: env.publicKey, vapidPrivateKey: env.privateKey });
    await loadVapidKeys(db);
    expect(await storedRow()).toBeNull();
    expect(pushEnabled()).toBe(true);
  });

  it('a half-set pair is reported, not silently replaced by the stored one', async () => {
    await loadVapidKeys(db);
    config.push.vapidPublicKey = webpush.generateVAPIDKeys().publicKey;
    expect(await loadVapidKeys(db)).toEqual({ source: 'env', created: false });
    expect(pushEnabled()).toBe(false);
    expect(vapidProblem()).toBe('VAPID_PRIVATE_KEY not set');
  });
});

describe('VAPID subject', () => {
  it('defaults to the origin of an https app URL; VAPID_SUBJECT wins', async () => {
    await loadVapidKeys(db);
    config.appUrl = 'https://app.example.com/start/';
    expect(vapidSubject()).toBe('https://app.example.com');
    expect(vapidDetails()!.subject).toBe('https://app.example.com');
    config.push.vapidSubject = 'mailto:ops@example.com';
    expect(vapidDetails()!.subject).toBe('mailto:ops@example.com');
  });

  it('has no default for an http app URL (push services require https or mailto)', async () => {
    await loadVapidKeys(db);
    config.appUrl = 'http://localhost:3000';
    expect(vapidSubject()).toBe('');
    expect(pushEnabled()).toBe(false);
    expect(vapidProblem()).toBe('VAPID_SUBJECT not set (and APP_URL is not an https:// URL)');
    config.push.vapidSubject = 'mailto:dev@example.com';
    expect(pushEnabled()).toBe(true);
  });
});

describe('PUSH_AUTO_VAPID=false', () => {
  it('keeps phone notifications off and stores nothing', async () => {
    config.push.autoVapid = false;
    expect(await loadVapidKeys(db)).toEqual({ source: 'none', created: false });
    expect(await storedRow()).toBeNull();
    expect(pushEnabled()).toBe(false);
    expect(vapidProblem()).toBe('VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY not set (PUSH_AUTO_VAPID=false)');
    const c = await onboardedUser(server.baseUrl);
    expect((await c.get('/api/push/public-key')).body).toEqual({ enabled: false, publicKey: null, devices: 0 });
  });

  it('also ignores a pair stored by an earlier start', async () => {
    await loadVapidKeys(db);
    expect(pushEnabled()).toBe(true);
    config.push.autoVapid = false;
    await loadVapidKeys(db);
    expect(pushEnabled()).toBe(false);
    expect(await storedRow()).not.toBeNull();
  });
});
