import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../src/db/pool';
import { getExerciseMap, type ExerciseRecord } from '../src/modules/exercises/repository';
import {
  holdSuggestion,
  decideProgression,
  suggestProgressions,
  type HistorySession,
  type HistorySet,
  type PrescriptionInput,
  type ProgressionContext,
} from '../src/modules/sessions/progression';
import { onboardedUser, registerUser, setProfile, startTestServer, type TestServer } from './helpers/server';

let server: TestServer;
let catalog: Map<string, ExerciseRecord>;

beforeAll(async () => {
  server = await startTestServer();
  catalog = await getExerciseMap();
});
afterAll(async () => {
  await server.close();
  await db.close();
});

const ADULT: ProgressionContext = { isMinor: false, equipment: [], injuries: [], avoidExerciseIds: [] };
const ex = (id: string) => {
  const e = catalog.get(id);
  if (!e) throw new Error(`missing exercise ${id}`);
  return e;
};
const set = (reps: number | null, weightKg: number | null = null, extra: Partial<HistorySet> = {}): HistorySet => ({
  reps,
  weightKg,
  durationSeconds: null,
  rpe: null,
  targetSeconds: null,
  ...extra,
});
const hist = (sets: HistorySet[], range: Partial<HistorySession> = {}): HistorySession => ({
  sessionId: crypto.randomUUID(),
  repMin: 8,
  repMax: 12,
  targetSeconds: null,
  sets,
  ...range,
});
const rx = (exerciseId: string, p: Partial<PrescriptionInput> = {}): PrescriptionInput => ({
  exerciseId,
  repMin: 8,
  repMax: 12,
  targetSeconds: null,
  targetWeightKg: null,
  ...p,
});
const decide = (input: PrescriptionInput, history: HistorySession[], ctx: ProgressionContext = ADULT) =>
  decideProgression(input, ex(input.exerciseId), history, ctx, catalog);

