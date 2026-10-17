import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Acid", "a substance that tastes sour, like lemon juice or vinegar", "חומצה", "חומר בעל טעם חמוץ, כמו מיץ לימון או חומץ"],
      ["Base", "a substance that feels slippery, like soap", "בסיס", "חומר שמרגיש חלקלק, כמו סבון"],
      ["Neutral", "neither acidic nor basic, like pure water", "נייטרלי", "לא חומצי ולא בסיסי, כמו מים טהורים"],
      ["Indicator", "a substance that changes colour to show whether something is acidic or basic", "אינדיקטור", "חומר שמשנה צבע כדי להראות אם משהו חומצי או בסיסי"],
    ],
    q: [
      [["Which of these is acidic?", "Lemon juice", ["Soap", "Pure water", "Baking soda"], "Lemons contain citric acid, which gives them their sour taste."],
        ["מה מהבאים חומצי?", "מיץ לימון", ["סבון", "מים טהורים", "סודה לשתייה"], "בלימונים יש חומצת לימון, שנותנת להם את הטעם החמוץ."]],
      [["Why should you never taste unknown chemicals to test them?", "Many acids and bases are harmful or burn", ["They taste too sweet", "It changes their colour", "It makes them neutral"], "Strong acids and bases can burn skin and mouth; scientists use indicators instead."],
        ["למה אסור לטעום חומרים לא מוכרים כדי לבדוק אותם?", "חומצות ובסיסים רבים מזיקים ואף צורבים", ["הם מתוקים מדי", "זה משנה את צבעם", "זה הופך אותם לנייטרליים"], "חומצות ובסיסים חזקים עלולים לצרוב את העור והפה; מדענים משתמשים באינדיקטורים במקום."]],
    ],
  },
  i: {
    t: [
      ["pH scale", "a scale from 0 to 14 that shows how acidic or basic a solution is", "סולם pH", "סולם מ־0 עד 14 שמראה עד כמה תמיסה חומצית או בסיסית"],
      ["pH 7", "the middle of the scale: neutral", "pH 7", "אמצע הסולם: נייטרלי"],
      ["Universal indicator", "a mixture of dyes that shows a range of colours across the pH scale", "אינדיקטור אוניברסלי", "תערובת צבענים שמראה מגוון צבעים לאורך סולם ה־pH"],
      ["Neutralisation", "an acid and a base reacting to cancel each other out, making a salt and water", "סתירה", "תגובה בין חומצה לבסיס שמבטלת את תכונותיהם, ונוצרים מלח ומים"],
    ],
    q: [
      [["A solution has pH 2. It is…", "strongly acidic", ["strongly basic", "neutral", "slightly basic"], "pH values below 7 are acidic; the lower the number, the more acidic."],
        ["לתמיסה יש pH 2. היא…", "חומצית מאוד", ["בסיסית מאוד", "נייטרלית", "בסיסית מעט"], "ערכי pH מתחת ל־7 הם חומציים; ככל שהמספר נמוך יותר, החומציות גבוהה יותר."]],
      [["What do antacid tablets do for heartburn?", "They neutralise extra stomach acid", ["They add more acid", "They kill all stomach cells", "They turn acid into sugar"], "Antacids are mild bases that react with excess stomach acid."],
        ["מה עושות טבליות נוגדות חומצה לצרבת?", "סותרות חומצה עודפת בקיבה", ["מוסיפות עוד חומצה", "הורגות את כל תאי הקיבה", "הופכות חומצה לסוכר"], "נוגדי חומצה הם בסיסים מתונים שמגיבים עם החומצה העודפת בקיבה."]],
    ],
  },
  a: {
    t: [
      ["Hydrogen ions", "H⁺ ions; the more of them in a solution, the more acidic it is", "יוני מימן", "יוני H⁺; ככל שיש יותר מהם בתמיסה, היא חומצית יותר"],
      ["Hydroxide ions", "OH⁻ ions, which make a solution basic", "יוני הידרוקסיד", "יוני OH⁻, שהופכים תמיסה לבסיסית"],
      ["Logarithmic scale", "a scale on which each step is ten times the one before, like pH", "סולם לוגריתמי", "סולם שבו כל צעד גדול פי עשרה מהקודם, כמו pH"],
      ["Ocean acidification", "the fall in seawater pH as the oceans absorb carbon dioxide", "החמצת האוקיינוסים", "הירידה ב־pH של מי הים כשהאוקיינוסים סופגים פחמן דו־חמצני"],
    ],
    q: [
      [["A solution at pH 3 has how many times more H⁺ ions than one at pH 5?", "100 times", ["2 times", "20 times", "1,000 times"], "Each pH step is a factor of 10: two steps is 10 × 10 = 100."],
        ["לתמיסה עם pH 3 יש פי כמה יוני H⁺ מאשר לתמיסה עם pH 5?", "פי 100", ["פי 2", "פי 20", "פי 1,000"], "כל צעד ב־pH הוא פי 10: שני צעדים הם 10 × 10 = 100."]],
      [["Hydrochloric acid reacts with sodium hydroxide. What are the products?", "Sodium chloride (salt) and water", ["Hydrogen and oxygen", "Chlorine gas only", "Carbon dioxide and water"], "HCl + NaOH → NaCl + H₂O: a typical neutralisation."],
        ["חומצה מלחית מגיבה עם נתרן הידרוקסידי. מה התוצרים?", "נתרן כלורי (מלח בישול) ומים", ["מימן וחמצן", "רק גז כלור", "פחמן דו־חמצני ומים"], "HCl + NaOH → NaCl + H₂O: תגובת סתירה טיפוסית."]],
      [["Why is ocean acidification a problem for corals and shellfish?", "More acidic water makes it harder to build calcium carbonate shells and skeletons", ["It makes the water too salty", "It heats the water to boiling", "It removes all oxygen at once"], "As the oceans absorb CO₂, pH falls and less carbonate is available for shells and coral skeletons."],
        ["למה החמצת האוקיינוסים היא בעיה לאלמוגים ולרכיכות?", "במים חומציים יותר קשה יותר לבנות קונכיות ושלדים מסידן פחמתי", ["היא הופכת את המים למלוחים מדי", "היא מחממת את המים עד רתיחה", "היא מוציאה בבת אחת את כל החמצן"], "כשהאוקיינוסים סופגים CO₂, ה־pH יורד ופחות פחמה זמינה לבניית קונכיות ושלדי אלמוגים."]],
    ],
  },
};
export default c;
