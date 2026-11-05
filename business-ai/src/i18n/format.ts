/**
 * Locale-aware formatting. Every formatted value is wrapped in Unicode isolates (FSI…PDI) so it
 * renders correctly inside text of the opposite direction (numbers and currency in Hebrew,
 * Hebrew names in English).
 *
 * Money is always integer minor units with 2 decimal places (agorot / cents), matching
 * `toMinorUnits()` in @domain/plan and the `*_minor` DB columns.
 */
import { FINANCE_LIMITS } from '@domain/finance';
import type { TranslationKey } from './translate';
import { intlLocale, type Locale } from './types';

export const FSI = '\u2068';
export const PDI = '\u2069';
/** Minor units per major unit for every supported currency. */
export const MINOR_PER_MAJOR = 100;

/** Wraps text in First Strong Isolate … Pop Directional Isolate. Idempotent. */
export function isolate(text: string): string {
  if (text.startsWith(FSI) && text.endsWith(PDI)) return text;
  return `${FSI}${text}${PDI}`;
}

/** Removes isolates and bidi marks (for comparisons, clipboard, tests). */
export function stripBidi(text: string): string {
  return text.replace(/[\u2066-\u2069\u200e\u200f\u061c\u202a-\u202e]/g, '');
}

/* ------------------------------------------------------------------ */
/* Numbers & money                                                     */
/* ------------------------------------------------------------------ */

export interface MoneyFormatOptions {
  /** 'auto' (default): no decimals for whole amounts, 2 otherwise. */
  fractionDigits?: 'auto' | 0 | 2;
  /** Show "+" for positive values (deltas). */
  signed?: boolean;
  /** Compact notation (₪12K) for charts and dense summaries. */
  compact?: boolean;
}

function normalizeZero(n: number): number {
  return n === 0 ? 0 : n; // removes -0
}

export function formatMoney(minor: number, currency: string, locale: Locale, opts: MoneyFormatOptions = {}): string {
  const safeMinor = Number.isFinite(minor) ? Math.round(minor) : 0;
  const major = normalizeZero(safeMinor / MINOR_PER_MAJOR);
  const digits = opts.fractionDigits ?? 'auto';
  const fraction = digits === 'auto' ? (safeMinor % MINOR_PER_MAJOR === 0 ? 0 : 2) : digits;
  const base: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: opts.compact ? 0 : fraction,
    maximumFractionDigits: opts.compact ? 1 : fraction,
    signDisplay: opts.signed ? 'exceptZero' : 'auto',
  };
  let text: string;
  try {
    text = new Intl.NumberFormat(intlLocale(locale), opts.compact ? { ...base, notation: 'compact' } : base).format(major);
  } catch {
    try {
      text = new Intl.NumberFormat(intlLocale(locale), base).format(major);
    } catch {
      // Unknown currency code: fall back to "CODE 1,234.50".
      const number = new Intl.NumberFormat(intlLocale(locale), {
        minimumFractionDigits: fraction,
        maximumFractionDigits: fraction,
      }).format(major);
      text = `${currency} ${number}`;
    }
  }
  return isolate(text);
}

export function formatNumber(value: number, locale: Locale, opts?: Intl.NumberFormatOptions): string {
  if (!Number.isFinite(value)) return isolate('—');
  return isolate(new Intl.NumberFormat(intlLocale(locale), opts).format(normalizeZero(value)));
}

export interface PercentFormatOptions {
  /** Decimal places (default: 0 for whole values, otherwise 1). */
  fractionDigits?: number;
  /** `value` is a percentage (12.5 → 12.5%, default) or a ratio (0.125 → 12.5%). */
  input?: 'percent' | 'ratio';
  signed?: boolean;
}

