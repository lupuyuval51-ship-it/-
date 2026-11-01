/** Content dataset types. Authored data lives in content/data/**; derived fields are computed in build.ts. */
import type {
  Allergen, DietType, DietaryRestriction, Difficulty, Equipment, ExerciseCategory, InjuryArea, MealSlot,
  MovementPattern, Muscle, Place, Sport, FinisherVariant, WorkoutMode,
} from '../enums.js';
import type { ExerciseDef } from '../training.js';

export type VideoPriority = 'A' | 'B' | 'C' | 'D';

/** One authored exercise. Hebrew copy is gender-neutral (infinitives / noun phrases), units use gershayim. */
export interface ExerciseContent extends ExerciseDef {
  unilateral: boolean;
  /** 3–6 numbered technique steps. */
  stepsHe: readonly string[];
  stepsEn: readonly string[];
  /** 2–4 short coaching cues. */
  cuesHe: readonly string[];
  cuesEn: readonly string[];
  /** 2–4 common mistakes. */
  mistakesHe: readonly string[];
  mistakesEn: readonly string[];
  safetyHe: string;
  safetyEn: string;
  /** Video production priority: A ≈ 56 core clips bundled offline, then B, C, D. */
  videoPriority: VideoPriority;
}

export const FOOD_CATEGORIES = [
  'meat_poultry', 'fish_seafood', 'eggs_dairy', 'plant_protein', 'grains_bread', 'legumes', 'vegetables', 'fruits',
  'nuts_seeds', 'fats_oils', 'spreads_sauces', 'snacks_sweets', 'drinks', 'supplements',
] as const;
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

export type KosherClass = 'meat' | 'dairy' | 'pareve';

export interface FoodContent {
  id: string;
  nameHe: string;
  nameEn: string;
  category: FoodCategory;
  /** Values per 100 g (edible portion, as typically logged: cooked where stated in the name). */
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  servingG: number;
  servingNameHe: string;
  servingNameEn: string;
  allergens: readonly Allergen[];
  /** Diet types this food is compatible with. 'omnivore' is always implied. vegan ⇒ vegetarian ⇒ pescatarian. */
  diets: readonly DietType[];
  /** Restriction tags this food satisfies. */
  restrictionTags: readonly DietaryRestriction[];
  kosherClass: KosherClass;
}

export interface DishRaw {
  id: string;
  nameHe: string;
  nameEn: string;
  slots: readonly MealSlot[];
  ingredients: readonly { foodId: string; grams: number }[];
  prepMinutes: number;
}

export interface MealTemplateRaw {
  id: string;
  nameHe: string;
  nameEn: string;
  slot: MealSlot;
  items: readonly { foodId: string; grams: number }[];
}
export interface MealTemplate extends MealTemplateRaw {
  kcal: number; proteinG: number; carbsG: number; fatG: number;
}

export interface FinisherItem { exerciseId: string; workSec: number; restSec: number }
export interface FinisherContent {
  id: string;
  sport: Sport;
  variant: FinisherVariant;
  nameHe: string;
  nameEn: string;
  /** Honest framing: general physical preparation, not sport-skill training. */
  descriptionHe: string;
  descriptionEn: string;
  rounds: number;
  items: readonly FinisherItem[];
}

export type WorkoutFocus =
  | 'chest' | 'back' | 'shoulders' | 'arms' | 'biceps' | 'triceps' | 'core' | 'legs' | 'glutes' | 'quads' | 'hamstrings'
  | 'full_body' | 'upper' | 'lower' | 'push' | 'pull';
export const WORKOUT_STYLES = ['straight', 'superset', 'circuit', 'pyramid', 'density'] as const;
export type WorkoutStyle = (typeof WORKOUT_STYLES)[number];

export interface ReadyWorkoutContent {
  id: string;
  nameHe: string;
  nameEn: string;
  place: Place;
  mode: WorkoutMode;
  focus: WorkoutFocus;
  level: Difficulty;
  style: WorkoutStyle;
  /** Union of equipment (excluding 'none') needed by its exercises. */
  equipment: readonly Equipment[];
  /** Ordered exercise ids. Prescriptions are NOT stored: they are personalised per user at runtime. */
  exerciseIds: readonly string[];
  /** Exercises that form superset/circuit groupings, by index into exerciseIds (pairs/groups). */
  groups: readonly (readonly number[])[];
  /** Nominal duration with generic prescription, used for catalog filtering only. */
  nominalMinutes: number;
}

export type { ExerciseCategory, InjuryArea, MovementPattern, Muscle };
