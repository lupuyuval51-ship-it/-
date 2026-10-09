import { z } from 'zod';
import { ALLERGENS, ANIMAL_SOURCES, FOOD_CATEGORIES, FOOD_CONTAINS, LIMITS, MEAL_TYPES } from '../constants';
import { cleanText, dateString, requiredText, uuid } from './common';

const grams = z.number().positive().max(LIMITS.foodGramsMax);

export const createLogEntrySchema = z
  .object({
    date: dateString,
    mealType: z.enum(MEAL_TYPES),
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
  mealType: z.enum(MEAL_TYPES),
  name: requiredText(LIMITS.textShortMax),
  kcal: z.number().min(0).max(5000),
  proteinG: z.number().min(0).max(500).default(0),
  carbsG: z.number().min(0).max(1000).default(0),
  fatG: z.number().min(0).max(500).default(0),
  fiberG: z.number().min(0).max(200).default(0),
  note: cleanText(200).default(''),
});

/** Edit an entry: change amount/meal/date, or correct nutrient values manually. */
export const updateLogEntrySchema = z.object({
  date: dateString.optional(),
  mealType: z.enum(MEAL_TYPES).optional(),
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
});

export const foodSearchQuerySchema = z.object({
  q: cleanText(80).default(''),
  category: z.enum(FOOD_CATEGORIES).optional(),
  compatibleOnly: z.union([z.boolean(), z.enum(['true', 'false'])]).transform((v) => v === true || v === 'true').default(false),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const customFoodSchema = z
  .object({
    name: requiredText(LIMITS.textShortMax),
    brand: cleanText(80).nullable().default(null),
    barcode: z.string().regex(/^\d{6,14}$/).nullable().default(null),
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
  })
  .refine((f) => f.per100g.protein + f.per100g.carbs + f.per100g.fat <= 100.5, { message: 'macros_exceed_100g', path: ['per100g'] });

export const savedMealSchema = z.object({
  name: requiredText(LIMITS.textShortMax),
  mealType: z.enum(MEAL_TYPES).nullable().default(null),
  items: z.array(z.object({ foodId: uuid, grams })).min(1).max(30),
});

export const logSavedMealSchema = z.object({ date: dateString, mealType: z.enum(MEAL_TYPES) });

export const logTemplateSchema = z.object({ date: dateString, mealType: z.enum(MEAL_TYPES), scale: z.number().min(0.25).max(4).default(1) });

export const photoAnalysisSchema = z.object({
  /** base64 (no data: prefix) JPEG/PNG/WEBP, ≤ 5 MB decoded */
  imageBase64: z.string().min(100).max(7_000_000),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  mealType: z.enum(MEAL_TYPES).optional(),
});
