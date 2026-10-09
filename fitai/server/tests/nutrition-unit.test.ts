import { describe, expect, it } from 'vitest';
import { MEAL_TYPES, type MealType } from '@shared/constants';
import { ZERO_MACROS, type Macros } from '@shared/nutrition';
import type { MealGroupDTO, NutritionTargetsDTO } from '@shared/types';
import { mapOffProduct } from '../src/modules/nutrition/barcode';
import { normalizeSearch, relevanceBucket } from '../src/modules/nutrition/foods';
import { validateImage } from '../src/modules/nutrition/photo';
import {
  balanceScore,
  biggestGap,
  dislikedKeywords,
  isDisliked,
  mealBudget,
  nextMealType,
  portionScale,
  proteinEmphasis,
  rankTemplate,
} from '../src/modules/nutrition/suggestions';

const TARGETS: NutritionTargetsDTO = { calories: 2400, proteinG: 150, carbsG: 280, fatG: 75, fiberG: 34, custom: false, computed: null };
const omnivore = { dietType: 'omnivore' as const, allergies: [], restrictions: [] };

function dayWith(logged: Partial<Record<MealType, number>>, totals: Partial<Macros> = {}) {
  const meals = Object.fromEntries(
    MEAL_TYPES.map((m) => [m, { entries: Array.from({ length: logged[m] ?? 0 }, () => ({})), totals: ZERO_MACROS } as unknown as MealGroupDTO]),
  ) as Record<MealType, MealGroupDTO>;
  return { meals, totals: { ...ZERO_MACROS, ...totals } };
}

describe('search helpers', () => {
  it('normalizes case, punctuation, niqqud and diacritics', () => {
    expect(normalizeSearch('  Chicken-Breast, (Grilled) ')).toBe('chicken breast grilled');
    expect(normalizeSearch('שָׁלוֹם  עוֹף')).toBe('שלום עוף');
    expect(normalizeSearch('Crème Brûlée')).toBe('creme brulee');
    expect(normalizeSearch('80/20 beef')).toBe('80 20 beef');
  });

  it('ranks full-prefix, word-prefix, substring and fuzzy matches', () => {
    const food = { name: { en: 'Chicken breast, grilled', he: 'חזה עוף צלוי' }, brand: null, search_text: 'chicken breast, grilled חזה עוף צלוי chicken breast cooked' };
    expect(relevanceBucket(food, ['chicken', 'breast'])).toBe(0);
    expect(relevanceBucket(food, ['breast'])).toBe(1);
    expect(relevanceBucket(food, ['עוף'])).toBe(1);
    expect(relevanceBucket(food, ['ill'])).toBe(2);
    expect(relevanceBucket(food, ['chiken'])).toBe(3);
  });
});

