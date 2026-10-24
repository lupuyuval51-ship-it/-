import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Multiplication", "adding equal groups quickly, like 3 groups of 4 making 12", "כפל", "חיבור מהיר של קבוצות שוות, כמו 3 קבוצות של 4 שהן יחד 12"],
      ["Array", "objects arranged in equal rows and columns, used to show a multiplication", "מערך", "עצמים מסודרים בשורות ובטורים שווים, שמראים תרגיל כפל"],
      ["Repeated addition", "adding the same number again and again, like 5 + 5 + 5", "חיבור חוזר", "חיבור של אותו מספר שוב ושוב, כמו 5 + 5 + 5"],
    ],
    q: [
      [["Which addition is the same as 4 × 3?", "3 + 3 + 3 + 3", ["4 + 4 + 4 + 4", "4 + 3", "3 + 4 + 3"], "4 × 3 means 4 groups of 3: 3 + 3 + 3 + 3 = 12. 4 + 4 + 4 + 4 is 4 groups of 4, which makes 16."],
        ["איזה תרגיל חיבור שווה ל־4 × 3?", "3 + 3 + 3 + 3", ["4 + 4 + 4 + 4", "4 + 3", "3 + 4 + 3"], "4 × 3 פירושו 4 קבוצות של 3: 3 + 3 + 3 + 3 = 12. התרגיל 4 + 4 + 4 + 4 הוא 4 קבוצות של 4, ויוצא 16."]],
      [["What is 5 × 6?", "30", ["35", "25", "11"], "Count in fives six times: 5, 10, 15, 20, 25, 30. 11 is 5 + 6, an addition, not a multiplication."],
        ["כמה זה 5 × 6?", "30", ["35", "25", "11"], "סופרים בקפיצות של 5 שש פעמים: 5, 10, 15, 20, 25, 30. המספר 11 הוא 5 + 6, חיבור ולא כפל."]],
      [["An array has 3 rows with 5 stars in each row. How many stars are there?", "15", ["18", "35", "8"], "3 rows of 5 is 3 × 5 = 15, the same as 5 + 5 + 5. 8 comes from adding 3 + 5 instead of multiplying."],
        ["במערך יש 3 שורות, ובכל שורה 5 כוכבים. כמה כוכבים יש?", "15", ["18", "35", "8"], "3 שורות של 5 הן 3 × 5 = 15, כמו 5 + 5 + 5. את 8 מקבלים אם מחברים 3 + 5 במקום לכפול."]],
      [["What is 10 × 7?", "70", ["17", "107", "710"], "Multiplying a whole number by 10 puts a 0 on its end: 7 tens are 70. 17 is 10 + 7."],
        ["כמה זה 10 × 7?", "70", ["17", "107", "710"], "כשכופלים מספר שלם ב־10 מוסיפים לו 0 בסוף: 7 עשרות הן 70. המספר 17 הוא 10 + 7."]],
      [["Which number is in the 2 times table?", "14", ["15", "21", "9"], "Every number in the 2 times table is even. 14 = 2 × 7, while 15, 21 and 9 are odd."],
        ["איזה מספר מופיע בלוח הכפל של 2?", "14", ["15", "21", "9"], "כל המספרים בכפולות של 2 הם זוגיים. 14 = 2 × 7, ואילו 15, 21 ו־9 הם אי־זוגיים."]],
    ],
    n: [
      [12, ["What is 6 × 2?", "", "6 × 2 means 6 groups of 2. Swapping the order gives 2 × 6, which is double 6: 6 + 6 = 12."],
        ["כמה זה 6 × 2?", "", "6 × 2 פירושו 6 קבוצות של 2. אם מחליפים את הסדר מקבלים 2 × 6, כלומר פעמיים 6: 6 + 6 = 12."]],
      [40, ["A hand has 5 fingers. How many fingers are there on 8 hands?", "", "8 × 5: count in fives eight times, 5, 10, 15, 20, 25, 30, 35, 40."],
        ["בכף יד יש 5 אצבעות. כמה אצבעות יש ב־8 כפות ידיים?", "", "8 × 5: סופרים בקפיצות של 5 שמונה פעמים, 5, 10, 15, 20, 25, 30, 35, 40."]],
    ],
    s: [[["Order these products from the smallest to the largest", "2 × 3", "5 × 2", "3 × 4", "10 × 2"],
      ["סדרו את המכפלות מהקטנה ביותר לגדולה ביותר", "2 × 3", "5 × 2", "3 × 4", "10 × 2"]]],
  },
  i: {
    t: [
      ["Product", "the answer you get when you multiply numbers", "מכפלה", "התוצאה שמקבלים כשכופלים מספרים"],
      ["Factor", "one of the numbers being multiplied; in 3 × 8 = 24, 3 and 8 are both of these", "גורם", "כל אחד מהמספרים שכופלים; ב־3 × 8 = 24 אלה 3 ו־8"],
      ["Multiple", "a number in a times table: 6, 12 and 18 are these for 6", "כפולה", "מספר שמופיע בלוח הכפל של מספר מסוים: 6, 12 ו־18 הם כאלה של 6"],
    ],
    q: [
      [["If you know that 3 × 8 = 24, which fact do you also know?", "8 × 3 = 24", ["8 × 4 = 24", "3 × 9 = 24", "8 + 3 = 24"], "Changing the order of the numbers in a multiplication does not change the product: 3 rows of 8 and 8 rows of 3 both make 24."],
        ["אם יודעים ש־3 × 8 = 24, איזו עובדה יודעים גם?", "8 × 3 = 24", ["8 × 4 = 24", "3 × 9 = 24", "8 + 3 = 24"], "שינוי סדר המספרים בכפל לא משנה את המכפלה: 3 שורות של 8 ו־8 שורות של 3 הן שתיהן 24."]],
      [["What is 9 × 7?", "63", ["56", "72", "16"], "Use the 9 trick: 10 × 7 = 70, then take away one 7: 70 − 7 = 63. 56 is 8 × 7 and 72 is 9 × 8."],
        ["כמה זה 9 × 7?", "63", ["56", "72", "16"], "משתמשים בטריק של 9: 10 × 7 = 70, ואז מורידים 7 אחד: 70 − 7 = 63. המספר 56 הוא 8 × 7, ו־72 הוא 9 × 8."]],
      [["Which number is in the 9 times table?", "54", ["64", "56", "39"], "54 = 9 × 6. In the 9 times table up to 9 × 10, the digits of each answer add up to 9: 5 + 4 = 9. The digits of 64, 56 and 39 do not."],
        ["איזה מספר מופיע בלוח הכפל של 9?", "54", ["64", "56", "39"], "54 = 9 × 6. בכפולות של 9 עד 9 × 10, סכום הספרות של כל תוצאה הוא 9: 5 + 4 = 9. אצל 64, 56 ו־39 זה לא כך."]],
      [["What is 6 × 7?", "42", ["48", "36", "13"], "6 × 7 is 5 × 7 = 35 plus one more 7: 35 + 7 = 42. 48 is 6 × 8 and 36 is 6 × 6."],
        ["כמה זה 6 × 7?", "42", ["48", "36", "13"], "6 × 7 הוא 5 × 7 = 35 ועוד 7 אחד: 35 + 7 = 42. המספר 48 הוא 6 × 8, ו־36 הוא 6 × 6."]],
      [["There are 4 tables with 6 chairs at each table. How many chairs are there?", "24", ["20", "28", "10"], "4 × 6 is double 2 × 6: 2 × 6 = 12, and 12 + 12 = 24. 10 comes from adding 4 + 6."],
        ["יש 4 שולחנות, וליד כל שולחן 6 כיסאות. כמה כיסאות יש?", "24", ["20", "28", "10"], "4 × 6 הוא פעמיים 2 × 6: 2 × 6 = 12, ו־12 + 12 = 24. את 10 מקבלים מ־4 + 6."]],
    ],
    n: [
      [32, ["What is 4 × 8?", "", "4 × 8 is double 2 × 8: 2 × 8 = 16 and 16 + 16 = 32."],
        ["כמה זה 4 × 8?", "", "4 × 8 הוא פעמיים 2 × 8: 2 × 8 = 16, ו־16 + 16 = 32."]],
      [8, ["x × 6 = 48. What is x?", "", "8 × 6 = 48, so x = 8. Counting in sixes also works: 6, 12, 18, 24, 30, 36, 42, 48 is 8 steps."],
        ["x × 6 = 48. מהו x?", "", "8 × 6 = 48, ולכן x = 8. אפשר גם לספור בקפיצות של 6: 6, 12, 18, 24, 30, 36, 42, 48 הם 8 קפיצות."]],
    ],
    s: [[["The finger trick for 9 × 4, in order", "Hold up all 10 fingers in front of you", "Fold down the 4th finger, counting from the left", "Count the fingers to the left of the folded one: 3 tens", "Count the fingers to the right of it: 6 ones", "Read the answer: 36"],
      ["טריק האצבעות ל־9 × 4, לפי הסדר", "מרימים את כל 10 האצבעות מולכם", "מקפלים את האצבע הרביעית, כשסופרים משמאל", "סופרים את האצבעות משמאל לאצבע המקופלת: 3 עשרות", "סופרים את האצבעות מימין לה: 6 יחידות", "קוראים את התשובה: 36"]]],
  },
  a: {
    t: [
      ["Square number", "the product of a whole number with itself, like 7 × 7 = 49", "מספר ריבועי", "מכפלה של מספר שלם בעצמו, כמו 7 × 7 = 49"],
      ["Multiplication grid", "a 10-by-10 table in which the box in row a and column b holds a × b", "לוח הכפל", "טבלה של 10 שורות ו־10 טורים, שבה בתא שבשורה a ובטור b רשום a × b"],
      ["Division fact", "a fact that undoes a times-table fact, like 56 ÷ 8 = 7 from 7 × 8 = 56", "תרגיל חילוק", "תרגיל שמבטל עובדת כפל, כמו 56 ÷ 8 = 7 מתוך 7 × 8 = 56"],
    ],
    q: [
      [["What is 7 × 8?", "56", ["54", "64", "15"], "Think 5, 6, 7, 8: 56 = 7 × 8. Or double 7 × 4: 28 + 28 = 56. 54 is 6 × 9 and 64 is 8 × 8."],
        ["כמה זה 7 × 8?", "56", ["54", "64", "15"], "חשבו על 5, 6, 7, 8: 56 = 7 × 8. או פעמיים 7 × 4: 28 + 28 = 56. המספר 54 הוא 6 × 9, ו־64 הוא 8 × 8."]],
      [["Which of these is a square number?", "81", ["18", "27", "50"], "81 = 9 × 9. 18 is 9 × 2 and 27 is 9 × 3, but none of 18, 27 and 50 is a whole number times itself."],
        ["איזה מהמספרים הוא מספר ריבועי?", "81", ["18", "27", "50"], "81 = 9 × 9. המספר 18 הוא 9 × 2 ו־27 הוא 9 × 3, אבל אף אחד מהמספרים 18, 27 ו־50 אינו מספר שלם כפול עצמו."]],
      [["You know that 6 × 8 = 48. How can you quickly find 12 × 8?", "Double 48 to get 96", ["Add 8 to 48 to get 56", "Add 6 to 48 to get 54", "Put a 0 on 48 to get 480"], "12 is double 6, so 12 × 8 is double 6 × 8: 48 + 48 = 96. Adding one more 8 only gives 7 × 8 = 56."],
        ["אתם יודעים ש־6 × 8 = 48. איך אפשר למצוא מהר את 12 × 8?", "להכפיל את 48 ולקבל 96", ["להוסיף 8 ל־48 ולקבל 56", "להוסיף 6 ל־48 ולקבל 54", "להוסיף 0 בסוף 48 ולקבל 480"], "12 הוא פעמיים 6, ולכן 12 × 8 הוא פעמיים 6 × 8: 48 + 48 = 96. הוספה של עוד 8 נותנת רק 7 × 8 = 56."]],
      [["Which product is NOT equal to 24?", "5 × 5", ["3 × 8", "4 × 6", "2 × 12"], "5 × 5 = 25, one more than 24. The others are all ways to make 24: 3 × 8, 4 × 6 and 2 × 12."],
        ["איזו מכפלה אינה שווה ל־24?", "5 × 5", ["3 × 8", "4 × 6", "2 × 12"], "5 × 5 = 25, אחד יותר מ־24. כל השאר הן דרכים לקבל 24: 3 × 8, 4 × 6 ו־2 × 12."]],
      [["Stickers come in sheets of 9. Tom has 7 sheets and gives away 15 stickers. How many stickers does he have left?", "48", ["63", "78", "22"], "First multiply: 7 sheets × 9 = 63 stickers. Then take away the 15 he gives: 63 − 15 = 48. 63 forgets the second step."],
        ["מדבקות נמכרות בדפים של 9. לתום יש 7 דפים, והוא נותן 15 מדבקות לחברים. כמה מדבקות נשארו לו?", "48", ["63", "78", "22"], "קודם כופלים: 7 דפים × 9 = 63 מדבקות. אחר כך מורידים את 15 המדבקות שנתן: 63 − 15 = 48. התשובה 63 שוכחת את השלב השני."]],
    ],
    n: [
      [72, ["What is 8 × 9?", "", "9 is 10 − 1, so 8 × 9 = 8 × 10 − 8 = 80 − 8 = 72."],
        ["כמה זה 8 × 9?", "", "8 × 9 = 8 × 10 − 8 = 80 − 8 = 72, כי 9 הוא 10 פחות 1."]],
      [6, ["54 ÷ x = 9. What is x?", "", "Use the times table: 9 × 6 = 54, so 54 ÷ 6 = 9 and x = 6."],
        ["54 ÷ x = 9. מהו x?", "", "נעזרים בלוח הכפל: 9 × 6 = 54, ולכן 54 ÷ 6 = 9 ו־x = 6."]],
    ],
    s: [
      [["From the smallest product to the largest (work each one out)", "6 × 7", "5 × 9", "8 × 6", "7 × 7", "8 × 7"],
        ["מהמכפלה הקטנה ביותר לגדולה ביותר (חשבו כל אחת)", "6 × 7", "5 × 9", "8 × 6", "7 × 7", "8 × 7"]],
    ],
  },
};
export default c;
