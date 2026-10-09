import type {
  Difficulty,
  Equipment,
  ExerciseCategory,
  InjuryArea,
  MovementPattern,
  Muscle,
  MuscleGroup,
  TrackingType,
} from '../constants';
import type { LocalizedList } from '../content';
import type { ISODate, LocalizedText, Paginated } from './common';

export interface ExerciseSummaryDTO {
  id: string;
  name: LocalizedText;
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
  equipment: Equipment[];
  category: ExerciseCategory;
  movementPattern: MovementPattern;
  difficulty: Difficulty;
  trackingType: TrackingType;
  unilateral: boolean;
  /** True only when a real demonstration asset is attached. */
  hasMedia: boolean;
}

export interface ExerciseMediaDTO {
  url: string;
  type: 'video' | 'animation' | 'image';
  credit: string | null;
}

/** How the exercise fits the signed-in user's equipment and reported injuries. */
export interface ExerciseUserContext {
  hasRequiredEquipment: boolean;
  missingEquipment: Equipment[];
  injuryConflicts: InjuryArea[];
}

export interface ExerciseHistoryEntryDTO {
  sessionId: string;
  date: ISODate;
  sets: { reps: number | null; weightKg: number | null; durationSeconds: number | null }[];
  bestEst1rmKg: number | null;
}

export interface ExerciseDetailDTO extends ExerciseSummaryDTO {
  description: LocalizedText;
  instructions: LocalizedList;
  mistakes: LocalizedList;
  safety: LocalizedList;
  contraindications: InjuryArea[];
  isCompound: boolean;
  loadIncrementKg: number | null;
  easierAlternatives: ExerciseSummaryDTO[];
  harderAlternatives: ExerciseSummaryDTO[];
  media: ExerciseMediaDTO | null;
  userContext: ExerciseUserContext | null;
  /** Most recent sessions in which the user performed this exercise (newest first). */
  recentHistory: ExerciseHistoryEntryDTO[];
}

export interface ExerciseListQuery {
  q?: string;
  muscle?: Muscle;
  muscleGroup?: MuscleGroup;
  equipment?: Equipment;
  difficulty?: Difficulty;
  category?: ExerciseCategory;
  /** Only exercises the user can do with their profile equipment. */
  availableOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export type ExerciseListResponse = Paginated<ExerciseSummaryDTO>;
