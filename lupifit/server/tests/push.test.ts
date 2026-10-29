/**
 * Phone notifications: endpoints, the reminder job and cleanup. `web-push` is mocked so no
 * push service is contacted; everything else (routes, SQL, scheduler) is real.
 */
import crypto from 'node:crypto';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReminderSettings } from '@shared/types';

const send = vi.hoisted(() => vi.fn());
vi.mock('web-push', async (importOriginal) => {
  const actual = (await importOriginal()) as { default?: Record<string, unknown> } & Record<string, unknown>;
  const mod = actual.default ?? actual;
  return { ...mod, default: { ...mod, sendNotification: send } };
});

import webpush from 'web-push';
import { config } from '../src/config';
import { db } from '../src/db/pool';
import { resetRateLimits } from '../src/middleware/rateLimit';
import { dueReminders, runReminderTick } from '../src/modules/push/scheduler';
import { isAllowedEndpoint, vapidProblem } from '../src/modules/push/vapid';
import { TestClient, onboardedUser, startTestServer, type TestServer } from './helpers/server';

let server: TestServer;
const originalPush = { ...config.push };
const keys = webpush.generateVAPIDKeys();

function enablePush() {
  Object.assign(config.push, { vapidPublicKey: keys.publicKey, vapidPrivateKey: keys.privateKey, vapidSubject: 'mailto:ops@example.com' });
}
function disablePush() {
  Object.assign(config.push, { vapidPublicKey: '', vapidPrivateKey: '', vapidSubject: '' });
}

beforeAll(async () => {
  server = await startTestServer();
});
afterAll(async () => {
  Object.assign(config.push, originalPush);
  await server.close();
  await db.close();
});
beforeEach(() => {
  enablePush();
  send.mockReset().mockResolvedValue({ statusCode: 201, body: '', headers: {} });
});
afterEach(() => enablePush());

/** A browser subscription as `PushSubscription.toJSON()` returns it. */
function fakeSubscription(host = 'fcm.googleapis.com') {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();
  return {
    endpoint: `https://${host}/fcm/send/${crypto.randomUUID()}`,
    expirationTime: null,
    keys: { p256dh: ecdh.getPublicKey().toString('base64url'), auth: crypto.randomBytes(16).toString('base64url') },
  };
}

const pushError = (statusCode: number) => Object.assign(new Error(`Received unexpected response code ${statusCode}`), { statusCode, body: '', headers: {} });
const rows = (userId: string) => db.many<{ endpoint: string; failure_count: number; last_success_at: Date | null; user_agent: string }>(
  'SELECT endpoint, failure_count, last_success_at, user_agent FROM push_subscriptions WHERE user_id = $1 ORDER BY created_at',
  [userId],
);
/** Notifications sent to one endpoint: [payload, options]. */
const sentTo = (endpoint: string) =>
  send.mock.calls.filter(([sub]) => (sub as { endpoint: string }).endpoint === endpoint).map(([, payload, options]) => [JSON.parse(payload as string), options]);

async function subscribed(account: Parameters<typeof onboardedUser>[2] = {}) {
  const c = await onboardedUser(server.baseUrl, {}, account);
  const sub = fakeSubscription();
  const res = await c.post('/api/push/subscribe', sub, { headers: { 'user-agent': 'Mozilla/5.0 (Linux; Android 14) Chrome/130' } });
  expect(res.status).toBe(200);
  return { c, sub };
}

