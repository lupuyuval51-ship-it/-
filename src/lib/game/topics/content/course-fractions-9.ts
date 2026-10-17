import type { TopicContent } from "../types";

// Course "Fractions, decimals and percentages" (grades 5–6), chapter 9: percentages, discounts and price rises.
const c: TopicContent = {
  l: {
    en: {
      title: "Percentages: discounts and price rises",
      text: [
        "Percent means “out of 100”: 25% is 25/100 = 1/4 = 0.25. So 50% is a half, 10% is a tenth and 100% is the whole thing. To find 10% of a number, divide it by 10: 10% of 80 is 8. From there the others are easy: 30% is 3 times as much — 24 — and 5% is half of 10% — 4.",
        "A 20% discount means you pay 80% of the price: on a 60-shekel shirt the discount is 20% of 60 = 12 shekels, and the new price is 48 shekels. With a 20% price rise you add instead: 60 + 12 = 72 shekels. A percent is always a percent of something — 20% of 60 is not the same as 20% of 100.",
      ],
      example: "Example: a bike costs 450 shekels and has a 30% discount. How much do you pay? 10% of 450 is 45. 30% is 3 × 45 = 135 shekels off. You pay 450 − 135 = 315 shekels. A shortcut: you pay 70%, and 7 × 45 = 315.",
      task: "Look in an advertising leaflet or on a shop's website for an item on sale (for example “20% off”). Work out the price after the discount using 10%, and check whether the price printed in the leaflet is right. How much money do you save?",
    },
    he: {
      title: "אחוזים: הנחה והתייקרות",
      text: [
        "אחוז פירושו ״מתוך 100״: 25% הם 25/100 = 1/4 = 0.25. לכן 50% הם חצי, 10% הם עשירית ו־100% הם השלם כולו. כדי למצוא 10% ממספר מחלקים אותו ב־10: 10% מ־80 הם 8. משם קל להגיע לאחרים: 30% הם פי 3 — 24, ו־5% הם חצי מ־10% — 4.",
        "הנחה של 20% פירושה שמשלמים 80% מהמחיר: על חולצה ב־60 ש״ח ההנחה היא 20% מ־60 = 12 ש״ח, והמחיר החדש 48 ש״ח. בהתייקרות של 20% מוסיפים: 60 + 12 = 72 ש״ח. אחוז הוא תמיד אחוז ממשהו — 20% מ־60 אינם כמו 20% מ־100.",
      ],
      example: "דוגמה: אופניים עולים 450 ש״ח, ויש עליהם הנחה של 30%. כמה משלמים? 10% מ־450 הם 45. 30% הם 3 × 45 = 135 ש״ח הנחה. משלמים 450 − 135 = 315 ש״ח. דרך קצרה: משלמים 70%, ו־7 × 45 = 315.",
      task: "חפשו בעלון פרסומת או באתר של חנות מוצר במבצע (למשל ״20% הנחה״). חשבו את המחיר אחרי ההנחה בעזרת 10%, ובדקו אם המחיר שכתוב בעלון נכון. כמה כסף חוסכים?",
    },
  },
  b: {
    t: [
      ["Percent", "a number out of 100, written with the sign %", "אחוז", "מספר מתוך 100, נכתב עם הסימן %"],
      ["Discount", "an amount of money taken off a price", "הנחה", "סכום שמורידים מהמחיר"],
    ],
    q: [
      [["What is 50% of 30?", "15", ["60", "3", "20"], "50% is one half, and half of 30 is 15. 50% is a part of 30, so the answer must be less than 30."],
        ["כמה זה 50% מ־30?", "15", ["60", "3", "20"], "50% הם חצי, וחצי מ־30 הוא 15. 50% הם חלק מ־30, ולכן התשובה חייבת להיות קטנה מ־30."]],
      [["What is 25% as a fraction?", "1/4", ["1/25", "2/5", "25/10"], "25% = 25/100. Both numbers divide by 25, which gives 1/4. A quarter of something is 25% of it."],
        ["איך כותבים 25% כשבר?", "1/4", ["1/25", "2/5", "25/10"], "25% = 25/100. שני המספרים מתחלקים ב־25, ומקבלים 1/4. רבע ממשהו הוא 25% ממנו."]],
      [["What is 10% of 70?", "7", ["10", "0.7", "700"], "10% is one tenth of the number, so divide it by 10: 70 ÷ 10 = 7."],
        ["כמה זה 10% מ־70?", "7", ["10", "0.7", "700"], "10% הם עשירית מהמספר, ולכן מחלקים אותו ב־10: 70 ÷ 10 = 7."]],
      [["A shirt costs 40 shekels and has a 50% discount. What is the new price?", "20 shekels", ["35 shekels", "60 shekels", "50 shekels"], "50% of 40 is 20 shekels off, and 40 − 20 = 20 shekels. Half off means you pay half the price."],
        ["חולצה עולה 40 ש״ח, ויש עליה הנחה של 50%. מה המחיר החדש?", "20 ש״ח", ["35 ש״ח", "60 ש״ח", "50 ש״ח"], "50% מ־40 הם 20 ש״ח הנחה, ו־40 − 20 = 20 ש״ח. הנחה של 50% פירושה שמשלמים חצי מהמחיר."]],
      [["Which is the most?", "100% of 9", ["50% of 16", "10% of 80", "25% of 20"], "100% of 9 is all of 9 = 9. 50% of 16 = 8, 10% of 80 = 8 and 25% of 20 = 5."],
        ["מה הכי הרבה?", "100% מ־9", ["50% מ־16", "10% מ־80", "25% מ־20"], "100% מ־9 הם כל ה־9, כלומר 9. 50% מ־16 = 8, 10% מ־80 = 8 ו־25% מ־20 = 5."]],
    ],
    n: [
      [25, ["What is 10% of 250?", "", "10% is one tenth of the number, so divide by 10: 250 ÷ 10 = 25."], ["כמה זה 10% מ־250?", "", "10% הם עשירית מהמספר, ולכן מחלקים ב־10: 250 ÷ 10 = 25."]],
      [10, ["In a class of 20 students, 50% have a pet. How many have a pet?", "students", "50% means half of the class, and half of 20 is 20 ÷ 2 = 10 students."], ["בכיתה של 20 תלמידים, ל־50% יש חיית מחמד. לכמה תלמידים יש חיית מחמד?", "תלמידים", "50% פירושם חצי מהכיתה, וחצי מ־20 הוא 20 ÷ 2 = 10 תלמידים."]],
      [100, ["What percent is one whole?", "%", "The whole is 100 out of 100, so it is 100%. Half is 50% and a quarter is 25%."], ["כמה אחוזים הם שלם אחד?", "%", "השלם הוא 100 מתוך 100, ולכן הוא 100%. חצי הוא 50% ורבע הוא 25%."]],
    ],
  },
  i: {
    t: [
      ["Price rise", "an amount added to a price", "התייקרות", "סכום שמוסיפים למחיר"],
      ["Original price", "the price before a discount or a rise", "המחיר המקורי", "המחיר לפני הנחה או לפני עלייה במחיר"],
    ],
    q: [
      [["What is 30% of 80?", "24", ["30", "8", "50"], "Start from 10%: 10% of 80 is 80 ÷ 10 = 8. 30% is three times as much: 3 × 8 = 24."],
        ["כמה זה 30% מ־80?", "24", ["30", "8", "50"], "מתחילים מ־10%: 10% מ־80 הם 80 ÷ 10 = 8. 30% הם פי שלושה: 3 × 8 = 24."]],
      [["A game costs 120 shekels and its price rises by 10%. What is the new price?", "132 shekels", ["130 shekels", "108 shekels", "12 shekels"], "10% of 120 is 12 shekels. A rise adds it: 120 + 12 = 132 shekels. 108 would be the price after a 10% discount."],
        ["משחק עולה 120 ש״ח, והמחיר שלו עולה ב־10%. מה המחיר החדש?", "132 ש״ח", ["130 ש״ח", "108 ש״ח", "12 ש״ח"], "10% מ־120 הם 12 ש״ח. בהתייקרות מוסיפים אותם: 120 + 12 = 132 ש״ח. 108 היה המחיר אחרי הנחה של 10%."]],
      [["What is 0.4 as a percent?", "40%", ["4%", "0.4%", "400%"], "0.4 = 4/10 = 40/100 = 40%. To turn a decimal into a percent, multiply it by 100."],
        ["מהו 0.4 באחוזים?", "40%", ["4%", "0.4%", "400%"], "0.4 = 4/10 = 40/100 = 40%. כדי להפוך מספר עשרוני לאחוזים, כופלים אותו ב־100."]],
      [["A 200-shekel jacket has a 15% discount. How much do you pay?", "170 shekels", ["185 shekels", "30 shekels", "230 shekels"], "10% of 200 is 20 and 5% is 10, so 15% is 30 shekels off. You pay 200 − 30 = 170 shekels."],
        ["מעיל עולה 200 ש״ח, ויש עליו הנחה של 15%. כמה משלמים?", "170 ש״ח", ["185 ש״ח", "30 ש״ח", "230 ש״ח"], "10% מ־200 הם 20, ו־5% הם 10, ולכן 15% הם 30 ש״ח הנחה. משלמים 200 − 30 = 170 ש״ח."]],
      [["Which is the same as 3/5?", "60%", ["35%", "30%", "3.5%"], "3/5 = 6/10 = 60/100 = 60%. 35% only glues the digits 3 and 5 together."],
        ["מה שווה ל־3/5?", "60%", ["35%", "30%", "3.5%"], "3/5 = 6/10 = 60/100 = 60%. 35% רק מדביק את הספרות 3 ו־5 זו לזו."]],
    ],
    n: [
      [3, ["What is 5% of 60?", "", "10% of 60 is 60 ÷ 10 = 6, and 5% is half of 10%, so 6 ÷ 2 = 3."], ["כמה זה 5% מ־60?", "", "10% מ־60 הם 60 ÷ 10 = 6, ו־5% הם חצי מ־10%, ולכן 6 ÷ 2 = 3."]],
      [72, ["Shoes cost 90 shekels. What is the price after a 20% discount?", "shekels", "20% of 90 is 2 × 9 = 18 shekels, and 90 − 18 = 72 shekels. Or: you pay 80%, and 8 × 9 = 72."], ["נעליים עולות 90 ש״ח. מה המחיר אחרי הנחה של 20%?", "ש״ח", "20% מ־90 הם 2 × 9 = 18 ש״ח, ו־90 − 18 = 72 ש״ח. או: משלמים 80%, ו־8 × 9 = 72."]],
      [60, ["15 out of 25 students passed a test. What percent passed?", "%", "15/25 = 3/5 = 60/100, so 60% passed. Multiplying 15/25 by 4/4 gives 60/100 at once."], ["15 מתוך 25 תלמידים עברו מבחן. כמה אחוזים עברו?", "%", "15/25 = 3/5 = 60/100, ולכן 60% עברו. כפל של 15/25 ב־4/4 נותן מיד 60/100."]],
    ],
  },
  a: {
    t: [
      ["Percent change", "how much something grew or shrank, out of each 100 of what it was before", "שינוי באחוזים", "בכמה משהו גדל או קטן, ביחס לכל 100 ממה שהיה לפני כן"],
      ["Finding the whole", "working out the original amount when you know what a percent of it is", "מציאת השלם", "חישוב הכמות המקורית כשיודעים כמה הם אחוז מסוים ממנה"],
    ],
    q: [
      [["After a 25% discount a toy costs 60 shekels. What was the original price?", "80 shekels", ["75 shekels", "85 shekels", "45 shekels"], "After 25% off you pay 75% of the price. 75% is 60, so 25% is 60 ÷ 3 = 20 and 100% is 4 × 20 = 80 shekels. Adding 25% of 60 (to get 75) is the classic mistake."],
        ["אחרי הנחה של 25% צעצוע עולה 60 ש״ח. מה היה המחיר המקורי?", "80 ש״ח", ["75 ש״ח", "85 ש״ח", "45 ש״ח"], "אחרי 25% הנחה משלמים 75% מהמחיר. 75% הם 60, ולכן 25% הם 60 ÷ 3 = 20, ו־100% הם 4 × 20 = 80 ש״ח. הוספה של 25% מ־60 (וקבלת 75) היא הטעות הנפוצה."]],
      [["A price went up from 50 to 60 shekels. By what percent did it rise?", "20%", ["10%", "50%", "60%"], "It rose by 10 shekels. 10 out of the original 50 is 10/50 = 20/100 = 20%. Always compare with the price before the change (10 out of 60 would be the wrong base)."],
        ["מחיר עלה מ־50 ל־60 ש״ח. בכמה אחוזים הוא עלה?", "20%", ["10%", "50%", "60%"], "הוא עלה ב־10 ש״ח. 10 מתוך המחיר המקורי, 50, הם 10/50 = 20/100 = 20%. תמיד משווים למחיר שלפני השינוי."]],
      [["Which is bigger: 40% of 70 or 70% of 40?", "They are equal", ["40% of 70", "70% of 40"], "40% of 70 = 0.4 × 70 = 28 and 70% of 40 = 0.7 × 40 = 28. They are always equal, because the order of multiplying does not matter."],
        ["מה גדול יותר: 40% מ־70 או 70% מ־40?", "הם שווים", ["40% מ־70", "70% מ־40"], "40% מ־70 = 0.4 × 70 = 28, ו־70% מ־40 = 0.7 × 40 = 28. הם תמיד שווים, כי סדר הכפל לא משנה."]],
      [["A shop raises a price by 10%, then lowers the new price by 10%. Compared with the start, the price is…", "1% lower", ["the same", "1% higher", "10% lower"], "Say it cost 100. +10% gives 110. 10% of 110 is 11, so 110 − 11 = 99: 1% lower than at the start. The 10% cut is taken from a bigger number (110)."],
        ["חנות מעלה מחיר ב־10%, ואחר כך מורידה את המחיר החדש ב־10%. בהשוואה להתחלה, המחיר…", "נמוך ב־1%", ["זהה", "גבוה ב־1%", "נמוך ב־10%"], "נניח שהמחיר היה 100. אחרי עלייה של 10% הוא 110. 10% מ־110 הם 11, ולכן 110 − 11 = 99: נמוך ב־1% מההתחלה. ההורדה של 10% מחושבת מתוך מספר גדול יותר (110)."]],
      [["45% of the 300 students in a school walk to school. How many do not walk?", "165", ["135", "255", "45"], "Those who do not walk are 100% − 45% = 55%. 55% of 300 = 55 × 3 = 165 students. 135 is the number who do walk."],
        ["45% מ־300 התלמידים בבית ספר הולכים ברגל לבית הספר. כמה לא הולכים ברגל?", "165", ["135", "255", "45"], "מי שלא הולכים ברגל הם 100% − 45% = 55%. 55% מ־300 = 55 × 3 = 165 תלמידים. 135 הם מי שכן הולכים ברגל."]],
    ],
    n: [
      [8, ["What is 12.5% of 64?", "", "12.5% is half of 25%, and 25% is 1/4, so 12.5% = 1/8. Then 64 ÷ 8 = 8."], ["כמה זה 12.5% מ־64?", "", "12.5% הם חצי מ־25%, ו־25% הם 1/4, ולכן 12.5% = 1/8. ואז 64 ÷ 8 = 8."]],
      [391, ["A bike costs 400 shekels. Its price rises by 15%, then falls by 15%. What is the final price?", "shekels", "After the rise: 400 + 60 = 460. 15% of 460 is 69, so after the fall: 460 − 69 = 391 shekels — less than at the start."], ["אופניים עולים 400 ש״ח. המחיר עולה ב־15%, ואחר כך יורד ב־15%. מה המחיר הסופי?", "ש״ח", "אחרי העלייה: 400 + 60 = 460. 15% מ־460 הם 69, ולכן אחרי הירידה: 460 − 69 = 391 ש״ח — פחות מאשר בהתחלה."]],
      [60, ["18 is 30% of a number. What is the number?", "", "If 30% is 18, then 10% is 18 ÷ 3 = 6, and 100% is 10 × 6 = 60. Check: 30% of 60 is 18."], ["18 הם 30% ממספר מסוים. מהו המספר?", "", "אם 30% הם 18, אז 10% הם 18 ÷ 3 = 6, ו־100% הם 10 × 6 = 60. בדיקה: 30% מ־60 הם 18."]],
    ],
  },
};
export default c;
