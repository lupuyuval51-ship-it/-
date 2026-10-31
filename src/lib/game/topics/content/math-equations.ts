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
      [["Which number makes 3 × ☐ = 18 true?", "6", ["15", "21", "54"], "Undo the multiplication by dividing: 18 ÷ 3 = 6, and indeed 3 × 6 = 18. 15 is 18 − 3, which would undo an addition."],
        ["איזה מספר מתאים לריבוע כדי ש־3 × ☐ = 18?", "6", ["15", "21", "54"], "מבטלים את הכפל בעזרת חילוק: 18 ÷ 3 = 6, ואכן 3 × 6 = 18. המספר 15 הוא 18 − 3, וזה היה מבטל חיבור ולא כפל."]],
      [["Which equation has the solution x = 3?", "x + 4 = 7", ["x − 4 = 7", "x + 7 = 4", "4x = 7"], "Put 3 in place of x: 3 + 4 = 7 is true. In x − 4 = 7 you would get 3 − 4, which is not 7; 3 + 7 is 10, not 4; and 4 × 3 is 12, not 7."],
        ["לאיזו משוואה הפתרון הוא x = 3?", "x + 4 = 7", ["x − 4 = 7", "x + 7 = 4", "4x = 7"], "מציבים 3 במקום x: 3 + 4 = 7, וזה נכון. ב־x − 4 = 7 היינו מקבלים 3 − 4, וזה לא 7; 3 + 7 הוא 10 ולא 4; ו־4 × 3 הוא 12 ולא 7."]],
    ],
    n: [
      [9, ["Solve: y − 4 = 5. What is y?", "", "Undo the subtraction by adding 4 to both sides: y = 5 + 4 = 9. Check: 9 − 4 = 5."],
        ["פתרו: y − 4 = 5. מהו y?", "", "מבטלים את החיסור ומוסיפים 4 לשני האגפים: y = 5 + 4 = 9. בדיקה: 9 − 4 = 5."]],
      [12, ["Solve: x ÷ 4 = 3. What is x?", "", "Undo the division by multiplying both sides by 4: x = 3 × 4 = 12. Check: 12 ÷ 4 = 3."],
        ["פתרו: x ÷ 4 = 3. מהו x?", "", "מבטלים את החילוק וכופלים את שני האגפים ב־4: x = 3 × 4 = 12. בדיקה: 12 ÷ 4 = 3."]],
    ],
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
      [["Solve: 5x − 4 = 3x + 10", "x = 7", ["x = 3", "x = 1.75", "x = 14"], "Subtract 3x from both sides: 2x − 4 = 10. Add 4: 2x = 14. Divide by 2: x = 7. Check: 5 × 7 − 4 = 31 and 3 × 7 + 10 = 31."],
        ["פתרו: 5x − 4 = 3x + 10", "x = 7", ["x = 3", "x = 1.75", "x = 14"], "מחסרים 3x משני האגפים: 2x − 4 = 10. מוסיפים 4: 2x = 14. מחלקים ב־2: x = 7. בדיקה: 5 × 7 − 4 = 31 וגם 3 × 7 + 10 = 31."]],
    ],
    n: [[5, ["Solve: 4x − 7 = 13. What is x?", "", "Undo the subtraction first by adding 7: 4x = 20. Then divide both sides by 4: x = 5. Check: 4 × 5 − 7 = 13."],
      ["פתרו: 4x − 7 = 13. מהו x?", "", "קודם מבטלים את החיסור ומוסיפים 7: 4x = 20. אחר כך מחלקים את שני האגפים ב־4: x = 5. בדיקה: 4 × 5 − 7 = 13."]]],
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
      [["Which equation has no solution?", "2x + 1 = 2x + 5", ["2x = 0", "2(x + 1) = 2x + 2", "2x + 1 = x + 5"], "Subtracting 2x from both sides leaves 1 = 5, which is never true, so no number works. 2x = 0 does have a solution, x = 0, and 2(x + 1) = 2x + 2 is true for every x."],
        ["לאיזו משוואה אין פתרון?", "2x + 1 = 2x + 5", ["2x = 0", "2(x + 1) = 2x + 2", "2x + 1 = x + 5"], "חיסור של 2x משני האגפים משאיר 1 = 5, וזה אף פעם לא נכון, ולכן שום מספר לא מתאים. למשוואה 2x = 0 יש פתרון, x = 0, והמשוואה 2(x + 1) = 2x + 2 נכונה לכל x."]],
    ],
    n: [[2.5, ["Solve: 5 − 2x = 0. What is x?", "", "Add 2x to both sides: 5 = 2x. Divide by 2: x = 5 ÷ 2 = 2.5. Check: 5 − 2 × 2.5 = 0."],
      ["פתרו: 5 − 2x = 0. מהו x?", "", "מוסיפים 2x לשני האגפים: 5 = 2x. מחלקים ב־2: x = 5 ÷ 2 = 2.5. בדיקה: 5 − 2 × 2.5 = 0."]]],
  },
};
export default c;
