import type { KV } from "./store";

/** First-run helpers for the offline app. Pure and storage-agnostic so they can be unit-tested. */

export const WELCOME_KEY = "levelup.mobile.welcome";
export const WELCOME_STEPS = ["what", "notes", "play"] as const;
export type WelcomeStep = (typeof WELCOME_STEPS)[number];

/** True until the player has finished or skipped the welcome once. A storage failure counts as "seen" (never nag). */
export function shouldShowWelcome(kv: KV, hasGames: boolean): boolean {
  if (hasGames) return false; // existing users (after an upgrade) never see it
  try { return kv.get(WELCOME_KEY) !== "1"; } catch { return false; }
}

export function markWelcomeSeen(kv: KV): void {
  try { kv.set(WELCOME_KEY, "1"); } catch { /* optional */ }
}

/** Step navigation, clamped to the valid range. */
export function stepIndex(i: number): number {
  return Math.min(WELCOME_STEPS.length - 1, Math.max(0, Math.trunc(Number.isFinite(i) ? i : 0)));
}
export const isLastStep = (i: number): boolean => stepIndex(i) === WELCOME_STEPS.length - 1;

/** Query part of a hash route (`#/create?example=1`), which the router strips from the path. */
export function hashQuery(hash: string): URLSearchParams {
  const q = hash.indexOf("?");
  return new URLSearchParams(q === -1 ? "" : hash.slice(q + 1));
}

export type NextAction = "review" | "replay" | "new";

/**
 * What to recommend after a game: mistakes first (that is where learning happens), then another try when the
 * run was unfinished or under 3 stars, otherwise a fresh game.
 */
export function recommendedNext(s: { completed: boolean; stars: number }, reviewCount: number): NextAction {
  if (reviewCount > 0) return "review";
  if (!s.completed || s.stars < 3) return "replay";
  return "new";
}
