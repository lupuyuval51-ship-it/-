import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Exponential growth", "change in which a quantity is multiplied by the same number, greater than 1, in each equal time step", "גדילה מעריכית", "שינוי שבו כמות מוכפלת באותו מספר, גדול מ־1, בכל פרק זמן שווה"],
      ["Exponential decay", "change in which a quantity is multiplied by the same number between 0 and 1 in each equal time step", "דעיכה מעריכית", "שינוי שבו כמות מוכפלת באותו מספר שבין 0 ל־1 בכל פרק זמן שווה"],
      ["Half-life", "the time it takes a decaying quantity to fall to half of its amount", "זמן מחצית חיים", "הזמן שבו כמות דועכת יורדת לחצי מהגודל שלה"],
    ],
    q: [
      [["Which sequence shows exponential growth?", "3, 6, 12, 24, 48", ["3, 6, 9, 12, 15", "48, 24, 12, 6, 3", "3, 5, 7, 9, 11"], "Each term is the one before it multiplied by 2, the same factor every time. In 3, 6, 9, 12, 15 the same amount, 3, is added each time: that is linear growth."],
        ["איזו סדרה מראה גדילה מעריכית?", "3, 6, 12, 24, 48", ["3, 6, 9, 12, 15", "48, 24, 12, 6, 3", "3, 5, 7, 9, 11"], "כל איבר הוא האיבר הקודם כפול 2, אותו מספר בכל פעם. בסדרה 3, 6, 9, 12, 15 מוסיפים בכל פעם אותה כמות, 3: זו גדילה קווית."]],
      [["A quantity is multiplied by 0.5 every day. What kind of change is this?", "Exponential decay", ["Exponential growth", "Linear decay", "No change at all"], "Multiplying by a number between 0 and 1 makes the quantity smaller by the same fraction every day. Here it halves each day, which is exponential decay."],
        ["כמות מוכפלת ב־0.5 בכל יום. איזה סוג של שינוי זה?", "דעיכה מעריכית", ["גדילה מעריכית", "דעיכה קווית", "אין שום שינוי"], "כפל במספר שבין 0 ל־1 מקטין את הכמות באותו שיעור בכל יום. כאן היא נחצית בכל יום, וזו דעיכה מעריכית."]],
      [["What is 2¹⁰?", "1024", ["512", "1000", "20"], "Double ten times: 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024. So 2¹⁰ = 1024, a little more than a thousand."],
        ["כמה זה 2¹⁰?", "1024", ["512", "1000", "20"], "מכפילים ב־2 עשר פעמים: 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024. לכן 2¹⁰ = 1024, קצת יותר מאלף."]],
      [["A town grows by 10% every year. By which number is its population multiplied each year?", "1.1", ["0.1", "1.01", "10"], "Growing by 10% means keeping the 100% you had and adding 10%: 110% = 1.1. Multiplying by 0.1 would leave only a tenth of the town."],
        ["עיר גדלה ב־10% בכל שנה. באיזה מספר מוכפלת האוכלוסייה שלה בכל שנה?", "1.1", ["0.1", "1.01", "10"], "גדילה של 10% פירושה לשמור על כל מה שהיה, 100%, ולהוסיף 10%, ובסך הכול 110% = 1.1. כפל ב־0.1 היה משאיר רק עשירית מהעיר."]],
      [["A radioactive substance has a half-life of 4 days. What fraction of it is left after 8 days?", "1/4", ["0", "1/8", "1/2"], "8 days are two half-lives: half is left after 4 days, and half of that half, 1/4, after 8 days. It does not all disappear, because each half-life removes half of what is left, not a fixed amount."],
        ["לחומר רדיואקטיבי יש זמן מחצית חיים של 4 ימים. איזה חלק ממנו נשאר אחרי 8 ימים?", "1/4", ["0", "1/8", "1/2"], "8 ימים הם שני זמני מחצית חיים: אחרי 4 ימים נשאר חצי, ואחרי 8 ימים נשאר חצי מהחצי, כלומר 1/4. החומר לא נעלם כולו, כי בכל זמן מחצית חיים נעלם חצי ממה שנשאר, ולא כמות קבועה."]],
    ],
    n: [
      [32, ["Bacteria split in two every hour. Starting with one bacterium, how many are there after 5 hours?", "", "The number doubles 5 times: 2 × 2 × 2 × 2 × 2 = 2⁵ = 32."],
        ["כל חיידק מתחלק לשניים בכל שעה. אם מתחילים בחיידק אחד, כמה חיידקים יש אחרי 5 שעות?", "", "המספר מוכפל ב־2 חמש פעמים: 2 × 2 × 2 × 2 × 2 = 2⁵ = 32."]],
      [10, ["An amount of 80 g of a substance halves every week. How many grams are left after 3 weeks?", "g", "80, then 40, then 20, then 10: after 3 halvings 10 g are left, because 80 × (1/2)³ = 80 ÷ 8 = 10."],
        ["כמות של 80 גרם מחומר מסוים נחצית בכל שבוע. כמה גרם נשארים אחרי 3 שבועות?", "גרם", "מ־80 ל־40, אחר כך ל־20 ואז ל־10: אחרי 3 חציות נשארים 10 גרם, כי 80 × (1/2)³ = 80 ÷ 8 = 10."]],
    ],
  },
  i: {
    t: [
      ["Growth factor", "the number a quantity is multiplied by in each time step; for growth of r% it is 1 + r/100", "מקדם גדילה", "המספר שבו כופלים כמות בכל פרק זמן; בגדילה של r% הוא 1 + r/100"],
      ["Initial value", "the amount at the start, when t = 0; in y = a·bᵗ it is the number a", "ערך התחלתי", "הכמות בהתחלה, כאשר t = 0; ב־y = a·bᵗ זה המספר a"],
      ["Compound interest", "interest added to the money at the end of each period, so the next interest is worked out on a bigger amount", "ריבית דריבית", "ריבית שמצטרפת לכסף בסוף כל תקופה, כך שהריבית הבאה מחושבת על סכום גדול יותר"],
      ["Doubling time", "the time it takes a growing quantity to become twice as large", "זמן הכפלה", "הזמן שלוקח לכמות שגדלה להיות פי 2 ממה שהייתה"],
    ],
    q: [
      [["A town of 500 people grows by 4% every year. Which formula gives its population after t years?", "P = 500 × 1.04ᵗ", ["P = 500 × 0.04ᵗ", "P = 500 + 4t", "P = 500 × 4ᵗ"], "Each year the population is multiplied by 100% + 4% = 1.04, so t years multiply it by 1.04ᵗ. Multiplying by 0.04 would shrink it to 4% of its size every year."],
        ["ביישוב יש 500 אנשים, ומספרם גדל ב־4% בכל שנה. איזו נוסחה נותנת את מספר התושבים אחרי t שנים?", "P = 500 × 1.04ᵗ", ["P = 500 × 0.04ᵗ", "P = 500 + 4t", "P = 500 × 4ᵗ"], "בכל שנה האוכלוסייה מוכפלת ב־100% + 4% = 1.04, ולכן אחרי t שנים היא מוכפלת ב־1.04ᵗ. כפל ב־0.04 היה מקטין אותה ל־4% מגודלה בכל שנה."]],
      [["Plan A pays you 100 coins every day. Plan B pays 1 coin on day 1 and doubles the payment every day. On which day is plan B's payment bigger than plan A's for the first time?", "Day 8", ["Day 7", "Day 50", "Day 100"], "Plan B pays 1, 2, 4, 8, 16, 32 and 64 on days 1 to 7, and 128 on day 8. Exponential growth starts slowly but soon overtakes any fixed amount."],
        ["תוכנית א׳ משלמת 100 מטבעות בכל יום. תוכנית ב׳ משלמת מטבע אחד ביום הראשון ומכפילה את התשלום בכל יום. באיזה יום התשלום של תוכנית ב׳ גדול מזה של תוכנית א׳ בפעם הראשונה?", "ביום ה־8", ["ביום ה־7", "ביום ה־50", "ביום ה־100"], "תוכנית ב׳ משלמת 1, 2, 4, 8, 16, 32 ו־64 בימים 1 עד 7, ו־128 ביום ה־8. גדילה מעריכית מתחילה לאט, אבל מהר מאוד עוקפת כל סכום קבוע."]],
      [["A car loses 15% of its value every year. After 2 years, about what percentage of its value is left?", "About 72%", ["Exactly 70%", "About 85%", "Exactly 30%"], "Each year the value is multiplied by 0.85, so after 2 years by 0.85² = 0.7225, about 72%. It is more than 70% because the second year's 15% is taken from a smaller value."],
        ["מכונית מאבדת 15% מערכה בכל שנה. אחרי שנתיים, בערך כמה אחוזים מערכה נשארו?", "בערך 72%", ["בדיוק 70%", "בערך 85%", "בדיוק 30%"], "בכל שנה הערך מוכפל ב־0.85, ולכן אחרי שנתיים ב־0.85² = 0.7225, כלומר בערך 72%. זה יותר מ־70%, כי ה־15% של השנה השנייה נלקחים מערך קטן יותר."]],
      [["Which grows faster in the long run: y = 100x or y = 2ˣ?", "y = 2ˣ", ["y = 100x", "They grow at the same rate", "It depends only on the starting value"], "For small x, 100x is larger (at x = 5: 500 against 32), but 2ˣ doubles with each step. From x = 10 on (1024 against 1000) the exponential is ahead, and the gap keeps widening."],
        ["מה גדל מהר יותר בטווח הארוך: y = 100x או y = 2ˣ?", "y = 2ˣ", ["y = 100x", "שתיהן גדלות באותו קצב", "זה תלוי רק בערך ההתחלתי"], "כש־x קטן, 100x גדול יותר (כש־x = 5 מקבלים 500 לעומת 32), אבל 2ˣ מוכפל בכל צעד. החל מ־x = 10 (1024 לעומת 1000) הפונקציה המעריכית מקדימה, והפער רק גדל."]],
      [["A population doubles every 3 years. By what factor does it grow in 12 years?", "16", ["8", "4", "24"], "12 years are 12 ÷ 3 = 4 doubling times, so the population grows 2⁴ = 16 times, not 4 times."],
        ["אוכלוסייה מוכפלת כל 3 שנים. פי כמה היא גדלה בתוך 12 שנים?", "פי 16", ["פי 8", "פי 4", "פי 24"], "12 שנים הן 12 ÷ 3 = 4 זמני הכפלה, ולכן האוכלוסייה גדלה פי 2⁴ = 16, ולא פי 4."]],
    ],
    n: [
      [1210, ["You put 1000 shekels in the bank at 10% compound interest a year. How much is there after 2 years?", "shekels", "1000 × 1.1 = 1100 after one year, and 1100 × 1.1 = 1210 after two: the second year's interest is paid on 1100, not on 1000."],
        ["מפקידים 1000 שקלים בבנק בריבית דריבית של 10% בשנה. כמה כסף יש אחרי שנתיים?", "שקלים", "אחרי שנה יש 1000 × 1.1 = 1100, ואחרי שנתיים 1100 × 1.1 = 1210: הריבית של השנה השנייה משולמת על 1100 ולא על 1000."]],
      [25, ["y = 200 × 0.5ᵗ. What is y when t = 3?", "", "0.5³ = 0.125, and 200 × 0.125 = 25. The amount halves three times: 200, 100, 50, 25."],
        ["y = 200 × 0.5ᵗ. כמה זה y כש־t = 3?", "", "מכיוון ש־0.5³ = 0.125, מקבלים 200 × 0.125 = 25. הכמות נחצית שלוש פעמים: 200, 100, 50, 25."]],
    ],
  },
  a: {
    t: [
      ["Exponential function", "a function of the form y = a·bˣ, with the variable in the exponent", "פונקציה מעריכית", "פונקציה מהצורה y = a·bˣ, שבה המשתנה נמצא במעריך"],
      ["Asymptote", "a line that a graph gets closer and closer to without ever reaching it, like y = 0 for y = 2ˣ", "אסימפטוטה", "ישר שגרף מתקרב אליו יותר ויותר בלי להגיע אליו אף פעם, כמו y = 0 בגרף של y = 2ˣ"],
      ["Rule of 70", "a quick estimate: something growing by r% a year doubles in about 70 ÷ r years", "כלל ה־70", "הערכה מהירה: משהו שגדל ב־r% בשנה מוכפל בערך בתוך 70 ÷ r שנים"],
    ],
    q: [
      [["A quantity grows from 50 to 450 in 2 years, multiplied by the same factor each year. What is the yearly factor?", "3", ["9", "4.5", "200"], "50 × b² = 450, so b² = 9 and b = 3: 50, then 150, then 450. 9 is the factor for both years together, and 200 is what would be added each year in a linear model."],
        ["כמות גדלה מ־50 ל־450 בתוך שנתיים, ובכל שנה היא מוכפלת באותו מספר. מהו המקדם השנתי?", "3", ["9", "4.5", "200"], "מ־50 × b² = 450 מקבלים b² = 9 ו־b = 3: מ־50 ל־150 ואז ל־450. המספר 9 הוא המקדם של שתי השנים יחד, ו־200 הוא מה שהיו מוסיפים בכל שנה במודל קווי."]],
      [["Which function passes through (0, 5) and halves for every step of 1 to the right?", "y = 5 × 0.5ˣ", ["y = 0.5 × 5ˣ", "y = 5 − 0.5x", "y = 5 × 2ˣ"], "At x = 0 the value is the initial value, 5, because 0.5⁰ = 1, and each step to the right multiplies it by 0.5. y = 5 × 2ˣ doubles instead, and y = 5 − 0.5x falls by the same amount each step."],
        ["איזו פונקציה ערכה 5 כש־x שווה 0, ונחצית בכל צעד של 1 ימינה?", "y = 5 × 0.5ˣ", ["y = 0.5 × 5ˣ", "y = 5 − 0.5x", "y = 5 × 2ˣ"], "ב־x = 0 הערך הוא הערך ההתחלתי, 5, כי 0.5⁰ = 1, וכל צעד ימינה כופל אותו ב־0.5. הפונקציה y = 5 × 2ˣ מוכפלת במקום להיחצות, ו־y = 5 − 0.5x יורדת באותה כמות בכל צעד."]],
      [["Why does the graph of y = 2ˣ never touch the x-axis?", "Its values are always positive: they halve with each step left but never reach 0", ["For negative x its values turn negative, so the graph jumps across the axis", "The function is defined only for positive x, so the graph stops early", "It does touch it, at the point (0, 0)"], "Each step to the left halves the value: 1, 1/2, 1/4, 1/8 and so on. The values come as close to 0 as you like but stay positive, so y = 0 is an asymptote. At x = 0 the value is 2⁰ = 1, not 0."],
        ["למה הגרף של y = 2ˣ אף פעם לא נוגע בציר x?", "הערכים שלו תמיד חיוביים: בכל צעד שמאלה הם נחצים, אבל אף פעם לא מגיעים ל־0", ["כש־x שלילי הערכים נעשים שליליים, ולכן הגרף קופץ לצד השני של הציר", "הפונקציה מוגדרת רק כש־x חיובי, ולכן הגרף נעצר מוקדם", "הוא כן נוגע בו, בראשית הצירים"], "כל צעד שמאלה חוצה את הערך: 1, 1/2, 1/4, 1/8 וכן הלאה. הערכים מתקרבים ל־0 ככל שרוצים אבל נשארים חיוביים, ולכן y = 0 היא אסימפטוטה. ב־x = 0 הערך הוא 2⁰ = 1, ולא 0."]],
      [["Investment A earns 10% simple interest a year; investment B earns 8% compound interest a year. Starting with the same amount, which is worth more after 30 years?", "B, about 10 times the start against 4 times", ["A, about 4 times the start against 3.4 times", "They are worth exactly the same", "A, because 10% is always more than 8%"], "A grows by 10% of the starting amount each year: 1 + 30 × 0.1 = 4 times. B is multiplied by 1.08 each year: 1.08³⁰ ≈ 10.1 times. Over a long time, compounding beats a higher simple rate."],
        ["השקעה א׳ נותנת ריבית פשוטה של 10% בשנה, והשקעה ב׳ נותנת ריבית דריבית של 8% בשנה. אם מתחילים באותו סכום, איזו שווה יותר אחרי 30 שנה?", "ב׳, בערך פי 10 מההתחלה לעומת פי 4", ["א׳, בערך פי 4 מההתחלה לעומת פי 3.4", "שתיהן שוות בדיוק אותו דבר", "א׳, כי 10% תמיד יותר מ־8%"], "השקעה א׳ גדלה בכל שנה ב־10% מהסכום ההתחלתי: 1 + 30 × 0.1 = 4, כלומר פי 4. השקעה ב׳ מוכפלת בכל שנה ב־1.08, ובסך הכול 1.08³⁰ ≈ 10.1, כלומר בערך פי 10. לאורך זמן רב ריבית דריבית מנצחת ריבית פשוטה גבוהה יותר."]],
      [["Which is the best estimate of the doubling time for growth of 7% a year?", "About 10 years", ["About 14 years", "About 7 years", "About 70 years"], "By the rule of 70, the doubling time is about 70 ÷ 7 = 10 years. Check: 1.07¹⁰ ≈ 1.97, almost exactly double."],
        ["מהי ההערכה הטובה ביותר לזמן ההכפלה בגדילה של 7% בשנה?", "בערך 10 שנים", ["בערך 14 שנים", "בערך 7 שנים", "בערך 70 שנה"], "לפי כלל ה־70, זמן ההכפלה הוא בערך 70 ÷ 7 = 10 שנים. בדיקה: 1.07¹⁰ ≈ 1.97, כמעט בדיוק פי 2."]],
      [["An app's users go 1000, 1500, 2250, 3375 in successive months. What is the monthly growth rate?", "50%", ["500 users a month", "150%", "33%"], "Each month is 1.5 times the month before (1500 ÷ 1000 = 2250 ÷ 1500 = 1.5), so the growth rate is 50% a month. The number of new users is not fixed: 500, then 750, then 1125."],
        ["מספר המשתמשים באפליקציה הוא 1000, 1500, 2250 ו־3375 בחודשים רצופים. מהו קצב הגדילה החודשי?", "50%", ["500 משתמשים בחודש", "150%", "33%"], "כל חודש הוא פי 1.5 מהחודש הקודם (1500 ÷ 1000 = 2250 ÷ 1500 = 1.5), ולכן קצב הגדילה הוא 50% בחודש. מספר המשתמשים החדשים לא קבוע: 500, אחר כך 750, ואחר כך 1125."]],
    ],
    n: [
      [7, ["After how many whole half-lives is less than 1% of a radioactive sample left for the first time?", "", "(1/2)⁶ = 1/64 ≈ 1.6%, still more than 1%, but (1/2)⁷ = 1/128 ≈ 0.78%. So 7 half-lives are needed."],
        ["אחרי כמה זמני מחצית חיים שלמים נשאר לראשונה פחות מ־1% מדגימה רדיואקטיבית?", "", "מכיוון ש־(1/2)⁶ = 1/64 ≈ 1.6%, עדיין יותר מ־1%, אבל (1/2)⁷ = 1/128 ≈ 0.78%, צריך 7 זמני מחצית חיים."]],
      [2315, ["A population of 2000 grows by 5% a year. How big is it after 3 years, to the nearest whole number?", "", "2000 × 1.05³ = 2000 × 1.157625 = 2315.25, which rounds to 2315."],
        ["אוכלוסייה של 2000 גדלה ב־5% בשנה. מה גודלה אחרי 3 שנים, בעיגול למספר שלם?", "", "אחרי 3 שנים: 2000 × 1.05³ = 2000 × 1.157625 = 2315.25, ובעיגול 2315."], 0.5],
    ],
    s: [[["Solving 3 × 2ˣ = 96, in order", "Divide both sides by 3: 2ˣ = 32", "Write 32 as a power of 2: 32 = 2⁵", "Compare the exponents: x = 5", "Check: 3 × 2⁵ = 3 × 32 = 96"],
      ["פתרון המשוואה 3 × 2ˣ = 96, לפי הסדר", "מחלקים את שני האגפים ב־3: 2ˣ = 32", "כותבים את 32 כחזקה של 2: 32 = 2⁵", "משווים את המעריכים: x = 5", "בודקים: 3 × 2⁵ = 3 × 32 = 96"]]],
  },
};
export default c;
