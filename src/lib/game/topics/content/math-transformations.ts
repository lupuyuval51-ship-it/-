import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Translation", "moving a shape by sliding every one of its points the same distance in the same direction", "הזזה", "העברה של צורה שבה כל נקודה שלה זזה אותו מרחק ובאותו כיוון"],
      ["Reflection", "flipping a shape over a mirror line, so each point lands the same distance away on the other side", "שיקוף", "היפוך של צורה מעל קו ראי, כך שכל נקודה נוחתת באותו מרחק מהקו בצד השני שלו"],
      ["Rotation", "turning a shape through a given angle around a fixed point", "סיבוב", "תנועה של צורה בזווית נתונה סביב נקודה קבועה"],
      ["Image", "the new shape or point you get after a transformation", "תמונה", "הצורה או הנקודה החדשה שמתקבלת אחרי העתקה"],
    ],
    q: [
      [["The point (2, 3) is translated 4 units to the right. Where does it end up?", "(6, 3)", ["(2, 7)", "(6, 7)", "(−2, 3)"], "Moving right changes only the x-coordinate: 2 + 4 = 6. The y-coordinate stays 3, so the image is (6, 3). (2, 7) would be a move of 4 units up."],
        ["מזיזים את הנקודה (2, 3) ב־4 יחידות ימינה. לאן היא מגיעה?", "(6, 3)", ["(2, 7)", "(6, 7)", "(−2, 3)"], "תזוזה ימינה משנה רק את שיעור ה־x: 2 + 4 = 6. שיעור ה־y נשאר 3, ולכן התמונה היא (6, 3). הנקודה (2, 7) הייתה מתקבלת מתזוזה של 4 יחידות למעלה."]],
      [["After a translation, what is true about the image of a shape?", "It has the same size and shape and faces the same way", ["It has the same size, but now it faces the opposite way", "It keeps its shape but becomes a little larger", "It is turned a quarter turn around its centre"], "A translation only slides the shape: every point moves the same distance in the same direction, so nothing is turned, flipped or resized."],
        ["מה נכון לגבי התמונה של צורה אחרי הזזה?", "יש לה אותו גודל ואותה צורה, והיא פונה לאותו כיוון", ["יש לה אותו גודל, אבל עכשיו היא פונה לכיוון ההפוך", "היא שומרת על הצורה שלה, אבל גדלה מעט", "היא מסובבת ברבע סיבוב סביב המרכז שלה"], "הזזה רק מעבירה את הצורה: כל נקודה זזה אותו מרחק ובאותו כיוון, ולכן שום דבר לא מסתובב, לא מתהפך ולא משנה את גודלו."]],
      [["The point (3, 2) is reflected in the y-axis. Where is its image?", "(−3, 2)", ["(3, −2)", "(−3, −2)", "(2, 3)"], "The y-axis is the mirror line, so the point flips to the other side at the same distance: x changes sign and y stays the same. (3, −2) is the reflection in the x-axis."],
        ["משקפים את הנקודה (3, 2) בציר ה־y. איפה התמונה שלה?", "(−3, 2)", ["(3, −2)", "(−3, −2)", "(2, 3)"], "ציר ה־y הוא קו הראי, ולכן הנקודה עוברת לצד השני באותו מרחק: הסימן של x מתהפך ו־y נשאר כמו שהוא. הנקודה (3, −2) היא השיקוף בציר ה־x."]],
      [["The minute hand of a clock moves from 12 to 3. Which transformation is this?", "A rotation of 90° clockwise about the centre of the clock", ["A rotation of 90° anticlockwise about the centre of the clock", "A translation of 3 units to the right", "A reflection in the line from 12 to 6"], "The hand turns about the centre of the clock, and from 12 to 3 is a quarter of a full turn, 90°, in the direction clocks go: clockwise."],
        ["מחוג הדקות של שעון זז מ־12 ל־3. איזו העתקה זו?", "סיבוב של 90° עם כיוון השעון סביב מרכז השעון", ["סיבוב של 90° נגד כיוון השעון סביב מרכז השעון", "הזזה של 3 יחידות ימינה", "שיקוף בקו שעובר מ־12 ל־6"], "המחוג מסתובב סביב מרכז השעון, ומ־12 עד 3 זה רבע סיבוב שלם, 90°, בכיוון שבו נעים מחוגי השעון."]],
      [["A shape is reflected in a mirror line. Which of these changes?", "The way it faces: left and right are swapped", ["The lengths of its sides, which all become shorter", "The sizes of its angles, which all become larger", "Its area, which becomes twice as big"], "A reflection keeps every length, angle and area the same; it only flips the shape, so what was on its left is now on its right."],
        ["משקפים צורה בקו ראי. מה מהבאים משתנה?", "הכיוון שאליו היא פונה: ימין ושמאל מתחלפים", ["אורכי הצלעות שלה, שכולן נעשות קצרות יותר", "גודלי הזוויות שלה, שכולן נעשות גדולות יותר", "השטח שלה, שנעשה גדול פי 2"], "שיקוף שומר על כל האורכים, הזוויות והשטח; הוא רק הופך את הצורה, כך שמה שהיה בצד שמאל שלה נמצא עכשיו בצד ימין."]],
    ],
    n: [
      [6, ["Point A is 3 cm from a mirror line. How far is A from its image after the reflection?", "cm", "The image is also 3 cm from the line, on the other side, so the distance between A and its image is 3 + 3 = 6 cm."],
        ["הנקודה A נמצאת במרחק 3 ס״מ מקו ראי. מה המרחק בין A לתמונה שלה אחרי השיקוף?", "ס״מ", "גם התמונה נמצאת במרחק 3 ס״מ מהקו, בצד השני שלו, ולכן המרחק בין A לתמונה שלה הוא 3 + 3 = 6 ס״מ."]],
    ],
    s: [
      [["From the smallest turn to the largest", "A quarter turn", "A half turn", "Three quarters of a turn", "A full turn"],
        ["מהסיבוב הקטן ביותר לגדול ביותר", "רבע סיבוב", "חצי סיבוב", "שלושה רבעי סיבוב", "סיבוב שלם"]],
    ],
  },
  i: {
    t: [
      ["Centre of rotation", "the fixed point that a shape is turned around; it stays where it is", "מרכז הסיבוב", "הנקודה הקבועה שסביבה מסובבים את הצורה; היא נשארת במקומה"],
      ["Isometry", "a transformation that keeps all lengths unchanged, such as a slide, a flip or a turn", "איזומטריה", "העתקה ששומרת על כל האורכים בלי שינוי, כמו הזזה, שיקוף או סיבוב"],
      ["Translation vector", "a pair of numbers saying how far a slide moves across and how far up or down", "וקטור הזזה", "זוג מספרים שאומר כמה להזיז ימינה או שמאלה וכמה למעלה או למטה"],
    ],
    q: [
      [["The point (4, 1) is rotated 90° anticlockwise about the origin. Where does it go?", "(−1, 4)", ["(1, −4)", "(−4, −1)", "(4, −1)"], "A quarter turn anticlockwise about the origin sends (x, y) to (−y, x), so (4, 1) goes to (−1, 4). (1, −4) is where a clockwise quarter turn would take it."],
        ["מסובבים את הנקודה (4, 1) ב־90° נגד כיוון השעון סביב ראשית הצירים. לאן היא מגיעה?", "(−1, 4)", ["(1, −4)", "(−4, −1)", "(4, −1)"], "רבע סיבוב נגד כיוון השעון סביב הראשית מעביר את (x, y) ל־(−y, x), ולכן (4, 1) עוברת ל־(−1, 4). לנקודה (1, −4) היה מביא רבע סיבוב עם כיוון השעון."]],
      [["Which transformation is undone by doing exactly the same transformation a second time?", "A reflection in a line", ["A rotation of 90° about a point", "A translation of 3 units to the right", "An enlargement with scale factor 2"], "Flipping over the same mirror line twice brings every point back to where it started. Two 90° turns make 180°, and two slides of 3 units move 6 units."],
        ["איזו העתקה מתבטלת כשעושים בדיוק אותה העתקה פעם שנייה?", "שיקוף בקו", ["סיבוב של 90° סביב נקודה", "הזזה של 3 יחידות ימינה", "הגדלה במקדם 2"], "שיקוף פעמיים באותו קו ראי מחזיר כל נקודה למקום שבו התחילה. שני סיבובים של 90° הם 180°, ושתי הזזות של 3 יחידות מזיזות 6 יחידות."]],
      [["The point (5, 2) is reflected in the line y = x. Where is its image?", "(2, 5)", ["(−5, 2)", "(5, −2)", "(−2, −5)"], "Reflecting in the line y = x swaps the two coordinates, so (5, 2) becomes (2, 5). (−2, −5) would be the reflection in the line y = −x."],
        ["משקפים את הנקודה (5, 2) בישר y = x. איפה התמונה שלה?", "(2, 5)", ["(−5, 2)", "(5, −2)", "(−2, −5)"], "שיקוף בישר y = x מחליף בין שני השיעורים, ולכן (5, 2) הופכת ל־(2, 5). הנקודה (−2, −5) הייתה השיקוף בישר y = −x."]],
      [["A translation moves (1, 2) to (4, −1). Where does the same translation move (0, 5)?", "(3, 2)", ["(3, 8)", "(−3, 8)", "(4, 4)"], "The move is 3 right and 3 down, the vector (3, −3). Applying it to (0, 5) gives (0 + 3, 5 − 3) = (3, 2)."],
        ["הזזה מעבירה את (1, 2) ל־(4, −1). לאן אותה הזזה מעבירה את (0, 5)?", "(3, 2)", ["(3, 8)", "(−3, 8)", "(4, 4)"], "ההזזה היא 3 ימינה ו־3 למטה, הווקטור (3, −3). כשמפעילים אותה על (0, 5) מקבלים (0 + 3, 5 − 3) = (3, 2)."]],
      [["The corners of triangle ABC go A, B, C clockwise. After a reflection, in which direction do the corners of the image go?", "Anticlockwise", ["Clockwise, the same as before", "It depends on the size of the triangle", "They end up in a straight line"], "A reflection flips the shape over, so the order of the corners is reversed: clockwise becomes anticlockwise. A translation or a rotation keeps the same direction."],
        ["הקודקודים של משולש ABC מסודרים A, B, C עם כיוון השעון. אחרי שיקוף, באיזה כיוון מסודרים הקודקודים של התמונה?", "נגד כיוון השעון", ["עם כיוון השעון, כמו קודם", "זה תלוי בגודל המשולש", "הם נמצאים על קו ישר אחד"], "שיקוף הופך את הצורה, ולכן סדר הקודקודים מתהפך: מה שהיה עם כיוון השעון נעשה נגד כיוון השעון. הזזה או סיבוב שומרים על אותו כיוון."]],
    ],
    n: [
      [90, ["A shape is turned 90° clockwise three times about the same point. What single anticlockwise turn, in degrees, gives the same result?", "degrees", "Three quarter turns clockwise make 270° clockwise. A full turn is 360°, so the same position is reached by 360 − 270 = 90° anticlockwise."],
        ["מסובבים צורה שלוש פעמים ב־90° עם כיוון השעון סביב אותה נקודה. איזה סיבוב יחיד נגד כיוון השעון, במעלות, נותן אותה תוצאה?", "מעלות", "שלושה רבעי סיבוב עם כיוון השעון הם 270° עם כיוון השעון. סיבוב שלם הוא 360°, ולכן לאותו מצב מגיעים בסיבוב של 360 − 270 = 90° נגד כיוון השעון."]],
      [3, ["The point P(2, 6) is translated by the vector (5, −3). What is the y-coordinate of its image?", "", "The vector adds 5 to x and −3 to y: the image is (2 + 5, 6 − 3) = (7, 3), so its y-coordinate is 3."],
        ["מזיזים את הנקודה P(2, 6) לפי הווקטור (5, −3). מהו שיעור ה־y של התמונה?", "", "הווקטור מוסיף 5 ל־x ו־−3 ל־y: התמונה היא (2 + 5, 6 − 3) = (7, 3), ולכן שיעור ה־y שלה הוא 3."]],
    ],
    s: [
      [["Rotating a shape with tracing paper", "Trace the shape and mark the centre of rotation on the tracing", "Hold the tracing paper down at the centre with a pencil point", "Turn the tracing paper through the given angle in the given direction", "Mark where each corner of the shape now lies", "Join the marked corners to draw the image"],
        ["סיבוב צורה בעזרת נייר שקוף", "מעתיקים את הצורה לנייר השקוף ומסמנים עליו את מרכז הסיבוב", "מצמידים את הנייר השקוף במרכז בעזרת חוד של עיפרון", "מסובבים את הנייר השקוף בזווית הנתונה ובכיוון הנתון", "מסמנים איפה נמצאת עכשיו כל פינה של הצורה", "מחברים את הפינות שסומנו ומקבלים את התמונה"]],
    ],
  },
  a: {
    t: [
      ["Enlargement", "a transformation that changes the size of a shape by a fixed factor from a fixed centre, keeping its angles", "הגדלה", "העתקה שמשנה את גודל הצורה פי מספר קבוע ממרכז קבוע, ושומרת על הזוויות שלה"],
      ["Scale factor", "the number that every length is multiplied by when a shape is made bigger or smaller", "מקדם הגדלה", "המספר שבו כופלים כל אורך כשמגדילים או מקטינים צורה"],
      ["Invariant point", "a point that stays in exactly the same place after a transformation", "נקודת שבת", "נקודה שנשארת בדיוק באותו מקום אחרי העתקה"],
    ],
    q: [
      [["Reflecting a shape in the x-axis and then in the y-axis is the same as which single transformation?", "A rotation of 180° about the origin", ["A reflection in the diagonal line y = x", "A rotation of 90° about the origin", "A translation along the x-axis"], "The first reflection sends (x, y) to (x, −y), and the second sends that to (−x, −y), which is exactly a half turn about the origin."],
        ["שיקוף של צורה בציר ה־x ואחריו שיקוף בציר ה־y שווה לאיזו העתקה יחידה?", "סיבוב של 180° סביב ראשית הצירים", ["שיקוף בישר האלכסוני y = x", "סיבוב של 90° סביב ראשית הצירים", "הזזה לאורך ציר ה־x"], "השיקוף הראשון מעביר את (x, y) ל־(x, −y), והשני מעביר אותה ל־(−x, −y), וזה בדיוק חצי סיבוב סביב הראשית."]],
      [["Which points are invariant under a reflection in a line?", "Every point on the mirror line", ["Only the point where the shape touches the mirror line", "Only the origin, (0, 0)", "No points at all"], "A point on the mirror line is its own reflection: it is 0 away from the line, so its image is 0 away too. Every other point moves to the other side."],
        ["אילו נקודות הן נקודות שבת של שיקוף בקו?", "כל הנקודות שעל קו הראי", ["רק הנקודה שבה הצורה נוגעת בקו הראי", "רק ראשית הצירים, (0, 0)", "אין אף נקודה כזו"], "נקודה שעל קו הראי היא השיקוף של עצמה: המרחק שלה מהקו הוא 0, ולכן גם המרחק של התמונה שלה הוא 0. כל נקודה אחרת עוברת לצד השני."]],
      [["What does an enlargement with scale factor 1/2 do to a shape?", "It halves every length, so the shape gets smaller", ["It doubles every length, so the shape gets larger", "It halves the area but keeps every side the same", "It turns the shape upside down"], "Every length is multiplied by 1/2, so the image is the same shape at half the size. Its area becomes (1/2)² = 1/4 of the original."],
        ["מה עושה לצורה הגדלה במקדם 1/2?", "היא מקטינה כל אורך פי 2, והצורה נעשית קטנה יותר", ["היא מכפילה כל אורך פי 2, והצורה נעשית גדולה יותר", "היא מקטינה את השטח פי 2, אבל לא משנה אף צלע", "היא הופכת את הצורה כך שהחלק העליון שלה נמצא למטה"], "כל אורך מוכפל ב־1/2, ולכן התמונה היא אותה צורה בחצי מהגודל. השטח שלה נעשה (1/2)² = 1/4 מהשטח המקורי."]],
      [["A shape is reflected in two parallel mirror lines that are 3 cm apart. What single transformation does the same?", "A translation of 6 cm at right angles to the lines", ["A translation of 3 cm at right angles to the lines", "A rotation of 180° about a point between the lines", "A reflection in a line halfway between them"], "Two reflections in parallel lines always make a translation, at right angles to the lines, by twice the gap between them: 2 × 3 = 6 cm."],
        ["משקפים צורה בשני קווי ראי מקבילים שהמרחק ביניהם 3 ס״מ. איזו העתקה יחידה עושה אותו דבר?", "הזזה של 6 ס״מ בניצב לקווים", ["הזזה של 3 ס״מ בניצב לקווים", "סיבוב של 180° סביב נקודה שבין הקווים", "שיקוף בקו שנמצא באמצע ביניהם"], "שני שיקופים בקווים מקבילים נותנים תמיד הזזה, בניצב לקווים, במרחק כפול מהמרחק ביניהם: 2 × 3 = 6 ס״מ."]],
      [["The point (2, 3) is enlarged with scale factor 3 and centre the origin. Where is its image?", "(6, 9)", ["(5, 6)", "(6, 3)", "(2, 9)"], "With centre the origin, each coordinate is multiplied by the scale factor: (2 × 3, 3 × 3) = (6, 9). (5, 6) comes from adding 3 instead of multiplying."],
        ["מגדילים את הנקודה (2, 3) במקדם 3 כשמרכז ההגדלה הוא ראשית הצירים. איפה התמונה שלה?", "(6, 9)", ["(5, 6)", "(6, 3)", "(2, 9)"], "כשהמרכז הוא הראשית, כופלים כל שיעור במקדם: (2 × 3, 3 × 3) = (6, 9). הנקודה (5, 6) מתקבלת כשמוסיפים 3 במקום לכפול."]],
    ],
    n: [
      [24, ["A shape with a perimeter of 12 cm is enlarged with scale factor 2. What is the perimeter of the image?", "cm", "Every length doubles, so the perimeter doubles too: 12 × 2 = 24 cm. The area, by contrast, becomes 4 times as large."],
        ["מגדילים במקדם 2 צורה שהיקפה 12 ס״מ. מה ההיקף של התמונה?", "ס״מ", "כל אורך מוכפל ב־2, ולכן גם ההיקף מוכפל: 12 × 2 = 24 ס״מ. השטח, לעומת זאת, גדל פי 4."]],
      [80, ["Reflecting in two mirror lines that cross at 40° is the same as one rotation about the crossing point. Through how many degrees?", "degrees", "Two reflections in crossing lines make a rotation about the crossing point by twice the angle between the lines: 2 × 40 = 80°."],
        ["שיקוף בשני קווי ראי שנחתכים בזווית של 40° שווה לסיבוב אחד סביב נקודת החיתוך. בכמה מעלות?", "מעלות", "שני שיקופים בקווים נחתכים נותנים סיבוב סביב נקודת החיתוך בזווית כפולה מהזווית שבין הקווים: 2 × 40 = 80°."]],
    ],
    s: [
      [["Enlarging a triangle with scale factor 2 and centre the origin", "Write down the coordinates of each corner of the triangle", "Multiply the x- and y-coordinates of each corner by 2", "Plot the new points on the grid", "Join the new points in the same order as the old corners", "Check that every side is twice as long as before"],
        ["הגדלת משולש במקדם 2 כשמרכז ההגדלה הוא ראשית הצירים", "רושמים את שיעורי הנקודות של כל פינה במשולש", "מכפילים ב־2 את שיעור ה־x ואת שיעור ה־y של כל פינה", "מסמנים את הנקודות החדשות במערכת הצירים", "מחברים את הנקודות החדשות באותו סדר של הפינות הישנות", "בודקים שכל צלע ארוכה פי 2 מקודם"]],
    ],
  },
};
export default c;
