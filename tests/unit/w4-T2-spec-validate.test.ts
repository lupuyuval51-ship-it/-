import { describe, expect, it } from "vitest";
import { challengePlanSchema, checkAgainstPlan, validateBlueprint, type ChallengePlan } from "@/lib/game/spec/blueprint";
import { SPEC_LIMITS } from "@/lib/game/spec/constants";
import type { Challenge, GameSpec, ProgramChallenge } from "@/lib/game/spec/schema";
import { alignLayoutsToGameType, crossCheck, normalizeRawSpec, sanitizeDeep, sealPortals, validateGameSpec } from "@/lib/game/spec/validate";
import { PACK_SUBJECT, validDemoSpec } from "./helpers";

/**
 * The validation gate, one rule at a time: the repairs `normalizeRawSpec` makes silently, the errors `crossCheck` must give (they are
 * also what the model is told in the repair loop), and the blueprint stage of a Full Adventure.
 */
const spec = validDemoSpec({ gameType: "adventure", mode: "FULL" });
const mutate = (fn: (s: GameSpec) => void): GameSpec => {
  const copy = structuredClone(spec);
  fn(copy);
  return copy;
};
const errorsOf = (fn: (s: GameSpec) => void): string => crossCheck(mutate(fn)).errors.join(" | ");
const warningsOf = (fn: (s: GameSpec) => void): string => crossCheck(mutate(fn)).warnings.join(" | ");
const chal = <T extends Challenge["type"]>(s: GameSpec, type: T): Extract<Challenge, { type: T }> => s.challenges.find((c) => c.type === type) as Extract<Challenge, { type: T }>;

describe("crossCheck on a good game", () => {
  it("has no errors, and the ready-made adventure is the baseline every case below breaks in one place", () => {
    expect(crossCheck(spec).errors).toEqual([]);
  });
});

describe("crossCheck: ids and references", () => {
  it("duplicate station, npc, area, challenge and learning-objective ids", () => {
    expect(errorsOf((s) => { s.areas[1]!.stations[0]!.id = "s-var1"; })).toMatch(/duplicate station ids: s-var1/);
    expect(errorsOf((s) => { s.areas[1]!.npcs[0]!.id = "n-byte"; })).toMatch(/duplicate npc ids: n-byte/);
    expect(errorsOf((s) => { s.areas[1]!.id = "a-plaza"; })).toMatch(/duplicate area ids/);
    expect(errorsOf((s) => { s.challenges[1]!.id = s.challenges[0]!.id; })).toMatch(/duplicate challenge ids/);
    expect(errorsOf((s) => { s.learning.objectives.push({ id: "o-vars", text: "again" }); })).toMatch(/duplicate learning objective ids: o-vars/);
  });

  it("a challenge on two stations, a variant that is also on a station, a challenge that goes nowhere", () => {
    expect(errorsOf((s) => { s.areas[1]!.stations[0]!.challengeId = "c-var1"; })).toMatch(/challenge "c-var1" is placed on two stations/);
    expect(errorsOf((s) => { s.areas[0]!.stations.push({ id: "s-extra", kind: "challenge", label: "extra", challengeId: "c-var2-easy" }); })).toMatch(/variant "c-var2-easy" \(easierId of "c-var2"\) must not also be placed on a station/);
    expect(errorsOf((s) => { s.challenges.push({ ...structuredClone(s.challenges[0]!), id: "c-orphan", easierId: undefined, harderId: undefined }); })).toMatch(/challenge "c-orphan" is not placed on any station and is not a variant/);
  });

  it("variants: not itself, not unknown, not shared", () => {
    expect(errorsOf((s) => { s.challenges.find((c) => c.id === "c-var1")!.easierId = "c-var1"; })).toMatch(/lists itself as easierId/);
    expect(errorsOf((s) => { s.challenges.find((c) => c.id === "c-var1")!.harderId = "c-nowhere"; })).toMatch(/harderId references unknown challenge "c-nowhere"/);
    expect(errorsOf((s) => { s.challenges.find((c) => c.id === "c-cond1")!.easierId = "c-var1-easy"; })).toMatch(/variant "c-var1-easy" is used by two challenges/);
  });

  it("a challenge that assesses a learning objective the game does not have", () => {
    expect(errorsOf((s) => { s.challenges[0]!.objectiveId = "o-nope"; })).toMatch(/challenge "c-var1" assesses unknown learning objective "o-nope"/);
  });

  it("a station that points at a challenge that does not exist", () => {
    expect(errorsOf((s) => { s.areas[0]!.stations[0]!.challengeId = "c-missing"; })).toMatch(/station "s-var1" references unknown challenge "c-missing"/);
  });
});

