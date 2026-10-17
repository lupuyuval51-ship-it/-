import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { chargeObject, invoiceObject, parseStripeEvent, stripeEvent, subscriptionObject } from "@/server/billing/events";
import { isSubscriptionLive } from "@/server/billing/ingest";
import { createStripeGateway, verifyStripeWebhook, type StripeLike } from "@/server/billing/stripe";

const T0 = new Date("2027-03-01T10:00:00Z");
const T1 = new Date("2027-04-01T10:00:00Z");
const sim = { subscriptionId: "sub_1", customerId: "cus_1", userId: "user_1", plan: "PLUS", currency: "usd", unitAmount: 1000, periodStart: T0, periodEnd: T1 };

describe("Stripe event parsing", () => {
  it("normalises a subscription (period taken from the item, status upper-cased)", () => {
    const ev = parseStripeEvent(stripeEvent("evt_1", "customer.subscription.created", T0, subscriptionObject({ ...sim, status: "active" })));
    expect(ev).toMatchObject({ kind: "subscription", eventId: "evt_1", deleted: false });
    if (ev.kind !== "subscription") throw new Error("unreachable");
    expect(ev.snapshot).toMatchObject({ subscriptionId: "sub_1", customerId: "cus_1", userId: "user_1", plan: "PLUS", status: "ACTIVE", currency: "usd", unitAmount: 1000, cancelAtPeriodEnd: false });
    expect(ev.snapshot.periodStart).toEqual(T0);
    expect(ev.snapshot.periodEnd).toEqual(T1);
  });

  it("falls back to the legacy top-level period of older API versions", () => {
    const obj = subscriptionObject({ ...sim, status: "active" }) as Record<string, unknown>;
    const item = (obj.items as { data: Record<string, unknown>[] }).data[0]!;
    delete item.current_period_start;
    delete item.current_period_end;
    obj.current_period_start = Math.floor(T0.getTime() / 1000);
    obj.current_period_end = Math.floor(T1.getTime() / 1000);
    const ev = parseStripeEvent(stripeEvent("evt_2", "customer.subscription.updated", T0, obj));
    expect(ev.kind === "subscription" && ev.snapshot.periodEnd).toEqual(T1);
  });

  it("maps every Stripe status and treats subscription.deleted as terminal CANCELED", () => {
    for (const [s, want] of [["incomplete", "INCOMPLETE"], ["incomplete_expired", "INCOMPLETE_EXPIRED"], ["trialing", "TRIALING"], ["past_due", "PAST_DUE"], ["canceled", "CANCELED"], ["unpaid", "UNPAID"], ["paused", "PAUSED"]] as const) {
      const ev = parseStripeEvent(stripeEvent("e", "customer.subscription.updated", T0, subscriptionObject({ ...sim, status: s })));
      expect(ev.kind === "subscription" && ev.snapshot.status).toBe(want);
    }
    const del = parseStripeEvent(stripeEvent("e", "customer.subscription.deleted", T0, subscriptionObject({ ...sim, status: "active" })));
    expect(del.kind === "subscription" && del.deleted && del.snapshot.status).toBe("CANCELED");
  });

  it("reads invoices from the current (parent.subscription_details) and legacy (subscription) shapes", () => {
    const paid = parseStripeEvent(stripeEvent("e", "invoice.paid", T0, invoiceObject({ invoiceId: "in_1", subscriptionId: "sub_1", customerId: "cus_1", amountPaid: 1000, periodStart: T0, periodEnd: T1 })));
    expect(paid).toMatchObject({ kind: "invoice_paid", invoiceId: "in_1", subscriptionId: "sub_1", amountPaid: 1000 });
    const legacy = parseStripeEvent(stripeEvent("e", "invoice.payment_failed", T0, { id: "in_2", subscription: "sub_9", amount_paid: 0 }));
    expect(legacy).toMatchObject({ kind: "invoice_failed", subscriptionId: "sub_9" });
  });

  it("distinguishes full from partial refunds", () => {
    const full = parseStripeEvent(stripeEvent("e", "charge.refunded", T0, chargeObject({ chargeId: "ch_1", invoiceId: "in_1", amount: 1000, amountRefunded: 1000, paymentIntentId: "pi_1" })));
    const part = parseStripeEvent(stripeEvent("e", "charge.refunded", T0, chargeObject({ chargeId: "ch_1", invoiceId: "in_1", amount: 1000, amountRefunded: 400, paymentIntentId: "pi_1" })));
    expect(full).toMatchObject({ kind: "refund", fullyRefunded: true, paymentIntentId: "pi_1" });
    expect(part).toMatchObject({ kind: "refund", fullyRefunded: false });
  });

  it("ignores event types it does not use and rejects malformed payloads", () => {
    expect(parseStripeEvent(stripeEvent("e", "customer.created", T0, { id: "cus_1" })).kind).toBe("ignored");
    expect(() => parseStripeEvent(stripeEvent("e", "customer.subscription.created", T0, { id: "sub_1" }))).toThrow();
    expect(() => parseStripeEvent({ nope: true })).toThrow();
  });
});

