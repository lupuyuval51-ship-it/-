import { describe, expect, it } from 'vitest';
import { customFoodSchema, quickAddSchema } from '@shared/schemas/nutrition';
import { issueCode } from './forms';
import { fitWithin } from './image';
import {
  amountError,
  clampLogDate,
  convertAmount,
  estimateNutrients,
  gramsFor,
  maxLogDate,
  previewNutrients,
  quickAmounts,
  rescaleMeal,
} from './portion';

const chicken = { kcal: 151, protein: 30.5, carbs: 0, fat: 3.2, fiber: 0 };

describe('portion math', () => {
  it('converts grams and servings to grams', () => {
    expect(gramsFor('grams', 150, 120)).toBe(150);
    expect(gramsFor('servings', 1.5, 120)).toBe(180);
    expect(gramsFor('servings', 0.33, 30)).toBe(9.9);
    expect(gramsFor('grams', 0, 120)).toBeNull();
    expect(gramsFor('grams', null, 120)).toBeNull();
    expect(gramsFor('grams', Number.NaN, 120)).toBeNull();
  });

  it('previews nutrients exactly like the server (scaled per 100 g, one decimal)', () => {
    expect(previewNutrients(chicken, 'grams', 150, 120)).toEqual({ kcal: 226.5, proteinG: 45.8, carbsG: 0, fatG: 4.8, fiberG: 0 });
    expect(previewNutrients(chicken, 'servings', 2, 120)).toEqual({ kcal: 362.4, proteinG: 73.2, carbsG: 0, fatG: 7.7, fiberG: 0 });
    expect(previewNutrients(chicken, 'grams', null, 120)).toEqual({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 });
  });

  it('validates amounts within the logging limits', () => {
    expect(amountError('grams', 100, 120)).toBeNull();
    expect(amountError('grams', null, 120)).toBe('required');
    expect(amountError('grams', 0, 120)).toBe('too_small');
    expect(amountError('grams', -5, 120)).toBe('too_small');
    expect(amountError('grams', 5001, 120)).toBe('too_big');
    expect(amountError('servings', 101, 10)).toBe('too_big');
    expect(amountError('servings', 50, 120)).toBe('too_big'); // 6000 g
    expect(amountError('servings', 2, 120)).toBeNull();
  });

  it('converts the amount when switching units', () => {
    expect(convertAmount('grams', 'servings', 180, 120)).toBe(1.5);
    expect(convertAmount('servings', 'grams', 1.5, 120)).toBe(180);
    expect(convertAmount('grams', 'servings', 100, 30)).toBe(3.33);
    expect(convertAmount('grams', 'grams', 100, 30)).toBe(100);
    expect(convertAmount('grams', 'servings', null, 30)).toBeNull();
  });

  it('offers quick amounts including the serving size', () => {
    expect(quickAmounts('grams', 120)).toEqual([50, 100, 120, 150, 200]);
    expect(quickAmounts('grams', 100)).toEqual([50, 100, 150, 200]);
    expect(quickAmounts('servings', 120)).toEqual([0.5, 1, 1.5, 2]);
  });

  it('rescales a suggested meal relative to the server-chosen scale', () => {
    const items = [
      { grams: 300, nutrients: { kcal: 453, proteinG: 91.5, carbsG: 0, fatG: 9.6, fiberG: 0 } },
      { grams: 150, nutrients: { kcal: 195, proteinG: 4.1, carbsG: 42.3, fatG: 0.5, fiberG: 0.6 } },
    ];
    const half = rescaleMeal(items, 1.5, 0.75);
    expect(half.items.map((i) => i.grams)).toEqual([150, 75]);
    expect(half.totals.kcal).toBe(324);
    expect(rescaleMeal(items, 1.5, 1.5).totals.kcal).toBe(648);
  });

  it('computes AI estimate nutrients without fiber', () => {
    expect(estimateNutrients({ kcal: 165, protein: 31, carbs: 0, fat: 3.6 }, 150)).toEqual({ kcal: 247.5, proteinG: 46.5, carbsG: 0, fatG: 5.4, fiberG: 0 });
  });

  it('limits logging dates to tomorrow', () => {
    expect(maxLogDate('2026-12-31')).toBe('2027-01-01');
    expect(clampLogDate('2026-10-01', '2026-10-09')).toBe('2026-10-01');
    expect(clampLogDate('2026-10-20', '2026-10-09')).toBe('2026-10-10');
    expect(clampLogDate('garbage', '2026-10-09')).toBe('2026-10-09');
    expect(clampLogDate(null, '2026-10-09')).toBe('2026-10-09');
  });
});

describe('image downscale sizing', () => {
  it('fits within 1280 px keeping the aspect ratio', () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1280, height: 960 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 960, height: 1280 });
    expect(fitWithin(2000, 2000, 1000)).toEqual({ width: 1000, height: 1000 });
  });

  it('never upscales small images and handles extreme ratios', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(1280, 720)).toEqual({ width: 1280, height: 720 });
    expect(fitWithin(10000, 10)).toEqual({ width: 1280, height: 1 });
    expect(fitWithin(0, 100)).toEqual({ width: 0, height: 0 });
  });
});

describe('form error codes', () => {
  it('maps zod issues to field error codes', () => {
    const res = customFoodSchema.safeParse({ name: '', category: undefined, per100g: { kcal: null, protein: 60, carbs: 50, fat: 1 }, servingGrams: 0 });
    expect(res.success).toBe(false);
    const codes = Object.fromEntries(res.error!.issues.map((i) => [i.path.join('.'), issueCode(i)]));
    expect(codes.name).toBe('required');
    expect(codes.category).toBe('required');
    expect(codes['per100g.kcal']).toBe('required');
    expect(codes.servingGrams).toBe('too_small');
    const macros = customFoodSchema.safeParse({ name: 'x', category: 'grains', per100g: { kcal: 100, protein: 60, carbs: 50, fat: 1 }, servingGrams: 10 });
    expect(issueCode(macros.error!.issues[0]!)).toBe('macros_exceed_100g');
    const quick = quickAddSchema.safeParse({ date: '2026-10-09', mealType: 'lunch', name: 'x', kcal: 99999 });
    expect(issueCode(quick.error!.issues[0]!)).toBe('too_big');
  });
});
