import type { TFn } from "@/lib/i18n";

/**
 * Display helpers for the per-level allowance the server reports (`AllowanceSummary.levels`). Every level has its own
 * quota of games per period; the server enforces it, these only word it. Pure, so server and client components share them.
 */
export type QuotaLevel = "A" | "B" | "C";
export interface LevelLeft {
  level: QuotaLevel;
  /** Games per period at this level: a number, null = unlimited, 0 = not on the plan. */
  limit: number | null;
  /** Games that can still be started (null = unlimited). */
  remaining: number | null;
  reserved?: number;
}

/** The levels the plan offers (limit ≠ 0), highest first. */
export function offeredLevels<T extends LevelLeft>(levels: Record<QuotaLevel, T>): T[] {
  return (["A", "B", "C"] as const).map((l) => levels[l]).filter((x) => x.limit !== 0);
}

/** Can a game still be started at this level (an unlimited level always can)? */
export const levelHasLeft = (x: Pick<LevelLeft, "limit" | "remaining">): boolean => x.limit !== 0 && (x.remaining === null || x.remaining > 0);

/** "4 of 5 left" · "unlimited" · "none left until 1 Nov 2026" (`date` is already formatted). */
export function leftText(t: TFn, x: LevelLeft, date: string): string {
  if (x.remaining === null || x.limit === null) return t("quota.unlimited");
  return x.remaining > 0 ? t("quota.left", { n: x.remaining, limit: x.limit }) : t("quota.none", { date });
}

/** Header pill: "A: 3 · B: 5 · C: ∞" items, highest level first. */
export function shortLeftItems(t: TFn, levels: Record<QuotaLevel, LevelLeft>): string[] {
  return offeredLevels(levels).map((x) => (x.remaining === null ? t("nav.allowance.unlimited", { level: x.level }) : t("nav.allowance", { level: x.level, n: x.remaining })));
}