describe('GET /api/push/public-key', () => {
  it('requires authentication', async () => {
    expect((await new TestClient(server.baseUrl).get('/api/push/public-key')).status).toBe(401);
  });

  it('returns the public key and the number of devices', async () => {
    const { c } = await subscribed();
    const res = await c.get('/api/push/public-key');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ enabled: true, publicKey: keys.publicKey, devices: 1 });
  });

  it('says disabled (and exposes no key) when VAPID keys are missing or unusable', async () => {
    const c = await onboardedUser(server.baseUrl);
    disablePush();
    expect((await c.get('/api/push/public-key')).body).toEqual({ enabled: false, publicKey: null, devices: 0 });
    const other = webpush.generateVAPIDKeys();
    for (const broken of [
      { vapidPublicKey: keys.publicKey, vapidPrivateKey: '', vapidSubject: 'mailto:ops@example.com' },
      { vapidPublicKey: keys.publicKey, vapidPrivateKey: other.privateKey, vapidSubject: 'mailto:ops@example.com' },
      { vapidPublicKey: keys.publicKey, vapidPrivateKey: keys.privateKey, vapidSubject: 'ops@example.com' },
      { vapidPublicKey: 'not-a-key', vapidPrivateKey: keys.privateKey, vapidSubject: 'https://example.com' },
    ]) {
      Object.assign(config.push, broken);
      const res = await c.get('/api/push/public-key');
      expect(res.body.enabled, JSON.stringify(broken)).toBe(false);
      expect(res.body.publicKey).toBeNull();
      const problem = vapidProblem()!;
      expect(problem).toMatch(/VAPID_/);
      // The reason is logged at startup: it must never contain key material.
      for (const secret of [keys.privateKey, other.privateKey, keys.publicKey]) expect(problem).not.toContain(secret);
    }
  });
});

describe('POST /api/push/subscribe', () => {
  it('requires authentication and the CSRF token', async () => {
    expect((await new TestClient(server.baseUrl).post('/api/push/subscribe', fakeSubscription())).status).toBe(401);
    const c = await onboardedUser(server.baseUrl);
    const res = await c.post('/api/push/subscribe', fakeSubscription(), { csrf: false });
    expect(res.status).toBe(403);
    expect(await rows(c.userId!)).toEqual([]);
  });

  it('stores the device once, however often the browser subscribes again', async () => {
    const c = await onboardedUser(server.baseUrl);
    const sub = fakeSubscription();
    const first = await c.post('/api/push/subscribe', sub, { headers: { 'user-agent': 'A'.repeat(500) } });
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ ok: true, devices: 1 });
    const refreshed = { ...sub, keys: fakeSubscription().keys };
    const again = await c.post('/api/push/subscribe', refreshed);
    expect(again.body).toEqual({ ok: true, devices: 1 });
    const stored = await db.many<{ p256dh: string; auth: string }>('SELECT p256dh, auth FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]);
    expect(stored).toEqual([{ p256dh: refreshed.keys.p256dh, auth: refreshed.keys.auth }]);
    expect((await c.post('/api/push/subscribe', fakeSubscription())).body.devices).toBe(2);
  });

  it('keeps the user agent short', async () => {
    const c = await onboardedUser(server.baseUrl);
    await c.post('/api/push/subscribe', fakeSubscription(), { headers: { 'user-agent': 'A'.repeat(500) } });
    expect((await rows(c.userId!))[0]!.user_agent).toHaveLength(300);
  });

  it('normalizes padded / standard base64 keys', async () => {
    const c = await onboardedUser(server.baseUrl);
    const sub = fakeSubscription();
    const b64 = (s: string) => Buffer.from(s, 'base64url').toString('base64');
    const res = await c.post('/api/push/subscribe', { ...sub, keys: { p256dh: b64(sub.keys.p256dh), auth: b64(sub.keys.auth) } });
    expect(res.status).toBe(200);
    const stored = await db.one<{ p256dh: string; auth: string }>('SELECT p256dh, auth FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]);
    expect(stored).toEqual(sub.keys);
  });

  it('validates the subscription', async () => {
    const c = await onboardedUser(server.baseUrl);
    const good = fakeSubscription();
    for (const bad of [
      {},
      { ...good, endpoint: 'not a url' },
      { ...good, endpoint: good.endpoint.replace('https:', 'http:') },
      { ...good, endpoint: `https://fcm.googleapis.com/${'x'.repeat(1100)}` },
      { ...good, keys: { ...good.keys, p256dh: 'short' } },
      { ...good, keys: { ...good.keys, auth: 'a'.repeat(40) } },
      { ...good, keys: undefined },
    ]) {
      const res = await c.post('/api/push/subscribe', bad);
      expect(res.status, JSON.stringify(bad).slice(0, 80)).toBe(400);
      expect(res.body.error.code).toBe('validation_error');
    }
    expect(await rows(c.userId!)).toEqual([]);
  });

  it('only accepts endpoints on known push services (no arbitrary URLs)', async () => {
    const c = await onboardedUser(server.baseUrl);
    for (const host of ['evil.example.com', 'fcm.googleapis.com.evil.example', '169.254.169.254', 'localhost']) {
      const res = await c.post('/api/push/subscribe', fakeSubscription(host));
      expect(res.status, host).toBe(400);
      expect(res.body.error.code).toBe('push_endpoint_not_allowed');
    }
    expect(await rows(c.userId!)).toEqual([]);
    expect(isAllowedEndpoint('https://updates.push.services.mozilla.com/wpush/v2/abc')).toBe(true);
    expect(isAllowedEndpoint('https://web.push.apple.com/abc')).toBe(true);
    expect(isAllowedEndpoint('https://fcm.googleapis.com:8443/fcm/send/abc')).toBe(false);
  });

  it('refuses new devices while push is not configured', async () => {
    const c = await onboardedUser(server.baseUrl);
    disablePush();
    const res = await c.post('/api/push/subscribe', fakeSubscription());
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('push_disabled');
    expect(await rows(c.userId!)).toEqual([]);
  });

  it('moves a browser to the account that turned notifications on last', async () => {
    const { c: a, sub } = await subscribed();
    const b = await onboardedUser(server.baseUrl);
    expect((await b.post('/api/push/subscribe', sub)).body.devices).toBe(1);
    expect(await rows(a.userId!)).toEqual([]);
    expect((await a.get('/api/push/public-key')).body.devices).toBe(0);
    expect((await a.post('/api/push/unsubscribe', { endpoint: sub.endpoint })).status).toBe(404);
  });
});

