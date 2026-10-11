import { describe, expect, it } from "vitest";
import { applyDeadzone, bottomAboveControls, bottomEdge, controlsHeightRem, controlsInsetStyle, controlsPadRem, keyboardInset, landscapeReserveRem, landscapeStrip, safePadAll, safePadX, sideWithInset, STICK_DEADZONE, topWithInset } from "@/components/game/hud/hudLayout";
import { computeLayout, TOUCH_METRICS } from "@/lib/layout";

describe("controls clearance (derived from the touch metrics)", () => {
  it("is as tall as the tallest control of each scale", () => {
    // regular: sprint 3.5rem + gap 0.75rem + action 4rem sit in one column (8.25rem), taller than the 8rem stick
    expect(controlsHeightRem("regular")).toBeCloseTo(8.25);
    // large: sprint 4 + gap 1 + action 5 = 10rem, the same as the 10rem stick
    expect(controlsHeightRem("large")).toBeCloseTo(10);
    // compact (landscape): one row, so the stick (6rem) is the tallest
    expect(controlsHeightRem("compact")).toBeCloseTo(6);
  });

  it("grows with the scale, so a bigger stick always pushes the prompt higher", () => {
    expect(controlsHeightRem("compact")).toBeLessThan(controlsHeightRem("regular"));
    expect(controlsHeightRem("regular")).toBeLessThan(controlsHeightRem("large"));
  });

  it("places things above the controls and the gesture bar", () => {
    const css = bottomAboveControls("regular", 0.5);
    expect(css).toBe("calc(8.75rem + max(1rem, env(safe-area-inset-bottom, 0px)))");
    // the controls' own bottom padding is max(<scale padding>, inset), so the clearance must use the same floor
    expect(css).toContain(`max(${controlsPadRem("regular").bottom}rem, env(safe-area-inset-bottom`);
    expect(bottomAboveControls("large")).not.toBe(bottomAboveControls("regular"));
  });

  it("keeps a bottom-edge element clear of the gesture bar", () => {
    expect(bottomEdge(0.5)).toBe("max(0.5rem, env(safe-area-inset-bottom, 0px))");
  });
});

describe("controls padding (taken from the scale's own padding, then the device insets)", () => {
  it("reads the Tailwind padding of each scale", () => {
    expect(controlsPadRem("compact")).toEqual({ side: 0.75, bottom: 0.5 }); // px-3 pb-2
    expect(controlsPadRem("regular")).toEqual({ side: 1, bottom: 1 }); // p-4
    expect(controlsPadRem("large")).toEqual({ side: 1.5, bottom: 1.5 }); // p-6
  });

  it("keeps the thumbs off the gesture bar and the curved screen edges", () => {
    const s = controlsInsetStyle("regular");
    expect(s.paddingBottom).toBe("max(1rem, env(safe-area-inset-bottom, 0px))");
    expect(s.paddingLeft).toBe("max(1rem, env(safe-area-inset-left, 0px))");
    expect(s.paddingRight).toBe("max(1rem, env(safe-area-inset-right, 0px))");
    expect(controlsInsetStyle("large").paddingBottom).toContain("max(1.5rem");
  });
});

describe("landscape strip between the stick and the buttons", () => {
  it("reserves the stick on the left and the three buttons on the right", () => {
    const r = landscapeReserveRem("compact");
    expect(r.left).toBeCloseTo(0.75 + 6 + 0.5); // padding + size-24 stick + margin
    expect(r.right).toBeCloseTo(0.75 + 2.75 + 0.5 + 3.5 + 0.5 + 3.5 + 0.5); // padding + sprint + jump + use (+ gaps, margin)
    expect(landscapeReserveRem("compact", false).right).toBeLessThan(r.right);
  });

  it("leaves room for a prompt on every phone width we support", () => {
    for (const w of [568, 640, 667, 740, 844, 915]) {
      const l = computeLayout(w, 360);
      expect(l.shortLandscape).toBe(true);
      const r = landscapeReserveRem(l.touchScale);
      expect(w - (r.left + r.right) * 16, `${w}px wide`).toBeGreaterThanOrEqual(260);
    }
  });

  it("folds the notch inset into both edges", () => {
    const s = landscapeStrip("compact");
    expect(s.left).toBe("max(7.25rem, calc(6.50rem + env(safe-area-inset-left, 0px)))");
    expect(s.right).toBe("max(12.00rem, calc(11.25rem + env(safe-area-inset-right, 0px)))");
    expect(sideWithInset(0.75, "left", 0.75)).toContain("env(safe-area-inset-left");
  });

  it("uses the same sizes as the controls themselves", () => {
    // the strip is computed from these classes: if someone changes them, the numbers above must follow
    expect(TOUCH_METRICS.compact).toMatchObject({ stick: "size-24", sprint: "size-11", action: "size-14", gap: "gap-2" });
  });
});

