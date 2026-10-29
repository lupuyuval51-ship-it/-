/**
 * Meal & food suggestions. Only meal templates whose EVERY item is compatible with the
 * user's allergies, diet and restrictions (and contains no disliked food) are suggested.
 * Ranking aims at adequate, balanced intake: the calories/protein still to eat today are
 * split across the remaining meals, and portions are scaled (0.5–1.5) to fit — never to
 * push the user below their targets.
 */
import { MEAL_TYPES, type FoodCategory, type MealType } from '@shared/constants';
import { isValidTimeZone, todayInTimeZone } from '@shared/dates';
import { foodConflicts, round1, scaleNutrients, subtractMacros, sumMacros, type DietPreferences, type Macros } from '@shared/nutrition';
import type { logTemplateSchema } from '@shared/schemas/nutrition';
import type { DayNutritionDTO, FoodSuggestionDTO, LocalizedText, MealSuggestionDTO, NutritionSuggestionsDTO, NutritionTargetsDTO, ProfileDTO } from '@shared/types';
import type { z } from 'zod';
import type { Sql } from '../../db/pool';
import { notFound, unprocessable } from '../../lib/errors';
import { dietPreferences, getProfile } from '../profile/repository';
import { getFoodsBySlugs, normalizeSearch, per100gOf, toFoodDTO, type FoodRow } from './foods';
import { assertLoggableDate, entryFromFood, getDay, logEntries, targetsAsMacros, userToday } from './logs';

export interface TemplateRow {
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  meal_types: MealType[];
  items: { foodSlug: string; grams: number }[];
  prep_minutes: number;
}

export const MAX_MEAL_SUGGESTIONS = 6;
export const MAX_FOOD_SUGGESTIONS = 5;
export const SCALE_MIN = 0.5;
export const SCALE_MAX = 1.5;

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested)
// ---------------------------------------------------------------------------

/** Keywords from the free-text "disliked foods" answer (EN/HE), with naive singular stems. */
export function dislikedKeywords(text: string): string[] {
  const out = new Set<string>();
  for (const part of text.split(/[,;\n\r/|•·،]+|\s+(?:and|or|או)\s+/i)) {
    const k = normalizeSearch(part);
    if (k.length < 2) continue;
    out.add(k);
    if (/[a-z]{4,}es$/.test(k)) out.add(k.slice(0, -2));
    if (/[a-z]{3,}s$/.test(k)) out.add(k.slice(0, -1));
    if (/[א-ת]{3,}(ים|ות)$/.test(k)) out.add(k.slice(0, -2));
  }
  return Array.from(out).filter((k) => k.length >= 2).slice(0, 60);
}

export function isDisliked(name: LocalizedText, keywords: string[]): boolean {
  if (!keywords.length) return false;
  const hay = ` ${normalizeSearch(name.en)} | ${normalizeSearch(name.he)} `;
  return keywords.some((k) => (k.length <= 3 ? hay.includes(` ${k} `) || hay.includes(` ${k}`) : hay.includes(k)));
}

/** 0..1 — how close the energy split is to a balanced plate (P 20–35 %, C 35–55 %, F 20–35 %). */
export function balanceScore(m: Macros): number {
  const energy = m.proteinG * 4 + m.carbsG * 4 + m.fatG * 9;
  if (energy <= 0) return 0;
  const shares = [
    [(m.proteinG * 4) / energy, 0.2, 0.35],
    [(m.carbsG * 4) / energy, 0.35, 0.55],
    [(m.fatG * 9) / energy, 0.2, 0.35],
  ] as const;
  const penalty = shares.reduce((acc, [v, lo, hi]) => acc + (v < lo ? lo - v : v > hi ? v - hi : 0), 0);
  return Math.max(0, 1 - penalty * 2);
}

export interface MealBudget {
  kcal: number;
  proteinG: number;
}

/**
 * Calories/protein still to eat today, split across the meals that are still to come
 * (based on `mealsPerDay`; meals already logged today — other than this one — are done).
 */
export function mealBudget(day: Pick<DayNutritionDTO, 'meals' | 'totals'>, targets: NutritionTargetsDTO | null, mealsPerDay: number | null, mealType: MealType): MealBudget | null {
  if (!targets) return null;
  const remaining = subtractMacros(targetsAsMacros(targets), day.totals);
  const planned = mealsPerDay ?? 3;
  // With 3 or fewer meals a day, snacks are extras — they do not use up one of the planned meals.
  const loggedOther = MEAL_TYPES.filter((m) => m !== mealType && (m !== 'snack' || planned > 3) && day.meals[m].entries.length > 0).length;
  const remainingMeals = Math.max(1, planned - loggedOther);
  return { kcal: Math.max(0, remaining.kcal) / remainingMeals, proteinG: Math.max(0, remaining.proteinG) / remainingMeals };
}

