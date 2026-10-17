import { describe, expect, it } from "vitest";
import { addFinalBoss } from "@/lib/game/spec/boss";
import type { GameSpec } from "@/lib/game/spec/schema";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { demoCorpus, engineCorpus } from "@/lib/game/sim-balance/corpus";
import { mulberry32, hashSeed } from "@/lib/game/util/prng";
import { playThrough } from "@/lib/game/world/flow";
import { validDemoSpec } from "./helpers";

const withDoors = (spec: GameSpec, layout: "rooms" | "corridor"): GameSpec => {
  const s = structuredClone(spec);
  s.mechanics = [...new Set([...s.mechanics, "gates" as const])];
  for (const a of s.areas) a.layout = layout;
  return s;
};

describe("rooms with doors open in station order: the validator proves the game can be finished", () => {
  it("every shipped game (demo templates and study-engine games, with their final boss) can be finished through its doors", () => {
    for (const c of [...demoCorpus(), ...engineCorpus()]) {
      const spec = addFinalBoss(c.spec).spec;
      expect(playThrough(spec, "check").finished, c.id).toBe(true);
    }
  });

  it("stations in any order are put right (lossless reorder) instead of producing a game nobody can finish", () => {
    const rnd = mulberry32(hashSeed("flow"));
    let reordered = 0;
    for (const layout of ["rooms", "corridor"] as const) {
      for (let k = 0; k < 8; k++) {
        const spec = withDoors(addFinalBoss(validDemoSpec({ gameType: "adventure", mode: "FULL", subject: k % 2 ? "Fractions" : "Python loops" })).spec, layout);
        for (const a of spec.areas) a.stations.sort(() => rnd() - 0.5);
        const ids = spec.areas.map((a) => [...a.stations.map((s) => s.id)].sort());
        const res = validateGameSpec(spec);
        expect(res.ok, res.ok ? "" : res.errors.join("; ")).toBe(true);
        if (!res.ok) continue;
        if (res.warnings.some((w) => w.includes("reordered"))) reordered += 1;
        expect(playThrough(res.spec, "check").finished).toBe(true);
        // nothing lost, nothing invented
        expect(res.spec.areas.map((a) => [...a.stations.map((s) => s.id)].sort())).toEqual(ids);
        expect(res.spec.challenges.length).toBe(spec.challenges.length);
      }
    }
    expect(reordered).toBeGreaterThan(3);
  });

  it("a game whose order already works is left exactly as it is", () => {
    const spec = withDoors(validDemoSpec({ gameType: "adventure", mode: "FULL", subject: "Fractions" }), "rooms");
    const before = JSON.stringify(spec.areas.map((a) => a.stations.map((s) => s.id)));
    const res = validateGameSpec(spec);
    expect(res.ok).toBe(true);
    if (res.ok && playThrough(spec, "check").finished) expect(JSON.stringify(res.spec.areas.map((a) => a.stations.map((s) => s.id)))).toBe(before);
  });

  it("rejects what no order can fix, naming the area, the stations and the missions they wait for", () => {
    const spec = withDoors(validDemoSpec({ gameType: "puzzle", mode: "FAST", subject: "Fractions" }), "rooms");
    const area = spec.areas[0]!;
    area.collectibles = { ...area.collectibles, count: 2 };
    const [s0, s1] = area.stations.filter((s) => s.kind === "challenge");
    area.stations = [s0!, s1!];
    spec.challenges = spec.challenges.filter((c) => c.id === s0!.challengeId || c.id === s1!.challengeId || spec.challenges.some((o) => o.easierId === c.id || o.harderId === c.id));
    for (const c of spec.challenges) {
      delete c.easierId;
      delete c.harderId;
    }
    spec.challenges = spec.challenges.filter((c) => c.id === s0!.challengeId || c.id === s1!.challengeId);
    area.npcs = [];
    area.portal = undefined;
    spec.bosses = [];
    spec.learning.objectives = spec.learning.objectives.slice(0, 1);
    for (const c of spec.challenges) c.objectiveId = spec.learning.objectives[0]!.id;
    // m-a needs both collectibles, but the second one lies in room 1, behind the door of station 0, which only unlocks with m-b (after m-a)
    spec.missions = [
      { id: "m-a", title: "Gems", story: "Collect", areaId: area.id, requires: [], optional: false, objectives: [{ type: "collect", text: "Collect 2", count: 2 }] },
      { id: "m-b", title: "Solve", story: "Solve", areaId: area.id, requires: ["m-a"], optional: false, objectives: [{ type: "solve", text: "Solve both", challengeIds: [s0!.challengeId!, s1!.challengeId!] }] },
    ];
    const res = validateGameSpec(spec, { alignGameType: "puzzle" });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      const msg = res.errors.join(" ");
      expect(msg).toMatch(/cannot be finished/);
      expect(msg).toContain(`"${area.id}"`);
      expect(msg).toContain(`"${s0!.id}"`);
      expect(msg).toContain('"m-a"');
    }
  });
});
