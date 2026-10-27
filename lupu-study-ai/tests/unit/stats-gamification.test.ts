import { describe, expect, it } from "vitest";
import { computeStreak } from "@/services/learning/stats";
import { awardXp, levelFromXp, xpForLevel } from "@/services/learning/gamification";

const days = (...d: string[]) => new Set(d.map((x) => `2026-03-${x}`));

describe("רצף ימי לימוד", () => {
  it("סופר ימים רצופים", () => {
    expect(computeStreak(days("08", "09", "10"), "2026-03-10").current).toBe(3);
  });
  it("היום הנוכחי שעדיין לא למדו בו לא שובר את הרצף", () => {
    expect(computeStreak(days("08", "09"), "2026-03-10")).toMatchObject({ current: 2, todayDone: false });
  });
  it("יום מנוחה יחיד לא שובר את הרצף", () => {
    expect(computeStreak(days("06", "07", "09", "10"), "2026-03-10").current).toBe(4);
  });
  it("שני ימים חסרים שוברים את הרצף", () => {
    expect(computeStreak(days("05", "06", "09", "10"), "2026-03-10").current).toBe(2);
  });
  it("יום מנוחה סלחני אחד בלבד בכל 7 ימים", () => {
    // ימים חסרים: 8 ו-6 → שני ימי מנוחה בטווח של פחות משבוע
    expect(computeStreak(days("04", "05", "07", "09", "10"), "2026-03-10").current).toBe(3);
  });
  it("בלי פעילות אין רצף", () => {
    expect(computeStreak(new Set(), "2026-03-10").current).toBe(0);
  });
});

describe("XP ורמות", () => {
  it("סף הרמות עולה", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBe(300);
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(350).level).toBe(3);
  });
  it("אי אפשר לקבל XP פעמיים על אותה פעולה", () => {
    const first = awardXp([], "hw:1", 15, "x");
    expect(first).not.toBeNull();
    expect(awardXp([first!], "hw:1", 15, "x")).toBeNull();
    expect(awardXp([first!], "hw:2", 15, "x")).not.toBeNull();
  });
  it("כמות אפסית לא מייצרת אירוע", () => {
    expect(awardXp([], "k", 0, "x")).toBeNull();
  });
});
