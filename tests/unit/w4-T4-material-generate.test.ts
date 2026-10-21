import { describe, expect, it } from "vitest";
import { MaterialError, buildMaterialSpec, pickCategory, pickEnvironment } from "@/lib/game/material/build";
import { generateChallenges, type ChallengeKind } from "@/lib/game/material/challenges";
import { parseMaterial } from "@/lib/game/material/parse";
import { sanitizeMaterial } from "@/lib/game/material/text";
import { gradeAnswer } from "@/lib/game/challenges/grade";
import { challengeSchema } from "@/lib/game/spec/schema";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { mulberry32 } from "@/lib/game/util/prng";
import { generationRequestSchema, type GenerationRequest } from "@/lib/schemas/generation";
import { correctAnswer, wrongAnswer } from "./helpers";
import { allFixtures } from "./material-quality";

/**
 * The study engine's output contract: what `generateChallenges` hands to the game builder and how `buildMaterialSpec` puts it
 * into areas and missions. The question *quality* is covered by material-quality.test.ts; this is about structure and limits.
 */

type Raw = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const fixtures = allFixtures();
const fixture = (id: string) => fixtures.find((f) => f.id === id)!;
const generate = (text: string, lang: "en" | "he", over: Partial<Parameters<typeof generateChallenges>[1]> = {}) =>
  generateChallenges(parseMaterial(sanitizeMaterial(text)), { lang, rnd: mulberry32(1), max: 10, ...over });

const TYPE_OF_KIND: Record<ChallengeKind, string[]> = {
  qa: ["choice", "numeric"], match: ["match"], term: ["choice"], define: ["choice"], cloze: ["choice"], steps: ["sequence"], next: ["choice"],
  number: ["numeric"], truefalse: ["choice"], factpick: ["choice"], statement: ["choice"], odd: ["choice"], timeline: ["sequence"],
};

describe("generateChallenges: the contract of its output", () => {
  it("every challenge of every fixture, in both languages and at every size, is a valid spec challenge within the size asked for", () => {
    let games = 0;
    for (const f of fixtures) {
      for (const lang of ["en", "he"] as const) {
        for (const max of [0, 1, 3, 4, 6, 10]) {
          const g = generate(f.text, lang, { max, idPrefix: "x9-", variants: true });
          games++;
          const label = `${f.id}/${lang}/max ${max}`;
          expect(g.challenges.length, label).toBeLessThanOrEqual(max);
          // 4 and 10 are the sizes of the fast and the full game, 6 the room an extension has: those go through the whole schema
          if (max !== 4 && max !== 10 && max !== 6) continue;
          for (const c of [...g.challenges, ...g.variants]) {
            const parsed = challengeSchema.safeParse(c);
            expect(parsed.success, `${label} ${String(c.id)}: ${parsed.success ? "" : JSON.stringify(parsed.error.issues[0])}`).toBe(true);
          }
        }
      }
    }
    expect(games).toBeGreaterThan(250);
  });

  it("ids run c-1, c-2… behind the prefix, the objectives named are the ones used, and the counts add up", () => {
    for (const f of fixtures) {
      for (const idPrefix of ["", "x2-"]) {
        const g = generate(f.text, "en", { idPrefix, variants: true });
        const n = g.challenges.length;
        expect(g.challenges.map((c) => c.id), f.id).toEqual(Array.from({ length: n }, (_, i) => `${idPrefix}c-${i + 1}`));
        const objectiveIds = g.objectives.map((o) => o.id);
        expect(new Set(objectiveIds).size, f.id).toBe(objectiveIds.length);
        const used = new Set(g.challenges.map((c) => String(c.objectiveId)));
        expect([...used].sort(), f.id).toEqual([...objectiveIds].sort());
        for (const id of objectiveIds) expect(id.startsWith(`${idPrefix}o-`), id).toBe(true);
        expect(g.kinds, f.id).toHaveLength(n);
        expect(g.concepts, f.id).toHaveLength(n);
        expect(Object.values(g.counts).reduce((a, b) => a + b, 0), f.id).toBe(n);
        g.kinds.forEach((kind, i) => {
          expect(TYPE_OF_KIND[kind], `${f.id} ${g.challenges[i]!.id}: ${kind}`).toContain(String(g.challenges[i]!.type));
          expect(g.counts[kind], f.id).toBeGreaterThan(0);
        });
        for (const c of g.challenges) expect([1, 2, 3], `${f.id} ${String(c.id)}`).toContain(c.level);
      }
    }
  });

  it("is deterministic for one random source, and the prefix changes only the ids", () => {
    const f = fixture("en-history");
    const a = generate(f.text, "en");
    const b = generate(f.text, "en");
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const prefixed = generate(f.text, "en", { idPrefix: "x3-" });
    expect(JSON.stringify(prefixed.challenges).replaceAll("x3-", "")).toBe(JSON.stringify(a.challenges));
  });

  it("a game of six or more questions gets easier ones first and harder ones last", () => {
    const g = generate(fixture("en-history").text, "en", { max: 10 });
    expect(g.challenges.length).toBeGreaterThanOrEqual(6);
    const levels = g.challenges.map((c) => Number(c.level));
    expect(levels[0]).toBe(1);
    expect(levels[levels.length - 1]).toBe(3);
    // an ordering question never goes below level 2, which can put one early; the other questions only go up
    const others = g.challenges.filter((c) => c.type !== "sequence").map((c) => Number(c.level));
    expect(others).toEqual([...others].sort((a, b) => a - b));
    for (const c of g.challenges) if (c.type === "sequence") expect(Number(c.level)).toBeGreaterThanOrEqual(2);
  });
});

