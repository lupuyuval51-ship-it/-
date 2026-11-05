import { stripBidi } from '@/i18n/format';
import { translate, type TranslationKey } from '@/i18n/translate';
import type { TranslateVars } from '@/i18n/types';
import { makeAppError } from '@/lib/errors';
import { STALE_ERROR_CODE } from '../logic';
import { actionErrorText, generationErrorText, isLimitError, provenanceMixText, relativeLabel, usageText } from '../text';

const tFor = (locale: 'he' | 'en') => (key: TranslationKey, vars?: TranslateVars) => stripBidi(translate(locale, key, vars));
const en = tFor('en');
const he = tFor('he');

describe('provenanceMixText', () => {
  it('joins non-zero counts with plural forms', () => {
    expect(provenanceMixText(en, { ai_estimate: 3, assumption: 2, user_provided: 1, verified: 0 })).toBe('3 estimates · 2 assumptions · 1 from you');
    expect(provenanceMixText(he, { ai_estimate: 1, assumption: 2, user_provided: 0, verified: 5 })).toBe('הערכה אחת · שתי הנחות · 5 פרטים מאומתים');
    expect(provenanceMixText(en, { ai_estimate: 0, assumption: 0, user_provided: 0, verified: 0 })).toBe('');
  });
});

describe('relativeLabel', () => {
  const now = Date.parse('2026-11-05T12:00:00Z');
  it('uses relative words within a week and a date beyond', () => {
    expect(relativeLabel(en, 'en', new Date(now - 5 * 60_000).toISOString(), now)).toBe('5 minutes ago');
    expect(relativeLabel(he, 'he', new Date(now - 2 * 3_600_000).toISOString(), now)).toBe('לפני שעתיים');
    expect(relativeLabel(en, 'en', new Date(now - 86_400_000).toISOString(), now)).toBe('yesterday');
    expect(stripBidi(relativeLabel(en, 'en', '2026-09-01T10:00:00Z', now))).toMatch(/2026/);
  });
});

describe('generationErrorText', () => {
  it('explains not_configured honestly and maps limits and staleness', () => {
    expect(generationErrorText(en, 'not_configured')).toMatch(/hasn’t been configured on the server/);
    expect(generationErrorText(en, makeAppError('not_configured'))).toMatch(/configured on the server/);
    expect(generationErrorText(en, 'quota_exceeded')).toMatch(/plan generations/);
    expect(generationErrorText(en, STALE_ERROR_CODE)).toMatch(/longer than usual/);
    expect(generationErrorText(en, 'ai_invalid_output')).toBe(en('plan.failed.generic'));
    expect(generationErrorText(en, makeAppError('network'))).toBe(en('errors.network'));
  });

  it('flags monthly limits', () => {
    expect(isLimitError('quota_exceeded')).toBe(true);
    expect(isLimitError('cost_cap_reached')).toBe(true);
    expect(isLimitError('internal')).toBe(false);
    expect(isLimitError(null)).toBe(false);
  });
});

describe('actionErrorText', () => {
  it('uses plan-specific copy where it helps', () => {
    expect(actionErrorText(en, makeAppError('not_configured'), 'regenerate')).toBe(en('plan.errors.aiNotConfigured'));
    expect(actionErrorText(en, makeAppError('quota_exceeded'), 'regenerate')).toBe(en('plan.errors.sectionQuota'));
    expect(actionErrorText(en, makeAppError('plan_version_immutable'), 'save')).toBe(en('errors.planVersionImmutable'));
  });
});

describe('usageText', () => {
  it('shows remaining uses or the renewal note', () => {
    expect(usageText(en, { limit: 2, used: 1, left: 1 }, 'plan')).toBe('1 of 2 plan generations left this month');
    expect(usageText(en, { limit: 10, used: 10, left: 0 }, 'section')).toMatch(/used all 10 section rewrites/);
    expect(usageText(he, { limit: 2, used: 1, left: 1 }, 'plan')).toBe('יצירות תוכנית שנותרו החודש: 1 מתוך 2');
    expect(usageText(en, null, 'plan')).toBeNull();
  });
});
