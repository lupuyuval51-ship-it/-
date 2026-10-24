import { describe, expect, it } from "vitest";
import { answerSchema, gradeAnswer, toPublicAnswer } from "@/lib/game/challenges/grade";
import { playGame, rightAnswer, SKILLS, wrongAnswerFor, type PlayResult, type Skill } from "@/lib/game/sim-balance/bot";
import { demoCorpus, engineCorpus, fuzzCorpus, type CorpusItem } from "@/lib/game/sim-balance/corpus";
import { findOutliers, median, SEEDS, simulate, TARGETS, type Row } from "@/lib/game/sim-balance/run";
import { CHALLENGE_TYPES } from "@/lib/game/spec/constants";
import { generateOffline } from "@/lib/offline/generate";
import { TOPICS } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { Challenge, GameSpec } from "@/lib/game/spec/schema";
import { starsFor } from "@/lib/game/state/progress";
import { mulberry32 } from "@/lib/game/util/prng";
import { validDemoSpec } from "./helpers";

/**
 * The balance simulation (wave 4, T1). `balance.test.ts` and `w2-misc-game-*.test.ts` assert that the corpus has no
 * outliers; these tests make sure the machinery that says so can say the opposite: every outlier rule fires, a row with no
 * runs is not clean, the bots' right and wrong answers are what the grader says they are for every kind of challenge in the
 * corpus, and the bots' clock follows the real world they walk through.
 */

const skill = (id: string): Skill => SKILLS.find((s) => s.id === id)!;

describe("median", () => {
  it("is 0 for nothing, the middle of an odd list and the mean of the two middle values of an even one", () => {
    expect(median([])).toBe(0);
    expect(median([7])).toBe(7);
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([5, 5, 9, 9])).toBe(7);
    expect(median([-3, -1])).toBe(-2);
  });

  it("sorts numerically (not as text) and leaves its input alone", () => {
    const xs = [10, 9, 100, 1];
    expect(median(xs)).toBe(9.5);
    expect(xs).toEqual([10, 9, 100, 1]);
  });
});

describe("the skills", () => {
  it("have unique ids, real probabilities and the three the outlier rules look up", () => {
    expect(new Set(SKILLS.map((s) => s.id)).size).toBe(SKILLS.length);
    for (const id of ["perfect", "p70", "p40"]) expect(SKILLS.some((s) => s.id === id), `findOutliers reads the ${id} runs`).toBe(true);
    for (const s of SKILLS) {
      for (const p of [s.pFirst, s.pRetry, s.pHint, s.pCollect]) expect(p >= 0 && p <= 1, s.id).toBe(true);
      expect(s.pace, s.id).toBeGreaterThan(0);
    }
  });

  it("a perfect player never errs, hints or skips a gem; a weaker player is weaker on every count", () => {
    expect(skill("perfect")).toMatchObject({ pFirst: 1, pRetry: 1, pHint: 0, pCollect: 1 });
    const [p, a, b] = ["perfect", "p70", "p40"].map(skill) as [Skill, Skill, Skill];
    expect(p.pFirst).toBeGreaterThan(a.pFirst);
    expect(a.pFirst).toBeGreaterThan(b.pFirst);
    expect(a.pRetry).toBeGreaterThan(b.pRetry);
    expect(b.pHint).toBeGreaterThan(a.pHint);
    expect(b.pCollect).toBeLessThan(a.pCollect);
    expect(b.pace).toBeGreaterThan(a.pace);
    expect(a.pace).toBeGreaterThan(p.pace);
  });

  it("exactly one skill walks through a portal the moment it opens", () => {
    expect(SKILLS.filter((s) => s.eager).map((s) => s.id)).toEqual(["rusher"]);
  });
});

describe("simulate", () => {
  const spec = validDemoSpec({ mode: "FAST" });
  const item: CorpusItem = { id: "g", kind: "demo", lang: "en", mode: "FAST", spec };

  it("plays every item with every skill and every seed, skill by skill, and defaults to the five shared seeds", () => {
    expect(SEEDS).toEqual(["a", "b", "c", "d", "e"]);
    const rows = simulate([item], ["a", "b"]);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.item).toBe(item);
    expect(rows[0]!.runs.map((r) => r.skill)).toEqual(SKILLS.flatMap((s) => [s.id, s.id]));
    expect(simulate([], ["a"])).toEqual([]);
  });

  it("is the same on every call, and a different seed is a different play", () => {
    const a = simulate([item], ["a"]);
    expect(simulate([item], ["a"])).toEqual(a);
    expect(simulate([item], ["z"])[0]!.runs.map((r) => r.score)).not.toEqual(a[0]!.runs.map((r) => r.score));
  });
});

