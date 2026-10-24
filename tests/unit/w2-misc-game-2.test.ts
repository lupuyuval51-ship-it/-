import { afterEach, describe, expect, it, vi } from "vitest";
import { OfflineGenerationError } from "@/lib/offline/generate";
import { NOTE_SETS, demoCorpus, engineCorpus, extendedCorpus, fuzzCorpus, phoneCorpus } from "@/lib/game/sim-balance/corpus";
import { findOutliers, median, simulate, type Row } from "@/lib/game/sim-balance/run";
import type { PlayResult } from "@/lib/game/sim-balance/bot";
import { setSampleBuilderForTests } from "@/lib/game/sample-builder";
import { GAME_TYPES } from "@/lib/game/spec/constants";
import { registerSamples } from "../support/register-samples";
import { validDemoSpec } from "./helpers";

/** Lets a test make the generator fail the way a bug would; otherwise it is the real one. */
const fault = vi.hoisted(() => ({ error: null as Error | null }));
vi.mock("@/lib/offline/generate", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/offline/generate")>();
  return {
    ...real,
    generateOffline: (...args: Parameters<typeof real.generateOffline>) => {
      if (fault.error) throw fault.error;
      return real.generateOffline(...args);
    },
  };
});

afterEach(() => {
  fault.error = null;
  registerSamples();
});

/**
 * Deliberately thin note sets: four lines of notes, or a recipe that is nothing but numbered steps (the engine asks one
 * ordering question per list of steps, so a single list is too little for a game). Every other note set must build.
 */
const THIN = new Set(["en-short", "he-short", "en-steps-only", "he-steps-only"]);

describe("balance corpus: only thin notes may be left out", () => {
  it("every note set that is not deliberately thin builds in both modes and both game types", () => {
    const refused: string[] = [];
    const items = engineCorpus(refused);
    const noteSets = [...NOTE_SETS.en, ...NOTE_SETS.he];
    expect(items.length + refused.length).toBe(noteSets.length * 2 * 2);
    for (const id of refused) expect(THIN.has(id.split("/")[0]!), `${id} was refused`).toBe(true);
    const built = new Set(items.map((i) => i.id));
    for (const n of noteSets.filter((s) => !THIN.has(s.id))) {
      for (const mode of ["FULL", "FAST"]) for (const type of ["adventure", "platformer"]) expect(built.has(`${n.id}/${mode}/${type}`), `${n.id}/${mode}/${type}`).toBe(true);
    }
  });

  it("an invalid game or a crash in the generator is thrown, never counted as thin notes", () => {
    fault.error = new OfflineGenerationError("INVALID_OUTPUT", "challenge c-1 is not solvable");
    expect(() => engineCorpus()).toThrow("not solvable");
    expect(() => phoneCorpus()).toThrow("not solvable");
    expect(() => fuzzCorpus(3, "bug")).toThrow("not solvable");
    fault.error = new TypeError("cannot read properties of undefined");
    expect(() => engineCorpus()).toThrow(TypeError);
  });

  it("an honest refusal of thin notes leaves the game out and is reported", () => {
    fault.error = new OfflineGenerationError("MATERIAL_UNUSABLE", "too little material");
    const refused: string[] = [];
    expect(engineCorpus(refused)).toEqual([]);
    expect(refused).toHaveLength((NOTE_SETS.en.length + NOTE_SETS.he.length) * 4);
    expect(phoneCorpus()).toEqual([]);
    expect(fuzzCorpus(3, "thin")).toEqual([]);
  });

  it("the sample corpora say what is missing when the test samples are not registered", () => {
    setSampleBuilderForTests(null);
    expect(() => demoCorpus()).toThrow(/registerSamples/);
    expect(() => extendedCorpus()).toThrow(/registerSamples/);
  });
});

