/**
 * Optional cloud backup/sync. The device stays the source of truth for playing: every change is made locally first, and
 * `syncOnce` pushes what changed since the last successful push and merges what other phones pushed (last write wins,
 * a deleted game stays deleted). A failed round changes nothing, so the next one simply retries.
 *
 * The transport is an interface (`CloudApi`): Supabase in the app, an in-memory fake in tests (two "phones", one cloud).
 */
import type { GameSpec } from "../game/spec/schema";
import type { PlayState } from "../game/state/progress";
import type { KV, OfflineStore, StoredSession } from "./store";

export const MAX_SPEC_BYTES = 1_000_000;
export const MAX_STATE_BYTES = 250_000;

/** Rows as the cloud stores them (ISO timestamps, set by the server). */
export interface CloudGame { localId: string; title: string; spec: GameSpec; createdAt: string; updatedAt: string; deletedAt: string | null }
export interface CloudSession { localId: string; gameId: string; status: StoredSession["status"]; state: PlayState; startedAt: string; finishedAt: string | null; updatedAt: string }
export interface CloudCard { cardKey: string; gameId: string; challengeId: string; box: number; due: string; mastered: boolean; updatedAt: string }
export interface CloudRows { games: CloudGame[]; sessions: CloudSession[]; cards: CloudCard[] }

export interface PushBatch {
  games: Omit<CloudGame, "updatedAt" | "deletedAt">[];
  sessions: Omit<CloudSession, "updatedAt">[];
  cards: Omit<CloudCard, "updatedAt">[];
  deletedGames: string[];
}

export interface CloudApi {
  /** Rows changed after `since` (ISO, exclusive), oldest first. `null` = everything. */
  pull(since: string | null): Promise<CloudRows>;
  push(batch: PushBatch): Promise<void>;
}

interface SyncState { userId: string | null; cursor: string | null; lastPushMs: number; lastSyncAt: number | null }
const KEY = "levelup.offline.sync";
const EMPTY: SyncState = { userId: null, cursor: null, lastPushMs: 0, lastSyncAt: null };

export function readSyncState(kv: KV): SyncState {
  try { return { ...EMPTY, ...(JSON.parse(kv.get(KEY) ?? "{}") as Partial<SyncState>) }; } catch { return { ...EMPTY }; }
}
const writeSyncState = (kv: KV, s: SyncState) => kv.set(KEY, JSON.stringify(s));
/** Forget what was synced (sign-out or a different account): everything is treated as new on the next sign-in. */
export const resetSyncState = (kv: KV) => kv.remove(KEY);

export interface SyncResult { pushed: number; pulled: number; skipped: number }

const ms = (iso: string) => Date.parse(iso);
const iso = (n: number) => new Date(n).toISOString();
const bytes = (v: unknown) => JSON.stringify(v).length;

export async function syncOnce(store: OfflineStore, kv: KV, api: CloudApi, userId: string, now: () => number = Date.now): Promise<SyncResult> {
  let state = readSyncState(kv);
  // a different account on this phone must not inherit the previous account's sync marks
  if (state.userId !== null && state.userId !== userId) state = { ...EMPTY };
  const startedAt = now();

  // 1) pull and merge (games first: sessions and cards refer to them)
  const remote = await api.pull(state.cursor);
  const pulled = store.applyRemote({
    games: remote.games.map((g) => ({ id: g.localId, title: g.title, spec: g.spec, createdAt: ms(g.createdAt), updatedAt: ms(g.updatedAt), revision: 1, deletedAt: g.deletedAt ? ms(g.deletedAt) : null })),
    sessions: remote.sessions.map((s) => ({ id: s.localId, gameId: s.gameId, revision: 1, status: s.status, state: s.state, startedAt: ms(s.startedAt), finishedAt: s.finishedAt ? ms(s.finishedAt) : null, updatedAt: ms(s.updatedAt) })),
    cards: remote.cards.map((c) => ({ key: c.cardKey, gameId: c.gameId, challengeId: c.challengeId, box: c.box, due: ms(c.due), added: ms(c.updatedAt), reviews: 0, updatedAt: ms(c.updatedAt), mastered: c.mastered })),
  }, state.lastPushMs);
  const seen = [...remote.games, ...remote.sessions, ...remote.cards].map((r) => r.updatedAt).sort();
  const cursor = seen.length ? seen[seen.length - 1]! : state.cursor;

  // 2) push local changes
  const changes = store.changesSince(state.lastPushMs);
  let skipped = 0;
  const batch: PushBatch = { games: [], sessions: [], cards: [], deletedGames: changes.deletedGames.map((d) => d.id) };
  const pushable = new Set<string>();
  for (const g of changes.games) {
    if (bytes(g.spec) > MAX_SPEC_BYTES) { skipped++; continue; } // too large for the cloud: stays on this phone only
    pushable.add(g.id);
    batch.games.push({ localId: g.id, title: g.title, spec: g.spec, createdAt: iso(g.createdAt) });
  }
  for (const s of changes.sessions) {
    if (bytes(s.state) > MAX_STATE_BYTES) { skipped++; continue; }
    batch.sessions.push({ localId: s.id, gameId: s.gameId, status: s.status, state: s.state, startedAt: iso(s.startedAt), finishedAt: s.finishedAt ? iso(s.finishedAt) : null });
  }
  for (const c of changes.cards) batch.cards.push({ cardKey: c.key, gameId: c.gameId, challengeId: c.challengeId, box: c.box, due: iso(c.due), mastered: c.mastered });
  // a session or card whose game was too large to push would be rejected by the server (foreign key)
  const skippedGames = new Set(changes.games.filter((g) => !pushable.has(g.id)).map((g) => g.id));
  batch.sessions = batch.sessions.filter((s) => !skippedGames.has(s.gameId));
  batch.cards = batch.cards.filter((c) => !skippedGames.has(c.gameId));

  const pushed = batch.games.length + batch.sessions.length + batch.cards.length + batch.deletedGames.length;
  if (pushed > 0) await api.push(batch);

  writeSyncState(kv, { userId, cursor, lastPushMs: startedAt, lastSyncAt: now() });
  return { pushed, pulled, skipped };
}
