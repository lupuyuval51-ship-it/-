import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["System of equations", "two or more equations with the same unknowns that must all be true at the same time", "מערכת משוואות", "שתי משוואות או יותר עם אותם נעלמים, שכולן צריכות להתקיים באותו זמן"],
      ["Solution of a system", "the values of the unknowns that make every one of its equations true", "פתרון של מערכת", "ערכי הנעלמים שבהם כל המשוואות שלה נכונות"],
      ["Ordered pair", "two numbers written in a fixed order, such as (x, y) = (3, 1)", "זוג סדור", "שני מספרים שנכתבים בסדר קבוע, כמו (x, y) = (3, 1)"],
    ],
    q: [
      [["Which pair solves both x + y = 10 and x − y = 2?", "x = 6, y = 4", ["x = 4, y = 6", "x = 8, y = 2", "x = 5, y = 5"], "6 + 4 = 10 and 6 − 4 = 2, so both equations hold. x = 4, y = 6 fits the first equation, but 4 − 6 = −2, not 2."],
        ["איזה זוג פותר גם את x + y = 10 וגם את x − y = 2?", "x = 6, y = 4", ["x = 4, y = 6", "x = 8, y = 2", "x = 5, y = 5"], "6 + 4 = 10 ו־6 − 4 = 2, ולכן שתי המשוואות מתקיימות. הזוג x = 4, y = 6 מתאים למשוואה הראשונה, אבל 4 − 6 = −2 ולא 2."]],
      [["Is (2, 3) a solution of the system x + y = 5 and 2x + y = 8?", "No: it fits the first equation but not the second", ["Yes: it fits both of the equations", "Yes: it is enough that it fits the first equation", "No: it does not fit either of the equations"], "2 + 3 = 5, so the first equation holds, but 2 × 2 + 3 = 7, not 8. A solution of a system must make every one of its equations true."],
        ["האם (2, 3) הוא פתרון של המערכת x + y = 5 ו־2x + y = 8?", "לא: הוא מתאים למשוואה הראשונה ולא לשנייה", ["כן: הוא מתאים לשתי המשוואות", "כן: מספיק שהוא מתאים למשוואה הראשונה", "לא: הוא לא מתאים לאף אחת מהמשוואות"], "2 + 3 = 5, ולכן המשוואה הראשונה מתקיימת, אבל 2 × 2 + 3 = 7 ולא 8. פתרון של מערכת צריך לקיים את כל המשוואות שלה."]],
      [["Two numbers add up to 20, and one of them is 4 more than the other. What are they?", "8 and 12", ["10 and 10", "6 and 14", "4 and 16"], "If the smaller is x, then x + (x + 4) = 20, so 2x = 16 and x = 8. The numbers are 8 and 12: 8 + 12 = 20 and 12 − 8 = 4."],
        ["סכומם של שני מספרים הוא 20, ואחד מהם גדול מהשני ב־4. מהם המספרים?", "8 ו־12", ["10 ו־10", "6 ו־14", "4 ו־16"], "אם הקטן הוא x, אז x + (x + 4) = 20, ולכן 2x = 16 ו־x = 8. המספרים הם 8 ו־12: 8 + 12 = 20 ו־12 − 8 = 4."]],
      [["Why do you usually need two equations to find two unknowns?", "One equation alone is true for many different pairs", ["Each equation can only contain one letter", "Two equations are always easier to read", "The second equation is only there to check the spelling"], "x + y = 10 is true for (1, 9), (2, 8), (5, 5) and endless other pairs. A second equation picks out the one pair that fits both."],
        ["למה בדרך כלל צריך שתי משוואות כדי למצוא שני נעלמים?", "משוואה אחת לבדה מתקיימת עבור הרבה זוגות שונים", ["בכל משוואה יכולה להופיע רק אות אחת", "שתי משוואות תמיד קלות יותר לקריאה", "המשוואה השנייה נועדה רק לבדוק שאין שגיאות כתיב"], "המשוואה x + y = 10 מתקיימת עבור (1, 9), (2, 8), (5, 5) ועוד אינסוף זוגות. משוואה שנייה בוחרת מתוכם את הזוג היחיד שמתאים לשתיהן."]],
      [["In the system y = 3 and x + y = 10, what is x?", "7", ["13", "3", "10"], "Put y = 3 into the second equation: x + 3 = 10, so x = 10 − 3 = 7. The answer 13 comes from adding 3 instead of taking it away."],
        ["במערכת y = 3 ו־x + y = 10, מהו x?", "7", ["13", "3", "10"], "מציבים y = 3 במשוואה השנייה: x + 3 = 10, ולכן x = 10 − 3 = 7. התשובה 13 מתקבלת כשמוסיפים 3 במקום להחסיר אותו."]],
    ],
    n: [
      [4, ["y = 2x and x + y = 12. What is x?", "", "Replace y with 2x: x + 2x = 12, so 3x = 12 and x = 4, and then y = 8."],
        ["y = 2x ו־x + y = 12. מהו x?", "", "מציבים 2x במקום y: x + 2x = 12, ולכן 3x = 12 ו־x = 4, ואז y = 8."]],
      [9, ["a + b = 15 and a − b = 3. What is a?", "", "Adding the two equations cancels b: 2a = 18, so a = 9 and b = 6. Check: 9 + 6 = 15 and 9 − 6 = 3."],
        ["a + b = 15 ו־a − b = 3. מהו a?", "", "חיבור שתי המשוואות מבטל את b: 2a = 18, ולכן a = 9 ו־b = 6. בדיקה: 9 + 6 = 15 ו־9 − 6 = 3."]],
    ],
    s: [
      [["Checking whether a pair of values solves a system", "Put the two values into the first equation", "Check that both sides of the first equation are equal", "Put the same two values into the second equation", "Check that both sides of the second equation are equal", "Only if both checks work, the pair is a solution of the system"],
        ["בדיקה אם זוג ערכים פותר מערכת משוואות", "מציבים את שני הערכים במשוואה הראשונה", "בודקים ששני אגפי המשוואה הראשונה שווים", "מציבים את אותם שני ערכים במשוואה השנייה", "בודקים ששני אגפי המשוואה השנייה שווים", "רק אם שתי הבדיקות מצליחות, הזוג הוא פתרון של המערכת"]],
    ],
  },
  i: {
    t: [
      ["Substitution method", "solving one equation for one unknown and putting that expression into the other equation", "שיטת ההצבה", "בידוד של נעלם אחד במשוואה אחת והכנסת הביטוי שהתקבל למשוואה השנייה"],
      ["Elimination method", "adding or subtracting the equations, after multiplying if needed, so that one unknown cancels out", "שיטת השוואת המקדמים", "חיבור או חיסור של המשוואות, אחרי כפל אם צריך, כך שאחד הנעלמים מתבטל"],
      ["Coefficient", "the number that multiplies an unknown, like 3 in 3x", "מקדם", "המספר שכופל נעלם, כמו 3 בביטוי 3x"],
    ],
    q: [
      [["Solve: x + y = 11 and x − y = 5.", "x = 8, y = 3", ["x = 3, y = 8", "x = 6, y = 5", "x = 16, y = 6"], "Adding the equations gives 2x = 16, so x = 8, and then 8 + y = 11 gives y = 3. Check: 8 − 3 = 5."],
        ["פתרו: x + y = 11 ו־x − y = 5.", "x = 8, y = 3", ["x = 3, y = 8", "x = 6, y = 5", "x = 16, y = 6"], "חיבור המשוואות נותן 2x = 16, ולכן x = 8, ואז 8 + y = 11 נותן y = 3. בדיקה: 8 − 3 = 5."]],
      [["Solve by substitution: y = x + 1 and 2x + y = 10.", "x = 3, y = 4", ["x = 4, y = 5", "x = 3, y = 3", "x = 9, y = 10"], "Put x + 1 in place of y: 2x + x + 1 = 10, so 3x = 9 and x = 3. Then y = 3 + 1 = 4. Check: 2 × 3 + 4 = 10."],
        ["פתרו בשיטת ההצבה: y = x + 1 ו־2x + y = 10.", "x = 3, y = 4", ["x = 4, y = 5", "x = 3, y = 3", "x = 9, y = 10"], "מציבים x + 1 במקום y: 2x + x + 1 = 10, ולכן 3x = 9 ו־x = 3. אז y = 3 + 1 = 4. בדיקה: 2 × 3 + 4 = 10."]],
      [["In the system 3x + 2y = 16 and 5x − 2y = 8, what is the quickest first step?", "Add the two equations, so the y terms cancel", ["Subtract the equations, so the y terms cancel", "Multiply both of the equations by 2", "Divide the first equation by 16"], "+2y and −2y add up to 0, so adding gives 8x = 24 and x = 3. Subtracting would give −2x + 4y = 8, which still has both unknowns."],
        ["במערכת 3x + 2y = 16 ו־5x − 2y = 8, מהו הצעד הראשון המהיר ביותר?", "לחבר את שתי המשוואות, כך שהאיברים עם y יתבטלו", ["לחסר את המשוואות, כך שהאיברים עם y יתבטלו", "לכפול את שתי המשוואות ב־2", "לחלק את המשוואה הראשונה ב־16"], "+2y ו־−2y מתבטלים בחיבור, ולכן החיבור נותן 8x = 24 ו־x = 3. החיסור היה נותן −2x + 4y = 8, ושני הנעלמים עדיין היו בו."]],
      [["To eliminate x from 2x + 3y = 13 and x + 5y = 17, what can you do?", "Multiply the second equation by 2, then subtract", ["Multiply the first equation by 2, and then subtract", "Add the two equations just as they are", "Multiply the second equation by 5, then add"], "Doubling the second equation gives 2x + 10y = 34; subtracting 2x + 3y = 13 leaves 7y = 21, so y = 3 and x = 2."],
        ["כדי לבטל את x במערכת 2x + 3y = 13 ו־x + 5y = 17, מה אפשר לעשות?", "לכפול את המשוואה השנייה ב־2 ואז לחסר", ["לכפול את המשוואה הראשונה ב־2 ואחר כך לחסר", "לחבר את שתי המשוואות כמו שהן", "לכפול את המשוואה השנייה ב־5 ואז לחבר"], "הכפלת המשוואה השנייה ב־2 נותנת 2x + 10y = 34; חיסור של 2x + 3y = 13 משאיר 7y = 21, ולכן y = 3 ו־x = 2."]],
      [["A farmyard has chickens and goats: 10 heads and 28 legs in all. How many goats are there?", "4", ["6", "7", "14"], "With c chickens and g goats: c + g = 10 and 2c + 4g = 28. Doubling the first gives 2c + 2g = 20; subtracting leaves 2g = 8, so g = 4, and there are 6 chickens."],
        ["בחצר יש תרנגולות ועזים: 10 ראשים ו־28 רגליים בסך הכול. כמה עזים יש בחצר?", "4", ["6", "7", "14"], "אם יש c תרנגולות ו־g עזים: c + g = 10 ו־2c + 4g = 28. הכפלת הראשונה ב־2 נותנת 2c + 2g = 20; החיסור משאיר 2g = 8, ולכן g = 4, ויש 6 תרנגולות."]],
    ],
    n: [
      [30, ["3 adult tickets and 2 child tickets cost 120 shekels; 1 adult ticket and 2 child tickets cost 60 shekels. What does one adult ticket cost?", "shekels", "Subtracting the second purchase from the first cancels the child tickets: 2 adult tickets cost 60 shekels, so one costs 30, and a child ticket costs 15."],
        ["3 כרטיסים למבוגרים ו־2 כרטיסים לילדים עולים 120 ש״ח; כרטיס אחד למבוגר ו־2 כרטיסים לילדים עולים 60 ש״ח. כמה עולה כרטיס אחד למבוגר?", "ש״ח", "חיסור הקנייה השנייה מהראשונה מבטל את כרטיסי הילדים: 2 כרטיסים למבוגרים עולים 60 ש״ח, ולכן כרטיס אחד עולה 30, וכרטיס לילד עולה 15."]],
    ],
    s: [
      [["Solving a system by substitution", "Rearrange one equation to get one unknown on its own", "Substitute that expression into the other equation", "Solve the new equation, which has only one unknown", "Put that value back in to find the other unknown", "Check both values in both of the original equations"],
        ["פתרון מערכת בשיטת ההצבה", "מבודדים נעלם אחד באחת המשוואות", "מציבים את הביטוי שהתקבל במשוואה השנייה", "פותרים את המשוואה החדשה, שיש בה נעלם אחד בלבד", "מציבים את הערך שנמצא כדי למצוא את הנעלם השני", "בודקים את שני הערכים בשתי המשוואות המקוריות"]],
    ],
  },
  a: {
    t: [
      ["Inconsistent system", "a system with no solution at all, like two parallel lines that never meet", "מערכת סותרת", "מערכת שאין לה אף פתרון, כמו שני ישרים מקבילים שאינם נפגשים"],
      ["Dependent system", "a system with infinitely many solutions, because both equations describe the same line", "מערכת תלויה", "מערכת עם אינסוף פתרונות, כי שתי המשוואות מתארות את אותו ישר"],
      ["Point of intersection", "where two graphs cross; for two straight lines it gives the solution of their system", "נקודת חיתוך", "המקום שבו שני גרפים נפגשים; עבור שני ישרים הוא נותן את הפתרון של המערכת שלהם"],
    ],
    q: [
      [["How many solutions does the system y = 2x + 1 and y = 2x − 3 have?", "None", ["Exactly one", "Infinitely many", "Exactly two"], "Both lines have slope 2 but cross the y-axis at different points, so they are parallel and never meet. In algebra, 2x + 1 = 2x − 3 gives 1 = −3, which is impossible."],
        ["כמה פתרונות יש למערכת y = 2x + 1 ו־y = 2x − 3?", "אין פתרון", ["פתרון אחד בדיוק", "אינסוף פתרונות", "שני פתרונות בדיוק"], "לשני הישרים שיפוע 2, אבל הם חותכים את ציר ה־y בנקודות שונות, ולכן הם מקבילים ולא נפגשים. אלגברית, 2x + 1 = 2x − 3 נותן 1 = −3, וזה בלתי אפשרי."]],
      [["Which system has infinitely many solutions?", "x + 2y = 4 and 2x + 4y = 8", ["x + 2y = 4 and 2x + 4y = 6", "x + 2y = 4 and x − 2y = 4", "x + y = 4 and x − y = 0"], "The second equation is exactly twice the first, so both describe the same line and every point on it is a solution. With 6 instead of 8 the lines are parallel and there is no solution."],
        ["לאיזו מערכת יש אינסוף פתרונות?", "x + 2y = 4 ו־2x + 4y = 8", ["x + 2y = 4 ו־2x + 4y = 6", "x + 2y = 4 ו־x − 2y = 4", "x + y = 4 ו־x − y = 0"], "המשוואה השנייה היא בדיוק פי 2 מהראשונה, ולכן שתיהן מתארות את אותו ישר וכל נקודה עליו היא פתרון. עם 6 במקום 8 הישרים מקבילים ואין פתרון."]],
      [["A two-digit number has digits that add up to 9. Swapping its digits gives a number 27 larger. What is the number?", "36", ["63", "45", "27"], "With tens digit a and units digit b: a + b = 9 and (10b + a) − (10a + b) = 27, so 9(b − a) = 27 and b − a = 3. Then b = 6 and a = 3: the number is 36, and 63 − 36 = 27."],
        ["סכום הספרות של מספר דו־ספרתי הוא 9. כשמחליפים בין הספרות שלו מתקבל מספר גדול ממנו ב־27. מהו המספר?", "36", ["63", "45", "27"], "אם ספרת העשרות היא a וספרת האחדות היא b: a + b = 9 ו־(10b + a) − (10a + b) = 27, ולכן 9(b − a) = 27 ו־b − a = 3. אז b = 6 ו־a = 3: המספר הוא 36, ו־63 − 36 = 27."]],
      [["A boat goes 24 km downstream in 2 hours and comes back upstream in 3 hours. What is the speed of the current?", "2 km/h", ["10 km/h", "4 km/h", "5 km/h"], "Downstream b + c = 24 ÷ 2 = 12 and upstream b − c = 24 ÷ 3 = 8. Adding gives 2b = 20, so the boat's own speed is 10 km/h and the current is 12 − 10 = 2 km/h."],
        ["סירה עוברת 24 ק״מ במורד הנהר ב־2 שעות, וחוזרת במעלה הנהר ב־3 שעות. מהי מהירות הזרם?", "2 קמ״ש", ["10 קמ״ש", "4 קמ״ש", "5 קמ״ש"], "במורד הנהר b + c = 24 ÷ 2 = 12, ובמעלה הנהר b − c = 24 ÷ 3 = 8. החיבור נותן 2b = 20, ולכן מהירות הסירה עצמה היא 10 קמ״ש ומהירות הזרם היא 12 − 10 = 2 קמ״ש."]],
      [["Solve: 2x + 3y = 12 and 3x − 2y = 5.", "x = 3, y = 2", ["x = 2, y = 3", "x = 3, y = −2", "x = 6, y = 0"], "Multiply the first by 2 and the second by 3: 4x + 6y = 24 and 9x − 6y = 15. Adding gives 13x = 39, so x = 3, and then 6 + 3y = 12 gives y = 2."],
        ["פתרו: 2x + 3y = 12 ו־3x − 2y = 5.", "x = 3, y = 2", ["x = 2, y = 3", "x = 3, y = −2", "x = 6, y = 0"], "כופלים את הראשונה ב־2 ואת השנייה ב־3: 4x + 6y = 24 ו־9x − 6y = 15. החיבור נותן 13x = 39, ולכן x = 3, ואז 6 + 3y = 12 נותן y = 2."]],
    ],
    n: [
      [2, ["For which value of k is the system 3x + 6y = 9 and x + ky = 5 inconsistent?", "", "An inconsistent system has parallel lines, and the lines are parallel when the coefficients are in the same ratio: 3/1 = 6/k, so k = 2. Then the first equation becomes x + 2y = 3 and the second x + 2y = 5, which can never both hold."],
        ["לאיזה ערך של k המערכת 3x + 6y = 9 ו־x + ky = 5 היא מערכת סותרת?", "", "במערכת סותרת הישרים מקבילים, והם מקבילים כשהמקדמים באותו יחס: 3/1 = 6/k, ולכן k = 2. אז המשוואה הראשונה היא x + 2y = 3 והשנייה x + 2y = 5, ושתיהן לא יכולות להתקיים יחד."]],
      [8, ["The lines y = 3x − 1 and y = x + 5 meet at one point. What is its y-coordinate?", "", "At the meeting point 3x − 1 = x + 5, so 2x = 6 and x = 3. Then y = 3 + 5 = 8, and the point is (3, 8)."],
        ["הישרים y = 3x − 1 ו־y = x + 5 נפגשים בנקודה אחת. מהו שיעור ה־y שלה?", "", "בנקודת המפגש 3x − 1 = x + 5, ולכן 2x = 6 ו־x = 3. אז y = 3 + 5 = 8, והנקודה היא (3, 8)."]],
    ],
    s: [
      [["Solving 2x + 3y = 11 and 3x − 2y = 10 by elimination", "Multiply the first equation by 2 and the second by 3, so the y terms become 6y and −6y", "Add the two new equations, which cancels y and leaves 13x = 52", "Divide by 13 to get x = 4", "Put x = 4 into the first equation: 8 + 3y = 11", "Solve for y to get y = 1"],
        ["פתרון 2x + 3y = 11 ו־3x − 2y = 10 בשיטת השוואת המקדמים", "כופלים את המשוואה הראשונה ב־2 ואת השנייה ב־3, כך שהאיברים עם y נעשים 6y ו־−6y", "מחברים את שתי המשוואות החדשות, וכך y מתבטל ונשאר 13x = 52", "מחלקים ב־13 ומקבלים x = 4", "מציבים x = 4 במשוואה הראשונה: 8 + 3y = 11", "פותרים את y ומקבלים y = 1"]],
    ],
  },
};
export default c;
