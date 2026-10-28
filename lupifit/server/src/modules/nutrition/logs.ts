/**
 * Food logging. Every entry stores a nutrient SNAPSHOT computed server-side from the
 * stored food row at log time (never from client-supplied totals), so later edits to a
 * food — or its deletion — never change history.
 */
import { MEAL_TYPES, type MealType } from '@shared/constants';
import { addDays, dateRange, diffDays, todayInTimeZone } from '@shared/dates';
import { ZERO_MACROS, round1, scaleNutrients, subtractMacros, sumMacros, type Macros } from '@shared/nutrition';
import type { batchLogSchema, copyLogsSchema, createLogEntrySchema, quickAddSchema, restoreLogEntrySchema, updateLogEntrySchema } from '@shared/schemas/nutrition';
import type {
  DayNutritionDTO,
  FoodLogEntryDTO,
  FoodLogSource,
  FrequentFoodDTO,
  LocalizedText,
  MealGroupDTO,
  NutritionDaySummary,
  NutritionSummaryDTO,
  NutritionTargetsDTO,
  ProfileDTO,
  RewardResultDTO,
} from '@shared/types';
import type { z } from 'zod';
import type { Sql } from '../../db/pool';
import { notFound, unprocessable } from '../../lib/errors';
import { onFoodLogged } from '../gamification/hooks';
import { dietPreferences, getProfile } from '../profile/repository';
import { per100gOf, requireVisibleFood, toFoodDTO, visibleTo, type FoodRow } from './foods';

/** How far back entries may be logged or copied to, in days. */
export const MAX_PAST_DAYS = 3650;

interface EntryRow {
  id: string;
  user_id: string;
  logged_on: string;
  meal_type: MealType;
  food_id: string | null;
  food_name: LocalizedText;
  grams: number | null;
  servings: number | null;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  is_corrected: boolean;
  source: FoodLogSource;
  note: string;
  created_at: Date;
  ref_kcal: number | null;
  ref_protein_g: number | null;
  ref_carbs_g: number | null;
  ref_fat_g: number | null;
  ref_fiber_g: number | null;
  ref_serving_grams: number | null;
  ref_serving_label: LocalizedText | null;
}

const ENTRY_SELECT = `
  SELECT e.*, f.kcal AS ref_kcal, f.protein_g AS ref_protein_g, f.carbs_g AS ref_carbs_g, f.fat_g AS ref_fat_g,
         f.fiber_g AS ref_fiber_g, f.serving_grams AS ref_serving_grams, f.serving_label AS ref_serving_label
    FROM food_log_entries e
    LEFT JOIN foods f ON f.id = e.food_id AND ${visibleTo('f', 'e.user_id')}`;

export function entryMacros(row: Pick<EntryRow, 'kcal' | 'protein_g' | 'carbs_g' | 'fat_g' | 'fiber_g'>): Macros {
  return {
    kcal: Number(row.kcal),
    proteinG: Number(row.protein_g),
    carbsG: Number(row.carbs_g),
    fatG: Number(row.fat_g),
    fiberG: Number(row.fiber_g),
  };
}

function foodRefOf(row: EntryRow): FoodLogEntryDTO['foodRef'] {
  if (row.food_id == null || row.ref_kcal == null || row.ref_serving_grams == null) return null;
  return {
    per100g: {
      kcal: Number(row.ref_kcal),
      protein: Number(row.ref_protein_g),
      carbs: Number(row.ref_carbs_g),
      fat: Number(row.ref_fat_g),
      fiber: Number(row.ref_fiber_g),
    },
    servingGrams: Number(row.ref_serving_grams),
    servingLabel: row.ref_serving_label ?? { en: '', he: '' },
  };
}

export function toEntryDTO(row: EntryRow): FoodLogEntryDTO {
  const m = entryMacros(row);
  return {
    id: row.id,
    date: row.logged_on,
    mealType: row.meal_type,
    foodId: row.food_id,
    foodName: row.food_name,
    grams: row.grams != null ? Number(row.grams) : null,
    servings: row.servings != null ? Number(row.servings) : null,
    kcal: m.kcal,
    proteinG: m.proteinG,
    carbsG: m.carbsG,
    fatG: m.fatG,
    fiberG: m.fiberG,
    isCorrected: row.is_corrected,
    source: row.source,
    note: row.note,
    createdAt: new Date(row.created_at).toISOString(),
    foodRef: foodRefOf(row),
  };
}

