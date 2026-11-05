/**
 * Runtime helpers: background work (EdgeRuntime.waitUntil when available) and JSON casting for
 * jsonb columns.
 */
import type { Json } from './database.types.ts';

export type WaitUntil = (task: Promise<unknown>) => Promise<void> | void;

interface EdgeRuntimeLike {
  waitUntil?: (task: Promise<unknown>) => void;
}

/**
 * Hands a background task to the Supabase Edge Runtime so it keeps running after the response.
 * Outside the Edge Runtime (plain Deno) the returned promise must be awaited by the caller, so
 * the work still completes (the response is then sent after the work finished).
 */
export const defaultWaitUntil: WaitUntil = (task) => {
  const rt = (globalThis as { EdgeRuntime?: EdgeRuntimeLike }).EdgeRuntime;
  if (rt && typeof rt.waitUntil === 'function') {
    rt.waitUntil(task);
    return;
  }
  return task.then(() => undefined, () => undefined);
};

/** Structural JSON object for NOT NULL jsonb columns (round-trips through JSON, dropping undefined). */
export function toJson(value: object): { [key: string]: Json | undefined } | Json[] {
  return JSON.parse(JSON.stringify(value)) as { [key: string]: Json | undefined } | Json[];
}

export function todayUtc(now: Date): string {
  return now.toISOString().slice(0, 10);
}
