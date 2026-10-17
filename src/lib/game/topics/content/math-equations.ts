import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Equation", "a statement that two expressions are equal, joined by an equals sign", "משוואה", "טענה ששני ביטויים שווים זה לזה, עם סימן שוויון ביניהם"],
      ["Variable", "a letter that stands for a number we do not know yet", "משתנה", "אות שמייצגת מספר שעדיין לא ידוע"],
      ["Solution", "the value of the unknown that makes the statement true", "פתרון", "הערך של הנעלם שהופך את הטענה לנכונה"],
      ["Inverse operation", "the operation that undoes another, like subtraction undoes addition", "פעולה הפוכה", "פעולה שמבטלת פעולה אחרת, כמו שחיסור מבטל חיבור"],
    ],
    q: [
      [["Solve: x + 5 = 12", "x = 7", ["x = 17", "x = 5", "x = 12"], "Subtract 5 from both sides: x = 12 − 5 = 7. Check: 7 + 5 = 12."],
        ["פתרו: x + 5 = 12", "x = 7", ["x = 17", "x = 5", "x = 12"], "מחסרים 5 משני האגפים: x = 12 − 5 = 7. בדיקה: 7 + 5 = 12."]],
      [["Which number makes 3 × ☐ = 18 true?", "6", ["15", "21", "54"], "18 ÷ 3 = 6, and 3 × 6 = 18."],
        ["איזה מספר מתאים לריבוע כדי ש־3 × ☐ = 18?", "6", ["15", "21", "54"], "18 ÷ 3 = 6, ואכן 3 × 6 = 18."]],
    ],
    n: [[9, ["Solve: y − 4 = 5. What is y?", "", "Add 4 to both sides: y = 5 + 4 = 9."], ["פתרו: y − 4 = 5. מהו y?", "", "מוסיפים 4 לשני האגפים: y = 5 + 4 = 9."]]],
  },
  i: {
    t: [
      ["Coefficient", "the number that multiplies a variable, like 4 in 4x", "מקדם", "המספר שכופל משתנה, כמו 4 ב־4x"],
      ["Like terms", "terms with the same variable part, like 3x and 5x, that can be added together", "איברים דומים", "איברים עם אותו חלק של משתנה, כמו 3x ו־5x, שאפשר לחבר יחד"],
      ["Both sides", "the two parts of an equation, to the left and to the right of the equals sign", "שני האגפים", "שני החלקים של משוואה, משמאל ומימין לסימן השוויון"],
      ["Check", "putting the answer back into the equation to see that both parts are equal", "בדיקה", "הצבה של התשובה במשוואה כדי לראות ששני הצדדים שווים"],
    ],
    q: [
      [["Solve: 2x + 3 = 11", "x = 4", ["x = 7", "x = 5.5", "x = 16"], "Subtract 3: 2x = 8. Divide by 2: x = 4. Check: 2 × 4 + 3 = 11."],
        ["פתרו: 2x + 3 = 11", "x = 4", ["x = 7", "x = 5.5", "x = 16"], "מחסרים 3: 2x = 8. מחלקים ב־2: x = 4. בדיקה: 2 × 4 + 3 = 11."]],
      [["Simplify: 3x + 5x − 2x", "6x", ["10x", "8x", "6"], "These are like terms: 3 + 5 − 2 = 6, so the result is 6x."],
        ["כנסו איברים דומים: 3x + 5x − 2x", "6x", ["10x", "8x", "6"], "אלה איברים דומים: 3 + 5 − 2 = 6, ולכן התוצאה היא 6x."]],
    ],
    n: [[5, ["Solve: 4x − 7 = 13. What is x?", "", "Add 7: 4x = 20. Divide by 4: x = 5."], ["פתרו: 4x − 7 = 13. מהו x?", "", "מוסיפים 7: 4x = 20. מחלקים ב־4: x = 5."]]],
    s: [[["Solving 3x + 2 = 14", "Write the equation: 3x + 2 = 14", "Subtract 2 from both sides: 3x = 12", "Divide both sides by 3: x = 4", "Check: 3 × 4 + 2 = 14"],
      ["פתרון 3x + 2 = 14", "כותבים את המשוואה: 3x + 2 = 14", "מחסרים 2 משני האגפים: 3x = 12", "מחלקים את שני האגפים ב־3: x = 4", "בודקים: 3 × 4 + 2 = 14"]]],
  },
  a: {
    t: [
      ["Distributive law", "a rule that multiplies a number into brackets: a(b + c) = ab + ac", "חוק הפילוג", "כלל שבו כופלים מספר בכל מה שבתוך הסוגריים: a(b + c) = ab + ac"],
      ["Identity", "an equation that is true for every value of the variable, like 2(x + 1) = 2x + 2", "זהות", "משוואה שנכונה לכל ערך של המשתנה, כמו 2(x + 1) = 2x + 2"],
      ["No solution", "the case where no value can make both sides equal, like x + 1 = x + 2", "אין פתרון", "מצב שבו שום ערך לא משווה בין שני הצדדים, כמו x + 1 = x + 2"],
      ["Isolating the variable", "moving everything else to the other side until the letter stands alone", "בידוד המשתנה", "העברה של כל השאר לצד השני עד שהאות נשארת לבד"],
    ],
    q: [
      [["Solve: 3(x − 2) = 2x + 5", "x = 11", ["x = 7", "x = 3", "x = −1"], "Open the brackets: 3x − 6 = 2x + 5. Subtract 2x: x − 6 = 5, so x = 11."],
        ["פתרו: 3(x − 2) = 2x + 5", "x = 11", ["x = 7", "x = 3", "x = −1"], "פותחים סוגריים: 3x − 6 = 2x + 5. מחסרים 2x: x − 6 = 5, ולכן x = 11."]],
      [["How many solutions does 2(x + 3) = 2x + 6 have?", "Infinitely many", ["Exactly one", "None", "Exactly two"], "Opening the brackets gives 2x + 6 = 2x + 6: both sides are always equal, so every number is a solution."],
        ["כמה פתרונות יש ל־2(x + 3) = 2x + 6?", "אינסוף", ["בדיוק אחד", "אין פתרון", "בדיוק שניים"], "פתיחת הסוגריים נותנת 2x + 6 = 2x + 6: שני הצדדים תמיד שווים, ולכן כל מספר הוא פתרון."]],
      [["Three consecutive whole numbers add up to 48. What is the smallest?", "15", ["16", "14", "12"], "Call them n, n + 1, n + 2: 3n + 3 = 48, so 3n = 45 and n = 15 (15 + 16 + 17 = 48)."],
        ["שלושה מספרים שלמים עוקבים מסתכמים ב־48. מהו הקטן ביותר?", "15", ["16", "14", "12"], "נקרא להם n, n + 1, n + 2: 3n + 3 = 48, לכן 3n = 45 ו־n = 15 (15 + 16 + 17 = 48)."]],
    ],
    n: [[2.5, ["Solve: 5 − 2x = 0. What is x?", "", "Add 2x: 5 = 2x, so x = 5 ÷ 2 = 2.5."], ["פתרו: 5 − 2x = 0. מהו x?", "", "מוסיפים 2x: 5 = 2x, ולכן x = 5 ÷ 2 = 2.5."]]],
  },
};
export default c;
