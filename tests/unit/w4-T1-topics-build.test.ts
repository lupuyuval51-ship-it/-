import { describe, expect, it } from "vitest";
import { generateOffline, OfflineGenerationError } from "@/lib/offline/generate";
import { playGame, SKILLS } from "@/lib/game/sim-balance/bot";
import { hashSeed, mulberry32 } from "@/lib/game/util/prng";
import { playThrough } from "@/lib/game/world/flow";
import { DIFFICULTIES, ENVIRONMENTS, SPEC_LIMITS } from "@/lib/game/spec/constants";
import { TOPIC_MODEL, TOPIC_PROVIDER, TopicError, buildTopicSpec, numberValue, topicRequest, topicRound, topicTitle } from "@/lib/game/topics/build";
import { TOPICS, TOPIC_CATEGORIES, TOPIC_LEVELS, findTopic, isTopicId, topicsIn } from "@/lib/game/topics/catalog";
import type { GenerationRequest } from "@/lib/schemas/generation";
import type { LevelContent, NumberItem, Question, Term, TopicContent } from "@/lib/game/topics/types";

/**
 * Topic library → game, on content written for the test (wave 4, T1). The suites that walk the real catalogue
 * (`topics.test.ts`, `w2-topics-*.test.ts`) prove that every shipped topic builds; these pin the rules of the build itself
 * on content whose shape we control: which kinds of question a Fast Quest and a Full Adventure take and in what order,
 * the easier and harder variants and their caps, how a game splits into areas and missions, what a thin level does
 * (distractors from the other levels, too little content), the language fallback and the honest label.
 */

type Raw = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const EN_WORDS = ["sun", "moon", "star", "cloud", "wind", "rain", "snow", "hail", "sea", "river", "hill", "valley", "lake", "forest", "desert", "island"];
const HE_WORDS = ["שמש", "ירח", "כוכב", "ענן", "רוח", "גשם", "שלג", "ברד", "ים", "נהר", "הר", "עמק", "אגם", "יער", "מדבר", "אי"];

const term = (i: number): Term => [`Term ${EN_WORDS[i]}`, `the idea number ${i + 1} that is shown by the ${EN_WORDS[i]}`, `מושג ${HE_WORDS[i]}`, `הרעיון מספר ${i + 1} שמסמל ${HE_WORDS[i]}`];

/** `wrong` wrong options per question (1–4); the right answer is never the longest, so nothing here depends on option length. */
const question = (i: number, wrong = 4): Question => {
  const w = ["Alpha", "Bravo", "Charlie", "Delta"].slice(0, wrong);
  const x = ["אלף", "בית", "גימל", "דלת"].slice(0, wrong);
  return [
    [`What does the question number ${i + 1} ask about the ${EN_WORDS[i]}?`, `Right ${i + 1}`, w.map((s) => `${s} wrong option ${i + 1}`), `Explanation ${i + 1}: right ${i + 1} is the one that fits the ${EN_WORDS[i]}.`],
    [`מה שואלת שאלה מספר ${i + 1} על ${HE_WORDS[i]}?`, `נכון ${i + 1}`, x.map((s) => `${s} תשובה שגויה ${i + 1}`), `הסבר ${i + 1}: נכון ${i + 1} הוא מה שמתאים ל${HE_WORDS[i]}.`],
  ];
};

const number = (i: number, tolerance?: number): NumberItem => [
  10 * (i + 1),
  [`How many ${EN_WORDS[i]} marks are in lot ${i + 1}?`, "cm", `There are ${10 * (i + 1)} marks, so the answer is ${10 * (i + 1)}.`],
  [`כמה סימני ${HE_WORDS[i]} יש בחבילה ${i + 1}?`, "ס״מ", `יש ${10 * (i + 1)} סימנים, ולכן התשובה היא ${10 * (i + 1)}.`],
  ...(tolerance === undefined ? [] : [tolerance]),
] as unknown as NumberItem;

const ordering = (i: number, steps: number): LevelContent["s"] extends readonly (infer O)[] | undefined ? O : never =>
  [
    [`How the ${EN_WORDS[i]} changes`, ...Array.from({ length: steps }, (_, k) => `Step ${k + 1} of the ${EN_WORDS[i]} change`)],
    [`איך משתנה ${HE_WORDS[i]}`, ...Array.from({ length: steps }, (_, k) => `שלב ${k + 1} של שינוי ${HE_WORDS[i]}`)],
  ] as never;

