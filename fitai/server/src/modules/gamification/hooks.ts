/**
 * Cross-module reward hooks (CONTRACT). Other modules call these inside their own
 * transaction after a qualifying action; implementations must be idempotent
 * (xp_events has UNIQUE (user_id, source_type, source_key)) and must never throw for
 * "no reward" situations. Owned by the gamification module.
 */
import { EMPTY_REWARD, type RewardResultDTO } from '@shared/types';
import type { Sql } from '../../db/pool';

export interface WorkoutCompletedEvent {
  userId: string;
  sessionId: string;
  /** Calendar date (user time zone) the session ended. */
  date: string;
  endedAt: Date;
  durationSeconds: number;
  completedSets: number;
  totalVolumeKg: number;
  /** Personal records set in this session. */
  personalRecordIds: string[];
}

export async function onWorkoutCompleted(_sql: Sql, _event: WorkoutCompletedEvent): Promise<RewardResultDTO> {
  return { ...EMPTY_REWARD };
}

export async function onFoodLogged(_sql: Sql, _event: { userId: string; date: string }): Promise<RewardResultDTO> {
  return { ...EMPTY_REWARD };
}

export async function onBodyWeightLogged(_sql: Sql, _event: { userId: string; date: string }): Promise<RewardResultDTO> {
  return { ...EMPTY_REWARD };
}

export async function onCoachQuestion(_sql: Sql, _event: { userId: string }): Promise<RewardResultDTO> {
  return { ...EMPTY_REWARD };
}
