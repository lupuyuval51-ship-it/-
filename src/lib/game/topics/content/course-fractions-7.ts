import type { TopicContent } from "../types";

// Course "Fractions, decimals and percentages" (grades 5–6), chapter 7: decimals — place value, comparing and rounding.
const c: TopicContent = {
  l: {
    en: {
      title: "Decimals: place value",
      text: [
        "A decimal is another way to write fractions whose denominator is 10, 100 or 1000. The first digit after the point is tenths, the second hundredths and the third thousandths. 3.47 has 3 ones, 4 tenths and 7 hundredths: 3.47 = 3 + 4/10 + 7/100 = 3 47/100.",
        "To compare decimals, compare digit by digit from the biggest place: wholes first, then tenths, then hundredths. 0.5 is more than 0.45, because 5 tenths are more than 4 tenths — the length of the number does not decide. Zeros at the end, after the decimal point, change nothing: 0.5 = 0.50. To round to tenths, look at the hundredths: 5 or more rounds up, less than 5 rounds down, so 2.36 ≈ 2.4 and 2.34 ≈ 2.3.",
      ],
      example: "Example: order from smallest to biggest: 0.7, 0.07, 0.69. Give them the same number of digits: 0.70, 0.07, 0.69. Now compare them as hundredths: 70, 7 and 69. The order is 0.07, 0.69, 0.7. Notice that 0.69 is less than 0.7 even though it has more digits.",
      task: "Find three things at home with a price in shekels and agorot (for example 4.90 shekels). Write the prices down and order them from cheapest to most expensive. Round each price to the nearest whole shekel and add up the rounded prices: about how much do the three cost together?",
    },
    he: {
      title: "מספרים עשרוניים: ערך המקום",
      text: [
        "מספר עשרוני הוא דרך אחרת לכתוב שברים שהמכנה שלהם 10, 100 או 1000. הספרה הראשונה אחרי הנקודה היא עשיריות, השנייה מאיות והשלישית אלפיות. ב־3.47 יש 3 אחדות, 4 עשיריות ו־7 מאיות: 3.47 = 3 + 4/10 + 7/100 = 3 47/100.",
        "כדי להשוות מספרים עשרוניים משווים ספרה אחר ספרה מהמקום הגדול ביותר: קודם השלמים, אחר כך העשיריות ואז המאיות. 0.5 יותר מ־0.45, כי 5 עשיריות הן יותר מ־4 עשיריות — אורך המספר לא קובע. אפסים בסוף, אחרי הנקודה, לא משנים דבר: 0.5 = 0.50. בעיגול לעשיריות מסתכלים על המאיות: 5 ומעלה — מעגלים למעלה, פחות מ־5 — למטה. לכן 2.36 ≈ 2.4 ו־2.34 ≈ 2.3.",
      ],
      example: "דוגמה: סדרו מהקטן לגדול: 0.7, 0.07, 0.69. משלימים לאותו מספר ספרות: 0.70, 0.07, 0.69. עכשיו משווים אותם כמאיות: 70, 7 ו־69. הסדר הוא 0.07, 0.69, 0.7. שימו לב: 0.69 קטן מ־0.7, אף שיש בו יותר ספרות.",
      task: "מצאו בבית שלושה מוצרים עם מחיר בשקלים ובאגורות (למשל 4.90 ש״ח). כתבו את המחירים וסדרו אותם מהזול ליקר. עגלו כל מחיר לשקל השלם הקרוב, וחברו את המחירים המעוגלים: בערך כמה עולים שלושתם ביחד?",
    },
  },
  b: {
    t: [
      ["Tenth", "one of ten equal parts of a whole, written 0.1", "עשירית", "אחד מעשרה חלקים שווים של שלם, נכתב 0.1"],
      ["Hundredth", "one of a hundred equal parts of a whole, written 0.01", "מאית", "אחד ממאה חלקים שווים של שלם, נכתב 0.01"],
    ],
    q: [
      [["How do you write 7 tenths as a decimal?", "0.7", ["0.07", "7.0", "0.17"], "The first digit after the point is the tenths, so 7 tenths is 0.7. 0.07 is 7 hundredths, ten times smaller."],
        ["איך כותבים 7 עשיריות כמספר עשרוני?", "0.7", ["0.07", "7.0", "0.17"], "הספרה הראשונה אחרי הנקודה היא העשיריות, ולכן 7 עשיריות הן 0.7. 0.07 הוא 7 מאיות, קטן פי עשרה."]],
      [["In 5.38, what is the value of the digit 8?", "8 hundredths", ["8 tenths", "8 thousandths", "8 ones"], "In 5.38, 5 is the ones, 3 is the tenths and 8, the second digit after the point, is the hundredths: 5.38 = 5 + 3/10 + 8/100."],
        ["במספר 5.38, מה הערך של הספרה 8?", "8 מאיות", ["8 עשיריות", "8 אלפיות", "8 אחדות"], "ב־5.38 הספרה 5 היא האחדות, 3 היא העשיריות, ו־8, הספרה השנייה אחרי הנקודה, היא המאיות: 5.38 = 5 + 3/10 + 8/100."]],
      [["Which is bigger: 0.8 or 0.75?", "0.8", ["0.75", "They are equal"], "Compare the tenths first: 0.8 has 8 tenths and 0.75 has 7. So 0.8 is bigger, even with fewer digits — 0.8 = 0.80."],
        ["מה גדול יותר: 0.8 או 0.75?", "0.8", ["0.75", "הם שווים"], "משווים קודם את העשיריות: ב־0.8 יש 8 עשיריות וב־0.75 יש 7. לכן 0.8 גדול יותר, אף שיש בו פחות ספרות — 0.8 = 0.80."]],
      [["Which decimal is equal to 3/10?", "0.3", ["0.03", "3.10", "3.0"], "3/10 is 3 tenths, written 0.3. 0.03 is 3 hundredths, and 3.10 and 3.0 are 3 wholes or more."],
        ["איזה מספר עשרוני שווה ל־3/10?", "0.3", ["0.03", "3.10", "3.0"], "3/10 הן 3 עשיריות, שנכתבות 0.3. 0.03 הן 3 מאיות, ו־3.10 ו־3.0 הם 3 שלמים או יותר."]],
      [["What is 4.57 rounded to the nearest tenth?", "4.6", ["4.5", "5.0", "4.0"], "Look at the hundredths digit: 7 is 5 or more, so the tenths go up from 5 to 6. 4.57 is closer to 4.6 than to 4.5."],
        ["כמה זה 4.57 בעיגול לעשיריות?", "4.6", ["4.5", "5.0", "4.0"], "מסתכלים על ספרת המאיות: 7 הוא 5 ומעלה, ולכן העשיריות עולות מ־5 ל־6. 4.57 קרוב יותר ל־4.6 מאשר ל־4.5."]],
    ],
    n: [
      [25, ["How many hundredths are there in 0.25?", "", "0.25 is 2 tenths and 5 hundredths, and 2 tenths are 20 hundredths: 20 + 5 = 25 hundredths, that is 25/100."], ["כמה מאיות יש ב־0.25?", "", "0.25 הן 2 עשיריות ו־5 מאיות, ו־2 עשיריות הן 20 מאיות: 20 + 5 = 25 מאיות, כלומר 25/100."]],
      [10, ["How many tenths make 1 whole?", "", "Ten tenths make one whole: 10 × 0.1 = 1, just as 10/10 = 1."], ["כמה עשיריות יש בשלם אחד?", "", "עשר עשיריות הן שלם אחד: 10 × 0.1 = 1, בדיוק כמו 10/10 = 1."]],
      [7, ["Round 6.8 to the nearest whole number.", "", "The tenths digit is 8, which is 5 or more, so round up: 6.8 is closer to 7 than to 6."], ["עגלו את 6.8 למספר השלם הקרוב.", "", "ספרת העשיריות היא 8, שזה 5 ומעלה, ולכן מעגלים למעלה: 6.8 קרוב יותר ל־7 מאשר ל־6."]],
    ],
  },
  i: {
    t: [
      ["Thousandth", "one of a thousand equal parts of a whole, written 0.001", "אלפית", "אחד מאלף חלקים שווים של שלם, נכתב 0.001"],
      ["Place value", "the worth of a digit because of where it stands in the number", "ערך המקום", "השווי של ספרה לפי המיקום שלה במספר"],
    ],
    q: [
      [["Which is the smallest?", "0.099", ["0.1", "0.11", "0.19"], "Compare the tenths: 0.099 has 0 tenths and the others have 1. So 0.099 is the smallest, even though it has the most digits."],
        ["מה הכי קטן?", "0.099", ["0.1", "0.11", "0.19"], "משווים את העשיריות: ב־0.099 יש 0 עשיריות, ובשאר יש 1. לכן 0.099 הוא הקטן ביותר, אף שיש בו הכי הרבה ספרות."]],
      [["What is 0.6 as a fraction?", "6/10", ["6/100", "1/6", "60/10"], "The 6 is in the tenths place, so 0.6 = 6/10, which simplifies to 3/5."],
        ["איך כותבים 0.6 כשבר?", "6/10", ["6/100", "1/6", "60/10"], "הספרה 6 נמצאת במקום העשיריות, ולכן 0.6 = 6/10, ואפשר לצמצם ל־3/5."]],
      [["Which number has 4 in the thousandths place?", "2.014", ["2.041", "2.401", "4.012"], "The third digit after the point is the thousandths: in 2.014 it is 4. In 2.041 the 4 is hundredths, in 2.401 tenths, and in 4.012 ones."],
        ["באיזה מספר הספרה 4 נמצאת במקום האלפיות?", "2.014", ["2.041", "2.401", "4.012"], "הספרה השלישית אחרי הנקודה היא האלפיות: ב־2.014 זו 4. ב־2.041 ה־4 היא מאיות, ב־2.401 עשיריות, וב־4.012 אחדות."]],
      [["Round 3.849 to the nearest hundredth.", "3.85", ["3.84", "3.8", "3.9"], "The hundredths digit is 4 and the next digit, the thousandths, is 9, which is 5 or more, so the 4 goes up to 5: 3.85."],
        ["עגלו את 3.849 למאיות.", "3.85", ["3.84", "3.8", "3.9"], "ספרת המאיות היא 4, והספרה שאחריה, האלפיות, היא 9, שזה 5 ומעלה, ולכן ה־4 עולה ל־5: 3.85."]],
      [["Which number is equal to 0.40?", "0.4", ["0.04", "0.404", "4.0"], "A zero at the end after the point changes nothing: 0.40 = 40/100 = 4/10 = 0.4. 0.04 is ten times smaller."],
        ["איזה מספר שווה ל־0.40?", "0.4", ["0.04", "0.404", "4.0"], "אפס בסוף, אחרי הנקודה, לא משנה דבר: 0.40 = 40/100 = 4/10 = 0.4. 0.04 קטן פי עשרה."]],
    ],
    n: [
      [5, ["2.35 = 2 + 3/10 + x/100. What is x?", "", "2.35 has 2 ones, 3 tenths and 5 hundredths: 2.35 = 2 + 3/10 + 5/100."], ["2.35 = 2 + 3/10 + x/100. מהו x?", "", "ב־2.35 יש 2 אחדות, 3 עשיריות ו־5 מאיות: 2.35 = 2 + 3/10 + 5/100."]],
      [100, ["How many thousandths are there in 0.1?", "", "0.1 = 0.100 = 100 thousandths, because one tenth is a hundred thousandths: 1/10 = 100/1000."], ["כמה אלפיות יש ב־0.1?", "", "0.1 = 0.100 = 100 אלפיות, כי עשירית אחת היא מאה אלפיות: 1/10 = 100/1000."]],
      [12, ["Round 12.46 to the nearest whole number.", "", "Look at the tenths: 4 is less than 5, so round down. 12.46 is closer to 12 than to 13."], ["עגלו את 12.46 למספר השלם הקרוב.", "", "מסתכלים על העשיריות: 4 פחות מ־5, ולכן מעגלים למטה. 12.46 קרוב יותר ל־12 מאשר ל־13."]],
    ],
    s: [[["Put in order from smallest to biggest", "0.09", "0.3", "0.35", "0.5"], ["סדרו מהקטן לגדול", "0.09", "0.3", "0.35", "0.5"]]],
  },
  a: {
    t: [
      ["Rounding", "replacing a number with a nearby, simpler one, like 4.97 with 5", "עיגול", "החלפה של מספר במספר קרוב ופשוט יותר, כמו 4.97 ב־5"],
      ["Estimate", "a quick answer close to the exact one, found with rounded numbers", "אומדן", "תשובה מהירה שקרובה לתשובה המדויקת, ומוצאים אותה בעזרת מספרים מעוגלים"],
    ],
    q: [
      [["Which number is between 0.3 and 0.4?", "0.35", ["0.29", "0.405", "0.04"], "0.3 = 0.30 and 0.4 = 0.40, and 0.35 is between 0.30 and 0.40. 0.29 is a little less than 0.3, and 0.405 a little more than 0.4."],
        ["איזה מספר נמצא בין 0.3 ל־0.4?", "0.35", ["0.29", "0.405", "0.04"], "0.3 = 0.30 ו־0.4 = 0.40, ו־0.35 נמצא בין 0.30 ל־0.40. 0.29 קצת פחות מ־0.3, ו־0.405 קצת יותר מ־0.4."]],
      [["Round 9.96 to the nearest tenth.", "10.0", ["9.9", "9.10", "9.0"], "The hundredths digit is 6, so the tenths go up: 9 tenths and 1 more are 10 tenths, which is one more whole. So 9.96 ≈ 10.0."],
        ["עגלו את 9.96 לעשיריות.", "10.0", ["9.9", "9.10", "9.0"], "ספרת המאיות היא 6, ולכן העשיריות עולות: 9 עשיריות ועוד 1 הן 10 עשיריות, שזה עוד שלם אחד. לכן 9.96 ≈ 10.0."]],
      [["Which estimate is closest to 4.92 + 3.1?", "8", ["7", "9", "10"], "Round each number to the nearest whole: 4.92 ≈ 5 and 3.1 ≈ 3, and 5 + 3 = 8. The exact sum is 8.02."],
        ["איזה אומדן הכי קרוב ל־4.92 + 3.1?", "8", ["7", "9", "10"], "מעגלים כל מספר לשלם הקרוב: 4.92 ≈ 5 ו־3.1 ≈ 3, ו־5 + 3 = 8. הסכום המדויק הוא 8.02."]],
      [["Price tags read 12.90, 12.09, 12.9 and 12.19 shekels. Which two show the same price?", "12.90 and 12.9", ["12.09 and 12.9", "12.19 and 12.90", "12.09 and 12.19"], "A zero at the end after the point changes nothing, so 12.90 = 12.9. 12.09 has 0 tenths and 9 hundredths, so it is less."],
        ["על תוויות מחיר כתוב 12.90, 12.09, 12.9 ו־12.19 ש״ח. אילו שתיים מראות אותו מחיר?", "12.90 ו־12.9", ["12.09 ו־12.9", "12.19 ו־12.90", "12.09 ו־12.19"], "אפס בסוף, אחרי הנקודה, לא משנה דבר, ולכן 12.90 = 12.9. ב־12.09 יש 0 עשיריות ו־9 מאיות, ולכן הוא קטן יותר."]],
      [["A runner's times were 12.4 s, 12.37 s and 12.09 s. Which is the fastest, that is, the shortest time?", "12.09 s", ["12.4 s", "12.37 s"], "The wholes are the same, so compare the tenths: 0, 3 and 4. 12.09 has the fewest tenths, so it is the shortest time."],
        ["זמני הריצה של אצן היו 12.4, 12.37 ו־12.09 שניות. איזה זמן הוא המהיר ביותר, כלומר הקצר ביותר?", "12.09 שניות", ["12.4 שניות", "12.37 שניות"], "השלמים שווים, ולכן משווים את העשיריות: 0, 3 ו־4. ב־12.09 יש הכי מעט עשיריות, ולכן זה הזמן הקצר ביותר."]],
    ],
    n: [
      [7.5, ["Round 7.495 to the nearest hundredth.", "", "The thousandths digit is 5, so the 9 hundredths go up to 10 hundredths: 7.495 ≈ 7.50, which is 7.5."], ["עגלו את 7.495 למאיות.", "", "ספרת האלפיות היא 5, ולכן 9 המאיות עולות ל־10 מאיות: 7.495 ≈ 7.50, שזה 7.5."]],
      [7, ["How many numbers with two digits after the point are between 0.41 and 0.49, not counting these two?", "", "Between 0.41 and 0.49 are 0.42, 0.43, 0.44, 0.45, 0.46, 0.47 and 0.48: that is 7 numbers."], ["כמה מספרים עם שתי ספרות אחרי הנקודה נמצאים בין 0.41 ל־0.49, בלי לספור את שניהם?", "", "בין 0.41 ל־0.49 נמצאים 0.42, 0.43, 0.44, 0.45, 0.46, 0.47 ו־0.48: אלה 7 מספרים."]],
      [3.45, ["What is the smallest number with two digits after the point that rounds to 3.5 (to the nearest tenth)?", "", "Numbers from 3.45 up to 3.54 round to 3.5. The smallest with two digits after the point is 3.45, because 3.44 rounds down to 3.4."], ["מהו המספר הקטן ביותר עם שתי ספרות אחרי הנקודה שמתעגל ל־3.5 (בעיגול לעשיריות)?", "", "המספרים מ־3.45 עד 3.54 מתעגלים ל־3.5. הקטן ביותר עם שתי ספרות אחרי הנקודה הוא 3.45, כי 3.44 מתעגל למטה ל־3.4."]],
    ],
  },
};
export default c;
