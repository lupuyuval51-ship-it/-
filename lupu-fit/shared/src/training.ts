/** Deterministic training engines. Pure TypeScript, no I/O. */
import {
  type AgeBucket, type Difficulty, type Equipment, type ExerciseCategory, type Goal, type InjuryArea,
  type Muscle, type MovementPattern, type ReadinessState, type WorkoutMode, LIMITS,
} from './enums.js';
import {
  type AgeRelevantExercise, type Prescription, ageBucket, clampPrescriptionForAge, isExerciseAllowedForAge,
} from './age.js';

export interface ExerciseDef extends AgeRelevantExercise {
  nameHe: string;
  nameEn: string;
  primary: readonly Muscle[];
  secondary: readonly Muscle[];
  equipment: readonly Equipment[];
  contraindications: readonly InjuryArea[];
  easierAlternatives: readonly string[];
  harderAlternatives: readonly string[];
}

/* ------------------------------------------------------------------ 1RM */

/** Epley estimate, only valid for 1..12 reps. Returns null outside that range or for non-positive weight. */
export function epley1RM(weightKg: number, reps: number): number | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0 || !Number.isInteger(reps) || reps < 1 || reps > 12) return null;
  return weightKg * (1 + reps / 30);
}

export function roundToIncrement(kg: number, incrementKg: number): number {
  return Math.round(kg / incrementKg) * incrementKg;
}

/** %1RM load. Returns null for minors (no %1RM-derived loads are ever prescribed to under-18s). */
export function loadFromPercentOneRm(oneRmKg: number, percent: number, bucket: AgeBucket, incrementKg = 2.5): number | null {
  if (bucket === 'minor') return null;
  if (oneRmKg <= 0 || percent <= 0 || percent > 100) return null;
  return roundToIncrement((oneRmKg * percent) / 100, incrementKg);
}

/* ------------------------------------------------------------ readiness */

export interface ReadinessCheckin {
  sleep: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  soreness: 1 | 2 | 3 | 4 | 5;
  pain: boolean;
}

/** score = sleep + energy + (6 - soreness), 3..15. Pain never yields "normal". */
export function readinessState(c: ReadinessCheckin): ReadinessState {
  const score = c.sleep + c.energy + (6 - c.soreness);
  if (score <= 5) return 'rest';
  if (score <= 9 || c.pain) return 'easier';
  return 'normal';
}

export function applyReadiness(p: Prescription, state: ReadinessState): Prescription {
  if (state === 'normal') return { ...p };
  const rest = state === 'rest';
  const out: Prescription = { ...p };
  out.rpe = Math.max(LIMITS.rpe.min, Math.min(p.rpe, p.rpe - (rest ? 2 : 1)));
  out.sets = Math.max(LIMITS.sets.min, Math.min(p.sets, Math.ceil(p.sets * (rest ? 0.5 : 0.8))));
  out.restSec = Math.max(p.restSec, Math.min(LIMITS.restSec.max, p.restSec + 15));
  if (p.loadKg !== null) out.loadKg = Math.min(p.loadKg, roundToIncrement(p.loadKg * (rest ? 0.8 : 0.9), 0.5));
  return out;
}

export interface SafetyContext {
  age: number;
  readiness: ReadinessState;
  externallyLoaded: boolean;
}

/** Composition of independently monotone clamps is monotone. */
export function applyAllSafety(base: Prescription, ctx: SafetyContext): Prescription {
  const bucket = ageBucket(ctx.age);
  const aged = clampPrescriptionForAge(base, bucket, ctx.externallyLoaded);
  const ready = applyReadiness(aged, ctx.readiness);
  // Final belt-and-braces guarantee of the monotonicity theorem.
  return {
    ...ready,
    rpe: Math.min(base.rpe, ready.rpe),
    sets: Math.min(base.sets, ready.sets),
    restSec: Math.max(base.restSec, ready.restSec),
    loadKg: base.loadKg === null || ready.loadKg === null ? ready.loadKg : Math.min(base.loadKg, ready.loadKg),
  };
}

/* ----------------------------------------------------------- swap engine */

export interface SwapContext {
  injuries: readonly InjuryArea[];
  avoidIds: readonly string[];
  /** Equipment the user can use. 'none' is always implicitly available. */
  available: readonly Equipment[];
  bucket: AgeBucket;
  mode: WorkoutMode;
  maxDifficulty: Difficulty;
}

/** Fixed apparatus that does not make a workout "weights" mode. */
export const BODYWEIGHT_APPARATUS: readonly Equipment[] = ['pullup_bar', 'dip_station'];

const DIFF_RANK: Record<Difficulty, number> = { beginner: 0, intermediate: 1, advanced: 2 };

