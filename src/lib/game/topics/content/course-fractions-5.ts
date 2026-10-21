import type { TopicContent } from "../types";

// Course "Fractions, decimals and percentages" (grades 5–6), chapter 5: multiplying fractions.
const c: TopicContent = {
  l: {
    en: {
      title: "Multiplying fractions",
      text: [
        "Multiplying a fraction by a whole number is repeated addition: 3 × 2/5 = 2/5 + 2/5 + 2/5 = 6/5. Multiply only the numerator: 3 × 2 = 6, and the denominator stays 5. “A fraction of” a number is multiplication too: 2/3 of 12 is 2/3 × 12 = 8.",
        "To multiply a fraction by a fraction, multiply numerator by numerator and denominator by denominator: 2/3 × 3/4 = 6/12 = 1/2. That is “2/3 of 3/4”. Notice: multiplying by a fraction smaller than 1 makes the result smaller than the number you started with — half of 8 is 4, not more than 8.",
      ],
      example: "Example: 3/4 of a garden is planted with flowers, and 1/2 of the flowers are red. What part of the whole garden is red flowers? Work out 1/2 × 3/4: numerator 1 × 3 = 3, denominator 2 × 4 = 8. Answer: 3/8 of the garden. Check: half of 3 quarters is 3 eighths.",
      task: "Draw a rectangle on squared paper, 4 squares wide and 3 squares high. Colour 2/3 of the rows blue, then hatch 3/4 of the columns with lines. How many squares are both blue and hatched? Divide by the number of all the squares (12). Did you get 2/3 × 3/4?",
    },
    he: {
      title: "כפל שברים",
      text: [
        "כפל של שבר במספר שלם הוא חיבור חוזר: 3 × 2/5 = 2/5 + 2/5 + 2/5 = 6/5. כופלים רק את המונה: 3 × 2 = 6, והמכנה נשאר 5. גם ״שבר ממספר״ הוא כפל: 2/3 מ־12 זה 2/3 × 12 = 8.",
        "כדי לכפול שבר בשבר כופלים מונה במונה ומכנה במכנה: 2/3 × 3/4 = 6/12 = 1/2. זה ״2/3 מתוך 3/4״. שימו לב: כשכופלים בשבר קטן מ־1, התוצאה קטנה מהמספר שהתחלנו בו — חצי מ־8 הוא 4, לא יותר מ־8.",
      ],
      example: "דוגמה: ב־3/4 מהגינה נטועים פרחים, ו־1/2 מהפרחים אדומים. איזה חלק מכל הגינה הוא פרחים אדומים? מחשבים 1/2 × 3/4: מונה 1 × 3 = 3, מכנה 2 × 4 = 8. תשובה: 3/8 מהגינה. בדיקה: חצי משלושה רבעים הוא שלוש שמיניות.",
      task: "ציירו על דף משבצות מלבן ברוחב 4 משבצות ובגובה 3 משבצות. צבעו בכחול 2/3 מהשורות, ואז סמנו בקווים 3/4 מהעמודות. כמה משבצות גם כחולות וגם מסומנות? חלקו במספר כל המשבצות (12). האם קיבלתם 2/3 × 3/4?",
    },
  },
  b: {
    t: [
      ["Product", "the result of multiplying numbers", "מכפלה", "התוצאה של כפל מספרים"],
      ["Repeated addition", "adding the same number again and again, like 2/5 + 2/5 + 2/5", "חיבור חוזר", "הוספה של אותו מספר שוב ושוב, כמו 2/5 + 2/5 + 2/5"],
    ],
    q: [
      [["What is 3 × 2/5?", "6/5", ["6/15", "5/5", "2/15"], "3 × 2/5 means 2/5 + 2/5 + 2/5. Multiply only the numerator: 3 × 2 = 6, so 6/5 (= 1 1/5). The denominator does not change."],
        ["כמה זה 3 × 2/5?", "6/5", ["6/15", "5/5", "2/15"], "3 × 2/5 פירושו 2/5 + 2/5 + 2/5. כופלים רק את המונה: 3 × 2 = 6, ולכן 6/5 (= 1 1/5). המכנה לא משתנה."]],
      [["What is 4 × 1/8?", "4/8", ["4/32", "5/8", "1/32"], "Four eighths: 4 × 1 = 4 and the eighths stay, so 4 × 1/8 = 4/8, which is one half."],
        ["כמה זה 4 × 1/8?", "4/8", ["4/32", "5/8", "1/32"], "ארבע שמיניות: 4 × 1 = 4 והשמיניות נשארות, ולכן 4 × 1/8 = 4/8, וזה חצי."]],
      [["Which calculation is the same as “2/3 of 9”?", "2/3 × 9", ["2/3 + 9", "9 − 2/3", "9 ÷ 3 + 2"], "“A fraction of a number” means multiplying: 2/3 of 9 = 2/3 × 9 = 18/3 = 6."],
        ["איזה תרגיל זהה ל־״2/3 מ־9״?", "2/3 × 9", ["2/3 + 9", "9 − 2/3", "9 ÷ 3 + 2"], "״שבר ממספר״ פירושו כפל: 2/3 מ־9 = 2/3 × 9 = 18/3 = 6."]],
      [["A glass holds 1/4 litre. How much do 6 glasses hold?", "6/4 litre", ["6/24 litre", "7/4 litre", "1/24 litre"], "6 × 1/4 = 6/4 litre, which is 1 2/4 = 1 1/2 litres. Only the numerator is multiplied."],
        ["כוס מחזיקה 1/4 ליטר. כמה מחזיקות 6 כוסות?", "6/4 ליטר", ["6/24 ליטר", "7/4 ליטר", "1/24 ליטר"], "6 × 1/4 = 6/4 ליטר, שזה 1 2/4 = 1 1/2 ליטר. כופלים רק את המונה."]],
      [["Is 5 × 3/4 more or less than 5?", "Less than 5", ["More than 5", "Exactly 5"], "3/4 is less than 1, so 5 × 3/4 is less than 5 × 1 = 5. It is 15/4 = 3 3/4."],
        ["האם 5 × 3/4 גדול מ־5 או קטן מ־5?", "קטן מ־5", ["גדול מ־5", "בדיוק 5"], "3/4 קטן מ־1, ולכן 5 × 3/4 קטן מ־5 × 1 = 5. התוצאה היא 15/4 = 3 3/4."]],
    ],
    n: [
      [6, ["What is 2/3 of 9?", "", "2/3 × 9: one third of 9 is 9 ÷ 3 = 3, and two thirds are 2 × 3 = 6."], ["כמה זה 2/3 מ־9?", "", "2/3 × 9: שליש מ־9 הוא 9 ÷ 3 = 3, ושני שלישים הם 2 × 3 = 6."]],
      [9, ["3 × 3/7 = x/7. What is the numerator?", "", "Multiply the numerator by 3: 3 × 3 = 9. The sevenths stay, so the product is 9/7."], ["3 × 3/7 = x/7. מהו המונה?", "", "כופלים את המונה ב־3: 3 × 3 = 9. השביעיות נשארות, ולכן המכפלה היא 9/7."]],
      [3, ["One cake needs 1/2 cup of oil. How many cups are needed for 6 cakes?", "cups", "6 × 1/2 = 6/2, and 6 halves are 3 whole cups of oil."], ["עוגה אחת צריכה 1/2 כוס שמן. כמה כוסות צריך ל־6 עוגות?", "כוסות", "6 × 1/2 = 6/2, ושישה חצאים הם 3 כוסות שלמות של שמן."]],
    ],
  },
  i: {
    t: [
      ["Area model", "a rectangle split into rows and columns that shows a product as a part of the whole", "מודל שטח", "מלבן שמחולק לשורות ולעמודות ומראה מכפלה כחלק מהשלם"],
      ["Fraction of a fraction", "a part of a part, such as half of a quarter, found by multiplying", "שבר משבר", "חלק של חלק, כמו חצי מרבע, שמוצאים בכפל"],
    ],
    q: [
      [["What is 1/2 × 1/4?", "1/8", ["1/6", "2/6", "1/4"], "Top times top and bottom times bottom: 1 × 1 = 1 and 2 × 4 = 8. Half of a quarter is an eighth."],
        ["כמה זה 1/2 × 1/4?", "1/8", ["1/6", "2/6", "1/4"], "מונה כפול מונה ומכנה כפול מכנה: 1 × 1 = 1 ו־2 × 4 = 8. חצי מרבע הוא שמינית."]],
      [["What is 2/3 × 3/5?", "6/15", ["5/8", "6/8", "5/15"], "Numerators: 2 × 3 = 6. Denominators: 3 × 5 = 15. So 6/15, which simplifies to 2/5. 5/8 comes from adding instead of multiplying."],
        ["כמה זה 2/3 × 3/5?", "6/15", ["5/8", "6/8", "5/15"], "המונים: 2 × 3 = 6. המכנים: 3 × 5 = 15. לכן 6/15, ואפשר לצמצם ל־2/5. 5/8 מתקבל כשמחברים במקום לכפול."]],
      [["What is 3/4 × 2/3?", "6/12", ["5/7", "9/8", "6/7"], "3 × 2 = 6 and 4 × 3 = 12, so 6/12 = 1/2. It is the same product as 2/3 × 3/4 on the lesson board: the order of the factors does not matter."],
        ["כמה זה 3/4 × 2/3?", "6/12", ["5/7", "9/8", "6/7"], "3 × 2 = 6 ו־4 × 3 = 12, ולכן 6/12 = 1/2. זו אותה מכפלה כמו 2/3 × 3/4 שבלוח השיעור: סדר הגורמים לא משנה."]],
      [["Half of the class are girls, and 2/5 of the girls play basketball. What part of the class are girls who play basketball?", "2/10", ["2/7", "9/10", "4/5"], "2/5 of 1/2 is 2/5 × 1/2 = 2/10, which is 1/5 of the class. 9/10 comes from adding 1/2 + 2/5."],
        ["חצי מהכיתה בנות, ו־2/5 מהבנות משחקות כדורסל. איזה חלק מהכיתה הן בנות שמשחקות כדורסל?", "2/10", ["2/7", "9/10", "4/5"], "2/5 מתוך 1/2 הם 2/5 × 1/2 = 2/10, שזה 1/5 מהכיתה. 9/10 מתקבל כשמחברים 1/2 + 2/5."]],
      [["Which is bigger: 1/2 × 1/3 or 1/2 + 1/3?", "1/2 + 1/3", ["1/2 × 1/3", "They are equal"], "1/2 × 1/3 = 1/6, a part of a part, while 1/2 + 1/3 = 5/6. Multiplying by a fraction less than 1 makes things smaller."],
        ["מה גדול יותר: 1/2 × 1/3 או 1/2 + 1/3?", "1/2 + 1/3", ["1/2 × 1/3", "הם שווים"], "1/2 × 1/3 = 1/6, חלק של חלק, ואילו 1/2 + 1/3 = 5/6. כפל בשבר קטן מ־1 מקטין."]],
    ],
    n: [
      [3, ["1/3 × 3/8 = x/24. What is the numerator?", "", "Top times top: 1 × 3 = 3. Bottom times bottom: 3 × 8 = 24. So 3/24, which is 1/8."], ["1/3 × 3/8 = x/24. מהו המונה?", "", "מונה כפול מונה: 1 × 3 = 3. מכנה כפול מכנה: 3 × 8 = 24. לכן 3/24, שזה 1/8."]],
      [15, ["There are 40 trees. 3/4 of them are fruit trees, and 1/2 of the fruit trees are apple trees. How many apple trees are there?", "trees", "Fruit trees: 3/4 of 40 = 30. Apple trees: 1/2 of 30 = 15. Or at once: 1/2 × 3/4 = 3/8, and 3/8 of 40 is 15."], ["יש 40 עצים. 3/4 מהם עצי פרי, ו־1/2 מעצי הפרי הם עצי תפוח. כמה עצי תפוח יש?", "עצים", "עצי פרי: 3/4 מ־40 = 30. עצי תפוח: 1/2 מ־30 = 15. או בבת אחת: 1/2 × 3/4 = 3/8, ו־3/8 מ־40 הם 15."]],
      [12, ["What is 4/5 × 15?", "", "4/5 × 15: one fifth of 15 is 15 ÷ 5 = 3, and four fifths are 4 × 3 = 12."], ["כמה זה 4/5 × 15?", "", "4/5 × 15: חמישית מ־15 היא 15 ÷ 5 = 3, וארבע חמישיות הן 4 × 3 = 12."]],
    ],
  },
  a: {
    t: [
      ["Simplifying before multiplying", "dividing a numerator and a denominator by the same number before you multiply", "צמצום לפני כפל", "חלוקה של מונה ושל מכנה באותו מספר עוד לפני שכופלים"],
      ["Scaling", "changing a size by multiplying: multiplying by more than 1 makes it bigger, by less than 1 smaller", "שינוי קנה מידה", "שינוי גודל בעזרת כפל: כפל ביותר מ־1 מגדיל, כפל בפחות מ־1 מקטין"],
    ],
    q: [
      [["What is 4/9 × 3/8, simplified?", "1/6", ["7/17", "1/3", "12/17"], "Simplify first: 4 and 8 divide by 4 (1 and 2), 3 and 9 divide by 3 (1 and 3). Then 1/3 × 1/2 = 1/6. The long way gives 12/72, which is also 1/6."],
        ["כמה זה 4/9 × 3/8, מצומצם?", "1/6", ["7/17", "1/3", "12/17"], "מצמצמים קודם: 4 ו־8 ב־4 (1 ו־2), 3 ו־9 ב־3 (1 ו־3). אז 1/3 × 1/2 = 1/6. בדרך הארוכה מקבלים 12/72, שזה גם 1/6."]],
      [["What is 2 1/2 × 2/5?", "1", ["2 1/5", "4/7", "1/5"], "Write the mixed number as a fraction: 2 1/2 = 5/2. Then 5/2 × 2/5 = 10/10 = 1."],
        ["כמה זה 2 1/2 × 2/5?", "1", ["2 1/5", "4/7", "1/5"], "כותבים את המספר המעורב כשבר: 2 1/2 = 5/2. אז 5/2 × 2/5 = 10/10 = 1."]],
      [["Which product is less than 3/4?", "3/4 × 2/3", ["3/4 × 5/4", "3/4 × 1", "3/4 × 3/2"], "2/3 is less than 1, so 3/4 × 2/3 = 1/2 is less than 3/4. Times 1 keeps it the same; times 5/4 or 3/2 makes it bigger."],
        ["איזו מכפלה קטנה מ־3/4?", "3/4 × 2/3", ["3/4 × 5/4", "3/4 × 1", "3/4 × 3/2"], "2/3 קטן מ־1, ולכן 3/4 × 2/3 = 1/2 קטן מ־3/4. כפל ב־1 משאיר אותו אותו דבר; כפל ב־5/4 או ב־3/2 מגדיל."]],
      [["A recipe for 4 people uses 3/4 cup of rice. How much is needed for 6 people?", "1 1/8 cups", ["1 1/2 cups", "4 1/2 cups", "1 3/4 cups"], "6 people are 6/4 = 3/2 times 4 people. 3/2 × 3/4 = 9/8 = 1 1/8 cups. Or: one person needs 3/16 cup, and 6 × 3/16 = 18/16 = 1 1/8."],
        ["במתכון ל־4 אנשים יש 3/4 כוס אורז. כמה אורז צריך ל־6 אנשים?", "1 1/8 כוסות", ["1 1/2 כוסות", "4 1/2 כוסות", "1 3/4 כוסות"], "6 אנשים הם פי 6/4 = 3/2 מ־4 אנשים. 3/2 × 3/4 = 9/8 = 1 1/8 כוסות. או: לאדם אחד צריך 3/16 כוס, ו־6 × 3/16 = 18/16 = 1 1/8."]],
      [["The product of two fractions is 1/4. One of them is 1/2. What is the other?", "1/2", ["1/8", "1/4", "2"], "1/2 × 1/2 = 1/4: half of a half is a quarter. 1/2 × 1/8 = 1/16, 1/2 × 1/4 = 1/8, and 1/2 × 2 = 1."],
        ["המכפלה של שני שברים היא 1/4. אחד מהם הוא 1/2. מהו השני?", "1/2", ["1/8", "1/4", "2"], "1/2 × 1/2 = 1/4: חצי מחצי הוא רבע. 1/2 × 1/8 = 1/16, 1/2 × 1/4 = 1/8, ו־1/2 × 2 = 1."]],
    ],
    n: [
      [6, ["A bag has 36 sweets. Ori takes 1/3 of them, then Eden takes 1/4 of what is left. How many does Eden take?", "sweets", "Ori takes 36 ÷ 3 = 12, so 36 − 12 = 24 are left. Eden takes 1/4 of 24: 24 ÷ 4 = 6 sweets."], ["בשקית 36 סוכריות. אורי לוקח 1/3 מהן, ואחר כך עדן לוקחת 1/4 ממה שנשאר. כמה סוכריות לוקחת עדן?", "סוכריות", "אורי לוקח 36 ÷ 3 = 12, ולכן נשארות 36 − 12 = 24. עדן לוקחת 1/4 מ־24: 24 ÷ 4 = 6 סוכריות."]],
      [4, ["5/6 × 3/10 = 1/x. What is the denominator?", "", "Simplify first: 5 and 10 divide by 5 (1 and 2), 3 and 6 divide by 3 (1 and 2). Then 1/2 × 1/2 = 1/4."], ["5/6 × 3/10 = 1/x. מהו המכנה?", "", "מצמצמים קודם: 5 ו־10 ב־5 (1 ו־2), 3 ו־6 ב־3 (1 ו־2). אז 1/2 × 1/2 = 1/4."]],
      [2, ["What is 1 1/2 × 1 1/3?", "", "As fractions: 3/2 × 4/3 = 12/6 = 2. The 3s cancel, which leaves 4/2 = 2."], ["כמה זה 1 1/2 × 1 1/3?", "", "כשברים: 3/2 × 4/3 = 12/6 = 2. ה־3 מצטמצמים, ונשאר 4/2 = 2."]],
    ],
  },
};
export default c;
