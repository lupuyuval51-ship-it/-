/**
 * Pure presentation helpers for progress data (insights, records, durations, relative
 * times). They receive the i18n/unit functions explicitly so they can be unit-tested
 * without React; `useFmt()` wires them to the current language and units.
 */
import { useMemo } from 'react';
import type { LocalizedText } from '@shared/content';
import type { PrType } from '@shared/constants';
import { formatClock } from '@shared/training';
import type { InsightDTO } from '@shared/types';
import { useUnits } from '../../hooks/useUnits';
import { useI18n, type I18nValue, type TParams } from '../../i18n';

export interface Fmt {
  tx: I18nValue['tx'];
  lt: (text: LocalizedText | null | undefined) => string;
  formatNumber: I18nValue['formatNumber'];
  intlLocale: string;
  /** kg → display units (kg or lb). */
  toDisplay: (kg: number | null | undefined) => number | null;
  weightUnit: string;
}

export function useFmt(): Fmt {
  const { tx, lt, formatNumber, intlLocale } = useI18n();
  const { toDisplay, weightUnit } = useUnits();
  return useMemo(() => ({ tx, lt, formatNumber, intlLocale, toDisplay, weightUnit }), [tx, lt, formatNumber, intlLocale, toDisplay, weightUnit]);
}

export function weightText(kg: number, f: Fmt): string {
  return `${f.formatNumber(f.toDisplay(kg) ?? 0)} ${f.weightUnit}`;
}

/** Weight change with an explicit sign ("+0.6 kg", "-1.5 kg"); Intl adds bidi marks for Hebrew. */
export function signedWeightText(kg: number, f: Fmt): string {
  return `${f.formatNumber(f.toDisplay(kg) ?? 0, { signDisplay: 'exceptZero' })} ${f.weightUnit}`;
}

export function durationText(seconds: number, f: Fmt): string {
  const total = Math.max(0, Math.round(seconds / 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? f.tx('progress.duration.hoursMinutes', { h, m }) : f.tx('progress.duration.minutes', { m });
}

/** A personal-record value in the right unit for its type. */
export function recordValueText(recordType: PrType | string, value: number, f: Fmt): string {
  switch (recordType) {
    case 'max_reps':
      return f.tx('progress.recordValue.reps', { count: value });
    case 'max_duration':
      return formatClock(value);
    default:
      return weightText(value, f);
  }
}

/**
 * Renders an insight from its code and params (see InsightDTO for the conventions):
 * `<x>En`/`<x>He` → localized `{x}`, `<x>Kg` → `{x}` in the user's units (`changeKg` signed),
 * `count` stays numeric for plural selection. Unknown codes render as an empty string.
 */
export function insightMessage(insight: InsightDTO, f: Fmt): string {
  const params: TParams = {};
  const raw = insight.params;
  for (const [key, value] of Object.entries(raw)) {
    if (key.endsWith('He') && `${key.slice(0, -2)}En` in raw) continue;
    if (key.endsWith('En') && `${key.slice(0, -2)}He` in raw) {
      const base = key.slice(0, -2);
      params[base] = f.lt({ en: String(value), he: String(raw[`${base}He`]) });
    } else if (key.endsWith('Kg') && typeof value === 'number') {
      const base = key.slice(0, -2);
      params[base] = base === 'change' ? signedWeightText(value, f) : weightText(value, f);
    } else if (key === 'count' || typeof value !== 'number') {
      params[key] = value;
    } else {
      params[key] = f.formatNumber(value);
    }
  }
  return f.tx(`progress.insights.${insight.code}`, params, '');
}

/** "Just now", "5 minutes ago", "yesterday", or a date for anything older than a week. */
export function relativeTimeText(iso: string, nowMs: number, f: Fmt & { formatDate: I18nValue['formatDate'] }): string {
  const diffSec = Math.round((Date.parse(iso) - nowMs) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return f.tx('notifications.relative.justNow');
  const rtf = new Intl.RelativeTimeFormat(f.intlLocale, { numeric: 'auto' });
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86_400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 7 * 86_400) return rtf.format(Math.round(diffSec / 86_400), 'day');
  return f.formatDate(iso, { day: 'numeric', month: 'short', year: 'numeric' });
}
