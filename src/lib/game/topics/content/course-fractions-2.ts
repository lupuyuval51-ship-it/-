import type { TopicContent } from "../types";

// Course "Fractions, decimals and percentages" (grades 5–6), chapter 2: equivalent fractions, expanding and simplifying.
const c: TopicContent = {
  l: {
    en: {
      title: "Equivalent fractions: expanding and simplifying",
      text: [
        "Equivalent fractions look different but are the same size, like 1/2 and 2/4: half a pizza and two quarters of the same pizza are the same amount. To get an equivalent fraction, multiply the numerator and the denominator by the same number — this is expanding. For example 2/3 = 4/6 (both multiplied by 2) and also 2/3 = 6/9 (both multiplied by 3).",
        "Simplifying is the opposite: divide the numerator and the denominator by the same number. 8/12 simplifies to 2/3, because both 8 and 12 divide by 4. A fraction is fully simplified when no number except 1 divides both its numerator and its denominator. Careful: adding or subtracting the same number to the numerator and the denominator does not work — 1/2 is not equal to 2/3.",
      ],
      example: "Example: simplify 18/24. Step 1: look for a number that divides both 18 and 24 — 6 works. Step 2: divide: 18 ÷ 6 = 3 and 24 ÷ 6 = 4. Answer: 18/24 = 3/4. You can also go in small steps: first by 2 (9/12), then by 3 (3/4).",
      task: "Cut out two paper circles of the same size. Fold one into 4 equal parts and the other into 8. Colour 2 quarters of the first and 4 eighths of the second, and lay them side by side. Do they cover the same area? Write down the equation you found, and find one more fraction that equals one half.",
    },
    he: {
      title: "שברים שקולים: הרחבה וצמצום",
      text: [
        "שברים שקולים נראים שונים אבל שווים בגודלם, כמו 1/2 ו־2/4: חצי פיצה ושני רבעים של אותה פיצה הם אותה כמות. כדי לקבל שבר שקול מכפילים את המונה ואת המכנה באותו מספר — זו הרחבה. למשל 2/3 = 4/6 (הכפלנו את שניהם ב־2), וגם 2/3 = 6/9 (הכפלנו את שניהם ב־3).",
        "צמצום הוא הפעולה ההפוכה: מחלקים את המונה ואת המכנה באותו מספר. 8/12 מצטמצם ל־2/3, כי גם 8 וגם 12 מתחלקים ב־4. שבר מצומצם עד הסוף כשאין מספר (חוץ מ־1) שמחלק גם את המונה וגם את המכנה. זהירות: אסור לחבר או לחסר את אותו מספר במונה ובמכנה — 1/2 אינו שווה ל־2/3.",
      ],
      example: "דוגמה: צמצמו את 18/24. שלב 1: מחפשים מספר שמחלק גם את 18 וגם את 24 — 6 מתאים. שלב 2: מחלקים: 18 ÷ 6 = 3 ו־24 ÷ 6 = 4. תשובה: 18/24 = 3/4. אפשר גם בצעדים קטנים: קודם ב־2 (9/12), ואז ב־3 (3/4).",
      task: "גזרו שני עיגולי נייר באותו גודל. קפלו אחד ל־4 חלקים שווים ואת השני ל־8. צבעו 2 רבעים בראשון ו־4 שמיניות בשני, והניחו אותם זה ליד זה. האם הם מכסים אותו שטח? כתבו את השוויון שגיליתם, ומצאו עוד שבר אחד ששווה לחצי.",
    },
  },
  b: {
    t: [
      ["Equivalent fractions", "fractions that look different but are the same size, like 1/2 and 3/6", "שברים שקולים", "שברים שנראים שונים אבל גודלם זהה, כמו 1/2 ו־3/6"],
      ["Expanding", "multiplying the numerator and the denominator by the same number", "הרחבה", "הכפלה של המונה ושל המכנה באותו מספר"],
    ],
    q: [
      [["Which fraction is equivalent to 1/2?", "4/8", ["4/6", "2/3", "1/4"], "Multiply the numerator and the denominator of 1/2 by 4: 1 × 4 = 4 and 2 × 4 = 8, so 1/2 = 4/8."],
        ["איזה שבר שקול ל־1/2?", "4/8", ["4/6", "2/3", "1/4"], "מכפילים את המונה ואת המכנה של 1/2 ב־4: 1 × 4 = 4 ו־2 × 4 = 8, ולכן 1/2 = 4/8."]],
      [["Expand 3/4 by 2. What do you get?", "6/8", ["5/6", "6/4", "3/8"], "Expanding by 2 multiplies both numbers by 2: 3 × 2 = 6 and 4 × 2 = 8, so 3/4 = 6/8. Adding 2 to both (5/6) does not keep the size."],
        ["הרחיבו את 3/4 ב־2. מה מקבלים?", "6/8", ["5/6", "6/4", "3/8"], "הרחבה ב־2 מכפילה את שני המספרים ב־2: 3 × 2 = 6 ו־4 × 2 = 8, ולכן 3/4 = 6/8. הוספה של 2 לשניהם (5/6) משנה את הגודל."]],
      [["Is 2/5 equal to 4/10?", "Yes", ["No, 4/10 is bigger", "No, 4/10 is smaller"], "4/10 is 2/5 expanded by 2 (2 × 2 = 4, 5 × 2 = 10). The parts are smaller, but there are twice as many, so the size is the same."],
        ["האם 2/5 שווה ל־4/10?", "כן", ["לא, 4/10 גדול יותר", "לא, 4/10 קטן יותר"], "4/10 הוא 2/5 שהורחב ב־2 (2 × 2 = 4, 5 × 2 = 10). החלקים קטנים יותר, אבל יש פי שניים מהם, ולכן הגודל זהה."]],
      [["Which pair is NOT equivalent?", "2/3 and 3/4", ["1/2 and 5/10", "3/4 and 6/8", "1/5 and 2/10"], "1/2 = 5/10, 3/4 = 6/8 and 1/5 = 2/10 are all expansions. 2/3 and 3/4 are not: adding 1 to both numbers changes the size."],
        ["איזה זוג אינו שקול?", "2/3 ו־3/4", ["1/2 ו־5/10", "3/4 ו־6/8", "1/5 ו־2/10"], "1/2 = 5/10, 3/4 = 6/8 ו־1/5 = 2/10 הם כולם הרחבות. 2/3 ו־3/4 לא: הוספה של 1 לשני המספרים משנה את הגודל."]],
      [["Ron ate 2/8 of a cake and Gal ate 1/4 of the same cake. Who ate more?", "They ate the same", ["Ron, because 2 is more than 1", "Gal, because quarters are bigger"], "2/8 simplifies by 2 to 1/4, so they ate exactly the same amount of cake. More parts that are smaller can be the same amount."],
        ["רון אכל 2/8 מעוגה, וגל אכל 1/4 מאותה עוגה. מי אכל יותר?", "הם אכלו אותה כמות", ["רון, כי 2 יותר מ־1", "גל, כי רבעים גדולים יותר"], "את 2/8 אפשר לצמצם ב־2 ולקבל 1/4, ולכן הם אכלו בדיוק אותה כמות. יותר חלקים קטנים יכולים להיות אותה כמות."]],
    ],
    n: [
      [3, ["1/3 = x/9. What is x?", "", "The denominator went from 3 to 9, that is times 3. Multiply the numerator by 3 too: 1 × 3 = 3, so 1/3 = 3/9."], ["1/3 = x/9. מהו x?", "", "המכנה גדל מ־3 ל־9, כלומר פי 3. מכפילים גם את המונה ב־3: 1 × 3 = 3, ולכן 1/3 = 3/9."]],
      [15, ["2/5 = 6/x. What is x?", "", "The numerator went from 2 to 6, that is times 3. The denominator is multiplied by 3 too: 5 × 3 = 15, so 2/5 = 6/15."], ["2/5 = 6/x. מהו x?", "", "המונה גדל מ־2 ל־6, כלומר פי 3. גם את המכנה מכפילים ב־3: 5 × 3 = 15, ולכן 2/5 = 6/15."]],
      [4, ["How many eighths are equal to one half?", "", "One half is 1/2 = 4/8 (both numbers multiplied by 4), so 4 eighths make exactly one half."], ["כמה שמיניות שוות לחצי?", "", "חצי הוא 1/2 = 4/8 (הכפלנו את שני המספרים ב־4), ולכן 4 שמיניות הן בדיוק חצי."]],
    ],
  },
  i: {
    t: [
      ["Simplifying", "dividing the numerator and the denominator by the same number", "צמצום", "חלוקה של המונה ושל המכנה באותו מספר"],
      ["Common factor", "a number that divides two numbers with nothing left over, like 2 for 12 and 18", "מחלק משותף", "מספר שמחלק שני מספרים בלי שארית, כמו 2 עבור 12 ו־18"],
    ],
    q: [
      [["Simplify 6/8.", "3/4", ["2/4", "6/4", "4/3"], "Both 6 and 8 divide by 2: 6 ÷ 2 = 3 and 8 ÷ 2 = 4, so 6/8 = 3/4. Taking 4 away from both (2/4) changes the size."],
        ["צמצמו את 6/8.", "3/4", ["2/4", "6/4", "4/3"], "גם 6 וגם 8 מתחלקים ב־2: 6 ÷ 2 = 3 ו־8 ÷ 2 = 4, ולכן 6/8 = 3/4. חיסור של 4 משניהם (2/4) משנה את הגודל."]],
      [["Simplify 10/15 as far as possible.", "2/3", ["5/10", "3/5", "10/5"], "5 divides both 10 and 15: 10 ÷ 5 = 2 and 15 ÷ 5 = 3. Nothing but 1 divides both 2 and 3, so 2/3 is fully simplified."],
        ["צמצמו את 10/15 עד הסוף.", "2/3", ["5/10", "3/5", "10/5"], "5 מחלק גם את 10 וגם את 15: 10 ÷ 5 = 2 ו־15 ÷ 5 = 3. רק 1 מחלק גם את 2 וגם את 3, ולכן 2/3 מצומצם עד הסוף."]],
      [["Which fraction is fully simplified?", "5/7", ["4/6", "9/12", "10/14"], "4/6, 9/12 and 10/14 can all still be simplified (by 2, by 3 and by 2). Nothing but 1 divides both 5 and 7."],
        ["איזה שבר מצומצם עד הסוף?", "5/7", ["4/6", "9/12", "10/14"], "את 4/6, 9/12 ו־10/14 עוד אפשר לצמצם (ב־2, ב־3 וב־2). רק 1 מחלק גם את 5 וגם את 7."]],
      [["By which number should you simplify 12/18 to make it fully simplified in one step?", "6", ["3", "2", "4"], "6 is the biggest number that divides both 12 and 18, so simplifying 12/18 by 6 gives 2/3 at once. 2 or 3 also work but need a second step; 4 does not divide 18."],
        ["באיזה מספר כדאי לצמצם את 12/18 כדי להגיע לשבר מצומצם עד הסוף בצעד אחד?", "6", ["3", "2", "4"], "6 הוא המספר הגדול ביותר שמחלק גם את 12 וגם את 18, וצמצום ב־6 נותן מיד 2/3. גם 2 או 3 מתאימים, אבל צריך עוד צעד; 4 לא מחלק את 18."]],
      [["Shira got 15 of 20 questions right. What fraction is that, fully simplified?", "3/4", ["4/5", "5/4", "3/5"], "15/20: both numbers divide by 5, 15 ÷ 5 = 3 and 20 ÷ 5 = 4, so Shira got 3/4 of the questions right."],
        ["שירה ענתה נכון על 15 מתוך 20 שאלות. איזה שבר זה, מצומצם עד הסוף?", "3/4", ["4/5", "5/4", "3/5"], "15/20: שני המספרים מתחלקים ב־5, 15 ÷ 5 = 3 ו־20 ÷ 5 = 4, ולכן שירה ענתה נכון על 3/4 מהשאלות."]],
    ],
    n: [
      [4, ["20/25 = x/5. What is x?", "", "The denominator was divided by 5 (25 ÷ 5 = 5), so divide the numerator by 5 too: 20 ÷ 5 = 4, and 20/25 = 4/5."], ["20/25 = x/5. מהו x?", "", "המכנה חולק ב־5 (25 ÷ 5 = 5), ולכן מחלקים גם את המונה ב־5: 20 ÷ 5 = 4, ו־20/25 = 4/5."]],
      [4, ["12/16 = 3/x. What is x?", "", "The numerator was divided by 4 (12 ÷ 4 = 3), so divide 16 by 4 too: 16 ÷ 4 = 4, and 12/16 = 3/4."], ["12/16 = 3/x. מהו x?", "", "המונה חולק ב־4 (12 ÷ 4 = 3), ולכן מחלקים גם את 16 ב־4: 16 ÷ 4 = 4, ו־12/16 = 3/4."]],
      [8, ["What is the biggest number that divides both 16 and 24?", "", "16 = 2 × 8 and 24 = 3 × 8, and no bigger number divides both, so 16/24 simplifies by 8 to 2/3."], ["מהו המספר הגדול ביותר שמחלק גם את 16 וגם את 24?", "", "16 = 2 × 8 ו־24 = 3 × 8, ואין מספר גדול יותר שמחלק את שניהם, ולכן 16/24 מצטמצם ב־8 ל־2/3."]],
    ],
  },
  a: {
    t: [
      ["Fully simplified fraction", "a fraction whose numerator and denominator have no common factor except 1", "שבר מצומצם", "שבר שלמונה ולמכנה שלו אין מחלק משותף חוץ מ־1"],
      ["Greatest common factor", "the biggest number that divides two numbers exactly", "המחלק המשותף הגדול ביותר", "המספר הגדול ביותר שמחלק שני מספרים בלי שארית"],
    ],
    q: [
      [["Which fraction is NOT equal to the others?", "8/10", ["6/9", "4/6", "10/15"], "6/9, 4/6 and 10/15 all simplify to 2/3 (by 3, by 2 and by 5). 8/10 simplifies to 4/5, a different size."],
        ["איזה שבר אינו שווה לשאר?", "8/10", ["6/9", "4/6", "10/15"], "6/9, 4/6 ו־10/15 מצטמצמים כולם ל־2/3 (ב־3, ב־2 וב־5). 8/10 מצטמצם ל־4/5, וזה גודל אחר."]],
      [["Which fraction with denominator 100 is equal to 3/4?", "75/100", ["34/100", "70/100", "3/100"], "100 is 4 × 25, so expand 3/4 by 25: 3 × 25 = 75 and 4 × 25 = 100. So 3/4 = 75/100 — you will meet this again as 75%."],
        ["איזה שבר שהמכנה שלו 100 שווה ל־3/4?", "75/100", ["34/100", "70/100", "3/100"], "100 הוא 4 × 25, ולכן מרחיבים את 3/4 ב־25: 3 × 25 = 75 ו־4 × 25 = 100. כלומר 3/4 = 75/100 — ונפגוש את זה שוב בתור 75%."]],
      [["Tal simplified 16/40 and got 4/10. What should he do next?", "Divide both by 2 again: 2/5", ["Nothing — 4/10 is already fully simplified", "Subtract 2 from both: 2/8"], "4 and 10 are both still even, so they divide by 2: 4/10 = 2/5. In one step: simplifying 16/40 by 8 gives 2/5."],
        ["טל צמצם את 16/40 וקיבל 4/10. מה עליו לעשות עכשיו?", "לחלק שוב את שניהם ב־2: 2/5", ["כלום — 4/10 כבר מצומצם עד הסוף", "לחסר 2 משניהם: 2/8"], "גם 4 וגם 10 עדיין זוגיים, ולכן מתחלקים ב־2: 4/10 = 2/5. בצעד אחד זה היה צמצום של 16/40 ב־8, שנותן 2/5."]],
      [["Which statement is true?", "3/5 = 12/20", ["3/5 = 4/6", "3/5 = 6/15", "3/5 = 30/60"], "Expand 3/5 by 4: 3 × 4 = 12 and 5 × 4 = 20. In 4/6 one was added to both numbers, in 6/15 the numerator was multiplied by 2 but the denominator by 3, and 30/60 is a half."],
        ["איזו טענה נכונה?", "3/5 = 12/20", ["3/5 = 4/6", "3/5 = 6/15", "3/5 = 30/60"], "מרחיבים את 3/5 ב־4: 3 × 4 = 12 ו־5 × 4 = 20. ב־4/6 הוסיפו 1 לשני המספרים, ב־6/15 הכפילו את המונה ב־2 ואת המכנה ב־3, ו־30/60 הוא חצי."]],
      [["In a class, 12 of the 30 students wear glasses. What fraction of the class wears glasses (fully simplified)?", "2/5", ["3/5", "1/3", "1/2"], "The greatest common factor of 12 and 30 is 6: 12 ÷ 6 = 2 and 30 ÷ 6 = 5, so 2/5. 3/5 is the part that does not wear glasses."],
        ["בכיתה 12 מתוך 30 התלמידים מרכיבים משקפיים. איזה חלק מהכיתה מרכיב משקפיים (בשבר מצומצם עד הסוף)?", "2/5", ["3/5", "1/3", "1/2"], "המחלק המשותף הגדול ביותר של 12 ו־30 הוא 6: 12 ÷ 6 = 2 ו־30 ÷ 6 = 5, ולכן 2/5. 3/5 הוא החלק שלא מרכיב משקפיים."]],
    ],
    n: [
      [35, ["3/7 = 15/x. What is x?", "", "15 is 3 × 5, so multiply 7 by 5 as well: 7 × 5 = 35. So 3/7 = 15/35."], ["3/7 = 15/x. מהו x?", "", "15 הוא 3 × 5, ולכן מכפילים גם את 7 ב־5: 7 × 5 = 35. כלומר 3/7 = 15/35."]],
      [9, ["What is the greatest common factor of 18 and 45?", "", "18 = 2 × 9 and 45 = 5 × 9, and no bigger number divides both. So 18/45 simplifies by 9 to 2/5."], ["מהו המחלק המשותף הגדול ביותר של 18 ו־45?", "", "18 = 2 × 9 ו־45 = 5 × 9, ואין מספר גדול יותר שמחלק את שניהם. לכן 18/45 מצטמצם ב־9 ל־2/5."]],
      [5, ["48/60 fully simplified is 4/x. What is the denominator?", "", "The greatest common factor of 48 and 60 is 12: 48 ÷ 12 = 4 and 60 ÷ 12 = 5, so 48/60 = 4/5."], ["48/60 מצומצם עד הסוף הוא 4/x. מהו המכנה?", "", "המחלק המשותף הגדול ביותר של 48 ו־60 הוא 12: 48 ÷ 12 = 4 ו־60 ÷ 12 = 5, ולכן 48/60 = 4/5."]],
    ],
  },
};
export default c;
