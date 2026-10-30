/**
 * The server inside the app (runs in the device worker, after it holds the single-instance lock).
 *
 * Start-up, in the order the hosted server uses: open PGlite (IndexedDB), apply the bundled migrations,
 * seed the built-in content, warm the exercise catalog, run the hourly maintenance deletes once, then
 * create the Express app (shim) and sign in the hidden device account. Requests are then handled ONE AT
 * A TIME in arrival order: PGlite is one connection, and the pg shim's shared mode relies on whatever
 * runs while a transaction is open belonging to that request.
 *
 * Durability: PGlite writes its in-memory files to IndexedDB after every statement and waits for it, which
 * made requests slow in Chromium (reads 90–500 ms, writes 200–300 ms). The app uses the pg shim's 'manual'
 * flush mode instead: after every write request (POST, PUT, PATCH, DELETE) the worker flushes once, as one
 * consistent snapshot, and waits for it before the page gets the response, so every change the app
 * confirms is stored. What a read request writes on the side (the session's last-seen time) and the
 * idempotency record a handler writes after answering are stored by the next write request's flush.
 * Before that flush it checkpoints when the write-ahead log has grown (shims/pg.ts `checkpointDeviceDatabase`),
 * so old log files do not pile up in memory and IndexedDB.
 *
 * When storing fails (the phone's storage is full, IndexedDB refuses), the change is only in memory: the
 * request is answered 503 `storage_full` / `storage_failed` (not a network error, so the page never says
 * "saved, will sync"), the page is told (`failed` with `unsaved: true`, the start-up screen asks to free up
 * space and try again), every later write request is refused the same way before it runs, and reads keep
 * working. `retrySave()` (the page's "Try again", or the app coming back) stores again and lifts that.
 *
 * Device routes (protocol.ts): the full backup snapshot and its restore are answered here (worker/snapshot.ts),
 * in the same queue. `erase()` closes the database and deletes its storage after the queued requests.
 *
 * `./install-globals` must stay the first import: the server modules read `process.env` when they load.
 */
import '../install-globals';
import { createApp } from '../../../../server/src/app';
import { config } from '../../../../server/src/config';
import { migrationStatus } from '../../../../server/src/db/migrate';
import { db } from '../../../../server/src/db/pool';
import { prepareDeviceDatabase } from '../database';
import { DEVICE_MIGRATIONS } from '../migrations';
import { DEVICE_ENV } from '../env';
import { createDispatcher, type Application, type DispatchResponse } from '../shims/express';
import { randomBytes, randomUUID } from '../shims/crypto';
import { checkpointDeviceDatabase, closeDeviceDatabase, configureDeviceDatabase, flushDeviceDatabase } from '../shims/pg';
import { createAccountStore } from './account-store';
import { DEVICE_RESTORE_PATH, DEVICE_SNAPSHOT_PATH, type BootFailure, type BootState } from './protocol';
import { DeviceSession, DeviceSessionError, type AccountProfile, type PageRequest } from './session';
import { createSnapshot, restoreSnapshot, SnapshotError } from './snapshot';
import { deleteDeviceStorage, idbDataDir } from './storage';

/** What `server/src/index.ts` deletes every hour; the app runs it once per start. */
export async function deviceMaintenance(): Promise<void> {
  try {
    await db.exec('DELETE FROM auth_sessions WHERE expires_at < now()');
    await db.exec("DELETE FROM idempotency_keys WHERE created_at < now() - interval '24 hours'");
    await db.exec("DELETE FROM password_reset_tokens WHERE expires_at < now() - interval '1 day'");
    await db.exec("DELETE FROM push_deliveries WHERE created_at < now() - interval '30 days'");
  } catch (err) {
    console.error('[maintenance] failed', (err as Error).message);
  }
}

const READ_ONLY = new Set(['GET', 'HEAD', 'OPTIONS']);

