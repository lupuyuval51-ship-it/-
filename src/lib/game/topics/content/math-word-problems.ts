import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Sum", "the result you get when you add numbers together", "סכום", "התוצאה שמקבלים כשמחברים מספרים"],
      ["Difference", "the result of taking one number away from another; it shows how much bigger one is", "הפרש", "התוצאה של חיסור מספר אחד ממספר אחר; היא מראה בכמה אחד גדול מהשני"],
      ["Product", "the result you get when you multiply numbers", "מכפלה", "התוצאה שמקבלים כשכופלים מספרים"],
    ],
    q: [
      [["Dana has 12 stickers and gets 7 more. Which calculation tells how many she has now?", "12 + 7", ["12 − 7", "12 × 7", "12 ÷ 7"], "She gets more stickers, so the amount grows and you add: 12 + 7 = 19 stickers."],
        ["לדנה יש 12 מדבקות והיא מקבלת עוד 7. איזה תרגיל אומר כמה מדבקות יש לה עכשיו?", "12 + 7", ["12 − 7", "12 × 7", "12 ÷ 7"], "היא מקבלת עוד מדבקות, ולכן הכמות גדלה ומחברים: 12 + 7 = 19 מדבקות."]],
      [["A box holds 6 eggs. How many eggs are in 4 full boxes?", "24", ["10", "64", "2"], "Each of the 4 boxes has 6 eggs, so multiply: 4 × 6 = 24. Adding 6 + 4 = 10 mixes up the number of boxes with the number of eggs."],
        ["בקופסה יש 6 ביצים. כמה ביצים יש ב־4 קופסאות מלאות?", "24", ["10", "64", "2"], "בכל אחת מ־4 הקופסאות יש 6 ביצים, ולכן כופלים: 4 × 6 = 24. החיבור 6 + 4 = 10 מערבב בין מספר הקופסאות למספר הביצים."]],
      [["Noa read 9 pages on Monday and 14 pages on Tuesday. How many more pages did she read on Tuesday?", "5", ["23", "14", "9"], "\"How many more\" asks for the difference between the two days: 14 − 9 = 5. Adding them gives 23, the total, which answers a different question."],
        ["נועה קראה 9 עמודים ביום שני ו־14 עמודים ביום שלישי. בכמה עמודים יותר היא קראה ביום שלישי?", "5", ["23", "14", "9"], "״בכמה יותר״ שואל על ההפרש בין שני הימים: 14 − 9 = 5. החיבור נותן 23, את הסך הכול, וזו תשובה לשאלה אחרת."]],
      [["What should you do first when you meet a word problem?", "Read it carefully and find out exactly what it asks", ["Add up all the numbers you can see anywhere in the problem", "Write down the biggest number in the problem", "Guess an answer and go on to the next one"], "You can only choose the right operations once you know what the question is asking. Grabbing the numbers and adding them often answers the wrong question."],
        ["מה כדאי לעשות קודם כול כשפוגשים בעיה מילולית?", "לקרוא אותה בעיון ולהבין מה בדיוק שואלים", ["לחבר את כל המספרים שמופיעים בכל מקום בבעיה", "לכתוב את המספר הגדול ביותר שמופיע בבעיה", "לנחש תשובה ולעבור לבעיה הבאה"], "אפשר לבחור את הפעולות הנכונות רק אחרי שמבינים מה השאלה. מי שתופס את המספרים ומחבר אותם עונה לעיתים קרובות על שאלה אחרת."]],
      [["A problem asks how many buses a school needs, and your calculation gives 3.5. What should you answer?", "4 buses, because half a bus cannot carry anyone", ["3.5 buses, exactly as the calculation says", "3 buses, because you always round down", "35 buses, because the decimal point is a mistake"], "The answer must make sense in the story: you cannot order half a bus, and 3 buses would leave some children behind, so the school needs 4."],
        ["בעיה שואלת כמה אוטובוסים בית הספר צריך, והחישוב נותן 3.5. מה עונים?", "4 אוטובוסים, כי חצי אוטובוס לא יכול להסיע אף אחד", ["3.5 אוטובוסים, בדיוק כמו שיצא בחישוב", "3 אוטובוסים, כי תמיד מעגלים כלפי מטה", "35 אוטובוסים, כי הנקודה העשרונית היא טעות בחישוב"], "התשובה צריכה להיות הגיונית בסיפור: אי אפשר להזמין חצי אוטובוס, ו־3 אוטובוסים ישאירו חלק מהילדים מאחור, ולכן צריך 4."]],
    ],
    n: [
      [6, ["24 sweets are shared equally among 4 children. How many sweets does each child get?", "", "Sharing equally means dividing: 24 ÷ 4 = 6 sweets each. Check: 4 × 6 = 24."],
        ["מחלקים 24 סוכריות שווה בשווה בין 4 ילדים. כמה סוכריות מקבל כל ילד?", "", "חלוקה שווה בשווה היא חילוק: 24 ÷ 4 = 6 סוכריות לכל ילד. בדיקה: 4 × 6 = 24."]],
      [30, ["A class has 5 rows of chairs with 6 chairs in each row. How many chairs are there?", "", "5 rows of 6 chairs is 5 × 6 = 30 chairs. You could also add 6 + 6 + 6 + 6 + 6 = 30."],
        ["בכיתה יש 5 שורות של כיסאות, ובכל שורה 6 כיסאות. כמה כיסאות יש בכיתה?", "", "5 שורות של 6 כיסאות הן 5 × 6 = 30 כיסאות. אפשר גם לחבר 6 + 6 + 6 + 6 + 6 = 30."]],
    ],
    s: [
      [["Solving a word problem", "Read the problem carefully", "Find out what the question asks", "Choose the operation you need", "Do the calculation", "Check that the answer makes sense"],
        ["פתרון בעיה מילולית", "קוראים את הבעיה בעיון", "מבינים מה שואלים", "בוחרים את הפעולה המתאימה", "מבצעים את החישוב", "בודקים שהתשובה הגיונית"]],
    ],
  },
  i: {
    t: [
      ["Two-step problem", "a problem that needs two calculations, where the first result is used in the second", "בעיה דו־שלבית", "בעיה שצריך לפתור בשני חישובים, ותוצאת הראשון משמשת בשני"],
      ["Remainder", "the amount left over when a number cannot be shared out equally", "שארית", "מה שנשאר כשאי אפשר לחלק מספר לחלקים שווים בדיוק"],
      ["Estimate", "a rough answer found with rounded numbers, used to see whether an exact answer is reasonable", "אומדן", "תשובה מקורבת שמחשבים עם מספרים מעוגלים, כדי לראות אם התשובה המדויקת סבירה"],
    ],
    q: [
      [["Tom has 15 marbles. That is 6 more than Ana has. How many marbles does Ana have?", "9", ["21", "6", "15"], "Tom has more, so Ana has fewer: 15 − 6 = 9. The word \"more\" here does not mean add; 21 would give Ana more marbles than Tom."],
        ["לתום יש 15 גולות, וזה 6 יותר ממה שיש לאנה. כמה גולות יש לאנה?", "9", ["21", "6", "15"], "לתום יש יותר, ולכן לאנה יש פחות: 15 − 6 = 9. המילה ״יותר״ כאן לא אומרת לחבר; 21 היה נותן לאנה יותר גולות מלתום."]],
      [["29 children go on a trip, and each car takes 4 children. How many cars are needed?", "8", ["7", "7 and a quarter", "116"], "29 ÷ 4 = 7 remainder 1. Seven cars carry 28 children, and the last child still needs a car, so 8 cars are needed."],
        ["29 ילדים יוצאים לטיול, ובכל מכונית נוסעים 4 ילדים. כמה מכוניות צריך?", "8", ["7", "7 ורבע", "116"], "29 ÷ 4 = 7 ושארית 1. שבע מכוניות מסיעות 28 ילדים, והילד האחרון עדיין צריך מכונית, ולכן צריך 8 מכוניות."]],
      [["A large box holds 12 pencils and a small box holds 7. How many pencils are in 2 large boxes and 3 small boxes?", "45", ["50", "19", "95"], "2 large boxes hold 2 × 12 = 24 and 3 small boxes hold 3 × 7 = 21. Together 24 + 21 = 45. The answer 50 comes from mixing up which kind of box there are 2 of."],
        ["בקופסה גדולה יש 12 עפרונות ובקופסה קטנה יש 7. כמה עפרונות יש ב־2 קופסאות גדולות וב־3 קופסאות קטנות?", "45", ["50", "19", "95"], "ב־2 קופסאות גדולות יש 2 × 12 = 24 וב־3 קופסאות קטנות יש 3 × 7 = 21. יחד 24 + 21 = 45. התשובה 50 מתקבלת כשמתבלבלים מאיזו קופסה יש 2."]],
      [["You estimate 49 × 21 as about 50 × 20 = 1,000, but your exact answer is 10,290. What does the estimate tell you?", "Your answer is about 10 times too big, so check it again", ["Your answer is right, because it starts with the same digits", "Your answer is too small, because estimates are always smaller", "Nothing, because an estimate uses rounded numbers"], "The real answer must be close to 1,000, so 10,290 cannot be right. In fact 49 × 21 = 1,029: an extra digit slipped in."],
        ["אמדתם את 49 × 21 בערך כ־50 × 20 = 1,000, אבל התשובה המדויקת שלכם היא 10,290. מה האומדן אומר לכם?", "התשובה גדולה בערך פי 10 מדי, וצריך לבדוק אותה שוב", ["התשובה נכונה, כי היא מתחילה באותן ספרות כמו האומדן", "התשובה קטנה מדי, כי אומדן תמיד יוצא קטן יותר", "שום דבר, כי באומדן משתמשים במספרים מעוגלים"], "התשובה האמיתית צריכה להיות קרובה ל־1,000, ולכן 10,290 לא יכולה להיות נכונה. למעשה 49 × 21 = 1,029: נכנסה ספרה מיותרת."]],
      [["A bus leaves at 8:45 and the trip takes 50 minutes. When does it arrive?", "9:35", ["9:25", "9:45", "10:35"], "From 8:45, 15 minutes take you to 9:00 and the other 35 minutes take you to 9:35. An hour has 60 minutes, not 100, so you cannot simply add 50 to 45."],
        ["אוטובוס יוצא ב־8:45 והנסיעה נמשכת 50 דקות. מתי הוא מגיע?", "9:35", ["9:25", "9:45", "10:35"], "מ־8:45, אחרי 15 דקות מגיעים ל־9:00, ו־35 הדקות הנותרות מביאות ל־9:35. בשעה יש 60 דקות ולא 100, ולכן אי אפשר פשוט לחבר 50 ל־45."]],
    ],
    n: [
      [5, ["Half of the 30 students in a class walk to school. A third of the others come by bike. How many come by bike?", "", "Half of 30 is 15, so 15 students do not walk. A third of those 15 is 15 ÷ 3 = 5."],
        ["מחצית מ־30 התלמידים בכיתה הולכים לבית הספר ברגל. שליש מהשאר מגיעים באופניים. כמה מגיעים באופניים?", "", "מחצית מ־30 היא 15, ולכן 15 תלמידים לא הולכים ברגל. שליש מ־15 האלה הוא 15 ÷ 3 = 5."]],
      [7, ["Pens are sold in packs of 6. Yael needs 40 pens. How many packs must she buy?", "", "40 ÷ 6 = 6 remainder 4. Six packs give only 36 pens, so she needs one more pack: 7 packs give 42 pens."],
        ["עטים נמכרים בחבילות של 6. יעל צריכה 40 עטים. כמה חבילות עליה לקנות?", "", "40 ÷ 6 = 6 ושארית 4. שש חבילות נותנות רק 36 עטים, ולכן היא צריכה עוד חבילה: 7 חבילות נותנות 42 עטים."]],
    ],
  },
  a: {
    t: [
      ["Working backwards", "solving a problem by starting from the final result and undoing each step in reverse order", "עבודה מהסוף להתחלה", "פתרון שבו יוצאים מהתוצאה הסופית ומבטלים כל שלב בסדר הפוך"],
      ["Extra information", "numbers or facts in a problem that are not needed to answer its question", "מידע עודף", "מספרים או פרטים בבעיה שלא צריך כדי לענות על השאלה שלה"],
      ["Unknown", "the quantity you are looking for, often written as a letter such as x", "נעלם", "הכמות שמחפשים, ולעיתים קרובות מסמנים אותה באות כמו x"],
    ],
    q: [
      [["A father is 30 years older than his son, and their ages add up to 50. How old is the son?", "10", ["20", "40", "25"], "If the son is s years old, the father is s + 30, so s + s + 30 = 50, 2s = 20 and s = 10. Check: 10 + 40 = 50 and 40 − 10 = 30. 40 is the father's age, not the son's."],
        ["אב מבוגר מבנו ב־30 שנה, וסכום הגילים שלהם הוא 50. בן כמה הבן?", "10", ["20", "40", "25"], "אם הבן בן s, האב בן s + 30, ולכן s + s + 30 = 50, כלומר 2s = 20 ו־s = 10. בדיקה: 10 + 40 = 50 ו־40 − 10 = 30. 40 הוא הגיל של האב, לא של הבן."]],
      [["A tank holds 80 litres of water, and 25% of it is used. How many litres are left?", "60 litres", ["55 litres", "20 litres", "105 litres"], "25% of 80 is 80 ÷ 4 = 20 litres used, so 80 − 20 = 60 litres are left. 55 comes from taking away 25 litres instead of 25%."],
        ["במכל יש 80 ליטר מים, ומשתמשים ב־25% מהם. כמה ליטרים נשארים?", "60 ליטר", ["55 ליטר", "20 ליטר", "105 ליטר"], "25% מ־80 הם 80 ÷ 4 = 20 ליטר שהשתמשו בהם, ולכן נשארים 80 − 20 = 60 ליטר. התשובה 55 מתקבלת כשמורידים 25 ליטר במקום 25%."]],
      [["\"A train has 8 carriages with 60 seats in each, and it leaves at 9:15. How many seats does it have?\" Which fact is not needed?", "The train leaves at 9:15", ["Each carriage has 60 seats", "The train has 8 carriages", "None: every fact is needed"], "The number of seats is 8 × 60 = 480, and the time the train leaves does not change it. Spotting extra information stops you from using numbers that do not belong."],
        ["״לרכבת יש 8 קרונות, ובכל קרון 60 מושבים. היא יוצאת ב־9:15. כמה מושבים יש ברכבת?״ איזה נתון לא נחוץ?", "הרכבת יוצאת ב־9:15", ["בכל קרון יש 60 מושבים", "לרכבת יש 8 קרונות", "אין כזה: כל הנתונים נחוצים"], "מספר המושבים הוא 8 × 60 = 480, ושעת היציאה לא משנה אותו. מי שמזהה מידע עודף לא משתמש במספרים שאין להם קשר לשאלה."]],
      [["Sara and Ben share 35 stickers so that Sara gets 4 for every 3 that Ben gets. How many does Sara get?", "20", ["15", "28", "12"], "Each round hands out 4 + 3 = 7 stickers, and 35 ÷ 7 = 5 rounds. Sara gets 5 × 4 = 20 and Ben gets 5 × 3 = 15."],
        ["שרה ובן מתחלקים ב־35 מדבקות כך שעל כל 3 מדבקות שבן מקבל, שרה מקבלת 4. כמה מדבקות מקבלת שרה?", "20", ["15", "28", "12"], "בכל סבב מחלקים 4 + 3 = 7 מדבקות, ו־35 ÷ 7 = 5 סבבים. שרה מקבלת 5 × 4 = 20 ובן מקבל 5 × 3 = 15."]],
      [["A snail climbs 3 m up a 10 m wall each day and slides back 2 m each night. On which day does it reach the top?", "Day 8", ["Day 10", "Day 7", "Day 5"], "After 7 days and nights it is 7 m up. On day 8 it climbs 3 m and reaches 10 m before night comes, so it never slides back. Counting 1 m a day for all 10 m forgets this last climb."],
        ["חילזון מטפס בכל יום 3 מ׳ במעלה קיר שגובהו 10 מ׳, ובכל לילה מחליק 2 מ׳ למטה. באיזה יום הוא מגיע לראש הקיר?", "ביום ה־8", ["ביום ה־10", "ביום ה־7", "ביום ה־5"], "אחרי 7 ימים ולילות הוא בגובה 7 מ׳. ביום ה־8 הוא מטפס 3 מ׳ ומגיע ל־10 מ׳ לפני שמגיע הלילה, ולכן כבר לא מחליק. מי שסופר מטר אחד ביום לכל 10 המטרים שוכח את הטיפוס האחרון."]],
    ],
    n: [
      [7, ["I think of a number, multiply it by 3 and then add 4. The result is 25. What is my number?", "", "Work backwards: undo adding 4 to get 25 − 4 = 21, then undo multiplying by 3 to get 21 ÷ 3 = 7. Check: 7 × 3 + 4 = 25."],
        ["חשבתי על מספר, כפלתי אותו ב־3 והוספתי 4. התוצאה היא 25. על איזה מספר חשבתי?", "", "עובדים מהסוף להתחלה: מבטלים את הוספת ה־4 ומקבלים 25 − 4 = 21, ואז מבטלים את הכפל ב־3 ומקבלים 21 ÷ 3 = 7. בדיקה: 7 × 3 + 4 = 25."]],
      [17, ["Three consecutive whole numbers add up to 48. What is the largest of them?", "", "The middle number is 48 ÷ 3 = 16, so the numbers are 15, 16 and 17. The largest is 17."],
        ["סכומם של שלושה מספרים שלמים עוקבים הוא 48. מהו הגדול מביניהם?", "", "המספר האמצעי הוא 48 ÷ 3 = 16, ולכן המספרים הם 15, 16 ו־17. הגדול ביותר הוא 17."]],
    ],
  },
};
export default c;
