import { describe, expect, it } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { request } from "./helpers";

// "תעשיית _____" (the ___ industry) was offered "העסיקו" (they employed), a verb no gap for a noun takes
const NOTES = `המהפכה התעשייתית
המהפכה התעשייתית החלה בבריטניה במאה ה-18.
מנוע הקיטור: מכונה שהופכת חום לתנועה בעזרת אדי מים.
העיור: מעבר של אנשים מהכפר אל העיר.
בתי החרושת העסיקו גם ילדים, לעיתים 12 שעות ביום.
מסילת הברזל הראשונה לנוסעים נפתחה בשנת 1830 בין ליברפול למנצ'סטר.
פועלים התאגדו באיגודים מקצועיים כדי לדרוש שכר הוגן ותנאי עבודה טובים יותר.
הכותנה הייתה חומר הגלם החשוב ביותר של תעשיית הטקסטיל.`;

const PAST_PLURAL = /^ה\p{L}{3,}ו$/u;

describe("Hebrew gaps for a noun", () => {
  it("are not offered a past-tense plural verb ('העסיקו', 'התאגדו') as a wrong option", () => {
    const { spec } = generateOffline(request({ material: NOTES, subject: "המהפכה התעשייתית", learningGoal: "מהפכה", mode: "FULL", contentLanguage: "he" }));
    const gaps = spec.challenges.filter((c) => c.type === "choice" && c.prompt.includes("_____"));
    expect(gaps.length).toBeGreaterThan(0);
    for (const c of gaps) {
      if (c.type !== "choice") continue;
      const right = c.options.find((o) => o.id === c.correctOptionId)!.text;
      if (PAST_PLURAL.test(right)) continue;
      for (const o of c.options) expect(PAST_PLURAL.test(o.text), `${c.prompt}: ${o.text}`).toBe(false);
    }
  });
});
