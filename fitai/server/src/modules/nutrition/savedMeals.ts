/** Saved meals: reusable lists of foods + grams that can be logged in one tap. */
import type { MealType } from '@shared/constants';
import { round1, scaleNutrients, sumMacros, type DietPreferences, type Macros } from '@shared/nutrition';
import type { logSavedMealSchema, saveMealFromDaySchema, savedMealSchema } from '@shared/schemas/nutrition';
import type { SavedMealDTO } from '@shared/types';
import type { z } from 'zod';
import type { Sql } from '../../db/pool';
import { notFound, unprocessable } from '../../lib/errors';
import { per100gOf, toFoodDTO, visibleTo, type FoodRow } from './foods';
import { assertLoggableDate, entryFromFood, logEntries, userToday } from './logs';

export const MAX_SAVED_MEALS = 200;

interface MealRow {
  id: string;
  name: string;
  meal_type: MealType | null;
  created_at: Date;
}

type ItemRow = FoodRow & { item_id: string; saved_meal_id: string; item_grams: number; item_correction: Macros | null };

/** The item's nutrients: the user's saved correction when there is one, otherwise computed from the food. */
function itemNutrients(i: ItemRow): Macros {
  const c = i.item_correction;
  if (c) return { kcal: round1(c.kcal), proteinG: round1(c.proteinG), carbsG: round1(c.carbsG), fatG: round1(c.fatG), fiberG: round1(c.fiberG) };
  return scaleNutrients(per100gOf(i), Number(i.item_grams));
}

async function loadItems(sql: Sql, userId: string, mealIds: string[]): Promise<ItemRow[]> {
  if (!mealIds.length) return [];
  return sql.many<ItemRow>(
    `SELECT f.*, i.id AS item_id, i.saved_meal_id, i.grams AS item_grams, i.correction AS item_correction
       FROM saved_meal_items i
       JOIN foods f ON f.id = i.food_id AND ${visibleTo('f', '$1')}
      WHERE i.user_id = $1 AND i.saved_meal_id = ANY($2::uuid[])
      ORDER BY i.position, i.id`,
    [userId, mealIds],
  );
}

function toSavedMealDTO(meal: MealRow, items: ItemRow[], userId: string, prefs: DietPreferences): SavedMealDTO {
  const dtoItems = items.map((i) => {
    const grams = Number(i.item_grams);
    return { id: i.item_id, food: toFoodDTO(i, userId, prefs), grams, nutrients: itemNutrients(i), isCorrected: i.item_correction != null };
  });
  return {
    id: meal.id,
    name: meal.name,
    mealType: meal.meal_type,
    items: dtoItems,
    totals: sumMacros(dtoItems.map((i) => i.nutrients)),
    createdAt: new Date(meal.created_at).toISOString(),
  };
}

export async function listSavedMeals(sql: Sql, userId: string, prefs: DietPreferences): Promise<SavedMealDTO[]> {
  const meals = await sql.many<MealRow>('SELECT id, name, meal_type, created_at FROM saved_meals WHERE user_id = $1 ORDER BY created_at DESC, id', [userId]);
  const items = await loadItems(sql, userId, meals.map((m) => m.id));
  return meals.map((m) => toSavedMealDTO(m, items.filter((i) => i.saved_meal_id === m.id), userId, prefs));
}

