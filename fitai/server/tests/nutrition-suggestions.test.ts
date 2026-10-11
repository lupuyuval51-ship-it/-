import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MEAL_TYPES, type MealType } from '@shared/constants';
import { todayInTimeZone } from '@shared/dates';
import { foodConflicts, type DietPreferences } from '@shared/nutrition';
import type { MealSuggestionDTO, NutritionSuggestionsDTO } from '@shared/types';
import { db } from '../src/db/pool';
import { getSuggestions } from '../src/modules/nutrition/suggestions';
import { onboardedUser, registerUser, startTestServer, type TestClient, type TestServer } from './helpers/server';

let server: TestServer;
const today = todayInTimeZone('UTC');

/** Test-only templates (prefixed so they never collide with the built-in dataset). */
const TEMPLATES = [
  { slug: 'test_sugg_protein_bowl', mealTypes: ['lunch', 'dinner'], prep: 15, items: [['chicken_breast_cooked', 200], ['rice_white_cooked', 100]] },
  { slug: 'test_sugg_carb_bowl', mealTypes: ['lunch', 'dinner'], prep: 10, items: [['rice_white_cooked', 300], ['olive_oil', 10]] },
  { slug: 'test_sugg_tahini_chickpeas', mealTypes: ['lunch'], prep: 5, items: [['chickpeas_cooked', 150], ['tahini_raw', 20]] },
  { slug: 'test_sugg_shrimp_pasta', mealTypes: ['lunch', 'dinner'], prep: 20, items: [['shrimp_cooked', 150], ['pasta_cooked', 200]] },
  { slug: 'test_sugg_pork_potato', mealTypes: ['lunch', 'dinner'], prep: 25, items: [['pork_chop_cooked', 150], ['potato_boiled', 200]] },
  { slug: 'test_sugg_yogurt_oats', mealTypes: ['breakfast', 'snack'], prep: 3, items: [['greek_yogurt_plain_2pct', 200], ['oats_rolled_dry', 40]] },
  { slug: 'test_sugg_tofu_rice', mealTypes: ['lunch', 'dinner'], prep: 15, items: [['tofu_firm', 150], ['rice_brown_cooked', 150]] },
  { slug: 'test_sugg_salmon_quinoa', mealTypes: ['lunch', 'dinner'], prep: 20, items: [['salmon_cooked', 150], ['quinoa_cooked', 150]] },
  { slug: 'test_sugg_egg_toast', mealTypes: ['breakfast'], prep: 10, items: [['egg_hard_boiled', 100], ['bread_whole_wheat', 60]] },
  { slug: 'test_sugg_pb_toast', mealTypes: ['breakfast', 'snack'], prep: 3, items: [['peanut_butter_natural', 32], ['bread_white', 60]] },
  { slug: 'test_sugg_lentils_rice', mealTypes: ['lunch', 'dinner'], prep: 10, items: [['lentils_cooked', 200], ['rice_basmati_cooked', 150]] },
  { slug: 'test_sugg_missing_food', mealTypes: ['lunch'], prep: 5, items: [['no_such_food_slug', 100]] },
] as const;

beforeAll(async () => {
  server = await startTestServer();
  for (const t of TEMPLATES) {
    await db.exec(
      `INSERT INTO meal_templates (slug, name, description, meal_types, items, prep_minutes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, meal_types = EXCLUDED.meal_types,
         items = EXCLUDED.items, prep_minutes = EXCLUDED.prep_minutes`,
      [
        t.slug,
        JSON.stringify({ en: t.slug.replace(/_/g, ' '), he: 'תבנית בדיקה' }),
        JSON.stringify({ en: 'Test template', he: 'תבנית בדיקה' }),
        t.mealTypes,
        JSON.stringify(t.items.map(([foodSlug, grams]) => ({ foodSlug, grams }))),
        t.prep,
      ],
    );
  }
});
afterAll(async () => {
  await db.exec("DELETE FROM meal_templates WHERE slug LIKE 'test\\_sugg\\_%'");
  await server.close();
  await db.close();
});

