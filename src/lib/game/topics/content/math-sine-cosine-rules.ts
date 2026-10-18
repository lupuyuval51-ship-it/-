import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Sine rule", "in every triangle a/sin A = b/sin B = c/sin C: each side divided by the sine of the angle opposite it gives the same number", "משפט הסינוסים", "בכל משולש a/sin A = b/sin B = c/sin C: כל צלע חלקי הסינוס של הזווית שמולה נותנת אותו מספר"],
      ["Cosine rule", "c² = a² + b² − 2ab·cos C: a formula that links all three sides of a triangle with one of its angles", "משפט הקוסינוסים", "הנוסחה c² = a² + b² − 2ab·cos C קושרת את שלוש הצלעות של משולש עם אחת הזוויות שלו"],
      ["Included angle", "the angle between two given sides, at the corner where they meet", "הזווית הכלואה", "הזווית שבין שתי צלעות נתונות, בקודקוד שבו הן נפגשות"],
    ],
    q: [
      [["In triangle ABC, which side is opposite angle A?", "a, the side BC", ["b, the side AC", "c, the side AB", "Always the longest side"], "Side a joins B and C, so it does not touch corner A: it lies across from angle A. Both rules match each side with the angle opposite it in this way."],
        ["במשולש ABC, איזו צלע נמצאת מול זווית A?", "a, הצלע BC", ["b, הצלע AC", "c, הצלע AB", "תמיד הצלע הארוכה ביותר"], "הצלע a מחברת את B ואת C, ולכן היא לא נוגעת בקודקוד A: היא נמצאת מול זווית A. שני המשפטים מתאימים כל צלע לזווית שמולה בדרך הזאת."]],
      [["You know two angles of a triangle and one side. Which rule finds another side?", "The sine rule", ["The cosine rule", "Pythagoras' theorem", "The area formula"], "From two angles you also get the third, since the angles add up to 180°. So you have a side with its opposite angle, which is what the sine rule needs. Pythagoras works only in right triangles."],
        ["ידועות שתי זוויות של משולש וצלע אחת. איזה משפט מאפשר למצוא צלע נוספת?", "משפט הסינוסים", ["משפט הקוסינוסים", "משפט פיתגורס", "נוסחת השטח"], "משתי זוויות מקבלים גם את השלישית, כי סכום הזוויות במשולש הוא 180°. כך יש צלע והזווית שמולה, וזה בדיוק מה שמשפט הסינוסים צריך. משפט פיתגורס נכון רק במשולש ישר־זווית."]],
      [["What does the cosine rule become when angle C is 90°?", "Pythagoras' theorem", ["The sine rule", "The angle sum of a triangle", "c = a + b"], "cos 90° = 0, so the term 2ab·cos C disappears and c² = a² + b² is left: Pythagoras' theorem."],
        ["למה הופך משפט הקוסינוסים כשזווית C היא 90°?", "משפט פיתגורס", ["משפט הסינוסים", "סכום הזוויות במשולש", "c = a + b"], "מכיוון ש־cos 90° = 0, האיבר 2ab·cos C נעלם ונשאר c² = a² + b²: משפט פיתגורס."]],
      [["Which formula gives the area of a triangle from two sides and the angle between them?", "½ab·sin C", ["½ab·cos C", "ab·sin C", "½(a + b)·C"], "The height to side a is b·sin C, so the area is ½ × a × b·sin C. With cosine instead, a right angle would give an area of 0."],
        ["איזו נוסחה נותנת את השטח של משולש לפי שתי צלעות והזווית שביניהן?", "½ab·sin C", ["½ab·cos C", "ab·sin C", "½(a + b)·C"], "הגובה לצלע a הוא b·sin C, ולכן השטח הוא ½ × a × b·sin C. עם קוסינוס במקום סינוס, זווית ישרה הייתה נותנת שטח 0."]],
      [["In triangle ABC, A = 50° and B = 60°. What is angle C?", "70°", ["110°", "80°", "60°"], "The three angles of a triangle add up to 180°, so C = 180° − 50° − 60° = 70°. This step often comes before using the sine rule."],
        ["במשולש ABC, A = 50° ו־B = 60°. מהי זווית C?", "70°", ["110°", "80°", "60°"], "סכום שלוש הזוויות במשולש הוא 180°, ולכן C = 180° − 50° − 60° = 70°. את הצעד הזה עושים לעיתים קרובות לפני שמשתמשים במשפט הסינוסים."]],
      [["You know all three sides of a triangle. Which rule finds one of its angles?", "The cosine rule", ["The sine rule", "The area formula", "None, because an angle must be known"], "Put the three sides into c² = a² + b² − 2ab·cos C and solve for cos C. The sine rule needs at least one angle that you already know."],
        ["ידועות כל שלוש הצלעות של משולש. איזה משפט מאפשר למצוא את אחת הזוויות שלו?", "משפט הקוסינוסים", ["משפט הסינוסים", "נוסחת השטח", "אף משפט, כי חייבים לדעת זווית"], "מציבים את שלוש הצלעות ב־c² = a² + b² − 2ab·cos C ומחלצים את cos C. משפט הסינוסים צריך לפחות זווית אחת שכבר ידועה."]],
    ],
    n: [
      [5, ["A triangle has sides of 4 cm and 5 cm with an angle of 30° between them. What is its area?", "cm²", "Area = ½ × 4 × 5 × sin 30° = 10 × 0.5 = 5 cm²."],
        ["במשולש יש צלעות של 4 ס״מ ו־5 ס״מ, והזווית שביניהן 30°. מה השטח שלו?", "סמ״ר", "השטח הוא ½ × 4 × 5 × sin 30° = 10 × 0.5 = 5 סמ״ר."]],
      [12, ["In a triangle, side a = 6 cm lies opposite angle A = 30°. What is a ÷ sin A?", "cm", "sin 30° = 0.5, so a ÷ sin A = 6 ÷ 0.5 = 12 cm. Every other side divided by the sine of its opposite angle also gives 12."],
        ["במשולש, הצלע a = 6 ס״מ נמצאת מול הזווית A = 30°. כמה זה a ÷ sin A?", "ס״מ", "מכיוון ש־sin 30° = 0.5, מקבלים a ÷ sin A = 6 ÷ 0.5 = 12 ס״מ. גם כל צלע אחרת חלקי הסינוס של הזווית שמולה נותנת 12."]],
    ],
  },
  i: {
    t: [
      ["Circumscribed circle", "the circle through all three corners of a triangle; by the sine rule a/sin A = 2R, where R is its radius", "מעגל חוסם", "המעגל שעובר דרך שלושת הקודקודים של משולש; לפי משפט הסינוסים a/sin A = 2R, כאשר R הוא הרדיוס שלו"],
      ["Obtuse angle", "an angle greater than 90° and less than 180°; its cosine is negative", "זווית קהה", "זווית שגדולה מ־90° וקטנה מ־180°; הקוסינוס שלה שלילי"],
      ["Solving a triangle", "finding all the unknown sides and angles of a triangle from the ones that are known", "פתרון משולש", "מציאת כל הצלעות והזוויות הלא ידועות של משולש מתוך אלה שידועות"],
    ],
    q: [
      [["In triangle ABC, a = 8, A = 30° and B = 45°. Which expression gives b?", "8·sin 45° ÷ sin 30°", ["8·sin 30° ÷ sin 45°", "8 ÷ sin 45°", "8·cos 45°"], "From a/sin A = b/sin B, multiply both sides by sin B: b = a·sin B ÷ sin A = 8·sin 45° ÷ sin 30°, which is about 11.3."],
        ["במשולש ABC, a = 8, A = 30° ו־B = 45°. איזה ביטוי נותן את b?", "8·sin 45° ÷ sin 30°", ["8·sin 30° ÷ sin 45°", "8 ÷ sin 45°", "8·cos 45°"], "מ־a/sin A = b/sin B כופלים את שני האגפים ב־sin B: b = a·sin B ÷ sin A = 8·sin 45° ÷ sin 30°, שזה בערך 11.3."]],
      [["Using the cosine rule, c² turns out to be greater than a² + b². What does that tell you about angle C?", "C is obtuse", ["C is acute", "C is a right angle", "C is the smallest angle"], "c² = a² + b² − 2ab·cos C. If c² is bigger than a² + b², then −2ab·cos C is positive, so cos C is negative and C is obtuse."],
        ["לפי משפט הקוסינוסים, c² יוצא גדול מ־a² + b². מה זה אומר על זווית C?", "C היא זווית קהה", ["C היא זווית חדה", "C היא זווית ישרה", "C היא הזווית הקטנה ביותר"], "לפי המשפט c² = a² + b² − 2ab·cos C. אם c² גדול מ־a² + b², האיבר −2ab·cos C חיובי, כלומר cos C שלילי ו־C קהה."]],
      [["Two sides of a triangle are 6 cm and 10 cm, and its area is 15 cm². What could the angle between them be?", "30° or 150°", ["Only 30°", "Only 60°", "45° or 135°"], "15 = ½ × 6 × 10 × sin C gives sin C = 15 ÷ 30 = 1/2. Both 30° and 150° have a sine of 1/2, so both triangles have this area."],
        ["שתי צלעות של משולש הן 6 ס״מ ו־10 ס״מ, והשטח שלו 15 סמ״ר. מה יכולה להיות הזווית שביניהן?", "30° או 150°", ["רק 30°", "רק 60°", "45° או 135°"], "מ־15 = ½ × 6 × 10 × sin C מקבלים sin C = 15 ÷ 30 = 1/2. גם ל־30° וגם ל־150° יש סינוס 1/2, ולכן לשני המשולשים יש את השטח הזה."]],
      [["In triangle ABC, side a is the longest side. Which angle is the largest?", "A", ["B", "C", "It cannot be known"], "In every triangle the longest side lies opposite the largest angle, and the shortest side opposite the smallest one. Side a is opposite A, so A is the largest angle."],
        ["במשולש ABC הצלע a היא הארוכה ביותר. איזו זווית היא הגדולה ביותר?", "A", ["B", "C", "אי אפשר לדעת"], "בכל משולש מול הצלע הארוכה ביותר נמצאת הזווית הגדולה ביותר, ומול הקצרה ביותר הזווית הקטנה ביותר. הצלע a נמצאת מול A, ולכן A היא הזווית הגדולה ביותר."]],
      [["Which of these sets of facts is NOT enough to fix one single triangle?", "Three angles", ["Three sides", "Two sides and the angle between them", "Two angles and one side"], "Three angles fix the shape but not the size: you can draw the same triangle bigger or smaller, as similar triangles. Each of the other sets fixes exactly one triangle."],
        ["איזה מהנתונים האלה לא מספיק כדי לקבוע משולש אחד בלבד?", "שלוש זוויות", ["שלוש צלעות", "שתי צלעות והזווית שביניהן", "שתי זוויות וצלע אחת"], "שלוש זוויות קובעות את הצורה אבל לא את הגודל: אפשר לשרטט אותו משולש גדול יותר או קטן יותר, כמשולשים דומים. כל אחד מהנתונים האחרים קובע משולש אחד בדיוק."]],
    ],
    n: [
      [60, ["A triangle has sides 5, 7 and 8. What is the angle opposite the side of length 7, in degrees?", "degrees", "cos C = (5² + 8² − 7²) ÷ (2 × 5 × 8) = 40 ÷ 80 = 1/2, so C = 60 degrees."],
        ["למשולש יש צלעות 5, 7 ו־8. מהי הזווית שמול הצלע שאורכה 7, במעלות?", "מעלות", "לפי משפט הקוסינוסים cos C = (5² + 8² − 7²) ÷ (2 × 5 × 8) = 40 ÷ 80 = 1/2, ולכן C = 60 מעלות."]],
      [7, ["Two sides of a triangle are 3 and 5, and the angle between them is 120°. How long is the third side?", "", "c² = 3² + 5² − 2 × 3 × 5 × cos 120° = 9 + 25 + 15 = 49, because cos 120° = −1/2. So c = 7."],
        ["שתי צלעות של משולש הן 3 ו־5, והזווית שביניהן 120°. מה אורך הצלע השלישית?", "", "לפי משפט הקוסינוסים c² = 3² + 5² − 2 × 3 × 5 × cos 120° = 9 + 25 + 15 = 49, כי cos 120° = −1/2. לכן c = 7."]],
    ],
    s: [[["Finding an angle from three sides, in order", "Choose the angle and call the side opposite it c", "Write the cosine rule for that angle: c² = a² + b² − 2ab·cos C", "Put in the three side lengths", "Solve the equation for cos C", "Use the inverse cosine to find C"],
      ["מציאת זווית לפי שלוש צלעות, לפי הסדר", "בוחרים את הזווית ומסמנים ב־c את הצלע שמולה", "כותבים את משפט הקוסינוסים לזווית הזאת: c² = a² + b² − 2ab·cos C", "מציבים את אורכי שלוש הצלעות", "מחלצים מהמשוואה את cos C", "מוצאים את C בעזרת הפונקציה ההפוכה לקוסינוס"]]],
  },
  a: {
    t: [
      ["Ambiguous case", "when two sides and an angle that is not between them are given, two different triangles may fit", "מקרה דו־משמעי", "כשנתונות שתי צלעות וזווית שאינה ביניהן, ייתכן ששני משולשים שונים מתאימים לנתונים"],
      ["Inverse sine", "the function sin⁻¹ that gives back the angle between −90° and 90° whose sine is a given number", "סינוס הפוך", "הפונקציה sin⁻¹ שמחזירה את הזווית שבין −90° ל־90° שהסינוס שלה הוא מספר נתון"],
      ["Heron's formula", "the area of a triangle from its three sides: √(s(s − a)(s − b)(s − c)), where s is half the perimeter", "נוסחת הרון", "השטח של משולש לפי שלוש הצלעות שלו: √(s(s − a)(s − b)(s − c)), כאשר s הוא חצי ההיקף"],
    ],
    q: [
      [["In triangle ABC, a = 6, b = 8 and A = 30°. How many different triangles fit these facts?", "Two", ["One", "None", "Infinitely many"], "sin B = 8 × sin 30° ÷ 6 = 2/3, so B ≈ 41.8° or B ≈ 138.2°. Both leave room for a third angle, since 30° + 138.2° is still less than 180°, so two triangles fit."],
        ["במשולש ABC, a = 6, b = 8 ו־A = 30°. כמה משולשים שונים מתאימים לנתונים?", "שניים", ["אחד", "אף אחד", "אינסוף"], "לפי משפט הסינוסים sin B = 8 × sin 30° ÷ 6 = 2/3, ולכן B ≈ 41.8° או B ≈ 138.2°. בשני המקרים נשאר מקום לזווית שלישית, כי 30° + 138.2° עדיין קטן מ־180°, ולכן מתאימים שני משולשים."]],
      [["In triangle ABC, a = 3, b = 8 and A = 30°. What happens when you use the sine rule to find B?", "sin B comes out greater than 1, so no such triangle exists", ["sin B = 3/8 ≈ 0.375, so B is about 22° and the triangle is unique", "Two different triangles fit the data", "B must be a right angle"], "sin B = b·sin A ÷ a = 8 × 0.5 ÷ 3 = 4/3. No angle has a sine greater than 1: side a is too short to reach the third side, so there is no triangle."],
        ["במשולש ABC, a = 3, b = 8 ו־A = 30°. מה קורה כשמחפשים את B בעזרת משפט הסינוסים?", "sin B יוצא גדול מ־1, ולכן אין משולש כזה", ["sin B = 3/8 ≈ 0.375, ולכן B בערך 22° והמשולש יחיד", "שני משולשים שונים מתאימים לנתונים", "B חייבת להיות זווית ישרה"], "לפי המשפט sin B = b·sin A ÷ a = 8 × 0.5 ÷ 3 = 4/3. לאף זווית אין סינוס גדול מ־1: הצלע a קצרה מכדי להגיע לצלע השלישית, ולכן אין משולש."]],
      [["Two sides of a triangle are 5 and 8, its area is 10√3, and the angle between those sides is obtuse. How long is the third side?", "√129", ["7", "√89", "13"], "20·sin C = 10√3 gives sin C = √3/2, so C = 60° or 120°, and obtuse means 120°. Then c² = 25 + 64 − 80·cos 120° = 89 + 40 = 129, so c = √129 ≈ 11.4. The answer 7 belongs to the 60° triangle."],
        ["שתי צלעות של משולש הן 5 ו־8, השטח שלו 10√3, והזווית שבין שתי הצלעות האלה קהה. מה אורך הצלע השלישית?", "√129", ["7", "√89", "13"], "מ־20·sin C = 10√3 מקבלים sin C = √3/2, ולכן C = 60° או C = 120°, וזווית קהה פירושה 120°. אז c² = 25 + 64 − 80·cos 120° = 89 + 40 = 129, ולכן c = √129 ≈ 11.4. התשובה 7 שייכת למשולש עם 60°."]],
      [["Why can the sine rule mislead you when the angle you are looking for is obtuse?", "sin θ = sin(180° − θ), and a calculator gives back only the acute angle", ["The sine of an obtuse angle is negative, so the calculator shows an error", "The sine rule works only in right-angled triangles", "The sine of any obtuse angle is exactly 1"], "For example sin 40° = sin 140°, but sin⁻¹ returns only 40°, so you must check whether 140° fits too, for instance by looking at which side is the longest. The cosine rule has no such trap, because the cosine of an obtuse angle is negative."],
        ["למה משפט הסינוסים עלול להטעות כשהזווית שמחפשים היא קהה?", "sin θ = sin(180° − θ), והמחשבון מחזיר רק את הזווית החדה", ["הסינוס של זווית קהה שלילי, ולכן המחשבון מציג הודעת שגיאה", "משפט הסינוסים נכון רק במשולש ישר־זווית", "הסינוס של כל זווית קהה שווה בדיוק ל־1"], "למשל sin 40° = sin 140°, אבל sin⁻¹ מחזיר רק 40°, ולכן צריך לבדוק אם גם 140° מתאימה, למשל לפי הצלע הארוכה ביותר. במשפט הקוסינוסים אין מלכודת כזאת, כי הקוסינוס של זווית קהה שלילי."]],
      [["A triangle has sides 7, 8 and 9. Which angle is the largest, and is it acute?", "The angle opposite the side 9, and it is acute", ["The angle opposite the side 9, and it is obtuse", "The angle opposite the side 7, and it is acute", "All three angles are equal"], "The largest angle is opposite the longest side, 9. Its cosine is (7² + 8² − 9²) ÷ (2 × 7 × 8) = 32 ÷ 112 = 2/7, which is positive, so the angle is acute, about 73°."],
        ["למשולש יש צלעות 7, 8 ו־9. איזו זווית היא הגדולה ביותר, והאם היא חדה?", "הזווית שמול הצלע 9, והיא חדה", ["הזווית שמול הצלע 9, והיא קהה", "הזווית שמול הצלע 7, והיא חדה", "כל שלוש הזוויות שוות"], "הזווית הגדולה ביותר נמצאת מול הצלע הארוכה ביותר, 9. הקוסינוס שלה הוא (7² + 8² − 9²) ÷ (2 × 7 × 8) = 32 ÷ 112 = 2/7, מספר חיובי, ולכן הזווית חדה, בערך 73°."]],
    ],
    n: [
      [17.3, ["From a point on flat ground the angle of elevation to the top of a tower is 30°. After walking 20 m straight towards the tower, the angle of elevation is 60°. How tall is the tower, to one decimal place?", "m", "In the triangle formed by the two points and the top, the angles are 30°, 120° and 30°, so it is isosceles and the slanting line from the nearer point is 20 m long. The height is 20 × sin 60° = 10√3 ≈ 17.3 m."],
        ["מנקודה על קרקע מישורית רואים את ראש המגדל בזווית הגבהה של 30°. אחרי הליכה של 20 מטר ישר לכיוון המגדל, זווית ההגבהה היא 60°. מה גובה המגדל, בדיוק של ספרה אחת אחרי הנקודה העשרונית?", "מטר", "במשולש שנוצר בין שתי הנקודות לראש המגדל הזוויות הן 30°, 120° ו־30°, ולכן הוא שווה שוקיים, והקו המשופע מהנקודה הקרובה אורכו 20 מטר. הגובה הוא 20 × sin 60° = 10√3 ≈ 17.3 מטר."], 0.1],
      [84, ["A triangle has sides 13, 14 and 15. Use Heron's formula: what is its area?", "", "s = (13 + 14 + 15) ÷ 2 = 21, and the area is √(21 × 8 × 7 × 6) = √7056 = 84."],
        ["למשולש יש צלעות 13, 14 ו־15. חשבו את השטח שלו בעזרת נוסחת הרון.", "", "חצי ההיקף הוא s = (13 + 14 + 15) ÷ 2 = 21, והשטח הוא √(21 × 8 × 7 × 6) = √7056 = 84."]],
    ],
    s: [[["Finding the area of a triangle from its three sides with the cosine rule, in order", "Choose an angle, say C, between the sides a and b", "Find cos C with the cosine rule", "Find sin C from sin²C = 1 − cos²C", "Compute the area ½ab·sin C"],
      ["מציאת השטח של משולש לפי שלוש הצלעות בעזרת משפט הקוסינוסים, לפי הסדר", "בוחרים זווית, למשל C, שבין הצלעות a ו־b", "מוצאים את cos C בעזרת משפט הקוסינוסים", "מוצאים את sin C מ־sin²C = 1 − cos²C", "מחשבים את השטח ½ab·sin C"]]],
  },
};
export default c;
