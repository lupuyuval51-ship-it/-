/**
 * Pure nutrition math shared by server (authoritative calculations) and client
 * (live previews). All food nutrient values are stored per 100 g.
 */
import {
  ACTIVITY_MULTIPLIERS,
  ADULT_AGE,
  type ActivityLevel,
  type Allergen,
  type AnimalSource,
  type DietaryRestriction,
  type DietType,
  type FoodContains,
  type Goal,
  type Sex,
} from './constants';

export interface Macros {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export interface Per100g {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export const ZERO_MACROS: Macros = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };

export const round1 = (n: number) => Math.round(n * 10) / 10;

/** Nutrients for `grams` of a food whose values are given per 100 g. */
export function scaleNutrients(per100g: Per100g, grams: number): Macros {
  const f = grams / 100;
  return {
    kcal: round1(per100g.kcal * f),
    proteinG: round1(per100g.protein * f),
    carbsG: round1(per100g.carbs * f),
    fatG: round1(per100g.fat * f),
    fiberG: round1(per100g.fiber * f),
  };
}

export function sumMacros(list: Macros[]): Macros {
  const total = list.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      proteinG: acc.proteinG + m.proteinG,
      carbsG: acc.carbsG + m.carbsG,
      fatG: acc.fatG + m.fatG,
      fiberG: acc.fiberG + m.fiberG,
    }),
    { ...ZERO_MACROS },
  );
  return {
    kcal: round1(total.kcal),
    proteinG: round1(total.proteinG),
    carbsG: round1(total.carbsG),
    fatG: round1(total.fatG),
    fiberG: round1(total.fiberG),
  };
}

export function subtractMacros(a: Macros, b: Macros): Macros {
  return {
    kcal: round1(a.kcal - b.kcal),
    proteinG: round1(a.proteinG - b.proteinG),
    carbsG: round1(a.carbsG - b.carbsG),
    fatG: round1(a.fatG - b.fatG),
    fiberG: round1(a.fiberG - b.fiberG),
  };
}

// ---------------------------------------------------------------------------
// Dietary compatibility
// ---------------------------------------------------------------------------

export interface DietPreferences {
  dietType: DietType | null;
  allergies: Allergen[];
  restrictions: DietaryRestriction[];
}

export interface FoodFlags {
  allergens: Allergen[];
  animalSource: AnimalSource;
  contains: FoodContains[];
}

export type FoodConflict =
  | { type: 'allergen'; value: Allergen }
  | { type: 'diet'; value: DietType }
  | { type: 'restriction'; value: DietaryRestriction };

const DIET_ALLOWED_SOURCES: Record<DietType, AnimalSource[]> = {
  omnivore: ['none', 'dairy_egg', 'fish', 'meat'],
  pescatarian: ['none', 'dairy_egg', 'fish'],
  vegetarian: ['none', 'dairy_egg'],
  vegan: ['none'],
};

const RESTRICTION_FLAG: Record<DietaryRestriction, FoodContains> = {
  no_pork: 'pork',
  no_beef: 'beef',
  no_shellfish: 'shellfish',
  no_alcohol: 'alcohol',
  lactose_free: 'lactose',
  gluten_free: 'gluten',
};

/** Every reason this food conflicts with the user's allergies, diet or restrictions. Empty = compatible. */
export function foodConflicts(food: FoodFlags, prefs: DietPreferences): FoodConflict[] {
  const out: FoodConflict[] = [];
  for (const a of prefs.allergies) if (food.allergens.includes(a)) out.push({ type: 'allergen', value: a });
  if (prefs.dietType && !DIET_ALLOWED_SOURCES[prefs.dietType].includes(food.animalSource)) {
    out.push({ type: 'diet', value: prefs.dietType });
  }
  for (const r of prefs.restrictions) if (food.contains.includes(RESTRICTION_FLAG[r])) out.push({ type: 'restriction', value: r });
  return out;
}

export const isFoodCompatible = (food: FoodFlags, prefs: DietPreferences) => foodConflicts(food, prefs).length === 0;

// ---------------------------------------------------------------------------
// Energy & macro targets
// ---------------------------------------------------------------------------

export interface TargetInput {
  ageYears: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}

/** Machine-readable explanation codes rendered through i18n (`nutrition.targetNotes.<code>`). */
export type TargetNoteCode =
  | 'minor_no_deficit'
  | 'minor_estimate'
  | 'deficit_applied'
  | 'deficit_capped'
  | 'surplus_applied'
  | 'maintenance'
  | 'floor_applied'
  | 'sex_unspecified_average'
  | 'protein_reference_weight'
  | 'carb_minimum_applied';

