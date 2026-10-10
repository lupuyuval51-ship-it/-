import { describe, expect, it } from "vitest";
import { computeLayout, DEFAULT_LAYOUT, scrollCue, stickTravel, stickVector, TOUCH_METRICS } from "@/lib/layout";

describe("computeLayout", () => {
  it("keeps the portrait phone as the default design", () => {
    const l = computeLayout(390, 844);
    expect(l).toMatchObject({ landscape: false, shortLandscape: false, twoColumns: false, touchScale: "regular", missionsOpen: false });
    expect(DEFAULT_LAYOUT).toEqual(l);
  });

  it("treats a phone held sideways as short landscape with compact controls and folded missions", () => {
    for (const [w, h] of [[844, 390], [740, 360], [915, 412], [667, 375]] as const) {
      const l = computeLayout(w, h);
      expect(l.shortLandscape).toBe(true);
      expect(l.touchScale).toBe("compact");
      expect(l.missionsOpen).toBe(false);
    }
  });

  it("treats tablets as large, in both orientations, with two columns from 768px", () => {
    const portrait = computeLayout(820, 1180);
    const landscape = computeLayout(1180, 820);
    expect(portrait).toMatchObject({ shortLandscape: false, twoColumns: true, touchScale: "large", missionsOpen: true });
    expect(landscape).toMatchObject({ landscape: true, shortLandscape: false, twoColumns: true, touchScale: "large", missionsOpen: true });
  });

  it("does not make a small tablet portrait compact, and a wide-but-short desktop window stays compact", () => {
    expect(computeLayout(768, 1024).touchScale).toBe("large");
    expect(computeLayout(1280, 480).shortLandscape).toBe(true);
    expect(computeLayout(1280, 501).shortLandscape).toBe(false);
  });

  it("falls back to the phone design for invalid sizes", () => {
    expect(computeLayout(0, 0)).toEqual(DEFAULT_LAYOUT);
    expect(computeLayout(Number.NaN, -5)).toEqual(DEFAULT_LAYOUT);
  });

  it("has touch metrics for every scale, growing with the scale", () => {
    const px = (c: string) => Number(c.replace("size-", ""));
    expect(px(TOUCH_METRICS.compact.stick)).toBeLessThan(px(TOUCH_METRICS.regular.stick));
    expect(px(TOUCH_METRICS.regular.stick)).toBeLessThan(px(TOUCH_METRICS.large.stick));
    expect(px(TOUCH_METRICS.compact.action)).toBeGreaterThanOrEqual(14); // 56px: still a reachable tap target
  });
});

describe("virtual stick maths", () => {
  it("reproduces the original phone travel (base 128px, knob 56px -> 50px)", () => {
    expect(stickTravel(128, 56)).toBe(50);
  });

  it("never returns a non-positive travel", () => {
    expect(stickTravel(0, 0)).toBe(1);
  });

  it("reports a unit-bounded vector with y up", () => {
    const t = stickTravel(128, 56);
    const right = stickVector(30, 0, t);
    expect(right.x).toBeCloseTo(0.6);
    expect(right.y).toBeCloseTo(0);
    const upFar = stickVector(0, -500, t);
    expect(upFar.y).toBeCloseTo(1);
    expect(upFar.ky).toBeCloseTo(-t);
    const diag = stickVector(500, 500, t);
    expect(Math.hypot(diag.x, diag.y)).toBeCloseTo(1);
  });

  it("is centred at zero", () => {
    const v = stickVector(0, 0, 50);
    expect([Math.abs(v.x), Math.abs(v.y), v.kx, v.ky]).toEqual([0, 0, 0, 0]);
  });
});

describe("scrollCue", () => {
  it("shows nothing when the content fits", () => {
    expect(scrollCue(0, 300, 300)).toEqual({ above: false, below: false });
    expect(scrollCue(0, 300, 303)).toEqual({ above: false, below: false }); // sub-pixel slack
  });

  it("flags hidden content below at the top, both ways in the middle, above at the end", () => {
    expect(scrollCue(0, 200, 400)).toEqual({ above: false, below: true });
    expect(scrollCue(100, 200, 400)).toEqual({ above: true, below: true });
    expect(scrollCue(200, 200, 400)).toEqual({ above: true, below: false });
    expect(scrollCue(198, 200, 400).below).toBe(false);
  });

  it("is safe with garbage input", () => {
    expect(scrollCue(NaN, 200, 400)).toEqual({ above: false, below: false });
  });
});
