import { describe, expect, it } from "vitest";
import type { LevelContent, NumberItem, Question, TopicContent } from "@/lib/game/topics/types";
import sineCosineRules from "@/lib/game/topics/content/math-sine-cosine-rules";
import symmetry from "@/lib/game/topics/content/math-symmetry";
import time from "@/lib/game/topics/content/math-time";
import transformations from "@/lib/game/topics/content/math-transformations";
import lists from "@/lib/game/topics/content/prog-lists";
import scratch from "@/lib/game/topics/content/prog-scratch";
import acidsBases from "@/lib/game/topics/content/science-acids-bases";
import atoms from "@/lib/game/topics/content/science-atoms";
import moon from "@/lib/game/topics/content/science-moon";
import periodicTable from "@/lib/game/topics/content/science-periodic-table";

/**
 * Wave 5, F6: ten topics (sine and cosine rules, symmetry, time, transformations, Python lists, Scratch, acids and bases,
 * atoms, the Moon, the periodic table). A game shows most items of a level together, so no term, number prompt, ordering
 * step or other question of a level may spell out the answer of a choice question of that level. What was removed:
 * an ordering titled "Using the sine rule…" (the rule for two angles and a side), symmetry terms that defined a line of
 * symmetry as a fold (the answer to "how can you check…"), "without turning or flipping" in the translation term, list
 * terms that stated the rule each question tests (square brackets, -1 is the last item, remove deletes the first match,
 * pop takes the last), a Scratch ordering that named "when I receive start" and "every sprite and the stage", x/y terms
 * saying 0 is the middle and bigger y is higher, "lemon juice" in the acid term, "baking soda" and "carbon dioxide…
 * fizzy" as statements in other questions' options, "carbon dioxide" in the ocean acidification term, "gold" in the
 * element terms, the isotope term naming neutrons, "has gained 2 electrons" in the sulfide prompt, the crater, tides and
 * spring-tide terms that named their causes, "29.5 days" and "1969" in number prompts, "copper" in the metal term, and
 * the proton and outer-shell definitions that answered the periodic-table questions. Three questions whose answer every
 * definition of the level gives (the particles of the nucleus, the block that makes a clone, the eclipse phase that the
 * eclipse ordering and the next question both state) were replaced by fact-checked ones. The Hebrew list literals are
 * written with spaces, as in English ([1, 2, 3] stays one left-to-right run in a Hebrew line).
 */

const TOPICS: Record<string, TopicContent> = {
  "math-sine-cosine-rules": sineCosineRules,
  "math-symmetry": symmetry,
  "math-time": time,
  "math-transformations": transformations,
  "prog-lists": lists,
  "prog-scratch": scratch,
  "science-acids-bases": acidsBases,
  "science-atoms": atoms,
  "science-moon": moon,
  "science-periodic-table": periodicTable,
};
const LEVELS = ["b", "i", "a"] as const;
type Level = (typeof LEVELS)[number];

const questions = (c: TopicContent, l: Level): readonly Question[] => c[l].q ?? [];
const question = (c: TopicContent, l: Level, start: string): Question => {
  const found = questions(c, l).find(([en]) => en[0].startsWith(start));
  if (!found) throw new Error(`no question starting "${start}"`);
  return found;
};
const numberItem = (c: TopicContent, l: Level, word: string): NumberItem => {
  const found = (c[l].n ?? []).find(([, en]) => en[0].includes(word));
  if (!found) throw new Error(`no number item with "${word}"`);
  return found;
};
const term = (c: TopicContent, l: Level, name: string): [string, string] => {
  const found = (c[l].t ?? []).find(([en]) => en === name);
  if (!found) throw new Error(`no term "${name}"`);
  return [found[1], found[3]];
};

