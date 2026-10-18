import { PLANS, type PlanId } from "@/config/plans";
import { levelQuotas } from "@/server/games/feature-tier";
import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, disconnectDb } from "@/server/db";
import { resetEnvForTests } from "@/server/env";
import { resolveEntitlement } from "@/server/allowance/entitlement";
import { chargeObject, invoiceObject, stripeEvent, subscriptionObject, type SimSubscription } from "@/server/billing/events";
import { setGatewayForTests, type PaymentGateway } from "@/server/billing/gateway";
import { getBillingView } from "@/server/billing/service";
import { POST as webhookRoute } from "@/app/api/webhooks/stripe/route";
import { createTestUser } from "./helpers";

const SECRET = "whsec_integration_test_secret";

beforeAll(() => {
  process.env.PAYMENTS_MODE = "stripe";
  process.env.STRIPE_SECRET_KEY = "sk_test_integration_placeholder";
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
  resetEnvForTests();
  // The only network call the webhook path can make is resolving a refunded charge to its invoice.
  const gw: PaymentGateway = {
    mode: "stripe",
    createCheckout: async () => ({ url: "https://example.test" }),
    createPortal: async () => null,
    setCancelAtPeriodEnd: async () => {
      throw new Error("not used");
    },
    retrieveCheckout: async () => null,
    invoiceIdForPaymentIntent: async (pi) => (pi.startsWith("pi_for_") ? pi.slice("pi_for_".length) : null),
  };
  setGatewayForTests(gw);
});
afterAll(async () => {
  process.env.PAYMENTS_MODE = "disabled";
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  resetEnvForTests();
  setGatewayForTests(null);
  await disconnectDb();
});

const DAY = 86_400_000;
const at = (offsetMs: number) => new Date(Math.floor((Date.now() + offsetMs) / 1000) * 1000);
const evId = () => `evt_${randomUUID().replace(/-/g, "")}`;

async function deliver(event: unknown, opts: { signature?: string | null; secret?: string; body?: string } = {}) {
  const body = opts.body ?? JSON.stringify(event);
  const signature = opts.signature === undefined ? Stripe.webhooks.generateTestHeaderString({ payload: body, secret: opts.secret ?? SECRET }) : opts.signature;
  const headers = new Headers({ "content-type": "application/json" });
  if (signature) headers.set("stripe-signature", signature);
  const res = await webhookRoute(new NextRequest("http://localhost:3000/api/webhooks/stripe", { method: "POST", headers, body }));
  return { status: res.status, json: (await res.json()) as Record<string, unknown> };
}

interface World {
  userId: string;
  sim: SimSubscription;
}
async function world(over: Partial<SimSubscription> & { country?: string } = {}): Promise<World> {
  const u = await createTestUser({ country: over.country });
  const plan = over.plan ?? "PLUS";
  const il = over.country === "IL" && plan === "PLUS";
  const sim: SimSubscription = {
    subscriptionId: `sub_${randomUUID().slice(0, 12)}`,
    customerId: `cus_${randomUUID().slice(0, 12)}`,
    userId: u.id,
    plan,
    status: "active",
    currency: il ? "ils" : "usd",
    unitAmount: PLANS[plan as PlanId].monthlyPrices[il ? "ILS" : "USD"]!,
    periodStart: at(-2 * DAY),
    periodEnd: at(28 * DAY),
    ...over,
  };
  delete (sim as { country?: string }).country;
  return { userId: u.id, sim };
}
const subEvent = (sim: SimSubscription, type = "customer.subscription.updated", created = at(0), id = evId()) => stripeEvent(id, type, created, subscriptionObject(sim));
const row = (userId: string) => db.subscription.findUniqueOrThrow({ where: { userId } });
const eventRow = (id: string) => db.webhookEvent.findUniqueOrThrow({ where: { id } });

