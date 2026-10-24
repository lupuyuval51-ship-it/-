import { describe, expect, it } from "vitest";
import { INTERACT_RADIUS } from "@/lib/game/engine/constants";
import type { GameSpec } from "@/lib/game/spec/schema";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { buildWorld } from "@/lib/game/world/build";
import { orderStationsForDoors, playThrough } from "@/lib/game/world/flow";
import { walkable } from "./world-helpers";
import { validDemoSpec } from "./helpers";

/**
 * A side mission in the first area that waits for a mission of the next area: portals are one-way, so its station never
 * opens in the first area. With doors that open in station order such a station must stand in the last room (next to the
 * portal), and the planner has to know that the portal is then still reachable.
 */
function sideMissionWaitingForLaterArea(layout: "rooms" | "corridor", blockedStations: 1 | 2): GameSpec {
  const spec = validDemoSpec({ gameType: "puzzle", mode: "FULL", subject: "Fractions" });
  for (const a of spec.areas) a.layout = layout;
  const hall = spec.areas[0]!;
  const ids = hall.stations.map((s) => s.id);
  expect(ids).toEqual(["s-ops", "s-frac", "s-eq", "s-steps"]);
  const side = blockedStations === 1 ? ["s-steps"] : ["s-eq", "s-steps"];
  // the blocked stations come second in the list, so the listed order cannot work
  const byId = new Map(hall.stations.map((s) => [s.id, s]));
  hall.stations = ["s-ops", ...side, ...ids.filter((id) => id !== "s-ops" && !side.includes(id))].map((id) => byId.get(id)!);
  const sideChallenges = side.map((id) => byId.get(id)!.challengeId!);
  const mHall = spec.missions.find((m) => m.id === "m-hall")!;
  mHall.objectives = mHall.objectives.flatMap((o): GameSpec["missions"][number]["objectives"] => {
    if (o.type !== "solve") return [o];
    const keep = o.challengeIds.filter((c) => !sideChallenges.includes(c));
    return keep.length ? [{ ...o, challengeIds: keep }] : [];
  });
  spec.missions.push({
    id: "m-side", title: "Later", story: "Come back later", areaId: hall.id, requires: ["m-tower"], optional: true,
    objectives: [{ type: "solve", text: "Solve the side puzzles", challengeIds: sideChallenges }],
  });
  return spec;
}

describe("doors in station order: a station that never opens in its area can stand in the last room, next to the portal", () => {
  for (const layout of ["rooms", "corridor"] as const) {
    it(`${layout}: the planner reaches the portal with one such station left, and the validator puts it in the last room`, () => {
      const spec = sideMissionWaitingForLaterArea(layout, 1);
      expect(playThrough(spec, "check").finished).toBe(false);
      const plan = playThrough(spec, "plan");
      expect(plan.finished, JSON.stringify(plan.stuck)).toBe(true);
      expect(plan.order.get("a-hall")).toEqual(["s-ops", "s-frac", "s-eq", "s-steps"]);

      const res = validateGameSpec(spec, { alignGameType: "puzzle" });
      expect(res.ok, res.ok ? "" : res.errors.join("; ")).toBe(true);
      if (!res.ok) return;
      const hall = res.spec.areas[0]!;
      expect(hall.stations.map((s) => s.id)).toEqual(["s-ops", "s-frac", "s-eq", "s-steps"]);
      expect(res.warnings.some((w) => w.includes('area "a-hall": stations reordered'))).toBe(true);
      // what the validator hands on really plays through in its listed order, and nothing more is reordered
      expect(playThrough(res.spec, "check").finished).toBe(true);
      expect(orderStationsForDoors(structuredClone(res.spec))).toEqual([]);

      // the geometry agrees: with the doors of the first three stations open the portal can be reached
      const w = buildWorld(res.spec, hall.id);
      expect(w.gates).toHaveLength(3);
      const can = walkable(w, (id) => w.gates.findIndex((g) => g.id === id) < 3);
      expect(can(w.portal!.x, w.portal!.z, INTERACT_RADIUS - 0.4)).toBe(true);
      const last = w.stations.find((s) => s.stationId === "s-steps")!;
      const shut = walkable(w, (id) => w.gates.findIndex((g) => g.id === id) < 2);
      expect(shut(last.x, last.z, INTERACT_RADIUS - 0.4)).toBe(false);
      expect(shut(w.portal!.x, w.portal!.z, INTERACT_RADIUS - 0.4)).toBe(false);
    });
  }

  it("two stations that never open cannot both fit in the last room: still rejected, naming them and what they wait for", () => {
    const spec = sideMissionWaitingForLaterArea("rooms", 2);
    const plan = playThrough(spec, "plan");
    expect(plan.finished).toBe(false);
    expect(plan.stuck?.areaId).toBe("a-hall");
    expect(plan.stuck?.blocked).toEqual(["s-eq", "s-steps"]);
    expect(plan.stuck?.waitingFor).toEqual(["m-tower"]);
    const res = validateGameSpec(spec, { alignGameType: "puzzle" });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      const msg = res.errors.join(" ");
      expect(msg).toMatch(/cannot be finished/);
      expect(msg).toContain('"s-eq", "s-steps"');
      expect(msg).toContain('"m-tower"');
    }
  });

  it("without doors the same game was already accepted, in any order (the two modes now agree)", () => {
    const spec = sideMissionWaitingForLaterArea("rooms", 1);
    spec.mechanics = spec.mechanics.filter((m) => m !== "gates");
    expect(playThrough(spec, "check").finished).toBe(true);
    expect(playThrough(spec, "plan").finished).toBe(true);
  });
});
