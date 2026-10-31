import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Column method", "writing numbers one under another so that ones, tens and hundreds line up", "כתיבה במאונך", "כתיבת מספרים זה מתחת לזה, כך שהיחידות, העשרות והמאות נמצאות באותם טורים"],
      ["Carrying", "when a column adds up to 10 or more, writing its ones digit and moving the ten to the next column on the left", "המרה", "כשסכום של טור הוא 10 או יותר, כותבים את ספרת היחידות ומעבירים את העשרת לטור שמשמאל"],
      ["Ones column", "the column at the far right, where adding and subtracting start", "טור היחידות", "הטור הימני ביותר, שממנו מתחילים לחבר ולחסר"],
    ],
    q: [
      [["When you add numbers in columns, which column do you start with?", "The ones column on the right", ["The hundreds column on the left", "The tens column in the middle", "Whichever column has the biggest digits"], "Start with the ones, because a total of 10 or more there makes a ten that has to be carried into the tens column."],
        ["כשמחברים מספרים במאונך, מאיזה טור מתחילים?", "מטור היחידות, מימין", ["מטור המאות, משמאל", "מטור העשרות, באמצע", "מהטור שיש בו את הספרות הגדולות ביותר"], "מתחילים מהיחידות, כי אם הסכום שם הוא 10 או יותר, נוצרת עשרת שצריך להעביר לטור העשרות."]],
      [["What is 345 + 132?", "477", ["467", "577", "213"], "Add each column: ones 5 + 2 = 7, tens 4 + 3 = 7, hundreds 3 + 1 = 4, so 477. 213 is what you get by taking away instead."],
        ["כמה זה 345 + 132?", "477", ["467", "577", "213"], "מחברים כל טור: יחידות 5 + 2 = 7, עשרות 4 + 3 = 7, מאות 3 + 1 = 4, ולכן 477. את 213 מקבלים אם מחסרים במקום לחבר."]],
      [["What is 58 + 27?", "85", ["75", "715", "31"], "Ones: 8 + 7 = 15, so write 5 and carry 1 ten. Tens: 5 + 2 + 1 = 8, so 85. Forgetting the carried ten gives 75."],
        ["כמה זה 58 + 27?", "85", ["75", "715", "31"], "יחידות: 8 + 7 = 15, כותבים 5 ומעבירים עשרת אחת. עשרות: 5 + 2 + 1 = 8, ולכן 85. מי ששוכח את העשרת שהועברה מקבל 75."]],
      [["What is 486 − 253?", "233", ["223", "333", "739"], "Subtract each column: ones 6 − 3 = 3, tens 8 − 5 = 3, hundreds 4 − 2 = 2, so 233. 739 is the sum of the two numbers, not the difference."],
        ["כמה זה 486 − 253?", "233", ["223", "333", "739"], "מחסרים כל טור: יחידות 6 − 3 = 3, עשרות 8 − 5 = 3, מאות 4 − 2 = 2, ולכן 233. המספר 739 הוא הסכום של שני המספרים, לא ההפרש."]],
      [["Why must the digits be lined up carefully, one exactly under another?", "So that ones are added to ones, tens to tens and hundreds to hundreds", ["So that the biggest digits of both numbers are added together first", "So that you can start adding from the first digit you wrote", "So that the answer is sure to have more digits than both of the numbers"], "In 52 + 7 the 7 means 7 ones, so it must go under the 2, not under the 5. Lined-up columns keep every digit with digits of the same place value."],
        ["למה חשוב לסדר את הספרות בדיוק זו מתחת לזו?", "כדי לחבר יחידות ליחידות, עשרות לעשרות ומאות למאות", ["כדי שהספרות הגדולות של שני המספרים יחוברו קודם", "כדי שאפשר יהיה להתחיל לחבר מהספרה הראשונה שכתבתם", "כדי שבתשובה יהיו יותר ספרות מאשר בכל אחד מהמספרים"], "ב־52 + 7 הספרה 7 פירושה 7 יחידות, ולכן כותבים אותה מתחת ל־2 ולא מתחת ל־5. כשהטורים מסודרים, כל ספרה נמצאת עם ספרות של אותו ערך מקום."]],
    ],
    n: [
      [79, ["What is 46 + 33?", "", "Ones: 6 + 3 = 9. Tens: 4 + 3 = 7. So 46 + 33 = 79."],
        ["כמה זה 46 + 33?", "", "יחידות: 6 + 3 = 9. עשרות: 4 + 3 = 7. לכן 46 + 33 = 79."]],
      [41, ["What is 75 − 34?", "", "Ones: 5 − 4 = 1. Tens: 7 − 3 = 4. So 75 − 34 = 41."],
        ["כמה זה 75 − 34?", "", "יחידות: 5 − 4 = 1. עשרות: 7 − 3 = 4. לכן 75 − 34 = 41."]],
    ],
    s: [[["Adding 27 + 15 in columns, in order", "Write 15 under 27, ones under ones and tens under tens", "Add the ones: 7 + 5 = 12", "Write 2 in the ones column and carry 1 ten", "Add the tens: 2 + 1 + 1 = 4", "Read the answer: 42"],
      ["חיבור 27 + 15 במאונך, לפי הסדר", "כותבים את 15 מתחת ל־27, יחידות מתחת ליחידות ועשרות מתחת לעשרות", "מחברים את היחידות: 7 + 5 = 12", "כותבים 2 בטור היחידות ומעבירים עשרת אחת", "מחברים את העשרות: 2 + 1 + 1 = 4", "קוראים את התשובה: 42"]]],
  },
  i: {
    t: [
      ["Borrowing", "in subtraction, breaking one ten from the column on the left into 10 ones when the top digit is too small", "פריטה", "בחיסור, פירוק של עשרת אחת מהטור שמשמאל ל־10 יחידות, כשהספרה העליונה קטנה מדי"],
      ["Placeholder zero", "a 0 that keeps the other digits in their right places, like the 0 in 405", "אפס שומר מקום", "הספרה 0 שמחזיקה את שאר הספרות במקומן הנכון, כמו ה־0 במספר 405"],
      ["Difference", "the answer to a subtraction", "הפרש", "התוצאה של תרגיל חיסור"],
    ],
    q: [
      [["What is 52 − 17?", "35", ["45", "25", "69"], "2 − 7 cannot be done, so borrow a ten: 12 − 7 = 5 in the ones, and 4 − 1 = 3 in the tens, giving 35. 45 comes from wrongly doing 7 − 2."],
        ["כמה זה 52 − 17?", "35", ["45", "25", "69"], "אי אפשר לחשב 2 − 7, ולכן פורטים עשרת: 12 − 7 = 5 ביחידות, ו־4 − 1 = 3 בעשרות, ויוצא 35. את 45 מקבלים אם מחשבים בטעות 7 − 2."]],
      [["What is 368 + 457?", "825", ["815", "725", "715"], "Ones: 8 + 7 = 15, write 5 and carry 1. Tens: 6 + 5 + 1 = 12, write 2 and carry 1. Hundreds: 3 + 4 + 1 = 8. So 825; forgetting both carries gives 715."],
        ["כמה זה 368 + 457?", "825", ["815", "725", "715"], "יחידות: 8 + 7 = 15, כותבים 5 ומעבירים 1. עשרות: 6 + 5 + 1 = 12, כותבים 2 ומעבירים 1. מאות: 3 + 4 + 1 = 8. לכן 825; מי ששוכח את שתי ההמרות מקבל 715."]],
      [["What is 500 − 126?", "374", ["384", "426", "626"], "There are no tens or ones to borrow, so break a hundred: 500 is 4 hundreds, 9 tens and 10 ones. Then 10 − 6 = 4, 9 − 2 = 7 and 4 − 1 = 3, so 374."],
        ["כמה זה 500 − 126?", "374", ["384", "426", "626"], "אין עשרות ואין יחידות לפרוט, ולכן פורטים מאה: 500 הם 4 מאות, 9 עשרות ו־10 יחידות. אז 10 − 6 = 4, 9 − 2 = 7 ו־4 − 1 = 3, ולכן 374."]],
      [["In the number 2,045, what does the 0 do?", "It shows there are no hundreds, so the 2 stays in the thousands place", ["It can be left out, because a zero is worth nothing and changes nothing", "It shows that the number is even, as every number with a 0 is", "It means that the number is smaller than one thousand"], "Without the 0 the number would be 245. The 0 keeps the hundreds place empty, so the 2 still means 2 thousands."],
        ["במספר 2,045, מה התפקיד של ה־0?", "הוא מראה שאין מאות, וכך ה־2 נשאר במקום האלפים", ["אפשר להשמיט אותו, כי אפס לא שווה כלום ולא משנה כלום", "הוא מראה שהמספר זוגי, כמו כל מספר שיש בו 0", "הוא אומר שהמספר קטן מאלף"], "בלי ה־0 המספר היה 245. ה־0 שומר על מקום המאות ריק, וכך ה־2 עדיין פירושו 2 אלפים."]],
      [["A school has 1,342 pupils and 218 of them are on a trip. How many pupils are at school?", "1,124", ["1,136", "1,134", "1,560"], "Ones: 2 − 8 needs a borrow, so 12 − 8 = 4 and the 4 tens become 3. Tens: 3 − 1 = 2. Hundreds: 3 − 2 = 1. Thousands: 1. So 1,124."],
        ["בבית ספר לומדים 1,342 תלמידים, ו־218 מהם יצאו לטיול. כמה תלמידים נשארו בבית הספר?", "1,124", ["1,136", "1,134", "1,560"], "יחידות: ב־2 − 8 צריך לפרוט, ולכן 12 − 8 = 4 ו־4 העשרות הופכות ל־3. עשרות: 3 − 1 = 2. מאות: 3 − 2 = 1. אלפים: 1. לכן 1,124."]],
    ],
    n: [
      [1000, ["What is 637 + 363?", "", "Ones: 7 + 3 = 10. Tens: 3 + 6 + 1 = 10. Hundreds: 6 + 3 + 1 = 10. Every column carries, giving 1,000."],
        ["כמה זה 637 + 363?", "", "יחידות: 7 + 3 = 10. עשרות: 3 + 6 + 1 = 10. מאות: 6 + 3 + 1 = 10. בכל טור יש המרה, ומתקבל 1,000."]],
      [278, ["What is 645 − 367?", "", "Ones: borrow, 15 − 7 = 8. Tens: 3 − 6 needs a borrow too, 13 − 6 = 7. Hundreds: 5 − 3 = 2. So 278."],
        ["כמה זה 645 − 367?", "", "יחידות: פורטים, 15 − 7 = 8. עשרות: גם ב־3 − 6 צריך לפרוט, 13 − 6 = 7. מאות: 5 − 3 = 2. לכן 278."]],
    ],
    s: [[["Subtracting 503 − 128 in columns, in order", "Ones: 3 − 8 cannot be done, and there are no tens to borrow", "Break one hundred: 5 hundreds become 4 hundreds and 10 tens", "Borrow one of those tens: 10 tens become 9, and 3 ones become 13", "Subtract: 13 − 8 = 5, then 9 − 2 = 7, then 4 − 1 = 3", "Read the answer: 375"],
      ["חיסור 503 − 128 במאונך, לפי הסדר", "יחידות: אי אפשר לחשב 3 − 8, ואין עשרות לפרוט", "פורטים מאה: 5 מאות הופכות ל־4 מאות ו־10 עשרות", "פורטים אחת מהעשרות: 10 עשרות הופכות ל־9, ו־3 יחידות הופכות ל־13", "מחסרים: 13 − 8 = 5, אחר כך 9 − 2 = 7, ואחר כך 4 − 1 = 3", "קוראים את התשובה: 375"]]],
  },
  a: {
    t: [
      ["Minuend", "the number you subtract from; it is written on the top line", "מחוסר", "המספר שממנו מחסרים; בחישוב במאונך הוא בשורה העליונה"],
      ["Subtrahend", "the number that is taken away; it is written on the second line", "מחסר", "המספר שמורידים; בחישוב במאונך הוא בשורה השנייה"],
      ["Checking by adding", "adding the answer of a subtraction to the number taken away, to see if you get the top number back", "בדיקה בחיבור", "חיבור של תוצאת החיסור למספר שהורדנו, כדי לראות אם חוזרים למספר העליון"],
    ],
    q: [
      [["Maya worked out 4,302 − 1,657 and got 2,645. How can she check her answer?", "Add 2,645 + 1,657 and see if it makes 4,302", ["Add 2,645 + 4,302 and see if it makes 1,657", "Subtract 1,657 − 2,645 and see if it makes 4,302", "Add up the digits of 2,645 and see if they make 4,302"], "Subtraction is undone by addition: if 4,302 − 1,657 = 2,645, then 2,645 + 1,657 must equal 4,302, and it does."],
        ["מאיה חישבה 4,302 − 1,657 וקיבלה 2,645. איך היא יכולה לבדוק את התשובה?", "לחבר 2,645 + 1,657 ולבדוק אם יוצא 4,302", ["לחבר 2,645 + 4,302 ולבדוק אם יוצא 1,657", "לחסר 1,657 − 2,645 ולבדוק אם יוצא 4,302", "לחבר את הספרות של 2,645 ולבדוק אם יוצא 4,302"], "חיבור מבטל חיסור: אם 4,302 − 1,657 = 2,645, אז 2,645 + 1,657 חייב להיות 4,302, וזה אכן כך."]],
      [["Which is the best estimate for 3,988 + 2,015?", "About 6,000", ["About 5,000", "About 7,000", "About 60,000"], "Round to the nearest thousand: 4,000 + 2,000 = 6,000. The exact sum, 6,003, is very close to it."],
        ["מהו האומדן הטוב ביותר ל־3,988 + 2,015?", "בערך 6,000", ["בערך 5,000", "בערך 7,000", "בערך 60,000"], "מעגלים לאלף הקרוב: 4,000 + 2,000 = 6,000. הסכום המדויק, 6,003, קרוב מאוד."]],
      [["A tank holds 2,000 litres and 1,365 litres are used. How much water is left?", "635 litres", ["745 litres", "735 litres", "3,365 litres"], "Break a thousand: 2,000 is 1 thousand, 9 hundreds, 9 tens and 10 ones. Then 10 − 5 = 5, 9 − 6 = 3, 9 − 3 = 6 and 1 − 1 = 0, so 635 litres are left."],
        ["במכל יש 2,000 ליטר מים, והשתמשו ב־1,365 ליטר. כמה מים נשארו?", "635 ליטר", ["745 ליטר", "735 ליטר", "3,365 ליטר"], "פורטים אלף: 2,000 הם אלף אחד, 9 מאות, 9 עשרות ו־10 יחידות. אז 10 − 5 = 5, 9 − 6 = 3, 9 − 3 = 6 ו־1 − 1 = 0, ולכן נשארו 635 ליטר."]],
      [["Which subtraction needs no borrowing at all?", "8,765 − 4,321", ["8,765 − 4,329", "8,705 − 4,321", "8,000 − 4,321"], "Borrowing is needed only when a top digit is smaller than the digit under it. In 8,765 − 4,321 every top digit is bigger: 8 and 4, 7 and 3, 6 and 2, 5 and 1."],
        ["באיזה תרגיל חיסור לא צריך לפרוט בכלל?", "8,765 − 4,321", ["8,765 − 4,329", "8,705 − 4,321", "8,000 − 4,321"], "צריך לפרוט רק כשספרה בשורה העליונה קטנה מהספרה שמתחתיה. ב־8,765 − 4,321 כל ספרה עליונה גדולה יותר: 8 ו־4, 7 ו־3, 6 ו־2, 5 ו־1."]],
      [["What is 2,478 + 3,956?", "6,434", ["6,334", "6,424", "5,324"], "Ones: 8 + 6 = 14 (write 4, carry 1). Tens: 7 + 5 + 1 = 13 (write 3, carry 1). Hundreds: 4 + 9 + 1 = 14 (write 4, carry 1). Thousands: 2 + 3 + 1 = 6. So 6,434."],
        ["כמה זה 2,478 + 3,956?", "6,434", ["6,334", "6,424", "5,324"], "יחידות: 8 + 6 = 14 (כותבים 4, מעבירים 1). עשרות: 7 + 5 + 1 = 13 (כותבים 3, מעבירים 1). מאות: 4 + 9 + 1 = 14 (כותבים 4, מעבירים 1). אלפים: 2 + 3 + 1 = 6. לכן 6,434."]],
    ],
    n: [
      [4, ["4x6 + 275 = 721, where x is one missing digit. Which digit is x?", "", "Work backwards: 721 − 275 = 446, so the missing digit is 4. Check: 446 + 275 = 721."],
        ["4x6 + 275 = 721, ו־x היא ספרה חסרה. איזו ספרה היא x?", "", "עובדים מהסוף להתחלה: 721 − 275 = 446, ולכן הספרה החסרה היא 4. בדיקה: 446 + 275 = 721."]],
      [9899, ["What is the largest 4-digit number minus the smallest 3-digit number?", "", "The largest 4-digit number is 9,999 and the smallest 3-digit number is 100. 9,999 − 100 = 9,899."],
        ["כמה זה המספר הארבע־ספרתי הגדול ביותר פחות המספר התלת־ספרתי הקטן ביותר?", "", "המספר הארבע־ספרתי הגדול ביותר הוא 9,999, והתלת־ספרתי הקטן ביותר הוא 100. 9,999 − 100 = 9,899."]],
    ],
  },
};
export default c;
