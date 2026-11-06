import 'fake-indexeddb/auto';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '../api/client.ts';
import { PROFILE, renderWith } from '../components/nutrition/testHarness.tsx';

const h = vi.hoisted(() => ({
  device: true,
  onboarded: false,
  restore: null as null | Error,
  calls: [] as { m: string; p: string; b?: unknown }[],
}));
vi.mock('../env.ts', async (orig) => {
  const real = await orig<typeof import('../env.ts')>();
  return { ...real, get IS_DEVICE() { return h.device; }, get RUN_MODE() { return h.device ? 'device' : 'hosted'; } };
});
vi.mock('../api/client.ts', async (orig) => {
  const real = await orig<typeof import('../api/client.ts')>();
  const run = async (m: string, p: string, b?: unknown) => {
    h.calls.push({ m, p, b });
    if (p === '/api/auth/me') return { user: { id: 'u1', username: 'device_x', role: 'user' }, csrfToken: 'c', onboarded: h.onboarded, mode: h.device ? 'device' : 'hosted' };
    if (p === '/api/device/restore') {
      if (h.restore) throw h.restore;
      const profile = (b as { profile: unknown }).profile;
      if (profile) h.onboarded = true; // like the server: a restored profile means the app is onboarded
      return { ok: true, policy: 'replace', backupVersion: (b as { version: number }).version, restored: { foods: 1, weights: 1, workouts: 1, profile: profile ? 1 : 0 }, skipped: {}, untouched: [] };
    }
    return {};
  };
  return { ...real, api: { get: (p: string) => run('GET', p), post: (p: string, b?: unknown) => run('POST', p, b), put: run.bind(null, 'PUT'), patch: run.bind(null, 'PATCH'), delete: run.bind(null, 'DELETE') } };
});
const { default: Welcome } = await import('./Welcome.tsx');

const FOOD = [{ loggedDate: '2026-05-01', slot: 'lunch', name: 'Rice', grams: 100, kcal: 130, proteinG: 2, carbsG: 28, fatG: 0.3 }];
const v1 = { version: 1, exportedAt: '2026-05-01T00:00:00Z', profile: null, bodyWeight: [{ loggedDate: '2026-05-01', weightKg: 80 }], foodLog: FOOD, sessions: [] };
const v2 = {
  version: 2, exportedAt: '2026-05-01T00:00:00.000Z', appVersion: '0.10.0', mode: 'device', profile: PROFILE, bodyWeight: v1.bodyWeight, readiness: [], foodLog: FOOD, savedMeals: [], customFoods: [], plans: [],
  sessions: [{ id: 'a', name: 'Done', source: 'custom', sourceId: null, sport: null, startedAt: '2026-05-01T08:00:00.000Z', finishedAt: '2026-05-01T09:00:00.000Z', durationSec: 3600, localDate: '2026-05-01', readiness: null, xpAwarded: 0, exercises: [] }],
  personalRecords: [], xpEvents: [], achievements: [], notifications: [], coachThreads: [],
};
const file = (o: unknown, name = 'lupu-fit-backup-2026-05-01.json') => new File([typeof o === 'string' ? o : JSON.stringify({ backup: o, extra: { account: null } })], name, { type: 'application/json' });

function Where() { const l = useLocation(); return <output data-testid="where">{l.pathname}</output>; }
const view = (lang: 'he' | 'en' = 'en') => renderWith(
  <><Routes><Route path="/welcome" element={<Welcome />} /><Route path="/" element={<p>{'HOME-SCREEN'}</p>} /><Route path="/onboarding" element={<p>{'ONBOARDING-SCREEN'}</p>} /></Routes><Where /></>,
  { route: '/welcome', lang },
);

beforeEach(() => { h.device = true; h.onboarded = false; h.restore = null; h.calls.length = 0; localStorage.clear(); });

describe('Welcome: restore entry', () => {
  it('Device Mode: a secondary "I already have a backup" button; Start stays the only primary action', async () => {
    const { container } = view();
    const restore = await screen.findByRole('button', { name: 'I already have a backup' });
    expect(restore).not.toHaveClass('btn-primary');
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Set up my profile' })).toHaveClass('btn-primary');
    expect(screen.getByRole('link', { name: 'Set up my profile' })).toHaveAttribute('href', '/onboarding');
    expect(screen.getByLabelText('Choose a backup file')).toHaveAttribute('accept', expect.stringContaining('text/plain'));
  });

  it('wording has no account/server/sign-in words (Device Mode), in English and Hebrew', async () => {
    const { container, unmount } = view();
    await screen.findByRole('button', { name: 'I already have a backup' });
    expect(container.querySelector('.welcome-restore')?.textContent ?? '').not.toMatch(/account|server|sign|log ?in|cloud|sync/i);
    unmount();
    const he = view('he');
    await screen.findByRole('button', { name: 'כבר יש לי גיבוי' });
    expect(he.container.querySelector('.welcome-restore')?.textContent ?? '').not.toMatch(/חשבון|שרת|ענן|סנכרון|התחבר/);
    expect(he.container.querySelectorAll('.btn-primary')).toHaveLength(1);
    expect(screen.getByLabelText('בחירת קובץ גיבוי')).toBeInTheDocument();
  });

  it('hosted build: no restore entry at all (only the single primary action)', async () => {
    h.device = false;
    const { container } = view();
    await screen.findByRole('link', { name: 'Set up my profile' });
    expect(screen.queryByRole('button', { name: 'I already have a backup' })).toBeNull();
    expect(screen.queryByLabelText('Choose a backup file')).toBeNull();
    expect(container.querySelectorAll('.btn-primary')).toHaveLength(1);
  });
});

