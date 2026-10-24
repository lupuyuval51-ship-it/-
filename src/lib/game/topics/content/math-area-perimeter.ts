import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Perimeter", "the total length around the outside of a shape", "היקף", "האורך הכולל מסביב לגבול של צורה"],
      ["Area", "how much flat surface a shape covers, counted in squares", "שטח", "כמה מקום צורה שטוחה תופסת, נספר בריבועים"],
      ["Square centimetre", "a unit of area: a square with sides of 1 cm", "סמ״ר", "יחידת שטח: ריבוע שאורך כל צלע שלו 1 ס״מ"],
      ["Rectangle", "a four-sided shape with four right angles", "מלבן", "צורה עם ארבע צלעות וארבע זוויות ישרות"],
    ],
    q: [
      [["A rectangle is 5 cm long and 3 cm wide. What is its area?", "15 cm²", ["16 cm²", "8 cm²", "30 cm²"], "Area of a rectangle = length × width = 5 × 3 = 15 cm²."],
        ["מלבן שאורכו 5 ס״מ ורוחבו 3 ס״מ. מה שטחו?", "15 סמ״ר", ["16 סמ״ר", "8 סמ״ר", "30 סמ״ר"], "שטח מלבן = אורך × רוחב = 5 × 3 = 15 סמ״ר."]],
      [["A square has sides of 4 cm. What is its perimeter?", "16 cm", ["8 cm", "12 cm", "4 cm"], "A square has 4 equal sides: 4 + 4 + 4 + 4 = 16 cm."],
        ["לריבוע צלע של 4 ס״מ. מה ההיקף שלו?", "16 ס״מ", ["8 ס״מ", "12 ס״מ", "4 ס״מ"], "לריבוע 4 צלעות שוות: 4 + 4 + 4 + 4 = 16 ס״מ."]],
      [["In which unit can the area of a page be measured?", "cm²", ["cm", "cm³", "degrees"], "Area counts squares, so it is measured in square units such as cm². Centimetres measure length, cm³ measure volume and degrees measure angles."],
        ["באיזו יחידה אפשר למדוד את השטח של דף?", "סמ״ר", ["ס״מ", "סמ״ק", "מעלות"], "שטח סופרים בריבועים, ולכן מודדים אותו ביחידות ריבועיות כמו סמ״ר. בס״מ מודדים אורך, בסמ״ק מודדים נפח ובמעלות מודדים זוויות."]],
    ],
    n: [[16, ["A rectangle is 6 cm long and 2 cm wide. What is its perimeter?", "cm", "Add all four sides: 6 + 2 + 6 + 2 = 16 cm."], ["מלבן שאורכו 6 ס״מ ורוחבו 2 ס״מ. מה ההיקף שלו?", "ס״מ", "מחברים את ארבע הצלעות: 6 + 2 + 6 + 2 = 16 ס״מ."]]],
  },
  i: {
    t: [
      ["Triangle area", "half of the base times the height: (b × h) ÷ 2", "שטח משולש", "חצי ממכפלת הבסיס בגובה: (b × h) ÷ 2"],
      ["Height", "the distance from a base to the opposite corner, measured at a right angle to the base", "גובה", "המרחק מבסיס אל הקודקוד שמולו, כשמודדים בניצב לבסיס"],
      ["Parallelogram", "a four-sided shape whose opposite sides are parallel; its area is base × height", "מקבילית", "מרובע שהצלעות הנגדיות בו מקבילות; השטח שלו הוא בסיס × גובה"],
      ["Square metre", "a unit of area equal to 10,000 square centimetres", "מ״ר", "יחידת שטח ששווה ל־10,000 סמ״ר"],
    ],
    q: [
      [["A triangle has a base of 8 cm and a height of 5 cm. What is its area?", "20 cm²", ["40 cm²", "13 cm²", "26 cm²"], "Area of a triangle = (base × height) ÷ 2 = (8 × 5) ÷ 2 = 40 ÷ 2 = 20 cm². 40 cm² forgets to halve."],
        ["למשולש בסיס של 8 ס״מ וגובה של 5 ס״מ. מה שטחו?", "20 סמ״ר", ["40 סמ״ר", "13 סמ״ר", "26 סמ״ר"], "שטח משולש = (בסיס × גובה) ÷ 2 = (8 × 5) ÷ 2 = 40 ÷ 2 = 20 סמ״ר. את 40 סמ״ר מקבלים כששוכחים לחלק ב־2."]],
      [["A square has an area of 49 m². How long is each side?", "7 m", ["12.25 m", "24.5 m", "49 m"], "Area of a square = side × side, and 7 × 7 = 49, so each side is 7 m."],
        ["שטח ריבוע הוא 49 מ״ר. מה אורך כל צלע?", "7 מ׳", ["12.25 מ׳", "24.5 מ׳", "49 מ׳"], "שטח ריבוע = צלע × צלע, ו־7 × 7 = 49, ולכן כל צלע היא 7 מ׳."]],
    ],
    n: [
      [24, ["A parallelogram has a base of 6 m and a height of 4 m. What is its area?", "m²", "Area of a parallelogram = base × height = 6 × 4 = 24 m²."], ["למקבילית בסיס של 6 מ׳ וגובה של 4 מ׳. מה שטחה?", "מ״ר", "שטח מקבילית = בסיס × גובה = 6 × 4 = 24 מ״ר."]],
      [4, ["A rectangle has an area of 36 cm² and a length of 9 cm. How wide is it?", "cm", "Area = length × width, so width = area ÷ length = 36 ÷ 9 = 4 cm."], ["שטח מלבן הוא 36 סמ״ר ואורכו 9 ס״מ. מה רוחבו?", "ס״מ", "שטח = אורך × רוחב, ולכן רוחב = שטח ÷ אורך = 36 ÷ 9 = 4 ס״מ."]],
    ],
  },
  a: {
    t: [
      ["Circumference", "the perimeter of a circle: 2 × π × radius", "היקף המעגל", "אורך הקו שמקיף עיגול: 2 × π × רדיוס"],
      ["Circle area", "π times the radius squared: π × r²", "שטח העיגול", "פאי כפול רדיוס בריבוע: π × r²"],
      ["Trapezium", "a four-sided shape with one pair of parallel sides; area = (a + b) ÷ 2 × height", "טרפז", "מרובע עם זוג אחד של צלעות מקבילות; שטח = (a + b) ÷ 2 × גובה"],
      ["Composite shape", "a shape made of simpler shapes, whose area is found by adding or subtracting their areas", "צורה מורכבת", "צורה שבנויה מצורות פשוטות יותר, ומחשבים את שטחה בחיבור או בחיסור של שטחיהן"],
    ],
    q: [
      [["If you double the length and the width of a rectangle, its area becomes…", "4 times as large", ["2 times as large", "8 times as large", "the same"], "Both dimensions are multiplied by 2, so the area is multiplied by 2 × 2 = 4."],
        ["אם מכפילים פי 2 את האורך ואת הרוחב של מלבן, השטח שלו גדל…", "פי 4", ["פי 2", "פי 8", "לא משתנה"], "שני הממדים מוכפלים ב־2, ולכן השטח מוכפל ב־2 × 2 = 4."]],
      [["A trapezium has parallel sides of 6 cm and 10 cm and a height of 4 cm. What is its area?", "32 cm²", ["64 cm²", "40 cm²", "20 cm²"], "Take the average of the parallel sides and multiply by the height: (6 + 10) ÷ 2 × 4 = 8 × 4 = 32 cm². 64 cm² forgets to halve."],
        ["בטרפז הבסיסים הם 6 ס״מ ו־10 ס״מ והגובה 4 ס״מ. מה שטחו?", "32 סמ״ר", ["64 סמ״ר", "40 סמ״ר", "20 סמ״ר"], "מחשבים את הממוצע של הבסיסים וכופלים בגובה: (6 + 10) ÷ 2 × 4 = 8 × 4 = 32 סמ״ר. את 64 סמ״ר מקבלים כששוכחים לחלק ב־2."]],
      [["A 10 m by 8 m garden has a 2 m by 3 m pond in it. What is the area of the grass?", "74 m²", ["80 m²", "86 m²", "36 m²"], "Whole garden 10 × 8 = 80 m², minus the pond 2 × 3 = 6 m²: 80 − 6 = 74 m²."],
        ["בגינה של 10 מ׳ על 8 מ׳ יש בריכה של 2 מ׳ על 3 מ׳. מה שטח הדשא?", "74 מ״ר", ["80 מ״ר", "86 מ״ר", "36 מ״ר"], "כל הגינה 10 × 8 = 80 מ״ר, פחות הבריכה 2 × 3 = 6 מ״ר: 80 − 6 = 74 מ״ר."]],
    ],
    n: [[78.5, ["Using π ≈ 3.14, what is the area of a circle with radius 5 cm?", "cm²", "π × r² ≈ 3.14 × 5 × 5 = 3.14 × 25 = 78.5 cm².", "Square the radius first, then multiply by 3.14."], ["בעזרת π ≈ 3.14, מה שטח עיגול שרדיוסו 5 ס״מ?", "סמ״ר", "π × r² ≈ 3.14 × 5 × 5 = 3.14 × 25 = 78.5 סמ״ר.", "קודם מעלים את הרדיוס בריבוע, ואז כופלים ב־3.14."], 0.1]],
  },
};
export default c;
