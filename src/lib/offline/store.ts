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
import { findArea, findChallenge } from "../game/state/progress";
import { deckBodySchema, dueCards, newCard, review, type DeckCard } from "./deck";
import { normalizeCard, normalizeGame, normalizeSession } from "./records";

export interface KV {
  get(key: string): string | null;
  /** Throws when the device cannot store it (quota exceeded, storage blocked). The store turns that into an `OfflineError`. */
  set(key: string, value: string): void;
  remove(key: string): void;
  /** Every key, when the backend can list them. Used to repair the indexes after a crash or a damaged index. */
  keys?(): string[];
}

export const memoryKV = (): KV => {
  const m = new Map<string, string>();
  return { get: (k) => m.get(k) ?? null, set: (k, v) => void m.set(k, v), remove: (k) => void m.delete(k), keys: () => [...m.keys()] };
};

export const browserKV = (): KV => ({
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, v),
  remove: (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
  keys: () => {
    try { return Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).filter((k): k is string => k !== null); } catch { return []; }
  },
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
  /** When the learner last moved in any run of this game (phone clock, ms), or null if it was never started. */
  lastPlayedAt: number | null;
  /** The game's level as stored in its spec, so a screen that lists games need not read every spec again for it. */
  difficulty?: string;
  /** The topic (or template) the game was built from, from its spec (`meta.generator.templateId`). */
  templateId?: string;
}

export interface ImportCounts {
  gamesAdded: number;
  gamesUpdated: number;
  gamesKept: number;
  sessionsImported: number;
  sessionsKept: number;
  cardsImported: number;
  cardsKept: number;
}

export class OfflineError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

/** Storage failures the UI can explain: the phone is full, or the browser blocks storage (private mode, policy). */
export const STORAGE_ERROR_CODES = ["STORAGE_FULL", "STORAGE_UNAVAILABLE"] as const;
export type StorageErrorCode = (typeof STORAGE_ERROR_CODES)[number];
export const isStorageError = (e: unknown): e is OfflineError => e instanceof OfflineError && (STORAGE_ERROR_CODES as readonly string[]).includes(e.code);
/**
 * The storage failure code of an error, or null. Works for an `OfflineError` and for the `ApiFailure` the offline transport turns it into
 * (which keeps the code), so a screen can show "no room left" whichever way the error reached it.
 */
export function storageErrorCode(e: unknown): StorageErrorCode | null {
  const code = (e as { code?: unknown } | null)?.code;
  return (STORAGE_ERROR_CODES as readonly unknown[]).includes(code) ? (code as StorageErrorCode) : null;
}

const isQuotaError = (e: unknown): boolean => {
  const x = e as { name?: unknown; code?: unknown } | null;
  return !!x && (x.name === "QuotaExceededError" || x.name === "NS_ERROR_DOM_QUOTA_REACHED" || x.code === 22 || x.code === 1014);
};
export const toStorageError = (e: unknown): OfflineError =>
  isQuotaError(e)
    ? new OfflineError(507, "STORAGE_FULL", "This phone has no room left to save. Delete a game you no longer need and try again.")
    : new OfflineError(503, "STORAGE_UNAVAILABLE", "This browser blocks saving on the device, so nothing can be stored.");

/**
 * Anything other than a typed error while playing a stored game means its saved data is broken in a way the light checks on read
 * do not see (a nested part is missing). That is reported as a typed error for that one game instead of an unexplained crash.
 */
const damaged = (e: unknown): OfflineError =>
  e instanceof OfflineError ? e : new OfflineError(500, "GAME_DAMAGED", "This game's saved data is damaged and cannot be played. It can be deleted from Settings.");

/** Can the game be opened at all? (the structure play starts from; the spec was validated when it was stored) */
function gameUsable(g: StoredGame): boolean {
  try { initialState(g.spec, 0); maxScore(g.spec); toPublicSpec(g.spec); return true; } catch { return false; }
}

/** localStorage holds about 5 million characters in a WebView; the app warns well before that. */
export const STORAGE_LIMIT_CHARS = 5_000_000;

export interface Integrity {
  games: number;
  /** Games listed on the device whose data cannot be read any more (kept in storage, hidden from the library). */
  damagedGames: string[];
  damagedSessions: string[];
}

const PREFIX = "levelup.offline.";
/** Abandoned (restarted) runs kept per game; older ones are removed when a new run starts. */
export const MAX_ABANDONED_RUNS_PER_GAME = 10;
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

