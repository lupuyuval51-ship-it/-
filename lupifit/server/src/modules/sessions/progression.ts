/**
 * Progressive-overload suggestions (CONTRACT). Derived only from the user's recorded,
 * completed sets. Used by sessions (targets when starting a workout) and by workouts
 * ("apply progression" on a plan). Owned by the sessions module.
 *
 * The decision itself (`decideProgression`) is a pure function of the prescription,
 * the exercise, the user's last two performances and their profile context, so every
 * branch can be unit-tested without a database.
 */
import { ADULT_AGE, type Equipment, type InjuryArea } from '@shared/constants';
import type { ProgressionSuggestionDTO } from '@shared/types';
import type { Sql } from '../../db/pool';
import { getExerciseMap, type ExerciseRecord } from '../exercises/repository';
import { currentAge } from '../profile/repository';

export interface PrescriptionInput {
  exerciseId: string;
  repMin: number | null;
  repMax: number | null;
  targetSeconds: number | null;
  targetWeightKg: number | null;
}

/** One completed set of a past session. */
export interface HistorySet {
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  rpe: number | null;
  targetSeconds: number | null;
}

/** The user's performance of one exercise in one completed session. */
export interface HistorySession {
  sessionId: string;
  repMin: number | null;
  repMax: number | null;
  targetSeconds: number | null;
  sets: HistorySet[];
}

export interface ProgressionContext {
  isMinor: boolean;
  equipment: Equipment[];
  injuries: InjuryArea[];
  avoidExerciseIds: string[];
}

/** Defaults used when neither the plan nor the history defines a range. */
export const DEFAULT_RANGES = {
  weight_reps: { repMin: 8, repMax: 12 },
  reps: { repMin: 8, repMax: 15 },
  timeSeconds: 30,
} as const;

export const DEFAULT_LOAD_INCREMENT_KG = 2.5;
/** Bodyweight rep targets never go above this; beyond it a harder variation makes more sense. */
export const MAX_BODYWEIGHT_REPS = 30;
/** Timed holds are progressed up to this length; longer targets are kept, not increased. */
export const MAX_PROGRESSED_SECONDS = 120;
/** Sets within this fraction of the session's heaviest load count as working sets (logged warm-ups are ignored). */
const WORKING_SET_RATIO = 0.9;
const HIGH_RPE = 9;

const round2 = (n: number) => Math.round(n * 100) / 100;
const roundToStep = (value: number, step: number) => round2(Math.round(value / step) * step);

function keepTargets(input: PrescriptionInput): ProgressionSuggestionDTO {
  return {
    exerciseId: input.exerciseId,
    action: 'first_time',
    targetWeightKg: input.targetWeightKg,
    repMin: input.repMin,
    repMax: input.repMax,
    targetSeconds: input.targetSeconds,
    reasonCode: 'no_history',
    harderVariationId: null,
    targetReps: null,
  };
}

function heaviest(sets: HistorySet[]): number | null {
  let best: number | null = null;
  for (const s of sets) if (s.weightKg != null && s.weightKg > 0 && (best == null || s.weightKg > best)) best = s.weightKg;
  return best;
}

/** Sets performed at (or near) the session's heaviest load; all sets when no load was recorded. */
function workingSets(sets: HistorySet[]): HistorySet[] {
  const top = heaviest(sets);
  if (top == null) return sets;
  return sets.filter((s) => (s.weightKg ?? 0) >= top * WORKING_SET_RATIO);
}

function repRange(range: { repMin: number | null; repMax: number | null }, fallback: { repMin: number; repMax: number }) {
  const repMin = range.repMin ?? (range.repMax != null ? Math.min(range.repMax, fallback.repMin) : fallback.repMin);
  const repMax = Math.max(repMin, range.repMax ?? fallback.repMax);
  return { repMin, repMax };
}

/** First harder alternative the user can actually do (equipment, injuries, avoid list, minors). */
export function findHarderVariation(
  exercise: ExerciseRecord,
  catalog: Map<string, ExerciseRecord>,
  ctx: ProgressionContext,
): ExerciseRecord | null {
  for (const id of exercise.harderAlternatives) {
    const alt = catalog.get(id);
    if (!alt) continue;
    if (!alt.equipment.every((q) => ctx.equipment.includes(q))) continue;
    if (alt.contraindications.some((c) => ctx.injuries.includes(c))) continue;
    if (ctx.avoidExerciseIds.includes(alt.id)) continue;
    if (ctx.isMinor && alt.difficulty === 'advanced') continue;
    return alt;
  }
  return null;
}

