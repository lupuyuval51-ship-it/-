import { describe, expect, it } from "vitest";
import { addFinalBoss } from "@/lib/game/spec/boss";
import type { GameSpec } from "@/lib/game/spec/schema";
import { hashSeed, mulberry32 } from "@/lib/game/util/prng";
import { collectibleRoom, describeStuck, doorsOpenInOrder, orderStationsForDoors, playThrough, type FlowStuck } from "@/lib/game/world/flow";
import { validDemoSpec } from "./helpers";

/**
 * The perfect-player model behind the validator's "can this game be finished?" proof (wave 4, T1). `flow.test.ts` and
 * `w2-world-1.test.ts` cover it through `validateGameSpec`; these tests call the model itself: the rule that says which
 * areas have doors, the room a collectible lives in, the report of a game that cannot be finished, the planner, and the
 * ways a spec can be broken without the loop ever ending.
 */

const withDoors = (spec: GameSpec, layout: "rooms" | "corridor" = "rooms"): GameSpec => {
  const s = structuredClone(spec);
  s.mechanics = [...new Set([...s.mechanics, "gates" as const])];
  for (const a of s.areas) a.layout = layout;
  return s;
};
const adventure = (subject = "Fractions"): GameSpec => addFinalBoss(validDemoSpec({ gameType: "adventure", mode: "FULL", subject })).spec;
const stationIds = (spec: GameSpec) => spec.areas.map((a) => a.stations.map((s) => s.id));

describe("doorsOpenInOrder", () => {
  it("is true only for an area with several stations, the gates mechanic and a layout that has doors", () => {
    const spec = withDoors(adventure(), "rooms");
    const area = spec.areas[0]!;
    expect(area.stations.length).toBeGreaterThan(1);
    expect(doorsOpenInOrder(spec, area)).toBe(true);
    expect(doorsOpenInOrder(withDoors(adventure(), "corridor"), withDoors(adventure(), "corridor").areas[0]!)).toBe(true);

    // no gates mechanic: the doorways are open
    const open = structuredClone(spec);
    open.mechanics = open.mechanics.filter((m) => m !== "gates");
    expect(doorsOpenInOrder(open, open.areas[0]!)).toBe(false);

    // one station: nothing to wait for
    const single = structuredClone(spec);
    single.areas[0]!.stations = single.areas[0]!.stations.slice(0, 1);
    expect(doorsOpenInOrder(single, single.areas[0]!)).toBe(false);

    // a layout without doors ignores the mechanic, whatever the spec declares
    for (const layout of ["plaza", "lab", "terraces"] as const) {
      const s = structuredClone(spec);
      s.areas[0]!.layout = layout;
      expect(doorsOpenInOrder(s, s.areas[0]!), layout).toBe(false);
    }
  });
});

describe("collectibleRoom", () => {
  it("puts collectible j in room j mod n, and never divides by zero", () => {
    const area = { stations: [{}, {}, {}] } as unknown as GameSpec["areas"][number];
    expect([0, 1, 2, 3, 4, 5, 11].map((j) => collectibleRoom(area, j))).toEqual([0, 1, 2, 0, 1, 2, 2]);
    const none = { stations: [] } as unknown as GameSpec["areas"][number];
    expect([0, 1, 7].map((j) => collectibleRoom(none, j))).toEqual([0, 0, 0]);
  });
});

