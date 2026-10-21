import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Line of symmetry", "a line that splits a shape into two halves, each the mirror image of the other", "ציר סימטרייה", "קו שמחלק צורה לשני חצאים, שכל אחד מהם הוא תמונת ראי של השני"],
      ["Symmetrical shape", "a shape with at least one line of symmetry, like a heart", "צורה סימטרית", "צורה שיש לה לפחות ציר סימטרייה אחד, כמו לב"],
      ["Asymmetrical shape", "a shape that no line can split into two mirror-image halves", "צורה לא סימטרית", "צורה שאף קו לא מחלק אותה לשני חצאים שהם תמונת ראי זה של זה"],
    ],
    q: [
      [["How many lines of symmetry does a square have?", "4", ["2", "8", "1"], "A square has 4 lines of symmetry: one up and down, one from side to side, and one along each of its two diagonals. Folding along any of them makes the halves match."],
        ["כמה צירי סימטרייה יש לריבוע?", "4", ["2", "8", "1"], "לריבוע יש 4 צירי סימטרייה: אחד מלמעלה למטה, אחד מצד לצד, ועוד אחד לאורך כל אחד משני האלכסונים. קיפול לאורך כל אחד מהם מביא את החצאים להתלכד."]],
      [["How many lines of symmetry does a rectangle that is not a square have?", "2", ["4", "1", "0"], "One line goes across the middle and one goes down the middle. The diagonals are not lines of symmetry: if you fold a long rectangle along a diagonal, the corners do not meet."],
        ["כמה צירי סימטרייה יש למלבן שאינו ריבוע?", "2", ["4", "1", "0"], "ציר אחד עובר לרוחב דרך האמצע וציר אחד לאורך דרך האמצע. האלכסונים אינם צירי סימטרייה: אם מקפלים מלבן מוארך לאורך האלכסון, הפינות לא נפגשות."]],
      [["How can you check whether a line is a line of symmetry?", "Fold the shape along the line and see if the two halves match", ["Check that the line passes through one of the corners of the shape", "Measure whether it is the longest line you can draw inside the shape", "Count how many sides the shape has"], "If the halves lie exactly on top of each other after folding, the line is a line of symmetry. A line through a corner, or a long line, can still give halves that do not match."],
        ["איך אפשר לבדוק אם קו הוא ציר סימטרייה?", "לקפל את הצורה לאורך הקו ולבדוק אם החצאים מתלכדים", ["לבדוק שהקו עובר דרך אחת הפינות של הצורה", "למדוד אם זה הקו הארוך ביותר שאפשר לשרטט בתוך הצורה", "לספור כמה צלעות יש לצורה"], "אם אחרי הקיפול החצאים מונחים בדיוק זה על זה, הקו הוא ציר סימטרייה. קו שעובר דרך פינה, או קו ארוך, עדיין יכול לתת חצאים שלא מתלכדים."]],
      [["Which shape has exactly one line of symmetry?", "A triangle with exactly two equal sides", ["A rectangle that is longer than it is wide, like a notebook page", "A triangle with all three sides equal", "A circle"], "A triangle with two equal sides has one line of symmetry, from the corner between the equal sides to the middle of the opposite side. A long rectangle has 2, a triangle with three equal sides has 3, and a circle has infinitely many."],
        ["לאיזו צורה יש בדיוק ציר סימטרייה אחד?", "משולש שבדיוק שתיים מצלעותיו שוות", ["מלבן שאורכו גדול מרוחבו, כמו דף מחברת", "משולש ששלוש הצלעות שלו שוות", "עיגול"], "למשולש עם שתי צלעות שוות יש ציר סימטרייה אחד, מהקודקוד שבין הצלעות השוות אל אמצע הצלע שמולו. למלבן מוארך יש 2 צירים, למשולש ששלוש צלעותיו שוות יש 3, ולעיגול יש אינסוף."]],
      [["Which of these shapes has no line of symmetry at all?", "A triangle whose three sides all have different lengths", ["A triangle with two of its three sides exactly the same length", "A kite, with two pairs of equal sides next to each other", "A circle"], "If all three sides are different, no fold can make one half fit onto the other. A triangle with two equal sides and a kite each have one line of symmetry, and a circle has infinitely many."],
        ["לאיזו מהצורות האלה אין אף ציר סימטרייה?", "משולש ששלוש הצלעות שלו באורכים שונים", ["משולש ששתיים משלוש הצלעות שלו באותו אורך בדיוק", "דלתון, שיש לו שני זוגות של צלעות שכנות שוות", "עיגול"], "אם שלוש הצלעות שונות, שום קיפול לא יביא חצי אחד להתלכד עם השני. למשולש עם שתי צלעות שוות ולדלתון יש ציר סימטרייה אחד, ולעיגול יש אינסוף צירים."]],
    ],
    n: [
      [8, ["A butterfly's body is its line of symmetry. Its left wing has 4 spots. How many spots are on both wings together?", "", "The right wing is the mirror image of the left one, so it also has 4 spots: 4 + 4 = 8."],
        ["הגוף של פרפר הוא ציר הסימטרייה שלו. על הכנף השמאלית שלו יש 4 נקודות. כמה נקודות יש על שתי הכנפיים יחד?", "", "הכנף הימנית היא תמונת הראי של השמאלית, ולכן גם עליה יש 4 נקודות: 4 + 4 = 8."]],
    ],
    s: [
      [["Drawing the reflection of a shape in a mirror line", "Choose one corner of the shape", "Measure how far that corner is from the mirror line, at a right angle to it", "Mark a point the same distance away on the other side of the line", "Repeat this for every corner of the shape", "Join the new points in the same order as the original corners"],
        ["ציור השיקוף של צורה בקו ראי", "בוחרים פינה אחת של הצורה", "מודדים את המרחק של הפינה מקו הראי, בניצב לקו", "מסמנים נקודה באותו מרחק בצד השני של הקו", "חוזרים על כך עם כל פינה של הצורה", "מחברים את הנקודות החדשות באותו סדר של הפינות המקוריות"]],
    ],
  },
  i: {
    t: [
      ["Regular polygon", "a flat shape whose sides all have the same length and whose angles are all equal", "מצולע משוכלל", "צורה שטוחה שכל הצלעות שלה באותו אורך וכל הזוויות שלה שוות"],
      ["Rotational symmetry", "the property of a shape that looks exactly the same after a turn of less than a full turn about its centre", "סימטרייה סיבובית", "תכונה של צורה שנראית בדיוק אותו דבר אחרי שמסובבים אותה פחות מסיבוב שלם סביב המרכז שלה"],
      ["Order of rotational symmetry", "the number of times a shape fits onto itself during one full turn", "סדר הסימטרייה הסיבובית", "מספר הפעמים שצורה מתלכדת עם עצמה במהלך סיבוב שלם אחד"],
    ],
    q: [
      [["How many lines of symmetry does a regular hexagon have?", "6", ["3", "12", "4"], "A regular polygon with n sides has n lines of symmetry. In a hexagon, 3 lines pass through opposite corners and 3 pass through the middles of opposite sides: 6 in all."],
        ["כמה צירי סימטרייה יש למשושה משוכלל?", "6", ["3", "12", "4"], "למצולע משוכלל עם n צלעות יש n צירי סימטרייה. במשושה 3 צירים עוברים דרך קודקודים נגדיים ו־3 דרך אמצעי צלעות נגדיות: 6 בסך הכול."]],
      [["What is the order of rotational symmetry of a square?", "4", ["2", "8", "1"], "Turning a square about its centre by 90°, 180°, 270° and 360° makes it fit onto itself, so it fits 4 times in one full turn."],
        ["מהו סדר הסימטרייה הסיבובית של ריבוע?", "4", ["2", "8", "1"], "סיבוב של ריבוע סביב מרכזו ב־90°, ב־180°, ב־270° וב־360° מביא אותו להתלכד עם עצמו, ולכן הוא מתלכד 4 פעמים בסיבוב שלם אחד."]],
      [["Which statement about a triangle with three equal sides is true?", "It has 3 lines of symmetry and rotational symmetry of order 3", ["It has 3 lines of symmetry but no rotational symmetry at all", "It has 1 line of symmetry and rotational symmetry of order 3", "It has 6 lines of symmetry, one for each side and each corner"], "Each of its 3 lines of symmetry runs from a corner to the middle of the opposite side, and a turn of 120° makes it fit onto itself, 3 times in a full turn."],
        ["איזו טענה נכונה לגבי משולש ששלוש צלעותיו שוות?", "יש לו 3 צירי סימטרייה וסימטרייה סיבובית מסדר 3", ["יש לו 3 צירי סימטרייה, אבל אין לו בכלל סימטרייה סיבובית", "יש לו ציר סימטרייה אחד וסימטרייה סיבובית מסדר 3", "יש לו 6 צירי סימטרייה, אחד לכל צלע ואחד לכל קודקוד"], "כל אחד מ־3 צירי הסימטרייה שלו עובר מקודקוד אל אמצע הצלע שמולו, וסיבוב ב־120° מביא אותו להתלכד עם עצמו, 3 פעמים בסיבוב שלם."]],
      [["Which of these capital letters has both a horizontal and a vertical line of symmetry?", "H", ["E", "A", "F"], "H can be folded down the middle and across the middle. A has only a vertical line, E has only a horizontal line, and F has none."],
        ["לאיזו מהאותיות הגדולות האלה באנגלית יש גם ציר סימטרייה אופקי וגם ציר אנכי?", "H", ["E", "A", "F"], "את האות H אפשר לקפל גם לאורך האמצע וגם לרוחב האמצע. ל־A יש רק ציר אנכי, ל־E יש רק ציר אופקי, ול־F אין אף ציר."]],
      [["Which shape has rotational symmetry of order 2 but no line of symmetry?", "A parallelogram that is neither a rectangle nor a rhombus", ["A rectangle that is longer than it is wide, like a door", "A kite, which has two pairs of equal sides next to each other", "A triangle with two equal sides"], "Half a turn makes such a parallelogram fit onto itself, but no fold matches its halves. A long rectangle has order 2 as well, but it also has 2 lines of symmetry; a kite and a triangle with two equal sides have one line and no rotational symmetry."],
        ["לאיזו צורה יש סימטרייה סיבובית מסדר 2 אבל אין אף ציר סימטרייה?", "מקבילית שאינה מלבן ואינה מעוין", ["מלבן שאורכו גדול מרוחבו, כמו דלת", "דלתון, שיש לו שני זוגות של צלעות שכנות שוות", "משולש עם שתי צלעות שוות"], "חצי סיבוב מביא מקבילית כזו להתלכד עם עצמה, אבל שום קיפול לא מתאים בין החצאים שלה. גם למלבן מוארך יש סדר 2, אבל יש לו גם 2 צירי סימטרייה; לדלתון ולמשולש עם שתי צלעות שוות יש ציר אחד ואין סימטרייה סיבובית."]],
    ],
    n: [
      [12, ["A pattern has 5 dots on one side of its line of symmetry and 2 more dots lying right on the line. How many dots does the whole pattern have?", "", "The other side mirrors the first, so it also has 5 dots. The 2 dots on the line are counted only once: 5 + 5 + 2 = 12."],
        ["בדוגמה יש 5 נקודות בצד אחד של ציר הסימטרייה ועוד 2 נקודות על הציר עצמו. כמה נקודות יש בדוגמה כולה?", "", "הצד השני הוא תמונת ראי של הראשון, ולכן גם בו יש 5 נקודות. את 2 הנקודות שעל הציר סופרים רק פעם אחת: 5 + 5 + 2 = 12."]],
      [8, ["How many lines of symmetry does a regular octagon (8 sides) have?", "", "A regular polygon has as many lines of symmetry as it has sides, so a regular octagon has 8: four through opposite corners and four through the middles of opposite sides."],
        ["כמה צירי סימטרייה יש למתומן משוכלל (מצולע עם 8 צלעות)?", "", "למצולע משוכלל יש צירי סימטרייה כמספר הצלעות שלו, ולכן למתומן משוכלל יש 8: ארבעה דרך קודקודים נגדיים וארבעה דרך אמצעי צלעות נגדיות."]],
    ],
    s: [
      [["From the fewest lines of symmetry to the most", "A triangle with three different sides", "A triangle with exactly two equal sides", "A rectangle that is not a square", "A triangle with three equal sides", "A square", "A regular hexagon"],
        ["מהצורה עם הכי מעט צירי סימטרייה לצורה עם הכי הרבה", "משולש ששלוש צלעותיו שונות", "משולש שבדיוק שתיים מצלעותיו שוות", "מלבן שאינו ריבוע", "משולש ששלוש צלעותיו שוות", "ריבוע", "משושה משוכלל"]],
    ],
  },
  a: {
    t: [
      ["Point symmetry", "the property of a shape that looks the same after half a turn (180°) about its centre", "סימטרייה נקודתית", "תכונה של צורה שנראית אותו דבר אחרי חצי סיבוב (180°) סביב המרכז שלה"],
      ["Plane of symmetry", "a flat slice that cuts a solid into two halves that are mirror images of each other", "מישור סימטרייה", "חתך שטוח שמחלק גוף לשני חצאים שכל אחד מהם הוא תמונת ראי של השני"],
      ["Angle of rotational symmetry", "the smallest turn that makes a shape fit onto itself: 360° divided by the order", "זווית הסימטרייה הסיבובית", "הסיבוב הקטן ביותר שמביא צורה להתלכד עם עצמה: 360° חלקי הסדר"],
    ],
    q: [
      [["A pinwheel has 4 identical bent blades and no line of symmetry. What is its order of rotational symmetry?", "4", ["1, because it has no line of symmetry", "2", "8"], "Each quarter turn moves one blade onto the next, so it fits onto itself 4 times in a full turn. A shape can have rotational symmetry without having any line of symmetry."],
        ["לשבשבת יש 4 כנפיים זהות ומעוקלות, ואין לה אף ציר סימטרייה. מהו סדר הסימטרייה הסיבובית שלה?", "4", ["1, כי אין לה ציר סימטרייה", "2", "8"], "כל רבע סיבוב מעביר כנף אחת למקום של הבאה, ולכן השבשבת מתלכדת עם עצמה 4 פעמים בסיבוב שלם. לצורה יכולה להיות סימטרייה סיבובית גם בלי אף ציר סימטרייה."]],
      [["What is the smallest turn that makes a regular pentagon fit onto itself?", "72°", ["108°", "60°", "90°"], "A regular pentagon has rotational symmetry of order 5, so the smallest turn is 360° ÷ 5 = 72°. 108° is the size of each of its inside angles, not the turn."],
        ["מהו הסיבוב הקטן ביותר שמביא מחומש משוכלל להתלכד עם עצמו?", "72°", ["108°", "60°", "90°"], "למחומש משוכלל יש סימטרייה סיבובית מסדר 5, ולכן הסיבוב הקטן ביותר הוא 360° ÷ 5 = 72°. 108° הוא גודל כל אחת מהזוויות הפנימיות שלו, ולא הסיבוב."]],
      [["How many planes of symmetry does a cube have?", "9", ["6", "3", "12"], "3 planes are parallel to the faces and cut the cube through the middle; 6 more each pass diagonally through two opposite edges. 3 + 6 = 9."],
        ["כמה מישורי סימטרייה יש לקובייה?", "9", ["6", "3", "12"], "3 מישורים מקבילים לפאות וחוצים את הקובייה באמצע; עוד 6 עוברים כל אחד באלכסון דרך שני מקצועות נגדיים. 3 + 6 = 9."]],
      [["Which shape has point symmetry?", "A regular hexagon", ["A regular pentagon", "A triangle with three equal sides", "A semicircle"], "A regular polygon looks the same after half a turn only when it has an even number of sides. A hexagon has 6, so half a turn (3 steps of 60°) fits it onto itself; the pentagon and the triangle have an odd number of sides, and a semicircle turned halfway ends up upside down."],
        ["לאיזו צורה יש סימטרייה נקודתית?", "משושה משוכלל", ["מחומש משוכלל", "משולש ששלוש צלעותיו שוות", "חצי עיגול"], "מצולע משוכלל נראה אותו דבר אחרי חצי סיבוב רק כשמספר הצלעות שלו זוגי. למשושה יש 6, ולכן חצי סיבוב (3 צעדים של 60°) מביא אותו להתלכד עם עצמו; למחומש ולמשולש יש מספר אי־זוגי של צלעות, וחצי עיגול שמסובבים בחצי סיבוב נמצא הפוך."]],
      [["Which statement is true for every regular polygon with n sides?", "It has n lines of symmetry and rotational symmetry of order n", ["It has n lines of symmetry only when n is an even number", "It has 2n lines of symmetry: one for each side and each corner", "It has rotational symmetry but never any line of symmetry"], "For any regular polygon, the number of lines of symmetry and the order of rotational symmetry both equal the number of sides: 3 for a triangle with equal sides, 4 for a square, 5 for a regular pentagon."],
        ["איזו טענה נכונה לכל מצולע משוכלל עם n צלעות?", "יש לו n צירי סימטרייה וסימטרייה סיבובית מסדר n", ["יש לו n צירי סימטרייה רק כאשר n הוא מספר זוגי", "יש לו 2n צירי סימטרייה: אחד לכל צלע ואחד לכל קודקוד", "יש לו סימטרייה סיבובית, אבל אף פעם אין לו ציר סימטרייה"], "בכל מצולע משוכלל, מספר צירי הסימטרייה וסדר הסימטרייה הסיבובית שווים שניהם למספר הצלעות: 3 במשולש שצלעותיו שוות, 4 בריבוע ו־5 במחומש משוכלל."]],
    ],
    n: [
      [12, ["The smallest turn that fits a regular polygon onto itself is 30°. How many sides does it have?", "", "The smallest turn that fits a regular polygon with n sides onto itself is 360° ÷ n. If 360 ÷ n = 30, then n = 12."],
        ["הסיבוב הקטן ביותר שמביא מצולע משוכלל להתלכד עם עצמו הוא 30°. כמה צלעות יש לו?", "", "הסיבוב הקטן ביותר שמביא מצולע משוכלל עם n צלעות להתלכד עם עצמו הוא 360° ÷ n. אם 360 ÷ n = 30, אז n = 12."]],
      [5, ["A regular five-pointed star is drawn with all its points identical. How many lines of symmetry does it have?", "", "Each line of symmetry runs from one point of the star, through the centre, to the inner corner opposite it. There is one through each point, so there are 5."],
        ["מציירים כוכב משוכלל בעל חמישה חודים זהים. כמה צירי סימטרייה יש לו?", "", "כל ציר סימטרייה עובר מאחד החודים, דרך המרכז, אל הפינה הפנימית שמולו. יש ציר אחד דרך כל חוד, ולכן יש 5 צירים."]],
    ],
    s: [
      [["From the smallest turn that fits the shape onto itself to the largest", "A regular hexagon", "A square", "A triangle with three equal sides", "A rectangle that is not a square", "A triangle with three different sides"],
        ["מהסיבוב הקטן ביותר שמביא את הצורה להתלכד עם עצמה ועד הגדול ביותר", "משושה משוכלל", "ריבוע", "משולש ששלוש צלעותיו שוות", "מלבן שאינו ריבוע", "משולש ששלוש צלעותיו שונות"]],
    ],
  },
};
export default c;
