import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Commutative property", "the rule that changing the order of the numbers does not change a sum or a product", "חוק החילוף", "הכלל שלפיו שינוי סדר המספרים לא משנה סכום או מכפלה"],
      ["Zero property of multiplication", "the rule that any number multiplied by 0 gives 0", "תכונת האפס בכפל", "הכלל שלפיו כל מספר שכופלים ב־0 נותן 0"],
    ],
    q: [
      [["Which is equal to 7 + 5?", "5 + 7", ["7 − 5", "7 × 5", "75"], "Adding in a different order gives the same sum: 7 + 5 = 5 + 7 = 12. This is the commutative property. 7 − 5 is only 2."],
        ["איזה תרגיל שווה ל־7 + 5?", "5 + 7", ["7 − 5", "7 × 5", "75"], "חיבור בסדר אחר נותן אותו סכום: 7 + 5 = 5 + 7 = 12. זה חוק החילוף. התרגיל 7 − 5 שווה רק 2."]],
      [["What is 0 × 58?", "0", ["58", "1", "580"], "Zero groups of 58 is nothing at all, so any number times 0 is 0. 58 would be the answer to 1 × 58."],
        ["כמה זה 0 × 58?", "0", ["58", "1", "580"], "אפס קבוצות של 58 הן כלום, ולכן כל מספר כפול 0 הוא 0. התשובה 58 מתאימה ל־1 × 58."]],
      [["What is 1 × 46?", "46", ["47", "1", "0"], "One group of 46 is just 46: multiplying by 1 leaves a number as it is. 47 is 1 + 46, an addition."],
        ["כמה זה 1 × 46?", "46", ["47", "1", "0"], "קבוצה אחת של 46 היא פשוט 46: כפל ב־1 משאיר את המספר כמו שהוא. המספר 47 הוא 1 + 46, חיבור."]],
      [["Does 9 − 4 give the same answer as 4 − 9?", "No, changing the order changes a subtraction", ["Yes, because both answers are 5", "Yes, order never matters in any calculation", "Only when both numbers are even"], "9 − 4 = 5, but taking 9 away from 4 does not give 5. The order can be swapped in adding and multiplying, but not in subtracting or dividing."],
        ["האם 9 − 4 נותן אותה תוצאה כמו 4 − 9?", "לא, שינוי הסדר משנה תרגיל חיסור", ["כן, כי בשני התרגילים התשובה היא 5", "כן, הסדר אף פעם לא משנה בשום חישוב", "רק כששני המספרים זוגיים"], "9 − 4 = 5, אבל אם מורידים 9 מ־4 לא מקבלים 5. בחיבור ובכפל מותר להחליף את הסדר, אבל לא בחיסור ולא בחילוק."]],
      [["Ella works out 4 + 17 + 6 by adding 4 + 6 first. What does she get?", "27", ["21", "26", "37"], "4 + 6 = 10, and 10 + 17 = 27. Changing the order of the numbers in a sum does not change the total, so pairing 4 with 6 first is allowed."],
        ["אלה מחשבת את 4 + 17 + 6, ומחברת קודם 4 + 6. מה היא מקבלת?", "27", ["21", "26", "37"], "4 + 6 = 10, ו־10 + 17 = 27. שינוי סדר המספרים בחיבור לא משנה את הסכום, ולכן מותר לחבר קודם את 4 ואת 6."]],
    ],
    n: [
      [35, ["If 7 × 5 = 35, what is 5 × 7?", "", "Changing the order of a multiplication does not change the product, so 5 × 7 = 35 too."],
        ["אם 7 × 5 = 35, כמה זה 5 × 7?", "", "שינוי הסדר בכפל לא משנה את המכפלה, ולכן גם 5 × 7 = 35."]],
      [72, ["What is 72 + 0?", "", "Adding 0 leaves a number unchanged, so 72 + 0 = 72."],
        ["כמה זה 72 + 0?", "", "הוספה של 0 משאירה את המספר כמו שהוא, ולכן 72 + 0 = 72."]],
    ],
    s: [[["Working out 8 + 9 + 2 the smart way, in order", "Notice that 8 and 2 make 10", "Add them first: 8 + 2 = 10", "Then add the 9: 10 + 9 = 19"],
      ["מחשבים את 8 + 9 + 2 בדרך חכמה, לפי הסדר", "שמים לב ש־8 ו־2 הם יחד 10", "מחברים אותם קודם: 8 + 2 = 10", "אחר כך מוסיפים את ה־9: 10 + 9 = 19"]]],
  },
  i: {
    t: [
      ["Associative property", "the rule that the way numbers are grouped in brackets does not change a sum or a product", "חוק הקיבוץ", "הכלל שלפיו הדרך שבה מקבצים מספרים בסוגריים לא משנה סכום או מכפלה"],
      ["Identity element", "a number that leaves others unchanged: 0 for adding and 1 for multiplying", "איבר נייטרלי", "מספר שלא משנה מספרים אחרים: 0 בחיבור ו־1 בכפל"],
      ["Brackets", "the symbols ( ) that show which part of a calculation is done first", "סוגריים", "הסימנים ( ) שמראים איזה חלק בתרגיל מחשבים קודם"],
    ],
    q: [
      [["Which is equal to (6 × 5) × 2?", "6 × (5 × 2)", ["(6 + 5) × 2", "6 × 5 + 2", "6 + (5 × 2)"], "In a product the grouping can change: (6 × 5) × 2 = 30 × 2 = 60 and 6 × (5 × 2) = 6 × 10 = 60. This is the associative property."],
        ["איזה תרגיל שווה ל־(6 × 5) × 2?", "6 × (5 × 2)", ["(6 + 5) × 2", "6 × 5 + 2", "6 + (5 × 2)"], "בכפל מותר לשנות את הקיבוץ: (6 × 5) × 2 = 30 × 2 = 60, וגם 6 × (5 × 2) = 6 × 10 = 60. זה חוק הקיבוץ."]],
      [["Which of these is NOT always true?", "a − b = b − a", ["a + b = b + a", "a × b = b × a", "a × 1 = a"], "Subtraction cannot be swapped: 8 − 3 = 5, but 3 − 8 does not equal 5. Adding and multiplying can be swapped, and multiplying by 1 changes nothing."],
        ["איזה מהשוויונות אינו נכון תמיד?", "a − b = b − a", ["a + b = b + a", "a × b = b × a", "a × 1 = a"], "בחיסור אי אפשר להחליף את הסדר: 8 − 3 = 5, אבל 3 − 8 אינו שווה 5. בחיבור ובכפל מותר להחליף, וכפל ב־1 לא משנה דבר."]],
      [["Is (24 ÷ 4) ÷ 2 equal to 24 ÷ (4 ÷ 2)?", "No: the first is 3 and the second is 12", ["Yes: both of them are equal to 3", "Yes: both of them are equal to 12", "No: the first is 12 and the second is 3"], "Division has no grouping rule: (24 ÷ 4) ÷ 2 = 6 ÷ 2 = 3, but 24 ÷ (4 ÷ 2) = 24 ÷ 2 = 12. Moving the brackets changed the answer."],
        ["האם (24 ÷ 4) ÷ 2 שווה ל־24 ÷ (4 ÷ 2)?", "לא: הראשון שווה 3 והשני שווה 12", ["כן: שניהם שווים 3", "כן: שניהם שווים 12", "לא: הראשון שווה 12 והשני שווה 3"], "בחילוק אין חוק קיבוץ: (24 ÷ 4) ÷ 2 = 6 ÷ 2 = 3, אבל 24 ÷ (4 ÷ 2) = 24 ÷ 2 = 12. הזזת הסוגריים שינתה את התוצאה."]],
      [["What is 25 × 17 × 4?", "1,700", ["1,600", "170", "17,000"], "Multiply 25 × 4 first, which the commutative and associative properties allow: 25 × 4 = 100, and 100 × 17 = 1,700.", "Which two of the numbers make 100?"],
        ["כמה זה 25 × 17 × 4?", "1,700", ["1,600", "170", "17,000"], "כופלים קודם 25 × 4, וחוקי החילוף והקיבוץ מתירים זאת: 25 × 4 = 100, ו־100 × 17 = 1,700.", "אילו שניים מהמספרים נותנים יחד 100?"]],
      [["53 × x = 53. What is x?", "1", ["0", "53", "2"], "1 is the identity for multiplication: multiplying by 1 leaves 53 as it is. Multiplying by 0 would give 0, and by 53 would give 2,809."],
        ["53 × x = 53. מהו x?", "1", ["0", "53", "2"], "1 הוא האיבר הנייטרלי של הכפל: כפל ב־1 משאיר את 53 כמו שהוא. כפל ב־0 היה נותן 0, וכפל ב־53 היה נותן 2,809."]],
    ],
    n: [
      [148, ["What is 37 + 48 + 63?", "", "Group 37 and 63 first: 37 + 63 = 100, then 100 + 48 = 148. Grouping the numbers differently does not change the sum.", "Which two numbers make 100?"],
        ["כמה זה 37 + 48 + 63?", "", "מקבצים קודם את 37 ו־63: 37 + 63 = 100, ואז 100 + 48 = 148. קיבוץ אחר של המספרים לא משנה את הסכום.", "אילו שני מספרים נותנים יחד 100?"]],
      [6300, ["What is 2 × 63 × 50?", "", "Group 2 and 50 first: 2 × 50 = 100, and 100 × 63 = 6,300."],
        ["כמה זה 2 × 63 × 50?", "", "מקבצים קודם את 2 ו־50: 2 × 50 = 100, ו־100 × 63 = 6,300."]],
    ],
    s: [[["Working out 5 × 13 × 2 the smart way, in order", "Swap the order: 5 × 2 × 13", "Group the 5 and the 2: (5 × 2) × 13", "Work out the brackets: 10 × 13", "Finish: 10 × 13 = 130"],
      ["מחשבים את 5 × 13 × 2 בדרך חכמה, לפי הסדר", "מחליפים את הסדר: 5 × 2 × 13", "מקבצים את 5 ואת 2: (5 × 2) × 13", "מחשבים את הסוגריים: 10 × 13", "מסיימים: 10 × 13 = 130"]]],
  },
  a: {
    t: [
      ["Distributive property", "the rule that multiplying a sum equals multiplying each part and adding: a × (b + c) = a × b + a × c", "חוק הפילוג", "הכלל שלפיו כפל של סכום שווה לכפל של כל חלק בנפרד ואז חיבור: a × (b + c) = a × b + a × c"],
      ["Taking out a common factor", "rewriting a × b + a × c as a × (b + c)", "הוצאת גורם משותף", "כתיבה מחדש של a × b + a × c בצורה a × (b + c)"],
      ["Expanding brackets", "multiplying every part inside a bracket so that the bracket disappears, like 3 × (10 + 2) = 30 + 6", "פתיחת סוגריים", "כפל של כל איבר שבתוך הסוגריים, כך שהם נעלמים, כמו 3 × (10 + 2) = 30 + 6"],
    ],
    q: [
      [["Which is equal to 6 × (10 + 3)?", "6 × 10 + 6 × 3", ["6 × 10 + 3", "6 × 10 + 3 × 10", "6 × 10 × 3"], "The 6 multiplies both parts of the bracket: 6 × 10 + 6 × 3 = 60 + 18 = 78. 6 × 10 + 3 forgets to multiply the 3 by 6."],
        ["איזה תרגיל שווה ל־6 × (10 + 3)?", "6 × 10 + 6 × 3", ["6 × 10 + 3", "6 × 10 + 3 × 10", "6 × 10 × 3"], "ה־6 כופל את שני החלקים שבסוגריים: 6 × 10 + 6 × 3 = 60 + 18 = 78. התרגיל 6 × 10 + 3 שוכח לכפול את 3 ב־6."]],
      [["What is 8 × 99?", "792", ["800", "808", "791"], "99 = 100 − 1, so 8 × 99 = 8 × 100 − 8 × 1 = 800 − 8 = 792. 808 adds the 8 instead of taking it away.", "99 = 100 − 1"],
        ["כמה זה 8 × 99?", "792", ["800", "808", "791"], "99 = 100 − 1, ולכן 8 × 99 = 8 × 100 − 8 × 1 = 800 − 8 = 792. התשובה 808 מוסיפה את ה־8 במקום להוריד אותו.", "99 = 100 − 1"]],
      [["Which expression is equal to 7 × 6 + 7 × 4?", "7 × 10", ["14 × 10", "7 × 24", "49 × 10"], "Both parts have a 7, so take it out: 7 × 6 + 7 × 4 = 7 × (6 + 4) = 7 × 10 = 70. 14 × 10 counts the 7 twice."],
        ["איזה ביטוי שווה ל־7 × 6 + 7 × 4?", "7 × 10", ["14 × 10", "7 × 24", "49 × 10"], "בשני החלקים יש 7, ולכן מוציאים אותו: 7 × 6 + 7 × 4 = 7 × (6 + 4) = 7 × 10 = 70. בביטוי 14 × 10 ה־7 נספר פעמיים."]],
      [["Is 60 ÷ (2 + 3) equal to 60 ÷ 2 + 60 ÷ 3?", "No: 60 ÷ 5 = 12, but 30 + 20 = 50", ["Yes: both sides are equal to 50", "Yes: both sides are equal to 12", "Yes, because division works just like multiplication"], "60 ÷ (2 + 3) = 60 ÷ 5 = 12, while 60 ÷ 2 + 60 ÷ 3 = 30 + 20 = 50. Dividing by a sum cannot be split up like this, although dividing a sum can: (60 + 30) ÷ 3 = 20 + 10."],
        ["האם 60 ÷ (2 + 3) שווה ל־60 ÷ 2 + 60 ÷ 3?", "לא: 60 ÷ 5 = 12, אבל 30 + 20 = 50", ["כן: שני הצדדים שווים 50", "כן: שני הצדדים שווים 12", "כן, כי חילוק מתנהג בדיוק כמו כפל"], "60 ÷ (2 + 3) = 60 ÷ 5 = 12, ואילו 60 ÷ 2 + 60 ÷ 3 = 30 + 20 = 50. חילוק בסכום אי אפשר לפצל כך, אבל חילוק של סכום אפשר: (60 + 30) ÷ 3 = 20 + 10."]],
      [["Which of these statements about 0 and 1 is true?", "Any number divided by 1 stays the same", ["Any number divided by 0 gives 0", "Any number plus 1 stays the same", "Zero divided by any other number always equals 1"], "Dividing by 1 changes nothing, as in 9 ÷ 1 = 9. Dividing by 0 has no answer at all, and 0 divided by a number other than 0 is 0, not 1."],
        ["איזו מהטענות על 0 ועל 1 נכונה?", "כל מספר שמחלקים ב־1 נשאר כמו שהוא", ["כל מספר שמחלקים ב־0 נותן 0", "כל מספר שמוסיפים לו 1 נשאר כמו שהוא", "אפס שמחלקים בכל מספר אחר נותן תמיד 1"], "חילוק ב־1 לא משנה דבר, כמו 9 ÷ 1 = 9. לחילוק ב־0 אין תשובה בכלל, ו־0 שמחלקים במספר שאינו 0 נותן 0, לא 1."]],
    ],
    n: [
      [184, ["What is 23 × 8?", "", "Split 23 into 20 + 3: 20 × 8 = 160 and 3 × 8 = 24, so 23 × 8 = 160 + 24 = 184.", "23 = 20 + 3"],
        ["כמה זה 23 × 8?", "", "מפרקים את 23 ל־20 + 3: 20 × 8 = 160 ו־3 × 8 = 24, ולכן 23 × 8 = 160 + 24 = 184.", "23 = 20 + 3"]],
      [500, ["What is 5 × 37 + 5 × 63?", "", "Take out the common factor 5: 5 × (37 + 63) = 5 × 100 = 500."],
        ["כמה זה 5 × 37 + 5 × 63?", "", "מוציאים את הגורם המשותף 5: 5 × (37 + 63) = 5 × 100 = 500."]],
    ],
    s: [[["Working out 47 × 6 with the distributive property, in order", "Split 47 into 40 + 7", "Multiply each part by 6: 40 × 6 = 240 and 7 × 6 = 42", "Add the two parts: 240 + 42", "Write the answer: 282"],
      ["מחשבים 47 × 6 בעזרת חוק הפילוג, לפי הסדר", "מפרקים את 47 ל־40 + 7", "כופלים כל חלק ב־6: 40 × 6 = 240 ו־7 × 6 = 42", "מחברים את שני החלקים: 240 + 42", "כותבים את התשובה: 282"]]],
  },
};
export default c;
