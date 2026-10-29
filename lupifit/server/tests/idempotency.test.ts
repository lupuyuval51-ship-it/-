/**
 * Idempotency-Key when the client gives up mid-request (outbox 12 s timeout, network switch):
 * the server keeps running the handler, which still commits. The key must stay reserved until
 * then, a replay meanwhile must not run the handler again, and a later replay must get the
 * response of that real completion — never a second food entry.
 */
import { once } from 'node:events';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { todayInTimeZone } from '@shared/dates';
import { createApp } from '../src/app';
import { db } from '../src/db/pool';
import { errorHandler } from '../src/middleware/errors';
import { idempotency } from '../src/middleware/idempotency';
import { onboardedUser, type TestClient } from './helpers/server';

let server: Server;
let baseUrl: string;
/** Idempotency keys of requests whose connection closed before their response was sent (seen by the server). */
const abortedKeys = new Set<string>();
const today = todayInTimeZone('UTC');

// The per-user lock the food-log reward hook takes inside the handler's transaction
// (server/src/modules/gamification/hooks.ts). Holding it parks the handler mid-transaction,
// after the entry is inserted and before it commits.
const REWARD_LOCK = "SELECT pg_advisory_xact_lock(hashtext('fitai_gamification:' || $1::text))";

beforeAll(async () => {
  server = createApp({ serveClient: false }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  watchAborts(server);
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await db.close();
});

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function watchAborts(s: Server) {
  s.on('request', (req, res) => {
    res.on('close', () => {
      const key = req.headers['idempotency-key'];
      if (!res.writableFinished && typeof key === 'string') abortedKeys.add(key);
    });
  });
}

async function until<T>(read: () => Promise<T>, ok: (v: T) => boolean, what: string, timeoutMs = 10_000): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const v = await read();
    if (ok(v)) return v;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await sleep(20);
  }
}

/** Requests currently waiting for the user's reward lock (i.e. handlers parked mid-transaction). */
const rewardLockWaiters = async (userId: string) =>
  (
    await db.one<{ n: number }>(
      `SELECT count(*)::int AS n FROM pg_locks
        WHERE locktype = 'advisory' AND NOT granted AND objsubid = 1
          AND objid::text::bigint = (hashtext('fitai_gamification:' || $1::text)::bigint & 4294967295)`,
      [userId],
    )
  ).n;

const foodEntryIds = async (userId: string) =>
  (await db.many<{ id: string }>('SELECT id FROM food_log_entries WHERE user_id = $1 ORDER BY created_at', [userId])).map((r) => r.id);

const keyRow = (userId: string, key: string) =>
  db.maybeOne<{ status_code: number | null }>('SELECT status_code FROM idempotency_keys WHERE user_id = $1 AND key = $2', [userId, key]);

const quickAdd = (c: TestClient, key: string, body: Record<string, unknown>) =>
  c.post('/api/nutrition/logs/quick', body, { headers: { 'idempotency-key': key } });

/**
 * Sends a quick add, lets the handler insert the entry and park on the reward lock, then aborts
 * the request on the client side and waits until the server has seen the connection close.
 * Returns `release`, which lets the handler continue and commit.
 */
async function abortMidRequest(c: TestClient, key: string, body: Record<string, unknown>) {
  const userId = c.userId!;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  let held!: () => void;
  const lockHeld = new Promise<void>((resolve) => (held = resolve));
  const holder = db.tx(async (tx) => {
    await tx.exec(REWARD_LOCK, [userId]);
    held();
    await gate;
  });
  await lockHeld;

  const controller = new AbortController();
  const first = fetch(`${baseUrl}/api/nutrition/logs/quick`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: c.cookie!, 'x-csrf-token': c.csrfToken!, 'idempotency-key': key },
    body: JSON.stringify(body),
    signal: controller.signal,
  });
  try {
    await until(() => rewardLockWaiters(userId), (n) => n >= 1, 'the handler to reach the reward lock');
    controller.abort();
    await expect(first).rejects.toThrow();
    await until(async () => abortedKeys.has(key), Boolean, 'the server to see the aborted connection');
    // Let the server's own 'close' listeners (and any database write they start) run.
    await sleep(200);
  } catch (err) {
    release();
    await holder;
    throw err;
  }
  return async () => {
    release();
    await holder;
  };
}

