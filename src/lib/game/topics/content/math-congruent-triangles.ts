import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Congruent triangles", "triangles with exactly the same shape and size, so one fits exactly on top of the other", "משולשים חופפים", "משולשים בעלי אותה צורה ואותו גודל בדיוק, כך שאחד מונח על השני ומתלכד איתו"],
      ["Corresponding sides", "sides that sit in matching positions in two triangles that are paired up", "צלעות מתאימות", "צלעות שנמצאות במקומות תואמים בשני משולשים שמותאמים זה לזה"],
      ["Isosceles triangle", "a triangle with two sides of equal length", "משולש שווה שוקיים", "משולש שיש בו שתי צלעות באותו אורך"],
    ],
    q: [
      [["Triangles ABC and DEF are congruent, with A matching D, B matching E and C matching F. Which side is equal to BC?", "EF", ["DE", "DF", "AC"], "B matches E and C matches F, so side BC matches side EF. The order of the letters in the names tells you which parts correspond."],
        ["המשולשים ABC ו־DEF חופפים, כאשר A מתאים ל־D, B מתאים ל־E ו־C מתאים ל־F. איזו צלע שווה ל־BC?", "EF", ["DE", "DF", "AC"], "B מתאים ל־E ו־C מתאים ל־F, ולכן הצלע BC מתאימה לצלע EF. סדר האותיות בשמות המשולשים אומר אילו חלקים מתאימים זה לזה."]],
      [["What does the symbol ≅ mean in △ABC ≅ △DEF?", "The triangles are congruent", ["The triangles are similar", "One triangle is twice the size of the other", "The triangles are parallel"], "≅ says that the two triangles are congruent, with the corners matched in the order written: A with D, B with E and C with F."],
        ["מה פירוש הסימן ≅ בכתיבה △ABC ≅ △DEF?", "המשולשים חופפים", ["המשולשים דומים", "משולש אחד גדול פי 2 מהשני", "המשולשים מקבילים"], "הסימן ≅ אומר ששני המשולשים חופפים, והקודקודים מותאמים לפי הסדר שבו נכתבו: A עם D, B עם E ו־C עם F."]],
      [["If two triangles are congruent, which of these must be true?", "Their corresponding angles are equal", ["They must face the same direction on the page", "They must both be right triangles", "One of them has a larger area"], "Congruent triangles match exactly, so every pair of corresponding sides and angles is equal. They may be turned or flipped, and they need not be right triangles."],
        ["אם שני משולשים חופפים, מה מהבאים חייב להיות נכון?", "הזוויות המתאימות שלהם שוות", ["הם חייבים לפנות לאותו כיוון בדף", "שניהם חייבים להיות ישרי זווית", "לאחד מהם יש שטח גדול יותר"], "משולשים חופפים מתלכדים בדיוק, ולכן כל זוג של צלעות מתאימות וכל זוג של זוויות מתאימות שווים. הם יכולים להיות מסובבים או הפוכים, והם לא חייבים להיות ישרי זווית."]],
      [["Two triangles both have angles of 50°, 60° and 70°. Are they congruent?", "Not necessarily: one may be bigger than the other", ["Yes, always, because all three angles match", "Only if they are facing the same direction", "No, never: two triangles cannot share all their angles"], "Equal angles give the same shape but not the same size: a small and a large triangle can both have angles of 50°, 60° and 70°. Such triangles are similar, but not necessarily congruent."],
        ["לשני משולשים יש זוויות של 50°, 60° ו־70°. האם הם חופפים?", "לא בהכרח: אחד מהם יכול להיות גדול מהשני", ["כן, תמיד, כי כל שלוש הזוויות שוות", "רק אם הם פונים לאותו כיוון", "אף פעם לא: לשני משולשים לא יכולות להיות אותן זוויות"], "זוויות שוות נותנות אותה צורה, אבל לא אותו גודל: גם למשולש קטן וגם למשולש גדול יכולות להיות זוויות של 50°, 60° ו־70°. משולשים כאלה דומים, אבל לא בהכרח חופפים."]],
      [["Which pair of triangles is certainly congruent?", "One with sides 3, 4, 5 cm and one with sides 5, 3, 4 cm", ["Two triangles whose angles are 30°, 60° and 90° in both", "Two triangles that each have one side of 5 cm", "Two triangles that each have an area of 6 cm²"], "Both have sides of 3, 4 and 5 cm, just listed in another order, so they are congruent by SSS. Equal angles, one equal side or equal areas are not enough."],
        ["איזה זוג משולשים חופף בוודאות?", "משולש עם צלעות 3, 4, 5 ס״מ ומשולש עם צלעות 5, 3, 4 ס״מ", ["שני משולשים שהזוויות של שניהם הן 30°, 60° ו־90°", "שני משולשים שלכל אחד מהם יש צלע של 5 ס״מ", "שני משולשים שהשטח של כל אחד מהם 6 סמ״ר"], "לשניהם יש צלעות של 3, 4 ו־5 ס״מ, רק בסדר אחר, ולכן הם חופפים לפי צ־צ־צ. זוויות שוות, צלע אחת שווה או שטח שווה לא מספיקים."]],
    ],
    n: [
      [70, ["In an isosceles triangle the angle between the two equal sides is 40°. How big is each base angle?", "degrees", "The two base angles are equal and all three angles add up to 180°: (180 − 40) ÷ 2 = 70°."],
        ["במשולש שווה שוקיים הזווית שבין שתי השוקיים היא 40°. מה גודלה של כל אחת מזוויות הבסיס?", "מעלות", "שתי זוויות הבסיס שוות, וסכום שלוש הזוויות הוא 180°: (180 − 40) ÷ 2 = 70°."]],
      [6, ["△ABC ≅ △PQR, with AB = 7 cm, BC = 9 cm and PR = 6 cm. How long is AC?", "cm", "A matches P and C matches R, so AC corresponds to PR and has the same length: 6 cm."],
        ["△ABC ≅ △PQR, ונתון AB = 7 ס״מ, BC = 9 ס״מ ו־PR = 6 ס״מ. מה אורך AC?", "ס״מ", "A מתאים ל־P ו־C מתאים ל־R, ולכן AC מתאימה ל־PR ואורכה זהה: 6 ס״מ."]],
    ],
  },
  i: {
    t: [
      ["SAS (side, angle, side)", "two sides and the angle between them are equal in both triangles", "צ־ז־צ (צלע, זווית, צלע)", "שתי צלעות והזווית שביניהן שוות בשני המשולשים"],
      ["ASA (angle, side, angle)", "two angles and the side between them are equal in both triangles", "ז־צ־ז (זווית, צלע, זווית)", "שתי זוויות והצלע שביניהן שוות בשני המשולשים"],
      ["SSS (side, side, side)", "the three sides of one triangle are equal to the three sides of the other", "צ־צ־צ (צלע, צלע, צלע)", "שלוש הצלעות של משולש אחד שוות לשלוש הצלעות של המשולש השני"],
    ],
    q: [
      [["In triangles ABC and DEF, AB = DE, ∠B = ∠E and BC = EF. Which test shows that they are congruent?", "SAS", ["ASA", "SSS", "AAA"], "The equal angles, ∠B and ∠E, lie between the two pairs of equal sides, so this is side, angle, side: SAS."],
        ["במשולשים ABC ו־DEF נתון AB = DE, ∠B = ∠E ו־BC = EF. לפי איזה משפט הם חופפים?", "צ־ז־צ", ["ז־צ־ז", "צ־צ־צ", "ז־ז־ז"], "הזוויות השוות, ∠B ו־∠E, נמצאות בין שני זוגות הצלעות השוות, ולכן זה צלע, זווית, צלע: צ־ז־צ."]],
      [["Triangles ABC and DEF have ∠A = ∠D = 40°, ∠B = ∠E = 75° and AB = DE = 6 cm. Which is true?", "They are congruent by ASA", ["They are congruent by SAS", "They are similar but not congruent", "There is not enough information"], "Side AB lies between angles A and B, and DE lies between D and E, so two angles and the side between them match: ASA."],
        ["במשולשים ABC ו־DEF נתון ∠A = ∠D = 40°, ∠B = ∠E = 75° ו־AB = DE = 6 ס״מ. מה נכון?", "הם חופפים לפי ז־צ־ז", ["הם חופפים לפי צ־ז־צ", "הם דומים אבל לא חופפים", "אין מספיק נתונים"], "הצלע AB נמצאת בין הזוויות A ו־B, ו־DE נמצאת בין D ו־E, ולכן שתי זוויות והצלע שביניהן שוות: ז־צ־ז."]],
      [["Why is 'three equal angles' not a test of congruence?", "Triangles with the same angles can still be different sizes", ["Two different triangles can never have all three of their angles equal", "Angles can never be measured exactly enough", "It only works for right triangles"], "A triangle with angles of 30°, 60° and 90° can be tiny or huge. Equal angles fix the shape but not the size, so they show that the triangles are similar, not that they are congruent."],
        ["למה ״שלוש זוויות שוות״ אינו משפט חפיפה?", "משולשים עם אותן זוויות יכולים להיות בגדלים שונים", ["לשני משולשים שונים לעולם אין שלוש זוויות שוות", "אי אפשר למדוד זוויות בדיוק מספיק", "זה נכון רק במשולשים ישרי זווית"], "משולש עם זוויות של 30°, 60° ו־90° יכול להיות זעיר או ענק. זוויות שוות קובעות את הצורה, אבל לא את הגודל, ולכן הן מראות שהמשולשים דומים, ולא שהם חופפים."]],
      [["In triangle ABC, AB = AC and M is the midpoint of BC. What is true about the line AM?", "It is perpendicular to BC", ["It is parallel to BC", "It is longer than AB", "It cuts the angle at B in half"], "Triangles ABM and ACM are congruent by SSS: AB = AC, BM = CM and AM is shared. So ∠AMB = ∠AMC, and since together they make 180°, each is 90°."],
        ["במשולש ABC נתון AB = AC, ו־M היא אמצע הצלע BC. מה נכון לגבי הקטע AM?", "הוא מאונך ל־BC", ["הוא מקביל ל־BC", "הוא ארוך מ־AB", "הוא חוצה את הזווית B"], "המשולשים ABM ו־ACM חופפים לפי צ־צ־צ: AB = AC, BM = CM ו־AM משותפת. לכן ∠AMB = ∠AMC, ומכיוון שיחד הן 180°, כל אחת מהן היא 90°."]],
      [["Triangles ABC and DEF have AB = DE, BC = EF and AC = DF. Which angle is equal to ∠C?", "∠F", ["∠E", "∠D", "∠A"], "By SSS the triangles are congruent with A matching D, B matching E and C matching F, so ∠C = ∠F. Equal angles lie opposite equal sides: ∠C faces AB and ∠F faces DE."],
        ["במשולשים ABC ו־DEF נתון AB = DE, BC = EF ו־AC = DF. איזו זווית שווה ל־∠C?", "∠F", ["∠E", "∠D", "∠A"], "לפי צ־צ־צ המשולשים חופפים, כאשר A מתאים ל־D, B ל־E ו־C ל־F, ולכן ∠C = ∠F. זוויות שוות נמצאות מול צלעות שוות: ∠C מול AB ו־∠F מול DE."]],
    ],
    n: [
      [65, ["In triangle ABC, AB = AC and ∠A = 50°. How big is ∠B?", "degrees", "The angles opposite the equal sides are equal, so ∠B = ∠C = (180 − 50) ÷ 2 = 65°."],
        ["במשולש ABC נתון AB = AC ו־∠A = 50°. מה גודלה של ∠B?", "מעלות", "הזוויות שמול הצלעות השוות שוות זו לזו, ולכן ∠B = ∠C = (180 − 50) ÷ 2 = 65°."]],
      [60, ["△ABC ≅ △KLM, with ∠A = 35° and ∠L = 85°. How big is ∠M?", "degrees", "∠L matches ∠B, so ∠B = 85°. ∠M matches ∠C, and ∠C = 180 − 35 − 85 = 60°."],
        ["△ABC ≅ △KLM, ונתון ∠A = 35° ו־∠L = 85°. מה גודלה של ∠M?", "מעלות", "∠L מתאימה ל־∠B, ולכן ∠B = 85°. ∠M מתאימה ל־∠C, ו־∠C = 180 − 35 − 85 = 60°."]],
    ],
    s: [
      [["Writing a congruence proof", "Mark the given equal sides and angles on the drawing", "Find three pairs of equal parts in matching positions", "Name the congruence test that fits those parts", "State that the two triangles are congruent", "Conclude that the remaining corresponding parts are equal"],
        ["כתיבת הוכחה של חפיפת משולשים", "מסמנים בשרטוט את הצלעות ואת הזוויות השוות הנתונות", "מוצאים שלושה זוגות של חלקים שווים במקומות מתאימים", "קובעים איזה משפט חפיפה מתאים לחלקים האלה", "קובעים ששני המשולשים חופפים", "מסיקים שגם שאר החלקים המתאימים שווים"]],
    ],
  },
  a: {
    t: [
      ["SSA with the longer side", "two sides and the angle opposite the longer of them are equal in both triangles", "צ־צ־ז מול הצלע הגדולה", "שתי צלעות והזווית שמול הגדולה מביניהן שוות בשני המשולשים"],
      ["Perpendicular bisector", "the line that crosses a segment at its midpoint and at a right angle", "האנך האמצעי", "הישר שחוצה קטע באמצעו ויוצר איתו זווית ישרה"],
      ["Angle bisector", "a ray that splits an angle into two equal parts", "חוצה זווית", "קרן שמחלקת זווית לשני חלקים שווים"],
    ],
    q: [
      [["Point P lies on the perpendicular bisector of segment AB. What is always true?", "PA = PB", ["PA = 2 × PB", "P is the midpoint of AB", "∠PAB = 90°"], "If M is the midpoint of AB, triangles PMA and PMB are congruent by SAS (MA = MB, a right angle at M, PM shared), so PA = PB. P is the midpoint only if it lies on AB itself."],
        ["הנקודה P נמצאת על האנך האמצעי לקטע AB. מה נכון תמיד?", "PA = PB", ["PA = 2 × PB", "P היא אמצע הקטע AB", "∠PAB = 90°"], "אם M היא אמצע AB, המשולשים PMA ו־PMB חופפים לפי צ־ז־צ (MA = MB, זווית ישרה ב־M, ו־PM משותפת), ולכן PA = PB. הנקודה P היא אמצע הקטע רק אם היא נמצאת על AB עצמו."]],
      [["The diagonals of parallelogram ABCD cross at O. Which pair of triangles is congruent, and by which test?", "AOB and COD, by ASA", ["AOB and COD, by AAA", "AOB and BOC, by SSS", "AOB and AOD, by SAS"], "AB = CD as opposite sides, and AB ∥ CD gives equal alternate angles ∠OAB = ∠OCD and ∠OBA = ∠ODC: angle, side, angle. AAA is never a congruence test."],
        ["האלכסונים של המקבילית ABCD נחתכים בנקודה O. איזה זוג משולשים חופף, ולפי איזה משפט?", "AOB ו־COD, לפי ז־צ־ז", ["AOB ו־COD, לפי ז־ז־ז", "AOB ו־BOC, לפי צ־צ־צ", "AOB ו־AOD, לפי צ־ז־צ"], "AB = CD כצלעות נגדיות, ומכיוון ש־AB ∥ CD, הזוויות המתחלפות שוות: ∠OAB = ∠OCD ו־∠OBA = ∠ODC. זה זווית, צלע, זווית. ז־ז־ז אינו משפט חפיפה בכלל."]],
      [["Why is SSA, with the angle opposite the shorter side, not a test of congruence?", "Two different triangles can fit the same three facts", ["The angle is never next to either one of the two given sides", "It always gives a triangle with no area", "It only works when the triangle has equal sides"], "With the angle facing the shorter side, that side can swing into two different positions and close the triangle in two ways. Facing the longer side, only one triangle is possible, which is why that version is a test."],
        ["למה צ־צ־ז, כשהזווית נמצאת מול הצלע הקצרה, אינו משפט חפיפה?", "שני משולשים שונים יכולים להתאים לאותם שלושה נתונים", ["הזווית אף פעם לא צמודה לאף אחת משתי הצלעות הנתונות", "תמיד מתקבל משולש שאין לו שטח", "זה נכון רק במשולש שכל צלעותיו שוות"], "כשהזווית מול הצלע הקצרה, הצלע הזו יכולה להסתובב לשני מקומות שונים ולסגור את המשולש בשתי דרכים. כשהזווית מול הצלע הגדולה, יש רק משולש אחד אפשרי, ולכן הגרסה הזו היא משפט חפיפה."]],
      [["In kite ABCD, AB = AD and CB = CD. What does the congruence of triangles ABC and ADC prove?", "The diagonal AC cuts the angles at A and C in half", ["The diagonal BD cuts the angles at B and D in half", "The two diagonals of the kite are equal in length", "All four sides of the kite are equal"], "Triangles ABC and ADC are congruent by SSS, with AC shared, so ∠BAC = ∠DAC and ∠BCA = ∠DCA. Nothing forces BD to bisect its angles, or the sides to be equal."],
        ["בדלתון ABCD נתון AB = AD ו־CB = CD. מה מוכיחה החפיפה של המשולשים ABC ו־ADC?", "האלכסון AC חוצה את הזוויות A ו־C", ["האלכסון BD חוצה את הזוויות B ו־D", "שני האלכסונים של הדלתון שווים באורכם", "כל ארבע הצלעות של הדלתון שוות"], "המשולשים ABC ו־ADC חופפים לפי צ־צ־צ, כש־AC משותפת, ולכן ∠BAC = ∠DAC ו־∠BCA = ∠DCA. שום דבר לא מחייב ש־BD יחצה את הזוויות שלו, או שהצלעות יהיו שוות."]],
      [["In triangle ABC, AB = AC, and the bisector of angle A meets BC at D. Which statement is NOT always true?", "AD = BD", ["BD = CD", "AD ⊥ BC", "∠B = ∠C"], "Triangles ABD and ACD are congruent by SAS (AB = AC, equal halves of angle A, AD shared), so BD = CD, ∠B = ∠C and both angles at D are 90°. AD equals BD only in the special case where angle A is 90°."],
        ["במשולש ABC נתון AB = AC, וחוצה הזווית A פוגש את BC בנקודה D. איזו טענה אינה נכונה תמיד?", "AD = BD", ["BD = CD", "AD ⊥ BC", "∠B = ∠C"], "המשולשים ABD ו־ACD חופפים לפי צ־ז־צ (AB = AC, שני חצאים שווים של הזווית A, ו־AD משותפת), ולכן BD = CD, ∠B = ∠C ושתי הזוויות ב־D הן 90°. AD שווה ל־BD רק במקרה המיוחד שבו הזווית A היא 90°."]],
    ],
    n: [
      [20, ["In triangle ABC, AB = AC and ∠B = 70°. D is the point on BC with AD ⊥ BC. How big is ∠BAD?", "degrees", "In triangle ABD the angle at B is 70° and the angle at D is 90°, so ∠BAD = 180 − 90 − 70 = 20°. It is half of ∠A = 40°, because AD also bisects angle A."],
        ["במשולש ABC נתון AB = AC ו־∠B = 70°. D היא הנקודה על BC שעבורה AD ⊥ BC. מה גודלה של ∠BAD?", "מעלות", "במשולש ABD הזווית ב־B היא 70° והזווית ב־D היא 90°, ולכן ∠BAD = 180 − 90 − 70 = 20°. זו מחצית מ־∠A = 40°, כי AD גם חוצה את הזווית A."]],
      [8, ["In triangle ABC, AB = AC = 10 cm and BC = 12 cm. M is the midpoint of BC. How long is AM?", "cm", "In an isosceles triangle AM is perpendicular to BC, and BM = 6 cm. By Pythagoras, AM² = 10² − 6² = 100 − 36 = 64, so AM = 8 cm."],
        ["במשולש ABC נתון AB = AC = 10 ס״מ ו־BC = 12 ס״מ. M היא אמצע BC. מה אורך AM?", "ס״מ", "במשולש שווה שוקיים AM מאונך ל־BC, ו־BM = 6 ס״מ. לפי משפט פיתגורס AM² = 10² − 6² = 100 − 36 = 64, ולכן AM = 8 ס״מ."]],
    ],
  },
};
export default c;
