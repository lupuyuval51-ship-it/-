/** Pure reminder scheduler: (settings, now, profile, today's workout state) -> triggers. No I/O, no Capacitor, no i18n. */
import { parseHhmm, type AutomationSettings, type MealKind, type Weekday } from './settings.ts';

export type ReminderKind = 'workout' | 'breakfast' | 'lunch' | 'dinner' | 'weigh' | 'streak' | 'rest';
export type RouteTarget = '/workouts' | '/nutrition' | '/progress';

export interface ScheduleProfile { age: number; daysPerWeek: number }
export interface ScheduleInput { settings: AutomationSettings; now: Date; profile: ScheduleProfile | null; /** A workout is finished or in progress today. */ workoutDoneToday: boolean }

export interface Trigger {
  /** Stable per kind + weekday (weekday+1, or 0 for daily). Re-scheduling the same id replaces it. */
  id: number;
  kind: ReminderKind;
  route: RouteTarget;
  hour: number;
  minute: number;
  /** Weekly repeat on this weekday (0 = Sunday), or null for daily. Only for `repeats`. */
  weekday: Weekday | null;
  repeats: boolean;
  /** One-shot instant (epoch ms) for non-repeating triggers. */
  at: number | null;
}

const KIND_CODE: Record<ReminderKind, number> = { workout: 10, breakfast: 21, lunch: 22, dinner: 23, weigh: 30, streak: 40, rest: 50 };
export const notificationId = (kind: ReminderKind, weekday: Weekday | null): number => KIND_CODE[kind] * 10 + (weekday === null ? 0 : weekday + 1);
export const ROUTE_OF: Record<ReminderKind, RouteTarget> = { workout: '/workouts', streak: '/workouts', rest: '/workouts', breakfast: '/nutrition', lunch: '/nutrition', dinner: '/nutrition', weigh: '/progress' };
/** Only these may be opened from a notification tap. */
export const ALLOWED_ROUTES: readonly string[] = ['/workouts', '/nutrition', '/progress'];

const WEEK: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];
/** Minors (under 18): no calorie, meal or weight reminders at all. */
export const isMinorAge = (age: number): boolean => age <= 17;

/** Suggested training weekdays for N days a week (Israeli week: Sunday-Thursday first). User-editable. */
export function suggestWeekdays(daysPerWeek: number): Weekday[] {
  const n = Math.min(7, Math.max(1, Math.round(daysPerWeek)));
  const table: Record<number, Weekday[]> = { 1: [2], 2: [1, 4], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
  return table[n] as Weekday[];
}
export const trainingDays = (s: AutomationSettings, p: ScheduleProfile): Weekday[] => (s.workout.days && s.workout.days.length > 0 ? s.workout.days : suggestWeekdays(p.daysPerWeek));

/** True when a local time of day (minutes since midnight) is inside quiet hours; the window may wrap midnight. */
export function inQuietHours(minuteOfDay: number, q: AutomationSettings['quiet']): boolean {
  if (!q.on) return false;
  const a = parseHhmm(q.start); const b = parseHhmm(q.end);
  if (!a || !b) return false;
  const start = a.hour * 60 + a.minute; const end = b.hour * 60 + b.minute;
  if (start === end) return false;
  return start < end ? minuteOfDay >= start && minuteOfDay < end : minuteOfDay >= start || minuteOfDay < end;
}

/** Local wall-clock instant on `base` day + `dayOffset`. Built with the local Date constructor, so DST changes keep the wall time. */
export function localInstant(base: Date, dayOffset: number, hour: number, minute: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + dayOffset, hour, minute, 0, 0);
}

export function computeTriggers(i: ScheduleInput): Trigger[] {
  const { settings: s, now, profile, workoutDoneToday } = i;
  if (!profile) return [];
  const out: Trigger[] = [];
  const minor = isMinorAge(profile.age);
  const today = now.getDay() as Weekday;
  const days = trainingDays(s, profile);
  const ok = (hhmm: string): { hour: number; minute: number } | null => {
    const t = parseHhmm(hhmm);
    return t && !inQuietHours(t.hour * 60 + t.minute, s.quiet) ? t : null;
  };
  const weekly = (kind: ReminderKind, weekday: Weekday | null, t: { hour: number; minute: number }): Trigger => ({ id: notificationId(kind, weekday), kind, route: ROUTE_OF[kind], hour: t.hour, minute: t.minute, weekday, repeats: true, at: null });
  const once = (kind: ReminderKind, weekday: Weekday, at: Date, t: { hour: number; minute: number }): Trigger => ({ id: notificationId(kind, weekday), kind, route: ROUTE_OF[kind], hour: t.hour, minute: t.minute, weekday, repeats: false, at: at.getTime() });

  if (s.workout.on) {
    const t = ok(s.workout.time);
    if (t) for (const d of days) {
      const laterToday = d === today && localInstant(now, 0, t.hour, t.minute).getTime() > now.getTime();
      // Already trained today: skip today's reminder (one-shot next week); the next app open re-arms the weekly repeat.
      out.push(workoutDoneToday && laterToday ? once('workout', d, localInstant(now, 7, t.hour, t.minute), t) : weekly('workout', d, t));
    }
  }
  if (s.meals.on && !minor) {
    for (const k of s.meals.kinds as readonly MealKind[]) { const t = ok(s.meals.times[k]); if (t) out.push(weekly(k, null, t)); }
  }
  if (s.weigh.on && !minor) { const t = ok(s.weigh.time); if (t) out.push(weekly('weigh', s.weigh.day, t)); }
  if (s.streak.on) {
    // Evening nudge only on planned training days with nothing logged yet; one-shots for the next 7 days, recomputed on every change.
    const t = ok(s.streak.time);
    if (t) for (let off = 0; off < 7; off++) {
      const at = localInstant(now, off, t.hour, t.minute);
      const wd = at.getDay() as Weekday;
      if (!days.includes(wd)) continue;
      if (off === 0 && (workoutDoneToday || at.getTime() <= now.getTime())) continue;
      out.push(once('streak', wd, at, t));
    }
  }
  if (s.rest.on) {
    const t = ok(s.rest.time);
    if (t) for (const d of WEEK) if (!days.includes(d)) out.push(weekly('rest', d, t));
  }
  return out.sort((a, b) => a.id - b.id);
}

/** Next instant a trigger fires strictly after `now` (used by the in-app web fallback). */
export function nextFire(t: Trigger, now: Date): Date | null {
  if (!t.repeats) return t.at !== null && t.at > now.getTime() ? new Date(t.at) : null;
  for (let off = 0; off <= 7; off++) {
    const at = localInstant(now, off, t.hour, t.minute);
    if (at.getTime() > now.getTime() && (t.weekday === null || at.getDay() === t.weekday)) return at;
  }
  return null;
}
