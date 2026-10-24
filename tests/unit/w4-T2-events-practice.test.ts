import { describe, expect, it } from "vitest";
import { MAX_ATTEMPTS_PER_CHALLENGE } from "@/config/limits";
import { gradeAnswer, toPublicChallenge } from "@/lib/game/challenges/grade";
import { addFinalBoss } from "@/lib/game/spec/boss";
import type { Block, Challenge, GameSpec } from "@/lib/game/spec/schema";
import { GameEventError, gameEventSchema, processEvent, type EventResult, type GameEvent } from "@/lib/game/state/events";
import { PracticeNotFound, practiceBodySchema, practiceIds, respondPractice } from "@/lib/game/state/practice";
import { initialState, type ChallengeRecord, type PlayState } from "@/lib/game/state/progress";
import { withReaction } from "@/lib/game/state/reactions";
import { answerText, buildReview } from "@/lib/game/state/review";
import { correctAnswer, validDemoSpec, wrongAnswer } from "./helpers";

/**
 * The reducer's individual rules (what each event may do, what it releases and what it refuses), "practise only these", the review
 * page and character reactions. The fuzz and playthrough suites prove the invariants; these pin the exact behaviour.
 */
const SEED = "t2-events";
const spec = validDemoSpec({ gameType: "adventure", mode: "FULL" });
const fresh = (): PlayState => initialState(spec, 0);
const play = (state: PlayState, event: GameEvent, now = 10_000, s: GameSpec = spec): EventResult => processEvent(s, state, event, { now, seed: SEED });
const codeOf = (fn: () => unknown): string => {
  try {
    fn();
    return "OK";
  } catch (e) {
    return e instanceof GameEventError ? e.code : `ERR:${String(e)}`;
  }
};
const chal = (id: string): Challenge => spec.challenges.find((c) => c.id === id)!;
const rec = (over: Partial<ChallengeRecord> = {}): ChallengeRecord => ({ stationId: "x", attempts: 1, wrong: 0, hints: 0, resolved: true, correct: true, revealed: false, points: 0, timeMs: null, ...over });
type Result = { correct: boolean; feedback: string; resolved: boolean; revealed: boolean; pointsAwarded: number; attemptsLeft: number; explanation?: string; reveal?: unknown };
const result = (r: EventResult): Result => r.data.result as Result;

describe("event schema: what a client may send", () => {
  const ok = (e: unknown) => gameEventSchema.safeParse(e).success;
  const pos = { x: 1, y: 2, z: 3, yaw: 0.5 };

  it("accepts every documented event", () => {
    for (const e of [
      { type: "open", stationId: "s-var1" }, { type: "answer", stationId: "s-var1", answer: { type: "choice", optionId: "o1" } }, { type: "hint", stationId: "s-var1" },
      { type: "collect", itemId: "a-plaza:c0" }, { type: "talk", npcId: "n-byte" }, { type: "visit", stationId: "s-lore1" }, { type: "enter_area", areaId: "a-lab" },
      { type: "checkpoint", checkpointId: "cp-1", position: pos }, { type: "save", position: pos }, { type: "finish" },
    ]) expect(ok(e), JSON.stringify(e)).toBe(true);
  });

  it("refuses unknown event types and missing fields", () => {
    expect(ok({ type: "teleport", to: "a-lab" })).toBe(false);
    expect(ok({ type: "open" })).toBe(false);
    expect(ok({ type: "answer", stationId: "s-var1" })).toBe(false);
    expect(ok({ type: "save" })).toBe(false);
    expect(ok({})).toBe(false);
    expect(ok(null)).toBe(false);
  });

  it("ids follow the spec's id rule (letters, digits, - and _; at most 40; no leading dash)", () => {
    expect(ok({ type: "open", stationId: "a".repeat(40) })).toBe(true);
    expect(ok({ type: "open", stationId: "a".repeat(41) })).toBe(false);
    expect(ok({ type: "open", stationId: "-x" })).toBe(false);
    expect(ok({ type: "open", stationId: "has space" })).toBe(false);
    expect(ok({ type: "talk", npcId: "../etc" })).toBe(false);
  });

  it("collectible and checkpoint ids are 1 to 80 characters", () => {
    expect(ok({ type: "collect", itemId: "" })).toBe(false);
    expect(ok({ type: "collect", itemId: "x".repeat(80) })).toBe(true);
    expect(ok({ type: "collect", itemId: "x".repeat(81) })).toBe(false);
    expect(ok({ type: "checkpoint", checkpointId: "", position: pos })).toBe(false);
    expect(ok({ type: "checkpoint", checkpointId: "x".repeat(81), position: pos })).toBe(false);
  });

  it("positions stay inside the world and the yaw inside ±20 rad; NaN and Infinity never pass", () => {
    for (const p of [{ x: 500, y: 200, z: -500, yaw: 20 }, { x: -500, y: -30, z: 500, yaw: -20 }]) expect(ok({ type: "save", position: p })).toBe(true);
    for (const p of [{ ...pos, x: 500.1 }, { ...pos, x: -500.1 }, { ...pos, y: -30.1 }, { ...pos, y: 200.1 }, { ...pos, z: 501 }, { ...pos, yaw: 20.1 }, { ...pos, yaw: -20.1 }, { ...pos, x: Number.NaN }, { ...pos, z: Number.POSITIVE_INFINITY }]) {
      expect(ok({ type: "save", position: p }), JSON.stringify(p)).toBe(false);
    }
  });
});

