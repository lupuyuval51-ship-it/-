import { describe, expect, it } from 'vitest';
import { addDays, dateRange, isValidDateString, startOfWeek, todayInTimeZone, yearsBetween } from './dates';
import { levelInfo, xpForLevel } from './gamification';
import { computeNutritionTargets, foodConflicts, mifflinStJeor, scaleNutrients, sumMacros } from './nutrition';
import {
  adjustTimer,
  isValidTimerState,
  pauseTimer,
  resetTimer,
  resumeTimer,
  startTimer,
  timerRemainingSeconds,
  timerStatus,
} from './timer';
import { activeElapsedSeconds, estimateOneRepMax, formatClock, setVolumeKg } from './training';

describe('nutrition math', () => {
  it('scales per-100g values to a portion', () => {
    const chicken = { kcal: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 };
    expect(scaleNutrients(chicken, 150)).toEqual({ kcal: 247.5, proteinG: 46.5, carbsG: 0, fatG: 5.4, fiberG: 0 });
    expect(scaleNutrients(chicken, 0).kcal).toBe(0);
  });

  it('sums macros without floating point noise', () => {
    const total = sumMacros([
      { kcal: 0.1, proteinG: 0.2, carbsG: 0, fatG: 0, fiberG: 0 },
      { kcal: 0.2, proteinG: 0.1, carbsG: 0, fatG: 0, fiberG: 0 },
    ]);
    expect(total.kcal).toBe(0.3);
    expect(total.proteinG).toBe(0.3);
  });

  it('computes Mifflin-St Jeor BMR', () => {
    expect(mifflinStJeor('male', 80, 180, 30)).toBe(1780);
    expect(mifflinStJeor('female', 60, 165, 25)).toBeCloseTo(1345.25, 2);
  });

  it('applies a capped deficit for adult fat loss and never goes below the floor', () => {
    const t = computeNutritionTargets({ ageYears: 30, sex: 'male', heightCm: 180, weightKg: 80, activityLevel: 'moderate', goal: 'fat_loss' });
    // TDEE = 1780 * 1.55 = 2759; 20% = 551.8 → capped at 500.
    expect(t.tdee).toBe(2759);
    expect(t.calories).toBe(2260);
    expect(t.notes).toContain('deficit_capped');
    expect(t.calories).toBeGreaterThanOrEqual(t.minimumCalories);
    const small = computeNutritionTargets({ ageYears: 60, sex: 'female', heightCm: 150, weightKg: 45, activityLevel: 'sedentary', goal: 'fat_loss' });
    expect(small.calories).toBeGreaterThanOrEqual(1200);
    expect(small.notes).toContain('floor_applied');
  });

  it('never applies a deficit for minors', () => {
    const t = computeNutritionTargets({ ageYears: 15, sex: 'female', heightCm: 160, weightKg: 55, activityLevel: 'active', goal: 'fat_loss' });
    expect(t.notes).toContain('minor_no_deficit');
    expect(t.calories).toBeGreaterThanOrEqual(Math.round(t.tdee / 10) * 10 - 10);
    expect(t.proteinG).toBeLessThanOrEqual(Math.round(1.5 * 55));
  });

  it('adds a lean surplus for muscle gain and keeps macros consistent with calories', () => {
    const t = computeNutritionTargets({ ageYears: 25, sex: 'male', heightCm: 175, weightKg: 70, activityLevel: 'active', goal: 'muscle_gain' });
    expect(t.calories - t.tdee).toBeGreaterThanOrEqual(190);
    expect(t.calories - t.tdee).toBeLessThanOrEqual(360);
    expect(t.proteinG).toBe(126);
    const fromMacros = t.proteinG * 4 + t.carbsG * 4 + t.fatG * 9;
    expect(Math.abs(fromMacros - t.calories)).toBeLessThan(15);
    expect(t.carbsG).toBeGreaterThanOrEqual(130);
  });

  it('uses a reference weight for protein when BMI > 30', () => {
    const t = computeNutritionTargets({ ageYears: 40, sex: 'male', heightCm: 175, weightKg: 130, activityLevel: 'light', goal: 'general_fitness' });
    expect(t.notes).toContain('protein_reference_weight');
    expect(t.proteinG).toBeLessThan(Math.round(1.4 * 130));
  });

  it('flags allergen, diet and restriction conflicts', () => {
    const tahini = { allergens: ['sesame' as const], animalSource: 'none' as const, contains: [] };
    const bacon = { allergens: [], animalSource: 'meat' as const, contains: ['pork' as const] };
    const prefs = { dietType: 'vegetarian' as const, allergies: ['sesame' as const], restrictions: ['no_pork' as const] };
    expect(foodConflicts(tahini, prefs)).toEqual([{ type: 'allergen', value: 'sesame' }]);
    expect(foodConflicts(bacon, prefs)).toEqual([
      { type: 'diet', value: 'vegetarian' },
      { type: 'restriction', value: 'no_pork' },
    ]);
    expect(foodConflicts(bacon, { dietType: 'omnivore', allergies: [], restrictions: [] })).toEqual([]);
  });
});

