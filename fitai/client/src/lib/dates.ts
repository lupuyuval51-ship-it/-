import { todayInTimeZone } from '@shared/dates';

/** The user's IANA time zone according to the browser. */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Today's date (YYYY-MM-DD) in the given (or browser) time zone. */
export function today(timeZone?: string): string {
  return todayInTimeZone(timeZone ?? browserTimeZone());
}