interface Shape { terms?: number; questions?: number; wrong?: number; numbers?: number; orders?: number; steps?: number; termOffset?: number }
function level(o: Shape): LevelContent {
  const off = o.termOffset ?? 0;
  return {
    t: Array.from({ length: o.terms ?? 0 }, (_, i) => term(off + i)),
    q: Array.from({ length: o.questions ?? 0 }, (_, i) => question(off + i, o.wrong ?? 4)),
    n: Array.from({ length: o.numbers ?? 0 }, (_, i) => number(off + i)),
    s: Array.from({ length: o.orders ?? 0 }, (_, i) => ordering(off + i, o.steps ?? 4)),
  };
}
/** The same content at every level (terms are shared across levels by the distractor logic, so they are offset). */
const rich = (o: Shape = { terms: 6, questions: 6, numbers: 3, orders: 2 }): TopicContent => ({ b: level({ ...o, termOffset: 0 }), i: level({ ...o, termOffset: 6 }), a: level({ ...o, termOffset: 10 }) });

const entry = findTopic("math-fractions")!;
const req = (over: Partial<GenerationRequest> = {}): GenerationRequest => ({
  mode: "FULL", subject: "x", learningGoal: "x", difficulty: "beginner", gameType: "adventure", contentLanguage: "en", topicId: entry.id, ...over,
});
const build = (content: TopicContent, over: Partial<GenerationRequest> = {}, round = 0) => buildTopicSpec(req(over), entry, content, round);
const baseChallenges = (raw: Raw): Raw[] => (raw.challenges as Raw[]).filter((c) => /^c-\d+$/.test(c.id));
const titles = (raw: Raw): string[] => baseChallenges(raw).map((c) => c.title);

describe("numberValue", () => {
  it("reads whole numbers, decimals, fractions, mixed numbers and percentages, with either minus sign", () => {
    const cases: [string, number][] = [
      ["7", 7], ["-7", -7], ["−7", -7], ["2.5", 2.5], ["-2.5", -2.5], ["3/4", 0.75], ["−3/4", -0.75], ["-3/4", -0.75], ["1 1/2", 1.5], ["-1 1/2", -1.5],
      ["0 1/2", 0.5], ["40%", 40], ["40 %", 40], ["  12  ", 12], ["1,200", 1200], ["12,345,678", 12345678], ["5,", 5],
    ];
    for (const [text, value] of cases) expect(numberValue(text), JSON.stringify(text)).toBeCloseTo(value, 12);
  });

  it("is NaN for anything that is not a number, so text options are never sorted as numbers", () => {
    for (const text of ["", "abc", "1,2", ".5", "1..2", "3/", "/4", "1 2", "x = 4", "4 apples", "--3"]) expect(Number.isNaN(numberValue(text)), JSON.stringify(text)).toBe(true);
  });
});

describe("the helpers of the build", () => {
  it("topicTitle follows the language, and topicRound counts the games of that topic at that level", () => {
    expect([topicTitle(entry, "en"), topicTitle(entry, "he")]).toEqual([entry.en[0], entry.he[0]]);
    expect(topicRound([], "t", "beginner")).toBe(0);
    expect(topicRound([{ templateId: "t", difficulty: "beginner" }, { templateId: "t", difficulty: "beginner" }, { templateId: "t", difficulty: "advanced" }, { difficulty: "beginner" }], "t", "beginner")).toBe(2);
  });

  it("topicRequest makes the subject and goal the topic's own, in the game's language, and drops any material", () => {
    const r = req({ subject: "something else entirely", learningGoal: "my own goal", material: undefined, difficulty: "advanced", mode: "FAST", device: "phone", level: "B" });
    const en = topicRequest(r, entry);
    expect([en.subject, en.learningGoal]).toEqual([entry.en[0], entry.en[1]]);
    expect(en).toMatchObject({ difficulty: "advanced", mode: "FAST", device: "phone", level: "B", topicId: entry.id, gameType: "adventure" });
    expect(en.material).toBeUndefined();
    const he = topicRequest({ ...r, contentLanguage: "he" }, entry);
    expect([he.subject, he.learningGoal]).toEqual([entry.he[0], entry.he[1]]);
    // a language the library does not have gets the English text
    expect(topicRequest({ ...r, contentLanguage: "es" }, entry).subject).toBe(entry.en[0]);
    expect(topicRequest({ ...r, material: "notes that must not survive" }, entry).material).toBeUndefined();
  });

  it("topicRequest clips a long title and goal to what the request schema allows", () => {
    const long = { ...entry, en: ["T".repeat(300), "G".repeat(900)] as const, he: entry.he };
    const out = topicRequest(req(), long);
    expect(out.subject.length).toBeLessThanOrEqual(120);
    expect(out.learningGoal.length).toBeLessThanOrEqual(320);
  });

  it("the provenance constants say what the label says: the topic library, curated content, never a model", () => {
    expect(TOPIC_PROVIDER).toBe("topic-library");
    expect(TOPIC_MODEL).toBe("curated-content");
  });
});

