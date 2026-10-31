import { describe, expect, it } from "vitest";
import { SPEC_LIMITS } from "@/lib/game/spec/constants";
import {
  answerBlockSchema, blockSchema, bossSchema, challengeSchema, extensionSchema, gameSpecSchema, generatorInfoSchema, idSchema, npcSchema, stationSchema,
} from "@/lib/game/spec/schema";
import { validDemoSpec } from "./helpers";

/** The shape of a game file: what it accepts, what it refuses, and the defaults that let games saved by older versions keep opening. */
const spec = validDemoSpec({ gameType: "adventure", mode: "FULL" });
const raw = () => JSON.parse(JSON.stringify(spec)) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

describe("ids", () => {
  it("letters, digits, '-' and '_', starting with a letter or digit, at most 40 characters", () => {
    for (const ok of ["a", "A1", "x_y-z", "9lives", "a".repeat(40)]) expect(idSchema.safeParse(ok).success, ok).toBe(true);
    for (const bad of ["", "a".repeat(41), "-a", "_a", "a b", "é", "a.b", "a/b", "a\nb", " a"]) expect(idSchema.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
  });

  it("a ':' can never be in an id: collectibles are `<area>:c<n>`, and one area's items must never look like another's", () => {
    expect(idSchema.safeParse("a:b").success).toBe(false);
    expect(idSchema.safeParse("a-plaza:c0").success).toBe(false);
  });
});

describe("older games keep opening: every field added later has a default", () => {
  it("a game written before bosses, reactions, side missions, tiers and the other later additions still parses, with those fields empty or off", () => {
    const old = raw();
    delete old.schemaVersion;
    delete old.bosses;
    delete old.mechanics;
    delete old.meta.featureTier;
    delete old.meta.generator;
    delete old.meta.subjectCategory;
    delete old.theme.timeOfDay;
    for (const m of old.missions) delete m.optional;
    for (const m of old.missions) delete m.requires;
    for (const a of old.areas) {
      delete a.size;
      delete a.hazardLevel;
      delete a.npcs;
      delete a.collectibles;
      delete a.portal?.requiresMissionIds;
    }
    for (const c of old.challenges) delete c.level;
    const parsed = gameSpecSchema.safeParse(old);
    if (!parsed.success) throw new Error(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
    const s = parsed.data;
    expect(s.schemaVersion).toBe(1);
    expect(s.bosses).toEqual([]);
    expect(s.mechanics).toEqual([]);
    expect(s.meta.subjectCategory).toBe("other");
    expect(s.theme.timeOfDay).toBe("day");
    expect(s.missions.every((m) => m.optional === false && m.requires.length === 0)).toBe(true);
    expect(s.areas.every((a) => a.size === "medium" && a.hazardLevel === "none" && a.npcs.length === 0 && a.collectibles.count === 0)).toBe(true);
    expect(s.challenges.every((c) => c.level === 1)).toBe(true);
  });

  it("a character without reactions gets an empty list; a numeric challenge without tolerance is exact; a lever and a projectile have their usual settings", () => {
    const npc = npcSchema.parse({ id: "n1", name: "Guide", role: "Helper", look: { color: "#3366ff", shape: "robot" }, lines: ["hello"] });
    expect(npc.reactions).toEqual([]);
    const num = challengeSchema.parse({ type: "numeric", id: "c1", title: "t", prompt: "p", concept: "c", explanation: "e", answer: 4 });
    expect(num).toMatchObject({ tolerance: 0, commonMistakes: [], level: 1 });
    const proj = challengeSchema.parse({ type: "simulation", id: "c2", title: "t", prompt: "p", concept: "c", explanation: "e", sim: { kind: "projectile", targetDistance: 20 } });
    expect(proj.type === "simulation" && proj.sim).toMatchObject({ gravity: 9.8, tolerance: 2, maxSpeed: 30 });
    const lever = challengeSchema.parse({ type: "simulation", id: "c3", title: "t", prompt: "p", concept: "c", explanation: "e", sim: { kind: "lever", leftWeight: 6, leftDistance: 4, rightWeight: 3 } });
    expect(lever.type === "simulation" && lever.sim).toMatchObject({ maxDistance: 10, tolerance: 0.25 });
  });

  it("an extension with nothing in it is a valid extension that adds nothing", () => {
    expect(extensionSchema.parse({})).toEqual({ mechanics: [], objectives: [], areas: [], missions: [], challenges: [] });
  });
});

describe("what a game file may not contain", () => {
  it("unknown keys are stripped, not passed on (a model cannot smuggle fields into the runtime)", () => {
    const r = raw();
    r.evil = "x";
    r.meta.evil = "x";
    r.areas[0].evil = "x";
    r.challenges[0].evil = "x";
    const s = gameSpecSchema.parse(r);
    expect(JSON.stringify(s)).not.toContain("evil");
  });

  it("text is trimmed, may not be empty, and may not hold control or bidi-override characters", () => {
    const withTitle = (title: string) => gameSpecSchema.safeParse({ ...raw(), meta: { ...raw().meta, title } });
    const ok = withTitle("  A title  ");
    expect(ok.success && ok.data.meta.title).toBe("A title");
    expect(withTitle("   ").success).toBe(false);
    expect(withTitle("a‮b").success).toBe(false); // right-to-left override
    expect(withTitle("a⁦b").success).toBe(false); // isolate
    expect(withTitle("a\u0007b").success).toBe(false); // bell
    expect(withTitle("x".repeat(81)).success).toBe(false);
    expect(withTitle("x".repeat(80)).success).toBe(true);
  });

  it("colours are #rrggbb only", () => {
    const npc = (color: string) => npcSchema.safeParse({ id: "n1", name: "N", role: "R", look: { color, shape: "orb" }, lines: ["hi"] }).success;
    expect(npc("#3366ff")).toBe(true);
    expect(npc("#3366FF")).toBe(true);
    for (const bad of ["#36f", "3366ff", "#3366ffaa", "red", "#33666g", ""]) expect(npc(bad), bad).toBe(false);
  });

  it("a station needs what its kind needs: a challenge id, or a lore title and text", () => {
    const base = { id: "s1", label: "L" };
    expect(stationSchema.safeParse({ ...base, kind: "challenge" }).success).toBe(false);
    expect(stationSchema.safeParse({ ...base, kind: "challenge", challengeId: "c1" }).success).toBe(true);
    expect(stationSchema.safeParse({ ...base, kind: "lore", loreTitle: "T" }).success).toBe(false);
    expect(stationSchema.safeParse({ ...base, kind: "lore", loreText: "T" }).success).toBe(false);
    expect(stationSchema.safeParse({ ...base, kind: "lore", loreTitle: "T", loreText: "text" }).success).toBe(true);
    expect(stationSchema.safeParse({ ...base, kind: "boss" }).success).toBe(false);
  });

  it("the limits of the content: lines, reactions, options, items, pairs, phases", () => {
    const npc = (over: Record<string, unknown>) => npcSchema.safeParse({ id: "n1", name: "N", role: "R", look: { color: "#112233", shape: "orb" }, lines: ["hi"], ...over }).success;
    expect(npc({ lines: Array.from({ length: SPEC_LIMITS.linesPerNpc }, () => "x") })).toBe(true);
    expect(npc({ lines: Array.from({ length: SPEC_LIMITS.linesPerNpc + 1 }, () => "x") })).toBe(false);
    expect(npc({ lines: [] })).toBe(false);
    const reaction = { afterMissionId: "m1", lines: ["ok"] };
    expect(npc({ reactions: Array.from({ length: SPEC_LIMITS.reactionsPerNpc }, () => reaction) })).toBe(true);
    expect(npc({ reactions: Array.from({ length: SPEC_LIMITS.reactionsPerNpc + 1 }, () => reaction) })).toBe(false);
    expect(npc({ reactions: [{ afterMissionId: "m1", lines: [] }] })).toBe(false);
    expect(npc({ reactions: [{ afterMissionId: "m1", lines: ["a", "b", "c", "d"] }] })).toBe(false);

    const choice = (n: number) => challengeSchema.safeParse({ type: "choice", id: "c1", title: "t", prompt: "p", concept: "c", explanation: "e", correctOptionId: "o0", options: Array.from({ length: n }, (_, i) => ({ id: `o${i}`, text: `t${i}`, feedback: "f" })) }).success;
    expect([1, 2, SPEC_LIMITS.optionsPerChoice, SPEC_LIMITS.optionsPerChoice + 1].map(choice)).toEqual([false, true, true, false]);
    const seq = (n: number) => challengeSchema.safeParse({ type: "sequence", id: "c1", title: "t", prompt: "p", concept: "c", explanation: "e", items: Array.from({ length: n }, (_, i) => ({ id: `i${i}`, text: `t${i}` })) }).success;
    expect([2, 3, SPEC_LIMITS.itemsPerSequence, SPEC_LIMITS.itemsPerSequence + 1].map(seq)).toEqual([false, true, true, false]);
    const match = (n: number) => challengeSchema.safeParse({ type: "match", id: "c1", title: "t", prompt: "p", concept: "c", explanation: "e", pairs: Array.from({ length: n }, (_, i) => ({ id: `p${i}`, left: `l${i}`, right: `r${i}` })) }).success;
    expect([2, 3, SPEC_LIMITS.pairsPerMatch, SPEC_LIMITS.pairsPerMatch + 1].map(match)).toEqual([false, true, true, false]);

    const boss = (n: number) => bossSchema.safeParse({ id: "b1", areaId: "a1", name: "B", title: "T", intro: "i", defeatLine: "d", look: { color: "#112233", shape: "orb" }, phaseStationIds: Array.from({ length: n }, (_, i) => `s${i}`) }).success;
    expect([1, SPEC_LIMITS.bossPhasesMin, SPEC_LIMITS.bossPhasesMax, SPEC_LIMITS.bossPhasesMax + 1].map(boss)).toEqual([false, true, true, false]);
  });

  it("numbers are finite and in range: an answer of NaN or Infinity is not an answer; a negative tolerance is not a tolerance", () => {
    const num = (over: Record<string, unknown>) => challengeSchema.safeParse({ type: "numeric", id: "c1", title: "t", prompt: "p", concept: "c", explanation: "e", answer: 1, ...over }).success;
    expect(num({})).toBe(true);
    expect(num({ answer: Number.NaN })).toBe(false);
    expect(num({ answer: Number.POSITIVE_INFINITY })).toBe(false);
    expect(num({ tolerance: -0.1 })).toBe(false);
    expect(num({ commonMistakes: [{ value: Number.NaN, feedback: "f" }] })).toBe(false);
    expect(num({ commonMistakes: Array.from({ length: 4 }, (_, i) => ({ value: i + 2, feedback: "f" })) })).toBe(false); // at most three
    expect(num({ timeLimitSec: 9 })).toBe(false);
    expect(num({ timeLimitSec: 181 })).toBe(false);
    expect(num({ timeLimitSec: 10 })).toBe(true);
    expect(num({ level: 4 })).toBe(false);
    expect(num({ level: 1.5 })).toBe(false);
  });

  it("the estimated length is a whole number of minutes from 2 to 120", () => {
    const meta = (estimatedMinutes: unknown) => gameSpecSchema.safeParse({ ...raw(), meta: { ...raw().meta, estimatedMinutes } }).success;
    expect([1, 2, 120, 121, 2.5, "10"].map(meta)).toEqual([false, true, true, false, false, false]);
  });

  it("only the four kinds of provenance, and a catalog game is one of them", () => {
    const info = (kind: string) => generatorInfoSchema.safeParse({ kind, provider: "p", model: "m", mode: "FULL", generatedAt: "t" }).success;
    expect(["ai", "demo", "engine", "catalog"].map(info)).toEqual([true, true, true, true]);
    expect(info("human")).toBe(false);
  });

  it("the number of areas, missions and challenges is bounded by the same limits the rest of the code uses", () => {
    const tooMany = (key: "areas" | "missions" | "challenges", n: number) => {
      const r = raw();
      r[key] = Array.from({ length: n }, (_, i) => ({ ...r[key][0], id: `x${i}` }));
      return gameSpecSchema.safeParse(r).success;
    };
    // the content is not consistent after the copying, but the schema alone is what counts here: only the bound decides
    expect(tooMany("areas", SPEC_LIMITS.areas + 1)).toBe(false);
    expect(tooMany("missions", SPEC_LIMITS.missions + 1)).toBe(false);
    expect(tooMany("challenges", SPEC_LIMITS.challenges + 1)).toBe(false);
    expect(tooMany("areas", SPEC_LIMITS.areas)).toBe(true);
  });
});

describe("robot programs", () => {
  it("the authored block language: moves and turns, a loop of 2 to 9 with something in it, a condition whose else may be empty or missing", () => {
    expect(blockSchema.safeParse({ t: "move" }).success).toBe(true);
    expect(blockSchema.safeParse({ t: "left" }).success).toBe(true);
    expect(blockSchema.safeParse({ t: "right" }).success).toBe(true);
    expect(blockSchema.safeParse({ t: "jump" }).success).toBe(false);
    expect(blockSchema.safeParse({ t: "repeat", n: 1, body: [{ t: "move" }] }).success).toBe(false);
    expect(blockSchema.safeParse({ t: "repeat", n: 10, body: [{ t: "move" }] }).success).toBe(false);
    expect(blockSchema.safeParse({ t: "repeat", n: 2.5, body: [{ t: "move" }] }).success).toBe(false);
    expect(blockSchema.safeParse({ t: "repeat", n: 2, body: [] }).success).toBe(false);
    expect(blockSchema.safeParse({ t: "repeat", n: 2, body: Array.from({ length: 9 }, () => ({ t: "move" })) }).success).toBe(false);
    const cond = blockSchema.parse({ t: "if", body: [{ t: "move" }] });
    expect(cond).toEqual({ t: "if", body: [{ t: "move" }], else: [] });
    expect(blockSchema.safeParse({ t: "if", body: [{ t: "move" }], else: [{ t: "left" }] }).success).toBe(true);
  });

  it("what a player sends is looser: an empty loop is a wrong program, not a rejected request (but the limits of the block count still hold)", () => {
    expect(answerBlockSchema.safeParse({ t: "repeat", n: 2, body: [] }).success).toBe(true);
    expect(answerBlockSchema.safeParse({ t: "repeat", n: 2, body: Array.from({ length: SPEC_LIMITS.programBlocksMax }, () => ({ t: "move" })) }).success).toBe(true);
    expect(answerBlockSchema.safeParse({ t: "repeat", n: 2, body: Array.from({ length: SPEC_LIMITS.programBlocksMax + 1 }, () => ({ t: "move" })) }).success).toBe(false);
    expect(answerBlockSchema.safeParse({ t: "repeat", n: 99, body: [] }).success).toBe(false);
    expect(answerBlockSchema.safeParse({ t: "if", body: [], else: [] }).success).toBe(true);
  });
});
