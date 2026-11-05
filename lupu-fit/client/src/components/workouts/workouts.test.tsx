import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import type { ReactNode } from 'react';
import { ApiRequestError } from '../../api/client.ts';
import { LangProvider } from '../../i18n/index.tsx';
import { ToastProvider } from '../../ui/toast.tsx';
import { READY_WORKOUTS } from '../../data/content.ts';

type Handler = (body: unknown, query?: Record<string, unknown>) => unknown;
const routes = new Map<string, Handler>();
const calls: { method: string; path: string; body?: unknown }[] = [];
vi.mock('../../api/client.ts', async (orig) => {
  const real = await orig<typeof import('../../api/client.ts')>();
  const h = (method: string) => async (path: string, a?: unknown, b?: unknown) => {
    const query = method === 'GET' ? (a as Record<string, unknown> | undefined) : undefined;
    const body = method === 'GET' ? undefined : a; void b;
    calls.push({ method, path, ...(body !== undefined ? { body } : {}) });
    const fn = routes.get(`${method} ${path}`);
    if (!fn) throw new real.ApiRequestError(404, 'not_found', {});
    const r = fn(body, query);
    if (r instanceof Error) throw r;
    return r;
  };
  return { ...real, api: { get: h('GET'), post: h('POST'), put: h('PUT'), patch: h('PATCH'), delete: h('DELETE') } };
});

const PROFILE = { language: 'he', theme: 'system', units: 'metric', sex: 'male', age: 30, heightCm: 180, weightKg: 80, goal: 'general_fitness', experience: 'intermediate', place: 'home', equipment: [], injuries: [], daysPerWeek: 3, sessionMinutes: 60, activityLevel: 'moderate', diet: 'omnivore', allergies: [], restrictions: [] };
const ME = { user: { id: 'u1', username: 'abc', role: 'user' }, csrfToken: 'x', onboarded: true, mode: 'hosted' };
let profile = { ...PROFILE } as Record<string, unknown>;

function base(): void {
  routes.clear(); calls.length = 0; profile = { ...PROFILE };
  routes.set('GET /api/auth/me', () => ME);
  routes.set('GET /api/profile', () => ({ profile, targets: {} }));
  routes.set('GET /api/plans', () => ({ plans: [] }));
  routes.set('GET /api/sessions', () => ({ sessions: [] }));
  routes.set('GET /api/readiness', () => ({ checkin: null }));
}

function Where(): ReactNode { const l = useLocation(); return <span data-testid="where">{l.pathname + l.search}</span>; }
async function mount(ui: ReactNode, at: string, lang: 'he' | 'en' = 'he', path = '*') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <LangProvider initialLang={lang}><QueryClientProvider client={qc}><ToastProvider><MemoryRouter initialEntries={[at]}>
      <Routes><Route path={path} element={ui} /></Routes><Where />
    </MemoryRouter></ToastProvider></QueryClientProvider></LangProvider>,
  );
}

beforeEach(() => { base(); try { localStorage.clear(); } catch { /* */ } });

