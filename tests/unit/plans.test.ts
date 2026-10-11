import { describe, expect, it } from "vitest";
import {
  PLANS,
  calendarMonthUtc,
  displayCurrency,
  formatMoney,
  monthlyPrice,
  planAllowsTier,
  resolveGraphicsTier,
} from "@/config/plans";
import { RENDER_PROFILES } from "@/config/graphics";

describe("central plan configuration (exact product rules)", () => {
  it("FREE: $0, one game per calendar month, graphics tiers B/C only", () => {
    expect(PLANS.FREE.monthlyPrices.USD).toBe(0);
    expect(PLANS.FREE.gamesPerPeriod).toBe(2);
    expect(PLANS.FREE.allowancePeriod).toEqual({ kind: "calendar_month_utc" });
    expect([...PLANS.FREE.graphics.allowedTiers]).toEqual(["B", "C"]);
    expect(planAllowsTier("FREE", "A")).toBe(false);
  });

  it("PLUS: $10/month internationally, exactly ₪30/month in Israel, 1 game per billing period, Tier A", () => {
    expect(PLANS.PLUS.monthlyPrices.USD).toBe(1000);
    expect(PLANS.PLUS.monthlyPrices.ILS).toBe(3000);
    expect(PLANS.PLUS.gamesPerPeriod).toBe(1);
    expect(PLANS.PLUS.allowancePeriod).toEqual({ kind: "billing_period" });
    expect(planAllowsTier("PLUS", "A")).toBe(true);
    expect(monthlyPrice("PLUS", "IL")).toEqual({ currency: "ILS", minor: 3000 });
    expect(formatMoney(monthlyPrice("PLUS", "IL").minor, "ILS")).toBe("₪30");
    expect(formatMoney(monthlyPrice("PLUS", "US").minor, "USD")).toBe("$10");
    expect(monthlyPrice("PLUS", null)).toEqual({ currency: "USD", minor: 1000 });
  });

  it("PRO: $40/month, 5 games per billing period, and NO invented shekel price", () => {
    expect(PLANS.PRO.monthlyPrices.USD).toBe(4000);
    expect(PLANS.PRO.monthlyPrices.ILS).toBeUndefined();
    expect(PLANS.PRO.gamesPerPeriod).toBe(5);
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
