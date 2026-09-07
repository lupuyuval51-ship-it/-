import { describe, expect, it } from "vitest";
import type { CompletedSession } from "@/lib/types";
import { emptyCollections } from "@/store/appStore";
import { COACH_CONTEXT_MAX_SESSIONS, COACH_CONTEXT_NOTE_MAX, buildCoachContext, truncateNote, type CoachContextState } from "@/store/coachContext";
import { day, iso, makeProfile, makeSession, makeSettings, ratio } from "../fixtures/statsFixtures";

const NOW = day(2026, 9, 9);

function stateWith(sessions: CompletedSession[], sharing: Partial<CoachContextState["settings"]["aiDataSharing"]> = {}): CoachContextState {
  const collections = emptyCollections();
  for (const s of sessions) collections.completedSessions[s.id] = s;
  const r = ratio("backhand_accuracy", 16, 20, { sessionId: sessions[0]?.id ?? "none" });
  collections.exerciseResults[r.id] = r;
  collections.personalBests.longest_throw_m = { id: "longest_throw_m", key: "longest_throw_m", value: 44, metricType: "distance_m", sessionId: sessions[0]?.id ?? "none", achievedAt: iso(2026, 9, 1), updatedAt: iso(2026, 9, 1), deletedAt: null };
  return {
    profile: makeProfile({ name: "דנה כהן", secondaryRole: "cutter" }),
    settings: makeSettings({ aiDataSharing: { profile: true, results: true, history: true, notes: true, ...sharing } }),
    collections,
    activeSession: null,
  };
}

const longNote = "א".repeat(200);
const sessions = Array.from({ length: 7 }, (_, i) => makeSession({ id: `s${i}`, on: day(2026, 9, 1 + i), note: i === 6 ? longNote : `הערה ${i}`, backhandAccuracy: 70 + i, roleMetrics: { backhand_accuracy: 70 + i } }));

