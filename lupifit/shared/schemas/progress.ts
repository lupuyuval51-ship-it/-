/**
 * Request schemas for the progress, gamification and dashboard modules. The body-weight
 * payload reuses `bodyWeightSchema` from ./profile.
 */
import { z } from 'zod';
import { PROGRESS_PERIODS } from '../constants';
import { intParam, slugId, uuid } from './common';

export { bodyWeightSchema, type BodyWeightInput } from './profile';

/** Ranges (days) for the long-term charts: body weight and per-exercise strength progression. */
export const TREND_PERIODS = [30, 90, 365] as const;
export type TrendPeriod = (typeof TREND_PERIODS)[number];

/** Query-string day period restricted to `values` (e.g. `?period=30`), with a default. */
function periodParam<T extends readonly number[]>(values: T, fallback: T[number]) {
  const allowed = values.map(String) as [string, ...string[]];
  return z
    .enum(allowed)
    .default(String(fallback))
    .transform((v) => Number(v) as T[number]);
}

export const overviewQuerySchema = z.object({ period: periodParam(PROGRESS_PERIODS, 30) });
export const exerciseProgressQuerySchema = z.object({ period: periodParam(TREND_PERIODS, 90) });
export const bodyWeightQuerySchema = z.object({ period: periodParam(TREND_PERIODS, 90) });
export const recordsQuerySchema = z.object({ limit: intParam(1, 100).default(20) });
export const notificationsQuerySchema = z.object({ limit: intParam(1, 100).default(30) });

export const exerciseIdParamSchema = z.object({ exerciseId: slugId });
export const idParamSchema = z.object({ id: uuid });