describe("describeStuck", () => {
  const spec = adventure();
  const stuck = (over: Partial<FlowStuck> = {}): FlowStuck => ({ areaId: "a-hall", doors: false, stationsDone: 1, blocked: ["s-b"], waitingFor: ["m-x"], openMissions: ["m-y", "m-z"], ...over });

  it("names the area, how far the player got, the stations that can never be played, what they wait for and what is still open", () => {
    const msg = describeStuck(spec, stuck());
    expect(msg).toContain('in area "a-hall" the player gets stuck after 1 of its stations');
    expect(msg).toContain('"s-b" can never be played');
    expect(msg).toContain('they belong to missions that wait for "m-x"');
    expect(msg).toContain('required missions still open: "m-y", "m-z"');
    expect(msg.startsWith("the game cannot be finished (")).toBe(true);
    expect(msg.endsWith(")")).toBe(true);
    // no doors, no boss: neither of those pieces of advice appears
    expect(msg).not.toContain("doors open one after another");
    expect(msg).not.toContain("boss phases");
  });

  it("explains the doors when the area has them, and says 'none' when no required mission is open", () => {
    const msg = describeStuck(spec, stuck({ doors: true, openMissions: [] }));
    expect(msg).toContain("this area's doors open one after another in station order");
    expect(msg).toContain("lower the collect counts");
    expect(msg).toContain("required missions still open: none");
  });

  it("lists several blocked stations and several missions as quoted, comma-separated ids", () => {
    const msg = describeStuck(spec, stuck({ blocked: ["s-a", "s-b", "s-c"], waitingFor: ["m-1", "m-2"] }));
    expect(msg).toContain('"s-a", "s-b", "s-c" can never be played');
    expect(msg).toContain('wait for "m-1", "m-2"');
  });

  it("leaves the 'wait for' sentence out when no mission is to blame", () => {
    expect(describeStuck(spec, stuck({ waitingFor: [] }))).not.toContain("belong to missions that wait for");
  });

  it("names the boss battle when one of its phases is a blocked station, and says the game cannot be finished with it", () => {
    const withBoss = {
      bosses: [
        { id: "boss-1", phaseStationIds: ["s-a", "s-b", "s-c"] },
        { id: "boss-2", phaseStationIds: ["s-elsewhere"] },
      ],
    } as unknown as Parameters<typeof describeStuck>[0];
    const msg = describeStuck(withBoss, stuck({ blocked: ["s-b"] }));
    expect(msg).toContain("the game cannot be finished with the boss battles as written");
    expect(msg).toContain("boss-1: s-a → s-b → s-c");
    expect(msg).not.toContain("boss-2");
    expect(msg).toContain("must not belong to a mission that only unlocks after a LATER phase");
  });

  it("with no station to blame, says the player runs out of things to do and points at the portal and the area chain", () => {
    const msg = describeStuck(spec, stuck({ blocked: [], waitingFor: [], stationsDone: 3 }));
    expect(msg).toContain('the player runs out of things to do in area "a-hall" without being able to leave it');
    expect(msg).toContain("requiresMissionIds");
    expect(msg).not.toContain("can never be played");
  });
});

describe("playThrough on broken games: it ends, and it says where the player is stuck", () => {
  it("a game that can be finished reports no stuck state, in both modes", () => {
    for (const mode of ["check", "plan"] as const) {
      const r = playThrough(adventure(), mode);
      expect(r.finished, mode).toBe(true);
      expect(r.stuck, mode).toBeNull();
    }
  });

  it("a portal to an area that does not exist leaves the player stuck in the area that holds it (and nothing else is reported finished)", () => {
    const spec = adventure();
    const first = spec.areas[0]!;
    first.portal!.toAreaId = "a-nowhere";
    const r = playThrough(spec);
    expect(r.finished).toBe(false);
    expect(r.stuck?.areaId).toBe(first.id);
    expect(r.stuck?.blocked).toEqual([]);
    expect(r.stuck?.openMissions.length).toBeGreaterThan(0);
  });

  it("a game with no portal out of the first area is stuck there, with the missions of the later areas still open", () => {
    const spec = adventure();
    delete spec.areas[0]!.portal;
    const r = playThrough(spec);
    expect(r.finished).toBe(false);
    expect(r.stuck?.areaId).toBe(spec.areas[0]!.id);
    const later = spec.missions.filter((m) => !m.optional && m.areaId !== spec.areas[0]!.id).map((m) => m.id);
    for (const id of later) expect(r.stuck?.openMissions, id).toContain(id);
  });

  it("portals that lead round in a circle end in a stuck report instead of looping for ever", () => {
    const spec = adventure();
    const [a, b] = spec.areas;
    b!.portal = { toAreaId: a!.id, label: "back", requiresMissionIds: [] };
    // the second area's missions can never be done from where the player ends up: make the game unwinnable
    spec.missions = spec.missions.map((m) => (m.areaId === b!.id ? { ...m, requires: [...m.requires, "m-never"] } : m));
    spec.missions.push({ id: "m-never", title: "n", story: "n", areaId: a!.id, requires: ["m-never"], optional: false, objectives: [{ type: "collect", text: "x", count: 99 }] });
    const r = playThrough(spec);
    expect(r.finished).toBe(false);
    expect(r.stuck).not.toBeNull();
    expect(r.stuck!.openMissions).toContain("m-never");
  });

  it("the stuck report names the blocked stations and the missions they wait for, with doors flagged", () => {
    const spec = withDoors(adventure(), "rooms");
    const area = spec.areas[0]!;
    // make the very first station of the first area wait for a mission that needs something later in the game
    const first = area.stations[0]!;
    const mission = spec.missions.find((m) => m.objectives.some((o) => (o.type === "solve" && first.kind === "challenge" && o.challengeIds.includes(first.challengeId ?? "")) || (o.type === "visit" && o.stationIds.includes(first.id))));
    expect(mission, "a mission owns the first station").toBeDefined();
    const later = spec.missions.find((m) => m.areaId !== area.id)!;
    mission!.requires = [...mission!.requires, later.id];
    const r = playThrough(spec, "plan");
    expect(r.finished).toBe(false);
    expect(r.stuck?.areaId).toBe(area.id);
    expect(r.stuck?.doors).toBe(true);
    expect(r.stuck?.blocked).toContain(first.id);
    expect(r.stuck?.waitingFor).toContain(later.id);
    const text = describeStuck(spec, r.stuck!);
    expect(text).toContain(`"${first.id}"`);
    expect(text).toContain("can never be played");
    expect(text).toContain(`"${later.id}"`);
  });
});

