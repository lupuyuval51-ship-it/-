import { describe, expect, it } from "vitest";
import { answerSchema, gradeAnswer, revealSolution, seededShuffle, toPublicAnswer, toPublicChallenge, type Answer } from "@/lib/game/challenges/grade";
import { msg, type MessageKey } from "@/lib/game/challenges/messages";
import { CONTENT_LANGUAGES, SPEC_LIMITS } from "@/lib/game/spec/constants";
import {
  choiceChallenge, matchChallenge, numericChallenge, programChallenge, sequenceChallenge, simulationChallenge,
  type Challenge, type MatchChallenge, type SequenceChallenge,
} from "@/lib/game/spec/schema";

/**
 * Server-authoritative grading: what each challenge type accepts, how it refuses a malformed answer, what the player is shown
 * and what the engine says back. (The whole-corpus checks of the opaque ids are in opaque-ids.test.ts.)
 */

const base = { title: "Title", prompt: "Prompt", concept: "concept", level: 2, explanation: "SECRET-EXPLANATION", hint: "SECRET-HINT" };

const choice = choiceChallenge.parse({
  ...base, id: "c-choice", type: "choice", correctOptionId: "b",
  options: [{ id: "a", text: "Option A", feedback: "SECRET-FEEDBACK-A" }, { id: "b", text: "Option B", feedback: "SECRET-FEEDBACK-B" }, { id: "c", text: "Option C", feedback: "SECRET-FEEDBACK-C" }],
});
const numeric = numericChallenge.parse({
  ...base, id: "c-num", type: "numeric", answer: 12, tolerance: 0.5, unit: "cm",
  commonMistakes: [{ value: 24, feedback: "You doubled it." }, { value: 13, feedback: "SECRET-MISTAKE-NEAR" }],
});
const exact = numericChallenge.parse({ ...base, id: "c-exact", type: "numeric", answer: 0.3 });
const sequence: SequenceChallenge = sequenceChallenge.parse({
  ...base, id: "c-seq", type: "sequence", items: [{ id: "i1", text: "First" }, { id: "i2", text: "Second" }, { id: "i3", text: "Third" }, { id: "i4", text: "Fourth" }],
});
const match: MatchChallenge = matchChallenge.parse({
  ...base, id: "c-match", type: "match", pairs: [{ id: "p1", left: "Cat", right: "Meow" }, { id: "p2", left: "Dog", right: "Woof" }, { id: "p3", left: "Cow", right: "Moo" }],
});
const program = programChallenge.parse({
  ...base, id: "c-prog", type: "program", grid: { width: 4, height: 4, start: { x: 0, y: 0, dir: "E" }, goal: { x: 3, y: 0 }, walls: [] },
  allowed: ["move", "repeat"], maxBlocks: 4, solution: [{ t: "repeat", n: 3, body: [{ t: "move" }] }],
});
const projectile = simulationChallenge.parse({ ...base, id: "c-proj", type: "simulation", sim: { kind: "projectile", gravity: 9.8, targetDistance: 40, tolerance: 2, maxSpeed: 30 } });
const lever = simulationChallenge.parse({ ...base, id: "c-lever", type: "simulation", sim: { kind: "lever", leftWeight: 6, leftDistance: 4, rightWeight: 8, maxDistance: 10, tolerance: 0.25 } });
const all: Challenge[] = [choice, numeric, sequence, match, program, projectile, lever];

const FEEDBACK_SECRETS = /SECRET-/;

