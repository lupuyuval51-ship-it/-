/**
 * Relative "last active" labels for the conversation list. Pure: returns an i18n key + vars, or
 * a date to format (Hermes has no Intl.RelativeTimeFormat, so the phrases are translated strings).
 */
import { parseDateInput } from '@/i18n/format';

export type RelativeTime =
  | { kind: 'key'; key: 'advisor.time.justNow' | 'advisor.time.yesterday' }
  | { kind: 'count'; key: 'advisor.time.minutesAgo' | 'advisor.time.hoursAgo'; count: number }
  | { kind: 'date'; date: Date; sameYear: boolean };

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function relativeTime(iso: string, now: Date = new Date()): RelativeTime | null {
  const date = parseDateInput(iso);
  if (!date) return null;
  const diff = now.getTime() - date.getTime();
  // Small clock skew between device and server must not produce "in 2 minutes".
  if (diff < MINUTE) return { kind: 'key', key: 'advisor.time.justNow' };
  if (diff < HOUR) return { kind: 'count', key: 'advisor.time.minutesAgo', count: Math.floor(diff / MINUTE) };
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (days === 0) return { kind: 'count', key: 'advisor.time.hoursAgo', count: Math.floor(diff / HOUR) };
  if (days === 1) return { kind: 'key', key: 'advisor.time.yesterday' };
  return { kind: 'date', date, sameYear: date.getFullYear() === now.getFullYear() };
}