describe("what a Fast Quest and a Full Adventure take", () => {
  it("a Fast Quest is four challenges in one area with no matching; a Full Adventure is ten in two areas, matching included", () => {
    const fast = build(rich(), { mode: "FAST" });
    expect(baseChallenges(fast.raw)).toHaveLength(4);
    expect(baseChallenges(fast.raw).some((c) => c.type === "match")).toBe(false);
    expect(fast.raw.areas).toHaveLength(1);
    expect(fast.stats.placed).toBe(4);

    const full = build(rich(), { mode: "FULL" });
    expect(baseChallenges(full.raw)).toHaveLength(10);
    expect(baseChallenges(full.raw).filter((c) => c.type === "match")).toHaveLength(1);
    expect(full.raw.areas).toHaveLength(2);
    expect(full.stats.placed).toBe(10);
  });

  it("the kinds rotate (terms by description, a question, a number, terms by term, an ordering, a question, a match) so a game is never one long quiz", () => {
    const full = build(rich(), { mode: "FULL" });
    expect(titles(full.raw).slice(0, 7)).toEqual(["Name the term", "Question", "Work it out", "What does it mean?", "Put in order", "Question", "Match the terms"]);
    expect(baseChallenges(full.raw).slice(0, 7).map((c) => c.type)).toEqual(["choice", "choice", "numeric", "choice", "sequence", "choice", "match"]);
    // the same in Hebrew
    expect(titles(build(rich(), { mode: "FULL", contentLanguage: "he" }).raw).slice(0, 7)).toEqual(["איך קוראים לזה?", "שאלה", "חשבו", "מה זה אומר?", "סדרו לפי הסדר", "שאלה", "התאימו את המושגים"]);
  });

  it("a level with only questions is still a game, made of questions; with fewer than three items it is refused", () => {
    const onlyQ = (n: number): TopicContent => ({ b: level({ questions: n }), i: level({ questions: n }), a: level({ questions: n }) });
    const ten = build(onlyQ(12), { mode: "FULL" });
    expect(titles(ten.raw)).toEqual(Array(10).fill("Question"));
    expect(baseChallenges(build(onlyQ(3), { mode: "FAST" }).raw)).toHaveLength(3);
    for (const n of [0, 1, 2]) {
      const err = (() => { try { build(onlyQ(n), { mode: "FAST" }); } catch (e) { return e; } })();
      expect(err, `${n} questions`).toBeInstanceOf(TopicError);
      expect((err as TopicError).code).toBe("TOO_LITTLE");
      expect((err as TopicError).message).toContain(entry.id);
      expect((err as TopicError).message).toContain("beginner");
    }
  });

  it("only the chosen level counts: three questions at the beginner level do not help an advanced game", () => {
    const content: TopicContent = { b: level({ questions: 8 }), i: level({ questions: 8 }), a: level({ questions: 2 }) };
    expect(() => build(content, { difficulty: "advanced", mode: "FAST" })).toThrow(TopicError);
    expect(() => build(content, { difficulty: "beginner", mode: "FAST" })).not.toThrow();
  });

  it("the game's own limits stand: an unusually rich topic still makes at most 24 challenges, 8 stations per area", () => {
    const huge = rich({ terms: 12, questions: 14, numbers: 12, orders: 6 });
    for (const mode of ["FAST", "FULL"] as const) for (const difficulty of DIFFICULTIES) {
      const raw = build(huge, { mode, difficulty }).raw;
      expect(raw.challenges.length, `${mode}/${difficulty}`).toBeLessThanOrEqual(SPEC_LIMITS.challenges);
      for (const a of raw.areas as Raw[]) expect(a.stations.length, `${mode}/${difficulty}`).toBeLessThanOrEqual(SPEC_LIMITS.stationsPerArea);
    }
  });

  it("a Full Adventure with fewer than six challenges is one area, and says so", () => {
    const five = build({ b: level({ questions: 5 }), i: level({ questions: 5 }), a: level({ questions: 5 }) }, { mode: "FULL" });
    expect(baseChallenges(five.raw)).toHaveLength(5);
    expect(five.raw.areas).toHaveLength(1);
    expect(five.raw.areas[0].portal).toBeUndefined();
    expect(five.raw.mechanics).not.toContain("portals");
    expect(five.notes).toContain("This level has enough content for one area.");
    expect(build(rich(), { mode: "FULL" }).notes).not.toContain("This level has enough content for one area.");
  });
});

