/**
 * Read-only access to the built-in food database and meal templates for the
 * built-in coach (meal ideas, protein suggestions). Global content only — no user data.
 */
import type { Allergen, AnimalSource, FoodCategory, FoodContains, MealType } from '@shared/constants';
import type { LocalizedText } from '@shared/content';
import { round1, scaleNutrients, sumMacros, type Macros, type Per100g } from '@shared/nutrition';
import type { Sql } from '../../db/pool';

export interface FoodData {
  slug: string;
  name: LocalizedText;
  category: FoodCategory;
  per100g: Per100g;
  servingGrams: number;
  servingLabel: LocalizedText;
  allergens: Allergen[];
  animalSource: AnimalSource;
  contains: FoodContains[];
}

export interface MealTemplateData {
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  mealTypes: MealType[];
  prepMinutes: number;
  items: { food: FoodData; grams: number }[];
  macros: Macros;
}

export interface FoodCatalog {
  foods: FoodData[];
  templates: MealTemplateData[];
}

interface FoodRow {
  slug: string;
  name: LocalizedText;
  category: FoodCategory;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  serving_grams: number;
  serving_label: LocalizedText;
  allergens: Allergen[];
  animal_source: AnimalSource;
  contains: FoodContains[];
}

/** Builds a template's ingredient list and macros; null if any ingredient is unknown. */
export function buildTemplate(
  t: { slug: string; name: LocalizedText; description: LocalizedText; mealTypes: MealType[]; prepMinutes: number; items: { foodSlug: string; grams: number }[] },
  foods: Map<string, FoodData>,
): MealTemplateData | null {
  const items: MealTemplateData['items'] = [];
  for (const it of t.items) {
    const food = foods.get(it.foodSlug);
    if (!food) return null;
    items.push({ food, grams: it.grams });
  }
  if (!items.length) return null;
  const macros = sumMacros(items.map((i) => scaleNutrients(i.food.per100g, i.grams)));
  return { slug: t.slug, name: t.name, description: t.description, mealTypes: t.mealTypes, prepMinutes: t.prepMinutes, items, macros };
}

export async function loadFoodCatalog(sql: Sql): Promise<FoodCatalog> {
  const rows = await sql.many<FoodRow>(
    `SELECT slug, name, category, kcal, protein_g, carbs_g, fat_g, fiber_g, serving_grams, serving_label, allergens, animal_source, contains
       FROM foods WHERE source = 'builtin' AND owner_user_id IS NULL AND slug IS NOT NULL ORDER BY slug`,
  );
  const foods: FoodData[] = rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    category: r.category,
    per100g: { kcal: Number(r.kcal), protein: Number(r.protein_g), carbs: Number(r.carbs_g), fat: Number(r.fat_g), fiber: Number(r.fiber_g) },
    servingGrams: round1(Number(r.serving_grams)),
    servingLabel: r.serving_label,
    allergens: r.allergens ?? [],
    animalSource: r.animal_source,
    contains: r.contains ?? [],
  }));
  const bySlug = new Map(foods.map((f) => [f.slug, f]));
  const templateRows = await sql.many<{
    slug: string;
    name: LocalizedText;
    description: LocalizedText;
    meal_types: MealType[];
    items: { foodSlug: string; grams: number }[];
    prep_minutes: number;
  }>('SELECT slug, name, description, meal_types, items, prep_minutes FROM meal_templates ORDER BY slug');
  const templates = templateRows
    .map((t) => buildTemplate({ slug: t.slug, name: t.name, description: t.description, mealTypes: t.meal_types, prepMinutes: t.prep_minutes, items: t.items ?? [] }, bySlug))
    .filter((t): t is MealTemplateData => t != null);
  return { foods, templates };
}
