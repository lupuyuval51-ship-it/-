import { describe, expect, it } from "vitest";
import { MAX_ATTEMPTS_PER_CHALLENGE } from "@/config/limits";
import { addFinalBoss } from "@/lib/game/spec/boss";
import { processEvent, type GameEvent } from "@/lib/game/state/events";
import {
  BOSS_BONUS, COLLECT_POINTS, MISSION_BONUS, bossOfStation, challengePoints, chooseVariant, collectibleId, collectibleIds, findArea, initialState, maxScore,
  missionDone, missionUnlocked, objectiveProgress, pointsAwarded, portalOpen, recompute, recordAttempt, stationActive, stationDone, summarize, toClientState, type ChallengeRecord, type PlayState,
} from "@/lib/game/state/progress";
import { correctAnswer, validDemoSpec, wrongAnswer } from "./helpers";

/**
 * The pure progress rules (mission / station state, scoring, achievements, the learning summary), tested one rule at a time on the
 * ready-made adventure: area a-plaza (talk n-byte, s-var1, s-var2 -> m-boot, then m-choices, m-loops) with a portal to a-lab.
 */
const SEED = "t2-progress";
const spec = validDemoSpec({ gameType: "adventure", mode: "FULL" });
const fresh = (): PlayState => initialState(spec, 0);
const rec = (over: Partial<ChallengeRecord> = {}): ChallengeRecord => ({ stationId: "x", attempts: 1, wrong: 0, hints: 0, resolved: true, correct: true, revealed: false, points: 0, timeMs: null, ...over });
const missionOf = (id: string) => spec.missions.find((m) => m.id === id)!;
const stationOf = (id: string) => spec.areas.flatMap((a) => a.stations).find((s) => s.id === id)!;
const play = (state: PlayState, event: GameEvent, now = 10_000) => processEvent(spec, state, event, { now, seed: SEED });

describe("objectiveProgress: every objective type reports how far along it is", () => {
  it("talk: done once the character was spoken to, target 1", () => {
    const o = missionOf("m-boot");
    expect(objectiveProgress(spec, fresh(), o, 0)).toEqual({ done: false, current: 0, target: 1 });
    expect(objectiveProgress(spec, { ...fresh(), talked: ["n-byte"] }, o, 0)).toEqual({ done: true, current: 1, target: 1 });
    expect(objectiveProgress(spec, { ...fresh(), talked: ["n-gear"] }, o, 0).done).toBe(false); // somebody else
  });

  it("solve: counts the resolved stations of the listed challenges, and a station given up on (revealed) counts too", () => {
    const o = missionOf("m-boot");
    expect(objectiveProgress(spec, fresh(), o, 1)).toEqual({ done: false, current: 0, target: 2 });
    expect(objectiveProgress(spec, { ...fresh(), resolvedStations: { "s-var1": "correct" } }, o, 1)).toEqual({ done: false, current: 1, target: 2 });
    expect(objectiveProgress(spec, { ...fresh(), resolvedStations: { "s-var1": "correct", "s-var2": "revealed" } }, o, 1)).toEqual({ done: true, current: 2, target: 2 });
    // a station of another challenge never counts towards this objective
    expect(objectiveProgress(spec, { ...fresh(), resolvedStations: { "s-cond1": "correct", "s-loop1": "correct" } }, o, 1).current).toBe(0);
  });

  it("collect: only the items of the mission's own area count, and progress never exceeds the target", () => {
    const o = missionOf("m-choices"); // collect 2 in a-plaza
    const idx = o.objectives.findIndex((x) => x.type === "collect");
    expect(objectiveProgress(spec, fresh(), o, idx)).toEqual({ done: false, current: 0, target: 2 });
    expect(objectiveProgress(spec, { ...fresh(), collected: ["a-lab:c0", "a-lab:c1", "a-plaza:c0"] }, o, idx)).toEqual({ done: false, current: 1, target: 2 });
    expect(objectiveProgress(spec, { ...fresh(), collected: ["a-plaza:c0", "a-plaza:c1", "a-plaza:c2", "a-plaza:c3"] }, o, idx)).toEqual({ done: true, current: 2, target: 2 });
  });

  it("visit: counts the visited lore stations", () => {
    const o = missionOf("m-loops");
    const idx = o.objectives.findIndex((x) => x.type === "visit");
    expect(objectiveProgress(spec, fresh(), o, idx)).toEqual({ done: false, current: 0, target: 1 });
    expect(objectiveProgress(spec, { ...fresh(), visited: ["s-lore1"] }, o, idx)).toEqual({ done: true, current: 1, target: 1 });
  });

  it("defeat: follows the battle phase by phase, and an unknown boss is never done", () => {
    const boss = addFinalBoss(spec).spec;
    const m = boss.missions.find((x) => x.objectives.some((o) => o.type === "defeat"))!;
    const b = boss.bosses[0]!;
    const idx = m.objectives.findIndex((o) => o.type === "defeat");
    expect(objectiveProgress(boss, fresh(), m, idx)).toEqual({ done: false, current: 0, target: b.phaseStationIds.length });
    const half = Object.fromEntries(b.phaseStationIds.slice(0, 2).map((id) => [id, "correct" as const]));
    expect(objectiveProgress(boss, { ...fresh(), resolvedStations: half }, m, idx)).toEqual({ done: false, current: 2, target: b.phaseStationIds.length });
    const all = Object.fromEntries(b.phaseStationIds.map((id) => [id, "correct" as const]));
    expect(objectiveProgress(boss, { ...fresh(), resolvedStations: all }, m, idx).done).toBe(true);
    const ghost = { ...m, objectives: [{ type: "defeat" as const, text: "x", bossId: "no-such-boss" }] };
    expect(objectiveProgress(boss, fresh(), ghost, 0)).toEqual({ done: false, current: 0, target: 1 });
  });

  it("a mission is done only when every one of its objectives is", () => {
    const m = missionOf("m-boot");
    const talkedOnly = { ...fresh(), talked: ["n-byte"] };
    expect(missionDone(spec, talkedOnly, m)).toBe(false);
    expect(missionDone(spec, { ...talkedOnly, resolvedStations: { "s-var1": "correct", "s-var2": "correct" } }, m)).toBe(true);
  });
});

