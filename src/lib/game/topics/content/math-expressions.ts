import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Algebra", "the part of maths that uses letters to stand for numbers", "אלגברה", "התחום במתמטיקה שמשתמש באותיות במקום מספרים"],
      ["Unknown", "a number we do not know yet, often written as a letter", "נעלם", "מספר שעדיין לא ידוע, ולרוב נכתב כאות"],
      ["Substitute", "to put a number in place of a letter", "להציב", "לשים מספר במקום אות"],
      ["Term (algebra)", "a single part of an expression, like 3x or 5", "איבר (באלגברה)", "חלק אחד בביטוי, כמו 3x או 5"],
    ],
    q: [
      [["If a = 4, what is a + 6?", "10", ["46", "24", "2"], "Put 4 in place of a: 4 + 6 = 10. The answer 46 just writes the digits side by side, and 24 multiplies instead of adding."],
        ["אם a = 4, כמה זה a + 6?", "10", ["46", "24", "2"], "מציבים 4 במקום a: 4 + 6 = 10. התשובה 46 רק מצמידה את הספרות זו לזו, ו־24 היא כפל במקום חיבור."]],
      [["What does 3n mean?", "3 × n", ["3 + n", "30 + n", "n − 3"], "A number written next to a letter means they are multiplied."],
        ["מה פירוש 3n?", "3 × n", ["3 + n", "30 + n", "n − 3"], "מספר שכתוב צמוד לאות פירושו שהם מוכפלים."]],
      [["If b = 3, what is 5b?", "15", ["53", "8", "2"], "5b means 5 × b, so 5 × 3 = 15. The answer 53 puts the digits side by side instead of multiplying them."],
        ["אם b = 3, כמה זה 5b?", "15", ["53", "8", "2"], "הביטוי 5b פירושו 5 × b, ולכן 5 × 3 = 15. התשובה 53 מצמידה את הספרות זו לזו במקום לכפול אותן."]],
    ],
    n: [[13, ["If n = 6, what is 2n + 1?", "", "2n means 2 × n, so 2 × 6 + 1 = 12 + 1 = 13. Multiply first, then add the 1."],
      ["אם n = 6, כמה זה 2n + 1?", "", "הביטוי 2n פירושו 2 × n, ולכן 2 × 6 + 1 = 12 + 1 = 13. קודם כופלים ואחר כך מוסיפים 1."]]],
  },
  i: {
    t: [
      ["Expression", "numbers, letters and operations without an equals sign, like 2x + 1", "ביטוי אלגברי", "מספרים, אותיות ופעולות בלי סימן שוויון, כמו 2x + 1"],
      ["Collecting like terms", "adding or subtracting terms with the same letter part", "כינוס איברים דומים", "חיבור או חיסור של איברים עם אותו חלק של אות"],
      ["Constant", "a term with no letter, whose value does not change", "איבר חופשי", "איבר בלי אות, שערכו לא משתנה"],
      ["Expand", "to multiply out brackets", "פתיחת סוגריים", "כפל של מה שבתוך הסוגריים"],
    ],
    q: [
      [["Simplify: 4a + 3b − a + 2b", "3a + 5b", ["8ab", "5a + 5b", "3a + b"], "a-terms: 4a − a = 3a; b-terms: 3b + 2b = 5b."],
        ["פשטו: 4a + 3b − a + 2b", "3a + 5b", ["8ab", "5a + 5b", "3a + b"], "איברי a: 4a − a = 3a; איברי b: 3b + 2b = 5b."]],
      [["Expand: 3(x + 4)", "3x + 12", ["3x + 4", "x + 12", "7x"], "Multiply each term inside by 3: 3 × x + 3 × 4."],
        ["פתחו סוגריים: 3(x + 4)", "3x + 12", ["3x + 4", "x + 12", "7x"], "כופלים כל איבר שבפנים ב־3: 3 × x + 3 × 4."]],
      [["Simplify: 2(x + 3) + 4x", "6x + 6", ["6x + 3", "8x + 6", "12x"], "Expand the brackets first: 2x + 6. Then collect the x-terms: 2x + 4x = 6x, giving 6x + 6."],
        ["פשטו: 2(x + 3) + 4x", "6x + 6", ["6x + 3", "8x + 6", "12x"], "קודם פותחים סוגריים: 2x + 6. אחר כך מכנסים את איברי x: 2x + 4x = 6x, ומקבלים 6x + 6."]],
    ],
    n: [[17, ["If x = 5, what is 4x − 3?", "", "Multiply first, then subtract: 4 × 5 − 3 = 20 − 3 = 17."], ["אם x = 5, כמה זה 4x − 3?", "", "קודם כופלים ואחר כך מחסרים: 4 × 5 − 3 = 20 − 3 = 17."]]],
  },
  a: {
    t: [
      ["Factorise", "to write an expression as a product, the reverse of expanding: 6x + 9 = 3(2x + 3)", "פירוק לגורמים", "כתיבת ביטוי כמכפלה, ההפך מפתיחת סוגריים: 6x + 9 = 3(2x + 3)"],
      ["Square of a sum", "(a + b)² = a² + 2ab + b²", "ריבוע סכום", "(a + b)² = a² + 2ab + b²"],
      ["Difference of squares", "a² − b² = (a + b)(a − b)", "הפרש ריבועים", "a² − b² = (a + b)(a − b)"],
      ["Quadratic expression", "an expression whose highest power of the letter is 2, like x² + 3x + 2", "ביטוי ריבועי", "ביטוי שהחזקה הגבוהה ביותר של האות בו היא 2, כמו x² + 3x + 2"],
    ],
    q: [
      [["Expand: (x + 3)²", "x² + 6x + 9", ["x² + 9", "x² + 3x + 9", "2x + 6"], "(a + b)² = a² + 2ab + b², so x² + 2·3·x + 9."],
        ["פתחו: (x + 3)²", "x² + 6x + 9", ["x² + 9", "x² + 3x + 9", "2x + 6"], "(a + b)² = a² + 2ab + b², ולכן x² + 2·3·x + 9."]],
      [["Factorise: x² − 25", "(x + 5)(x − 5)", ["(x − 5)²", "(x + 25)(x − 1)", "x(x − 25)"], "It is a difference of squares: x² − 5² = (x + 5)(x − 5). Check: expanding gives x² − 5x + 5x − 25 = x² − 25."],
        ["פרקו לגורמים: x² − 25", "(x + 5)(x − 5)", ["(x − 5)²", "(x + 25)(x − 1)", "x(x − 25)"], "זה הפרש ריבועים: x² − 5² = (x + 5)(x − 5). בדיקה: פתיחת הסוגריים נותנת x² − 5x + 5x − 25 = x² − 25."]],
      [["Factorise: x² + 5x + 6", "(x + 2)(x + 3)", ["(x + 1)(x + 6)", "(x + 5)(x + 1)", "(x − 2)(x − 3)"], "Find two numbers that multiply to 6 and add to 5: 2 and 3."],
        ["פרקו לגורמים: x² + 5x + 6", "(x + 2)(x + 3)", ["(x + 1)(x + 6)", "(x + 5)(x + 1)", "(x − 2)(x − 3)"], "מחפשים שני מספרים שמכפלתם 6 וסכומם 5: 2 ו־3."]],
      [["Expand: (x − 4)(x + 2)", "x² − 2x − 8", ["x² + 2x − 8", "x² − 6x − 8", "x² − 8"], "Multiply every term by every term: x·x + 2x − 4x − 8. The middle terms give 2x − 4x = −2x, so x² − 2x − 8."],
        ["פתחו: (x − 4)(x + 2)", "x² − 2x − 8", ["x² + 2x − 8", "x² − 6x − 8", "x² − 8"], "כופלים כל איבר בכל איבר: x·x + 2x − 4x − 8. האיברים האמצעיים נותנים 2x − 4x = −2x, ולכן x² − 2x − 8."]],
    ],
  },
};
export default c;
