import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Program", "a set of instructions that tells a computer what to do", "תוכנית", "אוסף הוראות שאומר למחשב מה לעשות"],
      ["Instruction", "one step that the computer carries out", "הוראה", "צעד אחד שהמחשב מבצע"],
      ["Output", "what a program shows or produces, like text on the screen", "פלט", "מה שתוכנית מציגה או מפיקה, כמו טקסט על המסך"],
      ["Input", "information given to a program, like a key press or a typed name", "קלט", "מידע שניתן לתוכנית, כמו לחיצה על מקש או שם מוקלד"],
    ],
    q: [
      [["A computer follows instructions…", "exactly as written, in order", ["the way it guesses you meant", "in random order", "only if they are polite"], "Computers do precisely what the program says — so a small mistake changes the result."],
        ["מחשב מבצע הוראות…", "בדיוק כפי שנכתבו, לפי הסדר", ["כפי שהוא מנחש שהתכוונתם", "בסדר אקראי", "רק אם הן מנומסות"], "מחשבים עושים בדיוק את מה שהתוכנית אומרת — ולכן טעות קטנה משנה את התוצאה."]],
      [["Typing your name into a game is an example of…", "input", ["output", "a bug", "a loop"], "Information you give the program is input; what it shows back is output."],
        ["הקלדת השם שלכם במשחק היא דוגמה ל…", "קלט", ["פלט", "באג", "לולאה"], "מידע שנותנים לתוכנית הוא קלט; מה שהיא מציגה בחזרה הוא פלט."]],
    ],
  },
  i: {
    t: [
      ["Variable", "a named box in memory that stores a value which can change", "משתנה", "תיבה בעלת שם בזיכרון ששומרת ערך שיכול להשתנות"],
      ["String", "a piece of text in a program, written in quotes", "מחרוזת", "קטע טקסט בתוכנית, שנכתב בתוך מירכאות"],
      ["Integer", "a whole number value, like 7 or −3", "מספר שלם (int)", "ערך מספרי שלם, כמו 7 או −3"],
      ["Boolean", "a value that is either true or false", "ערך בוליאני", "ערך שהוא אמת או שקר"],
    ],
    q: [
      [["After the code  x = 5  then  x = x + 2 , what is x?", "7", ["5", "2", "52"], "x starts as 5; then x + 2 = 7 is stored back in x."],
        ["אחרי הקוד  x = 5  ואז  x = x + 2 , מה הערך של x?", "7", ["5", "2", "52"], "x מתחיל ב־5; אחר כך הערך x + 2, כלומר 7, נשמר בחזרה ב־x."]],
      [["In many languages, \"3\" + \"4\" with quotes gives…", "\"34\"", ["7", "\"7\"", "an error always"], "With quotes they are strings, and + joins strings together."],
        ["בשפות רבות, \"3\" + \"4\" עם מירכאות נותן…", "\"34\"", ["7", "\"7\"", "תמיד שגיאה"], "עם מירכאות אלה מחרוזות, ו־+ מחבר מחרוזות זו לזו."]],
    ],
  },
  a: {
    t: [
      ["Function", "a named block of code that can be called many times, often with parameters", "פונקציה", "קטע קוד בעל שם שאפשר לקרוא לו פעמים רבות, לעיתים קרובות עם פרמטרים"],
      ["Parameter", "a value passed into a function so it can work on different data", "פרמטר", "ערך שמועבר לפונקציה כדי שתוכל לעבוד על נתונים שונים"],
      ["Return value", "the result a function sends back to the code that called it", "ערך מוחזר", "התוצאה שפונקציה שולחת בחזרה לקוד שקרא לה"],
      ["Array (list)", "an ordered collection of values stored under one name", "מערך (רשימה)", "אוסף מסודר של ערכים שנשמר תחת שם אחד"],
    ],
    q: [
      [["A function double(n) returns n × 2. What does double(double(3)) return?", "12", ["6", "9", "3"], "double(3) = 6, then double(6) = 12."],
        ["הפונקציה double(n) מחזירה n × 2. מה מחזיר double(double(3))?", "12", ["6", "9", "3"], "double(3) = 6, ואז double(6) = 12."]],
      [["In most languages, the first item of the list [10, 20, 30] is at index…", "0", ["1", "10", "−1"], "Most languages count list positions from 0, so list[0] is 10."],
        ["ברוב שפות התכנות, הפריט הראשון ברשימה [10, 20, 30] נמצא באינדקס…", "0", ["1", "10", "−1"], "רוב השפות סופרות מקומות ברשימה מ־0, ולכן list[0] הוא 10."]],
    ],
  },
};
export default c;
