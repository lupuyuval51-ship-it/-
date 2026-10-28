import { describe, expect, it } from "vitest";
import { parseVerdicts, stripPartialTag } from "@/services/ai/verdicts";
import * as R from "@/services/data/reducers";
import { emptyData } from "@/services/data/defaults";
import { totalXp } from "@/services/learning/gamification";
import { computeMastery } from "@/services/learning/mastery";

describe("תוצאות תרגול ממורה AI", () => {
  it("מחלץ תגיות תקינות ומסיר אותן מהטקסט", () => {
    const r = parseVerdicts("כל הכבוד!\n[[RESULT:correct|topic=משוואות|difficulty=3]]\nהשאלה הבאה:\n[[RESULT:partial]]");
    expect(r.verdicts).toEqual([{ points: 1, topic: "משוואות", difficulty: 3 }, { points: 0.5, topic: "", difficulty: 2 }]);
    expect(r.text).not.toContain("RESULT");
  });
  it("תגיות פגומות מוסרות ולא נרשמות; עד 10 להודעה", () => {
    expect(parseVerdicts("x [[RESULT:bogus]] y").verdicts).toHaveLength(0);
    expect(parseVerdicts("x [[RESULT:bogus]] y").text).toBe("x  y");
    expect(parseVerdicts("[[RESULT:incorrect]]".repeat(15)).verdicts).toHaveLength(10);
  });
  it("תגית חלקית בזמן סטרימינג מוסתרת", () => {
    expect(stripPartialTag("שלום [[RESULT:corr")).toBe("שלום ");
    expect(stripPartialTag("א [[RESULT:correct]] ב")).toBe("א  ב");
  });
  it("נרשם כתוצאת תרגול (מקור tutor) ומשפיע על שליטה, בלי XP", () => {
    const d = R.recordTutorResults(emptyData(), { subjectId: null, fallbackTopic: "כללי", verdicts: [{ points: 1, topic: "שברים", difficulty: 2 }, { points: 0, topic: "", difficulty: 2 }] }).data;
    expect(d.practiceResults.map((p) => [p.topic, p.correct, p.source])).toEqual([["שברים", 1, "tutor"], ["כללי", 0, "tutor"]]);
    expect(computeMastery(d.practiceResults.filter((p) => p.topic === "שברים")).percent).toBe(100);
    expect(totalXp(d.xpEvents)).toBe(0);
  });
});