describe("what is playable: missions unlock stations and portals", () => {
  it("a mission is unlocked when every mission it requires is done", () => {
    expect(missionUnlocked(fresh(), missionOf("m-boot"))).toBe(true); // requires nothing
    expect(missionUnlocked(fresh(), missionOf("m-choices"))).toBe(false);
    expect(missionUnlocked({ missionsDone: ["m-boot"] }, missionOf("m-choices"))).toBe(true);
    expect(missionUnlocked({ missionsDone: ["m-choices"] }, missionOf("m-loops"))).toBe(true);
    expect(missionUnlocked({ missionsDone: [] }, { ...missionOf("m-loops"), requires: ["m-boot", "m-choices"] })).toBe(false);
    expect(missionUnlocked({ missionsDone: ["m-boot"] }, { ...missionOf("m-loops"), requires: ["m-boot", "m-choices"] })).toBe(false); // all of them, not any
  });

  it("a station waits for the mission that needs it: solve stations and lore stations alike", () => {
    expect(stationActive(spec, fresh(), stationOf("s-var1"))).toBe(true);
    expect(stationActive(spec, fresh(), stationOf("s-cond1"))).toBe(false); // m-choices needs m-boot
    expect(stationActive(spec, fresh(), stationOf("s-lore1"))).toBe(false); // the visit objective of m-loops
    const later = { ...fresh(), missionsDone: ["m-boot", "m-choices"] };
    expect(stationActive(spec, later, stationOf("s-cond1"))).toBe(true);
    expect(stationActive(spec, later, stationOf("s-lore1"))).toBe(true);
  });

  it("a station no mission mentions is always playable, and one that two missions need opens with either", () => {
    const copy = structuredClone(spec);
    const boot = copy.missions.find((m) => m.id === "m-boot")!;
    const solve = boot.objectives.find((o) => o.type === "solve")!;
    if (solve.type === "solve") solve.challengeIds = ["c-var1"]; // nothing asks for s-var2 any more
    expect(stationActive(copy, fresh(), copy.areas[0]!.stations.find((s) => s.id === "s-var2")!)).toBe(true);
    copy.missions.push({ id: "m-extra", title: "Extra", story: "Another way in.", areaId: "a-plaza", requires: [], objectives: [{ type: "solve", text: "again", challengeIds: ["c-cond1"] }], optional: true });
    expect(stationActive(copy, fresh(), copy.areas[0]!.stations.find((s) => s.id === "s-cond1")!)).toBe(true); // m-extra is open from the start
  });

  it("a portal opens when all the missions it waits for are done; an area without a portal never opens", () => {
    const plaza = findArea(spec, "a-plaza")!;
    const lab = findArea(spec, "a-lab")!;
    expect(portalOpen(spec, { missionsDone: [] }, plaza)).toBe(false);
    expect(portalOpen(spec, { missionsDone: ["m-boot", "m-choices"] }, plaza)).toBe(false);
    expect(portalOpen(spec, { missionsDone: plaza.portal!.requiresMissionIds }, plaza)).toBe(true);
    expect(portalOpen(spec, { missionsDone: spec.missions.map((m) => m.id) }, lab)).toBe(false);
  });

  it("the rounds of a boss battle open in order: a later round stays locked until the one before it is resolved", () => {
    const boss = addFinalBoss(spec).spec;
    const b = boss.bosses[0]!;
    const stations = boss.areas.flatMap((a) => a.stations);
    const phase = (i: number) => stations.find((st) => st.id === b.phaseStationIds[i])!;
    // everything that unlocks the stations of the battle is done; only the order of the rounds is left
    const state = { ...fresh(), areaId: b.areaId, missionsDone: boss.missions.filter((m) => !m.objectives.some((o) => o.type === "defeat")).map((m) => m.id) };
    expect(stationActive(boss, state, phase(0))).toBe(true);
    expect(stationActive(boss, state, phase(1))).toBe(false);
    expect(stationActive(boss, state, phase(2))).toBe(false);
    const afterFirst = { ...state, resolvedStations: { [b.phaseStationIds[0]!]: "revealed" as const } }; // giving up on a round also moves the battle on
    expect(stationActive(boss, afterFirst, phase(1))).toBe(true);
    expect(stationActive(boss, afterFirst, phase(2))).toBe(false);
  });

  it("bossOfStation names the battle and the round a station belongs to", () => {
    const boss = addFinalBoss(spec).spec;
    const b = boss.bosses[0]!;
    b.phaseStationIds.forEach((id, i) => expect(bossOfStation(boss, id)).toEqual({ boss: b, phase: i }));
    expect(bossOfStation(boss, "s-var1")).toBeUndefined();
    expect(bossOfStation(spec, "s-robot1")).toBeUndefined(); // a game without bosses
  });

  it("stationDone: a challenge is done when resolved, a lore card when visited", () => {
    expect(stationDone({ resolvedStations: {}, visited: [] }, "s-var1")).toBe(false);
    expect(stationDone({ resolvedStations: { "s-var1": "revealed" }, visited: [] }, "s-var1")).toBe(true);
    expect(stationDone({ resolvedStations: {}, visited: ["s-lore1"] }, "s-lore1")).toBe(true);
  });

  it("collectible ids are `<area>:c<index>`, one per declared collectible", () => {
    expect(collectibleId("a-plaza", 3)).toBe("a-plaza:c3");
    const area = findArea(spec, "a-plaza")!;
    expect(collectibleIds(area)).toEqual(Array.from({ length: area.collectibles.count }, (_, i) => `a-plaza:c${i}`));
  });
});

