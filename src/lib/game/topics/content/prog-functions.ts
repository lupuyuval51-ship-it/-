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
      [["Why do programmers write functions?", "To reuse a piece of code instead of copying it again and again", ["To make a program run only once", "Because Python has no loops", "To hide code from the computer"], "A function is written once and called whenever it is needed; a fix inside it fixes every use."],
        ["למה מתכנתים כותבים פונקציות?", "כדי להשתמש שוב בקטע קוד במקום להעתיק אותו שוב ושוב", ["כדי שהתוכנית תרוץ פעם אחת בלבד", "כי ב־Python אין לולאות", "כדי להסתיר קוד מהמחשב"], "פונקציה נכתבת פעם אחת ונקראת בכל פעם שצריך אותה; תיקון בתוכה מתקן את כל השימושים."]],
      [['In Python 3, a program defines  def hi(): print("hello")  but never calls hi(). What is printed?', "Nothing", ["hello", "hi", "an error"], "def only defines the function. Its code runs when it is called with hi()."],
        ['ב־Python 3, תוכנית מגדירה  def hi(): print("hello")  אבל אף פעם לא קוראת ל־hi(). מה מודפס?', "כלום", ["hello", "hi", "שגיאה"], "def רק מגדיר את הפונקציה. הקוד שלה רץ כשקוראים לה עם hi()."]],
      [["Which line calls a function named jump in Python 3?", "jump()", ["def jump():", "jump", "call jump"], "Brackets after the name run the function. def jump(): defines it, and jump without brackets only names it."],
        ["איזו שורה קוראת ב־Python 3 לפונקציה בשם jump?", "jump()", ["def jump():", "jump", "call jump"], "סוגריים אחרי השם מריצים את הפונקציה. def jump(): מגדיר אותה, ו־jump בלי סוגריים רק מזכיר את השם שלה."]],
    ],
  },
  i: {
    t: [
      ["Parameter", "a name in a function's definition that receives a value, like name in def greet(name):", "פרמטר", "שם בהגדרת הפונקציה שמקבל ערך, כמו name ב־def greet(name):"],
      ["Argument", 'the actual value passed in a call, like "Noa" in greet("Noa")', "ארגומנט", 'הערך עצמו שמועבר בקריאה, כמו "Noa" ב־greet("Noa")'],
      ["Return value", "the result a function sends back to the code that called it", "ערך מוחזר", "התוצאה שפונקציה שולחת בחזרה לקוד שקרא לה"],
      ["Default value", 'a value a parameter gets when the call leaves it out, as in def greet(name="friend"):', "ערך ברירת מחדל", 'ערך שפרמטר מקבל כשהקריאה לא מעבירה לו ערך, כמו ב־def greet(name="friend"):'],
    ],
    q: [
      [["In Python 3,  def add(a, b): return a + b . What is add(2, 5)?", "7", ["25", "2", "an error"], "a gets 2 and b gets 5, and the function returns 2 + 5 = 7."],
        ["ב־Python 3,  def add(a, b): return a + b . מה הערך של add(2, 5)?", "7", ["25", "2", "שגיאה"], "a מקבל 2 ו־b מקבל 5, והפונקציה מחזירה 2 + 5 = 7."]],
      [["What is the difference between print and return inside a Python function?", "return sends a value back to the caller; print only shows it on the screen", ["print sends the value back; return only shows it", "They do exactly the same thing", "return deletes the function"], "A returned value can be stored or used in a calculation; a printed value is only shown to the user."],
        ["מה ההבדל בין print ל־return בתוך פונקציה ב־Python?", "return שולח ערך בחזרה לקוד שקרא לפונקציה; print רק מציג אותו על המסך", ["print שולח את הערך בחזרה; return רק מציג אותו", "שניהם עושים בדיוק אותו דבר", "return מוחק את הפונקציה"], "ערך מוחזר אפשר לשמור במשתנה או להשתמש בו בחישוב; ערך מודפס רק מוצג למשתמש."]],
      [['In Python 3,  def greet(name="friend"): return "Hi " + name . What does greet() return?', "Hi friend", ["Hi name", "Hi", "an error"], 'The call gives no argument, so name takes its default value "friend".'],
        ['ב־Python 3,  def greet(name="friend"): return "Hi " + name . מה מחזיר greet()?', "Hi friend", ["Hi name", "Hi", "שגיאה"], 'הקריאה לא מעבירה ארגומנט, ולכן name מקבל את ערך ברירת המחדל "friend".']],
    ],
    n: [
      [13, ["In Python 3,  def triple(n): return n * 3 . What is triple(4) + 1?", "", "triple(4) returns 12, and 12 + 1 = 13."], ["ב־Python 3,  def triple(n): return n * 3 . מה הערך של triple(4) + 1?", "", "triple(4) מחזיר 12, ו־12 + 1 = 13."]],
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
      [["In Python 3,  def f(): x = 5 . After calling f(), the program runs  print(x)  outside the function, and no other x exists. What happens?", "A NameError: x exists only inside f", ["It prints 5", "It prints 0", "It prints None"], "x is a local variable of f; it disappears when f finishes, so outside the function the name x is not defined."],
        ["ב־Python 3,  def f(): x = 5 . אחרי הקריאה ל־f() התוכנית מריצה  print(x)  מחוץ לפונקציה, ואין x אחר. מה קורה?", "שגיאת NameError: x קיים רק בתוך f", ["מודפס 5", "מודפס 0", "מודפס None"], "x הוא משתנה מקומי של f; הוא נעלם כש־f מסתיימת, ולכן מחוץ לפונקציה השם x לא מוגדר."]],
      [["In Python 3,  def f(n): n * 2  has no return. What does  print(f(4))  show?", "None", ["8", "4", "an error"], "The function calculates 8 but never returns it, so the call gives back None."],
        ["ב־Python 3, בפונקציה  def f(n): n * 2  אין return. מה מציג  print(f(4)) ?", "None", ["8", "4", "שגיאה"], "הפונקציה מחשבת 8 אבל לא מחזירה אותו, ולכן הקריאה מחזירה None."]],
    ],
    n: [
      [16, ["In Python 3,  def sq(n): return n * n . What is sq(sq(2))?", "", "The inner call runs first: sq(2) = 4, then sq(4) = 16."], ["ב־Python 3,  def sq(n): return n * n . מה הערך של sq(sq(2))?", "", "הקריאה הפנימית רצה קודם: sq(2) = 4, ואז sq(4) = 16."]],
      [24, ["In Python 3,  def fact(n): return 1 if n == 0 else n * fact(n - 1) . What is fact(4)?", "", "The function calls itself until n is 0: 4 × 3 × 2 × 1 × 1 = 24."], ["ב־Python 3,  def fact(n): return 1 if n == 0 else n * fact(n - 1) . מה הערך של fact(4)?", "", "הפונקציה קוראת לעצמה עד ש־n הוא 0: 4 × 3 × 2 × 1 × 1 = 24."]],
    ],
  },
};
export default c;
