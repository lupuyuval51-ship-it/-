/**
 * Progressive-overload suggestions (CONTRACT). Derived only from the user's recorded,
 * completed sets. Used by sessions (targets when starting a workout) and by workouts
 * ("apply progression" on a plan). Owned by the sessions module.
 */
import type { ProgressionSuggestionDTO } from '@shared/types';
import type { Sql } from '../../db/pool';

export interface PrescriptionInput {
  exerciseId: string;
  repMin: number | null;
  repMax: number | null;
  targetSeconds: number | null;
  targetWeightKg: number | null;
}

/** One suggestion per input exercise (same order). */
export async function suggestProgressions(
  _sql: Sql,
  _userId: string,
  inputs: PrescriptionInput[],
): Promise<ProgressionSuggestionDTO[]> {
  return inputs.map((i) => ({
    exerciseId: i.exerciseId,
    action: 'first_time',
    targetWeightKg: i.targetWeightKg,
    repMin: i.repMin,
    repMax: i.repMax,
    targetSeconds: i.targetSeconds,
    reasonCode: 'no_history',
  }));
}
