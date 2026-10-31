import "server-only";
import type { GenerationJob } from "@/generated/prisma/client";
import { planUnlockingLevel, quotaLeft, type FeatureTier } from "@/config/plans";
import type { GenerationRequest } from "@/lib/schemas/generation";
import { resolveEntitlement } from "../allowance/entitlement";
import { ensurePeriod } from "../allowance/periods";
import { recordReserve, reserveSlot, settleReservation } from "../allowance/ledger";
import { db, isUniqueViolation, type Tx } from "../db";
import { levelQuota, maxLevelForPlan } from "../games/feature-tier";
import { ApiError, Errors } from "../http/errors";

const ACTIVE = ["PENDING", "RUNNING"] as const;

export interface StartJobArgs {
  userId: string;
  idempotencyKey: string;
  request: GenerationRequest;
  /**
   * The game's level (feature tier), decided by the server (createGeneration); defaults to `request.level`, else the
   * plan's highest level. Whether the plan offers it is checked HERE, inside the transaction, against the plan as it is now.
   */
  level?: FeatureTier;
  deadlineMs: number;
  now?: Date;
}

/**
 * Create a generation job and hold ONE game of its level's quota on the user's plan, atomically.
 *
 * Guarantees (each enforced by the database, not by application code):
 *  - the same (user, idempotencyKey) always yields the same job, never a second reservation;
 *  - a user has at most one job in flight (partial unique index) → no parallel/duplicate generations;
 *  - `used + reserved` of a level can never exceed that level's quota (conditional UPDATE in reserveSlot); the other
 *    levels are never touched;
 *  - the job stores its level (`featureTier`); commit and release move exactly one game of that level.
 */
export async function startGenerationJob(args: StartJobArgs): Promise<{ job: GenerationJob; created: boolean }> {
  const now = args.now ?? new Date();
  await reapExpiredJobs(now, args.userId);

  const existing = await db.generationJob.findUnique({ where: { userId_idempotencyKey: { userId: args.userId, idempotencyKey: args.idempotencyKey } } });
  if (existing) return { job: existing, created: false };

  try {
    const job = await db.$transaction(async (tx) => {
      const ent = await resolveEntitlement(args.userId, now, tx);
      // Locks this period's row for the rest of the transaction → concurrent starters for the same user queue here.
      const period = await ensurePeriod(tx, args.userId, ent);
      // Checked against the plan as it is NOW (inside the transaction): a plan change since the pre-checks cannot slip through.
      const level = args.level ?? args.request.level ?? maxLevelForPlan(ent.plan);
      if (levelQuota(ent.plan, level) === 0) {
        throw new ApiError(403, "FEATURE_TIER_LOCKED", `Level ${level} games are not part of your plan.`, {
          level, requiredLevel: level, requiredPlan: planUnlockingLevel(level),
        });
      }
      const created = await tx.generationJob.create({
        data: {
          userId: args.userId,
          mode: args.request.mode,
          idempotencyKey: args.idempotencyKey,
          request: args.request,
          featureTier: level,
          targetGameId: args.request.targetGameId ?? null,
          allowancePeriodId: period.id,
          deadlineAt: new Date(now.getTime() + args.deadlineMs),
        },
      });
      const reserved = await reserveSlot(tx, period.id, level);
      if (!reserved) {
        const { limit, used, reserved: held } = period.levels[level];
        throw new ApiError(402, "ALLOWANCE_EXHAUSTED", `You have no level ${level} games left in this period.`, {
          plan: ent.plan, level, limit, remaining: quotaLeft(limit, used, held) ?? 0, resetsAt: ent.periodEnd.toISOString(),
        });
      }
      await recordReserve(tx, { userId: args.userId, periodId: period.id, jobId: created.id, level });
      return created;
    });
    return { job, created: true };
  } catch (err) {
    if (isUniqueViolation(err)) {
      // Lost a race: either the same idempotency key (return that job) or another job is already in flight.
      const sameKey = await db.generationJob.findUnique({ where: { userId_idempotencyKey: { userId: args.userId, idempotencyKey: args.idempotencyKey } } });
      if (sameKey) return { job: sameKey, created: false };
      const active = await db.generationJob.findFirst({ where: { userId: args.userId, status: { in: [...ACTIVE] } }, select: { id: true } });
      throw Errors.conflict("JOB_IN_PROGRESS", "A game is already being generated for your account.", { jobId: active?.id ?? null });
    }
    throw err;
  }
}