export async function getSavedMeal(sql: Sql, userId: string, id: string, prefs: DietPreferences): Promise<SavedMealDTO> {
  const meal = await sql.maybeOne<MealRow>('SELECT id, name, meal_type, created_at FROM saved_meals WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!meal) throw notFound('saved_meal_not_found', 'Saved meal not found');
  return toSavedMealDTO(meal, await loadItems(sql, userId, [id]), userId, prefs);
}

async function insertSavedMeal(sql: Sql, userId: string, name: string, mealType: MealType | null, items: { foodId: string; grams: number; correction?: Macros | null }[]): Promise<string> {
  await sql.exec('SELECT pg_advisory_xact_lock(hashtext($1))', [`saved_meals:${userId}`]);
  const { count } = await sql.one<{ count: number }>('SELECT count(*)::int AS count FROM saved_meals WHERE user_id = $1', [userId]);
  if (count >= MAX_SAVED_MEALS) throw unprocessable('saved_meal_limit', 'Too many saved meals');
  const ids = Array.from(new Set(items.map((i) => i.foodId)));
  const visible = await sql.many<{ id: string }>(`SELECT f.id FROM foods f WHERE f.id = ANY($1::uuid[]) AND ${visibleTo('f', '$2')}`, [ids, userId]);
  if (visible.length !== ids.length) throw notFound('food_not_found', 'Food not found');
  const { id } = await sql.one<{ id: string }>('INSERT INTO saved_meals (user_id, name, meal_type) VALUES ($1, $2, $3) RETURNING id', [userId, name, mealType]);
  let position = 0;
  for (const item of items) {
    await sql.exec('INSERT INTO saved_meal_items (saved_meal_id, user_id, food_id, grams, position, correction) VALUES ($1, $2, $3, $4, $5, $6)', [
      id,
      userId,
      item.foodId,
      Math.round(item.grams * 10) / 10,
      position++,
      item.correction ? JSON.stringify(item.correction) : null,
    ]);
  }
  return id;
}

export async function createSavedMeal(sql: Sql, userId: string, prefs: DietPreferences, input: z.output<typeof savedMealSchema>): Promise<SavedMealDTO> {
  const id = await insertSavedMeal(sql, userId, input.name, input.mealType, input.items);
  return getSavedMeal(sql, userId, id, prefs);
}

/** Saves the foods logged for one meal of a day as a reusable meal (quick-add entries have no food and are skipped). */
export async function saveMealFromDay(sql: Sql, userId: string, prefs: DietPreferences, input: z.output<typeof saveMealFromDaySchema>): Promise<SavedMealDTO> {
  const entries = await sql.many<{ food_id: string; grams: number; is_corrected: boolean; kcal: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number }>(
    `SELECT e.food_id, e.grams, e.is_corrected, e.kcal, e.protein_g, e.carbs_g, e.fat_g, e.fiber_g
       FROM food_log_entries e
       JOIN foods f ON f.id = e.food_id AND ${visibleTo('f', '$1')}
      WHERE e.user_id = $1 AND e.logged_on = $2 AND e.meal_type = $3 AND e.grams IS NOT NULL
      ORDER BY e.created_at, e.id
      LIMIT 30`,
    [userId, input.date, input.mealType],
  );
  if (!entries.length) throw unprocessable('nothing_to_save', 'No foods from the database are logged for this meal');
  const id = await insertSavedMeal(
    sql,
    userId,
    input.name,
    input.mealType,
    // A manual correction made on the entry travels with the saved meal.
    entries.map((e) => ({
      foodId: e.food_id,
      grams: Number(e.grams),
      correction: e.is_corrected ? { kcal: Number(e.kcal), proteinG: Number(e.protein_g), carbsG: Number(e.carbs_g), fatG: Number(e.fat_g), fiberG: Number(e.fiber_g) } : null,
    })),
  );
  return getSavedMeal(sql, userId, id, prefs);
}

export async function deleteSavedMeal(sql: Sql, userId: string, id: string): Promise<void> {
  const n = await sql.exec('DELETE FROM saved_meals WHERE id = $1 AND user_id = $2', [id, userId]);
  if (n === 0) throw notFound('saved_meal_not_found', 'Saved meal not found');
}

/** Logs every item of a saved meal, computing nutrients from the current food values. */
export async function logSavedMeal(sql: Sql, userId: string, id: string, input: z.output<typeof logSavedMealSchema>) {
  const meal = await sql.maybeOne<MealRow>('SELECT id, name, meal_type, created_at FROM saved_meals WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!meal) throw notFound('saved_meal_not_found', 'Saved meal not found');
  assertLoggableDate(input.date, await userToday(sql, userId));
  const items = await loadItems(sql, userId, [id]);
  if (!items.length) throw unprocessable('saved_meal_empty', 'This saved meal has no foods left');
  return logEntries(
    sql,
    userId,
    input.date,
    items.map((i) => {
      const entry = entryFromFood(i, { date: input.date, mealType: input.mealType, grams: Number(i.item_grams), source: 'saved_meal' });
      // Keep the user's saved correction (and mark the entry as corrected, like the original).
      return i.item_correction ? { ...entry, nutrients: itemNutrients(i), isCorrected: true } : entry;
    }),
  );
}
