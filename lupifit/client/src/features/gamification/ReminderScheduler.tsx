/**
 * Optional in-app reminders (workout days / meal logging) while the app is open.
 * Owned by the gamification/progress feature.
 *
 * Honest by design: there is no push server — reminders appear only while LUPIFIT is open
 * in a browser tab (an in-app toast, plus a system notification when the user already
 * granted permission). Disabled reminders do nothing.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import type { ProfileResponse } from '@shared/types';
import { apiGet } from '../../api/client';
import { qk } from '../../api/queryClient';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ui';
import { useI18n } from '../../i18n';
import { fetchDashboard } from '../dashboard/api';
import { dayStateFromDashboard, dueCandidates, loadHandled, localClock, resolveReminders, saveHandled, type Reminder } from './reminders';

const CHECK_INTERVAL_MS = 60_000;

export function ReminderScheduler() {
  const { user } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reminders = useQuery({
    // Under the shared `profile` prefix so profile/settings updates refresh it.
    queryKey: [...qk.profile, 'reminders'],
    queryFn: () => apiGet<ProfileResponse>('/profile'),
    select: (r) => r.profile.reminders,
    staleTime: 5 * 60_000,
    enabled: Boolean(user?.onboardingCompleted),
  });
  const settings = reminders.data;
  const ui = useRef({ t, toast, navigate });
  ui.current = { t, toast, navigate };
  const userId = user?.id;
  const timeZone = user?.timezone ?? 'UTC';

  useEffect(() => {
    if (!userId || !settings?.enabled) return;
    let disposed = false;
    let running = false;

    const show = (r: Reminder) => {
      const { t: tr, toast: toaster, navigate: go } = ui.current;
      const title = tr(r.kind === 'workout' ? 'notifications.reminders.workoutTitle' : 'notifications.reminders.mealTitle');
      const body = tr(r.kind === 'workout' ? 'notifications.reminders.workoutBody' : 'notifications.reminders.mealBody');
      const path = r.kind === 'workout' ? '/' : '/nutrition/log';
      toaster.show(`${title} — ${body}`, 'info', { label: tr('notifications.reminders.open'), onClick: () => go(path) });
      try {
        if (typeof window.Notification === 'function' && window.Notification.permission === 'granted') {
          const n = new window.Notification(title, { body, tag: `fitai-${r.key}` });
          n.onclick = () => {
            window.focus();
            go(path);
            n.close();
          };
        }
      } catch {
        // Some mobile browsers only allow notifications from a service worker; the toast is enough.
      }
    };

    const check = async () => {
      if (running || disposed) return;
      running = true;
      try {
        const clock = localClock(new Date(), timeZone);
        const handled = loadHandled(userId, clock.date);
        const candidates = dueCandidates(settings, clock, handled);
        if (!candidates.length) return;
        const dashboard = await queryClient.fetchQuery({ queryKey: qk.dashboard, queryFn: fetchDashboard, staleTime: 60_000 });
        if (disposed) return;
        const { fire, done } = resolveReminders(candidates, settings, dayStateFromDashboard(dashboard, timeZone));
        if (!fire.length && !done.length) return;
        for (const r of [...fire, ...done]) handled.add(r.key);
        saveHandled(userId, clock.date, handled);
        fire.forEach(show);
      } catch {
        // Offline or a server error: try again on the next tick.
      } finally {
        running = false;
      }
    };

    void check();
    const id = window.setInterval(() => void check(), CHECK_INTERVAL_MS);
    return () => {
      disposed = true;
      window.clearInterval(id);
    };
  }, [userId, timeZone, settings, queryClient]);

  return null;
}
