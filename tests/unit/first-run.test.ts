import { describe, expect, it } from "vitest";
import { REGION_CHOICES, REGION_OTHER, freshDefaults, sanitizeRegion } from "@/lib/offline/first-run";

describe("first run of the offline app", () => {
  it("a fresh install starts in Hebrew, with the country 'Other', and still has the setup to do", () => {
    expect(freshDefaults(false)).toEqual({ locale: "he", region: REGION_OTHER, setupDone: false });
  });
  it("the test build keeps Hebrew and skips the setup, so the other phone specs start on the library", () => {
    expect(freshDefaults(true)).toEqual({ locale: "he", region: REGION_OTHER, setupDone: true });
  });
  it("only known countries are accepted; anything else becomes 'Other'", () => {
    expect(REGION_CHOICES).toContain("IL");
    expect(sanitizeRegion("IL")).toBe("IL");
    expect(sanitizeRegion("XX")).toBe(REGION_OTHER);
    expect(sanitizeRegion(5)).toBe(REGION_OTHER);
    expect(sanitizeRegion(undefined)).toBe(REGION_OTHER);
  });
});

describe("first-run questionnaire answers", () => {
  it("keeps only valid answers", async () => {
    const { sanitizeInterests, sanitizeMinutes, sanitizePlanChoice } = await import("@/lib/offline/first-run");
    expect(sanitizeInterests(["math", "nope", "math", "science"])).toEqual(["math", "science"]);
    expect(sanitizeInterests("math")).toEqual([]);
    expect(sanitizeMinutes(10)).toBe(10);
    expect(sanitizeMinutes(7)).toBeNull();
    expect(sanitizePlanChoice("PLUS")).toBe("PLUS");
    expect(sanitizePlanChoice("GOLD")).toBeNull();
  });
  it("20 minutes or more a day suggests a full adventure, less a quick game", async () => {
    const { modeForMinutes } = await import("@/lib/offline/first-run");
    expect(modeForMinutes(null)).toBe("FAST");
    expect(modeForMinutes(10)).toBe("FAST");
    expect(modeForMinutes(20)).toBe("FULL");
    expect(modeForMinutes(30)).toBe("FULL");
  });
});