describe('Idempotency-Key with a client that aborts mid-request', () => {
  it('replays the original result after the aborted request completes (the food is logged once)', async () => {
    const c = await onboardedUser(baseUrl);
    const userId = c.userId!;
    const key = `abort-${randomUUID()}`;
    const body = { date: today, mealType: 'snack', name: 'Aborted snack', kcal: 210, proteinG: 5 };

    const release = await abortMidRequest(c, key, body);
    await release();

    // The aborted request still finishes on the server and commits its entry.
    const committed = await until(() => foodEntryIds(userId), (ids) => ids.length >= 1, 'the aborted request to commit');
    expect(committed).toHaveLength(1);
    await until(() => keyRow(userId, key), (row) => row == null || row.status_code != null, 'the aborted request to finish');

    // The outbox retries with the same key once the connection is back.
    const replay = await quickAdd(c, key, body);
    expect(replay.status).toBe(201);
    expect(replay.headers.get('idempotent-replayed')).toBe('true');
    expect(replay.body.entry.id).toBe(committed[0]);
    expect(replay.body.entry).toMatchObject({ kcal: 210, foodName: { en: 'Aborted snack' } });

    expect(await foodEntryIds(userId)).toEqual(committed);
    const again = await quickAdd(c, key, body);
    expect(again.body.entry.id).toBe(committed[0]);
    expect(await foodEntryIds(userId)).toEqual(committed);
  });

  it('answers 409 request_in_progress to a replay while the aborted request is still running, without running it again', async () => {
    const c = await onboardedUser(baseUrl);
    const userId = c.userId!;
    const key = `abort-${randomUUID()}`;
    const body = { date: today, mealType: 'lunch', name: 'In-flight lunch', kcal: 480 };

    const release = await abortMidRequest(c, key, body);
    let inFlight: Awaited<ReturnType<typeof quickAdd>>;
    try {
      const pending = quickAdd(c, key, body);
      // Either the replay answers right away, or it started a second handler that now waits for the lock too.
      await Promise.race([pending, until(() => rewardLockWaiters(userId), (n) => n >= 2, 'a second handler', 5_000).catch(() => undefined)]);
      await release();
      inFlight = await pending;
    } finally {
      await release();
    }
    expect(inFlight.status).toBe(409);
    expect(inFlight.body.error.code).toBe('request_in_progress');

    const committed = await until(() => foodEntryIds(userId), (ids) => ids.length >= 1, 'the aborted request to commit');
    await until(() => keyRow(userId, key), (row) => row == null || row.status_code != null, 'the aborted request to finish');
    const replay = await quickAdd(c, key, body);
    expect(replay.status).toBe(201);
    expect(replay.headers.get('idempotent-replayed')).toBe('true');
    expect(replay.body.entry.id).toBe(committed[0]);
    expect(await foodEntryIds(userId)).toHaveLength(1);
  });
});

describe('idempotency middleware with a gated handler and a client that aborts', () => {
  let mini: Server;
  let miniUrl: string;
  let userId: string;
  /** What the handler does once its gate opens. */
  let outcome: 'json' | 'no_content' | 'fail' = 'json';
  let runs = 0;
  let open: () => void = () => undefined;
  let gate: Promise<void> = Promise.resolve();
  const closeGate = () => {
    gate = new Promise<void>((resolve) => (open = resolve));
  };

  beforeAll(async () => {
    userId = (await onboardedUser(baseUrl)).userId!;
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.auth = { sessionId: 's', csrfToken: 't', user: { id: userId, email: 'x@test.fitai', displayName: 'X', role: 'user', locale: 'en', timezone: 'UTC' } };
      next();
    });
    app.use(idempotency);
    app.post('/thing', async (_req, res) => {
      const run = ++runs;
      await gate;
      if (outcome === 'fail') throw new Error('boom after the client left');
      if (outcome === 'no_content') return void res.status(204).end();
      res.status(201).json({ run });
    });
    app.use(errorHandler);
    mini = app.listen(0, '127.0.0.1');
    await once(mini, 'listening');
    watchAborts(mini);
    miniUrl = `http://127.0.0.1:${(mini.address() as AddressInfo).port}`;
  });
  afterAll(async () => {
    open();
    mini.closeAllConnections();
    await new Promise<void>((resolve) => mini.close(() => resolve()));
  });

  const send = (key: string, signal?: AbortSignal) =>
    fetch(`${miniUrl}/thing`, { method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': key }, body: '{}', signal });

  /** Starts a request, waits until its handler is parked on the gate, aborts it and waits for the server-side close. */
  async function startAndAbort(key: string) {
    const before = runs;
    const controller = new AbortController();
    const first = send(key, controller.signal);
    await until(async () => runs, (n) => n > before, 'the handler to start');
    controller.abort();
    await expect(first).rejects.toThrow();
    await until(async () => abortedKeys.has(key), Boolean, 'the server to see the aborted connection');
    await sleep(200);
  }

  it('stores the real completion when the handler finishes after the client left', async () => {
    outcome = 'json';
    closeGate();
    runs = 0;
    const key = `mini-${randomUUID()}`;
    await startAndAbort(key);

    // Either the replay answers right away, or it started the handler a second time.
    const pending = send(key);
    await Promise.race([pending, until(async () => runs, (n) => n >= 2, 'a second run', 5_000).catch(() => undefined)]);
    open();
    const during = await pending;
    expect(during.status).toBe(409);
    expect(((await during.json()) as { error: { code: string } }).error.code).toBe('request_in_progress');

    await until(() => keyRow(userId, key), (row) => row == null || row.status_code != null, 'the handler to finish');
    const replay = await send(key);
    expect(replay.status).toBe(201);
    expect(replay.headers.get('idempotent-replayed')).toBe('true');
    expect(await replay.json()).toEqual({ run: 1 });
    expect(runs).toBe(1);
  });

  it('stores a response without a body (204) that is sent after the client left', async () => {
    outcome = 'no_content';
    closeGate();
    runs = 0;
    const key = `mini-${randomUUID()}`;
    await startAndAbort(key);
    open();
    await until(() => keyRow(userId, key), (row) => row == null || row.status_code != null, 'the handler to finish');
    const replay = await send(key);
    expect(replay.status).toBe(204);
    expect(replay.headers.get('idempotent-replayed')).toBe('true');
    expect(runs).toBe(1);
  });

  it('releases the key when the handler fails after the client left, so the retry runs', async () => {
    outcome = 'fail';
    closeGate();
    runs = 0;
    const key = `mini-${randomUUID()}`;
    await startAndAbort(key);
    // Still running: the key stays reserved (in progress) although the client is gone.
    expect(await keyRow(userId, key)).toEqual({ status_code: null });
    open();
    await until(() => keyRow(userId, key), (row) => row == null, 'the failed request to release its key');

    outcome = 'json';
    const retry = await send(key);
    expect(retry.status).toBe(201);
    expect(retry.headers.get('idempotent-replayed')).toBeNull();
    expect(await retry.json()).toEqual({ run: 2 });
  });
});
