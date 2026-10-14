import { describe, expect, it } from "vitest";
import { REGION_CHOICES, REGION_OTHER, freshDefaults, sanitizeRegion } from "@/lib/offline/first-run";

describe("first run of the offline app", () => {
  it("a fresh install starts in English, with the country 'Other', and still has the setup to do", () => {
    expect(freshDefaults(false)).toEqual({ locale: "en", region: REGION_OTHER, setupDone: false });
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
