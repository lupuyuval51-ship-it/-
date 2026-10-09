import type { Allergen, AnimalSource, FoodCategory, FoodContains, MealType } from '../constants';
import type { FoodConflict, Macros } from '../nutrition';
import type { ISODate, ISODateTime, LocalizedText } from './common';
import type { RewardResultDTO } from './gamification';
import type { NutritionTargetsDTO } from './profile';

export type FoodSource = 'builtin' | 'user' | 'openfoodfacts';

export interface FoodNutrientsDTO {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number | null;
  sodiumMg: number | null;
}

export interface FoodDTO {
  id: string;
  slug: string | null;
  source: FoodSource;
  name: LocalizedText;
  brand: string | null;
  barcode: string | null;
  category: FoodCategory;
  /** Per 100 g. */
  per100g: FoodNutrientsDTO;
  serving: { grams: number; label: LocalizedText };
  allergens: Allergen[];
  animalSource: AnimalSource;
  contains: FoodContains[];
  /** Created by the signed-in user (editable). */
  isOwn: boolean;
  /** Conflicts with the signed-in user's allergies / diet / restrictions. */
  conflicts: FoodConflict[];
}

export type FoodLogSource = 'manual' | 'barcode' | 'photo' | 'saved_meal' | 'suggestion' | 'quick_add';

/** Current per-100 g values of the logged food (lets the client preview amount changes). */
export interface FoodLogFoodRefDTO {
  per100g: { kcal: number; protein: number; carbs: number; fat: number; fiber: number };
  servingGrams: number;
  servingLabel: LocalizedText;
}

export interface FoodLogEntryDTO {
  id: string;
  date: ISODate;
  mealType: MealType;
  foodId: string | null;
  foodName: LocalizedText;
  grams: number | null;
  servings: number | null;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  /** User manually corrected the nutrient values. */
  isCorrected: boolean;
  source: FoodLogSource;
  note: string;
  createdAt: ISODateTime;
  /** The food this entry was logged from (null for quick-add entries and deleted foods). */
  foodRef?: FoodLogFoodRefDTO | null;
}

export interface MealGroupDTO {
  entries: FoodLogEntryDTO[];
  totals: Macros;
}

export interface DayNutritionDTO {
  date: ISODate;
  targets: NutritionTargetsDTO | null;
  totals: Macros;
  meals: Record<MealType, MealGroupDTO>;
  /** targets − totals (may be negative), null without targets. */
  remaining: Macros | null;
}

export interface NutritionDaySummary {
  date: ISODate;
  totals: Macros;
  entryCount: number;
}

export interface NutritionSummaryDTO {
  from: ISODate;
  to: ISODate;
  days: NutritionDaySummary[];
  daysLogged: number;
  /** Averages over logged days only (null when nothing logged). */
  averages: Macros | null;
  targets: NutritionTargetsDTO | null;
}

export interface SavedMealItemDTO {
  id: string;
  food: FoodDTO;
  grams: number;
  nutrients: Macros;
}

export interface SavedMealDTO {
  id: string;
  name: string;
  mealType: MealType | null;
  items: SavedMealItemDTO[];
  totals: Macros;
  createdAt: ISODateTime;
}

export interface FrequentFoodDTO {
  food: FoodDTO;
  timesLogged: number;
  lastGrams: number;
}

export interface MealSuggestionDTO {
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  mealTypes: MealType[];
  prepMinutes: number;
  /** Suggested portion multiplier (0.5–1.5); `items` and `totals` are already scaled by it. */
  scale: number;
  items: { food: FoodDTO; grams: number; nutrients: Macros }[];
  totals: Macros;
  /** Codes explaining the ranking (e.g. 'high_protein', 'fits_remaining_calories'). */
  reasons: string[];
}

export interface FoodSuggestionDTO {
  food: FoodDTO;
  grams: number;
  nutrients: Macros;
  reason: string;
}

export interface NutritionSuggestionsDTO {
  date: ISODate;
  mealType: MealType;
  remaining: Macros | null;
  meals: MealSuggestionDTO[];
  /** Single foods that help close the biggest remaining gap (usually protein). */
  foods: FoodSuggestionDTO[];
}

export interface PhotoAnalysisItemDTO {
  name: string;
  estimatedGrams: number;
  /** Best matching food from the database (user must confirm before logging). */
  match: FoodDTO | null;
  /** Model's own per-100 g estimate, used only if no match is chosen. */
  estimatedPer100g: { kcal: number; protein: number; carbs: number; fat: number } | null;
  confidence: 'low' | 'medium' | 'high';
}

export interface PhotoAnalysisDTO {
  items: PhotoAnalysisItemDTO[];
  /** Always shown: estimates from a photo are approximate and must be reviewed. */
  notes: string[];
  model: string;
}

// ---------------------------------------------------------------------------
// Response envelopes
// ---------------------------------------------------------------------------

export interface FoodsResponse {
  foods: FoodDTO[];
}

export interface FoodResponse {
  food: FoodDTO;
}

export interface FoodAlternativesResponse {
  alternatives: FoodDTO[];
}

export interface FrequentFoodsResponse {
  foods: FrequentFoodDTO[];
}

export interface LogEntryResponse {
  entry: FoodLogEntryDTO;
  day: DayNutritionDTO;
  reward: RewardResultDTO;
}

export interface LogEntriesResponse {
  entries: FoodLogEntryDTO[];
  day: DayNutritionDTO;
  reward: RewardResultDTO;
}

export interface CopyLogsResponse {
  copied: number;
  day: DayNutritionDTO;
  reward: RewardResultDTO;
}

export interface DeleteLogEntryResponse {
  ok: true;
  day: DayNutritionDTO;
}

export interface SavedMealsResponse {
  meals: SavedMealDTO[];
}

export interface SavedMealResponse {
  meal: SavedMealDTO;
}
