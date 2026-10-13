import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Power", "a short way to write repeated multiplication: 2³ = 2 × 2 × 2", "חזקה", "דרך קצרה לכתוב כפל חוזר: 2³ = 2 × 2 × 2"],
      ["Base", "the number being multiplied in a power: 5 in 5²", "בסיס", "המספר שכופלים בחזקה: 5 ב־5²"],
      ["Exponent", "the small raised number that says how many times to multiply: 2 in 5²", "מעריך", "המספר הקטן שלמעלה שאומר כמה פעמים לכפול: 2 ב־5²"],
      ["Squared", "multiplied by itself once: 4 squared is 16", "בריבוע", "מוכפל בעצמו פעם אחת: 4 בריבוע זה 16"],
    ],
    q: [
      [["What is 2³?", "8", ["6", "9", "5"], "2 × 2 × 2 = 8 (not 2 × 3)."],
        ["כמה זה 2³?", "8", ["6", "9", "5"], "2 × 2 × 2 = 8 (ולא 2 × 3)."]],
      [["What is 10²?", "100", ["20", "1,000", "12"], "10 × 10 = 100."],
        ["כמה זה 10²?", "100", ["20", "1,000", "12"], "10 × 10 = 100."]],
    ],
  },
  i: {
    t: [
      ["Square root", "the number that, multiplied by itself, gives the original: √36 = 6", "שורש ריבועי", "המספר שאם כופלים אותו בעצמו מקבלים את המספר המקורי: √36 = 6"],
      ["Cube", "a number to the power 3: 3 cubed is 27", "חזקה שלישית", "מספר בחזקת 3: 3 בחזקה שלישית זה 27"],
      ["Power of ten", "10 multiplied by itself, like 10³ = 1,000", "חזקה של 10", "10 שמוכפל בעצמו, כמו 10³ = 1,000"],
      ["Zero exponent", "any non-zero number to the power 0 equals 1", "חזקת אפס", "כל מספר שאינו אפס בחזקת 0 שווה ל־1"],
    ],
    q: [
      [["What is √81?", "9", ["40.5", "8", "27"], "9 × 9 = 81."],
        ["כמה זה √81?", "9", ["40.5", "8", "27"], "9 × 9 = 81."]],
      [["What is 7⁰?", "1", ["0", "7", "70"], "Any non-zero number to the power 0 is 1."],
        ["כמה זה 7⁰?", "1", ["0", "7", "70"], "כל מספר שאינו אפס בחזקת 0 שווה ל־1."]],
    ],
    n: [[64, ["What is 4³?", "", "4 × 4 × 4 = 16 × 4 = 64."], ["כמה זה 4³?", "", "4 × 4 × 4 = 16 × 4 = 64."]]],
  },
  a: {
    t: [
      ["Product rule", "multiplying powers of the same base adds the exponents: aᵐ × aⁿ = aᵐ⁺ⁿ", "כפל חזקות", "בכפל חזקות עם אותו בסיס מחברים את המעריכים: aᵐ × aⁿ = aᵐ⁺ⁿ"],
      ["Quotient rule", "dividing powers of the same base subtracts the exponents", "חילוק חזקות", "בחילוק חזקות עם אותו בסיס מחסרים את המעריכים"],
      ["Negative exponent", "a power with a negative exponent is one over the positive power: 2⁻³ = 1/8", "מעריך שלילי", "חזקה עם מעריך שלילי שווה לאחד חלקי החזקה החיובית: 2⁻³ = 1/8"],
      ["Power of a power", "raising a power to a power multiplies the exponents: (a²)³ = a⁶", "חזקה של חזקה", "העלאת חזקה בחזקה כופלת את המעריכים: (a²)³ = a⁶"],
    ],
    q: [
      [["Simplify 3⁴ × 3².", "3⁶", ["3⁸", "9⁶", "6⁶"], "Same base, so add the exponents: 4 + 2 = 6."],
        ["פשטו את 3⁴ × 3².", "3⁶", ["3⁸", "9⁶", "6⁶"], "אותו בסיס, ולכן מחברים מעריכים: 4 + 2 = 6."]],
      [["What is 2⁻²?", "1/4", ["−4", "−1/4", "4"], "2⁻² = 1/2² = 1/4."],
        ["כמה זה 2⁻²?", "1/4", ["−4", "−1/4", "4"], "2⁻² = 1/2² = 1/4."]],
      [["Between which two whole numbers is √50?", "7 and 8", ["6 and 7", "24 and 25", "8 and 9"], "7² = 49 and 8² = 64, and 50 is between them."],
        ["בין אילו שני מספרים שלמים נמצא √50?", "7 ו־8", ["6 ו־7", "24 ו־25", "8 ו־9"], "7² = 49 ו־8² = 64, ו־50 נמצא ביניהם."]],
    ],
  },
};
export default c;
