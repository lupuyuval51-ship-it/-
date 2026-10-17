import { describe, expect, it } from "vitest";
import { DEMO_PACKS, buildDemoExtension, buildDemoSpec, matchPack } from "@/lib/game/demo";
import { mergeExtension } from "@/lib/game/spec/extension";
import { extensionSchema } from "@/lib/game/spec/schema";
import { crossCheck, sanitizeDeep, validateGameSpec } from "@/lib/game/spec/validate";
import { toPublicSpec } from "@/lib/game/spec/public";
import { toPublicChallenge } from "@/lib/game/challenges/grade";
import { ALL_GAME_TYPES, PACK_SUBJECT, request, validDemoSpec } from "./helpers";

describe("demo templates are valid for every pack × language × mode × game type", () => {
  for (const pack of DEMO_PACKS) {
    for (const lang of ["en", "he"] as const) {
      for (const mode of ["FAST", "FULL"] as const) {
        for (const gameType of ALL_GAME_TYPES) {
          it(`${pack.id}/${lang}/${mode}/${gameType}`, () => {
            const req = request({ subject: PACK_SUBJECT[pack.id]!, contentLanguage: lang, mode, gameType });
            const { raw, templateId } = buildDemoSpec(req);
            expect(templateId).toBe(pack.id);
            const res = validateGameSpec(raw, { alignGameType: gameType });
            if (!res.ok) throw new Error(res.errors.join("\n"));
            expect(res.spec.meta.gameType).toBe(gameType);
            if (mode === "FAST") {
              expect(res.spec.areas).toHaveLength(1);
              expect(res.spec.challenges.length).toBeLessThanOrEqual(8);
            } else {
              expect(res.spec.areas.length).toBeGreaterThanOrEqual(2);
              expect(res.spec.missions.length).toBeGreaterThanOrEqual(3);
            }
            if (lang === "he") expect(res.spec.areas[0]!.name).toMatch(/[֐-׿]/);
          });
        }
      }
    }
  }
});

describe("validation rejects broken or unsafe specs", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const base = () => buildDemoSpec(request()).raw as Record<string, any>;

  it("rejects a station that points to an unknown challenge", () => {
    const raw = base();
    raw.areas[0].stations[0].challengeId = "nope";
    const res = validateGameSpec(raw);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.join(" ")).toMatch(/unknown challenge "nope"/);
  });

  it("rejects a wrong correctOptionId, duplicate ids and unreachable areas", () => {
    const raw = base();
    raw.challenges[0].correctOptionId = "zzz";
    raw.missions[1].id = raw.missions[0].id;
    delete raw.areas[0].portal;
    const res = validateGameSpec(raw);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      const all = res.errors.join(" | ");
      expect(all).toMatch(/duplicate mission ids/);
      expect(all).toMatch(/not one of its options/);
    }
  });

  it("rejects mission dependency cycles", () => {
    const raw = base();
    raw.missions[0].requires = ["m-final"];
    const res = validateGameSpec(raw);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.join(" ")).toMatch(/cycle|never be completed/);
  });

  it("rejects unsolvable puzzles (program solution that fails, unreachable physics targets)", () => {
    const raw = base();
    const prog = (raw.challenges as { id: string; solution?: unknown }[]).find((c) => c.id === "c-prog1")!;
    prog.solution = [{ t: "move" }];
    const res = validateGameSpec(raw);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.join(" ")).toMatch(/reference solution does not solve/);
  });

  it("strips unknown keys and unknown mechanics instead of passing them to the runtime", () => {
    const raw = base();
    raw.mechanics = [...raw.mechanics, "teleport-hack", "fly"];
    raw.areas[0].evilScript = "alert(1)";
    raw.meta.generator = { kind: "ai", provider: "forged", model: "x", mode: "FULL", generatedAt: "now" };
    const res = validateGameSpec(raw);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.spec.mechanics).not.toContain("teleport-hack");
      expect(JSON.stringify(res.spec)).not.toContain("evilScript");
      expect(res.spec.meta.generator).toBeUndefined(); // only the server may set the generator
      expect(res.warnings.join(" ")).toMatch(/unsupported mechanics dropped/);
    }
  });

  it("removes control and bidi-override characters from all text", () => {
    const dirty = sanitizeDeep({ a: "he‮llo\u0000 world", b: ["⁦x⁩"], c: null });
    expect(dirty).toEqual({ a: "hello world", b: ["x"] });
  });

  it("enforces size and count limits", () => {
    const raw = base();
    raw.areas = Array.from({ length: 9 }, (_, i) => ({ ...raw.areas[0], id: `a${i}` }));
    const res = validateGameSpec(raw);
    // more than 4 areas are truncated by normalization, then broken references are reported
    expect(res.ok).toBe(false);
    const huge = { ...base(), padding: "x".repeat(400_000) };
    const big = validateGameSpec(huge);
    expect(big.ok).toBe(false);
    if (!big.ok) expect(big.errors.join(" ")).toMatch(/too large/);
  });

  it("auto-enables mechanics that the content needs and reports mechanics without effect", () => {
    const raw = base();
    raw.mechanics = ["moving_platforms"]; // plaza/corridor layouts cannot express this
    const res = validateGameSpec(raw);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.spec.mechanics).toEqual(expect.arrayContaining(["collect", "dialogue", "portals"]));
      expect(res.spec.mechanics).not.toContain("moving_platforms");
      expect(res.warnings.join(" ")).toMatch(/moving_platforms/);
    }
  });
});