describe("the answer schema (what a client may send)", () => {
  it("accepts one well-formed answer of every type", () => {
    const answers: unknown[] = [
      { type: "choice", optionId: "o1abc" },
      { type: "numeric", value: -3.5 },
      { type: "sequence", order: ["i1", "i2"] },
      { type: "match", pairs: [{ leftId: "l1", rightId: "r1" }] },
      { type: "program", program: [{ t: "move" }, { t: "repeat", n: 3, body: [{ t: "left" }] }, { t: "if", body: [{ t: "move" }] }] },
      { type: "simulation", params: { angle: 45, speed: 20 } },
    ];
    for (const a of answers) expect(answerSchema.safeParse(a).success, JSON.stringify(a)).toBe(true);
  });

  it("refuses an unknown type, a missing field and a value that is not a finite number", () => {
    for (const a of [
      { type: "essay", text: "x" }, {}, { type: "choice" }, { type: "choice", optionId: "" }, { type: "choice", optionId: "has space" },
      { type: "numeric", value: "4" }, { type: "numeric", value: Number.NaN }, { type: "numeric", value: Number.POSITIVE_INFINITY }, { type: "numeric", value: Number.NEGATIVE_INFINITY },
      { type: "simulation", params: { speed: Number.NaN } }, { type: "simulation", params: { speed: Number.POSITIVE_INFINITY } },
    ]) expect(answerSchema.safeParse(a).success, JSON.stringify(a)).toBe(false);
  });

  it("keeps every list inside a size a real challenge can need, and no bigger", () => {
    const ids = (n: number) => Array.from({ length: n }, (_, i) => `x${i}`);
    // a challenge at its largest can still be answered in full …
    expect(answerSchema.safeParse({ type: "sequence", order: ids(SPEC_LIMITS.itemsPerSequence) }).success).toBe(true);
    expect(answerSchema.safeParse({ type: "match", pairs: ids(SPEC_LIMITS.pairsPerMatch).map((id) => ({ leftId: id, rightId: id })) }).success).toBe(true);
    expect(answerSchema.safeParse({ type: "program", program: Array.from({ length: SPEC_LIMITS.programBlocksMax }, () => ({ t: "move" })) }).success).toBe(true);
    // … and a request is not an open door for a huge payload
    expect(answerSchema.safeParse({ type: "sequence", order: ids(9) }).success).toBe(false);
    expect(answerSchema.safeParse({ type: "match", pairs: ids(9).map((id) => ({ leftId: id, rightId: id })) }).success).toBe(false);
    expect(answerSchema.safeParse({ type: "program", program: Array.from({ length: 15 }, () => ({ t: "move" })) }).success).toBe(false);
    expect(answerSchema.safeParse({ type: "simulation", params: { a: 1, b: 2, c: 3, d: 4 } }).success).toBe(true);
    expect(answerSchema.safeParse({ type: "simulation", params: { a: 1, b: 2, c: 3, d: 4, e: 5 } }).success).toBe(false);
    expect(answerSchema.safeParse({ type: "simulation", params: { ["k".repeat(21)]: 1 } }).success).toBe(false);
  });

  it("a robot program from the builder is parsed leniently (empty loops and long bodies are wrong programs, not bad requests) but a loop count stays 2 to 9", () => {
    expect(answerSchema.safeParse({ type: "program", program: [{ t: "repeat", n: 2, body: [] }] }).success).toBe(true);
    expect(answerSchema.safeParse({ type: "program", program: [{ t: "repeat", n: 1, body: [{ t: "move" }] }] }).success).toBe(false);
    expect(answerSchema.safeParse({ type: "program", program: [{ t: "repeat", n: 10, body: [{ t: "move" }] }] }).success).toBe(false);
    expect(answerSchema.safeParse({ type: "program", program: [{ t: "repeat", n: 2.5, body: [{ t: "move" }] }] }).success).toBe(false);
    expect(answerSchema.safeParse({ type: "program", program: [{ t: "jump" }] }).success).toBe(false);
    // an if without an else gets an empty one (the sandbox then never meets `undefined`)
    const parsed = answerSchema.parse({ type: "program", program: [{ t: "if", body: [{ t: "move" }] }] });
    expect(parsed).toEqual({ type: "program", program: [{ t: "if", body: [{ t: "move" }], else: [] }] });
  });
});

