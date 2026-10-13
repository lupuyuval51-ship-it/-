import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Greater than", "the sign > : the number on the left is bigger, as in 7 > 3", "גדול מ־", "הסימן > : המספר משמאל גדול יותר, כמו 7 > 3"],
      ["Less than", "the sign < : the number on the left is smaller, as in 2 < 9", "קטן מ־", "הסימן < : המספר משמאל קטן יותר, כמו 2 < 9"],
      ["Equal", "the sign = : both sides have the same value", "שווה", "הסימן = : לשני הצדדים אותו ערך"],
      ["Compare", "to decide which of two numbers is bigger or smaller", "השוואה", "החלטה איזה משני מספרים גדול יותר או קטן יותר"],
    ],
    q: [
      [["Which is true?", "8 > 5", ["8 < 5", "5 > 8", "8 = 5"], "8 is bigger than 5, and the wide side of > faces the bigger number."],
        ["מה נכון?", "8 > 5", ["8 < 5", "5 > 8", "8 = 5"], "8 גדול מ־5, והצד הפתוח של הסימן פונה למספר הגדול."]],
      [["Which sign makes 0.5 ☐ 0.25 true?", ">", ["<", "="], "0.5 = 0.50, which is more than 0.25."],
        ["איזה סימן הופך את 0.5 ☐ 0.25 לנכון?", ">", ["<", "="], "0.5 = 0.50, וזה יותר מ־0.25."]],
    ],
  },
  i: {
    t: [
      ["Inequality", "a statement that one side is greater or less than the other", "אי־שוויון", "טענה שצד אחד גדול מהצד השני או קטן ממנו"],
      ["At least (≥)", "greater than or equal to", "לפחות (≥)", "גדול או שווה"],
      ["At most (≤)", "less than or equal to", "לכל היותר (≤)", "קטן או שווה"],
      ["Solution set", "all the numbers that make an inequality true", "קבוצת הפתרונות", "כל המספרים שהופכים אי־שוויון לנכון"],
    ],
    q: [
      [["Solve: x + 4 > 10", "x > 6", ["x > 14", "x < 6", "x = 6"], "Subtract 4 from both sides: x > 6."],
        ["פתרו: x + 4 > 10", "x > 6", ["x > 14", "x < 6", "x = 6"], "מחסרים 4 משני האגפים: x > 6."]],
      [["“You must be at least 12 to enter.” Which inequality fits age a?", "a ≥ 12", ["a > 12", "a ≤ 12", "a < 12"], "At least 12 includes 12 itself: greater than or equal to."],
        ["״הכניסה מגיל 12 לפחות.״ איזה אי־שוויון מתאים לגיל a?", "a ≥ 12", ["a > 12", "a ≤ 12", "a < 12"], "לפחות 12 כולל גם את 12 עצמו: גדול או שווה."]],
    ],
  },
  a: {
    t: [
      ["Reversing the sign", "multiplying or dividing an inequality by a negative number flips its direction", "היפוך כיוון הסימן", "כפל או חילוק של אי־שוויון במספר שלילי הופכים את כיוונו"],
      ["Compound inequality", "two inequalities together, like 2 < x ≤ 5", "אי־שוויון כפול", "שני אי־שוויונים יחד, כמו 2 < x ≤ 5"],
      ["Open circle", "on a number line, an empty dot showing the end value is not included", "עיגול ריק", "על ציר המספרים, נקודה ריקה שמראה שערך הקצה אינו כלול"],
      ["Closed circle", "on a number line, a filled dot showing the end value is included", "עיגול מלא", "על ציר המספרים, נקודה מלאה שמראה שערך הקצה כלול"],
    ],
    q: [
      [["Solve: −2x < 8", "x > −4", ["x < −4", "x > 4", "x < 4"], "Divide by −2 and flip the sign: x > −4."],
        ["פתרו: −2x < 8", "x > −4", ["x < −4", "x > 4", "x < 4"], "מחלקים ב־−2 והופכים את כיוון הסימן: x > −4."]],
      [["How many whole numbers satisfy 2 < x ≤ 5?", "3", ["4", "2", "5"], "They are 3, 4 and 5 (2 is not included, 5 is)."],
        ["כמה מספרים שלמים מקיימים 2 < x ≤ 5?", "3", ["4", "2", "5"], "הם 3, 4 ו־5 (2 אינו כלול, 5 כן)."]],
    ],
  },
};
export default c;
