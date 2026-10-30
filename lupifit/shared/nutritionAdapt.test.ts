import { describe, expect, it } from 'vitest';
import { addDays } from './dates';
import { computeNutritionTargets } from './nutrition';
import { suggestAdjustment, weeklyRateKg, type AdaptInput, type WeightPoint } from './nutritionAdapt';

const TODAY = '2026-10-28';
/** Weigh-ins every 3 days for 28 days with a constant weekly change. */
function series(startKg: number, kgPerWeek: number, everyDays = 3, days = 28): WeightPoint[] {
  const out: WeightPoint[] = [];
  for (let d = -days + 1; d <= 0; d += everyDays) out.push({ date: addDays(TODAY, d), kg: Math.round((startKg + (kgPerWeek / 7) * (d + days - 1)) * 100) / 100 });
  return out;
}
const base = (over: Partial<AdaptInput> = {}): AdaptInput => ({
  today: TODAY,
  goal: 'fat_loss',
  isMinor: false,
  targetsCustom: false,
  points: series(80, -0.1),
  baselineCalories: 2200,
  minimumCalories: 1500,
  currentOffset: 0,
  adjustedOn: null,
  dismissedUntil: null,
  ...over,
});

describe('weeklyRateKg', () => {
  it('measures the slope in kg per week', () => {
    expect(weeklyRateKg(series(80, -0.5, 2, 14))).toBeCloseTo(-0.5, 1);
  });
  it('needs three weigh-ins over at least a week', () => {
    expect(weeklyRateKg(series(80, -0.5, 7, 14).slice(0, 2))).toBeNull();
    expect(weeklyRateKg([{ date: TODAY, kg: 80 }, { date: addDays(TODAY, -3), kg: 80 }, { date: addDays(TODAY, -4), kg: 80 }])).toBeNull();
  });
});

describe('suggestAdjustment', () => {
  it('stays quiet without enough weigh-ins in both windows', () => {
    expect(suggestAdjustment(base({ points: series(80, -0.1).slice(-4) }))).toEqual({ status: 'none', reason: 'not_enough_data' });
  });

  it('suggests a small cut when fat loss has stalled for two windows', () => {
    const r = suggestAdjustment(base({ points: series(80, 0) }));
    expect(r).toMatchObject({ status: 'suggest', suggestion: { code: 'loss_too_slow', offsetKcal: -100, deltaKcal: -100, proposedCalories: 2100 } });
  });

  it('suggests more food when weight falls faster than planned', () => {
    const r = suggestAdjustment(base({ points: series(80, -1.0) })); // -1.25 %/week
    expect(r).toMatchObject({ status: 'suggest', suggestion: { code: 'loss_too_fast', offsetKcal: 100, proposedCalories: 2300 } });
  });

  it('is on track inside the band', () => {
    expect(suggestAdjustment(base({ points: series(80, -0.4) }))).toEqual({ status: 'none', reason: 'on_track' });
  });

  it('needs both windows to agree (one slow fortnight is not enough)', () => {
    const slowThenFine = [...series(80, -0.6, 3, 28).slice(0, 5), ...series(78, 0, 3, 28).slice(5)];
    expect(suggestAdjustment(base({ points: slowThenFine })).status).toBe('none');
  });

  it('muscle gain: too slow raises, too fast lowers', () => {
    expect(suggestAdjustment(base({ goal: 'muscle_gain', points: series(70, 0) }))).toMatchObject({ status: 'suggest', suggestion: { code: 'gain_too_slow', offsetKcal: 100 } });
    expect(suggestAdjustment(base({ goal: 'muscle_gain', points: series(70, 1.0) }))).toMatchObject({ status: 'suggest', suggestion: { code: 'gain_too_fast', offsetKcal: -100 } });
  });

  it('never lowers calories for a minor', () => {
    expect(suggestAdjustment(base({ isMinor: true, goal: 'muscle_gain', points: series(60, 1.0) }))).toEqual({ status: 'none', reason: 'on_track' });
    expect(suggestAdjustment(base({ isMinor: true, goal: 'muscle_gain', points: series(60, 0) }))).toMatchObject({ status: 'suggest' });
  });

  it('respects the safe minimum, the ±150 cap and custom targets', () => {
    expect(suggestAdjustment(base({ points: series(80, 0), baselineCalories: 1550, minimumCalories: 1500 }))).toEqual({ status: 'none', reason: 'at_floor' });
    expect(suggestAdjustment(base({ points: series(80, 0), currentOffset: -150 }))).toEqual({ status: 'none', reason: 'at_limit' });
    expect(suggestAdjustment(base({ points: series(80, 0), currentOffset: -100 }))).toMatchObject({ status: 'suggest', suggestion: { offsetKcal: -150, deltaKcal: -50 } });
    expect(suggestAdjustment(base({ points: series(80, 0), targetsCustom: true }))).toEqual({ status: 'none', reason: 'custom_targets' });
  });

  it('waits after an adjustment and after "not now"', () => {
    expect(suggestAdjustment(base({ points: series(80, 0), adjustedOn: addDays(TODAY, -10) }))).toEqual({ status: 'none', reason: 'recently_adjusted' });
    expect(suggestAdjustment(base({ points: series(80, 0), adjustedOn: addDays(TODAY, -30) })).status).toBe('suggest');
    expect(suggestAdjustment(base({ points: series(80, 0), dismissedUntil: addDays(TODAY, 3) }))).toEqual({ status: 'none', reason: 'dismissed' });
    expect(suggestAdjustment(base({ points: series(80, 0), dismissedUntil: addDays(TODAY, -1) })).status).toBe('suggest');
  });
});

describe('computeNutritionTargets with a calorie offset', () => {
  const adult = { ageYears: 30, sex: 'male' as const, heightCm: 180, weightKg: 80, activityLevel: 'moderate' as const, goal: 'fat_loss' as const };

  it('moves calories by the approved offset and re-derives the macros', () => {
    const base = computeNutritionTargets(adult);
    const cut = computeNutritionTargets({ ...adult, calorieOffset: -100 });
    expect(cut.calories).toBe(base.calories - 100);
    expect(cut.notes).toContain('user_adjustment');
    expect(cut.proteinG).toBe(base.proteinG);
    expect(cut.carbsG).toBeLessThan(base.carbsG);
  });

  it('can never go below the safe minimum, whatever the offset', () => {
    const t = computeNutritionTargets({ ...adult, ageYears: 60, sex: 'female', weightKg: 50, heightCm: 155, activityLevel: 'sedentary', calorieOffset: -5000 });
    expect(t.calories).toBe(Math.round(t.minimumCalories / 10) * 10);
    expect(t.notes).toContain('floor_applied');
  });

  it('never lowers a minor\'s target, but may raise it', () => {
    const minor = { ...adult, ageYears: 15, goal: 'muscle_gain' as const };
    const base = computeNutritionTargets(minor);
    expect(computeNutritionTargets({ ...minor, calorieOffset: -150 }).calories).toBe(base.calories);
    expect(computeNutritionTargets({ ...minor, calorieOffset: 100 }).calories).toBe(base.calories + 100);
  });
});
