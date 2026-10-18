import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Similar triangles", "triangles with the same shape, with equal angles and sides in the same ratio, but maybe a different size", "משולשים דומים", "משולשים בעלי אותה צורה, שהזוויות שלהם שוות והצלעות שלהם באותו יחס, אבל הגודל יכול להיות שונה"],
      ["Ratio of similarity", "the number each side of one triangle is multiplied by to give the matching side of the other", "יחס הדמיון", "המספר שבו כופלים כל צלע של משולש אחד כדי לקבל את הצלע המתאימה במשולש השני"],
      ["Scale drawing", "an accurate drawing in which every length is shrunk or enlarged by the same factor", "שרטוט בקנה מידה", "שרטוט מדויק שבו כל אורך הוקטן או הוגדל פי אותו מספר"],
    ],
    q: [
      [["Which of these is always true for two similar triangles?", "Their corresponding angles are equal", ["Their corresponding sides are all equal", "Their areas are the same", "Their perimeters are the same"], "Similar triangles have the same shape, so their angles match. One of them can be larger, so their sides, areas and perimeters may differ."],
        ["מה מהבאים נכון תמיד לגבי שני משולשים דומים?", "הזוויות המתאימות שלהם שוות", ["כל הצלעות המתאימות שלהם שוות", "השטחים שלהם שווים", "ההיקפים שלהם שווים"], "למשולשים דומים יש אותה צורה, ולכן הזוויות שלהם שוות. אחד מהם יכול להיות גדול יותר, ולכן הצלעות, השטחים וההיקפים שלהם יכולים להיות שונים."]],
      [["A triangle has sides of 3, 4 and 5 cm. A similar triangle is twice as big. What are its sides?", "6, 8 and 10 cm", ["5, 6 and 7 cm", "6, 8 and 5 cm", "3, 4 and 10 cm"], "Twice as big means every side is multiplied by 2: 3 × 2 = 6, 4 × 2 = 8 and 5 × 2 = 10. Adding 2 to each side, to get 5, 6 and 7, does not keep the shape."],
        ["למשולש יש צלעות של 3, 4 ו־5 ס״מ. משולש דומה לו גדול ממנו פי 2. מהן הצלעות שלו?", "6, 8 ו־10 ס״מ", ["5, 6 ו־7 ס״מ", "6, 8 ו־5 ס״מ", "3, 4 ו־10 ס״מ"], "פי 2 פירושו שכל צלע מוכפלת ב־2: 3 × 2 = 6, 4 × 2 = 8 ו־5 × 2 = 10. הוספה של 2 לכל צלע, שנותנת 5, 6 ו־7, לא שומרת על הצורה."]],
      [["One triangle has angles of 30°, 60° and 90°; another has angles of 90°, 30° and 60°. Are they similar?", "Yes: all three angles match", ["No: the angles are listed in a different order", "Only if their sides are equal as well", "No: only one of them is a right triangle"], "Both triangles have angles of 30°, 60° and 90°; the order in which they are listed does not matter. Equal angles mean the same shape, so the triangles are similar."],
        ["למשולש אחד יש זוויות של 30°, 60° ו־90°, ולמשולש אחר זוויות של 90°, 30° ו־60°. האם הם דומים?", "כן: כל שלוש הזוויות שוות", ["לא: הזוויות רשומות בסדר אחר", "רק אם גם הצלעות שלהם שוות", "לא: רק אחד מהם ישר זווית"], "לשני המשולשים יש זוויות של 30°, 60° ו־90°; הסדר שבו הן רשומות לא משנה. זוויות שוות פירושן אותה צורה, ולכן המשולשים דומים."]],
      [["The ratio of similarity of two triangles is 3. A side of the small triangle is 4 cm. How long is the matching side of the large one?", "12 cm", ["7 cm", "4/3 cm", "36 cm"], "Each side of the large triangle is 3 times the matching side of the small one: 4 × 3 = 12 cm. Adding 3 to get 7 cm does not keep the shape."],
        ["יחס הדמיון בין שני משולשים הוא 3. צלע במשולש הקטן היא 4 ס״מ. מה אורך הצלע המתאימה במשולש הגדול?", "12 ס״מ", ["7 ס״מ", "4/3 ס״מ", "36 ס״מ"], "כל צלע במשולש הגדול ארוכה פי 3 מהצלע המתאימה במשולש הקטן: 4 × 3 = 12 ס״מ. הוספה של 3, שנותנת 7 ס״מ, לא שומרת על הצורה."]],
      [["Which pair of triangles is always similar?", "Any two triangles with three equal sides each", ["Any two triangles that each have a right angle", "Any two triangles with two equal sides", "Any two triangles with the same perimeter"], "Every triangle with three equal sides has three angles of 60°, so any two of them have the same shape. Two right triangles, for example, can have very different other angles."],
        ["איזה זוג משולשים דומה תמיד?", "כל שני משולשים שבכל אחד מהם שלוש הצלעות שוות", ["כל שני משולשים שבכל אחד מהם יש זווית ישרה", "כל שני משולשים שבכל אחד מהם שתי צלעות שוות", "כל שני משולשים שיש להם אותו היקף"], "בכל משולש ששלוש צלעותיו שוות יש שלוש זוויות של 60°, ולכן לכל שניים כאלה יש אותה צורה. לעומת זאת, לשני משולשים ישרי זווית יכולות להיות זוויות אחרות שונות מאוד."]],
    ],
    n: [
      [50, ["On a map with scale 1 : 1000, a road is 5 cm long. How long is the real road, in metres?", "m", "Every real length is 1000 times the length on the map: 5 × 1000 = 5000 cm, and 5000 cm = 50 m."],
        ["במפה בקנה מידה 1 : 1000 אורכו של כביש הוא 5 ס״מ. מה אורכו של הכביש במציאות, במטרים?", "מ׳", "כל אורך במציאות גדול פי 1000 מהאורך במפה: 5 × 1000 = 5000 ס״מ, ו־5000 ס״מ הם 50 מ׳."]],
      [27, ["A triangle with sides of 2, 3 and 4 cm is enlarged with ratio of similarity 3. What is the perimeter of the new triangle?", "cm", "The new sides are 6, 9 and 12 cm, so the perimeter is 6 + 9 + 12 = 27 cm. That is also 3 times the old perimeter of 9 cm."],
        ["משולש שצלעותיו 2, 3 ו־4 ס״מ מוגדל ביחס דמיון 3. מה ההיקף של המשולש החדש?", "ס״מ", "הצלעות החדשות הן 6, 9 ו־12 ס״מ, ולכן ההיקף הוא 6 + 9 + 12 = 27 ס״מ. זה גם פי 3 מההיקף הקודם, 9 ס״מ."]],
    ],
  },
  i: {
    t: [
      ["AA similarity", "if two angles of one triangle equal two angles of another, the triangles have the same shape", "דמיון ז־ז", "אם שתי זוויות במשולש אחד שוות לשתי זוויות במשולש אחר, למשולשים יש אותה צורה"],
      ["Midsegment", "the segment joining the midpoints of two sides of a triangle; it is parallel to the third side and half as long", "קטע אמצעים", "הקטע שמחבר את אמצעי שתי צלעות במשולש; הוא מקביל לצלע השלישית ושווה למחציתה"],
      ["Proportion", "a statement that two ratios are equal, such as 2/3 = 4/6", "פרופורציה", "שוויון בין שני יחסים, כמו 2/3 = 4/6"],
    ],
    q: [
      [["In triangle ABC, D is on AB and E is on AC, with DE parallel to BC. Why is triangle ADE similar to triangle ABC?", "They share angle A, and DE ∥ BC makes the corresponding angles equal", ["DE and BC are always the same length", "D and E are always the midpoints of AB and AC", "Any triangle drawn inside another one is similar to it"], "∠A belongs to both triangles, and the parallel lines make ∠ADE = ∠ABC. Two pairs of equal angles are enough, so the triangles are similar by AA."],
        ["במשולש ABC הנקודה D על AB והנקודה E על AC, ו־DE מקביל ל־BC. למה המשולש ADE דומה למשולש ABC?", "הזווית A משותפת, ו־DE ∥ BC יוצר זוויות מתאימות שוות", ["DE ו־BC תמיד באותו אורך", "D ו־E הן תמיד אמצעי הצלעות AB ו־AC", "כל משולש שמשרטטים בתוך משולש אחר דומה לו"], "∠A שייכת לשני המשולשים, והישרים המקבילים יוצרים ∠ADE = ∠ABC. שני זוגות של זוויות שוות מספיקים, ולכן המשולשים דומים לפי ז־ז."]],
      [["Which triangle is similar to a triangle with sides 4, 6 and 8?", "6, 9 and 12", ["5, 7 and 9", "8, 12 and 14", "2, 3 and 3"], "Every side of 6, 9, 12 is 1.5 times the matching side: 4 × 1.5 = 6, 6 × 1.5 = 9 and 8 × 1.5 = 12. Adding 1 to each side, as in 5, 7, 9, changes the shape."],
        ["איזה משולש דומה למשולש שצלעותיו 4, 6 ו־8?", "6, 9 ו־12", ["5, 7 ו־9", "8, 12 ו־14", "2, 3 ו־3"], "כל צלע במשולש 6, 9, 12 ארוכה פי 1.5 מהצלע המתאימה: 4 × 1.5 = 6, 6 × 1.5 = 9 ו־8 × 1.5 = 12. הוספה של 1 לכל צלע, כמו ב־5, 7, 9, משנה את הצורה."]],
      [["A 2 m pole casts a 3 m shadow. At the same moment a tree casts a 12 m shadow. How tall is the tree?", "8 m", ["18 m", "11 m", "6 m"], "The sun's rays make similar triangles, so height ÷ shadow is the same for both: 2 ÷ 3 = h ÷ 12, which gives h = 8 m. 18 m comes from turning the ratio upside down."],
        ["מוט שגובהו 2 מ׳ מטיל צל של 3 מ׳. באותו רגע עץ מטיל צל של 12 מ׳. מה גובה העץ?", "8 מ׳", ["18 מ׳", "11 מ׳", "6 מ׳"], "קרני השמש יוצרות משולשים דומים, ולכן היחס בין הגובה לצל זהה בשניהם: 2 ÷ 3 = h ÷ 12, ומכאן h = 8 מ׳. התשובה 18 מ׳ מתקבלת כשהופכים את היחס."]],
      [["Two similar triangles have perimeters of 15 cm and 45 cm. What is their ratio of similarity?", "1 : 3", ["1 : 9", "1 : 30", "3 : 5"], "The perimeters of similar triangles are in the same ratio as their sides: 15 : 45 = 1 : 3. 1 : 9 would be the ratio of their areas."],
        ["ההיקפים של שני משולשים דומים הם 15 ס״מ ו־45 ס״מ. מהו יחס הדמיון ביניהם?", "1 : 3", ["1 : 9", "1 : 30", "3 : 5"], "ההיקפים של משולשים דומים נמצאים באותו יחס כמו הצלעות שלהם: 15 : 45 = 1 : 3. היחס 1 : 9 הוא היחס בין השטחים שלהם."]],
      [["Which of these is NOT enough to prove that two triangles are similar?", "One pair of equal angles", ["Two pairs of sides in the same ratio and the angles between them equal", "Two pairs of equal angles", "All three pairs of sides in the same ratio"], "Two equal angles (AA), all three sides in the same ratio (SSS), or two sides in the same ratio with the angle between them equal (SAS) prove similarity. One angle alone does not fix the shape."],
        ["מה מהבאים אינו מספיק כדי להוכיח ששני משולשים דומים?", "זוג אחד של זוויות שוות", ["שני זוגות של צלעות באותו יחס, והזוויות שביניהן שוות", "שני זוגות של זוויות שוות", "שלושה זוגות של צלעות באותו יחס"], "שתי זוויות שוות (ז־ז), שלוש צלעות באותו יחס (צ־צ־צ), או שתי צלעות באותו יחס והזווית שביניהן שווה (צ־ז־צ) מוכיחים דמיון. זווית אחת לבדה לא קובעת את הצורה."]],
    ],
    n: [
      [12, ["Triangles ABC and DEF are similar, with AB = 6, DE = 9 and BC = 8. How long is EF?", "", "The ratio of similarity is 9 ÷ 6 = 1.5, so EF = 8 × 1.5 = 12."],
        ["המשולשים ABC ו־DEF דומים, ונתון AB = 6, DE = 9 ו־BC = 8. מה אורך EF?", "", "יחס הדמיון הוא 9 ÷ 6 = 1.5, ולכן EF = 8 × 1.5 = 12."]],
      [7, ["In triangle ABC, D and E are the midpoints of AB and AC, and BC = 14 cm. How long is DE?", "cm", "The segment joining the midpoints of two sides is half the third side: 14 ÷ 2 = 7 cm. Triangle ADE is similar to ABC with ratio 1 : 2."],
        ["במשולש ABC הנקודות D ו־E הן אמצעי הצלעות AB ו־AC, ו־BC = 14 ס״מ. מה אורך DE?", "ס״מ", "הקטע שמחבר את אמצעי שתי הצלעות שווה למחצית הצלע השלישית: 14 ÷ 2 = 7 ס״מ. המשולש ADE דומה ל־ABC ביחס 1 : 2."]],
    ],
  },
  a: {
    t: [
      ["Ratio of areas", "for similar figures, it equals the ratio of similarity multiplied by itself", "יחס השטחים", "בצורות דומות הוא שווה ליחס הדמיון בריבוע"],
      ["Intercept theorem", "parallel lines that cut the two arms of an angle make segments on them in the same ratio", "משפט תאלס", "ישרים מקבילים שחותכים את שתי שוקי הזווית יוצרים עליהן קטעים באותו יחס"],
      ["Altitude to the hypotenuse", "in a right triangle, the perpendicular from the right angle to the longest side", "הגובה ליתר", "במשולש ישר־זווית, האנך מהזווית הישרה אל הצלע הארוכה ביותר"],
    ],
    q: [
      [["Two similar triangles have ratio of similarity 3. The small one has an area of 10 cm². What is the area of the large one?", "90 cm²", ["30 cm²", "60 cm²", "13 cm²"], "Areas grow by the square of the ratio of similarity: 3² = 9, so the large area is 10 × 9 = 90 cm². 30 cm² forgets that both the base and the height are tripled."],
        ["יחס הדמיון בין שני משולשים הוא 3. שטח המשולש הקטן הוא 10 סמ״ר. מה שטח המשולש הגדול?", "90 סמ״ר", ["30 סמ״ר", "60 סמ״ר", "13 סמ״ר"], "השטחים גדלים פי ריבוע יחס הדמיון: 3² = 9, ולכן השטח הגדול הוא 10 × 9 = 90 סמ״ר. התשובה 30 סמ״ר שוכחת שגם הבסיס וגם הגובה גדלים פי 3."]],
      [["Two similar triangles have areas of 16 cm² and 25 cm². What is the ratio of their corresponding sides, small to large?", "4 : 5", ["16 : 25", "8 : 25", "1 : 9"], "The ratio of areas is the square of the ratio of sides, so take square roots: √16 : √25 = 4 : 5. 16 : 25 is the ratio of the areas themselves."],
        ["השטחים של שני משולשים דומים הם 16 סמ״ר ו־25 סמ״ר. מהו היחס בין הצלעות המתאימות שלהם, מהקטן לגדול?", "4 : 5", ["16 : 25", "8 : 25", "1 : 9"], "יחס השטחים הוא ריבוע יחס הצלעות, ולכן מוציאים שורש: √16 : √25 = 4 : 5. היחס 16 : 25 הוא היחס בין השטחים עצמם."]],
      [["In triangle ABC, DE ∥ BC with D on AB and E on AC. AD = 3, DB = 6 and AE = 4. How long is EC?", "8", ["12", "2", "7"], "Parallel lines cut the sides in the same ratio: AD : DB = AE : EC, so 3 : 6 = 4 : EC and EC = 8. 12 is the whole side AC, not EC."],
        ["במשולש ABC נתון DE ∥ BC, כאשר D על AB ו־E על AC. AD = 3, DB = 6 ו־AE = 4. מה אורך EC?", "8", ["12", "2", "7"], "ישרים מקבילים חותכים את הצלעות באותו יחס: AD : DB = AE : EC, ולכן 3 : 6 = 4 : EC ו־EC = 8. 12 הוא אורך הצלע AC כולה, ולא EC."]],
      [["In right triangle ABC with the right angle at C, CD is the altitude to the hypotenuse AB. Which triangles are similar to ABC?", "Both ACD and CBD", ["Only ACD", "Only CBD", "Neither of them; they are only similar to each other"], "ACD shares angle A with ABC and has a right angle, and CBD shares angle B and has a right angle, so both are similar to ABC by AA, and so also to each other."],
        ["במשולש ישר־זווית ABC, שהזווית הישרה שלו ב־C, הקטע CD הוא הגובה ליתר AB. אילו משולשים דומים ל־ABC?", "גם ACD וגם CBD", ["רק ACD", "רק CBD", "אף אחד מהם; הם דומים רק זה לזה"], "ל־ACD יש זווית משותפת עם ABC, הזווית A, ויש בו זווית ישרה; ל־CBD יש את הזווית B ויש בו זווית ישרה. לכן שניהם דומים ל־ABC לפי ז־ז, וגם זה לזה."]],
      [["A girl 1.6 m tall stands 6 m from a lamp post, and her shadow is 2 m long. How tall is the lamp post?", "6.4 m", ["4.8 m", "8 m", "3.2 m"], "The tip of the shadow is 6 + 2 = 8 m from the post. Similar triangles give h ÷ 8 = 1.6 ÷ 2, so h = 6.4 m. 4.8 m wrongly uses 6 m instead of the full 8 m."],
        ["ילדה שגובהה 1.6 מ׳ עומדת במרחק 6 מ׳ מעמוד תאורה, ואורך הצל שלה 2 מ׳. מה גובה העמוד?", "6.4 מ׳", ["4.8 מ׳", "8 מ׳", "3.2 מ׳"], "קצה הצל נמצא במרחק 6 + 2 = 8 מ׳ מהעמוד. מהמשולשים הדומים h ÷ 8 = 1.6 ÷ 2, ולכן h = 6.4 מ׳. התשובה 4.8 מ׳ משתמשת בטעות ב־6 מ׳ במקום ב־8 המטרים המלאים."]],
    ],
    n: [
      [6, ["In right triangle ABC with the right angle at C, the altitude CD splits the hypotenuse into AD = 4 and DB = 9. How long is CD?", "", "Triangles ACD and CBD are similar, so AD : CD = CD : DB, which gives CD² = 4 × 9 = 36 and CD = 6."],
        ["במשולש ישר־זווית ABC, שהזווית הישרה שלו ב־C, הגובה CD מחלק את היתר לקטעים AD = 4 ו־DB = 9. מה אורך CD?", "", "המשולשים ACD ו־CBD דומים, ולכן AD : CD = CD : DB, ומכאן CD² = 4 × 9 = 36 ו־CD = 6."]],
      [7.5, ["In triangle ABC, DE ∥ BC with D on AB and E on AC. AD = 2, AB = 5 and DE = 3. How long is BC?", "", "Triangle ADE is similar to ABC with ratio AD : AB = 2 : 5, so DE : BC = 2 : 5 as well. Then BC = 3 × 5 ÷ 2 = 7.5."],
        ["במשולש ABC נתון DE ∥ BC, כאשר D על AB ו־E על AC. AD = 2, AB = 5 ו־DE = 3. מה אורך BC?", "", "המשולש ADE דומה ל־ABC ביחס AD : AB = 2 : 5, ולכן גם DE : BC = 2 : 5. מכאן BC = 3 × 5 ÷ 2 = 7.5."]],
    ],
  },
};
export default c;
