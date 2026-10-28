import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { todayInTimeZone } from '@shared/dates';
import type { FoodDTO, FoodLogEntryDTO } from '@shared/types';
import { config } from '../src/config';
import { db } from '../src/db/pool';
import { onboardedUser, startTestServer, type TestClient, type TestServer } from './helpers/server';

let server: TestServer;
const today = todayInTimeZone('UTC');
const offEnabled = config.openFoodFacts.enabled;

const FOOD = {
  name: 'Grandma lentil patties',
  category: 'plant_protein',
  per100g: { kcal: 200, protein: 12, carbs: 20, fat: 8, fiber: 5 },
  servingGrams: 80,
  barcode: '7290000999123',
};

async function createFood(c: TestClient, overrides: Record<string, unknown> = {}): Promise<FoodDTO> {
  const res = await c.post('/api/foods', { ...FOOD, ...overrides });
  expect(res.status).toBe(201);
  return res.body.food;
}

beforeAll(async () => {
  server = await startTestServer();
});
afterEach(() => {
  config.openFoodFacts.enabled = offEnabled;
});
afterAll(async () => {
  await server.close();
  await db.close();
});

describe('deleting a custom food', () => {
  it('keeps logged snapshots, still allows amount edits, and empties saved meals that used it', async () => {
    const c = await onboardedUser(server.baseUrl);
    const food = await createFood(c, { barcode: null });
    const logged = await c.post('/api/nutrition/logs', { date: today, mealType: 'lunch', foodId: food.id, grams: 150 });
    expect(logged.status).toBe(201);
    expect(logged.body.entry).toMatchObject({ kcal: 300, proteinG: 18, foodRef: { servingGrams: 80 } });
    const meal = await c.post('/api/nutrition/saved-meals', { name: 'Patties', items: [{ foodId: food.id, grams: 150 }] });
    expect(meal.status).toBe(201);

    expect((await c.delete(`/api/foods/${food.id}`)).status).toBe(200);

    const day = await c.get(`/api/nutrition/day?date=${today}`);
    const entry: FoodLogEntryDTO = day.body.meals.lunch.entries[0];
    expect(entry).toMatchObject({ foodId: null, foodRef: null, foodName: { en: FOOD.name }, grams: 150, kcal: 300, proteinG: 18 });
    expect(day.body.totals.kcal).toBe(300);

    // Without the food, an amount change scales the stored snapshot proportionally; servings and revert are impossible.
    const scaled = await c.patch(`/api/nutrition/logs/${entry.id}`, { grams: 75 });
    expect(scaled.body.entry).toMatchObject({ grams: 75, kcal: 150, proteinG: 9, carbsG: 15, fatG: 6 });
    expect((await c.patch(`/api/nutrition/logs/${entry.id}`, { servings: 1 })).body.error.code).toBe('food_unavailable');
    expect((await c.patch(`/api/nutrition/logs/${entry.id}`, { correction: null })).body.error.code).toBe('cannot_revert');

    const relog = await c.post(`/api/nutrition/saved-meals/${meal.body.meal.id}/log`, { date: today, mealType: 'dinner' });
    expect(relog.status).toBe(422);
    expect(relog.body.error.code).toBe('saved_meal_empty');
    expect((await c.get(`/api/nutrition/day?date=${today}`)).body.meals.dinner.entries).toEqual([]);
  });
});

describe('isolation of custom foods in other entry points', () => {
  it("never finds another user's food by barcode", async () => {
    config.openFoodFacts.enabled = false;
    const a = await onboardedUser(server.baseUrl);
    const b = await onboardedUser(server.baseUrl);
    const food = await createFood(a, { barcode: '7290000999130' });
    const mine = await a.get('/api/foods/barcode/7290000999130');
    expect(mine.status).toBe(200);
    expect(mine.body.food).toMatchObject({ id: food.id, isOwn: true });
    const theirs = await b.get('/api/foods/barcode/7290000999130');
    expect(theirs.status).toBe(404);
    expect(theirs.body.error.code).toBe('barcode_not_found');
  });

  it("rejects a batch that references another user's food and logs nothing from it", async () => {
    const a = await onboardedUser(server.baseUrl);
    const b = await onboardedUser(server.baseUrl);
    const food = await createFood(a, { barcode: null });
    const res = await b.post('/api/nutrition/logs/batch', {
      date: today,
      mealType: 'lunch',
      source: 'photo',
      items: [
        { name: 'Salad', grams: 100, kcal: 30 },
        { foodId: food.id, grams: 100 },
      ],
    });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('food_not_found');
    // The whole batch is one transaction: the valid estimate was not stored either.
    expect((await b.get(`/api/nutrition/day?date=${today}`)).body.totals.kcal).toBe(0);
  });

  it("does not leak another user's foods into recent, frequent or the default (empty-query) list", async () => {
    const a = await onboardedUser(server.baseUrl);
    const b = await onboardedUser(server.baseUrl);
    const food = await createFood(a, { barcode: null, name: 'Privatepatty special' });
    await a.post('/api/nutrition/logs', { date: today, mealType: 'lunch', foodId: food.id, grams: 100 });
    expect((await a.get('/api/nutrition/recent')).body.foods.map((f: { food: FoodDTO }) => f.food.id)).toContain(food.id);
    for (const path of ['/api/nutrition/recent', '/api/nutrition/frequent', '/api/foods/search?limit=50']) {
      const res = await b.get(path);
      expect(res.status).toBe(200);
      const ids = (res.body.foods as ({ food: FoodDTO } | FoodDTO)[]).map((f) => ('food' in f ? f.food.id : f.id));
      expect(ids, path).not.toContain(food.id);
    }
  });
});
