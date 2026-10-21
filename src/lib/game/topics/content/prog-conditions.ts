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
        ["איזה סימן בודק ב־Python אם שני ערכים שווים?", "==", ["=", "!=", "=>"], "הסימן == משווה בין שני ערכים. סימן = אחד שומר ערך במשתנה, והצירוף x != y פירושו ״x לא שווה ל־y״."]],
      [['A game has the rule  if lives == 0: show "Game over" . When is “Game over” shown?', "Only when lives is exactly 0", ["Whenever lives changes", "When lives is more than 0", "All the time"], "The condition lives == 0 is True only when lives is 0, so only then does the message appear."],
        ['במשחק יש כלל  if lives == 0: show "Game over" . מתי תוצג ההודעה Game over?', "רק כש־lives שווה בדיוק ל־0", ["בכל פעם ש־lives משתנה", "כש־lives גדול מ־0", "כל הזמן"], "התנאי lives == 0 הוא True רק כש־lives הוא 0, ורק אז ההודעה מופיעה."]],
      [["Which two values can a Boolean have?", "True and False", ["Yes and No", "Any whole number", "Any piece of text"], "A Boolean has exactly two possible values in Python: True and False. Yes and No are not Python values, and numbers and text are other kinds of data."],
        ["אילו שני ערכים יכול להיות ל־Boolean?", "True ו־False", ["כן ולא", "כל מספר שלם", "כל טקסט"], "ל־Boolean יש בדיוק שני ערכים אפשריים ב־Python: True ו־False. ״כן״ ו״לא״ אינם ערכים של Python, ומספרים וטקסט הם סוגים אחרים של נתונים."]],
      [['In Python 3, after  x = 4 , the program checks  if x != 4  (prints "different"), and otherwise (else) prints "same". What is printed?', "same", ["different", "different, then same", "nothing"], "x != 4 means that x is not equal to 4. Here x is 4, so the condition is False, and the else part runs and prints same."],
        ['ב־Python 3, אחרי  x = 4  התוכנית בודקת  if x != 4  (מדפיסה "different"), ואחרת (else) מדפיסה "same". מה מודפס?', "same", ["different", "different ואחריו same", "כלום"], "x != 4 פירושו ש־x לא שווה ל־4. כאן x הוא 4, ולכן התנאי הוא False, וחלק ה־else רץ ומדפיס same."]],
      [["What does the else part of an if statement do?", "It runs only when the condition of the if is False", ["It runs every time, after the if part", "It runs only when the condition of the if is True", "It checks a second condition"], "else has no condition of its own: it is the way out when the if condition was False. To check a second condition, Python uses elif."],
        ["מה עושה חלק ה־else של משפט if?", "הוא רץ רק כשהתנאי של ה־if הוא False", ["הוא רץ בכל פעם, אחרי חלק ה־if", "הוא רץ רק כשהתנאי של ה־if הוא True", "הוא בודק תנאי שני"], "ל־else אין תנאי משלו: זו הדרך החוצה כשתנאי ה־if היה False. כדי לבדוק תנאי שני Python משתמש ב־elif."]],
    ],
    n: [
      [1, ["x = 7. How many of these three conditions are True:  x == 7 ,  x != 7 ,  x == 8 ?", "", "x == 7 is True. x != 7 is False because x is 7, and x == 8 is False. So exactly 1 of the three conditions is True."],
        ["x = 7. כמה מהתנאים האלה הם True:  x == 7 ,  x != 7 ,  x == 8 ?", "", "x == 7 הוא True. x != 7 הוא False כי x הוא 7, ו־x == 8 הוא False. לכן בדיוק 1 משלושת התנאים הוא True."]],
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
      [["In Python 3, what happens with the line  if x = 5: ?", "A SyntaxError, because = stores a value and == compares", ["It checks whether x is 5", "It sets x to 5, and the condition is True", "It prints x"], "A single = stores a value in a variable, so it cannot be used as a condition. To ask whether x is 5, write if x == 5: with two equals signs."],
        ["ב־Python 3, מה קורה עם השורה  if x = 5: ?", "שגיאת SyntaxError, כי = שומר ערך ו־== משווה", ["היא בודקת אם x שווה 5", "היא קובעת ש־x הוא 5, והתנאי הוא True", "היא מדפיסה את x"], "סימן = אחד שומר ערך במשתנה, ולכן אי אפשר להשתמש בו כתנאי. כדי לשאול אם x שווה 5 כותבים if x == 5: עם שני סימני שווה."]],
      [['In Python 3, after  name = "Dana" , what is the value of  name == "dana" ?', "False", ["True", "an error", "Dana"], "Python compares texts letter by letter, and a capital D is not the same as a small d, so the two texts are different and the result is False."],
        ['ב־Python 3, אחרי  name = "Dana"  מה הערך של  name == "dana" ?', "False", ["True", "שגיאה", "Dana"], "Python משווה טקסטים אות אחר אות, ו־D גדולה אינה אותה אות כמו d קטנה, ולכן שני הטקסטים שונים והתוצאה היא False."]],
      [['In Python 3, after  day = "Sun" , the program checks  if day == "Sat" or day == "Sun"  (prints "weekend"), and otherwise (else) prints "school day". What is printed?', "weekend", ["school day", "weekend, then school day", "nothing"], "or needs only one side to be True: day == \"Sun\" is True, so the whole condition is True and the else part is skipped."],
        ['ב־Python 3, אחרי  day = "Sun"  התוכנית בודקת  if day == "Sat" or day == "Sun"  (מדפיסה "weekend"), ואחרת (else) מדפיסה "school day". מה מודפס?', "weekend", ["school day", "weekend ואחריו school day", "כלום"], 'or צריך רק צד אחד שהוא True: day == "Sun" הוא True, ולכן כל התנאי הוא True וחלק ה־else מדולג.']],
      [['A learner writes  if day == "Sat" and day == "Sun"  to catch the weekend. What goes wrong?', "The condition is never True, because day cannot be both at once", ["The condition is always True", "The condition is True only on Saturday", "Python reports a NameError"], "and needs both sides to be True, but day holds one text at a time. For a weekend the learner needs or: day == \"Sat\" or day == \"Sun\"."],
        ['תלמיד כותב  if day == "Sat" and day == "Sun"  כדי לזהות סוף שבוע. מה משתבש?', "התנאי אף פעם לא True, כי day לא יכול להיות שניהם בבת אחת", ["התנאי תמיד True", "התנאי True רק בשבת", "Python מדווח על שגיאת NameError"], 'and דורש ששני הצדדים יהיו True, אבל ב־day נמצא טקסט אחד בכל רגע. כדי לזהות סוף שבוע צריך or: day == "Sat" or day == "Sun".']],
    ],
    n: [
      [3, ["A truth table for the inputs A and B has 4 rows. In how many of those rows is  A or B  True?", "", "The only row where A or B is False is the one where both inputs are False. The other 3 rows each have at least one True input, so A or B is True in 3 rows."],
        ["בטבלת אמת לקלטים A ו־B יש 4 שורות. בכמה מהשורות האלה הביטוי  A or B  הוא True?", "", "השורה היחידה שבה A or B הוא False היא זו ששני הקלטים בה False. בכל 3 השורות האחרות יש לפחות קלט אחד True, ולכן A or B הוא True ב־3 שורות."]],
    ],
    s: [
      [["An if–elif–else chain when both conditions are False", "Check the if condition: it is False, so skip its block", "Check the elif condition: it is False too, so skip its block", "Reach the else, which has no condition of its own", "Run the else block"],
        ["שרשרת if–elif–else כששני התנאים False", "בודקים את תנאי ה־if: הוא False, ולכן מדלגים על הבלוק שלו", "בודקים את תנאי ה־elif: גם הוא False, ולכן מדלגים על הבלוק שלו", "מגיעים ל־else, שאין לו תנאי משלו", "מריצים את הבלוק של ה־else"]],
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
        ["ב־Python 3, איזה תנאי הוא True בדיוק עבור המספרים מ־10 עד 20, כולל 10 וכולל 20?", "x >= 10 and x <= 20", ["x > 10 and x < 20", "x >= 10 or x <= 20", "x == 10 and x == 20"], "שני הקצוות כלולים, ולכן משתמשים בסימנים ״גדול או שווה״ ו״קטן או שווה״, ומחברים אותם עם and. עם or כל מספר היה עובר."]],
      [['In Python 3, what does  print(10 == "10")  show?', "False", ["True", "an error", "10"], '10 is an int and "10" is a str. Values of different types are not equal, so == gives False (and there is no error).'],
        ['מה מציג  print(10 == "10")  ב־Python 3?', "False", ["True", "שגיאה", "10"], '10 הוא int ו־"10" הוא str. ערכים מסוגים שונים אינם שווים, ולכן == נותן False (ואין שגיאה).']],
      [['In Python 3,  x = 0 , then  if x != 0 and 10 / x == 5: print("five") . What happens?', "Nothing is printed and there is no error", ["A ZeroDivisionError", "five is printed", "A SyntaxError"], "x != 0 is False, and an and with a False left side is False whatever comes next, so Python never works out 10 / x. Putting the safe check first protects the program from dividing by zero."],
        ['ב־Python 3,  x = 0 , ואחר כך  if x != 0 and 10 / x == 5: print("five") . מה קורה?', "לא מודפס כלום ואין שגיאה", ["שגיאת ZeroDivisionError", "מודפס five", "שגיאת SyntaxError"], "x != 0 הוא False, ו־and שהצד השמאלי שלו False הוא False בכל מקרה, ולכן Python אף פעם לא מחשב את 10 / x. בדיקה בטוחה שמוצבת ראשונה מגנה על התוכנית מחלוקה באפס."]],
      [["Which condition means the same as  not (a == 1 or b == 2) ?", "a != 1 and b != 2", ["a != 1 or b != 2", "a == 1 and b == 2", "not a == 1 or b == 2"], "The whole condition is True only when a is not 1 and also b is not 2, so both parts must hold. Changing the or into an and and turning each test around is called De Morgan's law."],
        ["איזה תנאי שווה בערכו ל־ not (a == 1 or b == 2) ?", "a != 1 and b != 2", ["a != 1 or b != 2", "a == 1 and b == 2", "not a == 1 or b == 2"], "התנאי כולו True רק כש־a אינו 1 וגם b אינו 2, ולכן שני החלקים צריכים להתקיים. החלפה של or ב־and והפיכה של כל בדיקה נקראת חוק דה־מורגן."]],
      [["In Python 3, what is the value of  True or False and False ?", "True", ["False", "an error", "None"], "and is worked out before or, so the expression is True or (False and False), which is True or False, which is True. Brackets, as in (True or False) and False, would give False."],
        ["ב־Python 3, מה הערך של  True or False and False ?", "True", ["False", "שגיאה", "None"], "and מחושב לפני or, ולכן הביטוי הוא True or (False and False), כלומר True or False, כלומר True. סוגריים, כמו ב־(True or False) and False, היו נותנים False."]],
    ],
    n: [
      [8, ["How many rows does a truth table for three True/False inputs have?", "", "Each input has 2 possible values, so there are 2 × 2 × 2 = 8 combinations, one row each."], ["כמה שורות יש בטבלת אמת לשלושה קלטים שכל אחד מהם True או False?", "", "לכל קלט יש 2 ערכים אפשריים, ולכן יש 2 × 2 × 2 = 8 צירופים, שורה לכל אחד."]],
      [16, ["How many rows does a truth table for four True/False inputs have?", "", "Each True/False input doubles the number of combinations, so four inputs give 2 × 2 × 2 × 2 = 16 rows."],
        ["כמה שורות יש בטבלת אמת לארבעה קלטים שכל אחד מהם True או False?", "", "כל קלט של True או False מכפיל את מספר הצירופים, ולכן ארבעה קלטים נותנים 2 × 2 × 2 × 2 = 16 שורות."]],
      [2, ['In Python 3, how many times is hi printed by  for i in range(4): if i == 1 or i == 3: print("hi") ?', "", "The loop gives i the values 0, 1, 2 and 3. The condition i == 1 or i == 3 is True for 1 and for 3, so hi is printed 2 times."],
        ['ב־Python 3, כמה פעמים מודפס hi בקוד  for i in range(4): if i == 1 or i == 3: print("hi") ?', "", "הלולאה נותנת ל־i את הערכים 0, 1, 2 ו־3. התנאי i == 1 or i == 3 הוא True עבור 1 ועבור 3, ולכן hi מודפס 2 פעמים."]],
    ],
  },
};
export default c;
