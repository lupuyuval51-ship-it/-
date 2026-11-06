import 'fake-indexeddb/auto';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { profileResponse, renderWith } from '../nutrition/testHarness.tsx';

const h = vi.hoisted(() => ({
  native: true, docs: true,
  calls: [] as { m: string; p: string; b?: unknown }[],
  save: vi.fn(), docsSave: vi.fn(),
}));
vi.mock('../../api/client.ts', async (orig) => {
  const real = await orig<typeof import('../../api/client.ts')>();
  const run = async (m: string, p: string, b?: unknown) => {
    h.calls.push({ m, p, b });
    if (p === '/api/profile') return profileResponse();
    if (p === '/api/export') return { backup: { version: 2, exportedAt: '2026-05-01T00:00:00.000Z', profile: null }, extra: {} };
    if (p === '/api/device/restore') return { ok: true, policy: 'replace', backupVersion: 1, restored: { foods: 1, weights: 1 }, skipped: {}, untouched: [] };
    return {};
  };
  return { ...real, api: { get: (p: string) => run('GET', p), post: (p: string, b?: unknown) => run('POST', p, b), put: (p: string, b?: unknown) => run('PUT', p, b), patch: run.bind(null, 'PATCH'), delete: run.bind(null, 'DELETE') } };
});
vi.mock('../../lib/nativeFile.ts', async (orig) => {
  const real = await orig<typeof import('../../lib/nativeFile.ts')>();
  return { ...real, isNativeApp: () => h.native, canSaveToDocuments: async () => h.docs, saveAndShareBackup: h.save, saveBackupToDocuments: h.docsSave };
});
const { BackupPanel } = await import('./BackupPanel.tsx');
const { BACKUP_ACCEPT } = await import('./backupRestore.tsx');

const validBackup = { version: 1, exportedAt: '2026-05-01T00:00:00Z', profile: null, bodyWeight: [{ loggedDate: '2026-05-01', weightKg: 80 }], foodLog: [{ loggedDate: '2026-05-01', slot: 'lunch', name: 'Rice', grams: 100, kcal: 130, proteinG: 2, carbsG: 28, fatG: 0.3 }], sessions: [] };

beforeEach(() => {
  h.native = true; h.docs = true; h.calls.length = 0; h.save.mockReset(); h.docsSave.mockReset(); localStorage.clear();
  h.save.mockResolvedValue({ status: 'shared', filename: 'x.json' });
  h.docsSave.mockResolvedValue({ status: 'saved', filename: 'x.json', location: 'Documents/LUPU-FIT/x.json' });
});

