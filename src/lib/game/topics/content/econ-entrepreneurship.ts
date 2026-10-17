import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Entrepreneur", "a person who starts a new business and takes on its risk", "יזם", "אדם שמקים עסק חדש ולוקח על עצמו את הסיכון שבו"],
      ["Customer", "a person who buys a product or a service", "לקוח", "אדם שקונה מוצר או שירות"],
      ["Revenue", "all the money a business takes in from its sales", "פדיון", "כל הכסף שעסק מקבל מהמכירות שלו"],
      ["Profit", "the money left over after all the costs are paid", "רווח", "הכסף שנשאר אחרי שמשלמים את כל העלויות"],
    ],
    q: [
      [["Maya sells 20 cups of lemonade at 3 ₪ each. How much money does she take in?", "60 ₪", ["23 ₪", "20 ₪", "3 ₪"], "20 cups × 3 ₪ = 60 ₪ of revenue."],
        ["מאיה מוכרת 20 כוסות לימונדה ב־3 ₪ לכוס. כמה כסף היא מקבלת?", "60 ₪", ["23 ₪", "20 ₪", "3 ₪"], "20 כוסות × 3 ₪ = פדיון של 60 ₪."]],
      [["Which of these is a service rather than a product?", "Walking a neighbour's dog", ["Selling home-made bracelets", "Selling cookies", "Selling a used bike"], "A service is work you do for someone; the others are things you sell."],
        ["מה מהבאים הוא שירות ולא מוצר?", "הוצאת הכלב של השכנים לטיול", ["מכירת צמידים בעבודת יד", "מכירת עוגיות", "מכירת אופניים משומשים"], "שירות הוא עבודה שעושים בשביל מישהו; השאר הם דברים שמוכרים."]],
    ],
    n: [[35, ["A stall takes in 60 ₪ and its costs are 25 ₪. What is the profit?", "₪", "Profit = revenue − costs = 60 − 25 = 35 ₪."], ["דוכן קיבל 60 ₪ והעלויות שלו היו 25 ₪. מה הרווח?", "₪", "רווח = פדיון פחות עלויות = 60 − 25 = 35 ₪."]]],
  },
  i: {
    t: [
      ["Fixed cost", "a cost that stays the same however much you sell, like the rent for a stall", "עלות קבועה", "הוצאה שנשארת זהה לא משנה כמה מוכרים, כמו שכירות של דוכן"],
      ["Variable cost", "a cost that grows with every item you make, like lemons and cups", "עלות משתנה", "הוצאה שגדלה עם כל פריט שמייצרים, כמו לימונים וכוסות"],
      ["Loss", "what a business has when its costs are bigger than its revenue", "הפסד", "מה שיש לעסק כשההוצאות שלו גדולות מהפדיון"],
      ["Competitor", "another business selling something similar to the same customers", "מתחרה", "עסק אחר שמוכר משהו דומה לאותם לקוחות"],
    ],
    q: [
      [["A cookie costs 4 ₪ to make and sells for 10 ₪. How much profit does each cookie bring?", "6 ₪", ["14 ₪", "10 ₪", "4 ₪"], "10 − 4 = 6 ₪ of profit per cookie."],
        ["עלות הכנת עוגייה היא 4 ₪, והיא נמכרת ב־10 ₪. כמה רווח מביאה כל עוגייה?", "6 ₪", ["14 ₪", "10 ₪", "4 ₪"], "10 − 4 = רווח של 6 ₪ לכל עוגייה."]],
      [["Which is a fixed cost for a small bakery?", "The monthly rent for the shop", ["Flour for each cake", "A box for each order", "Sugar for each batch"], "Rent stays the same whether the bakery sells 10 cakes or 100; ingredients and boxes grow with every sale."],
        ["מה מהבאים הוא עלות קבועה של מאפייה קטנה?", "שכר הדירה החודשי של החנות", ["קמח לכל עוגה", "קופסה לכל הזמנה", "סוכר לכל מנה"], "שכר הדירה זהה אם המאפייה מוכרת 10 עוגות או 100; מצרכים וקופסאות גדלים עם כל מכירה."]],
    ],
    s: [[["Starting a small business", "Spot a problem or a need", "Research customers and competitors", "Write a simple business plan", "Make a small first batch and test it", "Launch, sell and learn from feedback"],
      ["להקים עסק קטן", "מזהים בעיה או צורך", "בודקים מי הלקוחות ומי המתחרים", "כותבים תוכנית עסקית פשוטה", "מכינים כמות ראשונה קטנה ובודקים אותה", "משיקים, מוכרים ולומדים מהתגובות"]]],
  },
  a: {
    t: [
      ["Break-even point", "the number of sales at which revenue exactly covers all the costs", "נקודת איזון", "מספר המכירות שבו הפדיון מכסה בדיוק את כל העלויות"],
      ["Business plan", "a written plan of the idea, customers, costs, prices and goals of a business", "תוכנית עסקית", "מסמך שמתאר את הרעיון, הלקוחות, העלויות, המחירים והיעדים של עסק"],
      ["Profit margin", "the share of the selling price that is profit, often given as a percentage", "שולי רווח", "החלק ממחיר המכירה שנשאר כרווח, לרוב באחוזים"],
      ["Market research", "finding out what customers want and what they will pay before you start selling", "סקר שוק", "בירור מה הלקוחות רוצים וכמה ישלמו, לפני שמתחילים למכור"],
    ],
    q: [
      [["A T-shirt sells for 50 ₪ and costs 40 ₪ to make. What is the profit margin?", "20%", ["25%", "10%", "80%"], "Profit is 10 ₪, and 10 out of the 50 ₪ price is 20%. (25% would compare the profit with the cost, not the price.)"],
        ["חולצה נמכרת ב־50 ₪ ועלות הייצור שלה 40 ₪. מהם שולי הרווח?", "20%", ["25%", "10%", "80%"], "הרווח הוא 10 ₪, ו־10 מתוך מחיר של 50 ₪ הם 20%. (25% זו השוואה של הרווח לעלות, לא למחיר.)"]],
      [["Before spending all your savings on 500 T-shirts, what is the smartest first step?", "Test the idea with a small batch and ask customers what they think", ["Buy as many as possible to get a bigger discount", "Copy a competitor's logo to look familiar", "Skip planning to save time"], "A small test shows whether people really want the product before you risk a lot of money."],
        ["לפני שמוציאים את כל החסכונות על 500 חולצות, מה הצעד הראשון הכי חכם?", "לבדוק את הרעיון בכמות קטנה ולשאול לקוחות מה הם חושבים", ["לקנות כמה שיותר כדי לקבל הנחה גדולה", "להעתיק את הסמל של מתחרה כדי להיראות מוכרים", "לוותר על תכנון כדי לחסוך זמן"], "בדיקה קטנה מראה אם אנשים באמת רוצים את המוצר לפני שמסכנים הרבה כסף."]],
    ],
    n: [[30, ["Your fixed costs are 300 ₪. Each bracelet costs 5 ₪ to make and sells for 15 ₪. How many bracelets must you sell to break even?", "bracelets", "Each bracelet leaves 15 − 5 = 10 ₪ toward the fixed costs, and 300 ÷ 10 = 30 bracelets."],
      ["העלויות הקבועות שלכם הן 300 ₪. עלות כל צמיד 5 ₪ והוא נמכר ב־15 ₪. כמה צמידים צריך למכור כדי להגיע לנקודת האיזון?", "צמידים", "כל צמיד משאיר 15 − 5 = 10 ₪ לכיסוי העלויות הקבועות, ו־300 ÷ 10 = 30 צמידים."]]],
  },
};
export default c;
