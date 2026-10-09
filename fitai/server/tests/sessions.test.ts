import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { SessionSummaryDTO, WorkoutSessionDTO } from '@shared/types';
import { db } from '../src/db/pool';
import { onboardedUser, startTestServer, type TestClient, type TestServer } from './helpers/server';

let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});
afterAll(async () => {
  await server.close();
  await db.close();
});

interface PlanExerciseSeed {
  exerciseId: string;
  sets: number;
  repMin?: number | null;
  repMax?: number | null;
  targetSeconds?: number | null;
  restSeconds?: number;
  targetWeightKg?: number | null;
  notes?: string;
}

async function seedPlan(userId: string, days: { name: string; exercises: PlanExerciseSeed[] }[]) {
  const plan = await db.one<{ id: string }>(
    `INSERT INTO workout_plans (user_id, name, status, source) VALUES ($1, 'Test plan', 'draft', 'custom') RETURNING id`,
    [userId],
  );
  const workoutIds: string[] = [];
  for (const [i, day] of days.entries()) {
    const w = await db.one<{ id: string }>('INSERT INTO plan_workouts (plan_id, user_id, position, name) VALUES ($1, $2, $3, $4) RETURNING id', [
      plan.id,
      userId,
      i,
      day.name,
    ]);
    workoutIds.push(w.id);
    for (const [j, e] of day.exercises.entries()) {
      await db.exec(
        `INSERT INTO plan_exercises (workout_id, user_id, exercise_id, position, sets, rep_min, rep_max, target_seconds, rest_seconds, target_weight_kg, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          w.id,
          userId,
          e.exerciseId,
          j,
          e.sets,
          e.repMin === undefined ? 8 : e.repMin,
          e.repMax === undefined ? 12 : e.repMax,
          e.targetSeconds ?? null,
          e.restSeconds ?? 90,
          e.targetWeightKg ?? null,
          e.notes ?? '',
        ],
      );
    }
  }
  return { planId: plan.id, workoutIds };
}

const PUSH_DAY: PlanExerciseSeed[] = [
  { exerciseId: 'barbell_bench_press', sets: 3, repMin: 8, repMax: 10, restSeconds: 120, targetWeightKg: 60, notes: 'Pause at the bottom' },
  { exerciseId: 'push_up', sets: 2, repMin: 10, repMax: 15, restSeconds: 60 },
  { exerciseId: 'plank', sets: 2, repMin: null, repMax: null, targetSeconds: 30, restSeconds: 45 },
];

async function startPlanSession(client: TestClient, planWorkoutId: string): Promise<WorkoutSessionDTO> {
  const res = await client.post('/api/sessions', { planWorkoutId });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body.session;
}

async function startEmpty(client: TestClient, name?: string): Promise<WorkoutSessionDTO> {
  const res = await client.post('/api/sessions', { empty: true, ...(name ? { name } : {}) });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body.session;
}

async function addExercise(client: TestClient, sessionId: string, exerciseId: string, sets = 3): Promise<WorkoutSessionDTO> {
  const res = await client.post(`/api/sessions/${sessionId}/exercises`, { exerciseId, sets });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body.session;
}

async function completeSet(client: TestClient, sessionId: string, setId: string, values: { reps?: number; weightKg?: number | null; durationSeconds?: number }) {
  const res = await client.patch(`/api/sessions/${sessionId}/sets/${setId}`, { ...values, completed: true });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return res.body.set;
}

async function finish(client: TestClient, sessionId: string, body: Record<string, unknown> = {}): Promise<SessionSummaryDTO> {
  const res = await client.post(`/api/sessions/${sessionId}/finish`, body);
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return res.body.summary;
}

/** Runs a complete single-exercise workout and returns its summary. */
async function quickWorkout(client: TestClient, exerciseId: string, sets: { reps?: number; weightKg?: number | null; durationSeconds?: number }[]) {
  const s = await startEmpty(client);
  const withEx = await addExercise(client, s.id, exerciseId, sets.length);
  const ex = withEx.exercises.at(-1)!;
  for (const [i, v] of sets.entries()) await completeSet(client, s.id, ex.sets[i]!.id, v);
  return finish(client, s.id);
}

describe('starting a session', () => {
  it('snapshots the plan day into exercises and pre-created sets with targets', async () => {
    const user = await onboardedUser(server.baseUrl);
    const { workoutIds, planId } = await seedPlan(user.userId!, [{ name: 'Push A', exercises: PUSH_DAY }]);
    const session = await startPlanSession(user, workoutIds[0]!);
    expect(session).toMatchObject({ name: 'Push A', status: 'in_progress', planId, planWorkoutId: workoutIds[0], pausedSeconds: 0, currentExerciseIndex: 0, restTimer: null });
    expect(Date.parse(session.serverTime)).not.toBeNaN();
    expect(session.exercises.map((e) => e.exerciseId)).toEqual(['barbell_bench_press', 'push_up', 'plank']);

    const bench = session.exercises[0]!;
    expect(bench).toMatchObject({ repMin: 8, repMax: 10, restSeconds: 120, targetWeightKg: 60, notes: 'Pause at the bottom', previous: null, position: 0 });
    expect(bench.exercise.trackingType).toBe('weight_reps');
    expect(bench.suggestion).toMatchObject({ action: 'first_time', reasonCode: 'no_history' });
    expect(bench.sets.map((s) => [s.setNumber, s.targetReps, s.targetWeightKg, s.completed])).toEqual([
      [1, 10, 60, false],
      [2, 10, 60, false],
      [3, 10, 60, false],
    ]);
    const plank = session.exercises[2]!;
    expect(plank).toMatchObject({ targetSeconds: 30, repMin: null, repMax: null });
    expect(plank.sets.map((s) => [s.targetSeconds, s.targetReps])).toEqual([
      [30, null],
      [30, null],
    ]);

    const active = await user.get('/api/sessions/active');
    expect(active.status).toBe(200);
    expect(active.body.session.id).toBe(session.id);
    expect(active.body.session.exercises).toHaveLength(3);
  });

  it('allows only one open session (409 with the active id)', async () => {
    const user = await onboardedUser(server.baseUrl);
    const { workoutIds } = await seedPlan(user.userId!, [{ name: 'Day', exercises: PUSH_DAY }]);
    const first = await startPlanSession(user, workoutIds[0]!);
    for (const body of [{ planWorkoutId: workoutIds[0] }, { empty: true }]) {
      const again = await user.post('/api/sessions', body);
      expect(again.status).toBe(409);
      expect(again.body.error.code).toBe('session_already_active');
      expect(again.body.error.details).toEqual({ sessionId: first.id });
    }
    // Concurrent starts still produce exactly one session.
    const other = await onboardedUser(server.baseUrl);
    const results = await Promise.all([other.post('/api/sessions', { empty: true }), other.post('/api/sessions', { empty: true })]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
  });

  it('starts an empty session with a given or default name', async () => {
    const user = await onboardedUser(server.baseUrl);
    const s = await startEmpty(user, '  Evening pump  ');
    expect(s).toMatchObject({ name: 'Evening pump', exercises: [], planId: null, planWorkoutId: null });
    await user.post(`/api/sessions/${s.id}/abandon`);
    const unnamed = await startEmpty(user);
    expect(unnamed.name).toBe('Quick workout');
  });

  it('rejects invalid input and other users’ plan days', async () => {
    const owner = await onboardedUser(server.baseUrl);
    const intruder = await onboardedUser(server.baseUrl);
    const { workoutIds } = await seedPlan(owner.userId!, [{ name: 'Mine', exercises: PUSH_DAY }]);
    expect((await intruder.post('/api/sessions', { planWorkoutId: workoutIds[0] })).status).toBe(404);
    expect((await intruder.post('/api/sessions', { planWorkoutId: crypto.randomUUID() })).body.error.code).toBe('plan_workout_not_found');
    for (const body of [{}, { planWorkoutId: 'nope' }, { empty: false }, { empty: true, name: 'x'.repeat(300) }]) {
      const res = await intruder.post('/api/sessions', body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(res.body.error.code).toBe('validation_error');
    }
    expect((await intruder.get('/api/sessions/active')).body.session).toBeNull();
  });
});

describe('editing a live session', () => {
  it('persists set values and completion, keeping untouched fields', async () => {
    const user = await onboardedUser(server.baseUrl);
    const s = await addExercise(user, (await startEmpty(user)).id, 'barbell_bench_press', 2);
    const [set1] = s.exercises[0]!.sets;
    const updated = await user.patch(`/api/sessions/${s.id}/sets/${set1!.id}`, { weightKg: 62.5, reps: 8 });
    expect(updated.status).toBe(200);
    expect(updated.body.set).toMatchObject({ weightKg: 62.5, reps: 8, completed: false, completedAt: null });
    const done = await user.patch(`/api/sessions/${s.id}/sets/${set1!.id}`, { completed: true, rpe: 8.5 });
    expect(done.body.set).toMatchObject({ weightKg: 62.5, reps: 8, rpe: 8.5, completed: true });
    expect(Date.parse(done.body.set.completedAt)).not.toBeNaN();
    // Completing again keeps the original timestamp; clearing a value with null works.
    const again = await user.patch(`/api/sessions/${s.id}/sets/${set1!.id}`, { completed: true, rpe: null });
    expect(again.body.set.completedAt).toBe(done.body.set.completedAt);
    expect(again.body.set.rpe).toBeNull();

    const fresh = (await user.get(`/api/sessions/${s.id}`)).body.session as WorkoutSessionDTO;
    expect(fresh.exercises[0]!.sets[0]).toMatchObject({ weightKg: 62.5, reps: 8, completed: true });
    const undone = await user.patch(`/api/sessions/${s.id}/sets/${set1!.id}`, { completed: false });
    expect(undone.body.set).toMatchObject({ completed: false, completedAt: null, reps: 8 });

    for (const bad of [{ reps: -1 }, { weightKg: 5000 }, { rpe: 11 }, { durationSeconds: 1.5 }, { completed: 'yes' }]) {
      const res = await user.patch(`/api/sessions/${s.id}/sets/${set1!.id}`, bad);
      expect(res.status, JSON.stringify(bad)).toBe(400);
    }
    expect((await user.patch(`/api/sessions/${s.id}/sets/${crypto.randomUUID()}`, { reps: 5 })).status).toBe(404);
  });

  it('adds sets copying the previous set and renumbers after deleting', async () => {
    const user = await onboardedUser(server.baseUrl);
    let s = await addExercise(user, (await startEmpty(user)).id, 'barbell_back_squat', 2);
    const ex = s.exercises[0]!;
    await user.patch(`/api/sessions/${s.id}/sets/${ex.sets[1]!.id}`, { reps: 5, weightKg: 100 });
    const added = await user.post(`/api/sessions/${s.id}/exercises/${ex.id}/sets`);
    expect(added.status).toBe(201);
    s = added.body.session;
    const sets = s.exercises[0]!.sets;
    expect(sets).toHaveLength(3);
    expect(sets[2]).toMatchObject({ setNumber: 3, reps: 5, weightKg: 100, completed: false, targetReps: sets[1]!.targetReps });

    const del = await user.delete(`/api/sessions/${s.id}/sets/${sets[0]!.id}`);
    expect(del.status).toBe(200);
    const after = (del.body.session as WorkoutSessionDTO).exercises[0]!.sets;
    expect(after.map((x) => x.setNumber)).toEqual([1, 2]);
    expect(after.map((x) => x.id)).toEqual([sets[1]!.id, sets[2]!.id]);
    expect((await user.delete(`/api/sessions/${s.id}/sets/${sets[0]!.id}`)).status).toBe(404);
  });

  it('adds exercises with sensible defaults and removes them (clamping the current index)', async () => {
    const user = await onboardedUser(server.baseUrl);
    const empty = await startEmpty(user);
    let s = await addExercise(user, empty.id, 'barbell_back_squat', 4);
    s = await addExercise(user, empty.id, 'dumbbell_curl', 2);
    s = await addExercise(user, empty.id, 'plank', 2);
    expect(s.exercises.map((e) => [e.exerciseId, e.position, e.sets.length])).toEqual([
      ['barbell_back_squat', 0, 4],
      ['dumbbell_curl', 1, 2],
      ['plank', 2, 2],
    ]);
    expect(s.exercises[0]).toMatchObject({ repMin: 6, repMax: 10, restSeconds: 120 });
    expect(s.exercises[1]).toMatchObject({ repMin: 10, repMax: 15, restSeconds: 75 });
    expect(s.exercises[2]).toMatchObject({ targetSeconds: 30, restSeconds: 45 });
    expect(s.exercises[0]!.suggestion?.action).toBe('first_time');

    expect((await user.patch(`/api/sessions/${s.id}/state`, { action: 'update', currentExerciseIndex: 2 })).body.session.currentExerciseIndex).toBe(2);
    const removed = await user.delete(`/api/sessions/${s.id}/exercises/${s.exercises[0]!.id}`);
    expect(removed.status).toBe(200);
    const r = removed.body.session as WorkoutSessionDTO;
    expect(r.exercises.map((e) => [e.exerciseId, e.position])).toEqual([
      ['dumbbell_curl', 0],
      ['plank', 1],
    ]);
    expect(r.currentExerciseIndex).toBe(1); // still pointing at the plank

    const patched = await user.patch(`/api/sessions/${s.id}/exercises/${r.exercises[0]!.id}`, { restSeconds: 150, notes: 'Slow eccentric <b>' });
    expect(patched.status).toBe(200);
    expect(patched.body.session.exercises[0]).toMatchObject({ restSeconds: 150, notes: 'Slow eccentric b' });
    expect((await user.patch(`/api/sessions/${s.id}/exercises/${r.exercises[0]!.id}`, {})).status).toBe(400);
    expect((await user.patch(`/api/sessions/${s.id}/exercises/${r.exercises[0]!.id}`, { restSeconds: 601 })).status).toBe(400);

    expect((await user.post(`/api/sessions/${s.id}/exercises`, { exerciseId: 'no_such_exercise' })).status).toBe(404);
    expect((await user.post(`/api/sessions/${s.id}/exercises`, { exerciseId: 'Bad Id' })).status).toBe(400);
    expect((await user.post(`/api/sessions/${s.id}/exercises`, { exerciseId: 'plank', sets: 0 })).status).toBe(400);
  });

  it('pauses and resumes, accumulating paused time', async () => {
    const user = await onboardedUser(server.baseUrl);
    const s = await startEmpty(user);
    const paused = await user.patch(`/api/sessions/${s.id}/state`, { action: 'pause' });
    expect(paused.body.session).toMatchObject({ status: 'paused' });
    expect(paused.body.session.pausedAt).not.toBeNull();
    // Pausing twice is a no-op.
    const twice = await user.patch(`/api/sessions/${s.id}/state`, { action: 'pause' });
    expect(twice.body.session.pausedAt).toBe(paused.body.session.pausedAt);
    // Simulate a 90 s pause.
    await db.exec(`UPDATE workout_sessions SET paused_at = now() - interval '90 seconds' WHERE id = $1`, [s.id]);
    const resumed = await user.patch(`/api/sessions/${s.id}/state`, { action: 'resume' });
    expect(resumed.body.session).toMatchObject({ status: 'in_progress', pausedAt: null });
    expect(resumed.body.session.pausedSeconds).toBeGreaterThanOrEqual(90);
    expect(resumed.body.session.pausedSeconds).toBeLessThan(95);
    // A second pause/resume cycle adds to the total.
    await user.patch(`/api/sessions/${s.id}/state`, { action: 'pause' });
    await db.exec(`UPDATE workout_sessions SET paused_at = now() - interval '30 seconds' WHERE id = $1`, [s.id]);
    const again = await user.patch(`/api/sessions/${s.id}/state`, { action: 'resume' });
    expect(again.body.session.pausedSeconds).toBeGreaterThanOrEqual(120);
    expect((await user.patch(`/api/sessions/${s.id}/state`, { action: 'resume' })).body.session.pausedSeconds).toBe(again.body.session.pausedSeconds);
  });

  it('stores and validates the rest timer state', async () => {
    const user = await onboardedUser(server.baseUrl);
    const s = await startEmpty(user);
    const running = { durationSeconds: 90, endsAt: new Date(Date.now() + 90_000).toISOString(), remainingSeconds: null, exerciseId: 'abc' };
    const ok = await user.patch(`/api/sessions/${s.id}/state`, { action: 'update', restTimer: running });
    expect(ok.status).toBe(200);
    expect(ok.body.session.restTimer).toEqual(running);
    expect((await user.get('/api/sessions/active')).body.session.restTimer).toEqual(running);
    const paused = { ...running, endsAt: null, remainingSeconds: 42 };
    expect((await user.patch(`/api/sessions/${s.id}/state`, { action: 'update', restTimer: paused })).body.session.restTimer).toEqual(paused);

    const invalid = [
      { ...running, remainingSeconds: 30 }, // both running and paused
      { ...running, endsAt: new Date(Date.now() + 3_600_000).toISOString() }, // an hour away
    ];
    for (const restTimer of invalid) {
      const res = await user.patch(`/api/sessions/${s.id}/state`, { action: 'update', restTimer });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('invalid_timer_state');
    }
    for (const restTimer of [{ ...running, durationSeconds: 700 }, { ...running, endsAt: 'soon' }, { durationSeconds: 60 }]) {
      const res = await user.patch(`/api/sessions/${s.id}/state`, { action: 'update', restTimer });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('validation_error');
    }
    expect((await user.patch(`/api/sessions/${s.id}/state`, { action: 'stop' })).status).toBe(400);
    expect((await user.patch(`/api/sessions/${s.id}/state`, { action: 'update', currentExerciseIndex: -1 })).status).toBe(400);
    const cleared = await user.patch(`/api/sessions/${s.id}/state`, { action: 'update', restTimer: null, currentExerciseIndex: 5 });
    expect(cleared.body.session).toMatchObject({ restTimer: null, currentExerciseIndex: 0 });
  });
});

describe('finishing a session', () => {
  it('computes duration (excluding pauses), totals from completed sets and advances the plan', async () => {
    const user = await onboardedUser(server.baseUrl);
    const { planId, workoutIds } = await seedPlan(user.userId!, [
      { name: 'Day A', exercises: PUSH_DAY },
      { name: 'Day B', exercises: [{ exerciseId: 'barbell_back_squat', sets: 2 }] },
    ]);
    const s = await startPlanSession(user, workoutIds[0]!);
    const [bench, pushUp, plank] = s.exercises;
    await completeSet(user, s.id, bench!.sets[0]!.id, { reps: 10, weightKg: 60 });
    await completeSet(user, s.id, bench!.sets[1]!.id, { reps: 8, weightKg: 62.5 });
    // Values entered but not completed do not count.
    await user.patch(`/api/sessions/${s.id}/sets/${bench!.sets[2]!.id}`, { reps: 20, weightKg: 100 });
    await completeSet(user, s.id, pushUp!.sets[0]!.id, { reps: 15 });
    await completeSet(user, s.id, plank!.sets[0]!.id, { durationSeconds: 40 });
    // One hour ago, 10 minutes of it paused so far, and currently paused for another 5 minutes.
    await db.exec(
      `UPDATE workout_sessions SET started_at = now() - interval '1 hour', paused_seconds = 600, status = 'paused', paused_at = now() - interval '5 minutes' WHERE id = $1`,
      [s.id],
    );
    const summary = await finish(user, s.id, { notes: 'Felt strong', perceivedExertion: 8 });
    expect(summary.session.durationSeconds).toBeGreaterThanOrEqual(45 * 60 - 2);
    expect(summary.session.durationSeconds).toBeLessThanOrEqual(45 * 60 + 2);
    expect(summary.totals).toEqual({ exercises: 3, sets: 4, reps: 33, volumeKg: 1100 });
    expect(summary.exercises.map((e) => [e.exerciseId, e.trackingType, e.completedSets])).toEqual([
      ['barbell_bench_press', 'weight_reps', 2],
      ['push_up', 'reps', 1],
      ['plank', 'time', 1],
    ]);
    expect(summary.exercises[2]!.bestSet).toEqual({ reps: null, weightKg: null, durationSeconds: 40 });
    // Best set by estimated 1RM: 10 × 60 (80 kg) beats 8 × 62.5 (79.2 kg).
    expect(summary.exercises[0]!.bestSet).toEqual({ reps: 10, weightKg: 60, durationSeconds: null });
    expect(summary.personalRecords).toEqual([]); // first performances are baselines
    expect(summary.rewards).toEqual({ xpAwarded: 0, newAchievements: [], levelUp: null, notes: [] });
    expect(summary.previous).toBeNull();

    const row = await db.one<{ status: string; paused_at: Date | null; total_sets: number; total_reps: number; total_volume_kg: number; notes: string; perceived_exertion: number; rest_timer: unknown }>(
      'SELECT status, paused_at, total_sets, total_reps, total_volume_kg, notes, perceived_exertion, rest_timer FROM workout_sessions WHERE id = $1',
      [s.id],
    );
    expect(row).toMatchObject({ status: 'completed', paused_at: null, total_sets: 4, total_reps: 33, total_volume_kg: 1100, notes: 'Felt strong', perceived_exertion: 8, rest_timer: null });
    const plan = await db.one<{ next_workout_index: number }>('SELECT next_workout_index FROM workout_plans WHERE id = $1', [planId]);
    expect(plan.next_workout_index).toBe(1);

    // Idempotent: finishing again returns the stored summary.
    const again = await user.post(`/api/sessions/${s.id}/finish`, {});
    expect(again.status).toBe(200);
    expect(again.body.summary).toEqual(summary);
    // The session is closed for edits and no longer active.
    expect((await user.patch(`/api/sessions/${s.id}/sets/${bench!.sets[2]!.id}`, { completed: true })).body.error.code).toBe('session_not_active');
    expect((await user.patch(`/api/sessions/${s.id}/state`, { action: 'pause' })).status).toBe(409);
    expect((await user.post(`/api/sessions/${s.id}/exercises`, { exerciseId: 'plank' })).status).toBe(409);
    expect((await user.get('/api/sessions/active')).body.session).toBeNull();

    // Finishing the last day wraps the plan around to day 1; the summary compares with the previous run.
    const b = await startPlanSession(user, workoutIds[1]!);
    await finish(user, b.id);
    expect((await db.one<{ next_workout_index: number }>('SELECT next_workout_index FROM workout_plans WHERE id = $1', [planId])).next_workout_index).toBe(0);
    const a2 = await startPlanSession(user, workoutIds[0]!);
    const summary2 = await finish(user, a2.id);
    expect(summary2.previous).toMatchObject({ sessionId: s.id, volumeKg: 1100 });
  });

  it('allows finishing with zero completed sets and is safe to retry with the same idempotency key', async () => {
    const user = await onboardedUser(server.baseUrl);
    const s = await addExercise(user, (await startEmpty(user)).id, 'push_up', 2);
    const headers = { 'idempotency-key': `finish-${crypto.randomUUID()}` };
    const first = await user.post(`/api/sessions/${s.id}/finish`, {}, { headers });
    const second = await user.post(`/api/sessions/${s.id}/finish`, {}, { headers });
    expect(first.status).toBe(200);
    expect(second.headers.get('idempotent-replayed')).toBe('true');
    expect(second.body).toEqual(first.body);
    expect(first.body.summary.totals).toEqual({ exercises: 0, sets: 0, reps: 0, volumeKg: 0 });
    expect(first.body.summary.exercises[0]).toMatchObject({ completedSets: 0, bestSet: null });
    expect((await user.post(`/api/sessions/${s.id}/finish`, { perceivedExertion: 11 })).status).toBe(400);
  });

  it('serializes concurrent finishes: one result, records stored once', async () => {
    const user = await onboardedUser(server.baseUrl);
    await quickWorkout(user, 'barbell_bench_press', [{ reps: 5, weightKg: 80 }]);
    const s = await addExercise(user, (await startEmpty(user)).id, 'barbell_bench_press', 1);
    await completeSet(user, s.id, s.exercises[0]!.sets[0]!.id, { reps: 5, weightKg: 85 });
    const [a, b] = await Promise.all([user.post(`/api/sessions/${s.id}/finish`, {}), user.post(`/api/sessions/${s.id}/finish`, {})]);
    expect([a.status, b.status]).toEqual([200, 200]);
    expect(a.body.summary).toEqual(b.body.summary);
    const types = (a.body.summary as SessionSummaryDTO).personalRecords.map((r) => r.recordType).sort();
    expect(types).toEqual(['est_1rm', 'max_volume', 'max_weight']);
    const stored = await db.many('SELECT id FROM personal_records WHERE session_id = $1', [s.id]);
    expect(stored).toHaveLength(3);
  });

  it('records personal records only when beating previous sessions', async () => {
    const user = await onboardedUser(server.baseUrl);
    const baseline = await quickWorkout(user, 'barbell_bench_press', [
      { reps: 8, weightKg: 60 },
      { reps: 8, weightKg: 60 },
    ]);
    expect(baseline.personalRecords).toEqual([]);

    // Heavier but fewer reps: weight and estimated 1RM improve, best set volume (390 < 480) does not.
    const heavier = await quickWorkout(user, 'barbell_bench_press', [
      { reps: 8, weightKg: 60 },
      { reps: 6, weightKg: 65 },
    ]);
    const byType = Object.fromEntries(heavier.personalRecords.map((r) => [r.recordType, r]));
    expect(Object.keys(byType).sort()).toEqual(['est_1rm', 'max_weight']);
    expect(byType.max_weight).toMatchObject({ value: 65, previousValue: 60, weightKg: 65, reps: 6, exerciseId: 'barbell_bench_press', sessionId: heavier.session.id });
    expect(byType.max_weight!.exerciseName.en).toBe('Barbell Bench Press');
    expect(byType.est_1rm).toMatchObject({ value: 78, previousValue: 76 }); // 65×(1+6/30) vs 60×(1+8/30)

    const moreVolume = await quickWorkout(user, 'barbell_bench_press', [{ reps: 9, weightKg: 60 }]);
    expect(moreVolume.personalRecords.map((r) => [r.recordType, r.value, r.previousValue])).toEqual([['max_volume', 540, 480]]);

    const same = await quickWorkout(user, 'barbell_bench_press', [{ reps: 6, weightKg: 65 }]);
    expect(same.personalRecords).toEqual([]);
  });

  it('detects bodyweight rep and duration records and ignores equal performances', async () => {
    const user = await onboardedUser(server.baseUrl);
    await quickWorkout(user, 'push_up', [{ reps: 12 }]);
    const better = await quickWorkout(user, 'push_up', [{ reps: 15 }, { reps: 10 }]);
    expect(better.personalRecords.map((r) => [r.recordType, r.value, r.previousValue])).toEqual([['max_reps', 15, 12]]);
    const equal = await quickWorkout(user, 'push_up', [{ reps: 15 }]);
    expect(equal.personalRecords).toEqual([]);

    await quickWorkout(user, 'plank', [{ durationSeconds: 45 }]);
    const longer = await quickWorkout(user, 'plank', [{ durationSeconds: 60 }]);
    expect(longer.personalRecords.map((r) => [r.recordType, r.value, r.previousValue, r.durationSeconds])).toEqual([['max_duration', 60, 45, 60]]);
    const stored = await db.many('SELECT record_type FROM personal_records WHERE user_id = $1', [user.userId]);
    expect(stored).toHaveLength(2);
  });

  it('includes previous performance and applies progression when the next session starts', async () => {
    const user = await onboardedUser(server.baseUrl);
    const { workoutIds } = await seedPlan(user.userId!, [
      { name: 'Bench day', exercises: [{ exerciseId: 'barbell_bench_press', sets: 2, repMin: 8, repMax: 10, targetWeightKg: 50 }] },
    ]);
    const first = await startPlanSession(user, workoutIds[0]!);
    const sets = first.exercises[0]!.sets;
    await completeSet(user, first.id, sets[0]!.id, { reps: 10, weightKg: 60 });
    await completeSet(user, first.id, sets[1]!.id, { reps: 10, weightKg: 60 });
    await finish(user, first.id);

    const next = await startPlanSession(user, workoutIds[0]!);
    const bench = next.exercises[0]!;
    expect(bench.previous).toMatchObject({ sessionId: first.id });
    expect(bench.previous!.sets).toEqual([
      { setNumber: 1, reps: 10, weightKg: 60, durationSeconds: null },
      { setNumber: 2, reps: 10, weightKg: 60, durationSeconds: null },
    ]);
    expect(bench.previous!.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(bench.suggestion).toMatchObject({ action: 'increase_weight', targetWeightKg: 62.5, reasonCode: 'hit_top_of_range' });
    expect(bench.targetWeightKg).toBe(62.5);
    expect(bench.sets.map((s) => [s.targetWeightKg, s.targetReps])).toEqual([
      [62.5, 8],
      [62.5, 8],
    ]);
  });
});

describe('abandon, history, summary and delete', () => {
  it('excludes abandoned sessions from history and lets the user start again', async () => {
    const user = await onboardedUser(server.baseUrl);
    const s = await addExercise(user, (await startEmpty(user)).id, 'push_up', 1);
    await completeSet(user, s.id, s.exercises[0]!.sets[0]!.id, { reps: 50 });
    await user.patch(`/api/sessions/${s.id}/state`, { action: 'pause' });
    const res = await user.post(`/api/sessions/${s.id}/abandon`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect((await user.post(`/api/sessions/${s.id}/abandon`)).status).toBe(200);
    expect((await user.get(`/api/sessions/${s.id}`)).body.session).toMatchObject({ status: 'abandoned', pausedAt: null });
    expect((await user.post(`/api/sessions/${s.id}/finish`)).body.error.code).toBe('session_not_active');
    expect((await user.get('/api/sessions')).body.sessions).toEqual([]);
    const abandoned = await user.get('/api/sessions?status=abandoned');
    expect(abandoned.body.sessions.map((x: { id: string }) => x.id)).toEqual([s.id]);
    expect(abandoned.body.sessions[0]).toMatchObject({ totalSets: 1, totalVolumeKg: 0 });
    // Abandoned performances never become baselines or records.
    const next = await quickWorkout(user, 'push_up', [{ reps: 10 }]);
    expect(next.personalRecords).toEqual([]);
    const better = await quickWorkout(user, 'push_up', [{ reps: 20 }]);
    expect(better.personalRecords.map((r) => [r.recordType, r.value, r.previousValue])).toEqual([['max_reps', 20, 10]]);
    const completed = await quickWorkout(user, 'barbell_curl', [{ reps: 10, weightKg: 30 }]);
    expect((await user.post(`/api/sessions/${completed.session.id}/abandon`)).status).toBe(409);
  });

  it('paginates history newest first with a cursor', async () => {
    const user = await onboardedUser(server.baseUrl);
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const summary = await quickWorkout(user, 'dumbbell_curl', [{ reps: 10, weightKg: 10 + i * 2 }]);
      ids.push(summary.session.id);
      await db.exec(`UPDATE workout_sessions SET started_at = now() - make_interval(days => $2), ended_at = now() - make_interval(days => $2) + interval '40 minutes' WHERE id = $1`, [
        summary.session.id,
        10 - i,
      ]);
    }
    const page1 = await user.get('/api/sessions?limit=2');
    expect(page1.status).toBe(200);
    expect(page1.body.sessions.map((s: { id: string }) => s.id)).toEqual([ids[2], ids[1]]);
    expect(page1.body.nextCursor).toEqual(expect.any(String));
    expect(page1.body.sessions[0]).toMatchObject({ name: 'Quick workout', status: 'completed', totalSets: 1, totalVolumeKg: 140, exerciseCount: 1, prCount: 3 });
    const page2 = await user.get(`/api/sessions?limit=2&before=${encodeURIComponent(page1.body.nextCursor)}`);
    expect(page2.body.sessions.map((s: { id: string }) => s.id)).toEqual([ids[0]]);
    expect(page2.body.nextCursor).toBeNull();
    for (const q of ['limit=0', 'limit=51', 'before=yesterday', 'status=done']) expect((await user.get(`/api/sessions?${q}`)).status).toBe(400);
  });

  it('returns summaries only for completed sessions', async () => {
    const user = await onboardedUser(server.baseUrl);
    const done = await quickWorkout(user, 'plank', [{ durationSeconds: 30 }]);
    const summary = await user.get(`/api/sessions/${done.session.id}/summary`);
    expect(summary.status).toBe(200);
    expect(summary.body.summary).toEqual(done);
    const open = await startEmpty(user);
    const res = await user.get(`/api/sessions/${open.id}/summary`);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('session_not_completed');
  });

  it('deletes finished sessions with their sets and records', async () => {
    const user = await onboardedUser(server.baseUrl);
    await quickWorkout(user, 'push_up', [{ reps: 10 }]);
    const pr = await quickWorkout(user, 'push_up', [{ reps: 12 }]);
    expect(pr.personalRecords).toHaveLength(1);
    const del = await user.delete(`/api/sessions/${pr.session.id}`);
    expect(del.status).toBe(200);
    expect((await user.get(`/api/sessions/${pr.session.id}`)).status).toBe(404);
    expect(await db.many('SELECT id FROM personal_records WHERE session_id = $1', [pr.session.id])).toEqual([]);
    expect(await db.many('SELECT id FROM session_sets WHERE session_id = $1', [pr.session.id])).toEqual([]);
    const open = await startEmpty(user);
    const blocked = await user.delete(`/api/sessions/${open.id}`);
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.code).toBe('session_active');
  });
});

describe('authorization isolation', () => {
  it('hides every session resource of another user behind 404', async () => {
    const alice = await onboardedUser(server.baseUrl);
    const bob = await onboardedUser(server.baseUrl);
    const a = await addExercise(alice, (await startEmpty(alice)).id, 'barbell_bench_press', 2);
    const aEx = a.exercises[0]!;
    const aSet = aEx.sets[0]!;
    const b = await addExercise(bob, (await startEmpty(bob)).id, 'push_up', 1);

    const attempts: [string, () => Promise<{ status: number }>][] = [
      ['get', () => bob.get(`/api/sessions/${a.id}`)],
      ['summary', () => bob.get(`/api/sessions/${a.id}/summary`)],
      ['state', () => bob.patch(`/api/sessions/${a.id}/state`, { action: 'pause' })],
      ['set via own session', () => bob.patch(`/api/sessions/${b.id}/sets/${aSet.id}`, { reps: 99 })],
      ['set via alice session', () => bob.patch(`/api/sessions/${a.id}/sets/${aSet.id}`, { reps: 99 })],
      ['delete set via own session', () => bob.delete(`/api/sessions/${b.id}/sets/${aSet.id}`)],
      ['add set to alice exercise', () => bob.post(`/api/sessions/${b.id}/exercises/${aEx.id}/sets`)],
      ['add exercise', () => bob.post(`/api/sessions/${a.id}/exercises`, { exerciseId: 'plank' })],
      ['patch exercise', () => bob.patch(`/api/sessions/${b.id}/exercises/${aEx.id}`, { restSeconds: 10 })],
      ['remove exercise', () => bob.delete(`/api/sessions/${b.id}/exercises/${aEx.id}`)],
      ['finish', () => bob.post(`/api/sessions/${a.id}/finish`)],
      ['abandon', () => bob.post(`/api/sessions/${a.id}/abandon`)],
      ['delete', () => bob.delete(`/api/sessions/${a.id}`)],
    ];
    for (const [label, attempt] of attempts) expect((await attempt()).status, label).toBe(404);

    // Alice's data is untouched and still hers.
    const mine = (await alice.get(`/api/sessions/${a.id}`)).body.session as WorkoutSessionDTO;
    expect(mine).toMatchObject({ status: 'in_progress' });
    expect(mine.exercises[0]!.sets).toHaveLength(2);
    expect(mine.exercises[0]!.sets[0]!.reps).toBeNull();
    expect((await bob.get('/api/sessions/active')).body.session.id).toBe(b.id);

    await completeSet(alice, a.id, aSet.id, { reps: 5, weightKg: 50 });
    const summary = await finish(alice, a.id);
    expect((await bob.get(`/api/sessions/${summary.session.id}/summary`)).status).toBe(404);
    expect((await bob.get('/api/sessions')).body.sessions).toEqual([]);
    // Bob's later bench press is not compared against Alice's.
    expect((await bob.post(`/api/sessions/${b.id}/finish`)).status).toBe(200);
    const bobBench = await quickWorkout(bob, 'barbell_bench_press', [{ reps: 1, weightKg: 20 }]);
    expect(bobBench.personalRecords).toEqual([]);
  });

  it('validates path parameters and requires authentication', async () => {
    const user = await onboardedUser(server.baseUrl);
    expect((await user.get('/api/sessions/not-a-uuid')).status).toBe(400);
    expect((await user.patch(`/api/sessions/${crypto.randomUUID()}/sets/123`, { reps: 1 })).status).toBe(400);
    expect((await user.get(`/api/sessions/${crypto.randomUUID()}`)).body.error.code).toBe('session_not_found');
    const anon = await fetch(`${server.baseUrl}/api/sessions/active`);
    expect(anon.status).toBe(401);
  });
});