describe('POST /api/push/unsubscribe', () => {
  it('forgets the caller’s device', async () => {
    const { c, sub } = await subscribed();
    await c.post('/api/push/subscribe', fakeSubscription());
    const res = await c.post('/api/push/unsubscribe', { endpoint: sub.endpoint });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, devices: 1 });
    expect((await rows(c.userId!)).map((r) => r.endpoint)).not.toContain(sub.endpoint);
  });

  it('cannot remove another user’s device (404) and validates the body', async () => {
    const { c: owner, sub } = await subscribed();
    const intruder = await onboardedUser(server.baseUrl);
    const res = await intruder.post('/api/push/unsubscribe', { endpoint: sub.endpoint });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('push_subscription_not_found');
    expect(await rows(owner.userId!)).toHaveLength(1);
    expect((await intruder.post('/api/push/unsubscribe', { endpoint: 'nope' })).status).toBe(400);
    expect((await new TestClient(server.baseUrl).post('/api/push/unsubscribe', { endpoint: sub.endpoint })).status).toBe(401);
  });

  it('still works when push is no longer configured', async () => {
    const { c, sub } = await subscribed();
    disablePush();
    expect((await c.post('/api/push/unsubscribe', { endpoint: sub.endpoint })).status).toBe(200);
    expect(await rows(c.userId!)).toEqual([]);
  });
});