describe("scoring arithmetic", () => {
  it("points per level are 100 / 150 / 200, and an unknown level pays like level 1", () => {
    expect([1, 2, 3].map(challengePoints)).toEqual([100, 150, 200]);
    expect(challengePoints(0)).toBe(100);
    expect(challengePoints(9)).toBe(100);
  });

  it("attempts and hints multiply: first try 100%, second 60%, third 30%; one hint -15%, never more than -30%", () => {
    const base = { level: 2, hints: 0, elapsedMs: null, timedBonus: false };
    expect(pointsAwarded({ ...base, wrongBefore: 0 })).toBe(150);
    expect(pointsAwarded({ ...base, wrongBefore: 1 })).toBe(90);
    expect(pointsAwarded({ ...base, wrongBefore: 2 })).toBe(45);
    expect(pointsAwarded({ ...base, wrongBefore: 7 })).toBe(45); // never below the third-attempt rate
    expect(pointsAwarded({ ...base, wrongBefore: 0, hints: 1 })).toBe(128); // 127.5
    expect(pointsAwarded({ ...base, wrongBefore: 0, hints: 2 })).toBe(105);
    expect(pointsAwarded({ ...base, wrongBefore: 0, hints: 5 })).toBe(105); // capped at -30%
    expect(pointsAwarded({ ...base, wrongBefore: 1, hints: 1 })).toBe(77); // 76.5
  });

  it("the time bonus is up to +25% of the base, shrinks linearly to nothing at the limit, and needs a limit and a measured time", () => {
    const base = { level: 1, wrongBefore: 0, hints: 0, timeLimitSec: 40, timedBonus: true };
    expect(pointsAwarded({ ...base, elapsedMs: 0 })).toBe(125);
    expect(pointsAwarded({ ...base, elapsedMs: 10_000 })).toBe(119); // 118.75
    expect(pointsAwarded({ ...base, elapsedMs: 20_000 })).toBe(113); // 112.5
    expect(pointsAwarded({ ...base, elapsedMs: 40_000 })).toBe(100); // exactly at the limit
    expect(pointsAwarded({ ...base, elapsedMs: 40_001 })).toBe(100); // late: no bonus, and never a penalty
    expect(pointsAwarded({ ...base, elapsedMs: null })).toBe(100); // opened before the clock was kept (older saves)
    expect(pointsAwarded({ ...base, elapsedMs: 0, timeLimitSec: undefined })).toBe(100);
    expect(pointsAwarded({ ...base, elapsedMs: 0, timedBonus: false })).toBe(100);
    // the bonus rides on top of the reduced base
    expect(pointsAwarded({ ...base, wrongBefore: 1, elapsedMs: 0 })).toBe(85); // 60 + 25% of 100
  });
});

