import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Rate of change", "how fast one quantity changes compared with another, such as kilometres per hour", "קצב שינוי", "באיזו מהירות גודל אחד משתנה ביחס לגודל אחר, למשל קילומטרים לשעה"],
      ["Derivative", "a function f′(x) that gives the slope of the graph of f at each point", "נגזרת", "פונקציה f′(x) שנותנת את השיפוע של הגרף של f בכל נקודה"],
      ["Tangent line", "a straight line that touches a curve at a point and has the same slope as the curve there", "משיק", "ישר שנוגע בעקומה בנקודה ויש לו שם אותו שיפוע כמו לעקומה"],
    ],
    q: [
      [["What does the derivative of a function tell you at a point?", "The slope of the graph at that point", ["The value of the function at that point", "The area under the graph up to that point", "Where the graph crosses the y-axis"], "The derivative f′(a) is the slope of the tangent at x = a: how steeply the graph rises or falls there. The value f(a) is the height of the point, which is a different thing."],
        ["מה הנגזרת של פונקציה אומרת בנקודה מסוימת?", "את השיפוע של הגרף באותה נקודה", ["את הערך של הפונקציה באותה נקודה", "את השטח שמתחת לגרף עד אותה נקודה", "איפה הגרף חותך את ציר y"], "הנגזרת f′(a) היא השיפוע של המשיק ב־x = a: עד כמה הגרף עולה או יורד שם. הערך f(a) הוא הגובה של הנקודה, וזה דבר אחר."]],
      [["What is the derivative of f(x) = x³?", "3x²", ["3x³", "x²", "x⁴/4"], "By the power rule, the derivative of xⁿ is n·xⁿ⁻¹: bring the 3 down and lower the power by one, giving 3x². x⁴/4 is what you get going the other way, by integrating."],
        ["מהי הנגזרת של f(x) = x³?", "3x²", ["3x³", "x²", "x⁴/4"], "לפי כלל הגזירה של חזקה, הנגזרת של xⁿ היא n·xⁿ⁻¹: מורידים את 3 ככופל ומקטינים את המעריך ב־1, ומקבלים 3x². הביטוי x⁴/4 מתקבל כשהולכים בכיוון ההפוך, באינטגרציה."]],
      [["What is the derivative of a constant function, such as f(x) = 7?", "0", ["7", "1", "7x"], "The graph of f(x) = 7 is a horizontal line: it does not rise or fall anywhere, so its slope, the derivative, is 0 everywhere."],
        ["מהי הנגזרת של פונקציה קבועה, כמו f(x) = 7?", "0", ["7", "1", "7x"], "הגרף של f(x) = 7 הוא ישר אופקי: הוא לא עולה ולא יורד בשום מקום, ולכן השיפוע שלו, הנגזרת, הוא 0 בכל מקום."]],
      [["f′(x) is positive for every x in an interval. What does the graph of f do there?", "It rises", ["It falls", "It stays flat", "It lies above the x-axis"], "A positive slope means the graph goes up as x increases. Lying above the x-axis is about f(x) itself being positive, which is a different question."],
        ["הנגזרת f′(x) חיובית לכל x בתחום מסוים. מה עושה שם הגרף של f?", "הוא עולה", ["הוא יורד", "הוא נשאר אופקי", "הוא נמצא מעל ציר x"], "שיפוע חיובי פירושו שהגרף עולה כש־x גדל. השאלה אם הגרף נמצא מעל ציר x קשורה לכך ש־f(x) עצמה חיובית, וזו שאלה אחרת."]],
      [["What is the derivative of f(x) = 5x?", "5", ["5x", "x", "0"], "f(x) = 5x is a straight line with slope 5, and the derivative of a straight line is its slope: f′(x) = 5 everywhere."],
        ["מהי הנגזרת של f(x) = 5x?", "5", ["5x", "x", "0"], "הפונקציה f(x) = 5x היא ישר שהשיפוע שלו 5, והנגזרת של ישר היא השיפוע שלו: f′(x) = 5 בכל מקום."]],
    ],
    n: [
      [4, ["f(x) = x². What is the average rate of change from x = 1 to x = 3?", "", "(f(3) − f(1)) ÷ (3 − 1) = (9 − 1) ÷ 2 = 4: on average the graph rises 4 units for each unit to the right."],
        ["נתונה f(x) = x². מהו קצב השינוי הממוצע מ־x = 1 עד x = 3?", "", "קצב השינוי הממוצע הוא (f(3) − f(1)) ÷ (3 − 1) = (9 − 1) ÷ 2 = 4: בממוצע הגרף עולה 4 יחידות על כל יחידה ימינה."]],
      [6, ["What is the slope of the tangent to y = x² at x = 3?", "", "The derivative of x² is 2x, so the slope at x = 3 is 2 × 3 = 6."],
        ["מהו השיפוע של המשיק ל־y = x² בנקודה שבה x = 3?", "", "הנגזרת של x² היא 2x, ולכן השיפוע ב־x = 3 הוא 2 × 3 = 6."]],
    ],
  },
  i: {
    t: [
      ["Average rate of change", "(f(b) − f(a)) ÷ (b − a): the slope of the straight line joining two points of a graph", "קצב שינוי ממוצע", "הביטוי (f(b) − f(a)) ÷ (b − a) הוא השיפוע של הישר שמחבר שתי נקודות על הגרף"],
      ["Instantaneous rate of change", "how fast a quantity is changing at one exact moment; it is given by the derivative", "קצב שינוי רגעי", "המהירות שבה גודל משתנה ברגע אחד מסוים; היא ניתנת על ידי הנגזרת"],
      ["Extreme point", "a maximum or minimum point, where a graph turns from rising to falling or the other way", "נקודת קיצון", "נקודת מקסימום או מינימום, שבה הגרף עובר מעלייה לירידה או מירידה לעלייה"],
      ["Power rule", "(xⁿ)′ = n·xⁿ⁻¹: the exponent comes down in front and is lowered by 1", "כלל הגזירה של חזקה", "הנוסחה (xⁿ)′ = n·xⁿ⁻¹: המעריך יורד לפני הביטוי ככופל וקטן ב־1"],
    ],
    q: [
      [["f(x) = x² − 6x + 1. Where does its graph have a horizontal tangent?", "At x = 3", ["At x = 6", "At x = −3", "At x = 1"], "f′(x) = 2x − 6, and a horizontal tangent has slope 0: 2x − 6 = 0 gives x = 3. That is the lowest point of this parabola."],
        ["נתונה f(x) = x² − 6x + 1. באיזו נקודה יש לגרף משיק אופקי?", "ב־x = 3", ["ב־x = 6", "ב־x = −3", "ב־x = 1"], "הנגזרת היא f′(x) = 2x − 6, ולמשיק אופקי יש שיפוע 0: מ־2x − 6 = 0 מקבלים x = 3. זו הנקודה הנמוכה ביותר של הפרבולה הזאת."]],
      [["What is the derivative of f(x) = 4x³ − 2x + 9?", "12x² − 2", ["12x² + 7", "12x² − 2x", "4x² − 2"], "Differentiate term by term: 4x³ gives 12x², −2x gives −2, and the constant 9 gives 0. So f′(x) = 12x² − 2."],
        ["מהי הנגזרת של f(x) = 4x³ − 2x + 9?", "12x² − 2", ["12x² + 7", "12x² − 2x", "4x² − 2"], "גוזרים איבר אחר איבר: 4x³ נותן 12x², האיבר −2x נותן −2, והקבוע 9 נותן 0. לכן f′(x) = 12x² − 2."]],
      [["f(x) = x³ − 12x. On which interval is the function decreasing?", "Between x = −2 and x = 2", ["When x is less than −2 or more than 2", "Only at x = 0", "For every negative x"], "f′(x) = 3x² − 12 = 3(x² − 4), which is negative when x² is less than 4, that is between −2 and 2. Outside that interval f′ is positive and the function increases."],
        ["נתונה f(x) = x³ − 12x. באיזה תחום הפונקציה יורדת?", "בין x = −2 ל־x = 2", ["כש־x קטן מ־−2 או גדול מ־2", "רק ב־x = 0", "לכל x שלילי"], "הנגזרת f′(x) = 3x² − 12 = 3(x² − 4) היא שלילית כש־x² קטן מ־4, כלומר בין −2 ל־2. מחוץ לתחום הזה f′ חיובית והפונקציה עולה."]],
      [["Which statement is true at a maximum point of a smooth curve?", "The derivative is 0 and changes from positive to negative", ["The derivative is 0 and changes from negative to positive", "The derivative reaches its largest value there", "The value of the function is 0 there"], "Before a maximum the graph rises (f′ positive), after it the graph falls (f′ negative), and at the top the tangent is flat, so f′ = 0. A change from negative to positive marks a minimum."],
        ["איזו טענה נכונה בנקודת מקסימום של עקומה חלקה?", "הנגזרת שווה 0 ומשנה סימן מחיובי לשלילי", ["הנגזרת שווה 0 ומשנה סימן משלילי לחיובי", "הנגזרת מגיעה שם לערך הגדול ביותר שלה", "ערך הפונקציה שם הוא 0"], "לפני מקסימום הגרף עולה (f′ חיובית), אחריו הגרף יורד (f′ שלילית), ובפסגה המשיק אופקי, ולכן f′ = 0. מעבר משלילי לחיובי מסמן מינימום."]],
      [["What is the equation of the tangent to y = x² at the point where x = 1?", "y = 2x − 1", ["y = 2x + 1", "y = 2x", "y = x + 1"], "The slope is 2 × 1 = 2 and the point is (1, 1). So y − 1 = 2(x − 1), which gives y = 2x − 1. Check: at x = 1, y = 1."],
        ["מהי משוואת המשיק ל־y = x² בנקודה שבה x = 1?", "y = 2x − 1", ["y = 2x + 1", "y = 2x", "y = x + 1"], "השיפוע הוא 2 × 1 = 2 והנקודה היא זו שבה x ו־y שווים 1. לכן y − 1 = 2(x − 1), ומכאן y = 2x − 1. בדיקה: ב־x = 1 מתקבל y = 1."]],
    ],
    n: [
      [10, ["A ball's height after t seconds is h(t) = 20t − 5t² metres. What is its upward speed at t = 1?", "m/s", "The velocity is the derivative h′(t) = 20 − 10t. At t = 1 it is 20 − 10 = 10 m/s."],
        ["הגובה של כדור אחרי t שניות הוא h(t) = 20t − 5t² מטרים. מהי מהירותו כלפי מעלה ב־t = 1?", "מ׳/ש׳", "המהירות היא הנגזרת h′(t) = 20 − 10t. ב־t = 1 היא 20 − 10 = 10 מ׳/ש׳."]],
      [12, ["f(x) = x³. What is f′(2)?", "", "By the power rule f′(x) = 3x², so f′(2) = 3 × 2² = 3 × 4 = 12."],
        ["נתונה f(x) = x³. כמה זה f′(2)?", "", "לפי כלל הגזירה של חזקה f′(x) = 3x², ולכן f′(2) = 3 × 2² = 3 × 4 = 12."]],
    ],
    s: [[["Finding the extreme points of f(x) = x³ − 3x, in order", "Find the derivative: f′(x) = 3x² − 3", "Solve f′(x) = 0 to get x = −1 or x = 1", "Check the sign of f′ on each side of these points", "Conclude: a maximum at x = −1 and a minimum at x = 1"],
      ["מציאת נקודות הקיצון של f(x) = x³ − 3x, לפי הסדר", "גוזרים: f′(x) = 3x² − 3", "פותרים את f′(x) = 0 ומקבלים x = −1 או x = 1", "בודקים את הסימן של f′ משני הצדדים של הנקודות האלה", "מסיקים: מקסימום ב־x = −1 ומינימום ב־x = 1"]]],
  },
  a: {
    t: [
      ["Second derivative", "the derivative of the derivative, f″(x); it shows how the slope itself is changing", "נגזרת שנייה", "הנגזרת של הנגזרת, f″(x); היא מראה איך השיפוע עצמו משתנה"],
      ["Point of inflection", "a point where a graph changes from curving upwards to curving downwards, or the other way", "נקודת פיתול", "נקודה שבה הגרף עובר מקעירות כלפי מעלה לקעירות כלפי מטה, או להפך"],
      ["Limit", "the value that an expression gets as close to as you like as its input approaches a given number", "גבול", "הערך שביטוי מתקרב אליו ככל שרוצים כשהמשתנה שלו מתקרב למספר נתון"],
    ],
    q: [
      [["Which expression defines f′(x)?", "The limit of (f(x + h) − f(x)) ÷ h as h approaches 0", ["The limit of (f(x + h) − f(x)) ÷ h as h approaches 1", "(f(x + h) + f(x)) ÷ 2h, with h = 0", "The value of f(x) ÷ x as x approaches 0"], "(f(x + h) − f(x)) ÷ h is the slope of a line through two close points of the graph. Letting h shrink to 0 turns it into the slope of the tangent, f′(x). You cannot simply put h = 0, because that gives 0 ÷ 0."],
        ["איזה ביטוי מגדיר את f′(x)?", "הגבול של (f(x + h) − f(x)) ÷ h כש־h שואף ל־0", ["הגבול של (f(x + h) − f(x)) ÷ h כש־h שואף ל־1", "(f(x + h) + f(x)) ÷ 2h, כאשר h = 0", "הערך של f(x) ÷ x כש־x שואף ל־0"], "הביטוי (f(x + h) − f(x)) ÷ h הוא השיפוע של ישר שעובר דרך שתי נקודות קרובות על הגרף. כש־h קטן עד 0, הוא הופך לשיפוע המשיק, f′(x). אי אפשר פשוט להציב h = 0, כי מקבלים 0 ÷ 0."]],
      [["f(x) = x³ has f′(0) = 0. What kind of point is (0, 0)?", "Neither a maximum nor a minimum", ["A minimum, because f′(0) = 0", "A maximum, because f′(0) = 0", "A point where the function has no value at all"], "f′(x) = 3x² is positive on both sides of 0, so the graph rises, flattens for a moment at (0, 0) and keeps rising: it is an inflection point. f′ = 0 alone does not prove an extreme point."],
        ["לפונקציה f(x) = x³ מתקיים f′(0) = 0. מה סוג הנקודה שבה x שווה 0?", "לא מקסימום ולא מינימום", ["מינימום, כי f′(0) = 0", "מקסימום, כי f′(0) = 0", "נקודה שבה לפונקציה אין שום ערך"], "הנגזרת f′(x) = 3x² חיובית משני הצדדים של 0, ולכן הגרף עולה, נעשה אופקי לרגע בנקודה הזאת וממשיך לעלות: זו נקודת פיתול. f′ = 0 לבדו לא מוכיח שיש נקודת קיצון."]],
      [["f(x) = x³ − 3x² + 4 has f′(2) = 0 and f″(2) = 6. What is x = 2?", "A minimum point", ["A maximum point", "An inflection point", "A point where f is not defined"], "f′(2) = 0 marks a flat point, and a positive second derivative means the slope is increasing there, from negative to positive. The graph curves upwards like a valley, so x = 2 is a minimum, with f(2) = 0."],
        ["לפונקציה f(x) = x³ − 3x² + 4 מתקיים f′(2) = 0 ו־f″(2) = 6. מהי הנקודה x = 2?", "נקודת מינימום", ["נקודת מקסימום", "נקודת פיתול", "נקודה שבה f לא מוגדרת"], "הערך f′(2) = 0 מסמן נקודה אופקית, ונגזרת שנייה חיובית פירושה שהשיפוע עולה שם, משלילי לחיובי. הגרף מתעקם כלפי מעלה כמו עמק, ולכן x = 2 היא נקודת מינימום, ו־f(2) = 0."]],
      [["Which function has the derivative f′(x) = 6x² − 2x?", "f(x) = 2x³ − x² + 5", ["f(x) = 2x³ − 2x² + 5", "f(x) = 6x³ − 2x²", "f(x) = 12x − 2"], "Differentiate each option: (2x³ − x² + 5)′ = 6x² − 2x, and the constant 5 disappears. 12x − 2 is the derivative of f′, not the function itself."],
        ["לאיזו פונקציה הנגזרת היא f′(x) = 6x² − 2x?", "f(x) = 2x³ − x² + 5", ["f(x) = 2x³ − 2x² + 5", "f(x) = 6x³ − 2x²", "f(x) = 12x − 2"], "גוזרים כל אפשרות: (2x³ − x² + 5)′ = 6x² − 2x, והקבוע 5 נעלם. הביטוי 12x − 2 הוא הנגזרת של f′, ולא הפונקציה עצמה."]],
      [["A car's position is s(t) = t³ − 6t² + 9t metres after t seconds. When is the car momentarily at rest?", "At t = 1 and at t = 3", ["At t = 0 and at t = 3", "Only at t = 2", "At t = 1, 3 and 9"], "The velocity is s′(t) = 3t² − 12t + 9 = 3(t − 1)(t − 3), which is 0 at t = 1 and t = 3. At t = 0 the position is 0, but the car is moving at 9 m/s."],
        ["המיקום של מכונית אחרי t שניות הוא s(t) = t³ − 6t² + 9t מטרים. מתי המכונית עומדת לרגע?", "ב־t = 1 וב־t = 3", ["ב־t = 0 וב־t = 3", "רק ב־t = 2", "ב־t = 1, ב־t = 3 וב־t = 9"], "המהירות היא s′(t) = 3t² − 12t + 9 = 3(t − 1)(t − 3), והיא 0 ב־t = 1 וב־t = 3. ב־t = 0 המיקום הוא 0, אבל המכונית נוסעת במהירות 9 מ׳/ש׳."]],
      [["f(x) = x² on the interval from x = 0 to x = 5. Where is its largest value?", "At x = 5, the end of the interval", ["At x = 0, where f′(x) = 0", "At x = 2.5, the middle of the interval", "There is no largest value"], "f′(x) = 2x is 0 only at x = 0, which gives the smallest value. The function rises all the way, so on this interval its largest value, 25, is at the end x = 5. Always check the ends too."],
        ["נתונה הפונקציה f(x) = x² בתחום מ־x = 0 עד x = 5. איפה הערך הגדול ביותר שלה?", "ב־x = 5, בקצה התחום", ["ב־x = 0, שם f′(x) = 0", "ב־x = 2.5, באמצע התחום", "אין לה ערך גדול ביותר"], "הנגזרת f′(x) = 2x מתאפסת רק ב־x = 0, ושם הערך הקטן ביותר. הפונקציה עולה כל הזמן, ולכן בתחום הזה הערך הגדול ביותר שלה, 25, נמצא בקצה, ב־x = 5. תמיד צריך לבדוק גם את קצות התחום."]],
    ],
    n: [
      [200, ["A farmer has 40 m of fence to make three sides of a rectangular pen; a long wall forms the fourth side. What is the largest area the pen can have?", "m²", "With width x the length is 40 − 2x, so A(x) = 40x − 2x². A′(x) = 40 − 4x = 0 at x = 10, giving a pen of 10 m by 20 m with area 200 m²."],
        ["לחקלאי יש 40 מטר של גדר לשלוש צלעות של מכלאה מלבנית, וקיר ארוך משמש כצלע הרביעית. מהו השטח הגדול ביותר שיכול להיות למכלאה?", "מ״ר", "אם הרוחב x, האורך הוא 40 − 2x, ולכן A(x) = 40x − 2x². הנגזרת A′(x) = 40 − 4x מתאפסת ב־x = 10, ומתקבלת מכלאה של 10 מטר על 20 מטר ששטחה 200 מ״ר."]],
      [4, ["f(x) = x³ − 3x² + 4. What is the y-value of its local maximum point?", "", "f′(x) = 3x² − 6x = 3x(x − 2) is 0 at x = 0 and x = 2. f″(0) = −6 is negative, so x = 0 is the local maximum, and f(0) = 4."],
        ["נתונה f(x) = x³ − 3x² + 4. מהו ערך ה־y של נקודת המקסימום המקומי שלה?", "", "הנגזרת f′(x) = 3x² − 6x = 3x(x − 2) מתאפסת ב־x = 0 וב־x = 2. הנגזרת השנייה f″(0) = −6 שלילית, ולכן x = 0 היא נקודת המקסימום המקומי, ו־f(0) = 4."]],
    ],
  },
};
export default c;
