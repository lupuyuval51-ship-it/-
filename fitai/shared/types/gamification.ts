import type { NotificationKind } from '../constants';
import type { LevelInfo } from '../gamification';
import type { ISODate, ISODateTime } from './common';

export interface RewardResultDTO {
  xpAwarded: number;
  /** Achievement ids unlocked by this action. */
  newAchievements: string[];
  levelUp: { from: number; to: number } | null;
  /** Codes explaining why XP was limited (e.g. 'daily_workout_cap', 'too_short'), rendered via i18n. */
  notes: string[];
}

export const EMPTY_REWARD: RewardResultDTO = { xpAwarded: 0, newAchievements: [], levelUp: null, notes: [] };

export interface AchievementStatusDTO {
  id: string;
  unlockedAt: ISODateTime | null;
  progress: { current: number; target: number };
}

export interface WeeklyGoalDTO {
  weekStart: ISODate;
  target: number;
  /** Qualifying workouts this week (see `isQualifyingWorkout` in shared/gamification.ts). */
  completed: number;
  met: boolean;
}

export interface GamificationDTO {
  level: LevelInfo;
  achievements: AchievementStatusDTO[];
  weeklyGoal: WeeklyGoalDTO;
  /** Consecutive weeks (including the current one if already met) meeting the weekly goal. */
  streak: { currentWeeks: number; longestWeeks: number };
  recentXp: { sourceType: string; xp: number; createdAt: ISODateTime }[];
}

export interface NotificationDTO {
  id: string;
  kind: NotificationKind;
  /**
   * Structured payload rendered via i18n:
   * - achievement: { achievementId }
   * - level_up: { level, from }
   * - personal_record: { exerciseId, exerciseName: { en, he }, recordType, value, previousValue }
   * - weekly_goal: { weekStart, goal, completed }
   */
  data: Record<string, unknown>;
  readAt: ISODateTime | null;
  createdAt: ISODateTime;
}

export interface NotificationListResponse {
  notifications: NotificationDTO[];
  unreadCount: number;
}

/** Response of the notification mutations (read, read-all, delete). */
export interface NotificationMutationResponse {
  ok: true;
  unreadCount: number;
}
