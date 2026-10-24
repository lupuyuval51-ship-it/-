import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Variable", "a named place in memory that stores a value the program can use and change", "משתנה", "מקום בעל שם בזיכרון ששומר ערך שהתוכנית יכולה להשתמש בו ולשנות אותו"],
      ["Value", 'the piece of data that is stored, such as 7 or "cat"', "ערך", 'פיסת המידע שנשמרת, כמו 7 או "cat"'],
      ["Assignment", "the step that puts a value into a variable, so the program can use it later", "השמה", "הפעולה שמכניסה ערך לתוך משתנה, כדי שהתוכנית תוכל להשתמש בו אחר כך"],
      ["Memory", "the part of the computer where a running program keeps its data", "זיכרון", "החלק במחשב שבו תוכנית שרצה שומרת את הנתונים שלה"],
    ],
    q: [
      [["In Python 3, what does this code print?  age = 10; print(age)", "10", ["age", "an error", "nothing"], "print(age) shows the value stored in the variable age, which is 10. Without quotes, age is a variable name, not text."],
        ["מה מדפיס הקוד הבא ב־Python 3?  age = 10; print(age)", "10", ["age", "שגיאה", "כלום"], "print(age) מציג את הערך ששמור במשתנה age, כלומר 10. בלי מירכאות, age הוא שם של משתנה ולא טקסט."]],
      [["In Python 3, after  x = 3  and then  x = 8 , what is stored in x?", "8", ["3 and 8", "11", "3"], "A variable holds one value at a time: the new assignment replaces the old value."],
        ["ב־Python 3, אחרי  x = 3  ואז  x = 8 , מה שמור ב־x?", "8", ["3 וגם 8", "11", "3"], "משתנה מחזיק ערך אחד בכל רגע: ההשמה החדשה מחליפה את הערך הישן."]],
      [["In Python, what does the = sign in  score = 0  do?", "It stores 0 in the variable score", ["It checks whether score equals 0", "It prints score", "It deletes score"], "In Python, = means assignment: the value on the right goes into the variable on the left. Checking whether two values are equal uses ==."],
        ["ב־Python, מה עושה הסימן = בקוד  score = 0 ?", "שומר את 0 במשתנה score", ["בודק אם score שווה ל־0", "מדפיס את score", "מוחק את score"], "ב־Python הסימן = הוא השמה: הערך שמימין נכנס למשתנה שמשמאל. בדיקה אם שני ערכים שווים נכתבת עם ==."]],
      [['In Python 3, which line stores the text Dana in a variable called name?', 'name = "Dana"', ['"Dana" = name', 'name == "Dana"', 'name = Dana'], 'The variable goes on the left and the value on the right. Without quotes, Dana would be read as the name of another variable, and == only compares two values.'],
        ['ב־Python 3, איזו שורה שומרת את הטקסט Dana במשתנה בשם name?', 'name = "Dana"', ['"Dana" = name', 'name == "Dana"', 'name = Dana'], 'המשתנה כתוב משמאל והערך מימין. בלי מירכאות, Dana ייקרא כשם של משתנה אחר, והסימן == רק משווה בין שני ערכים.']],
    ],
    n: [
      [7, ["In Python 3, after  x = 5 , then  y = x + 2 , then  x = 10 , what is the value of y?", "", "y = x + 2 was worked out when x was 5, so y holds 7. Changing x afterwards does not change y."], ["ב־Python 3, אחרי  x = 5 , ואז  y = x + 2 , ואז  x = 10 , מה הערך של y?", "", "הביטוי y = x + 2 חושב כשהערך של x היה 5, ולכן y שומר 7. שינוי של x אחר כך לא משנה את y."]],
    ],
  },
  i: {
    t: [
      ["Integer (int)", "a whole number with no decimal part, such as 12, 0 or −3", "מספר שלם (int)", "מספר בלי חלק עשרוני, כמו 12, 0 או −3"],
      ["Float", "a number written with a decimal point, such as 2.5 or 0.75", "מספר ממשי (float)", "מספר שנכתב עם נקודה עשרונית, כמו 2.5 או 0.75"],
      ["String (str)", 'text written between quotes, such as "hello" or "42"', "מחרוזת (str)", 'טקסט שנכתב בין מירכאות, כמו "hello" או "42"'],
      ["Boolean (bool)", "the type of a value that tells whether something holds, such as the result of comparing two numbers", "ערך בוליאני (bool)", "הסוג של ערך שאומר אם משהו מתקיים, כמו התוצאה של השוואה בין שני מספרים"],
    ],
    q: [
      [["In Python 3, what is the type of the value 3.0?", "float", ["int", "str", "bool"], "The decimal point makes it a float, even though 3.0 is equal to the whole number 3."],
        ["ב־Python 3, מה הסוג של הערך 3.0?", "float", ["int", "str", "bool"], "הנקודה העשרונית הופכת אותו ל־float, אף על פי ש־3.0 שווה למספר השלם 3."]],
      [['In Python 3, what does  print("3" + "4")  show?', "34", ["7", "3 + 4", "an error"], 'With quotes these are strings, and + joins strings: "3" + "4" is "34". Without quotes, 3 + 4 is 7.'],
        ['מה מציג  print("3" + "4")  ב־Python 3?', "34", ["7", "3 + 4", "שגיאה"], 'עם מירכאות אלה מחרוזות, ו־+ מחבר מחרוזות: "3" + "4" הוא "34". בלי מירכאות, 3 + 4 הוא 7.']],
      [['In Python 3, what does  print(int("5") + 2)  show?', "7", ["52", "an error", "2"], 'int() turns the string "5" into the number 5, so 5 + 2 = 7.'],
        ['מה מציג  print(int("5") + 2)  ב־Python 3?', "7", ["52", "שגיאה", "2"], 'int() הופך את המחרוזת "5" למספר 5, ולכן 5 + 2 = 7.']],
      [["Which of these values is a Boolean in Python 3?", "True", ['"True"', "1.0", '"yes"'], 'True and False, with a capital letter and no quotes, are Booleans. "True" in quotes is a string.'],
        ["איזה מהערכים הבאים הוא ערך בוליאני ב־Python 3?", "True", ['"True"', "1.0", '"yes"'], 'True ו־False, באות גדולה ובלי מירכאות, הם ערכים בוליאניים. "True" בתוך מירכאות הוא מחרוזת.']],
    ],
  },
  a: {
    t: [
      ["Type conversion", 'changing a value from one kind to another, as int("12") gives the number 12', "המרת טיפוס", 'הפיכת ערך מסוג אחד לסוג אחר, כמו int("12") שנותן את המספר 12'],
      ["Constant", "a value that is not meant to change; Python programmers write its name in capitals, like MAX_SPEED", "קבוע", "ערך שלא אמור להשתנות; מתכנתי Python כותבים את שמו באותיות גדולות, כמו MAX_SPEED"],
      ["Integer division", "dividing and dropping the remainder; in Python 7 // 2 gives 3", "חילוק בשלמים", "חלוקה שמשליכה את השארית; ב־Python הביטוי 7 // 2 נותן 3"],
      ["Modulo", "the remainder left after dividing; in Python 7 % 2 gives 1", "מודולו (שארית)", "מה שנשאר אחרי חלוקה; ב־Python הביטוי 7 % 2 נותן 1"],
    ],
    q: [
      [["In Python 3, what does  print(7 / 2)  show?", "3.5", ["3", "3.0", "1"], "In Python 3, / always gives a float: 7 / 2 is 3.5. Use // for the whole part (3) and % for the remainder (1)."],
        ["מה מציג  print(7 / 2)  ב־Python 3?", "3.5", ["3", "3.0", "1"], "ב־Python 3 הסימן / תמיד נותן float: 7 / 2 הוא 3.5. בשביל החלק השלם (3) משתמשים ב־//, ובשביל השארית (1) ב־%."]],
      [["In Python 3, what type is the result of  3 == 3 ?", "bool", ["int", "str", "float"], "A comparison gives True or False (here True), and those are bool values."],
        ["ב־Python 3, מה הסוג של התוצאה של  3 == 3 ?", "bool", ["int", "str", "float"], "השוואה נותנת True או False (כאן True), ואלה ערכים מסוג bool."]],
      [['In Python 3, what happens when you run  print("Age: " + 12) ?', "A TypeError: a str and an int cannot be joined with +", ["It prints Age: 12, because Python turns the number into text", "It prints Age: 0, because the number is ignored", "It prints nothing, because print only shows numbers"], 'Python will not mix str and int with +. Writing "Age: " + str(12) prints Age: 12.'],
        ['מה קורה ב־Python 3 כשמריצים  print("Age: " + 12) ?', "שגיאת TypeError: אי אפשר לחבר str ו־int עם +", ["מודפס Age: 12, כי Python הופך את המספר לטקסט", "מודפס Age: 0, כי המספר מתעלמים ממנו", "לא מודפס כלום, כי print מציג רק מספרים"], 'Python לא מערבב str ו־int עם +. הקוד "Age: " + str(12) ידפיס Age: 12.']],
    ],
    n: [
      [1, ["In Python 3, what does  print(17 % 4)  show?", "", "17 = 4 × 4 + 1, so the remainder 17 % 4 is 1."], ["מה מציג  print(17 % 4)  ב־Python 3?", "", "17 = 4 × 4 + 1, ולכן השארית 17 % 4 היא 1."]],
      [6, ["In Python 3, after  a = 20 // 3 , what is a?", "", "20 ÷ 3 is 6 with a remainder of 2; // keeps only the whole part, 6."], ["ב־Python 3, אחרי  a = 20 // 3 , מה הערך של a?", "", "20 ÷ 3 הוא 6 עם שארית 2; הסימן // שומר רק את החלק השלם, 6."]],
    ],
  },
};
export default c;
