/**
 * The plan and feature tier the offline app may use (C = 40 %, B = 70 %, A = 100 % of the game features; see `config/plans.ts`).
 *
 * The plan comes from Google Play Billing (never Stripe): the app asks Play for the learner's subscription, keeps the answer
 * on the phone (`billing-state.ts`) and works offline from it. Without any stored answer the plan is `defaultPlan`: Free in a
 * real build (set by the app at start), Pro in the test builds and in the unit tests.
 * Games per level are counted on the phone (`device-quota.ts`).
 */
import { maxLevel, type FeatureTier } from "../../config/plans";
import { effectivePlan, loadPlanState } from "./billing-state";
import { loadUsed, pickBuildLevel } from "./device-quota";

export type OfflinePlan = "FREE" | "PLUS" | "PRO";

let defaultPlan: OfflinePlan = "PRO";
/** The real app starts as Free until Play says otherwise; tests keep Pro. */
export function setDefaultOfflinePlan(plan: OfflinePlan): void {
  defaultPlan = plan;
}

function storage(): { getItem(k: string): string | null; setItem(k: string, v: string): void } | null {
  try { return typeof localStorage === "undefined" ? null : localStorage; } catch { return null; }
}

/** Plan an install is entitled to right now. */
export function getOfflinePlan(now: number = Date.now()): OfflinePlan {
  const s = storage();
  return (s ? effectivePlan(loadPlanState(s), now) : null) ?? defaultPlan;
}

/** The highest level a plan can make (what a stored game may keep). */
export function getOfflineTier(plan: OfflinePlan = getOfflinePlan()): FeatureTier {
  return maxLevel(plan);
}

/** The level the next new game is built at: the highest this month's quotas still allow; `exhausted` when none is left. */
export function getOfflineBuildLevel(now: number = Date.now()): { level: FeatureTier; exhausted: boolean } {
  const s = storage();
  return pickBuildLevel(getOfflinePlan(now), s ? loadUsed(s, now) : { A: 0, B: 0, C: 0 });
}
