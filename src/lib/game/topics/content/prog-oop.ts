import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Object", "a thing in a program that holds its own data and can carry out actions", "עצם (אובייקט)", "דבר בתוכנית שמחזיק נתונים משלו ויכול לבצע פעולות"],
      ["Class", "a blueprint that describes what things of one kind have and can do", "מחלקה", "תבנית שמתארת מה יש לדברים מסוג אחד ומה הם יכולים לעשות"],
      ["Attribute", "a piece of data that belongs to an object, like a dog's name or age", "תכונה", "נתון ששייך לעצם, כמו השם או הגיל של כלב"],
      ["Method", "an action an object can do: a function that belongs to a class", "שיטה (מתודה)", "פעולה שעצם יכול לבצע: פונקציה ששייכת למחלקה"],
    ],
    q: [
      [["If Dog is a class, what is one particular dog named Rex that is made from it?", "An object", ["A method", "An attribute", "A loop"], "The class is the blueprint; each dog made from it, like Rex, is an object."],
        ["אם Dog היא מחלקה, מה הוא כלב מסוים בשם Rex שנוצר ממנה?", "עצם", ["שיטה", "תכונה", "לולאה"], "המחלקה היא התבנית; כל כלב שנוצר ממנה, כמו Rex, הוא עצם."]],
      [["Every object of the class Car has a color and a speed. What are color and speed?", "Attributes", ["Methods", "Objects", "Classes"], "They are data stored in each car, so they are attributes."],
        ["לכל עצם של המחלקה Car יש color ו־speed. מה הם color ו־speed?", "תכונות", ["שיטות", "עצמים", "מחלקות"], "אלה נתונים שנשמרים בכל מכונית, ולכן הם תכונות."]],
      [["A Car object can drive() and honk(). What are drive and honk?", "Methods", ["Attributes", "Objects", "Lists"], "They are actions, written as functions inside the class, so they are methods."],
        ["עצם מסוג Car יכול לבצע drive() ו־honk(). מה הם drive ו־honk?", "שיטות", ["תכונות", "עצמים", "רשימות"], "אלה פעולות שנכתבות כפונקציות בתוך המחלקה, ולכן הן שיטות."]],
    ],
  },
  i: {
    t: [
      ["Constructor (__init__)", "the special method that runs when a new object is created and sets up its attributes", "בנאי (__init__)", "השיטה המיוחדת שרצה כשנוצר עצם חדש וקובעת את התכונות שלו"],
      ["self", "the name a method uses for the object it is working on", "self", "השם ששיטה משתמשת בו בשביל העצם שהיא פועלת עליו"],
      ["Instance", "one particular object made from a class, as Rex is made from Dog", "מופע", "עצם מסוים אחד שנוצר ממחלקה, כמו Rex שנוצר מ־Dog"],
      ["Dot notation", "writing a dot after an object to reach its attribute or method, like rex.name or rex.bark()", "סימון נקודה", "כתיבת נקודה אחרי עצם כדי להגיע לתכונה או לשיטה שלו, כמו rex.name או rex.bark()"],
    ],
    q: [
      [['In Python 3, class Dog has  def __init__(self, name): self.name = name . After  d = Dog("Rex") , what is d.name?', "Rex", ["name", "Dog", "self"], '__init__ runs when the object is created and stores "Rex" in the attribute name of that object.'],
        ['ב־Python 3, למחלקה Dog יש  def __init__(self, name): self.name = name . אחרי  d = Dog("Rex") , מה הערך של d.name?', "Rex", ["name", "Dog", "self"], '__init__ רץ כשהעצם נוצר ושומר את "Rex" בתכונה name של העצם הזה.']],
      [["In a Python 3 method, what does self refer to?", "The object the method was called on", ["The class itself, always", "The first attribute of the class", "The whole program"], "In rex.bark(), Python passes rex as self, so self.name is rex's own name."],
        ["בשיטה ב־Python 3, למה מתייחס self?", "לעצם שעליו נקראה השיטה", ["תמיד למחלקה עצמה", "לתכונה הראשונה של המחלקה", "לכל התוכנית"], "ב־rex.bark() Python מעביר את rex בתור self, ולכן self.name הוא השם של rex עצמו."]],
      [["When does __init__ run in Python 3?", "Automatically, each time a new object is created", ["Only when you call d.__init__() yourself", "Once, when the class is defined", "When the program ends"], "Writing Dog(\"Rex\") creates the object and calls __init__ on it at once."],
        ["מתי רץ __init__ ב־Python 3?", "אוטומטית, בכל פעם שנוצר עצם חדש", ["רק כשקוראים בעצמנו ל־d.__init__()", "פעם אחת, כשהמחלקה מוגדרת", "כשהתוכנית מסתיימת"], "הכתיבה Dog(\"Rex\") יוצרת את העצם ומיד קוראת עליו ל־__init__."]],
    ],
    n: [
      [2, ['In Python 3, how many Dog objects exist after  a = Dog("Rex")  and  b = Dog("Bo") ?', "", "Each call Dog(...) creates a new object, so there are 2 separate dogs, each with its own name."], ['ב־Python 3, כמה עצמים מסוג Dog קיימים אחרי  a = Dog("Rex")  וגם  b = Dog("Bo") ?', "", "כל קריאה ל־Dog(...) יוצרת עצם חדש, ולכן יש 2 כלבים נפרדים, לכל אחד שם משלו."]],
    ],
  },
  a: {
    t: [
      ["Inheritance", "a class taking the attributes and methods of another class and adding its own", "ירושה", "מחלקה שמקבלת את התכונות והשיטות של מחלקה אחרת ומוסיפה משלה"],
      ["Subclass", "a class that inherits from another, written in Python as class Puppy(Dog):", "מחלקה יורשת", "מחלקה שיורשת ממחלקה אחרת; ב־Python כותבים class Puppy(Dog):"],
      ["Overriding", "a subclass giving its own version of a method it inherited", "דריסה (override)", "מחלקה יורשת שנותנת גרסה משלה לשיטה שקיבלה בירושה"],
      ["Encapsulation", "keeping an object's data together with its methods and hiding the inner details behind them", "כימוס", "שמירת הנתונים של עצם יחד עם השיטות שלו והסתרת הפרטים הפנימיים מאחוריהן"],
    ],
    q: [
      [['In Python 3, class Animal has  def sound(self): return "noise" , and  class Cat(Animal):  has  def sound(self): return "meow" . What does Cat().sound() return?', "meow", ["noise", "noise meow", "an error"], "Cat overrides sound, so its own version is used instead of the one it inherited from Animal."],
        ['ב־Python 3, למחלקה Animal יש  def sound(self): return "noise" , ולמחלקה  class Cat(Animal):  יש  def sound(self): return "meow" . מה מחזיר Cat().sound()?', "meow", ["noise", "noise meow", "שגיאה"], "Cat דורסת את sound, ולכן משתמשים בגרסה שלה ולא בזו שירשה מ־Animal."]],
      [['In Python 3, class Bird has  def fly(self): return "flap" , and  class Duck(Bird): pass . What does Duck().fly() return?', "flap", ["an AttributeError", "None", "pass"], "Duck defines nothing of its own, but it inherits fly from Bird."],
        ['ב־Python 3, למחלקה Bird יש  def fly(self): return "flap" , והמחלקה  class Duck(Bird): pass . מה מחזיר Duck().fly()?', "flap", ["שגיאת AttributeError", "None", "pass"], "Duck לא מגדירה שום דבר משלה, אבל היא יורשת את fly מ־Bird."]],
      [["Why is inheritance useful?", "Shared code is written once in a parent class and reused by its subclasses", ["It makes every class run faster", "It copies objects to other computers", "It deletes duplicate objects"], "Common attributes and methods live in one place, and each subclass adds or changes only what is different."],
        ["למה ירושה שימושית?", "קוד משותף נכתב פעם אחת במחלקת האב, והמחלקות היורשות משתמשות בו שוב", ["היא גורמת לכל מחלקה לרוץ מהר יותר", "היא מעתיקה עצמים למחשבים אחרים", "היא מוחקת עצמים כפולים"], "תכונות ושיטות משותפות נמצאות במקום אחד, וכל מחלקה יורשת מוסיפה או משנה רק את מה ששונה."]],
    ],
    n: [
      [3, ["In Python 3, class Counter has  def __init__(self): self.n = 0  and  def add(self): self.n += 1 . After  c = Counter()  and three calls to c.add(), what is c.n?", "", "__init__ sets n to 0, and each call to add raises it by 1: 0 + 1 + 1 + 1 = 3."], ["ב־Python 3, למחלקה Counter יש  def __init__(self): self.n = 0  וגם  def add(self): self.n += 1 . אחרי  c = Counter()  ושלוש קריאות ל־c.add(), מה הערך של c.n?", "", "__init__ קובע את n ל־0, וכל קריאה ל־add מגדילה אותו ב־1: 0 + 1 + 1 + 1 = 3."]],
    ],
  },
};
export default c;