describe('WorkoutsHub', () => {
  it('defaults to ready tab without plans, to plans with plans, and keeps the tab in the URL', async () => {
    const { default: Hub } = await import('../../pages/WorkoutsHub.tsx');
    const u = userEvent.setup();
    await mount(<Hub />, '/workouts');
    expect(await screen.findByText('איפה מתאמנים?')).toBeInTheDocument();
    await u.click(screen.getByRole('tab', { name: 'יצירת תוכנית' }));
    expect(screen.getByTestId('where').textContent).toBe('/workouts?tab=generator');
  });
  it('shows plans first when the user has plans, with active badge, days and actions', async () => {
    routes.set('GET /api/plans', () => ({ plans: [{ id: 'p1', name: 'תוכנית א', active: true, archived: false, createdAt: '2026-10-01T10:00:00Z', plan: { days: [{ day: 'full_a', exercises: [], estimatedMinutes: 30 }, { day: 'full_b', exercises: [], estimatedMinutes: 30 }], notes: [] } }] }));
    const { default: Hub } = await import('../../pages/WorkoutsHub.tsx');
    await mount(<Hub />, '/workouts');
    expect(await screen.findByRole('link', { name: /תוכנית א/ })).toHaveAttribute('href', '/workouts/plans/p1');
    expect(screen.getByText('פעילה')).toBeInTheDocument();
    expect(screen.getByText('2 ימים')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'שכפול' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'הפעלה' })).not.toBeInTheDocument(); // already active
  });
  it('deleting a plan asks for confirmation first', async () => {
    routes.set('GET /api/plans', () => ({ plans: [{ id: 'p1', name: 'P1', active: false, archived: false, createdAt: '2026-10-01T10:00:00Z', plan: { days: [], notes: [] } }] }));
    routes.set('DELETE /api/plans/p1', () => ({ ok: true }));
    const { default: Hub } = await import('../../pages/WorkoutsHub.tsx');
    const u = userEvent.setup();
    await mount(<Hub />, '/workouts?tab=plans');
    await u.click(await screen.findByRole('button', { name: 'מחיקה' }));
    expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
    const dlg = screen.getByRole('dialog');
    await u.click(within(dlg).getByRole('button', { name: 'מחיקה' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'DELETE' && c.path === '/api/plans/p1')).toBe(true));
  });
});

describe('Ready workouts filter', () => {
  it('home + no equipment + bodyweight + chest shows only bodyweight chest workouts, with live counts', async () => {
    const { default: Hub } = await import('../../pages/WorkoutsHub.tsx');
    const u = userEvent.setup();
    await mount(<Hub />, '/workouts?tab=ready');
    await u.click(await screen.findByRole('button', { name: 'בית' }));
    expect(screen.getByText('איזה ציוד יש לך?')).toBeInTheDocument();
    expect(screen.queryByText('משקל גוף או משקולות?')).not.toBeInTheDocument(); // progressive
    await u.click(screen.getByRole('button', { name: 'המשך' }));
    await u.click(screen.getByRole('button', { name: 'משקל גוף' }));
    expect(screen.getByText('איזה שריר?')).toBeInTheDocument();
    const chest = screen.getByRole('button', { name: /^חזה\s*\d+$/ });
    const expected = READY_WORKOUTS.filter((w) => w.place === 'home' && w.mode === 'bodyweight' && w.focus === 'chest' && w.equipment.length === 0);
    expect(Number(chest.textContent!.replace(/\D/g, ''))).toBe(expected.length);
    await u.click(chest);
    const cards = await screen.findAllByRole('link', { name: /^פתיחת / });
    expect(cards.length).toBe(Math.min(12, expected.length));
    for (const c of cards) { const id = c.getAttribute('href')!.split('/').pop()!; const w = READY_WORKOUTS.find((x) => x.id === id)!; expect(w.mode).toBe('bodyweight'); expect(w.focus).toBe('chest'); expect(w.equipment).toEqual([]); expect(w.place).toBe('home'); }
    expect(JSON.parse(localStorage.getItem('lf_ready_filter')!)).toMatchObject({ place: 'home', mode: 'bodyweight', focus: 'chest' });
  });
  it('gym skips the equipment step', async () => {
    const { default: Hub } = await import('../../pages/WorkoutsHub.tsx');
    const u = userEvent.setup();
    await mount(<Hub />, '/workouts?tab=ready', 'en');
    await u.click(await screen.findByRole('button', { name: 'Gym' }));
    expect(screen.queryByText('What equipment do you have?')).not.toBeInTheDocument();
    expect(screen.getByText('Bodyweight or weights?')).toBeInTheDocument();
  });
  it('explains honestly when nothing matches (weights with no gear)', async () => {
    const { default: Hub } = await import('../../pages/WorkoutsHub.tsx');
    const u = userEvent.setup();
    await mount(<Hub />, '/workouts?tab=ready', 'en');
    await u.click(await screen.findByRole('button', { name: 'Home' }));
    await u.click(screen.getByRole('button', { name: 'Continue' }));
    await u.click(screen.getByRole('button', { name: 'Weights' }));
    expect(await screen.findByText('No workouts match these choices')).toBeInTheDocument();
    expect(screen.getByText(/Weights workouts need gear/)).toBeInTheDocument();
  });
  it('shows the hidden counter when an injury hides workouts', async () => {
    profile = { ...PROFILE, injuries: ['shoulder', 'wrist', 'elbow', 'knee', 'lower_back', 'hip', 'ankle', 'neck'], age: 70, experience: 'beginner' };
    const { default: Hub } = await import('../../pages/WorkoutsHub.tsx');
    const u = userEvent.setup();
    await mount(<Hub />, '/workouts?tab=ready');
    await u.click(await screen.findByRole('button', { name: 'חדר כושר' }));
    await u.click(screen.getByRole('button', { name: 'משקולות' }));
    expect(await screen.findByText(/אימונים הוסתרו בשל התאמות גיל או פציעה/)).toBeInTheDocument();
  });
});

