import { describe, expect, it } from "vitest";
import { adviseDifficulty, computeMastery, masteryLevel } from "@/services/learning/mastery";
import type { PracticeResult } from "@/types";

const NOW = new Date("2026-03-10T12:00:00Z");
const r = (correct: number, total: number, daysAgo: number, difficulty: 1 | 2 | 3 = 2): PracticeResult => ({
  id: crypto.randomUUID(), subjectId: "s", topic: "t", correct, total, difficulty, source: "exam",
  at: new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString(),
});

describe("אחוז שליטה", () => {
  it("בלי נתונים לא מוצג מספר", () => {
    expect(computeMastery([], NOW)).toEqual({ percent: null, attempts: 0, confidence: 0 });
    expect(masteryLevel(computeMastery([], NOW))).toBe("unknown");
  });

  it("מחשב דיוק, ותוצאות ישנות שוקלות פחות", () => {
    expect(computeMastery([r(8, 10, 0)], NOW).percent).toBe(80);
    const m = computeMastery([r(0, 10, 60), r(10, 10, 0)], NOW);
    expect(m.percent).toBeGreaterThan(80);
  });

  it("רמות שליטה", () => {
    expect(masteryLevel({ percent: 40, attempts: 5, confidence: 0.5 })).toBe("weak");
    expect(masteryLevel({ percent: 70, attempts: 5, confidence: 0.5 })).toBe("developing");
    expect(masteryLevel({ percent: 90, attempts: 5, confidence: 0.5 })).toBe("strong");
  });
});

describe("התאמת קושי", () => {
  it("מוריד קושי כשמתקשים", () => {
    const a = adviseDifficulty([r(2, 10, 3, 3), r(3, 10, 2, 3), r(4, 10, 1, 3)]);
    expect(a.action).toBe("decrease");
    expect(a.difficulty).toBe(2);
    expect(a.reason).toContain("הסבר נוסף");
  });
  it("מעלה קושי בהצלחה עקבית", () => {
    const a = adviseDifficulty([r(9, 10, 3), r(10, 10, 2), r(9, 10, 1)]);
    expect(a.action).toBe("increase");
    expect(a.difficulty).toBe(3);
  });
  it("לא עולה מעבר לרמה 3 ולא יורד מתחת ל-1", () => {
    expect(adviseDifficulty([r(10, 10, 3, 3), r(10, 10, 2, 3), r(10, 10, 1, 3)]).difficulty).toBe(3);
    expect(adviseDifficulty([r(0, 10, 3, 1), r(0, 10, 2, 1), r(0, 10, 1, 1)]).difficulty).toBe(1);
  });
  it("בלי מספיק נתונים שומר על הרמה", () => {
    expect(adviseDifficulty([r(1, 10, 1)]).action).toBe("keep");
  });
});
