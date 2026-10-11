import type { KV } from "@/lib/offline/store";

/** The Create screen keeps an unfinished form here, so that leaving the screen does not lose the player's notes. */
export const CREATE_DRAFT_KEY = "levelup.mobile.createDraft";

/**
 * "Delete all games" in Settings: every game with its progress, and the Create screen's saved draft (it would
 * otherwise bring back notes the player just asked to wipe). The draft goes first and a storage failure on it never
 * blocks the rest; a failure while deleting games is left to the caller to report.
 */
export function deleteAllGames(store: { deleteAll(): number }, kv: KV): void {
  try { kv.remove(CREATE_DRAFT_KEY); } catch { /* optional */ }
  // `deleteAll` also removes damaged games that the library cannot list, which a one-by-one loop would leave behind.
  store.deleteAll();
}
