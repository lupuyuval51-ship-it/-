import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Price", "the amount of money asked for something", "מחיר", "סכום הכסף שמבקשים תמורת משהו"],
      ["Buyer", "a person who pays to get something", "קונה", "אדם שמשלם כדי לקבל משהו"],
      ["Seller", "a person or business that offers something for money", "מוכר", "אדם או עסק שמציעים משהו תמורת כסף"],
      ["Market", "any place or system where buyers and sellers trade", "שוק", "כל מקום או מערכת שבהם קונים ומוכרים סוחרים"],
    ],
    q: [
      [["Lots of people want a new toy but the shop has only a few. What often happens to the price?", "It goes up", ["It goes down", "It becomes zero", "Nothing can happen"], "When many want something scarce, sellers can ask more."],
        ["הרבה אנשים רוצים צעצוע חדש אבל בחנות יש רק מעטים. מה קורה לעיתים קרובות למחיר?", "הוא עולה", ["הוא יורד", "הוא נעשה אפס", "שום דבר לא יכול לקרות"], "כשרבים רוצים משהו נדיר, המוכרים יכולים לבקש יותר."]],
      [["At the end of the day a market stall still has lots of tomatoes. What might the seller do?", "Lower the price to sell them", ["Raise the price so each tomato earns more", "Throw the money away", "Close the market forever"], "Cutting the price attracts more buyers when there is too much left. A higher price would scare away the few buyers who are still there."],
        ["בסוף היום נשארו לדוכן בשוק הרבה עגבניות. מה המוכר עשוי לעשות?", "להוריד את המחיר כדי למכור אותן", ["להעלות את המחיר כדי להרוויח יותר מכל עגבנייה", "לזרוק את הכסף", "לסגור את השוק לתמיד"], "הורדת מחיר מושכת יותר קונים כשנשאר יותר מדי. מחיר גבוה יותר היה מבריח גם את הקונים המעטים שעוד נשארו."]],
      [["In the season when farmers pick lots of strawberries, they are usually cheaper. Why?", "There are plenty for sale, so sellers lower the price to sell them all", ["Strawberries picked in that season are always smaller and taste much worse", "The government pays part of the price of every box", "People do not like eating fruit in that season"], "When there is a lot of something to sell, sellers compete for buyers and the price falls. Out of season few strawberries are for sale, and the price rises."],
        ["בעונה שבה חקלאים קוטפים הרבה תותים, התותים בדרך כלל זולים יותר. למה?", "יש הרבה תותים למכירה, ולכן המוכרים מורידים את המחיר כדי למכור את כולם", ["תותים שנקטפים בעונה הזאת תמיד קטנים יותר וטעימים הרבה פחות", "הממשלה משלמת חלק מהמחיר של כל קופסה", "אנשים לא אוהבים לאכול פירות בעונה הזאת"], "כשיש הרבה ממשהו למכירה, המוכרים מתחרים על הקונים והמחיר יורד. מחוץ לעונה יש מעט תותים למכירה, והמחיר עולה."]],
      [["On a hot day, why does a bottle of cold water often cost more at the beach than in a supermarket?", "Many thirsty people want one there, and there are few places to buy it", ["The water sold at the beach is a special kind that is healthier to drink", "The law sets a higher price for water sold near the sea", "The bottles at the beach are always bigger"], "On a hot beach many people want a cold drink and only a few stalls sell one, so sellers can ask more. A supermarket has many bottles, and other shops nearby compete with it."],
        ["ביום חם, למה בקבוק מים קרים עולה לעיתים קרובות יותר בחוף הים מאשר בסופרמרקט?", "הרבה אנשים צמאים רוצים אותו שם, ויש מעט מקומות שאפשר לקנות בהם", ["המים שמוכרים בחוף הם סוג מיוחד של מים, בריאים יותר לשתייה", "החוק קובע מחיר גבוה יותר למים שנמכרים ליד הים", "הבקבוקים בחוף תמיד גדולים יותר"], "בחוף חם הרבה אנשים רוצים משקה קר ורק דוכנים מעטים מוכרים אותו, ולכן המוכרים יכולים לבקש יותר. בסופרמרקט יש הרבה בקבוקים, וחנויות אחרות בסביבה מתחרות בו."]],
    ],
  },
  i: {
    t: [
      ["Demand", "how much of something people want to buy at each price", "ביקוש", "כמה ממשהו אנשים רוצים לקנות בכל מחיר"],
      ["Supply", "how much of something sellers offer at each price", "היצע", "כמה ממשהו המוכרים מציעים בכל מחיר"],
      ["Shortage", "when people want to buy more than is available at the current price", "מחסור", "מצב שבו אנשים רוצים לקנות יותר ממה שיש במחיר הנוכחי"],
      ["Surplus", "when more is offered than people want to buy at the current price", "עודף", "מצב שבו מוצע יותר ממה שאנשים רוצים לקנות במחיר הנוכחי"],
    ],
    q: [
      [["A frost destroys much of the orange harvest. What happens to orange prices?", "They rise, because supply fell", ["They fall, because supply fell", "They stay the same", "They rise, because demand fell"], "Less supply with the same demand pushes the price up."],
        ["כפור הורס חלק גדול מיבול התפוזים. מה קורה למחירי התפוזים?", "הם עולים, כי ההיצע ירד", ["הם יורדים, כי ההיצע ירד", "הם לא משתנים", "הם עולים, כי הביקוש ירד"], "פחות היצע עם אותו ביקוש דוחף את המחיר כלפי מעלה."]],
      [["Usually, when the price of something rises, people…", "buy less of it", ["buy more of it", "buy exactly the same", "stop buying everything"], "This is the law of demand: higher price, lower quantity demanded."],
        ["בדרך כלל, כשהמחיר של משהו עולה, אנשים…", "קונים ממנו פחות", ["קונים ממנו יותר", "קונים בדיוק אותו דבר", "מפסיקים לקנות הכול"], "זהו חוק הביקוש: מחיר גבוה יותר, כמות מבוקשת קטנה יותר."]],
      [["At a price of 10 ₪, a shop wants to sell 100 notebooks, but pupils want to buy only 60. What is this situation called?", "A surplus", ["A shortage", "Equilibrium", "A price ceiling"], "At this price more is offered than buyers want (100 against 60), so 40 notebooks are left over: a surplus. The shop will probably lower the price."],
        ["במחיר של 10 ₪ חנות רוצה למכור 100 מחברות, אבל התלמידים רוצים לקנות רק 60. איך נקרא המצב הזה?", "עודף", ["מחסור", "שיווי משקל", "מחיר מרבי"], "במחיר הזה מוצע יותר ממה שהקונים רוצים (100 מול 60), ולכן נשארות 40 מחברות: זה עודף. החנות כנראה תוריד את המחיר."]],
    ],
    n: [[200, ["At a price of 20 ₪, fans want to buy 500 tickets to a show, but the hall has only 300 seats. How many tickets are missing at this price?", "tickets", "500 − 300 = 200 tickets: more is wanted than offered, so at this price there is a shortage of 200 tickets."],
      ["במחיר של 20 ₪ מעריצים רוצים לקנות 500 כרטיסים להופעה, אבל באולם יש רק 300 מקומות. כמה כרטיסים חסרים במחיר הזה?", "כרטיסים", "500 − 300 = 200 כרטיסים: רוצים יותר ממה שמוצע, ולכן במחיר הזה יש מחסור של 200 כרטיסים."]]],
  },
  a: {
    t: [
      ["Equilibrium price", "the price at which the amount supplied equals the amount demanded", "מחיר שיווי משקל", "המחיר שבו הכמות המוצעת שווה לכמות המבוקשת"],
      ["Elasticity", "how strongly the amount demanded reacts to a change in price", "גמישות", "עד כמה הכמות המבוקשת מגיבה לשינוי במחיר"],
      ["Substitute", "a product that can replace another, like tea for coffee", "מוצר תחליפי", "מוצר שיכול להחליף מוצר אחר, כמו תה במקום קפה"],
      ["Price ceiling", "a legal maximum price set by the government", "מחיר מרבי", "מחיר מקסימלי שהממשלה קובעת בחוק"],
    ],
    q: [
      [["The price of coffee rises sharply. What probably happens to the demand for tea?", "It rises, because tea is a substitute", ["It falls, because buyers spend more of their money on coffee", "Nothing, because tea and coffee are separate markets", "Tea becomes free"], "When a substitute gets dearer, some buyers switch to the other product, so more tea is wanted at every price."],
        ["מחיר הקפה עולה מאוד. מה כנראה קורה לביקוש לתה?", "הוא עולה, כי תה הוא מוצר תחליפי", ["הוא יורד, כי הקונים מוציאים יותר מהכסף שלהם על קפה", "שום דבר, כי תה וקפה הם שווקים נפרדים", "התה נעשה חינם"], "כשמוצר תחליפי מתייקר, חלק מהקונים עוברים למוצר האחר, ולכן בכל מחיר רוצים לקנות יותר תה."]],
      [["A government sets a maximum price below the equilibrium price. What is the likely result?", "A shortage: more is wanted than offered", ["A surplus: sellers offer more than people want", "Prices rise above the maximum legally", "No change"], "At a price below equilibrium, demand exceeds supply, so queues and shortages appear. A surplus comes from a price kept above equilibrium."],
        ["ממשלה קובעת מחיר מרבי מתחת למחיר שיווי המשקל. מה התוצאה הסבירה?", "מחסור: רוצים יותר ממה שמוצע", ["עודף: המוכרים מציעים יותר ממה שאנשים רוצים", "המחירים עולים מעל המקסימום באופן חוקי", "שום שינוי"], "במחיר שמתחת לשיווי המשקל הביקוש גדול מההיצע, ולכן נוצרים תורים ומחסור. עודף נוצר כשהמחיר נשמר מעל שיווי המשקל."]],
      [["Bad weather ruins half of the world's coffee harvest, and at the same time coffee becomes more popular. What happens to the price of coffee?", "It rises, because supply falls and demand rises", ["It stays the same, because the two changes cancel each other out", "It falls, because supply falls", "Nobody can tell whether it rises or falls"], "Less supply pushes the price up, and more demand pushes it up too. Both changes push in the same direction, so the price rises; only the change in the amount sold is unclear."],
        ["מזג אוויר גרוע הורס חצי מיבול הקפה בעולם, ובאותו זמן הקפה נעשה פופולרי יותר. מה קורה למחיר הקפה?", "הוא עולה, כי ההיצע יורד והביקוש עולה", ["הוא לא משתנה, כי שני השינויים מבטלים זה את זה", "הוא יורד, כי ההיצע יורד", "אי אפשר לדעת אם הוא עולה או יורד"], "פחות היצע דוחף את המחיר כלפי מעלה, וגם יותר ביקוש דוחף אותו כלפי מעלה. שני השינויים פועלים באותו כיוון, ולכן המחיר עולה; רק השינוי בכמות שנמכרת לא ברור."]],
      [["Printers and ink are used together. If printers become much cheaper, what probably happens to the demand for ink?", "It rises, because more people buy printers and need ink", ["It falls, because ink and printers are substitutes for each other", "It stays the same, because ink is a different product", "Ink becomes free"], "Goods used together are called complements. When one of them gets cheaper, more people buy it, and the demand for the other rises too; with substitutes it works the other way round."],
        ["מדפסות ודיו משמשים יחד. אם המדפסות נעשות זולות הרבה יותר, מה כנראה קורה לביקוש לדיו?", "הוא עולה, כי יותר אנשים קונים מדפסות וצריכים דיו", ["הוא יורד, כי דיו ומדפסות הם מוצרים תחליפיים זה לזה", "הוא לא משתנה, כי דיו הוא מוצר אחר", "הדיו נעשה חינם"], "מוצרים שמשתמשים בהם יחד נקראים מוצרים משלימים. כשאחד מהם מוזל, יותר אנשים קונים אותו, וגם הביקוש למוצר השני עולה; במוצרים תחליפיים זה עובד הפוך."]],
    ],
  },
};
export default c;
