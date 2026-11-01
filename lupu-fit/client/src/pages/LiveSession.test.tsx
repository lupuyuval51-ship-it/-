import 'fake-indexeddb/auto';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Language } from '@lupu-fit/shared';
import { ApiRequestError, NetworkError } from '../api/client.ts';
import { LangProvider } from '../i18n/index.tsx';
import { restKey } from '../lib/restTimer.ts';

interface Call { method: string; path: string; body?: unknown }
const calls: Call[] = [];
let handler: (c: Call) => unknown = () => ({});
vi.mock('../api/client.ts', async (orig) => {
  const real = await orig<typeof import('../api/client.ts')>();
  const h = (method: string) => async (path: string, body?: unknown) => {
    const c: Call = { method, path, ...(method === 'GET' ? {} : { body }) }; calls.push(c);
    const r = handler(c); if (r instanceof Error) throw r; return r;
  };
  return { ...real, api: { get: h('GET'), post: h('POST'), put: h('PUT'), patch: h('PATCH'), delete: h('DELETE') } };
});
const { default: LiveSession } = await import('./LiveSession.tsx');
const { outbox } = await import('../lib/outbox.ts');

const planned = { sets: 3, repsMin: 8, repsMax: 10, rpe: 8, restSec: 90, loadKg: 60, durationSec: null };
const mkSession = (over: Record<string, unknown> = {}, bench: unknown[] = []) => ({
  id: 's1', name: 'Push day', sport: 'soccer', startedAt: '2026-01-01T10:00:00Z', readiness: null,
  exercises: [
    { id: 'e1', exerciseId: 'barbell_bench_press', isFinisher: false, sport: null, planned, sets: bench },
    { id: 'e2', exerciseId: 'push_up', isFinisher: false, sport: null, planned: { ...planned, loadKg: null, rpe: 9 }, sets: [] },
    { id: 'e3', exerciseId: 'jump_rope', isFinisher: true, sport: 'soccer', planned: { sets: 3, repsMin: 0, repsMax: 0, rpe: 6, restSec: 30, loadKg: null, durationSec: 30 }, sets: [] },
  ],
  ...over,
});
const profile = (over: Record<string, unknown> = {}) => ({ profile: { age: 30, equipment: ['barbell', 'bench'], injuries: [], experience: 'intermediate', language: 'he', ...over }, targets: {} });
const hist = (w: number, reps: number[], id: string) => ({ sessionId: id, date: '2026-01-01', sets: reps.map((r, i) => ({ setNo: i + 1, reps: r, weightKg: w, durationSec: null, rpe: 8 })) });
const topTwice = { history: [hist(60, [10, 10, 10], 'b'), hist(60, [10, 10, 10], 'a')] };

interface Cfg { session?: unknown; prof?: unknown; history?: unknown; extra?: (c: Call) => unknown }
function setup(cfg: Cfg = {}) {
  handler = (c) => {
    const x = cfg.extra?.(c); if (x !== undefined) return x;
    if (c.method === 'GET' && c.path === '/api/sessions/active') return { session: cfg.session === undefined ? mkSession() : cfg.session };
    if (c.method === 'GET' && c.path === '/api/profile') return cfg.prof === undefined ? profile() : cfg.prof;
    if (c.method === 'GET' && c.path.endsWith('/history')) return cfg.history ?? { history: [] };
    if (c.method === 'POST' && c.path.endsWith('/sets')) return { id: 'new1', sessionExerciseId: (c.body as { sessionExerciseId: string }).sessionExerciseId, setNo: 1, ...(c.body as object) };
    return { ok: true };
  };
}
function Where() { const l = useLocation(); return <div data-testid="where">{l.pathname}|{JSON.stringify((l.state as { finish?: unknown } | null)?.finish ?? null)}</div>; }
function view(lang: Language = 'he') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <LangProvider initialLang={lang}><QueryClientProvider client={qc}><MemoryRouter initialEntries={['/workouts/session']}>
      <Routes><Route path="/workouts/session" element={<LiveSession />} /><Route path="*" element={<Where />} /></Routes>
    </MemoryRouter></QueryClientProvider></LangProvider>,
  );
}
const setOnline = (v: boolean) => { onlineManager.setOnline(v); Object.defineProperty(navigator, 'onLine', { value: v, configurable: true }); act(() => { window.dispatchEvent(new Event(v ? 'online' : 'offline')); }); };
const finishSet = () => screen.findByRole('button', { name: 'סיום סט' });

