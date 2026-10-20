/**
 * Games per level on the phone, counted per UTC calendar month with the plan's own quotas (`config/plans.ts`):
 * Free B 1 and C 5, Plus A 5, B 10, C unlimited, Pro A 20, B 40, C unlimited. A level that is used up never reduces another.
 * Counted on the device (the app has no server), so, like everything in this app, it is for honest users: a rooted phone can
 * reset it. Pure over a key/value store.
 */
import { hasLeft, levelsAllowed, maxLevel, quotaLeft, quotaOf, type FeatureTier, type LevelQuota, type PlanId } from "../../config/plans";
import type { KeyValue } from "./billing-state";

const KEY = "levelup.quota.v1";
type Used = Record<FeatureTier, number>;
interface Stored { month: string; used: Used }

export const monthKey = (now: number): string => new Date(now).toISOString().slice(0, 7);
const empty = (): Used => ({ A: 0, B: 0, C: 0 });

export function loadUsed(store: KeyValue, now: number): Used {
  try {
    const raw = store.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as Partial<Stored>) : null;
    if (!s || s.month !== monthKey(now) || !s.used) return empty();
    const n = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : 0);
    return { A: n(s.used.A), B: n(s.used.B), C: n(s.used.C) };
  } catch {
    return empty();
  }
}

/** Counts one game at `level` in the current month. */
export function recordUse(store: KeyValue, level: FeatureTier, now: number): void {
  const used = loadUsed(store, now);
  used[level] += 1;
  try { store.setItem(KEY, JSON.stringify({ month: monthKey(now), used } satisfies Stored)); } catch { /* optional */ }
}

export function levelsLeft(plan: PlanId, used: Used): Record<FeatureTier, LevelQuota> {
  const left = (l: FeatureTier): LevelQuota => quotaLeft(quotaOf(plan, l), used[l], 0);
  return { A: left("A"), B: left("B"), C: left("C") };
}

/** The level a new game gets: the highest the plan offers that still has a game left; `exhausted` when none has. */
export function pickBuildLevel(plan: PlanId, used: Used): { level: FeatureTier; exhausted: boolean } {
  const left = levelsLeft(plan, used);
  const free = levelsAllowed(plan).find((l) => hasLeft(left[l]));
  if (free) return { level: free, exhausted: false };
  const lowest = levelsAllowed(plan).at(-1) ?? maxLevel(plan);
  return { level: lowest, exhausted: true };
}