/** How strongly to favour protein: grows when the protein gap is relatively bigger than the calorie gap. */
export function proteinEmphasis(day: Pick<DayNutritionDTO, 'totals'>, targets: NutritionTargetsDTO | null): number {
  if (!targets || targets.calories <= 0 || targets.proteinG <= 0) return 0.35;
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  const kcalLeft = clamp01((targets.calories - day.totals.kcal) / targets.calories);
  const proteinLeft = clamp01((targets.proteinG - day.totals.proteinG) / targets.proteinG);
  return 0.3 + Math.min(0.5, Math.max(0, proteinLeft - kcalLeft)) * 0.6;
}

/** Portion multiplier that brings the meal close to the budget, in 0.25 steps within 0.5–1.5. */
export function portionScale(templateKcal: number, budget: MealBudget | null): number {
  if (!budget || budget.kcal <= 0 || templateKcal <= 0) return 1;
  const raw = Math.round((budget.kcal / templateKcal) * 4) / 4;
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, raw));
}

export interface RankedTemplate {
  scale: number;
  score: number;
  scaled: Macros;
  reasons: string[];
}

export function rankTemplate(
  totals: Macros,
  prepMinutes: number,
  budget: MealBudget | null,
  emphasis: number,
  prefs: DietPreferences,
): RankedTemplate {
  const scale = portionScale(totals.kcal, budget);
  const scaled = scaleMacros(totals, scale);
  const proteinEnergyShare = scaled.kcal > 0 ? (scaled.proteinG * 4) / scaled.kcal : 0;
  const balance = balanceScore(scaled);
  let score: number;
  const reasons: string[] = [];
  if (budget && budget.kcal > 0) {
    const kcalFit = Math.max(0, 1 - Math.abs(scaled.kcal - budget.kcal) / budget.kcal);
    // Protein already covered for today → protein is no longer a criterion.
    const proteinFit = budget.proteinG > 0 ? Math.min(1, scaled.proteinG / budget.proteinG) : 1;
    score = (0.85 - emphasis) * kcalFit + emphasis * proteinFit + 0.15 * balance;
    if (Math.abs(scaled.kcal - budget.kcal) <= budget.kcal * 0.2) reasons.push('fits_remaining_calories');
  } else {
    // No targets (or today's targets already reached): rank by balance & protein.
    score = 0.5 * Math.min(1, proteinEnergyShare / 0.3) + 0.5 * balance;
  }
  if (prepMinutes <= 10) score += 0.02;
  if (proteinEnergyShare >= 0.3 || scaled.proteinG >= 30) reasons.unshift('high_protein');
  if (balance >= 0.75) reasons.push('balanced_macros');
  if (prepMinutes <= 10) reasons.push('quick_to_make');
  if ((prefs.dietType && prefs.dietType !== 'omnivore') || prefs.allergies.length || prefs.restrictions.length) reasons.push('matches_diet');
  return { scale, score, scaled, reasons };
}

export function scaleMacros(m: Macros, f: number): Macros {
  return { kcal: round1(m.kcal * f), proteinG: round1(m.proteinG * f), carbsG: round1(m.carbsG * f), fatG: round1(m.fatG * f), fiberG: round1(m.fiberG * f) };
}

/** Which meal the user is most likely planning next (time of day for today, else the first unlogged one). */
export function nextMealType(day: Pick<DayNutritionDTO, 'meals'>, hour: number | null): MealType {
  const mains: MealType[] = ['breakfast', 'lunch', 'dinner'];
  const start = hour == null ? 0 : hour < 11 ? 0 : hour < 16 ? 1 : hour < 21 ? 2 : 3;
  for (let i = start; i < mains.length; i++) if (day.meals[mains[i]!].entries.length === 0) return mains[i]!;
  return 'snack';
}

function hourIn(timeZone: string, now = new Date()): number {
  const tz = isValidTimeZone(timeZone) ? timeZone : 'UTC';
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hour12: false }).format(now)) % 24;
}

// ---------------------------------------------------------------------------
// Data access
// ---------------------------------------------------------------------------

export async function loadTemplates(sql: Sql): Promise<TemplateRow[]> {
  return sql.many<TemplateRow>('SELECT slug, name, description, meal_types, items, prep_minutes FROM meal_templates ORDER BY slug');
}

interface ResolvedTemplate {
  template: TemplateRow;
  items: { food: FoodRow; grams: number }[];
}

