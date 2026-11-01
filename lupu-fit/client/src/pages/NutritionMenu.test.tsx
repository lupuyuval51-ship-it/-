import 'fake-indexeddb/auto';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { profileResponse, renderWith } from '../components/nutrition/testHarness.tsx';
import { DISH_BY_ID } from '../data/content.ts';

const h = vi.hoisted(() => ({ handler: (_m: string, _p: string, _b?: unknown, _q?: unknown): unknown => ({}), calls: [] as { m: string; p: string; b?: unknown; q?: unknown }[] }));
vi.mock('../api/client.ts', async (orig) => {
  const real = await orig<typeof import('../api/client.ts')>();
  const run = async (m: string, p: string, b?: unknown, q?: unknown) => { h.calls.push({ m, p, b, q }); const r = h.handler(m, p, b, q); if (r instanceof Error) throw r; return r; };
  return { ...real, api: { get: (p: string, q?: unknown) => run('GET', p, undefined, q), post: (p: string, b?: unknown) => run('POST', p, b), put: (p: string, b?: unknown) => run('PUT', p, b), patch: (p: string, b?: unknown) => run('PATCH', p, b), delete: (p: string, b?: unknown) => run('DELETE', p, b) } };
});
const { default: NutritionMenu } = await import('./NutritionMenu.tsx');

let profile = profileResponse();
beforeEach(() => {
  localStorage.clear(); h.calls.length = 0; profile = profileResponse();
  h.handler = (m, p, b) => (p === '/api/profile' ? profile : p === '/api/food-log' && m === 'POST' ? { entry: b } : {});
});
const ROUTE = '/nutrition/menu?date=2026-05-01';
const dishNames = () => screen.getAllByRole('heading', { level: 3 }).map((x) => x.textContent);
const posts = () => h.calls.filter((c) => c.m === 'POST' && c.p === '/api/food-log').map((c) => c.b as Record<string, unknown>);

describe('NutritionMenu', () => {
  it('always shows the allergen disclaimer and is deterministic per date', async () => {
    const first = renderWith(<NutritionMenu />, { route: ROUTE });
    await screen.findByText('Day totals vs targets');
    expect(screen.getByTestId('allergen-disclaimer')).toHaveTextContent('Allergen filtering is automatic and conservative');
    const a = dishNames();
    expect(a.length).toBe(4);
    first.unmount();
    renderWith(<NutritionMenu />, { route: ROUTE });
    await screen.findByText('Day totals vs targets');
    expect(dishNames()).toEqual(a);
  });
  it('regenerates (new seed), swaps one dish and persists the choice', async () => {
    renderWith(<NutritionMenu />, { route: ROUTE });
    const user = userEvent.setup();
    await screen.findByText('Day totals vs targets');
    const before = dishNames();
    await user.click(screen.getAllByRole('button', { name: 'Swap dish' })[1]!);
    const after = dishNames();
    expect(after[1]).not.toBe(before[1]); expect(after[0]).toBe(before[0]); expect(after[2]).toBe(before[2]);
    expect(JSON.parse(localStorage.getItem('lf_menu_v1_2026-05-01')!)).toMatchObject({ mealCount: 4, swaps: [1] });
    await user.click(screen.getByRole('button', { name: 'Generate again' }));
    expect(JSON.parse(localStorage.getItem('lf_menu_v1_2026-05-01')!)).toMatchObject({ shuffle: 1, swaps: [] });
  });
  it('changes the meal count', async () => {
    renderWith(<NutritionMenu />, { route: ROUTE });
    const user = userEvent.setup();
    await screen.findByText('Day totals vs targets');
    await user.click(screen.getByRole('radio', { name: '5 meals' }));
    expect(dishNames().length).toBe(5);
    await user.click(screen.getByRole('radio', { name: '3 meals' }));
    expect(dishNames().length).toBe(3);
  });
  it('logs a single dish with grams = ingredient grams x portion, and then the whole day', async () => {
    renderWith(<NutritionMenu />, { route: ROUTE });
    const user = userEvent.setup();
    await screen.findByText('Day totals vs targets');
    const card = screen.getAllByRole('heading', { level: 3 })[0]!.closest('article')!;
    await user.click(within(card).getByRole('button', { name: 'Log this dish' }));
    await waitFor(() => expect(posts()).toHaveLength(1));
    const p = posts()[0]!;
    const dish = DISH_BY_ID.get(p['dishId'] as string)!;
    const portion = Number(within(card).getByText(/×/).textContent!.replace('×', ''));
    expect(p['grams']).toBeCloseTo(dish.ingredients.reduce((s, i) => s + i.grams, 0) * portion, 0);
    expect(p).toMatchObject({ loggedDate: '2026-05-01', estimated: false });
    await user.click(screen.getByRole('button', { name: 'Log the whole day' }));
    await waitFor(() => expect(posts()).toHaveLength(4)); // remaining three
  });
  it('builds a shopping list for a span, checks items off (persisted) and copies it', async () => {
    renderWith(<NutritionMenu />, { route: ROUTE });
    const user = userEvent.setup();
    await screen.findByText('Day totals vs targets');
    const list = screen.getByRole('list', { name: 'Shopping list' });
    const n3 = within(list).getAllByRole('checkbox').length;
    await user.click(screen.getByRole('radio', { name: '7 days' }));
    expect(within(screen.getByRole('list', { name: 'Shopping list' })).getAllByRole('checkbox').length).toBeGreaterThanOrEqual(n3);
    const box = within(screen.getByRole('list', { name: 'Shopping list' })).getAllByRole('checkbox')[0]!;
    await user.click(box);
    expect(box).toBeChecked();
    expect(JSON.parse(localStorage.getItem('lf_shop_checked_v1')!)).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: /Copy list/ }));
    await waitFor(async () => expect(await navigator.clipboard.readText()).toMatch(/^- .+: \d+ g/m));
  });
  it('renders in Hebrew with the disclaimer', async () => {
    renderWith(<NutritionMenu />, { route: ROUTE, lang: 'he' });
    await screen.findByText('סיכום היום מול יעדים');
    expect(screen.getByTestId('allergen-disclaimer')).toHaveTextContent('סינון האלרגנים אוטומטי ושמרני');
  });
});