describe("terms and their distractors", () => {
  it("a level with one term of its own draws its wrong options from the other levels, and never offers the term as its own distractor", () => {
    const thin: TopicContent = {
      b: { ...level({ questions: 6 }), t: [term(0)] },
      i: { ...level({ questions: 6 }), t: [term(1), term(2), term(3), term(4)] },
      a: level({ questions: 6 }),
    };
    const raw = build(thin, { mode: "FAST" }).raw;
    const name = baseChallenges(raw).find((c) => c.title === "Name the term" || c.title === "What does it mean?");
    expect(name, "the one term at this level is still asked").toBeDefined();
    const texts = (name!.options as Raw[]).map((o) => o.text as string);
    expect(new Set(texts).size).toBe(texts.length);
    expect(texts.length).toBeGreaterThanOrEqual(3);
  });

  it("with fewer than three terms in the whole topic no term question is made (there is nothing to tell them apart from)", () => {
    const two: TopicContent = { b: { ...level({ questions: 8, numbers: 3 }), t: [term(0), term(1)] }, i: level({ questions: 8, numbers: 3 }), a: level({ questions: 8, numbers: 3 }) };
    const raw = build(two, { mode: "FULL" }).raw;
    expect(titles(raw).some((t) => /Name the term|What does it mean|Match the terms/.test(t))).toBe(false);
  });

  it("matching needs three terms that fit on a card, takes at most five, and a term that is too long is left out", () => {
    const withTerms = (terms: Term[]): TopicContent => ({ b: { ...level({ questions: 8 }), t: terms }, i: level({ questions: 8 }), a: level({ questions: 8 }) });
    const matches = (terms: Term[]) => baseChallenges(build(withTerms(terms), { mode: "FULL" }).raw).filter((c) => c.type === "match");
    expect(matches([0, 1, 2, 3, 4, 5, 6].map(term))[0]!.pairs).toHaveLength(5);
    expect(matches([0, 1, 2].map(term))[0]!.pairs).toHaveLength(3);
    const longMeaning = (i: number): Term => [`Term ${EN_WORDS[i]}`, "m".repeat(141), `מושג ${HE_WORDS[i]}`, "פירוש"];
    expect(matches([term(0), term(1), longMeaning(2), longMeaning(3)])).toEqual([]); // only two fit
    expect(matches([term(0), term(1), longMeaning(2), term(3)])[0]!.pairs).toHaveLength(3);
  });

  it("a Fast Quest never matches, whatever the content", () => {
    for (const difficulty of DIFFICULTIES) expect(baseChallenges(build(rich(), { mode: "FAST", difficulty }).raw).some((c) => c.type === "match")).toBe(false);
  });
});

