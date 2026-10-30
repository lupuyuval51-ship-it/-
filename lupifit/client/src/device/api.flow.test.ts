/**
 * Representative API flows on the full device stack, without HTTP: the server's createApp() runs on the
 * Express shim, its SQL on PGlite (shared lease mode, as in the app), its crypto/fs/path/url/util on
 * the browser shims, with the device environment (production, DEVICE_MODE=true, AI and Web Push off).
 * Requests go through `createDispatcher` one at a time, like the device worker will send them, and a
 * small client keeps the session cookie and CSRF token the way the worker will.
 *
 * The global `Buffer` is the device one (DeviceBuffer) while the flows run, as in the worker.
 *
 * Difference from the phone: Vitest sets VITEST=true, so config.isTest is true here (it only changes
 * defaults that DEVICE_ENV sets explicitly, plus the mail transport, which is silent in tests).
 */
import { createRequire } from 'node:module';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { addDays, todayInTimeZone } from '@shared/dates';
import { buildDailyMenu } from '@shared/menu';
import type { ProfileDTO } from '@shared/types';
import { createApp } from '../../../server/src/app';
import { aiConfigured, config } from '../../../server/src/config';
import { db } from '../../../server/src/db/pool';
import { DeviceBuffer } from './buffer';
import { prepareDeviceDatabase } from './database';
import { DEVICE_MIGRATIONS } from './migrations';
import { createDispatcher, type Application, type DispatchRequest, type DispatchResponse } from './shims/express';
import { deviceDatabaseStats } from './shims/pg';
import { randomBytes, randomUUID } from './shims/crypto';

const nodeCrypto = createRequire(import.meta.url)('node:crypto') as typeof import('node:crypto');
const TZ = 'Asia/Jerusalem';

type Send = (request: DispatchRequest) => Promise<DispatchResponse>;
let send: Send;

interface Reply<T = any> {
  status: number;
  body: T;
  text: string;
  header(name: string): string | undefined;
  cookies: string[];
}

/** What the device worker does for the app: one cookie jar, the CSRF token, JSON in and out. */
class DeviceClient {
  cookie: string | null = null;
  csrf: string | null = null;

  async request<T = any>(method: string, url: string, body?: unknown, headers: Record<string, string> = {}): Promise<Reply<T>> {
    const h: Record<string, string> = { accept: 'application/json', 'user-agent': 'LUPU-FIT device test', ...headers };
    if (body !== undefined) h['content-type'] ??= 'application/json';
    if (this.cookie) h.cookie = this.cookie;
    if (method !== 'GET' && this.csrf) h['x-csrf-token'] ??= this.csrf;
    const res = await send({ method, url, headers: h, body: body === undefined ? null : typeof body === 'string' ? body : JSON.stringify(body) });
    const cookies = res.headers.filter(([k]) => k.toLowerCase() === 'set-cookie').map(([, v]) => v);
    for (const c of cookies) {
      const [pair = '', ...attrs] = c.split(';').map((s) => s.trim());
      const expires = attrs.find((a) => a.toLowerCase().startsWith('expires='));
      const gone = pair.endsWith('=') || (expires && Date.parse(expires.slice(8)) < Date.now());
      this.cookie = gone ? null : pair;
    }
    const text = typeof res.body === 'string' ? res.body : '';
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }
    const csrf = (parsed as { csrfToken?: unknown } | null)?.csrfToken;
    if (typeof csrf === 'string') this.csrf = csrf;
    const header = (name: string) => res.headers.find(([k]) => k.toLowerCase() === name.toLowerCase())?.[1];
    return { status: res.status, body: parsed as T, text, header, cookies };
  }
  get<T = any>(url: string, headers?: Record<string, string>) {
    return this.request<T>('GET', url, undefined, headers);
  }
  post<T = any>(url: string, body: unknown = {}, headers?: Record<string, string>) {
    return this.request<T>('POST', url, body, headers);
  }
  put<T = any>(url: string, body: unknown = {}, headers?: Record<string, string>) {
    return this.request<T>('PUT', url, body, headers);
  }
  patch<T = any>(url: string, body: unknown = {}, headers?: Record<string, string>) {
    return this.request<T>('PATCH', url, body, headers);
  }
  delete<T = any>(url: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>('DELETE', url, body, headers);
  }
}

