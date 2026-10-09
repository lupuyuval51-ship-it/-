import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { todayInTimeZone } from '@shared/dates';
import { config } from '../src/config';
import { db } from '../src/db/pool';
import { sha256 } from '../src/lib/crypto';
import { resetRateLimits } from '../src/middleware/rateLimit';
import { EXCLUDED_TABLES, EXPORTED_TABLES } from '../src/modules/profile/account';
import { TestClient, onboardedUser, startTestServer, type TestServer } from './helpers/server';

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});
afterAll(async () => {
  await server.close();
  await db.close();
});

/** Every table holding per-user rows, with the column that points at the owner. */
async function userTables(): Promise<{ table: string; column: string }[]> {
  return db.many<{ table: string; column: string }>(
    `SELECT table_name AS table, column_name AS column FROM information_schema.columns
      WHERE table_schema = 'public' AND column_name IN ('user_id', 'owner_user_id')
      ORDER BY table_name`,
  );
}

/**
 * Seeds one row (or a small tree) in every user-data table, tagged with `tag` so leaks from
 * other users are easy to spot in the export.
 */
async function seedEverything(userId: string, tag: string) {
  const name = (s: string) => JSON.stringify({ en: `${tag} ${s}`, he: `${tag} ${s}` });
  await db.exec(`INSERT INTO body_weight_entries (user_id, measured_on, weight_kg, note) VALUES ($1, '2026-01-02', 81.5, $2)`, [userId, `${tag} weigh-in`]);
  const plan = await db.one<{ id: string }>(
    `INSERT INTO workout_plans (user_id, name, status, source, goal) VALUES ($1, $2, 'active', 'custom', 'strength') RETURNING id`,
    [userId, `${tag} plan`],
  );
  const workout = await db.one<{ id: string }>(
    `INSERT INTO plan_workouts (plan_id, user_id, position, name) VALUES ($1, $2, 0, $3) RETURNING id`,
    [plan.id, userId, `${tag} day A`],
  );
  await db.exec(
    `INSERT INTO plan_exercises (workout_id, user_id, exercise_id, position, sets, rep_min, rep_max, rest_seconds, notes)
     VALUES ($1, $2, 'pull_up', 0, 3, 6, 10, 120, $3)`,
    [workout.id, userId, `${tag} plan note`],
  );
  const session = await db.one<{ id: string }>(
    `INSERT INTO workout_sessions (user_id, plan_id, plan_workout_id, name, status, ended_at, duration_seconds)
     VALUES ($1, $2, $3, $4, 'completed', now(), 1800) RETURNING id`,
    [userId, plan.id, workout.id, `${tag} session`],
  );
  const se = await db.one<{ id: string }>(
    `INSERT INTO session_exercises (session_id, user_id, exercise_id, position, notes) VALUES ($1, $2, 'pull_up', 0, $3) RETURNING id`,
    [session.id, userId, `${tag} session note`],
  );
  const set = await db.one<{ id: string }>(
    `INSERT INTO session_sets (session_exercise_id, session_id, user_id, set_number, reps, weight_kg, completed, completed_at)
     VALUES ($1, $2, $3, 1, 8, 10, true, now()) RETURNING id`,
    [se.id, session.id, userId],
  );
  await db.exec(
    `INSERT INTO personal_records (user_id, exercise_id, record_type, value, reps, session_id, set_id)
     VALUES ($1, 'pull_up', 'max_reps', 8, 8, $2, $3)`,
    [userId, session.id, set.id],
  );
  const food = await db.one<{ id: string }>(
    `INSERT INTO foods (owner_user_id, source, name, category, kcal, protein_g, carbs_g, fat_g, serving_grams, serving_label)
     VALUES ($1, 'user', $2, 'snacks_sweets', 400, 10, 50, 15, 30, $3) RETURNING id`,
    [userId, name('bar'), name('bar serving')],
  );
  await db.exec(
    `INSERT INTO food_log_entries (user_id, logged_on, meal_type, food_id, food_name, grams, kcal, protein_g, note)
     VALUES ($1, '2026-01-02', 'snack', $2, $3, 30, 120, 3, $4)`,
    [userId, food.id, name('bar'), `${tag} log note`],
  );
  const meal = await db.one<{ id: string }>(`INSERT INTO saved_meals (user_id, name, meal_type) VALUES ($1, $2, 'snack') RETURNING id`, [userId, `${tag} meal`]);
  await db.exec(`INSERT INTO saved_meal_items (saved_meal_id, user_id, food_id, grams) VALUES ($1, $2, $3, 60)`, [meal.id, userId, food.id]);
  const thread = await db.one<{ id: string }>(`INSERT INTO coach_threads (user_id, title) VALUES ($1, $2) RETURNING id`, [userId, `${tag} thread`]);
  await db.exec(
    `INSERT INTO coach_messages (thread_id, user_id, role, content, source) VALUES ($1, $2, 'user', $3, NULL), ($1, $2, 'assistant', $4, 'builtin')`,
    [thread.id, userId, `${tag} question`, `${tag} answer`],
  );
  await db.exec(`INSERT INTO xp_events (user_id, source_type, source_key, xp) VALUES ($1, 'workout', $2, 50)`, [userId, `${tag}-session`]);
  await db.exec(`INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)`, [userId, `${tag}_badge`]);
  await db.exec(`INSERT INTO notifications (user_id, kind, data) VALUES ($1, 'info', $2)`, [userId, JSON.stringify({ tag })]);
  await db.exec(`INSERT INTO ai_usage_events (user_id, kind) VALUES ($1, 'food_photo')`, [userId]);
  await db.exec(`INSERT INTO coach_usage (user_id) VALUES ($1)`, [userId]);
  await db.exec(`INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '1 hour')`, [
    userId,
    sha256(`${tag}-${userId}-reset-token`),
  ]);
  return { planId: plan.id, sessionId: session.id, foodId: food.id, threadId: thread.id };
}

