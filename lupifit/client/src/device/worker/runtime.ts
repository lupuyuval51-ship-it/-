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
import { createDispatcher, type Application, type DispatchResponse } from '../shims/express';
import { randomBytes, randomUUID } from '../shims/crypto';
import { configureDeviceDatabase, flushDeviceDatabase } from '../shims/pg';
import { createAccountStore } from './account-store';
import type { BootFailure, BootState } from './protocol';
import { DeviceSession, DeviceSessionError, type AccountProfile, type PageRequest } from './session';

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

export function classifyBootError(err: unknown): { reason: BootFailure; detail: string } {
  const detail = (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).slice(0, 400);
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
  await flushDeviceDatabase();

  // One request at a time. After each one the worker yields a macrotask, so that writes a handler started
  // after answering (the idempotency record) reach the database; after a write request it then stores
  // everything before answering.
  let tail: Promise<unknown> = Promise.resolve();
  const yieldTask = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
  const settle = async (method: string) => {
    await yieldTask();
    if (!READ_ONLY.has(method.toUpperCase())) await flushDeviceDatabase();
  };
  return {
    handle(request) {
      const run = tail.then(async () => {
        try {
          return await session.handle(request);
        } finally {
          await settle(request.method);
        }
      });
      tail = run.catch(() => undefined);
      return run;
    },
  };
}
