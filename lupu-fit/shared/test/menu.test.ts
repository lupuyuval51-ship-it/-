import { describe, expect, it } from 'vitest';
import { ALLERGENS, type Allergen } from '../src/enums.js';
import { buildDailyMenu, buildShoppingList, detectAllergensInText, dishAllergens, isDishAllowed, normalizeText, swapDish, type Dish, PORTION_MAX, PORTION_MIN, SNACK_KCAL_CAP } from '../src/menu.js';

const has = (txt: string, a: Allergen) => detectAllergensInText(txt).has(a);

const HE: Record<Allergen, string[]> = {
  dairy: ['חלב', 'בחלב', 'ולחלב', 'גבינה', 'גבינות', 'מגבינת קוטג׳', 'יוגורט', 'ביוגורטים', 'חמאה', 'שמנת', 'לאבנה', 'ריקוטה', 'קוטג׳'],
  egg: ['ביצה', 'ביצים', 'בביצים', 'וביצה', 'חביתה', 'מהביצים'],
  peanut: ['בוטן', 'בוטנים', 'לבוטנים', 'חמאת בוטנים', 'ובוטנים'],
  tree_nut: ['שקד', 'שקדים', 'אגוזים', 'אגוזי מלך', 'לוז', 'פקאן', 'קשיו', 'פיסטוק', 'בשקדים'],
  sesame: ['שומשום', 'שומשומים', 'טחינה', 'בטחינה', 'ושומשום'],
  soy: ['סויה', 'מסויה', 'טופו', 'בטופו', 'אדממה'],
  gluten: ['חיטה', 'גלוטן', 'שיבולת שועל', 'שעורה', 'לחם', 'בלחם', 'פסטה', 'בפסטה', 'בורגול', 'סולת', 'לחמניה', 'פיתה'],
  fish: ['דג', 'דגים', 'סלמון', 'בטונה', 'טונה'],
  shellfish: ['שרימפס', 'סרטן', 'צדפות', 'לובסטר'],
};
const EN: Record<Allergen, string[]> = {
  dairy: ['milk', 'Cheddar Cheese', 'yogurt', 'butter', 'whey protein', 'cottage cheese', 'cream'],
  egg: ['egg', 'eggs', 'scrambled eggs', 'omelette', 'mayonnaise'],
  peanut: ['peanut', 'peanuts', 'peanut butter'],
  tree_nut: ['almonds', 'walnuts', 'hazelnut', 'cashews', 'pecan', 'pistachios'],
  sesame: ['sesame seeds', 'tahini', 'hummus'],
  soy: ['soy sauce', 'tofu', 'edamame', 'soya'],
  gluten: ['wheat flour', 'whole wheat bread', 'pasta', 'bulgur', 'oats', 'couscous'],
  fish: ['salmon fillet', 'tuna', 'fish', 'sardines'],
  shellfish: ['shrimp', 'prawns', 'crab', 'mussels'],
};

describe('morphological allergen filter', () => {
  for (const a of ALLERGENS) {
    it(`detects ${a} in Hebrew inflections`, () => { for (const w of HE[a]) expect(has(w, a), `${w} → ${a}`).toBe(true); });
    it(`detects ${a} in English`, () => { for (const w of EN[a]) expect(has(w, a), `${w} → ${a}`).toBe(true); });
  }
  it('normalises final letters and niqqud', () => {
    expect(normalizeText('אגוזִים')).toBe(normalizeText('אגוזים'));
    expect(normalizeText('קוטג׳')).toBe('קוטג');
  });
  it('does not flag benign words', () => {
    for (const w of ['אורז', 'תפוח', 'עוף בגריל', 'chicken breast', 'rice', 'apple', 'coconut milk', 'almond milk', 'חלבון', 'פיתוח גוף', 'ביצועים', 'שמן זית', 'olive oil']) {
      const found = detectAllergensInText(w);
      if (w === 'almond milk') { expect(found.has('dairy')).toBe(false); expect(found.has('tree_nut')).toBe(true); continue; }
      expect([...found], w).toEqual([]);
    }
    expect(has('חלב שקדים', 'dairy')).toBe(false);
    expect(has('חלב שקדים', 'tree_nut')).toBe(true);
    expect(has('peanut butter', 'dairy')).toBe(false);
    expect(has('חומוס גרגרים צלוי', 'sesame')).toBe(true); // bare חומוס stays conservative (hummus)
    expect(has('בטטה עם גרגרי חומוס', 'sesame')).toBe(false); // chickpeas are not hummus
    expect(has('גרגירי חומוס', 'sesame')).toBe(false);
  });
});

