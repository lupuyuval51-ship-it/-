import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Decimal point", "the dot that separates the whole number from the parts smaller than one", "נקודה עשרונית", "הנקודה שמפרידה בין המספר השלם לבין החלקים הקטנים מאחד"],
      ["Tenths", "the first place after the point: 0.1 is one tenth", "עשיריות", "המקום הראשון אחרי הנקודה: 0.1 הוא עשירית אחת"],
      ["Hundredths", "the second place after the point: 0.01 is one hundredth", "מאיות", "המקום השני אחרי הנקודה: 0.01 היא מאית אחת"],
      ["Whole number", "a number with no parts after the point, like 0, 1, 2 or 15", "מספר שלם", "מספר בלי חלקים אחרי הנקודה, כמו 0, 1, 2 או 15"],
    ],
    q: [
      [["Which is bigger: 0.5 or 0.45?", "0.5", ["0.45", "They are equal"], "0.5 = 0.50, and 50 hundredths is more than 45 hundredths."],
        ["מה גדול יותר: 0.5 או 0.45?", "0.5", ["0.45", "הם שווים"], "0.5 = 0.50, ו־50 מאיות זה יותר מ־45 מאיות."]],
      [["How is one half written as a decimal?", "0.5", ["0.2", "1.2", "0.05"], "One half is 5 tenths: 1/2 = 5/10 = 0.5. 0.05 is only 5 hundredths, and 1.2 is more than one whole."],
        ["איך כותבים חצי כמספר עשרוני?", "0.5", ["0.2", "1.2", "0.05"], "חצי הוא 5 עשיריות: 1/2 = 5/10 = 0.5. המספר 0.05 הוא רק 5 מאיות, ו־1.2 גדול משלם אחד."]],
      [["Which number has the digit 4 in the tenths place?", "2.45", ["2.54", "4.25", "42.5"], "The tenths place is the first digit after the point, and in 2.45 that digit is 4. In 2.54 the 4 is in the hundredths place, in 4.25 it is in the ones place and in 42.5 in the tens place."],
        ["באיזה מספר הספרה 4 נמצאת במקום העשיריות?", "2.45", ["2.54", "4.25", "42.5"], "מקום העשיריות הוא הספרה הראשונה אחרי הנקודה, וב־2.45 הספרה הזאת היא 4. ב־2.54 הספרה 4 נמצאת במקום המאיות, ב־4.25 במקום האחדות וב־42.5 במקום העשרות."]],
    ],
    n: [
      [4.5, ["What is 2.3 + 2.2?", "", "Add the tenths (3 + 2 = 5) and the wholes (2 + 2 = 4): 4.5."], ["כמה זה 2.3 + 2.2?", "", "מחברים עשיריות (3 + 2 = 5) ושלמים (2 + 2 = 4): 4.5."]],
      [2.2, ["What is 1.4 + 0.8?", "", "4 tenths + 8 tenths = 12 tenths, which is 1 whole and 2 tenths. With the 1 whole already there, 1.4 + 0.8 = 2.2, not 1.12."],
        ["כמה זה 1.4 + 0.8?", "", "4 עשיריות ועוד 8 עשיריות הן 12 עשיריות, כלומר שלם אחד ו־2 עשיריות. יחד עם השלם שכבר היה, 1.4 + 0.8 = 2.2, ולא 1.12."]],
    ],
  },
  i: {
    t: [
      ["Rounding", "replacing a number with a nearby simpler one, like 3.47 → 3.5", "עיגול", "החלפת מספר במספר קרוב ופשוט יותר, כמו 3.47 ← 3.5"],
      ["Place value", "the worth of a digit depending on where it stands", "ערך המקום", "השווי של ספרה לפי המקום שבו היא עומדת"],
      ["Thousandths", "the third place after the point: 0.001", "אלפיות", "המקום השלישי אחרי הנקודה: 0.001"],
      ["Equivalent decimal", "the same value written with extra zeros at the end, like 0.7 and 0.70", "מספר עשרוני שקול", "אותו ערך שנכתב עם אפסים נוספים בסוף, כמו 0.7 ו־0.70"],
    ],
    q: [
      [["What is 3.6 × 10?", "36", ["3.60", "0.36", "360"], "Multiplying by 10 moves every digit one place to the left: 36."],
        ["כמה זה 3.6 × 10?", "36", ["3.60", "0.36", "360"], "כפל ב־10 מזיז כל ספרה מקום אחד שמאלה: 36."]],
      [["Round 7.85 to one decimal place.", "7.9", ["7.8", "8.0", "7.85"], "The next digit is 5, so round up: 7.85 → 7.9."],
        ["עגלו את 7.85 לספרה אחת אחרי הנקודה.", "7.9", ["7.8", "8.0", "7.85"], "הספרה הבאה היא 5, ולכן מעגלים כלפי מעלה: 7.85 ← 7.9."]],
      [["Which number lies between 0.3 and 0.4?", "0.35", ["0.45", "0.035", "3.5"], "Write them as hundredths: 0.3 = 0.30 and 0.4 = 0.40, and 0.35 lies between 30 and 40 hundredths. 0.035 has more digits but is smaller than 0.3, and 0.45 is bigger than 0.4."],
        ["איזה מספר נמצא בין 0.3 ל־0.4?", "0.35", ["0.45", "0.035", "3.5"], "כותבים אותם במאיות: 0.3 = 0.30 ו־0.4 = 0.40, והמספר 0.35 נמצא בין 30 ל־40 מאיות. במספר 0.035 יש יותר ספרות, אבל הוא קטן מ־0.3, והמספר 0.45 גדול מ־0.4."]],
    ],
    n: [
      [1.25, ["What is 5 − 3.75?", "", "Write 5 as 5.00 so that both numbers have hundredths: 5.00 − 3.75 = 1.25. Check: 3.75 + 1.25 = 5."],
        ["כמה זה 5 − 3.75?", "", "כותבים את 5 בתור 5.00, כדי שלשני המספרים יהיו מאיות: 5.00 − 3.75 = 1.25. בדיקה: 3.75 + 1.25 = 5."]],
      [45, ["What is 0.45 × 100?", "", "Multiplying by 100 moves every digit two places to the left: 0.45 × 100 = 45."],
        ["כמה זה 0.45 × 100?", "", "כפל ב־100 מזיז כל ספרה שני מקומות שמאלה: 0.45 × 100 = 45."]],
    ],
  },
  a: {
    t: [
      ["Recurring decimal", "a decimal in which digits repeat for ever, like 1/3 = 0.333…", "שבר עשרוני מחזורי", "מספר עשרוני שבו ספרות חוזרות בלי סוף, כמו 1/3 = 0.333…"],
      ["Terminating decimal", "a decimal that ends, like 1/8 = 0.125", "שבר עשרוני סופי", "מספר עשרוני שנגמר, כמו 1/8 = 0.125"],
      ["Significant figures", "the digits that carry meaning in a measurement, starting from the first non-zero digit", "ספרות משמעותיות", "הספרות שנושאות משמעות במדידה, החל מהספרה הראשונה שאינה אפס"],
      ["Scientific notation", "writing a number as a value of at least 1 but less than 10 times a power of ten, like 3 × 10⁸", "כתיב מדעי", "כתיבת מספר כערך שהוא לפחות 1 וקטן מ־10, כפול חזקה של עשר, כמו 3 × 10⁸"],
    ],
    q: [
      [["What is 0.2 × 0.3?", "0.06", ["0.6", "0.5", "6"], "2 × 3 = 6, and there are two decimal places in total: 0.06."],
        ["כמה זה 0.2 × 0.3?", "0.06", ["0.6", "0.5", "6"], "2 × 3 = 6, ויש בסך הכול שתי ספרות אחרי הנקודה: 0.06."]],
      [["Which fraction gives a recurring decimal?", "1/6", ["1/4", "1/5", "1/8"], "A fraction in lowest terms terminates only if its denominator has no prime factors other than 2 and 5; 6 = 2 × 3, so 1/6 = 0.1666…"],
        ["איזה שבר נותן מספר עשרוני מחזורי?", "1/6", ["1/4", "1/5", "1/8"], "שבר מצומצם הוא סופי רק אם במכנה אין גורמים ראשוניים מלבד 2 ו־5; 6 = 2 × 3, ולכן 1/6 = 0.1666…"]],
      [["What is 4.8 ÷ 0.6?", "8", ["0.8", "80", "2.88"], "Multiply both numbers by 10, which keeps the answer the same: 48 ÷ 6 = 8. Dividing by a number less than 1 gives a bigger result."],
        ["כמה זה 4.8 ÷ 0.6?", "8", ["0.8", "80", "2.88"], "כופלים את שני המספרים ב־10, וזה לא משנה את התוצאה: 48 ÷ 6 = 8. חילוק במספר שקטן מ־1 נותן תוצאה גדולה יותר."]],
      [["How is 3,200,000 written in scientific notation?", "3.2 × 10⁶", ["3.2 × 10⁵", "32 × 10⁵", "0.32 × 10⁷"], "The number in front must be at least 1 and less than 10: 3,200,000 = 3.2 × 1,000,000 = 3.2 × 10⁶. 32 × 10⁵ has the same value, but 32 is too big."],
        ["איך כותבים את 3,200,000 בכתיב מדעי?", "3.2 × 10⁶", ["3.2 × 10⁵", "32 × 10⁵", "0.32 × 10⁷"], "המספר שבהתחלה צריך להיות לפחות 1 וקטן מ־10: 3,200,000 = 3.2 × 1,000,000 = 3.2 × 10⁶. ל־32 × 10⁵ יש אותו ערך, אבל 32 גדול מדי."]],
    ],
    n: [
      [0.375, ["What is 3/8 as a decimal?", "", "1/8 = 0.125, so 3/8 = 3 × 0.125 = 0.375. You can also divide: 3 ÷ 8 = 0.375."],
        ["כמה זה 3/8 כמספר עשרוני?", "", "1/8 = 0.125, ולכן 3/8 = 3 × 0.125 = 0.375. אפשר גם לחלק: 3 ÷ 8 = 0.375."]],
    ],
  },
};
export default c;