const idem = (key: string) => ({ 'idempotency-key': key });
const today = () => todayInTimeZone(TZ);

/** A random password like the device account's: never typed, letters and digits (the password rules need both). */
const devicePassword = () => `${randomBytes(24).toString('base64url')}a1`;

const ONBOARDING = {
  ageYears: 34,
  sex: 'female',
  heightCm: 165,
  weightKg: 63,
  experienceLevel: 'beginner',
  ability: { pushUpsMax: 10, pullUpsMax: 0, plankSeconds: 40, squat1rmKg: null, bench1rmKg: null, deadlift1rmKg: null },
  goal: 'general_fitness',
  trainingLocation: 'home',
  equipment: ['dumbbells', 'resistance_bands'],
  daysPerWeek: 3,
  sessionMinutes: 45,
  preferredDays: [0, 2, 4],
  focusMuscleGroups: [],
  avoidExerciseIds: [],
  exerciseLikes: '',
  exerciseDislikes: '',
  limitations: '',
  injuries: [],
  injuryNotes: '',
  dietType: 'omnivore',
  allergies: [],
  dietaryRestrictions: [],
  dislikedFoods: '',
  activityLevel: 'light',
  occupationActivity: 'desk',
  sleepHours: 7,
  stressLevel: 'moderate',
  mealsPerDay: 4,
};

const account = { email: `device-${randomUUID()}@device.lupufit`, password: devicePassword() };
const device = new DeviceClient();
let userId = '';
const nodeBuffer = globalThis.Buffer;
const bufferFrom = vi.spyOn(DeviceBuffer, 'from');

beforeAll(async () => {
  globalThis.Buffer = DeviceBuffer as unknown as typeof Buffer;
  const ready = await prepareDeviceDatabase();
  expect(ready.migrations.applied).toHaveLength(DEVICE_MIGRATIONS.length);
  expect(ready.seed.skipped).toBe(false);
  send = createDispatcher(createApp({ serveClient: false }) as unknown as Application);
});

afterAll(async () => {
  globalThis.Buffer = nodeBuffer;
  bufferFrom.mockRestore();
  await db.close();
});

