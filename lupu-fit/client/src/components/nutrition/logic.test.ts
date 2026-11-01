import { PORTION_MAX, PORTION_MIN, SNACK_KCAL_CAP } from '@lupu-fit/shared';
import { describe, expect, it } from 'vitest';
import { DISHES, DISH_BY_ID } from '../../data/content.ts';
import { addDaysIso, adherenceOf, barTone, DEFAULT_CHOICE, dishLogPayload, dishTotalGrams, groupBySlot, menuFor, menuSeed, roundGrams, shoppingFor, shoppingText, spanDates, type FoodEntry } from './logic.ts';

const base = { diet: 'omnivore', restrictions: [], allergies: [] } as const;

describe('dates', () => {
  it('adds days across month boundaries', () => { expect(addDaysIso('2026-02-27', 3)).toBe('2026-03-02'); expect(addDaysIso('2026-01-01', -1)).toBe('2025-12-31'); });
  it('lists consecutive dates', () => { expect(spanDates('2026-05-30', 3)).toEqual(['2026-05-30', '2026-05-31', '2026-06-01']); });
});

describe('menu determinism', () => {
  it('same date + choice => same menu; different date or shuffle => different seed', () => {
    const a = menuFor(DISHES, 2500, '2026-05-01', DEFAULT_CHOICE, base);
    const b = menuFor(DISHES, 2500, '2026-05-01', DEFAULT_CHOICE, base);
    expect(b).toEqual(a);
    expect(menuSeed('2026-05-01', 0)).not.toBe(menuSeed('2026-05-02', 0));
    expect(menuSeed('2026-05-01', 0)).not.toBe(menuSeed('2026-05-01', 1));
    const ids = (d: string, s: number) => menuFor(DISHES, 2500, d, { ...DEFAULT_CHOICE, shuffle: s }, base).items.map((i) => i.dishId).join();
    const variants = new Set([ids('2026-05-01', 0), ids('2026-05-01', 1), ids('2026-05-01', 2), ids('2026-05-02', 0), ids('2026-05-03', 0)]);
    expect(variants.size).toBeGreaterThan(1);
  });
  it('honours meal count and engine limits', () => {
    for (const n of [3, 4, 5] as const) {
      const m = menuFor(DISHES, 2200, '2026-05-01', { mealCount: n, shuffle: 0, swaps: [] }, base);
      expect(m.items.length + m.missingSlots.length).toBe(n);
      for (const i of m.items) {
        expect(i.portion).toBeGreaterThanOrEqual(PORTION_MIN); expect(i.portion).toBeLessThanOrEqual(PORTION_MAX);
        if (i.slot === 'snack') expect(i.kcal).toBeLessThanOrEqual(SNACK_KCAL_CAP + 1);
      }
    }
  });
  it('swap replays deterministically and changes the dish without duplicating others', () => {
    const c = { ...DEFAULT_CHOICE, swaps: [1] };
    const plain = menuFor(DISHES, 2500, '2026-05-01', DEFAULT_CHOICE, base);
    const s1 = menuFor(DISHES, 2500, '2026-05-01', c, base);
    expect(menuFor(DISHES, 2500, '2026-05-01', c, base)).toEqual(s1);
    expect(s1.items[1]!.dishId).not.toBe(plain.items[1]!.dishId);
    expect(s1.items[1]!.slot).toBe(plain.items[1]!.slot);
    expect(new Set(s1.items.map((i) => i.dishId)).size).toBe(s1.items.length);
  });
  it('excludes dishes that contain the profile allergens', () => {
    const m = menuFor(DISHES, 2500, '2026-05-01', DEFAULT_CHOICE, { ...base, allergies: ['dairy', 'egg', 'gluten'] });
    for (const i of m.items) {
      const d = DISH_BY_ID.get(i.dishId)!;
      expect(d.allergens).not.toContain('dairy'); expect(d.allergens).not.toContain('egg'); expect(d.allergens).not.toContain('gluten');
    }
  });
});

describe('dish logging payload', () => {
  it('grams = total ingredient grams x portion; macros are the scaled values', () => {
    const m = menuFor(DISHES, 2500, '2026-05-01', DEFAULT_CHOICE, base);
    const item = m.items[0]!; const dish = DISH_BY_ID.get(item.dishId)!;
    const p = dishLogPayload(item, dish, '2026-05-01', 'x');
    expect(p.grams).toBeCloseTo(dishTotalGrams(dish) * item.portion, 0);
    expect(p).toMatchObject({ dishId: dish.id, slot: item.slot, kcal: item.kcal, proteinG: item.proteinG, loggedDate: '2026-05-01', estimated: false });
  });
});

describe('shopping list', () => {
  it('aggregates across days, rounds sensibly and renders text', () => {
    const dates = spanDates('2026-05-01', 3);
    const one = shoppingFor(['2026-05-01'], DISHES, DISH_BY_ID, 2500, () => DEFAULT_CHOICE, base);
    const three = shoppingFor(dates, DISHES, DISH_BY_ID, 2500, () => DEFAULT_CHOICE, base);
    expect(three.length).toBeGreaterThanOrEqual(one.length);
    const total = (l: typeof one) => l.reduce((s, x) => s + x.grams, 0);
    expect(total(three)).toBeGreaterThan(total(one));
    for (const l of three) expect(l.grams % 5).toBe(0);
    expect(shoppingFor(dates, DISHES, DISH_BY_ID, 2500, () => DEFAULT_CHOICE, base)).toEqual(three);
    const txt = shoppingText(three, 'en', 'g');
    expect(txt.split('\n')).toHaveLength(three.length);
    expect(txt).toMatch(/^- .+: \d+ g/);
  });
  it('rounds grams to shop-friendly steps', () => {
    expect([roundGrams(43), roundGrams(212), roundGrams(1234), roundGrams(1)]).toEqual([45, 210, 1250, 5]);
  });
});

describe('totals and adherence', () => {
  it('groups by slot', () => {
    const e = (slot: FoodEntry['slot']) => ({ id: slot, slot }) as FoodEntry;
    expect(Object.values(groupBySlot([e('lunch'), e('snack'), e('lunch')])).map((x) => x.length)).toEqual([0, 2, 0, 1]);
  });
  it('averages logged days only and is honest when empty', () => {
    expect(adherenceOf([])).toEqual({ daysLogged: 0, avgKcal: null, avgProteinG: null });
    const r = adherenceOf([{ date: 'a', kcal: 2000, proteinG: 100, carbsG: 0, fatG: 0, meals: 3 }, { date: 'b', kcal: 3000, proteinG: 140, carbsG: 0, fatG: 0, meals: 3 }]);
    expect(r).toEqual({ daysLogged: 2, avgKcal: 2500, avgProteinG: 120 });
  });
  it('bar tones', () => { expect(barTone(3000, 2500, true)).toBe('over'); expect(barTone(3000, 160, false)).toBe('ok'); expect(barTone(100, 2500, true)).toBeUndefined(); });
});
