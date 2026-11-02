import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWith } from '../components/nutrition/testHarness.tsx';

const h = vi.hoisted(() => ({
  native: true, display: 'prompt' as string, req: 'granted' as string,
  schedule: vi.fn(async (_o: unknown) => ({ notifications: [] })), cancel: vi.fn(async (_o: unknown) => undefined),
  getPending: vi.fn(async () => ({ notifications: [] as { id: number }[] })), createChannel: vi.fn(async (_o: unknown) => undefined),
  checkPermissions: vi.fn(), requestPermissions: vi.fn(), listeners: [] as ((e: unknown) => void)[],
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => h.native } }));
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    checkPermissions: (...a: unknown[]) => h.checkPermissions(...a), requestPermissions: (...a: unknown[]) => h.requestPermissions(...a),
    schedule: h.schedule, cancel: h.cancel, getPending: h.getPending, createChannel: h.createChannel,
    addListener: async (_n: string, cb: (e: unknown) => void) => { h.listeners.push(cb); return { remove: async () => undefined }; },
  },
}));
vi.mock('../api/client.ts', async (orig) => {
  const real = await orig<typeof import('../api/client.ts')>();
  return { ...real, api: { get: async (p: string) => { if (p === '/api/auth/me') return { user: { id: 'u1', username: 'dana', role: 'user' }, csrfToken: 'x', onboarded: true, mode: 'hosted' }; throw new Error('unexpected'); } } };
});
const { AutomationCard } = await import('../components/profile/AutomationCard.tsx');
const { loadSettings } = await import('./settings.ts');

const adult = { age: 30, daysPerWeek: 3 }; const minor = { age: 15, daysPerWeek: 3 };
const view = (p = adult, lang: 'he' | 'en' = 'en') => renderWith(<AutomationCard profile={p} />, { lang });
beforeEach(() => {
  localStorage.clear(); h.native = true; h.display = 'prompt'; h.req = 'granted'; h.listeners.length = 0; vi.clearAllMocks();
  h.checkPermissions.mockImplementation(async () => ({ display: h.display }));
  h.requestPermissions.mockImplementation(async () => { h.display = h.req; return { display: h.req }; });
});

describe('Automation card', () => {
  it('all reminders start OFF and the permission is not requested on render', async () => {
    view();
    const sw = await screen.findAllByRole('switch');
    for (const name of ['Workout day reminder', 'Meal logging reminders', 'Weekly weigh-in', 'Streak nudge', 'Rest-day tip']) expect(screen.getByRole('switch', { name })).not.toBeChecked();
    expect(sw.length).toBeGreaterThan(5);
    expect(h.requestPermissions).not.toHaveBeenCalled();
    expect(loadSettings('u1').workout.on).toBe(false);
  });

  it('asks for notification permission on the first opt-in tap only, then stores the choice', async () => {
    const u = userEvent.setup(); view();
    await u.click(await screen.findByRole('switch', { name: 'Workout day reminder' }));
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Workout day reminder' })).toBeChecked());
    expect(h.requestPermissions).toHaveBeenCalledTimes(1);
    expect(loadSettings('u1').workout.on).toBe(true);
    await u.click(screen.getByRole('switch', { name: 'Weekly weigh-in' }));
    await waitFor(() => expect(loadSettings('u1').weigh.on).toBe(true));
    expect(h.requestPermissions).toHaveBeenCalledTimes(1); // already granted: no second prompt
  });

  it('keeps the reminder OFF and explains when permission is denied; does not re-prompt a denied state', async () => {
    h.req = 'denied';
    const u = userEvent.setup(); view();
    await u.click(await screen.findByRole('switch', { name: 'Streak nudge' }));
    expect(await screen.findByTestId('auto-denied')).toBeInTheDocument();
    expect(loadSettings('u1').streak.on).toBe(false);
    await u.click(screen.getByRole('switch', { name: 'Streak nudge' }));
    expect(h.requestPermissions).toHaveBeenCalledTimes(1);
  });

  it('suggests training weekdays from daysPerWeek and lets the user edit them and the time', async () => {
    const u = userEvent.setup(); view();
    await u.click(await screen.findByRole('switch', { name: 'Workout day reminder' }));
    const grp = await screen.findByRole('group', { name: 'Days' });
    const pressed = Array.from(grp.querySelectorAll('[aria-pressed="true"]')).map((b) => b.getAttribute('aria-label'));
    expect(pressed.sort()).toEqual(['Sunday', 'Thursday', 'Tuesday']);
    await u.click(screen.getByRole('button', { name: 'Friday' }));
    expect(loadSettings('u1').workout.days).toEqual([0, 2, 4, 5]);
    const time = screen.getAllByLabelText('Time')[0] as HTMLInputElement;
    fireEvent.change(time, { target: { value: '17:45' } });
    expect(loadSettings('u1').workout.time).toBe('17:45');
  });

  it('minor profiles get no meal or weigh-in reminders at all', async () => {
    view(minor);
    await screen.findByRole('switch', { name: 'Workout day reminder' });
    expect(screen.queryByRole('switch', { name: 'Meal logging reminders' })).toBeNull();
    expect(screen.queryByRole('switch', { name: 'Weekly weigh-in' })).toBeNull();
    expect(screen.getByText(/not offered for profiles under 18/)).toBeInTheDocument();
  });

  it('warns when a chosen time falls inside quiet hours', async () => {
    const u = userEvent.setup(); view();
    await u.click(await screen.findByRole('switch', { name: 'Weekly weigh-in' }));
    const time = (await screen.findAllByLabelText('Time'))[0] as HTMLInputElement;
    fireEvent.change(time, { target: { value: '23:00' } });
    expect(await screen.findByText('This time is inside quiet hours, so no reminder will be sent.')).toBeInTheDocument();
  });

  it('web: says honestly that reminders cannot fire when the app is closed', async () => {
    h.native = false; vi.stubGlobal('Notification', Object.assign(function N() {}, { permission: 'default', requestPermission: vi.fn(async () => 'granted') }));
    view();
    expect(await screen.findByText(/cannot fire when it is closed/)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('unsupported browser: scheduling toggles are hidden with an explanation, in-app toggles remain', async () => {
    h.native = false; vi.stubGlobal('Notification', undefined);
    view();
    expect(await screen.findByText(/does not support notifications/)).toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: 'Workout day reminder' })).toBeNull();
    expect(screen.getByRole('switch', { name: 'Start the rest timer after each set' })).toBeChecked();
    vi.unstubAllGlobals();
  });

  it('in-app automations: check-in and rest timer default ON and can be turned off', async () => {
    const u = userEvent.setup(); view();
    const rest = await screen.findByRole('switch', { name: 'Start the rest timer after each set' });
    expect(rest).toBeChecked(); expect(screen.getByRole('switch', { name: 'Weekly check-in on Home' })).toBeChecked();
    await u.click(rest);
    expect(loadSettings('u1').auto.restTimer).toBe(false);
    expect(h.requestPermissions).not.toHaveBeenCalled(); // in-app toggles never ask for permission
  });

  it('renders Hebrew copy', async () => {
    view(adult, 'he');
    expect(await screen.findByRole('switch', { name: 'תזכורת לימי אימון' })).toBeInTheDocument();
  });
});
