import { levelQuota } from "@/server/games/feature-tier";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, disconnectDb } from "@/server/db";
import { resetEnvForTests } from "@/server/env";
import { getAllowanceSummary } from "@/server/allowance/summary";
import { resolveEntitlement } from "@/server/allowance/entitlement";
import { resolveRender } from "@/server/games/play";
import { startGenerationJob, succeedJob } from "@/server/generation/jobs";
import { completeDevCheckout, getBillingView, setCancellation, simulateDevEvent, startCheckout } from "@/server/billing/service";
import { setGatewayForTests } from "@/server/billing/gateway";
import { ApiError } from "@/server/http/errors";
import { POST as checkoutRoute } from "@/app/api/billing/checkout/route";
import { POST as devCompleteRoute } from "@/app/api/billing/dev/complete/route";
import { GET as statusRoute } from "@/app/api/billing/status/route";
import { createTestUser, levelAllowance, makeRequest, readJson } from "./helpers";

beforeAll(() => {
  process.env.PAYMENTS_MODE = "dev";
  resetEnvForTests();
  setGatewayForTests(null);
});
afterAll(async () => {
  process.env.PAYMENTS_MODE = "disabled";
  resetEnvForTests();
  await disconnectDb();
});

const code = async (p: Promise<unknown>) => {
  try {
    await p;
    return "OK";
  } catch (e) {
    return e instanceof ApiError ? e.code : `ERR:${String(e)}`;
  }
};
const sessionIdOf = (url: string) => url.split("/").pop()!;

async function subscribe(u: { id: string; email: string; country?: string | null }, plan: "PLUS" | "PRO") {
  const { url } = await startCheckout({ id: u.id, email: u.email, country: u.country ?? null }, plan);
  await completeDevCheckout(u.id, sessionIdOf(url));
  return sessionIdOf(url);
}