describe("recordAttempt: one graded attempt moves the record, the score and the streak", () => {
  const withServed = (stationId = "s-var1", challengeId = "c-var1"): PlayState => ({ ...fresh(), served: { [stationId]: challengeId }, openedAt: { [stationId]: 1_000 } });

  it("a first-try success pays in full, resolves the station and starts a streak", () => {
    const s = withServed();
    const out = recordAttempt(spec, s, "s-var1", true, 1_000);
    expect(out).toEqual({ resolved: true, correct: true, revealed: false, pointsAwarded: 100, attemptsLeft: MAX_ATTEMPTS_PER_CHALLENGE });
    expect(s.score).toBe(100);
    expect(s.streak).toBe(1);
    expect(s.recent).toEqual(["good"]);
    expect(s.resolvedStations["s-var1"]).toBe("correct");
    expect(s.records["c-var1"]).toMatchObject({ attempts: 1, wrong: 0, resolved: true, correct: true, revealed: false, points: 100 });
  });

  it("a miss costs a try and the streak; success after it pays 60% and does not rebuild the streak", () => {
    const s = withServed();
    s.streak = 2;
    const miss = recordAttempt(spec, s, "s-var1", false, 2_000);
    expect(miss).toEqual({ resolved: false, correct: false, revealed: false, pointsAwarded: 0, attemptsLeft: MAX_ATTEMPTS_PER_CHALLENGE - 1 });
    expect(s.streak).toBe(0);
    expect(s.resolvedStations["s-var1"]).toBeUndefined();
    expect(s.recent).toEqual([]); // an open challenge is not an outcome yet
    const ok = recordAttempt(spec, s, "s-var1", true, 3_000);
    expect(ok.pointsAwarded).toBe(60);
    expect(s.streak).toBe(0);
    expect(s.recent).toEqual(["bad"]);
    expect(s.records["c-var1"]).toMatchObject({ attempts: 2, wrong: 1 });
  });

  it(`after ${MAX_ATTEMPTS_PER_CHALLENGE} misses the answer is revealed: resolved, no points, a "bad" outcome`, () => {
    const s = withServed();
    let last = recordAttempt(spec, s, "s-var1", false, 2_000);
    for (let i = 1; i < MAX_ATTEMPTS_PER_CHALLENGE; i++) {
      expect(last.resolved).toBe(false);
      last = recordAttempt(spec, s, "s-var1", false, 2_000 + i);
    }
    expect(last).toEqual({ resolved: true, correct: false, revealed: true, pointsAwarded: 0, attemptsLeft: 0 });
    expect(s.resolvedStations["s-var1"]).toBe("revealed");
    expect(s.score).toBe(0);
    expect(s.recent).toEqual(["bad"]);
    expect(s.records["c-var1"]).toMatchObject({ revealed: true, correct: false, points: 0 });
  });

  it("keeps only the six latest outcomes (adaptive difficulty looks at the recent ones)", () => {
    const s = fresh();
    s.recent = ["bad", "bad", "bad", "bad", "bad", "good"];
    s.served = { "s-var1": "c-var1" };
    recordAttempt(spec, s, "s-var1", true, 5_000);
    expect(s.recent).toEqual(["bad", "bad", "bad", "bad", "good", "good"]);
  });

  it("a hint taken earlier lowers the payout through the record", () => {
    const s = withServed();
    s.records["c-var1"] = rec({ stationId: "s-var1", attempts: 0, hints: 1, resolved: false, correct: false });
    expect(recordAttempt(spec, s, "s-var1", true, 2_000).pointsAwarded).toBe(85);
  });

  it("the timed bonus only counts when the challenge has a limit; the clock is the station's own opening time", () => {
    const timed = structuredClone(spec);
    timed.challenges.find((c) => c.id === "c-var1")!.timeLimitSec = 40;
    const s = withServed();
    expect(recordAttempt(timed, s, "s-var1", true, 11_000).pointsAwarded).toBe(119); // opened at 1 000, solved after 10 s
    expect(s.records["c-var1"]!.timeMs).toBe(10_000);
    const late = withServed();
    expect(recordAttempt(timed, late, "s-var1", true, 61_000).pointsAwarded).toBe(100);
    const untimed = withServed();
    expect(recordAttempt(spec, untimed, "s-var1", true, 1_001).pointsAwarded).toBe(100);
    const backwards = withServed();
    expect(recordAttempt(timed, backwards, "s-var1", true, 500).pointsAwarded).toBe(125); // a clock that went back counts as instant, never negative
    expect(backwards.records["c-var1"]!.timeMs).toBe(0);
  });
});

