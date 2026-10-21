import type { TopicContent } from "../types";

// Course "Fractions, decimals and percentages" (grades 5–6), chapter 8: calculating with decimals, fractions as decimals.
const c: TopicContent = {
  l: {
    en: {
      title: "Calculating with decimals",
      text: [
        "To add or subtract, write the numbers one under another so that the decimal points are in the same column, and fill in zeros where needed: 4.5 + 2.35 = 4.50 + 2.35 = 6.85. Multiplying by 10 moves the point one place to the right (3.7 × 10 = 37); dividing by 10 moves it one place to the left (3.7 ÷ 10 = 0.37).",
        "To turn a fraction into a decimal, expand it to the denominator 10, 100 or 1000: 3/4 = 75/100 = 0.75 and 2/5 = 4/10 = 0.4. You can also divide the numerator by the denominator: 1/8 = 1 ÷ 8 = 0.125. Worth knowing by heart: 1/2 = 0.5, 1/4 = 0.25, 3/4 = 0.75, 1/5 = 0.2.",
      ],
      example: "Example: you bought a notebook for 7.90 shekels and a pen for 4.75 shekels, and paid with 20 shekels. How much change? Together: 7.90 + 4.75 = 12.65. Change: 20.00 − 12.65 = 7.35. Answer: 7.35 shekels. Estimate to check: 8 + 5 = 13, and 20 − 13 = 7 — close.",
      task: "Take a supermarket receipt (or a price list from a leaflet). Choose three items and add up their prices on paper, with the points one under another. Check yourself with an estimate: round every price to a whole shekel and see that the sum is close.",
    },
    he: {
      title: "חישובים בעשרוניים",
      text: [
        "בחיבור ובחיסור כותבים את המספרים זה מתחת לזה כך שהנקודות העשרוניות נמצאות באותו טור, ומשלימים אפסים אם צריך: 4.5 + 2.35 = 4.50 + 2.35 = 6.85. בכפל ב־10 הנקודה זזה מקום אחד ימינה (3.7 × 10 = 37), ובחילוק ב־10 מקום אחד שמאלה (3.7 ÷ 10 = 0.37).",
        "כדי להפוך שבר למספר עשרוני, מרחיבים אותו למכנה 10, 100 או 1000: 3/4 = 75/100 = 0.75, ו־2/5 = 4/10 = 0.4. אפשר גם לחלק את המונה במכנה: 1/8 = 1 ÷ 8 = 0.125. כדאי לזכור בעל פה: 1/2 = 0.5, 1/4 = 0.25, 3/4 = 0.75, 1/5 = 0.2.",
      ],
      example: "דוגמה: קניתם מחברת ב־7.90 ש״ח ועט ב־4.75 ש״ח, ושילמתם ב־20 ש״ח. כמה עודף תקבלו? ביחד: 7.90 + 4.75 = 12.65. עודף: 20.00 − 12.65 = 7.35. תשובה: 7.35 ש״ח. אומדן לבדיקה: 8 + 5 = 13, ו־20 − 13 = 7 — קרוב.",
      task: "קחו קבלה מהסופר (או רשימת מחירים מעלון). בחרו שלושה מוצרים וחברו את המחירים שלהם על דף, כשהנקודות זו מתחת לזו. בדקו את עצמכם באומדן: עגלו כל מחיר לשקל שלם, ובדקו שהסכום קרוב.",
    },
  },
  b: {
    t: [
      ["Lining up the points", "writing decimals one under another so that the decimal points are in one column", "יישור הנקודות", "כתיבת מספרים עשרוניים זה מתחת לזה כך שהנקודות נמצאות באותו טור"],
      ["Change", "the money you get back when you pay more than the price", "עודף", "הכסף שמקבלים בחזרה כשמשלמים יותר מהמחיר"],
    ],
    q: [
      [["What is 0.3 + 0.5?", "0.8", ["0.35", "0.08", "8.0"], "3 tenths and 5 tenths are 8 tenths: 0.3 + 0.5 = 0.8. 0.35 comes from putting the digits side by side."],
        ["כמה זה 0.3 + 0.5?", "0.8", ["0.35", "0.08", "8.0"], "3 עשיריות ועוד 5 עשיריות הן 8 עשיריות: 0.3 + 0.5 = 0.8. 0.35 מתקבל כשכותבים את הספרות זו ליד זו."]],
      [["What is 3.6 + 1.25?", "4.85", ["1.61", "4.95", "3.85"], "Line up the points and add a zero: 3.60 + 1.25 = 4.85. Without lining up the points you add tenths to hundredths and get 1.61."],
        ["כמה זה 3.6 + 1.25?", "4.85", ["1.61", "4.95", "3.85"], "מיישרים את הנקודות ומוסיפים אפס: 3.60 + 1.25 = 4.85. בלי יישור הנקודות מחברים עשיריות עם מאיות ומקבלים 1.61."]],
      [["What is 5 − 1.2?", "3.8", ["4.2", "4.8", "3.2"], "Write 5 as 5.0: 5.0 − 1.2 = 3.8. Check with addition: 3.8 + 1.2 = 5."],
        ["כמה זה 5 − 1.2?", "3.8", ["4.2", "4.8", "3.2"], "כותבים את 5 כ־5.0: 5.0 − 1.2 = 3.8. בודקים בחיבור: 3.8 + 1.2 = 5."]],
      [["What is 0.6 × 10?", "6", ["0.06", "60", "6.10"], "Multiplying by 10 moves the point one place to the right: 0.6 × 10 = 6. Six tenths, ten times, are 6 wholes."],
        ["כמה זה 0.6 × 10?", "6", ["0.06", "60", "6.10"], "בכפל ב־10 הנקודה זזה מקום אחד ימינה: 0.6 × 10 = 6. שש עשיריות, עשר פעמים, הן 6 שלמים."]],
      [["Which decimal is equal to 1/2?", "0.5", ["1.2", "0.12", "0.2"], "1/2 = 5/10, which is written 0.5. 1.2 and 0.12 only copy the digits of the fraction; 0.2 is one fifth."],
        ["איזה מספר עשרוני שווה ל־1/2?", "0.5", ["1.2", "0.12", "0.2"], "1/2 = 5/10, שנכתב 0.5. 1.2 ו־0.12 רק מעתיקים את הספרות של השבר; 0.2 הוא חמישית."]],
    ],
    n: [
      [3.8, ["A pencil costs 2.50 shekels and an eraser 1.30 shekels. How much do both cost?", "shekels", "Line up the points: 2.50 + 1.30 = 3.80, that is 3.8 shekels."], ["עיפרון עולה 2.50 ש״ח ומחק 1.30 ש״ח. כמה עולים שניהם?", "ש״ח", "מיישרים את הנקודות: 2.50 + 1.30 = 3.80, כלומר 3.8 ש״ח."]],
      [0.25, ["What is 1/4 as a decimal?", "", "1/4 = 25/100, which is written 0.25: a quarter of a shekel is 25 agorot."], ["מהו 1/4 כמספר עשרוני?", "", "1/4 = 25/100, כלומר 25 מאיות, שנכתבות 0.25: רבע שקל הוא 25 אגורות."]],
      [3.6, ["You pay 10 shekels for something that costs 6.40 shekels. How much change do you get?", "shekels", "10.00 − 6.40 = 3.60, so the change is 3.6 shekels. Check: 6.40 + 3.60 = 10."], ["שילמתם 10 ש״ח על מוצר שעולה 6.40 ש״ח. כמה עודף תקבלו?", "ש״ח", "10.00 − 6.40 = 3.60, ולכן העודף הוא 3.6 ש״ח. בדיקה: 6.40 + 3.60 = 10."]],
    ],
  },
  i: {
    t: [
      ["Agora", "one hundredth of a shekel: 100 of them make 1 shekel", "אגורה", "מאית של שקל: 100 מהן הן שקל אחד"],
      ["Decimal fraction", "a fraction whose denominator is 10, 100 or 1000", "שבר עשרוני", "שבר שהמכנה שלו 10, 100 או 1000"],
    ],
    q: [
      [["What is 3/5 as a decimal?", "0.6", ["0.35", "3.5", "0.53"], "Expand to tenths: 3/5 = 6/10 = 0.6. 0.35 and 3.5 just glue the digits 3 and 5 together."],
        ["מהו 3/5 כמספר עשרוני?", "0.6", ["0.35", "3.5", "0.53"], "מרחיבים לעשיריות: 3/5 = 6/10 = 0.6. 0.35 ו־3.5 רק מדביקים את הספרות 3 ו־5 זו לזו."]],
      [["What is 0.75 as a fraction, fully simplified?", "3/4", ["7/5", "75/10", "1/75"], "0.75 = 75/100. Both numbers divide by 25: 75 ÷ 25 = 3 and 100 ÷ 25 = 4, so 0.75 = 3/4."],
        ["מהו 0.75 כשבר מצומצם עד הסוף?", "3/4", ["7/5", "75/10", "1/75"], "0.75 = 75/100. שני המספרים מתחלקים ב־25: 75 ÷ 25 = 3 ו־100 ÷ 25 = 4, ולכן 0.75 = 3/4."]],
      [["What is 4.2 × 100?", "420", ["42", "4200", "4.200"], "Multiplying by 100 moves the point two places to the right: 4.2 → 42 → 420. Add a zero when you run out of digits."],
        ["כמה זה 4.2 × 100?", "420", ["42", "4200", "4.200"], "בכפל ב־100 הנקודה זזה שני מקומות ימינה: 4.2 ← 42 ← 420. כשנגמרות הספרות מוסיפים אפס."]],
      [["What is 56 ÷ 100?", "0.56", ["5.6", "0.056", "5600"], "Dividing by 100 moves the point two places to the left: 56 → 5.6 → 0.56. So 56 agorot are 0.56 shekels."],
        ["כמה זה 56 ÷ 100?", "0.56", ["5.6", "0.056", "5600"], "בחילוק ב־100 הנקודה זזה שני מקומות שמאלה: 56 ← 5.6 ← 0.56. לכן 56 אגורות הן 0.56 שקלים."]],
      [["What is 2.5 × 4?", "10", ["8.5", "8.20", "1.0"], "2.5 × 4 = 2 × 4 + 0.5 × 4 = 8 + 2 = 10. Four halves make two wholes."],
        ["כמה זה 2.5 × 4?", "10", ["8.5", "8.20", "1.0"], "2.5 × 4 = 2 × 4 + 0.5 × 4 = 8 + 2 = 10. ארבעה חצאים הם שני שלמים."]],
    ],
    n: [
      [0.35, ["What is 7/20 as a decimal?", "", "Expand to hundredths: 20 × 5 = 100, so 7/20 = 35/100 = 0.35."], ["מהו 7/20 כמספר עשרוני?", "", "מרחיבים למאיות: 20 × 5 = 100, ולכן 7/20 = 35/100 = 0.35."]],
      [0.4, ["What is 0.8 × 0.5?", "", "8 tenths times 5 tenths: 8 × 5 = 40, and tenths times tenths are hundredths, so 0.40 = 0.4. (Half of 0.8 is 0.4.)"], ["כמה זה 0.8 × 0.5?", "", "8 עשיריות כפול 5 עשיריות: 8 × 5 = 40, ועשיריות כפול עשיריות הן מאיות, ולכן 0.40 = 0.4. (חצי מ־0.8 הוא 0.4.)"]],
      [9, ["A bottle holds 1.5 litres. How many litres do 6 bottles hold?", "litres", "Split 1.5 into 1 and 0.5: 6 × 1.5 = 6 × 1 + 6 × 0.5 = 6 + 3 = 9 litres."], ["בקבוק מחזיק 1.5 ליטר. כמה ליטרים מחזיקים 6 בקבוקים?", "ליטר", "מפרקים את 1.5 ל־1 ול־0.5: 6 × 1.5 = 6 × 1 + 6 × 0.5 = 6 + 3 = 9 ליטר."]],
    ],
    s: [[["Changing 3/8 into a decimal", "Write it as a division: 3 ÷ 8", "Write 3 as 3.000", "8 goes into 30 three times, remainder 6", "60 gives 7, remainder 4; then 40 gives 5", "The answer is 0.375"], ["הפיכת 3/8 למספר עשרוני", "כותבים כתרגיל חילוק: 3 ÷ 8", "כותבים את 3 כ־3.000", "8 נכנס ב־30 שלוש פעמים, שארית 6", "60 נותן 7, שארית 4; ואז 40 נותן 5", "התשובה היא 0.375"]]],
  },
  a: {
    t: [
      ["Repeating decimal", "a decimal whose digits go on for ever in a pattern, like 0.666… for 2/3", "מספר עשרוני מחזורי", "מספר שהספרות שלו חוזרות בלי סוף, כמו 0.666… עבור 2/3"],
      ["Decimal places", "the number of digits after the decimal point", "ספרות אחרי הנקודה", "כמה ספרות כתובות מימין לנקודה העשרונית"],
    ],
    q: [
      [["What is 0.3 × 0.2?", "0.06", ["0.6", "6", "0.5"], "3 × 2 = 6. Tenths times tenths are hundredths (two digits after the point in all), so 0.3 × 0.2 = 0.06."],
        ["כמה זה 0.3 × 0.2?", "0.06", ["0.6", "6", "0.5"], "3 × 2 = 6. עשיריות כפול עשיריות הן מאיות (בסך הכול שתי ספרות אחרי הנקודה), ולכן 0.3 × 0.2 = 0.06."]],
      [["What is 1/3 as a decimal?", "0.333…", ["0.3", "1.333…", "0.13"], "1 ÷ 3 = 0.333…: the 3 repeats for ever. 0.3 is a little less than 1/3, because 3 × 0.3 = 0.9."],
        ["מהו 1/3 כמספר עשרוני?", "0.333…", ["0.3", "1.333…", "0.13"], "1 ÷ 3 = 0.333…: ה־3 חוזר בלי סוף. 0.3 קצת פחות מ־1/3, כי 3 × 0.3 = 0.9."]],
      [["Which is bigger: 5/8 or 0.6?", "5/8", ["0.6", "They are equal"], "Divide the numerator by the denominator: 5/8 = 5 ÷ 8 = 0.625, which is more than 0.6 = 0.600."],
        ["מה גדול יותר: 5/8 או 0.6?", "5/8", ["0.6", "הם שווים"], "מחלקים את המונה במכנה: 5/8 = 5 ÷ 8 = 0.625, וזה יותר מ־0.6 = 0.600."]],
      [["What is 7.2 ÷ 0.9?", "8", ["0.8", "80", "6.3"], "Multiply both numbers by 10 so the divisor is whole: 72 ÷ 9 = 8, and the answer stays the same. Check: 8 × 0.9 = 7.2."],
        ["כמה זה 7.2 ÷ 0.9?", "8", ["0.8", "80", "6.3"], "כופלים את שני המספרים ב־10 כדי שהמחלק יהיה שלם: 72 ÷ 9 = 8, והתוצאה לא משתנה. בדיקה: 8 × 0.9 = 7.2."]],
      [["Which list goes from smallest to biggest?", "0.3, 1/3, 0.35", ["1/3, 0.3, 0.35", "0.3, 0.35, 1/3", "0.35, 1/3, 0.3"], "1/3 = 0.333…, which is more than 0.3 = 0.300 and less than 0.35 = 0.350. So the order is 0.3, 1/3, 0.35."],
        ["איזו רשימה מסודרת מהקטן לגדול?", "0.3, 1/3, 0.35", ["1/3, 0.3, 0.35", "0.3, 0.35, 1/3", "0.35, 1/3, 0.3"], "1/3 = 0.333…, וזה יותר מ־0.3 = 0.300 ופחות מ־0.35 = 0.350. לכן הסדר הוא 0.3, 1/3, 0.35."]],
    ],
    n: [
      [0.1, ["What is 0.4 × 0.25?", "", "4 × 25 = 100, and there are three digits after the points in all, so 0.100 = 0.1. (A quarter of 0.4 is 0.1.)"], ["כמה זה 0.4 × 0.25?", "", "4 × 25 = 100, ובסך הכול יש שלוש ספרות אחרי הנקודות, ולכן 0.100 = 0.1. (רבע מ־0.4 הוא 0.1.)"]],
      [21, ["A kilo of apples costs 8.40 shekels. How much do 2.5 kilos cost?", "shekels", "2 kilos cost 2 × 8.40 = 16.80 and half a kilo costs 4.20. In all: 16.80 + 4.20 = 21 shekels."], ["קילו תפוחים עולה 8.40 ש״ח. כמה עולים 2.5 קילו?", "ש״ח", "2 קילו עולים 2 × 8.40 = 16.80, וחצי קילו עולה 4.20. בסך הכול: 16.80 + 4.20 = 21 ש״ח."]],
      [12, ["How many 0.25-litre glasses can be filled from 3 litres?", "glasses", "3 ÷ 0.25 = 3 ÷ 1/4 = 3 × 4 = 12 glasses. Check: 12 × 0.25 = 3."], ["כמה כוסות של 0.25 ליטר אפשר למלא מ־3 ליטר?", "כוסות", "3 ÷ 0.25 = 3 ÷ 1/4 = 3 × 4 = 12 כוסות. בדיקה: 12 × 0.25 = 3."]],
    ],
  },
};
export default c;
