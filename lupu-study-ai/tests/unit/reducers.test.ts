import { describe, expect, it } from "vitest";
import * as R from "@/services/data/reducers";
import { emptyData, normalizeData } from "@/services/data/defaults";
import { totalXp } from "@/services/learning/gamification";
import type { AppData } from "@/types";

const onboard = (): AppData =>
  R.completeOnboarding(emptyData(), { displayName: "דנה", grade: 8, subjectKeys: ["math", "english"], goals: ["exams"], dailyMinutes: 30 }).data;

describe("הקמה ומקצועות", () => {
  it("יוצר פרופיל פרטי ומקצועות עם נושאים מוצעים", () => {
    const d = onboard();
    expect(d.profile).toMatchObject({ displayName: "דנה", grade: 8, onboarded: true, isPrivate: true });
    expect(d.subjects.map((s) => s.key)).toEqual(["math", "english"]);
    expect(d.topics.length).toBeGreaterThan(5);
  });

  it("מחיקת מקצוע מסירה נושאים ומבחנים אך משאירה שיעורי בית ללא שיוך", () => {
    let d = onboard();
    const math = d.subjects[0].id;
    d = R.addHomework(d, { subjectId: math, title: "עמ' 5", description: "", dueDate: "2026-03-10", priority: "medium" }).data;
    d = R.addExam(d, { subjectId: math, title: "מבחן", date: "2026-03-20", topics: ["שברים"], materialIds: [], minutesPerDay: 30 }).data;
    d = R.removeSubject(d, math).data;
    expect(d.topics.some((t) => t.subjectId === math)).toBe(false);
    expect(d.exams).toHaveLength(0);
    expect(d.calendarEvents).toHaveLength(0);
    expect(d.homework[0].subjectId).toBeNull();
  });

  it("נושאים אישיים: הוספה, עריכה, מחיקה, בלי כפילויות", () => {
    let d = onboard();
    const s = d.subjects[0].id;
    const before = d.topics.length;
    d = R.addTopic(d, s, "נושא אישי").data;
    d = R.addTopic(d, s, "נושא אישי").data;
    expect(d.topics).toHaveLength(before + 1);
    const id = d.topics.find((t) => t.name === "נושא אישי")!.id;
    d = R.renameTopic(d, id, "שם חדש").data;
    expect(d.topics.find((t) => t.id === id)!.name).toBe("שם חדש");
    d = R.removeTopic(d, id).data;
    expect(d.topics).toHaveLength(before);
  });
});

describe("שיעורי בית ו-XP", () => {
  it("XP על שיעורי בית ניתן פעם אחת גם אם מסמנים ומבטלים שוב ושוב", () => {
    let d = onboard();
    d = R.addHomework(d, { subjectId: null, title: "תרגיל", description: "", dueDate: "2026-03-10", priority: "high" }).data;
    const id = d.homework[0].id;
    for (let i = 0; i < 5; i++) {
      d = R.setHomeworkDone(d, id, true).data;
      d = R.setHomeworkDone(d, id, false).data;
    }
    d = R.setHomeworkDone(d, id, true).data;
    expect(totalXp(d.xpEvents)).toBe(15);
  });
});

describe("כרטיסיות", () => {
  it("סקירה מעדכנת תזמון, ניסיונות ותוצאת תרגול; XP פעם ביום לכרטיס", () => {
    let d = onboard();
    d = R.addFlashcards(d, [{ subjectId: null, topic: "t", front: "ש", back: "ת", source: "manual" }], "2026-03-10").data;
    const id = d.flashcards[0].id;
    d = R.reviewFlashcard(d, id, true, "2026-03-10").data;
    d = R.reviewFlashcard(d, id, true, "2026-03-10").data;
    const c = d.flashcards[0];
    expect(c.attempts).toBe(2);
    expect(c.successes).toBe(2);
    expect(d.flashcardReviews).toHaveLength(2);
    expect(totalXp(d.xpEvents.filter((e) => e.dedupeKey.startsWith("card:")))).toBe(1);
  });

  it("כרטיס ריק לא נוצר", () => {
    const d = R.addFlashcards(onboard(), [{ subjectId: null, topic: "", front: " ", back: "x", source: "manual" }]).data;
    expect(d.flashcards).toHaveLength(0);
  });
});

describe("מפגשי לימוד", () => {
  it("מפגש קצר מדקה לא נשמר; מפגש תקין נשמר עם XP פעם אחת", () => {
    const d0 = onboard();
    expect(R.recordSession(d0, { subjectId: null, minutes: 0.4, plannedMinutes: 25, kind: "focus", completed: false }).session).toBeNull();
    const r = R.recordSession(d0, { subjectId: null, minutes: 25, plannedMinutes: 25, kind: "focus", completed: true });
    expect(r.data.studySessions).toHaveLength(1);
    expect(totalXp(r.data.xpEvents)).toBe(12);
    expect(r.rewards.some((x) => x.kind === "achievement")).toBe(true);
  });
});