describe("a choice", () => {
  it("says what the chosen option says, right or wrong, and which one was chosen", () => {
    const right = gradeAnswer(choice, { type: "choice", optionId: "b" }, "en");
    expect(right).toEqual({ correct: true, feedback: "SECRET-FEEDBACK-B", detail: { chosen: "b" } });
    const wrong = gradeAnswer(choice, { type: "choice", optionId: "c" }, "en");
    expect(wrong).toEqual({ correct: false, feedback: "SECRET-FEEDBACK-C", detail: { chosen: "c" } });
  });

  it("an option that is not on the question cannot be graded", () => {
    expect(gradeAnswer(choice, { type: "choice", optionId: "zzz" }, "en")).toEqual({ correct: false, feedback: msg("en", "invalidAnswer") });
    expect(gradeAnswer(choice, { type: "choice", optionId: "zzz" }, "he").feedback).toBe(msg("he", "invalidAnswer"));
  });

  it("with a session seed the chosen option comes back in the id the player saw", () => {
    const pubB = toPublicAnswer(choice, { type: "choice", optionId: "b" }, "s1");
    expect(pubB).not.toEqual({ type: "choice", optionId: "b" });
    const res = gradeAnswer(choice, pubB, "en", "s1");
    expect(res.correct).toBe(true);
    expect(res.detail).toEqual({ chosen: (pubB as { optionId: string }).optionId });
    expect(res.feedback).toBe("SECRET-FEEDBACK-B");
  });
});

describe("a number", () => {
  const grade = (value: number) => gradeAnswer(numeric, { type: "numeric", value }, "en");

  it("is right inside the tolerance, on its edge included, and wrong just outside", () => {
    expect(grade(12).correct).toBe(true);
    expect(grade(11.5).correct).toBe(true);
    expect(grade(12.5).correct).toBe(true);
    expect(grade(12.5001).correct).toBe(false);
    expect(grade(11.4).correct).toBe(false);
    expect(grade(12).feedback).toBe(msg("en", "numericRight"));
  });

  it("a tolerance of 0 asks for the number itself, but does not trip over floating point (0.1 + 0.2 is 0.3)", () => {
    const sum = 0.1 + 0.2;
    expect(sum).not.toBe(0.3);
    expect(gradeAnswer(exact, { type: "numeric", value: sum }, "en").correct).toBe(true);
    expect(gradeAnswer(exact, { type: "numeric", value: 0.31 }, "en").correct).toBe(false);
  });

  it("explains a known slip, and a slip that is also an accepted answer is simply right", () => {
    expect(grade(24)).toEqual({ correct: false, feedback: "You doubled it." });
    // 13 is a listed slip, 12.5 is inside the tolerance of the answer: the answer wins
    expect(grade(13).feedback).toBe("SECRET-MISTAKE-NEAR");
    const loose = numericChallenge.parse({ ...base, id: "c-loose", type: "numeric", answer: 10, tolerance: 3, commonMistakes: [{ value: 12, feedback: "never shown" }] });
    expect(gradeAnswer(loose, { type: "numeric", value: 12 }, "en")).toMatchObject({ correct: true, feedback: msg("en", "numericRight") });
  });

  it("any other wrong number gets the generic nudge, in the content language", () => {
    expect(grade(99).feedback).toBe(msg("en", "notQuite"));
    expect(gradeAnswer(numeric, { type: "numeric", value: 99 }, "he").feedback).toBe(msg("he", "notQuite"));
  });

  it("a value that is not a number is wrong, never right and never a crash (NaN and Infinity compare false)", () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const r = gradeAnswer(numeric, { type: "numeric", value }, "en");
      expect(r.correct, String(value)).toBe(false);
    }
  });

  it("works for negative answers and a negative tolerance window", () => {
    const cold = numericChallenge.parse({ ...base, id: "c-neg", type: "numeric", answer: -30, tolerance: 1 });
    expect(gradeAnswer(cold, { type: "numeric", value: -30.9 }, "en").correct).toBe(true);
    expect(gradeAnswer(cold, { type: "numeric", value: 30 }, "en").correct).toBe(false);
  });
});

