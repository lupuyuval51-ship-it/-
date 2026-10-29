/**
 * Sends the offline outbox. One instance per tab, bound by `useOutboxSync()` in the app shell so
 * unsynced entries keep going out while the user browses. Persisted in localStorage per user; entries are
 * sent one at a time in the order they were made. Network/server hiccups are retried with backoff;
 * entries the server rejects stay visible as `failed` until the user discards them (never silently lost).
 */
import type { QueryClient } from '@tanstack/react-query';
import { ApiError, apiPost } from '../../api/client';
import { qk } from '../../api/queryClient';
import { newIdempotencyKey } from '../../lib/ids';
import { storage } from '../../lib/storage';
import { invalidateAfterBodyWeight } from '../progress/api';
import { classifyFailure } from '../sessions/queue';
import { backoffMs, isOutboxEntry, requestFor, type OutboxEntry, type OutboxOp } from './outbox';

export const OUTBOX_KEY = 'fitai.outbox';
const OFFLINE_RECHECK_MS = 15_000;
const REQUEST_TIMEOUT_MS = 12_000;

interface StoredOutbox {
  v: 1;
  userId: string;
  entries: OutboxEntry[];
}

export interface OutboxSnapshot {
  entries: OutboxEntry[];
  /** Entries waiting to be sent. */
  pending: number;
  /** Entries the server rejected. */
  failed: number;
  saving: boolean;
  offline: boolean;
}

const EMPTY: OutboxSnapshot = { entries: [], pending: 0, failed: 0, saving: false, offline: false };

export function readOutbox(userId: string): OutboxEntry[] {
  const s = storage.get<StoredOutbox>(OUTBOX_KEY);
  if (!s || s.v !== 1 || s.userId !== userId || !Array.isArray(s.entries)) return [];
  return s.entries.filter(isOutboxEntry);
}

export class OutboxSync {
  private qc: QueryClient | null = null;
  private userId: string | null = null;
  private entries: OutboxEntry[] = [];
  private inFlight: string | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private lastFailure: 'network' | 'other' | null = null;
  private authBlocked = false;
  private holders = 0;
  private listeners = new Set<() => void>();
  private snapshot: OutboxSnapshot = { ...EMPTY, entries: this.entries };

  private readonly onOnline = () => {
    this.entries = this.entries.map((e) => (e.status === 'pending' ? { ...e, notBefore: Math.min(e.notBefore, Date.now()) } : e));
    this.lastFailure = null;
    this.emit();
    this.schedule(0);
  };
  private readonly onOffline = () => this.emit();

  /** Binds the engine to the query client and user while a component holds it; returns the release function. */
  retain(qc: QueryClient, userId: string): () => void {
    this.qc = qc;
    if (this.userId !== userId) {
      this.userId = userId;
      this.entries = readOutbox(userId);
      this.authBlocked = false;
      this.lastFailure = null;
    }
    if (this.holders++ === 0) {
      window.addEventListener('online', this.onOnline);
      window.addEventListener('offline', this.onOffline);
    }
    this.emit();
    this.schedule(0);
    return () => {
      if (--this.holders > 0) return;
      window.removeEventListener('online', this.onOnline);
      window.removeEventListener('offline', this.onOffline);
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
    };
  }

  /** Whether entries can be queued right now (a signed-in user is bound). */
  get ready(): boolean {
    return this.userId != null;
  }

  /** Stores an operation for later. `key` is the Idempotency-Key of the attempt that may already have reached the server. */
  enqueue(op: OutboxOp, key: string = newIdempotencyKey()): OutboxEntry {
    if (!this.userId) throw new Error('outbox_not_ready');
    const entry: OutboxEntry = { id: key, op, createdAt: Date.now(), notBefore: Date.now(), attempts: 0, status: 'pending' };
    this.entries = [...this.entries.filter((e) => e.id !== key), entry];
    this.persist();
    this.emit();
    this.schedule(0);
    return entry;
  }

