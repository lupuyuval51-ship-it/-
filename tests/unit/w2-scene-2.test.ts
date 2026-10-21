/**
 * Scene helpers (wave 2, scene-2): world label textures on old WebViews and in both directions, untextured materials shared per
 * style, the objective-marker band on very short screens, and the skyline's GPU resources released one by one.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { RENDER_PROFILES } from "@/config/graphics";
import { MIN_BAND_PX, MIN_EDGE_PX, markerBand } from "@/components/game/scene/guideBand";
import { createMaterialSet, makeLabelTexture, roundedRectPath } from "@/components/game/scene/materials";
import type { EnvTheme } from "@/lib/game/world/types";

type Call = { name: string; args: unknown[]; direction?: string; font?: string };

/** A 2D context that records what is drawn. `measureText` is proportional to the font size, like a real font. */
function fakeContext(withRoundRect: boolean) {
  const calls: Call[] = [];
  const rec = (name: string) => function (this: { direction: string; font: string }, ...args: unknown[]) {
    calls.push({ name, args, direction: this.direction, font: this.font });
  };
  const ctx: Record<string, unknown> = {
    fillStyle: "", strokeStyle: "", lineWidth: 1, textAlign: "start", textBaseline: "alphabetic", direction: "inherit", font: "10px sans-serif",
    beginPath: rec("beginPath"), moveTo: rec("moveTo"), lineTo: rec("lineTo"), arcTo: rec("arcTo"), arc: rec("arc"), closePath: rec("closePath"),
    fill: rec("fill"), stroke: rec("stroke"), fillRect: rec("fillRect"), strokeRect: rec("strokeRect"), fillText: rec("fillText"),
    putImageData: rec("putImageData"),
    createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    measureText(this: { font: string }, t: string) {
      const px = Number(/(\d+)px/.exec(this.font)?.[1] ?? 10);
      return { width: [...t].length * px * 0.55 };
    },
  };
  if (withRoundRect) ctx.roundRect = rec("roundRect");
  return { ctx, calls };
}

function stubDocument(withRoundRect = true) {
  const all: Call[] = [];
  vi.stubGlobal("document", {
    createElement: () => {
      const { ctx, calls } = fakeContext(withRoundRect);
      const canvas = { width: 0, height: 0, getContext: () => ctx };
      // every canvas reports into one list, in drawing order
      calls.push = (...c: Call[]) => all.push(...c);
      return canvas;
    },
  });
  return all;
}

afterEach(() => vi.unstubAllGlobals());

describe("world label texture", () => {
  it("draws on a WebView without roundRect (before Chrome 99) instead of taking the scene down", () => {
    const calls = stubDocument(false);
    expect(() => makeLabelTexture("Gate of numbers", "#33ccff")).not.toThrow();
    const names = calls.map((c) => c.name);
    expect(names).not.toContain("roundRect");
    expect(names.filter((n) => n === "arcTo")).toHaveLength(4); // the same four rounded corners
    expect(names).toContain("fill");
    expect(names).toContain("stroke");
    expect(names).toContain("fillText");
  });

  it("still uses roundRect where it exists (nothing changes on current devices)", () => {
    const calls = stubDocument(true);
    makeLabelTexture("Gate of numbers", "#33ccff");
    const rr = calls.filter((c) => c.name === "roundRect");
    expect(rr).toHaveLength(1);
    expect(rr[0]!.args).toEqual([4, 4, 504, 88, 22]);
    expect(calls.some((c) => c.name === "arcTo")).toBe(false);
  });

  it("the arc fallback never asks for corners larger than the box", () => {
    const { ctx, calls } = fakeContext(false);
    roundedRectPath(ctx as unknown as CanvasRenderingContext2D, 0, 0, 10, 6, 22);
    const radii = calls.filter((c) => c.name === "arcTo").map((c) => c.args[4]);
    expect(radii).toEqual([3, 3, 3, 3]);
  });

  const directionOf = (text: string) => {
    const calls = stubDocument();
    makeLabelTexture(text, "#ffffff");
    return calls.find((c) => c.name === "fillText")!.direction;
  };

  it("a Hebrew label that starts with a multiplication or division sign is laid out right to left", () => {
    expect(directionOf("÷ חילוק שברים")).toBe("rtl");
    expect(directionOf("× לוח הכפל")).toBe("rtl");
    expect(directionOf("3 × 4 תרגול")).toBe("rtl");
  });

  it("a stray byte-order mark does not turn a Latin label right to left", () => {
    expect(directionOf(`${String.fromCharCode(0xfeff)}Station 1`)).toBe("ltr");
  });

  it("the first strong letter still decides for every interface language", () => {
    expect(directionOf("תחנה 1")).toBe("rtl");
    expect(directionOf("✓ תחנת השברים")).toBe("rtl");
    expect(directionOf("🔒 Gate")).toBe("ltr");
    expect(directionOf("Ñandú y árboles")).toBe("ltr");
    expect(directionOf("Station 1")).toBe("ltr");
    expect(directionOf("1/3 = x/9")).toBe("ltr"); // x is the blank, a Latin letter
    expect(directionOf("12 + 7")).toBe("inherit");
  });

  it("a name too long for the frame is condensed into it instead of running off both edges", () => {
    const calls = stubDocument();
    const long = `🔒 ${"Portal to the great hall of ancient numbers and".padEnd(50, "s")}`;
    makeLabelTexture(long, "#ffffff");
    const text = calls.find((c) => c.name === "fillText")!;
    expect(text.args[0]).toBe(long);
    expect(text.args[3]).toBe(512 - 40); // the frame's text width
    expect(text.font).toMatch(/^600 20px /); // the smallest size before condensing
  });

  it("a name that fits keeps its full size (maxWidth has no effect on it)", () => {
    const calls = stubDocument();
    makeLabelTexture("תחנה", "#ffffff");
    const text = calls.find((c) => c.name === "fillText")!;
    expect(text.font).toMatch(/^600 44px /);
    expect(text.args[3]).toBe(512 - 40);
  });

  it("a subtitle is condensed to the frame too", () => {
    const calls = stubDocument();
    makeLabelTexture("Boss", "#ffffff", "Guardian of the very long and winding loop of numbers");
    const texts = calls.filter((c) => c.name === "fillText");
    expect(texts).toHaveLength(2);
    expect(texts[1]!.args[3]).toBe(512 - 40);
  });
});