export function isExerciseSafe(ex: ExerciseDef, ctx: SwapContext): boolean {
  if (ctx.avoidIds.includes(ex.id)) return false;
  if (ex.contraindications.some((c) => ctx.injuries.includes(c))) return false;
  if (!isExerciseAllowedForAge(ex, ctx.bucket)) return false;
  if (DIFF_RANK[ex.difficulty] > DIFF_RANK[ctx.maxDifficulty]) return false;
  const needed = ex.equipment.filter((e) => e !== 'none');
  // Bodyweight mode never receives gear. Fixed park apparatus (pull-up bar, dip station) is allowed only if owned/available.
  if (ctx.mode === 'bodyweight' && needed.some((e) => !BODYWEIGHT_APPARATUS.includes(e))) return false;
  return needed.every((e) => ctx.available.includes(e));
}

export type SwapResult =
  | { kind: 'kept'; exercise: ExerciseDef }
  | { kind: 'swapped'; exercise: ExerciseDef; from: string }
  | { kind: 'dropped'; from: string };

/** Transitive BFS over easierAlternatives; the replacement must share ≥1 primary muscle. */
export function resolveSafeExercise(ex: ExerciseDef, ctx: SwapContext, byId: ReadonlyMap<string, ExerciseDef>): SwapResult {
  if (isExerciseSafe(ex, ctx)) return { kind: 'kept', exercise: ex };
  const seen = new Set<string>([ex.id]);
  const queue: string[] = [...ex.easierAlternatives];
  while (queue.length > 0) {
    const id = queue.shift();
    if (id === undefined || seen.has(id)) continue;
    seen.add(id);
    const cand = byId.get(id);
    if (!cand) continue;
    if (isExerciseSafe(cand, ctx) && cand.primary.some((m) => ex.primary.includes(m))) {
      return { kind: 'swapped', exercise: cand, from: ex.id };
    }
    queue.push(...cand.easierAlternatives);
  }
  return { kind: 'dropped', from: ex.id };
}

/** Ready-workout visibility: hide if >40% of items were lost or fewer than 3 survive. */
export function isReadyWorkoutVisible(originalCount: number, survivingCount: number): boolean {
  if (survivingCount < 3) return false;
  return (originalCount - survivingCount) / originalCount <= 0.4;
}

/* ------------------------------------------------------------ plate calc */

export interface PlateResult {
  perSide: number[];
  achievedKg: number;
  remainderKg: number;
}

export function plateCalculator(
  targetKg: number, barKg = 20, plates: readonly number[] = [25, 20, 15, 10, 5, 2.5, 1.25],
): PlateResult {
  if (!Number.isFinite(targetKg) || targetKg < barKg) return { perSide: [], achievedKg: Math.max(0, barKg), remainderKg: 0 };
  let perSideTarget = (targetKg - barKg) / 2;
  const perSide: number[] = [];
  for (const p of [...plates].sort((a, b) => b - a)) {
    while (perSideTarget + 1e-9 >= p) { perSide.push(p); perSideTarget -= p; }
  }
  const achievedKg = barKg + 2 * perSide.reduce((a, b) => a + b, 0);
  return { perSide, achievedKg, remainderKg: Math.round((targetKg - achievedKg) * 100) / 100 };
}

/* ------------------------------------------------------------ progression */

export interface SessionPerformance {
  loadKg: number | null;
  repsPerSet: readonly number[];
  repsMin: number;
  repsMax: number;
}

export type ProgressionAction = 'increase' | 'hold' | 'deload';
export interface ProgressionResult { action: ProgressionAction; loadKg: number | null }

/**
 * history: most recent LAST. +1 increment after hitting top of range in all sets in the two latest sessions;
 * ×0.9 deload after missing the bottom of range twice; frozen on "easier"/"rest" readiness.
 * Always at most ONE increment per call (seniors included).
 */
export function nextProgression(
  history: readonly SessionPerformance[], readiness: ReadinessState, incrementKg = 2.5,
): ProgressionResult {
  const last = history[history.length - 1];
  if (!last || last.loadKg === null) return { action: 'hold', loadKg: last?.loadKg ?? null };
  if (readiness !== 'normal') return { action: 'hold', loadKg: last.loadKg };
  const prev = history[history.length - 2];
  const hitTop = (s: SessionPerformance) => s.repsPerSet.length > 0 && s.repsPerSet.every((r) => r >= s.repsMax);
  const missed = (s: SessionPerformance) => s.repsPerSet.some((r) => r < s.repsMin);
  if (prev && prev.loadKg === last.loadKg && hitTop(prev) && hitTop(last)) {
    return { action: 'increase', loadKg: last.loadKg + incrementKg };
  }
  if (prev && missed(prev) && missed(last)) {
    return { action: 'deload', loadKg: Math.max(0, roundToIncrement(last.loadKg * 0.9, incrementKg)) };
  }
  return { action: 'hold', loadKg: last.loadKg };
}

