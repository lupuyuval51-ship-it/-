import { describe, expect, it } from "vitest";
import { TIER_MAX_AREAS, tierHas, type FeatureTier } from "@/config/plans";
import { GAME_TYPES, LAYOUTS, MECHANICS, SPEC_LIMITS, type GameType, type Mechanic } from "@/lib/game/spec/constants";
import { EDIT_LIMITS, applyEditOps, editResponseSchema, identityChanges, sameContent, type EditOp } from "@/lib/game/spec/edit";
import { estimateMinutes, estimateSeconds, thinkSeconds } from "@/lib/game/spec/estimate";
import { mergeExtension } from "@/lib/game/spec/extension";
import { LAYOUT_FOR_GAME_TYPE, MECHANIC_REGISTRY, impliedMechanics, mechanicsForArea, verifyMechanics } from "@/lib/game/spec/mechanics";
import { toPublicSpec } from "@/lib/game/spec/public";
import { extensionSchema, type Challenge, type GameExtension, type GameSpec } from "@/lib/game/spec/schema";
import { clampToFeatureTier, challengeTypeAllowed, gameTypeAllowed, gameTypeFeature, maxAreasFor, maxTier, mechanicAllowed, mechanicFeature, modeAllowed } from "@/lib/game/spec/tier";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { buildDemoExtension } from "../support/samples";
import { PACK_SUBJECT, request, validDemoSpec } from "./helpers";

/** The pure model of a game: which mechanics a layout can express, how long a game takes, what a tier keeps, how games grow and are edited. */

// ───────────────────────────── mechanics ─────────────────────────────

describe("the mechanics registry", () => {
  it("lists exactly the mechanics the schema accepts, each with at least one real layout and a description", () => {
    expect(Object.keys(MECHANIC_REGISTRY).sort()).toEqual([...MECHANICS].sort());
    for (const [id, info] of Object.entries(MECHANIC_REGISTRY)) {
      expect(info.id).toBe(id);
      expect(info.layouts.length, id).toBeGreaterThan(0);
      for (const l of info.layouts) expect(LAYOUTS as readonly string[], id).toContain(l);
      expect(info.description.length, id).toBeGreaterThan(10);
    }
  });

  it("each game type except the adventure has its own layout, and that layout is a real one", () => {
    expect(Object.keys(LAYOUT_FOR_GAME_TYPE).sort()).toEqual(GAME_TYPES.filter((t) => t !== "adventure").sort());
    for (const layout of Object.values(LAYOUT_FOR_GAME_TYPE)) expect(LAYOUTS as readonly string[]).toContain(layout);
    expect(new Set(Object.values(LAYOUT_FOR_GAME_TYPE)).size).toBe(Object.keys(LAYOUT_FOR_GAME_TYPE).length); // no two types share a layout
  });

  it("the layouts of the special mechanics: lava on plazas and terraces, sliding platforms only on terraces, doors in rooms and corridors", () => {
    expect([...MECHANIC_REGISTRY.hazards.layouts].sort()).toEqual(["plaza", "terraces"]);
    expect([...MECHANIC_REGISTRY.moving_platforms.layouts]).toEqual(["terraces"]);
    expect([...MECHANIC_REGISTRY.gates.layouts].sort()).toEqual(["corridor", "rooms"]);
    expect([...MECHANIC_REGISTRY.checkpoints.layouts].sort()).toEqual(["corridor", "plaza", "terraces"]);
  });
});

describe("impliedMechanics: what the content itself requires", () => {
  const base = validDemoSpec({ gameType: "exploration", mode: "FAST", subject: PACK_SUBJECT.math });
  const bare = (): Pick<GameSpec, "areas" | "challenges"> => {
    const s = structuredClone(base);
    for (const a of s.areas) {
      a.collectibles.count = 0;
      a.npcs = [];
      delete a.portal;
      a.layout = "plaza";
    }
    for (const c of s.challenges) {
      delete c.timeLimitSec;
      delete c.easierId;
      delete c.harderId;
    }
    return s;
  };

  it("nothing in the content, nothing implied", () => {
    expect(impliedMechanics(bare())).toEqual([]);
  });

  it("collectibles imply collect, characters dialogue, a portal or a second area portals", () => {
    const s = bare();
    s.areas[0]!.collectibles.count = 1;
    expect(impliedMechanics(s)).toEqual(["collect"]);
    s.areas[0]!.npcs = structuredClone(base.areas[0]!.npcs);
    expect(impliedMechanics(s).sort()).toEqual(["collect", "dialogue"]);
    const portal = bare();
    portal.areas[0]!.portal = { toAreaId: "a-x", label: "x", requiresMissionIds: [] };
    expect(impliedMechanics(portal)).toEqual(["portals"]);
    const two = bare();
    two.areas.push({ ...structuredClone(two.areas[0]!), id: "a-two" });
    expect(impliedMechanics(two)).toEqual(["portals"]);
  });

  it("a platformer area implies jumping and checkpoints", () => {
    const s = bare();
    s.areas[0]!.layout = "terraces";
    expect(impliedMechanics(s).sort()).toEqual(["checkpoints", "jump"]);
  });

  it("a time limit implies the timed bonus, a variant the adaptive difficulty (either direction)", () => {
    const s = bare();
    s.challenges[0]!.timeLimitSec = 30;
    expect(impliedMechanics(s)).toEqual(["timed_bonus"]);
    const easier = bare();
    easier.challenges[0]!.easierId = "x";
    expect(impliedMechanics(easier)).toEqual(["adaptive_difficulty"]);
    const harder = bare();
    harder.challenges[1]!.harderId = "x";
    expect(impliedMechanics(harder)).toEqual(["adaptive_difficulty"]);
  });
});

