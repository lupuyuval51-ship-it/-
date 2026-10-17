import { challengeStation, choice, loreStation, match, npc, numeric, sequence, translator, type Lang } from "../builders";
import type { DemoPack } from "../types";

export const historyPack: DemoPack = {
  id: "history",
  category: "history",
  keywords: /histor|ancient|egypt|pharaoh|pyramid|\brome\b|roman|empire|medieval|civili[sz]ation|archaeolog|היסטוריה|תולדות|מצרים|פרעה|פירמיד|רומא|קיסרות|ימי הביניים|ציוויליזציה|ארכיאולוג/i,
  gameType: "exploration",
  environment: "desert-ruins",
  timeOfDay: "day",
  topic: (lang) => translator(lang)("Ancient Egypt: the Nile, writing, tombs and a timeline", "מצרים העתיקה: הנילוס, הכתב, הקברים וציר זמן"),
  title: (lang) => translator(lang)("Secrets of the Nile", "סודות הנילוס"),
  tagline: (lang) => translator(lang)("Explore ancient Egypt and uncover how its people lived.", "חקרו את מצרים העתיקה וגלו איך אנשיה חיו."),

  build(lang: Lang) {
    const t = translator(lang);
    return {
      mechanics: ["collect", "dialogue", "portals", "checkpoints", "adaptive_difficulty", "jump"],
      objectives: [
        { id: "o-nile", text: t("Explain why the Nile mattered to Egyptian life", "להסביר למה הנילוס היה חשוב לחיי המצרים") },
        { id: "o-society", text: t("Describe Egyptian society, writing and beliefs", "לתאר את החברה, הכתב והאמונות במצרים") },
        { id: "o-time", text: t("Place key events of ancient Egypt in time", "למקם אירועים מרכזיים של מצרים העתיקה בזמן") },
      ],
      conclusion: t(
        "You saw how the Nile made farming and a large state possible, how scribes, priests and pharaohs shaped society, and how thousands of years of history fit on a single timeline. Archaeologists still piece the story together from tombs, texts and tools.",
        "ראיתם איך הנילוס אִפשר חקלאות ומדינה גדולה, איך סופרים, כוהנים ופרעונים עיצבו את החברה, ואיך אלפי שנות היסטוריה נכנסות לציר זמן אחד. ארכיאולוגים עדיין מרכיבים את הסיפור מקברים, מכתבים וכלים.",
      ),
      areas: [
        {
          id: "a-valley", name: t("Nile Valley", "עמק הנילוס"), size: "medium", layout: "plaza", hazardLevel: "none",
          description: t("Green fields and palm trees on the banks of the great river, with the desert waiting beyond.", "שדות ירוקים ועצי דקל על גדות הנהר הגדול, והמדבר מחכה מעבר להם."),
          intro: t("A young scribe needs help finishing her lessons about the river and the kingdom.", "סופרת צעירה צריכה עזרה לסיים את השיעורים שלה על הנהר ועל הממלכה."),
          stations: [
            challengeStation("s-nile", t("River Gauge", "מד הנהר"), "c-nile"),
            challengeStation("s-farm", t("Farmer's Plot", "חלקת האיכר"), "c-farm"),
            challengeStation("s-glyph", t("Stone Tablet", "לוח האבן"), "c-glyph"),
            challengeStation("s-roles", t("Village Board", "לוח הכפר"), "c-roles"),
            loreStation("s-lore1", t("River Shrine", "מקדש הנהר"), t("The gift of the Nile", "מתנת הנילוס"), t("Almost no rain falls in Egypt, but every year the Nile flooded and left rich black mud on its banks. Farmers grew wheat and barley there, which is why the Greek historian Herodotus called Egypt “the gift of the Nile”.", "כמעט לא יורד גשם במצרים, אבל בכל שנה הנילוס עלה על גדותיו והשאיר בוץ שחור ועשיר. החקלאים גידלו שם חיטה ושעורה, ולכן ההיסטוריון היווני הרודוטוס קרא למצרים ״מתנת הנילוס״.")),
          ],
          npcs: [npc("n-nefer", "Nefer", t("Young scribe", "סופרת צעירה"), "#f2c14e", "human", [
            t("Greetings, traveller! I am learning to be a scribe, and my teacher gave me a hard test.", "שלום, נוסעים! אני לומדת להיות סופרת, והמורה נתן לי מבחן קשה."),
            t("The river explains almost everything about Egypt. Start there!", "הנהר מסביר כמעט הכול על מצרים. התחילו ממנו!"),
          ], t("Stuck? Tablets have hints — they cost a few points, but learning is worth it.", "תקועים? בלוחות יש רמזים — הם עולים כמה נקודות, אבל הלמידה שווה את זה."))],
          collectibles: { kind: "gem", count: 4, label: t("Scarab gems", "אבני חיפושית") },
          portal: { toAreaId: "a-tombs", label: t("Path to the Valley of Tombs", "שביל אל עמק הקברים"), requiresMissionIds: ["m-writing"] },
        },
        {
          id: "a-tombs", name: t("Valley of Tombs", "עמק הקברים"), size: "medium", layout: "corridor", hazardLevel: "none",
          description: t("A long, cool passage of painted walls leading to the resting places of kings.", "מעבר ארוך ומצונן עם קירות צבועים המוביל אל מקומות המנוחה של מלכים."),
          stations: [
            challengeStation("s-pyramid", t("Stone Counter", "מונה האבנים"), "c-pyramid"),
            challengeStation("s-mummy", t("Embalmer's Table", "שולחן החנטים"), "c-mummy"),
            challengeStation("s-timeline", t("Wall of Kings", "קיר המלכים"), "c-timeline"),
            challengeStation("s-carter", t("Dig Journal", "יומן החפירה"), "c-carter"),
          ],
          npcs: [npc("n-layla", "Dr. Layla", t("Archaeologist", "ארכיאולוגית"), "#2dd4bf", "human", [
            t("Every painted wall here is a page of history. We just need to read it in the right order.", "כל קיר צבוע כאן הוא דף של היסטוריה. צריך רק לקרוא אותו בסדר הנכון."),
            t("Dates matter: the pyramids are far older than most people think.", "תאריכים חשובים: הפירמידות עתיקות בהרבה ממה שרוב האנשים חושבים."),
          ])],
          collectibles: { kind: "gem", count: 3, label: t("Scarab gems", "אבני חיפושית") },
        },
      ],
      missions: [
        { id: "m-river", title: t("Follow the River", "ללכת אחרי הנהר"), areaId: "a-valley", requires: [], story: t("Nefer's first lesson is about the river and the farming year.", "השיעור הראשון של נפר עוסק בנהר ובשנת החקלאות."), objectives: [
          { type: "talk", text: t("Talk to Nefer", "דברו עם נפר"), npcId: "n-nefer" },
          { type: "solve", text: t("Answer the river gauge and the farmer's plot", "ענו על מד הנהר ועל חלקת האיכר"), challengeIds: ["c-nile", "c-farm"] },
        ] },
        { id: "m-writing", title: t("Words and Rulers", "מילים ושליטים"), areaId: "a-valley", requires: ["m-river"], story: t("Next: how Egyptians wrote, and who did what in a village.", "הבא: איך המצרים כתבו, ומי עשה מה בכפר."), objectives: [
          { type: "solve", text: t("Decode the stone tablet and fill in the village board", "פענחו את לוח האבן ומלאו את לוח הכפר"), challengeIds: ["c-glyph", "c-roles"] },
          { type: "collect", text: t("Collect 2 scarab gems", "אספו 2 אבני חיפושית"), count: 2 },
          { type: "visit", text: t("Read the river shrine", "קראו את מקדש הנהר"), stationIds: ["s-lore1"] },
        ] },
        { id: "m-tombs", title: t("Into the Tombs", "אל תוך הקברים"), areaId: "a-tombs", requires: ["m-writing"], story: t("Dr. Layla needs help reading the walls of the valley.", "ד״ר ליילה צריכה עזרה בקריאת קירות העמק."), objectives: [
          { type: "talk", text: t("Talk to Dr. Layla", "דברו עם ד״ר ליילה"), npcId: "n-layla" },
          { type: "solve", text: t("Measure time and understand the embalmer's craft", "מדדו זמן והבינו את מלאכת החנטים"), challengeIds: ["c-pyramid", "c-mummy"] },
        ] },
        { id: "m-timeline", title: t("Build the Timeline", "לבנות את ציר הזמן"), areaId: "a-tombs", requires: ["m-tombs"], story: t("The last wall shows kings out of order. Set history straight.", "הקיר האחרון מראה מלכים לא לפי הסדר. תקנו את ההיסטוריה."), objectives: [
          { type: "solve", text: t("Order the timeline and name the discoverer", "סדרו את ציר הזמן וציינו את המגלה"), challengeIds: ["c-timeline", "c-carter"] },
          { type: "collect", text: t("Collect 2 scarab gems", "אספו 2 אבני חיפושית"), count: 2 },
        ] },
      ],
      challenges: [
        choice({ id: "c-nile", easierId: "c-nile-easy", title: t("Why the Nile?", "למה הנילוס?"), concept: t("the Nile", "הנילוס"), level: 1, objectiveId: "o-nile",
          prompt: t("Why was the yearly flood of the Nile so important to Egyptian farmers?", "למה היה שיטפון הנילוס השנתי כל כך חשוב לחקלאים המצרים?"),
          options: [
            [t("It left rich, fertile mud on the fields", "הוא השאיר בוץ עשיר ופורה על השדות"), t("Yes — the flood deposited fertile silt, so crops grew well in a very dry land.", "נכון — השיטפון הפקיד סחף פורה, ולכן היבולים גדלו היטב בארץ יבשה מאוד.")],
            [t("It brought sea fish to the villages", "הוא הביא דגי ים לכפרים"), t("The Nile is a freshwater river; it does not bring sea fish.", "הנילוס הוא נהר מים מתוקים; הוא לא מביא דגי ים.")],
            [t("It melted the snow in the mountains", "הוא המיס את השלג בהרים"), t("Egypt's fields are in a warm desert; the flood came from distant rains upstream.", "שדות מצרים נמצאים במדבר חם; השיטפון הגיע מגשמים רחוקים במעלה הנהר.")],
            [t("It kept enemies away from the cities", "הוא הרחיק אויבים מהערים"), t("The desert protected Egypt more than the river did.", "המדבר הגן על מצרים יותר מהנהר.")],
          ], correct: 0, hint: t("Egypt gets almost no rain. Where did the farmers' soil and water come from?", "במצרים כמעט לא יורד גשם. מאיפה הגיעו האדמה והמים של החקלאים?"),
          explanation: t("The flood watered the land and left fertile silt. That is why most Egyptians lived along the river.", "השיטפון השקה את האדמה והשאיר סחף פורה. לכן רוב המצרים חיו לאורך הנהר.") }),
        sequence({ id: "c-farm", title: t("The farming year", "שנת החקלאות"), concept: t("farming", "חקלאות"), level: 2, objectiveId: "o-nile",
          prompt: t("Put the Egyptian farming year in order.", "סדרו את שנת החקלאות המצרית."),
          items: [t("The Nile floods the fields", "הנילוס מציף את השדות"), t("Farmers plant seeds in the rich mud", "החקלאים זורעים זרעים בבוץ העשיר"), t("The crops grow in the sun", "היבולים גדלים בשמש"), t("Farmers harvest the grain", "החקלאים קוצרים את התבואה")],
          hint: t("The flood has to come before anything can be planted.", "השיטפון חייב לבוא לפני שאפשר לזרוע משהו."),
          explanation: t("Flood, planting, growing, harvest — the cycle repeated every year.", "שיטפון, זריעה, צמיחה, קציר — מחזור שחזר על עצמו מדי שנה.") }),
        choice({ id: "c-glyph", title: t("The Rosetta Stone", "אבן רוזטה"), concept: t("hieroglyphs", "הירוגליפים"), level: 2, objectiveId: "o-society",
          prompt: t("The Rosetta Stone carries the same text in three scripts, including Greek. What did it help scholars do?", "באבן רוזטה כתוב אותו טקסט בשלושה כתבים, ביניהם יוונית. במה היא עזרה לחוקרים?"),
          options: [
            [t("Read ancient Egyptian hieroglyphs", "לקרוא הירוגליפים מצריים עתיקים"), t("Yes — scholars compared the known Greek text with the hieroglyphs. Champollion succeeded in 1822.", "נכון — החוקרים השוו את הטקסט היווני המוכר להירוגליפים. שמפוליון הצליח בכך ב-1822.")],
            [t("Find the location of Cleopatra's tomb", "למצוא את מיקום קברה של קליאופטרה"), t("The stone is a decree; it says nothing about tombs.", "האבן היא צו מלכותי; היא לא מדברת על קברים.")],
            [t("Measure the height of the pyramids", "למדוד את גובה הפירמידות"), t("It is a text, not a measuring tool.", "זה טקסט, לא כלי מדידה.")],
            [t("Count the number of pharaohs", "לספור את מספר הפרעונים"), t("Its text is a priests' decree, not a list of rulers.", "הטקסט שלה הוא צו של כוהנים, לא רשימת שליטים.")],
          ], correct: 0, hint: t("If you can read one of the three scripts, you can compare it with the others.", "אם אתם יכולים לקרוא אחד משלושת הכתבים, אפשר להשוות אותו לאחרים."),
          explanation: t("Because Greek was well known, the matching hieroglyphs and Demotic could be decoded.", "מכיוון שיוונית הייתה מוכרת היטב, אפשר היה לפענח את ההירוגליפים והדמוטית התואמים.") }),
        match({ id: "c-roles", title: t("Who did what?", "מי עשה מה?"), concept: t("Egyptian society", "החברה המצרית"), level: 2, objectiveId: "o-society",
          prompt: t("Match each person in an Egyptian village with their role.", "התאימו כל אדם בכפר מצרי לתפקידו."),
          pairs: [
            [t("pharaoh", "פרעה"), t("ruler, seen as both king and god", "שליט, שנחשב גם למלך וגם לאל")],
            [t("scribe", "סופר"), t("wrote records and letters in hieroglyphs", "כתב רשומות ומכתבים בהירוגליפים")],
            [t("farmer", "איכר"), t("grew the grain and paid taxes in crops", "גידל את התבואה ושילם מסים ביבולים")],
            [t("priest", "כוהן"), t("served the gods in the temple", "שירת את האלים במקדש")],
          ], hint: t("Think about who wrote, who ruled, who grew food and who prayed.", "חשבו מי כתב, מי שלט, מי גידל מזון ומי התפלל."),
          explanation: t("Egyptian society depended on all of them: the pharaoh ruled, scribes kept records, farmers fed everyone and priests kept the gods content.", "החברה המצרית נשענה על כולם: פרעה שלט, סופרים ניהלו רשומות, איכרים האכילו את כולם וכוהנים שמרו על שביעות רצון האלים.") }),
        numeric({ id: "c-pyramid", title: t("How far apart?", "כמה שנים בין?"), concept: t("measuring time", "מדידת זמן"), level: 2, objectiveId: "o-time",
          prompt: t("The Great Pyramid was built around 2560 BCE. Cleopatra VII died in 30 BCE. About how many years apart are these two events?", "הפירמידה הגדולה נבנתה בסביבות 2560 לפני הספירה. קליאופטרה השביעית מתה בשנת 30 לפני הספירה. בערך כמה שנים עברו בין שני האירועים?"), answer: 2530, unit: t("years", "שנים"),
          mistakes: [[2590, t("You added the dates. Both are BCE, so subtract the smaller number from the larger one.", "חיברתם את התאריכים. שניהם לפני הספירה, ולכן יש להפחית את המספר הקטן מהגדול.")]],
          hint: t("Both dates count backwards from year 1, so subtract: 2560 − 30.", "שני התאריכים סופרים אחורה משנה 1, ולכן מחסרים: 2560 − 30."),
          explanation: t("2560 − 30 = 2530. Cleopatra lived closer in time to us than to the builders of the Great Pyramid!", "2560 − 30 = 2530. קליאופטרה חיה קרוב יותר בזמן אלינו מאשר לבוני הפירמידה הגדולה!") }),
        choice({ id: "c-mummy", title: t("Why mummies?", "למה מומיות?"), concept: t("beliefs about the afterlife", "אמונות על החיים שלאחר המוות"), level: 2, objectiveId: "o-society",
          prompt: t("Why did ancient Egyptians preserve the bodies of important people as mummies?", "למה המצרים הקדמונים שימרו את גופות האנשים החשובים כמומיות?"),
          options: [
            [t("They believed the body was needed in the afterlife", "הם האמינו שהגוף נחוץ לחיים שלאחר המוות"), t("Yes — preserving the body was part of their beliefs about life after death.", "נכון — שימור הגוף היה חלק מאמונתם בחיים שלאחר המוות.")],
            [t("To study medicine on the dead", "כדי ללמוד רפואה על המתים"), t("Embalmers did learn about bodies, but that was not the purpose.", "החנטים אמנם למדו על הגוף, אבל זו לא הייתה המטרה.")],
            [t("To sell them to travellers", "כדי למכור אותן לנוסעים"), t("Mummification was a religious act, not a business with travellers.", "החניטה הייתה מעשה דתי, לא עסק עם נוסעים.")],
            [t("To keep the desert from spreading", "כדי למנוע מהמדבר להתפשט"), t("Mummies have nothing to do with the desert's size.", "למומיות אין קשר לגודל המדבר.")],
          ], correct: 0, hint: t("Think about what the Egyptians believed happened after death.", "חשבו על מה שהמצרים האמינו שקורה אחרי המוות."),
          explanation: t("Egyptians believed a person continued to exist after death and needed the body, so embalmers preserved it carefully.", "המצרים האמינו שאדם ממשיך להתקיים אחרי המוות וזקוק לגוף, ולכן חנטים שימרו אותו בקפידה.") }),
        sequence({ id: "c-timeline", easierId: "c-timeline-easy", title: t("Kings on the wall", "המלכים על הקיר"), concept: t("timeline of ancient Egypt", "ציר הזמן של מצרים העתיקה"), level: 3, objectiveId: "o-time",
          prompt: t("Put these events of ancient Egypt in order, from earliest to latest.", "סדרו את האירועים האלה ממצרים העתיקה מהמוקדם למאוחר."),
          items: [t("Great Pyramid built (c. 2560 BCE)", "בניית הפירמידה הגדולה (כ-2560 לפנה״ס)"), t("Reign of Tutankhamun (c. 1332–1323 BCE)", "שלטון תות-אנח-אמון (כ-1332–1323 לפנה״ס)"), t("Reign of Ramesses II (1279–1213 BCE)", "שלטון רעמסס השני (1279–1213 לפנה״ס)"), t("Death of Cleopatra VII (30 BCE)", "מותה של קליאופטרה השביעית (30 לפנה״ס)")],
          hint: t("In BCE dates, bigger numbers mean longer ago.", "בתאריכים לפני הספירה, מספרים גדולים יותר פירושם זמן רב יותר מאחור."),
          explanation: t("2560, then about 1330, then about 1279, then 30 BCE: the numbers shrink as time moves forward.", "2560, אחר כך כ-1330, אחר כך 1279, ואז 30 לפנה״ס: המספרים קטנים ככל שהזמן מתקדם.") }),
        choice({ id: "c-carter", easierId: "c-carter-easy", title: t("Who found the tomb?", "מי מצא את הקבר?"), concept: t("archaeology", "ארכיאולוגיה"), level: 2, objectiveId: "o-time",
          prompt: t("In 1922, who discovered the nearly intact tomb of Tutankhamun?", "ב-1922, מי גילה את קברו כמעט השלם של תות-אנח-אמון?"),
          options: [
            ["Howard Carter", t("Yes — the British archaeologist Howard Carter found it in the Valley of the Kings in 1922.", "נכון — הארכיאולוג הבריטי הווארד קרטר מצא אותו בעמק המלכים ב-1922.")],
            ["Jean-François Champollion", t("Champollion deciphered hieroglyphs in 1822, a hundred years earlier.", "שמפוליון פענח את ההירוגליפים ב-1822, מאה שנה קודם לכן.")],
            ["Herodotus", t("Herodotus was a Greek historian who lived over two thousand years earlier.", "הרודוטוס היה היסטוריון יווני שחי יותר מאלפיים שנה קודם.")],
            ["Cleopatra", t("Cleopatra died in 30 BCE, long after Tutankhamun's time.", "קליאופטרה מתה ב-30 לפנה״ס, הרבה אחרי תקופתו של תות-אנח-אמון.")],
          ], correct: 0, hint: t("It was an archaeologist, and the discovery happened in the 1920s.", "זה היה ארכיאולוג, והגילוי התרחש בשנות ה-20."),
          explanation: t("Howard Carter's team opened the tomb in 1922 and found thousands of objects, including the famous golden mask.", "הצוות של הווארד קרטר פתח את הקבר ב-1922 ומצא אלפי חפצים, ובהם המסכה הזהובה המפורסמת.") }),

        choice({ id: "c-nile-easy", title: t("Why the Nile? (warm-up)", "למה הנילוס? (חימום)"), concept: t("the Nile", "הנילוס"), level: 1, objectiveId: "o-nile",
          prompt: t("Why was the yearly flood of the Nile so important to Egyptian farmers?", "למה היה שיטפון הנילוס השנתי כל כך חשוב לחקלאים המצרים?"),
          options: [
            [t("It brought sea fish to the villages", "הוא הביא דגי ים לכפרים"), t("The Nile is a freshwater river; it does not bring sea fish.", "הנילוס הוא נהר מים מתוקים; הוא לא מביא דגי ים.")],
            [t("It left rich, fertile mud on the fields", "הוא השאיר בוץ עשיר ופורה על השדות"), t("Yes — the flood deposited fertile silt, so crops grew well in a very dry land.", "נכון — השיטפון הפקיד סחף פורה, ולכן היבולים גדלו היטב בארץ יבשה מאוד.")],
          ], correct: 1, hint: t("Egypt gets almost no rain. Where did the farmers' soil and water come from?", "במצרים כמעט לא יורד גשם. מאיפה הגיעו האדמה והמים של החקלאים?"),
          explanation: t("The flood watered the land and left fertile silt. That is why most Egyptians lived along the river.", "השיטפון השקה את האדמה והשאיר סחף פורה. לכן רוב המצרים חיו לאורך הנהר.") }),
        sequence({ id: "c-timeline-easy", title: t("Kings on the wall (warm-up)", "המלכים על הקיר (חימום)"), concept: t("timeline of ancient Egypt", "ציר הזמן של מצרים העתיקה"), level: 2, objectiveId: "o-time",
          prompt: t("Put these three events of ancient Egypt in order, from earliest to latest.", "סדרו את שלושת האירועים האלה ממצרים העתיקה מהמוקדם למאוחר."),
          items: [t("Great Pyramid built (c. 2560 BCE)", "בניית הפירמידה הגדולה (כ-2560 לפנה״ס)"), t("Reign of Ramesses II (1279–1213 BCE)", "שלטון רעמסס השני (1279–1213 לפנה״ס)"), t("Death of Cleopatra VII (30 BCE)", "מותה של קליאופטרה השביעית (30 לפנה״ס)")],
          hint: t("In BCE dates, bigger numbers mean longer ago.", "בתאריכים לפני הספירה, מספרים גדולים יותר פירושם זמן רב יותר מאחור."),
          explanation: t("2560, then 1279, then 30 BCE: the numbers shrink as time moves forward.", "2560, אחר כך 1279, ואז 30 לפנה״ס: המספרים קטנים ככל שהזמן מתקדם.") }),
        choice({ id: "c-carter-easy", title: t("Who found the tomb? (warm-up)", "מי מצא את הקבר? (חימום)"), concept: t("archaeology", "ארכיאולוגיה"), level: 1, objectiveId: "o-time",
          prompt: t("In 1922, who discovered the nearly intact tomb of Tutankhamun?", "ב-1922, מי גילה את קברו כמעט השלם של תות-אנח-אמון?"),
          options: [
            ["Cleopatra", t("Cleopatra died in 30 BCE, long after Tutankhamun's time.", "קליאופטרה מתה ב-30 לפנה״ס, הרבה אחרי תקופתו של תות-אנח-אמון.")],
            ["Howard Carter", t("Yes — the British archaeologist Howard Carter found it in the Valley of the Kings in 1922.", "נכון — הארכיאולוג הבריטי הווארד קרטר מצא אותו בעמק המלכים ב-1922.")],
          ], correct: 1, hint: t("The finder was an archaeologist of the 1920s, not a ruler of ancient Egypt.", "המגלה היה ארכיאולוג בשנות ה-20 של המאה ה-20, לא שליט של מצרים העתיקה."),
          explanation: t("Howard Carter's team opened the tomb in the Valley of the Kings in 1922.", "הצוות של הווארד קרטר פתח את הקבר בעמק המלכים ב-1922.") }),
      ],
    };
  },

  extensions(lang: Lang) {
    const t = translator(lang);
    return [
      {
        mechanics: ["collect", "dialogue"],
        objectives: [{ id: "o-religion", text: t("Recognise key beliefs, gods and materials of ancient Egypt", "לזהות אמונות, אלים וחומרים מרכזיים במצרים העתיקה") }],
        conclusion: t(
          "You also met the gods, the papyrus and the purpose of the pyramids — the beliefs and tools that tied Egyptian life together.",
          "פגשתם גם את האלים, את הפפירוס ואת מטרת הפירמידות — האמונות והכלים שקשרו יחד את החיים במצרים.",
        ),
        areas: [
          {
            id: "a-temple", name: t("Temple of the Gods", "מקדש האלים"), size: "medium", layout: "plaza", hazardLevel: "none",
            description: t("Tall columns and carved walls shade a courtyard where priests once worked.", "עמודים גבוהים וקירות מגולפים מצלים על חצר שבה פעלו פעם כוהנים."),
            stations: [
              challengeStation("s-gods", t("Wall of Gods", "קיר האלים"), "c-gods"),
              challengeStation("s-papyrus", t("Scroll Room", "חדר המגילות"), "c-papyrus"),
              challengeStation("s-purpose", t("Pyramid Model", "דגם הפירמידה"), "c-purpose"),
            ],
            npcs: [npc("n-meryt", "Meryt", t("Temple priestess", "כוהנת המקדש"), "#c0392b", "human", [t("Every carving here has a meaning. Look closely before you answer.", "לכל גילוף כאן יש משמעות. התבוננו היטב לפני שתענו.")])],
            collectibles: { kind: "gem", count: 3, label: t("Scarab gems", "אבני חיפושית") },
          },
        ],
        missions: [
          { id: "m-temple", title: t("Wisdom of the Temple", "חוכמת המקדש"), areaId: "a-temple", requires: [], story: t("Meryt asks you to prove you understand the temple's carvings.", "מריט מבקשת שתוכיחו שאתם מבינים את גילופי המקדש."), objectives: [
            { type: "talk", text: t("Talk to Meryt", "דברו עם מריט"), npcId: "n-meryt" },
            { type: "solve", text: t("Answer all three temple riddles", "ענו על שלוש חידות המקדש"), challengeIds: ["c-gods", "c-papyrus", "c-purpose"] },
          ] },
        ],
        challenges: [
          match({ id: "c-gods", title: t("Gods of Egypt", "אלי מצרים"), concept: t("Egyptian gods", "אלי מצרים"), level: 2, objectiveId: "o-religion",
            prompt: t("Match each Egyptian god with their role.", "התאימו כל אל מצרי לתפקידו."),
            pairs: [
              ["Ra", t("god of the sun", "אל השמש")],
              ["Anubis", t("god of embalming, shown with a jackal head", "אל החניטה, מצויר עם ראש תן")],
              ["Osiris", t("ruler of the afterlife", "שליט העולם הבא")],
              ["Isis", t("goddess of magic and motherhood", "אלת הקסם והאימהות")],
            ], hint: t("Anubis looks after the dead; Ra crosses the sky each day.", "אנוביס מטפל במתים; רע חוצה את השמיים בכל יום."),
            explanation: t("Egyptians honoured many gods, each linked to part of nature or life.", "המצרים כיבדו אלים רבים, וכל אחד מהם קשור לחלק מהטבע או מהחיים.") }),
          choice({ id: "c-papyrus", title: t("What is papyrus?", "מהו פפירוס?"), concept: t("writing materials", "חומרי כתיבה"), level: 1, objectiveId: "o-religion",
            prompt: t("What was papyrus?", "מהו פפירוס?"),
            options: [
              [t("A writing material made from a reed-like plant of the Nile", "חומר כתיבה העשוי מצמח דמוי קנה מהנילוס"), t("Yes — strips of the plant were pressed together to make sheets for writing.", "נכון — רצועות מהצמח נלחצו יחד ליצירת דפי כתיבה.")],
              [t("A kind of stone used for statues", "סוג אבן המשמש לפסלים"), t("Statues were made of stone, but papyrus is a plant.", "פסלים נעשו מאבן, אבל פפירוס הוא צמח.")],
              [t("A type of Egyptian boat", "סוג של סירה מצרית"), t("Boats were sometimes made of papyrus reeds, but the word names the plant and the paper made from it.", "סירות נעשו לפעמים מקני פפירוס, אבל המילה מציינת את הצמח ואת הנייר העשוי ממנו.")],
              [t("A god of writing", "אל הכתיבה"), t("The god of writing was Thoth.", "אל הכתיבה היה תות.")],
            ], correct: 0, hint: t("The word “paper” comes from it.", "המילה ״נייר״ בשפות רבות מגיעה ממנו."),
            explanation: t("Papyrus grew along the Nile and was pressed into sheets — the ancestor of paper.", "פפירוס צמח לאורך הנילוס ונלחץ לדפים — אב קדמון של הנייר.") }),
          choice({ id: "c-purpose", title: t("Why pyramids?", "למה פירמידות?"), concept: t("pyramids", "פירמידות"), level: 1, objectiveId: "o-religion",
            prompt: t("What was the main purpose of the great pyramids?", "מהי המטרה העיקרית של הפירמידות הגדולות?"),
            options: [
              [t("Royal tombs for pharaohs", "קברים מלכותיים לפרעונים"), t("Yes — the pyramids were built as tombs for pharaohs.", "נכון — הפירמידות נבנו כקברים לפרעונים.")],
              [t("Grain stores for the whole country", "מחסני תבואה לכל הארץ"), t("Grain was kept in storehouses, not in pyramids.", "תבואה אוחסנה במחסנים, לא בפירמידות.")],
              [t("Lighthouses for ships on the Nile", "מגדלורים לספינות בנילוס"), t("The Nile had no lighthouses like those of the Mediterranean.", "בנילוס לא היו מגדלורים כמו אלה של הים התיכון.")],
              [t("Palaces where kings lived", "ארמונות שבהם חיו מלכים"), t("Kings lived in palaces; pyramids were for the afterlife.", "מלכים גרו בארמונות; הפירמידות נועדו לחיים שלאחר המוות.")],
            ], correct: 0, hint: t("Think about where a pharaoh was buried.", "חשבו על המקום שבו נקבר פרעה."),
            explanation: t("The Great Pyramid of Giza was built as the tomb of the pharaoh Khufu.", "הפירמידה הגדולה בגיזה נבנתה כקברו של הפרעה חופו.") }),
        ],
      },
    ];
  },
};
