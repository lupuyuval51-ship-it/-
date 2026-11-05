import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { calls, handlers, renderPage, resetApi, withProfile } from './test-harness.tsx';

vi.mock('../api/client.ts', async (orig) => ({ ...(await orig<typeof import('../api/client.ts')>()), api: (await import('./test-harness.tsx')).apiStub }));
const { default: Home } = await import('./Home.tsx');
const { localIso } = await import('../components/home/dates.ts');

const today = localIso();
const planDay = (d: string) => ({ day: d, exercises: [{ exerciseId: 'push_up', prescription: {} }, { exerciseId: 'squat', prescription: {} }], estimatedMinutes: 42 });
const emptyFood = { date: today, entries: [], totals: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 } };
const stats = { xp: 40, level: { level: 1, xpIntoLevel: 40, xpForNext: 100 }, achievements: [], allAchievementIds: [] };
const primaryButtons = () => document.querySelectorAll('.btn-primary');

beforeEach(() => {
  resetApi();
  handlers['GET /api/profile'] = () => withProfile();
  handlers['GET /api/sessions/active'] = () => ({ session: null });
  handlers['GET /api/sessions'] = () => ({ sessions: [] });
  handlers['GET /api/plans'] = () => ({ plans: [] });
  handlers['GET /api/readiness'] = () => ({ checkin: null });
  handlers['GET /api/food-log'] = () => emptyFood;
  handlers['GET /api/stats'] = () => stats;
  handlers['GET /api/weights'] = () => ({ entries: [] });
  handlers['GET /api/coach/threads'] = () => ({ threads: [] });
});

