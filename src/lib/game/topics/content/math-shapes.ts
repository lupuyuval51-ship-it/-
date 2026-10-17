import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Triangle", "a flat shape with three straight sides", "משולש", "צורה שטוחה עם שלוש צלעות ישרות"],
      ["Square", "a shape with four equal sides and four right angles", "ריבוע", "צורה עם ארבע צלעות שוות וארבע זוויות ישרות"],
      ["Circle", "a round shape whose edge is the same distance from the centre all the way round", "עיגול", "צורה עגולה שהשפה שלה נמצאת באותו מרחק מהמרכז לכל אורכה"],
      ["Pentagon", "a flat shape with five straight sides", "מחומש", "צורה שטוחה עם חמש צלעות ישרות"],
    ],
    q: [
      [["How many sides does a hexagon have?", "6", ["5", "7", "8"], "Hexa- means six; a honeycomb cell is a hexagon."],
        ["כמה צלעות יש למשושה?", "6", ["5", "7", "8"], "משושה — שש צלעות; תא בחלת דבש הוא משושה."]],
      [["Which shape has no corners?", "A circle", ["A square", "A triangle", "A rectangle"], "A circle has one curved edge and no corners at all."],
        ["לאיזו צורה אין פינות?", "לעיגול", ["לריבוע", "למשולש", "למלבן"], "לעיגול יש שפה מעוגלת אחת ואין לו פינות בכלל."]],
    ],
  },
  i: {
    t: [
      ["Equilateral triangle", "a triangle with three equal sides and three 60° angles", "משולש שווה צלעות", "משולש עם שלוש צלעות שוות ושלוש זוויות של 60°"],
      ["Isosceles triangle", "a triangle with two equal sides and two equal angles", "משולש שווה שוקיים", "משולש עם שתי צלעות שוות ושתי זוויות שוות"],
      ["Rhombus", "a four-sided shape with four equal sides, like a tilted square", "מעוין", "מרובע עם ארבע צלעות שוות, כמו ריבוע מוטה"],
      ["Regular polygon", "a shape whose sides are all equal and whose angles are all equal", "מצולע משוכלל", "צורה שכל הצלעות שלה שוות וכל הזוויות שלה שוות"],
    ],
    q: [
      [["Is every square a rectangle?", "Yes — it has four right angles", ["No, never", "Only if it is big", "Only if it is tilted"], "A rectangle needs four right angles; a square has them, plus equal sides."],
        ["האם כל ריבוע הוא מלבן?", "כן — יש לו ארבע זוויות ישרות", ["לא, אף פעם", "רק אם הוא גדול", "רק אם הוא מוטה"], "מלבן צריך ארבע זוויות ישרות; לריבוע יש אותן, ובנוסף צלעות שוות."]],
      [["A triangle has sides 5, 5 and 8. What type is it?", "Isosceles", ["Equilateral", "Right-angled for sure", "Scalene"], "Two sides are equal (5 and 5), so it is isosceles."],
        ["למשולש צלעות 5, 5 ו־8. איזה משולש זה?", "שווה שוקיים", ["שווה צלעות", "בוודאות ישר־זווית", "שונה צלעות"], "שתי צלעות שוות (5 ו־5), ולכן הוא שווה שוקיים."]],
    ],
  },
  a: {
    t: [
      ["Congruent", "exactly the same shape and size", "חופפים", "בדיוק באותה צורה ובאותו גודל"],
      ["Similar", "the same shape but possibly a different size, with all lengths in the same ratio", "דומים", "באותה צורה אבל אולי בגודל שונה, וכל האורכים באותו יחס"],
      ["Trapezium", "a four-sided shape with exactly one pair of parallel sides", "טרפז", "מרובע עם זוג אחד בדיוק של צלעות מקבילות"],
      ["Kite", "a four-sided shape with two pairs of equal sides next to each other", "דלתון", "מרובע עם שני זוגות של צלעות שוות סמוכות"],
    ],
    q: [
      [["Two similar triangles have sides 3, 4, 5 and 6, 8, x. What is x?", "10", ["7", "9", "12"], "All lengths are doubled (3 → 6, 4 → 8), so 5 → 10."],
        ["שני משולשים דומים: לאחד צלעות 3, 4, 5 ולשני 6, 8, x. מהו x?", "10", ["7", "9", "12"], "כל האורכים מוכפלים (3 → 6, 4 → 8), ולכן 5 → 10."]],
      [["Which statement is always true about a parallelogram?", "Its opposite sides are equal and parallel", ["All its angles are 90°", "Its diagonals are always equal", "All its sides are equal"], "That defines a parallelogram; right angles or equal sides only in special cases (rectangle, rhombus)."],
        ["איזו טענה תמיד נכונה במקבילית?", "הצלעות הנגדיות שוות ומקבילות", ["כל הזוויות 90°", "האלכסונים תמיד שווים", "כל הצלעות שוות"], "זו תכונה של כל מקבילית; זוויות ישרות או צלעות שוות קיימות רק במקרים מיוחדים (מלבן, מעוין)."]],
    ],
  },
};
export default c;
