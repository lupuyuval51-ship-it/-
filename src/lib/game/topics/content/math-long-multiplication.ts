import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Product", "the result you get when you multiply two or more numbers", "מכפלה", "התוצאה שמקבלים כשכופלים שני מספרים או יותר"],
      ["Multiple of 10", "a whole number that ends in 0, like 30 or 450", "כפולה של 10", "מספר שלם שספרת היחידות שלו היא 0, כמו 30 או 450"],
      ["Place value", "what a digit is worth because of where it stands, like the 4 in 340 meaning 4 tens", "ערך המקום", "כמה שווה ספרה לפי המקום שבו היא עומדת, כמו 4 במספר 340 שפירושו 4 עשרות"],
    ],
    q: [
      [["What is 34 × 10?", "340", ["3,400", "344", "44"], "Multiplying by 10 moves every digit one place to the left: 3 tens become 3 hundreds and 4 ones become 4 tens, so 340. 3,400 is 34 × 100."],
        ["כמה זה 34 × 10?", "340", ["3,400", "344", "44"], "כפל ב־10 מזיז כל ספרה מקום אחד שמאלה: 3 עשרות הופכות ל־3 מאות ו־4 יחידות הופכות ל־4 עשרות, ולכן 340. המספר 3,400 הוא 34 × 100."]],
      [["What is 26 × 100?", "2,600", ["260", "26,000", "2,006"], "Multiplying by 100 moves every digit two places to the left, so 26 becomes 2,600. 260 is only 26 × 10."],
        ["כמה זה 26 × 100?", "2,600", ["260", "26,000", "2,006"], "כפל ב־100 מזיז כל ספרה שני מקומות שמאלה, ולכן 26 הופך ל־2,600. המספר 260 הוא רק 26 × 10."]],
      [["What is 7 × 1,000?", "7,000", ["700", "70,000", "1,007"], "7 thousands are 7,000: multiplying by 1,000 moves the digit three places to the left. 1,007 is 1,000 + 7."],
        ["כמה זה 7 × 1,000?", "7,000", ["700", "70,000", "1,007"], "7 אלפים הם 7,000: כפל ב־1,000 מזיז את הספרה שלושה מקומות שמאלה. המספר 1,007 הוא 1,000 + 7."]],
      [["What is 40 × 3?", "120", ["1,200", "12", "43"], "40 is 4 tens, and 4 tens × 3 = 12 tens = 120. 1,200 has one zero too many, and 12 has one too few."],
        ["כמה זה 40 × 3?", "120", ["1,200", "12", "43"], "40 הוא 4 עשרות, ו־4 עשרות × 3 = 12 עשרות = 120. ב־1,200 יש אפס אחד יותר מדי, וב־12 חסר אפס."]],
      [["Which is the same as 5 × 60?", "5 × 6 × 10", ["5 × 6 + 10", "5 × 6 × 100", "5 + 6 + 10"], "60 is 6 × 10, so 5 × 60 = 5 × 6 × 10 = 30 × 10 = 300. Adding 10 instead of multiplying by it gives only 40."],
        ["איזה תרגיל שווה ל־5 × 60?", "5 × 6 × 10", ["5 × 6 + 10", "5 × 6 × 100", "5 + 6 + 10"], "60 הוא 6 × 10, ולכן 5 × 60 = 5 × 6 × 10 = 30 × 10 = 300. אם מוסיפים 10 במקום לכפול בו, יוצא רק 40."]],
    ],
    n: [
      [4500, ["What is 45 × 100?", "", "Move each digit two places to the left: 45 × 100 = 4,500."],
        ["כמה זה 45 × 100?", "", "מזיזים כל ספרה שני מקומות שמאלה: 45 × 100 = 4,500."]],
      [800, ["What is 200 × 4?", "", "2 hundreds × 4 = 8 hundreds, so 200 × 4 = 800."],
        ["כמה זה 200 × 4?", "", "2 מאות × 4 = 8 מאות, ולכן 200 × 4 = 800."]],
    ],
    s: [[["Order these products from the smallest to the largest", "3 × 100", "40 × 10", "5 × 90", "2 × 1,000"],
      ["סדרו את המכפלות מהקטנה ביותר לגדולה ביותר", "3 × 100", "40 × 10", "5 × 90", "2 × 1,000"]]],
  },
  i: {
    t: [
      ["Grid method", "multiplying by splitting each number into tens and ones, multiplying the parts in a table and adding them up", "שיטת הטבלה", "כפל שבו מפרקים כל מספר לעשרות וליחידות, כופלים את החלקים בטבלה ומחברים את התוצאות"],
      ["Partial product", "one of the smaller multiplications inside a big one, like 20 × 7 inside 23 × 7", "מכפלה חלקית", "אחד מתרגילי הכפל הקטנים שבתוך תרגיל גדול, כמו 20 × 7 בתוך 23 × 7"],
      ["Partitioning", "splitting a number into parts by place value, like 47 = 40 + 7", "פירוק", "חלוקה של מספר לחלקים לפי ערך המקום, כמו 47 = 40 + 7"],
    ],
    q: [
      [["What is 23 × 4?", "92", ["82", "812", "27"], "Split 23 into 20 and 3: 20 × 4 = 80 and 3 × 4 = 12. Add the parts: 80 + 12 = 92. 812 just writes 8 and 12 side by side."],
        ["כמה זה 23 × 4?", "92", ["82", "812", "27"], "מפרקים את 23 ל־20 ול־3: 20 × 4 = 80 ו־3 × 4 = 12. מחברים: 80 + 12 = 92. המספר 812 רק כותב את 8 ואת 12 זה ליד זה."]],
      [["In the grid method for 36 × 5, which two parts do you add?", "150 and 30", ["15 and 30", "150 and 300", "35 and 11"], "36 = 30 + 6. The grid has 30 × 5 = 150 and 6 × 5 = 30, and 150 + 30 = 180. The answer 15 and 30 forgets that 30 × 5 is 150, not 15."],
        ["בשיטת הטבלה ל־36 × 5, אילו שני חלקים מחברים?", "150 ו־30", ["15 ו־30", "150 ו־300", "35 ו־11"], "36 = 30 + 6. בטבלה יש 30 × 5 = 150 ו־6 × 5 = 30, ו־150 + 30 = 180. התשובה 15 ו־30 שוכחת ש־30 × 5 הוא 150 ולא 15."]],
      [["What is 14 × 12?", "168", ["148", "128", "26"], "Grid: 10 × 10 = 100, 10 × 2 = 20, 4 × 10 = 40 and 4 × 2 = 8. All four parts add up to 168; leaving one part out gives 148 or 128."],
        ["כמה זה 14 × 12?", "168", ["148", "128", "26"], "בטבלה: 10 × 10 = 100, 10 × 2 = 20, 4 × 10 = 40 ו־4 × 2 = 8. ארבעת החלקים יחד הם 168; אם שוכחים חלק אחד מקבלים 148 או 128."]],
      [["Which estimate is best for 48 × 21?", "50 × 20 = 1,000", ["40 × 20 = 800", "50 × 30 = 1,500", "48 + 21 = 69"], "Round each number to the nearest ten: 48 is about 50 and 21 is about 20, so about 1,000. The exact answer is 1,008."],
        ["איזה אומדן הוא הטוב ביותר ל־48 × 21?", "50 × 20 = 1,000", ["40 × 20 = 800", "50 × 30 = 1,500", "48 + 21 = 69"], "מעגלים כל מספר לעשרת הקרובה: 48 הוא בערך 50 ו־21 הוא בערך 20, ולכן בערך 1,000. התשובה המדויקת היא 1,008."]],
      [["A bus has 52 seats. How many seats are there on 6 buses?", "312", ["302", "322", "58"], "50 × 6 = 300 and 2 × 6 = 12, so 52 × 6 = 312. 58 is 52 + 6, an addition."],
        ["באוטובוס יש 52 מושבים. כמה מושבים יש ב־6 אוטובוסים?", "312", ["302", "322", "58"], "50 × 6 = 300 ו־2 × 6 = 12, ולכן 52 × 6 = 312. המספר 58 הוא 52 + 6, חיבור."]],
    ],
    n: [
      [255, ["What is 17 × 15?", "", "Grid: 10 × 10 = 100, 10 × 5 = 50, 7 × 10 = 70 and 7 × 5 = 35. Total: 100 + 50 + 70 + 35 = 255."],
        ["כמה זה 17 × 15?", "", "בטבלה: 10 × 10 = 100, 10 × 5 = 50, 7 × 10 = 70 ו־7 × 5 = 35. יחד: 100 + 50 + 70 + 35 = 255."]],
      [3600, ["What is 40 × 90?", "", "4 × 9 = 36, and the two zeros make it 36 × 100 = 3,600."],
        ["כמה זה 40 × 90?", "", "4 × 9 = 36, ושני האפסים הופכים את זה ל־36 × 100 = 3,600."]],
    ],
    s: [[["Working out 34 × 26 with the grid method, in order", "Split 34 into 30 + 4 and 26 into 20 + 6", "Draw a grid with 30 and 4 on one side and 20 and 6 on the other", "Fill in each box: 30 × 20 = 600, 30 × 6 = 180, 4 × 20 = 80, 4 × 6 = 24", "Add the four parts: 600 + 180 + 80 + 24", "Write the answer: 884"],
      ["חישוב 34 × 26 בשיטת הטבלה, לפי הסדר", "מפרקים את 34 ל־30 + 4 ואת 26 ל־20 + 6", "משרטטים טבלה עם 30 ו־4 בצד אחד ועם 20 ו־6 בצד השני", "ממלאים כל תא: 30 × 20 = 600, 30 × 6 = 180, 4 × 20 = 80, 4 × 6 = 24", "מחברים את ארבעת החלקים: 600 + 180 + 80 + 24", "כותבים את התשובה: 884"]]],
  },
  a: {
    t: [
      ["Column multiplication", "a written method that multiplies by each digit in turn, writes one row for each digit and then adds the rows", "כפל במאונך", "דרך כתובה שבה כופלים בכל ספרה בתורה, כותבים שורה לכל ספרה ואז מחברים את השורות"],
      ["Estimate", "a rounded, quick answer used to see whether an exact answer is sensible", "אומדן", "תשובה מעוגלת ומהירה שבודקת אם התשובה המדויקת הגיונית"],
      ["Rounding", "replacing a number with a nearby round number, like 48 with 50", "עיגול", "החלפה של מספר במספר עגול קרוב, כמו 48 ב־50"],
    ],
    q: [
      [["In column multiplication of 47 × 36, why is there a 0 at the end of the second row?", "Because that row multiplies 47 by 30, not by 3", ["Because 47 × 3 always ends in a 0", "Because the first row ended in 0 as well", "Because you must always add a 0 when you multiply"], "The 3 in 36 means 3 tens. The second row is 47 × 30 = 1,410, so the 0 holds the ones place before the 141 is written."],
        ["בכפל במאונך של 47 × 36, למה יש 0 בסוף השורה השנייה?", "כי בשורה הזאת כופלים את 47 ב־30, ולא ב־3", ["כי 47 × 3 תמיד נגמר ב־0", "כי גם השורה הראשונה נגמרה ב־0", "כי תמיד צריך להוסיף 0 כשכופלים"], "הספרה 3 במספר 36 פירושה 3 עשרות. השורה השנייה היא 47 × 30 = 1,410, ולכן ה־0 שומר על מקום היחידות לפני שכותבים 141."]],
      [["What is 47 × 36?", "1,692", ["423", "1,410", "83"], "47 × 6 = 282 and 47 × 30 = 1,410. Add the rows: 282 + 1,410 = 1,692. 423 is what you get if you forget the 0 in the second row."],
        ["כמה זה 47 × 36?", "1,692", ["423", "1,410", "83"], "47 × 6 = 282 ו־47 × 30 = 1,410. מחברים את השורות: 282 + 1,410 = 1,692. את 423 מקבלים אם שוכחים את ה־0 בשורה השנייה."]],
      [["Ron worked out 312 × 19 and got 59,280. What does an estimate tell you?", "It is wrong: about 300 × 20 = 6,000, so the answer is near 6,000", ["It is wrong: about 300 × 20 = 600, so the answer is near 600", "It is right: 300 × 20 = 60,000, so a five-digit answer makes sense", "It is right, because a big number times a big number is always huge"], "Rounding gives 300 × 20 = 6,000, and the exact product is 5,928. 59,280 is ten times too big, so a 0 slipped in somewhere.", "Round each number to one digit and multiply: roughly how big should the answer be?"],
        ["רון חישב 312 × 19 וקיבל 59,280. מה אומר האומדן?", "שזה שגוי: 300 × 20 = 6,000, ולכן התשובה קרובה ל־6,000", ["שזה שגוי: 300 × 20 = 600, ולכן התשובה קרובה ל־600", "שזה נכון: 300 × 20 = 60,000, ולכן תשובה בת חמש ספרות הגיונית", "שזה נכון, כי מספר גדול כפול מספר גדול נותן תמיד מספר ענק"], "אחרי עיגול: 300 × 20 = 6,000, והמכפלה המדויקת היא 5,928. המספר 59,280 גדול פי 10 מדי, כלומר נכנס איפשהו 0 מיותר.", "עגלו כל מספר לספרה אחת וחשבו: בערך כמה אמורה להיות התשובה?"]],
      [["Which is the best estimate for 689 × 41?", "About 28,000", ["About 24,000", "About 2,800", "About 280,000"], "Round 689 to 700 and 41 to 40: 700 × 40 = 28,000. The exact product is 28,249, very close to it."],
        ["מהו האומדן הטוב ביותר ל־689 × 41?", "בערך 28,000", ["בערך 24,000", "בערך 2,800", "בערך 280,000"], "מעגלים את 689 ל־700 ואת 41 ל־40: 700 × 40 = 28,000. המכפלה המדויקת היא 28,249, קרובה מאוד."]],
      [["A cinema has 24 rows of 35 seats, and every seat is sold. How many people are watching?", "840", ["740", "820", "59"], "24 × 35 = 24 × 30 + 24 × 5 = 720 + 120 = 840. 59 is 24 + 35, an addition."],
        ["בקולנוע יש 24 שורות של 35 מושבים, וכל המושבים נמכרו. כמה אנשים צופים בסרט?", "840", ["740", "820", "59"], "24 × 35 = 24 × 30 + 24 × 5 = 720 + 120 = 840. המספר 59 הוא 24 + 35, חיבור."]],
    ],
    n: [
      [2108, ["What is 124 × 17?", "", "124 × 7 = 868 and 124 × 10 = 1,240. Add the rows: 868 + 1,240 = 2,108."],
        ["כמה זה 124 × 17?", "", "124 × 7 = 868 ו־124 × 10 = 1,240. מחברים את השורות: 868 + 1,240 = 2,108."]],
      [36000, ["What is 120 × 300?", "", "12 × 3 = 36, then add the three zeros: 120 × 300 = 36,000."],
        ["כמה זה 120 × 300?", "", "12 × 3 = 36, ואז מוסיפים את שלושת האפסים: 120 × 300 = 36,000."]],
    ],
    s: [[["Column multiplication of 53 × 24, in order", "Multiply 53 by the ones digit: 53 × 4 = 212", "Start the second row with a 0 in the ones place", "Multiply 53 by the 2 tens and write 106 in front of the 0: 1,060", "Add the two rows: 212 + 1,060 = 1,272", "Check with an estimate: 50 × 20 = 1,000, so 1,272 is sensible"],
      ["כפל במאונך של 53 × 24, לפי הסדר", "כופלים את 53 בספרת היחידות: 53 × 4 = 212", "מתחילים את השורה השנייה ב־0 במקום היחידות", "כופלים את 53 ב־2 העשרות וכותבים 106 משמאל ל־0: 1,060", "מחברים את שתי השורות: 212 + 1,060 = 1,272", "בודקים באומדן: 50 × 20 = 1,000, ולכן 1,272 הגיוני"]]],
  },
};
export default c;
