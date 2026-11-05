/**
 * Pure onboarding logic: step resolution, answer parsing, review summaries, country search and
 * currency suggestions. No React, no I/O — unit-tested in ./__tests__/logic.test.ts.
 */
import {
  DEFAULT_CURRENCY_BY_COUNTRY,
  ONBOARDING_KEYS,
  REQUIRED_ONBOARDING_KEYS,
  parseOnboardingValue,
  type OnboardingAnswers,
  type OnboardingKey,
  type OnboardingValue,
} from '@domain/onboarding';
import { formatMoney } from '@/i18n/format';
import type { TranslationKey } from '@/i18n/translate';
import type { Locale, TranslateVars } from '@/i18n/types';
import { COUNTRIES, COUNTRY_BY_CODE, type Country } from './countries';

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

export const REVIEW_STEP = 'review' as const;
export type OnboardingStep = OnboardingKey | typeof REVIEW_STEP;
export const ONBOARDING_STEPS: readonly OnboardingStep[] = [...ONBOARDING_KEYS, REVIEW_STEP];
export const QUESTION_COUNT = ONBOARDING_KEYS.length;

export function isOnboardingKey(value: unknown): value is OnboardingKey {
  return typeof value === 'string' && (ONBOARDING_KEYS as readonly string[]).includes(value);
}

export function stepIndex(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step);
}

export function nextStep(step: OnboardingStep): OnboardingStep {
  const i = stepIndex(step);
  return ONBOARDING_STEPS[Math.min(i + 1, ONBOARDING_STEPS.length - 1)] ?? REVIEW_STEP;
}

/** The step before `step`, or null on the first question. */
export function previousStep(step: OnboardingStep): OnboardingStep | null {
  const i = stepIndex(step);
  return i > 0 ? (ONBOARDING_STEPS[i - 1] ?? null) : null;
}

/** Every question except the required ones can be skipped; the review step cannot. */
export function isSkippable(step: OnboardingStep): boolean {
  return step !== REVIEW_STEP && !REQUIRED_ONBOARDING_KEYS.includes(step);
}

export interface StepProgress {
  /** 1-based question number (QUESTION_COUNT on the review step). */
  current: number;
  total: number;
  /** 0…1 for the thin progress bar — never empty on the first step, full only on review. */
  fraction: number;
  isReview: boolean;
}

export function stepProgress(step: OnboardingStep): StepProgress {
  const total = QUESTION_COUNT;
  if (step === REVIEW_STEP) return { current: total, total, fraction: 1, isReview: true };
  const i = stepIndex(step);
  return { current: i + 1, total, fraction: (i + 1) / (total + 1), isReview: false };
}

/* ------------------------------------------------------------------ */
/* Answers                                                             */
/* ------------------------------------------------------------------ */

/** Shape of an `onboarding_responses` row as read from the database. */
export interface OnboardingResponseRow {
  question_key: string;
  value: unknown;
  skipped: boolean;
}

/**
 * Turns DB rows into typed answers. Unknown keys are ignored; values that no longer match the
 * schema are treated as unanswered (the user simply sees the question again).
 */
export function responsesToAnswers(rows: readonly OnboardingResponseRow[] | null | undefined): OnboardingAnswers {
  const answers: Record<string, { value: unknown; skipped: boolean }> = {};
  for (const row of rows ?? []) {
    if (!isOnboardingKey(row.question_key)) continue;
    if (row.skipped) {
      answers[row.question_key] = { value: null, skipped: true };
      continue;
    }
    const parsed = parseOnboardingValue(row.question_key, row.value);
    if (parsed) answers[row.question_key] = { value: parsed, skipped: false };
  }
  return answers as OnboardingAnswers;
}

export type AnswerStatus = 'answered' | 'skipped' | 'unanswered';

export function answerStatus(answers: OnboardingAnswers, key: OnboardingKey): AnswerStatus {
  const answer = answers[key];
  if (!answer) return 'unanswered';
  if (answer.skipped) return 'skipped';
  return answer.value ? 'answered' : 'unanswered';
}

/** Typed value of an answered question, or null (unanswered or skipped). */
export function answerValue<K extends OnboardingKey>(answers: OnboardingAnswers, key: K): OnboardingValue<K> | null {
  const answer = answers[key] as { value: OnboardingValue<K> | null; skipped: boolean } | undefined;
  if (!answer || answer.skipped) return null;
  return answer.value ?? null;
}

/** Where a resumed onboarding starts: the first question neither answered nor skipped, else review. */
export function firstUnansweredStep(answers: OnboardingAnswers): OnboardingStep {
  return ONBOARDING_KEYS.find((key) => answerStatus(answers, key) === 'unanswered') ?? REVIEW_STEP;
}

/** Returns a copy of `answers` with one question updated (used for optimistic local state). */
export function withAnswer<K extends OnboardingKey>(
  answers: OnboardingAnswers,
  key: K,
  value: OnboardingValue<K> | null,
): OnboardingAnswers {
  return { ...answers, [key]: value === null ? { value: null, skipped: true } : { value, skipped: false } };
}