describe('progression — weight × reps', () => {
  it('keeps the plan targets the first time', () => {
    const s = decide(rx('barbell_back_squat', { targetWeightKg: 60 }), []);
    expect(s).toMatchObject({ action: 'first_time', reasonCode: 'no_history', targetWeightKg: 60, repMin: 8, repMax: 12 });
  });

  it('adds one load increment when every working set reached the top of the range', () => {
    const s = decide(rx('barbell_back_squat'), [hist([set(12, 100), set(12, 100), set(13, 100)])]);
    expect(s).toMatchObject({ action: 'increase_weight', targetWeightKg: 105, repMin: 8, repMax: 12, targetReps: 8, reasonCode: 'hit_top_of_range' });
    expect(s.params).toEqual({ fromKg: 100, toKg: 105 });
    // Dumbbell exercises use their own (smaller) increment.
    expect(decide(rx('dumbbell_curl'), [hist([set(12, 14), set(12, 14)])]).targetWeightKg).toBe(16);
  });

  it('falls back to a 2.5 kg increment when the exercise has none', () => {
    const noIncrement = { ...ex('barbell_bench_press'), loadIncrementKg: null };
    const s = decideProgression(rx('barbell_bench_press'), noIncrement, [hist([set(12, 60), set(12, 60)])], ADULT, catalog);
    expect(s.targetWeightKg).toBe(62.5);
  });

  it('ignores logged warm-up sets when judging the working sets', () => {
    const s = decide(rx('barbell_bench_press'), [hist([set(5, 40), set(12, 80), set(12, 80), set(12, 80)])]);
    expect(s.action).toBe('increase_weight');
    expect(s.targetWeightKg).toBe(82.5);
  });

  it('does not add load when effort was very high (RPE above 9)', () => {
    const s = decide(rx('barbell_bench_press'), [hist([set(12, 80, { rpe: 9 }), set(12, 80, { rpe: 9.5 })])]);
    expect(s).toMatchObject({ action: 'maintain', reasonCode: 'high_rpe', targetWeightKg: 80, targetReps: 12 });
    // RPE 9 or less (or not recorded) still progresses.
    expect(decide(rx('barbell_bench_press'), [hist([set(12, 80, { rpe: 9 }), set(12, 80)])]).action).toBe('increase_weight');
  });

  it('aims for one more rep at the same weight when reps were within the range', () => {
    const s = decide(rx('barbell_bench_press'), [hist([set(10, 80), set(9, 80), set(9, 80)])]);
    expect(s).toMatchObject({ action: 'increase_reps', targetWeightKg: 80, targetReps: 10, reasonCode: 'within_range' });
    // Never aims above the top of the range.
    expect(decide(rx('barbell_bench_press'), [hist([set(12, 80), set(11, 80)])]).targetReps).toBe(12);
  });

  it('maintains the load after one session below the range', () => {
    const s = decide(rx('barbell_bench_press'), [hist([set(8, 80), set(6, 80)]), hist([set(10, 77.5), set(9, 77.5)])]);
    expect(s).toMatchObject({ action: 'maintain', reasonCode: 'below_range', targetWeightKg: 80, targetReps: 8 });
  });

  it('deloads ~10% (rounded to the increment) after two sessions below the range', () => {
    const s = decide(rx('barbell_back_squat'), [hist([set(6, 100), set(5, 100)]), hist([set(7, 100), set(8, 100)])]);
    expect(s).toMatchObject({ action: 'deload', targetWeightKg: 90, reasonCode: 'missed_reps_twice' });
    expect(s.params).toEqual({ fromKg: 100, toKg: 90 });
    const odd = decide(rx('barbell_bench_press'), [hist([set(4, 62)]), hist([set(5, 62)])]);
    expect(odd.targetWeightKg).toBe(55); // 55.8 → nearest 2.5
  });

  it('only looks at the two most recent sessions', () => {
    const s = decide(rx('barbell_bench_press'), [hist([set(12, 80), set(12, 80)]), hist([set(4, 80)]), hist([set(3, 80)])]);
    expect(s.action).toBe('increase_weight');
  });

  it('suggests maintaining when no load was recorded', () => {
    const s = decide(rx('barbell_bench_press', { targetWeightKg: 50 }), [hist([set(12), set(12)])]);
    expect(s).toMatchObject({ action: 'maintain', reasonCode: 'no_weight_recorded', targetWeightKg: 50 });
  });

  it('never jumps more than one increment for minors', () => {
    const minor = { ...ADULT, isMinor: true };
    const s = decide(rx('barbell_back_squat'), [hist([set(15, 40), set(15, 40), set(15, 40)])], minor);
    expect(s.action).toBe('increase_weight');
    expect(s.targetWeightKg).toBe(45);
    expect(s.targetWeightKg! - 40).toBeLessThanOrEqual(ex('barbell_back_squat').loadIncrementKg!);
  });

  it('uses the last session range when the prescription has none', () => {
    const s = decide(rx('barbell_bench_press', { repMin: null, repMax: null }), [hist([set(6, 80), set(6, 80)], { repMin: 4, repMax: 6 })]);
    expect(s).toMatchObject({ action: 'increase_weight', repMin: 4, repMax: 6 });
  });
});

