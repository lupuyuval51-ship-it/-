import { describe, expect, it } from 'vitest';
import type { Locale } from '@shared/constants';
import { kgToLb } from '@shared/training';
import { translate } from '../../i18n';
import { notificationMessage } from '../gamification/notificationText';
import { durationText, insightMessage, recordValueText, relativeTimeText, signedWeightText, type Fmt } from './format';

function fmtFor(locale: Locale, imperial = false): Fmt & { formatDate: (d: string | Date, o?: Intl.DateTimeFormatOptions) => string } {
  const intlLocale = locale === 'he' ? 'he-IL' : 'en-US';
  return {
    tx: (key, params, fallback) => translate(locale, key, params) ?? fallback ?? key,
    lt: (text) => (text ? (locale === 'he' ? text.he || text.en : text.en || text.he) : ''),
    formatNumber: (n, opts) => new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 1, ...opts }).format(n),
    intlLocale,
    toDisplay: (kg) => (kg == null ? null : imperial ? kgToLb(kg) : Math.round(kg * 100) / 100),
    weightUnit: imperial ? 'lb' : 'kg',
    formatDate: (d, o) => new Intl.DateTimeFormat(intlLocale, { day: 'numeric', month: 'short', timeZone: 'UTC', ...o }).format(new Date(d)),
  };
}

const en = fmtFor('en');
const he = fmtFor('he');

describe('insight rendering', () => {
  it('localizes exercise names, converts weights and keeps plural counts', () => {
    const insight = {
      code: 'strength_gain',
      tone: 'positive' as const,
      params: { exerciseEn: 'Barbell bench press', exerciseHe: 'לחיצת חזה במוט', fromKg: 105, toKg: 116.7, percent: 11.1 },
    };
    expect(insightMessage(insight, en)).toBe('Your estimated 1RM on Barbell bench press went from 105 kg to 116.7 kg (+11.1%).');
    expect(insightMessage(insight, fmtFor('en', true))).toContain('from 231.5 lb to 257.3 lb');
    expect(insightMessage(insight, he)).toContain('לחיצת חזה במוט');
    expect(insightMessage({ code: 'weekly_goal_streak', tone: 'positive', params: { count: 2 } }, he)).toBe('שבועיים ברציפות ביעד השבועי — כל הכבוד!');
    expect(insightMessage({ code: 'rest_needed', tone: 'attention', params: { count: 7 } }, en)).toMatch(/^You've trained 7 days in a row/);
  });

  it('signs weight changes and formats large numbers', () => {
    const trend = { code: 'body_weight_trend', tone: 'neutral' as const, params: { changeKg: -1.5, fromKg: 80, toKg: 78.5, count: 24 } };
    expect(insightMessage(trend, en)).toBe('Body weight changed by -1.5 kg over 24 days (80 kg → 78.5 kg).');
    expect(insightMessage({ ...trend, params: { ...trend.params, changeKg: 0.6 } }, en)).toContain('+0.6 kg');
    expect(signedWeightText(-1.5, he)).toBe('‎-1.5 kg');
    const calories = { code: 'calories_low', tone: 'attention' as const, params: { avgKcal: 1500, targetKcal: 3030, count: 3 } };
    expect(insightMessage(calories, en)).toContain('averaged 1,500 kcal over your last 3 logged days');
  });

  it('uses the zero form and skips unknown codes', () => {
    expect(insightMessage({ code: 'workouts_down', tone: 'neutral', params: { count: 0, previous: 3, period: 30 } }, en)).toMatch(/^No workouts in the last 30 days/);
    expect(insightMessage({ code: 'from_the_future', tone: 'neutral', params: {} }, en)).toBe('');
    expect(insightMessage({ code: 'not_enough_data', tone: 'neutral', params: {} }, he)).toBeTruthy();
  });
});

describe('records, durations and relative times', () => {
  it('formats record values by type', () => {
    expect(recordValueText('est_1rm', 116.7, en)).toBe('116.7 kg');
    expect(recordValueText('max_volume', 600, fmtFor('en', true))).toBe('1,322.8 lb');
    expect(recordValueText('max_reps', 1, en)).toBe('1 rep');
    expect(recordValueText('max_reps', 12, he)).toBe('12 חזרות');
    expect(recordValueText('max_duration', 75, en)).toBe('1:15');
  });

  it('formats durations', () => {
    expect(durationText(2700, en)).toBe('45 min');
    expect(durationText(8400, en)).toBe('2 h 20 min');
    expect(durationText(0, he)).toBe('0 דק׳');
  });

  it('formats relative times', () => {
    const now = Date.parse('2026-10-09T12:00:00Z');
    expect(relativeTimeText('2026-10-09T11:59:30Z', now, en)).toBe('Just now');
    expect(relativeTimeText('2026-10-09T11:55:00Z', now, en)).toBe('5 minutes ago');
    expect(relativeTimeText('2026-10-09T09:00:00Z', now, en)).toBe('3 hours ago');
    expect(relativeTimeText('2026-10-08T10:00:00Z', now, en)).toBe('yesterday');
    expect(relativeTimeText('2026-09-01T10:00:00Z', now, en)).toBe('Sep 1, 2026');
  });
});

describe('notification rendering', () => {
  it('renders every kind from its structured data', () => {
    expect(notificationMessage({ kind: 'achievement', data: { achievementId: 'first_workout' } }, en)).toBe('Achievement unlocked: First workout');
    expect(notificationMessage({ kind: 'achievement', data: { achievementId: 'first_workout' } }, he)).toBe('הישג חדש נפתח: אימון ראשון');
    expect(notificationMessage({ kind: 'level_up', data: { level: 3, from: 2 } }, en)).toBe('Level up! You reached level 3.');
    expect(
      notificationMessage(
        {
          kind: 'personal_record',
          data: { exerciseId: 'barbell_back_squat', exerciseName: { en: 'Back squat', he: 'סקוואט' }, recordType: 'max_weight', value: 120, previousValue: 110 },
        },
        en,
      ),
    ).toBe('New personal record on Back squat — Heaviest weight: 120 kg (previous 110 kg)');
    expect(notificationMessage({ kind: 'personal_record', data: { exerciseId: 'plank', recordType: 'max_duration', value: 90, previousValue: null } }, en)).toBe(
      'New personal record on plank — Longest hold: 1:30',
    );
    expect(notificationMessage({ kind: 'weekly_goal', data: { weekStart: '2026-10-05', goal: 3, completed: 3 } }, en)).toBe(
      'Weekly goal reached: 3 of 3 workouts this week.',
    );
    expect(notificationMessage({ kind: 'info', data: {} }, en)).toBe('Update from LUPU-FIT');
  });

  it('survives malformed data', () => {
    expect(notificationMessage({ kind: 'achievement', data: {} }, en)).toBe('Achievement unlocked: ');
    expect(notificationMessage({ kind: 'personal_record', data: { value: 'oops' } }, en)).toContain('New personal record');
  });
});
