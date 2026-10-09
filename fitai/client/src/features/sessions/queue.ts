/**
 * Offline-tolerant queue of live-session edits (pure functions, no I/O).
 *
 * Set values, per-exercise settings and session state (current exercise, rest timer)
 * are absolute "patches": they are applied optimistically to the cached session, kept
 * in this queue (persisted to localStorage) and sent with an Idempotency-Key until the
 * server acknowledges them. Consecutive patches to the same target are merged into one
 * request (with a fresh key, because the payload changed); an entry that is already in
 * flight is never modified.
 */
import type { UpdateSessionExerciseInput, UpdateSetInput } from '@shared/schemas/sessions';
import type { RestTimerState } from '@shared/timer';
import type { SessionSetDTO, WorkoutSessionDTO } from '@shared/types';
import { ApiError } from '../../api/client';

export type SetPatch = UpdateSetInput;
export type ExercisePatch = UpdateSessionExerciseInput;
export interface StatePatch {
  currentExerciseIndex?: number;
  restTimer?: RestTimerState | null;
}

export type PendingOp =
  | { type: 'set'; sessionId: string; setId: string; patch: SetPatch }
  | { type: 'exercise'; sessionId: string; sessionExerciseId: string; patch: ExercisePatch }
  | { type: 'state'; sessionId: string; patch: StatePatch };

export interface QueueEntry {
  /** Local identifier of the entry. */
  id: string;
  /** Idempotency-Key for exactly this payload (regenerated whenever the payload changes). */
  key: string;
  op: PendingOp;
  attempts: number;
  /** Not sent before this time (debounce of typing, or retry backoff). Epoch ms. */
  notBefore: number;
  createdAt: number;
}

export interface EnqueueOptions {
  now: number;
  /** Debounce: how long to wait for more edits of the same target before sending. */
  delayMs: number;
  /** Entry currently being sent (must not be merged into). */
  inFlightId?: string | null;
  newId: () => string;
  newKey: () => string;
}

export function targetOf(op: PendingOp): string {
  switch (op.type) {
    case 'set':
      return `set:${op.setId}`;
    case 'exercise':
      return `exercise:${op.sessionExerciseId}`;
    case 'state':
      return `state:${op.sessionId}`;
  }
}

function mergeOps(a: PendingOp, b: PendingOp): PendingOp {
  // Callers guarantee both ops share a target (and therefore a type).
  return { ...a, patch: { ...a.patch, ...b.patch } } as PendingOp;
}

/** Adds an op, merging it into the pending (not in-flight) entry for the same target when there is one. */
export function enqueue(queue: QueueEntry[], op: PendingOp, o: EnqueueOptions): QueueEntry[] {
  const target = targetOf(op);
  const idx = queue.findIndex((e) => e.id !== o.inFlightId && targetOf(e.op) === target);
  const notBefore = o.now + Math.max(0, o.delayMs);
  if (idx >= 0) {
    const existing = queue[idx]!;
    const merged: QueueEntry = { ...existing, op: mergeOps(existing.op, op), key: o.newKey(), notBefore };
    return [...queue.slice(0, idx), merged, ...queue.slice(idx + 1)];
  }
  return [...queue, { id: o.newId(), key: o.newKey(), op, attempts: 0, notBefore, createdAt: o.now }];
}

/** Next entry that may be sent now (FIFO among ready entries), or null. */
export function nextReady(queue: QueueEntry[], now: number): QueueEntry | null {
  return queue.find((e) => e.notBefore <= now) ?? null;
}

/** Milliseconds until the earliest entry becomes ready (0 if one is ready, null if empty). */
export function msUntilNextReady(queue: QueueEntry[], now: number): number | null {
  if (queue.length === 0) return null;
  return Math.max(0, Math.min(...queue.map((e) => e.notBefore)) - now);
}

/** Exponential backoff with a cap: 1 s, 2 s, 4 s … 30 s. */
export function backoffMs(attempts: number): number {
  return Math.min(30_000, 1000 * 2 ** Math.max(0, attempts - 1));
}

export type FailureKind = 'retry' | 'drop' | 'auth';

/** Network problems, timeouts, rate limits and server errors are retried; other client errors are dropped. */
export function classifyFailure(err: unknown): FailureKind {
  if (!(err instanceof ApiError)) return 'retry';
  if (err.isNetwork || err.status === 0) return 'retry';
  if (err.status === 401) return 'auth';
  if (err.status >= 500 || err.status === 429 || err.code === 'request_in_progress') return 'retry';
  return 'drop';
}