describe("an ordering", () => {
  const order = (...ids: string[]): Answer => ({ type: "sequence", order: ids });

  it("the right order is right; a wrong one is told how many items are in place, and which", () => {
    expect(gradeAnswer(sequence, order("i1", "i2", "i3", "i4"), "en")).toEqual({ correct: true, feedback: msg("en", "seqRight"), detail: { inPlace: [true, true, true, true] } });
    const swapped = gradeAnswer(sequence, order("i2", "i1", "i3", "i4"), "en");
    expect(swapped.correct).toBe(false);
    expect(swapped.feedback).toBe(msg("en", "seqPartial", { n: 2, total: 4 }));
    expect(swapped.detail).toEqual({ inPlace: [false, false, true, true] });
    expect(gradeAnswer(sequence, order("i4", "i3", "i2", "i1"), "he").feedback).toBe(msg("he", "seqPartial", { n: 0, total: 4 }));
  });

  it("an answer that is not a permutation of the items is refused as unreadable, not graded as wrong order", () => {
    for (const bad of [order(), order("i1", "i2", "i3"), order("i1", "i2", "i3", "i4", "i1"), order("i1", "i1", "i2", "i3"), order("i1", "i2", "i3", "zz"), order("i1", "i2", "i3", "i3")]) {
      const r = gradeAnswer(sequence, bad, "en");
      expect(r, JSON.stringify(bad)).toEqual({ correct: false, feedback: msg("en", "invalidAnswer") });
    }
  });

  it("with a seed, the player's own ids are used, and raw ids of the game file are refused", () => {
    const rawRight = order("i1", "i2", "i3", "i4");
    expect(gradeAnswer(sequence, rawRight, "en", "seed").feedback).toBe(msg("en", "invalidAnswer"));
    expect(gradeAnswer(sequence, toPublicAnswer(sequence, rawRight, "seed"), "en", "seed").correct).toBe(true);
    const swapped = toPublicAnswer(sequence, order("i1", "i3", "i2", "i4"), "seed");
    const r = gradeAnswer(sequence, swapped, "en", "seed");
    expect(r.correct).toBe(false);
    expect(r.detail).toEqual({ inPlace: [true, false, false, true] }); // positions, so no ids to translate
  });
});

describe("a matching", () => {
  const pairs = (...p: [string, string][]): Answer => ({ type: "match", pairs: p.map(([leftId, rightId]) => ({ leftId, rightId })) });

  it("a pair is right when both ends are of the same entry; the answer says how many are", () => {
    expect(gradeAnswer(match, pairs(["p1", "p1"], ["p2", "p2"], ["p3", "p3"]), "en")).toEqual({ correct: true, feedback: msg("en", "matchRight"), detail: { right: { p1: true, p2: true, p3: true } } });
    const partial = gradeAnswer(match, pairs(["p1", "p1"], ["p2", "p3"], ["p3", "p2"]), "en");
    expect(partial.correct).toBe(false);
    expect(partial.feedback).toBe(msg("en", "matchPartial", { n: 1, total: 3 }));
    expect(partial.detail).toEqual({ right: { p1: true, p2: false, p3: false } });
  });

  it("the order the pairs are sent in does not matter", () => {
    expect(gradeAnswer(match, pairs(["p3", "p3"], ["p1", "p1"], ["p2", "p2"]), "en").correct).toBe(true);
  });

  it("an incomplete answer, a left used twice, or an id that is not on the question is refused as unreadable", () => {
    for (const bad of [
      pairs(), pairs(["p1", "p1"], ["p2", "p2"]), pairs(["p1", "p1"], ["p1", "p1"], ["p2", "p2"]),
      pairs(["p1", "p1"], ["p2", "p2"], ["p3", "zz"]), pairs(["p1", "p1"], ["p2", "p2"], ["zz", "p3"]),
      pairs(["p1", "p1"], ["p2", "p2"], ["p3", "p3"], ["p3", "p3"]),
    ]) {
      expect(gradeAnswer(match, bad, "en"), JSON.stringify(bad)).toEqual({ correct: false, feedback: msg("en", "invalidAnswer") });
    }
  });

  it("two lefts sent to the same right can never be a full match", () => {
    const r = gradeAnswer(match, pairs(["p1", "p1"], ["p2", "p1"], ["p3", "p3"]), "en");
    expect(r.correct).toBe(false);
    expect(r.feedback).toBe(msg("en", "matchPartial", { n: 2, total: 3 }));
  });

  it("with a seed, the detail is keyed by the left ids the player saw, and the game file's ids never appear in it", () => {
    const wrong = toPublicAnswer(match, pairs(["p1", "p2"], ["p2", "p1"], ["p3", "p3"]), "seed");
    const r = gradeAnswer(match, wrong, "en", "seed");
    const pub = toPublicChallenge(match, "seed") as Extract<ReturnType<typeof toPublicChallenge>, { type: "match" }>;
    const right = (r.detail as { right: Record<string, boolean> }).right;
    expect(Object.keys(right).sort()).toEqual(pub.lefts.map((l) => l.id).sort());
    expect(Object.values(right).filter(Boolean)).toHaveLength(1);
    expect(JSON.stringify(r)).not.toMatch(/"p[123]"/);
  });
});

