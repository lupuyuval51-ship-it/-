import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { addDays, todayInTimeZone } from '@shared/dates';
import { db } from '../src/db/pool';
import { formatContext, loadCoachData } from '../src/modules/coach/context';
import { noonUtc, seedPlan, seedSession, sets } from './helpers/progressSeed';
import { onboardedUser, startTestServer, type TestServer } from './helpers/server';

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});
afterAll(async () => {
  await server.close();
  await db.close();
});

const LOW = { energy: 'low', soreness: 'high', sleep: 'ok' } as const;
const FINE = { energy: 'normal', soreness: 'none', sleep: 'good' } as const;

async function planUser() {
  const c = await onboardedUser(server.baseUrl, {}, { timezone: 'UTC' });
  const { workoutIds } = await seedPlan(c.userId!, { workouts: [{ name: 'Push', focus: 'push', exercises: ['barbell_bench_press', 'push_up'] }] });
  await db.exec('UPDATE plan_exercises SET target_rpe = 8 WHERE user_id = $1', [c.userId]);
  return { c, workoutId: workoutIds[0]! };
}

describe('starting a workout with a readiness check-in', () => {
  it('without a check-in the session is exactly the plan', async () => {
    const { c, workoutId } = await planUser();
    const res = await c.post('/api/sessions', { planWorkoutId: workoutId });
    expect(res.status).toBe(201);
    expect(res.body.session.readiness).toBeNull();
    expect(res.body.session.exercises.map((e: { sets: unknown[] }) => e.sets.length)).toEqual([3, 3]);
    expect(res.body.session.exercises[0].targetRpe).toBe(8);
    expect(await db.many('SELECT 1 FROM readiness_checkins WHERE user_id = $1', [c.userId])).toHaveLength(0);
  });

  it('two negative signals make the session easier, and the plan itself is untouched', async () => {
    const { c, workoutId } = await planUser();
    const res = await c.post('/api/sessions', { planWorkoutId: workoutId, readiness: LOW });
    expect(res.status).toBe(201);
    const s = res.body.session;
    // 'high soreness' + 'low energy' = easier.
    expect(s.readiness).toEqual({ ...LOW, adjusted: true });
    expect(s.exercises.map((e: { sets: unknown[] }) => e.sets.length)).toEqual([2, 2]);
    expect(s.exercises[0].targetRpe).toBe(7);
    const plan = await db.many<{ sets: number; target_rpe: number }>('SELECT sets, target_rpe FROM plan_exercises WHERE workout_id = $1', [workoutId]);
    expect(plan.map((p) => [p.sets, Number(p.target_rpe)])).toEqual([[3, 8], [3, 8]]);
  });

  it('one negative signal keeps the plan but still remembers the check-in once per day', async () => {
    const { c, workoutId } = await planUser();
    const first = await c.post('/api/sessions', { planWorkoutId: workoutId, readiness: { energy: 'low', soreness: 'none', sleep: 'ok' } });
    expect(first.body.session.readiness.adjusted).toBe(false);
    expect(first.body.session.exercises[0].sets).toHaveLength(3);
    await c.post(`/api/sessions/${first.body.session.id}/finish`, {});
    const second = await c.post('/api/sessions', { planWorkoutId: workoutId, readiness: FINE });
    expect(second.body.session.readiness).toEqual({ ...FINE, adjusted: false });
    const rows = await db.many<{ checked_on: string; energy: string }>('SELECT energy, checked_on::text FROM readiness_checkins WHERE user_id = $1', [c.userId]);
    expect(rows).toEqual([{ energy: 'normal', checked_on: todayInTimeZone('UTC') }]);
  });

  it('never raises load: an easier day holds a due weight increase', async () => {
    const { c, workoutId } = await planUser();
    // Last time every set hit the top of the 8–12 range at RPE 8 → normally +2.5 kg.
    await seedSession(c.userId!, { endedAt: noonUtc(addDays(todayInTimeZone('UTC'), -3)), name: 'Push', sets: sets(3, { exerciseId: 'barbell_bench_press', reps: 12, weightKg: 60 }) });
    const normal = await c.post('/api/sessions', { planWorkoutId: workoutId });
    expect(normal.body.session.exercises[0].suggestion).toMatchObject({ action: 'increase_weight', targetWeightKg: 62.5 });
    await c.post(`/api/sessions/${normal.body.session.id}/abandon`, {});

    const easier = await c.post('/api/sessions', { planWorkoutId: workoutId, readiness: LOW });
    expect(easier.body.session.exercises[0].suggestion).toMatchObject({ action: 'maintain', targetWeightKg: 60, reasonCode: 'readiness_hold' });
  });

  it('never raises bodyweight reps: an easier day keeps last time\'s rep range and target', async () => {
    const c = await onboardedUser(server.baseUrl, {}, { timezone: 'UTC' });
    const { workoutIds } = await seedPlan(c.userId!, { workouts: [{ name: 'Core', focus: 'full_body', exercises: ['superman'] }] });
    const workoutId = workoutIds[0]!;
    // Last time every set hit the top of the plan's 8–12 range and superman has no harder variation → normally 10–14.
    await seedSession(c.userId!, { endedAt: noonUtc(addDays(todayInTimeZone('UTC'), -3)), name: 'Core', sets: sets(3, { exerciseId: 'superman', reps: 12 }) });
    const normal = await c.post('/api/sessions', { planWorkoutId: workoutId });
    const n = normal.body.session.exercises[0];
    expect(n.suggestion).toMatchObject({ action: 'increase_reps', repMin: 10, repMax: 14, reasonCode: 'raise_rep_target' });
    expect(n.sets[0].targetReps).toBe(14);
    await c.post(`/api/sessions/${normal.body.session.id}/abandon`, {});

    const easier = await c.post('/api/sessions', { planWorkoutId: workoutId, readiness: LOW });
    const e = easier.body.session.exercises[0];
    expect(e.suggestion).toMatchObject({ action: 'maintain', repMin: 8, repMax: 12, reasonCode: 'readiness_hold' });
    expect([e.repMin, e.repMax]).toEqual([8, 12]);
    expect(e.sets.map((s: { targetReps: number | null }) => s.targetReps)).toEqual([12, 12]);
  });

  it('rejects an invalid or partial check-in', async () => {
    const { c, workoutId } = await planUser();
    expect((await c.post('/api/sessions', { planWorkoutId: workoutId, readiness: { energy: 'low' } })).status).toBe(400);
    expect((await c.post('/api/sessions', { planWorkoutId: workoutId, readiness: { ...LOW, energy: 'extreme' } })).status).toBe(400);
  });
});