describe("the timed bonus through the reducer: reopening a challenge never restarts its clock", () => {
  const timed = structuredClone(spec);
  timed.challenges.find((c) => c.id === "c-var1")!.timeLimitSec = 40;
  const c = timed.challenges.find((x) => x.id === "c-var1")!;
  const run = (events: [GameEvent, number][]) => {
    let s = initialState(timed, 0);
    let last: ReturnType<typeof processEvent> | undefined;
    for (const [e, at] of events) {
      last = processEvent(timed, s, e, { now: at, seed: SEED });
      s = last.state;
    }
    return { s, last: last! };
  };

  it("opening again later keeps the first opening time", () => {
    const open: GameEvent = { type: "open", stationId: "s-var1" };
    const answer: GameEvent = { type: "answer", stationId: "s-var1", answer: correctAnswer(c, SEED) };
    const once = run([[open, 1_000], [answer, 11_000]]);
    expect(once.s.score).toBe(119);
    const twice = run([[open, 1_000], [open, 31_000], [answer, 35_000]]);
    expect(twice.s.openedAt["s-var1"]).toBe(1_000);
    expect(twice.s.score).toBe(104); // 34 s after the FIRST opening: 100 + 0.25 * 100 * (1 - 34/40) = 103.75 (a restarted clock would pay 123)
  });
});

describe("recompute: missions, bonuses, completion and achievements", () => {
  const everyStationDone = (state: PlayState) => {
    for (const area of spec.areas) for (const st of area.stations) {
      if (st.kind === "challenge") state.resolvedStations[st.id] = "correct";
      else state.visited.push(st.id);
    }
    for (const area of spec.areas) {
      state.collected.push(...collectibleIds(area));
      for (const n of area.npcs) state.talked.push(n.id);
    }
  };

  it("finishing the objectives completes the mission once and pays its bonus once, however often it is recomputed", () => {
    const s = fresh();
    s.talked = ["n-byte"];
    s.resolvedStations = { "s-var1": "correct", "s-var2": "correct" };
    const first = recompute(spec, s);
    expect(first.newlyCompleted).toEqual(["m-boot"]);
    expect(s.score).toBe(MISSION_BONUS);
    expect(s.finished).toBe(false);
    const again = recompute(spec, s);
    expect(again.newlyCompleted).toEqual([]);
    expect(s.score).toBe(MISSION_BONUS);
    expect(s.missionsDone).toEqual(["m-boot"]);
  });

  it("a chain of missions that all become done at once completes in one pass, even listed out of order", () => {
    const reversed = structuredClone(spec);
    reversed.missions.reverse();
    const s = fresh();
    everyStationDone(s);
    const out = recompute(reversed, s);
    expect(out.newlyCompleted).toEqual(["m-boot", "m-choices", "m-loops", "m-robot", "m-final"]); // dependency order, not list order
    expect(s.finished).toBe(true);
    expect(s.score).toBe(5 * MISSION_BONUS);
  });

  it("a mission whose prerequisite is open stays open even when its own objectives are done", () => {
    const s = fresh();
    s.collected = ["a-plaza:c0", "a-plaza:c1"];
    s.resolvedStations = { "s-cond1": "correct" }; // m-choices is done in itself, but m-boot is not
    expect(recompute(spec, s).newlyCompleted).toEqual([]);
    expect(s.missionsDone).toEqual([]);
  });

  it("side missions pay their bonus but never block the end of the game", () => {
    const side = structuredClone(spec);
    side.missions.push({ id: "m-side", title: "Side", story: "A detour.", areaId: "a-plaza", requires: ["m-boot"], objectives: [{ type: "collect", text: "gems", count: 5 }], optional: true });
    const s = fresh();
    everyStationDone(s);
    s.collected = s.collected.filter((id) => id !== "a-plaza:c4"); // 4 of the 5 collectibles of a-plaza: m-side stays open
    const out = recompute(side, s);
    expect(out.newlyCompleted).not.toContain("m-side");
    expect(s.finished).toBe(true);
    expect(s.achievements).toContain("completed");
    expect(s.achievements).not.toContain("side_quester");
    s.collected.push("a-plaza:c4");
    const next = recompute(side, s);
    expect(next.newlyCompleted).toEqual(["m-side"]);
    expect(next.newAchievements).toContain("side_quester");
    expect(s.score).toBe(6 * MISSION_BONUS);
  });

  it("no side missions in the game means no side-quester badge", () => {
    const s = fresh();
    everyStationDone(s);
    recompute(spec, s);
    expect(s.achievements).not.toContain("side_quester");
  });

  it("achievements: first try, persistent, explorer, the three-in-a-row streak (which stays once earned)", () => {
    const s = fresh();
    s.records["c-var1"] = rec({ wrong: 0 });
    s.records["c-var2"] = rec({ wrong: 2, attempts: 3 });
    s.collected = spec.areas.flatMap((a) => collectibleIds(a));
    s.streak = 3;
    const out = recompute(spec, s);
    expect(out.newAchievements.sort()).toEqual(["explorer", "first_try", "persistent", "streak_3"]);
    s.streak = 0; // a miss later does not take it back
    expect(recompute(spec, s).newAchievements).toEqual([]);
    expect(s.achievements).toContain("streak_3");
  });

  it("one miss then success is a first-try failure but not yet 'persistent' (that takes two misses)", () => {
    const s = fresh();
    s.records["c-var1"] = rec({ wrong: 1, attempts: 2 });
    recompute(spec, s);
    expect(s.achievements).toEqual([]);
    s.records["c-var2"] = rec({ wrong: 2, attempts: 3 });
    recompute(spec, s);
    expect(s.achievements).toEqual(["persistent"]);
  });

  it("an unresolved record or a revealed answer earns no first-try / persistent badge", () => {
    const s = fresh();
    s.records["c-var1"] = rec({ resolved: false, correct: false, wrong: 0, attempts: 0 });
    s.records["c-var2"] = rec({ resolved: true, correct: false, revealed: true, wrong: 3, attempts: 3 });
    recompute(spec, s);
    expect(s.achievements).toEqual([]);
  });

  it("explorer needs every collectible of the whole game, not only of one area", () => {
    const s = fresh();
    s.collected = collectibleIds(findArea(spec, "a-plaza")!);
    recompute(spec, s);
    expect(s.achievements).not.toContain("explorer");
  });

  it("a game with nothing to collect has no explorer badge to hand out", () => {
    const bare = structuredClone(spec);
    for (const a of bare.areas) a.collectibles.count = 0;
    for (const m of bare.missions) m.objectives = m.objectives.filter((o) => o.type !== "collect");
    const s = fresh();
    recompute(bare, s);
    expect(s.achievements).not.toContain("explorer");
  });

  it("end-of-game badges: completed always, no_hints only for a hint-free run, flawless only when every answered challenge was right first time", () => {
    const clean = fresh();
    everyStationDone(clean);
    clean.records["c-var1"] = rec();
    recompute(spec, clean);
    expect(clean.achievements).toEqual(expect.arrayContaining(["completed", "no_hints", "flawless", "first_try", "explorer"]));

    const hinted = fresh();
    everyStationDone(hinted);
    hinted.hintsUsed = 1;
    hinted.records["c-var1"] = rec({ hints: 1 });
    recompute(spec, hinted);
    expect(hinted.achievements).toContain("completed");
    expect(hinted.achievements).not.toContain("no_hints");
    expect(hinted.achievements).toContain("flawless"); // a hint is not a wrong answer

    const stumbled = fresh();
    everyStationDone(stumbled);
    stumbled.records["c-var1"] = rec();
    stumbled.records["c-var2"] = rec({ wrong: 1, attempts: 2 });
    recompute(spec, stumbled);
    expect(stumbled.achievements).not.toContain("flawless");

    const unfinished = fresh();
    unfinished.records["c-var1"] = rec();
    recompute(spec, unfinished);
    expect(unfinished.achievements).not.toContain("completed");
    expect(unfinished.achievements).not.toContain("flawless");
    expect(unfinished.achievements).not.toContain("no_hints"); // not before the game is over
  });

  it("the boss bonus and the boss badge come once, when the last round is resolved", () => {
    const bossSpec = addFinalBoss(spec).spec;
    const b = bossSpec.bosses[0]!;
    const s = fresh();
    s.resolvedStations = Object.fromEntries(b.phaseStationIds.slice(0, -1).map((id) => [id, "correct" as const]));
    expect(recompute(bossSpec, s).defeatedBosses).toEqual([]);
    s.resolvedStations[b.phaseStationIds.at(-1)!] = "correct";
    const out = recompute(bossSpec, s);
    expect(out.defeatedBosses).toEqual([b.id]);
    expect(s.score).toBe(BOSS_BONUS);
    expect(s.achievements).toContain("boss_slayer");
    expect(recompute(bossSpec, s).defeatedBosses).toEqual([]);
    expect(s.score).toBe(BOSS_BONUS);
  });
});

