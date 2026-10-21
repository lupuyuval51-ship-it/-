import type { TopicContent } from "../types";

// Course "Fractions, decimals and percentages" (grades 5–6), chapter 4: adding and subtracting fractions and mixed numbers.
const c: TopicContent = {
  l: {
    en: {
      title: "Adding and subtracting fractions",
      text: [
        "When the denominators are equal, add or subtract only the numerators and keep the denominator: 2/7 + 3/7 = 5/7, because two sevenths and three sevenths are five sevenths. A common mistake is to add the denominators too — 2/7 + 3/7 is not 5/14.",
        "When the denominators are different, first give the fractions a common denominator, then add: 1/2 + 1/3 = 3/6 + 2/6 = 5/6. With mixed numbers, add wholes to wholes and fractions to fractions: 1 1/4 + 2 2/4 = 3 3/4. If the fraction part comes out 1 or more, take a whole out of it: 7/4 = 1 3/4.",
      ],
      example: "Example: a cake needs 3/4 cup of milk and there is only 1/3 cup in the fridge. How much is missing? Work out 3/4 − 1/3 with denominator 12: 9/12 − 4/12 = 5/12. 5/12 of a cup is missing — a little less than half a cup.",
      task: "Measure half a cup of water in a measuring cup (or an ordinary cup) and add a quarter of a cup more. How much water is there now? Write the exercise: 1/2 + 1/4 = x. Check with your eyes that the answer (3/4) looks right, then pour a quarter of a cup back out — how much is left?",
    },
    he: {
      title: "חיבור וחיסור שברים",
      text: [
        "כשהמכנים שווים, מחברים או מחסרים רק את המונים, והמכנה נשאר: 2/7 + 3/7 = 5/7, כי שתי שביעיות ועוד שלוש שביעיות הן חמש שביעיות. טעות נפוצה היא לחבר גם את המכנים — 2/7 + 3/7 אינו 5/14.",
        "כשהמכנים שונים, קודם מביאים למכנה משותף ואז מחברים: 1/2 + 1/3 = 3/6 + 2/6 = 5/6. במספרים מעורבים מחברים שלמים עם שלמים ושברים עם שברים: 1 1/4 + 2 2/4 = 3 3/4. אם חלק השבר יוצא 1 או יותר, מוציאים ממנו שלם: 7/4 = 1 3/4.",
      ],
      example: "דוגמה: לעוגה צריך 3/4 כוס חלב, ובמקרר יש רק 1/3 כוס. כמה חסר? מחשבים 3/4 − 1/3 עם מכנה 12: 9/12 − 4/12 = 5/12. חסרות 5/12 כוס — קצת פחות מחצי כוס.",
      task: "מדדו בכוס מדידה (או בכוס רגילה) חצי כוס מים, והוסיפו עוד רבע כוס. כמה מים יש עכשיו? כתבו את התרגיל: 1/2 + 1/4 = x. בדקו בעיניים שהתשובה (3/4) נראית נכונה, ואז שפכו רבע כוס בחזרה — כמה נשאר?",
    },
  },
  b: {
    t: [
      ["Sum", "the result of adding numbers together", "סכום", "התוצאה של חיבור מספרים"],
      ["Difference", "the result of subtracting one number from another", "הפרש", "התוצאה של חיסור מספר ממספר"],
    ],
    q: [
      [["What is 2/7 + 3/7?", "5/7", ["5/14", "6/7", "1/7"], "Same denominators: add the numerators, 2 + 3 = 5, and keep the sevenths: 5/7. Adding the denominators too (5/14) is the common mistake."],
        ["כמה זה 2/7 + 3/7?", "5/7", ["5/14", "6/7", "1/7"], "המכנים שווים: מחברים את המונים, 2 + 3 = 5, ומשאירים שביעיות: 5/7. חיבור גם של המכנים (5/14) הוא הטעות הנפוצה."]],
      [["What is 7/9 − 4/9?", "3/9", ["3/18", "11/9", "4/9"], "Same denominators: subtract the numerators, 7 − 4 = 3, and keep the ninths: 3/9, which can be simplified to 1/3."],
        ["כמה זה 7/9 − 4/9?", "3/9", ["3/18", "11/9", "4/9"], "המכנים שווים: מחסרים את המונים, 7 − 4 = 3, ומשאירים תשיעיות: 3/9, ואפשר לצמצם ל־1/3."]],
      [["What is 1/4 + 1/4?", "2/4", ["2/8", "1/8", "1/16"], "One quarter and one more quarter are two quarters: 1/4 + 1/4 = 2/4, which is one half. 2/8 is only 1/4 — no more than the first quarter alone, so it cannot be the sum."],
        ["כמה זה 1/4 + 1/4?", "2/4", ["2/8", "1/8", "1/16"], "רבע ועוד רבע הם שני רבעים: 1/4 + 1/4 = 2/4, וזה חצי. 2/8 הוא רק 1/4 — לא יותר מהרבע הראשון לבדו, ולכן הוא לא יכול להיות הסכום."]],
      [["A bottle is 5/6 full. Dana drinks 2/6 of the bottle. How full is it now?", "3/6", ["3/12", "2/6", "7/6"], "5/6 − 2/6 = 3/6: subtract the numerators and keep the sixths. 3/6 is half a bottle."],
        ["בקבוק מלא עד 5/6. דנה שותה 2/6 מהבקבוק. כמה מלא הבקבוק עכשיו?", "3/6", ["3/12", "2/6", "7/6"], "5/6 − 2/6 = 3/6: מחסרים את המונים ומשאירים שישיות. 3/6 הם חצי בקבוק."]],
      [["Which is equal to 1 − 3/8?", "5/8", ["2/8", "3/8", "4/8"], "One whole is 8/8. 8/8 − 3/8 = 5/8: from 8 equal parts, 3 were taken away and 5 are left."],
        ["למה שווה 1 − 3/8?", "5/8", ["2/8", "3/8", "4/8"], "שלם אחד הוא 8/8. 8/8 − 3/8 = 5/8: מתוך 8 חלקים שווים הורדנו 3, ונשארו 5."]],
    ],
    n: [
      [7, ["3/10 + 4/10 = x/10. What is the numerator?", "", "Same denominators, so add the numerators: 3 + 4 = 7 tenths, and the sum is 7/10."], ["3/10 + 4/10 = x/10. מהו המונה?", "", "המכנים שווים, ולכן מחברים את המונים: 3 + 4 = 7 עשיריות, והסכום הוא 7/10."]],
      [3, ["Tom ate 2/8 of a cake and Lia ate 3/8. How many eighths of the cake are left?", "", "Together they ate 2/8 + 3/8 = 5/8. A whole cake is 8/8, so 8/8 − 5/8 = 3/8 is left."], ["תום אכל 2/8 מעוגה וליה אכלה 3/8. כמה שמיניות מהעוגה נשארו?", "", "ביחד הם אכלו 2/8 + 3/8 = 5/8. עוגה שלמה היא 8/8, ולכן נשארו 8/8 − 5/8 = 3/8."]],
      [4, ["9/12 − 5/12 = x/12. What is the numerator?", "", "Same denominators, so subtract the numerators: 9 − 5 = 4, and the difference is 4/12 (which is 1/3)."], ["9/12 − 5/12 = x/12. מהו המונה?", "", "המכנים שווים, ולכן מחסרים את המונים: 9 − 5 = 4, וההפרש הוא 4/12 (שזה 1/3)."]],
    ],
  },
  i: {
    t: [
      ["Mixed number", "a whole number together with a part smaller than 1, like 2 2/5", "מספר מעורב", "מספר שלם יחד עם חלק קטן מ־1, כמו 2 2/5"],
      ["Regrouping", "changing a whole into equal parts so you can take some away, like 1 = 4/4", "פריטה", "החלפה של שלם בחלקים שווים כדי שאפשר יהיה לחסר, כמו 1 = 4/4"],
    ],
    q: [
      [["What is 1/2 + 1/4?", "3/4", ["2/6", "2/4", "1/6"], "Make the denominators the same: 1/2 = 2/4. Then 2/4 + 1/4 = 3/4. Adding tops and bottoms (2/6) gives less than the half you started with."],
        ["כמה זה 1/2 + 1/4?", "3/4", ["2/6", "2/4", "1/6"], "משווים מכנים: 1/2 = 2/4. אז 2/4 + 1/4 = 3/4. חיבור של המונים ושל המכנים (2/6) נותן פחות מהחצי שהיה בהתחלה."]],
      [["What is 1/3 + 1/6?", "3/6", ["2/9", "2/6", "1/9"], "1/3 = 2/6, so 2/6 + 1/6 = 3/6, which is one half. 2/9 comes from adding the tops and the bottoms."],
        ["כמה זה 1/3 + 1/6?", "3/6", ["2/9", "2/6", "1/9"], "1/3 = 2/6, ולכן 2/6 + 1/6 = 3/6, וזה חצי. 2/9 מתקבל כשמחברים את המונים ואת המכנים."]],
      [["What is 3/4 − 1/2?", "1/4", ["2/2", "2/4", "1/8"], "1/2 = 2/4, so 3/4 − 2/4 = 1/4. Subtracting top from top and bottom from bottom (2/2) gives a whole — far too much."],
        ["כמה זה 3/4 − 1/2?", "1/4", ["2/2", "2/4", "1/8"], "1/2 = 2/4, ולכן 3/4 − 2/4 = 1/4. חיסור של מונה ממונה ושל מכנה ממכנה (2/2) נותן שלם — הרבה יותר מדי."]],
      [["What is 2 1/5 + 1 3/5?", "3 4/5", ["3 4/10", "4 4/5", "2 4/5"], "Wholes with wholes: 2 + 1 = 3. Fifths with fifths: 1/5 + 3/5 = 4/5. Together: 3 4/5."],
        ["כמה זה 2 1/5 + 1 3/5?", "3 4/5", ["3 4/10", "4 4/5", "2 4/5"], "שלמים עם שלמים: 2 + 1 = 3. חמישיות עם חמישיות: 1/5 + 3/5 = 4/5. ביחד: 3 4/5."]],
      [["What is 2 − 1/4?", "1 3/4", ["1 1/4", "2 1/4", "1/4"], "Regroup one whole as 4/4: 2 = 1 4/4. Then 1 4/4 − 1/4 = 1 3/4."],
        ["כמה זה 2 − 1/4?", "1 3/4", ["1 1/4", "2 1/4", "1/4"], "פורטים שלם אחד ל־4/4: 2 = 1 4/4. אז 1 4/4 − 1/4 = 1 3/4."]],
    ],
    n: [
      [11, ["2/5 + 1/3 = x/15. What is the numerator?", "", "With denominator 15: 2/5 = 6/15 and 1/3 = 5/15. 6 + 5 = 11, so the sum is 11/15."], ["2/5 + 1/3 = x/15. מהו המונה?", "", "עם מכנה 15: 2/5 = 6/15 ו־1/3 = 5/15. 6 + 5 = 11, ולכן הסכום הוא 11/15."]],
      [7, ["Mia walked 2/3 km to school and then 1/2 km to the library. How many sixths of a km did she walk in all?", "", "2/3 km = 4/6 km and 1/2 km = 3/6 km, so 4/6 + 3/6 = 7/6 km, which is 1 1/6 km: 7 sixths of a kilometre."], ["מיה הלכה 2/3 ק״מ לבית הספר ואחר כך 1/2 ק״מ לספרייה. כמה שישיות ק״מ היא הלכה בסך הכול?", "", "2/3 ק״מ = 4/6 ק״מ ו־1/2 ק״מ = 3/6 ק״מ, ולכן 4/6 + 3/6 = 7/6 ק״מ, שזה 1 1/6 ק״מ: 7 שישיות של קילומטר."]],
      [4, ["3 1/2 − 1 5/6 = 1 x/6. What is x?", "", "3 1/2 = 3 3/6. You cannot take 5/6 from 3/6, so regroup: 3 3/6 = 2 9/6. Then 2 9/6 − 1 5/6 = 1 4/6."], ["3 1/2 − 1 5/6 = 1 x/6. מהו x?", "", "3 1/2 = 3 3/6. אי אפשר להוריד 5/6 מ־3/6, ולכן פורטים: 3 3/6 = 2 9/6. אז 2 9/6 − 1 5/6 = 1 4/6."]],
    ],
    s: [[["Adding fractions with different denominators", "Find a common denominator", "Expand each fraction to that denominator", "Add the numerators and keep the denominator", "Simplify the answer if you can"], ["חיבור שברים עם מכנים שונים", "מוצאים מכנה משותף", "מרחיבים כל שבר למכנה הזה", "מחברים את המונים ומשאירים את המכנה", "מצמצמים את התוצאה אם אפשר"]]],
  },
  a: {
    t: [
      ["Common multiple", "a number that two numbers both divide into, like 12 for 3 and 4", "כפולה משותפת", "מספר ששני מספרים מחלקים אותו, כמו 12 עבור 3 ו־4"],
      ["Inverse operations", "two operations that undo each other, like adding and subtracting", "פעולות הפוכות", "שתי פעולות שמבטלות זו את זו, כמו חיבור וחיסור"],
    ],
    q: [
      [["What is 5/6 − 1/4?", "7/12", ["4/2", "4/12", "2/12"], "Use 12: 5/6 = 10/12 and 1/4 = 3/12. 10/12 − 3/12 = 7/12. Subtracting tops and bottoms (4/2) would give 2, more than you started with."],
        ["כמה זה 5/6 − 1/4?", "7/12", ["4/2", "4/12", "2/12"], "משתמשים ב־12: 5/6 = 10/12 ו־1/4 = 3/12. 10/12 − 3/12 = 7/12. חיסור של מונים ושל מכנים (4/2) היה נותן 2, יותר ממה שהיה בהתחלה."]],
      [["Gal ran 1 2/3 km on Sunday and 2 1/2 km on Monday. How far did he run in all?", "4 1/6 km", ["3 3/5 km", "3 1/6 km", "4 5/6 km"], "Wholes: 1 + 2 = 3. Fractions with denominator 6: 2/3 + 1/2 = 4/6 + 3/6 = 7/6 = 1 1/6. In all: 3 + 1 1/6 = 4 1/6 km."],
        ["גל רץ 1 2/3 ק״מ ביום ראשון ו־2 1/2 ק״מ ביום שני. כמה הוא רץ בסך הכול?", "4 1/6 ק״מ", ["3 3/5 ק״מ", "3 1/6 ק״מ", "4 5/6 ק״מ"], "שלמים: 1 + 2 = 3. השברים עם מכנה 6: 2/3 + 1/2 = 4/6 + 3/6 = 7/6 = 1 1/6. בסך הכול: 3 + 1 1/6 = 4 1/6 ק״מ."]],
      [["Which fraction must be added to 3/8 to get 1/2?", "1/8", ["1/6", "5/8", "1/4"], "1/2 = 4/8, and 4/8 − 3/8 = 1/8. Check with the inverse operation: 3/8 + 1/8 = 4/8 = 1/2."],
        ["איזה שבר צריך להוסיף ל־3/8 כדי לקבל 1/2?", "1/8", ["1/6", "5/8", "1/4"], "1/2 = 4/8, ו־4/8 − 3/8 = 1/8. בודקים בפעולה ההפוכה: 3/8 + 1/8 = 4/8 = 1/2."]],
      [["Noa says that 1/2 + 1/3 = 2/5. What is wrong?", "The sum is 5/6, not 2/5", ["Nothing — she is right, it is 2/5", "The sum is 1/6: multiply the parts"], "2/5 is less than 1/2 alone, so it cannot be the sum. With 6 as the denominator: 3/6 + 2/6 = 5/6."],
        ["נועה אומרת ש־1/2 + 1/3 = 2/5. מה לא נכון?", "הסכום הוא 5/6, לא 2/5", ["הכול נכון — זה באמת 2/5", "הסכום הוא 1/6: צריך לכפול את החלקים"], "2/5 קטן מ־1/2 לבד, ולכן הוא לא יכול להיות הסכום. עם מכנה 6: 3/6 + 2/6 = 5/6."]],
      [["A rope is 5 m long. 1 3/4 m is cut off, then 2 1/2 m more. How much rope is left?", "3/4 m", ["1 1/4 m", "1/4 m", "1 3/4 m"], "Cut off in all: 1 3/4 + 2 1/2 = 1 3/4 + 2 2/4 = 3 5/4 = 4 1/4 m. Left: 5 − 4 1/4 = 3/4 m."],
        ["חבל אורכו 5 מטרים. חתכו ממנו 1 3/4 מ׳, ואחר כך עוד 2 1/2 מ׳. כמה חבל נשאר?", "3/4 מ׳", ["1 1/4 מ׳", "1/4 מ׳", "1 3/4 מ׳"], "חתכו בסך הכול: 1 3/4 + 2 1/2 = 1 3/4 + 2 2/4 = 3 5/4 = 4 1/4 מ׳. נשאר: 5 − 4 1/4 = 3/4 מ׳."]],
    ],
    n: [
      [17, ["2/3 + 3/4 = x/12. What is the numerator?", "", "With denominator 12: 2/3 = 8/12 and 3/4 = 9/12. 8 + 9 = 17, so the sum is 17/12 = 1 5/12."], ["2/3 + 3/4 = x/12. מהו המונה?", "", "עם מכנה 12: 2/3 = 8/12 ו־3/4 = 9/12. 8 + 9 = 17, ולכן הסכום הוא 17/12 = 1 5/12."]],
      [24, ["What is the smallest common multiple of 6 and 8?", "", "Multiples of 8: 8, 16, 24. The first one that 6 also divides is 24 (6 × 4 = 24), so 24 is the smallest common denominator for sixths and eighths."], ["מהי הכפולה המשותפת הקטנה ביותר של 6 ו־8?", "", "כפולות של 8: 8, 16, 24. הראשונה ש־6 מחלק גם אותה היא 24 (6 × 4 = 24), ולכן 24 הוא המכנה המשותף הקטן ביותר לשישיות ולשמיניות."]],
      [3, ["4 1/5 − 2 3/5 = 1 x/5. What is x?", "", "Regroup: 4 1/5 = 3 6/5. Then wholes 3 − 2 = 1 and fifths 6/5 − 3/5 = 3/5, so the answer is 1 3/5."], ["4 1/5 − 2 3/5 = 1 x/5. מהו x?", "", "פורטים: 4 1/5 = 3 6/5. אז השלמים 3 − 2 = 1 והחמישיות 6/5 − 3/5 = 3/5, ולכן התשובה היא 1 3/5."]],
    ],
  },
};
export default c;
