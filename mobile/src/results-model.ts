import { recommendedNext, type NextAction } from "@/lib/offline/onboarding";

/** Pure helpers for the phone results screen (unit-tested in node). */

export interface QuickNext {
  id: NextAction;
  /** Website-style route (`/play/ID`); the phone's hash router prefixes `#`. */
  href: string;
  labelKey: "res.review.open" | "res.replay" | "res.new";
}

/**
 * The one step to offer first, same rule as the full "what next" card at the bottom of the results (mistakes first,
 * then another try, then a fresh game), so it can sit at the top where a phone screen does not need a long scroll.
 */
export function quickNext(gameId: string, sessionId: string, s: { completed: boolean; stars: number }, reviewCount: number): QuickNext {
  const id = recommendedNext(s, reviewCount);
  if (id === "review") return { id, href: `/games/${gameId}/results/${sessionId}/review`, labelKey: "res.review.open" };
  if (id === "replay") return { id, href: `/play/${gameId}`, labelKey: "res.replay" };
  return { id, href: "/create", labelKey: "res.new" };
}

export type BestNote = { kind: "best" } | { kind: "other"; best: number; max: number } | null;

/**
 * Progress against the player's own record: "this is your best" for a finished run that matches or beats every finished
 * run of the game, otherwise the record to beat. Nothing before the first finished run.
 */
export function bestNote(s: { completed: boolean; score: number; maxScore: number }, bestScore: number): BestNote {
  if (s.completed && s.score > 0 && s.score >= bestScore) return { kind: "best" };
  if (bestScore > 0) return { kind: "other", best: bestScore, max: s.maxScore };
  return null;
}
