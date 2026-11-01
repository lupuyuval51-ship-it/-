/** Derives dishes and meal templates from authored ingredients + the food table, so macros are never hand-typed. */
import type { Allergen, DietType, DietaryRestriction } from '../enums.js';
import type { Dish } from '../menu.js';
import type { DishRaw, FoodContent, MealTemplate, MealTemplateRaw } from './types.js';

const r1 = (n: number) => Math.round(n * 10) / 10;

export function foodMap(foods: readonly FoodContent[]): Map<string, FoodContent> {
  return new Map(foods.map((f) => [f.id, f]));
}

interface Combined { kcal: number; proteinG: number; carbsG: number; fatG: number; fiberG: number }

export function sumMacros(items: readonly { foodId: string; grams: number }[], foods: ReadonlyMap<string, FoodContent>): Combined {
  const t: Combined = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
  for (const it of items) {
    const f = foods.get(it.foodId);
    if (!f) throw new Error(`unknown_food:${it.foodId}`);
    const k = it.grams / 100;
    t.kcal += f.kcal * k; t.proteinG += f.proteinG * k; t.carbsG += f.carbsG * k; t.fatG += f.fatG * k; t.fiberG += f.fiberG * k;
  }
  return t;
}

const DIETS: readonly DietType[] = ['vegan', 'vegetarian', 'pescatarian', 'kosher'];
const RESTRICTIONS: readonly DietaryRestriction[] = ['no_pork', 'halal', 'low_sodium', 'lactose_free'];

export function buildDish(raw: DishRaw, foods: ReadonlyMap<string, FoodContent>): Dish {
  const used = raw.ingredients.map((i) => {
    const f = foods.get(i.foodId);
    if (!f) throw new Error(`unknown_food:${i.foodId} in dish ${raw.id}`);
    return f;
  });
  const m = sumMacros(raw.ingredients, foods);
  const allergens = new Set<Allergen>();
  for (const f of used) for (const a of f.allergens) allergens.add(a);

  const hasMeat = used.some((f) => f.kosherClass === 'meat');
  const hasDairy = used.some((f) => f.kosherClass === 'dairy');
  const diets: DietType[] = ['omnivore'];
  for (const d of DIETS) {
    if (!used.every((f) => f.diets.includes(d))) continue;
    if (d === 'kosher' && hasMeat && hasDairy) continue; // meat + dairy mix is not kosher
    diets.push(d);
  }
  const restrictionTags: DietaryRestriction[] = RESTRICTIONS.filter((t) => used.every((f) => f.restrictionTags.includes(t)));
  if (diets.includes('kosher')) restrictionTags.push('kosher');

  return {
    id: raw.id, nameHe: raw.nameHe, nameEn: raw.nameEn, slots: raw.slots,
    kcal: Math.round(m.kcal), proteinG: r1(m.proteinG), carbsG: r1(m.carbsG), fatG: r1(m.fatG),
    ingredients: raw.ingredients.map((i, idx) => ({ foodId: i.foodId, nameHe: used[idx]!.nameHe, nameEn: used[idx]!.nameEn, grams: i.grams })),
    allergens: [...allergens], diets, restrictionTags,
  };
}

export function buildMealTemplate(raw: MealTemplateRaw, foods: ReadonlyMap<string, FoodContent>): MealTemplate {
  const m = sumMacros(raw.items, foods);
  return { ...raw, kcal: Math.round(m.kcal), proteinG: r1(m.proteinG), carbsG: r1(m.carbsG), fatG: r1(m.fatG) };
}
