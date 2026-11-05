/**
 * Offline outbox (IndexedDB). Mutations that fail because the network is down are queued with their ORIGINAL
 * Idempotency-Key and replayed oldest-first, so a retry can never create a duplicate. Items the server rejects
 * (validation / conflict) are kept as `rejected` and shown to the user — never silently dropped.
 *
 *   const r = await callOrQueue({ method: 'POST', path: '/api/food-log', body, label: 'Rice 150 g' });
 *   if (r.queued) toast(t('outbox.queued')); else use(r.data);
 */
import { del, entries, get, set, createStore } from 'idb-keyval';
import { useSyncExternalStore } from 'react';
import { api, ApiRequestError, getCurrentUserId, NetworkError, onUserChange } from '../api/client.ts';
import { IS_DEVICE } from '../env.ts';

export interface OutboxItem {
  id: string; method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'; path: string; body: unknown; idempotencyKey: string;
  createdAt: number; label: string; status: 'pending' | 'rejected'; error?: string;
  /** Who queued it. An item is only shown to, and only ever replayed for, that person (a shared device must not move A's food log into B's account). Absent on items queued by older versions. */
  userId?: string;
}

const store = () => createStore('lupu-fit-outbox', 'items');
let cache: OutboxItem[] = [];
/** What the current person may see and replay (stable reference between changes, as useSyncExternalStore requires). */
let view: OutboxItem[] = [];
const mine = (i: OutboxItem): boolean => !i.userId || i.userId === getCurrentUserId();
const refresh = (): void => { view = cache.filter(mine); };
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
let flushing: Promise<void> | null = null;
/** Bumped on every change of person: a flush that started for someone else stops before its next item. */
let generation = 0;
/** Lifetime of a "keep me signed in" off session on the server (server/src/routes/auth.ts). */
const EPHEMERAL_SESSION_MS = 12 * 3600_000;

async function reload(): Promise<void> {
  try { cache = (await entries<string, OutboxItem>(store())).map(([, v]) => v).sort((a, b) => a.createdAt - b.createdAt); } catch { cache = []; }
  refresh(); emit();
}
void reload();
/**
 * Whoever is signed in changed: re-filter. A deleted account takes its queued items with it; a "this browser session only" sign-in that
 * ended (shared device) keeps nothing queued past that session's own lifetime.
 */
onUserChange((e) => {
  generation++;
  if (e.reason === 'deleted' || e.reason === 'expired') {
    const cutoff = Date.now() - EPHEMERAL_SESSION_MS;
    const doomed = cache.filter((i) => (e.reason === 'deleted' ? !i.userId || i.userId === e.from : !!i.userId && i.userId === e.from && i.createdAt < cutoff));
    void Promise.all(doomed.map((i) => del(i.id, store()).catch(() => undefined))).then(reload);
  }
  refresh(); emit();
});

export const outbox = {
  list: (): OutboxItem[] => view,
  async enqueue(i: Omit<OutboxItem, 'id' | 'createdAt' | 'status' | 'idempotencyKey'> & { idempotencyKey?: string }): Promise<OutboxItem> {
    const uid = getCurrentUserId();
    const item: OutboxItem = { ...i, id: crypto.randomUUID(), idempotencyKey: i.idempotencyKey ?? crypto.randomUUID(), createdAt: Date.now(), status: 'pending', ...(uid ? { userId: uid } : {}) };
    await set(item.id, item, store()); await reload(); return item;
  },
  async remove(id: string): Promise<void> { await del(id, store()); await reload(); },
  async retryRejected(id: string): Promise<void> { const it = await get<OutboxItem>(id, store()); if (it) { await set(id, { ...it, status: 'pending' }, store()); await reload(); } },
  /** Replays pending items oldest-first; stops at the first network failure so ordering is preserved. */
  flush(): Promise<void> {
    if (flushing) return flushing;
    // NOTE: reset in .finally on the returned promise. Resetting inside the async body is wrong: with nothing to send the body
    // finishes synchronously, before `flushing` is assigned, which would leave a settled promise cached forever.
    const p: Promise<void> = (async () => {
      // The person is fixed when the flush starts and checked again before every item: one replay can hang for a long time, and if
      // someone else signs in meanwhile, the remaining items must not go out with the new person's cookie and CSRF token.
      const owner = getCurrentUserId(); const gen = generation;
      const same = (): boolean => gen === generation && getCurrentUserId() === owner;
      try {
        for (const it of cache.filter((x) => x.status === 'pending' && mine(x))) {
          if (!same() || !mine(it)) break;
          try {
            await replay(it);
            await del(it.id, store());
          } catch (e) {
            if (!same()) break; // the answer may belong to the next person's session: leave the item for its owner
            if (e instanceof NetworkError) break;
            if (e instanceof ApiRequestError && (e.status >= 500 || e.status === 429 || e.status === 401)) break; // transient (or: signed out, they wait for the same person to sign in again): try again later
            if (e instanceof ApiRequestError && e.code === 'csrf_invalid') break; // stale token the API layer could not refresh for this person (api/client.ts): the entry itself is still valid
            const code = e instanceof ApiRequestError ? e.code : 'error';
            await set(it.id, { ...it, status: 'rejected', error: code } satisfies OutboxItem, store());
          }
        }
      } finally { await reload(); }
    })().finally(() => { if (flushing === p) flushing = null; });
    flushing = p;
    return p;
  },
  subscribe(f: () => void): () => void { subs.add(f); return () => { subs.delete(f); }; },
};

function replay(it: OutboxItem): Promise<unknown> {
  const o = { idempotencyKey: it.idempotencyKey };
  switch (it.method) {
    case 'POST': return api.post(it.path, it.body, o);
    case 'PUT': return api.put(it.path, it.body, o);
    case 'PATCH': return api.patch(it.path, it.body, o);
    case 'DELETE': return api.delete(it.path, it.body, o);
  }
}

export type QueuedResult<T> = { queued: false; data: T } | { queued: true; item: OutboxItem };

/** Try the call now; if the network is unreachable, queue it for replay (same Idempotency-Key). Other errors propagate. */
export async function callOrQueue<T>(r: { method: OutboxItem['method']; path: string; body?: unknown; label: string }): Promise<QueuedResult<T>> {
  const key = crypto.randomUUID();
  // Device Mode: the API is the local database worker, which needs no connection, so `offline` is no reason to queue.
  if (!IS_DEVICE && typeof navigator !== 'undefined' && navigator.onLine === false) return { queued: true, item: await outbox.enqueue({ method: r.method, path: r.path, body: r.body, label: r.label, idempotencyKey: key }) };
  try {
    const data = await (r.method === 'POST' ? api.post<T>(r.path, r.body, { idempotencyKey: key }) : r.method === 'PUT' ? api.put<T>(r.path, r.body, { idempotencyKey: key }) : r.method === 'PATCH' ? api.patch<T>(r.path, r.body, { idempotencyKey: key }) : api.delete<T>(r.path, r.body, { idempotencyKey: key }));
    return { queued: false, data };
  } catch (e) {
    if (e instanceof NetworkError) return { queued: true, item: await outbox.enqueue({ method: r.method, path: r.path, body: r.body, label: r.label, idempotencyKey: key }) };
    throw e;
  }
}

export function useOutbox(): OutboxItem[] { return useSyncExternalStore(outbox.subscribe, outbox.list, outbox.list); }

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { void outbox.flush(); });
  setInterval(() => { if (view.some((x) => x.status === 'pending')) void outbox.flush(); }, 30_000);
}