// ───────────────────────────── findOutliers: every rule fires, and only when it should ─────────────────────────────

describe("findOutliers", () => {
  const spec = validDemoSpec({ mode: "FULL" });
  const run = (id: string, minutes: number, over: Partial<PlayResult> = {}): PlayResult => ({
    skill: id, finished: true, stuck: false, events: 40, rejected: 0, seconds: minutes * 60, minutes, score: 900, maxScore: 1000, percent: 0.9,
    stars: 3, revealed: 0, challengesPlayed: 8, attempts: 8, hints: 0, achievements: [], ...over,
  });
  const withEstimate = (estimatedMinutes: number): GameSpec => ({ ...structuredClone(spec), meta: { ...spec.meta, estimatedMinutes } });
  /** One game with the declared `est` minutes: p70 takes `p70` minutes, the others the given (or sensible) minutes. */
  const row = (o: { mode?: "FAST" | "FULL"; est?: number; p70?: number; perfect?: number; p40?: number; extra?: Partial<Record<string, Partial<PlayResult>[]>> } = {}): Row => {
    const mode = o.mode ?? "FULL";
    const est = o.est ?? 12;
    const p70 = o.p70 ?? est;
    const perfect = o.perfect ?? p70 * 0.8;
    const p40 = o.p40 ?? p70 * 1.2;
    const extra = o.extra ?? {};
    return {
      item: { id: "game-x", kind: "demo", lang: "en", mode, spec: withEstimate(est) },
      runs: [
        ...(extra.perfect ?? [{}]).map((e) => run("perfect", perfect, e)),
        ...(extra.p70 ?? [{}]).map((e) => run("p70", p70, e)),
        ...(extra.p40 ?? [{}]).map((e) => run("p40", p40, { stars: 2, percent: 0.7, ...e })),
        ...(extra.rusher ?? [{}]).map((e) => run("rusher", p70, e)),
      ],
    };
  };
  const problems = (r: Row[]) => findOutliers(r).map((o) => o.problem);

  it("a well-balanced game is clean, and an empty corpus is clean", () => {
    expect(findOutliers([row()])).toEqual([]);
    expect(findOutliers([])).toEqual([]);
  });

  it("reports a bot that ran out of moves, with its skill and why", () => {
    const out = findOutliers([row({ extra: { rusher: [{ finished: false, stuck: true, stuckReason: "open missions: m-2", stars: 0 }] } })]);
    expect(out).toContainEqual({ id: "game-x", problem: "stuck (rusher): open missions: m-2" });
  });

  it("reports rejected events, added up over every run", () => {
    expect(problems([row({ extra: { p70: [{ rejected: 2 }, { rejected: 3 }], p40: [{ rejected: 1 }] } })])).toContain("6 rejected event(s): the bot only sends legal moves");
  });

  it("reports a finished 40% player who earned no star, but not one who never finished", () => {
    expect(problems([row({ extra: { p40: [{ stars: 0, percent: 0.3 }] } })])).toContain("a finished 40% player gets 0 stars");
    expect(problems([row({ extra: { p40: [{ stars: 0, percent: 0.3, finished: false, stuck: true, stuckReason: "r" }] } })])).not.toContain("a finished 40% player gets 0 stars");
  });

  it("a perfect player who did not finish is a stuck game, not a stars problem", () => {
    const out = problems([row({ extra: { perfect: [{ finished: false, stuck: true, stuckReason: "event cap reached", stars: 0, percent: 0.2 }] } })]);
    expect(out).toContain("stuck (perfect): event cap reached");
    expect(out.some((p) => p.startsWith("perfect play earns only"))).toBe(false);
  });

  it("length: a FULL game must take an average learner 3 to 30 minutes, a FAST game 2 to 10, and the limits themselves are fine", () => {
    for (const [mode, lo, hi] of [["FULL", TARGETS.fullMinutes.min, TARGETS.fullMinutes.max], ["FAST", TARGETS.fastMinutes.min, TARGETS.fastMinutes.max]] as const) {
      expect(problems([row({ mode, est: hi, p70: hi })]), `${mode} at the upper limit`).toEqual([]);
      expect(problems([row({ mode, est: lo, p70: lo })]), `${mode} at the lower limit`).toEqual([]);
      expect(problems([row({ mode, est: hi + 1, p70: hi + 1 })]), `${mode} above`).toContain(`too long: ${hi + 1} min for a ${mode} game (max ${hi})`);
      const short = lo - 1;
      expect(problems([row({ mode, est: short, p70: short })]), `${mode} below`).toContain(`too short: ${short} min for a ${mode} game (min ${lo})`);
    }
    expect([TARGETS.fastMinutes.max, TARGETS.fullMinutes.max]).toEqual([10, 30]);
    expect(TARGETS.fastMinutes.max).toBeLessThan(TARGETS.fullMinutes.max);
  });

  it("the median of the p70 runs decides, so one slow run among five does not make a game too long", () => {
    const slow = row({ est: 12, extra: { p70: [{}, {}, {}, {}, {}].map((_, i) => (i === 0 ? { minutes: 45, seconds: 2700 } : {})) } });
    expect(problems([slow])).toEqual([]);
  });

  it("the declared length must be within half to double what the learner needs", () => {
    expect(problems([row({ est: 12, p70: 24 })]), "exactly double").toEqual([]);
    expect(problems([row({ est: 12, p70: 6 })]), "exactly half").toEqual([]);
    expect(problems([row({ est: 6, p70: 13 })])).toContain("estimatedMinutes 6 vs simulated 13");
    expect(problems([row({ est: 20, p70: 8 })])).toContain("estimatedMinutes 20 vs simulated 8");
  });

  it("a weak player may take up to three times as long as a strong one, not more", () => {
    expect(problems([row({ est: 12, p70: 12, perfect: 6, p40: 18 })]), "exactly three times").toEqual([]);
    expect(problems([row({ est: 12, p70: 12, perfect: 6, p40: 20 })])).toContain("weak player takes 3.3x the strong player's time");
  });

  it("a game with no runs at all is NOT clean: nothing was simulated, and that must show", () => {
    const empty: Row = { item: { id: "silent", kind: "demo", lang: "en", mode: "FULL", spec }, runs: [] };
    const out = findOutliers([empty]);
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((o) => o.id === "silent")).toBe(true);
    expect(out.map((o) => o.problem).join(" ")).toMatch(/too short: 0 min/);
  });

  it("names the game each problem belongs to, and keeps every game's problems", () => {
    const a = row({ extra: { p70: [{ rejected: 1 }] } });
    const b = { ...row({ extra: { p70: [{ rejected: 2 }] } }), item: { ...row().item, id: "game-y" } };
    const out = findOutliers([a, b]);
    expect(out.filter((o) => o.id === "game-x").map((o) => o.problem)).toEqual(["1 rejected event(s): the bot only sends legal moves"]);
    expect(out.filter((o) => o.id === "game-y").map((o) => o.problem)).toEqual(["2 rejected event(s): the bot only sends legal moves"]);
  });
});