describe('GET /api/account/export', () => {
  it('downloads all of the user’s data as a dated JSON attachment', async () => {
    const a = await onboardedUser(server.baseUrl, {}, { displayName: 'Exporter', timezone: 'Asia/Jerusalem' });
    const b = await onboardedUser(server.baseUrl, {}, { displayName: 'Bystander' });
    const ids = await seedEverything(a.userId!, 'ALPHA');
    await seedEverything(b.userId!, 'BRAVO');
    // An idempotent request leaves a stored key (must not be exported).
    await a.patch('/api/settings', { theme: 'dark' }, { headers: { 'idempotency-key': 'export-test-key-123' } });

    const res = await a.get('/api/account/export');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    const date = todayInTimeZone('Asia/Jerusalem');
    expect(res.headers.get('content-disposition')).toBe(`attachment; filename="fitai-export-${date}.json"`);
    expect(res.headers.get('cache-control')).toBe('no-store');

    const data = res.body;
    expect(data).toMatchObject({ format: 'fitai-export', version: 1, exportDate: date });
    expect(data.user).toMatchObject({ id: a.userId, email: a.email, displayName: 'Exporter', theme: 'dark' });
    expect(data.profile.goal).toBe('muscle_gain');
    expect(data.bodyWeights).toEqual([expect.objectContaining({ measuredOn: '2026-01-02', weightKg: 81.5, note: 'ALPHA weigh-in' })]);

    expect(data.workoutPlans).toHaveLength(1);
    const plan = data.workoutPlans[0];
    expect(plan).toMatchObject({ id: ids.planId, name: 'ALPHA plan', status: 'active' });
    expect(plan.workouts).toHaveLength(1);
    expect(plan.workouts[0]).toMatchObject({ name: 'ALPHA day A' });
    expect(plan.workouts[0].exercises).toEqual([expect.objectContaining({ exerciseId: 'pull_up', sets: 3, repMin: 6, repMax: 10, notes: 'ALPHA plan note' })]);

    expect(data.workoutSessions).toHaveLength(1);
    const session = data.workoutSessions[0];
    expect(session).toMatchObject({ id: ids.sessionId, name: 'ALPHA session', status: 'completed', durationSeconds: 1800 });
    expect(session.exercises[0]).toMatchObject({ exerciseId: 'pull_up', notes: 'ALPHA session note' });
    expect(session.exercises[0].sets).toEqual([expect.objectContaining({ setNumber: 1, reps: 8, weightKg: 10, completed: true })]);

    expect(data.personalRecords).toEqual([expect.objectContaining({ exerciseId: 'pull_up', recordType: 'max_reps', value: 8 })]);
    expect(data.customFoods).toEqual([expect.objectContaining({ id: ids.foodId, name: { en: 'ALPHA bar', he: 'ALPHA bar' }, kcal: 400 })]);
    expect(data.foodLog).toEqual([expect.objectContaining({ loggedOn: '2026-01-02', mealType: 'snack', kcal: 120, note: 'ALPHA log note' })]);
    expect(data.savedMeals).toEqual([
      expect.objectContaining({ name: 'ALPHA meal', items: [expect.objectContaining({ foodId: ids.foodId, grams: 60, foodName: { en: 'ALPHA bar', he: 'ALPHA bar' } })] }),
    ]);
    expect(data.coachThreads).toHaveLength(1);
    expect(data.coachThreads[0]).toMatchObject({ id: ids.threadId, title: 'ALPHA thread' });
    expect(data.coachThreads[0].messages.map((m: { content: string }) => m.content)).toEqual(['ALPHA question', 'ALPHA answer']);
    expect(data.xpEvents).toEqual([expect.objectContaining({ sourceType: 'workout', sourceKey: 'ALPHA-session', xp: 50 })]);
    expect(data.achievements).toEqual([expect.objectContaining({ achievementId: 'ALPHA_badge' })]);
    expect(data.notifications).toEqual([expect.objectContaining({ kind: 'info', data: { tag: 'ALPHA' } })]);

    // No secrets and nothing from other users.
    const raw = JSON.stringify(data);
    const secrets = await db.one<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = $1', [a.userId]);
    const sessionRows = await db.many<{ token_hash: string; csrf_token: string }>('SELECT token_hash, csrf_token FROM auth_sessions WHERE user_id = $1', [a.userId]);
    expect(sessionRows.length).toBeGreaterThan(0);
    for (const s of [secrets.password_hash, ...sessionRows.flatMap((r) => [r.token_hash, r.csrf_token]), sha256(`ALPHA-${a.userId}-reset-token`), 'export-test-key-123', a.csrfToken!]) {
      expect(raw).not.toContain(s);
    }
    expect(raw).not.toMatch(/password|token_?hash|csrf|idempotency|scrypt\$/i);
    expect(raw).not.toContain('BRAVO');
    expect(raw).not.toContain(b.userId!);
    expect(raw).not.toContain(b.email!);
  });

  it('exports an empty but complete document for a new user', async () => {
    const c = await onboardedUser(server.baseUrl);
    const res = await c.get('/api/account/export');
    expect(res.status).toBe(200);
    for (const key of ['workoutPlans', 'workoutSessions', 'personalRecords', 'customFoods', 'foodLog', 'savedMeals', 'coachThreads', 'xpEvents', 'achievements', 'notifications']) {
      expect(res.body[key], key).toEqual([]);
    }
  });

  it('covers every table that stores per-user data', async () => {
    const covered = new Set<string>([...EXPORTED_TABLES, ...Object.keys(EXCLUDED_TABLES)]);
    const missing = (await userTables()).map((t) => t.table).filter((t) => !covered.has(t));
    // A new table with user data must be added to the export (or explicitly excluded) in profile/account.ts.
    expect(missing).toEqual([]);
  });

  it('requires authentication', async () => {
    expect((await new TestClient(server.baseUrl).get('/api/account/export')).status).toBe(401);
  });
});

