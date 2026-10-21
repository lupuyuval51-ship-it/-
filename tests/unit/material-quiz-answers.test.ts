import { describe, expect, it } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { request } from "./helpers";

// Review questions written "1. question? / תשובה: answer" kept the label in every option ("תשובה: דוד בן־גוריון"),
// and a "when?" question was offered a person and a place as its wrong options.
const NOTES = `שאלות לחזרה – מלחמת העצמאות
1. מתי הוכרזה הקמת מדינת ישראל?
תשובה: ב־14 במאי 1948.
2. מי הכריז על הקמת המדינה?
תשובה: דוד בן־גוריון.
3. איפה הוכרזה המדינה?
תשובה: בבית דיזנגוף בתל אביב.
4. מה הייתה החלטת האו״ם מ־29 בנובמבר 1947?
תשובה: תוכנית החלוקה.
5. איך נקרא הצבא של המדינה?
תשובה: צבא ההגנה לישראל.`;

describe("review questions with labelled answers", () => {
  const { spec } = generateOffline(request({ material: NOTES, subject: "מלחמת העצמאות", learningGoal: "חזרה", mode: "FULL", contentLanguage: "he" }));
  const asked = spec.challenges.filter((c) => c.type === "choice" && c.title.startsWith("ענו על השאלה"));

  it("ask each question with the answers alone, never with the 'תשובה:' label", () => {
    expect(asked.length).toBeGreaterThanOrEqual(4);
    for (const c of asked) if (c.type === "choice") for (const o of c.options) expect(o.text, c.prompt).not.toMatch(/^תשובה/u);
  });

  it("give a dated answer the same date in a nearby year as a wrong option", () => {
    const when = asked.find((c) => c.prompt.startsWith("מתי"));
    expect(when?.type).toBe("choice");
    if (when?.type !== "choice") return;
    const near = when.options.filter((o) => o.id !== when.correctOptionId && /^ב־14 במאי 19(4[5-9]|5[01])$/u.test(o.text));
    expect(near.length).toBeGreaterThan(0);
    for (const o of near) expect(o.feedback).toContain("שנה אחרת");
  });
});
