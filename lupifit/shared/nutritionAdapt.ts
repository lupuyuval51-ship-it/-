/**
 * Weight-trend check for calorie targets (pure, shared by server and client).
 *
 * The app never changes targets on its own. When the weight trend has been clearly off the goal's
 * band in two consecutive two-week windows, it can *suggest* a small step (±100 kcal, at most ±150 in
 * total from the computed target) that the user confirms. Guard rails: never below the safe minimum,
 * never a deficit for minors, nothing for custom targets, and at most one suggestion per 28 days.
 */
import { addDays, diffDays } from './dates';
import type { Goal } from './constants';

export interface WeightPoint {
  date: string;
  kg: number;
}

export const ADJUSTMENT_STEP_KCAL = 100;
export const ADJUSTMENT_MAX_KCAL = 150;
export const ADJUSTMENT_COOLDOWN_DAYS = 28;
export const DISMISS_DAYS = 14;
const WINDOW_DAYS = 14;
const MIN_POINTS = 3;
const MIN_SPAN_DAYS = 7;

export type SuggestionCode = 'loss_too_fast' | 'loss_too_slow' | 'gain_too_slow' | 'gain_too_fast' | 'drifting_down' | 'drifting_up';

export type NoSuggestionReason = 'custom_targets' | 'not_enough_data' | 'on_track' | 'recently_adjusted' | 'dismissed' | 'at_limit' | 'at_floor';

export interface TargetSuggestion {
  code: SuggestionCode;
  /** Trend over the latest two weeks, kg per week (negative = losing). */
  weeklyRateKg: number;
  /** Same, as a percentage of body weight per week. */
  ratePercent: number;
  weighIns: number;
  /** New total offset from the computed target, and the step relative to the current target. */
  offsetKcal: number;
  deltaKcal: number;
  proposedCalories: number;
}

export type SuggestionResult = { status: 'suggest'; suggestion: TargetSuggestion } | { status: 'none'; reason: NoSuggestionReason };

export interface AdaptInput {
  today: string;
  goal: Goal;
  isMinor: boolean;
  targetsCustom: boolean;
  points: WeightPoint[];
  /** Calories of the computed target without any adjustment. */
  baselineCalories: number;
  minimumCalories: number;
  currentOffset: number;
  adjustedOn: string | null;
  dismissedUntil: string | null;
}

/** Weekly weight change (kg/week) by least squares over `points`, or null with too little data. */
export function weeklyRateKg(points: WeightPoint[]): number | null {
  if (points.length < MIN_POINTS) return null;
  const t0 = points[0]!.date;
  const xs = points.map((p) => diffDays(p.date, t0));
  const span = Math.max(...xs) - Math.min(...xs);
  if (span < MIN_SPAN_DAYS) return null;
  const n = points.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = points.reduce((a, p) => a + p.kg, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i]! - mx) * (points[i]!.kg - my);
    den += (xs[i]! - mx) ** 2;
  }
  return den === 0 ? null : (num / den) * 7;
}

/** Percent-per-week thresholds: below `low` the user moves too far down for the goal, above `high` too far up. */
const BANDS: Record<Goal, { low: number; high: number; lowCode: SuggestionCode; highCode: SuggestionCode }> = {
  fat_loss: { low: -1.0, high: -0.25, lowCode: 'loss_too_fast', highCode: 'loss_too_slow' },
  muscle_gain: { low: 0.1, high: 0.75, lowCode: 'gain_too_slow', highCode: 'gain_too_fast' },
  strength: { low: -0.1, high: 0.6, lowCode: 'drifting_down', highCode: 'drifting_up' },
  general_fitness: { low: -0.5, high: 0.5, lowCode: 'drifting_down', highCode: 'drifting_up' },
  athletic_performance: { low: -0.5, high: 0.5, lowCode: 'drifting_down', highCode: 'drifting_up' },
};

const inWindow = (points: WeightPoint[], from: string, to: string) => points.filter((p) => p.date > from && p.date <= to);

export function suggestAdjustment(input: AdaptInput): SuggestionResult {
  const none = (reason: NoSuggestionReason): SuggestionResult => ({ status: 'none', reason });
  if (input.targetsCustom) return none('custom_targets');
  if (input.adjustedOn && diffDays(input.today, input.adjustedOn) < ADJUSTMENT_COOLDOWN_DAYS) return none('recently_adjusted');
  if (input.dismissedUntil && input.dismissedUntil >= input.today) return none('dismissed');

  const points = [...input.points].sort((a, b) => a.date.localeCompare(b.date));
  const recent = inWindow(points, addDays(input.today, -WINDOW_DAYS), input.today);
  const previous = inWindow(points, addDays(input.today, -2 * WINDOW_DAYS), addDays(input.today, -WINDOW_DAYS));
  const rateRecent = weeklyRateKg(recent);
  const ratePrevious = weeklyRateKg(previous);
  const latest = points[points.length - 1];
  if (rateRecent == null || ratePrevious == null || !latest) return none('not_enough_data');

  const pct = (rate: number) => (rate / latest.kg) * 100;
  const band = BANDS[input.goal];
  const direction = pct(rateRecent) < band.low && pct(ratePrevious) < band.low ? 'raise' : pct(rateRecent) > band.high && pct(ratePrevious) > band.high ? 'lower' : null;
  if (!direction) return none('on_track');
  // Minors are never moved towards a deficit.
  if (direction === 'lower' && input.isMinor) return none('on_track');

  const step = direction === 'raise' ? ADJUSTMENT_STEP_KCAL : -ADJUSTMENT_STEP_KCAL;
  const offsetKcal = Math.max(-ADJUSTMENT_MAX_KCAL, Math.min(ADJUSTMENT_MAX_KCAL, input.currentOffset + step));
  if (offsetKcal === input.currentOffset) return none('at_limit');
  const proposedCalories = Math.round((input.baselineCalories + offsetKcal) / 10) * 10;
  if (proposedCalories < input.minimumCalories) return none('at_floor');
  return {
    status: 'suggest',
    suggestion: {
      code: direction === 'raise' ? band.lowCode : band.highCode,
      weeklyRateKg: Math.round(rateRecent * 100) / 100,
      ratePercent: Math.round(pct(rateRecent) * 100) / 100,
      weighIns: recent.length + previous.length,
      offsetKcal,
      deltaKcal: offsetKcal - input.currentOffset,
      proposedCalories,
    },
  };
}
