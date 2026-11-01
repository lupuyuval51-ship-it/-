import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { calls, handlers, renderPage, resetApi, withProfile } from './test-harness.tsx';

vi.mock('../api/client.ts', async (orig) => ({ ...(await orig<typeof import('../api/client.ts')>()), api: (await import('./test-harness.tsx')).apiStub }));
const { default: Progress } = await import('./Progress.tsx');
const { outbox } = await import('../lib/outbox.ts');

const emptyProgress = {
  range: '30d', from: '2026-10-03', to: '2026-11-01',
  consistency: { sessions: 0, weeks: [], weeklyGoal: 3 }, setsByGroup: { chest: 0, back: 0, shoulders: 0, arms: 0, core: 0, legs: 0 }, hasSets: false, strength: [],
  nutrition: { loggedDays: 0, avgKcal: null, avgProteinG: null, targetKcal: 2000, targetProteinG: 120, daysOnProteinTarget: 0 }, prs: [],
};
const stats = { xp: 120, level: { level: 2, xpIntoLevel: 20, xpForNext: 100 }, achievements: [{ id: 'first_workout', unlockedAt: '2026-10-05T10:00:00Z' }], allAchievementIds: ['first_workout', 'five_workouts', 'first_pr', 'first_weigh_in', 'first_coach_chat', 'first_food_log', 'first_finisher', 'weekly_goal', 'five_prs', 'two_week_streak', 'month_streak', 'twenty_five_workouts', 'seven_food_days', 'protein_week'] };
const open = (lang: 'he' | 'en' = 'he', route = '/progress') => renderPage(<Progress />, { lang, route, path: '/progress' });

beforeEach(() => {
  resetApi();
  handlers['GET /api/profile'] = () => withProfile();
  handlers['GET /api/progress'] = () => emptyProgress;
  handlers['GET /api/stats'] = () => stats;
  handlers['GET /api/weights'] = () => ({ entries: [], smoothed: [], suggestion: null });
});
afterEach(async () => { for (const i of outbox.list()) await outbox.remove(i.id); Object.defineProperty(navigator, 'onLine', { value: true, configurable: true }); });

describe('Progress', () => {
  it('shows honest empty states everywhere when there is no data (Hebrew)', async () => {
    open('he');
    await screen.findByText('עקביות');
    await waitFor(() => expect(screen.getAllByText('אין מספיק נתונים עדיין').length).toBeGreaterThanOrEqual(5));
    expect(screen.queryByRole('img', { name: /תרשים/ })).toBeNull();
    expect(screen.getByText('לא תועדו אימונים בטווח הזה.')).toBeInTheDocument();
    expect(screen.getAllByText('נעול').length).toBe(13);
  });
  it('requests the range from the URL and switches it', async () => {
    open('en', '/progress?range=90d');
    await screen.findByText('Consistency');
    expect(calls.find((c) => c.path === '/api/progress')?.query).toEqual({ range: '90d' });
    fireEvent.click(screen.getByRole('radio', { name: '7 days' }));
    await waitFor(() => expect(calls.filter((c) => c.path === '/api/progress').at(-1)?.query).toEqual({ range: '7d' }));
  });
  it('renders charts, PRs and achievements from real data, and hides 1RM for minors', async () => {
    handlers['GET /api/progress'] = () => ({
      ...emptyProgress, hasSets: true, setsByGroup: { chest: 12, back: 6, shoulders: 0, arms: 3, core: 0, legs: 9 },
      consistency: { sessions: 4, weeks: [{ week: '2026-W43', count: 2 }, { week: '2026-W44', count: 2 }], weeklyGoal: 3 },
      strength: [{ exerciseId: 'push_up', points: [{ date: '2026-10-05', est1rm: 40 }, { date: '2026-10-12', est1rm: 44 }] }],
      prs: [{ exerciseId: 'push_up', maxWeight: 20, est1rm: 33.3, maxReps: 12, maxDuration: null, updatedAt: '2026-10-12T00:00:00Z' }],
    });
    const { unmount } = open('en');
    expect(await screen.findByRole('img', { name: /Sets per muscle|Bar chart of logged sets/ })).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: /Push-Up: estimated 1RM from 40 to 44 kg/ })).toBeInTheDocument();
    expect(screen.getByText(/Est\. 1RM/)).toBeInTheDocument();
    expect(screen.getAllByText('First workout').length).toBeGreaterThan(0);
    unmount();
    handlers['GET /api/profile'] = () => withProfile({ age: 16 });
    open('en');
    await screen.findByText('Personal records');
    await waitFor(() => expect(screen.queryByText(/Est\. 1RM/)).toBeNull());
    expect(await screen.findByText('Strength estimates are not shown for users under 18.')).toBeInTheDocument();
  });
  it('shows the suggest-only calorie card, never for a decrease to a minor', async () => {
    const entries = [{ id: 'a', loggedDate: '2026-10-10', weightKg: 80, note: null }, { id: 'b', loggedDate: '2026-10-20', weightKg: 80.2, note: null }, { id: 'c', loggedDate: '2026-10-30', weightKg: 80.1, note: null }];
    handlers['GET /api/weights'] = () => ({ entries, smoothed: entries.map((e) => ({ date: e.loggedDate, weightKg: e.weightKg })), suggestion: { deltaKcal: -150, reason: 'loss_too_slow' } });
    const { unmount } = open('en');
    expect(await screen.findByText('Calorie suggestion')).toBeInTheDocument();
    expect(screen.getByText(/Suggestion only/)).toBeInTheDocument();
    expect(screen.getByText(/2000 to 1850 kcal/)).toBeInTheDocument();
    unmount();
    handlers['GET /api/profile'] = () => withProfile({ age: 15 });
    open('en');
    await screen.findByRole('heading', { name: 'Body weight' });
    await waitFor(() => expect(screen.queryByText('Calorie suggestion')).toBeNull());
  });
  it('queues the weigh-in in the outbox when offline instead of failing', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    open('en');
    const save = await screen.findByRole('button', { name: 'Save weight' });
    fireEvent.change(screen.getByRole('textbox', { name: 'Today\'s weight' }), { target: { value: '71.5' } });
    fireEvent.click(save);
    await waitFor(() => expect(outbox.list()).toHaveLength(1));
    expect(outbox.list()[0]).toMatchObject({ method: 'POST', path: '/api/weights', body: { weightKg: 71.5 } });
    expect(await screen.findByText(/Saved offline/)).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
  });
  it('adds online via POST and deletes an entry after confirming', async () => {
    const entry = { id: 'w1', loggedDate: '2026-10-30', weightKg: 70, note: null };
    handlers['GET /api/weights'] = () => ({ entries: [entry], smoothed: [], suggestion: null });
    handlers['POST /api/weights'] = () => ({ ok: true });
    handlers['DELETE /api/weights/w1'] = () => ({ ok: true });
    open('en');
    fireEvent.click(await screen.findByRole('button', { name: 'Save weight' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/api/weights')).toBe(true));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete weigh-in from 2026-10-30' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'DELETE' && c.path === '/api/weights/w1')).toBe(true));
  });
  it('has a collapsible glossary with the required terms', async () => {
    const { container } = open('en');
    await screen.findByText('Glossary');
    const details = container.querySelector('details')!;
    expect(details.open).toBe(false);
    for (const term of ['RPE', '1RM', 'PR', 'Deload', 'TDEE', 'BMR', 'Volume', 'Tally marks']) expect(within(details).getByText(term, { selector: 'dt', exact: true })).toBeInTheDocument();
  });
});
