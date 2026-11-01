import { describe, expect, it } from 'vitest';
import { DISHES, FOODS, FOOD_BY_ID, DISH_BY_ID, MEAL_TEMPLATES } from '../data/content.ts';
import { allergenHits, deriveRecents, foldText, fromDish, fromFood, fromTemplate, macrosFor, matchScore, queryVariants, searchLoggables, servingPresets, type Loggable } from './foodSearch.ts';

const item = (id: string, nameHe: string, nameEn: string, extra: Partial<Loggable> = {}): Loggable => ({
  key: `food:${id}`, kind: 'food', id, nameHe, nameEn, per100: { kcal: 100, proteinG: 10, carbsG: 10, fatG: 1 }, servingG: 100, allergens: [], ...extra,
});
const CATALOG = [
  item('egg', 'ביצה קשה', 'Hard-boiled egg'), item('chicken', 'חזה עוף בגריל', 'Grilled chicken breast'), item('cuc', 'מלפפון', 'Cucumber'),
  item('milk', 'חלב 3%', 'Milk 3%'), item('hummus', 'חומוס', 'Hummus'), item('tomato', 'עגבניות', 'Tomatoes'),
];

describe('foodSearch normalisation', () => {
  it('folds final letters, niqqud and geresh', () => {
    expect(foldText('מלפפון')).toBe(foldText('מלפפונ'));
    expect(foldText('חָלָב')).toBe(foldText('חלב'));
    expect(foldText('ג׳חנון')).toBe(foldText('גחנון'));
  });
  it('matches Hebrew plural/feminine inflections and proclitics', () => {
    expect(searchLoggables(CATALOG, 'ביצים').map((i) => i.id)).toContain('egg');
    expect(searchLoggables(CATALOG, 'הביצה').map((i) => i.id)).toContain('egg');
    expect(searchLoggables(CATALOG, 'עגבניה').map((i) => i.id)).toContain('tomato');
    expect(searchLoggables(CATALOG, 'המלפפונים').map((i) => i.id)).toContain('cuc');
  });
  it('matches with niqqud in the query and final-letter variants', () => {
    expect(searchLoggables(CATALOG, 'חָלָב').map((i) => i.id)).toContain('milk');
    expect(searchLoggables(CATALOG, 'מלפפונ').map((i) => i.id)).toContain('cuc');
  });
  it('matches English both ways and across languages, requiring every token', () => {
    expect(searchLoggables(CATALOG, 'eggs').map((i) => i.id)).toContain('egg');
    expect(searchLoggables(CATALOG, 'chicken breast').map((i) => i.id)).toEqual(['chicken']);
    expect(searchLoggables(CATALOG, 'chicken rice')).toHaveLength(0);
    expect(searchLoggables(CATALOG, 'עוף')[0]?.id).toBe('chicken'); // Hebrew query, found via Hebrew name
    expect(searchLoggables(CATALOG, 'tomatoes').map((i) => i.id)).toContain('tomato');
  });
  it('ranks exact/prefix matches above substring matches and returns nothing for empty queries', () => {
    expect(matchScore('חלב', ['חלב 3%'])).toBeGreaterThan(matchScore('חלב', ['שוקולד חלבי']));
    expect(searchLoggables(CATALOG, '   ')).toEqual([]);
    expect(queryVariants(foldText('ביצים'))).toContain('ביצ');
  });
  it('searches the real content in both languages', () => {
    const all = [...FOODS.map(fromFood), ...DISHES.map(fromDish), ...MEAL_TEMPLATES.map((m) => fromTemplate(m, FOOD_BY_ID))];
    const food = FOODS[0]!;
    expect(searchLoggables(all, food.nameEn).some((i) => i.id === food.id)).toBe(true);
    expect(searchLoggables(all, food.nameHe).some((i) => i.id === food.id)).toBe(true);
  });
});

describe('macros and presets', () => {
  it('scales per-100 g macros', () => {
    expect(macrosFor({ kcal: 200, proteinG: 20, carbsG: 10, fatG: 5 }, 150)).toEqual({ kcal: 300, proteinG: 30, carbsG: 15, fatG: 7.5 });
  });
  it('offers serving presets including 100 g for foods', () => {
    expect(servingPresets({ kind: 'food', servingG: 60 })).toEqual([30, 60, 90, 100, 120]);
    expect(servingPresets({ kind: 'dish', servingG: 300 })).toEqual([150, 300, 450, 600]);
  });
});

describe('allergens and recents', () => {
  it('flags structured tags and keyword hits from names', () => {
    expect(allergenHits(item('x', 'גבינה לבנה', 'White cheese'), ['dairy', 'egg'])).toEqual(['dairy']);
    expect(allergenHits(item('y', 'לחם', 'Bread', { allergens: ['sesame'] }), ['sesame', 'gluten'])).toEqual(['sesame', 'gluten']);
    expect(allergenHits(item('z', 'אורז', 'Rice'), ['dairy'])).toEqual([]);
    expect(allergenHits(item('w', 'חלב', 'Milk'), [])).toEqual([]);
  });
  it('derives recents by frequency then recency', () => {
    const r = deriveRecents([
      { name: 'A', grams: 100, kcal: 100, proteinG: 1, carbsG: 1, fatG: 1, foodId: 'a' },
      { name: 'B', grams: 50, kcal: 100, proteinG: 1, carbsG: 1, fatG: 1 },
      { name: 'A', grams: 120, kcal: 120, proteinG: 1, carbsG: 1, fatG: 1, foodId: 'a' },
    ], FOOD_BY_ID, DISH_BY_ID);
    expect(r.map((x) => x.nameEn)).toEqual(['A', 'B']);
    expect(r[0]!.uses).toBe(2); expect(r[0]!.servingG).toBe(120); expect(r[0]!.per100.kcal).toBeCloseTo(100);
  });
});
