import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Problem", "a situation that needs a solution", "בעיה", "מצב שצריך למצוא לו פתרון"],
      ["Plan", "the steps you decide to take before you start", "תוכנית", "הצעדים שמחליטים לעשות לפני שמתחילים"],
      ["Guess and check", "trying an answer, testing it and improving it", "ניסוי וטעייה", "לנסות תשובה, לבדוק אותה ולשפר"],
      ["Clue", "a piece of information that helps you find the answer", "רמז", "פיסת מידע שעוזרת למצוא את התשובה"],
    ],
    q: [
      [["What is a good first step when solving a problem?", "Understand what the problem is asking", ["Write any answer quickly", "Give up", "Copy a friend"], "Reading carefully and knowing the goal comes before choosing a method."],
        ["מה צעד ראשון טוב בפתרון בעיה?", "להבין מה הבעיה שואלת", ["לכתוב מהר תשובה כלשהי", "לוותר", "להעתיק מחבר"], "קריאה זהירה והבנת המטרה באות לפני בחירת שיטה."]],
      [["After finding an answer, what should you do?", "Check that it makes sense", ["Hide it", "Never look at it again", "Change it at random"], "Checking catches mistakes and shows whether the answer fits the question."],
        ["אחרי שמצאתם תשובה, מה כדאי לעשות?", "לבדוק שהיא הגיונית", ["להסתיר אותה", "לא להסתכל עליה שוב", "לשנות אותה באקראי"], "בדיקה תופסת טעויות ומראה אם התשובה מתאימה לשאלה."]],
    ],
    s: [[["Four steps of problem solving", "Understand the problem", "Make a plan", "Carry out the plan", "Look back and check"], ["ארבעה שלבים בפתרון בעיות", "להבין את הבעיה", "לתכנן", "לבצע את התוכנית", "להסתכל אחורה ולבדוק"]]],
  },
  i: {
    t: [
      ["Working backwards", "starting from the goal and reversing each step to reach the start", "עבודה מהסוף להתחלה", "התחלה מהמטרה וביצוע כל צעד בכיוון ההפוך עד שמגיעים להתחלה"],
      ["Breaking it down", "splitting a big problem into smaller parts", "פירוק לשלבים", "חלוקת בעיה גדולה לחלקים קטנים יותר"],
      ["Pattern spotting", "looking for something that repeats to predict what comes next", "זיהוי דפוסים", "חיפוש של משהו שחוזר על עצמו כדי לנבא מה יבוא"],
      ["Drawing a diagram", "sketching the situation to see it more clearly", "שרטוט", "ציור של המצב כדי לראות אותו בבירור"],
    ],
    q: [
      [["I think of a number, double it and add 3. I get 17. What was my number?", "7", ["10", "8.5", "40"], "Work backwards: 17 − 3 = 14, and 14 ÷ 2 = 7."],
        ["חשבתי על מספר, הכפלתי אותו ב־2 והוספתי 3. קיבלתי 17. על איזה מספר חשבתי?", "7", ["10", "8.5", "40"], "עובדים מהסוף: 17 − 3 = 14, ו־14 ÷ 2 = 7."]],
      [["A snail climbs 3 m up a 10 m wall each day and slides back 2 m each night. On which day does it reach the top?", "Day 8", ["Day 10", "Day 5", "Day 7"], "After 7 days and nights it is at 7 m; on day 8 it climbs 3 m to 10 m and is out before sliding back."],
        ["חילזון מטפס 3 מ׳ על קיר בגובה 10 מ׳ בכל יום, ומחליק 2 מ׳ למטה בכל לילה. באיזה יום יגיע לראש הקיר?", "ביום השמיני", ["ביום העשירי", "ביום החמישי", "ביום השביעי"], "אחרי 7 ימים ולילות הוא בגובה 7 מ׳; ביום השמיני הוא מטפס 3 מ׳ ל־10 מ׳ ויוצא לפני שהוא מחליק."]],
    ],
  },
  a: {
    t: [
      ["Simplify the problem", "solving an easier version first to discover the method", "פישוט הבעיה", "פתרון של גרסה קלה יותר קודם, כדי לגלות את השיטה"],
      ["Systematic list", "listing every possibility in an organised order so none is missed", "רשימה שיטתית", "פירוט כל האפשרויות בסדר מאורגן כדי שאף אחת לא תחסר"],
      ["Constraint", "a condition the answer must satisfy", "אילוץ", "תנאי שהתשובה חייבת לקיים"],
      ["Generalising", "finding a rule that works for every case, not just one", "הכללה", "מציאת כלל שעובד בכל המקרים, ולא רק באחד"],
    ],
    q: [
      [["In a room of 10 people, everyone shakes hands once with everyone else. How many handshakes?", "45", ["100", "90", "50"], "Each of 10 shakes 9 hands: 10 × 9 = 90, but each handshake was counted twice: 90 ÷ 2 = 45."],
        ["בחדר יש 10 אנשים, וכל אחד לוחץ יד פעם אחת לכל אחד אחר. כמה לחיצות ידיים יש?", "45", ["100", "90", "50"], "כל אחד מ־10 לוחץ 9 ידיים: 10 × 9 = 90, אבל כל לחיצה נספרה פעמיים: 90 ÷ 2 = 45."]],
      [["How many different ways can 3 friends stand in a line?", "6", ["3", "9", "4"], "A systematic list: 3 choices for first, 2 for second, 1 for third: 3 × 2 × 1 = 6."],
        ["בכמה דרכים שונות 3 חברים יכולים לעמוד בשורה?", "6", ["3", "9", "4"], "רשימה שיטתית: 3 אפשרויות לראשון, 2 לשני ו־1 לשלישי: 3 × 2 × 1 = 6."]],
    ],
  },
};
export default c;
