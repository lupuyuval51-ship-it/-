import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Random number", "a number picked by chance, so nobody can know it in advance", "מספר אקראי", "מספר שנבחר במקרה, כך שאף אחד לא יכול לדעת אותו מראש"],
      ["Range", "the smallest and the largest value that a random pick is allowed to be", "טווח", "הערך הקטן ביותר והערך הגדול ביותר שבחירה אקראית יכולה לתת"],
      ["Shuffle", "mixing the items of a list into a new order by chance", "ערבוב", "סידור מחדש של פריטי רשימה בסדר מקרי"],
    ],
    q: [
      [["In Scratch,  pick random 1 to 6  can give which numbers?", "Any whole number from 1 to 6, including both", ["Any whole number from 1 to 5; the 6 is never picked", "Only the numbers 2, 3, 4 and 5", "Only the number 6"], "Both ends are included, so 1, 2, 3, 4, 5 and 6 can all come up, just like on a die."],
        ["בסקראץ׳, אילו מספרים יכולה לתת הלבנה ״בחר מספר אקראי בין 1 ל־6״?", "כל מספר שלם מ־1 עד 6, כולל שניהם", ["כל מספר שלם מ־1 עד 5; את 6 היא אף פעם לא בוחרת", "רק המספרים 2, 3, 4 ו־5", "רק המספר 6"], "שני הקצוות כלולים, ולכן 1, 2, 3, 4, 5 ו־6 יכולים כולם לצאת, בדיוק כמו בקובייה."]],
      [["You roll a fair six-sided die. What is the chance of getting a 4?", "1 in 6", ["1 in 4", "4 in 6", "1 in 2"], "A fair die has 6 sides that are all equally likely, and only one of them shows 4."],
        ["מטילים קובייה הוגנת עם שש פאות. מה הסיכוי לקבל 4?", "1 מתוך 6", ["1 מתוך 4", "4 מתוך 6", "1 מתוך 2"], "לקובייה הוגנת יש 6 פאות שלכל אחת מהן אותו סיכוי, ורק על אחת מהן כתוב 4."]],
      [["Why do many games use random numbers?", "So each game can turn out differently", ["So the game plays exactly the same way every time", "So the computer needs less memory", "So the game needs no code at all"], "Randomness decides things like where enemies appear or which card comes next, so the game stays surprising."],
        ["למה משחקים רבים משתמשים במספרים אקראיים?", "כדי שכל משחק יוכל להתפתח אחרת", ["כדי שהמשחק יתנהל בדיוק אותו דבר בכל פעם", "כדי שהמחשב יצטרך פחות זיכרון", "כדי שהמשחק לא יצטרך קוד בכלל"], "האקראיות מחליטה דברים כמו איפה יופיעו אויבים או איזה קלף יגיע עכשיו, וכך המשחק נשאר מפתיע."]],
      [["In Python, after  import random , which line picks a whole number from 1 to 10 with both ends included?", "random.randint(1, 10)", ["random.randint(1, 9)", "random.randint(0, 10)", "random.choice(10)"], "randint includes both of its ends, so randint(1, 10) can give 1, 10 or anything in between. randint(0, 10) could also give 0."],
        ["ב־Python, אחרי  import random , איזו שורה בוחרת מספר שלם מ־1 עד 10, כששני הקצוות כלולים?", "random.randint(1, 10)", ["random.randint(1, 9)", "random.randint(0, 10)", "random.choice(10)"], "randint כוללת את שני הקצוות שלה, ולכן randint(1, 10) יכולה לתת 1, 10 או כל מספר שביניהם. randint(0, 10) הייתה יכולה לתת גם 0."]],
      [['In Python,  random.choice(["rock", "paper", "scissors"])  gives what?', "One of the three words, picked at random", ["All three of the words, mixed into a new random order", "Always the first word, rock", "The number 3"], "choice picks a single item from the list. Mixing the whole list into a new order is what shuffle does."],
        ['ב־Python, מה נותן  random.choice(["rock", "paper", "scissors"]) ?', "אחת משלוש המילים, שנבחרה באקראי", ["את שלוש המילים, מעורבבות בסדר אקראי חדש", "תמיד את המילה הראשונה, rock", "את המספר 3"], "choice בוחרת פריט אחד מהרשימה. ערבוב של כל הרשימה לסדר חדש הוא מה ש־shuffle עושה."]],
    ],
    n: [
      [50, ["You flip a fair coin 100 times. About how many heads do you expect?", "", "Heads has a chance of 1 in 2, so you expect about half of 100, which is 50. The real count is usually close to 50 but not always exact."],
        ["מטילים מטבע הוגן 100 פעמים. בערך כמה פעמים צפוי לצאת ״עץ״?", "", "הסיכוי ל״עץ״ הוא 1 מתוך 2, ולכן צפוי שבערך חצי מ־100 ההטלות ייתנו עץ, כלומר 50. התוצאה האמיתית בדרך כלל קרובה ל־50, אבל לא תמיד בדיוק."]],
      [4, ["A bag holds 3 red marbles and 1 blue marble. You pick one without looking. The chance of blue is 1 in x. What is x?", "", "There are 3 + 1 = 4 marbles and only one is blue, so the chance is 1 in 4."],
        ["בשקית יש 3 גולות אדומות וגולה כחולה אחת. שולפים גולה בלי להסתכל. הסיכוי לכחולה הוא 1 מתוך x. מהו x?", "", "יש 3 + 1 = 4 גולות ורק אחת מהן כחולה, ולכן הסיכוי הוא 1 מתוך 4."]],
    ],
  },
  i: {
    t: [
      ["Pseudo-random numbers", "numbers made by a formula that look random but follow a fixed pattern", "מספרים פסאודו־אקראיים", "מספרים שנוצרים בנוסחה ונראים מקריים, אבל בעצם הולכים לפי דפוס קבוע"],
      ["Seed", "the starting value of a number generator; the same one gives the same sequence again", "זרע (seed)", "ערך ההתחלה של מחולל מספרים; אותו ערך נותן שוב את אותו רצף"],
      ["Probability", "how likely something is, from 0 for impossible to 1 for certain", "הסתברות", "עד כמה סביר שמשהו יקרה, מ־0 (בלתי אפשרי) עד 1 (ודאי)"],
    ],
    q: [
      [["In Python,  random.random()  gives which kind of number?", "A decimal from 0 up to, but not including, 1", ["A decimal from 0 up to 1, where 1 itself can also come up", "A whole number from 0 to 100", "Either 0 or 1, nothing in between"], "random() gives a float such as 0.37 that is at least 0.0 and always less than 1.0."],
        ["ב־Python, איזה סוג מספר נותנת  random.random() ?", "מספר עשרוני מ־0 ועד 1, בלי 1 עצמו", ["מספר עשרוני מ־0 עד 1, כשגם 1 עצמו יכול לצאת", "מספר שלם מ־0 עד 100", "רק 0 או 1, בלי שום דבר באמצע"], "random() נותנת מספר עשרוני כמו 0.37, שהוא לפחות 0.0 ותמיד קטן מ־1.0."]],
      [["In JavaScript, which expression gives a random whole number from 1 to 6?", "Math.floor(Math.random() * 6) + 1", ["Math.floor(Math.random() * 6)", "Math.floor(Math.random() * 5) + 1", "Math.random(6)"], "Math.random() * 6 is from 0 up to just under 6; Math.floor turns that into 0 to 5, and + 1 shifts it to 1 to 6."],
        ["ב־JavaScript, איזה ביטוי נותן מספר שלם אקראי מ־1 עד 6?", "Math.floor(Math.random() * 6) + 1", ["Math.floor(Math.random() * 6)", "Math.floor(Math.random() * 5) + 1", "Math.random(6)"], "Math.random() * 6 נותן מספר מ־0 עד קצת פחות מ־6; Math.floor הופך אותו למספר שלם מ־0 עד 5, והוספה של 1 מזיזה את הטווח ל־1 עד 6."]],
      [["A Python program calls  random.seed(42)  and then prints 3 random numbers. You run it again. What happens?", "It prints the same 3 numbers as the first time", ["It prints 3 new numbers, different from the first time", "It prints the number 42 three times", "It stops with an error, as a seed works only once"], "The seed sets the starting point of the formula, so the same seed always gives the same sequence of numbers."],
        ["תוכנית ב־Python קוראת ל־ random.seed(42)  ואז מדפיסה 3 מספרים אקראיים. מריצים אותה שוב. מה קורה?", "היא מדפיסה את אותם 3 מספרים כמו בפעם הראשונה", ["היא מדפיסה 3 מספרים חדשים, שונים מהפעם הראשונה", "היא מדפיסה את המספר 42 שלוש פעמים", "היא נעצרת בשגיאה, כי אפשר להשתמש בזרע רק פעם אחת"], "הזרע קובע את נקודת ההתחלה של הנוסחה, ולכן אותו זרע נותן תמיד את אותו רצף של מספרים."]],
      [["Why are the random numbers of most programs called pseudo-random?", "They come from a formula, so knowing its start lets you predict them", ["They are copied from a long list that people typed in", "They are not numbers at all, but letters", "They are always even numbers"], "A computer follows exact steps, so its random numbers come from a formula. Anyone who knows the formula and the seed can work out the whole sequence."],
        ["למה המספרים האקראיים של רוב התוכניות נקראים פסאודו־אקראיים?", "הם נוצרים בנוסחה, ומי שיודע איך היא התחילה יכול לחזות אותם", ["הם מועתקים מרשימה ארוכה שאנשים הקלידו", "הם בכלל לא מספרים, אלא אותיות", "הם תמיד מספרים זוגיים"], "מחשב מבצע צעדים מדויקים, ולכן המספרים האקראיים שלו מגיעים מנוסחה. מי שמכיר את הנוסחה ואת הזרע יכול לחשב את כל הרצף."]],
      [["In Python, what does  random.shuffle(cards)  do?", "Puts the list cards in a random order", ["Picks one card at random and gives it back", "Sorts the cards from smallest to largest", "Makes a new list with two copies of each card"], "shuffle changes the order of the list itself. To pick a single card you would use random.choice(cards) instead."],
        ["ב־Python, מה עושה  random.shuffle(cards) ?", "מסדרת את הרשימה cards בסדר אקראי", ["בוחרת קלף אחד באקראי ומחזירה אותו", "ממיינת את הקלפים מהקטן לגדול", "יוצרת רשימה חדשה עם שני עותקים של כל קלף"], "shuffle משנה את הסדר של הרשימה עצמה. כדי לבחור קלף אחד משתמשים דווקא ב־random.choice(cards)."]],
    ],
    n: [
      [11, ["How many different totals can you get by rolling two six-sided dice and adding them up?", "", "The smallest total is 1 + 1 = 2 and the largest is 6 + 6 = 12, and every total from 2 to 12 is possible: 11 totals."],
        ["כמה סכומים שונים אפשר לקבל כשמטילים שתי קוביות רגילות ומחברים את התוצאות?", "", "הסכום הקטן ביותר הוא 1 + 1 = 2 והגדול ביותר 6 + 6 = 12, וכל סכום מ־2 עד 12 אפשרי: 11 סכומים."]],
      [6, ["Two dice have 36 equally likely outcomes. How many of them add up to 7?", "", "1 + 6, 2 + 5, 3 + 4, 4 + 3, 5 + 2 and 6 + 1 make 6 outcomes, more than for any other total."],
        ["לשתי קוביות יש 36 תוצאות שסיכוייהן שווים. בכמה מהן הסכום הוא 7?", "", "הצירופים 1 ו־6, 2 ו־5, 3 ו־4, 4 ו־3, 5 ו־2, 6 ו־1 נותנים 6 תוצאות, יותר מלכל סכום אחר."]],
    ],
    s: [
      [["Order these two-dice totals from least likely to most likely", "A total of 12", "A total of 10", "A total of 5", "A total of 8"],
        ["סדרו את הסכומים של שתי קוביות מהפחות סביר לסביר ביותר", "סכום של 12", "סכום של 10", "סכום של 5", "סכום של 8"]],
    ],
  },
  a: {
    t: [
      ["Linear congruential generator", "a classic formula for random-looking numbers: multiply, add, then keep the remainder", "מחולל קונגרואנטי לינארי", "נוסחה ותיקה למספרים שנראים מקריים: כופלים, מוסיפים ושומרים רק את השארית"],
      ["Period", "how many numbers a generator makes before its sequence starts to repeat", "מחזור", "כמה מספרים מחולל מייצר לפני שהרצף שלו מתחיל לחזור על עצמו"],
      ["Fisher–Yates shuffle", "a fair way to mix a list: from the end, swap each item with a random item at or before it", "ערבוב פישר–ייטס", "דרך הוגנת לערבב רשימה: מהסוף להתחלה, מחליפים כל פריט בפריט אקראי שנמצא במקומו או לפניו"],
    ],
    q: [
      [["Why should a Python password generator use the  secrets  module and not  random ?", "random's numbers can be predicted; secrets is built to be unguessable", ["random is far too slow to make a password in time", "random can only make numbers, and passwords need letters", "secrets makes every password longer by itself"], "Python's documentation warns that random must not be used for security, because its sequence can be worked out. secrets uses the system's secure source of randomness."],
        ["למה מחולל סיסמאות ב־Python צריך להשתמש במודול  secrets  ולא ב־ random ?", "את המספרים של random אפשר לחזות; secrets נבנה כך שאי אפשר לנחש אותו", ["random איטי מדי כדי לייצר סיסמה בזמן", "random יודע לייצר רק מספרים, וסיסמאות צריכות אותיות", "secrets מאריך כל סיסמה בעצמו"], "התיעוד של Python מזהיר שאסור להשתמש ב־random לצורכי אבטחה, כי אפשר לחשב את הרצף שלו. secrets משתמש במקור האקראיות המאובטח של מערכת ההפעלה."]],
      [["A naive shuffle swaps each card with ANY position in the whole deck. What is wrong with it?", "Some orders come out more often than others", ["It can never move the first card away from the top", "It always produces the same order", "It loses some of the cards"], "With n cards it has n to the power n equally likely runs, which cannot be shared evenly among the n! possible orders, so some orders win more often. Fisher–Yates fixes this."],
        ["ערבוב תמים מחליף כל קלף עם מקום כלשהו בכל החפיסה. מה הבעיה בו?", "סדרים מסוימים יוצאים בתדירות גבוהה יותר מאחרים", ["הוא אף פעם לא מזיז את הקלף הראשון מראש החפיסה", "הוא תמיד מייצר את אותו סדר", "הוא מאבד חלק מהקלפים"], "עם n קלפים יש לו n בחזקת n ריצות שסיכוייהן שווים, ואי אפשר לחלק אותן שווה בשווה בין כל הסדרים האפשריים, שמספרם n עצרת, ולכן סדרים מסוימים יוצאים יותר. ערבוב פישר–ייטס פותר את זה."]],
      [["random.randint(1, 6)  runs 600 times. What is most likely to happen?", "Each number comes up roughly 100 times, but not exactly", ["Each number comes up exactly 100 times", "The number 6 comes up far less often than the number 1", "After a 6 comes up, another 6 becomes less likely for a while"], "Each number has a 1 in 6 chance every time, so about 600 ÷ 6 = 100 each, with small random differences. Earlier rolls do not change the next one."],
        ["הפקודה  random.randint(1, 6)  רצה 600 פעמים. מה הכי סביר שיקרה?", "כל מספר ייצא בערך 100 פעמים, אבל לא בדיוק", ["כל מספר ייצא בדיוק 100 פעמים", "המספר 6 ייצא הרבה פחות פעמים מהמספר 1", "אחרי שיוצא 6, הסיכוי ל־6 נוסף קטן לזמן מה"], "לכל מספר יש סיכוי של 1 מתוך 6 בכל פעם, ולכן כל אחד ייצא בערך 600 ÷ 6 = 100 פעמים, עם הבדלים מקריים קטנים. הטלות קודמות לא משנות את ההטלה הבאה."]],
      [["A game builds its map from a seed. Two players type the same seed into the same version of the game. What do they get?", "The same map", ["Maps that are similar but never the same", "Two completely different maps", "No map, because each seed works only once"], "Map building uses a pseudo-random sequence that starts from the seed, so the same seed and the same code always build the same map."],
        ["משחק בונה את המפה שלו מזרע. שני שחקנים מקלידים את אותו זרע באותה גרסה של המשחק. מה הם מקבלים?", "את אותה מפה", ["מפות דומות, אבל אף פעם לא זהות", "שתי מפות שונות לגמרי", "שום מפה, כי כל זרע עובד רק פעם אחת"], "בניית המפה משתמשת ברצף פסאודו־אקראי שמתחיל מהזרע, ולכן אותו זרע ואותו קוד בונים תמיד את אותה מפה."]],
      [["Which of these can  random.randint(1, 6)  give, but  random.randrange(1, 6)  never gives?", "6", ["1", "5", "3"], "randint includes both ends, so it gives 1 to 6. randrange stops just before its end, like range, so it gives only 1 to 5."],
        ["איזה מהמספרים האלה יכול לצאת מ־ random.randint(1, 6) , אבל אף פעם לא מ־ random.randrange(1, 6) ?", "6", ["1", "5", "3"], "randint כוללת את שני הקצוות, ולכן היא נותנת 1 עד 6. randrange נעצרת ממש לפני הקצה, כמו range, ולכן היא נותנת רק 1 עד 5."]],
    ],
    n: [
      [0, ["A generator uses  next = (5 × current + 3) mod 8 , and current is 1. What is next?", "", "5 × 1 + 3 = 8, and 8 divided by 8 leaves a remainder of 0, so next is 0."],
        ["מחולל משתמש בכלל: הבא = השארית של (5 × הנוכחי + 3) בחלוקה ב־8. הנוכחי הוא 1. מהו המספר הבא?", "", "5 × 1 + 3 = 8, ו־8 בחלוקה ב־8 משאיר שארית 0, ולכן המספר הבא הוא 0."]],
      [120, ["How many different orders can 5 cards be shuffled into?", "", "There are 5 choices for the first place, 4 for the second, and so on: 5 × 4 × 3 × 2 × 1 = 120."],
        ["בכמה סדרים שונים אפשר לסדר 5 קלפים?", "", "יש 5 אפשרויות למקום הראשון, 4 למקום השני וכן הלאה: 5 × 4 × 3 × 2 × 1 = 120."]],
      [8, ["A generator keeps only the remainder after dividing by 8. At most how many different numbers can it make before it must repeat?", "", "Remainders after dividing by 8 can only be 0 to 7, which is 8 values, so the period is at most 8."],
        ["מחולל שומר רק את השארית של חלוקה ב־8. לכל היותר כמה מספרים שונים הוא יכול לייצר לפני שהוא חייב לחזור על עצמו?", "", "השאריות בחלוקה ב־8 יכולות להיות רק 0 עד 7, כלומר 8 ערכים, ולכן המחזור הוא לכל היותר 8."]],
    ],
  },
};
export default c;