describe("game type changes the actual world layout", () => {
  it("platformer → terraces, puzzle → rooms, simulation → lab, exploration → plaza", () => {
    const layoutOf = (gameType: any) => validDemoSpec({ gameType }).areas.map((a) => a.layout); // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(new Set(layoutOf("platformer"))).toEqual(new Set(["terraces"]));
    expect(new Set(layoutOf("puzzle"))).toEqual(new Set(["rooms"]));
    expect(new Set(layoutOf("simulation"))).toEqual(new Set(["lab"]));
    expect(new Set(layoutOf("exploration"))).toEqual(new Set(["plaza"]));
    expect(new Set(layoutOf("adventure")).size).toBeGreaterThan(1);
  });
});

describe("public spec never leaks answers", () => {
  it("has no challenge content, and public challenges carry no answer keys", () => {
    const spec = validDemoSpec();
    const pub = toPublicSpec(spec);
    expect(pub.challenges).toHaveLength(0);
    for (const ch of spec.challenges) {
      const json = JSON.stringify(toPublicChallenge(ch, "seed"));
      expect(json).not.toContain("correctOptionId");
      expect(json).not.toContain("explanation");
      expect(json).not.toContain('"hint"');
      expect(json).not.toContain("solution");
      expect(json).not.toContain("feedback");
      if (ch.type === "numeric") expect(json).not.toContain(`"answer"`);
    }
  });
});

describe("Extend Existing Game", () => {
  it("merges pre-written extensions, preserves existing content and keeps the game valid", () => {
    const base = validDemoSpec();
    const built = buildDemoExtension({ ...base, meta: { ...base.meta, generator: { kind: "demo", provider: "demo", model: "templates", templateId: "programming", mode: "FULL", generatedAt: "x" } } }, request({ mode: "EXTEND" }));
    expect(built).not.toBeNull();
    const ext = extensionSchema.parse(built!.ext);
    const merged = mergeExtension(base, ext);
    const res = validateGameSpec(merged.raw);
    if (!res.ok) throw new Error(res.errors.join("\n"));
    expect(res.spec.areas.length).toBe(base.areas.length + 1);
    expect(res.spec.challenges.length).toBeGreaterThan(base.challenges.length);
    // old ids are all still present, unchanged
    for (const c of base.challenges) expect(res.spec.challenges.find((x) => x.id === c.id)).toEqual(c);
    for (const m of base.missions) expect(res.spec.missions.some((x) => x.id === m.id)).toBe(true);
    // the last old area got a portal to the new one
    expect(res.spec.areas[base.areas.length - 1]!.portal?.toAreaId).toBe(res.spec.areas[base.areas.length]!.id);
    expect(crossCheck(res.spec).errors).toEqual([]);
  });

  it("renames colliding ids and rewrites their references", () => {
    const base = validDemoSpec();
    const built = buildDemoExtension({ ...base, meta: { ...base.meta, generator: { kind: "demo", provider: "demo", model: "templates", templateId: "programming", mode: "FULL", generatedAt: "x" } } }, request({ mode: "EXTEND" }))!;
    const ext = extensionSchema.parse(built.ext);
    // force a collision with existing ids
    ext.challenges[0]!.id = base.challenges[0]!.id;
    ext.areas[0]!.stations[0]!.challengeId = base.challenges[0]!.id;
    ext.missions[0]!.objectives = ext.missions[0]!.objectives.map((o) => (o.type === "solve" ? { ...o, challengeIds: [base.challenges[0]!.id, ...o.challengeIds.slice(1)] } : o));
    const merged = mergeExtension(base, ext);
    const res = validateGameSpec(merged.raw);
    if (!res.ok) throw new Error(res.errors.join("\n"));
    expect(merged.notes.join(" ")).toMatch(/renamed challenge/);
    expect(res.spec.challenges.filter((c) => c.id === base.challenges[0]!.id)).toHaveLength(1);
  });

  it("is exhausted gracefully when no more demo extensions exist", () => {
    const base = validDemoSpec();
    const spec = { ...base, meta: { ...base.meta, generator: { kind: "demo" as const, provider: "demo", model: "templates", templateId: "programming", mode: "FULL" as const, generatedAt: "x" } } };
    const first = buildDemoExtension(spec, request({ mode: "EXTEND" }))!;
    const merged = validateGameSpec(mergeExtension(spec, extensionSchema.parse(first.ext)).raw);
    if (!merged.ok) throw new Error("merge invalid");
    expect(buildDemoExtension({ ...merged.spec, meta: { ...merged.spec.meta, generator: spec.meta.generator } }, request({ mode: "EXTEND" }))).toBeNull();
  });
});