describe('Ready wizard summary bar', () => {
  it('collapses finished steps into chips that reopen the step in one tap, and Start over resets', async () => {
    const { default: Hub } = await import('../../pages/WorkoutsHub.tsx');
    const u = userEvent.setup();
    await mount(<Hub />, '/workouts?tab=ready', 'en');
    await u.click(await screen.findByRole('button', { name: 'Gym' }));
    await u.click(screen.getByRole('button', { name: 'Bodyweight' }));
    const summary = screen.getByRole('region', { name: 'Your choices' });
    expect(within(summary).getByRole('button', { name: 'Change: Gym' })).toBeInTheDocument();
    expect(within(summary).getByRole('button', { name: 'Change: Bodyweight' })).toBeInTheDocument();
    expect(screen.getByText('Which muscle?')).toBeInTheDocument();
    await u.click(within(summary).getByRole('button', { name: 'Change: Bodyweight' }));
    expect(screen.getByText('Bodyweight or weights?')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Weights' }));
    expect(screen.queryByText('Bodyweight or weights?')).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('lf_ready_filter')!)).toMatchObject({ place: 'gym', mode: 'weights' });
    await u.click(screen.getByRole('button', { name: 'Start over' }));
    expect(await screen.findByText('Where do you train?')).toBeInTheDocument();
  });
  it('the no-equipment card moves on without the Continue button', async () => {
    const { default: Hub } = await import('../../pages/WorkoutsHub.tsx');
    const u = userEvent.setup();
    await mount(<Hub />, '/workouts?tab=ready', 'en');
    await u.click(await screen.findByRole('button', { name: 'Park' }));
    await u.click(screen.getByRole('button', { name: 'No equipment' }));
    expect(screen.getByText('Bodyweight or weights?')).toBeInTheDocument();
  });
});

