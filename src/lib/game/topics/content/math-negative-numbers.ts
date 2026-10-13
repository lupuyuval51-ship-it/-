import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Negative number", "a number less than zero, written with a minus sign, like −3", "מספר שלילי", "מספר שקטן מאפס, נכתב עם סימן מינוס, כמו −3"],
      ["Positive number", "a number greater than zero", "מספר חיובי", "מספר שגדול מאפס"],
      ["Number line", "a straight line with numbers marked in order, smaller to the left", "ציר המספרים", "קו ישר שעליו מסומנים מספרים לפי הסדר, הקטנים משמאל"],
      ["Zero", "the number between the negative and the positive numbers", "אפס", "המספר שבין המספרים השליליים לחיוביים"],
    ],
    q: [
      [["It is −2 °C in the morning and 5 °C at noon. By how many degrees did it warm up?", "7", ["3", "5", "2"], "From −2 up to 0 is 2 degrees, and from 0 to 5 is 5 more: 7 degrees."],
        ["בבוקר −2 °C ובצהריים 5 °C. בכמה מעלות התחמם?", "7", ["3", "5", "2"], "מ־−2 עד 0 יש 2 מעלות, ומ־0 עד 5 עוד 5: בסך הכול 7 מעלות."]],
      [["Which number is the smallest?", "−8", ["−3", "0", "2"], "On the number line −8 is farthest to the left, so it is the smallest."],
        ["איזה מספר הוא הקטן ביותר?", "−8", ["−3", "0", "2"], "על ציר המספרים −8 נמצא הכי שמאלה, ולכן הוא הקטן ביותר."]],
    ],
  },
  i: {
    t: [
      ["Absolute value", "the distance of a number from zero, always positive or zero: |−5| = 5", "ערך מוחלט", "המרחק של מספר מאפס, תמיד חיובי או אפס: |−5| = 5"],
      ["Opposite numbers", "two numbers at the same distance from zero on different sides, like 4 and −4", "מספרים נגדיים", "שני מספרים באותו מרחק מאפס משני צדדיו, כמו 4 ו־−4"],
      ["Integers", "the whole numbers together with their negatives: …, −2, −1, 0, 1, 2, …", "מספרים שלמים", "המספרים הטבעיים, האפס והנגדיים שלהם: …, −2, −1, 0, 1, 2, …"],
      ["Sea level", "the zero point for height; places below it, like the Dead Sea shore, have negative height", "פני הים", "נקודת האפס לגובה; למקומות מתחתיה, כמו חוף ים המלח, יש גובה שלילי"],
    ],
    q: [
      [["What is −4 + 9?", "5", ["−5", "13", "−13"], "Start at −4 and move 9 to the right: 5."],
        ["כמה זה −4 + 9?", "5", ["−5", "13", "−13"], "מתחילים ב־−4 וזזים 9 ימינה: 5."]],
      [["What is 3 − 8?", "−5", ["5", "−11", "11"], "Start at 3 and move 8 to the left, past zero: −5."],
        ["כמה זה 3 − 8?", "−5", ["5", "−11", "11"], "מתחילים ב־3 וזזים 8 שמאלה, מעבר לאפס: −5."]],
    ],
    n: [[6, ["What is 2 − (−4)?", "", "Subtracting a negative is the same as adding: 2 + 4 = 6."], ["כמה זה 2 − (−4)?", "", "חיסור של מספר שלילי הוא כמו חיבור: 2 + 4 = 6."]]],
  },
  a: {
    t: [
      ["Sign rule for multiplying", "two numbers with the same sign give a positive product; different signs give a negative one", "כלל הסימנים בכפל", "כפל של שני מספרים עם אותו סימן נותן תוצאה חיובית; סימנים שונים נותנים תוצאה שלילית"],
      ["Additive inverse", "the number you add to get zero: for 7 it is −7", "נגדי לחיבור", "המספר שמוסיפים כדי לקבל אפס: עבור 7 זה −7"],
      ["Square of a negative", "the result of multiplying a negative number by itself, which is always positive", "ריבוע של מספר שלילי", "התוצאה של כפל מספר שלילי בעצמו, שהיא תמיד חיובית"],
      ["Debt", "money owed, which can be shown as a negative balance", "חוב", "כסף שחייבים, שאפשר להציג כיתרה שלילית"],
    ],
    q: [
      [["What is (−3) × (−4)?", "12", ["−12", "−7", "7"], "Same signs give a positive product: 3 × 4 = 12."],
        ["כמה זה (−3) × (−4)?", "12", ["−12", "−7", "7"], "סימנים זהים נותנים מכפלה חיובית: 3 × 4 = 12."]],
      [["What is (−2)³?", "−8", ["8", "−6", "6"], "(−2) × (−2) = 4, and 4 × (−2) = −8: an odd power of a negative number is negative."],
        ["כמה זה (−2)³?", "−8", ["8", "−6", "6"], "(−2) × (−2) = 4, ו־4 × (−2) = −8: חזקה אי־זוגית של מספר שלילי היא שלילית."]],
      [["What is −20 ÷ (−5) − 7?", "−3", ["11", "−11", "3"], "First divide: −20 ÷ (−5) = 4. Then 4 − 7 = −3."],
        ["כמה זה −20 ÷ (−5) − 7?", "−3", ["11", "−11", "3"], "קודם מחלקים: −20 ÷ (−5) = 4. אחר כך 4 − 7 = −3."]],
    ],
  },
};
export default c;
