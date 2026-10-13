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
      [["At the end of the day a market stall still has lots of tomatoes. What might the seller do?", "Lower the price to sell them", ["Raise the price", "Throw the money away", "Close the market forever"], "Cutting the price attracts more buyers when there is too much left."],
        ["בסוף היום נשארו לדוכן בשוק הרבה עגבניות. מה המוכר עשוי לעשות?", "להוריד את המחיר כדי למכור אותן", ["להעלות את המחיר", "לזרוק את הכסף", "לסגור את השוק לתמיד"], "הורדת מחיר מושכת יותר קונים כשנשאר יותר מדי."]],
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
    ],
  },
  a: {
    t: [
      ["Equilibrium price", "the price at which the amount supplied equals the amount demanded", "מחיר שיווי משקל", "המחיר שבו הכמות המוצעת שווה לכמות המבוקשת"],
      ["Elasticity", "how strongly the amount demanded reacts to a change in price", "גמישות", "עד כמה הכמות המבוקשת מגיבה לשינוי במחיר"],
      ["Substitute", "a product that can replace another, like tea for coffee", "מוצר תחליפי", "מוצר שיכול להחליף מוצר אחר, כמו תה במקום קפה"],
      ["Price ceiling", "a legal maximum price set by the government", "מחיר מרבי", "מחיר מקסימלי שהממשלה קובעת בחוק"],
    ],
    q: [
      [["The price of coffee rises sharply. What probably happens to the demand for tea?", "It rises, because tea is a substitute", ["It falls", "Nothing at all", "Tea becomes free"], "When a substitute gets dearer, some buyers switch."],
        ["מחיר הקפה עולה מאוד. מה כנראה קורה לביקוש לתה?", "הוא עולה, כי תה הוא מוצר תחליפי", ["הוא יורד", "שום דבר", "התה נעשה חינם"], "כשמוצר תחליפי מתייקר, חלק מהקונים עוברים למוצר האחר."]],
      [["A government sets a maximum price below the equilibrium price. What is the likely result?", "A shortage: more is wanted than offered", ["A surplus", "Prices rise above the maximum legally", "No change"], "At a price below equilibrium, demand exceeds supply, so queues and shortages appear."],
        ["ממשלה קובעת מחיר מרבי מתחת למחיר שיווי המשקל. מה התוצאה הסבירה?", "מחסור: רוצים יותר ממה שמוצע", ["עודף", "המחירים עולים מעל המקסימום באופן חוקי", "שום שינוי"], "במחיר שמתחת לשיווי המשקל הביקוש גדול מההיצע, ולכן נוצרים תורים ומחסור."]],
    ],
  },
};
export default c;
