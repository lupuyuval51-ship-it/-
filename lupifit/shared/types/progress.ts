import type { ProgressPeriod } from '../constants';
import type { Macros } from '../nutrition';
import type { ISODate, LocalizedText } from './common';
import type { RewardResultDTO } from './gamification';
import type { PersonalRecordDTO } from './sessions';

/**
 * A data-driven observation about the user's own records, rendered client-side via
 * `progress.insights.<code>`. Param conventions (handled by the client renderer):
 * - `<name>En` / `<name>He` pairs are localized text → rendered as `{<name>}` in the UI language.
 * - keys ending in `Kg` are weights in kg → rendered as `{<name>}` in the user's units
 *   (`changeKg` → `{change}` with an explicit sign).
 * - `count` selects the plural form.
 */
export interface InsightDTO {
  /** i18n key suffix `progress.insights.<code>` */
  code: string;
  params: Record<string, string | number>;
  tone: 'positive' | 'neutral' | 'attention';
}

export interface ProgressOverviewDTO {
  period: ProgressPeriod;
  from: ISODate;
  to: ISODate;
  workouts: {
    count: number;
    totalDurationSeconds: number;
    totalSets: number;
    totalReps: number;
    totalVolumeKg: number;
    averagePerWeek: number;
    /** Same metrics for the previous period of equal length (for comparisons). */
    previousCount: number;
    previousVolumeKg: number;
  };
  /** One entry per day in range. */
  daily: { date: ISODate; workouts: number; volumeKg: number; durationSeconds: number }[];
  /** One entry per week in range (week start per the user's locale). */
  weekly: { weekStart: ISODate; workouts: number; volumeKg: number; goalMet: boolean }[];
  consistency: {
    weeklyGoal: number;
    weeksMet: number;
    weeksTotal: number;
    percent: number;
    currentStreakWeeks: number;
  };
  bodyWeight: {
    entries: { date: ISODate; weightKg: number }[];
    latestKg: number | null;
    changeKg: number | null;
  };
  nutrition: {
    daysLogged: number;
    averages: Macros | null;
    targetCalories: number | null;
    targetProteinG: number | null;
    /** Share of logged days within ±10% of the calorie target. */
    calorieAdherencePercent: number | null;
    proteinTargetDays: number;
  };
  muscleGroupSets: { group: string; sets: number }[];
  records: PersonalRecordDTO[];
  insights: InsightDTO[];
}

export interface ExerciseProgressPointDTO {
  date: ISODate;
  sessionId: string;
  bestEst1rmKg: number | null;
  maxWeightKg: number | null;
  maxReps: number | null;
  maxDurationSeconds: number | null;
  volumeKg: number;
}

export interface ExerciseProgressDTO {
  exerciseId: string;
  name: LocalizedText;
  trackingType: 'weight_reps' | 'reps' | 'time';
  points: ExerciseProgressPointDTO[];
  records: PersonalRecordDTO[];
}

export interface TrainedExerciseDTO {
  exerciseId: string;
  name: LocalizedText;
  sessions: number;
  lastPerformed: ISODate;
}

export interface BodyWeightEntryDTO {
  id: string;
  date: ISODate;
  weightKg: number;
  note: string;
}

export interface TrainedExercisesResponse {
  exercises: TrainedExerciseDTO[];
}

export interface PersonalRecordsResponse {
  records: PersonalRecordDTO[];
}

export interface BodyWeightListResponse {
  entries: BodyWeightEntryDTO[];
}

export interface BodyWeightLogResponse {
  entry: BodyWeightEntryDTO;
  rewards: RewardResultDTO;
}
