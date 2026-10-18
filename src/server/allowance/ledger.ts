import "server-only";
import { randomUUID } from "node:crypto";
import { FEATURE_TIERS, type FeatureTier } from "@/config/plans";
import type { Tx } from "../db";

function assertLevel(level: FeatureTier): void {
  if (!FEATURE_TIERS.includes(level)) throw new Error(`invalid allowance level ${String(level)}`);
}

/**
 * Atomically hold ONE game of `level` in the period (every level has its own quota; nothing else is touched). The
 * guard `used + reserved + 1 <= limit` for that level lives in the UPDATE itself, so any number of concurrent requests
 * can never push a level past its quota: PostgreSQL serialises the row update and re-evaluates the predicate against
 * the latest committed values. An unlimited level (limit NULL) is never refused by the count, not even after a
 * downgrade; its use is counted all the same. One job at a time and the generate rate limit still apply.
 */
export async function reserveSlot(tx: Tx, periodId: string, level: FeatureTier): Promise<boolean> {
  assertLevel(level);
  const affected = await tx.$executeRaw`
    UPDATE "AllowanceQuota"
       SET "reserved" = "reserved" + 1, "updatedAt" = now()
     WHERE "allowancePeriodId" = ${periodId} AND "level" = ${level}::"GraphicsTier"
       AND ("limit" IS NULL OR "used" + "reserved" + 1 <= "limit")`;
  return affected === 1;
}

export async function recordReserve(tx: Tx, args: { userId: string; periodId: string; jobId: string; level: FeatureTier }): Promise<void> {
  await tx.usageRecord.create({
    data: { userId: args.userId, allowancePeriodId: args.periodId, jobId: args.jobId, kind: "RESERVE", note: `generation started (one level ${args.level} game held)` },
  });
}

/**
 * Settle a job's reservation exactly once.
 *  - COMMIT  → the held game becomes used (a validated game was delivered).
 *  - RELEASE → the held game is returned (generation failed, timed out or was superseded).
 * `level` is the job's own stored level (GenerationJob.featureTier), so exactly what was reserved is settled even when
 * the plan changed while the job ran.
 * The partial unique index "UsageRecord_settle_once_per_job" makes a second settlement a no-op, so duplicate
 * deliveries, retries and races between a finishing worker and the timeout reaper cannot double-charge or
 * double-refund. Returns whether THIS call performed the settlement.
 */
export async function settleReservation(
  tx: Tx,
  args: { userId: string; periodId: string; jobId: string; level: FeatureTier; kind: "COMMIT" | "RELEASE"; note?: string },
): Promise<boolean> {
  assertLevel(args.level);
  const inserted = await tx.$queryRaw<{ id: string }[]>`
    INSERT INTO "UsageRecord" ("id", "userId", "allowancePeriodId", "jobId", "kind", "note")
    VALUES (${randomUUID()}, ${args.userId}, ${args.periodId}, ${args.jobId}, ${args.kind}::"UsageKind", ${args.note ?? null})
    ON CONFLICT DO NOTHING
    RETURNING "id"`;
  if (inserted.length === 0) return false;
  if (args.kind === "COMMIT") {
    await tx.$executeRaw`UPDATE "AllowanceQuota" SET "reserved" = "reserved" - 1, "used" = "used" + 1, "updatedAt" = now() WHERE "allowancePeriodId" = ${args.periodId} AND "level" = ${args.level}::"GraphicsTier"`;
  } else {
    await tx.$executeRaw`UPDATE "AllowanceQuota" SET "reserved" = "reserved" - 1, "updatedAt" = now() WHERE "allowancePeriodId" = ${args.periodId} AND "level" = ${args.level}::"GraphicsTier"`;
  }
  return true;
}
