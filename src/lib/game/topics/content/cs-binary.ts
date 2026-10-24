import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Binary", "a way of writing numbers with only two digits, 0 and 1", "בינארי", "שיטה לכתיבת מספרים בשתי ספרות בלבד, 0 ו־1"],
      ["Bit", "a single 0 or 1, the smallest piece of computer data", "ביט", "0 או 1 בודד, יחידת המידע הקטנה ביותר במחשב"],
      ["Byte", "a group of 8 bits", "בית (בייט)", "קבוצה של 8 ביטים"],
      ["Digit", "one of the symbols used to write a number", "ספרה", "אחד הסימנים שבהם כותבים מספר"],
    ],
    q: [
      [["Why do computers use binary?", "Their circuits have two clear states, like off and on", ["Binary numbers are shorter than ordinary ones, so they save space","Computers cannot count past 2", "It was the first number system ever"], "Electronic switches are easiest to build and read reliably with just two states, written 0 and 1."],
        ["למה מחשבים משתמשים בשיטה הבינארית?", "למעגלים שלהם יש שני מצבים ברורים, כמו כבוי ודולק", ["מספרים בינאריים קצרים יותר ממספרים רגילים, ולכן חוסכים מקום","מחשבים לא יודעים לספור מעבר ל־2", "זו הייתה שיטת הספירה הראשונה"], "הכי קל לבנות מתגים אלקטרוניים ולקרוא אותם בצורה אמינה כשיש להם רק שני מצבים, שנכתבים 0 ו־1."]],
      [["How many bits are in one byte?", "8", ["2", "10", "16"], "A byte is 8 bits — enough for 256 different values."],
        ["כמה ביטים יש בבית אחד?", "8", ["2", "10", "16"], "בית הוא 8 ביטים — מספיק ל־256 ערכים שונים."]],
      [["A lamp can be on or off. How many bits do you need to record whether one lamp is on?", "1 bit", ["2 bits", "8 bits", "10 bits"], "One bit holds one of two values, 0 or 1, which is exactly enough for off and on. A second lamp would need a second bit."],
        ["מנורה יכולה להיות דולקת או כבויה. כמה ביטים צריך כדי לשמור אם מנורה אחת דולקת?", "ביט אחד", ["2 ביטים", "8 ביטים", "10 ביטים"], "ביט אחד מחזיק אחד משני ערכים, 0 או 1, וזה בדיוק מספיק לכבוי ולדולק. למנורה שנייה היה צריך ביט נוסף."]],
    ],
    n: [[4, ["How many different patterns can you make with 2 bits?", "", "Each bit can be 0 or 1, so there are 2 × 2 = 4 patterns: 00, 01, 10 and 11."],
      ["כמה צירופים שונים אפשר ליצור עם 2 ביטים?", "", "כל ביט יכול להיות 0 או 1, ולכן יש 2 × 2 = 4 צירופים: 00, 01, 10 ו־11."]]],
  },
  i: {
    t: [
      ["Place value", "the worth of a digit depends on its position; in binary the places are 1, 2, 4, 8, 16…", "ערך המקום", "ערכה של ספרה תלוי במקומה; בבינארי המקומות הם 1, 2, 4, 8, 16…"],
      ["Base 2", "a number system in which each place is worth twice the place to its right", "בסיס 2", "שיטת ספירה שבה כל מקום שווה פי שניים מהמקום שמימינו"],
      ["Base 10", "our everyday number system, with the digits 0–9", "בסיס 10", "שיטת הספירה הרגילה שלנו, עם הספרות 0–9"],
      ["Kilobyte", "about a thousand bytes (1,000, or 1,024 in some uses)", "קילובייט", "בערך אלף בתים (1,000, או 1,024 בחלק מהשימושים)"],
    ],
    q: [
      [["What is the binary number 101 in base 10?", "5", ["101", "3", "6"], "The places from the right are worth 1, 2 and 4, so 101 = 1×4 + 0×2 + 1×1 = 5."],
        ["כמה הוא המספר הבינארי 101 בבסיס 10?", "5", ["101", "3", "6"], "המקומות מימין לשמאל שווים 1, 2 ו־4, ולכן 101 = 1×4 + 0×2 + 1×1 = 5."]],
      [["How is the number 6 written in binary?", "110", ["011", "111", "100"], "6 = 4 + 2, so the 4 and 2 places are 1 and the 1 place is 0: 110."],
        ["איך כותבים את המספר 6 בבינארי?", "110", ["011", "111", "100"], "6 = 4 + 2, ולכן במקומות של 4 ושל 2 יש 1, ובמקום של 1 יש 0: 110."]],
      [["When you write a 0 at the right-hand end of a binary number, what happens to its value?", "It doubles", ["It is multiplied by 10", "It grows by 1", "It stays the same"], "Every digit moves one place to the left, to a place worth twice as much: 11 is 3, 110 is 6 and 1100 is 12. In base 10, the same trick multiplies by 10."],
        ["כשכותבים 0 בקצה הימני של מספר בינארי, מה קורה לערך שלו?", "הוא גדל פי 2", ["הוא גדל פי 10", "הוא גדל ב־1", "הוא נשאר אותו דבר"], "כל ספרה זזה מקום אחד שמאלה, למקום ששווה פי 2. לדוגמה, 11 שווה 3, 110 שווה 6 ו־1100 שווה 12. בבסיס 10 אותו דבר מגדיל פי 10."]],
    ],
    n: [[13, ["What is the binary number 1101 in base 10?", "", "The places are worth 8, 4, 2 and 1, so 1101 = 8 + 4 + 0 + 1 = 13."], ["כמה הוא המספר הבינארי 1101 בבסיס 10?", "", "המקומות שווים 8, 4, 2 ו־1, ולכן 1101 = 8 + 4 + 0 + 1 = 13."]]],
  },
  a: {
    t: [
      ["Hexadecimal", "base 16, using 0–9 and A–F; one hex digit stands for 4 bits", "הקסדצימלי", "בסיס 16, עם הספרות 0–9 והאותיות A–F; ספרה אחת שווה ל־4 ביטים"],
      ["ASCII", "an early code that gives each English letter and symbol a number, like 65 for A", "ASCII", "קוד ותיק שנותן לכל אות באנגלית ולכל סימן מספר, כמו 65 עבור A"],
      ["Unicode", "the standard that gives a number to the characters of almost every writing system, including Hebrew", "יוניקוד", "התקן שנותן מספר לתווים של כמעט כל מערכות הכתב, כולל עברית"],
      ["Overflow", "an error when a result is too big to fit in the bits available", "גלישה", "שגיאה שקורית כשתוצאה גדולה מכדי להיכנס במספר הביטים שיש"],
    ],
    q: [
      [["What is the largest number you can store in 8 bits (unsigned)?", "255", ["256", "128", "512"], "11111111 = 128+64+32+16+8+4+2+1 = 255; together with 0 that makes 256 values."],
        ["מהו המספר הגדול ביותר שאפשר לשמור ב־8 ביטים (ללא סימן)?", "255", ["256", "128", "512"], "11111111 = 128+64+32+16+8+4+2+1 = 255; יחד עם 0 יש 256 ערכים."]],
      [["What is the hexadecimal number FF in base 10?", "255", ["150", "1515", "16"], "In hexadecimal F stands for 15 and the left place is worth 16, so FF = 15×16 + 15 = 255."],
        ["כמה הוא המספר ההקסדצימלי FF בבסיס 10?", "255", ["150", "1515", "16"], "בבסיס הקסדצימלי F מייצגת 15 והמקום השמאלי שווה 16, ולכן FF = 15×16 + 15 = 255."]],
      [["An 8-bit counter holds 255, and 1 is added. The result must fit in the same 8 bits. What does the counter show?", "0", ["256", "255", "1"], "255 + 1 = 256, which is 100000000 in binary and needs 9 bits. The ninth bit is lost and 00000000 is left: this is overflow."],
        ["מונה של 8 ביטים מחזיק 255, ומוסיפים לו 1. התוצאה חייבת להיכנס באותם 8 ביטים. מה המונה מראה?", "0", ["256", "255", "1"], "255 + 1 = 256, שבבינארי נכתב 100000000 ודורש 9 ביטים. הביט התשיעי הולך לאיבוד ונשאר 00000000: זו גלישה."]],
      [["Adding 1 to the binary number 0111 gives…", "1000", ["0112", "1111", "0110"], "1 + 1 = 10 in binary, so the carry ripples left: 0111 + 1 = 1000 (7 + 1 = 8)."],
        ["חיבור 1 למספר הבינארי 0111 נותן…", "1000", ["0112", "1111", "0110"], "בבינארי 1 + 1 = 10, ולכן הנשא עובר שמאלה: 0111 + 1 = 1000 (7 + 1 = 8)."]],
    ],
  },
};
export default c;