describe("verifyMechanics and mechanicsForArea: what actually takes effect", () => {
  const withLayouts = (layouts: GameSpec["areas"][number]["layout"][], mechanics: Mechanic[]): Pick<GameSpec, "areas" | "mechanics" | "challenges"> => {
    const s = structuredClone(validDemoSpec({ gameType: "adventure", mode: "FULL" }));
    s.areas = s.areas.slice(0, layouts.length).map((a, i) => ({ ...a, layout: layouts[i]! }));
    s.mechanics = mechanics;
    return s;
  };

  it("a declared mechanic that no area's layout can express is reported as ignored, with the reason", () => {
    const report = verifyMechanics(withLayouts(["plaza", "corridor"], ["moving_platforms", "hazards"]));
    expect(report.ignored.map((i) => i.mechanic)).toEqual(["moving_platforms"]);
    expect(report.ignored[0]!.reason).toMatch(/no area uses a layout that supports "moving_platforms" \(terraces\)/);
    expect(report.active).toContain("hazards");
    expect(report.active).not.toContain("moving_platforms");
  });

  it("it takes only one area that can express it for the mechanic to count as active", () => {
    expect(verifyMechanics(withLayouts(["plaza", "terraces"], ["moving_platforms"])).active).toContain("moving_platforms");
  });

  it("implied mechanics are active even when the spec forgot to declare them", () => {
    const s = withLayouts(["plaza", "corridor"], []);
    expect(verifyMechanics(s).active).toEqual(expect.arrayContaining(["collect", "dialogue", "portals"]));
  });

  it("per area: only the mechanics that area's layout supports", () => {
    const s = withLayouts(["plaza", "rooms"], ["hazards", "gates", "checkpoints", "moving_platforms"]);
    const plaza = mechanicsForArea(s, s.areas[0]!.id);
    const rooms = mechanicsForArea(s, s.areas[1]!.id);
    expect([plaza.has("hazards"), plaza.has("gates"), plaza.has("checkpoints"), plaza.has("moving_platforms")]).toEqual([true, false, true, false]);
    expect([rooms.has("hazards"), rooms.has("gates"), rooms.has("checkpoints"), rooms.has("moving_platforms")]).toEqual([false, true, false, false]);
  });

  it("an area that is not in the game has no mechanics at all", () => {
    expect(mechanicsForArea(withLayouts(["plaza"], ["collect"]), "a-nowhere").size).toBe(0);
  });
});

// ───────────────────────────── what the browser may see ─────────────────────────────

describe("toPublicSpec: the whole world, none of the questions", () => {
  const spec = validDemoSpec({ gameType: "adventure", mode: "FULL" });

  it("keeps everything but the challenges, and is a copy (changing it never touches the saved game)", () => {
    const before = JSON.stringify(spec);
    const pub = toPublicSpec(spec);
    expect(pub.challenges).toEqual([]);
    expect(pub.areas).toEqual(spec.areas);
    expect(pub.missions).toEqual(spec.missions);
    expect(pub.bosses).toEqual(spec.bosses);
    expect(pub.meta).toEqual(spec.meta);
    pub.areas[0]!.name = "changed";
    pub.missions.length = 0;
    expect(JSON.stringify(spec)).toBe(before);
  });

  it("no text of any challenge (prompt, hint, explanation, an option's feedback, a mistake's feedback) is anywhere in what is sent", () => {
    const json = JSON.stringify(toPublicSpec(spec));
    for (const c of spec.challenges) {
      const secrets = [c.explanation, c.hint, c.prompt, c.title];
      if (c.type === "choice") secrets.push(...c.options.map((o) => o.feedback));
      if (c.type === "numeric") secrets.push(...c.commonMistakes.map((m) => m.feedback));
      for (const secret of secrets) if (secret) expect(json.includes(JSON.stringify(secret).slice(1, -1)), `${c.id}: ${secret.slice(0, 40)}`).toBe(false);
    }
  });
});

// ───────────────────────────── how long a game takes ─────────────────────────────

