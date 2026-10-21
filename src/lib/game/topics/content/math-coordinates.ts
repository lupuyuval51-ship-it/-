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
      [["Which point is on the y-axis?", "(0, 5)", ["(5, 0)", "(5, 5)", "(1, 1)"], "Points on the y-axis have x = 0: you do not go across at all, only up. (5, 0) is on the x-axis."],
        ["איזו נקודה נמצאת על ציר y?", "(0, 5)", ["(5, 0)", "(5, 5)", "(1, 1)"], "לנקודות על ציר y יש x = 0: לא הולכים הצידה בכלל, רק למעלה. הנקודה (5, 0) נמצאת על ציר x."]],
      [["You start at the origin, go 2 across and then 3 up. Which point are you at?", "(2, 3)", ["(3, 2)", "(0, 3)", "(5, 0)"], "Across first, then up: 2 across gives x = 2 and 3 up gives y = 3, so the point is (2, 3). (3, 2) swaps the order."],
        ["מתחילים בראשית הצירים, הולכים 2 הצידה ואחר כך 3 למעלה. באיזו נקודה אתם?", "(2, 3)", ["(3, 2)", "(0, 3)", "(5, 0)"], "קודם הצידה ואחר כך למעלה: 2 הצידה נותן x = 2, ו־3 למעלה נותן y = 3, ולכן הנקודה היא (2, 3). הנקודה (3, 2) הופכת את הסדר."]],
      [["A point lies on the x-axis. What must be true about it?", "Its y-coordinate is 0", ["Its x-coordinate is 0", "Both its coordinates are equal", "Its x-coordinate is negative"], "On the x-axis you have not gone up or down at all, so y = 0, as in (4, 0) or (−2, 0). The x-coordinate can be any number."],
        ["נקודה נמצאת על ציר x. מה בטוח נכון לגביה?", "שיעור ה־y שלה הוא 0", ["שיעור ה־x שלה הוא 0", "שני השיעורים שלה שווים", "שיעור ה־x שלה שלילי"], "על ציר x לא עולים ולא יורדים בכלל, ולכן y = 0, כמו ב־(4, 0) או ב־(−2, 0). שיעור ה־x יכול להיות כל מספר."]],
    ],
    n: [
      [6, ["How far apart are the points (1, 4) and (7, 4)?", "", "Both points have y = 4, so they lie on the same horizontal line, and the distance is the difference of the x-coordinates: 7 − 1 = 6."],
        ["מה המרחק בין הנקודות (1, 4) ו־(7, 4)?", "", "לשתי הנקודות y = 4, ולכן הן על אותו קו אופקי, והמרחק הוא ההפרש בין שיעורי ה־x: 7 − 1 = 6."]],
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
      [["The point (−4, 1) is reflected in the y-axis. Where does it land?", "(4, 1)", ["(−4, −1)", "(4, −1)", "(1, −4)"], "Reflecting in the y-axis swaps left and right: x changes sign and y stays the same, so (−4, 1) lands on (4, 1). (−4, −1) is the reflection in the x-axis."],
        ["משקפים את הנקודה (−4, 1) בציר y. לאן היא מגיעה?", "(4, 1)", ["(−4, −1)", "(4, −1)", "(1, −4)"], "שיקוף בציר y מחליף בין ימין לשמאל: הסימן של x מתהפך ו־y נשאר אותו דבר, ולכן (−4, 1) מגיעה ל־(4, 1). הנקודה (−4, −1) היא השיקוף בציר x."]],
      [["Which point is in the fourth quadrant?", "(3, −2)", ["(−3, 2)", "(−3, −2)", "(3, 2)"], "The fourth quadrant is bottom-right, where x is positive and y is negative. The quadrants are counted anticlockwise, starting from the top-right one."],
        ["איזו נקודה נמצאת ברביע הרביעי?", "(3, −2)", ["(−3, 2)", "(−3, −2)", "(3, 2)"], "הרביע הרביעי הוא למטה מימין, שם x חיובי ו־y שלילי. את הרביעים סופרים נגד כיוון השעון, החל מהרביע שלמעלה מימין."]],
    ],
    n: [
      [10, ["The midpoint of (2, 5) and another point is (6, 5). What is the x-coordinate of the other point?", "", "The midpoint is halfway, so the other point is as far past 6 as 2 is before it: 6 − 2 = 4 and 6 + 4 = 10. Check: (2 + 10) ÷ 2 = 6."],
        ["נקודת האמצע בין (2, 5) לבין נקודה אחרת היא (6, 5). מהו שיעור ה־x של הנקודה האחרת?", "", "נקודת האמצע נמצאת באמצע הדרך, ולכן הנקודה האחרת רחוקה מ־6 כמו ש־2 רחוקה ממנו: 6 − 2 = 4 ו־6 + 4 = 10. בדיקה: (2 + 10) ÷ 2 = 6."]],
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
      [["What is the slope of the line through (1, 2) and (3, 8)?", "3", ["6", "2", "1/3"], "Slope = change in y ÷ change in x = (8 − 2) ÷ (3 − 1) = 6 ÷ 2 = 3. 6 is only the change in y, and 1/3 divides the wrong way round."],
        ["מהו השיפוע של הישר שעובר דרך (1, 2) ו־(3, 8)?", "3", ["6", "2", "1/3"], "השיפוע הוא השינוי ב־y חלקי השינוי ב־x: (8 − 2) ÷ (3 − 1) = 6 ÷ 2 = 3. המספר 6 הוא רק השינוי ב־y, ו־1/3 מתקבל כשמחלקים בסדר ההפוך."]],
      [["Which line is parallel to y = 2x + 1?", "y = 2x − 5", ["y = −2x + 1", "y = x + 2", "y = 1/2 x"], "Parallel lines have the same slope. y = 2x + 1 and y = 2x − 5 both have slope 2; only where they cross the y-axis differs. y = −2x + 1 slopes the other way."],
        ["איזה ישר מקביל ל־y = 2x + 1?", "y = 2x − 5", ["y = −2x + 1", "y = x + 2", "y = 1/2 x"], "לישרים מקבילים אותו שיפוע. לישר y = 2x + 1 ולישר y = 2x − 5 יש שיפוע 2, ורק נקודת החיתוך עם ציר y שונה. הישר y = −2x + 1 נוטה לכיוון השני."]],
      [["A line has slope 2. What is the slope of a line perpendicular to it?", "−1/2", ["2", "−2", "1/2"], "Perpendicular slopes multiply to −1: 2 × (−1/2) = −1."],
        ["לישר שיפוע 2. מהו השיפוע של ישר המאונך לו?", "−1/2", ["2", "−2", "1/2"], "מכפלת השיפועים של ישרים מאונכים היא −1: 2 × (−1/2) = −1."]],
      [["Where does the line y = 3x − 6 cross the x-axis?", "(2, 0)", ["(0, −6)", "(−6, 0)", "(6, 0)"], "On the x-axis y = 0, so 3x − 6 = 0 and x = 2: the point (2, 0). (0, −6) is where the line crosses the y-axis."],
        ["באיזו נקודה הישר y = 3x − 6 חותך את ציר x?", "(2, 0)", ["(0, −6)", "(−6, 0)", "(6, 0)"], "על ציר x מתקיים y = 0, ולכן 3x − 6 = 0 ו־x = 2: הנקודה (2, 0). הנקודה (0, −6) היא המקום שבו הישר חותך את ציר y."]],
    ],
    n: [
      [3, ["A line with slope 2 passes through (1, 5). At what y-value does it cross the y-axis?", "", "The line is y = 2x + b and passes through (1, 5): 5 = 2 × 1 + b, so b = 3. It is y = 2x + 3 and crosses the y-axis at (0, 3)."],
        ["ישר ששיפועו 2 עובר דרך (1, 5). באיזה ערך של y הוא חותך את ציר y?", "", "הישר הוא y = 2x + b ועובר דרך (1, 5): 5 = 2 × 1 + b, ולכן b = 3. זה הישר y = 2x + 3, והוא חותך את ציר y ב־(0, 3)."]],
    ],
  },
};
export default c;
