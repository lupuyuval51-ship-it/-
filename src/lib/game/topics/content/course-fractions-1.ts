import type { TopicContent } from "../types";

// Course "Fractions, decimals and percentages" (grades 5–6), chapter 1: what a fraction is.
const c: TopicContent = {
  l: {
    en: {
      title: "What is a fraction?",
      text: [
        "A fraction describes a part of a whole that was divided into equal parts. In 3/4 the bottom number, the denominator, says into how many equal parts the whole was divided — here 4. The top number, the numerator, says how many parts we took — here 3. The parts must be equal: a cake cut into four slices of different sizes is not cut into quarters.",
        "You can also take a fraction of an amount: to find 1/4 of 20, split 20 into 4 equal groups and get 5. To find 3/4 of 20, take 3 such groups: 3 × 5 = 15. When the numerator equals the denominator, as in 4/4, we took all the parts — that is one whole.",
      ],
      example: "Example: a class has 24 students and 2/3 of them came on the trip. How many came? Step 1: split 24 into 3 equal groups: 24 ÷ 3 = 8. Step 2: take 2 groups: 2 × 8 = 16. Answer: 16 students came, and 8 stayed at home.",
      task: "Take a sheet of paper and fold it in half, then in half again. Open it: into how many equal parts is the sheet divided? Colour 3 parts and write the fraction you coloured on the sheet. Try again with three folds: into how many parts is it divided now?",
    },
    he: {
      title: "מהו שבר?",
      text: [
        "שבר מתאר חלק משלם שחולק לחלקים שווים. בשבר 3/4 המספר התחתון, המכנה, אומר לכמה חלקים שווים חילקו את השלם — כאן 4. המספר העליון, המונה, אומר כמה חלקים לקחנו — כאן 3. החלקים חייבים להיות שווים: עוגה שנחתכה לארבע פרוסות בגדלים שונים לא חולקה לרבעים.",
        "אפשר לקחת שבר גם מכמות: כדי למצוא 1/4 מ־20 מחלקים את 20 ל־4 קבוצות שוות ומקבלים 5. כדי למצוא 3/4 מ־20 לוקחים 3 קבוצות כאלה: 3 × 5 = 15. כשהמונה שווה למכנה, כמו 4/4, לקחנו את כל החלקים — זה שלם אחד.",
      ],
      example: "דוגמה: בכיתה 24 תלמידים, ו־2/3 מהם הגיעו לטיול. כמה הגיעו? שלב 1: מחלקים את 24 ל־3 קבוצות שוות: 24 ÷ 3 = 8. שלב 2: לוקחים 2 קבוצות: 2 × 8 = 16. תשובה: 16 תלמידים הגיעו, ו־8 נשארו בבית.",
      task: "קחו דף נייר וקפלו אותו לחצי, ואז שוב לחצי. פתחו אותו: לכמה חלקים שווים התחלק הדף? צבעו 3 חלקים וכתבו על הדף את השבר שצבעתם. נסו שוב עם שלושה קיפולים: לכמה חלקים התחלק הדף עכשיו?",
    },
  },
  b: {
    t: [
      ["Numerator", "the top number of a fraction: how many equal parts are taken", "מונה", "המספר העליון בשבר: כמה חלקים שווים לוקחים"],
      ["Denominator", "the bottom number of a fraction: into how many equal parts the whole is divided", "מכנה", "המספר התחתון בשבר: לכמה חלקים שווים חולק השלם"],
    ],
    q: [
      [["A chocolate bar has 6 equal pieces. Dana ate 1 piece. What fraction of the bar did she eat?", "1/6", ["5/6", "1/5", "6/1"], "The bar has 6 equal pieces (the denominator) and Dana took 1 of them (the numerator), so she ate 1/6 of the bar."],
        ["בחפיסת שוקולד 6 קוביות שוות. דנה אכלה קובייה אחת. איזה חלק מהחפיסה היא אכלה?", "1/6", ["5/6", "1/5", "6/1"], "בחפיסה 6 חלקים שווים (המכנה) ודנה לקחה אחד מהם (המונה), ולכן היא אכלה 1/6 מהחפיסה."]],
      [["In the fraction 3/8, what does the 8 tell you?", "The whole has 8 equal parts", ["We took 8 of the parts of the whole", "There are 8 wholes", "8 parts are left over"], "The bottom number, the denominator, says how many equal parts the whole was cut into; the top number, 3, says how many were taken."],
        ["בשבר 3/8, מה אומר המספר 8?", "השלם חולק ל־8 חלקים שווים", ["לקחנו 8 מתוך החלקים של השלם", "יש 8 שלמים", "נשארו 8 חלקים"], "המספר התחתון, המכנה, אומר לכמה חלקים שווים חתכו את השלם; המספר העליון, 3, אומר כמה חלקים לקחו."]],
      [["A pizza is cut into 8 equal slices and 3 slices were eaten. What fraction of the pizza is left?", "5/8", ["3/8", "3/5", "5/3"], "8 − 3 = 5 slices are left out of 8 equal slices, so 5/8 of the pizza is left. 3/8 is the part that was eaten."],
        ["פיצה נחתכה ל־8 משולשים שווים, ואכלו 3 משולשים. איזה חלק מהפיצה נשאר?", "5/8", ["3/8", "3/5", "5/3"], "נשארו 8 − 3 = 5 משולשים מתוך 8 משולשים שווים, ולכן נשארו 5/8 מהפיצה. 3/8 הוא החלק שנאכל."]],
      [["Which of these is equal to one whole?", "5/5", ["5/1", "1/5", "0/5"], "When the numerator equals the denominator, all the equal parts were taken: 5/5 is one whole. 5/1 is five wholes."],
        ["איזה מהשברים שווה לשלם אחד?", "5/5", ["5/1", "1/5", "0/5"], "כשהמונה שווה למכנה, לקחנו את כל החלקים השווים: 5/5 הוא שלם אחד. 5/1 הם חמישה שלמים."]],
      [["A garden is split into 4 parts of different sizes, and tomatoes grow in one of them. Is that 1/4 of the garden?", "Not necessarily — the parts are not equal", ["Yes, it is one part out of four", "Yes, because 4 parts always make quarters", "No, it is 4/1 of the garden"], "A fraction counts equal parts. If the four parts have different sizes, one of them can be more or less than a quarter of the garden."],
        ["גינה חולקה ל־4 חלקים בגדלים שונים, ובאחד מהם גדלות עגבניות. האם זה 1/4 מהגינה?", "לא בהכרח — החלקים לא שווים", ["כן, זה חלק אחד מתוך ארבעה", "כן, כי 4 חלקים הם תמיד רבעים", "לא, זה 4/1 מהגינה"], "שבר סופר חלקים שווים. אם ארבעת החלקים בגדלים שונים, אחד מהם יכול להיות יותר או פחות מרבע הגינה."]],
    ],
    n: [
      [5, ["What is 1/4 of 20?", "", "Split 20 into 4 equal groups; each group has 20 ÷ 4 = 5, and that is a quarter of 20."], ["כמה זה 1/4 מ־20?", "", "מחלקים את 20 ל־4 קבוצות שוות; בכל קבוצה 20 ÷ 4 = 5, וזה רבע מ־20."]],
      [12, ["A class has 30 students and 2/5 of them play football. How many play football?", "students", "One fifth of 30 is 30 ÷ 5 = 6 students, and two fifths are 2 × 6 = 12 students."], ["בכיתה 30 תלמידים, ו־2/5 מהם משחקים כדורגל. כמה תלמידים משחקים כדורגל?", "תלמידים", "חמישית מ־30 היא 30 ÷ 5 = 6 תלמידים, ושתי חמישיות הן 2 × 6 = 12 תלמידים."]],
      [10, ["Noa cut a cake into equal pieces. One piece is 1/10 of the cake. Into how many pieces did she cut it?", "pieces", "The denominator says how many equal pieces the whole has: 1/10 means the cake was cut into 10 equal pieces."], ["נועה חתכה עוגה לחתיכות שוות. חתיכה אחת היא 1/10 מהעוגה. לכמה חתיכות היא חתכה את העוגה?", "חתיכות", "המכנה אומר כמה חלקים שווים יש בשלם: 1/10 פירושו שהעוגה נחתכה ל־10 חתיכות שוות."]],
    ],
  },
  i: {
    t: [
      ["Unit fraction", "a part with 1 on top, such as 1/2 or 1/5: one single equal part", "שבר יסודי", "מספר כמו 1/2 או 1/5, שהמונה שלו 1: חלק שווה אחד בלבד"],
      ["Number line", "a straight line with evenly spaced marks, where every point stands for a number", "ישר המספרים", "קו ישר עם סימונים במרווחים שווים, שכל נקודה עליו מייצגת מספר"],
    ],
    q: [
      [["A number line from 0 to 1 is split into 5 equal steps. What number is at the third mark after 0?", "3/5", ["3/6", "1/3", "5/3"], "From 0 to 1 there are 5 equal steps, so each step is 1/5. Three steps from 0 are 3/5."],
        ["על ישר המספרים בין 0 ל־1 יש 5 צעדים שווים. איזה מספר נמצא בסימון השלישי אחרי 0?", "3/5", ["3/6", "1/3", "5/3"], "בין 0 ל־1 יש 5 צעדים שווים, ולכן כל צעד הוא 1/5. שלושה צעדים מ־0 הם 3/5."]],
      [["Which is more: 1/3 of 12 or 1/4 of 12?", "1/3 of 12", ["1/4 of 12", "They are equal"], "1/3 of 12 is 12 ÷ 3 = 4, and 1/4 of 12 is 12 ÷ 4 = 3. Splitting into fewer groups makes each group bigger."],
        ["מה גדול יותר: 1/3 מ־12 או 1/4 מ־12?", "1/3 מ־12", ["1/4 מ־12", "הם שווים"], "1/3 מ־12 הוא 12 ÷ 3 = 4, ו־1/4 מ־12 הוא 12 ÷ 4 = 3. כשמחלקים לפחות קבוצות, כל קבוצה גדולה יותר."]],
      [["Maya spent 1/5 of her 40 shekels on a book. How much money does she have left?", "32 shekels", ["8 shekels", "35 shekels", "20 shekels"], "1/5 of 40 is 40 ÷ 5 = 8 shekels spent, so 40 − 8 = 32 shekels are left. 8 is what she spent, not what is left."],
        ["מאיה הוציאה 1/5 מ־40 השקלים שלה על ספר. כמה כסף נשאר לה?", "32 שקלים", ["8 שקלים", "35 שקלים", "20 שקלים"], "1/5 מ־40 הוא 40 ÷ 5 = 8 שקלים שהיא הוציאה, ולכן נשארו לה 40 − 8 = 32 שקלים. 8 הוא מה שהוציאה, לא מה שנשאר."]],
      [["Which fraction is bigger than one whole?", "7/4", ["4/4", "4/7", "3/4"], "In 7/4 we take more parts (7) than the whole has (4), so it is one whole and 3 more quarters — more than 1. 4/4 is exactly 1."],
        ["איזה שבר גדול משלם אחד?", "7/4", ["4/4", "4/7", "3/4"], "ב־7/4 לוקחים יותר חלקים (7) ממה שיש בשלם (4), ולכן זה שלם אחד ועוד 3 רבעים — יותר מ־1. 4/4 הוא בדיוק 1."]],
      [["3/4 of the 28 students came by bus. Which calculation finds how many came by bus?", "28 ÷ 4 × 3", ["28 ÷ 3 × 4", "28 − 4 + 3", "28 ÷ 7"], "First find one quarter: 28 ÷ 4 = 7. Three quarters are 3 × 7 = 21 students, so the calculation is 28 ÷ 4 × 3."],
        ["3/4 מ־28 התלמידים הגיעו באוטובוס. איזה תרגיל מוצא כמה הגיעו באוטובוס?", "28 ÷ 4 × 3", ["28 ÷ 3 × 4", "28 − 4 + 3", "28 ÷ 7"], "קודם מוצאים רבע: 28 ÷ 4 = 7. שלושה רבעים הם 3 × 7 = 21 תלמידים, ולכן התרגיל הוא 28 ÷ 4 × 3."]],
    ],
    n: [
      [30, ["Yoav read 3/8 of a book that has 80 pages. How many pages did he read?", "pages", "One eighth of 80 is 80 ÷ 8 = 10 pages, so three eighths are 3 × 10 = 30 pages."], ["יואב קרא 3/8 מספר שיש בו 80 עמודים. כמה עמודים הוא קרא?", "עמודים", "שמינית מ־80 היא 80 ÷ 8 = 10 עמודים, ולכן שלוש שמיניות הן 3 × 10 = 30 עמודים."]],
      [24, ["6 is 1/4 of a number. What is the number?", "", "If one quarter is 6, the whole is four quarters: 4 × 6 = 24. Check: 24 ÷ 4 = 6."], ["6 הוא 1/4 ממספר מסוים. מהו המספר?", "", "אם רבע הוא 6, השלם הוא ארבעה רבעים: 4 × 6 = 24. בדיקה: 24 ÷ 4 = 6."]],
      [12, ["How many sixths make 2 wholes?", "", "Each whole has 6 sixths, so 2 wholes have 2 × 6 = 12 sixths, which is written 12/6."], ["כמה שישיות יש ב־2 שלמים?", "", "בכל שלם יש 6 שישיות, ולכן ב־2 שלמים יש 2 × 6 = 12 שישיות, שנכתבות 12/6."]],
    ],
  },
  a: {
    t: [
      ["Improper fraction", "a number like 9/4, whose numerator is equal to or bigger than its denominator", "שבר מדומה", "מספר כמו 9/4, שהמונה שלו שווה למכנה או גדול ממנו"],
      ["Mixed number", "a whole number written together with a part smaller than one, such as 2 1/4", "מספר מעורב", "מספר שלם שכתוב יחד עם חלק קטן מ־1, כמו 2 1/4"],
    ],
    q: [
      [["Three friends share 2 pizzas equally. How much does each one get?", "2/3 of a pizza", ["3/2 of a pizza", "1/3 of a pizza", "1/2 of a pizza"], "Sharing 2 wholes among 3 people is 2 ÷ 3 = 2/3: cut each pizza into thirds, and each friend gets one third of each pizza."],
        ["שלושה חברים מתחלקים שווה בשווה ב־2 פיצות. כמה מקבל כל אחד?", "2/3 פיצה", ["3/2 פיצה", "1/3 פיצה", "1/2 פיצה"], "חלוקה של 2 שלמים בין 3 אנשים היא 2 ÷ 3 = 2/3: חותכים כל פיצה לשלישים, וכל חבר מקבל שליש מכל פיצה."]],
      [["Write 9/4 as a mixed number.", "2 1/4", ["2 1/2", "1 1/4", "4 1/2"], "Four quarters make one whole: 9 quarters are 2 wholes (8 quarters) and 1 more quarter, so 9/4 = 2 1/4."],
        ["כתבו את 9/4 כמספר מעורב.", "2 1/4", ["2 1/2", "1 1/4", "4 1/2"], "ארבעה רבעים הם שלם אחד: 9 רבעים הם 2 שלמים (8 רבעים) ועוד רבע אחד, ולכן 9/4 = 2 1/4."]],
      [["Which is the biggest?", "3/4 of 40", ["1/2 of 50", "2/3 of 30", "4/5 of 25"], "3/4 of 40 = 30, 1/2 of 50 = 25, 2/3 of 30 = 20 and 4/5 of 25 = 20, so 3/4 of 40 is the biggest."],
        ["מה הכי גדול?", "3/4 מ־40", ["1/2 מ־50", "2/3 מ־30", "4/5 מ־25"], "3/4 מ־40 = 30, 1/2 מ־50 = 25, 2/3 מ־30 = 20 ו־4/5 מ־25 = 20, ולכן 3/4 מ־40 הוא הגדול ביותר."]],
      [["Dan says that 1/3 of 18 is more than 1/2 of 10. Is he right?", "Yes: 6 is more than 5", ["No: a half is always more than a third", "They are equal", "No: 5 is more than 6"], "1/3 of 18 = 18 ÷ 3 = 6 and 1/2 of 10 = 10 ÷ 2 = 5. A half is more than a third of the same thing, but here the wholes are different."],
        ["דן אומר ש־1/3 מ־18 יותר מ־1/2 מ־10. האם הוא צודק?", "כן: 6 יותר מ־5", ["לא: חצי תמיד יותר משליש", "הם שווים", "לא: 5 יותר מ־6"], "1/3 מ־18 = 18 ÷ 3 = 6, ו־1/2 מ־10 = 10 ÷ 2 = 5. חצי יותר משליש של אותו דבר, אבל כאן השלמים שונים."]],
      [["A tank holds 60 litres and is 2/3 full. How many more litres will fill it?", "20 litres", ["40 litres", "30 litres", "15 litres"], "2/3 of 60 is 40 litres, so 60 − 40 = 20 litres are missing. Another way: the empty part is 1/3, and 1/3 of 60 is 20."],
        ["מכל מחזיק 60 ליטר, והוא מלא עד 2/3. כמה ליטרים חסרים כדי למלא אותו?", "20 ליטר", ["40 ליטר", "30 ליטר", "15 ליטר"], "2/3 מ־60 הם 40 ליטר, ולכן חסרים 60 − 40 = 20 ליטר. דרך אחרת: החלק הריק הוא 1/3, ו־1/3 מ־60 הוא 20."]],
    ],
    n: [
      [4, ["A box has 24 marbles: 1/2 are red, 1/3 are blue and the rest are green. How many are green?", "marbles", "Red: 24 ÷ 2 = 12. Blue: 24 ÷ 3 = 8. Green: whatever is left, 24 − 12 − 8 = 4 marbles."], ["בקופסה 24 גולות: 1/2 מהן אדומות, 1/3 כחולות והשאר ירוקות. כמה גולות ירוקות?", "גולות", "אדומות: 24 ÷ 2 = 12. כחולות: 24 ÷ 3 = 8. ירוקות: מה שנשאר, 24 − 12 − 8 = 4 גולות."]],
      [60, ["After spending 3/4 of her money, Lia has 15 shekels left. How much did she have at first?", "shekels", "She spent 3/4, so 1/4 is left. If 1/4 is 15 shekels, the whole is 4 × 15 = 60 shekels."], ["אחרי שהוציאה 3/4 מהכסף שלה, נשארו לליה 15 שקלים. כמה כסף היה לה בהתחלה?", "שקלים", "היא הוציאה 3/4, ולכן נשאר 1/4. אם 1/4 הוא 15 שקלים, השלם הוא 4 × 15 = 60 שקלים."]],
      [14, ["How many quarters are there in 3 1/2?", "", "Each whole has 4 quarters, so 3 wholes are 12 quarters, and a half is 2 more quarters: 12 + 2 = 14."], ["כמה רבעים יש ב־3 1/2?", "", "בכל שלם יש 4 רבעים, ולכן ב־3 שלמים יש 12 רבעים, וחצי הוא עוד 2 רבעים: 12 + 2 = 14."]],
    ],
  },
};
export default c;