describe("open, answer and what they release", () => {
  const open = (s: PlayState, id = "s-var1", now?: number) => play(s, { type: "open", stationId: id }, now);

  it("opening hands out the public challenge (no answer, no explanation, no hint text) and the player's record of it", () => {
    const r = open(fresh());
    const ch = r.data.challenge as { id: string; hasHint: boolean };
    expect(ch.id).toBe("c-var1");
    expect(ch.hasHint).toBe(true);
    expect(JSON.stringify(ch)).not.toMatch(/correctOptionId|explanation|"hint"|feedback/);
    expect(r.data.record).toBeNull();
    // the same options and order as the pure converter gives for this session seed
    expect(r.data.challenge).toEqual(toPublicChallenge(chal("c-var1"), SEED));
  });

  it("opening again returns the same variant and the record so far (so the UI can show the tries left)", () => {
    let s = open(fresh()).state;
    s = play(s, { type: "answer", stationId: "s-var1", answer: wrongAnswer(chal("c-var1"), SEED) }).state;
    const again = open(s);
    expect((again.data.record as ChallengeRecord).wrong).toBe(1);
    expect((again.data.challenge as { id: string }).id).toBe("c-var1");
  });

  it("a wrong answer gives feedback and the tries left, but neither the explanation nor the solution", () => {
    let s = open(fresh()).state;
    const answers: Result[] = [];
    for (let i = 0; i < MAX_ATTEMPTS_PER_CHALLENGE; i++) {
      const r = play(s, { type: "answer", stationId: "s-var1", answer: wrongAnswer(chal("c-var1"), SEED) });
      s = r.state;
      answers.push(result(r));
    }
    answers.slice(0, -1).forEach((a, i) => {
      expect(a.resolved).toBe(false);
      expect(a.correct).toBe(false);
      expect(a.feedback.length).toBeGreaterThan(0);
      expect(a.attemptsLeft).toBe(MAX_ATTEMPTS_PER_CHALLENGE - 1 - i);
      expect(a.explanation, "nothing is explained while the challenge is still open").toBeUndefined();
      expect(a.reveal, "the solution stays on the server while the challenge is still open").toBeUndefined();
    });
    const last = answers.at(-1)!;
    expect(last).toMatchObject({ resolved: true, revealed: true, attemptsLeft: 0 });
    expect(last.explanation).toBe(chal("c-var1").explanation);
    expect(last.reveal).toBeDefined();
  });

  it("a right answer explains itself but never reveals a solution", () => {
    const r = play(open(fresh()).state, { type: "answer", stationId: "s-var1", answer: correctAnswer(chal("c-var1"), SEED) });
    expect(result(r)).toMatchObject({ correct: true, resolved: true, revealed: false, pointsAwarded: 100, explanation: chal("c-var1").explanation });
    expect(result(r).reveal).toBeUndefined();
  });

  it("the answer is graded against the variant that was served, whichever one the base challenge is", () => {
    const s = fresh();
    s.recent = ["bad", "bad"];
    const opened = open(s, "s-var2");
    expect((opened.data.challenge as { id: string }).id).toBe("c-var2-easy");
    const easy = chal("c-var2-easy");
    expect(gradeAnswer(easy, correctAnswer(easy), "en").correct).toBe(true);
    const r = play(opened.state, { type: "answer", stationId: "s-var2", answer: correctAnswer(easy, SEED) });
    expect(result(r).correct).toBe(true);
    expect(r.state.records["c-var2-easy"]).toBeDefined();
    expect(r.state.records["c-var2"]).toBeUndefined(); // the record belongs to the variant that was played
  });

  it("only challenge stations open, only lore stations are visited", () => {
    const later = { ...fresh(), missionsDone: ["m-boot", "m-choices"] };
    expect(codeOf(() => play(later, { type: "open", stationId: "s-lore1" }))).toBe("NOT_A_CHALLENGE");
    expect(codeOf(() => play(later, { type: "visit", stationId: "s-loop1" }))).toBe("NOT_LORE");
    expect(codeOf(() => play(fresh(), { type: "visit", stationId: "s-lore1" }))).toBe("STATION_LOCKED"); // m-loops is not open yet
    const visited = play(later, { type: "visit", stationId: "s-lore1" }).state;
    expect(visited.visited).toEqual(["s-lore1"]);
    expect(play(visited, { type: "visit", stationId: "s-lore1" }).state.visited).toEqual(["s-lore1"]); // reading it again changes nothing
  });

  it("a later round of a boss battle cannot be opened before the earlier one is resolved, and says why", () => {
    const boss = addFinalBoss(spec).spec;
    const b = boss.bosses[0]!;
    let s = initialState(boss, 0);
    s.areaId = b.areaId;
    s.missionsDone = boss.missions.filter((m) => !m.objectives.some((o) => o.type === "defeat")).map((m) => m.id);
    const attempt = () => processEvent(boss, s, { type: "open", stationId: b.phaseStationIds[1]! }, { now: 1_000, seed: SEED });
    expect(() => attempt()).toThrow(/earlier phases of this battle/);
    expect(codeOf(attempt)).toBe("STATION_LOCKED");
    s = processEvent(boss, s, { type: "open", stationId: b.phaseStationIds[0]! }, { now: 1_000, seed: SEED }).state;
    const first = boss.challenges.find((c) => c.id === s.served[b.phaseStationIds[0]!])!;
    s = processEvent(boss, s, { type: "answer", stationId: b.phaseStationIds[0]!, answer: correctAnswer(first, SEED) }, { now: 2_000, seed: SEED }).state;
    expect(codeOf(attempt)).toBe("OK"); // the first round is won: the second opens
  });

  it("a resolved station cannot be opened again", () => {
    let s = open(fresh()).state;
    s = play(s, { type: "answer", stationId: "s-var1", answer: correctAnswer(chal("c-var1"), SEED) }).state;
    expect(codeOf(() => open(s))).toBe("ALREADY_RESOLVED");
  });

  it("a refused event reports a typed error and the earlier state is untouched", () => {
    const s = fresh();
    const before = JSON.stringify(s);
    expect(codeOf(() => play(s, { type: "answer", stationId: "s-var1", answer: { type: "choice", optionId: "x" } }))).toBe("NOT_OPENED");
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("hints", () => {
  const opened = () => play(fresh(), { type: "open", stationId: "s-var1" }).state;

  it("the hint text comes only after the station was opened", () => {
    expect(codeOf(() => play(fresh(), { type: "hint", stationId: "s-var1" }))).toBe("NOT_OPENED");
    expect(play(opened(), { type: "hint", stationId: "s-var1" }).data.hint).toBe(chal("c-var1").hint);
  });

  it("a challenge without a hint refuses it", () => {
    const bare = structuredClone(spec);
    delete bare.challenges.find((c) => c.id === "c-var1")!.hint;
    const s = play(fresh(), { type: "open", stationId: "s-var1" }, 10_000, bare).state;
    expect(codeOf(() => play(s, { type: "hint", stationId: "s-var1" }, 10_000, bare))).toBe("NO_HINT");
  });

  it("each challenge's first hint costs once (counted per challenge), asking again is free", () => {
    let s = opened();
    const first = play(s, { type: "hint", stationId: "s-var1" });
    expect(first.data.penalty).toBe(true);
    s = first.state;
    expect(s.hintsUsed).toBe(1);
    expect(s.records["c-var1"]!.hints).toBe(1);
    s = play(s, { type: "hint", stationId: "s-var1" }).state;
    expect(s.hintsUsed).toBe(1);
    s = play(s, { type: "open", stationId: "s-var2" }).state;
    s = play(s, { type: "hint", stationId: "s-var2" }).state;
    expect(s.hintsUsed).toBe(2);
  });

  it("a hint taken after the challenge is solved costs nothing", () => {
    let s = opened();
    s = play(s, { type: "answer", stationId: "s-var1", answer: correctAnswer(chal("c-var1"), SEED) }).state;
    const late = play(s, { type: "hint", stationId: "s-var1" });
    expect(late.data.penalty).toBe(false);
    expect(late.state.hintsUsed).toBe(0);
    expect(late.state.score).toBe(s.score);
  });
});

describe("the rest of the events", () => {
  it("talking works once per character and only to the characters of the current area", () => {
    const once = play(fresh(), { type: "talk", npcId: "n-byte" }).state;
    expect(play(once, { type: "talk", npcId: "n-byte" }).state.talked).toEqual(["n-byte"]);
    expect(codeOf(() => play(fresh(), { type: "talk", npcId: "n-gear" }))).toBe("UNKNOWN_NPC"); // lives in a-lab
    expect(codeOf(() => play(fresh(), { type: "talk", npcId: "nobody" }))).toBe("UNKNOWN_NPC");
  });

  it("a checkpoint needs the mechanic in the area, and is remembered with the player's position", () => {
    const pos = { x: 3, y: 1, z: -4, yaw: 1 };
    const r = play(fresh(), { type: "checkpoint", checkpointId: "cp-1", position: pos });
    expect(r.state.checkpoint).toEqual({ id: "cp-1", areaId: "a-plaza", ...pos });
    expect(r.state.position).toEqual(pos);
    const rooms = validDemoSpec({ gameType: "puzzle" }); // rooms have no checkpoints
    expect(codeOf(() => processEvent(rooms, initialState(rooms, 0), { type: "checkpoint", checkpointId: "cp-1", position: pos }, { now: 1, seed: SEED }))).toBe("NO_CHECKPOINTS");
  });

  it("collecting needs the collect mechanic; each item once; the points are the server's", () => {
    const none = structuredClone(spec);
    for (const a of none.areas) a.collectibles.count = 0;
    none.mechanics = none.mechanics.filter((m) => m !== "collect");
    expect(codeOf(() => play(initialState(none, 0), { type: "collect", itemId: "a-plaza:c0" }, 1, none))).toBe("NO_COLLECTIBLES");
    const r = play(fresh(), { type: "collect", itemId: "a-plaza:c3" });
    expect(r.data).toEqual({ points: 10 });
    expect(r.state.score).toBe(10);
    expect(codeOf(() => play(r.state, { type: "collect", itemId: "a-plaza:c3" }))).toBe("ALREADY_COLLECTED");
    expect(codeOf(() => play(fresh(), { type: "collect", itemId: `a-plaza:c${spec.areas[0]!.collectibles.count}` }))).toBe("UNKNOWN_ITEM"); // one past the last
  });

  it("save only moves the player's position", () => {
    const pos = { x: 9, y: 0, z: 9, yaw: -2 };
    const r = play(fresh(), { type: "save", position: pos });
    expect(r.state.position).toEqual(pos);
    expect(r.state.score).toBe(0);
    expect(r.state.checkpoint).toBeNull();
  });

  it("crossing a portal needs its missions, clears the position and the checkpoint, and moves play to the new area", () => {
    const pos = { x: 1, y: 1, z: 1, yaw: 0 };
    let s = play(fresh(), { type: "checkpoint", checkpointId: "cp-1", position: pos }).state;
    s = { ...s, missionsDone: spec.areas[0]!.portal!.requiresMissionIds };
    const r = play(s, { type: "enter_area", areaId: "a-lab" });
    expect(r.state).toMatchObject({ areaId: "a-lab", position: null, checkpoint: null });
    expect(codeOf(() => play(r.state, { type: "open", stationId: "s-var1" }))).toBe("WRONG_AREA"); // the old area's stations are out of reach
    expect(codeOf(() => play(r.state, { type: "enter_area", areaId: "a-plaza" }))).toBe("NO_PORTAL"); // one-way
    expect(codeOf(() => play(s, { type: "enter_area", areaId: "a-lab" }, 1, spec))).toBe("OK");
  });

  it("an unfinished game cannot be finished; a complete one reports its summary, and finishing again changes nothing", () => {
    expect(codeOf(() => play(fresh(), { type: "finish" }))).toBe("NOT_COMPLETE");
    const done = { ...fresh(), missionsDone: spec.missions.map((m) => m.id) };
    const first = play(done, { type: "finish" });
    expect(first.state.finished).toBe(true);
    expect(first.summary?.completed).toBe(true);
    const second = play(first.state, { type: "finish" }, 20_000);
    expect(second.state.score).toBe(first.state.score);
    expect(second.state.achievements).toEqual(first.state.achievements);
    expect(second.newlyCompletedMissions).toEqual([]);
    expect(second.newAchievements).toEqual([]);
  });

  it("no summary until the game is finished", () => {
    expect(play(fresh(), { type: "talk", npcId: "n-byte" }).summary).toBeUndefined();
  });

  it("results report what the event completed: missions, bosses and badges", () => {
    const bossSpec = addFinalBoss(spec).spec;
    const b = bossSpec.bosses[0]!;
    // everything but the last round of the battle is done; the last answer defeats the boss
    const s = initialState(bossSpec, 0);
    s.areaId = b.areaId;
    s.missionsDone = bossSpec.missions.filter((m) => m.areaId !== b.areaId || m.objectives.every((o) => o.type !== "defeat")).map((m) => m.id);
    for (const id of b.phaseStationIds.slice(0, -1)) s.resolvedStations[id] = "correct";
    const last = b.phaseStationIds.at(-1)!;
    const opened = processEvent(bossSpec, s, { type: "open", stationId: last }, { now: 1_000, seed: SEED });
    const served = (opened.data.challenge as { id: string }).id;
    const r = processEvent(bossSpec, opened.state, { type: "answer", stationId: last, answer: correctAnswer(bossSpec.challenges.find((c) => c.id === served)!, SEED) }, { now: 2_000, seed: SEED });
    expect(r.newlyDefeatedBosses).toEqual([b.id]);
    expect(r.newlyCompletedMissions.length).toBeGreaterThan(0);
    expect(r.newAchievements).toContain("boss_slayer");
    expect(r.client.bossesDefeated).toEqual([b.id]);
  });
});

describe("play time (the results page's duration)", () => {
  it("the time of a refused event is not played time, and an accepted one adds its gap", () => {
    const s = fresh();
    expect(codeOf(() => play(s, { type: "open", stationId: "s-cond1" }, 500_000))).toBe("STATION_LOCKED");
    expect(s.playedMs).toBe(0);
    const r = play(s, { type: "talk", npcId: "n-byte" }, 30_000);
    expect(r.state.playedMs).toBe(30_000);
    expect(r.state.updatedAt).toBe(30_000);
  });
});

describe("practise only these: the questions a player missed, asked again without scoring", () => {
  const SESSION = "t2-session";
  /** A run in which c-var1 was solved on the 2nd try, c-var2 was given up on, and c-cond1 was solved first time. */
  const played = (): PlayState => {
    const s = fresh();
    s.records["c-var1"] = rec({ stationId: "s-var1", wrong: 1, attempts: 2 });
    s.records["c-var2"] = rec({ stationId: "s-var2", correct: false, revealed: true, wrong: 3, attempts: 3 });
    s.records["c-cond1"] = rec({ stationId: "s-cond1" });
    s.records["c-loop1"] = rec({ stationId: "s-loop1", resolved: false, correct: false, wrong: 2, attempts: 2 }); // still open: not reviewable
    return s;
  };

  it("the body schema bounds the attempt and the challenge id", () => {
    const ok = (b: unknown) => practiceBodySchema.safeParse(b).success;
    expect(ok({ action: "start" })).toBe(true);
    expect(ok({ action: "hint", challengeId: "c-var1" })).toBe(true);
    expect(ok({ action: "answer", challengeId: "c-var1", attempt: 1, answer: { type: "choice", optionId: "o1" } })).toBe(true);
    expect(ok({ action: "answer", challengeId: "c-var1", attempt: 0, answer: { type: "choice", optionId: "o1" } })).toBe(false);
    expect(ok({ action: "answer", challengeId: "c-var1", attempt: MAX_ATTEMPTS_PER_CHALLENGE + 1, answer: { type: "choice", optionId: "o1" } })).toBe(false);
    expect(ok({ action: "answer", challengeId: "c-var1", attempt: 1.5, answer: { type: "choice", optionId: "o1" } })).toBe(false);
    expect(ok({ action: "answer", challengeId: "x".repeat(41), attempt: 1, answer: { type: "choice", optionId: "o1" } })).toBe(false);
    expect(ok({ action: "reveal", challengeId: "c-var1" })).toBe(false);
  });

  it("only resolved challenges with a miss (or a shown answer) are in the round", () => {
    expect(practiceIds(played())).toEqual(["c-var1", "c-var2"]);
    expect(practiceIds(fresh())).toEqual([]);
  });

  it("start hands out those questions as public challenges for the practice seed (no answers)", () => {
    const out = respondPractice(spec, played(), SESSION, { action: "start" }) as { items: { id: string }[] };
    expect(out.items.map((i) => i.id)).toEqual(["c-var1", "c-var2"]);
    expect(out.items[0]).toEqual(toPublicChallenge(chal("c-var1"), `${SESSION}:practice`));
    expect(JSON.stringify(out)).not.toMatch(/correctOptionId|explanation|feedback|"hint"/);
    expect((respondPractice(spec, fresh(), SESSION, { action: "start" }) as { items: unknown[] }).items).toEqual([]);
  });

  it("a challenge that was removed from the game after the run is left out of the round", () => {
    const s = played();
    s.records["c-gone"] = rec({ wrong: 1 });
    const out = respondPractice(spec, s, SESSION, { action: "start" }) as { items: { id: string }[] };
    expect(out.items.map((i) => i.id)).toEqual(["c-var1", "c-var2"]);
  });

  it("refuses any question that is not part of the review, so no answer is released for a challenge the player has not resolved", () => {
    const s = played();
    for (const id of ["c-cond1" /* first try */, "c-loop1" /* still open */, "c-prog1" /* never played */, "nope"]) {
      expect(() => respondPractice(spec, s, SESSION, { action: "hint", challengeId: id }), id).toThrow(PracticeNotFound);
      expect(() => respondPractice(spec, s, SESSION, { action: "answer", challengeId: id, attempt: MAX_ATTEMPTS_PER_CHALLENGE, answer: wrongAnswer(chal("c-cond1"), `${SESSION}:practice`) }), id).toThrow(PracticeNotFound);
    }
  });

  it("hint: the hint text (or null), never a penalty", () => {
    const s = played();
    expect(respondPractice(spec, s, SESSION, { action: "hint", challengeId: "c-var1" })).toEqual({ hint: chal("c-var1").hint });
    const bare = structuredClone(spec);
    delete bare.challenges.find((c) => c.id === "c-var1")!.hint;
    expect(respondPractice(bare, s, SESSION, { action: "hint", challengeId: "c-var1" })).toEqual({ hint: null });
  });

  it("answer: right is resolved with the explanation; wrong stays open until the last attempt, then shows the solution; nothing is scored", () => {
    const s = played();
    const seed = `${SESSION}:practice`;
    const ch = chal("c-var1");
    const right = respondPractice(spec, s, SESSION, { action: "answer", challengeId: "c-var1", attempt: 1, answer: correctAnswer(ch, seed) }) as { result: Result };
    expect(right.result).toMatchObject({ correct: true, resolved: true, revealed: false, pointsAwarded: 0, attemptsLeft: MAX_ATTEMPTS_PER_CHALLENGE - 1, explanation: ch.explanation });
    expect(right.result.reveal).toBeUndefined();

    const miss = respondPractice(spec, s, SESSION, { action: "answer", challengeId: "c-var1", attempt: 1, answer: wrongAnswer(ch, seed) }) as { result: Result };
    expect(miss.result).toMatchObject({ correct: false, resolved: false, revealed: false, pointsAwarded: 0, attemptsLeft: MAX_ATTEMPTS_PER_CHALLENGE - 1 });
    expect(miss.result.explanation).toBeUndefined();
    expect(miss.result.reveal).toBeUndefined();

    const last = respondPractice(spec, s, SESSION, { action: "answer", challengeId: "c-var1", attempt: MAX_ATTEMPTS_PER_CHALLENGE, answer: wrongAnswer(ch, seed) }) as { result: Result };
    expect(last.result).toMatchObject({ correct: false, resolved: true, revealed: true, pointsAwarded: 0, attemptsLeft: 0, explanation: ch.explanation });
    expect(last.result.reveal).toBeDefined();
  });

  it("practice uses its own shuffle: an answer in the play session's ids is not the practice round's", () => {
    const s = played();
    const ch = chal("c-var1");
    const inPlayIds = correctAnswer(ch, SESSION); // the opaque ids of the PLAY session
    const r = respondPractice(spec, s, SESSION, { action: "answer", challengeId: "c-var1", attempt: 1, answer: inPlayIds }) as { result: Result };
    expect(r.result.correct).toBe(false);
  });

  it("never changes the run it is given", () => {
    const s = played();
    const before = JSON.stringify(s);
    respondPractice(spec, s, SESSION, { action: "start" });
    respondPractice(spec, s, SESSION, { action: "answer", challengeId: "c-var2", attempt: 2, answer: wrongAnswer(chal("c-var2"), `${SESSION}:practice`) });
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("the review page: the right answer in words", () => {
  const prog = (solution: Block[]): Challenge => ({ ...(chal("c-prog1") as Extract<Challenge, { type: "program" }>), solution });

  it("a choice shows the text of the correct option, a numeric one its value and unit", () => {
    const c = chal("c-var1") as Extract<Challenge, { type: "choice" }>;
    expect(answerText(c)).toBe(c.options.find((o) => o.id === c.correctOptionId)!.text);
    expect(answerText({ ...c, correctOptionId: "nope" })).toBeNull();
    const n = chal("c-var2") as Extract<Challenge, { type: "numeric" }>;
    expect(answerText(n)).toBe(`${n.answer}${n.unit ? ` ${n.unit}` : ""}`);
    expect(answerText({ ...n, answer: 3.5, unit: "m" })).toBe("3.5 m");
    expect(answerText({ ...n, answer: 3.5, unit: undefined })).toBe("3.5");
  });

  it("a sequence is numbered in the correct order, a match lists its pairs", () => {
    const s = chal("c-seq1") as Extract<Challenge, { type: "sequence" }>;
    expect(answerText(s)).toBe(s.items.map((i, n) => `${n + 1}. ${i.text}`).join("\n"));
    const m: Challenge = { type: "match", id: "m1", title: "t", prompt: "p", concept: "c", explanation: "e", level: 1, pairs: [{ id: "a", left: "L1", right: "R1" }, { id: "b", left: "L2", right: "R2" }, { id: "c", left: "L3", right: "R3" }] };
    expect(answerText(m)).toBe("L1 → R1\nL2 → R2\nL3 → R3");
  });

  it("a program is written block by block, loops and conditions indented", () => {
    expect(answerText(prog([{ t: "move" }, { t: "left" }, { t: "right" }]))).toBe("move\nturn left\nturn right");
    expect(answerText(prog([{ t: "repeat", n: 3, body: [{ t: "move" }, { t: "right" }] }, { t: "move" }]))).toBe("repeat ×3\n  move\n  turn right\nmove");
    expect(answerText(prog([{ t: "if", body: [{ t: "move" }], else: [{ t: "left" }, { t: "move" }] }]))).toBe("if path clear\n  move\nelse\n  turn left\n  move");
    expect(answerText(prog([{ t: "if", body: [{ t: "move" }], else: [] }]))).toBe("if path clear\n  move"); // no empty "else"
    expect(answerText(prog([{ t: "repeat", n: 2, body: [{ t: "if", body: [{ t: "move" }], else: [{ t: "right" }] }] }]))).toBe("repeat ×2\n  if path clear\n    move\n  else\n    turn right");
  });

  it("a simulation has no single answer: the explanation says it all", () => {
    expect(answerText({ type: "simulation", id: "s1", title: "t", prompt: "p", concept: "c", explanation: "e", level: 1, sim: { kind: "lever", leftWeight: 6, leftDistance: 4, rightWeight: 3, maxDistance: 10, tolerance: 0.25 } })).toBeNull();
  });

  it("buildReview lists the shown answers first, then the most misses; unresolved and removed challenges are left out", () => {
    const s = fresh();
    s.records["c-var1"] = rec({ wrong: 1, attempts: 2 });
    s.records["c-var2"] = rec({ wrong: 2, attempts: 3 });
    s.records["c-cond1"] = rec({ correct: false, revealed: true, wrong: 3, attempts: 3, hints: 1 });
    s.records["c-loop1"] = rec({ resolved: false, correct: false, wrong: 2, attempts: 2 });
    s.records["c-gone"] = rec({ wrong: 2 });
    const items = buildReview(spec, s);
    expect(items.map((i) => i.challengeId)).toEqual(["c-cond1", "c-var2", "c-var1"]);
    // a shown answer comes before every other kind, whatever the number of misses
    s.records["c-cond1"] = rec({ correct: false, revealed: true, wrong: 1, attempts: 1 });
    expect(buildReview(spec, s).map((i) => i.challengeId)).toEqual(["c-cond1", "c-var2", "c-var1"]);
    expect(items[0]).toMatchObject({ revealed: true, wrong: 3, hints: 1, explanation: chal("c-cond1").explanation, title: chal("c-cond1").title, prompt: chal("c-cond1").prompt });
  });
});

describe("character reactions", () => {
  const npc = {
    lines: ["hello"],
    reactions: [{ afterMissionId: "m-a", lines: ["well done A"] }, { afterMissionId: "m-b", lines: ["well done B"] }],
  };

  it("keeps the original lines until a mission the character reacts to is done", () => {
    expect(withReaction(npc, [])).toBe(npc);
    expect(withReaction(npc, ["m-other"])).toBe(npc);
    expect(withReaction({ lines: ["hi"], reactions: [] }, ["m-a"]).lines).toEqual(["hi"]);
    expect(withReaction({ lines: ["hi"] } as { lines: string[]; reactions: never[] }, ["m-a"]).lines).toEqual(["hi"]); // older games have no list at all
  });

  it("the latest finished reaction in the list wins, whatever order the missions were finished in", () => {
    expect(withReaction(npc, ["m-a"]).lines).toEqual(["well done A"]);
    expect(withReaction(npc, ["m-b"]).lines).toEqual(["well done B"]);
    expect(withReaction(npc, ["m-b", "m-a"]).lines).toEqual(["well done B"]);
  });

  it("returns a copy with the new lines and leaves the character as it was", () => {
    const before = JSON.stringify(npc);
    const out = withReaction(npc, ["m-a"]);
    expect(out).not.toBe(npc);
    expect(out.reactions).toBe(npc.reactions);
    expect(JSON.stringify(npc)).toBe(before);
  });
});
