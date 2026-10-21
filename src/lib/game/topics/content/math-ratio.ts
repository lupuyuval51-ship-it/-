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
      [["A recipe for 2 people uses 1 egg. How many eggs for 6 people?", "3", ["6", "2", "4"], "6 people is 3 times as many as 2 people, so you need 3 times the eggs: 3 × 1 = 3 eggs."],
        ["מתכון לשני אנשים משתמש בביצה אחת. כמה ביצים צריך ל־6 אנשים?", "3", ["6", "2", "4"], "6 אנשים זה פי 3 מ־2 אנשים, ולכן צריך פי 3 ביצים: 3 × 1 = 3 ביצים."]],
      [["Which ratio is the same as 1 : 2?", "3 : 6", ["2 : 3", "2 : 1", "1 : 3"], "Multiply both parts by 3: 1 : 2 becomes 3 : 6. Adding 1 to both parts, 2 : 3, does not keep the ratio, and 2 : 1 has the parts the wrong way round."],
        ["איזה יחס שווה ל־1 : 2?", "3 : 6", ["2 : 3", "2 : 1", "1 : 3"], "כופלים את שני החלקים ב־3: 1 : 2 הופך ל־3 : 6. הוספת 1 לשני החלקים, 2 : 3, לא שומרת על היחס, ו־2 : 1 הפוך בין החלקים."]],
      [["For every 1 cup of rice you need 2 cups of water. How many cups of water do you need for 3 cups of rice?", "6", ["5", "4", "3"], "3 cups of rice is 3 times as much, so you need 3 × 2 = 6 cups of water. Adding the same amount to both, which gives 4 or 5, changes the ratio."],
        ["על כל כוס אורז צריך 2 כוסות מים. כמה כוסות מים צריך ל־3 כוסות אורז?", "6", ["5", "4", "3"], "3 כוסות אורז הן פי 3, ולכן צריך 3 × 2 = 6 כוסות מים. הוספה של אותה כמות לשני הצדדים, שנותנת 4 או 5, משנה את היחס."]],
    ],
    n: [[8, ["A pack has 2 pens for every 3 pencils. There are 12 pencils. How many pens are there?", "", "12 pencils make 12 ÷ 3 = 4 groups of 3 pencils, and each group has 2 pens: 4 × 2 = 8 pens."], ["באריזה יש 2 עטים על כל 3 עפרונות. יש 12 עפרונות. כמה עטים יש?", "", "12 עפרונות הם 12 ÷ 3 = 4 קבוצות של 3 עפרונות, ובכל קבוצה 2 עטים: 4 × 2 = 8 עטים."]]],
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
      [["Which offer is the best buy, with the lowest price per kg?", "1 kg for 12 ₪", ["500 g for 7 ₪", "250 g for 4 ₪", "They cost the same per kg"], "Per kg: 12 ₪, 14 ₪ and 16 ₪ — the 1 kg pack is cheapest."],
        ["איזו הצעה משתלמת ביותר, עם המחיר הנמוך ביותר לק״ג?", "1 ק״ג ב־12 ₪", ["500 גרם ב־7 ₪", "250 גרם ב־4 ₪", "כולם עולים אותו דבר לק״ג"], "לק״ג: 12 ₪, 14 ₪ ו־16 ₪ — האריזה של 1 ק״ג הכי זולה."]],
      [["What is 12 : 18 in simplest form?", "2 : 3", ["6 : 9", "3 : 2", "4 : 6"], "The largest number that divides both 12 and 18 is 6: 12 ÷ 6 = 2 and 18 ÷ 6 = 3. The ratios 6 : 9 and 4 : 6 have the same value, but they can still be simplified.", "What is the largest number that divides both 12 and 18?"],
        ["מהו היחס 12 : 18 בצורה המצומצמת ביותר?", "2 : 3", ["6 : 9", "3 : 2", "4 : 6"], "המספר הגדול ביותר שמחלק את 12 ואת 18 הוא 6: 12 ÷ 6 = 2 ו־18 ÷ 6 = 3. ליחסים 6 : 9 ו־4 : 6 יש אותו ערך, אבל אפשר עוד לצמצם אותם.", "מהו המספר הגדול ביותר שמחלק גם את 12 וגם את 18?"]],
      [["A bike travels 45 km in 3 hours at a steady speed. How far will it go in 5 hours?", "75 km", ["60 km", "48 km", "135 km"], "45 ÷ 3 = 15 km per hour, so in 5 hours it goes 15 × 5 = 75 km. Multiplying 45 by 3 again, or adding the extra 2 hours' worth wrongly, gives other answers."],
        ["אופניים עוברים 45 ק״מ ב־3 שעות במהירות קבועה. כמה ק״מ הם יעברו ב־5 שעות?", "75 ק״מ", ["60 ק״מ", "48 ק״מ", "135 ק״מ"], "45 ÷ 3 = 15 ק״מ בשעה, ולכן ב־5 שעות הם עוברים 15 × 5 = 75 ק״מ. כפל נוסף של 45 ב־3, או הוספה שגויה של שעתיים, נותנים תשובות אחרות."]],
    ],
    n: [
      [150, ["A car travels at 60 km per hour. How far does it go in 2.5 hours?", "km", "Distance = speed × time = 60 × 2.5 = 150 km."], ["מכונית נוסעת במהירות 60 קמ״ש. כמה היא עוברת ב־2.5 שעות?", "ק״מ", "דרך = מהירות × זמן = 60 × 2.5 = 150 ק״מ."]],
      [300, ["Noa types 120 words in 4 minutes at a steady speed. How many words does she type in 10 minutes?", "words", "120 ÷ 4 = 30 words per minute, so in 10 minutes she types 30 × 10 = 300 words."], ["נועה מקלידה 120 מילים ב־4 דקות במהירות קבועה. כמה מילים היא מקלידה ב־10 דקות?", "מילים", "120 ÷ 4 = 30 מילים בדקה, ולכן ב־10 דקות היא מקלידה 30 × 10 = 300 מילים."]],
    ],
    s: [[["Comparing 3 kg of apples for 21 ₪ with 2 kg for 15 ₪, in order", "Find the price of 1 kg in the first offer: 21 ÷ 3 = 7 ₪", "Find the price of 1 kg in the second offer: 15 ÷ 2 = 7.5 ₪", "Compare the prices per kg: 7 ₪ is less than 7.5 ₪", "Choose the better buy: the first offer"],
      ["משווים 3 ק״ג תפוחים ב־21 ₪ עם 2 ק״ג ב־15 ₪, לפי הסדר", "מוצאים את המחיר של 1 ק״ג בהצעה הראשונה: 21 ÷ 3 = 7 ₪", "מוצאים את המחיר של 1 ק״ג בהצעה השנייה: 15 ÷ 2 = 7.5 ₪", "משווים את המחירים לק״ג: 7 ₪ זול מ־7.5 ₪", "בוחרים את ההצעה המשתלמת: ההצעה הראשונה"]]],
  },
  a: {
    t: [
      ["Direct proportion", "two quantities that grow at the same rate: double one and the other doubles", "יחס ישר", "שני גדלים שגדלים באותו קצב: מכפילים אחד והשני מוכפל"],
      ["Inverse proportion", "when one quantity doubles, the other halves, like workers and time", "יחס הפוך", "כשגודל אחד מוכפל פי שניים, השני מצטמצם לחצי, כמו מספר פועלים וזמן העבודה"],
      ["Constant of proportionality", "the fixed number k in y = kx", "מקדם היחס", "המספר הקבוע k ב־y = kx"],
      ["Proportion", "an equation saying two ratios are equal, like 2 : 3 = 4 : 6", "פרופורציה", "שוויון בין שני יחסים, כמו 2 : 3 = 4 : 6"],
    ],
    q: [
      [["4 workers build a wall in 6 days. How long would 3 workers take at the same pace?", "8 days", ["4.5 days", "7 days", "9 days"], "Total work is 4 × 6 = 24 worker-days; 24 ÷ 3 = 8 days (inverse proportion)."],
        ["4 פועלים בונים קיר ב־6 ימים. כמה זמן ייקח ל־3 פועלים באותו קצב?", "8 ימים", ["4.5 ימים", "7 ימים", "9 ימים"], "סך העבודה הוא 4 × 6 = 24 ימי עבודה; 24 ÷ 3 = 8 ימים (יחס הפוך)."]],
      [["On a map with scale 1 : 50,000, two towns are 6 cm apart. How far apart are they really?", "3 km", ["300 m", "30 km", "6 km"], "6 × 50,000 = 300,000 cm = 3,000 m = 3 km."],
        ["במפה בקנה מידה 1 : 50,000 המרחק בין שתי עיירות הוא 6 ס״מ. מה המרחק האמיתי?", "3 ק״מ", ["300 מ׳", "30 ק״מ", "6 ק״מ"], "6 × 50,000 = 300,000 ס״מ = 3,000 מ׳ = 3 ק״מ."]],
      [["If y is directly proportional to x and y = 15 when x = 5, what is y when x = 8?", "24", ["18", "40", "3"], "The constant k = y ÷ x = 15 ÷ 5 = 3, so when x = 8, y = 3 × 8 = 24."],
        ["y נמצא ביחס ישר ל־x, ו־y = 15 כאשר x = 5. מהו y כאשר x = 8?", "24", ["18", "40", "3"], "הקבוע k = y ÷ x = 15 ÷ 5 = 3, ולכן כאשר x = 8, y = 3 × 8 = 24."]],
      [["In a class the ratio of girls to boys is 4 : 5 and there are 36 students. How many boys are there?", "20", ["16", "25", "9"], "4 + 5 = 9 parts, so 1 part is 36 ÷ 9 = 4 students. The boys are 5 parts: 5 × 4 = 20. The number 16 is how many girls there are.", "How many parts are there in all?"],
        ["בכיתה היחס בין הבנות לבנים הוא 4 : 5 ויש 36 תלמידים. כמה בנים יש?", "20", ["16", "25", "9"], "4 + 5 = 9 חלקים, ולכן חלק אחד הוא 36 ÷ 9 = 4 תלמידים. הבנים הם 5 חלקים: 5 × 4 = 20. המספר 16 הוא מספר הבנות.", "כמה חלקים יש בסך הכול?"]],
      [["A recipe needs 300 g of flour for 12 biscuits. How much flour is needed for 20 biscuits?", "500 g", ["308 g", "360 g", "600 g"], "300 ÷ 12 = 25 g for one biscuit, so 20 biscuits need 20 × 25 = 500 g. Adding the 8 extra biscuits to the grams, which gives 308 g, mixes up adding and multiplying."],
        ["מתכון דורש 300 גרם קמח ל־12 עוגיות. כמה קמח צריך ל־20 עוגיות?", "500 גרם", ["308 גרם", "360 גרם", "600 גרם"], "300 ÷ 12 = 25 גרם לעוגייה אחת, ולכן 20 עוגיות דורשות 20 × 25 = 500 גרם. הוספת 8 העוגיות הנוספות לגרמים, שנותנת 308 גרם, מבלבלת בין חיבור לכפל."]],
      [["Which pair of quantities is in inverse proportion?", "Speed and journey time, for a fixed distance", ["The number of notebooks bought and the total price paid", "The side of a square and the perimeter of that square", "A child's age and the child's height"], "For a fixed distance, doubling the speed halves the time, so they are in inverse proportion. The price grows with the number of notebooks, and the perimeter grows with the side: both are direct proportion. Age and height are not in proportion at all."],
        ["איזה זוג גדלים נמצא ביחס הפוך?", "מהירות וזמן הנסיעה, כשהמרחק קבוע", ["מספר המחברות שקונים והמחיר הכולל ששילמו", "אורך הצלע של ריבוע והיקף הריבוע", "הגיל של ילד והגובה של הילד"], "כשהמרחק קבוע, הכפלת המהירות מקטינה את הזמן לחצי, ולכן הם ביחס הפוך. המחיר גדל עם מספר המחברות וההיקף גדל עם הצלע: בשניהם יחס ישר. גיל וגובה אינם ביחס כלל."]],
    ],
    n: [
      [35, ["Two numbers are in the ratio 3 : 7 and their sum is 50. What is the larger number?", "", "3 + 7 = 10 parts, so 1 part is 50 ÷ 10 = 5. The larger number is 7 parts: 7 × 5 = 35."], ["שני מספרים ביחס 3 : 7 והסכום שלהם 50. מהו המספר הגדול?", "", "3 + 7 = 10 חלקים, ולכן חלק אחד הוא 50 ÷ 10 = 5. המספר הגדול הוא 7 חלקים: 7 × 5 = 35."]],
      [4.5, ["A model car is 18 cm long. The scale is 1 : 25. How long is the real car, in metres?", "m", "Multiply by the scale: 18 × 25 = 450 cm. Then change to metres: 450 cm = 4.5 m."], ["דגם של מכונית באורך 18 ס״מ. קנה המידה הוא 1 : 25. מה אורך המכונית האמיתית, במטרים?", "מ׳", "מכפילים בקנה המידה: 18 × 25 = 450 ס״מ. אחר כך עוברים למטרים: 450 ס״מ = 4.5 מ׳."]],
    ],
    s: [[["Finding how long 4 taps need if 6 identical taps fill a pool in 10 hours, in order", "Find the total work: 6 taps × 10 hours = 60 tap-hours", "The total work stays the same when the number of taps changes", "Divide the total work by the new number of taps: 60 ÷ 4", "Write the answer: 15 hours"],
      ["מוצאים כמה זמן צריכים 4 ברזים אם 6 ברזים זהים ממלאים בריכה ב־10 שעות, לפי הסדר", "מוצאים את סך העבודה: 6 ברזים × 10 שעות = 60 שעות־ברז", "סך העבודה נשאר זהה כשמספר הברזים משתנה", "מחלקים את סך העבודה במספר הברזים החדש: 60 ÷ 4", "כותבים את התשובה: 15 שעות"]]],
  },
};
export default c;
