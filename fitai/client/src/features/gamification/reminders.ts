/**
 * Pure scheduling logic for the optional in-app reminders (see ReminderScheduler).
 * - Workout reminder: on a selected weekday at/after `workoutTime`, unless a workout was
 *   already completed today (or one is in progress).
 * - Meal reminders: at each `mealTimes` entry, unless food was logged during that meal
 *   period. A period spans from halfway since the previous meal time to halfway to the
 *   next one, so a reminder is never shown for a meal that is long over.
 * Every reminder fires at most once per day (handled keys are kept per user and date).
 */
import type { DashboardDTO, ReminderSettings } from '@shared/types';
import { storage } from '../../lib/storage';

export interface LocalClock {
  /** YYYY-MM-DD */
  date: string;
  /** Minutes since local midnight. */
  minutes: number;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
    try {
      f = new Intl.DateTimeFormat('en-US', { ...opts, timeZone });
    } catch {
      f = new Intl.DateTimeFormat('en-US', { ...opts, timeZone: 'UTC' });
    }
    formatters.set(timeZone, f);
  }
  return f;
}

/** Wall-clock date/time in the user's time zone. */
export function localClock(now: Date, timeZone: string): LocalClock {
  const parts = formatterFor(timeZone).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  const date = `${get('year')}-${get('month')}-${get('day')}`;
  const hour = Number(get('hour')) % 24;
  return { date, minutes: hour * 60 + Number(get('minute')), weekday: new Date(`${date}T00:00:00Z`).getUTCDay() };
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export interface MealSlot {
  time: string;
  at: number;
  start: number;
  end: number;
}

export function mealSlots(times: string[]): MealSlot[] {
  const sorted = Array.from(new Set(times.filter((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t)))).sort((a, b) => toMinutes(a) - toMinutes(b));
  return sorted.map((time, i) => {
    const at = toMinutes(time);
    const prev = sorted[i - 1];
    const next = sorted[i + 1];
    return {
      time,
      at,
      start: prev ? Math.round((toMinutes(prev) + at) / 2) : 0,
      end: next ? Math.round((at + toMinutes(next)) / 2) : 24 * 60,
    };
  });
}

export type ReminderKind = 'workout' | 'meal';

export interface Reminder {
  key: string;
  kind: ReminderKind;
}

/** Reminders whose time has come today and that were not handled yet (no data needed). */
export function dueCandidates(settings: ReminderSettings, clock: LocalClock, handled: ReadonlySet<string>): Reminder[] {
  if (!settings.enabled) return [];
  const out: Reminder[] = [];
  if (settings.workoutDays.includes(clock.weekday) && clock.minutes >= toMinutes(settings.workoutTime)) out.push({ key: 'workout', kind: 'workout' });
  if (settings.mealLogging) {
    for (const slot of mealSlots(settings.mealTimes)) {
      if (clock.minutes >= slot.at && clock.minutes < slot.end) out.push({ key: `meal:${slot.time}`, kind: 'meal' });
    }
  }
  return out.filter((r) => !handled.has(r.key));
}

export interface DayState {
  workoutsToday: number;
  sessionActive: boolean;
  /** Local minutes of the most recent food entry for today, or null when nothing is logged. */
  lastFoodLogMinutes: number | null;
}

export function dayStateFromDashboard(d: Pick<DashboardDTO, 'today' | 'weekDays' | 'activeSession' | 'nutritionToday'>, timeZone: string): DayState {
  const last = d.nutritionToday.lastLoggedAt ? localClock(new Date(d.nutritionToday.lastLoggedAt), timeZone) : null;
  return {
    workoutsToday: d.weekDays.find((x) => x.date === d.today)?.workouts ?? 0,
    sessionActive: d.activeSession != null,
    // Entries for today that were logged on an earlier day count as logged at the start of today.
    lastFoodLogMinutes: last ? (last.date < d.today ? 0 : last.minutes) : null,
  };
}

/** With fresh data: `fire` → show now; `done` → already satisfied today (never shown). */
export function resolveReminders(candidates: Reminder[], settings: ReminderSettings, state: DayState): { fire: Reminder[]; done: Reminder[] } {
  const fire: Reminder[] = [];
  const done: Reminder[] = [];
  const slots = mealSlots(settings.mealTimes);
  for (const r of candidates) {
    if (r.kind === 'workout') {
      if (state.workoutsToday > 0) done.push(r);
      else if (!state.sessionActive) fire.push(r);
      continue;
    }
    const slot = slots.find((s) => r.key === `meal:${s.time}`);
    if (!slot) continue;
    if (state.lastFoodLogMinutes != null && state.lastFoodLogMinutes >= slot.start) done.push(r);
    else fire.push(r);
  }
  return { fire, done };
}

const storageKey = (userId: string) => `fitai.reminders.${userId}`;

export function loadHandled(userId: string, date: string): Set<string> {
  const saved = storage.get<{ date: string; keys: string[] }>(storageKey(userId));
  return new Set(saved && saved.date === date && Array.isArray(saved.keys) ? saved.keys : []);
}

export function saveHandled(userId: string, date: string, keys: Set<string>): void {
  storage.set(storageKey(userId), { date, keys: Array.from(keys) });
}