/** The shuffle/opaque-id seed of one review card: it changes with every review, so the same question looks different each time. */
const deckSeed = (card: { key: string; reviews: number }): string => `deck:${card.key}:${card.reviews}`;

export class OfflineStore {
  private listeners = new Set<() => void>();
  /** True while merging cloud rows: those writes are not user changes and must not trigger another sync. */
  private muted = false;
  constructor(private kv: KV, private clock: () => number = Date.now) {}

  /** Games a cloud merge has just added to this phone (see `takeAddedGames`). */
  private addedByMerge: string[] = [];
  /**
   * The games that the last merge(s) added here. The runs and review cards of such a game may exist in the cloud although they are
   * older than the sync cursor (a game that was deleted here and restored on another phone has lost them locally), so sync asks
   * the cloud for them by game. Returns each id once and forgets it.
   */
  takeAddedGames(): string[] {
    const ids = [...new Set(this.addedByMerge)];
    this.addedByMerge = [];
    return ids;
  }

  /** Lower bound for change stamps, set by cloud sync at the start of a round (see `changeStamp`). */
  private floor = 0;
  setClockFloor(ms: number): void { this.floor = ms; }

  /**
   * The time recorded as "changed now" on a game, run, card or deletion. It is the phone's clock, but never at or before the last
   * completed push to the cloud. Cloud sync sends what changed after that mark, so if the clock had gone backwards (the learner
   * changed the time, or the network corrected it) a change stamped by the raw clock would look older than the last push: it would
   * never be sent, and the next pull would treat it as unchanged and overwrite it.
   */
  private changeStamp(): number {
    const raw = this.clock();
    const pushed = this.read<{ lastPushMs?: unknown }>("sync", {}).lastPushMs;
    const floor = Math.max(this.floor, typeof pushed === "number" && Number.isFinite(pushed) ? pushed : 0);
    return raw > floor ? raw : floor + 1;
  }

  /** Called after every change made through the store (cloud sync debounces on it). */
  subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** One stored value. A missing or unparsable value gives the fallback: damage to one key never reaches the others. */
  private read<T>(key: string, fallback: T): T {
    const raw = this.kv.get(PREFIX + key);
    if (!raw) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  }
  /** Writes without notifying (for steps of a larger change). Throws an `OfflineError` (STORAGE_FULL / STORAGE_UNAVAILABLE) when the device cannot store it. */
  private put(key: string, value: unknown): void {
    const text = JSON.stringify(value);
    try { this.kv.set(PREFIX + key, text); } catch (e) { throw toStorageError(e); }
  }
  private changed(): void { if (!this.muted) this.listeners.forEach((l) => l()); }
  private write(key: string, value: unknown): void {
    this.put(key, value);
    this.changed();
  }

  // ───────── games ─────────
  private idList(key: string): string[] {
    const v = this.read<unknown>(key, []);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  }
  private gameIds(): string[] { return this.idList("games"); }
  private sessionIds(gameId: string): string[] { return this.idList(`sessions.${gameId}`); }
  private tombstones(): Record<string, number> {
    const v = this.read<unknown>("tombstones", {});
    const out: Record<string, number> = {};
    if (v && typeof v === "object" && !Array.isArray(v)) for (const [k, at] of Object.entries(v)) if (typeof at === "number" && Number.isFinite(at) && k !== "__proto__") out[k] = at;
    return out;
  }

  /** Stores a game record and lists it. If the list cannot be written the record is removed again, so nothing is left unlisted. */
  private putGame(game: StoredGame, isNew: boolean): void {
    this.put(`game.${game.id}`, game);
    if (isNew) {
      try { this.put("games", [game.id, ...this.gameIds().filter((x) => x !== game.id)]); } catch (e) { this.kv.remove(PREFIX + `game.${game.id}`); throw e; }
    }
    this.changed();
  }
  /** Same for a session: the record first, then the per-game list. */
  private putSession(s: StoredSession, isNew: boolean): void {
    this.put(`session.${s.id}`, s);
    if (isNew) {
      const ids = [s.id, ...this.sessionIds(s.gameId).filter((x) => x !== s.id)]; // newest first; on equal start times the new one leads
      const started = (id: string) => (id === s.id ? s.startedAt : this.getSession(id)?.startedAt ?? 0);
      try { this.put(`sessions.${s.gameId}`, ids.sort((a, b) => started(b) - started(a))); } catch (e) { this.kv.remove(PREFIX + `session.${s.id}`); throw e; }
    }
    this.changed();
  }