export interface ComputedTargets {
  bmr: number;
  tdee: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  /** Lowest calorie target the app will accept for this user (custom targets are clamped to it). */
  minimumCalories: number;
  notes: TargetNoteCode[];
}

/** Mifflin-St Jeor resting energy expenditure (kcal/day). */
export function mifflinStJeor(sex: Sex, weightKg: number, heightCm: number, ageYears: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  if (sex === 'male') return base + 5;
  if (sex === 'female') return base - 161;
  return base - 78; // average of the male/female constants
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

const PROTEIN_G_PER_KG: Record<Goal, number> = {
  muscle_gain: 1.8,
  strength: 1.8,
  fat_loss: 2.0,
  general_fitness: 1.4,
  athletic_performance: 1.6,
};

/** Absolute daily-calorie floors for adults, below which the app never sets or accepts a target. */
const ADULT_CALORIE_FLOOR: Record<Sex, number> = { male: 1500, female: 1200, unspecified: 1350 };

/**
 * Evidence-based, deliberately conservative targets:
 * - Mifflin-St Jeor BMR × activity multiplier.
 * - Fat loss (adults only): deficit of 20% of TDEE, capped at 500 kcal, never below BMR or the sex-specific floor.
 * - Minors (13–17): no calorie deficit; fat-loss goals are treated as maintenance with healthy habits.
 * - Muscle gain: lean surplus (+10%, 200–350 kcal); strength: small surplus (+5%, ≤250 kcal).
 * - Protein by goal in g/kg (reference weight for BMI > 30), fat 25–30% of energy, carbs = remainder (≥130 g).
 */
export function computeNutritionTargets(input: TargetInput): ComputedTargets {
  const notes: TargetNoteCode[] = [];
  const isMinor = input.ageYears < ADULT_AGE;
  if (input.sex === 'unspecified') notes.push('sex_unspecified_average');
  if (isMinor) notes.push('minor_estimate');

  const bmr = mifflinStJeor(input.sex, input.weightKg, input.heightCm, input.ageYears);
  const tdee = bmr * ACTIVITY_MULTIPLIERS[input.activityLevel];

  let calories = tdee;
  switch (input.goal) {
    case 'fat_loss':
      if (isMinor) {
        notes.push('minor_no_deficit');
      } else {
        const deficit = Math.min(0.2 * tdee, 500);
        if (0.2 * tdee > 500) notes.push('deficit_capped');
        notes.push('deficit_applied');
        calories = tdee - deficit;
      }
      break;
    case 'muscle_gain':
      calories = tdee + Math.min(350, Math.max(200, 0.1 * tdee));
      notes.push('surplus_applied');
      break;
    case 'strength':
      calories = tdee + Math.min(250, 0.05 * tdee);
      notes.push('surplus_applied');
      break;
    default:
      notes.push('maintenance');
  }

  const minimumCalories = isMinor ? Math.round(tdee * 0.95) : Math.round(Math.max(bmr, ADULT_CALORIE_FLOOR[input.sex]));
  if (calories < minimumCalories) {
    calories = minimumCalories;
    notes.push('floor_applied');
  }
  calories = roundTo(calories, 10);

  const heightM = input.heightCm / 100;
  const bmi = input.weightKg / (heightM * heightM);
  let referenceWeight = input.weightKg;
  if (bmi > 30) {
    referenceWeight = 27 * heightM * heightM;
    notes.push('protein_reference_weight');
  }
  const proteinPerKg = isMinor ? Math.min(PROTEIN_G_PER_KG[input.goal], 1.5) : PROTEIN_G_PER_KG[input.goal];
  const proteinG = Math.round(proteinPerKg * referenceWeight);

  const fatShare = isMinor ? 0.3 : 0.28;
  let fatG = Math.round(Math.max((calories * fatShare) / 9, 0.6 * referenceWeight));
  let carbsG = Math.round((calories - proteinG * 4 - fatG * 9) / 4);
  if (carbsG < 130) {
    // Keep a sensible carbohydrate minimum by trimming fat (but not below 20% of energy).
    const minFatG = Math.round((calories * 0.2) / 9);
    const needed = (130 - carbsG) * 4;
    const trim = Math.min(Math.max(0, fatG - minFatG), Math.ceil(needed / 9));
    fatG -= trim;
    carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
    notes.push('carb_minimum_applied');
  }
  const fiberG = Math.round((calories / 1000) * 14);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    minimumCalories,
    notes,
  };
}
