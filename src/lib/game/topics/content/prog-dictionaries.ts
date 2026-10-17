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
    ],
    n: [
      [3, ['In Python 3, what is  len({"a": 1, "b": 2, "c": 3}) ?', "", "len of a dictionary counts its key–value pairs: 3."], ['ב־Python 3, מה הערך של  len({"a": 1, "b": 2, "c": 3}) ?', "", "len של מילון סופר את זוגות המפתח־ערך שבו: 3."]],
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
    ],
    n: [
      [2, ['In Python 3,  ages = {"Noa": 12}  and then  ages["Tom"] = 11 . What is len(ages)?', "", 'Assigning to a new key adds a pair, so ages now has 2 pairs: "Noa" and "Tom".'], ['ב־Python 3,  ages = {"Noa": 12}  ואז  ages["Tom"] = 11 . מה הערך של len(ages)?', "", 'השמה למפתח חדש מוסיפה זוג, ולכן עכשיו יש ב־ages 2 זוגות: "Noa" ו־"Tom".']],
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
    ],
    n: [
      [3, ['In Python 3,  d = {"a": 1, "b": 2}  and then  d["a"] = d["a"] + d["b"] . What is d["a"]?', "", 'The right side is worked out first: 1 + 2 = 3, and that is stored under "a".'], ['ב־Python 3,  d = {"a": 1, "b": 2}  ואז  d["a"] = d["a"] + d["b"] . מה הערך של d["a"]?', "", 'קודם מחושב הצד הימני: 1 + 2 = 3, והתוצאה נשמרת תחת "a".']],
    ],
  },
};
export default c;
