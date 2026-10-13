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
    ],
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
      [["Does 471 divide by 3?", "Yes, because 4 + 7 + 1 = 12", ["No, because it is odd", "No, because it ends in 1", "Only if it divides by 9"], "12 divides by 3, so 471 does too: 471 = 3 × 157."],
        ["האם 471 מתחלק ב־3?", "כן, כי 4 + 7 + 1 = 12", ["לא, כי הוא אי־זוגי", "לא, כי הוא מסתיים ב־1", "רק אם הוא מתחלק ב־9"], "12 מתחלק ב־3, ולכן גם 471: 471 = 3 × 157."]],
    ],
    n: [[25, ["How many prime numbers are there between 1 and 100?", "", "There are 25 primes below 100: 2, 3, 5, 7, 11, … , 89, 97."], ["כמה מספרים ראשוניים יש בין 1 ל־100?", "", "יש 25 מספרים ראשוניים מתחת ל־100: 2, 3, 5, 7, 11, … , 89, 97."]]],
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
    ],
    n: [[12, ["What is the greatest common divisor of 36 and 60?", "", "36 = 2² × 3², 60 = 2² × 3 × 5; the common part is 2² × 3 = 12."], ["מהו המחלק המשותף הגדול ביותר של 36 ו־60?", "", "36 = 2² × 3², 60 = 2² × 3 × 5; החלק המשותף הוא 2² × 3 = 12."]]],
  },
};
export default c;
