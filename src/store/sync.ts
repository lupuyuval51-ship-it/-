/**
 * Background sync engine (client side) for account users.
 *
 * `startSync()` is idempotent and safe to call from the root providers: it watches the store and syncs
 *   - right away when the user is (or becomes) an account user,
 *   - 1.5 s after any local write (debounced),
 *   - on `online`, window focus / tab becoming visible,
 *   - every 60 s.
 * `syncNow()` pushes the dirty queue in batches of 500 (`markSynced` on success, server conflicts applied
 * locally because the newer `updatedAt` wins) and then pulls everything changed since `auth.lastSyncAt`.
 * Local data is never deleted by sync; `syncStatus` reflects idle / syncing / offline / error + pending count.
 */
import type { SyncRecord, SyncedCollection, SyncedSingleton } from "@/lib/types";
import { SYNCED_COLLECTIONS, SYNCED_SINGLETONS } from "@/lib/types";
import type { SyncPullResponse, SyncPushResponse } from "@/lib/serverTypes";
import { useAppStore, type AppState, type CollectionName } from "./appStore";
import { apiFetch, isApiError } from "./api";

export const SYNC_PUSH_BATCH = 500;
export const SYNC_DEBOUNCE_MS = 1500;
export const SYNC_INTERVAL_MS = 60_000;
export const SYNC_PULL_LIMIT = 1000;
const MAX_PULL_PAGES = 50;
const REQUEST_TIMEOUT_MS = 45_000;

export interface SyncResult {
  ok: boolean;
  pushed: number;
  pulled: number;
  conflicts: number;
  /** Set when nothing ran. */
  skipped?: "guest" | "offline" | "paused";
  error?: string;
}

interface EngineState {
  started: boolean;
  inFlight: Promise<SyncResult> | null;
  runAgain: boolean;
  debounce: ReturnType<typeof setTimeout> | null;
  interval: ReturnType<typeof setInterval> | null;
  cleanups: (() => void)[];
  /** True after a 401: automatic syncs stop until the user signs in again (or syncNow({ force })). */
  pausedForAuth: boolean;
}

const engine: EngineState = { started: false, inFlight: null, runAgain: false, debounce: null, interval: null, cleanups: [], pausedForAuth: false };

const SINGLETONS = new Set<string>(SYNCED_SINGLETONS);
const COLLECTIONS = new Set<string>(SYNCED_COLLECTIONS);

function isSingleton(name: string): name is SyncedSingleton {
  return SINGLETONS.has(name);
}

function isCollection(name: string): name is SyncedCollection {
  return COLLECTIONS.has(name);
}

function browserOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function recordKey(collection: string, id: string): string {
  return `${collection}:${id}`;
}

/* ------------------------------------------------------------------ */
/* Building push records                                               */
/* ------------------------------------------------------------------ */

type QueueSnapshot = AppState["syncQueue"];

/** Turns the dirty queue into SyncRecords; keys whose data vanished locally are returned as orphans. */
export function buildPushRecords(state: Pick<AppState, "collections" | "profile" | "settings" | "activeSession">, queue: QueueSnapshot): { records: SyncRecord[]; orphans: string[] } {
  const records: SyncRecord[] = [];
  const orphans: string[] = [];
  for (const [key, entry] of Object.entries(queue)) {
    const { collection, id } = entry;
    if (isSingleton(collection)) {
      const data = collection === "profile" ? state.profile : collection === "settings" ? state.settings : state.activeSession;
      const stamped = (data as { updatedAt?: string } | null)?.updatedAt;
      records.push({ collection, id: collection, updatedAt: stamped && stamped > entry.updatedAt ? stamped : entry.updatedAt, deletedAt: null, data });
      continue;
    }
    if (!isCollection(collection)) {
      orphans.push(key);
      continue;
    }
    const record = state.collections[collection as CollectionName]?.[id] as { updatedAt?: string; deletedAt?: string | null } | undefined;
    if (!record) {
      orphans.push(key);
      continue;
    }
    records.push({ collection, id, updatedAt: record.updatedAt ?? entry.updatedAt, deletedAt: record.deletedAt ?? null, data: record });
  }
  return { records, orphans };
}

/* ------------------------------------------------------------------ */
/* Applying remote records                                             */
/* ------------------------------------------------------------------ */