describe("Stripe webhook signature verification (real Stripe SDK verifier)", () => {
  const secret = "whsec_unit_test_secret";
  const body = JSON.stringify(stripeEvent("evt_sig", "customer.subscription.created", T0, subscriptionObject({ ...sim, status: "active" })));
  const sign = (payload: string, over: { secret?: string; timestamp?: number } = {}) =>
    Stripe.webhooks.generateTestHeaderString({ payload, secret: over.secret ?? secret, timestamp: over.timestamp ?? Math.floor(Date.now() / 1000) });

  it("accepts a correctly signed payload", () => {
    const { event } = verifyStripeWebhook(body, sign(body), secret);
    expect(event).toMatchObject({ kind: "subscription", eventId: "evt_sig" });
  });

  it("rejects a tampered body, a wrong secret, a missing header, garbage and replays older than the tolerance", () => {
    const good = sign(body);
    expect(() => verifyStripeWebhook(body.replace("1000", "1"), good, secret)).toThrow();
    expect(() => verifyStripeWebhook(body, sign(body, { secret: "whsec_other" }), secret)).toThrow();
    expect(() => verifyStripeWebhook(body, null, secret)).toThrow();
    expect(() => verifyStripeWebhook(body, "t=1,v1=deadbeef", secret)).toThrow();
    expect(() => verifyStripeWebhook(body, sign(body, { timestamp: Math.floor(Date.now() / 1000) - 3600 }), secret)).toThrow();
  });
});

describe("Stripe gateway requests", () => {
  function fake() {
    const calls: { checkout?: Record<string, unknown>; options?: Record<string, unknown>; update?: [string, Record<string, unknown>] } = {};
    const client: StripeLike = {
      checkout: {
        sessions: {
          create: async (params, options) => {
            calls.checkout = params;
            calls.options = options;
            return { id: "cs_test_1", url: "https://checkout.stripe.test/c/cs_test_1" };
          },
          retrieve: async () => ({ status: "complete", payment_status: "paid", client_reference_id: "user_1", subscription: "sub_1" }),
        },
      },
      billingPortal: { sessions: { create: async () => ({ url: "https://billing.stripe.test/p/1" }) } },
      subscriptions: {
        retrieve: async () => subscriptionObject({ ...sim, status: "active" }),
        update: async (id, params) => {
          calls.update = [id, params];
          return subscriptionObject({ ...sim, status: "active", cancelAtPeriodEnd: params.cancel_at_period_end === true });
        },
      },
      invoicePayments: { list: async () => ({ data: [{ invoice: "in_77" }] }) },
    };
    return { client, calls };
  }
  const args = { userId: "user_1", email: "a@example.test", customerId: null };

  it("creates a subscription-mode checkout with the exact configured amount and currency", async () => {
    const { client, calls } = fake();
    const gw = createStripeGateway(client);
    expect(await gw.createCheckout({ ...args, plan: "PLUS", currency: "ILS", unitAmount: 1000 })).toEqual({ url: "https://checkout.stripe.test/c/cs_test_1" });
    const params = calls.checkout as { mode: string; client_reference_id: string; customer_email: string; metadata: Record<string, string>; subscription_data: { metadata: Record<string, string> }; line_items: { price_data: { currency: string; unit_amount: number; recurring: { interval: string } } }[]; success_url: string };
    expect(params.mode).toBe("subscription");
    expect(params.line_items[0]!.price_data).toMatchObject({ currency: "ils", unit_amount: 1000, recurring: { interval: "month" } });
    expect(params.client_reference_id).toBe("user_1");
    expect(params.customer_email).toBe("a@example.test");
    expect(params.metadata).toEqual({ userId: "user_1", plan: "PLUS" });
    expect(params.subscription_data.metadata).toEqual({ userId: "user_1", plan: "PLUS" });
    expect(params.success_url).toContain("{CHECKOUT_SESSION_ID}");
    expect(calls.options?.idempotencyKey).toMatch(/^checkout:user_1:PLUS:ILS:/);
  });

  it("reuses an existing customer instead of creating a duplicate", async () => {
    const { client, calls } = fake();
    await createStripeGateway(client).createCheckout({ ...args, plan: "PRO", currency: "USD", unitAmount: 4000, customerId: "cus_existing" });
    expect(calls.checkout).toMatchObject({ customer: "cus_existing" });
    expect(calls.checkout).not.toHaveProperty("customer_email");
  });

  it("schedules cancellation at period end and returns the provider's resulting state", async () => {
    const { client, calls } = fake();
    const snap = await createStripeGateway(client).setCancelAtPeriodEnd({ subscriptionId: "sub_1", userId: "user_1", cancel: true });
    expect(calls.update).toEqual(["sub_1", { cancel_at_period_end: true }]);
    expect(snap.cancelAtPeriodEnd).toBe(true);
  });

  it("confirms a checkout by reading it back from the provider, and resolves a refunded charge's invoice", async () => {
    const { client } = fake();
    const gw = createStripeGateway(client);
    const checkout = await gw.retrieveCheckout("cs_test_1");
    expect(checkout).toMatchObject({ userId: "user_1", complete: true });
    expect(checkout?.snapshot?.subscriptionId).toBe("sub_1");
    expect(await gw.invoiceIdForPaymentIntent("pi_1")).toBe("in_77");
  });
});

describe("isSubscriptionLive", () => {
  const now = new Date("2027-03-15T00:00:00Z");
  const base = { currentPeriodEnd: new Date("2027-04-01T00:00:00Z"), cancelAtPeriodEnd: false };
  it("is live while the provider may still bill", () => {
    for (const status of ["ACTIVE", "TRIALING", "PAST_DUE", "UNPAID", "PAUSED"]) expect(isSubscriptionLive({ ...base, status }, now)).toBe(true);
  });
  it("is not live once finished, or once a scheduled cancellation took effect", () => {
    for (const status of ["CANCELED", "INCOMPLETE_EXPIRED", "INCOMPLETE"]) expect(isSubscriptionLive({ ...base, status }, now)).toBe(false);
    expect(isSubscriptionLive({ ...base, status: "ACTIVE", cancelAtPeriodEnd: true }, now)).toBe(true);
    expect(isSubscriptionLive({ ...base, status: "ACTIVE", cancelAtPeriodEnd: true }, new Date("2027-04-02T00:00:00Z"))).toBe(false);
  });
});
