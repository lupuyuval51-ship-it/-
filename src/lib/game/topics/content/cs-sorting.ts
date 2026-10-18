import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Sorting", "putting items into an order, such as smallest to largest or A to Z", "מיון", "סידור פריטים לפי סדר מסוים, למשל מהקטן לגדול או לפי האלף־בית"],
      ["Ascending order", "arranging things from the smallest value up to the largest", "סדר עולה", "סידור שמתחיל בערך הקטן ביותר ומתקדם אל הגדול ביותר"],
      ["Descending order", "arranging things from the largest value down to the smallest", "סדר יורד", "סידור שמתחיל בערך הגדול ביותר וממשיך אל הקטן ביותר"],
      ["Swap", "two items in a list trade places with each other", "החלפה", "שני פריטים ברשימה עוברים כל אחד למקומו של השני"],
    ],
    q: [
      [["Put 5, 2, 8, 1 in ascending order.", "1, 2, 5, 8", ["8, 5, 2, 1", "1, 5, 2, 8", "5, 2, 8, 1"], "Ascending order starts with the smallest number and ends with the largest: 1 is the smallest, then 2, then 5, and 8 is the largest. 8, 5, 2, 1 is the same list in descending order."],
        ["סדרו את 5, 2, 8, 1 בסדר עולה.", "1, 2, 5, 8", ["8, 5, 2, 1", "1, 5, 2, 8", "5, 2, 8, 1"], "סדר עולה מתחיל במספר הקטן ביותר ומסתיים בגדול ביותר: 1 הוא הקטן ביותר, אחריו 2, אחריו 5, ו־8 הוא הגדול ביותר. 8, 5, 2, 1 היא אותה רשימה בסדר יורד."]],
      [["Which list is in alphabetical order?", "ant, bee, cat, dog", ["bee, ant, cat, dog", "ant, cat, bee, dog", "dog, cat, bee, ant"], "Alphabetical order follows the alphabet from A to Z: ant (a), bee (b), cat (c), dog (d). The last option is the same list backwards, from the end of the alphabet towards the start."],
        ["איזו רשימה מסודרת לפי סדר האלף־בית?", "ארנב, דוב, זברה, ינשוף", ["דוב, ארנב, זברה, ינשוף", "ארנב, זברה, דוב, ינשוף", "ינשוף, זברה, דוב, ארנב"], "סדר האלף־בית הולך מהאות א׳ ועד האות ת׳: ארנב (א), דוב (ד), זברה (ז), ינשוף (י). האפשרות האחרונה היא אותה רשימה בסדר הפוך, מסוף האלף־בית אל תחילתו."]],
      [["In bubble sort, which two items are compared each time?", "Two neighbouring items", ["The first item and the last item", "The two largest items in the list", "Two items picked at random"], "Bubble sort walks along the list comparing neighbours: the 1st with the 2nd, then the 2nd with the 3rd, and so on, swapping any pair that is in the wrong order."],
        ["במיון בועות, אילו שני פריטים משווים בכל פעם?", "שני פריטים סמוכים", ["הפריט הראשון והפריט האחרון", "שני הפריטים הגדולים ברשימה", "שני פריטים שנבחרים באקראי"], "מיון בועות עובר לאורך הרשימה ומשווה בין שכנים: הראשון עם השני, השני עם השלישי וכן הלאה, ומחליף כל זוג שנמצא בסדר הלא נכון."]],
      [["A phone lists your contacts from A to Z. Why is that useful?", "A name is quicker to find", ["Old contacts get deleted", "The battery lasts much longer", "New contacts are added for you"], "In a sorted list you can jump straight to the right letter instead of reading every name. Sorting never adds or removes contacts, and it does not change the battery."],
        ["הטלפון מציג את אנשי הקשר לפי סדר האלף־בית. למה זה שימושי?", "קל ומהיר יותר למצוא שם", ["אנשי קשר ישנים נמחקים", "הסוללה מחזיקה הרבה יותר זמן", "אנשי קשר חדשים נוספים לבד"], "ברשימה ממוינת אפשר לקפוץ ישר לאות הנכונה במקום לקרוא כל שם. המיון אף פעם לא מוסיף או מוחק אנשי קשר, והוא לא משפיע על הסוללה."]],
      [["A teacher lines pupils up from the shortest to the tallest. Which order is this?", "Ascending order", ["Descending order", "Alphabetical order", "Random order"], "The heights go up from the smallest to the largest, which is ascending order. From the tallest to the shortest would be descending order."],
        ["מורה מעמידה את התלמידים בשורה מהנמוך ביותר ועד הגבוה ביותר. איזה סדר זה?", "סדר עולה", ["סדר יורד", "סדר אלפביתי", "סדר אקראי"], "הגבהים עולים מהקטן ביותר אל הגדול ביותר, וזה סדר עולה. מהגבוה ביותר אל הנמוך ביותר היה סדר יורד."]],
    ],
    n: [
      [8, ["Ten cards numbered 1 to 10 are sorted in descending order. Which number is on the 3rd card?", "", "Descending order starts with the largest number: 10, then 9, then 8, so the 3rd card shows 8."],
        ["עשרה קלפים שעליהם המספרים 1 עד 10 ממוינים בסדר יורד. איזה מספר מופיע על הקלף השלישי?", "", "סדר יורד מתחיל במספר הגדול ביותר: 10, אחריו 9 ואחריו 8, ולכן על הקלף השלישי מופיע 8."]],
    ],
    s: [
      [["From the lightest to the heaviest", "A mouse", "A rabbit", "A horse", "An elephant"],
        ["מהקל ביותר אל הכבד ביותר", "עכבר", "ארנב", "סוס", "פיל"]],
    ],
  },
  i: {
    t: [
      ["Bubble sort", "a method that keeps comparing neighbouring items and swapping them until no swaps are needed", "מיון בועות", "שיטה שמשווה שוב ושוב בין פריטים סמוכים ומחליפה ביניהם, עד שאין צורך בעוד החלפות"],
      ["Selection sort", "a method that finds the smallest remaining item and moves it to the next place in line", "מיון בחירה", "שיטה שמוצאת בכל שלב את הפריט הקטן ביותר שנשאר ומעבירה אותו למקום הבא בתור"],
      ["Insertion sort", "a method that takes items one at a time and slides each into its place among those already in order", "מיון הכנסה", "שיטה שלוקחת פריט אחד בכל פעם ומחליקה אותו למקומו בין הפריטים שכבר מסודרים"],
      ["Pass", "one full trip along the list from its start to its end", "מעבר", "סיבוב אחד שלם לאורך הרשימה, מתחילתה ועד סופה"],
    ],
    q: [
      [["What is 5, 1, 4, 2 after the first pass of bubble sort in ascending order?", "1, 4, 2, 5", ["1, 2, 4, 5", "1, 5, 4, 2", "5, 4, 2, 1"], "Compare 5 and 1: swap (1, 5, 4, 2). Compare 5 and 4: swap (1, 4, 5, 2). Compare 5 and 2: swap (1, 4, 2, 5). One pass is not enough to sort the whole list."],
        ["איך תיראה הרשימה 5, 1, 4, 2 אחרי המעבר הראשון של מיון בועות בסדר עולה?", "1, 4, 2, 5", ["1, 2, 4, 5", "1, 5, 4, 2", "5, 4, 2, 1"], "משווים 5 ו־1: מחליפים (1, 5, 4, 2). משווים 5 ו־4: מחליפים (1, 4, 5, 2). משווים 5 ו־2: מחליפים (1, 4, 2, 5). מעבר אחד לא מספיק כדי למיין את כל הרשימה."]],
      [["After one pass of bubble sort in ascending order, which item is sure to be in its final place?", "The largest item, now at the end", ["The smallest item, now at the start", "The middle item of the list", "No item can be in its place yet"], "The largest item wins every comparison it takes part in, so it is carried all the way to the end. The smallest item can move at most one place towards the start in each pass."],
        ["אחרי מעבר אחד של מיון בועות בסדר עולה, איזה פריט בטוח נמצא כבר במקומו הסופי?", "הפריט הגדול ביותר, שעכשיו בסוף", ["הפריט הקטן ביותר, שעכשיו בהתחלה", "הפריט האמצעי ברשימה", "אף פריט עוד לא יכול להיות במקומו"], "הפריט הגדול ביותר ״מנצח״ בכל השוואה שהוא משתתף בה, ולכן הוא נדחף עד סוף הרשימה. הפריט הקטן ביותר יכול לזוז לכל היותר מקום אחד לכיוון ההתחלה בכל מעבר."]],
      [["Selection sort finds the smallest item and swaps it with the item in first place. What is 4, 2, 7, 1 after this first step?", "1, 2, 7, 4", ["1, 2, 4, 7", "2, 4, 7, 1", "7, 4, 2, 1"], "The smallest item is 1. It swaps places with 4, the first item, giving 1, 2, 7, 4. Only one swap happens in this step, so the rest of the list is not sorted yet."],
        ["מיון בחירה מוצא את הפריט הקטן ביותר ומחליף אותו עם הפריט שבמקום הראשון. איך תיראה הרשימה 4, 2, 7, 1 אחרי הצעד הראשון?", "1, 2, 7, 4", ["1, 2, 4, 7", "2, 4, 7, 1", "7, 4, 2, 1"], "הפריט הקטן ביותר הוא 1. הוא מתחלף במקומו עם 4, הפריט הראשון, ומתקבל 1, 2, 7, 4. בצעד הזה מתבצעת החלפה אחת בלבד, ולכן שאר הרשימה עוד לא ממוינת."]],
      [["Insertion sort is most like which everyday action?", "Putting cards in order in your hand, one by one", ["Shuffling a whole deck of cards before a new game", "Picking one card at random from the deck", "Throwing away the cards you do not need"], "When you pick up cards one by one and slide each new card into its right place among the cards you already hold, you are doing insertion sort."],
        ["מיון הכנסה דומה ביותר לאיזו פעולה יומיומית?", "סידור קלפים ביד, קלף אחרי קלף", ["טריפה של כל חפיסת הקלפים לפני משחק חדש", "שליפה של קלף אחד באקראי מהחפיסה", "זריקה של הקלפים שאין בהם צורך"], "כשמרימים קלפים אחד אחד ומחליקים כל קלף חדש למקומו הנכון בין הקלפים שכבר ביד, זה בדיוק מיון הכנסה."]],
      [["Bubble sort stops early when a pass makes no swaps. Which list will it finish fastest?", "1, 2, 3, 4, 5", ["2, 1, 4, 3, 5", "3, 5, 1, 4, 2", "5, 4, 3, 2, 1"], "A list that is already in order needs just one pass with no swaps, and then the sort stops. A list in reverse order is the slowest case: every pass has to swap."],
        ["מיון בועות עוצר מוקדם כשמעבר שלם עובר בלי אף החלפה. איזו רשימה הוא ימיין הכי מהר?", "1, 2, 3, 4, 5", ["2, 1, 4, 3, 5", "3, 5, 1, 4, 2", "5, 4, 3, 2, 1"], "רשימה שכבר מסודרת צריכה רק מעבר אחד בלי החלפות, ואז המיון נעצר. רשימה בסדר הפוך היא המקרה האיטי ביותר: בכל מעבר צריך להחליף."]],
    ],
    n: [
      [2, ["Bubble sort puts 3, 1, 2 in ascending order. How many swaps does it make in total?", "", "3 and 1 swap (1, 3, 2), then 3 and 2 swap (1, 2, 3). The next pass makes no swaps, so the total is 2."],
        ["מיון בועות מסדר את 3, 1, 2 בסדר עולה. כמה החלפות הוא מבצע בסך הכול?", "", "3 ו־1 מתחלפים (1, 3, 2), ואז 3 ו־2 מתחלפים (1, 2, 3). המעבר הבא לא מבצע אף החלפה, ולכן יש בסך הכול 2 החלפות."]],
      [5, ["How many comparisons does the first pass of bubble sort make on a list of 6 items?", "", "Each comparison looks at a pair of neighbours. A list of 6 items has 6 − 1 = 5 neighbouring pairs, so the first pass makes 5 comparisons."],
        ["כמה השוואות מבצע המעבר הראשון של מיון בועות על רשימה של 6 פריטים?", "", "כל השוואה בודקת זוג שכנים. ברשימה של 6 פריטים יש 6 − 1 = 5 זוגות של שכנים, ולכן המעבר הראשון מבצע 5 השוואות."]],
    ],
    s: [
      [["One pass of bubble sort, in order", "Start with the first two items of the list", "Compare the two neighbours", "Swap them if they are in the wrong order", "Move one place along to the next pair", "Stop after the last pair has been compared"],
        ["מעבר אחד של מיון בועות, לפי הסדר", "מתחילים בשני הפריטים הראשונים ברשימה", "משווים בין שני השכנים", "מחליפים ביניהם אם הם בסדר הלא נכון", "מתקדמים מקום אחד אל הזוג הבא", "עוצרים אחרי שהזוג האחרון הושווה"]],
    ],
  },
  a: {
    t: [
      ["Merge sort", "a method that splits a list into halves, sorts each half and then joins them back in order", "מיון מיזוג", "שיטה שמפצלת רשימה לחצאים, ממיינת כל חצי ואז מאחדת אותם בחזרה לפי הסדר"],
      ["Merging", "combining two sorted lists into one sorted list by always taking the smaller front item", "מיזוג", "איחוד של שתי רשימות ממוינות לרשימה ממוינת אחת, כשבכל פעם לוקחים את הקטן מבין שני הפריטים שבראש"],
      ["Divide and conquer", "solving a big problem by splitting it into smaller problems of the same kind", "הפרד ומשול", "פתרון של בעיה גדולה על ידי פירוק שלה לבעיות קטנות יותר מאותו סוג"],
      ["Stable sort", "a method that arranges a list but keeps items with equal values in the order they had before", "מיון יציב", "שיטה ששומרת על הסדר המקורי של פריטים שיש להם ערך שווה"],
    ],
    q: [
      [["Merge the sorted lists 2, 5, 9 and 3, 4, 10 into one sorted list.", "2, 3, 4, 5, 9, 10", ["2, 3, 5, 4, 9, 10", "2, 5, 9, 3, 4, 10", "10, 9, 5, 4, 3, 2"], "Keep taking the smaller of the two front items: 2 (first list), 3 and 4 (second list), 5 and 9 (first list) and finally 10. Just putting one list after the other does not keep the order."],
        ["מזגו את הרשימות הממוינות 2, 5, 9 ו־3, 4, 10 לרשימה ממוינת אחת.", "2, 3, 4, 5, 9, 10", ["2, 3, 5, 4, 9, 10", "2, 5, 9, 3, 4, 10", "10, 9, 5, 4, 3, 2"], "בכל פעם לוקחים את הקטן מבין שני הפריטים שבראש הרשימות: 2 (מהראשונה), 3 ו־4 (מהשנייה), 5 ו־9 (מהראשונה) ולבסוף 10. אם רק מצמידים רשימה אחת אחרי השנייה, הסדר לא נשמר."]],
      [["A list grows from 1,000 to 2,000 items. Roughly how much more work does bubble sort need?", "About 4 times as much", ["About 2 times as much", "About 10 times as much", "Exactly the same amount"], "Bubble sort compares roughly every pair of items, so its work grows like n × n. Doubling n multiplies n × n by 2 × 2 = 4, not just by 2."],
        ["רשימה גדלה מ־1,000 ל־2,000 פריטים. בערך פי כמה גדלה העבודה של מיון בועות?", "בערך פי 4", ["בערך פי 2", "בערך פי 10", "העבודה לא משתנה בכלל"], "מיון בועות משווה בערך כל זוג פריטים, ולכן העבודה שלו גדלה כמו n × n. כשמכפילים את n, המכפלה n × n גדלה פי 2 × 2 = 4, ולא רק פי 2."]],
      [["Two pupils have the same score. The class list is sorted by score with a stable sort. What happens to these two pupils?", "They keep the order they had before", ["The one who was second moves in front", "They are put in order by their names", "One of them is removed from the list"], "A stable sort never reorders items with equal values, so the pupil who came first before sorting still comes first. This is useful when you sort by one thing after another."],
        ["לשני תלמידים יש אותו ציון. רשימת הכיתה ממוינת לפי ציון במיון יציב. מה קורה לשני התלמידים האלה?", "הם שומרים על הסדר שהיה ביניהם קודם", ["מי שהיה שני עובר להיות ראשון", "הם מסודרים ביניהם לפי השמות", "אחד מהם נמחק מהרשימה"], "מיון יציב אף פעם לא משנה את הסדר בין פריטים בעלי ערך שווה, ולכן התלמיד שהיה ראשון לפני המיון נשאר ראשון. זה שימושי כשממיינים לפי דבר אחד ואחר כך לפי דבר אחר."]],
      [["Which list does insertion sort handle very quickly?", "A list that is nearly sorted", ["A list of very large numbers", "A list where no two items are equal", "A list in exactly reverse order"], "In a nearly sorted list each item slides back only a place or two, so there is little work. In a reversed list every item must slide all the way to the front, which is the slowest case."],
        ["איזו רשימה מיון הכנסה ממיין מהר מאוד?", "רשימה שכמעט ממוינת", ["רשימה של מספרים גדולים מאוד", "רשימה שאין בה שני פריטים שווים", "רשימה בסדר הפוך לגמרי"], "ברשימה שכמעט ממוינת כל פריט מחליק אחורה רק מקום או שניים, ולכן יש מעט עבודה. ברשימה הפוכה כל פריט צריך להחליק עד ההתחלה, וזה המקרה האיטי ביותר."]],
      [["Why do many programs sort data before searching it?", "A sorted list can be searched by halving it again and again", ["A search always gives the wrong result on a list that is not sorted", "A sorted list takes up much less memory than before", "Sorting removes every repeated item from the list"], "In a sorted list you can check the middle item, throw away the half that cannot hold what you want and repeat (binary search). An unsorted list can still be searched, but you may have to check every item."],
        ["למה תוכנות רבות ממיינות נתונים לפני שהן מחפשות בהם?", "ברשימה ממוינת אפשר לחפש בעזרת חלוקה לחצי שוב ושוב", ["חיפוש ברשימה לא ממוינת תמיד נותן תוצאה שגויה", "רשימה ממוינת תופסת הרבה פחות זיכרון", "המיון מוחק מהרשימה כל פריט שחוזר על עצמו"], "ברשימה ממוינת בודקים את הפריט האמצעי, זורקים את החצי שבו מה שמחפשים לא יכול להיות, וחוזרים על כך (חיפוש בינארי). גם ברשימה לא ממוינת אפשר לחפש, אבל אולי צריך לבדוק כל פריט."]],
    ],
    n: [
      [3, ["Merge sort splits a list of 8 items in half, then splits the halves, and so on. How many rounds of splitting until every part has 1 item?", "", "8 items become parts of 4, then 2, then 1: three rounds of halving, because 2 × 2 × 2 = 8. So the answer is 3."],
        ["מיון מיזוג מפצל רשימה של 8 פריטים לחצי, ואז מפצל את החצאים, וכן הלאה. כמה סבבים של פיצול יש עד שבכל חלק יש פריט אחד?", "", "מ־8 פריטים מקבלים חלקים של 4, אחר כך של 2 ולבסוף של 1: שלושה סבבים של חלוקה לחצי, כי 2 × 2 × 2 = 8. לכן התשובה היא 3."]],
      [45, ["In bubble sort on 10 items, each pass compares one pair fewer than the pass before, starting with 9 comparisons. How many comparisons are there in total?", "", "9 + 8 + 7 + 6 + 5 + 4 + 3 + 2 + 1 = 45, which is also 10 × 9 ÷ 2 = 45."],
        ["במיון בועות על 10 פריטים, כל מעבר משווה זוג אחד פחות מהמעבר הקודם, ומתחילים ב־9 השוואות. כמה השוואות יש בסך הכול?", "", "9 + 8 + 7 + 6 + 5 + 4 + 3 + 2 + 1 = 45, וזה גם 10 × 9 ÷ 2 = 45."]],
    ],
    s: [
      [["Merge sort on 6, 3, 8, 1, in order", "Split the list into 6, 3 and 8, 1", "Split again until every item stands alone", "Merge each pair into a sorted list: 3, 6 and 1, 8", "Merge 3, 6 and 1, 8 into 1, 3, 6, 8"],
        ["מיון מיזוג של 6, 3, 8, 1, לפי הסדר", "מפצלים את הרשימה ל־6, 3 ול־8, 1", "מפצלים שוב עד שכל פריט עומד לבד", "ממזגים כל זוג לרשימה ממוינת: 3, 6 ו־1, 8", "ממזגים את 3, 6 ואת 1, 8 לרשימה 1, 3, 6, 8"]],
    ],
  },
};
export default c;
