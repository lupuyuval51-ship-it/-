import type {
  Difficulty,
  Equipment,
  ExerciseCategory,
  InjuryArea,
  Locale,
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

/**
 * A library item: the summary plus how it fits the signed-in user
 * (`userContext` is null until onboarding is complete).
 */
export interface ExerciseListItemDTO extends ExerciseSummaryDTO {
  userContext: ExerciseUserContext | null;
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
  easierAlternatives: ExerciseListItemDTO[];
  harderAlternatives: ExerciseListItemDTO[];
  media: ExerciseMediaDTO | null;
  userContext: ExerciseUserContext | null;
  /** Most recent sessions in which the user performed this exercise (newest first). */
  recentHistory: ExerciseHistoryEntryDTO[];
}

/** Equipment filter value: a specific item, or `none` for exercises that need no equipment. */
export type ExerciseEquipmentFilter = Equipment | 'none';

export interface ExerciseFilterQuery {
  q?: string;
  /** Matches the exercise's primary or secondary muscles. */
  muscle?: Muscle;
  /** Matches the muscle groups of the exercise's primary muscles. */
  muscleGroup?: MuscleGroup;
  equipment?: ExerciseEquipmentFilter;
  difficulty?: Difficulty;
  category?: ExerciseCategory;
  /** Only exercises the user can do with their profile equipment. */
  availableOnly?: boolean;
}

export interface ExerciseListQuery extends ExerciseFilterQuery {
  page?: number;
  pageSize?: number;
  /** Language used to order equally relevant results alphabetically (default `en`). */
  lang?: Locale;
}

export interface ExerciseListResponse extends Paginated<ExerciseListItemDTO> {
  /**
   * True when nothing matched the search exactly and the results come from a
   * spelling-tolerant fallback (the UI says so instead of presenting them as exact).
   */
  approximate: boolean;
}

/**
 * Result counts per filter value for the current filter set. Each dimension is counted
 * with every *other* active filter applied (standard faceted search), so a count tells
 * how many results selecting that value would give.
 */
export interface ExerciseFacetsDTO {
  /** Results for the full filter set (same as the list `total`). */
  total: number;
  /** Results for the full filter set restricted to the user's equipment. */
  availableTotal: number;
  muscleGroup: Record<MuscleGroup, number>;
  muscle: Record<Muscle, number>;
  equipment: Record<ExerciseEquipmentFilter, number>;
  difficulty: Record<Difficulty, number>;
  category: Record<ExerciseCategory, number>;
}

export interface ExerciseFacetsResponse {
  facets: ExerciseFacetsDTO;
}

export interface ExerciseDetailResponse {
  exercise: ExerciseDetailDTO;
}

export interface ExerciseHistoryResponse {
  history: ExerciseHistoryEntryDTO[];
}
