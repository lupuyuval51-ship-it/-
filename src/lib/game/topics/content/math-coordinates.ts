import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Grid", "a pattern of squares made by crossing lines, used to find places", "רשת", "דוגמה של ריבועים שנוצרת מקווים נחתכים, ומשמשת למציאת מקומות"],
      ["Coordinates", "a pair of numbers that gives the position of a point, like (3, 2)", "שיעורים", "זוג מספרים שנותן את המיקום של נקודה, כמו (3, 2)"],
      ["Origin", "the point (0, 0) where the two axes meet", "ראשית הצירים", "הנקודה (0, 0) שבה שני הצירים נפגשים"],
      ["x-axis", "the horizontal number line on a grid", "ציר x", "ציר המספרים האופקי ברשת"],
    ],
    q: [
      [["In the point (4, 1), which number tells you how far to go across?", "4", ["1", "5", "0"], "The first number is x (across), the second is y (up): along the corridor, then up the stairs."],
        ["בנקודה (4, 1), איזה מספר אומר כמה ללכת הצידה?", "4", ["1", "5", "0"], "המספר הראשון הוא x (הצידה) והשני y (למעלה): קודם לאורך המסדרון, אחר כך במדרגות."]],
      [["Which point is on the y-axis?", "(0, 5)", ["(5, 0)", "(5, 5)", "(1, 1)"], "Points on the y-axis have x = 0."],
        ["איזו נקודה נמצאת על ציר y?", "(0, 5)", ["(5, 0)", "(5, 5)", "(1, 1)"], "לנקודות על ציר y יש x = 0."]],
    ],
  },
  i: {
    t: [
      ["Quadrant", "one of the four regions the axes divide the plane into", "רביע", "אחד מארבעת האזורים שהצירים מחלקים אליהם את המישור"],
      ["y-axis", "the vertical number line on a grid", "ציר y", "ציר המספרים האנכי ברשת"],
      ["Midpoint", "the point exactly halfway between two points", "אמצע קטע", "הנקודה שנמצאת בדיוק באמצע הדרך בין שתי נקודות"],
      ["Reflection in an axis", "flipping a point over an axis, like (2, 3) → (2, −3) over the x-axis", "שיקוף בציר", "היפוך של נקודה מעבר לציר, כמו (2, 3) ← (2, −3) כשהופכים מעבר לציר x"],
    ],
    q: [
      [["In which quadrant is the point (−3, 4)?", "Second", ["First", "Third", "Fourth"], "x is negative and y is positive: top-left, the second quadrant."],
        ["באיזה רביע נמצאת הנקודה (−3, 4)?", "השני", ["הראשון", "השלישי", "הרביעי"], "x שלילי ו־y חיובי: למעלה משמאל, הרביע השני."]],
      [["What is the midpoint of (2, 4) and (8, 10)?", "(5, 7)", ["(6, 6)", "(10, 14)", "(3, 3)"], "Average each coordinate: ((2 + 8)/2, (4 + 10)/2) = (5, 7)."],
        ["מהי נקודת האמצע של (2, 4) ו־(8, 10)?", "(5, 7)", ["(6, 6)", "(10, 14)", "(3, 3)"], "ממצעים כל שיעור: ((2 + 8)/2, (4 + 10)/2) = (5, 7)."]],
    ],
  },
  a: {
    t: [
      ["Slope", "how steep a line is: the change in y divided by the change in x", "שיפוע", "עד כמה קו תלול: השינוי ב־y חלקי השינוי ב־x"],
      ["y-intercept", "the point where a line crosses the y-axis", "נקודת החיתוך עם ציר y", "הנקודה שבה קו חותך את ציר y"],
      ["Parallel lines", "lines with the same slope that never meet", "ישרים מקבילים", "ישרים עם אותו שיפוע שלעולם אינם נפגשים"],
      ["Perpendicular lines", "lines that meet at a right angle; their slopes multiply to −1", "ישרים מאונכים", "ישרים שנפגשים בזווית ישרה; מכפלת השיפועים שלהם היא −1"],
    ],
    q: [
      [["What is the slope of the line through (1, 2) and (3, 8)?", "3", ["6", "2", "1/3"], "Slope = (8 − 2) ÷ (3 − 1) = 6 ÷ 2 = 3."],
        ["מהו השיפוע של הישר שעובר דרך (1, 2) ו־(3, 8)?", "3", ["6", "2", "1/3"], "שיפוע = (8 − 2) ÷ (3 − 1) = 6 ÷ 2 = 3."]],
      [["Which line is parallel to y = 2x + 1?", "y = 2x − 5", ["y = −2x + 1", "y = x + 2", "y = 1/2 x"], "Parallel lines have the same slope: 2."],
        ["איזה ישר מקביל ל־y = 2x + 1?", "y = 2x − 5", ["y = −2x + 1", "y = x + 2", "y = 1/2 x"], "לישרים מקבילים אותו שיפוע: 2."]],
      [["A line has slope 2. What is the slope of a line perpendicular to it?", "−1/2", ["2", "−2", "1/2"], "Perpendicular slopes multiply to −1: 2 × (−1/2) = −1."],
        ["לישר שיפוע 2. מהו השיפוע של ישר המאונך לו?", "−1/2", ["2", "−2", "1/2"], "מכפלת השיפועים של ישרים מאונכים היא −1: 2 × (−1/2) = −1."]],
    ],
  },
};
export default c;