describe("estimate: how long a game takes comes from its content", () => {
  const spec = validDemoSpec({ gameType: "adventure", mode: "FULL" });
  const ofType = <T extends Challenge["type"]>(type: T): Extract<Challenge, { type: T }> => spec.challenges.find((c) => c.type === type) as Extract<Challenge, { type: T }>;

  it("every challenge takes time, and a longer prompt takes longer", () => {
    for (const c of spec.challenges) {
      expect(thinkSeconds(c), c.id).toBeGreaterThan(0);
      expect(thinkSeconds({ ...c, prompt: `${c.prompt} ${"word ".repeat(60)}` }), c.id).toBeGreaterThan(thinkSeconds(c));
    }
  });

  it("more options, items, pairs or blocks take longer", () => {
    const choice = ofType("choice");
    expect(thinkSeconds({ ...choice, options: [...choice.options, { id: "extra", text: "e", feedback: "f" }] })).toBeGreaterThan(thinkSeconds(choice));
    const seq = ofType("sequence");
    expect(thinkSeconds({ ...seq, items: [...seq.items, { id: "extra", text: "e" }] })).toBeGreaterThan(thinkSeconds(seq));
    const prog = ofType("program");
    expect(thinkSeconds({ ...prog, maxBlocks: prog.maxBlocks + 2 })).toBeGreaterThan(thinkSeconds(prog));
  });

  it("a builder (a program or a simulation) takes longer than a plain numeric answer with the same prompt", () => {
    const num = ofType("numeric");
    const prog = ofType("program");
    expect(thinkSeconds({ ...prog, prompt: num.prompt, maxBlocks: 1 })).toBeGreaterThan(thinkSeconds(num));
  });

  it("estimateSeconds adds up the placed challenges, the information cards and the characters; a variant (not on a station) adds nothing", () => {
    const only = (s: GameSpec) => estimateSeconds(s);
    const total = only(spec);
    const noVariants = structuredClone(spec);
    noVariants.challenges = noVariants.challenges.filter((c) => !/-(easy|hard)$/.test(c.id));
    expect(only(noVariants)).toBe(total);
    const oneLess = structuredClone(spec);
    oneLess.areas[0]!.npcs = [];
    expect(total - only(oneLess)).toBeGreaterThan(0); // the character was part of the time
    const noLore = structuredClone(spec);
    for (const a of noLore.areas) a.stations = a.stations.filter((s) => s.kind !== "lore");
    expect(total - only(noLore)).toBeGreaterThan(0);
  });

  it("a challenge station whose challenge is missing counts for nothing instead of throwing", () => {
    const s = structuredClone(spec);
    s.challenges = [];
    expect(() => estimateSeconds(s)).not.toThrow();
    const loreAndNpcsOnly = estimateSeconds(s);
    expect(loreAndNpcsOnly).toBeGreaterThan(0);
    expect(loreAndNpcsOnly).toBeLessThan(estimateSeconds(spec));
  });

  it("estimateMinutes rounds to whole minutes and stays inside what the schema accepts (2 to 120)", () => {
    expect(estimateMinutes({ areas: [], challenges: [] })).toBe(2);
    const tiny = structuredClone(spec);
    tiny.areas = [{ ...tiny.areas[0]!, stations: tiny.areas[0]!.stations.slice(0, 1), npcs: [] }];
    tiny.challenges = tiny.challenges.slice(0, 1);
    expect(estimateMinutes(tiny)).toBeGreaterThanOrEqual(2);
    const huge = structuredClone(spec);
    huge.areas = Array.from({ length: 40 }, (_, i) => ({ ...structuredClone(spec.areas[0]!), id: `a${i}` }));
    expect(estimateMinutes(huge)).toBe(120);
    const m = estimateMinutes(spec);
    expect(Number.isInteger(m)).toBe(true);
    expect(m).toBe(Math.max(2, Math.min(120, Math.round(estimateSeconds(spec) / 60))));
  });
});

// ───────────────────────────── tiers ─────────────────────────────

describe("tier helpers", () => {
  const tiers: FeatureTier[] = ["C", "B", "A"];

  it("maxTier is the fuller of two tiers (C < B < A), whichever way round", () => {
    for (const a of tiers) for (const b of tiers) {
      expect(maxTier(a, b)).toBe(tiers[Math.max(tiers.indexOf(a), tiers.indexOf(b))]);
      expect(maxTier(a, b)).toBe(maxTier(b, a));
    }
  });

  it("the mechanic behind each feature, and which tier may switch it on (switching one off is always allowed)", () => {
    expect(mechanicFeature("collect")).toBe("system:collect");
    expect(mechanicFeature("portals")).toBe("system:multi_area");
    expect(mechanicFeature("jump")).toBeUndefined();
    expect(mechanicFeature("moving_platforms")).toBeUndefined();
    expect(mechanicFeature("gates")).toBeUndefined();
    const allowed = (t: FeatureTier) => MECHANICS.filter((m) => mechanicAllowed(t, m));
    expect(allowed("C")).toEqual(["collect", "dialogue", "jump", "checkpoints", "moving_platforms", "gates"]);
    expect(allowed("B")).toEqual(["collect", "dialogue", "jump", "hazards", "checkpoints", "moving_platforms", "gates", "portals", "timed_bonus"]);
    expect(allowed("A")).toEqual([...MECHANICS]);
    for (const m of MECHANICS) {
      const f = mechanicFeature(m);
      for (const t of tiers) expect(mechanicAllowed(t, m)).toBe(!f || tierHas(t, f));
    }
  });

  it("game types: the adventure is the multi-area feature, every other type its own", () => {
    for (const type of GAME_TYPES) expect(gameTypeFeature(type)).toBe(type === "adventure" ? "system:multi_area" : `type:${type}`);
    for (const t of tiers) for (const type of GAME_TYPES) expect(gameTypeAllowed(t, type as GameType)).toBe(tierHas(t, gameTypeFeature(type)));
  });

  it("fast games are for every tier; Full Adventures and extensions need multi-area; areas never exceed the tier's allowance", () => {
    for (const t of tiers) {
      expect(modeAllowed(t, "FAST")).toBe(true);
      expect(modeAllowed(t, "FULL")).toBe(tierHas(t, "system:multi_area"));
      expect(modeAllowed(t, "EXTEND")).toBe(tierHas(t, "system:multi_area"));
      expect(maxAreasFor(t)).toBe(tierHas(t, "system:multi_area") ? TIER_MAX_AREAS[t] : 1);
    }
    expect(maxAreasFor("A")).toBeLessThanOrEqual(SPEC_LIMITS.areas);
  });

  it("which challenge types a tier may ask", () => {
    expect(challengeTypeAllowed("C", "choice")).toBe(true);
    expect(challengeTypeAllowed("C", "match")).toBe(false);
    expect(challengeTypeAllowed("B", "match")).toBe(true);
    expect(challengeTypeAllowed("B", "program")).toBe(false);
    expect(challengeTypeAllowed("A", "simulation")).toBe(true);
  });
});

