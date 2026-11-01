/**
 * Age buckets and monotonic prescription clamps.
 * Every function here may only make a prescription SAFER or EASIER, never harder.
 */
import type { AgeBucket, Difficulty, ExerciseCategory, MovementPattern } from './enums.js';
import { LIMITS } from './enums.js';

export interface Prescription {
  sets: number;
  repsMin: number;
  repsMax: number;
  rpe: number;
  restSec: number;
  /** null when no numeric external load is prescribed (bodyweight / duration work). */
  loadKg: number | null;
  /** seconds for duration / isometric work; null for rep-based work. */
  durationSec: number | null;
}

export interface AgeRelevantExercise {
  id: string;
  category: ExerciseCategory;
  difficulty: Difficulty;
  pattern: MovementPattern;
  /** true when an external implement (barbell, dumbbell, machine...) carries load. */
  externallyLoaded: boolean;
}

export function ageBucket(age: number): AgeBucket {
  if (!Number.isFinite(age) || age < LIMITS.age.min || age > LIMITS.age.max) {
    throw new RangeError(`age_out_of_range:${age}`);
  }
  if (age <= 17) return 'minor';
  if (age <= 49) return 'adult';
  if (age <= 64) return 'master';
  return 'senior';
}

const HIGH_IMPACT_ID = /(^|_)(jump|jumps|hop|hops|bound|bounds|skip|skips|sprint|sprints|burpee|burpees|jump_rope|high_knees|box_jump)(_|$)/;

export function isHighImpact(ex: Pick<AgeRelevantExercise, 'id' | 'category' | 'pattern'>): boolean {
  return ex.category === 'plyometric' || ex.pattern === 'jump' || HIGH_IMPACT_ID.test(ex.id);
}

export function isExerciseAllowedForAge(ex: AgeRelevantExercise, bucket: AgeBucket): boolean {
  if (bucket === 'minor' || bucket === 'senior') {
    if (ex.difficulty === 'advanced') return false;
  }
  if (bucket === 'senior' && isHighImpact(ex)) return false;
  return true;
}

export const RPE_CAP: Record<AgeBucket, number> = { minor: 7, adult: LIMITS.rpe.max, master: 8, senior: 7.5 };

/** Whether %1RM-derived loads may be computed. Never for minors. */
export function allowsPercentOneRm(bucket: AgeBucket): boolean {
  return bucket !== 'minor';
}

/**
 * Monotonic age clamp: rpe↓ (never up), sets↓ (never up), rest↑ (never down), load↓ (never up).
 * repsMin may be raised for loaded work (minor ≥6, senior ≥8); this does not raise load.
 */
export function clampPrescriptionForAge(p: Prescription, bucket: AgeBucket, externallyLoaded: boolean): Prescription {
  const out: Prescription = { ...p };
  out.rpe = Math.min(p.rpe, RPE_CAP[bucket]);
  if (bucket === 'master') out.restSec = Math.max(p.restSec, Math.min(LIMITS.restSec.max, p.restSec + 15));
  if (bucket === 'senior') {
    out.restSec = Math.max(p.restSec, Math.min(LIMITS.restSec.max, p.restSec + 30));
    out.sets = Math.min(p.sets, 4);
  }
  const floor = externallyLoaded ? (bucket === 'minor' ? 6 : bucket === 'senior' ? 8 : 0) : 0;
  if (floor > 0 && p.durationSec === null) {
    out.repsMin = Math.max(p.repsMin, floor);
    out.repsMax = Math.max(p.repsMax, out.repsMin);
  }
  return out;
}

/** Sport finisher variant to show first. Seniors start gentle. */
export function defaultFinisherVariant(bucket: AgeBucket): 'gentle' | 'bodyweight' {
  return bucket === 'senior' ? 'gentle' : 'bodyweight';
}