describe('BackupPanel in the Android app', () => {
  it('Export data hands the pretty JSON and a dated file name to the share sheet, and records the backup', async () => {
    renderWith(<BackupPanel />);
    await userEvent.setup().click(await screen.findByRole('button', { name: /^Export data/ }));
    await waitFor(() => expect(h.save).toHaveBeenCalledTimes(1));
    const [name, json, opts] = h.save.mock.calls[0] as [string, string, { title: string }];
    expect(name).toMatch(/^lupu-fit-backup-\d{4}-\d{2}-\d{2}\.json$/);
    const file = JSON.parse(json) as { backup: { version: number }; clientSettings: { v: number } };
    expect(file.backup.version).toBe(2); expect(file.clientSettings.v).toBe(1);
    expect(json).toContain('\n'); expect(opts.title).toBe('LUPU-FIT backup');
    await waitFor(() => expect(localStorage.getItem('lf_auto_backup')).toContain('"lastDone":"'));
    expect(await screen.findByText('Backup file sent to the app you chose')).toBeInTheDocument();
  });

  it('closing the share sheet shows nothing: no error, no toast, no backup recorded', async () => {
    h.save.mockResolvedValue({ status: 'cancelled' });
    renderWith(<BackupPanel />);
    await userEvent.setup().click(await screen.findByRole('button', { name: /^Export data/ }));
    await waitFor(() => expect(h.save).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 30));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
    expect(localStorage.getItem('lf_auto_backup')).toBeNull();
  });

  it('a real failure is explained in plain words, with the reason, and no backup is recorded', async () => {
    h.save.mockResolvedValue({ status: 'error', stage: 'write', detail: 'ENOSPC' });
    renderWith(<BackupPanel />);
    await userEvent.setup().click(await screen.findByRole('button', { name: /^Export data/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The backup file could not be created on this phone. Free up some storage and try again. (ENOSPC)');
    expect(localStorage.getItem('lf_auto_backup')).toBeNull();
    h.save.mockResolvedValue({ status: 'error', stage: 'share' });
    await userEvent.setup().click(screen.getByRole('button', { name: /^Export data/ }));
    expect(await screen.findByText(/share sheet could not be opened/)).toBeInTheDocument();
  });

  it('offers Save to Documents as a second, explicit action and says where the file went', async () => {
    renderWith(<BackupPanel />);
    await userEvent.setup().click(await screen.findByRole('button', { name: /^Save to Documents/ }));
    await waitFor(() => expect(h.docsSave).toHaveBeenCalledTimes(1));
    expect((h.docsSave.mock.calls[0] as [string])[0]).toMatch(/^lupu-fit-backup-\d{4}-\d{2}-\d{2}-\d{4}\.json$/);
    expect(h.save).not.toHaveBeenCalled();
    expect(await screen.findByText('Saved to Documents/LUPU-FIT/x.json')).toBeInTheDocument();
    h.docsSave.mockResolvedValue({ status: 'error', stage: 'documents', detail: 'EACCES' });
    await userEvent.setup().click(screen.getByRole('button', { name: /^Save to Documents/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be saved to Documents.*\(EACCES\)/);
  });

  it('hides Save to Documents when no permission-free save is possible, and says so', async () => {
    h.docs = false;
    renderWith(<BackupPanel />);
    expect(await screen.findByText(/Saving straight to Documents is not available on this version of Android/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Save to Documents/ })).toBeNull();
  });

  it('has no separate browser Share row (Export already is the share sheet)', async () => {
    Object.assign(navigator, { share: vi.fn() });
    renderWith(<BackupPanel />);
    await screen.findByRole('button', { name: /^Export data/ });
    expect(screen.queryByRole('button', { name: /^Share/ })).toBeNull();
    Object.assign(navigator, { share: undefined });
  });
});

describe('BackupPanel in a browser', () => {
  it('keeps Export (download) and Share rows and no Documents action', async () => {
    h.native = false;
    Object.assign(navigator, { share: vi.fn() });
    renderWith(<BackupPanel />);
    expect(await screen.findByRole('button', { name: /^Share/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Save to Documents/ })).toBeNull();
    expect(screen.queryByText(/Saving straight to Documents/)).toBeNull();
    Object.assign(navigator, { share: undefined });
  });
});

describe('restore picker: validated by content, not by MIME type', () => {
  it('accepts json, plain text and octet-stream labels (Android pickers use all three) and lists the MIME types first', () => {
    const parts = BACKUP_ACCEPT.split(',');
    expect(parts).toEqual(expect.arrayContaining(['application/json', '.json', 'text/plain', 'application/octet-stream']));
    expect(parts[0]).toBe('application/json');
    renderWith(<BackupPanel />);
    expect(screen.getByLabelText('Choose a backup file')).toHaveAttribute('accept', BACKUP_ACCEPT);
  });

  it.each([['text/plain', 'backup.txt'], ['application/octet-stream', 'backup.bin'], ['', 'backup.json'], ['application/json', 'backup.json']])('a valid backup labelled "%s" (%s) is staged for confirmation', async (type, name) => {
    renderWith(<BackupPanel />);
    await userEvent.setup({ applyAccept: false }).upload(screen.getByLabelText('Choose a backup file'), new File([JSON.stringify(validBackup)], name, { type }));
    const dlg = await screen.findByRole('dialog', { name: 'Restore backup?' });
    expect(within(dlg).getByText('Weight entries: 1')).toBeInTheDocument();
  });

  it('a file of the right MIME type that is not a backup is refused, nothing is restored', async () => {
    renderWith(<BackupPanel />);
    await userEvent.setup().upload(screen.getByLabelText('Choose a backup file'), new File(['hello'], 'notes.json', { type: 'application/json' }));
    expect(await screen.findByText('This file is not valid JSON.')).toBeInTheDocument();
    expect(h.calls.some((c) => c.p === '/api/device/restore')).toBe(false);
  });
});
