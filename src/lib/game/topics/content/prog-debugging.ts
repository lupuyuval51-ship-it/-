import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Bug", "a mistake in a program that makes it behave wrongly", "באג", "טעות בתוכנית שגורמת לה להתנהג לא נכון"],
      ["Debugging", "finding and fixing the mistakes in a program", "ניפוי שגיאות (דיבאג)", "איתור ותיקון של הטעויות בתוכנית"],
      ["Error message", "the text shown when something goes wrong, naming the problem and the line", "הודעת שגיאה", "הטקסט שמוצג כשמשהו משתבש, ובו סוג הבעיה ומספר השורה"],
      ["Testing", "running a program with chosen inputs to check that it does what it should", "בדיקה (טסט)", "הרצת תוכנית עם קלטים שנבחרו כדי לוודא שהיא עושה את מה שצריך"],
    ],
    q: [
      [["A program runs but shows the wrong score. What is a good first step?", "Go through the code step by step and check the values", ["Write the whole program again from scratch", "Restart the computer and hope", "Make the font bigger"], "Following the code and its values shows where the result first goes wrong; starting over throws away the parts that work."],
        ["תוכנית רצה אבל מציגה ניקוד שגוי. מה צעד ראשון טוב?", "לעבור על הקוד צעד אחר צעד ולבדוק את הערכים", ["לכתוב את כל התוכנית מחדש", "להפעיל מחדש את המחשב ולקוות", "להגדיל את הגופן"], "מעקב אחרי הקוד והערכים מראה איפה התוצאה מתחילה להשתבש; כתיבה מחדש זורקת גם את החלקים שעובדים."]],
      [["Which part of a Python error message tells you where to look?", "The line number where the problem was found", ["The name of the programmer", "The colour of the code", "The size of the file"], "Python's error report names the file and the line, and its last line says what kind of error it is."],
        ["איזה חלק בהודעת שגיאה של Python אומר איפה לחפש?", "מספר השורה שבה נמצאה הבעיה", ["השם של המתכנת", "הצבע של הקוד", "הגודל של הקובץ"], "דוח השגיאה של Python מציין את הקובץ ואת השורה, והשורה האחרונה בו אומרת מה סוג השגיאה."]],
      [['In Python 3, what is wrong with  print("hello)  ?', "The closing quote is missing", ["print must be written in capitals", "hello is not a word Python knows", "There should be no brackets"], 'Every string needs a quote at both ends: print("hello").'],
        ['ב־Python 3, מה לא בסדר בשורה  print("hello)  ?', "חסרות המירכאות הסוגרות", ["צריך לכתוב את print באותיות גדולות", "Python לא מכיר את המילה hello", "לא צריך סוגריים"], 'כל מחרוזת צריכה מירכאות בשני הקצוות: print("hello").']],
    ],
  },
  i: {
    t: [
      ["Syntax error", "breaking the writing rules of the language, so the program cannot start at all", "שגיאת תחביר", "הפרה של כללי הכתיבה של השפה, ולכן התוכנית בכלל לא יכולה להתחיל לרוץ"],
      ["Logic error", "a mistake that lets the program run without crashing but gives a wrong result", "שגיאה לוגית", "טעות שבגללה התוכנית רצה בלי לקרוס אבל נותנת תוצאה שגויה"],
      ["Runtime error", "an error that stops the program while it is running, such as dividing by zero", "שגיאת זמן ריצה", "שגיאה שעוצרת את התוכנית באמצע הריצה, כמו חלוקה באפס"],
      ["Traceback", "Python's error report: where the error happened, with its type on the last line", "Traceback (דוח שגיאה)", "הדוח של Python כשמשהו נכשל: איפה זה קרה, וסוג השגיאה בשורה האחרונה"],
    ],
    q: [
      [["A program meant to find an average adds up the numbers but forgets to divide. What kind of error is this?", "A logic error", ["A syntax error", "A runtime error", "A spelling error in the file name"], "The code is valid and runs to the end; it just calculates the wrong thing."],
        ["תוכנית שאמורה לחשב ממוצע מחברת את המספרים אבל שוכחת לחלק. איזו שגיאה זו?", "שגיאה לוגית", ["שגיאת תחביר", "שגיאת זמן ריצה", "שגיאת כתיב בשם הקובץ"], "הקוד תקין ורץ עד הסוף; הוא פשוט מחשב את הדבר הלא נכון."]],
      [["In Python 3, what does  print(10 / 0)  cause?", "A ZeroDivisionError, which is a runtime error", ["A SyntaxError", "No error: it prints 0", "No error: it prints 10"], "The line is written correctly, so the program starts; it stops when it actually tries to divide by zero."],
        ["ב־Python 3, מה גורם  print(10 / 0) ?", "שגיאת ZeroDivisionError, שהיא שגיאת זמן ריצה", ["שגיאת SyntaxError", "אין שגיאה: מודפס 0", "אין שגיאה: מודפס 10"], "השורה כתובה נכון, ולכן התוכנית מתחילה; היא נעצרת כשהיא באמת מנסה לחלק באפס."]],
      [["In Python 3, the line  if x > 5  has no colon at the end. What happens?", "A SyntaxError, and the program does not start", ["It runs and skips the if", "It runs but gives a wrong answer", "Python adds the colon by itself"], "Python checks the writing rules before running anything, so a missing colon stops the whole program."],
        ["ב־Python 3, בסוף השורה  if x > 5  חסרות הנקודתיים. מה קורה?", "שגיאת SyntaxError, והתוכנית לא מתחילה", ["היא רצה ומדלגת על ה־if", "היא רצה אבל נותנת תשובה שגויה", "Python מוסיף את הנקודתיים לבד"], "Python בודק את כללי הכתיבה לפני שהוא מריץ משהו, ולכן נקודתיים חסרות עוצרות את כל התוכנית."]],
      [["Python 3 shows  NameError: name 'scroe' is not defined . What is the most likely cause?", "A typo in a variable name (scroe instead of score)", ["The computer has run out of memory", "A number was divided by zero", "The file is too long"], "NameError means Python does not know that name; a misspelt variable is the usual reason."],
        ["Python 3 מציג  NameError: name 'scroe' is not defined . מה הסיבה הסבירה ביותר?", "שגיאת הקלדה בשם של משתנה (scroe במקום score)", ["נגמר למחשב הזיכרון", "מספר חולק באפס", "הקובץ ארוך מדי"], "NameError אומר ש־Python לא מכיר את השם; בדרך כלל זה משתנה שנכתב עם שגיאת כתיב."]],
    ],
  },
  a: {
    t: [
      ["Trace table", "a table that records each variable's value after every step, used to follow code by hand", "טבלת מעקב", "טבלה שרושמת את הערך של כל משתנה אחרי כל צעד, כדי לעקוב אחרי הקוד ביד"],
      ["Breakpoint", "a marked line where a debugger pauses the program so you can inspect the values", "נקודת עצירה", "שורה מסומנת שבה כלי הדיבאג משהה את התוכנית כדי שאפשר יהיה לבדוק את הערכים"],
      ["Edge case", "an unusual input at the limits, such as an empty list or zero, that often reveals bugs", "מקרה קצה", "קלט חריג בגבולות, כמו רשימה ריקה או אפס, שחושף באגים לעיתים קרובות"],
      ["Rubber duck debugging", "explaining your code out loud, line by line, which often reveals the mistake", "שיטת ברווז הגומי", "הסבר של הקוד בקול, שורה אחר שורה, שחושף פעמים רבות את הטעות"],
    ],
    q: [
      [["This Python 3 code should add up 1 to 5:  total = 0 , then  for i in range(1, 5): total += i . It gives 10, not 15. What is the bug?", "range(1, 5) stops before 5; it should be range(1, 6)", ["total should start at 1", "+= should be =", "The loop should start at 0"], "range(1, 5) gives 1, 2, 3, 4 (sum 10). This off-by-one bug is fixed by range(1, 6), which also includes 5."],
        ["הקוד הבא ב־Python 3 אמור לחבר את המספרים 1 עד 5:  total = 0 , ואז  for i in range(1, 5): total += i . הוא נותן 10 ולא 15. מה הבאג?", "range(1, 5) נעצר לפני 5; צריך range(1, 6)", ["total צריך להתחיל ב־1", "צריך = במקום +=", "הלולאה צריכה להתחיל מ־0"], "range(1, 5) נותן 1, 2, 3, 4 (סכום 10). את טעות ה־off-by-one הזאת מתקן range(1, 6), שכולל גם את 5."]],
      [["An average function works for most lists but crashes when it is given an empty list. What is the empty list here?", "An edge case", ["A syntax error", "A typical input", "A comment"], "Limits such as empty, zero or very large inputs are where bugs hide; good tests try them on purpose."],
        ["פונקציה שמחשבת ממוצע עובדת על רוב הרשימות אבל קורסת כשמקבלת רשימה ריקה. מה היא הרשימה הריקה כאן?", "מקרה קצה", ["שגיאת תחביר", "קלט רגיל", "הערה"], "בגבולות, כמו קלט ריק, אפס או ענק, מסתתרים באגים; בדיקות טובות מנסות אותם בכוונה."]],
      [['In Python 3, why does  print(int("7.5"))  fail?', "int() cannot read text with a decimal point, so it raises a ValueError", ["7.5 is too big for an int", "print cannot show numbers", "The quotes must be removed by Python first"], 'int("7") works, but "7.5" is not written like a whole number. float("7.5") would read it.'],
        ['ב־Python 3, למה  print(int("7.5"))  נכשל?', "int() לא יכול לקרוא טקסט עם נקודה עשרונית, ולכן נזרקת שגיאת ValueError", ["7.5 גדול מדי בשביל int", "print לא יכול להציג מספרים", "Python צריך קודם להוריד את המירכאות"], 'int("7") עובד, אבל "7.5" לא כתוב כמו מספר שלם. float("7.5") היה קורא אותו.']],
    ],
    n: [
      [16, ["Trace it: in Python 3, after  x = 2 , the program runs  for i in range(3): x = x * 2 . What is x?", "", "x doubles three times: 2 → 4 → 8 → 16."], ["עקבו אחרי הקוד: ב־Python 3, אחרי  x = 2  התוכנית מריצה  for i in range(3): x = x * 2 . מה הערך של x?", "", "x מוכפל שלוש פעמים: 2 ← 4 ← 8 ← 16."]],
    ],
    s: [
      [["Fixing a bug", "Make the bug happen again on purpose", "Find where it goes wrong: read the error and trace the values", "Fix the cause in the code", "Test again to check that the fix works"],
        ["תיקון באג", "גורמים לבאג לקרות שוב בכוונה", "מאתרים איפה זה משתבש: קוראים את הודעת השגיאה ועוקבים אחרי הערכים", "מתקנים את הסיבה בקוד", "בודקים שוב שהתיקון עובד"]],
    ],
  },
};
export default c;
