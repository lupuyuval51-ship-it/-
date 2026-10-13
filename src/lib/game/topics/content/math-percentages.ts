import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Percent", "a number of parts out of one hundred; the sign is %", "אחוז", "מספר חלקים מתוך מאה; הסימן הוא %"],
      ["100%", "the whole amount, all of it", "100%", "הכמות כולה, הכול"],
      ["50%", "half of an amount", "50%", "חצי מכמות"],
      ["25%", "a quarter of an amount", "25%", "רבע מכמות"],
      ["10%", "one tenth of an amount", "10%", "עשירית מכמות"],
    ],
    q: [
      [["What is 50% of 30?", "15", ["10", "20", "60"], "50% is half, and half of 30 is 15."],
        ["כמה זה 50% מ־30?", "15", ["10", "20", "60"], "50% זה חצי, וחצי מ־30 הוא 15."]],
      [["In a class, 25 of the 100 children wear glasses. What percent is that?", "25%", ["75%", "4%", "100%"], "25 out of 100 is exactly 25 per hundred: 25%."],
        ["בבית ספר 25 מתוך 100 ילדים מרכיבים משקפיים. כמה אחוזים זה?", "25%", ["75%", "4%", "100%"], "25 מתוך 100 זה בדיוק 25 למאה: 25%."]],
      [["Which is the same as 10%?", "1/10", ["1/100", "1/2", "10"], "10% means 10 out of 100, which is 1/10."],
        ["מה שווה ל־10%?", "1/10", ["1/100", "1/2", "10"], "10% פירושו 10 מתוך 100, וזה 1/10."]],
    ],
    n: [[20, ["What is 10% of 200?", "", "10% is one tenth: 200 ÷ 10 = 20."], ["כמה זה 10% מ־200?", "", "10% זה עשירית: 200 ÷ 10 = 20."]]],
  },
  i: {
    t: [
      ["Discount", "an amount taken off a price", "הנחה", "סכום שמורידים ממחיר"],
      ["Percentage increase", "how much something grew, compared with where it started, written in %", "עלייה באחוזים", "בכמה משהו גדל ביחס לערך ההתחלתי, כתוב באחוזים"],
      ["Decimal", "a number written with a point, like 0.25, which equals 25%", "מספר עשרוני", "מספר שנכתב עם נקודה, כמו 0.25, ששווה ל־25%"],
      ["Original price", "the price before any discount or increase", "מחיר מקורי", "המחיר לפני הנחה או התייקרות"],
    ],
    q: [
      [["A 40 ₪ shirt has a 25% discount. What is the new price?", "30 ₪", ["10 ₪", "35 ₪", "15 ₪"], "25% of 40 is 10, and 40 − 10 = 30 ₪."],
        ["חולצה שעולה 40 ₪ בהנחה של 25%. מה המחיר החדש?", "30 ₪", ["10 ₪", "35 ₪", "15 ₪"], "25% מ־40 הם 10, ו־40 − 10 = 30 ₪."]],
      [["Write 0.07 as a percent.", "7%", ["70%", "0.7%", "700%"], "Multiply by 100: 0.07 × 100 = 7, so 7%."],
        ["כתבו את 0.07 באחוזים.", "7%", ["70%", "0.7%", "700%"], "כופלים ב־100: 0.07 × 100 = 7, כלומר 7%."]],
      [["A price goes up from 50 ₪ to 60 ₪. By what percent did it rise?", "20%", ["10%", "16%", "60%"], "It rose by 10 ₪, and 10 out of the original 50 is 10/50 = 20%."],
        ["מחיר עלה מ־50 ₪ ל־60 ₪. בכמה אחוזים הוא עלה?", "20%", ["10%", "16%", "60%"], "הוא עלה ב־10 ₪, ו־10 מתוך המחיר המקורי 50 הם 10/50 = 20%."]],
    ],
    n: [[36, ["What is 15% of 240?", "", "10% of 240 is 24 and 5% is 12, so 15% is 24 + 12 = 36."], ["כמה זה 15% מ־240?", "", "10% מ־240 הם 24 ו־5% הם 12, ולכן 15% הם 24 + 12 = 36."]]],
  },
  a: {
    t: [
      ["Percentage point", "the plain difference between two percentages, like from 40% to 45%", "נקודת אחוז", "ההפרש הפשוט בין שני אחוזים, כמו מ־40% ל־45%"],
      ["Multiplier", "the number you multiply by to change an amount by a percent, like 1.2 for a 20% rise", "מכפיל", "המספר שכופלים בו כדי לשנות כמות באחוזים, כמו 1.2 לעלייה של 20%"],
      ["Compound change", "one percent change applied after another, each on the new amount", "שינוי מצטבר", "שינוי באחוזים שמופעל אחרי שינוי קודם, כל פעם על הכמות החדשה"],
      ["Reverse percentage", "finding the original amount when you only know the amount after a percent change", "אחוזים הפוכים", "מציאת הכמות המקורית כשיודעים רק את הכמות אחרי השינוי באחוזים"],
    ],
    q: [
      [["A price rises by 10% and then falls by 10%. Compared with the start, the final price is…", "1% lower", ["the same", "1% higher", "20% lower"], "Use multipliers: 1.1 × 0.9 = 0.99, which is 1% less than the start."],
        ["מחיר עולה ב־10% ואז יורד ב־10%. ביחס להתחלה, המחיר הסופי…", "נמוך ב־1%", ["זהה", "גבוה ב־1%", "נמוך ב־20%"], "בעזרת מכפילים: 1.1 × 0.9 = 0.99, כלומר פחות ב־1% מההתחלה."]],
      [["After a 20% discount a coat costs 160 ₪. What was the original price?", "200 ₪", ["192 ₪", "180 ₪", "128 ₪"], "After the discount 80% is left, so 0.8 × price = 160 and price = 160 ÷ 0.8 = 200 ₪."],
        ["אחרי הנחה של 20% מעיל עולה 160 ₪. מה היה המחיר המקורי?", "200 ₪", ["192 ₪", "180 ₪", "128 ₪"], "אחרי ההנחה נשארים 80%, לכן 0.8 × מחיר = 160 והמחיר הוא 160 ÷ 0.8 = 200 ₪."]],
      [["Support for a plan grew from 40% to 50%. Which statement is true?", "It rose by 10 percentage points, which is a 25% increase", ["It rose by 10%", "It rose by 50%", "It rose by 25 percentage points"], "50 − 40 = 10 percentage points; compared with the start, 10/40 = 25%."],
        ["התמיכה בתוכנית עלתה מ־40% ל־50%. איזו טענה נכונה?", "היא עלתה ב־10 נקודות אחוז, שהן עלייה של 25%", ["היא עלתה ב־10%", "היא עלתה ב־50%", "היא עלתה ב־25 נקודות אחוז"], "50 − 40 = 10 נקודות אחוז; ביחס להתחלה, 10/40 = 25%."]],
    ],
    n: [[1.21, ["Money grows by 10% a year, twice in a row. What single multiplier gives the total growth?", "", "Each year multiplies by 1.1, and 1.1 × 1.1 = 1.21 (a 21% rise in total)."], ["כסף גדל ב־10% בשנה, שנתיים ברציפות. באיזה מכפיל יחיד אפשר לתאר את כל הגידול?", "", "כל שנה כופלים ב־1.1, ו־1.1 × 1.1 = 1.21 (עלייה כוללת של 21%)."]]],
  },
};
export default c;
