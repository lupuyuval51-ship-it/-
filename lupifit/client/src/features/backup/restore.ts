import { ApiError, apiPost } from '../../api/client';
import { newIdempotencyKey } from '../../lib/ids';
import { outboxSync } from '../offline/sync';
import { applyServerPrefs } from '../sessions/prefsSync';
import { markPrefsDirty } from '../../lib/prefsDirty';
import type { RestorePlan } from './backup';

export interface RestoreResult {
  weights: number;
  foods: number;
  outbox: number;
  failed: number;
}

const CONCURRENCY = 3;

/**
 * Applies a plan through the normal create endpoints (validated like any other entry). Each item carries a
 * stable Idempotency-Key, so repeating an interrupted restore never duplicates anything it already created.
 * `onProgress(done, total)` is called after every item.
 */
export async function runRestore(plan: RestorePlan, onProgress: (done: number, total: number) => void = () => undefined): Promise<RestoreResult> {
  const jobs: { path: string; body: unknown; key: string; kind: 'weights' | 'foods' }[] = [
    ...plan.weights.map((w) => ({ path: '/progress/body-weight', body: w.input, key: w.key, kind: 'weights' as const })),
    ...plan.foods.map((f) => ({ path: '/nutrition/logs/quick', body: f.input, key: f.key, kind: 'foods' as const })),
  ];
  const result: RestoreResult = { weights: 0, foods: 0, outbox: 0, failed: 0 };
  let done = 0;
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const job = jobs[next++]!;
      try {
        await apiPost(job.path, job.body, job.key, 20_000);
        result[job.kind]++;
      } catch (err) {
        // A replay of an entry created by an earlier, interrupted run counts as done; anything else is reported.
        if (err instanceof ApiError && err.code === 'request_in_progress') result[job.kind]++;
        else result.failed++;
      }
      onProgress(++done, jobs.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker));

  // The device's own unsynced changes go back into the outbox with their original keys.
  for (const e of plan.outbox) {
    try {
      outboxSync.enqueue(e.op, e.id || newIdempotencyKey());
      result.outbox++;
    } catch {
      result.failed++;
    }
  }
  // Only when the preview listed them (the file's settings differ from this device's).
  if (plan.workoutPrefs) {
    applyServerPrefs(plan.workoutPrefs);
    markPrefsDirty(); // share the restored settings with the account
  }
  return result;
}
