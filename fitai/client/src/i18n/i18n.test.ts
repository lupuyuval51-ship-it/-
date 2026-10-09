import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_LEVELS, ALLERGENS, DIET_TYPES, DIETARY_RESTRICTIONS, DIFFICULTIES, EQUIPMENT, EXERCISE_CATEGORIES,
  EXPERIENCE_LEVELS, FOOD_CATEGORIES, GOALS, INJURY_AREAS, LOCATIONS, MEAL_TYPES, MOVEMENT_PATTERNS, MUSCLE_GROUPS,
  MUSCLES, OCCUPATION_ACTIVITY, PLAN_STATUSES, PR_TYPES, SESSION_STATUSES, SEXES, SPLIT_TYPES, STRESS_LEVELS, THEMES,
  TRACKING_TYPES, UNITS,
} from '@shared/constants';
import { ACHIEVEMENTS } from '@shared/gamification';
import { translate } from './index';
import { en } from './locales/en';
import { he } from './locales/he';

function keys(obj: unknown, prefix = ''): string[] {
  if (typeof obj === 'string') return [prefix];
  if (obj && typeof obj === 'object' && 'other' in obj) return [prefix]; // plural forms differ per language
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe('i18n dictionaries', () => {
  it('Hebrew and English have identical keys', () => {
    expect(keys(he).sort()).toEqual(keys(en).sort());
  });

  it('no empty translations', () => {
    for (const k of keys(he)) expect(translate('he', k, { count: 5 }), k).toBeTruthy();
    for (const k of keys(en)) expect(translate('en', k, { count: 5 }), k).toBeTruthy();
  });

  it('labels every shared enum value', () => {
    const groups: [string, readonly string[]][] = [
      ['sex', SEXES], ['goal', GOALS], ['experience', EXPERIENCE_LEVELS], ['difficulty', DIFFICULTIES], ['location', LOCATIONS],
      ['equipment', EQUIPMENT], ['muscle', MUSCLES], ['muscleGroup', MUSCLE_GROUPS], ['category', EXERCISE_CATEGORIES],
      ['movementPattern', MOVEMENT_PATTERNS], ['injury', INJURY_AREAS], ['trackingType', TRACKING_TYPES], ['activity', ACTIVITY_LEVELS],
      ['occupation', OCCUPATION_ACTIVITY], ['stress', STRESS_LEVELS], ['diet', DIET_TYPES], ['allergen', ALLERGENS],
      ['restriction', DIETARY_RESTRICTIONS], ['foodCategory', FOOD_CATEGORIES], ['mealType', MEAL_TYPES], ['theme', THEMES],
      ['units', UNITS], ['planStatus', PLAN_STATUSES], ['splitType', SPLIT_TYPES], ['sessionStatus', SESSION_STATUSES], ['prType', PR_TYPES],
    ];
    for (const [group, values] of groups) {
      for (const v of values) {
        expect(translate('en', `enums.${group}.${v}`), `en enums.${group}.${v}`).toBeTruthy();
        expect(translate('he', `enums.${group}.${v}`), `he enums.${group}.${v}`).toBeTruthy();
      }
    }
  });

  it('interpolates params and selects plural forms', () => {
    expect(translate('en', 'common.time.days', { count: 1 })).toBe('1 day');
    expect(translate('en', 'common.time.days', { count: 3 })).toBe('3 days');
    expect(translate('he', 'common.time.days', { count: 2 })).toBe('יומיים');
    expect(translate('he', 'common.time.days', { count: 5 })).toBe('5 ימים');
    expect(translate('en', 'does.not.exist')).toBeUndefined();
  });

  it('has achievement copy for every achievement when the achievements dictionary is filled in', () => {
    const dict = en.achievements as Record<string, unknown>;
    if (Object.keys(dict).length <= 1) return; // still the stub
    for (const a of ACHIEVEMENTS) {
      expect(translate('en', `achievements.${a.id}.title`), a.id).toBeTruthy();
      expect(translate('he', `achievements.${a.id}.title`), a.id).toBeTruthy();
    }
  });
});