describe("safe-area helpers", () => {
  it("pads both sides with at least the base and the inset", () => {
    expect(safePadX()).toEqual({ paddingLeft: "max(0.75rem, env(safe-area-inset-left, 0px))", paddingRight: "max(0.75rem, env(safe-area-inset-right, 0px))" });
    expect(safePadX("1rem").paddingLeft).toContain("max(1rem,");
  });

  it("pads an overlay on all four sides", () => {
    const p = safePadAll();
    expect(p.paddingTop).toBe("max(1rem, env(safe-area-inset-top, 0px))");
    expect(p.paddingBottom).toBe("max(1rem, env(safe-area-inset-bottom, 0px))");
    expect(p.paddingLeft).toContain("safe-area-inset-left");
    expect(p.paddingRight).toContain("safe-area-inset-right");
  });

  it("moves a top-anchored element down by the part of the inset the bar's padding does not already cover", () => {
    expect(topWithInset(4.9, 0.75)).toBe("calc(4.9rem + max(0px, env(safe-area-inset-top, 0px) - 0.75rem))");
  });
});

describe("keyboardInset", () => {
  const vv = (height: number, offsetTop = 0, scale = 1) => ({ height, offsetTop, scale });

  it("is zero without a visual viewport or with nonsense values", () => {
    expect(keyboardInset(800, null)).toBe(0);
    expect(keyboardInset(800, undefined)).toBe(0);
    expect(keyboardInset(Number.NaN, vv(500))).toBe(0);
    expect(keyboardInset(800, vv(Number.NaN))).toBe(0);
  });

  it("is zero when nothing covers the page (and for the few pixels a browser toolbar can take)", () => {
    expect(keyboardInset(800, vv(800))).toBe(0);
    expect(keyboardInset(800, vv(760))).toBe(0);
  });

  it("measures the part of the page the keyboard covers", () => {
    expect(keyboardInset(800, vv(500))).toBe(300);
    // the visual viewport may also have scrolled down inside the layout viewport
    expect(keyboardInset(800, vv(500, 40))).toBe(260);
  });

  it("ignores pinch-zoom, which also shrinks the visual viewport", () => {
    expect(keyboardInset(800, vv(400, 0, 2))).toBe(0);
  });

  it("never goes negative", () => {
    expect(keyboardInset(500, vv(800))).toBe(0);
  });
});

describe("stick dead zone", () => {
  it("ignores a resting thumb", () => {
    expect(applyDeadzone(0, 0)).toEqual({ x: 0, y: 0 });
    expect(applyDeadzone(STICK_DEADZONE * 0.9, 0)).toEqual({ x: 0, y: 0 });
    expect(applyDeadzone(Number.NaN, 0)).toEqual({ x: 0, y: 0 });
  });

  it("keeps the direction and climbs smoothly from zero", () => {
    const a = applyDeadzone(0.3, 0.4); // magnitude 0.5
    expect(Math.atan2(a.y, a.x)).toBeCloseTo(Math.atan2(0.4, 0.3));
    expect(Math.hypot(a.x, a.y)).toBeCloseTo((0.5 - STICK_DEADZONE) / (1 - STICK_DEADZONE));
    const just = applyDeadzone(STICK_DEADZONE + 0.01, 0);
    expect(just.x).toBeGreaterThan(0);
    expect(just.x).toBeLessThan(0.02);
  });

  it("still reaches full tilt, and never more", () => {
    expect(applyDeadzone(1, 0)).toEqual({ x: 1, y: 0 });
    const d = applyDeadzone(0.6, 0.8);
    expect(Math.hypot(d.x, d.y)).toBeCloseTo(1);
    expect(Math.hypot(applyDeadzone(3, 4).x, applyDeadzone(3, 4).y)).toBeCloseTo(1);
  });
});
