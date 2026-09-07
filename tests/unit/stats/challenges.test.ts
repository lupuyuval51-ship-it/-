import { describe, expect, it } from "vitest";
import { CHALLENGES, CHALLENGE_MAP, DAILY_CHALLENGES, WEEKLY_CHALLENGES } from "@/content/challenges";
import { activeChallenges, applySessionToChallenges, pickDailyChallenge, pickWeeklyChallenges, WEEKLY_CHALLENGE_COUNT } from "@/engine/challenges";
import { toDateKey, weekKey } from "@/lib/dates";
import { day, makeProfile, makeResult, makeSession, ratio } from "../fixtures/statsFixtures";

const FORBIDDEN = /unlock|premium|paywall|credit|פרימיום|לפתוח תוכן|נעול/i;

describe("CHALLENGES content", () => {
  it("defines every daily and weekly id from the spec", () => {
    const daily = ["d-8of10", "d-catch-20", "d-forehand-50", "d-90min", "d-cuts-10", "d-mirror", "d-5bh5fh", "d-role", "d-distance-pb", "d-three-throws"];
    const weekly = ["wk-sessions-3", "wk-accuracy-8of10", "wk-catch-streak-20", "wk-role-challenge", "wk-forehand-50", "wk-distance-pb", "wk-90min", "wk-cuts-10", "wk-mirror", "wk-5bh5fh"];
    expect(DAILY_CHALLENGES.map((c) => c.id)).toEqual(daily);
    expect(WEEKLY_CHALLENGES.map((c) => c.id)).toEqual(weekly);
    for (const c of CHALLENGES) {
      expect(c.title.he.length).toBeGreaterThan(0);
      expect(c.description.en.length).toBeGreaterThan(0);
      expect(c.encouragement.he.length).toBeGreaterThan(0);
      expect(c.badge.length).toBeGreaterThan(0);
      expect(c.xp).toBeGreaterThan(0);
      for (const text of [c.title, c.description, c.encouragement]) {
        expect(text.he).not.toMatch(FORBIDDEN);
        expect(text.en).not.toMatch(FORBIDDEN);
      }
    }
  });
});

describe("pickDailyChallenge", () => {
  const handler = makeProfile({ primaryRole: "handler" });

  it("is deterministic for the same day and role", () => {
    const a = pickDailyChallenge(CHALLENGES, handler, "2026-09-07");
    const b = pickDailyChallenge(CHALLENGES, handler, "2026-09-07");
    expect(a.id).toBe(b.id);
    expect(a.period).toBe("daily");
  });

  it("never repeats the previous day's pick and respects role targeting", () => {
    let prev = pickDailyChallenge(CHALLENGES, handler, "2026-08-31").id;
    for (let d = 1; d <= 20; d += 1) {
      const key = `2026-09-${String(d).padStart(2, "0")}`;
      const pick = pickDailyChallenge(CHALLENGES, handler, key);
      expect(pick.id).not.toBe(prev);
      expect(!pick.roles || pick.roles.includes("handler")).toBe(true);
      prev = pick.id;
    }
    // A defender never gets the handler-only 5+5 challenge, a handler never the mirror drill.
    const defender = makeProfile({ primaryRole: "defender" });
    for (let d = 1; d <= 30; d += 1) {
      const key = `2026-09-${String(d).padStart(2, "0")}`;
      expect(pickDailyChallenge(CHALLENGES, defender, key).id).not.toBe("d-5bh5fh");
      expect(pickDailyChallenge(CHALLENGES, handler, key).id).not.toBe("d-mirror");
    }
  });

  it("a seed changes the pick without breaking determinism", () => {
    const picks = new Set(["a", "b", "c", "d", "e"].map((seed) => pickDailyChallenge(CHALLENGES, handler, "2026-09-07", seed).id));
    expect(picks.size).toBeGreaterThan(1);
    expect(pickDailyChallenge(CHALLENGES, handler, "2026-09-07", "a").id).toBe(pickDailyChallenge(CHALLENGES, handler, "2026-09-07", "a").id);
  });
});

describe("activeChallenges", () => {
  const profile = makeProfile({ primaryRole: "cutter" });
  const now = day(2026, 9, 9);

  it("creates the missing records for today and this week with correct period keys", () => {
    const active = activeChallenges(CHALLENGES, [], profile, now);
    expect(active.daily.periodKey).toBe(toDateKey(now));
    expect(active.daily.period).toBe("daily");
    expect(active.daily.id).toBe(`${active.daily.definitionId}:${toDateKey(now)}`);
    expect(active.daily.def.id).toBe(active.daily.definitionId);
    expect(active.weekly).toHaveLength(WEEKLY_CHALLENGE_COUNT);
    expect(active.weekly.every((w) => w.periodKey === weekKey(now) && w.period === "weekly" && !w.completed && w.progress === 0)).toBe(true);
    expect(active.weekly.some((w) => w.definitionId === "wk-sessions-3")).toBe(true);
    expect(active.created).toHaveLength(1 + WEEKLY_CHALLENGE_COUNT);
    expect(pickWeeklyChallenges(CHALLENGES, profile, weekKey(now)).map((d) => d.id).sort()).toEqual(active.weekly.map((w) => w.definitionId).sort());
  });

  it("reuses existing records for the period and does not create duplicates", () => {
    const first = activeChallenges(CHALLENGES, [], profile, now);
    const stored = first.created.map((c) => ({ ...c, progress: 1 }));
    const second = activeChallenges(CHALLENGES, stored, profile, now);
    expect(second.created).toEqual([]);
    expect(second.daily.progress).toBe(1);
    expect(second.weekly.map((w) => w.id).sort()).toEqual(first.weekly.map((w) => w.id).sort());
    // A record from another day is not today's challenge.
    const yesterday = activeChallenges(CHALLENGES, [{ ...first.daily, id: "x:2026-09-08", periodKey: "2026-09-08" }], profile, now);
    expect(yesterday.daily.periodKey).toBe("2026-09-09");
  });
});

