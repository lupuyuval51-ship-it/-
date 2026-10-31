import { describe, expect, it } from "vitest";
import { MaterialError, buildMaterialSpec } from "@/lib/game/material/build";
import { generateChallenges } from "@/lib/game/material/challenges";
import { parseMaterial } from "@/lib/game/material/parse";
import { sanitizeMaterial } from "@/lib/game/material/text";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { mulberry32 } from "@/lib/game/util/prng";
import { generationRequestSchema } from "@/lib/schemas/generation";
import { MESSY } from "./material-fixtures";
import { buildAll, measure } from "./material-quality";

const req = (material: string, over: Record<string, unknown> = {}) =>
  generationRequestSchema.parse({ mode: "FULL", subject: "Test", learningGoal: "Learn", difficulty: "beginner", gameType: "adventure", contentLanguage: "en", material, ...over });

describe("parser: messy notes", () => {
  it("drops emoji decoration and list lead-ins, and names a list of steps after its lead-in line", () => {
    const k = parseMaterial("💧 Water: the body needs about 8 glasses of water every day\nHow to find the largest number:\n1. Start with the first number\n2. Look at the next number\n3. Keep the larger one\nExamples:\nSleep: children need between 9 and 12 hours every night");
    expect(k.definitions.map((d) => d.term)).toEqual(["Water", "Sleep"]);
    expect(k.stepTitles).toEqual(["How to find the largest number"]);
    expect(k.all.some((s) => /:$/.test(s))).toBe(false);
  });

  it("reads a vocabulary list as short term/meaning pairs and builds a game from it", () => {
    const k = parseMaterial("apple - תפוח\nwater - מים\nhouse - בית\nbook - ספר\nteacher - מורה");
    expect(k.definitions).toHaveLength(5);
    expect(k.definitions.every((d) => d.short)).toBe(true);
    const built = buildMaterialSpec(req("hola = hello\nadiós = goodbye\ngracias = thank you\nagua = water\ncasa = house\nperro = dog\ngato = cat\nlibro = book", { subject: "Spanish" }));
    const res = validateGameSpec(built.raw, { alignGameType: "adventure" });
    if (!res.ok) throw new Error(res.errors.join("\n"));
    expect(res.spec.challenges.length).toBeGreaterThanOrEqual(5);
  });

  it("keeps a minus sign that stands alone, but not a hyphen", () => {
    const k = parseMaterial("The night temperature fell to -30 degrees in the winter.\nהמשחק נוצר ב-1991 על ידי חברה קטנה.");
    expect(k.facts.map((f) => f.value)).toEqual([-30, 1991]);
    expect(k.facts[0]!.blanked).toContain("to ___ degrees");
  });

  it("a line repeated many times is one idea", () => {
    const k = parseMaterial(`${"Bees make honey from nectar.\n".repeat(40)}Queen: the only bee that lays eggs in the hive.\nDrone: a male bee that mates with the queen.`);
    expect(k.all.filter((s) => s.startsWith("Bees make")).length).toBe(1);
    expect(k.keywords.find((x) => x.lower === "honey")!.count).toBe(1);
  });

  it("joins capitalised names, so they are swapped as a whole", () => {
    const k = parseMaterial("The United States and the Soviet Union fought together against Germany in the war.");
    expect(k.keywords.map((x) => x.text)).toEqual(expect.arrayContaining(["United States", "Soviet Union"]));
    expect(k.keywords.some((x) => x.lower === "united")).toBe(false);
  });
});

