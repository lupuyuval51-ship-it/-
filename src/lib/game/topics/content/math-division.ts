import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Division", "splitting an amount into equal groups or equal shares", "חילוק", "פירוק של כמות לקבוצות שוות או למנות שוות"],
      ["Sharing", "giving out an amount fairly, so that everyone gets the same number", "חלוקה שווה", "נתינה של כמות באופן הוגן, כך שכל אחד מקבל אותו מספר"],
      ["Grouping", "finding how many groups of a given size can be made from an amount", "חלוקה לקבוצות", "מציאה של מספר הקבוצות בגודל מסוים שאפשר ליצור מכמות"],
    ],
    q: [
      [["12 sweets are shared equally between 3 children. How many sweets does each child get?", "4", ["3", "9", "15"], "12 ÷ 3 = 4, because 3 × 4 = 12. 9 is 12 − 3 and 15 is 12 + 3, which are not sharing."],
        ["מחלקים 12 סוכריות באופן שווה בין 3 ילדים. כמה סוכריות מקבל כל ילד?", "4", ["3", "9", "15"], "12 ÷ 3 = 4, כי 3 × 4 = 12. המספר 9 הוא 12 − 3 והמספר 15 הוא 12 + 3, וזו לא חלוקה."]],
      [["Which multiplication fact helps you work out 20 ÷ 5?", "4 × 5 = 20", ["5 × 5 = 25", "20 × 5 = 100", "20 + 5 = 25"], "Division undoes multiplication: 4 × 5 = 20 means that 20 ÷ 5 = 4."],
        ["איזו עובדת כפל עוזרת לחשב את 20 ÷ 5?", "4 × 5 = 20", ["5 × 5 = 25", "20 × 5 = 100", "20 + 5 = 25"], "חילוק מבטל כפל: מכיוון ש־4 × 5 = 20, יוצא ש־20 ÷ 5 = 4."]],
      [["You have 18 eggs and put 6 eggs in each box. How many boxes do you fill?", "3", ["2", "12", "24"], "This is grouping: how many 6s are in 18? 6, 12, 18 makes three groups, so 18 ÷ 6 = 3."],
        ["יש לכם 18 ביצים, ואתם שמים 6 ביצים בכל קופסה. כמה קופסאות תמלאו?", "3", ["2", "12", "24"], "זו חלוקה לקבוצות: כמה פעמים 6 נכנס ב־18? 6, 12, 18 הן שלוש קבוצות, ולכן 18 ÷ 6 = 3."]],
      [["What is 30 ÷ 10?", "3", ["300", "20", "40"], "30 is 3 tens, so 30 ÷ 10 = 3. Dividing by 10 moves every digit one place to the right. 300 is 30 × 10."],
        ["כמה זה 30 ÷ 10?", "3", ["300", "20", "40"], "30 הוא 3 עשרות, ולכן 30 ÷ 10 = 3. חילוק ב־10 מזיז כל ספרה מקום אחד ימינה. המספר 300 הוא 30 × 10."]],
      [["What does the sign ÷ mean?", "Divide", ["Multiply", "Add", "Take away"], "The sign ÷ means divide, as in 8 ÷ 2 = 4. Multiply is written ×, add is + and take away is −."],
        ["מה פירוש הסימן ÷?", "חילוק", ["כפל", "חיבור", "חיסור"], "הסימן ÷ פירושו חילוק, כמו ב־8 ÷ 2 = 4. כפל נכתב ×, חיבור + וחיסור −."]],
    ],
    n: [
      [5, ["How many groups of 4 can you make from 20?", "", "Count in fours: 4, 8, 12, 16, 20 is 5 groups, so 20 ÷ 4 = 5."],
        ["כמה קבוצות של 4 אפשר ליצור מ־20?", "", "סופרים בקפיצות של 4: 4, 8, 12, 16, 20 הן 5 קבוצות, ולכן 20 ÷ 4 = 5."]],
      [7, ["What is 35 ÷ 5?", "", "Use the 5 times table: 5 × 7 = 35, so 35 ÷ 5 = 7."],
        ["כמה זה 35 ÷ 5?", "", "נעזרים בכפולות של 5: 5 × 7 = 35, ולכן 35 ÷ 5 = 7."]],
    ],
    s: [[["Sharing 15 marbles fairly between 3 friends, in order", "Count the marbles: there are 15", "Give one marble to each friend in turn", "Keep going round until no marbles are left", "Count the marbles of one friend: 5", "Check with multiplication: 3 × 5 = 15"],
      ["מחלקים 15 גולות באופן שווה בין 3 חברים, לפי הסדר", "סופרים את הגולות: יש 15", "נותנים גולה אחת לכל חבר בתורו", "ממשיכים לחלק בסבבים עד שלא נשארות גולות", "סופרים את הגולות של חבר אחד: 5", "בודקים בכפל: 3 × 5 = 15"]]],
  },
  i: {
    t: [
      ["Remainder", "what is left over when an amount cannot be split exactly into equal groups", "שארית", "מה שנשאר כשאי אפשר לחלק כמות בדיוק לקבוצות שוות"],
      ["Dividend", "the number being divided; in 20 ÷ 4 it is 20", "מחולק", "המספר שאותו מחלקים; ב־20 ÷ 4 זה 20"],
      ["Divisor", "the number you divide by; in 20 ÷ 4 it is 4", "מחלק", "המספר שבו מחלקים; ב־20 ÷ 4 זה 4"],
      ["Quotient", "the answer to a division; in 20 ÷ 4 it is 5", "מנה", "התוצאה של תרגיל חילוק; ב־20 ÷ 4 זו 5"],
    ],
    q: [
      [["What is 23 ÷ 5?", "4 remainder 3", ["4 remainder 2", "5 remainder 2", "3 remainder 8"], "5 × 4 = 20 and 23 − 20 = 3, so 23 ÷ 5 = 4 remainder 3. In 3 remainder 8 the remainder is bigger than 5, so another 5 still fits."],
        ["כמה זה 23 ÷ 5?", "4 ושארית 3", ["4 ושארית 2", "5 ושארית 2", "3 ושארית 8"], "5 × 4 = 20 ו־23 − 20 = 3, ולכן 23 ÷ 5 = 4 ושארית 3. ב־3 ושארית 8 השארית גדולה מ־5, כלומר עוד קבוצה של 5 עדיין נכנסת."]],
      [["Which remainder is impossible when you divide by 4?", "4", ["0", "3", "1"], "A remainder must be smaller than the number you divide by. A remainder of 4 would mean that another group of 4 still fits. A remainder of 0 just means it divides exactly."],
        ["איזו שארית בלתי אפשרית כשמחלקים ב־4?", "4", ["0", "3", "1"], "השארית חייבת להיות קטנה מהמספר שבו מחלקים. שארית 4 פירושה שעוד קבוצה של 4 עדיין נכנסת. שארית 0 פירושה רק שהחילוק יוצא בדיוק."]],
      [["26 children go on a trip, and each car takes 4 children. How many cars are needed?", "7", ["6", "6 remainder 2", "8"], "26 ÷ 4 = 6 remainder 2. Six cars take 24 children, and the 2 children left over still need a car, so 7 cars are needed."],
        ["26 ילדים יוצאים לטיול, ובכל מכונית יש מקום ל־4 ילדים. כמה מכוניות צריך?", "7", ["6", "6 ושארית 2", "8"], "26 ÷ 4 = 6 ושארית 2. שש מכוניות לוקחות 24 ילדים, ו־2 הילדים שנשארו צריכים עוד מכונית, ולכן צריך 7 מכוניות."]],
      [["Which division fact belongs with 7 × 9 = 63?", "63 ÷ 7 = 9", ["63 ÷ 9 = 6", "9 ÷ 7 = 63", "63 ÷ 3 = 7"], "If 7 × 9 = 63, then 63 ÷ 7 = 9 and 63 ÷ 9 = 7. The fact 63 ÷ 9 = 6 is false, because 9 × 6 = 54."],
        ["איזו עובדת חילוק שייכת ל־7 × 9 = 63?", "63 ÷ 7 = 9", ["63 ÷ 9 = 6", "9 ÷ 7 = 63", "63 ÷ 3 = 7"], "אם 7 × 9 = 63, אז 63 ÷ 7 = 9 וגם 63 ÷ 9 = 7. העובדה 63 ÷ 9 = 6 שגויה, כי 9 × 6 = 54."]],
      [["A ribbon 50 cm long is cut into pieces of 8 cm. How many whole pieces can be cut, and how much is left?", "6 pieces, 2 cm left", ["6 pieces, 4 cm left", "5 pieces, 10 cm left", "7 pieces, 0 cm left"], "8 × 6 = 48 and 50 − 48 = 2, so 6 whole pieces with 2 cm left. With 10 cm left, one more 8 cm piece could still be cut."],
        ["סרט באורך 50 ס״מ נחתך לחתיכות של 8 ס״מ. כמה חתיכות שלמות אפשר לחתוך, וכמה נשאר?", "6 חתיכות, נשארים 2 ס״מ", ["6 חתיכות, נשארים 4 ס״מ", "5 חתיכות, נשארים 10 ס״מ", "7 חתיכות, לא נשאר כלום"], "8 × 6 = 48 ו־50 − 48 = 2, ולכן 6 חתיכות שלמות ונשארים 2 ס״מ. אם נשארים 10 ס״מ, אפשר לחתוך עוד חתיכה של 8 ס״מ."]],
    ],
    n: [
      [8, ["What is 72 ÷ 9?", "", "Use the 9 times table: 9 × 8 = 72, so 72 ÷ 9 = 8."],
        ["כמה זה 72 ÷ 9?", "", "נעזרים בכפולות של 9: 9 × 8 = 72, ולכן 72 ÷ 9 = 8."]],
      [5, ["What is the remainder when 47 is divided by 6?", "", "6 × 7 = 42 and 47 − 42 = 5, so the remainder is 5."],
        ["מהי השארית כשמחלקים את 47 ב־6?", "", "6 × 7 = 42 ו־47 − 42 = 5, ולכן השארית היא 5."]],
    ],
  },
  a: {
    t: [
      ["Long division", "a written method that divides digit by digit from the left, bringing down the next digit each time", "חילוק ארוך", "דרך כתובה שבה מחלקים ספרה אחר ספרה משמאל, ומורידים בכל פעם את הספרה הבאה"],
      ["Divisible", "able to be divided exactly, with a remainder of 0", "מתחלק", "שאפשר לחלק אותו בדיוק, כך שהשארית היא 0"],
      ["Checking with multiplication", "multiplying the answer by the divisor and adding the remainder to get back the starting number", "בדיקה בכפל", "כפל של התוצאה במחלק והוספת השארית, כדי לחזור למספר שממנו התחלנו"],
    ],
    q: [
      [["What is 156 ÷ 4?", "39", ["38", "41", "624"], "4 into 15 is 3 remainder 3; bring down the 6 to make 36; 4 into 36 is 9. So 39. Check: 39 × 4 = 156."],
        ["כמה זה 156 ÷ 4?", "39", ["38", "41", "624"], "15 ÷ 4 = 3 ושארית 3; מורידים את ה־6 ומקבלים 36; 36 ÷ 4 = 9. לכן 39. בדיקה: 39 × 4 = 156."]],
      [["Dan divided 250 by 7 and got 35 remainder 5. How can he check his answer?", "35 × 7 + 5 should equal 250", ["35 × 5 + 7 should equal 250", "250 × 7 + 5 should equal 35", "35 + 7 + 5 should equal 250"], "Multiply the quotient by the divisor and add the remainder: 35 × 7 = 245 and 245 + 5 = 250, so the answer is right."],
        ["דן חילק את 250 ב־7 וקיבל 35 ושארית 5. איך הוא יכול לבדוק את התשובה?", "35 × 7 + 5 צריך לצאת 250", ["35 × 5 + 7 צריך לצאת 250", "250 × 7 + 5 צריך לצאת 35", "35 + 7 + 5 צריך לצאת 250"], "כופלים את המנה במחלק ומוסיפים את השארית: 35 × 7 = 245 ו־245 + 5 = 250, ולכן התשובה נכונה."]],
      [["Which number is divisible by 6?", "114", ["116", "124", "93"], "114 ÷ 6 = 19 exactly. A number divisible by 6 is even and its digits add up to a multiple of 3: 1 + 1 + 4 = 6. 116 and 124 are even but fail the 3 test, and 93 is odd."],
        ["איזה מספר מתחלק ב־6?", "114", ["116", "124", "93"], "114 ÷ 6 = 19 בדיוק. מספר שמתחלק ב־6 הוא זוגי, וסכום הספרות שלו מתחלק ב־3: 1 + 1 + 4 = 6. המספרים 116 ו־124 זוגיים אבל לא עוברים את בדיקת ה־3, ו־93 אי־זוגי."]],
      [["What is 4,800 ÷ 100?", "48", ["480", "4.8", "480,000"], "Dividing by 100 moves every digit two places to the right: 4,800 ÷ 100 = 48. 480 is only 4,800 ÷ 10."],
        ["כמה זה 4,800 ÷ 100?", "48", ["480", "4.8", "480,000"], "חילוק ב־100 מזיז כל ספרה שני מקומות ימינה: 4,800 ÷ 100 = 48. המספר 480 הוא רק 4,800 ÷ 10."]],
      [["A baker puts 345 rolls into bags of 12. How many bags can be filled completely?", "28", ["29", "27", "4,140"], "12 × 28 = 336 and 345 − 336 = 9. That is 28 full bags with 9 rolls left over, too few to fill another bag."],
        ["אופה אורז 345 לחמניות בשקיות של 12. כמה שקיות אפשר למלא עד הסוף?", "28", ["29", "27", "4,140"], "12 × 28 = 336 ו־345 − 336 = 9. כלומר 28 שקיות מלאות ועוד 9 לחמניות, מעט מדי כדי למלא שקית נוספת."]],
    ],
    n: [
      [84, ["What is 588 ÷ 7?", "", "7 into 58 is 8 remainder 2; bring down the 8 to make 28; 7 into 28 is 4. So 84. Check: 84 × 7 = 588."],
        ["כמה זה 588 ÷ 7?", "", "58 ÷ 7 = 8 ושארית 2; מורידים את ה־8 ומקבלים 28; ו־28 ÷ 7 = 4. לכן 84. בדיקה: 84 × 7 = 588."]],
      [6, ["What is the remainder when 1,000 is divided by 7?", "", "7 × 142 = 994 and 1,000 − 994 = 6, so the remainder is 6."],
        ["מהי השארית כשמחלקים את 1,000 ב־7?", "", "7 × 142 = 994 ו־1,000 − 994 = 6, ולכן השארית היא 6."]],
    ],
    s: [[["Long division of 936 ÷ 4, in order", "4 into 9 goes 2 times, remainder 1", "Bring down the 3 to make 13", "4 into 13 goes 3 times, remainder 1", "Bring down the 6 to make 16", "4 into 16 goes 4 times, so the answer is 234"],
      ["חילוק ארוך של 936 ÷ 4, לפי הסדר", "9 ÷ 4 = 2 ושארית 1", "מורידים את ה־3 ומקבלים 13", "13 ÷ 4 = 3 ושארית 1", "מורידים את ה־6 ומקבלים 16", "16 ÷ 4 = 4, ולכן התשובה היא 234"]]],
  },
};
export default c;
