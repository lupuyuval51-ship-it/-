/**
 * Optional cloud backup/sync. The device stays the source of truth for playing: every change is made locally first, and
 * `syncOnce` pushes what changed since the last successful push and merges what other phones pushed (last write wins,
 * a deleted game stays deleted). A failed round changes nothing, so the next one simply retries.
 *
 * The transport is an interface (`CloudApi`): Supabase in the app, an in-memory fake in tests (two "phones", one cloud).
 */
import type { GameSpec } from "../game/spec/schema";
import type { PlayState } from "../game/state/progress";
import type { DeckCard } from "./deck";
import { checkCardRecord, checkGameRecord, checkSessionRecord } from "./records";
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

/** The saved sync marks. Anything damaged falls back to "never synced", which is safe: the next round just moves everything again. */
export function readSyncState(kv: KV): SyncState {
  try {
    const v = JSON.parse(kv.get(KEY) ?? "{}") as Partial<Record<keyof SyncState, unknown>> | null;
    if (!v || typeof v !== "object") return { ...EMPTY };
    const finite = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x) && x >= 0;
    return {
      userId: typeof v.userId === "string" ? v.userId : null,
      cursor: typeof v.cursor === "string" && !Number.isNaN(Date.parse(v.cursor)) ? v.cursor : null,
      lastPushMs: finite(v.lastPushMs) ? v.lastPushMs : 0,
      lastSyncAt: finite(v.lastSyncAt) ? v.lastSyncAt : null,
    };
  } catch { return { ...EMPTY }; }
}
/** Best effort: if the phone is full the marks stay as they were and the next round repeats the (idempotent) work. */
function writeSyncState(kv: KV, s: SyncState): void {
  try { kv.set(KEY, JSON.stringify(s)); } catch { /* retried next round */ }
}
/** Forget what was synced (sign-out or a different account): everything is treated as new on the next sign-in. */
export const resetSyncState = (kv: KV) => kv.remove(KEY);

export interface SyncResult {
  pushed: number;
  pulled: number;
  /** Local records that were too large for the cloud and stay on this phone. */
  skipped: number;
  /** Cloud rows that failed validation (damaged, or made by a version this app cannot read) and were not taken. */
  rejected: number;
}

/** A local record stamped further ahead than this when a round starts came from a clock that was set ahead and corrected. */
export const FUTURE_TOLERANCE_MS = 120_000;

const ms = (iso: string) => Date.parse(iso);
const iso = (n: number) => new Date(n).toISOString();
const bytes = (v: unknown) => JSON.stringify(v).length;

export async function syncOnce(store: OfflineStore, kv: KV, api: CloudApi, userId: string, now: () => number = Date.now): Promise<SyncResult> {
  let state = readSyncState(kv);
  // a different account on this phone must not inherit the previous account's sync marks
  if (state.userId !== null && state.userId !== userId) state = { ...EMPTY };
  const startedAt = now();
  // The phone's clock went back since the last push (it had been set ahead and was corrected): "changed after the last push"
  // would find nothing until the clock caught up, so new progress would not be saved. Start the marks over; the pushes are idempotent.
  if (state.lastPushMs > startedAt) state = { ...state, lastPushMs: 0 };
  store.clampFutureStamps(startedAt + FUTURE_TOLERANCE_MS, startedAt);

  // 1) pull and merge (games first: sessions and cards refer to them)
  const remote = await api.pull(state.cursor);
  // Cloud rows are untrusted input like a backup file: another phone may run another version, and a row can be damaged.
  // A bad row is skipped and counted; it never reaches storage and never stops the rest.
  let rejected = 0;
  const games: Parameters<OfflineStore["applyRemote"]>[0]["games"] = [];
  for (const g of remote.games) {
    const deletedAt = g.deletedAt ? ms(g.deletedAt) : null;
    if (deletedAt !== null && Number.isNaN(deletedAt)) { rejected++; continue; }
    const row = { id: g.localId, title: g.title, spec: g.spec, createdAt: ms(g.createdAt), updatedAt: ms(g.updatedAt), revision: 1 };
    if (deletedAt !== null) {
      // a deletion carries no usable content: take it without re-validating the spec that is kept for history
      if (typeof g.localId !== "string" || Number.isNaN(row.updatedAt)) { rejected++; continue; }
      games.push({ ...row, createdAt: Number.isNaN(row.createdAt) ? 0 : row.createdAt, deletedAt });
      continue;
    }
    const checked = checkGameRecord(row);
    if (!checked.ok) { rejected++; continue; }
    games.push({ ...checked.game, deletedAt: null });
  }
  const sessions: StoredSession[] = [];
  for (const s of remote.sessions) {
    const checked = checkSessionRecord({ id: s.localId, gameId: s.gameId, revision: 1, status: s.status, state: s.state, startedAt: ms(s.startedAt), finishedAt: s.finishedAt ? ms(s.finishedAt) : null, updatedAt: ms(s.updatedAt) });
    if (checked) sessions.push(checked); else rejected++;
  }
  const cards: DeckCard[] = [];
  for (const c of remote.cards) {
    const checked = checkCardRecord({ key: c.cardKey, gameId: c.gameId, challengeId: c.challengeId, box: c.box, due: ms(c.due), added: ms(c.updatedAt), reviews: 0, updatedAt: ms(c.updatedAt), mastered: c.mastered });
    if (checked) cards.push(checked); else rejected++;
  }
  const pulled = store.applyRemote({ games, sessions, cards }, state.lastPushMs);
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
  return { pushed, pulled, skipped, rejected };
}
