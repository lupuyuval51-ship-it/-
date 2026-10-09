/**
 * Data-driven insights. Pure function over numbers computed from the user's own records:
 * every insight carries the real values it is based on, and nothing is shown without
 * enough data (a single `not_enough_data` insight instead). Rendered client-side via
 * `progress.insights.<code>` (see InsightDTO for the param conventions).
 */
import { addDays, diffDays } from '@shared/dates';
import { round1 } from '@shared/nutrition';
import type { InsightDTO, LocalizedText } from '@shared/types';

export interface InsightInput {
  period: number;
  today: string;
  workouts: { count: number; previousCount: number; volumeKg: number; previousVolumeKg: number };
  currentStreakWeeks: number;
  /** Goal-met weeks over finished weeks only (the running week is excluded). */
  finishedWeeks: { met: number; total: number };
  /** Dates (any order, duplicates allowed) with at least one completed workout, up to today. */
  trainingDates: string[];
  /** Per exercise trained in the period: best estimated 1RM per session, oldest first. */
  strength: { name: LocalizedText; points: { date: string; est1rmKg: number }[] }[];
  /** Body-weight entries in the period, oldest first. */
  bodyWeight: { date: string; weightKg: number }[];
  /** Logged nutrition days in the period (today included, if logged). */
  nutritionDays: { date: string; kcal: number; proteinG: number }[];
  targetCalories: number | null;
  targetProteinG: number | null;
  /** Most recent date with any food logged (up to today), or null if never. */
  lastFoodLogDate: string | null;
}

/** Thresholds (documented here so the copy and the logic stay in sync). */
export const INSIGHT_RULES = {
  restRunDays: 6,
  strengthGainPercent: 2.5,
  volumeUpRatio: 1.1,
  minNutritionDays: 3,
  proteinLowRatio: 0.8,
  caloriesLowRatio: 0.75,
  onTrackCaloriesTolerance: 0.1,
  onTrackProteinRatio: 0.9,
  loggingGapDays: 3,
  consistencyHighPercent: 80,
  consistencyMinWeeks: 3,
} as const;

const PRIORITY = [
  'rest_needed',
  'calories_low',
  'strength_gain',
  'workouts_up',
  'weekly_goal_streak',
  'volume_up',
  'consistency_high',
  'protein_low',
  'nutrition_on_track',
  'workouts_down',
  'body_weight_trend',
  'logging_gap',
  'workouts_logged',
] as const;

export type InsightCode = (typeof PRIORITY)[number] | 'not_enough_data';

/** Length of the run of consecutive training days ending today (or yesterday). */
export function trainingRunLength(dates: string[], today: string): number {
  const set = new Set(dates);
  let day = set.has(today) ? today : addDays(today, -1);
  let run = 0;
  while (set.has(day)) {
    run++;
    day = addDays(day, -1);
  }
  return run;
}

const average = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

export function buildInsights(input: InsightInput): InsightDTO[] {
  const R = INSIGHT_RULES;
  const out: InsightDTO[] = [];
  const add = (code: InsightCode, tone: InsightDTO['tone'], params: InsightDTO['params'] = {}) => out.push({ code, tone, params });

  const run = trainingRunLength(input.trainingDates, input.today);
  if (run >= R.restRunDays) add('rest_needed', 'attention', { count: run });

  // Nutrition: finished days only — a partly logged "today" would distort averages.
  const finished = input.nutritionDays.filter((d) => d.date < input.today);
  if (finished.length >= R.minNutritionDays) {
    const avgKcal = average(finished.map((d) => d.kcal));
    const avgProtein = average(finished.map((d) => d.proteinG));
    const tc = input.targetCalories;
    const tp = input.targetProteinG;
    if (tc && avgKcal < tc * R.caloriesLowRatio) {
      add('calories_low', 'attention', { avgKcal: Math.round(avgKcal), targetKcal: tc, count: finished.length });
    }
    if (tp && avgProtein < tp * R.proteinLowRatio) {
      add('protein_low', 'neutral', { avgG: Math.round(avgProtein), targetG: tp, percent: Math.round((avgProtein / tp) * 100) });
    }
    if (tc && tp && Math.abs(avgKcal - tc) <= tc * R.onTrackCaloriesTolerance && avgProtein >= tp * R.onTrackProteinRatio) {
      add('nutrition_on_track', 'positive', { count: finished.length });
    }
  }

  let bestGain: { name: LocalizedText; from: number; to: number; percent: number } | null = null;
  for (const ex of input.strength) {
    if (ex.points.length < 2) continue;
    const first = ex.points[0]!.est1rmKg;
    const last = ex.points[ex.points.length - 1]!.est1rmKg;
    if (first <= 0) continue;
    const percent = ((last - first) / first) * 100;
    if (percent >= R.strengthGainPercent && (!bestGain || percent > bestGain.percent)) bestGain = { name: ex.name, from: first, to: last, percent };
  }
  if (bestGain) {
    add('strength_gain', 'positive', {
      exerciseEn: bestGain.name.en,
      exerciseHe: bestGain.name.he,
      fromKg: bestGain.from,
      toKg: bestGain.to,
      percent: round1(bestGain.percent),
    });
  }

  const { count, previousCount, volumeKg, previousVolumeKg } = input.workouts;
  const diff = count - previousCount;
  const meaningful = Math.max(1, Math.ceil(previousCount * 0.2));
  if (previousCount >= 1 && count >= 2 && diff >= meaningful) add('workouts_up', 'positive', { count, previous: previousCount, period: input.period });
  if (previousCount >= 2 && -diff >= meaningful) add('workouts_down', 'neutral', { count, previous: previousCount, period: input.period });

  if (input.currentStreakWeeks >= 2) add('weekly_goal_streak', 'positive', { count: input.currentStreakWeeks });

  if (previousVolumeKg > 0 && volumeKg >= previousVolumeKg * R.volumeUpRatio) {
    add('volume_up', 'positive', { percent: Math.round((volumeKg / previousVolumeKg - 1) * 100) });
  }

  const { met, total } = input.finishedWeeks;
  if (total >= R.consistencyMinWeeks && (met / total) * 100 >= R.consistencyHighPercent) {
    add('consistency_high', 'positive', { percent: Math.round((met / total) * 100), met, total });
  }

  if (input.bodyWeight.length >= 2) {
    const first = input.bodyWeight[0]!;
    const last = input.bodyWeight[input.bodyWeight.length - 1]!;
    add('body_weight_trend', 'neutral', {
      changeKg: round1(last.weightKg - first.weightKg),
      fromKg: first.weightKg,
      toKg: last.weightKg,
      count: diffDays(last.date, first.date),
    });
  }

  if (input.lastFoodLogDate) {
    const gap = diffDays(input.today, input.lastFoodLogDate);
    if (gap >= R.loggingGapDays) add('logging_gap', 'neutral', { count: gap });
  }

  if (out.length === 0 && count > 0) add('workouts_logged', 'neutral', { count, period: input.period });
  if (out.length === 0) return [{ code: 'not_enough_data', tone: 'neutral', params: {} }];

  const rank = (code: string) => PRIORITY.indexOf(code as (typeof PRIORITY)[number]);
  return out.sort((a, b) => rank(a.code) - rank(b.code));
}
