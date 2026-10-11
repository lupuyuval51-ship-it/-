import "server-only";
import { PLANS, type FeatureTier, type PlanId } from "@/config/plans";
import { getEnv } from "../env";

let override: FeatureTier | null = null;

/** Test seam (like `setBackendForTests`): lets a suite exercise a feature tier without creating a subscription. Refused in production. */
export function setFeatureTierForTests(tier: FeatureTier | null): void {
  if (getEnv().APP_ENV === "production") throw new Error("setFeatureTierForTests is not available in production");
  override = tier;
}

/** The feature tier of every game a plan creates. */
export function featureTierForPlan(plan: PlanId): FeatureTier {
  return override ?? PLANS[plan].featureTier;
}
