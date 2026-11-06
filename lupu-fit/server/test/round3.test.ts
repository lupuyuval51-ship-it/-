/** Third security review: each test reproduces a finding of that review (replay privacy, admin list, logout, backup, food, XP, export). */
import { describe, expect, it, vi } from 'vitest';
import { ACCOUNT_LIMITS, BackupPayloadSchema, FOOD_DAY_MAX_ENTRIES, MAX_SESSION_EXERCISES } from '@lupu-fit/shared';
import { EXERCISES } from '@lupu-fit/shared/content';
import { buildApp } from '../src/createApp.ts';
import { hostedConfigProblem } from '../src/hostedConfig.ts';
import { extraRoutes } from '../src/routes/index.ts';
import { hashGateSize } from '../src/routes/auth.ts';
import { EXPORT_PER_MIN, groupBy } from '../src/routes/account.ts';
import { call, makeApp, PROFILE, register, type TestCtx } from './helpers.ts';

const D = '2026-11-02'; // the test clock's day (a Monday)
const presc = { sets: 3, repsMin: 8, repsMax: 10, rpe: 7, restSec: 90, loadKg: null, durationSec: null };
const food = { loggedDate: D, slot: 'lunch', name: 'Rice', grams: 100, kcal: 130, proteinG: 3, carbsG: 28, fatG: 0 };
async function onboard(t: TestCtx, username = 'user_a', profile: Record<string, unknown> = {}) {
  const c = await register(t, username);
  expect((await call(t, c, 'PUT', '/api/profile', { ...PROFILE, ...profile })).status).toBe(200);
  return c;
}

describe('replay records never keep private answers', () => {
  it('a deleted coach thread leaves no message text in idempotency_keys, and the profile answer is not stored', async () => {
    const t = await makeApp(); const c = await register(t);
    expect((await call(t, c, 'PUT', '/api/profile', { ...PROFILE, injuries: ['knee'] }, { 'idempotency-key': 'k-prof' })).status).toBe(200);
    const th = await call(t, c, 'POST', '/api/coach/threads', { title: 'Knee chat' }, { 'idempotency-key': 'k1' });
    expect(th.status).toBe(201);
    const msg = await call(t, c, 'POST', `/api/coach/threads/${th.json.id}/messages`, { text: 'my secret knee injury story', lang: 'en' }, { 'idempotency-key': 'k2' });
    expect(msg.status).toBe(201);
    const crisis = await call(t, c, 'POST', `/api/coach/threads/${th.json.id}/messages`, { text: 'I want to die', lang: 'en' }, { 'idempotency-key': 'k3' });
    expect(crisis.json.assistant.safetyCategory).toBe('self_harm');
    const stored = async () => (await t.db.query<{ path: string; body: string | null }>('SELECT path, response_body::text AS body FROM idempotency_keys')).map((r) => `${r.path} ${r.body ?? ''}`).join('\n');
    expect(await stored()).not.toMatch(/secret knee|want to die|"injuries"|"age"/);
    // A replay of a status-only record answers that status without a body (the request is not run twice).
    const replay = await call(t, c, 'PUT', '/api/profile', { ...PROFILE }, { 'idempotency-key': 'k-prof' });
    expect(replay.status).toBe(200); expect(replay.headers?.['idempotent-replay']).toBe('true'); expect(replay.body).toBeUndefined();
    // Records an older version stored with text are dropped together with the thread.
    await t.db.query("UPDATE idempotency_keys SET response_body = '{\"user\":{\"content\":\"my secret knee injury story\"}}'::jsonb WHERE key = 'k2'");
    expect((await call(t, c, 'DELETE', `/api/coach/threads/${th.json.id}`)).status).toBe(200);
    const left = await stored();
    expect(left).not.toContain('secret knee');
    expect(left).not.toContain(`/api/coach/threads/${th.json.id}`);
  });
  it('the offline outbox routes still replay their full answer', async () => {
    const t = await makeApp(); const c = await onboard(t);
    const first = await call(t, c, 'POST', '/api/food-log', food, { 'idempotency-key': 'outbox-1' });
    const again = await call(t, c, 'POST', '/api/food-log', food, { 'idempotency-key': 'outbox-1' });
    expect(again.headers?.['idempotent-replay']).toBe('true'); expect(again.json.entry.id).toBe(first.json.entry.id);
  });
});

