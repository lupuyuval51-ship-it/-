import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Roman numerals", "a way of writing numbers with letters, used in ancient Rome", "ספרות רומיות", "דרך לכתוב מספרים באותיות, שהשתמשו בה ברומא העתיקה"],
      ["Adding rule", "when a letter is followed by letters of equal or smaller value, their values are added, as in VI = 6", "כלל החיבור", "כשאחרי אות באות אותיות שערכן שווה לה או קטן ממנה, מחברים את הערכים, כמו VI = 6"],
    ],
    q: [
      [["Which number does the Roman numeral X stand for?", "10", ["5", "50", "100"], "X stands for 10. V is 5, L is 50 and C is 100."],
        ["איזה מספר מייצגת הספרה הרומית X?", "10", ["5", "50", "100"], "הספרה X מייצגת 10. הספרה V היא 5, L היא 50 ו־C היא 100."]],
      [["Which number is VII?", "7", ["6", "8", "52"], "V is 5 and each I adds 1: 5 + 1 + 1 = 7. 52 comes from reading V as 5 and II as the digit 2."],
        ["איזה מספר הוא VII?", "7", ["6", "8", "52"], "V היא 5 וכל I מוסיפה 1: 5 + 1 + 1 = 7. את 52 מקבלים אם קוראים את V כ־5 ואת II כספרה 2."]],
      [["How do you write 3 in Roman numerals?", "III", ["IV", "VI", "XXX"], "Three ones are written III. IV is 4, VI is 6 and XXX is 30."],
        ["איך כותבים 3 בספרות רומיות?", "III", ["IV", "VI", "XXX"], "שלוש יחידות נכתבות III. הצירוף IV הוא 4, VI הוא 6 ו־XXX הוא 30."]],
      [["Which letter stands for 100?", "C", ["M", "D", "L"], "C stands for 100. A way to remember it: the Latin word for a hundred is centum, as in century (100 years). M is 1,000, D is 500 and L is 50."],
        ["איזו אות מייצגת 100?", "C", ["M", "D", "L"], "האות C מייצגת 100. דרך לזכור: בלטינית ״מאה״ היא centum. M היא 1,000, D היא 500 ו־L היא 50."]],
      [["Where might you still see Roman numerals today?", "On some clock faces", ["On shekel coins", "On car number plates", "On the keys of a calculator"], "Many clock faces show the hours as I to XII. Roman numerals also appear in book chapters and in names of kings, such as Henry VIII."],
        ["איפה אפשר עדיין לראות ספרות רומיות היום?", "על חלק משעוני המחוגים", ["על מטבעות של שקלים", "על לוחיות רישוי של מכוניות", "על המקשים של מחשבון"], "בשעונים רבים השעות מסומנות מ־I עד XII. ספרות רומיות מופיעות גם בפרקים של ספרים ובשמות של מלכים, כמו הנרי השמיני, Henry VIII."]],
    ],
    n: [
      [15, ["Which number is XV?", "", "X is 10 and V is 5. The smaller letter comes after the bigger one, so add them: 10 + 5 = 15."],
        ["איזה מספר הוא XV?", "", "X היא 10 ו־V היא 5. האות הקטנה באה אחרי הגדולה, ולכן מחברים: 10 + 5 = 15."]],
      [20, ["Which number is XX?", "", "Each X is 10, and letters of the same value are added: XX = 10 + 10 = 20."],
        ["איזה מספר הוא XX?", "", "כל X היא 10, ואותיות שוות מחברים: XX = 10 + 10 = 20."]],
    ],
    s: [[["Order these Roman numerals from the smallest to the largest", "II", "VI", "XI", "XX", "L"],
      ["סדרו את הספרות הרומיות מהקטנה ביותר לגדולה ביותר", "II", "VI", "XI", "XX", "L"]]],
  },
  i: {
    t: [
      ["Subtracting rule", "when a smaller letter comes just before a bigger one, its value is taken away, as in IV = 4", "כלל החיסור", "כשאות קטנה באה ממש לפני אות גדולה, מורידים את ערכה, כמו IV = 4"],
      ["Three-in-a-row limit", "the rule of standard Roman numerals that the same letter is not written more than three times running", "מגבלת שלוש החזרות", "הכלל שלפיו בכתיבה המקובלת לא כותבים אותה אות יותר משלוש פעמים ברצף"],
    ],
    q: [
      [["Which number is IX?", "9", ["11", "10", "4"], "The I comes before the bigger X, so take it away: 10 − 1 = 9. XI, with the I after the X, would be 11."],
        ["איזה מספר הוא IX?", "9", ["11", "10", "4"], "ה־I באה לפני ה־X הגדולה ממנה, ולכן מחסרים: 10 − 1 = 9. הצירוף XI, שבו ה־I באה אחרי ה־X, הוא 11."]],
      [["How is 40 written in standard Roman numerals?", "XL", ["XXXX", "LX", "VVVV"], "40 is 10 less than 50, so X goes before L: XL. LX is 50 + 10 = 60, and in the standard form the same letter is not written four times in a row."],
        ["איך כותבים 40 בספרות רומיות לפי הכללים המקובלים?", "XL", ["XXXX", "LX", "VVVV"], "40 קטן מ־50 ב־10, ולכן X באה לפני L: XL. הצירוף LX הוא 50 + 10 = 60, ובכתיבה המקובלת לא כותבים אותה אות ארבע פעמים ברצף."]],
      [["Which number is XCIV?", "94", ["96", "104", "116"], "Split it into XC and IV. XC is 100 − 10 = 90 and IV is 5 − 1 = 4, so XCIV = 94. Adding every letter gives 116, which ignores the subtracting rule."],
        ["איזה מספר הוא XCIV?", "94", ["96", "104", "116"], "מפרקים ל־XC ול־IV. הצירוף XC הוא 100 − 10 = 90 ו־IV הוא 5 − 1 = 4, ולכן XCIV = 94. אם מחברים את כל האותיות יוצא 116, בלי כלל החיסור."]],
      [["Which of these is NOT written correctly in standard Roman numerals?", "IL for 49", ["XLIX for 49", "XC for 90", "CD for 400"], "I may only be taken away from V and X, so 49 is written as XL (40) and IX (9): XLIX. XC for 90 and CD for 400 follow the rule."],
        ["איזה מהבאים אינו כתוב נכון בספרות רומיות?", "IL עבור 49", ["XLIX עבור 49", "XC עבור 90", "CD עבור 400"], "מותר להחסיר I רק לפני V ולפני X, ולכן 49 נכתב XL (40) ועוד IX (9): XLIX. הכתיבה XC עבור 90 ו־CD עבור 400 תואמת את הכלל."]],
      [["On many clock faces, which Roman numeral is at the top, where 12 is?", "XII", ["XI", "XIII", "IIX"], "12 is 10 + 1 + 1, written XII. XI is 11, the number just before it on the clock, and XIII is 13."],
        ["בשעונים רבים, איזו ספרה רומית נמצאת למעלה, במקום של 12?", "XII", ["XI", "XIII", "IIX"], "12 הוא 10 + 1 + 1, ונכתב XII. הצירוף XI הוא 11, המספר שלפניו בשעון, ו־XIII הוא 13."]],
    ],
    n: [
      [64, ["Which number is LXIV?", "", "L = 50, X = 10 and IV = 4, so LXIV = 50 + 10 + 4 = 64."],
        ["איזה מספר הוא LXIV?", "", "L = 50, X = 10 ו־IV = 4, ולכן LXIV = 50 + 10 + 4 = 64."]],
      [99, ["Which number is XCIX?", "", "XC = 100 − 10 = 90 and IX = 10 − 1 = 9, so XCIX = 90 + 9 = 99."],
        ["איזה מספר הוא XCIX?", "", "XC = 100 − 10 = 90 ו־IX = 10 − 1 = 9, ולכן XCIX = 90 + 9 = 99."]],
    ],
    s: [[["Writing 48 in Roman numerals, in order", "Split 48 into tens and ones: 40 + 8", "Write the tens part first: 40 is XL", "Then write the ones part after it: 8 is VIII", "Join the two parts: XLVIII"],
      ["כותבים 48 בספרות רומיות, לפי הסדר", "מפרקים את 48 לעשרות וליחידות: 40 + 8", "כותבים קודם את העשרות: 40 הוא XL", "אחר כך כותבים אחריהן את היחידות: 8 הוא VIII", "מחברים את שני החלקים: XLVIII"]]],
  },
  a: {
    t: [
      ["Place value", "the idea that a digit is worth more or less depending on its position, which Roman numerals do not use", "ערך המקום", "הרעיון שספרה שווה יותר או פחות לפי המקום שבו היא עומדת, ובספרות רומיות לא משתמשים בו"],
      ["Zero", "the number for nothing at all, which has no Roman numeral", "אפס", "המספר שמשמעותו כלום, ואין לו ספרה רומית"],
    ],
    q: [
      [["Which year is MCMXLVIII?", "1948", ["1968", "1958", "2168"], "Split it: M = 1000, CM = 900, XL = 40 and VIII = 8. 1000 + 900 + 40 + 8 = 1948, the year the State of Israel was founded. Adding every letter gives 2168."],
        ["איזו שנה היא MCMXLVIII?", "1948", ["1968", "1958", "2168"], "מפרקים: M = 1000, CM = 900, XL = 40 ו־VIII = 8. 1000 + 900 + 40 + 8 = 1948, השנה שבה קמה מדינת ישראל. אם מחברים את כל האותיות יוצא 2168."]],
      [["How is 1999 written in standard Roman numerals?", "MCMXCIX", ["MIM", "MCMIC", "MDCCCCLXXXXVIIII"], "Write each part on its own: 1000 = M, 900 = CM, 90 = XC and 9 = IX, giving MCMXCIX. MIM looks shorter, but I may only be taken away from V and X, and the long form breaks the three-in-a-row limit."],
        ["איך כותבים 1999 בספרות רומיות לפי הכללים המקובלים?", "MCMXCIX", ["MIM", "MCMIC", "MDCCCCLXXXXVIIII"], "כותבים כל חלק בנפרד: 1000 = M, 900 = CM, 90 = XC ו־9 = IX, ומקבלים MCMXCIX. הצורה MIM קצרה יותר, אבל מותר להחסיר I רק לפני V ולפני X, והצורה הארוכה חוזרת על אותה אות יותר משלוש פעמים ברצף."]],
      [["Which of these is true about Roman numerals?", "There is no symbol for zero", ["The letter O is used to write zero", "Each letter stands for a power of ten, like 1, 10 or 100", "They were invented in China and later brought to Rome"], "Roman numerals have no zero and are not a place-value system, which is why big numbers can need long strings of letters. V, L and D are not powers of ten."],
        ["איזו מהטענות נכונה לגבי ספרות רומיות?", "אין בהן סימן לאפס", ["האות O משמשת לכתיבת אפס", "כל אות מייצגת חזקה של 10, כמו 1, 10 או 100", "הן הומצאו בסין ורק אחר כך הגיעו לרומא"], "בספרות רומיות אין אפס, והן אינן שיטה של ערך המקום, ולכן מספרים גדולים יכולים לדרוש שורות ארוכות של אותיות. האותיות V, L ו־D אינן חזקות של 10."]],
      [["What is XLV + LV, written as a Roman numeral?", "C", ["XC", "CX", "LXL"], "XLV = 45 and LV = 55. 45 + 55 = 100, which is written C. XC is only 90 and CX is 110."],
        ["כמה זה XLV + LV, בספרות רומיות?", "C", ["XC", "CX", "LXL"], "XLV = 45 ו־LV = 55. 45 + 55 = 100, שנכתב C. הצירוף XC הוא רק 90, ו־CX הוא 110."]],
      [["Which of these is the largest number?", "CD", ["CCCXC", "CCCLXXX", "CXL"], "CD is 500 − 100 = 400. CCCXC is 300 + 90 = 390, CCCLXXX is 380 and CXL is 140, so CD is the largest even though it is the shortest."],
        ["איזה מהמספרים הוא הגדול ביותר?", "CD", ["CCCXC", "CCCLXXX", "CXL"], "CD הוא 500 − 100 = 400. הצירוף CCCXC הוא 300 + 90 = 390, CCCLXXX הוא 380 ו־CXL הוא 140, ולכן CD הוא הגדול ביותר אף שהוא הקצר ביותר."]],
    ],
    n: [
      [1666, ["Which number is MDCLXVI?", "", "M = 1000, D = 500, C = 100, L = 50, X = 10, V = 5 and I = 1. Each letter is smaller than the one before it, so add them all: 1666."],
        ["איזה מספר הוא MDCLXVI?", "", "M = 1000, D = 500, C = 100, L = 50, X = 10, V = 5 ו־I = 1. כל אות קטנה מזו שלפניה, ולכן מחברים את כולן: 1666."]],
      [3999, ["What is the largest number you can write in standard Roman numerals, where no letter appears more than three times in a row?", "", "MMM = 3000, CM = 900, XC = 90 and IX = 9, so MMMCMXCIX = 3999. Writing 4000 would need M four times in a row."],
        ["מהו המספר הגדול ביותר שאפשר לכתוב בספרות רומיות רגילות, שבהן אף אות לא מופיעה יותר משלוש פעמים ברצף?", "", "MMM = 3000, CM = 900, XC = 90 ו־IX = 9, ולכן MMMCMXCIX = 3999. כדי לכתוב 4000 היה צריך לכתוב M ארבע פעמים ברצף."]],
    ],
    s: [[["Order these years from the earliest to the latest", "MDCCCXCVII", "MCMXLVIII", "MCMLXVII", "MMI"],
      ["סדרו את השנים מהמוקדמת ביותר למאוחרת ביותר", "שנת MDCCCXCVII", "שנת MCMXLVIII", "שנת MCMLXVII", "שנת MMI"]]],
  },
};
export default c;
