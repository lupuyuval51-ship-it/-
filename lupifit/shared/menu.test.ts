import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALLERGENS, DIETARY_RESTRICTIONS } from './constants';
import { DISH_CATEGORIES, DISHES, dishById, dishImageUrl } from './dishes';
import { dishAllergens, dishFilter, dislikedKeywords, fitsDiet, NO_PREFERENCES } from './dishes/safety';
import { buildDailyMenu, SNACK_MAX_KCAL, ingredientNames, menuSlots, menuTotals, shoppingList, SCALE_MAX, SCALE_MIN, withDish } from './menu';

const TARGETS = { calories: 2200, proteinG: 150, carbsG: 240, fatG: 70 };
const day = (n: number) => `2026-10-${String(n).padStart(2, '0')}`;

describe('dish catalog', () => {
  it('has 300 unique dishes across all categories, each with a photo', () => {
    expect(DISHES).toHaveLength(300);
    expect(new Set(DISHES.map((d) => d.id)).size).toBe(300);
    for (const c of DISH_CATEGORIES) expect(DISHES.some((d) => d.category === c)).toBe(true);
    const dir = path.resolve(__dirname, '..', 'client', 'public');
    for (const d of DISHES) expect(fs.existsSync(path.join(dir, dishImageUrl(d.id))), d.id).toBe(true);
  });

  it('has names in both languages and sane nutrition', () => {
    for (const d of DISHES) {
      expect(d.name.he.length, d.id).toBeGreaterThan(1);
      expect(d.name.en.length, d.id).toBeGreaterThan(1);
      expect(d.ingredients.he.length, d.id).toBeGreaterThan(1);
      expect(d.ingredients.en.length, d.id).toBeGreaterThan(1);
      expect(d.kcal, d.id).toBeGreaterThan(0);
      expect(d.kcal, d.id).toBeLessThanOrEqual(800);
      for (const v of [d.proteinG, d.carbsG, d.fatG]) expect(v, d.id).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('dish safety filter', () => {
  it('hides every dish a keyword rule flags for each allergen', () => {
    for (const allergen of ALLERGENS) {
      const ok = dishFilter({ ...NO_PREFERENCES, allergies: [allergen] });
      for (const d of DISHES) {
        expect(ok(d), `${allergen}: ${d.id}`).toBe(!dishAllergens(d).includes(allergen));
      }
    }
  });

  it('knows obvious cases', () => {
    const shakshuka = dishById('b01')!;
    expect(dishAllergens(dishById('l22')!)).toContain('egg'); // "shakshuka" alone means eggs
    expect(dishAllergens(dishById('b55')!)).not.toContain('egg'); // tofu shakshuka
    expect(dishAllergens(shakshuka)).toContain('egg');
    expect(dishAllergens(shakshuka)).toContain('gluten'); // served with bread
    const oats = dishById('b04')!;
    expect(dishAllergens(oats)).toEqual(expect.arrayContaining(['gluten', 'dairy']));
    const tahini = DISHES.find((d) => /tahini/i.test(d.ingredients.en))!;
    expect(dishAllergens(tahini)).toContain('sesame');
    const peanut = DISHES.find((d) => /peanut/i.test(d.ingredients.en))!;
    expect(dishAllergens(peanut)).toContain('peanut');
    const tofu = DISHES.find((d) => /tofu/i.test(d.ingredients.en))!;
    expect(dishAllergens(tofu)).toContain('soy');
    const tuna = DISHES.find((d) => /\btuna\b/i.test(d.ingredients.en))!;
    expect(dishAllergens(tuna)).toContain('fish');
  });

  it('matches Hebrew ingredient names too', () => {
    const he = (id: string) => dishAllergens({ ...dishById(id)!, name: { he: 'מנה', en: 'x' }, ingredients: { he: 'טחינה, בוטנים, גבינה, ביצה, טונה', en: 'x' } });
    expect(he('b01')).toEqual(expect.arrayContaining(['sesame', 'peanut', 'dairy', 'egg', 'fish']));
  });

  it('applies diet types', () => {
    const vegan = DISHES.filter((d) => fitsDiet(d, 'vegan'));
    expect(vegan.length).toBeGreaterThan(20);
    for (const d of vegan) {
      expect(d.tags).toContain('vg');
      expect(d.ingredients.en).not.toMatch(/\b(eggs?|milk|cheese|yogh?urt|butter|honey|tuna|salmon|chicken)\b/i);
      expect(dishAllergens(d)).not.toContain('fish');
    }
    const veg = DISHES.filter((d) => fitsDiet(d, 'vegetarian'));
    expect(veg.length).toBeGreaterThan(vegan.length);
    for (const d of veg) expect(d.ingredients.en).not.toMatch(/\b(chicken|beef|tuna|salmon|turkey)\b/i);
    const pesc = DISHES.filter((d) => fitsDiet(d, 'pescatarian'));
    for (const d of pesc) expect(d.ingredients.en).not.toMatch(/\b(chicken|beef|turkey|shawarma)\b/i);
    expect(pesc.some((d) => /\b(tuna|salmon)\b/i.test(d.ingredients.en))).toBe(true);
    expect(DISHES.every((d) => fitsDiet(d, 'omnivore') && fitsDiet(d, null))).toBe(true);
  });

  it('applies dietary restrictions', () => {
    const noBeef = dishFilter({ ...NO_PREFERENCES, dietaryRestrictions: ['no_beef'] });
    for (const d of DISHES.filter((x) => /\b(beef|steak|ground meat)\b/i.test(x.ingredients.en))) expect(noBeef(d), d.id).toBe(false);
    const gf = dishFilter({ ...NO_PREFERENCES, dietaryRestrictions: ['gluten_free'] });
    const lf = dishFilter({ ...NO_PREFERENCES, dietaryRestrictions: ['lactose_free'] });
    for (const d of DISHES) {
      expect(gf(d)).toBe(!dishAllergens(d).includes('gluten'));
      expect(lf(d)).toBe(!dishAllergens(d).includes('dairy'));
    }
    expect(DIETARY_RESTRICTIONS).toContain('no_alcohol');
  });

  it('hides disliked foods in English and Hebrew', () => {
    expect(dislikedKeywords('tuna, פטריות; Olives')).toEqual(expect.arrayContaining(['tuna', 'פטריות', 'olives', 'olive', 'פטרי']));
    const ok = dishFilter({ ...NO_PREFERENCES, dislikedFoods: 'tuna, תרד' });
    for (const d of DISHES.filter((x) => /tuna|spinach/i.test(x.ingredients.en))) expect(ok(d), d.id).toBe(false);
  });
});

describe('daily menu', () => {
  it('has 3, 4 or 5 slots whose shares add up to one day', () => {
    for (const n of [null, 2, 3, 4, 5, 6]) {
      const slots = menuSlots(n);
      expect(slots.length).toBeGreaterThanOrEqual(3);
      expect(slots.length).toBeLessThanOrEqual(5);
      expect(slots.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1, 5);
    }
  });

  it('is deterministic and changes from day to day', () => {
    const a = buildDailyMenu({ seed: day(1), targets: TARGETS });
    expect(buildDailyMenu({ seed: day(1), targets: TARGETS })).toEqual(a);
    const ids = new Set(Array.from({ length: 10 }, (_, i) => buildDailyMenu({ seed: day(i + 1), targets: TARGETS }).items.map((x) => x.dishId).join()));
    expect(ids.size).toBeGreaterThan(5);
  });

  it('lands the day close to the targets for a wide range of calorie goals', () => {
    for (const calories of [1500, 1800, 2200, 2600, 3000]) {
      const targets = { calories, proteinG: Math.round((calories * 0.28) / 4), carbsG: Math.round((calories * 0.42) / 4), fatG: Math.round((calories * 0.3) / 9) };
      for (let i = 1; i <= 15; i++) {
        for (const mealsPerDay of [3, 4, 5]) {
          const m = buildDailyMenu({ seed: day(i), targets, mealsPerDay });
          expect(m.emptySlots).toEqual([]);
          expect(m.items).toHaveLength(menuSlots(mealsPerDay).length);
          expect(Math.abs(m.totals.kcal - calories) / calories, `${calories}/${mealsPerDay}/${i}: ${m.totals.kcal}`).toBeLessThan(0.1);
        }
      }
    }
  });

  it('keeps the day\'s macro mix reasonably close to the targets', () => {
    let worstProtein = 0;
    let worstCarbs = 0;
    for (const calories of [1800, 2200, 2600, 3000]) {
      const targets = { calories, proteinG: Math.round((calories * 0.28) / 4), carbsG: Math.round((calories * 0.42) / 4), fatG: Math.round((calories * 0.3) / 9) };
      for (let i = 1; i <= 15; i++) {
        const { totals } = buildDailyMenu({ seed: day(i), targets, mealsPerDay: 4 });
        worstProtein = Math.max(worstProtein, Math.abs(totals.proteinG - targets.proteinG) / targets.proteinG);
        worstCarbs = Math.max(worstCarbs, Math.abs(totals.carbsG - targets.carbsG) / targets.carbsG);
      }
    }
    expect(worstProtein).toBeLessThan(0.3);
    expect(worstCarbs).toBeLessThan(0.3);
  });

  it('keeps portions within bounds and totals consistent with the items', () => {
    const m = buildDailyMenu({ seed: day(3), targets: TARGETS });
    for (const it of m.items) {
      expect(it.scale).toBeGreaterThanOrEqual(SCALE_MIN);
      expect(it.scale).toBeLessThanOrEqual(SCALE_MAX);
      const d = dishById(it.dishId)!;
      expect(it.kcal).toBe(Math.round(d.kcal * it.scale));
    }
    expect(m.totals).toEqual(menuTotals(m.items));
  });

  it('only offers small dishes as snacks', () => {
    for (let i = 1; i <= 20; i++) {
      for (const it of buildDailyMenu({ seed: day(i), targets: { ...TARGETS, calories: 3000 }, mealsPerDay: 5 }).items.filter((x) => x.mealType === 'snack')) {
        expect(dishById(it.dishId)!.kcal).toBeLessThanOrEqual(SNACK_MAX_KCAL);
      }
    }
  });

  it('never repeats a dish within a day', () => {
    for (let i = 1; i <= 20; i++) {
      const ids = buildDailyMenu({ seed: day(i), targets: TARGETS, mealsPerDay: 5 }).items.map((x) => x.dishId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('"another dish" gives a different dish for that slot only', () => {
    const base = buildDailyMenu({ seed: day(5), targets: TARGETS });
    const swapped = buildDailyMenu({ seed: day(5), targets: TARGETS, swaps: { 1: 1 } });
    expect(swapped.items[1]!.dishId).not.toBe(base.items[1]!.dishId);
    expect(swapped.items[1]!.mealType).toBe(base.items[1]!.mealType);
    expect(swapped.items[0]!.dishId).toBe(base.items[0]!.dishId);
    const seen = new Set(Array.from({ length: 6 }, (_, n) => buildDailyMenu({ seed: day(5), targets: TARGETS, swaps: { 2: n } }).items[2]!.dishId));
    expect(seen.size).toBe(6);
  });

  it('only offers dishes that pass the user preferences', () => {
    const preferences = { dietType: 'vegetarian' as const, allergies: ['peanut', 'tree_nut', 'sesame'] as const, dietaryRestrictions: ['lactose_free'] as const, dislikedFoods: 'tofu' };
    const ok = dishFilter(preferences);
    for (let i = 1; i <= 20; i++) {
      for (let swap = 0; swap < 4; swap++) {
        const m = buildDailyMenu({ seed: day(i), targets: TARGETS, preferences, swaps: { 0: swap, 1: swap, 2: swap, 3: swap } });
        for (const it of m.items) expect(ok(dishById(it.dishId)!), `${it.dishId}`).toBe(true);
      }
    }
  });

  it('reports slots with nothing to offer instead of guessing', () => {
    const m = buildDailyMenu({
      seed: day(1),
      targets: TARGETS,
      preferences: { dietType: 'vegan', allergies: [...ALLERGENS], dietaryRestrictions: [...DIETARY_RESTRICTIONS], dislikedFoods: '' },
    });
    expect(m.emptySlots.length).toBeGreaterThan(0);
    expect(m.items.length + m.emptySlots.length).toBe(menuSlots(null).length);
  });

  it('replaces one slot with a chosen dish', () => {
    const m = buildDailyMenu({ seed: day(1), targets: TARGETS });
    const dish = DISHES.find((d) => d.category === 'dinner' && d.id !== m.items[2]!.dishId)!;
    const next = withDish(m, 2, dish, 1);
    expect(next.items[2]!.dishId).toBe(dish.id);
    expect(next.totals).toEqual(menuTotals(next.items));
  });
});

describe('shopping list', () => {
  it('strips counts and measure words', () => {
    expect(ingredientNames({ ...dishById('b01')!, ingredients: { he: '2 ביצים, חצי אבוקדו, כוס חלב', en: '2 eggs, half an avocado, glass of milk, a little honey' } }, 'en')).toEqual(['eggs', 'avocado', 'milk', 'honey']);
    expect(ingredientNames({ ...dishById('b01')!, ingredients: { he: '2 ביצים, חצי אבוקדו, כוס חלב', en: 'x' } }, 'he')).toEqual(['ביצים', 'אבוקדו', 'חלב']);
  });

  it('merges duplicates across dishes and counts them', () => {
    const m = buildDailyMenu({ seed: day(2), targets: TARGETS });
    const list = shoppingList(m.items, 'en');
    expect(list.length).toBeGreaterThan(5);
    expect(new Set(list.map((e) => e.name.toLowerCase())).size).toBe(list.length);
    for (let i = 1; i < list.length; i++) expect(list[i - 1]!.dishes).toBeGreaterThanOrEqual(list[i]!.dishes);
  });
});
