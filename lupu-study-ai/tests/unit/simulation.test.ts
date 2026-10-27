import { describe, expect, it } from "vitest";
import { createRun, gradeRun, recommendFromAttempt, selectQuestions } from "@/services/learning/simulation";
import type { ExamQuestion } from "@/types";

const mk = (id: string, patch: Partial<ExamQuestion>): ExamQuestion => ({
  id, examId: null, subjectId: "s", topic: "נושא", type: "mcq", prompt: "?", options: ["א", "ב", "ג"], answerKey: "1",
  rubric: "", explanation: "", difficulty: 2, source: "manual", createdAt: "", ...patch,
});

describe("סימולציית מבחן", () => {
  it("בוחר שאלות לפי סוג, קושי ונושא", () => {
    const pool = [mk("1", {}), mk("2", { type: "tf", options: [], answerKey: "true" }), mk("3", { difficulty: 3 }), mk("4", { topic: "אחר" })];
    const sel = selectQuestions(pool, { count: 10, difficulties: [2], types: ["mcq"], topics: ["נושא"], timerMinutes: 0 });
    expect(sel.map((q) => q.id).sort()).toEqual(["1"]);
  });

  it("בדיקת תשובות אמריקאיות לוקחת בחשבון ערבוב אפשרויות", () => {
    const q = mk("q1", { answerKey: "1" }); // התשובה הנכונה: "ב" (אינדקס 1 המקורי)
    const run = createRun({ examId: null, subjectId: "s", title: "t", questions: [q], timerMinutes: 0 });
    const shownIndexOfCorrect = run.optionOrder["q1"].indexOf(1);
    run.answers["q1"] = String(shownIndexOfCorrect);
    const res = gradeRun(run, [q]);
    expect(res.submissions[0].correct).toBe(true);
    expect(res.attempt.scorePercent).toBe(100);
  });

  it("תשובה שגויה, ריקה, ושאלה פתוחה ממתינה", () => {
    const open = mk("o", { type: "open", options: [], answerKey: "x" });
    const mcq = mk("m", {});
    const run = createRun({ examId: null, subjectId: "s", title: "t", questions: [mcq, open], timerMinutes: 5, now: 1000 });
    expect(run.deadline).toBe(1000 + 5 * 60_000);
    run.answers["o"] = "תשובה כלשהי";
    const res = gradeRun(run, [mcq, open]);
    expect(res.submissions.find((s) => s.questionId === "m")!.correct).toBe(false);
    expect(res.submissions.find((s) => s.questionId === "o")!.points).toBeNull();
    expect(res.attempt).toMatchObject({ scorePercent: 0, gradedCount: 1, pendingCount: 1 });
  });

  it("המלצות: נושאים מתחת ל-70%", () => {
    const qs = [mk("a", { topic: "חלש" }), mk("b", { topic: "חזק" })];
    const subs = [
      { id: "1", attemptId: "x", questionId: "a", response: "", correct: false, points: 0, assessment: null, selfAssessed: false },
      { id: "2", attemptId: "x", questionId: "b", response: "", correct: true, points: 1, assessment: null, selfAssessed: false },
    ];
    expect(recommendFromAttempt(qs, subs)).toEqual([{ topic: "חלש", percent: 0, correct: 0, total: 1 }]);
  });
});
