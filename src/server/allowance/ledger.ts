import "server-only";
import { randomUUID } from "node:crypto";
import type { Tx } from "../db";

/**
 * Atomically hold ONE credit. The guard `used + reserved < limit` lives in the UPDATE itself, so any number of
 * concurrent requests can never push a period past its limit: PostgreSQL serialises the row update and
 * re-evaluates the predicate against the latest committed values.
 */
export async function reserveCredit(tx: Tx, periodId: string): Promise<boolean> {
  const affected = await tx.$executeRaw`
    UPDATE "AllowancePeriod"
       SET "reserved" = "reserved" + 1, "updatedAt" = now()
     WHERE "id" = ${periodId} AND "used" + "reserved" < "limit"`;
  return affected === 1;
}

export async function recordReserve(tx: Tx, args: { userId: string; periodId: string; jobId: string }): Promise<void> {
  await tx.usageRecord.create({
    data: { userId: args.userId, allowancePeriodId: args.periodId, jobId: args.jobId, kind: "RESERVE", note: "generation started" },
  });
}

/**
 * Settle a job's reservation exactly once.
 *  - COMMIT  → the held credit becomes used (a validated game was delivered).
 *  - RELEASE → the held credit is returned (generation failed, timed out or was superseded).
 * The partial unique index "UsageRecord_settle_once_per_job" makes a second settlement a no-op, so duplicate
 * deliveries, retries and races between a finishing worker and the timeout reaper cannot double-charge or
 * double-refund. Returns whether THIS call performed the settlement.
 */
export async function settleReservation(
  tx: Tx,
  args: { userId: string; periodId: string; jobId: string; kind: "COMMIT" | "RELEASE"; note?: string },
): Promise<boolean> {
  const inserted = await tx.$queryRaw<{ id: string }[]>`
    INSERT INTO "UsageRecord" ("id", "userId", "allowancePeriodId", "jobId", "kind", "note")
    VALUES (${randomUUID()}, ${args.userId}, ${args.periodId}, ${args.jobId}, ${args.kind}::"UsageKind", ${args.note ?? null})
    ON CONFLICT DO NOTHING
    RETURNING "id"`;
  if (inserted.length === 0) return false;
  if (args.kind === "COMMIT") {
    await tx.$executeRaw`UPDATE "AllowancePeriod" SET "reserved" = "reserved" - 1, "used" = "used" + 1, "updatedAt" = now() WHERE "id" = ${args.periodId}`;
  } else {
    await tx.$executeRaw`UPDATE "AllowancePeriod" SET "reserved" = "reserved" - 1, "updatedAt" = now() WHERE "id" = ${args.periodId}`;
  }
  return true;
}
