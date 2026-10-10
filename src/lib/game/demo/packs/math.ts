import { challengeStation, choice, match, npc, numeric, sequence, translator, type Lang } from "../builders";
import type { DemoPack } from "../types";

export const mathPack: DemoPack = {
  id: "math",
  category: "math",
  keywords: /math|algebra|fraction|equation|percent|arithmetic|geometry|calculus|number|מתמטיקה|חשבון|שבר|משוואה|אחוז|אלגברה|גיאומטריה/i,
  gameType: "puzzle",
  environment: "castle",
  timeOfDay: "dusk",
  title: (lang) => translator(lang)("Castle of Numbers", "טירת המספרים"),
  tagline: (lang) => translator(lang)("Unlock the castle gates one calculation at a time.", "פתחו את שערי הטירה, חישוב אחר חישוב."),

  build(lang: Lang) {
    const t = translator(lang);
    return {
      mechanics: ["collect", "dialogue", "portals", "gates", "checkpoints", "adaptive_difficulty"],
      objectives: [
        { id: "o-order", text: t("Apply the order of operations", "ליישם את סדר פעולות החשבון") },
        { id: "o-frac", text: t("Compare fractions and convert percentages", "להשוות שברים ולהמיר אחוזים") },
        { id: "o-alg", text: t("Solve simple equations step by step", "לפתור משוואות פשוטות צעד אחר צעד") },
      ],
      conclusion: t(
        "You used the order of operations, compared fractions and percentages, and solved equations by undoing one step at a time — core tools for all later maths.",
        "השתמשתם בסדר פעולות החשבון, השוויתם שברים ואחוזים ופתרתם משוואות על ידי ביטול צעד אחר צעד — כלים בסיסיים לכל המשך לימודי המתמטיקה.",
      ),
      areas: [
        {
          id: "a-hall", name: t("Gate Hall", "אולם השערים"), size: "medium", layout: "rooms", hazardLevel: "none",
          description: t("A hall of stone rooms, each locked until its riddle is solved.", "אולם חדרי אבן, וכל אחד נעול עד שפותרים את החידה שלו."),
          stations: [
            challengeStation("s-ops", t("Rune of Order", "רונת הסדר"), "c-ops"),
            challengeStation("s-frac", t("Fraction Scale", "מאזני השברים"), "c-frac"),
            challengeStation("s-eq", t("Balance Door", "דלת האיזון"), "c-eq"),
            challengeStation("s-steps", t("Scribe's Desk", "שולחן הסופר"), "c-steps"),
          ],
          npcs: [npc("n-count", "Count Numeric", t("Castle steward", "מנהל הטירה"), "#f2c14e", "human", [
            t("Welcome! Each door obeys one rule of arithmetic. Obey the rule, and it opens.", "ברוכים הבאים! כל דלת מצייתת לכלל חשבוני אחד. צייתו לכלל והיא תיפתח."),
            t("Remember: multiplication before addition!", "זכרו: כפל לפני חיבור!"),
          ])],
          collectibles: { kind: "coin", count: 4, label: t("Gold coins", "מטבעות זהב") },
          portal: { toAreaId: "a-tower", label: t("Stairs to the Tower", "מדרגות אל המגדל"), requiresMissionIds: ["m-hall"] },
        },
        {
          id: "a-tower", name: t("Tower of Percents", "מגדל האחוזים"), size: "medium", layout: "corridor", hazardLevel: "none",
          description: t("A long tower stair where every landing hides a percentage puzzle.", "גרם מדרגות ארוך שבו כל קומה מסתירה חידת אחוזים."),
          stations: [
            challengeStation("s-pct", t("Percent Gauge", "מד האחוזים"), "c-pct"),
            challengeStation("s-perim", t("Builder's Plan", "תוכנית הבנאי"), "c-perim"),
            challengeStation("s-match", t("Fraction Mirror", "מראת השברים"), "c-match"),
          ],
          npcs: [npc("n-lady", "Lady Fraction", t("Tower keeper", "שומרת המגדל"), "#c0392b", "human", [t("Percent just means 'out of one hundred'. Keep that in mind!", "אחוז פירושו פשוט 'מתוך מאה'. זכרו את זה!")])],
          collectibles: { kind: "coin", count: 3, label: t("Gold coins", "מטבעות זהב") },
        },
      ],
      missions: [
        { id: "m-gate", title: t("Open the First Gates", "לפתוח את השערים הראשונים"), areaId: "a-hall", requires: [], story: t("The first two rooms only open for correct arithmetic.", "שני החדרים הראשונים נפתחים רק לחשבון נכון."), objectives: [
          { type: "talk", text: t("Talk to Count Numeric", "דברו עם הרוזן נומריק"), npcId: "n-count" },
          { type: "solve", text: t("Solve the Rune and the Scale", "פתרו את הרונה ואת המאזניים"), challengeIds: ["c-ops", "c-frac"] },
        ] },
        { id: "m-hall", title: t("Through the Hall", "דרך האולם"), areaId: "a-hall", requires: ["m-gate"], story: t("Two more rooms stand between you and the tower stairs.", "עוד שני חדרים מפרידים ביניכם לבין מדרגות המגדל."), objectives: [
          { type: "solve", text: t("Balance the door and finish the scribe's steps", "איזנו את הדלת וסיימו את צעדי הסופר"), challengeIds: ["c-eq", "c-steps"] },
          { type: "collect", text: t("Collect 2 coins", "אספו 2 מטבעות"), count: 2 },
        ] },
        { id: "m-tower", title: t("Climb the Tower", "לטפס במגדל"), areaId: "a-tower", requires: ["m-hall"], story: t("Each landing needs a percentage or a measurement.", "כל קומה דורשת אחוז או מידה."), objectives: [
          { type: "talk", text: t("Talk to Lady Fraction", "דברו עם הגברת שבר"), npcId: "n-lady" },
          { type: "solve", text: t("Solve all three tower puzzles", "פתרו את שלוש חידות המגדל"), challengeIds: ["c-pct", "c-perim", "c-match"] },
        ] },
      ],
      challenges: [
        numeric({ id: "c-ops", title: t("Order of operations", "סדר פעולות"), concept: t("order of operations", "סדר פעולות"), level: 1, objectiveId: "o-order",
          prompt: "3 + 4 × 2 = ?", answer: 11,
          mistakes: [[14, t("That is (3 + 4) × 2. Multiplication happens before addition.", "זה (3 + 4) × 2. כפל מתבצע לפני חיבור.")]],
          hint: t("Do the multiplication first, then add.", "קודם הכפל, אחר כך החיבור."), explanation: t("4 × 2 = 8 first, then 3 + 8 = 11.", "קודם 4 × 2 = 8, ואז 3 + 8 = 11.") }),
        choice({ id: "c-frac", title: t("Which is largest?", "איזה גדול ביותר?"), concept: t("comparing fractions", "השוואת שברים"), level: 1, objectiveId: "o-frac",
          prompt: t("Which fraction is the largest?", "איזה שבר הוא הגדול ביותר?"),
          options: [
            ["1/2", t("1/2 = 0.5, but another option is bigger.", "1/2 = 0.5, אבל יש אפשרות גדולה יותר.")],
            ["2/3", t("2/3 ≈ 0.67, close — but 3/4 is bigger.", "2/3 ≈ 0.67, קרוב — אבל 3/4 גדול יותר.")],
            ["3/4", t("Yes: 3/4 = 0.75 is the largest.", "נכון: 3/4 = 0.75 הוא הגדול ביותר.")],
            ["5/8", t("5/8 = 0.625, smaller than 3/4.", "5/8 = 0.625, קטן מ-3/4.")],
          ], correct: 2, hint: t("Turn each fraction into a decimal.", "הפכו כל שבר לעשרוני."), explanation: t("As decimals: 0.5, 0.67, 0.75, 0.625 — 3/4 is the largest.", "כעשרוניים: 0.5, 0.67, 0.75, 0.625 — 3/4 הוא הגדול ביותר.") }),
        numeric({ id: "c-eq", title: t("Balance the equation", "לאזן את המשוואה"), concept: t("one-step undoing", "ביטול צעד אחר צעד"), level: 2, objectiveId: "o-alg",
          prompt: t("Solve for x:\n2x + 5 = 17", "פתרו עבור x:\n2x + 5 = 17"), answer: 6,
          mistakes: [[11, t("You subtracted 5 but forgot to divide by 2.", "הפחתתם 5 אבל שכחתם לחלק ב-2.")], [12, t("12 is 17 − 5. Now divide by 2 to find x.", "12 הוא 17 − 5. עכשיו חלקו ב-2 כדי למצוא את x.")]],
          hint: t("Undo the +5 first, then undo the ×2.", "בטלו קודם את ה-5+, אחר כך את ה-2×."), explanation: t("Subtract 5 from both sides: 2x = 12. Divide both sides by 2: x = 6.", "מחסרים 5 משני האגפים: 2x = 12. מחלקים ב-2: x = 6.") }),
        sequence({ id: "c-steps", title: t("Solve it in order", "לפתור לפי הסדר"), concept: t("solving equations", "פתרון משוואות"), level: 2, objectiveId: "o-alg",
          prompt: t("Put the steps for solving this equation in order:", "סדרו את צעדי פתרון המשוואה:"),
          items: ["3(x − 2) = 12", "x − 2 = 4", "x = 6", t("Check: 3(6 − 2) = 12 ✓", "בדיקה: 3(6 − 2) = 12 ✓")],
          hint: t("Start with the original equation, finish with a check.", "מתחילים במשוואה המקורית ומסיימים בבדיקה."),
          explanation: t("Divide by 3, then add 2, then verify by substituting back.", "מחלקים ב-3, מוסיפים 2, ואז מאמתים בהצבה חזרה.") }),
        numeric({ id: "c-pct", title: t("Percent of a number", "אחוז ממספר"), concept: t("percentages", "אחוזים"), level: 2, objectiveId: "o-frac",
          prompt: t("What is 25% of 80?", "כמה הם 25% מ-80?"), answer: 20,
          mistakes: [[25, t("25% means 25 out of 100, not 25 of 80.", "25% פירושו 25 מתוך 100, לא 25 מתוך 80.")], [320, t("You multiplied by 4. 25% is one quarter: divide by 4.", "הכפלתם ב-4. 25% הוא רבע: חלקו ב-4.")]],
          hint: t("25% is the same as 1/4.", "25% זה אותו דבר כמו 1/4."), explanation: t("25% = 1/4, and 80 ÷ 4 = 20.", "25% = 1/4, ו-80 ÷ 4 = 20.") }),
        choice({ id: "c-perim", title: t("Perimeter puzzle", "חידת היקף"), concept: t("perimeter", "היקף"), level: 2, objectiveId: "o-alg",
          prompt: t("A rectangle has perimeter 20 and width 4. What is its length?", "למלבן היקף 20 ורוחב 4. מהו אורכו?"),
          options: [["4", t("That would make a square with perimeter 16.", "זה יהיה ריבוע עם היקף 16.")], ["6", t("Yes: 2 × (4 + 6) = 20.", "נכון: 2 × (4 + 6) = 20.")], ["8", t("2 × (4 + 8) = 24, too big.", "2 × (4 + 8) = 24, גדול מדי.")], ["12", t("Perimeter would be 32.", "ההיקף יהיה 32.")]],
          correct: 1, hint: t("Perimeter = 2 × (length + width).", "היקף = 2 × (אורך + רוחב)."), explanation: t("Half the perimeter is 10 = length + width, so length = 10 − 4 = 6.", "חצי ההיקף הוא 10 = אורך + רוחב, ולכן האורך = 10 − 4 = 6.") }),
        match({ id: "c-match", title: t("Percent ↔ fraction", "אחוז ↔ שבר"), concept: t("percent and fractions", "אחוזים ושברים"), level: 2, objectiveId: "o-frac",
          prompt: t("Match each percentage with its fraction.", "התאימו כל אחוז לשבר שלו."),
          pairs: [["50%", "1/2"], ["25%", "1/4"], ["75%", "3/4"], ["10%", "1/10"]],
          hint: t("100% is the whole; split it into equal parts.", "100% זה השלם; חלקו אותו לחלקים שווים."), explanation: t("Percent means 'out of 100': 25% = 25/100 = 1/4, and so on.", "אחוז פירושו 'מתוך 100': 25% = 25/100 = 1/4, וכן הלאה.") }),
      ],
    };
  },

  extensions(lang: Lang) {
    const t = translator(lang);
    return [
      {
        mechanics: ["collect", "dialogue"],
        objectives: [{ id: "o-geo", text: t("Use area and angle facts", "להשתמש בעובדות על שטח וזוויות") }],
        conclusion: t(
          "You also used area and angle facts — the bridge from arithmetic to geometry.",
          "השתמשתם גם בעובדות על שטח וזוויות — הגשר מחשבון אל גיאומטריה.",
        ),
        areas: [
          {
            id: "a-vault", name: t("Vault of Shapes", "כספת הצורות"), size: "medium", layout: "plaza", hazardLevel: "none",
            description: t("A circular vault whose locks are shapes.", "כספת עגולה שהמנעולים שלה הם צורות."),
            stations: [
              challengeStation("s-area", t("Floor Tiler", "מרצף הרצפה"), "c-area"),
              challengeStation("s-tri", t("Triangle Lock", "מנעול המשולש"), "c-tri"),
              challengeStation("s-shape", t("Shape Table", "שולחן הצורות"), "c-shape"),
            ],
            npcs: [npc("n-geo", "Geo", t("Vault surveyor", "מודד הכספת"), "#2dd4bf", "orb", [t("Shapes follow rules too. Measure carefully!", "גם לצורות יש חוקים. מדדו בזהירות!")])],
            collectibles: { kind: "coin", count: 3, label: t("Gold coins", "מטבעות זהב") },
          },
        ],
        missions: [
          { id: "m-vault", title: t("Crack the Vault", "לפצח את הכספת"), areaId: "a-vault", requires: [], story: t("Three shape-locks guard the treasure.", "שלושה מנעולי צורה שומרים על האוצר."), objectives: [
            { type: "talk", text: t("Talk to Geo", "דברו עם ג׳או"), npcId: "n-geo" },
            { type: "solve", text: t("Open all three locks", "פתחו את שלושת המנעולים"), challengeIds: ["c-area", "c-tri", "c-shape"] },
          ] },
        ],
        challenges: [
          numeric({ id: "c-area", title: t("Tile the floor", "ריצוף הרצפה"), concept: t("area", "שטח"), level: 1, objectiveId: "o-geo",
            prompt: t("A rectangular floor is 7 m long and 5 m wide. What is its area in square metres?", "רצפה מלבנית באורך 7 מ' וברוחב 5 מ'. מה שטחה במטרים רבועים?"), answer: 35, unit: "m²",
            mistakes: [[24, t("That is the perimeter. Area is length × width.", "זה ההיקף. שטח הוא אורך × רוחב.")], [12, t("7 + 5 adds the sides; area multiplies them.", "7 + 5 מחבר את הצלעות; שטח מכפיל אותן.")]],
            hint: t("Area of a rectangle = length × width.", "שטח מלבן = אורך × רוחב."), explanation: t("7 × 5 = 35 square metres.", "7 × 5 = 35 מטרים רבועים.") }),
          choice({ id: "c-tri", title: t("Angles of a triangle", "זוויות במשולש"), concept: t("angles", "זוויות"), level: 2, objectiveId: "o-geo",
            prompt: t("Two angles of a triangle are 50° and 60°. What is the third?", "שתי זוויות במשולש הן 50° ו-60°. מהי השלישית?"),
            options: [["70°", t("Yes: 180° − 50° − 60° = 70°.", "נכון: 180° − 50° − 60° = 70°.")], ["110°", t("That is 50° + 60°. Subtract from 180° instead.", "זה 50° + 60°. הפחיתו מ-180° במקום זאת.")], ["60°", t("The angles must add up to 180°.", "הזוויות חייבות להסתכם ב-180°.")]],
            correct: 0, hint: t("The three angles of a triangle always sum to 180°.", "שלוש זוויות המשולש תמיד מסתכמות ב-180°."), explanation: t("180° − 110° = 70°.", "180° − 110° = 70°.") }),
          match({ id: "c-shape", title: t("Shape facts", "עובדות על צורות"), concept: t("shapes", "צורות"), level: 2, objectiveId: "o-geo",
            prompt: t("Match each shape to its property.", "התאימו כל צורה לתכונה שלה."),
            pairs: [[t("square", "ריבוע"), t("4 equal sides, 4 right angles", "4 צלעות שוות, 4 זוויות ישרות")], [t("triangle", "משולש"), t("3 sides, angles sum to 180°", "3 צלעות, הזוויות מסתכמות ב-180°")], [t("circle", "עיגול"), t("every point equally far from the centre", "כל נקודה רחוקה באותה מידה מהמרכז")]],
            hint: t("Think about sides and angles.", "חשבו על צלעות וזוויות."), explanation: t("Each shape is defined by simple, checkable properties.", "כל צורה מוגדרת על ידי תכונות פשוטות שאפשר לבדוק.") }),
        ],
      },
    ];
  },
};
