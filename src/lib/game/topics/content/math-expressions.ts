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
      [["If a = 4, what is a + 6?", "10", ["46", "24", "2"], "Put 4 in place of a: 4 + 6 = 10."],
        ["אם a = 4, כמה זה a + 6?", "10", ["46", "24", "2"], "מציבים 4 במקום a: 4 + 6 = 10."]],
      [["What does 3n mean?", "3 × n", ["3 + n", "30 + n", "n − 3"], "A number written next to a letter means they are multiplied."],
        ["מה פירוש 3n?", "3 × n", ["3 + n", "30 + n", "n − 3"], "מספר שכתוב צמוד לאות פירושו שהם מוכפלים."]],
    ],
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
    ],
    n: [[17, ["If x = 5, what is 4x − 3?", "", "4 × 5 − 3 = 20 − 3 = 17."], ["אם x = 5, כמה זה 4x − 3?", "", "4 × 5 − 3 = 20 − 3 = 17."]]],
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
      [["Factorise: x² − 25", "(x + 5)(x − 5)", ["(x − 5)²", "(x + 25)(x − 1)", "x(x − 25)"], "It is a difference of squares: x² − 5²."],
        ["פרקו לגורמים: x² − 25", "(x + 5)(x − 5)", ["(x − 5)²", "(x + 25)(x − 1)", "x(x − 25)"], "זה הפרש ריבועים: x² − 5²."]],
      [["Factorise: x² + 5x + 6", "(x + 2)(x + 3)", ["(x + 1)(x + 6)", "(x + 5)(x + 1)", "(x − 2)(x − 3)"], "Find two numbers that multiply to 6 and add to 5: 2 and 3."],
        ["פרקו לגורמים: x² + 5x + 6", "(x + 2)(x + 3)", ["(x + 1)(x + 6)", "(x + 5)(x + 1)", "(x − 2)(x − 3)"], "מחפשים שני מספרים שמכפלתם 6 וסכומם 5: 2 ו־3."]],
    ],
  },
};
export default c;
