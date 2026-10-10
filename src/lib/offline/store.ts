/**
 * The offline app's "server": games and play sessions stored on the device, driven by the same pure reducer the
 * server uses (`processEvent`). There is no account and no network. Answer keys live on the device, so this mode
 * is for practising, not for anything that must be cheat-proof.
 */
import type { GameSpec } from "../game/spec/schema";
import { toPublicSpec, type PublicSpec } from "../game/spec/public";
import { GameEventError, gameEventSchema, processEvent } from "../game/state/events";
import { PracticeNotFound, practiceBodySchema, respondPractice } from "../game/state/practice";
import { initialState, maxScore, recompute, summarize, toClientState, type ClientState, type LearningSummary, type PlayState } from "../game/state/progress";
import { buildReview, type ReviewItem } from "../game/state/review";
import { MAX_ATTEMPTS_PER_CHALLENGE } from "@/config/limits";
import { gradeAnswer, revealSolution, toPublicChallenge } from "../game/challenges/grade";
import { findChallenge } from "../game/state/progress";
import { deckBodySchema, dueCards, newCard, review, type DeckCard } from "./deck";

export interface KV {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export const memoryKV = (): KV => {
  const m = new Map<string, string>();
  return { get: (k) => m.get(k) ?? null, set: (k, v) => void m.set(k, v), remove: (k) => void m.delete(k) };
};

export const browserKV = (): KV => ({
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, v),
  remove: (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
});

export interface StoredGame {
  id: string;
  title: string;
  createdAt: number;
  /** Last change (ms): drives cloud sync. */
  updatedAt: number;
  revision: number;
  spec: GameSpec;
}

export interface StoredSession {
  id: string;
  gameId: string;
  revision: number;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  state: PlayState;
  startedAt: number;
  finishedAt: number | null;
  /** Last change (ms): drives cloud sync. */
  updatedAt: number;
}

export interface GameSummaryRow {
  id: string;
  title: string;
  subject: string;
  createdAt: number;
  generatorKind: string;
  environment: string;
  bestScore: number;
  bestStars: number;
  maxScore: number;
  inProgress: boolean;
  /** Share of missions finished in the unfinished run (0–100). */
  percent: number;
  lastSessionId: string | null;
}

export class OfflineError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

const PREFIX = "levelup.offline.";
const STATE_ERRORS = new Set(["WRONG_AREA", "STATION_LOCKED", "PORTAL_LOCKED", "ALREADY_RESOLVED", "ALREADY_COLLECTED", "NOT_OPENED", "NOT_COMPLETE", "NO_PORTAL"]);

const randomId = (): string => {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID().replace(/-/g, "").slice(0, 20);
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
};

function activePercent(spec: GameSpec, sessions: StoredSession[]): number {
  const active = sessions.find((s) => s.status === "ACTIVE");
  if (!active || spec.missions.length === 0) return 0;
  return Math.round((active.state.missionsDone.length / spec.missions.length) * 100);
}

export class OfflineStore {
  private listeners = new Set<() => void>();
  /** True while merging cloud rows: those writes are not user changes and must not trigger another sync. */
  private muted = false;
  constructor(private kv: KV, private clock: () => number = Date.now) {}

  /** Called after every change made through the store (cloud sync debounces on it). */
  subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private read<T>(key: string, fallback: T): T {
    const raw = this.kv.get(PREFIX + key);
    if (!raw) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  }
  private write(key: string, value: unknown): void {
    this.kv.set(PREFIX + key, JSON.stringify(value));
    if (!this.muted) this.listeners.forEach((l) => l());
  }

  // ───────── games ─────────
  private gameIds(): string[] { return this.read<string[]>("games", []); }
  private sessionIds(gameId: string): string[] { return this.read<string[]>(`sessions.${gameId}`, []); }

  addGame(spec: GameSpec): StoredGame {
    const now = this.clock();
    const game: StoredGame = { id: randomId(), title: spec.meta.title, createdAt: now, updatedAt: now, revision: 1, spec };
    this.write(`game.${game.id}`, game);
    this.write("games", [game.id, ...this.gameIds()]);
    return game;
  }

  getGame(id: string): StoredGame | null { return this.read<StoredGame | null>(`game.${id}`, null); }

  deleteGame(id: string): void {
    this.removeGameLocally(id);
    // remember the deletion so sync removes the game from the cloud and other phones
    this.write("tombstones", { ...this.read<Record<string, number>>("tombstones", {}), [id]: this.clock() });
  }

