import { describe, expect, it, vi } from "vitest";

/** Counts how often the study engine reads a text word by word: that is where the time went. */
const reads = vi.hoisted(() => ({ n: 0 }));
vi.mock("@/lib/game/material/text", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/game/material/text")>();
  return { ...real, wordsOf: (s: string) => (reads.n++, real.wordsOf(s)) };
});

import { generateChallenges } from "@/lib/game/material/challenges";
import { parseMaterial } from "@/lib/game/material/parse";
import { hashText } from "@/lib/game/material/text";
import { mulberry32 } from "@/lib/game/util/prng";

const WORDS = "river stone cloud forest planet engine orbit signal vector matrix kernel packet socket thread buffer cipher render shader pixel sprite quartz basalt granite marble silica mantle crust magma fossil delta basin canyon glacier tundra savanna prairie lagoon atoll reef harbor gulf strait isthmus plateau mesa butte ridge valley summit".split(" ");
const w = (i: number, mul: number) => WORDS[(i * mul) % WORDS.length]!;

const glossary = (n: number) => Array.from({ length: n }, (_, i) => `${w(i, 1)}${i}: a thing that relates to the ${w(i, 7)} and the ${w(i, 11)} of a ${w(i, 13)} system number ${i}`).join("\n");
const vocabulary = (n: number) => Array.from({ length: n }, (_, i) => `${w(i, 1)}${i} = ${w(i, 3)}${i}`).join("\n");
const questions = (n: number) => Array.from({ length: n }, (_, i) => `Q: What is the role of ${w(i, 1)}${i} in the ${w(i, 5)} cycle?\nA: It moves the ${w(i, 9)} through stage ${i}`).join("\n");

const run = (text: string, lang: "en" | "he" = "en") => {
  const k = parseMaterial(text);
  reads.n = 0;
  const g = generateChallenges(k, { lang, rnd: mulberry32(hashText(text)), max: 10, variants: true });
  return { k, g, reads: reads.n };
};

describe("the study engine stays fast on list-like notes (a glossary, a vocabulary, Q&A)", () => {
  // The term, define and Q&A builders compare every entry with every other one. Reading both texts again for each pair
  // made a pasted glossary of a few hundred lines take seconds on the UI thread (the live preview runs it while typing).
  it("a glossary reads each text a handful of times, not once per pair", () => {
    const { k, g, reads: n } = run(glossary(100));
    expect(k.definitions.length).toBeGreaterThan(80);
    expect(g.challenges.length).toBeGreaterThanOrEqual(4);
    expect(n).toBeLessThan(k.definitions.length * 40);
  });

  it("a long vocabulary list reads each text a handful of times, not once per pair", () => {
    const { k, g, reads: n } = run(vocabulary(300));
    expect(k.definitions.length).toBeGreaterThan(250);
    expect(g.challenges.length).toBeGreaterThanOrEqual(4);
    expect(n).toBeLessThan(k.definitions.length * 40);
  });

  it("many question and answer pairs read each text a handful of times, not once per pair", () => {
    const { k, g, reads: n } = run(questions(80));
    expect(k.qa.length).toBeGreaterThan(70);
    expect(g.challenges.length).toBeGreaterThanOrEqual(4);
    expect(n).toBeLessThan(k.qa.length * 40);
  });

  it("what was remembered for one set of notes never leaks into the next", () => {
    const a = glossary(40);
    const b = `${vocabulary(40)}\n${questions(10)}`;
    const first = run(a);
    run(b);
    const again = run(a);
    expect(again.g).toEqual(first.g);
  });
});
