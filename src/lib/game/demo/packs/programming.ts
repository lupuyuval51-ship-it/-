import { challengeStation, choice, loreStation, match, npc, numeric, program, sequence, translator, type Lang } from "../builders";
import type { DemoPack } from "../types";

export const programmingPack: DemoPack = {
  id: "programming",
  category: "programming",
  keywords: /program|code|coding|python|javascript|java\b|loop|variable|function|algorithm|software|develop|תכנות|קוד|פייתון|לולא|משתנ|פונקצ|אלגוריתם/i,
  gameType: "adventure",
  environment: "neon-city",
  timeOfDay: "night",
  title: (lang) => translator(lang)("Code Quest", "משימת קוד"),
  tagline: (lang) => translator(lang)("Restore the neon city by thinking like a programmer.", "החזירו את אורות עיר הניאון בעזרת חשיבה של מתכנתים."),

  build(lang: Lang) {
    const t = translator(lang);
    return {
      mechanics: ["collect", "dialogue", "portals", "gates", "checkpoints", "adaptive_difficulty", "jump"],
      objectives: [
        { id: "o-vars", text: t("Store and update values with variables", "לשמור ולעדכן ערכים בעזרת משתנים") },
        { id: "o-cond", text: t("Choose between paths with if / else", "לבחור בין מסלולים בעזרת if / else") },
        { id: "o-loop", text: t("Repeat work with loops instead of copying", "לחזור על פעולות בעזרת לולאות במקום להעתיק") },
        { id: "o-func", text: t("Reuse code by naming it in a function", "לשימוש חוזר בקוד בעזרת פונקציות") },
      ],
      conclusion: t(
        "You used variables to remember values, if/else to choose a path and loops to repeat work — the three tools behind almost every program. Next stop: functions, lists and your own projects.",
        "השתמשתם במשתנים כדי לזכור ערכים, ב-if/else כדי לבחור מסלול ובלולאות כדי לחזור על פעולות — שלושת הכלים שמאחורי כמעט כל תוכנית. התחנה הבאה: פונקציות, רשימות ופרויקטים משלכם.",
      ),
      areas: [
        {
          id: "a-plaza", name: t("Code Plaza", "כיכר הקוד"), size: "medium", layout: "plaza", hazardLevel: "low",
          description: t("A neon plaza where every sign runs on a tiny program. A bug has knocked the lights out.", "כיכר ניאון שבה כל שלט רץ על תוכנית קטנה. באג כיבה את האורות."),
          intro: t("The power is out. Find the terminals and fix the logic.", "החשמל נפל. מצאו את המסופים ותקנו את ההיגיון."),
          stations: [
            challengeStation("s-var1", t("Memory Box", "קופסת זיכרון"), "c-var1"),
            challengeStation("s-var2", t("Counter Terminal", "מסוף מונה"), "c-var2"),
            challengeStation("s-cond1", t("Fork Gate", "שער הפיצול"), "c-cond1"),
            challengeStation("s-loop1", t("Loop Reactor", "כור הלולאות"), "c-loop1"),
            loreStation("s-lore1", t("Info Kiosk", "עמדת מידע"), t("Why loops?", "למה לולאות?"), t("Computers are great at repetition. A loop lets you write an instruction once and run it hundreds of times — instead of copy-pasting it and hoping you never need to change it.", "מחשבים מצוינים בחזרות. לולאה מאפשרת לכתוב הוראה פעם אחת ולהריץ אותה מאות פעמים — במקום להעתיק ולהדביק ולקוות שלעולם לא נצטרך לשנות אותה.")),
            challengeStation("s-seq1", t("Program Builder", "בונה התוכניות"), "c-seq1"),
          ],
          npcs: [npc("n-byte", "Byte", t("Plaza keeper bot", "רובוט שומר הכיכר"), "#22e6ff", "robot", [
            t("Welcome, coder! The plaza's lights run on programs, and a bug knocked them out.", "ברוכים הבאים, מתכנתים! האורות בכיכר רצים על תוכניות, ובאג כיבה אותם."),
            t("Solve the terminals to bring the power back. Variables first!", "פתרו את המסופים כדי להחזיר את החשמל. קודם כל משתנים!"),
          ], t("Stuck? Terminals have hints — they cost a few points, but learning is worth it.", "תקועים? במסופים יש רמזים — הם עולים כמה נקודות, אבל הלמידה שווה את זה."))],
          collectibles: { kind: "data-core", count: 5, label: t("Data cores", "ליבות נתונים") },
          portal: { toAreaId: "a-lab", label: t("Portal to the Robot Lab", "פורטל למעבדת הרובוטים"), requiresMissionIds: ["m-loops"] },
        },
        {
          id: "a-lab", name: t("Robot Lab", "מעבדת הרובוטים"), size: "medium", layout: "corridor", hazardLevel: "none",
          description: t("A long corridor of workstations where robots wait to be programmed.", "מסדרון ארוך של עמדות עבודה שבהן רובוטים מחכים שיתכנתו אותם."),
          stations: [
            challengeStation("s-robot1", t("Walk the Hall", "ללכת במסדרון"), "c-prog1"),
            challengeStation("s-robot2", t("Climb the Stairs", "לטפס במדרגות"), "c-prog2"),
            challengeStation("s-cond2", t("Grade Machine", "מכונת הציונים"), "c-cond2"),
            challengeStation("s-func1", t("Function Forge", "מפעל הפונקציות"), "c-func1"),
          ],
          npcs: [npc("n-gear", "Dr. Gear", t("Robotics teacher", "מורה לרובוטיקה"), "#ff4fd8", "human", [
            t("Robots do exactly what you tell them — no more, no less.", "רובוטים עושים בדיוק מה שאומרים להם — לא יותר ולא פחות."),
            t("Use as few blocks as you can. A loop is worth a hundred copies.", "השתמשו בכמה שפחות בלוקים. לולאה שווה מאה העתקים."),
          ])],
          collectibles: { kind: "data-core", count: 4, label: t("Data cores", "ליבות נתונים") },
        },
      ],
      missions: [
        { id: "m-boot", title: t("Reboot the Plaza", "הפעלה מחדש של הכיכר"), areaId: "a-plaza", requires: [], story: t("Byte needs two values restored before anything else can start.", "בייט צריך שני ערכים משוחזרים לפני שמשהו אחר יוכל להתחיל."), objectives: [
          { type: "talk", text: t("Talk to Byte", "דברו עם בייט"), npcId: "n-byte" },
          { type: "solve", text: t("Repair the two variable terminals", "תקנו את שני מסופי המשתנים"), challengeIds: ["c-var1", "c-var2"] },
        ] },
        { id: "m-choices", title: t("A Fork in the Road", "פיצול בדרך"), areaId: "a-plaza", requires: ["m-boot"], story: t("The traffic lights only work when the program can choose.", "הרמזורים עובדים רק כשהתוכנית יכולה לבחור."), objectives: [
          { type: "solve", text: t("Open the Fork Gate", "פתחו את שער הפיצול"), challengeIds: ["c-cond1"] },
          { type: "collect", text: t("Collect 2 data cores", "אספו 2 ליבות נתונים"), count: 2 },
        ] },
        { id: "m-loops", title: t("Loop de Loop", "לולאה אחר לולאה"), areaId: "a-plaza", requires: ["m-choices"], story: t("The reactor repeats the same step over and over — make it count right.", "הכור חוזר על אותו צעד שוב ושוב — דאגו שיספור נכון."), objectives: [
          { type: "solve", text: t("Fix the reactor and rebuild the program", "תקנו את הכור ובנו מחדש את התוכנית"), challengeIds: ["c-loop1", "c-seq1"] },
          { type: "visit", text: t("Read the info kiosk", "קראו את עמדת המידע"), stationIds: ["s-lore1"] },
        ] },
        { id: "m-robot", title: t("Teach the Robot", "ללמד את הרובוט"), areaId: "a-lab", requires: ["m-loops"], story: t("Program the lab robot to reach the flag — with as few blocks as possible.", "תכנתו את רובוט המעבדה להגיע לדגל — בכמה שפחות בלוקים."), objectives: [
          { type: "talk", text: t("Talk to Dr. Gear", "דברו עם ד״ר גיר"), npcId: "n-gear" },
          { type: "solve", text: t("Program both robot courses", "תכנתו את שני מסלולי הרובוט"), challengeIds: ["c-prog1", "c-prog2"] },
        ] },
        { id: "m-final", title: t("Final Systems Check", "בדיקת מערכות אחרונה"), areaId: "a-lab", requires: ["m-robot"], story: t("Two last machines stand between you and a fully lit city.", "שתי מכונות אחרונות מפרידות בינכם לבין עיר מוארת לגמרי."), objectives: [
          { type: "solve", text: t("Pass the grade machine and the function forge", "עברו את מכונת הציונים ואת מפעל הפונקציות"), challengeIds: ["c-cond2", "c-func1"] },
          { type: "collect", text: t("Collect 2 data cores", "אספו 2 ליבות נתונים"), count: 2 },
        ] },
      ],
      challenges: [
        choice({ id: "c-var1", title: t("What is a variable?", "מהו משתנה?"), concept: t("variables", "משתנים"), level: 1, objectiveId: "o-vars",
          prompt: t("A variable is best described as…", "משתנה מתואר בצורה הטובה ביותר כ…"),
          options: [
            [t("A named box that stores a value", "קופסה בעלת שם ששומרת ערך"), t("Yes — you can put a value in, read it later and even replace it.", "נכון — אפשר להכניס ערך, לקרוא אותו אחר כך ואפילו להחליף אותו.")],
            [t("A command that repeats code", "פקודה שחוזרת על קוד"), t("That describes a loop. A variable stores a value rather than repeating anything.", "זה מתאר לולאה. משתנה שומר ערך ולא חוזר על דבר.")],
            [t("A mistake in the program", "טעות בתוכנית"), t("That would be a bug. Variables are an intentional, useful tool.", "זה יהיה באג. משתנים הם כלי מכוון ושימושי.")],
            [t("A kind of keyboard shortcut", "קיצור מקלדת"), t("Not quite — variables live inside the program, not on the keyboard.", "לא בדיוק — משתנים חיים בתוך התוכנית, לא במקלדת.")],
          ], correct: 0, hint: t("Think of a labelled box in which you can keep something.", "חשבו על קופסה עם תווית שאפשר לשמור בה משהו."),
          explanation: t("A variable gives a value a name so the program can remember it and change it later.", "משתנה נותן שם לערך כדי שהתוכנית תוכל לזכור אותו ולשנות אותו מאוחר יותר.") }),
        numeric({ id: "c-var2", title: t("Update the counter", "עדכון המונה"), concept: t("updating variables", "עדכון משתנים"), level: 1, objectiveId: "o-vars", easierId: "c-var2-easy",
          prompt: "x = 4\nx = x + 3\n" + t("What is the value of x now?", "מהו ערכו של x עכשיו?"), answer: 7,
          mistakes: [[4, t("That is x before the second line ran. Lines run in order, so x changes.", "זה x לפני שהשורה השנייה רצה. השורות רצות לפי הסדר, ולכן x משתנה.")], [3, t("x + 3 means 'the current x, plus 3' — not just 3.", "x + 3 פירושו 'ה-x הנוכחי, ועוד 3' — לא רק 3.")]],
          hint: t("Run line 1, then run line 2 using the NEW x.", "הריצו את שורה 1, ואז את שורה 2 עם ה-x החדש."),
          explanation: t("x starts at 4. The second line reads x (4), adds 3 and stores 7 back into x.", "x מתחיל ב-4. השורה השנייה קוראת את x‏ (4), מוסיפה 3 ושומרת 7 בחזרה ב-x.") }),
        numeric({ id: "c-var2-easy", title: t("Update the counter (warm-up)", "עדכון המונה (חימום)"), concept: t("updating variables", "עדכון משתנים"), level: 1, objectiveId: "o-vars",
          prompt: "y = 10\ny = y - 4\n" + t("What is y now?", "מהו y עכשיו?"), answer: 6,
          mistakes: [[10, t("That is y before the second line ran.", "זה y לפני שהשורה השנייה רצה.")], [4, t("y - 4 uses the current y, it does not replace it with 4.", "y - 4 משתמש ב-y הנוכחי, הוא לא מחליף אותו ב-4.")]],
          hint: t("Start at 10 and take away 4.", "התחילו מ-10 והפחיתו 4."), explanation: t("y was 10; the second line stores 10 − 4 = 6 back into y.", "y היה 10; השורה השנייה שומרת 10 − 4 = 6 בחזרה ב-y.") }),
        choice({ id: "c-cond1", title: t("Which path?", "איזה מסלול?"), concept: t("if / else", "תנאים"), level: 2, objectiveId: "o-cond",
          prompt: "age = 15\nif age >= 18:\n    print('adult')\nelse:\n    print('minor')\n" + t("What does this print?", "מה זה מדפיס?"),
          options: [
            ["adult", t("The condition age >= 18 is False for 15, so the if-branch is skipped.", "התנאי age >= 18 שגוי עבור 15, ולכן ענף ה-if מדולג.")],
            ["minor", t("Right — 15 >= 18 is False, so the else-branch runs.", "נכון — 15 >= 18 הוא שגוי, ולכן ענף ה-else רץ.")],
            [t("nothing", "כלום"), t("An if/else always runs exactly one of its two branches.", "if/else תמיד מריץ בדיוק אחד משני הענפים שלו.")],
            [t("an error", "שגיאה"), t("The code is valid Python; it just takes the else path.", "הקוד תקין; הוא פשוט הולך בענף ה-else.")],
          ], correct: 1, hint: t("Is 15 greater than or equal to 18?", "האם 15 גדול או שווה ל-18?"),
          explanation: t("An if/else tests a condition and runs exactly one branch: the if part when it is True, otherwise the else part.", "if/else בודק תנאי ומריץ בדיוק ענף אחד: את חלק ה-if כשהוא נכון, אחרת את חלק ה-else.") }),
        numeric({ id: "c-loop1", title: t("Count the loop", "לספור את הלולאה"), concept: t("for loops", "לולאות for"), level: 2, objectiveId: "o-loop", harderId: "c-loop1-hard",
          prompt: "total = 0\nfor i in range(3):\n    total = total + 2\n" + t("What is total at the end?", "מהו total בסוף?"), answer: 6,
          mistakes: [[4, t("range(3) runs the body 3 times (i = 0, 1, 2), not 2.", "range(3) מריץ את הגוף 3 פעמים (i = 0, 1, 2), לא 2.")], [8, t("That would be 4 repeats. range(3) gives exactly 3.", "זה יהיה 4 חזרות. range(3) נותן בדיוק 3.")], [2, t("That is only one pass. Add 2 for every repetition.", "זה רק מעבר אחד. מוסיפים 2 בכל חזרה.")]],
          hint: t("How many times does the body run? Add 2 each time.", "כמה פעמים הגוף רץ? הוסיפו 2 בכל פעם."),
          explanation: t("The loop body runs 3 times and adds 2 each time: 0 → 2 → 4 → 6.", "גוף הלולאה רץ 3 פעמים ומוסיף 2 בכל פעם: 0 ← 2 ← 4 ← 6.") }),
        numeric({ id: "c-loop1-hard", title: t("Count the loop (challenge)", "לספור את הלולאה (אתגר)"), concept: t("for loops", "לולאות for"), level: 3, objectiveId: "o-loop",
          prompt: "total = 0\nfor i in range(5):\n    total = total + i\n" + t("What is total at the end?", "מהו total בסוף?"), answer: 10,
          mistakes: [[15, t("i goes 0,1,2,3,4 — it never reaches 5.", "i עובר 0,1,2,3,4 — הוא לא מגיע ל-5.")], [5, t("total adds i each time, not 1.", "total מוסיף את i בכל פעם, לא 1.")]],
          hint: t("Add the values of i: 0 + 1 + 2 + 3 + 4.", "חברו את ערכי i: 0 + 1 + 2 + 3 + 4."), explanation: t("0 + 1 + 2 + 3 + 4 = 10.", "0 + 1 + 2 + 3 + 4 = 10.") }),
        sequence({ id: "c-seq1", title: t("Build the program", "בנו את התוכנית"), concept: t("while loops", "לולאות while"), level: 2, objectiveId: "o-loop",
          prompt: t("Put the lines in the right order so the program prints 0, 1, 2:", "סדרו את השורות כך שהתוכנית תדפיס 0, 1, 2:"),
          items: ["count = 0", "while count < 3:", "    print(count)", "    count = count + 1"],
          hint: t("Set things up first, then test, then act, then update.", "קודם מכינים, אחר כך בודקים, אחר כך פועלים ובסוף מעדכנים."),
          explanation: t("Initialise the variable, test the condition, do the work, then update the variable — otherwise the loop would never stop.", "מאתחלים את המשתנה, בודקים את התנאי, מבצעים את העבודה ואז מעדכנים את המשתנה — אחרת הלולאה לא הייתה נעצרת לעולם.") }),
        program({ id: "c-prog1", title: t("Walk the hall", "ללכת במסדרון"), concept: t("loops", "לולאות"), level: 2, objectiveId: "o-loop",
          prompt: t("Guide the robot to the flag. You may use at most 3 blocks — so use a loop!", "הדריכו את הרובוט אל הדגל. מותר להשתמש בלכל היותר 3 בלוקים — אז השתמשו בלולאה!"),
          width: 5, height: 3, start: { x: 0, y: 1, dir: "E" }, goal: { x: 4, y: 1 }, allowed: ["move", "repeat"], maxBlocks: 3,
          solution: [{ t: "repeat", n: 4, body: [{ t: "move" }] }],
          hint: t("Instead of four 'move' blocks, repeat ONE 'move' block four times.", "במקום ארבעה בלוקי 'התקדם', חזרו על בלוק 'התקדם' אחד ארבע פעמים."),
          explanation: t("A repeat block runs the blocks inside it again and again: one loop replaces four copies.", "בלוק חזרה מריץ שוב ושוב את הבלוקים שבתוכו: לולאה אחת מחליפה ארבעה העתקים.") }),
        program({ id: "c-prog2", title: t("Climb the stairs", "לטפס במדרגות"), concept: t("nested steps in loops", "צעדים חוזרים בלולאה"), level: 3, objectiveId: "o-loop",
          prompt: t("Get the robot up the staircase to the flag in at most 6 blocks. Spot the pattern that repeats!", "הביאו את הרובוט במעלה המדרגות אל הדגל בעד 6 בלוקים. מצאו את התבנית שחוזרת!"),
          width: 5, height: 5, start: { x: 0, y: 0, dir: "E" }, goal: { x: 4, y: 4 },
          walls: [{ x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }],
          allowed: ["move", "turnLeft", "turnRight", "repeat"], maxBlocks: 6,
          solution: [{ t: "repeat", n: 4, body: [{ t: "move" }, { t: "right" }, { t: "move" }, { t: "left" }] }],
          hint: t("One step right, one step down — that pair is the same every time.", "צעד ימינה, צעד למטה — הזוג הזה זהה בכל פעם."),
          explanation: t("Find the repeating unit (move, turn, move, turn back) and put it inside one loop.", "מצאו את היחידה החוזרת (התקדם, פנה, התקדם, פנה חזרה) והניחו אותה בתוך לולאה אחת.") }),
        choice({ id: "c-cond2", title: t("Grade machine", "מכונת הציונים"), concept: t("if / elif / else", "if / elif / else"), level: 3, objectiveId: "o-cond",
          prompt: "score = 72\nif score >= 90:\n    grade = 'A'\nelif score >= 70:\n    grade = 'B'\nelse:\n    grade = 'C'\n" + t("What is grade?", "מהו grade?"),
          options: [
            ["'A'", t("72 is not >= 90, so that branch is skipped.", "72 אינו >= 90, ולכן הענף הזה מדולג.")],
            ["'B'", t("Correct — the first condition fails, the second (>= 70) passes.", "נכון — התנאי הראשון נכשל, השני (>= 70) מתקיים.")],
            ["'C'", t("else only runs if every earlier condition failed; 72 >= 70 passed.", "else רץ רק אם כל התנאים הקודמים נכשלו; 72 >= 70 התקיים.")],
            [t("an error", "שגיאה"), t("elif is valid — it means 'else, if…'.", "elif תקין — זה אומר 'אחרת, אם…'.")],
          ], correct: 1, hint: t("Check the conditions from the top and stop at the first one that is True.", "בדקו את התנאים מלמעלה ועצרו בראשון שמתקיים."),
          explanation: t("Conditions are checked in order and only the first True branch runs.", "התנאים נבדקים לפי הסדר ורק הענף הנכון הראשון רץ.") }),
        choice({ id: "c-func1", title: t("Why functions?", "למה פונקציות?"), concept: t("functions", "פונקציות"), level: 2, objectiveId: "o-func",
          prompt: "def greet(name):\n    print('Hi ' + name)\n\ngreet('Dana')\n" + t("What is the main benefit of putting code in a function?", "מה היתרון העיקרי של הכנסת קוד לתוך פונקציה?"),
          options: [
            [t("You can reuse it by name instead of rewriting it", "אפשר להשתמש בו שוב לפי שם במקום לכתוב אותו מחדש"), t("Exactly — write once, call many times.", "בדיוק — כותבים פעם אחת, קוראים הרבה פעמים.")],
            [t("It makes the code run faster", "זה מריץ את הקוד מהר יותר"), t("Functions are about organisation and reuse, not speed.", "פונקציות עוסקות בארגון ובשימוש חוזר, לא במהירות.")],
            [t("It prevents all errors", "זה מונע את כל השגיאות"), t("Functions can still contain bugs; they just keep code tidy.", "בפונקציות עדיין יכולים להיות באגים; הן רק שומרות על סדר.")],
            [t("It turns the code into a variable", "זה הופך את הקוד למשתנה"), t("A function is a named block of code, not a stored value.", "פונקציה היא בלוק קוד בעל שם, לא ערך שמור.")],
          ], correct: 0, hint: t("Imagine you needed to greet 100 people.", "תארו לעצמכם שצריך לברך 100 אנשים."),
          explanation: t("A function packages steps under a name so you can call them whenever you need — less copying, fewer bugs.", "פונקציה אורזת צעדים תחת שם כדי שאפשר יהיה לקרוא להם בכל עת — פחות העתקות, פחות באגים.") }),
      ],
    };
  },

  extensions(lang: Lang) {
    const t = translator(lang);
    return [
      {
        mechanics: ["collect", "dialogue"],
        objectives: [],
        conclusion: t(
          "You also learned to package code into functions and combine them — the key step from small scripts to real software.",
          "למדתם גם לארוז קוד בפונקציות ולשלב ביניהן — הצעד המרכזי מסקריפטים קטנים לתוכנה אמיתית.",
        ),
        areas: [
          {
            id: "a-foundry", name: t("Function Foundry", "מפעל הפונקציות"), size: "medium", layout: "plaza", hazardLevel: "none",
            description: t("A glowing foundry where machines are built from small named parts.", "מפעל זוהר שבו מכונות נבנות מחלקים קטנים בעלי שם."),
            stations: [
              challengeStation("s-fn1", t("Call Desk", "דלפק הקריאות"), "c-fn1"),
              challengeStation("s-fn2", t("Nested Press", "מכבש מקונן"), "c-fn2"),
              challengeStation("s-fn3", t("Vocabulary Wall", "קיר המונחים"), "c-fn3"),
            ],
            npcs: [npc("n-forge", "Forge", t("Foundry foreman", "מנהל המפעל"), "#ffc63d", "creature", [t("Every machine here is built from small parts with names. Call them wisely!", "כל מכונה כאן בנויה מחלקים קטנים עם שמות. קראו להם בחוכמה!")])],
            collectibles: { kind: "data-core", count: 3, label: t("Data cores", "ליבות נתונים") },
          },
        ],
        missions: [
          { id: "m-foundry", title: t("Forge a Function", "ליצור פונקציה"), areaId: "a-foundry", requires: [], story: t("Understand calls, nesting and the vocabulary of functions.", "הבינו קריאות, קינון ואוצר המילים של פונקציות."), objectives: [
            { type: "talk", text: t("Talk to Forge", "דברו עם פורג׳"), npcId: "n-forge" },
            { type: "solve", text: t("Finish all three foundry stations", "סיימו את שלוש עמדות המפעל"), challengeIds: ["c-fn1", "c-fn2", "c-fn3"] },
          ] },
        ],
        challenges: [
          choice({ id: "c-fn1", title: t("Calling a function", "קריאה לפונקציה"), concept: t("functions", "פונקציות"), level: 2, objectiveId: "o-func",
            prompt: "def square(n):\n    return n * n\n\nprint(square(4))\n" + t("What does this print?", "מה זה מדפיס?"),
            options: [["8", t("n * n multiplies n by itself (4 × 4), it does not double it.", "n * n מכפיל את n בעצמו (4 × 4), הוא לא מכפיל ב-2.")], ["16", t("Right — square(4) returns 4 × 4.", "נכון — square(4) מחזיר 4 × 4.")], ["4", t("That is the argument; the function returns the result of the calculation.", "זה הארגומנט; הפונקציה מחזירה את תוצאת החישוב.")]],
            correct: 1, hint: t("Replace n with 4 everywhere inside the function.", "החליפו את n ב-4 בכל מקום בתוך הפונקציה."), explanation: t("Calling square(4) runs the body with n = 4 and returns 16.", "הקריאה square(4) מריצה את הגוף עם n = 4 ומחזירה 16.") }),
          numeric({ id: "c-fn2", title: t("Nested calls", "קריאות מקוננות"), concept: t("function composition", "הרכבת פונקציות"), level: 3, objectiveId: "o-func",
            prompt: "def double(n):\n    return n * 2\n\nprint(double(double(3)))\n" + t("What does this print?", "מה זה מדפיס?"), answer: 12,
            mistakes: [[6, t("That is only the inner call double(3). The outer call doubles it again.", "זו רק הקריאה הפנימית double(3). הקריאה החיצונית מכפילה שוב.")]],
            hint: t("Work from the inside out: double(3), then double of that.", "עבדו מבפנים החוצה: double(3), ואז double של התוצאה."), explanation: t("double(3) is 6, and double(6) is 12.", "double(3) הוא 6, ו-double(6) הוא 12.") }),
          match({ id: "c-fn3", title: t("Function vocabulary", "אוצר מילים של פונקציות"), concept: t("function terms", "מונחי פונקציות"), level: 2, objectiveId: "o-func",
            prompt: t("Match each term to its meaning.", "התאימו כל מונח למשמעות שלו."),
            pairs: [[t("parameter", "פרמטר"), t("a named input in the function definition", "קלט בעל שם בהגדרת הפונקציה")], [t("argument", "ארגומנט"), t("the actual value passed in a call", "הערך בפועל שמועבר בקריאה")], [t("return value", "ערך מוחזר"), t("the result a function hands back", "התוצאה שהפונקציה מחזירה")]],
            hint: t("Parameter = placeholder, argument = real value.", "פרמטר = מציין מקום, ארגומנט = ערך אמיתי."), explanation: t("Parameters are the names inside the definition; arguments are the values you give when you call.", "פרמטרים הם השמות בתוך ההגדרה; ארגומנטים הם הערכים שנותנים בקריאה.") }),
        ],
      },
    ];
  },
};
