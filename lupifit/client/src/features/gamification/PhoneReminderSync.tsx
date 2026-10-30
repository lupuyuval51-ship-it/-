/**
 * Phone (local) notifications for the reminders, where the platform has them (the Android app; see
 * platform/types.ts `Reminders`). Keeps the phone's scheduled reminders in step with the settings and with
 * today: re-synced when the app starts or comes back to the foreground, when the reminder settings change,
 * and whenever today's data changes (a finished workout or a logged meal refreshes the dashboard), so a
 * reminder that is already satisfied today is not shown. Elsewhere (web) it does nothing.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { Locale } from '@shared/constants';
import type { DashboardDTO, ProfileResponse, ReminderSettings } from '@shared/types';
import { apiGet } from '../../api/client';
import { qk } from '../../api/queryClient';
import { useAuth } from '../../auth/AuthProvider';
import { useI18n } from '../../i18n';
import { today as todayIn } from '../../lib/dates';
import { platform, type ReminderSyncContext } from '../../platform';
import { fetchDashboard } from '../dashboard/api';
import { dayStateFromDashboard, mealSlots } from './reminders';

/** What today already covers: a finished workout, and the meal times whose period already has a logged meal. */
export function phoneReminderContext(
  settings: ReminderSettings,
  dashboard: Pick<DashboardDTO, 'today' | 'weekDays' | 'activeSession' | 'nutritionToday'>,
  timeZone: string,
  locale: Locale,
): ReminderSyncContext {
  const state = dayStateFromDashboard(dashboard, timeZone);
  const last = state.lastFoodLogMinutes;
  return {
    locale,
    today: dashboard.today,
    workoutDoneToday: state.workoutsToday > 0,
    loggedMealTimes: last == null ? [] : mealSlots(settings.mealTimes).filter((s) => last >= s.start).map((s) => s.time),
  };
}

export function PhoneReminderSync() {
  const supported = platform.reminders.supported();
  const { user } = useAuth();
  const { locale } = useI18n();
  const queryClient = useQueryClient();
  const ready = supported && Boolean(user?.onboardingCompleted);
  const reminders = useQuery({
    queryKey: [...qk.profile, 'reminders'],
    queryFn: () => apiGet<ProfileResponse>('/profile'),
    select: (r) => r.profile.reminders,
    staleTime: 5 * 60_000,
    enabled: ready,
  });
  const settings = reminders.data;
  const dashboard = useQuery({ queryKey: qk.dashboard, queryFn: fetchDashboard, staleTime: 60_000, enabled: ready && Boolean(settings?.enabled) });
  const timeZone = user?.timezone ?? 'UTC';

  // Back in the foreground (possibly on another day): refresh today's state, which re-syncs below.
  useEffect(() => {
    if (!ready) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') void queryClient.invalidateQueries({ queryKey: qk.dashboard });
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [ready, queryClient]);

  useEffect(() => {
    if (!ready || !settings) return;
    if (settings.enabled && !dashboard.data) return; // wait for today's state
    const ctx = dashboard.data
      ? phoneReminderContext(settings, dashboard.data, timeZone, locale)
      : { locale, today: todayIn(timeZone), workoutDoneToday: false, loggedMealTimes: [] };
    void platform.reminders.sync(settings, ctx).catch(() => {
      // The phone refused (e.g. notifications turned off): the settings screen explains how to allow them.
    });
  }, [ready, settings, dashboard.data, timeZone, locale]);

  return null;
}