describe("the easier versions of questions", () => {
  it("are only made when asked for, at most six, and every one is referenced by exactly the question it makes easier", () => {
    for (const f of fixtures) {
      const none = generate(f.text, "en");
      expect(none.variants, f.id).toEqual([]);
      for (const c of none.challenges) expect(c.easierId, `${f.id} ${String(c.id)}`).toBeUndefined();

      const g = generate(f.text, "en", { variants: true });
      expect(g.variants.length, f.id).toBeLessThanOrEqual(6);
      const byId = new Map(g.challenges.map((c) => [String(c.id), c]));
      for (const v of g.variants) {
        const baseId = String(v.id).replace(/-easy$/, "");
        const base = byId.get(baseId)!;
        expect(base, `${f.id}: the base of ${String(v.id)}`).toBeDefined();
        expect(base.easierId, `${f.id}: ${baseId}`).toBe(v.id);
        expect(v.level, String(v.id)).toBe(1);
        expect(v.easierId, String(v.id)).toBeUndefined();
        expect(String(v.title), String(v.id)).toMatch(/\((?:easier|קל יותר)\)$/);
        expect(v.type, String(v.id)).toBe(base.type);
      }
      expect(new Set(g.variants.map((v) => v.id)).size, f.id).toBe(g.variants.length);
      // nothing but a made-easier question points at an easier version
      const pointed = g.challenges.filter((c) => c.easierId !== undefined);
      expect(pointed.map((c) => c.easierId).sort(), f.id).toEqual(g.variants.map((v) => v.id).sort());
    }
  });

  it("a multiple-choice question keeps its right option and one wrong one; an ordering keeps its first, a middle and its last item in order", () => {
    for (const f of fixtures) {
      const g = generate(f.text, "he", { variants: true });
      const byId = new Map(g.challenges.map((c) => [String(c.id), c]));
      for (const v of g.variants) {
        const base = byId.get(String(v.id).replace(/-easy$/, ""))!;
        if (v.type === "choice") {
          const options = v.options as { id: string; text: string }[];
          expect(options, String(v.id)).toHaveLength(2);
          expect(v.correctOptionId, String(v.id)).toBe(base.correctOptionId);
          expect(options.some((o) => o.id === v.correctOptionId), String(v.id)).toBe(true);
          const baseTexts = (base.options as { id: string; text: string }[]).map((o) => o.text);
          for (const o of options) expect(baseTexts, String(v.id)).toContain(o.text);
        } else if (v.type === "sequence") {
          const items = v.items as { id: string; text: string }[];
          const baseItems = base.items as { id: string; text: string }[];
          expect(items, String(v.id)).toHaveLength(3);
          expect(items.map((i) => i.id), String(v.id)).toEqual([baseItems[0]!.id, baseItems[Math.floor((baseItems.length - 1) / 2)]!.id, baseItems[baseItems.length - 1]!.id]);
        }
      }
    }
  });
});