  listGames(): GameSummaryRow[] {
    return this.gameIds().flatMap((id) => {
      const g = this.getGame(id);
      if (!g) return [];
      const sessions = this.sessionIds(id).map((s) => this.getSession(s)).filter((s): s is StoredSession => Boolean(s));
      const done = sessions.filter((s) => s.status === "COMPLETED");
      const best = done.map((s) => summarize(g.spec, s.state, s.finishedAt ?? this.clock()));
      return [{
        id, title: g.title, subject: g.spec.meta.subject, createdAt: g.createdAt, generatorKind: g.spec.meta.generator?.kind ?? "demo",
        environment: g.spec.theme.environment, maxScore: maxScore(g.spec),
        bestScore: Math.max(0, ...best.map((b) => b.score)), bestStars: Math.max(0, ...best.map((b) => b.stars)),
        inProgress: sessions.some((s) => s.status === "ACTIVE"), percent: activePercent(g.spec, sessions), lastSessionId: sessions[0]?.id ?? null,
      }];
    });
  }

  // ───────── sessions ─────────
  getSession(id: string): StoredSession | null { return this.read<StoredSession | null>(`session.${id}`, null); }
  private saveSession(s: StoredSession): void { s.updatedAt = this.clock(); this.write(`session.${s.id}`, s); }

  startSession(gameId: string, restart: boolean): { session: StoredSession; spec: PublicSpec; client: ClientState; maxScore: number; resumed: boolean; game: StoredGame } {
    const game = this.getGame(gameId);
    if (!game) throw new OfflineError(404, "NOT_FOUND", "Game not found.");
    const now = this.clock();
    const actives = this.sessionIds(gameId).map((s) => this.getSession(s)).filter((s): s is StoredSession => s?.status === "ACTIVE");
    const active = actives[0] ?? null;
    // two phones can each have an unfinished run after a sync: keep the newest, close the others
    for (const extra of actives.slice(1)) this.saveSession({ ...extra, status: "ABANDONED", finishedAt: now });
    let session: StoredSession | null = null;
    let resumed = false;
    if (active && restart) this.saveSession({ ...active, status: "ABANDONED", finishedAt: now });
    else if (active) {
      if (active.state.finished) this.saveSession({ ...active, status: "COMPLETED", finishedAt: active.finishedAt ?? now });
      else {
        if (active.revision !== game.revision) { recompute(game.spec, active.state); active.revision = game.revision; }
        session = active;
        resumed = true;
      }
    }
    if (!session) {
      session = { id: randomId(), gameId, revision: game.revision, status: "ACTIVE", state: initialState(game.spec, now), startedAt: now, finishedAt: null, updatedAt: now };
      this.write(`sessions.${gameId}`, [session.id, ...this.sessionIds(gameId)]);
    }
    this.saveSession(session);
    return { session, spec: toPublicSpec(game.spec), client: toClientState(session.state), maxScore: maxScore(game.spec), resumed, game };
  }

  applyEvent(sessionId: string, input: unknown) {
    const session = this.getSession(sessionId);
    if (!session) throw new OfflineError(404, "NOT_FOUND", "Play session not found.");
    const game = this.getGame(session.gameId);
    if (!game) throw new OfflineError(404, "NOT_FOUND", "Game not found.");
    const parsed = gameEventSchema.safeParse(input);
    if (!parsed.success) throw new OfflineError(400, "VALIDATION_ERROR", "The request is invalid.");
    const event = parsed.data;
    const now = this.clock();
    if (session.status === "COMPLETED") {
      if (event.type === "finish") return { data: {}, state: toClientState(session.state), newlyCompletedMissions: [], newAchievements: [], completed: true, summary: summarize(game.spec, session.state, session.finishedAt ?? now) };
      throw new OfflineError(409, "SESSION_COMPLETED", "This game session is already finished.");
    }
    if (session.status !== "ACTIVE") throw new OfflineError(409, "SESSION_ENDED", "This game session has ended. Start a new one.");
    let result;
    try {
      result = processEvent(game.spec, session.state, event, { now, seed: session.id });
    } catch (err) {
      if (err instanceof GameEventError) throw new OfflineError(STATE_ERRORS.has(err.code) ? 409 : 400, err.code, err.message);
      throw err;
    }
    const next = result.state;
    let summary: LearningSummary | undefined;
    const updated: StoredSession = { ...session, state: next };
    if (next.finished) {
      summary = summarize(game.spec, next, now);
      updated.status = "COMPLETED";
      updated.finishedAt = now;
    }
    this.saveSession(updated);
    return { data: result.data, state: result.client, newlyCompletedMissions: result.newlyCompletedMissions, newAchievements: result.newAchievements, completed: next.finished, summary };
  }

