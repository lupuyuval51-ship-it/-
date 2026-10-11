import { describe, expect, it } from "vitest";
import { PLANS } from "@/config/plans";
import { getOfflinePlan, getOfflineTier } from "@/lib/offline/entitlement";
import { OfflineGenerationError, generateOffline } from "@/lib/offline/generate";

const request = { mode: "FULL", subject: "Fractions", learningGoal: "Fractions", difficulty: "intermediate", gameType: "adventure", contentLanguage: "en" } as const;

describe("offline app feature tiers", () => {
  it("keeps the full tier until Google Play Billing decides otherwise", () => {
    expect(getOfflinePlan()).toBe("PRO");
    expect(getOfflineTier()).toBe("A");
  });

  it("maps each plan to the same tier as the server", () => {
    for (const id of ["FREE", "PLUS", "PRO"] as const) expect(getOfflineTier(id)).toBe(PLANS[id].featureTier);
  });

  it("refuses what the tier does not include instead of building it", () => {
    expect(() => generateOffline(request, new Date(), "C")).toThrow(OfflineGenerationError);
    try { generateOffline(request, new Date(), "C"); } catch (e) { expect((e as OfflineGenerationError).code).toBe("TIER_LOCKED"); }
  });

  it("cuts a game down to the tier, and a lower tier never has more than a higher one", () => {
    const a = generateOffline(request, new Date(), "A").spec;
    const b = generateOffline(request, new Date(), "B").spec;
    const c = generateOffline({ ...request, mode: "FAST", gameType: "puzzle" }, new Date(), "C").spec;
    expect(a.meta.featureTier).toBe("A");
    expect(b.meta.featureTier).toBe("B");
    expect(c.meta.featureTier).toBe("C");
    expect(a.bosses.length).toBeGreaterThan(0);
    expect(c.bosses.length).toBe(0);
    expect(b.challenges.length).toBeLessThanOrEqual(a.challenges.length);
  });
});

describe("offline games are fitted to the phone", () => {
  it("a phone request gets the phone version, with the same challenges", () => {
    const desktop = generateOffline({ ...request, gameType: "platformer" }, new Date(), "A").spec;
    const phone = generateOffline({ ...request, gameType: "platformer", device: "phone" }, new Date(), "A").spec;
    expect(phone.challenges.map((c) => c.id)).toEqual(desktop.challenges.map((c) => c.id));
    expect(phone.mechanics).not.toContain("moving_platforms");
    for (const a of phone.areas) {
      expect(a.size).not.toBe("large");
      if (a.layout === "terraces") expect(a.size).toBe("small");
    }
    expect(phone.meta.generator).toMatchObject({ kind: desktop.meta.generator!.kind });
  });
});
