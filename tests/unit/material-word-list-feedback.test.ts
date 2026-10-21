import { describe, expect, it } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { request } from "./helpers";

// A word list pairs words; "המונח ״cat״ מוגדר אחרת: חתול" (the term cat is defined differently) read as nonsense for it
const NOTES = `מילים באנגלית – יחידה 3
dog - כלב
cat - חתול
house - בית
school - בית ספר
teacher - מורה
apple - תפוח
water - מים
book - ספר`;

describe("feedback on a word list", () => {
  it("says what the list puts together, in both languages of the interface", () => {
    for (const contentLanguage of ["he", "en"] as const) {
      const { spec } = generateOffline(request({ material: NOTES, subject: "אנגלית", learningGoal: "מילים", mode: "FULL", contentLanguage }));
      const feedback = spec.challenges.flatMap((c) => (c.type === "choice" ? c.options.map((o) => o.feedback) : []));
      expect(feedback.length).toBeGreaterThan(8);
      for (const f of feedback) expect(f).not.toMatch(/מוגדר אחרת|מתאר את|described differently|That describes/u);
      expect(feedback.some((f) => contentLanguage === "he" ? f.startsWith("ברשימה שלכם, ליד") : f.startsWith("In your list,"))).toBe(true);
    }
  });
});
