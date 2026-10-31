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
      [["Which shape has four equal sides and four right angles?", "A square", ["A rectangle that is longer than it is wide", "A rhombus whose corners are not right angles", "A triangle"], "A square has both: all four sides equal and all four angles right angles. A long rectangle has right angles but unequal sides, and a rhombus that is not a square has equal sides but slanted corners."],
        ["לאיזו צורה יש ארבע צלעות שוות וארבע זוויות ישרות?", "לריבוע", ["למלבן שאורכו גדול מרוחבו", "למעוין שהפינות שלו אינן ישרות", "למשולש"], "לריבוע יש את שני התנאים: ארבע צלעות שוות וארבע זוויות ישרות. למלבן מוארך יש זוויות ישרות אבל צלעות לא שוות, ולמעוין שאינו ריבוע יש צלעות שוות אבל פינות משופעות."]],
      [["A flat shape with straight sides has 5 corners. How many sides does it have?", "5", ["6", "4", "10"], "In a flat shape with straight sides, every corner is where two sides meet, so the number of corners is the same as the number of sides: 5."],
        ["לצורה שטוחה עם צלעות ישרות יש 5 פינות. כמה צלעות יש לה?", "5", ["6", "4", "10"], "בצורה שטוחה עם צלעות ישרות כל פינה היא המקום שבו שתי צלעות נפגשות, ולכן מספר הפינות שווה למספר הצלעות: 5."]],
      [["What shape is a stop sign?", "An octagon", ["A hexagon", "A pentagon", "A circle"], "A stop sign has eight straight sides, so it is an octagon: octa- means eight, as in the eight arms of an octopus."],
        ["איזו צורה יש לתמרור ״עצור״?", "מתומן", ["משושה", "מחומש", "עיגול"], "לתמרור ״עצור״ יש שמונה צלעות ישרות, ולכן הוא מתומן: מצולע עם 8 צלעות, ולא 6 כמו במשושה וגם לא 5 כמו במחומש."]],
    ],
    n: [
      [12, ["A triangle has 3 sides, a square has 4 and a pentagon has 5. How many sides do the three shapes have all together?", "", "Add the sides of the three shapes: 3 + 4 + 5 = 12 sides all together."],
        ["למשולש יש 3 צלעות, לריבוע 4 ולמחומש 5. כמה צלעות יש לשלוש הצורות יחד?", "", "מחברים את הצלעות של שלוש הצורות: 3 + 4 + 5 = 12 צלעות בסך הכול."]],
    ],
    s: [
      [["From the shape with the fewest sides to the shape with the most", "A triangle", "A square", "A pentagon", "A hexagon", "An octagon"],
        ["מהצורה עם הכי מעט צלעות לצורה עם הכי הרבה", "משולש", "ריבוע", "מחומש", "משושה", "מתומן"]],
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
      [["Is every square a rectangle?", "Yes: it has four right angles, which a rectangle needs", ["No: a rectangle must have two long sides and two short ones", "No: a shape is either a square or a rectangle, never both", "Only when it is drawn with its sides straight up and down"], "A rectangle needs four right angles; a square has them, plus equal sides. A square is a special rectangle, so it belongs to both families."],
        ["האם כל ריבוע הוא מלבן?", "כן: יש לו ארבע זוויות ישרות, וזה מה שמלבן צריך", ["לא: במלבן חייבות להיות שתי צלעות ארוכות ושתי צלעות קצרות", "לא: צורה היא או ריבוע או מלבן, אף פעם לא שניהם", "רק כשהוא מצויר עם צלעות אנכיות ואופקיות"], "מלבן צריך ארבע זוויות ישרות; לריבוע יש אותן, ובנוסף צלעות שוות. ריבוע הוא מלבן מיוחד, ולכן הוא שייך לשתי המשפחות."]],
      [["A triangle has sides 5, 5 and 8. What type is it?", "Isosceles", ["Equilateral", "Right-angled for sure", "Scalene"], "Two sides are equal (5 and 5), so it is isosceles."],
        ["למשולש צלעות 5, 5 ו־8. איזה משולש זה?", "שווה שוקיים", ["שווה צלעות", "בוודאות ישר־זווית", "שונה צלעות"], "שתי צלעות שוות (5 ו־5), ולכן הוא שווה שוקיים."]],
      [["A four-sided shape has four equal sides, but its angles are not right angles. What is it?", "A rhombus", ["A square", "A kite", "A rectangle"], "Four equal sides with corners that are not right angles make a rhombus. A square and a rectangle have right angles, and a kite usually has two different side lengths."],
        ["למרובע יש ארבע צלעות שוות, אבל הזוויות שלו אינן ישרות. מהו?", "מעוין", ["ריבוע", "דלתון", "מלבן"], "ארבע צלעות שוות עם פינות שאינן ישרות הן מעוין. לריבוע ולמלבן יש זוויות ישרות, ולדלתון בדרך כלל יש שני אורכים שונים של צלעות."]],
      [["What do the three angles inside any triangle add up to?", "180°", ["360°", "90°", "270°"], "Whatever its shape or size, the three angles of a triangle always add up to 180°, which is half a full turn."],
        ["לכמה מסתכמות שלוש הזוויות שבתוך כל משולש?", "180°", ["360°", "90°", "270°"], "לא משנה מה הצורה או הגודל של המשולש, שלוש הזוויות שלו מסתכמות תמיד ב־180°, חצי סיבוב שלם."]],
      [["Which of these shapes is a regular polygon?", "A square with sides of 4 cm", ["A rectangle with sides of 6 cm and 3 cm", "A rhombus with angles of 60° and 120°", "A triangle with sides of 3, 4 and 5 cm"], "A regular polygon needs all its sides equal and all its angles equal. The square has both. The rectangle has equal angles but unequal sides, the rhombus has equal sides but unequal angles, and the 3, 4, 5 triangle has neither."],
        ["איזו מהצורות האלה היא מצולע משוכלל?", "ריבוע שצלעותיו 4 ס״מ", ["מלבן שצלעותיו 6 ס״מ ו־3 ס״מ", "מעוין שזוויותיו 60° ו־120°", "משולש שצלעותיו 3, 4 ו־5 ס״מ"], "במצולע משוכלל כל הצלעות שוות וכל הזוויות שוות. לריבוע יש את שניהם. במלבן הזוויות שוות אבל הצלעות לא, במעוין הצלעות שוות אבל הזוויות לא, ובמשולש 3, 4, 5 אין אף אחד מהם."]],
    ],
    n: [
      [70, ["Two angles of a triangle are 50° and 60°. How big is the third angle?", "°", "The three angles of a triangle add up to 180°, so the third angle is 180° − 50° − 60° = 70°."],
        ["שתי זוויות של משולש הן 50° ו־60°. מה גודלה של הזווית השלישית?", "°", "שלוש הזוויות של משולש מסתכמות ב־180°, ולכן הזווית השלישית היא 180° − 50° − 60° = 70°."]],
      [24, ["All the sides of a regular hexagon are 4 cm long. What is the total length of all its sides?", "cm", "A hexagon has 6 sides, and all of them are 4 cm long here: 6 × 4 = 24 cm."],
        ["כל הצלעות של משושה משוכלל באורך 4 ס״מ. מה האורך הכולל של כל צלעותיו?", "ס״מ", "למשושה יש 6 צלעות, וכולן כאן באורך 4 ס״מ: 6 × 4 = 24 ס״מ."]],
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
      [["Which statement is always true about a parallelogram?", "Opposite sides are equal and parallel", ["All its angles are 90°, as in a rectangle", "Its diagonals are always equal in length", "All its sides are equal, as in a rhombus"], "That defines a parallelogram; right angles or equal sides only in special cases (rectangle, rhombus)."],
        ["איזו טענה תמיד נכונה במקבילית?", "הצלעות הנגדיות שוות ומקבילות", ["כל הזוויות שלה 90°, כמו במלבן", "האלכסונים שלה תמיד שווים באורכם", "כל הצלעות שלה שוות, כמו במעוין"], "זו תכונה של כל מקבילית; זוויות ישרות או צלעות שוות קיימות רק במקרים מיוחדים (מלבן, מעוין)."]],
      [["What do the four angles inside any quadrilateral add up to?", "360°", ["180°", "270°", "720°"], "A diagonal cuts a quadrilateral into two triangles, and the angles of each triangle add up to 180°: 2 × 180° = 360°."],
        ["לכמה מסתכמות ארבע הזוויות שבתוך כל מרובע?", "360°", ["180°", "270°", "720°"], "אלכסון מחלק מרובע לשני משולשים, וסכום הזוויות בכל משולש הוא 180°: 2 × 180° = 360°."]],
      [["Two shapes have exactly the same form, but one is twice as long and twice as wide as the other. How are they related?", "They are similar, but not congruent", ["They are congruent", "They are neither similar nor congruent", "They are congruent but not similar"], "Congruent shapes have the same shape and the same size. Here the shape is the same but the size is not, so the shapes are similar and not congruent."],
        ["לשתי צורות יש בדיוק אותה צורה, אבל אחת מהן ארוכה פי 2 ורחבה פי 2 מהשנייה. מה היחס ביניהן?", "הן דומות אבל לא חופפות", ["הן חופפות", "הן לא דומות וגם לא חופפות", "הן חופפות אבל לא דומות"], "צורות חופפות הן באותה צורה ובאותו גודל. כאן הצורה זהה אבל הגודל שונה, ולכן הצורות דומות ולא חופפות."]],
      [["Which statement is true about every rhombus?", "Its diagonals cross at right angles", ["Its diagonals are always equal in length", "All its angles are right angles", "It has only one pair of parallel sides"], "In a rhombus the diagonals cross at right angles and cut each other in half. Equal diagonals belong to a rectangle, and a rhombus that is not a square has no right angles at all."],
        ["איזו טענה נכונה לגבי כל מעוין?", "האלכסונים שלו נחתכים בזווית ישרה", ["האלכסונים שלו תמיד שווים באורכם", "כל הזוויות שלו ישרות", "יש לו רק זוג אחד של צלעות מקבילות"], "במעוין האלכסונים נחתכים בזווית ישרה וחוצים זה את זה. אלכסונים שווים באורכם יש במלבן, ולמעוין שאינו ריבוע אין זוויות ישרות בכלל."]],
      [["A square with sides of 2 cm is enlarged to a similar square with sides of 6 cm. How many times bigger is its area?", "9 times", ["3 times", "6 times", "12 times"], "Every length is multiplied by 6 ÷ 2 = 3, and an area is length times width, so it is multiplied by 3 × 3 = 9: from 4 cm² to 36 cm²."],
        ["ריבוע שצלעו 2 ס״מ מוגדל לריבוע דומה שצלעו 6 ס״מ. פי כמה גדל השטח שלו?", "פי 9", ["פי 3", "פי 6", "פי 12"], "כל אורך מוכפל ב־6 ÷ 2 = 3, ושטח הוא אורך כפול רוחב, ולכן הוא מוכפל ב־3 × 3 = 9: מ־4 סמ״ר ל־36 סמ״ר."]],
    ],
    n: [
      [80, ["Three angles of a quadrilateral are 90°, 80° and 110°. How big is the fourth angle?", "°", "The four angles add up to 360°. The three known angles make 90 + 80 + 110 = 280°, so the fourth angle is 360° − 280° = 80°."],
        ["שלוש מזוויות המרובע הן 90°, 80° ו־110°. מה גודלה של הזווית הרביעית?", "°", "ארבע הזוויות מסתכמות ב־360°. שלוש הזוויות הידועות הן 90 + 80 + 110 = 280°, ולכן הזווית הרביעית היא 360° − 280° = 80°."]],
    ],
    s: [
      [["From the most general shape to the most special one", "A quadrilateral", "A parallelogram", "A rectangle", "A square"],
        ["מהצורה הכללית ביותר לצורה המיוחדת ביותר", "מרובע", "מקבילית", "מלבן", "ריבוע"]],
    ],
  },
};
export default c;