describe("balance corpus: games as the Android app makes them (fitted to a phone)", () => {
  const phone = phoneCorpus();
  const desktop = new Map(engineCorpus().map((i) => [i.id, i.spec]));

  it("covers every game type, both modes and both languages, and every game is really fitted", () => {
    for (const type of GAME_TYPES) expect(phone.some((i) => i.id.endsWith(`/${type}`)), type).toBe(true);
    for (const lang of ["he", "en"] as const) for (const mode of ["FAST", "FULL"] as const) expect(phone.some((i) => i.lang === lang && i.mode === mode)).toBe(true);
    for (const { id, spec } of phone) {
      expect(spec.mechanics, id).not.toContain("moving_platforms");
      for (const a of spec.areas) {
        expect(a.hazardLevel, `${id} ${a.id}`).not.toBe("high");
        if (a.layout === "terraces") expect(a.size, `${id} ${a.id}`).toBe("small");
        expect(a.size, `${id} ${a.id}`).not.toBe("large");
      }
      for (const c of spec.challenges) if (c.timeLimitSec) expect(c.timeLimitSec, `${id} ${c.id}`).toBeGreaterThanOrEqual(30);
    }
    // the same notes on a desktop make a game with more walking or more to pick up somewhere
    const differs = phone.filter((i) => {
      const d = desktop.get(i.id.replace(/^phone:/, ""));
      return d && JSON.stringify(d.areas) !== JSON.stringify(i.spec.areas);
    });
    expect(differs.length).toBeGreaterThan(0);
  });

  it("no stuck state, impossible stars, rejected moves or length outliers, and the declared length holds", () => {
    expect(phone.length).toBeGreaterThan(100);
    const rows = simulate(phone, ["a", "b"]);
    expect(findOutliers(rows)).toEqual([]);
    for (const { item, runs } of rows) {
      const sim = median(runs.filter((r) => r.skill === "p70").map((r) => r.minutes));
      const est = item.spec.meta.estimatedMinutes;
      expect(Math.abs(est - sim), `${item.id}: ${est} vs ${sim}`).toBeLessThanOrEqual(Math.max(2, 0.25 * sim));
    }
  });
});

describe("findOutliers", () => {
  const spec = validDemoSpec({ mode: "FULL" });
  const est = spec.meta.estimatedMinutes;
  const run = (skill: string, over: Partial<PlayResult> = {}): PlayResult => ({
    skill, finished: true, stuck: false, events: 40, rejected: 0, seconds: est * 60, minutes: est, score: 900, maxScore: 1000, percent: 0.9,
    stars: 3, revealed: 0, challengesPlayed: 8, attempts: 8, hints: 0, achievements: [], ...over,
  });
  const row = (over: Record<string, Partial<PlayResult>[]> = {}): Row => ({
    item: { id: "g", kind: "demo", lang: "en", mode: "FULL", spec },
    runs: ["perfect", "p70", "p40", "rusher"].flatMap((s) => (over[s] ?? [{}]).map((o) => run(s, o))),
  });

  it("a balanced game has no outliers", () => {
    expect(findOutliers([row()])).toEqual([]);
  });

  it("a score above the maximum is impossible whether or not the game was finished", () => {
    expect(findOutliers([row({ p70: [{ finished: false, score: 1200 }] })]).map((o) => o.problem)).toContain("score above maxScore (impossible percentage)");
  });

  it("names the worst perfect run, with a readable percentage", () => {
    const out = findOutliers([row({ perfect: [{ stars: 3, percent: 0.95 }, { stars: 2, percent: 0.571 }, { stars: 1, percent: 0.55 }] })]);
    expect(out.map((o) => o.problem)).toContain("perfect play earns only 1 star(s), 55% of max");
    const twoStars = findOutliers([row({ perfect: [{ stars: 3, percent: 0.95 }, { stars: 2, percent: 0.571 }] })]);
    expect(twoStars.map((o) => o.problem)).toContain("perfect play earns only 2 star(s), 57.1% of max");
  });

  it("a flawless player who sees a solution revealed means a right answer was graded wrong", () => {
    const out = findOutliers([row({ perfect: [{ revealed: 1 }, { revealed: 2 }] })]);
    expect(out.map((o) => o.problem)).toContain("perfect play had 3 answer(s) revealed: a right answer was graded wrong");
  });
});