function decideWeightReps(input: PrescriptionInput, exercise: ExerciseRecord, history: HistorySession[], ctx: ProgressionContext): ProgressionSuggestionDTO {
  const [last, previous] = history;
  const lastSets = (last?.sets ?? []).filter((s) => s.reps != null);
  if (!last || lastSets.length === 0) return keepTargets(input);
  const { repMin, repMax } = repRange(
    { repMin: input.repMin ?? (input.repMax == null ? last.repMin : null), repMax: input.repMax ?? (input.repMin == null ? last.repMax : null) },
    DEFAULT_RANGES.weight_reps,
  );
  const out: ProgressionSuggestionDTO = { ...keepTargets(input), repMin, repMax };
  const working = heaviest(lastSets);
  if (working == null) return { ...out, action: 'maintain', reasonCode: 'no_weight_recorded' };

  const increment = exercise.loadIncrementKg && exercise.loadIncrementKg > 0 ? exercise.loadIncrementKg : DEFAULT_LOAD_INCREMENT_KG;
  const lastWorking = workingSets(lastSets);
  const belowMin = (sets: HistorySet[]) => sets.some((s) => (s.reps ?? 0) < repMin);

  const previousSets = (previous?.sets ?? []).filter((s) => s.reps != null);
  if (previousSets.length > 0 && belowMin(lastWorking) && belowMin(workingSets(previousSets))) {
    let toKg = roundToStep(working * 0.9, increment);
    if (toKg >= working) toKg = round2(working - increment);
    if (toKg > 0) {
      return { ...out, action: 'deload', targetWeightKg: toKg, reasonCode: 'missed_reps_twice', params: { fromKg: working, toKg } };
    }
  }

  const allTop = lastWorking.every((s) => (s.reps ?? 0) >= repMax);
  const effortOk = lastWorking.every((s) => s.rpe == null || s.rpe <= HIGH_RPE);
  if (allTop && effortOk) {
    // Always exactly one increment; minors are explicitly clamped so a rounding step can never exceed it.
    let toKg = roundToStep(working + increment, 0.25);
    if (ctx.isMinor) toKg = Math.min(toKg, round2(working + increment));
    return {
      ...out,
      action: 'increase_weight',
      targetWeightKg: toKg,
      targetReps: repMin,
      reasonCode: 'hit_top_of_range',
      params: { fromKg: working, toKg },
    };
  }
  if (allTop) {
    return { ...out, action: 'maintain', targetWeightKg: working, targetReps: repMax, reasonCode: 'high_rpe', params: { weightKg: working } };
  }
  if (belowMin(lastWorking)) {
    return { ...out, action: 'maintain', targetWeightKg: working, targetReps: repMin, reasonCode: 'below_range', params: { weightKg: working, repMin } };
  }
  const fewest = Math.min(...lastWorking.map((s) => s.reps ?? 0));
  const targetReps = Math.min(repMax, fewest + 1);
  return { ...out, action: 'increase_reps', targetWeightKg: working, targetReps, reasonCode: 'within_range', params: { weightKg: working, reps: targetReps } };
}

function decideReps(
  input: PrescriptionInput,
  exercise: ExerciseRecord,
  history: HistorySession[],
  ctx: ProgressionContext,
  catalog: Map<string, ExerciseRecord>,
): ProgressionSuggestionDTO {
  const [last] = history;
  const sets = (last?.sets ?? []).filter((s) => s.reps != null);
  if (!last || sets.length === 0) return keepTargets(input);
  // Use whichever range is more advanced — the plan's or the one used last time — so progress is cumulative.
  const fromInput = repRange(input, DEFAULT_RANGES.reps);
  const fromLast = last.repMax != null ? repRange(last, DEFAULT_RANGES.reps) : null;
  const { repMin, repMax } = fromLast && (input.repMax == null || fromLast.repMax > fromInput.repMax) ? fromLast : fromInput;
  const out: ProgressionSuggestionDTO = { ...keepTargets(input), repMin, repMax };

  if (sets.every((s) => (s.reps ?? 0) >= repMax)) {
    const harder = findHarderVariation(exercise, catalog, ctx);
    if (harder) {
      return {
        ...out,
        action: 'try_harder_variation',
        harderVariationId: harder.id,
        reasonCode: 'mastered_try_harder',
        params: { exerciseId: harder.id, nameEn: harder.name.en, nameHe: harder.name.he },
      };
    }
    if (repMax >= MAX_BODYWEIGHT_REPS) {
      return { ...out, action: 'maintain', targetReps: repMax, reasonCode: 'rep_cap_reached', params: { reps: repMax } };
    }
    const newMin = Math.min(MAX_BODYWEIGHT_REPS, repMin + 2);
    const newMax = Math.min(MAX_BODYWEIGHT_REPS, repMax + 2);
    return { ...out, action: 'increase_reps', repMin: newMin, repMax: newMax, reasonCode: 'raise_rep_target', params: { repMin: newMin, repMax: newMax } };
  }
  if (sets.some((s) => (s.reps ?? 0) < repMin)) {
    return { ...out, action: 'maintain', targetReps: repMin, reasonCode: 'below_range_reps', params: { repMin } };
  }
  const fewest = Math.min(...sets.map((s) => s.reps ?? 0));
  const targetReps = Math.min(repMax, fewest + 1);
  return { ...out, action: 'increase_reps', targetReps, reasonCode: 'within_range_reps', params: { reps: targetReps } };
}

