/**
 * Sends the offline outbox. One instance per tab, bound by `useOutboxSync()` in the app shell so
 * unsynced entries keep going out while the user browses. Entries are sent one at a time, strictly
 * oldest first (a later entry never overtakes one that waits for a retry). Network/server hiccups are
 * retried with backoff; entries the server rejects stay visible as `failed` until the user discards them
 * (never silently lost).
 *
 * Storage: each user's entries live under their own key (`fitai.outbox.<userId>`), so another account on
 * the same device never overwrites them. They are kept on logout (unsynced data is never dropped silently)
 * and sync when that user signs in again; only that user's session ever loads them. Every change re-reads
 * the stored list first and other tabs are followed through the `storage` event, so two tabs of the same
 * user do not overwrite each other's entries.
 */
import type { QueryClient } from '@tanstack/react-query';
import { ApiError, apiPost } from '../../api/client';
import { qk } from '../../api/queryClient';
import { newIdempotencyKey } from '../../lib/ids';
import { storage } from '../../lib/storage';
import { invalidateAfterBodyWeight } from '../progress/api';
import { classifyFailure } from '../sessions/queue';
import { backoffMs, isOutboxEntry, requestFor, type OutboxEntry, type OutboxOp } from './outbox';
import { apiOffline } from '../../platform';

/** Old single-key outbox (one user per device). Moved to its owner's own key when they next sign in. */
export const OUTBOX_KEY = 'fitai.outbox';
export const outboxKey = (userId: string) => `${OUTBOX_KEY}.${userId}`;
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

function parseOutbox(s: StoredOutbox | null, userId: string): OutboxEntry[] {
  if (!s || s.v !== 1 || s.userId !== userId || !Array.isArray(s.entries)) return [];
  return s.entries.filter(isOutboxEntry);
}

export function readOutbox(userId: string): OutboxEntry[] {
  return parseOutbox(storage.get<StoredOutbox>(outboxKey(userId)), userId);
}

/** Stores a user's outbox (an empty one removes the key); false when the device could not store it. */
function writeOutbox(userId: string, entries: OutboxEntry[]): boolean {
  if (entries.length === 0) {
    storage.remove(outboxKey(userId));
    return true;
  }
  return storage.set(outboxKey(userId), { v: 1, userId, entries } satisfies StoredOutbox);
}

/** Moves the old single-key outbox to its owner's key; another user's is left for them. */
function migrateLegacyOutbox(userId: string): void {
  const legacy = storage.get<StoredOutbox>(OUTBOX_KEY);
  if (!legacy || legacy.userId !== userId) return;
  const current = readOutbox(userId);
  const moved = parseOutbox(legacy, userId).filter((e) => !current.some((c) => c.id === e.id));
  if (writeOutbox(userId, [...moved, ...current])) storage.remove(OUTBOX_KEY);
}

/** Removes a user's stored outbox (account deleted: nothing left to sync it to). */
export function clearOutbox(userId: string): void {
  storage.remove(outboxKey(userId));
  if (storage.get<StoredOutbox>(OUTBOX_KEY)?.userId === userId) storage.remove(OUTBOX_KEY);
}

/** The entry to send next: the oldest pending one (failed entries wait for the user). */
function head(entries: OutboxEntry[]): OutboxEntry | undefined {
  let first: OutboxEntry | undefined;
  for (const e of entries) if (e.status === 'pending' && (!first || e.createdAt < first.createdAt)) first = e;
  return first;
}

export class OutboxSync {
  private qc: QueryClient | null = null;
  private userId: string | null = null;
  private entries: OutboxEntry[] = [];
  private inFlight: string | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private lastFailure: 'network' | 'other' | null = null;
  private authBlocked = false;
  /** False after the device refused a write: this tab then keeps its own list instead of re-reading storage. */
  private storageOk = true;
  private holders = 0;
  private listeners = new Set<() => void>();
  private snapshot: OutboxSnapshot = { ...EMPTY, entries: this.entries };

  private readonly onOnline = () => {
    if (this.userId) this.commit(this.userId, (list) => list.map((e) => (e.status === 'pending' ? { ...e, notBefore: Math.min(e.notBefore, Date.now()) } : e)));
    this.lastFailure = null;
    this.emit();
    this.schedule(0);
  };
  private readonly onOffline = () => this.emit();
  /** Another tab changed this user's outbox. */
  private readonly onStorage = (e: StorageEvent) => {
    const userId = this.userId;
    if (!userId || !this.storageOk || (e.key !== null && e.key !== outboxKey(userId))) return;
    this.entries = readOutbox(userId);
    this.emit();
    this.schedule(0);
  };