describe("a glossary is cut into matching questions of three to five pairs, and no term is lost", () => {
  const glossary = (n: number) =>
    Array.from({ length: n }, (_, i) => {
      // every term and every description is made of words of its own, so nothing is ruled out as a look-alike
      const w = ["Zorb", "Quillon", "Fandrel", "Mirlo", "Taskent", "Brevet", "Oxter", "Plinth", "Kestrel", "Yarrow", "Gimlet", "Havoc", "Dorado", "Ember", "Wicket", "Larkin"][i]!;
      const d = ["scarlet banners", "violet harbours", "amber orchards", "silver tunnels", "golden canyons", "crimson meadows", "emerald glaciers", "bronze lighthouses", "ivory fountains", "cobalt marshes", "jade bridges", "coral deserts", "onyx caverns", "pearl valleys", "ruby islands", "topaz forests"][i]!;
      return `${w}: a place of ${d} known to travellers`;
    }).join("\n");

  it("for 3 to 16 terms: only pairs of the glossary, each group of 3 to 5, every term in one group", () => {
    for (let n = 3; n <= 16; n++) {
      const g = generate(glossary(n), "en", { max: 24 });
      const matches = g.challenges.filter((c) => c.type === "match");
      expect(matches.length, `${n} terms`).toBeGreaterThanOrEqual(1);
      const lefts: string[] = [];
      for (const m of matches) {
        const pairs = m.pairs as { left: string; right: string }[];
        expect(pairs.length, `${n} terms`).toBeGreaterThanOrEqual(3);
        expect(pairs.length, `${n} terms`).toBeLessThanOrEqual(5);
        lefts.push(...pairs.map((p) => p.left));
      }
      expect(new Set(lefts).size, `${n} terms: no term twice`).toBe(lefts.length);
      expect(lefts.length, `${n} terms: every term is in a matching question`).toBe(n);
    }
  });
});

