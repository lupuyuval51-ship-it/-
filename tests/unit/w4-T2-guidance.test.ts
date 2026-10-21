import { describe, expect, it } from "vitest";
import { addFinalBoss } from "@/lib/game/spec/boss";
import { toPublicSpec } from "@/lib/game/spec/public";
import { GuideModel, guideTargets, nearestTarget } from "@/lib/game/state/guidance";
import { initialState, toClientState, type ClientState } from "@/lib/game/state/progress";
import { buildWorld } from "@/lib/game/world/build";
import { validDemoSpec } from "./helpers";

/** "Where do I go next?": the cases the main guidance suite leaves out (battles, several open missions, nothing to point at). */
const full = validDemoSpec({ gameType: "adventure", mode: "FULL" });
const publicOf = (s: typeof full) => toPublicSpec(s);
const clientOf = (s: typeof full, over: Partial<ClientState> = {}): ClientState => ({ ...toClientState(initialState(s, 0)), ...over });

describe("guideTargets", () => {
  it("leads through a boss battle one round at a time, in the order the rounds open", () => {
    const boss = addFinalBoss(full).spec;
    const b = boss.bosses[0]!;
    const spec = publicOf(boss);
    const world = buildWorld(boss, b.areaId);
    const bossMission = boss.missions.find((m) => m.objectives.some((o) => o.type === "defeat"))!;
    const before = boss.missions.filter((m) => m.id !== bossMission.id).map((m) => m.id);
    const at = (resolved: string[]) => guideTargets(spec, clientOf(boss, { areaId: b.areaId, missionsDone: before, resolvedStations: Object.fromEntries(resolved.map((id) => [id, "correct" as const])) }), world);
    expect(at([]).map((t) => t.id)).toEqual([b.phaseStationIds[0]]);
    expect(at([b.phaseStationIds[0]!]).map((t) => t.id)).toEqual([b.phaseStationIds[1]]);
    expect(at(b.phaseStationIds.slice(0, -1)).map((t) => t.id)).toEqual([b.phaseStationIds.at(-1)]);
    expect(at([])[0]).toMatchObject({ kind: "station", missionId: bossMission.id });
    expect(at(b.phaseStationIds)).toEqual([]); // every round won: nothing left to point at (the mission completes with the last answer)
  });

  it("prefers an open mission in the area the player is in, even when an earlier mission elsewhere is open too", () => {
    const open = structuredClone(full);
    open.missions.find((m) => m.id === "m-robot")!.requires = []; // a-lab's first mission is open from the start, like m-boot in a-plaza
    const spec = publicOf(open);
    const lab = guideTargets(spec, clientOf(open, { areaId: "a-lab" }), buildWorld(open, "a-lab"));
    expect(lab.length).toBeGreaterThan(0);
    expect(new Set(lab.map((t) => t.missionId))).toEqual(new Set(["m-robot"]));
    const plaza = guideTargets(spec, clientOf(open), buildWorld(open, "a-plaza"));
    expect(new Set(plaza.map((t) => t.missionId))).toEqual(new Set(["m-boot"]));
  });

  it("a mission in another area with no portal here points at nothing (rather than at a made-up place)", () => {
    const spec = publicOf(full);
    const lab = buildWorld(full, "a-lab");
    expect(lab.portal).toBeNull();
    expect(guideTargets(spec, clientOf(full, { areaId: "a-lab", missionsDone: ["m-boot"] }), lab)).toEqual([]); // the open mission (m-choices) is in a-plaza
  });

  it("collect: the nearest gem to the player, none once every gem is taken, and a gem still in flight to the server does not count", () => {
    const spec = publicOf(full);
    const world = buildWorld(full, "a-plaza");
    const state = clientOf(full, { missionsDone: ["m-boot"], resolvedStations: { "s-cond1": "correct" } }); // m-choices: only "collect 2" is left
    const last = world.collectibles.at(-1)!;
    const from = { x: last.x, z: last.z };
    expect(world.collectibles.length).toBeGreaterThan(2);
    const first = guideTargets(spec, state, world, { player: from });
    expect(first.filter((t) => t.kind === "collectible")).toHaveLength(1);
    expect(first[0]!.id).toBe(last.itemId); // the one the player stands at, not the first in the list
    const second = guideTargets(spec, state, world, { player: from, isCollected: (id) => id === first[0]!.id });
    expect(second[0]!.id).not.toBe(first[0]!.id);
    const none = guideTargets(spec, state, world, { isCollected: () => true });
    expect(none.filter((t) => t.kind === "collectible")).toEqual([]);
  });

  it("a lore station stops being a target once it was visited; a character the world does not show is simply skipped", () => {
    const spec = publicOf(full);
    const world = buildWorld(full, "a-plaza");
    const state = clientOf(full, { missionsDone: ["m-boot", "m-choices"], resolvedStations: { "s-loop1": "correct", "s-seq1": "correct" } }); // m-loops: only the lore card is left
    expect(guideTargets(spec, state, world).map((t) => `${t.kind}:${t.id}`)).toEqual(["lore:s-lore1"]);
    expect(guideTargets(spec, { ...state, visited: ["s-lore1"] }, world)).toEqual([]);
    const noNpc = { ...world, npcs: [] };
    expect(guideTargets(spec, clientOf(full), noNpc).some((t) => t.kind === "npc")).toBe(false);
  });

  it("a round of a battle that is still locked is not pointed at until the round before it is won", () => {
    const boss = addFinalBoss(full).spec;
    const b = boss.bosses[0]!;
    const spec = publicOf(boss);
    const world = buildWorld(boss, b.areaId);
    // m-robot is open and asks for s-robot1 and s-robot2, which are the first two rounds of the battle
    const state = clientOf(boss, { areaId: b.areaId, missionsDone: ["m-boot", "m-choices", "m-loops"], talked: ["n-gear"] });
    expect(b.phaseStationIds.slice(0, 2)).toEqual(["s-robot1", "s-robot2"]);
    expect(guideTargets(spec, state, world).map((t) => t.id)).toEqual(["s-robot1"]);
    const afterFirst = { ...state, resolvedStations: { "s-robot1": "correct" as const } };
    expect(guideTargets(spec, afterFirst, world).map((t) => t.id)).toEqual(["s-robot2"]);
  });

  it("a solve target is only a station that can be played now, and is dropped once it is resolved", () => {
    const spec = publicOf(full);
    const world = buildWorld(full, "a-plaza");
    const state = clientOf(full, { talked: ["n-byte"] });
    expect(guideTargets(spec, state, world).map((t) => t.id).sort()).toEqual(["s-var1", "s-var2"]);
    expect(guideTargets(spec, { ...state, resolvedStations: { "s-var1": "revealed" } }, world).map((t) => t.id)).toEqual(["s-var2"]);
  });
});

