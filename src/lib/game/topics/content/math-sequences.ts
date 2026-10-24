import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Pattern", "something that repeats or changes by a rule", "דפוס", "משהו שחוזר על עצמו או משתנה לפי כלל"],
      ["Sequence", "a list of numbers in a certain order", "סדרה", "רשימה של מספרים בסדר מסוים"],
      ["Term", "each number in a sequence", "איבר", "כל מספר בסדרה"],
      ["Rule", "the instruction that tells you how to get the next number", "כלל", "ההוראה שאומרת איך לקבל את המספר הבא"],
    ],
    q: [
      [["What comes next: 2, 4, 6, 8, …?", "10", ["9", "12", "16"], "The numbers go up by 2 each time, so the rule is “add 2”: 8 + 2 = 10."],
        ["מה בא אחר כך: 2, 4, 6, 8, …?", "10", ["9", "12", "16"], "המספרים עולים ב־2 בכל פעם, ולכן הכלל הוא ״להוסיף 2״: 8 + 2 = 10."]],
      [["What comes next: 50, 45, 40, 35, …?", "30", ["25", "40", "34"], "The numbers go down by 5 each time, so the rule is “subtract 5”: 35 − 5 = 30."],
        ["מה בא אחר כך: 50, 45, 40, 35, …?", "30", ["25", "40", "34"], "המספרים יורדים ב־5 בכל פעם, ולכן הכלל הוא ״להחסיר 5״: 35 − 5 = 30."]],
      [["A pattern goes: circle, square, circle, square, circle, … What comes next?", "Square", ["Circle", "Triangle", "Star"], "The pattern repeats two shapes in turn, a circle and then a square. After a circle comes a square."],
        ["דפוס: עיגול, ריבוע, עיגול, ריבוע, עיגול, … מה בא אחר כך?", "ריבוע", ["עיגול", "משולש", "כוכב"], "הדפוס חוזר על שתי צורות לסירוגין, עיגול ואחר כך ריבוע. אחרי עיגול בא ריבוע."]],
      [["What is the rule of 3, 6, 9, 12, …?", "Add 3 each time", ["Add 6 each time", "Multiply by 2 each time", "Multiply by 3 each time"], "Each number is 3 more than the one before: 3, 6, 9, 12, so the rule is “add 3”. The next number is 15."],
        ["מהו הכלל של 3, 6, 9, 12, …?", "להוסיף 3 בכל פעם", ["להוסיף 6 בכל פעם", "לכפול ב־2 בכל פעם", "לכפול ב־3 בכל פעם"], "כל מספר גדול ב־3 מהמספר שלפניו: 3, 6, 9, 12, ולכן הכלל הוא ״להוסיף 3״. המספר הבא הוא 15."]],
      [["What is the missing number x: 7, 14, x, 28?", "21", ["20", "22", "35"], "The numbers go up by 7 each time: 14 + 7 = 21, and 21 + 7 = 28, so x = 21."],
        ["מהו המספר החסר x: 7, 14, x, 28?", "21", ["20", "22", "35"], "המספרים עולים ב־7 בכל פעם: 14 + 7 = 21, ו־21 + 7 = 28, ולכן x = 21."]],
    ],
    n: [[24, ["Count by 4s: 4, 8, 12, 16, … What is the 6th number in the list?", "", "Keep adding 4: 4, 8, 12, 16, 20, 24. The 6th number is 24."], ["סופרים בקפיצות של 4: 4, 8, 12, 16, … מהו המספר השישי ברשימה?", "", "ממשיכים להוסיף 4: 4, 8, 12, 16, 20, 24. המספר השישי הוא 24."]]],
    s: [[["Finding the next number in 5, 9, 13, 17, …, in order", "Look at the first two numbers: 5 and 9", "Find the difference: 9 − 5 = 4", "Check the other pairs: 13 − 9 = 4 and 17 − 13 = 4", "Add 4 to the last number: 17 + 4 = 21"],
      ["מוצאים את המספר הבא ב־5, 9, 13, 17, …, לפי הסדר", "מסתכלים על שני המספרים הראשונים: 5 ו־9", "מוצאים את ההפרש: 9 − 5 = 4", "בודקים את שאר הזוגות: 13 − 9 = 4 ו־17 − 13 = 4", "מוסיפים 4 למספר האחרון: 17 + 4 = 21"]]],
  },
  i: {
    t: [
      ["Arithmetic sequence", "a sequence that adds the same number each time", "סדרה חשבונית", "סדרה שבה מוסיפים כל פעם אותו מספר"],
      ["Common difference", "the fixed amount added each step in an arithmetic sequence", "הפרש קבוע", "הכמות הקבועה שמוסיפים בכל צעד בסדרה חשבונית"],
      ["Geometric sequence", "a sequence that multiplies by the same number each time", "סדרה הנדסית", "סדרה שבה כופלים כל פעם באותו מספר"],
      ["Square numbers", "the sequence 1, 4, 9, 16, 25, …", "המספרים הריבועיים", "הסדרה 1, 4, 9, 16, 25, …"],
    ],
    q: [
      [["What comes next: 3, 6, 12, 24, …?", "48", ["30", "36", "27"], "Each term is double the one before it (3 × 2 = 6, 6 × 2 = 12, …), so 24 × 2 = 48."],
        ["מה בא אחר כך: 3, 6, 12, 24, …?", "48", ["30", "36", "27"], "כל איבר כפול מזה שלפניו (3 × 2 = 6, 6 × 2 = 12, …), ולכן 24 × 2 = 48."]],
      [["What comes next: 1, 4, 9, 16, …?", "25", ["20", "23", "32"], "These are square numbers: 1², 2², 3², 4², so next is 5² = 25."],
        ["מה בא אחר כך: 1, 4, 9, 16, …?", "25", ["20", "23", "32"], "אלה מספרים ריבועיים: 1², 2², 3², 4², ולכן הבא הוא 5² = 25."]],
      [["What is the common difference of 12, 9, 6, 3, …?", "−3", ["3", "9", "12"], "Each term is 3 less than the one before, so the common difference is −3. It is negative because the numbers go down.", "Do the numbers go up or down?"],
        ["מהו ההפרש הקבוע של 12, 9, 6, 3, …?", "−3", ["3", "9", "12"], "כל איבר קטן ב־3 מזה שלפניו, ולכן ההפרש הקבוע הוא −3. הוא שלילי כי המספרים יורדים.", "המספרים עולים או יורדים?"]],
      [["Which of these sequences is geometric?", "3, 9, 27, 81, …", ["3, 6, 9, 12, …", "1, 4, 9, 16, …", "1, 2, 4, 7, 11, …"], "In 3, 9, 27, 81 each term is the one before multiplied by 3. The sequence 3, 6, 9, 12 adds 3 each time, 1, 4, 9, 16 are square numbers, and 1, 2, 4, 7, 11 adds 1, then 2, then 3, and so on."],
        ["איזו מהסדרות האלה היא סדרה הנדסית?", "3, 9, 27, 81, …", ["3, 6, 9, 12, …", "1, 4, 9, 16, …", "1, 2, 4, 7, 11, …"], "ב־3, 9, 27, 81 כל איבר הוא האיבר שלפניו כפול 3. בסדרה 3, 6, 9, 12 מוסיפים 3 בכל פעם, 1, 4, 9, 16 הם מספרים ריבועיים, וב־1, 2, 4, 7, 11 מוסיפים 1, אחר כך 2, אחר כך 3, וכן הלאה."]],
      [["What comes next: 1, 2, 4, 7, 11, …?", "16", ["15", "18", "22"], "The gaps grow by 1 each time: +1, +2, +3, +4, so the next gap is +5 and the next term is 11 + 5 = 16. It is not doubling.", "Look at the gaps between the terms."],
        ["מה בא אחר כך: 1, 2, 4, 7, 11, …?", "16", ["15", "18", "22"], "הפערים גדלים ב־1 בכל פעם: 1, 2, 3, 4, ולכן הפער הבא הוא 5 והאיבר הבא הוא 11 + 5 = 16. אין כאן הכפלה פי 2.", "הסתכלו על הפערים בין האיברים."]],
    ],
    n: [
      [23, ["The sequence 5, 8, 11, 14, … continues. What is the 7th term?", "", "Add 3 each time: 5, 8, 11, 14, 17, 20, 23."], ["הסדרה 5, 8, 11, 14, … ממשיכה. מהו האיבר השביעי?", "", "מוסיפים 3 בכל פעם: 5, 8, 11, 14, 17, 20, 23."]],
      [25, ["What is 1 + 3 + 5 + 7 + 9?", "", "The sum of the first five odd numbers is 5² = 25: 1 + 3 = 4, then 9, then 16, then 25. The sum of the first n odd numbers is always n²."], ["כמה זה 1 + 3 + 5 + 7 + 9?", "", "סכום חמשת המספרים האי־זוגיים הראשונים הוא 5² = 25: 1 + 3 = 4, אחר כך 9, אחר כך 16, אחר כך 25. סכום n המספרים האי־זוגיים הראשונים הוא תמיד n²."]],
    ],
    s: [[["Finding the 10th term of 2, 5, 8, 11, …, in order", "Find the common difference: 5 − 2 = 3", "The 10th term is the first term plus 9 differences", "Work it out: 2 + 9 × 3 = 2 + 27", "Write the answer: 29"],
      ["מוצאים את האיבר העשירי ב־2, 5, 8, 11, …, לפי הסדר", "מוצאים את ההפרש הקבוע: 5 − 2 = 3", "האיבר העשירי הוא האיבר הראשון ועוד 9 הפרשים", "מחשבים: 2 + 9 × 3 = 2 + 27", "כותבים את התשובה: 29"]]],
  },
  a: {
    t: [
      ["nth term", "a formula that gives any term from its position n, like 3n + 2", "האיבר הכללי", "נוסחה שנותנת כל איבר לפי המקום שלו n, כמו 3n + 2"],
      ["Fibonacci sequence", "1, 1, 2, 3, 5, 8, … where each term is the sum of the two before it", "סדרת פיבונאצ׳י", "1, 1, 2, 3, 5, 8, … שבה כל איבר הוא סכום שני האיברים שלפניו"],
      ["Triangular numbers", "1, 3, 6, 10, 15, …, the dots that make growing triangles", "המספרים המשולשים", "1, 3, 6, 10, 15, …, מספרי הנקודות שיוצרות משולשים הולכים וגדלים"],
      ["Ratio of a geometric sequence", "the fixed number each term is multiplied by", "מנת הסדרה", "המספר הקבוע שבו כופלים כל איבר בסדרה הנדסית"],
    ],
    q: [
      [["What is the nth term of 4, 7, 10, 13, …?", "3n + 1", ["n + 3", "4n", "3n + 4"], "The difference is 3, so 3n; for n = 1, 3 + 1 = 4."],
        ["מהו האיבר הכללי של 4, 7, 10, 13, …?", "3n + 1", ["n + 3", "4n", "3n + 4"], "ההפרש הוא 3, ולכן 3n; עבור n = 1: 3 + 1 = 4."]],
      [["What comes next in the Fibonacci sequence 1, 1, 2, 3, 5, 8, 13, …?", "21", ["18", "26", "16"], "Each Fibonacci term is the sum of the two terms before it: 8 + 13 = 21."],
        ["מה בא אחר כך בסדרת פיבונאצ׳י 1, 1, 2, 3, 5, 8, 13, …?", "21", ["18", "26", "16"], "כל איבר בסדרת פיבונאצ׳י הוא סכום שני האיברים שלפניו: 8 + 13 = 21."]],
      [["What is the 10th triangular number?", "55", ["45", "100", "50"], "The 10th triangular number is 1 + 2 + … + 10 = 10 × 11 ÷ 2 = 55."],
        ["מהו המספר המשולש העשירי?", "55", ["45", "100", "50"], "המספר המשולש העשירי הוא 1 + 2 + … + 10 = 10 × 11 ÷ 2 = 55."]],
      [["What is the nth term of the sequence 2, 4, 8, 16, …?", "2ⁿ", ["2n", "n²", "n + 2"], "Each term doubles, so the 1st term is 2¹, the 2nd is 2², the 3rd is 2³ and so on: the nth term is 2ⁿ. The formula 2n would give 2, 4, 6, 8, …"],
        ["מהו האיבר הכללי של הסדרה 2, 4, 8, 16, …?", "2ⁿ", ["2n", "n²", "n + 2"], "כל איבר מוכפל ב־2, ולכן האיבר הראשון הוא 2¹, השני 2², השלישי 2³ וכן הלאה: האיבר הכללי הוא 2ⁿ. הנוסחה 2n הייתה נותנת 2, 4, 6, 8, …"]],
      [["The nth term of a sequence is 5n − 2. What is the 10th term?", "48", ["50", "52", "8"], "Put n = 10: 5 × 10 − 2 = 50 − 2 = 48. Forgetting to take away the 2 gives 50."],
        ["האיבר הכללי של סדרה הוא 5n − 2. מהו האיבר העשירי?", "48", ["50", "52", "8"], "מציבים n = 10: 5 × 10 − 2 = 50 − 2 = 48. אם שוכחים להחסיר את ה־2 מקבלים 50."]],
      [["Is 47 a term of the sequence 3n + 2?", "Yes, because 3 × 15 + 2 = 47", ["No, because 47 is not a multiple of 3", "No, because 47 is a prime number", "No, because 3n + 2 only gives even numbers"], "Solve 3n + 2 = 47: 3n = 45, so n = 15, a whole number, which makes 47 the 15th term. The terms are not multiples of 3 and can be odd, like 5, 11 and 17."],
        ["האם 47 הוא איבר בסדרה 3n + 2?", "כן, כי 3 × 15 + 2 = 47", ["לא, כי 47 אינו כפולה של 3", "לא, כי 47 הוא מספר ראשוני", "לא, כי 3n + 2 נותן רק מספרים זוגיים"], "פותרים 3n + 2 = 47: 3n = 45, ולכן n = 15, מספר שלם, כלומר 47 הוא האיבר ה־15. האיברים אינם כפולות של 3 ויכולים להיות אי־זוגיים, כמו 5, 11 ו־17."]],
      [["In the sequence 3, 6, 12, 24, …, which is the first term greater than 100?", "192", ["96", "100", "144"], "The terms are 3, 6, 12, 24, 48, 96 and 192. The term 96 is still less than 100, so the first term over 100 is 192."],
        ["בסדרה 3, 6, 12, 24, … איזה איבר הוא הראשון שגדול מ־100?", "192", ["96", "100", "144"], "האיברים הם 3, 6, 12, 24, 48, 96 ו־192. האיבר 96 עדיין קטן מ־100, ולכן האיבר הראשון שגדול מ־100 הוא 192."]],
    ],
    n: [
      [37, ["The nth term of a sequence is n² + 1. What is the 6th term?", "", "Put n = 6: 6² + 1 = 36 + 1 = 37. Squaring first and then adding 1 is the right order."], ["האיבר הכללי של סדרה הוא n² + 1. מהו האיבר השישי?", "", "מציבים n = 6: 6² + 1 = 36 + 1 = 37. קודם מעלים בריבוע ואחר כך מוסיפים 1."]],
      [210, ["What is 1 + 2 + 3 + … + 20?", "", "Pair the numbers from both ends: 1 + 20 = 21, 2 + 19 = 21, and so on. There are 10 pairs, so the sum is 10 × 21 = 210."], ["כמה זה 1 + 2 + 3 + … + 20?", "", "מזווגים את המספרים משני הקצוות: 1 + 20 = 21, 2 + 19 = 21 וכן הלאה. יש 10 זוגות, ולכן הסכום הוא 10 × 21 = 210."]],
    ],
    s: [[["Finding the nth term of 7, 12, 17, 22, …, in order", "Find the common difference: 12 − 7 = 5", "So the nth term starts with 5n", "Compare with the 1st term: 5 × 1 = 5, but the term is 7, so add 2", "Write the nth term: 5n + 2"],
      ["מוצאים את האיבר הכללי של 7, 12, 17, 22, …, לפי הסדר", "מוצאים את ההפרש הקבוע: 12 − 7 = 5", "ולכן האיבר הכללי מתחיל ב־5n", "משווים לאיבר הראשון: 5 × 1 = 5, אבל האיבר הוא 7, ולכן מוסיפים 2", "כותבים את האיבר הכללי: 5n + 2"]]],
  },
};
export default c;
