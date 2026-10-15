import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Loop", "code that repeats a group of instructions", "לולאה", "קוד שחוזר שוב ושוב על קבוצת הוראות"],
      ["Iteration", "one pass through the repeated instructions", "איטרציה (סבב)", "מעבר אחד על ההוראות שחוזרות"],
      ["Counter", "a variable that keeps track of how many times something has happened", "מונה", "משתנה שסופר כמה פעמים משהו קרה"],
      ["Infinite loop", "repeating code that never stops because its stop condition is never met", "לולאה אינסופית", "קוד שחוזר ולא נעצר אף פעם, כי תנאי העצירה שלו לא מתקיים"],
    ],
    q: [
      [["In Python 3, which numbers does  for i in range(3): print(i)  print?", "0, 1, 2", ["1, 2, 3", "0, 1, 2, 3", "3"], "range(3) starts at 0 and stops before 3, so it gives 0, 1 and 2: three numbers."],
        ["ב־Python 3, אילו מספרים מדפיס  for i in range(3): print(i) ?", "0, 1, 2", ["1, 2, 3", "0, 1, 2, 3", "3"], "range(3) מתחיל ב־0 ונעצר לפני 3, ולכן הוא נותן 0, 1 ו־2: שלושה מספרים."]],
      [["Why use a loop instead of writing the same line 100 times?", "The code is shorter and easier to change", ["The computer forgets copied lines", "Loops can only repeat 100 times", "Copying lines is not allowed"], "A loop says “repeat this” once; to change what is repeated you edit one place instead of 100."],
        ["למה להשתמש בלולאה במקום לכתוב את אותה שורה 100 פעמים?", "הקוד קצר יותר וקל יותר לשנות אותו", ["המחשב שוכח שורות מועתקות", "לולאה יכולה לחזור רק 100 פעמים", "אסור להעתיק שורות"], "לולאה אומרת ״חזור על זה״ פעם אחת; כדי לשנות את מה שחוזר מתקנים מקום אחד במקום 100."]],
    ],
    n: [
      [5, ['In Python 3, how many times does  for i in range(5): print("hi")  print hi?', "", "range(5) gives 0, 1, 2, 3, 4: five numbers, so hi is printed 5 times."], ['ב־Python 3, כמה פעמים  for i in range(5): print("hi")  מדפיס hi?', "", "range(5) נותן 0, 1, 2, 3, 4: חמישה מספרים, ולכן hi מודפס 5 פעמים."]],
    ],
  },
  i: {
    t: [
      ["for loop", "repeating code that goes through a range of numbers or through each item of a list", "לולאת for", "קוד חוזר שעובר על טווח של מספרים או על כל פריט ברשימה"],
      ["while loop", "repeating code that keeps going as long as its condition is True", "לולאת while", "קוד חוזר שממשיך כל עוד התנאי שלו True"],
      ["range()", "a Python function that gives a run of whole numbers, from 0 unless told otherwise, stopping before the end value", "range()", "פונקציה של Python שנותנת רצף של מספרים שלמים, מ־0 אם לא נאמר אחרת, ועד לפני ערך הסוף"],
      ["Accumulator", "a variable that collects a running total inside a loop", "משתנה צובר", "משתנה שאוסף סכום מצטבר בתוך לולאה"],
    ],
    q: [
      [["In Python 3, which numbers does  range(2, 6)  give?", "2, 3, 4, 5", ["2, 3, 4, 5, 6", "3, 4, 5, 6", "2, 6"], "range(start, stop) starts at start and stops before stop, so 6 itself is not included."],
        ["ב־Python 3, אילו מספרים נותן  range(2, 6) ?", "2, 3, 4, 5", ["2, 3, 4, 5, 6", "3, 4, 5, 6", "2, 6"], "range(start, stop) מתחיל ב־start ונעצר לפני stop, ולכן 6 עצמו לא נכלל."]],
      [["In Python 3, after  n = 3 , the program runs  while n > 0: n = n - 1 . What is n at the end?", "0", ["1", "-1", "3"], "n goes 3 → 2 → 1 → 0. Then n > 0 is False, so the loop stops with n = 0."],
        ["ב־Python 3, אחרי  n = 3  התוכנית מריצה  while n > 0: n = n - 1 . מה הערך של n בסוף?", "0", ["1", "-1", "3"], "n יורד 3 ← 2 ← 1 ← 0. אז n > 0 הוא False, והלולאה נעצרת כש־n שווה 0."]],
    ],
    n: [
      [10, ["In Python 3, after  total = 0 , the program runs  for i in range(1, 5): total = total + i . What is total?", "", "range(1, 5) gives 1, 2, 3, 4, and 1 + 2 + 3 + 4 = 10."], ["ב־Python 3, אחרי  total = 0  התוכנית מריצה  for i in range(1, 5): total = total + i . מה הערך של total?", "", "range(1, 5) נותן 1, 2, 3, 4, ו־1 + 2 + 3 + 4 = 10."]],
    ],
    s: [
      [["How a while loop runs", "Check the condition", "If it is True, run the body of the loop", "Go back and check the condition again", "When it is False, carry on after the loop"],
        ["איך רצה לולאת while", "בודקים את התנאי", "אם הוא True, מריצים את גוף הלולאה", "חוזרים ובודקים שוב את התנאי", "כשהוא False, ממשיכים לקוד שאחרי הלולאה"]],
    ],
  },
  a: {
    t: [
      ["break", "a statement that leaves the loop at once", "break", "פקודה שיוצאת מהלולאה מיד"],
      ["continue", "a statement that skips the rest of this pass and jumps to the next pass", "continue", "פקודה שמדלגת על שאר הסבב הנוכחי וקופצת לסבב הבא"],
      ["Nested loop", "a loop inside another loop: the inner one runs completely for each pass of the outer one", "לולאה מקוננת", "לולאה בתוך לולאה: הפנימית רצה עד הסוף בכל סבב של החיצונית"],
      ["Off-by-one error", "a bug where a loop runs one time too many or one time too few", "טעות של אחד (off-by-one)", "באג שבו לולאה רצה פעם אחת יותר מדי או פעם אחת פחות מדי"],
    ],
    q: [
      [["In Python 3, after  i = 0 , why does  while i < 5: print(i)  never stop?", "i never changes, so i < 5 stays True forever", ["while loops cannot count up to 5", "print stops a loop from ending", "0 is not allowed as a start value"], "Nothing inside the loop changes i, so the condition never becomes False. Adding i = i + 1 inside fixes it."],
        ["ב־Python 3, אחרי  i = 0 , למה  while i < 5: print(i)  לא נעצרת אף פעם?", "i לא משתנה, ולכן i < 5 נשאר True לנצח", ["לולאת while לא יכולה לספור עד 5", "print מונע מלולאה להסתיים", "אסור להתחיל מ־0"], "שום דבר בתוך הלולאה לא משנה את i, ולכן התנאי אף פעם לא הופך ל־False. הוספת i = i + 1 בתוך הלולאה מתקנת את זה."]],
      [["In Python 3, which numbers does  for i in range(10, 0, -3): print(i)  print?", "10, 7, 4, 1", ["10, 7, 4, 1, -2", "10, 7, 4", "9, 6, 3, 0"], "It starts at 10 and steps by −3 while staying above the stop value 0: 10, 7, 4, 1. The next value, −2, is past the stop."],
        ["ב־Python 3, אילו מספרים מדפיס  for i in range(10, 0, -3): print(i) ?", "10, 7, 4, 1", ["10, 7, 4, 1, -2", "10, 7, 4", "9, 6, 3, 0"], "מתחילים ב־10 ויורדים בקפיצות של 3 כל עוד נשארים מעל ערך העצירה 0: 10, 7, 4, 1. הערך הבא, −2, כבר עבר את העצירה."]],
      [["A Python 3 loop  for i in range(10)  prints i, but first runs  break  when i == 3. What is printed?", "0, 1, 2", ["0, 1, 2, 3", "every number from 0 to 9 except 3", "3"], "break leaves the loop the moment i is 3, before printing it. Skipping only 3 would need continue, not break."],
        ["לולאה ב־Python 3  for i in range(10)  מדפיסה את i, אבל קודם מריצה  break  כש־i == 3. מה מודפס?", "0, 1, 2", ["0, 1, 2, 3", "כל המספרים מ־0 עד 9 חוץ מ־3", "3"], "break יוצא מהלולאה ברגע ש־i הוא 3, לפני ההדפסה. כדי לדלג רק על 3 צריך continue, לא break."]],
    ],
    n: [
      [12, ["In Python 3, an outer loop  for i in range(3)  contains an inner loop  for j in range(4)  that prints one star. How many stars are printed?", "", "The inner loop runs 4 times for each of the 3 outer passes: 3 × 4 = 12."], ["ב־Python 3, לולאה חיצונית  for i in range(3)  מכילה לולאה פנימית  for j in range(4)  שמדפיסה כוכבית אחת. כמה כוכביות מודפסות?", "", "הלולאה הפנימית רצה 4 פעמים בכל אחד מ־3 הסבבים החיצוניים: 3 × 4 = 12."]],
    ],
  },
};
export default c;
