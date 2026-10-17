import { describe, expect, it } from "vitest";
import { chargeObject, invoiceObject, parseStripeEvent, stripeEvent, subscriptionObject, type BillingEvent, type SimSubscription } from "@/server/billing/events";
import { rng } from "./random-play";

/**
 * The webhook parser is the one place where bytes from the outside become billing state. Events are signature-verified before they
 * get here, so this is defence in depth: whatever shape arrives, `parseStripeEvent` must either return a well-formed event or throw
 * an ordinary Error (the route answers 400), and a well-formed event must carry only usable dates and numbers.
 */
const STATUSES: SimSubscription["status"][] = ["incomplete", "trialing", "active", "past_due", "canceled", "unpaid", "paused", "incomplete_expired"];
const T0 = Date.UTC(2026, 9, 1, 12, 0, 0);

function sub(rand: () => number): SimSubscription {
  const start = new Date(T0 + Math.floor(rand() * 400) * 86_400_000);
  return {
    subscriptionId: `sub_${Math.floor(rand() * 1e9)}`, customerId: `cus_${Math.floor(rand() * 1e9)}`, userId: `u${Math.floor(rand() * 1e6)}`,
    plan: rand() < 0.5 ? "PLUS" : "PRO", status: STATUSES[Math.floor(rand() * STATUSES.length)]!,
    currency: rand() < 0.5 ? "usd" : "ils", unitAmount: [0, 1000, 3000, 4000][Math.floor(rand() * 4)]!,
    periodStart: start, periodEnd: new Date(start.getTime() + 30 * 86_400_000), cancelAtPeriodEnd: rand() < 0.3, canceledAt: rand() < 0.2 ? start : null,
  };
}

describe("billing events: builders and parser agree (round trip)", () => {
  it("every subscription the simulator can describe parses back to the same snapshot", () => {
    const rand = rng(2026);
    for (let i = 0; i < 300; i++) {
      const s = sub(rand);
      const created = new Date(T0 + i * 1000);
      const ev = parseStripeEvent(stripeEvent(`evt_${i}`, "customer.subscription.updated", created, subscriptionObject(s)));
      expect(ev.kind).toBe("subscription");
      if (ev.kind !== "subscription") continue;
      expect(ev.eventId).toBe(`evt_${i}`);
      expect(ev.eventTime).toEqual(created);
      expect(ev.snapshot).toMatchObject({
        subscriptionId: s.subscriptionId, customerId: s.customerId, userId: s.userId, plan: s.plan, status: s.status.toUpperCase(),
        currency: s.currency, unitAmount: s.unitAmount, cancelAtPeriodEnd: s.cancelAtPeriodEnd ?? false,
      });
      expect(ev.snapshot.periodStart).toEqual(s.periodStart);
      expect(ev.snapshot.periodEnd).toEqual(s.periodEnd);
      expect(ev.snapshot.canceledAt).toEqual(s.canceledAt ?? null);
    }
  });

  it("subscription.deleted is always terminal CANCELED, whatever status the payload still claims", () => {
    const rand = rng(77);
    for (let i = 0; i < 100; i++) {
      const ev = parseStripeEvent(stripeEvent(`evt_d${i}`, "customer.subscription.deleted", new Date(T0), subscriptionObject(sub(rand))));
      expect(ev).toMatchObject({ kind: "subscription", deleted: true, snapshot: { status: "CANCELED" } });
    }
  });

  it("invoices and charges round trip, and only a charge refunded in full by an amount above zero counts as a full refund", () => {
    const period = { periodStart: new Date(T0), periodEnd: new Date(T0 + 30 * 86_400_000) };
    const paid = parseStripeEvent(stripeEvent("evt_i", "invoice.paid", new Date(T0), invoiceObject({ invoiceId: "in_1", subscriptionId: "sub_1", customerId: "cus_1", amountPaid: 1000, ...period })));
    expect(paid).toMatchObject({ kind: "invoice_paid", invoiceId: "in_1", subscriptionId: "sub_1", amountPaid: 1000, periodStart: period.periodStart, periodEnd: period.periodEnd });
    const failed = parseStripeEvent(stripeEvent("evt_f", "invoice.payment_failed", new Date(T0), invoiceObject({ invoiceId: "in_2", subscriptionId: "sub_1", customerId: "cus_1", amountPaid: 0, ...period })));
    expect(failed).toMatchObject({ kind: "invoice_failed", invoiceId: "in_2", subscriptionId: "sub_1" });

    const refund = (amount: number, refunded: number) =>
      parseStripeEvent(stripeEvent("evt_r", "charge.refunded", new Date(T0), chargeObject({ chargeId: "ch_1", invoiceId: "in_1", amount, amountRefunded: refunded, paymentIntentId: "pi_1" })));
    expect(refund(1000, 1000)).toMatchObject({ kind: "refund", fullyRefunded: true, invoiceId: "in_1", paymentIntentId: "pi_1" });
    expect(refund(1000, 999)).toMatchObject({ fullyRefunded: false });
    expect(refund(1000, 1)).toMatchObject({ fullyRefunded: false });
    expect(refund(1000, 0)).toMatchObject({ fullyRefunded: false });
    expect(refund(0, 0)).toMatchObject({ fullyRefunded: false }); // a zero-amount charge is never "refunded in full"
  });
});