describe('POST /api/push/test', () => {
  it('sends one notification to the caller, in the account language', async () => {
    const { c, sub } = await subscribed({ locale: 'he' });
    const res = await c.post('/api/push/test', { endpoint: sub.endpoint });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ sent: 1, failed: 0, removed: 0 });
    expect(send).toHaveBeenCalledTimes(1);
    const [subscription, payload, options] = send.mock.calls[0]!;
    expect(subscription).toEqual({ endpoint: sub.endpoint, keys: sub.keys });
    expect(JSON.parse(payload as string)).toEqual({ title: 'התראת בדיקה מ-LUPU-FIT', body: 'ההתראות לטלפון עובדות במכשיר הזה.', url: '/profile', tag: 'fitai-push-test', lang: 'he' });
    expect(options).toMatchObject({
      vapidDetails: { subject: 'mailto:ops@example.com', publicKey: keys.publicKey, privateKey: keys.privateKey },
      contentEncoding: 'aes128gcm',
      TTL: 600,
    });
    const [row] = await rows(c.userId!);
    expect(row!.last_success_at).not.toBeNull();
  });

  it('without an endpoint, reaches every device of the caller and nobody else', async () => {
    const { c, sub } = await subscribed();
    const second = fakeSubscription();
    await c.post('/api/push/subscribe', second);
    const { sub: bystander } = await subscribed();
    const res = await c.post('/api/push/test', {});
    expect(res.body).toEqual({ sent: 2, failed: 0, removed: 0 });
    expect(send.mock.calls.map(([s]) => (s as { endpoint: string }).endpoint).sort()).toEqual([sub.endpoint, second.endpoint].sort());
    expect(sentTo(bystander.endpoint)).toEqual([]);
  });

  it('answers 404 for another user’s device and 409 without any device', async () => {
    const { sub } = await subscribed();
    const other = await onboardedUser(server.baseUrl);
    const res = await other.post('/api/push/test', { endpoint: sub.endpoint });
    expect(res.status).toBe(404);
    const none = await other.post('/api/push/test', {});
    expect(none.status).toBe(409);
    expect(none.body.error.code).toBe('push_not_subscribed');
    expect(send).not.toHaveBeenCalled();
  });

  it('removes a device the push service no longer knows (404/410) and counts other failures', async () => {
    const { c, sub } = await subscribed();
    const flaky = fakeSubscription();
    const gone = fakeSubscription();
    await c.post('/api/push/subscribe', flaky);
    await c.post('/api/push/subscribe', gone);
    send.mockImplementation(async (s: { endpoint: string }) => {
      if (s.endpoint === gone.endpoint) throw pushError(410);
      if (s.endpoint === flaky.endpoint) throw pushError(500);
      return { statusCode: 201, body: '', headers: {} };
    });
    const res = await c.post('/api/push/test', {});
    expect(res.body).toEqual({ sent: 1, failed: 1, removed: 1 });
    const left = await rows(c.userId!);
    expect(left.map((r) => r.endpoint).sort()).toEqual([sub.endpoint, flaky.endpoint].sort());
    expect(left.find((r) => r.endpoint === flaky.endpoint)!.failure_count).toBe(1);

    send.mockRejectedValue(pushError(404));
    expect((await c.post('/api/push/test', {})).body).toEqual({ sent: 0, failed: 0, removed: 2 });
    expect(await rows(c.userId!)).toEqual([]);
  });

  it('drops a device that has kept failing for over a week', async () => {
    const { c, sub } = await subscribed();
    await db.exec(`UPDATE push_subscriptions SET failure_count = 19, created_at = now() - interval '30 days' WHERE endpoint = $1`, [sub.endpoint]);
    send.mockRejectedValue(Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' }));
    expect((await c.post('/api/push/test', {})).body).toEqual({ sent: 0, failed: 1, removed: 0 });
    expect(await rows(c.userId!)).toEqual([]);
  });

  it('is unavailable while push is not configured, and rate limited', async () => {
    const { c } = await subscribed();
    disablePush();
    expect((await c.post('/api/push/test', {})).status).toBe(503);
    enablePush();
    const original = config.rateLimit.multiplier;
    config.rateLimit.multiplier = 1;
    resetRateLimits();
    try {
      const statuses: number[] = [];
      for (let i = 0; i < 6; i++) statuses.push((await c.post('/api/push/test', {})).status);
      expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
    } finally {
      config.rateLimit.multiplier = original;
      resetRateLimits();
    }
  });
});