/* ------------------------------------------------------------------ */
/* Start mode & business rules                                         */
/* ------------------------------------------------------------------ */

export interface BusinessLike {
  id: string;
  onboarding_completed_at: string | null;
  archived_at?: string | null;
}

export type StartMode = { kind: 'fresh' } | { kind: 'resume'; businessId: string };

/**
 * `new=1` always starts a fresh business. Otherwise an active business whose onboarding is not
 * complete is resumed; anything else starts fresh (the screen then applies the business limit).
 */
export function resolveStartMode(input: { isNew: boolean; activeBusiness: BusinessLike | null | undefined }): StartMode {
  const b = input.activeBusiness;
  if (!input.isNew && b && !b.archived_at && b.onboarding_completed_at === null) return { kind: 'resume', businessId: b.id };
  return { kind: 'fresh' };
}

/** True while the account may create another (non-archived) business. */
export function canCreateBusiness(activeBusinessCount: number, maxBusinesses: number): boolean {
  return activeBusinessCount < maxBusinesses;
}

/**
 * Business name to store after the first question:
 * - a non-empty working name always wins;
 * - a new business without one gets the localized default ("העסק שלי");
 * - an existing business keeps its name, unless that name came from a working name the user
 *   has now cleared — then it returns to the default.
 */
export function resolveBusinessName(input: {
  workingName: string | null | undefined;
  defaultName: string;
  currentName?: string | null;
  previousWorkingName?: string | null;
}): string {
  const working = input.workingName?.trim();
  if (working) return working.slice(0, 120);
  const current = input.currentName?.trim();
  if (!current) return input.defaultName;
  const previous = input.previousWorkingName?.trim();
  if (previous && previous === current) return input.defaultName;
  return current;
}

/* ------------------------------------------------------------------ */
/* Countries & currencies                                              */
/* ------------------------------------------------------------------ */

/** Currencies always offered for the starting budget (plus the business currency). */
export const BUDGET_CURRENCIES = ['ILS', 'USD', 'EUR', 'GBP', 'CAD', 'AUD'] as const;

/** Suggested currency for a country: the domain map first, then the curated local currency. */
export function suggestCurrency(countryCode: string | null | undefined): string | null {
  if (!countryCode) return null;
  const code = countryCode.toUpperCase();
  return DEFAULT_CURRENCY_BY_COUNTRY[code] ?? COUNTRY_BY_CODE.get(code)?.currency ?? null;
}

/**
 * Currency choices: the business currency first (it is what the plan and the financial model
 * use), then the standard set, then any `extra` codes (current selection, country suggestion).
 * Invalid codes and duplicates are dropped.
 */
export function budgetCurrencyOptions(businessCurrency: string | null | undefined, ...extra: (string | null | undefined)[]): string[] {
  const out: string[] = [];
  const push = (c: string | null | undefined) => {
    const code = c?.toUpperCase();
    if (code && /^[A-Z]{3}$/.test(code) && !out.includes(code)) out.push(code);
  };
  push(businessCurrency);
  BUDGET_CURRENCIES.forEach(push);
  extra.forEach(push);
  return out;
}

export function countryName(code: string | null | undefined, locale: Locale): string | null {
  if (!code) return null;
  const c = COUNTRY_BY_CODE.get(code.toUpperCase());
  return c ? c[locale] : code.toUpperCase();
}

const FINAL_LETTERS: Record<string, string> = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };

/**
 * Search normalisation: case-, diacritics- and niqqud-insensitive; Hebrew final letters folded;
 * geresh/gershayim/quotes removed ("צ׳כיה" = "צ'כיה" = "צכיה", "ארה״ב" = "ארהב"); dots removed
 * ("U.S." = "us"); other punctuation becomes a space; whitespace collapsed.
 */
