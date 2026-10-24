import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Dictionary", "a Python collection that stores pairs of keys and values inside { }", "מילון", "אוסף ב־Python ששומר זוגות של מפתחות וערכים בתוך { }"],
      ["Key", "the name used to look up a stored piece of data, like \"age\"", "מפתח", "השם שבעזרתו מחפשים פיסת מידע שמורה, כמו \"age\""],
      ["Value", "the data stored under a name in a dictionary, like 12 in {\"age\": 12}", "ערך", "המידע שנשמר תחת שם במילון, כמו 12 ב־{\"age\": 12}"],
      ["Key–value pair", "one entry: a lookup name together with its data, like \"age\": 12", "זוג מפתח־ערך", "רשומה אחת: שם לחיפוש יחד עם המידע שלו, כמו \"age\": 12"],
    ],
    q: [
      [['In Python 3,  pet = {"name": "Rex", "age": 3} . What is pet["name"]?', "Rex", ["name", "3", "age"], 'The key "name" is used to look up its value, "Rex".'],
        ['ב־Python 3,  pet = {"name": "Rex", "age": 3} . מה הערך של pet["name"]?', "Rex", ["name", "3", "age"], 'בעזרת המפתח "name" מוצאים את הערך שלו, "Rex".']],
      [["Why is a dictionary a good choice for a phone book in a program?", "You can look up a number by a person's name instead of by position", ["Dictionaries always sort themselves by name", "Lists cannot store text", "Dictionaries can only hold numbers"], "A dictionary finds a value by its key, so phone_book[\"Dana\"] gives Dana's number directly."],
        ["למה מילון מתאים לספר טלפונים בתוכנית?", "אפשר למצוא מספר לפי השם של האדם ולא לפי מקום", ["מילונים תמיד ממיינים את עצמם לפי שם", "רשימות לא יכולות לשמור טקסט", "מילונים יכולים להחזיק רק מספרים"], "מילון מוצא ערך לפי המפתח שלו, ולכן phone_book[\"Dana\"] נותן ישר את המספר של Dana."]],
      [["In Python 3, which of these makes an empty dictionary?", "{}", ["[]", "()", '""'], 'Curly brackets with nothing inside make an empty dictionary. [] is an empty list, () is an empty tuple and "" is an empty string.'],
        ["ב־Python 3, איזה מאלה יוצר מילון ריק?", "{}", ["[]", "()", '""'], 'סוגריים מסולסלים בלי שום דבר בתוכם יוצרים מילון ריק. [] היא רשימה ריקה, () היא tuple ריק ו־"" היא מחרוזת ריקה.']],
      [["How is one pair written inside a dictionary?", "key: value, with a colon between them", ["key = value, with an equals sign between them", "value: key, with the value written first", "key; value, with a semicolon between them"], 'A pair is written key: value, for example "age": 12. The pairs are separated by commas inside the curly brackets.'],
        ["איך כותבים זוג אחד בתוך מילון?", "מפתח: ערך, עם נקודתיים ביניהם", ["מפתח = ערך, עם סימן שווה ביניהם", "ערך: מפתח, כשהערך נכתב ראשון", "מפתח; ערך, עם נקודה־פסיק ביניהם"], 'זוג נכתב מפתח: ערך, למשל "age": 12. את הזוגות מפרידים בפסיקים בתוך הסוגריים המסולסלים.']],
    ],
    n: [
      [3, ['In Python 3, what is  len({"a": 1, "b": 2, "c": 3}) ?', "", "len of a dictionary counts its key–value pairs: 3."], ['ב־Python 3, מה הערך של  len({"a": 1, "b": 2, "c": 3}) ?', "", "len של מילון סופר את זוגות המפתח־ערך שבו: 3."]],
      [75, ['In Python 3,  scores = {"Noa": 90, "Tom": 75} . What is  scores["Tom"] ?', "", 'The key "Tom" is looked up, and the value stored under it is 75. Looking up "Noa" would give 90.'],
        ['ב־Python 3,  scores = {"Noa": 90, "Tom": 75} . מה הערך של  scores["Tom"] ?', "", 'מחפשים את המפתח "Tom", והערך ששמור תחתיו הוא 75. חיפוש של "Noa" היה נותן 90.']],
    ],
  },
  i: {
    t: [
      ["KeyError", "the error Python raises when you look up a name that is not in the dictionary", "KeyError", "השגיאה ש־Python מעלה כשמחפשים מפתח שאין במילון"],
      ["get()", "a dictionary method that gives a default instead of an error when the key is missing", "get()", "שיטה של מילון שנותנת ברירת מחדל במקום שגיאה כשהמפתח חסר"],
      ["items()", "a dictionary method that gives every key together with its value, handy in a for loop", "items()", "שיטה של מילון שנותנת כל מפתח יחד עם הערך שלו, נוח ללולאת for"],
      ["Membership test", "checking with the in operator whether a key exists, which gives True or False", "בדיקת שייכות", "בדיקה עם האופרטור in אם מפתח קיים, שנותנת True או False"],
    ],
    q: [
      [['In Python 3,  ages = {"Noa": 12}  and then  ages["Noa"] = 13 . What is ages now?', "{'Noa': 13}", ["{'Noa': 12, 'Noa': 13}", "{'Noa': 12}", "{'Noa': 25}"], "Keys are unique: assigning to an existing key replaces its value instead of adding a second entry."],
        ['ב־Python 3,  ages = {"Noa": 12}  ואז  ages["Noa"] = 13 . מה יש עכשיו ב־ages?', "{'Noa': 13}", ["{'Noa': 12, 'Noa': 13}", "{'Noa': 12}", "{'Noa': 25}"], "מפתחות הם ייחודיים: השמה למפתח שכבר קיים מחליפה את הערך שלו ולא מוסיפה רשומה שנייה."]],
      [['In Python 3,  d = {"a": 1} . What does  d.get("b", 0)  give?', "0", ["1", "None", "a KeyError"], 'The key "b" is missing, so get returns the default given as its second argument, 0.'],
        ['ב־Python 3,  d = {"a": 1} . מה נותן  d.get("b", 0) ?', "0", ["1", "None", "שגיאת KeyError"], 'המפתח "b" חסר, ולכן get מחזיר את ברירת המחדל שניתנה כארגומנט השני, 0.']],
      [['In Python 3,  d = {"a": 1} . What does  d["b"]  give?', "A KeyError", ["0", "None", "1"], 'Square brackets need the key to exist; "b" is not in d. Use d.get("b") or check "b" in d first.'],
        ['ב־Python 3,  d = {"a": 1} . מה נותן  d["b"] ?', "שגיאת KeyError", ["0", "None", "1"], 'סוגריים מרובעים דורשים שהמפתח יהיה קיים, ו־"b" לא נמצא ב־d. אפשר להשתמש ב־d.get("b") או לבדוק קודם "b" in d.']],
      [['In Python 3,  ages = {"Noa": 12} . What does  "Noa" in ages  give?', "True", ["12", "False", "A KeyError"], 'The in operator checks whether a key exists, and "Noa" is a key of ages, so the answer is True. It never raises a KeyError.'],
        ['ב־Python 3,  ages = {"Noa": 12} . מה נותן  "Noa" in ages ?', "True", ["12", "False", "שגיאת KeyError"], 'האופרטור in בודק אם מפתח קיים, ו־"Noa" הוא מפתח של ages, ולכן התשובה True. הוא אף פעם לא מעלה שגיאת KeyError.']],
      [['In Python 3,  ages = {"Noa": 12} . What does  12 in ages  give?', "False, because in looks only at the keys", ["True, because 12 is stored in the dictionary", "12, the value that was found", "A KeyError, because 12 is not a key"], "For a dictionary, in checks the keys, not the values. 12 is a value, so 12 in ages is False. To look at the values, use 12 in ages.values()."],
        ['ב־Python 3,  ages = {"Noa": 12} . מה נותן  12 in ages ?', "False, כי in בודק רק את המפתחות", ["True, כי 12 שמור במילון", "12, הערך שנמצא", "שגיאת KeyError, כי 12 הוא לא מפתח"], "במילון in בודק את המפתחות ולא את הערכים. 12 הוא ערך, ולכן 12 in ages הוא False. כדי לבדוק את הערכים משתמשים ב־12 in ages.values()."]],
      [['In Python 3,  ages = {"Noa": 12, "Tom": 11} , then  for name, age in ages.items(): print(age) . What is printed?', "12, then 11", ["Noa, then Tom", "Noa 12, then Tom 11", "Nothing: .items() cannot be used in a loop"], ".items() gives each key together with its value. The loop calls them name and age, and print(age) shows only the values, in the order they were added: 12 and then 11."],
        ['ב־Python 3,  ages = {"Noa": 12, "Tom": 11} , ואחר כך  for name, age in ages.items(): print(age) . מה מודפס?', "12 ואחריו 11", ["Noa ואחריו Tom", "Noa 12 ואחריו Tom 11", "כלום: אי אפשר להשתמש ב־.items() בלולאה"], ".items() נותנת כל מפתח יחד עם הערך שלו. הלולאה קוראת להם name ו־age, וההדפסה print(age) מציגה רק את הערכים, לפי הסדר שבו נוספו: 12 ואחריו 11."]],
      [['In Python 3,  ages = {"Noa": 12, "Tom": 11}  and then  del ages["Noa"] . What is ages now?', "{'Tom': 11}", ["{'Noa': 12}", "{'Noa': 12, 'Tom': 11}", "{}"], 'del removes a key together with its value, so only "Tom" is left. The other pairs stay.'],
        ['ב־Python 3,  ages = {"Noa": 12, "Tom": 11}  ואז  del ages["Noa"] . מה יש עכשיו ב־ages?', "{'Tom': 11}", ["{'Noa': 12}", "{'Noa': 12, 'Tom': 11}", "{}"], 'del מוחקת מפתח יחד עם הערך שלו, ולכן נשאר רק "Tom". שאר הזוגות נשארים.']],
    ],
    n: [
      [2, ['In Python 3,  ages = {"Noa": 12}  and then  ages["Tom"] = 11 . What is len(ages)?', "", 'Assigning to a new key adds a pair, so ages now has 2 pairs: "Noa" and "Tom".'], ['ב־Python 3,  ages = {"Noa": 12}  ואז  ages["Tom"] = 11 . מה הערך של len(ages)?', "", 'השמה למפתח חדש מוסיפה זוג, ולכן עכשיו יש ב־ages 2 זוגות: "Noa" ו־"Tom".']],
      [3, ['In Python 3, the program runs  d = {"a": 1, "b": 2} , then  d["c"] = 3 , then  d["a"] = 10 . What is len(d)?', "", 'The first line makes 2 pairs. "c" is a new key, so it adds a pair and there are 3; "a" already exists, so its value is only replaced. len(d) is 3.'],
        ['ב־Python 3, התוכנית מריצה  d = {"a": 1, "b": 2} , אחר כך  d["c"] = 3 , ואחר כך  d["a"] = 10 . מה הערך של len(d)?', "", 'השורה הראשונה יוצרת 2 זוגות. "c" הוא מפתח חדש, ולכן נוסף זוג ויש 3; "a" כבר קיים, ולכן רק הערך שלו מוחלף. len(d) הוא 3.']],
    ],
  },
  a: {
    t: [
      ["Hashable", "able to be used as a dictionary key because the value cannot change, like a string, a number or a tuple", "ניתן לגיבוב (hashable)", "מתאים לשמש כמפתח במילון כי הערך שלו לא יכול להשתנות, כמו מחרוזת, מספר או tuple"],
      ["Nested dictionary", "a dictionary whose values are themselves dictionaries", "מילון מקונן", "מילון שהערכים שלו הם בעצמם מילונים"],
      ["JSON", "a text format for key–value data, shaped like Python dictionaries and lists, used to send data between programs", "JSON", "תבנית טקסט לנתוני מפתח־ערך, שנראית כמו מילונים ורשימות של Python ומשמשת להעברת נתונים בין תוכניות"],
      ["Lookup", "finding a value by its key; in a dictionary this stays fast even with millions of entries", "חיפוש לפי מפתח", "מציאת ערך בעזרת המפתח שלו; במילון זה נשאר מהיר גם כשיש מיליוני רשומות"],
    ],
    q: [
      [['In Python 3, the program runs  for k in scores: print(k)  with  scores = {"Noa": 90, "Tom": 75} . What is printed?', "Noa and Tom (the keys)", ["90 and 75 (the values)", "The pairs Noa 90 and Tom 75", "Nothing"], "Looping over a dictionary goes over its keys, in the order they were added. Use .values() or .items() for the rest."],
        ['ב־Python 3, התוכנית מריצה  for k in scores: print(k)  כאשר  scores = {"Noa": 90, "Tom": 75} . מה מודפס?', "Noa ו־Tom (המפתחות)", ["90 ו־75 (הערכים)", "הזוגות Noa 90 ו־Tom 75", "כלום"], "לולאה על מילון עוברת על המפתחות שלו, לפי הסדר שבו נוספו. בשביל השאר משתמשים ב־.values() או ב־.items()."]],
      [['In Python 3, why does  d = {[1, 2]: "a"}  fail?', "A list cannot be a key because it can change (TypeError: unhashable type)", ["Keys must always be strings", "A dictionary cannot hold the letter a", "The braces should be square brackets"], "Keys must be hashable. Numbers, strings and tuples work as keys; lists and dictionaries do not."],
        ['ב־Python 3, למה  d = {[1, 2]: "a"}  נכשל?', "רשימה לא יכולה להיות מפתח כי אפשר לשנות אותה (TypeError: unhashable type)", ["מפתחות חייבים להיות תמיד מחרוזות", "מילון לא יכול להחזיק את האות a", "במקום סוגריים מסולסלים צריך סוגריים מרובעים"], "מפתחות חייבים להיות ניתנים לגיבוב. מספרים, מחרוזות ו־tuple מתאימים כמפתחות; רשימות ומילונים לא."]],
      [['In Python 3,  user = {"name": "Dana", "pet": {"type": "dog"}} . What is user["pet"]["type"]?', "dog", ["pet", "type", "Dana"], 'user["pet"] is the inner dictionary {"type": "dog"}, and its "type" key holds "dog".'],
        ['ב־Python 3,  user = {"name": "Dana", "pet": {"type": "dog"}} . מה הערך של user["pet"]["type"]?', "dog", ["pet", "type", "Dana"], 'user["pet"] הוא המילון הפנימי {"type": "dog"}, ובמפתח "type" שלו נמצא "dog".']],
      [['In Python 3,  d = {"a": 1}  and then  print(d.get("b")) . What is printed?', "None", ["0", "b", "A KeyError"], "get does not raise an error for a missing key. Without a second argument it gives None, Python's value for \"nothing here\"."],
        ['ב־Python 3,  d = {"a": 1}  ואז  print(d.get("b")) . מה מודפס?', "None", ["0", "b", "שגיאת KeyError"], 'get לא מעלה שגיאה כשמפתח חסר. בלי ארגומנט שני היא נותנת None, הערך של Python שפירושו ״אין כאן כלום״.']],
      [["In Python 3, what does the loop  for w in words: counts[w] = counts.get(w, 0) + 1  build, when it starts from  counts = {} ?", "How many times each word appears in words", ["A list of the words without repeats", "The length of each word", "Only the first word that appears twice"], "For a new word, get gives 0, so its count becomes 1. For a word seen before, get gives its current count and one is added."],
        ["ב־Python 3, מה בונה הלולאה  for w in words: counts[w] = counts.get(w, 0) + 1  כשמתחילים מ־ counts = {} ?", "כמה פעמים כל מילה מופיעה ב־words", ["רשימה של המילים בלי חזרות", "האורך של כל מילה", "רק את המילה הראשונה שמופיעה פעמיים"], "עבור מילה חדשה get נותנת 0, ולכן הספירה שלה הופכת ל־1. עבור מילה שכבר נראתה get נותנת את הספירה הנוכחית, ומוסיפים לה אחד."]],
      [["Which of these is valid JSON?", '{"name": "Dana", "age": 12}', ["{'name': 'Dana', 'age': 12}", '{name: "Dana", age: 12}', '{"name": "Dana", "age": 12,}'], "JSON needs double quotes around every key and every text, and no comma after the last pair. The others use single quotes, keys without quotes, or a comma at the end."],
        ["איזה מאלה הוא JSON תקין?", '{"name": "Dana", "age": 12}', ["{'name': 'Dana', 'age': 12}", '{name: "Dana", age: 12}', '{"name": "Dana", "age": 12,}'], "ב־JSON חייבים מירכאות כפולות סביב כל מפתח וכל טקסט, ואסור פסיק אחרי הזוג האחרון. האחרים משתמשים במירכאות בודדות, במפתחות בלי מירכאות או בפסיק בסוף."]],
      [['In Python 3,  d = {"a": 1} , then  e = d , then  e["a"] = 5 . What is d["a"]?', "5, because d and e share one dictionary", ["1, because e is a separate copy of d", "6, because the new value is added to the old one", "A KeyError, because e has no key named a"], "Writing e = d does not copy the dictionary: both names point to the same one, so a change made through e shows through d. d.copy() makes a real copy."],
        ['ב־Python 3,  d = {"a": 1} , אחר כך  e = d , ואחר כך  e["a"] = 5 . מה הערך של d["a"]?', "5, כי d ו־e חולקים מילון אחד", ["1, כי e הוא עותק נפרד של d", "6, כי הערך החדש מתווסף לערך הישן", "שגיאת KeyError, כי אין ל־e מפתח בשם a"], "הכתיבה e = d לא מעתיקה את המילון: שני השמות מצביעים על אותו מילון, ולכן שינוי שנעשה דרך e נראה גם דרך d. הפעולה d.copy() יוצרת עותק אמיתי."]],
    ],
    n: [
      [3, ['In Python 3,  d = {"a": 1, "b": 2}  and then  d["a"] = d["a"] + d["b"] . What is d["a"]?', "", 'The right side is worked out first: 1 + 2 = 3, and that is stored under "a".'], ['ב־Python 3,  d = {"a": 1, "b": 2}  ואז  d["a"] = d["a"] + d["b"] . מה הערך של d["a"]?', "", 'קודם מחושב הצד הימני: 1 + 2 = 3, והתוצאה נשמרת תחת "a".']],
      [4, ["A Python 3 dictionary has 5 keys. The program adds 1 new key and deletes 2 of the existing keys. What is len() of it now?", "", "Start with 5 pairs: adding a new key makes 6, and deleting two keys leaves 4."],
        ["במילון של Python 3 יש 5 מפתחות. התוכנית מוסיפה מפתח חדש אחד ומוחקת 2 מהמפתחות הקיימים. מה ה־len() שלו עכשיו?", "", "מתחילים עם 5 זוגות: הוספת מפתח חדש נותנת 6, ומחיקת שני מפתחות משאירה 4."]],
    ],
  },
};
export default c;