describe('dueReminders', () => {
  const settings = (over: Partial<ReminderSettings> = {}): ReminderSettings => ({
    enabled: true,
    workoutDays: [4], // Thursday
    workoutTime: '18:00',
    mealLogging: false,
    mealTimes: ['08:00', '13:00'],
    ...over,
  });
  // 2026-10-29 is a Thursday. 09:00Z = 18:00 in Tokyo (UTC+9), 14:30 in Kolkata (UTC+5:30).
  const at = (iso: string) => new Date(iso);

  it('uses the wall clock of the user’s time zone', () => {
    expect(dueReminders(settings(), at('2026-10-29T09:00:00Z'), 'Asia/Tokyo')).toEqual([{ kind: 'workout', slot: '18:00', localDate: '2026-10-29' }]);
    expect(dueReminders(settings(), at('2026-10-29T09:00:00Z'), 'UTC')).toEqual([]);
    expect(dueReminders(settings(), at('2026-10-29T12:30:00Z'), 'Asia/Kolkata')).toEqual([{ kind: 'workout', slot: '18:00', localDate: '2026-10-29' }]);
    // Unknown zones fall back to UTC instead of throwing.
    expect(dueReminders(settings(), at('2026-10-29T18:00:00Z'), 'Mars/Olympus')).toEqual([{ kind: 'workout', slot: '18:00', localDate: '2026-10-29' }]);
  });

  it('only on the chosen weekdays (local, not UTC)', () => {
    expect(dueReminders(settings({ workoutDays: [3, 5] }), at('2026-10-29T09:00:00Z'), 'Asia/Tokyo')).toEqual([]);
    // 23:30 UTC on Thursday is already Friday 08:30 in Tokyo.
    const friday = settings({ workoutDays: [5], workoutTime: '08:30' });
    expect(dueReminders(friday, at('2026-10-29T23:30:00Z'), 'Asia/Tokyo')).toEqual([{ kind: 'workout', slot: '08:30', localDate: '2026-10-30' }]);
    expect(dueReminders(friday, at('2026-10-29T08:30:00Z'), 'UTC')).toEqual([]);
  });

  it('is due from the minute it is set for until 10 minutes later, never before', () => {
    const due = (iso: string) => dueReminders(settings(), at(iso), 'Asia/Tokyo').length;
    expect(due('2026-10-29T08:59:59Z')).toBe(0);
    expect(due('2026-10-29T09:00:00Z')).toBe(1);
    expect(due('2026-10-29T09:09:59Z')).toBe(1);
    expect(due('2026-10-29T09:10:00Z')).toBe(0);
    expect(dueReminders(settings(), at('2026-10-29T09:03:00Z'), 'Asia/Tokyo', 2)).toEqual([]);
  });

  it('keeps a late-evening slot on its own day just after midnight', () => {
    const late = settings({ workoutDays: [4], workoutTime: '23:55' });
    // 00:03 Friday in UTC: the Thursday 23:55 reminder is still within its window.
    expect(dueReminders(late, at('2026-10-30T00:03:00Z'), 'UTC')).toEqual([{ kind: 'workout', slot: '23:55', localDate: '2026-10-29' }]);
    expect(dueReminders(settings({ workoutDays: [5], workoutTime: '23:55' }), at('2026-10-30T00:03:00Z'), 'UTC')).toEqual([]);
  });

  it('meal reminders follow mealLogging and each meal time', () => {
    const meals = settings({ workoutDays: [], mealLogging: true, mealTimes: ['08:00', '13:00', '13:05'] });
    expect(dueReminders(meals, at('2026-10-29T13:06:00Z'), 'UTC')).toEqual([
      { kind: 'meal', slot: '13:00', localDate: '2026-10-29' },
      { kind: 'meal', slot: '13:05', localDate: '2026-10-29' },
    ]);
    expect(dueReminders({ ...meals, mealLogging: false }, at('2026-10-29T13:06:00Z'), 'UTC')).toEqual([]);
    expect(dueReminders({ ...meals, enabled: false }, at('2026-10-29T08:00:00Z'), 'UTC')).toEqual([]);
  });
});