describe('POST /api/sessions/:id/readiness/revert', () => {
  it('restores the full plan while the workout is untouched', async () => {
    const { c, workoutId } = await planUser();
    const started = await c.post('/api/sessions', { planWorkoutId: workoutId, readiness: LOW });
    const id = started.body.session.id;
    const res = await c.post(`/api/sessions/${id}/readiness/revert`, {});
    expect(res.status).toBe(200);
    expect(res.body.session.readiness).toMatchObject({ ...LOW, adjusted: false });
    expect(res.body.session.exercises.map((e: { sets: unknown[] }) => e.sets.length)).toEqual([3, 3]);
    expect(res.body.session.exercises[0].targetRpe).toBe(8);
    // Nothing left to revert.
    expect((await c.post(`/api/sessions/${id}/readiness/revert`, {})).status).toBe(409);
  });

  it('refuses once a set was logged, and for other users', async () => {
    const { c, workoutId } = await planUser();
    const started = await c.post('/api/sessions', { planWorkoutId: workoutId, readiness: LOW });
    const s = started.body.session;
    await c.patch(`/api/sessions/${s.id}/sets/${s.exercises[0].sets[0].id}`, { reps: 8, weightKg: 60, completed: true });
    const refused = await c.post(`/api/sessions/${s.id}/readiness/revert`, {});
    expect(refused.status).toBe(409);
    expect(refused.body.error.code).toBe('readiness_revert_unavailable');

    const other = await onboardedUser(server.baseUrl);
    expect((await other.post(`/api/sessions/${s.id}/readiness/revert`, {})).status).toBe(404);
  });
});

describe('account export', () => {
  it('includes the check-ins', async () => {
    const { c, workoutId } = await planUser();
    await c.post('/api/sessions', { planWorkoutId: workoutId, readiness: LOW });
    const data = (await c.get('/api/account/export')).body;
    expect(data.readinessCheckins).toEqual([expect.objectContaining({ checkedOn: todayInTimeZone('UTC'), energy: 'low', soreness: 'high', sleep: 'ok' })]);
  });
});

describe('coach context', () => {
  it('mentions the latest check-in only when there is one', async () => {
    const { c, workoutId } = await planUser();
    expect(formatContext(await loadCoachData(db, c.userId!), 'en')).not.toContain('pre-workout check-in');
    await c.post('/api/sessions', { planWorkoutId: workoutId, readiness: LOW });
    const text = formatContext(await loadCoachData(db, c.userId!), 'en');
    expect(text).toContain(`Latest pre-workout check-in (${todayInTimeZone('UTC')}): energy low, soreness high, sleep ok`);
  });
});
