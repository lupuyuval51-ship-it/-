/**
 * Age bands for training. Under 18 keeps its own (stricter) rules in the generator; from 50 the plan gets
 * gentler: lower top effort, longer rests, fewer sets, no explosive work from 65. These are general
 * conservative defaults, not medical advice, and they only ever make a plan easier, never harder.
 */
import { ADULT_AGE } from './constants';

export type AgeBand = 'minor' | 'adult' | 'mature' | 'senior';

export const MATURE_AGE = 50;
export const SENIOR_AGE = 65;

export function ageBand(age: number | null | undefined): AgeBand {
  if (age == null || !Number.isFinite(age)) return 'adult';
  if (age < ADULT_AGE) return 'minor';
  if (age >= SENIOR_AGE) return 'senior';
  if (age >= MATURE_AGE) return 'mature';
  return 'adult';
}

export interface AgeRules {
  /** Highest target RPE the plan may prescribe. */
  rpeCap: number | null;
  /** Seconds added to every rest period. */
  restBonusSeconds: number;
  /** Most sets of one exercise. */
  setsCap: number | null;
  /** Lowest rep count of a set (heavy low-rep work stresses joints and tendons more). */
  repMinFloor: number | null;
  /** Leave out advanced exercises. */
  excludeAdvanced: boolean;
  /** Leave out plyometric (jumping, explosive) exercises. */
  excludePlyometric: boolean;
  /** Move up weight by at most one increment per suggestion (progression). */
  singleStepProgression: boolean;
}

const NONE: AgeRules = { rpeCap: null, restBonusSeconds: 0, setsCap: null, repMinFloor: null, excludeAdvanced: false, excludePlyometric: false, singleStepProgression: false };

/** Minors are handled by the generator's dedicated minor rules (and are not repeated here). */
export function ageRules(band: AgeBand): AgeRules {
  switch (band) {
    case 'mature':
      return { ...NONE, rpeCap: 8, restBonusSeconds: 15 };
    case 'senior':
      return { rpeCap: 7.5, restBonusSeconds: 30, setsCap: 4, repMinFloor: 8, excludeAdvanced: true, excludePlyometric: true, singleStepProgression: true };
    default:
      return NONE;
  }
}
