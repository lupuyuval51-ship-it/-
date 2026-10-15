import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Condition", "a question with a True or False answer that decides what the program does next", "תנאי", "שאלה שהתשובה עליה True או False, והיא קובעת מה התוכנית תעשה עכשיו"],
      ["if statement", "code that runs only when its condition is True", "משפט if", "קוד שרץ רק כשהתנאי שלו True"],
      ["else branch", "the part that runs when the condition of the if is False", "ענף else", "החלק שרץ כשהתנאי של ה־if הוא False"],
      ["Comparison", "checking how two values relate: equal, bigger or smaller", "השוואה", "בדיקה של הקשר בין שני ערכים: שווים, גדול או קטן"],
    ],
    q: [
      [['In Python 3, after  x = 12 , the program runs  if x > 10: print("big") . What is printed?', "big", ["nothing", "12", "x > 10"], "12 > 10 is True, so the code after the colon runs and prints big."],
        ['ב־Python 3, אחרי  x = 12  התוכנית מריצה  if x > 10: print("big") . מה מודפס?', "big", ["כלום", "12", "x > 10"], "12 > 10 הוא True, ולכן הקוד שאחרי הנקודתיים רץ ומדפיס big."]],
      [["Which symbol checks whether two values are equal in Python?", "==", ["=", "!=", "=>"], "== compares two values. A single = stores a value in a variable, and != means “not equal”."],
        ["איזה סימן בודק ב־Python אם שני ערכים שווים?", "==", ["=", "!=", "=>"], "== משווה בין שני ערכים. = אחד שומר ערך במשתנה, ו־!= פירושו ״לא שווה״."]],
      [['A game has the rule  if lives == 0: show "Game over" . When is “Game over” shown?', "Only when lives is exactly 0", ["Whenever lives changes", "When lives is more than 0", "All the time"], "The condition lives == 0 is True only when lives is 0, so only then does the message appear."],
        ['במשחק יש כלל  if lives == 0: show "Game over" . מתי תוצג ההודעה Game over?', "רק כש־lives שווה בדיוק ל־0", ["בכל פעם ש־lives משתנה", "כש־lives גדול מ־0", "כל הזמן"], "התנאי lives == 0 הוא True רק כש־lives הוא 0, ורק אז ההודעה מופיעה."]],
    ],
  },
  i: {
    t: [
      ["elif", "Python's short form of “else if”: one more condition, checked only when the ones before it were False", "elif", "הקיצור של Python ל־else if: תנאי נוסף שנבדק רק אם התנאים שלפניו היו False"],
      ["Boolean expression", "an expression whose value is True or False, such as age >= 12", "ביטוי בוליאני", "ביטוי שהערך שלו True או False, כמו age >= 12"],
      ["AND", "a logic operator that gives True only when both sides are True", "האופרטור and", "אופרטור לוגי שנותן True רק כששני הצדדים True"],
      ["OR", "a logic operator that gives True when at least one side is True", "האופרטור or", "אופרטור לוגי שנותן True כשלפחות צד אחד True"],
    ],
    q: [
      [["In Python 3, what is the value of  5 > 3 and 2 > 4 ?", "False", ["True", "5", "an error"], "5 > 3 is True but 2 > 4 is False; and needs both sides to be True, so the result is False."],
        ["ב־Python 3, מה הערך של  5 > 3 and 2 > 4 ?", "False", ["True", "5", "שגיאה"], "5 > 3 הוא True אבל 2 > 4 הוא False; and דורש ששני הצדדים יהיו True, ולכן התוצאה False."]],
      [["In Python 3, what is the value of  1 == 1 or 3 < 2 ?", "True", ["False", "1", "an error"], "1 == 1 is True, and or needs only one True side, so the result is True."],
        ["ב־Python 3, מה הערך של  1 == 1 or 3 < 2 ?", "True", ["False", "1", "שגיאה"], "1 == 1 הוא True, ו־or צריך רק צד אחד שהוא True, ולכן התוצאה True."]],
      [['With temp = 25, a Python 3 program checks  if temp > 30  (prints "hot"), then  elif temp > 20  (prints "warm"), and else prints "cold". What is printed?', "warm", ["warm, then cold", "cold", "hot"], "25 > 30 is False, so the elif is checked: 25 > 20 is True, so warm is printed and the else is skipped. Only one branch of an if–elif–else ever runs."],
        ['כש־temp = 25, תוכנית ב־Python 3 בודקת  if temp > 30  (מדפיסה "hot"), אחר כך  elif temp > 20  (מדפיסה "warm"), ואחרת (else) מדפיסה "cold". מה מודפס?', "warm", ["warm ואחריו cold", "cold", "hot"], "25 > 30 הוא False, ולכן נבדק ה־elif: 25 > 20 הוא True, ולכן מודפס warm וה־else מדולג. בשרשרת if–elif–else תמיד רץ ענף אחד בלבד."]],
    ],
  },
  a: {
    t: [
      ["NOT", "a logic operator that flips True to False and False to True", "האופרטור not", "אופרטור לוגי שהופך True ל־False ו־False ל־True"],
      ["Nested condition", "an if placed inside another if, checked only when the outer condition is True", "תנאי מקונן", "if שנמצא בתוך if אחר, ונבדק רק כשהתנאי החיצוני True"],
      ["Truth table", "a table that lists the result of a logic expression for every combination of True and False", "טבלת אמת", "טבלה שמראה את התוצאה של ביטוי לוגי לכל צירוף של True ו־False"],
      ["Short-circuit evaluation", "stopping as soon as the answer is known: in A and B, if A is False then B is not checked at all", "הערכה מקוצרת", "עצירה ברגע שהתשובה ידועה: ב־A and B, אם A הוא False אז את B בכלל לא בודקים"],
    ],
    q: [
      [["In Python 3, what is the value of  not (3 > 1 and 2 > 5) ?", "True", ["False", "None", "an error"], "3 > 1 is True and 2 > 5 is False, so the and gives False; not flips it to True."],
        ["ב־Python 3, מה הערך של  not (3 > 1 and 2 > 5) ?", "True", ["False", "None", "שגיאה"], "3 > 1 הוא True ו־2 > 5 הוא False, ולכן ה־and נותן False; ה־not הופך אותו ל־True."]],
      [["In Python 3, which condition is True exactly for the numbers from 10 to 20, including both 10 and 20?", "x >= 10 and x <= 20", ["x > 10 and x < 20", "x >= 10 or x <= 20", "x == 10 and x == 20"], "Both ends are included, so use >= and <=, joined with and. With or, every number would pass."],
        ["ב־Python 3, איזה תנאי הוא True בדיוק עבור המספרים מ־10 עד 20, כולל 10 וכולל 20?", "x >= 10 and x <= 20", ["x > 10 and x < 20", "x >= 10 or x <= 20", "x == 10 and x == 20"], "שני הקצוות כלולים, ולכן משתמשים ב־>= וב־<=, ומחברים אותם עם and. עם or כל מספר היה עובר."]],
      [['In Python 3, what does  print(10 == "10")  show?', "False", ["True", "an error", "10"], '10 is an int and "10" is a str. Values of different types are not equal, so == gives False (and there is no error).'],
        ['מה מציג  print(10 == "10")  ב־Python 3?', "False", ["True", "שגיאה", "10"], '10 הוא int ו־"10" הוא str. ערכים מסוגים שונים אינם שווים, ולכן == נותן False (ואין שגיאה).']],
    ],
    n: [
      [8, ["How many rows does a truth table for three True/False inputs have?", "", "Each input has 2 possible values, so there are 2 × 2 × 2 = 8 combinations, one row each."], ["כמה שורות יש בטבלת אמת לשלושה קלטים שכל אחד מהם True או False?", "", "לכל קלט יש 2 ערכים אפשריים, ולכן יש 2 × 2 × 2 = 8 צירופים, שורה לכל אחד."]],
    ],
  },
};
export default c;
