import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Greater than", "the sign > : the number on the left is bigger, as in 7 > 3", "גדול מ־", "סימן שכותבים בין שני מספרים כשהמספר שמשמאלו גדול יותר, כמו 7 > 3"],
      ["Less than", "the sign < : the number on the left is smaller, as in 2 < 9", "קטן מ־", "סימן שכותבים בין שני מספרים כשהמספר שמשמאלו קטן יותר, כמו 2 < 9"],
      ["Equal", "the sign = : both sides have the same value", "שווה", "הסימן = : לשני הצדדים אותו ערך"],
      ["Compare", "to decide which of two numbers is bigger or smaller", "השוואה", "החלטה איזה משני מספרים גדול יותר או קטן יותר"],
    ],
    q: [
      [["Which is true?", "8 > 5", ["8 < 5", "5 > 8", "8 = 5"], "8 is bigger than 5, and the wide side of > faces the bigger number."],
        ["מה נכון?", "8 > 5", ["8 < 5", "5 > 8", "8 = 5"], "8 גדול מ־5, והצד הפתוח של הסימן פונה למספר הגדול."]],
      [["Which is true about 0.5 and 0.25?", "0.5 > 0.25", ["0.25 > 0.5", "0.5 < 0.25", "0.5 = 0.25"], "0.5 = 0.50, and 50 hundredths are more than 25 hundredths, so 0.5 > 0.25. Comparing 25 with 5 is the trap."],
        ["מה נכון לגבי 0.5 ו־0.25?", "0.5 > 0.25", ["0.25 > 0.5", "0.5 < 0.25", "0.5 = 0.25"], "0.5 = 0.50, ו־50 מאיות הן יותר מ־25 מאיות, ולכן 0.5 > 0.25. ההשוואה בין 25 ל־5 היא המלכודת."]],
      [["Which number makes x > 7 true?", "9", ["7", "5", "0"], "x > 7 means bigger than 7, and 7 itself is not bigger than 7. Of these numbers only 9 fits."],
        ["איזה מספר הופך את x > 7 לנכון?", "9", ["7", "5", "0"], "הפירוש של x > 7 הוא גדול מ־7, ו־7 עצמו אינו גדול מ־7. מבין המספרים האלה רק 9 מתאים."]],
    ],
    s: [[["Order the numbers from the smallest to the largest", "19", "91", "109", "190"],
      ["סדרו את המספרים מהקטן ביותר לגדול ביותר", "19", "91", "109", "190"]]],
  },
  i: {
    t: [
      ["Inequality", "a statement that one side is greater or less than the other", "אי־שוויון", "טענה שצד אחד גדול מהצד השני או קטן ממנו"],
      ["At least (≥)", "greater than or equal to: x ≥ 12 means 12 or more, and 12 itself counts", "לפחות", "גדול או שווה: x ≥ 12 פירושו 12 או יותר, וגם 12 עצמו נחשב"],
      ["At most (≤)", "less than or equal to: x ≤ 12 means 12 or less, and 12 itself counts", "לכל היותר", "קטן או שווה: x ≤ 12 פירושו 12 או פחות, וגם 12 עצמו נחשב"],
      ["Solution set", "all the numbers that make an inequality true", "קבוצת הפתרונות", "כל המספרים שהופכים אי־שוויון לנכון"],
    ],
    q: [
      [["Solve: x + 4 > 10", "x > 6", ["x > 14", "x < 6", "x = 6"], "Subtract 4 from both sides: x > 6. Check with x = 7: 7 + 4 = 11, which is more than 10."],
        ["פתרו: x + 4 > 10", "x > 6", ["x > 14", "x < 6", "x = 6"], "מחסרים 4 משני האגפים: x > 6. בדיקה עם x = 7: 7 + 4 = 11, וזה יותר מ־10."]],
      [["“You must be at least 12 to enter.” Which inequality fits age a?", "a ≥ 12", ["a > 12", "a ≤ 12", "a < 12"], "At least 12 includes 12 itself: greater than or equal to."],
        ["״הכניסה מגיל 12 לפחות.״ איזה אי־שוויון מתאים לגיל a?", "a ≥ 12", ["a > 12", "a ≤ 12", "a < 12"], "לפחות 12 כולל גם את 12 עצמו: גדול או שווה."]],
      [["Solve: 3x ≤ 12", "x ≤ 4", ["x ≥ 4", "x ≤ 9", "x ≤ 36"], "Divide both sides by 3. Since 3 is positive, the sign stays the same: x ≤ 4. Only dividing by a negative number flips it."],
        ["פתרו: 3x ≤ 12", "x ≤ 4", ["x ≥ 4", "x ≤ 9", "x ≤ 36"], "מחלקים את שני האגפים ב־3. המספר 3 חיובי, ולכן כיוון הסימן לא משתנה: x ≤ 4. רק חילוק במספר שלילי הופך אותו."]],
      [["“This lift carries at most 600 kg.” Which inequality fits the load w, in kg?", "w ≤ 600", ["w < 600", "w ≥ 600", "w > 600"], "At most 600 means 600 or less, and exactly 600 kg is still allowed: less than or equal to."],
        ["״המעלית נושאת לכל היותר 600 ק״ג.״ איזה אי־שוויון מתאים למשקל w בק״ג?", "w ≤ 600", ["w < 600", "w ≥ 600", "w > 600"], "לכל היותר 600 פירושו 600 או פחות, ו־600 ק״ג בדיוק עדיין מותרים: קטן או שווה."]],
    ],
    n: [[4, ["What is the smallest whole number x with 3x > 10?", "", "Divide by 3: x > 10/3, which is about 3.33, so the smallest whole number is 4. 3 does not work, because 3 × 3 = 9 is not more than 10."],
      ["מהו המספר השלם הקטן ביותר x שמקיים 3x > 10?", "", "מחלקים ב־3: x > 10/3, כלומר בערך 3.33, ולכן המספר השלם הקטן ביותר הוא 4. המספר 3 לא מתאים, כי 3 × 3 = 9 אינו גדול מ־10."]]],
  },
  a: {
    t: [
      ["Reversing the sign", "multiplying or dividing an inequality by a negative number flips its direction", "היפוך כיוון הסימן", "כפל או חילוק של אי־שוויון במספר שלילי הופכים את כיוונו"],
      ["Compound inequality", "two inequalities together, like 2 < x ≤ 5", "אי־שוויון כפול", "שני אי־שוויונים יחד, כמו 2 < x ≤ 5"],
      ["Open circle", "on a number line, an empty dot showing the end value is not included", "עיגול ריק", "על ציר המספרים, נקודה ריקה שמראה שערך הקצה אינו כלול"],
      ["Closed circle", "on a number line, a filled dot showing the end value is included", "עיגול מלא", "על ציר המספרים, נקודה מלאה שמראה שערך הקצה כלול"],
    ],
    q: [
      [["Solve: −2x < 8", "x > −4", ["x < −4", "x > 4", "x < 4"], "Divide both sides by −2 and flip the sign: x > −4. Check with x = 0: −2 × 0 = 0, which is less than 8."],
        ["פתרו: −2x < 8", "x > −4", ["x < −4", "x > 4", "x < 4"], "מחלקים את שני האגפים ב־−2 והופכים את כיוון הסימן: x > −4. בדיקה עם x = 0: −2 × 0 = 0, וזה פחות מ־8."]],
      [["How many whole numbers satisfy 2 < x ≤ 5?", "3", ["4", "2", "5"], "They are 3, 4 and 5. 2 is not included, because x must be bigger than 2, but 5 is, because x may equal 5."],
        ["כמה מספרים שלמים מקיימים 2 < x ≤ 5?", "3", ["4", "2", "5"], "הם 3, 4 ו־5. המספר 2 אינו כלול, כי x צריך להיות גדול ממנו, אבל 5 כלול, כי x יכול להיות שווה ל־5."]],
      [["Solve: 5 − x ≥ 2", "x ≤ 3", ["x ≥ 3", "x ≥ −3", "x ≤ −3"], "Subtract 5: −x ≥ −3. Multiply by −1 and flip the sign: x ≤ 3. Check with x = 0: 5 − 0 = 5, which is at least 2."],
        ["פתרו: 5 − x ≥ 2", "x ≤ 3", ["x ≥ 3", "x ≥ −3", "x ≤ −3"], "מחסרים 5: −x ≥ −3. כופלים ב־−1 והופכים את כיוון הסימן: x ≤ 3. בדיקה עם x = 0: 5 − 0 = 5, וזה לפחות 2."]],
    ],
    n: [[5, ["How many whole numbers x satisfy −3 ≤ x < 2?", "", "They are −3, −2, −1, 0 and 1: that is 5 numbers. −3 is included because x may equal it, and 2 is not, because x must be less than 2."],
      ["כמה מספרים שלמים x מקיימים −3 ≤ x < 2?", "", "הם −3, −2, −1, 0 ו־1, כלומר 5 מספרים. המספר −3 כלול, כי x יכול להיות שווה לו, ו־2 אינו כלול, כי x צריך להיות קטן ממנו."]]],
  },
};
export default c;
