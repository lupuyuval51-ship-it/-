import { describe, expect, it } from "vitest";
import { DICTIONARIES } from "@/lib/i18n";

/**
 * Learner check of 2026-10-31: in Spanish, Settings → Plans named the free plan "Free" (English) while the same card's
 * price said "Gratis". Hebrew translates the free plan's name; Plus and Pro are names and stay as they are.
 */
describe("the free plan's name in every interface language", () => {
  it("is translated in Spanish, the same word as its price", () => {
    expect(DICTIONARIES.es["plan.FREE"]).toBe(DICTIONARIES.es["pricing.free.price"]);
    expect(DICTIONARIES.es["plan.FREE"]).not.toBe(DICTIONARIES.en["plan.FREE"]);
    expect(DICTIONARIES.he["plan.FREE"]).not.toBe(DICTIONARIES.en["plan.FREE"]);
  });

  it("Plus and Pro keep their names everywhere", () => {
    for (const locale of ["he", "en", "es"] as const) {
      expect(DICTIONARIES[locale]["plan.PLUS"]).toBe("Plus");
      expect(DICTIONARIES[locale]["plan.PRO"]).toBe("Pro");
    }
  });
});
