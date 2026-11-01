import { describe, expect, it } from 'vitest';
import { ACTIVITY_LEVELS, GOALS, SEXES } from '../src/enums.js';
import { bmr, bmi, computeNutrition, KCAL_FLOOR, proteinReferenceWeightKg, suggestTrendAdjustment, smoothWeights, type NutritionInput } from '../src/nutrition.js';

const base: NutritionInput = { sex: 'male', age: 30, heightCm: 180, weightKg: 80, goal: 'general_fitness', activity: 'moderate' };

describe('Mifflin-St Jeor', () => {
  it('matches hand calculations for all sexes', () => {
    expect(bmr('male', 80, 180, 30)).toBe(1780);
    expect(bmr('female', 60, 165, 28)).toBeCloseTo(600 + 1031.25 - 140 - 161, 5);
    expect(bmr('unspecified', 70, 170, 40)).toBeCloseTo(700 + 1062.5 - 200 - 78, 5);
  });
  it('goal adjustments', () => {
    const maint = computeNutrition(base);
    expect(maint.tdee).toBe(Math.round(1780 * 1.55));
    expect(maint.kcal).toBe(maint.tdee);
    const cut = computeNutrition({ ...base, goal: 'fat_loss' });
    expect(maint.tdee - cut.kcal).toBeLessThanOrEqual(500);
    expect(maint.tdee - cut.kcal).toBeGreaterThan(0);
    expect(cut.kcal).toBeGreaterThanOrEqual(cut.bmr);
    const bulk = computeNutrition({ ...base, goal: 'muscle_gain' });
    expect(bulk.kcal - maint.tdee).toBeGreaterThanOrEqual(200); expect(bulk.kcal - maint.tdee).toBeLessThanOrEqual(350);
    const str = computeNutrition({ ...base, goal: 'strength' });
    expect(str.kcal - maint.tdee).toBeLessThanOrEqual(250);
  });
});

describe('floors and invariants (exhaustive grid)', () => {
  it('adult floors, 130 g carb floor, minors never in deficit', () => {
    let n = 0;
    for (const sex of SEXES) for (const goal of GOALS) for (const activity of ACTIVITY_LEVELS) for (const age of [13, 15, 17, 18, 30, 50, 65, 100]) for (const [h, w] of [[120, 30], [150, 45], [165, 55], [180, 80], [190, 120], [230, 300], [160, 140]] as const) {
      for (const customKcal of [undefined, 800, 1100, 1300, 1600, 2400]) {
        const t = computeNutrition({ sex, age, heightCm: h, weightKg: w, goal, activity, customKcal });
        if (t.bucket === 'minor') expect(t.kcal).toBeGreaterThanOrEqual(Math.round(t.tdee) - 1);
        else expect(t.kcal).toBeGreaterThanOrEqual(KCAL_FLOOR[sex]);
        expect(t.carbsG).toBeGreaterThanOrEqual(130);
        expect(t.proteinG).toBeGreaterThan(0);
        n++;
      }
    }
    expect(n).toBeGreaterThan(5000);
  });
  it('minor with fat_loss gets TDEE and the supportive note', () => {
    const t = computeNutrition({ ...base, age: 16, goal: 'fat_loss' });
    expect(t.kcal).toBeGreaterThanOrEqual(t.tdee);
    expect(t.notes).toContain('minor_no_deficit');
  });
  it('custom override is clamped to the floor', () => {
    const t = computeNutrition({ ...base, sex: 'female', weightKg: 60, heightCm: 165, customKcal: 900 });
    expect(t.kcal).toBeGreaterThanOrEqual(1200);
    expect(t.notes).toContain('custom_clamped');
  });
  it('BMI > 30 uses adjusted reference weight for protein', () => {
    expect(bmi(120, 180)).toBeGreaterThan(30);
    const ideal = 25 * 1.8 ** 2;
    expect(proteinReferenceWeightKg(120, 180)).toBeCloseTo(ideal + 0.25 * (120 - ideal), 6);
    expect(proteinReferenceWeightKg(80, 180)).toBe(80);
    const t = computeNutrition({ ...base, weightKg: 120, goal: 'muscle_gain' });
    expect(t.proteinG).toBe(Math.round(1.8 * proteinReferenceWeightKg(120, 180)));
    expect(t.proteinG).toBeLessThan(Math.round(1.8 * 120));
  });
});

describe('weight trend suggestion', () => {
  const series = (start: number, perWeek: number, weeks = 4) => Array.from({ length: weeks * 7 + 1 }, (_, i) => ({ date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10), weightKg: start + (perWeek * i) / 7 }));
  it('returns null on thin data', () => {
    expect(suggestTrendAdjustment([], 'fat_loss', 2000, 'male', 30)).toBeNull();
    expect(suggestTrendAdjustment(series(80, 0, 1).slice(0, 2), 'fat_loss', 2000, 'male', 30)).toBeNull();
  });
  it('suggests ±150 and respects floors/minors', () => {
    expect(suggestTrendAdjustment(series(80, 0), 'fat_loss', 2000, 'male', 30)?.deltaKcal).toBe(-150);
    expect(suggestTrendAdjustment(series(80, -1.2), 'fat_loss', 2000, 'male', 30)?.deltaKcal).toBe(150);
    expect(suggestTrendAdjustment(series(80, 0), 'fat_loss', 1550, 'male', 30)).toBeNull();
    expect(suggestTrendAdjustment(series(60, 0), 'fat_loss', 2500, 'male', 16)).toBeNull();
    expect(suggestTrendAdjustment(series(70, 0), 'muscle_gain', 2800, 'male', 25)?.deltaKcal).toBe(150);
  });
  it('smoothing is monotone toward the data', () => {
    const s = smoothWeights([{ date: '2026-01-01', weightKg: 80 }, { date: '2026-01-02', weightKg: 82 }]);
    expect(s[1]?.weightKg).toBeCloseTo(80.6, 5);
  });
});
