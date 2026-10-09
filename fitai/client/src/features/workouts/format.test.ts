import { describe, expect, it } from 'vitest';
import type { PlanWorkoutDTO } from '@shared/types';
import { translate, type TKey, type TParams } from '../../i18n';
import { en } from '../../i18n/locales/en';
import { focusLabel, formatPrescription, formatRest, nextWorkoutIndex, noteText, weeklySets } from './format';

const i18nFor = (locale: 'en' | 'he') => ({
  t: (key: TKey, params?: TParams) => translate(locale, key, params) ?? key,
  tx: (key: string, params?: TParams, fallback?: string) => translate(locale, key, params) ?? fallback ?? key,
  formatNumber: (n: number, opts?: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-US', { maximumFractionDigits: 1, ...opts }).format(n),
});

describe('workout formatting', () => {
  const enI18n = i18nFor('en');
  const heI18n = i18nFor('he');

  it('formats prescriptions and rest', () => {
    expect(formatPrescription({ sets: 3, repMin: 8, repMax: 12, targetSeconds: null }, enI18n)).toBe('3 × 8–12');
    expect(formatPrescription({ sets: 5, repMin: 5, repMax: 5, targetSeconds: null }, enI18n)).toBe('5 × 5');
    expect(formatPrescription({ sets: 3, repMin: null, repMax: null, targetSeconds: 45 }, enI18n)).toBe('3 × 45 s');
    expect(formatPrescription({ sets: 3, repMin: null, repMax: null, targetSeconds: 45 }, heI18n)).toBe('3 × 45 שנ׳');
    expect(formatRest(45, enI18n)).toBe('45 s');
    expect(formatRest(90, enI18n)).toBe('1:30 min');
    expect(formatRest(120, enI18n)).toBe('2:00 min');
  });

  it('labels focus codes and keeps custom focus text', () => {
    expect(focusLabel('upper_a', enI18n)).toBe('Upper body A');
    expect(focusLabel('push', heI18n)).toBe('דחיקה');
    expect(focusLabel('Arms & abs', enI18n)).toBe('Arms & abs');
    expect(focusLabel('', enI18n)).toBe('');
  });

  it('renders every generator note code with localized params', () => {
    expect(noteText({ code: 'excluded_for_injury', params: { area: 'knee', count: 12 } }, enI18n)).toBe('Knee injury: 12 exercises that load this area were left out.');
    expect(noteText({ code: 'pattern_unavailable', params: { pattern: 'vertical_pull' } }, enI18n)).toContain('“Vertical pull”');
    expect(noteText({ code: 'low_volume_group', params: { group: 'back', sets: 3 } }, heI18n)).toBe('גב: 3 סטים בשבוע, פחות מ-6–20 הסטים השבועיים שתומכים בהתקדמות יציבה.');
    expect(noteText({ code: 'not_a_real_code' }, enI18n)).toBeNull();
    // Every code the server emits has copy in both languages.
    const codes = Object.keys(en.workouts.notes);
    expect(codes.length).toBeGreaterThan(30);
    for (const code of codes) {
      expect(noteText({ code, params: { days: 3, minutes: 7, count: 2, requested: 7, sets: 4, area: 'knee', pattern: 'squat', group: 'legs' } }, heI18n), code).toBeTruthy();
    }
  });

  it('computes weekly sets per group and the next workout index', () => {
    const ex = (id: string, sets: number, primaryMuscles: string[], movementPattern = 'squat') =>
      ({ id, exerciseId: id, exercise: { primaryMuscles, movementPattern }, sets }) as unknown as PlanWorkoutDTO['exercises'][number];
    const plan = {
      workouts: [
        { exercises: [ex('squat', 4, ['quadriceps', 'glutes']), ex('bench', 3, ['chest']), ex('burpee', 3, ['quadriceps'], 'conditioning')] },
        { exercises: [ex('row', 3, ['lats', 'upper_back']), ex('curl', 2, ['biceps'])] },
      ] as unknown as PlanWorkoutDTO[],
      nextWorkoutIndex: 5,
    };
    expect(weeklySets(plan)).toEqual({ chest: 3, back: 3, shoulders: 0, arms: 2, core: 0, legs: 4 });
    expect(nextWorkoutIndex(plan)).toBe(1);
    expect(nextWorkoutIndex({ workouts: [], nextWorkoutIndex: 3 })).toBe(0);
  });
});