describe("buildMaterialSpec: how the questions become a game", () => {
  const request = (f: { subject: string; text: string; lang: string }, over: Record<string, unknown> = {}): GenerationRequest =>
    generationRequestSchema.parse({ mode: "FULL", subject: f.subject, learningGoal: f.subject, difficulty: "beginner", gameType: "adventure", contentLanguage: f.lang, material: f.text, ...over });
  const build = (id: string, over: Record<string, unknown> = {}) => buildMaterialSpec(request(fixture(id), over));
  const stations = (area: Raw) => area.stations as Raw[];

  it("a full game with enough material has two areas joined by a portal; every question stands at exactly one station", () => {
    const { raw } = build("en-history");
    expect(raw.areas).toHaveLength(2);
    const main = (raw.challenges as Raw[]).filter((c) => !String(c.id).endsWith("-easy"));
    const placed = (raw.areas as Raw[]).flatMap((a) => stations(a).filter((s) => s.kind === "challenge").map((s) => String(s.challengeId)));
    expect(placed.sort()).toEqual(main.map((c) => String(c.id)).sort());
    expect(new Set(placed).size).toBe(placed.length);
    // the second area comes after the first, and the first points at it
    expect(raw.areas[0].portal).toMatchObject({ toAreaId: raw.areas[1].id, requiresMissionIds: ["m-1-2"] });
    expect(raw.areas[1].portal).toBeUndefined();
    expect(raw.mechanics).toContain("portals");
    // the notes station is in the last area only, and only that area has the "read the notes" objective
    expect(stations(raw.areas[0]).some((s) => s.kind === "lore")).toBe(false);
    expect(stations(raw.areas[1]).filter((s) => s.kind === "lore")).toHaveLength(1);
    const visits = (raw.missions as Raw[]).flatMap((m) => (m.objectives as Raw[]).filter((o) => o.type === "visit"));
    expect(visits).toHaveLength(1);
    expect(visits[0]!.stationIds).toEqual([stations(raw.areas[1]).find((s) => s.kind === "lore")!.id]);
  });

  it("missions follow one another: warm up, go deeper, then the next area's warm up", () => {
    const { raw } = build("en-history");
    const missions = raw.missions as Raw[];
    expect(missions.map((m) => m.id)).toEqual(["m-1-1", "m-1-2", "m-2-1", "m-2-2"]);
    expect(missions.map((m) => m.requires)).toEqual([[], ["m-1-1"], ["m-1-2"], ["m-2-1"]]);
    // every question is a "solve" target of exactly one mission, so none can be skipped and none is asked twice
    const targets = missions.flatMap((m) => (m.objectives as Raw[]).filter((o) => o.type === "solve").flatMap((o) => o.challengeIds as string[]));
    const main = (raw.challenges as Raw[]).filter((c) => !String(c.id).endsWith("-easy")).map((c) => String(c.id));
    expect([...targets].sort()).toEqual([...main].sort());
  });

  it("the fast game is one area of at most four questions, with no portal", () => {
    const { raw } = build("en-history", { mode: "FAST" });
    expect(raw.areas).toHaveLength(1);
    expect(raw.areas[0].portal).toBeUndefined();
    expect(raw.mechanics).not.toContain("portals");
    expect(stations(raw.areas[0]).filter((s) => s.kind === "challenge").length).toBeLessThanOrEqual(4);
    expect(stations(raw.areas[0]).some((s) => s.kind === "lore")).toBe(true);
    expect((raw.missions as Raw[]).map((m) => m.id)).toEqual(["m-1-1", "m-1-2"]);
  });

  it("a full game with material for fewer than six questions stays one area and says so", () => {
    const small = build("he-steps-only");
    expect(small.raw.areas).toHaveLength(1);
    expect(small.notes.join("\n")).toMatch(/לא היה מספיק חומר לאזור שני/);
    const en = buildMaterialSpec(request({ subject: "Boiling an egg", lang: "en", text: "How to boil an egg:\n1. Fill a pot with water\n2. Bring the water to the boil\n3. Lower the egg in for seven minutes\n4. Cool the egg in cold water" }));
    expect(en.raw.areas).toHaveLength(1);
    expect(en.notes.join("\n")).toContain("not enough material for a second area");
  });

  it("the easier versions are in the game's challenges (for the adaptive difficulty) but on no station, and the game says it adapts", () => {
    const { raw } = build("en-history");
    const easy = (raw.challenges as Raw[]).filter((c) => String(c.id).endsWith("-easy"));
    expect(easy.length).toBeGreaterThan(0);
    const placed = new Set((raw.areas as Raw[]).flatMap((a) => stations(a).map((s) => s.challengeId)));
    for (const c of easy) expect(placed.has(c.id)).toBe(false);
    expect(raw.mechanics).toContain("adaptive_difficulty");
  });

  it("the facts of the game are the facts of the request: title, subject, language, length", () => {
    const en = build("en-water").raw;
    expect(en.meta).toMatchObject({ language: "en", subject: fixture("en-water").subject, gameType: "adventure", difficulty: "beginner" });
    expect(en.meta.title).toBe(`Study Quest: ${fixture("en-water").subject}`);
    const he = build("he-water").raw;
    expect(he.meta.language).toBe("he");
    expect(he.meta.title).toBe(`משימת למידה: ${fixture("he-water").subject}`);
    const placed = (en.challenges as Raw[]).filter((c) => !String(c.id).endsWith("-easy")).length;
    expect(en.meta.estimatedMinutes).toBe(Math.max(4, Math.min(40, placed * 2 + 2)));
    expect(en.meta.tagline).toContain(`${placed} questions`);
  });

  it("says in the notes what was found and what was made, and that this is not AI", () => {
    const { notes, stats, raw } = build("en-history");
    expect(notes.join("\n")).toMatch(/not by AI/);
    expect(notes.join("\n")).toContain(`made ${stats.challenges} challenge(s)`);
    expect(stats.challenges).toBe((raw.challenges as Raw[]).filter((c) => !String(c.id).endsWith("-easy")).length);
  });

  it("a content language the interface has no wording for is built in English, and the notes say so", () => {
    const { raw, notes } = build("en-history", { contentLanguage: "es" });
    expect(raw.meta.language).toBe("en");
    expect(notes.join("\n")).toContain('"es" was requested');
    expect(JSON.stringify(raw.areas)).not.toMatch(/\p{Script=Hebrew}/u);
  });
});

