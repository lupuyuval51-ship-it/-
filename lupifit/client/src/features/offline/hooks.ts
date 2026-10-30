import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';
import type { OutboxEntry, OutboxOp } from './outbox';
import { pendingFoods, pendingWeights } from './outbox';
import { outboxSync, type OutboxSnapshot } from './sync';
import { apiOffline, isDeviceMode } from '../../platform';

/** Binds the outbox to the signed-in user for as long as the component is mounted (app shell). */
export function useOutboxSync(): void {
  const qc = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    return outboxSync.retain(qc, userId);
  }, [qc, userId]);
}

export function useOutbox(): OutboxSnapshot {
  return useSyncExternalStore(outboxSync.subscribe, outboxSync.getSnapshot, outboxSync.getSnapshot);
}

/** Food-log entries waiting to be synced, optionally only those of one date. */
export function usePendingFoods(date?: string) {
  const { entries } = useOutbox();
  return useMemo(() => pendingFoods(entries).filter((p) => date == null || p.date === date), [entries, date]);
}

export function usePendingWeights() {
  const { entries } = useOutbox();
  return useMemo(() => pendingWeights(entries), [entries]);
}

export type SendResult<T> = { queued: false; res: T } | { queued: true; entry: OutboxEntry };

/**
 * Sends a create request; if there is no usable connection the operation is stored in the outbox with
 * the same Idempotency-Key and `{ queued: true }` is returned, so the caller can finish its flow
 * ("saved on this device") instead of failing. Server rejections still throw.
 */
export async function sendOrQueue<T>(op: OutboxOp, key: string, send: () => Promise<T>): Promise<SendResult<T>> {
  const queue = (): SendResult<T> => ({ queued: true, entry: outboxSync.enqueue(op, key) });
  if (outboxSync.ready && apiOffline()) return queue();
  try {
    return { queued: false, res: await send() };
  } catch (err) {
    // Device mode: the API is inside the app, so a "network" error means the phone itself failed, and
    // "saved on this device, will sync" would be untrue: the error is shown instead.
    if (!isDeviceMode && outboxSync.ready && err instanceof ApiError && err.isNetwork) return queue();
    throw err;
  }
}
