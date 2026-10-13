import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Function machine", "a rule that takes an input number and gives an output, like “add 3”", "מכונת פעולה", "כלל שמקבל מספר בכניסה ונותן מספר ביציאה, כמו ״הוסף 3״"],
      ["Input", "the number that goes into a rule", "קלט", "המספר שנכנס לכלל"],
      ["Output", "the number that comes out of a rule", "פלט", "המספר שיוצא מהכלל"],
      ["Table of values", "a table that lists inputs and their outputs", "טבלת ערכים", "טבלה שמפרטת קלטים ואת הפלטים שלהם"],
    ],
    q: [
      [["A machine doubles the input. The input is 7. What is the output?", "14", ["9", "7", "49"], "Double 7 is 2 × 7 = 14."],
        ["מכונה מכפילה את הקלט ב־2. הקלט הוא 7. מה הפלט?", "14", ["9", "7", "49"], "פי שניים מ־7 הוא 2 × 7 = 14."]],
      [["Inputs 1, 2, 3 give outputs 4, 5, 6. What is the rule?", "Add 3", ["Multiply by 4", "Add 4", "Double"], "Each output is 3 more than its input."],
        ["הקלטים 1, 2, 3 נותנים את הפלטים 4, 5, 6. מה הכלל?", "הוסף 3", ["כפול 4", "הוסף 4", "כפול 2"], "כל פלט גדול ב־3 מהקלט שלו."]],
    ],
  },
  i: {
    t: [
      ["Linear function", "a function whose graph is a straight line, like y = 2x + 1", "פונקציה קווית", "פונקציה שהגרף שלה הוא קו ישר, כמו y = 2x + 1"],
      ["Gradient", "how much y changes when x increases by 1", "שיפוע", "בכמה y משתנה כש־x גדל ב־1"],
      ["Intercept", "where a graph crosses the y-axis", "נקודת חיתוך עם ציר y", "המקום שבו הגרף חותך את ציר y"],
      ["Graph", "a picture of a function drawn on axes", "גרף", "תמונה של פונקציה שמשורטטת על צירים"],
    ],
    q: [
      [["For y = 3x − 2, what is y when x = 4?", "10", ["12", "14", "5"], "3 × 4 − 2 = 12 − 2 = 10."],
        ["עבור y = 3x − 2, מהו y כאשר x = 4?", "10", ["12", "14", "5"], "3 × 4 − 2 = 12 − 2 = 10."]],
      [["Where does y = 2x + 5 cross the y-axis?", "At (0, 5)", ["At (5, 0)", "At (0, 2)", "At (2, 5)"], "On the y-axis x = 0, so y = 2 × 0 + 5 = 5."],
        ["איפה y = 2x + 5 חותך את ציר y?", "בנקודה (0, 5)", ["בנקודה (5, 0)", "בנקודה (0, 2)", "בנקודה (2, 5)"], "על ציר y מתקיים x = 0, ולכן y = 2 × 0 + 5 = 5."]],
    ],
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
    ],
  },
};
export default c;
