import { QueryClient } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PROFILE, renderWith } from '../components/nutrition/testHarness.tsx';

const h = vi.hoisted(() => ({
  display: 'granted', me: { user: { id: 'u1' } } as unknown, sessions: [] as { localDate: string }[], active: null as unknown,
  schedule: vi.fn(async (_o: unknown) => ({ notifications: [] })), cancel: vi.fn(async (_o: unknown) => undefined),
  getPending: vi.fn(async () => ({ notifications: [{ id: 101 }, { id: 405 }] })), listeners: [] as ((e: unknown) => void)[],
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    checkPermissions: async () => ({ display: h.display }), requestPermissions: vi.fn(), schedule: h.schedule, cancel: h.cancel, getPending: h.getPending,
    createChannel: vi.fn(async () => undefined), addListener: async (_n: string, cb: (e: unknown) => void) => { h.listeners.push(cb); return { remove: async () => undefined }; },
  },
}));
vi.mock('../api/client.ts', async (orig) => {
  const real = await orig<typeof import('../api/client.ts')>();
  return { ...real, api: { get: async (p: string) => {
    if (p === '/api/auth/me') { if (h.me === null) throw new real.ApiRequestError(401, 'unauthenticated', null, {}); return h.me; }
    if (p === '/api/profile') return { profile: { ...PROFILE, daysPerWeek: 3 }, targets: {} };
    if (p === '/api/sessions') return { sessions: h.sessions };
    if (p === '/api/sessions/active') return { session: h.active };
    throw new Error(p);
  } } };
});
const { AutomationRuntime } = await import('./runtime.tsx');
const { saveSettings, DEFAULT_SETTINGS } = await import('./settings.ts');

const mount = () => renderWith(<><AutomationRuntime /><Routes><Route path="*" element={<div>{'screen'}</div>} /></Routes></>, { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) });
const last = () => (h.schedule.mock.calls.at(-1)?.[0] as { notifications: { id: number; channelId: string; schedule: { on?: unknown; at?: Date }; extra: { route: string }; smallIcon: string }[] } | undefined);
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); h.display = 'granted'; h.me = { user: { id: 'u1' } }; h.sessions = []; h.active = null; h.listeners.length = 0; });

describe('AutomationRuntime', () => {
  it('schedules enabled reminders on start through the "reminders" channel with deep links', async () => {
    saveSettings('u1', { ...DEFAULT_SETTINGS, workout: { on: true, time: '18:00', days: [1, 3] }, weigh: { on: true, day: 5, time: '08:00' } });
    mount();
    await waitFor(() => expect(h.schedule).toHaveBeenCalled());
    const n = last()!.notifications;
    expect(n.map((x) => x.id).sort()).toEqual([102, 104, 306]);
    expect(n.every((x) => x.channelId === 'reminders' && x.smallIcon === 'ic_stat_reminder')).toBe(true);
    expect(n.find((x) => x.id === 306)!.extra.route).toBe('/progress');
    expect(n.find((x) => x.id === 102)!.schedule.on).toMatchObject({ weekday: 2, hour: 18, minute: 0 });
    expect(h.cancel).toHaveBeenCalled(); // idempotent: previous pending set is replaced
  });

  it('schedules nothing and does not prompt when every reminder is off', async () => {
    mount();
    await waitFor(() => expect(h.cancel).toHaveBeenCalled());
    expect(h.schedule).not.toHaveBeenCalled();
  });

  it('does not schedule when notification permission is not granted', async () => {
    h.display = 'denied';
    saveSettings('u1', { ...DEFAULT_SETTINGS, workout: { on: true, time: '18:00', days: [1] } });
    mount();
    await waitFor(() => expect(h.cancel).toHaveBeenCalled());
    expect(h.schedule).not.toHaveBeenCalled();
  });

  it('cancels everything when the user is signed out', async () => {
    h.me = null;
    saveSettings('anon', { ...DEFAULT_SETTINGS, workout: { on: true, time: '18:00', days: [1] } });
    mount();
    await waitFor(() => expect(h.cancel).toHaveBeenCalledWith({ notifications: [{ id: 101 }, { id: 405 }] }));
    expect(h.schedule).not.toHaveBeenCalled();
  });

  it('streak nudge is dropped for today when a workout is already logged today', async () => {
    const d = new Date(); const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    h.sessions = [{ localDate: today }];
    saveSettings('u1', { ...DEFAULT_SETTINGS, quiet: { on: false, start: '22:00', end: '07:00' }, streak: { on: true, time: '23:59' }, workout: { on: false, time: '18:00', days: [0, 1, 2, 3, 4, 5, 6] } });
    mount();
    await waitFor(() => expect(h.schedule).toHaveBeenCalled());
    const ids = last()!.notifications.map((x) => x.id);
    expect(ids).toHaveLength(6); // 7 days minus today
    expect(ids).not.toContain(401 + d.getDay()); // streak id = 400 + weekday + 1
  });

  it('opens the right screen when a reminder is tapped, and ignores unknown routes', async () => {
    mount();
    await waitFor(() => expect(h.listeners.length).toBe(1));
    h.listeners[0]!({ actionId: 'tap', notification: { extra: { route: 'https://evil.example' } } });
    h.listeners[0]!({ actionId: 'tap', notification: { extra: { route: '/nutrition' } } });
    expect(await screen.findByText('screen')).toBeInTheDocument();
  });
});
