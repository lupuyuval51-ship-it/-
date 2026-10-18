import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db, disconnectDb } from "@/server/db";
import { getAllowanceSummary } from "@/server/allowance/summary";
import { resolveEntitlement } from "@/server/allowance/entitlement";
import { ensurePeriod } from "@/server/allowance/periods";
import { reserveSlot } from "@/server/allowance/ledger";
import { failJob, reapExpiredJobs, startGenerationJob, succeedJob } from "@/server/generation/jobs";
import type { GenerationRequest } from "@/lib/schemas/generation";
import { ApiError } from "@/server/http/errors";
import { createTestUser, grantSubscription, levelAllowance } from "./helpers";
import { quotaOf, type FeatureTier } from "@/config/plans";
import { levelQuota, setFeatureTierForTests } from "@/server/games/feature-tier";

afterAll(disconnectDb);

const request: GenerationRequest = {
  mode: "FAST", subject: "Python loops", learningGoal: "Understand for loops", difficulty: "beginner", gameType: "adventure", contentLanguage: "en",
};
// Under the suite's tier override every game is a level A game, with the plan's largest counted quota (read lazily:
// the override is set before each test).
const freeGames = () => levelQuota("FREE", "A")!;
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
async function refusal(p: Promise<unknown>): Promise<{ code: string; details?: Record<string, unknown> }> {
  try {
    await p;
    return { code: "OK" };
  } catch (e) {
    return e instanceof ApiError ? { code: e.code, details: e.details as Record<string, unknown> } : { code: `ERR:${String(e)}` };
  }
}

describe("allowance: FREE", () => {
  it("allows exactly the level's delivered games per calendar month, then refuses", async () => {
    const u = await createTestUser();
    for (let i = 0; i < freeGames(); i++) {
      const { job } = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs });
      expect((await levelAllowance(u.id)).reserved).toBe(1);
      expect(await deliverGame(job.id, u.id)).toBe(true);
    }
    expect((await getAllowanceSummary(u.id)).plan).toBe("FREE");
    expect(await levelAllowance(u.id)).toMatchObject({ limit: freeGames(), used: freeGames(), reserved: 0, remaining: 0 });
    expect(await code(startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs }))).toBe("ALLOWANCE_EXHAUSTED");
  });

  it("resets in the next calendar month (period follows the clock, not the client)", async () => {
    const u = await createTestUser();
    const jan = new Date("2027-01-15T12:00:00Z");
    for (let i = 0; i < freeGames(); i++) {
      const g = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs, now: jan });
      await deliverGame(g.job.id, u.id);
    }
    expect(await code(startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs, now: new Date("2027-01-31T23:59:59Z") }))).toBe("ALLOWANCE_EXHAUSTED");
    const feb = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs, now: new Date("2027-02-01T00:00:00Z") });
    expect(feb.created).toBe(true);
  });

  it("a FAILED generation releases the held game — the user can try again and is not charged", async () => {
    const u = await createTestUser();
    const { job } = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs });
    expect(await failJob(job.id, "PROVIDER_ERROR", "The AI provider is unavailable.")).toBe(true);
    expect(await levelAllowance(u.id)).toMatchObject({ used: 0, reserved: 0, remaining: freeGames() });
    const retry = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs });
    expect(retry.created).toBe(true);
  });
});

