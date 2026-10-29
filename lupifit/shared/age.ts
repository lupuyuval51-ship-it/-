/**
 * Age bands for training. Under 18 keeps its own (stricter) rules in the generator; from 50 the plan gets
 * gentler: lower top effort, longer rests, fewer sets, no jumping or other high-impact work from 65. These are
 * general conservative defaults, not medical advice, and they only ever make a plan easier, never harder.
 */
import { ADULT_AGE, type ExerciseCategory, type MovementPattern } from './constants';

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
  /**
   * Lowest rep count of an externally loaded set (`weight_reps`): heavy low-rep work stresses joints and tendons
   * more, and more reps mean a lighter load. Never applied to bodyweight reps, where more reps only make a set
   * harder (benchmark-based targets such as 2 pull-ups stay as they are).
   */
  loadedRepMinFloor: number | null;
  /** Leave out advanced exercises. */
  excludeAdvanced: boolean;
  /** Leave out jumping and other high-impact exercises (see `isHighImpact`). */
  excludeHighImpact: boolean;
  /** Move up weight by at most one increment per suggestion (progression). */
  singleStepProgression: boolean;
}

const NONE: AgeRules = {
  rpeCap: null,
  restBonusSeconds: 0,
  setsCap: null,
  loadedRepMinFloor: null,
  excludeAdvanced: false,
  excludeHighImpact: false,
  singleStepProgression: false,
};

/** Minors are handled by the generator's dedicated minor rules (and are not repeated here). */
export function ageRules(band: AgeBand): AgeRules {
  switch (band) {
    case 'mature':
      return { ...NONE, rpeCap: 8, restBonusSeconds: 15 };
    case 'senior':
      return { rpeCap: 7.5, restBonusSeconds: 30, setsCap: 4, loadedRepMinFloor: 8, excludeAdvanced: true, excludeHighImpact: true, singleStepProgression: true };
    default:
      return NONE;
  }
}

/** Built-in jumping / running-impact exercises that are not tagged plyometric. */
const HIGH_IMPACT_IDS = new Set(['burpee', 'jumping_jack', 'jump_rope_skipping', 'high_knees', 'sprint_intervals']);
const HIGH_IMPACT_EN = /\b(jumps?|jumping|hops?|hopping|bounds?|bounding|burpees?|skips?|skipping|sprints?|sprinting|plyo\w*)\b/i;
/** Hebrew stems: קפיצ (jump), ניתור (bound / leap), ברפי (burpee), ספרינט (sprint). */
const HIGH_IMPACT_HE = /קפיצ|ניתור|ברפי|ספרינט/;

export interface ImpactFields {
  id: string;
  name: { en: string; he: string };
  category: ExerciseCategory;
  movementPattern: MovementPattern;
}

/**
 * Jumping and other high-impact exercises: every plyometric or `jump`-pattern exercise, the known jumping and
 * running conditioning moves (burpees, jumping jacks, jump rope, high knees, sprints), and any exercise whose id or
 * name says it jumps, hops, bounds, skips or sprints, so a new exercise is caught by its name as well. Errs toward
 * "high impact": it is only used to leave exercises out.
 */
export function isHighImpact(e: ImpactFields): boolean {
  return (
    e.category === 'plyometric' ||
    e.movementPattern === 'jump' ||
    HIGH_IMPACT_IDS.has(e.id) ||
    HIGH_IMPACT_EN.test(e.id.replace(/_/g, ' ')) ||
    HIGH_IMPACT_EN.test(e.name.en) ||
    HIGH_IMPACT_HE.test(e.name.he)
  );
}
