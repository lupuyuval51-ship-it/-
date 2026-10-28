import { describe, expect, it } from 'vitest';
import { customTargetsIssues } from '@shared/schemas/profile';
import type { ProfileDTO } from '@shared/types';
import { translate } from '../../i18n';
import {
  DEFAULT_DRAFT,
  ONBOARDING_STEPS,
  changedFields,
  draftFromProfile,
  firstInvalidField,
  stepOfField,
  toPayload,
  validateOnboarding,
  validateStep,
  withDaysPerWeek,
  withLocation,
  type ProfileDraft,
} from './draft';
import { cmToFeetInches, displayToKg, feetInchesToCm, formatHeight, kgToDisplay } from './units';
import { localizeIssues } from './validation';

const i18n = {
  t: (key: string, params?: Record<string, string | number | null | undefined>) => translate('en', key, params) ?? key,
  tx: (key: string, params?: Record<string, string | number | null | undefined>, fallback?: string) => translate('en', key, params) ?? fallback ?? key,
  formatNumber: (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(n),
} as unknown as Parameters<typeof localizeIssues>[1];

const COMPLETE: ProfileDraft = {
  ...DEFAULT_DRAFT,
  ageYears: 29,
  sex: 'female',
  heightCm: 165,
  weightKg: 60,
  experienceLevel: 'beginner',
  goal: 'general_fitness',
  trainingLocation: 'home',
  equipment: ['dumbbells'],
  dietType: 'vegetarian',
  activityLevel: 'light',
  occupationActivity: 'desk',
};

describe('unit conversions', () => {
  it('converts centimetres to feet and inches without producing 12″', () => {
    expect(cmToFeetInches(180)).toEqual({ ft: 5, in: 11 });
    expect(cmToFeetInches(182.8)).toEqual({ ft: 6, in: 0 });
    expect(cmToFeetInches(152.4)).toEqual({ ft: 5, in: 0 });
  });

  it('converts feet and inches back to centimetres (0.1 cm)', () => {
    expect(feetInchesToCm(5, 11)).toBe(180.3);
    expect(feetInchesToCm(6, null)).toBe(182.9);
    expect(feetInchesToCm(null, 4)).toBeNull();
    // Round trip keeps the same feet/inches.
    for (let inches = 47; inches <= 90; inches++) {
      const cm = feetInchesToCm(Math.floor(inches / 12), inches % 12)!;
      expect(cmToFeetInches(cm)).toEqual({ ft: Math.floor(inches / 12), in: inches % 12 });
    }
  });

  it('converts weights for display and input', () => {
    expect(kgToDisplay(80, false)).toBe(80);
    expect(kgToDisplay(80, true)).toBe(176.4);
    expect(kgToDisplay(null, true)).toBeNull();
    expect(displayToKg(150, true)).toBeCloseTo(68.04, 2);
    expect(displayToKg(70, false)).toBe(70);
    expect(displayToKg(null, false)).toBeNull();
    // Typed pounds survive the kg round trip at 0.1 lb precision.
    for (const lb of [99.5, 150, 150.3, 220.7]) expect(kgToDisplay(displayToKg(lb, true), true)).toBe(lb);
  });

  it('formats heights in the user’s units', () => {
    expect(formatHeight(180, false, 'cm')).toBe('180 cm');
    expect(formatHeight(180, true, 'cm')).toBe('5′11″');
    expect(formatHeight(null, true, 'cm')).toBe('—');
  });
});

describe('onboarding step validation', () => {
  it('reports missing required answers per step', () => {
    const issues = validateStep(0, DEFAULT_DRAFT);
    expect(Object.keys(issues).sort()).toEqual(['ageYears', 'heightCm', 'sex', 'weightKg']);
    const errors = localizeIssues(issues, i18n, false);
    expect(errors.ageYears).toBe('Required');
    expect(errors.sex).toBe('Required');
  });

  it('explains out-of-range values with both bounds in the user’s units', () => {
    const young = localizeIssues(validateStep(0, { ...COMPLETE, ageYears: 12 }), i18n, false);
    expect(young.ageYears).toBe('You must be at least 13 years old');
    const tall = localizeIssues(validateStep(0, { ...COMPLETE, heightCm: 250 }), i18n, false);
    expect(tall.heightCm).toBe('Enter a value between 120 cm and 230 cm');
    const heavy = localizeIssues(validateStep(0, { ...COMPLETE, weightKg: 400 }), i18n, true);
    expect(heavy.weightKg).toBe('Enter a value between 66.1 lb and 661.4 lb');
    const fraction = localizeIssues(validateStep(3, { ...COMPLETE, sessionMinutes: 45.5 }), i18n, false);
    expect(fraction.sessionMinutes).toBe('Enter a whole number');
  });

  it('accepts complete steps and optional fields left empty', () => {
    for (let i = 0; i < ONBOARDING_STEPS.length; i++) expect(validateStep(i, COMPLETE), ONBOARDING_STEPS[i]!.id).toEqual({});
    expect(validateStep(1, { ...COMPLETE, ability: { ...COMPLETE.ability, pushUpsMax: 500 } })).toHaveProperty(['ability.pushUpsMax']);
  });

  it('validates the whole questionnaire and points at the first failing step', () => {
    const ok = validateOnboarding(COMPLETE);
    expect(ok.ok).toBe(true);
    const bad = validateOnboarding({ ...COMPLETE, dietType: null, goal: null });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(ONBOARDING_STEPS[bad.step]!.id).toBe('goal');
  });

  it('maps fields to steps and finds the first invalid field in display order', () => {
    expect(ONBOARDING_STEPS[stepOfField('ability.squat1rmKg')]!.id).toBe('experience');
    expect(ONBOARDING_STEPS[stepOfField('mealsPerDay')]!.id).toBe('nutrition');
    const issues = { weightKg: { code: 'x', message: '' }, ageYears: { code: 'x', message: '' } };
    expect(firstInvalidField(ONBOARDING_STEPS[0]!.fields, issues)).toBe('ageYears');
  });

  it('rounds payload values like the server stores them', () => {
    const payload = toPayload({ ...COMPLETE, weightKg: 68.04, heightCm: 180.34, ability: { ...COMPLETE.ability, squat1rmKg: 102.06 } });
    expect(payload).toMatchObject({ weightKg: 68, heightCm: 180.3, ability: { squat1rmKg: 102 } });
  });
});

describe('draft helpers', () => {
  it('pre-fills equipment when the location changes', () => {
    const gym = withLocation({ trainingLocation: null, equipment: [] }, 'gym');
    expect(gym.equipment).toContain('barbell');
    expect(withLocation(gym, 'outdoor').equipment).toEqual(['pull_up_bar', 'dip_bars']);
    const custom = { trainingLocation: 'home' as const, equipment: ['kettlebell' as const] };
    expect(withLocation(custom, 'home')).toBe(custom);
  });

  it('lets the weekly goal follow days per week until it is set explicitly', () => {
    expect(withDaysPerWeek({ daysPerWeek: 3, weeklyWorkoutGoal: 3 }, 5, false)).toEqual({ daysPerWeek: 5, weeklyWorkoutGoal: 5 });
    expect(withDaysPerWeek({ daysPerWeek: 3, weeklyWorkoutGoal: 2 }, 5, true)).toEqual({ daysPerWeek: 5, weeklyWorkoutGoal: 2 });
  });

  it('builds a draft from a stored profile using the current age', () => {
    const profile = {
      ...COMPLETE,
      ageYears: 30,
      currentAge: 32,
      isMinor: false,
      ability: COMPLETE.ability,
      daysPerWeek: 4,
      weeklyWorkoutGoal: null,
      targets: null,
      reminders: { enabled: false, workoutDays: [], workoutTime: '18:00', mealLogging: false, mealTimes: [] },
      onboardingCompletedAt: null,
      updatedAt: null,
    } as unknown as ProfileDTO;
    const draft = draftFromProfile(profile);
    expect(draft.ageYears).toBe(32);
    expect(draft.weeklyWorkoutGoal).toBe(4);
    expect(draft.equipment).not.toBe(profile.equipment);
  });

  it('diffs only changed fields', () => {
    expect(changedFields({ a: 1, b: [1, 2], c: 'x' }, { a: 1, b: [1, 3], c: 'x' })).toEqual({ b: [1, 2] });
  });
});

describe('custom target checks (live hints)', () => {
  it('matches the server rules', () => {
    expect(customTargetsIssues({ calories: 1500, proteinG: 120, carbsG: 150, fatG: 50 }, { minimumCalories: 1780, weightKg: 80 })[0]?.code).toBe('calories_below_safe_minimum');
  });
});