describe('Home', () => {
  it('greets by name, suggests a ready workout without a plan, and has exactly one primary button', async () => {
    renderPage(<Home />, { lang: 'en' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Hi, Dana' })).toBeInTheDocument();
    expect(await screen.findByText(/No active plan yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open workout' }).getAttribute('href')).toMatch(/^\/workouts\/ready\//);
    expect(primaryButtons()).toHaveLength(1);
  });
  it('uses the active plan and picks the next day from this week finished plan sessions', async () => {
    handlers['GET /api/plans'] = () => ({ plans: [{ id: 'p1', name: 'My plan', active: true, archived: false, plan: { days: [planDay('upper'), planDay('lower'), planDay('push')] } }] });
    handlers['GET /api/sessions'] = () => ({ sessions: [{ id: 's1', name: 'x', source: 'plan', sourceId: 'p1', localDate: today }] });
    renderPage(<Home />, { lang: 'en' });
    expect(await screen.findByText('Lower body')).toBeInTheDocument();
    expect(screen.getByText(/Day 2 of 3 in your plan/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open workout' })).toHaveAttribute('href', '/workouts/plans/p1');
  });
  it('reads a plans cache entry written by the workouts screens (same key, same array shape)', async () => {
    const { QueryClient } = await import('@tanstack/react-query');
    const { usePlans } = await import('../components/workouts/plansApi.ts');
    const { renderHook, waitFor: wf } = await import('@testing-library/react');
    const { QueryClientProvider } = await import('@tanstack/react-query');
    handlers['GET /api/plans'] = () => ({ plans: [{ id: 'p1', name: 'My plan', active: true, archived: false, plan: { days: [planDay('upper')] } }] });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60_000 } } });
    const hook = renderHook(() => usePlans(), { wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider> });
    await wf(() => expect(hook.result.current.data).toHaveLength(1));
    hook.unmount();
    const before = calls.filter((c) => c.path === '/api/plans').length;
    renderPage(<Home />, { lang: 'en', client });
    expect(await screen.findByText('Upper body')).toBeInTheDocument(); // the fresh cached array is used as-is, no refetch needed
    expect(screen.getByRole('link', { name: 'Open workout' })).toHaveAttribute('href', '/workouts/plans/p1');
    expect(calls.filter((c) => c.path === '/api/plans').length).toBe(before);
  });
  it('shows the resume card as the only primary action when a session is active', async () => {
    handlers['GET /api/sessions/active'] = () => ({ session: { id: 'a', name: 'Chest day', exercises: [{ id: 'e', sets: [{}, {}] }] } });
    renderPage(<Home />, { lang: 'he' });
    expect(await screen.findByText('Chest day')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'המשך אימון' })).toHaveAttribute('href', '/workouts/session');
    expect(screen.queryByText('האימון של היום')).toBeNull();
    expect(primaryButtons()).toHaveLength(1);
  });
  it('submits the readiness check-in and shows the resulting state label', async () => {
    handlers['POST /api/readiness'] = () => ({ state: 'easier' });
    renderPage(<Home />, { lang: 'he' });
    fireEvent.click(await screen.findByRole('button', { name: 'בסדר' }));
    await waitFor(() => expect(calls.find((c) => c.method === 'POST' && c.path === '/api/readiness')?.body).toMatchObject({ localDate: today, sleep: 3, energy: 3, soreness: 2, pain: false }));
    expect(await screen.findByText('כדאי אימון קל יותר')).toBeInTheDocument();
  });
  it('shows an honest zero for the weekly tally and today nutrition bars against profile targets', async () => {
    handlers['GET /api/food-log'] = () => ({ ...emptyFood, entries: [{ slot: 'breakfast' }], totals: { kcal: 2300, proteinG: 60, carbsG: 100, fatG: 20 } });
    renderPage(<Home />, { lang: 'en' });
    expect(await screen.findByText('No workouts logged yet this week.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '0 of 3 workouts this week' })).toBeInTheDocument();
    const kcal = await screen.findByRole('progressbar', { name: 'Calories' });
    await waitFor(() => expect(kcal).toHaveAttribute('aria-valuenow', '2300'));
    expect(kcal.className).toContain('over');
    // Today's calories and protein appear once (the nutrition card), not again as KPI tiles.
    expect(screen.queryByText('Calories today')).toBeNull();
    expect(screen.queryByText('Protein today')).toBeNull();
  });
  it('lists next meal from the daily menu with a link to the menu', async () => {
    renderPage(<Home />, { lang: 'en' });
    expect(await screen.findByText(/Up next:/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Full menu/ })).toHaveAttribute('href', '/nutrition/menu');
  });
  it('names the same next dish as the daily menu page for the stored choice (meal count, generate again, swaps)', async () => {
    const { menuFor } = await import('../components/nutrition/logic.ts');
    const { saveChoice } = await import('../components/nutrition/menuStore.ts');
    const { nextMenuItem } = await import('../components/home/homeLogic.ts');
    const { DISHES, DISH_BY_ID } = await import('../data/content.ts');
    const { lookup } = await import('../i18n/index.tsx');
    const { profile, targets } = withProfile();
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 10, 5, 7, 0) });
    try {
      const day = localIso();
      for (const choice of [{ mealCount: 3 as const, shuffle: 2, swaps: [0, 1] }, { mealCount: 5 as const, shuffle: 0, swaps: [] }]) {
        localStorage.clear();
        saveChoice(day, choice);
        const menu = menuFor(DISHES, targets.kcal, day, choice, { diet: profile.diet, restrictions: profile.restrictions, allergies: profile.allergies });
        const expected = nextMenuItem(menu.items, new Set(), 7)!;
        const { unmount } = renderPage(<Home />, { lang: 'en' });
        const teaser = (await screen.findByText(/Up next:/)).closest('.home-menu') as HTMLElement;
        expect(teaser).toHaveTextContent(`Up next: ${lookup('en', `label.slot.${expected.slot}`)}`);
        expect(teaser).toHaveTextContent(DISH_BY_ID.get(expected.dishId)!.nameEn);
        unmount();
      }
    } finally {
      vi.useRealTimers();
      localStorage.clear();
    }
  });
  it('shows the getting-started checklist from real data and hides it when everything is done', async () => {
    const { unmount } = renderPage(<Home />, { lang: 'en' });
    expect(await screen.findByText('Getting started')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Finish your first workout' })).toHaveAttribute('href', '/workouts');
    expect(screen.queryByText('Quick actions')).toBeNull(); // the checklist already links weigh-in and coach
    unmount();
    handlers['GET /api/sessions'] = () => ({ sessions: [{ id: 's', name: 'x', source: 'custom', localDate: '2026-01-01' }] });
    handlers['GET /api/food-log'] = () => ({ ...emptyFood, entries: [{ slot: 'lunch' }] });
    handlers['GET /api/weights'] = () => ({ entries: [{}] });
    handlers['GET /api/coach/threads'] = () => ({ threads: [{}] });
    renderPage(<Home />, { lang: 'en' });
    await screen.findByText('Quick actions');
    await waitFor(() => expect(calls.filter((c) => c.path === '/api/coach/threads').length).toBeGreaterThan(0));
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText('Getting started')).toBeNull();
  });
});
