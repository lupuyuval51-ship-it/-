import { describe, expect, it } from 'vitest';
import { ACHIEVEMENT_IDS, type AchievementId } from '../src/enums.js';
import { evaluateAchievements, foodDayXp, isoWeekKey, levelFromXp, levelProgress, prXp, proteinDayXp, setXp, weeklyGoalXp, weighInXp, workoutXp, xpForLevel } from '../src/gamification.js';

describe('levels', () => {
  it('triangular curve 100·L·(L−1)/2', () => {
    expect([1, 2, 3, 4, 5].map(xpForLevel)).toEqual([0, 100, 300, 600, 1000]);
    for (let l = 1; l <= 60; l++) {
      expect(levelFromXp(xpForLevel(l))).toBe(l);
      expect(levelFromXp(xpForLevel(l + 1) - 1)).toBe(l);
    }
    expect(levelProgress(450)).toEqual({ level: 3, xpIntoLevel: 150, xpForNext: 300 });
    expect(levelFromXp(-5)).toBe(1);
  });
});

describe('xp rules', () => {
  const w = { date: '2026-11-01', durationMin: 30, sets: 10, workoutXpAlreadyToday: false, workoutXpThisWeek: 0, weeklyGoal: 3 };
  it('workout xp gates', () => {
    expect(workoutXp(w)?.amount).toBe(50);
    expect(workoutXp({ ...w, durationMin: 9 })).toBeNull();
    expect(workoutXp({ ...w, sets: 2 })).toBeNull();
    expect(workoutXp({ ...w, workoutXpAlreadyToday: true })).toBeNull();
    expect(workoutXp({ ...w, workoutXpThisWeek: 3 })?.amount).toBe(50);
    expect(workoutXp({ ...w, workoutXpThisWeek: 4 })).toBeNull();
  });
  it('caps', () => {
    expect(setXp('s', 10)?.amount).toBe(20);
    expect(setXp('s', 50)?.amount).toBe(30);
    expect(setXp('s', 0)).toBeNull();
    expect(prXp('s', 7)?.amount).toBe(45);
  });
  it('food day window, protein day never rewards undereating, weigh-in weekly, weekly goal', () => {
    expect(foodDayXp('2026-11-01', '2026-11-01', 2)?.amount).toBe(10);
    expect(foodDayXp('2026-11-01', '2026-10-30', 3)?.amount).toBe(10);
    expect(foodDayXp('2026-11-01', '2026-10-29', 3)).toBeNull();
    expect(foodDayXp('2026-11-01', '2026-11-02', 3)).toBeNull();
    expect(foodDayXp('2026-11-01', '2026-11-01', 1)).toBeNull();
    const T = '2026-11-01';
    expect(proteinDayXp(T, { proteinG: 150, targetProteinG: 150, kcal: 2000, targetKcal: 2400 }, T)?.amount).toBe(10);
    expect(proteinDayXp(T, { proteinG: 150, targetProteinG: 150, kcal: 800, targetKcal: 2400 }, T)).toBeNull();
    expect(proteinDayXp(T, { proteinG: 100, targetProteinG: 150, kcal: 2400, targetKcal: 2400 }, T)).toBeNull();
    expect(weighInXp(T, true, T)).toBeNull();
    expect(weighInXp(T, false, T)?.sourceKey).toBe(isoWeekKey(T));
    expect(weeklyGoalXp('2026-11-01', 3, 3)?.amount).toBe(100);
    expect(weeklyGoalXp('2026-11-01', 2, 3)).toBeNull();
    expect(isoWeekKey('2026-01-01')).toBe('2026-W01');
    expect(isoWeekKey('2024-12-30')).toBe('2025-W01');
  });
  it('protein day and weigh-in pay only inside the food-day window (no XP minted from past or future dates)', () => {
    const T = '2026-11-01'; const full = { proteinG: 150, targetProteinG: 150, kcal: 2400, targetKcal: 2400 };
    expect(proteinDayXp('2026-10-30', full, T)?.amount).toBe(10);
    for (const d of ['1990-01-01', '2026-10-29', '2026-11-02', '2040-01-02']) {
      expect(proteinDayXp(d, full, T), d).toBeNull();
      expect(weighInXp(d, false, T), d).toBeNull();
    }
    expect(weighInXp('2026-10-30', false, T)?.amount).toBe(5);
  });
});

describe('achievements', () => {
  const zero = { workouts: 0, prs: 0, consecutiveGoalWeeks: 0, weeklyGoalHits: 0, foodLogDays: 0, proteinDays: 0, weighIns: 0, finishers: 0, coachThreads: 0 };
  it('14 ids, none unlocked at zero, idempotent', () => {
    expect(ACHIEVEMENT_IDS.length).toBe(14);
    expect(evaluateAchievements(zero, new Set())).toEqual([]);
    const stats = { workouts: 30, prs: 6, consecutiveGoalWeeks: 5, weeklyGoalHits: 5, foodLogDays: 9, proteinDays: 7, weighIns: 2, finishers: 1, coachThreads: 1 };
    const first = evaluateAchievements(stats, new Set());
    expect(new Set(first).size).toBe(14);
    expect(evaluateAchievements(stats, new Set<AchievementId>(first))).toEqual([]);
  });
});
