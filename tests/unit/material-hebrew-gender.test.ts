import { describe, expect, it } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { request } from "./helpers";

// "היחידה" is feminine: "״היחידה״ לא מתאים כאן. הוא לקוח…" read as a grammar mistake in every game from Hebrew notes
const NOTES = `מחזור המים
אידוי: המים הופכים לאדים כשהשמש מחממת אותם.
עיבוי: האדים מתקררים ויוצרים עננים.
משקעים: המים יורדים מהעננים כגשם, שלג או ברד.
הנהרות מחזירים את המים אל הים.
האדמה סופגת חלק מהמים, והצמחים שותים אותם דרך השורשים.
השמש היא מקור האנרגיה של כל המחזור.
בשנת 1931 הצפה גדולה של נהר היאנגצה פגעה במיליוני אנשים.`;

describe("Hebrew feedback on a wrong option", () => {
  it("names the word with a noun whose gender the verbs agree with, never a bare word with masculine verbs", () => {
    const { spec } = generateOffline(request({ material: NOTES, subject: "מחזור המים", learningGoal: "מחזור המים", mode: "FULL", contentLanguage: "he" }));
    const feedback = spec.challenges.flatMap((c) => (c.type === "choice" ? c.options.map((o) => o.feedback) : []));
    const told = feedback.filter((f) => /לא מתאימה? כאן|מופיעה? בפתקים|מוגדר אחרת/u.test(f));
    expect(told.length).toBeGreaterThan(0);
    for (const f of told) {
      expect(f, f).toMatch(/^(?:המילה|הביטוי|המספר|המונח) ״/u);
      if (f.startsWith("המילה")) expect(f, f).not.toMatch(/לא מתאים כאן|הוא לקוח|״ מופיע /u);
    }
  });
});
