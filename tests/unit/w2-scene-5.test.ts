import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BEAM_SLOTS, IDLE_SPEED, MarkerLabel, beamTargets, stoodStill } from "@/components/game/scene/Guide";
import { labelOpacity } from "@/components/game/scene/Marks";
import { labelScreenOpacity } from "@/lib/labelFade";
import { nearestTarget, type GuideTarget } from "@/lib/game/state/guidance";

const target = (id: string, x: number, z: number, kind: GuideTarget["kind"] = "station"): GuideTarget => ({ kind, id, label: id, x, y: 0, z, missionId: "m-1" });

describe("every objective the guide leads to has a beam", () => {
  // An AI game may list a talk, six terminals and a coin in one mission: eight targets for six beams.
  const long = [target("n-1", 40, 0, "npc"), ...Array.from({ length: 6 }, (_, i) => target(`s-${i}`, 30 + i * 5, 30)), target("c-1", 2, 1, "collectible")];

  it("the nearest target of a long mission is the primary, and it is last in mission order", () => {
    const primary = nearestTarget(long, { x: 0, z: 0 });
    expect(primary?.id).toBe("c-1");
    expect(long.indexOf(primary!)).toBeGreaterThanOrEqual(BEAM_SLOTS); // the old slots (targets[0..5]) never reached it
  });

  it("the primary gets a beam even when it comes after the sixth target", () => {
    const primary = nearestTarget(long, { x: 0, z: 0 })!;
    const shown = beamTargets(long, primary);
    expect(shown).toHaveLength(BEAM_SLOTS);
    expect(shown).toContain(primary);
    expect(new Set(shown).size).toBe(shown.length);
    // the others keep their mission order
    expect(shown.slice(0, BEAM_SLOTS - 1)).toEqual(long.slice(0, BEAM_SLOTS - 1));
  });

  it("a short mission keeps every target in order, with no duplicate for the primary", () => {
    const short = long.slice(0, 3);
    expect(beamTargets(short, short[2]!)).toEqual(short);
    expect(beamTargets(short, null)).toEqual(short);
    expect(beamTargets(long, null)).toEqual(long.slice(0, BEAM_SLOTS));
    expect(beamTargets([], null)).toEqual([]);
  });

  it("writes into the array it is given (no garbage every frame) and never more slots than asked", () => {
    const out: GuideTarget[] = [target("stale", 0, 0)];
    const res = beamTargets(long, long[7]!, 3, out);
    expect(res).toBe(out);
    expect(res.map((t) => t.id)).toEqual(["n-1", "s-0", "c-1"]);
    expect(beamTargets(long, long[7]!, 0, out)).toEqual([]);
  });
});

/** The parts of the HUD marker the projector touches: the element, its label child and its measured width. */
function fakeMarker(width = 120) {
  const label = { writes: 0, value: "", set textContent(v: string) { this.writes += 1; this.value = v; }, get textContent() { return this.value; } };
  const el = { firstElementChild: { lastElementChild: label }, offsetWidth: width };
  return { el: el as unknown as HTMLElement, label };
}

describe("the objective marker's label", () => {
  it("is written once while the text stays the same", () => {
    const m = new MarkerLabel();
    const { el, label } = fakeMarker(96);
    m.write(el, "Terminal · 12 m");
    m.write(el, "Terminal · 12 m");
    expect(label.writes).toBe(1);
    expect(label.value).toBe("Terminal · 12 m");
    expect(m.width).toBe(96);
    m.write(el, "Terminal · 11 m");
    expect(label.writes).toBe(2);
  });

  it("a marker mounted again after a panel closes gets its text, even when the distance did not change", () => {
    // The HUD unmounts the marker during pause, dialogue, lore and challenges, and mounts an empty one afterwards.
    const m = new MarkerLabel();
    const before = fakeMarker(110);
    m.write(before.el, "המסוף · 12 מ׳");
    const after = fakeMarker(140);
    m.write(after.el, "המסוף · 12 מ׳");
    expect(after.label.value).toBe("המסוף · 12 מ׳");
    expect(m.width).toBe(140);
  });

  it("an element without the label child is tolerated", () => {
    const m = new MarkerLabel();
    const el = { firstElementChild: null, offsetWidth: 30 } as unknown as HTMLElement;
    expect(() => m.write(el, "x")).not.toThrow();
    expect(m.width).toBe(30);
  });
});

describe("Pip notices a slow walk on every screen", () => {
  const walk = (speed: number, fps: number) => stoodStill(speed / fps, 1 / fps);

  it("a slow walk counts as moving at 60, 120 and 144 frames a second", () => {
    for (const fps of [30, 60, 90, 120, 144]) expect(walk(2, fps), `${fps} fps`).toBe(false);
  });

  it("standing still counts as still, and the line is the old one at 60 frames a second", () => {
    expect(stoodStill(0, 1 / 60)).toBe(true);
    expect(stoodStill(0.019, 1 / 60)).toBe(true);
    expect(stoodStill(0.021, 1 / 60)).toBe(false);
    expect(IDLE_SPEED / 60).toBeCloseTo(0.02, 6);
  });

  it("slow frames compare with the time the simulation really advanced (0.1 s at most)", () => {
    expect(stoodStill(6 * 0.1, 0.25)).toBe(false); // a full walk on a 4 fps phone
    expect(stoodStill(0.05, 0.25)).toBe(true);
    // a respawn or the first frame (a big jump) is never "still"
    expect(stoodStill(30, 0)).toBe(false);
    expect(stoodStill(0, 0)).toBe(true);
    expect(stoodStill(0, -1)).toBe(true);
  });
});

describe("world labels that faded out are not drawn", () => {
  it("is 0 from 44 m and behind the camera, and the old product of the two fades otherwise", () => {
    expect(labelOpacity(44, 0, 0, 0.5, 0.3)).toBe(0);
    expect(labelOpacity(80, 0, 0, 0.5, 0.3)).toBe(0);
    expect(labelOpacity(10, 0, 0, 1.2, 0.3)).toBe(0);
    expect(labelOpacity(Number.NaN, 0, 0, 0.5, 0.3)).toBe(0);
    expect(labelOpacity(10, 0, 0, 0.5, 0.3)).toBe(labelScreenOpacity(0, 0, 0.5, 0.3));
    expect(labelOpacity(36, 0.2, -0.1, 0.5, 0.3)).toBeCloseTo(0.5 * labelScreenOpacity(0.2, -0.1, 0.5, 0.3), 9);
  });

  it("the label hides its sprite exactly when the opacity is 0", () => {
    const src = readFileSync(path.join(import.meta.dirname, "../../src/components/game/scene/Marks.tsx"), "utf8");
    expect(src).toMatch(/const opacity = labelOpacity\(real, ndc\.x, ndc\.y, ndc\.z, safeTop\);/);
    expect(src).toMatch(/s\.visible = opacity > 0;/);
  });
});
