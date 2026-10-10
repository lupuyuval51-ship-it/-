import { describe, expect, it } from "vitest";
import { hashQuery, isLastStep, markWelcomeSeen, recommendedNext, shouldShowWelcome, stepIndex, WELCOME_KEY, WELCOME_STEPS } from "@/lib/offline/onboarding";
import { memoryKV, type KV } from "@/lib/offline/store";
import { DICTIONARIES } from "@/lib/i18n";

describe("welcome state", () => {
  it("shows on a fresh install, then never again once seen or skipped", () => {
    const kv = memoryKV();
    expect(shouldShowWelcome(kv, false)).toBe(true);
    markWelcomeSeen(kv);
    expect(kv.get(WELCOME_KEY)).toBe("1");
    expect(shouldShowWelcome(kv, false)).toBe(false);
  });
  it("is skipped for people who already have games (upgrade)", () => {
    expect(shouldShowWelcome(memoryKV(), true)).toBe(false);
  });
  it("never nags or throws when storage is unavailable", () => {
    const broken: KV = { get: () => { throw new Error("blocked"); }, set: () => { throw new Error("blocked"); }, remove: () => { throw new Error("blocked"); } };
    expect(shouldShowWelcome(broken, false)).toBe(false);
    expect(() => markWelcomeSeen(broken)).not.toThrow();
  });
});

describe("steps", () => {
  it("has three steps and clamps navigation", () => {
    expect(WELCOME_STEPS).toHaveLength(3);
    expect(stepIndex(-4)).toBe(0);
    expect(stepIndex(99)).toBe(2);
    expect(stepIndex(Number.NaN)).toBe(0);
    expect(isLastStep(1)).toBe(false);
    expect(isLastStep(2)).toBe(true);
  });
  it("every step has a title and text in both languages", () => {
    for (const locale of ["he", "en"] as const) {
      const d = DICTIONARIES[locale] as Record<string, string>;
      for (const s of WELCOME_STEPS) {
        expect(d[`mob.welcome.${s}.title`]?.length).toBeGreaterThan(0);
        expect(d[`mob.welcome.${s}.text`]?.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("hashQuery", () => {
  it("reads the query of a hash route", () => {
    expect(hashQuery("#/create?example=1").get("example")).toBe("1");
    expect(hashQuery("#/?welcome=1").get("welcome")).toBe("1");
    expect(hashQuery("#/create").get("example")).toBeNull();
    expect(hashQuery("").get("example")).toBeNull();
  });
});

describe("recommendedNext", () => {
  it("sends players to their mistakes first", () => {
    expect(recommendedNext({ completed: true, stars: 3 }, 2)).toBe("review");
    expect(recommendedNext({ completed: false, stars: 0 }, 1)).toBe("review");
  });
  it("suggests another try when unfinished or under three stars", () => {
    expect(recommendedNext({ completed: false, stars: 1 }, 0)).toBe("replay");
    expect(recommendedNext({ completed: true, stars: 2 }, 0)).toBe("replay");
  });
  it("suggests a new game after a perfect run", () => {
    expect(recommendedNext({ completed: true, stars: 3 }, 0)).toBe("new");
  });
});