export function targetsAsMacros(t: NutritionTargetsDTO): Macros {
  return { kcal: t.calories, proteinG: t.proteinG, carbsG: t.carbsG, fatG: t.fatG, fiberG: t.fiberG };
}

/** The user's calendar "today" in their time zone. */
export async function userToday(sql: Sql, userId: string): Promise<string> {
  const row = await sql.maybeOne<{ timezone: string }>('SELECT timezone FROM users WHERE id = $1', [userId]);
  return todayInTimeZone(row?.timezone ?? 'UTC');
}

/** Entries may be logged up to tomorrow (planning ahead) and not unreasonably far in the past. */
export function assertLoggableDate(date: string, today: string) {
  const diff = diffDays(date, today);
  if (diff > 1 || diff < -MAX_PAST_DAYS) throw unprocessable('date_out_of_range', 'Date is outside the allowed range');
}

export async function getEntriesForDay(sql: Sql, userId: string, date: string): Promise<EntryRow[]> {
  return sql.many<EntryRow>(ENTRY_SELECT + ' WHERE e.user_id = $1 AND e.logged_on = $2 ORDER BY e.created_at, e.id', [userId, date]);
}

export function buildDay(date: string, rows: EntryRow[], targets: NutritionTargetsDTO | null): DayNutritionDTO {
  const meals = Object.fromEntries(MEAL_TYPES.map((m) => [m, { entries: [], totals: { ...ZERO_MACROS } } as MealGroupDTO])) as Record<MealType, MealGroupDTO>;
  for (const row of rows) meals[row.meal_type].entries.push(toEntryDTO(row));
  for (const m of MEAL_TYPES) meals[m].totals = sumMacros(meals[m].entries.map((e) => ({ kcal: e.kcal, proteinG: e.proteinG, carbsG: e.carbsG, fatG: e.fatG, fiberG: e.fiberG })));
  const totals = sumMacros(MEAL_TYPES.map((m) => meals[m].totals));
  return {
    date,
    targets,
    totals,
    meals,
    remaining: targets ? subtractMacros(targetsAsMacros(targets), totals) : null,
  };
}

export async function getDay(sql: Sql, userId: string, date: string, profile?: ProfileDTO): Promise<DayNutritionDTO> {
  const p = profile ?? (await getProfile(sql, userId));
  return buildDay(date, await getEntriesForDay(sql, userId, date), p.targets);
}

async function getEntryRow(sql: Sql, userId: string, id: string, lock = false): Promise<EntryRow | null> {
  return sql.maybeOne<EntryRow>(ENTRY_SELECT + ' WHERE e.id = $1 AND e.user_id = $2' + (lock ? ' FOR UPDATE OF e' : ''), [id, userId]);
}

export interface NewEntry {
  date: string;
  mealType: MealType;
  foodId: string | null;
  foodName: LocalizedText;
  grams: number | null;
  servings: number | null;
  nutrients: Macros;
  isCorrected?: boolean;
  source: FoodLogSource;
  note?: string;
}

/** Inserts entries in order (distinct created_at keeps the display order stable). */
export async function insertEntries(sql: Sql, userId: string, entries: NewEntry[]): Promise<string[]> {
  const ids: string[] = [];
  for (const e of entries) {
    if (e.grams != null && e.grams > 5000) throw unprocessable('amount_too_large', 'Amount is too large');
    const { id } = await sql.one<{ id: string }>(
      `INSERT INTO food_log_entries (user_id, logged_on, meal_type, food_id, food_name, grams, servings, kcal, protein_g, carbs_g,
          fat_g, fiber_g, is_corrected, source, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, clock_timestamp())
       RETURNING id`,
      [
        userId,
        e.date,
        e.mealType,
        e.foodId,
        JSON.stringify(e.foodName),
        e.grams,
        e.servings,
        round1(e.nutrients.kcal),
        round1(e.nutrients.proteinG),
        round1(e.nutrients.carbsG),
        round1(e.nutrients.fatG),
        round1(e.nutrients.fiberG),
        e.isCorrected ?? false,
        e.source,
        e.note ?? '',
      ],
    );
    ids.push(id);
  }
  return ids;
}

/** A database food scaled to an amount, as a new entry. */
export function entryFromFood(food: FoodRow, opts: { date: string; mealType: MealType; grams: number; servings?: number | null; source: FoodLogSource; note?: string }): NewEntry {
  const grams = round1(opts.grams);
  return {
    date: opts.date,
    mealType: opts.mealType,
    foodId: food.id,
    foodName: food.name,
    grams,
    servings: opts.servings ?? null,
    nutrients: scaleNutrients(per100gOf(food), grams),
    source: opts.source,
    note: opts.note,
  };
}

