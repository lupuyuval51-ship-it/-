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
const OK_RESULT = { ok: true, policy: 'replace', backupVersion: 1, restored: { workouts: 0, sets: 0, foods: 1, weights: 1, plans: 0, savedMeals: 0, customFoods: 0, threads: 0, messages: 0, profile: 0 }, skipped: {}, untouched: ['readiness', 'plans', 'savedMeals', 'customFoods', 'coach', 'xp', 'notifications'] };
let restoreResult: unknown = OK_RESULT;
beforeEach(async () => {
  h.calls.length = 0; current = profileResponse(); restoreResult = OK_RESULT;
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
const v2Backup = {
  version: 2, exportedAt: '2026-05-01T00:00:00.000Z', appVersion: '0.10.0', mode: 'hosted', profile: null, bodyWeight: [{ loggedDate: '2026-05-01', weightKg: 80 }], readiness: [{ localDate: '2026-05-01', sleep: 3, energy: 3, soreness: 3, pain: false }],
  foodLog: validBackup.foodLog, savedMeals: [{ name: 'M', slot: 'lunch', createdAt: '2026-05-01T00:00:00.000Z', items: [{ name: 'Rice', grams: 100, kcal: 130, proteinG: 3, carbsG: 28, fatG: 0 }] }],
  customFoods: [{ name: 'Bar', kcal: 380, proteinG: 30, carbsG: 40, fatG: 12, servingG: 60, barcode: null, createdAt: '2026-05-01T00:00:00.000Z' }],
  plans: [{ id: 'p', name: 'Plan', active: true, archived: false, createdAt: '2026-05-01T00:00:00.000Z', plan: { days: [{ day: 'full_a', estimatedMinutes: 30, exercises: [] }], notes: [] } }],
  sessions: [{ id: 'a', name: 'Done', source: 'custom', sourceId: null, sport: null, startedAt: '2026-05-01T08:00:00.000Z', finishedAt: '2026-05-01T09:00:00.000Z', durationSec: 3600, localDate: '2026-05-01', readiness: null, xpAwarded: 0, exercises: [] }],
  personalRecords: [], xpEvents: [], achievements: [], notifications: [],
  coachThreads: [{ title: 'Chat', createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z', messages: [{ role: 'user', content: 'hi', provider: null, safetyCategory: null, createdAt: '2026-05-01T00:00:00.000Z' }, { role: 'assistant', content: 'hello', provider: 'rules', safetyCategory: null, createdAt: '2026-05-01T00:00:01.000Z' }] }],
};
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
  it('validates the file, states what is replaced, requires confirmation, then restores and shows what came back in plain words', async () => {
    view();
    const user = userEvent.setup();
    await screen.findByText('Backup and restore');
    await user.upload(screen.getByLabelText('Choose a backup file'), json({ backup: validBackup, extra: {} }));
    const dlg = await screen.findByRole('dialog', { name: 'Restore backup?' });
    expect(within(dlg).getByText(/older version of the app/)).toBeInTheDocument();
    expect(within(dlg).getByText(/Restoring replaces your profile, workouts, food log and weight entries/)).toBeInTheDocument();
    expect(within(dlg).getByText('Weight entries: 1')).toBeInTheDocument();
    expect(within(dlg).getByText('Food log entries: 1')).toBeInTheDocument();
    expect(within(dlg).getByText('Workouts: 0')).toBeInTheDocument();
    expect(within(dlg).getByText(/no plans, saved meals, own foods, coach chats, check-ins or XP. Those stay exactly as they are now/)).toBeInTheDocument();
    expect(h.calls.some((c) => c.p === '/api/device/restore')).toBe(false);
    await user.click(within(dlg).getByRole('button', { name: 'Replace my data' }));
    await waitFor(() => expect(h.calls.find((c) => c.p === '/api/device/restore')?.b).toEqual(validBackup));
    const res = await screen.findByTestId('restore-result');
    expect(res).toHaveTextContent('Backup restored'); expect(res).toHaveTextContent('Weight entries: 1'); expect(res).toHaveTextContent('Food log entries: 1');
    expect(res).toHaveTextContent('Left as it was, because this older file does not have them: check-ins, training plans, saved meals, your own foods, coach chats, XP and achievements, notifications.');
  });
  it('a version 2 file lists every kind of data it replaces, shows skipped items, and applies its browser settings after the restore', async () => {
    restoreResult = { ok: true, policy: 'replace', backupVersion: 2, restored: { workouts: 1, sets: 3, foods: 1, weights: 1, plans: 1, savedMeals: 1, customFoods: 1, threads: 1, messages: 2, readiness: 1, profile: 1 }, skipped: { unknownExercises: 2, unfinishedWorkouts: 1 }, untouched: [] };
    localStorage.setItem('lf_live_session', '{"stale":true}'); // scan-ok: a cache key of the live workout, not a credential
    view();
    const user = userEvent.setup();
    await screen.findByText('Backup and restore');
    await user.upload(screen.getByLabelText('Choose a backup file'), json({ backup: v2Backup, extra: { account: null }, clientSettings: { v: 1, theme: 'light', menuMealCount: 4 } }));
    const dlg = await screen.findByRole('dialog', { name: 'Restore backup?' });
    expect(within(dlg).getByText(/REPLACES everything in the app/)).toBeInTheDocument();
    for (const line of ['Workouts: 1', 'Food log entries: 1', 'Weight entries: 1', 'Readiness check-ins: 1', 'Training plans: 1', 'Saved meals: 1', 'Your own foods: 1', 'Coach chats: 1 (2 messages)', 'Settings of this device']) expect(within(dlg).getByText(line)).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: 'Replace my data' }));
    const res = await screen.findByTestId('restore-result');
    expect(res).toHaveTextContent('Coach chats: 1 (2 messages)'); expect(res).toHaveTextContent('Exercises this app version does not know: 2'); expect(res).toHaveTextContent('Workouts that were still in progress: 1');
    expect(res).not.toHaveTextContent('Left as it was');
    const sent = h.calls.find((c) => c.p === '/api/device/restore')?.b as Record<string, unknown>;
    expect(sent['version']).toBe(2); expect(sent).not.toHaveProperty('clientSettings'); // the browser-only block never goes to the restore route
    expect(localStorage.getItem('lf_theme')).toBe('light'); expect(localStorage.getItem('lf_menu_mealcount')).toBe('4');
    expect(localStorage.getItem('lf_live_session')).toBeNull();
  });
  it('the exported file carries the browser settings block next to the backup', async () => {
    localStorage.setItem('lf_theme', 'light');
    const created: Blob[] = [];
    Object.assign(URL, { createObjectURL: (b: Blob) => { created.push(b); return 'blob:x'; }, revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    view();
    await userEvent.setup().click(await screen.findByRole('button', { name: /^Export data/ }));
    await waitFor(() => expect(created).toHaveLength(1));
    const text = await new Promise<string>((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.readAsText(created[0]!); });
    const file = JSON.parse(text) as { backup: unknown; clientSettings: { theme?: string } };
    expect(file.backup).toBeDefined(); expect(file.clientSettings).toMatchObject({ v: 1, theme: 'light' });
  });
  it('cancel in the confirm sheet restores nothing', async () => {
    view();
    const user = userEvent.setup();
    await user.upload(await screen.findByLabelText('Choose a backup file'), json(validBackup));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    expect(h.calls.some((c) => c.p === '/api/device/restore')).toBe(false);
  });
  it('rejects wrong, damaged and too-new files client-side with a specific message and never calls the server', async () => {
    view();
    const user = userEvent.setup();
    const input = await screen.findByLabelText('Choose a backup file');
    await user.upload(input, new File(['{nope'], 'bad.json', { type: 'application/json' }));
    expect(await screen.findByText('This file is not valid JSON.')).toBeInTheDocument();
    await user.upload(input, json({ hello: 1 }));
    expect(await screen.findByText('This is not a LUPU-FIT backup file.')).toBeInTheDocument();
    await user.upload(input, json({ ...v2Backup, version: 9 }));
    expect(await screen.findByText(/made by a newer version of the app \(file format 9\). Update the app/)).toBeInTheDocument();
    await user.upload(input, json({ ...validBackup, version: 0 }));
    expect(await screen.findByText(/not a valid LUPU-FIT backup \(problem at: version\)/)).toBeInTheDocument();
    await user.upload(input, new File([new Uint8Array(8 * 1024 * 1024 + 1)], 'huge.json', { type: 'application/json' }));
    expect(await screen.findByText('This file is too large to restore (the limit is 8 MB).')).toBeInTheDocument();
    expect(h.calls.some((c) => c.p === '/api/device/restore')).toBe(false);
  });
  it('shows clear messages for 413 and 400 from the server', async () => {
    view();
    const user = userEvent.setup();
    const input = await screen.findByLabelText('Choose a backup file');
    restoreResult = new ApiRequestError(413, 'payload_too_large', {});
    await user.upload(input, json(validBackup));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Replace my data' }));
    expect(await screen.findByText('This file is too large to restore (the limit is 8 MB).')).toBeInTheDocument();
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
    expect(within(dlg).getByText(/השחזור מחליף את הפרופיל, האימונים, יומן האוכל ורשומות המשקל/)).toBeInTheDocument();
    expect(within(dlg).getByText('רשומות משקל: 1')).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: 'החלפת הנתונים שלי' }));
    expect(await screen.findByTestId('restore-result')).toHaveTextContent('נשאר כפי שהיה, כי בקובץ הישן הזה אין אותו: בדיקות מוכנות, תוכניות אימון');
  });
  it('a file from a newer app and a wrong file are explained in Hebrew too', async () => {
    view('he');
    const user = userEvent.setup();
    const input = await screen.findByLabelText('בחירת קובץ גיבוי');
    await user.upload(input, json({ hello: 1 }));
    expect(await screen.findByText('זה אינו קובץ גיבוי של LUPU-FIT.')).toBeInTheDocument();
    await user.upload(input, json({ ...v2Backup, version: 7 }));
    expect(await screen.findByText(/נוצר בגרסה חדשה יותר של האפליקציה \(פורמט קובץ 7\)/)).toBeInTheDocument();
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
