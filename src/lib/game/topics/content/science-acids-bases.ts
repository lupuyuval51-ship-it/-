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
      [["Why should you never taste unknown chemicals to test them?", "Many acids and bases are harmful or burn", ["Most of them taste far too sweet to compare", "Tasting changes their colour and spoils the test", "Tasting makes them neutral, so the test fails"], "Strong acids and bases can burn skin and mouth; scientists use indicators instead."],
        ["למה אסור לטעום חומרים לא מוכרים כדי לבדוק אותם?", "חומצות ובסיסים רבים מזיקים ואף צורבים", ["רובם מתוקים מדי בשביל להשוות ביניהם", "הטעימה משנה את הצבע ומקלקלת את הבדיקה", "הטעימה הופכת אותם לנייטרליים והבדיקה נכשלת"], "חומצות ובסיסים חזקים עלולים לצרוב את העור והפה; מדענים משתמשים באינדיקטורים במקום."]],
      [["Blue litmus paper turns red when it is dipped in a liquid. What does this show?", "The liquid is an acid", ["The liquid is a base, like soap or baking soda", "The liquid is neutral, like pure water", "The liquid is too hot to test"], "Litmus is an indicator. Blue litmus turns red in an acid, and red litmus turns blue in a base. In pure water neither paper changes colour."],
        ["נייר לקמוס כחול הופך לאדום כשמטבילים אותו בנוזל. מה זה מראה?", "הנוזל הוא חומצה", ["הנוזל הוא בסיס, כמו סבון או סודה לשתייה", "הנוזל נייטרלי, כמו מים טהורים", "הנוזל חם מדי לבדיקה"], "לקמוס הוא אינדיקטור. לקמוס כחול הופך לאדום בחומצה, ולקמוס אדום הופך לכחול בבסיס. במים טהורים אף אחד מהניירות לא משנה צבע."]],
      [["Which of these is a base?", "Baking soda", ["Fresh orange juice", "Vinegar", "Cola"], "Baking soda is a mild base. Orange juice contains citric acid, vinegar contains acetic acid and cola contains acids too, even though the sweetness hides the sour taste."],
        ["איזה מהבאים הוא בסיס?", "סודה לשתייה", ["מיץ תפוזים טרי", "חומץ", "קולה"], "סודה לשתייה היא בסיס מתון. במיץ תפוזים יש חומצת לימון, בחומץ יש חומצה אצטית ובקולה יש חומצות גם כן, אף שהמתיקות מסתירה את הטעם החמוץ."]],
      [["A bottle in the lab has the word “corrosive” on its label. What does that warn you about?", "It can eat away at skin, metal or other materials", ["It catches fire very easily when it is near a flame", "It is a gas that can float away through the room", "It is harmless, but only if you drink very little of it"], "Strong acids and strong bases are often corrosive. Flammable liquids, which catch fire, carry a different warning sign."],
        ["על בקבוק במעבדה כתובה המילה ״קורוזיבי״. מפני מה זו אזהרה?", "הוא יכול לכרסם בעור, במתכת או בחומרים אחרים", ["הוא נדלק בקלות רבה כשהוא קרוב ללהבה", "הוא גז שיכול להתפזר ולצוף בחדר", "הוא לא מזיק, אבל רק אם שותים ממנו מעט מאוד"], "חומצות חזקות ובסיסים חזקים הם לעיתים קרובות קורוזיביים. לנוזלים דליקים, שנדלקים, יש שלט אזהרה אחר."]],
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
      [["A solution has pH 2. It is…", "strongly acidic", ["strongly basic, like oven cleaner", "neutral, like pure water", "slightly basic, like soapy water"], "pH values below 7 are acidic; the lower the number, the more acidic."],
        ["לתמיסה יש pH 2. היא…", "חומצית מאוד", ["בסיסית מאוד, כמו חומר לניקוי תנורים", "נייטרלית, כמו מים טהורים", "בסיסית מעט, כמו מים עם סבון"], "ערכי pH מתחת ל־7 הם חומציים; ככל שהמספר נמוך יותר, החומציות גבוהה יותר."]],
      [["What do antacid tablets do for heartburn?", "They neutralise extra stomach acid", ["They add more acid so the food is digested faster", "They kill all the cells that line the stomach", "They turn the acid into sugar that the body uses"], "Antacids are mild bases that react with excess stomach acid."],
        ["מה עושות טבליות נוגדות חומצה לצרבת?", "סותרות חומצה עודפת בקיבה", ["מוסיפות עוד חומצה כדי שהמזון יתעכל מהר יותר", "הורגות את כל התאים שמצפים את הקיבה", "הופכות את החומצה לסוכר שהגוף משתמש בו"], "נוגדי חומצה הם בסיסים מתונים שמגיבים עם החומצה העודפת בקיבה."]],
      [["Vinegar has a pH of about 3 and soapy water has a pH of about 10. What do these numbers show?", "Vinegar is acidic and soapy water is basic", ["Vinegar is basic and soapy water is acidic", "Both are neutral, because both are liquids", "Soapy water is more acidic, because 10 is a bigger number than 3"], "Below 7 is acidic and above 7 is basic. A bigger pH number means less acidic, not more."],
        ["לחומץ יש pH של כ־3 ולמים עם סבון יש pH של כ־10. מה המספרים האלה מראים?", "החומץ חומצי והמים עם הסבון בסיסיים", ["החומץ בסיסי והמים עם הסבון חומציים", "שניהם נייטרליים, כי שניהם נוזלים", "המים עם הסבון חומציים יותר, כי 10 הוא מספר גדול מ־3"], "מתחת ל־7 זה חומצי ומעל 7 זה בסיסי. מספר pH גדול יותר פירושו פחות חומצי, לא יותר."]],
      [["Universal indicator is green in pure water. What colour does it turn in a strong acid?", "Red", ["Purple", "Dark blue", "It stays green, because acids do not change the colour"], "Universal indicator goes through the colours of the rainbow: red for strong acids, green for neutral and purple for strong bases."],
        ["אינדיקטור אוניברסלי ירוק במים טהורים. לאיזה צבע הוא הופך בחומצה חזקה?", "אדום", ["סגול", "כחול כהה", "הוא נשאר ירוק, כי חומצות לא משנות את הצבע"], "אינדיקטור אוניברסלי עובר בין צבעי הקשת: אדום לחומצות חזקות, ירוק לנייטרלי וסגול לבסיסים חזקים."]],
      [["A lake has become too acidic because of acid rain. What do people sometimes add to the water to fix it?", "Powdered limestone, which neutralises the acid", ["Vinegar, to clean the water", "Lemon juice, to help the fish", "More carbon dioxide, to make it fizzy"], "Limestone reacts with the acid and neutralises it. Adding more acid, such as vinegar or lemon juice, would make the lake worse."],
        ["אגם נעשה חומצי מדי בגלל גשם חומצי. מה מוסיפים לפעמים למים כדי לתקן את זה?", "אבקת אבן גיר, שסותרת את החומצה", ["חומץ, כדי לנקות את המים", "מיץ לימון, כדי לעזור לדגים", "עוד פחמן דו־חמצני, כדי שיהיו מבעבעים"], "אבן גיר מגיבה עם החומצה וסותרת אותה. הוספת חומצה נוספת, כמו חומץ או מיץ לימון, הייתה מחמירה את מצב האגם."]],
      [["Vinegar is poured on baking soda and the mixture fizzes. Which gas is in the bubbles?", "Carbon dioxide", ["Hydrogen", "Oxygen", "Chlorine"], "An acid reacting with baking soda makes salt, water and carbon dioxide gas. It is the same gas that makes fizzy drinks bubble."],
        ["חומץ נמזג על סודה לשתייה והתערובת מבעבעת. איזה גז יש בבועות?", "פחמן דו־חמצני", ["מימן", "חמצן", "כלור"], "חומצה שמגיבה עם סודה לשתייה יוצרת מלח, מים וגז פחמן דו־חמצני. זה אותו גז שגורם למשקאות מוגזים לבעבע."]],
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
      [["Hydrochloric acid reacts with sodium hydroxide. What are the products?", "Sodium chloride (salt) and water", ["Hydrogen gas and oxygen gas, as when water splits", "Chlorine gas only, bubbling out of the mixture", "Carbon dioxide and water, as when an acid meets chalk"], "HCl + NaOH → NaCl + H₂O: a typical neutralisation."],
        ["חומצה מלחית מגיבה עם נתרן הידרוקסידי. מה התוצרים?", "נתרן כלורי (מלח בישול) ומים", ["גז מימן וגז חמצן, כמו כשמים מתפרקים", "רק גז כלור, שמבעבע החוצה מהתערובת", "פחמן דו־חמצני ומים, כמו כשחומצה פוגשת גיר"], "HCl + NaOH → NaCl + H₂O: תגובת סתירה טיפוסית."]],
      [["Why is ocean acidification a problem for corals and shellfish?", "More acidic water makes it harder to build calcium carbonate shells and skeletons", ["It makes the water so salty that the animals dry out", "It heats the sea until it is too hot for any shellfish", "It removes all the oxygen from the water, so they suffocate"], "As the oceans absorb CO₂, pH falls and less carbonate is available for shells and coral skeletons."],
        ["למה החמצת האוקיינוסים היא בעיה לאלמוגים ולרכיכות?", "במים חומציים יותר קשה יותר לבנות קונכיות ושלדים מסידן פחמתי", ["היא הופכת את המים למלוחים כל כך שבעלי החיים מתייבשים", "היא מחממת את הים עד שחם מדי לכל רכיכה", "היא מוציאה מהמים את כל החמצן, והם נחנקים"], "כשהאוקיינוסים סופגים CO₂, ה־pH יורד ופחות פחמה זמינה לבניית קונכיות ושלדי אלמוגים."]],
      [["Rain is always slightly acidic, with a pH of about 5.6, even in clean air. Which gas dissolved in the raindrops causes this?", "Carbon dioxide", ["Nitrogen", "Oxygen", "Argon"], "Carbon dioxide dissolves in rainwater and forms a weak acid, carbonic acid. Acid rain, with a much lower pH, is caused mainly by sulfur dioxide and nitrogen oxides from burning fuels."],
        ["גשם הוא תמיד חומצי מעט, עם pH של כ־5.6, גם באוויר נקי. איזה גז שמומס בטיפות הגשם גורם לכך?", "פחמן דו־חמצני", ["חנקן", "חמצן", "ארגון"], "פחמן דו־חמצני מתמוסס במי הגשם ויוצר חומצה חלשה, חומצה פחמתית. גשם חומצי, עם pH נמוך בהרבה, נגרם בעיקר מגופרית דו־חמצנית ומתחמוצות חנקן משריפת דלקים."]],
      [["What makes an acid a strong acid?", "It splits into ions almost completely in water", ["Its solution is very concentrated, with a lot of acid in little water", "It always has a pH of exactly 0", "It reacts only with metals, never with bases"], "Strength is about how fully the acid splits into H⁺ ions, not about how much acid is dissolved. A concentrated solution of a weak acid, such as vinegar, is still weak."],
        ["מה הופך חומצה לחומצה חזקה?", "היא מתפרקת ליונים כמעט לגמרי במים", ["התמיסה שלה מרוכזת מאוד, עם הרבה חומצה במעט מים", "יש לה תמיד pH של בדיוק 0", "היא מגיבה רק עם מתכות, אף פעם לא עם בסיסים"], "חוזק קשור לכמה שלמה החומצה מתפרקת ליוני H⁺, ולא לכמה חומצה מומסת. תמיסה מרוכזת של חומצה חלשה, כמו חומץ, עדיין חלשה."]],
    ],
    n: [
      [8, ["Pure water has pH 7. A solution has ten times fewer H⁺ ions than pure water. What is its pH?", "", "Each pH step is a factor of 10. Ten times fewer H⁺ ions means the solution is one step less acidic, so the pH goes up from 7 to 8."],
        ["ל־pH של מים טהורים יש ערך 7. בתמיסה יש פי עשרה פחות יוני H⁺ מאשר במים טהורים. מהו ה־pH שלה?", "", "כל צעד ב־pH הוא פי 10. פי עשרה פחות יוני H⁺ פירושו צעד אחד פחות חומצי, ולכן ה־pH עולה מ־7 ל־8."]],
    ],
  },
};
export default c;
