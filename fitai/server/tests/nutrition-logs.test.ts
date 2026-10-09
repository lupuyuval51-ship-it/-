import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { addDays, todayInTimeZone } from '@shared/dates';
import { scaleNutrients, subtractMacros } from '@shared/nutrition';
import type { DayNutritionDTO, FoodDTO, FoodLogEntryDTO } from '@shared/types';
import { db } from '../src/db/pool';
import { onboardedUser, registerUser, startTestServer, type TestClient, type TestServer } from './helpers/server';

let server: TestServer;
let alice: TestClient;
let bob: TestClient;
let chicken: FoodDTO;
let rice: FoodDTO;
const today = todayInTimeZone('UTC');
const yesterday = addDays(today, -1);

const chickenPer100 = { kcal: 151, protein: 30.5, carbs: 0, fat: 3.2, fiber: 0 };

async function foodBySlug(c: TestClient, slug: string): Promise<FoodDTO> {
  const row = await db.one<{ id: string }>('SELECT id FROM foods WHERE slug = $1', [slug]);
  const res = await c.get(`/api/foods/${row.id}`);
  expect(res.status).toBe(200);
  return res.body.food;
}

const log = (c: TestClient, body: Record<string, unknown>) => c.post('/api/nutrition/logs', { date: today, mealType: 'breakfast', ...body });

beforeAll(async () => {
  server = await startTestServer();
  alice = await onboardedUser(server.baseUrl);
  bob = await onboardedUser(server.baseUrl);
  chicken = await foodBySlug(alice, 'chicken_breast_cooked');
  rice = await foodBySlug(alice, 'rice_white_cooked');
});
afterAll(async () => {
  await server.close();
  await db.close();
});