describe("random notes: a valid, playable game or a polite refusal, never anything else", () => {
  // shapes people write, mixed at random: definitions, bullets, facts, dates, steps, quizzes, tables, vocabulary, noise
  const lines = [
    "Mitosis: the process of cell division that makes two identical cells.",
    "Meiosis: the process that makes sex cells with half the chromosomes.",
    "Osmosis: the movement of water through a membrane from low to high concentration.",
    "- Venus - the hottest planet because of its thick atmosphere",
    "- Mercury - the smallest planet and the closest to the sun",
    "* Earth = the only planet known to have life on it",
    "• פה – המקום שבו מתחיל העיכול והמזון נלעס",
    "• ושט – צינור שמוביל את המזון מהפה אל הקיבה",
    "• קיבה – שק שרירי שבו המזון מתערבב עם חומצה",
    "הלב הוא שריר שמזרים דם לכל הגוף והוא פועם כשבעים פעמים בדקה.",
    "The sun holds 99.8 percent of the mass of the solar system.",
    "The first moon landing was in 1969 and it was watched by millions of people.",
    "In 1948 the state was declared after a long and difficult period of struggle.",
    "In 1492 Columbus crossed the Atlantic ocean with three ships from Spain.",
    "The temperature fell to -30 degrees at night in the northern winter season.",
    "How to boil an egg:",
    "1. Fill a pot with water",
    "2. Bring the water to the boil",
    "3. Lower the egg in for seven minutes",
    "4) Cool it down in cold water",
    "Q: How many moons does Mars have?",
    "A: 2",
    "What is the capital of France? Paris",
    "What is the capital of Italy? Rome",
    "Which planet is the largest?",
    "A) Venus",
    "B) Jupiter",
    "C) Mars",
    "Answer: B",
    "# A heading",
    "| Planet | Moons |",
    "| --- | --- |",
    "| Mars | 2 |",
    "| Jupiter | 95 |",
    "hola = hello",
    "gato = cat",
    "perro = dog",
    "casa = house",
    "**Bold** statements are only text styled with two stars in the notes.",
    "",
    "💧 Water covers most of the surface of the Earth, as the oceans are very big.",
    "x = 3",
    "...",
    "|",
    "מספר 3,500 הוא גדול מ-100 ומ-2,000 גם יחד בכל מקרה.",
    "Photosynthesis happens in the chloroplasts of the leaves of green plants.",
    "The mitochondria produce most of the energy that the cell needs to live.",
  ];

  it("120 random notes, every game type, both modes and both languages", () => {
    const rnd = mulberry32(21);
    const types = ["adventure", "puzzle", "platformer", "exploration", "simulation"] as const;
    let built = 0;
    for (let n = 0; n < 120; n++) {
      const text = Array.from({ length: 4 + Math.floor(rnd() * 24) }, () => lines[Math.floor(rnd() * lines.length)]!).join(rnd() < 0.2 ? "\n\n" : "\n");
      const req = generationRequestSchema.parse({
        mode: rnd() < 0.5 ? "FULL" : "FAST", subject: "Notes", learningGoal: "Learn the notes", difficulty: "beginner", gameType: types[Math.floor(rnd() * types.length)]!,
        contentLanguage: rnd() < 0.5 ? "en" : "he", material: text,
      });
      let raw: Raw;
      try {
        raw = buildMaterialSpec(req).raw;
      } catch (e) {
        expect(e, JSON.stringify(text)).toBeInstanceOf(MaterialError); // a refusal is the only way out
        continue;
      }
      built++;
      const res = validateGameSpec(raw, { alignGameType: req.gameType });
      expect(res.ok, `${JSON.stringify(text)}: ${res.ok ? "" : res.errors.slice(0, 3).join("; ")}`).toBe(true);
      if (!res.ok) continue;
      for (const c of res.spec.challenges) {
        expect(gradeAnswer(c, correctAnswer(c), req.contentLanguage).correct, `${c.id} right answer`).toBe(true);
        expect(gradeAnswer(c, wrongAnswer(c), req.contentLanguage).correct, `${c.id} wrong answer`).toBe(false);
      }
    }
    expect(built).toBeGreaterThan(90);
  });
});

describe("what the engine refuses", () => {
  const request = (material: string, lang: "en" | "he"): GenerationRequest =>
    generationRequestSchema.parse({ mode: "FULL", subject: "Notes", learningGoal: "Learn", difficulty: "beginner", gameType: "adventure", contentLanguage: lang, material });

  it("text too short for a game is refused as TOO_SHORT in the learner's language, before anything is parsed", () => {
    for (const material of ["x".repeat(59), `${"x".repeat(30)}\n\n\n${" ".repeat(40)}`]) {
      const err = (() => { try { buildMaterialSpec(request(material, "he")); } catch (e) { return e; } })();
      expect(err).toBeInstanceOf(MaterialError);
      expect((err as MaterialError).code).toBe("TOO_SHORT");
      expect((err as MaterialError).userMessage("he")).toMatch(/\p{Script=Hebrew}/u);
      expect((err as MaterialError).userMessage("en")).toBe((err as Error).message);
    }
  });

  it("text that is long enough but holds less than three questions is refused as TOO_LITTLE, telling how many there were", () => {
    const err = (() => { try { buildMaterialSpec(request("This is a long line of notes that goes on, but it holds nothing a question can be built from at all.", "en")); } catch (e) { return e; } })();
    expect(err).toBeInstanceOf(MaterialError);
    expect((err as MaterialError).code).toBe("TOO_LITTLE");
    expect((err as MaterialError).message).toMatch(/only has enough for \d question\(s\); a game needs at least 3/);
  });
});

