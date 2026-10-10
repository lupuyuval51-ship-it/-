import { describe, expect, it } from "vitest";
import { ENTITLEMENT_GRACE_MS, computeEntitlement, subscriptionGrantsAccess, type SubscriptionFacts } from "@/server/allowance/entitlement";

const start = new Date("2026-03-10T00:00:00Z");
const end = new Date("2026-04-09T00:00:00Z");
const sub = (over: Partial<SubscriptionFacts> = {}): SubscriptionFacts => ({
  id: "s1", plan: "PLUS", status: "ACTIVE", currentPeriodStart: start, currentPeriodEnd: end, revokedPeriodStart: null, ...over,
});
const mid = new Date("2026-03-20T00:00:00Z");

describe("entitlement resolution", () => {
  it("no subscription → FREE with the UTC calendar month as period", () => {
    const e = computeEntitlement(null, mid);
    expect(e).toMatchObject({ plan: "FREE", source: "FREE", limit: 1 });
    expect(e.periodStart.toISOString()).toBe("2026-03-01T00:00:00.000Z");
    expect(e.periodEnd.toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });

  it("ACTIVE PLUS → paid entitlement over the billing period, limit 1", () => {
    const e = computeEntitlement(sub(), mid);
    expect(e).toMatchObject({ plan: "PLUS", source: "SUBSCRIPTION", limit: 1, subscriptionId: "s1" });
    expect(e.periodStart).toEqual(start);
    expect(e.periodEnd).toEqual(end);
  });

  it("ACTIVE PRO → limit 5", () => {
    expect(computeEntitlement(sub({ plan: "PRO" }), mid).limit).toBe(5);
  });

  it.each(["PAST_DUE", "UNPAID", "CANCELED", "INCOMPLETE", "INCOMPLETE_EXPIRED", "PAUSED"])("%s subscriptions do NOT grant paid access", (status) => {
    expect(subscriptionGrantsAccess(sub({ status }), mid)).toBe(false);
    expect(computeEntitlement(sub({ status }), mid).plan).toBe("FREE");
  });

  it("TRIALING grants access", () => {
    expect(subscriptionGrantsAccess(sub({ status: "TRIALING" }), mid)).toBe(true);
  });

  it("a fully refunded period is suspended until the next period starts", () => {
    expect(subscriptionGrantsAccess(sub({ revokedPeriodStart: start }), mid)).toBe(false);
    const renewed = sub({ revokedPeriodStart: start, currentPeriodStart: end, currentPeriodEnd: new Date("2026-05-09T00:00:00Z") });
    expect(subscriptionGrantsAccess(renewed, new Date("2026-04-15T00:00:00Z"))).toBe(true);
  });

  it("short grace after period end, none after that", () => {
    expect(subscriptionGrantsAccess(sub(), new Date(end.getTime() + ENTITLEMENT_GRACE_MS - 1000))).toBe(true);
    expect(subscriptionGrantsAccess(sub(), new Date(end.getTime() + ENTITLEMENT_GRACE_MS + 1000))).toBe(false);
  });
});