  /** Binds the engine to the query client and user while a component holds it; returns the release function. */
  retain(qc: QueryClient, userId: string): () => void {
    this.qc = qc;
    if (this.userId !== userId) {
      this.userId = userId;
      migrateLegacyOutbox(userId);
      this.entries = readOutbox(userId);
    }
    // A new sign-in (also as the same user, after a 401 signed them out) may send again.
    this.authBlocked = false;
    this.lastFailure = null;
    if (this.holders++ === 0) {
      window.addEventListener('online', this.onOnline);
      window.addEventListener('offline', this.onOffline);
      window.addEventListener('storage', this.onStorage);
    }
    this.emit();
    this.schedule(0);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      if (--this.holders > 0) return;
      window.removeEventListener('online', this.onOnline);
      window.removeEventListener('offline', this.onOffline);
      window.removeEventListener('storage', this.onStorage);
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
      // Signed out: forget the user in memory. Their unsynced entries stay under their own key.
      this.userId = null;
      this.entries = [];
      this.authBlocked = false;
      this.lastFailure = null;
      this.emit();
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
    this.commit(this.userId, (list) => [...list.filter((e) => e.id !== key), entry]);
    this.schedule(0);
    return entry;
  }

  /** Removes an entry (pending or failed) without sending it. */
  discard(id: string): void {
    if (this.userId) this.commit(this.userId, (list) => list.filter((e) => e.id !== id));
  }

  /** Puts a rejected entry back in the queue. */
  retry(id: string): void {
    if (!this.userId) return;
    this.commit(this.userId, (list) => list.map((e) => (e.id === id ? { ...e, status: 'pending', errorCode: undefined, attempts: 0, notBefore: Date.now() } : e)));
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
    const offline = typeof navigator !== 'undefined' && (apiOffline() || (this.lastFailure === 'network' && pending > 0));
    const next: OutboxSnapshot = { entries: this.entries, pending, failed, saving: this.inFlight != null, offline };
    const s = this.snapshot;
    if (s.entries === next.entries && s.saving === next.saving && s.offline === next.offline) return;
    this.snapshot = next;
    for (const fn of this.listeners) fn();
  }

  /**
   * Applies a change to a user's outbox: to the stored list (re-read, so another tab's changes are kept)
   * or, if this device refused the last write, to this tab's own list so nothing it shows is lost.
   */
  private commit(userId: string, change: (entries: OutboxEntry[]) => OutboxEntry[]) {
    const bound = userId === this.userId;
    const next = change(bound && !this.storageOk ? this.entries : readOutbox(userId));
    const ok = writeOutbox(userId, next);
    if (!bound) return;
    this.storageOk = ok;
    this.entries = next;
    this.emit();
  }

  private schedule(delayMs: number) {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), delayMs);
  }

  private async flush(): Promise<void> {
    this.timer = null;
    const userId = this.userId;
    if (this.inFlight || this.authBlocked || !userId) return;
    const now = Date.now();
    // Strictly oldest first: two weigh-ins for the same date must reach the server in the order they were made.
    const next = head(this.entries);
    if (!next) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return this.schedule(OFFLINE_RECHECK_MS);
    if (next.notBefore > now) return this.schedule(Math.max(250, next.notBefore - now));

    this.inFlight = next.id;
    this.emit();
    try {
      const req = requestFor(next.op);
      await apiPost(req.path, req.body, next.id, REQUEST_TIMEOUT_MS);
      if (userId === this.userId) this.lastFailure = null;
      this.commit(userId, (list) => list.filter((e) => e.id !== next.id));
      if (userId === this.userId) this.refreshAfter(next.op);
    } catch (err) {
      const kind = classifyFailure(err);
      if (kind === 'auth') {
        if (userId === this.userId) this.authBlocked = true;
      } else if (kind === 'retry') {
        if (userId === this.userId) this.lastFailure = err instanceof ApiError && err.isNetwork ? 'network' : 'other';
        const attempts = next.attempts + 1;
        this.commit(userId, (list) => list.map((e) => (e.id === next.id ? { ...e, attempts, notBefore: Date.now() + backoffMs(attempts) } : e)));
      } else {
        const errorCode = err instanceof ApiError ? err.code : 'unknown';
        this.commit(userId, (list) => list.map((e) => (e.id === next.id ? { ...e, status: 'failed', errorCode } : e)));
      }
    } finally {
      this.inFlight = null;
      this.emit();
      if (this.userId) this.schedule(0);
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
    this.storageOk = true;
    this.snapshot = { ...EMPTY, entries: this.entries };
  }
}

export const outboxSync = new OutboxSync();