describe('Open Food Facts mapping', () => {
  const base = { product_name: 'Test', nutriments: { 'energy-kcal_100g': 100, proteins_100g: 5, carbohydrates_100g: 10, fat_100g: 3 } };

  it('maps every allergen tag', () => {
    const p = mapOffProduct({
      ...base,
      allergens_tags: ['en:gluten', 'en:milk', 'en:eggs', 'en:peanuts', 'en:nuts', 'en:soybeans', 'en:fish', 'en:crustaceans', 'en:molluscs', 'en:sesame-seeds', 'en:celery'],
    });
    expect(p.allergens.sort()).toEqual(['dairy', 'egg', 'fish', 'gluten', 'peanut', 'sesame', 'shellfish', 'soy', 'tree_nut']);
    expect(p.animalSource).toBe('fish');
    expect(p.contains.sort()).toEqual(['gluten', 'lactose', 'shellfish']);
  });

  it('falls back to kJ, converts sodium g→mg and defaults the serving to 100 g', () => {
    const p = mapOffProduct({ product_name: 'Kj food', nutriments: { 'energy-kj_100g': 418.4, proteins_100g: 1, carbohydrates_100g: 2, fat_100g: 3, sodium_100g: 0.25 }, serving_quantity: 5000 });
    expect(p.per100g.kcal).toBe(100);
    expect(p.per100g.sodiumMg).toBe(250);
    expect(p.per100g.sugar).toBeNull();
    expect(p.servingGrams).toBe(100);
  });

  it('classifies animal source conservatively', () => {
    expect(mapOffProduct({ ...base, categories_tags: ['en:meats', 'en:sausages'] }).animalSource).toBe('meat');
    expect(mapOffProduct({ ...base, ingredients_analysis_tags: ['en:vegan'] }).animalSource).toBe('none');
    expect(mapOffProduct({ ...base, ingredients_analysis_tags: ['en:non-vegetarian'] }).animalSource).toBe('meat');
    expect(mapOffProduct({ ...base, ingredients_analysis_tags: ['en:non-vegan', 'en:vegetarian'] }).animalSource).toBe('dairy_egg');
    // Unknown status: plant categories are plant-based, everything else may contain animal products.
    expect(mapOffProduct({ ...base, categories_tags: ['en:breakfast-cereals'] }).animalSource).toBe('none');
    expect(mapOffProduct({ ...base, categories_tags: ['en:biscuits'] }).animalSource).toBe('dairy_egg');
    expect(mapOffProduct({ ...base, categories_tags: ['en:pork'] }).contains).toContain('pork');
  });

  it('rejects incomplete or impossible products', () => {
    const codes = (raw: unknown) => {
      try {
        mapOffProduct(raw);
        return 'ok';
      } catch (err) {
        return (err as { code: string }).code;
      }
    };
    expect(codes({ ...base, product_name: '' })).toBe('barcode_incomplete');
    expect(codes({ product_name: 'x', nutriments: { proteins_100g: 1, carbohydrates_100g: 1, fat_100g: 1 } })).toBe('barcode_incomplete');
    expect(codes({ product_name: 'x', nutriments: { 'energy-kcal_100g': 950, proteins_100g: 1, carbohydrates_100g: 1, fat_100g: 1 } })).toBe('barcode_incomplete');
    expect(codes({ product_name: 'x', nutriments: { 'energy-kcal_100g': 400, proteins_100g: 60, carbohydrates_100g: 60, fat_100g: 1 } })).toBe('barcode_incomplete');
    expect(codes({ product_name: 'x', nutriments: { 'energy-kcal_100g': 400, proteins_100g: -1, carbohydrates_100g: 6, fat_100g: 1 } })).toBe('barcode_incomplete');
    expect(codes({ product_name: 'x', nutriments: { 'energy-kcal_100g': 'abc', proteins_100g: 1, carbohydrates_100g: 6, fat_100g: 1 } })).toBe('barcode_incomplete');
    expect(codes(base)).toBe('ok');
  });
});

