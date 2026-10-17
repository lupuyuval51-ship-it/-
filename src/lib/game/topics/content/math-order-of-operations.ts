import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Order of operations", "the agreed order for working out a calculation with several operations", "סדר פעולות חשבון", "הסדר המוסכם לחישוב תרגיל שיש בו כמה פעולות"],
      ["Brackets", "the signs ( ) that show which part to work out first", "סוגריים", "הסימנים ( ) שמראים איזה חלק מחשבים קודם"],
      ["Product", "the answer to a multiplication", "מכפלה", "התוצאה של תרגיל כפל"],
      ["Sum", "the answer to an addition", "סכום", "התוצאה של תרגיל חיבור"],
    ],
    q: [
      [["What is 2 + 3 × 4?", "14", ["20", "24", "9"], "Multiply before adding: 3 × 4 = 12, then 2 + 12 = 14."],
        ["כמה זה 2 + 3 × 4?", "14", ["20", "24", "9"], "כפל לפני חיבור: 3 × 4 = 12, ואז 2 + 12 = 14."]],
      [["What is (2 + 3) × 4?", "20", ["14", "24", "9"], "Brackets first: 2 + 3 = 5, then 5 × 4 = 20."],
        ["כמה זה (2 + 3) × 4?", "20", ["14", "24", "9"], "קודם הסוגריים: 2 + 3 = 5, ואז 5 × 4 = 20."]],
    ],
    n: [[7, ["What is 10 − 6 ÷ 2?", "", "Divide first: 6 ÷ 2 = 3, then 10 − 3 = 7."], ["כמה זה 10 − 6 ÷ 2?", "", "קודם חילוק: 6 ÷ 2 = 3, ואז 10 − 3 = 7."]]],
  },
  i: {
    t: [
      ["Left to right", "the rule for operations of equal rank, like several additions and subtractions", "משמאל לימין", "הכלל לפעולות מאותה דרגה, כמו כמה פעולות חיבור וחיסור"],
      ["Power", "a number multiplied by itself several times, like 2³ = 2 × 2 × 2", "חזקה", "מספר שכופלים בעצמו כמה פעמים, כמו 2³ = 2 × 2 × 2"],
      ["Expression", "numbers and operation signs written together, without an equals sign", "ביטוי", "מספרים וסימני פעולה שכתובים יחד, בלי סימן שוויון"],
      ["Quotient", "the answer to a division", "מנה", "התוצאה של תרגיל חילוק"],
    ],
    q: [
      [["What is 20 − 8 + 2?", "14", ["10", "30", "26"], "Addition and subtraction are worked left to right: 20 − 8 = 12, then 12 + 2 = 14."],
        ["כמה זה 20 − 8 + 2?", "14", ["10", "30", "26"], "חיבור וחיסור מחשבים משמאל לימין: 20 − 8 = 12, ואז 12 + 2 = 14."]],
      [["What is 3 + 2²?", "7", ["25", "10", "11"], "Powers come before addition: 2² = 4, then 3 + 4 = 7."],
        ["כמה זה 3 + 2²?", "7", ["25", "10", "11"], "חזקה לפני חיבור: 2² = 4, ואז 3 + 4 = 7."]],
    ],
    n: [[4, ["What is 24 ÷ 4 ÷ 2 + 1?", "", "Divide left to right: 24 ÷ 4 = 6, 6 ÷ 2 = 3, then 3 + 1 = 4."], ["כמה זה 24 ÷ 4 ÷ 2 + 1?", "", "מחלקים משמאל לימין: 24 ÷ 4 = 6, 6 ÷ 2 = 3, ואז 3 + 1 = 4."]]],
  },
  a: {
    t: [
      ["Nested brackets", "brackets inside brackets, worked out from the innermost outwards", "סוגריים מקוננים", "סוגריים בתוך סוגריים, שמחשבים מהפנימיים כלפי חוץ"],
      ["Fraction bar", "the line of a fraction, which acts like brackets around the top and the bottom", "קו השבר", "הקו של שבר, שפועל כמו סוגריים סביב המונה וסביב המכנה"],
      ["Negative base", "in (−3)² the minus is part of the base; in −3² it is not", "בסיס שלילי", "ב־(−3)² המינוס הוא חלק מהבסיס; ב־−3² הוא לא"],
      ["Commutative law", "for addition and multiplication, the order of the numbers does not change the result", "חוק החילוף", "בחיבור ובכפל, סדר המספרים לא משנה את התוצאה"],
    ],
    q: [
      [["What is −3²?", "−9", ["9", "−6", "6"], "The power applies only to 3: −(3²) = −9. With brackets, (−3)² = 9."],
        ["כמה זה −3²?", "−9", ["9", "−6", "6"], "החזקה חלה רק על 3: −(3²) = −9. עם סוגריים, (−3)² = 9."]],
      [["What is 2 × [10 − (3 + 1)²]?", "−12", ["12", "4", "8"], "Innermost first: 3 + 1 = 4, 4² = 16, 10 − 16 = −6, then 2 × (−6) = −12."],
        ["כמה זה 2 × [10 − (3 + 1)²]?", "−12", ["12", "4", "8"], "מבפנים החוצה: 3 + 1 = 4, 4² = 16, 10 − 16 = −6, ואז 2 × (−6) = −12."]],
      [["What is (8 + 4) / (5 − 2)?", "4", ["8.8", "12", "3"], "The fraction bar groups the top and the bottom: 12 ÷ 3 = 4."],
        ["כמה זה (8 + 4) / (5 − 2)?", "4", ["8.8", "12", "3"], "קו השבר מקבץ את המונה ואת המכנה: 12 ÷ 3 = 4."]],
    ],
  },
};
export default c;
