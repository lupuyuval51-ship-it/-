import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Even number", "a whole number that divides by 2 with nothing left over", "מספר זוגי", "מספר שלם שמתחלק ב־2 בלי שארית"],
      ["Odd number", "a whole number that leaves 1 when divided by 2", "מספר אי־זוגי", "מספר שלם שנשארת שארית 1 כשמחלקים אותו ב־2"],
      ["Multiple", "the result of multiplying a number by a whole number: 5, 10, 15 for 5", "כפולה", "התוצאה של כפל מספר במספר שלם: 5, 10, 15 עבור 5"],
      ["Factor", "a number that divides another exactly: 1, 2, 3 and 6 for 6", "מחלק", "מספר שמספר אחר מתחלק בו בלי שארית: 1, 2, 3 ו־6 עבור 6"],
    ],
    q: [
      [["Which number is a multiple of 4?", "28", ["18", "30", "14"], "28 = 4 × 7; the others are not in the 4 times table."],
        ["איזה מספר הוא כפולה של 4?", "28", ["18", "30", "14"], "28 = 4 × 7; המספרים האחרים לא נמצאים בלוח הכפל של 4."]],
      [["Which is a factor of 15?", "5", ["4", "10", "30"], "15 ÷ 5 = 3 exactly; 30 is a multiple of 15, not a factor."],
        ["איזה מספר מחלק את 15?", "5", ["4", "10", "30"], "15 ÷ 5 = 3 בדיוק; 30 הוא כפולה של 15, לא מחלק שלו."]],
      [["Which statement is true?", "Every number is a factor of itself and also a multiple of itself", ["A factor of a number is always greater than the number itself", "The multiples of a number are always smaller than the number itself", "Zero is a factor of every whole number"], "A number divides itself exactly (6 ÷ 6 = 1) and is 1 times itself (6 = 6 × 1), so it is its own factor and its own multiple. Factors are never greater than the number, and multiples are never smaller."],
        ["איזו מהטענות נכונה?", "כל מספר הוא מחלק של עצמו וגם כפולה של עצמו", ["מחלק של מספר הוא תמיד גדול יותר מהמספר עצמו", "הכפולות של מספר הן תמיד קטנות יותר מהמספר עצמו", "אפס הוא מחלק של כל מספר שלם"], "מספר מתחלק בעצמו בדיוק (6 ÷ 6 = 1) והוא פי 1 מעצמו (6 = 6 × 1), ולכן הוא מחלק של עצמו וגם כפולה של עצמו. מחלקים אף פעם לא גדולים מהמספר, וכפולות אף פעם לא קטנות ממנו."]],
    ],
    n: [
      [6, ["How many factors does 20 have?", "", "The factors of 20 are 1, 2, 4, 5, 10 and 20, which makes 6 factors."], ["כמה מחלקים יש ל־20?", "", "המחלקים של 20 הם 1, 2, 4, 5, 10 ו־20, ולכן יש 6 מחלקים."]],
      [35, ["What is the 5th multiple of 7?", "", "The multiples of 7 are 7, 14, 21, 28 and 35, so the 5th one is 5 × 7 = 35."], ["מהי הכפולה החמישית של 7?", "", "הכפולות של 7 הן 7, 14, 21, 28 ו־35, ולכן החמישית היא 5 × 7 = 35."]],
    ],
    s: [[["Finding all the factors of 12, in order", "Start with 1, which divides every number: 1 × 12 = 12", "Try 2: 12 ÷ 2 = 6, so 2 and 6 are factors", "Try 3: 12 ÷ 3 = 4, so 3 and 4 are factors", "Stop when the pairs meet: the factors are 1, 2, 3, 4, 6 and 12"],
      ["מוצאים את כל המחלקים של 12, לפי הסדר", "מתחילים ב־1, שמחלק כל מספר: 1 × 12 = 12", "בודקים את 2: 12 ÷ 2 = 6, ולכן 2 ו־6 הם מחלקים", "בודקים את 3: 12 ÷ 3 = 4, ולכן 3 ו־4 הם מחלקים", "עוצרים כשהזוגות נפגשים: המחלקים הם 1, 2, 3, 4, 6 ו־12"]]],
  },
  i: {
    t: [
      ["Prime number", "a whole number greater than 1 whose only factors are 1 and itself", "מספר ראשוני", "מספר שלם גדול מ־1 שמתחלק רק ב־1 ובעצמו"],
      ["Composite number", "a whole number greater than 1 that has more than two factors", "מספר פריק", "מספר שלם גדול מ־1 שיש לו יותר משני מחלקים"],
      ["Divisibility rule for 3", "a number divides by 3 if the sum of its digits does", "סימן ההתחלקות ב־3", "מספר מתחלק ב־3 אם סכום הספרות שלו מתחלק ב־3"],
      ["Common factor", "a number that divides two or more numbers exactly", "מחלק משותף", "מספר שמחלק שניים או יותר מספרים בדיוק"],
    ],
    q: [
      [["Which number is prime?", "13", ["15", "21", "1"], "13 has only the factors 1 and 13. 15 = 3 × 5, 21 = 3 × 7, and 1 is not prime."],
        ["איזה מספר ראשוני?", "13", ["15", "21", "1"], "ל־13 יש רק את המחלקים 1 ו־13. 15 = 3 × 5, 21 = 3 × 7, ו־1 אינו ראשוני."]],
      [["Does 471 divide by 3?", "Yes, because 4 + 7 + 1 = 12", ["No, because it is an odd number", "No, because it ends in 1", "Only if it divides by 9"], "12 divides by 3, so 471 does too: 471 = 3 × 157."],
        ["האם 471 מתחלק ב־3?", "כן, כי 4 + 7 + 1 = 12", ["לא, כי הוא מספר אי־זוגי", "לא, כי הוא מסתיים ב־1", "רק אם הוא מתחלק ב־9"], "12 מתחלק ב־3, ולכן גם 471: 471 = 3 × 157."]],
      [["Which of these numbers is composite?", "57", ["53", "59", "61"], "57 = 3 × 19, so it has more than two factors (5 + 7 = 12 divides by 3). 53, 59 and 61 are all prime, and 57 only looks like them."],
        ["איזה מהמספרים האלה פריק?", "57", ["53", "59", "61"], "57 = 3 × 19, ולכן יש לו יותר משני מחלקים (5 + 7 = 12 מתחלק ב־3). 53, 59 ו־61 כולם ראשוניים, ו־57 רק נראה כמוהם."]],
      [["Which number divides by 6?", "78", ["64", "93", "85"], "A number divides by 6 when it is even and also divides by 3. 78 is even and 7 + 8 = 15 divides by 3, so 78 = 6 × 13. 64 is even but 6 + 4 = 10 does not divide by 3, and 93 divides by 3 but is odd.", "A multiple of 6 must divide by both 2 and 3."],
        ["איזה מספר מתחלק ב־6?", "78", ["64", "93", "85"], "מספר מתחלק ב־6 כשהוא זוגי וגם מתחלק ב־3. 78 זוגי ו־7 + 8 = 15 מתחלק ב־3, ולכן 78 = 6 × 13. 64 זוגי אבל 6 + 4 = 10 לא מתחלק ב־3, ו־93 מתחלק ב־3 אבל הוא אי־זוגי.", "כפולה של 6 חייבת להתחלק גם ב־2 וגם ב־3."]],
      [["What is the only even prime number?", "2", ["0", "4", "6"], "2 has exactly two factors, 1 and 2. Every other even number divides by 2 as well, so it has at least three factors and is not prime."],
        ["מהו המספר הראשוני הזוגי היחיד?", "2", ["0", "4", "6"], "ל־2 יש בדיוק שני מחלקים, 1 ו־2. כל מספר זוגי אחר מתחלק גם ב־2, ולכן יש לו לפחות שלושה מחלקים והוא לא ראשוני."]],
    ],
    n: [[25, ["How many prime numbers are there between 1 and 100?", "", "There are 25 primes below 100: 2, 3, 5, 7, 11, … , 89, 97."], ["כמה מספרים ראשוניים יש בין 1 ל־100?", "", "יש 25 מספרים ראשוניים מתחת ל־100: 2, 3, 5, 7, 11, … , 89, 97."]],
      [17, ["What is the sum of all the prime numbers below 10?", "", "The primes below 10 are 2, 3, 5 and 7, and 2 + 3 + 5 + 7 = 17."], ["מהו סכום כל המספרים הראשוניים הקטנים מ־10?", "", "המספרים הראשוניים הקטנים מ־10 הם 2, 3, 5 ו־7, ו־2 + 3 + 5 + 7 = 17."]],
      [9, ["How many factors does 36 have?", "", "The factors of 36 are 1, 2, 3, 4, 6, 9, 12, 18 and 36, which makes 9 factors."], ["כמה מחלקים יש ל־36?", "", "המחלקים של 36 הם 1, 2, 3, 4, 6, 9, 12, 18 ו־36, ולכן יש 9 מחלקים."]],
    ],
    s: [[["Finding the primes below 30 with the sieve of Eratosthenes, in order", "List the numbers from 2 to 30", "Circle 2 and cross out all of its multiples", "Circle the next number that is not crossed out, which is 3, and cross out its multiples", "Keep going: the numbers that are never crossed out are the primes"],
      ["מוצאים את המספרים הראשוניים עד 30 בעזרת נפת ארטוסתנס, לפי הסדר", "רושמים את המספרים מ־2 עד 30", "מקיפים את 2 בעיגול ומוחקים את כל הכפולות שלו", "מקיפים את המספר הבא שלא נמחק, שהוא 3, ומוחקים את הכפולות שלו", "ממשיכים כך: המספרים שלא נמחקים אף פעם הם הראשוניים"]]],
  },
  a: {
    t: [
      ["Prime factorisation", "writing a number as a product of primes, like 60 = 2² × 3 × 5", "פירוק לגורמים ראשוניים", "כתיבת מספר כמכפלה של מספרים ראשוניים, כמו 60 = 2² × 3 × 5"],
      ["Greatest common divisor", "the largest number that divides two numbers exactly", "המחלק המשותף הגדול ביותר", "המספר הגדול ביותר שמחלק שני מספרים בדיוק"],
      ["Least common multiple", "the smallest number that is a multiple of two numbers", "הכפולה המשותפת הקטנה ביותר", "המספר הקטן ביותר שהוא כפולה של שני מספרים"],
      ["Co-prime", "two numbers whose only common factor is 1, like 8 and 15", "מספרים זרים", "שני מספרים שהמחלק המשותף היחיד שלהם הוא 1, כמו 8 ו־15"],
    ],
    q: [
      [["What is the prime factorisation of 84?", "2² × 3 × 7", ["4 × 21", "2 × 42", "2 × 3 × 14"], "84 = 2 × 42 = 2 × 2 × 21 = 2² × 3 × 7 — only primes at the end."],
        ["מהו הפירוק לגורמים ראשוניים של 84?", "2² × 3 × 7", ["4 × 21", "2 × 42", "2 × 3 × 14"], "84 = 2 × 42 = 2 × 2 × 21 = 2² × 3 × 7 — בסוף נשארים רק ראשוניים."]],
      [["Two lights flash every 6 and every 8 seconds. They flash together now. When do they next flash together?", "In 24 seconds", ["In 48 seconds", "In 14 seconds", "In 2 seconds"], "The next time is the least common multiple of 6 and 8: 24."],
        ["שתי נורות מהבהבות כל 6 וכל 8 שניות. הן הבהבו יחד עכשיו. מתי יהבהבו יחד שוב?", "בעוד 24 שניות", ["בעוד 48 שניות", "בעוד 14 שניות", "בעוד 2 שניות"], "הפעם הבאה היא הכפולה המשותפת הקטנה ביותר של 6 ו־8: 24."]],
      [["Which pair of numbers is co-prime?", "9 and 16", ["6 and 9", "8 and 12", "10 and 15"], "9 = 3² and 16 = 2⁴ have no prime factor in common, so their only common factor is 1, even though neither of them is prime. 6 and 9 share 3, 8 and 12 share 4, and 10 and 15 share 5.", "Look for a factor that both numbers share."],
        ["איזה זוג מספרים הם מספרים זרים?", "9 ו־16", ["6 ו־9", "8 ו־12", "10 ו־15"], "9 = 3² ו־16 = 2⁴ אין להם גורם ראשוני משותף, ולכן המחלק המשותף היחיד שלהם הוא 1, אף שאף אחד מהם אינו ראשוני. ל־6 ול־9 יש מחלק משותף 3, ל־8 ול־12 יש 4, ול־10 ול־15 יש 5.", "חפשו מחלק ששני המספרים חולקים."]],
      [["Is 91 a prime number?", "No, because 91 = 7 × 13", ["Yes, because it is not divisible by 2, 3 or 5", "Yes, because it is odd and ends in 1", "Yes, because only 1 and 91 divide it"], "7 × 13 = 91, so 91 has more factors than 1 and itself. It passes the quick tests for 2, 3 and 5, which is why it looks prime, but it is composite."],
        ["האם 91 הוא מספר ראשוני?", "לא, כי 91 = 7 × 13", ["כן, כי הוא לא מתחלק ב־2, ב־3 או ב־5", "כן, כי הוא אי־זוגי ומסתיים ב־1", "כן, כי רק 1 ו־91 מחלקים אותו"], "7 × 13 = 91, ולכן ל־91 יש יותר מחלקים מ־1 ומעצמו. הוא עובר את הבדיקות המהירות של 2, 3 ו־5, ולכן הוא נראה ראשוני, אבל הוא פריק."]],
      [["Which number has the prime factorisation 2³ × 3?", "24", ["18", "12", "36"], "2³ = 8 and 8 × 3 = 24. The other numbers are 18 = 2 × 3², 12 = 2² × 3 and 36 = 2² × 3²."],
        ["לאיזה מספר יש הפירוק לגורמים ראשוניים 2³ × 3?", "24", ["18", "12", "36"], "2³ = 8 ו־8 × 3 = 24. המספרים האחרים הם 18 = 2 × 3², 12 = 2² × 3 ו־36 = 2² × 3²."]],
      [["What is the least common multiple of 4 and 10?", "20", ["40", "14", "2"], "Multiples of 4: 4, 8, 12, 16, 20. Multiples of 10: 10, 20. The first number in both lists is 20. 40 is also a common multiple, but not the least one."],
        ["מהי הכפולה המשותפת הקטנה ביותר של 4 ו־10?", "20", ["40", "14", "2"], "הכפולות של 4: 4, 8, 12, 16, 20. הכפולות של 10: 10, 20. המספר הראשון שנמצא בשתי הרשימות הוא 20. גם 40 הוא כפולה משותפת, אבל לא הקטנה ביותר."]],
    ],
    n: [
      [12, ["What is the greatest common divisor of 36 and 60?", "", "36 = 2² × 3², 60 = 2² × 3 × 5; the common part is 2² × 3 = 12."], ["מהו המחלק המשותף הגדול ביותר של 36 ו־60?", "", "36 = 2² × 3², 60 = 2² × 3 × 5; החלק המשותף הוא 2² × 3 = 12."]],
      [36, ["What is the least common multiple of 12 and 18?", "", "12 = 2² × 3 and 18 = 2 × 3². Take the highest power of each prime: 2² × 3² = 4 × 9 = 36."], ["מהי הכפולה המשותפת הקטנה ביותר של 12 ו־18?", "", "12 = 2² × 3 ו־18 = 2 × 3². לוקחים את החזקה הגבוהה ביותר של כל ראשוני: 2² × 3² = 4 × 9 = 36."]],
    ],
    s: [[["Finding the greatest common divisor of 18 and 24 with prime factors, in order", "Write each number as a product of primes: 18 = 2 × 3² and 24 = 2³ × 3", "Find the primes that appear in both numbers: 2 and 3", "Take the smaller power of each one: 2¹ and 3¹", "Multiply them: 2 × 3 = 6"],
      ["מוצאים את המחלק המשותף הגדול ביותר של 18 ו־24 בעזרת גורמים ראשוניים, לפי הסדר", "כותבים כל מספר כמכפלת ראשוניים: 18 = 2 × 3² ו־24 = 2³ × 3", "מוצאים את הראשוניים שמופיעים בשני המספרים: 2 ו־3", "לוקחים את החזקה הקטנה יותר של כל אחד: 2¹ ו־3¹", "כופלים אותם: 2 × 3 = 6"]]],
  },
};
export default c;