describe('device configuration', () => {
  it('runs the server code with the device environment', async () => {
    expect(config).toMatchObject({
      deviceMode: true,
      isProduction: true,
      session: { cookieName: 'fitai_session', secureCookie: false, ttlDays: 365 },
      password: { scryptN: 1024 },
      rateLimit: { enabled: false },
      openFoodFacts: { enabled: true },
      push: { autoVapid: false, vapidPublicKey: '', vapidPrivateKey: '' },
      logRequests: false,
    });
    expect(aiConfigured()).toBe(false);
    const health = await device.get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body).toMatchObject({ status: 'ok', database: 'ok', ai: { configured: false, provider: null, model: null } });
    expect(health.header('cache-control')).toBe('no-store');
    expect(health.header('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('runs the migrations again as a no-op on the next start (same checksums)', async () => {
    const again = await prepareDeviceDatabase();
    expect(again.migrations).toEqual({ applied: [], alreadyApplied: DEVICE_MIGRATIONS.length });
    expect(again.seed.skipped).toBe(true);
  });
});

describe('device account', () => {
  it('creates the hidden account on first launch and stays signed in for a year', async () => {
    const res = await device.post('/api/auth/register', { ...account, displayName: 'LUPU-FIT', locale: 'he', timezone: TZ });
    expect(res.status).toBe(201);
    userId = res.body.user.id;
    expect(res.body.user).toMatchObject({ email: account.email, locale: 'he', timezone: TZ });
    const [cookie] = res.cookies;
    expect(cookie).toMatch(/^fitai_session=[A-Za-z0-9_-]{43}; Max-Age=31536000; Path=\/; Expires=[^;]+; HttpOnly; SameSite=Lax$/);
    expect(cookie).not.toContain('Secure');
    const me = await device.get('/api/auth/me');
    expect(me.body.user.id).toBe(userId);
    expect(me.body.csrfToken).toBe(device.csrf);
  });

  it('stores a server-compatible scrypt hash (N=1024) that Node’s own crypto verifies', async () => {
    const row = await db.one<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = $1', [userId]);
    const [scheme, n, r, p, salt, hash] = row.password_hash.split('$');
    expect([scheme, n, r, p]).toEqual(['scrypt', '1024', '8', '1']);
    const expected = nodeCrypto.scryptSync(account.password.normalize('NFKC'), nodeBuffer.from(salt!, 'base64'), 64, { N: 1024, r: 8, p: 1 });
    expect(expected.toString('base64')).toBe(hash);
  });

  it('signs in again once when the session is gone (what the worker does on a 401)', async () => {
    const fresh = new DeviceClient();
    expect((await fresh.get('/api/profile')).status).toBe(401);
    expect((await fresh.get('/api/profile')).body.error.code).toBe('unauthorized');
    bufferFrom.mockClear();
    const login = await fresh.post('/api/auth/login', account);
    expect(login.status).toBe(200);
    expect(fresh.cookie).toMatch(/^fitai_session=/);
    // verifyPassword decoded the stored salt and hash with the global Buffer: the device one.
    expect(globalThis.Buffer).toBe(DeviceBuffer);
    expect(bufferFrom.mock.calls.filter((c) => (c as unknown[])[1] === 'base64').length).toBeGreaterThanOrEqual(2);
    expect((await fresh.get('/api/profile')).status).toBe(200);
    expect((await fresh.post('/api/auth/login', { ...account, password: 'wrong-password-1' })).body.error.code).toBe('invalid_credentials');
  });
});

describe('daily use', () => {
  let profile: ProfileDTO;
  let planWorkoutId = '';

  it('completes onboarding', async () => {
    const res = await device.put('/api/profile/onboarding', ONBOARDING, idem(`onb-${randomUUID()}`));
    expect(res.status).toBe(200);
    profile = res.body.profile;
    expect(profile.onboardingCompletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(profile.targets?.calories).toBeGreaterThan(1200);
  });

  it('generates and activates a plan', async () => {
    const res = await device.post('/api/plans/generate', {}, idem(`gen-${randomUUID()}`));
    expect(res.status).toBe(201);
    const plan = res.body.plan;
    expect(plan.workouts.length).toBeGreaterThan(0);
    expect(plan.workouts[0].exercises.length).toBeGreaterThan(0);
    planWorkoutId = plan.workouts[0].id;
    const active = await device.post(`/api/plans/${plan.id}/activate`);
    expect(active.status).toBe(200);
    expect(active.body.plan.status).toBe('active');
  });

  it('starts a workout, logs sets and finishes it (finish replayed safely)', async () => {
    const start = await device.post('/api/sessions', { planWorkoutId }, idem(`start-${randomUUID()}`));
    expect(start.status).toBe(201);
    const session = start.body.session;
    const first = session.exercises[0];
    for (const set of first.sets) {
      const done = await device.patch(`/api/sessions/${session.id}/sets/${set.id}`, { reps: 10, weightKg: 8, completed: true });
      expect(done.status).toBe(200);
      expect(done.body.set).toMatchObject({ reps: 10, weightKg: 8, completed: true });
    }
    const key = `finish-${randomUUID()}`;
    const finish = await device.post(`/api/sessions/${session.id}/finish`, { perceivedExertion: 7 }, idem(key));
    expect(finish.status).toBe(200);
    expect(finish.body.summary.totals.sets).toBe(first.sets.length);
    expect(finish.body.summary.totals.volumeKg).toBe(first.sets.length * 80);
    const replay = await device.post(`/api/sessions/${session.id}/finish`, { perceivedExertion: 7 }, idem(key));
    expect(replay.header('idempotent-replayed')).toBe('true');
    expect(replay.body).toEqual(finish.body);
    expect((await device.get('/api/sessions/active')).body.session).toBeNull();
    const history = await device.get('/api/sessions');
    expect(history.body.sessions.map((s: { id: string }) => s.id)).toContain(session.id);
  });

  it('logs food by search and grams, and by quick add', async () => {
    const search = await device.get('/api/foods/search?q=egg');
    expect(search.status).toBe(200);
    const egg = search.body.foods[0];
    expect(egg).toBeTruthy();
    const logged = await device.post('/api/nutrition/logs', { date: today(), mealType: 'breakfast', foodId: egg.id, grams: 100 }, idem(`log-${randomUUID()}`));
    expect(logged.status).toBe(201);
    expect(logged.body.entry.kcal).toBeCloseTo(egg.per100g.kcal, 0);
    const quick = await device.post(
      '/api/nutrition/logs/quick',
      { date: today(), mealType: 'snack', name: 'תפוח', kcal: 95, proteinG: 0.5, carbsG: 25, fatG: 0.3, fiberG: 4.4 },
      idem(`quick-${randomUUID()}`),
    );
    expect(quick.status).toBe(201);
    expect(quick.body.entry).toMatchObject({ foodId: null, foodName: { he: 'תפוח' }, kcal: 95, fiberG: 4.4 });
    const day = await device.get(`/api/nutrition/day?date=${today()}`);
    expect(day.body.totals.kcal).toBeCloseTo(logged.body.entry.kcal + 95, 1);
    expect(day.body.meals.snack.entries.map((e: { kcal: number }) => e.kcal)).toEqual([95]);
  });

  it("logs the day's menu as quick adds, one key per dish, and a retry logs nothing twice", async () => {
    const p: ProfileDTO = (await device.get('/api/profile')).body.profile;
    const t = p.targets!;
    const menu = buildDailyMenu({
      seed: today(),
      targets: { calories: t.calories, proteinG: t.proteinG, carbsG: t.carbsG, fatG: t.fatG },
      mealsPerDay: p.mealsPerDay,
      preferences: { dietType: p.dietType, allergies: p.allergies, dietaryRestrictions: p.dietaryRestrictions, dislikedFoods: p.dislikedFoods },
    });
    expect(menu.items.length).toBeGreaterThanOrEqual(3);
    const before = (await device.get(`/api/nutrition/day?date=${today()}`)).body.totals.kcal as number;
    const key = `menu-${randomUUID()}`;
    const body = (i: (typeof menu.items)[number]) => ({ date: today(), mealType: i.mealType, name: i.dishId, kcal: i.kcal, proteinG: i.proteinG, carbsG: i.carbsG, fatG: i.fatG, fiberG: 0, note: 'menu' });
    const first = await Promise.all(menu.items.map((i) => device.post('/api/nutrition/logs/quick', body(i), idem(`${key}-${i.slot}`))));
    expect(first.map((r) => r.status)).toEqual(menu.items.map(() => 201));
    const retry = await Promise.all(menu.items.map((i) => device.post('/api/nutrition/logs/quick', body(i), idem(`${key}-${i.slot}`))));
    expect(retry.map((r) => r.header('idempotent-replayed'))).toEqual(menu.items.map(() => 'true'));
    expect(retry.map((r) => r.body.entry.id)).toEqual(first.map((r) => r.body.entry.id));
    const after = (await device.get(`/api/nutrition/day?date=${today()}`)).body.totals.kcal as number;
    expect(after - before).toBeCloseTo(menu.totals.kcal, 0);
  });

  it('records body weight and updates the profile', async () => {
    const yesterday = await device.post('/api/progress/body-weight', { date: addDays(today(), -1), weightKg: 62.9 }, idem(`bw-${randomUUID()}`));
    expect(yesterday.status).toBe(201);
    // Onboarding recorded today's weight already: the same day is updated (200), not added.
    const res = await device.post('/api/progress/body-weight', { date: today(), weightKg: 62.4 }, idem(`bw-${randomUUID()}`));
    expect(res.status).toBe(200);
    const list = await device.get('/api/progress/body-weight');
    // Oldest first, NUMERIC weights as numbers and dates as plain YYYY-MM-DD strings.
    expect(list.body.entries).toMatchObject([
      { date: addDays(today(), -1), weightKg: 62.9 },
      { date: today(), weightKg: 62.4 },
    ]);
    expect((await device.get('/api/profile')).body.profile.weightKg).toBe(62.4);
  });

  it('shows the progress overview and the dashboard from the stored data', async () => {
    const overview = await device.get('/api/progress/overview');
    expect(overview.status).toBe(200);
    const dashboard = await device.get('/api/dashboard');
    expect(dashboard.status).toBe(200);
    const day = (await device.get(`/api/nutrition/day?date=${today()}`)).body;
    expect(JSON.stringify(dashboard.body)).toContain(String(day.totals.kcal));
    const gamification = await device.get('/api/gamification');
    expect(gamification.status).toBe(200);
    expect(gamification.body.level.level).toBeGreaterThanOrEqual(1);
  });

  it('runs requests one at a time when the app sends several at once', async () => {
    const results = await Promise.all([1, 2, 3, 4, 5].map((n) => device.get(`/api/nutrition/day?date=${addDays(today(), -n)}`)));
    expect(results.map((r) => [r.status, r.body.date])).toEqual([1, 2, 3, 4, 5].map((n) => [200, addDays(today(), -n)]));
  });
});

describe('features without a server', () => {
  it('answers in the coach with the built-in mode, messages in order', async () => {
    const thread = await device.post('/api/coach/threads', {});
    expect(thread.status).toBe(201);
    const id = thread.body.thread.id;
    const sent = await device.post(`/api/coach/threads/${id}/messages`, { content: 'כמה חלבון אני צריכה ביום?' });
    expect(sent.status).toBe(200);
    expect(sent.body.reply).toMatchObject({ role: 'assistant', source: 'builtin' });
    const messages = await device.get(`/api/coach/threads/${id}/messages`);
    expect(messages.body.messages.map((m: { role: string }) => m.role)).toEqual(['user', 'assistant']);
  });

  it('says meal-photo AI and phone push are not available', async () => {
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(120)]).toString('base64');
    const photo = await device.post('/api/nutrition/photo-analysis', { imageBase64: png, mediaType: 'image/png' });
    expect(photo.status).toBe(503);
    expect(photo.body.error.code).toBe('ai_not_configured');
    const push = await device.get('/api/push/public-key');
    expect(push.body).toEqual({ enabled: false, publicKey: null, devices: 0 });
  });

  it('looks a barcode up at Open Food Facts directly, sending only the barcode', async () => {
    const code = '7290000123457';
    const calls: { url: string; init: RequestInit | undefined }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, init });
        return new Response(
          JSON.stringify({
            status: 1,
            code,
            product: { product_name: 'Tehina', brands: 'Har Bracha', nutriments: { 'energy-kcal_100g': 640, proteins_100g: 24, carbohydrates_100g: 10, fat_100g: 56 } },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }),
    );
    try {
      const res = await device.get(`/api/foods/barcode/${code}`);
      expect(res.status).toBe(200);
      expect(res.body.food).toMatchObject({ barcode: code, source: 'openfoodfacts', name: { en: 'Tehina' }, per100g: { kcal: 640, protein: 24 } });
      expect(calls).toHaveLength(1);
      expect(calls[0]!.url).toMatch(new RegExp(`^https://world\\.openfoodfacts\\.org/api/v2/product/${code}\\.json\\?fields=[a-z_,]+$`));
      const sentHeaders = Object.keys((calls[0]!.init?.headers ?? {}) as Record<string, string>).map((k) => k.toLowerCase()).sort();
      expect(sentHeaders).toEqual(['accept', 'user-agent']);
      expect(calls[0]!.init?.body).toBeUndefined();
      // Cached on the phone: the second lookup does not go online.
      expect((await device.get(`/api/foods/barcode/${code}`)).status).toBe(200);
      expect(calls).toHaveLength(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('errors keep the server’s shapes', () => {
  it('validation, unknown routes, bad JSON, too large, wrong type, CSRF, bad ids, other users, conflicts', async () => {
    const invalid = await device.post('/api/nutrition/logs/quick', { date: 'yesterday' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error).toMatchObject({ code: 'validation_error', message: 'Invalid input' });
    expect(invalid.body.error.details.issues.map((i: { path: string }) => i.path)).toEqual(expect.arrayContaining(['date', 'mealType', 'name', 'kcal']));
    expect(invalid.body.error.requestId).toBe(invalid.header('x-request-id'));

    expect((await device.get('/api/nope')).body.error).toMatchObject({ code: 'route_not_found', message: 'No route for GET /nope' });
    expect((await device.request('POST', '/api/nutrition/logs/quick', '{"date":')).body.error.code).toBe('invalid_json');
    const big = await device.post('/api/nutrition/logs/quick', { name: 'x'.repeat(120_000) });
    expect([big.status, big.body.error.code]).toEqual([413, 'payload_too_large']);
    const text = await device.request('POST', '/api/nutrition/logs/quick', 'plain', { 'content-type': 'text/plain' });
    expect([text.status, text.body.error.code]).toEqual([415, 'unsupported_media_type']);
    const noCsrf = await device.post('/api/coach/threads', {}, { 'x-csrf-token': '' });
    expect([noCsrf.status, noCsrf.body.error.code]).toEqual([403, 'csrf_invalid']);
    expect((await device.get('/api/sessions/not-a-uuid')).body.error.code).toBe('validation_error');
    expect((await device.get(`/api/sessions/${randomUUID()}`)).status).toBe(404);

    const other = new DeviceClient();
    await other.post('/api/auth/register', { email: `device-${randomUUID()}@device.lupufit`, password: devicePassword(), displayName: 'Other', locale: 'en', timezone: 'UTC' });
    const mine = (await device.get('/api/sessions')).body.sessions[0].id;
    expect((await other.get(`/api/sessions/${mine}`)).status).toBe(404);
    const dup = await other.post('/api/auth/register', { ...account, displayName: 'Again' });
    expect([dup.status, dup.body.error.code]).toEqual([409, 'email_taken']);

    const key = `reuse-${randomUUID()}`;
    expect((await device.post('/api/coach/threads', {}, idem(key))).status).toBe(201);
    const reused = await device.post('/api/nutrition/logs/quick', { date: today(), mealType: 'lunch', name: 'x', kcal: 1 }, idem(key));
    expect([reused.status, reused.body.error.code]).toEqual([422, 'idempotency_key_reused']);
  });
});

describe('backup and deletion', () => {
  it('exports everything the account holds', async () => {
    const res = await device.get('/api/account/export');
    expect(res.status).toBe(200);
    expect(res.header('content-type')).toBe('application/json; charset=utf-8');
    expect(res.header('content-disposition')).toBe(`attachment; filename="fitai-export-${res.body.exportDate}.json"`);
    expect(res.text).toContain('\n  "format": "fitai-export"');
    expect(res.body).toMatchObject({ format: 'fitai-export', version: 1, user: { email: account.email } });
    expect(res.body.bodyWeights).toHaveLength(2);
    const stored = await db.one<{ n: number }>('SELECT count(*)::int AS n FROM food_log_entries WHERE user_id = $1', [userId]);
    expect(res.body.foodLog).toHaveLength(stored.n);
    expect(res.body.workoutSessions).toHaveLength(1);
    expect(res.body.workoutSessions[0].exercises[0].sets.length).toBeGreaterThan(0);
    expect(res.body.coachThreads[0].messages).toHaveLength(2);
    expect(JSON.stringify(res.body)).toContain('תפוח');
  });

  it('deletes the account and all of its data, and clears the session cookie', async () => {
    const wrong = await device.delete('/api/account', { password: 'not-the-password-1', confirm: 'DELETE' });
    expect(wrong.body.error.code).toBe('invalid_current_password');
    const res = await device.delete('/api/account', { password: account.password, confirm: 'DELETE' });
    expect(res.status).toBe(200);
    expect(res.cookies[0]).toMatch(/^fitai_session=; Path=\/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax$/);
    expect(device.cookie).toBeNull();
    expect((await device.get('/api/auth/me')).body.user).toBeNull();
    const left = await db.one<{ users: number; entries: number; sessions: number }>(
      `SELECT (SELECT count(*) FROM users WHERE id = $1)::int AS users,
              (SELECT count(*) FROM food_log_entries WHERE user_id = $1)::int AS entries,
              (SELECT count(*) FROM workout_sessions WHERE user_id = $1)::int AS sessions`,
      [userId],
    );
    expect(left).toEqual({ users: 0, entries: 0, sessions: 0 });
  });
});

describe('single connection', () => {
  it('never needed a second database connection: no query ran inside another request’s transaction', () => {
    const stats = deviceDatabaseStats();
    expect(stats.nestedQueries).toBe(0);
    expect(stats.nestedClients).toBe(0);
    expect(stats.transactions).toBeGreaterThan(10);
  });
});
