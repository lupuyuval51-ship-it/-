import { ONBOARDING_KEYS, type OnboardingAnswers } from '@domain/onboarding';
import { stripBidi } from '@/i18n/format';
import { translate } from '@/i18n/translate';
import type { Locale } from '@/i18n/types';
import { COUNTRIES } from '../countries';
import {
  answerStatus,
  budgetCurrencyOptions,
  canCreateBusiness,
  countryName,
  firstUnansweredStep,
  isSkippable,
  nextStep,
  normalizeSearchText,
  previousStep,
  resolveBusinessName,
  resolveStartMode,
  responsesToAnswers,
  searchCountries,
  sortedCountries,
  stepProgress,
  suggestCurrency,
  summarizeAnswers,
  truncateText,
  withAnswer,
  type OnboardingResponseRow,
} from '../logic';

const ctx = (locale: Locale) => ({ locale, t: (key: Parameters<typeof translate>[1], vars?: Parameters<typeof translate>[2]) => translate(locale, key, vars) });

describe('steps', () => {
  it('walks the 8 questions in ONBOARDING_KEYS order, then review', () => {
    expect(nextStep('business_idea')).toBe('country');
    expect(nextStep('weekly_hours')).toBe('launch_timeline');
    expect(nextStep('launch_timeline')).toBe('review');
    expect(nextStep('review')).toBe('review');
    expect(previousStep('business_idea')).toBeNull();
    expect(previousStep('country')).toBe('business_idea');
    expect(previousStep('review')).toBe('launch_timeline');
  });

  it('only the idea step and the review cannot be skipped', () => {
    expect(isSkippable('business_idea')).toBe(false);
    expect(isSkippable('review')).toBe(false);
    for (const key of ONBOARDING_KEYS.slice(1)) expect(isSkippable(key)).toBe(true);
  });

  it('reports "step N of 8" and a progress fraction that is never empty and full only on review', () => {
    expect(stepProgress('business_idea')).toMatchObject({ current: 1, total: 8, isReview: false });
    expect(stepProgress('starting_budget').current).toBe(3);
    expect(stepProgress('business_idea').fraction).toBeGreaterThan(0);
    expect(stepProgress('launch_timeline').fraction).toBeLessThan(1);
    expect(stepProgress('review')).toMatchObject({ fraction: 1, isReview: true });
    const fractions = ONBOARDING_KEYS.map((k) => stepProgress(k).fraction);
    expect([...fractions].sort((a, b) => a - b)).toEqual(fractions);
  });
});

describe('responsesToAnswers / resume', () => {
  const rows: OnboardingResponseRow[] = [
    { question_key: 'business_idea', value: { idea: 'Sourdough bakery', name: 'Crumb' }, skipped: false },
    { question_key: 'country', value: null, skipped: true },
    { question_key: 'starting_budget', value: { amount_minor: 500000, currency: 'ILS' }, skipped: false },
    { question_key: 'experience', value: { level: 'astronaut' }, skipped: false }, // invalid → unanswered
    { question_key: 'nonsense', value: { x: 1 }, skipped: false },
  ];

  it('parses valid rows, keeps skips, drops invalid values and unknown keys', () => {
    const answers = responsesToAnswers(rows);
    expect(answerStatus(answers, 'business_idea')).toBe('answered');
    expect(answerStatus(answers, 'country')).toBe('skipped');
    expect(answerStatus(answers, 'starting_budget')).toBe('answered');
    expect(answerStatus(answers, 'experience')).toBe('unanswered');
    expect(Object.keys(answers)).not.toContain('nonsense');
    expect(responsesToAnswers(null)).toEqual({});
  });

  it('starts at the first question that is neither answered nor skipped', () => {
    expect(firstUnansweredStep({})).toBe('business_idea');
    expect(firstUnansweredStep(responsesToAnswers(rows))).toBe('experience');
    let all: OnboardingAnswers = {};
    for (const key of ONBOARDING_KEYS) all = withAnswer(all, key, null);
    expect(firstUnansweredStep(all)).toBe('review');
  });

  it('resolveStartMode: new=1 is always fresh; incomplete active business resumes', () => {
    const incomplete = { id: 'b1', onboarding_completed_at: null };
    const complete = { id: 'b2', onboarding_completed_at: '2026-11-05T10:00:00Z' };
    expect(resolveStartMode({ isNew: true, activeBusiness: incomplete })).toEqual({ kind: 'fresh' });
    expect(resolveStartMode({ isNew: false, activeBusiness: incomplete })).toEqual({ kind: 'resume', businessId: 'b1' });
    expect(resolveStartMode({ isNew: false, activeBusiness: complete })).toEqual({ kind: 'fresh' });
    expect(resolveStartMode({ isNew: false, activeBusiness: null })).toEqual({ kind: 'fresh' });
    expect(resolveStartMode({ isNew: false, activeBusiness: { ...incomplete, archived_at: '2026-11-01T00:00:00Z' } })).toEqual({
      kind: 'fresh',
    });
  });
});

