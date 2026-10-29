import type { LevelInfo } from '../gamification';
import type { Macros } from '../nutrition';
import type { ISODate, ISODateTime } from './common';
import type { InsightDTO } from './progress';
import type { NutritionTargetsDTO } from './profile';
import type { PersonalRecordDTO } from './sessions';
import type { WeeklyGoalDTO } from './gamification';

export interface DashboardDTO {
  today: ISODate;
  activePlan: { id: string; name: string } | null;
  nextWorkout: {
    planId: string;
    workoutId: string;
    name: string;
    focus: string;
    exerciseCount: number;
    estimatedMinutes: number | null;
    /** Why this plan day is suggested today (see `recommendToday` in shared/schedule.ts). */
    schedule: {
      code: 'rotation' | 'preferred_day' | 'rest_day_scheduled' | 'avoid_back_to_back';
      /** Focus of the rotation day that was skipped (`avoid_back_to_back`). */
      skippedFocus: string | null;
      /** Next preferred training date this week (`rest_day_scheduled`). */
      nextTrainingDate: ISODate | null;
    };
  } | null;
  activeSession: { id: string; name: string; status: 'in_progress' | 'paused'; startedAt: ISODateTime } | null;
  lastWorkout: { id: string; name: string; endedAt: ISODateTime; durationSeconds: number | null } | null;
  nutritionToday: {
    totals: Macros;
    targets: NutritionTargetsDTO | null;
    entryCount: number;
    /** When the most recent entry for today was logged (drives meal-logging reminders). */
    lastLoggedAt: ISODateTime | null;
  };
  weeklyGoal: WeeklyGoalDTO;
  /** The 7 days of the current week (week start per locale) with completed workouts per day. */
  weekDays: { date: ISODate; workouts: number }[];
  streakWeeks: number;
  level: LevelInfo;
  recentRecords: PersonalRecordDTO[];
  unreadNotifications: number;
  insights: InsightDTO[];
}
