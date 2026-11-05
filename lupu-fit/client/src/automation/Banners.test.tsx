import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWith } from '../components/nutrition/testHarness.tsx';

const h = vi.hoisted(() => ({ device: false, sessions: [] as { localDate: string }[], weights: [] as { loggedDate: string; weightKg: number }[] }));
vi.mock('../env.ts', () => ({ get IS_DEVICE() { return h.device; }, RUN_MODE: 'hosted' }));
vi.mock('../api/client.ts', async (orig) => {
  const real = await orig<typeof import('../api/client.ts')>();
  return { ...real, api: { get: async (p: string) => { if (p === '/api/sessions') return { sessions: h.sessions }; if (p === '/api/weights') return { entries: h.weights }; if (p === '/api/auth/me') return { user: { id: 'u1', username: 'x', role: 'user' }, csrfToken: 'x', onboarded: true, mode: 'hosted' }; throw new Error(p); } } };
});
const { AutomationBanners } = await import('./Banners.tsx');
const { saveSettings, DEFAULT_SETTINGS } = await import('./settings.ts');

// Wednesday 2026-11-04, local time. Last week (Hebrew, Sunday start) = 2026-10-25 .. 10-31.
const adult = { age: 30, daysPerWeek: 3 };
beforeEach(() => { localStorage.clear(); h.device = false; h.sessions = []; h.weights = []; vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(2026, 10, 4, 9, 0)); });
afterEach(() => vi.useRealTimers());
const view = (p = adult, lang: 'he' | 'en' = 'he') => renderWith(<AutomationBanners profile={p} />, { lang, route: '/' });
const real = userEvent.setup({ advanceTimers: () => undefined });

describe('weekly check-in banner', () => {
  it('summarises last week with workouts vs goal and weight change, with a link to Progress', async () => {
    h.sessions = [{ localDate: '2026-10-26' }, { localDate: '2026-10-28' }]; h.weights = [{ loggedDate: '2026-10-20', weightKg: 80 }, { loggedDate: '2026-10-30', weightKg: 79.4 }];
    view(adult, 'en');
    expect(await screen.findByTestId('weekly-checkin')).toBeInTheDocument();
    expect(screen.getByText('2 of 3 workouts done.')).toBeInTheDocument();
    expect(screen.getByText('Logged weight change: -0.6 kg.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See progress' })).toHaveAttribute('href', '/progress');
  });
  it('Hebrew copy', async () => {
    h.sessions = [{ localDate: '2026-10-26' }];
    view();
    expect(await screen.findByText('1 מתוך 3 אימונים בוצעו.')).toBeInTheDocument();
  });
  it('dismiss hides it for the rest of the week (stored) and it is not shown again on remount', async () => {
    h.sessions = [{ localDate: '2026-10-26' }];
    const { unmount } = view(adult, 'en');
    await real.click(await screen.findByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByTestId('weekly-checkin')).toBeNull();
    expect(localStorage.getItem('lf_auto_checkin_seen')).toBe('2026-11-02');
    unmount(); view(adult, 'en');
    await new Promise((r) => setTimeout(r, 60)); // let both queries resolve
    expect(screen.queryByTestId('weekly-checkin')).toBeNull();
  });
  it('appears again in the next week', async () => {
    h.sessions = [{ localDate: '2026-10-26' }];
    localStorage.setItem('lf_auto_checkin_seen', '2026-11-01');
    vi.setSystemTime(new Date(2026, 10, 8, 9, 0)); // next Sunday
    view(adult, 'he');
    expect(await screen.findByTestId('weekly-checkin')).toBeInTheDocument();
  });
  it('is hidden for someone who joined this week, even after a first workout and weigh-in (no "0 of 3" for a week that never existed)', async () => {
    h.sessions = [{ localDate: '2026-11-04' }]; h.weights = [{ loggedDate: '2026-11-03', weightKg: 70 }];
    view(adult, 'en');
    await new Promise((r) => setTimeout(r, 60)); // let both queries resolve
    expect(screen.queryByTestId('weekly-checkin')).toBeNull();
  });
  it('is hidden for a brand-new account with no history, and when switched off', async () => {
    const { unmount } = view();
    await vi.waitFor(() => expect(screen.queryByTestId('weekly-checkin')).toBeNull());
    unmount();
    h.sessions = [{ localDate: '2026-10-26' }];
    saveSettings(null, { ...DEFAULT_SETTINGS, auto: { ...DEFAULT_SETTINGS.auto, weeklyCheckin: false } });
    view();
    await vi.waitFor(() => expect(screen.queryByTestId('weekly-checkin')).toBeNull());
  });
  it('minors never see a weight line', async () => {
    h.sessions = [{ localDate: '2026-10-26' }]; h.weights = [{ loggedDate: '2026-10-20', weightKg: 60 }, { loggedDate: '2026-10-30', weightKg: 62 }];
    view({ age: 15, daysPerWeek: 3 }, 'en');
    await screen.findByTestId('weekly-checkin');
    expect(screen.queryByText(/weight change/)).toBeNull();
  });
});

describe('monthly backup reminder', () => {
  it('Device Mode only: shown 30+ days after the first open when there is data, snoozed on dismiss', async () => {
    h.device = true; h.sessions = [{ localDate: '2026-10-26' }];
    localStorage.setItem('lf_auto_backup', JSON.stringify({ since: '2026-09-20' }));
    localStorage.setItem('lf_auto_checkin_seen', '2026-11-01');
    view(adult, 'en');
    expect(await screen.findByTestId('backup-reminder')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open settings' })).toHaveAttribute('href', '/profile');
    await real.click(screen.getByRole('button', { name: 'Not now' }));
    expect(screen.queryByTestId('backup-reminder')).toBeNull();
    expect(JSON.parse(localStorage.getItem('lf_auto_backup') as string).snoozed).toBe('2026-11-04');
  });
  it('never on the hosted build; first open only records the date', async () => {
    h.sessions = [{ localDate: '2026-10-26' }];
    localStorage.setItem('lf_auto_backup', JSON.stringify({ since: '2026-01-01' }));
    view(adult, 'en');
    await screen.findByTestId('weekly-checkin');
    expect(screen.queryByTestId('backup-reminder')).toBeNull();
  });
  it('first open on a device build records the baseline and shows nothing yet', async () => {
    h.device = true; h.sessions = [{ localDate: '2026-10-26' }];
    view(adult, 'en');
    await screen.findByTestId('weekly-checkin');
    expect(screen.queryByTestId('backup-reminder')).toBeNull();
    expect(JSON.parse(localStorage.getItem('lf_auto_backup') as string).since).toBe('2026-11-04');
  });
});