// ───────────────────────────── the bots' answers against the grader ─────────────────────────────

describe("what the bots answer", () => {
  const games = [...engineCorpus(), ...demoCorpus()];
  const challenges = new Map<string, Challenge>();
  for (const g of games) for (const c of g.spec.challenges) challenges.set(`${g.id}/${c.id}`, c);

  it("the corpus has every kind of challenge, so this section really covers them all", () => {
    const seen = new Set([...challenges.values()].map((c) => c.type));
    for (const t of CHALLENGE_TYPES) expect(seen.has(t), t).toBe(true);
    expect(challenges.size).toBeGreaterThan(500);
  });

  it("the right answer is well formed and graded right, for every challenge in the corpus, in either language", () => {
    for (const [key, ch] of challenges) {
      const answer = rightAnswer(ch);
      expect(answer.type, key).toBe(ch.type);
      expect(answerSchema.safeParse(answer).success, `${key} is not a legal answer`).toBe(true);
      expect(gradeAnswer(ch, answer, "en").correct, key).toBe(true);
      expect(gradeAnswer(ch, answer, "he").correct, key).toBe(true);
    }
  });

  it("a wrong answer is well formed and graded wrong, for every challenge in the corpus and any luck of the draw", () => {
    for (const [key, ch] of challenges) {
      for (const seed of [1, 2, 3]) {
        const answer = wrongAnswerFor(ch, mulberry32(seed));
        expect(answer.type, key).toBe(ch.type);
        expect(answerSchema.safeParse(answer).success, `${key} is not a legal answer`).toBe(true);
        const graded = gradeAnswer(ch, answer, "en");
        expect(graded.correct, `${key} (seed ${seed}) was graded right`).toBe(false);
        // wrong, not invalid: an invalid answer would be rejected, and the bot only sends legal moves
        expect(graded.feedback, key).not.toMatch(/not a valid|invalid/i);
      }
    }
  });

  it("the answers go through the opaque ids the player is shown, and the right one is still right", () => {
    for (const [key, ch] of challenges) {
      const seed = `seed|${key}`;
      expect(gradeAnswer(ch, toPublicAnswer(ch, rightAnswer(ch), seed), "en", seed).correct, key).toBe(true);
      expect(gradeAnswer(ch, toPublicAnswer(ch, wrongAnswerFor(ch, mulberry32(9)), seed), "en", seed).correct, key).toBe(false);
    }
  });

  it("the wrong answer of the smallest possible question is still wrong: two options, two items, two pairs", () => {
    const base = { id: "c", title: "t", prompt: "p", concept: "c", level: 1, objectiveId: "o", explanation: "e" };
    const choice = { ...base, type: "choice", options: [{ id: "a", text: "A", feedback: "f" }, { id: "b", text: "B", feedback: "f" }], correctOptionId: "b" } as unknown as Challenge;
    const sequence = { ...base, type: "sequence", items: [{ id: "i1", text: "1" }, { id: "i2", text: "2" }] } as unknown as Challenge;
    const match = { ...base, type: "match", pairs: [{ id: "p1", left: "l1", right: "r1" }, { id: "p2", left: "l2", right: "r2" }] } as unknown as Challenge;
    const numeric = { ...base, type: "numeric", answer: -40, tolerance: 0.5, commonMistakes: [] } as unknown as Challenge;
    for (const ch of [choice, sequence, match, numeric]) {
      for (let seed = 1; seed <= 8; seed++) expect(gradeAnswer(ch, wrongAnswerFor(ch, mulberry32(seed)), "en").correct, `${ch.type} seed ${seed}`).toBe(false);
      expect(gradeAnswer(ch, rightAnswer(ch), "en").correct, ch.type).toBe(true);
    }
  });
});

