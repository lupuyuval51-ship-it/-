import { isolate } from '@/i18n/format';
import { intlLocale, type Locale } from '@/i18n/types';
import { monthKey } from './logic';

/** 'YYYY-MM' → "November 2026" / "נובמבר 2026" (bidi-isolated). Empty for invalid input. */
export function formatMonth(month: string, locale: Locale): string {
  const key = monthKey(month);
  if (!key) return '';
  const date = new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1);
  return isolate(new Intl.DateTimeFormat(intlLocale(locale), { month: 'long', year: 'numeric' }).format(date));
}