describe("applySessionToChallenges", () => {
  const profile = makeProfile({ primaryRole: "handler" });
  const now = day(2026, 9, 9);

  it("accumulates weekly session progress and completes the challenge at the target", () => {
    const active = activeChallenges(CHALLENGES, [], profile, now);
    const records = active.created;
    const weekly = records.find((r) => r.definitionId === "wk-sessions-3")!;
    expect(weekly.target).toBe(3);

    const s1 = makeSession({ id: "s1", on: day(2026, 9, 7) });
    const after1 = applySessionToChallenges(records, CHALLENGES, s1, []);
    const w1 = after1.updated.find((u) => u.id === weekly.id)!;
    expect(w1.progress).toBe(1);
    expect(w1.completed).toBe(false);
    expect(after1.completedNow).toEqual([]);

    const s2 = makeSession({ id: "s2", on: day(2026, 9, 8) });
    const s3 = makeSession({ id: "s3", on: day(2026, 9, 9) });
    const after2 = applySessionToChallenges([w1], CHALLENGES, s2, []);
    const after3 = applySessionToChallenges(after2.updated, CHALLENGES, s3, []);
    const done = after3.updated.find((u) => u.id === weekly.id)!;
    expect(done.progress).toBe(3);
    expect(done.completed).toBe(true);
    expect(done.completedAt).toBe(s3.completedAt);
    expect(after3.completedNow.map((c) => c.id)).toEqual([weekly.id]);

    // Already-completed records are left alone.
    const s4 = makeSession({ id: "s4", on: day(2026, 9, 10) });
    expect(applySessionToChallenges([done], CHALLENGES, s4, []).updated).toEqual([]);
  });

  it("ignores sessions outside the record's period", () => {
    const active = activeChallenges(CHALLENGES, [], profile, now);
    const lastWeek = makeSession({ id: "old", on: day(2026, 9, 2) });
    expect(applySessionToChallenges(active.created, CHALLENGES, lastWeek, []).updated).toEqual([]);
  });

  it("tracks metric, throws-by-skill, catch streak, exercise and personal-best challenges from results", () => {
    const periodKey = weekKey(now);
    const base = { period: "weekly" as const, periodKey, progress: 0, completed: false, updatedAt: now.toISOString(), deletedAt: null };
    const records = [
      { ...base, id: `wk-accuracy-8of10:${periodKey}`, definitionId: "wk-accuracy-8of10", target: 80 },
      { ...base, id: `wk-forehand-50:${periodKey}`, definitionId: "wk-forehand-50", target: 50 },
      { ...base, id: `wk-catch-streak-20:${periodKey}`, definitionId: "wk-catch-streak-20", target: 20 },
      { ...base, id: `wk-5bh5fh:${periodKey}`, definitionId: "wk-5bh5fh", target: 1 },
      { ...base, id: `wk-distance-pb:${periodKey}`, definitionId: "wk-distance-pb", target: 1 },
      { ...base, id: `wk-role-challenge:${periodKey}`, definitionId: "wk-role-challenge", target: 1 },
    ];
    const session = makeSession({ id: "s1", on: day(2026, 9, 8), newPersonalBestKeys: ["longest_throw_m"] });
    const results = [
      ratio("throw_accuracy", 8, 10, { sessionId: "s1" }),
      ratio("forehand_accuracy", 20, 30, { sessionId: "s1" }),
      makeResult({ key: "catch_streak", streak: 14, sessionId: "s1" }),
      makeResult({ key: "throw_accuracy", metricType: "ratio", successes: 10, attempts: 10, exerciseId: "ch-5-bh-5-fh", sessionId: "s1" }),
      makeResult({ key: "handler_challenge_score", score: 55, sessionId: "s1" }),
    ];
    const { updated, completedNow } = applySessionToChallenges(records, CHALLENGES, session, results);
    const byDef = Object.fromEntries(updated.map((u) => [u.definitionId, u]));
    expect(byDef["wk-accuracy-8of10"].completed).toBe(true); // 8 of 10 in one drill
    expect(byDef["wk-forehand-50"].progress).toBe(30);
    expect(byDef["wk-forehand-50"].completed).toBe(false);
    expect(byDef["wk-catch-streak-20"].progress).toBe(14);
    expect(byDef["wk-catch-streak-20"].completed).toBe(false);
    expect(byDef["wk-5bh5fh"].completed).toBe(true);
    expect(byDef["wk-distance-pb"].completed).toBe(true);
    expect(byDef["wk-role-challenge"].completed).toBe(true);
    expect(completedNow.map((c) => c.definitionId).sort()).toEqual(["wk-5bh5fh", "wk-accuracy-8of10", "wk-distance-pb", "wk-role-challenge"]);
    expect(CHALLENGE_MAP["wk-forehand-50"].metric).toEqual({ kind: "throws", skill: "forehand", target: 50 });
  });
});
