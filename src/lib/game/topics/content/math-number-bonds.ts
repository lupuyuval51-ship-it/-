import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Number bonds to 10", "pairs of whole numbers that add up to exactly 10, like 4 and 6", "חברים של 10", "זוגות של מספרים שלמים שסכומם בדיוק 10, כמו 4 ו־6"],
      ["Double", "a number added to itself, like 5 + 5 = 10", "תרגיל כפולים", "תרגיל שבו מחברים מספר לעצמו, כמו 5 + 5 = 10"],
      ["Sum", "the answer you get when you add numbers together", "סכום", "התוצאה שמקבלים כשמחברים מספרים"],
    ],
    q: [
      [["Which number goes with 7 to make 10?", "3", ["4", "2", "17"], "7 + 3 = 10, so 3 is the partner of 7. 4 is close, but 7 + 4 = 11, one too many."],
        ["איזה מספר משלים את 7 ל־10?", "3", ["4", "2", "17"], "7 + 3 = 10, ולכן 3 הוא ״החבר״ של 7. המספר 4 קרוב, אבל 7 + 4 = 11, אחד יותר מדי."]],
      [["What is 6 + 6?", "12", ["11", "13", "66"], "6 + 6 is a double: two groups of 6 make 12. 66 is just the two digits written side by side."],
        ["כמה זה 6 + 6?", "12", ["11", "13", "66"], "6 + 6 הוא תרגיל כפולים: שתי קבוצות של 6 הן 12. המספר 66 הוא רק שתי הספרות שנכתבו זו ליד זו."]],
      [["Which pair of numbers makes 10?", "2 and 8", ["4 and 5", "3 and 6", "1 and 10"], "2 + 8 = 10. The other pairs make 9, 9 and 11, so they are not number bonds to 10."],
        ["איזה זוג מספרים יוצר יחד 10?", "2 ו־8", ["4 ו־5", "3 ו־6", "1 ו־10"], "2 + 8 = 10. שאר הזוגות יוצרים 9, 9 ו־11, ולכן הם לא ״חברים של 10״."]],
      [["There are 10 birds on a fence and 4 fly away. How many birds are left?", "6", ["5", "7", "14"], "4 and 6 make 10, so taking 4 away from 10 leaves 6: 10 − 4 = 6. 14 is what you get by adding instead of taking away."],
        ["על גדר יושבות 10 ציפורים, ו־4 מהן עפות. כמה ציפורים נשארות?", "6", ["5", "7", "14"], "4 ו־6 יוצרים יחד 10, ולכן כשמורידים 4 מ־10 נשארים 6: 10 − 4 = 6. את 14 מקבלים אם מחברים במקום לחסר."]],
      [["Which of these is a double?", "4 + 4", ["4 + 5", "3 + 4", "4 − 4"], "A double adds a number to itself: 4 + 4 = 8. 4 + 5 is a near double, one more than 4 + 4."],
        ["איזה מהתרגילים הוא תרגיל כפולים?", "4 + 4", ["4 + 5", "3 + 4", "4 − 4"], "בתרגיל כפולים מחברים מספר לעצמו: 4 + 4 = 8. התרגיל 4 + 5 הוא ״כמעט כפולים״, אחד יותר מ־4 + 4."]],
    ],
    n: [
      [9, ["1 + x = 10. What is x?", "", "1 and 9 are number bonds to 10: 1 + 9 = 10, so x = 9."],
        ["1 + x = 10. מהו x?", "", "1 ו־9 הם ״חברים של 10״: 1 + 9 = 10, ולכן x = 9."]],
      [15, ["You have 10 stickers and get 5 more. How many stickers do you have now?", "", "10 + 5 = 15: a ten and five more ones make fifteen."],
        ["יש לכם 10 מדבקות ואתם מקבלים עוד 5. כמה מדבקות יש לכם עכשיו?", "", "10 + 5 = 15: עשרת אחת ועוד חמש יחידות הן חמש־עשרה."]],
    ],
    s: [[["Order these sums from the smallest answer to the largest", "2 + 1", "3 + 3", "5 + 4", "8 + 4"],
      ["סדרו את התרגילים מהתוצאה הקטנה ביותר לגדולה ביותר", "2 + 1", "3 + 3", "5 + 4", "8 + 4"]]],
  },
  i: {
    t: [
      ["Number bonds to 20", "pairs of whole numbers whose total is exactly 20, like 13 and 7", "חברים של 20", "זוגות של מספרים שלמים שסכומם בדיוק 20, כמו 13 ו־7"],
      ["Near double", "an addition of two numbers that are next to each other, like 4 + 5, solved with the help of a double", "כמעט כפולים", "תרגיל חיבור של שני מספרים עוקבים, כמו 4 + 5, שפותרים בעזרת תרגיל כפולים"],
      ["Bridging through 10", "adding in two jumps: first up to 10, then the rest, like 8 + 5 = 8 + 2 + 3", "השלמה לעשר", "חיבור בשתי קפיצות: קודם עד 10 ואחר כך השאר, כמו 8 + 5 = 8 + 2 + 3"],
      ["Difference", "how much bigger one number is than another, found by taking away", "הפרש", "בכמה מספר אחד גדול ממספר אחר; מוצאים אותו בחיסור"],
    ],
    q: [
      [["Which number goes with 13 to make 20?", "7", ["8", "6", "33"], "3 + 7 = 10, so 13 + 7 = 20. A bond to 10 becomes a bond to 20 when you add a ten. 33 comes from adding 13 + 20."],
        ["איזה מספר משלים את 13 ל־20?", "7", ["8", "6", "33"], "3 + 7 = 10, ולכן 13 + 7 = 20. ״חברים של 10״ הופכים ל״חברים של 20״ כשמוסיפים עשר. את 33 מקבלים מ־13 + 20."]],
      [["Which calculation gives the same answer as 6 + 7?", "6 + 6 + 1", ["7 + 7 + 1", "6 + 6 + 7", "6 + 1"], "7 is 6 + 1, so 6 + 7 = 6 + 6 + 1 = 12 + 1 = 13. 7 + 7 + 1 makes 15, two more than 13."],
        ["איזה תרגיל נותן אותה תוצאה כמו 6 + 7?", "6 + 6 + 1", ["7 + 7 + 1", "6 + 6 + 7", "6 + 1"], "7 הוא 6 + 1, ולכן 6 + 7 = 6 + 6 + 1 = 12 + 1 = 13. התרגיל 7 + 7 + 1 נותן 15, שניים יותר מ־13."]],
      [["What is 8 + 5? Use the 10 to help you.", "13", ["12", "14", "3"], "Split 5 into 2 and 3: 8 + 2 = 10, then 10 + 3 = 13. 3 is the difference between 8 and 5, not their sum."],
        ["כמה זה 8 + 5? היעזרו בעשר.", "13", ["12", "14", "3"], "מפרקים את 5 ל־2 ול־3: 8 + 2 = 10, ואז 10 + 3 = 13. המספר 3 הוא ההפרש בין 8 ל־5, ולא הסכום שלהם."]],
      [["What is 15 − 8?", "7", ["8", "6", "23"], "Take away 5 to reach 10, then 3 more: 15 − 5 = 10 and 10 − 3 = 7. Check: 7 + 8 = 15. 23 is 15 + 8."],
        ["כמה זה 15 − 8?", "7", ["8", "6", "23"], "מורידים 5 כדי להגיע ל־10, ועוד 3: 15 − 5 = 10 ו־10 − 3 = 7. בדיקה: 7 + 8 = 15. המספר 23 הוא 15 + 8."]],
      [["Which pair of numbers does NOT make 20?", "11 and 8", ["12 and 8", "14 and 6", "15 and 5"], "11 + 8 = 19, one short of 20. The other pairs all make 20: 12 + 8, 14 + 6 and 15 + 5."],
        ["איזה זוג מספרים לא יוצר יחד 20?", "11 ו־8", ["12 ו־8", "14 ו־6", "15 ו־5"], "11 + 8 = 19, אחד פחות מ־20. כל שאר הזוגות יוצרים 20: 12 + 8, 14 + 6 ו־15 + 5."]],
    ],
    n: [
      [9, ["A box holds 20 pencils. 11 are blue and the rest are red. How many pencils are red?", "", "11 + 9 = 20, so 9 pencils are red. Think: 1 + 9 = 10, so 11 + 9 = 20."],
        ["בקופסה יש 20 עפרונות. 11 מהם כחולים והשאר אדומים. כמה עפרונות אדומים?", "", "11 + 9 = 20, ולכן יש 9 עפרונות אדומים. חשבו: 1 + 9 = 10, ולכן 11 + 9 = 20."]],
      [17, ["What is 9 + 8?", "", "9 + 8 is a near double: 8 + 8 = 16, and one more makes 17."],
        ["כמה זה 9 + 8?", "", "9 + 8 הוא תרגיל ״כמעט כפולים״: 8 + 8 = 16, ועוד אחד הם 17."]],
    ],
    s: [[["Working out 7 + 6 by bridging through 10", "Start with the bigger number, 7", "Notice that 7 needs 3 more to make 10", "Split the 6 into 3 and 3", "Add the first 3: 7 + 3 = 10", "Add the other 3: 10 + 3 = 13"],
      ["פותרים את 7 + 6 בעזרת השלמה לעשר", "מתחילים מהמספר הגדול, 7", "שמים לב ש־7 צריך עוד 3 כדי להגיע ל־10", "מפרקים את 6 ל־3 ול־3", "מוסיפים את ה־3 הראשון: 7 + 3 = 10", "מוסיפים את ה־3 השני: 10 + 3 = 13"]]],
  },
  a: {
    t: [
      ["Fact family", "linked facts made from the same three numbers, like 6 + 9 = 15, 9 + 6 = 15, 15 − 9 = 6 and 15 − 6 = 9", "משפחת תרגילים", "תרגילים קשורים שבנויים מאותם שלושה מספרים, כמו 6 + 9 = 15, 9 + 6 = 15, 15 − 9 = 6 ו־15 − 6 = 9"],
      ["Inverse operation", "an operation that undoes another one, as taking away undoes adding", "פעולה הפוכה", "פעולה שמבטלת פעולה אחרת, כמו שחיסור מבטל חיבור"],
      ["Missing number", "an unknown number in a number sentence, often written as a letter such as x", "מספר חסר", "מספר לא ידוע בתרגיל, שלפעמים כותבים במקומו אות כמו x"],
    ],
    q: [
      [["Which fact is in the same family as 8 + 5 = 13?", "13 − 5 = 8", ["13 + 5 = 18", "8 − 5 = 3", "5 + 3 = 8"], "A fact family uses the same three numbers, here 5, 8 and 13: 13 − 5 = 8 undoes 8 + 5 = 13. 13 + 5 = 18 brings in a new number, 18."],
        ["איזה תרגיל שייך לאותה משפחה כמו 8 + 5 = 13?", "13 − 5 = 8", ["13 + 5 = 18", "8 − 5 = 3", "5 + 3 = 8"], "משפחת תרגילים בנויה מאותם שלושה מספרים, כאן 5, 8 ו־13: התרגיל 13 − 5 = 8 מבטל את 8 + 5 = 13. בתרגיל 13 + 5 = 18 מופיע מספר חדש, 18."]],
      [["Dana has 14 marbles. Yoni has 6 fewer than Dana. How many marbles do they have together?", "22", ["20", "8", "6"], "First find Yoni's marbles: 14 − 6 = 8. Then add both: 14 + 8 = 22. 20 comes from adding the 6 instead of Yoni's 8."],
        ["לדנה יש 14 גולות. ליוני יש 6 גולות פחות מלדנה. כמה גולות יש לשניהם יחד?", "22", ["20", "8", "6"], "קודם מוצאים כמה גולות יש ליוני: 14 − 6 = 8. אחר כך מחברים: 14 + 8 = 22. את 20 מקבלים אם מחברים את 6 במקום את 8 הגולות של יוני."]],
      [["Which calculation gives the same answer as 9 + 7?", "10 + 6", ["10 + 7", "9 + 6 + 2", "8 + 7"], "Move 1 from the 7 to the 9: 9 + 7 = 10 + 6 = 16. In 10 + 7 the 1 was added to the 9 but not taken from the 7, so it makes 17."],
        ["איזה תרגיל נותן אותה תוצאה כמו 9 + 7?", "10 + 6", ["10 + 7", "9 + 6 + 2", "8 + 7"], "מעבירים 1 מה־7 אל ה־9: 9 + 7 = 10 + 6 = 16. ב־10 + 7 הוסיפו 1 ל־9 אבל לא הורידו אותו מה־7, ולכן יוצא 17."]],
      [["Which number sentence is false?", "8 + 8 = 15", ["7 + 8 = 15", "9 + 6 = 15", "20 − 5 = 15"], "8 + 8 is a double and equals 16, not 15. The others are all true: 7 + 8 = 15, 9 + 6 = 15 and 20 − 5 = 15."],
        ["איזה מהתרגילים שגוי?", "8 + 8 = 15", ["7 + 8 = 15", "9 + 6 = 15", "20 − 5 = 15"], "8 + 8 הוא תרגיל כפולים ושווה 16, לא 15. כל השאר נכונים: 7 + 8 = 15, 9 + 6 = 15 ו־20 − 5 = 15."]],
      [["Two numbers add up to 20, and one of them is 4 more than the other. What are the numbers?", "8 and 12", ["10 and 10", "6 and 14", "4 and 16"], "Try pairs that make 20: 10 and 10 differ by 0, 9 and 11 by 2, and 8 and 12 by 4. So the numbers are 8 and 12."],
        ["סכומם של שני מספרים הוא 20, ואחד מהם גדול מהשני ב־4. מהם המספרים?", "8 ו־12", ["10 ו־10", "6 ו־14", "4 ו־16"], "בודקים זוגות שיוצרים 20: בין 10 ל־10 ההפרש הוא 0, בין 9 ל־11 הוא 2, ובין 8 ל־12 הוא 4. לכן המספרים הם 8 ו־12."]],
      [["Noa has 9 stickers and Ari has 15. How many more stickers does Ari have?", "6", ["7", "5", "24"], "Count up from 9 to 15: 1 to reach 10, then 5 more to reach 15, so 1 + 5 = 6. 24 is 9 + 15, the total, not the difference."],
        ["לנועה יש 9 מדבקות ולארי יש 15. בכמה מדבקות יש לארי יותר?", "6", ["7", "5", "24"], "סופרים מ־9 עד 15: 1 כדי להגיע ל־10, ועוד 5 כדי להגיע ל־15, כלומר 1 + 5 = 6. המספר 24 הוא 9 + 15, הסכום ולא ההפרש."]],
    ],
    n: [
      [7, ["x + 9 = 16. What is x?", "", "Undo the adding by taking away: 16 − 9 = 7. Check: 7 + 9 = 16."],
        ["x + 9 = 16. מהו x?", "", "מבטלים את החיבור בעזרת חיסור: 16 − 9 = 7. בדיקה: 7 + 9 = 16."]],
      [5, ["17 − x = 12. What is x?", "", "Count up from 12 to 17: that is 5 steps, so 17 − 5 = 12 and x = 5."],
        ["17 − x = 12. מהו x?", "", "סופרים מ־12 עד 17: אלה 5 צעדים, ולכן 17 − 5 = 12 ו־x = 5."]],
    ],
  },
};
export default c;
