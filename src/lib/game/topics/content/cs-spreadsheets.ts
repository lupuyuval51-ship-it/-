import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Spreadsheet", "a program that arranges data in a grid of rows and columns and can calculate with it", "גיליון אלקטרוני", "תוכנה שמסדרת נתונים ברשת של שורות ועמודות ויכולה לחשב איתם"],
      ["Cell", "one box in the grid, named by its column letter and row number, like B3", "תא", "משבצת אחת ברשת, שנקראת לפי אות העמודה ומספר השורה, כמו B3"],
      ["Row", "a horizontal line of cells, numbered 1, 2, 3…", "שורה", "קו אופקי של תאים, שממוספר 1, 2, 3…"],
      ["Column", "a vertical line of cells, named A, B, C…", "עמודה", "קו אנכי של תאים, שנקרא A, B, C…"],
    ],
    q: [
      [["In a spreadsheet, the cell C5 is in…", "column C, row 5", ["column 5, row C", "row C only", "the fifth sheet"], "The letter names the column and the number names the row, so C5 is where column C meets row 5. There is no row C, because rows are numbered."],
        ["בגיליון אלקטרוני, התא C5 נמצא ב…", "עמודה C, שורה 5", ["עמודה 5, שורה C", "רק בשורה C", "בגיליון החמישי"], "האות מציינת את העמודה והמספר מציין את השורה, ולכן C5 נמצא במקום שבו עמודה C פוגשת את שורה 5. אין שורה C, כי השורות ממוספרות."]],
      [["Why do people use spreadsheets for budgets?", "They add up the numbers and update the totals by themselves", ["They stop you from spending more money than you really have", "They keep your money safe, the way a bank does", "They print the money you need"], "A total worked out by a formula is recalculated as soon as one number changes, so the budget is always up to date. The spreadsheet only does the maths: it cannot stop you spending or keep your money."],
        ["למה אנשים משתמשים בגיליונות אלקטרוניים לתקציב?", "הם מחברים את המספרים ומעדכנים את הסכומים מעצמם", ["הם מונעים מכם להוציא יותר כסף ממה שיש לכם באמת", "הם שומרים על הכסף שלכם, כמו שבנק עושה", "הם מדפיסים את הכסף שחסר לכם"], "סכום שמחושב בנוסחה מתעדכן ברגע שמספר אחד משתנה, ולכן התקציב תמיד מעודכן. הגיליון רק עושה את החשבון: הוא לא יכול למנוע מכם להוציא כסף או לשמור עליו."]],
      [["Which cell is just below B2?", "B3", ["C2", "B1", "A1"], "Moving down one row adds 1 to the row number, from 2 to 3, while the column letter B stays the same. C2 is the next cell along the same row, in column C."],
        ["איזה תא נמצא בדיוק מתחת לתא B2?", "B3", ["C2", "B1", "A1"], "ירידה של שורה אחת מוסיפה 1 למספר השורה, מ־2 ל־3, ואות העמודה B לא משתנה. C2 הוא התא הבא באותה שורה, בעמודה C."]],
      [["Which job is a spreadsheet best at?", "Keeping a table of test scores and working out the average", ["Writing a long story with chapters, headings and lots of pictures", "Editing a holiday photo", "Recording a song"], "Spreadsheets are made for numbers arranged in rows and columns and for calculating with them. A long story suits a word processor, and photos and songs need their own apps."],
        ["באיזו משימה גיליון אלקטרוני טוב במיוחד?", "ניהול טבלה של ציוני מבחנים וחישוב הממוצע שלהם", ["כתיבת סיפור ארוך עם פרקים, כותרות והרבה תמונות", "עריכת תמונה מהחופשה", "הקלטת שיר"], "גיליונות אלקטרוניים נועדו למספרים שמסודרים בשורות ובעמודות ולחישובים איתם. סיפור ארוך מתאים למעבד תמלילים, ולתמונות ולשירים יש אפליקציות משלהם."]],
    ],
    n: [
      [50, ["A sheet uses columns A to E and rows 1 to 10. How many cells is that?", "cells", "Columns A, B, C, D and E make 5 columns, and each of them has 10 rows: 5 × 10 = 50 cells."],
        ["גיליון משתמש בעמודות A עד E ובשורות 1 עד 10. כמה תאים זה?", "תאים", "העמודות A, B, C, D ו־E הן 5 עמודות, ובכל אחת מהן 10 שורות: 5 × 10 = 50 תאים."]],
    ],
  },
  i: {
    t: [
      ["Formula", "an instruction in a cell that calculates a result, starting with =", "נוסחה", "הוראה בתא שמחשבת תוצאה ומתחילה בסימן ="],
      ["SUM", "a function that adds up a range of cells, for example all the numbers from A1 to A5", "SUM", "פונקציה שמחברת טווח של תאים, למשל את כל המספרים מ־A1 עד A5"],
      ["AVERAGE", "a function that finds the mean of a range of cells", "AVERAGE", "פונקציה שמוצאת את הממוצע של טווח תאים"],
      ["Range", "a block of cells written with a colon, like A1:A5", "טווח", "קבוצת תאים שנכתבת עם נקודתיים, כמו A1:A5"],
    ],
    q: [
      [["A1 = 4, A2 = 6, A3 = 10. What does =SUM(A1:A3) show?", "20", ["6.67", "3", "10"], "SUM adds every cell in the range A1:A3: 4 + 6 + 10 = 20. About 6.67 would be their average, and 3 is only how many cells there are."],
        ["בתא A1 יש 4, ב־A2 יש 6 וב־A3 יש 10. מה יציג =SUM(A1:A3)?", "20", ["6.67", "3", "10"], "הפונקציה SUM מחברת את כל התאים בטווח A1:A3: 4 + 6 + 10 = 20. בערך 6.67 הוא הממוצע שלהם, ו־3 הוא רק מספר התאים."]],
      [["Which formula finds the average of B1 to B4?", "=AVERAGE(B1:B4)", ["=SUM(B1:B4)", "=B1+B4", "=AVERAGE(B1,B4)"], "AVERAGE over the range B1:B4 includes all four cells; (B1,B4) would use only two."],
        ["איזו נוסחה מוצאת את הממוצע של B1 עד B4?", "=AVERAGE(B1:B4)", ["=SUM(B1:B4)", "=B1+B4", "=AVERAGE(B1,B4)"], "הפונקציה AVERAGE על הטווח B1:B4 כוללת את כל ארבעת התאים; (B1,B4) היה משתמש רק בשניים."]],
      [["B1 holds 3 and B2 holds 5. What does =B1*B2+1 show?", "16", ["18", "15", "9"], "A spreadsheet multiplies before it adds, just as in maths: 3 × 5 = 15, then 15 + 1 = 16. To add first you would need brackets, =B1*(B2+1), which gives 18."],
        ["בתא B1 יש 3 ובתא B2 יש 5. מה יציג =B1*B2+1?", "16", ["18", "15", "9"], "גיליון אלקטרוני מכפיל לפני שהוא מחבר, בדיוק כמו בחשבון: 3 × 5 = 15, ואז 15 + 1 = 16. כדי לחבר קודם צריך סוגריים, =B1*(B2+1), וזה נותן 18."]],
      [["A1 holds 4, A2 holds 6 and A3 holds 10. Why is =SUM(A1:A3) better than typing =4+6+10?", "It reads the cells, so the total updates when one of them changes", ["It gives a more exact total than adding the numbers yourself", "It makes the numbers in A1 to A3 bold", "It stops anyone from changing A1 to A3"], "Both show 20 today, but =4+6+10 only adds fixed numbers. =SUM(A1:A3) adds whatever is in the cells, so if A2 changes from 6 to 8 the total becomes 22 by itself."],
        ["בתא A1 יש 4, ב־A2 יש 6 וב־A3 יש 10. למה =SUM(A1:A3) עדיף על הקלדה של =4+6+10?", "היא קוראת את התאים, ולכן הסכום מתעדכן כשאחד מהם משתנה", ["היא נותנת סכום מדויק יותר מחיבור של המספרים לבד", "היא מדגישה את המספרים שבתאים A1 עד A3", "היא מונעת מכולם לשנות את A1 עד A3"], "שתי הנוסחאות מציגות היום 20, אבל =4+6+10 מחברת רק מספרים קבועים. =SUM(A1:A3) מחברת את מה שיש בתאים, ולכן אם A2 משתנה מ־6 ל־8, הסכום הופך מעצמו ל־22."]],
    ],
    n: [
      [12, ["How many cells are in the range A1:C4?", "cells", "A1:C4 covers columns A, B and C, which is 3 columns, and rows 1 to 4, which is 4 rows: 3 × 4 = 12 cells."],
        ["כמה תאים יש בטווח A1:C4?", "תאים", "הטווח A1:C4 כולל את העמודות A, B ו־C, כלומר 3 עמודות, ואת השורות 1 עד 4, כלומר 4 שורות: 3 × 4 = 12 תאים."]],
    ],
  },
  a: {
    t: [
      ["Relative reference", "a cell address like A1 that shifts when the formula is copied", "הפניה יחסית", "כתובת תא כמו A1 שזזה כשמעתיקים את הנוסחה"],
      ["Absolute reference", "a cell address like $A$1 that stays fixed when the formula is copied", "הפניה מוחלטת", "כתובת תא כמו $A$1 שנשארת קבועה כשמעתיקים את הנוסחה"],
      ["IF function", "a function that gives one result if a condition is true and another if it is false", "פונקציית IF", "פונקציה שנותנת תוצאה אחת אם תנאי מתקיים ותוצאה אחרת אם לא"],
      ["Chart", "a picture of spreadsheet data, like a bar or line graph", "תרשים", "הצגה חזותית של נתוני הגיליון, כמו גרף עמודות או קו"],
    ],
    q: [
      [["C1 contains =A1*B1. It is copied down to C2. What does C2 contain?", "=A2*B2", ["=A1*B1", "=A2*B1", "=$A$2*$B$2"], "Relative references shift by one row when copied down one row."],
        ["בתא C1 יש =A1*B1. מעתיקים אותו למטה ל־C2. מה יש ב־C2?", "=A2*B2", ["=A1*B1", "=A2*B1", "=$A$2*$B$2"], "הפניות יחסיות זזות בשורה אחת כשמעתיקים שורה אחת למטה."]],
      [["A1 holds 4 and B1 holds 5. What does =IF(A1+B1=10,\"Yes\",\"No\") show?", "No", ["Yes", "9", "An error"], "4 + 5 = 9, which is not 10, so the condition is false and IF shows its second value, No. Here IF can only show Yes or No, never the sum itself."],
        ["בתא A1 יש 4 ובתא B1 יש 5. מה יציג =IF(A1+B1=10,\"Yes\",\"No\")?", "No", ["Yes", "9", "שגיאה"], "4 + 5 = 9, וזה לא 10, ולכן התנאי לא מתקיים ו־IF מציגה את הערך השני שלה, No. כאן הפונקציה IF יכולה להציג רק Yes או No, ולא את הסכום עצמו."]],
      [["B1 contains =A1+1. It is copied into the next column, to C1. What does C1 contain?", "=B1+1", ["=A1+1", "=A2+1", "=B2+1"], "Copying one column across moves every relative reference one column across too, so A1 becomes B1. The row number stays 1, because the formula did not move down."],
        ["בתא B1 יש =A1+1. מעתיקים אותו לעמודה הבאה, לתא C1. מה יש בתא C1?", "=B1+1", ["=A1+1", "=A2+1", "=B2+1"], "העתקה לעמודה הבאה מזיזה גם כל הפניה יחסית בעמודה אחת, ולכן A1 הופך ל־B1. מספר השורה נשאר 1, כי הנוסחה לא זזה למטה."]],
      [["D1 holds the price of one ticket. B2 contains =A2*$D$1 and is copied down to B3. What does B3 contain?", "=A3*$D$1", ["=A3*$D$2", "=A2*$D$1", "=A3*D2"], "The relative A2 moves down one row to A3, while the dollar signs keep $D$1 fixed, so every row is multiplied by the same price. Without them it would become D2, an empty cell."],
        ["בתא D1 נמצא המחיר של כרטיס אחד. בתא B2 יש =A2*$D$1, ומעתיקים אותו למטה לתא B3. מה יש בתא B3?", "=A3*$D$1", ["=A3*$D$2", "=A2*$D$1", "=A3*D2"], "ההפניה היחסית A2 זזה שורה אחת למטה ל־A3, וסימני הדולר משאירים את $D$1 קבוע, כך שכל שורה מוכפלת באותו מחיר. בלעדיהם ההפניה הייתה הופכת ל־D2, תא ריק."]],
    ],
    n: [
      [50, ["A pie chart shows how 200 shekels were spent. The slice for food is a quarter of the circle. How many shekels went on food?", "shekels", "A quarter of the circle is a quarter of the total: 200 ÷ 4 = 50 shekels. A pie chart shows each part as a share of the whole."],
        ["תרשים עוגה מראה איך הוצאו 200 שקלים. הפרוסה של האוכל היא רבע מהעיגול. כמה שקלים הוצאו על אוכל?", "שקלים", "רבע מהעיגול הוא רבע מהסכום כולו: 200 ÷ 4 = 50 שקלים. תרשים עוגה מראה כל חלק כחלק מהשלם."]],
    ],
    s: [
      [["Making a chart from data", "Type the data into rows and columns", "Select the cells that hold the data", "Choose Insert and a type of chart", "Add a title and labels to the chart"],
        ["יצירת תרשים מנתונים", "מקלידים את הנתונים בשורות ובעמודות", "מסמנים את התאים שבהם נמצאים הנתונים", "בוחרים ״הוספה״ וסוג של תרשים", "מוסיפים לתרשים כותרת ותוויות"]],
    ],
  },
};
export default c;
