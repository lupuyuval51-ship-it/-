/**
 * Messages between the app page and the device worker (the server running inside the app).
 * Imported by both sides; types only, no runtime code, so the page bundle never pulls in server code.
 *
 * page → worker: `init` once (what the hidden device account is created with), then `request`s.
 * worker → page: `state` while it boots and whenever it changes, `response` for each request.
 */
import type { Locale } from '@shared/constants';

/** Why the worker could not start. The page shows a message for each. */
export type BootFailure =
  /** No WebAssembly, IndexedDB, Web Locks or module workers in this browser/WebView. */
  | 'unsupported'
  /** The phone's storage is full (IndexedDB quota). */
  | 'storage_full'
  /** IndexedDB could not be opened or written (private window, blocked site data). */
  | 'storage'
  /** A database upgrade failed; the data is untouched (each migration is one transaction). */
  | 'migration'
  /** The hidden device account could not be created or signed in. */
  | 'account'
  | 'unknown';

export type BootStep =
  /** Starting PostgreSQL (WebAssembly) and opening the stored database. */
  | 'database'
  /** Applying database migrations: the first setup, or an upgrade after an app update. */
  | 'migrating'
  /** Loading the built-in exercise, food and dish content. */
  | 'content'
  /** Signing in the hidden device account (or creating it on first launch). */
  | 'account';

export type BootState =
  | { state: 'booting'; step: BootStep; firstLaunch: boolean }
  /** The app's database is already open in another tab/window: this copy waits (and continues when that one closes). */
  | { state: 'locked' }
  /** `bootMs`: from the worker's start to ready; `steps`: time spent in each boot step (ms). */
  | { state: 'ready'; bootMs: number; steps: Partial<Record<BootStep, number>> }
  /**
   * `unsaved`: the app was running and storing a change failed (storage full, IndexedDB error): the changes
   * since the last successful store are only in memory. The page asks to free up space and try again
   * (`retry-save`), never to close the app.
   */
  | { state: 'failed'; reason: BootFailure; detail: string; unsaved?: boolean };

export interface InitMessage {
  type: 'init';
  /** Used only when the device account is created on first launch. */
  account: { locale: Locale; timezone: string; displayName: string };
  /**
   * "Erase all data on this phone" could not finish last time (see `EraseMessage`): delete the stored
   * database before opening it, then start fresh. The worker answers with `erased` (id 0).
   */
  erase?: boolean;
}

/**
 * "Erase all data on this phone": after the requests already sent, the worker closes the database and
 * deletes its storage (IndexedDB); it answers nothing else afterwards, and the page reloads.
 */
export interface EraseMessage {
  type: 'erase';
  id: number;
}

export interface RequestMessage {
  type: 'request';
  id: number;
  method: string;
  /** Path and query, e.g. `/api/nutrition/day?date=2026-10-30`. */
  url: string;
  headers: Record<string, string>;
  body: string | null;
}

/** After a `failed` state with `unsaved`: store again; the worker answers with `ready` or `failed` again. */
export interface RetrySaveMessage {
  type: 'retry-save';
}

export type PageMessage = InitMessage | RequestMessage | EraseMessage | RetrySaveMessage;

export interface StateMessage {
  type: 'state';
  boot: BootState;
}

export interface ResponseMessage {
  type: 'response';
  id: number;
  status: number;
  headers: [string, string][];
  body: string | Uint8Array | null;
}

/** The worker could not produce a response at all (the page turns it into a network error). */
export interface RequestFailedMessage {
  type: 'request-failed';
  id: number;
  message: string;
}

/** Answer to `erase` (`id` of the message), or `id` 0 for the erase asked for in `init`. */
export interface ErasedMessage {
  type: 'erased';
  id: number;
  ok: boolean;
  message?: string;
}

export type WorkerMessage = StateMessage | ResponseMessage | RequestFailedMessage | ErasedMessage;

/** Web Locks name held by the worker for its whole life: one open copy of the database per device. */
export const DEVICE_LOCK = 'lupufit-device-db';

/**
 * Device routes, answered by the worker itself (not by the server code; the hosted server has no such
 * routes): the whole device database of the device account as a snapshot, and restoring one.
 */
export const DEVICE_SNAPSHOT_PATH = '/api/device/snapshot';
export const DEVICE_RESTORE_PATH = '/api/device/restore';

export const SNAPSHOT_FORMAT = 'lupu-fit-device-data';

/**
 * Everything stored for the device account, as database rows (column names as in the database). It goes
 * into the backup file (`device.snapshot`) next to the readable account export, and a restore puts it back
 * exactly, replacing what is on the phone (see worker/snapshot.ts).
 */
export interface DeviceSnapshot {
  format: typeof SNAPSHOT_FORMAT;
  version: 1;
  /** The newest database migration of the app that made it (a newer one cannot be restored by an older app). */
  schema: string;
  createdAt: string;
  /** Name and preferences (never the e-mail address or password of the hidden account). */
  user: Record<string, unknown>;
  /** Rows per table, e.g. `workout_sessions`. */
  tables: Record<string, Record<string, unknown>[]>;
  /** Shared foods (built-in, Open Food Facts) that the diary and saved meals point to, matched again on restore. */
  sharedFoods: Record<string, unknown>[];
}

export interface RestoreSummary {
  plans: number;
  workouts: number;
  foods: number;
  weights: number;
  coachThreads: number;
}
