/**
 * Pure calendar-date math on 'YYYY-MM-DD' strings (DB `date` columns).
 *
 * All arithmetic runs on UTC epoch days, so results never depend on the device time zone or on
 * daylight-saving transitions. The only place local time is read is `todayISO()` (the user's
 * local calendar date), and the only place a Date object leaves this module is `toDisplayDate()`
 * (local noon — safe to pass to Intl/`formatDate` without shifting the day).
 */

export type ISODate = string;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

export interface DateParts {
  year: number;
  /** 1–12 */
  month: number;
  /** 1–31 */
  day: number;
}

/** Parses 'YYYY-MM-DD' (rejects overflow such as 2026-02-30). */
export function parseISODate(value: string | null | undefined): DateParts | null {
  if (typeof value !== 'string') return null;
  const m = ISO_DATE.exec(value.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1) return null;
  if (day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function isISODate(value: unknown): value is ISODate {
  return typeof value === 'string' && parseISODate(value) !== null;
}

export function formatISODate(year: number, month: number, day: number): ISODate {
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month = last day of this month (UTC, no time zone involved).
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function toEpochDay(parts: DateParts): number {
  return Math.round(Date.UTC(parts.year, parts.month - 1, parts.day) / DAY_MS);
}

function fromEpochDay(epochDay: number): ISODate {
  const d = new Date(epochDay * DAY_MS);
  return formatISODate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

function mustParse(value: ISODate): DateParts {
  const parts = parseISODate(value);
  if (!parts) throw new RangeError(`Invalid ISO date: ${String(value)}`);
  return parts;
}

/** The user's local calendar date. */
export function todayISO(now: Date = new Date()): ISODate {
  return formatISODate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Local calendar date of a timestamp (e.g. `completed_at`). */
export function localDateOf(timestamp: string | Date): ISODate | null {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (Number.isNaN(date.getTime())) return null;
  return todayISO(date);
}

export function addDays(value: ISODate, days: number): ISODate {
  return fromEpochDay(toEpochDay(mustParse(value)) + Math.trunc(days));
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function diffDays(to: ISODate, from: ISODate): number {
  return toEpochDay(mustParse(to)) - toEpochDay(mustParse(from));
}

export function compareISODate(a: ISODate, b: ISODate): number {
  // Zero-padded ISO dates sort lexicographically.
  return a < b ? -1 : a > b ? 1 : 0;
}

export function endOfMonth(value: ISODate): ISODate {
  const { year, month } = mustParse(value);
  return formatISODate(year, month, daysInMonth(year, month));
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(value: ISODate): number {
  const { year, month, day } = mustParse(value);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export interface YearMonth {
  year: number;
  /** 1–12 */
  month: number;
}

export function yearMonthOf(value: ISODate): YearMonth {
  const { year, month } = mustParse(value);
  return { year, month };
}

export function addMonths(ym: YearMonth, delta: number): YearMonth {
  const index = ym.year * 12 + (ym.month - 1) + Math.trunc(delta);
  return { year: Math.floor(index / 12), month: (((index % 12) + 12) % 12) + 1 };
}

export function isSameMonth(value: ISODate, ym: YearMonth): boolean {
  const parts = parseISODate(value);
  return !!parts && parts.year === ym.year && parts.month === ym.month;
}

export interface CalendarDay {
  date: ISODate;
  day: number;
  inMonth: boolean;
}

/**
 * Month grid as weeks of 7 days, padded with the adjacent months' days so every row is full.
 * `weekStartsOn` 0 = Sunday (used for both he-IL and en-US).
 */
export function monthGrid(ym: YearMonth, weekStartsOn: number = 0): CalendarDay[][] {
  const first = formatISODate(ym.year, ym.month, 1);
  const lead = (weekdayOf(first) - weekStartsOn + 7) % 7;
  const total = daysInMonth(ym.year, ym.month);
  const cells = Math.ceil((lead + total) / 7) * 7;
  const start = addDays(first, -lead);
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < cells; i++) {
    const date = addDays(start, i);
    const parts = mustParse(date);
    const cell: CalendarDay = { date, day: parts.day, inMonth: parts.month === ym.month && parts.year === ym.year };
    if (i % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1]!.push(cell);
  }
  return weeks;
}

/**
 * A Date at local noon for display with Intl (`formatDate`, month titles, weekday names).
 * Noon never crosses a day boundary in any time zone offset in use (±14h).
 */
export function toDisplayDate(value: ISODate): Date {
  const { year, month, day } = mustParse(value);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export type QuickDateKey = 'today' | 'tomorrow' | 'nextWeek' | 'inTwoWeeks' | 'endOfMonth';

export const QUICK_DATE_KEYS: readonly QuickDateKey[] = ['today', 'tomorrow', 'nextWeek', 'inTwoWeeks', 'endOfMonth'];

/** Resolves a quick choice relative to `today`. "Next week" is one week from today. */
export function quickDate(key: QuickDateKey, today: ISODate): ISODate {
  switch (key) {
    case 'today':
      return today;
    case 'tomorrow':
      return addDays(today, 1);
    case 'nextWeek':
      return addDays(today, 7);
    case 'inTwoWeeks':
      return addDays(today, 14);
    case 'endOfMonth':
      return endOfMonth(today);
  }
}

/** Due date for an AI suggestion expressed as "in N days" (null stays null). */
export function dueDateFromOffset(days: number | null | undefined, today: ISODate = todayISO()): ISODate | null {
  if (days === null || days === undefined || !Number.isFinite(days)) return null;
  return addDays(today, Math.max(0, Math.round(days)));
}

/**
 * Weekday reference dates: 2023-01-01 was a Sunday, so index i (0 = Sunday) is 2023-01-0(1+i).
 * Used to localize weekday headers with Intl.
 */
export function weekdayReferenceDate(weekday: number): ISODate {
  return formatISODate(2023, 1, 1 + (((weekday % 7) + 7) % 7));
}
