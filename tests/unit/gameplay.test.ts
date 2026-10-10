import { describe, expect, it } from "vitest";
import { DEMO_PACKS } from "@/lib/game/demo";
import { gradeAnswer } from "@/lib/game/challenges/grade";
import { GameEventError, processEvent, type EventResult, type GameEvent } from "@/lib/game/state/events";
import {
  chooseVariant, collectibleIds, findArea, initialState, maxScore, pointsAwarded, portalOpen, stationActive, summarize, type PlayState,
} from "@/lib/game/state/progress";
import type { GameSpec } from "@/lib/game/spec/schema";
import { correctAnswer, request, validDemoSpec, wrongAnswer } from "./helpers";

const ctx = (now = 1_000_000) => ({ now, seed: "test-session" });

function play(spec: GameSpec, state: PlayState, event: GameEvent, now = 1_000_000): EventResult {
  return processEvent(spec, state, event, ctx(now));
}
function codeOf(fn: () => unknown): string {
  try {
    fn();
    return "OK";
  } catch (e) {
    return e instanceof GameEventError ? e.code : `ERR:${String(e)}`;
  }
}

describe("server-side grading for every challenge in every template", () => {
  for (const pack of DEMO_PACKS) {
    for (const lang of ["en", "he"] as const) {
      it(`${pack.id}/${lang}: the reference answer is accepted and a wrong answer is rejected`, () => {
        const spec = validDemoSpec({ subject: pack.id === "math" ? "fractions" : "python", contentLanguage: lang });
        for (const ch of spec.challenges) {
          const good = gradeAnswer(ch, correctAnswer(ch), lang);
          expect(good.correct, `${ch.id} correct answer rejected: ${good.feedback}`).toBe(true);
          const bad = gradeAnswer(ch, wrongAnswer(ch), lang);
          expect(bad.correct, `${ch.id} wrong answer accepted`).toBe(false);
          expect(bad.feedback.length).toBeGreaterThan(0);
        }
      });
    }
  }

  it("rejects mismatched answer types and malformed answers", () => {
    const spec = validDemoSpec();
    const choice = spec.challenges.find((c) => c.type === "choice")!;
    expect(gradeAnswer(choice, { type: "numeric", value: 1 }, "en").correct).toBe(false);
    const seq = spec.challenges.find((c) => c.type === "sequence")!;
    expect(gradeAnswer(seq, { type: "sequence", order: ["x", "y"] }, "en").correct).toBe(false);
    const num = spec.challenges.find((c) => c.type === "numeric")!;
    expect(gradeAnswer(num, { type: "numeric", value: Number.NaN }, "en").correct).toBe(false);
  });

  it("explains a SPECIFIC common mistake instead of a generic message", () => {
    const spec = validDemoSpec();
    const ch = spec.challenges.find((c) => c.id === "c-var2")!;
    const res = gradeAnswer(ch, { type: "numeric", value: 4 }, "en");
    expect(res.correct).toBe(false);
    expect(res.feedback).toMatch(/before the second line/);
  });
});

describe("a complete playthrough through the server reducer", () => {
  for (const gameType of ["adventure", "platformer", "puzzle", "simulation", "exploration"] as const) {
    it(`finishes the whole ${gameType} game with validated events only`, () => {
      const spec = validDemoSpec({ gameType });
      let state = initialState(spec, 0);
      let clock = 1000;
      const step = (e: GameEvent) => {
        clock += 4000;
        const r = play(spec, state, e, clock);
        state = r.state;
        return r;
      };
      for (let guard = 0; guard < 40 && !state.finished; guard++) {
        const area = findArea(spec, state.areaId)!;
        for (const n of area.npcs) step({ type: "talk", npcId: n.id });
        for (const id of collectibleIds(area)) step({ type: "collect", itemId: id });
        for (const s of area.stations) {
          if (!stationActive(spec, state, s) || state.resolvedStations[s.id] || state.visited.includes(s.id)) continue;
          if (s.kind === "lore") {
            step({ type: "visit", stationId: s.id });
            continue;
          }
          const opened = step({ type: "open", stationId: s.id });
          const served = (opened.data.challenge as { id: string }).id;
          const ch = spec.challenges.find((c) => c.id === served)!;
          const r = step({ type: "answer", stationId: s.id, answer: correctAnswer(ch) });
          expect((r.data.result as { correct: boolean }).correct).toBe(true);
        }
        // Stations unlocked by missions completed in this very loop get picked up on the next pass.
        if (portalOpen(spec, state, area) && area.portal) step({ type: "enter_area", areaId: area.portal.toAreaId });
      }
      expect(state.finished).toBe(true);
      const done = step({ type: "finish" });
      const summary = done.summary!;
      expect(summary.completed).toBe(true);
      expect(summary.stars).toBeGreaterThanOrEqual(2);
      expect(summary.score).toBeLessThanOrEqual(summary.maxScore + 500); // time-free demo: bounded by max (+ adaptive variants)
      expect(summary.achievements).toEqual(expect.arrayContaining(["completed", "first_try", "no_hints", "flawless"]));
      expect(summary.concepts.length).toBeGreaterThan(2);
      expect(summary.objectives.every((o) => o.mastery === null || o.mastery > 0)).toBe(true);
      expect(summary.review).toEqual([]);
    });
  }
});

