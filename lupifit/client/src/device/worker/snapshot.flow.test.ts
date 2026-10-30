/**
 * Device backup and restore on the full device stack (aliases, device env, PGlite in memory): a snapshot of
 * real data made through the API comes back in full on a "new phone" (a fresh device account, built-in foods
 * with other ids), a bad snapshot changes nothing, and the snapshot covers every per-user table.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../../../../server/src/db/pool';
import { DeviceBuffer } from '../buffer';
import { randomUUID } from '../shims/crypto';
import { DEVICE_MIGRATIONS } from '../migrations';
import { DEVICE_RESTORE_PATH, DEVICE_SNAPSHOT_PATH, SNAPSHOT_FORMAT, type DeviceSnapshot } from './protocol';
import { bootDeviceRuntime, type DeviceRuntime } from './runtime';
import type { PageRequest } from './session';
import { NOT_IN_SNAPSHOT, SNAPSHOT_TABLES } from './snapshot';

const PROFILE = { locale: 'en' as const, timezone: 'Asia/Jerusalem', displayName: 'Me' };
const TODAY = new Intl.DateTimeFormat('en-CA', { timeZone: PROFILE.timezone }).format(new Date());
const ONBOARDING = {
  ageYears: 34,
  sex: 'female',
  heightCm: 165,
  weightKg: 63,
  experienceLevel: 'beginner',
  ability: { pushUpsMax: 10, pullUpsMax: 0, plankSeconds: 40, squat1rmKg: null, bench1rmKg: null, deadlift1rmKg: null },
  goal: 'general_fitness',
  trainingLocation: 'home',
  equipment: ['dumbbells'],
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
  weeklyWorkoutGoal: 3,
};

let runtime: DeviceRuntime;
const nodeBuffer = globalThis.Buffer;

async function call(method: string, url: string, body?: unknown) {
  const req: PageRequest = {
    method,
    url,
    headers: { accept: 'application/json', ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(method === 'GET' ? {} : { 'idempotency-key': `t-${randomUUID()}` }) },
    body: body === undefined ? null : JSON.stringify(body),
  };
  const res = await runtime.handle(req);
  const text = typeof res.body === 'string' ? res.body : '';
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

/** What the app shows, through the API (ids included: a restore keeps them). */
async function views() {
  const plans = (await call('GET', '/api/plans')).body.plans as { id: string }[];
  return {
    profile: (({ updatedAt: _u, ...rest }) => rest)((await call('GET', '/api/profile')).body.profile),
    me: (({ id: _id, email: _e, ...rest }) => rest)((await call('GET', '/api/auth/me')).body.user),
    plans: await Promise.all(plans.map(async (p) => (await call('GET', `/api/plans/${p.id}`)).body.plan)),
    sessions: (await call('GET', '/api/sessions')).body.sessions,
    day: (await call('GET', `/api/nutrition/day?date=${TODAY}`)).body,
    weights: (await call('GET', '/api/progress/body-weight')).body,
    foods: (await call('GET', '/api/foods/mine')).body,
    meals: (await call('GET', '/api/nutrition/saved-meals')).body,
    threads: (await call('GET', '/api/coach/threads')).body,
    gamification: (await call('GET', '/api/gamification')).body,
  };
}

beforeAll(async () => {
  globalThis.Buffer = DeviceBuffer as unknown as typeof Buffer;
  runtime = await bootDeviceRuntime(() => undefined, () => PROFILE);
});

afterAll(async () => {
  globalThis.Buffer = nodeBuffer;
  await db.close();
});

