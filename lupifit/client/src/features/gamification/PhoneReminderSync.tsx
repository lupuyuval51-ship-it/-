/**
 * Keeps the phone's scheduled reminders (Android app, `platform.reminders`) in step with the settings and
 * with what was done today. Renders nothing; does nothing where phone reminders are not supported (web).
 *
 * Syncs when the app starts or comes back to the foreground, when the reminder settings change, and a
 * moment after any successful change (finishing a workout, logging food…), so a reminder that is no
 * longer needed is cancelled before it fires.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { todayInTimeZone } from '@shared/dates';
import type { ProfileResponse } from '@shared/types';
import { apiGet } from '../../api/client';
import { qk } from '../../api/queryClient';
import { useAuth } from '../../auth/AuthProvider';
import { useI18n } from '../../i18n';
import { platform } from '../../platform';
import { fetchDashboard } from '../dashboard/api';
import { NO_REMINDERS, onReminderSyncRequest, reminderContext } from './phoneReminders';

/** After a change, wait for its follow-up requests (invalidated queries) before reading the day again. */
export const SYNC_DELAY_MS = 1500;

export function PhoneReminderSync() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const queryClient = useQueryClient();
  const supported = platform.reminders.supported();
  const onboarded = Boolean(user?.onboardingCompleted);
  const reminders = useQuery({
    // Same query as the in-app ReminderScheduler (shared cache, refreshed by profile/settings updates).
    queryKey: [...qk.profile, 'reminders'],
    queryFn: () => apiGet<ProfileResponse>('/profile'),
    select: (r) => r.profile.reminders,
    staleTime: 5 * 60_000,
    enabled: supported && onboarded,
  });
  const settings = reminders.data;
  const timeZone = user?.timezone ?? 'UTC';
  const signedIn = Boolean(user);

  useEffect(() => {
    if (!supported || !signedIn) return;
    // A fresh account (e.g. after deleting the old one) has no reminders: cancel whatever is scheduled.
    if (!onboarded) {
      const today = todayInTimeZone(timeZone);
      void platform.reminders.sync(NO_REMINDERS, { locale, today, timeZone, workoutDoneToday: false, loggedMealTimes: [] }).catch(() => undefined);
      return;
    }
    if (!settings) return;
    let disposed = false;
    let timer: number | undefined;

    const run = async () => {
      try {
        const dashboard = await queryClient.fetchQuery({ queryKey: qk.dashboard, queryFn: fetchDashboard, staleTime: 0 });
        if (disposed) return;
        await platform.reminders.sync(settings, reminderContext(settings, dashboard, timeZone, locale));
      } catch {
        // The next trigger (change, resume) tries again.
      }
    };
    const schedule = (delay = SYNC_DELAY_MS) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void run(), delay);
    };

    schedule(0);
    const offResume = platform.onResume(() => schedule(0));
    const offRequest = onReminderSyncRequest(() => schedule(0));
    const offMutations = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'success') schedule();
    });
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      offResume();
      offRequest();
      offMutations();
    };
  }, [supported, signedIn, onboarded, settings, timeZone, locale, queryClient]);

  return null;
}
