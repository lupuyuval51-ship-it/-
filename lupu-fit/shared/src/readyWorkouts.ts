/**
 * Personalisation of ready workouts. A ready workout is only an exercise selection + structure;
 * every number a user sees (sets, reps, rest, RPE, load hint, which exercises survive) is computed
 * here from THEIR profile, readiness and history, so two users never get the same workout.
 */
import type { Difficulty, Equipment, Goal, InjuryArea, Place, ReadinessState, WorkoutMode } from './enums.js';
import { LIMITS } from './enums.js';
import { ageBucket, type Prescription } from './age.js';
import {
  applyAllSafety, basePrescription, estimateMinutes, isReadyWorkoutVisible, resolveSafeExercise,
  type ExerciseDef, type GenerationNote, type SwapContext,
} from './training.js';
import type { ReadyWorkoutContent, WorkoutFocus, WorkoutStyle } from './content/types.js';

export interface PersonProfile {
  age: number;
  goal: Goal;
  experience: Difficulty;
  sessionMinutes: number;
  injuries: readonly InjuryArea[];
  avoidIds: readonly string[];
  equipment: readonly Equipment[];
}

export interface PersonalizeOptions {
  readiness?: ReadinessState;
  /** Last working load per exercise id (kg). Used as the starting load, then safety-clamped. */
  lastLoads?: ReadonlyMap<string, number>;
}

export interface PersonalItem {
  exerciseId: string;
  replacedFrom: string | null;
  prescription: Prescription;
  /** index of the superset/circuit group, or null */
  group: number | null;
}
export interface PersonalWorkout {
  workoutId: string;
  visible: boolean;
  items: PersonalItem[];
  notes: GenerationNote[];
  estimatedMinutes: number;
  droppedCount: number;
}

const STYLE_TUNE: Record<WorkoutStyle, (p: Prescription, goal: Goal) => Prescription> = {
  straight: (p) => p,
  superset: (p) => ({ ...p, restSec: Math.max(30, Math.round(p.restSec * 0.6)) }),
  circuit: (p) => ({ ...p, sets: Math.min(p.sets, 3), repsMin: Math.max(p.repsMin, 10), repsMax: Math.max(p.repsMax, 15), restSec: Math.max(20, Math.round(p.restSec * 0.4)), rpe: Math.min(p.rpe, 7.5) }),
  pyramid: (p) => ({ ...p, sets: Math.max(p.sets, 4), repsMin: Math.min(p.repsMin, 6), repsMax: Math.max(p.repsMax, 12) }),
  density: (p) => ({ ...p, sets: Math.max(p.sets, 3), restSec: Math.max(30, Math.round(p.restSec * 0.5)) }),
};

function groupIndexOf(w: ReadyWorkoutContent, originalIdx: number): number | null {
  const g = w.groups.findIndex((grp) => grp.includes(originalIdx));
  return g < 0 ? null : g;
}

export function personalizeReadyWorkout(
  w: ReadyWorkoutContent,
  catalog: ReadonlyMap<string, ExerciseDef>,
  profile: PersonProfile,
  opts: PersonalizeOptions = {},
): PersonalWorkout {
  const bucket = ageBucket(profile.age);
  const readiness = opts.readiness ?? 'normal';
  const ctx: SwapContext = {
    injuries: profile.injuries, avoidIds: profile.avoidIds, available: profile.equipment,
    bucket, mode: w.mode as WorkoutMode, maxDifficulty: profile.experience,
  };
  const notes: GenerationNote[] = [];
  const items: PersonalItem[] = [];
  const used = new Set<string>();
  let dropped = 0;

  w.exerciseIds.forEach((id, idx) => {
    const ex = catalog.get(id);
    if (!ex) { dropped++; return; }
    const r = resolveSafeExercise(ex, ctx, catalog);
    if (r.kind === 'dropped' || used.has(r.exercise.id)) {
      dropped++; notes.push({ code: 'exercise_dropped', from: id }); return;
    }
    if (r.kind === 'swapped') notes.push({ code: 'exercise_swapped', from: id, to: r.exercise.id });
    used.add(r.exercise.id);
    const base = STYLE_TUNE[w.style](basePrescription(profile.goal, profile.experience, r.exercise), profile.goal);
    const hint = opts.lastLoads?.get(r.exercise.id);
    const withLoad: Prescription = r.exercise.externallyLoaded && hint !== undefined && hint > 0 ? { ...base, loadKg: hint } : base;
    const prescription = applyAllSafety(withLoad, { age: profile.age, readiness, externallyLoaded: r.exercise.externallyLoaded });
    items.push({ exerciseId: r.exercise.id, replacedFrom: r.kind === 'swapped' ? id : null, prescription, group: groupIndexOf(w, idx) });
  });

  const visible = isReadyWorkoutVisible(w.exerciseIds.length, items.length);

  // Fit the user's time budget: shave sets (never below 2), then drop trailing exercises (never below 3).
  const est = () => estimateMinutes(items.map((i) => ({ sets: i.prescription.sets, repsMax: i.prescription.repsMax, durationSec: i.prescription.durationSec, restSec: i.prescription.restSec })));
  let removed = 0;
  while (visible && est() > profile.sessionMinutes) {
    const target = [...items].reverse().find((i) => i.prescription.sets > 2);
    if (target) { target.prescription = { ...target.prescription, sets: target.prescription.sets - 1 }; continue; }
    if (items.length > 3) { items.pop(); removed++; continue; }
    break;
  }
  if (removed > 0) notes.push({ code: 'time_trimmed', removed });
  if (profile.sessionMinutes < LIMITS.sessionMinutes.min) notes.push({ code: 'time_trimmed', removed: 0 });

  return { workoutId: w.id, visible, items, notes, estimatedMinutes: est(), droppedCount: dropped };
}