describe("the easier and harder versions", () => {
  it("a question with three or more wrong options has a two-option warm-up (level 1, no hint), one with four a five-option challenge (level 3)", () => {
    const raw = build(rich({ questions: 8, wrong: 4 }), { mode: "FULL" }).raw;
    const by = new Map((raw.challenges as Raw[]).map((c) => [c.id as string, c]));
    let easy = 0, hard = 0;
    for (const c of baseChallenges(raw)) {
      if (c.easierId) {
        easy++;
        const e = by.get(c.easierId)!;
        expect(e.id).toBe(`${c.id}-easy`);
        expect(e.level).toBe(1);
        expect(e.type).toBe(c.type);
        expect(e.hint).toBeUndefined();
        expect(e.easierId ?? e.harderId).toBeUndefined();
        if (c.type === "choice") {
          expect(e.options).toHaveLength(2);
          const right = (c.options as Raw[]).find((o) => o.id === c.correctOptionId)!.text;
          expect((e.options as Raw[]).find((o) => o.id === e.correctOptionId)!.text).toBe(right);
          expect((e.options as Raw[]).map((o) => o.id)).toEqual(["a", "b"]);
        }
      }
      if (c.harderId) {
        hard++;
        const h = by.get(c.harderId)!;
        expect(h.id).toBe(`${c.id}-hard`);
        expect(h.level).toBe(3);
        expect(h.options).toHaveLength(5);
        expect(h.prompt).toBe(c.prompt);
      }
    }
    expect(easy).toBeGreaterThan(0);
    expect(hard).toBeGreaterThan(0);
  });

  it("no game gets more than six warm-ups or three challenges, and the adaptive mechanic is on exactly when there are variants", () => {
    const many = build(rich({ terms: 10, questions: 12, wrong: 4, numbers: 2, orders: 2, steps: 5 }), { mode: "FULL" });
    const variants = (many.raw.challenges as Raw[]).filter((c) => /-(easy|hard)$/.test(c.id));
    expect(variants.filter((c) => c.id.endsWith("-easy")).length).toBeLessThanOrEqual(6);
    expect(variants.filter((c) => c.id.endsWith("-hard")).length).toBeLessThanOrEqual(3);
    expect(variants.filter((c) => c.id.endsWith("-easy")).length).toBe(6);
    expect(variants.filter((c) => c.id.endsWith("-hard")).length).toBe(3);
    expect(many.stats.variants).toBe(variants.length);
    expect(many.raw.mechanics).toContain("adaptive_difficulty");

    // one wrong option each: no warm-up (it would be the question itself) and no challenge
    const bare = build({ b: level({ questions: 5, wrong: 1 }), i: level({ questions: 5, wrong: 1 }), a: level({ questions: 5, wrong: 1 }) }, { mode: "FAST" });
    expect(bare.stats.variants).toBe(0);
    expect(bare.raw.mechanics).not.toContain("adaptive_difficulty");
    expect(baseChallenges(bare.raw).every((c) => !c.easierId && !c.harderId)).toBe(true);
  });

  it("every variant is placed nowhere and every base challenge is placed exactly once", () => {
    const raw = build(rich({ terms: 8, questions: 10, wrong: 4, numbers: 3, orders: 3, steps: 5 }), { mode: "FULL" }).raw;
    const placed = (raw.areas as Raw[]).flatMap((a) => a.stations as Raw[]).filter((s) => s.kind === "challenge").map((s) => s.challengeId as string);
    expect(new Set(placed).size).toBe(placed.length);
    expect(placed.sort()).toEqual(baseChallenges(raw).map((c) => c.id as string).sort());
  });

  it("an ordering of four or more steps has a three-step warm-up (the first, the middle and the last), one of three steps has none", () => {
    for (const [steps, expected] of [[4, [0, 1, 3]], [5, [0, 2, 4]], [6, [0, 2, 5]]] as const) {
      const raw = build(rich({ orders: 3, steps, questions: 4, terms: 6 }), { mode: "FULL" }).raw;
      const seq = baseChallenges(raw).find((c) => c.type === "sequence")!;
      const easy = (raw.challenges as Raw[]).find((c) => c.id === seq.easierId)!;
      expect(easy, `${steps} steps`).toBeDefined();
      expect(easy.level).toBe(1);
      expect((easy.items as Raw[]).map((i) => i.text), `${steps} steps`).toEqual(expected.map((k) => (seq.items as Raw[])[k]!.text));
    }
    const three = build(rich({ orders: 3, steps: 3, questions: 4, terms: 6 }), { mode: "FULL" }).raw;
    expect(baseChallenges(three).filter((c) => c.type === "sequence").every((c) => !c.easierId)).toBe(true);
  });

  it("numbers keep their tolerance and unit; with no hint of its own the hint is a range that contains the answer", () => {
    const content: TopicContent = { b: { ...level({ questions: 4 }), n: [number(0, 0.5), number(1)] }, i: level({ questions: 4, numbers: 2 }), a: level({ questions: 4, numbers: 2 }) };
    const nums = baseChallenges(build(content, { mode: "FULL" }).raw).filter((c) => c.type === "numeric");
    expect(nums.map((c) => c.tolerance).sort()).toEqual([0, 0.5]);
    for (const c of nums) {
      expect(c.unit).toBe("cm");
      const [lo, hi] = (c.hint as string).match(/-?\d+/g)!.map(Number);
      expect(c.answer).toBeGreaterThan(lo!);
      expect(c.answer).toBeLessThan(hi!);
    }
  });
});