describe('runReminderTick', () => {
  // Thursday 2026-10-29, 18:00 in Tokyo.
  const NOW = new Date('2026-10-29T09:00:00Z');
  const plusMinutes = (m: number) => new Date(NOW.getTime() + m * 60_000);
  const REMINDERS: ReminderSettings = { enabled: true, workoutDays: [4], workoutTime: '18:00', mealLogging: true, mealTimes: ['12:00', '18:00'] };

  async function reminderUser(over: Partial<ReminderSettings> = {}, locale: 'en' | 'he' = 'en') {
    const { c, sub } = await subscribed({ timezone: 'Asia/Tokyo', locale });
    const res = await c.patch('/api/settings', { reminders: { ...REMINDERS, ...over } });
    expect(res.status).toBe(200);
    return { c, sub, userId: c.userId! };
  }
  const deliveries = (userId: string) =>
    db.many<{ kind: string; local_date: string; slot: string; status: string; sent_count: number }>(
      'SELECT kind, local_date, slot, status, sent_count FROM push_deliveries WHERE user_id = $1 ORDER BY kind, slot',
      [userId],
    );

  it('sends the workout and meal reminders once per slot, in the user’s language and time zone', async () => {
    const { sub, userId } = await reminderUser({}, 'he');
    // Two passes at once (e.g. two server instances): each slot is still sent only once.
    await Promise.all([runReminderTick(db, NOW), runReminderTick(db, NOW)]);
    const sent = sentTo(sub.endpoint);
    expect(sent.map(([p]) => p)).toEqual(
      expect.arrayContaining([
        { title: 'זמן להתאמן', body: 'היום הוא אחד מימי האימון שלך — האימון הבא מחכה.', url: '/workouts', tag: 'fitai-workout', lang: 'he' },
        { title: 'זמן לתעד ארוחה', body: 'תיעוד עכשיו עוזר לשמור על התזונה במסלול.', url: '/nutrition/log', tag: 'fitai-meal:18:00', lang: 'he' },
      ]),
    );
    expect(sent).toHaveLength(2);
    expect(sent[0]![1]).toMatchObject({ TTL: 7200, contentEncoding: 'aes128gcm' });
    expect(await deliveries(userId)).toEqual([
      { kind: 'meal', local_date: '2026-10-29', slot: '18:00', status: 'sent', sent_count: 1 },
      { kind: 'workout', local_date: '2026-10-29', slot: '18:00', status: 'sent', sent_count: 1 },
    ]);
    // Later passes inside the window do not repeat it.
    await runReminderTick(db, plusMinutes(1));
    await runReminderTick(db, plusMinutes(9));
    expect(sentTo(sub.endpoint)).toHaveLength(2);
  });

  it('sends nothing early, tolerates a missed minute and gives up after 10 minutes', async () => {
    const { sub } = await reminderUser({ mealLogging: false });
    await runReminderTick(db, plusMinutes(-1));
    expect(sentTo(sub.endpoint)).toHaveLength(0);
    await runReminderTick(db, plusMinutes(7));
    expect(sentTo(sub.endpoint)).toHaveLength(1);

    const { sub: late } = await reminderUser({ mealLogging: false });
    await runReminderTick(db, plusMinutes(10));
    expect(sentTo(late.endpoint)).toHaveLength(0);
  });

  it('respects the chosen weekdays and the reminder switches', async () => {
    const { sub: wrongDay } = await reminderUser({ workoutDays: [1, 2], mealLogging: false });
    const { sub: off, c } = await reminderUser();
    await c.patch('/api/settings', { reminders: { ...REMINDERS, enabled: false } });
    await runReminderTick(db, NOW);
    expect(sentTo(wrongDay.endpoint)).toEqual([]);
    expect(sentTo(off.endpoint)).toEqual([]);
  });

  it('skips the workout reminder after a workout today or during one, but not for yesterday’s', async () => {
    const done = await reminderUser({ mealLogging: false });
    await db.exec(
      `INSERT INTO workout_sessions (user_id, name, status, started_at, ended_at, duration_seconds)
       VALUES ($1, 'Morning', 'completed', '2026-10-28T23:30:00Z', '2026-10-29T00:30:00Z', 3600)`, // 08:30–09:30 Tokyo
      [done.userId],
    );
    const training = await reminderUser({ mealLogging: false });
    await db.exec(`INSERT INTO workout_sessions (user_id, name, status, started_at) VALUES ($1, 'Now', 'in_progress', '2026-10-29T08:50:00Z')`, [training.userId]);
    const yesterday = await reminderUser({ mealLogging: false });
    await db.exec(
      `INSERT INTO workout_sessions (user_id, name, status, started_at, ended_at, duration_seconds)
       VALUES ($1, 'Wed', 'completed', '2026-10-28T09:00:00Z', '2026-10-28T10:00:00Z', 3600)`,
      [yesterday.userId],
    );

    await runReminderTick(db, NOW);
    expect(sentTo(done.sub.endpoint)).toEqual([]);
    expect(sentTo(training.sub.endpoint)).toEqual([]);
    expect(sentTo(yesterday.sub.endpoint)).toHaveLength(1);
    expect(await deliveries(done.userId)).toEqual([{ kind: 'workout', local_date: '2026-10-29', slot: '18:00', status: 'skipped', sent_count: 0 }]);
    // Decided once: finishing the session does not bring the reminder back.
    await db.exec(`UPDATE workout_sessions SET status = 'abandoned', ended_at = now() WHERE user_id = $1`, [training.userId]);
    await runReminderTick(db, plusMinutes(2));
    expect(sentTo(training.sub.endpoint)).toEqual([]);
  });

  it('skips a meal reminder when something was logged in the last 3 hours', async () => {
    const meal = (userId: string, loggedOn: string, createdAt: string) =>
      db.exec(
        `INSERT INTO food_log_entries (user_id, logged_on, meal_type, food_name, kcal, created_at) VALUES ($1, $2, 'lunch', '{"en":"Soup","he":"מרק"}', 300, $3)`,
        [userId, loggedOn, createdAt],
      );
    const recent = await reminderUser({ workoutDays: [] });
    await meal(recent.userId, '2026-10-29', '2026-10-29T07:30:00Z'); // 16:30 Tokyo
    const earlier = await reminderUser({ workoutDays: [] });
    await meal(earlier.userId, '2026-10-29', '2026-10-29T05:30:00Z'); // 14:30 Tokyo
    const backfill = await reminderUser({ workoutDays: [] });
    await meal(backfill.userId, '2026-10-28', '2026-10-29T08:30:00Z'); // yesterday's diary, edited just now

    await runReminderTick(db, NOW);
    expect(sentTo(recent.sub.endpoint)).toEqual([]);
    expect(await deliveries(recent.userId)).toEqual([{ kind: 'meal', local_date: '2026-10-29', slot: '18:00', status: 'skipped', sent_count: 0 }]);
    expect(sentTo(earlier.sub.endpoint).map(([p]) => p.tag)).toEqual(['fitai-meal:18:00']);
    expect(sentTo(backfill.sub.endpoint)).toHaveLength(1);
  });

  it('only considers users with a device, and removes devices that are gone', async () => {
    const noDevice = await onboardedUser(server.baseUrl, {}, { timezone: 'Asia/Tokyo' });
    await noDevice.patch('/api/settings', { reminders: REMINDERS });
    const gone = await reminderUser({ mealLogging: false });
    send.mockImplementation(async (s: { endpoint: string }) => {
      if (s.endpoint === gone.sub.endpoint) throw pushError(410);
      return { statusCode: 201, body: '', headers: {} };
    });
    await runReminderTick(db, NOW);
    expect(await deliveries(noDevice.userId!)).toEqual([]);
    expect(await rows(gone.userId)).toEqual([]);
    expect(await deliveries(gone.userId)).toEqual([{ kind: 'workout', local_date: '2026-10-29', slot: '18:00', status: 'failed', sent_count: 0 }]);
  });

  it('does nothing while push is not configured', async () => {
    const { sub, userId } = await reminderUser();
    disablePush();
    expect(await runReminderTick(db, NOW)).toEqual({ users: 0, sent: 0, skipped: 0, failed: 0 });
    expect(sentTo(sub.endpoint)).toEqual([]);
    expect(await deliveries(userId)).toEqual([]);
  });
});