/** What a game shows next to a choice question: term descriptions, number prompts and ordering titles and steps. */
function shownBesides(lv: LevelContent, lang: 0 | 1): string[] {
  return [
    ...(lv.t ?? []).map((t) => (lang ? t[3] : t[1])),
    ...(lv.n ?? []).map((n) => (lang ? n[2][0] : n[1][0])),
    ...(lv.s ?? []).flatMap((s) => s[lang]!),
  ];
}
const plain = (s: string) => s.replace(/[״"]/g, "").toLowerCase();

describe.each(Object.entries(TOPICS))("%s", (id, c) => {
  it.each(LEVELS)("level %s has 8+ items, 4+ of them questions, numbers or orderings", (l) => {
    const lv = c[l];
    const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
    expect(items, `${id}/${l}`).toBeGreaterThanOrEqual(4);
    expect((lv.t?.length ?? 0) + items, `${id}/${l}`).toBeGreaterThanOrEqual(8);
  });

  it("the right answer is the strictly longest option in at most 40 % of the questions, per language", () => {
    for (const lang of [0, 1] as const) {
      const qs = LEVELS.flatMap((l) => questions(c, l)).map((p) => p[lang]);
      const longest = qs.filter(([, a, w]) => a.length > Math.max(...w.map((x) => x.length))).length;
      expect(longest / qs.length, `${id} ${lang ? "he" : "en"}`).toBeLessThanOrEqual(0.4);
    }
  });

  it("explains every answer and number in 40+ characters, and Hebrew has no < or > and no ? as a blank", () => {
    for (const l of LEVELS) {
      for (const pair of questions(c, l)) for (const [q, , , explanation] of pair) expect(explanation.length, q).toBeGreaterThanOrEqual(40);
      for (const [answer, en, he] of c[l].n ?? []) {
        for (const text of [en[2], he[2]]) {
          expect(text.length, en[0]).toBeGreaterThanOrEqual(40);
          expect([String(answer), answer.toLocaleString("en-US")].some((w) => text.includes(w)), en[0]).toBe(true);
        }
      }
      const he = [
        ...(c[l].t ?? []).flatMap((t) => [t[2], t[3]]),
        ...questions(c, l).flatMap(([, h]) => [h[0], h[1], ...h[2], h[3]]),
        ...(c[l].n ?? []).flatMap(([, , h]) => [h[0], h[2]]),
        ...(c[l].s ?? []).flatMap(([, h]) => h),
      ];
      for (const s of he) {
        expect(s, `${id}/${l}`).not.toMatch(/[<>]/);
        expect(s, `${id}/${l}`).not.toMatch(/\?\s*\/|\/\s*\?/);
      }
    }
  });

  it("keeps he and en in step: the same questions, options, number items, orderings and terms in each level", () => {
    for (const l of LEVELS) {
      for (const [en, he] of questions(c, l)) expect(he[2].length, en[0]).toBe(en[2].length);
      for (const [en, he] of c[l].s ?? []) expect(he.length, en[0]).toBe(en.length);
      for (const t of c[l].t ?? []) expect(t.every((s) => s.length > 0), t[0]).toBe(true);
    }
  });

  it("never shows a choice question's answer in a term, number prompt or ordering step of the same level", () => {
    // checked and left on purpose: a mention that names the shape or the unit but does not tell which option is right
    const allowed = new Set([
      "math-symmetry/a/A regular hexagon", // an item of the "smallest turn" ordering, which says nothing about point symmetry
      "math-symmetry/a/משושה משוכלל",
      "math-time/b/1 week", // an item of the "shortest to longest" ordering, which has no 100 hours, 1,000 minutes or 2 days
      "math-time/b/שבוע אחד",
      "math-transformations/i/Anticlockwise", // the direction asked for in a turn sum, not the order of a reflected triangle
      "math-transformations/i/נגד כיוון השעון",
      "science-periodic-table/b/Iron", // iron as an example of a metal and an item of the atomic-number ordering, not its symbol
      "science-periodic-table/b/ברזל",
      "science-periodic-table/b/Hydrogen", // an item of the atomic-number ordering, which must be known to sort it
      "science-periodic-table/b/מימן",
    ]);
    const found: string[] = [];
    for (const l of LEVELS) for (const lang of [0, 1] as const) {
      const shown = shownBesides(c[l], lang).map(plain);
      for (const q of questions(c, l)) {
        const answer = q[lang]![1];
        if (answer.length < 4 || allowed.has(`${id}/${l}/${answer}`)) continue;
        const hit = shown.find((s) => s.includes(plain(answer)));
        if (hit) found.push(`${id}/${l}: "${answer}" in "${hit}"`);
      }
    }
    expect(found).toEqual([]);
  });
});

describe("the giveaways that were removed stay removed", () => {
  it("sine and cosine rules: the ordering and the terms do not name the rule a question asks for", () => {
    const [en, he] = sineCosineRules.b.s![0]!;
    expect(en.join(" ").toLowerCase()).not.toContain("sine rule");
    expect(he.join(" ")).not.toContain("משפט הסינוסים");
    expect(en[2]).toContain("a ÷ sin A = b ÷ sin B");
    const [cosEn, cosHe] = term(sineCosineRules, "b", "Cosine rule");
    expect(cosEn).not.toMatch(/three sides/);
    expect(cosHe).not.toContain("שלוש הצלעות");
    expect(question(sineCosineRules, "b", "You know all three sides")[0][1]).toBe("The cosine rule");
    // SSA can give two triangles, one or none: the term no longer hints "two"
    const [ambEn, ambHe] = term(sineCosineRules, "a", "Ambiguous case");
    expect(ambEn).toMatch(/two different triangles, only one, or none/);
    expect(ambHe).toContain("לאף משולש");
  });

  it("symmetry: no beginner term defines symmetry by folding, which is the answer to how to check it", () => {
    for (const [, en, , he] of symmetry.b.t!) {
      expect(en).not.toMatch(/fold/i);
      expect(he).not.toContain("קיפול");
    }
    expect(question(symmetry, "b", "How can you check")[0][1]).toMatch(/^Fold the shape/);
  });

  it("transformations: the translation term does not say the image is neither turned nor flipped", () => {
    const [en, he] = term(transformations, "b", "Translation");
    expect(en).not.toMatch(/turning|flipping/);
    expect(he).not.toMatch(/לסובב|להפוך/);
  });

  it("lists: the terms do not state the rule a question tests, and the Hebrew code is written like the English", () => {
    expect(term(lists, "b", "List")[0]).not.toMatch(/square brackets|\[/);
    expect(term(lists, "i", "Negative index")[0]).not.toContain("-1");
    expect(term(lists, "i", "remove()")[0]).not.toMatch(/first/);
    expect(term(lists, "a", "pop()")[0]).not.toMatch(/last/);
    const [en, he] = question(lists, "i", "In Python 3,  a = [1, 2, 3] . What does  a[3]");
    expect(en[1]).toBe("An IndexError");
    expect(he[0]).toBe("ב־Python 3,  a = [1, 2, 3]. מה נותן a[3]?");
    // a Hebrew list literal keeps a space after each comma, as in the English
    for (const l of LEVELS) for (const [, h] of questions(lists, l)) expect(h[0], h[0]).not.toMatch(/\d,\d|",["\d]/);
    // the grid no longer has a row [3, 4], the answer of a[-2:] in the same level
    const grid = [[1, 2], [5, 6]];
    expect(numberItem(lists, "a", "grid = [[1, 2], [5, 6]]")[0]).toBe(grid[1]![0]);
  });

  it("Scratch: the broadcast ordering and terms do not name the receiving block or who a global variable reaches", () => {
    const steps = scratch.a.s![0]!;
    expect(steps[0].join(" ")).not.toMatch(/when I receive|every sprite and the stage/i);
    expect(steps[1].join(" ")).not.toContain("כאשר מתקבל מסר");
    expect(term(scratch, "a", "Broadcast")[1]).not.toContain("כאשר מתקבל מסר");
    expect(question(scratch, "a", "The cat sprite runs  broadcast start")[0][1]).toBe("when I receive start");
    expect(question(scratch, "a", "A variable is made  For all sprites")[0][1]).toBe("Every sprite and the stage");
    // the clone question asks what the term does not say: the stop sign deletes every clone
    const [clone] = question(scratch, "a", "While a project runs, a sprite makes 5 clones");
    expect(clone[1]).toMatch(/deleted/);
    expect(term(scratch, "a", "Clone")[0]).not.toMatch(/while the project runs|disappear|delete/);
  });

  it("Scratch: the x and y terms no longer say where 0 is or which way y grows", () => {
    for (const name of ["x position", "y position"]) {
      const [en, he] = term(scratch, "i", name);
      expect(en).not.toMatch(/middle|bigger|higher|further/);
      expect(he).not.toMatch(/האמצע|גדולים/);
    }
    // the number prompt shows that the middle x is 0, so a wrong option has x: 0 too
    const [middle] = question(scratch, "i", "What are the x and y of the exact middle");
    expect(middle[1]).toBe("x: 0, y: 0");
    expect(middle[2]).toContain("x: 0, y: 180");
  });

  it("acids and bases: no term or option states the answer of another question of the level", () => {
    expect(term(acidsBases, "b", "Acid")[0]).not.toMatch(/lemon/i);
    expect(term(acidsBases, "b", "Acid")[1]).not.toContain("לימון");
    const litmus = question(acidsBases, "b", "Blue litmus paper");
    expect(litmus[0][2].join(" ")).not.toMatch(/baking soda/i);
    expect(litmus[1][2].join(" ")).not.toContain("סודה לשתייה");
    const lake = question(acidsBases, "i", "A lake has become too acidic");
    expect(lake[0][2].join(" ")).not.toMatch(/carbon dioxide|fizz/i);
    expect(lake[1][2].join(" ")).not.toContain("פחמן דו־חמצני");
    expect(question(acidsBases, "i", "Vinegar is poured on baking soda")[0][1]).toBe("Carbon dioxide");
    const [oceanEn, oceanHe] = term(acidsBases, "a", "Ocean acidification");
    expect(oceanEn).not.toMatch(/carbon dioxide|CO₂/i);
    expect(oceanHe).not.toContain("פחמן דו־חמצני");
    expect(question(acidsBases, "a", "Rain is always slightly acidic")[0][1]).toBe("Carbon dioxide");
  });

  it("atoms: the element, isotope and sulfide items do not answer the questions next to them", () => {
    expect(term(atoms, "b", "Element")[0]).not.toMatch(/gold/i);
    // "the tiny particle that all matter is built from" told which of sand, a bacterium, a blood cell and an atom is smallest
    expect(term(atoms, "b", "Atom")[0]).not.toMatch(/tiny|small|all matter/);
    expect(question(atoms, "b", "Which of these things is the smallest?")[0][1]).toBe("An atom");
    expect(question(atoms, "b", "Can you see a single atom")[0][2].join(" ")).not.toMatch(/gold/i);
    expect(question(atoms, "b", "Which of these is an element?")[0][1]).toBe("Gold");
    // every intermediate definition places protons and neutrons in the nucleus, so that is no longer asked at that level
    expect(questions(atoms, "i").some(([en]) => en[1] === "Protons and neutrons")).toBe(false);
    const [pull] = question(atoms, "i", "What keeps the electrons of an atom close");
    expect(pull[1]).toMatch(/negative electrons and the positive protons/);
    for (const l of [pull[0], ...pull[2]]) expect(l).not.toMatch(/heavier|lighter|mass/);
    expect(question(atoms, "i", "Which particle has by far the smallest mass?")[0][1]).toBe("The electron");
    const [isoEn, isoHe] = term(atoms, "a", "Isotope");
    expect(isoEn).not.toMatch(/neutron/);
    expect(isoHe).not.toContain("נייטרון");
    const sulfide = numberItem(atoms, "a", "sulfide");
    expect(sulfide[1][0]).not.toMatch(/gain/);
    expect(sulfide[2][0]).not.toContain("קיבל");
    expect(sulfide[0]).toBe(16 + 2);
    expect(question(atoms, "a", "An oxygen atom gains two electrons")[0][1]).toBe("A negative ion, O²⁻");
  });

  it("the Moon: no term or prompt names the crater, phase, tide or year the questions ask for", () => {
    expect(term(moon, "b", "Crater")[0]).not.toMatch(/rock|space|hit/);
    expect(term(moon, "b", "New moon")[0]).not.toMatch(/lit/);
    expect(term(moon, "b", "Full moon")[0]).not.toMatch(/lit/);
    const apollo = numberItem(moon, "b", "six Apollo missions");
    expect(apollo[1][0]).not.toContain("1969");
    expect(apollo[2][0]).not.toContain("1969");
    expect(apollo[0]).toBe(6 * 2);
    expect(term(moon, "i", "Tides")[0]).not.toMatch(/Moon|gravity/);
    expect(term(moon, "i", "Tides")[1]).not.toContain("ירח");
    const fullMoons = numberItem(moon, "i", "full moons");
    expect(fullMoons[1][0]).not.toContain("29.5");
    expect(fullMoons[2][0]).not.toContain("29.5");
    expect(Math.abs(fullMoons[0] - 365 / 29.5)).toBeLessThanOrEqual(fullMoons[3] ?? 0);
    expect(question(moon, "i", "About how long is the cycle")[0][1]).toBe("About 29.5 days");
    const [springEn, springHe] = term(moon, "a", "Spring tide");
    expect(springEn).not.toMatch(/full|new moon|line up/);
    expect(springHe).not.toMatch(/ירח מלא|מולד|בקו אחד/);
    // the eclipse ordering starts "The Moon is full…", so the level does not ask at which phase an eclipse happens
    expect(questions(moon, "a").some(([en]) => en[1] === "Full moon")).toBe(false);
    expect(question(moon, "a", "Who can see a total lunar eclipse")[0][1]).toMatch(/where the Moon is in the sky/);
  });

  it("the periodic table: the metal, atomic-number and valence terms do not answer the questions next to them", () => {
    expect(term(periodicTable, "b", "Metal")[0]).not.toMatch(/copper/i);
    expect(question(periodicTable, "b", "Which of these elements is a metal?")[0][1]).toBe("Copper");
    const [atomicEn, atomicHe] = term(periodicTable, "a", "Atomic number");
    expect(atomicEn).not.toMatch(/proton/);
    expect(atomicHe).not.toContain("פרוטון");
    expect(question(periodicTable, "a", "Carbon-12 and carbon-14")[0][1]).toBe("The number of protons");
    const [valenceEn, valenceHe] = term(periodicTable, "a", "Valence electrons");
    expect(valenceEn).not.toMatch(/react/);
    expect(valenceHe).not.toContain("מגיב");
  });
});