/** Applies server records to the store without marking them dirty (newer updatedAt wins inside the store). */
export function applyRemoteRecords(records: SyncRecord[]): number {
  const store = useAppStore.getState();
  const byCollection = new Map<CollectionName, unknown[]>();
  let applied = 0;
  for (const rec of records) {
    if (!rec || typeof rec.collection !== "string" || typeof rec.id !== "string") continue;
    if (isSingleton(rec.collection)) {
      const data = rec.deletedAt ? null : rec.data;
      store.applyRemoteSingleton(rec.collection, data ?? null, rec.updatedAt);
      applied += 1;
      continue;
    }
    if (!isCollection(rec.collection)) continue;
    const data = rec.data && typeof rec.data === "object" ? (rec.data as Record<string, unknown>) : null;
    if (!data) continue;
    const merged = {
      ...data,
      id: rec.id,
      updatedAt: typeof data.updatedAt === "string" && data.updatedAt ? data.updatedAt : rec.updatedAt,
      deletedAt: rec.deletedAt ?? (typeof data.deletedAt === "string" ? data.deletedAt : null),
    };
    const list = byCollection.get(rec.collection as CollectionName) ?? [];
    list.push(merged);
    byCollection.set(rec.collection as CollectionName, list);
    applied += 1;
  }
  for (const [collection, list] of byCollection) store.applyRemote(collection, list);
  return applied;
}

/* ------------------------------------------------------------------ */
/* Push / pull                                                         */
/* ------------------------------------------------------------------ */

async function pushQueue(): Promise<{ pushed: number; conflicts: number }> {
  const state = useAppStore.getState();
  const snapshot: QueueSnapshot = { ...state.syncQueue };
  const { records, orphans } = buildPushRecords(state, snapshot);
  if (orphans.length) state.markSynced(orphans);
  let pushed = 0;
  let conflicts = 0;
  for (let i = 0; i < records.length; i += SYNC_PUSH_BATCH) {
    const batch = records.slice(i, i + SYNC_PUSH_BATCH);
    const res = await apiFetch<SyncPushResponse>("/api/sync/push", { method: "POST", body: { records: batch }, timeoutMs: REQUEST_TIMEOUT_MS });
    if (res.conflicts.length) applyRemoteRecords(res.conflicts);
    const done = [...res.accepted, ...res.rejected.map((r) => r.key), ...res.conflicts.map((c) => recordKey(c.collection, c.id))];
    // Only clear keys that were not modified again while the request was in flight.
    const current = useAppStore.getState().syncQueue;
    const clear = done.filter((k) => current[k] && current[k].updatedAt === snapshot[k]?.updatedAt);
    if (clear.length) useAppStore.getState().markSynced(clear);
    pushed += res.accepted.length;
    conflicts += res.conflicts.length;
  }
  return { pushed, conflicts };
}

async function pullRemote(): Promise<number> {
  const since = useAppStore.getState().auth.lastSyncAt ?? null;
  let cursor: string | null = null;
  let serverTime: string | null = null;
  let pulled = 0;
  for (let page = 0; page < MAX_PULL_PAGES; page++) {
    const qs = new URLSearchParams();
    if (cursor) qs.set("cursor", cursor);
    else if (since) qs.set("since", since);
    qs.set("limit", String(SYNC_PULL_LIMIT));
    const res: SyncPullResponse = await apiFetch<SyncPullResponse>(`/api/sync/pull?${qs.toString()}`, { timeoutMs: REQUEST_TIMEOUT_MS });
    serverTime ??= res.serverTime;
    pulled += applyRemoteRecords(res.records);
    cursor = res.nextCursor;
    if (!cursor) break;
  }
  if (serverTime) useAppStore.getState().setAuth({ lastSyncAt: serverTime });
  return pulled;
}

async function runSync(): Promise<SyncResult> {
  const store = useAppStore.getState();
  store.setSyncStatus({ state: "syncing", error: undefined });
  try {
    const { pushed, conflicts } = await pushQueue();
    const pulled = await pullRemote();
    const now = useAppStore.getState();
    now.setSyncStatus({ state: "idle", lastSyncAt: now.auth.lastSyncAt, error: undefined });
    return { ok: true, pushed, pulled, conflicts };
  } catch (err) {
    const s = useAppStore.getState();
    if (isApiError(err)) {
      if (err.offline) {
        s.setSyncStatus({ state: "offline", error: undefined });
        return { ok: false, pushed: 0, pulled: 0, conflicts: 0, skipped: "offline", error: err.code };
      }
      if (err.status === 401) {
        engine.pausedForAuth = true;
        s.setSyncStatus({ state: "error", error: "session_expired" });
        return { ok: false, pushed: 0, pulled: 0, conflicts: 0, error: "session_expired" };
      }
      s.setSyncStatus({ state: "error", error: err.code });
      return { ok: false, pushed: 0, pulled: 0, conflicts: 0, error: err.code };
    }
    s.setSyncStatus({ state: "error", error: "internal" });
    return { ok: false, pushed: 0, pulled: 0, conflicts: 0, error: "internal" };
  }
}