export function normalizeSearchText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Latin combining marks
    .replace(/[֑-ׇֽֿׁׂׅׄ]/g, '') // Hebrew cantillation + points
    .toLowerCase()
    .replace(/[ךםןףץ]/g, (ch) => FINAL_LETTERS[ch] ?? ch)
    .replace(/['"`´׳״‘’“”.]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Countries in display order: Israel first in Hebrew, then alphabetical by the localized name. */
export function sortedCountries(locale: Locale, list: readonly Country[] = COUNTRIES): Country[] {
  const sorted = [...list].sort((a, b) => a[locale].localeCompare(b[locale], locale === 'he' ? 'he' : 'en'));
  if (locale === 'he') {
    const il = sorted.findIndex((c) => c.code === 'IL');
    if (il > 0) sorted.unshift(...sorted.splice(il, 1));
  }
  return sorted;
}

function matchScore(term: string, query: string): number | null {
  if (term === query) return 0;
  if (term.startsWith(query)) return 1;
  if (term.split(' ').some((word) => word.startsWith(query))) return 2;
  if (query.length >= 2 && term.includes(query)) return 4;
  return null;
}

/**
 * Searches Hebrew names, English names, aliases and ISO codes in both languages regardless of the
 * UI language. Results are ranked (exact → prefix → word prefix → alias → substring), ties keep the
 * localized display order. An empty query returns the full sorted list.
 */
export function searchCountries(query: string, locale: Locale, list: readonly Country[] = COUNTRIES): Country[] {
  const ordered = sortedCountries(locale, list);
  const q = normalizeSearchText(query);
  if (!q) return ordered;
  const scored: { country: Country; score: number; order: number }[] = [];
  ordered.forEach((country, order) => {
    let best: number | null = null;
    const consider = (score: number | null) => {
      if (score !== null && (best === null || score < best)) best = score;
    };
    const primary = locale === 'he' ? [country.he, country.en] : [country.en, country.he];
    primary.forEach((name, i) => {
      const s = matchScore(normalizeSearchText(name), q);
      // A match in the other language ranks just after the same kind of match in the UI language.
      consider(s === null ? null : s + i * 0.5);
    });
    for (const alias of country.aliases ?? []) {
      const s = matchScore(normalizeSearchText(alias), q);
      // An exact alias ("UK", "USA", "ארה״ב") is as good as a name; partial alias matches rank lower.
      consider(s === null ? null : s === 0 ? 0.75 : s + 2);
    }
    if (q.length === 2 && country.code.toLowerCase() === q) consider(0.25);
    if (best !== null) scored.push({ country, score: best, order });
  });
  scored.sort((a, b) => a.score - b.score || a.order - b.order);
  return scored.map((s) => s.country);
}

/* ------------------------------------------------------------------ */
/* Review summaries                                                    */
/* ------------------------------------------------------------------ */

export type Translate = (key: TranslationKey, vars?: TranslateVars) => string;

export interface ReviewItem {
  key: OnboardingKey;
  status: AnswerStatus;
  /** Main value line (null when skipped / unanswered). */
  primary: string | null;
  /** Optional second line (working name, extra details). */
  secondary: string | null;
}

/** Collapses whitespace and shortens to `max` characters with an ellipsis. */
export function truncateText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

const SUMMARY_MAX = 140;
const DETAIL_MAX = 90;

function optionalDetail(details: string | undefined): string | null {
  const d = details?.trim();
  return d ? truncateText(d, DETAIL_MAX) : null;
}

export function summarizeAnswer(key: OnboardingKey, answers: OnboardingAnswers, ctx: { t: Translate; locale: Locale }): ReviewItem {
  const status = answerStatus(answers, key);
  const empty: ReviewItem = { key, status, primary: null, secondary: null };
  if (status !== 'answered') return empty;
  const { t, locale } = ctx;
  switch (key) {
    case 'business_idea': {
      const v = answerValue(answers, 'business_idea');
      if (!v) return empty;
      const name = v.name?.trim();
      return {
        key,
        status,
        primary: truncateText(v.idea, SUMMARY_MAX),
        secondary: name ? t('onboarding.review.workingName', { name }) : null,
      };
    }
    case 'country': {
      const v = answerValue(answers, 'country');
      return v ? { key, status, primary: countryName(v.code, locale), secondary: null } : empty;
    }
    case 'starting_budget': {
      const v = answerValue(answers, 'starting_budget');
      return v ? { key, status, primary: formatMoney(v.amount_minor, v.currency, locale), secondary: null } : empty;
    }
    case 'experience': {
      const v = answerValue(answers, 'experience');
      return v
        ? { key, status, primary: t(`onboarding.experience.options.${v.level}.label`), secondary: optionalDetail(v.details) }
        : empty;
    }
    case 'target_customers': {
      const v = answerValue(answers, 'target_customers');
      return v ? { key, status, primary: truncateText(v.text, SUMMARY_MAX), secondary: null } : empty;
    }
    case 'primary_goal': {
      const v = answerValue(answers, 'primary_goal');
      return v
        ? { key, status, primary: t(`onboarding.primary_goal.options.${v.goal}.label`), secondary: optionalDetail(v.details) }
        : empty;
    }
    case 'weekly_hours': {
      const v = answerValue(answers, 'weekly_hours');
      return v ? { key, status, primary: t(`onboarding.weekly_hours.options.${v.range}`), secondary: null } : empty;
    }
    case 'launch_timeline': {
      const v = answerValue(answers, 'launch_timeline');
      return v ? { key, status, primary: t(`onboarding.launch_timeline.options.${v.timeline}`), secondary: null } : empty;
    }
  }
}

export function summarizeAnswers(answers: OnboardingAnswers, ctx: { t: Translate; locale: Locale }): ReviewItem[] {
  return ONBOARDING_KEYS.map((key) => summarizeAnswer(key, answers, ctx));
}
