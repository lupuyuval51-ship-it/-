import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["let", "the keyword that creates a variable whose value can be changed afterwards", "let", "המילה השמורה שיוצרת משתנה שאפשר לשנות את הערך שלו בהמשך"],
      ["const", "the keyword that creates a variable that can never be given a new value", "const", "המילה השמורה שיוצרת משתנה שאי אפשר לתת לו ערך חדש"],
      ["String", "a value made of text, such as a name or a whole sentence", "מחרוזת", "ערך שמורכב מטקסט, כמו שם או משפט שלם"],
    ],
    q: [
      [["In JavaScript, what does  console.log(2 + 3)  show in the console?", "5", ["23", "2 + 3", "an error"], "Without quotes, 2 + 3 is a sum of two numbers, so JavaScript works it out first and console.log shows 5."],
        ["ב־JavaScript, מה מציג  console.log(2 + 3)  במסוף?", "5", ["23", "2 + 3", "שגיאה"], "בלי מירכאות 2 + 3 הוא חיבור של שני מספרים, ולכן JavaScript מחשבת אותו קודם, ו־console.log מציג 5."]],
      [['After  const name = "Maya"; , what does  console.log(name)  show?', "Maya", ["name", "const name", "an error"], 'Without quotes, name is the variable, so console.log shows the value stored in it: the text Maya. To show the word name itself, it would need quotes, as in console.log("name").'],
        ['אחרי  const name = "Maya"  מה מציג  console.log(name) ?', "Maya", ["name", "const name", "שגיאה"], 'בלי מירכאות name הוא המשתנה, ולכן console.log מציג את הערך ששמור בו: הטקסט Maya. כדי להציג את המילה name עצמה צריך מירכאות, כמו ב־console.log("name").']],
      [["In JavaScript, which of these values is a string?", '"42"', ["42", "true", "null"], 'Quotes make a string, so "42" is text made of the characters 4 and 2. Without quotes, 42 is a number, true is a boolean and null means “no value”.'],
        ["ב־JavaScript, איזה מהערכים האלה הוא מחרוזת?", '"42"', ["42", "true", "null"], 'מירכאות יוצרות מחרוזת, ולכן "42" הוא טקסט שמורכב מהתווים 4 ו־2. בלי מירכאות 42 הוא מספר, true הוא ערך בוליאני ו־null פירושו ״אין ערך״.']],
      [["In JavaScript, what happens to a line that starts with  // ?", "JavaScript skips it, because it is a comment", ["It prints the rest of the line in the console", "It divides the two numbers written after it", "It stops the whole program at that line"], "// starts a comment: a note for people reading the code. JavaScript ignores everything after it on that line."],
        ["ב־JavaScript, מה קורה לשורה שמתחילה בסימן // ?", "JavaScript מדלגת עליה, כי זו הערה", ["היא מדפיסה במסוף את כל שאר השורה", "היא מחלקת את שני המספרים שכתובים אחריה", "היא עוצרת את כל התוכנית בשורה הזאת"], "הסימן // פותח הערה: פתק לאנשים שקוראים את הקוד. JavaScript מתעלמת מכל מה שכתוב אחריו באותה שורה."]],
      [["Which company created JavaScript in 1995?", "Netscape", ["Microsoft", "Apple", "Google"], "Brendan Eich wrote the first version of JavaScript at Netscape in 1995, for the company's web browser. Google was only founded in 1998."],
        ["איזו חברה יצרה את JavaScript ב־1995?", "Netscape", ["Microsoft", "Apple", "Google"], "ברנדן אייק כתב את הגרסה הראשונה של JavaScript בחברת Netscape ב־1995, עבור הדפדפן של החברה. חברת Google נוסדה רק ב־1998."]],
    ],
    n: [
      [15, ["After  let score = 10;  the line  score = score + 5;  runs. What is score now?", "", "score + 5 takes the old value 10 and adds 5, then = stores the result back in score: 10 + 5 = 15."],
        ["אחרי  let score = 10  רצה השורה  score = score + 5 . מה הערך של score עכשיו?", "", "החישוב score + 5 לוקח את הערך הישן 10 ומוסיף לו 5, ואז = שומר את התוצאה בחזרה ב־score, כלומר 10 + 5 = 15."]],
    ],
    s: [
      [["Put the lines in order so that the program shows 6", "Make the variable: let x = 2;", "Change it: x = x * 3;", "Show it: console.log(x);"],
        ["סדרו את השורות כך שהתוכנית תציג 6", "יוצרים משתנה: let x = 2", "משנים אותו: x = x * 3", "מציגים אותו: console.log(x)"]],
    ],
  },
  i: {
    t: [
      ["Array", "an ordered list of values written between square brackets, such as [3, 5, 8]", "מערך", "רשימה מסודרת של ערכים שכתובים בין סוגריים מרובעים, כמו [3,5,8]"],
      ["Index", "the position number of an item in a list; in JavaScript the first item has number 0", "אינדקס", "מספר המקום של פריט ברשימה; ב־JavaScript לפריט הראשון יש מספר 0"],
      ["Function", "a named block of code that runs when it is called, can take inputs and can give back a result", "פונקציה", "קטע קוד עם שם שרץ כשקוראים לו, יכול לקבל קלטים ויכול להחזיר תוצאה"],
    ],
    q: [
      [['In JavaScript, what does  console.log("2" + 3)  show?', "23", ["5", "NaN", "an error"], 'When one side of + is a string, JavaScript turns the other side into text and joins them, so "2" + 3 gives "23".'],
        ['ב־JavaScript, מה מציג  console.log("2" + 3) ?', "23", ["5", "NaN", "שגיאה"], 'כשאחד הצדדים של + הוא מחרוזת, JavaScript הופכת גם את הצד השני לטקסט ומחברת ביניהם, ולכן "2" + 3 נותן "23".']],
      [['After  let colors = ["red", "green", "blue"]; , what is  colors[1] ?', "green", ["red", "blue", "undefined"], "Counting starts at 0: colors[0] is red, colors[1] is green and colors[2] is blue."],
        ['אחרי  let colors = ["red","green","blue"] , מה הערך של  colors[1] ?', "green", ["red", "blue", "undefined"], "הספירה מתחילה מ־0: הערך של colors[0] הוא red, של colors[1] הוא green ושל colors[2] הוא blue."]],
      [["How many times does the body of  for (let i = 0; i < 5; i++)  run?", "5", ["4", "6", "0"], "i takes the values 0, 1, 2, 3 and 4. When i reaches 5 the test i < 5 is false and the loop stops, after 5 runs."],
        ["כמה פעמים רץ גוף הלולאה של  for  שמתחילה עם i = 0, ממשיכה כל עוד i קטן מ־5 ומוסיפה 1 ל־i בכל סיבוב?", "5", ["4", "6", "0"], "המשתנה i מקבל את הערכים 0, 1, 2, 3 ו־4. כש־i מגיע ל־5 התנאי כבר לא מתקיים והלולאה נעצרת, אחרי 5 סיבובים."]],
      [['After  let lives = 0; , the code  if (lives === 0) { console.log("Game over"); } else { console.log("Keep going"); }  runs. What is shown?', "Game over", ["Keep going", "Game over, then Keep going", "Nothing at all"], "lives === 0 is true, so only the block of the if runs. The else block runs only when the condition is false."],
        ['אחרי  let lives = 0  רץ הקוד  if (lives === 0) {console.log("Game over")} else {console.log("Keep going")} . מה מוצג?', "Game over", ["Keep going", "Game over ואחריו Keep going", "שום דבר"], "הביטוי lives === 0 הוא true, ולכן רץ רק הבלוק של ה־if. הבלוק של ה־else רץ רק כשהתנאי הוא false."]],
      [["Which keyword sends a value back out of a function to the code that called it?", "return", ["console.log", "break", "let"], "return ends the function and hands its value to the caller. console.log only shows a value in the console; it does not give it back."],
        ["איזו מילה שמורה מחזירה ערך מתוך פונקציה אל הקוד שקרא לה?", "return", ["console.log", "break", "let"], "return מסיימת את הפונקציה ומוסרת את הערך למי שקרא לה. console.log רק מציג ערך במסוף ולא מחזיר אותו."]],
    ],
    n: [
      [14, ["function double(n)  gives back  n * 2 . What does  double(7)  give?", "", "The function returns n * 2. With n = 7 it returns 7 * 2 = 14."],
        ["הפונקציה double מחזירה  n * 2 . מה מחזירה הקריאה  double(7) ?", "", "הפונקציה מחזירה את n * 2. כש־n = 7 היא מחזירה 7 * 2 = 14."]],
      [4, ["What is  nums.length  after  let nums = [5, 10, 15, 20]; ?", "", "length counts the items in the array, not their values: 5, 10, 15 and 20 are 4 items."],
        ["מה הערך של  nums.length  אחרי  let nums = [5,10,15,20] ?", "", "length סופר את הפריטים במערך ולא את הערכים שלהם: 5, 10, 15 ו־20 הם 4 פריטים."]],
    ],
    s: [
      [["How a loop  for (let i = 0; i < 3; i++)  runs", "Set i to 0, once, at the start", "Check the condition; if it is false, leave the loop", "Run the body of the loop", "Add 1 to i with i++ and go back to the check"],
        ["איך רצה לולאת for שסופרת עם i מ־0 עד 2", "קובעים ש־i = 0, פעם אחת, בהתחלה", "בודקים את התנאי; אם הוא לא מתקיים, יוצאים מהלולאה", "מריצים את גוף הלולאה", "מוסיפים 1 ל־i בעזרת i++ וחוזרים לבדיקה"]],
    ],
  },
  a: {
    t: [
      ["Strict equality (===)", "comparing both the value and the type, without converting either side first", "שוויון מחמיר (===)", "השוואה של הערך וגם של הסוג, בלי להמיר קודם אף אחד מהצדדים"],
      ["Type coercion", "JavaScript's automatic change of a value from one type to another, as in null + 1, where null is turned into the number 0", "המרת טיפוסים אוטומטית", "שינוי של ערך מסוג אחד לסוג אחר ש־JavaScript עושה מעצמה, כמו ב־null + 1, שבו null הופך למספר 0"],
      ["Floating-point number", "a number stored in binary with a fixed number of digits, so decimals such as 0.1 are only close, not exact", "מספר נקודה צפה", "מספר שנשמר בבסיס 2 עם כמות קבועה של ספרות, ולכן שברים עשרוניים כמו 0.1 נשמרים רק בקירוב"],
    ],
    q: [
      [['In JavaScript, what is the value of  5 == "5" ?', "true", ["false", "an error", "undefined"], '== converts the types before comparing: the string "5" becomes the number 5, and 5 equals 5, so the result is true.'],
        ['ב־JavaScript, מה הערך של  5 == "5" ?', "true", ["false", "שגיאה", "undefined"], 'האופרטור == ממיר את הסוגים לפני ההשוואה: המחרוזת "5" הופכת למספר 5, ו־5 שווה ל־5, ולכן התוצאה true.']],
      [['In JavaScript, what is the value of  5 === "5" ?', "false", ["true", "an error", "NaN"], '=== also compares the types and converts nothing. 5 is a number and "5" is a string, so they are not strictly equal.'],
        ['ב־JavaScript, מה הערך של  5 === "5" ?', "false", ["true", "שגיאה", "NaN"], 'האופרטור === משווה גם את הסוגים ולא ממיר שום דבר. 5 הוא מספר ו־"5" הוא מחרוזת, ולכן בהשוואה מחמירה הם לא שווים.']],
      [["After  const total = 10; , the line  total = 20;  runs. What happens?", "A TypeError: a const cannot be given a new value", ["total quietly becomes 20, and the program shows no message", "total stays 10, and the program carries on with no error", "total becomes 30, because the two values are added up"], "A const variable gets its value only once. Assigning to it again throws a TypeError, “Assignment to constant variable”."],
        ["אחרי  const total = 10  רצה השורה  total = 20 . מה קורה?", "שגיאת TypeError: אי אפשר לתת ל־const ערך חדש", ["הערך של total הופך בשקט ל־20, ולא מוצגת שום הודעה", "הערך של total נשאר 10, והתוכנית ממשיכה בלי שגיאה", "הערך של total הופך ל־30, כי שני הערכים מתחברים"], "משתנה const מקבל ערך רק פעם אחת. ניסיון לתת לו ערך שוב זורק שגיאת TypeError עם ההודעה Assignment to constant variable."]],
      [["What does  console.log(0.1 + 0.2 === 0.3)  show?", "false", ["true", "0.3", "an error"], "0.1 and 0.2 are floating-point numbers stored only approximately in binary, so their sum is 0.30000000000000004, which is not exactly 0.3."],
        ["מה מציג  console.log(0.1 + 0.2 === 0.3) ?", "false", ["true", "0.3", "שגיאה"], "0.1 ו־0.2 הם מספרי נקודה צפה שנשמרים בבסיס 2 רק בקירוב, ולכן הסכום שלהם הוא 0.30000000000000004, ולא בדיוק 0.3."]],
      [['What does  console.log(typeof "hello")  show?', "string", ["text", "object", "char"], 'typeof gives the type of a value as a string. Any text in quotes has the type "string"; JavaScript has no separate "char" type.'],
        ['מה מציג  console.log(typeof "hello") ?', "string", ["text", "object", "char"], 'typeof מחזיר את הסוג של ערך בתור מחרוזת. לכל טקסט שבין מירכאות יש הסוג "string"; ב־JavaScript אין סוג נפרד בשם "char".']],
      [["What does  let x; console.log(x);  show?", "undefined", ["null", "0", "an error"], "x was declared with let but never given a value, so it holds undefined. null appears only when a program puts it there on purpose."],
        ["מה מציג הקוד  let x  ואחריו  console.log(x) ?", "undefined", ["null", "0", "שגיאה"], "המשתנה x הוכרז עם let אבל לא קיבל ערך, ולכן הערך שלו הוא undefined. הערך null מופיע רק כשתוכנית שמה אותו בכוונה."]],
      [['What does  console.log("5" - 2)  show?', "3", ["52", "NaN", "an error"], 'The - operator works only on numbers, so JavaScript turns the string "5" into the number 5 and subtracts: 5 - 2 is 3. With + it would have joined the texts into "52" instead.', "Which of the two operators, + or -, can join texts, and which one works only on numbers?"],
        ['מה מציג  console.log("5" - 2) ?', "3", ["52", "NaN", "שגיאה"], 'האופרטור - עובד רק על מספרים, ולכן JavaScript הופכת את המחרוזת "5" למספר 5 ומחסירה: 5 - 2 הוא 3. עם + היא הייתה מחברת את הטקסטים ל־"52".', "איזה משני האופרטורים, + או -, יכול לחבר טקסטים, ואיזה עובד רק על מספרים?"]],
    ],
    n: [
      [3, ["After  const list = [1, 2];  the line  list.push(3);  runs. What is  list.length ?", "", "const only stops list from pointing to a different array; the array itself can still change. push adds a third item, so the length is 3."],
        ["אחרי  const list = [1,2]  רצה השורה  list.push(3) . מה הערך של  list.length ?", "", "const רק מונע מ־list להצביע על מערך אחר, ואת המערך עצמו עדיין אפשר לשנות. push מוסיף פריט שלישי, ולכן האורך הוא 3."]],
      [-1, ["What does  [10, 20, 30].indexOf(40)  give?", "", "indexOf gives the position of an item, or -1 when the item is not in the array at all. 40 is not there, so the answer is -1."],
        ["מה מחזיר  [10,20,30].indexOf(40) ?", "", "indexOf מחזיר את המיקום של פריט, או -1 כשהפריט בכלל לא נמצא במערך. 40 לא נמצא שם, ולכן התשובה היא -1."]],
    ],
  },
};
export default c;