describe("clampToFeatureTier: what leaves and what is repaired", () => {
  /** A two-area exploration game with everything above tier C added to it: a time limit, a reaction, lava, a side mission and the adaptive variants it already has. */
  const full = (): GameSpec => {
    const s = validDemoSpec({ gameType: "exploration", mode: "FULL", subject: PACK_SUBJECT.math });
    const first = s.areas[0]!;
    first.hazardLevel = "high";
    first.npcs[0]!.reactions = [{ afterMissionId: "m-gate", lines: ["You opened the gate!"] }];
    const timed = s.challenges.find((c) => first.stations.some((st) => st.challengeId === c.id) && !c.easierId && !c.harderId)!;
    timed.timeLimitSec = 45;
    s.mechanics = [...new Set([...s.mechanics, "hazards" as const])];
    s.missions.push({ id: "m-side", title: "A side quest", story: "An optional detour.", areaId: first.id, requires: ["m-gate"], objectives: [{ type: "talk", text: "Say hello again", npcId: first.npcs[0]!.id }], optional: true });
    const hall = s.missions.find((m) => m.id === "m-hall")!;
    hall.requires = [...hall.requires, "m-side"]; // a required mission that waits for the side quest
    return s;
  };
  const clamp = (s: GameSpec, tier: FeatureTier) => {
    const r = clampToFeatureTier(s, tier);
    if (!r.ok) throw new Error(r.errors.join("; "));
    return r;
  };

  it("the game as built is valid (so every change below comes from the tier)", () => {
    expect(validateGameSpec(full(), { alignGameType: "exploration" }).ok).toBe(true);
  });

  it("tier C: one area, no lava, no time limit, no reaction, no side quest, no adaptive variants, no match questions", () => {
    const r = clamp(full(), "C");
    const s = r.spec;
    expect(s.meta.featureTier).toBe("C");
    expect(s.areas.map((a) => a.id)).toEqual(["a-hall"]);
    expect(s.areas[0]!.portal).toBeUndefined();
    expect(s.areas.every((a) => a.hazardLevel === "none")).toBe(true);
    expect(s.challenges.some((c) => c.timeLimitSec)).toBe(false);
    expect(s.areas.every((a) => a.npcs.every((n) => n.reactions.length === 0))).toBe(true);
    expect(s.missions.some((m) => m.optional)).toBe(false);
    expect(s.challenges.some((c) => c.easierId || c.harderId)).toBe(false);
    expect(s.challenges.every((c) => c.type !== "match")).toBe(true);
    expect(s.mechanics).not.toContain("hazards");
    expect(s.mechanics).not.toContain("timed_bonus");
    expect(s.mechanics).not.toContain("adaptive_difficulty");
    expect(s.mechanics).not.toContain("portals");
    expect(r.removed).toEqual(expect.arrayContaining(["system:multi_area", "system:adaptive_difficulty", "system:timed_bonus", "system:reactions", "system:side_missions", "system:hazards"]));
  });

  it("what pointed at something that was removed is repaired: the required mission no longer waits for the side quest, the later areas' missions are gone", () => {
    const s = clamp(full(), "C").spec;
    expect(s.missions.map((m) => m.id)).toEqual(["m-gate", "m-hall"]);
    expect(s.missions.find((m) => m.id === "m-hall")!.requires).toEqual(["m-gate"]);
    expect(crossCheckClean(s)).toBe(true);
  });

  it("tier B keeps two areas, the side quest, lava and time limits, but not reactions or adaptive variants", () => {
    const r = clamp(full(), "B");
    const s = r.spec;
    expect(s.areas).toHaveLength(2);
    expect(s.missions.some((m) => m.optional)).toBe(true);
    expect(s.areas[0]!.hazardLevel).toBe("high");
    expect(s.challenges.some((c) => c.timeLimitSec)).toBe(true);
    expect(s.areas.every((a) => a.npcs.every((n) => n.reactions.length === 0))).toBe(true);
    expect(s.challenges.some((c) => c.easierId || c.harderId)).toBe(false);
    expect(r.removed).toEqual(expect.arrayContaining(["system:reactions", "system:adaptive_difficulty"]));
    expect(r.removed).not.toContain("system:timed_bonus");
    expect(r.removed).not.toContain("system:hazards");
    expect(r.removed).not.toContain("system:side_missions");
  });

  it("a variant leaves together with the base challenge's pointers to it, and no challenge is left dangling", () => {
    const base = full();
    const withVariant = base.challenges.filter((c) => c.easierId || c.harderId);
    expect(withVariant.length).toBeGreaterThan(0);
    const out = clamp(base, "B").spec;
    const ids = new Set(out.challenges.map((c) => c.id));
    for (const c of withVariant) {
      for (const v of [c.easierId, c.harderId]) if (v) expect(ids.has(v), `${v} left`).toBe(false);
      expect(ids.has(c.id), `${c.id} stays`).toBe(c.type !== "program" && c.type !== "simulation");
    }
  });

  it("the areas that stay follow the chain of portals from the first one, not the list order", () => {
    // three areas chained plaza -> lab -> foundry, but LISTED plaza, foundry, lab: a tier with room for two keeps the first two of the chain
    const programming = (g: GameSpec): GameSpec => ({ ...g, meta: { ...g.meta, generator: { kind: "demo", provider: "demo", model: "templates", templateId: "programming", mode: "FULL", generatedAt: "x" } } });
    const two = programming(validDemoSpec({ gameType: "adventure", mode: "FULL" }));
    const three = validateGameSpec(mergeExtension(two, extensionSchema.parse(buildDemoExtension(two, request({ mode: "EXTEND" }))!.ext)).raw);
    if (!three.ok) throw new Error(three.errors.join("\n"));
    const chain = three.spec.areas.map((a) => a.id);
    expect(chain).toEqual(["a-plaza", "a-lab", "a-foundry"]);
    const shuffled = structuredClone(three.spec);
    shuffled.areas = [shuffled.areas[0]!, shuffled.areas[2]!, shuffled.areas[1]!];
    const out = clamp(shuffled, "B").spec;
    expect(out.areas.map((a) => a.id)).toEqual(["a-plaza", "a-lab"]);
    expect(out.areas.find((a) => a.id === "a-lab")!.portal).toBeUndefined(); // it led to the area that is gone
    expect(out.missions.every((m) => m.areaId !== "a-foundry")).toBe(true);
    const gone = three.spec.areas[2]!.stations.map((st) => st.challengeId).filter((id): id is string => Boolean(id));
    expect(gone.length).toBeGreaterThan(0);
    for (const id of gone) expect(out.challenges.some((c) => c.id === id), id).toBe(false);
    expect(out.areas.length).toBeLessThanOrEqual(maxAreasFor("B"));
  });

  it("never mutates its input, and records the producer's provenance untouched", () => {
    const s = full();
    s.meta.generator = { kind: "engine", provider: "study", model: "rules", mode: "FULL", generatedAt: "t" };
    const before = JSON.stringify(s);
    const out = clamp(s, "C").spec;
    expect(JSON.stringify(s)).toBe(before);
    expect(out.meta.generator).toEqual(s.meta.generator);
  });

  it("a game type the tier does not have cannot be clamped into it", () => {
    const r = clampToFeatureTier(validDemoSpec({ gameType: "platformer" }), "C");
    expect(r).toEqual({ ok: false, errors: [`the game type "platformer" is not part of tier C`] });
  });
});

