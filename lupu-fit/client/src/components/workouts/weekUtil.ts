/** Week bucketing for the history and plans screens. Weeks start on Sunday in Hebrew and on Monday in English. Pure. */
import type { Language } from '@lupu-fit/shared';

const DAY = 86_400_000;
const utc = (iso: string): number => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
const iso = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

export function weekStartOf(date: string, lang: Language): string {
  const ms = utc(date);
  const dow = new Date(ms).getUTCDay();
  const back = lang === 'he' ? dow : (dow + 6) % 7;
  return iso(ms - back * DAY);
}
export const weekEndOf = (start: string): string => iso(utc(start) + 6 * DAY);

/** Whole weeks between the start of the week of `today` and `start` (0 = this week, 1 = last week...). */
export function weeksAgo(start: string, today: string, lang: Language): number {
  return Math.round((utc(weekStartOf(today, lang)) - utc(start)) / (7 * DAY));
}

export interface WeekGroup<T> { start: string; end: string; rows: T[] }
/** Groups rows (any order) into weeks, newest week first, keeping the incoming order inside each week. */
export function groupByWeek<T extends { localDate: string }>(rows: readonly T[], lang: Language): WeekGroup<T>[] {
  const map = new Map<string, T[]>();
  for (const r of rows) {
    const k = weekStartOf(r.localDate, lang);
    const list = map.get(k);
    if (list) list.push(r); else map.set(k, [r]);
  }
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([start, list]) => ({ start, end: weekEndOf(start), rows: list }));
}
