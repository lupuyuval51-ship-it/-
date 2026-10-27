import { describe, expect, it } from "vitest";
import { DICTIONARIES, makeT } from "@/lib/i18n";

/** What a learner hit on 2026-10-27 (daily user check), pinned so it stays fixed. */
describe("the pause menu's graphics note", () => {
  it("says at which tier the game is drawn, not that the plan chose it (on a phone the device and Settings decide)", () => {
    // a Pro learner on a 4-core phone saw "Your plan renders at Tier B" next to a Plans card promising Tier A
    for (const locale of ["en", "he", "es"] as const) {
      const text = makeT(DICTIONARIES[locale])("hud.quality.granted", { tier: "B" });
      expect(text, locale).not.toMatch(/plan|תוכנית|plan/iu);
      expect(text, locale).toContain("B");
    }
  });
});
