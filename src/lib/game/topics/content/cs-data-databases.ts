import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Data", "facts and numbers that are collected and stored, such as names, ages or scores", "נתונים", "עובדות ומספרים שנאספים ונשמרים, כמו שמות, גילים או ציונים"],
      ["Database", "an organised collection of information kept in a computer so it can be found and updated quickly", "מסד נתונים", "אוסף מסודר של מידע שנשמר במחשב כך שאפשר למצוא אותו ולעדכן אותו במהירות"],
      ["Record", "all the details stored about one item, such as one pupil, kept together in one row", "רשומה", "כל הפרטים השמורים על פריט אחד, כמו תלמיד אחד, שמופיעים יחד בשורה אחת"],
      ["Field", "one kind of detail stored for every item, such as a name or a birthday; in a table it is a column", "שדה", "סוג אחד של פרט שנשמר על כל פריט, כמו שם או יום הולדת; בטבלה הוא עמודה"],
    ],
    q: [
      [["A school keeps a table of its pupils with the columns Name, Class and Birthday. What does one row hold?", "All the details about one pupil", ["All the names in the school", "All the birthdays in the school", "The titles of the columns"], "Each row is one item (here, one pupil), and each column holds one kind of detail for all of them."],
        ["בית ספר שומר טבלה של התלמידים שלו עם העמודות שם, כיתה ויום הולדת. מה יש בשורה אחת בטבלה?", "כל הפרטים על תלמיד אחד", ["כל השמות בבית הספר", "כל ימי ההולדת בבית הספר", "הכותרות של העמודות"], "כל שורה היא פריט אחד (כאן, תלמיד אחד), וכל עמודה מכילה סוג אחד של פרט על כולם."]],
      [["You want to find the five oldest pupils in a table. What helps most?", "Sorting the table by age", ["Adding more columns", "Deleting the names", "Colouring the table blue"], "Sorting by age puts the rows in order, so the oldest pupils end up together at one end of the table."],
        ["רוצים למצוא בטבלה את חמשת התלמידים המבוגרים ביותר. מה הכי עוזר?", "למיין את הטבלה לפי גיל", ["להוסיף עוד עמודות", "למחוק את השמות", "לצבוע את הטבלה בכחול"], "מיון לפי גיל מסדר את השורות, וכך המבוגרים ביותר מגיעים יחד לקצה אחד של הטבלה."]],
      [["A library database holds thousands of books. You want to see only the books by one author. What do you do?", "Filter the books by the author field", ["Sort the books by number of pages", "Delete all the other books", "Print every book in the database"], "A filter hides every record that does not match, without deleting anything; sorting only changes the order."],
        ["במסד הנתונים של ספרייה יש אלפי ספרים. אתם רוצים לראות רק את הספרים של סופרת אחת. מה עושים?", "מסננים את הספרים לפי שדה הסופר", ["ממיינים את הספרים לפי מספר העמודים", "מוחקים את כל שאר הספרים", "מדפיסים את כל הספרים במסד"], "סינון מסתיר כל רשומה שלא מתאימה בלי למחוק כלום; מיון רק משנה את הסדר."]],
    ],
    n: [[150, ["A class table has 30 rows, one per pupil, and 5 columns. Not counting the titles, how many cells hold data?", "cells", "30 rows × 5 columns = 150 cells."],
      ["בטבלה של כיתה יש 30 שורות, אחת לכל תלמיד, ו־5 עמודות. בלי הכותרות, בכמה תאים יש נתונים?", "תאים", "30 שורות × 5 עמודות = 150 תאים."]]],
  },
  i: {
    t: [
      ["Query", "a request to a database to find the records you need", "שאילתה", "בקשה שמנסחים למסד נתונים כדי למצוא את הרשומות הדרושות"],
      ["Primary key", "a field whose value is different for every record, such as an ID number, so each record can be told apart", "מפתח ראשי", "שדה שהערך שלו שונה בכל רשומה, כמו מספר זהות, כך שאפשר להבחין בין הרשומות"],
      ["Data type", "the kind of value a field holds, such as text, a number or a date", "סוג נתונים", "סוג הערך ששדה מחזיק, כמו טקסט, מספר או תאריך"],
      ["Validation", "checks that stop wrong or impossible values from being stored", "בדיקת תקינות", "בדיקות שמונעות שמירה של ערכים שגויים או בלתי אפשריים"],
    ],
    q: [
      [["Two pupils in a school database are both called Noa Levi. How does the database tell them apart?", "Each has a different ID number, the primary key", ["By their birthdays, which are always different", "By the length of their names", "It can never tell them apart"], "Names and even birthdays can repeat, so every record gets a unique key."],
        ["במסד הנתונים של בית ספר יש שתי תלמידות בשם נועה לוי. איך המסד מבחין ביניהן?", "לכל אחת יש מספר מזהה שונה, המפתח הראשי", ["לפי ימי ההולדת, שתמיד שונים", "לפי האורך של השמות", "הוא אף פעם לא יכול להבחין ביניהן"], "שמות ואפילו ימי הולדת יכולים לחזור, ולכן כל רשומה מקבלת מפתח ייחודי."]],
      [["Which data type suits a field called “Date of birth”?", "Date", ["Yes/No", "Picture", "Sound recording"], "A date type stores real dates, so the database can sort them and calculate ages."],
        ["איזה סוג נתונים מתאים לשדה ״תאריך לידה״?", "תאריך", ["כן/לא", "תמונה", "הקלטת קול"], "סוג תאריך שומר תאריכים אמיתיים, וכך המסד יכול למיין אותם ולחשב גילים."]],
      [["Why do many websites ask you to type your e-mail address twice when you sign up?", "To catch typing mistakes before they are stored", ["To make the database bigger", "To slow the website down", "To send you two e-mails"], "This is a simple validation check: if the two copies differ, there is a typo to fix."],
        ["למה אתרים רבים מבקשים להקליד את כתובת הדוא״ל פעמיים בהרשמה?", "כדי לתפוס טעויות הקלדה לפני שהן נשמרות", ["כדי להגדיל את מסד הנתונים", "כדי להאט את האתר", "כדי לשלוח לכם שני מכתבים"], "זו בדיקת תקינות פשוטה: אם שתי ההקלדות שונות, יש טעות שצריך לתקן."]],
      [["An “Age” field accepts any number. Which value should a validation rule reject?", "-5", ["12", "15", "9"], "An age can never be negative, so a validation rule should refuse -5."],
        ["השדה ״גיל״ מקבל כל מספר. איזה ערך כלל של בדיקת תקינות צריך לדחות?", "-5", ["12", "15", "9"], "גיל אף פעם לא שלילי, ולכן כלל בדיקת תקינות צריך לדחות את -5."]],
    ],
    n: [[1, ["A query asks for pupils with a grade greater than 90. The table holds the grades 95, 90 and 88. How many records does the query return?", "", "Only 95 is greater than 90 (90 itself is not), so the query returns 1 record."],
      ["שאילתה מבקשת את התלמידים שהציון שלהם גדול מ־90. בטבלה יש את הציונים 95, 90 ו־88. כמה רשומות השאילתה מחזירה?", "", "רק 95 גדול מ־90 (90 עצמו לא), ולכן השאילתה מחזירה רשומה אחת בלבד (1)."]]],
  },
  a: {
    t: [
      ["Relational database", "a database made of several tables linked to each other by shared key fields", "מסד נתונים רלציוני", "מאגר שבנוי מכמה טבלאות שמקושרות זו לזו בעזרת שדות מפתח משותפים"],
      ["Foreign key", "a field in one table that holds the primary key of a record in another table, linking the two", "מפתח זר", "שדה בטבלה אחת שמכיל את המפתח הראשי של רשומה בטבלה אחרת וכך מקשר ביניהן"],
      ["SQL", "a widely used language for asking databases questions and changing their data", "SQL", "שפה נפוצה לניסוח שאילתות למאגרי מידע ולשינוי המידע שבהם"],
      ["Anonymisation", "removing names and other identifying details from data before it is shared", "התממה", "הסרת שמות ופרטים מזהים אחרים ממידע לפני שמשתפים אותו"],
    ],
    q: [
      [["What does this SQL query return? SELECT name FROM pupils WHERE class = '6B'", "The names of the pupils in class 6B", ["Every detail of every pupil in the school", "The number of classes in the school", "It deletes class 6B"], "SELECT picks the field (name), FROM picks the table (pupils) and WHERE keeps only the matching records."],
        ["מה מחזירה שאילתת ה־SQL הזו? SELECT name FROM pupils WHERE class = '6B'", "את השמות של התלמידים בכיתה 6B", ["את כל הפרטים של כל התלמידים בבית הספר", "את מספר הכיתות בבית הספר", "היא מוחקת את כיתה 6B"], "SELECT בוחר את השדה (name), FROM בוחר את הטבלה (pupils), ו־WHERE משאיר רק את הרשומות שמתאימות."]],
      [["A table of pupils has the key PupilID. A second table records which pupil borrowed which book. Which field should it include to link each loan to a pupil?", "PupilID", ["The pupil's first name", "The book's number of pages", "Today's weather"], "Storing the other table's primary key makes it a foreign key: it points to exactly one pupil, while a first name may be shared."],
        ["בטבלת התלמידים המפתח הוא מספר התלמיד. טבלה שנייה רושמת איזה תלמיד שאל איזה ספר. איזה שדה צריך להיות בה כדי לקשר כל השאלה לתלמיד?", "מספר התלמיד", ["השם הפרטי של התלמיד", "מספר העמודים בספר", "מזג האוויר היום"], "שמירת המפתח הראשי של הטבלה האחרת הופכת אותו למפתח זר: הוא מצביע על תלמיד אחד בדיוק, ואילו שם פרטי יכול לחזור."]],
      [["A shop stores a customer's address again in every one of her orders. She moves house, and only some orders are updated. What went wrong?", "The same data was stored in many places, so the copies now disagree", ["The orders have no dates", "The shop's database has too few customers", "The address was encrypted"], "In a relational database the address is stored once, in a customers table, and orders link to it by a key, so one update fixes everything."],
        ["חנות שומרת את הכתובת של לקוחה מחדש בכל אחת מההזמנות שלה. הלקוחה עוברת דירה, ורק חלק מההזמנות מתעדכנות. מה השתבש?", "אותו מידע נשמר בהרבה מקומות, ועכשיו העותקים לא תואמים", ["להזמנות אין תאריכים", "יש בחנות מעט מדי לקוחות", "הכתובת הוצפנה"], "במסד נתונים רלציוני הכתובת נשמרת פעם אחת, בטבלת הלקוחות, וההזמנות מקושרות אליה במפתח, כך שעדכון אחד מתקן הכול."]],
      [["A hospital removes the names from its patient data but keeps each patient's exact birth date, gender and postcode. Why may this still not protect privacy?", "Together, these details can often point to a single person", ["Postcodes are always made up", "Hospitals may not store dates", "Computers cannot read birth dates"], "Researchers showed that birth date, gender and postcode together identify most people, so real anonymisation must remove or blur such combinations too."],
        ["בית חולים מוחק את השמות מנתוני המטופלים, אבל משאיר לכל מטופל את תאריך הלידה המדויק, המגדר והמיקוד. למה ייתכן שזה עדיין לא שומר על פרטיות?", "יחד, הפרטים האלה יכולים פעמים רבות להצביע על אדם אחד", ["מיקודים תמיד מומצאים", "אסור לבתי חולים לשמור תאריכים", "מחשבים לא יכולים לקרוא תאריכי לידה"], "חוקרים הראו שתאריך לידה, מגדר ומיקוד יחד מזהים את רוב האנשים, ולכן התממה אמיתית צריכה להסיר או לטשטש גם צירופים כאלה."]],
    ],
  },
};
export default c;