describe('progression — bodyweight reps', () => {
  const pushUps = (reps: number[], range: Partial<HistorySession> = {}) => [hist(reps.map((r) => set(r)), { repMin: 8, repMax: 15, ...range })];

  it('suggests a harder variation the user can do once every set hits the top', () => {
    const s = decide(rx('push_up', { repMin: 8, repMax: 15 }), pushUps([15, 16, 15]));
    expect(s).toMatchObject({ action: 'try_harder_variation', harderVariationId: 'decline_push_up', reasonCode: 'mastered_try_harder' });
    expect(s.params).toMatchObject({ exerciseId: 'decline_push_up', nameEn: ex('decline_push_up').name.en });
  });

  it('skips harder variations that need missing equipment or conflict with injuries', () => {
    // Goblet squat needs dumbbells; without them the next suitable option is the jump squat.
    expect(decide(rx('bodyweight_squat', { repMin: 10, repMax: 20 }), [hist([set(20), set(20)])]).harderVariationId).toBe('jump_squat');
    expect(
      decide(rx('bodyweight_squat', { repMin: 10, repMax: 20 }), [hist([set(20), set(20)])], { ...ADULT, equipment: ['dumbbells'] }).harderVariationId,
    ).toBe('goblet_squat');
    // Every push-up progression loads the shoulder → raise the rep target instead.
    const injured = decide(rx('push_up', { repMin: 8, repMax: 15 }), pushUps([15, 15]), { ...ADULT, injuries: ['shoulder'] });
    expect(injured).toMatchObject({ action: 'increase_reps', repMin: 10, repMax: 17, reasonCode: 'raise_rep_target', harderVariationId: null });
  });

  it('does not offer advanced variations to minors or avoided exercises', () => {
    const pullUps = [hist([set(12), set(12)], { repMin: 6, repMax: 12 })];
    const adult = decide(rx('pull_up', { repMin: 6, repMax: 12 }), pullUps, { ...ADULT, equipment: ['pull_up_bar'] });
    expect(adult.harderVariationId).toBe('muscle_up');
    const minor = decide(rx('pull_up', { repMin: 6, repMax: 12 }), pullUps, { ...ADULT, equipment: ['pull_up_bar'], isMinor: true });
    expect(minor).toMatchObject({ action: 'increase_reps', repMin: 8, repMax: 14 });
    const avoided = decide(rx('pull_up', { repMin: 6, repMax: 12 }), pullUps, { ...ADULT, equipment: ['pull_up_bar'], avoidExerciseIds: ['muscle_up'] });
    expect(avoided.action).toBe('increase_reps');
  });

  it('raises rep targets by 2 (cumulatively, capped at 30)', () => {
    // Last time the targets were already raised to 10–17: progress continues from there.
    const s = decide(rx('superman', { repMin: 8, repMax: 15 }), [hist([set(17), set(18)], { repMin: 10, repMax: 17 })]);
    expect(s).toMatchObject({ action: 'increase_reps', repMin: 12, repMax: 19 });
    const nearCap = decide(rx('superman', { repMin: 20, repMax: 29 }), [hist([set(29), set(29)], { repMin: 20, repMax: 29 })]);
    expect(nearCap).toMatchObject({ repMin: 22, repMax: 30 });
    const capped = decide(rx('superman', { repMin: 25, repMax: 30 }), [hist([set(30), set(30)], { repMin: 25, repMax: 30 })]);
    expect(capped).toMatchObject({ action: 'maintain', reasonCode: 'rep_cap_reached', repMax: 30 });
  });

  it('aims for one more rep within the range and holds when below it', () => {
    const within = decide(rx('superman', { repMin: 8, repMax: 15 }), [hist([set(12), set(10)], { repMin: 8, repMax: 15 })]);
    expect(within).toMatchObject({ action: 'increase_reps', targetReps: 11, reasonCode: 'within_range_reps', repMin: 8, repMax: 15 });
    const below = decide(rx('superman', { repMin: 8, repMax: 15 }), [hist([set(9), set(6)], { repMin: 8, repMax: 15 })]);
    expect(below).toMatchObject({ action: 'maintain', targetReps: 8, reasonCode: 'below_range_reps' });
  });
});

describe('progression — timed exercises', () => {
  const holds = (secs: number[], target: number) => [hist(secs.map((d) => set(null, null, { durationSeconds: d, targetSeconds: target })), { targetSeconds: target })];

  it('adds 5 s below a minute and 10 s above, capped at 120 s', () => {
    expect(decide(rx('plank', { targetSeconds: 30 }), holds([30, 32], 30))).toMatchObject({ action: 'increase_time', targetSeconds: 35, reasonCode: 'time_target_hit' });
    expect(decide(rx('plank', { targetSeconds: 60 }), holds([60, 61], 60))).toMatchObject({ action: 'increase_time', targetSeconds: 70 });
    expect(decide(rx('plank', { targetSeconds: 115 }), holds([115, 120], 115)).targetSeconds).toBe(120);
    expect(decide(rx('plank', { targetSeconds: 120 }), holds([120, 125], 120))).toMatchObject({ action: 'maintain', reasonCode: 'time_cap_reached', targetSeconds: 120 });
  });

  it('maintains the target when a set fell short', () => {
    expect(decide(rx('plank', { targetSeconds: 45 }), holds([45, 30], 45))).toMatchObject({ action: 'maintain', targetSeconds: 45, reasonCode: 'below_target_time' });
  });

  it('progresses from the higher of the plan target and last target', () => {
    expect(decide(rx('plank', { targetSeconds: 30 }), holds([40, 40], 40)).targetSeconds).toBe(45);
  });

  it('keeps the load used for loaded carries', () => {
    const s = decide(rx('farmer_carry', { targetSeconds: 40 }), [hist([set(null, 24, { durationSeconds: 40, targetSeconds: 40 })], { targetSeconds: 40 })]);
    expect(s).toMatchObject({ action: 'increase_time', targetSeconds: 45, targetWeightKg: 24 });
  });
});