  addGame(spec: GameSpec): StoredGame {
    const game: StoredGame = { id: randomId(), title: spec.meta.title, createdAt: this.clock(), updatedAt: this.changeStamp(), revision: 1, spec };
    this.putGame(game, true);
    return game;
  }

  getGame(id: string): StoredGame | null { return normalizeGame(this.read<unknown>(`game.${id}`, null)); }

  deleteGame(id: string): void {
    // Remember the deletion first, so an interruption can never leave a game that is gone here but still in the cloud (it would come
    // back on the next phone). If the phone is too full even for that, the game is removed first: that frees the space it needs.
    const tomb = { ...this.tombstones(), [id]: this.changeStamp() };
    let recorded = true;
    try { this.put("tombstones", tomb); } catch (e) { if (!isStorageError(e)) throw e; recorded = false; }
    this.removeGameLocally(id);
    if (!recorded) this.write("tombstones", tomb);
  }

  /**
   * Deletes every game on the device, including ones whose data is damaged (those are not in `listGames()`, so deleting the
   * listed games one by one would leave them behind), their runs, and the review deck. Returns how many games were removed.
   */
  deleteAll(): number {
    const ids = new Set(this.gameIds());
    const keys = this.kv.keys?.() ?? [];
    const gPrefix = PREFIX + "game.";
    for (const k of keys) if (k.startsWith(gPrefix)) ids.add(k.slice(gPrefix.length));
    const at = this.changeStamp();
    const tomb = this.tombstones();
    for (const id of ids) tomb[id] = at;
    let recorded = true;
    try { this.put("tombstones", tomb); } catch (e) { if (!isStorageError(e)) throw e; recorded = false; }
    for (const id of ids) this.removeGameKeys(id);
    for (const k of keys) if (k.startsWith(PREFIX + "session.") || k.startsWith(PREFIX + "sessions.")) this.kv.remove(k); // runs of unlisted games
    this.put("games", []);
    this.put("deck", {});
    if (!recorded) this.put("tombstones", tomb);
    this.changed();
    return ids.size;
  }

  listGames(): GameSummaryRow[] {
    return this.gameIds().flatMap((id) => {
      const row = this.gameSummary(id);
      return row ? [row] : [];
    });
  }

  /** The library row of one game (null when it is missing or damaged): a screen that needs one game's best score need not read them all. */
  gameSummary(id: string): GameSummaryRow | null {
    try {
      const g = this.getGame(id);
      if (!g) return null;
      const sessions = this.sessionIds(id).map((s) => this.getSession(s)).filter((s): s is StoredSession => Boolean(s));
      const done = sessions.filter((s) => s.status === "COMPLETED");
      // a run that cannot be summarised (damaged) only loses its stars; the game itself stays in the library
      const best = done.flatMap((s) => { try { return [summarize(g.spec, s.state, s.finishedAt ?? this.clock())]; } catch { return []; } });
      const templateId = g.spec.meta.generator?.templateId;
      return {
        id, title: g.title, subject: g.spec.meta.subject, createdAt: g.createdAt, generatorKind: g.spec.meta.generator?.kind ?? "demo",
        environment: g.spec.theme.environment, maxScore: maxScore(g.spec),
        bestScore: Math.max(0, ...best.map((b) => b.score)), bestStars: Math.max(0, ...best.map((b) => b.stars)),
        inProgress: sessions.some((s) => s.status === "ACTIVE"), percent: activePercent(g.spec, sessions), lastSessionId: sessions[0]?.id ?? null,
        lastPlayedAt: sessions.length ? Math.max(...sessions.map((s) => Math.max(s.state.updatedAt, s.finishedAt ?? 0, s.startedAt))) : null,
        difficulty: g.spec.meta.difficulty, ...(templateId ? { templateId } : {}),
      };
    } catch {
      return null; // one damaged game must not take the whole library down
    }
  }

  // ───────── sessions ─────────
  getSession(id: string): StoredSession | null { return normalizeSession(this.read<unknown>(`session.${id}`, null)); }
  private saveSession(s: StoredSession): void { s.updatedAt = this.changeStamp(); this.write(`session.${s.id}`, s); }

  startSession(gameId: string, restart: boolean): { session: StoredSession; spec: PublicSpec; client: ClientState; maxScore: number; resumed: boolean; game: StoredGame } {
    try { return this.runSession(gameId, restart); } catch (e) { throw damaged(e); }
  }

