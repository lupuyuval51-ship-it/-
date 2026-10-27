import { describe, expect, it } from "vitest";
import { answersMatch, gradeQuestion, normalizeText, parseNumber, scoreAttempt } from "@/services/learning/scoring";

describe("בדיקת תשובות", () => {
  it("שאלה אמריקאית נבדקת מול מפתח תשובות", () => {
    const q = { type: "mcq" as const, answerKey: "2" };
    expect(gradeQuestion(q, "2")).toEqual({ correct: true, points: 1 });
    expect(gradeQuestion(q, "1")).toEqual({ correct: false, points: 0 });
    expect(gradeQuestion(q, "")).toEqual({ correct: false, points: 0 });
  });

  it("נכון/לא נכון", () => {
    expect(gradeQuestion({ type: "tf", answerKey: "true" }, "true").correct).toBe(true);
    expect(gradeQuestion({ type: "tf", answerKey: "true" }, "false").correct).toBe(false);
  });

  it("השלמה: סלחנית לרווחים, פיסוק, ניקוד ותשובות חלופיות", () => {
    const q = { type: "fill" as const, answerKey: "פיתגורס|פיתאגורס" };
    expect(gradeQuestion(q, " פיתגורס! ").correct).toBe(true);
    expect(gradeQuestion(q, "פיתאגורס").correct).toBe(true);
    expect(gradeQuestion(q, "אוקלידס").correct).toBe(false);
  });

  it("השלמה מספרית: 0.5 = 1/2 = 0,5 ואחוזים נבדקים כמספר שלם", () => {
    const q = { type: "fill" as const, answerKey: "1/2" };
    for (const r of ["0.5", "0,5", "1/2", "0.50"]) expect(answersMatch(r, "0.5")).toBe(true);
    expect(answersMatch("50%", "50")).toBe(true);
    expect(gradeQuestion(q, "0.5").correct).toBe(true);
    expect(gradeQuestion(q, "0.6").correct).toBe(false);
  });

  it("שאלה פתוחה אינה נבדקת אוטומטית", () => {
    expect(gradeQuestion({ type: "open", answerKey: "x" }, "x")).toEqual({ correct: null, points: null });
  });

  it("parseNumber ו-normalizeText", () => {
    expect(parseNumber("1/0")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber("-3")).toBe(-3);
    expect(normalizeText("  Hello,   World! ")).toBe("hello world");
  });

  it("ציון באחוזים רק על שאלות שנבדקו; פתוחות ממתינות לא נספרות", () => {
    const score = scoreAttempt([{ points: 1 }, { points: 0 }, { points: 1 }, { points: null }]);
    expect(score).toEqual({ scorePercent: 67, gradedCount: 3, pendingCount: 1 });
    expect(scoreAttempt([{ points: null }])).toEqual({ scorePercent: null, gradedCount: 0, pendingCount: 1 });
  });

  it("הערכת AI חלקית נכנסת כציון חלקי", () => {
    expect(scoreAttempt([{ points: 0.5 }, { points: 1 }]).scorePercent).toBe(75);
  });
});
