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
      [["In a spreadsheet, the cell C5 is in…", "column C, row 5", ["column 5, row C", "row C only", "the fifth sheet"], "The letter names the column and the number names the row."],
        ["בגיליון אלקטרוני, התא C5 נמצא ב…", "עמודה C, שורה 5", ["עמודה 5, שורה C", "רק בשורה C", "בגיליון החמישי"], "האות מציינת את העמודה והמספר את השורה."]],
      [["Why do people use spreadsheets for budgets?", "They can add up numbers automatically and update when something changes", ["They draw pictures", "They send emails", "They print money"], "Formulas recalculate as soon as a number changes."],
        ["למה אנשים משתמשים בגיליונות אלקטרוניים לתקציב?", "הם מחברים מספרים אוטומטית ומתעדכנים כשמשהו משתנה", ["הם מציירים תמונות", "הם שולחים מיילים", "הם מדפיסים כסף"], "נוסחאות מחשבות מחדש מיד כשמספר משתנה."]],
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
      [["A1 = 4, A2 = 6, A3 = 10. What does =SUM(A1:A3) show?", "20", ["10", "3", "6.67"], "4 + 6 + 10 = 20."],
        ["A1 = 4, A2 = 6, A3 = 10. מה יציג =SUM(A1:A3)?", "20", ["10", "3", "6.67"], "4 + 6 + 10 = 20."]],
      [["Which formula finds the average of B1 to B4?", "=AVERAGE(B1:B4)", ["=SUM(B1:B4)", "=B1+B4", "=AVERAGE(B1,B4)"], "AVERAGE over the range B1:B4 includes all four cells; (B1,B4) would use only two."],
        ["איזו נוסחה מוצאת את הממוצע של B1 עד B4?", "=AVERAGE(B1:B4)", ["=SUM(B1:B4)", "=B1+B4", "=AVERAGE(B1,B4)"], "AVERAGE על הטווח B1:B4 כולל את כל ארבעת התאים; (B1,B4) היה משתמש רק בשניים."]],
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
      [["What does =IF(A1>=60,\"Pass\",\"Retry\") show when A1 is 55?", "Retry", ["Pass", "55", "An error"], "55 is not at least 60, so the condition is false and the second value is shown."],
        ["מה מציג =IF(A1>=60,\"Pass\",\"Retry\") כאשר A1 הוא 55?", "Retry", ["Pass", "55", "שגיאה"], "55 אינו לפחות 60, ולכן התנאי לא מתקיים ומוצג הערך השני."]],
    ],
  },
};
export default c;
