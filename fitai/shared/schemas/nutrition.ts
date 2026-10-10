import { z } from 'zod';
import { ALLERGENS, ANIMAL_SOURCES, FOOD_CATEGORIES, FOOD_CONTAINS, LIMITS, MEAL_TYPES, PROGRESS_PERIODS } from '../constants';
import { cleanText, dateString, requiredText, slugId, uuid } from './common';

const grams = z.number().positive().max(LIMITS.foodGramsMax);
const mealType = z.enum(MEAL_TYPES);

export const createLogEntrySchema = z
  .object({
    date: dateString,
    mealType,
    foodId: uuid,
    grams: grams.optional(),
    servings: z.number().positive().max(100).optional(),
    source: z.enum(['manual', 'barcode', 'photo', 'suggestion']).default('manual'),
    note: cleanText(200).default(''),
  })
  .refine((v) => (v.grams == null) !== (v.servings == null), { message: 'grams_or_servings_required', path: ['grams'] });

/** Manual entry without a database food ("quick add"). */
export const quickAddSchema = z.object({
  date: dateString,
  mealType,
  name: requiredText(LIMITS.textShortMax),
  kcal: z.number().min(0).max(5000),
  proteinG: z.number().min(0).max(500).default(0),
  carbsG: z.number().min(0).max(1000).default(0),
  fatG: z.number().min(0).max(500).default(0),
  fiberG: z.number().min(0).max(200).default(0),
  note: cleanText(200).default(''),
});

/** Edit an entry: change amount/meal/date, or correct nutrient values manually. */
export const updateLogEntrySchema = z
  .object({
    date: dateString.optional(),
    mealType: mealType.optional(),
    grams: grams.optional(),
    servings: z.number().positive().max(100).optional(),
    correction: z
      .object({
        kcal: z.number().min(0).max(5000),
        proteinG: z.number().min(0).max(500),
        carbsG: z.number().min(0).max(1000),
        fatG: z.number().min(0).max(500),
        fiberG: z.number().min(0).max(200).default(0),
      })
      .nullable()
      .optional(),
    note: cleanText(200).optional(),
  })
  .refine((v) => v.grams == null || v.servings == null, { message: 'grams_or_servings_required', path: ['grams'] });

/** Copy a day's (or one meal's) entries to another date ("same breakfast as yesterday"). */
export const copyLogsSchema = z.object({
  fromDate: dateString,
  toDate: dateString,
  mealType: mealType.optional(),
});

/** One item of a multi-item log (photo review): a database food, or an estimate without a food. */
export const batchLogItemSchema = z.union([
  z.object({ foodId: uuid, grams }).strict(),
  z
    .object({
      name: requiredText(LIMITS.textShortMax),
      grams: grams.nullable().default(null),
      kcal: z.number().min(0).max(5000),
      proteinG: z.number().min(0).max(500).default(0),
      carbsG: z.number().min(0).max(1000).default(0),
      fatG: z.number().min(0).max(500).default(0),
      fiberG: z.number().min(0).max(200).default(0),
    })
    .strict(),
]);

export const batchLogSchema = z.object({
  date: dateString,
  mealType,
  source: z.enum(['manual', 'photo']).default('manual'),
  items: z.array(batchLogItemSchema).min(1).max(20),
});

/** Undo a delete: re-creates an entry the user just removed, with its exact amount, values and correction flag. */
export const restoreLogEntrySchema = z.object({
  date: dateString,
  mealType,
  foodId: uuid.nullable(),
  foodName: z.object({ en: requiredText(LIMITS.textShortMax), he: requiredText(LIMITS.textShortMax) }),
  grams: grams.nullable(),
  servings: z.number().positive().max(100).nullable(),
  kcal: z.number().min(0).max(5000),
  proteinG: z.number().min(0).max(500),
  carbsG: z.number().min(0).max(1000),
  fatG: z.number().min(0).max(500),
  fiberG: z.number().min(0).max(200),
  isCorrected: z.boolean(),
  source: z.enum(['manual', 'barcode', 'photo', 'saved_meal', 'suggestion', 'quick_add']),
  note: cleanText(200).default(''),
});
export type RestoreLogEntryInput = z.input<typeof restoreLogEntrySchema>;