describe("question quality", () => {
  it("emoji never end up in the sanitised material", () => {
    expect(sanitizeMaterial("💧 Water 👨‍👩‍👧 is wet ✔️")).toBe("Water is wet");
  });

  it("a term is never asked with its own name written in the description", () => {
    const g = generateChallenges(parseMaterial("Water: the body needs about 8 glasses of water every day to stay hydrated.\nSleep: children aged 6 to 12 need between 9 and 12 hours of sleep every night.\nExercise: moving for 60 minutes a day keeps the heart strong.\nVegetables: they give the body vitamins and fibre."), { lang: "en", rnd: mulberry32(1), max: 12 });
    for (const c of g.challenges.filter((x) => /Which term matches/.test(String(x.prompt)))) {
      const right = (c.options as { id: string; text: string }[]).find((o) => o.id === c.correctOptionId)!.text.toLowerCase();
      expect(String(c.prompt).toLowerCase(), right).not.toContain(right);
    }
  });

  it("overlapping terms (Loop / For loop) are never offered side by side", () => {
    const g = generateChallenges(parseMaterial("Loop: code that repeats until a condition changes.\nFor loop: a loop that runs a fixed number of times.\nWhile loop: a loop that runs as long as a condition stays true.\nVariable: a named box that stores a value.\nFunction: a reusable block of code with a name."), { lang: "en", rnd: mulberry32(2), max: 12 });
    for (const c of g.challenges.filter((x) => /Which term matches/.test(String(x.prompt)))) {
      const options = c.options as { id: string; text: string }[];
      const right = options.find((o) => o.id === c.correctOptionId)!.text.toLowerCase();
      if (right.includes("loop")) expect(options.filter((o) => o.text.toLowerCase().includes("loop")).length, options.map((o) => o.text).join(" / ")).toBe(1);
    }
  });

  it("a Hebrew replacement never doubles the article", () => {
    for (const f of MESSY.filter((x) => x.lang === "he")) {
      try {
        const raw = buildMaterialSpec(req(f.text, { contentLanguage: "he", subject: f.subject })).raw;
        expect(JSON.stringify(raw)).not.toMatch(/של ההנ|ב-?ההנ|[^\p{L}]ההה/u);
      } catch (e) {
        if (!(e instanceof MaterialError)) throw e;
      }
    }
  });

  it("asks about one sentence at most twice, and a list of steps carries its name in the question", () => {
    const g = generateChallenges(parseMaterial(MESSY.find((x) => x.id === "he-bullets")!.text + "\nאיך מוצאים את המספר הגדול:\n1. מתחילים מהראשון.\n2. בודקים את הבא.\n3. מחליפים אם הוא גדול יותר."), { lang: "he", rnd: mulberry32(3), max: 10 });
    const seq = g.challenges.find((c) => c.type === "sequence")!;
    expect(String(seq.prompt)).toContain("איך מוצאים את המספר הגדול");
    const sources = g.challenges.map((c) => String(c.explanation));
    for (const s of sources) expect(sources.filter((x) => x === s).length).toBeLessThanOrEqual(2);
  });

  it("measured over clean and messy notes: no leaks, no junk, and guessers stay near chance", () => {
    const rep = measure(buildAll());
    expect(rep.games).toBeGreaterThanOrEqual(40);
    expect(rep.junk).toEqual([]);
    expect(rep.duplicateOptions).toEqual([]);
    // the only answer-in-question left is a learner-written "how many times does a loop over 7 items run? 7"
    expect(rep.leaks.filter((l) => !/numeric answer/.test(l))).toEqual([]);
    expect(rep.longestOption).toBeLessThan(rep.chance + 0.08);
    expect(rep.oddOneIn).toBeLessThan(rep.chance + 0.06);
    expect(rep.promptOverlap).toBeLessThan(rep.chance + 0.06);
  });
});

describe("robustness: odd input gives a valid game or a clear refusal", () => {
  const inputs: [string, string][] = [
    ["emoji only", "😀😀😀 ".repeat(60)],
    ["punctuation", "!!! ??? ... --- ".repeat(30)],
    ["one huge line", "word ".repeat(3000)],
    ["only numbers", Array.from({ length: 60 }, (_, i) => String(i * 37)).join("\n")],
    ["bidi marks", "‮שלום‬ עולם: זה מבחן של תווים מוזרים בתוך החומר\n".repeat(8)],
    ["repeated lines", "Sun: a star at the centre of the solar system.\n".repeat(80)],
    ["mixed scripts", "Δ delta: ένα γράμμα του αλφαβήτου μεγάλο\nРоссия: большая страна в Европе и Азии\n東京: 日本の首都であり大きな都市です\nمصر: دولة في شمال أفريقيا على نهر النيل\nFrance: a country in Western Europe with Paris"],
    ["huge", `${"Photosynthesis is the process plants use. Chlorophyll absorbs light 5 times. ".repeat(200)}`],
  ];
  for (const [name, text] of inputs) {
    it(name, () => {
      try {
        const built = buildMaterialSpec(req(text.slice(0, 8000)));
        const res = validateGameSpec(built.raw, { alignGameType: "adventure" });
        if (!res.ok) throw new Error(res.errors.join("\n"));
      } catch (e) {
        expect(e).toBeInstanceOf(MaterialError);
      }
    });
  }
});
