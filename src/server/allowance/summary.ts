import "server-only";
import { PLANS, type GraphicsTier, type PlanId } from "@/config/plans";
import { db } from "../db";
import { resolveEntitlement } from "./entitlement";
import { findPeriod } from "./periods";

export interface AllowanceSummary {
  plan: PlanId;
  source: "FREE" | "SUBSCRIPTION";
  limit: number;
  used: number;
  reserved: number;
  /** limit − used − reserved, never negative. This is what the UI shows and what the server enforces. */
  remaining: number;
  periodStart: string;
  periodEnd: string;
  graphics: { allowedTiers: readonly GraphicsTier[]; defaultTier: GraphicsTier };
  activeJobId: string | null;
}

export async function getAllowanceSummary(userId: string, now = new Date()): Promise<AllowanceSummary> {
  const ent = await resolveEntitlement(userId, now);
  const period = await findPeriod(userId, ent);
  const used = period?.used ?? 0;
  const reserved = period?.reserved ?? 0;
  const limit = ent.limit;
  const active = await db.generationJob.findFirst({ where: { userId, status: { in: ["PENDING", "RUNNING"] } }, select: { id: true } });
  return {
    plan: ent.plan,
    source: ent.source,
    limit,
    used,
    reserved,
    remaining: Math.max(0, limit - used - reserved),
    periodStart: ent.periodStart.toISOString(),
    periodEnd: ent.periodEnd.toISOString(),
    graphics: PLANS[ent.plan].graphics,
    activeJobId: active?.id ?? null,
  };
}
