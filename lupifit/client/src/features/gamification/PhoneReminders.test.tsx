/**
 * Phone reminders in the app UI, with the platform faked: the settings control asks for permission only
 * from a tap, and the sync keeps the phone's schedule in step (start, resume, after changes).
 */
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReminderSettings } from '@shared/types';
import { ToastProvider } from '../../components/ui';
import { I18nProvider } from '../../i18n';
import { installPlatform, resetPlatform, type NotificationPermission, type Reminders } from '../../platform';

const SETTINGS: ReminderSettings = { enabled: true, workoutDays: [5], workoutTime: '18:00', mealLogging: false, mealTimes: [] };
const user = { id: 'u1', timezone: 'Asia/Jerusalem', onboardingCompleted: true };
let dashboardWorkouts = 0;

vi.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user }) }));
vi.mock('../../api/client', () => ({ apiGet: async () => ({ profile: { reminders: SETTINGS } }) }));
vi.mock('../dashboard/api', () => ({
  fetchDashboard: async () => ({
    today: '2026-10-30',
    weekDays: [{ date: '2026-10-30', workouts: dashboardWorkouts }],
    activeSession: null,
    nutritionToday: { lastLoggedAt: null },
  }),
}));

const { PhoneRemindersControl } = await import('./PhoneRemindersControl');
const { PhoneReminderSync } = await import('./PhoneReminderSync');

function fakeReminders(permission: NotificationPermission, afterRequest: NotificationPermission = 'granted') {
  let current = permission;
  const resume = new Set<() => void>();
  const reminders = {
    supported: () => true,
    permission: vi.fn(async () => current),
    request: vi.fn(async () => (current = afterRequest)),
    sync: vi.fn(async () => undefined),
  } satisfies Reminders;
  installPlatform({
    reminders,
    onResume: (l) => {
      resume.add(l);
      return () => resume.delete(l);
    },
  });
  return { reminders, resume: () => resume.forEach((l) => l()) };
}

function wrap(children: ReactNode, client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return (
    <QueryClientProvider client={client}>
      <I18nProvider locale="en">
        <ToastProvider>{children}</ToastProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  dashboardWorkouts = 0;
});
afterEach(() => {
  resetPlatform();
  vi.useRealTimers();
});

describe('PhoneRemindersControl', () => {
  it('asks for permission only when “Allow notifications” is tapped', async () => {
    const { reminders } = fakeReminders('prompt');
    render(wrap(<PhoneRemindersControl remindersOn />));
    const allow = await screen.findByRole('button', { name: 'Allow notifications' });
    expect(reminders.request).not.toHaveBeenCalled();
    fireEvent.click(allow);
    expect(await screen.findByText(/Reminders arrive as notifications on this phone/)).toBeTruthy();
    expect(reminders.request).toHaveBeenCalledTimes(1);
  });

  it('explains how to turn notifications back on when they are off', async () => {
    fakeReminders('denied');
    render(wrap(<PhoneRemindersControl remindersOn />));
    expect(await screen.findByText(/Notifications are turned off for LUPU-FIT/)).toBeTruthy();
    expect(screen.getByText(/Android Settings → Apps → LUPU-FIT → Notifications/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Allow notifications' })).toBeNull();
  });

  it('notes that nothing is scheduled while reminders are switched off', async () => {
    fakeReminders('granted');
    render(wrap(<PhoneRemindersControl remindersOn={false} />));
    expect(await screen.findByText(/no notifications are scheduled until you turn them on/)).toBeTruthy();
  });

  it('checks the permission again when the app comes back (e.g. from Android settings)', async () => {
    const f = fakeReminders('denied');
    render(wrap(<PhoneRemindersControl remindersOn />));
    await screen.findByText(/Notifications are turned off/);
    f.reminders.permission.mockResolvedValue('granted');
    await act(async () => f.resume());
    expect(await screen.findByText(/Reminders arrive as notifications on this phone/)).toBeTruthy();
  });
});

describe('PhoneReminderSync', () => {
  it('syncs on start, after a successful change and when the app comes back', async () => {
    const f = fakeReminders('granted');
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let mutate: () => void = () => undefined;
    function Changer() {
      const m = useMutation({ mutationFn: async () => 'ok' });
      mutate = () => m.mutate();
      return null;
    }
    render(
      wrap(
        <>
          <PhoneReminderSync />
          <Changer />
        </>,
        client,
      ),
    );
    await vi.waitFor(() => expect(f.reminders.sync).toHaveBeenCalledTimes(1));
    expect(f.reminders.sync).toHaveBeenLastCalledWith(SETTINGS, {
      locale: 'en',
      today: '2026-10-30',
      timeZone: 'Asia/Jerusalem',
      workoutDoneToday: false,
      loggedMealTimes: [],
    });

    // A workout is finished: the next sync (after the change settles) knows it.
    dashboardWorkouts = 1;
    await act(async () => mutate());
    await vi.waitFor(() => expect(f.reminders.sync).toHaveBeenCalledTimes(2), { timeout: 4000 });
    expect(f.reminders.sync).toHaveBeenLastCalledWith(SETTINGS, expect.objectContaining({ workoutDoneToday: true }));

    await act(async () => f.resume());
    await vi.waitFor(() => expect(f.reminders.sync).toHaveBeenCalledTimes(3));
  });

  it('does nothing where phone reminders are not supported (web)', async () => {
    const client = new QueryClient();
    const sync = vi.fn();
    installPlatform({ reminders: { supported: () => false, permission: async () => 'denied', request: async () => 'denied', sync } });
    render(wrap(<PhoneReminderSync />, client));
    await new Promise((r) => setTimeout(r, 50));
    expect(sync).not.toHaveBeenCalled();
  });
});