describe("buildCoachContext", () => {
  it("with everything shared: profile (with name), stats, PBs, recent sessions with notes", () => {
    const ctx = buildCoachContext(stateWith(sessions), { now: NOW });
    expect(ctx.locale).toBe("he");
    expect(ctx.profile?.name).toBe("דנה כהן");
    expect(ctx.profile?.primaryRole).toBe("handler");
    expect(ctx.profile?.secondaryRole).toBe("cutter");
    expect(ctx.profile?.goals).toEqual(["forehand", "accuracy"]);
    expect(ctx.roleHint).toBeUndefined();
    expect(ctx.stats?.sessionsCompleted).toBe(7);
    expect(ctx.stats?.backhandAccuracy).toBe(80);
    expect(ctx.stats?.longestThrowM).toBe(44);
    expect(ctx.stats?.level).toBeGreaterThanOrEqual(1);
    expect(ctx.personalBests).toEqual({ longest_throw_m: 44 });
    expect(ctx.weeklyLoad?.sessionsThisWeek).toBe(2); // 09-06 and 09-07 fall in the week of 09-09
    expect(ctx.recentSessions).toHaveLength(COACH_CONTEXT_MAX_SESSIONS);
    expect(ctx.recentSessions?.[0].date).toBe("2026-09-07"); // newest first
    expect(ctx.recentSessions?.[0].note?.length).toBe(COACH_CONTEXT_NOTE_MAX);
    expect(ctx.recentSessions?.[0].note?.endsWith("…")).toBe(true);
    expect(ctx.recentSessions?.[1].note).toBe("הערה 5");
    expect(ctx.recentSessions?.[0].keyMetrics).toEqual({ backhand_accuracy: 76 });
    expect(ctx.checkin).toBeUndefined();
  });

  it("profile off: no profile block or name, but the role/level hint stays", () => {
    const ctx = buildCoachContext(stateWith(sessions, { profile: false }), { now: NOW });
    expect(ctx.profile).toBeUndefined();
    expect(JSON.stringify(ctx)).not.toContain("דנה");
    expect(ctx.roleHint).toEqual({ primaryRole: "handler", secondaryRole: "cutter", level: "intermediate" });
    expect(ctx.stats).toBeDefined();
    expect(ctx.recentSessions).toBeDefined();
  });

  it("results off: no stats numbers, PBs, weekly load or per-session accuracies", () => {
    const ctx = buildCoachContext(stateWith(sessions, { results: false }), { now: NOW });
    expect(ctx.stats).toBeUndefined();
    expect(ctx.personalBests).toBeUndefined();
    expect(ctx.weeklyLoad).toBeUndefined();
    expect(ctx.profile).toBeDefined();
    expect(ctx.recentSessions?.length).toBe(5);
    expect(ctx.recentSessions?.every((s) => s.backhandAccuracy === undefined && s.accuracyPct === undefined && Object.keys(s.keyMetrics).length === 0)).toBe(true);
    expect(ctx.recentSessions?.[1].note).toBe("הערה 5");
  });

  it("history off: no recent sessions at all", () => {
    const ctx = buildCoachContext(stateWith(sessions, { history: false }), { now: NOW });
    expect(ctx.recentSessions).toBeUndefined();
    expect(ctx.stats?.sessionsCompleted).toBe(7);
    expect(JSON.stringify(ctx)).not.toContain("הערה");
  });

  it("notes off: sessions are listed without their notes", () => {
    const ctx = buildCoachContext(stateWith(sessions, { notes: false }), { now: NOW });
    expect(ctx.recentSessions).toHaveLength(5);
    expect(ctx.recentSessions?.every((s) => s.note === undefined)).toBe(true);
    expect(JSON.stringify(ctx)).not.toContain("הערה");
  });

  it("everything off: only locale, role hint and check-in survive", () => {
    const state = stateWith(sessions, { profile: false, results: false, history: false, notes: false });
    state.activeSession = {
      id: "active", workoutId: "w", workout: { ...sessions[0], phases: [] } as never, startedAt: iso(2026, 9, 9), phaseIndex: 0, exerciseIndex: 0, setIndex: 0, mode: "work",
      timer: { totalSeconds: 0, remainingSeconds: 0, running: false, lastTickAt: null }, elapsedSeconds: 0, results: [], replacements: [], skippedExerciseIds: [], completedExerciseIds: [],
      checkin: { feeling: 4, energy: 3, pain: "none", surface: "dry", wind: "light", participants: "solo", equipmentAvailable: true, recordedAt: iso(2026, 9, 9) }, updatedAt: iso(2026, 9, 9),
    };
    const ctx = buildCoachContext(state, { now: NOW });
    expect(Object.keys(ctx).sort()).toEqual(["checkin", "locale", "roleHint"]);
    expect(ctx.checkin).toEqual({ feeling: 4, energy: 3, pain: "none", surface: "dry", wind: "light" });
  });

  it("maxSessions is honoured but capped at 5, and soft-deleted sessions are skipped", () => {
    const deleted = { ...sessions[0], id: "gone", deletedAt: iso(2026, 9, 8) };
    const ctx = buildCoachContext(stateWith([...sessions, deleted]), { now: NOW, maxSessions: 2 });
    expect(ctx.recentSessions).toHaveLength(2);
    expect(ctx.stats?.sessionsCompleted).toBe(7);
    const big = buildCoachContext(stateWith(sessions), { now: NOW, maxSessions: 50 });
    expect(big.recentSessions).toHaveLength(5);
  });

  it("works without a profile and with empty collections", () => {
    const state: CoachContextState = { profile: null, settings: makeSettings({ locale: "en" }), collections: emptyCollections(), activeSession: null };
    const ctx = buildCoachContext(state, { now: NOW });
    expect(ctx.locale).toBe("en");
    expect(ctx.profile).toBeUndefined();
    expect(ctx.roleHint).toBeUndefined();
    expect(ctx.stats?.sessionsCompleted).toBe(0);
    expect(ctx.stats?.backhandAccuracy).toBeUndefined();
    expect(ctx.personalBests).toBeUndefined();
    expect(ctx.recentSessions).toEqual([]);
  });

  it("truncateNote collapses whitespace and cuts at the limit", () => {
    expect(truncateNote("  a   b \n c ")).toBe("a b c");
    expect(truncateNote("")).toBeUndefined();
    expect(truncateNote("x".repeat(300))?.length).toBe(COACH_CONTEXT_NOTE_MAX);
  });
});
