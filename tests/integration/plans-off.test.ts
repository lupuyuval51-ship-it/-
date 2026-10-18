import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { levelsAllowed, quotaOf } from "@/config/plans";
import { computeEntitlement } from "@/server/allowance/entitlement";
import { startCheckout } from "@/server/billing/service";
import { resetEnvForTests } from "@/server/env";
import { setFeatureTierForTests } from "@/server/games/feature-tier";
import { getAllowanceSummary } from "@/server/allowance/summary";
import { disconnectDb } from "@/server/db";
import { startGenerationJob } from "@/server/generation/jobs";
import { createTestUser } from "./helpers";

afterAll(disconnectDb);

// With PLANS_ENABLED=false nobody has a plan: everybody gets the full product and checkout does not exist.
describe("plans switched off", () => {
  // the real levels and quotas (the shared setup's tier override would hide them)
  beforeEach(() => { process.env.PLANS_ENABLED = "false"; resetEnvForTests(); setFeatureTierForTests(null); });
  afterEach(() => { process.env.PLANS_ENABLED = "true"; resetEnvForTests(); });

  it("gives every account the full allowance, with no subscription", () => {
    const e = computeEntitlement(null, new Date("2026-11-15T10:00:00Z"));
    expect(e.plan).toBe("PRO");
    expect(e.source).toBe("FREE");
    expect(e.subscriptionId).toBeNull();
    // the full product: Pro's quota at every level (A included) as fair use, per UTC calendar month
    expect(e.quotas).toEqual({ A: quotaOf("PRO", "A"), B: quotaOf("PRO", "B"), C: null });
    expect(e.quotas).toEqual({ A: 5, B: 10, C: null });
    expect(levelsAllowed(e.plan)).toEqual(["A", "B", "C"]);
    expect([e.periodStart.toISOString(), e.periodEnd.toISOString()]).toEqual(["2026-11-01T00:00:00.000Z", "2026-12-01T00:00:00.000Z"]);
  });

  it("every account makes games at every level, each counted against Pro's own quota for the month", async () => {
    const u = await createTestUser();
    const request = { mode: "FAST", subject: "x", learningGoal: "y", difficulty: "beginner", gameType: "adventure", contentLanguage: "en" } as const;
    const { job } = await startGenerationJob({ userId: u.id, idempotencyKey: `off-${u.id}`, request, level: "A", deadlineMs: 60_000 });
    expect(job.featureTier).toBe("A");
    const s = await getAllowanceSummary(u.id);
    expect(s).toMatchObject({ plan: "PRO", source: "FREE" });
    expect(s.levels.A).toMatchObject({ limit: 5, used: 0, reserved: 1, remaining: 4 });
    expect(s.levels.B).toMatchObject({ limit: 10, reserved: 0, remaining: 10 });
    expect(s.levels.C).toMatchObject({ limit: null, remaining: null });
  });

  it("refuses to start a checkout", async () => {
    await expect(startCheckout({ id: "u", email: "a@b.c", country: null }, "PLUS")).rejects.toMatchObject({ status: 404 });
  });
});