describe("surface materials", () => {
  const theme: EnvTheme = {
    skyTop: "#0b1430", skyBottom: "#3a5a8c", fog: "#8fa8c8", ground: "#3d5a3a", groundAlt: "#4a6a44", wall: "#8a8f9c", platform: "#6d7a8c",
    accent: "#33ccff", accent2: "#ff9f43", sun: "#fff2d0", sunIntensity: 1, ambient: 0.5, stars: false, clouds: false,
  };

  it("Tier B has no textures, so every box of a style shares one material whatever its size", () => {
    const set = createMaterialSet(RENDER_PROFILES.B, theme);
    for (const style of ["wall", "floor", "platform", "decor"]) {
      const a = set.surface(style, 3, 5);
      expect(set.surface(style, 40, 2), style).toBe(a);
      expect(set.surface(style, 0.5, 120), style).toBe(a);
    }
    expect(set.surface("wall", 3, 5)).not.toBe(set.surface("floor", 3, 5));
    set.dispose();
  });

  it("Tier B releases exactly one material per style however many box sizes there are", () => {
    const dispose = vi.spyOn(THREE.Material.prototype, "dispose");
    try {
      const set = createMaterialSet(RENDER_PROFILES.B, theme);
      for (let w = 1; w <= 30; w++) for (const style of ["wall", "floor", "platform"]) set.surface(style, w, 31 - w);
      set.dispose();
      expect(dispose).toHaveBeenCalledTimes(3);
    } finally {
      dispose.mockRestore();
    }
  });

  it("Tier A keeps a material per footprint, because its texture tiles with the box", () => {
    stubDocument();
    const set = createMaterialSet(RENDER_PROFILES.A, theme);
    const small = set.surface("floor", 4, 4) as THREE.MeshStandardMaterial;
    const big = set.surface("floor", 40, 40) as THREE.MeshStandardMaterial;
    expect(big).not.toBe(small);
    expect(small.map!.repeat.x).toBe(1);
    expect(big.map!.repeat.x).toBe(10);
    expect(set.surface("floor", 4.4, 3.6)).toBe(small); // same tile count: same material
    set.dispose();
  });
});

describe("objective marker band on very short screens", () => {
  const sides = { left: 28, right: 28 };

  it("never runs past the bottom of the screen, where a pinned marker would be invisible", () => {
    const b = markerBand(640, 300, { ...sides, top: 280, bottom: 16 });
    expect(b.bottom).toBeLessThanOrEqual(300 - MIN_EDGE_PX);
    expect(b.bottom - b.top).toBeGreaterThanOrEqual(MIN_BAND_PX);
    expect(b.top).toBeGreaterThanOrEqual(0);
  });

  it("stays on screen and ordered even on a screen shorter than the minimum band", () => {
    const b = markerBand(200, 60, { ...sides, top: 132, bottom: 120 });
    expect(b.top).toBeGreaterThanOrEqual(0);
    expect(b.top).toBeLessThan(b.bottom);
    expect(b.bottom).toBeLessThanOrEqual(60);
  });

  it("is exactly the HUD's band whenever the HUD leaves room for one (no change on ordinary screens)", () => {
    for (let height = 200; height <= 1200; height += 37) {
      for (let top = 0; top <= 320; top += 23) {
        for (const bottom of [16, 40, 72, 120, 180]) {
          const b = markerBand(800, height, { ...sides, top, bottom });
          expect(b.top).toBeGreaterThanOrEqual(0);
          expect(b.bottom).toBeLessThanOrEqual(height - MIN_EDGE_PX);
          expect(b.bottom - b.top).toBeGreaterThanOrEqual(Math.min(MIN_BAND_PX, height - MIN_EDGE_PX));
          if (height - bottom - top >= MIN_BAND_PX) expect(b, `${height}/${top}/${bottom}`).toMatchObject({ top, bottom: height - bottom });
        }
      }
    }
  });
});

describe("skyline and water release their GPU resources one by one", () => {
  const src = readFileSync(path.resolve(import.meta.dirname, "../../src/components/game/scene/Backdrop.tsx"), "utf8");

  it("a new skyline mesh over the same geometry and material never disposes them", () => {
    expect(src).toMatch(/useEffect\(\(\) => \(\) => geometry\.dispose\(\), \[geometry\]\);/);
    expect(src).toMatch(/useEffect\(\(\) => \(\) => material\.dispose\(\), \[material\]\);/);
    expect(src).toMatch(/useEffect\(\(\) => \(\) => mesh\.dispose\(\), \[mesh\]\);/);
    // no cleanup that releases a geometry together with the mesh that replaces it
    expect(src).not.toMatch(/geometry\.dispose\(\);\s*(material|mesh)\.dispose\(\)/);
  });
});
