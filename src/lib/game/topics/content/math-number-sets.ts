import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Natural numbers", "the counting numbers 1, 2, 3, 4 and so on", "מספרים טבעיים", "מספרי הספירה 1, 2, 3, 4 וכן הלאה"],
      ["Integers", "the counting numbers, their negatives and zero: …, −2, −1, 0, 1, 2, …", "מספרים שלמים", "מספרי הספירה, המספרים הנגדיים להם והאפס: …, −2, −1, 0, 1, 2, …"],
      ["Negative number", "a number smaller than zero, such as −5", "מספר שלילי", "מספר קטן מאפס, כמו −5"],
      ["Number line", "a straight line with numbers marked on it in order, at equal steps", "ציר המספרים", "קו ישר שמסומנים עליו מספרים לפי הסדר, במרווחים שווים"],
    ],
    q: [
      [["Which of these is an integer but not a natural number?", "−4", ["2.5", "4", "3/4"], "−4 is a whole number below zero, so it is an integer, but the counting numbers start at 1. 4 is a natural number, and 2.5 and 3/4 are not integers at all."],
        ["איזה מהמספרים האלה הוא מספר שלם אבל לא מספר טבעי?", "−4", ["2.5", "4", "3/4"], "−4 הוא מספר שלם שקטן מאפס, אבל מספרי הספירה מתחילים ב־1. 4 הוא מספר טבעי, ו־2.5 ו־3/4 אינם מספרים שלמים בכלל."]],
      [["Which statement is true?", "Every natural number is also an integer", ["Every integer, even a negative one, is also a natural number", "No negative number is an integer", "Zero is a negative number"], "The integers contain all the counting numbers plus zero and the negatives, so every natural number is an integer. The reverse fails: −3 is an integer but not a natural number."],
        ["איזו טענה נכונה?", "כל מספר טבעי הוא גם מספר שלם", ["כל מספר שלם, גם שלילי, הוא גם מספר טבעי", "אף מספר שלילי אינו מספר שלם", "אפס הוא מספר שלילי"], "המספרים השלמים כוללים את כל מספרי הספירה, את האפס ואת המספרים השליליים, ולכן כל מספר טבעי הוא מספר שלם. ההפך לא נכון: −3 הוא מספר שלם אבל לא טבעי."]],
      [["Which list is in order from smallest to largest?", "−5, −1, 0, 3", ["−1, −5, 0, 3", "0, −1, −5, 3", "3, 0, −1, −5"], "On the number line numbers grow from left to right: −5 is further left than −1, then come 0 and 3. −1 is larger than −5, even though 1 is smaller than 5."],
        ["איזו רשימה מסודרת מהקטן לגדול?", "−5, −1, 0, 3", ["−1, −5, 0, 3", "0, −1, −5, 3", "3, 0, −1, −5"], "על ציר המספרים המספרים גדלים משמאל לימין: −5 נמצא שמאלה יותר מ־−1, ואחריהם באים 0 ו־3. −1 גדול מ־−5, אף על פי ש־1 קטן מ־5."]],
      [["The temperature is −3° in the morning and 5° at noon. How many degrees warmer is it at noon?", "8", ["2", "−8", "5"], "From −3 up to 0 is 3 degrees, and from 0 up to 5 is 5 more: 3 + 5 = 8. The answer 2 comes from 5 − 3, which forgets that the morning was below zero."],
        ["בבוקר הטמפרטורה היא −3° ובצהריים 5°. בכמה מעלות חם יותר בצהריים?", "8", ["2", "−8", "5"], "מ־−3 עד 0 יש 3 מעלות, ומ־0 עד 5 יש עוד 5: 3 + 5 = 8. התשובה 2 מתקבלת מ־5 − 3, ושוכחת שבבוקר היה מתחת לאפס."]],
      [["Which number is the opposite of 7?", "−7", ["1/7", "0", "70"], "Opposite numbers lie at the same distance from 0 on the two sides of the number line, so the opposite of 7 is −7. 1/7 is the reciprocal of 7, not its opposite."],
        ["מהו המספר הנגדי ל־7?", "−7", ["1/7", "0", "70"], "מספרים נגדיים נמצאים באותו מרחק מ־0 משני צידי ציר המספרים, ולכן המספר הנגדי ל־7 הוא −7. 1/7 הוא המספר ההופכי ל־7, ולא הנגדי לו."]],
    ],
    n: [
      [5, ["How many integers lie between −3 and 3, not counting −3 and 3 themselves?", "", "They are −2, −1, 0, 1 and 2: that is 5 integers. Do not forget to count 0."],
        ["כמה מספרים שלמים יש בין −3 ל־3, בלי לספור את −3 ואת 3 עצמם?", "", "המספרים הם −2, −1, 0, 1 ו־2: יש 5 מספרים שלמים. אל תשכחו לספור את 0."]],
    ],
  },
  i: {
    t: [
      ["Rational number", "any number that can be written as a fraction a/b of two integers, where b is not zero", "מספר רציונלי", "כל מספר שאפשר לכתוב כשבר a/b של שני מספרים שלמים, כאשר b אינו אפס"],
      ["Terminating decimal", "a decimal that ends after a limited number of digits, like 0.375", "שבר עשרוני סופי", "שבר עשרוני שנגמר אחרי מספר מוגבל של ספרות, כמו 0.375"],
      ["Repeating decimal", "a decimal in which a block of digits goes on repeating forever, like 0.272727…", "שבר עשרוני מחזורי", "שבר עשרוני שבו קבוצת ספרות חוזרת שוב ושוב בלי סוף, כמו 0.272727…"],
    ],
    q: [
      [["Which fraction gives a repeating decimal?", "1/3", ["3/8", "1/4", "1/5"], "1/3 = 0.333…, with the 3 repeating forever. The others end: 3/8 = 0.375, 1/4 = 0.25 and 1/5 = 0.2."],
        ["איזה שבר נותן שבר עשרוני מחזורי?", "1/3", ["3/8", "1/4", "1/5"], "1/3 = 0.333…, והספרה 3 חוזרת בלי סוף. השאר נגמרים: 3/8 = 0.375, 1/4 = 0.25 ו־1/5 = 0.2."]],
      [["Why is 5 a rational number?", "Because 5 = 5/1", ["Because it is a positive number", "Because it has only one digit", "Because it is an odd number"], "A rational number is one that can be written as a fraction of two integers, and 5 = 5/1. Every integer is rational in the same way."],
        ["למה 5 הוא מספר רציונלי?", "כי 5 = 5/1", ["כי הוא מספר חיובי", "כי יש בו רק ספרה אחת", "כי הוא מספר אי־זוגי"], "מספר רציונלי הוא מספר שאפשר לכתוב כשבר של שני מספרים שלמים, ו־5 = 5/1. באותה דרך כל מספר שלם הוא רציונלי."]],
      [["Write 0.4 as a fraction in its simplest form.", "2/5", ["1/4", "4/100", "4/9"], "0.4 is four tenths, 4/10, and dividing top and bottom by 2 gives 2/5. 4/100 is 0.04 and 4/9 is 0.444…"],
        ["כתבו את 0.4 כשבר מצומצם.", "2/5", ["1/4", "4/100", "4/9"], "0.4 הם ארבע עשיריות, 4/10, וכשמחלקים את המונה ואת המכנה ב־2 מקבלים 2/5. 4/100 הוא 0.04, ו־4/9 הוא 0.444…"]],
      [["Which decimal is equal to 7/8?", "0.875", ["0.785", "0.857", "0.78"], "7 ÷ 8 = 0.875. You can check it: 1/8 = 0.125, and 7 × 0.125 = 0.875."],
        ["איזה שבר עשרוני שווה ל־7/8?", "0.875", ["0.785", "0.857", "0.78"], "7 ÷ 8 = 0.875. אפשר לבדוק: 1/8 = 0.125, ו־7 × 0.125 = 0.875."]],
      [["Between which two consecutive integers does −2.5 lie?", "Between −3 and −2", ["Between −2 and −1", "Between 2 and 3", "Between −4 and −3"], "On the number line −2.5 is halfway between −3 and −2. It is smaller than −2, so it is not between −2 and −1."],
        ["בין אילו שני מספרים שלמים עוקבים נמצא −2.5?", "בין −3 לבין −2", ["בין −2 לבין −1", "בין 2 לבין 3", "בין −4 לבין −3"], "על ציר המספרים −2.5 נמצא בדיוק באמצע בין −3 לבין −2. הוא קטן מ־−2, ולכן הוא לא נמצא בין −2 לבין −1."]],
    ],
    n: [
      [8, ["0.125 = 1/x. What is x?", "", "0.125 is 125 thousandths, 125/1000, and dividing top and bottom by 125 gives 1/8, so x = 8."],
        ["0.125 = 1/x. מהו x?", "", "0.125 הם 125 אלפיות, 125/1000, וכשמחלקים את המונה ואת המכנה ב־125 מקבלים 1/8, ולכן x = 8."]],
      [9, ["1/11 = 0.090909… What is the 20th digit after the decimal point?", "", "The digits repeat in the block 0, 9: the odd places hold 0 and the even places hold 9. The 20th place is even, so the digit is 9."],
        ["1/11 = 0.090909… מהי הספרה ה־20 אחרי הנקודה העשרונית?", "", "הספרות חוזרות בקבוצה 0, 9: במקומות האי־זוגיים יש 0 ובמקומות הזוגיים יש 9. המקום ה־20 זוגי, ולכן הספרה היא 9."]],
    ],
    s: [
      [["From smallest to largest", "−1.5", "−1/4", "0.3", "1/3", "0.35"],
        ["מהקטן לגדול", "−1.5", "−1/4", "0.3", "1/3", "0.35"]],
    ],
  },
  a: {
    t: [
      ["Irrational number", "a number on the number line that cannot be written as a fraction of two integers", "מספר אי־רציונלי", "מספר על ציר המספרים שאי אפשר לכתוב כשבר של שני מספרים שלמים"],
      ["Real numbers", "all the rational and irrational numbers together, filling the whole number line", "מספרים ממשיים", "כל המספרים הרציונליים והאי־רציונליים יחד, שממלאים את כל ציר המספרים"],
      ["Perfect square", "a number that is the square of an integer, like 49 = 7²", "ריבוע שלם", "מספר שהוא ריבוע של מספר שלם, כמו 49 = 7²"],
    ],
    q: [
      [["Which of these numbers is irrational?", "√12", ["22/7", "0.121212…", "√16"], "12 is not a perfect square, so √12 (about 3.464) never ends or repeats. 22/7 is a fraction, 0.121212… repeats, and √16 = 4."],
        ["איזה מהמספרים האלה הוא אי־רציונלי?", "√12", ["22/7", "0.121212…", "√16"], "12 אינו ריבוע שלם, ולכן √12 (בערך 3.464) לא נגמר ולא מחזורי. 22/7 הוא שבר, 0.121212… מחזורי, ו־√16 = 4."]],
      [["Write 0.444… (the 4 repeats forever) as a fraction.", "4/9", ["2/5", "44/100", "4/90"], "Let x = 0.444…; then 10x = 4.444…, and subtracting gives 9x = 4, so x = 4/9. 2/5 = 0.4 exactly, which is a little smaller."],
        ["כתבו את 0.444… (הספרה 4 חוזרת בלי סוף) כשבר.", "4/9", ["2/5", "44/100", "4/90"], "נסמן x = 0.444…; אז 10x = 4.444…, והחיסור נותן 9x = 4, ולכן x = 4/9. 2/5 שווה ל־0.4 בדיוק, שקטן מעט יותר."]],
      [["Which statement is always true?", "Rational + irrational is always irrational", ["Irrational × irrational is always irrational", "Irrational + irrational is always irrational", "The square root of a whole number is irrational"], "If a rational plus an irrational were rational, subtracting the rational would make the irrational one rational. The others fail: √2 × √2 = 2, √2 + (−√2) = 0 and √9 = 3."],
        ["איזו טענה נכונה תמיד?", "רציונלי ועוד אי־רציונלי הוא תמיד אי־רציונלי", ["אי־רציונלי כפול אי־רציונלי הוא תמיד אי־רציונלי", "אי־רציונלי ועוד אי־רציונלי הוא תמיד אי־רציונלי", "השורש הריבועי של מספר שלם הוא אי־רציונלי"], "אילו רציונלי ועוד אי־רציונלי היה רציונלי, חיסור הרציונלי היה הופך את האי־רציונלי לרציונלי. האחרות לא תמיד נכונות: √2 × √2 = 2, √2 + (−√2) = 0 ו־√9 = 3."]],
      [["Which fraction gives a terminating decimal?", "7/40", ["5/12", "2/15", "1/6"], "A fraction in simplest form terminates only when its denominator has no prime factors other than 2 and 5. 40 = 2 × 2 × 2 × 5, so 7/40 = 0.175, while 12, 15 and 6 all have the factor 3."],
        ["איזה שבר נותן שבר עשרוני סופי?", "7/40", ["5/12", "2/15", "1/6"], "שבר מצומצם נותן שבר עשרוני סופי רק כשאין למכנה גורמים ראשוניים מלבד 2 ו־5. 40 = 2 × 2 × 2 × 5, ולכן 7/40 = 0.175, ואילו ל־12, ל־15 ול־6 יש הגורם 3."]],
      [["Is 0.999… (the 9 repeats forever) equal to 1?", "Yes, they are exactly equal", ["No, it is always a tiny bit less than 1", "No, because the 9s never stop", "Only after you round it"], "1/3 = 0.333…, and multiplying by 3 gives 3 × 1/3 = 1 on one side and 0.999… on the other. No number lies between them, so they are the same number."],
        ["האם 0.999… (הספרה 9 חוזרת בלי סוף) שווה ל־1?", "כן, הם שווים בדיוק", ["לא, הוא תמיד קטן מעט מאוד מ־1", "לא, כי ה־9 לא נגמרות לעולם", "רק אחרי שמעגלים אותו"], "1/3 = 0.333…, וכפל ב־3 נותן 3 × 1/3 = 1 בצד אחד ו־0.999… בצד השני. אין אף מספר ביניהם, ולכן זה אותו מספר."]],
    ],
    n: [
      [7, ["For how many whole numbers n from 1 to 50 is √n a rational number?", "", "√n is rational only when n is a perfect square: 1, 4, 9, 16, 25, 36 and 49. That is 7 numbers."],
        ["לכמה מספרים שלמים n מ־1 עד 50 המספר √n הוא רציונלי?", "", "√n רציונלי רק כאשר n הוא ריבוע שלם: 1, 4, 9, 16, 25, 36 ו־49. אלה 7 מספרים."]],
      [3, ["0.272727… = x/11. What is x?", "", "Two digits repeat, so 0.272727… = 27/99. Dividing top and bottom by 9 gives 3/11, so x = 3."],
        ["0.272727… = x/11. מהו x?", "", "שתי ספרות חוזרות, ולכן 0.272727… = 27/99. כשמחלקים את המונה ואת המכנה ב־9 מקבלים 3/11, ולכן x = 3."]],
    ],
    s: [
      [["From the smallest set to the largest, each inside the next", "Natural numbers", "Integers", "Rational numbers", "Real numbers"],
        ["מהקבוצה הקטנה לגדולה, כשכל אחת מוכלת בבאה", "המספרים הטבעיים", "המספרים השלמים", "המספרים הרציונליים", "המספרים הממשיים"]],
    ],
  },
};
export default c;
