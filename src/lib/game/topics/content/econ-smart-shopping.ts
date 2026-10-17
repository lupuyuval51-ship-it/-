import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Advertisement", "a message made to make people want to buy something", "פרסומת", "מסר שנועד לגרום לאנשים לרצות לקנות משהו"],
      ["Receipt", "a printed or digital note that shows what you bought and how much you paid", "קבלה", "פתק מודפס או דיגיטלי שמראה מה קניתם וכמה שילמתם"],
      ["Discount", "a cut from the usual price", "הנחה", "הורדה מהמחיר הרגיל"],
      ["Brand", "the name and logo a company uses for its products", "מותג", "השם והסמל שחברה משתמשת בהם למוצרים שלה"],
    ],
    q: [
      [["A toy costs 40 ₪ in one shop and 32 ₪ in another. How much do you save at the cheaper shop?", "8 ₪", ["12 ₪", "32 ₪", "72 ₪"], "40 − 32 = 8 ₪ saved."],
        ["צעצוע עולה 40 ₪ בחנות אחת ו־32 ₪ בחנות אחרת. כמה חוסכים בחנות הזולה?", "8 ₪", ["12 ₪", "32 ₪", "72 ₪"], "40 − 32 = חיסכון של 8 ₪."]],
      [["An advert says: “Everyone in your class already has one!” What is it trying to do?", "Make you feel left out so that you buy it", ["Give you facts about the price", "Explain how the toy is made", "Warn you about safety"], "This advert uses the wish to fit in, not facts about the product."],
        ["פרסומת אומרת: ״לכל הילדים בכיתה שלך כבר יש!״ מה היא מנסה לעשות?", "לגרום לכם להרגיש בחוץ כדי שתקנו", ["לתת לכם מידע על המחיר", "להסביר איך הצעצוע עשוי", "להזהיר אתכם מסכנה"], "הפרסומת משתמשת ברצון להשתייך, ולא בעובדות על המוצר."]],
      [["Why is it a good idea to keep the receipt?", "So that you can return or exchange the item if there is a problem", ["To get a free item next time", "To show it to your friends", "It is never useful"], "A receipt proves where and when you bought something and what you paid."],
        ["למה כדאי לשמור את הקבלה?", "כדי שאפשר יהיה להחזיר או להחליף את המוצר אם יש בעיה", ["כדי לקבל מוצר בחינם בפעם הבאה", "כדי להראות אותה לחברים", "היא אף פעם לא שימושית"], "קבלה מוכיחה איפה ומתי קניתם משהו וכמה שילמתם."]],
    ],
  },
  i: {
    t: [
      ["Unit price", "the price for a set amount, like per 100 g or per litre, used to compare packs", "מחיר ליחידה", "המחיר לכמות קבועה, כמו ל־100 גרם או לליטר, שעוזר להשוות בין אריזות"],
      ["Warranty", "a promise to repair or replace a product that breaks within a set time", "תעודת אחריות", "התחייבות לתקן או להחליף מוצר שהתקלקל בתוך זמן מסוים"],
      ["Target audience", "the group of people an advert is aimed at", "קהל יעד", "קבוצת האנשים שפרסומת מכוונת אליהם"],
      ["Comparison shopping", "checking the price and quality in several places before buying", "השוואת מחירים", "בדיקה של המחיר והאיכות בכמה מקומות לפני שקונים"],
    ],
    q: [
      [["Pack A has 500 g for 10 ₪. Pack B has 1 kg for 16 ₪. Which is cheaper per kilogram?", "Pack B: 16 ₪ per kg", ["Pack A: 10 ₪ per kg", "They cost the same per kg", "Pack A, because its price is lower"], "Pack A is 10 ₪ for half a kilogram, so 20 ₪ per kg; Pack B is 16 ₪ per kg."],
        ["באריזה א׳ יש 500 גרם ב־10 ₪. באריזה ב׳ יש 1 ק״ג ב־16 ₪. איזו זולה יותר לקילוגרם?", "אריזה ב׳: 16 ₪ לק״ג", ["אריזה א׳: 10 ₪ לק״ג", "המחיר לק״ג זהה", "אריזה א׳, כי המחיר שלה נמוך יותר"], "אריזה א׳ עולה 10 ₪ לחצי קילוגרם, כלומר 20 ₪ לק״ג; אריזה ב׳ עולה 16 ₪ לק״ג."]],
      [["A jacket costs 100 ₪. Which deal gives the lowest price?", "30% off", ["25 ₪ off", "20% off", "10 ₪ off"], "30% off leaves 70 ₪; 25 ₪ off leaves 75 ₪, 20% off leaves 80 ₪ and 10 ₪ off leaves 90 ₪."],
        ["מעיל עולה 100 ₪. איזה מבצע נותן את המחיר הנמוך ביותר?", "30% הנחה", ["25 ₪ הנחה", "20% הנחה", "10 ₪ הנחה"], "30% הנחה משאירים 70 ₪; 25 ₪ הנחה משאירים 75 ₪, 20% משאירים 80 ₪ ו־10 ₪ משאירים 90 ₪."]],
    ],
    n: [[45, ["A 60 ₪ game is sold at 25% off. What is the new price?", "₪", "25% of 60 is 15, and 60 − 15 = 45 ₪."], ["משחק שעולה 60 ₪ נמכר ב־25% הנחה. מה המחיר החדש?", "₪", "25% מ־60 הם 15, ו־60 − 15 = 45 ₪."]]],
  },
  a: {
    t: [
      ["Sponsored content", "a post or video that a company paid for, which should be clearly marked as an advert", "תוכן ממומן", "פוסט או סרטון שחברה שילמה עליו, וצריך לסמן אותו בבירור כפרסומת"],
      ["Influencer marketing", "companies paying popular online creators to show their products", "שיווק משפיענים", "חברות שמשלמות ליוצרי תוכן פופולריים ברשת כדי שיציגו את המוצרים שלהן"],
      ["Anchoring", "when a high first price makes a later price seem cheap", "אפקט העיגון", "כשמחיר ראשון גבוה גורם למחיר שמופיע אחריו להיראות זול"],
      ["Consumer rights", "protections the law gives buyers, such as clear prices and honest information", "זכויות הצרכן", "הגנות שהחוק נותן לקונים, כמו מחיר ברור ומידע אמין"],
    ],
    q: [
      [["A shop sign says “Was 400 ₪, now only 199 ₪!” Which persuasion trick may this be?", "Anchoring: the high first price makes 199 ₪ feel cheap", ["A warranty offer", "Comparison shopping", "A unit price"], "Even if the item was never really sold for 400 ₪, seeing that number first makes 199 ₪ look like a bargain."],
        ["שלט בחנות אומר ״היה 400 ₪, עכשיו רק 199 ₪!״ באיזה תכסיס שכנוע ייתכן שמדובר?", "אפקט העיגון: המחיר הגבוה הראשון גורם ל־199 ₪ להיראות זול", ["הצעה של תעודת אחריות", "השוואת מחירים", "מחיר ליחידה"], "גם אם המוצר מעולם לא נמכר באמת ב־400 ₪, המספר שרואים קודם גורם ל־199 ₪ להיראות כמו מציאה."]],
      [["Why are so many prices like 9.90 ₪ instead of 10 ₪?", "They feel noticeably cheaper, although the gap is tiny", ["The law requires it", "It makes the tax lower", "Shops cannot print round numbers"], "We read prices from the left, so 9.90 feels like “nine-something” rather than ten."],
        ["למה מחירים רבים הם כמו 9.90 ₪ ולא 10 ₪?", "הם מרגישים זולים יותר באופן בולט, אף שההפרש זעיר", ["החוק מחייב את זה", "זה מוריד את המס", "חנויות לא יכולות להדפיס מספרים עגולים"], "אנחנו קוראים מחירים משמאל, ולכן 9.90 מרגיש כמו ״תשע ומשהו״ ולא כמו עשר."]],
      [["A video star says “I love these headphones!” and the caption has #ad. What does #ad tell you?", "The company paid for the post or gave something in return", ["It is an independent review", "The headphones are on sale", "The star invented the headphones"], "#ad marks sponsored content: the opinion may be shaped by payment, so compare independent reviews too."],
        ["כוכבת רשת אומרת ״אני ממש אוהבת את האוזניות האלה!״ ובכיתוב מופיע #ad. מה זה אומר?", "החברה שילמה על הפוסט או נתנה משהו בתמורה", ["זו ביקורת עצמאית", "האוזניות במבצע", "הכוכבת המציאה את האוזניות"], "#ad מסמן תוכן ממומן: התשלום עשוי להשפיע על הדעה, ולכן כדאי לבדוק גם ביקורות עצמאיות."]],
    ],
    n: [[8, ["“Buy 3 for the price of 2”: one item usually costs 12 ₪. How much does each item really cost you?", "₪", "You pay 2 × 12 = 24 ₪ for 3 items, and 24 ÷ 3 = 8 ₪ each."], ["״3 במחיר 2״: מוצר אחד עולה בדרך כלל 12 ₪. כמה עולה לכם בפועל כל מוצר?", "₪", "משלמים 2 × 12 = 24 ₪ על 3 מוצרים, ו־24 ÷ 3 = 8 ₪ לכל אחד."]]],
  },
};
export default c;
