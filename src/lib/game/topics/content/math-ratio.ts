import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Ratio", "a comparison of two amounts, written like 2 : 3", "יחס", "השוואה בין שתי כמויות, שנכתבת כמו 2 : 3"],
      ["Double", "two times as much", "פי שניים", "כמות כפולה, פעמיים מאותו הדבר"],
      ["Share equally", "split an amount so that everyone gets the same", "חלוקה שווה", "פיצול כמות כך שכל אחד מקבל אותו דבר"],
      ["Recipe", "a list of ingredients and amounts that can be scaled up or down", "מתכון", "רשימת מצרכים וכמויות שאפשר להגדיל או להקטין"],
    ],
    q: [
      [["In a box there are 2 red pens for every 3 blue pens. What is the ratio of red to blue?", "2 : 3", ["3 : 2", "2 : 5", "5 : 3"], "Red comes first: 2 red to 3 blue, 2 : 3."],
        ["בקופסה יש 2 עטים אדומים על כל 3 עטים כחולים. מה היחס בין האדומים לכחולים?", "2 : 3", ["3 : 2", "2 : 5", "5 : 3"], "האדומים באים קודם: 2 אדומים ל־3 כחולים, 2 : 3."]],
      [["A recipe for 2 people uses 1 egg. How many eggs for 6 people?", "3", ["6", "2", "4"], "6 people is 3 times as many, so 3 × 1 = 3 eggs."],
        ["מתכון לשני אנשים משתמש בביצה אחת. כמה ביצים צריך ל־6 אנשים?", "3", ["6", "2", "4"], "6 אנשים זה פי 3, ולכן 3 × 1 = 3 ביצים."]],
    ],
  },
  i: {
    t: [
      ["Simplest form of a ratio", "a ratio divided by the largest number that goes into both parts, like 6 : 9 → 2 : 3", "יחס מצומצם", "יחס שחולק במספר הגדול ביותר שמחלק את שני חלקיו, כמו 6 : 9 ← 2 : 3"],
      ["Rate", "a ratio between different units, like kilometres per hour", "קצב", "יחס בין יחידות שונות, כמו קילומטרים לשעה"],
      ["Unit price", "the cost of one unit, used to compare offers", "מחיר ליחידה", "המחיר של יחידה אחת, שמשמש להשוואת מבצעים"],
      ["Scale", "the ratio between a map or model and the real thing, like 1 : 100", "קנה מידה", "היחס בין מפה או דגם לבין המציאות, כמו 1 : 100"],
    ],
    q: [
      [["Share 20 sweets between Dana and Omer in the ratio 3 : 2. How many does Dana get?", "12", ["8", "10", "15"], "3 + 2 = 5 parts, each part is 20 ÷ 5 = 4, so Dana gets 3 × 4 = 12."],
        ["מחלקים 20 סוכריות בין דנה לעומר ביחס 3 : 2. כמה מקבלת דנה?", "12", ["8", "10", "15"], "3 + 2 = 5 חלקים, כל חלק הוא 20 ÷ 5 = 4, ולכן דנה מקבלת 3 × 4 = 12."]],
      [["Which is the better buy?", "1 kg for 12 ₪", ["500 g for 7 ₪", "250 g for 4 ₪", "They cost the same per kg"], "Per kg: 12 ₪, 14 ₪ and 16 ₪ — the 1 kg pack is cheapest."],
        ["מה משתלם יותר?", "1 ק״ג ב־12 ₪", ["500 גרם ב־7 ₪", "250 גרם ב־4 ₪", "כולם עולים אותו דבר לק״ג"], "לק״ג: 12 ₪, 14 ₪ ו־16 ₪ — האריזה של 1 ק״ג הכי זולה."]],
    ],
    n: [[150, ["A car travels at 60 km per hour. How far does it go in 2.5 hours?", "km", "Distance = speed × time = 60 × 2.5 = 150 km."], ["מכונית נוסעת במהירות 60 קמ״ש. כמה היא עוברת ב־2.5 שעות?", "ק״מ", "דרך = מהירות × זמן = 60 × 2.5 = 150 ק״מ."]]],
  },
  a: {
    t: [
      ["Direct proportion", "two quantities that grow at the same rate: double one and the other doubles", "יחס ישר", "שני גדלים שגדלים באותו קצב: מכפילים אחד והשני מוכפל"],
      ["Inverse proportion", "when one quantity doubles, the other halves, like workers and time", "יחס הפוך", "כשגודל אחד מוכפל, השני קטן פי שניים, כמו מספר פועלים וזמן העבודה"],
      ["Constant of proportionality", "the fixed number k in y = kx", "מקדם היחס", "המספר הקבוע k ב־y = kx"],
      ["Proportion", "an equation saying two ratios are equal, like 2 : 3 = 4 : 6", "פרופורציה", "שוויון בין שני יחסים, כמו 2 : 3 = 4 : 6"],
    ],
    q: [
      [["4 workers build a wall in 6 days. How long would 3 workers take at the same pace?", "8 days", ["4.5 days", "7 days", "9 days"], "Total work is 4 × 6 = 24 worker-days; 24 ÷ 3 = 8 days (inverse proportion)."],
        ["4 פועלים בונים קיר ב־6 ימים. כמה זמן ייקח ל־3 פועלים באותו קצב?", "8 ימים", ["4.5 ימים", "7 ימים", "9 ימים"], "סך העבודה הוא 4 × 6 = 24 ימי עבודה; 24 ÷ 3 = 8 ימים (יחס הפוך)."]],
      [["On a map with scale 1 : 50,000, two towns are 6 cm apart. How far apart are they really?", "3 km", ["300 m", "30 km", "6 km"], "6 × 50,000 = 300,000 cm = 3,000 m = 3 km."],
        ["במפה בקנה מידה 1 : 50,000 המרחק בין שתי עיירות הוא 6 ס״מ. מה המרחק האמיתי?", "3 ק״מ", ["300 מ׳", "30 ק״מ", "6 ק״מ"], "6 × 50,000 = 300,000 ס״מ = 3,000 מ׳ = 3 ק״מ."]],
      [["If y is directly proportional to x and y = 15 when x = 5, what is y when x = 8?", "24", ["18", "40", "3"], "k = 15 ÷ 5 = 3, so y = 3 × 8 = 24."],
        ["y נמצא ביחס ישר ל־x, ו־y = 15 כאשר x = 5. מהו y כאשר x = 8?", "24", ["18", "40", "3"], "k = 15 ÷ 5 = 3, ולכן y = 3 × 8 = 24."]],
    ],
  },
};
export default c;