describe("crossCheck: every kind of challenge proves it can be answered", () => {
  it("choice: duplicate option ids, a correct option that is not offered, two options that read the same", () => {
    expect(errorsOf((s) => { const c = chal(s, "choice"); c.options[1]!.id = c.options[0]!.id; })).toMatch(/duplicate option ids/);
    expect(errorsOf((s) => { chal(s, "choice").correctOptionId = "zzz"; })).toMatch(/not one of its options/);
    expect(errorsOf((s) => { const c = chal(s, "choice"); c.options[1]!.text = c.options[0]!.text; })).toMatch(/two options with the same text/);
  });

  it("choice: only spacing is ignored when comparing texts (a sign or a capital can be the whole point of an option)", () => {
    expect(errorsOf((s) => { const c = chal(s, "choice"); c.options[0]!.text = "x > 4"; c.options[1]!.text = "x < 4"; })).not.toMatch(/same text/);
    expect(errorsOf((s) => { const c = chal(s, "choice"); c.options[0]!.text = "-5"; c.options[1]!.text = "5"; })).not.toMatch(/same text/);
    expect(errorsOf((s) => { const c = chal(s, "choice"); c.options[0]!.text = "Paris"; c.options[1]!.text = "paris"; })).not.toMatch(/same text/);
    expect(errorsOf((s) => { const c = chal(s, "choice"); c.options[0]!.text = "a  b"; c.options[1]!.text = " a b "; })).toMatch(/same text/);
  });

  it("numeric: a 'common mistake' inside the tolerance is the right answer in disguise", () => {
    const numeric = (value: number) => errorsOf((s) => { const c = chal(s, "numeric"); c.tolerance = 0.5; c.commonMistakes = [{ value: c.answer + value, feedback: "Did you slip?" }]; });
    expect(numeric(0.5)).toMatch(/lists the correct answer/); // on the edge of the tolerance: still the right answer
    expect(numeric(0.25)).toMatch(/lists the correct answer/);
    expect(numeric(0.75)).not.toMatch(/common mistake/);
  });

  it("sequence and match: duplicate ids are errors", () => {
    expect(errorsOf((s) => { const c = chal(s, "sequence"); c.items[1]!.id = c.items[0]!.id; })).toMatch(/duplicate item ids/);
    const withMatch = (fn: (c: Extract<Challenge, { type: "match" }>) => void) => {
      const copy = structuredClone(validDemoSpec({ gameType: "adventure", mode: "FULL", subject: PACK_SUBJECT.language }));
      const m = chal(copy, "match");
      fn(m);
      return crossCheck(copy).errors.join(" | ");
    };
    expect(withMatch((m) => { m.pairs[1]!.id = m.pairs[0]!.id; })).toMatch(/duplicate pair ids/);
  });

  describe("program", () => {
    const grid = (fn: (c: ProgramChallenge) => void) => errorsOf((s) => fn(chal(s, "program")));
    it("every cell inside the grid", () => {
      expect(grid((c) => { c.grid.goal = { x: c.grid.width, y: 0 }; })).toMatch(/cells outside its \d+x\d+ grid/);
      expect(grid((c) => { c.grid.walls = [{ x: 0, y: c.grid.height }]; })).toMatch(/cells outside/);
    });
    it("start and goal are not walls and not the same cell", () => {
      expect(grid((c) => { c.grid.walls = [{ x: c.grid.goal.x, y: c.grid.goal.y }]; })).toMatch(/start or goal sits on a wall/);
      expect(grid((c) => { c.grid.walls = [{ x: c.grid.start.x, y: c.grid.start.y }]; })).toMatch(/start or goal sits on a wall/);
      expect(grid((c) => { c.grid.goal = { x: c.grid.start.x, y: c.grid.start.y }; })).toMatch(/starts on its goal/);
    });
    it("the goal is reachable, and the reference solution solves it within the block limit", () => {
      expect(grid((c) => {
        const { x, y } = c.grid.goal;
        c.grid.walls = [{ x: x - 1, y }, { x: x + 1, y }, { x, y: y - 1 }, { x, y: y + 1 }].filter((p) => p.x >= 0 && p.y >= 0 && p.x < c.grid.width && p.y < c.grid.height && !(p.x === c.grid.start.x && p.y === c.grid.start.y));
      })).toMatch(/goal is walled in/);
      expect(grid((c) => { c.maxBlocks = 1; c.solution = [{ t: "move" }, { t: "move" }]; })).toMatch(/reference solution does not solve the puzzle/);
    });
  });

  describe("simulation", () => {
    const science = validDemoSpec({ gameType: "adventure", mode: "FULL", subject: PACK_SUBJECT.science });
    it("a projectile whose target is out of reach even at the top speed", () => {
      const copy = structuredClone(science);
      const sim = copy.challenges.find((c) => c.type === "simulation" && c.sim.kind === "projectile");
      if (!sim || sim.type !== "simulation" || sim.sim.kind !== "projectile") throw new Error("the science sample carries a projectile challenge");
      expect(crossCheck(copy).errors).toEqual([]);
      Object.assign(sim.sim, { targetDistance: 200, maxSpeed: 5 });
      expect(crossCheck(copy).errors.join(" ")).toMatch(/target is out of reach even at maxSpeed/);
    });
  });
});

