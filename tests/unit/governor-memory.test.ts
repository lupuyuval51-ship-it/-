import { afterEach, describe, expect, it } from "vitest";
import {
  DPR_SCALE, FrameGovernor, MAX_QUALITY_LEVEL, MIN_DPR, dprForLevel, forgetRememberedLevels, rememberLevel, rememberedLevel,
} from "@/components/game/scene/governor";

afterEach(() => forgetRememberedLevels());

/** Feeds frames of `dt` seconds for `seconds`; the levels the governor stepped to, in order. */
const run = (g: FrameGovernor, dt: number, seconds: number) => {
  const out: number[] = [];
  for (let t = 0; t < seconds; t += dt) {
    const next = g.push(dt);
    if (next !== null) out.push(next);
  }
  return out;
};

describe("the quality level a slow phone was pushed to is remembered for the next canvas", () => {
  // Another area, a replay or the next game builds a new canvas. Starting it at full quality again made the phone climb the
  // whole ladder again: 3 to 6 seconds of poor frames per step.
  it("starts at the top, remembers only steps down, and never lets a lower level undo it", () => {
    expect(rememberedLevel("B")).toBe(0);
    rememberLevel("B", 2);
    expect(rememberedLevel("B")).toBe(2);
    rememberLevel("B", 1);
    expect(rememberedLevel("B")).toBe(2);
    rememberLevel("B", 3);
    expect(rememberedLevel("B")).toBe(3);
  });

  it("is kept per tier, because every tier has its own ceiling", () => {
    rememberLevel("B", 2);
    expect(rememberedLevel("A")).toBe(0);
    expect(rememberedLevel("C")).toBe(0);
  });

  it("stays inside the ladder and ignores nonsense", () => {
    rememberLevel("A", 99);
    expect(rememberedLevel("A")).toBe(MAX_QUALITY_LEVEL);
    rememberLevel("B", Number.NaN);
    rememberLevel("B", -3);
    expect(rememberedLevel("B")).toBe(0);
  });

  it("a canvas that starts from the remembered level does not climb the ladder again", () => {
    // first canvas: 20 fps steps down once after the warm-up and two slow windows
    const first = new FrameGovernor();
    const steps = run(first, 1 / 20, 6);
    expect(steps).toEqual([1]);
    rememberLevel("B", first.level);

    // the next canvas begins where the last one ended
    const next = new FrameGovernor({ startLevel: rememberedLevel("B") });
    expect(next.level).toBe(1);
    // and the one after a deeper step down begins deeper still
    rememberLevel("B", 3);
    expect(new FrameGovernor({ startLevel: rememberedLevel("B") }).level).toBe(3);
  });

  it("a fast phone is not touched: the level stays 0", () => {
    const g = new FrameGovernor({ startLevel: rememberedLevel("A") });
    expect(run(g, 1 / 60, 30)).toEqual([]);
    expect(g.level).toBe(0);
  });
});

describe("pixel ratio of a level", () => {
  it("scales the screen's ratio by the level's step and never goes below the floor", () => {
    DPR_SCALE.forEach((scale, level) => expect(dprForLevel(2, level)).toBeCloseTo(Math.max(MIN_DPR, 2 * scale), 10));
    expect(dprForLevel(0.5, MAX_QUALITY_LEVEL)).toBe(MIN_DPR);
    expect(dprForLevel(1.5, 0)).toBe(1.5);
  });
});
