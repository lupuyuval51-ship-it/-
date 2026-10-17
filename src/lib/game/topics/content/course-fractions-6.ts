import type { TopicContent } from "../types";

// Course "Fractions, decimals and percentages" (grades 5–6), chapter 6: dividing by a fraction.
const c: TopicContent = {
  l: {
    en: {
      title: "Dividing by a fraction",
      text: [
        "Division asks “how many times does it fit?”. How many halves are there in 3? Every whole has 2 halves, so 3 wholes have 6: 3 ÷ 1/2 = 6. Notice: dividing by a fraction smaller than 1 gives an answer bigger than the number you started with.",
        "The rule: to divide by a fraction, multiply by the reciprocal — swap its numerator and denominator. The reciprocal of 2/3 is 3/2, so 4 ÷ 2/3 = 4 × 3/2 = 12/2 = 6. To divide a fraction by a whole number: 3/4 ÷ 3 = 3/4 × 1/3 = 3/12 = 1/4 — a third of three quarters is one quarter.",
      ],
      example: "Example: there are 2 1/2 litres of juice, poured into glasses of 1/4 litre. How many glasses? 2 1/2 = 5/2. Work out 5/2 ÷ 1/4 = 5/2 × 4/1 = 20/2 = 10. Answer: 10 glasses. Check: 10 × 1/4 = 10/4 = 2 1/2.",
      task: "Fill a half-litre bottle with water and pour it into small cups (for example quarter-litre cups — ask an adult how much a cup holds). How many cups did you fill? Write the exercise: 1/2 ÷ 1/4 = ?. Guess before you pour, then check.",
    },
    he: {
      title: "חילוק בשבר",
      text: [
        "חילוק שואל ״כמה פעמים זה נכנס?״. כמה חצאים יש ב־3? בכל שלם יש 2 חצאים, ולכן ב־3 שלמים יש 6: 3 ÷ 1/2 = 6. שימו לב: כשמחלקים בשבר קטן מ־1, התוצאה גדולה מהמספר שהתחלנו בו.",
        "הכלל: כדי לחלק בשבר, כופלים במספר ההופכי שלו — מחליפים בין המונה למכנה. ההופכי של 2/3 הוא 3/2, ולכן 4 ÷ 2/3 = 4 × 3/2 = 12/2 = 6. וכשמחלקים שבר במספר שלם: 3/4 ÷ 3 = 3/4 × 1/3 = 3/12 = 1/4 — שליש משלושה רבעים הוא רבע.",
      ],
      example: "דוגמה: יש 2 1/2 ליטר מיץ, ומוזגים אותו לכוסות של 1/4 ליטר. כמה כוסות? 2 1/2 = 5/2. מחשבים 5/2 ÷ 1/4 = 5/2 × 4/1 = 20/2 = 10. תשובה: 10 כוסות. בדיקה: 10 × 1/4 = 10/4 = 2 1/2.",
      task: "מלאו בקבוק של חצי ליטר במים ומזגו אותו לכוסות קטנות (למשל כוסות של רבע ליטר — שאלו מבוגר כמה מחזיקה כוס). כמה כוסות מילאתם? כתבו את התרגיל: 1/2 ÷ 1/4 = ?. נחשו לפני שמוזגים, ואז בדקו.",
    },
  },
  b: {
    t: [
      ["Reciprocal", "the number you get by swapping the numerator and the denominator, like 3/2 for 2/3", "המספר ההופכי", "המספר שמקבלים כשמחליפים בין המונה למכנה, כמו 3/2 עבור 2/3"],
      ["Quotient", "the result of dividing one number by another", "מנה", "התוצאה של חילוק מספר במספר"],
    ],
    q: [
      [["What does 4 ÷ 1/2 ask?", "How many halves fit into 4", ["What is one half of the number 4", "How many 4s fit into one half"], "Division asks how many times one number fits into another. Half of 4 is 4 ÷ 2 = 2, but 4 ÷ 1/2 = 8, because each whole has two halves."],
        ["מה שואל התרגיל 4 ÷ 1/2?", "כמה חצאים נכנסים ב־4", ["כמה זה חצי מהמספר 4", "כמה פעמים 4 נכנס בחצי"], "חילוק שואל כמה פעמים מספר אחד נכנס במספר אחר. חצי מ־4 הוא 4 ÷ 2 = 2, אבל 4 ÷ 1/2 = 8, כי בכל שלם יש שני חצאים."]],
      [["What is the reciprocal of 3/5?", "5/3", ["3/5", "1/5", "5/5"], "Swap the numerator and the denominator: 3/5 becomes 5/3. Check: 3/5 × 5/3 = 15/15 = 1."],
        ["מהו המספר ההופכי של 3/5?", "5/3", ["3/5", "1/5", "5/5"], "מחליפים בין המונה למכנה: 3/5 הופך ל־5/3. בדיקה: 3/5 × 5/3 = 15/15 = 1."]],
      [["What is 2 ÷ 1/4?", "8", ["1/2", "6", "1/8"], "How many quarters are in 2? Each whole has 4 quarters, so 2 wholes have 8: 2 ÷ 1/4 = 2 × 4 = 8. 1/2 is 2 × 1/4, a different question."],
        ["כמה זה 2 ÷ 1/4?", "8", ["1/2", "6", "1/8"], "כמה רבעים יש ב־2? בכל שלם 4 רבעים, ולכן ב־2 שלמים יש 8: 2 ÷ 1/4 = 2 × 4 = 8. 1/2 הוא 2 × 1/4, שאלה אחרת."]],
      [["Is 6 ÷ 1/3 more or less than 6?", "More than 6", ["Less than 6", "Exactly 6"], "Dividing by a fraction less than 1 asks how many small parts fit in: there are 3 thirds in every whole, so 6 ÷ 1/3 = 18, more than 6."],
        ["האם 6 ÷ 1/3 גדול מ־6 או קטן מ־6?", "גדול מ־6", ["קטן מ־6", "בדיוק 6"], "חילוק בשבר קטן מ־1 שואל כמה חלקים קטנים נכנסים: בכל שלם יש 3 שלישים, ולכן 6 ÷ 1/3 = 18, יותר מ־6."]],
      [["What is 1/2 ÷ 2?", "1/4", ["1", "4", "1/2"], "Half of one half: 1/2 ÷ 2 = 1/2 × 1/2 = 1/4. Splitting a half into two equal parts gives quarters."],
        ["כמה זה 1/2 ÷ 2?", "1/4", ["1", "4", "1/2"], "חצי מחצי: 1/2 ÷ 2 = 1/2 × 1/2 = 1/4. כשמחלקים חצי לשני חלקים שווים מקבלים רבעים."]],
    ],
    n: [
      [6, ["How many halves are there in 3?", "", "Every whole has 2 halves, so 3 wholes have 3 × 2 = 6 halves: 3 ÷ 1/2 = 6."], ["כמה חצאים יש ב־3?", "", "בכל שלם יש 2 חצאים, ולכן ב־3 שלמים יש 3 × 2 = 6 חצאים: 3 ÷ 1/2 = 6."]],
      [10, ["A 5 m ribbon is cut into pieces of 1/2 m. How many pieces are there?", "pieces", "5 ÷ 1/2 = 5 × 2 = 10: each metre gives two half-metre pieces, and there are 5 metres."], ["סרט באורך 5 מטרים נחתך לחתיכות של 1/2 מטר. כמה חתיכות יש?", "חתיכות", "5 ÷ 1/2 = 5 × 2 = 10: מכל מטר יוצאות שתי חתיכות של חצי מטר, ויש 5 מטרים."]],
      [5, ["1 ÷ 1/5 = x. What is x?", "", "There are 5 fifths in one whole, so 1 ÷ 1/5 = 5. Check: 5 × 1/5 = 5/5 = 1."], ["1 ÷ 1/5 = x. מהו x?", "", "בשלם אחד יש 5 חמישיות, ולכן 1 ÷ 1/5 = 5. בדיקה: 5 × 1/5 = 5/5 = 1."]],
    ],
  },
  i: {
    t: [
      ["Invert and multiply", "the rule for dividing by a fraction: multiply by its reciprocal instead", "הופכים וכופלים", "הכלל לחילוק בשבר: במקום לחלק, כופלים במספר ההופכי"],
      ["Dividend", "the number that is being divided", "מחולק", "המספר שאותו מחלקים"],
    ],
    q: [
      [["What is 3/4 ÷ 1/4?", "3", ["3/16", "1/3", "4/3"], "How many quarters fit into three quarters? Exactly 3. By the rule: 3/4 × 4/1 = 12/4 = 3."],
        ["כמה זה 3/4 ÷ 1/4?", "3", ["3/16", "1/3", "4/3"], "כמה רבעים נכנסים בשלושה רבעים? בדיוק 3. לפי הכלל: 3/4 × 4/1 = 12/4 = 3."]],
      [["What is 2/3 ÷ 1/6?", "4", ["2/18", "1/9", "3"], "Multiply by the reciprocal: 2/3 × 6/1 = 12/3 = 4. Check: 4 × 1/6 = 4/6 = 2/3. 2/18 comes from multiplying instead of dividing."],
        ["כמה זה 2/3 ÷ 1/6?", "4", ["2/18", "1/9", "3"], "כופלים במספר ההופכי: 2/3 × 6/1 = 12/3 = 4. בדיקה: 4 × 1/6 = 4/6 = 2/3. 2/18 מתקבל כשכופלים במקום לחלק."]],
      [["What is 4/5 ÷ 2?", "2/5", ["8/5", "2/10", "8/10"], "Dividing by 2 is taking half: 4/5 × 1/2 = 4/10 = 2/5. Or simply: half of 4 fifths is 2 fifths."],
        ["כמה זה 4/5 ÷ 2?", "2/5", ["8/5", "2/10", "8/10"], "חילוק ב־2 הוא לקיחת חצי: 4/5 × 1/2 = 4/10 = 2/5. או בפשטות: חצי מ־4 חמישיות הוא 2 חמישיות."]],
      [["Which is the same as 5 ÷ 2/3?", "5 × 3/2", ["5 × 2/3", "1/5 × 2/3", "5 ÷ 3/2"], "Dividing by 2/3 is multiplying by its reciprocal 3/2: 5 × 3/2 = 15/2 = 7 1/2."],
        ["איזה תרגיל זהה ל־5 ÷ 2/3?", "5 × 3/2", ["5 × 2/3", "1/5 × 2/3", "5 ÷ 3/2"], "חילוק ב־2/3 הוא כפל במספר ההופכי שלו, 3/2: 5 × 3/2 = 15/2 = 7 1/2."]],
      [["Which division gives the biggest answer?", "1 ÷ 1/8", ["1 ÷ 1/4", "1 ÷ 1/2", "1 ÷ 2"], "1 ÷ 1/8 = 8, 1 ÷ 1/4 = 4, 1 ÷ 1/2 = 2 and 1 ÷ 2 = 1/2. The smaller the part, the more of them fit in."],
        ["איזה תרגיל חילוק נותן את התוצאה הגדולה ביותר?", "1 ÷ 1/8", ["1 ÷ 1/4", "1 ÷ 1/2", "1 ÷ 2"], "1 ÷ 1/8 = 8, 1 ÷ 1/4 = 4, 1 ÷ 1/2 = 2 ו־1 ÷ 2 = 1/2. ככל שהחלק קטן יותר, יותר חלקים כאלה נכנסים."]],
    ],
    n: [
      [4, ["3 litres of juice are poured into bottles of 3/4 litre. How many bottles are filled?", "bottles", "3 ÷ 3/4 = 3 × 4/3 = 12/3 = 4 bottles. Check: 4 × 3/4 = 12/4 = 3 litres."], ["3 ליטר מיץ נמזגים לבקבוקים של 3/4 ליטר. כמה בקבוקים מתמלאים?", "בקבוקים", "3 ÷ 3/4 = 3 × 4/3 = 12/3 = 4 בקבוקים. בדיקה: 4 × 3/4 = 12/4 = 3 ליטר."]],
      [6, ["5/6 ÷ 5 = 1/x. What is the denominator?", "", "Dividing by 5 is multiplying by 1/5: 5/6 × 1/5 = 5/30 = 1/6. A fifth of five sixths is one sixth."], ["5/6 ÷ 5 = 1/x. מהו המכנה?", "", "חילוק ב־5 הוא כפל ב־1/5: 5/6 × 1/5 = 5/30 = 1/6. חמישית מחמש שישיות היא שישית אחת."]],
      [10, ["How many pieces of 2/5 fit into 4?", "", "4 ÷ 2/5 = 4 × 5/2 = 20/2 = 10. Check: 10 × 2/5 = 20/5 = 4."], ["כמה חלקים של 2/5 נכנסים ב־4?", "", "4 ÷ 2/5 = 4 × 5/2 = 20/2 = 10. בדיקה: 10 × 2/5 = 20/5 = 4."]],
    ],
    s: [[["Dividing mixed numbers, like 2 1/4 ÷ 3/4", "Write every mixed number as a fraction: 9/4 ÷ 3/4", "Replace ÷ by × and the second fraction by its reciprocal: 9/4 × 4/3", "Multiply numerator by numerator and denominator by denominator: 36/12", "Simplify the result: 3"], ["חילוק מספרים מעורבים, כמו 2 1/4 ÷ 3/4", "כותבים כל מספר מעורב כשבר: 9/4 ÷ 3/4", "מחליפים את ÷ ב־× ואת השבר השני בהופכי שלו: 9/4 × 4/3", "כופלים מונה במונה ומכנה במכנה: 36/12", "מצמצמים את התוצאה: 3"]]],
  },
  a: {
    t: [
      ["Divisor", "the number you divide by", "מחלק", "המספר שבו מחלקים"],
      ["Checking by multiplying", "making sure a division is right by multiplying the answer by the divisor", "בדיקה בכפל", "בדיקה שחילוק נכון: כופלים את התוצאה במספר שבו חילקו ומקבלים את המחולק"],
    ],
    q: [
      [["What is 1 1/2 ÷ 3/4?", "2", ["1 1/8", "1/2", "3"], "Write 1 1/2 as 3/2. Then 3/2 × 4/3 = 12/6 = 2. Check: 2 × 3/4 = 6/4 = 1 1/2."],
        ["כמה זה 1 1/2 ÷ 3/4?", "2", ["1 1/8", "1/2", "3"], "כותבים את 1 1/2 כ־3/2. אז 3/2 × 4/3 = 12/6 = 2. בדיקה: 2 × 3/4 = 6/4 = 1 1/2."]],
      [["How many portions of 2/3 cup of flour are there in 4 cups?", "6", ["8/3", "3", "12"], "4 ÷ 2/3 = 4 × 3/2 = 12/2 = 6. Check: 6 × 2/3 = 12/3 = 4 cups. 8/3 comes from multiplying 4 × 2/3."],
        ["כמה מנות של 2/3 כוס קמח יש ב־4 כוסות?", "6", ["8/3", "3", "12"], "4 ÷ 2/3 = 4 × 3/2 = 12/2 = 6. בדיקה: 6 × 2/3 = 12/3 = 4 כוסות. 8/3 מתקבל מהכפל 4 × 2/3."]],
      [["Dan worked out 3/5 ÷ 1/2 and got 3/10. What went wrong?", "He multiplied; the answer is 6/5", ["Nothing — 3/10 is the right answer", "He should have got 3/7, adding the bottoms"], "3/5 × 1/2 = 3/10 is multiplying. Dividing: 3/5 × 2/1 = 6/5 = 1 1/5. Dividing by a half doubles, so the answer must be bigger than 3/5."],
        ["דן חישב 3/5 ÷ 1/2 וקיבל 3/10. מה השתבש?", "הוא כפל; התשובה היא 6/5", ["כלום — 3/10 היא התשובה הנכונה", "הוא היה צריך לקבל 3/7, בחיבור המכנים"], "3/5 × 1/2 = 3/10 זה כפל. בחילוק: 3/5 × 2/1 = 6/5 = 1 1/5. חילוק בחצי מכפיל פי 2, ולכן התשובה חייבת להיות גדולה מ־3/5."]],
      [["2 1/4 kg of rice is split into bags of 3/4 kg. How many bags are there?", "3", ["27/16", "4", "2"], "2 1/4 = 9/4. 9/4 ÷ 3/4 = 9/4 × 4/3 = 36/12 = 3 bags. With the same denominators you can also just divide the numerators: 9 ÷ 3 = 3."],
        ["2 1/4 ק״ג אורז מחולקים לשקיות של 3/4 ק״ג. כמה שקיות יש?", "3", ["27/16", "4", "2"], "2 1/4 = 9/4. 9/4 ÷ 3/4 = 9/4 × 4/3 = 36/12 = 3 שקיות. כשהמכנים שווים אפשר גם פשוט לחלק את המונים: 9 ÷ 3 = 3."]],
      [["3/4 of a number is 18. What is the number?", "24", ["13 1/2", "72", "6"], "Divide by 3/4: 18 ÷ 3/4 = 18 × 4/3 = 72/3 = 24. Check: 3/4 of 24 is 18. (Or: 1/4 is 18 ÷ 3 = 6, and the whole is 4 × 6 = 24.)"],
        ["3/4 ממספר מסוים הם 18. מהו המספר?", "24", ["13 1/2", "72", "6"], "מחלקים ב־3/4: 18 ÷ 3/4 = 18 × 4/3 = 72/3 = 24. בדיקה: 3/4 מ־24 הם 18. (או: 1/4 הוא 18 ÷ 3 = 6, והשלם הוא 4 × 6 = 24.)"]],
    ],
    n: [
      [3, ["2/3 ÷ 4/9 = x/2. What is the numerator?", "", "2/3 × 9/4 = 18/12 = 3/2. Check: 3/2 × 4/9 = 12/18 = 2/3."], ["2/3 ÷ 4/9 = x/2. מהו המונה?", "", "2/3 × 9/4 = 18/12 = 3/2. בדיקה: 3/2 × 4/9 = 12/18 = 2/3."]],
      [6, ["A 7 1/2 m pipe is cut into pieces of 1 1/4 m. How many pieces are there?", "pieces", "7 1/2 = 15/2 and 1 1/4 = 5/4. 15/2 × 4/5 = 60/10 = 6 pieces. Check: 6 × 1 1/4 = 7 1/2."], ["צינור באורך 7 1/2 מ׳ נחתך לחתיכות של 1 1/4 מ׳. כמה חתיכות יש?", "חתיכות", "7 1/2 = 15/2 ו־1 1/4 = 5/4. 15/2 × 4/5 = 60/10 = 6 חתיכות. בדיקה: 6 × 1 1/4 = 7 1/2."]],
      [4, ["A number divided by 1/3 gives 12. What is the number?", "", "Dividing by 1/3 is multiplying by 3, so the number times 3 is 12: the number is 12 ÷ 3 = 4. Check: 4 ÷ 1/3 = 12."], ["מספר מסוים חלקי 1/3 שווה 12. מהו המספר?", "", "חילוק ב־1/3 הוא כפל ב־3, ולכן המספר כפול 3 הוא 12: המספר הוא 12 ÷ 3 = 4. בדיקה: 4 ÷ 1/3 = 12."]],
    ],
  },
};
export default c;
