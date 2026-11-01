import 'fake-indexeddb/auto';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { profileResponse, renderWith } from '../components/nutrition/testHarness.tsx';

const h = vi.hoisted(() => ({ handler: (_m: string, _p: string, _b?: unknown, _q?: unknown): unknown => ({}), calls: [] as { m: string; p: string; b?: unknown; q?: unknown }[] }));
vi.mock('../api/client.ts', async (orig) => {
  const real = await orig<typeof import('../api/client.ts')>();
  const run = async (m: string, p: string, b?: unknown, q?: unknown) => { h.calls.push({ m, p, b, q }); const r = h.handler(m, p, b, q); if (r instanceof Error) throw r; return r; };
  return { ...real, api: { get: (p: string, q?: unknown) => run('GET', p, undefined, q), post: (p: string, b?: unknown) => run('POST', p, b), put: (p: string, b?: unknown) => run('PUT', p, b), patch: (p: string, b?: unknown) => run('PATCH', p, b), delete: (p: string, b?: unknown) => run('DELETE', p, b) } };
});
const { default: Nutrition } = await import('./Nutrition.tsx');

const entry = (id: string, slot: string, name: string, kcal: number, p: number) => ({ id, loggedDate: '2026-05-01', slot, foodId: 'rice', dishId: null, name, grams: 150, kcal, proteinG: p, carbsG: 40, fatG: 2, estimated: false });
let entries = [entry('e1', 'breakfast', 'Oats', 400, 15), entry('e2', 'lunch', 'Chicken and rice', 600, 45)];
let saved: unknown[] = [];
beforeEach(() => {
  h.calls.length = 0; entries = [entry('e1', 'breakfast', 'Oats', 400, 15), entry('e2', 'lunch', 'Chicken and rice', 600, 45)]; saved = [];
  h.handler = (m, p, b, q) => {
    if (p === '/api/profile') return profileResponse();
    if (p === '/api/food-log' && m === 'GET') return { date: (q as { date: string }).date, entries, totals: { kcal: 1000, proteinG: 60, carbsG: 80, fatG: 4 } };
    if (p === '/api/food-log/range') return { days: [{ date: '2026-04-30', kcal: 2000, proteinG: 120, carbsG: 0, fatG: 0, meals: 3 }, { date: '2026-05-01', kcal: 1000, proteinG: 60, carbsG: 0, fatG: 0, meals: 2 }] };
    if (p === '/api/saved-meals' && m === 'GET') return { meals: saved };
    if (m === 'DELETE') { entries = entries.filter((e) => p.endsWith(e.id) ? false : true); return { ok: true }; }
    if (p === '/api/food-log' && m === 'POST') return { entry: b };
    if (p === '/api/food-log/copy') return { copied: 3, xp: 0 };
    if (p === '/api/saved-meals' && m === 'POST') { saved = [{ id: 's1', name: (b as { name: string }).name, slot: 'lunch', items: [{ id: 'i', foodId: null, name: 'x', grams: 1, kcal: 500, proteinG: 1, carbsG: 1, fatG: 1 }] }]; return { id: 's1' }; }
    if (p === '/api/saved-meals/s1/log') return { logged: 1, xp: 0 };
    return {};
  };
});
const ROUTE = '/nutrition?date=2026-05-01';

describe('Nutrition hub', () => {
  it('shows totals vs targets, entries by slot, weekly adherence and links', async () => {
    renderWith(<Nutrition />, { route: ROUTE });
    expect(await screen.findByText('Chicken and rice')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'kcal' })).toHaveAttribute('aria-valuenow', '1000');
    expect(screen.getByText('Oats')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Log food/ })).toHaveAttribute('href', '/nutrition/log?date=2026-05-01');
    expect(screen.getByRole('link', { name: /Add to Dinner/ })).toHaveAttribute('href', '/nutrition/log?slot=dinner&date=2026-05-01');
    expect(screen.getByRole('link', { name: 'Daily menu' })).toHaveAttribute('href', '/nutrition/menu?date=2026-05-01');
    expect(await screen.findByText('Days logged')).toBeInTheDocument();
    expect(screen.getByText('2', { selector: '.num-lg' })).toBeInTheDocument();
    expect(screen.getByText('1,500', { selector: '.num-lg' })).toBeInTheDocument(); // avg of 2000 and 1000
  });
  it('has exactly one primary button', async () => {
    const { container } = renderWith(<Nutrition />, { route: ROUTE });
    await screen.findByText('Oats');
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(1);
  });
  it('deletes an entry and Undo re-posts it', async () => {
    renderWith(<Nutrition />, { route: ROUTE });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Delete Oats' }));
    const bar = await screen.findByTestId('undo-bar');
    expect(h.calls.some((c) => c.m === 'DELETE' && c.p === '/api/food-log/e1')).toBe(true);
    await user.click(within(bar).getByRole('button', { name: 'Undo' }));
    await waitFor(() => expect(h.calls.find((c) => c.m === 'POST' && c.p === '/api/food-log')?.b).toMatchObject({ name: 'Oats', slot: 'breakfast', kcal: 400, loggedDate: '2026-05-01', foodId: 'rice' }));
  });
  it('copies from yesterday when yesterday has entries', async () => {
    renderWith(<Nutrition />, { route: ROUTE });
    const user = userEvent.setup();
    const btn = await screen.findByRole('button', { name: 'Copy from yesterday' });
    await waitFor(() => expect(btn).toBeEnabled());
    await user.click(btn);
    await waitFor(() => expect(h.calls.find((c) => c.p === '/api/food-log/copy')?.b).toEqual({ fromDate: '2026-04-30', toDate: '2026-05-01' }));
  });
  it('saves a slot as a meal and re-logs it with one tap', async () => {
    renderWith(<Nutrition />, { route: ROUTE });
    const user = userEvent.setup();
    const lunch = (await screen.findByText('Chicken and rice')).closest('section')!;
    await user.click(within(lunch).getByRole('button', { name: 'Save as meal' }));
    await user.type(screen.getByLabelText('Meal name'), 'My lunch');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(h.calls.find((c) => c.m === 'POST' && c.p === '/api/saved-meals')?.b).toMatchObject({ name: 'My lunch', slot: 'lunch', items: [{ name: 'Chicken and rice', grams: 150, kcal: 600 }] }));
    await user.click(await screen.findByRole('button', { name: 'Log' }));
    await waitFor(() => expect(h.calls.find((c) => c.p === '/api/saved-meals/s1/log')?.b).toEqual({ loggedDate: '2026-05-01' }));
  });
  it('navigates days and renders in Hebrew', async () => {
    renderWith(<Nutrition />, { route: ROUTE, lang: 'he' });
    const user = userEvent.setup();
    await screen.findByText('Oats');
    expect(screen.getByRole('heading', { name: 'תזונה' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'היום הקודם' }));
    await waitFor(() => expect(h.calls.some((c) => c.p === '/api/food-log' && (c.q as { date: string }).date === '2026-04-30')).toBe(true));
  });
});
