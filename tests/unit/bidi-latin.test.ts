import { describe, expect, it } from "vitest";
import { mathRuns, mirroredSign } from "@/lib/i18n/bidi";

// Measured in Chromium (each character's position on screen): before this change a Hebrew line drew "C1" as "1C",
// "IPv6" as "6IPv", "15:40" as "40:15", "115°" as "°115", "(2, −3)" as "(−3 ,2)" and "16 = 3x + 2y" mirrored.
const runs = (s: string) => mathRuns(s).filter((p) => p.math).map((p) => p.text);

describe("Latin letters with maths or code in a Hebrew line are one left-to-right run", () => {
  it("cell names, formulas, versions and units glued to a number stay whole", () => {
    expect(runs("בתא C1 יש =A1*B1.")).toEqual(["C1", "=A1*B1"]);
    expect(runs("מה יציג =SUM(A1:A3)?")).toEqual(["=SUM(A1:A3)"]);
    expect(runs("למה =SUM(A1:A3) עדיף על =4+6+10?")).toEqual(["=SUM(A1:A3)", "=4+6+10"]);
    expect(runs("בכתובת IPv6 יש 128 ביטים")).toEqual(["IPv6", "128"]);
    expect(runs("הדפסת 3D, דף A4 ורשת 5G")).toEqual(["3D", "A4", "5G"]);
    expect(runs("אורך 5cm בערך")).toEqual(["5cm"]);
  });

  it("algebra with any letter, functions and chemistry are one expression", () => {
    expect(runs("מה זה 16 = 3x + 2y?")).toEqual(["16 = 3x + 2y"]);
    expect(runs("פשטו: 4a + 3b − a + 2b")).toEqual(["4a + 3b − a + 2b"]);
    expect(runs("ואכן sin 2 ≈ 0.91 ו־log₂ 10 גדול מ־3")).toEqual(["sin 2 ≈ 0.91", "log₂ 10", "3"]);
    expect(runs("במשוואה 2H₂ + O₂ → 2H₂O יש 4 אטומים")).toEqual(["2H₂ + O₂ → 2H₂O", "4"]);
    expect(runs("הנקודה P(2, 6) והווקטור (x, y)")).toEqual(["P(2, 6)", "(x, y)"]);
    expect(runs("אומרים זאת עם ימים (on Monday, on 5 May).")).toEqual(["(on Monday, on 5 May)"]);
  });

  it("code: comparisons, floor division, products and strings", () => {
    expect(runs("12 > 10 הוא True")).toEqual(["12 > 10"]);
    expect(runs("1 == 1 הוא True")).toEqual(["1 == 1"]);
    expect(runs("הביטוי 7 // 2 נותן 3")).toEqual(["7 // 2", "3"]);
    expect(runs("היא מחזירה 7 * 2 = 14.")).toEqual(["7 * 2 = 14"]);
    expect(runs('מה ידפיס "3" + "4"?')).toEqual(['"3" + "4"']);
    expect(runs("ב־C++ יש מחלקות")).toEqual(["C++"]);
  });

  it("plain words, and words next to a number with a space, are left to the bidi algorithm", () => {
    expect(runs("מקשים כמו Shift, Enter ו־Backspace")).toEqual([]);
    expect(runs("כמו ב־JPEG וב־MP3")).toEqual(["MP3"]);
    expect(mathRuns("מהו x?")).toEqual([{ text: "מהו x?", math: false }]);
  });
});

describe("numbers in a Hebrew line: times, ratios, degrees, roots, π, powers, points", () => {
  it("are one run each", () => {
    expect(runs("השעה 15:40 היא 3:40 אחר הצהריים")).toEqual(["15:40", "3:40"]);
    expect(runs("היחס הוא 3:4.")).toEqual(["3:4"]);
    expect(runs("בערך 115°, קרוב ל־90° (בערך 57°)")).toEqual(["115°", "90°", "57°"]);
    expect(runs("ב־π/6 (30°) וב־5π/6 (150°)")).toEqual(["π/6", "(30°)", "5π/6", "(150°)"]);
    expect(runs("הגרף חוזר כל 2π ÷ 2 = π.")).toEqual(["2π ÷ 2 = π"]);
    expect(runs("שניהם שווים ל־−√2/2, ו־√(21 × 8 × 7 × 6) = 84")).toEqual(["−√2/2", "√(21 × 8 × 7 × 6) = 84"]);
    expect(runs("צריך 2ⁿ − 1 מהלכים, כלומר 7 × 10⁻⁴ ו־10⁻³ = 1/1,000")).toEqual(["2ⁿ − 1", "7 × 10⁻⁴", "10⁻³ = 1/1,000"]);
    expect(runs("השטח הוא ½ × 6 × 6 = 18")).toEqual(["½ × 6 × 6 = 18"]);
    expect(runs("התמונה היא (2 + 5, 6 − 3) = (7, 3)")).toEqual(["(2 + 5, 6 − 3) = (7, 3)"]);
    expect(runs("כמו (2, 3) ← (2, −3)")).toEqual(["(2, 3)", "(2, −3)"]);
    expect(runs("סטיית תקן σ = 10, ואז 2σ = 20")).toEqual(["σ = 10", "2σ = 20"]);
    expect(runs("הערך |−5| = 5")).toEqual(["|−5| = 5"]);
    expect(runs("1 + 2 + … + 9 = 45, ולכן")).toEqual(["1 + 2 + … + 9 = 45"]);
    expect(runs("פותרים 4ˣ − 5·2ˣ + 4 = 0")).toEqual(["4ˣ − 5·2ˣ + 4 = 0"]);
  });

  it("keep every character, in order", () => {
    for (const line of ["בתא C1 יש =A1*B1. מעתיקים אותו ל־C2.", "הנקודה P(2, 6) ← (2, −3), ו־σ = 10", "ב־π/6 (30°) וב־5π/6 (150°), ציר y", "השם 2xyz הוא שם"]) {
      expect(mathRuns(line).map((p) => p.text).join("")).toBe(line);
    }
  });
});

describe("a < or > in a Hebrew line", () => {
  it("is drawn left to right inside an expression, and mirrored only in prose", () => {
    expect(mirroredSign("הפירוש של x > 7 הוא גדול מ־7")).toBe(false);
    expect(mirroredSign("פתרו: −2x < 8")).toBe(false);
    expect(mirroredSign("כמה מספרים שלמים x מקיימים −3 ≤ x < 2?")).toBe(false);
    expect(mirroredSign("12 > 10 הוא True")).toBe(false);
    expect(mirroredSign("החץ > מצביע ימינה")).toBe(true);
    // a line without Hebrew is drawn left to right as a whole
    expect(mirroredSign("x > 6")).toBe(false);
  });
});