describe("answers of the wrong kind", () => {
  const sample: Answer[] = [
    { type: "choice", optionId: "a" }, { type: "numeric", value: 1 }, { type: "sequence", order: ["i1", "i2", "i3", "i4"] },
    { type: "match", pairs: [] }, { type: "program", program: [] }, { type: "simulation", params: {} },
  ];
  it("every challenge refuses an answer of another type, with or without a seed, and in every content language", () => {
    for (const ch of all) {
      for (const a of sample) {
        if (a.type === ch.type) continue;
        for (const lang of CONTENT_LANGUAGES) {
          expect(gradeAnswer(ch, a, lang), `${ch.type} <- ${a.type}`).toEqual({ correct: false, feedback: msg(lang, "invalidAnswer") });
          expect(gradeAnswer(ch, a, lang, "seed").correct).toBe(false);
        }
      }
    }
  });
});

describe("the solution that is released after repeated failure", () => {
  it("is what the grader accepts, for every type, with and without a seed", () => {
    const asAnswer = (ch: Challenge, r: Record<string, unknown>): Answer => {
      switch (ch.type) {
        case "choice": return { type: "choice", optionId: r.optionId as string };
        case "numeric": return { type: "numeric", value: r.value as number };
        case "sequence": return { type: "sequence", order: r.order as string[] };
        case "match": return { type: "match", pairs: r.pairs as { leftId: string; rightId: string }[] };
        case "program": return { type: "program", program: r.program as never };
        case "simulation": return { type: "simulation", params: r.params as Record<string, number> };
      }
    };
    for (const ch of all) {
      expect(gradeAnswer(ch, asAnswer(ch, revealSolution(ch)), "en").correct, `${ch.id} raw`).toBe(true);
      expect(gradeAnswer(ch, asAnswer(ch, revealSolution(ch, "seed")), "en", "seed").correct, `${ch.id} seeded`).toBe(true);
    }
  });

  it("a number reveals its unit; a number, a program and a simulation read the same with or without a seed (there are no ids in them)", () => {
    expect(revealSolution(numeric)).toEqual({ value: 12, unit: "cm" });
    for (const ch of [numeric, program, projectile, lever]) expect(revealSolution(ch, "seed")).toEqual(revealSolution(ch));
    expect(revealSolution(program)).toEqual({ program: [{ t: "repeat", n: 3, body: [{ t: "move" }] }] });
  });

  it("a lever's solution is the balance point to two decimals", () => {
    // 6 kg at 4 m against 8 kg: 3 m
    expect(revealSolution(lever)).toEqual({ params: { distance: 3 } });
  });
});