  results(sessionId: string): { game: StoredGame; session: StoredSession; summary: LearningSummary; review: ReviewItem[] } | null {
    const session = this.getSession(sessionId);
    const game = session ? this.getGame(session.gameId) : null;
    if (!session || !game) return null;
    return { game, session, summary: summarize(game.spec, session.state, session.finishedAt ?? this.clock()), review: buildReview(game.spec, session.state) };
  }

  practice(sessionId: string, body: unknown) {
    const r = this.results(sessionId);
    if (!r) throw new OfflineError(404, "NOT_FOUND", "Session not found.");
    const parsed = practiceBodySchema.safeParse(body);
    if (!parsed.success) throw new OfflineError(400, "VALIDATION_ERROR", "The request is invalid.");
    try {
      return respondPractice(r.game.spec, r.session.state, sessionId, parsed.data);
    } catch (e) {
      if (e instanceof PracticeNotFound) throw new OfflineError(404, "NOT_FOUND", e.message);
      throw e;
    }
  }

  // ───────── "review my mistakes" deck (spaced repetition across all games) ─────────
  private deck(): Record<string, DeckCard> { return this.read<Record<string, DeckCard>>("deck", {}); }
  private saveDeck(d: Record<string, DeckCard>): void { this.write("deck", d); }

  /** Adds every question missed (resolved with a wrong answer or revealed) in any session; drops cards of deleted games. */
  syncDeck(): Record<string, DeckCard> {
    const deck = this.deck();
    const now = this.clock();
    const games = new Set(this.gameIds());
    let changed = false;
    for (const k of Object.keys(deck)) if (!games.has(deck[k]!.gameId)) { delete deck[k]; changed = true; }
    for (const gameId of games) {
      for (const sid of this.sessionIds(gameId)) {
        const s = this.getSession(sid);
        if (!s) continue;
        for (const [challengeId, r] of Object.entries(s.state.records)) {
          if (!r.resolved || (r.wrong === 0 && !r.revealed)) continue;
          const card = newCard(gameId, challengeId, now);
          if (!deck[card.key]) { deck[card.key] = card; changed = true; }
        }
      }
    }
    if (changed) this.saveDeck(deck);
    return deck;
  }

  deckSummary(): { total: number; due: number; nextDue: number | null } {
    const cards = Object.values(this.syncDeck()).filter((c) => !c.mastered);
    const now = this.clock();
    const future = cards.filter((c) => c.due > now).map((c) => c.due);
    return { total: cards.length, due: cards.filter((c) => c.due <= now).length, nextDue: future.length ? Math.min(...future) : null };
  }

  deckPractice(body: unknown) {
    const parsed = deckBodySchema.safeParse(body);
    if (!parsed.success) throw new OfflineError(400, "VALIDATION_ERROR", "The request is invalid.");
    const b = parsed.data;
    const now = this.clock();
    if (b.action === "start") {
      const items = dueCards(Object.values(this.syncDeck()), now).flatMap((card) => {
        const ch = this.getGame(card.gameId) && findChallenge(this.getGame(card.gameId)!.spec, card.challengeId);
        return ch ? [{ ...toPublicChallenge(ch, `deck:${card.key}:${card.reviews}`), id: card.key }] : [];
      });
      return { items };
    }
    const deck = this.deck();
    const card = deck[b.challengeId];
    const game = card ? this.getGame(card.gameId) : null;
    const ch = game ? findChallenge(game.spec, card!.challengeId) : undefined;
    if (!card || !game || !ch) throw new OfflineError(404, "NOT_FOUND", "That question is not in your review deck.");
    if (b.action === "hint") return { hint: ch.hint ?? null };
    const graded = gradeAnswer(ch, b.answer, game.spec.meta.language);
    const resolved = graded.correct || b.attempt >= MAX_ATTEMPTS_PER_CHALLENGE;
    const revealed = !graded.correct && resolved;
    if (resolved) {
      const next = review(card, graded.correct && b.attempt === 1, now);
      deck[card.key] = next ?? { ...card, mastered: true, updatedAt: now };
      this.saveDeck(deck);
    }
    return {
      result: {
        correct: graded.correct, feedback: graded.feedback, detail: graded.detail, resolved, revealed, pointsAwarded: 0,
        attemptsLeft: Math.max(0, MAX_ATTEMPTS_PER_CHALLENGE - b.attempt),
        explanation: resolved ? ch.explanation : undefined,
        reveal: revealed ? revealSolution(ch) : undefined,
      },
    };
  }

