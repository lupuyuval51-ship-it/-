/**
 * The feature tier the offline app may use (C = 40 %, B = 70 %, A = 100 % of the game features; see `config/plans.ts`).
 *
 * There are no plans on the device yet: paid tiers will come from Google Play Billing (never Stripe), and until that
 * exists every install keeps the full tier A so nobody loses what they already have. When billing lands, only this
 * function changes: it will map the verified Play subscription to the
 * highest level that plan offers (`maxLevel(plan)`); the device counts no games per level.
 */
import { maxLevel, type FeatureTier } from "../../config/plans";

export type OfflinePlan = "FREE" | "PLUS" | "PRO";

/** Plan an install is entitled to. Placeholder until Play Billing: the whole app is unlocked. */
export function getOfflinePlan(): OfflinePlan {
  return "PRO";
}

export function getOfflineTier(plan: OfflinePlan = getOfflinePlan()): FeatureTier {
  return maxLevel(plan);
}