describe('suggestion helpers', () => {
  it('extracts disliked keywords in English and Hebrew with simple plural stems', () => {
    const k = dislikedKeywords('Mushrooms, tomatoes; פטריות\nחצילים and olives');
    expect(k).toEqual(expect.arrayContaining(['mushrooms', 'mushroom', 'tomatoes', 'tomato', 'פטריות', 'פטרי', 'חצילים', 'חציל', 'olives', 'olive']));
    expect(isDisliked({ en: 'Mushroom, white, raw', he: 'פטריות שמפיניון' }, dislikedKeywords('mushrooms'))).toBe(true);
    expect(isDisliked({ en: 'Eggplant, roasted', he: 'חציל קלוי' }, dislikedKeywords('חצילים'))).toBe(true);
    expect(isDisliked({ en: 'Chickpeas, cooked', he: 'גרגרי חומוס' }, dislikedKeywords('chicken'))).toBe(false);
    expect(dislikedKeywords('')).toEqual([]);
  });

  it('scores balanced plates higher', () => {
    expect(balanceScore({ kcal: 500, proteinG: 35, carbsG: 55, fatG: 15, fiberG: 5 })).toBeGreaterThan(0.9);
    expect(balanceScore({ kcal: 884, proteinG: 0, carbsG: 0, fatG: 100, fiberG: 0 })).toBe(0);
    expect(balanceScore(ZERO_MACROS)).toBe(0);
  });

  it('splits the remaining day across remaining meals and never budgets below zero', () => {
    const budget = mealBudget(dayWith({ breakfast: 1 }, { kcal: 600, proteinG: 30 }), TARGETS, 3, 'lunch')!;
    expect(budget.kcal).toBe(900);
    expect(budget.proteinG).toBe(60);
    // The requested meal itself is one of the remaining meals even if it already has entries.
    expect(mealBudget(dayWith({ breakfast: 1, lunch: 2 }, { kcal: 600 }), TARGETS, 3, 'lunch')!.kcal).toBe(900);
    expect(mealBudget(dayWith({ breakfast: 1, lunch: 1, dinner: 1 }, { kcal: 3000, proteinG: 200 }), TARGETS, 3, 'snack')).toEqual({ kcal: 0, proteinG: 0 });
    expect(mealBudget(dayWith({}), null, 3, 'lunch')).toBeNull();
  });

  it('scales portions in 0.25 steps within 0.5–1.5', () => {
    expect(portionScale(500, { kcal: 500, proteinG: 30 })).toBe(1);
    expect(portionScale(500, { kcal: 640, proteinG: 30 })).toBe(1.25);
    expect(portionScale(500, { kcal: 5000, proteinG: 30 })).toBe(1.5);
    expect(portionScale(500, { kcal: 50, proteinG: 30 })).toBe(0.5);
    expect(portionScale(500, { kcal: 0, proteinG: 0 })).toBe(1);
    expect(portionScale(500, null)).toBe(1);
  });

  it('weights protein more when the protein gap is relatively larger', () => {
    const carbHeavy = proteinEmphasis({ totals: { ...ZERO_MACROS, kcal: 1200, proteinG: 10 } }, TARGETS);
    const balanced = proteinEmphasis({ totals: { ...ZERO_MACROS, kcal: 1200, proteinG: 75 } }, TARGETS);
    expect(carbHeavy).toBeGreaterThan(balanced);
    const budget = { kcal: 600, proteinG: 60 };
    const proteinMeal: Macros = { kcal: 550, proteinG: 55, carbsG: 40, fatG: 15, fiberG: 4 };
    const carbMeal: Macros = { kcal: 580, proteinG: 10, carbsG: 110, fatG: 10, fiberG: 4 };
    const p = rankTemplate(proteinMeal, 15, budget, carbHeavy, omnivore);
    const c = rankTemplate(carbMeal, 15, budget, carbHeavy, omnivore);
    expect(p.score).toBeGreaterThan(c.score);
    expect(p.reasons).toEqual(expect.arrayContaining(['high_protein', 'fits_remaining_calories']));
    expect(c.reasons).not.toContain('high_protein');
    expect(rankTemplate(proteinMeal, 5, budget, carbHeavy, { dietType: 'vegan', allergies: [], restrictions: [] }).reasons).toEqual(
      expect.arrayContaining(['quick_to_make', 'matches_diet']),
    );
  });

  it('picks the biggest gap, protein first', () => {
    expect(biggestGap({ totals: ZERO_MACROS }, TARGETS)).toBe('protein');
    expect(biggestGap({ totals: { ...ZERO_MACROS, proteinG: 140, kcal: 1000 } }, TARGETS)).toBe('fiber');
    expect(biggestGap({ totals: { kcal: 1500, proteinG: 140, fiberG: 30, carbsG: 100, fatG: 60 } }, TARGETS)).toBe('carbs');
    expect(biggestGap({ totals: { kcal: 2300, proteinG: 150, fiberG: 34, carbsG: 280, fatG: 75 } }, TARGETS)).toBeNull();
    expect(biggestGap({ totals: ZERO_MACROS }, null)).toBe('protein');
  });

  it('chooses the next meal by time of day and what is already logged', () => {
    expect(nextMealType(dayWith({}), 8)).toBe('breakfast');
    expect(nextMealType(dayWith({ breakfast: 1 }), 9)).toBe('lunch');
    expect(nextMealType(dayWith({}), 13)).toBe('lunch');
    expect(nextMealType(dayWith({}), 19)).toBe('dinner');
    expect(nextMealType(dayWith({ dinner: 1 }), 19)).toBe('snack');
    expect(nextMealType(dayWith({}), 22)).toBe('snack');
    expect(nextMealType(dayWith({ breakfast: 1 }), null)).toBe('lunch');
  });
});

describe('image validation', () => {
  const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xdb]), Buffer.alloc(200, 1)]);
  const code = (fn: () => unknown) => {
    try {
      fn();
      return 'ok';
    } catch (err) {
      return (err as { code: string }).code;
    }
  };

  it('checks base64, size and magic bytes', () => {
    expect(code(() => validateImage(jpeg.toString('base64'), 'image/jpeg'))).toBe('ok');
    expect(validateImage(`${jpeg.toString('base64').slice(0, 20)}\n${jpeg.toString('base64').slice(20)}`, 'image/jpeg')).toBe(jpeg.toString('base64'));
    expect(code(() => validateImage(jpeg.toString('base64'), 'image/png'))).toBe('invalid_image');
    expect(code(() => validateImage(jpeg.toString('base64'), 'image/webp'))).toBe('invalid_image');
    expect(code(() => validateImage('not*base64', 'image/jpeg'))).toBe('invalid_image');
    expect(code(() => validateImage(Buffer.concat([jpeg, Buffer.alloc(5 * 1024 * 1024)]).toString('base64'), 'image/jpeg'))).toBe('invalid_image');
  });
});
