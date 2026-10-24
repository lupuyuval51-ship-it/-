import { describe, expect, it } from "vitest";
import { calendarMonthUtc, quotaOf, type PlanId } from "@/config/plans";
import { ENTITLEMENT_GRACE_MS, computeEntitlement, subscriptionGrantsAccess, type SubscriptionFacts } from "@/server/allowance/entitlement";
import { rng } from "./random-play";

/**
 * Exhaustive matrix for the one function that decides who gets paid features: every subscription status x plan x refund mark x moment
 * around the period end, compared with a rule written out independently here. The matrix is small enough to enumerate, so nothing is sampled.
 */
const STATUSES = ["INCOMPLETE", "INCOMPLETE_EXPIRED", "TRIALING", "ACTIVE", "PAST_DUE", "CANCELED", "UNPAID", "PAUSED"] as const;
const PAID: PlanId[] = ["PLUS", "PRO"];
const start = new Date("2026-03-10T08:00:00Z");
const end = new Date("2026-04-09T08:00:00Z");
const G = ENTITLEMENT_GRACE_MS;
const MOMENTS: [string, Date][] = [
  ["a week before the period", new Date(start.getTime() - 7 * 86_400_000)],
  ["the first millisecond", start],
  ["mid period", new Date((start.getTime() + end.getTime()) / 2)],
  ["1 ms before the end", new Date(end.getTime() - 1)],
  ["exactly at the end", end],
  ["inside the grace", new Date(end.getTime() + G - 1)],
  ["exactly when the grace ends", new Date(end.getTime() + G)],
  ["after the grace", new Date(end.getTime() + G + 1)],
  ["a year later", new Date(end.getTime() + 365 * 86_400_000)],
];
const REVOKED: [string, Date | null][] = [["not refunded", null], ["refunded this period", start], ["refunded an earlier period", new Date(start.getTime() - 30 * 86_400_000)]];

/** The rule, restated: paid + (ACTIVE or TRIALING) + not refunded this very period + before the end of the period plus the grace. */
const expected = (status: string, revoked: Date | null, now: Date) =>
  (status === "ACTIVE" || status === "TRIALING") && !(revoked && revoked.getTime() === start.getTime()) && now.getTime() < end.getTime() + G;

const quotasOf = (plan: PlanId) => ({ A: quotaOf(plan, "A"), B: quotaOf(plan, "B"), C: quotaOf(plan, "C") });

describe("subscriptionGrantsAccess: the whole matrix", () => {
  for (const plan of PAID) {
    for (const status of STATUSES) {
      for (const [rLabel, revoked] of REVOKED) {
        it(`${plan} ${status}, ${rLabel}`, () => {
          for (const [label, now] of MOMENTS) {
            const sub: SubscriptionFacts = { id: "s", plan, status, currentPeriodStart: start, currentPeriodEnd: end, revokedPeriodStart: revoked };
            expect(subscriptionGrantsAccess(sub, now), `${label} (${now.toISOString()})`).toBe(expected(status, revoked, now));
            const ent = computeEntitlement(sub, now);
            if (expected(status, revoked, now)) {
              expect(ent).toMatchObject({ plan, source: "SUBSCRIPTION", quotas: quotasOf(plan), subscriptionId: "s" });
              expect(ent.periodStart).toEqual(start);
              expect(ent.periodEnd).toEqual(end);
            } else {
              // anything else is exactly the Free plan with the UTC calendar month containing "now", and no link to the subscription
              const month = calendarMonthUtc(now);
              expect(ent).toMatchObject({ plan: "FREE", source: "FREE", quotas: quotasOf("FREE"), subscriptionId: null });
              expect(ent.periodStart).toEqual(month.start);
              expect(ent.periodEnd).toEqual(month.end);
            }
          }
        });
      }
    }
  }

  it("a FREE row or a missing subscription never grants paid access, whatever its status says", () => {
    for (const status of STATUSES) {
      const free: SubscriptionFacts = { id: "s", plan: "FREE", status, currentPeriodStart: start, currentPeriodEnd: end, revokedPeriodStart: null };
      expect(subscriptionGrantsAccess(free, MOMENTS[2]![1])).toBe(false);
    }
    expect(subscriptionGrantsAccess(null, MOMENTS[2]![1])).toBe(false);
  });

  it("the refund mark only suspends the period it was made for: the next period of the same subscription is entitled again", () => {
    const next = { start: end, end: new Date(end.getTime() + 30 * 86_400_000) };
    const sub: SubscriptionFacts = { id: "s", plan: "PLUS", status: "ACTIVE", currentPeriodStart: next.start, currentPeriodEnd: next.end, revokedPeriodStart: start };
    expect(subscriptionGrantsAccess(sub, new Date(next.start.getTime() + 1000))).toBe(true);
  });
});

describe("calendarMonthUtc (the Free allowance period)", () => {
  it("property: contains the moment, starts on the 1st at 00:00 UTC, and consecutive months tile without gaps, across years and leap days", () => {
    const rand = rng(2024);
    for (let i = 0; i < 3000; i++) {
      const at = new Date(Date.UTC(2023, 0, 1) + Math.floor(rand() * 8 * 366 * 86_400_000));
      const { start: s, end: e } = calendarMonthUtc(at);
      expect(s.getTime() <= at.getTime() && at.getTime() < e.getTime(), at.toISOString()).toBe(true);
      expect([s.getUTCDate(), s.getUTCHours(), s.getUTCMinutes(), s.getUTCSeconds(), s.getUTCMilliseconds()]).toEqual([1, 0, 0, 0, 0]);
      expect(e.getUTCDate()).toBe(1);
      expect(calendarMonthUtc(e).start.getTime(), "the next month starts exactly where this one ends").toBe(e.getTime());
      expect(calendarMonthUtc(new Date(e.getTime() - 1)).start.getTime(), "the last millisecond is still this month").toBe(s.getTime());
      const days = (e.getTime() - s.getTime()) / 86_400_000;
      expect(days === 28 || days === 29 || days === 30 || days === 31, `${days} days`).toBe(true);
    }
  });

  it("knows February 2028 has 29 days and rolls December into January", () => {
    const feb = calendarMonthUtc(new Date("2028-02-15T12:00:00Z"));
    expect((feb.end.getTime() - feb.start.getTime()) / 86_400_000).toBe(29);
    const dec = calendarMonthUtc(new Date("2026-12-31T23:59:59.999Z"));
    expect(dec.end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});
