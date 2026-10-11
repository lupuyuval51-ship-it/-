import { describe, expect, it } from "vitest";
import { DEFAULT_GUIDE_INSETS, MIN_BAND_PX, markerBand } from "@/components/game/scene/guideBand";

describe("objective marker band", () => {
  it("is the old fixed band when nothing else is known", () => {
    expect(markerBand(390, 844, DEFAULT_GUIDE_INSETS)).toEqual({ left: 28, right: 362, top: 132, bottom: 724 });
  });

  it("keeps a wide label fully on screen when the marker is pinned to a side", () => {
    const b = markerBand(390, 844, DEFAULT_GUIDE_INSETS, 180);
    expect(b.left).toBe(96); // half the label (90) + 6
    expect(b.right).toBe(390 - 96);
  });

  it("uses the HUD's insets", () => {
    const b = markerBand(740, 360, { top: 108, bottom: 130, left: 28, right: 28 });
    expect(b.top).toBe(108);
    expect(b.bottom).toBe(230);
  });

  it("never collapses: a band stays usable and the sides stay ordered", () => {
    const b = markerBand(300, 300, { top: 200, bottom: 200, left: 28, right: 28 }, 1000);
    expect(b.bottom - b.top).toBeGreaterThanOrEqual(MIN_BAND_PX);
    expect(b.left).toBeLessThan(b.right);
  });
});
