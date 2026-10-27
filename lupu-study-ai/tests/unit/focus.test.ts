import { describe, expect, it } from "vitest";
import { advance, defaultFocus, elapsedInSegment, finish, formatClock, pause, remainingMs, skipBreak, start } from "@/services/learning/focus";

const MIN = 60_000;

describe("מצב ריכוז (פומודורו)", () => {
  it("ברירת מחדל 25/5, והטיימר סופר לפי השעון", () => {
    let s = defaultFocus();
    expect([s.focusMinutes, s.breakMinutes]).toEqual([25, 5]);
    s = start(s, 1000);
    expect(remainingMs(s, 1000 + 10 * MIN)).toBe(15 * MIN);
    expect(formatClock(remainingMs(s, 1000 + 10 * MIN))).toBe("15:00");
  });

  it("השהיה והמשך: זמן ההשהיה לא נספר", () => {
    let s = start(defaultFocus(), 0);
    s = pause(s, 5 * MIN);
    expect(elapsedInSegment(s, 100 * MIN)).toBe(5 * MIN);
    s = start(s, 100 * MIN);
    expect(remainingMs(s, 110 * MIN)).toBe(10 * MIN);
  });

  it("בסיום ריכוז עוברים להפסקה, וזמן הריכוז נצבר", () => {
    let s = start(defaultFocus(), 0);
    s = advance(s, 25 * MIN);
    expect(s.phase).toBe("break");
    expect(s.focusedMs).toBe(25 * MIN);
    expect(s.cycles).toBe(1);
    expect(remainingMs(s, 25 * MIN)).toBe(5 * MIN);
    s = advance(s, 30 * MIN); // סוף הפסקה: חוזרים לריכוז בלי לצבור זמן
    expect(s.phase).toBe("focus");
    expect(s.focusedMs).toBe(25 * MIN);
  });

  it("סיום מוקדם שומר רק את הריכוז שהושלם בפועל", () => {
    let s = start(defaultFocus(), 0);
    s = advance(s, 25 * MIN);
    s = skipBreak(s, 27 * MIN);
    const r = finish(s, 37 * MIN); // עוד 10 דקות ריכוז
    expect(r.minutes).toBe(35);
    expect(r.reset.status).toBe("idle");
    expect(r.reset.focusMinutes).toBe(25);
  });

  it("סיום באמצע הפסקה לא מוסיף זמן הפסקה לזמן הלימוד", () => {
    let s = start(defaultFocus(), 0);
    s = advance(s, 25 * MIN);
    expect(finish(s, 28 * MIN).minutes).toBe(25);
  });

  it("הגדרות מותאמות אישית", () => {
    const s = start({ ...defaultFocus(), focusMinutes: 45, breakMinutes: 10 }, 0);
    expect(remainingMs(s, 0)).toBe(45 * MIN);
  });
});