describe("the plan reports an order for door-gated areas only", () => {
  it("one entry per area with doors, a permutation of its stations; none for the others", () => {
    const spec = withDoors(adventure(), "rooms");
    spec.areas[1]!.layout = "plaza"; // no doors here
    const plan = playThrough(spec, "plan");
    expect(plan.finished).toBe(true);
    expect([...plan.order.keys()]).toEqual([spec.areas[0]!.id]);
    expect([...plan.order.get(spec.areas[0]!.id)!].sort()).toEqual(spec.areas[0]!.stations.map((s) => s.id).sort());
    // the check mode keeps the listed order of a game that already works
    expect(playThrough(spec, "check").order.get(spec.areas[0]!.id)).toEqual(spec.areas[0]!.stations.map((s) => s.id));
  });
});

describe("orderStationsForDoors", () => {
  const shuffled = (k: number): GameSpec => {
    const rnd = mulberry32(hashSeed(`t1-flow-${k}`));
    const spec = withDoors(adventure(k % 2 ? "Fractions" : "Python loops"), k % 3 ? "rooms" : "corridor");
    for (const a of spec.areas) a.stations.sort(() => rnd() - 0.5);
    return spec;
  };

  it("does nothing, and says nothing, to a game without doors, to a game that already works, and to one that cannot be saved", () => {
    const plain = adventure();
    plain.mechanics = plain.mechanics.filter((m) => m !== "gates");
    const before = JSON.stringify(plain);
    expect(orderStationsForDoors(plain)).toEqual([]);
    expect(JSON.stringify(plain)).toBe(before);

    const fine = withDoors(adventure());
    expect(playThrough(fine, "check").finished).toBe(true);
    const fineBefore = JSON.stringify(fine);
    expect(orderStationsForDoors(fine)).toEqual([]);
    expect(JSON.stringify(fine)).toBe(fineBefore);

    // no order helps when the way out leads to an area that does not exist
    const hopeless = withDoors(adventure());
    hopeless.areas[0]!.portal!.toAreaId = "a-nowhere";
    hopeless.areas[0]!.stations.reverse();
    const hopelessBefore = JSON.stringify(hopeless);
    expect(orderStationsForDoors(hopeless)).toEqual([]);
    expect(JSON.stringify(hopeless)).toBe(hopelessBefore);
  });

  it("puts a scrambled game right: one note per area it changed, nothing lost, and a second pass has nothing left to do", () => {
    let fixed = 0;
    for (let k = 0; k < 10; k++) {
      const spec = shuffled(k);
      const ids = stationIds(spec).map((l) => [...l].sort());
      const needed = !playThrough(spec, "check").finished;
      const notes = orderStationsForDoors(spec);
      expect(playThrough(spec, "check").finished, `game ${k}`).toBe(true);
      expect(stationIds(spec).map((l) => [...l].sort()), `game ${k}: stations lost or invented`).toEqual(ids);
      if (needed) {
        fixed++;
        expect(notes.length, `game ${k}`).toBeGreaterThan(0);
        for (const n of notes) expect(n).toMatch(/^area "[^"]+": stations reordered so its doors open in the order the missions unlock them$/);
        expect(new Set(notes).size).toBe(notes.length);
      } else expect(notes).toEqual([]);
      expect(orderStationsForDoors(spec), `game ${k}`).toEqual([]);
    }
    expect(fixed).toBeGreaterThan(2);
  });

  it("only the areas it changed are named, and each name is an area of the game", () => {
    for (let k = 0; k < 6; k++) {
      const spec = shuffled(k);
      const before = stationIds(spec);
      const notes = orderStationsForDoors(spec);
      const after = stationIds(spec);
      spec.areas.forEach((a, i) => {
        const changed = JSON.stringify(before[i]) !== JSON.stringify(after[i]);
        expect(notes.some((n) => n.includes(`area "${a.id}"`)), `game ${k} ${a.id}`).toBe(changed);
      });
    }
  });
});
