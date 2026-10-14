import { describe, expect, it } from "vitest";
import { buildMaterialSpec } from "@/lib/game/material/build";
import { distinctStart } from "@/lib/game/material/text";
import { generationRequestSchema } from "@/lib/schemas/generation";
import { generateOffline } from "@/lib/offline/generate";
import { TOPICS } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { TopicContent } from "@/lib/game/topics/types";
import { allFixtures } from "./material-quality";

/**
 * Learning-quality regressions found by reading generated games the way a student does: hints that do not tell the options
 * apart, wrong options that give themselves away by grammar or capital letters (or are also right), and options of the wrong kind.
 */
type Raw = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
interface Opt { id: string; text: string }

const material = (f: { subject: string; text: string; lang: "he" | "en" }, mode: "FAST" | "FULL" = "FULL") =>
  buildMaterialSpec(generationRequestSchema.parse({ mode, subject: f.subject, learningGoal: f.subject, difficulty: "beginner", gameType: "adventure", contentLanguage: f.lang, material: f.text })).raw;

const gamesOf = (): { id: string; challenges: Raw[]; text: string }[] =>
  allFixtures().flatMap((f) => {
    try { return [{ id: f.id, challenges: material(f).challenges as Raw[], text: f.text }]; } catch { return []; }
  });

const choices = (cs: Raw[]) => cs.filter((c) => c.type === "choice").map((c) => ({ c, options: c.options as Opt[], right: (c.options as Opt[]).find((o) => o.id === c.correctOptionId)! }));

/** "It starts with “X”." (English or Hebrew, material or topic wording) → X. */
const claimedStart = (hint: unknown): string | null => {
  const h = String(hint ?? "");
  const m = /^(?:It|The answer) starts with “(.+)”\.$|(?:starts with|זה מתחיל באותיות|זה מתחיל באות|הוא מתחיל ב|התשובה מתחילה באותיות|התשובה מתחילה באות)\s*[״“](.+)[״”]\.$/u.exec(h);
  return !m || /second|third|fourth|word|letters and/.test(h) ? null : (m[1] ?? m[2] ?? null);
};

describe("hints that tell the options apart", () => {
  it("distinctStart: shortest start no other option shares, a later word when the first words match, else null", () => {
    expect(distinctStart("Space race", ["Satellite", "Orbit"])).toEqual({ at: 0, prefix: "Sp" });
    expect(distinctStart("Orbit", ["Satellite", "Space race"])).toEqual({ at: 0, prefix: "O" });
    expect(distinctStart("מכנה", ["מונה", "שבר"])).toEqual({ at: 0, prefix: "מכ" });
    expect(distinctStart("מעי דק", ["מעי גס", "קיבה"])).toEqual({ at: 1, prefix: "ד" });
    expect(distinctStart("cat", ["cat"])).toBeNull();
  });

  it("study engine: a “starts with” hint never fits a wrong option as well (all fixtures, both languages)", () => {
    let seen = 0;
    for (const g of gamesOf()) {
      for (const { c, options, right } of choices(g.challenges)) {
        const start = claimedStart(c.hint);
        if (!start || /^(?:The missing|במילה החסרה|בשם החסר)/.test(String(c.hint))) continue;
        seen++;
        for (const o of options) if (o !== right) expect(o.text.toLowerCase().startsWith(start.toLowerCase()), `${g.id}: "${c.hint}" fits "${o.text}" too (${c.prompt})`).toBe(false);
      }
    }
    expect(seen).toBeGreaterThan(20);
  });

  it("study engine: the history notes get “Sp” for Space race (Satellite also starts with S)", () => {
    const f = allFixtures().find((x) => x.id === "en-history")!;
    const hints = choices(material(f).challenges).filter((x) => x.right.text === "Space race" && /^Which term/.test(String(x.c.prompt))).map((x) => x.c.hint);
    expect(hints.length).toBeGreaterThan(0);
    for (const h of hints) expect(h).not.toBe("It starts with “S”.");
  });

  it("topic library: the “starts with” hint of every term question fits the right option only", async () => {
    let seen = 0;
    for (const t of TOPICS) {
      const content = (await loadTopicContent(t.id)) as TopicContent;
      for (const lang of ["en", "he"] as const) {
        const spec = generateOffline({ mode: "FULL", subject: "x", learningGoal: "y", difficulty: "beginner", gameType: "adventure", contentLanguage: lang, topicId: t.id } as never, new Date(0), "A", content).spec;
        for (const { c, options, right } of choices(spec.challenges as unknown as Raw[])) {
          const start = claimedStart(c.hint);
          if (!start) continue;
          seen++;
          for (const o of options) if (o !== right) expect(o.text.toLowerCase().startsWith(start.toLowerCase()), `${t.id}/${lang}: "${c.hint}" fits "${o.text}" too`).toBe(false);
        }
      }
    }
    expect(seen).toBeGreaterThan(20);
  });
});