export interface OpRequest {
  path: string;
  body: Record<string, unknown>;
}

export function requestFor(op: PendingOp): OpRequest {
  switch (op.type) {
    case 'set':
      return { path: `/sessions/${op.sessionId}/sets/${op.setId}`, body: { ...op.patch } };
    case 'exercise':
      return { path: `/sessions/${op.sessionId}/exercises/${op.sessionExerciseId}`, body: { ...op.patch } };
    case 'state':
      return { path: `/sessions/${op.sessionId}/state`, body: { action: 'update', ...op.patch } };
  }
}

function applySetPatch(set: SessionSetDTO, patch: SetPatch, nowIso: string): SessionSetDTO {
  const next: SessionSetDTO = { ...set };
  if (patch.reps !== undefined) next.reps = patch.reps;
  if (patch.weightKg !== undefined) next.weightKg = patch.weightKg;
  if (patch.durationSeconds !== undefined) next.durationSeconds = patch.durationSeconds;
  if (patch.rpe !== undefined) next.rpe = patch.rpe;
  if (patch.completed !== undefined) {
    next.completed = patch.completed;
    next.completedAt = patch.completed ? (set.completedAt ?? nowIso) : null;
  }
  return next;
}

/** Applies one op to a session DTO (no-op if it targets another session or a missing item). */
export function applyOp(session: WorkoutSessionDTO, op: PendingOp, nowMs: number = Date.now()): WorkoutSessionDTO {
  if (op.sessionId !== session.id) return session;
  switch (op.type) {
    case 'set': {
      const nowIso = new Date(nowMs).toISOString();
      let changed = false;
      const exercises = session.exercises.map((e) => {
        if (!e.sets.some((s) => s.id === op.setId)) return e;
        changed = true;
        return { ...e, sets: e.sets.map((s) => (s.id === op.setId ? applySetPatch(s, op.patch, nowIso) : s)) };
      });
      return changed ? { ...session, exercises } : session;
    }
    case 'exercise': {
      if (!session.exercises.some((e) => e.id === op.sessionExerciseId)) return session;
      return {
        ...session,
        exercises: session.exercises.map((e) =>
          e.id === op.sessionExerciseId
            ? { ...e, ...(op.patch.restSeconds !== undefined ? { restSeconds: op.patch.restSeconds } : {}), ...(op.patch.notes !== undefined ? { notes: op.patch.notes } : {}) }
            : e,
        ),
      };
    }
    case 'state': {
      const next = { ...session };
      if (op.patch.currentExerciseIndex !== undefined) {
        next.currentExerciseIndex = Math.max(0, Math.min(op.patch.currentExerciseIndex, Math.max(0, session.exercises.length - 1)));
      }
      if (op.patch.restTimer !== undefined) next.restTimer = op.patch.restTimer;
      return next;
    }
  }
}

/** Server state with every still-pending local edit re-applied on top (in queue order). */
export function reconcile(server: WorkoutSessionDTO, queue: QueueEntry[], nowMs: number = Date.now()): WorkoutSessionDTO {
  if (server.status !== 'in_progress' && server.status !== 'paused') return server;
  return queue.reduce((s, e) => applyOp(s, e.op, nowMs), server);
}

/** Replaces one set with the server's version (no-op if the set is gone). */
export function replaceSet(session: WorkoutSessionDTO, set: SessionSetDTO): WorkoutSessionDTO {
  if (!session.exercises.some((e) => e.sets.some((s) => s.id === set.id))) return session;
  return { ...session, exercises: session.exercises.map((e) => ({ ...e, sets: e.sets.map((s) => (s.id === set.id ? set : s)) })) };
}

/** Structural validation for entries read back from storage. */
export function isQueueEntry(v: unknown): v is QueueEntry {
  if (!v || typeof v !== 'object') return false;
  const e = v as Record<string, unknown>;
  const op = e.op as Record<string, unknown> | undefined;
  if (typeof e.id !== 'string' || typeof e.key !== 'string' || typeof e.attempts !== 'number' || typeof e.notBefore !== 'number') return false;
  if (!op || typeof op.sessionId !== 'string' || !op.patch || typeof op.patch !== 'object') return false;
  if (op.type === 'set') return typeof op.setId === 'string';
  if (op.type === 'exercise') return typeof op.sessionExerciseId === 'string';
  return op.type === 'state';
}
