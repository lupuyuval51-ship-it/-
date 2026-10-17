import type { TopicContent } from "../types";

// Course "Fractions, decimals and percentages" (grades 5–6), chapter 3: comparing and ordering fractions.
// (No "<" or ">" signs anywhere: in a right-to-left line they are drawn mirrored, so the comparison is written in words.)
const c: TopicContent = {
  l: {
    en: {
      title: "Comparing and ordering fractions",
      text: [
        "When the denominators are equal, compare the numerators: 5/8 is more than 3/8, because we took more parts of the same size. When the numerators are equal, the fraction with the smaller denominator is bigger: 1/3 is more than 1/5, because the whole was cut into fewer parts, so each part is bigger.",
        "When both are different, give the fractions a common denominator: expand both so they have the same denominator, then compare the numerators. Another way is to compare each fraction with one half. 3/7 is less than a half, because 3 + 3 = 6 is less than 7; 5/9 is more than a half, because 5 + 5 = 10 is more than 9 — so 5/9 is bigger.",
      ],
      example: "Example: which is bigger, 2/3 or 3/4? A common denominator for 3 and 4 is 12. Expand: 2/3 = 8/12 (times 4) and 3/4 = 9/12 (times 3). 9/12 is more than 8/12, so 3/4 is bigger than 2/3 — by 1/12.",
      task: "Take 4 paper strips of the same length. Fold one into halves, one into thirds, one into quarters and one into sixths, and colour one part of each. Lay them one under another and put 1/2, 1/3, 1/4 and 1/6 in order from smallest to biggest. What did you notice about the denominator?",
    },
    he: {
      title: "השוואת שברים וסידורם",
      text: [
        "כשהמכנים שווים, משווים את המונים: 5/8 יותר מ־3/8, כי לקחנו יותר חלקים באותו גודל. כשהמונים שווים, השבר עם המכנה הקטן יותר הוא הגדול: 1/3 יותר מ־1/5, כי השלם חולק לפחות חלקים, וכל חלק גדול יותר.",
        "כשגם המונים וגם המכנים שונים, מביאים למכנה משותף: מרחיבים את שני השברים כך שיהיה להם אותו מכנה, ואז משווים את המונים. דרך נוספת היא להשוות כל שבר לחצי. 3/7 פחות מחצי, כי 3 + 3 = 6 פחות מ־7; 5/9 יותר מחצי, כי 5 + 5 = 10 יותר מ־9 — ולכן 5/9 גדול יותר.",
      ],
      example: "דוגמה: מה גדול יותר, 2/3 או 3/4? מכנה משותף ל־3 ול־4 הוא 12. מרחיבים: 2/3 = 8/12 (כפול 4), ו־3/4 = 9/12 (כפול 3). 9/12 יותר מ־8/12, ולכן 3/4 גדול מ־2/3 — בהפרש של 1/12.",
      task: "קחו 4 רצועות נייר באותו אורך. קפלו אחת לחצאים, אחת לשלישים, אחת לרבעים ואחת לשישיות, וצבעו בכל אחת חלק אחד. הניחו אותן זו מתחת לזו וסדרו את 1/2, 1/3, 1/4 ו־1/6 מהקטן לגדול. מה גיליתם על המכנה?",
    },
  },
  b: {
    t: [
      ["Common denominator", "any number both denominators divide into, not necessarily the smallest, like 24 for 1/4 and 1/6", "מכנה משותף", "כל מספר ששני המכנים מחלקים אותו, לא בהכרח הקטן ביותר, כמו 24 עבור 1/4 ו־1/6"],
      ["Proper fraction", "a number smaller than one whole, whose numerator is smaller than its denominator", "שבר אמיתי", "מספר קטן משלם, שהמונה שלו קטן מהמכנה"],
    ],
    q: [
      [["Which is bigger: 5/8 or 3/8?", "5/8", ["3/8", "They are equal"], "The denominators are the same, so the parts are the same size. 5 parts are more than 3 parts, so 5/8 is bigger."],
        ["מה גדול יותר: 5/8 או 3/8?", "5/8", ["3/8", "הם שווים"], "המכנים שווים, ולכן החלקים באותו גודל. 5 חלקים הם יותר מ־3 חלקים, ולכן 5/8 גדול יותר."]],
      [["Which is bigger: 1/3 or 1/5?", "1/3", ["1/5", "They are equal"], "Both take one part. A whole cut into 3 parts has bigger parts than a whole cut into 5, so 1/3 is bigger than 1/5."],
        ["מה גדול יותר: 1/3 או 1/5?", "1/3", ["1/5", "הם שווים"], "בשניהם לוקחים חלק אחד. בשלם שחולק ל־3 החלקים גדולים יותר מאשר בשלם שחולק ל־5, ולכן 1/3 גדול מ־1/5."]],
      [["Which fraction is less than one half?", "2/5", ["3/5", "4/6", "5/8"], "Multiply the numerator by 2: 2 × 2 = 4 is less than 5, so 2/5 is less than a half. In 3/5, 4/6 and 5/8 twice the numerator is more than the denominator."],
        ["איזה שבר קטן מחצי?", "2/5", ["3/5", "4/6", "5/8"], "מכפילים את המונה ב־2: 2 × 2 = 4 פחות מ־5, ולכן 2/5 פחות מחצי. ב־3/5, 4/6 ו־5/8 פי 2 מהמונה גדול מהמכנה."]],
      [["Noa ran 3/4 of the track and Omer ran 2/4 of it. Who ran farther?", "Noa", ["Omer", "They ran the same"], "Same track, same quarters: 3 quarters are more than 2 quarters, so Noa ran farther, by 1/4 of the track."],
        ["נועה רצה 3/4 מהמסלול, ועומר רץ 2/4 ממנו. מי רץ יותר?", "נועה", ["עומר", "הם רצו אותו מרחק"], "אותו מסלול ואותם רבעים: 3 רבעים הם יותר מ־2 רבעים, ולכן נועה רצה יותר — ברבע מסלול."]],
      [["Which is bigger: 2/3 or 2/7?", "2/3", ["2/7", "They are equal"], "The numerators are the same: 2 parts in each. Thirds are bigger than sevenths, so 2 thirds are more than 2 sevenths."],
        ["מה גדול יותר: 2/3 או 2/7?", "2/3", ["2/7", "הם שווים"], "המונים שווים: 2 חלקים בכל שבר. שלישים גדולים משביעיות, ולכן 2 שלישים הם יותר מ־2 שביעיות."]],
    ],
    n: [
      [3, ["How many eighths must you add to 5/8 to make one whole?", "", "One whole is 8/8. From 5/8 you need 8 − 5 = 3 more eighths: 5/8 + 3/8 = 8/8."], ["כמה שמיניות צריך להוסיף ל־5/8 כדי לקבל שלם?", "", "שלם הוא 8/8. מ־5/8 צריך עוד 8 − 5 = 3 שמיניות: 5/8 + 3/8 = 8/8."]],
      [10, ["Of 1/2, 1/3, 1/4 and 1/10, which denominator belongs to the smallest fraction?", "", "With the same numerator, more parts means smaller parts: 1/10 is the smallest of them, so the answer is 10."], ["מבין 1/2, 1/3, 1/4 ו־1/10, מה המכנה של השבר הקטן ביותר?", "", "כשהמונים שווים, יותר חלקים פירושם חלקים קטנים יותר: 1/10 הוא הקטן מכולם, ולכן התשובה 10."]],
      [3, ["Which number x makes x/6 equal to one half?", "", "Half of 6 is 3, so 3/6 is exactly one half: 3 parts out of 6 equal parts."], ["איזה מספר x הופך את x/6 לחצי?", "", "חצי מ־6 הוא 3, ולכן 3/6 הוא בדיוק חצי: 3 חלקים מתוך 6 חלקים שווים."]],
    ],
    s: [[["Put the fractions in order from smallest to biggest", "1/10", "3/10", "7/10", "9/10"], ["סדרו את השברים מהקטן לגדול", "1/10", "3/10", "7/10", "9/10"]]],
  },
  i: {
    t: [
      ["Least common denominator", "the smallest number that both denominators divide into", "המכנה המשותף הקטן ביותר", "המספר הקטן ביותר ששני המכנים מחלקים אותו בלי שארית"],
      ["Benchmark", "a known value, such as one half, that other numbers are compared with", "נקודת ייחוס", "ערך מוכר, כמו חצי, שמשווים אליו מספרים אחרים"],
    ],
    q: [
      [["Which is bigger: 2/3 or 3/5?", "2/3", ["3/5", "They are equal"], "Use 15 as a common denominator: 2/3 = 10/15 and 3/5 = 9/15. 10/15 is more than 9/15, so 2/3 is bigger."],
        ["מה גדול יותר: 2/3 או 3/5?", "2/3", ["3/5", "הם שווים"], "משתמשים ב־15 כמכנה משותף: 2/3 = 10/15 ו־3/5 = 9/15. 10/15 יותר מ־9/15, ולכן 2/3 גדול יותר."]],
      [["What is the least common denominator of 1/4 and 1/6?", "12", ["24", "10", "6"], "12 is the smallest number that both 4 and 6 divide into (4 × 3 = 12 and 6 × 2 = 12). 24 also works but is not the smallest; 10 is just 4 + 6."],
        ["מהו המכנה המשותף הקטן ביותר של 1/4 ו־1/6?", "12", ["24", "10", "6"], "12 הוא המספר הקטן ביותר ששני המספרים 4 ו־6 מחלקים אותו (4 × 3 = 12 ו־6 × 2 = 12). גם 24 מתאים, אבל הוא לא הקטן ביותר; 10 הוא רק 4 + 6."]],
      [["Which fraction is more than one half?", "4/7", ["3/7", "5/12", "2/5"], "Multiply the numerator by 2 and compare with the denominator: 4 × 2 = 8 is more than 7, so 4/7 is more than a half. For 3/7, 5/12 and 2/5 twice the numerator is less."],
        ["איזה שבר גדול מחצי?", "4/7", ["3/7", "5/12", "2/5"], "מכפילים את המונה ב־2 ומשווים למכנה: 4 × 2 = 8 יותר מ־7, ולכן 4/7 יותר מחצי. ב־3/7, 5/12 ו־2/5 פי 2 מהמונה קטן מהמכנה."]],
      [["In a test, Ella got 7/10 of the questions right and Ben got 3/4. Who did better?", "Ben", ["Ella", "They did the same"], "Use 20 as a common denominator: 7/10 = 14/20 and 3/4 = 15/20. 15/20 is more than 14/20, so Ben did a little better."],
        ["במבחן אלה ענתה נכון על 7/10 מהשאלות, ובן ענה נכון על 3/4. מי הצליח יותר?", "בן", ["אלה", "הם הצליחו באותה מידה"], "משתמשים ב־20 כמכנה משותף: 7/10 = 14/20 ו־3/4 = 15/20. 15/20 יותר מ־14/20, ולכן בן הצליח קצת יותר."]],
      [["Which list is in order from smallest to biggest?", "1/4, 1/3, 1/2", ["1/2, 1/3, 1/4", "1/3, 1/4, 1/2", "1/4, 1/2, 1/3"], "With the same numerator 1, fewer parts means bigger parts: quarters are smaller than thirds, and thirds are smaller than halves."],
        ["איזו רשימה מסודרת מהקטן לגדול?", "1/4, 1/3, 1/2", ["1/2, 1/3, 1/4", "1/3, 1/4, 1/2", "1/4, 1/2, 1/3"], "כשהמונה של כולם 1, פחות חלקים פירושם חלקים גדולים יותר: רבעים קטנים משלישים, ושלישים קטנים מחצאים."]],
    ],
    n: [
      [8, ["2/3 = x/12. What is x?", "", "12 is 3 × 4, so multiply the numerator by 4 too: 2 × 4 = 8, and 2/3 = 8/12."], ["2/3 = x/12. מהו x?", "", "12 הוא 3 × 4, ולכן מכפילים גם את המונה ב־4: 2 × 4 = 8, ו־2/3 = 8/12."]],
      [10, ["3/4 = 9/12 and 5/6 = x/12. What is x?", "", "6 × 2 = 12, so 5 × 2 = 10: 5/6 = 10/12, which is more than 9/12. So 5/6 is bigger than 3/4."], ["3/4 = 9/12 ו־5/6 = x/12. מהו x?", "", "6 × 2 = 12, ולכן 5 × 2 = 10: 5/6 = 10/12, וזה יותר מ־9/12. לכן 5/6 גדול מ־3/4."]],
      [1, ["By how many twelfths is 3/4 bigger than 2/3?", "", "3/4 = 9/12 and 2/3 = 8/12, and 9 − 8 = 1, so the difference is 1/12 — one twelfth."], ["כשכותבים את 3/4 ואת 2/3 עם מכנה 12, בכמה גדול המונה של 3/4 מהמונה של 2/3?", "", "3/4 = 9/12 ו־2/3 = 8/12, ו־9 − 8 = 1, ולכן ההפרש בין השברים הוא 1/12."]],
    ],
    s: [[["Put in order from smallest to biggest", "1/3", "1/2", "2/3", "5/6"], ["סדרו מהקטן לגדול", "1/3", "1/2", "2/3", "5/6"]]],
  },
  a: {
    t: [
      ["Distance from one whole", "how much is missing from a fraction to make 1, such as 1/8 for 7/8", "המרחק מהשלם", "כמה חסר לשבר כדי להגיע ל־1, למשל 1/8 עבור 7/8"],
      ["Ascending order", "from the smallest to the biggest", "סדר עולה", "מהקטן ביותר אל הגדול ביותר"],
    ],
    q: [
      [["Which is bigger: 7/8 or 8/9?", "8/9", ["7/8", "They are equal"], "7/8 is 1/8 short of a whole and 8/9 is 1/9 short. 1/9 is the smaller gap, so 8/9 is closer to 1 and bigger."],
        ["מה גדול יותר: 7/8 או 8/9?", "8/9", ["7/8", "הם שווים"], "ל־7/8 חסרה 1/8 כדי להגיע לשלם, ול־8/9 חסרה 1/9. 1/9 הוא הפער הקטן יותר, ולכן 8/9 קרוב יותר ל־1 וגדול יותר."]],
      [["Which fraction is between 1/2 and 1?", "5/8", ["3/8", "9/8", "1/4"], "5/8 is more than 4/8 (a half) and less than 8/8 (a whole). 3/8 and 1/4 are less than a half; 9/8 is more than a whole."],
        ["איזה שבר נמצא בין 1/2 ל־1?", "5/8", ["3/8", "9/8", "1/4"], "5/8 יותר מ־4/8 (חצי) ופחות מ־8/8 (שלם). 3/8 ו־1/4 פחות מחצי; 9/8 יותר משלם."]],
      [["Which fraction is closest to 1?", "11/12", ["5/6", "4/5", "2/3"], "Look at what is missing to make 1: 1/12, 1/6, 1/5 and 1/3. The smallest gap is 1/12, so 11/12 is the closest to 1."],
        ["איזה שבר הכי קרוב ל־1?", "11/12", ["5/6", "4/5", "2/3"], "בודקים כמה חסר לכל שבר כדי להגיע ל־1: 1/12, 1/6, 1/5 ו־1/3. הפער הקטן ביותר הוא 1/12, ולכן 11/12 הכי קרוב ל־1."]],
      [["Three friends ate from pizzas of the same size: Adi ate 3/8, Bar ate 1/3 and Gil ate 5/12. Who ate the most?", "Gil", ["Adi", "Bar"], "With 24 as the common denominator: 3/8 = 9/24, 1/3 = 8/24 and 5/12 = 10/24. Gil ate the most and Bar the least."],
        ["שלושה חברים אכלו מפיצות באותו גודל: עדי אכל 3/8, בר אכלה 1/3 וגיל אכל 5/12. מי אכל הכי הרבה?", "גיל", ["עדי", "בר"], "עם 24 כמכנה משותף: 3/8 = 9/24, 1/3 = 8/24 ו־5/12 = 10/24. גיל אכל הכי הרבה, ובר הכי מעט."]],
      [["Can a fraction with a bigger denominator be the bigger fraction?", "Yes, for example 3/4 is more than 1/2", ["No, a bigger denominator always means a smaller fraction", "Only when the two numerators are equal"], "The denominator alone does not decide. 3/4 has a bigger denominator than 1/2, but 3/4 = 6/8 is more than 1/2 = 4/8."],
        ["האם שבר עם מכנה גדול יותר יכול להיות השבר הגדול יותר?", "כן, למשל 3/4 יותר מ־1/2", ["לא, מכנה גדול יותר תמיד אומר שבר קטן יותר", "רק כשהמונים של שני השברים שווים"], "המכנה לבד לא קובע. ל־3/4 יש מכנה גדול יותר מאשר ל־1/2, אבל 3/4 = 6/8 יותר מ־1/2 = 4/8."]],
    ],
    n: [
      [24, ["What is the least common denominator of 3/8 and 5/12?", "", "8 and 12 both divide 24 (8 × 3 and 12 × 2). The only smaller multiple of 12 is 12 itself, and 8 does not divide 12, so 24 is the smallest."], ["מהו המכנה המשותף הקטן ביותר של 3/8 ו־5/12?", "", "גם 8 וגם 12 מחלקים את 24 (8 × 3 ו־12 × 2). הכפולה היחידה של 12 שקטנה מ־24 היא 12 עצמו, ו־8 לא מחלק את 12, ולכן 24 הוא הקטן ביותר."]],
      [2, ["How many fractions with denominator 10 are between 1/2 and 4/5, not counting these two?", "", "1/2 = 5/10 and 4/5 = 8/10. Between them are 6/10 and 7/10, so there are 2 such fractions."], ["כמה שברים שהמכנה שלהם 10 נמצאים בין 1/2 ל־4/5, בלי לספור את שניהם?", "", "1/2 = 5/10 ו־4/5 = 8/10. ביניהם נמצאים 6/10 ו־7/10, ולכן יש 2 שברים כאלה."]],
      [15, ["Write 5/6 with denominator 18. What is the numerator?", "", "18 = 6 × 3, so multiply the numerator by 3 as well: 5 × 3 = 15, and 5/6 = 15/18."], ["כתבו את 5/6 עם מכנה 18. מהו המונה?", "", "18 = 6 × 3, ולכן מכפילים גם את המונה ב־3: 5 × 3 = 15, ו־5/6 = 15/18."]],
    ],
    s: [[["Put in order from smallest to biggest", "3/5", "2/3", "3/4", "4/5"], ["סדרו מהקטן לגדול", "3/5", "2/3", "3/4", "4/5"]]],
  },
};
export default c;
