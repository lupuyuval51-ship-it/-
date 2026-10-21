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
      [["You get 50 ₪ and save 10 ₪. How much is left to spend?", "40 ₪", ["60 ₪", "10 ₪", "50 ₪"], "Take the money you save away from the money you got: 50 − 10 = 40 ₪ is left to spend."],
        ["קיבלתם 50 ₪ וחסכתם 10 ₪. כמה נשאר להוצאות?", "40 ₪", ["60 ₪", "10 ₪", "50 ₪"], "מורידים את מה שחסכתם מהסכום שקיבלתם: 50 − 10 = 40 ₪ נשארים להוצאות."]],
      [["Which of these is INCOME for you?", "Money you get for your birthday", ["Money you spend on a birthday present for a friend", "The price of a new book", "A bill that has to be paid"], "Income is money that comes in to you, like a birthday gift, pocket money or pay for a job. Buying a present or a book is an expense, because the money goes out."],
        ["מה מהבאים הוא הכנסה בשבילכם?", "כסף שמקבלים ליום ההולדת", ["כסף שמוציאים על מתנת יום הולדת לחבר", "המחיר של ספר חדש", "חשבון שצריך לשלם"], "הכנסה היא כסף שנכנס אליכם, כמו מתנה ליום ההולדת, דמי כיס או תשלום על עבודה. קנייה של מתנה או של ספר היא הוצאה, כי הכסף יוצא."]],
    ],
    n: [
      [5, ["You save 20 ₪ a week. How many weeks until you have 100 ₪?", "weeks", "Each week adds 20 ₪, so it takes 100 ÷ 20 = 5 weeks to reach 100 ₪."], ["אתם חוסכים 20 ₪ בשבוע. אחרי כמה שבועות יהיו לכם 100 ₪?", "שבועות", "כל שבוע מוסיף 20 ₪, ולכן צריך 100 ÷ 20 = 5 שבועות כדי להגיע ל־100 ₪."]],
      [45, ["You want a ball that costs 60 ₪, and you already have 15 ₪. How much more do you need to save?", "₪", "Take what you have away from the price: 60 − 15 = 45 ₪ is still missing."], ["אתם רוצים כדור שעולה 60 ₪, וכבר יש לכם 15 ₪. כמה עוד צריך לחסוך?", "₪", "מורידים את מה שכבר יש לכם מהמחיר: 60 − 15 = 45 ₪ עדיין חסרים."]],
    ],
    s: [
      [["Saving for something you want", "Choose what you want to save for", "Find out how much it costs", "Decide how much to put aside each week", "Put the money aside every week until you reach the goal"],
        ["חיסכון למשהו שרוצים", "בוחרים בשביל מה לחסוך", "בודקים כמה זה עולה", "מחליטים כמה כסף לשים בצד בכל שבוע", "שמים את הכסף בצד בכל שבוע עד שמגיעים ליעד"]],
    ],
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
      [["Why is it wise to keep an emergency fund?", "So a surprise cost can be paid without borrowing", ["So there is more money to spend on wants every single month", "Because the bank requires every family to have one", "So you never need to plan a budget again"], "Unexpected costs, like a broken phone or a car repair, come up sooner or later. Money set aside for them means you can pay at once, without a loan or a deficit."],
        ["למה כדאי להחזיק קרן חירום?", "כדי לשלם על הוצאה מפתיעה בלי ללוות", ["כדי שיהיה יותר כסף לרצונות בכל חודש וחודש", "כי הבנק מחייב כל משפחה להחזיק אחת", "כדי שלא תצטרכו לתכנן תקציב אף פעם"], "הוצאות לא צפויות, כמו טלפון שנשבר או תיקון של רכב, מגיעות במוקדם או במאוחר. כסף ששמור בשבילן מאפשר לשלם מיד, בלי הלוואה ובלי גירעון."]],
      [["Your budget shows a deficit of 200 ₪ a month. Which step really fixes it?", "Spending 200 ₪ less or finding 200 ₪ more income", ["Paying the 200 ₪ from the emergency fund every month", "Keeping everything the same and waiting", "Leaving out the small expenses when you add up"], "A deficit means expenses are bigger than income, so one of them must change: spend less, earn more, or both. Taking the gap from the emergency fund only hides it until that money runs out."],
        ["בתקציב שלכם יש גירעון של 200 ₪ בחודש. איזה צעד באמת פותר אותו?", "להוציא 200 ₪ פחות או למצוא עוד 200 ₪ הכנסה", ["לשלם את ה־200 ₪ מקרן החירום בכל חודש", "להשאיר הכול כמו שהוא ולחכות", "לא לספור את ההוצאות הקטנות בחישוב"], "גירעון אומר שההוצאות גדולות מההכנסה, ולכן אחת מהן חייבת להשתנות: להוציא פחות, להרוויח יותר, או את שניהם. לקחת את הפער מקרן החירום רק מסתיר אותו עד שהכסף הזה נגמר."]],
    ],
    n: [
      [150, ["Noa earns 400 ₪ a month from babysitting, and her expenses are 250 ₪. How much can she save each month?", "₪", "What is left after the expenses can be saved: 400 − 250 = 150 ₪ a month."],
        ["נועה מרוויחה 400 ₪ בחודש משמירה על ילדים, וההוצאות שלה הן 250 ₪. כמה היא יכולה לחסוך בכל חודש?", "₪", "מה שנשאר אחרי ההוצאות אפשר לחסוך: 400 − 250 = 150 ₪ בחודש."]],
      [8, ["You save 150 ₪ a month for a bike that costs 1,200 ₪. How many months will it take?", "months", "Each month adds 150 ₪, so it takes 1,200 ÷ 150 = 8 months to have enough for the bike."],
        ["אתם חוסכים 150 ₪ בחודש לאופניים שעולים 1,200 ₪. כמה חודשים זה ייקח?", "חודשים", "כל חודש מוסיף 150 ₪, ולכן צריך 1,200 ÷ 150 = 8 חודשים כדי שיהיה מספיק לאופניים."]],
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
        ["בחרתם לעבוד בשבת תמורת 150 ₪ במקום ללכת להופעה. מהי העלות האלטרנטיבית?", "ההופעה שוויתרתם עליה", ["150 השקלים שהרווחתם", "אין עלות", "מחיר האוטובוס לעבודה"], "עלות אלטרנטיבית היא האפשרות הטובה ביותר שוויתרו עליה — כאן, ההופעה."]],
      [["Your salary is 8,000 ₪ before tax, but 6,500 ₪ reaches your bank account. Which amount should your budget use?", "6,500 ₪, the net income you really receive", ["8,000 ₪, because that is your full salary", "7,250 ₪, halfway between the two amounts", "Only what is left at the end of the month"], "Taxes and deductions are taken off before the money reaches you, so only the 6,500 ₪ of net income can be spent. A budget built on 8,000 ₪ would hide a deficit of 1,500 ₪ a month."],
        ["המשכורת שלכם היא 8,000 ₪ לפני מס, אבל לחשבון הבנק מגיעים 6,500 ₪. לפי איזה סכום כדאי לבנות את התקציב?", "6,500 ₪, ההכנסה נטו שמקבלים בפועל", ["8,000 ₪, כי זו המשכורת המלאה", "7,250 ₪, באמצע בין שני הסכומים", "רק מה שנשאר בסוף החודש"], "מסים וניכויים יורדים לפני שהכסף מגיע אליכם, ולכן אפשר להוציא רק את 6,500 השקלים של ההכנסה נטו. תקציב שבנוי על 8,000 ₪ היה מסתיר גירעון של 1,500 ₪ בחודש."]],
      [["Which habit protects you best from impulse buying?", "Waiting a day before buying something you had not planned", ["Buying at once in case the special offer ends", "Saving your card details in every shopping app", "Going shopping when you feel bored"], "An impulse buy comes from a feeling of the moment. Waiting lets the feeling pass, so you can check whether the item fits your budget. Offers that are about to end and one-click payment make impulse buying easier, not harder."],
        ["איזה הרגל מגן עליכם הכי טוב מקנייה אימפולסיבית?", "לחכות יום לפני שקונים משהו שלא תכננתם", ["לקנות מיד, למקרה שהמבצע ייגמר", "לשמור את פרטי הכרטיס בכל אפליקציית קניות", "ללכת לקניות כשמשעמם לכם"], "קנייה אימפולסיבית נולדת מתחושה של הרגע. המתנה נותנת לתחושה לעבור, וכך אפשר לבדוק אם הפריט מתאים לתקציב. מבצעים שעומדים להיגמר ותשלום בלחיצה אחת דווקא מקלים על קנייה אימפולסיבית."]],
    ],
    n: [
      [1200, ["Using the 50/30/20 rule, how much of a net income of 4,000 ₪ goes to wants?", "₪", "Wants get 30%: 0.3 × 4,000 = 1,200 ₪. Needs get 2,000 ₪ and saving gets 800 ₪."],
        ["לפי כלל 50/30/20, כמה מהכנסה נטו של 4,000 ₪ הולך לרצונות?", "₪", "לרצונות הולכים 30%: 0.3 × 4,000 = 1,200 ₪. לצרכים הולכים 2,000 ₪ ולחיסכון 800 ₪."]],
      [6000, ["You save 10% of a net income of 5,000 ₪ every month. How much do you save in a year?", "₪", "10% of 5,000 is 500 ₪ a month, and over 12 months that is 12 × 500 = 6,000 ₪."],
        ["אתם חוסכים בכל חודש 10% מהכנסה נטו של 5,000 ₪. כמה תחסכו בשנה?", "₪", "10% מ־5,000 הם 500 ₪ בחודש, ובמשך 12 חודשים זה 12 × 500 = 6,000 ₪."]],
    ],
  },
};
export default c;