describe('ADMIN_USERNAMES is the single source of truth for the admin role', () => {
  it('a squatted admin name loses the role when the list no longer names it (existing session and new login)', async () => {
    const t = await makeApp({ adminUsernames: ['boss'] });
    const c = await register(t, 'boss');
    expect((await call(t, c, 'GET', '/api/auth/me')).json.user.role).toBe('admin');
    const redeployed = { ...t, app: buildApp({ ...t.app.deps, adminUsernames: [] }, extraRoutes) };
    expect((await call(redeployed, c, 'GET', '/api/auth/me')).json.user.role).toBe('user');
    const media = await call(redeployed, c, 'POST', '/api/admin/exercises/push_up/media', { mp4Base64: 'A'.repeat(200), url: '/media/x.mp4' });
    expect(media.status).toBe(404);
    const login = await call(redeployed, { cookie: '', csrf: '', ip: '10.0.0.9' }, 'POST', '/api/auth/login', { username: 'boss', password: 'correct-horse-battery' });
    expect(login.json.user.role).toBe('user');
  });
});

describe('sign-out is idempotent', () => {
  it('an expired session still gets 200 and a cleared cookie; a live one needs its CSRF token', async () => {
    const t = await makeApp(); const c = await register(t);
    const live = await call(t, { ...c, csrf: 'wrong' }, 'POST', '/api/auth/logout');
    expect(live.status).toBe(403);
    t.now.t = new Date(t.now.t.getTime() + 31 * 86400_000);
    const r = await call(t, { ...c }, 'POST', '/api/auth/logout');
    expect(r.status).toBe(200); expect(r.setCookies?.[0]).toMatch(/^lf_session=; .*Max-Age=0/);
    expect((await call(t, { cookie: '', csrf: '', ip: '10.0.0.1' }, 'POST', '/api/auth/logout')).status).toBe(200); // no cookie at all
  });
});

describe('the export always restores: backup limits are the write limits', () => {
  it('logs the largest valid data through every write route, exports it, restores it, and gets the same backup back', async () => {
    const t = await makeApp(); const c = await onboard(t, 'user_a', { displayName: 'N'.repeat(60) });
    const longName = 'n'.repeat(160);
    expect((await call(t, c, 'POST', '/api/food-log', { ...food, name: longName, grams: 0.1, dishId: 'some_dish', estimated: true })).status).toBe(201);
    expect((await call(t, c, 'POST', '/api/food-log', { ...food, slot: 'dinner', grams: 5000, kcal: 5000, proteinG: 500, carbsG: 1000, fatG: 500 })).status).toBe(201);
    expect((await call(t, c, 'POST', '/api/weights', { loggedDate: D, weightKg: 80, note: 'w'.repeat(300) })).status).toBe(201);
    const m = await call(t, c, 'POST', '/api/saved-meals', { name: 'Meal', slot: 'lunch', items: [{ name: longName, grams: 0.1, kcal: 1, proteinG: 0, carbsG: 0, fatG: 0 }] });
    expect((await call(t, c, 'POST', `/api/saved-meals/${m.json.id}/log`, { loggedDate: '2026-11-01' })).status).toBe(201);
    const ids = EXERCISES.slice(0, MAX_SESSION_EXERCISES - 2).map((e) => e.id);
    const s = await call(t, c, 'POST', '/api/sessions', { name: 'S'.repeat(160), source: 'custom', localDate: D, exercises: ids.map((exerciseId) => ({ exerciseId, planned: presc })) });
    expect(s.status, JSON.stringify(s.json)).toBe(201);
    for (const id of EXERCISES.slice(MAX_SESSION_EXERCISES - 2, MAX_SESSION_EXERCISES).map((e) => e.id)) expect((await call(t, c, 'POST', `/api/sessions/${s.json.id}/exercises`, { exerciseId: id, planned: presc })).status).toBe(201);
    expect((await call(t, c, 'POST', `/api/sessions/${s.json.id}/exercises`, { exerciseId: 'push_up', planned: presc })).status).toBe(400); // the cap
    expect((await call(t, c, 'POST', `/api/sessions/${s.json.id}/sets`, { sessionExerciseId: s.json.exercises[0].id, reps: 8, weightKg: 1000, rpe: 9.5 })).status).toBe(201);
    expect((await call(t, c, 'POST', `/api/sessions/${s.json.id}/finish`)).status).toBe(200);

    const ex = await call(t, c, 'GET', '/api/export');
    expect(ex.status).toBe(200);
    const parsed = BackupPayloadSchema.safeParse(ex.json.backup);
    expect(parsed.success, JSON.stringify(parsed.error?.issues?.slice(0, 3))).toBe(true);
    expect(ex.json.backup.sessions[0].exercises).toHaveLength(MAX_SESSION_EXERCISES);
    expect(ex.json.backup.foodLog.find((f: { name: string; grams: number; slot: string; loggedDate: string }) => f.name === longName && f.grams === 0.1 && f.slot === 'lunch' && f.loggedDate === D)).toMatchObject({ dishId: 'some_dish', estimated: true });
    const res = await call(t, c, 'POST', '/api/device/restore', ex.json.backup);
    expect(res.status, JSON.stringify(res.json)).toBe(200);
    t.now.t = new Date(t.now.t.getTime() + 61_000);
    const again = (await call(t, c, 'GET', '/api/export')).json.backup;
    const norm = (b: { foodLog: unknown[]; bodyWeight: unknown[] }) => ({ food: [...b.foodLog].map((f) => JSON.stringify(f)).sort(), weights: b.bodyWeight });
    expect(norm(again)).toEqual(norm(ex.json.backup));
  });
});