describe("hostile or buggy clients cannot cheat", () => {
  const spec = validDemoSpec();
  const fresh = () => initialState(spec, 0);

  it("cannot answer without opening, answer locked stations, or answer in the wrong area", () => {
    expect(codeOf(() => play(spec, fresh(), { type: "answer", stationId: "s-var1", answer: { type: "choice", optionId: "a" } }))).toBe("NOT_OPENED");
    expect(codeOf(() => play(spec, fresh(), { type: "open", stationId: "s-cond1" }))).toBe("STATION_LOCKED");
    expect(codeOf(() => play(spec, fresh(), { type: "open", stationId: "s-robot1" }))).toBe("WRONG_AREA");
    expect(codeOf(() => play(spec, fresh(), { type: "open", stationId: "does-not-exist" }))).toBe("UNKNOWN_STATION");
  });

  it("cannot claim collectibles that do not exist, twice, or from another area", () => {
    const s = fresh();
    expect(codeOf(() => play(spec, s, { type: "collect", itemId: "made-up" }))).toBe("UNKNOWN_ITEM");
    expect(codeOf(() => play(spec, s, { type: "collect", itemId: "a-lab:c0" }))).toBe("UNKNOWN_ITEM");
    const once = play(spec, s, { type: "collect", itemId: "a-plaza:c0" });
    expect(once.state.score).toBe(10);
    expect(codeOf(() => play(spec, once.state, { type: "collect", itemId: "a-plaza:c0" }))).toBe("ALREADY_COLLECTED");
  });

  it("cannot use a portal before earning it, jump to arbitrary areas, or finish early", () => {
    expect(codeOf(() => play(spec, fresh(), { type: "enter_area", areaId: "a-lab" }))).toBe("PORTAL_LOCKED");
    expect(codeOf(() => play(spec, fresh(), { type: "enter_area", areaId: "a-nowhere" }))).toBe("NO_PORTAL");
    expect(codeOf(() => play(spec, fresh(), { type: "finish" }))).toBe("NOT_COMPLETE");
  });

  it("cannot answer twice for points, or answer an already-resolved station", () => {
    let s = fresh();
    s = play(spec, s, { type: "open", stationId: "s-var1" }).state;
    const ch = spec.challenges.find((c) => c.id === "c-var1")!;
    const r = play(spec, s, { type: "answer", stationId: "s-var1", answer: correctAnswer(ch) });
    expect(r.state.score).toBe(100);
    expect(codeOf(() => play(spec, r.state, { type: "answer", stationId: "s-var1", answer: correctAnswer(ch) }))).toBe("ALREADY_RESOLVED");
    expect(r.state.score).toBe(100);
  });

  it("rejects an answer whose type does not match the challenge", () => {
    let s = fresh();
    s = play(spec, s, { type: "open", stationId: "s-var1" }).state;
    expect(codeOf(() => play(spec, s, { type: "answer", stationId: "s-var1", answer: { type: "numeric", value: 7 } }))).toBe("BAD_ANSWER");
  });

  it("never mutates the previous state object (pure reducer)", () => {
    const s = fresh();
    const before = JSON.stringify(s);
    play(spec, s, { type: "collect", itemId: "a-plaza:c0" });
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("scoring is computed on the server from attempts, hints and time", () => {
  const spec = validDemoSpec();
  const open = (state: PlayState) => play(spec, state, { type: "open", stationId: "s-var1" }).state;
  const ch = spec.challenges.find((c) => c.id === "c-var1")!;

  it("first try = full points; later attempts earn less; 3 wrong attempts reveal the answer for 0 points", () => {
    let s = open(initialState(spec, 0));
    const first = play(spec, s, { type: "answer", stationId: "s-var1", answer: correctAnswer(ch) });
    expect((first.data.result as { pointsAwarded: number }).pointsAwarded).toBe(100);

    s = open(initialState(spec, 0));
    s = play(spec, s, { type: "answer", stationId: "s-var1", answer: wrongAnswer(ch) }).state;
    const second = play(spec, s, { type: "answer", stationId: "s-var1", answer: correctAnswer(ch) });
    expect((second.data.result as { pointsAwarded: number }).pointsAwarded).toBe(60);

    s = open(initialState(spec, 0));
    let last: EventResult | null = null;
    for (let i = 0; i < 3; i++) {
      last = play(spec, s, { type: "answer", stationId: "s-var1", answer: wrongAnswer(ch) });
      s = last.state;
    }
    const res = last!.data.result as { resolved: boolean; revealed: boolean; reveal: { optionId: string }; explanation: string; pointsAwarded: number };
    expect(res).toMatchObject({ resolved: true, revealed: true, pointsAwarded: 0 });
    expect(res.reveal.optionId).toBe("a");
    expect(res.explanation.length).toBeGreaterThan(10);
    expect(s.resolvedStations["s-var1"]).toBe("revealed");
    expect(s.score).toBe(0);
  });

  it("a hint costs points but the hint text is only released by the server", () => {
    let s = open(initialState(spec, 0));
    const h = play(spec, s, { type: "hint", stationId: "s-var1" });
    expect(h.data.hint).toMatch(/box/);
    s = h.state;
    const r = play(spec, s, { type: "answer", stationId: "s-var1", answer: correctAnswer(ch) });
    expect((r.data.result as { pointsAwarded: number }).pointsAwarded).toBe(85);
    expect(play(spec, s, { type: "hint", stationId: "s-var1" }).state.hintsUsed).toBe(1); // asking again is free
  });

  it("pointsAwarded: time bonus only when enabled and within the limit", () => {
    const base = { level: 2 as const, wrongBefore: 0, hints: 0, timeLimitSec: 60 };
    expect(pointsAwarded({ ...base, elapsedMs: 10_000, timedBonus: false })).toBe(150);
    expect(pointsAwarded({ ...base, elapsedMs: 10_000, timedBonus: true })).toBeGreaterThan(150);
    expect(pointsAwarded({ ...base, elapsedMs: 90_000, timedBonus: true })).toBe(150);
    // worst case (3rd attempt + max hint penalty) is 30% × 70% = 21% of base: never below the 20% floor
    const worst = pointsAwarded({ ...base, wrongBefore: 5, hints: 9, elapsedMs: null, timedBonus: false });
    expect(worst).toBeGreaterThanOrEqual(30);
    expect(worst).toBeLessThanOrEqual(32);
  });

  it("maxScore covers every placed challenge, collectible and mission", () => {
    expect(maxScore(spec)).toBeGreaterThan(900);
  });
});

describe("adaptive difficulty chooses easier / harder variants from performance", () => {
  const spec = validDemoSpec();
  const station = (id: string) => findArea(spec, "a-plaza")!.stations.find((s) => s.id === id)!;

  it("serves the easier variant after two struggles in a row", () => {
    const s = initialState(spec, 0);
    s.recent = ["bad", "bad"];
    expect(chooseVariant(spec, s, station("s-var2"))).toBe("c-var2-easy");
    s.recent = ["good", "bad"];
    expect(chooseVariant(spec, s, station("s-var2"))).toBe("c-var2");
  });

  it("serves the harder variant after a streak of first-try successes", () => {
    const s = initialState(spec, 0);
    s.streak = 3;
    expect(chooseVariant(spec, s, station("s-loop1"))).toBe("c-loop1-hard");
    s.streak = 2;
    expect(chooseVariant(spec, s, station("s-loop1"))).toBe("c-loop1");
  });

  it("the chosen variant is sticky for the station and graded against the variant", () => {
    let s = initialState(spec, 0);
    s.recent = ["bad", "bad"];
    const opened = play(spec, s, { type: "open", stationId: "s-var2" });
    expect((opened.data.challenge as { id: string }).id).toBe("c-var2-easy");
    s = opened.state;
    s.recent = ["good", "good"]; // performance changes later; the served variant must not
    const again = play(spec, s, { type: "open", stationId: "s-var2" });
    expect((again.data.challenge as { id: string }).id).toBe("c-var2-easy");
    const easy = spec.challenges.find((c) => c.id === "c-var2-easy")!;
    const ans = play(spec, again.state, { type: "answer", stationId: "s-var2", answer: correctAnswer(easy) });
    expect((ans.data.result as { correct: boolean }).correct).toBe(true);
  });
});

describe("learning summary", () => {
  it("reports concepts, objective mastery and what to review", () => {
    const spec = validDemoSpec();
    let s = initialState(spec, 0);
    s = play(spec, s, { type: "open", stationId: "s-var1" }).state;
    const ch = spec.challenges.find((c) => c.id === "c-var1")!;
    for (let i = 0; i < 3; i++) s = play(spec, s, { type: "answer", stationId: "s-var1", answer: wrongAnswer(ch) }).state;
    const sum = summarize(spec, s, 5000);
    expect(sum.review).toEqual([expect.objectContaining({ challengeId: "c-var1", reason: "revealed" })]);
    expect(sum.concepts).toEqual([expect.objectContaining({ concept: "variables", correct: 0, total: 1 })]);
    expect(sum.objectives.find((o) => o.id === "o-vars")!.mastery).toBe(0);
    expect(sum.completed).toBe(false);
    expect(sum.stars).toBe(0);
    void request;
  });
});
