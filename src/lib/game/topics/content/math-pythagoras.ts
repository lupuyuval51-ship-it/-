import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Right triangle", "a triangle with one angle of exactly 90°", "משולש ישר־זווית", "משולש שאחת הזוויות שלו היא בדיוק 90°"],
      ["Hypotenuse", "the longest side of a right triangle, opposite the right angle", "יתר", "הצלע הארוכה ביותר במשולש ישר־זווית, שמול הזווית הישרה"],
      ["Legs", "the two shorter sides of a right triangle, which form the right angle", "ניצבים", "שתי הצלעות הקצרות במשולש ישר־זווית, שיוצרות את הזווית הישרה"],
      ["Square number", "a number multiplied by itself, like 9 = 3 × 3", "מספר ריבועי", "מספר שכופלים בעצמו, כמו 9 = 3 × 3"],
    ],
    q: [
      [["What is 5²?", "25", ["10", "7", "52"], "5² means 5 × 5 = 25."],
        ["כמה זה 5²?", "25", ["10", "7", "52"], "5² פירושו 5 × 5 = 25."]],
      [["In a right triangle, which side is always the longest?", "The hypotenuse", ["Either leg", "The base", "They are all equal"], "The side opposite the right angle (the biggest angle) is always the longest."],
        ["במשולש ישר־זווית, איזו צלע תמיד הכי ארוכה?", "היתר", ["אחד הניצבים", "הבסיס", "כולן שוות"], "הצלע שמול הזווית הישרה (הזווית הגדולה ביותר) היא תמיד הארוכה ביותר."]],
    ],
    n: [[7, ["What is the square root of 49?", "", "7 × 7 = 49, so √49 = 7."], ["מהו השורש הריבועי של 49?", "", "7 × 7 = 49, ולכן √49 = 7."]]],
  },
  i: {
    t: [
      ["Pythagorean theorem", "in a right triangle a² + b² = c², where c is the hypotenuse", "משפט פיתגורס", "במשולש ישר־זווית a² + b² = c², כאשר c הוא היתר"],
      ["Square root", "the number that, multiplied by itself, gives the original number", "שורש ריבועי", "המספר שאם כופלים אותו בעצמו מקבלים את המספר המקורי"],
      ["Pythagorean triple", "three whole numbers that fit a² + b² = c², like 3, 4, 5", "שלשה פיתגורית", "שלושה מספרים שלמים שמקיימים a² + b² = c², כמו 3, 4, 5"],
      ["Diagonal", "a line joining two opposite corners of a shape", "אלכסון", "קו שמחבר שני קודקודים נגדיים של צורה"],
    ],
    q: [
      [["A right triangle has legs 6 and 8. How long is the hypotenuse?", "10", ["14", "12", "48"], "6² + 8² = 36 + 64 = 100, and √100 = 10."],
        ["במשולש ישר־זווית הניצבים הם 6 ו־8. מה אורך היתר?", "10", ["14", "12", "48"], "6² + 8² = 36 + 64 = 100, ו־√100 = 10."]],
      [["Which set of side lengths makes a right triangle?", "5, 12, 13", ["4, 5, 6", "2, 3, 4", "6, 7, 8"], "5² + 12² = 25 + 144 = 169 = 13²."],
        ["אילו אורכי צלעות יוצרים משולש ישר־זווית?", "5, 12, 13", ["4, 5, 6", "2, 3, 4", "6, 7, 8"], "5² + 12² = 25 + 144 = 169 = 13²."]],
    ],
    n: [[12, ["A right triangle has hypotenuse 13 and one leg 5. How long is the other leg?", "", "13² − 5² = 169 − 25 = 144, and √144 = 12."], ["במשולש ישר־זווית היתר 13 וניצב אחד 5. מה אורך הניצב השני?", "", "13² − 5² = 169 − 25 = 144, ו־√144 = 12."]]],
  },
  a: {
    t: [
      ["Converse of Pythagoras", "if a² + b² = c² for the sides of a triangle, then it has a right angle", "המשפט ההפוך לפיתגורס", "אם בצלעות של משולש מתקיים a² + b² = c², אז יש בו זווית ישרה"],
      ["Distance formula", "the distance between two points: √((x₂ − x₁)² + (y₂ − y₁)²)", "נוסחת המרחק", "המרחק בין שתי נקודות: √((x₂ − x₁)² + (y₂ − y₁)²)"],
      ["Irrational number", "a number that cannot be written as a fraction, like √2", "מספר אי־רציונלי", "מספר שאי אפשר לכתוב כשבר, כמו √2"],
      ["Space diagonal", "the line through the inside of a box from one corner to the opposite corner", "אלכסון מרחבי", "הקו שעובר בתוך תיבה מקודקוד אחד לקודקוד הנגדי"],
    ],
    q: [
      [["What is the distance between the points (1, 2) and (4, 6)?", "5", ["7", "25", "3"], "Differences 3 and 4: √(3² + 4²) = √25 = 5."],
        ["מה המרחק בין הנקודות (1, 2) ו־(4, 6)?", "5", ["7", "25", "3"], "ההפרשים הם 3 ו־4: √(3² + 4²) = √25 = 5."]],
      [["A square has sides of 1 m. How long is its diagonal?", "√2 m, about 1.41 m", ["2 m", "1 m", "1.5 m exactly"], "1² + 1² = 2, so the diagonal is √2 ≈ 1.414 m."],
        ["לריבוע צלע של 1 מ׳. מה אורך האלכסון שלו?", "√2 מ׳, בערך 1.41 מ׳", ["2 מ׳", "1 מ׳", "1.5 מ׳ בדיוק"], "1² + 1² = 2, ולכן האלכסון הוא √2 ≈ 1.414 מ׳."]],
      [["A box is 3 × 4 × 12. How long is its space diagonal?", "13", ["19", "12", "15"], "Base diagonal √(9 + 16) = 5; then √(5² + 12²) = √169 = 13."],
        ["לתיבה ממדים 3 × 4 × 12. מה אורך האלכסון המרחבי?", "13", ["19", "12", "15"], "אלכסון הבסיס √(9 + 16) = 5; ואז √(5² + 12²) = √169 = 13."]],
    ],
  },
};
export default c;