async function reward(sql: Sql, userId: string, dates: string[]): Promise<RewardResultDTO> {
  let result: RewardResultDTO = { xpAwarded: 0, newAchievements: [], levelUp: null, notes: [] };
  for (const date of Array.from(new Set(dates))) {
    const r = await onFoodLogged(sql, { userId, date });
    result = {
      xpAwarded: result.xpAwarded + r.xpAwarded,
      newAchievements: [...result.newAchievements, ...r.newAchievements],
      levelUp: r.levelUp ?? result.levelUp,
      notes: [...result.notes, ...r.notes],
    };
  }
  return result;
}

export interface EntriesResult {
  entries: FoodLogEntryDTO[];
  day: DayNutritionDTO;
  reward: RewardResultDTO;
}

/** Inserts entries for one day/meal, triggers the reward hook and returns the fresh day. */
export async function logEntries(sql: Sql, userId: string, date: string, entries: NewEntry[]): Promise<EntriesResult> {
  const ids = await insertEntries(sql, userId, entries);
  const r = await reward(sql, userId, [date]);
  const day = await getDay(sql, userId, date);
  const all = MEAL_TYPES.flatMap((m) => day.meals[m].entries);
  return { entries: ids.map((id) => all.find((e) => e.id === id)!).filter(Boolean), day, reward: r };
}

export async function createEntry(sql: Sql, userId: string, input: z.output<typeof createLogEntrySchema>) {
  assertLoggableDate(input.date, await userToday(sql, userId));
  const food = await requireVisibleFood(sql, userId, input.foodId);
  const grams = input.grams ?? round1(input.servings! * Number(food.serving_grams));
  const result = await logEntries(sql, userId, input.date, [
    entryFromFood(food, { date: input.date, mealType: input.mealType, grams, servings: input.servings ?? null, source: input.source, note: input.note }),
  ]);
  return { entry: result.entries[0]!, day: result.day, reward: result.reward };
}

export async function quickAdd(sql: Sql, userId: string, input: z.output<typeof quickAddSchema>) {
  assertLoggableDate(input.date, await userToday(sql, userId));
  const result = await logEntries(sql, userId, input.date, [
    {
      date: input.date,
      mealType: input.mealType,
      foodId: null,
      foodName: { en: input.name, he: input.name },
      grams: null,
      servings: null,
      nutrients: { kcal: input.kcal, proteinG: input.proteinG, carbsG: input.carbsG, fatG: input.fatG, fiberG: input.fiberG },
      source: 'quick_add',
      note: input.note,
    },
  ]);
  return { entry: result.entries[0]!, day: result.day, reward: result.reward };
}

/** Logs several reviewed items at once (photo analysis): database foods or estimates without a food. */
export async function batchLog(sql: Sql, userId: string, input: z.output<typeof batchLogSchema>): Promise<EntriesResult> {
  assertLoggableDate(input.date, await userToday(sql, userId));
  const entries: NewEntry[] = [];
  for (const item of input.items) {
    if ('foodId' in item) {
      const food = await requireVisibleFood(sql, userId, item.foodId);
      entries.push(entryFromFood(food, { date: input.date, mealType: input.mealType, grams: item.grams, source: input.source }));
    } else {
      entries.push({
        date: input.date,
        mealType: input.mealType,
        foodId: null,
        foodName: { en: item.name, he: item.name },
        grams: item.grams != null ? round1(item.grams) : null,
        servings: null,
        nutrients: { kcal: item.kcal, proteinG: item.proteinG, carbsG: item.carbsG, fatG: item.fatG, fiberG: item.fiberG },
        source: input.source,
      });
    }
  }
  return logEntries(sql, userId, input.date, entries);
}