export const nutritionDayQuerySchema =z.object({ date: dateString.optional() });

export const nutritionSummaryQuerySchema = z.object({
  days: z.coerce
    .number()
    .int()
    .refine((d) => (PROGRESS_PERIODS as readonly number[]).includes(d), { message: 'invalid_period' })
    .default(7),
  to: dateString.optional(),
});

export const nutritionSuggestionsQuerySchema = z.object({
  date: dateString.optional(),
  mealType: mealType.optional(),
});

export const foodSearchQuerySchema = z.object({
  q: cleanText(80).default(''),
  category: z.enum(FOOD_CATEGORIES).optional(),
  compatibleOnly: z.union([z.boolean(), z.enum(['true', 'false'])]).transform((v) => v === true || v === 'true').default(false),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const barcodeSchema = z.string().regex(/^\d{6,14}$/, 'invalid_barcode');

const customFoodBase = z.object({
  name: requiredText(LIMITS.textShortMax),
  brand: cleanText(80).nullable().default(null),
  barcode: barcodeSchema.nullable().default(null),
  category: z.enum(FOOD_CATEGORIES),
  per100g: z.object({
    kcal: z.number().min(0).max(900),
    protein: z.number().min(0).max(100),
    carbs: z.number().min(0).max(100),
    fat: z.number().min(0).max(100),
    fiber: z.number().min(0).max(100).default(0),
    sugar: z.number().min(0).max(100).nullable().default(null),
    sodiumMg: z.number().min(0).max(100000).nullable().default(null),
  }),
  servingGrams: z.number().positive().max(2000),
  servingLabel: cleanText(60).default(''),
  allergens: z.array(z.enum(ALLERGENS)).max(ALLERGENS.length).default([]),
  animalSource: z.enum(ANIMAL_SOURCES).default('none'),
  contains: z.array(z.enum(FOOD_CONTAINS)).max(FOOD_CONTAINS.length).default([]),
});

const macrosFit = (p: { protein: number; carbs: number; fat: number } | undefined) => !p || p.protein + p.carbs + p.fat <= 100.5;

export const customFoodSchema = customFoodBase.refine((f) => macrosFit(f.per100g), { message: 'macros_exceed_100g', path: ['per100g'] });

/** Partial update of a user food (omitted fields are unchanged). */
export const updateCustomFoodSchema = customFoodBase
  .partial()
  .refine((f) => macrosFit(f.per100g), { message: 'macros_exceed_100g', path: ['per100g'] });

export const savedMealSchema = z.object({
  name: requiredText(LIMITS.textShortMax),
  mealType: mealType.nullable().default(null),
  items: z.array(z.object({ foodId: uuid, grams })).min(1).max(30),
});

/** Save a meal that is already logged on a day as a reusable saved meal. */
export const saveMealFromDaySchema = z.object({
  date: dateString,
  mealType,
  name: requiredText(LIMITS.textShortMax),
});

export const logSavedMealSchema = z.object({ date: dateString, mealType });

export const logTemplateSchema = z.object({ date: dateString, mealType, scale: z.number().min(0.25).max(4).default(1) });

export const mealTemplateSlugSchema = slugId;

export const photoAnalysisSchema = z.object({
  /** base64 (no data: prefix) JPEG/PNG/WEBP, ≤ 5 MB decoded */
  imageBase64: z.string().min(100).max(7_000_000),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  mealType: mealType.optional(),
});

export type CreateLogEntryInput = z.input<typeof createLogEntrySchema>;
export type QuickAddInput = z.input<typeof quickAddSchema>;
export type UpdateLogEntryInput = z.input<typeof updateLogEntrySchema>;
export type CopyLogsInput = z.input<typeof copyLogsSchema>;
export type BatchLogInput = z.input<typeof batchLogSchema>;
export type CustomFoodInput = z.input<typeof customFoodSchema>;
export type UpdateCustomFoodInput = z.input<typeof updateCustomFoodSchema>;
export type SavedMealInput = z.input<typeof savedMealSchema>;
export type SaveMealFromDayInput = z.input<typeof saveMealFromDaySchema>;
export type LogTemplateInput = z.input<typeof logTemplateSchema>;
export type PhotoAnalysisInput = z.input<typeof photoAnalysisSchema>;
