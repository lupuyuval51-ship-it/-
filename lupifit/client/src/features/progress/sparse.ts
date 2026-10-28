import { PROGRESS_PERIODS, type ProgressPeriod } from '@shared/constants';
import type { ProgressOverviewDTO } from '@shared/types';

/** Fewer completed workouts than this and "vs. previous period" comparisons say very little. */
export const MIN_WORKOUTS_FOR_TRENDS = 3;

export type SparseHint = 'no_workouts' | 'few_workouts' | 'no_meals' | 'one_weigh_in' | 'no_weigh_ins';

export interface SparseGuidance {
  hints: SparseHint[];
  /** A longer period to try when the current one is empty and a longer one exists. */
  longerPeriod: ProgressPeriod | null;
}

/**
 * What to tell a person whose data is too sparse for the charts to mean much. Only describes
 * what is missing — it never invents numbers.
 */
export function sparseGuidance(o: Pick<ProgressOverviewDTO, 'period' | 'workouts' | 'nutrition' | 'bodyWeight'>): SparseGuidance {
  const hints: SparseHint[] = [];
  if (o.workouts.count === 0) hints.push('no_workouts');
  else if (o.workouts.count < MIN_WORKOUTS_FOR_TRENDS) hints.push('few_workouts');
  if (o.nutrition.daysLogged === 0) hints.push('no_meals');
  if (o.bodyWeight.entries.length === 0) hints.push('no_weigh_ins');
  else if (o.bodyWeight.entries.length === 1) hints.push('one_weigh_in');
  const longer = PROGRESS_PERIODS.find((p) => p > o.period) ?? null;
  return { hints, longerPeriod: hints.includes('no_workouts') ? longer : null };
}