beforeEach(async () => { calls.length = 0; localStorage.clear(); setOnline(true); for (const i of outbox.list()) await outbox.remove(i.id); vi.spyOn(window, 'confirm').mockReturnValue(true); });
afterEach(() => { vi.restoreAllMocks(); });

describe('LiveSession', () => {
  it('shows an honest empty state with a link to /workouts when no session is active', async () => {
    setup({ session: null }); view();
    expect(await screen.findByText('אין אימון פעיל')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'לעמוד האימונים' })).toHaveAttribute('href', '/workouts');
  });

  it('shows the current exercise: linked name, prescription chips, previous performance, progression, and exactly one primary button', async () => {
    setup({ history: topTwice }); const { container } = view();
    const link = await screen.findByRole('link', { name: 'לחיצת חזה במוט' });
    expect(link).toHaveAttribute('href', '/exercises/barbell_bench_press');
    expect(screen.getByText('3 סטים × 8–10 חזרות')).toBeInTheDocument();
    expect(screen.getByText('מנוחה 90 שנ׳')).toBeInTheDocument();
    expect(await screen.findByText(/אחרון:/)).toHaveTextContent('אחרון: 3×10 · 60 ק״ג');
    expect(await screen.findByText('מומלץ: +2.5 ק״ג')).toBeInTheDocument();
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(1);
    expect(screen.getByText(/סיומת ספורט — כדורגל \(כ-\d+ דק׳\)/)).toBeInTheDocument();
    expect(calls.some((c) => c.path === '/api/exercises/barbell_bench_press/history')).toBe(true);
  });

  it('renders the finisher header in English too', async () => {
    setup(); view('en');
    expect(await screen.findByText(/Sport finisher — Soccer \(about \d+ min\)/)).toBeInTheDocument();
  });

  it('freezes the progression badge when readiness is easier', async () => {
    setup({ session: mkSession({ readiness: 'easier' }), history: topTwice }); view();
    expect(await screen.findByText('קבוע בגלל מוכנות נמוכה')).toBeInTheDocument();
    expect(screen.queryByText(/מומלץ: \+/)).not.toBeInTheDocument();
  });

  it('logs a set with a prefilled progression weight, shows it, and starts a persisted rest timer', async () => {
    setup({ history: topTwice }); view();
    await screen.findByText('מומלץ: +2.5 ק״ג');
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'משקל' })).toHaveValue('62.5'));
    fireEvent.click(await finishSet());
    await waitFor(() => expect(calls.find((c) => c.method === 'POST' && c.path === '/api/sessions/s1/sets')).toBeTruthy());
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ sessionExerciseId: 'e1', reps: 10, weightKg: 62.5, rpe: 8 });
    expect(await screen.findByTestId('rest-readout')).toHaveTextContent('1:30');
    expect(JSON.parse(localStorage.getItem(restKey('s1')) as string).restEndsAtEpochMs).toBeGreaterThan(Date.now());
    fireEvent.click(screen.getByRole('button', { name: 'דילוג על המנוחה' }));
    expect(screen.queryByTestId('rest-readout')).not.toBeInTheDocument();
  });

  it('queues the set when the network is down, shows a pending row, and undo removes it from the outbox without calling the server', async () => {
    setup({ extra: (c) => (c.method === 'POST' && c.path.endsWith('/sets') ? new NetworkError() : undefined) }); view();
    fireEvent.click(await finishSet());
    expect(await screen.findByText('ממתין לסנכרון', { selector: '.tag' })).toBeInTheDocument();
    expect(outbox.list()).toHaveLength(1);
    expect(outbox.list()[0]).toMatchObject({ method: 'POST', path: '/api/sessions/s1/sets', body: { sessionExerciseId: 'e1', reps: 10, weightKg: 60, rpe: 8 } });
    expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
    const undoBtn = screen.getByRole('button', { name: 'ביטול הסט האחרון' });
    await waitFor(() => expect(undoBtn).toBeEnabled()); // enabled again once the logging call settled
    fireEvent.click(undoBtn);
    await waitFor(() => expect(outbox.list()).toHaveLength(0));
    expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
  });

  it('undo deletes the last server set', async () => {
    const set = { id: 'set9', sessionExerciseId: 'e1', setNo: 1, reps: 8, weightKg: 60, durationSec: null, rpe: 8 };
    setup({ session: mkSession({}, [set]) }); view();
    fireEvent.click(await screen.findByRole('button', { name: 'ביטול הסט האחרון' }));
    await waitFor(() => expect(calls.find((c) => c.method === 'DELETE')?.path).toBe('/api/sessions/s1/sets/set9'));
  });

  it('caps the RPE chips at 7 for minors and never offers a load increase', async () => {
    setup({ prof: profile({ age: 15 }), history: topTwice }); view();
    const group = await screen.findByRole('group', { name: 'RPE' });
    await waitFor(() => expect(within(group).queryByRole('button', { name: '8' })).not.toBeInTheDocument());
    expect(within(group).getByRole('button', { name: '7' })).toHaveAttribute('aria-pressed', 'true'); // planned RPE 8 is clamped to 7
    fireEvent.click(within(group).getByRole('button', { name: 'חצאי דרגה' }));
    const grid = screen.getAllByRole('group', { name: 'חצאי דרגה' })[0] as HTMLElement;
    expect(within(grid).queryByRole('button', { name: '7.5' })).not.toBeInTheDocument();
    expect(within(grid).getAllByRole('button').at(-1)).toHaveTextContent('7');
    expect(await screen.findByText('בראש הטווח: לשמור על טכניקה נקייה')).toBeInTheDocument();
    expect(screen.queryByText(/מומלץ: \+/)).not.toBeInTheDocument();
    fireEvent.click(await finishSet());
    await waitFor(() => expect(calls.find((c) => c.method === 'POST')?.body).toMatchObject({ rpe: 7 }));
  });

  it('keeps the minor RPE cap when the profile cannot be loaded (last known age bucket)', async () => {
    localStorage.setItem('lf_live_age_bucket', 'minor');
    setup({ extra: (c) => (c.path === '/api/profile' ? new NetworkError() : undefined) }); view();
    const group = await screen.findByRole('group', { name: 'RPE' });
    expect(within(group).getByRole('button', { name: '7' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(group).queryByRole('button', { name: '8' })).not.toBeInTheDocument();
  });

  it('RPE quick chips: one tap selects a whole step, the "..." chip reveals half steps, and the choice is logged', async () => {
    setup(); view();
    const group = await screen.findByRole('group', { name: 'RPE' });
    expect(within(group).getAllByRole('button').map((b) => b.textContent)).toEqual(['6', '7', '8', '9', '10', '…']);
    expect(within(group).getByRole('button', { name: '8' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(within(group).getByRole('button', { name: '9' }));
    fireEvent.click(within(group).getByRole('button', { name: 'חצאי דרגה' }));
    fireEvent.click(within(screen.getAllByRole('group', { name: 'חצאי דרגה' })[0] as HTMLElement).getByRole('button', { name: '9.5' }));
    expect(within(group).getByRole('button', { name: 'חצאי דרגה' })).toHaveTextContent('9.5');
    fireEvent.click(await finishSet());
    await waitFor(() => expect(calls.find((c) => c.method === 'POST')?.body).toMatchObject({ rpe: 9.5 }));
  });

  it('steppers: plus / minus change the number, typing a decimal keeps the dot, and the number is the logged value', async () => {
    setup(); view();
    const weight = await screen.findByRole('textbox', { name: 'משקל' });
    fireEvent.click(screen.getByRole('button', { name: 'משקל +' }));
    expect(weight).toHaveValue('62.5');
    fireEvent.click(screen.getByRole('button', { name: 'חזרות −' }));
    expect(screen.getByRole('textbox', { name: 'חזרות' })).toHaveValue('9');
    fireEvent.focus(weight); fireEvent.change(weight, { target: { value: '70.' } });
    expect(weight).toHaveValue('70.');
    fireEvent.change(weight, { target: { value: '70.5' } });
    fireEvent.blur(weight);
    fireEvent.click(await finishSet());
    await waitFor(() => expect(calls.find((c) => c.method === 'POST')?.body).toMatchObject({ reps: 9, weightKg: 70.5 }));
  });

  it('gives haptic feedback when a set is finished (guarded)', async () => {
    const vibrate = vi.fn(); Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
    setup(); view(); fireEvent.click(await finishSet());
    expect(vibrate).toHaveBeenCalledWith(10);
    Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true });
  });

  it('shows the technique video collapsed by default on phones and lets the user expand it', async () => {
    setup(); view();
    const btn = await screen.findByRole('button', { name: 'הצגת טכניקה', expanded: false });
    expect(document.querySelector('.lv-video')).toBeNull();
    fireEvent.click(btn);
    expect(document.querySelector('.lv-video')).not.toBeNull();
    expect(localStorage.getItem('lf_live_video_open')).toBe('1');
  });

  it('rest card previews the next set, never blocks logging, and the last planned set moves on to the next exercise', async () => {
    const base = mkSession();
    const exercises = base.exercises.map((e, i) => (i === 0 ? { ...e, planned: { ...planned, sets: 2 } } : e));
    setup({ session: mkSession({ exercises }) }); view();
    fireEvent.click(await finishSet());
    expect(await screen.findByTestId('rest-readout')).toBeInTheDocument();
    expect(screen.getByTestId('rest-next')).toHaveTextContent('לחיצת חזה במוט'); // still the same exercise: set 2
    expect(screen.getByTestId('rest-next')).toHaveTextContent('סט 2');
    expect(screen.getByRole('button', { name: 'סיום סט' })).toBeEnabled(); // logging is never blocked by the rest
    await waitFor(() => expect(screen.getByRole('button', { name: 'סיום סט' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'סיום סט' }));
    await waitFor(() => expect(screen.getByTestId('stepper-pos')).toHaveTextContent('תרגיל 2 מתוך 2'));
    expect(screen.getByTestId('rest-next')).toHaveTextContent('סט 1');
  });

  it('the single primary button is the finish-set action until every set is done, then it becomes finish workout', async () => {
    const sets = (id: string, n: number) => Array.from({ length: n }, (_, i) => ({ id: `${id}${i}`, sessionExerciseId: id, setNo: i + 1, reps: 8, weightKg: null, durationSec: null, rpe: 8 }));
    const base = mkSession();
    const exercises = base.exercises.map((e) => ({ ...e, sets: sets(e.id, e.planned.sets) }));
    setup({ session: mkSession({ exercises }) }); const { container } = view();
    await finishSet();
    const primaries = container.querySelectorAll('.btn-primary');
    expect(primaries).toHaveLength(1);
    expect(primaries[0]).toHaveTextContent('סיום אימון');
  });

  it('discard lives in the more menu and asks for confirmation first', async () => {
    setup(); view(); vi.mocked(window.confirm).mockReturnValue(false);
    fireEvent.click(await screen.findByRole('button', { name: 'עוד' }));
    fireEvent.click(await screen.findByRole('button', { name: 'ביטול האימון' }));
    expect(window.confirm).toHaveBeenCalledWith('לבטל את האימון ולמחוק את כל הסטים שלו?');
    expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
    vi.mocked(window.confirm).mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'ביטול האימון' }));
    await waitFor(() => expect(calls.find((c) => c.method === 'DELETE')?.path).toBe('/api/sessions/s1'));
  });

  it('plate calculator shows plates per side and applies the achieved weight', async () => {
    setup(); view();
    fireEvent.click(await screen.findByRole('button', { name: 'מחשבון פלטות' }));
    const dlg = await screen.findByRole('dialog');
    fireEvent.change(within(dlg).getByRole('textbox', { name: 'משקל יעד' }), { target: { value: '100' } });
    const plates = within(dlg).getByRole('list', { name: 'פלטות לכל צד' });
    expect(within(plates).getAllByRole('listitem').map((l) => l.textContent)).toEqual(['25', '15']);
    expect(within(dlg).getByTestId('plates-achieved')).toHaveTextContent('100');
    expect(within(dlg).getByTestId('plates-remainder')).toHaveTextContent('0');
    fireEvent.click(within(dlg).getByRole('radio', { name: '15 ק״ג' }));
    expect(within(dlg).getByTestId('plates-achieved')).toHaveTextContent('100'); // (100-15)/2 = 42.5 = 25+15+2.5
    fireEvent.click(within(dlg).getByRole('button', { name: 'החלה' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'משקל' })).toHaveValue('100');
  });

  it('refuses to finish offline with a clear message and keeps the session open', async () => {
    setup(); view();
    await finishSet(); setOnline(false);
    fireEvent.click(screen.getByRole('button', { name: 'סיום אימון' }));
    expect(await screen.findByText('החיבור נדרש לסיום האימון')).toBeInTheDocument();
    expect(calls.some((c) => c.path.endsWith('/finish'))).toBe(false);
    expect(screen.getByTestId('exercise-panel')).toBeInTheDocument();
  });

  it('finishes online: flushes, posts finish, invalidates and navigates to the summary with the response in router state', async () => {
    const res = { sessionId: 's1', totalSets: 1, xpTotal: 20 };
    setup({ session: mkSession({}, [{ id: 'x', sessionExerciseId: 'e1', setNo: 1, reps: 8, weightKg: 60, durationSec: null, rpe: 8 }]), extra: (c) => (c.path === '/api/sessions/s1/finish' ? res : undefined) });
    view();
    fireEvent.click(await screen.findByRole('button', { name: 'סיום אימון' }));
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe(`/workouts/sessions/s1|${JSON.stringify(res)}`));
    expect(calls.filter((c) => c.path === '/api/sessions/s1/finish')).toHaveLength(1);
  });

  it('asks for confirmation when finishing with zero sets and aborts on cancel', async () => {
    setup(); view(); vi.mocked(window.confirm).mockReturnValue(false);
    fireEvent.click(await screen.findByRole('button', { name: 'סיום אימון' }));
    expect(window.confirm).toHaveBeenCalledWith('לא נרשמו סטים. לסיים בכל זאת?');
    expect(calls.some((c) => c.path.endsWith('/finish'))).toBe(false);
  });

  it('allows replacing only before the first set (safe alternatives), and locks it afterwards', async () => {
    setup({ session: mkSession(), prof: profile({ equipment: ['barbell', 'bench', 'dumbbell'] }), extra: (c) => (c.method === 'PATCH' ? mkSession() : undefined) }); view();
    await waitFor(() => expect(JSON.stringify(calls)).toContain('/api/profile'));
    fireEvent.click(await screen.findByRole('button', { name: 'עוד' }));
    fireEvent.click(await screen.findByRole('button', { name: 'החלפת תרגיל' }));
    const dlg = await screen.findByRole('dialog');
    fireEvent.click(await within(dlg).findByRole('button', { name: 'לחיצת חזה עם משקולות יד' }));
    await waitFor(() => expect(calls.find((c) => c.method === 'PATCH')).toMatchObject({ path: '/api/sessions/s1/exercises/e1', body: { exerciseId: 'dumbbell_bench_press' } }));
  });
  it('locks replacement once a set exists', async () => {
    const set = { id: 'set9', sessionExerciseId: 'e1', setNo: 1, reps: 8, weightKg: 60, durationSec: null, rpe: 8 };
    setup({ session: mkSession({}, [set]) }); view();
    fireEvent.click(await screen.findByRole('button', { name: 'עוד' }));
    expect(await screen.findByRole('button', { name: 'החלפת תרגיל' })).toBeDisabled();
    expect(screen.getByTestId('replace-locked')).toHaveTextContent('אפשר להחליף רק לפני הסט הראשון.');
    expect(calls.some((c) => c.method === 'PATCH')).toBe(false);
  });

  it('lists rejected outbox items and lets the user discard them', async () => {
    setup({ extra: (c) => (c.method === 'POST' && c.path.endsWith('/sets') ? new ApiRequestError(400, 'validation_error', {}, {}) : undefined) });
    await outbox.enqueue({ method: 'POST', path: '/api/sessions/s1/sets', body: { sessionExerciseId: 'e1', reps: 8 }, label: 'bad set' });
    view();
    await act(async () => { await outbox.flush(); });
    expect(await screen.findByText('לא התקבלו בשרת')).toBeInTheDocument();
    expect(screen.getByText('bad set')).toBeInTheDocument();
    const row = screen.getByText('bad set').closest('li') as HTMLElement;
    expect(within(row).getByRole('button', { name: 'לנסות שוב' })).toBeInTheDocument();
    fireEvent.click(within(row).getByRole('button', { name: 'להסיר' }));
    await waitFor(() => expect(outbox.list()).toHaveLength(0));
  });
});