describe('device backup and restore', () => {
  let snapshot: DeviceSnapshot;
  let before: Awaited<ReturnType<typeof views>>;
  let eggId = '';

  it('takes a snapshot of everything the device account has', async () => {
    expect((await call('PATCH', '/api/settings', { displayName: 'Noa', theme: 'light' })).status).toBe(200);
    expect((await call('PUT', '/api/profile/onboarding', ONBOARDING)).status).toBe(200);
    const plan = (await call('POST', '/api/plans/generate', {})).body.plan;
    expect((await call('POST', `/api/plans/${plan.id}/activate`)).status).toBe(200);
    const session = (await call('POST', '/api/sessions', { planWorkoutId: plan.workouts[0].id })).body.session;
    for (const set of session.exercises[0].sets) {
      expect((await call('PATCH', `/api/sessions/${session.id}/sets/${set.id}`, { reps: 10, weightKg: 8, completed: true })).status).toBe(200);
    }
    expect((await call('POST', `/api/sessions/${session.id}/finish`, { perceivedExertion: 7 })).status).toBe(200);
    const egg = (await call('GET', '/api/foods/search?q=egg')).body.foods[0];
    eggId = egg.id;
    expect((await call('POST', '/api/nutrition/logs', { date: TODAY, mealType: 'breakfast', foodId: egg.id, grams: 100 })).status).toBe(201);
    expect((await call('POST', '/api/nutrition/logs/quick', { date: TODAY, mealType: 'snack', name: 'Apple', kcal: 95 })).status).toBe(201);
    const custom = (
      await call('POST', '/api/foods', { name: 'Grandma soup', category: 'prepared_dishes', per100g: { kcal: 60, protein: 3, carbs: 8, fat: 2 }, servingGrams: 300 })
    ).body.food;
    expect((await call('POST', '/api/nutrition/saved-meals', { name: 'Soup & egg', mealType: 'dinner', items: [{ foodId: custom.id, grams: 300 }, { foodId: egg.id, grams: 50 }] })).status).toBe(201);
    expect((await call('POST', '/api/progress/body-weight', { date: TODAY, weightKg: 62.4 })).status).toBeLessThan(300);
    const thread = (await call('POST', '/api/coach/threads', {})).body.thread;
    expect((await call('POST', `/api/coach/threads/${thread.id}/messages`, { content: 'What is progressive overload?' })).status).toBeLessThan(300);

    const res = await call('GET', DEVICE_SNAPSHOT_PATH);
    expect(res.status).toBe(200);
    snapshot = res.body;
    expect(snapshot).toMatchObject({ format: SNAPSHOT_FORMAT, version: 1, schema: DEVICE_MIGRATIONS.at(-1)!.name });
    expect(snapshot.user).toMatchObject({ display_name: 'Noa', theme: 'light', locale: 'en' });
    expect(snapshot.user).not.toHaveProperty('email');
    expect(snapshot.user).not.toHaveProperty('password_hash');
    expect(snapshot.tables.workout_sessions).toHaveLength(1);
    expect(snapshot.tables.food_log_entries).toHaveLength(2);
    expect(snapshot.tables.foods).toHaveLength(1);
    expect(snapshot.tables.coach_messages!.length).toBeGreaterThanOrEqual(2);
    expect(snapshot.sharedFoods.map((f) => f.id)).toEqual([egg.id]);
    expect(JSON.stringify(snapshot)).not.toMatch(/scrypt\$|fitai_session|csrf/);
    before = await views();
  });

  it('restores it in full on a new phone: a fresh device account, built-in foods with other ids', async () => {
    const oldUser = (await call('GET', '/api/auth/me')).body.user.id;
    expect((await call('DELETE', '/api/account', { confirm: 'DELETE' })).status).toBe(200);
    // A new install seeds the built-in foods with new ids.
    await db.exec('UPDATE foods SET id = gen_random_uuid() WHERE owner_user_id IS NULL');
    const fresh = (await call('GET', '/api/auth/me')).body.user;
    expect(fresh.id).not.toBe(oldUser);
    expect(fresh.onboardingCompleted).toBe(false);
    const newEggId = (await db.one<{ id: string }>('SELECT id FROM foods WHERE slug = $1', [snapshot.sharedFoods[0]!.slug])).id;
    expect(newEggId).not.toBe(eggId);

    const res = await call('POST', DEVICE_RESTORE_PATH, snapshot);
    expect(res.status).toBe(200);
    expect(res.body.restored).toEqual({ plans: 1, workouts: 1, foods: 2, weights: 1, coachThreads: 1 });
    expect((await call('GET', '/api/auth/me')).body.user.id).toBe(fresh.id); // same device account, still signed in

    const after = await views();
    const remap = (v: unknown) => JSON.parse(JSON.stringify(v).replaceAll(eggId, newEggId));
    expect(after).toEqual(remap(before));
    expect(after.me).toMatchObject({ displayName: 'Noa', theme: 'light', onboardingCompleted: true });

    // Restoring the same file again gives the same result (it replaces, never duplicates).
    expect((await call('POST', DEVICE_RESTORE_PATH, snapshot)).status).toBe(200);
    expect(await views()).toEqual(after);
  });

  it('refuses a snapshot from a newer app, a damaged one or invalid values, and changes nothing', async () => {
    const now = await views();
    const newer = await call('POST', DEVICE_RESTORE_PATH, { ...snapshot, schema: '9999_from_the_future.sql' });
    expect(newer).toMatchObject({ status: 400, body: { error: { code: 'unsupported_version' } } });
    const damaged = await call('POST', DEVICE_RESTORE_PATH, { ...snapshot, tables: { body_weight_entries: 'oops' } });
    expect(damaged).toMatchObject({ status: 400, body: { error: { code: 'not_a_snapshot' } } });
    expect(await call('POST', DEVICE_RESTORE_PATH, { format: 'something-else' })).toMatchObject({ status: 400, body: { error: { code: 'not_a_snapshot' } } });
    // The database refuses the value (weight CHECK): everything before it in the transaction is rolled back.
    const weights = snapshot.tables.body_weight_entries!.map((w) => ({ ...w, weight_kg: 5 }));
    const invalid = await call('POST', DEVICE_RESTORE_PATH, { ...snapshot, tables: { ...snapshot.tables, body_weight_entries: weights } });
    expect(invalid).toMatchObject({ status: 400, body: { error: { code: 'snapshot_invalid' } } });
    expect(await views()).toEqual(now);
  });

  it('covers every per-user table (in the snapshot, or left out with a reason)', async () => {
    const rows = await db.many<{ table_name: string }>(
      `SELECT DISTINCT table_name FROM information_schema.columns
        WHERE table_schema = 'public' AND column_name IN ('user_id', 'owner_user_id')`,
    );
    const covered = [...SNAPSHOT_TABLES.map((t) => t.table), ...Object.keys(NOT_IN_SNAPSHOT)].sort();
    expect(covered).toEqual(rows.map((r) => r.table_name).sort());
  });
});