describe('business rules', () => {
  it('canCreateBusiness compares the active count with the tier limit', () => {
    expect(canCreateBusiness(0, 1)).toBe(true);
    expect(canCreateBusiness(1, 1)).toBe(false);
    expect(canCreateBusiness(3, 10)).toBe(true);
  });

  it('resolveBusinessName prefers the working name, then keeps or defaults sensibly', () => {
    expect(resolveBusinessName({ workingName: '  Crumb  ', defaultName: 'העסק שלי' })).toBe('Crumb');
    expect(resolveBusinessName({ workingName: '', defaultName: 'העסק שלי' })).toBe('העסק שלי');
    expect(resolveBusinessName({ workingName: undefined, defaultName: 'My business', currentName: 'Renamed' })).toBe('Renamed');
    expect(
      resolveBusinessName({ workingName: '', defaultName: 'My business', currentName: 'Crumb', previousWorkingName: 'Crumb' }),
    ).toBe('My business');
    expect(resolveBusinessName({ workingName: 'x'.repeat(200), defaultName: 'd' })).toHaveLength(120);
  });
});

describe('countries & currencies', () => {
  it('has a curated list with unique ISO codes and names in both languages', () => {
    expect(COUNTRIES.length).toBeGreaterThanOrEqual(60);
    const codes = COUNTRIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const c of COUNTRIES) {
      expect(c.code).toMatch(/^[A-Z]{2}$/);
      expect(c.currency).toMatch(/^[A-Z]{3}$/);
      expect(c.he).toMatch(/[֐-׿]/);
      expect(c.en).toMatch(/[A-Za-z]/);
    }
    for (const code of ['IL', 'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'BR', 'ZA', 'PE']) expect(codes).toContain(code);
  });

  it('puts Israel first in Hebrew and sorts English alphabetically', () => {
    expect(sortedCountries('he')[0]?.code).toBe('IL');
    const en = sortedCountries('en').map((c) => c.en);
    expect(en[0]).toBe('Argentina');
    expect(en).toEqual([...en].sort((a, b) => a.localeCompare(b, 'en')));
  });

  it('normalizes case, Latin diacritics, niqqud, final letters and geresh', () => {
    expect(normalizeSearchText('Türkiye')).toBe('turkiye');
    expect(normalizeSearchText('  MÉXICO ')).toBe('mexico');
    expect(normalizeSearchText('יִשְׂרָאֵל')).toBe('ישראל');
    expect(normalizeSearchText('צ׳כיה')).toBe(normalizeSearchText("צ'כיה"));
    expect(normalizeSearchText('ארה״ב')).toBe('ארהב');
    expect(normalizeSearchText('יפן')).toBe('יפנ');
    expect(normalizeSearchText('U.S.A.')).toBe('usa');
    expect(normalizeSearchText('Costa-Rica')).toBe('costa rica');
  });

  it('searches Hebrew and English names in either UI language', () => {
    expect(searchCountries('ישר', 'he')[0]?.code).toBe('IL');
    expect(searchCountries('isr', 'he')[0]?.code).toBe('IL');
    expect(searchCountries('גרמ', 'en')[0]?.code).toBe('DE');
    expect(searchCountries('turk', 'en')[0]?.code).toBe('TR');
    expect(searchCountries('mexico', 'en')[0]?.code).toBe('MX');
    expect(searchCountries('צכיה', 'he')[0]?.code).toBe('CZ');
    expect(searchCountries('ארץ', 'he').map((c) => c.code)).toContain('US'); // final-letter folding
  });

  it('ranks exact aliases and codes ahead of looser matches', () => {
    expect(searchCountries('uk', 'en')[0]?.code).toBe('GB');
    expect(searchCountries('USA', 'en')[0]?.code).toBe('US');
    expect(searchCountries('ארה"ב', 'he')[0]?.code).toBe('US');
    expect(searchCountries('il', 'en')[0]?.code).toBe('IL');
    expect(searchCountries('dubai', 'he')[0]?.code).toBe('AE');
    expect(searchCountries('kor', 'en')[0]?.code).toBe('KR');
  });

  it('matches word prefixes and returns everything for an empty query', () => {
    expect(searchCountries('zealand', 'en')[0]?.code).toBe('NZ');
    expect(searchCountries('קונג', 'he')[0]?.code).toBe('HK');
    expect(searchCountries('', 'he')).toHaveLength(COUNTRIES.length);
    expect(searchCountries('   ', 'en')[0]?.code).toBe('AR');
    expect(searchCountries('zzzz', 'en')).toEqual([]);
  });

  it('suggests currencies from the domain map first, then the local currency', () => {
    expect(suggestCurrency('IL')).toBe('ILS');
    expect(suggestCurrency('us')).toBe('USD');
    expect(suggestCurrency('PT')).toBe('EUR');
    expect(suggestCurrency('JP')).toBe('JPY');
    expect(suggestCurrency('CH')).toBe('CHF');
    expect(suggestCurrency('XX')).toBeNull();
    expect(suggestCurrency(null)).toBeNull();
  });

  it('offers the business currency first, plus the standard budget currencies', () => {
    expect(budgetCurrencyOptions('ILS')).toEqual(['ILS', 'USD', 'EUR', 'GBP', 'CAD', 'AUD']);
    expect(budgetCurrencyOptions('JPY')).toEqual(['JPY', 'ILS', 'USD', 'EUR', 'GBP', 'CAD', 'AUD']);
    expect(budgetCurrencyOptions('USD', 'chf')).toEqual(['USD', 'ILS', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF']);
    expect(budgetCurrencyOptions(null)).toHaveLength(6);
  });

  it('countryName localizes and falls back to the code', () => {
    expect(countryName('IL', 'he')).toBe('ישראל');
    expect(countryName('IL', 'en')).toBe('Israel');
    expect(countryName('QQ', 'en')).toBe('QQ');
    expect(countryName(null, 'en')).toBeNull();
  });
});

describe('review summaries', () => {
  let answers: OnboardingAnswers = {};
  answers = withAnswer(answers, 'business_idea', { idea: 'A home bakery   selling sourdough', name: 'Crumb' });
  answers = withAnswer(answers, 'country', { code: 'IL' });
  answers = withAnswer(answers, 'starting_budget', { amount_minor: 1_250_000, currency: 'ILS' });
  answers = withAnswer(answers, 'experience', { level: 'industry', details: 'Six years as a baker' });
  answers = withAnswer(answers, 'target_customers', { text: 'x'.repeat(400) });
  answers = withAnswer(answers, 'primary_goal', null);
  answers = withAnswer(answers, 'weekly_hours', { range: 'h10_20' });

  it('summarizes every question in order, with skipped and unanswered states', () => {
    const items = summarizeAnswers(answers, ctx('en'));
    expect(items.map((i) => i.key)).toEqual([...ONBOARDING_KEYS]);
    const byKey = Object.fromEntries(items.map((i) => [i.key, i]));
    expect(byKey.business_idea).toMatchObject({ status: 'answered', primary: 'A home bakery selling sourdough' });
    expect(stripBidi(byKey.business_idea?.secondary ?? '')).toBe('Working name: Crumb');
    expect(byKey.country?.primary).toBe('Israel');
    expect(stripBidi(byKey.starting_budget?.primary ?? '')).toBe('₪12,500');
    expect(byKey.experience).toMatchObject({ primary: 'Professional experience', secondary: 'Six years as a baker' });
    expect(byKey.target_customers?.primary?.length).toBeLessThanOrEqual(140);
    expect(byKey.target_customers?.primary?.endsWith('…')).toBe(true);
    expect(byKey.primary_goal).toMatchObject({ status: 'skipped', primary: null });
    expect(byKey.weekly_hours?.primary).toBe('10–20 hours');
    expect(byKey.launch_timeline).toMatchObject({ status: 'unanswered', primary: null });
  });

  it('uses Hebrew labels and country names in Hebrew', () => {
    const items = summarizeAnswers(answers, ctx('he'));
    const byKey = Object.fromEntries(items.map((i) => [i.key, i]));
    expect(byKey.country?.primary).toBe('ישראל');
    expect(byKey.weekly_hours?.primary).toBe('10 עד 20 שעות');
    expect(byKey.experience?.primary).toBe('ניסיון מקצועי בתחום');
  });

  it('truncateText collapses whitespace and adds an ellipsis only when needed', () => {
    expect(truncateText('  a   b  ', 10)).toBe('a b');
    expect(truncateText('abcdefghij', 5)).toBe('abcd…');
  });
});
