import { describe, expect, it } from "vitest";
import { dueCards, isHardCard, newCardSchedule, scheduleReview } from "@/services/learning/spaced";

const TODAY = "2026-03-10";

describe("חזרה מרווחת", () => {
  it("'ידעתי' מגדיל את המרווח: 1 → 3 → גדל לפי ease", () => {
    let c = newCardSchedule(TODAY);
    c = scheduleReview(c, true, TODAY);
    expect(c.intervalDays).toBe(1);
    expect(c.due).toBe("2026-03-11");
    c = scheduleReview(c, true, "2026-03-11");
    expect(c.intervalDays).toBe(3);
    c = scheduleReview(c, true, "2026-03-14");
    expect(c.intervalDays).toBeGreaterThan(3);
    expect(c.successes).toBe(3);
    expect(c.attempts).toBe(3);
  });

  it("'לא ידעתי' מחזיר את הכרטיס להיום, מוריד ease וסופר כשל", () => {
    let c = scheduleReview(newCardSchedule(TODAY), true, TODAY);
    const easeBefore = c.ease;
    c = scheduleReview(c, false, "2026-03-11");
    expect(c.due).toBe("2026-03-11");
    expect(c.intervalDays).toBe(0);
    expect(c.reps).toBe(0);
    expect(c.lapses).toBe(1);
    expect(c.ease).toBeLessThan(easeBefore);
  });

  it("ease לא יורד מתחת למינימום", () => {
    let c = newCardSchedule(TODAY);
    for (let i = 0; i < 20; i++) c = scheduleReview(c, false, TODAY);
    expect(c.ease).toBeGreaterThanOrEqual(1.3);
  });

  it("כרטיסים קשים מופיעים קודם בין כרטיסים שמועדם זהה", () => {
    const cards = [
      { id: "easy", due: TODAY, ease: 2.6 },
      { id: "hard", due: TODAY, ease: 1.4 },
      { id: "future", due: "2026-03-20", ease: 1.3 },
      { id: "late", due: "2026-03-01", ease: 2.5 },
    ];
    expect(dueCards(cards, TODAY).map((c) => c.id)).toEqual(["late", "hard", "easy"]);
  });

  it("מזהה כרטיס קשה", () => {
    expect(isHardCard({ attempts: 4, successes: 1, ease: 2.3 })).toBe(true);
    expect(isHardCard({ attempts: 4, successes: 4, ease: 2.3 })).toBe(false);
  });
});
