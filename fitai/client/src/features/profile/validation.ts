/**
 * Turns zod field issues into localized, field-specific messages (with ranges in the
 * user's units) for the onboarding wizard and the profile page.
 */
import { kgToLb } from '@shared/training';
import type { I18nValue } from '../../i18n';
import { fieldErrorMessage } from '../../lib/errors';
import type { FieldIssue, FieldIssues } from './draft';
import { cmToFeetInches } from './units';

export type FieldErrors = Partial<Record<string, string>>;

type I18n = Pick<I18nValue, 't' | 'tx' | 'formatNumber'>;

/** Fields whose range is shown in the user's weight unit. */
const WEIGHT_FIELDS = new Set(['weightKg', 'ability.squat1rmKg', 'ability.bench1rmKg', 'ability.deadlift1rmKg']);

function formatBound(path: string, value: number, i18n: I18n, imperial: boolean): string {
  if (WEIGHT_FIELDS.has(path)) {
    return imperial ? `${i18n.formatNumber(kgToLb(value))} ${i18n.t('common.units.lb')}` : `${i18n.formatNumber(value)} ${i18n.t('common.units.kg')}`;
  }
  if (path === 'heightCm') {
    if (!imperial) return `${i18n.formatNumber(value)} ${i18n.t('common.units.cm')}`;
    const { ft, in: inches } = cmToFeetInches(value);
    return `${ft}′${inches}″`;
  }
  return i18n.formatNumber(value);
}

/** Localized message for one field issue. */
export function issueMessage(path: string, issue: FieldIssue, i18n: I18n, imperial: boolean, limits?: { min: number; max: number }): string {
  // Custom codes set in the shared schemas (e.g. age_too_young, invalid_time, required).
  if (issue.code === 'custom' || (issue.message && /^[a-z_]+$/.test(issue.message))) {
    return fieldErrorMessage(issue.message, i18n) ?? i18n.t('errors.fields.invalid');
  }
  if (issue.code === 'invalid_type') {
    if (issue.received === 'null' || issue.received === 'undefined') return i18n.t('errors.fields.required');
    if (issue.expected === 'integer') return i18n.t('onboarding.errors.wholeNumber');
    return i18n.t('errors.fields.invalid');
  }
  if (issue.code === 'invalid_enum_value' || issue.code === 'invalid_literal') return i18n.t('errors.fields.required');
  if (issue.code === 'too_small' || issue.code === 'too_big') {
    const min = limits?.min ?? issue.minimum;
    const max = limits?.max ?? issue.maximum;
    if (min != null && max != null) {
      return i18n.t('onboarding.errors.range', { min: formatBound(path, min, i18n, imperial), max: formatBound(path, max, i18n, imperial) });
    }
    if (issue.code === 'too_small') return i18n.t('errors.fields.too_small');
    return i18n.t('errors.fields.too_big');
  }
  return i18n.t('errors.fields.invalid');
}

/**
 * Known numeric ranges (zod reports only the violated bound; showing both helps users).
 * Kept in sync with `onboardingSchema` / `LIMITS`.
 */
export const FIELD_RANGES: Partial<Record<string, { min: number; max: number }>> = {
  ageYears: { min: 13, max: 100 },
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 30, max: 300 },
  daysPerWeek: { min: 1, max: 7 },
  sessionMinutes: { min: 15, max: 180 },
  weeklyWorkoutGoal: { min: 1, max: 7 },
  sleepHours: { min: 0, max: 24 },
  mealsPerDay: { min: 1, max: 8 },
  'ability.pushUpsMax': { min: 0, max: 200 },
  'ability.pullUpsMax': { min: 0, max: 100 },
  'ability.plankSeconds': { min: 0, max: 3600 },
  'ability.squat1rmKg': { min: 0, max: 500 },
  'ability.bench1rmKg': { min: 0, max: 400 },
  'ability.deadlift1rmKg': { min: 0, max: 500 },
  calories: { min: 1000, max: 6000 },
  proteinG: { min: 20, max: 400 },
  carbsG: { min: 0, max: 900 },
  fatG: { min: 15, max: 300 },
};

export function localizeIssues(issues: FieldIssues, i18n: I18n, imperial: boolean): FieldErrors {
  const out: FieldErrors = {};
  for (const [path, issue] of Object.entries(issues)) {
    if (issue) out[path] = issueMessage(path, issue, i18n, imperial, FIELD_RANGES[path]);
  }
  return out;
}

/** Server `validation_error` details → field errors (paths as reported by the API). */
export function serverFieldErrors(details: unknown, i18n: I18n): FieldErrors {
  const issues = (details as { issues?: { path: string; message: string }[] } | undefined)?.issues ?? [];
  const out: FieldErrors = {};
  for (const issue of issues) {
    if (out[issue.path]) continue;
    out[issue.path] = /^[a-z_]+$/.test(issue.message) ? fieldErrorMessage(issue.message, i18n) : i18n.t('errors.fields.invalid');
  }
  return out;
}

/** Moves keyboard focus to the first control inside the element marked `data-field="<field>"`. */
export function focusField(field: string | null, root: ParentNode = document) {
  if (!field) return;
  const container = root.querySelector(`[data-field="${field}"]`);
  const control = container?.querySelector<HTMLElement>('input:not([type=hidden]), select, textarea, button');
  control?.focus();
}
