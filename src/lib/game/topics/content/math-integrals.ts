import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Antiderivative", "a function F whose derivative is f, so that F′(x) = f(x)", "פונקציה קדומה", "פונקציה F שהנגזרת שלה היא f, כלומר F′(x) = f(x)"],
      ["Definite integral", "∫ from a to b of f(x) dx; for a positive f it is the area under the graph between x = a and x = b", "אינטגרל מסוים", "המספר ∫ מ־a עד b של f(x) dx; כש־f חיובית, הוא השטח שמתחת לגרף בין x = a ל־x = b"],
      ["Constant of integration", "the number C added to an antiderivative, because adding a constant does not change the derivative", "קבוע האינטגרציה", "המספר C שמוסיפים לפונקציה קדומה, כי הוספת קבוע לא משנה את הנגזרת"],
    ],
    q: [
      [["Which function is an antiderivative of f(x) = 2x?", "F(x) = x²", ["F(x) = 2x²", "F(x) = 2", "F(x) = x"], "The derivative of x² is 2x, so x² is an antiderivative of 2x. The derivative of 2x² would be 4x, and 2 is the derivative of 2x, not the other way round."],
        ["איזו פונקציה היא פונקציה קדומה של f(x) = 2x?", "F(x) = x²", ["F(x) = 2x²", "F(x) = 2", "F(x) = x"], "הנגזרת של x² היא 2x, ולכן x² היא פונקציה קדומה של 2x. הנגזרת של 2x² הייתה 4x, והמספר 2 הוא הנגזרת של 2x, ולא להפך."]],
      [["What is the area under the line y = 3 between x = 0 and x = 4?", "12", ["7", "14", "3"], "The region is a rectangle 4 wide and 3 high, so its area is 4 × 3 = 12. The integral gives the same: 3 × 4 − 3 × 0 = 12."],
        ["מהו השטח שמתחת לישר y = 3 בין x = 0 ל־x = 4?", "12", ["7", "14", "3"], "האזור הוא מלבן ברוחב 4 ובגובה 3, ולכן השטח שלו 4 × 3 = 12. האינטגרל נותן אותו דבר: 3 × 4 − 3 × 0 = 12."]],
      [["Why do we write + C after an antiderivative?", "Adding any number to F does not change its derivative", ["C is the area under the curve, which must be added at the end", "Every integral is equal to the same constant number C", "C stands for the word “curve” in the integral"], "x², x² + 1 and x² + 5 all have the derivative 2x, so every function x² + C is an antiderivative of 2x. The constant C stands for all of them at once."],
        ["למה כותבים + C אחרי פונקציה קדומה?", "הוספת מספר כלשהו ל־F לא משנה את הנגזרת שלה", ["C הוא השטח שמתחת לעקומה, ומוסיפים אותו בסוף", "כל אינטגרל שווה לאותו מספר קבוע C", "C הוא קיצור של המילה האנגלית ״curve״, כלומר עקומה"], "ל־x², ל־x² + 1 ול־x² + 5 יש אותה נגזרת, 2x, ולכן כל פונקציה x² + C היא פונקציה קדומה של 2x. הקבוע C מייצג את כולן יחד."]],
      [["What is ∫ x³ dx?", "x⁴/4 + C", ["3x² + C", "x³/3 + C", "x⁴ + C"], "Raise the power by one and divide by the new power: x³ becomes x⁴/4. Check: the derivative of x⁴/4 is x³. 3x² is the derivative of x³, not its antiderivative."],
        ["כמה זה ∫ x³ dx?", "x⁴/4 + C", ["3x² + C", "x³/3 + C", "x⁴ + C"], "מעלים את המעריך ב־1 ומחלקים במעריך החדש: x³ הופך ל־x⁴/4. בדיקה: הנגזרת של x⁴/4 היא x³. הביטוי 3x² הוא הנגזרת של x³, ולא הפונקציה הקדומה שלו."]],
      [["What is ∫ 5 dx?", "5x + C", ["5 + C", "5x² + C", "0"], "The derivative of 5x is 5, so the antiderivatives of 5 are 5x + C. 0 is the derivative of 5, not its antiderivative."],
        ["כמה זה ∫ 5 dx?", "5x + C", ["5 + C", "5x² + C", "0"], "הנגזרת של 5x היא 5, ולכן הפונקציות הקדומות של 5 הן 5x + C. המספר 0 הוא הנגזרת של 5, ולא הפונקציה הקדומה שלו."]],
    ],
    n: [
      [4, ["What is the integral of 2x from x = 0 to x = 2?", "", "x² is an antiderivative of 2x, so the integral is 2² − 0² = 4. It is also the area of a triangle with base 2 and height 4: ½ × 2 × 4 = 4."],
        ["כמה זה האינטגרל של 2x מ־x = 0 עד x = 2?", "", "הפונקציה x² היא קדומה של 2x, ולכן האינטגרל הוא 2² − 0² = 4. זה גם השטח של משולש שהבסיס שלו 2 והגובה שלו 4: ½ × 2 × 4 = 4."]],
      [18, ["What is the area under y = x between x = 0 and x = 6?", "", "The region is a triangle with base 6 and height 6, so its area is ½ × 6 × 6 = 18. The antiderivative x²/2 gives the same: 36 ÷ 2 = 18."],
        ["מהו השטח שמתחת ל־y = x בין x = 0 ל־x = 6?", "", "האזור הוא משולש שהבסיס שלו 6 והגובה שלו 6, ולכן השטח הוא ½ × 6 × 6 = 18. הפונקציה הקדומה x²/2 נותנת אותו דבר: 36 ÷ 2 = 18."]],
    ],
  },
  i: {
    t: [
      ["Fundamental theorem of calculus", "the integral of f from a to b equals F(b) − F(a), where F is any antiderivative of f", "המשפט היסודי של החשבון האינפיניטסימלי", "האינטגרל של f מ־a עד b שווה ל־F(b) − F(a), כאשר F היא פונקציה קדומה כלשהי של f"],
      ["Indefinite integral", "∫ f(x) dx: the family of all antiderivatives of f, written F(x) + C", "אינטגרל לא מסוים", "הביטוי ∫ f(x) dx הוא אוסף כל הפונקציות הקדומות של f, שנכתב F(x) + C"],
      ["Limits of integration", "the numbers a and b at the bottom and top of the integral sign, where the area starts and ends", "גבולות האינטגרציה", "המספרים a ו־b שבתחתית ובראש של סימן האינטגרל, שבהם השטח מתחיל ונגמר"],
    ],
    q: [
      [["What is the integral of 2x from x = 1 to x = 3?", "8", ["9", "6", "4"], "x² is an antiderivative of 2x, so the integral is 3² − 1² = 9 − 1 = 8. Forgetting to subtract the value at x = 1 gives 9."],
        ["כמה זה האינטגרל של 2x מ־x = 1 עד x = 3?", "8", ["9", "6", "4"], "הפונקציה x² היא קדומה של 2x, ולכן האינטגרל הוא 3² − 1² = 9 − 1 = 8. מי ששוכח לחסר את הערך ב־x = 1 מקבל 9."]],
      [["What is the integral of x² + 1 from x = 0 to x = 2?", "14/3", ["8/3", "10/3", "5"], "An antiderivative is x³/3 + x. At x = 2 it is 8/3 + 2 = 14/3, and at x = 0 it is 0, so the integral is 14/3, about 4.67. 8/3 forgets the + 1 in the function."],
        ["כמה זה האינטגרל של x² + 1 מ־x = 0 עד x = 2?", "14/3", ["8/3", "10/3", "5"], "פונקציה קדומה היא x³/3 + x. ב־x = 2 היא שווה ל־8/3 + 2 = 14/3, וב־x = 0 היא 0, ולכן האינטגרל הוא 14/3, בערך 4.67. התשובה 8/3 מתעלמת מהמחובר 1 שבפונקציה."]],
      [["The graph of f lies below the x-axis between x = 0 and x = 2. What is the sign of the integral of f from 0 to 2?", "Negative", ["Positive", "Zero", "It depends on the constant C"], "Each strip has a negative height f(x), so the integral adds up negative amounts and is negative. The area itself is the absolute value of this integral, and the constant C cancels in a definite integral."],
        ["הגרף של f נמצא מתחת לציר x בין x = 0 ל־x = 2. מה הסימן של האינטגרל של f מ־0 עד 2?", "שלילי", ["חיובי", "אפס", "זה תלוי בקבוע C"], "לכל רצועה יש גובה שלילי f(x), ולכן האינטגרל מחבר כמויות שליליות ויוצא שלילי. השטח עצמו הוא הערך המוחלט של האינטגרל הזה, והקבוע C מתבטל באינטגרל מסוים."]],
      [["What is ∫ (6x² − 4x + 1) dx?", "2x³ − 2x² + x + C", ["6x³ − 4x² + x + C", "12x − 4 + C", "2x³ − 2x² + C"], "Integrate term by term: 6x² gives 2x³, −4x gives −2x², and 1 gives x; then add C. Check by differentiating: 6x² − 4x + 1. 12x − 4 is the derivative instead."],
        ["כמה זה ∫ (6x² − 4x + 1) dx?", "2x³ − 2x² + x + C", ["6x³ − 4x² + x + C", "12x − 4 + C", "2x³ − 2x² + C"], "מבצעים אינטגרציה איבר אחר איבר: 6x² נותן 2x³, האיבר −4x נותן −2x², ו־1 נותן x, ואז מוסיפים C. בדיקה בגזירה: 6x² − 4x + 1. הביטוי 12x − 4 הוא הנגזרת."]],
      [["Which integral gives the area between y = x and y = x² from x = 0 to x = 1?", "∫ from 0 to 1 of (x − x²) dx", ["∫ from 0 to 1 of (x² − x) dx", "∫ from 0 to 1 of x² dx", "∫ from 0 to 1 of (x + x²) dx"], "Between 0 and 1 the line y = x is above the parabola (at x = 0.5: 0.5 against 0.25). The area is the integral of top minus bottom, x − x². The other order gives a negative number."],
        ["איזה אינטגרל נותן את השטח שבין y = x ל־y = x² מ־x = 0 עד x = 1?", "∫ מ־0 עד 1 של (x − x²) dx", ["∫ מ־0 עד 1 של (x² − x) dx", "∫ מ־0 עד 1 של x² dx", "∫ מ־0 עד 1 של (x + x²) dx"], "בין 0 ל־1 הישר y = x נמצא מעל הפרבולה (למשל ב־x = 0.5 מקבלים 0.5 לעומת 0.25). השטח הוא האינטגרל של העליונה פחות התחתונה, x − x². בסדר ההפוך מקבלים מספר שלילי."]],
    ],
    n: [
      [13, ["F is an antiderivative of 2x, and F(1) = 5. What is F(3)?", "", "F(x) = x² + C, and F(1) = 1 + C = 5 gives C = 4. So F(3) = 9 + 4 = 13."],
        ["הפונקציה F היא קדומה של 2x, ו־F(1) = 5. כמה זה F(3)?", "", "מקבלים F(x) = x² + C, ומ־F(1) = 1 + C = 5 מקבלים C = 4. לכן F(3) = 9 + 4 = 13."]],
      [9, ["What is the area under y = x² from x = 0 to x = 3?", "", "x³/3 is an antiderivative of x², so the area is 3³/3 − 0 = 27 ÷ 3 = 9."],
        ["מהו השטח שמתחת ל־y = x² מ־x = 0 עד x = 3?", "", "הפונקציה x³/3 היא קדומה של x², ולכן השטח הוא 3³/3 − 0 = 27 ÷ 3 = 9."]],
    ],
    s: [[["Estimating an area with rectangles, in order", "Split the interval from a to b into equal narrow strips", "On each strip draw a rectangle as high as the graph", "Add up the areas of all the rectangles", "Make the strips narrower and narrower: the sum approaches the integral"],
      ["הערכת שטח בעזרת מלבנים, לפי הסדר", "מחלקים את התחום מ־a עד b לרצועות צרות ושוות", "על כל רצועה משרטטים מלבן בגובה של הגרף", "מחברים את השטחים של כל המלבנים", "מצרים את הרצועות עוד ועוד: הסכום מתקרב לאינטגרל"]]],
  },
  a: {
    t: [
      ["Area between curves", "the integral of (top function − bottom function), usually from one meeting point of the graphs to the next", "שטח בין גרפים", "האינטגרל של (הפונקציה העליונה פחות התחתונה), בדרך כלל מנקודת חיתוך אחת של הגרפים לבאה"],
      ["Riemann sum", "an estimate of an area made by adding up the areas of thin rectangles under a graph", "סכום רימן", "הערכה של שטח שמתקבלת מחיבור השטחים של מלבנים צרים מתחת לגרף"],
      ["Intersection points", "the points where two graphs meet, found by setting the two functions equal", "נקודות חיתוך", "הנקודות שבהן שני גרפים נפגשים; מוצאים אותן כשמשווים בין שתי הפונקציות"],
    ],
    q: [
      [["What is the area enclosed between y = x² and y = 4?", "32/3", ["16/3", "16", "8/3"], "The graphs meet where x² = 4, at x = −2 and x = 2. The area is the integral of 4 − x² from −2 to 2: (8 − 8/3) − (−8 + 8/3) = 32/3, about 10.67. 16/3 is only the right half."],
        ["מהו השטח הכלוא בין y = x² ל־y = 4?", "32/3", ["16/3", "16", "8/3"], "הגרפים נפגשים כש־x² = 4, כלומר ב־x = −2 וב־x = 2. השטח הוא האינטגרל של 4 − x² מ־−2 עד 2, כלומר (8 − 8/3) − (−8 + 8/3) = 32/3, בערך 10.67. התשובה 16/3 היא רק החצי הימני."]],
      [["The integral of x³ from −1 to 1 equals 0. Why?", "The part below the axis cancels the equal part above it", ["The function x³ is equal to zero at every point from −1 to 1", "The constant C cancels everything out", "Odd powers of x cannot be integrated"], "x⁴/4 is an antiderivative, and 1/4 − 1/4 = 0. The graph is below the axis from −1 to 0 and above it from 0 to 1, with equal areas of 1/4, so their contributions cancel. The total area is 1/2."],
        ["האינטגרל של x³ מ־−1 עד 1 שווה ל־0. למה?", "החלק שמתחת לציר מבטל את החלק השווה לו שמעליו", ["הפונקציה x³ שווה לאפס בכל נקודה בתחום מ־−1 עד 1", "הקבוע C מבטל את הכול", "אי אפשר לבצע אינטגרציה לחזקות אי־זוגיות של x"], "הפונקציה x⁴/4 היא קדומה, ו־1/4 − 1/4 = 0. הגרף מתחת לציר מ־−1 עד 0 ומעליו מ־0 עד 1, עם שטחים שווים של 1/4, ולכן התרומות שלהם לאינטגרל מתבטלות. השטח הכולל הוא 1/2."]],
      [["f(t) is the speed of a car in m/s at time t. What does the integral of f from t = 0 to t = 10 give?", "The distance travelled in the first 10 seconds", ["The change in the car's speed during the first 10 seconds", "The car's acceleration at the moment t = 10", "The speed of the car at t = 10"], "Distance is speed × time. Adding speed × dt over thin time strips from 0 to 10 adds up the distance travelled. The change in speed would be the integral of the acceleration."],
        ["הפונקציה f(t) היא המהירות של מכונית במטרים לשנייה בזמן t. מה נותן האינטגרל של f מ־t = 0 עד t = 10?", "את הדרך שהמכונית עברה ב־10 השניות הראשונות", ["את השינוי במהירות של המכונית ב־10 השניות הראשונות", "את התאוצה של המכונית ברגע t = 10", "את המהירות של המכונית ב־t = 10"], "דרך היא מהירות × זמן. כשמחברים מהירות × dt על פני רצועות זמן צרות מ־0 עד 10, מקבלים את הדרך שנעברה. השינוי במהירות הוא האינטגרל של התאוצה."]],
      [["What is the area between y = x² and y = 2x?", "4/3", ["8/3", "4", "−4/3"], "x² = 2x at x = 0 and x = 2, and between them 2x is on top (at x = 1: 2 against 1). The area is the integral of 2x − x² from 0 to 2: 4 − 8/3 = 4/3. 8/3 is only the area under the parabola."],
        ["מהו השטח שבין y = x² ל־y = 2x?", "4/3", ["8/3", "4", "−4/3"], "x² = 2x ב־x = 0 וב־x = 2, וביניהם 2x נמצא למעלה (למשל ב־x = 1 מקבלים 2 לעומת 1). השטח הוא האינטגרל של 2x − x² מ־0 עד 2, כלומר 4 − 8/3 = 4/3. התשובה 8/3 היא רק השטח שמתחת לפרבולה."]],
      [["g(x) is the integral of t² from 0 to x. What is g′(x)?", "x²", ["x³/3", "2x", "t²"], "g(x) = x³/3, and its derivative is x². Differentiating an area function brings back the function under the integral sign: that is the link between integrals and derivatives."],
        ["הפונקציה g(x) מוגדרת כאינטגרל של t² מ־0 עד x. מהי g′(x)?", "x²", ["x³/3", "2x", "t²"], "מתקבל g(x) = x³/3, והנגזרת שלה היא x². גזירה של פונקציית שטח מחזירה את הפונקציה שתחת סימן האינטגרל: זה הקשר בין אינטגרלים לנגזרות."]],
    ],
    n: [
      [25, ["A tank fills at a rate of r(t) = 2t litres per minute. How many litres flow in during the first 5 minutes?", "litres", "The amount is the integral of the rate: from 0 to 5 the integral of 2t is 5² − 0² = 25 litres."],
        ["מכל מתמלא בקצב r(t) = 2t ליטרים לדקה. כמה ליטרים זורמים אליו ב־5 הדקות הראשונות?", "ליטרים", "הכמות היא האינטגרל של הקצב: מ־0 עד 5 האינטגרל של 2t הוא 5² − 0² = 25 ליטרים."]],
      [3, ["The area under y = x² from x = 0 to x = a is 9. What is a?", "", "The integral of x² from 0 to a is a³/3 = 9, so a³ = 27 and a = 3."],
        ["השטח שמתחת ל־y = x² מ־x = 0 עד x = a הוא 9. מהו a?", "", "האינטגרל של x² מ־0 עד a הוא a³/3 = 9, ולכן a³ = 27 ו־a = 3."]],
    ],
    s: [[["Finding the area between two graphs, in order", "Set the two functions equal and solve, to find where the graphs meet", "Check which graph is on top between those points", "Find an antiderivative of (top − bottom)", "Subtract its values at the two meeting points"],
      ["מציאת השטח בין שני גרפים, לפי הסדר", "משווים בין שתי הפונקציות ופותרים, כדי למצוא איפה הגרפים נפגשים", "בודקים איזה גרף נמצא למעלה בין הנקודות האלה", "מוצאים פונקציה קדומה של (העליונה פחות התחתונה)", "מחסרים את הערכים שלה בשתי נקודות החיתוך"]]],
  },
};
export default c;