describe("what the player is shown of a question", () => {
  const keysOf = (ch: Challenge) => Object.keys(JSON.parse(JSON.stringify(toPublicChallenge(ch, "seed")))).sort();
  const common = ["concept", "hasHint", "id", "level", "prompt", "title", "type"];

  it("shows exactly the fields of a question per type: no answer key, explanation, hint text, feedback, tolerance, mistakes or solution", () => {
    expect(keysOf(choice)).toEqual([...common, "options"].sort());
    expect(keysOf(numeric)).toEqual([...common, "unit"].sort());
    expect(keysOf(sequence)).toEqual([...common, "items"].sort());
    expect(keysOf(match)).toEqual([...common, "lefts", "rights"].sort());
    expect(keysOf(program)).toEqual([...common, "allowed", "grid", "maxBlocks"].sort());
    expect(keysOf(projectile)).toEqual([...common, "sim"].sort());
    expect(keysOf(lever)).toEqual([...common, "sim"].sort());
    for (const ch of all) {
      const json = JSON.stringify(toPublicChallenge(ch, "seed"));
      expect(json, ch.id).not.toMatch(FEEDBACK_SECRETS);
      for (const key of ["correctOptionId", "commonMistakes", "explanation", "solution", "feedback", "answer", "pairs", "hint"]) expect(json, `${ch.id} ${key}`).not.toContain(`"${key}":`);
    }
    // the margin of a number is part of the answer key; a physics puzzle's target and margin are the puzzle itself, shown by design
    expect(JSON.stringify(toPublicChallenge(numeric, "seed"))).not.toContain("tolerance");
    expect(toPublicChallenge(projectile, "seed")).toMatchObject({ sim: { kind: "projectile", targetDistance: 40, maxSpeed: 30 } });
  });

  it("a time limit is carried over, and hasHint says only whether a hint exists", () => {
    const timed = choiceChallenge.parse({ ...base, id: "c-timed", type: "choice", timeLimitSec: 45, options: [{ id: "a", text: "A", feedback: "f" }, { id: "b", text: "B", feedback: "f" }], correctOptionId: "a" });
    expect(toPublicChallenge(timed, "s")).toMatchObject({ timeLimitSec: 45, hasHint: true });
    const noHint = choiceChallenge.parse({ ...base, hint: undefined, id: "c-nohint", type: "choice", options: [{ id: "a", text: "A", feedback: "f" }, { id: "b", text: "B", feedback: "f" }], correctOptionId: "a" });
    expect(toPublicChallenge(noHint, "s")).toMatchObject({ hasHint: false });
    expect(JSON.stringify(toPublicChallenge(noHint, "s"))).not.toContain("timeLimitSec");
  });

  it("every option, item and side is shown once, with its own text", () => {
    const pubChoice = toPublicChallenge(choice, "seed") as Extract<ReturnType<typeof toPublicChallenge>, { type: "choice" }>;
    expect(pubChoice.options.map((o) => o.text).sort()).toEqual(["Option A", "Option B", "Option C"]);
    const pubSeq = toPublicChallenge(sequence, "seed") as Extract<ReturnType<typeof toPublicChallenge>, { type: "sequence" }>;
    expect(pubSeq.items.map((o) => o.text).sort()).toEqual(["First", "Fourth", "Second", "Third"]);
    const pubMatch = toPublicChallenge(match, "seed") as Extract<ReturnType<typeof toPublicChallenge>, { type: "match" }>;
    expect(pubMatch.lefts.map((l) => l.text)).toEqual(["Cat", "Dog", "Cow"]); // the lefts keep the order of the notes
    expect(pubMatch.rights.map((r) => r.text).sort()).toEqual(["Meow", "Moo", "Woof"]);
  });

  it("a sequence is never shown in its right order, and the rights of a match never line up with the lefts", () => {
    for (let n = 0; n < 300; n++) {
      const seed = `session-${n}`;
      const seq = toPublicChallenge(sequence, seed) as Extract<ReturnType<typeof toPublicChallenge>, { type: "sequence" }>;
      expect(seq.items.map((i) => i.text), seed).not.toEqual(["First", "Second", "Third", "Fourth"]);
      const m = toPublicChallenge(match, seed) as Extract<ReturnType<typeof toPublicChallenge>, { type: "match" }>;
      expect(m.rights.map((r) => r.text), seed).not.toEqual(["Meow", "Woof", "Moo"]);
    }
  });

  it("the same session sees the same question every time, and another session sees different ids", () => {
    expect(toPublicChallenge(choice, "a")).toEqual(toPublicChallenge(choice, "a"));
    expect(toPublicChallenge(sequence, "a")).toEqual(toPublicChallenge(sequence, "a"));
    expect(toPublicChallenge(match, "a")).toEqual(toPublicChallenge(match, "a"));
    expect(toPublicChallenge(choice, "a")).not.toEqual(toPublicChallenge(choice, "b"));
  });

  it("the same challenge id under two sessions gets two id sets: an id learned in one session grades nothing in another", () => {
    const answerInA = toPublicAnswer(choice, { type: "choice", optionId: "b" }, "A");
    expect(gradeAnswer(choice, answerInA, "en", "A").correct).toBe(true);
    expect(gradeAnswer(choice, answerInA, "en", "B")).toEqual({ correct: false, feedback: msg("en", "invalidAnswer") });
  });
});

