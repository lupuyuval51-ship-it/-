import type { PrType, SessionStatus } from '../constants';
import type { RestTimerState } from '../timer';
import type { ISODate, ISODateTime, LocalizedText } from './common';
import type { ExerciseSummaryDTO } from './exercises';
import type { RewardResultDTO } from './gamification';

export interface SessionSetDTO {
  id: string;
  setNumber: number;
  targetReps: number | null;
  targetWeightKg: number | null;
  targetSeconds: number | null;
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  rpe: number | null;
  completed: boolean;
  completedAt: ISODateTime | null;
}

export interface PreviousPerformanceDTO {
  sessionId: string;
  date: ISODate;
  sets: { setNumber: number; reps: number | null; weightKg: number | null; durationSeconds: number | null }[];
}

export type ProgressionAction =
  | 'first_time'
  | 'increase_weight'
  | 'increase_reps'
  | 'increase_time'
  | 'maintain'
  | 'deload'
  | 'try_harder_variation';

/** Recommendation for the next session of an exercise, derived only from recorded sets. */
export interface ProgressionSuggestionDTO {
  exerciseId: string;
  action: ProgressionAction;
  targetWeightKg: number | null;
  repMin: number | null;
  repMax: number | null;
  targetSeconds: number | null;
  /** i18n key suffix under `session.progression.reasons.<reasonCode>` */
  reasonCode: string;
  params?: Record<string, string | number>;
  harderVariationId?: string | null;
}

export interface SessionExerciseDTO {
  id: string;
  exerciseId: string;
  exercise: ExerciseSummaryDTO;
  position: number;
  repMin: number | null;
  repMax: number | null;
  targetSeconds: number | null;
  restSeconds: number;
  targetRpe: number | null;
  targetWeightKg: number | null;
  notes: string;
  sets: SessionSetDTO[];
  previous: PreviousPerformanceDTO | null;
  suggestion: ProgressionSuggestionDTO | null;
}

export interface WorkoutSessionDTO {
  id: string;
  planId: string | null;
  planWorkoutId: string | null;
  name: string;
  status: SessionStatus;
  startedAt: ISODateTime;
  pausedAt: ISODateTime | null;
  pausedSeconds: number;
  endedAt: ISODateTime | null;
  durationSeconds: number | null;
  currentExerciseIndex: number;
  restTimer: RestTimerState | null;
  notes: string;
  perceivedExertion: number | null;
  exercises: SessionExerciseDTO[];
  /** Server clock at response time — clients use it to correct clock skew for timers. */
  serverTime: ISODateTime;
}

export interface PersonalRecordDTO {
  id: string;
  exerciseId: string;
  exerciseName: LocalizedText;
  recordType: PrType;
  value: number;
  previousValue: number | null;
  weightKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
  achievedAt: ISODateTime;
  sessionId: string | null;
}

export interface SessionSummaryDTO {
  session: { id: string; name: string; startedAt: ISODateTime; endedAt: ISODateTime; durationSeconds: number };
  totals: { exercises: number; sets: number; reps: number; volumeKg: number };
  exercises: { exerciseId: string; name: LocalizedText; completedSets: number; bestSet: { reps: number | null; weightKg: number | null; durationSeconds: number | null } | null }[];
  personalRecords: PersonalRecordDTO[];
  rewards: RewardResultDTO;
  /** Same plan workout's previous completion for comparison, if any. */
  previous: { sessionId: string; date: ISODate; volumeKg: number; durationSeconds: number } | null;
}

export interface SessionHistoryItemDTO {
  id: string;
  name: string;
  status: SessionStatus;
  startedAt: ISODateTime;
  endedAt: ISODateTime | null;
  durationSeconds: number | null;
  totalSets: number;
  totalVolumeKg: number;
  exerciseCount: number;
  prCount: number;
}

export interface SessionResponse {
  session: WorkoutSessionDTO;
}

export interface ActiveSessionResponse {
  session: WorkoutSessionDTO | null;
}