describe('rest timer', () => {
  const t0 = Date.parse('2026-01-01T10:00:00Z');

  it('counts down from timestamps and finishes', () => {
    const s = startTimer(90, t0, 'push_up');
    expect(timerStatus(s, t0)).toBe('running');
    expect(timerRemainingSeconds(s, t0 + 30_000)).toBe(60);
    expect(timerRemainingSeconds(s, t0 + 30_500)).toBe(60);
    expect(timerStatus(s, t0 + 91_000)).toBe('finished');
    expect(timerRemainingSeconds(s, t0 + 200_000)).toBe(0);
  });

  it('pauses, survives "refresh" (serialization) and resumes', () => {
    const running = startTimer(60, t0);
    const paused = pauseTimer(running, t0 + 20_000);
    expect(timerStatus(paused, t0 + 999_000)).toBe('paused');
    expect(timerRemainingSeconds(paused, t0 + 999_000)).toBe(40);
    const restored = JSON.parse(JSON.stringify(paused));
    expect(isValidTimerState(restored)).toBe(true);
    const resumed = resumeTimer(restored, t0 + 100_000);
    expect(timerRemainingSeconds(resumed, t0 + 110_000)).toBe(30);
  });

  it('resets and adjusts', () => {
    const s = startTimer(60, t0);
    expect(timerStatus(resetTimer(s), t0)).toBe('idle');
    expect(timerRemainingSeconds(resetTimer(s), t0)).toBe(60);
    expect(timerRemainingSeconds(adjustTimer(s, 15, t0), t0)).toBe(75);
    expect(timerRemainingSeconds(adjustTimer(s, -100, t0), t0)).toBe(0);
    expect(startTimer(5000, t0).durationSeconds).toBe(600);
    expect(isValidTimerState({ durationSeconds: -1, endsAt: null, remainingSeconds: null, exerciseId: null })).toBe(false);
  });
});

describe('training math', () => {
  it('estimates 1RM with Epley within 1–12 reps', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
    expect(estimateOneRepMax(100, 5)).toBe(116.7);
    expect(estimateOneRepMax(100, 15)).toBeNull();
    expect(estimateOneRepMax(0, 5)).toBeNull();
    expect(setVolumeKg(60, 10)).toBe(600);
  });

  it('computes active elapsed time excluding pauses', () => {
    const start = '2026-01-01T10:00:00.000Z';
    const now = Date.parse('2026-01-01T10:30:00.000Z');
    expect(activeElapsedSeconds({ startedAt: start, pausedAt: null, pausedSeconds: 300 }, now)).toBe(1500);
    expect(activeElapsedSeconds({ startedAt: start, pausedAt: '2026-01-01T10:10:00.000Z', pausedSeconds: 0 }, now)).toBe(600);
    expect(formatClock(3725)).toBe('1:02:05');
    expect(formatClock(65)).toBe('1:05');
  });
});

describe('dates', () => {
  it('handles calendar math and time zones', () => {
    expect(isValidDateString('2026-02-29')).toBe(false);
    expect(isValidDateString('2028-02-29')).toBe(true);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(dateRange('2026-01-30', '2026-02-02')).toHaveLength(4);
    expect(startOfWeek('2026-10-09', 0)).toBe('2026-10-04'); // Friday → Sunday
    expect(startOfWeek('2026-10-09', 1)).toBe('2026-10-05'); // Friday → Monday
    expect(todayInTimeZone('Asia/Jerusalem', new Date('2026-10-09T22:30:00Z'))).toBe('2026-10-10');
    expect(todayInTimeZone('Not/AZone', new Date('2026-10-09T22:30:00Z'))).toBe('2026-10-09');
    expect(yearsBetween('2020-05-10', '2026-05-09')).toBe(5);
    expect(yearsBetween('2020-05-10', '2026-05-10')).toBe(6);
  });
});

describe('levels', () => {
  it('uses a triangular XP curve', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBe(300);
    expect(levelInfo(0).level).toBe(1);
    expect(levelInfo(299).level).toBe(2);
    expect(levelInfo(300).level).toBe(3);
    expect(levelInfo(350).progress).toBeCloseTo(50 / 300, 5);
  });
});

import { platesFor } from './plates';

describe('platesFor', () => {
  it('loads kg plates heaviest first', () => {
    expect(platesFor(100, 'kg', 20)).toEqual({ perSide: [{ plate: 25, count: 1 }, { plate: 15, count: 1 }], total: 100, remainder: 0, belowBar: false });
    expect(platesFor(60, 'kg', 20).perSide).toEqual([{ plate: 20, count: 1 }]);
    expect(platesFor(142.5, 'kg', 20).perSide).toEqual([{ plate: 25, count: 2 }, { plate: 10, count: 1 }, { plate: 1.25, count: 1 }]);
  });
  it('supports pounds with a 45 lb bar', () => {
    expect(platesFor(225, 'lb', 45)).toEqual({ perSide: [{ plate: 45, count: 2 }], total: 225, remainder: 0, belowBar: false });
    expect(platesFor(135, 'lb', 45).perSide).toEqual([{ plate: 45, count: 1 }]);
  });
  it('reports the remainder instead of rounding up when the weight is not reachable', () => {
    const load = platesFor(21, 'kg', 20);
    expect(load.perSide).toEqual([]);
    expect(load.total).toBe(20);
    expect(load.remainder).toBe(1);
  });
  it('handles targets at or below the bar', () => {
    expect(platesFor(20, 'kg', 20)).toMatchObject({ perSide: [], total: 20, remainder: 0, belowBar: false });
    expect(platesFor(15, 'kg', 20)).toMatchObject({ perSide: [], belowBar: true });
    expect(platesFor(Number.NaN, 'kg', 20).perSide).toEqual([]);
  });
});