function decideTime(input: PrescriptionInput, history: HistorySession[]): ProgressionSuggestionDTO {
  const [last] = history;
  const sets = (last?.sets ?? []).filter((s) => s.durationSeconds != null);
  if (!last || sets.length === 0) return keepTargets(input);
  const lastTarget = Math.max(0, last.targetSeconds ?? 0, ...sets.map((s) => s.targetSeconds ?? 0));
  const target = Math.max(input.targetSeconds ?? 0, lastTarget) || DEFAULT_RANGES.timeSeconds;
  const out: ProgressionSuggestionDTO = {
    ...keepTargets(input),
    targetSeconds: target,
    targetWeightKg: heaviest(sets) ?? input.targetWeightKg,
  };
  if (!sets.every((s) => (s.durationSeconds ?? 0) >= target)) {
    return { ...out, action: 'maintain', reasonCode: 'below_target_time', params: { seconds: target } };
  }
  if (target >= MAX_PROGRESSED_SECONDS) {
    return { ...out, action: 'maintain', reasonCode: 'time_cap_reached', params: { seconds: target } };
  }
  const to = Math.min(MAX_PROGRESSED_SECONDS, target + (target < 60 ? 5 : 10));
  return { ...out, action: 'increase_time', targetSeconds: to, reasonCode: 'time_target_hit', params: { fromSeconds: target, toSeconds: to } };
}

/**
 * On an "easier" readiness day nothing is increased: weight, reps, time and harder variations are held at
 * what the user did last time. Holds, deloads and first-time targets are already conservative and unchanged.
 */
export function holdSuggestion(s: ProgressionSuggestionDTO): ProgressionSuggestionDTO {
  switch (s.action) {
    case 'increase_weight': {
      const from = typeof s.params?.fromKg === 'number' ? s.params.fromKg : s.targetWeightKg;
      return { ...s, action: 'maintain', targetWeightKg: from, targetReps: s.repMin, reasonCode: 'readiness_hold', params: {} };
    }
    case 'increase_reps':
      return {
        ...s,
        action: 'maintain',
        targetReps: s.targetReps != null ? Math.max(s.repMin ?? 1, s.targetReps - 1) : null,
        reasonCode: 'readiness_hold',
        params: {},
      };
    case 'increase_time': {
      const from = typeof s.params?.fromSeconds === 'number' ? s.params.fromSeconds : s.targetSeconds;
      return { ...s, action: 'maintain', targetSeconds: from, reasonCode: 'readiness_hold', params: {} };
    }
    case 'try_harder_variation':
      return { ...s, action: 'maintain', harderVariationId: null, reasonCode: 'readiness_hold', params: {} };
    default:
      return s;
  }
}

/** Pure decision for one exercise. `history` is newest first (only the last two sessions are used). */
export function decideProgression(
  input: PrescriptionInput,
  exercise: ExerciseRecord | null,
  history: HistorySession[],
  ctx: ProgressionContext,
  catalog: Map<string, ExerciseRecord>,
): ProgressionSuggestionDTO {
  if (!exercise || history.length === 0) return keepTargets(input);
  switch (exercise.trackingType) {
    case 'weight_reps':
      return decideWeightReps(input, exercise, history, ctx);
    case 'reps':
      return decideReps(input, exercise, history, ctx, catalog);
    case 'time':
      return decideTime(input, history);
  }
}

