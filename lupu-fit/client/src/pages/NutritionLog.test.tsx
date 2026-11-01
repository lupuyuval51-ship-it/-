import 'fake-indexeddb/auto';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError, NetworkError } from '../api/client.ts';
import { profileResponse, renderWith } from '../components/nutrition/testHarness.tsx';
import { FOODS } from '../data/content.ts';

const h = vi.hoisted(() => ({ handler: (_m: string, _p: string, _b?: unknown, _q?: unknown): unknown => ({}), calls: [] as { m: string; p: string; b?: unknown }[] }));
vi.mock('../api/client.ts', async (orig) => {
  const real = await orig<typeof import('../api/client.ts')>();
  const run = async (m: string, p: string, b?: unknown, q?: unknown) => { h.calls.push({ m, p, b }); const r = h.handler(m, p, b, q); if (r instanceof Error) throw r; return r; };
  return { ...real, api: { get: (p: string, q?: unknown) => run('GET', p, undefined, q), post: (p: string, b?: unknown) => run('POST', p, b), put: (p: string, b?: unknown) => run('PUT', p, b), patch: (p: string, b?: unknown) => run('PATCH', p, b), delete: (p: string, b?: unknown) => run('DELETE', p, b) } };
});
vi.mock('../lib/imageDownscale.ts', () => ({ downscaleToJpegBase64: vi.fn(async () => 'QUJDRA=='), fitWithin: vi.fn() }));
const { outbox } = await import('../lib/outbox.ts');
const { default: NutritionLog } = await import('./NutritionLog.tsx');

let profile = profileResponse();
const base = (m: string, p: string): unknown => {
  if (p === '/api/profile') return profile;
  if (p === '/api/food-log' && m === 'GET') return { date: '2026-05-01', entries: [], totals: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 } };
  if (p === '/api/foods/custom' && m === 'GET') return { foods: [] };
  if (p === '/api/food-log' && m === 'POST') return { entry: {} };
  return {};
};
beforeEach(async () => {
  h.calls.length = 0; profile = profileResponse(); h.handler = base;
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  for (const i of outbox.list()) await outbox.remove(i.id);
});
const ROUTE = '/nutrition/log?date=2026-05-01&slot=lunch';
const dairy = FOODS.find((f) => f.allergens.includes('dairy'))!;
const plain = FOODS.find((f) => f.allergens.length === 0 && /^[A-Za-z ]+$/.test(f.nameEn))!;

async function pick(name: string) {
  const user = userEvent.setup();
  await user.type(screen.getByRole('searchbox', { name: /search foods/i }), name);
  const hit = (await screen.findAllByText(name, { selector: 'strong' }))[0]!;
  await user.click(hit.closest('button')!);
  return user;
}
const postBodies = () => h.calls.filter((c) => c.m === 'POST' && c.p === '/api/food-log').map((c) => c.b as Record<string, unknown>);

describe('NutritionLog search and logging', () => {
  it('searches in Hebrew with final-letter folding and logs with live macro preview', async () => {
    renderWith(<NutritionLog />, { route: ROUTE, lang: 'he' });
    const user = userEvent.setup();
    await user.type(await screen.findByRole('searchbox'), plain.nameHe.normalize('NFC'));
    const hit = (await screen.findAllByText(plain.nameHe, { selector: 'strong' }))[0]!;
    await user.click(hit.closest('button')!);
    const preview = await screen.findByTestId('macro-preview');
    expect(within(preview).getByText(String(Math.round((plain.kcal * plain.servingG) / 100)))).toBeInTheDocument();
  });

  it('warns about allergens before logging and requires acknowledgement', async () => {
    profile = profileResponse({ allergies: ['dairy'] });
    renderWith(<NutritionLog />, { route: ROUTE });
    await waitFor(() => expect(h.calls.some((c) => c.p === '/api/profile')).toBe(true));
    await screen.findByText(/Allergies in your profile/);
    const user = await pick(dairy.nameEn);
    expect(await screen.findByTestId('allergen-warning')).toHaveTextContent(/Dairy/);
    const add = screen.getByRole('button', { name: 'Add to log' });
    expect(add).toBeDisabled();
    expect(screen.getAllByText(/Allergen filtering is automatic and conservative/).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('switch', { name: /checked the ingredients/i }));
    expect(add).toBeEnabled();
    await user.click(add);
    await waitFor(() => expect(postBodies()).toHaveLength(1));
    expect(postBodies()[0]).toMatchObject({ loggedDate: '2026-05-01', slot: 'lunch', foodId: dairy.id, name: dairy.nameEn, estimated: false });
  });

  it('does not warn when the profile has no matching allergy', async () => {
    renderWith(<NutritionLog />, { route: ROUTE });
    await pick(plain.nameEn);
    expect(screen.queryByTestId('allergen-warning')).toBeNull();
    expect(screen.getByRole('button', { name: 'Add to log' })).toBeEnabled();
  });

  it('queues the log offline with the food name as label and tells the user', async () => {
    h.handler = (m, p) => (m === 'POST' && p === '/api/food-log' ? new NetworkError() : base(m, p));
    renderWith(<NutritionLog />, { route: ROUTE });
    const user = await pick(plain.nameEn);
    await user.click(screen.getByRole('button', { name: 'Add to log' }));
    expect(await screen.findByText(/Saved offline/)).toBeInTheDocument();
    await waitFor(() => expect(outbox.list()).toHaveLength(1));
    expect(outbox.list()[0]).toMatchObject({ method: 'POST', path: '/api/food-log', label: plain.nameEn });
  });
});

