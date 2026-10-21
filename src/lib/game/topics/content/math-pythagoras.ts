import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Right triangle", "a triangle with one angle of exactly 90°", "משולש ישר־זווית", "משולש שאחת הזוויות שלו היא בדיוק 90°"],
      ["Hypotenuse", "the longest side of a right triangle, opposite the right angle", "יתר", "הצלע הארוכה ביותר במשולש ישר־זווית, שמול הזווית הישרה"],
      ["Legs", "the two shorter sides of a right triangle, which form the right angle", "ניצבים", "שתי הצלעות הקצרות במשולש ישר־זווית, שיוצרות את הזווית הישרה"],
      ["Square number", "the result of multiplying a whole number by itself, like 9 = 3 × 3", "מספר ריבועי", "התוצאה של כפל מספר שלם בעצמו, כמו 9 = 3 × 3"],
    ],
    q: [
      [["What is 5²?", "25", ["10", "7", "52"], "5² means 5 × 5 = 25. It is not 5 × 2 = 10, and it is not the number 52."],
        ["כמה זה 5²?", "25", ["10", "7", "52"], "5² פירושו 5 × 5 = 25. זה לא 5 × 2 = 10, וזה גם לא המספר 52."]],
      [["In a right triangle, which side is always the longest?", "The hypotenuse", ["Either leg", "The base", "They are all equal"], "The side opposite the right angle (the biggest angle) is always the longest."],
        ["במשולש ישר־זווית, איזו צלע תמיד הכי ארוכה?", "היתר", ["אחד הניצבים", "הבסיס", "כולן שוות"], "הצלע שמול הזווית הישרה (הזווית הגדולה ביותר) היא תמיד הארוכה ביותר."]],
      [["What is 3² + 4²?", "25", ["49", "14", "7"], "3² = 9 and 4² = 16, so 3² + 4² = 9 + 16 = 25. Squaring the sum, (3 + 4)² = 49, is a different calculation.", "Square each number first, then add."],
        ["כמה זה 3² + 4²?", "25", ["49", "14", "7"], "3² = 9 ו־4² = 16, ולכן 3² + 4² = 9 + 16 = 25. העלאת הסכום בריבוע, (3 + 4)² = 49, היא חישוב אחר.", "מעלים כל מספר בריבוע קודם, ואחר כך מחברים."]],
      [["Which triangle is a right triangle?", "A triangle with angles of 90°, 45° and 45°", ["A triangle with angles of 60°, 60° and 60°", "A triangle with angles of 100°, 40° and 40°", "A triangle with angles of 70°, 70° and 40°"], "A right triangle has one angle of exactly 90°. None of the other triangles has a 90° angle: their biggest angles are 60°, 100° and 70°."],
        ["איזה משולש הוא משולש ישר־זווית?", "משולש עם זוויות של 90°, 45° ו־45°", ["משולש עם זוויות של 60°, 60° ו־60°", "משולש עם זוויות של 100°, 40° ו־40°", "משולש עם זוויות של 70°, 70° ו־40°"], "במשולש ישר־זווית יש זווית אחת של בדיוק 90°. באף אחד מהמשולשים האחרים אין זווית של 90°: הזוויות הגדולות ביותר בהם הן 60°, 100° ו־70°."]],
    ],
    n: [
      [7, ["What is the square root of 49?", "", "7 × 7 = 49, so √49 = 7. A square root asks which number multiplied by itself gives 49."], ["מהו השורש הריבועי של 49?", "", "7 × 7 = 49, ולכן √49 = 7. שורש ריבועי שואל איזה מספר כפול עצמו נותן 49."]],
      [144, ["What is the square of 12?", "", "The square of 12 is 12 × 12 = 144, so 12² = 144."], ["מהו הריבוע של 12?", "", "הריבוע של 12 הוא 12 × 12 = 144, כלומר 12² = 144."]],
    ],
  },
  i: {
    t: [
      ["Pythagorean theorem", "in a right triangle a² + b² = c², where c is the hypotenuse", "משפט פיתגורס", "במשולש ישר־זווית a² + b² = c², כאשר c הוא היתר"],
      ["Square root", "the number that, multiplied by itself, gives the original number", "שורש ריבועי", "המספר שאם כופלים אותו בעצמו מקבלים את המספר המקורי"],
      ["Pythagorean triple", "three whole numbers that fit a² + b² = c², like 3, 4, 5", "שלשה פיתגורית", "שלושה מספרים שלמים שמקיימים a² + b² = c², כמו 3, 4, 5"],
      ["Diagonal", "a line joining two opposite corners of a shape", "אלכסון", "קו שמחבר שני קודקודים נגדיים של צורה"],
    ],
    q: [
      [["A right triangle has legs 6 and 8. How long is the hypotenuse?", "10", ["14", "12", "48"], "6² + 8² = 36 + 64 = 100, and √100 = 10. Do not forget the last step, the square root."],
        ["במשולש ישר־זווית הניצבים הם 6 ו־8. מה אורך היתר?", "10", ["14", "12", "48"], "6² + 8² = 36 + 64 = 100, ו־√100 = 10. אל תשכחו את הצעד האחרון, השורש הריבועי."]],
      [["Which set of side lengths makes a right triangle?", "5, 12, 13", ["5, 12, 14", "10, 11, 12", "6, 7, 8"], "5² + 12² = 25 + 144 = 169 = 13². Sets that only look close do not work: with 5, 12, 14 the sum 169 would have to equal 196."],
        ["אילו אורכי צלעות יוצרים משולש ישר־זווית?", "5, 12, 13", ["5, 12, 14", "10, 11, 12", "6, 7, 8"], "5² + 12² = 25 + 144 = 169 = 13². שלשות שרק נראות קרובות לא עובדות: ב־5, 12, 14 הסכום 169 היה צריך להיות שווה ל־196."]],
      [["A 5 m ladder leans against a wall, with its foot 3 m from the wall. How high up the wall does it reach?", "4 m", ["2 m", "8 m", "√34 m, about 5.8 m"], "The ladder is the hypotenuse, so the height is a leg: 5² − 3² = 25 − 9 = 16, and √16 = 4 m. Adding 3² + 5² would wrongly treat the ladder as a leg.", "Which side of the triangle is the ladder?"],
        ["סולם באורך 5 מ׳ נשען על קיר, ורגלו מרוחקת 3 מ׳ מהקיר. לאיזה גובה על הקיר הוא מגיע?", "4 מ׳", ["2 מ׳", "8 מ׳", "√34 מ׳, בערך 5.8 מ׳"], "הסולם הוא היתר, ולכן הגובה הוא ניצב: 5² − 3² = 25 − 9 = 16, ו־√16 = 4 מ׳. חיבור 3² + 5² היה מתייחס בטעות לסולם כאל ניצב.", "איזו צלע במשולש היא הסולם?"]],
      [["Which equation is correct for a right triangle with legs a and b and hypotenuse c?", "a² + b² = c²", ["a + b = c", "a² + c² = b²", "(a + b)² = c²"], "The squares of the two legs add up to the square of the hypotenuse. Adding the sides themselves, a + b = c, never works: in a 3, 4, 5 triangle 3 + 4 is 7, not 5."],
        ["איזו משוואה נכונה למשולש ישר־זווית עם ניצבים a ו־b ויתר c?", "a² + b² = c²", ["a + b = c", "a² + c² = b²", "(a + b)² = c²"], "ריבועי שני הניצבים מסתכמים בריבוע היתר. חיבור הצלעות עצמן, a + b = c, אף פעם לא עובד: במשולש 3, 4, 5 הסכום 3 + 4 הוא 7 ולא 5."]],
    ],
    n: [
      [12, ["A right triangle has hypotenuse 13 and one leg 5. How long is the other leg?", "", "13² − 5² = 169 − 25 = 144, and √144 = 12. When the hypotenuse is known, the squares are subtracted."], ["במשולש ישר־זווית היתר 13 וניצב אחד 5. מה אורך הניצב השני?", "", "13² − 5² = 169 − 25 = 144, ו־√144 = 12. כשהיתר ידוע, מחסרים את הריבועים."]],
      [20, ["A rectangle is 16 cm wide and 12 cm high. How long is its diagonal?", "cm", "The diagonal is the hypotenuse of a right triangle with legs 16 and 12: 16² + 12² = 256 + 144 = 400, and √400 = 20 cm."], ["מלבן ברוחב 16 ס״מ ובגובה 12 ס״מ. מה אורך האלכסון שלו?", "ס״מ", "האלכסון הוא היתר של משולש ישר־זווית עם ניצבים 16 ו־12: 16² + 12² = 256 + 144 = 400, ו־√400 = 20 ס״מ."]],
    ],
    s: [[["Finding the hypotenuse of a right triangle with legs 3 and 4, in order", "Square each leg: 3² = 9 and 4² = 16", "Add the two squares: 9 + 16 = 25", "Take the square root of the sum: √25", "Write the answer: the hypotenuse is 5"],
      ["מוצאים את היתר במשולש ישר־זווית עם ניצבים 3 ו־4, לפי הסדר", "מעלים כל ניצב בריבוע: 3² = 9 ו־4² = 16", "מחברים את שני הריבועים: 9 + 16 = 25", "לוקחים שורש ריבועי של הסכום: √25", "כותבים את התשובה: היתר הוא 5"]]],
  },
  a: {
    t: [
      ["Converse of Pythagoras", "if a² + b² = c² for the sides of a triangle, then it has a right angle", "המשפט ההפוך לפיתגורס", "אם בצלעות של משולש מתקיים a² + b² = c², אז יש בו זווית ישרה"],
      ["Distance formula", "the distance between two points: √((x₂ − x₁)² + (y₂ − y₁)²)", "נוסחת המרחק", "המרחק בין שתי נקודות: √((x₂ − x₁)² + (y₂ − y₁)²)"],
      ["Irrational number", "a number that cannot be written as a fraction of two whole numbers, like √2", "מספר אי־רציונלי", "מספר שאי אפשר לכתוב כשבר של שני מספרים שלמים, כמו √2"],
      ["Space diagonal", "the line through the inside of a box from one corner to the opposite corner", "אלכסון מרחבי", "הקו שעובר בתוך תיבה מקודקוד אחד לקודקוד הנגדי"],
    ],
    q: [
      [["What is the distance between the points (1, 2) and (4, 6)?", "5", ["7", "25", "3"], "Differences 3 and 4: √(3² + 4²) = √25 = 5. The distance is the hypotenuse of a right triangle with those legs."],
        ["מה המרחק בין הנקודות (1, 2) ו־(4, 6)?", "5", ["7", "25", "3"], "ההפרשים הם 3 ו־4: √(3² + 4²) = √25 = 5. המרחק הוא היתר של משולש ישר־זווית עם הניצבים האלה."]],
      [["A square has sides of 1 m. How long is its diagonal?", "√2 m, about 1.41 m", ["2 m, because 1 + 1 = 2", "1 m, the same as a side", "1.5 m exactly"], "1² + 1² = 2, so the diagonal is √2 ≈ 1.414 m. Adding the sides, 1 + 1 = 2, forgets to take the square root."],
        ["לריבוע צלע של 1 מ׳. מה אורך האלכסון שלו?", "√2 מ׳, בערך 1.41 מ׳", ["2 מ׳, כי מחברים 1 + 1 = 2", "1 מ׳, כמו הצלע", "1.5 מ׳ בדיוק"], "1² + 1² = 2, ולכן האלכסון הוא √2 ≈ 1.414 מ׳. חיבור הצלעות, 1 + 1 = 2, שוכח לקחת שורש ריבועי."]],
      [["A box is 3 × 4 × 12. How long is its space diagonal?", "13", ["19", "12", "15"], "Base diagonal √(9 + 16) = 5; then √(5² + 12²) = √169 = 13."],
        ["לתיבה ממדים 3 × 4 × 12. מה אורך האלכסון המרחבי?", "13", ["19", "12", "15"], "אלכסון הבסיס √(9 + 16) = 5; ואז √(5² + 12²) = √169 = 13."]],
      [["Does a triangle with sides 8, 15 and 17 have a right angle?", "Yes, because 8² + 15² = 289 = 17²", ["No, because 8 + 15 = 23, which is not 17", "No, because the three sides are all different lengths", "No, because a right triangle must have two equal sides"], "The longest side is 17 and 8² + 15² = 64 + 225 = 289 = 17², so the converse of Pythagoras gives a right angle. The sides do not have to be equal."],
        ["האם במשולש עם צלעות 8, 15 ו־17 יש זווית ישרה?", "כן, כי 8² + 15² = 289 = 17²", ["לא, כי 8 + 15 = 23 ולא 17", "לא, כי שלוש הצלעות שונות באורכן", "לא, כי במשולש ישר־זווית חייבות להיות שתי צלעות שוות"], "הצלע הארוכה ביותר היא 17 ו־8² + 15² = 64 + 225 = 289 = 17², ולכן לפי המשפט ההפוך לפיתגורס יש זווית ישרה. אין צורך שהצלעות יהיו שוות."]],
      [["Which of these numbers is irrational?", "√2", ["√9", "0.25", "22/7"], "√2 cannot be written as a fraction of two whole numbers. √9 = 3, 0.25 = 1/4 and 22/7 are all fractions. (22/7 is only a close estimate of π, which is irrational.)"],
        ["איזה מהמספרים האלה אי־רציונלי?", "√2", ["√9", "0.25", "22/7"], "את √2 אי אפשר לכתוב כשבר של שני מספרים שלמים. √9 = 3, 0.25 = 1/4 ו־22/7 הם כולם שברים. (22/7 הוא רק קירוב קרוב של π, שהוא אי־רציונלי.)"]],
      [["What is the distance between the points (−2, 1) and (4, 9)?", "10", ["14", "100", "√68"], "The differences are 4 − (−2) = 6 and 9 − 1 = 8, so the distance is √(6² + 8²) = √100 = 10. Using 4 − 2 for the first difference ignores the minus sign.", "What is 4 minus −2?"],
        ["מה המרחק בין הנקודות (−2, 1) ו־(4, 9)?", "10", ["14", "100", "√68"], "ההפרשים הם 4 − (−2) = 6 ו־9 − 1 = 8, ולכן המרחק הוא √(6² + 8²) = √100 = 10. אם מחשבים 4 − 2 בהפרש הראשון, מתעלמים מסימן המינוס.", "כמה זה 4 פחות מינוס 2?"]],
    ],
    n: [
      [7, ["A box measures 2 × 3 × 6. How long is its space diagonal?", "", "The space diagonal is √(2² + 3² + 6²) = √(4 + 9 + 36) = √49 = 7."], ["לתיבה ממדים 2 × 3 × 6. מה אורך האלכסון המרחבי שלה?", "", "האלכסון המרחבי הוא √(2² + 3² + 6²) = √(4 + 9 + 36) = √49 = 7."]],
      [30, ["What is the area of a right triangle with hypotenuse 13 and one leg 5?", "", "The other leg is √(13² − 5²) = √144 = 12. The area is half of leg times leg: 5 × 12 ÷ 2 = 30."], ["מה שטח משולש ישר־זווית שהיתר שלו 13 ואחד הניצבים שלו 5?", "", "הניצב השני הוא √(13² − 5²) = √144 = 12. השטח הוא חצי מכפל הניצבים: 5 × 12 ÷ 2 = 30."]],
    ],
    s: [[["Checking whether a triangle with sides 7, 24 and 25 has a right angle, in order", "Find the longest side, which would be the hypotenuse: 25", "Square the two shorter sides and add them: 49 + 576 = 625", "Square the longest side: 25² = 625", "Compare: the two results are equal, so the triangle has a right angle"],
      ["בודקים אם במשולש עם צלעות 7, 24 ו־25 יש זווית ישרה, לפי הסדר", "מוצאים את הצלע הארוכה ביותר, שהייתה היתר: 25", "מעלים בריבוע את שתי הצלעות הקצרות ומחברים: 49 + 576 = 625", "מעלים בריבוע את הצלע הארוכה ביותר: 25² = 625", "משווים: שתי התוצאות שוות, ולכן במשולש יש זווית ישרה"]]],
  },
};
export default c;
