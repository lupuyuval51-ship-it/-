import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Tax", "money that people and businesses must pay to the government", "מס", "כסף שאנשים ועסקים חייבים לשלם לממשלה"],
      ["Public services", "things the government provides for everyone, like schools, roads and hospitals", "שירותים ציבוריים", "דברים שהממשלה מספקת לכולם, כמו בתי ספר, כבישים ובתי חולים"],
      ["Government", "the people and offices that run a country", "שלטון", "האנשים והמשרדים שמנהלים מדינה"],
      ["Receipt", "a paper showing what you bought and paid", "קבלה", "דף שמראה מה קניתם וכמה שילמתם"],
    ],
    q: [
      [["What are taxes mainly used for?", "Paying for public services like schools and roads", ["Making shop owners rich", "Buying toys for politicians", "Nothing"], "Tax money funds services everyone shares."],
        ["למה משמשים בעיקר המסים?", "למימון שירותים ציבוריים כמו בתי ספר וכבישים", ["להעשרת בעלי חנויות", "לקניית צעצועים לפוליטיקאים", "לשום דבר"], "כספי המסים מממנים שירותים שכולם משתמשים בהם."]],
      [["Which of these is usually paid for with taxes?", "A public school", ["Your own birthday cake", "A private holiday", "A friend's bicycle"], "Public schools, police and roads are funded by taxes."],
        ["מה מהבאים ממומן בדרך כלל ממסים?", "בית ספר ציבורי", ["עוגת יום ההולדת שלכם", "חופשה פרטית", "אופניים של חבר"], "בתי ספר ציבוריים, משטרה וכבישים ממומנים ממסים."]],
    ],
  },
  i: {
    t: [
      ["VAT", "a tax added to the price of most goods and services; in Israel it is called ma'am", "מע״מ", "מס שמתווסף למחיר של רוב הסחורות והשירותים"],
      ["Income tax", "a tax on the money people earn", "מס הכנסה", "מס על הכסף שאנשים מרוויחים"],
      ["Budget (state)", "the government's plan of how much it will collect and spend in a year", "תקציב המדינה", "התוכנית של הממשלה כמה תגבה וכמה תוציא בשנה"],
      ["Tax evasion", "illegally avoiding paying taxes you owe", "העלמת מס", "הימנעות בלתי חוקית מתשלום מסים שחייבים"],
    ],
    q: [
      [["A price is 100 ₪ before VAT and VAT is 18%. What is the price with VAT?", "118 ₪", ["100 ₪", "82 ₪", "180 ₪"], "100 + 18% of 100 = 100 + 18 = 118 ₪."],
        ["מחיר הוא 100 ₪ לפני מע״מ, והמע״מ הוא 18%. מה המחיר כולל מע״מ?", "118 ₪", ["100 ₪", "82 ₪", "180 ₪"], "100 ועוד 18% מ־100 = 100 + 18 = 118 ₪."]],
      [["Why is not paying taxes you owe unfair to others?", "Everyone else pays for the services you also use", ["It makes taxes lower for all", "Taxes are optional", "It only affects the government building"], "Services are shared, so evasion moves the cost onto honest taxpayers."],
        ["למה אי־תשלום מסים שחייבים בהם אינו הוגן כלפי אחרים?", "כל השאר משלמים על שירותים שגם אתם משתמשים בהם", ["זה מוריד את המסים לכולם", "מסים הם רשות", "זה פוגע רק בבניין הממשלה"], "השירותים משותפים, ולכן העלמת מס מעבירה את העלות למשלמי המסים הישרים."]],
    ],
  },
  a: {
    t: [
      ["Progressive tax", "a tax that takes a larger percentage from higher incomes", "מס פרוגרסיבי", "מס שגובה אחוז גבוה יותר מהכנסות גבוהות יותר"],
      ["Tax bracket", "a range of income taxed at one rate", "מדרגת מס", "טווח של הכנסה שממוסה בשיעור אחד"],
      ["Indirect tax", "a tax on spending, collected through prices, like VAT", "מס עקיף", "מס על הוצאות, שנגבה דרך המחירים, כמו מע״מ"],
      ["Direct tax", "a tax paid directly by the person on income or property", "מס ישיר", "מס שהאדם משלם ישירות על הכנסה או על רכוש"],
    ],
    q: [
      [["In a progressive system, the first 10,000 ₪ is taxed at 10% and income above that at 20%. How much tax on 15,000 ₪?", "2,000 ₪", ["3,000 ₪", "1,500 ₪", "2,500 ₪"], "10% of 10,000 = 1,000 ₪, plus 20% of 5,000 = 1,000 ₪: 2,000 ₪ in total. Only the part above the threshold pays the higher rate."],
        ["בשיטה פרוגרסיבית, 10,000 ה־₪ הראשונים ממוסים ב־10% והכנסה מעל זה ב־20%. כמה מס משלמים על 15,000 ₪?", "2,000 ₪", ["3,000 ₪", "1,500 ₪", "2,500 ₪"], "10% מ־10,000 = 1,000 ₪, ועוד 20% מ־5,000 = 1,000 ₪: בסך הכול 2,000 ₪. רק החלק שמעל הסף משלם את השיעור הגבוה."]],
      [["Why is VAT often called less progressive than income tax?", "Poorer families spend a bigger share of their income on taxed goods", ["Rich people pay no VAT", "VAT is charged only on salaries", "VAT rates change by age"], "Everyone pays the same rate when buying, so it takes a larger share of a small income."],
        ["למה נאמר לעיתים קרובות שמע״מ פחות פרוגרסיבי ממס הכנסה?", "משפחות עניות יותר מוציאות חלק גדול יותר מהכנסתן על מוצרים שממוסים", ["עשירים לא משלמים מע״מ", "מע״מ נגבה רק על משכורות", "שיעור המע״מ משתנה לפי הגיל"], "כולם משלמים אותו שיעור בקנייה, ולכן הוא לוקח חלק גדול יותר מהכנסה קטנה."]],
    ],
  },
};
export default c;