describe("crossCheck: missions, bosses and portals", () => {
  it("a mission in an unknown area, requiring itself, an unknown mission", () => {
    expect(errorsOf((s) => { s.missions[0]!.areaId = "a-void"; })).toMatch(/mission "m-boot" happens in unknown area "a-void"/);
    expect(errorsOf((s) => { s.missions[1]!.requires = ["m-choices"]; })).toMatch(/requires itself/);
    expect(errorsOf((s) => { s.missions[1]!.requires = ["m-ghost"]; })).toMatch(/requires unknown mission "m-ghost"/);
  });

  it("objectives must be satisfiable in the mission's own area", () => {
    expect(errorsOf((s) => { s.missions[0]!.objectives = [{ type: "solve", text: "x", challengeIds: ["c-prog1"] }]; })).toMatch(/needs challenge "c-prog1" which has no station in area "a-plaza"/);
    expect(errorsOf((s) => { s.missions[0]!.objectives = [{ type: "collect", text: "x", count: s.areas[0]!.collectibles.count + 1 }]; })).toMatch(/asks to collect \d+ but area "a-plaza" only has \d+/);
    expect(errorsOf((s) => { s.missions[0]!.objectives = [{ type: "talk", text: "x", npcId: "n-gear" }]; })).toMatch(/wants to talk to "n-gear" who is not in area "a-plaza"/);
    expect(errorsOf((s) => { s.missions[0]!.objectives = [{ type: "visit", text: "x", stationIds: ["s-var1"] }]; })).toMatch(/visit objective "s-var1" is not a lore station/);
  });

  it("bosses: an unknown area, a phase that is not a station of the area, not a challenge, the same phase twice", () => {
    const boss = (over: Partial<GameSpec["bosses"][number]>) => (s: GameSpec) => {
      s.bosses = [{ id: "b1", areaId: "a-lab", name: "Boss", title: "T", intro: "i", defeatLine: "d", look: { color: "#ff0000", shape: "orb" }, phaseStationIds: ["s-robot1", "s-robot2"], ...over }];
    };
    expect(errorsOf(boss({ areaId: "a-void" }))).toMatch(/boss "b1" lives in unknown area "a-void"/);
    expect(errorsOf(boss({ phaseStationIds: ["s-robot1", "s-var1"] }))).toMatch(/phase "s-var1" is not a station of area "a-lab"/);
    expect(errorsOf(boss({ phaseStationIds: ["s-robot1", "s-robot1"] }))).toMatch(/lists the same phase station twice/);
    expect(errorsOf((s) => { s.areas[0]!.stations.find((x) => x.kind === "lore")!.id = "s-lore1"; boss({ areaId: "a-plaza", phaseStationIds: ["s-var1", "s-lore1"] })(s); })).toMatch(/phase "s-lore1" must be a challenge station/);
  });

  it("portals: not to itself, not to an unknown area, not waiting for an unknown mission; every area reachable", () => {
    expect(errorsOf((s) => { s.areas[0]!.portal!.toAreaId = "a-plaza"; })).toMatch(/portal leads to itself/);
    expect(errorsOf((s) => { s.areas[0]!.portal!.toAreaId = "a-void"; })).toMatch(/portal leads to unknown area "a-void"/);
    expect(errorsOf((s) => { s.areas[0]!.portal!.requiresMissionIds = ["m-ghost"]; })).toMatch(/portal requires unknown mission "m-ghost"/);
    expect(errorsOf((s) => { delete s.areas[0]!.portal; })).toMatch(/area "a-lab" cannot be reached/);
  });

  it("a character that reacts to a mission the game does not have", () => {
    expect(errorsOf((s) => { s.areas[0]!.npcs[0]!.reactions = [{ afterMissionId: "m-ghost", lines: ["hi"] }]; })).toMatch(/npc "n-byte" reacts to unknown mission "m-ghost"/);
  });

  it("a mission that waits for something nobody can finish is reported, with the chain that causes it", () => {
    expect(errorsOf((s) => { s.areas[0]!.portal!.requiresMissionIds = ["m-robot"]; })).toMatch(/can never be completed/); // the portal waits for a mission behind that same portal
  });

  it("warnings (not errors): an objective no challenge assesses, a challenge no mission asks for", () => {
    expect(warningsOf((s) => { s.learning.objectives.push({ id: "o-extra", text: "An extra objective" }); })).toMatch(/learning objective "o-extra" is not assessed by any challenge/);
    expect(warningsOf((s) => { s.missions[0]!.objectives = [{ type: "talk", text: "x", npcId: "n-byte" }]; })).toMatch(/challenge "c-var1" is optional: no mission requires it/);
    expect(crossCheck(spec).warnings).toEqual([]);
  });
});