// ───────────────────────────── playGame ─────────────────────────────

describe("playGame", () => {
  const spec = validDemoSpec();

  it("a flawless run asks nothing twice: one attempt per challenge, no hint, nothing revealed, 100%", () => {
    const r = playGame(spec, skill("perfect"), "t1");
    expect(r).toMatchObject({ finished: true, stuck: false, rejected: 0, hints: 0, revealed: 0, stars: 3, percent: 1 });
    expect(r.attempts).toBe(r.challengesPlayed);
    expect(r.stuckReason).toBeUndefined();
    expect(r.score).toBe(r.maxScore);
  });

  it("the stars it reports are the product's stars for the percentage it reports", () => {
    for (const s of SKILLS) for (const seed of ["a", "b", "c"]) {
      const r = playGame(spec, s, seed);
      // (the percentage is rounded to three decimals: allow either side of a threshold)
      expect(r.stars, `${s.id}/${seed}`).toBeGreaterThanOrEqual(starsFor(r.percent - 0.0005, r.finished));
      expect(r.stars, `${s.id}/${seed}`).toBeLessThanOrEqual(starsFor(r.percent + 0.0005, r.finished));
      expect(r.percent).toBeGreaterThanOrEqual(0);
      expect(r.percent).toBeLessThanOrEqual(1);
      expect(r.minutes).toBeCloseTo(r.seconds / 60, 0);
    }
  });

  it("a player who gets every answer wrong still finishes (the solution is revealed after repeated failure), with one star", () => {
    const hopeless: Skill = { id: "hopeless", pFirst: 0, pRetry: 0, pHint: 0, pCollect: 1, pace: 1 };
    const r = playGame(spec, hopeless, "t2");
    expect(r.finished, r.stuckReason).toBe(true);
    expect(r.rejected).toBe(0);
    expect(r.revealed).toBeGreaterThan(0);
    expect(r.attempts).toBeGreaterThan(r.challengesPlayed);
    expect(r.attempts).toBeLessThanOrEqual(10 * r.challengesPlayed);
    expect(r.stars).toBeGreaterThanOrEqual(1);
    expect(r.score).toBeLessThan(playGame(spec, skill("perfect"), "t2").score);
  });

  it("the clock follows the real world: the same game in large areas takes longer to walk than in small ones", () => {
    const sized = (size: "small" | "large"): GameSpec => {
      const s = structuredClone(spec);
      for (const a of s.areas) a.size = size;
      return s;
    };
    const small = playGame(sized("small"), skill("perfect"), "t3");
    const large = playGame(sized("large"), skill("perfect"), "t3");
    expect(small.finished && large.finished).toBe(true);
    expect(large.seconds).toBeGreaterThan(small.seconds);
    // only the walking differs: the same events, the same score
    expect(large.events).toBe(small.events);
    expect(large.score).toBe(small.score);
  });

  it("a slower learner (pace) takes longer over exactly the same moves", () => {
    const quick: Skill = { ...skill("perfect"), id: "quick", pace: 0.5 };
    const slow: Skill = { ...skill("perfect"), id: "slow", pace: 2 };
    const a = playGame(spec, quick, "t4");
    const b = playGame(spec, slow, "t4");
    // (reading and thinking scale with the pace; the walk itself does not)
    expect(b.seconds).toBeGreaterThan(a.seconds * 1.3);
    expect(b.events).toBe(a.events);
    expect(b.score).toBe(a.score);
  });
});

