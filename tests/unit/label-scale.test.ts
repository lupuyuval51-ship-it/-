import { describe, expect, it } from "vitest";
import { LABEL_BASE_FACTOR, labelHeightFactor, labelPixelHeight, MIN_LABEL_PX } from "@/components/game/scene/labelScale";

const FOV = 62; // the game camera

describe("world label size", () => {
  it("keeps the original size on tall screens", () => {
    for (const h of [844, 900, 1080, 1440]) expect(labelHeightFactor(h, FOV), `${h}px high`).toBe(LABEL_BASE_FACTOR);
  });

  it("never lets a label fall below a readable height on short screens", () => {
    // phone held sideways, small portrait phone, and the in-between sizes
    for (const h of [320, 360, 390, 412, 600, 640, 700]) {
      const px = labelPixelHeight(labelHeightFactor(h, FOV), h, FOV);
      expect(px, `${h}px high`).toBeGreaterThanOrEqual(MIN_LABEL_PX - 0.001);
    }
  });

  it("only grows as the screen gets shorter", () => {
    const sizes = [1080, 844, 700, 640, 500, 360, 320].map((h) => labelHeightFactor(h, FOV));
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]!).toBeGreaterThanOrEqual(sizes[i - 1]!);
  });

  it("scales with the label's own scale (character names are a little smaller than stations)", () => {
    const f = labelHeightFactor(360, FOV);
    expect(labelPixelHeight(f, 360, FOV, 0.9)).toBeCloseTo(0.9 * labelPixelHeight(f, 360, FOV, 1));
  });

  it("falls back to the original size for nonsense input", () => {
    expect(labelHeightFactor(0, FOV)).toBe(LABEL_BASE_FACTOR);
    expect(labelHeightFactor(Number.NaN, FOV)).toBe(LABEL_BASE_FACTOR);
    expect(labelHeightFactor(360, 0)).toBe(LABEL_BASE_FACTOR);
    expect(labelHeightFactor(360, 180)).toBe(LABEL_BASE_FACTOR);
  });
});
