import 'fake-indexeddb/auto';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '../api/client.ts';
import { profileResponse, renderWith } from '../components/nutrition/testHarness.tsx';

const h = vi.hoisted(() => ({ handler: (_m: string, _p: string, _b?: unknown, _q?: unknown): unknown => ({}), calls: [] as { m: string; p: string; b?: unknown; q?: unknown }[] }));
vi.mock('../api/client.ts', async (orig) => {
  const real = await orig<typeof import('../api/client.ts')>();
  const run = async (m: string, p: string, b?: unknown, q?: unknown) => { h.calls.push({ m, p, b, q }); const r = h.handler(m, p, b, q); if (r instanceof Error) throw r; return r; };
  return { ...real, api: { get: (p: string, q?: unknown) => run('GET', p, undefined, q), post: (p: string, b?: unknown) => run('POST', p, b), put: (p: string, b?: unknown) => run('PUT', p, b), patch: (p: string, b?: unknown) => run('PATCH', p, b), delete: (p: string, b?: unknown) => run('DELETE', p, b) } };
});
const { default: Profile } = await import('./Profile.tsx');
const { outbox } = await import('../lib/outbox.ts');

let current = profileResponse();
let restoreResult: unknown = { ok: true, restored: { weights: 1, foodEntries: 1, sessions: 0 } };
beforeEach(async () => {
  h.calls.length = 0; current = profileResponse(); restoreResult = { ok: true, restored: { weights: 1, foodEntries: 1, sessions: 0 } };
  localStorage.clear();
  for (const i of outbox.list()) await outbox.remove(i.id);
  h.handler = (m, p, b) => {
    if (p === '/api/profile' && m === 'GET') return current;
    if (p === '/api/profile' && m === 'PUT') { const prof = b as Record<string, unknown>; const kcal = prof['customKcal'] as number | undefined; current = { profile: prof as never, targets: { ...current.targets, kcal: kcal !== undefined && kcal < 1500 ? 1500 : kcal ?? current.targets.kcal, notes: kcal !== undefined && kcal < 1500 ? ['custom_clamped'] : [] } }; return current; }
    if (p === '/api/export') return { backup: { version: 1, exportedAt: 'x', profile: null, bodyWeight: [], foodLog: [], sessions: [] }, extra: {} };
    if (p === '/api/device/restore') return restoreResult;
    if (p === '/api/auth/logout') return { ok: true };
    return {};
  };
});
const view = (lang: 'he' | 'en' = 'en') => renderWith(<Routes><Route path="/profile" element={<Profile />} /><Route path="/login" element={<div>{'login-route'}</div>} /></Routes>, { route: '/profile', lang });
const validBackup = { version: 1, exportedAt: '2026-05-01T00:00:00Z', profile: null, bodyWeight: [{ loggedDate: '2026-05-01', weightKg: 80 }], foodLog: [{ loggedDate: '2026-05-01', slot: 'lunch', name: 'Rice', grams: 100, kcal: 130, proteinG: 2, carbsG: 28, fatG: 0.3 }], sessions: [] };
const json = (o: unknown) => new File([JSON.stringify(o)], 'backup.json', { type: 'application/json' });

