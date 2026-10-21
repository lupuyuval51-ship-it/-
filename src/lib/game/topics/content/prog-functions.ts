import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Function", "a named block of code that does one job and can be used again and again", "פונקציה", "קטע קוד בעל שם שעושה משימה אחת ואפשר להשתמש בו שוב ושוב"],
      ["Function call", "running a function by writing its name followed by brackets, like greet()", "קריאה לפונקציה", "הרצת פונקציה על ידי כתיבת השם שלה ואחריו סוגריים, כמו greet()"],
      ["Built-in function", "a function that comes ready with Python, such as print() or len()", "פונקציה מובנית", "פונקציה שמגיעה מוכנה עם Python, כמו print() או len()"],
      ["def", "the Python keyword that starts the definition of a new function", "def", "המילה השמורה ב־Python שפותחת הגדרה של פונקציה חדשה"],
    ],
    q: [
      [["Why do programmers write functions?", "To reuse a piece of code instead of copying it again and again", ["To make a program run faster, because every function is quicker than a loop", "Because Python cannot run a program that has no functions", "To keep the code secret, so that other programmers cannot read it"], "A function is written once and called whenever it is needed; a fix inside it fixes every use."],
        ["למה מתכנתים כותבים פונקציות?", "כדי להשתמש שוב בקטע קוד במקום להעתיק אותו שוב ושוב", ["כדי שהתוכנית תרוץ מהר יותר, כי כל פונקציה מהירה יותר מלולאה", "כי Python לא מריצה תוכנית בלי פונקציות", "כדי לשמור את הקוד בסוד, כך שמתכנתים אחרים לא יוכלו לקרוא אותו"], "פונקציה נכתבת פעם אחת ונקראת בכל פעם שצריך אותה; תיקון בתוכה מתקן את כל השימושים."]],
      [['In Python 3, a program defines  def hi(): print("hello")  but never calls hi(). What is printed?', "Nothing", ["hello", "hi", "an error"], "def only defines the function. Its code runs when it is called with hi()."],
        ['ב־Python 3, תוכנית מגדירה פונקציה בשם hi, שהגוף שלה הוא  print("hello") , אבל אף פעם לא קוראת ל־hi(). מה מודפס?', "כלום", ["hello", "hi", "שגיאה"], "def רק מגדיר את הפונקציה. הקוד שלה רץ כשקוראים לה עם hi()."]],
      [["Which line calls a function named jump in Python 3?", "jump()", ["def jump():", "jump", "call jump"], "Brackets after the name run the function. def jump(): defines it, and jump without brackets only names it."],
        ["איזו שורה קוראת ב־Python 3 לפונקציה בשם jump?", "jump()", ["def jump():", "jump", "call jump"], "סוגריים אחרי השם מריצים את הפונקציה. def jump(): מגדיר אותה, ו־jump בלי סוגריים רק מזכיר את השם שלה."]],
      [["Which line defines a function named hello in Python 3?", "def hello():", ["hello()", "function hello():", "define hello:"], "Python starts a function with the keyword def, then the name, brackets and a colon. hello() would call it, and function is the JavaScript word, not Python's."],
        ["איזו שורה מגדירה ב־Python 3 פונקציה בשם hello?", "def hello():", ["hello()", "function hello():", "define hello:"], "ב־Python פותחים פונקציה במילה השמורה def, ואחריה שם, סוגריים ונקודתיים. hello() הייתה קוראת לפונקציה, ו־function היא המילה של JavaScript ולא של Python."]],
    ],
    n: [
      [5, ['In Python 3, what is  len("hello") ?', "", 'len counts the characters of a string, and the string "hello" has 5 characters, so the answer is 5.'], ['ב־Python 3, מה הערך של  len("hello") ?', "", 'len סופר את התווים של מחרוזת, ובמחרוזת "hello" יש 5 תווים, ולכן התשובה היא 5.']],
    ],
  },
  i: {
    t: [
      ["Parameter", "a name in a function's definition that receives a value, like name in def greet(name):", "פרמטר", "שם בהגדרת הפונקציה שמקבל ערך, כמו name ב־def greet(name)"],
      ["Argument", 'the actual value passed in a call, like "Noa" in greet("Noa")', "ארגומנט", 'הערך עצמו שמועבר בקריאה, כמו "Noa" ב־greet("Noa")'],
      ["Return value", "the result a function sends back to the code that called it", "ערך מוחזר", "התוצאה שפונקציה שולחת בחזרה לקוד שקרא לה"],
      ["Default value", 'a value a parameter gets when the call leaves it out, as in def greet(name="friend"):', "ערך ברירת מחדל", 'ערך שפרמטר מקבל כשהקריאה לא מעבירה לו ערך, כמו ב־def greet(name="friend")'],
    ],
    q: [
      [["In Python 3,  def add(a, b): return a + b . What is add(2, 5)?", "7", ["25", "2", "an error"], "a gets 2 and b gets 5, and the function returns 2 + 5 = 7."],
        ["ב־Python 3, הפונקציה add מקבלת a ו־b ומחזירה  a + b . מה הערך של add(2, 5)?", "7", ["25", "2", "שגיאה"], "a מקבל 2 ו־b מקבל 5, והפונקציה מחזירה 2 + 5 = 7."]],
      [["What is the difference between print and return inside a Python function?", "return sends a value back to the caller; print only shows it on the screen", ["print sends a value back to the caller; return only shows it on the screen", "They do exactly the same thing", "return deletes the function"], "A returned value can be stored or used in a calculation; a printed value is only shown to the user."],
        ["מה ההבדל בין print ל־return בתוך פונקציה ב־Python?", "return שולח ערך בחזרה לקוד שקרא לפונקציה; print רק מציג אותו על המסך", ["print שולח ערך בחזרה לקוד שקרא לפונקציה; return רק מציג אותו על המסך", "שניהם עושים בדיוק אותו דבר", "return מוחק את הפונקציה"], "ערך מוחזר אפשר לשמור במשתנה או להשתמש בו בחישוב; ערך מודפס רק מוצג למשתמש."]],
      [['In Python 3,  def greet(name="friend"): return "Hi " + name . What does greet() return?', "Hi friend", ["Hi name", "an error, because no name was given", "Hi"], 'The call gives no argument, so name takes its default value "friend".'],
        ['ב־Python 3, הפונקציה greet מוגדרת עם הפרמטר  name="friend"  ומחזירה  "Hi " + name . מה מחזיר greet()?', "Hi friend", ["Hi name", "שגיאה, כי לא הועבר שם", "Hi"], 'הקריאה לא מעבירה ארגומנט, ולכן name מקבל את ערך ברירת המחדל "friend".']],
      [['In Python 3, the body of a function has  return 5  on its first line and  print("hi")  on its second. What happens when the function is called?', "It gives back 5 and never prints hi", ["It prints hi first and then gives back 5", "It prints hi and gives back nothing at all", "It gives back 5 and prints hi at the same time"], "return ends the function at once, so the line after it never runs. Anything that must happen first has to be written before the return."],
        ['ב־Python 3, בגוף של פונקציה יש return 5 בשורה הראשונה ו־print("hi") בשורה השנייה. מה קורה כשקוראים לפונקציה?', "היא מחזירה 5 ולא מדפיסה hi אף פעם", ["היא מדפיסה hi קודם ואז מחזירה 5", "היא מדפיסה hi ולא מחזירה שום דבר", "היא מחזירה 5 ומדפיסה hi באותו זמן"], "return מסיים את הפונקציה מיד, ולכן השורה שאחריו אף פעם לא רצה. דברים שחייבים לקרות קודם צריך לכתוב לפני ה־return."]],
      [['In Python 3,  def twice(x): return x * 2 . What is  twice("ab") ?', "abab", ["ab ab", "ab2", "an error"], 'A string multiplied by 2 is repeated, so "ab" * 2 is "abab". The function does not care what type the argument is, only what x * 2 does with it.'],
        ['ב־Python 3, הפונקציה twice מחזירה  x * 2 . מה הערך של twice("ab")?', "abab", ["ab ab", "ab2", "שגיאה"], 'מחרוזת שמוכפלת ב־2 חוזרת על עצמה, ולכן "ab" * 2 הוא "abab". לפונקציה לא משנה מאיזה סוג הארגומנט, אלא רק מה x * 2 עושה איתו.']],
    ],
    n: [
      [13, ["In Python 3,  def triple(n): return n * 3 . What is triple(4) + 1?", "", "triple(4) returns 4 * 3 = 12, and then 12 + 1 = 13."], ["ב־Python 3, הפונקציה triple מחזירה  n * 3 . מה הערך של triple(4) + 1?", "", "triple(4) מחזיר 4 * 3 = 12, ואז 12 + 1 = 13."]],
    ],
    s: [
      [["What happens when a function is called", "Python reaches the line that calls the function", "The arguments are handed to the parameters", "The lines of the function body run, one by one", "A return statement sends a value back to the place of the call"],
        ["מה קורה כשקוראים לפונקציה", "Python מגיעה לשורה שקוראת לפונקציה", "הארגומנטים מועברים לפרמטרים", "שורות גוף הפונקציה רצות, אחת אחרי השנייה", "פקודת return שולחת ערך בחזרה למקום שבו נקראה הפונקציה"]],
    ],
  },
  a: {
    t: [
      ["Scope", "the part of a program where a name can be used", "תחום הכרה (scope)", "האזור בתוכנית שבו אפשר להשתמש בשם מסוים"],
      ["Local variable", "a variable created inside a function that exists only while the function runs", "משתנה מקומי", "משתנה שנוצר בתוך פונקציה וקיים רק בזמן שהיא רצה"],
      ["Global variable", "a variable created outside all functions, which code anywhere in the file can read", "משתנה גלובלי", "משתנה שנוצר מחוץ לכל הפונקציות, ושכל קוד בקובץ יכול לקרוא אותו"],
      ["None", "the value a Python function gives back when it has no return statement", "None", "הערך שפונקציה ב־Python מחזירה כשאין בה פקודת return"],
    ],
    q: [
      [["In Python 3,  def f(): x = 5 . After calling f(), the program runs  print(x)  outside the function, and no other x exists. What happens?", "A NameError: x exists only inside f", ["It prints 5, because f set x earlier on", "It prints 0, as x has no value out here", "It prints None"], "x is a local variable of f; it disappears when f finishes, so outside the function the name x is not defined."],
        ["ב־Python 3, הפונקציה f קובעת בתוכה  x = 5 , וקוראים לה. אחר כך, מחוץ לפונקציה, התוכנית מריצה  print(x) , ואין x אחר. מה קורה?", "שגיאת NameError: x קיים רק בתוך f", ["מודפס 5, כי הפונקציה f כבר קבעה את x קודם", "מודפס 0, כי ל־x אין ערך מחוץ לפונקציה", "מודפס None"], "x הוא משתנה מקומי של f; הוא נעלם כש־f מסתיימת, ולכן מחוץ לפונקציה השם x לא מוגדר."]],
      [["In Python 3,  count = 0  is set outside all functions, and  def add(): count = count + 1  is called with  add() . What happens?", "An UnboundLocalError, because count is local to add", ["The global count becomes 1, because add can see it", "Only a local count becomes 1; the global count stays 0", "Python adds 1 to the global count by itself, with no error"], "Because add assigns to count, Python treats count as local to add, and reading it before it has a value fails. Writing global count inside add would let it change the global variable.", "Look at the line that changes count: it assigns to count. What does Python assume about a name that a function assigns to?"],
        ["ב־Python 3, מחוץ לכל פונקציה נקבע  count = 0 , והפונקציה add מבצעת בתוכה  count = count + 1 . אחר כך קוראים ל־add(). מה קורה?", "שגיאת UnboundLocalError, כי count מקומי בתוך add", ["count הגלובלי הופך ל־1, כי add רואה אותו", "רק count מקומי הופך ל־1; הגלובלי נשאר 0", "Python מוסיפה 1 ל־count הגלובלי בעצמה, בלי שגיאה"], "מכיוון ש־add נותנת ערך ל־count, Python רואה את count כמשתנה מקומי של add, וקריאה שלו לפני שיש לו ערך נכשלת. כתיבת global count בתוך add הייתה מאפשרת לשנות את המשתנה הגלובלי.", "שימו לב לשורה שמשנה את count: היא נותנת ערך ל־count. מה Python מניחה לגבי שם שפונקציה נותנת לו ערך?"]],
      [["In Python 3,  def f(n): n * 2  has no return. What does  print(f(4))  show?", "None", ["8", "4", "an error"], "The function calculates 8 but never returns it, so the call gives back None."],
        ["ב־Python 3, בפונקציה f, שמבצעת  n * 2 , אין return. מה מציג  print(f(4)) ?", "None", ["8", "4", "שגיאה"], "הפונקציה מחשבת 8 אבל לא מחזירה אותו, ולכן הקריאה מחזירה None."]],
    ],
    n: [
      [16, ["In Python 3,  def sq(n): return n * n . What is sq(sq(2))?", "", "The inner call runs first: sq(2) = 4, then sq(4) = 16."], ["ב־Python 3, הפונקציה sq מחזירה  n * n . מה הערך של sq(sq(2))?", "", "הקריאה הפנימית רצה קודם: sq(2) = 4, ואז sq(4) = 16."]],
      [17, ["In Python 3,  def power(base, exp=2): return base ** exp . What is  power(3) + power(2, 3) ?", "", "power(3) uses the default exp = 2 and gives 9; power(2, 3) gives 8; and 9 + 8 = 17."],
        ["ב־Python 3, הפונקציה power מחזירה  base ** exp , וברירת המחדל של exp היא 2. מה הערך של power(3) + power(2, 3)?", "", "power(3) משתמשת בברירת המחדל exp = 2 ונותנת 9; power(2, 3) נותנת 8; ו־9 + 8 = 17."]],
      [24, ["In Python 3,  def fact(n): return 1 if n == 0 else n * fact(n - 1) . What is fact(4)?", "", "The function calls itself until n is 0: 4 × 3 × 2 × 1 × 1 = 24."], ["ב־Python 3, הפונקציה fact מחזירה  1  כש־n == 0, ואחרת  n * fact(n - 1) . מה הערך של fact(4)?", "", "הפונקציה קוראת לעצמה עד ש־n הוא 0: 4 × 3 × 2 × 1 × 1 = 24."]],
    ],
  },
};
export default c;