export interface DeviceRuntime {
  handle(request: PageRequest): Promise<DispatchResponse>;
  /**
   * After storing failed (see the module comment): stores everything again. Resolves when it worked (writes
   * are accepted again); rejects, and reports the failure again, when it did not.
   */
  retrySave(): Promise<void>;
  /**
   * "Erase all data on this phone": after the requests already queued, closes the database and deletes
   * its storage. Every later request fails (the page reloads and the next start is a first launch).
   */
  erase(): Promise<void>;
}

function jsonResponse(status: number, body: unknown): DispatchResponse {
  return { status, headers: [['content-type', 'application/json; charset=utf-8'], ['cache-control', 'no-store']], body: JSON.stringify(body) };
}

const errorResponse = (status: number, code: string, message: string) => jsonResponse(status, { error: { code, message } });

/** PostgreSQL refused a value (constraint, type, foreign key): the file's data, not the app, is at fault. */
const isDataError = (err: unknown) => typeof (err as { code?: unknown })?.code === 'string' && /^(22|23)/.test((err as { code: string }).code);

/** The device routes (protocol.ts): answered here, with the device account's id, not by the server code. */
async function deviceRoute(session: DeviceSession, request: PageRequest): Promise<DispatchResponse | null> {
  const path = request.url.split('?')[0];
  const method = request.method.toUpperCase();
  if (path !== DEVICE_SNAPSHOT_PATH && path !== DEVICE_RESTORE_PATH) return null;
  await session.ensure();
  const userId = session.userId;
  if (!userId) return errorResponse(401, 'unauthorized', 'No device account');
  if (path === DEVICE_SNAPSHOT_PATH && method === 'GET') return jsonResponse(200, await db.tx((tx) => createSnapshot(tx, userId)));
  if (path === DEVICE_RESTORE_PATH && method === 'POST') {
    let body: unknown;
    try {
      body = JSON.parse(request.body ?? '');
    } catch {
      return errorResponse(400, 'not_a_snapshot', 'The body is not JSON');
    }
    try {
      const restored = await db.tx((tx) => restoreSnapshot(tx, userId, body));
      return jsonResponse(200, { ok: true, restored });
    } catch (err) {
      if (err instanceof SnapshotError) return errorResponse(400, err.code, err.message);
      if (isDataError(err)) return errorResponse(400, 'snapshot_invalid', (err as Error).message.slice(0, 200));
      throw err;
    }
  }
  return errorResponse(405, 'method_not_allowed', 'Method not allowed');
}

class BootError extends Error {
  constructor(
    readonly reason: BootFailure,
    cause: unknown,
  ) {
    super(cause instanceof Error ? cause.message : String(cause));
    this.name = 'BootError';
  }
}

const errorDetail = (err: unknown) => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).slice(0, 400);

export function classifyBootError(err: unknown): { reason: BootFailure; detail: string } {
  const detail = errorDetail(err);
  if (err instanceof BootError) return { reason: err.reason, detail };
  if (/quota/i.test(detail)) return { reason: 'storage_full', detail };
  if (/indexeddb|idb|InvalidStateError|UnknownError|SecurityError/i.test(detail)) return { reason: 'storage', detail };
  if (/WebAssembly|wasm/i.test(detail)) return { reason: 'unsupported', detail };
  return { reason: 'unknown', detail };
}