/* ----------------------------------------------------------- catalog filter */

export interface ReadyFilter {
  place?: Place;
  mode?: WorkoutMode;
  /** Equipment the user owns. Empty array = bodyweight, no gear. Omit = ignore equipment. */
  ownedEquipment?: readonly Equipment[];
  focus?: WorkoutFocus;
  level?: Difficulty;
  maxMinutes?: number;
}

export function filterReadyWorkouts(list: readonly ReadyWorkoutContent[], f: ReadyFilter): ReadyWorkoutContent[] {
  return list.filter((w) => {
    if (f.place && w.place !== f.place) return false;
    if (f.mode && w.mode !== f.mode) return false;
    if (f.ownedEquipment) {
      const owned = new Set<Equipment>(f.ownedEquipment);
      if (w.place === 'gym' && f.place === 'gym') { /* gym assumes facility equipment */ } else if (!w.equipment.every((q) => owned.has(q))) return false;
    }
    if (f.focus && w.focus !== f.focus) return false;
    if (f.level && w.level !== f.level) return false;
    if (f.maxMinutes !== undefined && w.nominalMinutes > f.maxMinutes) return false;
    return true;
  });
}

/** Live counts for the muscle-chip step (counts ignore the focus filter itself). */
export function focusCounts(list: readonly ReadyWorkoutContent[], f: Omit<ReadyFilter, 'focus'>): Map<WorkoutFocus, number> {
  const m = new Map<WorkoutFocus, number>();
  for (const w of filterReadyWorkouts(list, f)) m.set(w.focus, (m.get(w.focus) ?? 0) + 1);
  return m;
}

/* ------------------------------------------------------------------ ranking */

const GOAL_STYLE_FIT: Record<Goal, Record<WorkoutStyle, number>> = {
  strength: { straight: 3, pyramid: 3, superset: 1, density: 0, circuit: -1 },
  muscle_gain: { straight: 3, superset: 3, pyramid: 2, density: 1, circuit: 0 },
  fat_loss: { circuit: 3, density: 3, superset: 2, straight: 1, pyramid: 0 },
  general_fitness: { straight: 2, superset: 2, circuit: 2, pyramid: 1, density: 1 },
  athletic_performance: { circuit: 3, density: 2, superset: 2, straight: 2, pyramid: 1 },
};
const RANK: Record<Difficulty, number> = { beginner: 0, intermediate: 1, advanced: 2 };

export interface RankedWorkout { workout: ReadyWorkoutContent; score: number; personal: PersonalWorkout }
export interface RankResult { ranked: RankedWorkout[]; hiddenCount: number }

/**
 * Orders workouts for a person. Hidden ones (age/injury adaptation removed too much) are excluded and counted
 * for the transparent "N workouts hidden due to age or injury adjustments" notice.
 */
export function rankReadyWorkouts(
  list: readonly ReadyWorkoutContent[], catalog: ReadonlyMap<string, ExerciseDef>, profile: PersonProfile,
  prefs: { recentFocus?: readonly WorkoutFocus[]; preferredFocus?: WorkoutFocus } = {}, opts: PersonalizeOptions = {},
): RankResult {
  let hiddenCount = 0;
  const ranked: RankedWorkout[] = [];
  for (const w of list) {
    const personal = personalizeReadyWorkout(w, catalog, profile, opts);
    if (!personal.visible) { hiddenCount++; continue; }
    let score = GOAL_STYLE_FIT[profile.goal][w.style];
    const dl = RANK[w.level] - RANK[profile.experience];
    score += dl === 0 ? 3 : dl < 0 ? 1 : -2;
    score -= personal.droppedCount * 2 + personal.notes.filter((n) => n.code === 'exercise_swapped').length * 0.5;
    score -= Math.abs(w.nominalMinutes - profile.sessionMinutes) / 15;
    if (prefs.preferredFocus && w.focus === prefs.preferredFocus) score += 3;
    const recentIdx = prefs.recentFocus?.indexOf(w.focus) ?? -1;
    if (recentIdx >= 0) score -= Math.max(0.5, 2 - recentIdx * 0.5); // vary muscle groups across days
    ranked.push({ workout: w, score, personal });
  }
  ranked.sort((a, b) => b.score - a.score || a.workout.id.localeCompare(b.workout.id));
  return { ranked, hiddenCount };
}