/* ----------------------------------------------------------- time budget */

export interface TimedItem { sets: number; repsMax: number; durationSec: number | null; restSec: number }

const SEC_PER_REP = 3;
const TRANSITION_SEC = 60;
export const WARMUP_MIN = 7;

export function estimateMinutes(items: readonly TimedItem[]): number {
  let sec = 0;
  for (const it of items) {
    const work = it.durationSec ?? it.repsMax * SEC_PER_REP;
    sec += it.sets * (work + it.restSec) + TRANSITION_SEC;
  }
  return Math.round((WARMUP_MIN * 60 + sec) / 60);
}

/* --------------------------------------------------------------- generator */

export type SplitDay = 'full_a' | 'full_b' | 'full_c' | 'upper' | 'lower' | 'push' | 'pull' | 'legs';

export function splitForDays(requestedDays: number): { days: SplitDay[]; recoveryNote: boolean } {
  const d = Math.min(Math.max(Math.trunc(requestedDays), LIMITS.daysPerWeek.min), LIMITS.daysPerWeek.max);
  const recoveryNote = d === 7;
  const lifting = Math.min(d, LIMITS.maxLiftingDays);
  const table: Record<number, SplitDay[]> = {
    1: ['full_a'],
    2: ['full_a', 'full_b'],
    3: ['full_a', 'full_b', 'full_c'],
    4: ['upper', 'lower', 'upper', 'lower'],
    5: ['push', 'pull', 'legs', 'upper', 'lower'],
    6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
  };
  return { days: table[lifting] ?? ['full_a'], recoveryNote };
}

interface Slot { patterns: readonly MovementPattern[]; muscles?: readonly Muscle[] }
const SLOT_TEMPLATES: Record<SplitDay, readonly Slot[]> = {
  full_a: [{ patterns: ['squat'] }, { patterns: ['horizontal_push'] }, { patterns: ['horizontal_pull'] }, { patterns: ['hinge'] }, { patterns: ['core_stability', 'core_flexion'] }],
  full_b: [{ patterns: ['hinge', 'lunge'] }, { patterns: ['vertical_push'] }, { patterns: ['vertical_pull', 'horizontal_pull'] }, { patterns: ['squat', 'lunge'] }, { patterns: ['core_rotation', 'core_stability'] }],
  full_c: [{ patterns: ['lunge', 'squat'] }, { patterns: ['horizontal_push', 'vertical_push'] }, { patterns: ['horizontal_pull'] }, { patterns: ['hinge'] }, { patterns: ['core_flexion', 'core_stability'] }],
  upper: [{ patterns: ['horizontal_push'] }, { patterns: ['horizontal_pull'] }, { patterns: ['vertical_push'] }, { patterns: ['vertical_pull'] }, { patterns: ['elbow_flexion'] }, { patterns: ['elbow_extension'] }],
  lower: [{ patterns: ['squat'] }, { patterns: ['hinge'] }, { patterns: ['lunge'] }, { patterns: ['calf_raise'] }, { patterns: ['core_stability', 'core_flexion'] }],
  push: [{ patterns: ['horizontal_push'] }, { patterns: ['vertical_push'] }, { patterns: ['horizontal_push'] }, { patterns: ['shoulder_raise'] }, { patterns: ['elbow_extension'] }],
  pull: [{ patterns: ['vertical_pull'] }, { patterns: ['horizontal_pull'] }, { patterns: ['horizontal_pull'] }, { patterns: ['elbow_flexion'] }, { patterns: ['core_stability'] }],
  legs: [{ patterns: ['squat'] }, { patterns: ['hinge'] }, { patterns: ['lunge'] }, { patterns: ['calf_raise'] }, { patterns: ['core_flexion', 'core_stability'] }],
};