export async function updateEntry(sql: Sql, userId: string, id: string, input: z.output<typeof updateLogEntrySchema>) {
  const row = await getEntryRow(sql, userId, id, true);
  if (!row) throw notFound('entry_not_found', 'Log entry not found');
  const ref = foodRefOf(row);
  const isQuickAdd = row.food_id == null && row.grams == null;
  let grams = row.grams != null ? Number(row.grams) : null;
  let servings = row.servings != null ? Number(row.servings) : null;
  let nutrients = entryMacros(row);
  let isCorrected = row.is_corrected;

  if (input.date && input.date !== row.logged_on) assertLoggableDate(input.date, await userToday(sql, userId));

  if (input.grams != null || input.servings != null) {
    if (grams == null) throw unprocessable('entry_has_no_amount', 'This entry has no amount to change');
    const oldGrams = grams;
    if (input.servings != null) {
      if (!ref) throw unprocessable('food_unavailable', 'The original food is no longer available');
      servings = input.servings;
      grams = round1(input.servings * ref.servingGrams);
    } else {
      servings = null;
      grams = round1(input.grams!);
    }
    if (grams > 5000) throw unprocessable('amount_too_large', 'Amount is too large');
    if (!isCorrected) {
      if (ref) nutrients = scaleNutrients(ref.per100g, grams);
      else {
        // Food was deleted: scale the stored snapshot proportionally.
        const f = grams / oldGrams;
        nutrients = {
          kcal: round1(nutrients.kcal * f),
          proteinG: round1(nutrients.proteinG * f),
          carbsG: round1(nutrients.carbsG * f),
          fatG: round1(nutrients.fatG * f),
          fiberG: round1(nutrients.fiberG * f),
        };
      }
    }
  }

  if (input.correction === null) {
    if (isQuickAdd || !ref || grams == null) throw unprocessable('cannot_revert', 'There are no computed values to revert to');
    nutrients = scaleNutrients(ref.per100g, grams);
    isCorrected = false;
  } else if (input.correction) {
    const c = input.correction;
    nutrients = { kcal: round1(c.kcal), proteinG: round1(c.proteinG), carbsG: round1(c.carbsG), fatG: round1(c.fatG), fiberG: round1(c.fiberG) };
    // Quick-add values are the user's own numbers already; only database-derived values are "corrected".
    isCorrected = !isQuickAdd;
  }

  const date = input.date ?? row.logged_on;
  await sql.exec(
    `UPDATE food_log_entries
        SET logged_on = $3, meal_type = $4, grams = $5, servings = $6, kcal = $7, protein_g = $8, carbs_g = $9, fat_g = $10,
            fiber_g = $11, is_corrected = $12, note = $13
      WHERE id = $1 AND user_id = $2`,
    [
      id,
      userId,
      date,
      input.mealType ?? row.meal_type,
      grams,
      servings,
      nutrients.kcal,
      nutrients.proteinG,
      nutrients.carbsG,
      nutrients.fatG,
      nutrients.fiberG,
      isCorrected,
      input.note ?? row.note,
    ],
  );
  // Re-evaluate the (target) day: a new date, a different meal type or more protein can
  // complete it. Awards are idempotent per day, so repeated edits never earn twice.
  const r = await reward(sql, userId, [date]);
  const updated = await getEntryRow(sql, userId, id);
  return { entry: toEntryDTO(updated!), day: await getDay(sql, userId, date), reward: r };
}

export async function deleteEntry(sql: Sql, userId: string, id: string): Promise<DayNutritionDTO> {
  const row = await sql.maybeOne<{ logged_on: string }>('DELETE FROM food_log_entries WHERE id = $1 AND user_id = $2 RETURNING logged_on', [id, userId]);
  if (!row) throw notFound('entry_not_found', 'Log entry not found');
  return getDay(sql, userId, row.logged_on);
}

/** Undo for a delete: puts the removed entry back exactly as it was (amount, values and correction flag). */
export async function restoreEntry(sql: Sql, userId: string, input: z.output<typeof restoreLogEntrySchema>) {
  assertLoggableDate(input.date, await userToday(sql, userId));
  if (input.foodId) await requireVisibleFood(sql, userId, input.foodId);
  const result = await logEntries(sql, userId, input.date, [
    {
      date: input.date,
      mealType: input.mealType,
      foodId: input.foodId,
      foodName: input.foodName,
      grams: input.grams,
      servings: input.servings,
      nutrients: { kcal: input.kcal, proteinG: input.proteinG, carbsG: input.carbsG, fatG: input.fatG, fiberG: input.fiberG },
      isCorrected: input.isCorrected,
      source: input.source,
      note: input.note,
    },
  ]);
  return { entry: result.entries[0]!, day: result.day, reward: result.reward };
}

