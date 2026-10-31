import "server-only";
import { FEATURE_TIERS, PLANS, quotaLeft, type FeatureTier, type GraphicsTier, type LevelQuota, type PlanId } from "@/config/plans";
import { db } from "../db";
import { resolveEntitlement } from "./entitlement";
import { findPeriod } from "./periods";

/** One level's own quota this period. */
export interface LevelAllowance {
  level: FeatureTier;
  /** Games per period at this level from the plan config: a whole number, null = unlimited, 0 = not on the plan. */
  limit: LevelQuota;
  used: number;
  reserved: number;
  /** limit − used − reserved, never negative (null = unlimited). This is what the UI shows and what the server enforces. */
  remaining: LevelQuota;
}

export interface AllowanceSummary {
  plan: PlanId;
  source: "FREE" | "SUBSCRIPTION";
  /** Every level (A, B and C), each counted on its own; a level the plan does not offer has limit 0. */
  levels: Record<FeatureTier, LevelAllowance>;
  periodStart: string;
  periodEnd: string;
  graphics: { allowedTiers: readonly GraphicsTier[]; defaultTier: GraphicsTier };
  activeJobId: string | null;
}

export async function getAllowanceSummary(userId: string, now = new Date()): Promise<AllowanceSummary> {
  const ent = await resolveEntitlement(userId, now);
  const period = await findPeriod(userId, ent);
  const active = await db.generationJob.findFirst({ where: { userId, status: { in: ["PENDING", "RUNNING"] } }, select: { id: true } });
  const levels = {} as Record<FeatureTier, LevelAllowance>;
  for (const level of FEATURE_TIERS) {
    const used = period?.levels[level].used ?? 0;
    const reserved = period?.levels[level].reserved ?? 0;
    const limit = ent.quotas[level];
    levels[level] = { level, limit, used, reserved, remaining: quotaLeft(limit, used, reserved) };
  }
  return {
    plan: ent.plan,
    source: ent.source,
    levels,
    periodStart: ent.periodStart.toISOString(),
    periodEnd: ent.periodEnd.toISOString(),
    graphics: PLANS[ent.plan].graphics,
    activeJobId: active?.id ?? null,
  };
}