describe("signature verification at the HTTP boundary", () => {
  it("rejects missing, forged, wrong-secret and tampered requests with 400 and stores nothing", async () => {
    const w = await world();
    const ev = subEvent(w.sim, "customer.subscription.created");
    const body = JSON.stringify(ev);
    expect((await deliver(ev, { signature: null })).status).toBe(400);
    expect((await deliver(ev, { signature: "t=1,v1=00" })).status).toBe(400);
    expect((await deliver(ev, { secret: "whsec_someone_else" })).status).toBe(400);
    const signed = Stripe.webhooks.generateTestHeaderString({ payload: body, secret: SECRET });
    expect((await deliver(ev, { signature: signed, body: body.replace('"unit_amount":1000', '"unit_amount":1'), })).status).toBe(400);
    expect(await db.webhookEvent.count({ where: { id: (ev as { id: string }).id } })).toBe(0);
    expect(await db.subscription.count({ where: { userId: w.userId } })).toBe(0);
  });

  it("is not available when Stripe mode is not configured", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "";
    resetEnvForTests();
    const w = await world();
    expect((await deliver(subEvent(w.sim, "customer.subscription.created"))).status).toBe(503);
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
    resetEnvForTests();
  });
});

describe("subscription events → entitlements", () => {
  it("created: Plus in Israel is exactly ₪10 and grants PLUS; entitlement follows the billing period", async () => {
    const w = await world({ country: "IL" });
    const res = await deliver(subEvent(w.sim, "customer.subscription.created"));
    expect(res).toMatchObject({ status: 200, json: { received: true, status: "processed" } });
    expect(await row(w.userId)).toMatchObject({ provider: "STRIPE", plan: "PLUS", status: "ACTIVE", currency: "ils", unitAmount: 1000 });
    const ent = await resolveEntitlement(w.userId);
    expect(ent).toMatchObject({ plan: "PLUS", source: "SUBSCRIPTION", quotas: levelQuotas("PLUS") });
    expect(ent.periodStart).toEqual(w.sim.periodStart);
    expect(ent.periodEnd).toEqual(w.sim.periodEnd);
  });

  it("Pro grants its quotas per billing period", async () => {
    const w = await world({ plan: "PRO", country: "IL" });
    await deliver(subEvent(w.sim, "customer.subscription.created"));
    expect(await resolveEntitlement(w.userId)).toMatchObject({ plan: "PRO", quotas: levelQuotas("PRO") });
  });

  it("a redelivered event is a no-op (idempotent), even when delivered concurrently", async () => {
    const w = await world();
    const ev = subEvent(w.sim, "customer.subscription.created");
    const results = await Promise.all(Array.from({ length: 6 }, () => deliver(ev)));
    expect(results.every((r) => r.status === 200)).toBe(true);
    expect(await db.webhookEvent.count({ where: { id: (ev as { id: string }).id } })).toBe(1);
    expect((await eventRow((ev as { id: string }).id)).status).toBe("PROCESSED");
    expect(await db.subscription.count({ where: { userId: w.userId } })).toBe(1);
    const again = await deliver(ev);
    expect(again.json.status).toBe("duplicate");
  });

  it("ignores out-of-order events: an older update never overwrites newer state", async () => {
    const w = await world();
    await deliver(subEvent(w.sim, "customer.subscription.created", at(-60_000)));
    await deliver(subEvent({ ...w.sim, cancelAtPeriodEnd: true }, "customer.subscription.updated", at(-10_000)));
    const stale = await deliver(subEvent({ ...w.sim, cancelAtPeriodEnd: false }, "customer.subscription.updated", at(-30_000)));
    expect(stale.json.status).toBe("ignored");
    expect((await row(w.userId)).cancelAtPeriodEnd).toBe(true);
  });

  it("rejects a price that does not match the configured plan price (fails closed, no entitlement)", async () => {
    const w = await world();
    const cheap = await deliver(subEvent({ ...w.sim, unitAmount: 100 }, "customer.subscription.created"));
    expect(cheap).toMatchObject({ status: 200, json: { status: "failed" } });
    const proAtPlusPrice = await deliver(subEvent({ ...w.sim, plan: "PRO" }, "customer.subscription.created")); // PRO at $10
    expect(proAtPlusPrice.json.status).toBe("failed");
    const proInIls = await deliver(subEvent({ ...w.sim, plan: "PRO", currency: "ils", unitAmount: 1000 }, "customer.subscription.created")); // Pro at the Plus shekel price
    expect(proInIls.json.status).toBe("failed");
    expect(await db.subscription.count({ where: { userId: w.userId } })).toBe(0);
    expect((await resolveEntitlement(w.userId)).plan).toBe("FREE");
  });

  it("records unknown users and unrelated event types as ignored without error", async () => {
    const w = await world();
    const ghost = await deliver(subEvent({ ...w.sim, userId: "no-such-user" }, "customer.subscription.created"));
    expect(ghost).toMatchObject({ status: 200, json: { status: "ignored" } });
    const other = await deliver(stripeEvent(evId(), "customer.created", at(0), { id: "cus_x" }));
    expect(other).toMatchObject({ status: 200, json: { status: "ignored" } });
  });

  it("incomplete / unpaid / paused subscriptions never entitle", async () => {
    for (const status of ["incomplete", "unpaid", "paused"] as const) {
      const w = await world({ status });
      await deliver(subEvent(w.sim, "customer.subscription.created"));
      expect((await resolveEntitlement(w.userId)).plan).toBe("FREE");
    }
  });
});

