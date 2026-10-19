import { challengeStation, choice, lever, loreStation, match, npc, numeric, projectile, sequence, translator, type Lang } from "@/lib/game/builders";
import type { DemoPack } from "../types";

export const sciencePack: DemoPack = {
  id: "science",
  category: "science",
  keywords: /\bscience|physics|chemi|biolog|energy|\bforce|gravity|photosynth|\bcells?\b|\batoms?\b|planet|solar system|ecosystem|food chain|speed|magnet|circuit|מדע|פיזיקה|כימיה|ביולוגיה|כוח|כוחות|אנרגיה|פוטוסינתזה|תא|אטום|כוכב לכת|מערכת השמש|אקולוגיה|מגנט|מעגל חשמלי|מהירות/i,
  gameType: "simulation",
  environment: "laboratory",
  timeOfDay: "day",
  topic: (lang) => translator(lang)("Science basics: matter, plants, motion and forces", "יסודות המדע: חומר, צמחים, תנועה וכוחות"),
  title: (lang) => translator(lang)("Science Lab", "מעבדת המדע"),
  tagline: (lang) => translator(lang)("Run experiments and discover how the world works.", "בצעו ניסויים וגלו איך העולם עובד."),

  build(lang: Lang) {
    const t = translator(lang);
    return {
      mechanics: ["collect", "dialogue", "portals", "checkpoints", "adaptive_difficulty", "jump"],
      objectives: [
        { id: "o-matter", text: t("Describe states of matter and how they change", "לתאר מצבי צבירה ואת המעברים ביניהם") },
        { id: "o-life", text: t("Explain how plants and food chains work", "להסביר איך צמחים ושרשראות מזון עובדים") },
        { id: "o-motion", text: t("Predict motion using speed and simple machines", "לחזות תנועה בעזרת מהירות ומכונות פשוטות") },
        { id: "o-energy", text: t("Connect forces and circuits to everyday life", "לקשר בין כוחות ומעגלים חשמליים לחיי היום־יום") },
      ],
      conclusion: t(
        "You described how matter changes state, how plants and food chains pass on energy, how to predict motion with speed, a launch and a lever, and how friction and circuits show up every day. That is how scientists think: observe, predict, test.",
        "תיארתם איך חומר משנה מצב צבירה, איך צמחים ושרשראות מזון מעבירים אנרגיה, איך לחזות תנועה בעזרת מהירות, שיגור ומנוף, ואיך חיכוך ומעגלים חשמליים נמצאים בחיי היום־יום. כך חושבים מדענים: מתבוננים, מנבאים, בודקים.",
      ),
      areas: [
        {
          id: "a-garden", name: t("Discovery Garden", "גן הגילויים"), size: "medium", layout: "plaza", hazardLevel: "none",
          description: t("A sunny garden between greenhouses where every plant, puddle and pebble is a small experiment.", "גן שטוף שמש בין חממות, שבו כל צמח, שלולית וחלוק הוא ניסוי קטן."),
          intro: t("The lab's experiments have been mixed up. Help the scientists sort them out.", "הניסויים של המעבדה התערבבו. עזרו למדענים לסדר אותם."),
          stations: [
            challengeStation("s-states", t("Ice Table", "שולחן הקרח"), "c-states"),
            challengeStation("s-plant", t("Greenhouse Panel", "לוח החממה"), "c-plant"),
            challengeStation("s-chain", t("Pond Board", "לוח הבריכה"), "c-chain"),
            challengeStation("s-speed", t("Race Track", "מסלול המרוצים"), "c-speed"),
            loreStation("s-lore1", t("Field Notes", "פנקס שדה"), t("Why run experiments?", "למה עושים ניסויים?"), t("A good experiment changes one thing at a time and measures the result. That way, when something changes, you know what caused it — and anyone can repeat your test and check.", "ניסוי טוב משנה דבר אחד בכל פעם ומודד את התוצאה. כך, כשמשהו משתנה, אפשר לדעת מה גרם לכך — וכל אחד יכול לחזור על הבדיקה ולבדוק.")),
          ],
          npcs: [npc("n-spark", "Dr. Spark", t("Lab guide", "מדריכת המעבדה"), "#7be26b", "human", [
            t("Welcome to the lab! Today's experiments got shuffled, and I need sharp eyes.", "ברוכים הבאים למעבדה! הניסויים של היום התערבבו, ואני צריכה עיניים חדות."),
            t("Observe first, then answer. Science starts with noticing things.", "קודם מתבוננים, אחר כך עונים. המדע מתחיל בלשים לב."),
          ], t("Stuck? Terminals have hints — they cost a few points, but learning is worth it.", "תקועים? במסופים יש רמזים — הם עולים כמה נקודות, אבל הלמידה שווה את זה."))],
          collectibles: { kind: "leaf", count: 4, label: t("Plant samples", "דגימות צמחים") },
          portal: { toAreaId: "a-bay", label: t("Door to the Physics Bay", "דלת למפרץ הפיזיקה"), requiresMissionIds: ["m-life"] },
        },
        {
          id: "a-bay", name: t("Physics Bay", "מפרץ הפיזיקה"), size: "medium", layout: "corridor", hazardLevel: "none",
          description: t("A long hall of test benches: launchers, levers, circuits and slippery floors.", "אולם ארוך של שולחנות ניסוי: משגרים, מנופים, מעגלים חשמליים ורצפות חלקלקות."),
          stations: [
            challengeStation("s-proj", t("Probe Launcher", "משגר הגשושית"), "c-proj"),
            challengeStation("s-lever", t("Lever Bench", "שולחן המנוף"), "c-lever"),
            challengeStation("s-force", t("Slide Table", "שולחן ההחלקה"), "c-force"),
            challengeStation("s-circuit", t("Circuit Board", "לוח המעגל"), "c-circuit"),
          ],
          npcs: [npc("n-vector", "Vector", t("Test-bench robot", "רובוט שולחן הניסויים"), "#22e6ff", "robot", [
            t("Every launch is a prediction. Choose an angle and a speed, then see whether you were right.", "כל שיגור הוא ניבוי. בחרו זווית ומהירות, ואז בדקו אם צדקתם."),
            t("Balance and friction are everywhere — not just in this lab!", "איזון וחיכוך נמצאים בכל מקום — לא רק במעבדה הזו!"),
          ])],
          collectibles: { kind: "gem", count: 3, label: t("Crystal samples", "דגימות גבישים") },
        },
      ],
      missions: [
        { id: "m-matter", title: t("Sort the Samples", "למיין את הדגימות"), areaId: "a-garden", requires: [], story: t("Dr. Spark's labels fell off. Work out what each sample is doing.", "התוויות של ד״ר ספארק נפלו. גלו מה כל דגימה עושה."), objectives: [
          { type: "talk", text: t("Talk to Dr. Spark", "דברו עם ד״ר ספארק"), npcId: "n-spark" },
          { type: "solve", text: t("Explain the ice and the plant panel", "הסבירו את הקרח ואת לוח הצמחים"), challengeIds: ["c-states", "c-plant"] },
        ] },
        { id: "m-life", title: t("Life and Motion", "חיים ותנועה"), areaId: "a-garden", requires: ["m-matter"], story: t("The pond and the race track both need a scientist's eye.", "הבריכה ומסלול המרוצים צריכים שניהם עין של מדען."), objectives: [
          { type: "solve", text: t("Order the food chain and time the cyclist", "סדרו את שרשרת המזון ומדדו את הרוכב"), challengeIds: ["c-chain", "c-speed"] },
          { type: "collect", text: t("Collect 2 plant samples", "אספו 2 דגימות צמחים"), count: 2 },
          { type: "visit", text: t("Read the field notes", "קראו את פנקס השדה"), stationIds: ["s-lore1"] },
        ] },
        { id: "m-physics", title: t("Launch and Balance", "שיגור ואיזון"), areaId: "a-bay", requires: ["m-life"], story: t("Two benches need a calculation before they will work.", "שני שולחנות צריכים חישוב לפני שיעבדו."), objectives: [
          { type: "talk", text: t("Talk to Vector", "דברו עם וקטור"), npcId: "n-vector" },
          { type: "solve", text: t("Hit the target and balance the lever", "פגעו במטרה ואזנו את המנוף"), challengeIds: ["c-proj", "c-lever"] },
        ] },
        { id: "m-final", title: t("Everyday Science", "מדע יומיומי"), areaId: "a-bay", requires: ["m-physics"], story: t("Last two benches: friction and electricity.", "שני השולחנות האחרונים: חיכוך וחשמל."), objectives: [
          { type: "solve", text: t("Explain the sliding book and the circuit", "הסבירו את הספר המחליק ואת המעגל"), challengeIds: ["c-force", "c-circuit"] },
          { type: "collect", text: t("Collect 2 crystal samples", "אספו 2 דגימות גבישים"), count: 2 },
        ] },
      ],
      challenges: [
        choice({ id: "c-states", title: t("Ice on the table", "קרח על השולחן"), concept: t("states of matter", "מצבי צבירה"), level: 1, objectiveId: "o-matter",
          prompt: t("Ice cubes are left in a warm room and turn into water. What is this change called?", "קוביות קרח נשארות בחדר חם והופכות למים. איך נקרא השינוי הזה?"),
          options: [
            [t("Melting", "התכה"), t("Yes — a solid turns into a liquid when it absorbs heat.", "נכון — חומר מוצק הופך לנוזל כשהוא סופג חום.")],
            [t("Freezing", "קפיאה"), t("Freezing is the opposite: liquid water becoming ice.", "קפיאה היא ההפך: מים נוזליים שהופכים לקרח.")],
            [t("Evaporation", "התאדות"), t("Evaporation is a liquid turning into a gas, like water into vapour.", "התאדות היא נוזל שהופך לגז, כמו מים לאדים.")],
            [t("Condensation", "התעבות"), t("Condensation is a gas turning into a liquid, like dew on a cold glass.", "התעבות היא גז שהופך לנוזל, כמו טל על כוס קרה.")],
          ], correct: 0, hint: t("Ice is a solid and water is a liquid. Which change goes from solid to liquid?", "קרח הוא מוצק ומים הם נוזל. איזה שינוי עובר ממוצק לנוזל?"),
          explanation: t("Heat makes the particles in ice move more until they slide past each other: the solid melts into a liquid.", "חום גורם לחלקיקים בקרח לנוע יותר עד שהם מחליקים זה על פני זה: המוצק נמס והופך לנוזל.") }),
        match({ id: "c-plant", title: t("Parts of a plant", "חלקי הצמח"), concept: t("plant parts", "חלקי צמח"), level: 1, objectiveId: "o-life",
          prompt: t("Match each part of a plant with its job.", "התאימו כל חלק בצמח לתפקידו."),
          pairs: [
            [t("roots", "שורשים"), t("take in water and minerals", "סופגים מים ומינרלים")],
            [t("leaves", "עלים"), t("use sunlight to make food", "משתמשים באור שמש כדי לייצר מזון")],
            [t("stem", "גבעול"), t("carries water and holds the plant up", "מוביל מים ותומך בצמח")],
            [t("flower", "פרח"), t("makes seeds for new plants", "מייצר זרעים לצמחים חדשים")],
          ], hint: t("Think about what a plant needs to live: water, light and support.", "חשבו על מה שצמח צריך כדי לחיות: מים, אור ותמיכה."),
          explanation: t("Roots drink, leaves make food by photosynthesis, the stem transports and supports, and flowers make seeds.", "השורשים שותים, העלים מייצרים מזון בפוטוסינתזה, הגבעול מוביל ותומך, והפרחים מייצרים זרעים.") }),
        sequence({ id: "c-chain", title: t("Pond food chain", "שרשרת המזון בבריכה"), concept: t("food chains", "שרשראות מזון"), level: 2, objectiveId: "o-life",
          prompt: t("Order this food chain, starting with the producer and ending with the top predator.", "סדרו את שרשרת המזון, החל מהיצרן ועד לטורף העליון."),
          items: [t("Grass (makes its own food)", "עשב (מייצר מזון בעצמו)"), t("Grasshopper (eats grass)", "חגב (אוכל עשב)"), t("Frog (eats insects)", "צפרדע (אוכלת חרקים)"), t("Snake (eats frogs)", "נחש (אוכל צפרדעים)")],
          hint: t("Energy starts with the plant, then passes to whoever eats it.", "האנרגיה מתחילה בצמח ועוברת למי שאוכל אותו."),
          explanation: t("Energy flows from what is eaten to what eats it: grass → grasshopper → frog → snake.", "אנרגיה זורמת ממה שנאכל למי שאוכל אותו: עשב ← חגב ← צפרדע ← נחש.") }),
        numeric({ id: "c-speed", title: t("Cyclist on the track", "רוכב אופניים במסלול"), concept: t("speed", "מהירות"), level: 2, objectiveId: "o-motion", easierId: "c-speed-easy",
          prompt: t("A cyclist rides 60 km in 3 hours at a steady pace. What is the average speed in km/h?", "רוכב אופניים רוכב 60 ק״מ ב-3 שעות בקצב קבוע. מהי המהירות הממוצעת בק״מ לשעה?"), answer: 20, unit: "km/h",
          mistakes: [[180, t("You multiplied. Speed is distance divided by time.", "הכפלתם. מהירות היא מרחק חלקי זמן.")], [0.05, t("That is time ÷ distance — upside down.", "זה זמן ÷ מרחק — הפוך.")]],
          hint: t("Speed = distance ÷ time.", "מהירות = מרחק ÷ זמן."), explanation: t("60 km ÷ 3 h = 20 km/h.", "60 ק״מ ÷ 3 שעות = 20 ק״מ לשעה.") }),
        numeric({ id: "c-speed-easy", title: t("Car on the track (warm-up)", "מכונית במסלול (חימום)"), concept: t("speed", "מהירות"), level: 1, objectiveId: "o-motion",
          prompt: t("A car travels 100 km in 2 hours at a steady pace. What is its speed in km/h?", "מכונית נוסעת 100 ק״מ ב-2 שעות בקצב קבוע. מהי מהירותה בק״מ לשעה?"), answer: 50, unit: "km/h",
          mistakes: [[200, t("You multiplied. Divide the distance by the time.", "הכפלתם. חלקו את המרחק בזמן.")]],
          hint: t("Divide the distance by the time.", "חלקו את המרחק בזמן."), explanation: t("100 km ÷ 2 h = 50 km/h.", "100 ק״מ ÷ 2 שעות = 50 ק״מ לשעה.") }),
        projectile({ id: "c-proj", title: t("Launch the probe", "שיגור הגשושית"), concept: t("projectile motion", "תנועת קליע"), level: 3, objectiveId: "o-motion",
          prompt: t("Launch the ball so that it lands on the target 20 m away. Choose the launch angle and speed, then fire.", "שגרו את הכדור כך שינחת על המטרה במרחק 20 מ׳. בחרו זווית ומהירות שיגור ואז שגרו."),
          targetDistance: 20, tolerance: 1.5, maxSpeed: 25,
          hint: t("For a given speed, 45° flies the farthest. Try a speed near 14 m/s.", "במהירות נתונה, 45° מגיעה הכי רחוק. נסו מהירות של כ-14 מ׳/ש׳."),
          explanation: t("Range = v² × sin(2θ) ÷ g. At 45°, sin 90° = 1, so v² = 20 × 9.8 = 196 and v = 14 m/s.", "טווח = v² × sin(2θ) ÷ g. ב-45°, sin 90° = 1, ולכן v² = 20 × 9.8 = 196 ו-v = 14 מ׳/ש׳.") }),
        lever({ id: "c-lever", title: t("Balance the lever", "איזון המנוף"), concept: t("levers and balance", "מנופים ואיזון"), level: 2, objectiveId: "o-motion",
          prompt: t("A 6 kg weight sits 4 m to the left of the pivot. How far to the right must a 3 kg weight sit to balance the lever?", "משקל של 6 ק״ג נמצא 4 מ׳ משמאל לציר. באיזה מרחק מימין לציר צריך להציב משקל של 3 ק״ג כדי לאזן את המנוף?"),
          leftWeight: 6, leftDistance: 4, rightWeight: 3, maxDistance: 10, tolerance: 0.3,
          hint: t("A lever balances when weight × distance is the same on both sides.", "מנוף מאוזן כשמשקל × מרחק שווים בשני הצדדים."),
          explanation: t("Left side: 6 × 4 = 24. Right side: 3 × d must also be 24, so d = 8 m.", "צד שמאל: 6 × 4 = 24. צד ימין: גם 3 × d חייב להיות 24, ולכן d = 8 מ׳.") }),
        choice({ id: "c-force", title: t("The sliding book", "הספר המחליק"), concept: t("friction", "חיכוך"), level: 1, objectiveId: "o-energy",
          prompt: t("A book slides across a table and slowly comes to a stop. Which force slows it down?", "ספר מחליק על שולחן ולאט לאט נעצר. איזה כוח מאט אותו?"),
          options: [
            [t("Friction", "חיכוך"), t("Yes — friction between the book and the table resists the sliding.", "נכון — החיכוך בין הספר לשולחן מתנגד להחלקה.")],
            [t("Magnetism", "מגנטיות"), t("Magnetic forces act on magnets and some metals, not on a paper book.", "כוחות מגנטיים פועלים על מגנטים ועל מתכות מסוימות, לא על ספר מנייר.")],
            [t("Gravity pulling it sideways", "כוח הכבידה שמושך הצידה"), t("Gravity pulls down towards the ground. It does not pull sideways.", "כוח הכבידה מושך כלפי מטה, אל הקרקע. הוא לא מושך הצידה.")],
            [t("Buoyancy", "ציפה"), t("Buoyancy is the upward push of a liquid or gas. It is not what stops a sliding book.", "ציפה היא דחיפה כלפי מעלה של נוזל או גז. היא לא מה שעוצר ספר מחליק.")],
          ], correct: 0, hint: t("Rub your hands together — what do you feel?", "שפשפו את הידיים זו בזו — מה אתם מרגישים?"),
          explanation: t("Friction acts where two surfaces rub. It turns movement energy into heat and slows the book.", "חיכוך פועל במקום שבו שני משטחים משתפשפים. הוא הופך אנרגיית תנועה לחום ומאט את הספר.") }),
        match({ id: "c-circuit", title: t("Build a circuit", "בניית מעגל חשמלי"), concept: t("electric circuits", "מעגלים חשמליים"), level: 2, objectiveId: "o-energy",
          prompt: t("Match each circuit part with what it does.", "התאימו כל חלק במעגל החשמלי למה שהוא עושה."),
          pairs: [
            [t("battery", "סוללה"), t("provides the electrical energy", "מספקת את האנרגיה החשמלית")],
            [t("wire", "חוט"), t("carries the current", "מוביל את הזרם")],
            [t("switch", "מתג"), t("opens or closes the circuit", "פותח או סוגר את המעגל")],
            [t("bulb", "נורה"), t("turns electrical energy into light", "הופכת אנרגיה חשמלית לאור")],
          ], hint: t("Current needs a complete loop from the battery and back.", "זרם צריך לולאה שלמה מהסוללה וחזרה."),
          explanation: t("A circuit is a closed loop: the battery pushes current through wires and the bulb, and the switch can break the loop.", "מעגל חשמלי הוא לולאה סגורה: הסוללה דוחפת זרם דרך החוטים והנורה, והמתג יכול לשבור את הלולאה.") }),
      ],
    };
  },

  extensions(lang: Lang) {
    const t = translator(lang);
    return [
      {
        mechanics: ["collect", "dialogue"],
        objectives: [{ id: "o-space", text: t("Describe the Sun, Earth and Moon and the order of the planets", "לתאר את השמש, כדור הארץ והירח ואת סדר כוכבי הלכת") }],
        conclusion: t(
          "You also looked up at the sky: the planets orbit the Sun in a fixed order, and the Moon's phases come from how much of its sunlit half we can see.",
          "הבטתם גם אל השמיים: כוכבי הלכת מקיפים את השמש בסדר קבוע, ושלבי הירח נובעים מכמה מהחצי המואר שלו אנחנו רואים.",
        ),
        areas: [
          {
            id: "a-dome", name: t("Observatory Dome", "כיפת המצפה"), size: "medium", layout: "plaza", hazardLevel: "none",
            description: t("A round dome with a great telescope pointing at the evening sky.", "כיפה עגולה עם טלסקופ גדול המכוון אל שמי הערב."),
            stations: [
              challengeStation("s-order", t("Planet Chart", "מפת כוכבי הלכת"), "c-planets"),
              challengeStation("s-near", t("Telescope", "טלסקופ"), "c-near"),
              challengeStation("s-moon", t("Moon Model", "דגם הירח"), "c-moon"),
            ],
            npcs: [npc("n-astra", "Astra", t("Observatory guide", "מדריכת המצפה"), "#8b5cf6", "orb", [t("Look up! The sky is the biggest laboratory there is.", "הביטו למעלה! השמיים הם המעבדה הגדולה ביותר שיש.")])],
            collectibles: { kind: "star", count: 3, label: t("Star samples", "דגימות כוכבים") },
          },
        ],
        missions: [
          { id: "m-sky", title: t("Read the Night Sky", "לקרוא את שמי הלילה"), areaId: "a-dome", requires: [], story: t("The observatory's chart is out of order.", "מפת המצפה אינה מסודרת."), objectives: [
            { type: "talk", text: t("Talk to Astra", "דברו עם אסטרה"), npcId: "n-astra" },
            { type: "solve", text: t("Fix the chart, the telescope and the model", "תקנו את המפה, הטלסקופ והדגם"), challengeIds: ["c-planets", "c-near", "c-moon"] },
          ] },
        ],
        challenges: [
          sequence({ id: "c-planets", title: t("Planets in order", "כוכבי הלכת לפי הסדר"), concept: t("solar system", "מערכת השמש"), level: 2, objectiveId: "o-space",
            prompt: t("Order these planets by distance from the Sun, closest first.", "סדרו את כוכבי הלכת לפי המרחק מהשמש, הקרוב ביותר קודם."),
            items: [t("Mercury", "חמה"), t("Venus", "נוגה"), t("Earth", "כדור הארץ"), t("Mars", "מאדים")],
            hint: t("Our home planet is the third from the Sun.", "כוכב הבית שלנו הוא השלישי מהשמש."),
            explanation: t("From the Sun outwards: Mercury, Venus, Earth, Mars.", "מהשמש החוצה: חמה, נוגה, כדור הארץ, מאדים.") }),
          choice({ id: "c-near", title: t("Closest to the Sun", "הקרוב ביותר לשמש"), concept: t("solar system", "מערכת השמש"), level: 1, objectiveId: "o-space",
            prompt: t("Which planet is closest to the Sun?", "איזה כוכב לכת הוא הקרוב ביותר לשמש?"),
            options: [
              [t("Mercury", "חמה"), t("Yes — Mercury is the closest planet to the Sun.", "נכון — חמה היא כוכב הלכת הקרוב ביותר לשמש.")],
              [t("Venus", "נוגה"), t("Venus is second from the Sun.", "נוגה היא השנייה מהשמש.")],
              [t("Earth", "כדור הארץ"), t("Earth is third from the Sun.", "כדור הארץ הוא השלישי מהשמש.")],
              [t("Mars", "מאדים"), t("Mars is fourth from the Sun.", "מאדים הוא הרביעי מהשמש.")],
            ], correct: 0, hint: t("Think of the first planet in the order you just built.", "חשבו על הכוכב הראשון בסדר שבניתם."),
            explanation: t("Mercury orbits closest to the Sun, which is why it is so hot on its sunny side.", "חמה מקיפה הכי קרוב לשמש, ולכן חם מאוד בצד המואר שלה.") }),
          choice({ id: "c-moon", title: t("Phases of the Moon", "שלבי הירח"), concept: t("moon phases", "שלבי הירח"), level: 3, objectiveId: "o-space",
            prompt: t("Why does the Moon seem to change shape during the month?", "למה נראה שהירח משנה צורה במהלך החודש?"),
            options: [
              [t("We see different amounts of its sunlit half as it orbits Earth", "אנחנו רואים כמויות שונות מהחצי המואר שלו כשהוא מקיף את כדור הארץ"), t("Yes — half of the Moon is always lit; the phase depends on how much of that half faces us.", "נכון — חצי מהירח תמיד מואר; השלב תלוי בכמה מהחצי הזה פונה אלינו.")],
              [t("Earth's shadow covers part of it each night", "צל כדור הארץ מכסה חלק ממנו בכל לילה"), t("That happens only in a lunar eclipse, which is rare.", "זה קורה רק בליקוי ירח, שהוא נדיר.")],
              [t("The Moon really grows and shrinks", "הירח באמת גדל ומתכווץ"), t("The Moon's size does not change.", "גודלו של הירח אינו משתנה.")],
              [t("Clouds block the Moon", "עננים מסתירים את הירח"), t("Clouds come and go in a day; phases follow a monthly cycle.", "עננים באים והולכים ביום אחד; השלבים עוקבים אחרי מחזור חודשי.")],
            ], correct: 0, hint: t("Think about where the Sun, Earth and Moon are in relation to each other.", "חשבו על המיקום של השמש, כדור הארץ והירח זה ביחס לזה."),
            explanation: t("The Moon orbits Earth about once a month. Its lit half always faces the Sun, and we see more or less of it from Earth.", "הירח מקיף את כדור הארץ בערך פעם בחודש. החצי המואר שלו תמיד פונה אל השמש, ואנחנו רואים ממנו יותר או פחות מכדור הארץ.") }),
        ],
      },
    ];
  },
};