/** Copies a day's (or one meal's) entries — including any corrections — to another date. */
export async function copyEntries(sql: Sql, userId: string, input: z.output<typeof copyLogsSchema>) {
  if (input.fromDate === input.toDate) throw unprocessable('copy_same_date', 'Choose a different date to copy to');
  assertLoggableDate(input.toDate, await userToday(sql, userId));
  const copied = await sql.exec(
    `INSERT INTO food_log_entries (user_id, logged_on, meal_type, food_id, food_name, grams, servings, kcal, protein_g, carbs_g,
        fat_g, fiber_g, is_corrected, source, note, created_at)
     SELECT user_id, $3, meal_type, food_id, food_name, grams, servings, kcal, protein_g, carbs_g, fat_g, fiber_g, is_corrected,
            source, note, clock_timestamp()
       FROM (SELECT * FROM food_log_entries
              WHERE user_id = $1 AND logged_on = $2 AND ($4::text IS NULL OR meal_type = $4)
              ORDER BY created_at, id) src`,
    [userId, input.fromDate, input.toDate, input.mealType ?? null],
  );
  if (copied === 0) throw unprocessable('nothing_to_copy', 'Nothing is logged for that day or meal');
  const r = await reward(sql, userId, [input.toDate]);
  return { copied, day: await getDay(sql, userId, input.toDate), reward: r };
}

// ---------------------------------------------------------------------------
// Summaries & history
// ---------------------------------------------------------------------------

export async function nutritionSummary(sql: Sql, userId: string, days: number, toDate?: string): Promise<NutritionSummaryDTO> {
  const to = toDate ?? (await userToday(sql, userId));
  const from = addDays(to, -(days - 1));
  const rows = await sql.many<{ logged_on: string; entry_count: number; kcal: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number }>(
    `SELECT logged_on, count(*)::int AS entry_count, sum(kcal) AS kcal, sum(protein_g) AS protein_g, sum(carbs_g) AS carbs_g,
            sum(fat_g) AS fat_g, sum(fiber_g) AS fiber_g
       FROM food_log_entries
      WHERE user_id = $1 AND logged_on BETWEEN $2 AND $3
      GROUP BY logged_on`,
    [userId, from, to],
  );
  const byDate = new Map(rows.map((r) => [r.logged_on, r]));
  const list: NutritionDaySummary[] = dateRange(from, to).map((date) => {
    const r = byDate.get(date);
    return { date, totals: r ? sumMacros([entryMacros(r)]) : { ...ZERO_MACROS }, entryCount: r?.entry_count ?? 0 };
  });
  const logged = list.filter((d) => d.entryCount > 0);
  const total = sumMacros(logged.map((d) => d.totals));
  const n = logged.length;
  const profile = await getProfile(sql, userId);
  return {
    from,
    to,
    days: list,
    daysLogged: n,
    averages: n
      ? { kcal: round1(total.kcal / n), proteinG: round1(total.proteinG / n), carbsG: round1(total.carbsG / n), fatG: round1(total.fatG / n), fiberG: round1(total.fiberG / n) }
      : null,
    targets: profile.targets,
  };
}

async function foodHistory(sql: Sql, userId: string, mode: 'recent' | 'frequent'): Promise<FrequentFoodDTO[]> {
  const profile = await getProfile(sql, userId);
  const prefs = dietPreferences(profile);
  const today = await userToday(sql, userId);
  const since = mode === 'frequent' ? addDays(today, -89) : '0001-01-01';
  const rows = await sql.many<FoodRow & { times: number; last_grams: number; last_at: Date }>(
    `WITH stats AS (
        SELECT food_id, count(*)::int AS times, max(created_at) AS last_at
          FROM food_log_entries
         WHERE user_id = $1 AND food_id IS NOT NULL AND logged_on >= $2
         GROUP BY food_id
     ), last AS (
        SELECT DISTINCT ON (food_id) food_id, grams AS last_grams
          FROM food_log_entries
         WHERE user_id = $1 AND food_id IS NOT NULL AND grams IS NOT NULL AND logged_on >= $2
         ORDER BY food_id, created_at DESC
     )
     SELECT f.*, s.times, s.last_at, l.last_grams
       FROM stats s
       JOIN last l ON l.food_id = s.food_id
       JOIN foods f ON f.id = s.food_id AND ${visibleTo('f', '$1')}
      ORDER BY ${mode === 'frequent' ? 's.times DESC, s.last_at DESC' : 's.last_at DESC'}
      LIMIT 20`,
    [userId, since],
  );
  return rows.map((r) => ({ food: toFoodDTO(r, userId, prefs), timesLogged: r.times, lastGrams: Number(r.last_grams) }));
}

export const recentFoods = (sql: Sql, userId: string) => foodHistory(sql, userId, 'recent');
export const frequentFoods = (sql: Sql, userId: string) => foodHistory(sql, userId, 'frequent');
