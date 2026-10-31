import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Function machine", "a rule that takes an input number and gives an output, like “multiply by 10”", "מכונת פעולה", "כלל שמקבל מספר בכניסה ונותן מספר ביציאה, כמו ״כפול 10״"],
      ["Input", "the number that goes into a rule", "קלט", "המספר שנכנס לכלל"],
      ["Output", "the number that comes out of a rule", "פלט", "המספר שיוצא מהכלל"],
      ["Table of values", "a table that lists inputs and their outputs", "טבלת ערכים", "טבלה שמפרטת קלטים ואת הפלטים שלהם"],
    ],
    q: [
      [["A machine doubles the input. The input is 7. What is the output?", "14", ["9", "7", "49"], "Doubling means multiplying by 2: 2 × 7 = 14. Adding 2 would give 9, and 49 is 7 × 7, squaring instead of doubling."],
        ["מכונה מכפילה את הקלט ב־2. הקלט הוא 7. מה הפלט?", "14", ["9", "7", "49"], "פי שניים מ־7 הוא 2 × 7 = 14. הוספה של 2 הייתה נותנת 9, ו־49 הוא 7 × 7, כלומר העלאה בריבוע ולא הכפלה ב־2."]],
      [["Inputs 1, 2, 3 give outputs 4, 5, 6. What is the rule?", "Add 3", ["Multiply by 4", "Add 4", "Double"], "Each output is 3 more than its input: 1 + 3 = 4, 2 + 3 = 5 and 3 + 3 = 6. Multiplying by 4 fits the input 1 only."],
        ["הקלטים 1, 2, 3 נותנים את הפלטים 4, 5, 6. מה הכלל?", "הוסף 3", ["כפול 4", "הוסף 4", "כפול 2"], "כל פלט גדול ב־3 מהקלט שלו: 1 + 3 = 4, 2 + 3 = 5 ו־3 + 3 = 6. כפל ב־4 מתאים רק לקלט 1."]],
      [["A machine multiplies by 3 and then adds 1. The input is 4. What is the output?", "13", ["15", "12", "7"], "Follow the steps in order: 4 × 3 = 12, then 12 + 1 = 13. Adding first would give (4 + 1) × 3 = 15, and 12 forgets the last step."],
        ["מכונה כופלת ב־3 ואחר כך מוסיפה 1. הקלט הוא 4. מה הפלט?", "13", ["15", "12", "7"], "עוברים על השלבים לפי הסדר: 4 × 3 = 12, ואז 12 + 1 = 13. מי שמוסיף קודם מקבל (4 + 1) × 3 = 15, והתשובה 12 שוכחת את השלב האחרון."]],
    ],
    n: [[13, ["A machine takes away 4. The output is 9. What was the input?", "", "Work backwards and put the 4 back: 9 + 4 = 13. Check: 13 − 4 = 9."],
      ["מכונה מחסרת 4 מהקלט. הפלט הוא 9. מה היה הקלט?", "", "עובדים לאחור ומחזירים את ה־4: 9 + 4 = 13. בדיקה: 13 − 4 = 9."]]],
  },
  i: {
    t: [
      ["Linear function", "a function whose graph is a straight line, like y = 4x − 1", "פונקציה קווית", "פונקציה שהגרף שלה הוא קו ישר, כמו y = 4x − 1"],
      ["Gradient", "how much y changes when x increases by 1", "שיפוע", "בכמה y משתנה כש־x גדל ב־1"],
      ["Intercept", "where a graph crosses the y-axis", "נקודת חיתוך עם ציר y", "המקום שבו הגרף חותך את ציר y"],
      ["Graph", "a picture of a function drawn on axes", "גרף", "תמונה של פונקציה שמשורטטת על צירים"],
    ],
    q: [
      [["For y = 3x − 2, what is y when x = 4?", "10", ["12", "14", "5"], "Put x = 4 into the rule: 3 × 4 − 2 = 12 − 2 = 10. The answer 12 forgets to subtract the 2."],
        ["עבור y = 3x − 2, מהו y כאשר x = 4?", "10", ["12", "14", "5"], "מציבים x = 4 בכלל: 3 × 4 − 2 = 12 − 2 = 10. התשובה 12 שוכחת לחסר את ה־2."]],
      [["Where does y = 2x + 5 cross the y-axis?", "At (0, 5)", ["At (5, 0)", "At (0, 2)", "At (2, 5)"], "On the y-axis x = 0, so y = 2 × 0 + 5 = 5."],
        ["איפה y = 2x + 5 חותך את ציר y?", "בנקודה (0, 5)", ["בנקודה (5, 0)", "בנקודה (0, 2)", "בנקודה (2, 5)"], "על ציר y מתקיים x = 0, ולכן y = 2 × 0 + 5 = 5."]],
      [["What is the gradient of y = 5x − 3?", "5", ["−3", "3", "−5"], "The number that multiplies x is the gradient: y grows by 5 each time x grows by 1. −3 is where the line crosses the y-axis."],
        ["מהו השיפוע של y = 5x − 3?", "5", ["−3", "3", "−5"], "המספר שכופל את x הוא השיפוע: y גדל ב־5 בכל פעם ש־x גדל ב־1. המספר −3 הוא נקודת החיתוך עם ציר y."]],
    ],
    n: [[11, ["A line has gradient 2 and crosses the y-axis at (0, 1). What is y when x = 5?", "", "The line is y = 2x + 1, so y = 2 × 5 + 1 = 10 + 1 = 11."],
      ["לישר שיפוע 2 והוא חותך את ציר y בנקודה (0, 1). מהו y כאשר x = 5?", "", "הישר הוא y = 2x + 1, ולכן y = 2 × 5 + 1 = 10 + 1 = 11."]]],
  },
  a: {
    t: [
      ["Quadratic function", "a function like y = x² whose graph is a U-shaped curve called a parabola", "פונקציה ריבועית", "פונקציה כמו y = x² שהגרף שלה הוא עקומה בצורת U שנקראת פרבולה"],
      ["Root (zero)", "an x-value where the function equals 0, where the graph meets the x-axis", "שורש (אפס) של פונקציה", "ערך x שבו הפונקציה שווה ל־0, היכן שהגרף פוגש את ציר x"],
      ["Vertex", "the turning point of a parabola, its lowest or highest point", "קודקוד הפרבולה", "נקודת המפנה של פרבולה, הנקודה הנמוכה או הגבוהה ביותר שלה"],
      ["Domain", "all the input values a function is allowed to take", "תחום הגדרה", "כל ערכי הקלט שהפונקציה יכולה לקבל"],
    ],
    q: [
      [["What are the zeros of y = (x − 2)(x + 5)?", "x = 2 and x = −5", ["x = −2 and x = 5", "x = 2 only", "x = 10"], "A product is 0 when a factor is 0: x − 2 = 0 or x + 5 = 0."],
        ["מהם האפסים של y = (x − 2)(x + 5)?", "x = 2 ו־x = −5", ["x = −2 ו־x = 5", "רק x = 2", "x = 10"], "מכפלה שווה ל־0 כשאחד הגורמים שווה ל־0: x − 2 = 0 או x + 5 = 0."]],
      [["What is the lowest point (vertex) of y = x² + 4?", "(0, 4)", ["(4, 0)", "(0, 0)", "(2, 4)"], "x² is never negative and is smallest (0) at x = 0, so the minimum is y = 4."],
        ["מהי הנקודה הנמוכה ביותר (הקודקוד) של y = x² + 4?", "(0, 4)", ["(4, 0)", "(0, 0)", "(2, 4)"], "x² אף פעם לא שלילי והוא הקטן ביותר (0) ב־x = 0, ולכן המינימום הוא y = 4."]],
      [["Which point is on the graph of y = x²?", "(−3, 9)", ["(−3, −9)", "(3, 6)", "(9, 3)"], "Square the x-value: (−3)² = 9, so (−3, 9) is on the parabola. A square is never negative, so (−3, −9) cannot be on it, and 3 × 2 = 6 is doubling, not squaring."],
        ["איזו נקודה נמצאת על הגרף של y = x²?", "(−3, 9)", ["(−3, −9)", "(3, 6)", "(9, 3)"], "מעלים את ערך x בריבוע: (−3)² = 9, ולכן (−3, 9) נמצאת על הפרבולה. ריבוע אף פעם אינו שלילי, ולכן (−3, −9) לא יכולה להיות עליה, ו־3 × 2 = 6 הוא הכפלה ב־2 ולא העלאה בריבוע."]],
    ],
    n: [[10, ["For f(x) = x² − 3x, what is f(5)?", "", "Substitute x = 5 into the function: 5² − 3 × 5 = 25 − 15 = 10."],
      ["עבור f(x) = x² − 3x, כמה זה f(5)?", "", "מציבים x = 5 בפונקציה: 5² − 3 × 5 = 25 − 15 = 10."]]],
  },
};
export default c;