describe('Profile basics', () => {
  it('shows the targets summary, run mode, version and links', async () => {
    view();
    expect(await screen.findByText('Daily targets')).toBeInTheDocument();
    expect(screen.getByText('2,500', { selector: '.num-hero' })).toBeInTheDocument();
    expect(screen.getByText('In your account')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Redo the questionnaire/ })).toHaveAttribute('href', '/onboarding');
    expect(screen.getByRole('link', { name: 'Delete account' })).toHaveAttribute('href', '/account-deletion');
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
  });
  it('has exactly one primary button', async () => {
    const { container } = view();
    await screen.findByText('Daily targets');
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(1);
  });
  it('saves edits with PUT /api/profile and explains a clamped custom calorie target', async () => {
    view();
    const user = userEvent.setup();
    const kcal = await screen.findByRole('textbox', { name: /Custom calorie target/ });
    await user.type(kcal, '1000');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(h.calls.find((c) => c.m === 'PUT' && c.p === '/api/profile')?.b).toMatchObject({ customKcal: 1000, age: 30 }));
    expect(await screen.findByTestId('clamp-note')).toHaveTextContent('You asked for 1,000 kcal, but the safe target for you is 1,500 kcal');
    expect(screen.getByText(/adjusted to stay safe/)).toBeInTheDocument();
  });
  it('blocks invalid values client-side without calling the server', async () => {
    view();
    const user = userEvent.setup();
    const age = await screen.findByRole('textbox', { name: 'Age' });
    await user.clear(age); await user.type(age, '5');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(h.calls.some((c) => c.m === 'PUT')).toBe(false);
    expect((await screen.findAllByText('Invalid value')).some((x) => x.className === 'field-error')).toBe(true);
  });
  it('switching language applies instantly and persists profile.language', async () => {
    view();
    const user = userEvent.setup();
    await screen.findByText('Daily targets');
    await user.click(screen.getByRole('radio', { name: 'עברית' }));
    await waitFor(() => expect(h.calls.find((c) => c.m === 'PUT')?.b).toMatchObject({ language: 'he' }));
    expect(await screen.findByText('יעדים יומיים')).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('rtl');
  });
  it('theme change persists too', async () => {
    view();
    const user = userEvent.setup();
    await screen.findByText('Daily targets');
    await user.click(screen.getByRole('radio', { name: 'Light' }));
    await waitFor(() => expect(h.calls.find((c) => c.m === 'PUT')?.b).toMatchObject({ theme: 'light' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
  it('"Other language" submits its own request and never the profile form (no nested forms)', async () => {
    const base = h.handler;
    h.handler = (m, p, b, q) => (p === '/api/i18n/translate' ? new ApiRequestError(503, 'ai_unavailable', {}) : base(m, p, b, q));
    view();
    const user = userEvent.setup();
    await screen.findByText('Daily targets');
    await user.click(screen.getByRole('button', { name: /Translate the app to another language/ }));
    const sheet = await screen.findByRole('dialog');
    expect(document.querySelectorAll('form form')).toHaveLength(0);
    await user.type(within(sheet).getByLabelText('Other language'), 'Klingon');
    await user.click(within(sheet).getByRole('button', { name: 'Translate' }));
    await waitFor(() => expect(h.calls.some((c) => c.m === 'POST' && c.p === '/api/i18n/translate')).toBe(true));
    expect(await within(sheet).findByTestId('ml-error')).toHaveTextContent('Translation needs an internet connection and an AI service.');
    const posts = h.calls.filter((c) => c.m === 'POST' && c.p === '/api/i18n/translate').length;
    await user.type(within(sheet).getByLabelText('Other language'), '{Enter}');
    await waitFor(() => expect(h.calls.filter((c) => c.m === 'POST' && c.p === '/api/i18n/translate').length).toBeGreaterThan(posts));
    expect(h.calls.some((c) => c.m === 'PUT' && c.p === '/api/profile')).toBe(false); // the profile save never fired
  });
});

describe('Videos and outbox', () => {
  it('toggles Wi-Fi only (persisted) and degrades honestly without a service worker', async () => {
    view();
    const user = userEvent.setup();
    const sw = await screen.findByRole('switch', { name: 'Autoplay on Wi-Fi only' });
    expect(sw).not.toBeChecked();
    await user.click(sw);
    expect(localStorage.getItem('lf_video_wifi_only')).toBe('1');
    expect(await screen.findByTestId('no-sw')).toBeInTheDocument();
  });
  it('lists pending and rejected outbox items with retry / discard', async () => {
    const c = await outbox.enqueue({ method: 'POST', path: '/api/z', body: {}, label: 'Will be rejected' });
    h.handler = (_m, p) => (p === '/api/z' ? new ApiRequestError(400, 'validation_error', {}) : p === '/api/profile' ? current : {});
    await outbox.flush();
    expect(outbox.list().find((i) => i.id === c.id)?.status).toBe('rejected');
    view();
    expect(await screen.findByText('Will be rejected')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(outbox.list()).toHaveLength(0));
  });
});

describe('Backup and restore', () => {
  it('exports to lupu-fit-export.json', async () => {
    const create = vi.fn(() => 'blob:x'); const revoke = vi.fn();
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    const names: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { names.push(this.download); });
    view();
    await userEvent.setup().click(await screen.findByRole('button', { name: /^Export data/ }));
    await waitFor(() => expect(names).toEqual(['lupu-fit-export.json']));
    expect(h.calls.some((c) => c.p === '/api/export')).toBe(true);
  });
  it('validates the file, requires confirmation, then restores and shows counts', async () => {
    view();
    const user = userEvent.setup();
    await screen.findByText('Backup and restore');
    await user.upload(screen.getByLabelText('Choose a backup file'), json({ backup: validBackup, extra: {} }));
    const dlg = await screen.findByRole('dialog', { name: 'Restore backup?' });
    expect(within(dlg).getByText(/replaces your current workouts, food log and weight entries/)).toBeInTheDocument();
    expect(within(dlg).getByText(/1 weight entries, 1 food entries and 0 workouts/)).toBeInTheDocument();
    expect(h.calls.some((c) => c.p === '/api/device/restore')).toBe(false);
    await user.click(within(dlg).getByRole('button', { name: 'Replace my data' }));
    await waitFor(() => expect(h.calls.find((c) => c.p === '/api/device/restore')?.b).toEqual(validBackup));
    expect(await screen.findByTestId('restore-result')).toHaveTextContent('Restored 1 weight entries, 1 food entries and 0 workouts.');
  });
  it('cancel in the confirm sheet restores nothing', async () => {
    view();
    const user = userEvent.setup();
    await user.upload(await screen.findByLabelText('Choose a backup file'), json(validBackup));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    expect(h.calls.some((c) => c.p === '/api/device/restore')).toBe(false);
  });
  it('rejects invalid files client-side with a clear message and never calls the server', async () => {
    view();
    const user = userEvent.setup();
    const input = await screen.findByLabelText('Choose a backup file');
    await user.upload(input, new File(['{nope'], 'bad.json', { type: 'application/json' }));
    expect(await screen.findByText('This file is not valid JSON.')).toBeInTheDocument();
    await user.upload(input, json({ ...validBackup, version: 9 }));
    expect(await screen.findByText(/not a valid LUPU-FIT backup \(problem at: version\)/)).toBeInTheDocument();
    expect(h.calls.some((c) => c.p === '/api/device/restore')).toBe(false);
  });
  it('shows clear messages for 413 and 400 from the server', async () => {
    view();
    const user = userEvent.setup();
    const input = await screen.findByLabelText('Choose a backup file');
    restoreResult = new ApiRequestError(413, 'payload_too_large', {});
    await user.upload(input, json(validBackup));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Replace my data' }));
    expect(await screen.findByText('The file is too large.')).toBeInTheDocument();
    restoreResult = new ApiRequestError(400, 'validation_error', {});
    await user.upload(input, json(validBackup));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Replace my data' }));
    expect(await screen.findByText('The server rejected this backup as invalid.')).toBeInTheDocument();
  });
  it('restore texts work in Hebrew', async () => {
    view('he');
    const user = userEvent.setup();
    await user.upload(await screen.findByLabelText('בחירת קובץ גיבוי'), json(validBackup));
    const dlg = await screen.findByRole('dialog', { name: 'לשחזר גיבוי?' });
    expect(within(dlg).getByText(/מחליף את האימונים, יומן האוכל ורשומות המשקל/)).toBeInTheDocument();
  });
});

describe('Logout', () => {
  it('posts logout, clears the query cache and navigates to /login', async () => {
    const { qc } = view();
    const user = userEvent.setup();
    await screen.findByText('Daily targets');
    expect(qc.getQueryCache().getAll().length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByText('login-route')).toBeInTheDocument();
    expect(h.calls.some((c) => c.m === 'POST' && c.p === '/api/auth/logout')).toBe(true);
    expect(qc.getQueryCache().getAll().filter((q) => q.state.data !== undefined)).toHaveLength(0);
  });
});