describe('Generator tab', () => {
  it('parses free text into avoidIds, warns for 7 days, regenerates with a new seed and saves', async () => {
    const plan = { days: [{ day: 'full_a', estimatedMinutes: 40, exercises: [{ exerciseId: 'push_up', prescription: { sets: 3, repsMin: 8, repsMax: 12, rpe: 7, restSec: 60, loadKg: null, durationSec: null } }] }], notes: [{ code: 'exercise_swapped', from: 'barbell_bench_press', to: 'push_up' }, { code: 'recovery_day_added' }] };
    routes.set('POST /api/plans/generate', () => ({ plan }));
    routes.set('POST /api/plans', () => ({ id: 'new1' }));
    routes.set('GET /api/plans/new1', () => ({}));
    const { default: Hub } = await import('../../pages/WorkoutsHub.tsx');
    const u = userEvent.setup();
    await mount(<Hub />, '/workouts?tab=generator', 'en');
    await u.type(await screen.findByLabelText('Preferences'), 'no jumping, focus on legs');
    expect(screen.getByText('Focus on legs')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Generate plan' }));
    await screen.findByText('Plan preview');
    const gen1 = calls.find((c) => c.path === '/api/plans/generate')!.body as { seed: number; avoidIds: string[] };
    expect(gen1.seed).toBe(1); expect(gen1.avoidIds).toEqual(expect.arrayContaining(['jump_squat']));
    expect(screen.getByText(/was swapped for/)).toBeInTheDocument();
    expect(screen.getByText(/six lifting days plus a recovery day/)).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Regenerate' }));
    await waitFor(() => expect(calls.filter((c) => c.path === '/api/plans/generate')).toHaveLength(2));
    expect((calls.filter((c) => c.path === '/api/plans/generate')[1]!.body as { seed: number }).seed).toBe(2);
    // No active plan yet: the first plan is activated by default so it reaches Home.
    expect(screen.getByRole('switch', { name: 'Activate after saving' })).toBeChecked();
    await u.click(screen.getByRole('button', { name: 'Save plan' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/api/plans')).toBe(true));
    expect((calls.find((c) => c.method === 'POST' && c.path === '/api/plans')!.body as { activate: boolean }).activate).toBe(true);
  });
  it('keeps an existing active plan by default, and the toggle still activates the new one on request', async () => {
    const plan = { days: [{ day: 'full_a', estimatedMinutes: 40, exercises: [{ exerciseId: 'push_up', prescription: { sets: 3, repsMin: 8, repsMax: 12, rpe: 7, restSec: 60, loadKg: null, durationSec: null } }] }], notes: [] };
    routes.set('GET /api/plans', () => ({ plans: [{ id: 'p1', name: 'Mine', active: true, archived: false, createdAt: '2026-10-01T10:00:00Z', plan }] }));
    routes.set('POST /api/plans/generate', () => ({ plan }));
    routes.set('POST /api/plans', () => ({ id: 'new1' }));
    const { default: Hub } = await import('../../pages/WorkoutsHub.tsx');
    const u = userEvent.setup();
    await mount(<Hub />, '/workouts?tab=generator', 'en');
    await u.click(await screen.findByRole('button', { name: 'Generate plan' }));
    await screen.findByText('Plan preview');
    const toggle = screen.getByRole('switch', { name: 'Activate after saving' });
    expect(toggle).not.toBeChecked();
    await u.click(toggle);
    expect(toggle).toBeChecked();
    await u.click(screen.getByRole('button', { name: 'Save plan' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/api/plans')).toBe(true));
    expect((calls.find((c) => c.method === 'POST' && c.path === '/api/plans')!.body as { activate: boolean }).activate).toBe(true);
  });
  it('shows the seven-day recovery note when 7 days are chosen', async () => {
    const { default: Hub } = await import('../../pages/WorkoutsHub.tsx');
    const u = userEvent.setup();
    await mount(<Hub />, '/workouts?tab=generator', 'en');
    const input = await screen.findByLabelText('Days per week', { selector: 'input' });
    await u.clear(input); await u.type(input, '7');
    expect(await screen.findByText('Seven days means six lifting days plus a recovery day.')).toBeInTheDocument();
  });
});

describe('ReadyDetail', () => {
  const w = READY_WORKOUTS.find((x) => x.place === 'gym' && x.mode === 'weights')!;
  const open = async (lang: 'he' | 'en' = 'he') => { const { default: Ready } = await import('../../pages/ReadyDetail.tsx'); return mount(<Ready />, `/workouts/ready/${w.id}`, lang, '/workouts/ready/:readyId'); };

  it('shows the page header and a content-shaped skeleton (no bare spinner) while the profile loads', async () => {
    routes.set('GET /api/profile', () => new Promise(() => undefined));
    const { container } = await open('en');
    expect(await screen.findByRole('heading', { level: 1, name: w.nameEn })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(container.querySelector('.spinner')).toBeNull();
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });

  it('shows the exact finisher label, defaults to bodyweight, disables gear when not owned, remembers the sport', async () => {
    profile = { ...PROFILE, place: 'home', equipment: [] };
    const u = userEvent.setup();
    const { unmount } = await open();
    await u.click(await screen.findByRole('button', { name: 'כדורגל' }));
    expect(await screen.findByRole('button', { name: 'בלי ציוד' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'עם ציוד' })).toBeDisabled();
    expect(screen.getByText('זו הכנה גופנית כללית ולא אימון מיומנות בענף.', { exact: false })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('lf_sport')!)).toEqual({ u1: 'soccer' });
    unmount();
    await open();
    await waitFor(async () => expect(await screen.findByRole('button', { name: 'כדורגל' })).toHaveAttribute('aria-pressed', 'true'));
  });
  it('English label is exact too, seniors start gentle, gear is enabled for a gym', async () => {
    profile = { ...PROFILE, age: 70, place: 'gym', equipment: [] };
    const u = userEvent.setup();
    await open('en');
    expect(await screen.findByRole('group', { name: 'Train for a specific sport? You can add a 10-minute finisher at the end of the workout' })).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Running' }));
    expect(await screen.findByRole('button', { name: 'Gentle' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'With gear' })).toBeEnabled();
  });
  it('starts the workout with the finisher rows, sport, local date and navigates; 409 offers resume', async () => {
    profile = { ...PROFILE, place: 'gym', equipment: [] };
    routes.set('POST /api/sessions', () => ({ id: 's1' }));
    const u = userEvent.setup();
    await open();
    await u.click(await screen.findByRole('button', { name: 'כדורגל' }));
    await u.click(screen.getByRole('button', { name: 'להתחיל אימון' }));
    await waitFor(() => expect(calls.some((c) => c.path === '/api/sessions')).toBe(true));
    const body = calls.find((c) => c.path === '/api/sessions')!.body as { source: string; sourceId: string; sport: string; localDate: string; exercises: { isFinisher: boolean; sport?: string; planned: { durationSec: number | null } }[] };
    expect(body.source).toBe('ready'); expect(body.sourceId).toBe(w.id); expect(body.sport).toBe('soccer'); expect(body.localDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const fin = body.exercises.filter((e) => e.isFinisher);
    expect(fin.length).toBeGreaterThan(0); expect(fin.every((e) => e.sport === 'soccer' && e.planned.durationSec === 30)).toBe(true);
    expect(body.exercises.filter((e) => !e.isFinisher).length).toBeGreaterThan(2);
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/workouts/session'));
  });
  it('on 409 session_in_progress shows a resume link and does not navigate', async () => {
    profile = { ...PROFILE, place: 'gym' };
    routes.set('POST /api/sessions', () => new ApiRequestError(409, 'session_in_progress', { sessionId: 'x' }));
    const u = userEvent.setup();
    await open('en');
    await u.click(await screen.findByRole('button', { name: 'Start workout' }));
    expect(await screen.findByRole('link', { name: 'Resume it' })).toHaveAttribute('href', '/workouts/session');
  });
  it('a check-in posts to /api/readiness and re-personalises', async () => {
    let saved: unknown = null;
    routes.set('POST /api/readiness', (b) => { saved = { ...(b as object), state: 'easier' }; return { state: 'easier' }; });
    routes.set('GET /api/readiness', () => ({ checkin: saved }));
    const u = userEvent.setup();
    await open('en');
    await u.click(await screen.findByRole('button', { name: 'Check in' }));
    await u.click(await screen.findByRole('button', { name: 'Save check-in' }));
    await waitFor(() => expect(calls.find((c) => c.method === 'POST' && c.path === '/api/readiness')).toBeTruthy());
    const b = calls.find((c) => c.method === 'POST' && c.path === '/api/readiness')!.body as { localDate: string; pain: boolean };
    expect(b.localDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); expect(b.pain).toBe(false);
    expect(await screen.findByText('Today: Take it easier')).toBeInTheDocument();
  });
});

describe('History weeks', () => {
  it('groups sessions by week with a weekly summary', async () => {
    routes.set('GET /api/sessions', () => ({ sessions: [
      { id: 'a', name: 'A', sport: null, startedAt: '', finishedAt: 'x', durationSec: 1800, localDate: '2026-11-02', xpAwarded: 40, sets: 9, hasFinisher: false },
      { id: 'b', name: 'B', sport: null, startedAt: '', finishedAt: 'x', durationSec: 1800, localDate: '2026-11-03', xpAwarded: 30, sets: 6, hasFinisher: false },
      { id: 'c', name: 'C', sport: null, startedAt: '', finishedAt: 'x', durationSec: 1200, localDate: '2026-10-01', xpAwarded: 20, sets: 5, hasFinisher: false },
    ] }));
    const { default: History } = await import('../../pages/History.tsx');
    await mount(<History />, '/workouts/history', 'en');
    const weeks = await screen.findAllByRole('region');
    expect(weeks).toHaveLength(2);
    expect(within(weeks[0]!).getByText('15')).toBeInTheDocument(); // 9 + 6 sets
    expect(within(weeks[0]!).getByText('70')).toBeInTheDocument(); // 40 + 30 XP
  });
});

describe('History', () => {
  it('shows the sport finisher chip only for sessions with a finisher, and asks before deleting', async () => {
    routes.set('GET /api/sessions', () => ({ sessions: [
      { id: 'a', name: 'חזה', sport: 'soccer', startedAt: '2026-11-02T08:00:00Z', finishedAt: '2026-11-02T09:00:00Z', durationSec: 3000, localDate: '2026-11-02', xpAwarded: 60, sets: 12, hasFinisher: true },
      { id: 'b', name: 'גב', sport: null, startedAt: '2026-11-01T08:00:00Z', finishedAt: '2026-11-01T09:00:00Z', durationSec: 1800, localDate: '2026-11-01', xpAwarded: 50, sets: 9, hasFinisher: false },
    ] }));
    routes.set('DELETE /api/sessions/b', () => ({ ok: true }));
    const { default: History } = await import('../../pages/History.tsx');
    const u = userEvent.setup();
    await mount(<History />, '/workouts/history');
    expect(await screen.findByText('סיומת ספורט: כדורגל')).toBeInTheDocument();
    expect(screen.getAllByText(/סיומת ספורט/)).toHaveLength(1);
    expect(screen.getByRole('link', { name: /פתיחת סיכום של חזה/ })).toHaveAttribute('href', '/workouts/sessions/a');
    await u.click(screen.getByRole('button', { name: 'מחיקה: גב' }));
    expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
    expect(screen.getByText(/לא ניתן לבטל|אי אפשר לבטל/)).toBeInTheDocument();
    await u.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'מחיקה' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'DELETE' && c.path === '/api/sessions/b')).toBe(true));
  });
  it('keeps the page header (title + back) while the history loads', async () => {
    routes.set('GET /api/sessions', () => new Promise(() => undefined));
    const { default: History } = await import('../../pages/History.tsx');
    await mount(<History />, '/workouts/history', 'en');
    expect(await screen.findByRole('heading', { level: 1, name: 'Workout history' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });
  it('shows an honest empty state', async () => {
    const { default: History } = await import('../../pages/History.tsx');
    await mount(<History />, '/workouts/history', 'en');
    expect(await screen.findByText('No finished workouts yet')).toBeInTheDocument();
  });
});

describe('SessionSummary', () => {
  const session = { id: 's1', name: 'Chest day', source: 'ready', sport: 'soccer', startedAt: '2026-11-02T08:00:00Z', finishedAt: '2026-11-02T09:00:00Z', durationSec: 3000, localDate: '2026-11-02', xpAwarded: 56, exercises: [
    { id: 'e1', position: 0, exerciseId: 'barbell_bench_press', isFinisher: false, sport: null, sets: [{ id: 't1', setNo: 1, reps: 8, weightKg: 60, durationSec: null, rpe: 7 }, { id: 't2', setNo: 2, reps: 8, weightKg: 60, durationSec: null, rpe: 8 }] },
    { id: 'e2', position: 1, exerciseId: 'high_knees', isFinisher: true, sport: 'soccer', sets: [{ id: 't3', setNo: 1, reps: null, weightKg: null, durationSec: 30, rpe: null }] },
  ] };
  const finish = { sessionId: 's1', durationSec: 3000, totalSets: 3, volumeKg: 960, prs: [{ exerciseId: 'barbell_bench_press', kind: 'weight', value: 62.5, previous: 60 }], xp: [{ type: 'workout', amount: 50 }, { type: 'sets', amount: 6 }], xpTotal: 56, achievements: ['first_workout'], levelBefore: 1, levelAfter: 2, sport: 'soccer', finisherCount: 1 };
  const open = async (state?: unknown, body: unknown = session) => {
    routes.set('GET /api/sessions/s1', () => body);
    const { default: Summary } = await import('../../pages/SessionSummary.tsx');
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(<LangProvider initialLang="en"><QueryClientProvider client={qc}><ToastProvider><MemoryRouter initialEntries={[{ pathname: '/workouts/sessions/s1', state }]}><Routes><Route path="/workouts/sessions/:id" element={<Summary />} /></Routes></MemoryRouter></ToastProvider></QueryClientProvider></LangProvider>);
  };
  it('without finish state: only data from the session, finisher section marked with the sport, no celebration', async () => {
    await open();
    expect(await screen.findByText('Chest day')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sport finisher: Soccer' })).toBeInTheDocument();
    expect(screen.queryByText('Great work')).not.toBeInTheDocument();
    expect(screen.getByText('960')).toBeInTheDocument(); // 60*8*2 computed from sets
  });
  it('with the finish response: XP breakdown, level change, PR old to new, achievements, finisher recorded', async () => {
    await open({ finish });
    expect(await screen.findByText('Great work')).toBeInTheDocument();
    expect(screen.getByText('Level 1 to level 2')).toBeInTheDocument();
    expect(screen.getByText(/Workout completed/)).toBeInTheDocument();
    expect(screen.getByText(/Sets logged/)).toBeInTheDocument();
    expect(screen.getByText(/Heaviest weight/)).toBeInTheDocument();
    expect(screen.getByText('62.5')).toBeInTheDocument();
    expect(screen.getByText('First workout')).toBeInTheDocument();
    expect(screen.getByText('Sport finisher recorded: Soccer')).toBeInTheDocument();
  });
  it('copies a summary containing only real data', async () => {
    const u = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    await open({ finish });
    await u.click(await screen.findByRole('button', { name: /Copy summary/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const text = writeText.mock.calls[0]![0] as string;
    expect(text).toContain('Chest day'); expect(text).toContain('960 kg'); expect(text).toContain('60 to 62.5');
  });
  it('bodyweight sessions show total reps instead of a "0 kg" volume, in the tiles and the copied text', async () => {
    const bw = { ...session, exercises: [{ id: 'e1', position: 0, exerciseId: 'push_up', isFinisher: false, sport: null, sets: [{ id: 't1', setNo: 1, reps: 10, weightKg: null, durationSec: null, rpe: 7 }, { id: 't2', setNo: 2, reps: 12, weightKg: null, durationSec: null, rpe: 8 }] }] };
    const u = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    await open(undefined, bw);
    expect(await screen.findByRole('heading', { level: 1, name: 'Chest day' })).toBeInTheDocument();
    expect(screen.queryByText('Volume')).toBeNull();
    expect(screen.getByText('Total reps')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: /Copy summary/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const text = writeText.mock.calls.at(-1)![0] as string;
    expect(text).toContain('2 sets, 22 reps'); expect(text).not.toContain('kg');
  });
  it('keeps the page header (title + back) while the session loads', async () => {
    await open(undefined, new Promise(() => undefined));
    expect(await screen.findByRole('heading', { level: 1, name: 'Workout summary' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });
});

describe('PlanDetail', () => {
  const plan = { id: 'p1', name: 'My plan', active: false, archived: false, createdAt: '2026-10-01T10:00:00Z', plan: { notes: [], days: [{ day: 'full_a', estimatedMinutes: 40, exercises: [
    { exerciseId: 'barbell_bench_press', prescription: { sets: 3, repsMin: 8, repsMax: 10, rpe: 7, restSec: 90, loadKg: 60, durationSec: null } },
    { exerciseId: 'push_up', prescription: { sets: 3, repsMin: 8, repsMax: 12, rpe: 7, restSec: 60, loadKg: null, durationSec: null } },
  ] }] } };
  const open = async () => {
    routes.set('GET /api/plans', () => ({ plans: [plan] }));
    routes.set('PUT /api/plans/p1/plan', () => ({ ok: true }));
    const { default: Plan } = await import('../../pages/PlanDetail.tsx');
    return mount(<Plan />, '/workouts/plans/p1', 'en', '/workouts/plans/:planId');
  };
  it('reordering creates an unsaved draft that PUTs the edited plan', async () => {
    const u = userEvent.setup();
    await open();
    await u.click(await screen.findByRole('button', { name: 'Move down: Barbell Bench Press' }).catch(() => screen.findByRole('button', { name: /^Move down/ })));
    expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'PUT' && c.path === '/api/plans/p1/plan')).toBe(true));
    const sent = calls.find((c) => c.method === 'PUT')!.body as { plan: { days: { exercises: { exerciseId: string }[] }[] } };
    expect(sent.plan.days[0]!.exercises[0]!.exerciseId).toBe('push_up');
  });
  it('apply progression with no history is honest and writes nothing', async () => {
    routes.set('GET /api/exercises/barbell_bench_press/history', () => ({ exerciseId: 'barbell_bench_press', history: [], record: null }));
    const u = userEvent.setup();
    await open();
    await u.click(await screen.findByRole('button', { name: 'Apply progression' }));
    expect(await screen.findByText(/No history for the exercises in this plan yet/)).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'PUT')).toBe(false);
  });
  it('apply progression with history raises the load and persists it', async () => {
    const s = (d: string) => ({ sessionId: d, date: d, sets: [1, 2, 3].map((n) => ({ setNo: n, reps: 10, weightKg: 60, durationSec: null, rpe: 8 })) });
    routes.set('GET /api/exercises/barbell_bench_press/history', () => ({ exerciseId: 'barbell_bench_press', history: [s('2026-11-02'), s('2026-10-30')], record: null }));
    const u = userEvent.setup();
    await open();
    await u.click(await screen.findByRole('button', { name: 'Apply progression' }));
    expect(await screen.findByText('1 weight updated from your history.')).toBeInTheDocument();
    const sent = calls.find((c) => c.method === 'PUT')!.body as { plan: { days: { exercises: { prescription: { loadKg: number | null } }[] }[] } };
    expect(sent.plan.days[0]!.exercises[0]!.prescription.loadKg).toBe(62.5);
  });
  it('swap sheet disables unsafe alternatives with the reason and starting a day posts source plan', async () => {
    profile = { ...PROFILE, place: 'home', equipment: [], injuries: ['shoulder'] };
    routes.set('POST /api/sessions', () => ({ id: 's' }));
    const u = userEvent.setup();
    await open();
    const swapButtons = await screen.findAllByRole('button', { name: 'Swap' });
    await u.click(swapButtons[1]!);
    const dlg = await screen.findByRole('dialog');
    const reasons = within(dlg).queryAllByText(/Unsafe for your injuries|You do not have the gear|Above your level|Not suitable for your age/);
    expect(reasons.length).toBeGreaterThan(0);
    for (const b of within(dlg).getAllByRole('button', { name: /^Swap to / })) { const row = b.closest('.wk-alt')!; if (row.getAttribute('data-unsafe') === 'true') expect(b).toBeDisabled(); else expect(b).toBeEnabled(); }
    await u.click(within(dlg).getByRole('button', { name: 'Close' }));
    await u.click(screen.getByRole('button', { name: 'Start this day' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/api/sessions')).toBe(true));
    const body = calls.find((c) => c.method === 'POST' && c.path === '/api/sessions')!.body as { source: string; sourceId: string };
    expect(body.source).toBe('plan'); expect(body.sourceId).toBe('p1:0');
  });
});