describe("maxScore: what a perfect run can earn, from the content", () => {
  const base = maxScore(spec);

  it("each collectible adds 10 and each mission 50, side missions included", () => {
    const more = structuredClone(spec);
    more.areas[0]!.collectibles.count += 1;
    expect(maxScore(more) - base).toBe(COLLECT_POINTS);
    more.missions.push({ id: "m-side", title: "Side", story: "A detour.", areaId: "a-plaza", requires: [], objectives: [{ type: "talk", text: "hi", npcId: "n-byte" }], optional: true });
    expect(maxScore(more) - base).toBe(COLLECT_POINTS + MISSION_BONUS);
  });

  it("a boss adds its bonus", () => {
    expect(maxScore(addFinalBoss(spec).spec)).toBe(base + MISSION_BONUS + BOSS_BONUS); // the battle's own mission and the boss
  });

  it("only challenges that stand on a station count, at their own level; a variant counts only through the harder level it can pay", () => {
    const lvl = (id: string) => spec.challenges.find((c) => c.id === id)!.level;
    const raised = structuredClone(spec);
    // c-cond2 (level 3, no variants) loses a level: exactly the difference between 200 and 150
    raised.challenges.find((c) => c.id === "c-cond2")!.level = 2;
    expect(lvl("c-cond2")).toBe(3);
    expect(base - maxScore(raised)).toBe(challengePoints(3) - challengePoints(2));
    // c-var1's easier variant (level 1) is not placed on a station, so it adds nothing
    const easierUp = structuredClone(spec);
    easierUp.challenges.find((c) => c.id === "c-var1-easy")!.level = 3;
    expect(maxScore(easierUp)).toBe(base);
    // a "harder" variant that is not harder never lowers the maximum below the challenge's own level
    const softer = structuredClone(spec);
    softer.challenges.find((c) => c.id === "c-loop1-hard")!.level = 1;
    expect(maxScore(softer)).toBe(base - (challengePoints(3) - challengePoints(2)));
    // c-loop1 (level 2) has a harder variant of level 3: the maximum already counts the 200, not the 150
    const noHard = structuredClone(spec);
    noHard.challenges.find((c) => c.id === "c-loop1-hard")!.level = 2;
    expect(base - maxScore(noHard)).toBe(challengePoints(3) - challengePoints(2));
  });
});