describe('Welcome: restoring before onboarding', () => {
  it('a backup with a profile asks for confirmation, restores, and goes straight to Home (no onboarding)', async () => {
    view();
    const user = userEvent.setup();
    await user.upload(await screen.findByLabelText('Choose a backup file'), file(v2));
    const dlg = await screen.findByRole('dialog', { name: 'Restore backup?' });
    expect(within(dlg).getByText('Weight entries: 1')).toBeInTheDocument();
    expect(within(dlg).getByText('Profile')).toBeInTheDocument();
    expect(h.calls.some((c) => c.p === '/api/device/restore')).toBe(false); // nothing happens before the person confirms
    await user.click(within(dlg).getByRole('button', { name: 'Replace my data' }));
    expect(await screen.findByText('HOME-SCREEN')).toBeInTheDocument();
    expect(screen.getByTestId('where')).toHaveTextContent('/');
    expect(screen.queryByText('ONBOARDING-SCREEN')).toBeNull();
    expect(h.calls.filter((c) => c.p === '/api/device/restore')).toHaveLength(1);
    expect((h.calls.find((c) => c.p === '/api/device/restore')?.b as { version: number }).version).toBe(2);
    expect(await screen.findByText('Backup restored. Welcome back.')).toBeInTheDocument();
  });

  it('a version 1 file without a profile restores and continues to onboarding', async () => {
    view();
    const user = userEvent.setup();
    await user.upload(await screen.findByLabelText('Choose a backup file'), file(v1));
    const dlg = await screen.findByRole('dialog', { name: 'Restore backup?' });
    expect(within(dlg).getByText(/older version of the app/)).toBeInTheDocument();
    await user.click(within(dlg).getByRole('button', { name: 'Replace my data' }));
    expect(await screen.findByText('ONBOARDING-SCREEN')).toBeInTheDocument();
    expect(screen.getByTestId('where')).toHaveTextContent('/onboarding');
    expect(await screen.findByText(/It has no profile, so set one up next/)).toBeInTheDocument();
    expect(h.calls.filter((c) => c.p === '/api/device/restore')).toHaveLength(1);
  });

  it('works the same in Hebrew', async () => {
    view('he');
    const user = userEvent.setup();
    await user.upload(await screen.findByLabelText('בחירת קובץ גיבוי'), file(v2));
    await user.click(within(await screen.findByRole('dialog', { name: 'לשחזר גיבוי?' })).getByRole('button', { name: 'החלפת הנתונים שלי' }));
    expect(await screen.findByText('HOME-SCREEN')).toBeInTheDocument();
  });

  it('cancelling the confirmation changes nothing and stays on Welcome', async () => {
    view();
    const user = userEvent.setup();
    await user.upload(await screen.findByLabelText('Choose a backup file'), file(v2));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    expect(h.calls.some((c) => c.p === '/api/device/restore')).toBe(false);
    expect(screen.getByTestId('where')).toHaveTextContent('/welcome');
    expect(h.onboarded).toBe(false);
  });

  it('a wrong, broken or too-new file is refused in plain words: no restore call, no navigation, no state change', async () => {
    view();
    const user = userEvent.setup();
    const input = await screen.findByLabelText('Choose a backup file');
    await user.upload(input, file('{"hello":1}', 'notes.json'));
    expect(await screen.findByText('This is not a LUPU-FIT backup file.')).toBeInTheDocument();
    await user.upload(input, file('{nope', 'broken.json'));
    expect(await screen.findByText('This file is not valid JSON.')).toBeInTheDocument();
    await user.upload(input, file({ ...v2, version: 9 }));
    expect(await screen.findByText(/made by a newer version of the app \(file format 9\)/)).toBeInTheDocument();
    await user.upload(input, file({ ...v2, plans: 'nope' }));
    expect(await screen.findByText(/not a valid LUPU-FIT backup \(problem at: plans\)/)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(h.calls.some((c) => c.p === '/api/device/restore')).toBe(false);
    expect(screen.getByTestId('where')).toHaveTextContent('/welcome');
    expect(h.onboarded).toBe(false);
    expect(screen.getByRole('link', { name: 'Set up my profile' })).toBeInTheDocument(); // the normal way in is still there
  });

  it('a file that is not a backup is refused even when its MIME type looks right, and an octet-stream label is not a reason to refuse a real backup', async () => {
    view();
    const user = userEvent.setup({ applyAccept: false });
    const input = await screen.findByLabelText('Choose a backup file');
    await user.upload(input, new File(['MZ\u0000\u0001'], 'x.json', { type: 'application/json' }));
    expect(await screen.findByText('This file is not valid JSON.')).toBeInTheDocument();
    await user.upload(input, new File([JSON.stringify({ backup: v2 })], 'download.bin', { type: 'application/octet-stream' }));
    expect(await screen.findByRole('dialog', { name: 'Restore backup?' })).toBeInTheDocument();
  });

  it('a server-side refusal after confirming is shown on Welcome and nothing changes', async () => {
    h.restore = new ApiRequestError(400, 'validation_error', {});
    view();
    const user = userEvent.setup();
    await user.upload(await screen.findByLabelText('Choose a backup file'), file(v2));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Replace my data' }));
    expect(await screen.findByText('This backup file is not valid.')).toBeInTheDocument(); // device wording
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByTestId('where')).toHaveTextContent('/welcome');
    expect(h.onboarded).toBe(false);
  });
});
