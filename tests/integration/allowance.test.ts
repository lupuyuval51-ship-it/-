import { afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db, disconnectDb } from "@/server/db";
import { getAllowanceSummary } from "@/server/allowance/summary";
import { resolveEntitlement } from "@/server/allowance/entitlement";
import { ensurePeriod } from "@/server/allowance/periods";
import { reserveCredit } from "@/server/allowance/ledger";
import { failJob, reapExpiredJobs, startGenerationJob, succeedJob } from "@/server/generation/jobs";
import type { GenerationRequest } from "@/lib/schemas/generation";
import { ApiError } from "@/server/http/errors";
import { createTestUser, grantSubscription } from "./helpers";

afterAll(disconnectDb);

const request: GenerationRequest = {
  mode: "FAST", subject: "Python loops", learningGoal: "Understand for loops", difficulty: "beginner", gameType: "adventure", contentLanguage: "en",
};
const key = () => `k-${randomUUID()}`;
const deadlineMs = 60_000;

/** Stand-in for the real pipeline: persists a minimal Game so that the commit path is exercised for real. */
async function deliverGame(jobId: string, userId: string): Promise<boolean> {
  return succeedJob(jobId, async (tx) => {
    const game = await tx.game.create({
      data: { ownerId: userId, title: "T", subject: "S", gameType: "adventure", difficulty: "beginner", language: "en", createdVia: "FAST", generatorKind: "demo", generatorProvider: "demo", generatorModel: "demo", spec: {} },
    });
    return { gameId: game.id };
  });
}
async function code(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return "OK";
  } catch (e) {
    return e instanceof ApiError ? e.code : `ERR:${String(e)}`;
  }
}

describe("allowance: FREE", () => {
  it("allows exactly one delivered game per calendar month, then refuses", async () => {
    const u = await createTestUser();
    const { job } = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs });
    expect((await getAllowanceSummary(u.id)).reserved).toBe(1);
    expect(await deliverGame(job.id, u.id)).toBe(true);
    const s = await getAllowanceSummary(u.id);
    expect(s).toMatchObject({ plan: "FREE", limit: 1, used: 1, reserved: 0, remaining: 0 });
    expect(await code(startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs }))).toBe("ALLOWANCE_EXHAUSTED");
  });

  it("resets in the next calendar month (period follows the clock, not the client)", async () => {
    const u = await createTestUser();
    const jan = new Date("2027-01-15T12:00:00Z");
    const first = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs, now: jan });
    await deliverGame(first.job.id, u.id);
    expect(await code(startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs, now: new Date("2027-01-31T23:59:59Z") }))).toBe("ALLOWANCE_EXHAUSTED");
    const feb = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs, now: new Date("2027-02-01T00:00:00Z") });
    expect(feb.created).toBe(true);
  });

  it("a FAILED generation releases the credit — the user can try again and is not charged", async () => {
    const u = await createTestUser();
    const { job } = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs });
    expect(await failJob(job.id, "PROVIDER_ERROR", "The AI provider is unavailable.")).toBe(true);
    expect(await getAllowanceSummary(u.id)).toMatchObject({ used: 0, reserved: 0, remaining: 1 });
    const retry = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs });
    expect(retry.created).toBe(true);
  });
});

describe("allowance: PLUS and PRO", () => {
  it("PLUS gets exactly one game per billing period", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PLUS");
    const a = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs });
    await deliverGame(a.job.id, u.id);
    expect(await getAllowanceSummary(u.id)).toMatchObject({ plan: "PLUS", source: "SUBSCRIPTION", limit: 1, remaining: 0 });
    expect(await code(startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs }))).toBe("ALLOWANCE_EXHAUSTED");
  });

  it("PRO gets exactly five games per billing period, the sixth is refused", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PRO");
    for (let i = 0; i < 5; i++) {
      const { job } = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs });
      await deliverGame(job.id, u.id);
    }
    expect(await getAllowanceSummary(u.id)).toMatchObject({ plan: "PRO", limit: 5, used: 5, remaining: 0 });
    expect(await code(startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs }))).toBe("ALLOWANCE_EXHAUSTED");
  });

  it("a new billing period grants a fresh allowance (renewal)", async () => {
    const u = await createTestUser();
    const start = new Date(Date.now() - 5 * 86_400_000);
    await grantSubscription(u.id, "PLUS", { start });
    const a = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs });
    await deliverGame(a.job.id, u.id);
    expect((await getAllowanceSummary(u.id)).remaining).toBe(0);
    // The renewal webhook moves the subscription into its next paid period.
    const nextStart = new Date(start.getTime() + 30 * 86_400_000);
    await grantSubscription(u.id, "PLUS", { start: nextStart, end: new Date(nextStart.getTime() + 30 * 86_400_000) });
    const later = new Date(nextStart.getTime() + 3600_000);
    expect((await getAllowanceSummary(u.id, later)).remaining).toBe(1);
    expect((await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs, now: later })).created).toBe(true);
  });

  it("upgrading PLUS → PRO inside the same period raises the limit but keeps credits already spent", async () => {
    const u = await createTestUser();
    const start = new Date(Date.now() - 2 * 86_400_000);
    await grantSubscription(u.id, "PLUS", { start });
    const a = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs });
    await deliverGame(a.job.id, u.id);
    await grantSubscription(u.id, "PRO", { start });
    // limit refreshes lazily when the next generation resolves the period
    const b = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs });
    await deliverGame(b.job.id, u.id);
    expect(await getAllowanceSummary(u.id)).toMatchObject({ plan: "PRO", limit: 5, used: 2 });
  });

  it("failed payment (PAST_DUE) and cancellation (CANCELED) fall back to FREE entitlements", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PRO", { status: "PAST_DUE" });
    expect((await resolveEntitlement(u.id)).plan).toBe("FREE");
    await grantSubscription(u.id, "PRO", { status: "ACTIVE" });
    expect((await resolveEntitlement(u.id)).plan).toBe("PRO");
    await grantSubscription(u.id, "PRO", { status: "CANCELED" });
    expect((await resolveEntitlement(u.id)).plan).toBe("FREE");
    expect((await getAllowanceSummary(u.id)).graphics.allowedTiers).toEqual(["B", "C"]);
  });
});

