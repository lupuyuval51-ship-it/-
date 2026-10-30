import { describe, expect, it } from 'vitest';
import type { DayNutritionDTO } from '@shared/types';
import { ZERO_MACROS } from '@shared/nutrition';
import { backoffMs, isOutboxEntry, mayDuplicate, pendingFoods, pendingWeights, requestFor, type OutboxEntry } from './outbox';
import { isPendingEntry, mergePendingIntoDay, PENDING_PREFIX } from './pending';

const food = (over: Partial<OutboxEntry> = {}): OutboxEntry => ({
  id: 'key-food-0001',
  createdAt: 1_000,
  notBefore: 1_000,
  attempts: 0,
  status: 'pending',
  op: {
    type: 'food_log',
    input: { date: '2026-10-29', mealType: 'breakfast', foodId: 'f1', grams: 150, source: 'manual' },
    preview: { name: { en: 'Oats', he: 'שיבולת שועל' }, grams: 150, servings: null, kcal: 300, proteinG: 10, carbsG: 50, fatG: 5, fiberG: 8 },
  },
  ...over,
});
const quick = (): OutboxEntry => ({
  id: 'key-quick-0001',
  createdAt: 2_000,
  notBefore: 2_000,
  attempts: 0,
  status: 'pending',
  op: { type: 'quick_add', input: { date: '2026-10-29', mealType: 'lunch', name: 'Sandwich', kcal: 450, proteinG: 20, carbsG: 40, fatG: 15, fiberG: 3, note: '' } },
});
const weight = (): OutboxEntry => ({
  id: 'key-weight-001',
  createdAt: 3_000,
  notBefore: 3_000,
  attempts: 0,
  status: 'pending',
  op: { type: 'weight', input: { date: '2026-10-28', weightKg: 80.5, note: '' } },
});

describe('isOutboxEntry', () => {
  it('accepts the three operation kinds and rejects damaged storage', () => {
    for (const e of [food(), quick(), weight()]) expect(isOutboxEntry(e)).toBe(true);
    expect(isOutboxEntry(null)).toBe(false);
    expect(isOutboxEntry({ ...food(), id: 'short' })).toBe(false);
    expect(isOutboxEntry({ ...food(), status: 'done' })).toBe(false);
    expect(isOutboxEntry({ ...food(), op: { type: 'delete_everything', input: {} } })).toBe(false);
    expect(isOutboxEntry({ ...food(), op: { type: 'weight' } })).toBe(false);
  });
});

describe('requestFor', () => {
  it('maps each operation to its create endpoint', () => {
    expect(requestFor(food().op).path).toBe('/nutrition/logs');
    expect(requestFor(quick().op).path).toBe('/nutrition/logs/quick');
    expect(requestFor(weight().op).path).toBe('/progress/body-weight');
  });
});

describe('backoff and duplicate window', () => {
  it('backs off up to two minutes', () => {
    expect([1, 2, 3, 4, 5, 6, 9].map(backoffMs)).toEqual([2000, 5000, 15000, 30000, 60000, 120000, 120000]);
  });
  it('flags entries older than the server idempotency window', () => {
    expect(mayDuplicate(food({ createdAt: 0 }), 23 * 3600_000)).toBe(false);
    expect(mayDuplicate(food({ createdAt: 0 }), 25 * 3600_000)).toBe(true);
  });
});

describe('pending views', () => {
  it('lists waiting food entries and weights, but not rejected ones', () => {
    const rejected = { ...quick(), id: 'key-quick-0002', status: 'failed' as const };
    expect(pendingFoods([food(), quick(), weight(), rejected]).map((p) => [p.mealType, p.preview.kcal])).toEqual([['breakfast', 300], ['lunch', 450]]);
    expect(pendingWeights([food(), weight(), { ...weight(), id: 'key-weight-002', status: 'failed' }])).toEqual([{ id: 'key-weight-001', date: '2026-10-28', weightKg: 80.5 }]);
  });
});

describe('mergePendingIntoDay', () => {
  const day = (): DayNutritionDTO => ({
    date: '2026-10-29',
    targets: null,
    totals: { kcal: 100, proteinG: 5, carbsG: 10, fatG: 2, fiberG: 1 },
    meals: {
      breakfast: { entries: [], totals: { ...ZERO_MACROS } },
      lunch: { entries: [], totals: { ...ZERO_MACROS } },
      dinner: { entries: [], totals: { ...ZERO_MACROS } },
      snack: { entries: [], totals: { ...ZERO_MACROS } },
    },
    remaining: { kcal: 1900, proteinG: 100, carbsG: 200, fatG: 60, fiberG: 20 },
  });

  it('adds waiting entries to their meal, to the totals and subtracts them from what is left', () => {
    const merged = mergePendingIntoDay(day(), pendingFoods([food(), quick()]));
    expect(merged.meals.breakfast.entries.map((e) => e.id)).toEqual([`${PENDING_PREFIX}key-food-0001`]);
    expect(merged.meals.lunch.entries[0]).toMatchObject({ foodName: { en: 'Sandwich' }, kcal: 450 });
    expect(merged.meals.breakfast.totals.kcal).toBe(300);
    expect(merged.totals.kcal).toBe(100 + 300 + 450);
    expect(merged.remaining?.kcal).toBe(1900 - 750);
    expect(isPendingEntry(merged.meals.breakfast.entries[0]!)).toBe(true);
  });

  it('leaves other days and an empty outbox untouched', () => {
    const d = day();
    expect(mergePendingIntoDay(d, [])).toBe(d);
    expect(mergePendingIntoDay({ ...d, date: '2026-10-30' }, pendingFoods([food()]))).toEqual({ ...d, date: '2026-10-30' });
  });
});
