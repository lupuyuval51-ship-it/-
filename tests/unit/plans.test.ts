import { describe, expect, it } from "vitest";
import {
  PLANS,
  calendarMonthUtc,
  defaultLevel,
  hasLeft,
  displayCurrency,
  levelsAllowed,
  maxLevel,
  planOffer,
  planUnlockingLevel,
  quotaLeft,
  quotaOf,
  formatMoney,
  monthlyPrice,
  planAllowsTier,
  resolveGraphicsTier,
} from "@/config/plans";
import { RENDER_PROFILES } from "@/config/graphics";
import { offerText } from "@/components/pricing/PlanPrice";
import { leftText, levelHasLeft, offeredLevels, shortLeftItems, type LevelLeft } from "@/components/allowance/quota";
import { DICTIONARIES, makeT } from "@/lib/i18n";

describe("central plan configuration (exact product rules)", () => {
  it("FREE: $0, 1 topic at level B and 5 at level C per calendar month (never A), graphics tiers B/C only", () => {
    expect(PLANS.FREE.monthlyPrices.USD).toBe(0);
    expect(PLANS.FREE.allowance).toEqual({ B: 1, C: 5 });
    expect(PLANS.FREE.allowancePeriod).toEqual({ kind: "calendar_month_utc" });
    expect([...PLANS.FREE.graphics.allowedTiers]).toEqual(["B", "C"]);
    expect(planAllowsTier("FREE", "A")).toBe(false);
  });

  it("PLUS: $5/month internationally, exactly ₪5/month in Israel, 5 at A / 10 at B / unlimited C per billing period, Tier A", () => {
    expect(PLANS.PLUS.monthlyPrices.USD).toBe(500);
    expect(PLANS.PLUS.monthlyPrices.ILS).toBe(500);
    expect(PLANS.PLUS.allowance).toEqual({ A: 5, B: 10, C: null });
    expect(PLANS.PLUS.allowancePeriod).toEqual({ kind: "billing_period" });
    expect(planAllowsTier("PLUS", "A")).toBe(true);
    expect(monthlyPrice("PLUS", "IL")).toEqual({ currency: "ILS", minor: 500 });
    expect(formatMoney(monthlyPrice("PLUS", "IL").minor, "ILS")).toBe("₪5");
    expect(formatMoney(monthlyPrice("PLUS", "US").minor, "USD")).toBe("$5");
    expect(monthlyPrice("PLUS", null)).toEqual({ currency: "USD", minor: 500 });
  });

  it("PRO: $20/month internationally, exactly ₪20/month in Israel, 5 at A / 10 at B / unlimited C per billing period", () => {
    expect(PLANS.PRO.monthlyPrices.USD).toBe(2000);
    expect(PLANS.PRO.monthlyPrices.ILS).toBe(2000);
    expect(formatMoney(monthlyPrice("PRO", "IL").minor, "ILS")).toBe("₪20");
    expect(PLANS.PRO.allowance).toEqual({ A: 5, B: 10, C: null });
    expect(displayCurrency("PRO", "IL")).toBe("ILS");
    expect(monthlyPrice("PRO", "IL")).toEqual({ currency: "ILS", minor: 2000 });
    expect(monthlyPrice("PRO", "US")).toEqual({ currency: "USD", minor: 2000 });
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
    expect(formatMoney(2000, "USD")).toBe("$20");
    expect(formatMoney(999, "USD")).toBe("$9.99");
    expect(formatMoney(0, "ILS")).toBe("₪0");
  });
});

