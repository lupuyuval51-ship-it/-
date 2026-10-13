import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Budget", "a plan for how to spend and save the money you have", "תקציב", "תוכנית איך להוציא ולחסוך את הכסף שיש לכם"],
      ["Income", "money that comes in, like pocket money or a salary", "הכנסה", "כסף שנכנס, כמו דמי כיס או משכורת"],
      ["Expense", "money that goes out to pay for something", "הוצאה", "כסף שיוצא כדי לשלם על משהו"],
      ["Saving", "keeping part of your money for later instead of spending it now", "חיסכון", "שמירה של חלק מהכסף לאחר כך במקום להוציא אותו עכשיו"],
    ],
    q: [
      [["Which is a NEED rather than a WANT?", "Food", ["A new video game", "A third pair of trainers", "Cinema tickets"], "Needs are things we must have to live, like food and shelter; wants are nice to have."],
        ["מה מהבאים הוא צורך ולא רצון?", "אוכל", ["משחק מחשב חדש", "זוג נעלי ספורט שלישי", "כרטיסים לקולנוע"], "צרכים הם דברים שחייבים כדי לחיות, כמו אוכל וקורת גג; רצונות הם דברים שנחמד שיהיו."]],
      [["You get 50 ₪ and save 10 ₪. How much is left to spend?", "40 ₪", ["60 ₪", "10 ₪", "50 ₪"], "50 − 10 = 40 ₪."],
        ["קיבלתם 50 ₪ וחסכתם 10 ₪. כמה נשאר להוצאות?", "40 ₪", ["60 ₪", "10 ₪", "50 ₪"], "50 − 10 = 40 ₪."]],
    ],
    n: [[5, ["You save 20 ₪ a week. How many weeks until you have 100 ₪?", "weeks", "100 ÷ 20 = 5 weeks."], ["אתם חוסכים 20 ₪ בשבוע. אחרי כמה שבועות יהיו לכם 100 ₪?", "שבועות", "100 ÷ 20 = 5 שבועות."]]],
  },
  i: {
    t: [
      ["Fixed expense", "a cost that stays the same each month, like rent", "הוצאה קבועה", "עלות שנשארת זהה כל חודש, כמו שכר דירה"],
      ["Variable expense", "a cost that changes from month to month, like food or electricity", "הוצאה משתנה", "עלות שמשתנה מחודש לחודש, כמו אוכל או חשמל"],
      ["Deficit", "spending more than your income", "גירעון", "הוצאה של יותר כסף מההכנסה"],
      ["Emergency fund", "savings kept for unexpected costs, like a broken phone", "קרן חירום", "חיסכון ששומרים להוצאות בלתי צפויות, כמו טלפון שנשבר"],
    ],
    q: [
      [["A family earns 12,000 ₪ a month and spends 13,000 ₪. What do they have?", "A deficit of 1,000 ₪", ["A saving of 1,000 ₪", "A balanced budget", "A deficit of 13,000 ₪"], "Expenses are 1,000 ₪ higher than income, so there is a 1,000 ₪ deficit."],
        ["משפחה מרוויחה 12,000 ₪ בחודש ומוציאה 13,000 ₪. מה יש לה?", "גירעון של 1,000 ₪", ["חיסכון של 1,000 ₪", "תקציב מאוזן", "גירעון של 13,000 ₪"], "ההוצאות גבוהות ב־1,000 ₪ מההכנסה, ולכן יש גירעון של 1,000 ₪."]],
      [["Which is a variable expense for most families?", "Groceries", ["Monthly rent", "A fixed loan repayment", "A yearly subscription paid monthly at the same price"], "Grocery bills change from month to month; rent and fixed repayments stay the same."],
        ["מה מהבאים הוא הוצאה משתנה ברוב המשפחות?", "קניות במכולת ובסופר", ["שכר דירה חודשי", "החזר הלוואה קבוע", "מנוי שנתי שמשולם כל חודש באותו מחיר"], "הסכום בסופר משתנה מחודש לחודש; שכר דירה והחזרים קבועים נשארים זהים."]],
    ],
  },
  a: {
    t: [
      ["50/30/20 rule", "a simple guideline: about 50% for needs, 30% for wants and 20% for saving", "כלל 50/30/20", "כלל אצבע פשוט: בערך 50% לצרכים, 30% לרצונות ו־20% לחיסכון"],
      ["Opportunity cost", "what you give up when you choose one thing over another", "עלות אלטרנטיבית", "מה שמוותרים עליו כשבוחרים דבר אחד במקום אחר"],
      ["Net income", "the money you actually receive after taxes and deductions", "הכנסה נטו", "הכסף שמקבלים בפועל אחרי מסים וניכויים"],
      ["Impulse buying", "buying something suddenly, without planning, because of a feeling at the moment", "קנייה אימפולסיבית", "קנייה פתאומית בלי תכנון, בגלל תחושה של הרגע"],
    ],
    q: [
      [["Using the 50/30/20 rule, how much of a 6,000 ₪ net income goes to saving?", "1,200 ₪", ["1,800 ₪", "3,000 ₪", "600 ₪"], "20% of 6,000 = 1,200 ₪ (needs 3,000 ₪, wants 1,800 ₪)."],
        ["לפי כלל 50/30/20, כמה מהכנסה נטו של 6,000 ₪ הולך לחיסכון?", "1,200 ₪", ["1,800 ₪", "3,000 ₪", "600 ₪"], "20% מ־6,000 = 1,200 ₪ (צרכים 3,000 ₪, רצונות 1,800 ₪)."]],
      [["You spend Saturday working for 150 ₪ instead of going to a concert. What is the opportunity cost?", "The concert you gave up", ["The 150 ₪ you earned", "Nothing", "The bus fare to work"], "Opportunity cost is the best alternative you gave up — here, the concert."],
        ["בחרתם לעבוד בשבת תמורת 150 ₪ במקום ללכת להופעה. מהי העלות האלטרנטיבית?", "ההופעה שוויתרתם עליה", ["150 ה־₪ שהרווחתם", "אין עלות", "מחיר האוטובוס לעבודה"], "עלות אלטרנטיבית היא האפשרות הטובה ביותר שוויתרו עליה — כאן, ההופעה."]],
    ],
  },
};
export default c;