describe("every demo template supports Extend Existing Game", () => {
  for (const pack of DEMO_PACKS) {
    for (const lang of ["en", "he"] as const) {
      it(`${pack.id}/${lang}: all pre-written extensions merge into a valid game, one after another`, () => {
        let spec = validDemoSpec({ subject: PACK_SUBJECT[pack.id]!, contentLanguage: lang, mode: "FULL" });
        const generator = { kind: "demo" as const, provider: "demo", model: "templates", templateId: pack.id, mode: "FULL" as const, generatedAt: "x" };
        let merged = 0;
        for (let i = 0; i < 4; i++) {
          const built = buildDemoExtension({ ...spec, meta: { ...spec.meta, generator } }, request({ mode: "EXTEND", contentLanguage: lang }));
          if (!built) break;
          const res = validateGameSpec(mergeExtension(spec, extensionSchema.parse(built.ext)).raw);
          if (!res.ok) throw new Error(res.errors.join("\n"));
          expect(res.spec.areas.length).toBe(spec.areas.length + 1);
          spec = res.spec;
          merged++;
        }
        expect(merged).toBeGreaterThanOrEqual(1);
      });
    }
  }
});

describe("template selection is honest about what the demo can and cannot do", () => {
  it("selects each template from subject keywords in English and Hebrew", () => {
    const cases: [string, string][] = [
      ["Python loops", "programming"], ["תכנות בפייתון", "programming"], ["fractions", "math"], ["אלגברה", "math"],
      ["photosynthesis and the food chain", "science"], ["פיזיקה", "science"], ["Ancient Egypt", "history"], ["היסטוריה של מצרים", "history"],
      ["Spanish greetings", "language"], ["ספרדית למתחילים", "language"],
    ];
    for (const [subject, id] of cases) expect(matchPack(subject)?.id, subject).toBe(id);
  });

  it("when no template matches, the game says so instead of pretending to be about the typed subject", () => {
    expect(matchPack("underwater basket weaving")).toBeNull();
    const req = request({ subject: "underwater basket weaving", learningGoal: "weave baskets", mode: "FAST", gameType: "simulation" });
    const { raw, templateId, notes } = buildDemoSpec(req);
    expect(templateId).toBe("science"); // the closest template for a simulation
    const res = validateGameSpec(raw, { alignGameType: "simulation" });
    if (!res.ok) throw new Error(res.errors.join("\n"));
    expect(res.spec.meta.title).not.toContain("basket");
    expect(res.spec.meta.subject).not.toContain("basket");
    expect(res.spec.learning.goal).not.toContain("weave");
    expect(notes.join(" ")).toMatch(/No demo template matches “underwater basket weaving”/);
  });

  it("when a template matches, the typed subject and goal are kept and the template scope is stated", () => {
    const { raw, notes } = buildDemoSpec(request({ subject: "Python decorators", learningGoal: "Understand decorators" }));
    const res = validateGameSpec(raw);
    if (!res.ok) throw new Error(res.errors.join("\n"));
    expect(res.spec.meta.subject).toBe("Python decorators");
    expect(notes.join(" ")).toMatch(/Template used/);
  });
});