/** mulberry32: small deterministic PRNG so "regenerate" with a new seed gives fresh valid variety. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type GenerationNote =
  | { code: 'recovery_day_added' }
  | { code: 'exercise_swapped'; from: string; to: string }
  | { code: 'exercise_dropped'; from: string }
  | { code: 'time_trimmed'; removed: number }
  | { code: 'minor_no_deficit' }
  | { code: 'slot_unfilled'; day: SplitDay };

export interface GeneratorInput {
  age: number;
  goal: Goal;
  experience: Difficulty;
  daysPerWeek: number;
  sessionMinutes: number;
  equipment: readonly Equipment[];
  injuries: readonly InjuryArea[];
  avoidIds: readonly string[];
  mode: WorkoutMode;
  seed: number;
}

export interface PlannedExercise { exerciseId: string; prescription: Prescription }
export interface PlannedDay { day: SplitDay; exercises: PlannedExercise[]; estimatedMinutes: number }
export interface GeneratedPlan { days: PlannedDay[]; notes: GenerationNote[] }

const GOAL_BASE: Record<Goal, { sets: number; repsMin: number; repsMax: number; rpe: number; restSec: number }> = {
  strength: { sets: 4, repsMin: 3, repsMax: 6, rpe: 8, restSec: 150 },
  muscle_gain: { sets: 3, repsMin: 6, repsMax: 12, rpe: 8, restSec: 90 },
  fat_loss: { sets: 3, repsMin: 10, repsMax: 15, rpe: 7.5, restSec: 60 },
  general_fitness: { sets: 3, repsMin: 8, repsMax: 12, rpe: 7.5, restSec: 75 },
  athletic_performance: { sets: 3, repsMin: 5, repsMax: 8, rpe: 7.5, restSec: 90 },
};

const TIMED_CATEGORIES: readonly ExerciseCategory[] = ['duration', 'isometric', 'mobility', 'stretch'];

export function basePrescription(goal: Goal, experience: Difficulty, ex: ExerciseDef): Prescription {
  const g = GOAL_BASE[goal];
  const beginner = experience === 'beginner';
  const timed = TIMED_CATEGORIES.includes(ex.category);
  return {
    sets: Math.max(LIMITS.sets.min, beginner ? g.sets - 1 : g.sets),
    repsMin: timed ? 1 : g.repsMin,
    repsMax: timed ? 1 : g.repsMax,
    rpe: beginner ? Math.max(LIMITS.rpe.min, g.rpe - 1) : g.rpe,
    restSec: g.restSec,
    loadKg: null,
    durationSec: timed ? 30 : null,
  };
}

export function generatePlan(input: GeneratorInput, catalog: readonly ExerciseDef[]): GeneratedPlan {
  const bucket = ageBucket(input.age);
  const byId = new Map(catalog.map((e) => [e.id, e]));
  const ctx: SwapContext = {
    injuries: input.injuries, avoidIds: input.avoidIds, available: input.equipment,
    bucket, mode: input.mode, maxDifficulty: input.experience,
  };
  const rand = seededRandom(input.seed);
  const { days, recoveryNote } = splitForDays(input.daysPerWeek);
  const notes: GenerationNote[] = [];
  if (recoveryNote) notes.push({ code: 'recovery_day_added' });

  const planned: PlannedDay[] = days.map((day, dayIdx) => {
    const used = new Set<string>();
    const exercises: PlannedExercise[] = [];
    for (const slot of SLOT_TEMPLATES[day]) {
      const pool = catalog.filter((e) => slot.patterns.includes(e.pattern) && !used.has(e.id));
      // Seeded shuffle, then take the first candidate that is (or can be swapped to) a safe exercise.
      const shuffled = [...pool].map((e) => ({ e, k: rand() })).sort((a, b) => a.k - b.k || a.e.id.localeCompare(b.e.id)).map((x) => x.e);
      let chosen: ExerciseDef | null = null;
      for (const cand of shuffled) {
        const r = resolveSafeExercise(cand, ctx, byId);
        if (r.kind === 'dropped' || used.has(r.exercise.id)) continue;
        if (r.kind === 'swapped') notes.push({ code: 'exercise_swapped', from: r.from, to: r.exercise.id });
        chosen = r.exercise;
        break;
      }
      if (!chosen) { notes.push({ code: 'slot_unfilled', day }); continue; }
      used.add(chosen.id);
      const base = basePrescription(input.goal, input.experience, chosen);
      const prescription = applyAllSafety(base, { age: input.age, readiness: 'normal', externallyLoaded: chosen.externallyLoaded });
      exercises.push({ exerciseId: chosen.id, prescription });
      if (exercises.length >= LIMITS.maxExercisesPerWorkout) break;
    }
    // Fit the time budget: trim trailing accessory sets/exercises, never below 3 exercises.
    let removed = 0;
    const est = () => estimateMinutes(exercises.map((x) => ({ sets: x.prescription.sets, repsMax: x.prescription.repsMax, durationSec: x.prescription.durationSec, restSec: x.prescription.restSec })));
    while (est() > input.sessionMinutes && exercises.length > 3) { exercises.pop(); removed++; }
    while (est() > input.sessionMinutes) {
      const target = exercises.find((x) => x.prescription.sets > 2);
      if (!target) break;
      target.prescription = { ...target.prescription, sets: target.prescription.sets - 1 };
    }
    if (removed > 0) notes.push({ code: 'time_trimmed', removed });
    void dayIdx;
    return { day, exercises, estimatedMinutes: est() };
  });
  return { days: planned, notes };
}
