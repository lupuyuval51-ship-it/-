import "server-only";
import { FEATURE_TIERS, levelsAllowed, quotaOf, type FeatureTier, type LevelQuota, type PlanId } from "@/config/plans";
import { getEnv } from "../env";

let override: FeatureTier | null = null;

/**
 * Test seam (like `setBackendForTests`): lets a suite exercise a feature tier without creating a subscription. Refused
 * in production. While set, every plan makes games at exactly this level, with the plan's largest counted quota as that
 * level's quota (Free 5, Plus 5, Pro 10), so suites that are not about the quotas keep room for several games and simple
 * arithmetic (one game = one of that level's games).
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

/** Games per period at `level` on `plan`: a whole number, null (unlimited), or 0 when the plan cannot make that level. */
export function levelQuota(plan: PlanId, level: FeatureTier): LevelQuota {
  if (override) {
    if (level !== override) return 0;
    return Math.max(...FEATURE_TIERS.map((l) => quotaOf(plan, l)).filter((q): q is number => q !== null));
  }
  return quotaOf(plan, level);
}

/** Every level's quota on the plan (A, B and C; 0 for a level the plan does not offer). */
export function levelQuotas(plan: PlanId): Readonly<Record<FeatureTier, LevelQuota>> {
  return { A: levelQuota(plan, "A"), B: levelQuota(plan, "B"), C: levelQuota(plan, "C") };
}
