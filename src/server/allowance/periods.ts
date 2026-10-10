import "server-only";
import { randomUUID } from "node:crypto";
import type { PlanId } from "@/config/plans";
import { db, type Tx } from "../db";
import type { Entitlement } from "./entitlement";

export interface PeriodRow {
  id: string;
  userId: string;
  source: "FREE" | "SUBSCRIPTION";
  plan: PlanId;
  periodStart: Date;
  periodEnd: Date;
  limit: number;
  used: number;
  reserved: number;
}

/**
 * Get-or-create the allowance row for the entitlement's period in ONE atomic statement.
 * If the plan changed inside the same period (e.g. PLUS → PRO upgrade) the limit is refreshed while `used`
 * and `reserved` are preserved, so credits already spent in the period stay spent.
 */
export async function ensurePeriod(tx: Tx, userId: string, ent: Entitlement): Promise<PeriodRow> {
  const rows = await tx.$queryRaw<PeriodRow[]>`
    INSERT INTO "AllowancePeriod" ("id", "userId", "source", "plan", "periodStart", "periodEnd", "limit", "subscriptionId", "updatedAt")
    VALUES (${randomUUID()}, ${userId}, ${ent.source}::"AllowanceSource", ${ent.plan}::"PlanId", ${ent.periodStart}, ${ent.periodEnd}, ${ent.limit}, ${ent.subscriptionId}, now())
    ON CONFLICT ("userId", "source", "periodStart") DO UPDATE SET
      "plan" = EXCLUDED."plan",
      "limit" = EXCLUDED."limit",
      "periodEnd" = EXCLUDED."periodEnd",
      "subscriptionId" = EXCLUDED."subscriptionId",
      "updatedAt" = now()
    RETURNING "id", "userId", "source", "plan", "periodStart", "periodEnd", "limit", "used", "reserved"`;
  return rows[0]!;
}

/** Read-only lookup (no row is created for users who have not generated anything yet). */
export async function findPeriod(userId: string, ent: Entitlement, client: Tx | typeof db = db): Promise<PeriodRow | null> {
  const row = await client.allowancePeriod.findUnique({
    where: { userId_source_periodStart: { userId, source: ent.source, periodStart: ent.periodStart } },
  });
  return row as PeriodRow | null;
}
