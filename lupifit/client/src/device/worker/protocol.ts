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
  | { state: 'failed'; reason: BootFailure; detail: string };

export interface InitMessage {
  type: 'init';
  /** Used only when the device account is created on first launch. */
  account: { locale: Locale; timezone: string; displayName: string };
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

export type PageMessage = InitMessage | RequestMessage;

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

export type WorkerMessage = StateMessage | ResponseMessage | RequestFailedMessage;

/** Web Locks name held by the worker for its whole life: one open copy of the database per device. */
export const DEVICE_LOCK = 'lupufit-device-db';
