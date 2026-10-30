/** Device mode on the page: erasing the phone, the restart after a restore, the welcome flag, the backup file reader. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccountExportDTO } from '@shared/types';
import { buildBackup } from '../backup/backup';
import { readDeviceBackup } from './backup';
import { installPlatform, resetPlatform } from '../../platform';
import { ERASE_FLAG, eraseThisPhone, isWelcomed, markWelcomed, reloadAfterRestore, setDeviceControl, takeRestoredNote } from './control';

const ls = () => Object.keys(window.localStorage).sort();

function file(content: unknown): File {
  const text = typeof content === 'string' ? content : JSON.stringify(content);
  return Object.assign(new File([text], 'backup.json', { type: 'application/json' }), { text: async () => text }); // jsdom's File has no text()
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  for (const [k, v] of [
    ['fitai.locale', '"he"'],
    ['fitai.theme', '"dark"'],
    ['fitai.me', '{"id":"u1"}'],
    ['fitai.draft.u1.food', '{}'],
    ['fitai.device.welcomed', '"u1"'],
    ['other.app', '1'],
  ]) window.localStorage.setItem(k!, v!);
  window.sessionStorage.setItem('fitai.something', '1');
});

afterEach(() => {
  setDeviceControl(null);
  resetPlatform();
});

describe('erase all data on this phone', () => {
  it('deletes the database through the worker, then every app key, and starts again', async () => {
    const erase = vi.fn(async () => undefined);
    setDeviceControl({ erase });
    const reload = vi.fn();
    await eraseThisPhone(reload);
    expect(erase).toHaveBeenCalledTimes(1);
    expect(ls()).toEqual(['other.app']); // not the app's: left alone
    expect(window.sessionStorage.length).toBe(0);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('also deletes the last backup file the app prepared for saving (Android cache folder)', async () => {
    const clearSavedFiles = vi.fn(async () => undefined);
    installPlatform({ clearSavedFiles });
    setDeviceControl({ erase: async () => undefined });
    const reload = vi.fn();
    await eraseThisPhone(reload);
    expect(clearSavedFiles).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('when the worker could not delete it, leaves the flag so the next start deletes it first', async () => {
    setDeviceControl({ erase: async () => Promise.reject(new Error('blocked')) });
    const reload = vi.fn();
    await eraseThisPhone(reload);
    expect(ls()).toEqual([ERASE_FLAG, 'other.app']);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe('after a restore', () => {
  it('drops local copies of the old data, keeps this phone’s choices, and confirms once after the restart', () => {
    const reload = vi.fn();
    reloadAfterRestore(reload);
    expect(ls()).toEqual(['fitai.locale', 'fitai.theme', 'other.app']);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(takeRestoredNote()).toBe(true);
    expect(takeRestoredNote()).toBe(false);
  });
});

describe('welcome', () => {
  it('is done per device account', () => {
    window.localStorage.removeItem('fitai.device.welcomed');
    expect(isWelcomed('u1')).toBe(false);
    markWelcomed('u1');
    expect(isWelcomed('u1')).toBe(true);
    expect(isWelcomed('u2')).toBe(false); // a fresh device account (after erasing) is welcomed again
  });
});

describe('reading a backup file', () => {
  const account = { bodyWeights: [], foodLog: [] } as unknown as AccountExportDTO;
  const device = { outbox: [], workoutPrefs: { wakeLock: true, vibrate: true, autoAdvance: true, restSound: true } };

  it('finds the exact copy of a device backup and what it holds', async () => {
    const snapshot = {
      format: 'lupu-fit-device-data',
      version: 1,
      schema: '0094_server_settings.sql',
      createdAt: '2026-10-29T10:00:00.000Z',
      user: {},
      tables: { workout_plans: [{ id: 'p' }], workout_sessions: [{ status: 'completed' }, { status: 'active' }], food_log_entries: [{}, {}] },
      sharedFoods: [],
    };
    const res = await readDeviceBackup(file(buildBackup(account, { ...device, snapshot: snapshot as never })));
    expect(res).toMatchObject({ ok: true, createdAt: '2026-10-29T10:00:00.000Z', summary: { plans: 1, workouts: 1, foods: 2, weights: 0, coachThreads: 0 } });
  });

  it('says why another file cannot be restored on the phone', async () => {
    expect(await readDeviceBackup(file(buildBackup(account, device)))).toEqual({ ok: false, reason: 'no_snapshot' }); // made by the website
    expect(await readDeviceBackup(file('{nope'))).toEqual({ ok: false, reason: 'not_json' });
    expect(await readDeviceBackup(file({ hello: 'world' }))).toEqual({ ok: false, reason: 'not_a_backup' });
  });
});