describe("normalizeRawSpec: the repairs that need no round trip to the model", () => {
  const raw = () => structuredClone(spec) as unknown as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const norm = (r: unknown) => normalizeRawSpec(r);

  it("too many areas, missions, challenges, bosses, objectives: cut to the limits, each with a note", () => {
    const r = raw();
    r.areas = Array.from({ length: SPEC_LIMITS.areas + 2 }, (_, i) => ({ ...r.areas[0], id: `a${i}` }));
    r.missions = Array.from({ length: SPEC_LIMITS.missions + 1 }, (_, i) => ({ ...r.missions[0], id: `m${i}` }));
    r.challenges = Array.from({ length: SPEC_LIMITS.challenges + 3 }, (_, i) => ({ ...r.challenges[0], id: `c${i}` }));
    r.bosses = Array.from({ length: SPEC_LIMITS.bosses + 1 }, (_, i) => ({ id: `b${i}`, phaseStationIds: Array.from({ length: SPEC_LIMITS.bossPhasesMax + 2 }, (_, j) => `s${j}`) }));
    r.learning.objectives = Array.from({ length: SPEC_LIMITS.learningObjectives + 1 }, (_, i) => ({ id: `o${i}`, text: "t" }));
    const { value, notes } = norm(r);
    const v = value as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect([v.areas.length, v.missions.length, v.challenges.length, v.bosses.length, v.learning.objectives.length]).toEqual([SPEC_LIMITS.areas, SPEC_LIMITS.missions, SPEC_LIMITS.challenges, SPEC_LIMITS.bosses, SPEC_LIMITS.learningObjectives]);
    expect(v.bosses.every((b: { phaseStationIds: string[] }) => b.phaseStationIds.length === SPEC_LIMITS.bossPhasesMax)).toBe(true);
    for (const what of ["areas truncated", "missions truncated", "challenges truncated", "bosses truncated", "phases of boss b0 truncated", "learning objectives truncated"]) expect(notes.join(" | "), what).toContain(what);
  });

  it("too many stations, characters, objectives of a mission, options, items and pairs: cut inside each", () => {
    const r = raw();
    r.areas[0].stations = Array.from({ length: SPEC_LIMITS.stationsPerArea + 1 }, (_, i) => ({ ...r.areas[0].stations[0], id: `s${i}` }));
    r.areas[0].npcs = Array.from({ length: SPEC_LIMITS.npcsPerArea + 1 }, (_, i) => ({ ...r.areas[0].npcs[0], id: `n${i}` }));
    r.missions[0].objectives = Array.from({ length: SPEC_LIMITS.objectivesPerMission + 1 }, () => ({ ...r.missions[0].objectives[0] }));
    const choice = r.challenges.find((c: { type: string }) => c.type === "choice");
    choice.options = Array.from({ length: SPEC_LIMITS.optionsPerChoice + 2 }, (_, i) => ({ id: `o${i}`, text: `t${i}`, feedback: "f" }));
    const seq = r.challenges.find((c: { type: string }) => c.type === "sequence");
    seq.items = Array.from({ length: SPEC_LIMITS.itemsPerSequence + 1 }, (_, i) => ({ id: `i${i}`, text: `t${i}` }));
    const { value, notes } = norm(r);
    const v = value as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(v.areas[0].stations).toHaveLength(SPEC_LIMITS.stationsPerArea);
    expect(v.areas[0].npcs).toHaveLength(SPEC_LIMITS.npcsPerArea);
    expect(v.missions[0].objectives).toHaveLength(SPEC_LIMITS.objectivesPerMission);
    expect(v.challenges.find((c: { id: string }) => c.id === choice.id).options).toHaveLength(SPEC_LIMITS.optionsPerChoice);
    expect(v.challenges.find((c: { id: string }) => c.id === seq.id).items).toHaveLength(SPEC_LIMITS.itemsPerSequence);
    expect(notes.length).toBeGreaterThanOrEqual(5);
  });

  it("unknown mechanics are dropped (with a note) and repeated ones listed once", () => {
    const r = raw();
    r.mechanics = ["collect", "collect", "fly", 7, "dialogue"];
    const { value, notes } = norm(r);
    expect((value as { mechanics: string[] }).mechanics).toEqual(["collect", "dialogue"]);
    expect(notes.join(" ")).toMatch(/unsupported mechanics dropped: fly, 7/);
  });

  it("the same id listed twice in an objective is listed once, so the objective can be completed", () => {
    const r = raw();
    r.missions[0].objectives = [{ type: "solve", text: "x", challengeIds: ["c-var1", "c-var1", "c-var2"] }, { type: "visit", text: "y", stationIds: ["s-lore1", "s-lore1"] }];
    const { value, notes } = norm(r);
    const objs = (value as { missions: { objectives: { challengeIds?: string[]; stationIds?: string[] }[] }[] }).missions[0]!.objectives;
    expect(objs[0]!.challengeIds).toEqual(["c-var1", "c-var2"]);
    expect(objs[1]!.stationIds).toEqual(["s-lore1"]);
    expect(notes.filter((n) => /duplicate ids removed/.test(n))).toHaveLength(2);
  });

  it("whatever a producer says about who made the game and at which level is dropped: the server decides", () => {
    const r = raw();
    r.meta.generator = { kind: "ai", provider: "forged", model: "x", mode: "FULL", generatedAt: "now" };
    r.meta.featureTier = "A";
    const { value } = norm(r);
    expect((value as { meta: Record<string, unknown> }).meta).not.toHaveProperty("generator");
    expect((value as { meta: Record<string, unknown> }).meta).not.toHaveProperty("featureTier");
    const res = validateGameSpec(r);
    expect(res.ok && res.spec.meta.featureTier).toBeFalsy();
  });

  it("does not mutate its input, and gives anything that is not an object back unchanged", () => {
    const r = raw();
    const before = JSON.stringify(r);
    norm(r);
    expect(JSON.stringify(r)).toBe(before);
    expect(norm("text").value).toBe("text");
    expect(norm(42).value).toBe(42);
    expect(norm([1, 2]).value).toEqual([1, 2]);
    const bad = validateGameSpec("text");
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors[0]).toMatch(/^\(root\)/);
    expect(validateGameSpec(null).ok).toBe(false);
  });

  it("a value that cannot even be measured (a cycle) is refused as too large instead of crashing", () => {
    const loop: Record<string, unknown> = {};
    loop.self = loop;
    const res = validateGameSpec(loop);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.join(" ")).toMatch(/too large/);
  });
});

