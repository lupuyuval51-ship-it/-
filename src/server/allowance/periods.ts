import "server-only";
import { randomUUID } from "node:crypto";
import { FEATURE_TIERS, quotaLeft, type FeatureTier, type LevelQuota, type PlanId } from "@/config/plans";
import { db, type Tx } from "../db";
import type { Entitlement } from "./entitlement";

/** One level's counters inside a period. `limit`: games per period, null = unlimited, 0 = not on the plan. */
export interface LevelCounter {
  limit: LevelQuota;
  used: number;
  reserved: number;
}

export interface PeriodRow {
  id: string;
  userId: string;
  source: "FREE" | "SUBSCRIPTION";
  plan: PlanId;
  periodStart: Date;
  periodEnd: Date;
  /** Every level's own counters (A, B and C); using one level never touches another. */
  levels: Record<FeatureTier, LevelCounter>;
}

type PeriodBase = Omit<PeriodRow, "levels">;
type QuotaRow = { level: FeatureTier; limit: number | null; used: number; reserved: number };

function byLevel(rows: QuotaRow[]): Record<FeatureTier, LevelCounter> {
  const levels = { A: { limit: 0, used: 0, reserved: 0 }, B: { limit: 0, used: 0, reserved: 0 }, C: { limit: 0, used: 0, reserved: 0 } } as Record<FeatureTier, LevelCounter>;
  for (const r of rows) levels[r.level] = { limit: r.limit, used: r.used, reserved: r.reserved };
  return levels;
}

/**
 * Get-or-create the allowance period of the entitlement and its three level counters, each in ONE atomic statement.
 * The period row is locked by the upsert for the rest of the transaction, so concurrent starters for the same user queue
 * here. If the plan changed inside the same period (e.g. PLUS → PRO upgrade, or back) every level's limit is refreshed
 * from the config while its `used` and `reserved` are preserved: games already made in the period stay counted at their
 * level, an upgrade adds the difference (Plus 3 A → Pro 5 A with 1 used leaves 4), and a downgrade can leave `used` above
 * the new limit, which simply means nothing is left at that level until the period ends.
 */
export async function ensurePeriod(tx: Tx, userId: string, ent: Entitlement): Promise<PeriodRow> {
  const periods = await tx.$queryRaw<PeriodBase[]>`
    INSERT INTO "AllowancePeriod" ("id", "userId", "source", "plan", "periodStart", "periodEnd", "subscriptionId", "updatedAt")
    VALUES (${randomUUID()}, ${userId}, ${ent.source}::"AllowanceSource", ${ent.plan}::"PlanId", ${ent.periodStart}, ${ent.periodEnd}, ${ent.subscriptionId}, now())
    ON CONFLICT ("userId", "source", "periodStart") DO UPDATE SET
      "plan" = EXCLUDED."plan",
      "periodEnd" = EXCLUDED."periodEnd",
      "subscriptionId" = EXCLUDED."subscriptionId",
      "updatedAt" = now()
    RETURNING "id", "userId", "source", "plan", "periodStart", "periodEnd"`;
  const period = periods[0]!;
  const q = ent.quotas;
  const rows = await tx.$queryRaw<QuotaRow[]>`
    INSERT INTO "AllowanceQuota" ("allowancePeriodId", "level", "limit", "updatedAt")
    VALUES (${period.id}, 'A'::"GraphicsTier", ${q.A}::integer, now()),
           (${period.id}, 'B'::"GraphicsTier", ${q.B}::integer, now()),
           (${period.id}, 'C'::"GraphicsTier", ${q.C}::integer, now())
    ON CONFLICT ("allowancePeriodId", "level") DO UPDATE SET "limit" = EXCLUDED."limit", "updatedAt" = now()
    RETURNING "level", "limit", "used", "reserved"`;
  return { ...period, levels: byLevel(rows) };
}

/** Read-only lookup (no row is created for users who have not generated anything yet). */
export async function findPeriod(userId: string, ent: Entitlement, client: Tx | typeof db = db): Promise<PeriodRow | null> {
  const row = await client.allowancePeriod.findUnique({
    where: { userId_source_periodStart: { userId, source: ent.source, periodStart: ent.periodStart } },
    include: { quotas: true },
  });
  if (!row) return null;
  const { quotas, ...period } = row;
  return { id: period.id, userId: period.userId, source: period.source, plan: period.plan, periodStart: period.periodStart, periodEnd: period.periodEnd, levels: byLevel(quotas) };
}

/**
 * Games that can still be started at each level this period, against the plan's CURRENT quotas (the ones the next
 * reservation enforces): a whole number, or null for an unlimited level. A level the plan does not offer has 0.
 */
export function leftPerLevel(ent: Entitlement, period: PeriodRow | null): Record<FeatureTier, LevelQuota> {
  const left = {} as Record<FeatureTier, LevelQuota>;
  for (const level of FEATURE_TIERS) left[level] = quotaLeft(ent.quotas[level], period?.levels[level].used ?? 0, period?.levels[level].reserved ?? 0);
  return left;
}
