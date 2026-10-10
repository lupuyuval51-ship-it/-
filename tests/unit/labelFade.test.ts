import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LABEL_SIDE_LIMIT, labelSafeTop, labelScreenOpacity } from "@/lib/labelFade";
import { computeLayout } from "@/lib/layout";

const safe = 0.3;

describe("labelScreenOpacity", () => {
  it("keeps a label in the middle of the open world fully visible", () => {
    expect(labelScreenOpacity(0, -0.2, 0.5, safe)).toBe(1);
    expect(labelScreenOpacity(0.5, 0, 0.5, 0.22)).toBe(1);
  });

  it("fades labels toward the left and right screen edges and hides them beyond", () => {
    const mid = labelScreenOpacity(LABEL_SIDE_LIMIT + 0.09, 0, 0.5, safe);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    expect(labelScreenOpacity(0.99, 0, 0.5, safe)).toBe(0);
    expect(labelScreenOpacity(-0.99, 0, 0.5, safe)).toBe(0);
    expect(labelScreenOpacity(-0.9, 0, 0.5, safe)).toBe(labelScreenOpacity(0.9, 0, 0.5, safe));
  });

  it("hides labels that would sit under the HUD band at the top", () => {
    // ndcY = 1 is the top edge; the top 30% is ndcY > 0.4
    expect(labelScreenOpacity(0, 0.95, 0.5, safe)).toBe(0);
    expect(labelScreenOpacity(0, 0.6, 0.5, safe)).toBe(0);
    expect(labelScreenOpacity(0, 0.0, 0.5, safe)).toBe(1);
    const ramp = labelScreenOpacity(0, 0.45, 0.5, safe); // in the fade ramp at the band edge
    expect(ramp).toBeGreaterThan(0);
    expect(ramp).toBeLessThan(1);
  });

  it("hides labels behind the camera or with non-finite projections, and just below the bottom edge", () => {
    expect(labelScreenOpacity(0, 0, 1.2, safe)).toBe(0);
    expect(labelScreenOpacity(NaN, 0, 0.5, safe)).toBe(0);
    expect(labelScreenOpacity(0, -1.2, 0.5, safe)).toBe(0);
  });
});

describe("labelSafeTop", () => {
  it("reserves more of the screen on portrait phones than on wide screens", () => {
    const phone = labelSafeTop(computeLayout(412, 915)); // Pixel 7
    const short = labelSafeTop(computeLayout(844, 390));
    const wide = labelSafeTop(computeLayout(1024, 768));
    expect(phone).toBeGreaterThan(wide);
    expect(short).toBeGreaterThan(wide);
    expect(wide).toBeGreaterThanOrEqual(0.2);
  });
});

describe("Label wiring", () => {
  it("projects the label to screen space and applies the fade in Marks.tsx", () => {
    const src = readFileSync("src/components/game/scene/Marks.tsx", "utf8");
    expect(src).toMatch(/\.project\(camera\)/);
    expect(src).toMatch(/labelScreenOpacity\(/);
  });
});
