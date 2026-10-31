import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Sorting", "putting things into groups so that each group shares a feature", "מיון", "סידור של דברים בקבוצות כך שלכל קבוצה יש תכונה משותפת"],
      ["Attribute", "a feature of something, such as its colour, shape or size", "תכונה", "מאפיין של משהו, כמו הצבע, הצורה או הגודל שלו"],
      ["Odd one out", "the item in a set that lacks what all the others have in common", "יוצא הדופן", "הפריט בקבוצה שחסר לו מה שמשותף לכל השאר"],
    ],
    q: [
      [["Sorting animals by their group, which is the odd one out: dog, cat, eagle, horse?", "eagle", ["horse", "cat", "dog"], "The dog, the cat and the horse are mammals with four legs and fur. The eagle is a bird with two legs, wings and feathers."],
        ["כשממיינים בעלי חיים לפי הקבוצה שלהם, מי יוצא הדופן: כלב, חתול, נשר, סוס?", "נשר", ["סוס", "חתול", "כלב"], "הכלב, החתול והסוס הם יונקים עם ארבע רגליים ופרווה. הנשר הוא ציפור עם שתי רגליים, כנפיים ונוצות."]],
      [["A group has the numbers 2, 4, 8 and 10. Which number also belongs in it?", "6", ["7", "9", "5"], "Every number in the group is even, so it can be split into two equal halves. 6 is even; 5, 7 and 9 are odd."],
        ["בקבוצה יש את המספרים 2, 4, 8 ו־10. איזה מספר שייך גם הוא לקבוצה?", "6", ["7", "9", "5"], "כל המספרים בקבוצה זוגיים, כלומר אפשר לחלק אותם לשני חצאים שווים. 6 זוגי, ואילו 5, 7 ו־9 אי־זוגיים."]],
      [["Which word names the whole group: oak, pine, palm?", "trees", ["leaves", "flowers", "fruits"], "Oak, pine and palm are all kinds of trees. Trees have leaves, but leaves are only one part of a tree, not the name of the group."],
        ["איזו מילה היא השם של כל הקבוצה: אלון, אורן, דקל?", "עצים", ["עלים", "פרחים", "פירות"], "אלון, אורן ודקל הם כולם סוגים של עצים. לעצים יש עלים, אבל העלים הם רק חלק מהעץ ולא השם של הקבוצה."]],
      [["Which animal belongs with the shark, the octopus and the dolphin?", "whale", ["camel", "lion", "eagle"], "The shark, the octopus and the dolphin all live in the sea, and so does the whale. Camels, lions and eagles live on land or in the air."],
        ["איזו חיה שייכת לקבוצה של הכריש, התמנון והדולפין?", "לווייתן", ["גמל", "אריה", "נשר"], "הכריש, התמנון והדולפין חיים כולם בים, וגם הלווייתן. גמלים, אריות ונשרים חיים ביבשה או באוויר."]],
      [["A Venn diagram has a circle for 'red things' and a circle for 'fruits'. Where does a strawberry go?", "In the part where the circles overlap", ["Only inside the 'fruits' circle", "Only inside the 'red things' circle", "Outside both of the circles"], "A strawberry is red and it is a fruit, so it belongs to both groups at once. Things in both groups go where the two circles overlap."],
        ["בדיאגרמת ון יש עיגול של ״דברים אדומים״ ועיגול של ״פירות״. איפה מקומו של תות שדה?", "בחלק המשותף לשני העיגולים", ["רק בתוך העיגול של ״פירות״", "רק בתוך העיגול של ״דברים אדומים״", "מחוץ לשני העיגולים"], "תות שדה הוא אדום והוא גם פרי, ולכן הוא שייך לשתי הקבוצות בבת אחת. דברים ששייכים לשתי הקבוצות נמצאים בחלק המשותף לשני העיגולים."]],
    ],
    n: [
      [7, ["In a class, 5 children like only cats, 3 like only dogs and 2 like both. How many children like cats?", "children", "The children who like cats are those who like only cats and those who like both: 5 + 2 = 7."],
        ["בכיתה 5 ילדים אוהבים רק חתולים, 3 אוהבים רק כלבים ו־2 אוהבים את שניהם. כמה ילדים אוהבים חתולים?", "ילדים", "אוהבי החתולים הם מי שאוהבים רק חתולים ומי שאוהבים את שניהם: 5 + 2 = 7."]],
      [5, ["How many odd numbers are there from 1 to 10?", "", "The odd numbers from 1 to 10 are 1, 3, 5, 7 and 9, so there are 5 of them. The other 5 numbers are even."],
        ["כמה מספרים אי־זוגיים יש מ־1 עד 10?", "", "המספרים האי־זוגיים מ־1 עד 10 הם 1, 3, 5, 7 ו־9, כלומר יש 5 כאלה. חמשת המספרים האחרים זוגיים."]],
    ],
  },
  i: {
    t: [
      ["Category", "a named set of things that share important features, like mammals or vehicles", "קטגוריה", "אוסף בעל שם של דברים שיש להם תכונות חשובות משותפות, כמו יונקים או כלי רכב"],
      ["Subgroup", "a smaller set inside a bigger one, like dogs inside mammals", "תת־קבוצה", "אוסף קטן יותר בתוך אוסף גדול, כמו כלבים בתוך היונקים"],
      ["Venn diagram", "a drawing of overlapping circles that shows which things belong to which sets", "דיאגרמת ון", "ציור של עיגולים חופפים שמראה אילו דברים שייכים לאילו אוספים"],
      ["Intersection", "the area where two circles cross, holding what belongs to both sets", "חיתוך", "האזור שבו שני עיגולים נפגשים, ובו מה ששייך לשני האוספים"],
    ],
    q: [
      [["Which of these is a subgroup of mammals?", "cats", ["animals", "birds", "fish"], "Cats are a smaller group inside the mammals. 'Animals' is a bigger group that contains the mammals, so it is the other way round."],
        ["איזו מהבאות היא תת־קבוצה של היונקים?", "חתולים", ["בעלי חיים", "ציפורים", "דגים"], "החתולים הם קבוצה קטנה יותר בתוך היונקים. ״בעלי חיים״ היא קבוצה גדולה יותר שמכילה את היונקים, כלומר ההפך."]],
      [["A Venn diagram has circles for 'can fly' and 'has feathers'. Where does a penguin go?", "Only in the 'has feathers' circle", ["In the part where the circles overlap", "Only in the 'can fly' circle", "Outside both of the circles"], "A penguin is a bird with feathers, but it cannot fly. So it belongs in 'has feathers' and not in 'can fly'."],
        ["בדיאגרמת ון יש עיגולים של ״יכול לעוף״ ושל ״יש לו נוצות״. איפה מקומו של פינגווין?", "רק בעיגול ״יש לו נוצות״", ["בחלק המשותף לשני העיגולים", "רק בעיגול ״יכול לעוף״", "מחוץ לשני העיגולים"], "פינגווין הוא ציפור עם נוצות, אבל הוא לא יכול לעוף. לכן הוא שייך לעיגול ״יש לו נוצות״ ולא לעיגול ״יכול לעוף״."]],
      [["In a Venn diagram of 'even numbers' and 'numbers greater than 10', where does 7 go?", "Outside both of the circles", ["Only in the 'even numbers' circle", "Only in the 'greater than 10' circle", "In the part where the circles overlap"], "7 is odd, so it is not in 'even numbers', and it is less than 10, so it is not in the other circle either. It goes outside both."],
        ["בדיאגרמת ון של ״מספרים זוגיים״ ושל ״מספרים גדולים מ־10״, איפה מקומו של 7?", "מחוץ לשני העיגולים", ["רק בעיגול ״מספרים זוגיים״", "רק בעיגול ״גדולים מ־10״", "בחלק המשותף לשני העיגולים"], "7 הוא אי־זוגי, ולכן הוא לא בעיגול ״מספרים זוגיים״, והוא קטן מ־10, ולכן הוא גם לא בעיגול השני. מקומו מחוץ לשניהם."]],
      [["Whales and dolphins live in the sea, yet they are grouped with mammals, not fish. Why?", "They breathe air and feed their young on milk", ["They are much bigger than every kind of fish", "They swim faster than any fish in the sea", "They live in shallow water near the coast"], "Scientists group animals by important features of their bodies and lives. Whales and dolphins breathe air with lungs and feed their babies milk, like other mammals."],
        ["לווייתנים ודולפינים חיים בים, ובכל זאת הם שייכים ליונקים ולא לדגים. למה?", "הם נושמים אוויר ומניקים את הצאצאים שלהם", ["הם גדולים בהרבה מכל סוגי הדגים", "הם שוחים מהר יותר מכל דג בים", "הם חיים במים רדודים ליד החוף"], "מדענים ממיינים בעלי חיים לפי תכונות חשובות של הגוף ושל אורח החיים. לווייתנים ודולפינים נושמים אוויר בריאות ומניקים את הגורים שלהם, כמו יונקים אחרים."]],
      [["Using the numbers 1 to 12, which numbers go where 'multiples of 2' and 'multiples of 3' overlap?", "6 and 12", ["6 only", "2, 3 and 6", "3, 6, 9 and 12"], "A number in the overlap must be in both lists: 2, 4, 6, 8, 10, 12 and 3, 6, 9, 12. Only 6 and 12 are in both."],
        ["מבין המספרים 1 עד 12, אילו מספרים נמצאים בחלק המשותף של ״כפולות של 2״ ו״כפולות של 3״?", "6 ו־12", ["רק 6", "2, 3 ו־6", "3, 6, 9 ו־12"], "מספר בחלק המשותף חייב להופיע בשתי הרשימות: 2, 4, 6, 8, 10, 12 וגם 3, 6, 9, 12. רק 6 ו־12 נמצאים בשתיהן."]],
    ],
    n: [[15, ["A Venn diagram shows 4 children only in circle A, 6 only in circle B, 3 in both, and 2 outside both circles. How many children are there in all?", "children", "Add every region once: 4 + 6 + 3 + 2 = 15. The 3 children in both circles are counted only one time."],
      ["בדיאגרמת ון יש 4 ילדים רק בעיגול א׳, 6 רק בעיגול ב׳, 3 בשני העיגולים ו־2 מחוץ לשניהם. כמה ילדים יש בסך הכול?", "ילדים", "מחברים כל אזור פעם אחת: 4 + 6 + 3 + 2 = 15. שלושת הילדים שבשני העיגולים נספרים רק פעם אחת."]]],
    s: [[["From the biggest group to the smallest", "Living things", "Animals", "Mammals", "Dogs", "Poodles"],
      ["מהקבוצה הגדולה ביותר אל הקטנה ביותר", "יצורים חיים", "בעלי חיים", "יונקים", "כלבים", "פודלים"]]],
  },
  a: {
    t: [
      ["Disjoint sets", "sets with no member in common, drawn as circles that do not touch", "קבוצות זרות", "אוספים שאין להם אף איבר משותף, ומציירים אותם כעיגולים שאינם נוגעים זה בזה"],
      ["Union", "everything that is in at least one of two sets", "איחוד", "כל מה שנמצא לפחות באחד משני אוספים"],
      ["Classification key", "a chain of yes-or-no questions that leads to the name of a living thing or group", "מפתח הגדרה", "שרשרת של שאלות כן ולא שמובילה לשם של יצור חי או של קבוצה"],
    ],
    q: [
      [["All squares are rectangles. How should the circles for 'squares' and 'rectangles' be drawn?", "The 'squares' circle inside the 'rectangles' circle", ["Two circles that only partly overlap", "The 'rectangles' circle inside the 'squares' circle", "Two separate circles that do not touch"], "Every square is a rectangle, but not every rectangle is a square, so the squares are a subgroup and their circle sits inside. Partly overlapping circles would mean some squares are not rectangles."],
        ["כל ריבוע הוא מלבן. איך צריך לצייר את העיגולים של ״ריבועים״ ושל ״מלבנים״?", "עיגול ״ריבועים״ בתוך עיגול ״מלבנים״", ["שני עיגולים שחופפים רק בחלקם", "עיגול ״מלבנים״ בתוך עיגול ״ריבועים״", "שני עיגולים נפרדים שאינם נוגעים"], "כל ריבוע הוא מלבן, אבל לא כל מלבן הוא ריבוע, ולכן הריבועים הם תת־קבוצה והעיגול שלהם נמצא בפנים. עיגולים שחופפים רק בחלקם היו אומרים שיש ריבועים שאינם מלבנים."]],
      [["In a Venn diagram, the 'birds' circle and the 'fish' circle do not overlap. What must be true?", "No animal in the diagram is both a bird and a fish", ["There are more birds than fish in the diagram", "Every animal in the diagram is a bird or a fish", "Some of the birds in the diagram can swim"], "Circles that do not overlap mean the sets are disjoint: nothing belongs to both. The picture says nothing about how many are in each circle or what lies outside them."],
        ["בדיאגרמת ון העיגול של ״ציפורים״ והעיגול של ״דגים״ אינם חופפים. מה חייב להיות נכון?", "אין בדיאגרמה בעל חיים שהוא גם ציפור וגם דג", ["יש בדיאגרמה יותר ציפורים מדגים", "כל בעל חיים בדיאגרמה הוא ציפור או דג", "חלק מהציפורים בדיאגרמה יודעות לשחות"], "עיגולים שאינם חופפים פירושם שהקבוצות זרות: אין דבר ששייך לשתיהן. הציור לא אומר כמה פריטים יש בכל עיגול או מה נמצא מחוץ לעיגולים."]],
      [["A key asks: 'Does it have a backbone?' No. 'Does it have six legs?' Yes: insect. Which animal reaches 'insect'?", "an ant", ["a spider", "a snail", "a frog"], "An ant has no backbone and six legs. A spider also has no backbone, but it has eight legs, and a frog has a backbone, so it leaves the key at the first question."],
        ["מפתח הגדרה שואל: ״יש לו עמוד שדרה?״ לא. ״יש לו שש רגליים?״ כן: חרק. איזה בעל חיים יגיע ל״חרק״?", "נמלה", ["עכביש", "חילזון", "צפרדע"], "לנמלה אין עמוד שדרה ויש לה שש רגליים. גם לעכביש אין עמוד שדרה, אבל יש לו שמונה רגליים, ולצפרדע יש עמוד שדרה, ולכן היא יוצאת מהמפתח כבר בשאלה הראשונה."]],
      [["Which rule sorts whole numbers so that every number fits in exactly one group?", "Whether the number is even or odd", ["Whether it is a multiple of 2 or of 3", "Whether it is a big or a small number", "Whether it is lucky or unlucky"], "Every whole number is either even or odd, never both. With multiples of 2 or 3, the number 6 fits both groups and 5 fits neither, and 'big' and 'lucky' have no clear border."],
        ["איזה כלל ממיין מספרים שלמים כך שכל מספר מתאים לקבוצה אחת בדיוק?", "אם המספר זוגי או אי־זוגי", ["אם הוא כפולה של 2 או כפולה של 3", "אם הוא מספר גדול או מספר קטן", "אם הוא מביא מזל או לא"], "כל מספר שלם הוא זוגי או אי־זוגי, ולעולם לא שניהם. בכפולות של 2 או של 3 המספר 6 מתאים לשתי הקבוצות ו־5 לאף אחת, ול״גדול״ ול״מביא מזל״ אין גבול ברור."]],
      [["To a botanist a tomato is a fruit, but a cook calls it a vegetable. What does this show?", "The group depends on which attributes the sorter uses", ["One of the two groupings has to be a mistake", "A tomato changes its group as it becomes ripe", "A tomato does not belong to any group at all"], "A botanist sorts by the plant part: a tomato holds seeds, so it is a fruit. A cook sorts by taste and use in meals. Both are sensible; they use different attributes."],
        ["בעיני בוטנאי עגבנייה היא פרי, אבל טבח קורא לה ירק. מה זה מראה?", "הקבוצה תלויה בתכונות שלפיהן ממיינים", ["אחד משני המיונים חייב להיות טעות", "העגבנייה מחליפה קבוצה כשהיא מבשילה", "העגבנייה לא שייכת לשום קבוצה"], "בוטנאי ממיין לפי חלק הצמח: בעגבנייה יש זרעים, ולכן היא פרי. טבח ממיין לפי הטעם והשימוש בארוחות. שני המיונים הגיוניים, פשוט לפי תכונות שונות."]],
    ],
    n: [
      [5, ["In a class of 30, 18 play football, 12 play chess and 5 play both. How many play neither?", "children", "Football or chess: 18 + 12 − 5 = 25, because the 5 who play both were counted twice. So 30 − 25 = 5 play neither."],
        ["בכיתה של 30 תלמידים, 18 משחקים כדורגל, 12 משחקים שחמט ו־5 משחקים את שניהם. כמה לא משחקים אף אחד מהם?", "ילדים", "כדורגל או שחמט: 18 + 12 − 5 = 25, כי החמישה שמשחקים את שניהם נספרו פעמיים. לכן 30 − 25 = 5 לא משחקים אף אחד מהם."]],
      [2, ["20 children each have a cat, a dog or both. 12 have a cat and 10 have a dog. How many have both?", "children", "12 + 10 = 22 counts 20 children, so 22 − 20 = 2 children were counted twice: they have both."],
        ["לכל אחד מ־20 ילדים יש חתול, כלב או שניהם. ל־12 יש חתול ול־10 יש כלב. לכמה ילדים יש את שניהם?", "ילדים", "12 + 10 = 22 סופר 20 ילדים, ולכן 22 − 20 = 2 ילדים נספרו פעמיים: יש להם את שניהם."]],
      [8, ["A Venn diagram has three circles that all overlap each other. Counting the area outside all the circles, how many separate regions are there?", "regions", "Three circles make 7 regions inside them: 3 for one circle only, 3 for two circles and 1 for all three. With the outside area that gives 8."],
        ["בדיאגרמת ון יש שלושה עיגולים שכולם חופפים זה לזה. אם סופרים גם את האזור שמחוץ לכל העיגולים, כמה אזורים נפרדים יש?", "אזורים", "בתוך שלושה עיגולים יש 7 אזורים: 3 של עיגול אחד בלבד, 3 של שני עיגולים ואזור אחד של שלושתם. עם האזור החיצוני מקבלים 8."]],
    ],
  },
};
export default c;
