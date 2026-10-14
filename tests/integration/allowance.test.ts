import { afterAll, beforeEach, describe, expect, it } from "vitest";
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
import { PLANS, costOf, type FeatureTier } from "@/config/plans";
import { setFeatureTierForTests } from "@/server/games/feature-tier";

afterAll(disconnectDb);

const request: GenerationRequest = {
  mode: "FAST", subject: "Python loops", learningGoal: "Understand for loops", difficulty: "beginner", gameType: "adventure", contentLanguage: "en",
};
// Under the suite's tier override every game costs one point, so Free's budget is a number of games.
const FREE_GAMES = PLANS.FREE.allowance.budget;
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
  it("allows exactly the plan's delivered games per calendar month, then refuses", async () => {
    const u = await createTestUser();
    for (let i = 0; i < FREE_GAMES; i++) {
      const { job } = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs });
      expect((await getAllowanceSummary(u.id)).reserved).toBe(1);
      expect(await deliverGame(job.id, u.id)).toBe(true);
    }
    const s = await getAllowanceSummary(u.id);
    expect(s).toMatchObject({ plan: "FREE", limit: FREE_GAMES, used: FREE_GAMES, reserved: 0, remaining: 0 });
    expect(await code(startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs }))).toBe("ALLOWANCE_EXHAUSTED");
  });

  it("resets in the next calendar month (period follows the clock, not the client)", async () => {
    const u = await createTestUser();
    const jan = new Date("2027-01-15T12:00:00Z");
    for (let i = 0; i < FREE_GAMES; i++) {
      const g = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs, now: jan });
      await deliverGame(g.job.id, u.id);
    }
    expect(await code(startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs, now: new Date("2027-01-31T23:59:59Z") }))).toBe("ALLOWANCE_EXHAUSTED");
    const feb = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs, now: new Date("2027-02-01T00:00:00Z") });
    expect(feb.created).toBe(true);
  });

  it("a FAILED generation releases the credit — the user can try again and is not charged", async () => {
    const u = await createTestUser();
    const { job } = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs });
    expect(await failJob(job.id, "PROVIDER_ERROR", "The AI provider is unavailable.")).toBe(true);
    expect(await getAllowanceSummary(u.id)).toMatchObject({ used: 0, reserved: 0, remaining: FREE_GAMES });
    const retry = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs });
    expect(retry.created).toBe(true);
  });
});