const crossCheckClean = (s: GameSpec) => validateGameSpec(s, { alignGameType: s.meta.gameType }).ok;

// ───────────────────────────── extending a game ─────────────────────────────

describe("mergeExtension", () => {
  const programming = (s: GameSpec): GameSpec => ({ ...s, meta: { ...s.meta, generator: { kind: "demo", provider: "demo", model: "templates", templateId: "programming", mode: "FULL", generatedAt: "x" } } });
  const base = programming(validDemoSpec({ gameType: "adventure", mode: "FULL" }));
  const extension = (): GameExtension => extensionSchema.parse(buildDemoExtension(base, request({ mode: "EXTEND" }))!.ext);
  const newArea = (e: GameExtension) => e.areas[0]!;

  it("a plain extension adds its area, mission and challenges after the last area, linked by one portal, and leaves the old game as it was", () => {
    const before = JSON.stringify(base);
    const ext = extension();
    const m = mergeExtension(base, ext);
    expect(JSON.stringify(base)).toBe(before); // the saved game is never touched
    expect([m.addedAreas, m.addedMissions, m.addedChallenges]).toEqual([ext.areas.length, ext.missions.length, ext.challenges.length]);
    const last = m.raw.areas[base.areas.length - 1]!;
    expect(last.portal?.toAreaId).toBe(newArea(ext).id);
    expect(last.portal?.requiresMissionIds).toEqual(base.missions.filter((x) => x.areaId === last.id).map((x) => x.id).slice(-2));
    expect(m.notes.join(" ")).toMatch(/linked "[^"]+" to the new area/);
    expect(validateGameSpec(m.raw).ok).toBe(true);
  });

  it("every id that clashes is renamed and every reference follows: areas, stations, characters, missions, challenges, objectives", () => {
    const ext = extension();
    const a = newArea(ext);
    const st = a.stations.find((s) => s.kind === "challenge")!;
    const npc = a.npcs[0]!;
    const mission = ext.missions[0]!;
    const challenge = ext.challenges.find((c) => c.id === st.challengeId)!;
    // collide everything with what the base already has
    const old = { area: a.id, station: st.id, npc: npc.id, mission: mission.id, challenge: challenge.id };
    a.id = "a-plaza";
    st.id = "s-var1";
    npc.id = "n-byte";
    mission.id = "m-boot";
    challenge.id = "c-var1";
    st.challengeId = "c-var1";
    mission.areaId = "a-plaza";
    for (const o of mission.objectives) {
      if (o.type === "talk") o.npcId = "n-byte";
      if (o.type === "solve") o.challengeIds = o.challengeIds.map((id) => (id === old.challenge ? "c-var1" : id));
    }
    if (ext.missions[1]) ext.missions[1].requires = ["m-boot"];
    const m = mergeExtension(base, ext);
    const notes = m.notes.join(" | ");
    for (const kind of ["area", "station", "npc", "mission", "challenge"]) expect(notes, kind).toMatch(new RegExp(`renamed ${kind} `));
    const area = m.raw.areas.at(-1)!;
    expect(area.id).not.toBe("a-plaza");
    const station = area.stations.find((s) => s.kind === "challenge" && s.id !== "s-var1")!;
    expect(station.challengeId).not.toBe("c-var1");
    expect(m.raw.challenges.some((c) => c.id === station.challengeId)).toBe(true);
    const added = m.raw.missions.at(-ext.missions.length)!;
    expect(added.id).not.toBe("m-boot");
    expect(added.areaId).toBe(area.id);
    const talk = added.objectives.find((o) => o.type === "talk");
    if (talk?.type === "talk") expect(area.npcs.some((n) => n.id === talk.npcId)).toBe(true);
    const solve = added.objectives.find((o) => o.type === "solve");
    if (solve?.type === "solve") expect(solve.challengeIds.every((id) => m.raw.challenges.some((c) => c.id === id))).toBe(true);
    // the old content is untouched, and the whole thing is a valid game
    expect(m.raw.missions.find((x) => x.id === "m-boot")).toEqual(base.missions.find((x) => x.id === "m-boot"));
    const checked = validateGameSpec(m.raw);
    if (!checked.ok) throw new Error(checked.errors.join("\n"));
    const ids = (xs: { id: string }[]) => new Set(xs.map((x) => x.id)).size === xs.length;
    expect([ids(checked.spec.areas), ids(checked.spec.missions), ids(checked.spec.challenges), ids(checked.spec.areas.flatMap((x) => x.stations)), ids(checked.spec.areas.flatMap((x) => x.npcs))]).toEqual([true, true, true, true, true]);
  });

  it("a visit objective follows its renamed lore station", () => {
    const ext = extension();
    const a = newArea(ext);
    a.stations.push({ id: "s-lore1", kind: "lore", label: "Old forge", loreTitle: "The forge", loreText: "A place where tools were made." }); // clashes with the base's s-lore1
    ext.missions[0]!.objectives.push({ type: "visit", text: "Read about the forge", stationIds: ["s-lore1"] });
    const m = mergeExtension(base, ext);
    const station = m.raw.areas.at(-1)!.stations.find((s) => s.kind === "lore")!;
    expect(station.id).not.toBe("s-lore1");
    const visit = m.raw.missions.at(-ext.missions.length)!.objectives.find((o) => o.type === "visit");
    expect(visit?.type === "visit" && visit.stationIds).toEqual([station.id]);
    expect(validateGameSpec(m.raw).ok).toBe(true);
  });

  it("a learning objective that clashes is renamed and the challenges that assess it follow", () => {
    const ext = extension();
    ext.objectives = [{ id: "o-vars", text: "A new objective that reuses an old id" }];
    ext.challenges[0]!.objectiveId = "o-vars";
    const m = mergeExtension(base, ext);
    const added = m.raw.learning.objectives.at(-1)!;
    expect(added.id).not.toBe("o-vars");
    expect(m.raw.challenges.find((c) => c.id === ext.challenges[0]!.id || c.objectiveId === added.id)!.objectiveId).toBe(added.id);
    expect(m.raw.learning.objectives.filter((o) => o.id === "o-vars")).toHaveLength(1);
    expect(validateGameSpec(m.raw).ok).toBe(true);
  });

  // KNOWN BUG, not fixed here (src/lib/game/spec/extension.ts is outside this territory): when the game already has the most learning
  // objectives the schema allows, `ext.objectives.slice(0, room)` drops the extension's new objectives without a note, but the
  // extension's challenges keep `objectiveId` pointing at them, so validateGameSpec refuses the merged game
  // ("challenge ... assesses unknown learning objective") and the whole extension is lost. The fix is to clear (or re-point) the
  // `objectiveId` of every extension challenge whose objective was dropped, and to add a note. Turn this on when it is fixed.
  it("an objective dropped at the limit does not leave the extension's challenges pointing at it", () => {
    const full = structuredClone(base);
    while (full.learning.objectives.length < SPEC_LIMITS.learningObjectives) full.learning.objectives.push({ id: `o-pad${full.learning.objectives.length}`, text: "A padding objective" });
    const ext = extension();
    ext.objectives = [{ id: "o-new", text: "A new objective for the new area" }];
    ext.challenges[0]!.objectiveId = "o-new";
    const m = mergeExtension(full, ext);
    expect(m.raw.learning.objectives).toHaveLength(SPEC_LIMITS.learningObjectives);
    expect(validateGameSpec(m.raw).ok).toBe(true);
  });

  it("a long id that clashes still gets a valid, unique new id (at most 40 characters)", () => {
    const ext = extension();
    const longId = "m-" + "x".repeat(37);
    const spec = structuredClone(base);
    spec.missions[0]!.id = longId;
    for (const mm of spec.missions) mm.requires = mm.requires.map((r) => (r === "m-boot" ? longId : r));
    for (const a of spec.areas) if (a.portal) a.portal.requiresMissionIds = a.portal.requiresMissionIds.map((r) => (r === "m-boot" ? longId : r));
    ext.missions[0]!.id = longId;
    const m = mergeExtension(spec, ext);
    const renamed = m.raw.missions.at(-ext.missions.length)!.id;
    expect(renamed).not.toBe(longId);
    expect(renamed.length).toBeLessThanOrEqual(40);
    expect(renamed).toMatch(/^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/);
  });

  it("an extension that links its own entry area, or a game whose chain already continues, gets no second portal", () => {
    const ext = extension();
    const inbound = structuredClone(base);
    inbound.areas[1]!.portal = { toAreaId: newArea(ext).id, label: "to the foundry", requiresMissionIds: [] };
    const m = mergeExtension(inbound, ext);
    expect(m.notes.join(" ")).not.toMatch(/linked/);
    expect(m.raw.areas[1]!.portal).toEqual(inbound.areas[1]!.portal);
  });

  it("the chain of new areas is linked in order when the extension did not link them", () => {
    const ext = extension();
    ext.areas.push({ ...structuredClone(newArea(ext)), id: "a-annex", portal: undefined });
    const m = mergeExtension(base, ext);
    const entry = m.raw.areas.find((a) => a.id === newArea(ext).id)!;
    expect(entry.portal?.toAreaId).toBe("a-annex");
    expect(entry.portal?.requiresMissionIds).toEqual([]);
    expect(m.raw.areas.at(-1)!.portal).toBeUndefined(); // the last one leads nowhere
  });

  it("at the limit of areas, missions or challenges nothing more is added, and the notes say so", () => {
    const full = structuredClone(base);
    while (full.areas.length < SPEC_LIMITS.areas) full.areas.push({ ...structuredClone(full.areas[0]!), id: `a-pad${full.areas.length}`, portal: undefined });
    while (full.missions.length < SPEC_LIMITS.missions) full.missions.push({ ...structuredClone(full.missions[0]!), id: `m-pad${full.missions.length}` });
    while (full.challenges.length < SPEC_LIMITS.challenges) full.challenges.push({ ...structuredClone(full.challenges[0]!), id: `c-pad${full.challenges.length}` });
    const m = mergeExtension(full, extension());
    expect([m.addedAreas, m.addedMissions, m.addedChallenges]).toEqual([0, 0, 0]);
    expect(m.raw.areas).toHaveLength(SPEC_LIMITS.areas);
    expect(m.raw.missions).toHaveLength(SPEC_LIMITS.missions);
    expect(m.raw.challenges).toHaveLength(SPEC_LIMITS.challenges);
    expect(m.notes.join(" ")).toMatch(/area limit/);
    expect(m.notes.join(" ")).toMatch(/mission limit/);
    expect(m.notes.join(" ")).toMatch(/challenge limit/);
    expect(m.notes.join(" ")).not.toMatch(/linked/); // no portal to an area that was not added
  });

  it("mechanics are added without repeats, and the conclusion only changes when the extension has one", () => {
    const ext = extension();
    ext.mechanics = ["collect", "timed_bonus"];
    ext.conclusion = undefined;
    const m = mergeExtension(base, ext);
    expect(m.raw.mechanics.filter((x) => x === "collect")).toHaveLength(1);
    expect(m.raw.mechanics).toContain("timed_bonus");
    expect(m.raw.learning.conclusion).toBe(base.learning.conclusion);
    ext.conclusion = "A new ending for the longer game.";
    expect(mergeExtension(base, ext).raw.learning.conclusion).toBe("A new ending for the longer game.");
  });
});

