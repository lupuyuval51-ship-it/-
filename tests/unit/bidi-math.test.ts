import { describe, expect, it } from "vitest";
import { isArithmetic, mathRuns } from "@/lib/i18n/bidi";

const runs = (s: string) => mathRuns(s).filter((p) => p.math).map((p) => p.text);

describe("maths inside a Hebrew line is drawn left to right", () => {
  it("whole expressions become one run: equations, blanks, mixed numbers, percentages, parentheses", () => {
    expect(runs("1/3 = x/9. מהו x?")).toEqual(["1/3 = x/9"]);
    expect(runs("כמה זה 1 ÷ 1/5 = x?")).toEqual(["1 ÷ 1/5 = x"]);
    expect(runs("3 1/2 − 1 3/4 = 1 x/4. מהו x?")).toEqual(["3 1/2 − 1 3/4 = 1 x/4"]);
    expect(runs("ב־20 מצאו 25% הנחה")).toEqual(["20", "25%"]);
    expect(runs("שימו לב ש־(2 + 3) × 4 = 20")).toEqual(["(2 + 3) × 4 = 20"]);
    expect(runs("1 ÷ 3 = 0.333…: ה־3 חוזר")).toEqual(["1 ÷ 3 = 0.333…", "3"]);
  });

  it("lists, arrows and the words around them keep the order of the line", () => {
    expect(runs("בין 0.41 ל־0.49 נמצאים 0.42, 0.43 ו־0.44")).toEqual(["0.41", "0.49", "0.42", "0.43", "0.44"]);
    expect(runs("בכפל: 4.2 ← 42 ← 420")).toEqual(["4.2", "42", "420"]);
    expect(mathRuns("מהו x?")).toEqual([{ text: "מהו x?", math: false }]);
    // every character is kept, in order
    const line = "3/4 = 6/8 (כפול 2), ו־1,200 שקלים";
    expect(mathRuns(line).map((p) => p.text).join("")).toBe(line);
  });

  it("text without Hebrew is left alone, unless it is nothing but arithmetic (an answer option on its own)", () => {
    expect(mathRuns("1/3 = x/9. What is x?")).toEqual([{ text: "1/3 = x/9. What is x?", math: false }]);
    expect(mathRuns("2/3 = 4/6")).toEqual([{ text: "2/3 = 4/6", math: true }]);
    expect(mathRuns("4/8")).toEqual([{ text: "4/8", math: true }]);
    expect(mathRuns("print(x)")).toEqual([{ text: "print(x)", math: false }]);
    expect(isArithmetic("1 1/8 cups")).toBe(false);
    expect(isArithmetic("(2 + 3) × 4")).toBe(true);
    expect(isArithmetic("x")).toBe(false);
  });
});