describe("chooseVariant: easier after two struggles, harder after a streak of three", () => {
  const st = stationOf("s-var2"); // has an easier variant
  const hard = stationOf("s-loop1"); // has a harder variant

  it("never serves a variant the challenge does not have", () => {
    const s = fresh();
    s.recent = ["bad", "bad"];
    s.streak = 5;
    expect(chooseVariant(spec, s, stationOf("s-seq1"))).toBe("c-seq1"); // no variants at all
    expect(chooseVariant(spec, s, hard)).toBe("c-loop1-hard"); // the streak wins here, there is no easier one
    s.streak = 0;
    expect(chooseVariant(spec, s, hard)).toBe("c-loop1"); // two struggles, but this challenge has no easier variant
  });

  it("needs two recent outcomes, both bad, to ease off", () => {
    const s = fresh();
    s.recent = ["bad"];
    expect(chooseVariant(spec, s, st)).toBe("c-var2");
    s.recent = ["bad", "bad"];
    expect(chooseVariant(spec, s, st)).toBe("c-var2-easy");
    s.recent = ["good", "bad", "bad"]; // the last two count
    expect(chooseVariant(spec, s, st)).toBe("c-var2-easy");
    s.recent = ["bad", "bad", "good"];
    expect(chooseVariant(spec, s, st)).toBe("c-var2");
  });

  it("is chosen when a station is first opened and then stays (the reducer end of it)", () => {
    const s = { ...fresh(), missionsDone: ["m-boot", "m-choices"], streak: 3 }; // m-loops (s-loop1) is open
    const opened = play(s, { type: "open", stationId: "s-loop1" });
    expect(opened.state.served["s-loop1"]).toBe("c-loop1-hard");
    const later = { ...opened.state, streak: 0 };
    expect(play(later, { type: "open", stationId: "s-loop1" }, 20_000).state.served["s-loop1"]).toBe("c-loop1-hard");
  });
});

