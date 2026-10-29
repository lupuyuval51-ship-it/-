import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccountExportDTO, WorkoutPrefsDTO } from '@shared/types';

const apiPost = vi.fn();
const fetchAccountExport = vi.fn();
vi.mock('../../api/client', async (importOriginal) => ({ ...(await importOriginal<typeof import('../../api/client')>()), apiPost: (...a: unknown[]) => apiPost(...a) }));
vi.mock('../../features/profile/api', () => ({ fetchAccountExport: () => fetchAccountExport(), downloadJson: vi.fn() }));
vi.mock('../../auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'u1', timezone: 'UTC' } }) }));

import { ToastProvider } from '../../components/ui';
import { buildBackup } from '../../features/backup/backup';
import { readPrefs, resetPrefsCache } from '../../features/sessions/prefs';
import { I18nProvider } from '../../i18n';
import { isPrefsDirty } from '../../lib/prefsDirty';
import { BackupSection } from './BackupSection';

const DEVICE_PREFS: WorkoutPrefsDTO = { wakeLock: true, vibrate: true, autoAdvance: true, restSound: true };
const PREFS_LINE = /Workout settings from the backup/;

function backupFile({ prefs = DEVICE_PREFS, weights = [] as unknown[] } = {}): File {
  const text = JSON.stringify(buildBackup({ bodyWeights: weights, foodLog: [] } as unknown as AccountExportDTO, { outbox: [], workoutPrefs: prefs }));
  const file = new File([text], 'backup.json', { type: 'application/json' });
  return Object.assign(file, { text: async () => text }); // jsdom's File has no text()
}

async function openRestore(file: File): Promise<HTMLElement> {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <I18nProvider locale="en">
        <ToastProvider>
          <BackupSection />
        </ToastProvider>
      </I18nProvider>
    </QueryClientProvider>,
  );
  fireEvent.change(screen.getByTestId('backup-file'), { target: { files: [file] } });
  return screen.findByRole('dialog', { name: 'Restore from backup' });
}

beforeEach(() => {
  window.localStorage.clear(); // this device has the default workout settings and nothing waiting to sync
  resetPrefsCache();
  apiPost.mockReset().mockResolvedValue({});
  fetchAccountExport.mockReset().mockResolvedValue({ bodyWeights: [], foodLog: [] });
});

describe('BackupSection restore preview', () => {
  it('offers no Restore when the file has nothing new, so stale settings cannot be applied and uploaded', async () => {
    const dialog = await openRestore(backupFile());
    expect(within(dialog).getByText('This backup has nothing your account is missing.')).toBeTruthy();
    expect(within(dialog).queryByRole('button', { name: 'Restore' })).toBeNull();
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(isPrefsDirty()).toBe(false);
  });

  it('does not list or touch the workout settings when the file has the same ones', async () => {
    const dialog = await openRestore(backupFile({ weights: [{ id: 'w1', measuredOn: '2026-01-15', weightKg: 80, note: '' }] }));
    expect(within(dialog).getByText('1 weigh-in')).toBeTruthy();
    expect(within(dialog).queryByText(PREFS_LINE)).toBeNull();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Restore' }));
    await within(dialog).findByText('Restore finished');
    expect(apiPost).toHaveBeenCalledTimes(1);
    expect(isPrefsDirty()).toBe(false); // nothing is pushed to the account
  });

  it('lists different workout settings as a change and applies them only then', async () => {
    const dialog = await openRestore(backupFile({ prefs: { ...DEVICE_PREFS, vibrate: false } }));
    expect(within(dialog).getByText(PREFS_LINE)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Restore' }));
    await within(dialog).findByText('Restore finished');
    expect(readPrefs().vibrate).toBe(false);
    expect(isPrefsDirty()).toBe(true); // shared with the account
    expect(apiPost).not.toHaveBeenCalled();
  });
});
