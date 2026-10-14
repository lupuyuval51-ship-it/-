import { describe, expect, it } from "vitest";
import {
  PLANS,
  calendarMonthUtc,
  costOf,
  defaultLevel,
  displayCurrency,
  levelsAllowed,
  maxLevel,
  planOffer,
  planUnlockingLevel,
  topicsAt,
  formatMoney,
  monthlyPrice,
  planAllowsTier,
  resolveGraphicsTier,
} from "@/config/plans";
import { RENDER_PROFILES } from "@/config/graphics";

describe("central plan configuration (exact product rules)", () => {
  it("FREE: $0, 2 points per calendar month, graphics tiers B/C only", () => {
    expect(PLANS.FREE.monthlyPrices.USD).toBe(0);
    expect(PLANS.FREE.allowance).toEqual({ budget: 2, cost: { C: 1, B: 2 } });
    expect(PLANS.FREE.allowancePeriod).toEqual({ kind: "calendar_month_utc" });
    expect([...PLANS.FREE.graphics.allowedTiers]).toEqual(["B", "C"]);
    expect(planAllowsTier("FREE", "A")).toBe(false);
  });

  it("PLUS: $10/month internationally, exactly ₪30/month in Israel, 3 points per billing period, Tier A", () => {
    expect(PLANS.PLUS.monthlyPrices.USD).toBe(1000);
    expect(PLANS.PLUS.monthlyPrices.ILS).toBe(3000);
    expect(PLANS.PLUS.allowance).toEqual({ budget: 3, cost: { B: 1, A: 3, C: 1 } });
    expect(PLANS.PLUS.allowancePeriod).toEqual({ kind: "billing_period" });
    expect(planAllowsTier("PLUS", "A")).toBe(true);
    expect(monthlyPrice("PLUS", "IL")).toEqual({ currency: "ILS", minor: 3000 });
    expect(formatMoney(monthlyPrice("PLUS", "IL").minor, "ILS")).toBe("₪30");
    expect(formatMoney(monthlyPrice("PLUS", "US").minor, "USD")).toBe("$10");
    expect(monthlyPrice("PLUS", null)).toEqual({ currency: "USD", minor: 1000 });
  });

  it("PRO: $40/month, 10 points per billing period, and NO invented shekel price", () => {
    expect(PLANS.PRO.monthlyPrices.USD).toBe(4000);
    expect(PLANS.PRO.monthlyPrices.ILS).toBeUndefined();
    expect(PLANS.PRO.allowance).toEqual({ budget: 10, cost: { A: 2, B: 1, C: 1 } });
    expect(displayCurrency("PRO", "IL")).toBe("USD");
    expect(monthlyPrice("PRO", "IL")).toEqual({ currency: "USD", minor: 4000 });
  });

  it("PLUS and PRO get exactly the same graphics entitlement", () => {
    expect(PLANS.PRO.graphics).toEqual(PLANS.PLUS.graphics);
    expect(PLANS.PRO.graphics).toBe(PLANS.PLUS.graphics); // same frozen object: Pro can never drift ahead of Plus
    expect(RENDER_PROFILES[resolveGraphicsTier("PRO", "A")]).toEqual(RENDER_PROFILES[resolveGraphicsTier("PLUS", "A")]);
  });

  it("graphics tier resolution is clamped to the plan", () => {
    expect(resolveGraphicsTier("FREE", "A")).toBe("B");
    expect(resolveGraphicsTier("FREE", "B")).toBe("B");
    expect(resolveGraphicsTier("FREE", "C")).toBe("C");
    expect(resolveGraphicsTier("FREE", null)).toBe("B");
    expect(resolveGraphicsTier("PLUS", null)).toBe("A");
    expect(resolveGraphicsTier("PRO", "C")).toBe("C");
  });

  it("render profiles differ for real: A > B > C in shadows, particles, detail and material quality", () => {
    const { A, B, C } = RENDER_PROFILES;
    expect(A.shadows.mapSize).toBeGreaterThan(B.shadows.mapSize);
    expect(B.shadows.mapSize).toBeGreaterThan(C.shadows.mapSize);
    expect(C.shadows.enabled).toBe(false);
    expect(A.particles.ambient).toBeGreaterThan(B.particles.ambient);
    expect(B.particles.ambient).toBeGreaterThan(C.particles.ambient);
    expect(A.environmentDetail).toBeGreaterThan(B.environmentDetail);
    expect(A.materials).toBe("pbr");
    expect(C.materials).toBe("simple");
    expect(A.accentLights).toBeGreaterThan(B.accentLights);
  });

  it("calendar month boundaries are UTC", () => {
    const { start, end } = calendarMonthUtc(new Date("2026-12-31T23:59:59Z"));
    expect(start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("formats money deterministically", () => {
    expect(formatMoney(4000, "USD")).toBe("$40");
    expect(formatMoney(999, "USD")).toBe("$9.99");
    expect(formatMoney(0, "ILS")).toBe("₪0");
  });
});

describe("allowance points (the owner's offer, derived from budget and costs)", () => {
  it("states the offer exactly as the owner specified it", () => {
    // Free = 2 topics at level C, or 1 topic at level B. Never A.
    expect(planOffer("FREE")).toEqual([{ level: "C", topics: 2 }, { level: "B", topics: 1 }]);
    // Plus = 3 topics at level B, or 1 topic at level A.
    expect(planOffer("PLUS")).toEqual([{ level: "B", topics: 3 }, { level: "A", topics: 1 }]);
    // Pro = 5 topics at level A, or 10 topics at level B.
    expect(planOffer("PRO")).toEqual([{ level: "A", topics: 5 }, { level: "B", topics: 10 }]);
  });

  it("knows which levels a plan can make and what each costs; Free can never make A", () => {
    expect(levelsAllowed("FREE")).toEqual(["B", "C"]);
    expect(levelsAllowed("PLUS")).toEqual(["A", "B", "C"]);
    expect(levelsAllowed("PRO")).toEqual(["A", "B", "C"]);
    expect(costOf("FREE", "A")).toBeNull();
    expect(topicsAt("FREE", "A")).toBe(0);
    expect([costOf("FREE", "C"), costOf("FREE", "B")]).toEqual([1, 2]);
    expect([costOf("PLUS", "C"), costOf("PLUS", "B"), costOf("PLUS", "A")]).toEqual([1, 1, 3]);
    expect([costOf("PRO", "C"), costOf("PRO", "B"), costOf("PRO", "A")]).toEqual([1, 1, 2]);
    expect([maxLevel("FREE"), maxLevel("PLUS"), maxLevel("PRO")]).toEqual(["B", "A", "A"]);
    expect(planUnlockingLevel("A")).toBe("PLUS");
    expect(planUnlockingLevel("B")).toBe("FREE");
  });

  it("a lower level never costs more than a higher one, and every cost fits the budget", () => {
    for (const plan of ["FREE", "PLUS", "PRO"] as const) {
      const levels = levelsAllowed(plan); // highest first
      for (let i = 1; i < levels.length; i++) expect(costOf(plan, levels[i]!)!).toBeLessThanOrEqual(costOf(plan, levels[i - 1]!)!);
      for (const l of levels) expect(costOf(plan, l)!).toBeLessThanOrEqual(PLANS[plan].allowance.budget);
      for (const l of levels) expect(Number.isInteger(costOf(plan, l)) && costOf(plan, l)! >= 1).toBe(true);
    }
  });

  it("describes what the points left buy, dropping alternatives that no longer fit", () => {
    expect(planOffer("FREE", 1)).toEqual([{ level: "C", topics: 1 }]);
    expect(planOffer("PLUS", 2)).toEqual([{ level: "B", topics: 2 }]);
    expect(planOffer("PRO", 3)).toEqual([{ level: "A", topics: 1 }, { level: "B", topics: 3 }]);
    expect(planOffer("FREE", 0)).toEqual([]);
  });

  it("the default level is the best one the remaining points pay for (and that fits the request)", () => {
    expect(defaultLevel("FREE", 2)).toBe("B");
    expect(defaultLevel("FREE", 1)).toBe("C");
    expect(defaultLevel("PLUS", 3)).toBe("A");
    expect(defaultLevel("PLUS", 2)).toBe("B");
    expect(defaultLevel("PRO", 1)).toBe("B");
    expect(defaultLevel("FREE", 1, (l) => l !== "C")).toBe("B"); // nothing affordable fits → the best that fits (402 later)
    expect(defaultLevel("PRO", 0)).toBe("A");
  });
});
