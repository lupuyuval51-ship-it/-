import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Right angle", "an angle of exactly 90°, like the corner of a page", "זווית ישרה", "זווית של 90° בדיוק, כמו פינה של דף"],
      ["Acute angle", "an angle smaller than 90°", "זווית חדה", "זווית שקטנה מ־90°"],
      ["Obtuse angle", "an angle bigger than 90° but smaller than 180°", "זווית קהה", "זווית שגדולה מ־90° אבל קטנה מ־180°"],
      ["Straight angle", "an angle of exactly 180°, which looks like a straight line", "זווית שטוחה", "זווית של 180° בדיוק, שנראית כמו קו ישר"],
      ["Protractor", "a tool for measuring angles in degrees", "מדזווית", "כלי למדידת זוויות במעלות"],
    ],
    q: [
      [["What kind of angle is 45°?", "Acute", ["Obtuse", "Right", "Straight"], "45° is smaller than 90°, so it is acute. A right angle is exactly 90°, and an obtuse angle is bigger than 90°."],
        ["מאיזה סוג היא זווית של 45°?", "חדה", ["קהה", "ישרה", "שטוחה"], "45° קטנה מ־90°, ולכן היא זווית חדה. זווית ישרה היא 90° בדיוק, וזווית קהה גדולה מ־90°."]],
      [["Which of these angles is obtuse?", "120°", ["90°", "200°", "60°"], "An obtuse angle is bigger than 90° but smaller than 180°, and only 120° is in that range: 90° is a right angle, 60° is acute and 200° is more than a straight angle."],
        ["איזו מהזוויות הבאות היא זווית קהה?", "120°", ["90°", "200°", "60°"], "זווית קהה גדולה מ־90° וקטנה מ־180°, ורק 120° נמצאת בתחום הזה: 90° היא זווית ישרה, 60° היא זווית חדה ו־200° גדולה מזווית שטוחה."]],
      [["How many degrees are in a full turn?", "360°", ["180°", "90°", "100°"], "A full turn brings you back to where you started: 360°."],
        ["כמה מעלות יש בסיבוב שלם?", "360°", ["180°", "90°", "100°"], "סיבוב שלם מחזיר אותנו למקום שבו התחלנו: 360°."]],
    ],
    n: [[90, ["How many degrees is a quarter of a full turn?", "°", "A full turn is 360°, and 360 ÷ 4 = 90°: a right angle."], ["כמה מעלות הן רבע סיבוב?", "°", "סיבוב שלם הוא 360°, ו־360 ÷ 4 = 90°: זווית ישרה."]]],
  },
  i: {
    t: [
      ["Complementary angles", "two angles that add up to 90°", "זוויות משלימות ל־90°", "שתי זוויות שסכומן 90°"],
      ["Angles on a straight line", "two angles side by side that together make a straight line, so they add up to 180°", "זוויות צמודות", "שתי זוויות שנוצרות על קו ישר וסכומן 180°"],
      ["Vertical angles", "the opposite angles formed where two lines cross; they are always equal", "זוויות קודקודיות", "הזוויות שמול זו את זו כששני ישרים נחתכים; הן תמיד שוות"],
      ["Reflex angle", "an angle bigger than 180° but smaller than 360°", "זווית קעורה", "זווית שגדולה מ־180° וקטנה מ־360°"],
    ],
    q: [
      [["Two lines cross and one of the angles is 70°. What is the angle opposite it?", "70°", ["110°", "20°", "290°"], "Opposite (vertical) angles are always equal, so it is also 70°."],
        ["שני ישרים נחתכים ואחת הזוויות היא 70°. מה הזווית שמולה?", "70°", ["110°", "20°", "290°"], "זוויות קודקודיות תמיד שוות, ולכן גם היא 70°."]],
      [["Two angles of a triangle are 50° and 60°. What is the third angle?", "70°", ["80°", "110°", "90°"], "The angles of a triangle add up to 180°: 180 − 50 − 60 = 70°."],
        ["שתי זוויות במשולש הן 50° ו־60°. מהי הזווית השלישית?", "70°", ["80°", "110°", "90°"], "סכום הזוויות במשולש הוא 180°: 180 − 50 − 60 = 70°."]],
    ],
    n: [
      [145, ["An angle on a straight line is 35°. What is the angle next to it on the same line?", "°", "Angles on a straight line add up to 180°: 180 − 35 = 145°."], ["זווית על קו ישר היא 35°. מהי הזווית הצמודה לה?", "°", "זוויות צמודות מסתכמות ב־180°: 180 − 35 = 145°."]],
      [65, ["Two angles are complementary, and one of them is 25°. What is the other one?", "°", "Complementary angles add up to 90°: 90 − 25 = 65°."], ["שתי זוויות משלימות זו את זו ל־90°, ואחת מהן היא 25°. מהי הזווית השנייה?", "°", "זוויות משלימות ל־90° מסתכמות ב־90°: 90 − 25 = 65°."]],
    ],
  },
  a: {
    t: [
      ["Corresponding angles", "angles in matching positions where a line crosses two parallel lines; they are equal", "זוויות מתאימות", "זוויות באותו מקום יחסי כשישר חותך שני ישרים מקבילים; הן שוות"],
      ["Alternate angles", "angles on opposite sides of a line crossing two parallel lines, between them; they are equal", "זוויות מתחלפות", "זוויות משני צדי ישר שחותך שני מקבילים, ביניהם; הן שוות"],
      ["Exterior angle", "the angle between one side of a shape and the extension of the side next to it", "זווית חיצונית", "הזווית שבין צלע של צורה לבין ההמשך של הצלע הסמוכה לה"],
      ["Interior angle sum", "the total of the angles inside a polygon: (n − 2) × 180° for n sides", "סכום הזוויות הפנימיות", "סך הזוויות שבתוך מצולע: (n − 2) × 180° כשיש n צלעות"],
    ],
    q: [
      [["What is the sum of the interior angles of a pentagon (5 sides)?", "540°", ["360°", "720°", "900°"], "From one corner a pentagon splits into 3 triangles: (n − 2) × 180° = (5 − 2) × 180° = 540°."],
        ["מהו סכום הזוויות הפנימיות במחומש (5 צלעות)?", "540°", ["360°", "720°", "900°"], "מקודקוד אחד אפשר לחלק מחומש ל־3 משולשים: (n − 2) × 180° = (5 − 2) × 180° = 540°."]],
      [["Each interior angle of a regular hexagon is…", "120°", ["108°", "135°", "60°"], "The angles add up to (6 − 2) × 180° = 720°, and 720 ÷ 6 = 120°."],
        ["כל זווית פנימית במשושה משוכלל היא…", "120°", ["108°", "135°", "60°"], "סכום הזוויות הוא (6 − 2) × 180° = 720°, ו־720 ÷ 6 = 120°."]],
      [["In a triangle, an exterior angle is 130° and one of the far interior angles is 50°. What is the other far interior angle?", "80°", ["50°", "130°", "100°"], "An exterior angle equals the sum of the two interior angles not next to it: 130 − 50 = 80°."],
        ["במשולש, זווית חיצונית היא 130° ואחת הזוויות הפנימיות שאינן צמודות לה היא 50°. מהי הזווית הפנימית השנייה שאינה צמודה לה?", "80°", ["50°", "130°", "100°"], "זווית חיצונית שווה לסכום שתי הזוויות הפנימיות שאינן צמודות לה: 130 − 50 = 80°."]],
    ],
    n: [[360, ["What is the sum of the exterior angles of any convex polygon (one at each corner)?", "°", "Walking around the shape you turn once completely: the exterior angles always add up to 360°."], ["מהו סכום הזוויות החיצוניות של כל מצולע קמור (אחת בכל קודקוד)?", "°", "כשמקיפים את הצורה מסתובבים סיבוב שלם אחד: סכום הזוויות החיצוניות הוא תמיד 360°."]]],
  },
};
export default c;
