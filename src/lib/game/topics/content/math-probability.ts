import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Probability", "how likely something is to happen, from 0 (impossible) to 1 (certain)", "הסתברות", "עד כמה סביר שמשהו יקרה, מ־0 (בלתי אפשרי) עד 1 (ודאי)"],
      ["Impossible", "an event that can never happen, with probability 0", "בלתי אפשרי", "מאורע שלעולם לא יקרה, וההסתברות שלו 0"],
      ["Certain", "an event that will surely happen, with probability 1", "ודאי", "מאורע שבטוח יקרה, וההסתברות שלו 1"],
      ["Outcome", "one possible result of an experiment, like getting 4 when rolling a die", "תוצאה", "אחת האפשרויות שיכולות לצאת בניסוי, כמו 4 בהטלת קובייה"],
    ],
    q: [
      [["You flip a fair coin. What is the probability of heads?", "1/2", ["1/4", "1", "0"], "There are 2 equally likely outcomes and 1 of them is heads: 1/2."],
        ["מטילים מטבע הוגן. מה ההסתברות לקבל ״עץ״?", "1/2", ["1/4", "1", "0"], "יש 2 תוצאות שוות סיכוי ואחת מהן היא ״עץ״: 1/2."]],
      [["Rolling a normal die, how likely is it to get a 7?", "Impossible", ["Likely", "Certain", "Even chance"], "A normal die only has the numbers 1 to 6, so 7 can never come up."],
        ["בהטלת קובייה רגילה, מה הסיכוי לקבל 7?", "בלתי אפשרי", ["סביר", "ודאי", "חצי־חצי"], "בקובייה רגילה יש רק את המספרים 1 עד 6, ולכן 7 לא יכול לצאת."]],
    ],
    n: [[6, ["How many different outcomes are there when you roll one normal die?", "", "A normal die has 6 faces: 1, 2, 3, 4, 5 and 6."], ["כמה תוצאות שונות אפשריות בהטלת קובייה רגילה אחת?", "", "לקובייה רגילה יש 6 פאות: 1, 2, 3, 4, 5 ו־6."]]],
  },
  i: {
    t: [
      ["Event", "a set of outcomes we are interested in, like rolling an even number", "מאורע", "קבוצה של תוצאות שמעניינות אותנו, כמו לקבל מספר זוגי בקובייה"],
      ["Equally likely", "outcomes that each have the same chance of happening", "שווי סיכוי", "תוצאות שלכל אחת מהן אותו סיכוי לקרות"],
      ["Sample space", "the list of all possible outcomes of an experiment", "מרחב המדגם", "רשימת כל התוצאות האפשריות של ניסוי"],
      ["Complement", "the event that something does NOT happen; its probability is 1 minus the probability that it does", "מאורע משלים", "המאורע שמשהו לא יקרה; ההסתברות שלו היא 1 פחות ההסתברות שכן יקרה"],
    ],
    q: [
      [["A bag has 3 red and 5 blue marbles. You pick one without looking. What is the probability it is red?", "3/8", ["3/5", "5/8", "1/3"], "There are 3 + 5 = 8 marbles and 3 are red: 3/8."],
        ["בשקית יש 3 גולות אדומות ו־5 כחולות. מוציאים אחת בלי להסתכל. מה ההסתברות שהיא אדומה?", "3/8", ["3/5", "5/8", "1/3"], "יש 3 + 5 = 8 גולות ו־3 מהן אדומות: 3/8."]],
      [["The probability of rain tomorrow is 0.3. What is the probability that it will NOT rain?", "0.7", ["0.3", "0.6", "1.3"], "The complement: 1 − 0.3 = 0.7."],
        ["ההסתברות לגשם מחר היא 0.3. מה ההסתברות שלא ירד גשם?", "0.7", ["0.3", "0.6", "1.3"], "המאורע המשלים: 1 − 0.3 = 0.7."]],
      [["Rolling one die, what is the probability of an even number?", "1/2", ["1/3", "1/6", "2/3"], "The even numbers are 2, 4 and 6: 3 out of 6 = 1/2."],
        ["בהטלת קובייה, מה ההסתברות לקבל מספר זוגי?", "1/2", ["1/3", "1/6", "2/3"], "המספרים הזוגיים הם 2, 4 ו־6: 3 מתוך 6 = 1/2."]],
    ],
  },
  a: {
    t: [
      ["Independent events", "events where the result of one does not change the chances of the other", "מאורעות בלתי תלויים", "מאורעות שבהם התוצאה של אחד לא משנה את הסיכוי של השני"],
      ["Multiplication rule", "for independent events, the chance of both is the product of their chances", "כלל הכפל", "במאורעות בלתי תלויים, הסיכוי ששניהם יקרו הוא מכפלת הסיכויים"],
      ["Expected value", "the average result you would get over very many repeats", "תוחלת", "התוצאה הממוצעת שמתקבלת אחרי חזרות רבות מאוד"],
      ["Relative frequency", "how often something happened in trials, divided by the number of trials", "שכיחות יחסית", "כמה פעמים משהו קרה בניסויים, חלקי מספר הניסויים"],
    ],
    q: [
      [["You flip a fair coin twice. What is the probability of two heads?", "1/4", ["1/2", "1/3", "1"], "The flips are independent: 1/2 × 1/2 = 1/4 (HH out of HH, HT, TH, TT)."],
        ["מטילים מטבע הוגן פעמיים. מה ההסתברות לקבל ״עץ״ פעמיים?", "1/4", ["1/2", "1/3", "1"], "ההטלות בלתי תלויות: 1/2 × 1/2 = 1/4 (עץ־עץ מתוך 4 אפשרויות שוות)."]],
      [["Rolling two dice, what is the probability that the total is 7?", "1/6", ["1/12", "7/36", "1/36"], "There are 36 equally likely pairs and 6 of them total 7 (1+6, 2+5, 3+4, 4+3, 5+2, 6+1): 6/36 = 1/6."],
        ["מטילים שתי קוביות. מה ההסתברות שהסכום יהיה 7?", "1/6", ["1/12", "7/36", "1/36"], "יש 36 זוגות שווי סיכוי ו־6 מהם מסתכמים ב־7 (1+6, 2+5, 3+4, 4+3, 5+2, 6+1): 6/36 = 1/6."]],
      [["A coin landed heads 5 times in a row. For the next flip, the chance of heads is…", "Still 1/2", ["Less than 1/2", "More than 1/2", "0"], "Coin flips are independent: the coin does not remember earlier results (believing otherwise is the gambler's fallacy)."],
        ["מטבע נפל על ״עץ״ 5 פעמים ברציפות. בהטלה הבאה, הסיכוי ל״עץ״ הוא…", "עדיין 1/2", ["פחות מ־1/2", "יותר מ־1/2", "0"], "הטלות מטבע בלתי תלויות: למטבע אין זיכרון של התוצאות הקודמות (המחשבה ההפוכה נקראת ״כשל המהמר״)."]],
    ],
    n: [[3.5, ["What is the expected value (average) of one roll of a fair die?", "", "(1 + 2 + 3 + 4 + 5 + 6) ÷ 6 = 21 ÷ 6 = 3.5."], ["מהי התוחלת (הממוצע) של הטלה אחת של קובייה הוגנת?", "", "(1 + 2 + 3 + 4 + 5 + 6) ÷ 6 = 21 ÷ 6 = 3.5."]]],
  },
};
export default c;
