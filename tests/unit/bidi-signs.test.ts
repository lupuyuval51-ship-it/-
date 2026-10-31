import { describe, expect, it } from "vitest";
import { mathRuns } from "@/lib/i18n/bidi";

const maths = (t: string) => mathRuns(t).filter((p) => p.math).map((p) => p.text);

describe("maths in a Hebrew line: signs", () => {
  it("a minus in front of a number belongs to it (drawn '-30', not '30-')", () => {
    expect(maths("התשובה בין -30 ל-0.")).toEqual(["-30", "0"]);
    expect(maths("המספרים …, −2, −1, 0, 1, 2, …")).toEqual(["−2", "−1", "0", "1", "2"]);
  });
  it("a hyphen glued to a Hebrew prefix is not a minus ('ל-5' is 'to 5')", () => {
    expect(mathRuns("הטמפרטורה ירדה ל-5 מעלות").find((p) => p.math)?.text).toBe("5");
  });
  it("a spaced hyphen between numbers keeps the expression in one run", () => {
    expect(maths("חשבו 5 - 3 = x")).toEqual(["5 - 3 = x"]);
    expect(maths("בשנים 1939 - 1945 הייתה מלחמה")).toEqual(["1939 - 1945"]);
  });
  it("what worked before still works", () => {
    expect(maths("מחסרים 2 משני האגפים: 3x = 12")).toEqual(["2", "3x = 12"]);
    expect(maths("1/3 = x/9 בדיוק")).toEqual(["1/3 = x/9"]);
  });
});
