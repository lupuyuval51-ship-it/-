import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { config } from '../src/config';
import { db } from '../src/db/pool';
import { resetRateLimits } from '../src/middleware/rateLimit';
import { disableLlm, startFakeLlm, useFakeLlm, type FakeLlm } from './helpers/fakeLlm';
import { onboardedUser, registerUser, startTestServer, type TestClient, type TestServer } from './helpers/server';

let server: TestServer;
let fake: FakeLlm;

beforeAll(async () => {
  server = await startTestServer();
  fake = await startFakeLlm();
});
afterAll(async () => {
  disableLlm();
  await fake.close();
  await server.close();
  await db.close();
});

/* eslint-disable @typescript-eslint/no-explicit-any */
type Plan = any;

async function generate(c: TestClient, body: Record<string, unknown> = {}): Promise<Plan> {
  const res = await c.post('/api/plans/generate', body);
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body.plan;
}

const exerciseIds = (plan: Plan): string[] => plan.workouts.flatMap((w: any) => w.exercises.map((x: any) => x.exerciseId));
const toInput = (x: any) => ({
  id: x.id,
  exerciseId: x.exerciseId,
  sets: x.sets,
  repMin: x.repMin,
  repMax: x.repMax,
  targetSeconds: x.targetSeconds,
  restSeconds: x.restSeconds,
  targetRpe: x.targetRpe,
  targetWeightKg: x.targetWeightKg,
  notes: x.notes,
});

