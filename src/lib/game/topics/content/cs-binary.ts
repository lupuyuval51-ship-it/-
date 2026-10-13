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
      [["Why do computers use binary?", "Their circuits have two clear states, like off and on", ["Binary numbers are shorter", "Computers cannot count past 2", "It was the first number system ever"], "Electronic switches are easiest to build and read reliably with just two states, written 0 and 1."],
        ["למה מחשבים משתמשים בשיטה הבינארית?", "למעגלים שלהם יש שני מצבים ברורים, כמו כבוי ודולק", ["מספרים בינאריים קצרים יותר", "מחשבים לא יודעים לספור מעבר ל־2", "זו הייתה שיטת הספירה הראשונה"], "הכי קל לבנות מתגים אלקטרוניים ולקרוא אותם בצורה אמינה כשיש להם רק שני מצבים, שנכתבים 0 ו־1."]],
      [["How many bits are in one byte?", "8", ["2", "10", "16"], "A byte is 8 bits — enough for 256 different values."],
        ["כמה ביטים יש בבית אחד?", "8", ["2", "10", "16"], "בית הוא 8 ביטים — מספיק ל־256 ערכים שונים."]],
    ],
  },
  i: {
    t: [
      ["Place value", "the worth of a digit depends on its position; in binary the places are 1, 2, 4, 8, 16…", "ערך המקום", "ערכה של ספרה תלוי במקומה; בבינארי המקומות הם 1, 2, 4, 8, 16…"],
      ["Base 2", "a number system in which each place is worth twice the place to its right", "בסיס 2", "שיטת ספירה שבה כל מקום שווה פי שניים מהמקום שמימינו"],
      ["Base 10", "our everyday number system, with the digits 0–9", "בסיס 10", "שיטת הספירה הרגילה שלנו, עם הספרות 0–9"],
      ["Kilobyte", "about a thousand bytes (1,000, or 1,024 in some uses)", "קילובייט", "בערך אלף בתים (1,000, או 1,024 בחלק מהשימושים)"],
    ],
    q: [
      [["What is the binary number 101 in base 10?", "5", ["101", "3", "6"], "101 = 1×4 + 0×2 + 1×1 = 5."],
        ["כמה הוא המספר הבינארי 101 בבסיס 10?", "5", ["101", "3", "6"], "101 = 1×4 + 0×2 + 1×1 = 5."]],
      [["How is the number 6 written in binary?", "110", ["011", "111", "100"], "6 = 4 + 2, so the 4 and 2 places are 1 and the 1 place is 0: 110."],
        ["איך כותבים את המספר 6 בבינארי?", "110", ["011", "111", "100"], "6 = 4 + 2, ולכן במקומות של 4 ושל 2 יש 1, ובמקום של 1 יש 0: 110."]],
    ],
    n: [[13, ["What is the binary number 1101 in base 10?", "", "1101 = 8 + 4 + 0 + 1 = 13."], ["כמה הוא המספר הבינארי 1101 בבסיס 10?", "", "1101 = 8 + 4 + 0 + 1 = 13."]]],
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
      [["What is the hexadecimal number FF in base 10?", "255", ["150", "1515", "16"], "F = 15, so FF = 15×16 + 15 = 255."],
        ["כמה הוא המספר ההקסדצימלי FF בבסיס 10?", "255", ["150", "1515", "16"], "F = 15, ולכן FF = 15×16 + 15 = 255."]],
      [["Adding 1 to the binary number 0111 gives…", "1000", ["0112", "1111", "0110"], "1 + 1 = 10 in binary, so the carry ripples left: 0111 + 1 = 1000 (7 + 1 = 8)."],
        ["חיבור 1 למספר הבינארי 0111 נותן…", "1000", ["0112", "1111", "0110"], "בבינארי 1 + 1 = 10, ולכן הנשא עובר שמאלה: 0111 + 1 = 1000 (7 + 1 = 8)."]],
    ],
  },
};
export default c;