describe("seededShuffle", () => {
  const items = ["a", "b", "c", "d", "e", "f"];

  it("is a permutation, the same for one seed, and leaves its input alone", () => {
    const copy = [...items];
    const out = seededShuffle(items, "seed");
    expect([...out].sort()).toEqual(copy);
    expect(items).toEqual(copy);
    expect(seededShuffle(items, "seed")).toEqual(out);
  });

  it("different seeds give different orders (not one fixed shuffle)", () => {
    const orders = new Set(Array.from({ length: 50 }, (_, i) => seededShuffle(items, `seed-${i}`).join("")));
    expect(orders.size).toBeGreaterThan(30);
  });

  it("with mustDiffer the order is never the input order (checked over many seeds, four or more items)", () => {
    for (let n = 0; n < 500; n++) expect(seededShuffle(items.slice(0, 4), `m-${n}`, true)).not.toEqual(items.slice(0, 4));
  });

  it("handles an empty and a one-item list", () => {
    expect(seededShuffle([], "s", true)).toEqual([]);
    expect(seededShuffle(["x"], "s", true)).toEqual(["x"]); // no other order exists
  });
});

describe("the engine's own sentences", () => {
  // adding a message key makes this object a type error until it is listed here, so the checks below cover every key
  const KEYS = {
    correct: 1, notQuite: 1, invalidAnswer: 1, seqPartial: 1, seqRight: 1, matchPartial: 1, matchRight: 1, numericClose: 1, numericRight: 1,
    progGoal: 1, progTooMany: 1, progDisallowed: 1, progDeep: 1, progStepLimit: 1, progMissed: 1,
    simProjLong: 1, simProjShort: 1, simProjHit: 1, simLevHeavyLeft: 1, simLevHeavyRight: 1, simLevBalanced: 1, revealed: 1,
  } satisfies Record<MessageKey, 1>;
  const keys = Object.keys(KEYS) as MessageKey[];
  const PARAMS = ["n", "total", "max", "x", "y", "gx", "gy", "d", "r"];
  const probe = Object.fromEntries(PARAMS.map((p) => [p, `«${p}»`]));
  const slots = (text: string) => [...text.matchAll(/«(\w+)»/g)].map((m) => m[1]!).sort();

  it("both interface languages say every message, with the same blanks filled in", () => {
    for (const key of keys) {
      const en = msg("en", key, probe);
      const he = msg("he", key, probe);
      expect(en.length, key).toBeGreaterThan(0);
      expect(he.length, key).toBeGreaterThan(0);
      expect(slots(he), key).toEqual(slots(en));
      expect(en, key).not.toMatch(/[{}]/);
      expect(he, key).not.toMatch(/[{}]/);
    }
  });

  it("the Hebrew is Hebrew, the English is not, and a Hebrew line never has < or > in it (a right-to-left line mirrors them)", () => {
    for (const key of keys) {
      const he = msg("he", key, probe);
      expect(he, key).toMatch(/\p{Script=Hebrew}/u);
      expect(he, key).not.toMatch(/[<>]/);
      expect(msg("en", key, probe), key).not.toMatch(/\p{Script=Hebrew}/u);
    }
  });

  it("a language without a catalogue falls back to English, and a missing parameter is an empty string, never 'undefined'", () => {
    for (const lang of CONTENT_LANGUAGES.filter((l) => l !== "he")) for (const key of keys) expect(msg(lang, key, probe), `${lang} ${key}`).toBe(msg("en", key, probe));
    expect(msg("en", "seqPartial")).toBe(" of  items are in the right place.");
    expect(msg("en", "seqPartial", { n: 0, total: 3 })).toBe("0 of 3 items are in the right place."); // 0 is a number to show, not a missing one
    expect(msg("he", "matchPartial", { n: 2, total: 4 })).toBe("2 מתוך 4 זוגות הותאמו נכון.");
    for (const key of keys) expect(msg("en", key)).not.toMatch(/undefined|null|NaN/);
  });
});
