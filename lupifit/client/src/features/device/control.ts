/**
 * Device mode (the app with its server inside, data only on this phone): what the screens need beyond
 * the API. Bundled in every build but used only when `isDeviceMode`; the device start module
 * (./start.ts, device builds only) plugs the worker in with `setDeviceControl`.
 *
 * Local data: besides the database (in the worker), the app keeps small things in localStorage under
 * `fitai.*` (drafts, workout settings, UI choices; see AGENTS.md). "Erase all data on this phone" removes
 * both; a restore replaces the database and drops the local copies that described the old data.
 */
import { storage } from '../../lib/storage';
import { platform } from '../../platform';

export interface DeviceControl {
  /** Closes the device database and deletes its storage (see worker/runtime.ts `erase`). */
  erase(): Promise<void>;
}

let control: DeviceControl | null = null;

export function setDeviceControl(next: DeviceControl | null): void {
  control = next;
}

/** Set when an erase was asked for: the next start deletes the database before opening it, if this one could not. */
export const ERASE_FLAG = 'fitai.device.eraseOnStart';
/** One-shot note for the next page load: the backup was restored (shown as a confirmation there). */
export const RESTORED_FLAG = 'lupufit.device.restored';
const WELCOMED_KEY = 'fitai.device.welcomed';
const LAST_BACKUP_KEY = 'fitai.device.lastBackup';
/** 'shared' when the last backup went to Android's share sheet (whether the receiving app kept it is unknown). */
const LAST_BACKUP_HOW_KEY = 'fitai.device.lastBackupHow';

const APP_PREFIXES = ['fitai.', 'lupufit.'];

function localKeys(): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && APP_PREFIXES.some((p) => k.startsWith(p))) keys.push(k);
    }
    return keys;
  } catch {
    return [];
  }
}

/** Removes the app's localStorage entries (all of them, or all but `keep`) and its sessionStorage. */
export function clearLocalAppData(keep: readonly string[] = []): void {
  for (const k of localKeys()) if (!keep.includes(k)) storage.remove(k);
  try {
    window.sessionStorage.clear();
  } catch {
    /* ignore */
  }
}

/** UI choices kept when a restore replaces the data (they are about this phone, not about the data). */
const DEVICE_CHOICES = ['fitai.locale', 'fitai.theme', 'fitai.restTimer.muted', 'fitai.nutrition.trendPeriod', 'fitai.nutrition.compatibleOnly', LAST_BACKUP_KEY, LAST_BACKUP_HOW_KEY];

/**
 * "Erase all data on this phone": deletes the database (or, if the worker could not, the next start does),
 * everything the app keeps in localStorage and the last file it prepared for saving (Android), then starts
 * the app again: a first launch. Backup files saved elsewhere and Android's own backup copy are not touched.
 */
export async function eraseThisPhone(reload: () => void = () => window.location.replace('/')): Promise<void> {
  storage.set(ERASE_FLAG, true);
  let erased = false;
  try {
    if (control) {
      await control.erase();
      erased = true;
    }
  } catch {
    // The flag stays: the next start deletes the database before it opens it.
  }
  clearLocalAppData(erased ? [] : [ERASE_FLAG]);
  // The last backup file handed to Android's share sheet is still in the app's cache folder: a full copy.
  await platform.clearSavedFiles().catch(() => undefined);
  reload();
}

/** After a restore: the database already holds the backup; drop local copies of the old data and start again. */
export function reloadAfterRestore(reload: () => void = () => window.location.replace('/')): void {
  clearLocalAppData(DEVICE_CHOICES);
  try {
    window.sessionStorage.setItem(RESTORED_FLAG, '1');
  } catch {
    /* the confirmation is optional */
  }
  reload();
}

/** True once per page load after `reloadAfterRestore`. */
export function takeRestoredNote(): boolean {
  try {
    const set = window.sessionStorage.getItem(RESTORED_FLAG) === '1';
    window.sessionStorage.removeItem(RESTORED_FLAG);
    return set;
  } catch {
    return false;
  }
}

/** The first-run welcome (name) was done for this device account. */
export const isWelcomed = (userId: string) => storage.get<string>(WELCOMED_KEY) === userId;
export const markWelcomed = (userId: string) => void storage.set(WELCOMED_KEY, userId);

/** When the last backup file was saved on this phone (ISO time), or null. */
export const lastBackupAt = () => storage.get<string>(LAST_BACKUP_KEY);
/** True when the last backup file was handed to the share sheet rather than written by the app itself. */
export const lastBackupShared = () => storage.get<string>(LAST_BACKUP_HOW_KEY) === 'shared';
export const markBackupSaved = (at: Date = new Date(), how: 'saved' | 'shared' = 'saved') => {
  storage.set(LAST_BACKUP_KEY, at.toISOString());
  storage.set(LAST_BACKUP_HOW_KEY, how);
};
