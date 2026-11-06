/**
 * Getting the backup file OUT of the app.
 *
 * Why this exists: inside the Android System WebView an `<a download>` link to a blob URL does nothing (WebView needs a DownloadListener
 * that Capacitor does not install) and the Web Share API for files is not offered. The exported file is the only way to recover data
 * in Device Mode, so on the phone the file is written with the Capacitor Filesystem plugin and handed to the system share sheet.
 *
 *  - Android app (`Capacitor.isNativePlatform()`): write `cache/backups/lupu-fit-backup-YYYY-MM-DD.json`, share its `file://` uri
 *    (the Share plugin turns it into a one-file `content://` grant through our FileProvider, see android res/xml/file_paths.xml,
 *    which only exposes `cache/backups/`). A second, explicit action saves a copy in the public Documents folder.
 *  - Browser: the existing behaviour (Web Share with a file when the browser offers it, otherwise an `<a download>` link).
 *
 * Nothing here talks to a network. File names are built here and sanitised: a name from anywhere else can never choose a directory.
 */
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/** Folder inside the app's private cache that holds the copies handed to the share sheet (and the only one the FileProvider exposes). */
export const BACKUP_CACHE_DIR = 'backups';
/** Folder inside the public Documents directory used by "Save to Documents". */
export const DOCUMENTS_DIR = 'LUPU-FIT';
const DEFAULT_NAME = 'lupu-fit-backup.json';
/** Only files we created are ever cleaned up. */
const OURS = /^lupu-fit-backup[A-Za-z0-9._-]*\.json$/;
const MAX_NAME = 64;

export function isNativeApp(): boolean {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
}

const p2 = (n: number): string => String(n).padStart(2, '0');
/** `lupu-fit-backup-YYYY-MM-DD.json` in the person's local date; `withTime` adds `-HHMM` so a second copy on the same day never collides. */
export function backupFilename(now: Date = new Date(), withTime = false): string {
  const d = `${now.getFullYear()}-${p2(now.getMonth() + 1)}-${p2(now.getDate())}`;
  return `lupu-fit-backup-${d}${withTime ? `-${p2(now.getHours())}${p2(now.getMinutes())}` : ''}.json`;
}

/**
 * A plain file name and nothing else: no directories (either slash style), no `..`, no control or exotic characters, always `.json`,
 * never empty. Idempotent.
 */
export function safeFilename(name: string): string {
  const last = (String(name ?? '').split(/[\\/]/).pop() ?? '').replace(/\.json$/i, '');
  let s = last.replace(/[\u0000-\u001f\u007f]/g, '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/\.{2,}/g, '.').replace(/-{2,}/g, '-').replace(/^[.-]+/, '');
  s = s.slice(0, MAX_NAME - '.json'.length).replace(/[.-]+$/, '');
  return s ? `${s}.json` : DEFAULT_NAME;
}

export type SaveStage = 'write' | 'share' | 'documents';
export type SaveResult =
  | { status: 'shared'; filename: string }
  | { status: 'saved'; filename: string; /** Human readable place, e.g. `Documents/LUPU-FIT/x.json`; absent for a browser download. */ location?: string }
  | { status: 'cancelled' }
  | { status: 'error'; stage: SaveStage; detail?: string };

const message = (e: unknown): string => {
  const m = e instanceof Error ? e.message : typeof e === 'object' && e !== null && 'message' in e ? String((e as { message: unknown }).message) : String(e ?? '');
  return m.replace(/\s+/g, ' ').trim().slice(0, 160);
};
/** The user closed the share sheet / the browser's share dialog. Not an error. */
function isCancel(e: unknown): boolean {
  const name = (e as { name?: string } | null)?.name;
  return name === 'AbortError' || /cancel/i.test(message(e)); // Android Share plugin rejects with "Share canceled"
}

/** `<a download>` for a browser. Returns the File so callers (and tests) can inspect it. */
export function downloadTextFile(filename: string, text: string, type = 'application/json'): File {
  const file = new File([text], filename, { type });
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return file;
}

/** Removes earlier backup copies from the private cache (the new one is kept: the receiving app may still be reading it). Never throws. */
async function pruneCache(keep: string): Promise<void> {
  try {
    const { files } = await Filesystem.readdir({ path: BACKUP_CACHE_DIR, directory: Directory.Cache });
    for (const f of files) {
      if (f.type === 'file' && f.name !== keep && OURS.test(f.name)) {
        try { await Filesystem.deleteFile({ path: `${BACKUP_CACHE_DIR}/${f.name}`, directory: Directory.Cache }); } catch { /* already gone */ }
      }
    }
  } catch { /* nothing to clean */ }
}

export interface ShareOptions { /** Subject / file title. */ title?: string; /** Title of the system chooser (Android). */ dialogTitle?: string }

/**
 * Save the backup text as a file and let the person send it somewhere (Drive, Files, WhatsApp, ...).
 *  - native: cache file + system share sheet; closing the sheet is `cancelled`, never an error.
 *  - browser: Web Share with the file when available, otherwise a download.
 */
export async function saveAndShareBackup(filename: string, json: string, opts: ShareOptions = {}): Promise<SaveResult> {
  const name = safeFilename(filename);
  if (isNativeApp()) {
    let uri: string;
    try {
      const w = await Filesystem.writeFile({ path: `${BACKUP_CACHE_DIR}/${name}`, data: json, directory: Directory.Cache, encoding: Encoding.UTF8, recursive: true });
      uri = w.uri;
      if (!uri) throw new Error('no file address');
    } catch (e) { return { status: 'error', stage: 'write', detail: message(e) }; }
    void pruneCache(name);
    try {
      await Share.share({ title: opts.title ?? name, dialogTitle: opts.dialogTitle ?? opts.title ?? name, files: [uri] });
      return { status: 'shared', filename: name };
    } catch (e) {
      return isCancel(e) ? { status: 'cancelled' } : { status: 'error', stage: 'share', detail: message(e) };
    }
  }
  try {
    const file = new File([json], name, { type: 'application/json' });
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: name });
      return { status: 'shared', filename: name };
    }
    downloadTextFile(name, json);
    return { status: 'saved', filename: name };
  } catch (e) {
    return isCancel(e) ? { status: 'cancelled' } : { status: 'error', stage: 'share', detail: message(e) };
  }
}

/**
 * Is a copy in the public Documents folder possible WITHOUT asking for a permission? The Filesystem plugin reports `granted` for
 * public storage on Android 11+ (scoped storage; on 13+ there is no permission at all). On Android 7-10 it would need
 * WRITE_EXTERNAL_STORAGE, which the app deliberately does not declare, so the answer is false and the button is not shown.
 */
export async function canSaveToDocuments(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try { return (await Filesystem.checkPermissions()).publicStorage === 'granted'; } catch { return false; }
}

/** Writes `Documents/LUPU-FIT/<name>` (public folder, visible in the Files app). Never prompts for a permission. */
export async function saveBackupToDocuments(filename: string, json: string): Promise<SaveResult> {
  const name = safeFilename(filename);
  if (!isNativeApp()) return { status: 'error', stage: 'documents', detail: 'not available outside the app' };
  try {
    await Filesystem.writeFile({ path: `${DOCUMENTS_DIR}/${name}`, data: json, directory: Directory.Documents, encoding: Encoding.UTF8, recursive: true });
    return { status: 'saved', filename: name, location: `Documents/${DOCUMENTS_DIR}/${name}` };
  } catch (e) { return { status: 'error', stage: 'documents', detail: message(e) }; }
}
