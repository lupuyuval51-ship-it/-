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
      [["How many degrees are there all the way around the centre of a circle?", "360°", ["180°", "90°", "100°"], "A full turn around the centre is 360°."],
        ["כמה מעלות יש מסביב למרכז העיגול?", "360°", ["180°", "90°", "100°"], "סיבוב שלם סביב המרכז הוא 360°."]],
    ],
  },
  i: {
    t: [
      ["Pi (π)", "the ratio of any circle's perimeter to its diameter, about 3.14", "פאי (π)", "היחס בין ההיקף של כל עיגול לבין הקוטר שלו, בערך 3.14"],
      ["Chord", "a straight line joining two points on a circle", "מיתר", "קו ישר שמחבר שתי נקודות על המעגל"],
      ["Arc", "a part of the curved edge of a circle", "קשת", "חלק מהשפה המעוקלת של המעגל"],
      ["Sector", "a slice of a circle between two radii, like a pizza slice", "גזרה", "חלק של עיגול בין שני רדיוסים, כמו משולש פיצה"],
    ],
    q: [
      [["Using π ≈ 3.14, what is the perimeter of a circle with diameter 10 cm?", "31.4 cm", ["314 cm", "15.7 cm", "62.8 cm"], "Perimeter = π × diameter ≈ 3.14 × 10 = 31.4 cm."],
        ["בעזרת π ≈ 3.14, מה היקף מעגל שקוטרו 10 ס״מ?", "31.4 ס״מ", ["314 ס״מ", "15.7 ס״מ", "62.8 ס״מ"], "היקף = π × קוטר ≈ 3.14 × 10 = 31.4 ס״מ."]],
      [["What is the longest chord of a circle?", "The diameter", ["Any radius", "An arc", "There is no longest chord"], "A chord through the centre is the diameter, and no chord is longer."],
        ["מהו המיתר הארוך ביותר במעגל?", "הקוטר", ["כל רדיוס", "קשת", "אין מיתר ארוך ביותר"], "מיתר שעובר דרך המרכז הוא הקוטר, ואין מיתר ארוך ממנו."]],
    ],
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
      [["What fraction of a circle's area is a sector with a 90° angle?", "1/4", ["1/2", "1/3", "1/90"], "90° out of 360° is one quarter."],
        ["איזה חלק משטח העיגול הוא גזרה עם זווית של 90°?", "1/4", ["1/2", "1/3", "1/90"], "90° מתוך 360° הם רבע."]],
    ],
  },
};
export default c;
