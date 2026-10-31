import { describe, expect, it } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { request } from "./helpers";

/** What a learner hit on 2026-10-26 (daily user check), each pinned so it stays fixed. */
describe("the explanation of a steps question from the learner's notes", () => {
  it("tells the steps apart, so a screen that shows it as one paragraph still reads step by step", () => {
    const recipe = `איך אופים לחם:
1. מערבבים קמח, מים, שמרים ומלח
2. לשים את הבצק עשר דקות
3. משאירים את הבצק לתפוח שעה
4. מעצבים כיכר
5. משאירים לתפוח שוב חצי שעה
6. אופים ב-220 מעלות חצי שעה`;
    const { spec } = generateOffline(request({ material: recipe, subject: "לחם", learningGoal: "לאפות לחם", difficulty: "beginner", mode: "FULL", contentLanguage: "he" }));
    const seq = spec.challenges.filter((c) => c.type === "sequence");
    expect(seq.length).toBeGreaterThan(0);
    for (const c of seq) {
      expect(c.explanation).toMatch(/1\. .+ · 2\. /u);
      expect(c.explanation).not.toMatch(/ {2}/u);
    }
  });
});