describe("duplicate requests and concurrency", () => {
  it("the same idempotency key returns the same job and reserves only ONE credit", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PRO");
    const k = key();
    const rs = await Promise.all([1, 2, 3].map(() => startGenerationJob({ userId: u.id, idempotencyKey: k, request, deadlineMs })));
    expect(new Set(rs.map((r) => r.job.id)).size).toBe(1);
    expect(rs.filter((r) => r.created)).toHaveLength(1);
    expect((await getAllowanceSummary(u.id)).reserved).toBe(1);
  });

  it("20 parallel requests with different keys create exactly ONE job (no parallel generations) and one reservation", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PRO");
    const results = await Promise.all(Array.from({ length: 20 }, () => code(startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs }))));
    expect(results.filter((r) => r === "OK")).toHaveLength(1);
    expect(results.filter((r) => r === "JOB_IN_PROGRESS" || r === "ALLOWANCE_EXHAUSTED")).toHaveLength(19);
    const s = await getAllowanceSummary(u.id);
    expect(s.reserved).toBe(1);
    expect(s.used).toBe(0);
  });

  it("credit reservation is atomic: 25 concurrent reservations against a limit of 5 succeed exactly 5 times", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PRO");
    const ent = await resolveEntitlement(u.id);
    const period = await db.$transaction((tx) => ensurePeriod(tx, u.id, ent));
    const outcomes = await Promise.all(Array.from({ length: 25 }, () => db.$transaction((tx) => reserveCredit(tx, period.id))));
    expect(outcomes.filter(Boolean)).toHaveLength(5);
    const row = await db.allowancePeriod.findUniqueOrThrow({ where: { id: period.id } });
    expect(row.reserved).toBe(5);
    expect(row.used + row.reserved).toBeLessThanOrEqual(row.limit);
  });

  it("settling twice (finish racing with the timeout reaper) never double-charges or double-refunds", async () => {
    const u = await createTestUser();
    const { job } = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs });
    const [delivered, failed] = await Promise.all([deliverGame(job.id, u.id), failJob(job.id, "TIMEOUT", "late")]);
    expect([delivered, failed].filter(Boolean)).toHaveLength(1);
    const s = await getAllowanceSummary(u.id);
    expect(s.reserved).toBe(0);
    expect(s.used + s.remaining).toBe(1);
    const records = await db.usageRecord.findMany({ where: { jobId: job.id } });
    expect(records.filter((r) => r.kind !== "RESERVE")).toHaveLength(1);
  });

  it("jobs that exceed their deadline are reaped and their credit returned", async () => {
    const u = await createTestUser();
    const { job } = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs: 1000 });
    expect(await reapExpiredJobs(new Date(Date.now() + 5000), u.id)).toBe(1);
    const after = await db.generationJob.findUniqueOrThrow({ where: { id: job.id } });
    expect(after).toMatchObject({ status: "FAILED", errorCode: "TIMEOUT" });
    expect(await getAllowanceSummary(u.id)).toMatchObject({ remaining: 1, reserved: 0, used: 0 });
  });

  it("a late worker cannot deliver after its job was reaped (no orphan game, no charge)", async () => {
    const u = await createTestUser();
    const { job } = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs: 1000 });
    await reapExpiredJobs(new Date(Date.now() + 5000), u.id);
    expect(await deliverGame(job.id, u.id)).toBe(false);
    expect(await db.game.count({ where: { ownerId: u.id } })).toBe(0);
    expect((await getAllowanceSummary(u.id)).used).toBe(0);
  });

  it("the database itself rejects negative counters", async () => {
    const u = await createTestUser();
    const ent = await resolveEntitlement(u.id);
    const period = await db.$transaction((tx) => ensurePeriod(tx, u.id, ent));
    await expect(db.$executeRaw`UPDATE "AllowancePeriod" SET "reserved" = -1 WHERE "id" = ${period.id}`).rejects.toThrow();
  });
});
