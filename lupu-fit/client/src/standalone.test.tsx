import 'fake-indexeddb/auto';
import { QueryClient } from '@tanstack/react-query';
import { renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { profileResponse, renderWith } from './components/nutrition/testHarness.tsx';
import { renderScreen } from './components/onboarding/testing.tsx';

/**
 * The standalone Device Mode build: no account, no server, no AI service (the shipped Android build sets no VITE_AI_PROXY_URL).
 * `mode` flips the compile-time constants the app branches on.
 */
const mode = vi.hoisted(() => ({ device: true, ai: false }));
vi.mock('./env.ts', async (orig) => { const real = await orig<typeof import('./env.ts')>(); return { ...real, get IS_DEVICE() { return mode.device; }, get AI_AVAILABLE() { return mode.ai; }, get RUN_MODE() { return mode.device ? 'device' : 'hosted'; } }; });

const h = vi.hoisted(() => ({ calls: [] as string[], handler: (_m: string, _p: string): unknown => ({}) }));
vi.mock('./api/client.ts', async (orig) => {
  const real = await orig<typeof import('./api/client.ts')>();
  const run = async (m: string, p: string) => { h.calls.push(`${m} ${p}`); const r = h.handler(m, p); if (r instanceof Error) throw r; return r; };
  return { ...real, api: { get: (p: string) => run('GET', p), post: (p: string) => run('POST', p), put: (p: string) => run('PUT', p), patch: (p: string) => run('PATCH', p), delete: (p: string) => run('DELETE', p) } };
});
const { lookup, DICT } = await import('./i18n/index.tsx');
const { default: Privacy } = await import('./pages/Privacy.tsx');
const { default: Terms } = await import('./pages/Terms.tsx');
const { default: NutritionLog } = await import('./pages/NutritionLog.tsx');
const { LanguagePanel } = await import('./components/profile/LanguagePanel.tsx');
const { BarcodePanel } = await import('./components/nutrition/BarcodePanel.tsx');
const { useOnline } = await import('./components/live/OfflineBanner.tsx');
const { makeQueryClient } = await import('./app/App.tsx');
const { ApiRequestError } = await import('./api/client.ts');

beforeEach(() => { mode.device = true; mode.ai = false; h.calls.length = 0; localStorage.clear(); Object.defineProperty(navigator, 'onLine', { value: true, configurable: true }); });
afterEach(() => { vi.restoreAllMocks(); });

describe('device copy overrides', () => {
  it('Device Mode says "Delete all data" where the hosted build says "Delete account", in both languages; hosted is untouched', () => {
    expect(lookup('en', 'profile.account.delete')).toBe('Delete all data');
    expect(lookup('he', 'profile.account.delete')).toBe('מחיקת כל הנתונים');
    expect(lookup('en', 'error.internal_error')).not.toMatch(/server/i);
    mode.device = false;
    expect(lookup('en', 'profile.account.delete')).toBe('Delete account');
    expect(lookup('en', 'error.internal_error')).toMatch(/server/i);
  });
  it('every dev.* override has a key to override, in both languages, and the same {placeholders}', () => {
    const flat = (t: unknown, p = '', o: Record<string, string> = {}): Record<string, string> => { for (const [k, v] of Object.entries(t as Record<string, unknown>)) typeof v === 'string' ? (o[p + k] = v) : flat(v, `${p}${k}.`, o); return o; };
    for (const lang of ['en', 'he'] as const) {
      const all = flat(DICT[lang]);
      for (const [k, v] of Object.entries(all).filter(([key]) => key.startsWith('dev.'))) {
        const base = all[k.slice(4)];
        expect(base, `${lang}: ${k} overrides a missing key`).toBeDefined();
        expect((v.match(/\{\w+\}/g) ?? []).sort(), `${lang}: ${k} placeholders`).toEqual((base!.match(/\{\w+\}/g) ?? []).sort());
      }
    }
  });
});

describe('legal pages in the standalone build', () => {
  it('privacy: data stays on the device, no account/operator/hosted wording, no AI provider paragraphs without a proxy', () => {
    renderScreen(<Privacy />, { route: '/privacy' });
    const text = document.body.textContent ?? '';
    expect(text).toMatch(/There is no account, no sign-in/);
    expect(text).toMatch(/world\.openfoodfacts\.org/);
    expect(text).not.toMatch(/Hosted|operator server|Gemini|Claude|session cookie|salted hash/i);
    expect(text).not.toMatch(/AI service/); // the optional proxy paragraph is only for builds that have one
  });
  it('privacy: the optional AI paragraph appears only when the build has an AI proxy', () => {
    mode.ai = true;
    renderScreen(<Privacy />, { route: '/privacy' });
    expect(document.body.textContent).toMatch(/optional AI service/);
  });
  it('terms: backups are the user\'s job, nothing about passwords or operators; Hebrew too', () => {
    const a = renderScreen(<Terms />, { route: '/terms' });
    expect(document.body.textContent).toMatch(/There is no account/);
    expect(document.body.textContent).not.toMatch(/password|operator|Hosted mode/i);
    a.unmount();
    renderScreen(<Terms />, { route: '/terms', lang: 'he' });
    expect(document.body.textContent).toMatch(/אין חשבון/);
    expect(document.body.textContent).not.toMatch(/סיסמה|מפעיל/);
  });
  it('hosted keeps the operator-based text', () => {
    mode.device = false;
    renderScreen(<Terms />, { route: '/terms' });
    expect(document.body.textContent).toMatch(/Hosted mode/);
  });
});

describe('nothing in the UI needs a server or an AI service that is not there', () => {
  const baseHandler = (m: string, p: string): unknown => {
    if (p === '/api/profile') return profileResponse();
    if (p === '/api/food-log' && m === 'GET') return { date: '2026-05-01', entries: [], totals: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 } };
    if (p === '/api/foods/custom') return { foods: [] };
    return {};
  };
  it('the photo-estimate tile is hidden without an AI service and shown with one', async () => {
    h.handler = baseHandler;
    const a = renderWith(<NutritionLog />, { route: '/nutrition/log?date=2026-05-01&slot=lunch' });
    expect(await screen.findByRole('button', { name: /Barcode/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Photo/ })).toBeNull();
    expect(screen.getAllByRole('button', { pressed: false }).filter((b) => b.classList.contains('nu-tile'))).toHaveLength(3);
    a.unmount();
    mode.ai = true;
    renderWith(<NutritionLog />, { route: '/nutrition/log?date=2026-05-01&slot=lunch' });
    expect(await screen.findByRole('button', { name: /^Photo/ })).toBeInTheDocument();
  });
  it('"more languages" is replaced by an honest note without an AI service (he and en keep working)', () => {
    const { unmount } = renderWith(<LanguagePanel onBuiltIn={() => undefined} />);
    expect(screen.getByTestId('ml-builtin-only')).toHaveTextContent(/built into the app/);
    expect(document.querySelector('.ml-open')).toBeNull();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    unmount();
    mode.ai = true;
    renderWith(<LanguagePanel onBuiltIn={() => undefined} />);
    expect(document.querySelector('.ml-open')).not.toBeNull();
    expect(screen.queryByTestId('ml-builtin-only')).toBeNull();
  });
  it('barcode lookup offline: a calm note, the lookup is still possible and a failure is explained without blocking manual add', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    h.handler = (_m, p) => (p.startsWith('/api/nutrition/barcode/') ? new ApiRequestError(502, 'lookup_failed', {}) : {});
    renderWith(<BarcodePanel onFound={() => undefined} />);
    expect(screen.getByTestId('barcode-offline')).toHaveTextContent(/No internet connection/);
    await userEvent.setup().type(screen.getByLabelText('Barcode number'), '7290000000001');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Look up' }));
    const err = await screen.findByTestId('barcode-error');
    expect(err).toHaveTextContent(/by search or by typing the values/);
    expect(screen.queryByTestId('barcode-offline')).toBeNull(); // one message at a time
  });
});

describe('airplane mode changes nothing on the phone', () => {
  it('useOnline is true in Device Mode whatever the browser says, and follows it in the hosted build', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    expect(renderHook(() => useOnline()).result.current).toBe(true);
    mode.device = false;
    expect(renderHook(() => useOnline()).result.current).toBe(false);
  });
  it('queries and mutations are never paused offline in Device Mode (a paused query has no data and no error: a blank screen)', () => {
    const dev = makeQueryClient().getDefaultOptions();
    expect(dev.queries?.networkMode).toBe('always');
    expect(dev.mutations?.networkMode).toBe('always');
    mode.device = false;
    expect(makeQueryClient().getDefaultOptions().queries?.networkMode).toBe('online');
  });
  it('a query really runs while the browser reports offline (Device Mode client)', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const qc: QueryClient = makeQueryClient();
    const { onlineManager } = await import('@tanstack/react-query');
    onlineManager.setOnline(false);
    try { await expect(qc.fetchQuery({ queryKey: ['x'], queryFn: async () => 42 })).resolves.toBe(42); } finally { onlineManager.setOnline(true); }
  });
});
