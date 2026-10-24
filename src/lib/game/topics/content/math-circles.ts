import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Centre", "the point in the middle of a circle, the same distance from every point on its edge", "מרכז", "הנקודה באמצע העיגול, שנמצאת באותו מרחק מכל נקודה בשפתו"],
      ["Radius", "a line from the centre to the edge of a circle", "רדיוס", "קו מהמרכז אל שפת העיגול"],
      ["Diameter", "a line across a circle through the centre; it is twice the radius", "קוטר", "קו שחוצה את העיגול דרך המרכז; הוא פי שניים מהרדיוס"],
      ["Compasses", "a tool with two arms for drawing circles", "מחוגה", "כלי עם שתי זרועות לשרטוט עיגולים"],
    ],
    q: [
      [["A circle has a radius of 6 cm. What is its diameter?", "12 cm", ["3 cm", "6 cm", "36 cm"], "The diameter is twice the radius: 2 × 6 = 12 cm."],
        ["לעיגול רדיוס של 6 ס״מ. מה הקוטר שלו?", "12 ס״מ", ["3 ס״מ", "6 ס״מ", "36 ס״מ"], "הקוטר הוא פי שניים מהרדיוס: 2 × 6 = 12 ס״מ."]],
      [["How many degrees are there all the way around the centre of a circle?", "360°", ["180°", "90°", "100°"], "A full turn around the centre is 360°, like any full turn. 180° is only half a turn."],
        ["כמה מעלות יש מסביב למרכז העיגול?", "360°", ["180°", "90°", "100°"], "סיבוב שלם סביב המרכז הוא 360°, כמו כל סיבוב שלם. 180° הם רק חצי סיבוב."]],
      [["A circle has a radius of 4 cm. How far is its centre from a point on its edge?", "4 cm", ["8 cm", "It depends on the point", "2 cm"], "Every point on the edge of a circle is the same distance from the centre, and that distance is the radius: 4 cm. 8 cm is the diameter, the whole way across."],
        ["לעיגול רדיוס של 4 ס״מ. מה המרחק בין המרכז שלו לבין נקודה על השפה שלו?", "4 ס״מ", ["8 ס״מ", "זה תלוי בנקודה", "2 ס״מ"], "כל נקודה על שפת העיגול נמצאת באותו מרחק מהמרכז, והמרחק הזה הוא הרדיוס: 4 ס״מ. 8 ס״מ הוא הקוטר, המרחק מצד לצד דרך המרכז."]],
    ],
    n: [[9, ["A circle has a diameter of 18 cm. What is its radius?", "cm", "The radius is half the diameter, because a diameter is made of two radii: 18 ÷ 2 = 9 cm."], ["לעיגול קוטר של 18 ס״מ. מה הרדיוס שלו?", "ס״מ", "הרדיוס הוא חצי מהקוטר, כי הקוטר בנוי משני רדיוסים: 18 ÷ 2 = 9 ס״מ."]]],
  },
  i: {
    t: [
      ["Pi (π)", "the ratio of any circle's perimeter to its diameter, about 3.14", "פאי (π)", "היחס בין ההיקף של כל עיגול לבין הקוטר שלו, בערך 3.14"],
      ["Chord", "a straight line joining two points on a circle", "מיתר", "קו ישר שמחבר שתי נקודות על המעגל"],
      ["Arc", "a part of the curved edge of a circle", "קשת", "חלק מהשפה המעוקלת של המעגל"],
      ["Sector", "a slice of a circle between two radii, like a pizza slice", "גזרה", "חלק של עיגול בין שני רדיוסים, כמו משולש פיצה"],
    ],
    q: [
      [["Using π ≈ 3.14, what is the perimeter of a circle with diameter 10 cm?", "31.4 cm", ["314 cm", "15.7 cm", "62.8 cm"], "Perimeter = π × diameter ≈ 3.14 × 10 = 31.4 cm. 62.8 cm comes from using the diameter as if it were the radius."],
        ["בעזרת π ≈ 3.14, מה היקף מעגל שקוטרו 10 ס״מ?", "31.4 ס״מ", ["314 ס״מ", "15.7 ס״מ", "62.8 ס״מ"], "היקף = π × קוטר ≈ 3.14 × 10 = 31.4 ס״מ. את 62.8 ס״מ מקבלים כשמשתמשים בקוטר כאילו הוא הרדיוס."]],
      [["A circle has a radius of 7 cm. How long is its longest chord?", "14 cm", ["7 cm", "44 cm", "There is no longest chord"], "The longest chord goes through the centre, so it is the diameter: 2 × 7 = 14 cm. 7 cm is only the radius, and about 44 cm is the perimeter, which is curved and not a chord."],
        ["למעגל רדיוס של 7 ס״מ. מה אורך המיתר הארוך ביותר שלו?", "14 ס״מ", ["7 ס״מ", "44 ס״מ", "אין מיתר ארוך ביותר"], "המיתר הארוך ביותר עובר דרך המרכז, ולכן הוא הקוטר: 2 × 7 = 14 ס״מ. 7 ס״מ הוא רק הרדיוס, וכ־44 ס״מ הוא ההיקף, שהוא קו מעוקל ולא מיתר."]],
      [["One circle's diameter is twice as long as another's. How many times as long is its perimeter?", "2 times", ["4 times", "π times", "8 times"], "Perimeter = π × diameter, so doubling the diameter doubles the perimeter: 2 times. It is the area that grows 4 times, because it grows in both directions."],
        ["הקוטר של עיגול אחד ארוך פי 2 מהקוטר של עיגול אחר. פי כמה ארוך ההיקף שלו?", "פי 2", ["פי 4", "פי π", "פי 8"], "היקף = π × קוטר, ולכן כשהקוטר גדל פי 2, גם ההיקף גדל פי 2. השטח הוא שגדל פי 4, כי הוא גדל בשני הכיוונים."]],
    ],
    n: [[12.56, ["Using π ≈ 3.14, what is the perimeter of a circle with radius 2 cm?", "cm", "The diameter is 2 × 2 = 4 cm, so the perimeter is π × diameter ≈ 3.14 × 4 = 12.56 cm.", "Find the diameter first, then multiply it by 3.14."], ["בעזרת π ≈ 3.14, מה היקף מעגל שהרדיוס שלו 2 ס״מ?", "ס״מ", "הקוטר הוא 2 × 2 = 4 ס״מ, ולכן ההיקף הוא π × קוטר ≈ 3.14 × 4 = 12.56 ס״מ.", "קודם מוצאים את הקוטר, ואז כופלים אותו ב־3.14."], 0.05]],
  },
  a: {
    t: [
      ["Tangent", "a line that touches a circle at exactly one point and is perpendicular to the radius there", "משיק", "ישר שנוגע במעגל בנקודה אחת בדיוק ומאונך לרדיוס שבאותה נקודה"],
      ["Inscribed angle", "an angle with its vertex on the circle; it is half the central angle on the same arc", "זווית היקפית", "זווית שהקודקוד שלה על המעגל; היא חצי מהזווית המרכזית שנשענת על אותה קשת"],
      ["Central angle", "an angle with its vertex at the centre of the circle", "זווית מרכזית", "זווית שהקודקוד שלה במרכז המעגל"],
      ["Thales' theorem", "an angle drawn on a circle from the two ends of a diameter is always 90°", "משפט תאלס", "זווית שנשענת על קוטר מנקודה על המעגל היא תמיד 90°"],
    ],
    q: [
      [["A central angle is 80°. What is the inscribed angle on the same arc?", "40°", ["80°", "160°", "100°"], "An inscribed angle is half the central angle on the same arc: 80 ÷ 2 = 40°."],
        ["זווית מרכזית היא 80°. מהי הזווית ההיקפית שנשענת על אותה קשת?", "40°", ["80°", "160°", "100°"], "זווית היקפית שווה למחצית הזווית המרכזית שנשענת על אותה קשת: 80 ÷ 2 = 40°."]],
      [["What fraction of a circle's area is a sector with a 90° angle?", "1/4", ["1/2", "1/3", "1/90"], "A sector's share of the area is its angle out of 360°: 90 ÷ 360 = 1/4, one quarter."],
        ["איזה חלק משטח העיגול הוא גזרה עם זווית של 90°?", "1/4", ["1/2", "1/3", "1/90"], "החלק של גזרה משטח העיגול הוא הזווית שלה מתוך 360°: 90 ÷ 360 = 1/4, כלומר רבע."]],
      [["Two inscribed angles stand on the same arc, and one of them is 35°. How big is the other?", "35°", ["70°", "145°", "17.5°"], "Each of them is half of the same central angle, so inscribed angles on the same arc are equal: 35°. 70° is the central angle on that arc."],
        ["שתי זוויות היקפיות נשענות על אותה קשת, ואחת מהן היא 35°. מה גודלה של השנייה?", "35°", ["70°", "145°", "17.5°"], "כל אחת מהן היא חצי מאותה זווית מרכזית, ולכן זוויות היקפיות שנשענות על אותה קשת שוות: 35°. 70° היא הזווית המרכזית שנשענת על הקשת הזאת."]],
    ],
    n: [[8, ["A circle has a radius of 5 cm, and a chord is 3 cm from the centre. How long is the chord?", "cm", "The perpendicular from the centre cuts the chord in half. Half the chord is √(5² − 3²) = √16 = 4 cm, so the chord is 8 cm.", "Draw the radius to one end of the chord: it makes a right triangle with sides 3 and 5."], ["לעיגול רדיוס של 5 ס״מ, ומיתר נמצא במרחק 3 ס״מ מהמרכז. מה אורך המיתר?", "ס״מ", "האנך מהמרכז אל המיתר חוצה אותו. חצי המיתר הוא √(5² − 3²) = √16 = 4 ס״מ, ולכן המיתר הוא 8 ס״מ.", "שרטטו רדיוס אל קצה המיתר: נוצר משולש ישר זווית עם הצלעות 3 ו־5."]]],
  },
};
export default c;
