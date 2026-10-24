import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Set", "a collection of distinct objects, often written inside curly brackets { }", "קבוצה", "אוסף של עצמים שונים זה מזה, שלעיתים קרובות כותבים אותם בתוך סוגריים מסולסלים { }"],
      ["Element", "one of the objects that belong to a set", "איבר", "אחד העצמים ששייכים לקבוצה"],
      ["Venn diagram", "a picture that uses overlapping circles to show groups and what they have in common", "דיאגרמת ון", "ציור שבו עיגולים חופפים מראים קבוצות ומה משותף להן"],
    ],
    q: [
      [["Which of these is an element of the set {2, 4, 6, 8}?", "6", ["10", "5", "3"], "The elements are exactly the numbers listed inside the brackets: 2, 4, 6 and 8. 10 is even too, but it is not in this set."],
        ["איזה מהמספרים האלה הוא איבר בקבוצה {2, 4, 6, 8}?", "6", ["10", "5", "3"], "האיברים הם בדיוק המספרים שרשומים בתוך הסוגריים: 2, 4, 6 ו־8. גם 10 זוגי, אבל הוא לא נמצא בקבוצה הזו."]],
      [["Which set is the same as {3, 1, 2}?", "{1, 2, 3}", ["{1, 2, 3, 4}", "{1, 2}", "{3, 2}"], "A set is decided only by its elements, not by their order, so {3, 1, 2} and {1, 2, 3} are the same set. The other sets have an element missing or an extra one."],
        ["איזו קבוצה שווה לקבוצה {3, 1, 2}?", "{1, 2, 3}", ["{1, 2, 3, 4}", "{1, 2}", "{3, 2}"], "קבוצה נקבעת רק לפי האיברים שלה, ולא לפי הסדר שלהם, ולכן {3, 1, 2} ו־{1, 2, 3} הן אותה קבוצה. בקבוצות האחרות חסר איבר או שיש איבר נוסף."]],
      [["In a Venn diagram of 'likes football' and 'likes basketball', where do you write a child who likes both?", "In the part where the two circles overlap", ["Inside the football circle, but outside the basketball one", "Outside both of the circles", "In both circles, written twice"], "The overlap belongs to both circles at once, so it holds everyone who is in both groups. Each child is written only once."],
        ["בדיאגרמת ון של ״אוהבים כדורגל״ ו״אוהבים כדורסל״, איפה כותבים ילד שאוהב את שניהם?", "בחלק שבו שני העיגולים חופפים", ["בתוך העיגול של הכדורגל, אבל מחוץ לעיגול של הכדורסל", "מחוץ לשני העיגולים", "בשני העיגולים, פעמיים"], "החלק החופף שייך לשני העיגולים בבת אחת, ולכן נמצאים בו כל מי ששייכים לשתי הקבוצות. כל ילד נכתב רק פעם אחת."]],
      [["What does 3 ∈ A mean?", "3 is an element of the set A", ["3 is the number of elements in A", "3 is not in the set A", "A is a part of the number 3"], "The symbol ∈ means 'is an element of'. To say that 3 is not in A, you write 3 ∉ A."],
        ["מה פירוש הכתיבה 3 ∈ A?", "3 הוא איבר בקבוצה A", ["3 הוא מספר האיברים בקבוצה A", "3 לא נמצא בקבוצה A", "A הוא חלק מהמספר 3"], "הסימן ∈ פירושו ״הוא איבר של״. כדי לומר ש־3 לא נמצא ב־A כותבים 3 ∉ A."]],
      [["Which set is exactly the set of even numbers between 1 and 9?", "{2, 4, 6, 8}", ["{0, 2, 4, 6, 8}", "{2, 4, 6, 8, 10}", "{1, 3, 5, 7, 9}"], "The even numbers greater than 1 and less than 9 are 2, 4, 6 and 8. 0 and 10 are even but lie outside that range, and 1, 3, 5, 7 and 9 are odd."],
        ["איזו קבוצה היא בדיוק קבוצת המספרים הזוגיים שבין 1 ל־9?", "{2, 4, 6, 8}", ["{0, 2, 4, 6, 8}", "{2, 4, 6, 8, 10}", "{1, 3, 5, 7, 9}"], "המספרים הזוגיים שגדולים מ־1 וקטנים מ־9 הם 2, 4, 6 ו־8. גם 0 ו־10 זוגיים, אבל הם מחוץ לתחום, ו־1, 3, 5, 7 ו־9 אי־זוגיים."]],
    ],
    n: [
      [9, ["12 children have a dog, 8 have a cat and 3 have both. How many children have a dog but no cat?", "", "The 3 children with both pets are in the overlap, so the 'dog only' part holds 12 − 3 = 9 children."],
        ["ל־12 ילדים יש כלב, ל־8 יש חתול ול־3 יש את שניהם. לכמה ילדים יש כלב בלי חתול?", "", "3 הילדים שיש להם את שתי החיות נמצאים בחלק החופף, ולכן בחלק של ״רק כלב״ יש 12 − 3 = 9 ילדים."]],
      [4, ["How many elements does the set {red, blue, green, yellow} have?", "", "Each colour is one element and they are all different: red, blue, green and yellow make 4 elements."],
        ["כמה איברים יש בקבוצה {אדום, כחול, ירוק, צהוב}?", "", "כל צבע הוא איבר אחד, וכולם שונים זה מזה: אדום, כחול, ירוק וצהוב הם 4 איברים."]],
    ],
  },
  i: {
    t: [
      ["Union", "all the elements that are in at least one of two sets, written A ∪ B", "איחוד", "כל האיברים שנמצאים לפחות באחת משתי קבוצות, ונכתב A ∪ B"],
      ["Intersection", "the elements that are in both sets at the same time, written A ∩ B", "חיתוך", "האיברים שנמצאים בשתי הקבוצות בבת אחת, ונכתב A ∩ B"],
      ["Subset", "a set whose elements all belong to another set too, written A ⊆ B", "תת־קבוצה", "קבוצה שכל האיברים שלה שייכים גם לקבוצה אחרת, ונכתבת A ⊆ B"],
      ["Empty set", "the set with no elements at all, written ∅ or { }", "הקבוצה הריקה", "קבוצה שאין בה אף איבר, ונכתבת ∅ או { }"],
    ],
    q: [
      [["A = {1, 2, 3, 4} and B = {3, 4, 5}. What is A ∩ B?", "{3, 4}", ["{1, 2, 3, 4, 5}", "{1, 2, 5}", "{5}"], "The intersection holds only the elements in both sets: 3 and 4. {1, 2, 3, 4, 5} is the union, which holds the elements in either set."],
        ["A = {1, 2, 3, 4} ו־B = {3, 4, 5}. מהי הקבוצה A ∩ B?", "{3, 4}", ["{1, 2, 3, 4, 5}", "{1, 2, 5}", "{5}"], "בחיתוך נמצאים רק האיברים ששייכים לשתי הקבוצות: 3 ו־4. {1, 2, 3, 4, 5} הוא האיחוד, שבו נמצאים האיברים ששייכים לאחת מהן לפחות."]],
      [["P = {2, 3, 5, 7} and Q = {1, 3, 5, 9}. What is P ∪ Q?", "{1, 2, 3, 5, 7, 9}", ["{1, 2, 7, 9}", "{3, 5}", "{1, 2, 3, 4, 5, 6, 7, 8, 9}"], "The union holds every element that is in P or in Q, each written once: 1, 2, 3, 5, 7 and 9. {3, 5} is the intersection."],
        ["P = {2, 3, 5, 7} ו־Q = {1, 3, 5, 9}. מהי הקבוצה P ∪ Q?", "{1, 2, 3, 5, 7, 9}", ["{1, 2, 7, 9}", "{3, 5}", "{1, 2, 3, 4, 5, 6, 7, 8, 9}"], "באיחוד נמצא כל איבר ששייך ל־P או ל־Q, וכל אחד נכתב פעם אחת: 1, 2, 3, 5, 7 ו־9. {3, 5} הוא החיתוך."]],
      [["A = {2, 4} and B = {1, 2, 3, 4}. Which statement is true?", "A is a subset of B", ["B is a subset of A", "A and B have no elements in common", "A and B are equal sets"], "Every element of A, 2 and 4, is also in B, so A ⊆ B. B is not a subset of A, because 1 and 3 are not in A."],
        ["A = {2, 4} ו־B = {1, 2, 3, 4}. איזו טענה נכונה?", "A היא תת־קבוצה של B", ["B היא תת־קבוצה של A", "אין ל־A ול־B אף איבר משותף", "A ו־B הן קבוצות שוות"], "כל איבר של A, כלומר 2 ו־4, נמצא גם ב־B, ולכן A ⊆ B. B אינה תת־קבוצה של A, כי 1 ו־3 לא נמצאים ב־A."]],
      [["What is the intersection of the set of even numbers and the set of odd numbers?", "The empty set ∅", ["The set {0, 1}", "The set of all whole numbers", "The set of prime numbers"], "No whole number is both even and odd, so the two sets have nothing in common and their intersection is empty. The set of all whole numbers is their union."],
        ["מהו החיתוך של קבוצת המספרים הזוגיים וקבוצת המספרים האי־זוגיים?", "הקבוצה הריקה ∅", ["הקבוצה {0, 1}", "קבוצת כל המספרים השלמים", "קבוצת המספרים הראשוניים"], "אין מספר שלם שהוא גם זוגי וגם אי־זוגי, ולכן לשתי הקבוצות אין שום דבר משותף והחיתוך שלהן ריק. קבוצת כל המספרים השלמים היא האיחוד שלהן."]],
      [["How many elements does the set {1, 1, 2, 2, 2, 3} have?", "3", ["6", "4", "1"], "Writing an element again does not add a new one: this is just the set {1, 2, 3}, so it has 3 elements."],
        ["כמה איברים יש בקבוצה {1, 1, 2, 2, 2, 3}?", "3", ["6", "4", "1"], "כשכותבים איבר שוב, לא נוסף איבר חדש: זו פשוט הקבוצה {1, 2, 3}, ולכן יש בה 3 איברים."]],
    ],
    n: [
      [4, ["In a group of 30 students, 18 study French, 15 study Spanish and 7 study both. How many study neither?", "", "Students in at least one of the groups: 18 + 15 − 7 = 26, because the 7 were counted twice. So 30 − 26 = 4 study neither."],
        ["בקבוצה של 30 תלמידים, 18 לומדים צרפתית, 15 לומדים ספרדית ו־7 לומדים את שתיהן. כמה לא לומדים אף אחת מהשתיים?", "", "התלמידים שלומדים לפחות שפה אחת: 18 + 15 − 7 = 26, כי את ה־7 ספרנו פעמיים. לכן 30 − 26 = 4 לא לומדים אף אחת."]],
      [8, ["A = {1, 2, 3, 4, 5, 6} and B = {4, 5, 6, 7, 8}. How many elements are in A ∪ B?", "", "The union is {1, 2, 3, 4, 5, 6, 7, 8}: 6 + 5 = 11, minus the 3 shared elements that were counted twice, gives 8."],
        ["A = {1, 2, 3, 4, 5, 6} ו־B = {4, 5, 6, 7, 8}. כמה איברים יש בקבוצה A ∪ B?", "", "האיחוד הוא {1, 2, 3, 4, 5, 6, 7, 8}: 6 + 5 = 11, פחות 3 האיברים המשותפים שנספרו פעמיים, נותן 8."]],
    ],
  },
  a: {
    t: [
      ["Complement", "all the elements of the universal set that are not in a given set, written A′", "משלים", "כל האיברים של הקבוצה האוניברסלית שאינם בקבוצה נתונה, ונכתב A′"],
      ["Universal set", "the set of everything under discussion in a problem, drawn as the rectangle around a Venn diagram", "הקבוצה האוניברסלית", "קבוצת כל העצמים שבהם עוסקת הבעיה, ומציירים אותה כמלבן שמסביב לדיאגרמת ון"],
      ["Disjoint sets", "two sets that have no element in common", "קבוצות זרות", "שתי קבוצות שאין להן אף איבר משותף"],
    ],
    q: [
      [["U = {1, 2, …, 10} and A is the set of even numbers in U. What is A′?", "{1, 3, 5, 7, 9}", ["{2, 4, 6, 8, 10}", "{1, 3, 5, 7, 9, 11}", "{ }"], "The complement holds the elements of U that are not in A: the odd numbers from 1 to 9. 11 is not in U, so it cannot be in A′."],
        ["U = {1, 2, …, 10}, ו־A היא קבוצת המספרים הזוגיים ב־U. מהי A′?", "{1, 3, 5, 7, 9}", ["{2, 4, 6, 8, 10}", "{1, 3, 5, 7, 9, 11}", "{ }"], "במשלים נמצאים האיברים של U שאינם ב־A: המספרים האי־זוגיים מ־1 עד 9. המספר 11 לא נמצא ב־U, ולכן הוא לא יכול להיות ב־A′."]],
      [["Which region of a Venn diagram of A and B shows (A ∪ B)′?", "The part of the rectangle outside both circles", ["The part where the two circles overlap", "The part of circle A that lies outside of circle B", "Both circles together, including the overlap"], "A ∪ B is everything inside the circles, so its complement is what is left of the rectangle outside both of them."],
        ["איזה אזור בדיאגרמת ון של A ושל B מראה את (A ∪ B)′?", "החלק של המלבן שמחוץ לשני העיגולים", ["החלק שבו שני העיגולים חופפים", "החלק של העיגול A שנמצא מחוץ לעיגול B", "שני העיגולים יחד, כולל החלק החופף"], "A ∪ B הוא כל מה שבתוך העיגולים, ולכן המשלים שלו הוא מה שנשאר מהמלבן מחוץ לשניהם."]],
      [["A ⊆ B and B ⊆ A. What can you conclude?", "A and B are equal sets", ["A and B are disjoint sets", "A is the empty set", "A has more elements than B"], "Every element of A is in B and every element of B is in A, so they have exactly the same elements: A = B."],
        ["A ⊆ B וגם B ⊆ A. מה אפשר להסיק?", "A ו־B הן קבוצות שוות", ["A ו־B הן קבוצות זרות", "A היא הקבוצה הריקה", "ב־A יש יותר איברים מאשר ב־B"], "כל איבר של A נמצא ב־B וכל איבר של B נמצא ב־A, ולכן יש להן בדיוק אותם איברים: A = B."]],
      [["In a survey of 50 people, 30 drink tea, 25 drink coffee and 10 drink neither. How many drink both?", "15", ["5", "10", "25"], "40 people drink at least one of them (50 − 10). Since 30 + 25 = 55, the people who drink both were counted twice: 55 − 40 = 15."],
        ["בסקר של 50 אנשים, 30 שותים תה, 25 שותים קפה ו־10 לא שותים אף אחד מהם. כמה שותים את שניהם?", "15", ["5", "10", "25"], "40 אנשים שותים לפחות אחד מהם (50 − 10). מכיוון ש־30 + 25 = 55, מי ששותים את שניהם נספרו פעמיים: 55 − 40 = 15."]],
      [["Which set is always equal to (A ∩ B)′?", "A′ ∪ B′", ["A′ ∩ B′", "A ∪ B", "A′ ∩ B"], "Anything not in both sets is missing from A or missing from B, which is A′ ∪ B′ (one of De Morgan's laws). A′ ∩ B′ is the complement of the union instead."],
        ["איזו קבוצה שווה תמיד ל־(A ∩ B)′?", "A′ ∪ B′", ["A′ ∩ B′", "A ∪ B", "A′ ∩ B"], "מה שלא נמצא בשתי הקבוצות חסר ב־A או חסר ב־B, וזו הקבוצה A′ ∪ B′ (אחד מחוקי דה מורגן). A′ ∩ B′ הוא דווקא המשלים של האיחוד."]],
    ],
    n: [
      [7, ["Using n(A ∪ B) = n(A) + n(B) − n(A ∩ B): n(A) = 20, n(B) = 15 and n(A ∪ B) = 28. What is n(A ∩ B)?", "", "Put the numbers in: 28 = 20 + 15 − n(A ∩ B), so n(A ∩ B) = 35 − 28 = 7."],
        ["לפי n(A ∪ B) = n(A) + n(B) − n(A ∩ B): נתון n(A) = 20, n(B) = 15 ו־n(A ∪ B) = 28. מהו n(A ∩ B)?", "", "מציבים את המספרים: 28 = 20 + 15 − n(A ∩ B), ולכן n(A ∩ B) = 35 − 28 = 7."]],
      [8, ["How many subsets does the set {1, 2, 3} have, counting the empty set and the set itself?", "", "Each of the 3 elements is either in a subset or not, so there are 2 × 2 × 2 = 8 subsets: ∅, {1}, {2}, {3}, {1, 2}, {1, 3}, {2, 3} and {1, 2, 3}."],
        ["כמה תת־קבוצות יש לקבוצה {1, 2, 3}, כולל הקבוצה הריקה והקבוצה עצמה?", "", "כל אחד מ־3 האיברים נמצא בתת־קבוצה או לא נמצא בה, ולכן יש 2 × 2 × 2 = 8 תת־קבוצות: ∅, {1}, {2}, {3}, {1, 2}, {1, 3}, {2, 3} ו־{1, 2, 3}."]],
    ],
  },
};
export default c;
