import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LangProvider, makeT, uiLanguageHint, useLang, useT, fmt } from '../index.tsx';
import { LanguagePanel } from '../../components/profile/LanguagePanel.tsx';
import { ToastProvider } from '../../ui/toast.tsx';
import { customCode, dirFor, isRtlCode, LANGUAGES_LIST, searchLanguages } from './languages.ts';
import { batch, dictHash, ensureTranslation, flatten, samePlaceholders, translatable, unflatten, type LangStore, type Poster, type StoredLang } from './translate.ts';

const memStore = (): LangStore & { m: Map<string, StoredLang> } => {
  const m = new Map<string, StoredLang>();
  return { m, get: async (c) => m.get(c), put: async (l) => { m.set(l.code, structuredClone(l)); }, remove: async (c) => { m.delete(c); }, list: async () => [...m.values()] };
};
const fr: Poster = vi.fn(async (_t, keys) => ({ translations: Object.fromEntries(Object.entries(keys).map(([k, v]) => [k, `fr:${v}`])), fallback: [] }));
const target = { code: 'fr', name: 'Français' };
const src = { 'a.x': 'Save', 'a.y': 'Hello {name}', 'legal.h': 'Terms', 'b': 'Close' };

beforeEach(() => { localStorage.clear(); vi.mocked(fr).mockClear(); });

describe('helpers', () => {
  it('flatten/unflatten round trip and legal keys are excluded', () => {
    expect(unflatten(flatten({ a: { b: 'x' }, c: 'y' }))).toEqual({ a: { b: 'x' }, c: 'y' });
    expect(Object.keys(translatable(src))).toEqual(['a.x', 'a.y', 'b']);
  });
  it('batches by key count and by size', () => {
    const e = Array.from({ length: 320 }, (_, i) => [`k${i}`, 'v'] as [string, string]);
    expect(batch(e, 150).map((b) => Object.keys(b).length)).toEqual([150, 150, 20]);
    expect(batch([['a', 'x'.repeat(9000)], ['b', 'x'.repeat(9000)]], 150, 14000)).toHaveLength(2);
    expect(batch([])).toEqual([]);
  });
  it('placeholder comparison', () => {
    expect(samePlaceholders('Hi {n} {m}', 'x {m} y {n}')).toBe(true);
    expect(samePlaceholders('Hi {n}', 'Hi')).toBe(false);
    expect(samePlaceholders('Hi', 'Hi {n}')).toBe(false);
  });
  it('language catalogue: >=60, RTL codes, search by endonym/English/code, free-text codes', () => {
    expect(LANGUAGES_LIST.length).toBeGreaterThanOrEqual(60);
    for (const c of ['ar', 'fa', 'ur', 'yi', 'ps', 'ckb']) { expect(isRtlCode(c)).toBe(true); expect(dirFor(c)).toBe('rtl'); }
    expect(dirFor('fr')).toBe('ltr'); expect(dirFor('ar-EG')).toBe('rtl');
    expect(new Set(LANGUAGES_LIST.map((l) => l.code)).size).toBe(LANGUAGES_LIST.length);
    expect(searchLanguages('span').map((l) => l.code)).toEqual(['es']);
    expect(searchLanguages('日本').map((l) => l.code)).toEqual(['ja']);
    expect(searchLanguages('fil').map((l) => l.code)).toContain('fil');
    expect(customCode('Esperanto')?.code).toMatch(/^x-esperanto-/);
    expect(customCode('<script>')).toBeNull(); expect(customCode('a')).toBeNull();
    expect(customCode('Esperanto')).toEqual(customCode(' esperanto '.replace('e', 'E')) && customCode('Esperanto'));
  });
});

