import { describe, expect, it } from "vitest";
import { guideTargets, nearestTarget } from "@/lib/game/state/guidance";
import { initialState, toClientState, type ClientState } from "@/lib/game/state/progress";
import { toPublicSpec } from "@/lib/game/spec/public";
import { buildWorld } from "@/lib/game/world/build";
import { validDemoSpec } from "./helpers";

const setup = (mode: "FAST" | "FULL" = "FULL") => {
  const spec = toPublicSpec(validDemoSpec({ mode }));
  const world = buildWorld(spec as never, spec.areas[0]!.id);
  const base = toClientState(initialState(spec as never, 0));
  return { spec, world, base };
};
const withState = (c: ClientState, over: Partial<ClientState>): ClientState => ({ ...c, ...over });

describe("guidance: where to go next", () => {
  it("starts with the first mission's open objectives: the NPC to talk to and the stations to solve", () => {
    const { spec, world, base } = setup();
    const t = guideTargets(spec, base, world);
    expect(t.map((x) => `${x.kind}:${x.id}`).sort()).toEqual(["npc:n-byte", "station:s-var1", "station:s-var2"]);
    expect(t.every((x) => x.missionId === "m-boot")).toBe(true);
  });

  it("drops finished objectives and never points at locked stations", () => {
    const { spec, world, base } = setup();
    const s1 = withState(base, { talked: ["n-byte"] });
    expect(guideTargets(spec, s1, world).map((x) => x.id).sort()).toEqual(["s-var1", "s-var2"]);
    const s2 = withState(s1, { resolvedStations: { "s-var1": "correct" } });
    expect(guideTargets(spec, s2, world).map((x) => x.id)).toEqual(["s-var2"]);
    // s-cond1 belongs to the next mission: not guided to while m-boot is open
    expect(guideTargets(spec, s2, world).some((x) => x.id === "s-cond1")).toBe(false);
  });

  it("moves on to the next mission, including the single nearest collectible and lore stations", () => {
    const { spec, world, base } = setup();
    const done = withState(base, { talked: ["n-byte"], resolvedStations: { "s-var1": "correct", "s-var2": "correct" }, missionsDone: ["m-boot"] });
    const t = guideTargets(spec, done, world, { player: { x: world.spawn.x, z: world.spawn.z } });
    expect(t.filter((x) => x.kind === "collectible")).toHaveLength(1);
    expect(t.some((x) => x.id === "s-cond1")).toBe(true);
    // collected / pending items are skipped
    const first = t.find((x) => x.kind === "collectible")!;
    const t2 = guideTargets(spec, done, world, { isCollected: (id) => id === first.id, player: { x: world.spawn.x, z: world.spawn.z } });
    expect(t2.find((x) => x.kind === "collectible")?.id).not.toBe(first.id);
  });

  it("leads to the portal when the next mission is in another area, and to nothing when the game is finished", () => {
    const { spec, world, base } = setup();
    const loopsDone = withState(base, { missionsDone: ["m-boot", "m-choices", "m-loops"], talked: ["n-byte"] });
    const t = guideTargets(spec, loopsDone, world);
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ kind: "portal", missionId: null });
    const all = withState(base, { missionsDone: spec.missions.map((m) => m.id) });
    expect(guideTargets(spec, all, world)).toEqual([]);
  });

  it("nearestTarget picks the closest one", () => {
    const targets = [
      { kind: "station", id: "a", label: "", x: 10, y: 0, z: 0, missionId: "m" },
      { kind: "station", id: "b", label: "", x: 2, y: 0, z: 1, missionId: "m" },
    ] as const;
    expect(nearestTarget(targets, { x: 0, z: 0 })?.id).toBe("b");
    expect(nearestTarget([], { x: 0, z: 0 })).toBeNull();
  });
});

describe("GuideModel", () => {
  it("recomputes at 4 Hz, picks the nearest target as primary and follows state changes on refresh", async () => {
    const { GuideModel } = await import("@/lib/game/state/guidance");
    const { spec, world, base } = setup();
    const g = new GuideModel();
    g.tick(0.1, spec, base, world, { player: world.spawn });
    expect(g.targets.length).toBeGreaterThan(0); // first tick computes immediately
    const n = g.targets.length;
    g.tick(0.05, spec, withState(base, { talked: ["n-byte"] }), world, { player: world.spawn });
    expect(g.targets.length).toBe(n); // not yet (throttled)
    g.refresh(spec, withState(base, { talked: ["n-byte"] }), world, { player: world.spawn });
    expect(g.targets.length).toBe(n - 1);
    expect(g.primary).not.toBeNull();
  });
});
