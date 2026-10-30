/**
 * Weight-trend calorie suggestions (see shared/nutritionAdapt.ts). The server computes the suggestion
 * from the user's own weigh-ins and applies one only when the client confirms exactly the offer that is
 * still valid, so nothing changes silently and a stale or forged request cannot set arbitrary targets.
 */
import { addDays, todayInTimeZone } from '@shared/dates';
import { DISMISS_DAYS, suggestAdjustment, type SuggestionResult } from '@shared/nutritionAdapt';
import type { ProfileDTO, TargetSuggestionResponse } from '@shared/types';
import type { Sql } from '../../db/pool';
import { conflict } from '../../lib/errors';
import { computedTargetsFor, currentAge, getProfile, getProfileRow, lockProfileRow, syncStoredTargets, type ProfileRow } from './repository';

/** Looks back far enough for two two-week windows. */
const LOOKBACK_DAYS = 31;

async function evaluate(sql: Sql, row: ProfileRow): Promise<{ result: SuggestionResult | null; today: string; baseline: ReturnType<typeof computedTargetsFor> }> {
  const today = todayInTimeZone(row.timezone);
  const baseline = computedTargetsFor(row, 0);
  const age = currentAge(row);
  if (!baseline || age == null || !row.goal) return { result: null, today, baseline };
  const points = (
    await sql.many<{ date: string; kg: number }>(
      `SELECT measured_on::text AS date, weight_kg::float8 AS kg FROM body_weight_entries
        WHERE user_id = $1 AND measured_on > $2 AND measured_on <= $3 ORDER BY measured_on`,
      [row.user_id, addDays(today, -LOOKBACK_DAYS), today],
    )
  ).map((p) => ({ date: p.date, kg: Number(p.kg) }));
  const result = suggestAdjustment({
    today,
    goal: row.goal,
    isMinor: age < 18,
    targetsCustom: row.targets_custom,
    points,
    baselineCalories: baseline.calories,
    minimumCalories: baseline.minimumCalories,
    currentOffset: row.calorie_adjustment ?? 0,
    adjustedOn: row.calorie_adjusted_on,
    dismissedUntil: row.adjustment_dismissed_until,
  });
  return { result, today, baseline };
}

function proposedTargets(row: ProfileRow, offsetKcal: number) {
  const t = computedTargetsFor(row, offsetKcal)!;
  return { calories: t.calories, proteinG: t.proteinG, carbsG: t.carbsG, fatG: t.fatG };
}

export async function getTargetSuggestion(sql: Sql, userId: string): Promise<TargetSuggestionResponse> {
  const row = await getProfileRow(sql, userId);
  const adjustmentKcal = row && !row.targets_custom ? (row.calorie_adjustment ?? 0) : 0;
  if (!row) return { suggestion: null, reason: 'incomplete_profile', adjustmentKcal: 0 };
  const { result } = await evaluate(sql, row);
  if (!result) return { suggestion: null, reason: 'incomplete_profile', adjustmentKcal };
  if (result.status === 'none') return { suggestion: null, reason: result.reason, adjustmentKcal };
  const current = computedTargetsFor(row)!;
  return {
    suggestion: { ...result.suggestion, currentCalories: current.calories, proposedTargets: proposedTargets(row, result.suggestion.offsetKcal) },
    reason: null,
    adjustmentKcal,
  };
}

/** Applies the offered adjustment. 409 when what the client saw is no longer what is offered. */
export async function applyAdjustment(sql: Sql, userId: string, offsetKcal: number): Promise<ProfileDTO> {
  const row = await lockProfileRow(sql, userId);
  const { result, today } = await evaluate(sql, row);
  if (!result || result.status !== 'suggest' || result.suggestion.offsetKcal !== offsetKcal) {
    throw conflict('suggestion_changed', 'This suggestion is no longer available');
  }
  await sql.exec(
    `UPDATE profiles SET calorie_adjustment = $2, calorie_adjusted_on = $3, adjustment_dismissed_until = NULL WHERE user_id = $1`,
    [userId, offsetKcal, today],
  );
  await syncStoredTargets(sql, userId);
  return getProfile(sql, userId);
}

/** "Not now": no new suggestion for two weeks. */
export async function dismissSuggestion(sql: Sql, userId: string): Promise<void> {
  const row = await lockProfileRow(sql, userId);
  await sql.exec('UPDATE profiles SET adjustment_dismissed_until = $2 WHERE user_id = $1', [userId, addDays(todayInTimeZone(row.timezone), DISMISS_DAYS)]);
}

/** Back to the computed target. */
export async function resetAdjustment(sql: Sql, userId: string): Promise<ProfileDTO> {
  await lockProfileRow(sql, userId);
  await sql.exec('UPDATE profiles SET calorie_adjustment = 0, calorie_adjusted_on = NULL WHERE user_id = $1', [userId]);
  await syncStoredTargets(sql, userId);
  return getProfile(sql, userId);
}
