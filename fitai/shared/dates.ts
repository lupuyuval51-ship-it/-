/**
 * Calendar-date helpers. Dates are plain `YYYY-MM-DD` strings in the user's own
 * time zone (stored in users.timezone); arithmetic is done in UTC to avoid DST bugs.
 */
import type { Locale } from './constants';

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** The calendar date "today" for a user in the given IANA time zone. */
export function todayInTimeZone(timeZone: string, now: Date = new Date()): string {
  const tz = isValidTimeZone(timeZone) ? timeZone : 'UTC';
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Calendar date of an instant in a given time zone. */
export function dateInTimeZone(instant: Date | string, timeZone: string): string {
  return todayInTimeZone(timeZone, typeof instant === 'string' ? new Date(instant) : instant);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string): number {
  return Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000);
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** Weeks start on Sunday for Hebrew (Israeli convention) and Monday otherwise. */
export function weekStartsOn(locale: Locale): 0 | 1 {
  return locale === 'he' ? 0 : 1;
}

export function startOfWeek(date: string, weekStart: 0 | 1): string {
  const dow = dayOfWeek(date);
  const offset = (dow - weekStart + 7) % 7;
  return addDays(date, -offset);
}

/** Inclusive list of dates from `from` to `to`. */
export function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Whole years elapsed between two dates (used to age the onboarding "age" answer). */
export function yearsBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number) as [number, number, number];
  const [ty, tm, td] = to.split('-').map(Number) as [number, number, number];
  let years = ty - fy;
  if (tm < fm || (tm === fm && td < fd)) years -= 1;
  return Math.max(0, years);
}