/** Boots the device server; reports each step. Rejects with a `BootError` (see `classifyBootError`). */
export async function bootDeviceRuntime(report: (state: BootState) => void, profile: () => AccountProfile): Promise<DeviceRuntime> {
  if (!config.deviceMode) throw new BootError('unknown', new Error('DEVICE_MODE is not set in the device build'));
  configureDeviceDatabase({ flush: 'manual' });
  report({ state: 'booting', step: 'database', firstLaunch: false });
  let status: Awaited<ReturnType<typeof migrationStatus>>;
  try {
    status = await migrationStatus(DEVICE_MIGRATIONS);
  } catch (err) {
    throw new BootError(classifyBootError(err).reason === 'storage_full' ? 'storage_full' : 'storage', err);
  }
  const firstLaunch = status.every((m) => !m.applied);
  if (status.some((m) => !m.applied)) report({ state: 'booting', step: 'migrating', firstLaunch });
  try {
    await prepareDeviceDatabase(
      (msg) => {
        if (msg.startsWith('applying')) report({ state: 'booting', step: 'migrating', firstLaunch });
      },
      () => report({ state: 'booting', step: 'content', firstLaunch }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    throw new BootError(/^Migration /.test(message) ? 'migration' : classifyBootError(err).reason, err);
  }
  await deviceMaintenance();

  const app = createApp({ serveClient: false }) as unknown as Application;
  const send = createDispatcher(app);
  const store = await createAccountStore(db);
  const session = new DeviceSession({ send, store, profile, randomUUID, randomBytes: (n) => new Uint8Array(randomBytes(n)) });
  report({ state: 'booting', step: 'account', firstLaunch });
  try {
    await session.ensure();
  } catch (err) {
    throw new BootError('account', err instanceof DeviceSessionError ? new Error(`${err.message} ${err.code ?? ''}`.trim()) : err);
  }
  await checkpointDeviceDatabase(0).catch((err: unknown) => console.warn('[device] checkpoint failed', errorDetail(err)));
  await flushDeviceDatabase();

  // One request at a time. After each one the worker yields a macrotask, so that writes a handler started
  // after answering (the idempotency record) reach the database; after a write request it then stores
  // everything before answering.
  let tail: Promise<unknown> = Promise.resolve();
  const yieldTask = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
  /** Why the last store failed, while changes are only in memory (null: everything is stored). */
  let unsaved: { reason: 'storage_full' | 'storage'; detail: string } | null = null;
  const storeAll = async () => {
    // A failed checkpoint only means the log stays longer: never a reason to fail the request.
    await checkpointDeviceDatabase().catch((err: unknown) => console.warn('[device] checkpoint failed', errorDetail(err)));
    await flushDeviceDatabase();
  };
  const markUnsaved = (err: unknown) => {
    const { reason, detail } = classifyBootError(err);
    unsaved = { reason: reason === 'storage_full' ? 'storage_full' : 'storage', detail };
    console.error('[device] storing the data failed', detail);
    report({ state: 'failed', reason: unsaved.reason, detail, unsaved: true });
  };
  const unsavedResponse = () =>
    unsaved?.reason === 'storage_full'
      ? errorResponse(503, 'storage_full', "The phone's storage is full: the change could not be stored")
      : errorResponse(503, 'storage_failed', 'The change could not be stored on this phone');
  /** Stores after a write request; false when that failed (the runtime is then `unsaved`). */
  const settle = async (method: string): Promise<boolean> => {
    await yieldTask();
    if (READ_ONLY.has(method.toUpperCase())) return true;
    try {
      await storeAll();
      return true;
    } catch (err) {
      markUnsaved(err);
      return false;
    }
  };
  let erased = false;
  return {
    handle(request) {
      const run = tail.then(async () => {
        if (erased) throw new Error('The data on this phone was erased');
        // Nothing more is changed in memory while earlier changes could not be stored.
        if (unsaved && !READ_ONLY.has(request.method.toUpperCase())) return unsavedResponse();
        let outcome: { ok: true; response: DispatchResponse } | { ok: false; error: unknown };
        try {
          outcome = { ok: true, response: (await deviceRoute(session, request)) ?? (await session.handle(request)) };
        } catch (error) {
          outcome = { ok: false, error };
        }
        if (!(await settle(request.method))) return unsavedResponse();
        if (!outcome.ok) throw outcome.error;
        return outcome.response;
      });
      tail = run.catch(() => undefined);
      return run;
    },
    retrySave() {
      const run = tail.then(async () => {
        if (erased) throw new Error('The data on this phone was erased');
        try {
          await storeAll();
          unsaved = null;
        } catch (err) {
          markUnsaved(err);
          throw err;
        }
      });
      tail = run.catch(() => undefined);
      return run;
    },
    erase() {
      const run = tail.then(async () => {
        erased = true;
        await closeDeviceDatabase();
        const dataDir = idbDataDir(DEVICE_ENV.DATABASE_URL ?? '');
        if (dataDir) await deleteDeviceStorage(dataDir);
      });
      tail = run.catch(() => undefined);
      return run;
    },
  };
}