describe("allowance: a separate quota per level (real levels and quotas)", () => {
  // these tests are about the per-level quotas themselves, so they use the plans' real levels (no tier override)
  beforeEach(() => setFeatureTierForTests(null));
  const start = (userId: string, level: FeatureTier, now?: Date) => startGenerationJob({ userId, idempotencyKey: key(), request, level, deadlineMs, now });
  const make = async (userId: string, level: FeatureTier, times = 1, now?: Date) => {
    for (let i = 0; i < times; i++) expect(await deliverGame((await start(userId, level, now)).job.id, userId), `${level} #${i + 1}`).toBe(true);
  };

  it("FREE: 1 topic at level B and 5 at level C per month, each its own count; the refusal names the level, what is left and the reset", async () => {
    const u = await createTestUser();
    await make(u.id, "B");
    let s = await getAllowanceSummary(u.id);
    expect(s.levels.B).toMatchObject({ limit: 1, used: 1, reserved: 0, remaining: 0 });
    expect(s.levels.C).toMatchObject({ limit: quotaOf("FREE", "C"), used: 0, remaining: 5 }); // B never touches C
    const r = await refusal(start(u.id, "B"));
    expect(r).toMatchObject({ code: "ALLOWANCE_EXHAUSTED", details: { level: "B", remaining: 0, limit: 1, resetsAt: s.periodEnd } });
    await make(u.id, "C", 5);
    expect(await code(start(u.id, "C"))).toBe("ALLOWANCE_EXHAUSTED");
    s = await getAllowanceSummary(u.id);
    expect([s.levels.B.used, s.levels.C.used, s.levels.A.used]).toEqual([1, 5, 0]);
    expect(s.levels.A).toMatchObject({ limit: 0, remaining: 0 });
    // the refused starts held nothing and left no job behind
    expect(s.levels.B.reserved + s.levels.C.reserved).toBe(0);
    expect(await db.generationJob.count({ where: { userId: u.id } })).toBe(6);
  });

  it("PLUS: 5 at A, 10 at B and unlimited C — using one level never reduces another", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PLUS");
    await make(u.id, "A", 5);
    expect(await code(start(u.id, "A"))).toBe("ALLOWANCE_EXHAUSTED");
    expect(await levelAllowance(u.id, "B")).toMatchObject({ limit: 10, used: 0, remaining: 10 });
    await make(u.id, "B", 10);
    expect(await code(start(u.id, "B"))).toBe("ALLOWANCE_EXHAUSTED");
    // level C is never refused by a count (more games than any counted quota), and its use is still counted
    await make(u.id, "C", 7);
    const s = await getAllowanceSummary(u.id);
    expect(s).toMatchObject({ plan: "PLUS", source: "SUBSCRIPTION" });
    expect(s.levels.A).toMatchObject({ limit: 5, used: 5, remaining: 0 });
    expect(s.levels.B).toMatchObject({ limit: 10, used: 10, remaining: 0 });
    expect(s.levels.C).toMatchObject({ limit: null, used: 7, reserved: 0, remaining: null });
  });

  it("PRO: exactly 5 topics at level A per billing period, the sixth is refused and holds nothing; B keeps all 10", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PRO");
    for (let i = 0; i < 5; i++) {
      const { job } = await start(u.id, "A");
      expect(job.featureTier).toBe("A");
      await deliverGame(job.id, u.id);
    }
    expect(await code(start(u.id, "A"))).toBe("ALLOWANCE_EXHAUSTED");
    const s = await getAllowanceSummary(u.id);
    expect(s.levels.A).toMatchObject({ limit: 5, used: 5, reserved: 0, remaining: 0 });
    expect(s.levels.B).toMatchObject({ limit: 10, used: 0, remaining: 10 });
    await make(u.id, "B", 10);
    expect(await code(start(u.id, "B"))).toBe("ALLOWANCE_EXHAUSTED");
  });

  it("a level the plan does not offer is refused inside the reservation transaction (Free never makes A)", async () => {
    const u = await createTestUser();
    const r = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, level: "A", deadlineMs }).catch((e: unknown) => e);
    expect(r).toBeInstanceOf(ApiError);
    expect((r as ApiError).code).toBe("FEATURE_TIER_LOCKED");
    expect(await db.generationJob.count({ where: { userId: u.id } })).toBe(0);
  });

  it("a new billing period grants fresh quotas at every level (renewal)", async () => {
    const u = await createTestUser();
    const begin = new Date(Date.now() - 5 * 86_400_000);
    await grantSubscription(u.id, "PLUS", { start: begin });
    await make(u.id, "A", 5);
    await make(u.id, "B");
    expect((await levelAllowance(u.id, "A")).remaining).toBe(0);
    // The renewal webhook moves the subscription into its next paid period.
    const nextStart = new Date(begin.getTime() + 30 * 86_400_000);
    await grantSubscription(u.id, "PLUS", { start: nextStart, end: new Date(nextStart.getTime() + 30 * 86_400_000) });
    const later = new Date(nextStart.getTime() + 3600_000);
    const s = await getAllowanceSummary(u.id, later);
    expect([s.levels.A.remaining, s.levels.B.remaining, s.levels.C.remaining]).toEqual([5, 10, null]);
    expect((await start(u.id, "A", later)).created).toBe(true);
  });

  it("switching PLUS → PRO inside the same period keeps what was used at each level (Plus and Pro have the same game quotas)", async () => {
    const u = await createTestUser();
    const begin = new Date(Date.now() - 2 * 86_400_000);
    await grantSubscription(u.id, "PLUS", { start: begin });
    await make(u.id, "A", 2);
    await make(u.id, "B");
    await grantSubscription(u.id, "PRO", { start: begin });
    // the limits refresh lazily when the next generation resolves the period
    await make(u.id, "A");
    const s = await getAllowanceSummary(u.id);
    expect(s.plan).toBe("PRO");
    expect(s.levels.A).toMatchObject({ limit: 5, used: 3, remaining: 2 });
    expect(s.levels.B).toMatchObject({ limit: 10, used: 1, remaining: 9 });
    const row = await db.allowanceQuota.findMany({ where: { allowancePeriod: { userId: u.id } }, orderBy: { level: "asc" } });
    expect(row.map((r) => [r.level, r.limit, r.used])).toEqual([["A", 5, 3], ["B", 10, 1], ["C", null, 0]]);
  });

  it("a job settles exactly the level and period it reserved, even when the plan changed while it ran", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PLUS");
    const { job } = await start(u.id, "B");
    const plusPeriod = job.allowancePeriodId!;
    // the subscription is cancelled while the game is being made: the account falls back to Free (another period)
    await grantSubscription(u.id, "PLUS", { status: "CANCELED" });
    expect(await deliverGame(job.id, u.id)).toBe(true);
    const counters = await db.allowanceQuota.findMany({ where: { allowancePeriodId: plusPeriod }, orderBy: { level: "asc" } });
    expect(counters.map((c) => [c.level, c.used, c.reserved])).toEqual([["A", 0, 0], ["B", 1, 0], ["C", 0, 0]]);
    // the Free month the account is in now was not touched
    const s = await getAllowanceSummary(u.id);
    expect(s.plan).toBe("FREE");
    expect([s.levels.B.used, s.levels.C.used]).toEqual([0, 0]);
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
  it("the same idempotency key returns the same job and reserves only ONE game", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PRO");
    const k = key();
    const rs = await Promise.all([1, 2, 3].map(() => startGenerationJob({ userId: u.id, idempotencyKey: k, request, deadlineMs })));
    expect(new Set(rs.map((r) => r.job.id)).size).toBe(1);
    expect(rs.filter((r) => r.created)).toHaveLength(1);
    expect((await levelAllowance(u.id)).reserved).toBe(1);
  });

  it("20 parallel requests with different keys create exactly ONE job (no parallel generations) and one reservation", async () => {
    const u = await createTestUser();
    await grantSubscription(u.id, "PRO");
    const results = await Promise.all(Array.from({ length: 20 }, () => code(startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs }))));
    expect(results.filter((r) => r === "OK")).toHaveLength(1);
    expect(results.filter((r) => r === "JOB_IN_PROGRESS" || r === "ALLOWANCE_EXHAUSTED")).toHaveLength(19);
    const a = await levelAllowance(u.id);
    expect(a.reserved).toBe(1);
    expect(a.used).toBe(0);
  });

  it("reservation is atomic per level: 20 concurrent A and 20 concurrent B holds against Pro's 5 A and 10 B succeed exactly 5 and 10 times", async () => {
    setFeatureTierForTests(null);
    const u = await createTestUser();
    await grantSubscription(u.id, "PRO");
    const ent = await resolveEntitlement(u.id);
    const period = await db.$transaction((tx) => ensurePeriod(tx, u.id, ent));
    expect(period.levels.A.limit).toBe(quotaOf("PRO", "A"));
    expect(period.levels.B.limit).toBe(quotaOf("PRO", "B"));
    const levels: FeatureTier[] = [...Array.from({ length: 20 }, () => "A" as const), ...Array.from({ length: 20 }, () => "B" as const)];
    const outcomes = await Promise.all(levels.map((l) => db.$transaction((tx) => reserveSlot(tx, period.id, l)).then((ok) => [l, ok] as const)));
    expect(outcomes.filter(([l, ok]) => l === "A" && ok)).toHaveLength(5);
    expect(outcomes.filter(([l, ok]) => l === "B" && ok)).toHaveLength(10);
    const rows = await db.allowanceQuota.findMany({ where: { allowancePeriodId: period.id }, orderBy: { level: "asc" } });
    expect(rows.map((r) => [r.level, r.reserved])).toEqual([["A", 5], ["B", 10], ["C", 0]]);
    for (const r of rows) if (r.limit !== null) expect(r.used + r.reserved).toBeLessThanOrEqual(r.limit);
  });

  it("an unlimited level is never refused by the count (its use is counted); a level the plan does not offer holds nothing", async () => {
    setFeatureTierForTests(null);
    const u = await createTestUser();
    await grantSubscription(u.id, "PLUS");
    const period = await db.$transaction(async (tx) => ensurePeriod(tx, u.id, await resolveEntitlement(u.id, new Date(), tx)));
    const many = await Promise.all(Array.from({ length: 30 }, () => db.$transaction((tx) => reserveSlot(tx, period.id, "C"))));
    expect(many.every(Boolean)).toBe(true);
    expect((await db.allowanceQuota.findUniqueOrThrow({ where: { allowancePeriodId_level: { allowancePeriodId: period.id, level: "C" } } })).reserved).toBe(30);
    await expect(db.$transaction((tx) => reserveSlot(tx, period.id, "D" as FeatureTier))).rejects.toThrow(/invalid allowance level/);

    const free = await createTestUser();
    const freePeriod = await db.$transaction(async (tx) => ensurePeriod(tx, free.id, await resolveEntitlement(free.id, new Date(), tx)));
    expect(freePeriod.levels.A.limit).toBe(0);
    expect(await db.$transaction((tx) => reserveSlot(tx, freePeriod.id, "A"))).toBe(false);
    expect((await levelAllowance(free.id, "A")).reserved).toBe(0);
  });

  it("settling twice (finish racing with the timeout reaper) never double-charges or double-refunds", async () => {
    const u = await createTestUser();
    const { job } = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs });
    const [delivered, failed] = await Promise.all([deliverGame(job.id, u.id), failJob(job.id, "TIMEOUT", "late")]);
    expect([delivered, failed].filter(Boolean)).toHaveLength(1);
    const a = await levelAllowance(u.id);
    expect(a.reserved).toBe(0);
    expect(a.used + a.remaining!).toBe(freeGames());
    const records = await db.usageRecord.findMany({ where: { jobId: job.id } });
    expect(records.filter((r) => r.kind !== "RESERVE")).toHaveLength(1);
  });

  it("jobs that exceed their deadline are reaped and their held game returned", async () => {
    const u = await createTestUser();
    const { job } = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs: 1000 });
    expect(await reapExpiredJobs(new Date(Date.now() + 5000), u.id)).toBe(1);
    const after = await db.generationJob.findUniqueOrThrow({ where: { id: job.id } });
    expect(after).toMatchObject({ status: "FAILED", errorCode: "TIMEOUT" });
    expect(await levelAllowance(u.id)).toMatchObject({ remaining: freeGames(), reserved: 0, used: 0 });
  });

  it("a late worker cannot deliver after its job was reaped (no orphan game, no charge)", async () => {
    const u = await createTestUser();
    const { job } = await startGenerationJob({ userId: u.id, idempotencyKey: key(), request, deadlineMs: 1000 });
    await reapExpiredJobs(new Date(Date.now() + 5000), u.id);
    expect(await deliverGame(job.id, u.id)).toBe(false);
    expect(await db.game.count({ where: { ownerId: u.id } })).toBe(0);
    expect((await levelAllowance(u.id)).used).toBe(0);
  });

  it("the database itself rejects negative counters", async () => {
    const u = await createTestUser();
    const ent = await resolveEntitlement(u.id);
    const period = await db.$transaction((tx) => ensurePeriod(tx, u.id, ent));
    await expect(db.$executeRaw`UPDATE "AllowanceQuota" SET "reserved" = -1 WHERE "allowancePeriodId" = ${period.id}`).rejects.toThrow();
    await expect(db.$executeRaw`UPDATE "AllowanceQuota" SET "used" = -1 WHERE "allowancePeriodId" = ${period.id}`).rejects.toThrow();
    await expect(db.$executeRaw`UPDATE "AllowanceQuota" SET "limit" = -1 WHERE "allowancePeriodId" = ${period.id}`).rejects.toThrow();
  });
});
