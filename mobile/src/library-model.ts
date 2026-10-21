import type { GameSummaryRow } from "@/lib/offline/store";

/**
 * Pure model for the phone library (no React, no storage globals, so it is unit-tested in node):
 * ordering by last play, the "continue where you left off" pick, the filter chips, and a load that never throws.
 */

export type LibraryFilter = "all" | "progress" | "done";
export const LIBRARY_FILTERS: readonly LibraryFilter[] = ["all", "progress", "done"];

/** Below this many games the list is short enough to scan; filter chips would only add noise. */
export const FILTER_MIN_GAMES = 4;

export interface LibraryGame extends GameSummaryRow {
  /** When the game was last played (ms); falls back to when it was created. */
  lastPlayedAt: number;
  /** The game's level (beginner / intermediate / advanced) as stored in its spec, when it can be read. */
  difficulty?: string;
}

export interface DeckSummary { total: number; due: number; nextDue: number | null }

/** The slice of `OfflineStore` the library needs (a real store satisfies it). */
export interface LibrarySource {
  listGames(): GameSummaryRow[];
  getSession(id: string): { updatedAt: number } | null;
  deckSummary(): DeckSummary;
  /** Optional: only used to show each game's level on its card. */
  getGame?(id: string): { spec: { meta: { difficulty?: string } } } | null;
}

export type LibraryLoad = { ok: true; games: LibraryGame[]; deck: DeckSummary } | { ok: false };

/** Most recently played first; ties keep the store's order (newest created first). */
export function orderGames(games: readonly LibraryGame[]): LibraryGame[] {
  return [...games].sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
}

const NO_DECK: DeckSummary = { total: 0, due: 0, nextDue: null };

/**
 * Reads the library. An unreadable game list gives `{ ok: false }` (an error screen), never a blank page. The review-deck
 * count is secondary (and its lookup can write to a full phone), so when it fails the games are still shown without it.
 */
export function loadLibrary(src: LibrarySource): LibraryLoad {
  try {
    const games = src.listGames().map((g): LibraryGame => {
      // the store's rows carry the newest run's stamp; only a source whose rows do not has to read that run again
      const last = g.lastStampAt !== undefined ? g.lastStampAt : g.lastSessionId ? src.getSession(g.lastSessionId)?.updatedAt : undefined;
      // the store's rows carry the level already; only a source whose rows do not has to read each game's spec again
      let difficulty = g.difficulty;
      if (!difficulty) { try { difficulty = src.getGame?.(g.id)?.spec.meta.difficulty; } catch { /* the level is only decoration */ } }
      // The store's own time of the last move counts as well as the run's stamp: opening a game bumps the stamp (that is playing), but a run
      // taken from the cloud carries a flattened stamp (0 on a phone's first sync) that must not push a game that was played to the bottom.
      const stamp = typeof last === "number" && Number.isFinite(last) ? last : 0;
      return { ...g, lastPlayedAt: Math.max(g.lastPlayedAt ?? g.createdAt, stamp), ...(difficulty ? { difficulty } : {}) };
    });
    let deck = NO_DECK;
    try { deck = src.deckSummary(); } catch { /* the games matter more than the badge */ }
    return { ok: true, games: orderGames(games), deck };
  } catch {
    return { ok: false };
  }
}

/**
 * The game to resume: the most recently played unfinished one. With only one or two games the list already puts it
 * at the top with its own Continue button, so the extra card (which would repeat it and push the list down on a small
 * screen) appears from three games on.
 */
export const CONTINUE_MIN_GAMES = 3;
export function continueGame(games: readonly LibraryGame[]): LibraryGame | null {
  if (games.length < CONTINUE_MIN_GAMES) return null;
  return orderGames(games).find((g) => g.inProgress) ?? null;
}

/**
 * Finished at least once. The store says so itself (`completed`): a finished run can score 0 (every answer revealed), and such a
 * game is still completed (the course screen counts it the same way). Rows without the flag fall back to the score: the store only
 * scores finished runs.
 */
export const isDone = (g: Pick<GameSummaryRow, "bestScore" | "bestStars" | "completed">): boolean => g.completed ?? (g.bestScore > 0 || g.bestStars > 0);

export function filterGames<T extends LibraryGame>(games: readonly T[], filter: LibraryFilter): T[] {
  if (filter === "progress") return games.filter((g) => g.inProgress);
  if (filter === "done") return games.filter(isDone);
  return [...games];
}

export function filterCounts(games: readonly LibraryGame[]): Record<LibraryFilter, number> {
  return { all: games.length, progress: games.filter((g) => g.inProgress).length, done: games.filter(isDone).length };
}

export const showFilters = (games: readonly LibraryGame[]): boolean => games.length >= FILTER_MIN_GAMES;
