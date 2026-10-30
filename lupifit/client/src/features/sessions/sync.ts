/**
 * Background synchronisation of live-workout edits. One instance per tab, attached by
 * the always-mounted ActiveSessionIndicator so pending edits keep syncing while the
 * user browses other pages. Edits are applied optimistically to the `qk.activeSession`
 * query cache, persisted to localStorage and sent in order; failures caused by the
 * network or the server are retried with exponential backoff, while rejected edits
 * (validation, session closed …) are dropped and the session is re-fetched.
 */
import type { QueryClient } from '@tanstack/react-query';
import type { SessionSetResponse, WorkoutSessionDTO } from '@shared/types';
import { ApiError } from '../../api/client';
import { qk } from '../../api/queryClient';
import { newIdempotencyKey } from '../../lib/ids';
import { sendPatch } from './api';
import { clockSkewMs } from './clock';
import {
  applyOp,
  classifyFailure,
  enqueue,
  msUntilNextReady,
  nextReady,
  reconcile,
  replaceSet,
  requestFor,
  retryLater,
  targetOf,
  type PendingOp,
  type QueueEntry,
} from './queue';
import { readQueue, writeCachedSession, writeQueue } from './storage';

export interface SyncSnapshot {
  /** Edits not yet acknowledged by the server. */
  pending: number;
  /** A request is in flight. */
  saving: boolean;
  /** The browser is offline or the last attempt failed with a network error. */
  offline: boolean;
  /** The last attempt failed for another transient reason and will be retried. */
  retrying: boolean;
}

export interface DropEvent {
  op: PendingOp;
  error: unknown;
}

const OFFLINE_RECHECK_MS = 15_000;

export class SessionSync {
  private qc: QueryClient | null = null;
  private userId: string | null = null;
  private queue: QueueEntry[] = [];
  private inFlight: QueueEntry | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private lastFailure: 'network' | 'other' | null = null;
  private authBlocked = false;
  private discardedTargets = new Set<string>();
  private listeners = new Set<() => void>();
  private dropListeners = new Set<(e: DropEvent) => void>();
  private idleWaiters: (() => void)[] = [];
  private unsubscribeCache: (() => void) | null = null;
  private snapshot: SyncSnapshot = { pending: 0, saving: false, offline: false, retrying: false };
  private holders = 0;
  /** Incremented whenever the server acknowledges an edit (lets fetches detect races). */
  version = 0;

  private readonly onOnline = () => {
    this.queue = this.queue.map((e) => ({ ...e, notBefore: Math.min(e.notBefore, Date.now()) }));
    this.lastFailure = null;
    this.emit();
    this.schedule(0);
  };
  private readonly onOffline = () => this.emit();

