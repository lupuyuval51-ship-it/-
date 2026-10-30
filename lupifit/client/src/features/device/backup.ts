/**
 * Device-mode backup file: the readable account export (same as the website's backup file) plus the
 * exact copy of the phone's database (`device.snapshot`), which a restore on this or another phone puts
 * back in full. Saved through the platform (web: download; Android: save/share sheet).
 *
 * Size: the file holds every row twice (export and snapshot), so it is written without indentation, and
 * the phone reads files up to `MAX_DEVICE_BACKUP_BYTES` (far more than the website's limit): years of daily
 * use stay well under it. Saving checks the size, so a file the app could not restore is never presented
 * as a good backup.
 */
import { api, apiGet } from '../../api/client';
import type { DeviceSnapshot, RestoreSummary } from '../../device/worker/protocol';
import { summarizeSnapshot } from '../../device/worker/summary';
import { buildBackup, parseBackup, type BackupFile } from '../backup/backup';
import { outboxSync } from '../offline/sync';
import { fetchAccountExport } from '../profile/api';
import { currentWorkoutPrefs } from '../sessions/prefsSync';
import { platform, type SaveFileResult } from '../../platform';
import { markBackupSaved } from './control';

/** Asked of the device worker (see worker/runtime.ts `deviceRoute`); the API client adds the `/api` prefix. */
const SNAPSHOT_PATH = '/device/snapshot';
const RESTORE_PATH = '/device/restore';

/** The largest backup file the phone reads (about 30 years of heavy daily use, see backup.test.ts). */
export const MAX_DEVICE_BACKUP_BYTES = 200 * 1024 * 1024;

/** The file's text, as the app saves it (compact JSON). */
export const serializeDeviceBackup = (file: BackupFile): string => JSON.stringify(file);

/** Size of `text` in UTF-8 (what the file takes), without encoding it. */
export function utf8Length(text: string): number {
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 0x80) bytes += 1;
    else if (c < 0x800) bytes += 2;
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < text.length) {
      bytes += 4;
      i++;
    } else bytes += 3;
  }
  return bytes;
}

export interface SavedDeviceBackup {
  result: SaveFileResult;
  bytes: number;
  /** False when the file is larger than this app can read back: the person is told, and it does not count as a backup. */
  restorable: boolean;
}

export async function saveDeviceBackup(now: Date = new Date(), maxBytes: number = MAX_DEVICE_BACKUP_BYTES): Promise<SavedDeviceBackup> {
  const exported = await fetchAccountExport();
  // The hidden device account's e-mail address is half of its credentials (AGENTS.md: they stay in the
  // worker), and it means nothing to the person: it is left out of the file.
  const account = { ...exported, user: { ...exported.user, email: '' } };
  const snapshot = await apiGet<DeviceSnapshot>(SNAPSHOT_PATH);
  const text = serializeDeviceBackup(buildBackup(account, { outbox: outboxSync.getSnapshot().entries, workoutPrefs: currentWorkoutPrefs(), snapshot }, now));
  const bytes = utf8Length(text);
  const restorable = bytes <= maxBytes;
  const result = await platform.saveFile(`lupu-fit-backup-${account.exportDate}.json`, 'application/json', text);
  if (result !== 'cancelled' && restorable) markBackupSaved(now, result === 'shared' ? 'shared' : 'saved');
  return { result, bytes, restorable };
}

export type ReadBackupError = 'too_large' | 'not_json' | 'not_a_backup' | 'unsupported_version' | 'no_snapshot';

export type ReadBackupResult =
  | { ok: true; snapshot: DeviceSnapshot; createdAt: string; summary: RestoreSummary }
  | { ok: false; reason: ReadBackupError };

/** Reads a chosen backup file (nothing is changed yet). */
export async function readDeviceBackup(file: File, maxBytes: number = MAX_DEVICE_BACKUP_BYTES): Promise<ReadBackupResult> {
  if (file.size > maxBytes) return { ok: false, reason: 'too_large' };
  const parsed = parseBackup(await file.text(), file.size, maxBytes);
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