async function resolveTemplates(sql: Sql, templates: TemplateRow[]): Promise<ResolvedTemplate[]> {
  const foods = await getFoodsBySlugs(sql, Array.from(new Set(templates.flatMap((t) => t.items.map((i) => i.foodSlug)))));
  const out: ResolvedTemplate[] = [];
  for (const template of templates) {
    const items = template.items.map((i) => ({ food: foods.get(i.foodSlug), grams: Number(i.grams) }));
    if (items.length === 0 || items.some((i) => !i.food)) continue; // dataset references a missing food
    out.push({ template, items: items as { food: FoodRow; grams: number }[] });
  }
  return out;
}

const templateCompatible = (t: ResolvedTemplate, prefs: DietPreferences, disliked: string[]) =>
  t.items.every(({ food }) => foodConflicts({ allergens: food.allergens, animalSource: food.animal_source, contains: food.contains }, prefs).length === 0 && !isDisliked(food.name, disliked));

/** Foods never suggested on their own (they are ingredients, not something to add to a meal). */
const NOT_STANDALONE: FoodCategory[] = ['condiments_sauces', 'fats_oils', 'beverages'];

/** Ranking nudge per past log of the same food (capped), so habits help but never override the nutrient gap. */
const HABIT_BONUS = 0.5;
const HABIT_BONUS_MAX_LOGS = 5;

export type Gap = 'protein' | 'fiber' | 'carbs' | 'fat';

/**
 * The nutrient gap single-food suggestions should help close. Protein comes first while at
 * least a quarter of the protein target is still open (it matters most for training and is
 * the most common shortfall), then fiber, then whichever energy macro is further behind.
 */
export function biggestGap(day: Pick<DayNutritionDTO, 'totals'>, targets: NutritionTargetsDTO | null): Gap | null {
  if (!targets) return 'protein';
  const left = (target: number, eaten: number) => (target > 0 ? (target - eaten) / target : 0);
  if (left(targets.proteinG, day.totals.proteinG) >= 0.25) return 'protein';
  if (left(targets.fiberG, day.totals.fiberG) >= 0.3) return 'fiber';
  if (left(targets.calories, day.totals.kcal) < 0.15) return null;
  const carbs = left(targets.carbsG, day.totals.carbsG);
  const fat = left(targets.fatG, day.totals.fatG);
  if (Math.max(carbs, fat) < 0.15) return null;
  return carbs >= fat ? 'carbs' : 'fat';
}

const GAP_FIELD: Record<Gap, keyof Pick<FoodRow, 'protein_g' | 'fiber_g' | 'carbs_g' | 'fat_g'>> = {
  protein: 'protein_g',
  fiber: 'fiber_g',
  carbs: 'carbs_g',
  fat: 'fat_g',
};

async function foodSuggestions(sql: Sql, userId: string, prefs: DietPreferences, disliked: string[], gap: Gap, hasTargets: boolean): Promise<FoodSuggestionDTO[]> {
  const rows = await sql.many<FoodRow>(`SELECT f.* FROM foods f WHERE f.source = 'builtin' AND f.owner_user_id IS NULL`);
  // Foods the user already logs often are more likely to actually get eaten: a small, capped nudge.
  const habit = new Map(
    (
      await sql.many<{ food_id: string; n: number }>(
        `SELECT food_id, COUNT(*)::int AS n FROM food_log_entries
          WHERE user_id = $1 AND food_id IS NOT NULL AND logged_on > CURRENT_DATE - 60 GROUP BY food_id`,
        [userId],
      )
    ).map((r) => [r.food_id, r.n]),
  );
  const field = GAP_FIELD[gap];
  const ranked = rows
    .filter((f) => !NOT_STANDALONE.includes(f.category))
    .filter((f) => Number(f.kcal) > 0 && Number(f[field]) > 0)
    .map((f) => ({ f, dto: toFoodDTO(f, userId, prefs) }))
    .filter(({ f, dto }) => dto.conflicts.length === 0 && !isDisliked(f.name, disliked))
    .map(({ f, dto }) => {
      const grams = Number(f.serving_grams);
      const nutrients = scaleNutrients(per100gOf(f), grams);
      // Density per 100 kcal, with a bonus for a meaningful amount per serving.
      const perServing = gap === 'protein' ? nutrients.proteinG : gap === 'fiber' ? nutrients.fiberG : gap === 'carbs' ? nutrients.carbsG : nutrients.fatG;
      const density = (Number(f[field]) / Number(f.kcal)) * 100;
      return { dto, grams, nutrients, score: density + perServing / 10 + HABIT_BONUS * Math.min(habit.get(f.id) ?? 0, HABIT_BONUS_MAX_LOGS) };
    })
    .sort((a, b) => b.score - a.score || a.dto.name.en.localeCompare(b.dto.name.en));
  const perCategory = new Map<string, number>();
  const out: FoodSuggestionDTO[] = [];
  for (const r of ranked) {
    const used = perCategory.get(r.dto.category) ?? 0;
    if (used >= 2) continue;
    perCategory.set(r.dto.category, used + 1);
    out.push({ food: r.dto, grams: r.grams, nutrients: r.nutrients, reason: hasTargets ? `${gap}_gap` : 'high_protein' });
    if (out.length >= MAX_FOOD_SUGGESTIONS) break;
  }
  return out;
}