  /**
   * Keeps the engine bound to the query client and user while at least one component
   * holds it; returns the release function (for effect cleanup).
   */
  retain(qc: QueryClient, userId: string): () => void {
    this.attach(qc, userId);
    this.holders += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.holders -= 1;
      if (this.holders <= 0) {
        this.holders = 0;
        this.detach();
      }
    };
  }

  /** Binds the engine to the query client and the signed-in user (idempotent). */
  attach(qc: QueryClient, userId: string): void {
    if (this.qc === qc && this.userId === userId) return;
    this.detach();
    this.qc = qc;
    this.userId = userId;
    this.queue = readQueue(userId);
    this.authBlocked = false;
    this.unsubscribeCache = qc.getQueryCache().subscribe((event) => {
      if (event.type !== 'updated' || event.query.queryKey[0] !== qk.activeSession[0] || event.query.queryKey[1] !== qk.activeSession[1]) return;
      if (event.action.type !== 'success' && event.action.type !== 'setState') return;
      const data = event.query.state.data as WorkoutSessionDTO | null | undefined;
      if (data !== undefined && this.userId) writeCachedSession(this.userId, data, clockSkewMs());
    });
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.onOnline);
      window.addEventListener('offline', this.onOffline);
    }
    this.emit();
    this.schedule(0);
  }

  detach(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.unsubscribeCache?.();
    this.unsubscribeCache = null;
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.onOnline);
      window.removeEventListener('offline', this.onOffline);
    }
    this.qc = null;
    this.userId = null;
    this.queue = [];
    this.inFlight = null;
    this.emit();
  }

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  onDrop(fn: (e: DropEvent) => void): () => void {
    this.dropListeners.add(fn);
    return () => this.dropListeners.delete(fn);
  }

  getSnapshot = (): SyncSnapshot => this.snapshot;

  /** Pending edits of one session, in order (used to re-apply them over fresh server data). */
  pendingFor(sessionId: string): QueueEntry[] {
    return this.queue.filter((e) => e.op.sessionId === sessionId);
  }

  reconcile(server: WorkoutSessionDTO): WorkoutSessionDTO {
    return reconcile(server, this.pendingFor(server.id));
  }

  /** Applies an edit to the cached session immediately and queues it for the server. */
  enqueue(op: PendingOp, delayMs = 0): void {
    if (!this.qc || !this.userId) return;
    this.discardedTargets.delete(targetOf(op));
    void this.qc.cancelQueries({ queryKey: qk.activeSession, exact: true });
    this.qc.setQueryData<WorkoutSessionDTO | null>(qk.activeSession, (old) => (old ? applyOp(old, op) : old));
    this.queue = enqueue(this.queue, op, {
      now: Date.now(),
      delayMs,
      inFlightId: this.inFlight?.id ?? null,
      newId: newIdempotencyKey,
      newKey: newIdempotencyKey,
    });
    this.persist();
    this.emit();
    this.schedule(Math.max(0, delayMs));
  }

  /** Forgets pending edits (e.g. of a set that is about to be deleted). */
  discard(predicate: (op: PendingOp) => boolean): void {
    for (const e of this.queue) if (predicate(e.op)) this.discardedTargets.add(targetOf(e.op));
    if (this.inFlight && predicate(this.inFlight.op)) this.discardedTargets.add(targetOf(this.inFlight.op));
    this.queue = this.queue.filter((e) => e === this.inFlight || !predicate(e.op));
    this.persist();
    this.emit();
  }

  /**
   * Sends everything now (ignoring debounce) and resolves when the queue is empty, or
   * with `false` after `timeoutMs` (e.g. offline). Used before finishing and before
   * structural changes so the server sees edits in the order the user made them.
   */
  async settle(timeoutMs = 8000): Promise<boolean> {
    if (this.queue.length === 0 && !this.inFlight) return true;
    const now = Date.now();
    this.queue = this.queue.map((e) => ({ ...e, notBefore: Math.min(e.notBefore, now) }));
    this.schedule(0);
    return new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        this.idleWaiters = this.idleWaiters.filter((w) => w !== done);
        resolve(this.queue.length === 0 && !this.inFlight);
      }, timeoutMs);
      const done = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      this.idleWaiters.push(done);
    });
  }

  private persist() {
    if (this.userId) writeQueue(this.userId, this.queue);
  }

  private emit() {
    const offline = (typeof navigator !== 'undefined' && navigator.onLine === false) || this.lastFailure === 'network';
    const next: SyncSnapshot = {
      pending: this.queue.length,
      saving: this.inFlight != null,
      offline: this.queue.length > 0 && offline,
      retrying: this.queue.length > 0 && this.lastFailure === 'other',
    };
    const prev = this.snapshot;
    if (prev.pending !== next.pending || prev.saving !== next.saving || prev.offline !== next.offline || prev.retrying !== next.retrying) {
      this.snapshot = next;
      for (const l of this.listeners) l();
    }
    if (this.queue.length === 0 && !this.inFlight && this.idleWaiters.length) {
      const waiters = this.idleWaiters;
      this.idleWaiters = [];
      for (const w of waiters) w();
    }
  }

  private schedule(delayMs: number) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, delayMs);
  }

  private async flush(): Promise<void> {
    if (!this.qc || this.inFlight || this.authBlocked) return;
    const now = Date.now();
    const entry = nextReady(this.queue, now);
    if (!entry) {
      const wait = msUntilNextReady(this.queue, now);
      if (wait != null) this.schedule(wait);
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this.lastFailure = 'network';
      this.emit();
      this.schedule(OFFLINE_RECHECK_MS);
      return;
    }
    this.inFlight = entry;
    this.emit();
    const qc = this.qc;
    const { path, body } = requestFor(entry.op);
    try {
      const res = await sendPatch<SessionSetResponse | { session: WorkoutSessionDTO }>(path, body, entry.key);
      this.queue = this.queue.filter((e) => e.id !== entry.id);
      this.lastFailure = null;
      this.version += 1;
      if (qc === this.qc && entry.op.type === 'set' && 'set' in res) {
        const sessionId = entry.op.sessionId;
        qc.setQueryData<WorkoutSessionDTO | null>(qk.activeSession, (old) =>
          old && old.id === sessionId ? reconcile(replaceSet(old, res.set), this.pendingFor(sessionId)) : old,
        );
      }
    } catch (error) {
      const kind = classifyFailure(error);
      if (kind === 'retry') {
        this.lastFailure = !(error instanceof ApiError) || error.isNetwork ? 'network' : 'other';
        this.queue = retryLater(this.queue, entry.id, Date.now(), newIdempotencyKey);
      } else if (kind === 'auth') {
        this.authBlocked = true;
      } else {
        this.queue = this.queue.filter((e) => e.id !== entry.id);
        const target = targetOf(entry.op);
        if (!this.discardedTargets.has(target)) for (const l of this.dropListeners) l({ op: entry.op, error });
        void qc.invalidateQueries({ queryKey: qk.activeSession, exact: true });
      }
    } finally {
      this.inFlight = null;
      this.persist();
      this.emit();
      if (this.qc === qc) this.schedule(0);
    }
  }
}

export const sessionSync = new SessionSync();
