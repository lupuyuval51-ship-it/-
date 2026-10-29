import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/client';

const apiPost = vi.fn();
vi.mock('../../api/client', async (orig) => ({ ...(await orig<typeof import('../../api/client')>()), apiPost: (...a: unknown[]) => apiPost(...a) }));

import { clearOutbox, OUTBOX_KEY, outboxKey, OutboxSync, readOutbox } from './sync';

const weightOp = (kg = 80) => ({ type: 'weight' as const, input: { date: '2026-10-28', weightKg: kg, note: '' } });
const quickOp = () => ({ type: 'quick_add' as const, input: { date: '2026-10-29', mealType: 'lunch' as const, name: 'Soup', kcal: 200, proteinG: 5, carbsG: 20, fatG: 5, fiberG: 2, note: '' } });

let engine: OutboxSync;
let qc: QueryClient;
let release: () => void;

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
  apiPost.mockReset();
  qc = new QueryClient();
  engine = new OutboxSync();
  release = engine.retain(qc, 'user-1');
});
afterEach(() => {
  release();
  vi.useRealTimers();
});

describe('OutboxSync', () => {
  it('sends a queued entry with its own idempotency key, then forgets it', async () => {
    apiPost.mockResolvedValue({});
    engine.enqueue(weightOp(), 'key-weight-0001');
    expect(readOutbox('user-1')).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(10);
    expect(apiPost).toHaveBeenCalledWith('/progress/body-weight', weightOp().input, 'key-weight-0001', expect.any(Number));
    expect(engine.getSnapshot().entries).toHaveLength(0);
    expect(window.localStorage.getItem(OUTBOX_KEY)).toBeNull();
    expect(window.localStorage.getItem('fitai.outbox.user-1')).toBeNull();
  });

  it('sends in the order the entries were made, one at a time', async () => {
    const order: string[] = [];
    apiPost.mockImplementation(async (path: string) => void order.push(path));
    engine.enqueue(quickOp(), 'key-quick-00001');
    engine.enqueue(weightOp(), 'key-weight-0002');
    await vi.advanceTimersByTimeAsync(50);
    expect(order).toEqual(['/nutrition/logs/quick', '/progress/body-weight']);
  });

  it('keeps an entry through network failures and retries with backoff', async () => {
    apiPost.mockRejectedValueOnce(new ApiError(0, 'network_error', 'offline')).mockResolvedValue({});
    engine.enqueue(weightOp(), 'key-weight-0003');
    await vi.advanceTimersByTimeAsync(10);
    expect(engine.getSnapshot()).toMatchObject({ pending: 1, offline: true });
    expect(readOutbox('user-1')[0]).toMatchObject({ attempts: 1, status: 'pending' });
    await vi.advanceTimersByTimeAsync(2_500);
    expect(apiPost).toHaveBeenCalledTimes(2);
    expect(engine.getSnapshot().entries).toHaveLength(0);
  });

  it('keeps entries the server rejects, as failed, until they are discarded or retried', async () => {
    apiPost.mockRejectedValueOnce(new ApiError(422, 'future_date', 'no')).mockResolvedValue({});
    engine.enqueue(weightOp(), 'key-weight-0004');
    await vi.advanceTimersByTimeAsync(10);
    expect(engine.getSnapshot()).toMatchObject({ pending: 0, failed: 1 });
    expect(engine.getSnapshot().entries[0]).toMatchObject({ status: 'failed', errorCode: 'future_date' });
    engine.retry('key-weight-0004');
    await vi.advanceTimersByTimeAsync(10);
    expect(engine.getSnapshot().entries).toHaveLength(0);

    apiPost.mockRejectedValueOnce(new ApiError(400, 'validation_error', 'bad'));
    engine.enqueue(weightOp(), 'key-weight-0005');
    await vi.advanceTimersByTimeAsync(10);
    engine.discard('key-weight-0005');
    expect(engine.getSnapshot().entries).toHaveLength(0);
  });

  it('does not send while the browser is offline, and flushes when it comes back', async () => {
    apiPost.mockResolvedValue({});
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    engine.enqueue(weightOp(), 'key-weight-0006');
    await vi.advanceTimersByTimeAsync(20_000);
    expect(apiPost).not.toHaveBeenCalled();
    expect(engine.getSnapshot().offline).toBe(true);
    online.mockReturnValue(true);
    window.dispatchEvent(new Event('online'));
    await vi.advanceTimersByTimeAsync(10);
    expect(apiPost).toHaveBeenCalledTimes(1);
    online.mockRestore();
  });

  it('keeps one user\'s unsynced entries away from another account', () => {
    engine.enqueue(weightOp(), 'key-weight-0007');
    expect(readOutbox('user-2')).toEqual([]);
    const other = new OutboxSync();
    const stop = other.retain(qc, 'user-2');
    expect(other.getSnapshot().entries).toEqual([]);
    stop();
  });

  it('stops sending after an authentication failure instead of hammering the server', async () => {
    apiPost.mockRejectedValue(new ApiError(401, 'unauthorized', 'no'));
    engine.enqueue(weightOp(), 'key-weight-0008');
    await vi.advanceTimersByTimeAsync(10);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(apiPost).toHaveBeenCalledTimes(1);
    expect(engine.getSnapshot().pending).toBe(1);
  });

  it('sends again when the same user signs back in after an authentication failure', async () => {
    apiPost.mockRejectedValueOnce(new ApiError(401, 'unauthorized', 'no')).mockResolvedValue({});
    engine.enqueue(weightOp(), 'key-weight-0009');
    await vi.advanceTimersByTimeAsync(10);
    expect(apiPost).toHaveBeenCalledTimes(1);
    // The 401 signs the user out (the shell releases the engine), then the same account signs in again.
    release();
    release = engine.retain(qc, 'user-1');
    await vi.advanceTimersByTimeAsync(10);
    expect(apiPost).toHaveBeenCalledTimes(2);
    expect(engine.getSnapshot().entries).toHaveLength(0);
  });

  it('sends strictly oldest first: a later entry waits while an earlier one backs off', async () => {
    const sent: number[] = [];
    apiPost.mockImplementation(async (_path: string, body: { weightKg: number }) => {
      sent.push(body.weightKg);
      if (sent.length === 1) throw new ApiError(503, 'internal_error', 'busy');
      return {};
    });
    engine.enqueue(weightOp(80), 'key-weight-0010');
    engine.enqueue(weightOp(81), 'key-weight-0011');
    await vi.advanceTimersByTimeAsync(10);
    expect(sent).toEqual([80]);
    await vi.advanceTimersByTimeAsync(2_500);
    // Two weigh-ins for the same date: the server keeps the last one it receives, so order matters.
    expect(sent).toEqual([80, 80, 81]);
    expect(engine.getSnapshot().entries).toHaveLength(0);
  });

  it('does not let a rejected entry block the ones after it', async () => {
    apiPost.mockRejectedValueOnce(new ApiError(422, 'future_date', 'no')).mockResolvedValue({});
    engine.enqueue(weightOp(80), 'key-weight-0012');
    engine.enqueue(weightOp(81), 'key-weight-0013');
    await vi.advanceTimersByTimeAsync(10);
    expect(apiPost).toHaveBeenCalledTimes(2);
    expect(engine.getSnapshot()).toMatchObject({ pending: 0, failed: 1 });
  });
});

