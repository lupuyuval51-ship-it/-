import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { api, onUserChange } from '../api/client.ts';
import { qk, useMe, useProfile } from '../app/session.ts';
import { localIso } from '../components/home/dates.ts';
import { useLang } from '../i18n/index.tsx';
import { applySchedule, cancelAll, deliveryMode, onReminderOpen, permissionState } from './delivery.ts';
import { computeTriggers, type ReminderKind } from './schedule.ts';
import { useAutomationSettings } from './settings.ts';

const tzNow = (): string => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ''; } };

/**
 * Mounted once inside the router. Re-computes the reminder schedule on: app start, settings change, profile change, language change,
 * finished/started workout, sign-in/out (cancels everything when signed out), time-zone change and when the app returns to the foreground.
 * Never asks for permission (that happens only from a tap in the Automation card). Idempotent: every run replaces the whole pending set.
 */
export function AutomationRuntime(): ReactNode {
  const { t } = useLang();
  const navigate = useNavigate();
  const me = useMe(); const profile = useProfile(!!me.data);
  const { settings } = useAutomationSettings();
  const [tick, setTick] = useState(0);
  const tz = useRef(tzNow());
  const needsWorkoutState = settings.workout.on || settings.streak.on;
  const signedIn = !!me.data; const p = profile.data?.profile;
  const sessions = useQuery({ queryKey: ['sessions', 'list'], enabled: signedIn && !!p && needsWorkoutState, queryFn: () => api.get<{ sessions: { localDate: string }[] }>('/api/sessions', { limit: 100 }) });
  const active = useQuery({ queryKey: qk.activeSession, enabled: signedIn && !!p && needsWorkoutState, queryFn: () => api.get<{ session: { localDate?: string } | null }>('/api/sessions/active') });

  useEffect(() => onReminderOpen((route) => navigate(route)), [navigate]);

  // Foreground, time-zone change, midnight rollover: re-run the scheduler.
  useEffect(() => {
    const bump = (): void => { tz.current = tzNow(); setTick((n) => n + 1); };
    const vis = (): void => { if (document.visibilityState === 'visible') bump(); };
    document.addEventListener('visibilitychange', vis); window.addEventListener('focus', bump);
    const id = setInterval(bump, 30 * 60_000);
    return () => { document.removeEventListener('visibilitychange', vis); window.removeEventListener('focus', bump); clearInterval(id); };
  }, []);

  // Signed out: cancel everything.
  useEffect(() => { if (me.data === null) void cancelAll(); }, [me.data]);
  // The API layer knows about every sign-out, expired session and change of person, even when the `me` query has not caught up (offline, cleared cache):
  // the previous person's reminders must not outlive them.
  useEffect(() => onUserChange((e) => { if (e.to === null || (e.from !== null && e.from !== e.to)) void cancelAll(); }), []);

  const today = localIso();
  const open = active.data?.session; // an unfinished workout from an earlier day that was never closed does not count as "trained today"
  const doneToday = (!!open && (open.localDate === undefined || open.localDate === today)) || !!sessions.data?.sessions.some((s) => s.localDate === today);
  const stateReady = !needsWorkoutState || (!sessions.isPending && !active.isPending) || sessions.isError || active.isError;
  const anyOn = settings.workout.on || settings.meals.on || settings.weigh.on || settings.streak.on || settings.rest.on;
  const age = p?.age; const days = p?.daysPerWeek;

  useEffect(() => {
    if (!signedIn || age === undefined || days === undefined || !stateReady) return;
    let cancelled = false;
    const run = async (): Promise<void> => {
      if (deliveryMode() === 'none') return;
      if (!anyOn || (await permissionState()) !== 'granted') { await cancelAll(); return; }
      const triggers = computeTriggers({ settings, now: new Date(), profile: { age, daysPerWeek: days }, workoutDoneToday: doneToday });
      if (cancelled) return;
      const text = (kind: ReminderKind) => ({ title: t(`automation.msg.${kind}.title`), body: t(`automation.msg.${kind}.body`) });
      await applySchedule(triggers, text, { name: t('automation.channel.name'), description: t('automation.channel.description') });
    };
    const id = setTimeout(() => { void run().catch(() => undefined); }, 250); // coalesce bursts of changes
    return () => { cancelled = true; clearTimeout(id); };
  }, [signedIn, settings, age, days, doneToday, stateReady, anyOn, t, today, tick]);

  return null;
}