  private runSession(gameId: string, restart: boolean): { session: StoredSession; spec: PublicSpec; client: ClientState; maxScore: number; resumed: boolean; game: StoredGame } {
    const game = this.getGame(gameId);
    if (!game) throw new OfflineError(404, "NOT_FOUND", "Game not found.");
    // what the game screen needs, built first: a game that cannot give it must fail before any run is closed or created
    const publicSpec = toPublicSpec(game.spec);
    const maxPoints = maxScore(game.spec);
    const now = this.clock();
    const actives = this.sessionIds(gameId).map((s) => this.getSession(s)).filter((s): s is StoredSession => s?.status === "ACTIVE");
    // a run that points at an area the game does not have (damaged, or from a game that was replaced) cannot be resumed
    for (const broken of actives.filter((a) => !findArea(game.spec, a.state.areaId))) this.saveSession({ ...broken, status: "ABANDONED", finishedAt: now });
    const active = actives.find((a) => findArea(game.spec, a.state.areaId)) ?? null;
    // two phones can each have an unfinished run after a sync: keep the newest, close the others
    for (const extra of actives.filter((a) => a !== active && findArea(game.spec, a.state.areaId))) this.saveSession({ ...extra, status: "ABANDONED", finishedAt: now });
    let session: StoredSession | null = null;
    let resumed = false;
    if (active && restart) this.saveSession({ ...active, status: "ABANDONED", finishedAt: now });
    else if (active) {
      if (active.state.finished) this.saveSession({ ...active, status: "COMPLETED", finishedAt: active.finishedAt ?? now });
      else {
        let ok = true;
        if (active.revision !== game.revision) {
          try { recompute(game.spec, active.state); active.revision = game.revision; } catch { ok = false; } // damaged run: start a new one
        }
        if (ok) { session = active; resumed = true; } else this.saveSession({ ...active, status: "ABANDONED", finishedAt: now });
      }
    }
    if (session) {
      this.saveSession(session);
    } else {
      session = { id: randomId(), gameId, revision: game.revision, status: "ACTIVE", state: initialState(game.spec, now), startedAt: now, finishedAt: null, updatedAt: now };
      session.updatedAt = this.changeStamp();
      this.putSession(session, true);
      this.pruneAbandoned(gameId);
    }
    return { session, spec: publicSpec, client: toClientState(session.state), maxScore: maxPoints, resumed, game };
  }

  /**
   * Every restart leaves an abandoned run behind. They are worth nothing but space (the phone's storage is small), so only the
   * newest few are kept. Unfinished and finished runs are never touched, and the review deck is brought up to date first so no
   * missed question is lost with a run. Best effort: if anything fails, nothing is removed.
   */
  private pruneAbandoned(gameId: string): void {
    try {
      const ids = this.sessionIds(gameId);
      let abandoned = 0;
      const keep: string[] = [];
      const drop: string[] = [];
      for (const id of ids) { // newest first
        const s = this.getSession(id);
        if (s?.status === "ABANDONED" && ++abandoned > MAX_ABANDONED_RUNS_PER_GAME) drop.push(id); else keep.push(id);
      }
      if (drop.length === 0) return;
      this.syncDeck();
      this.put(`sessions.${gameId}`, keep);
      for (const id of drop) this.kv.remove(PREFIX + `session.${id}`);
    } catch { /* pruning is housekeeping; it never blocks starting a game */ }
  }

  applyEvent(sessionId: string, input: unknown) {
    try { return this.runEvent(sessionId, input); } catch (e) { throw damaged(e); }
  }

  private runEvent(sessionId: string, input: unknown) {
    const session = this.getSession(sessionId);
    if (!session) throw new OfflineError(404, "NOT_FOUND", "Play session not found.");
    const game = this.getGame(session.gameId);
    if (!game) throw new OfflineError(404, "NOT_FOUND", "Game not found.");
    const parsed = gameEventSchema.safeParse(input);
    if (!parsed.success) throw new OfflineError(400, "VALIDATION_ERROR", "The request is invalid.");
    const event = parsed.data;
    const now = this.clock();
    if (session.status === "COMPLETED") {
      if (event.type === "finish") return { data: {}, state: toClientState(session.state), newlyCompletedMissions: [], newlyDefeatedBosses: [], newAchievements: [], completed: true, summary: summarize(game.spec, session.state, session.finishedAt ?? now) };
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
    return { data: result.data, state: result.client, newlyCompletedMissions: result.newlyCompletedMissions, newlyDefeatedBosses: result.newlyDefeatedBosses, newAchievements: result.newAchievements, completed: next.finished, summary };
  }

  results(sessionId: string): { game: StoredGame; session: StoredSession; summary: LearningSummary; review: ReviewItem[] } | null {
    const session = this.getSession(sessionId);
    const game = session ? this.getGame(session.gameId) : null;
    if (!session || !game) return null;
    try {
      return { game, session, summary: summarize(game.spec, session.state, session.finishedAt ?? this.clock()), review: buildReview(game.spec, session.state) };
    } catch {
      return null; // damaged data: shown like a run that is not there
    }
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
      throw damaged(e);
    }
  }