const idOf = async (slug: string) => (await db.one<{ id: string }>('SELECT id FROM foods WHERE slug = $1', [slug])).id;

interface TemplateWithFoods {
  slug: string;
  mealTypes: MealType[];
  foods: { allergens: DietPreferences['allergies']; animal_source: 'none' | 'dairy_egg' | 'fish' | 'meat'; contains: string[]; name: { en: string; he: string } }[];
  complete: boolean;
}

async function allTemplates(): Promise<TemplateWithFoods[]> {
  const rows = await db.many<{ slug: string; meal_types: MealType[]; items: { foodSlug: string }[] }>('SELECT slug, meal_types, items FROM meal_templates');
  const foods = await db.many<{ slug: string; allergens: DietPreferences['allergies']; animal_source: 'none'; contains: string[]; name: { en: string; he: string } }>(
    'SELECT slug, allergens, animal_source, contains, name FROM foods WHERE slug IS NOT NULL',
  );
  const bySlug = new Map(foods.map((f) => [f.slug, f]));
  return rows.map((r) => ({
    slug: r.slug,
    mealTypes: r.meal_types,
    foods: r.items.map((i) => bySlug.get(i.foodSlug)!).filter(Boolean),
    complete: r.items.every((i) => bySlug.has(i.foodSlug)),
  }));
}

const PROFILES: { label: string; profile: Record<string, unknown>; prefs: DietPreferences; disliked?: string[] }[] = [
  { label: 'vegan', profile: { diet_type: 'vegan' }, prefs: { dietType: 'vegan', allergies: [], restrictions: [] } },
  { label: 'vegetarian + sesame', profile: { diet_type: 'vegetarian', allergies: ['sesame'] }, prefs: { dietType: 'vegetarian', allergies: ['sesame'], restrictions: [] } },
  { label: 'pescatarian + gluten-free', profile: { diet_type: 'pescatarian', dietary_restrictions: ['gluten_free'] }, prefs: { dietType: 'pescatarian', allergies: [], restrictions: ['gluten_free'] } },
  {
    label: 'all allergies',
    profile: { allergies: ['gluten', 'dairy', 'egg', 'peanut', 'tree_nut', 'soy', 'fish', 'shellfish', 'sesame'] },
    prefs: { dietType: 'omnivore', allergies: ['gluten', 'dairy', 'egg', 'peanut', 'tree_nut', 'soy', 'fish', 'shellfish', 'sesame'], restrictions: [] },
  },
  {
    label: 'all restrictions',
    profile: { dietary_restrictions: ['no_pork', 'no_beef', 'no_shellfish', 'no_alcohol', 'lactose_free', 'gluten_free'] },
    prefs: { dietType: 'omnivore', allergies: [], restrictions: ['no_pork', 'no_beef', 'no_shellfish', 'no_alcohol', 'lactose_free', 'gluten_free'] },
  },
  {
    label: 'dislikes chicken & lentils',
    profile: { disliked_foods: 'Chicken, lentils' },
    prefs: { dietType: 'omnivore', allergies: [], restrictions: [] },
    disliked: ['chicken', 'lentil'],
  },
  { label: 'omnivore', profile: {}, prefs: { dietType: 'omnivore', allergies: [], restrictions: [] } },
];

