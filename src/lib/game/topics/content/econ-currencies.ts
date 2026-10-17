import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Currency", "the kind of money that a country or a group of countries uses", "מטבע", "סוג הכסף שבו משתמשת מדינה או קבוצת מדינות"],
      ["Exchange rate", "the price of one country's money, measured in another country's money", "שער חליפין", "המחיר של הכסף של מדינה אחת, כשמודדים אותו בכסף של מדינה אחרת"],
      ["Euro", "the money shared by many countries in Europe, such as France, Germany and Italy", "אירו", "הכסף המשותף של מדינות רבות באירופה, כמו צרפת, גרמניה ואיטליה"],
      ["Foreign currency", "money from a country that is not your own", "מטבע חוץ", "כסף של מדינה אחרת, שאינה המדינה שלכם"],
    ],
    q: [
      [["Which country uses the yen as its currency?", "Japan", ["China", "South Korea", "Thailand"], "The yen is the currency of Japan. China uses the yuan, South Korea the won and Thailand the baht."],
        ["איזו מדינה משתמשת ב״ין״ כמטבע שלה?", "יפן", ["סין", "דרום קוריאה", "תאילנד"], "הין הוא המטבע של יפן. בסין משתמשים ביואן, בדרום קוריאה בוון ובתאילנד בבאט."]],
      [["Which currency do people use in the United Kingdom?", "The pound sterling", ["The euro", "The dollar", "The yen"], "People in the United Kingdom pay with pounds, and the country never switched to the euro."],
        ["באיזה מטבע משתמשים בבריטניה?", "בלירה שטרלינג", ["באירו", "בדולר", "בין"], "בבריטניה משלמים בלירות שטרלינג, והמדינה מעולם לא עברה לאירו."]],
      [["Which symbol stands for the euro?", "€", ["£", "$", "¥"], "€ is the euro. £ is the British pound, $ is used for the dollar and ¥ for the Japanese yen."],
        ["איזה סימן מייצג את האירו?", "€", ["£", "$", "¥"], "€ הוא האירו. £ הוא הלירה שטרלינג, $ משמש לדולר ו־¥ לין היפני."]],
      [["Imagine the exchange rate is 4 shekels for 1 dollar. How many shekels do you need to buy a toy that costs 10 dollars?", "40 shekels", ["14 shekels", "2.5 shekels", "400 shekels"], "Each dollar costs 4 shekels, so 10 dollars cost 10 × 4 = 40 shekels."],
        ["נניח ששער החליפין הוא 4 שקלים לדולר אחד. כמה שקלים צריך כדי לקנות צעצוע שעולה 10 דולרים?", "40 שקלים", ["14 שקלים", "2.5 שקלים", "400 שקלים"], "כל דולר עולה 4 שקלים, ולכן 10 דולרים עולים 10 × 4 = 40 שקלים."]],
    ],
  },
  i: {
    t: [
      ["Money changer", "a business where people swap one country's money for another's", "חלפן כספים", "עסק שבו מחליפים כסף של מדינה אחת בכסף של מדינה אחרת"],
      ["Commission", "a fee that a bank or a money changer charges for a service, such as changing money", "עמלה", "תשלום שבנק או חלפן גובים על שירות, למשל על המרת כסף"],
      ["Appreciation", "a rise in a currency's value compared with other currencies", "ייסוף", "עלייה בערך של מטבע לעומת מטבעות אחרים"],
      ["Depreciation", "a fall in a currency's value compared with other currencies", "פיחות", "ירידה בערך של מטבע לעומת מטבעות אחרים"],
    ],
    q: [
      [["Last year 1 dollar cost 4 shekels. Now it costs 3.5 shekels. What happened to the shekel?", "It got stronger: fewer shekels now buy a dollar", ["It got weaker: more shekels are now needed for a dollar", "Nothing, because the prices of currencies never change", "It was replaced by the dollar"], "When fewer shekels are needed to buy the same dollar, each shekel is worth more. This is appreciation of the shekel."],
        ["בשנה שעברה דולר אחד עלה 4 שקלים. עכשיו הוא עולה 3.5 שקלים. מה קרה לשקל?", "הוא התחזק: עכשיו צריך פחות שקלים כדי לקנות דולר", ["הוא נחלש: עכשיו צריך יותר שקלים כדי לקנות דולר", "שום דבר, כי המחירים של מטבעות אף פעם לא משתנים", "הדולר החליף אותו"], "כשצריך פחות שקלים כדי לקנות את אותו דולר, כל שקל שווה יותר. זה ייסוף של השקל."]],
      [["Why does a money changer show two different prices for the same currency?", "It buys the currency from you for less than it sells it, and the gap is part of its profit", ["One price is for the morning and one for the evening", "The higher price is only for tourists from Europe", "The two numbers are chosen at random"], "The money changer buys low and sells high. The difference between the two prices, together with any commission, is how it earns money."],
        ["למה חלפן כספים מציג שני מחירים שונים לאותו מטבע?", "הוא קונה מכם את המטבע בפחות ממה שהוא מוכר אותו, והפער הוא חלק מהרווח שלו", ["מחיר אחד לבוקר ומחיר אחד לערב", "המחיר הגבוה הוא רק לתיירים מאירופה", "שני המספרים נבחרים באקראי"], "החלפן קונה בזול ומוכר ביוקר. ההפרש בין שני המחירים, יחד עם העמלה אם יש, הוא הדרך שבה הוא מרוויח."]],
      [["Which of these countries uses the euro?", "Spain", ["Switzerland", "Sweden", "Poland"], "Spain uses the euro. Switzerland, Sweden and Poland are in Europe but keep their own money: the franc, the krona and the zloty."],
        ["איזו מהמדינות האלה משתמשת באירו?", "ספרד", ["שווייץ", "שוודיה", "פולין"], "ספרד משתמשת באירו. שווייץ, שוודיה ופולין נמצאות באירופה, אבל שומרות על כסף משלהן: פרנק, כתר וזלוטי."]],
      [["The currency of the United States is the dollar. Which other country also calls its own currency the dollar?", "Canada", ["Mexico", "Brazil", "Egypt"], "Canada has its own Canadian dollar, and so do Australia and New Zealand. Mexico uses the peso, Brazil the real and Egypt the Egyptian pound."],
        ["המטבע של ארצות הברית הוא הדולר. איזו מדינה נוספת קוראת גם היא למטבע שלה דולר?", "קנדה", ["מקסיקו", "ברזיל", "מצרים"], "לקנדה יש דולר קנדי משלה, וגם לאוסטרליה ולניו זילנד. במקסיקו משתמשים בפסו, בברזיל בריאל ובמצרים בלירה מצרית."]],
      [["In which year did people first start paying with euro coins and banknotes?", "2002", ["1992", "1948", "2012"], "The euro was created in 1999 for banks and electronic payments. On 1 January 2002 the coins and notes arrived, and the old money of each country was soon withdrawn."],
        ["באיזו שנה התחילו אנשים לשלם לראשונה במטבעות ובשטרות של אירו?", "2002", ["1992", "1948", "2012"], "האירו נוצר ב־1999 לבנקים ולתשלומים אלקטרוניים. ב־1 בינואר 2002 הגיעו המטבעות והשטרות, והכסף הישן של כל מדינה יצא בהמשך משימוש."]],
    ],
    n: [[180, ["A money changer pays 3.6 shekels for each euro. How many shekels do you get for 50 euros?", "shekels", "50 × 3.6 = 180 shekels."],
      ["חלפן כספים משלם 3.6 שקלים על כל אירו. כמה שקלים תקבלו תמורת 50 אירו?", "שקלים", "50 × 3.6 = 180 שקלים."]]],
  },
  a: {
    t: [
      ["Floating exchange rate", "a price of a currency that is set by supply and demand in the market, not by the government", "שער חליפין צף", "מחיר של מטבע שנקבע לפי היצע וביקוש בשוק, ולא על ידי הממשלה"],
      ["Fixed exchange rate", "a price of a currency that a government or central bank keeps at a set level against another currency", "שער חליפין קבוע", "מחיר של מטבע שממשלה או בנק מרכזי שומרים ברמה קבועה מול מטבע אחר"],
      ["Foreign exchange reserves", "foreign money and assets that a central bank keeps and can buy or sell to steady its own currency", "יתרות מטבע חוץ", "כסף זר ונכסים שהבנק המרכזי מחזיק, ושאותם הוא יכול לקנות או למכור כדי לייצב את המטבע"],
      ["Hyperinflation", "prices rising so fast that money loses most of its value within months", "היפר־אינפלציה", "עליית מחירים מהירה כל כך, שהכסף מאבד את רוב ערכו בתוך חודשים"],
    ],
    q: [
      [["The shekel weakens against the dollar. What usually happens to an Israeli company that sells its products in the United States for dollars?", "It receives more shekels for every dollar it earns", ["It receives fewer shekels for every dollar it earns", "It must stop selling abroad", "Its dollars turn into euros"], "Exporters are paid in foreign money. When the shekel is weaker, each dollar they earn changes into more shekels, so a weak shekel usually helps exporters."],
        ["השקל נחלש מול הדולר. מה קורה בדרך כלל לחברה ישראלית שמוכרת את המוצרים שלה בארצות הברית בדולרים?", "היא מקבלת יותר שקלים על כל דולר שהיא מרוויחה", ["היא מקבלת פחות שקלים על כל דולר שהיא מרוויחה", "היא חייבת להפסיק למכור לחו״ל", "הדולרים שלה הופכים לאירו"], "יצואנים מקבלים תשלום בכסף זר. כשהשקל חלש יותר, כל דולר שהם מרוויחים שווה יותר שקלים, ולכן שקל חלש עוזר בדרך כלל ליצואנים."]],
      [["Why does a holiday abroad usually become more expensive for Israelis when the shekel weakens?", "Each euro or dollar they need costs more shekels", ["Hotels abroad charge Israelis a special tax", "Planes have to fly more slowly", "Prices abroad are set in shekels"], "The hotel price in euros may not change at all, but buying those euros now takes more shekels."],
        ["למה חופשה בחו״ל נעשית בדרך כלל יקרה יותר לישראלים כשהשקל נחלש?", "כל אירו או דולר שהם צריכים עולה יותר שקלים", ["בתי מלון בחו״ל גובים מישראלים מס מיוחד", "המטוסים צריכים לטוס לאט יותר", "המחירים בחו״ל נקבעים בשקלים"], "המחיר של המלון באירו אולי לא השתנה בכלל, אבל כדי לקנות את האירו האלה צריך עכשיו יותר שקלים."]],
      [["In 1985 Israel replaced the old shekel with the new shekel: 1,000 old shekels became 1 new shekel. Why was this needed?", "Prices had risen so fast for years that the numbers on prices and notes had become huge", ["The old coins were too heavy to carry", "Another country had bought the old shekel", "The old banknotes had spelling mistakes"], "In the early 1980s prices in Israel rose by hundreds of percent a year. After a plan to stop the rapid price rises, the new shekel removed three zeros from every price."],
        ["ב־1985 החליפה ישראל את השקל הישן בשקל החדש: 1,000 שקלים ישנים הפכו לשקל חדש אחד. למה זה היה נחוץ?", "המחירים עלו במשך שנים כל כך מהר, שהמספרים על המחירים והשטרות נעשו עצומים", ["המטבעות הישנים היו כבדים מדי לסחיבה", "מדינה אחרת קנתה את השקל הישן", "בשטרות הישנים היו שגיאות כתיב"], "בתחילת שנות ה־80 עלו המחירים בישראל במאות אחוזים בשנה. אחרי תוכנית לעצירת עליית המחירים, השקל החדש מחק שלושה אפסים מכל מחיר."]],
      [["Countries that use the euro share one currency. What does each of them give up by doing so?", "Setting its own interest rates, which the European Central Bank sets for all of them", ["Its own language", "Its own flag", "Trade with the other euro countries"], "With one currency there is one central bank. A single country can no longer change its interest rate or its exchange rate just for itself."],
        ["המדינות שמשתמשות באירו חולקות מטבע אחד. על מה כל אחת מהן מוותרת בכך?", "על קביעת הריבית שלה בעצמה, כי הבנק המרכזי האירופי קובע אותה לכולן", ["על השפה שלה", "על הדגל שלה", "על סחר עם שאר מדינות האירו"], "כשיש מטבע אחד, יש בנק מרכזי אחד. מדינה אחת כבר לא יכולה לשנות את הריבית או את שער החליפין רק בשביל עצמה."]],
      [["Many tourists come to Israel and change their dollars into shekels. If nothing else changes, what tends to happen to the shekel?", "It strengthens, because more people want to buy shekels", ["It weakens, because fewer people want shekels", "It is replaced by the dollar", "Its coins change colour"], "An exchange rate is a price, so it follows supply and demand. When demand for shekels rises, the shekel's price in dollars tends to rise too."],
        ["תיירים רבים מגיעים לישראל ומחליפים את הדולרים שלהם בשקלים. אם שום דבר אחר לא משתנה, מה נוטה לקרות לשקל?", "הוא מתחזק, כי יותר אנשים רוצים לקנות שקלים", ["הוא נחלש, כי פחות אנשים רוצים שקלים", "הדולר מחליף אותו", "המטבעות שלו משנים צבע"], "שער חליפין הוא מחיר, ולכן הוא נקבע לפי היצע וביקוש. כשהביקוש לשקלים עולה, המחיר של השקל בדולרים נוטה לעלות גם הוא."]],
    ],
    n: [[816, ["You pay 200 euros abroad with a card. The rate is 4 shekels per euro, and the card adds a 2% fee. How many shekels do you pay in total?", "shekels", "200 × 4 = 800 shekels, and the fee is 2% of 800 = 16 shekels, so you pay 816 shekels."],
      ["אתם משלמים בחו״ל 200 אירו בכרטיס. השער הוא 4 שקלים לאירו, והכרטיס מוסיף עמלה של 2%. כמה שקלים תשלמו בסך הכול?", "שקלים", "200 × 4 = 800 שקלים, והעמלה היא 2% מ־800, כלומר 16 שקלים, ולכן תשלמו 816 שקלים."]]],
    s: [[["How a weaker shekel makes imported goods dearer, in order", "The shekel weakens against the dollar", "An importer needs more shekels to pay for goods priced in dollars", "The importer's costs in shekels rise", "Shops raise the prices of the imported goods"],
      ["איך שקל חלש מייקר מוצרים מיובאים, לפי הסדר", "השקל נחלש מול הדולר", "יבואן צריך יותר שקלים כדי לשלם על סחורה שמחירה בדולרים", "העלויות של היבואן בשקלים עולות", "החנויות מעלות את המחירים של המוצרים המיובאים"]]],
  },
};
export default c;
