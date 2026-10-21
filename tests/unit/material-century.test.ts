import { describe, expect, it } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { request } from "./helpers";

// "המהפכה התעשייתית החלה במאה ה-18" was offered with "23" as a wrong option: a century that has not happened yet
const notes = (century: number) => `המהפכה התעשייתית
המהפכה התעשייתית החלה בבריטניה במאה ה-${century}.
מנוע הקיטור: מכונה שהופכת חום לתנועה בעזרת אדי מים.
העיור: מעבר של אנשים מהכפר אל העיר.
בתי החרושת העסיקו גם ילדים, לעיתים 12 שעות ביום.
הכותנה הייתה חומר הגלם החשוב ביותר של תעשיית הטקסטיל.`;

describe("a century in the notes", () => {
  it("gets wrong options from the 1st to the 21st century only", () => {
    for (const century of [17, 18, 19, 20, 21]) {
      const { spec } = generateOffline(request({ material: notes(century), subject: "המהפכה התעשייתית", learningGoal: "מהפכה", mode: "FULL", contentLanguage: "he" }));
      const questions = spec.challenges.filter((c) => c.type === "choice" && c.prompt.includes("במאה ה-___"));
      expect(questions.length).toBeGreaterThan(0);
      for (const c of questions) {
        if (c.type !== "choice") continue;
        for (const o of c.options) expect(Number(o.text), o.text).toBeLessThanOrEqual(21);
      }
    }
  });
});
