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
  TrackingType,
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
