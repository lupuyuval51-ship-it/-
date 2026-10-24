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
        ["ב־Python 3, אילו מספרים מדפיסה לולאה  for i in range(3)  שהגוף שלה הוא  print(i) ?", "0, 1, 2", ["1, 2, 3", "0, 1, 2, 3", "3"], "range(3) מתחיל ב־0 ונעצר לפני 3, ולכן הוא נותן 0, 1 ו־2: שלושה מספרים."]],
      [["Why use a loop instead of writing the same line 100 times?", "The code is shorter and easier to change", ["The computer forgets copied lines", "Loops can only repeat 100 times", "Copying lines is not allowed"], "A loop says “repeat this” once; to change what is repeated you edit one place instead of 100."],
        ["למה להשתמש בלולאה במקום לכתוב את אותה שורה 100 פעמים?", "הקוד קצר יותר וקל יותר לשנות אותו", ["המחשב שוכח שורות מועתקות", "לולאה יכולה לחזור רק 100 פעמים", "אסור להעתיק שורות"], "לולאה אומרת ״חזור על זה״ פעם אחת; כדי לשנות את מה שחוזר מתקנים מקום אחד במקום 100."]],
      [['In Python 3, which line of code prints hello exactly four times?', 'for i in range(4): print("hello")', ['for i in range(5): print("hello")', 'while 4: print("hello")', 'for i in 4: print("hello")'], "range(4) gives 0, 1, 2 and 3: four numbers, so the body runs four times. range(5) would print five times, while 4 never stops because 4 always counts as true, and for i in 4 fails because a number cannot be looped over."],
        ['ב־Python 3, איזו שורת קוד מדפיסה hello בדיוק ארבע פעמים?', 'for i in range(4): print("hello")', ['for i in range(5): print("hello")', 'while 4: print("hello")', 'for i in 4: print("hello")'], "range(4) נותן 0, 1, 2 ו־3: ארבעה מספרים, ולכן הגוף רץ ארבע פעמים. range(5) היה מדפיס חמש פעמים, while 4 לא נעצרת כי 4 תמיד נחשב אמת, ו־for i in 4 נכשל כי אי אפשר לעבור בלולאה על מספר."]],
    ],
    n: [
      [5, ['In Python 3, how many times does  for i in range(5): print("hi")  print hi?', "", "range(5) gives 0, 1, 2, 3, 4: five numbers, so hi is printed 5 times."], ['ב־Python 3, כמה פעמים מודפס hi בלולאה  for i in range(5)  שהגוף שלה הוא  print("hi") ?', "", "range(5) נותן 0, 1, 2, 3, 4: חמישה מספרים, ולכן hi מודפס 5 פעמים."]],
      [3, ["In Python 3, what is the last number printed by  for i in range(1, 4): print(i) ?", "", "range(1, 4) starts at 1 and stops before 4, so it gives 1, 2 and 3, and the last number printed is 3."], ["ב־Python 3, מהו המספר האחרון שמודפס בלולאה  for i in range(1, 4)  שהגוף שלה הוא  print(i) ?", "", "range(1, 4) מתחיל ב־1 ונעצר לפני 4, ולכן הוא נותן 1, 2 ו־3, והמספר האחרון שמודפס הוא 3."]],
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
        ["ב־Python 3, n מתחיל כ־3, והתוכנית מריצה לולאת while שממשיכה כל עוד n גדול מ־0 ומורידה 1 מ־n בכל סיבוב (n = n - 1). מה הערך של n בסוף?", "0", ["1", "-1", "3"], "n יורד 3 ← 2 ← 1 ← 0. אז התנאי ״n גדול מ־0״ כבר לא מתקיים, והלולאה נעצרת כש־n שווה 0."]],
      [["In Python 3, what does  for i in range(1, 4): print(i * i)  print?", "1, 4, 9", ["1, 2, 3", "1, 4, 9, 16", "2, 4, 6"], "i takes the values 1, 2 and 3, and each one is multiplied by itself: 1 × 1 = 1, 2 × 2 = 4 and 3 × 3 = 9."],
        ["ב־Python 3, מה מדפיסה לולאה  for i in range(1, 4)  שהגוף שלה הוא  print(i * i) ?", "1, 4, 9", ["1, 2, 3", "1, 4, 9, 16", "2, 4, 6"], "i מקבל את הערכים 1, 2 ו־3, וכל אחד מהם מוכפל בעצמו: 1 × 1 = 1, 2 × 2 = 4 ו־3 × 3 = 9."]],
      [['A program must keep asking for a password until the user types the right one. Nobody knows how many tries it will take. Which loop fits best?', "A while loop, which can keep asking until the password is right", ["A for loop, because only for loops can repeat code", "An if statement, because it checks the condition again and again", "No loop: the code has to be copied once for every possible try"], "A while loop is the right tool when the number of repeats is not known in advance. A for loop with range fits a number of repeats that is known, and an if statement checks its condition only once."],
        ['תוכנית צריכה לבקש סיסמה שוב ושוב עד שהמשתמש מקליד את הנכונה. אף אחד לא יודע כמה ניסיונות ייקחו. איזו לולאה מתאימה ביותר?', "לולאת while, שיכולה לשאול שוב עד שהסיסמה נכונה", ["לולאת for, כי רק לולאות for יכולות לחזור על קוד", "משפט if, כי הוא בודק את התנאי שוב ושוב", "בלי לולאה: צריך להעתיק את הקוד פעם לכל ניסיון אפשרי"], "לולאת while היא הכלי הנכון כשמספר החזרות לא ידוע מראש. לולאת for עם range מתאימה למספר חזרות שידוע, ומשפט if בודק את התנאי שלו רק פעם אחת."]],
    ],
    n: [
      [10, ["In Python 3, after  total = 0 , the program runs  for i in range(1, 5): total = total + i . What is total?", "", "range(1, 5) gives 1, 2, 3, 4, and 1 + 2 + 3 + 4 = 10."], ["ב־Python 3, אחרי  total = 0  התוכנית מריצה לולאה  for i in range(1, 5)  שהגוף שלה הוא  total = total + i . מה הערך של total?", "", "range(1, 5) נותן 1, 2, 3, 4, ו־1 + 2 + 3 + 4 = 10."]],
      [4, ["In Python 3, n starts at 10. A while loop runs  n = n - 3  as long as  n > 0 . How many times does the body of the loop run?", "", "n goes 10 → 7 → 4 → 1 → −2. The body ran 4 times, and then −2 > 0 is False, so the loop stopped."], ["ב־Python 3, n מתחיל כ־10. לולאת while מריצה את n = n - 3 כל עוד n גדול מ־0. כמה פעמים רץ גוף הלולאה?", "", "n יורד 10 ← 7 ← 4 ← 1 ← −2. גוף הלולאה רץ 4 פעמים, ואז כבר לא מתקיים התנאי ״n גדול מ־0״, והלולאה נעצרה."]],
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
        ["ב־Python 3, אחרי i = 0 לולאת while מדפיסה את i כל עוד i קטן מ־5, אבל היא לא נעצרת אף פעם. למה?", "i לא משתנה, ולכן התנאי ״i קטן מ־5״ נשאר True לנצח", ["לולאת while לא יכולה לספור עד 5", "print מונע מלולאה להסתיים", "אסור להתחיל מ־0"], "שום דבר בתוך הלולאה לא משנה את i, ולכן התנאי אף פעם לא הופך ל־False. הוספת i = i + 1 בתוך הלולאה מתקנת את זה."]],
      [["In Python 3, which numbers does  for i in range(10, 0, -3): print(i)  print?", "10, 7, 4, 1", ["10, 7, 4, 1, -2", "10, 7, 4", "9, 6, 3, 0"], "It starts at 10 and steps by −3 while staying above the stop value 0: 10, 7, 4, 1. The next value, −2, is past the stop."],
        ["ב־Python 3, אילו מספרים מדפיסה לולאה  for i in range(10, 0, -3)  שהגוף שלה הוא  print(i) ?", "10, 7, 4, 1", ["10, 7, 4, 1, -2", "10, 7, 4", "9, 6, 3, 0"], "מתחילים ב־10 ויורדים בקפיצות של 3 כל עוד נשארים מעל ערך העצירה 0: 10, 7, 4, 1. הערך הבא, −2, כבר עבר את העצירה."]],
      [["A Python 3 loop  for i in range(10)  prints i, but first runs  break  when i == 3. What is printed?", "0, 1, 2", ["0, 1, 2, 3", "every number from 0 to 9 except 3", "3"], "break leaves the loop the moment i is 3, before printing it. Skipping only 3 would need continue, not break."],
        ["לולאה ב־Python 3  for i in range(10)  מדפיסה את i, אבל קודם מריצה  break  כש־i == 3. מה מודפס?", "0, 1, 2", ["0, 1, 2, 3", "כל המספרים מ־0 עד 9 חוץ מ־3", "3"], "break יוצא מהלולאה ברגע ש־i הוא 3, לפני ההדפסה. כדי לדלג רק על 3 צריך continue, לא break."]],
      [["In Python 3, a loop  for i in range(5)  runs  if i == 2: continue  and then  print(i)  on every pass. Which numbers are printed?", "0, 1, 3, 4", ["0, 1", "0, 1, 2, 3, 4", "0, 1, 2, 4"], "When i is 2, continue skips the rest of that pass, so print(i) does not run for 2. The loop goes on to 3 and 4, so it prints 0, 1, 3 and 4."],
        ["ב־Python 3, בכל סבב של לולאה  for i in range(5)  מריצים קודם continue כש־i == 2, ואחר כך  print(i) . אילו מספרים מודפסים?", "0, 1, 3, 4", ["0, 1", "0, 1, 2, 3, 4", "0, 1, 2, 4"], "כש־i הוא 2, continue מדלגת על שאר הסבב, ולכן print(i) לא רצה עבור 2. הלולאה ממשיכה ל־3 ול־4, ולכן מודפסים 0, 1, 3 ו־4."]],
      [["You want a loop to print the numbers 1 to 20, both included. Which range do you write?", "range(1, 21)", ["range(1, 20)", "range(20)", "range(0, 20)"], "range stops before its end value, so to reach 20 the end must be 21. range(1, 20) ends at 19, and range(20) and range(0, 20) both start at 0 and end at 19."],
        ["רוצים שלולאה תדפיס את המספרים 1 עד 20, כששניהם כלולים. איזה range כותבים?", "range(1, 21)", ["range(1, 20)", "range(20)", "range(0, 20)"], "range נעצר לפני ערך הסוף שלו, ולכן כדי להגיע ל־20 הסוף צריך להיות 21. range(1, 20) נגמר ב־19, ו־range(20) ו־range(0, 20) מתחילים שניהם ב־0 ונגמרים ב־19."]],
    ],
    n: [
      [12, ["In Python 3, an outer loop  for i in range(3)  contains an inner loop  for j in range(4)  that prints one star. How many stars are printed?", "", "The inner loop runs 4 times for each of the 3 outer passes: 3 × 4 = 12."], ["ב־Python 3, לולאה חיצונית  for i in range(3)  מכילה לולאה פנימית  for j in range(4)  שמדפיסה כוכבית אחת. כמה כוכביות מודפסות?", "", "הלולאה הפנימית רצה 4 פעמים בכל אחד מ־3 הסבבים החיצוניים: 3 × 4 = 12."]],
      [5, ["In Python 3, count starts at 0, and a loop  for i in range(1, 11)  runs  if i % 2 == 0: count = count + 1  on every pass. What is count at the end?", "", "i % 2 == 0 is true for the even numbers 2, 4, 6, 8 and 10, so count goes up 5 times."], ["ב־Python 3, count מתחיל ב־0, ובכל סבב של לולאה  for i in range(1, 11)  מוסיפים  count = count + 1  רק כש־i % 2 == 0. מה הערך של count בסוף?", "", "i % 2 == 0 מתקיים עבור המספרים הזוגיים 2, 4, 6, 8 ו־10, ולכן count עולה 5 פעמים."]],
    ],
  },
};
export default c;