describe('meal suggestions are always compatible (property over all templates)', () => {
  it.each(PROFILES)('$label', async ({ profile, prefs, disliked }) => {
    const c = await onboardedUser(server.baseUrl, profile);
    const templates = await allTemplates();
    for (const mealType of MEAL_TYPES) {
      const res = await getSuggestions(db, c.userId!, { date: today, mealType, limit: 10_000 });
      const suggested = new Set(res.meals.map((m) => m.slug));
      for (const meal of res.meals) {
        expect(meal.mealTypes).toContain(mealType);
        for (const item of meal.items) {
          expect(item.food.conflicts, `${meal.slug}: ${item.food.name.en}`).toEqual([]);
          expect(foodConflicts(item.food, prefs), `${meal.slug}: ${item.food.name.en}`).toEqual([]);
          for (const d of disliked ?? []) expect(item.food.name.en.toLowerCase()).not.toContain(d);
        }
        expect(meal.scale).toBeGreaterThanOrEqual(0.5);
        expect(meal.scale).toBeLessThanOrEqual(1.5);
      }
      // Completeness: every compatible template for this meal type is offered.
      for (const t of templates) {
        if (!t.mealTypes.includes(mealType) || !t.complete) {
          expect(suggested.has(t.slug)).toBe(false);
          continue;
        }
        const compatible = t.foods.every(
          (f) =>
            foodConflicts({ allergens: f.allergens, animalSource: f.animal_source, contains: f.contains as never }, prefs).length === 0 &&
            !(disliked ?? []).some((d) => f.name.en.toLowerCase().includes(d)),
        );
        expect(suggested.has(t.slug), `${t.slug} for ${mealType}`).toBe(compatible);
      }
      for (const f of res.foods) expect(f.food.conflicts).toEqual([]);
    }
  });

  it('the API returns at most 6 meals and up to 5 single foods, all compatible', async () => {
    const c = await onboardedUser(server.baseUrl, { diet_type: 'vegetarian', allergies: ['sesame'] });
    const res = await c.get(`/api/nutrition/suggestions?date=${today}&mealType=lunch`);
    expect(res.status).toBe(200);
    const body: NutritionSuggestionsDTO = res.body;
    expect(body).toMatchObject({ date: today, mealType: 'lunch' });
    expect(body.meals.length).toBeLessThanOrEqual(6);
    expect(body.meals.length).toBeGreaterThan(0);
    expect(body.foods.length).toBeGreaterThan(0);
    expect(body.foods.length).toBeLessThanOrEqual(5);
    for (const f of body.foods) {
      expect(f.food.conflicts).toEqual([]);
      expect(f.reason).toBe('protein_gap');
      expect(f.grams).toBeGreaterThan(0);
    }
    for (const m of body.meals) expect(m.reasons).toContain('matches_diet');
    expect(body.remaining).not.toBeNull();
    // Without mealType the server picks the next meal.
    const auto = await c.get('/api/nutrition/suggestions');
    expect(MEAL_TYPES).toContain(auto.body.mealType);
    expect((await c.get('/api/nutrition/suggestions?mealType=brunch')).status).toBe(400);
  });
});

describe('ranking', () => {
  const position = (meals: MealSuggestionDTO[], slug: string) => meals.findIndex((m) => m.slug === slug);

  it('prefers protein-rich meals when the protein gap is large, and scales portions to the remaining budget', async () => {
    const c = await onboardedUser(server.baseUrl, { meals_per_day: 3 });
    // A carb-heavy breakfast: protein gap is now relatively larger than the calorie gap.
    await c.post('/api/nutrition/logs', { date: today, mealType: 'breakfast', foodId: await idOf('rice_white_cooked'), grams: 600 });
    const res = await getSuggestions(db, c.userId!, { date: today, mealType: 'lunch', limit: 10_000 });
    const protein = position(res.meals, 'test_sugg_protein_bowl');
    const carb = position(res.meals, 'test_sugg_carb_bowl');
    expect(protein).toBeGreaterThanOrEqual(0);
    expect(carb).toBeGreaterThan(protein);
    const bowl = res.meals[protein]!;
    expect(bowl.reasons).toContain('high_protein');
    // ~1125 kcal left for each of the 2 remaining meals → the 432 kcal bowl is scaled to the maximum 1.5×.
    expect(bowl.scale).toBe(1.5);
    expect(bowl.items.map((i) => i.grams)).toEqual([300, 150]);
    expect(bowl.totals.kcal).toBe(648);
    expect(res.foods[0]?.reason).toBe('protein_gap');
  });

  it('stops favouring protein once protein needs are covered', async () => {
    const c = await onboardedUser(server.baseUrl, { meals_per_day: 3 });
    await c.post('/api/nutrition/logs', { date: today, mealType: 'breakfast', foodId: await idOf('chicken_breast_cooked'), grams: 600 });
    const res = await getSuggestions(db, c.userId!, { date: today, mealType: 'lunch', limit: 10_000 });
    expect(position(res.meals, 'test_sugg_carb_bowl')).toBeLessThan(position(res.meals, 'test_sugg_protein_bowl'));
    expect(res.foods.every((f) => f.reason !== 'protein_gap')).toBe(true);
  });

  it('ranks by balance and protein without targets', async () => {
    const c = await registerUser(server.baseUrl);
    const res = await c.get('/api/nutrition/suggestions?mealType=lunch');
    expect(res.status).toBe(200);
    expect(res.body.remaining).toBeNull();
    expect(res.body.meals.length).toBeGreaterThan(0);
    for (const m of res.body.meals) {
      expect(m.scale).toBe(1);
      expect(m.reasons).not.toContain('fits_remaining_calories');
    }
  });
});