describe("nearestTarget and GuideModel", () => {
  const targets = [
    { kind: "station", id: "far", label: "", x: 30, y: 0, z: 0, missionId: "m" },
    { kind: "station", id: "near", label: "", x: 1, y: 0, z: 1, missionId: "m" },
    { kind: "station", id: "mid", label: "", x: 5, y: 0, z: 5, missionId: "m" },
  ] as const;

  it("the nearest target ignores height and breaks no ties by throwing", () => {
    expect(nearestTarget(targets, { x: 0, z: 0 })?.id).toBe("near");
    expect(nearestTarget(targets, { x: 30, z: 1 })?.id).toBe("far");
    const same = [{ ...targets[0], id: "a", x: 2, z: 0 }, { ...targets[0], id: "b", x: 0, z: 2 }];
    expect(["a", "b"]).toContain(nearestTarget(same, { x: 0, z: 0 })?.id);
  });

  it("the first target is the primary one when the player's position is not known; the nearest when it is", () => {
    const spec = publicOf(full);
    const world = buildWorld(full, "a-plaza");
    const client = clientOf(full);
    const g = new GuideModel();
    g.refresh(spec, client, world);
    expect(g.primary).toBe(g.targets[0]);
    const station = g.targets.find((t) => t.kind === "station")!;
    g.refresh(spec, client, world, { player: { x: station.x, z: station.z } });
    expect(g.primary?.id).toBe(station.id);
  });

  it("with nothing left to do there are no targets and no primary", () => {
    const spec = publicOf(full);
    const world = buildWorld(full, "a-plaza");
    const g = new GuideModel();
    g.refresh(spec, clientOf(full, { missionsDone: full.missions.map((m) => m.id) }), world);
    expect(g.targets).toEqual([]);
    expect(g.primary).toBeNull();
  });

  it("tick recomputes four times a second and not between", () => {
    const spec = publicOf(full);
    const world = buildWorld(full, "a-plaza");
    const g = new GuideModel();
    const client = clientOf(full);
    g.tick(0.016, spec, client, world); // the very first tick computes at once
    const first = g.targets;
    expect(first.length).toBeGreaterThan(0);
    g.tick(0.1, spec, clientOf(full, { talked: ["n-byte"] }), world);
    expect(g.targets).toBe(first); // 0.1 s since the last computation: nothing yet
    g.tick(0.2, spec, clientOf(full, { talked: ["n-byte"] }), world);
    expect(g.targets).not.toBe(first); // past 0.25 s: recomputed
    expect(g.targets.some((t) => t.kind === "npc")).toBe(false);
  });
});
