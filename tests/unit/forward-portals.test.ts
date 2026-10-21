import { describe, expect, it } from "vitest";
import type { GameSpec } from "@/lib/game/spec/schema";
import { crossCheck } from "@/lib/game/spec/validate";
import { validDemoSpec } from "./helpers";

/** A two-area adventure: the first mission of the second area, and a mission of the first area. */
function twoAreas(): GameSpec {
  const spec = structuredClone(validDemoSpec({ gameType: "adventure", mode: "FULL" })) as GameSpec;
  expect(spec.areas.length).toBeGreaterThanOrEqual(2);
  return spec;
}

describe("portals only lead forward", () => {
  it("a mission that waits for a mission of a later area is an error (there is no way back to finish it)", () => {
    const spec = twoAreas();
    const [a, b] = [spec.areas[0]!, spec.areas[1]!];
    const later = spec.missions.find((m) => m.areaId === b.id)!;
    expect(crossCheck(spec).errors).toEqual([]);
    // a side mission in the first area that waits for a mission of the second: the HUD would show it locked for ever
    const first = spec.missions.find((m) => m.areaId === a.id)!;
    spec.missions.push({ ...structuredClone(first), id: "m-side", title: "Side quest", optional: true, requires: [later.id] });
    const errors = crossCheck(spec).errors;
    expect(errors.some((e) => e.includes('mission "m-side" can never be completed') && e.includes("later area"))).toBe(true);
  });

  it("waiting for a mission of an earlier area is fine", () => {
    const spec = twoAreas();
    const [a, b] = [spec.areas[0]!, spec.areas[1]!];
    const early = spec.missions.find((m) => m.areaId === a.id)!;
    const later = spec.missions.find((m) => m.areaId === b.id)!;
    if (!later.requires.includes(early.id)) later.requires = [...later.requires, early.id];
    expect(crossCheck(spec).errors.filter((e) => e.includes("later area"))).toEqual([]);
  });
});