describe("allowance: a separate quota per level (the owner's table)", () => {
  it("states the offer exactly as the owner specified it, highest level first", () => {
    // Free = 1 topic at level B and 5 at level C per calendar month. Never A (paying plans only).
    expect(planOffer("FREE")).toEqual([{ level: "B", topics: 1 }, { level: "C", topics: 5 }]);
    // Plus = 5 at level A, 10 at level B, level C unlimited.
    expect(planOffer("PLUS")).toEqual([{ level: "A", topics: 5 }, { level: "B", topics: 10 }, { level: "C", topics: null }]);
    // Pro = 5 at level A, 10 at level B, level C unlimited.
    expect(planOffer("PRO")).toEqual([{ level: "A", topics: 5 }, { level: "B", topics: 10 }, { level: "C", topics: null }]);
  });

  it("knows which levels a plan can make and each level's own quota; Free can never make A", () => {
    expect(levelsAllowed("FREE")).toEqual(["B", "C"]);
    expect(levelsAllowed("PLUS")).toEqual(["A", "B", "C"]);
    expect(levelsAllowed("PRO")).toEqual(["A", "B", "C"]);
    expect(quotaOf("FREE", "A")).toBe(0);
    expect([quotaOf("FREE", "C"), quotaOf("FREE", "B")]).toEqual([5, 1]);
    expect([quotaOf("PLUS", "C"), quotaOf("PLUS", "B"), quotaOf("PLUS", "A")]).toEqual([null, 10, 5]);
    expect([quotaOf("PRO", "C"), quotaOf("PRO", "B"), quotaOf("PRO", "A")]).toEqual([null, 10, 5]);
    expect([maxLevel("FREE"), maxLevel("PLUS"), maxLevel("PRO")]).toEqual(["B", "A", "A"]);
    expect(planUnlockingLevel("A")).toBe("PLUS");
    expect(planUnlockingLevel("B")).toBe("FREE");
  });

  it("every offered quota is a whole number of at least one game or unlimited; only C may be unlimited, and never on Free", () => {
    for (const plan of ["FREE", "PLUS", "PRO"] as const) {
      for (const l of levelsAllowed(plan)) {
        const q = quotaOf(plan, l);
        if (q === null) expect(plan !== "FREE" && l === "C", `${plan} ${l}`).toBe(true);
        else expect(Number.isInteger(q) && q >= 1, `${plan} ${l}`).toBe(true);
      }
      // every plan has at least one counted level (the test seam uses the largest one)
      expect(levelsAllowed(plan).some((l) => quotaOf(plan, l) !== null)).toBe(true);
    }
    // a higher plan never offers fewer games at any level
    for (const l of ["A", "B", "C"] as const) {
      const n = (p: "FREE" | "PLUS" | "PRO") => quotaOf(p, l) ?? Infinity;
      expect(n("PLUS")).toBeGreaterThanOrEqual(n("FREE"));
      expect(n("PRO")).toBeGreaterThanOrEqual(n("PLUS"));
    }
  });

  it("counts what is left at one level: never negative, unlimited stays unlimited (also after a downgrade)", () => {
    expect(quotaLeft(5, 1, 1)).toBe(3);
    expect(quotaLeft(3, 5, 0)).toBe(0); // a downgrade can leave more used than the new limit
    expect(quotaLeft(null, 40, 1)).toBeNull();
    expect([hasLeft(null), hasLeft(1), hasLeft(0)]).toEqual([true, true, false]);
  });

  it("the default level is the highest one that fits the request and still has a game left at its own level", () => {
    // nothing used yet: the plan's highest level
    expect(defaultLevel("FREE")).toBe("B");
    expect(defaultLevel("PLUS")).toBe("A");
    expect(defaultLevel("PRO", { A: 5, B: 10, C: null })).toBe("A");
    // the levels are separate counts: A used up on Plus leaves B, B used up on Free leaves C
    expect(defaultLevel("PLUS", { A: 0, B: 5, C: null })).toBe("B");
    expect(defaultLevel("PLUS", { A: 0, B: 0, C: null })).toBe("C");
    expect(defaultLevel("FREE", { B: 0, C: 5 })).toBe("C");
    expect(defaultLevel("PRO", { A: 0, B: 0, C: null })).toBe("C");
    // nothing left that fits → the best level that fits (the server answers 402 later)
    expect(defaultLevel("FREE", { B: 0, C: 5 }, (l) => l !== "C")).toBe("B");
    expect(defaultLevel("FREE", { B: 0, C: 0 })).toBe("B");
  });
});

describe("the offer and the games left are worded from the quotas (never typed), in every interface language", () => {
  const en = makeT(DICTIONARIES.en);
  const he = makeT(DICTIONARIES.he);
  const es = makeT(DICTIONARIES.es);

  it("lists every level's own count, highest first, joined as a sum (not alternatives)", () => {
    expect(offerText(en, "FREE")).toBe("1 topic at level B and 5 at level C");
    expect(offerText(en, "PLUS")).toBe("5 topics at level A, 10 at level B and unlimited at level C");
    expect(offerText(en, "PRO")).toBe("5 topics at level A, 10 at level B and unlimited at level C");
    expect(offerText(he, "FREE")).toBe("נושא אחד ברמה B ו-5 ברמה C");
    expect(offerText(he, "PLUS")).toBe("5 נושאים ברמה A, 10 ברמה B וללא הגבלה ברמה C");
    expect(offerText(es, "FREE")).toBe("1 tema de nivel B y 5 de nivel C");
    expect(offerText(es, "PRO")).toBe("5 temas de nivel A, 10 de nivel B e ilimitados de nivel C");
  });

  it("words what is left at one level and the header's short items", () => {
    expect(leftText(en, { level: "B", limit: 5, remaining: 3 }, "1 Nov 2026")).toBe("3 of 5 left");
    expect(leftText(en, { level: "B", limit: 5, remaining: 0 }, "1 Nov 2026")).toBe("none left until 1 Nov 2026");
    expect(leftText(en, { level: "C", limit: null, remaining: null }, "1 Nov 2026")).toBe("unlimited");
    const levels: Record<"A" | "B" | "C", LevelLeft> = { A: { level: "A", limit: 0, remaining: 0 }, B: { level: "B", limit: 1, remaining: 1 }, C: { level: "C", limit: null, remaining: null } };
    expect(shortLeftItems(en, levels)).toEqual(["B: 1", "C: ∞"]);
    expect(offeredLevels(levels).map((l) => l.level)).toEqual(["B", "C"]);
    expect([levelHasLeft(levels.A), levelHasLeft(levels.B), levelHasLeft(levels.C), levelHasLeft({ limit: 1, remaining: 0 })]).toEqual([false, true, true, false]);
  });
});
