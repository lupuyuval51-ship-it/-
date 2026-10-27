import { describe, expect, it } from "vitest";
import { buildExamPlan } from "@/services/learning/planner";

const TODAY = "2026-03-01"; // יום ראשון

describe("תוכנית הכנה למבחן", () => {
  it("אין תוכנית כשהמבחן היום או עבר או שאין נושאים", () => {
    expect(buildExamPlan({ date: TODAY, topics: ["א"], minutesPerDay: 30 }, { today: TODAY })).toEqual([]);
    expect(buildExamPlan({ date: "2026-02-20", topics: ["א"], minutesPerDay: 30 }, { today: TODAY })).toEqual([]);
    expect(buildExamPlan({ date: "2026-03-10", topics: [], minutesPerDay: 30 }, { today: TODAY })).toEqual([]);
  });

  it("כל נושא נלמד ומתורגל, וערב המבחן הוא חזרה כללית", () => {
    const plan = buildExamPlan({ date: "2026-03-12", topics: ["שברים", "אחוזים", "גיאומטריה"], minutesPerDay: 45 }, { today: TODAY });
    for (const t of ["שברים", "אחוזים", "גיאומטריה"]) {
      expect(plan.some((p) => p.topic === t && p.activity === "learn")).toBe(true);
      expect(plan.some((p) => p.topic === t && p.activity === "practice")).toBe(true);
    }
    const last = plan[plan.length - 1];
    expect(last.activity).toBe("review");
    expect(plan.some((p) => p.activity === "simulation")).toBe(true);
    expect(plan.every((p) => p.date < "2026-03-12" && p.date >= TODAY)).toBe(true);
  });

  it("שבת נשמרת כיום מנוחה כשיש מספיק ימים", () => {
    const plan = buildExamPlan({ date: "2026-03-20", topics: ["א", "ב"], minutesPerDay: 30 }, { today: TODAY });
    expect(plan.some((p) => p.date === "2026-03-07")).toBe(false); // שבת
  });

  it("נושא חלש מקבל תרגול נוסף", () => {
    const base = buildExamPlan({ date: "2026-03-15", topics: ["א", "ב"], minutesPerDay: 30 }, { today: TODAY });
    const weak = buildExamPlan({ date: "2026-03-15", topics: ["א", "ב"], minutesPerDay: 30 }, { today: TODAY, weakTopics: ["ב"] });
    const count = (p: typeof base) => p.filter((x) => x.topic === "ב" && x.activity === "practice").length;
    expect(count(weak)).toBe(count(base) + 1);
  });

  it("עובד גם כשנשארו יומיים בלבד", () => {
    const plan = buildExamPlan({ date: "2026-03-03", topics: ["א", "ב", "ג"], minutesPerDay: 30 }, { today: TODAY });
    expect(plan.length).toBeGreaterThan(0);
    expect(plan.every((p) => p.date < "2026-03-03")).toBe(true);
  });
});

import { planStudyBlocks, dayLoad } from "@/services/learning/planner";
import { makeData } from "./helpers";
import * as R from "@/services/data/reducers";
import { emptyData } from "@/services/data/defaults";

describe("מנוע תכנון מפגשי לימוד", () => {
  const base = () => R.completeOnboarding(emptyData(), { displayName: "ד", grade: 8, subjectKeys: ["math"], goals: ["exams"], dailyMinutes: 30 }).data;

  it("מציע הכנה למבחן קרוב ללא תוכנית, ומשבץ לפני המבחן ביום פנוי", () => {
    let d = base();
    d = R.addExam(d, { subjectId: d.subjects[0].id, title: "מבחן", date: "2026-03-08", topics: ["א"], materialIds: [], minutesPerDay: 30 }).data;
    const blocks = planStudyBlocks(d, "2026-03-02");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].date < "2026-03-08").toBe(true);
    expect(blocks[0].reason).toContain("בעוד 6 ימים");
  });

  it("לא מציע כשכבר יש תוכנית חזרה", () => {
    let d = base();
    d = R.addExam(d, { subjectId: d.subjects[0].id, title: "מבחן", date: "2026-03-12", topics: ["א", "ב"], materialIds: [], minutesPerDay: 30 }).data;
    d = R.generatePlanEvents(d, d.exams[0].id, "2026-03-02").data;
    expect(planStudyBlocks(d, "2026-03-02")).toHaveLength(0);
  });

  it("מעדיף ימים פחות עמוסים ומדלג על שבת", () => {
    let d = base();
    for (let i = 0; i < 3; i++) d = R.addHomework(d, { subjectId: null, title: `ש${i}`, description: "", dueDate: "2026-03-02", priority: "low" }).data;
    d = R.addExam(d, { subjectId: d.subjects[0].id, title: "מבחן", date: "2026-03-09", topics: ["א"], materialIds: [], minutesPerDay: 30 }).data;
    expect(dayLoad(d, "2026-03-02")).toBe(6);
    const b = planStudyBlocks(d, "2026-03-02")[0];
    expect(b.date).not.toBe("2026-03-02");
    expect(new Date(`${b.date}T12:00:00`).getDay()).not.toBe(6);
  });

  it("ללא נתונים אין הצעות", () => {
    expect(planStudyBlocks(makeData(), "2026-03-02")).toEqual([]);
  });
});
