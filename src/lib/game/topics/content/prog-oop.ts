import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Object", "a thing in a program that holds its own data and can carry out actions", "עצם (אובייקט)", "דבר בתוכנית שמחזיק נתונים משלו ויכול לבצע פעולות"],
      ["Class", "a blueprint that describes what things of one kind have and can do", "מחלקה", "תבנית שמתארת מה יש לדברים מסוג אחד ומה הם יכולים לעשות"],
      ["Attribute", "a piece of data that belongs to an object, like the title or the number of pages of a book", "תכונה", "נתון ששייך לעצם, כמו הכותרת או מספר העמודים של ספר"],
      ["Method", "an action an object can do: a function that belongs to a class", "שיטה (מתודה)", "פעולה שעצם יכול לבצע: פונקציה ששייכת למחלקה"],
    ],
    q: [
      [['In Python 3, which line makes a new dog called rex from the class Dog?', 'rex = Dog("Rex")', ['rex = new Dog("Rex")', 'Dog = rex("Rex")', "class rex(Dog)"], 'Calling the class like a function, Dog("Rex"), makes a new object, and = stores it in the variable rex. Python has no new keyword, which JavaScript and Java use, and class rex(Dog) is how a new class is started, not an object.'],
        ["ב־Python 3, איזו שורה יוצרת מהמחלקה Dog כלב חדש בשם rex?", 'rex = Dog("Rex")', ['rex = new Dog("Rex")', 'Dog = rex("Rex")', "class rex(Dog)"], 'קריאה למחלקה כמו לפונקציה, Dog("Rex"), יוצרת עצם חדש, והסימן = שומר אותו במשתנה rex. ב־Python אין מילה שמורה new, שקיימת ב־JavaScript וב־Java, ו־class rex(Dog) היא הדרך להתחיל מחלקה חדשה ולא עצם.']],
      [["Every car made from the class Car has a color and a speed. What are color and speed?", "Attributes: the data each car stores", ["Methods: the actions each car can carry out", "Classes: the blueprints that cars are made from", "Loops: the steps each car repeats as it drives"], "They are data stored in each car, so they are attributes."],
        ["לכל מכונית שנוצרת מהמחלקה Car יש color ו־speed. מה הם color ו־speed?", "תכונות: הנתונים שכל מכונית שומרת", ["שיטות: הפעולות שכל מכונית יכולה לבצע", "מחלקות: התבניות שמהן נוצרות מכוניות", "לולאות: הצעדים שכל מכונית חוזרת עליהם בנסיעה"], "אלה נתונים שנשמרים בכל מכונית, ולכן הם תכונות."]],
      [["A car made from the class Car can drive() and honk(). What are drive and honk?", "Methods", ["Attributes", "Objects", "Lists"], "They are actions, written as functions inside the class, so they are methods."],
        ["מכונית שנוצרה מהמחלקה Car יכולה לבצע drive() ו־honk(). מה הם drive ו־honk?", "שיטות", ["תכונות", "עצמים", "רשימות"], "אלה פעולות שנכתבות כפונקציות בתוך המחלקה, ולכן הן שיטות."]],
      [["A class Cat is used to make three cats: Tom, Kit and Leo. How many classes and how many objects are there?", "1 class and 3 objects", ["3 classes and 1 object", "3 classes and 3 objects", "1 class and 1 object"], "One blueprint, the class Cat, can make as many objects as you like. Tom, Kit and Leo are three separate objects made from the same class."],
        ["מחלקה בשם Cat משמשת ליצירת שלושה חתולים: Tom, Kit ו־Leo. כמה מחלקות וכמה עצמים יש כאן?", "מחלקה אחת ו־3 עצמים", ["3 מחלקות ועצם אחד", "3 מחלקות ו־3 עצמים", "מחלקה אחת ועצם אחד"], "תבנית אחת, המחלקה Cat, יכולה ליצור כמה עצמים שרוצים. Tom, Kit ו־Leo הם שלושה עצמים נפרדים שנוצרו מאותה מחלקה."]],
      [["In a game, the class Enemy makes five enemies. One enemy has health 3 and another has health 8. What does this show?", "Each enemy keeps its own health value, even though they share one class", ["The class Enemy is broken, because one class should have only one health value", "Only the first enemy keeps its own health, and the other four copy it", "The attribute health is shared by all enemies, so it changes for all of them together"], "Every object made from a class has its own copy of the attributes. The class describes which attributes exist, and each object fills in its own values."],
        ["במשחק, המחלקה Enemy יוצרת חמישה אויבים. לאחד יש בריאות 3 ולאחר יש בריאות 8. מה זה מראה?", "כל אויב שומר את ערך הבריאות שלו, למרות שכולם חולקים מחלקה אחת", ["המחלקה Enemy מקולקלת, כי למחלקה אחת צריך להיות רק ערך בריאות אחד", "רק האויב הראשון שומר בריאות משלו, ושאר הארבעה מעתיקים אותה", "התכונה בריאות משותפת לכל האויבים, ולכן היא משתנה לכולם יחד"], "לכל עצם שנוצר ממחלקה יש עותק משלו של התכונות. המחלקה מתארת אילו תכונות קיימות, וכל עצם ממלא את הערכים שלו."]],
    ],
  },
  i: {
    t: [
      ["Constructor (__init__)", "the special method that gives the attributes of an object their first values", "בנאי (__init__)", "השיטה המיוחדת שנותנת לתכונות של עצם את הערכים הראשונים שלהן"],
      ["self", "by convention, the name of the first parameter of an ordinary method in a Python class", "self", "לפי המוסכמה, השם של הפרמטר הראשון של שיטה רגילה במחלקה ב־Python"],
      ["Instance", "one particular object made from a class, as Rex is made from Dog", "מופע", "עצם מסוים אחד שנוצר ממחלקה, כמו Rex שנוצר מ־Dog"],
      ["Dot notation", "writing a dot after an object to reach its attribute or method, like rex.name or rex.bark()", "סימון נקודה", "כתיבת נקודה אחרי עצם כדי להגיע לתכונה או לשיטה שלו, כמו rex.name או rex.bark()"],
    ],
    q: [
      [['In Python 3, class Dog has  def __init__(self, name): self.name = name . After  d = Dog("Rex") , what is d.name?', "Rex", ["name", "Dog", "self"], '__init__ runs when the object is created and stores "Rex" in the attribute name of that object.'],
        ['ב־Python 3, השיטה __init__ של המחלקה Dog מקבלת name ומבצעת  self.name = name . אחרי  d = Dog("Rex") , מה הערך של d.name?', "Rex", ["name", "Dog", "self"], '__init__ רץ כשהעצם נוצר ושומר את "Rex" בתכונה name של העצם הזה.']],
      [["In a Python 3 method, what does self refer to?", "The object the method was called on", ["The class itself, whichever object the method is called on", "The first attribute of the class", "The whole program"], "In rex.bark(), Python passes rex as self, so self.name is rex's own name."],
        ["בשיטה ב־Python 3, למה מתייחס self?", "לעצם שעליו נקראה השיטה", ["תמיד למחלקה עצמה", "לתכונה הראשונה של המחלקה", "לכל התוכנית"], "ב־rex.bark() Python מעביר את rex בתור self, ולכן self.name הוא השם של rex עצמו."]],
      [["When does __init__ run in Python 3?", "Automatically, each time a new object is created", ["Only when you call d.__init__() yourself", "Once, at the moment the class is defined, and never again", "When the program ends"], "Writing Dog(\"Rex\") creates the object and calls __init__ on it at once."],
        ["מתי רץ __init__ ב־Python 3?", "אוטומטית, בכל פעם שנוצר עצם חדש", ["רק כשקוראים בעצמנו ל־d.__init__()", "פעם אחת, כשהמחלקה מוגדרת", "כשהתוכנית מסתיימת"], "הכתיבה Dog(\"Rex\") יוצרת את העצם ומיד קוראת עליו ל־__init__."]],
      [['In Python 3, class Dog has  def __init__(self, name): self.name = name  and  def bark(self): return self.name + " says woof" . After  d = Dog("Bo") , what does d.bark() return?', "Bo says woof", ["name says woof", "Dog says woof", "an error, because bark needs a value for self"], 'Python fills in self by itself with d, the object before the dot, so self.name is "Bo" and nobody has to pass it. Nothing is wrong with the call d.bark().', "In d.bark(), which object stands before the dot? Python hands exactly that object to the method."],
        ['ב־Python 3, השיטה __init__ של Dog מבצעת  self.name = name , והשיטה bark מחזירה  self.name + " says woof" . אחרי  d = Dog("Bo") , מה מחזיר d.bark()?', "Bo says woof", ["name says woof", "Dog says woof", "שגיאה, כי bark צריכה ערך בשביל self"], 'Python ממלאת את self בעצמה בעצם d, זה שלפני הנקודה, ולכן self.name הוא "Bo" ואף אחד לא צריך להעביר אותו. אין שום בעיה בקריאה d.bark().', "ב־d.bark(), איזה עצם עומד לפני הנקודה? Python מעבירה לשיטה בדיוק את העצם הזה."]],
      [['In Python 3,  a = Dog("Rex") ,  b = Dog("Bo") , and then  a.name = "Max" . What is b.name?', "Bo", ["Max", "Rex", "an error"], "Each object keeps its own attributes. Changing a.name changes only the object a, and b is a separate object, so b.name is still Bo."],
        ['ב־Python 3,  a = Dog("Rex") ,  b = Dog("Bo") , ואז  a.name = "Max" . מה הערך של b.name?', "Bo", ["Max", "Rex", "שגיאה"], "לכל עצם יש תכונות משלו. שינוי של a.name משנה רק את העצם a, ו־b הוא עצם נפרד, ולכן b.name עדיין Bo."]],
    ],
    n: [
      [2, ['In Python 3, how many Dog objects exist after  a = Dog("Rex")  and  b = Dog("Bo") ?', "", "Each call Dog(...) creates a new object, so there are 2 separate dogs, each with its own name."], ['ב־Python 3, כמה עצמים מסוג Dog קיימים אחרי  a = Dog("Rex")  וגם  b = Dog("Bo") ?', "", "כל קריאה ל־Dog(...) יוצרת עצם חדש, ולכן יש 2 כלבים נפרדים, לכל אחד שם משלו."]],
    ],
  },
  a: {
    t: [
      ["Inheritance", "a class taking the attributes and methods of another class and adding its own", "ירושה", "מחלקה שמקבלת את התכונות והשיטות של מחלקה אחרת ומוסיפה משלה"],
      ["Subclass", "a class that inherits from another, written in Python as class Puppy(Dog):", "מחלקה יורשת", "מחלקה שיורשת ממחלקה אחרת; ב־Python כותבים class Puppy(Dog)"],
      ["Overriding", "a subclass giving its own version of a method it inherited", "דריסה (override)", "מחלקה יורשת שנותנת גרסה משלה לשיטה שקיבלה בירושה"],
      ["Encapsulation", "keeping an object's data together with its methods and hiding the inner details behind them", "כימוס", "שמירת הנתונים של עצם יחד עם השיטות שלו והסתרת הפרטים הפנימיים מאחוריהן"],
    ],
    q: [
      [['In Python 3, class Animal has  def sound(self): return "noise" , and  class Cat(Animal):  has  def sound(self): return "meow" . What does Cat().sound() return?', "meow", ["noise", "noise meow", "an error"], "Cat overrides sound, so its own version is used instead of the one it inherited from Animal."],
        ['ב־Python 3, למחלקה Animal יש שיטה sound שמחזירה  "noise" , ולמחלקה Cat, שיורשת ממנה, יש שיטה sound שמחזירה  "meow" . מה מחזיר Cat().sound()?', "meow", ["noise", "noise meow", "שגיאה"], "Cat דורסת את sound, ולכן משתמשים בגרסה שלה ולא בזו שירשה מ־Animal."]],
      [['In Python 3, class Bird has  def fly(self): return "flap" , and  class Duck(Bird): pass . What does Duck().fly() return?', "flap", ["an AttributeError", "None", "pass"], "Duck defines nothing of its own, but it inherits fly from Bird."],
        ['ב־Python 3, למחלקה Bird יש שיטה fly שמחזירה  "flap" , והמחלקה Duck יורשת ממנה ואין בה שום דבר משלה (pass). מה מחזיר Duck().fly()?', "flap", ["שגיאת AttributeError", "None", "pass"], "Duck לא מגדירה שום דבר משלה, אבל היא יורשת את fly מ־Bird."]],
      [["Why is inheritance useful?", "Shared code is written once in a parent class and reused by subclasses", ["It makes every class run faster, because Python skips the parent's code", "It copies objects to other computers, so a program can run on several", "It deletes duplicate objects automatically, so memory is never wasted"], "Common attributes and methods live in one place, and each subclass adds or changes only what is different."],
        ["למה ירושה שימושית?", "קוד משותף נכתב פעם אחת במחלקת האב, והמחלקות היורשות משתמשות בו שוב", ["היא גורמת לכל מחלקה לרוץ מהר יותר, כי Python מדלגת על הקוד של האב", "היא מעתיקה עצמים למחשבים אחרים, כך שתוכנית יכולה לרוץ בכמה מחשבים", "היא מוחקת עצמים כפולים באופן אוטומטי, כדי שהזיכרון לא יתבזבז"], "תכונות ושיטות משותפות נמצאות במקום אחד, וכל מחלקה יורשת מוסיפה או משנה רק את מה ששונה."]],
      [["In Python 3, the class Puppy inherits from Dog, and p = Puppy(\"Pip\"). What is isinstance(p, Dog)?", "True", ["False", "an error", "None"], "An object of a subclass is also an object of its parent class: a Puppy is a Dog, so isinstance(p, Dog) is True."],
        ["ב־Python 3, המחלקה Puppy יורשת מ־Dog, ו־p = Puppy(\"Pip\"). מה הערך של isinstance(p, Dog)?", "True", ["False", "שגיאה", "None"], "עצם של מחלקה יורשת הוא גם עצם של מחלקת האב שלה: Puppy היא Dog, ולכן isinstance(p, Dog) הוא True."]],
      [["Inside the __init__ of a subclass, what does super().__init__(name) do?", "It runs the parent class's __init__, so the inherited attributes are set up too", ["It deletes the parent class, so that only the subclass is left", "It creates a second object of the subclass, next to the first one", "It turns name into a global variable that every class can use"], "super() reaches the parent class. Calling its __init__ lets the parent set up what it always sets up, and the subclass then adds only its own attributes."],
        ["בתוך ה־__init__ של מחלקה יורשת, מה עושה super().__init__(name)?", "היא מריצה את ה־__init__ של מחלקת האב, כך שגם התכונות שנורשו מוגדרות", ["היא מוחקת את מחלקת האב, כך שנשארת רק המחלקה היורשת", "היא יוצרת עצם שני של המחלקה היורשת, לצד העצם הראשון", "היא הופכת את name למשתנה גלובלי שכל מחלקה יכולה להשתמש בו"], "super() מגיעה אל מחלקת האב. קריאה ל־__init__ שלה נותנת לאב להגדיר את מה שהוא תמיד מגדיר, והמחלקה היורשת מוסיפה רק את התכונות שלה."]],
    ],
    n: [
      [3, ["In Python 3, class Counter has  def __init__(self): self.n = 0  and  def add(self): self.n += 1 . After  c = Counter()  and three calls to c.add(), what is c.n?", "", "__init__ sets n to 0, and each call to add raises it by 1: 0 + 1 + 1 + 1 = 3."], ["ב־Python 3, השיטה __init__ של המחלקה Counter קובעת  self.n = 0 , והשיטה add מבצעת  self.n += 1 . אחרי  c = Counter()  ושלוש קריאות ל־c.add(), מה הערך של c.n?", "", "__init__ קובע את n ל־0, וכל קריאה ל־add מגדילה אותו ב־1: 0 + 1 + 1 + 1 = 3."]],
      [12, ["In Python 3, class Rect has  def __init__(self, w, h): self.w = w; self.h = h  and  def area(self): return self.w * self.h . What is Rect(3, 4).area()?", "", "__init__ stores w as 3 and h as 4, and area returns self.w * self.h, which is 3 × 4 = 12."],
        ["ב־Python 3, השיטה __init__ של המחלקה Rect שומרת את w ואת h, והשיטה area מחזירה  self.w * self.h . מה הערך של Rect(3, 4).area()?", "", "__init__ שומר את w כ־3 ואת h כ־4, ו־area מחזירה את self.w * self.h, כלומר 3 × 4 = 12."]],
    ],
  },
};
export default c;
