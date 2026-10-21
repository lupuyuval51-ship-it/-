import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["String", "a piece of text in a program, written between quotes", "מחרוזת", "קטע טקסט בתוכנית, שנכתב בין מירכאות"],
      ["Character", "one letter, digit, space or symbol in a piece of text", "תו", "אות, ספרה, רווח או סימן אחד בטקסט"],
      ["Concatenation", "joining pieces of text end to end with +", "שרשור", "חיבור של קטעי טקסט זה לסוף זה בעזרת +"],
      ["Quotes", "the marks that show where a piece of text starts and ends: ' or \"", "מירכאות", "הסימנים שמראים איפה קטע טקסט מתחיל ואיפה הוא נגמר: ' או \""],
    ],
    q: [
      [['In Python 3, what does  print("sun" + "flower")  show?', "sunflower", ["sun flower", "sun + flower", "an error"], "+ joins the two strings exactly as they are; it adds no space between them."],
        ['מה מציג  print("sun" + "flower")  ב־Python 3?', "sunflower", ["sun flower", "sun + flower", "שגיאה"], "+ מחבר את שתי המחרוזות בדיוק כמו שהן; הוא לא מוסיף רווח ביניהן."]],
      [["In Python 3, which of these values is a string?", '"42"', ["42", "4.2", "True"], 'The quotes make "42" text. 42 is an int, 4.2 is a float and True is a bool.'],
        ["ב־Python 3, איזה מהערכים הבאים הוא מחרוזת?", '"42"', ["42", "4.2", "True"], 'המירכאות הופכות את "42" לטקסט. 42 הוא int, 4.2 הוא float ו־True הוא bool.']],
      [['In Python 3, what does  print("ha" * 3)  show?', "hahaha", ["ha3", "ha ha ha", "an error"], "A string times a whole number repeats the string that many times, with nothing between the copies."],
        ['מה מציג  print("ha" * 3)  ב־Python 3?', "hahaha", ["ha3", "ha ha ha", "שגיאה"], "מחרוזת כפול מספר שלם חוזרת על עצמה מספר פעמים כזה, בלי שום דבר בין העותקים."]],
    ],
    n: [
      [3, ['In Python 3, what is  len("cat") ?', "", 'len counts the characters: c, a and t make 3.'], ['ב־Python 3, מה הערך של  len("cat") ?', "", "len סופר את התווים: c, a ו־t הם 3 תווים."]],
    ],
  },
  i: {
    t: [
      ["String index", "the position of a character in a piece of text, starting from 0", "אינדקס במחרוזת", "המקום של תו בתוך טקסט, כשהספירה מתחילה מ־0"],
      ["Method", "a function that belongs to a value and is called with a dot, like name.upper()", "שיטה (method)", "פונקציה ששייכת לערך ונקראת עם נקודה, כמו name.upper()"],
      ["upper()", "a string method that gives back a copy in capital letters", "upper()", "שיטה של מחרוזת שמחזירה עותק באותיות גדולות"],
      ["Empty string", "text with no characters at all, written \"\" and of length 0", "מחרוזת ריקה", "טקסט בלי אף תו, שנכתב \"\" ואורכו 0"],
    ],
    q: [
      [['In Python 3,  word = "python" . What is word[0]?', "p", ["y", "python", "n"], "The first character is at position 0, so word[0] is p."],
        ['ב־Python 3,  word = "python" . מה הערך של word[0]?', "p", ["y", "python", "n"], "התו הראשון נמצא במקום 0, ולכן word[0] הוא p."]],
      [['In Python 3,  word = "python" . What is word[-1]?', "n", ["o", "p", "an error"], "-1 counts from the end, so word[-1] is the last character, n."],
        ['ב־Python 3,  word = "python" . מה הערך של word[-1]?', "n", ["o", "p", "שגיאה"], "-1 נספר מהסוף, ולכן word[-1] הוא התו האחרון, n."]],
      [['In Python 3, what is  "Hi" + " " + "Dana" ?', "Hi Dana", ["HiDana", "Hi + Dana", "an error"], 'The middle string " " is a space, so it ends up between the two words.'],
        ['ב־Python 3, מה הערך של  "Hi" + " " + "Dana" ?', "Hi Dana", ["HiDana", "Hi + Dana", "שגיאה"], 'המחרוזת האמצעית " " היא רווח, ולכן הוא נכנס בין שתי המילים.']],
    ],
    n: [
      [8, ['In Python 3, what is  len("hi there") ?', "", "The space counts as a character too: 2 + 1 + 5 = 8."], ['ב־Python 3, מה הערך של  len("hi there") ?', "", "גם הרווח נחשב תו, ולכן ספירת התווים היא 2 + 1 + 5 = 8."]],
      [3, ['In Python 3, what is  "banana".count("a") ?', "", "banana has the letter a three times, so count gives 3."], ['ב־Python 3, מה הערך של  "banana".count("a") ?', "", "במילה banana האות a מופיעה שלוש פעמים, ולכן count נותן 3."]],
    ],
  },
  a: {
    t: [
      ["Slicing", "taking part of a piece of text by positions, like s[0:3]", "חיתוך", "לקיחת חלק מטקסט לפי מקומות, כמו s[0:3]"],
      ["Immutable", "unable to be changed after it is created, as Python strings are", "בלתי ניתן לשינוי (immutable)", "אי אפשר לשנות אותו אחרי שנוצר, כמו מחרוזות ב־Python"],
      ["split()", "a string method that breaks text into a list of parts", "split()", "שיטה של מחרוזת שמפרקת טקסט לרשימה של חלקים"],
      ["f-string", "text with f before the quotes that fills in values written inside { }", "מחרוזת f (f-string)", "טקסט עם f לפני המירכאות, שמשבץ ערכים שנכתבו בתוך { }"],
    ],
    q: [
      [['In Python 3,  s = "planet" . What is s[1:4]?', "lan", ["plan", "lane", "pla"], "Positions 1, 2 and 3 are l, a and n; the slice stops before position 4."],
        ['ב־Python 3,  s = "planet" . מה הערך של s[1:4]?', "lan", ["plan", "lane", "pla"], "במקומות 1, 2 ו־3 נמצאים l, a ו־n; החיתוך נעצר לפני מקום 4."]],
      [['In Python 3,  s = "cat"  and then  s[0] = "b" . What happens?', "A TypeError: a string cannot be changed in place", ['s becomes "bat"', 's becomes "b"', 's becomes "bcat"'], 'Strings are immutable. To get "bat", build a new string: s = "b" + s[1:].'],
        ['ב־Python 3,  s = "cat"  ואז  s[0] = "b" . מה קורה?', "שגיאת TypeError: אי אפשר לשנות מחרוזת במקום", ['s הופכת ל־"bat"', 's הופכת ל־"b"', 's הופכת ל־"bcat"'], 'מחרוזות אינן ניתנות לשינוי. כדי לקבל "bat" בונים מחרוזת חדשה: s = "b" + s[1:].']],
      [['In Python 3, what is  "a,b,c".split(",") ?', "['a', 'b', 'c']", ["['a,b,c']", "'abc'", "['a', ',', 'b', ',', 'c']"], "split cuts the text at every comma and gives a list of the pieces; the commas themselves are dropped."],
        ['ב־Python 3, מה הערך של  "a,b,c".split(",") ?', "['a', 'b', 'c']", ["['a,b,c']", "'abc'", "['a', ',', 'b', ',', 'c']"], "split חותך את הטקסט בכל פסיק ונותן רשימה של החלקים; הפסיקים עצמם לא נשמרים."]],
      [['In Python 3, after  n = 4 , what does  print(f"{n} cats")  show?', "4 cats", ["{n} cats", "n cats", "f4 cats"], "In an f-string, {n} is replaced by the value of n; the f itself is not printed."],
        ['ב־Python 3, אחרי  n = 4 , מה מציג  print(f"{n} cats") ?', "4 cats", ["{n} cats", "n cats", "f4 cats"], "ב־f-string הביטוי {n} מוחלף בערך של n; האות f עצמה לא מודפסת."]],
    ],
  },
};
export default c;