describe('logging computes nutrients from stored food data', () => {
  it('logs grams exactly (server-side scaling, snapshot name)', async () => {
    const c = await onboardedUser(server.baseUrl);
    const res = await log(c, { foodId: chicken.id, grams: 150 });
    expect(res.status).toBe(201);
    const e: FoodLogEntryDTO = res.body.entry;
    expect(e).toMatchObject({ grams: 150, servings: null, kcal: 226.5, proteinG: 45.8, carbsG: 0, fatG: 4.8, fiberG: 0, isCorrected: false, source: 'manual', mealType: 'breakfast', date: today });
    expect(e.foodName.en).toBe(chicken.name.en);
    expect(e.foodName.he).toBe(chicken.name.he);
    expect(e.foodRef?.servingGrams).toBe(120);
    expect(res.body.day.totals.kcal).toBe(226.5);
    expect(res.body.reward).toMatchObject({ xpAwarded: expect.any(Number) });
  });

  it('logs servings using the food serving size and ignores client-sent totals', async () => {
    const c = await onboardedUser(server.baseUrl);
    const res = await log(c, { foodId: chicken.id, servings: 2, kcal: 1, proteinG: 999 });
    expect(res.status).toBe(201);
    expect(res.body.entry).toMatchObject({ grams: 240, servings: 2, ...pick(scaleNutrients(chickenPer100, 240)) });
    expect(res.body.entry.kcal).toBe(362.4);
    expect(res.body.entry.fatG).toBe(7.7);
  });

  it('rounds to one decimal and keeps the snapshot when the food changes later', async () => {
    const c = await onboardedUser(server.baseUrl);
    const created = await c.post('/api/foods', {
      name: 'Snapshot bar',
      category: 'snacks_sweets',
      per100g: { kcal: 333.3, protein: 11.11, carbs: 44.44, fat: 12.34, fiber: 3.33 },
      servingGrams: 37,
    });
    expect(created.status).toBe(201);
    const res = await log(c, { foodId: created.body.food.id, grams: 37 });
    expect(res.body.entry).toMatchObject({ kcal: 123.3, proteinG: 4.1, carbsG: 16.4, fatG: 4.6, fiberG: 1.2 });
    await c.patch(`/api/foods/${created.body.food.id}`, { per100g: { kcal: 500, protein: 20, carbs: 50, fat: 25, fiber: 0 } });
    const day = await c.get(`/api/nutrition/day?date=${today}`);
    expect(day.body.meals.breakfast.entries[0].kcal).toBe(123.3);
    // Deleting the food keeps the entry (SET NULL) with its snapshot.
    expect((await c.delete(`/api/foods/${created.body.food.id}`)).status).toBe(200);
    const after = await c.get(`/api/nutrition/day?date=${today}`);
    expect(after.body.meals.breakfast.entries[0]).toMatchObject({ foodId: null, kcal: 123.3, foodRef: null });
    expect(after.body.meals.breakfast.entries[0].foodName.en).toBe('Snapshot bar');
  });

  it('groups by meal with per-meal totals, day totals, targets and remaining', async () => {
    const c = await onboardedUser(server.baseUrl);
    await log(c, { foodId: chicken.id, grams: 100, mealType: 'lunch' });
    await log(c, { foodId: rice.id, grams: 200, mealType: 'lunch' });
    await log(c, { foodId: rice.id, grams: 100, mealType: 'dinner' });
    const res = await c.get(`/api/nutrition/day?date=${today}`);
    expect(res.status).toBe(200);
    const day: DayNutritionDTO = res.body;
    expect(day.meals.breakfast.entries).toEqual([]);
    expect(day.meals.lunch.entries.map((e) => e.grams)).toEqual([100, 200]);
    expect(day.meals.lunch.totals).toEqual({ kcal: 411, proteinG: 35.9, carbsG: 56.4, fatG: 3.8, fiberG: 0.8 });
    expect(day.meals.dinner.totals.kcal).toBe(130);
    expect(day.totals).toEqual({ kcal: 541, proteinG: 38.6, carbsG: 84.6, fatG: 4.1, fiberG: 1.2 });
    const profile = (await c.get('/api/profile')).body.profile;
    expect(day.targets).toEqual(profile.targets);
    const t = day.targets!;
    expect(day.remaining).toEqual(subtractMacros({ kcal: t.calories, proteinG: t.proteinG, carbsG: t.carbsG, fatG: t.fatG, fiberG: t.fiberG }, day.totals));
  });

  it('defaults to today and has null targets/remaining without a complete profile', async () => {
    const c = await registerUser(server.baseUrl);
    const res = await c.get('/api/nutrition/day');
    expect(res.status).toBe(200);
    expect(res.body.date).toBe(today);
    expect(res.body.targets).toBeNull();
    expect(res.body.remaining).toBeNull();
    expect(res.body.totals.kcal).toBe(0);
  });

  it('uses the user time zone for "today"', async () => {
    const c = await registerUser(server.baseUrl, { timezone: 'Pacific/Kiritimati' });
    const res = await c.get('/api/nutrition/day');
    expect(res.body.date).toBe(todayInTimeZone('Pacific/Kiritimati'));
  });
});

function pick(m: { kcal: number; proteinG: number; carbsG: number; fatG: number; fiberG: number }) {
  return { kcal: m.kcal, proteinG: m.proteinG, carbsG: m.carbsG, fatG: m.fatG, fiberG: m.fiberG };
}