export async function getSuggestions(
  sql: Sql,
  userId: string,
  opts: { date?: string; mealType?: MealType; limit?: number },
  profileArg?: ProfileDTO,
): Promise<NutritionSuggestionsDTO> {
  const profile = profileArg ?? (await getProfile(sql, userId));
  const prefs = dietPreferences(profile);
  const disliked = dislikedKeywords(profile.dislikedFoods);
  const tz = (await sql.maybeOne<{ timezone: string }>('SELECT timezone FROM users WHERE id = $1', [userId]))?.timezone ?? 'UTC';
  const today = todayInTimeZone(tz);
  const date = opts.date ?? today;
  const day = await getDay(sql, userId, date, profile);
  const mealType = opts.mealType ?? nextMealType(day, date === today ? hourIn(tz) : null);
  const targets = profile.targets;
  const budget = mealBudget(day, targets, profile.mealsPerDay, mealType);
  const emphasis = proteinEmphasis(day, targets);

  const resolved = (await resolveTemplates(sql, await loadTemplates(sql))).filter((t) => t.template.meal_types.includes(mealType) && templateCompatible(t, prefs, disliked));
  const meals: (MealSuggestionDTO & { score: number })[] = resolved.map(({ template, items }) => {
    const base = sumMacros(items.map((i) => scaleNutrients(per100gOf(i.food), i.grams)));
    const rank = rankTemplate(base, template.prep_minutes, budget, emphasis, prefs);
    const scaledItems = items.map((i) => {
      const grams = round1(i.grams * rank.scale);
      return { food: toFoodDTO(i.food, userId, prefs), grams, nutrients: scaleNutrients(per100gOf(i.food), grams) };
    });
    return {
      slug: template.slug,
      name: template.name,
      description: template.description,
      mealTypes: template.meal_types,
      prepMinutes: template.prep_minutes,
      scale: rank.scale,
      items: scaledItems,
      totals: sumMacros(scaledItems.map((i) => i.nutrients)),
      reasons: rank.reasons,
      score: rank.score,
    };
  });
  meals.sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));

  const gap = biggestGap(day, targets);
  const foods = gap ? await foodSuggestions(sql, userId, prefs, disliked, gap, targets != null) : [];
  return {
    date,
    mealType,
    remaining: day.remaining,
    meals: meals.slice(0, opts.limit ?? MAX_MEAL_SUGGESTIONS).map(({ score: _score, ...m }) => m),
    foods,
  };
}

/** Logs a meal template (scaled). Templates with any item that conflicts with the user's diet are rejected. */
export async function logTemplate(sql: Sql, userId: string, slug: string, input: z.output<typeof logTemplateSchema>) {
  const template = await sql.maybeOne<TemplateRow>('SELECT slug, name, description, meal_types, items, prep_minutes FROM meal_templates WHERE slug = $1', [slug]);
  if (!template) throw notFound('template_not_found', 'Meal suggestion not found');
  assertLoggableDate(input.date, await userToday(sql, userId));
  const [resolved] = await resolveTemplates(sql, [template]);
  if (!resolved) throw unprocessable('template_unavailable', 'This meal suggestion is currently unavailable');
  const profile = await getProfile(sql, userId);
  const prefs = dietPreferences(profile);
  if (!templateCompatible(resolved, prefs, [])) throw unprocessable('template_incompatible', 'This meal contains foods that do not fit your diet');
  // The list never offers disliked foods; re-check here because the profile may have changed since the page loaded.
  if (!templateCompatible(resolved, prefs, dislikedKeywords(profile.dislikedFoods))) throw unprocessable('template_disliked', 'This meal contains a food you said you dislike');
  return logEntries(
    sql,
    userId,
    input.date,
    resolved.items.map((i) => entryFromFood(i.food, { date: input.date, mealType: input.mealType, grams: i.grams * input.scale, source: 'suggestion' })),
  );
}