describe('food log copy and caps', () => {
  it('a day cannot be copied onto itself, a second copy is refused, and a day never grows past the cap', async () => {
    const t = await makeApp(); const c = await onboard(t);
    expect((await call(t, c, 'POST', '/api/food-log', { ...food, loggedDate: '2026-11-01' })).status).toBe(201);
    expect((await call(t, c, 'POST', '/api/food-log/copy', { fromDate: D, toDate: D })).status).toBe(400);
    expect((await call(t, c, 'POST', '/api/food-log/copy', { fromDate: '2026-11-01', toDate: '2026-11-01' })).status).toBe(400);
    const first = await call(t, c, 'POST', '/api/food-log/copy', { fromDate: '2026-11-01', toDate: D });
    expect(first.status).toBe(201); expect(first.json.copied).toBe(1);
    const second = await call(t, c, 'POST', '/api/food-log/copy', { fromDate: '2026-11-01', toDate: D });
    expect(second.status).toBe(200); expect(second.json).toEqual({ copied: 0, xp: 0, alreadyCopied: true }); // a second tap changes nothing
    // Fill D up to the cap: one more entry, a copy or a saved meal is refused.
    await t.db.query(`INSERT INTO food_log_entries (id, user_id, logged_date, slot, name, grams, kcal, protein_g, carbs_g, fat_g)
      SELECT 'seed-' || g, (SELECT id FROM users LIMIT 1), $1::date, 'snack', 'x', 1, 1, 0, 0, 0 FROM generate_series(1, $2::int) g`, [D, FOOD_DAY_MAX_ENTRIES - 1]);
    const full = await call(t, c, 'POST', '/api/food-log', food);
    expect(full.status).toBe(409); expect(full.json).toMatchObject({ error: 'limit_reached', scope: 'food_day', max: FOOD_DAY_MAX_ENTRIES });
    const m = await call(t, c, 'POST', '/api/saved-meals', { name: 'Meal', slot: 'lunch', items: [{ name: 'a', grams: 1, kcal: 1, proteinG: 0, carbsG: 0, fatG: 0 }] });
    expect((await call(t, c, 'POST', `/api/saved-meals/${m.json.id}/log`, { loggedDate: D })).json.scope).toBe('food_day');
    expect((await call(t, c, 'POST', '/api/food-log', { ...food, loggedDate: '2026-10-31', name: 'other' })).status).toBe(201);
    expect((await call(t, c, 'POST', '/api/food-log/copy', { fromDate: '2026-10-31', toDate: D })).json.scope).toBe('food_day');
    expect(Number((await t.db.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM food_log_entries WHERE logged_date = $1', [D]))[0]?.n)).toBe(FOOD_DAY_MAX_ENTRIES);
  });
});

describe('XP cannot be minted from client-chosen dates or empty sessions', () => {
  it('far-past and far-future dates are refused; back-filled logs are kept but pay nothing', async () => {
    const t = await makeApp(); const c = await onboard(t);
    for (const d of ['2040-01-02', '1990-01-01', '2026-11-04']) {
      expect((await call(t, c, 'POST', '/api/weights', { loggedDate: d, weightKg: 80 })).json.issues?.[0]?.message, d).toBe('date_out_of_range');
      expect((await call(t, c, 'POST', '/api/food-log', { ...food, loggedDate: d })).json.issues?.[0]?.message, d).toBe('date_out_of_range');
    }
    for (const d of ['2026-10-31', '2026-11-04']) {
      expect((await call(t, c, 'POST', '/api/sessions', { name: 'W', source: 'custom', localDate: d, exercises: [{ exerciseId: 'push_up', planned: presc }] })).json.issues?.[0]?.message, d).toBe('date_out_of_range');
      expect((await call(t, c, 'POST', '/api/readiness', { localDate: d, sleep: 3, energy: 3, soreness: 3, pain: false })).json.issues?.[0]?.message, d).toBe('date_out_of_range');
    }
    const old = await call(t, c, 'POST', '/api/weights', { loggedDate: '2026-10-01', weightKg: 80 });
    expect(old.status).toBe(201); expect(old.json.xp).toBe(0); // logged, but outside the reward window
    const heavy = { ...food, loggedDate: '2026-10-01', kcal: 3000, proteinG: 300 };
    expect((await call(t, c, 'POST', '/api/food-log', heavy)).json.xp).toBe(0);
    expect((await call(t, c, 'POST', '/api/food-log', { ...heavy, loggedDate: D })).json.xp).toBe(10); // today's protein day still pays
  });
  it('empty start-and-finish sessions do not count toward the weekly goal', async () => {
    const t = await makeApp(); const c = await onboard(t, 'user_a', { daysPerWeek: 2 });
    for (const d of [D, '2026-11-03']) {
      const s = await call(t, c, 'POST', '/api/sessions', { name: 'W', source: 'custom', localDate: d, exercises: [{ exerciseId: 'push_up', planned: presc }] });
      expect(s.status, d).toBe(201);
      const f = await call(t, c, 'POST', `/api/sessions/${s.json.id}/finish`);
      expect(f.json.xpTotal).toBe(0);
    }
    expect((await t.db.query("SELECT 1 FROM xp_events WHERE source_type = 'weekly_goal'")).length).toBe(0);
  });
  it('a future-dated weight row never reaches the trend list', async () => {
    const t = await makeApp(); const c = await onboard(t);
    await t.db.query("INSERT INTO body_weight_entries (id, user_id, logged_date, weight_kg) SELECT 'w-future', id, '2040-01-01', 150 FROM users");
    expect((await call(t, c, 'POST', '/api/weights', { loggedDate: D, weightKg: 80 })).status).toBe(201);
    expect((await call(t, c, 'GET', '/api/weights?days=30')).json.entries.map((e: { loggedDate: string }) => e.loggedDate)).toEqual([D]);
  });
});

describe('export cost is linear and bounded per account', () => {
  it('builds the export for 500 saved meals x 40 items (the account cap) quickly, groups items correctly, and is rate limited', async () => {
    const t = await makeApp(); const c = await onboard(t);
    await t.db.query("INSERT INTO saved_meals (id, user_id, name, slot) SELECT 'm' || g, (SELECT id FROM users LIMIT 1), 'Meal ' || g, 'lunch' FROM generate_series(1, 500) g");
    await t.db.query("INSERT INTO saved_meal_items (id, saved_meal_id, name, grams, kcal, protein_g, carbs_g, fat_g) SELECT 'i' || m || '-' || k, 'm' || m, 'item', 1, 1, 0, 0, 0 FROM generate_series(1, 500) m, generate_series(1, 40) k");
    const started = performance.now();
    const ex = await call(t, c, 'GET', '/api/export');
    const ms = performance.now() - started;
    expect(ex.status).toBe(200);
    expect(ex.json.backup.savedMeals).toHaveLength(500);
    expect(ex.json.backup.savedMeals.every((m: { items: unknown[] }) => m.items.length === 40)).toBe(true);
    expect(ms).toBeLessThan(10_000); // end to end on in-memory PGlite (the database read dominates); the grouping itself is checked below
    for (let i = 1; i < EXPORT_PER_MIN; i++) expect((await call(t, c, 'GET', '/api/export')).status).toBe(200);
    const limited = await call(t, c, 'GET', '/api/export');
    expect(limited.status).toBe(429); expect(limited.headers?.['retry-after']).toBe('60');
    // The saved-meal list loads in two queries (not one per meal) and groups the same way.
    const list = (await call(t, c, 'GET', '/api/saved-meals')).json.meals as { items: unknown[] }[];
    expect(list).toHaveLength(500); expect(list.every((m) => m.items.length === 40)).toBe(true);
  }, 60_000);
  it('grouping 80,000 rows into 2,000 groups is one pass (the old filter per group took over a second)', () => {
    const rows = Array.from({ length: 80_000 }, (_, i) => ({ saved_meal_id: `m${i % 2000}`, i }));
    const started = performance.now();
    const by = groupBy(rows, 'saved_meal_id');
    expect(performance.now() - started).toBeLessThan(200);
    expect(by.size).toBe(2000); expect(by.get('m7')?.map((r) => r.i).slice(0, 2)).toEqual([7, 2007]);
  });
  it('saved meals and coach threads have a per-account cap', async () => {
    const t = await makeApp(); const c = await onboard(t);
    await t.db.query("INSERT INTO saved_meals (id, user_id, name, slot) SELECT 'm' || g, (SELECT id FROM users LIMIT 1), 'Meal', 'lunch' FROM generate_series(1, $1::int) g", [ACCOUNT_LIMITS.savedMeals]);
    const meal = await call(t, c, 'POST', '/api/saved-meals', { name: 'One more', slot: 'lunch', items: [{ name: 'a', grams: 1, kcal: 1, proteinG: 0, carbsG: 0, fatG: 0 }] });
    expect(meal.status).toBe(409); expect(meal.json.error).toBe('limit_reached');
    await t.db.query("INSERT INTO coach_threads (id, user_id, title) SELECT 't' || g, (SELECT id FROM users LIMIT 1), 'T' FROM generate_series(1, $1::int) g", [ACCOUNT_LIMITS.coachThreads]);
    expect((await call(t, c, 'POST', '/api/coach/threads', {})).json.error).toBe('limit_reached');
  });
});

describe('rules coach answers from the real plan', () => {
  it('names today\'s plan day when a plan is active, and says there is no plan otherwise', async () => {
    const t = await makeApp(); const c = await onboard(t);
    const ask = async (lang: 'en' | 'he', text: string) => {
      const th = await call(t, c, 'POST', '/api/coach/threads', {});
      return (await call(t, c, 'POST', `/api/coach/threads/${th.json.id}/messages`, { text, lang })).json.assistant.content as string;
    };
    expect(await ask('en', 'What should I train today?')).toMatch(/You have no active plan/);
    expect(await ask('he', 'על מה כדאי להתאמן היום?')).toContain('אין תוכנית פעילה');
    const plan = (await call(t, c, 'POST', '/api/plans/generate', {})).json.plan as { days: { day: string; exercises: unknown[] }[] };
    expect((await call(t, c, 'POST', '/api/plans', { name: 'My plan', plan, activate: true })).status).toBe(201);
    const reply = await ask('en', 'What should I train today?');
    expect(reply).toContain(`Today's workout: My plan: `);
    expect(reply).toContain(`(${plan.days[0]?.exercises.length} exercises)`);
    expect(await ask('en', 'hello')).toMatch(/not enough data/i); // no finished workout in the last 30 days yet
  });
});

describe('hosted start-up and the hash gate', () => {
  it('the hosted entry refuses dev-grade settings', () => {
    const base = { DATABASE_URL: 'postgres://x', NODE_ENV: 'production', TRUST_PROXY: '1' };
    expect(hostedConfigProblem(base)).toBeNull();
    expect(hostedConfigProblem({ ...base, NODE_ENV: undefined })).toMatch(/NODE_ENV=production/);
    expect(hostedConfigProblem({ ...base, TRUST_PROXY: undefined })).toMatch(/TRUST_PROXY is required/);
    expect(hostedConfigProblem({ ...base, TRUST_PROXY: 'true' })).toMatch(/every X-Forwarded-For hop/);
    expect(hostedConfigProblem({ ...base, TRUST_PROXY: 'false' })).toBeNull();
    expect(hostedConfigProblem({ ...base, DATABASE_URL: undefined })).toMatch(/DATABASE_URL/);
  });
  it('the PBKDF2 gate follows the libuv pool size and leaves one thread free', () => {
    expect(hashGateSize({})).toBe(3);
    expect(hashGateSize({ UV_THREADPOOL_SIZE: '8' })).toBe(7);
    expect(hashGateSize({ UV_THREADPOOL_SIZE: '1' })).toBe(1);
    expect(hashGateSize({ UV_THREADPOOL_SIZE: 'nope' })).toBe(3);
    expect(hashGateSize(undefined)).toBe(3);
  });
  it('an injected synchronous token hash is used for sessions', async () => {
    const t = await makeApp();
    const { createHash } = await import('node:crypto');
    const sha = vi.fn((s: string) => createHash('sha256').update(s).digest('hex'));
    const app = buildApp({ ...t.app.deps, sha256: sha }, extraRoutes);
    const tt = { ...t, app };
    const c = await register(tt, 'hashy');
    expect((await call(tt, c, 'GET', '/api/auth/me')).status).toBe(200);
    expect(sha).toHaveBeenCalled();
  });
});
