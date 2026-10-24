import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Partitioning", "splitting a number into parts that are easy to work with, like 36 = 30 + 6", "פירוק מספר", "חלוקה של מספר לחלקים שקל לחשב איתם, כמו 36 = 30 + 6"],
      ["Doubling", "multiplying a number by 2", "הכפלה", "כפל של מספר ב־2"],
      ["Halving", "dividing a number by 2 to get one of two equal parts", "חצייה", "חילוק של מספר ב־2, כדי לקבל אחד משני חלקים שווים"],
    ],
    q: [
      [["What is 34 + 25? Split the numbers to help you.", "59", ["69", "49", "9"], "Add the tens: 30 + 20 = 50. Add the ones: 4 + 5 = 9. Then 50 + 9 = 59."],
        ["כמה זה 34 + 25? פרקו את המספרים כדי להיעזר.", "59", ["69", "49", "9"], "מחברים את העשרות: 30 + 20 = 50. מחברים את היחידות: 4 + 5 = 9. ואז 50 + 9 = 59."]],
      [["What is double 35?", "70", ["60", "75", "37"], "Double the tens and the ones: double 30 is 60 and double 5 is 10, so 60 + 10 = 70."],
        ["כמה זה פעמיים 35?", "70", ["60", "75", "37"], "מכפילים את העשרות ואת היחידות: פעמיים 30 הם 60 ופעמיים 5 הם 10, ולכן 60 + 10 = 70."]],
      [["What is half of 48?", "24", ["22", "28", "96"], "Halve each part: half of 40 is 20 and half of 8 is 4, so 24. 96 is double 48, not half of it."],
        ["כמה זה חצי מ־48?", "24", ["22", "28", "96"], "חוצים כל חלק: חצי מ־40 הוא 20 וחצי מ־8 הוא 4, ולכן 24. המספר 96 הוא פעמיים 48, לא החצי."]],
      [["What is 47 + 9?", "56", ["57", "55", "38"], "Adding 9 is like adding 10 and then taking 1 away: 47 + 10 = 57, and 57 − 1 = 56. 57 forgets to take the 1 away.", "Add 10, then take 1 away."],
        ["כמה זה 47 + 9?", "56", ["57", "55", "38"], "להוסיף 9 זה כמו להוסיף 10 ואז להוריד 1: 47 + 10 = 57, ו־57 − 1 = 56. התשובה 57 שוכחת להוריד את ה־1.", "הוסיפו 10, ואז הורידו 1."]],
      [["What is 63 − 20?", "43", ["41", "61", "83"], "Taking away 20 takes 2 from the tens digit: 6 tens − 2 tens = 4 tens, so 63 − 20 = 43. 83 adds 20 instead of taking it away."],
        ["כמה זה 63 − 20?", "43", ["41", "61", "83"], "כשמורידים 20, ספרת העשרות קטנה ב־2: 6 עשרות פחות 2 עשרות הן 4 עשרות, ולכן 63 − 20 = 43. התשובה 83 מוסיפה 20 במקום להוריד."]],
    ],
    n: [
      [100, ["What is 25 + 75?", "", "The tens make 20 + 70 = 90 and the ones make 5 + 5 = 10, so 90 + 10 = 100."],
        ["כמה זה 25 + 75?", "", "העשרות נותנות 20 + 70 = 90 והיחידות נותנות 5 + 5 = 10, ולכן 90 + 10 = 100."]],
      [37, ["What is 52 − 15?", "", "Take away 10 to get 42, then take away 5 more to get 37."],
        ["כמה זה 52 − 15?", "", "מורידים 10 ומקבלים 42, ואז מורידים עוד 5 ומקבלים 37."]],
    ],
    s: [[["Finding 4 × 13 by doubling twice, in order", "Start with 13", "Double it once: 13 + 13 = 26", "Double it again: 26 + 26 = 52", "Check: 4 × 10 + 4 × 3 = 40 + 12 = 52"],
      ["מוצאים את 4 × 13 בעזרת שתי הכפלות, לפי הסדר", "מתחילים מ־13", "מכפילים פעם אחת: 13 + 13 = 26", "מכפילים שוב: 26 + 26 = 52", "בודקים: 4 × 10 + 4 × 3 = 40 + 12 = 52"]]],
  },
  i: {
    t: [
      ["Rounding and adjusting", "changing a number to a nearby easy one, calculating, then correcting the answer", "עיגול ותיקון", "החלפה של מספר במספר קרוב שקל לחשב איתו, חישוב, ואז תיקון של התוצאה"],
      ["Friendly number", "a number that is easy to calculate with, such as 10, 50 or 100", "מספר נוח", "מספר שקל מאוד לחשב איתו, כמו 10, 50 או 100"],
      ["Counting on", "finding a difference by counting up from the smaller number to the larger one", "ספירה קדימה", "מציאת הפרש בעזרת ספירה מהמספר הקטן ועד המספר הגדול"],
    ],
    q: [
      [["What is 46 + 39? Round 39 to 40 first.", "85", ["86", "87", "75"], "46 + 40 = 86, but 40 is 1 more than 39, so take 1 away: 85. 86 forgets to adjust, and 87 adjusts the wrong way."],
        ["כמה זה 46 + 39? עגלו קודם את 39 ל־40.", "85", ["86", "87", "75"], "46 + 40 = 86, אבל 40 גדול מ־39 ב־1, ולכן מורידים 1: 85. התשובה 86 שוכחת לתקן, ו־87 מתקנת לכיוון הלא נכון."]],
      [["What is 82 − 29?", "53", ["52", "51", "63"], "82 − 30 = 52. You took away 1 too many, so add it back: 52 + 1 = 53. Taking 1 more away instead gives 51, the wrong direction."],
        ["כמה זה 82 − 29?", "53", ["52", "51", "63"], "82 − 30 = 52. הורדתם 1 יותר מדי, ולכן מחזירים אותו: 52 + 1 = 53. אם מורידים עוד 1 במקום להחזיר, יוצא 51, תיקון לכיוון הלא נכון."]],
      [["A quick way to multiply a number by 5 is to…", "multiply it by 10 and then halve", ["multiply it by 10 and then double", "add 5 to it and then double", "halve it and then add 10"], "5 is half of 10, so × 5 is the same as × 10 and then ÷ 2. For example, 18 × 10 = 180 and half of 180 is 90, so 18 × 5 = 90."],
        ["דרך מהירה לכפול מספר ב־5 היא…", "לכפול אותו ב־10 ואז לחצות", ["לכפול אותו ב־10 ואז להכפיל", "להוסיף לו 5 ואז להכפיל", "לחצות אותו ואז להוסיף 10"], "5 הוא חצי מ־10, ולכן כפל ב־5 הוא כמו כפל ב־10 ואז חילוק ב־2. למשל, 18 × 10 = 180 וחצי מ־180 הוא 90, ולכן 18 × 5 = 90."]],
      [["What is 9 × 14?", "126", ["140", "136", "116"], "Multiply by 10 and take one 14 away: 140 − 14 = 126. 140 is 10 × 14, one 14 too many."],
        ["כמה זה 9 × 14?", "126", ["140", "136", "116"], "כופלים ב־10 ומורידים 14 אחד: 140 − 14 = 126. המספר 140 הוא 10 × 14, כלומר 14 אחד יותר מדי."]],
      [["Which calculation gives the same answer as 199 + 57?", "200 + 57 − 1", ["200 + 57 + 1", "200 + 50 − 1", "199 + 50 + 1"], "199 is 1 less than 200, so 199 + 57 = 200 + 57 − 1 = 256. Adding the 1 instead of taking it away gives 258."],
        ["איזה תרגיל נותן אותה תוצאה כמו 199 + 57?", "200 + 57 − 1", ["200 + 57 + 1", "200 + 50 − 1", "199 + 50 + 1"], "199 קטן מ־200 ב־1, ולכן 199 + 57 = 200 + 57 − 1 = 256. אם מוסיפים את ה־1 במקום להוריד אותו, יוצא 258."]],
    ],
    n: [
      [140, ["What is 28 × 5?", "", "28 × 10 = 280, and half of 280 is 140, so 28 × 5 = 140."],
        ["כמה זה 28 × 5?", "", "28 × 10 = 280, וחצי מ־280 הוא 140, ולכן 28 × 5 = 140."]],
      [603, ["What is 1,000 − 397?", "", "Take away 400 to get 600, then add back the extra 3 you took away: 603."],
        ["כמה זה 1,000 − 397?", "", "מורידים 400 ומקבלים 600, ואז מחזירים את 3 שהורדתם יותר מדי: 603."]],
    ],
    s: [[["Working out 63 − 28 by rounding and adjusting, in order", "Round 28 up to the friendly number 30", "Work out 63 − 30 = 33", "Notice that you took away 2 too many", "Add the 2 back: 33 + 2 = 35"],
      ["פותרים את 63 − 28 בעזרת עיגול ותיקון, לפי הסדר", "מעגלים את 28 כלפי מעלה למספר הנוח 30", "מחשבים 63 − 30 = 33", "שמים לב שהורדתם 2 יותר מדי", "מחזירים את ה־2: 33 + 2 = 35"]]],
  },
  a: {
    t: [
      ["Halving and doubling", "making a multiplication easier by halving one number and doubling the other, like 16 × 5 = 8 × 10", "חצייה והכפלה", "פישוט תרגיל כפל בעזרת חצייה של מספר אחד והכפלה של המספר האחר, כמו 16 × 5 = 8 × 10"],
      ["Quarter", "one of four equal parts; 25 is this part of 100", "רבע", "אחד מארבעה חלקים שווים; 25 הוא החלק הזה של 100"],
      ["Mental strategy", "a way of calculating in your head by changing a problem into easier steps", "אסטרטגיית חישוב", "דרך לחשב בראש על ידי הפיכת תרגיל לשלבים קלים יותר"],
    ],
    q: [
      [["What is 43 × 11?", "473", ["443", "463", "4,343"], "43 × 11 = 430 + 43 = 473. Shortcut: put the sum of the digits, 4 + 3 = 7, between them: 4, 7, 3."],
        ["כמה זה 43 × 11?", "473", ["443", "463", "4,343"], "43 × 11 = 430 + 43 = 473. קיצור דרך: כותבים את סכום הספרות, 4 + 3 = 7, בין שתי הספרות: 4, 7, 3."]],
      [["What is 68 × 11?", "748", ["648", "758", "6,148"], "6 + 8 = 14 is too big for one digit, so write 4 in the middle and carry 1 to the 6: 748. Check: 680 + 68 = 748."],
        ["כמה זה 68 × 11?", "748", ["648", "758", "6,148"], "6 + 8 = 14, יותר מספרה אחת, ולכן כותבים 4 באמצע ומעבירים 1 אל ה־6: 748. בדיקה: 680 + 68 = 748."]],
      [["What is 36 × 25?", "900", ["850", "720", "9,000"], "25 is a quarter of 100, so multiply by 100 and divide by 4: 36 × 100 = 3,600 and 3,600 ÷ 4 = 900. 720 is only 36 × 20."],
        ["כמה זה 36 × 25?", "900", ["850", "720", "9,000"], "25 הוא רבע מ־100, ולכן כופלים ב־100 ומחלקים ב־4: 36 × 100 = 3,600 ו־3,600 ÷ 4 = 900. המספר 720 הוא רק 36 × 20."]],
      [["Which calculation gives the same answer as 16 × 35?", "8 × 70", ["8 × 35", "32 × 70", "16 × 70 ÷ 4"], "Halve 16 and double 35: 8 × 70 = 560, the same as 16 × 35. Halving one number without doubling the other, as in 8 × 35, halves the answer too."],
        ["איזה תרגיל נותן אותה תוצאה כמו 16 × 35?", "8 × 70", ["8 × 35", "32 × 70", "16 × 70 ÷ 4"], "חוצים את 16 ומכפילים את 35: 8 × 70 = 560, בדיוק כמו 16 × 35. אם חוצים מספר אחד בלי להכפיל את השני, כמו ב־8 × 35, גם התוצאה נחצית."]],
      [["What is 99 × 7?", "693", ["700", "707", "683"], "99 × 7 = 100 × 7 − 7 = 700 − 7 = 693. Adding the 7 instead of taking it away gives 707."],
        ["כמה זה 99 × 7?", "693", ["700", "707", "683"], "99 × 7 = 100 × 7 − 7 = 700 − 7 = 693. אם מוסיפים את ה־7 במקום להוריד אותו, יוצא 707."]],
    ],
    n: [
      [1600, ["What is 64 × 25?", "", "64 × 100 = 6,400, and a quarter of 6,400 is 1,600."],
        ["כמה זה 64 × 25?", "", "64 × 100 = 6,400, ורבע מ־6,400 הוא 1,600."]],
      [252, ["What is 12 × 21?", "", "Split 21 into 20 + 1: 12 × 20 = 240 and 12 × 1 = 12, so 240 + 12 = 252."],
        ["כמה זה 12 × 21?", "", "מפרקים את 21 ל־20 + 1: 12 × 20 = 240 ו־12 × 1 = 12, ולכן 240 + 12 = 252."]],
    ],
    s: [[["Multiplying 18 × 25 in your head, in order", "Multiply 18 by 100: 1,800", "Halve it: 900", "Halve it again: 450", "Check: 10 × 25 + 8 × 25 = 250 + 200 = 450"],
      ["מחשבים 18 × 25 בראש, לפי הסדר", "כופלים את 18 ב־100: 1,800", "חוצים: 900", "חוצים שוב: 450", "בודקים: 10 × 25 + 8 × 25 = 250 + 200 = 450"]]],
  },
};
export default c;
