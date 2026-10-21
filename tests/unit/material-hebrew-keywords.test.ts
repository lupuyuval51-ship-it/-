import { describe, expect, it } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { parseMaterial } from "@/lib/game/material/parse";
import { request } from "./helpers";

const NOTES = `מלחמת העצמאות
מלחמת העצמאות החלה בשנת 1947 והסתיימה בשנת 1949.
ב-14 במאי 1948 הכריז דוד בן-גוריון על הקמת מדינת ישראל.
הסכמי שביתת הנשק נחתמו בשנת 1949.
מדינת ישראל התקבלה לאו"ם בשנת 1949.
הכנסת הראשונה נבחרה בשנת 1949 והיו בה 120 חברים.
פלמ"ח: הכוח המגויס של ההגנה.
צה"ל: צבא ההגנה לישראל, הוקם ב-26 במאי 1948.
דרך בורמה: דרך עוקפת לירושלים הנצורה.`;

describe("Hebrew notes: words that carry no idea are never asked about", () => {
  it("'בשנת' (in the year) and words with a digit in them ('ב-14') are not keywords", () => {
    const words = parseMaterial(NOTES).keywords.map((k) => k.text);
    expect(words).not.toContain("בשנת");
    expect(words.some((w) => /\d/.test(w))).toBe(false);
    expect(words).toContain("העצמאות");
  });

  it("no gap, option or swapped word of the game is one of them", () => {
    const { spec } = generateOffline(request({ material: NOTES, subject: "מלחמת העצמאות", mode: "FULL", contentLanguage: "he" }));
    for (const c of spec.challenges) {
      if (c.type !== "choice") continue;
      // a one-word option (a gap's answer or its wrong options) is never a time word or a number-word
      for (const o of c.options) if (!o.text.includes(" ")) expect(o.text === "בשנת" || /\d/.test(o.text) && /\p{Script=Hebrew}/u.test(o.text), `${c.id}: ${o.text}`).toBe(false);
      for (const o of c.options) expect(o.text.includes("הקמת בשנת"), `${c.id}: ${o.text}`).toBe(false);
    }
  });
});
