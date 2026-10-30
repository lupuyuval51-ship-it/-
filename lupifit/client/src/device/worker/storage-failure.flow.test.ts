/**
 * When storing a change fails while the app runs (phone storage full, IndexedDB error), the device runtime
 * must not pretend it worked, and must not look like a network error (the page would offer "saved on this
 * device, will sync"). The flush is replaced by one that can be made to fail, as IndexedDB would with a
 * QuotaExceededError.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { db } from '../../../../server/src/db/pool';
import { DeviceBuffer } from '../buffer';
import type { BootState } from './protocol';
import { bootDeviceRuntime, type DeviceRuntime } from './runtime';
import type { PageRequest } from './session';

const flush = vi.hoisted(() => ({ failWith: null as Error | null, calls: 0 }));

vi.mock('../shims/pg', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../shims/pg')>();
  return {
    ...actual,
    flushDeviceDatabase: async (dataDir?: string) => {
      flush.calls++;
      if (flush.failWith) throw flush.failWith;
      return actual.flushDeviceDatabase(dataDir);
    },
  };
});

const PROFILE = { locale: 'en' as const, timezone: 'UTC', displayName: 'Me' };
const states: BootState[] = [];
let runtime: DeviceRuntime;
const nodeBuffer = globalThis.Buffer;

const page = (method: string, url: string, body?: unknown, headers: Record<string, string> = {}): PageRequest => ({
  method,
  url,
  headers: { accept: 'application/json', ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...headers },
  body: body === undefined ? null : JSON.stringify(body),
});
const json = (res: { body: string | Uint8Array | null }) => JSON.parse(typeof res.body === 'string' ? res.body : '{}');
const quickAdd = (name: string, key: string) =>
  page('POST', '/api/nutrition/logs/quick', { date: '2026-10-30', mealType: 'snack', name, kcal: 100 }, { 'idempotency-key': key });
const entries = () => db.one<{ n: number }>("SELECT count(*)::int AS n FROM food_log_entries WHERE logged_on = '2026-10-30'").then((r) => r.n);

beforeAll(async () => {
  globalThis.Buffer = DeviceBuffer as unknown as typeof Buffer;
  runtime = await bootDeviceRuntime((s) => states.push(s), () => PROFILE);
});

afterAll(async () => {
  globalThis.Buffer = nodeBuffer;
  await db.close();
});

describe('storing fails while the app runs', () => {
  it('stores after a write request when storage works', async () => {
    const before = flush.calls;
    const res = await runtime.handle(quickAdd('first', 'storage-test-first-0001'));
    expect(res.status).toBe(201);
    expect(flush.calls).toBe(before + 1);
  });

  it('answers 503 storage_full (not a network failure) and tells the page that changes are unsaved', async () => {
    flush.failWith = new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    const res = await runtime.handle(quickAdd('second', 'storage-test-second-001'));
    expect(res.status).toBe(503);
    expect(json(res).error.code).toBe('storage_full');
    expect(states.at(-1)).toMatchObject({ state: 'failed', reason: 'storage_full', unsaved: true });
  });

  it('refuses later writes before they run, and keeps answering reads', async () => {
    const count = await entries();
    const write = await runtime.handle(quickAdd('third', 'storage-test-third-0001'));
    expect(write.status).toBe(503);
    expect(json(write).error.code).toBe('storage_full');
    expect(await entries()).toBe(count); // nothing more was changed in memory
    const read = await runtime.handle(page('GET', '/api/nutrition/day?date=2026-10-30'));
    expect(read.status).toBe(200);
  });

  it('retrySave reports the failure again while storage still fails', async () => {
    const reported = states.length;
    await expect(runtime.retrySave()).rejects.toThrow(/quota/i);
    expect(states.length).toBe(reported + 1);
    expect(states.at(-1)).toMatchObject({ state: 'failed', reason: 'storage_full', unsaved: true });
  });

  it('accepts writes again once storing works', async () => {
    flush.failWith = null;
    await runtime.retrySave();
    const res = await runtime.handle(quickAdd('fourth', 'storage-test-fourth-001'));
    expect(res.status).toBe(201);
  });

  it('reports other storage errors as storage_failed', async () => {
    flush.failWith = new DOMException('Internal error opening backing store', 'UnknownError');
    const res = await runtime.handle(quickAdd('fifth', 'storage-test-fifth-0001'));
    expect(res.status).toBe(503);
    expect(json(res).error.code).toBe('storage_failed');
    expect(states.at(-1)).toMatchObject({ state: 'failed', reason: 'storage', unsaved: true });
    flush.failWith = null;
    await runtime.retrySave();
  });
});