describe('validation', () => {
  it('rejects bad input with validation_error', async () => {
    const cases: Record<string, unknown>[] = [
      { foodId: chicken.id }, // neither grams nor servings
      { foodId: chicken.id, grams: 100, servings: 1 }, // both
      { foodId: chicken.id, grams: 0 },
      { foodId: chicken.id, grams: 5001 },
      { foodId: chicken.id, grams: 100, mealType: 'brunch' },
      { foodId: chicken.id, grams: 100, date: '2026-02-30' },
      { foodId: 'not-a-uuid', grams: 100 },
    ];
    for (const body of cases) {
      const res = await log(alice, body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(res.body.error.code).toBe('validation_error');
    }
    const quick = await alice.post('/api/nutrition/logs/quick', { date: today, mealType: 'snack', name: '', kcal: -1 });
    expect(quick.status).toBe(400);
  });

  it('rejects dates too far in the future and unknown foods', async () => {
    const future = await log(alice, { foodId: chicken.id, grams: 100, date: addDays(today, 3) });
    expect(future.status).toBe(422);
    expect(future.body.error.code).toBe('date_out_of_range');
    const tomorrow = await log(alice, { foodId: chicken.id, grams: 10, date: addDays(today, 1) });
    expect(tomorrow.status).toBe(201);
    const missing = await log(alice, { foodId: '00000000-0000-4000-8000-000000000000', grams: 100 });
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('food_not_found');
    const huge = await log(alice, { foodId: chicken.id, servings: 50 });
    expect(huge.status).toBe(422);
    expect(huge.body.error.code).toBe('amount_too_large');
  });

  it('requires authentication and CSRF', async () => {
    const anon = await registerUser(server.baseUrl);
    const noCsrf = await anon.post('/api/nutrition/logs', { date: today, mealType: 'lunch', foodId: chicken.id, grams: 1 }, { csrf: false });
    expect(noCsrf.status).toBe(403);
    anon.cookie = null;
    expect((await anon.get('/api/nutrition/day')).status).toBe(401);
  });
});

describe('editing entries', () => {
  it('changes amount (recomputed from the food), meal and date', async () => {
    const c = await onboardedUser(server.baseUrl);
    const { body } = await log(c, { foodId: chicken.id, grams: 100 });
    const id = body.entry.id;
    const res = await c.patch(`/api/nutrition/logs/${id}`, { grams: 200, mealType: 'dinner', date: yesterday });
    expect(res.status).toBe(200);
    expect(res.body.entry).toMatchObject({ grams: 200, kcal: 302, proteinG: 61, mealType: 'dinner', date: yesterday });
    expect(res.body.day.date).toBe(yesterday);
    const servings = await c.patch(`/api/nutrition/logs/${id}`, { servings: 0.5 });
    expect(servings.body.entry).toMatchObject({ grams: 60, servings: 0.5, kcal: 90.6 });
    expect((await c.get(`/api/nutrition/day?date=${today}`)).body.totals.kcal).toBe(0);
  });

  it('corrects nutrient values and reverts to computed values', async () => {
    const c = await onboardedUser(server.baseUrl);
    const { body } = await log(c, { foodId: chicken.id, grams: 100 });
    const id = body.entry.id;
    const corrected = await c.patch(`/api/nutrition/logs/${id}`, { correction: { kcal: 180, proteinG: 28, carbsG: 2, fatG: 6.25 } });
    expect(corrected.status).toBe(200);
    expect(corrected.body.entry).toMatchObject({ kcal: 180, proteinG: 28, carbsG: 2, fatG: 6.3, fiberG: 0, isCorrected: true });
    expect(corrected.body.day.totals.kcal).toBe(180);
    // Amount changes keep corrected values.
    const amount = await c.patch(`/api/nutrition/logs/${id}`, { grams: 150 });
    expect(amount.body.entry).toMatchObject({ grams: 150, kcal: 180, isCorrected: true });
    const reverted = await c.patch(`/api/nutrition/logs/${id}`, { correction: null });
    expect(reverted.body.entry).toMatchObject({ grams: 150, kcal: 226.5, proteinG: 45.8, isCorrected: false });
  });

  it('edits quick-add values without marking them corrected and cannot revert them', async () => {
    const c = await onboardedUser(server.baseUrl);
    const q = await c.post('/api/nutrition/logs/quick', { date: today, mealType: 'snack', name: 'Office cake', kcal: 350, proteinG: 4, carbsG: 45, fatG: 17 });
    expect(q.status).toBe(201);
    expect(q.body.entry).toMatchObject({ source: 'quick_add', grams: null, foodId: null, kcal: 350, fiberG: 0, isCorrected: false });
    expect(q.body.entry.foodName).toEqual({ en: 'Office cake', he: 'Office cake' });
    const id = q.body.entry.id;
    const edit = await c.patch(`/api/nutrition/logs/${id}`, { correction: { kcal: 300, proteinG: 4, carbsG: 40, fatG: 14 } });
    expect(edit.body.entry).toMatchObject({ kcal: 300, isCorrected: false });
    expect((await c.patch(`/api/nutrition/logs/${id}`, { correction: null })).body.error.code).toBe('cannot_revert');
    expect((await c.patch(`/api/nutrition/logs/${id}`, { grams: 100 })).body.error.code).toBe('entry_has_no_amount');
  });

  it('deletes entries and returns the updated day', async () => {
    const c = await onboardedUser(server.baseUrl);
    const { body } = await log(c, { foodId: rice.id, grams: 100 });
    const res = await c.delete(`/api/nutrition/logs/${body.entry.id}`);
    expect(res.status).toBe(200);
    expect(res.body.day.totals.kcal).toBe(0);
    expect((await c.delete(`/api/nutrition/logs/${body.entry.id}`)).status).toBe(404);
  });
});

describe('copy', () => {
  it('copies a whole day or one meal (including corrections) and rejects empty copies', async () => {
    const c = await onboardedUser(server.baseUrl);
    await log(c, { foodId: chicken.id, grams: 100, date: yesterday, mealType: 'breakfast' });
    const r = await log(c, { foodId: rice.id, grams: 100, date: yesterday, mealType: 'breakfast' });
    await c.patch(`/api/nutrition/logs/${r.body.entry.id}`, { correction: { kcal: 140, proteinG: 3, carbsG: 30, fatG: 0.5 } });
    await log(c, { foodId: rice.id, grams: 50, date: yesterday, mealType: 'dinner' });

    const meal = await c.post('/api/nutrition/logs/copy', { fromDate: yesterday, toDate: today, mealType: 'breakfast' });
    expect(meal.status).toBe(201);
    expect(meal.body.copied).toBe(2);
    const day: DayNutritionDTO = meal.body.day;
    expect(day.meals.breakfast.entries.map((e) => e.foodName.en)).toEqual([chicken.name.en, rice.name.en]);
    expect(day.meals.breakfast.entries[1]).toMatchObject({ kcal: 140, isCorrected: true });
    expect(day.meals.dinner.entries).toHaveLength(0);

    const whole = await c.post('/api/nutrition/logs/copy', { fromDate: yesterday, toDate: addDays(today, -2) });
    expect(whole.body.copied).toBe(3);
    const empty = await c.post('/api/nutrition/logs/copy', { fromDate: addDays(today, -10), toDate: today, mealType: 'lunch' });
    expect(empty.status).toBe(422);
    expect(empty.body.error.code).toBe('nothing_to_copy');
    const same = await c.post('/api/nutrition/logs/copy', { fromDate: today, toDate: today });
    expect(same.body.error.code).toBe('copy_same_date');
  });

  it("never copies another user's entries", async () => {
    const a = await onboardedUser(server.baseUrl);
    const b = await onboardedUser(server.baseUrl);
    await log(a, { foodId: chicken.id, grams: 100, date: yesterday });
    const res = await b.post('/api/nutrition/logs/copy', { fromDate: yesterday, toDate: today });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('nothing_to_copy');
  });
});

describe('summary', () => {
  it('averages over logged days only (zero-log days excluded) for 7 and 30 days', async () => {
    const c = await onboardedUser(server.baseUrl);
    await log(c, { foodId: rice.id, grams: 100, date: today }); // 130 kcal
    await log(c, { foodId: rice.id, grams: 300, date: addDays(today, -2) }); // 390 kcal
    await log(c, { foodId: chicken.id, grams: 100, date: addDays(today, -20) }); // 151 kcal (outside 7 days)
    const week = await c.get(`/api/nutrition/summary?days=7&to=${today}`);
    expect(week.status).toBe(200);
    expect(week.body.from).toBe(addDays(today, -6));
    expect(week.body.days).toHaveLength(7);
    expect(week.body.daysLogged).toBe(2);
    expect(week.body.averages.kcal).toBe(260);
    expect(week.body.days.find((d: { date: string }) => d.date === addDays(today, -1))).toMatchObject({ entryCount: 0, totals: { kcal: 0 } });
    expect(week.body.targets).not.toBeNull();
    const month = await c.get('/api/nutrition/summary?days=30');
    expect(month.body.days).toHaveLength(30);
    expect(month.body.daysLogged).toBe(3);
    expect(month.body.averages.kcal).toBe(223.7);
    const none = await (await onboardedUser(server.baseUrl)).get('/api/nutrition/summary?days=90');
    expect(none.body.daysLogged).toBe(0);
    expect(none.body.averages).toBeNull();
    expect((await c.get('/api/nutrition/summary?days=10')).status).toBe(400);
  });
});

describe('recent and frequent foods', () => {
  it('lists distinct recent foods with last grams and frequent foods by count', async () => {
    const c = await onboardedUser(server.baseUrl);
    await log(c, { foodId: rice.id, grams: 100 });
    await log(c, { foodId: rice.id, grams: 180 });
    await log(c, { foodId: rice.id, grams: 150, date: yesterday });
    await log(c, { foodId: chicken.id, grams: 120 });
    await c.post('/api/nutrition/logs/quick', { date: today, mealType: 'snack', name: 'Mystery', kcal: 100 });
    const recent = await c.get('/api/nutrition/recent');
    expect(recent.status).toBe(200);
    expect(recent.body.foods.map((f: { food: FoodDTO }) => f.food.id)).toEqual([chicken.id, rice.id]);
    expect(recent.body.foods[1]).toMatchObject({ timesLogged: 3, lastGrams: 150 });
    const frequent = await c.get('/api/nutrition/frequent');
    expect(frequent.body.foods[0]).toMatchObject({ food: { id: rice.id }, timesLogged: 3 });
    expect((await (await onboardedUser(server.baseUrl)).get('/api/nutrition/recent')).body.foods).toEqual([]);
  });
});

describe('batch logging (photo review)', () => {
  it('logs database foods and estimates in one request', async () => {
    const c = await onboardedUser(server.baseUrl);
    const res = await c.post('/api/nutrition/logs/batch', {
      date: today,
      mealType: 'lunch',
      source: 'photo',
      items: [
        { foodId: chicken.id, grams: 150 },
        { name: 'Green salad', grams: 80, kcal: 20, proteinG: 1, carbsG: 3, fatG: 0.2 },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.body.entries).toHaveLength(2);
    expect(res.body.entries[0]).toMatchObject({ source: 'photo', kcal: 226.5, foodId: chicken.id });
    expect(res.body.entries[1]).toMatchObject({ source: 'photo', foodId: null, grams: 80, kcal: 20 });
    expect(res.body.day.meals.lunch.totals.kcal).toBe(246.5);
    const scaled = await c.patch(`/api/nutrition/logs/${res.body.entries[1].id}`, { grams: 160 });
    expect(scaled.body.entry).toMatchObject({ grams: 160, kcal: 40, proteinG: 2 });
    const bad = await c.post('/api/nutrition/logs/batch', { date: today, mealType: 'lunch', items: [] });
    expect(bad.status).toBe(400);
  });
});

describe('saved meals', () => {
  it('creates, lists, logs and deletes a saved meal', async () => {
    const c = await onboardedUser(server.baseUrl);
    const created = await c.post('/api/nutrition/saved-meals', {
      name: 'Chicken & rice',
      mealType: 'lunch',
      items: [
        { foodId: chicken.id, grams: 150 },
        { foodId: rice.id, grams: 200 },
      ],
    });
    expect(created.status).toBe(201);
    const meal = created.body.meal;
    expect(meal.items).toHaveLength(2);
    expect(meal.totals).toEqual({ kcal: 486.5, proteinG: 51.2, carbsG: 56.4, fatG: 5.4, fiberG: 0.8 });
    const list = await c.get('/api/nutrition/saved-meals');
    expect(list.body.meals.map((m: { id: string }) => m.id)).toEqual([meal.id]);
    const logged = await c.post(`/api/nutrition/saved-meals/${meal.id}/log`, { date: today, mealType: 'dinner' });
    expect(logged.status).toBe(201);
    expect(logged.body.entries.map((e: FoodLogEntryDTO) => e.source)).toEqual(['saved_meal', 'saved_meal']);
    expect(logged.body.day.meals.dinner.totals.kcal).toBe(486.5);
    expect((await c.delete(`/api/nutrition/saved-meals/${meal.id}`)).status).toBe(200);
    expect((await c.get('/api/nutrition/saved-meals')).body.meals).toEqual([]);
  });

  it('saves a logged meal from a day, skipping quick-add entries', async () => {
    const c = await onboardedUser(server.baseUrl);
    await log(c, { foodId: chicken.id, grams: 130, mealType: 'breakfast' });
    await c.post('/api/nutrition/logs/quick', { date: today, mealType: 'breakfast', name: 'Coffee', kcal: 40 });
    const res = await c.post('/api/nutrition/saved-meals/from-day', { date: today, mealType: 'breakfast', name: 'My breakfast' });
    expect(res.status).toBe(201);
    expect(res.body.meal).toMatchObject({ name: 'My breakfast', mealType: 'breakfast' });
    expect(res.body.meal.items.map((i: { grams: number }) => i.grams)).toEqual([130]);
    const none = await c.post('/api/nutrition/saved-meals/from-day', { date: today, mealType: 'dinner', name: 'Nothing' });
    expect(none.status).toBe(422);
    expect(none.body.error.code).toBe('nothing_to_save');
  });

  it('validates saved meal input', async () => {
    expect((await alice.post('/api/nutrition/saved-meals', { name: 'x', items: [] })).status).toBe(400);
    const missing = await alice.post('/api/nutrition/saved-meals', { name: 'x', items: [{ foodId: '00000000-0000-4000-8000-000000000000', grams: 10 }] });
    expect(missing.status).toBe(404);
  });
});

describe('authorization isolation', () => {
  it("user B gets 404 on user A's entries and saved meals and cannot change them", async () => {
    const { body } = await log(alice, { foodId: chicken.id, grams: 100 });
    const entryId = body.entry.id;
    expect((await bob.patch(`/api/nutrition/logs/${entryId}`, { grams: 1 })).status).toBe(404);
    expect((await bob.patch(`/api/nutrition/logs/${entryId}`, { correction: null })).status).toBe(404);
    expect((await bob.delete(`/api/nutrition/logs/${entryId}`)).status).toBe(404);
    const bobDay = await bob.get(`/api/nutrition/day?date=${today}`);
    expect(bobDay.body.meals.breakfast.entries.some((e: FoodLogEntryDTO) => e.id === entryId)).toBe(false);
    const stillThere = await db.one<{ grams: number }>('SELECT grams FROM food_log_entries WHERE id = $1', [entryId]);
    expect(stillThere.grams).toBe(100);

    const meal = await alice.post('/api/nutrition/saved-meals', { name: 'Private', items: [{ foodId: rice.id, grams: 100 }] });
    const mealId = meal.body.meal.id;
    expect((await bob.post(`/api/nutrition/saved-meals/${mealId}/log`, { date: today, mealType: 'lunch' })).status).toBe(404);
    expect((await bob.delete(`/api/nutrition/saved-meals/${mealId}`)).status).toBe(404);
    expect((await bob.get('/api/nutrition/saved-meals')).body.meals.some((m: { id: string }) => m.id === mealId)).toBe(false);
    expect((await alice.get('/api/nutrition/saved-meals')).body.meals.some((m: { id: string }) => m.id === mealId)).toBe(true);
  });
});