describe("the subject's world", () => {
  it("picks the category from the words of the subject, plurals and any case; unknown subjects are 'other'", () => {
    const cases: [string, string][] = [
      ["Python loops", "programming"], ["JavaScript", "programming"], ["Algorithms", "programming"], ["fractions", "math"], ["Algebra", "math"],
      ["Planets and stars", "science"], ["The human cell", "science"], ["Photosynthesis", "science"], ["Ancient Egypt", "history"], ["The French Revolution", "history"],
      ["Spanish vocabulary", "language"], ["English grammar", "language"], ["Cooking", "other"], ["", "other"],
      ["תכנות בפייתון", "programming"], ["היסטוריה של עם ישראל", "history"], ["דקדוק עברי", "language"], ["התא החי", "science"], ["חשבון", "math"],
    ];
    for (const [subject, category] of cases) expect(pickCategory(subject), subject).toBe(category);
  });

  it("matches whole English words, not pieces of them ('decoding' is no coding)", () => {
    expect(pickCategory("decoding")).toBe("other");
    expect(pickCategory("scellular")).toBe("other");
    expect(pickEnvironment("seashells", "adventure")).toBe("forest");
  });

  it("the subject decides the world; a subject that names none gets a calm daylight one by game type", () => {
    expect(pickEnvironment("Coral reefs", "adventure")).toBe("ocean-floor");
    expect(pickEnvironment("The solar system", "adventure")).toBe("space-station");
    expect(pickEnvironment("Ancient Egypt", "adventure")).toBe("desert-ruins");
    expect(pickEnvironment("Python loops", "adventure")).toBe("neon-city");
    expect(pickEnvironment("Medieval castles", "adventure")).toBe("castle");
    expect(pickEnvironment("תכנות בפייתון", "adventure")).toBe("neon-city");
    expect(pickEnvironment("התא החי", "adventure")).toBe("laboratory");
    expect(pickEnvironment("Cooking", "exploration")).toBe("forest");
    expect(pickEnvironment("Cooking", "puzzle")).toBe("castle");
    expect(pickEnvironment("Cooking", "platformer")).toBe("sky-islands");
    expect(pickEnvironment("Cooking", "simulation")).toBe("laboratory");
    expect(pickEnvironment("Cooking", "adventure")).toBe("forest");
  });

  // BUG (src/lib/game/material/build.ts, CATEGORY and ENV): the Hebrew words are matched as plain substrings with no word boundary, so
  // "ים" (sea) matches inside every plural in -ים, "תא" (cell) inside "מתאים", "עץ" (tree) inside "עצמאות", "מחשב" inside "מחשבה"…
  // Ancient Egypt ("מצרים העתיקה") is filed under science and played on the ocean floor, "הדבורים" (the bees) and "שברים" (fractions)
  // too, "אוצר מילים באנגלית" (English vocabulary) is science instead of language. Hebrew keywords need a letter boundary on both
  // sides, allowing the clitic prefixes ו ה ב כ ל מ ש in front (ים, הים, בים, מהים).
  it("a Hebrew subject is not taken for the sea (or a cell, a tree…) because a plural ends in -ים", () => {
    expect(pickCategory("מצרים העתיקה")).toBe("history");
    expect(pickEnvironment("מצרים העתיקה", "adventure")).toBe("desert-ruins");
    expect(pickEnvironment("הדבורים", "adventure")).toBe("forest");
    expect(pickEnvironment("שברים", "adventure")).not.toBe("ocean-floor");
    expect(pickCategory("אוצר מילים באנגלית")).toBe("language");
    expect(pickCategory("מספרים שלמים")).not.toBe("science");
    expect(pickEnvironment("מספרים שלמים", "adventure")).not.toBe("ocean-floor");
    expect(pickEnvironment("מתאים לכולם", "adventure")).not.toBe("ocean-floor");
    // …while the real thing is still the sea
    expect(pickEnvironment("הים התיכון", "adventure")).toBe("ocean-floor");
    expect(pickEnvironment("החיים באוקיינוס", "adventure")).toBe("ocean-floor");
  });
});
