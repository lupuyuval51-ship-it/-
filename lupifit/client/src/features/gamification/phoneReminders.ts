/**
 * Phone reminders (the Android app's local notifications, see platform/native/reminders.ts): what the
 * platform needs to know about today, and a way for the settings to ask for a sync right away.
 * Same rules as the in-app reminders (./reminders.ts) and the server's push job: a workout finished today
 * or one started today and still open satisfies today's workout reminder; food logged in a meal's period
 * satisfies that meal's reminder.
 */
import type { Locale } from '@shared/constants';
import { dateInTimeZone } from '@shared/dates';
import type { DashboardDTO, ReminderSettings } from '@shared/types';
import type { ReminderSyncContext } from '../../platform';
import { dayStateFromDashboard, mealSlots } from './reminders';

export function reminderContext(
  settings: ReminderSettings,
  dashboard: Pick<DashboardDTO, 'today' | 'weekDays' | 'activeSession' | 'nutritionToday'>,
  timeZone: string,
  locale: Locale,
): ReminderSyncContext {
  const state = dayStateFromDashboard(dashboard, timeZone);
  const openToday = dashboard.activeSession != null && dateInTimeZone(dashboard.activeSession.startedAt, timeZone) === dashboard.today;
  const lastLog = state.lastFoodLogMinutes;
  return {
    locale,
    today: dashboard.today,
    timeZone,
    workoutDoneToday: state.workoutsToday > 0 || openToday,
    loggedMealTimes: lastLog == null ? [] : mealSlots(settings.mealTimes).filter((s) => lastLog >= s.start).map((s) => s.time),
  };
}

/** Reminders off: what a sync gets when there is nothing to remind about (cancels every scheduled one). */
export const NO_REMINDERS: ReminderSettings = { enabled: false, workoutDays: [], workoutTime: '18:00', mealLogging: false, mealTimes: [] };

const listeners = new Set<() => void>();

/** Sync the phone reminders now (e.g. right after notifications were allowed). */
export function requestReminderSync(): void {
  for (const listener of [...listeners]) listener();
}

export function onReminderSyncRequest(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
