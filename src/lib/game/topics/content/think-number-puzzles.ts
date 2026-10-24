import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Sudoku", "a 9 × 9 grid puzzle where every row, column and 3 × 3 block holds the digits 1 to 9 once each", "סודוקו", "חידה על לוח 9 על 9 שבה כל שורה, עמודה ובלוק 3 על 3 מכילים את הספרות 1 עד 9 פעם אחת בדיוק"],
      ["Box", "one of the nine 3 × 3 blocks that a sudoku grid is split into", "תיבה", "אחד מתשעת הבלוקים בגודל 3 על 3 שאליהם מחולק לוח הסודוקו"],
      ["Magic square", "a square grid of numbers in which every row, column and main diagonal adds up to the same total", "ריבוע קסם", "טבלה ריבועית של מספרים שבה כל שורה, כל עמודה וכל אלכסון ראשי מסתכמים באותו סכום"],
    ],
    q: [
      [["In a standard sudoku, which digits go in each row?", "1 to 9, each exactly once", ["1 to 9, repeated as often as you like", "0 to 9, each exactly once", "Any ten digits that you choose"], "A sudoku row has 9 cells and must hold each of the digits 1 to 9 exactly once. The same rule holds for every column and every box."],
        ["בסודוקו רגיל, אילו ספרות נכנסות לכל שורה?", "1 עד 9, כל אחת פעם אחת בדיוק", ["1 עד 9, כל אחת כמה פעמים שרוצים", "0 עד 9, כל אחת פעם אחת בדיוק", "כל עשר ספרות שבוחרים"], "בשורה של סודוקו יש 9 משבצות, והיא חייבת להכיל כל אחת מהספרות 1 עד 9 פעם אחת בדיוק. אותו כלל נכון לכל עמודה ולכל תיבה."]],
      [["A sudoku row already has 1, 2, 3, 4, 5, 6, 7 and 9. Which digit goes in the empty cell?", "8", ["9", "1", "0"], "Each of the digits 1 to 9 must appear once in the row. The only one missing from the list is 8. Sudoku never uses 0."],
        ["בשורה של סודוקו כבר יש 1, 2, 3, 4, 5, 6, 7 ו־9. איזו ספרה נכנסת למשבצת הריקה?", "8", ["9", "1", "0"], "כל אחת מהספרות 1 עד 9 חייבת להופיע פעם אחת בשורה. הספרה היחידה שחסרה ברשימה היא 8. בסודוקו אין 0."]],
      [["What is the same for every row, column and diagonal of a magic square?", "the sum of its numbers", ["the biggest number in it", "the order of its numbers", "the colour of its cells"], "That is what makes the square 'magic': add up any row, any column or either main diagonal and you get the same total."],
        ["מה זהה בכל שורה, עמודה ואלכסון של ריבוע קסם?", "סכום המספרים", ["המספר הגדול ביותר בה", "סדר המספרים בה", "הצבע של המשבצות"], "זה מה שהופך את הריבוע ל״ריבוע קסם״: מחברים כל שורה, כל עמודה או כל אחד משני האלכסונים הראשיים ומקבלים אותו סכום."]],
      [["In a sudoku, can two 5s appear in the same column?", "No, never", ["Yes, if they are in different boxes", "Yes, but only in the top row", "Only in the hardest puzzles"], "Every column must hold each digit exactly once, so a second 5 in the same column is never allowed, whatever box it is in."],
        ["בסודוקו, האם יכולות להופיע שתי ספרות 5 באותה עמודה?", "לא, אף פעם", ["כן, אם הן בתיבות שונות", "כן, אבל רק בשורה העליונה", "רק בחידות הקשות ביותר"], "כל עמודה חייבת להכיל כל ספרה פעם אחת בדיוק, ולכן 5 נוסף באותה עמודה אסור תמיד, לא משנה באיזו תיבה הוא נמצא."]],
    ],
    n: [
      [6, ["Every row of a magic square adds up to 15. One row has 8, 1 and x. What is x?", "", "8 + 1 = 9, and 15 − 9 = 6, so the missing number is 6."],
        ["כל שורה בריבוע קסם מסתכמת ב־15. בשורה אחת יש 8, 1 ו־x. מהו x?", "", "8 + 1 = 9, ו־15 − 9 = 6, ולכן המספר החסר הוא 6."]],
      [4, ["In a letter puzzle, A + A = 8. Which digit is A?", "", "Two equal digits make 8, so each one is half of 8: A = 4, because 4 + 4 = 8."],
        ["בחידת אותיות, A + A = 8. איזו ספרה היא A?", "", "שתי ספרות שוות נותנות 8, ולכן כל אחת היא חצי מ־8: A = 4, כי 4 + 4 = 8."]],
    ],
    s: [[["Finding the missing digit for a sudoku cell", "Read the digits already in the cell's row", "List the digits from 1 to 9 that the row is missing", "Cross out any of them already in the cell's column or box", "Write the one digit that is left into the cell"],
      ["מציאת הספרה החסרה במשבצת של סודוקו", "קוראים את הספרות שכבר נמצאות בשורה של המשבצת", "רושמים את הספרות מ־1 עד 9 שחסרות בשורה", "מוחקים מהן כל ספרה שכבר נמצאת בעמודה או בתיבה של המשבצת", "כותבים במשבצת את הספרה היחידה שנשארה"]]],
  },
  i: {
    t: [
      ["Magic sum", "the total that each row, column and diagonal of a magic square adds up to", "סכום הקסם", "הסך שאליו מגיעים כל שורה, עמודה ואלכסון של ריבוע קסם"],
      ["Kakuro", "a crossword-like number puzzle where each run of white cells must add up to its clue, with no digit used twice in a run", "קאקורו", "חידת מספרים דמוית תשבץ שבה כל רצף של משבצות לבנות חייב להסתכם ברמז שלו, בלי ספרה שחוזרת ברצף"],
      ["KenKen", "a grid where each row and column holds each digit once and every outlined cage must reach its target using a given operation", "קנקן", "לוח שבו כל שורה ועמודה מכילות כל ספרה פעם אחת, וכל כלוב מסומן חייב להגיע ליעד שלו בפעולת חשבון נתונה"],
      ["Letter sum", "a calculation in which letters stand for digits, with a different digit for each letter", "תרגיל אותיות", "תרגיל חשבון שבו כל אות מייצגת ספרה, ולכל אות ספרה אחרת"],
    ],
    q: [
      [["In a 3 × 3 magic square using the numbers 1 to 9, which number is always in the centre?", "5", ["9", "1", "15"], "The middle row, the middle column and both diagonals pass through the centre and each adds to 15, which totals 60. They cover all nine numbers (45) plus the centre three more times, so 3 × centre = 15 and the centre is 5."],
        ["בריבוע קסם 3 על 3 עם המספרים 1 עד 9, איזה מספר נמצא תמיד במרכז?", "5", ["9", "1", "15"], "השורה האמצעית, העמודה האמצעית ושני האלכסונים עוברים דרך המרכז, וכל אחד מהם מסתכם ב־15, יחד 60. הם מכסים את כל תשעת המספרים (45) ועוד את המרכז שלוש פעמים נוספות, ולכן 3 × מרכז = 15 והמרכז הוא 5."]],
      [["A sudoku cell's row holds 1, 2, 3 and 4, its column holds 5, 6 and 7, and its box holds 8. Which digit must go in the cell?", "9", ["8", "1", "6"], "The row rules out 1 to 4, the column rules out 5 to 7 and the box rules out 8. The only digit from 1 to 9 left is 9."],
        ["בשורה של משבצת בסודוקו יש 1, 2, 3 ו־4, בעמודה שלה יש 5, 6 ו־7, ובתיבה שלה יש 8. איזו ספרה חייבת להיכנס למשבצת?", "9", ["8", "1", "6"], "השורה פוסלת את 1 עד 4, העמודה פוסלת את 5 עד 7 והתיבה פוסלת את 8. הספרה היחידה מ־1 עד 9 שנשארה היא 9."]],
      [["In Kakuro, a run of two white cells has the clue 3. Which digits go in it?", "1 and 2", ["1 and 1", "0 and 3", "2 and 2"], "Kakuro uses the digits 1 to 9 with no repeats in a run. The only two different digits from 1 to 9 that add to 3 are 1 and 2."],
        ["בקאקורו, לרצף של שתי משבצות לבנות יש רמז 3. אילו ספרות נכנסות אליו?", "1 ו־2", ["1 ו־1", "0 ו־3", "2 ו־2"], "בקאקורו משתמשים בספרות 1 עד 9 בלי חזרות ברצף. שתי הספרות השונות היחידות מ־1 עד 9 שסכומן 3 הן 1 ו־2."]],
      [["In a 4 × 4 KenKen, a two-cell cage is marked 12×. Which digits fill it?", "3 and 4", ["2 and 6", "1 and 12", "2 and 4"], "A 4 × 4 KenKen uses only the digits 1 to 4, and the only pair of them with a product of 12 is 3 × 4. 2 × 6 is also 12, but 6 is not allowed."],
        ["בקנקן 4 על 4, היעד של כלוב בן שתי משבצות הוא מכפלה של 12. אילו ספרות ממלאות אותו?", "3 ו־4", ["2 ו־6", "1 ו־12", "2 ו־4"], "בקנקן 4 על 4 משתמשים רק בספרות 1 עד 4, והזוג היחיד מהן שמכפלתו 12 הוא 3 × 4. גם 2 × 6 שווה 12, אבל 6 אסור."]],
      [["In the letter sum SEND + MORE = MONEY, why must M be 1?", "Two four-digit numbers add up to less than 20,000", ["Every first letter in such a puzzle stands for 1", "MONEY is shorter than SEND and MORE", "M is the only letter that appears in both added words"], "The biggest possible sum of two four-digit numbers is 9,999 + 9,999 = 19,998. So a five-digit answer must start with 1, and M = 1."],
        ["בתרגיל האותיות SEND + MORE = MONEY, למה M חייבת להיות 1?", "סכום של שני מספרים בני ארבע ספרות קטן מ־20,000", ["כל אות ראשונה בתרגיל כזה מייצגת 1", "MONEY קצרה מ־SEND ומ־MORE", "M היא האות היחידה שמופיעה בשני המחוברים"], "הסכום הגדול ביותר של שני מספרים בני ארבע ספרות הוא 9,999 + 9,999 = 19,998. לכן תשובה בת חמש ספרות חייבת להתחיל ב־1, ו־M = 1."]],
    ],
    n: [
      [15, ["What is the magic sum of a 3 × 3 magic square that uses each number from 1 to 9 once?", "", "1 + 2 + … + 9 = 45, and the three rows share that total equally: 45 ÷ 3 = 15."],
        ["מהו סכום הקסם של ריבוע קסם 3 על 3 שמשתמש בכל מספר מ־1 עד 9 פעם אחת?", "", "1 + 2 + … + 9 = 45, ושלוש השורות מתחלקות בסכום הזה שווה בשווה: 45 ÷ 3 = 15."]],
      [28, ["AB is a two-digit number, and AB + AB = 56. What is AB?", "", "Adding a number to itself doubles it, so AB = 56 ÷ 2 = 28. Check: 28 + 28 = 56."],
        ["AB הוא מספר דו־ספרתי, ו־AB + AB = 56. מהו AB?", "", "חיבור של מספר לעצמו מכפיל אותו, ולכן AB = 56 ÷ 2 = 28. בדיקה: 28 + 28 = 56."]],
    ],
  },
  a: {
    t: [
      ["Order of a magic square", "the number of cells along one side of the square grid", "סדר של ריבוע קסם", "מספר המשבצות לאורך צלע אחת של הטבלה הריבועית"],
      ["Candidate digit", "a digit that is still possible in an empty cell, often pencilled in small", "ספרה מועמדת", "ספרה שעדיין אפשרית במשבצת ריקה, ולעיתים כותבים אותה קטן בעיפרון"],
      ["Hidden single", "a digit that fits only one cell of a row, column or box, even though that cell has other options", "יחיד נסתר", "ספרה שמתאימה רק למשבצת אחת בשורה, בעמודה או בתיבה, אף שלמשבצת הזאת יש גם אפשרויות אחרות"],
    ],
    q: [
      [["Which formula gives the magic sum of an n × n magic square that uses the numbers 1 to n²?", "n(n² + 1) ÷ 2", ["n(n + 1) ÷ 2", "(n² + 1) ÷ 2", "n² ÷ 2"], "The numbers 1 to n² add up to n²(n² + 1) ÷ 2, and the n rows share this equally, giving n(n² + 1) ÷ 2. For n = 3 that is 3 × 10 ÷ 2 = 15."],
        ["איזו נוסחה נותנת את סכום הקסם של ריבוע קסם n על n שמשתמש במספרים 1 עד n²?", "n(n² + 1) ÷ 2", ["n(n + 1) ÷ 2", "(n² + 1) ÷ 2", "n² ÷ 2"], "סכום המספרים 1 עד n² הוא n²(n² + 1) ÷ 2, ו־n השורות מתחלקות בו שווה בשווה, כלומר n(n² + 1) ÷ 2. עבור n = 3 מקבלים 3 × 10 ÷ 2 = 15."]],
      [["What is the smallest number of given digits a standard sudoku can have and still have only one solution?", "17", ["16", "22", "9"], "A computer search finished in 2012 showed that no puzzle with 16 clues has a single solution, while many puzzles with 17 clues do."],
        ["מהו המספר הקטן ביותר של ספרות נתונות שיכול להיות בסודוקו רגיל כך שעדיין יהיה לו פתרון אחד בלבד?", "17", ["16", "22", "9"], "חיפוש ממוחשב שהסתיים ב־2012 הראה שלאף חידה עם 16 רמזים אין פתרון יחיד, ואילו לחידות רבות עם 17 רמזים יש."]],
      [["In one box, the digit 7 can only go in two cells, and both are in the same row. What can you conclude?", "7 cannot go anywhere else in that row", ["7 must be in the first of those two cells", "7 cannot go anywhere else in those cells' columns", "No other digit can appear in that row"], "The 7 of this box must be in that row, and a row holds only one 7, so the rest of the row cannot have a 7. The two cells are in different columns, so nothing follows for the columns."],
        ["בתיבה אחת, הספרה 7 יכולה להיכנס רק לשתי משבצות, ושתיהן באותה שורה. מה אפשר להסיק?", "7 לא יכולה להופיע בשום מקום אחר בשורה הזאת", ["7 חייבת להיות במשבצת הראשונה מבין השתיים", "7 לא יכולה להופיע בשום מקום אחר בעמודות שלהן", "שום ספרה אחרת לא יכולה להופיע בשורה הזאת"], "ה־7 של התיבה חייבת להיות בשורה הזאת, ובשורה יש רק 7 אחת, ולכן בשאר השורה אין 7. שתי המשבצות נמצאות בעמודות שונות, ולכן לגבי העמודות לא נובע דבר."]],
      [["In Kakuro, a run of three cells has the clue 24. Which three digits fill it?", "7, 8 and 9", ["6, 9 and 9", "8, 8 and 8", "5, 9 and 10"], "The biggest three different digits are 7, 8 and 9, and they add up to exactly 24, so there is no other choice. Repeated digits and the number 10 are not allowed."],
        ["בקאקורו, לרצף של שלוש משבצות יש רמז 24. אילו שלוש ספרות ממלאות אותו?", "7, 8 ו־9", ["6, 9 ו־9", "8, 8 ו־8", "5, 9 ו־10"], "שלוש הספרות השונות הגדולות ביותר הן 7, 8 ו־9, וסכומן בדיוק 24, ולכן אין אפשרות אחרת. ספרות שחוזרות על עצמן והמספר 10 אסורים."]],
      [["The Lo Shu, one of the oldest known magic squares, comes from the legends of which country?", "China", ["India", "Egypt", "Greece"], "Ancient Chinese legend tells of a turtle that came out of the Lo river with a 3 × 3 pattern of dots on its shell, in which every line adds up to 15."],
        ["הלו שו, אחד מריבועי הקסם העתיקים ביותר הידועים, מגיע מאגדות של איזו ארץ?", "סין", ["הודו", "מצרים", "יוון"], "אגדה סינית עתיקה מספרת על צב שיצא מנהר לו ועל שריונו דוגמה של נקודות בגודל 3 על 3, שבה כל שורה מסתכמת ב־15."]],
    ],
    n: [
      [34, ["What is the magic sum of a 4 × 4 magic square that uses each number from 1 to 16 once?", "", "1 + 2 + … + 16 = 136, and the four rows share it equally: 136 ÷ 4 = 34."],
        ["מהו סכום הקסם של ריבוע קסם 4 על 4 שמשתמש בכל מספר מ־1 עד 16 פעם אחת?", "", "1 + 2 + … + 16 = 136, וארבע השורות מתחלקות בו שווה בשווה: 136 ÷ 4 = 34."]],
      [11, ["AB and BA are two-digit numbers, and AB + BA = 121. What is A + B?", "", "AB + BA = (10A + B) + (10B + A) = 11A + 11B = 11(A + B). So 11(A + B) = 121 and A + B = 11."],
        ["AB ו־BA הם מספרים דו־ספרתיים, ו־AB + BA = 121. כמה זה A + B?", "", "AB + BA = (10A + B) + (10B + A) = 11A + 11B = 11(A + B). לכן 11(A + B) = 121, ו־A + B = 11."]],
    ],
  },
};
export default c;