describe('logging a suggestion', () => {
  it('logs the template items scaled, with source "suggestion"', async () => {
    const c = await onboardedUser(server.baseUrl);
    const res = await c.post('/api/nutrition/suggestions/test_sugg_protein_bowl/log', { date: today, mealType: 'dinner', scale: 1.5 });
    expect(res.status).toBe(201);
    expect(res.body.entries.map((e: { grams: number; source: string; kcal: number }) => [e.grams, e.source, e.kcal])).toEqual([
      [300, 'suggestion', 453],
      [150, 'suggestion', 195],
    ]);
    expect(res.body.day.meals.dinner.totals.kcal).toBe(648);
    const plain = await c.post('/api/nutrition/suggestions/test_sugg_lentils_rice/log', { date: today, mealType: 'lunch' });
    expect(plain.body.entries.map((e: { grams: number }) => e.grams)).toEqual([200, 150]);
  });

  it('re-checks disliked foods when logging, even if the profile changed after the list was shown', async () => {
    const c = await onboardedUser(server.baseUrl, { disliked_foods: 'lentils' });
    const res = await c.post('/api/nutrition/suggestions/test_sugg_lentils_rice/log', { date: today, mealType: 'lunch' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('template_disliked');
    const day = await c.get(`/api/nutrition/day?date=${today}`);
    expect(day.body.meals.lunch.entries).toHaveLength(0);
    // A template without the disliked food is still fine.
    expect((await c.post('/api/nutrition/suggestions/test_sugg_protein_bowl/log', { date: today, mealType: 'lunch' })).status).toBe(201);
  });

  it('rejects incompatible, unknown and invalid templates', async () => {
    const veggie = await onboardedUser(server.baseUrl, { diet_type: 'vegetarian' });
    const pork = await veggie.post('/api/nutrition/suggestions/test_sugg_pork_potato/log', { date: today, mealType: 'dinner' });
    expect(pork.status).toBe(422);
    expect(pork.body.error.code).toBe('template_incompatible');
    const allergic = await onboardedUser(server.baseUrl, { allergies: ['sesame'] });
    expect((await allergic.post('/api/nutrition/suggestions/test_sugg_tahini_chickpeas/log', { date: today, mealType: 'lunch' })).body.error.code).toBe('template_incompatible');
    expect((await veggie.post('/api/nutrition/suggestions/no_such_template/log', { date: today, mealType: 'lunch' })).status).toBe(404);
    expect((await veggie.post('/api/nutrition/suggestions/test_sugg_missing_food/log', { date: today, mealType: 'lunch' })).body.error.code).toBe('template_unavailable');
    expect((await veggie.post('/api/nutrition/suggestions/Bad-Slug/log', { date: today, mealType: 'lunch' })).status).toBe(400);
    expect((await veggie.post('/api/nutrition/suggestions/test_sugg_lentils_rice/log', { date: today, mealType: 'lunch', scale: 5 })).status).toBe(400);
    const empty = await veggie.get(`/api/nutrition/day?date=${today}`);
    expect(empty.body.totals.kcal).toBe(0);
  });
});
