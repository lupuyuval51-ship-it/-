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
}

export interface DeckSummary { total: number; due: number; nextDue: number | null }

/** The slice of `OfflineStore` the library needs (a real store satisfies it). */
export interface LibrarySource {
  listGames(): GameSummaryRow[];
  getSession(id: string): { updatedAt: number } | null;
  deckSummary(): DeckSummary;
}

export type LibraryLoad = { ok: true; games: LibraryGame[]; deck: DeckSummary } | { ok: false };

/** Most recently played first; ties keep the store's order (newest created first). */
export function orderGames(games: readonly LibraryGame[]): LibraryGame[] {
  return [...games].sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
}

/** Reads the library. A damaged entry or an unreadable store gives `{ ok: false }` (an error screen), never a blank page. */
export function loadLibrary(src: LibrarySource): LibraryLoad {
  try {
    const games = src.listGames().map((g): LibraryGame => {
      const last = g.lastSessionId ? src.getSession(g.lastSessionId)?.updatedAt : undefined;
      return { ...g, lastPlayedAt: typeof last === "number" && Number.isFinite(last) ? last : g.createdAt };
    });
    return { ok: true, games: orderGames(games), deck: src.deckSummary() };
  } catch {
    return { ok: false };
  }
}

/** The game to resume: the most recently played unfinished one. */
export function continueGame(games: readonly LibraryGame[]): LibraryGame | null {
  return orderGames(games).find((g) => g.inProgress) ?? null;
}

/** Finished at least once (the store only scores finished runs). */
export const isDone = (g: Pick<GameSummaryRow, "bestScore" | "bestStars">): boolean => g.bestScore > 0 || g.bestStars > 0;

export function filterGames<T extends LibraryGame>(games: readonly T[], filter: LibraryFilter): T[] {
  if (filter === "progress") return games.filter((g) => g.inProgress);
  if (filter === "done") return games.filter(isDone);
  return [...games];
}

export function filterCounts(games: readonly LibraryGame[]): Record<LibraryFilter, number> {
  return { all: games.length, progress: games.filter((g) => g.inProgress).length, done: games.filter(isDone).length };
}

export const showFilters = (games: readonly LibraryGame[]): boolean => games.length >= FILTER_MIN_GAMES;
