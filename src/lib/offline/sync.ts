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
import { checkCardRecord, checkGameRecord, checkSessionRecord, cloudTitle } from "./records";
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
  /**
   * Upserts the batch. Resolves with how many rows the server refused for what is in them (a record that breaks a table rule is
   * left out so it cannot block everything else); rejects when the round should be retried (offline, signed out, a missing game).
   */
  push(batch: PushBatch): Promise<void | { refused: number }>;
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
/** A timestamp the cloud can store. A number that is not a valid date (damaged data) becomes the epoch rather than ending the round with an error. */
const iso = (n: number) => new Date(Number.isFinite(n) && Math.abs(n) <= 8.64e15 ? n : 0).toISOString();
const encoder = new TextEncoder();
/** Size as the cloud counts it: bytes of the JSON (Hebrew takes two per letter), not characters. */
const bytes = (v: unknown) => encoder.encode(JSON.stringify(v)).length;

const size = (b: PushBatch) => b.games.length + b.sessions.length + b.cards.length + b.deletedGames.length;

/**
 * What to send for a set of local changes. A game too large for the cloud stays on this phone, and so do its runs and cards
 * (the server would reject them: they refer to a game it does not have), including runs changed in later rounds.
 */
function buildBatch(store: OfflineStore, changes: ReturnType<OfflineStore["changesSince"]>): { batch: PushBatch; skipped: number } {
  let skipped = 0;
  const batch: PushBatch = { games: [], sessions: [], cards: [], deletedGames: changes.deletedGames.map((d) => d.id) };
  const fits = new Map<string, boolean>();
  for (const g of changes.games) {
    const ok = bytes(g.spec) <= MAX_SPEC_BYTES;
    fits.set(g.id, ok);
    if (!ok) { skipped++; continue; }
    batch.games.push({ localId: g.id, title: cloudTitle(g.title, g.spec), spec: g.spec, createdAt: iso(g.createdAt) });
  }
  const gameFits = (id: string): boolean => {
    if (!fits.has(id)) { const g = store.getGame(id); fits.set(id, g !== null && bytes(g.spec) <= MAX_SPEC_BYTES); }
    return fits.get(id)!;
  };
  for (const s of changes.sessions) {
    if (bytes(s.state) > MAX_STATE_BYTES || !gameFits(s.gameId)) { skipped++; continue; }
    batch.sessions.push({ localId: s.id, gameId: s.gameId, status: s.status, state: s.state, startedAt: iso(s.startedAt), finishedAt: s.finishedAt ? iso(s.finishedAt) : null });
  }
  for (const c of changes.cards) {
    if (!gameFits(c.gameId)) continue;
    batch.cards.push({ cardKey: c.key, gameId: c.gameId, challengeId: c.challengeId, box: c.box, due: iso(c.due), mastered: c.mastered });
  }
  return { batch, skipped };
}

export async function syncOnce(store: OfflineStore, kv: KV, api: CloudApi, userId: string, now: () => number = Date.now): Promise<SyncResult> {
  let state = readSyncState(kv);
  // a different account on this phone must not inherit the previous account's sync marks
  if (state.userId !== null && state.userId !== userId) state = { ...EMPTY };
  const startedAt = now();
  // The phone's clock went back since the last push (it had been set ahead and was corrected): "changed after the last push"
  // would find nothing until the clock caught up, so new progress would not be saved. Start the marks over; the pushes are idempotent.
  if (state.lastPushMs > startedAt) {
    state = { ...state, lastPushMs: 0 };
    writeSyncState(kv, state); // so new changes are not stamped after the old, too-late mark while this round runs
  }
  // Changes made from now on are stamped after this moment, whatever the clock does (see OfflineStore.changeStamp).
  store.setClockFloor(startedAt);
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
    // validating a spec is real work (a new phone may pull dozens): let the screen repaint between games
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
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
  let { batch, skipped } = buildBatch(store, store.changesSince(state.lastPushMs));
  let pushed = size(batch);
  if (pushed > 0) {
    try {
      skipped += (await api.push(batch))?.refused ?? 0;
    } catch (e) {
      // A run or card refers to a game the cloud does not have: that game's own change was missed somewhere along the way.
      // Send everything once; the pushes are idempotent, and from then on the cloud has what the runs refer to.
      if (!/foreign key/i.test(e instanceof Error ? e.message : String(e))) throw e;
      ({ batch, skipped } = buildBatch(store, store.changesSince(0)));
      pushed = size(batch);
      skipped += (await api.push(batch))?.refused ?? 0;
    }
  }

  writeSyncState(kv, { userId, cursor, lastPushMs: startedAt, lastSyncAt: now() });
  return { pushed, pulled, skipped, rejected };
}
