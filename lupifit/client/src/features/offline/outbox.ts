/**
 * Offline outbox (pure data + rules). Food-log entries, quick adds and weigh-ins made without a usable
 * connection are kept on the device and sent later, in order, with the Idempotency-Key they were
 * created with — so a request that did reach the server before the connection dropped is never
 * applied twice (the server remembers keys for 24 hours; older entries are flagged for review).
 *
 * Only creates are queued. Edits and deletes need the server's current state and stay online-only.
 */
import type { MealType } from '@shared/constants';
import type { BodyWeightInput } from '@shared/schemas/progress';
import type { CreateLogEntryInput, QuickAddInput } from '@shared/schemas/nutrition';
import type { LocalizedText } from '@shared/types';

/** Nutrient preview computed when the entry was created (what the day view shows until it is synced). */
export interface FoodPreview {
  name: LocalizedText;
  grams: number | null;
  servings: number | null;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export type OutboxOp =
  | { type: 'food_log'; input: CreateLogEntryInput; preview: FoodPreview }
  | { type: 'quick_add'; input: QuickAddInput }
  | { type: 'weight'; input: BodyWeightInput };

export interface OutboxEntry {
  /** Doubles as the Idempotency-Key. */
  id: string;
  op: OutboxOp;
  createdAt: number;
  /** Earliest time of the next attempt (ms since epoch). */
  notBefore: number;
  attempts: number;
  /** `failed` entries were rejected by the server and wait for the user to discard them. */
  status: 'pending' | 'failed';
  /** Server error code of a rejected entry. */
  errorCode?: string;
}

/** The server keeps idempotency keys for 24 hours (server/src/index.ts). */
export const IDEMPOTENCY_WINDOW_MS = 24 * 60 * 60 * 1000;
const BACKOFF_MS = [2_000, 5_000, 15_000, 30_000, 60_000, 120_000];

export const backoffMs = (attempts: number) => BACKOFF_MS[Math.min(Math.max(attempts, 1), BACKOFF_MS.length) - 1]!;

export function isOutboxEntry(v: unknown): v is OutboxEntry {
  if (!v || typeof v !== 'object') return false;
  const e = v as Partial<OutboxEntry>;
  const op = e.op as Partial<OutboxOp> | undefined;
  return (
    typeof e.id === 'string' &&
    e.id.length >= 8 &&
    typeof e.createdAt === 'number' &&
    typeof e.notBefore === 'number' &&
    typeof e.attempts === 'number' &&
    (e.status === 'pending' || e.status === 'failed') &&
    !!op &&
    (op.type === 'food_log' || op.type === 'quick_add' || op.type === 'weight') &&
    typeof op.input === 'object' &&
    op.input !== null
  );
}

export interface OutboxRequest {
  path: string;
  body: unknown;
}

export function requestFor(op: OutboxOp): OutboxRequest {
  switch (op.type) {
    case 'food_log':
      return { path: '/nutrition/logs', body: op.input };
    case 'quick_add':
      return { path: '/nutrition/logs/quick', body: op.input };
    case 'weight':
      return { path: '/progress/body-weight', body: op.input };
  }
}

/** A pending entry whose key may have expired on the server: the replay could duplicate an entry the server already stored. */
export const mayDuplicate = (e: OutboxEntry, now: number) => now - e.createdAt > IDEMPOTENCY_WINDOW_MS;

export interface PendingFood {
  id: string;
  date: string;
  mealType: MealType;
  preview: FoodPreview;
}

/** Food-log entries waiting to be synced, as the day view needs them. */
export function pendingFoods(entries: OutboxEntry[]): PendingFood[] {
  const out: PendingFood[] = [];
  for (const e of entries) {
    if (e.status !== 'pending') continue;
    if (e.op.type === 'food_log') out.push({ id: e.id, date: e.op.input.date, mealType: e.op.input.mealType, preview: e.op.preview });
    else if (e.op.type === 'quick_add') {
      const i = e.op.input;
      out.push({
        id: e.id,
        date: i.date,
        mealType: i.mealType,
        preview: { name: { en: i.name, he: i.name }, grams: null, servings: null, kcal: i.kcal, proteinG: i.proteinG ?? 0, carbsG: i.carbsG ?? 0, fatG: i.fatG ?? 0, fiberG: i.fiberG ?? 0 },
      });
    }
  }
  return out;
}

export interface PendingWeight {
  id: string;
  date: string;
  weightKg: number;
}

export function pendingWeights(entries: OutboxEntry[]): PendingWeight[] {
  return entries.flatMap((e) => (e.status === 'pending' && e.op.type === 'weight' ? [{ id: e.id, date: e.op.input.date, weightKg: e.op.input.weightKg }] : []));
}
