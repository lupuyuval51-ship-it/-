import "server-only";
import { PLANS, costOf, levelsAllowed, type FeatureTier, type PlanId } from "@/config/plans";
import { getEnv } from "../env";

let override: FeatureTier | null = null;

/**
 * Test seam (like `setBackendForTests`): lets a suite exercise a feature tier without creating a subscription. Refused
 * in production. While set, every plan makes games at exactly this level, each costing the plan's cheapest price, so
 * suites that are not about the points model keep simple arithmetic (one game = one point).
 */
export function setFeatureTierForTests(tier: FeatureTier | null): void {
  if (getEnv().APP_ENV === "production") throw new Error("setFeatureTierForTests is not available in production");
  override = tier;
}

/** The levels a plan can make, highest first (under the test override: only the override level). */
export function levelsForPlan(plan: PlanId): FeatureTier[] {
  return override ? [override] : levelsAllowed(plan);
}

/** The highest level (feature tier) a plan can make. */
export function maxLevelForPlan(plan: PlanId): FeatureTier {
  return levelsForPlan(plan)[0]!;
}

/** Points one game at `level` costs on `plan`, or null when the plan cannot make that level. */
export function levelCost(plan: PlanId, level: FeatureTier): number | null {
  if (override) return level === override ? Math.min(...Object.values(PLANS[plan].allowance.cost).filter((c) => c > 0)) : null;
  return costOf(plan, level);
}