describe('account data', () => {
  it('exports devices and the reminder log without endpoints or keys, and deletes them with the account', async () => {
    const { c, sub } = await subscribed({ timezone: 'Asia/Tokyo' });
    await c.patch('/api/settings', { reminders: { enabled: true, workoutDays: [4], workoutTime: '18:00', mealLogging: false, mealTimes: [] } });
    await runReminderTick(db, new Date('2026-10-29T09:00:00Z'));
    const res = await c.get('/api/account/export');
    expect(res.status).toBe(200);
    expect(res.body.pushSubscriptions).toEqual([
      expect.objectContaining({ pushService: 'fcm.googleapis.com', userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/130', failureCount: 0 }),
    ]);
    expect(res.body.pushDeliveries).toEqual([expect.objectContaining({ kind: 'workout', localDate: '2026-10-29', slot: '18:00', status: 'sent' })]);
    const raw = JSON.stringify(res.body);
    for (const secret of [sub.endpoint, sub.keys.p256dh, sub.keys.auth]) expect(raw).not.toContain(secret);

    const del = await c.delete('/api/account', { password: 'Passw0rd!', confirm: 'DELETE' });
    expect(del.status).toBe(200);
    expect(await db.maybeOne('SELECT 1 FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint])).toBeNull();
    expect(await db.maybeOne('SELECT 1 FROM push_deliveries WHERE user_id = $1', [c.userId])).toBeNull();
  });

  it('“log out of all devices” also stops phone notifications', async () => {
    const { c } = await subscribed();
    await c.post('/api/push/subscribe', fakeSubscription());
    expect((await c.post('/api/auth/logout-all', {})).status).toBe(200);
    expect(await rows(c.userId!)).toEqual([]);
  });
});
