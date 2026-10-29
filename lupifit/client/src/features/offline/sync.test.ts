import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/client';

const apiPost = vi.fn();
vi.mock('../../api/client', async (orig) => ({ ...(await orig<typeof import('../../api/client')>()), apiPost: (...a: unknown[]) => apiPost(...a) }));

import { OUTBOX_KEY, OutboxSync, readOutbox } from './sync';

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
});
