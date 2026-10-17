import "server-only";
import { randomUUID } from "node:crypto";
import type { Tx } from "../db";

/**
 * Atomically hold `cost` allowance POINTS (the price of the game's level; `limit` is the plan's points budget). The
 * guard `used + reserved + cost <= limit` lives in the UPDATE itself, so any number of concurrent requests can never
 * push a period past its budget: PostgreSQL serialises the row update and re-evaluates the predicate against the
 * latest committed values.
 */
export async function reserveCredit(tx: Tx, periodId: string, cost: number): Promise<boolean> {
  if (!Number.isInteger(cost) || cost < 0) throw new Error(`invalid allowance cost ${cost}`);
  // A free level (cost 0) holds nothing, so it is never refused by the budget, not even after a downgrade left the
  // period over its new limit. One job at a time and the generate rate limit still apply.
  if (cost === 0) return true;
  const affected = await tx.$executeRaw`
    UPDATE "AllowancePeriod"
       SET "reserved" = "reserved" + ${cost}, "updatedAt" = now()
     WHERE "id" = ${periodId} AND "used" + "reserved" + ${cost} <= "limit"`;
  return affected === 1;
}

export async function recordReserve(tx: Tx, args: { userId: string; periodId: string; jobId: string; cost: number }): Promise<void> {
  await tx.usageRecord.create({
    data: { userId: args.userId, allowancePeriodId: args.periodId, jobId: args.jobId, kind: "RESERVE", note: `generation started (${args.cost} point${args.cost === 1 ? "" : "s"})` },
  });
}

/**
 * Settle a job's reservation exactly once.
 *  - COMMIT  → the held points become used (a validated game was delivered).
 *  - RELEASE → the held points are returned (generation failed, timed out or was superseded).
 * `cost` is the job's own stored cost (GenerationJob.cost), so exactly what was reserved is settled even when the plan
 * changed while the job ran.
 * The partial unique index "UsageRecord_settle_once_per_job" makes a second settlement a no-op, so duplicate
 * deliveries, retries and races between a finishing worker and the timeout reaper cannot double-charge or
 * double-refund. Returns whether THIS call performed the settlement.
 */
export async function settleReservation(
  tx: Tx,
  args: { userId: string; periodId: string; jobId: string; cost: number; kind: "COMMIT" | "RELEASE"; note?: string },
): Promise<boolean> {
  const inserted = await tx.$queryRaw<{ id: string }[]>`
    INSERT INTO "UsageRecord" ("id", "userId", "allowancePeriodId", "jobId", "kind", "note")
    VALUES (${randomUUID()}, ${args.userId}, ${args.periodId}, ${args.jobId}, ${args.kind}::"UsageKind", ${args.note ?? null})
    ON CONFLICT DO NOTHING
    RETURNING "id"`;
  if (inserted.length === 0) return false;
  if (args.kind === "COMMIT") {
    await tx.$executeRaw`UPDATE "AllowancePeriod" SET "reserved" = "reserved" - ${args.cost}, "used" = "used" + ${args.cost}, "updatedAt" = now() WHERE "id" = ${args.periodId}`;
  } else {
    await tx.$executeRaw`UPDATE "AllowancePeriod" SET "reserved" = "reserved" - ${args.cost}, "updatedAt" = now() WHERE "id" = ${args.periodId}`;
  }
  return true;
}