describe("summarize: the learning report", () => {
  it("mastery: first try 1, each miss -0.25, each hint -0.1, never below 0.25 once solved, 0 when the answer was shown", () => {
    const s = fresh();
    // c-var1 and c-var2 assess o-vars, c-cond1 assesses o-cond, c-loop1 assesses o-loop
    s.records["c-var1"] = rec({ wrong: 0 });
    s.records["c-var2"] = rec({ wrong: 1, hints: 1, attempts: 2 }); // 1 - 0.25 - 0.1 = 0.65
    s.records["c-cond1"] = rec({ wrong: 2, hints: 1, attempts: 3 }); // 1 - 0.5 - 0.1 = 0.4
    s.records["c-loop1"] = rec({ correct: false, revealed: true, wrong: 3, attempts: 3 });
    const sum = summarize(spec, s, 1_000);
    const mastery = Object.fromEntries(sum.objectives.map((o) => [o.id, o.mastery]));
    expect(mastery["o-vars"]).toBeCloseTo((1 + 0.65) / 2, 9);
    expect(mastery["o-cond"]).toBeCloseTo(0.4, 9);
    expect(mastery["o-loop"]).toBe(0);
    expect(mastery["o-func"]).toBeNull(); // nothing answered for it yet: unknown, not zero
    s.records["c-cond1"] = rec({ wrong: 2, hints: 9, attempts: 3 });
    expect(summarize(spec, s, 1_000).objectives.find((o) => o.id === "o-cond")!.mastery).toBe(0.25); // the floor
  });

  it("concepts are tallied per concept; unresolved attempts are left out; a challenge that is no longer in the game is skipped", () => {
    const same = structuredClone(spec);
    const concept = same.challenges.find((c) => c.id === "c-var1")!.concept;
    same.challenges.find((c) => c.id === "c-var2")!.concept = concept; // two challenges, one concept
    const s = fresh();
    s.records["c-var1"] = rec({ wrong: 0 });
    s.records["c-var2"] = rec({ wrong: 1, attempts: 2 });
    s.records["c-cond1"] = rec({ resolved: false, correct: false, attempts: 1, wrong: 1 });
    s.records["c-removed-by-an-edit"] = rec();
    const sum = summarize(same, s, 1_000);
    expect(sum.concepts.find((c) => c.concept === concept)).toMatchObject({ total: 2, correct: 2, firstTry: 1 });
    expect(sum.concepts.some((c) => c.concept === same.challenges.find((c2) => c2.id === "c-cond1")!.concept)).toBe(false);
    expect(sum.concepts.reduce((n, c) => n + c.total, 0)).toBe(2);
    expect(sum.review.map((r) => r.challengeId)).toEqual(["c-var2"]);
  });

  it("review: a shown answer is `revealed`, any other miss is `multiple_attempts`", () => {
    const s = fresh();
    s.records["c-var1"] = rec({ correct: false, revealed: true, wrong: 3, attempts: 3 });
    s.records["c-var2"] = rec({ wrong: 1, attempts: 2 });
    s.records["c-cond1"] = rec({ wrong: 0 });
    expect(summarize(spec, s, 1_000).review).toEqual([
      expect.objectContaining({ challengeId: "c-var1", reason: "revealed" }),
      expect.objectContaining({ challengeId: "c-var2", reason: "multiple_attempts" }),
    ]);
  });

  it("the percentage never passes 100: a score above the base maximum (the timed bonus) raises the maximum with it", () => {
    const s = fresh();
    s.finished = true;
    s.score = maxScore(spec) + 120;
    const sum = summarize(spec, s, 1_000);
    expect(sum.maxScore).toBe(s.score);
    expect(sum.percent).toBe(1);
    expect(sum.stars).toBe(3);
  });

  it("stars: none until the game is finished; the percentage sets the rest (the 60% and 85% edges)", () => {
    const s = fresh();
    const max = maxScore(spec);
    s.score = Math.ceil(max * 0.9);
    expect(summarize(spec, s, 0).stars).toBe(0); // 90% but not finished
    s.finished = true;
    expect(summarize(spec, s, 0).stars).toBe(3);
    s.score = Math.ceil(max * 0.85);
    expect(summarize(spec, s, 0).stars).toBe(3);
    s.score = Math.ceil(max * 0.85) - 1;
    expect(summarize(spec, s, 0).stars).toBe(2);
    s.score = Math.ceil(max * 0.6);
    expect(summarize(spec, s, 0).stars).toBe(2);
    s.score = Math.ceil(max * 0.6) - 1;
    expect(summarize(spec, s, 0).stars).toBe(1);
    s.score = 0;
    expect(summarize(spec, s, 0).stars).toBe(1); // finishing is never worth nothing
  });

  it("the collected count and its total, and a duration that is never negative", () => {
    const s = fresh();
    s.collected = ["a-plaza:c0", "a-lab:c0"];
    s.startedAt = 5_000;
    delete (s as Partial<PlayState>).playedMs; // an older save: finish minus start
    const sum = summarize(spec, s, 4_000); // a clock that went back
    expect(sum.collected).toBe(2);
    expect(sum.collectiblesTotal).toBe(spec.areas.reduce((n, a) => n + a.collectibles.count, 0));
    expect(sum.durationMs).toBe(0);
  });
});

describe("what the browser gets of a run", () => {
  it("toClientState carries progress only: no records, attempts, served variants or timestamps", () => {
    const s = fresh();
    s.records["c-var1"] = rec();
    s.served = { "s-var1": "c-var1" };
    s.openedAt = { "s-var1": 5 };
    const client = toClientState(s);
    expect(Object.keys(client).sort()).toEqual(["achievements", "areaId", "bossesDefeated", "checkpoint", "collected", "finished", "hintsUsed", "missionsDone", "position", "resolvedStations", "score", "streak", "talked", "visited"]);
    expect(JSON.stringify(client)).not.toContain("c-var1");
  });

  it("an older save without bossesDefeated reads as an empty list", () => {
    const s = fresh() as Partial<PlayState>;
    delete s.bossesDefeated;
    expect(toClientState(s as PlayState).bossesDefeated).toEqual([]);
  });

  it("the whole thing as played through the reducer: a wrong answer then the right one", () => {
    const ch = spec.challenges.find((c) => c.id === "c-var1")!;
    let s = fresh();
    s = play(s, { type: "open", stationId: "s-var1" }, 1_000).state;
    s = play(s, { type: "answer", stationId: "s-var1", answer: wrongAnswer(ch, SEED) }, 2_000).state;
    s = play(s, { type: "answer", stationId: "s-var1", answer: correctAnswer(ch, SEED) }, 3_000).state;
    expect(s.score).toBe(60);
    expect(s.records["c-var1"]).toMatchObject({ attempts: 2, wrong: 1, points: 60, timeMs: 2_000 });
  });
});