describe('barcode', () => {
  it('always offers numeric entry and reports product_not_found honestly', async () => {
    h.handler = (m, p) => (p.startsWith('/api/nutrition/barcode/') ? new ApiRequestError(404, 'product_not_found', {}) : base(m, p));
    renderWith(<NutritionLog />, { route: ROUTE });
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Barcode' }));
    const input = screen.getByRole('textbox', { name: /barcode number/i });
    const btn = screen.getByRole('button', { name: 'Look up' });
    expect(btn).toBeDisabled();
    await user.type(input, '12345');
    expect(btn).toBeDisabled();
    await user.type(input, '678');
    await user.click(btn);
    expect(await screen.findByText(/Product not found in Open Food Facts/)).toBeInTheDocument();
  });
  it('opens the confirm sheet for a found product and logs it', async () => {
    h.handler = (m, p) => (p === '/api/nutrition/barcode/7290000000001' ? { barcode: '7290000000001', name: 'Test Bar', per100g: { kcal: 400, proteinG: 10, carbsG: 50, fatG: 15 }, servingG: 40, source: 'open_food_facts' } : base(m, p));
    renderWith(<NutritionLog />, { route: ROUTE });
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Barcode' }));
    await user.type(screen.getByRole('textbox', { name: /barcode number/i }), '7290000000001');
    await user.click(screen.getByRole('button', { name: 'Look up' }));
    expect(await screen.findByRole('dialog', { name: 'Test Bar' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add to log' }));
    await waitFor(() => expect(postBodies()[0]).toMatchObject({ name: 'Test Bar', grams: 40, kcal: 160, estimated: false }));
  });
});

describe('photo estimate', () => {
  const estimate = { estimated: true, requiresConfirmation: true, items: [{ name: 'Rice', grams: 150, kcal: 200, proteinG: 4, carbsG: 44, fatG: 1 }, { name: 'Chicken', grams: 100, kcal: 165, proteinG: 31, carbsG: 0, fatG: 4 }] };
  it('shows a labelled estimate, logs nothing until confirmed, then logs with estimated:true', async () => {
    h.handler = (m, p) => (p === '/api/nutrition/photo-estimate' ? estimate : base(m, p));
    renderWith(<NutritionLog />, { route: ROUTE });
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Photo' }));
    expect(screen.getByText(/rough guess, not a measurement/)).toBeInTheDocument();
    await user.upload(screen.getByLabelText('Take or choose a photo'), new File(['x'], 'meal.jpg', { type: 'image/jpeg' }));
    expect(await screen.findByText('ESTIMATE')).toBeInTheDocument();
    expect(screen.getAllByTestId('estimate-item')).toHaveLength(2);
    expect(postBodies()).toHaveLength(0);
    expect(h.calls.find((c) => c.p === '/api/nutrition/photo-estimate')!.b).toMatchObject({ jpegBase64: 'QUJDRA==', lang: 'en' });
    const first = screen.getAllByTestId('estimate-item')[0]!;
    await user.clear(within(first).getByLabelText('kcal'));
    await user.type(within(first).getByLabelText('kcal'), '210');
    await user.click(within(first).getByRole('button', { name: 'Log item' }));
    await waitFor(() => expect(postBodies()).toHaveLength(1));
    expect(postBodies()[0]).toMatchObject({ name: 'Rice', kcal: 210, estimated: true, slot: 'lunch' });
  });
  it('is honest when AI is unavailable (503) and on quota errors (429)', async () => {
    h.handler = (m, p) => (p === '/api/nutrition/photo-estimate' ? new ApiRequestError(503, 'ai_unavailable', {}) : base(m, p));
    renderWith(<NutritionLog />, { route: ROUTE });
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Photo' }));
    await user.upload(screen.getByLabelText('Take or choose a photo'), new File(['x'], 'meal.jpg', { type: 'image/jpeg' }));
    expect(await screen.findByText(/AI estimates are not available right now/)).toBeInTheDocument();
    h.handler = (m, p) => (p === '/api/nutrition/photo-estimate' ? new ApiRequestError(429, 'quota_exceeded', { window: 'day' }) : base(m, p));
    await user.upload(screen.getByLabelText('Take or choose a photo'), new File(['y'], 'meal2.jpg', { type: 'image/jpeg' }));
    expect(await screen.findByText(/today’s limit/)).toBeInTheDocument();
  });
});

describe('quick add and custom food', () => {
  it('quick-adds an entry with the given macros', async () => {
    renderWith(<NutritionLog />, { route: ROUTE });
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'Quick add' }));
    await user.type(screen.getByLabelText('Name'), 'Protein shake');
    await user.type(screen.getByLabelText('kcal'), '180');
    await user.type(screen.getByLabelText('Protein (g)'), '30');
    await user.click(screen.getByRole('button', { name: 'Add entry' }));
    await waitFor(() => expect(postBodies()[0]).toMatchObject({ name: 'Protein shake', kcal: 180, proteinG: 30, carbsG: 0, fatG: 0 }));
  });
  it('rejects custom foods whose macros exceed 100 g per 100 g', async () => {
    renderWith(<NutritionLog />, { route: ROUTE });
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: 'New food' }));
    await user.type(screen.getByLabelText('Name'), 'Odd');
    await user.type(screen.getByLabelText('kcal per 100 g'), '300');
    await user.type(screen.getByLabelText('Protein (g)'), '60');
    await user.type(screen.getByLabelText('Carbs (g)'), '60');
    expect(screen.getByRole('button', { name: 'Save food' })).toBeDisabled();
  });
});
