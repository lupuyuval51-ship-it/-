import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Program", "a set of instructions that tells a computer what to do", "תוכנית", "אוסף הוראות שאומר למחשב מה לעשות"],
      ["Instruction", "one step that the computer carries out", "הוראה", "צעד אחד שהמחשב מבצע"],
      ["Output", "what a program shows or produces, like a sound or a printed page", "פלט", "מה שתוכנית מציגה או מפיקה, כמו צליל או דף מודפס"],
      ["Input", "information given to a program, like a spoken command or a photo from the camera", "קלט", "מידע שניתן לתוכנית, כמו פקודה קולית או תמונה מהמצלמה"],
    ],
    q: [
      [["A computer follows instructions…", "exactly as written, in order", ["the way it guesses you meant", "in random order", "only if they are polite"], "Computers do precisely what the program says — so a small mistake changes the result."],
        ["מחשב מבצע הוראות…", "בדיוק כפי שנכתבו, לפי הסדר", ["כפי שהוא מנחש שהתכוונתם", "בסדר אקראי", "רק אם הן מנומסות"], "מחשבים עושים בדיוק את מה שהתוכנית אומרת — ולכן טעות קטנה משנה את התוצאה."]],
      [["Typing your name into a game is an example of…", "input", ["output", "a bug", "a loop"], "Information you give the program is input; what it shows back is output."],
        ["הקלדת השם שלכם במשחק היא דוגמה ל…", "קלט", ["פלט", "באג", "לולאה"], "מידע שנותנים לתוכנית הוא קלט; מה שהיא מציגה בחזרה הוא פלט."]],
      [["Which of these is output from a program?", "A message shown on the screen", ["Pressing a key on the keyboard", "Typing your name with the keyboard", "Clicking a button with the mouse"], "Output is what a program gives back, such as text on the screen or a sound. Pressing keys, typing and clicking are all input: information you give the program."],
        ["מה מהבאים הוא פלט של תוכנית?", "הודעה שמוצגת על המסך", ["לחיצה על מקש במקלדת", "הקלדת השם שלכם במקלדת", "לחיצה על כפתור בעכבר"], "פלט הוא מה שתוכנית מחזירה, כמו טקסט על המסך או צליל. לחיצה על מקשים, הקלדה ולחיצה בעכבר הן כולן קלט: מידע שאתם נותנים לתוכנית."]],
    ],
    n: [
      [4, ["A program moves a character 2 steps forward, then 3 steps forward, then 1 step back. How many steps from the start does it end?", "steps", "The computer carries out the instructions in order: 2 + 3 = 5 steps forward, then 1 back, so it ends 5 − 1 = 4 steps from the start."],
        ["תוכנית מזיזה דמות 2 צעדים קדימה, אחר כך 3 צעדים קדימה, ואז צעד אחד אחורה. כמה צעדים מנקודת ההתחלה היא מסיימת?", "צעדים", "המחשב מבצע את ההוראות לפי הסדר: 2 + 3 = 5 צעדים קדימה, ואז צעד אחד אחורה, ולכן הדמות מסיימת 5 − 1 = 4 צעדים מנקודת ההתחלה."]],
    ],
    s: [
      [["A program that greets you, in order", "It asks for your name", "It waits while you type it", "It keeps the name in memory", "It shows “Hello” and your name"],
        ["תוכנית שמברכת אתכם לשלום, לפי הסדר", "היא שואלת מה השם שלכם", "היא מחכה שתקלידו אותו", "היא שומרת את השם בזיכרון", "היא מציגה ״שלום״ ואת השם שלכם"]],
    ],
  },
  i: {
    t: [
      ["Variable", "a named box in memory that stores a value which can change", "משתנה", "תיבה בעלת שם בזיכרון ששומרת ערך שיכול להשתנות"],
      ["String", "a piece of text stored in a program, like a name or a message", "מחרוזת", "קטע טקסט שנשמר בתוכנית, כמו שם או הודעה"],
      ["Integer", "a whole number value, like 7 or −3", "מספר שלם (int)", "ערך מספרי שלם, כמו 7 או −3"],
      ["Boolean", "a yes-or-no value with only two possible states, used in conditions", "ערך בוליאני", "ערך של כן או לא, עם שני מצבים אפשריים בלבד, שמשמש בתנאים"],
    ],
    q: [
      [["After the code  x = 5  then  x = x + 2 , what is x?", "7", ["5", "2", "52"], "x starts as 5; then x + 2 = 7 is stored back in x."],
        ["אחרי הקוד  x = 5  ואז  x = x + 2 , מה הערך של x?", "7", ["5", "2", "52"], "x מתחיל ב־5; אחר כך הערך x + 2, כלומר 7, נשמר בחזרה ב־x."]],
      [["In many languages, \"3\" + \"4\" with quotes gives…", "\"34\"", ["7", "\"7\"", "an error always"], "With quotes they are strings, and + joins strings together."],
        ["בשפות רבות, \"3\" + \"4\" עם מירכאות נותן…", "\"34\"", ["7", "\"7\"", "תמיד שגיאה"], "עם מירכאות אלה מחרוזות, ו־+ מחבר מחרוזות זו לזו."]],
      [["Which of these values is a Boolean?", "true", ["\"true\"", "\"yes\"", "10"], "A Boolean has only two possible values, true and false. In quotation marks, \"true\" is a string of four letters, not a Boolean, and 10 is an integer."],
        ["איזה מהערכים האלה הוא ערך בוליאני?", "true", ["\"true\"", "\"yes\"", "10"], "לערך בוליאני יש רק שני ערכים אפשריים: true ו־false. בתוך מירכאות, \"true\" הוא מחרוזת של ארבע אותיות ולא ערך בוליאני, ו־10 הוא מספר שלם."]],
      [["What type of value is \"7\", written with quotation marks?", "A string", ["An integer", "A Boolean", "A list"], "Anything inside quotation marks is text, so \"7\" is a string of one character. Without the quotation marks, 7 would be an integer you can calculate with."],
        ["מאיזה סוג הוא הערך \"7\", שכתוב בתוך מירכאות?", "מחרוזת", ["מספר שלם", "ערך בוליאני", "רשימה"], "כל מה שבתוך מירכאות הוא טקסט, ולכן \"7\" הוא מחרוזת של תו אחד. בלי המירכאות, 7 היה מספר שלם שאפשר לחשב איתו."]],
    ],
    n: [
      [14, ["After the code  x = 10  then  x = x - 3  then  x = x * 2  (in code, * means times), what is x?", "", "x starts as 10. Then 10 - 3 = 7 is stored in x, and then 7 × 2 = 14 is stored in x, so x is 14."],
        ["אחרי הקוד  x = 10  ואז  x = x - 3  ואז  x = x * 2  (בקוד, * פירושו כפול), מה הערך של x?", "", "x מתחיל ב־10. אחר כך 10 - 3 = 7 נשמר ב־x, ואז 7 × 2 = 14 נשמר ב־x, ולכן הערך של x הוא 14."]],
    ],
    s: [
      [["Swapping the values of a and b with a spare variable t, in order", "Copy a into the spare variable: t = a", "Copy b into a: a = b", "Copy the saved value into b: b = t"],
        ["החלפת הערכים של a ו־b בעזרת משתנה עזר t, לפי הסדר", "מעתיקים את a למשתנה העזר: t = a", "מעתיקים את b אל a: a = b", "מעתיקים את הערך השמור אל b: b = t"]],
    ],
  },
  a: {
    t: [
      ["Function", "a named block of code that can be called many times, often with parameters", "פונקציה", "קטע קוד בעל שם שאפשר לקרוא לו פעמים רבות, לעיתים קרובות עם פרמטרים"],
      ["Parameter", "a named input of a function, which can get a different value each time the function is called", "פרמטר", "קלט בעל שם של פונקציה, שיכול לקבל ערך אחר בכל פעם שקוראים לפונקציה"],
      ["Return value", "the result a function sends back to the code that called it", "ערך מוחזר", "התוצאה שפונקציה שולחת בחזרה לקוד שקרא לה"],
      ["Array (list)", "an ordered collection of values stored under one name", "מערך (רשימה)", "אוסף מסודר של ערכים שנשמר תחת שם אחד"],
    ],
    q: [
      [["A function double(n) returns n × 2. What does double(double(3)) return?", "12", ["6", "9", "3"], "The inner call runs first: double(3) = 6. That 6 is passed to the outer call, and double(6) = 12."],
        ["הפונקציה double(n) מחזירה n × 2. מה מחזיר double(double(3))?", "12", ["6", "9", "3"], "הקריאה הפנימית רצה ראשונה: double(3) = 6. את ה־6 הזה מעבירים לקריאה החיצונית, ו־double(6) = 12."]],
      [["In most languages, the first item of the list [10, 20, 30] is at index…", "0", ["1", "10", "−1"], "Most languages count list positions from 0, so list[0] is 10."],
        ["ברוב שפות התכנות, הפריט הראשון ברשימה [10, 20, 30] נמצא באינדקס…", "0", ["1", "10", "−1"], "רוב השפות סופרות מקומות ברשימה מ־0, ולכן list[0] הוא 10."]],
      [["In most languages, what is list[2] for the list [10, 20, 30]?", "30", ["20", "2", "An error: the list has no item 2"], "Counting from 0, list[0] is 10, list[1] is 20 and list[2] is 30. Choosing 20 means counting from 1, a very common slip."],
        ["ברוב שפות התכנות, מה הוא list[2] ברשימה [10, 20, 30]?", "30", ["20", "2", "שגיאה: אין ברשימה פריט 2"], "כשסופרים מ־0, list[0] הוא 10, list[1] הוא 20 ו־list[2] הוא 30. מי שבחר 20 ספר מ־1, וזו טעות נפוצה מאוד."]],
      [["A function add(a, b) returns a + b. In the call add(4, 6), what are 4 and 6?", "Values passed to its parameters a and b", ["The values that the function returns", "Two new names for the function", "The positions of two items in a list"], "When the function is called, a gets 4 and b gets 6, so add(4, 6) returns 10. The return value is what comes back out, not what goes in."],
        ["הפונקציה add(a, b) מחזירה a + b. בקריאה add(4, 6), מה הם 4 ו־6?", "ערכים שמועברים לפרמטרים a ו־b", ["הערכים שהפונקציה מחזירה בסוף", "שני שמות חדשים לפונקציה", "המקומות של שני פריטים ברשימה"], "כשקוראים לפונקציה, a מקבל 4 ו־b מקבל 6, ולכן add(4, 6) מחזירה 10. הערך המוחזר הוא מה שיוצא מהפונקציה, לא מה שנכנס אליה."]],
    ],
    n: [
      [4, ["In most languages, what is the index of the last item of a list that has 5 items?", "", "Most languages count list positions from 0, so the positions are 0, 1, 2, 3 and 4, and the last of the 5 items is at index 5 − 1 = 4."],
        ["ברוב שפות התכנות, מה האינדקס של הפריט האחרון ברשימה שיש בה 5 פריטים?", "", "רוב השפות סופרות מקומות ברשימה מ־0, ולכן המקומות הם 0, 1, 2, 3 ו־4, והפריט האחרון מתוך 5 הפריטים נמצא באינדקס 5 − 1 = 4."]],
    ],
  },
};
export default c;
