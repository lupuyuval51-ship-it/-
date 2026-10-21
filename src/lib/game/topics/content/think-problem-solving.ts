import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Problem", "a situation that needs a solution", "בעיה", "מצב שצריך למצוא לו פתרון"],
      ["Plan", "the steps you decide to take before you start", "תוכנית", "הצעדים שמחליטים לעשות לפני שמתחילים"],
      ["Guess and check", "trying an answer, testing it and improving it", "ניסוי וטעייה", "לנסות תשובה, לבדוק אותה ולשפר"],
      ["Clue", "a piece of information that helps you find the answer", "רמז", "פיסת מידע שעוזרת למצוא את התשובה"],
    ],
    q: [
      [["What is a good first step when solving a problem?", "Understand what the problem is asking", ["Write down the first answer that comes into your head", "Give up when it looks hard", "Copy what a friend did"], "Reading carefully and knowing the goal comes before choosing a method."],
        ["מה צעד ראשון טוב בפתרון בעיה?", "להבין מה הבעיה שואלת", ["לכתוב את התשובה הראשונה שעולה בראש", "לוותר כשזה נראה קשה", "להעתיק ממה שחבר עשה"], "קריאה זהירה והבנת המטרה באות לפני בחירת שיטה."]],
      [["After finding an answer, what should you do?", "Check that it makes sense", ["Hand it in straight away without reading it again", "Never look at it again", "Change it at random"], "Checking catches mistakes and shows whether the answer fits the question."],
        ["אחרי שמצאתם תשובה, מה כדאי לעשות?", "לבדוק שהיא הגיונית", ["להגיש אותה מיד בלי לקרוא שוב", "לא להסתכל עליה שוב", "לשנות אותה באקראי"], "בדיקה תופסת טעויות ומראה אם התשובה מתאימה לשאלה."]],
      [["Mia is thinking of a number. Clue 1: it is a multiple of 3. Clue 2: it is between 10 and 20. Clue 3: it is odd. What is her number?", "15", ["12", "18", "21"], "The multiples of 3 between 10 and 20 are 12, 15 and 18. Only 15 is odd, so it is the only number that fits all three clues. 21 is odd, but it is not between 10 and 20."],
        ["מיה חושבת על מספר. רמז 1: הוא כפולה של 3. רמז 2: הוא בין 10 ל־20. רמז 3: הוא אי־זוגי. על איזה מספר היא חושבת?", "15", ["12", "18", "21"], "הכפולות של 3 שבין 10 ל־20 הן 12, 15 ו־18. רק 15 הוא אי־זוגי, ולכן הוא המספר היחיד שמתאים לשלושת הרמזים. גם 21 אי־זוגי, אבל הוא לא בין 10 ל־20."]],
      [["Dan says that 8 + 5 = 12. Which check shows that his answer is wrong?", "Subtracting: 12 − 5 gives 7, not 8", ["Adding again: 12 + 5 gives 17, which is a bigger number", "Counting how many digits the answer has", "Asking a friend whether 12 looks right"], "Subtraction undoes addition: if 8 + 5 were 12, then 12 − 5 would take you back to 8, but it gives 7. So the answer is wrong. The correct sum is 13."],
        ["דן אומר ש־8 + 5 = 12. איזו בדיקה מראה שהתשובה שלו שגויה?", "חיסור: 12 − 5 נותן 7 ולא 8", ["חיבור נוסף: 12 + 5 נותן 17, שהוא מספר גדול יותר", "ספירה של מספר הספרות בתשובה", "שאלה של חבר אם 12 נראה נכון"], "חיסור מבטל חיבור: אילו 8 + 5 היה 12, אז 12 − 5 היה מחזיר אתכם ל־8, אבל התוצאה היא 7. לכן התשובה שגויה. הסכום הנכון הוא 13."]],
      [["Your first method for a puzzle does not work. What is the most useful thing to do next?", "Think about what the first try showed you and try a different way", ["Keep repeating the same method, because changing it wastes the time you already spent", "Decide that the puzzle has no answer", "Ask someone for the answer and skip the thinking"], "A method that fails still teaches you something, such as which numbers are too big or which idea does not fit. Using that to choose a new approach, like a drawing or smaller numbers, is how problem solvers make progress."],
        ["השיטה הראשונה שלכם בחידה לא עובדת. מה הכי מועיל לעשות עכשיו?", "לחשוב מה הניסיון הראשון הראה לכם ולנסות דרך אחרת", ["להמשיך לחזור על אותה שיטה, כי שינוי מבזבז את הזמן שכבר השקעתם", "להחליט שאין לחידה תשובה", "לבקש ממישהו את התשובה ולדלג על החשיבה"], "גם שיטה שנכשלה מלמדת משהו, למשל אילו מספרים גדולים מדי או איזה רעיון לא מתאים. מי שמשתמש בכך כדי לבחור גישה חדשה, כמו ציור או מספרים קטנים יותר, מתקדם בפתרון."]],
    ],
    n: [[22, ["A farm has 4 dogs and 3 birds. How many legs do they have altogether?", "legs", "Break it into parts: the dogs have 4 × 4 = 16 legs and the birds have 3 × 2 = 6 legs. Then add: 16 + 6 = 22 legs."],
      ["בחווה יש 4 כלבים ו־3 ציפורים. כמה רגליים יש להם בסך הכול?", "רגליים", "מפרקים לחלקים: לכלבים יש 4 × 4 = 16 רגליים ולציפורים 3 × 2 = 6 רגליים. אחר כך מחברים: 16 + 6 = 22 רגליים."]]],
    s: [[["Four steps of problem solving", "Understand the problem", "Make a plan", "Carry out the plan", "Look back and check"], ["ארבעה שלבים בפתרון בעיות", "להבין את הבעיה", "לתכנן", "לבצע את התוכנית", "להסתכל אחורה ולבדוק"]]],
  },
  i: {
    t: [
      ["Working backwards", "starting from the goal and reversing each step to reach the start", "עבודה מהסוף להתחלה", "התחלה מהמטרה וביצוע כל צעד בכיוון ההפוך עד שמגיעים להתחלה"],
      ["Breaking it down", "splitting a big problem into smaller parts", "פירוק לשלבים", "חלוקת בעיה גדולה לחלקים קטנים יותר"],
      ["Pattern spotting", "looking for something that repeats to predict what comes next", "זיהוי דפוסים", "חיפוש של משהו שחוזר על עצמו כדי לנבא מה יבוא"],
      ["Drawing a diagram", "sketching the situation to see it more clearly", "שרטוט", "ציור של המצב כדי לראות אותו בבירור"],
    ],
    q: [
      [["I think of a number, double it and add 3. I get 17. What was my number?", "7", ["10", "8.5", "40"], "Work backwards: 17 − 3 = 14, and 14 ÷ 2 = 7."],
        ["חשבתי על מספר, הכפלתי אותו ב־2 והוספתי 3. קיבלתי 17. על איזה מספר חשבתי?", "7", ["10", "8.5", "40"], "עובדים מהסוף: 17 − 3 = 14, ו־14 ÷ 2 = 7."]],
      [["A snail climbs 3 m up a 10 m wall each day and slides back 2 m each night. On which day does it reach the top?", "Day 8", ["Day 10", "Day 5", "Day 7"], "After 7 days and nights it is at 7 m; on day 8 it climbs 3 m to 10 m and is out before sliding back."],
        ["חילזון מטפס 3 מ׳ על קיר בגובה 10 מ׳ בכל יום, ומחליק 2 מ׳ למטה בכל לילה. באיזה יום יגיע לראש הקיר?", "ביום השמיני", ["ביום העשירי", "ביום החמישי", "ביום השביעי"], "אחרי 7 ימים ולילות הוא בגובה 7 מ׳; ביום השמיני הוא מטפס 3 מ׳ ל־10 מ׳ ויוצא לפני שהוא מחליק."]],
      [["Ava is taller than Ben. Ben is taller than Carl. Dana is shorter than Carl. Which statement must be true?", "Ava is taller than Dana", ["Dana is taller than Ben", "Carl is taller than Ben", "Ava and Carl are the same height"], "Draw the four children in a line from tallest to shortest: Ava, Ben, Carl, Dana. Ava stands before Dana in that line, so she must be taller. The order in which the names are mentioned does not decide the heights."],
        ["אווה גבוהה מבן. בן גבוה מקרל. דנה נמוכה מקרל. איזה משפט חייב להיות נכון?", "אווה גבוהה מדנה", ["דנה גבוהה מבן", "קרל גבוה מבן", "אווה וקרל בגובה זהה"], "משרטטים את ארבעת הילדים בשורה מהגבוה לנמוך: אווה, בן, קרל, דנה. אווה עומדת לפני דנה בשורה, ולכן היא חייבת להיות גבוהה ממנה. הסדר שבו השמות מוזכרים לא קובע את הגבהים."]],
      [["Matchsticks make a row of squares: 1 square needs 4 sticks, 2 squares need 7 sticks and 3 squares need 10 sticks. How many sticks do 5 squares need?", "16", ["20", "15", "13"], "Every new square shares one side with the one before it and adds only 3 sticks: 4, 7, 10, 13, 16. So 5 squares need 16 sticks. Counting 4 sticks for every square (20) forgets that the squares share sides."],
        ["מקלות גפרור יוצרים שורה של ריבועים: ריבוע אחד דורש 4 מקלות, שני ריבועים דורשים 7 מקלות ושלושה ריבועים דורשים 10 מקלות. כמה מקלות דרושים ל־5 ריבועים?", "16", ["20", "15", "13"], "כל ריבוע חדש חולק צלע עם הריבוע שלפניו ומוסיף רק 3 מקלות: 4, 7, 10, 13, 16. לכן 5 ריבועים דורשים 16 מקלות. מי שסופר 4 מקלות לכל ריבוע (20) שוכח שהריבועים חולקים צלעות."]],
    ],
    n: [
      [12, ["Two numbers add up to 20, and one of them is 4 more than the other. What is the larger number?", "", "Guess and check: 10 and 10 differ by 0, 11 and 9 differ by 2, and 12 and 8 differ by 4. So the larger number is 12.", "Try pairs that add up to 20 and see how far apart they are."],
        ["שני מספרים מסתכמים ב־20, ואחד מהם גדול ב־4 מהשני. מהו המספר הגדול?", "", "ניסוי וטעייה: 10 ו־10 נבדלים ב־0, 11 ו־9 נבדלים ב־2, ו־12 ו־8 נבדלים ב־4. לכן המספר הגדול הוא 12.", "נסו זוגות שמסתכמים ב־20 ובדקו כמה רחוק כל זוג."]],
      [36, ["What number comes next in this pattern: 1, 4, 9, 16, 25, …?", "", "The gaps between the numbers grow by 2 each time: 3, 5, 7, 9, so the next gap is 11 and 25 + 11 = 36. These are the square numbers, and 6 × 6 = 36."],
        ["מהו המספר הבא בדפוס: 1, 4, 9, 16, 25, …?", "", "הפער בין המספרים גדל ב־2 בכל פעם: 3, 5, 7, 9, ולכן הפער הבא הוא 11, ו־25 + 11 = 36. אלה מספרי הריבוע, ו־6 × 6 = 36."]],
    ],
    s: [[["Solving a puzzle by working backwards", "Write down the final result", "Undo the last step with the opposite operation", "Keep undoing the earlier steps, one at a time", "Check by doing the steps forwards from your answer"],
      ["פתרון חידה בעבודה מהסוף להתחלה", "כותבים את התוצאה הסופית", "מבטלים את הצעד האחרון בפעולה ההפוכה", "ממשיכים לבטל את הצעדים הקודמים, אחד אחרי השני", "בודקים בביצוע הצעדים קדימה, מהתשובה שמצאתם"]]],
  },
  a: {
    t: [
      ["Simplify the problem", "solving an easier version first to discover the method", "פישוט הבעיה", "פתרון של גרסה קלה יותר קודם, כדי לגלות את השיטה"],
      ["Systematic list", "listing every possibility in an organised order so none is missed", "רשימה שיטתית", "פירוט כל האפשרויות בסדר מאורגן כדי שאף אחת לא תחסר"],
      ["Constraint", "a condition the answer must satisfy", "אילוץ", "תנאי שהתשובה חייבת לקיים"],
      ["Generalising", "finding a rule that works for every case, not just one", "הכללה", "מציאת כלל שעובד בכל המקרים, ולא רק באחד"],
    ],
    q: [
      [["In a room of 10 people, everyone shakes hands once with everyone else. How many handshakes?", "45", ["100", "90", "50"], "Each of 10 shakes 9 hands: 10 × 9 = 90, but each handshake was counted twice: 90 ÷ 2 = 45."],
        ["בחדר יש 10 אנשים, וכל אחד לוחץ יד פעם אחת לכל אחד אחר. כמה לחיצות ידיים יש?", "45", ["100", "90", "50"], "כל אחד מ־10 לוחץ 9 ידיים: 10 × 9 = 90, אבל כל לחיצה נספרה פעמיים: 90 ÷ 2 = 45."]],
      [["How many different ways can 3 friends stand in a line?", "6", ["3", "9", "4"], "A systematic list: 3 choices for first, 2 for second, 1 for third: 3 × 2 × 1 = 6."],
        ["בכמה דרכים שונות 3 חברים יכולים לעמוד בשורה?", "6", ["3", "9", "4"], "רשימה שיטתית: 3 אפשרויות לראשון, 2 לשני ו־1 לשלישי: 3 × 2 × 1 = 6."]],
      [["Ana, Ben and Cal each own a different pet: a cat, a dog or a fish. Ben owns the fish, and Ana does not own the dog. Who owns the dog?", "Cal", ["Ana", "Ben", "It cannot be worked out from the clues"], "Each clue is a constraint. Ben has the fish, so the cat and the dog belong to Ana and Cal. Ana does not have the dog, so Ana has the cat and Cal has the dog."],
        ["אנה, בן וקובי מחזיקים כל אחד חיית מחמד אחרת: חתול, כלב או דג. לבן יש את הדג, ולאנה אין את הכלב. למי יש את הכלב?", "לקובי", ["לאנה", "לבן", "אי אפשר לדעת לפי הרמזים"], "כל רמז הוא אילוץ. לבן יש את הדג, ולכן החתול והכלב שייכים לאנה ולקובי. לאנה אין כלב, ולכן לאנה יש חתול ולקובי יש כלב."]],
      [["You notice that 1 + 3 = 4, 1 + 3 + 5 = 9 and 1 + 3 + 5 + 7 = 16, so you guess that the first n odd numbers always add up to n × n. What should you do before you trust this rule?", "Test it on a new case, then look for a reason why it always works", ["Nothing, because a rule that works three times in a row must work every time", "Check the same three examples again, to be extra sure", "Decide that it is true only for odd values of n"], "1 + 3 + 5 + 7 + 9 = 25 = 5 × 5, so the rule passes a new test. A few examples can support a guess, but only a reason that covers every case proves it. Here the reason is that each new odd number is exactly the L-shaped border that turns a square of dots into the next bigger square."],
        ["אתם מבחינים ש־1 + 3 = 4, ו־1 + 3 + 5 = 9, ו־1 + 3 + 5 + 7 = 16, ולכן אתם מנחשים שסכום n המספרים האי־זוגיים הראשונים הוא תמיד n × n. מה כדאי לעשות לפני שסומכים על הכלל?", "לבדוק אותו על מקרה חדש, ואז לחפש סיבה שבגללה הוא תמיד נכון", ["כלום, כי כלל שעובד שלוש פעמים ברצף חייב לעבוד תמיד", "לבדוק שוב את אותן שלוש דוגמאות, כדי להיות בטוחים יותר", "להחליט שהוא נכון רק לערכים אי־זוגיים של n"], "1 + 3 + 5 + 7 + 9 = 25 = 5 × 5, ולכן הכלל עובר בדיקה חדשה. כמה דוגמאות יכולות לתמוך בניחוש, אבל רק סיבה שמכסה כל מקרה מוכיחה אותו. כאן הסיבה היא שכל מספר אי־זוגי חדש הוא בדיוק המסגרת בצורת זווית ישרה שהופכת ריבוע של נקודות לריבוע הבא בגודלו."]],
    ],
    n: [
      [5050, ["What is 1 + 2 + 3 + … + 100?", "", "Simplify first: pair the numbers from the two ends, 1 + 100, 2 + 99, 3 + 98 and so on. Every pair makes 101, and there are 50 pairs: 50 × 101 = 5,050.", "Try 1 + 2 + … + 10 first. Pair 1 with 10, 2 with 9, and so on."],
        ["מהו 1 + 2 + 3 + … + 100?", "", "מפשטים קודם: מזווגים את המספרים משני הקצוות, 1 + 100, 2 + 99, 3 + 98 וכן הלאה. כל זוג נותן 101, ויש 50 זוגות: 50 × 101 = 5,050.", "נסו קודם את 1 + 2 + … + 10. הצמידו את 1 ל־10, את 2 ל־9 וכן הלאה."]],
      [8, ["At a party every guest shakes hands once with every other guest, and there are 28 handshakes in all. How many guests are there?", "guests", "Count the handshakes for small groups: 2 guests make 1, 3 make 3, 4 make 6, 5 make 10, 6 make 15, 7 make 21 and 8 make 28. The rule is n × (n − 1) ÷ 2 for n guests, and 8 × 7 ÷ 2 = 28.", "Count the handshakes for 2, 3, 4 and 5 guests and look for the pattern."],
        ["במסיבה כל אורח לוחץ יד פעם אחת לכל אורח אחר, ובסך הכול היו 28 לחיצות ידיים. כמה אורחים יש?", "אורחים", "סופרים לחיצות ידיים בקבוצות קטנות: 2 אורחים נותנים 1, 3 נותנים 3, 4 נותנים 6, 5 נותנים 10, 6 נותנים 15, 7 נותנים 21 ו־8 נותנים 28. הכלל הוא n × (n − 1) ÷ 2 עבור n אורחים, ו־8 × 7 ÷ 2 = 28.", "ספרו את לחיצות הידיים של 2, 3, 4 ו־5 אורחים וחפשו את הדפוס."]],
    ],
    s: [[["Solving a hard problem by simplifying it", "Try a much simpler version with small numbers", "Solve several simple cases and list the answers", "Look for a pattern in the answers", "Test the pattern on a new small case", "Use the pattern to solve the original problem"],
      ["פתרון בעיה קשה על ידי פישוטה", "מנסים גרסה פשוטה בהרבה עם מספרים קטנים", "פותרים כמה מקרים פשוטים ורושמים את התשובות", "מחפשים דפוס בתשובות", "בודקים את הדפוס על מקרה קטן חדש", "משתמשים בדפוס כדי לפתור את הבעיה המקורית"]]],
  },
};
export default c;
