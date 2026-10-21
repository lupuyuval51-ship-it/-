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

  it("pronoun words with a preposition ('להם', 'ובהם', 'ממנו') are not keywords either", () => {
    const words = parseMaterial("דופן התא מעניקה להם חוזק.\nבכלורופלסטים, ובהם הכלורופיל, מתרחשת הפוטוסינתזה.\nקרום התא שולט במה שיוצא ממנו.").keywords.map((k) => k.text);
    for (const w of ["להם", "ובהם", "ממנו"]) expect(words).not.toContain(w);
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

describe("Hebrew: a word with another prefix is the same word", () => {
  it("'לתא' is never a wrong option next to 'התא', and 'בתאי' is no term", () => {
    const notes = `התא\nהתא הוא היחידה הקטנה ביותר של החיים.\nגרעין התא שומר על החומר התורשתי.\nהמיטוכונדריה היא תחנת הכוח של התא ומייצרת אנרגיה.\nדופן התא קיימת רק בתאי צמחים ומעניקה להם חוזק.\nהכלורופלסטים נמצאים בתאי צמחים ובהם מתרחשת הפוטוסינתזה.\nקרום התא שולט במה שנכנס לתא ויוצא ממנו.\nבגוף האדם יש בערך 37 טריליון תאים.`;
    const { spec } = generateOffline(request({ material: notes, subject: "התא", mode: "FULL", contentLanguage: "he" }));
    for (const c of spec.challenges) {
      if (c.type !== "choice") continue;
      const right = c.options.find((o) => o.id === c.correctOptionId)!.text;
      for (const o of c.options) {
        if (o.id === c.correctOptionId) continue;
        expect(o.text, `${c.id}`).not.toBe("בתאי");
        if (right.includes("גרעין התא")) expect(o.text, c.id).not.toContain("גרעין לתא");
      }
    }
  });
});
