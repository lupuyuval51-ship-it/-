import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Vector", "a quantity that has both a size and a direction, drawn as an arrow", "וקטור", "גודל שיש לו גם ערך מספרי וגם כיוון, ומסמנים אותו בחץ"],
      ["Scalar", "a quantity that has a size only and no direction, like mass or temperature", "סקלר", "גודל שיש לו רק ערך מספרי בלי כיוון, כמו מסה או טמפרטורה"],
      ["Components", "the parts of a vector along the x-axis and along the y-axis, written (x, y)", "רכיבים", "החלקים של וקטור לאורך ציר x ולאורך ציר y: שני מספרים שכותבים בסוגריים, בזה אחר זה"],
      ["Zero vector", "the vector (0, 0), with length 0 and no direction", "וקטור האפס", "הוקטור שכל הרכיבים שלו אפס, שאורכו 0 ואין לו כיוון"],
    ],
    q: [
      [["Which of these is a vector?", "A wind of 20 km/h from the west", ["A car speedometer showing 20 km/h", "A bag of flour with a mass of 2 kg", "A room temperature of 20 °C"], "The wind is described by a size, 20 km/h, and a direction, from the west, so it is a vector. A speed alone, a mass and a temperature have only a size: they are scalars."],
        ["איזה מהבאים הוא וקטור?", "רוח של 20 קמ״ש ממערב", ["מד מהירות של מכונית שמראה 20 קמ״ש", "שקית קמח שהמסה שלה 2 ק״ג", "טמפרטורה של 20 מעלות בחדר"], "את הרוח מתארים בגודל, 20 קמ״ש, ובכיוון, ממערב, ולכן היא וקטור. למהירות בלבד, למסה ולטמפרטורה יש רק גודל: הם סקלרים."]],
      [["A vector goes from the point (1, 2) to the point (4, 6). What are its components?", "(3, 4)", ["(−3, −4)", "(5, 8)", "(4, 6)"], "Subtract the start from the end: (4 − 1, 6 − 2) = (3, 4), that is 3 steps right and 4 steps up. (5, 8) adds the points instead of subtracting them."],
        ["וקטור יוצא מנקודה ששיעוריה 1 ו־2 ומגיע לנקודה ששיעוריה 4 ו־6. מהם הרכיבים שלו?", "(3, 4)", ["(−3, −4)", "(5, 8)", "(4, 6)"], "מחסרים את נקודת ההתחלה מנקודת הסוף: 4 − 1 = 3 ו־6 − 2 = 4, כלומר 3 צעדים ימינה ו־4 צעדים למעלה. התשובה שרכיביה 5 ו־8 מחברת את הנקודות במקום לחסר אותן."]],
      [["What is (2, 5) + (3, −1)?", "(5, 4)", ["(5, 6)", "(−1, 6)", "(6, −5)"], "Add the matching components: 2 + 3 = 5 and 5 + (−1) = 4, so the sum is (5, 4)."],
        ["לוקטור u הרכיבים 2 ו־5, ולוקטור v הרכיבים 3 ומינוס 1. מהו u + v?", "(5, 4)", ["(5, 6)", "(−1, 6)", "(6, −5)"], "מחברים כל רכיב עם הרכיב המתאים לו: 2 + 3 = 5 ו־5 + (−1) = 4, ולכן הרכיבים של הסכום הם 5 ו־4."]],
      [["What is 3 × (2, −1)?", "(6, −3)", ["(6, −1)", "(5, 2)", "(2, −3)"], "Multiplying by a number multiplies every component: (3 × 2, 3 × (−1)) = (6, −3). The new vector points the same way and is 3 times as long."],
        ["לוקטור v הרכיבים 2 ומינוס 1. מהו 3v?", "(6, −3)", ["(6, −1)", "(5, 2)", "(2, −3)"], "כפל במספר כופל כל רכיב: 3 × 2 = 6 ו־3 × (−1) = −3. הוקטור החדש מצביע לאותו כיוון וארוך פי 3."]],
      [["How long is the vector (3, 4)?", "5", ["7", "25", "12"], "By Pythagoras the length is √(3² + 4²) = √(9 + 16) = √25 = 5. 7 is 3 + 4, the walk along the grid lines, not the straight arrow."],
        ["מה האורך של וקטור שרכיביו 3 ו־4?", "5", ["7", "25", "12"], "לפי משפט פיתגורס האורך הוא √(3² + 4²) = √(9 + 16) = √25 = 5. המספר 7 הוא 3 + 4, ההליכה לאורך קווי המשבצות, ולא החץ הישר."]],
      [["What is the opposite of the vector (4, −2)?", "(−4, 2)", ["(4, 2)", "(−4, −2)", "(2, −4)"], "The opposite vector has the same length and points the other way, so every component changes sign: (−4, 2). Adding it to (4, −2) gives the zero vector."],
        ["מהו הוקטור הנגדי לוקטור שרכיביו 4 ומינוס 2?", "(−4, 2)", ["(4, 2)", "(−4, −2)", "(2, −4)"], "לוקטור הנגדי יש אותו אורך והוא מצביע לכיוון ההפוך, ולכן כל רכיב מחליף סימן. אם מחברים אותו לוקטור המקורי מקבלים את וקטור האפס."]],
    ],
    n: [
      [7, ["A vector goes from A(2, 3) to B(x, 9) and equals (5, 6). What is x?", "", "The x-component is x − 2 = 5, so x = 7. Check the y-component: 9 − 3 = 6."],
        ["וקטור יוצא מנקודה A ששיעוריה 2 ו־3 ומגיע לנקודה B ששיעוריה x ו־9. הרכיבים של הוקטור הם 5 ו־6. מהו x?", "", "הרכיב בכיוון x הוא x − 2 = 5, ולכן x = 7. בדיקה של הרכיב בכיוון y: גם 9 − 3 = 6."]],
    ],
  },
  i: {
    t: [
      ["Magnitude", "the length of a vector; for (x, y) it is √(x² + y²)", "גודל של וקטור", "האורך של החץ; עבור וקטור שרכיביו x ו־y הוא √(x² + y²)"],
      ["Resultant", "the single vector that has the same effect as several vectors together: their sum", "וקטור שקול", "הוקטור היחיד שפועל כמו כמה וקטורים יחד: הסכום שלהם"],
      ["Parallel vectors", "vectors that point the same way or exactly opposite ways, so that one is a number times the other", "וקטורים מקבילים", "וקטורים שמצביעים לאותו כיוון או לכיוון ההפוך בדיוק, כך שאחד מהם הוא מספר כפול השני"],
      ["Unit vector", "a vector of length 1, used to show a direction", "וקטור יחידה", "וקטור שאורכו 1, ומשמש לציון כיוון"],
    ],
    q: [
      [["Which vector is parallel to (2, −3)?", "(−4, 6)", ["(4, 6)", "(3, −2)", "(2, 3)"], "(−4, 6) is −2 times (2, −3), so the two lie along parallel lines, pointing opposite ways. For (4, 6) no single number works: 2 turns 2 into 4, but −2 is needed to turn −3 into 6."],
        ["איזה וקטור מקביל לוקטור שרכיביו 2 ומינוס 3?", "(−4, 6)", ["(4, 6)", "(3, −2)", "(2, 3)"], "הוקטור שרכיביו מינוס 4 ו־6 שווה למינוס 2 כפול הוקטור הנתון, ולכן שניהם על ישרים מקבילים ומצביעים לכיוונים הפוכים. עבור הוקטור שרכיביו 4 ו־6 אין מספר אחד שמתאים: כפל ב־2 הופך את 2 ל־4, אבל כדי להפוך את מינוס 3 ל־6 צריך לכפול במינוס 2."]],
      [["A boat heads east at 4 m/s while the river carries it north at 3 m/s. What is its actual speed?", "5 m/s", ["7 m/s", "1 m/s", "12 m/s"], "The velocities add as vectors: (4, 3). Its length is √(4² + 3²) = √25 = 5 m/s. 7 m/s would be right only if both pushed in the same direction."],
        ["סירה שטה מזרחה במהירות 4 מ׳/ש׳, והנהר סוחף אותה צפונה במהירות 3 מ׳/ש׳. מהי המהירות האמיתית שלה?", "5 מ׳/ש׳", ["7 מ׳/ש׳", "1 מ׳/ש׳", "12 מ׳/ש׳"], "המהירויות מתחברות כוקטורים: הרכיב המזרחי 4 והרכיב הצפוני 3. האורך של הסכום הוא √(4² + 3²) = √25 = 5 מ׳/ש׳. התשובה 7 מ׳/ש׳ הייתה נכונה רק אם שתי המהירויות היו באותו כיוון."]],
      [["For the points A(1, 1), B(4, 5) and C(7, 9), the vectors AB and BC are equal. What does that tell you?", "A, B and C lie on one line, with B exactly in the middle", ["The three points form an equilateral triangle with sides of 5", "A and C are the same point", "The vector AC is the zero vector"], "AB = (3, 4) and BC = (3, 4): from B you go on in the same direction for the same distance. So the points lie on one straight line and B is the midpoint of AC."],
        ["בנקודות A, B ו־C ההליכה מ־A אל B היא 3 צעדים ימינה ו־4 צעדים למעלה, וההליכה מ־B אל C היא בדיוק אותו צעד. מה זה אומר על הנקודות?", "A, B ו־C נמצאות על ישר אחד, ו־B בדיוק באמצע", ["שלוש הנקודות יוצרות משולש שווה צלעות שאורך כל צלע בו 5", "A ו־C הן אותה נקודה", "הוקטור AC הוא וקטור האפס"], "הוקטורים AB ו־BC שווים: מ־B ממשיכים באותו כיוון ובאותו מרחק. לכן הנקודות נמצאות על ישר אחד, ו־B היא אמצע הקטע AC."]],
      [["What is the unit vector in the direction of (6, 8)?", "(0.6, 0.8)", ["(3, 4)", "(6/14, 8/14)", "(1, 1)"], "The length of (6, 8) is √(36 + 64) = 10. Dividing each component by 10 gives (0.6, 0.8), whose length is √(0.36 + 0.64) = 1."],
        ["מהו וקטור היחידה בכיוון של וקטור שרכיביו 6 ו־8?", "(0.6, 0.8)", ["(3, 4)", "(6/14, 8/14)", "(1, 1)"], "האורך של הוקטור הוא √(36 + 64) = 10. מחלקים כל רכיב ב־10 ומקבלים רכיבים 0.6 ו־0.8, ואורכו √(0.36 + 0.64) = 1."]],
      [["u = (1, 2) and v = (3, −1). What is 2u − v?", "(−1, 5)", ["(−1, 3)", "(5, 3)", "(−2, 3)"], "2u = (2, 4), and subtracting v = (3, −1) gives (2 − 3, 4 − (−1)) = (−1, 5). Subtracting −1 means adding 1, which is where (−1, 3) goes wrong."],
        ["לוקטור u הרכיבים 1 ו־2, ולוקטור v הרכיבים 3 ומינוס 1. מהו 2u − v?", "(−1, 5)", ["(−1, 3)", "(5, 3)", "(−2, 3)"], "הרכיבים של 2u הם 2 ו־4. כשמחסרים את v מקבלים 2 − 3 = −1 ו־4 − (−1) = 5. חיסור של −1 הוא חיבור של 1, ושם טועים מי שמקבלים 3 ברכיב השני."]],
    ],
    n: [
      [500, ["A plane flies 300 km east and then 400 km north. How far is it from where it started?", "km", "The displacement is the vector (300, 400), and its length is √(300² + 400²) = √250000 = 500 km."],
        ["מטוס טס 300 ק״מ מזרחה ואחר כך 400 ק״מ צפונה. כמה רחוק הוא מנקודת ההתחלה?", "ק״מ", "ההעתק הוא וקטור שרכיביו 300 ו־400, והאורך שלו הוא √(300² + 400²) = √250000 = 500 ק״מ."]],
      [5, ["The vector (k, 12) has length 13, and k is positive. What is k?", "", "k² + 12² = 13², so k² = 169 − 144 = 25 and k = 5."],
        ["לוקטור שהרכיב הראשון שלו k והשני 12 יש אורך 13, ו־k חיובי. מהו k?", "", "k² + 12² = 13², ולכן k² = 169 − 144 = 25 ו־k = 5."]],
    ],
    s: [[["Adding two vectors by drawing them, in order", "Draw the first vector from the starting point", "Draw the second vector starting at the tip of the first", "Draw an arrow from the start of the first vector to the tip of the second", "That arrow is the sum: measure its length and direction"],
      ["חיבור של שני וקטורים בשרטוט, לפי הסדר", "משרטטים את הוקטור הראשון מנקודת ההתחלה", "משרטטים את הוקטור השני כך שיתחיל בקצה של הראשון", "משרטטים חץ מתחילת הוקטור הראשון אל הקצה של השני", "החץ הזה הוא הסכום: מודדים את האורך ואת הכיוון שלו"]]],
  },
  a: {
    t: [
      ["Position vector", "the vector from the origin to a point; for P(3, −2) it is (3, −2)", "וקטור מיקום", "הוקטור מראשית הצירים אל נקודה; השיעורים של הנקודה הם הרכיבים שלו"],
      ["Dot product", "u·v = x₁x₂ + y₁y₂, a number that is 0 exactly when two nonzero vectors are perpendicular", "מכפלה סקלרית", "הנוסחה u·v = x₁x₂ + y₁y₂ נותנת מספר שהוא 0 בדיוק כששני וקטורים שאינם וקטור האפס מאונכים זה לזה"],
      ["Linear combination", "a sum of vectors, each multiplied by a number, like 2u − 3v", "צירוף ליניארי", "סכום של וקטורים שכל אחד מהם מוכפל במספר, כמו 2u − 3v"],
    ],
    q: [
      [["M is the midpoint of AB, with A(2, 7) and B(8, −1). What is the position vector of M?", "(5, 3)", ["(3, −4)", "(10, 6)", "(6, −8)"], "M = A + ½·AB = (2, 7) + ½·(6, −8) = (2, 7) + (3, −4) = (5, 3). (3, −4) is only half of the vector AB, not the point itself."],
        ["הנקודה A נמצאת 2 יחידות ימינה ו־7 יחידות מעל ראשית הצירים, והנקודה B נמצאת 8 יחידות ימינה ויחידה אחת מתחתיה. M היא אמצע הקטע AB. מהו וקטור המיקום של M?", "(5, 3)", ["(3, −4)", "(10, 6)", "(6, −8)"], "הוקטור AB הוא 6 ימינה ו־8 למטה, ו־M נמצאת באמצע הדרך: מ־A הולכים חצי מהוקטור AB, כלומר 3 ימינה ו־4 למטה. לכן M נמצאת 5 ימינה ו־3 מעל ראשית הצירים. הוקטור של 3 ימינה ו־4 למטה הוא רק חצי מ־AB, ולא הנקודה עצמה."]],
      [["Are u = (4, −2) and v = (1, 2) perpendicular?", "Yes, because 4 × 1 + (−2) × 2 = 0", ["No, because their lengths are different", "No, because 4 × 1 × (−2) × 2 = −16", "Yes, because neither of them is zero"], "Two vectors are perpendicular when their dot product is 0: 4 × 1 + (−2) × 2 = 4 − 4 = 0. Their lengths do not matter."],
        ["לוקטור u הרכיבים 4 ומינוס 2, ולוקטור v הרכיבים 1 ו־2. האם הם מאונכים זה לזה?", "כן, כי 4 × 1 + (−2) × 2 = 0", ["לא, כי האורכים שלהם שונים", "לא, כי 4 × 1 × (−2) × 2 = −16", "כן, כי אף אחד מהם אינו וקטור האפס"], "שני וקטורים מאונכים כשהמכפלה הסקלרית שלהם היא 0: 4 × 1 + (−2) × 2 = 4 − 4 = 0. האורכים שלהם לא משנים."]],
      [["In the parallelogram ABCD, AB = (5, 1) and AD = (2, 4). What is the diagonal AC?", "(7, 5)", ["(3, −3)", "(−3, 3)", "(10, 4)"], "From A to C you can walk along AB and then BC, and BC = AD in a parallelogram. So AC = (5, 1) + (2, 4) = (7, 5). (3, −3) is the other diagonal, from D to B."],
        ["במקבילית ABCD הוקטור AB הוא 5 ימינה ו־1 למעלה, והוקטור AD הוא 2 ימינה ו־4 למעלה. מהו האלכסון AC?", "(7, 5)", ["(3, −3)", "(−3, 3)", "(10, 4)"], "מ־A ל־C אפשר ללכת לאורך AB ואחר כך לאורך BC, ובמקבילית BC = AD. לכן AC הוא 5 + 2 = 7 ימינה ו־1 + 4 = 5 למעלה. האלכסון השני, מ־D אל B, הוא 3 ימינה ו־3 למטה."]],
      [["A river flows east at 1.5 m/s. A swimmer who swims at 2.5 m/s wants to cross straight to the opposite bank. What is her speed across the river?", "2 m/s", ["2.5 m/s", "4 m/s", "1 m/s"], "She must aim partly upstream so that 1.5 m/s of her own velocity cancels the river. Her 2.5 m/s then splits into 1.5 m/s against the current and √(2.5² − 1.5²) = √4 = 2 m/s straight across."],
        ["נהר זורם מזרחה במהירות 1.5 מ׳/ש׳. שחיינית ששוחה במהירות 2.5 מ׳/ש׳ רוצה לחצות ישר אל הגדה שממול. מהי המהירות שלה לרוחב הנהר?", "2 מ׳/ש׳", ["2.5 מ׳/ש׳", "4 מ׳/ש׳", "1 מ׳/ש׳"], "היא צריכה לכוון מעט נגד הזרם, כך ש־1.5 מ׳/ש׳ מהמהירות שלה יבטלו את הזרם. אז ה־2.5 מ׳/ש׳ שלה מתחלקים ל־1.5 מ׳/ש׳ נגד הזרם ול־√(2.5² − 1.5²) = √4 = 2 מ׳/ש׳ ישר לרוחב."]],
      [["u = (3, 1) and v = (1, 2). Which numbers a and b give au + bv = (7, 4)?", "a = 2, b = 1", ["a = 1, b = 2", "a = 3, b = −2", "a = 7, b = 4"], "Compare components: 3a + b = 7 and a + 2b = 4. Solving gives a = 2 and b = 1. Check: 2(3, 1) + (1, 2) = (6 + 1, 2 + 2) = (7, 4)."],
        ["לוקטור u הרכיבים 3 ו־1, ולוקטור v הרכיבים 1 ו־2. אילו מספרים a ו־b גורמים לכך ש־au + bv הוא וקטור שרכיביו 7 ו־4?", "a = 2, b = 1", ["a = 1, b = 2", "a = 3, b = −2", "a = 7, b = 4"], "משווים רכיבים: 3a + b = 7 ו־a + 2b = 4. הפתרון הוא a = 2 ו־b = 1. בדיקה: הרכיב הראשון הוא 2 × 3 + 1 = 7 והשני הוא 2 × 1 + 2 = 4."]],
      [["|u| = 3 and |v| = 4. What is the greatest possible length of u + v?", "7, when they point the same way", ["5, when they are perpendicular", "12, the product of the lengths", "1, when they point opposite ways"], "The length of a sum is never more than the sum of the lengths. It reaches 3 + 4 = 7 only when both vectors point the same way; opposite ways give the smallest length, 1."],
        ["אורך הוקטור u הוא 3 ואורך הוקטור v הוא 4. מהו האורך הגדול ביותר האפשרי של u + v?", "7, כשהם מצביעים לאותו כיוון", ["5, כשהם מאונכים", "12, מכפלת האורכים", "1, כשהם מצביעים לכיוונים הפוכים"], "האורך של סכום אף פעם לא גדול מסכום האורכים. הוא מגיע ל־3 + 4 = 7 רק כששני הוקטורים מצביעים לאותו כיוון; כיוונים הפוכים נותנים את האורך הקטן ביותר, 1."]],
    ],
    n: [
      [4, ["For which k is (2, k) parallel to (3, 6)?", "", "(3, 6) = 3 × (1, 2), so in every parallel vector the y-component is twice the x-component. For (2, k) that means k = 2 × 2 = 4."],
        ["עבור איזה k וקטור שרכיביו 2 ו־k מקביל לוקטור שרכיביו 3 ו־6?", "", "הוקטור שרכיביו 3 ו־6 הוא פי 3 מהוקטור שרכיביו 1 ו־2, ולכן בכל וקטור מקביל לו הרכיב בכיוון y הוא פי 2 מהרכיב בכיוון x. כש־x הוא 2, מקבלים k = 2 × 2 = 4."]],
      [5, ["u = (2, 3) and v = (4, −1). What is the dot product u·v?", "", "Multiply matching components and add: u·v = 2 × 4 + 3 × (−1) = 8 − 3 = 5."],
        ["לוקטור u הרכיבים 2 ו־3, ולוקטור v הרכיבים 4 ומינוס 1. מהי המכפלה הסקלרית של u ו־v?", "", "כופלים רכיבים מתאימים ומחברים: 2 × 4 + 3 × (−1) = 8 − 3 = 5."]],
    ],
  },
};
export default c;