describe('plan generation', () => {
  it('requires completed onboarding', async () => {
    const c = await registerUser(server.baseUrl);
    const res = await c.post('/api/plans/generate', {});
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('onboarding_required');
  });

  it('persists a draft plan with workouts and exercises owned by the user', async () => {
    const c = await onboardedUser(server.baseUrl);
    const plan = await generate(c);
    expect(plan.status).toBe('draft');
    expect(plan.source).toBe('generated');
    expect(plan.splitType).toBe('upper_lower');
    expect(plan.daysPerWeek).toBe(4);
    expect(plan.sessionMinutes).toBe(60);
    expect(plan.goal).toBe('muscle_gain');
    expect(plan.name).toBe('Build muscle · Upper / lower');
    expect(plan.workouts.map((w: any) => w.focus)).toEqual(['upper_a', 'lower_a', 'upper_b', 'lower_b']);
    expect(plan.workouts[0].name).toBe('Upper body A');
    expect(plan.generationInput.generatorVersion).toBe('rules-1.0');
    expect(plan.generationInput.preferences.interpreter).toBeNull();
    expect(plan.generationNotes.map((n: any) => n.code)).toEqual(expect.arrayContaining(['split_upper_lower', 'warm_up', 'progression_double']));
    expect(plan.workoutCount).toBe(4);
    expect(plan.exerciseCount).toBe(exerciseIds(plan).length);
    for (const w of plan.workouts) {
      expect(w.exercises.length).toBeGreaterThanOrEqual(3);
      expect(w.estimatedMinutes).toBeLessThanOrEqual(65);
      w.exercises.forEach((x: any, i: number) => {
        expect(x.position).toBe(i);
        expect(x.exercise.id).toBe(x.exerciseId);
        expect(x.exercise.name.en).toBeTruthy();
      });
    }
    const owners = await db.many<{ user_id: string }>(
      `SELECT user_id FROM workout_plans WHERE id = $1
       UNION ALL SELECT user_id FROM plan_workouts WHERE plan_id = $1
       UNION ALL SELECT pe.user_id FROM plan_exercises pe JOIN plan_workouts w ON w.id = pe.workout_id WHERE w.plan_id = $1`,
      [plan.id],
    );
    expect(owners.length).toBe(1 + 4 + exerciseIds(plan).length);
    expect(new Set(owners.map((o) => o.user_id))).toEqual(new Set([c.userId]));

    const again = await c.get(`/api/plans/${plan.id}`);
    expect(again.status).toBe(200);
    expect(again.body.plan).toEqual(plan);
  });

  it('localizes generated names in the account locale', async () => {
    const c = await onboardedUser(server.baseUrl, {}, { locale: 'he' });
    const plan = await generate(c, { daysPerWeek: 3, goal: 'general_fitness' });
    expect(plan.name).toBe('כושר כללי · כל הגוף');
    expect(plan.workouts.map((w: any) => w.name)).toEqual(['כל הגוף A', 'כל הגוף B', 'כל הגוף C']);
  });

  it('merges overrides with the profile and respects equipment and injuries', async () => {
    const c = await onboardedUser(server.baseUrl, { injuries: ['knee'] });
    const plan = await generate(c, { equipment: [], location: 'home', daysPerWeek: 2, sessionMinutes: 30, goal: 'fat_loss', name: 'Travel plan' });
    expect(plan.name).toBe('Travel plan');
    expect(plan.daysPerWeek).toBe(2);
    expect(plan.sessionMinutes).toBe(30);
    expect(plan.generationInput).toMatchObject({ location: 'home', equipment: [], goal: 'fat_loss', experience: 'intermediate' });
    const ids = exerciseIds(plan);
    const rows = await db.many<{ id: string; equipment: string[]; contraindications: string[] }>('SELECT id, equipment, contraindications FROM exercises WHERE id = ANY($1)', [ids]);
    for (const r of rows) {
      expect(r.equipment, r.id).toEqual([]);
      expect(r.contraindications, r.id).not.toContain('knee');
    }
    expect(plan.generationNotes.map((n: any) => n.code)).toEqual(expect.arrayContaining(['bodyweight_plan', 'no_pulling_equipment', 'excluded_for_injury']));

    // Location override alone uses that location's default equipment.
    const park = await generate(c, { location: 'outdoor', daysPerWeek: 1 });
    expect(park.generationInput.equipment).toEqual(['pull_up_bar', 'dip_bars']);
  });

  it('rejects invalid generator input', async () => {
    const c = await onboardedUser(server.baseUrl);
    for (const body of [{ daysPerWeek: 9 }, { sessionMinutes: 5 }, { equipment: ['laser'] }, { goal: 'fly' }, { notes: 'x'.repeat(1200) }, { focusMuscleGroups: ['wings'] }]) {
      const res = await c.post('/api/plans/generate', body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(res.body.error.code).toBe('validation_error');
    }
  });

  it('interprets free-text preferences with keywords when AI is not configured', async () => {
    disableLlm();
    const c = await onboardedUser(server.baseUrl, { goal: 'athletic_performance' });
    const plan = await generate(c, { notes: 'no jumping, more arm work', daysPerWeek: 3 });
    const codes = plan.generationNotes.map((n: any) => n.code);
    expect(codes).toContain('preferences_keywords');
    expect(plan.generationInput.preferences).toMatchObject({ interpreter: 'keywords', avoidPatterns: ['jump'], focusMuscleGroups: ['arms'] });
    expect(plan.generationInput.focusMuscleGroups).toContain('arms');
    const patterns = await db.many<{ movement_pattern: string }>('SELECT movement_pattern FROM exercises WHERE id = ANY($1)', [exerciseIds(plan)]);
    expect(patterns.some((p) => p.movement_pattern === 'jump')).toBe(false);
    expect(JSON.stringify(plan.generationInput)).not.toContain('no jumping');
  });

  it('uses the AI interpreter when configured and validates its output', async () => {
    useFakeLlm(fake.url);
    try {
      fake.setHandler((req) => {
        expect(req.output_config?.format?.type).toBe('json_schema');
        return {
          kind: 'json',
          data: { focusMuscleGroups: ['legs'], avoidExerciseIds: ['burpee', 'not_a_real_exercise'], avoidPatterns: ['jump'], preferBodyweight: false, intensity: 'easier' },
        };
      });
      const c = await onboardedUser(server.baseUrl, { goal: 'athletic_performance' });
      const plan = await generate(c, { notes: 'legs focus, nothing explosive, gentle please', daysPerWeek: 3 });
      const sent = fake.requests.at(-1)!;
      expect(JSON.stringify(sent.messages)).toContain('nothing explosive');
      expect(String(sent.system)).toContain('barbell_back_squat');
      expect(plan.generationNotes.map((n: any) => n.code)).toEqual(expect.arrayContaining(['preferences_ai', 'intensity_easier', 'pattern_avoided']));
      expect(plan.generationInput.preferences).toMatchObject({
        interpreter: 'ai',
        focusMuscleGroups: ['legs'],
        avoidExerciseIds: ['burpee'],
        avoidPatterns: ['jump'],
        intensity: 'easier',
      });
      expect(exerciseIds(plan)).not.toContain('burpee');

      // Invalid model output → keyword fallback.
      fake.setHandler(() => ({ kind: 'json', data: { focusMuscleGroups: ['wings'], avoidExerciseIds: [], avoidPatterns: [], preferBodyweight: false, intensity: 'normal' } }));
      const invalid = await generate(c, { notes: 'more arms', daysPerWeek: 2 });
      expect(invalid.generationInput.preferences).toMatchObject({ interpreter: 'keywords', focusMuscleGroups: ['arms'] });

      // Refusal → keyword fallback.
      fake.setHandler(() => ({ kind: 'refusal' }));
      const refused = await generate(c, { notes: 'בלי קפיצות', daysPerWeek: 2 });
      expect(refused.generationInput.preferences).toMatchObject({ interpreter: 'keywords', avoidPatterns: ['jump'] });
      expect(refused.generationNotes.map((n: any) => n.code)).toContain('preferences_keywords');

      // Upstream error → keyword fallback (never a failed generation).
      fake.setHandler(() => ({ kind: 'error', status: 500 }));
      const failed = await generate(c, { notes: 'easier please', daysPerWeek: 2 });
      expect(failed.generationInput.preferences).toMatchObject({ interpreter: 'keywords', intensity: 'easier' });
    } finally {
      disableLlm();
    }
  });

  it('replays duplicate submissions with the same idempotency key', async () => {
    const c = await onboardedUser(server.baseUrl);
    const headers = { 'idempotency-key': 'gen-key-123456' };
    const first = await c.post('/api/plans/generate', { daysPerWeek: 2 }, { headers });
    const second = await c.post('/api/plans/generate', { daysPerWeek: 2 }, { headers });
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.plan.id).toBe(first.body.plan.id);
    const count = await db.one<{ n: number }>('SELECT count(*)::int AS n FROM workout_plans WHERE user_id = $1', [c.userId]);
    expect(count.n).toBe(1);
  });

  it('varies exercise selection between successive generations', async () => {
    const c = await onboardedUser(server.baseUrl);
    const seeds = new Set<number>();
    const variants = new Set<string>();
    for (let i = 0; i < 4; i++) {
      const p = await generate(c, { daysPerWeek: 3 });
      seeds.add(p.generationInput.variationSeed);
      variants.add(exerciseIds(p).join(','));
    }
    expect(seeds.size).toBe(4);
    expect(variants.size).toBeGreaterThan(1);
  });
});