describe("fuzzCorpus", () => {
  it("is the same for a seed, differs between seeds, and numbers its games", () => {
    const a = fuzzCorpus(4, "t1-fuzz");
    const again = fuzzCorpus(4, "t1-fuzz");
    expect(a.map((i) => i.id)).toEqual(again.map((i) => i.id));
    // (the build stamps the wall-clock time it was made at: everything else is the same)
    const content = (i: CorpusItem) => JSON.stringify({ ...i.spec, meta: { ...i.spec.meta, generator: { ...i.spec.meta.generator, generatedAt: "" } } });
    expect(a.map(content)).toEqual(again.map(content));
    expect(fuzzCorpus(4, "t1-other").map((i) => i.id).join()).not.toBe(a.map((i) => i.id).join());
    expect(new Set(a.map((i) => i.id)).size).toBe(a.length);
    for (const i of a) {
      expect(i.id).toMatch(/^fuzz-\d+\/(FULL|FAST)\/[a-z]+$/);
      expect(i.spec.meta.language).toBe(i.lang);
      expect(i.kind).toBe("engine");
    }
  });
});

// ───────────────────────────── a flawless player over the topic library ─────────────────────────────

describe("a flawless player in the topic library", () => {
  // (fixed: a harder variant on one of the first three challenges could never be served, while the best score counted it,
  // so three beginner Fast Quests ended at 74 % and every other one 0.3 points above the three-star line)

  it("earns three stars in a game of every topic, never has an answer revealed or a move rejected, and never beats the maximum", async () => {
    const perfect = skill("perfect");
    const short: string[] = [];
    let games = 0;
    for (const [i, entry] of TOPICS.entries()) {
      const content = (await loadTopicContent(entry.id))!;
      // every topic as a beginner Fast Quest (the shortest game, where one unreachable bonus weighs most); every third as the other two
      const cases: ["beginner" | "intermediate", "FAST" | "FULL"][] = [["beginner", "FAST"]];
      if (i % 3 === 0) cases.push(["beginner", "FULL"], ["intermediate", "FAST"]);
      for (const [difficulty, mode] of cases) {
        const spec = generateOffline({ mode, subject: "x", learningGoal: "x", difficulty, gameType: "adventure", contentLanguage: i % 2 ? "he" : "en", topicId: entry.id }, new Date(0), "A", content).spec;
        const r = playGame(spec, perfect, "flawless");
        games++;
        const id = `${entry.id}/${difficulty}/${mode}`;
        expect({ id, finished: r.finished, rejected: r.rejected, revealed: r.revealed, overMax: r.score > r.maxScore }).toEqual({ id, finished: true, rejected: 0, revealed: 0, overMax: false });
        if (r.stars < 3) short.push(id);
      }
    }
    expect(games).toBeGreaterThan(700);
    expect(short, "a flawless player must be able to earn three stars").toEqual([]);
  }, 300_000);
});