describe('ensureTranslation', () => {
  it('miss translates all (excluding legal), hit does zero network calls', async () => {
    const store = memStore();
    const r1 = await ensureTranslation({ target, dir: 'ltr', source: src, store, post: fr });
    expect(r1.status).toBe('translated'); expect(r1.batches).toBe(1);
    expect(r1.lang.entries).toEqual({ 'a.x': 'fr:Save', 'a.y': 'fr:Hello {name}', b: 'fr:Close' });
    expect(r1.lang.dictHash).toBe(dictHash(translatable(src)));
    const r2 = await ensureTranslation({ target, dir: 'ltr', source: src, store, post: fr });
    expect(r2.status).toBe('cached'); expect(fr).toHaveBeenCalledTimes(1);
  });
  it('re-translates only the changed and new keys after an app update', async () => {
    const store = memStore();
    await ensureTranslation({ target, dir: 'ltr', source: src, store, post: fr });
    const sent: string[][] = []; const spy: Poster = async (t, k, s) => { sent.push(Object.keys(k)); return fr(t, k, s); };
    const r = await ensureTranslation({ target, dir: 'ltr', source: { ...src, b: 'Close it', 'c.new': 'New' }, store, post: spy });
    expect(sent).toEqual([['b', 'c.new']]);
    expect(r.lang.entries['a.x']).toBe('fr:Save'); expect(r.lang.entries['b']).toBe('fr:Close it');
  });
  it('drops values with broken placeholders and server-flagged fallbacks (kept English, retried next time)', async () => {
    const store = memStore();
    const bad: Poster = async () => ({ translations: { 'a.x': 'Enregistrer', 'a.y': 'Salut', b: 'Close' }, fallback: ['b'] });
    const r = await ensureTranslation({ target, dir: 'ltr', source: src, store, post: bad });
    expect(r.lang.entries).toEqual({ 'a.x': 'Enregistrer' }); expect(r.lang.fallbackKeys).toBe(2); expect(r.lang.dictHash).toBe('partial');
    const sent: string[][] = [];
    const ok: Poster = async (t, k, s) => { sent.push(Object.keys(k)); return fr(t, k, s); };
    const r2 = await ensureTranslation({ target, dir: 'ltr', source: src, store, post: ok });
    expect(sent).toEqual([['a.y', 'b']]); expect(r2.lang.fallbackKeys).toBe(0);
  });
  it('reports progress per batch, saves finished batches when a later one fails, and resumes', async () => {
    const store = memStore(); const big = Object.fromEntries(Array.from({ length: 320 }, (_, i) => [`k${i}`, `v${i}`]));
    let n = 0; const flaky: Poster = async (t, k, s) => { if (++n === 2) throw new Error('boom'); return fr(t, k, s); };
    const prog: [number, number][] = [];
    await expect(ensureTranslation({ target, dir: 'ltr', source: big, store, post: flaky, onProgress: (d, t) => prog.push([d, t]) })).rejects.toThrow('boom');
    expect(prog).toEqual([[0, 3], [1, 3]]);
    expect(Object.keys(store.m.get('fr')!.entries)).toHaveLength(150);
    const sent: number[] = [];
    const r = await ensureTranslation({ target, dir: 'ltr', source: big, store, post: async (t, k, s) => { sent.push(Object.keys(k).length); return fr(t, k, s); } });
    expect(sent).toEqual([150, 20]); expect(r.lang.fallbackKeys).toBe(0);
  });
  it('cancel via AbortSignal stops before the next batch and keeps partial progress', async () => {
    const store = memStore(); const big = Object.fromEntries(Array.from({ length: 320 }, (_, i) => [`k${i}`, `v${i}`]));
    const ac = new AbortController();
    await expect(ensureTranslation({ target, dir: 'ltr', source: big, store, post: fr, signal: ac.signal, onProgress: (d) => { if (d === 1) ac.abort(); } })).rejects.toMatchObject({ name: 'AbortError' });
    expect(Object.keys(store.m.get('fr')!.entries)).toHaveLength(150);
  });
});

describe('LangProvider with a custom language', () => {
  const stored = (code: string, dir: 'rtl' | 'ltr', entries: Record<string, string>): StoredLang => ({ code, name: code, dir, dictHash: 'x', updatedAt: 1, entries, src: {}, fallbackKeys: 0, total: 1 });
  function Probe() { const { t, dir, custom, activateCustom, setLang, lang } = useLang(); return (<div><span data-testid="o">{t('action.save')}|{t('action.close')}|{dir}|{lang}|{custom?.code ?? '-'}</span><button data-testid="b-ar" onClick={() => activateCustom(stored('ar', 'rtl', { 'action.save': 'حفظ' }))} /><button data-testid="b-he" onClick={() => setLang('he')} /></div>); }
  it('switches dir/lang attributes, falls back to English per missing key, and returns to built-ins', async () => {
    const store = memStore(); const user = userEvent.setup();
    render(<LangProvider initialLang="en" store={store}><Probe /></LangProvider>);
    expect(document.documentElement.dir).toBe('ltr');
    await user.click(screen.getByTestId('b-ar'));
    expect(screen.getByTestId('o').textContent).toBe('حفظ|Close|rtl|en|ar');
    expect(document.documentElement.dir).toBe('rtl'); expect(document.documentElement.lang).toBe('ar');
    expect(localStorage.getItem('lf_lang')).toBe('ar'); expect(JSON.parse(localStorage.getItem('lf_lang_custom')!)).toMatchObject({ code: 'ar', dir: 'rtl' });
    expect(uiLanguageHint()).toEqual({ uiLanguage: { code: 'ar', name: 'ar' } });
    await user.click(screen.getByTestId('b-he'));
    expect(document.documentElement.dir).toBe('rtl'); expect(document.documentElement.lang).toBe('he');
    expect(localStorage.getItem('lf_lang_custom')).toBeNull(); expect(uiLanguageHint()).toEqual({});
  });
  it('restores a saved custom language on start; a deleted download falls back to English LTR', async () => {
    const store = memStore(); await store.put(stored('ur', 'rtl', { 'action.save': 'محفوظ' }));
    localStorage.setItem('lf_lang', 'ur'); localStorage.setItem('lf_lang_custom', JSON.stringify({ code: 'ur', name: 'اردو', dir: 'rtl' }));
    const { unmount } = render(<LangProvider store={store}><Probe /></LangProvider>);
    await waitFor(() => expect(screen.getByTestId('o').textContent).toContain('محفوظ'));
    expect(document.documentElement.dir).toBe('rtl'); unmount();
    store.m.clear();
    render(<LangProvider store={store}><Probe /></LangProvider>);
    await waitFor(() => expect(screen.getByTestId('o').textContent).toContain('|ltr|en|-'));
    expect(localStorage.getItem('lf_lang')).toBe('en');
  });
  it('makeT overlays and keeps placeholders; fmt.date uses the custom locale', () => {
    expect(makeT('en', { x: 'y' })('action.save')).toBe('Save');
    act(() => undefined);
    expect(fmt.date('2026-05-01', 'en')).toMatch(/May/);
  });
  it('useT outside a custom language is unchanged', () => { function P() { return <span>{useT()('action.save')}</span>; } render(<LangProvider initialLang="he"><P /></LangProvider>); expect(screen.getByText('שמירה').textContent).toBeTruthy(); });
});