export async function markJobRunning(jobId: string, now = new Date()): Promise<boolean> {
  const { count } = await db.generationJob.updateMany({
    where: { id: jobId, status: "PENDING" },
    data: { status: "RUNNING", stage: "starting", startedAt: now },
  });
  return count === 1;
}

/** Progress updates only ever apply to jobs that are still in flight (a reaped job is never resurrected). */
export async function updateJobProgress(
  jobId: string,
  data: { stage?: string; providerId?: string; model?: string; attempts?: number; warnings?: string[] },
): Promise<void> {
  await db.generationJob.updateMany({ where: { id: jobId, status: { in: [...ACTIVE] } }, data });
}

export type Delivery = (tx: Tx, job: GenerationJob) => Promise<{ gameId: string }>;

/**
 * Deliver a validated game and COMMIT the job's held game (one of its level) in one transaction.
 * Returns false when the job was already settled (timed out / failed / delivered before) — in that case nothing
 * is written, the held game is not consumed twice and no orphan game is created.
 */
export async function succeedJob(jobId: string, deliver: Delivery, now = new Date()): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const { count } = await tx.generationJob.updateMany({
      where: { id: jobId, status: { in: [...ACTIVE] } },
      data: { status: "SUCCEEDED", stage: "done", finishedAt: now },
    });
    if (count === 0) return false;
    const job = await tx.generationJob.findUniqueOrThrow({ where: { id: jobId } });
    const { gameId } = await deliver(tx, job);
    await tx.generationJob.update({ where: { id: jobId }, data: { gameId } });
    const settled = await settleReservation(tx, { userId: job.userId, periodId: job.allowancePeriodId!, jobId, level: job.featureTier, kind: "COMMIT", note: "game delivered" });
    if (!settled) throw new Error("invariant violated: reservation already settled for an in-flight job");
    return true;
  });
}

/** Mark a job failed and RELEASE its held game — a failed generation never costs the user anything. */
export async function failJob(jobId: string, code: string, safeMessage: string, now = new Date()): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const { count } = await tx.generationJob.updateMany({
      where: { id: jobId, status: { in: [...ACTIVE] } },
      data: { status: "FAILED", stage: "failed", errorCode: code, errorMessage: safeMessage.slice(0, 300), finishedAt: now },
    });
    if (count === 0) return false;
    const job = await tx.generationJob.findUniqueOrThrow({ where: { id: jobId } });
    await settleReservation(tx, { userId: job.userId, periodId: job.allowancePeriodId!, jobId, level: job.featureTier, kind: "RELEASE", note: code });
    return true;
  });
}

/** Fail (and release) in-flight jobs whose deadline passed — workers that crashed or hung can't hold a game forever. */
export async function reapExpiredJobs(now = new Date(), userId?: string): Promise<number> {
  const stale = await db.generationJob.findMany({
    where: { status: { in: [...ACTIVE] }, deadlineAt: { lt: now }, ...(userId ? { userId } : {}) },
    select: { id: true },
    take: 100,
  });
  let reaped = 0;
  for (const { id } of stale) {
    if (await failJob(id, "TIMEOUT", "Generation took too long and was cancelled. You were not charged.", now)) reaped++;
  }
  return reaped;
}

export async function getUserJob(userId: string, jobId: string, now = new Date()): Promise<GenerationJob | null> {
  await reapExpiredJobs(now, userId);
  return db.generationJob.findFirst({ where: { id: jobId, userId } });
}
