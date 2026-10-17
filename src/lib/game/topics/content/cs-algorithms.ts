import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Algorithm", "a clear list of steps for solving a problem or doing a task", "אלגוריתם", "רשימה ברורה של צעדים לפתרון בעיה או לביצוע משימה"],
      ["Sequence", "steps carried out one after another, in order", "רצף", "צעדים שמתבצעים בזה אחר זה, לפי הסדר"],
      ["Loop", "repeating a group of steps several times", "לולאה", "חזרה על קבוצת צעדים כמה פעמים"],
      ["Bug", "a mistake in a program that makes it work wrongly", "באג", "טעות בתוכנית שגורמת לה לפעול לא נכון"],
    ],
    q: [
      [["Which of these is an algorithm?", "A recipe for baking a cake", ["A photo of a cake", "The word “cake”", "A cake in the oven"], "A recipe is an ordered list of steps that anyone can follow to get the same result."],
        ["מה מהבאים הוא אלגוריתם?", "מתכון לאפיית עוגה", ["תמונה של עוגה", "המילה ״עוגה״", "עוגה בתנור"], "מתכון הוא רשימה מסודרת של צעדים שכל אחד יכול לבצע ולקבל אותה תוצאה."]],
      [["Why does the order of steps matter?", "Doing them in a different order can give a wrong result", ["It never matters", "Computers sort the steps themselves", "Only the first step counts"], "Putting on shoes before socks follows the same steps in the wrong order — and fails."],
        ["למה סדר הצעדים חשוב?", "ביצוע בסדר אחר יכול לתת תוצאה שגויה", ["הוא אף פעם לא חשוב", "המחשב מסדר את הצעדים בעצמו", "רק הצעד הראשון קובע"], "לנעול נעליים לפני גרביים — אותם צעדים בסדר הלא נכון, וזה נכשל."]],
    ],
    s: [[["Brushing your teeth", "Wet the toothbrush", "Put toothpaste on it", "Brush all your teeth", "Rinse your mouth"], ["צחצוח שיניים", "מרטיבים את המברשת", "שמים עליה משחת שיניים", "מצחצחים את כל השיניים", "שוטפים את הפה"]]],
  },
  i: {
    t: [
      ["Condition", "a question with a yes/no answer that decides which steps run (if … then … else)", "תנאי", "שאלה עם תשובה של כן או לא שקובעת אילו צעדים יתבצעו (אם … אז … אחרת)"],
      ["Linear search", "checking items one by one from the start until you find what you are looking for", "חיפוש סדרתי", "בדיקה של פריטים אחד אחרי השני מההתחלה, עד שמוצאים את מה שמחפשים"],
      ["Binary search", "finding an item in a sorted list by checking the middle and throwing away half each time", "חיפוש בינארי", "מציאת פריט ברשימה ממוינת בבדיקת האמצע והשלכת מחצית בכל פעם"],
      ["Sorting", "putting items in order, such as from smallest to largest", "מיון", "סידור פריטים לפי סדר, למשל מהקטן לגדול"],
    ],
    q: [
      [["Binary search only works if the list is…", "sorted", ["short", "made of numbers", "unsorted"], "Halving works only because you know which side the item must be on — that needs a sorted list."],
        ["חיפוש בינארי עובד רק אם הרשימה…", "ממוינת", ["קצרה", "מורכבת ממספרים", "לא ממוינת"], "החצייה עובדת רק כי יודעים באיזה צד הפריט חייב להיות — וזה דורש רשימה ממוינת."]],
      [["A loop runs “repeat 4 times: add 3”. Starting from 0, what is the total?", "12", ["7", "4", "3"], "Adding 3 four times: 3 + 3 + 3 + 3 = 12."],
        ["לולאה מבצעת ״חזור 4 פעמים: הוסף 3״. מתחילים מ־0. מה הסכום?", "12", ["7", "4", "3"], "מוסיפים 3 ארבע פעמים: 3 + 3 + 3 + 3 = 12."]],
    ],
    n: [[7, ["At most how many guesses does binary search need to find a number between 1 and 100?", "", "Each guess halves the range: 100 → 50 → 25 → 13 → 7 → 4 → 2 → 1, so 7 guesses are always enough (2⁷ = 128 ≥ 100)."], ["לכל היותר כמה ניחושים צריך חיפוש בינארי כדי למצוא מספר בין 1 ל־100?", "", "כל ניחוש חוצה את הטווח: 100 ← 50 ← 25 ← 13 ← 7 ← 4 ← 2 ← 1, ולכן 7 ניחושים תמיד מספיקים (2⁷ = 128 ≥ 100)."]]],
  },
  a: {
    t: [
      ["Efficiency", "how much time or memory an algorithm needs as the input grows", "יעילות", "כמה זמן או זיכרון אלגוריתם צריך ככל שהקלט גדל"],
      ["Big O notation", "a way to describe how running time grows, like O(n) or O(log n)", "סימון O גדול", "דרך לתאר איך זמן הריצה גדל, כמו O(n) או O(log n)"],
      ["Recursion", "a method in which a function solves a problem by calling itself on a smaller version", "רקורסיה", "שיטה שבה פונקציה פותרת בעיה בכך שהיא קוראת לעצמה על גרסה קטנה יותר של הבעיה"],
      ["Base case", "the simplest case, which a recursive method answers directly so that it stops", "מקרה בסיס", "המקרה הפשוט ביותר, שפונקציה רקורסיבית עונה עליו ישירות כדי שתיעצר"],
    ],
    q: [
      [["Searching a sorted list of 1,000,000 names: about how many checks does binary search need at most?", "About 20", ["About 1,000", "About 500,000", "About 1,000,000"], "2²⁰ is about a million, so halving 20 times is enough — that is O(log n)."],
        ["חיפוש ברשימה ממוינת של 1,000,000 שמות: בערך כמה בדיקות לכל היותר צריך חיפוש בינארי?", "כ־20", ["כ־1,000", "כ־500,000", "כ־1,000,000"], "2 בחזקת 20 הוא בערך מיליון, ולכן 20 חציות מספיקות — זה O(log n)."]],
      [["What happens to a recursive function that has no base case?", "It keeps calling itself until the program runs out of memory", ["It returns 0", "It runs only once", "It sorts the input"], "Without a base case there is nothing to stop the calls, so they pile up until a stack overflow."],
        ["מה קורה לפונקציה רקורסיבית שאין לה מקרה בסיס?", "היא קוראת לעצמה שוב ושוב עד שהתוכנית נשארת בלי זיכרון", ["היא מחזירה 0", "היא רצה פעם אחת בלבד", "היא ממיינת את הקלט"], "בלי מקרה בסיס אין מה שיעצור את הקריאות, והן מצטברות עד גלישת מחסנית."]],
      [["Linear search on a list of n items takes, in the worst case, about…", "n checks — O(n)", ["1 check — O(1)", "log n checks — O(log n)", "n² checks — O(n²)"], "In the worst case the item is last or missing, so every one of the n items is checked."],
        ["חיפוש סדרתי ברשימה של n פריטים דורש, במקרה הגרוע, בערך…", "n בדיקות — O(n)", ["בדיקה אחת — O(1)", "log n בדיקות — O(log n)", "n² בדיקות — O(n²)"], "במקרה הגרוע הפריט אחרון או חסר, ולכן בודקים את כל n הפריטים."]],
    ],
  },
};
export default c;
