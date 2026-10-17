import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Pattern", "something that repeats or changes by a rule", "דפוס", "משהו שחוזר על עצמו או משתנה לפי כלל"],
      ["Sequence", "a list of numbers in a certain order", "סדרה", "רשימה של מספרים בסדר מסוים"],
      ["Term", "each number in a sequence", "איבר", "כל מספר בסדרה"],
      ["Rule", "the instruction that tells you how to get the next number", "כלל", "ההוראה שאומרת איך לקבל את המספר הבא"],
    ],
    q: [
      [["What comes next: 2, 4, 6, 8, …?", "10", ["9", "12", "16"], "The rule is “add 2”: 8 + 2 = 10."],
        ["מה בא אחר כך: 2, 4, 6, 8, …?", "10", ["9", "12", "16"], "הכלל הוא ״להוסיף 2״: 8 + 2 = 10."]],
      [["What comes next: 50, 45, 40, 35, …?", "30", ["25", "40", "34"], "The rule is “subtract 5”: 35 − 5 = 30."],
        ["מה בא אחר כך: 50, 45, 40, 35, …?", "30", ["25", "40", "34"], "הכלל הוא ״להחסיר 5״: 35 − 5 = 30."]],
    ],
  },
  i: {
    t: [
      ["Arithmetic sequence", "a sequence that adds the same number each time", "סדרה חשבונית", "סדרה שבה מוסיפים כל פעם אותו מספר"],
      ["Common difference", "the fixed amount added each step in an arithmetic sequence", "הפרש קבוע", "הכמות הקבועה שמוסיפים בכל צעד בסדרה חשבונית"],
      ["Geometric sequence", "a sequence that multiplies by the same number each time", "סדרה הנדסית", "סדרה שבה כופלים כל פעם באותו מספר"],
      ["Square numbers", "the sequence 1, 4, 9, 16, 25, …", "המספרים הריבועיים", "הסדרה 1, 4, 9, 16, 25, …"],
    ],
    q: [
      [["What comes next: 3, 6, 12, 24, …?", "48", ["30", "36", "27"], "Each term is doubled: 24 × 2 = 48."],
        ["מה בא אחר כך: 3, 6, 12, 24, …?", "48", ["30", "36", "27"], "כל איבר מוכפל ב־2: 24 × 2 = 48."]],
      [["What comes next: 1, 4, 9, 16, …?", "25", ["20", "23", "32"], "These are square numbers: 1², 2², 3², 4², so next is 5² = 25."],
        ["מה בא אחר כך: 1, 4, 9, 16, …?", "25", ["20", "23", "32"], "אלה מספרים ריבועיים: 1², 2², 3², 4², ולכן הבא הוא 5² = 25."]],
    ],
    n: [[23, ["The sequence 5, 8, 11, 14, … continues. What is the 7th term?", "", "Add 3 each time: 5, 8, 11, 14, 17, 20, 23."], ["הסדרה 5, 8, 11, 14, … ממשיכה. מהו האיבר השביעי?", "", "מוסיפים 3 בכל פעם: 5, 8, 11, 14, 17, 20, 23."]]],
  },
  a: {
    t: [
      ["nth term", "a formula that gives any term from its position n, like 3n + 2", "האיבר הכללי", "נוסחה שנותנת כל איבר לפי המקום שלו n, כמו 3n + 2"],
      ["Fibonacci sequence", "1, 1, 2, 3, 5, 8, … where each term is the sum of the two before it", "סדרת פיבונאצ׳י", "1, 1, 2, 3, 5, 8, … שבה כל איבר הוא סכום שני האיברים שלפניו"],
      ["Triangular numbers", "1, 3, 6, 10, 15, …, the dots that make growing triangles", "המספרים המשולשים", "1, 3, 6, 10, 15, …, מספרי הנקודות שיוצרות משולשים הולכים וגדלים"],
      ["Ratio of a geometric sequence", "the fixed number each term is multiplied by", "מנת הסדרה", "המספר הקבוע שבו כופלים כל איבר בסדרה הנדסית"],
    ],
    q: [
      [["What is the nth term of 4, 7, 10, 13, …?", "3n + 1", ["n + 3", "4n", "3n + 4"], "The difference is 3, so 3n; for n = 1, 3 + 1 = 4."],
        ["מהו האיבר הכללי של 4, 7, 10, 13, …?", "3n + 1", ["n + 3", "4n", "3n + 4"], "ההפרש הוא 3, ולכן 3n; עבור n = 1: 3 + 1 = 4."]],
      [["What comes next in the Fibonacci sequence 1, 1, 2, 3, 5, 8, 13, …?", "21", ["18", "26", "16"], "8 + 13 = 21."],
        ["מה בא אחר כך בסדרת פיבונאצ׳י 1, 1, 2, 3, 5, 8, 13, …?", "21", ["18", "26", "16"], "8 + 13 = 21."]],
      [["What is the 10th triangular number?", "55", ["45", "100", "50"], "1 + 2 + … + 10 = 10 × 11 ÷ 2 = 55."],
        ["מהו המספר המשולש העשירי?", "55", ["45", "100", "50"], "1 + 2 + … + 10 = 10 × 11 ÷ 2 = 55."]],
    ],
  },
};
export default c;