describe("how a game splits into areas and missions", () => {
  const raw = build(rich(), { mode: "FULL" }).raw;
  const areas = raw.areas as Raw[];
  const missions = raw.missions as Raw[];

  it("the first area has the first half of the challenges, the second the rest, and a portal opens after the first area's second mission", () => {
    expect(areas.map((a) => a.id)).toEqual(["a-1", "a-2"]);
    const stationsOf = (a: Raw) => (a.stations as Raw[]).filter((s) => s.kind === "challenge").map((s) => s.challengeId);
    const all = baseChallenges(raw).map((c) => c.id);
    expect(stationsOf(areas[0]!)).toEqual(all.slice(0, 5));
    expect(stationsOf(areas[1]!)).toEqual(all.slice(5));
    expect(areas[0]!.portal).toMatchObject({ toAreaId: "a-2", requiresMissionIds: ["m-1-2"] });
    expect(areas[1]!.portal).toBeUndefined();
    expect(raw.mechanics).toContain("portals");
    expect(areas.map((a) => a.layout)).toEqual(["plaza", "rooms"]);
  });

  it("each area has a warm-up and a 'go deeper' mission; the second area's warm-up waits for the first area's last mission", () => {
    expect(missions.map((m) => m.id)).toEqual(["m-1-1", "m-1-2", "m-2-1", "m-2-2"]);
    expect(missions.map((m) => m.requires)).toEqual([[], ["m-1-1"], ["m-1-2"], ["m-2-1"]]);
    expect(missions.map((m) => m.areaId)).toEqual(["a-1", "a-1", "a-2", "a-2"]);
  });

  it("every challenge is in exactly one solve objective, each objective names at most six, and gems and boards are asked for sensibly", () => {
    const solved = missions.flatMap((m) => (m.objectives as Raw[]).filter((o) => o.type === "solve").flatMap((o) => o.challengeIds as string[]));
    expect(solved.sort()).toEqual(baseChallenges(raw).map((c) => c.id as string).sort());
    for (const m of missions) for (const o of m.objectives as Raw[]) if (o.type === "solve") expect(o.challengeIds.length).toBeLessThanOrEqual(6);
    for (const a of areas) {
      const count = a.collectibles.count as number;
      expect(count).toBeGreaterThanOrEqual(2);
      expect(count).toBeLessThanOrEqual(5);
      const m2 = missions.find((m) => m.id === `m-${(a.id as string).slice(2)}-2`)!;
      expect((m2.objectives as Raw[]).find((o) => o.type === "collect")!.count).toBe(Math.min(2, count));
    }
    // the guide is met in the warm-up, and has someone to be: one NPC with lines in each area
    for (const a of areas) {
      expect(a.npcs).toHaveLength(1);
      expect((missions.find((m) => m.areaId === a.id && m.id.endsWith("-1"))!.objectives as Raw[]).some((o) => o.type === "talk" && o.npcId === a.npcs[0].id)).toBe(true);
    }
  });

  it("a Fast Quest has one area, no portal, and its missions end the game", () => {
    const fast = build(rich(), { mode: "FAST" }).raw;
    expect(fast.areas).toHaveLength(1);
    expect(fast.areas[0].portal).toBeUndefined();
    expect((fast.missions as Raw[]).map((m) => m.id)).toEqual(["m-1-1", "m-1-2"]);
  });

  it("the game rises within the level: a gentle start and a harder finish, and never beyond level 3 or below 1", () => {
    for (const difficulty of DIFFICULTIES) for (const mode of ["FAST", "FULL"] as const) {
      const levels = baseChallenges(build(rich(), { mode, difficulty }).raw).map((c) => c.level as number);
      const base = { beginner: 1, intermediate: 2, advanced: 3 }[difficulty];
      levels.forEach((l, i) => {
        expect(l, `${difficulty}/${mode}/#${i}`).toBeGreaterThanOrEqual(1);
        expect(l).toBeLessThanOrEqual(3);
        if (i > 0) expect(l, `${difficulty}/${mode}: levels never fall`).toBeGreaterThanOrEqual(levels[i - 1]!);
      });
      expect(levels.at(-1), `${difficulty}/${mode}`).toBe(Math.min(3, base + 1));
      // a Full Adventure also starts below the level it is named after (when there is room below)
      expect(levels[0], `${difficulty}/${mode}`).toBe(mode === "FULL" ? Math.max(1, base - 1) : base);
    }
  });
});

describe("language and labels", () => {
  it("a Hebrew game is Hebrew from the title to the guide's lines, and an English one has no Hebrew in it", () => {
    const he = build(rich(), { contentLanguage: "he" }).raw;
    const en = build(rich(), { contentLanguage: "en" }).raw;
    const own = (raw: Raw) => JSON.stringify([raw.meta, raw.learning, raw.areas.map((a: Raw) => [a.name, a.description, a.intro, a.npcs.map((n: Raw) => [n.name, n.lines]), a.stations.map((s: Raw) => s.label)]), raw.missions.map((m: Raw) => [m.title, m.story])]);
    expect(he.meta.language).toBe("he");
    expect(he.meta.title).toBe(entry.he[0]);
    expect(/\p{Script=Hebrew}/u.test(own(he))).toBe(true);
    expect(en.meta.language).toBe("en");
    expect(en.meta.title).toBe(entry.en[0]);
    expect(/\p{Script=Hebrew}/u.test(own(en)), "English game text").toBe(false);
  });

  it("a language the library does not have is built in English and the learner is told", () => {
    for (const lang of ["es", "fr", "ar", "de", "ru"] as const) {
      const built = build(rich(), { contentLanguage: lang });
      expect(built.raw.meta.language, lang).toBe("en");
      expect(built.notes.some((n) => n.includes(`English was used instead of "${lang}"`)), lang).toBe(true);
    }
    for (const lang of ["en", "he"] as const) expect(build(rich(), { contentLanguage: lang }).notes.some((n) => n.includes("instead of")), lang).toBe(false);
  });

  it("every game says it is made from the curated library and not by AI, in its own language", () => {
    expect(build(rich(), { contentLanguage: "en" }).notes[0]).toContain("not by AI");
    expect(build(rich(), { contentLanguage: "he" }).notes[0]).toContain("לא בבינה מלאכותית");
  });

  it("through the whole pipeline the game is labelled a topic-library game, with the topic as its template and never as AI", () => {
    const { spec } = generateOffline(req({ mode: "FAST" }), new Date(0), "A", rich());
    expect(spec.meta.generator).toMatchObject({ kind: "catalog", provider: TOPIC_PROVIDER, model: TOPIC_MODEL, templateId: entry.id, mode: "FAST" });
    expect(spec.meta.generator?.kind).not.toBe("ai");
    expect(spec.meta.subject).toBe(entry.en[0]);
  });

  it("a topic that is too thin is refused as an invalid build, not as a crash", () => {
    const thin: TopicContent = { b: level({ questions: 2 }), i: level({ questions: 2 }), a: level({ questions: 2 }) };
    const err = (() => { try { generateOffline(req({ mode: "FAST" }), new Date(0), "A", thin); } catch (e) { return e; } })();
    expect(err).toBeInstanceOf(OfflineGenerationError);
    expect((err as OfflineGenerationError).code).toBe("INVALID_OUTPUT");
  });

  it("the whole pipeline accepts the test content at every level in both languages (so these checks are about a real game)", () => {
    for (const difficulty of DIFFICULTIES) for (const contentLanguage of ["en", "he"] as const) for (const mode of ["FAST", "FULL"] as const) {
      const { spec } = generateOffline(req({ difficulty, contentLanguage, mode }), new Date(0), "A", rich());
      expect(spec.challenges.length, `${difficulty}/${contentLanguage}/${mode}`).toBeGreaterThanOrEqual(4);
      expect(spec.meta.difficulty).toBe(difficulty);
    }
  });
});