// ---------------------------------------------------------------------------- DB-backed

async function seedSession(
  userId: string,
  opts: {
    status?: 'completed' | 'abandoned' | 'in_progress';
    endedMinutesAgo: number;
    exercises: { exerciseId: string; repMin?: number | null; repMax?: number | null; targetSeconds?: number | null; sets: (Partial<HistorySet> & { completed?: boolean })[] }[];
  },
) {
  const status = opts.status ?? 'completed';
  const s = await db.one<{ id: string }>(
    `INSERT INTO workout_sessions (user_id, name, status, started_at, ended_at)
     VALUES ($1, 'Seed', $2, now() - make_interval(mins => $3 + 60), CASE WHEN $2 = 'in_progress' THEN NULL ELSE now() - make_interval(mins => $3) END)
     RETURNING id`,
    [userId, status, opts.endedMinutesAgo],
  );
  for (const [i, e] of opts.exercises.entries()) {
    const se = await db.one<{ id: string }>(
      `INSERT INTO session_exercises (session_id, user_id, exercise_id, position, rep_min, rep_max, target_seconds)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [s.id, userId, e.exerciseId, i, e.repMin ?? 8, e.repMax ?? 12, e.targetSeconds ?? null],
    );
    for (const [j, st] of e.sets.entries()) {
      const completed = st.completed ?? true;
      await db.exec(
        `INSERT INTO session_sets (session_exercise_id, session_id, user_id, set_number, reps, weight_kg, duration_seconds, rpe, target_seconds, completed, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CASE WHEN $10 THEN now() ELSE NULL END)`,
        [se.id, s.id, userId, j + 1, st.reps ?? null, st.weightKg ?? null, st.durationSeconds ?? null, st.rpe ?? null, st.targetSeconds ?? null, completed],
      );
    }
  }
  return s.id;
}

describe('suggestProgressions (recorded history)', () => {
  it('returns first_time suggestions without history, in input order', async () => {
    const user = await registerUser(server.baseUrl);
    const res = await suggestProgressions(db, user.userId!, [rx('barbell_bench_press', { targetWeightKg: 40 }), rx('plank', { targetSeconds: 30, repMin: null, repMax: null })]);
    expect(res.map((r) => [r.exerciseId, r.action])).toEqual([
      ['barbell_bench_press', 'first_time'],
      ['plank', 'first_time'],
    ]);
    expect(res[0]!.targetWeightKg).toBe(40);
    expect(await suggestProgressions(db, user.userId!, [])).toEqual([]);
  });

  it('uses only completed sets of completed sessions of this user', async () => {
    const user = await onboardedUser(server.baseUrl);
    const other = await onboardedUser(server.baseUrl);
    const uid = user.userId!;
    // Most recent completed session: all sets at the top of the range (the uncompleted set is ignored).
    await seedSession(uid, {
      endedMinutesAgo: 60 * 24,
      exercises: [{ exerciseId: 'barbell_bench_press', sets: [{ reps: 12, weightKg: 80 }, { reps: 12, weightKg: 80 }, { reps: 3, weightKg: 80, completed: false }] }],
    });
    // Newer but abandoned / still open sessions must not count.
    await seedSession(uid, { status: 'abandoned', endedMinutesAgo: 60, exercises: [{ exerciseId: 'barbell_bench_press', sets: [{ reps: 2, weightKg: 100 }] }] });
    await seedSession(uid, { status: 'in_progress', endedMinutesAgo: 0, exercises: [{ exerciseId: 'barbell_bench_press', sets: [{ reps: 2, weightKg: 100 }] }] });
    // Another user's history is invisible.
    await seedSession(other.userId!, { endedMinutesAgo: 10, exercises: [{ exerciseId: 'barbell_bench_press', sets: [{ reps: 4, weightKg: 120 }] }] });

    const [s] = await suggestProgressions(db, uid, [rx('barbell_bench_press')]);
    expect(s).toMatchObject({ action: 'increase_weight', targetWeightKg: 82.5 });
    const [o] = await suggestProgressions(db, other.userId!, [rx('barbell_bench_press')]);
    expect(o).toMatchObject({ action: 'maintain', reasonCode: 'below_range', targetWeightKg: 120 });
  });

  it('deloads from SQL history after two short sessions, using the newest two only', async () => {
    const user = await onboardedUser(server.baseUrl);
    const uid = user.userId!;
    await seedSession(uid, { endedMinutesAgo: 60 * 72, exercises: [{ exerciseId: 'barbell_back_squat', sets: [{ reps: 12, weightKg: 100 }] }] });
    await seedSession(uid, { endedMinutesAgo: 60 * 48, exercises: [{ exerciseId: 'barbell_back_squat', sets: [{ reps: 6, weightKg: 100 }] }] });
    await seedSession(uid, { endedMinutesAgo: 60 * 24, exercises: [{ exerciseId: 'barbell_back_squat', sets: [{ reps: 7, weightKg: 100 }] }] });
    const [s] = await suggestProgressions(db, uid, [rx('barbell_back_squat')]);
    expect(s).toMatchObject({ action: 'deload', targetWeightKg: 90 });
  });

  it('reads equipment, injuries and age from the profile', async () => {
    const teen = await onboardedUser(server.baseUrl, { age_years: 15, equipment: ['pull_up_bar'] });
    await seedSession(teen.userId!, { endedMinutesAgo: 30, exercises: [{ exerciseId: 'pull_up', repMin: 6, repMax: 12, sets: [{ reps: 12 }, { reps: 12 }] }] });
    const [s] = await suggestProgressions(db, teen.userId!, [rx('pull_up', { repMin: 6, repMax: 12 })]);
    expect(s).toMatchObject({ action: 'increase_reps', repMin: 8, repMax: 14 });
    await setProfile(teen.userId!, { age_years: 30, equipment: ['pull_up_bar'] });
    const [adult] = await suggestProgressions(db, teen.userId!, [rx('pull_up', { repMin: 6, repMax: 12 })]);
    expect(adult).toMatchObject({ action: 'try_harder_variation', harderVariationId: 'muscle_up' });
  });

  it('progresses timed holds from recorded durations', async () => {
    const user = await onboardedUser(server.baseUrl);
    await seedSession(user.userId!, {
      endedMinutesAgo: 30,
      exercises: [{ exerciseId: 'plank', repMin: null, repMax: null, targetSeconds: 45, sets: [{ durationSeconds: 50, targetSeconds: 45 }, { durationSeconds: 45, targetSeconds: 45 }] }],
    });
    const [s] = await suggestProgressions(db, user.userId!, [rx('plank', { repMin: null, repMax: null, targetSeconds: 45 })]);
    expect(s).toMatchObject({ action: 'increase_time', targetSeconds: 50 });
  });
});

describe('holdSuggestion (easier readiness day)', () => {
  const base = { exerciseId: 'barbell_bench_press', repMin: 6, repMax: 10, targetSeconds: null, harderVariationId: null, targetReps: null, params: {} };

  it('turns a weight increase back into last time\'s load', () => {
    const inc = { ...base, action: 'increase_weight' as const, targetWeightKg: 62.5, targetReps: 6, reasonCode: 'hit_top_of_range', params: { fromKg: 60, toKg: 62.5 } };
    expect(holdSuggestion(inc)).toMatchObject({ action: 'maintain', targetWeightKg: 60, targetReps: 6, reasonCode: 'readiness_hold' });
  });

  it('holds reps, time and harder variations', () => {
    const reps = { ...base, action: 'increase_reps' as const, targetWeightKg: 60, targetReps: 9, reasonCode: 'within_range' };
    expect(holdSuggestion(reps)).toMatchObject({ action: 'maintain', targetReps: 8, targetWeightKg: 60, reasonCode: 'readiness_hold' });
    const time = { ...base, repMin: null, repMax: null, action: 'increase_time' as const, targetWeightKg: null, targetSeconds: 40, reasonCode: 'time_target_hit', params: { fromSeconds: 30, toSeconds: 40 } };
    expect(holdSuggestion(time)).toMatchObject({ action: 'maintain', targetSeconds: 30 });
    const harder = { ...base, action: 'try_harder_variation' as const, targetWeightKg: null, harderVariationId: 'diamond_push_up', reasonCode: 'mastered_try_harder' };
    expect(holdSuggestion(harder)).toMatchObject({ action: 'maintain', harderVariationId: null });
  });

  it('leaves holds, deloads and first-time targets alone — it never raises anything', () => {
    for (const action of ['maintain', 'deload', 'first_time'] as const) {
      const s = { ...base, action, targetWeightKg: 55, reasonCode: 'x' };
      expect(holdSuggestion(s)).toEqual(s);
    }
  });
});
