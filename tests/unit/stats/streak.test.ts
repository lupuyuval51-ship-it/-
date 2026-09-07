import { describe, expect, it } from "vitest";
import { STREAK_GAP_DAYS, STREAK_PLANNED_GRACE_DAYS, computeStreak } from "@/engine/streak";
import { dateKey, day, makePlanned, makeSession } from "../fixtures/statsFixtures";

const BROKEN_MESSAGE = { he: "חוזרים למסלול עם האימון הבא", en: "Back on track with the next workout" };

describe("computeStreak", () => {
  it("has no streak and a welcoming message without any session", () => {
    const s = computeStreak([], [], day(2026, 9, 6));
    expect(s.current).toBe(0);
    expect(s.best).toBe(0);
    expect(s.graceDaysLeft).toBe(0);
    expect(s.lastSessionDate).toBeUndefined();
    expect(s.message.he.length).toBeGreaterThan(0);
  });

  it("counts consecutive days and keeps the streak alive for 3 days after the last session", () => {
    const sessions = [makeSession({ on: day(2026, 9, 1) }), makeSession({ on: day(2026, 9, 2) }), makeSession({ on: day(2026, 9, 3) })];
    const s = computeStreak(sessions, [], day(2026, 9, 3, 18));
    expect(s.current).toBe(3);
    expect(s.best).toBe(3);
    expect(s.lastSessionDate).toBe(dateKey(2026, 9, 3));
    expect(s.graceDaysLeft).toBe(STREAK_GAP_DAYS);
    expect(s.message.he).toContain("3");

    const twoDaysLater = computeStreak(sessions, [], day(2026, 9, 5));
    expect(twoDaysLater.current).toBe(3);
    expect(twoDaysLater.graceDaysLeft).toBe(1);
  });

  it("a 3-day gap still links sessions; a 4-day gap starts a new run", () => {
    const linked = computeStreak([makeSession({ on: day(2026, 9, 1) }), makeSession({ on: day(2026, 9, 4) })], [], day(2026, 9, 4));
    expect(linked.current).toBe(2);
    expect(linked.best).toBe(2);

    const reset = computeStreak([makeSession({ on: day(2026, 9, 1) }), makeSession({ on: day(2026, 9, 5) })], [], day(2026, 9, 5));
    expect(reset.current).toBe(1);
    expect(reset.best).toBe(1);
  });

  it("two sessions on the same day count once", () => {
    const s = computeStreak([makeSession({ on: day(2026, 9, 1, 9) }), makeSession({ on: day(2026, 9, 1, 17) }), makeSession({ on: day(2026, 9, 2) })], [], day(2026, 9, 2));
    expect(s.current).toBe(2);
  });

  it("a postponed planned session completed within 7 days keeps the streak", () => {
    const planned = makePlanned({ id: "p1", date: dateKey(2026, 9, 3), status: "postponed" });
    const sessions = [
      makeSession({ on: day(2026, 9, 1) }),
      // 8 days after the previous session (beyond the 3-day gap) but 6 days after its planned date.
      makeSession({ on: day(2026, 9, 9), plannedSessionId: "p1" }),
    ];
    const s = computeStreak(sessions, [planned], day(2026, 9, 9));
    expect(s.current).toBe(2);
    expect(s.best).toBe(2);
  });

  it("a planned session completed more than 7 days late does not link", () => {
    const planned = makePlanned({ id: "p1", date: dateKey(2026, 9, 3), status: "postponed" });
    const sessions = [makeSession({ on: day(2026, 9, 1) }), makeSession({ on: day(2026, 9, 12), plannedSessionId: "p1" })];
    expect(STREAK_PLANNED_GRACE_DAYS).toBe(7);
    const s = computeStreak(sessions, [planned], day(2026, 9, 12));
    expect(s.current).toBe(1);
    expect(s.best).toBe(1);
  });

  it("a session completed before its planned date links regardless of the gap", () => {
    const planned = makePlanned({ id: "p1", date: dateKey(2026, 9, 15) });
    const sessions = [makeSession({ on: day(2026, 9, 1) }), makeSession({ on: day(2026, 9, 12), plannedSessionId: "p1" })];
    expect(computeStreak(sessions, [planned], day(2026, 9, 12)).current).toBe(2);
  });

  it("a broken streak reports 0 with the non-punitive message and remembers the best run", () => {
    const sessions = [makeSession({ on: day(2026, 8, 20) }), makeSession({ on: day(2026, 8, 21) }), makeSession({ on: day(2026, 8, 23) })];
    const s = computeStreak(sessions, [], day(2026, 9, 6));
    expect(s.current).toBe(0);
    expect(s.best).toBe(3);
    expect(s.graceDaysLeft).toBe(0);
    expect(s.lastSessionDate).toBe(dateKey(2026, 8, 23));
    expect(s.message).toEqual(BROKEN_MESSAGE);
  });

  it("an upcoming planned session extends the grace window", () => {
    const sessions = [makeSession({ on: day(2026, 9, 1) })];
    const planned = makePlanned({ id: "p-next", date: dateKey(2026, 9, 8) });
    // 5 days after the last session the plain window (3 days) is gone, but the planned session keeps it open.
    const s = computeStreak(sessions, [planned], day(2026, 9, 6));
    expect(s.current).toBe(1);
    expect(s.graceDaysLeft).toBe(2 + STREAK_PLANNED_GRACE_DAYS);
    // Cancelled or rest-day plans do not count.
    const cancelled = computeStreak(sessions, [makePlanned({ id: "p-x", date: dateKey(2026, 9, 8), status: "cancelled" })], day(2026, 9, 6));
    expect(cancelled.current).toBe(0);
  });

  it("ignores soft-deleted sessions", () => {
    const sessions = [makeSession({ on: day(2026, 9, 1) }), makeSession({ on: day(2026, 9, 2), deletedAt: "2026-09-02T20:00:00.000Z" })];
    expect(computeStreak(sessions, [], day(2026, 9, 2)).current).toBe(1);
  });
});
