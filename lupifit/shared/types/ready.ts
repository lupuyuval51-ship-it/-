import type { Difficulty, Equipment, Muscle, ReadyFocus, SportBlockVariant, SportId, TrainingLocation, TrainingMode } from '../constants';
import type { ExerciseSummaryDTO } from './exercises';
import type { LocalizedText } from './common';
import type { GenerationNote } from './workouts';

/** One row of the ready-workout list. Names are bilingual; the client picks the language. */
export interface ReadyWorkoutSummaryDTO {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  focus: ReadyFocus;
  mode: TrainingMode;
  level: Difficulty;
  places: TrainingLocation[];
  /** Everything the workout needs, derived from its exercises (empty = nothing but your body). */
  equipment: Equipment[];
  /** Muscles it trains most, by share of sets (at most 4). */
  muscles: Muscle[];
  exerciseCount: number;
  totalSets: number;
  /** Warm-up included. */
  estimatedMinutes: number;
}

export interface ReadyItemDTO {
  exercise: ExerciseSummaryDTO;
  sets: number;
  repMin: number | null;
  repMax: number | null;
  targetSeconds: number | null;
  restSeconds: number;
  targetRpe: number | null;
  cue: LocalizedText | null;
  /** The exercise this one replaced for this user (injury, age or equipment), or null. */
  substitutedFrom: string | null;
}

export interface SportBlockDTO {
  id: string;
  sport: SportId;
  variant: SportBlockVariant;
  name: LocalizedText;
  description: LocalizedText;
  /** About 10. */
  estimatedMinutes: number;
  items: ReadyItemDTO[];
}

export interface ReadyWorkoutDetailDTO extends ReadyWorkoutSummaryDTO {
  warmupMinutes: number;
  items: ReadyItemDTO[];
  /** The sport finisher for the requested sport, or null (no sport asked, or no block suits this user). */
  sport: SportBlockDTO | null;
  /** Main workout plus sport block. */
  totalMinutes: number;
  /** Why anything was changed for this user, rendered client-side via i18n `ready.notes.<code>`. */
  notes: GenerationNote[];
}

export interface ReadyListResponse {
  workouts: ReadyWorkoutSummaryDTO[];
  /** Matches before paging. */
  total: number;
  /** Matches per focus under the other filters (the focus filter itself is ignored), for the chip counts. */
  facets: Partial<Record<ReadyFocus, number>>;
  /** Workouts that fit the filters but were left out because of the user's age or reported injuries. */
  hiddenForSafety: number;
}

export interface ReadyDetailResponse {
  workout: ReadyWorkoutDetailDTO;
}
