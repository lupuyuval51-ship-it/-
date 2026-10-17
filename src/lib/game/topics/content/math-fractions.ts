import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Fraction", "a number that shows a part of a whole that was divided into equal parts", "שבר", "מספר שמתאר חלק משלם שחולק לחלקים שווים"],
      ["Numerator", "the top number of a fraction; it tells how many equal parts are taken", "מונה", "המספר העליון בשבר; הוא אומר כמה חלקים שווים לוקחים"],
      ["Denominator", "the bottom number of a fraction; it tells into how many equal parts the whole is divided", "מכנה", "המספר התחתון בשבר; הוא אומר לכמה חלקים שווים חולק השלם"],
      ["Half", "one of two equal parts of a whole, written 1/2", "חצי", "אחד משני חלקים שווים של שלם, נכתב 1/2"],
      ["Quarter", "one of four equal parts of a whole, written 1/4", "רבע", "אחד מארבעה חלקים שווים של שלם, נכתב 1/4"],
    ],
    q: [
      [["Which fraction is bigger: 1/2 or 1/4?", "1/2", ["1/4", "They are equal"], "When the numerators are the same, fewer parts means bigger parts: a half is bigger than a quarter."],
        ["איזה שבר גדול יותר: 1/2 או 1/4?", "1/2", ["1/4", "הם שווים"], "כשהמונים שווים, ככל שיש פחות חלקים כל חלק גדול יותר: חצי גדול מרבע."]],
      [["A pizza is cut into 8 equal slices and you eat 3 of them. What fraction of the pizza did you eat?", "3/8", ["5/8", "8/3", "3/5"], "You ate 3 out of 8 equal slices: the numerator is 3 and the denominator is 8."],
        ["פיצה נחתכה ל־8 משולשים שווים ואכלתם 3 מהם. איזה חלק מהפיצה אכלתם?", "3/8", ["5/8", "8/3", "3/5"], "אכלתם 3 מתוך 8 חלקים שווים: המונה הוא 3 והמכנה הוא 8."]],
      [["How many quarters make one whole?", "4", ["2", "3", "8"], "A whole cut into 4 equal parts gives 4 quarters, so 4/4 = 1."],
        ["כמה רבעים יש בשלם אחד?", "4", ["2", "3", "8"], "שלם שנחתך ל־4 חלקים שווים נותן 4 רבעים, ולכן 4/4 = 1."]],
    ],
    n: [[6, ["What is 1/3 of 18?", "", "Split 18 into 3 equal groups: 18 ÷ 3 = 6."], ["כמה זה 1/3 מ־18?", "", "מחלקים את 18 ל־3 קבוצות שוות: 18 ÷ 3 = 6."]]],
  },
  i: {
    t: [
      ["Equivalent fractions", "fractions that look different but have the same value, like 1/2 and 2/4", "שברים שקולים", "שברים שנראים שונים אבל ערכם שווה, כמו 1/2 ו־2/4"],
      ["Simplifying", "dividing the numerator and the denominator by the same number to get smaller numbers", "צמצום", "חלוקה של המונה ושל המכנה באותו מספר כדי לקבל מספרים קטנים יותר"],
      ["Expanding", "multiplying the numerator and the denominator by the same number", "הרחבה", "כפל של המונה ושל המכנה באותו מספר"],
      ["Common denominator", "the same bottom number given to two fractions so they can be added or compared", "מכנה משותף", "אותו מספר תחתון שנותנים לשני שברים כדי לחבר אותם או להשוות ביניהם"],
      ["Mixed number", "a whole number together with a fraction, like 2 1/2", "מספר מעורב", "מספר שלם יחד עם שבר, כמו 2 1/2"],
    ],
    q: [
      [["Which fraction is equal to 3/4?", "6/8", ["3/8", "6/4", "4/3"], "Multiply the numerator and the denominator by 2: 3/4 = 6/8."],
        ["איזה שבר שווה ל־3/4?", "6/8", ["3/8", "6/4", "4/3"], "מכפילים את המונה ואת המכנה ב־2: 3/4 = 6/8."]],
      [["What is 1/4 + 2/4?", "3/4", ["3/8", "2/4", "1/8"], "The denominators are the same, so add the numerators and keep the denominator: 1 + 2 = 3, giving 3/4."],
        ["כמה זה 1/4 + 2/4?", "3/4", ["3/8", "2/4", "1/8"], "המכנים שווים, לכן מחברים את המונים ומשאירים את המכנה: 1 + 2 = 3, ומקבלים 3/4."]],
      [["Simplify 6/9.", "2/3", ["3/6", "1/3", "6/3"], "Both 6 and 9 divide by 3: 6 ÷ 3 = 2 and 9 ÷ 3 = 3, so 6/9 = 2/3."],
        ["צמצמו את 6/9.", "2/3", ["3/6", "1/3", "6/3"], "גם 6 וגם 9 מתחלקים ב־3: 6 ÷ 3 = 2 ו־9 ÷ 3 = 3, ולכן 6/9 = 2/3."]],
    ],
    n: [[7, ["Write 3 1/2 as a fraction with denominator 2. What is the numerator?", "", "3 wholes are 6 halves, plus 1 more half: 7 halves, so 3 1/2 = 7/2."], ["כתבו את 3 1/2 כשבר שהמכנה שלו 2. מהו המונה?", "", "ב־3 שלמים יש 6 חצאים, ועוד חצי אחד: 7 חצאים, ולכן 3 1/2 = 7/2."]]],
  },
  a: {
    t: [
      ["Reciprocal", "the fraction turned upside down; multiplying a number by it gives 1", "מספר הופכי", "השבר כשמחליפים בין המונה למכנה; מכפלתו במספר המקורי היא 1"],
      ["Improper fraction", "a fraction whose numerator is greater than or equal to its denominator, like 7/4", "שבר מדומה", "שבר שהמונה שלו גדול מהמכנה או שווה לו, כמו 7/4"],
      ["Lowest common denominator", "the smallest number that all the denominators divide into exactly", "המכנה המשותף הקטן ביותר", "המספר הקטן ביותר שכל המכנים מתחלקים בו בלי שארית"],
      ["Unit fraction", "a fraction with numerator 1, like 1/5", "שבר יסודי", "שבר שהמונה שלו הוא 1, כמו 1/5"],
    ],
    q: [
      [["What is 2/3 × 3/4?", "1/2", ["5/7", "6/7", "8/9"], "Multiply the numerators and the denominators: (2 × 3)/(3 × 4) = 6/12, which simplifies to 1/2."],
        ["כמה זה 2/3 × 3/4?", "1/2", ["5/7", "6/7", "8/9"], "כופלים מונה במונה ומכנה במכנה: (2 × 3)/(3 × 4) = 6/12, ובצמצום 1/2."]],
      [["What is 3/4 ÷ 1/2?", "1 1/2", ["3/8", "2/3", "1/4"], "Dividing by 1/2 is the same as multiplying by its reciprocal, 2: 3/4 × 2 = 6/4 = 1 1/2."],
        ["כמה זה 3/4 ÷ 1/2?", "1 1/2", ["3/8", "2/3", "1/4"], "חילוק ב־1/2 הוא כמו כפל במספר ההופכי שלו, 2: 3/4 × 2 = 6/4 = 1 1/2."]],
      [["Which is larger: 5/6 or 7/9?", "5/6", ["7/9", "They are equal"], "Use the common denominator 18: 5/6 = 15/18 and 7/9 = 14/18, so 5/6 is larger."],
        ["מה גדול יותר: 5/6 או 7/9?", "5/6", ["7/9", "הם שווים"], "עם מכנה משותף 18: 5/6 = 15/18 ו־7/9 = 14/18, ולכן 5/6 גדול יותר."]],
    ],
    n: [[7, ["1/3 + 1/4 = x/12. What is x?", "", "With denominator 12: 1/3 = 4/12 and 1/4 = 3/12, so the sum is 7/12."], ["1/3 + 1/4 = x/12. מהו x?", "", "עם מכנה 12: 1/3 = 4/12 ו־1/4 = 3/12, ולכן הסכום הוא 7/12."]]],
  },
};
export default c;
