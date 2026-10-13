import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Ones", "the digit at the far right of a whole number", "יחידות", "הספרה הימנית ביותר במספר שלם"],
      ["Tens", "the second digit from the right: 3 in 35 means 30", "עשרות", "הספרה השנייה מימין: 3 ב־35 פירושו 30"],
      ["Hundreds", "the third digit from the right: 2 in 245 means 200", "מאות", "הספרה השלישית מימין: 2 ב־245 פירושו 200"],
      ["Digit value", "how much a digit is worth in its place", "ערך הספרה", "כמה שווה ספרה לפי המקום שלה"],
    ],
    q: [
      [["What is the value of the 7 in 472?", "70", ["7", "700", "4"], "7 is in the tens place: 7 tens = 70."],
        ["מה הערך של הספרה 7 במספר 472?", "70", ["7", "700", "4"], "7 נמצאת במקום העשרות: 7 עשרות = 70."]],
      [["Which number is three hundred and six?", "306", ["36", "360", "3,006"], "3 hundreds, 0 tens and 6 ones: 306."],
        ["איזה מספר הוא שלוש מאות ושש?", "306", ["36", "360", "3,006"], "3 מאות, 0 עשרות ו־6 יחידות: 306."]],
    ],
  },
  i: {
    t: [
      ["Thousands", "the fourth place from the right in a whole number", "אלפים", "המקום הרביעי מימין במספר שלם"],
      ["Million", "a thousand thousands: 1,000,000", "מיליון", "אלף אלפים: 1,000,000"],
      ["Rounding to the nearest ten", "choosing the closest multiple of 10, like 47 → 50", "עיגול לעשרת הקרובה", "בחירת הכפולה של 10 הקרובה ביותר, כמו 47 → 50"],
      ["Estimate", "a quick, sensible guess at an answer, often using rounded numbers", "אומדן", "ניחוש מהיר והגיוני של תשובה, לרוב בעזרת מספרים מעוגלים"],
    ],
    q: [
      [["Round 3,648 to the nearest hundred.", "3,600", ["3,700", "3,650", "4,000"], "The tens digit is 4 (less than 5), so round down: 3,600."],
        ["עגלו את 3,648 למאה הקרובה.", "3,600", ["3,700", "3,650", "4,000"], "ספרת העשרות היא 4 (פחות מ־5), ולכן מעגלים כלפי מטה: 3,600."]],
      [["Estimate 49 × 21.", "About 1,000", ["About 100", "About 70", "About 10,000"], "Round to 50 × 20 = 1,000 (the exact answer is 1,029)."],
        ["תנו אומדן ל־49 × 21.", "בערך 1,000", ["בערך 100", "בערך 70", "בערך 10,000"], "מעגלים ל־50 × 20 = 1,000 (התשובה המדויקת היא 1,029)."]],
    ],
  },
  a: {
    t: [
      ["Billion", "a thousand millions: 1,000,000,000", "מיליארד", "אלף מיליונים: 1,000,000,000"],
      ["Order of magnitude", "the size of a number measured in powers of ten", "סדר גודל", "הגודל של מספר, שנמדד בחזקות של עשר"],
      ["Standard form", "writing a number as A × 10ⁿ, with A from 1 up to (not including) 10", "כתיב מדעי", "כתיבת מספר בצורה A × 10ⁿ, כאשר A בין 1 (כולל) ל־10 (לא כולל)"],
      ["Truncate", "cut off digits without rounding", "קטיעה", "חיתוך ספרות בלי לעגל"],
    ],
    q: [
      [["Write 4,500,000 in standard form.", "4.5 × 10⁶", ["45 × 10⁵", "4.5 × 10⁵", "0.45 × 10⁷"], "Move the point 6 places: 4.5 × 10⁶ (A must be at least 1 and less than 10)."],
        ["כתבו את 4,500,000 בכתיב מדעי.", "4.5 × 10⁶", ["45 × 10⁵", "4.5 × 10⁵", "0.45 × 10⁷"], "מזיזים את הנקודה 6 מקומות: 4.5 × 10⁶ (A חייב להיות לפחות 1 וקטן מ־10)."]],
      [["About how many seconds are there in a year?", "About 30 million", ["About 300,000", "About 3 billion", "About 3 million"], "365 × 24 × 3,600 ≈ 31.5 million seconds."],
        ["בערך כמה שניות יש בשנה?", "כ־30 מיליון", ["כ־300,000", "כ־3 מיליארד", "כ־3 מיליון"], "365 × 24 × 3,600 ≈ 31.5 מיליון שניות."]],
    ],
  },
};
export default c;