describe('plan CRUD and status', () => {
  it('creates custom plans, lists active first and hides archived by default', async () => {
    const c = await onboardedUser(server.baseUrl);
    const custom = await c.post('/api/plans', { name: '  My plan  ', description: 'Hand made' });
    expect(custom.status).toBe(201);
    const plan = custom.body.plan;
    expect(plan).toMatchObject({ name: 'My plan', description: 'Hand made', source: 'custom', splitType: 'custom', status: 'draft', goal: null, daysPerWeek: 1 });
    expect(plan.workouts).toHaveLength(1);
    expect(plan.workouts[0]).toMatchObject({ name: 'Day 1', focus: '', exercises: [], estimatedMinutes: null });
    expect(plan.generationInput).toEqual({});

    expect((await c.post('/api/plans', { name: '' })).status).toBe(400);
    expect((await c.post('/api/plans', { name: 'x'.repeat(121) })).status).toBe(400);

    const generated = await generate(c, { daysPerWeek: 2 });
    const third = await generate(c, { daysPerWeek: 1 });
    expect((await c.post(`/api/plans/${generated.id}/activate`)).status).toBe(200);
    expect((await c.post(`/api/plans/${third.id}/archive`)).status).toBe(200);

    const list = await c.get('/api/plans');
    expect(list.status).toBe(200);
    expect(list.body.plans.map((p: any) => p.id)).toEqual([generated.id, plan.id]);
    expect(list.body.plans[0]).toMatchObject({ status: 'active', workoutCount: 2 });
    expect(list.body.plans[0].exerciseCount).toBe(exerciseIds(generated).length);
    const all = await c.get('/api/plans?includeArchived=true');
    expect(all.body.plans.map((p: any) => p.id)).toEqual([generated.id, plan.id, third.id]);
    expect(all.body.plans[2].status).toBe('archived');
  });

  it('updates name/description, bumps updated_at and validates input', async () => {
    const c = await onboardedUser(server.baseUrl);
    const plan = await generate(c, { daysPerWeek: 1 });
    await new Promise((r) => setTimeout(r, 20));
    const res = await c.patch(`/api/plans/${plan.id}`, { name: 'Renamed', description: 'New <b>desc</b>' });
    expect(res.status).toBe(200);
    expect(res.body.plan.name).toBe('Renamed');
    expect(res.body.plan.description).toBe('New bdesc/b');
    expect(Date.parse(res.body.plan.updatedAt)).toBeGreaterThan(Date.parse(plan.updatedAt));
    expect((await c.patch(`/api/plans/${plan.id}`, { name: '   ' })).status).toBe(400);
    expect((await c.get('/api/plans/not-a-uuid')).status).toBe(400);
    const missing = await c.get('/api/plans/00000000-0000-4000-8000-000000000000');
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('plan_not_found');
  });

  it('activating a plan turns the previously active plan into a draft', async () => {
    const c = await onboardedUser(server.baseUrl);
    const a = await generate(c, { daysPerWeek: 1 });
    const b = await generate(c, { daysPerWeek: 1 });
    expect((await c.post(`/api/plans/${a.id}/activate`)).body.plan.status).toBe('active');
    const res = await c.post(`/api/plans/${b.id}/activate`);
    expect(res.body.plan.status).toBe('active');
    expect((await c.get(`/api/plans/${a.id}`)).body.plan.status).toBe('draft');
    // Concurrent activations never produce two active plans.
    await Promise.all([c.post(`/api/plans/${a.id}/activate`), c.post(`/api/plans/${b.id}/activate`)]);
    const active = await db.one<{ n: number }>(`SELECT count(*)::int AS n FROM workout_plans WHERE user_id = $1 AND status = 'active'`, [c.userId]);
    expect(active.n).toBe(1);
  });

  it('duplicates a plan deeply and independently', async () => {
    const c = await onboardedUser(server.baseUrl);
    const plan = await generate(c, { daysPerWeek: 3 });
    await c.post(`/api/plans/${plan.id}/activate`);
    const res = await c.post(`/api/plans/${plan.id}/duplicate`);
    expect(res.status).toBe(201);
    const copy = res.body.plan;
    expect(copy.id).not.toBe(plan.id);
    expect(copy).toMatchObject({ name: `${plan.name} (copy)`, source: 'duplicate', status: 'draft', splitType: plan.splitType, goal: plan.goal });
    expect(copy.generationNotes).toEqual(plan.generationNotes);
    expect(copy.workouts.map((w: any) => [w.name, w.focus])).toEqual(plan.workouts.map((w: any) => [w.name, w.focus]));
    expect(exerciseIds(copy)).toEqual(exerciseIds(plan));
    const strip = (x: any) => ({ ...toInput(x), id: undefined });
    expect(copy.workouts[0].exercises.map(strip)).toEqual(plan.workouts[0].exercises.map(strip));
    const copyRowIds = copy.workouts.flatMap((w: any) => [w.id, ...w.exercises.map((x: any) => x.id)]);
    const origRowIds = plan.workouts.flatMap((w: any) => [w.id, ...w.exercises.map((x: any) => x.id)]);
    expect(copyRowIds.filter((id: string) => origRowIds.includes(id))).toEqual([]);

    // Editing the copy leaves the original untouched.
    const day = copy.workouts[0];
    await c.put(`/api/plans/${copy.id}/workouts/${day.id}`, { name: 'Changed', focus: day.focus, notes: '', exercises: day.exercises.slice(0, 1).map(toInput) });
    const original = (await c.get(`/api/plans/${plan.id}`)).body.plan;
    expect(original.workouts[0].name).toBe(plan.workouts[0].name);
    expect(original.workouts[0].exercises).toHaveLength(plan.workouts[0].exercises.length);

    const long = await c.patch(`/api/plans/${plan.id}`, { name: 'n'.repeat(120) });
    expect(long.status).toBe(200);
    const longCopy = await c.post(`/api/plans/${plan.id}/duplicate`);
    expect(longCopy.status).toBe(201);
    expect(longCopy.body.plan.name.length).toBeLessThanOrEqual(120);
    expect(longCopy.body.plan.name.endsWith('(copy)')).toBe(true);
  });

  it('archives and deletes plans while sessions keep their history', async () => {
    const c = await onboardedUser(server.baseUrl);
    const plan = await generate(c, { daysPerWeek: 1 });
    const archived = await c.post(`/api/plans/${plan.id}/archive`);
    expect(archived.body.plan.status).toBe('archived');
    const session = await db.one<{ id: string }>(
      `INSERT INTO workout_sessions (user_id, plan_id, plan_workout_id, name, status, ended_at, duration_seconds)
       VALUES ($1, $2, $3, 'Old session', 'completed', now(), 1800) RETURNING id`,
      [c.userId, plan.id, plan.workouts[0].id],
    );
    const del = await c.delete(`/api/plans/${plan.id}`);
    expect(del.status).toBe(200);
    expect(del.body).toEqual({ ok: true });
    expect((await c.get(`/api/plans/${plan.id}`)).status).toBe(404);
    expect((await c.delete(`/api/plans/${plan.id}`)).status).toBe(404);
    const kept = await db.one<{ plan_id: string | null; plan_workout_id: string | null; name: string }>('SELECT plan_id, plan_workout_id, name FROM workout_sessions WHERE id = $1', [session.id]);
    expect(kept).toEqual({ plan_id: null, plan_workout_id: null, name: 'Old session' });
    const leftovers = await db.one<{ n: number }>('SELECT count(*)::int AS n FROM plan_workouts WHERE plan_id = $1', [plan.id]);
    expect(leftovers.n).toBe(0);
  });

  it('requires the CSRF token for mutations', async () => {
    const c = await onboardedUser(server.baseUrl);
    const res = await c.post('/api/plans', { name: 'x' }, { csrf: false });
    expect(res.status).toBe(403);
  });
});