describe('DELETE /api/account', () => {
  it('requires the correct password and the typed confirmation', async () => {
    const c = await onboardedUser(server.baseUrl);
    const wrong = await c.delete('/api/account', { password: 'not-my-password1', confirm: 'DELETE' });
    expect(wrong.status).toBe(400);
    expect(wrong.body.error.code).toBe('invalid_current_password');
    for (const bad of [{ password: 'Passw0rd!' }, { password: 'Passw0rd!', confirm: 'delete' }, { password: '', confirm: 'DELETE' }, {}]) {
      const res = await c.delete('/api/account', bad);
      expect(res.status, JSON.stringify(bad)).toBe(400);
      expect(res.body.error.code).toBe('validation_error');
    }
    expect((await c.get('/api/profile')).status).toBe(200);
    const noCsrf = await c.delete('/api/account', { password: 'Passw0rd!', confirm: 'DELETE' }, { csrf: false });
    expect(noCsrf.status).toBe(403);
    expect(await db.maybeOne('SELECT 1 FROM users WHERE id = $1', [c.userId])).not.toBeNull();
  });

  it('deletes the user and every row they own, and ends the session', async () => {
    const victim = await onboardedUser(server.baseUrl);
    const other = await onboardedUser(server.baseUrl);
    await seedEverything(victim.userId!, 'GONE');
    await seedEverything(other.userId!, 'KEPT');
    await victim.patch('/api/profile', { weightKg: 77 }, { headers: { 'idempotency-key': 'delete-test-key-123' } });
    const oldCookie = victim.cookie;

    const res = await victim.delete('/api/account', { password: 'Passw0rd!', confirm: 'DELETE' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    const cleared = res.headers.getSetCookie().find((c) => c.includes('fitai_session'));
    expect(cleared).toMatch(/fitai_session=;/);
    expect(cleared).toMatch(/Expires=Thu, 01 Jan 1970/i);

    expect(await db.maybeOne('SELECT 1 FROM users WHERE id = $1', [victim.userId])).toBeNull();
    for (const { table, column } of await userTables()) {
      const left = await db.one<{ n: number }>(`SELECT count(*)::int AS n FROM ${table} WHERE ${column} = $1`, [victim.userId]);
      expect(left.n, `${table}.${column}`).toBe(0);
      const kept = await db.one<{ n: number }>(`SELECT count(*)::int AS n FROM ${table} WHERE ${column} = $1`, [other.userId]);
      if (!['idempotency_keys', 'auth_sessions'].includes(table)) expect(kept.n, `${table} (other user)`).toBeGreaterThan(0);
    }
    expect((await other.get('/api/profile')).status).toBe(200);

    // The old session cookie no longer works, and neither do the credentials.
    const stale = new TestClient(server.baseUrl);
    stale.cookie = oldCookie;
    expect((await stale.get('/api/profile')).status).toBe(401);
    expect((await stale.get('/api/auth/me')).body.user).toBeNull();
    const login = await new TestClient(server.baseUrl).post('/api/auth/login', { email: victim.email, password: 'Passw0rd!' });
    expect(login.status).toBe(401);
  });

  it('is rate limited per user', async () => {
    const original = config.rateLimit.multiplier;
    config.rateLimit.multiplier = 1;
    resetRateLimits();
    try {
      const c = await onboardedUser(server.baseUrl);
      const statuses: number[] = [];
      for (let i = 0; i < 6; i++) statuses.push((await c.delete('/api/account', { password: 'wrong-password-1', confirm: 'DELETE' })).status);
      expect(statuses.slice(0, 5)).toEqual([400, 400, 400, 400, 400]);
      expect(statuses[5]).toBe(429);
      const ok = await c.delete('/api/account', { password: 'Passw0rd!', confirm: 'DELETE' });
      expect(ok.status).toBe(429);
      expect(await db.maybeOne('SELECT 1 FROM users WHERE id = $1', [c.userId])).not.toBeNull();
    } finally {
      config.rateLimit.multiplier = original;
      resetRateLimits();
    }
  });

  it('requires authentication', async () => {
    expect((await new TestClient(server.baseUrl).delete('/api/account', { password: 'x', confirm: 'DELETE' })).status).toBe(401);
  });
});