  // ───────── cloud sync surface (see sync.ts) ─────────

  /** Everything changed on this device after `since` (ms), plus deletions, for pushing. */
  changesSince(since: number): { games: StoredGame[]; sessions: StoredSession[]; cards: DeckCard[]; deletedGames: { id: string; at: number }[] } {
    const games: StoredGame[] = [];
    const sessions: StoredSession[] = [];
    for (const id of this.gameIds()) {
      const g = this.getGame(id);
      if (!g) continue;
      if ((g.updatedAt ?? g.createdAt) > since) games.push(g);
      for (const sid of this.sessionIds(id)) {
        const s = this.getSession(sid);
        if (s && (s.updatedAt ?? s.startedAt) > since) sessions.push(s);
      }
    }
    const cards = Object.values(this.deck()).filter((c) => (c.updatedAt ?? c.added) > since);
    const tomb = this.read<Record<string, number>>("tombstones", {});
    const deletedGames = Object.entries(tomb).filter(([, at]) => at > since).map(([id, at]) => ({ id, at }));
    return { games, sessions, cards, deletedGames };
  }

  /**
   * Merge rows pulled from the cloud. A local record that changed after the last successful push and is at least as new as
   * the remote one wins (it is pushed next); otherwise the remote record replaces it. A game deleted on either side stays deleted.
   */
  applyRemote(rows: { games: (StoredGame & { deletedAt: number | null })[]; sessions: StoredSession[]; cards: DeckCard[] }, lastPushMs: number): number {
    this.muted = true;
    try {
      return this.mergeRemote(rows, lastPushMs);
    } finally {
      this.muted = false;
    }
  }

  private mergeRemote(rows: { games: (StoredGame & { deletedAt: number | null })[]; sessions: StoredSession[]; cards: DeckCard[] }, lastPushMs: number): number {
    let applied = 0;
    const tomb = this.read<Record<string, number>>("tombstones", {});
    const dirtyAndNewer = (local: number | undefined, remote: number) => local !== undefined && local > lastPushMs && local >= remote;
    // Server timestamps must never make a pulled record look like a local change (the phone and server clocks differ):
    // a record taken from the cloud is stored as "clean", i.e. not newer than the last push.
    const clean = (remote: number) => Math.min(remote, lastPushMs);

    for (const r of rows.games) {
      if (tomb[r.id] !== undefined) continue; // deleted here: the push removes it remotely
      const local = this.getGame(r.id);
      if (r.deletedAt !== null) {
        if (local) { this.removeGameLocally(r.id); applied++; }
        continue;
      }
      if (local && dirtyAndNewer(local.updatedAt ?? local.createdAt, r.updatedAt)) continue;
      const { deletedAt: _d, ...game } = r;
      void _d;
      game.updatedAt = clean(r.updatedAt);
      this.write(`game.${game.id}`, game);
      if (!local) this.write("games", [game.id, ...this.gameIds()]);
      applied++;
    }

    for (const r of rows.sessions) {
      if (!this.getGame(r.gameId) || tomb[r.gameId] !== undefined) continue;
      const local = this.getSession(r.id);
      if (local && dirtyAndNewer(local.updatedAt ?? local.startedAt, r.updatedAt)) continue;
      this.write(`session.${r.id}`, { ...r, updatedAt: clean(r.updatedAt) });
      if (!local) {
        const ids = [...this.sessionIds(r.gameId), r.id];
        const started = (id: string) => (id === r.id ? r.startedAt : this.getSession(id)?.startedAt ?? 0);
        this.write(`sessions.${r.gameId}`, ids.sort((a, b) => started(b) - started(a)));
      }
      applied++;
    }

    if (rows.cards.length > 0) {
      const deck = this.deck();
      for (const r of rows.cards) {
        if (!this.getGame(r.gameId) || tomb[r.gameId] !== undefined) continue;
        const local = deck[r.key];
        if (local && dirtyAndNewer(local.updatedAt ?? local.added, r.updatedAt)) continue;
        deck[r.key] = { ...r, updatedAt: clean(r.updatedAt) };
        applied++;
      }
      this.saveDeck(deck);
    }
    return applied;
  }

  private removeGameLocally(id: string): void {
    for (const s of this.sessionIds(id)) this.kv.remove(PREFIX + `session.${s}`);
    this.kv.remove(PREFIX + `sessions.${id}`);
    this.kv.remove(PREFIX + `game.${id}`);
    this.write("games", this.gameIds().filter((g) => g !== id));
  }
}