const dish = (o: Partial<Dish> & { id: string }): Dish => ({
  nameHe: o.id, nameEn: o.id, slots: ['lunch'], kcal: 500, proteinG: 30, carbsG: 50, fatG: 15, ingredients: [{ nameHe: 'אורז', nameEn: 'rice', grams: 100, foodId: 'rice' }],
  allergens: [], diets: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'kosher'], restrictionTags: [], ...o,
});

describe('dish filtering', () => {
  it('structured tags OR keyword detection both hide a dish', () => {
    const tagged = dish({ id: 'a', allergens: ['gluten'] });
    const hidden = dish({ id: 'b', nameHe: 'עוף בטחינה', nameEn: 'Chicken with tahini' });
    const ingredient = dish({ id: 'c', ingredients: [{ nameHe: 'ביצים', nameEn: 'eggs', grams: 50 }] });
    const opts = { diet: 'omnivore' as const, restrictions: [], allergies: ['gluten', 'sesame', 'egg'] as Allergen[] };
    expect(isDishAllowed(tagged, opts)).toBe(false);
    expect(isDishAllowed(hidden, opts)).toBe(false);
    expect(isDishAllowed(ingredient, opts)).toBe(false);
    expect(isDishAllowed(dish({ id: 'ok' }), opts)).toBe(true);
    expect(dishAllergens(hidden).has('sesame')).toBe(true);
  });
  it('diet and restriction filters', () => {
    const meat = dish({ id: 'm', diets: ['omnivore'], restrictionTags: ['no_pork'] });
    expect(isDishAllowed(meat, { diet: 'vegan', restrictions: [], allergies: [] })).toBe(false);
    expect(isDishAllowed(meat, { diet: 'omnivore', restrictions: ['no_pork'], allergies: [] })).toBe(true);
    expect(isDishAllowed(meat, { diet: 'omnivore', restrictions: ['halal'], allergies: [] })).toBe(false);
  });
});

describe('daily menu', () => {
  const dishes: Dish[] = [];
  for (let i = 0; i < 12; i++) {
    dishes.push(dish({ id: `b${i}`, slots: ['breakfast'], kcal: 300 + i * 40 }));
    dishes.push(dish({ id: `l${i}`, slots: ['lunch', 'dinner'], kcal: 450 + i * 50 }));
    dishes.push(dish({ id: `s${i}`, slots: ['snack'], kcal: 120 + i * 60 }));
  }
  dishes.push(dish({ id: 'huge_snack', slots: ['snack'], kcal: 900 }));
  const opts = { mealCount: 4 as const, seed: 3, diet: 'omnivore' as const, restrictions: [], allergies: [] };
  it('respects portion bounds, snack cap, and is deterministic', () => {
    for (const mealCount of [3, 4, 5] as const) for (const kcal of [1400, 1800, 2200, 3000]) for (let seed = 0; seed < 20; seed++) {
      const m = buildDailyMenu(dishes, { kcal }, { ...opts, mealCount, seed });
      expect(m.items.length).toBe(mealCount);
      expect(new Set(m.items.map((i) => i.dishId)).size).toBe(mealCount);
      for (const it of m.items) {
        expect(it.portion).toBeLessThanOrEqual(PORTION_MAX);
        expect(it.portion).toBeGreaterThanOrEqual(PORTION_MIN);
        if (it.slot === 'snack') expect(it.kcal).toBeLessThanOrEqual(SNACK_KCAL_CAP);
        expect(it.dishId).not.toBe('huge_snack');
      }
    }
    expect(buildDailyMenu(dishes, { kcal: 2000 }, opts)).toEqual(buildDailyMenu(dishes, { kcal: 2000 }, opts));
  });
  it('reports missing slots honestly and never includes a filtered dish', () => {
    const m = buildDailyMenu(dishes, { kcal: 2000 }, { ...opts, allergies: ['gluten'] }, new Set());
    expect(m.items.length).toBe(4);
    const none = buildDailyMenu([], { kcal: 2000 }, opts);
    expect(none.items).toEqual([]); expect(none.missingSlots.length).toBe(4);
  });
  it('swap changes the dish and shopping list aggregates by portion', () => {
    const m = buildDailyMenu(dishes, { kcal: 2000 }, opts);
    const s = swapDish(dishes, m, 0, { kcal: 2000 }, opts);
    expect(s.items[0]?.dishId).not.toBe(m.items[0]?.dishId);
    const byId = new Map(dishes.map((d) => [d.id, d]));
    const list = buildShoppingList([m, m], byId);
    const expected = Math.round(m.items.reduce((a, i) => a + 100 * i.portion, 0) * 2);
    expect(list.find((l) => l.key === 'rice')?.grams).toBe(expected);
  });
});
