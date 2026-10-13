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
      [["How is one half written as a decimal?", "0.5", ["0.2", "1.2", "0.05"], "1/2 = 5/10 = 0.5."],
        ["איך כותבים חצי כמספר עשרוני?", "0.5", ["0.2", "1.2", "0.05"], "1/2 = 5/10 = 0.5."]],
    ],
    n: [[4.5, ["What is 2.3 + 2.2?", "", "Add the tenths (3 + 2 = 5) and the wholes (2 + 2 = 4): 4.5."], ["כמה זה 2.3 + 2.2?", "", "מחברים עשיריות (3 + 2 = 5) ושלמים (2 + 2 = 4): 4.5."]]],
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
    ],
    n: [[1.25, ["What is 5 − 3.75?", "", "5.00 − 3.75 = 1.25."], ["כמה זה 5 − 3.75?", "", "5.00 − 3.75 = 1.25."]]],
  },
  a: {
    t: [
      ["Recurring decimal", "a decimal in which digits repeat for ever, like 1/3 = 0.333…", "שבר עשרוני מחזורי", "מספר עשרוני שבו ספרות חוזרות בלי סוף, כמו 1/3 = 0.333…"],
      ["Terminating decimal", "a decimal that ends, like 1/8 = 0.125", "שבר עשרוני סופי", "מספר עשרוני שנגמר, כמו 1/8 = 0.125"],
      ["Significant figures", "the digits that carry meaning in a measurement, starting from the first non-zero digit", "ספרות משמעותיות", "הספרות שנושאות משמעות במדידה, החל מהספרה הראשונה שאינה אפס"],
      ["Scientific notation", "writing a number as a value from 1 to 10 times a power of ten, like 3 × 10⁸", "כתיב מדעי", "כתיבת מספר כערך בין 1 ל־10 כפול חזקה של עשר, כמו 3 × 10⁸"],
    ],
    q: [
      [["What is 0.2 × 0.3?", "0.06", ["0.6", "0.5", "6"], "2 × 3 = 6, and there are two decimal places in total: 0.06."],
        ["כמה זה 0.2 × 0.3?", "0.06", ["0.6", "0.5", "6"], "2 × 3 = 6, ויש בסך הכול שתי ספרות אחרי הנקודה: 0.06."]],
      [["Which fraction gives a recurring decimal?", "1/6", ["1/4", "1/5", "1/8"], "A fraction in lowest terms terminates only if its denominator has no prime factors other than 2 and 5; 6 = 2 × 3, so 1/6 = 0.1666…"],
        ["איזה שבר נותן מספר עשרוני מחזורי?", "1/6", ["1/4", "1/5", "1/8"], "שבר מצומצם הוא סופי רק אם במכנה אין גורמים ראשוניים מלבד 2 ו־5; 6 = 2 × 3, ולכן 1/6 = 0.1666…"]],
      [["What is 4.8 ÷ 0.6?", "8", ["0.8", "80", "2.88"], "Multiply both by 10: 48 ÷ 6 = 8."],
        ["כמה זה 4.8 ÷ 0.6?", "8", ["0.8", "80", "2.88"], "כופלים את שניהם ב־10: 48 ÷ 6 = 8."]],
    ],
  },
};
export default c;
