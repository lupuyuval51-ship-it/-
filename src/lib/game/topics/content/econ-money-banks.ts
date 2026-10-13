import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Money", "something people accept in exchange for goods and services", "כסף", "משהו שאנשים מקבלים בתמורה לסחורות ולשירותים"],
      ["Barter", "swapping goods directly, without money", "סחר חליפין", "החלפה ישירה של סחורות, בלי כסף"],
      ["Bank", "a business that keeps people's money safe and lends money", "בנק", "עסק ששומר על כספם של אנשים ומלווה כסף"],
      ["Coin", "a small round piece of metal used as money", "מטבע", "חתיכת מתכת קטנה ועגולה שמשמשת ככסף"],
    ],
    q: [
      [["What is the currency of Israel?", "The new shekel (₪)", ["The dollar", "The euro", "The pound"], "Israel's currency is the new Israeli shekel; one shekel is 100 agorot."],
        ["מהו המטבע של ישראל?", "השקל החדש (₪)", ["הדולר", "האירו", "הלירה שטרלינג"], "המטבע של ישראל הוא השקל החדש; שקל אחד הוא 100 אגורות."]],
      [["What is the main problem with barter?", "You must find someone who wants what you have and has what you want", ["It is illegal everywhere", "It needs a bank card", "Goods cannot be swapped"], "Money solves this 'double coincidence of wants': anyone can accept it."],
        ["מה הבעיה העיקרית בסחר חליפין?", "צריך למצוא מישהו שרוצה את מה שיש לכם ויש לו את מה שאתם רוצים", ["הוא אסור בכל מקום", "צריך בשבילו כרטיס אשראי", "אי אפשר להחליף סחורות"], "כסף פותר את ״צירוף הרצונות הכפול״: כל אחד יכול לקבל אותו."]],
    ],
  },
  i: {
    t: [
      ["Interest", "money paid for using someone else's money: banks pay it on savings and charge it on loans", "ריבית", "תשלום על שימוש בכסף של מישהו אחר: בנקים משלמים אותה על חסכונות וגובים אותה על הלוואות"],
      ["Loan", "money borrowed that must be paid back, usually with an extra charge", "הלוואה", "כסף שלווים ושצריך להחזיר, בדרך כלל עם תשלום נוסף"],
      ["Debit card", "a card that takes money straight from your bank account", "כרטיס חיוב מיידי", "כרטיס שמוריד כסף ישירות מחשבון הבנק שלכם"],
      ["Central bank", "the national bank that issues money and sets the main interest rate; in Israel, the Bank of Israel", "בנק מרכזי", "הבנק הלאומי שמנפיק כסף וקובע את הריבית העיקרית; בישראל — בנק ישראל"],
    ],
    q: [
      [["You save 1,000 ₪ at 5% interest a year. How much interest after one year?", "50 ₪", ["5 ₪", "500 ₪", "105 ₪"], "5% of 1,000 = 50 ₪."],
        ["חסכתם 1,000 ₪ בריבית של 5% לשנה. כמה ריבית תקבלו אחרי שנה?", "50 ₪", ["5 ₪", "500 ₪", "105 ₪"], "5% מ־1,000 = 50 ₪."]],
      [["Why does a bank charge interest on loans?", "It is the price of borrowing and covers the risk and its costs", ["To punish borrowers", "Because the law forbids free loans", "To print more money"], "Interest pays the lender for the use of the money and the risk it may not be repaid."],
        ["למה הבנק גובה ריבית על הלוואות?", "זה המחיר של לווים כסף, והוא מכסה את הסיכון ואת העלויות", ["כדי להעניש את הלווים", "כי החוק אוסר הלוואות בחינם", "כדי להדפיס עוד כסף"], "הריבית מתגמלת את המלווה על השימוש בכסף ועל הסיכון שלא יוחזר."]],
    ],
  },
  a: {
    t: [
      ["Compound interest", "interest earned on both the original money and the interest already added", "ריבית דריבית", "ריבית שמתקבלת גם על הכסף המקורי וגם על הריבית שכבר נוספה"],
      ["Inflation", "a general rise in prices, so the same money buys less", "אינפלציה", "עלייה כללית במחירים, כך שאותו כסף קונה פחות"],
      ["Credit card", "a card that lets you pay now and the bank collects later, often with high interest if unpaid", "כרטיס אשראי", "כרטיס שמאפשר לשלם עכשיו והבנק גובה מאוחר יותר, לעיתים קרובות בריבית גבוהה אם לא משלמים"],
      ["Overdraft", "spending more than is in your bank account, which costs interest", "משיכת יתר", "הוצאה של יותר ממה שיש בחשבון הבנק, שעולה ריבית"],
    ],
    q: [
      [["1,000 ₪ grows by 10% a year, compounded. How much after 2 years?", "1,210 ₪", ["1,200 ₪", "1,100 ₪", "1,020 ₪"], "Year 1: 1,100 ₪. Year 2: 1,100 × 1.1 = 1,210 ₪ — the interest also earns interest."],
        ["1,000 ₪ גדלים ב־10% בשנה בריבית דריבית. כמה יהיו אחרי שנתיים?", "1,210 ₪", ["1,200 ₪", "1,100 ₪", "1,020 ₪"], "שנה 1: 1,100 ₪. שנה 2: 1,100 × 1.1 = 1,210 ₪ — גם הריבית מרוויחה ריבית."]],
      [["Your savings earn 2% a year while prices rise 4% a year. What happens to what your money can buy?", "It falls", ["It rises", "It stays exactly the same", "It doubles"], "The real return is about 2% − 4% = −2%: the money grows more slowly than prices."],
        ["החיסכון שלכם מרוויח 2% בשנה והמחירים עולים ב־4% בשנה. מה קורה לכוח הקנייה של הכסף?", "הוא יורד", ["הוא עולה", "הוא נשאר בדיוק אותו דבר", "הוא מוכפל"], "התשואה הריאלית היא בערך 2% − 4% = −2%: הכסף גדל לאט יותר מהמחירים."]],
    ],
  },
};
export default c;