  /** Removes an entry (pending or failed) without sending it. */
  discard(id: string): void {
    this.entries = this.entries.filter((e) => e.id !== id);
    this.persist();
    this.emit();
  }

  /** Puts a rejected entry back in the queue. */
  retry(id: string): void {
    this.entries = this.entries.map((e) => (e.id === id ? { ...e, status: 'pending', errorCode: undefined, attempts: 0, notBefore: Date.now() } : e));
    this.persist();
    this.emit();
    this.schedule(0);
  }

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getSnapshot = (): OutboxSnapshot => this.snapshot;

  private emit() {
    const pending = this.entries.filter((e) => e.status === 'pending').length;
    const failed = this.entries.length - pending;
    const offline = typeof navigator !== 'undefined' && (navigator.onLine === false || (this.lastFailure === 'network' && pending > 0));
    const next: OutboxSnapshot = { entries: this.entries, pending, failed, saving: this.inFlight != null, offline };
    const s = this.snapshot;
    if (s.entries === next.entries && s.saving === next.saving && s.offline === next.offline) return;
    this.snapshot = next;
    for (const fn of this.listeners) fn();
  }

  private persist() {
    if (!this.userId) return;
    if (this.entries.length === 0) storage.remove(OUTBOX_KEY);
    else storage.set(OUTBOX_KEY, { v: 1, userId: this.userId, entries: this.entries } satisfies StoredOutbox);
  }

  private schedule(delayMs: number) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), delayMs);
  }

  private async flush(): Promise<void> {
    this.timer = null;
    if (this.inFlight || this.authBlocked || !this.userId) return;
    const now = Date.now();
    const pending = this.entries.filter((e) => e.status === 'pending');
    if (pending.length === 0) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return this.schedule(OFFLINE_RECHECK_MS);
    const next = pending.find((e) => e.notBefore <= now);
    if (!next) return this.schedule(Math.max(250, Math.min(...pending.map((e) => e.notBefore)) - now));

    this.inFlight = next.id;
    this.emit();
    try {
      const req = requestFor(next.op);
      await apiPost(req.path, req.body, next.id, REQUEST_TIMEOUT_MS);
      this.lastFailure = null;
      this.entries = this.entries.filter((e) => e.id !== next.id);
      this.persist();
      this.refreshAfter(next.op);
    } catch (err) {
      const kind = classifyFailure(err);
      if (kind === 'auth') {
        this.authBlocked = true;
      } else if (kind === 'retry') {
        this.lastFailure = err instanceof ApiError && err.isNetwork ? 'network' : 'other';
        const attempts = next.attempts + 1;
        this.entries = this.entries.map((e) => (e.id === next.id ? { ...e, attempts, notBefore: Date.now() + backoffMs(attempts) } : e));
        this.persist();
      } else {
        this.entries = this.entries.map((e) => (e.id === next.id ? { ...e, status: 'failed', errorCode: err instanceof ApiError ? err.code : 'unknown' } : e));
        this.persist();
      }
    } finally {
      this.inFlight = null;
      this.emit();
      this.schedule(0);
    }
  }

  private refreshAfter(op: OutboxOp) {
    const qc = this.qc;
    if (!qc) return;
    if (op.type === 'weight') void invalidateAfterBodyWeight(qc);
    else {
      void qc.invalidateQueries({ queryKey: ['nutrition'] });
      void qc.invalidateQueries({ queryKey: qk.dashboard });
      void qc.invalidateQueries({ queryKey: qk.gamification });
    }
  }

  /** Test helper: drop all in-memory state. */
  reset() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.entries = [];
    this.userId = null;
    this.inFlight = null;
    this.lastFailure = null;
    this.authBlocked = false;
    this.snapshot = { ...EMPTY, entries: this.entries };
  }
}

export const outboxSync = new OutboxSync();