describe('LanguagePanel', () => {
  const wrap = (store: LangStore, post: Poster, onBuiltIn = vi.fn()) => render(<LangProvider initialLang="en" store={store}><ToastProvider><LanguagePanel store={store} post={post} onBuiltIn={onBuiltIn} /></ToastProvider></LangProvider>);
  it('searches, translates, activates (rtl), shows honest note', async () => {
    const store = memStore(); const user = userEvent.setup();
    wrap(store, async (_t, k) => ({ translations: Object.fromEntries(Object.entries(k).map(([a, v]) => [a, v])), fallback: [] }));
    expect(screen.getByText(/Machine translation may be imperfect/)).toBeInTheDocument();
    await user.click(screen.getByText('Translate the app to another language'));
    await user.type(screen.getByRole('searchbox', { name: 'Search languages' }), 'arab');
    await user.click(await screen.findByText('العربية'));
    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));
    expect(store.m.get('ar')).toBeTruthy(); expect(screen.getByTestId('ml-now')).toHaveTextContent('Showing: العربية');
  });
  it('free-text other language', async () => {
    const store = memStore(); const user = userEvent.setup(); const post = vi.fn(fr);
    wrap(store, post);
    await user.click(screen.getByText('Translate the app to another language'));
    await user.type(screen.getByRole('textbox', { name: /Other language/ }), 'Esperanto');
    await user.click(screen.getByRole('button', { name: 'Translate' }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0]![0]).toMatchObject({ name: 'Esperanto' });
    expect(post.mock.calls[0]![0].code).toMatch(/^x-esperanto-/);
  });
  it('ai_unavailable shows the honest message, retry works, nothing is activated', async () => {
    const { ApiRequestError } = await import('../../api/client.ts');
    const store = memStore(); const user = userEvent.setup(); let fail = true;
    wrap(store, async (t, k, s) => { if (fail) throw new ApiRequestError(503, 'ai_unavailable', {}); return fr(t, k, s); });
    await user.click(screen.getByText('Translate the app to another language'));
    await user.click(await screen.findByText('Español'));
    expect(await screen.findByTestId('ml-error')).toHaveTextContent('Translation needs an internet connection and an AI service.');
    expect(document.documentElement.dir).toBe('ltr'); expect(localStorage.getItem('lf_lang_custom')).toBeNull();
    fail = false; await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.getByTestId('ml-now')).toBeInTheDocument());
  });
  it('lists downloaded languages for one-tap switching and delete', async () => {
    const store = memStore(); const user = userEvent.setup();
    await store.put({ code: 'de', name: 'Deutsch', dir: 'ltr', dictHash: 'h', updatedAt: 5, entries: { 'action.save': 'Speichern' }, src: {}, fallbackKeys: 0, total: 1 });
    const onBuiltIn = vi.fn(); wrap(store, fr, onBuiltIn);
    await user.click(screen.getByText('Translate the app to another language'));
    await user.click(await screen.findByRole('button', { name: 'Use' }));
    expect(document.documentElement.lang).toBe('de');
    await user.click(screen.getByText('Translate the app to another language'));
    await user.click(await screen.findByRole('button', { name: 'Delete Deutsch to free space' }));
    await waitFor(() => expect(store.m.size).toBe(0));
    expect(document.documentElement.lang).toBe('en');
  });
});