describe("מניעת צבירת XP", () => {
  it("זמן לימוד ידני נרשם אבל לא מזכה ב-XP", () => {
    let d = onboard();
    for (let i = 0; i < 5; i++) d = R.recordSession(d, { subjectId: null, minutes: 120, plannedMinutes: 120, kind: "manual", completed: true }).data;
    expect(d.studySessions).toHaveLength(5);
    expect(totalXp(d.xpEvents)).toBe(0);
  });

  it("מפגשי ריכוז קצרים חוזרים לא מניבים XP (פחות מ-2 דקות)", () => {
    let d = onboard();
    for (let i = 0; i < 10; i++) d = R.recordSession(d, { subjectId: null, minutes: 1.5, plannedMinutes: 25, kind: "focus", completed: false }).data;
    expect(totalXp(d.xpEvents)).toBe(0);
  });

  it("תקרת XP יומית לכרטיסיות", () => {
    let d = onboard();
    d = R.addFlashcards(d, Array.from({ length: 50 }, (_, i) => ({ subjectId: null, topic: "t", front: `ש${i}`, back: "ת", source: "manual" as const })), "2026-03-10").data;
    for (const c of d.flashcards) d = R.reviewFlashcard(d, c.id, true, "2026-03-10").data;
    expect(totalXp(d.xpEvents.filter((e) => e.dedupeKey.startsWith("card:")))).toBe(30);
  });
});

describe("מבחנים", () => {
  it("סיום ניסיון שומר ציון, תוצאות לפי נושא ו-XP פעם אחת", () => {
    let d = onboard();
    const subjectId = d.subjects[0].id;
    d = R.addQuestions(d, [
      { examId: null, subjectId, topic: "שברים", type: "mcq", prompt: "?", options: ["a", "b"], answerKey: "1", rubric: "", explanation: "", difficulty: 2, source: "manual" },
      { examId: null, subjectId, topic: "שברים", type: "tf", prompt: "?", options: [], answerKey: "true", rubric: "", explanation: "", difficulty: 2, source: "manual" },
    ]).data;
    const [q1, q2] = d.examQuestions;
    const attempt = { id: "a1", examId: null, subjectId, title: "ניסיון", questionIds: [q1.id, q2.id], startedAt: new Date().toISOString(), finishedAt: null, timerSeconds: null, scorePercent: null, gradedCount: 0, pendingCount: 0 };
    const subs = [
      { id: "s1", attemptId: "a1", questionId: q1.id, response: "1", correct: true, points: 1, assessment: null, selfAssessed: false },
      { id: "s2", attemptId: "a1", questionId: q2.id, response: "false", correct: false, points: 0, assessment: null, selfAssessed: false },
    ];
    d = R.finishAttempt(d, { attempt, submissions: subs }).data;
    d = R.finishAttempt(d, { attempt, submissions: subs }).data; // הגשה חוזרת
    expect(d.examAttempts).toHaveLength(1);
    expect(d.examAttempts[0].scorePercent).toBe(50);
    expect(d.practiceResults.filter((p) => p.source === "exam").length).toBeGreaterThanOrEqual(1);
    expect(d.xpEvents.filter((e) => e.dedupeKey === "attempt:a1")).toHaveLength(1);
  });

  it("יצירת תוכנית חזרה יוצרת אירועי יומן ומחליפה תוכנית קודמת", () => {
    let d = onboard();
    const subjectId = d.subjects[0].id;
    d = R.addExam(d, { subjectId, title: "מבחן שברים", date: "2026-03-20", topics: ["א", "ב"], materialIds: [], minutesPerDay: 30 }).data;
    const examId = d.exams[0].id;
    d = R.generatePlanEvents(d, examId, "2026-03-10").data;
    const n = d.calendarEvents.filter((e) => e.kind === "review").length;
    expect(n).toBeGreaterThan(2);
    d = R.generatePlanEvents(d, examId, "2026-03-10").data;
    expect(d.calendarEvents.filter((e) => e.kind === "review")).toHaveLength(n);
    d = R.removeExam(d, examId).data;
    expect(d.calendarEvents).toHaveLength(0);
  });
});

describe("פרטיות ונתונים", () => {
  it("מחיקת היסטוריית AI מסירה שיחות והודעות", () => {
    let d = onboard();
    const now = new Date().toISOString();
    d = R.addConversation(d, { id: "c1", title: "t", subjectId: null, topic: "", mode: "explain", level: "standard", createdAt: now, updatedAt: now }).data;
    d = R.addMessage(d, { id: "m1", conversationId: "c1", role: "user", content: "hi", imageIds: [], citations: [], isError: false, createdAt: now }).data;
    d = R.clearAiHistory(d).data;
    expect(d.conversations).toHaveLength(0);
    expect(d.messages).toHaveLength(0);
  });

  it("normalizeData מתמודד עם נתון פגום או חלקי", () => {
    expect(normalizeData(null).subjects).toEqual([]);
    expect(normalizeData({ subjects: "bad", homework: [{ id: "1" }] }).homework).toHaveLength(1);
    expect(normalizeData({ subjects: "bad" }).subjects).toEqual([]);
    expect(normalizeData({}).meta.schemaVersion).toBe(1);
  });

  it("eraseAll מחזיר נתונים ריקים לגמרי", () => {
    expect(R.eraseAll().data.profile).toBeNull();
  });
});