interface HistoryRow {
  exercise_id: string;
  session_id: string;
  rep_min: number | null;
  rep_max: number | null;
  ex_target_seconds: number | null;
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
  rpe: number | null;
  target_seconds: number | null;
}

/** Completed sets of each exercise in the user's two most recent completed sessions containing it (newest first). */
export async function loadProgressionHistory(sql: Sql, userId: string, exerciseIds: string[]): Promise<Map<string, HistorySession[]>> {
  const out = new Map<string, HistorySession[]>();
  if (exerciseIds.length === 0) return out;
  const rows = await sql.many<HistoryRow>(
    `WITH perf AS (
       SELECT se.exercise_id, ws.id AS session_id, ws.ended_at
         FROM workout_sessions ws
         JOIN session_exercises se ON se.session_id = ws.id
        WHERE ws.user_id = $1 AND ws.status = 'completed' AND se.exercise_id = ANY($2::text[])
          AND EXISTS (SELECT 1 FROM session_sets ss WHERE ss.session_exercise_id = se.id AND ss.completed)
        GROUP BY se.exercise_id, ws.id, ws.ended_at
     ), ranked AS (
       SELECT exercise_id, session_id, ended_at,
              row_number() OVER (PARTITION BY exercise_id ORDER BY ended_at DESC, session_id) AS rk
         FROM perf
     )
     SELECT r.exercise_id, r.session_id, se.rep_min, se.rep_max, se.target_seconds AS ex_target_seconds,
            ss.reps, ss.weight_kg, ss.duration_seconds, ss.rpe, ss.target_seconds
       FROM ranked r
       JOIN session_exercises se ON se.session_id = r.session_id AND se.exercise_id = r.exercise_id
       JOIN session_sets ss ON ss.session_exercise_id = se.id AND ss.completed
      WHERE r.rk <= 2
      ORDER BY r.exercise_id, r.rk, se.position, ss.set_number`,
    [userId, exerciseIds],
  );
  for (const row of rows) {
    const list = out.get(row.exercise_id) ?? [];
    let session = list.find((s) => s.sessionId === row.session_id);
    if (!session) {
      session = { sessionId: row.session_id, repMin: row.rep_min, repMax: row.rep_max, targetSeconds: row.ex_target_seconds, sets: [] };
      list.push(session);
      out.set(row.exercise_id, list);
    }
    session.sets.push({
      reps: row.reps,
      weightKg: row.weight_kg != null ? Number(row.weight_kg) : null,
      durationSeconds: row.duration_seconds,
      rpe: row.rpe != null ? Number(row.rpe) : null,
      targetSeconds: row.target_seconds,
    });
  }
  return out;
}

export async function loadProgressionContext(sql: Sql, userId: string): Promise<ProgressionContext> {
  const row = await sql.maybeOne<{
    equipment: Equipment[] | null;
    injuries: InjuryArea[] | null;
    avoid_exercise_ids: string[] | null;
    age_years: number | null;
    age_recorded_on: string | null;
    timezone: string;
  }>(
    `SELECT p.equipment, p.injuries, p.avoid_exercise_ids, p.age_years, p.age_recorded_on, u.timezone
       FROM users u LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = $1`,
    [userId],
  );
  const age = row ? currentAge(row) : null;
  return {
    isMinor: age != null && age < ADULT_AGE,
    equipment: row?.equipment ?? [],
    injuries: row?.injuries ?? [],
    avoidExerciseIds: row?.avoid_exercise_ids ?? [],
  };
}

const NO_CONTEXT: ProgressionContext = { isMinor: false, equipment: [], injuries: [], avoidExerciseIds: [] };

/** One suggestion per input exercise (same order). */
export async function suggestProgressions(sql: Sql, userId: string, inputs: PrescriptionInput[]): Promise<ProgressionSuggestionDTO[]> {
  if (inputs.length === 0) return [];
  const ids = Array.from(new Set(inputs.map((i) => i.exerciseId)));
  const history = await loadProgressionHistory(sql, userId, ids);
  const ctx = history.size > 0 ? await loadProgressionContext(sql, userId) : NO_CONTEXT;
  const catalog = await getExerciseMap();
  return inputs.map((i) => decideProgression(i, catalog.get(i.exerciseId) ?? null, history.get(i.exerciseId) ?? [], ctx, catalog));
}