describe('OutboxSync on a shared device', () => {
  const offline = () => apiPost.mockRejectedValue(new ApiError(0, 'network_error', 'offline'));

  it('keeps each user\'s unsynced entries under their own key; another account never overwrites them', async () => {
    offline();
    engine.enqueue(weightOp(80), 'key-weight-a001');
    await vi.advanceTimersByTimeAsync(10);
    release(); // user-1 signs out with an unsynced weigh-in
    expect(engine.ready).toBe(false);
    expect(engine.getSnapshot().entries).toEqual([]);

    release = engine.retain(qc, 'user-2');
    expect(engine.getSnapshot().entries).toEqual([]);
    engine.enqueue(quickOp(), 'key-quick-b001');
    await vi.advanceTimersByTimeAsync(10);
    expect(readOutbox('user-2').map((e) => e.id)).toEqual(['key-quick-b001']);
    expect(readOutbox('user-1').map((e) => e.id)).toEqual(['key-weight-a001']);
    expect(window.localStorage.getItem('fitai.outbox.user-1')).not.toBeNull();
    expect(window.localStorage.getItem('fitai.outbox.user-2')).not.toBeNull();

    // user-1 signs in again: their entry is back and syncs; user-2's stays untouched.
    release();
    apiPost.mockReset().mockResolvedValue({});
    release = engine.retain(qc, 'user-1');
    await vi.advanceTimersByTimeAsync(2_500); // past the backoff of the earlier failed attempt
    expect(apiPost).toHaveBeenCalledWith('/progress/body-weight', weightOp(80).input, 'key-weight-a001', expect.any(Number));
    expect(apiPost).not.toHaveBeenCalledWith('/nutrition/logs/quick', expect.anything(), 'key-quick-b001', expect.any(Number));
    expect(readOutbox('user-1')).toEqual([]);
    expect(window.localStorage.getItem('fitai.outbox.user-1')).toBeNull();
    expect(readOutbox('user-2').map((e) => e.id)).toEqual(['key-quick-b001']);
  });

  it('moves the old single-key outbox to its owner\'s key, and leaves another user\'s untouched', () => {
    const legacyEntry = { id: 'key-legacy-001', op: weightOp(77), createdAt: 1, notBefore: 1, attempts: 0, status: 'pending' };
    window.localStorage.setItem('fitai.outbox', JSON.stringify({ v: 1, userId: 'user-9', entries: [legacyEntry] }));
    offline();

    const stranger = new OutboxSync();
    const stopStranger = stranger.retain(qc, 'user-8');
    expect(stranger.getSnapshot().entries).toEqual([]);
    stranger.enqueue(weightOp(), 'key-weight-s001');
    expect(JSON.parse(window.localStorage.getItem('fitai.outbox')!).userId).toBe('user-9');
    stopStranger();

    const owner = new OutboxSync();
    const stopOwner = owner.retain(qc, 'user-9');
    expect(owner.getSnapshot().entries.map((e) => e.id)).toEqual(['key-legacy-001']);
    expect(window.localStorage.getItem('fitai.outbox')).toBeNull();
    expect(readOutbox('user-9').map((e) => e.id)).toEqual(['key-legacy-001']);
    stopOwner();
  });

  it('two tabs of the same user do not overwrite each other\'s entries', async () => {
    offline();
    const tab2 = new OutboxSync();
    const stop2 = tab2.retain(qc, 'user-1');
    engine.enqueue(weightOp(80), 'key-weight-t001');
    tab2.enqueue(quickOp(), 'key-quick-t002');
    expect(readOutbox('user-1').map((e) => e.id).sort()).toEqual(['key-quick-t002', 'key-weight-t001']);

    // The other tab learns about changes through the storage event.
    window.dispatchEvent(new StorageEvent('storage', { key: 'fitai.outbox.user-1' }));
    expect(engine.getSnapshot().entries.map((e) => e.id).sort()).toEqual(['key-quick-t002', 'key-weight-t001']);

    // A discard in one tab is not undone by the other tab's next write.
    engine.discard('key-quick-t002');
    tab2.enqueue(weightOp(81), 'key-weight-t003');
    expect(readOutbox('user-1').map((e) => e.id).sort()).toEqual(['key-weight-t001', 'key-weight-t003']);
    stop2();
  });

  it('keeps entries in this tab when the device refuses to store them', () => {
    offline();
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    engine.enqueue(weightOp(80), 'key-weight-q001');
    engine.enqueue(weightOp(81), 'key-weight-q002');
    expect(engine.getSnapshot().entries.map((e) => e.id)).toEqual(['key-weight-q001', 'key-weight-q002']);
    setItem.mockRestore();
    engine.discard('key-weight-q001');
    expect(readOutbox('user-1').map((e) => e.id)).toEqual(['key-weight-q002']);
  });

  it('clearOutbox removes only that user\'s stored entries (account deleted)', () => {
    offline();
    engine.enqueue(weightOp(), 'key-weight-d001');
    window.localStorage.setItem(outboxKey('user-2'), JSON.stringify({ v: 1, userId: 'user-2', entries: [] }));
    clearOutbox('user-1');
    expect(window.localStorage.getItem(outboxKey('user-1'))).toBeNull();
    expect(window.localStorage.getItem(outboxKey('user-2'))).not.toBeNull();
  });
});