describe("wrong options do not give themselves away", () => {
  const WORDS = /^Which (?:word|name) completes|^איזו מילה משלימה|^איזה שם משלים/;

  it("a gap's wrong words have the capital letter of the right one (no sentence-initial “Farmers” among “pharaohs”)", () => {
    let seen = 0;
    for (const g of gamesOf()) {
      for (const { c, options, right } of choices(g.challenges)) {
        if (!WORDS.test(String(c.prompt)) || /\p{Script=Hebrew}/u.test(right.text) || /^\p{Lu}/u.test(right.text)) continue;
        seen++;
        for (const o of options) expect(/^\p{Lu}\p{Ll}/u.test(o.text), `${g.id}: "${o.text}" next to "${right.text}"`).toBe(false);
      }
    }
    expect(seen).toBeGreaterThan(5);
  });

  it("changed statements keep the article of the sentence (“a Argument” gave the answer away)", () => {
    const f = allFixtures().find((x) => x.id === "en-mixed-long")!;
    const text = f.text;
    const spec = material(f);
    for (const { c, options } of choices(spec.challenges as Raw[])) {
      for (const o of options) {
        for (const m of o.text.matchAll(/\b(a|an) (\p{L}+)/giu)) {
          const vowel = /^[aeiou]/i.test(m[2]!);
          const ok = m[1]!.toLowerCase() === (vowel ? "an" : "a") || text.toLowerCase().includes(m[0].toLowerCase());
          expect(ok, `"${o.text}" (${c.prompt})`).toBe(true);
        }
        // names of the terms keep their lower case inside a sentence
        expect(/ (?:a|an|the) [A-Z][a-z]+ /.test(o.text) && !text.includes(o.text), `"${o.text}"`).toBe(false);
      }
    }
  });

  it("unit words (“percent”, “million”…) are never offered as a wrong name, term or gap word", () => {
    const UNITS = new Set(["percent", "degrees", "million", "billion", "thousand", "hundred", "kilometres", "minutes", "hours", "years", "times"]);
    for (const g of gamesOf()) {
      for (const { c, options, right } of choices(g.challenges)) {
        if (/^\d/.test(right.text) || UNITS.has(right.text.toLowerCase())) continue;
        if (!/^Which (?:term|word|name)/.test(String(c.prompt))) continue;
        for (const o of options) expect(UNITS.has(o.text.toLowerCase()), `${g.id}: "${o.text}" (${c.prompt})`).toBe(false);
      }
    }
  });

  it("a number is swapped only for numbers of the same kind (29 years never becomes 150 years because of 150 million km)", () => {
    const f = allFixtures().find((x) => x.id === "en-numbers")!;
    const spec = material(f);
    const source = f.text;
    const perUnit = (unit: string) => new Set([...source.matchAll(new RegExp(`(\\d[\\d.,]*)\\s+${unit}\\b`, "g"))].map((m) => m[1]));
    const million = perUnit("million"), years = perUnit("years");
    let seen = 0;
    for (const { options, right } of choices(spec.challenges as Raw[])) {
      for (const o of options) {
        if (o === right) continue;
        const m = /(\d[\d.,]*) (million|years)\b/.exec(o.text);
        if (!m) continue;
        seen++;
        // a wrong number taken from the notes must come from a fact with the same unit
        const other = m[2] === "years" ? million : years;
        expect(other.has(m[1]!) && !(m[2] === "years" ? years : million).has(m[1]!), `"${o.text}"`).toBe(false);
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it("a question's wrong option that shares a key word with the answer (“sun's heat” beside “the energy of the sun”) is not offered", () => {
    const f = allFixtures().find((x) => x.id === "en-water")!;
    const q = choices(material(f).challenges).find((x) => x.c.prompt === "What powers the water cycle?");
    expect(q).toBeDefined();
    for (const o of q!.options) if (o !== q!.right) expect(/\bsun/i.test(o.text), o.text).toBe(false);
  });
});

describe("topic library: options of the right kind", () => {
  const BARE = /^(?:both|neither|none of them|none of the above|all of the above|שניהם|אף אחד|אף אחת|כל התשובות נכונות)$/i;

  it("no wrong option is a bare “Both / Neither / None of them”", async () => {
    for (const t of TOPICS) {
      const c = (await loadTopicContent(t.id)) as TopicContent;
      for (const l of ["b", "i", "a"] as const) {
        for (const pair of c[l].q ?? []) {
          for (const [q, , wrong] of pair) {
            for (const w of wrong) expect(BARE.test(w.trim()), `${t.id}/${l}: ${q} → "${w}"`).toBe(false);
          }
        }
      }
    }
  });

  it("both languages ask the same thing: the herbivore question names the same chain and has no “none of them”", async () => {
    const c = (await loadTopicContent("science-food-chains")) as TopicContent;
    const pair = c.b.q!.find(([en]) => /herbivore/.test(en[0]))!;
    expect(pair[1][0]).toContain("ארנב");
    expect(pair[1][2].some((o) => /אף אחד/.test(o))).toBe(false);
  });
});