export function formatPercent(value: number, locale: Locale, opts: PercentFormatOptions = {}): string {
  if (!Number.isFinite(value)) return isolate('—');
  const ratio = opts.input === 'ratio' ? value : value / 100;
  const asPercent = ratio * 100;
  const digits = opts.fractionDigits ?? (Number.isInteger(Math.round(asPercent * 1e6) / 1e6) ? 0 : 1);
  return isolate(
    new Intl.NumberFormat(intlLocale(locale), {
      style: 'percent',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      signDisplay: opts.signed ? 'exceptZero' : 'auto',
    }).format(normalizeZero(ratio)),
  );
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses an ISO date ('2026-11-05' → local calendar date, never shifted by time zone) or an
 * ISO timestamp / Date. Returns null when invalid.
 */
export function parseDateInput(input: string | Date): Date | null {
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  const m = ISO_DATE.exec(input.trim());
  if (m) {
    const [, y, mo, d] = m;
    const date = new Date(Number(y), Number(mo) - 1, Number(d));
    // Reject overflow such as 2026-02-31.
    if (date.getFullYear() !== Number(y) || date.getMonth() !== Number(mo) - 1 || date.getDate() !== Number(d)) return null;
    return date;
  }
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Local calendar date as 'YYYY-MM-DD' (for DB `date` columns). */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface DateFormatOptions {
  /** short: 5 Nov · medium (default): 5 Nov 2026 · long: Thursday, 5 November 2026 */
  style?: 'short' | 'medium' | 'long';
  /** Include the time (for timestamps). */
  withTime?: boolean;
}

export function formatDate(input: string | Date, locale: Locale, opts: DateFormatOptions = {}): string {
  const date = parseDateInput(input);
  if (!date) return '';
  const style = opts.style ?? 'medium';
  const options: Intl.DateTimeFormatOptions =
    style === 'short'
      ? { day: 'numeric', month: 'short' }
      : style === 'long'
        ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
        : { day: 'numeric', month: 'short', year: 'numeric' };
  if (opts.withTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  return isolate(new Intl.DateTimeFormat(intlLocale(locale), options).format(date));
}

export type DueStatus = 'overdue' | 'today' | 'tomorrow' | 'upcoming';

export interface RelativeDue {
  status: DueStatus;
  /** Whole calendar days from today (negative when overdue). */
  days: number;
  key: Extract<TranslationKey, `common.due.${string}`>;
  vars?: { count: number };
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Relative due label as an i18n key + vars: `t(r.key, r.vars)`.
 * Calendar-day based in local time (DST-safe). Returns null for invalid input.
 */
export function formatRelativeDue(due: string | Date, now: Date = new Date()): RelativeDue | null {
  const date = parseDateInput(due);
  if (!date) return null;
  const days = Math.round((startOfDay(date) - startOfDay(now)) / 86_400_000);
  if (days < 0) return { status: 'overdue', days, key: 'common.due.overdue', vars: { count: -days } };
  if (days === 0) return { status: 'today', days, key: 'common.due.today' };
  if (days === 1) return { status: 'tomorrow', days, key: 'common.due.tomorrow' };
  return { status: 'upcoming', days, key: 'common.due.inDays', vars: { count: days } };
}

/* ------------------------------------------------------------------ */
/* Parsing money input                                                 */
/* ------------------------------------------------------------------ */

export interface ParseMoneyOptions {
  allowNegative?: boolean;
  /** Inclusive upper bound in minor units (default: FINANCE_LIMITS.maxAmountMinor). */
  maxMinor?: number;
}

const DIGIT_MAP: Record<string, string> = {};
// Arabic-Indic (U+0660…) and Extended Arabic-Indic / Persian (U+06F0…) digits.
for (let i = 0; i < 10; i++) {
  DIGIT_MAP[String.fromCharCode(0x0660 + i)] = String(i);
  DIGIT_MAP[String.fromCharCode(0x06f0 + i)] = String(i);
}

/**
 * Parses user-typed money into integer minor units, or null when the text is not a valid amount.
 *
 * Accepts: "1,234.50", "1234.5", "₪ 1,200", "1200 ₪", "1,200 ש״ח", "$12", "12,5" (decimal comma),
 * "1.234.567" (dot grouping), bidi marks/isolates, NBSP and thin spaces, Arabic-Indic digits.
 * Rejects: empty input, more than 2 decimals, malformed grouping, letters mixed into digits,
 * negatives (unless allowed) and amounts above the DB limit.
 *
 * `currency` documents the unit of the result (all supported currencies use 2 decimals).
 */
export function parseMoneyInput(text: string, currency: string, opts: ParseMoneyOptions = {}): number | null {
  void currency;
  if (typeof text !== 'string') return null;
  let s = stripBidi(text)
    .replace(/[٠-٩۰-۹]/g, (d) => DIGIT_MAP[d] ?? d)
    .replace(/[    \s]/g, '')
    .replace(/[−‒–—]/g, '-'); // minus-like dashes

  // Strip a leading/trailing currency symbol, code or word (₪, $, ILS, NIS, ש״ח, שח, שקלים…).
  // Anything that is not a digit/separator in the middle of the number makes it invalid.
  s = s.replace(/^[^\d.,-]+/, '').replace(/[^\d.,-]+$/, '');

  let negative = false;
  if (s.startsWith('-')) {
    negative = true;
    s = s.slice(1).replace(/^[^\d.,]+/, '');
  } else if (s.endsWith('-')) {
    negative = true;
    s = s.slice(0, -1).replace(/[^\d.,]+$/, '');
  }
  if (s === '' || !/^[\d.,]+$/.test(s)) return null;
  if (negative && !opts.allowNegative) return null;

  let integerPart: string;
  let fractionPart = '';
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');

  if (lastDot >= 0 && lastComma >= 0) {
    // Both present: the last one is the decimal separator, the other groups thousands.
    const decimalSep = lastDot > lastComma ? '.' : ',';
    const groupSep = decimalSep === '.' ? ',' : '.';
    const [intRaw, frac, ...rest] = s.split(decimalSep);
    if (rest.length > 0 || intRaw === undefined || frac === undefined) return null;
    if (!isGrouped(intRaw, groupSep)) return null;
    integerPart = intRaw.split(groupSep).join('');
    fractionPart = frac;
  } else if (lastComma >= 0 || lastDot >= 0) {
    const sep = lastComma >= 0 ? ',' : '.';
    const parts = s.split(sep);
    if (parts.length === 2 && parts[1] !== undefined && parts[1].length <= 2) {
      // "12,5" / "12.50" / "12." → decimal separator.
      integerPart = parts[0] ?? '';
      fractionPart = parts[1];
    } else if (isGrouped(s, sep)) {
      // "1,234" / "1.234.567" → grouping.
      integerPart = parts.join('');
    } else {
      return null;
    }
  } else {
    integerPart = s;
  }

  if (integerPart === '') integerPart = '0';
  if (!/^\d+$/.test(integerPart) || !/^\d{0,2}$/.test(fractionPart)) return null;

  const minorText = integerPart.replace(/^0+(?=\d)/, '') + fractionPart.padEnd(2, '0');
  if (minorText.length > 16) return null;
  const minor = Number(minorText);
  const max = opts.maxMinor ?? FINANCE_LIMITS.maxAmountMinor;
  if (!Number.isSafeInteger(minor) || minor > max) return null;
  return negative ? normalizeZero(-minor) : minor;
}

/** "1,234,567" style grouping: 1–3 leading digits then groups of exactly 3. */
function isGrouped(text: string, sep: string): boolean {
  const groups = text.split(sep);
  if (groups.length === 1) return /^\d+$/.test(text);
  const [first, ...rest] = groups;
  return first !== undefined && /^\d{1,3}$/.test(first) && rest.every((g) => /^\d{3}$/.test(g));
}

/** Formats minor units for an editable input ("1234.5" style, no grouping, no symbol). */
export function minorToInputText(minor: number | null | undefined): string {
  if (minor === null || minor === undefined || !Number.isFinite(minor)) return '';
  const negative = minor < 0;
  const abs = Math.abs(Math.round(minor));
  const major = Math.floor(abs / MINOR_PER_MAJOR);
  const rest = abs % MINOR_PER_MAJOR;
  const text = rest === 0 ? String(major) : `${major}.${String(rest).padStart(2, '0')}`;
  return negative ? `-${text}` : text;
}

/** Currency symbol for adornments ("₪", "$", "€"), falling back to the code. */
export function currencySymbol(currency: string, locale: Locale): string {
  try {
    const part = new Intl.NumberFormat(intlLocale(locale), { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
      .formatToParts(0)
      .find((p) => p.type === 'currency');
    return part?.value ?? currency;
  } catch {
    return currency;
  }
}