describe("rounds", () => {
  it("round 0 is what the game was before rounds existed, and a round changes the questions, not the shape", () => {
    const content = rich({ terms: 6, questions: 12, wrong: 3, numbers: 6, orders: 3 });
    const first = build(content, { mode: "FAST" }, 0);
    const again = build(content, { mode: "FAST" }, 0);
    expect(again.raw).toEqual(first.raw);
    const second = build(content, { mode: "FAST" }, 1);
    expect(baseChallenges(second.raw)).toHaveLength(baseChallenges(first.raw).length);
    expect(second.raw.areas).toHaveLength(first.raw.areas.length);
    expect(baseChallenges(second.raw).map((c) => c.prompt)).not.toEqual(baseChallenges(first.raw).map((c) => c.prompt));
  });
});

describe("the catalogue's helpers", () => {
  it("isTopicId accepts the catalogue's ids only: no other string, no property of Object, no non-string", () => {
    for (const t of TOPICS.slice(0, 40)) expect(isTopicId(t.id)).toBe(true);
    for (const bad of ["", "nope", "MATH-FRACTIONS", " math-fractions", "constructor", "__proto__", "toString", "hasOwnProperty", "../math-fractions", null, undefined, 7, {}, ["math-fractions"]]) {
      expect(isTopicId(bad), JSON.stringify(bad)).toBe(false);
    }
  });

  it("topicsIn is the category's topics in catalogue order, and the categories together are the whole catalogue", () => {
    const seen: string[] = [];
    for (const cat of TOPIC_CATEGORIES) {
      const list = topicsIn(cat);
      expect(list.length, cat).toBeGreaterThanOrEqual(25);
      expect(list.every((t) => t.cat === cat), cat).toBe(true);
      expect(list.map((t) => t.id), cat).toEqual(TOPICS.filter((t) => t.cat === cat).map((t) => t.id));
      seen.push(...list.map((t) => t.id));
    }
    expect(seen.sort()).toEqual(TOPICS.map((t) => t.id).sort());
  });

  it("the levels every topic has are the three the game offers, in order", () => {
    expect([...TOPIC_LEVELS]).toEqual([...DIFFICULTIES]);
  });
});

describe("every catalogue row builds into a world of its own", () => {
  it("each topic's category and optional world override end up as a real environment (and its category as the game's subject category)", () => {
    const content = rich();
    const seen = new Set<string>();
    for (const t of TOPICS) {
      const raw = buildTopicSpec(req({ topicId: t.id, mode: "FAST" }), t, content).raw;
      expect(ENVIRONMENTS, t.id).toContain(raw.theme.environment);
      if (t.env) expect(raw.theme.environment, t.id).toBe(t.env);
      expect(typeof raw.meta.subjectCategory, t.id).toBe("string");
      seen.add(raw.theme.environment);
    }
    // the categories do not all share one world
    expect(seen.size).toBeGreaterThanOrEqual(4);
  });
});

