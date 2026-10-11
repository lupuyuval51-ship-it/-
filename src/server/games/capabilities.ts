import "server-only";
import { PLANS, featureShare, type FeatureTier, type PlanFeatures, type PlanId, type RobotLevel } from "@/config/plans";
import { resolveEntitlement, type Entitlement } from "../allowance/entitlement";
import { db, type Tx } from "../db";
import { featureTierForPlan } from "./feature-tier";

export interface Capabilities {
  plan: PlanId;
  /** The feature tier games created on this plan are built at, and the share of all game features it exposes. */
  featureTier: FeatureTier;
  featureShare: number;
  robot: RobotLevel;
  versionHistory: boolean;
  aiEdits: { limit: number; used: number; remaining: number; periodEnd: string };
}

/** What the signed-in user's plan allows, computed from persisted state only. Used by the API and to render locked states. */
export async function getCapabilities(userId: string, now = new Date(), client: Tx | typeof db = db): Promise<{ ent: Entitlement; features: PlanFeatures; caps: Capabilities }> {
  const ent = await resolveEntitlement(userId, now, client);
  const features = PLANS[ent.plan].features;
  const used = await client.aiEdit.count({ where: { userId, periodStart: ent.periodStart, status: { in: ["PENDING", "SUCCEEDED"] } } });
  return {
    ent, features,
    caps: { plan: ent.plan, featureTier: featureTierForPlan(ent.plan), featureShare: featureShare(featureTierForPlan(ent.plan)), robot: features.robot, versionHistory: features.versionHistory, aiEdits: { limit: features.aiEditsPerPeriod, used, remaining: Math.max(0, features.aiEditsPerPeriod - used), periodEnd: ent.periodEnd.toISOString() } },
  };
}
