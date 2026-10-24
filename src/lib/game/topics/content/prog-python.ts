import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["print()", "the Python function that shows text or values on the screen", "print()", "הפונקציה של Python שמציגה טקסט או ערכים על המסך"],
      ["input()", "the Python function that waits for the user to type something and gives it back as text", "input()", "הפונקציה של Python שמחכה שהמשתמש יקליד משהו ומחזירה אותו כטקסט"],
      ["Comment", "a note for people that Python ignores; it starts with #", "הערה", "פתק לבני אדם ש־Python מתעלם ממנו; הוא מתחיל בסימן #"],
      ["Indentation", "spaces at the start of a line that show which lines belong inside an if, a loop or a function", "הזחה", "רווחים בתחילת שורה שמראים אילו שורות שייכות לתוך if, לולאה או פונקציה"],
    ],
    q: [
      [['In Python 3, what does  print("Hello, world!")  do?', "Shows Hello, world! on the screen", ["Asks the user to type Hello, world!", "Prints Hello, world! on paper", "Saves Hello, world! in a file"], "print writes its text on the screen; the quotes are not shown."],
        ['ב־Python 3, מה עושה  print("Hello, world!") ?', "מציג Hello, world! על המסך", ["מבקש מהמשתמש להקליד Hello, world!", "מדפיס Hello, world! על נייר", "שומר Hello, world! בקובץ"], "print כותב את הטקסט שלו על המסך; המירכאות עצמן לא מוצגות."]],
      [["In Python 3, what happens to the line  # say hi  ?", "Python ignores it, because it is a comment", ["Python prints say hi on the screen", "Python stops with an error, because # is not allowed", "Python says hi out loud through the speakers"], "Everything after # on a line is a comment: a note for people reading the code."],
        ["ב־Python 3, מה קורה לשורה  # say hi  ?", "Python מתעלם ממנה, כי היא הערה", ["Python מדפיס say hi על המסך", "Python נעצר עם שגיאה, כי הסימן # אסור", "Python אומר hi בקול דרך הרמקולים"], "כל מה שאחרי # בשורה הוא הערה: פתק לאנשים שקוראים את הקוד."]],
      [["In Python 3, what does  print(2 + 3)  show?", "5", ["2 + 3", "23", "an error"], "Without quotes, 2 + 3 is a calculation, so Python works it out and prints 5."],
        ["ב־Python 3, מה מציג  print(2 + 3) ?", "5", ["2 + 3", "23", "שגיאה"], "בלי מירכאות 2 + 3 הוא חישוב, ולכן Python מחשב אותו ומדפיס 5."]],
      [['In Python 3, after  name = input("Name? ")  the user typed Dan, and then  print("Hi " + name)  runs. What is printed?', "Hi Dan", ["Hi name", "Hi", "Dan"], 'input shows "Name? " and gives back what the user typed, "Dan", which is stored in name. Then "Hi " + name joins the two texts into "Hi Dan"; the word name inside quotes would be printed just as it is.'],
        ['ב־Python 3, אחרי  name = input("Name? ")  המשתמש הקליד Dan, ואז רצה  print("Hi " + name) . מה מודפס?', "Hi Dan", ["Hi name", "Hi", "Dan"], 'input מציגה "Name? " ומחזירה את מה שהמשתמש הקליד, "Dan", שנשמר ב־name. אחר כך "Hi " + name מחבר את שני הטקסטים ל־"Hi Dan"; המילה name בתוך מירכאות הייתה מודפסת כמו שהיא.']],
      [["Which of these is a correct comment in Python 3?", "# save the file", ["// save the file", "% save the file", "/* save the file */"], "A Python comment starts with #. The // form is used in JavaScript, % in MATLAB and LaTeX, and /* */ in C and Java."],
        ["איזו מהשורות האלה היא הערה תקינה ב־Python 3?", "# save the file", ["// save the file", "% save the file", "/* save the file */"], "הערה ב־Python מתחילה בסימן #. הצורה // משמשת ב־JavaScript, הצורה % ב־MATLAB וב־LaTeX, והצורה /* */ ב־C וב־Java."]],
    ],
  },
  i: {
    t: [
      ["Keyword", "a word with a special job in Python, such as if, for or def, which cannot be used as a variable name", "מילה שמורה", "מילה שיש לה תפקיד מיוחד ב־Python, כמו if, for או def, ואי אפשר לתת אותה כשם למשתנה"],
      ["Colon", "the : at the end of a line that starts an if, a loop or a def, before an indented block", "נקודתיים", "הסימן : בסוף שורה שפותחת if, לולאה או def, לפני בלוק מוזח"],
      ["Case sensitivity", "treating capital and small letters as different, so Score and score are two different names", "רגישות לאותיות גדולות וקטנות", "הבחנה בין אות גדולה לקטנה, כך ש־Score ו־score הם שני שמות שונים"],
      ["Interpreter", "the program that reads Python code and runs it, one statement after another", "מפרש (interpreter)", "התוכנה שקוראת קוד Python ומריצה אותו, פקודה אחרי פקודה"],
    ],
    q: [
      [['In Python 3,  name = input("Name? ")  and the user types 7. What type is name?', "str (a string)", ["int (a whole number)", "float (a decimal number)", "bool (True or False)"], 'input always gives back a string, here "7". int(name) would turn it into the number 7.'],
        ['ב־Python 3,  name = input("Name? ")  והמשתמש מקליד 7. מה הסוג של name?', "str (מחרוזת)", ["int (מספר שלם)", "float (מספר עשרוני)", "bool (אמת או שקר)"], 'input תמיד מחזיר מחרוזת, כאן "7". הקוד int(name) יהפוך אותה למספר 7.']],
      [["In Python 3, a line  for i in range(3):  is followed by  print(i)  at the very start of the next line, with no spaces before it. Why does it fail?", "The print line must be indented to be inside the loop (IndentationError)", ["The colon should be a semicolon, so that the loop knows where it ends", "print cannot be used inside a loop, only after the loop has finished", "range must be written in capitals, as RANGE, so that Python understands it"], "After a line ending in a colon, Python expects an indented block; without it, it raises an IndentationError."],
        ["ב־Python 3, אחרי השורה  for i in range(3)  שנגמרת בנקודתיים מגיעה השורה  print(i)  בתחילת השורה הבאה, בלי רווחים לפניה. למה זה נכשל?", "שורת ה־print צריכה הזחה כדי להיות בתוך הלולאה (IndentationError)", ["במקום נקודתיים צריך נקודה־פסיק, כדי שהלולאה תדע איפה היא נגמרת", "אי אפשר להשתמש ב־print בתוך לולאה, רק אחרי שהלולאה מסתיימת", "צריך לכתוב את range באותיות גדולות, RANGE, כדי ש־Python תבין אותה"], "אחרי שורה שנגמרת בנקודתיים Python מצפה לבלוק מוזח; בלעדיו הוא מעלה שגיאת IndentationError."]],
      [['In Python 3, what does  print("a", "b")  show?', "a b", ["ab", "a,b", "(a, b)"], "When print gets several values separated by commas, it shows them with one space between them."],
        ['ב־Python 3, מה מציג  print("a", "b") ?', "a b", ["ab", "a,b", "(a, b)"], "כש־print מקבל כמה ערכים מופרדים בפסיקים, הוא מציג אותם עם רווח אחד ביניהם."]],
      [["Which of these can be used as a variable name in Python 3?", "my_score", ["my-score", "2nd_place", "for"], "A name may use letters, digits and underscores, but it must not start with a digit and must not be a keyword. my-score has a minus sign, which Python reads as subtraction, 2nd_place starts with a digit, and for is a keyword."],
        ["איזה מהשמות האלה אפשר להשתמש בו כשם של משתנה ב־Python 3?", "my_score", ["my-score", "2nd_place", "for"], "שם יכול להכיל אותיות, ספרות וקווים תחתונים, אבל אסור שיתחיל בספרה ואסור שיהיה מילה שמורה. ב־my-score יש סימן מינוס ש־Python קוראת כחיסור, 2nd_place מתחיל בספרה, ו־for היא מילה שמורה."]],
      [['In Python 3, after  n = input("Number? ")  the user typed 4, and then  print(n + n)  runs. What is printed?', "44", ["8", "n + n", "an error"], 'input gives back text, so n is the string "4", and + joins strings: "4" + "4" is "44". Only int(n) + int(n) would give 8.', "What type does input give back, a number or text? And what does + do with two pieces of text?"],
        ['ב־Python 3, אחרי  n = input("Number? ")  המשתמש הקליד 4, ואז רצה  print(n + n) . מה מודפס?', "44", ["8", "n + n", "שגיאה"], 'input מחזירה טקסט, ולכן n היא המחרוזת "4", וה־+ מחבר מחרוזות: "4" + "4" הוא "44". רק int(n) + int(n) היה נותן 8.', "איזה סוג input מחזירה, מספר או טקסט? ומה עושה + לשני טקסטים?"]],
      [['In Python 3, what happens when you run  Print("hi") ?', "A NameError: Python is case-sensitive, so Print is not print", ["It prints hi, because Python ignores capital letters in the names of functions", "A SyntaxError, before anything runs", "It prints nothing and carries on"], "The line is written correctly, so it starts to run; but Python treats capital and small letters as different, and there is no function called Print."],
        ['ב־Python 3, מה קורה כשמריצים  Print("hi") ?', "שגיאת NameError: Python מבחין בין אותיות גדולות לקטנות, ו־Print הוא לא print", ["מודפס hi, כי Python מתעלמת מההבדל בין אותיות גדולות לקטנות בשמות של פונקציות", "שגיאת SyntaxError, עוד לפני שמשהו רץ", "לא מודפס כלום והתוכנית ממשיכה"], "השורה כתובה נכון ולכן היא מתחילה לרוץ; אבל Python מבחין בין אותיות גדולות לקטנות, ואין פונקציה בשם Print."]],
    ],
  },
  a: {
    t: [
      ["Module", "a file of Python code that other programs can load and reuse", "מודול", "קובץ של קוד Python שתוכניות אחרות יכולות לטעון ולהשתמש בו"],
      ["import", "the keyword that loads a module, such as math, so that its tools can be used", "import", "המילה השמורה שטוענת מודול, כמו math, כדי שאפשר יהיה להשתמש בכלים שבו"],
      ["Exception", "an error raised while a program runs, which can be caught and handled", "חריגה (exception)", "שגיאה שנזרקת בזמן שתוכנית רצה, ושאפשר לתפוס ולטפל בה"],
      ["try/except", "a pair of blocks: run some code, and if a chosen error happens, run other code instead of crashing", "try/except", "זוג בלוקים: מריצים קוד, ואם קורית שגיאה מסוימת מריצים קוד אחר במקום לקרוס"],
    ],
    q: [
      [["In Python 3, what does  print(round(2.5))  show?", "2", ["3", "2.5", "2.0"], "Python 3 rounds an exact half to the nearest even number, so round(2.5) is 2 and round(3.5) is 4."],
        ["ב־Python 3, מה מציג  print(round(2.5)) ?", "2", ["3", "2.5", "2.0"], "Python 3 מעגל חצי מדויק למספר הזוגי הקרוב, ולכן round(2.5) הוא 2 ו־round(3.5) הוא 4."]],
      [["In Python 3, after  import math , what does  print(math.sqrt(16))  show?", "4.0", ["4", "8.0", "256"], "math.sqrt always gives a float, so the square root of 16 is shown as 4.0."],
        ["ב־Python 3, אחרי  import math , מה מציג  print(math.sqrt(16)) ?", "4.0", ["4", "8.0", "256"], "math.sqrt תמיד מחזיר float, ולכן השורש של 16 מוצג כ־4.0."]],
      [['In Python 3, the code  x = int("abc")  runs inside try, and its  except ValueError:  block sets  x = 0 . What is x afterwards?', "0", ["abc", "None", "The program crashes"], '"abc" is not a number, so int raises a ValueError; except catches it and x becomes 0 instead of the program crashing.'],
        ['ב־Python 3, הקוד  x = int("abc")  רץ בתוך בלוק try, ובבלוק ה־except של ValueError קובעים  x = 0 . מה הערך של x אחרי זה?', "0", ["abc", "None", "התוכנית קורסת"], '"abc" הוא לא מספר, ולכן int זורק ValueError; ה־except תופס אותו ו־x מקבל 0 במקום שהתוכנית תקרוס.']],
      [["Which line prints hi in Python 3?", 'print("hi")', ['print "hi"', 'print["hi"]', "echo hi"], 'In Python 3, print is a function and is called with round brackets. print "hi" was Python 2 style and is a SyntaxError in Python 3.'],
        ["איזו שורה מדפיסה hi ב־Python 3?", 'print("hi")', ['print "hi"', 'print["hi"]', "echo hi"], 'ב־Python 3 הפונקציה print נקראת עם סוגריים עגולים. print "hi" היה הסגנון של Python 2, וב־Python 3 זו שגיאת SyntaxError.']],
      [['In Python 3, the code  print(10 / 0)  runs inside try, and the  except ZeroDivisionError:  block runs  print("oops") . What is printed?', "oops", ["0", "oops, and then an error message", "Nothing: the program crashes"], '10 / 0 raises a ZeroDivisionError before print can show anything. The except block catches it and runs print("oops"), so only oops appears.'],
        ['ב־Python 3, הקוד  print(10 / 0)  רץ בתוך try, ובבלוק ה־except של ZeroDivisionError רצה  print("oops") . מה מודפס?', "oops", ["0", "oops, ואחר כך הודעת שגיאה", "שום דבר: התוכנית קורסת"], 'החישוב 10 / 0 זורק ZeroDivisionError לפני ש־print מספיקה להציג משהו. בלוק ה־except תופס אותה ומריץ את print("oops"), ולכן מופיע רק oops.']],
      [["Which line loads only the function sqrt from the math module in Python 3?", "from math import sqrt", ["import sqrt from math", "from sqrt import math", "import math sqrt"], "from module import name loads one name from a module, so it can then be used without the module's name, as sqrt(16). The form import sqrt from math belongs to JavaScript and is a SyntaxError in Python."],
        ["איזו שורה טוענת רק את הפונקציה sqrt מהמודול math ב־Python 3?", "from math import sqrt", ["import sqrt from math", "from sqrt import math", "import math sqrt"], "from module import name טוענת שם אחד ממודול, ולכן אפשר להשתמש בו אחר כך בלי שם המודול, כמו sqrt(16). הצורה import sqrt from math שייכת ל־JavaScript והיא שגיאת SyntaxError ב־Python."]],
    ],
    n: [
      [8, ["In Python 3, what does  print(2 ** 3)  show?", "", "The sign ** means “to the power of”, so 2 ** 3 is 2 × 2 × 2, which is 8."], ["ב־Python 3, מה מציג  print(2 ** 3) ?", "", "הסימן ** פירושו ״בחזקת״, ולכן 2 בחזקת 3 הוא 2 × 2 × 2, כלומר 8."]],
    ],
  },
};
export default c;