/** Runs one push + pull cycle now (coalesces concurrent calls). Guests get `skipped: "guest"`. */
export function syncNow(opts: { force?: boolean } = {}): Promise<SyncResult> {
  const store = useAppStore.getState();
  if (store.auth.mode !== "account") {
    if (store.syncStatus.state !== "disabled") store.setSyncStatus({ state: "disabled", error: undefined });
    return Promise.resolve({ ok: true, pushed: 0, pulled: 0, conflicts: 0, skipped: "guest" });
  }
  if (opts.force) engine.pausedForAuth = false;
  if (engine.pausedForAuth) return Promise.resolve({ ok: false, pushed: 0, pulled: 0, conflicts: 0, skipped: "paused", error: "session_expired" });
  if (browserOffline()) {
    if (store.syncStatus.state !== "offline") store.setSyncStatus({ state: "offline", error: undefined });
    return Promise.resolve({ ok: false, pushed: 0, pulled: 0, conflicts: 0, skipped: "offline" });
  }
  if (engine.inFlight) {
    engine.runAgain = true;
    return engine.inFlight;
  }
  engine.inFlight = runSync().finally(() => {
    engine.inFlight = null;
    if (engine.runAgain) {
      engine.runAgain = false;
      scheduleDebounced();
    }
  });
  return engine.inFlight;
}

function scheduleDebounced(): void {
  if (engine.debounce) clearTimeout(engine.debounce);
  engine.debounce = setTimeout(() => {
    engine.debounce = null;
    void syncNow();
  }, SYNC_DEBOUNCE_MS);
}

/* ------------------------------------------------------------------ */
/* Lifecycle                                                           */
/* ------------------------------------------------------------------ */

/** Starts the background engine (idempotent). Call once from the client root; returns `stopSync`. */
export function startSync(): () => void {
  if (engine.started) return stopSync;
  engine.started = true;

  if (typeof window !== "undefined") {
    const onOnline = () => {
      const s = useAppStore.getState();
      if (s.auth.mode === "account") s.setSyncStatus({ state: "idle", error: undefined });
      void syncNow();
    };
    const onOffline = () => {
      const s = useAppStore.getState();
      if (s.auth.mode === "account") s.setSyncStatus({ state: "offline", error: undefined });
    };
    const onFocus = () => void syncNow();
    const onVisible = () => {
      if (document.visibilityState === "visible") void syncNow();
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    engine.cleanups.push(() => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    });
    engine.interval = setInterval(() => void syncNow(), SYNC_INTERVAL_MS);
  }

  let prevQueue = useAppStore.getState().syncQueue;
  let prevMode = useAppStore.getState().auth.mode;
  let prevHydrated = useAppStore.getState().hydrated;
  const unsubscribe = useAppStore.subscribe((s) => {
    if (s.auth.mode !== prevMode) {
      prevMode = s.auth.mode;
      engine.pausedForAuth = false;
      if (s.auth.mode === "account") scheduleDebounced();
      else if (s.syncStatus.state !== "disabled") s.setSyncStatus({ state: "disabled", error: undefined });
    }
    if (s.hydrated && !prevHydrated) {
      prevHydrated = true;
      prevQueue = s.syncQueue;
      void syncNow();
      return;
    }
    if (s.syncQueue !== prevQueue) {
      prevQueue = s.syncQueue;
      if (s.auth.mode === "account" && Object.keys(s.syncQueue).length > 0) scheduleDebounced();
    }
  });
  engine.cleanups.push(unsubscribe);

  if (useAppStore.getState().hydrated) void syncNow();
  return stopSync;
}

/** Stops timers and listeners. Local data and the queue are untouched. */
export function stopSync(): void {
  for (const c of engine.cleanups) c();
  engine.cleanups = [];
  if (engine.interval) clearInterval(engine.interval);
  if (engine.debounce) clearTimeout(engine.debounce);
  engine.interval = null;
  engine.debounce = null;
  engine.started = false;
  engine.runAgain = false;
  engine.pausedForAuth = false;
}

export function isSyncStarted(): boolean {
  return engine.started;
}