describe('editing workout days', () => {
  it('persists sets/reps/rest/order edits, replacements, additions and removals', async () => {
    const c = await onboardedUser(server.baseUrl);
    const plan = await generate(c);
    const day = plan.workouts[0];
    const [first, second, third, ...rest] = day.exercises;
    const edited = [
      { ...toInput(second), sets: 5, repMin: 6, repMax: 8, restSeconds: 150, targetRpe: 8.5, targetWeightKg: 42.5, notes: 'Pause at the bottom' },
      { ...toInput(first), exerciseId: 'dumbbell_bench_press', sets: 3, repMin: 8, repMax: 12 },
      ...rest.map(toInput),
      { exerciseId: 'plank', sets: 3, repMin: null, repMax: null, targetSeconds: 45, restSeconds: 60, targetRpe: null, targetWeightKg: null, notes: '' },
    ];
    const res = await c.put(`/api/plans/${plan.id}/workouts/${day.id}`, { name: 'Push focus', focus: 'upper_a', notes: 'Go heavy', exercises: edited });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const saved = res.body.plan.workouts.find((w: any) => w.id === day.id);
    expect(saved.name).toBe('Push focus');
    expect(saved.notes).toBe('Go heavy');
    expect(saved.exercises.map((x: any) => x.exerciseId)).toEqual([second.exerciseId, 'dumbbell_bench_press', ...rest.map((x: any) => x.exerciseId), 'plank']);
    expect(saved.exercises[0]).toMatchObject({ id: second.id, sets: 5, repMin: 6, repMax: 8, restSeconds: 150, targetRpe: 8.5, targetWeightKg: 42.5, notes: 'Pause at the bottom', position: 0 });
    expect(saved.exercises[1]).toMatchObject({ id: first.id, exerciseId: 'dumbbell_bench_press', position: 1 });
    expect(saved.exercises.at(-1)).toMatchObject({ exerciseId: 'plank', targetSeconds: 45, repMin: null });
    expect(saved.exercises.some((x: any) => x.id === third.id)).toBe(false);
    expect(saved.estimatedMinutes).toBeGreaterThan(0);
    const reloaded = (await c.get(`/api/plans/${plan.id}`)).body.plan.workouts.find((w: any) => w.id === day.id);
    expect(reloaded).toEqual(saved);
    const gone = await db.maybeOne('SELECT id FROM plan_exercises WHERE id = $1', [third.id]);
    expect(gone).toBeNull();

    const empty = await c.put(`/api/plans/${plan.id}/workouts/${day.id}`, { name: 'Rest-ish', exercises: [] });
    expect(empty.status).toBe(200);
    const emptied = empty.body.plan.workouts.find((w: any) => w.id === day.id);
    expect(emptied).toMatchObject({ exercises: [], estimatedMinutes: null, focus: '' });
  });

  it('rejects unknown exercises, invalid prescriptions, too many rows and foreign rows', async () => {
    const c = await onboardedUser(server.baseUrl);
    const plan = await generate(c);
    const [day, other] = plan.workouts;
    const base = day.exercises.map(toInput);
    const put = (exercises: unknown[]) => c.put(`/api/plans/${plan.id}/workouts/${day.id}`, { name: 'Day', exercises });

    const unknown = await put([...base, { ...base[0], id: undefined, exerciseId: 'flying_kick' }]);
    expect(unknown.status).toBe(400);
    expect(unknown.body.error.code).toBe('unknown_exercise');
    expect(unknown.body.error.details.exerciseIds).toEqual(['flying_kick']);

    const range = await put([{ ...base[0], repMin: 12, repMax: 8 }]);
    expect(range.status).toBe(400);
    expect(range.body.error.details.issues[0].message).toBe('rep_range_invalid');
    const noTarget = await put([{ ...base[0], repMin: null, repMax: null, targetSeconds: null }]);
    expect(noTarget.body.error.details.issues[0].message).toBe('reps_or_time_required');
    expect((await put([{ ...base[0], sets: 0 }])).status).toBe(400);
    expect((await put([{ ...base[0], restSeconds: 900 }])).status).toBe(400);
    expect((await put([{ ...base[0], targetRpe: 11 }])).status).toBe(400);

    // A time-only row never keeps a stray rep ceiling.
    const timed = await put([{ ...base[0], repMin: null, repMax: 12, targetSeconds: 40 }]);
    expect(timed.status).toBe(200);
    const timedRow = timed.body.plan.workouts.find((w: any) => w.id === day.id).exercises[0];
    expect(timedRow).toMatchObject({ repMin: null, repMax: null, targetSeconds: 40 });

    const many = Array.from({ length: 21 }, () => ({ ...base[0], id: undefined }));
    expect((await put(many)).status).toBe(400);
    const twenty = await put(Array.from({ length: 20 }, () => ({ ...base[0], id: undefined })));
    expect(twenty.status).toBe(200);

    const fresh = (await c.get(`/api/plans/${plan.id}`)).body.plan;
    const otherRow = fresh.workouts[1].exercises[0];
    const foreign = await put([{ ...toInput(otherRow) }]);
    expect(foreign.status).toBe(400);
    expect(foreign.body.error.code).toBe('unknown_plan_exercise');
    const dayRow = fresh.workouts[0].exercises[0];
    const dup = await put([toInput(dayRow), toInput(dayRow)]);
    expect(dup.body.error.code).toBe('duplicate_plan_exercise');
    expect((await c.put(`/api/plans/${plan.id}/workouts/${other.id}`, { name: '', exercises: [] })).status).toBe(400);
    expect((await c.put(`/api/plans/${plan.id}/workouts/00000000-0000-4000-8000-000000000000`, { name: 'x', exercises: [] })).body.error.code).toBe('workout_not_found');
  });

  it('adds, duplicates, deletes and reorders days', async () => {
    const c = await onboardedUser(server.baseUrl, { days_per_week: 3 });
    const plan = await generate(c);
    expect(plan.workouts).toHaveLength(3);

    const added = await c.post(`/api/plans/${plan.id}/workouts`, { name: 'Mobility day', focus: '' });
    expect(added.status).toBe(201);
    expect(added.body.plan.workouts).toHaveLength(4);
    expect(added.body.plan.workouts[3]).toMatchObject({ name: 'Mobility day', position: 3, exercises: [] });
    expect(added.body.plan.daysPerWeek).toBe(4);

    const dup = await c.post(`/api/plans/${plan.id}/workouts/${plan.workouts[0].id}/duplicate`);
    expect(dup.status).toBe(201);
    const copyDay = dup.body.plan.workouts[4];
    expect(copyDay.name).toBe(`${plan.workouts[0].name} (copy)`);
    expect(copyDay.focus).toBe(plan.workouts[0].focus);
    expect(copyDay.exercises.map((x: any) => x.exerciseId)).toEqual(plan.workouts[0].exercises.map((x: any) => x.exerciseId));

    await c.post(`/api/plans/${plan.id}/workouts`, { name: 'Six' });
    await c.post(`/api/plans/${plan.id}/workouts`, { name: 'Seven' });
    const limit = await c.post(`/api/plans/${plan.id}/workouts`, { name: 'Eight' });
    expect(limit.status).toBe(409);
    expect(limit.body.error.code).toBe('plan_workout_limit');
    expect((await c.post(`/api/plans/${plan.id}/workouts/${plan.workouts[0].id}/duplicate`)).status).toBe(409);

    const current = (await c.get(`/api/plans/${plan.id}`)).body.plan;
    const ids = current.workouts.map((w: any) => w.id);
    const reversed = [...ids].reverse();
    const reorder = await c.post(`/api/plans/${plan.id}/workouts/reorder`, { workoutIds: reversed });
    expect(reorder.status).toBe(200);
    expect(reorder.body.plan.workouts.map((w: any) => w.id)).toEqual(reversed);
    expect(reorder.body.plan.workouts.map((w: any) => w.position)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    // The "next workout" pointer follows the same day.
    expect(reorder.body.plan.nextWorkoutIndex).toBe(6);
    for (const bad of [ids.slice(1), [...ids.slice(1), ids[1]], [...ids.slice(1), '00000000-0000-4000-8000-000000000000']]) {
      const res = await c.post(`/api/plans/${plan.id}/workouts/reorder`, { workoutIds: bad });
      expect(res.status).toBe(400);
    }

    let latest = reorder.body.plan;
    while (latest.workouts.length > 1) {
      const res = await c.delete(`/api/plans/${plan.id}/workouts/${latest.workouts[0].id}`);
      expect(res.status).toBe(200);
      latest = res.body.plan;
      expect(latest.workouts.map((w: any) => w.position)).toEqual(latest.workouts.map((_: any, i: number) => i));
      expect(latest.daysPerWeek).toBe(latest.workouts.length);
    }
    const last = await c.delete(`/api/plans/${plan.id}/workouts/${latest.workouts[0].id}`);
    expect(last.status).toBe(409);
    expect(last.body.error.code).toBe('plan_requires_workout');
  });

  it('regenerates a generated day with the same focus and rejects custom days', async () => {
    const c = await onboardedUser(server.baseUrl);
    const plan = await generate(c);
    const day = plan.workouts[1];
    const res = await c.post(`/api/plans/${plan.id}/workouts/${day.id}/regenerate`);
    expect(res.status).toBe(200);
    const regenerated = res.body.plan.workouts.find((w: any) => w.id === day.id);
    expect(regenerated.focus).toBe(day.focus);
    expect(regenerated.name).toBe(day.name);
    expect(regenerated.exercises.length).toBeGreaterThanOrEqual(3);
    expect(regenerated.exercises.map((x: any) => x.exerciseId)).not.toEqual(day.exercises.map((x: any) => x.exerciseId));
    expect(res.body.plan.generationInput.regenerationCount).toBe(1);
    // Other days are untouched.
    expect(res.body.plan.workouts[0]).toEqual(plan.workouts[0]);

    const custom = (await c.post('/api/plans', { name: 'Custom' })).body.plan;
    const bad = await c.post(`/api/plans/${custom.id}/workouts/${custom.workouts[0].id}/regenerate`);
    expect(bad.status).toBe(409);
    expect(bad.body.error.code).toBe('focus_not_generatable');
    // A custom day becomes regenerable once it is given a training-engine focus.
    await c.put(`/api/plans/${custom.id}/workouts/${custom.workouts[0].id}`, { name: 'Legs', focus: 'legs', exercises: [] });
    const ok = await c.post(`/api/plans/${custom.id}/workouts/${custom.workouts[0].id}/regenerate`);
    expect(ok.status).toBe(200);
    expect(ok.body.plan.workouts[0].exercises.length).toBeGreaterThanOrEqual(3);
  });
});

describe('alternatives and progression', () => {
  it('lists easier, harder and similar alternatives with suitability for the user', async () => {
    const c = await onboardedUser(server.baseUrl, { training_location: 'home', equipment: ['dumbbells', 'bench'], injuries: ['wrist'] });
    const plan = await generate(c);
    const day = plan.workouts[0];
    const row = day.exercises[0];
    const res = await c.get(`/api/plans/${plan.id}/workouts/${day.id}/exercises/${row.id}/alternatives?exerciseId=dumbbell_bench_press`);
    expect(res.status).toBe(200);
    const alts = res.body.alternatives;
    expect(alts.length).toBeGreaterThan(3);
    const relations = new Set(alts.map((a: any) => a.relation));
    expect(relations).toEqual(new Set(['easier', 'harder', 'similar']));
    expect(alts.filter((a: any) => a.relation === 'similar').length).toBeLessThanOrEqual(6);
    expect(alts.some((a: any) => a.exercise.id === 'dumbbell_bench_press')).toBe(false);
    const barbell = alts.find((a: any) => a.exercise.id === 'barbell_bench_press');
    expect(barbell).toMatchObject({ relation: 'harder', suitable: false, missingEquipment: ['barbell'] });
    const pushUp = alts.find((a: any) => a.exercise.id === 'push_up');
    expect(pushUp).toMatchObject({ suitable: false, missingEquipment: [] }); // wrist injury
    const floor = alts.find((a: any) => a.exercise.id === 'dumbbell_floor_press');
    expect(floor).toMatchObject({ relation: 'easier', suitable: true });
    const firstUnsuitable = alts.findIndex((a: any) => !a.suitable);
    expect(alts.slice(firstUnsuitable).every((a: any) => !a.suitable)).toBe(true);

    const plain = await c.get(`/api/plans/${plan.id}/workouts/${day.id}/exercises/${row.id}/alternatives`);
    expect(plain.status).toBe(200);
    expect(plain.body.alternatives.some((a: any) => a.exercise.id === row.exerciseId)).toBe(false);
    const generic = await c.get(`/api/plans/${plan.id}/alternatives?exerciseId=goblet_squat`);
    expect(generic.status).toBe(200);
    expect(generic.body.alternatives.some((a: any) => a.exercise.id === 'bodyweight_squat')).toBe(true);
    expect((await c.get(`/api/plans/${plan.id}/alternatives`)).status).toBe(400);
    expect((await c.get(`/api/plans/${plan.id}/alternatives?exerciseId=nope_nope`)).body.error.code).toBe('unknown_exercise');
    const wrongDay = await c.get(`/api/plans/${plan.id}/workouts/${plan.workouts[1].id}/exercises/${row.id}/alternatives`);
    expect(wrongDay.status).toBe(404);
    expect(wrongDay.body.error.code).toBe('plan_exercise_not_found');
  });

  it('apply-progression reports no changes without recorded history', async () => {
    const c = await onboardedUser(server.baseUrl);
    const plan = await generate(c, { daysPerWeek: 1 });
    const res = await c.post(`/api/plans/${plan.id}/apply-progression`);
    expect(res.status).toBe(200);
    expect(res.body.changes).toEqual([]);
    expect(res.body.plan.workouts).toEqual(plan.workouts);
    // Nothing changed → the plan is not marked as modified.
    expect(res.body.plan.updatedAt).toBe(plan.updatedAt);
  });
});

describe('rate limiting', () => {
  it('limits plan generation per user', async () => {
    const c = await onboardedUser(server.baseUrl);
    const original = config.rateLimit.multiplier;
    config.rateLimit.multiplier = 0.1; // 30/h → 3/h
    resetRateLimits();
    try {
      for (let i = 0; i < 3; i++) expect((await c.post('/api/plans/generate', { daysPerWeek: 1 })).status).toBe(201);
      const limited = await c.post('/api/plans/generate', { daysPerWeek: 1 });
      expect(limited.status).toBe(429);
      expect(limited.body.error.code).toBe('rate_limited');
      // Other users are not affected.
      const other = await onboardedUser(server.baseUrl);
      expect((await other.post('/api/plans/generate', { daysPerWeek: 1 })).status).toBe(201);
    } finally {
      config.rateLimit.multiplier = original;
      resetRateLimits();
    }
  });
});

describe('authorization isolation', () => {
  it('returns 404 for every route on another user’s plan and never modifies it', async () => {
    const owner = await onboardedUser(server.baseUrl);
    const intruder = await onboardedUser(server.baseUrl);
    const plan = await generate(owner);
    await owner.post(`/api/plans/${plan.id}/activate`);
    const snapshot = (await owner.get(`/api/plans/${plan.id}`)).body.plan;
    const day = plan.workouts[0];
    const row = day.exercises[0];
    const ids = plan.workouts.map((w: any) => w.id);

    const attempts: [string, string, unknown?][] = [
      ['GET', `/api/plans/${plan.id}`],
      ['PATCH', `/api/plans/${plan.id}`, { name: 'Hacked' }],
      ['DELETE', `/api/plans/${plan.id}`],
      ['POST', `/api/plans/${plan.id}/activate`, {}],
      ['POST', `/api/plans/${plan.id}/archive`, {}],
      ['POST', `/api/plans/${plan.id}/duplicate`, {}],
      ['POST', `/api/plans/${plan.id}/apply-progression`, {}],
      ['POST', `/api/plans/${plan.id}/workouts`, { name: 'Extra' }],
      ['POST', `/api/plans/${plan.id}/workouts/reorder`, { workoutIds: [...ids].reverse() }],
      ['PUT', `/api/plans/${plan.id}/workouts/${day.id}`, { name: 'Hacked', exercises: [] }],
      ['DELETE', `/api/plans/${plan.id}/workouts/${day.id}`],
      ['POST', `/api/plans/${plan.id}/workouts/${day.id}/duplicate`, {}],
      ['POST', `/api/plans/${plan.id}/workouts/${day.id}/regenerate`, {}],
      ['GET', `/api/plans/${plan.id}/workouts/${day.id}/exercises/${row.id}/alternatives`],
      ['GET', `/api/plans/${plan.id}/alternatives?exerciseId=push_up`],
    ];
    for (const [method, path, body] of attempts) {
      const res = await intruder.request(method, path, body);
      expect(res.status, `${method} ${path}`).toBe(404);
      expect(res.body.error.code, `${method} ${path}`).toBe('plan_not_found');
    }
    expect((await intruder.get('/api/plans')).body.plans).toEqual([]);

    // The intruder cannot graft the owner's rows into their own plan either.
    const own = await generate(intruder, { daysPerWeek: 1 });
    const ownDay = own.workouts[0];
    const graft = await intruder.put(`/api/plans/${own.id}/workouts/${ownDay.id}`, { name: 'x', exercises: [toInput(row)] });
    expect(graft.status).toBe(400);
    expect(graft.body.error.code).toBe('unknown_plan_exercise');
    expect((await intruder.post(`/api/plans/${own.id}/workouts/${day.id}/duplicate`)).body.error.code).toBe('workout_not_found');
    expect((await intruder.get(`/api/plans/${own.id}/workouts/${day.id}/exercises/${row.id}/alternatives`)).body.error.code).toBe('workout_not_found');
    expect((await intruder.post(`/api/plans/${own.id}/workouts/reorder`, { workoutIds: [day.id] })).status).toBe(400);

    const after = (await owner.get(`/api/plans/${plan.id}`)).body.plan;
    expect(after).toEqual(snapshot);
  });

  it('requires authentication', async () => {
    const res = await fetch(`${server.baseUrl}/api/plans`);
    expect(res.status).toBe(401);
  });
});