describe("sanitizeDeep", () => {
  it("drops nulls and undefined, unsafe keys, control characters; trims and normalises line breaks", () => {
    const dirty = JSON.parse('{"__proto__":{"x":1},"constructor":2,"prototype":3,"a":null,"b":"  hi\\r\\nthere\\u0007  ","c":["x\\n\\n\\n\\ny"],"d":{"e":null,"f":1}}');
    const clean = sanitizeDeep(dirty) as Record<string, unknown>;
    expect(Object.keys(clean).sort()).toEqual(["b", "c", "d"]);
    expect(clean.b).toBe("hi\nthere");
    expect(clean.c).toEqual(["x\n\ny"]);
    expect(clean.d).toEqual({ f: 1 });
    expect(({} as Record<string, unknown>).x).toBeUndefined(); // nothing leaked onto Object.prototype
  });

  it("leaves numbers, booleans and ordinary punctuation alone", () => {
    expect(sanitizeDeep({ n: 0, t: true, f: false, s: "a < b > c — “q”" })).toEqual({ n: 0, t: true, f: false, s: "a < b > c — “q”" });
  });
});

describe("sealPortals and alignLayoutsToGameType", () => {
  it("a portal also waits for the area's final missions, up to the four the schema allows", () => {
    const s = structuredClone(spec);
    s.areas[0]!.portal!.requiresMissionIds = [];
    const notes = sealPortals(s);
    expect(notes).toHaveLength(1);
    expect(s.areas[0]!.portal!.requiresMissionIds).toEqual(["m-loops"]); // the only mission of a-plaza nothing else builds on
    expect(sealPortals(s)).toEqual([]); // already sealed: nothing to say
  });

  it("keeps the portal's own requirements first and never passes four", () => {
    const s = structuredClone(spec);
    const here = s.missions.filter((m) => m.areaId === "a-plaza");
    expect(here.length).toBeGreaterThan(0);
    for (let i = 0; i < 5; i++) s.missions.push({ id: `m-x${i}`, title: "x", story: "x", areaId: "a-plaza", requires: [], objectives: [{ type: "talk", text: "x", npcId: "n-byte" }], optional: false });
    s.areas[0]!.portal!.requiresMissionIds = ["m-boot", "m-choices"];
    sealPortals(s);
    expect(s.areas[0]!.portal!.requiresMissionIds).toHaveLength(4);
    expect(s.areas[0]!.portal!.requiresMissionIds.slice(0, 2)).toEqual(["m-boot", "m-choices"]);
  });

  it("an area without a portal is left alone", () => {
    const s = structuredClone(spec);
    const before = JSON.stringify(s.areas[1]);
    sealPortals(s);
    expect(JSON.stringify(s.areas[1])).toBe(before);
  });

  it("adventure keeps whatever layouts the game chose; every other type sets its own and says what it changed", () => {
    const s = structuredClone(spec);
    const layouts = s.areas.map((a) => a.layout);
    expect(alignLayoutsToGameType(s, "adventure")).toEqual([]);
    expect(s.areas.map((a) => a.layout)).toEqual(layouts);
    const notes = alignLayoutsToGameType(s, "platformer");
    expect(s.meta.gameType).toBe("platformer");
    expect(s.areas.every((a) => a.layout === "terraces")).toBe(true);
    expect(notes).toHaveLength(s.areas.length);
    expect(notes[0]).toMatch(/layout changed from plaza to terraces/);
    expect(alignLayoutsToGameType(s, "platformer")).toEqual([]); // nothing left to change
  });
});