describe("allowance: PLUS and PRO (real levels and point costs)", () => {
  // these tests are about the points model itself, so they use the plans' real levels (no tier override)
  beforeEach(() => setFeatureTierForTests(null));
  const start = (userId: string, level: FeatureTier, now?: Date) => startGenerationJob({ userId, idempotencyKey: key(), request, level, deadlineMs, now });

  it("PLUS: 1 topic at level A uses all 3 points; 3 topics at level B are the alternative", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PLUS");
    const a = await start(u.id, "A");
    expect(a.job.cost).toBe(costOf("PLUS", "A"));
    await deliverGame(a.job.id, u.id);
    expect(await getAllowanceSummary(u.id)).toMatchObject({ plan: "PLUS", source: "SUBSCRIPTION", limit: 3, used: 3, remaining: 0 });
    expect(await code(start(u.id, "C"))).toBe("ALLOWANCE_EXHAUSTED");

    const v = await createTestUser();
    await grantSubscription(v.id, "PLUS");
    for (let i = 0; i < 3; i++) await deliverGame((await start(v.id, "B")).job.id, v.id);
    expect(await getAllowanceSummary(v.id)).toMatchObject({ used: 3, remaining: 0 });
    expect(await code(start(v.id, "B"))).toBe("ALLOWANCE_EXHAUSTED");
  });

  it("PRO: exactly 5 topics at level A per billing period, the sixth is refused; a refused start holds nothing", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PRO");
    for (let i = 0; i < 5; i++) {
      const { job } = await start(u.id, "A");
      expect(job.cost).toBe(2);
      await deliverGame(job.id, u.id);
    }
    expect(await getAllowanceSummary(u.id)).toMatchObject({ plan: "PRO", limit: 10, used: 10, remaining: 0 });
    expect(await code(start(u.id, "A"))).toBe("ALLOWANCE_EXHAUSTED");
    expect(await getAllowanceSummary(u.id)).toMatchObject({ reserved: 0, used: 10 });
  });

  it("a level the plan does not offer is refused inside the reservation transaction (Free never makes A)", async () => {
    const u = await createTestUser();
    const r = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, level: "A", deadlineMs }).catch((e: unknown) => e);
    expect(r).toBeInstanceOf(ApiError);
    expect((r as ApiError).code).toBe("FEATURE_TIER_LOCKED");
    expect(await db.generationJob.count({ where: { userId: u.id } })).toBe(0);
  });

  it("a new billing period grants a fresh allowance (renewal)", async () => {
    const u = await createTestUser();
    const begin = new Date(Date.now() - 5 * 86_400_000);
    await grantSubscription(u.id, "PLUS", { start: begin });
    const a = await start(u.id, "A");
    await deliverGame(a.job.id, u.id);
    expect((await getAllowanceSummary(u.id)).remaining).toBe(0);
    // The renewal webhook moves the subscription into its next paid period.
    const nextStart = new Date(begin.getTime() + 30 * 86_400_000);
    await grantSubscription(u.id, "PLUS", { start: nextStart, end: new Date(nextStart.getTime() + 30 * 86_400_000) });
    const later = new Date(nextStart.getTime() + 3600_000);
    expect((await getAllowanceSummary(u.id, later)).remaining).toBe(PLANS.PLUS.allowance.budget);
    expect((await start(u.id, "A", later)).created).toBe(true);
  });

  it("upgrading PLUS → PRO inside the same period raises the budget but keeps points already spent", async () => {
    const u = await createTestUser();
    const begin = new Date(Date.now() - 2 * 86_400_000);
    await grantSubscription(u.id, "PLUS", { start: begin });
    const a = await start(u.id, "B");
    await deliverGame(a.job.id, u.id);
    await grantSubscription(u.id, "PRO", { start: begin });
    // the budget refreshes lazily when the next generation resolves the period
    const b = await start(u.id, "A");
    await deliverGame(b.job.id, u.id);
    expect(await getAllowanceSummary(u.id)).toMatchObject({ plan: "PRO", limit: 10, used: 3, remaining: 7 });
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

  it("points reservation is atomic: 25 concurrent 2-point reservations against Pro's 10 points succeed exactly 5 times", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PRO");
    const ent = await resolveEntitlement(u.id);
    const period = await db.$transaction((tx) => ensurePeriod(tx, u.id, ent));
    expect(period.limit).toBe(PLANS.PRO.allowance.budget);
    const cost = costOf("PRO", "A")!;
    const outcomes = await Promise.all(Array.from({ length: 25 }, () => db.$transaction((tx) => reserveCredit(tx, period.id, cost))));
    expect(outcomes.filter(Boolean)).toHaveLength(Math.floor(PLANS.PRO.allowance.budget / cost));
    const row = await db.allowancePeriod.findUniqueOrThrow({ where: { id: period.id } });
    expect(row.reserved).toBe(PLANS.PRO.allowance.budget);
    expect(row.used + row.reserved).toBeLessThanOrEqual(row.limit);
  });

  it("a reservation larger than the points left is refused whole (never a partial hold)", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PLUS");
    const ent = await resolveEntitlement(u.id);
    const period = await db.$transaction((tx) => ensurePeriod(tx, u.id, ent));
    expect(await db.$transaction((tx) => reserveCredit(tx, period.id, 1))).toBe(true);
    expect(await db.$transaction((tx) => reserveCredit(tx, period.id, costOf("PLUS", "A")!))).toBe(false);
    expect((await db.allowancePeriod.findUniqueOrThrow({ where: { id: period.id } })).reserved).toBe(1);
    await expect(db.$transaction((tx) => reserveCredit(tx, period.id, 0))).rejects.toThrow(/invalid allowance cost/);
  });

  it("settling twice (finish racing with the timeout reaper) never double-charges or double-refunds", async () => {
    const u = await createTestUser();
    const { job } = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs });
    const [delivered, failed] = await Promise.all([deliverGame(job.id, u.id), failJob(job.id, "TIMEOUT", "late")]);
    expect([delivered, failed].filter(Boolean)).toHaveLength(1);
    const s = await getAllowanceSummary(u.id);
    expect(s.reserved).toBe(0);
    expect(s.used + s.remaining).toBe(FREE_GAMES);
    const records = await db.usageRecord.findMany({ where: { jobId: job.id } });
    expect(records.filter((r) => r.kind !== "RESERVE")).toHaveLength(1);
  });

  it("jobs that exceed their deadline are reaped and their credit returned", async () => {
    const u = await createTestUser();
    const { job } = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs: 1000 });
    expect(await reapExpiredJobs(new Date(Date.now() + 5000), u.id)).toBe(1);
    const after = await db.generationJob.findUniqueOrThrow({ where: { id: job.id } });
    expect(after).toMatchObject({ status: "FAILED", errorCode: "TIMEOUT" });
    expect(await getAllowanceSummary(u.id)).toMatchObject({ remaining: FREE_GAMES, reserved: 0, used: 0 });
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