describe("checkout pricing is decided by the server from the central plan config", () => {
  const cases = [
    { country: "IL", plan: "PLUS", currency: "ils", amount: 500 },
    { country: "US", plan: "PLUS", currency: "ils", amount: 500 },
    { country: undefined, plan: "PLUS", currency: "ils", amount: 500 },
    { country: "IL", plan: "PRO", currency: "ils", amount: 2000 }, // ₪20 in Israel
    { country: "DE", plan: "PRO", currency: "ils", amount: 2000 },
  ] as const;
  for (const c of cases) {
    it(`${c.plan} for ${c.country ?? "unknown region"} → ${c.amount} ${c.currency}`, async () => {
      const u = await createTestUser({ country: c.country });
      const { url } = await startCheckout({ id: u.id, email: u.email, country: c.country ?? null }, c.plan);
      expect(url).toMatch(/^\/billing\/dev-checkout\//);
      const row = await db.devCheckoutSession.findUniqueOrThrow({ where: { id: sessionIdOf(url) } });
      expect(row).toMatchObject({ userId: u.id, plan: c.plan, currency: c.currency, unitAmount: c.amount });
    });
  }

  it("ignores any amount/currency a client tries to send to the checkout API", async () => {
    const u = await createTestUser({ country: "IL" });
    const res = await checkoutRoute(makeRequest("POST", "/api/billing/checkout", { cookie: u.cookie, body: { plan: "PLUS", amount: 1, unitAmount: 1, currency: "usd" } }));
    expect(res.status).toBe(200);
    const { url } = await readJson<{ url: string }>(res);
    const row = await db.devCheckoutSession.findUniqueOrThrow({ where: { id: sessionIdOf(url) } });
    expect(row).toMatchObject({ currency: "ils", unitAmount: 500 });
  });

  it("requires authentication and a same-origin request, and refuses FREE as a purchasable plan", async () => {
    const u = await createTestUser();
    expect((await checkoutRoute(makeRequest("POST", "/api/billing/checkout", { body: { plan: "PLUS" } }))).status).toBe(401);
    expect((await checkoutRoute(makeRequest("POST", "/api/billing/checkout", { cookie: u.cookie, body: { plan: "PLUS" }, origin: "https://evil.example" }))).status).toBe(403);
    expect((await checkoutRoute(makeRequest("POST", "/api/billing/checkout", { cookie: u.cookie, body: { plan: "FREE" } }))).status).toBe(400);
  });
});

describe("simulated subscription lifecycle (same ingest pipeline as Stripe webhooks)", () => {
  it("Plus: completing checkout grants PLUS (its quotas, tier A) and completing twice never double-grants", async () => {
    const u = await createTestUser({ country: "IL" });
    const { url } = await startCheckout({ id: u.id, email: u.email, country: "IL" }, "PLUS");
    const id = sessionIdOf(url);
    const a = await completeDevCheckout(u.id, id);
    const b = await completeDevCheckout(u.id, id);
    expect(a.plan).toBe("PLUS");
    expect(b.plan).toBe("PLUS");
    expect(await db.subscription.count({ where: { userId: u.id } })).toBe(1);
    expect(await db.webhookEvent.count({ where: { id: { startsWith: `evt_dev_${id}` } } })).toBe(2);
    const sub = await db.subscription.findUniqueOrThrow({ where: { userId: u.id } });
    expect(sub).toMatchObject({ provider: "DEV", plan: "PLUS", status: "ACTIVE", currency: "ils", unitAmount: 500 });
    expect((await getAllowanceSummary(u.id)).plan).toBe("PLUS");
    expect(await levelAllowance(u.id)).toMatchObject({ limit: levelQuota("PLUS", "A"), remaining: levelQuota("PLUS", "A") });
    expect((await resolveRender(u.id)).tier).toBe("A");
  });

  it("Pro: its quotas per billing period and the very same Tier A graphics as Plus", async () => {
    const plus = await createTestUser({ country: "US" });
    const pro = await createTestUser({ country: "IL" });
    await subscribe(plus, "PLUS");
    await subscribe(pro, "PRO");
    expect((await getAllowanceSummary(pro.id)).plan).toBe("PRO");
    expect(await levelAllowance(pro.id)).toMatchObject({ limit: levelQuota("PRO", "A"), remaining: levelQuota("PRO", "A") });
    const [rp, rr] = [await resolveRender(plus.id), await resolveRender(pro.id)];
    expect(rr.tier).toBe(rp.tier);
    expect(rr.profile).toEqual(rp.profile);
    const sub = await db.subscription.findUniqueOrThrow({ where: { userId: pro.id } });
    expect(sub).toMatchObject({ currency: "ils", unitAmount: 2000 });
  });

  it("another user cannot complete my checkout, and a second checkout is refused while subscribed", async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const { url } = await startCheckout({ id: owner.id, email: owner.email, country: null }, "PLUS");
    const res = await devCompleteRoute(makeRequest("POST", "/api/billing/dev/complete", { cookie: other.cookie, body: { checkoutId: sessionIdOf(url) } }));
    expect(res.status).toBe(404);
    expect((await getBillingView(owner.id)).plan).toBe("FREE");
    await completeDevCheckout(owner.id, sessionIdOf(url));
    expect(await code(startCheckout({ id: owner.id, email: owner.email, country: null }, "PRO"))).toBe("ALREADY_SUBSCRIBED");
  });

  it("cancel keeps the plan until the period ends; resume restores renewal", async () => {
    const u = await createTestUser();
    await subscribe(u, "PLUS");
    const canceled = await setCancellation(u.id, true);
    expect(canceled.plan).toBe("PLUS");
    expect(canceled.subscription).toMatchObject({ cancelAtPeriodEnd: true, status: "ACTIVE", suspended: null, simulated: true });
    const resumed = await setCancellation(u.id, false);
    expect(resumed.subscription?.cancelAtPeriodEnd).toBe(false);
  });

  it("failed payment pauses paid features; a successful renewal restores them with a fresh allowance period", async () => {
    const u = await createTestUser();
    await subscribe(u, "PLUS");
    // make one Plus game (the suite runs at level A only, see setup.ts)
    const request = { mode: "FAST", subject: "x", learningGoal: "y", difficulty: "beginner", gameType: "adventure", contentLanguage: "en" } as const;
    const { job } = await startGenerationJob({ userId: u.id, idempotencyKey: `k-${u.id}-1`, request, deadlineMs: 60_000 });
    await succeedJob(job.id, async (tx) => {
      const g = await tx.game.create({ data: { ownerId: u.id, title: "T", subject: "S", gameType: "adventure", difficulty: "beginner", language: "en", createdVia: "FAST", generatorKind: "demo", generatorProvider: "demo", generatorModel: "demo", spec: {} } });
      return { gameId: g.id };
    });
    expect((await getAllowanceSummary(u.id)).plan).toBe("PLUS");
    expect(await levelAllowance(u.id)).toMatchObject({ used: 1, remaining: levelQuota("PLUS", "A")! - 1 });

    const failed = await simulateDevEvent(u.id, "payment_failed");
    expect(failed.plan).toBe("FREE");
    expect(failed.subscription).toMatchObject({ status: "PAST_DUE", suspended: "past_due" });
    expect((await resolveEntitlement(u.id)).source).toBe("FREE");

    const renewed = await simulateDevEvent(u.id, "renew");
    expect(renewed.plan).toBe("PLUS");
    expect(renewed.subscription).toMatchObject({ status: "ACTIVE", suspended: null });
    // new billing period → the Plus games are available again (the old period's use does not carry over)
    expect((await getAllowanceSummary(u.id)).plan).toBe("PLUS");
    expect(await levelAllowance(u.id)).toMatchObject({ used: 0, remaining: levelQuota("PLUS", "A") });
  });

  it("a full refund suspends paid features for that period only; the next paid renewal restores them", async () => {
    const u = await createTestUser();
    await subscribe(u, "PRO");
    const refunded = await simulateDevEvent(u.id, "refund");
    expect(refunded.plan).toBe("FREE");
    expect(refunded.subscription).toMatchObject({ status: "ACTIVE", suspended: "refunded" });
    expect((await resolveRender(u.id)).tier).not.toBe("A");
    const renewed = await simulateDevEvent(u.id, "renew");
    expect(renewed.plan).toBe("PRO");
  });

  it("the simulator is unreachable when payments are not in dev mode, and in production", async () => {
    const u = await createTestUser();
    const { url } = await startCheckout({ id: u.id, email: u.email, country: null }, "PLUS");
    process.env.PAYMENTS_MODE = "disabled";
    resetEnvForTests();
    setGatewayForTests(null);
    expect(await code(completeDevCheckout(u.id, sessionIdOf(url)))).toMatch(/^ERR:/);
    expect(await code(startCheckout({ id: u.id, email: u.email, country: null }, "PLUS"))).toBe("PAYMENTS_DISABLED");
    expect((await getBillingView(u.id)).plan).toBe("FREE");
    process.env.PAYMENTS_MODE = "dev";
    resetEnvForTests();
    setGatewayForTests(null);
  });

  it("status endpoint reflects the persisted subscription for the signed-in user only", async () => {
    const u = await createTestUser();
    expect((await statusRoute(makeRequest("GET", "/api/billing/status"))).status).toBe(401);
    await subscribe(u, "PLUS");
    const body = await readJson<{ plan: string; payments: { mode: string } }>(await statusRoute(makeRequest("GET", "/api/billing/status", { cookie: u.cookie })));
    expect(body.plan).toBe("PLUS");
    expect(body.payments.mode).toBe("dev");
  });
});