describe("billing events: hostile or damaged payloads", () => {
  const seeds = () => {
    const rand = rng(31337);
    const s = sub(rand);
    const created = new Date(T0);
    return [
      stripeEvent("evt_a", "customer.subscription.created", created, subscriptionObject({ ...s, status: "active" })),
      stripeEvent("evt_b", "customer.subscription.deleted", created, subscriptionObject(s)),
      stripeEvent("evt_c", "invoice.paid", created, invoiceObject({ invoiceId: "in_1", subscriptionId: s.subscriptionId, customerId: s.customerId, amountPaid: 1000, periodStart: s.periodStart, periodEnd: s.periodEnd })),
      stripeEvent("evt_d", "invoice.payment_failed", created, invoiceObject({ invoiceId: "in_2", subscriptionId: s.subscriptionId, customerId: s.customerId, amountPaid: 0, periodStart: s.periodStart, periodEnd: s.periodEnd })),
      stripeEvent("evt_e", "charge.refunded", created, chargeObject({ chargeId: "ch_1", invoiceId: "in_1", amount: 1000, amountRefunded: 1000, paymentIntentId: "pi_1" })),
      stripeEvent("evt_f", "customer.updated", created, { id: "cus_1" }),
    ];
  };
  const JUNK: unknown[] = [null, undefined, "", "x", -1, 0, 1.5, -0, [], {}, [null], { id: "" }, true, "active", 1e9, "2026-01-01"];

  /** Replace one random field, at any depth, with junk (or delete it). */
  function damage(value: unknown, rand: () => number): unknown {
    const copy = structuredClone(value) as Record<string, unknown>;
    const paths: (string | number)[][] = [];
    const walk = (v: unknown, path: (string | number)[]) => {
      if (v && typeof v === "object") for (const [k, child] of Object.entries(v)) { paths.push([...path, Array.isArray(v) ? Number(k) : k]); walk(child, [...path, Array.isArray(v) ? Number(k) : k]); }
    };
    walk(copy, []);
    if (paths.length === 0) return copy;
    const path = paths[Math.floor(rand() * paths.length)]!;
    let parent: any = copy; // eslint-disable-line @typescript-eslint/no-explicit-any
    for (const key of path.slice(0, -1)) parent = parent[key];
    const last = path[path.length - 1]!;
    if (rand() < 0.3) { if (Array.isArray(parent)) parent.splice(Number(last), 1); else delete parent[last]; }
    else parent[last] = JUNK[Math.floor(rand() * JUNK.length)];
    return copy;
  }

  const wellFormed = (ev: BillingEvent) => {
    expect(ev.eventId.length).toBeGreaterThan(0);
    expect(Number.isNaN(ev.eventTime.getTime())).toBe(false);
    if (ev.kind === "subscription") {
      expect(ev.snapshot.subscriptionId.length).toBeGreaterThan(0);
      expect(ev.snapshot.customerId.length).toBeGreaterThan(0);
      expect(Number.isNaN(ev.snapshot.periodStart.getTime()) || Number.isNaN(ev.snapshot.periodEnd.getTime())).toBe(false);
      if (ev.snapshot.unitAmount !== null) expect(Number.isInteger(ev.snapshot.unitAmount)).toBe(true);
    }
    if (ev.kind === "invoice_paid") expect(Number.isInteger(ev.amountPaid)).toBe(true);
    if (ev.kind === "refund") expect(typeof ev.fullyRefunded).toBe("boolean");
  };

  it("random single-field damage either throws an ordinary Error or yields a well-formed event (never a half-valid one)", () => {
    const rand = rng(424242);
    const base = seeds();
    let threw = 0;
    let parsed = 0;
    for (let i = 0; i < 3000; i++) {
      const payload = damage(base[i % base.length], rand);
      try {
        wellFormed(parseStripeEvent(payload));
        parsed++;
      } catch (e) {
        // an expectation failure inside wellFormed is an AssertionError, which must not be mistaken for a parse error
        expect((e as Error).name, `${JSON.stringify(payload)}`).not.toBe("AssertionError");
        expect(e).toBeInstanceOf(Error);
        threw++;
      }
    }
    expect(threw, "damage is really rejected").toBeGreaterThan(300);
    expect(parsed, "harmless damage (an unused field) is still accepted").toBeGreaterThan(100);
  });

  it("garbage that is not an event at all is refused", () => {
    for (const junk of [null, undefined, 42, "evt", [], {}, { id: "evt_1" }, { id: "evt_1", type: "invoice.paid" }, { id: "evt_1", type: "invoice.paid", created: -5, data: { object: {} } }, { id: "x".repeat(300), type: "t", created: 1, data: { object: {} } }]) {
      expect(() => parseStripeEvent(junk), JSON.stringify(junk)).toThrow();
    }
  });

  it("an unknown or unused event type is ignored, not an error, so Stripe is not told to retry it forever", () => {
    expect(parseStripeEvent({ id: "evt_x", type: "customer.created", created: 1_700_000_000, data: { object: { anything: 1 } } })).toMatchObject({ kind: "ignored" });
  });

  it("a subscription with an unknown status or without any billing period is refused rather than guessed", () => {
    const ok = subscriptionObject(sub(rng(5)));
    expect(() => parseStripeEvent(stripeEvent("e", "customer.subscription.updated", new Date(T0), { ...ok, status: "mystery" }))).toThrow();
    const noPeriod = { ...ok, items: { data: [{ price: ok.items.data[0]!.price }] } };
    expect(() => parseStripeEvent(stripeEvent("e", "customer.subscription.updated", new Date(T0), noPeriod))).toThrow();
    expect(() => parseStripeEvent(stripeEvent("e", "customer.subscription.updated", new Date(T0), { ...ok, items: { data: [] } }))).toThrow();
  });
});