// ───────────────────────────── editing a game by operations ─────────────────────────────

describe("applyEditOps: more of the rules", () => {
  const spec = validDemoSpec({ gameType: "adventure", mode: "FULL" });
  const run = (ops: EditOp[], max: number = EDIT_LIMITS.opsA) => applyEditOps(spec, ops, max);
  const errors = (ops: EditOp[]) => {
    const r = run(ops);
    return r.ok ? [] : r.errors;
  };
  const okRaw = (ops: EditOp[]) => {
    const r = run(ops);
    if (!r.ok) throw new Error(r.errors.join("; "));
    return r.raw as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  };

  it("indexes: add may insert at the end (index = length) but not beyond; replace and remove need an existing item; '-' only appends", () => {
    const n = spec.mechanics.length;
    expect(okRaw([{ op: "add", path: `/mechanics/${n}`, value: "hazards" }]).mechanics.at(-1)).toBe("hazards");
    expect(errors([{ op: "add", path: `/mechanics/${n + 1}`, value: "hazards" }])[0]).toMatch(new RegExp(`the list has ${n} items`));
    expect(errors([{ op: "replace", path: `/mechanics/${n}`, value: "hazards" }])[0]).toMatch(/index out of range/);
    expect(errors([{ op: "replace", path: "/mechanics/-", value: "hazards" }])[0]).toMatch(/index out of range/);
    expect(errors([{ op: "remove", path: "/mechanics/-" }])[0]).toMatch(/index out of range/);
    for (const bad of ["/mechanics/-1", "/mechanics/1.5", "/mechanics/x", "/mechanics/1e1"]) expect(errors([{ op: "add", path: bad, value: "hazards" }])[0], bad).toMatch(/index out of range/);
  });

  it("operations run in order and each sees the result of the one before", () => {
    const len = spec.learning.objectives.length;
    const raw = okRaw([
      { op: "add", path: "/learning/objectives/-", value: { id: "o-a", text: "A" } },
      { op: "replace", path: `/learning/objectives/${len}/text`, value: "A, reworded" },
      { op: "add", path: `/learning/objectives/${len}`, value: { id: "o-first", text: "Inserted before it" } },
    ]);
    expect(raw.learning.objectives.slice(len)).toEqual([{ id: "o-first", text: "Inserted before it" }, { id: "o-a", text: "A, reworded" }]);
    // an operation can only use what an earlier one made
    expect(errors([{ op: "replace", path: `/learning/objectives/${len}/text`, value: "too early" }, { op: "add", path: "/learning/objectives/-", value: { id: "o-a", text: "A" } }])[0]).toMatch(/^ops\[0\]/);
  });

  it("every problem is reported, each labelled with its operation, and nothing is returned when any operation fails", () => {
    const r = run([
      { op: "replace", path: "/meta/title", value: "fine" },
      { op: "replace", path: "/areas/99/name", value: "x" },
      { op: "remove", path: "/theme/nope" },
    ]);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors).toHaveLength(2);
    expect(r.errors[0]).toMatch(/^ops\[1\] \(replace \/areas\/99\/name\)/);
    expect(r.errors[1]).toMatch(/^ops\[2\] \(remove \/theme\/nope\)/);
  });

  it("the sections an edit may replace as a whole, and the meta fields it may touch", () => {
    expect(okRaw([{ op: "replace", path: "/mechanics", value: ["collect"] }]).mechanics).toEqual(["collect"]);
    expect(okRaw([{ op: "replace", path: "/bosses", value: [] }]).bosses).toEqual([]);
    expect(okRaw([{ op: "replace", path: "/meta/subjectCategory", value: "math" }]).meta.subjectCategory).toBe("math");
    expect(errors([{ op: "replace", path: "/meta", value: {} }])[0]).toMatch(/meta\. cannot be edited/); // not the whole of meta: that holds the identity
    for (const section of ["meta", "learning", "theme", "mechanics", "areas", "missions", "challenges", "bosses"]) {
      expect(errors([{ op: "remove", path: `/${section}` }])[0], section).toMatch(/(cannot be removed|cannot be edited)/);
    }
    expect(errors([{ op: "replace", path: "/schemaVersion", value: 2 }])[0]).toMatch(/cannot be edited/);
    for (const field of ["generator", "featureTier", "language", "subject", "gameType", "difficulty"]) expect(errors([{ op: "replace", path: `/meta/${field}`, value: "x" }])[0], field).toMatch(/cannot be edited/);
  });

  it("a value that is not a container for the rest of the path is reported, not crashed on", () => {
    expect(errors([{ op: "replace", path: "/meta/title/x", value: 1 }])[0]).toMatch(/parent is not a container|does not exist/);
    expect(errors([{ op: "add", path: "/areas/0/name/first", value: 1 }])[0]).toMatch(/parent is not a container|does not exist/);
    expect(errors([{ op: "replace", path: "/mechanics/0/x/y", value: 1 }])[0]).toMatch(/does not exist|not a container/);
  });

  it("values are copied in, so the operation list can be reused and the result does not share objects with it", () => {
    const value = { id: "o-shared", text: "Shared" };
    const raw = okRaw([{ op: "add", path: "/learning/objectives/-", value }, { op: "add", path: "/learning/objectives/-", value }]);
    const [a, b] = raw.learning.objectives.slice(-2);
    expect(a).toEqual(value);
    expect(a).not.toBe(value);
    expect(a).not.toBe(b);
    value.text = "changed afterwards";
    expect(raw.learning.objectives.at(-1).text).toBe("Shared");
  });

  it("an edit to the estimated length has no lasting effect: the validator measures the game itself", () => {
    const raw = okRaw([{ op: "replace", path: "/meta/estimatedMinutes", value: 99 }]);
    expect(raw.meta.estimatedMinutes).toBe(99);
    const checked = validateGameSpec(raw, { alignGameType: spec.meta.gameType });
    expect(checked.ok && checked.spec.meta.estimatedMinutes).toBe(spec.meta.estimatedMinutes);
  });

  it("the reply schema trims the summary and bounds it", () => {
    const op = { op: "replace", path: "/meta/title", value: "x" };
    expect(editResponseSchema.parse({ summary: "  Renamed  ", ops: [op] }).summary).toBe("Renamed");
    expect(editResponseSchema.safeParse({ summary: "   ", ops: [op] }).success).toBe(false);
    expect(editResponseSchema.safeParse({ summary: "x".repeat(241), ops: [op] }).success).toBe(false);
    expect(editResponseSchema.safeParse({ summary: "x".repeat(240), ops: [op] }).success).toBe(true);
    expect(editResponseSchema.safeParse({ summary: "ok", ops: [{ op: "add", path: "", value: 1 }] }).success).toBe(false);
    expect(editResponseSchema.safeParse({ summary: "ok", ops: [{ op: "add", path: `/${"a".repeat(200)}`, value: 1 }] }).success).toBe(false);
  });

  it("identityChanges names every locked field that moved", () => {
    for (const [key, value] of [["subject", "Something else"], ["gameType", "puzzle"], ["difficulty", "advanced"], ["language", "he"]] as const) {
      const after = { ...spec, meta: { ...spec.meta, [key]: value } } as GameSpec;
      expect(identityChanges(spec, after), key).toEqual([`meta.${key} must stay "${spec.meta[key]}"`]);
    }
    const all = { ...spec, meta: { ...spec.meta, subject: "s", gameType: "puzzle", difficulty: "advanced", language: "he" } } as GameSpec;
    expect(identityChanges(spec, all)).toHaveLength(4);
    expect(identityChanges(spec, { ...spec, meta: { ...spec.meta, title: "New title", tagline: "New", estimatedMinutes: 5 } })).toEqual([]); // the title is the player's to change
  });

  it("sameContent ignores the producer's provenance", () => {
    const stamped = { ...spec, meta: { ...spec.meta, generator: { kind: "ai" as const, provider: "p", model: "m", mode: "FULL" as const, generatedAt: "t" } } };
    expect(sameContent(spec, stamped)).toBe(true);
  });

  // KNOWN BUG, not fixed here (src/lib/game/spec/edit.ts is outside this territory): `sameContent` strips only `meta.generator`,
  // but the validator deletes `meta.featureTier` (normalizeRawSpec), so a validated edit result never equals a tier-stamped saved game
  // and the "your operations did not change the game" check after validation (src/server/generation/edit.ts, second sameContent
  // call) can never fire for a game made by the pipeline; a no-op edit would be saved as a new version and cost an AI edit.
  // The fix is to strip `featureTier` too (it is server-assigned, like the generator). Turn this on when it is fixed.
  it("sameContent also ignores the plan's feature tier (server-assigned like the provenance)", () => {
    const tiered = clampToFeatureTier(spec, "A");
    if (!tiered.ok) throw new Error("clamp");
    const base = tiered.spec;
    const revalidated = validateGameSpec(structuredClone(base), { alignGameType: base.meta.gameType });
    if (!revalidated.ok) throw new Error("validate");
    expect(revalidated.spec.meta.featureTier).toBeUndefined();
    expect(sameContent(base, revalidated.spec)).toBe(true);
  });
});