describe("renewal, failure, cancellation and refunds", () => {
  it("failed payment → PAST_DUE (FREE entitlement) → paid invoice → ACTIVE again", async () => {
    const w = await world();
    await deliver(subEvent(w.sim, "customer.subscription.created", at(-120_000)));
    const failedInvoice = invoiceObject({ invoiceId: "in_fail1", subscriptionId: w.sim.subscriptionId, customerId: w.sim.customerId, amountPaid: 0, periodStart: w.sim.periodEnd, periodEnd: at(58 * DAY) });
    await deliver(stripeEvent(evId(), "invoice.payment_failed", at(-60_000), failedInvoice));
    expect((await row(w.userId)).status).toBe("PAST_DUE");
    expect((await resolveEntitlement(w.userId)).plan).toBe("FREE");
    expect((await getBillingView(w.userId)).subscription?.suspended).toBe("past_due");

    const next = { start: w.sim.periodEnd, end: at(58 * DAY) };
    const paid = invoiceObject({ invoiceId: "in_ok1", subscriptionId: w.sim.subscriptionId, customerId: w.sim.customerId, amountPaid: 1000, periodStart: next.start, periodEnd: next.end });
    await deliver(stripeEvent(evId(), "invoice.paid", at(-30_000), paid));
    const sub = await row(w.userId);
    expect(sub.status).toBe("ACTIVE");
    expect(sub.lastPaidInvoiceId).toBe("in_ok1");
    expect(sub.currentPeriodStart).toEqual(next.start); // the invoice itself advanced the period
    expect((await resolveEntitlement(w.userId)).plan).toBe("PLUS");
  });

  it("invoice.paid arriving before its subscription is answered 5xx so Stripe retries, then succeeds", async () => {
    const w = await world();
    const paid = stripeEvent(evId(), "invoice.paid", at(0), invoiceObject({ invoiceId: "in_early", subscriptionId: w.sim.subscriptionId, customerId: w.sim.customerId, amountPaid: 1000, periodStart: w.sim.periodStart, periodEnd: w.sim.periodEnd }));
    expect((await deliver(paid)).status).toBe(500);
    expect((await eventRow((paid as { id: string }).id)).status).toBe("FAILED");
    await deliver(subEvent(w.sim, "customer.subscription.created", at(-5_000)));
    expect((await deliver(paid)).status).toBe(200); // the retry
    expect((await eventRow((paid as { id: string }).id)).status).toBe("PROCESSED");
    expect((await row(w.userId)).lastPaidInvoiceId).toBe("in_early");
  });

  it("cancel at period end keeps the plan until the end; deletion is terminal and later events cannot resurrect it", async () => {
    const w = await world();
    await deliver(subEvent(w.sim, "customer.subscription.created", at(-300_000)));
    await deliver(subEvent({ ...w.sim, cancelAtPeriodEnd: true }, "customer.subscription.updated", at(-240_000)));
    expect(await resolveEntitlement(w.userId)).toMatchObject({ plan: "PLUS" });
    expect((await getBillingView(w.userId)).subscription?.cancelAtPeriodEnd).toBe(true);

    await deliver(subEvent({ ...w.sim, status: "canceled", cancelAtPeriodEnd: true }, "customer.subscription.deleted", at(-120_000)));
    expect((await row(w.userId)).status).toBe("CANCELED");
    expect((await resolveEntitlement(w.userId)).plan).toBe("FREE");
    const late = await deliver(subEvent({ ...w.sim, status: "active" }, "customer.subscription.updated", at(-60_000)));
    expect(late.json.status).toBe("ignored");
    expect((await row(w.userId)).status).toBe("CANCELED");
  });

  it("a full refund of the latest paid invoice suspends THIS period only; partial refunds change nothing", async () => {
    const w = await world();
    await deliver(subEvent(w.sim, "customer.subscription.created", at(-300_000)));
    await deliver(stripeEvent(evId(), "invoice.paid", at(-240_000), invoiceObject({ invoiceId: "in_pay1", subscriptionId: w.sim.subscriptionId, customerId: w.sim.customerId, amountPaid: 1000, periodStart: w.sim.periodStart, periodEnd: w.sim.periodEnd })));

    const partial = chargeObject({ chargeId: "ch_1", invoiceId: "", amount: 1000, amountRefunded: 300, paymentIntentId: "pi_for_in_pay1" });
    delete (partial as { metadata?: unknown }).metadata; // a real Stripe charge has no invoice id: the gateway resolves it
    expect((await deliver(stripeEvent(evId(), "charge.refunded", at(-180_000), partial))).json.status).toBe("ignored");
    expect((await resolveEntitlement(w.userId)).plan).toBe("PLUS");

    const full = chargeObject({ chargeId: "ch_1", invoiceId: "", amount: 1000, amountRefunded: 1000, paymentIntentId: "pi_for_in_pay1" });
    delete (full as { metadata?: unknown }).metadata;
    expect((await deliver(stripeEvent(evId(), "charge.refunded", at(-120_000), full))).json.status).toBe("processed");
    expect((await resolveEntitlement(w.userId)).plan).toBe("FREE");
    expect((await getBillingView(w.userId)).subscription?.suspended).toBe("refunded");

    // next period: a new paid invoice and a new period → access resumes automatically
    const nextStart = w.sim.periodEnd;
    const nextEnd = at(58 * DAY);
    await deliver(stripeEvent(evId(), "invoice.paid", at(-60_000), invoiceObject({ invoiceId: "in_pay2", subscriptionId: w.sim.subscriptionId, customerId: w.sim.customerId, amountPaid: 1000, periodStart: nextStart, periodEnd: nextEnd })));
    expect((await resolveEntitlement(w.userId)).plan).toBe("PLUS");
  });

  it("a refund of an older invoice (not the latest paid one) does not touch the current period", async () => {
    const w = await world();
    await deliver(subEvent(w.sim, "customer.subscription.created", at(-300_000)));
    await deliver(stripeEvent(evId(), "invoice.paid", at(-240_000), invoiceObject({ invoiceId: "in_new", subscriptionId: w.sim.subscriptionId, customerId: w.sim.customerId, amountPaid: 1000, periodStart: w.sim.periodStart, periodEnd: w.sim.periodEnd })));
    const old = chargeObject({ chargeId: "ch_old", invoiceId: "", amount: 1000, amountRefunded: 1000, paymentIntentId: "pi_for_in_old" });
    delete (old as { metadata?: unknown }).metadata;
    const res = await deliver(stripeEvent(evId(), "charge.refunded", at(-120_000), old));
    expect(res.json.status).toBe("ignored");
    expect((await resolveEntitlement(w.userId)).plan).toBe("PLUS");
  });

  it("a new subscription may replace a finished one but never a live one", async () => {
    const w = await world();
    await deliver(subEvent(w.sim, "customer.subscription.created", at(-300_000)));
    const second = { ...w.sim, subscriptionId: `sub_${randomUUID().slice(0, 12)}`, plan: "PRO" as const, unitAmount: 4000, currency: "usd" };
    const blocked = await deliver(subEvent(second, "customer.subscription.created", at(-200_000)));
    expect(blocked.json.status).toBe("ignored");
    expect((await row(w.userId)).plan).toBe("PLUS");

    await deliver(subEvent({ ...w.sim, status: "canceled" }, "customer.subscription.deleted", at(-100_000)));
    const replaced = await deliver(subEvent(second, "customer.subscription.created", at(-50_000)));
    expect(replaced.json.status).toBe("processed");
    expect(await row(w.userId)).toMatchObject({ plan: "PRO", status: "ACTIVE", providerSubscriptionId: second.subscriptionId, lastPaidInvoiceId: null, revokedPeriodStart: null });
    expect(await resolveEntitlement(w.userId)).toMatchObject({ plan: "PRO", quotas: levelQuotas("PRO") });
  });
});
