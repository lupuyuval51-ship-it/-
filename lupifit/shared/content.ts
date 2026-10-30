/**
 * Shapes of the built-in content datasets (exercise library, food database, meal
 * templates). Seed files under `server/src/data/` must satisfy these types; the
 * seeder copies them into PostgreSQL.
 */
import type {
  Allergen,
  AnimalSource,
  Difficulty,
  Equipment,
  ExerciseCategory,
  FoodCategory,
  FoodContains,
  InjuryArea,
  MealType,
  MovementPattern,
  Muscle,
  ReadyFocus,
  SportBlockVariant,
  SportId,
  TrackingType,
  TrainingLocation,
  TrainingMode,
} from './constants';

export interface LocalizedText {
  en: string;
  he: string;
}

export interface LocalizedList {
  en: string[];
  he: string[];
}

export interface ExerciseSeed {
  /** Stable snake_case slug, e.g. `barbell_back_squat`. Never rename once shipped. */
  id: string;
  name: LocalizedText;
  /** 1–2 sentence overview of what the exercise is and why it is useful. */
  description: LocalizedText;
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
  /** ALL equipment required. `[]` means it can be done with no equipment (household furniture allowed). */
  equipment: Equipment[];
  category: ExerciseCategory;
  movementPattern: MovementPattern;
  difficulty: Difficulty;
  trackingType: TrackingType;
  /** Performed one side at a time (reps are per side). */
  unilateral: boolean;
  /** Multi-joint movement (used for ordering and rest periods). */
  isCompound: boolean;
  /** 4–7 ordered execution steps. */
  instructions: LocalizedList;
  /** 3–5 common technique mistakes. */
  mistakes: LocalizedList;
  /** 2–4 safety recommendations. */
  safety: LocalizedList;
  /** Body areas for which this exercise should be avoided when the user reports an injury there. */
  contraindications: InjuryArea[];
  /** Ids of easier regressions (must exist in the library). */
  easierAlternatives: string[];
  /** Ids of harder progressions (must exist in the library). */
  harderAlternatives: string[];
  /** Smallest sensible load jump for progressive overload, or null for non-loaded exercises. */
  loadIncrementKg: number | null;
}

export interface NutrientsPer100g {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodiumMg: number;
}

export interface FoodSeed {
  /** Stable snake_case slug, e.g. `chicken_breast_cooked`. */
  slug: string;
  name: LocalizedText;
  category: FoodCategory;
  /** Values per 100 g of the food *as eaten* (state cooked/raw explicitly in the name when it matters). */
  per100g: NutrientsPer100g;
  /** A typical single serving. */
  serving: { grams: number; label: LocalizedText };
  allergens: Allergen[];
  animalSource: AnimalSource;
  contains: FoodContains[];
}

export interface MealTemplateSeed {
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  mealTypes: MealType[];
  /** Ingredients referencing FoodSeed slugs. */
  items: { foodSlug: string; grams: number }[];
  prepMinutes: number;
}

/** One exercise of a ready workout or sport block. Rep-tracked exercises use `reps`, timed ones use `seconds`. */
export interface ReadyItemSeed {
  exerciseId: string;
  sets: number;
  /** [min, max] reps per set (per side for unilateral exercises). Omit for timed exercises. */
  reps?: [number, number];
  /** Seconds per set for `trackingType: 'time'` exercises. Omit for rep-tracked exercises. */
  seconds?: number;
  restSeconds: number;
  /** One short coaching cue shown with the exercise in this workout. */
  cue?: LocalizedText;
}

/** A curated, ready-to-start workout. Equipment, muscles and length are derived from the items, never typed in. */
export interface ReadyWorkoutSeed {
  /** Stable snake_case slug, e.g. `chest_home_bodyweight_push_basics`. Never rename once shipped. */
  id: string;
  name: LocalizedText;
  /** 1-2 sentences: what it trains and who it suits. */
  description: LocalizedText;
  focus: ReadyFocus;
  mode: TrainingMode;
  level: Difficulty;
  /** Places the workout works in; `outdoor` is the park / street-workout area. */
  places: TrainingLocation[];
  /** 4-9 exercises in the order they are done. */
  items: ReadyItemSeed[];
}

/** A 10-minute block at the end of a workout that prepares the body for one sport. */
export interface SportBlockSeed {
  /** Stable snake_case slug, e.g. `soccer_bodyweight`. */
  id: string;
  sport: SportId;
  variant: SportBlockVariant;
  name: LocalizedText;
  description: LocalizedText;
  /** 4-6 stations that add up to about 10 minutes. */
  items: ReadyItemSeed[];
}
