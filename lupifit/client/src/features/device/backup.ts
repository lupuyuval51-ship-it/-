/**
 * Device-mode backup file: the readable account export (same as the website's backup file) plus the
 * exact copy of the phone's database (`device.snapshot`), which a restore on this or another phone puts
 * back in full. Saved through the platform (web: download; Android: save/share sheet).
 */
import { api, apiGet } from '../../api/client';
import type { DeviceSnapshot, RestoreSummary } from '../../device/worker/protocol';
import { summarizeSnapshot } from '../../device/worker/summary';
import { buildBackup, MAX_BACKUP_BYTES, parseBackup } from '../backup/backup';
import { outboxSync } from '../offline/sync';
import { downloadJson, fetchAccountExport } from '../profile/api';
import { currentWorkoutPrefs } from '../sessions/prefsSync';
import type { SaveFileResult } from '../../platform';
import { markBackupSaved } from './control';

/** Asked of the device worker (see worker/runtime.ts `deviceRoute`); the API client adds the `/api` prefix. */
const SNAPSHOT_PATH = '/device/snapshot';
const RESTORE_PATH = '/device/restore';

export async function saveDeviceBackup(now: Date = new Date()): Promise<SaveFileResult> {
  const exported = await fetchAccountExport();
  // The hidden device account's e-mail address is half of its credentials (AGENTS.md: they stay in the
  // worker), and it means nothing to the person: it is left out of the file.
  const account = { ...exported, user: { ...exported.user, email: '' } };
  const snapshot = await apiGet<DeviceSnapshot>(SNAPSHOT_PATH);
  const file = buildBackup(account, { outbox: outboxSync.getSnapshot().entries, workoutPrefs: currentWorkoutPrefs(), snapshot }, now);
  const result = await downloadJson(file, `lupu-fit-backup-${account.exportDate}.json`);
  if (result !== 'cancelled') markBackupSaved(now);
  return result;
}

export type ReadBackupError = 'too_large' | 'not_json' | 'not_a_backup' | 'unsupported_version' | 'no_snapshot';

export type ReadBackupResult =
  | { ok: true; snapshot: DeviceSnapshot; createdAt: string; summary: RestoreSummary }
  | { ok: false; reason: ReadBackupError };

/** Reads a chosen backup file (nothing is changed yet). */
export async function readDeviceBackup(file: File): Promise<ReadBackupResult> {
  if (file.size > MAX_BACKUP_BYTES) return { ok: false, reason: 'too_large' };
  const parsed = parseBackup(await file.text(), file.size);
  if (!parsed.ok) return parsed;
  const snapshot = parsed.backup.device.snapshot;
  // A backup made by the website version has only the readable export (no exact copy to put back).
  if (!snapshot || typeof snapshot.tables !== 'object' || snapshot.tables === null) return { ok: false, reason: 'no_snapshot' };
  return { ok: true, snapshot, createdAt: snapshot.createdAt || parsed.backup.createdAt, summary: summarizeSnapshot(snapshot) };
}

/** Replaces the data on this phone with the snapshot (one transaction in the worker: all or nothing). */
export function restoreDeviceBackup(snapshot: DeviceSnapshot): Promise<{ ok: true; restored: RestoreSummary }> {
  return api(RESTORE_PATH, { method: 'POST', body: snapshot, timeoutMs: 180_000 });
}