describe("content of any shape", () => {
  /** Content with a random number of terms, questions (1–4 wrong options each), numbers and orderings at every level. */
  function randomContent(rnd: () => number): { content: TopicContent; items: Record<"b" | "i" | "a", number> } {
    const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
    let n = 0;
    const items = { b: 0, i: 0, a: 0 };
    const lv = (key: "b" | "i" | "a"): LevelContent => {
      const t = Array.from({ length: int(0, 8) }, () => { const k = n++; return [`Term ${EN_WORDS[k % 16]} ${k}`, `the idea ${k} shown by the ${EN_WORDS[k % 16]}`, `מושג ${HE_WORDS[k % 16]} ${k}`, `הרעיון ${k} שמסמל ${HE_WORDS[k % 16]}`] as Term; });
      const q = Array.from({ length: int(0, 10) }, () => { const k = n++; const w = int(1, 4); return [
        [`What is question ${k} about ${EN_WORDS[k % 16]}?`, `Right ${k}`, ["Alpha", "Bravo", "Charlie", "Delta"].slice(0, w).map((x) => `${x} wrong ${k}`), `Explanation ${k}: right ${k} fits the ${EN_WORDS[k % 16]}.`],
        [`מה שאלה ${k} על ${HE_WORDS[k % 16]}?`, `נכון ${k}`, ["אלף", "בית", "גימל", "דלת"].slice(0, w).map((x) => `${x} שגוי ${k}`), `הסבר ${k}: נכון ${k} מתאים ל${HE_WORDS[k % 16]}.`],
      ] as unknown as Question; });
      const num = Array.from({ length: int(0, 4) }, () => { const k = n++; const a = int(-50, 500); return [a, [`How many ${EN_WORDS[k % 16]} ${k}?`, rnd() < 0.5 ? "cm" : "", `There are ${a} of them, so ${a}.`], [`כמה ${HE_WORDS[k % 16]} ${k}?`, rnd() < 0.5 ? "" : "", `יש ${a} מהם, לכן ${a}.`], ...(rnd() < 0.5 ? [int(0, 3)] : [])] as unknown as NumberItem; });
      const s = Array.from({ length: int(0, 3) }, () => { const k = n++; const steps = int(3, 6); return [
        [`Order ${k} of ${EN_WORDS[k % 16]}`, ...Array.from({ length: steps }, (_, x) => `Step ${x + 1} of ${EN_WORDS[k % 16]} ${k}`)],
        [`סדר ${k} של ${HE_WORDS[k % 16]}`, ...Array.from({ length: steps }, (_, x) => `שלב ${x + 1} של ${HE_WORDS[k % 16]} ${k}`)],
      ] as never; });
      // the he number units must match the en ones (both or neither): make them agree
      for (const x of num as unknown as [number, string[], string[]][]) x[2][1] = x[1][1]! ? "ס״מ" : "";
      items[key] = q.length + num.length + s.length;
      return { t, q, n: num, s } as LevelContent;
    };
    return { content: { b: lv("b"), i: lv("i"), a: lv("a") }, items };
  }

  it("builds a valid game that can be finished, or is refused as too thin and nothing else: never a crash, never an invalid game", () => {
    const rnd = mulberry32(hashSeed("t1-topic-content-fuzz"));
    const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
    let built = 0, refused = 0;
    for (let k = 0; k < 400; k++) {
      const { content, items } = randomContent(rnd);
      const difficulty = DIFFICULTIES[int(0, 2)]!;
      const key = { beginner: "b", intermediate: "i", advanced: "a" }[difficulty] as "b" | "i" | "a";
      const mode = rnd() < 0.5 ? "FAST" : "FULL";
      const contentLanguage = rnd() < 0.5 ? "he" : "en";
      const round = int(0, 3);
      const tag = `#${k} ${difficulty}/${mode}/${contentLanguage}/r${round} (${items[key]} questions, numbers and orderings)`;
      let spec;
      try {
        spec = generateOffline(req({ difficulty, mode, contentLanguage, ...(rnd() < 0.3 ? { device: "phone" as const } : {}) }), new Date(0), "A", content, round).spec;
      } catch (e) {
        expect(e, tag).toBeInstanceOf(OfflineGenerationError);
        expect((e as Error).message, `${tag}: refused for a reason other than too little content`).toMatch(/too little content/);
        // a level with three or more questions, numbers or orderings always has enough
        expect(items[key], `${tag}: refused although it has enough`).toBeLessThan(3);
        refused++;
        continue;
      }
      built++;
      expect(playThrough(spec).finished, tag).toBe(true);
      if (k % 8 === 0) {
        // (the stars a flawless player earns are checked on the real catalogue in `w4-T1-sim-balance.test.ts`)
        const perfect = playGame(spec, SKILLS.find((x) => x.id === "perfect")!, `fuzz${k}`);
        expect({ finished: perfect.finished, rejected: perfect.rejected, revealed: perfect.revealed, overMax: perfect.score > perfect.maxScore }, `${tag}: a flawless player`).toEqual({ finished: true, rejected: 0, revealed: 0, overMax: false });
        expect(perfect.stars, `${tag}: a finished game is never worth nothing`).toBeGreaterThanOrEqual(1);
      }
    }
    expect(built).toBeGreaterThan(300);
    expect(refused).toBeGreaterThan(0);
  }, 120_000);
});