describe("the blueprint of a Full Adventure (the world and the plan, before any question is written)", () => {
  const plan = (s: GameSpec): ChallengePlan[] => s.challenges.map((c) => ({ id: c.id, type: c.type, concept: c.concept, level: c.level, objectiveId: c.objectiveId ?? "o-vars", easierId: c.easierId, harderId: c.harderId }));
  const blueprintOf = (fn: (b: Record<string, any>) => void = () => undefined) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const { challenges: _c, ...rest } = structuredClone(spec);
    const b = { ...rest, challengePlan: plan(spec) } as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    fn(b);
    return validateBlueprint(b);
  };
  const errors = (r: ReturnType<typeof validateBlueprint>) => (r.ok ? [] : r.errors).join(" | ");

  it("a world whose plan covers every station passes", () => {
    const r = blueprintOf();
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.blueprint.challengePlan).toHaveLength(spec.challenges.length);
  });

  it("a plan can say what it likes about the questions themselves: only ids and structure are checked at this stage", () => {
    const r = blueprintOf((b) => { b.challengePlan[0].concept = "anything"; b.challengePlan[0].type = "program"; });
    expect(r.ok).toBe(true); // the content stage writes the real program; the placeholder stands in until then
  });

  it("refuses duplicate plan ids, a station that points outside the plan, an objective the game does not have", () => {
    expect(errors(blueprintOf((b) => { b.challengePlan[1].id = b.challengePlan[0].id; }))).toMatch(/challengePlan contains duplicate ids/);
    expect(errors(blueprintOf((b) => { b.areas[0].stations[0].challengeId = "c-not-planned"; }))).toMatch(/unknown challenge "c-not-planned"/);
    expect(errors(blueprintOf((b) => { b.challengePlan[0].objectiveId = "o-nope"; }))).toMatch(/assesses unknown learning objective "o-nope"/);
  });

  it("refuses a plan the world cannot be finished with (a mission that asks for a challenge that is not planned)", () => {
    expect(errors(blueprintOf((b) => { b.challengePlan = b.challengePlan.filter((p: { id: string }) => p.id !== "c-cond1"); }))).toMatch(/c-cond1/);
  });

  it("reports schema problems by path, at most 25 of them, and needs a plan", () => {
    const r = blueprintOf((b) => { delete b.challengePlan; });
    expect(r.ok).toBe(false);
    expect(errors(r)).toMatch(/challengePlan/);
    const many = blueprintOf((b) => { b.challengePlan = Array.from({ length: 40 }, () => ({ id: "bad id", type: "nope", concept: "", objectiveId: "!" })); });
    expect(many.ok).toBe(false);
    if (!many.ok) expect(many.errors.length).toBeLessThanOrEqual(25);
  });

  it("producer claims about provenance are dropped here too, and the plan's level defaults to 1", () => {
    const r = blueprintOf((b) => { b.meta.generator = { kind: "ai", provider: "p", model: "m", mode: "FULL", generatedAt: "x" }; b.challengePlan.forEach((p: Record<string, unknown>) => delete p.level); });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.blueprint.meta.generator).toBeUndefined();
      expect(r.blueprint.challengePlan.every((p) => p.level === 1)).toBe(true);
    }
    expect(challengePlanSchema.parse({ id: "c1", type: "choice", concept: "x", objectiveId: "o1" }).level).toBe(1);
    expect(challengePlanSchema.safeParse({ id: "c1", type: "choice", concept: "x", objectiveId: "o1", level: 4 }).success).toBe(false);
  });

  it("checkAgainstPlan: the content stage must deliver exactly the planned challenges, with the planned types", () => {
    const p = plan(spec);
    expect(checkAgainstPlan(p, spec.challenges)).toEqual([]);
    expect(checkAgainstPlan(p, spec.challenges.slice(1))).toEqual([`missing challenge "${spec.challenges[0]!.id}" from the plan`]);
    const extra = { ...spec.challenges[0]!, id: "c-surprise" };
    expect(checkAgainstPlan(p, [...spec.challenges, extra])).toEqual([`challenge "c-surprise" is not in the plan: remove it`]);
    const wrongType = spec.challenges.map((c) => (c.id === "c-var1" ? ({ ...chal(spec, "numeric"), id: "c-var1" } as Challenge) : c));
    expect(checkAgainstPlan(p, wrongType)).toEqual([`challenge "c-var1" must have type "choice" as planned, got "numeric"`]);
  });
});
