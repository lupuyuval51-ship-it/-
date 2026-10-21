import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["List", "an ordered collection of values written in square brackets, like [3, 7, 9]", "רשימה", "אוסף מסודר של ערכים שנכתב בתוך סוגריים מרובעים, כמו [3,7,9]"],
      ["Item", "one value stored inside a list", "איבר", "ערך אחד שנשמר בתוך רשימה"],
      ["Index", "the position number of a value in a list; in Python the first position is 0", "אינדקס", "מספר המקום של ערך ברשימה; ב־Python המקום הראשון הוא 0"],
      ["Length", "how many values a list holds, found in Python with len()", "אורך", "כמה ערכים יש ברשימה; ב־Python מוצאים את זה עם len()"],
    ],
    q: [
      [['In Python 3,  pets = ["cat", "dog", "fish"] . What is pets[1]?', "dog", ["cat", "fish", "an error"], "Positions start at 0: pets[0] is cat, pets[1] is dog and pets[2] is fish."],
        ['ב־Python 3,  pets = ["cat","dog","fish"] . מה הערך של pets[1]?', "dog", ["cat", "fish", "שגיאה"], "המקומות מתחילים מ־0: pets[0] הוא cat, pets[1] הוא dog ו־pets[2] הוא fish."]],
      [["In Python 3,  nums = [5, 6]  and then  nums.append(7) . What is nums now?", "[5, 6, 7]", ["[7, 5, 6]", "[5, 6]", "7"], "append adds the new item at the end of the same list."],
        ["ב־Python 3,  nums = [5,6]  ואז  nums.append(7) . מה יש עכשיו ב־nums?", "[5, 6, 7]", ["[7, 5, 6]", "[5, 6]", "7"], "append מוסיף את הפריט החדש לסוף אותה רשימה."]],
      [["Which of these writes a list in Python 3?", "[1, 2, 3]", ["(1, 2, 3)", "{1, 2, 3}", '"1, 2, 3"'], "A list is written with square brackets. Round brackets make a tuple, curly brackets make a set, and quotation marks make one string of text."],
        ["איזו מהכתיבות האלה יוצרת רשימה ב־Python 3?", "[1, 2, 3]", ["(1, 2, 3)", "{1, 2, 3}", '"1, 2, 3"'], "רשימה נכתבת בסוגריים מרובעים. סוגריים עגולים יוצרים צמד (tuple), סוגריים מסולסלים יוצרים קבוצה (set), ומירכאות יוצרות מחרוזת אחת של טקסט."]],
    ],
    n: [
      [4, ["In Python 3, what is  len([4, 8, 15, 16]) ?", "", "len counts the items: 4, 8, 15 and 16 are 4 items."], ["ב־Python 3, מה הערך של  len([4, 8, 15, 16]) ?", "", "len סופר את הפריטים: 4, 8, 15 ו־16 הם 4 פריטים."]],
      [0, ["In Python 3, what is  len([]) ?", "", "An empty list has no items, so its length is 0. Asking an empty list for its first item would raise an IndexError."], ["ב־Python 3, מה הערך של  len([]) ?", "", "לרשימה ריקה אין אף פריט, ולכן האורך שלה הוא 0. בקשה לפריט הראשון של רשימה ריקה הייתה גורמת לשגיאת IndexError."]],
    ],
  },
  i: {
    t: [
      ["append()", "a list method that adds an item to the end", "append()", "שיטה של רשימה שמוסיפה פריט לסוף"],
      ["Negative index", "a position counted from the end of a list: -1 is the last item", "אינדקס שלילי", "מקום שנספר מסוף הרשימה: -1 הוא הפריט האחרון"],
      ["IndexError", "the error Python raises when you ask for a position that does not exist", "IndexError", "השגיאה ש־Python מעלה כשמבקשים מקום שלא קיים ברשימה"],
      ["remove()", "a list method that deletes the first item equal to a given value", "remove()", "שיטה של רשימה שמוחקת את הפריט הראשון ששווה לערך מסוים"],
    ],
    q: [
      [['In Python 3,  colors = ["red", "green", "blue"] . What is colors[-1]?', "blue", ["red", "an error", "green"], "Negative positions count from the end, so -1 is the last item, blue."],
        ['ב־Python 3,  colors = ["red","green","blue"] . מה הערך של colors[-1]?', "blue", ["red", "שגיאה", "green"], "מקומות שליליים נספרים מהסוף, ולכן -1 הוא הפריט האחרון, blue."]],
      [["In Python 3,  a = [1, 2, 3] . What does  a[3]  give?", "An IndexError", ["3", "None", "1"], "The positions of three items are 0, 1 and 2; position 3 does not exist."],
        ["ב־Python 3,  a = [1,2,3] . מה נותן  a[3] ?", "שגיאת IndexError", ["3", "None", "1"], "המקומות של שלושה פריטים הם 0, 1 ו־2; מקום 3 לא קיים."]],
      [["In Python 3,  a = [3, 1, 3, 2]  and then  a.remove(3) . What is a?", "[1, 3, 2]", ["[1, 2]", "[3, 1, 2]", "[3, 1, 3]"], "remove deletes only the first item equal to 3. Deleting by position would need pop or del."],
        ["ב־Python 3,  a = [3,1,3,2]  ואז  a.remove(3) . מה יש ב־a?", "[1, 3, 2]", ["[1, 2]", "[3, 1, 2]", "[3, 1, 3]"], "remove מוחק רק את הפריט הראשון ששווה ל־3. מחיקה לפי מקום נעשית עם pop או del."]],
      [["In Python 3,  a = [1, 2, 3]  and then  a.insert(0, 9) . What is a?", "[9, 1, 2, 3]", ["[1, 9, 2, 3]", "[1, 2, 3, 9]", "[9, 2, 3]"], "insert(position, value) puts the value at that position and moves the other items one place along. append would put it at the end, and position 0 is the very front."],
        ["ב־Python 3,  a = [1,2,3]  ואז  a.insert(0,9) . מה יש ב־a?", "[9, 1, 2, 3]", ["[1, 9, 2, 3]", "[1, 2, 3, 9]", "[9, 2, 3]"], "insert שם את הערך במקום שצוין ומזיז את שאר הפריטים מקום אחד הלאה. append היה שם אותו בסוף, ומקום 0 הוא ההתחלה."]],
      [["In Python 3, what does  3 in [1, 2, 3]  give?", "True", ["2", "an error", "False"], "in checks whether a value is somewhere in the list and gives True or False. It does not give a position; index() does that."],
        ["ב־Python 3, מה נותן  3 in [1,2,3] ?", "True", ["2", "שגיאה", "False"], "in בודק אם ערך נמצא איפשהו ברשימה, ונותן True או False. הוא לא נותן מקום; את זה עושה index()."]],
    ],
    n: [
      [8, ["In Python 3,  nums = [2, 4, 6] . What is  nums[0] + nums[2] ?", "", "nums[0] is 2 and nums[2] is 6, so the sum is 8."], ["ב־Python 3,  nums = [2,4,6] . מה הערך של  nums[0] + nums[2] ?", "", "nums[0] הוא 2 ו־nums[2] הוא 6, ולכן הסכום הוא 8."]],
    ],
  },
  a: {
    t: [
      ["Slice", "a part of a list taken by start and stop positions, like a[1:3]", "חיתוך (slice)", "חלק מרשימה שנלקח לפי מקום התחלה ומקום עצירה, כמו a[1:3]"],
      ["Mutable", "able to be changed after it is created, as a Python list can", "ניתן לשינוי (mutable)", "אפשר לשנות אותו אחרי שנוצר, כמו רשימה ב־Python"],
      ["pop()", "a list method that removes an item (the last one if no position is given) and returns it", "pop()", "שיטה של רשימה שמוציאה פריט (את האחרון, אם לא צוין מקום) ומחזירה אותו"],
      ["Two-dimensional list", "a list of lists, used like a grid of rows and columns", "רשימה דו־ממדית", "רשימה של רשימות, שמשמשת כמו טבלה של שורות ועמודות"],
    ],
    q: [
      [["In Python 3,  a = [10, 20, 30, 40, 50] . What is a[1:3]?", "[20, 30]", ["[20, 30, 40]", "[10, 20, 30]", "[10, 20]"], "A slice starts at the first position (1) and stops before the second (3), so it takes positions 1 and 2."],
        ["ב־Python 3,  a = [10,20,30,40,50] . מה הערך של a[1:3]?", "[20, 30]", ["[20, 30, 40]", "[10, 20, 30]", "[10, 20]"], "חיתוך מתחיל במקום הראשון (1) ונעצר לפני השני (3), ולכן הוא לוקח את מקומות 1 ו־2."]],
      [["In Python 3,  a = [1, 2] , then  b = a , then  b.append(3) . What is a?", "[1, 2, 3]", ["[1, 2]", "[3]", "an error"], "b = a does not copy the list: both names point to the same list, so a change through b is seen through a."],
        ["ב־Python 3,  a = [1,2] , אחר כך  b = a , ואז  b.append(3) . מה יש ב־a?", "[1, 2, 3]", ["[1, 2]", "[3]", "שגיאה"], "b = a לא מעתיק את הרשימה: שני השמות מצביעים על אותה רשימה, ולכן שינוי דרך b נראה גם דרך a."]],
      [["In Python 3,  a = [4, 9, 1]  and then  x = a.pop() . What is x?", "1", ["4", "9", "[4, 9]"], "With no position, pop removes the last item and returns it: x is 1 and a becomes [4, 9]."],
        ["ב־Python 3,  a = [4,9,1]  ואז  x = a.pop() . מה הערך של x?", "1", ["4", "9", "[4, 9]"], "בלי מקום, pop מוציא את הפריט האחרון ומחזיר אותו: x הוא 1, וב־a נשארים רק 4 ו־9."]],
      [["In Python 3,  a = [3, 1, 2]  and then  b = a.sort() . What is b?", "None", ["[1, 2, 3]", "[3, 1, 2]", "an error"], "sort puts the list a itself in order and gives back None. To get a new sorted list and leave a as it was, use sorted(a).", "A method that changes a list in place usually gives back nothing. What is Python's word for nothing?"],
        ["ב־Python 3,  a = [3,1,2]  ואז  b = a.sort() . מה הערך של b?", "None", ["[1, 2, 3]", "[3, 1, 2]", "שגיאה"], "sort מסדרת את הרשימה a עצמה ומחזירה None. כדי לקבל רשימה חדשה ממוינת ולהשאיר את a כמו שהייתה, משתמשים ב־sorted(a).", "שיטה ששינתה רשימה במקום בדרך כלל לא מחזירה כלום. איך Python קוראת ל״כלום״?"]],
      [["In Python 3,  a = [1, 2, 3, 4] . What is  a[-2:] ?", "[3, 4]", ["[2, 3]", "[3]", "[1, 2]"], "-2 counts from the end, so the slice starts at the second-to-last item, 3, and with no stop position it runs to the end: 3 and 4."],
        ["ב־Python 3,  a = [1,2,3,4] . מה הערך של  a[-2:] ?", "[3, 4]", ["[2, 3]", "[3]", "[1, 2]"], "-2 נספר מהסוף, ולכן החיתוך מתחיל בפריט השני מהסוף, 3, ובלי מקום עצירה הוא ממשיך עד הסוף: 3 ו־4."]],
    ],
    n: [
      [3, ["In Python 3,  grid = [[1, 2], [3, 4]] . What is grid[1][0]?", "", "grid[1] is the second row, [3, 4], and position 0 of that row is 3."], ["ב־Python 3,  grid = [[1,2],[3,4]] . מה הערך של grid[1][0]?", "", "grid[1] היא השורה השנייה, שמכילה את 3 ו־4, ובמקום 0 שלה נמצא 3."]],
    ],
  },
};
export default c;
