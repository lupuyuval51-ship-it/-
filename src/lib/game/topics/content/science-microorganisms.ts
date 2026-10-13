import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Microorganism", "a living thing too small to see without a microscope", "מיקרואורגניזם", "יצור חי קטן מכדי שיראו אותו בלי מיקרוסקופ"],
      ["Bacteria", "single-celled microbes found almost everywhere, some helpful and some harmful", "חיידקים", "יצורים חד־תאיים שנמצאים כמעט בכל מקום, חלקם מועילים וחלקם מזיקים"],
      ["Yeast", "a tiny fungus that makes bread dough rise", "שמרים", "פטרייה זעירה שגורמת לבצק לתפוח"],
      ["Mould", "a fuzzy fungus that grows on old food", "עובש", "פטרייה פלומתית שגדלה על אוכל ישן"],
    ],
    q: [
      [["Which food is made with the help of bacteria?", "Yoghurt", ["Raw carrots", "Table salt", "Tap water"], "Bacteria turn the sugar in milk into acid, which thickens it into yoghurt."],
        ["איזה מזון מיוצר בעזרת חיידקים?", "יוגורט", ["גזר טרי", "מלח שולחן", "מי ברז"], "חיידקים הופכים את הסוכר שבחלב לחומצה, שמסמיכה אותו ליוגורט."]],
      [["Why does bread dough rise?", "Yeast makes carbon dioxide gas bubbles", ["The oven pulls it up", "Flour grows", "Salt pushes it"], "Yeast feeds on sugar and gives off CO₂, which is trapped in the dough."],
        ["למה בצק של לחם תופח?", "השמרים מייצרים בועות של גז פחמן דו־חמצני", ["התנור מושך אותו למעלה", "הקמח גדל", "המלח דוחף אותו"], "השמרים ניזונים מסוכר ופולטים CO₂, שנלכד בבצק."]],
    ],
  },
  i: {
    t: [
      ["Virus", "a tiny particle that can only multiply inside a living cell", "נגיף", "חלקיק זעיר שיכול להתרבות רק בתוך תא חי"],
      ["Fungi", "a group of living things including mushrooms, yeasts and moulds", "פטריות", "ממלכה של יצורים חיים שכוללת שמרים, עובשים ופטריית השמפיניון"],
      ["Fermentation", "microbes breaking down sugar without oxygen, used to make bread, yoghurt and pickles", "תסיסה", "פירוק סוכר בלי חמצן בידי מיקרובים, שמשמש להכנת לחם, יוגורט וחמוצים"],
      ["Gut bacteria", "the trillions of helpful microbes living in our intestines", "חיידקי המעי", "טריליוני המיקרובים המועילים שחיים במעיים שלנו"],
    ],
    q: [
      [["Why does food last longer in the fridge?", "Cold slows the growth of microbes", ["Cold kills all microbes at once", "Fridges add salt", "Light in the fridge cleans the food"], "Most microbes grow slowly at low temperatures, though freezing or cold does not kill them all."],
        ["למה מזון נשמר זמן רב יותר במקרר?", "הקור מאט את גדילת המיקרובים", ["הקור הורג מיד את כל המיקרובים", "המקרר מוסיף מלח", "האור במקרר מנקה את המזון"], "רוב המיקרובים גדלים לאט בטמפרטורה נמוכה, אבל קור לא הורג את כולם."]],
      [["Which statement about viruses is true?", "They cannot reproduce on their own, only inside cells", ["They are a kind of bacteria", "Antibiotics kill them", "They are bigger than cells"], "Viruses hijack a cell's machinery to make copies; antibiotics do not work on them."],
        ["איזו טענה על נגיפים נכונה?", "הם לא יכולים להתרבות בעצמם, רק בתוך תאים", ["הם סוג של חיידקים", "אנטיביוטיקה הורגת אותם", "הם גדולים מתאים"], "נגיפים משתלטים על המנגנונים של התא כדי לייצר העתקים; אנטיביוטיקה לא פועלת עליהם."]],
    ],
  },
  a: {
    t: [
      ["Pasteurisation", "heating food such as milk briefly to kill harmful microbes", "פסטור", "חימום קצר של מזון כמו חלב כדי להרוג מיקרובים מזיקים"],
      ["Germ theory", "the idea, proved in the 1800s, that many diseases are caused by microorganisms", "תורת החיידקים", "הרעיון, שהוכח במאה ה־19, שמחלות רבות נגרמות בידי מיקרואורגניזמים"],
      ["Binary fission", "the way bacteria reproduce: one cell splits into two", "חלוקה בינארית", "הדרך שבה חיידקים מתרבים: תא אחד מתחלק לשניים"],
      ["Pathogen", "a microorganism that causes disease", "מחולל מחלה", "מיקרואורגניזם שגורם למחלה"],
    ],
    q: [
      [["A bacterium divides every 20 minutes. Starting from one, how many are there after 2 hours?", "64", ["12", "6", "128"], "2 hours = 6 divisions: 2⁶ = 64."],
        ["חיידק מתחלק כל 20 דקות. מתחילים מאחד — כמה יהיו אחרי שעתיים?", "64", ["12", "6", "128"], "שעתיים = 6 חלוקות: 2⁶ = 64."]],
      [["Whose experiments in the 1860s helped prove germ theory and gave his name to pasteurisation?", "Louis Pasteur", ["Alexander Fleming", "Charles Darwin", "Gregor Mendel"], "Pasteur showed that microbes in the air, not spontaneous generation, spoil broth."],
        ["הניסויים של מי בשנות ה־60 של המאה ה־19 עזרו להוכיח את תורת החיידקים ונתנו את שמו לפסטור?", "לואי פסטר", ["אלכסנדר פלמינג", "צ׳רלס דרווין", "גרגור מנדל"], "פסטר הראה שמיקרובים מהאוויר, ולא ״בריאה ספונטנית״, מקלקלים מרק."]],
    ],
  },
};
export default c;