  // ───────── "review my mistakes" deck (spaced repetition across all games) ─────────
  private deck(): Record<string, DeckCard> {
    const v = this.read<unknown>("deck", {});
    const out: Record<string, DeckCard> = {};
    if (!v || typeof v !== "object" || Array.isArray(v)) return out;
    // a damaged card is dropped on its own; it comes back the next time the question is missed
    for (const [k, c] of Object.entries(v)) {
      const card = k === "__proto__" ? null : normalizeCard(c, k);
      if (card) out[k] = card;
    }
    return out;
  }
  private saveDeck(d: Record<string, DeckCard>): void { this.write("deck", d); }

  /** Adds every question missed (resolved with a wrong answer or revealed) in any session; drops cards of deleted games. */
  syncDeck(): Record<string, DeckCard> {
    const deck = this.deck();
    const now = this.clock();
    const stampNow = this.changeStamp();
    const games = new Set(this.gameIds());
    let changed = false;
    for (const k of Object.keys(deck)) if (!games.has(deck[k]!.gameId)) { delete deck[k]; changed = true; }
    for (const gameId of games) {
      for (const sid of this.sessionIds(gameId)) {
        const s = this.getSession(sid);
        if (!s) continue;
        for (const [challengeId, r] of Object.entries(s.state.records)) {
          if (!r.resolved || (r.wrong === 0 && !r.revealed)) continue;
          const card = { ...newCard(gameId, challengeId, now), updatedAt: stampNow };
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
    try { return this.runDeckPractice(body); } catch (e) { throw damaged(e); }
  }

  private runDeckPractice(body: unknown) {
    const parsed = deckBodySchema.safeParse(body);
    if (!parsed.success) throw new OfflineError(400, "VALIDATION_ERROR", "The request is invalid.");
    const b = parsed.data;
    const now = this.clock();
    if (b.action === "start") {
      const items = dueCards(Object.values(this.syncDeck()), now).flatMap((card) => {
        const ch = this.getGame(card.gameId) && findChallenge(this.getGame(card.gameId)!.spec, card.challengeId);
        return ch ? [{ ...toPublicChallenge(ch, deckSeed(card)), id: card.key }] : [];
      });
      return { items };
    }
    const deck = this.deck();
    const card = deck[b.challengeId];
    const game = card ? this.getGame(card.gameId) : null;
    const ch = game ? findChallenge(game.spec, card!.challengeId) : undefined;
    if (!card || !game || !ch) throw new OfflineError(404, "NOT_FOUND", "That question is not in your review deck.");
    if (b.action === "hint") return { hint: ch.hint ?? null };
    const graded = gradeAnswer(ch, b.answer, game.spec.meta.language, deckSeed(card));
    const resolved = graded.correct || b.attempt >= MAX_ATTEMPTS_PER_CHALLENGE;
    const revealed = !graded.correct && resolved;
    if (resolved) {
      const next = review(card, graded.correct && b.attempt === 1, now);
      const changedAt = this.changeStamp();
      deck[card.key] = next ? { ...next, updatedAt: changedAt } : { ...card, mastered: true, updatedAt: changedAt };
      this.saveDeck(deck);
    }
    return {
      result: {
        correct: graded.correct, feedback: graded.feedback, detail: graded.detail, resolved, revealed, pointsAwarded: 0,
        attemptsLeft: Math.max(0, MAX_ATTEMPTS_PER_CHALLENGE - b.attempt),
        explanation: resolved ? ch.explanation : undefined,
        reveal: revealed ? revealSolution(ch, deckSeed(card)) : undefined,
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
    const tomb = this.tombstones();
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
    const tomb = this.tombstones();
    const dirtyAndNewer = (local: number | undefined, remote: number) => local !== undefined && local > lastPushMs && local >= remote;
    // Server timestamps must never make a pulled record look like a local change (the phone and server clocks differ):
    // a record taken from the cloud is stored as "clean", i.e. not newer than the last push.
    const clean = (remote: number) => Math.min(remote, lastPushMs);

    let tombChanged = false;
    for (const r of rows.games) {
      const deletedHere = tomb[r.id];
      if (deletedHere !== undefined) {
        // Deleted here and the deletion is still waiting to be pushed (or the cloud agrees): it stays deleted.
        // But if the deletion was already pushed and the cloud now holds a live copy, someone restored the game
        // (a backup import on another phone) after the deletion: that newer decision wins.
        if (r.deletedAt !== null || deletedHere > lastPushMs) continue;
        delete tomb[r.id];
        tombChanged = true;
      }
      const local = this.getGame(r.id);
      if (r.deletedAt !== null) {
        if (local) {
          if (dirtyAndNewer(local.updatedAt ?? local.createdAt, r.deletedAt)) continue; // restored here after the deletion: the push brings it back
          this.removeGameLocally(r.id);
          applied++;
        }
        continue;
      }
      if (local && dirtyAndNewer(local.updatedAt ?? local.createdAt, r.updatedAt)) continue;
      const { deletedAt: _d, ...game } = r;
      void _d;
      game.updatedAt = clean(r.updatedAt);
      this.putGame(game, !local);
      if (!local) this.addedByMerge.push(game.id);
      applied++;
    }

    if (tombChanged) this.put("tombstones", tomb);

    for (const r of rows.sessions) {
      if (!this.getGame(r.gameId) || tomb[r.gameId] !== undefined) continue;
      const local = this.getSession(r.id);
      // A run carries the phone clock time of its last move. Compare that as well as the server's stamp, whichever is earlier: the
      // server stamp of our own earlier push (which comes back on the next pull) is on the server's clock, and a phone whose clock is
      // even seconds behind would otherwise let that older copy overwrite the newer progress it has not pushed yet. The server stamp
      // still bounds the other direction (a run saved while a phone's clock was set far ahead keeps that future time in its moves).
      // When in doubt the unpushed local progress is kept: it is the only copy of it.
      const remoteMovedAt = Math.min(Math.max(r.state.updatedAt, r.finishedAt ?? 0, r.startedAt), r.updatedAt);
      if (local && dirtyAndNewer(local.updatedAt ?? local.startedAt, remoteMovedAt)) continue;
      this.putSession({ ...r, updatedAt: clean(r.updatedAt) }, !local);
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

  // ───────── backup file (see backup.ts) ─────────

  /** Everything on the device that belongs in a backup file. Read-only: nothing is written. */
  exportData(): { games: StoredGame[]; sessions: StoredSession[]; cards: DeckCard[] } {
    const games: StoredGame[] = [];
    const sessions: StoredSession[] = [];
    const ids = new Set<string>();
    for (const id of this.gameIds()) {
      const g = this.getGame(id);
      if (!g) continue;
      games.push(g);
      ids.add(id);
      for (const sid of this.sessionIds(id)) {
        const s = this.getSession(sid);
        if (s) sessions.push(s);
      }
    }
    const cards = Object.values(this.deck()).filter((c) => ids.has(c.gameId));
    return { games, sessions, cards };
  }

  /**
   * Merge already-validated records from a backup file. Local data is never overwritten by an older or equal copy:
   * a record is taken only when it is new here or strictly newer than the local one. Records that are taken are stamped
   * "changed now" so cloud sync pushes them. A game deleted here after the backup was made stays deleted.
   */
  importRecords(data: { games: StoredGame[]; sessions: StoredSession[]; cards: DeckCard[] }): ImportCounts {
    const counts: ImportCounts = { gamesAdded: 0, gamesUpdated: 0, gamesKept: 0, sessionsImported: 0, sessionsKept: 0, cardsImported: 0, cardsKept: 0 };
    const now = this.changeStamp();
    const tomb = this.tombstones();
    let tombChanged = false;
    const stamp = (r: { updatedAt?: number; createdAt?: number; startedAt?: number; added?: number }) => r.updatedAt ?? r.createdAt ?? r.startedAt ?? r.added ?? 0;
    // A run or card taken from the cloud is stored with a flattened stamp (see mergeRemote: min(server stamp, last push), so 0 on a phone's
    // first sync). That stamp says nothing about how new the content is, and any backup record would look newer than it. What the record
    // itself keeps decides as well: the last move of a run (phone clock; never later than now, so a clock that was set ahead and corrected
    // cannot make a run unbeatable) and, for a card, `added`, which a card from the cloud takes from the server's stamp of its last change.
    const runStamp = (s: StoredSession) => Math.max(stamp(s), Math.min(Math.max(s.state.updatedAt, s.finishedAt ?? 0), now));
    const cardStamp = (c: DeckCard) => Math.max(stamp(c), c.added);
    const usable = new Set<string>();

    for (const g of data.games) {
      const local = this.getGame(g.id);
      const deletedAt = tomb[g.id];
      if (!local && deletedAt !== undefined && deletedAt >= stamp(g)) { counts.gamesKept++; continue; }
      if (local && stamp(local) >= stamp(g)) { counts.gamesKept++; usable.add(g.id); continue; }
      if (deletedAt !== undefined) { delete tomb[g.id]; tombChanged = true; }
      const next: StoredGame = { ...g, updatedAt: now, revision: local ? Math.max(local.revision, g.revision) + 1 : g.revision };
      this.putGame(next, !local);
      if (!local) { counts.gamesAdded++; this.addedByMerge.push(g.id); } else counts.gamesUpdated++; // (a restored game may have newer runs and cards in the cloud)
      usable.add(g.id);
    }
    if (tombChanged) this.write("tombstones", tomb);

    for (const s of data.sessions) {
      if (!usable.has(s.gameId) && !this.getGame(s.gameId)) { counts.sessionsKept++; continue; } // its game stays deleted here
      const local = this.getSession(s.id);
      if (local && runStamp(local) >= runStamp(s)) { counts.sessionsKept++; continue; }
      this.putSession({ ...s, updatedAt: now }, !local);
      counts.sessionsImported++;
    }

    const deck = this.deck();
    let deckChanged = false;
    for (const c of data.cards) {
      if (!this.getGame(c.gameId)) { counts.cardsKept++; continue; }
      const local = deck[c.key];
      if (local && cardStamp(local) >= cardStamp(c)) { counts.cardsKept++; continue; }
      deck[c.key] = { ...c, updatedAt: now };
      counts.cardsImported++;
      deckChanged = true;
    }
    if (deckChanged) this.saveDeck(deck);
    return counts;
  }

  /**
   * Records stamped later than `threshold` (the phone's clock was set ahead and then corrected) are re-stamped to `to`
   * (default: the threshold). Otherwise they would win every sync conflict and be pushed again on every round.
   * Returns how many were changed.
   */
  clampFutureStamps(threshold: number, to: number = threshold): number {
    const limit = threshold;
    let n = 0;
    this.muted = true;
    try {
      for (const id of this.gameIds()) {
        const g = this.getGame(id);
        if (g && g.updatedAt > limit) { this.put(`game.${id}`, { ...g, updatedAt: to }); n++; }
        for (const sid of this.sessionIds(id)) {
          const s = this.getSession(sid);
          if (s && s.updatedAt > limit) { this.put(`session.${sid}`, { ...s, updatedAt: to }); n++; }
        }
      }
      const deck = this.deck();
      let deckChanged = false;
      for (const c of Object.values(deck)) if (c.updatedAt > limit) { c.updatedAt = to; deckChanged = true; n++; }
      if (deckChanged) this.put("deck", deck);
      const tomb = this.tombstones();
      let tombChanged = false;
      for (const [id, at] of Object.entries(tomb)) if (at > limit) { tomb[id] = to; tombChanged = true; n++; }
      if (tombChanged) this.put("tombstones", tomb);
    } finally {
      this.muted = false;
    }
    return n;
  }

  // ───────── health: repair, integrity, space ─────────

  /**
   * Repairs the lists after a crash or a damaged list: a game or run that is stored but missing from its list is listed again
   * (games deleted here but not removed completely are finished off instead). Never deletes a readable game. Run once at start-up.
   */
  recover(): { gamesRelinked: number; sessionsRelinked: number } {
    const result = { gamesRelinked: 0, sessionsRelinked: 0 };
    const keys = this.kv.keys?.();
    if (!keys) return result;
    try {
      const tomb = this.tombstones();
      const gPrefix = PREFIX + "game.";
      const sPrefix = PREFIX + "session.";
      // a deletion that was interrupted (remembered, but the game is still here and has not been changed since) is finished
      for (const id of this.gameIds()) {
        const g = tomb[id] !== undefined ? this.getGame(id) : null;
        if (g && tomb[id]! >= g.updatedAt) this.removeGameLocally(id);
      }
      const listed = new Set(this.gameIds());
      const found: StoredGame[] = [];
      for (const k of keys.filter((x) => x.startsWith(gPrefix))) {
        const id = k.slice(gPrefix.length);
        if (listed.has(id)) continue;
        if (tomb[id] !== undefined) { this.removeGameKeys(id); continue; }
        const g = this.getGame(id);
        if (g) found.push(g);
      }
      if (found.length > 0) {
        found.sort((a, b) => b.createdAt - a.createdAt);
        this.put("games", [...this.gameIds(), ...found.map((g) => g.id)]);
        result.gamesRelinked = found.length;
      }
      const inLists = new Set(this.gameIds().flatMap((id) => this.sessionIds(id)));
      const lost = new Map<string, StoredSession[]>();
      for (const k of keys.filter((x) => x.startsWith(sPrefix))) {
        const sid = k.slice(sPrefix.length);
        if (inLists.has(sid)) continue;
        const s = this.getSession(sid);
        if (s && this.gameIds().includes(s.gameId)) lost.set(s.gameId, [...(lost.get(s.gameId) ?? []), s]);
      }
      for (const [gameId, list] of lost) {
        const merged = [...this.sessionIds(gameId), ...list.map((s) => s.id)];
        const started = new Map(list.map((s) => [s.id, s.startedAt]));
        const at = (id: string) => started.get(id) ?? this.getSession(id)?.startedAt ?? 0;
        this.put(`sessions.${gameId}`, merged.sort((a, b) => at(b) - at(a)));
        result.sessionsRelinked += list.length;
      }
    } catch (e) {
      if (!isStorageError(e)) throw e; // a full phone can still be read; repairing waits until there is room
    }
    return result;
  }

  /** What on this device cannot be read any more. Read-only. */
  integrity(): Integrity {
    const damagedGames: string[] = [];
    const damagedSessions: string[] = [];
    const ids = this.gameIds();
    for (const id of ids) {
      const g = this.getGame(id);
      if (!g || !gameUsable(g)) { damagedGames.push(id); continue; }
      for (const sid of this.sessionIds(id)) if (!this.getSession(sid)) damagedSessions.push(sid);
    }
    return { games: ids.length - damagedGames.length, damagedGames, damagedSessions };
  }

  /** Removes what `integrity()` reports. A healthy copy in the cloud (if any) comes back with the next sync. */
  purgeDamaged(): number {
    const { damagedGames, damagedSessions } = this.integrity();
    for (const id of damagedGames) this.removeGameKeys(id);
    if (damagedGames.length) this.put("games", this.gameIds().filter((id) => !damagedGames.includes(id)));
    const bad = new Set(damagedSessions);
    for (const gameId of this.gameIds()) {
      const list = this.sessionIds(gameId);
      if (list.some((s) => bad.has(s))) this.put(`sessions.${gameId}`, list.filter((s) => !bad.has(s)));
    }
    for (const sid of bad) this.kv.remove(PREFIX + `session.${sid}`);
    const n = damagedGames.length + bad.size;
    if (n > 0) this.changed();
    return n;
  }

  /** Characters stored on the device (all keys of this origin, since the quota is shared) against the practical limit. */
  storageUsage(): { chars: number; limit: number } {
    let chars = 0;
    for (const k of this.kv.keys?.() ?? []) chars += k.length + (this.kv.get(k)?.length ?? 0);
    return { chars, limit: STORAGE_LIMIT_CHARS };
  }

  /** Can anything be saved right now? Writes and removes one tiny value. */
  checkWritable(): "ok" | "full" | "unavailable" {
    const key = PREFIX + "probe";
    try { this.kv.set(key, "1"); } catch (e) { return toStorageError(e).code === "STORAGE_FULL" ? "full" : "unavailable"; }
    this.kv.remove(key);
    return "ok";
  }

  private removeGameKeys(id: string): void {
    for (const s of this.sessionIds(id)) this.kv.remove(PREFIX + `session.${s}`);
    this.kv.remove(PREFIX + `sessions.${id}`);
    this.kv.remove(PREFIX + `game.${id}`);
    // Its review cards go with it, now: left behind, they would be sent to the cloud as "unchanged" cards of a game this phone no
    // longer has (skipped), and come back as stale copies if the game is restored later.
    const deck = this.deck();
    const mine = Object.keys(deck).filter((k) => deck[k]!.gameId === id);
    if (mine.length > 0) {
      for (const k of mine) delete deck[k];
      try { this.put("deck", deck); } catch (e) { if (!isStorageError(e)) throw e; } // (shrinking the deck cannot realistically fail; the next deck update cleans up)
    }
  }

  private removeGameLocally(id: string): void {
    this.removeGameKeys(id);
    this.write("games", this.gameIds().filter((g) => g !== id));
  }
}
