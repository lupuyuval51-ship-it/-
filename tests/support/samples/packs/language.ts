import { challengeStation, choice, loreStation, match, npc, numeric, sequence, translator, type Lang } from "@/lib/game/builders";
import type { DemoPack } from "../types";

export const languagePack: DemoPack = {
  id: "language",
  category: "language",
  keywords: /spanish|espa[nñ]ol|\blanguages?\b|vocabular|grammar|greeting|translat|ספרדית|שפה|שפות|אוצר מילים|דקדוק|ברכות|תרגום/i,
  gameType: "exploration",
  environment: "forest",
  timeOfDay: "day",
  topic: (lang) => translator(lang)("Spanish basics: greetings, polite words, numbers, colours and family", "יסודות הספרדית: ברכות, מילות נימוס, מספרים, צבעים ומשפחה"),
  title: (lang) => translator(lang)("Spanish Trail", "שביל הספרדית"),
  tagline: (lang) => translator(lang)("Pick up your first Spanish words while exploring a sunny village.", "למדו את המילים הראשונות בספרדית תוך כדי טיול בכפר שטוף שמש."),

  build(lang: Lang) {
    const t = translator(lang);
    return {
      mechanics: ["collect", "dialogue", "portals", "checkpoints", "adaptive_difficulty", "jump"],
      objectives: [
        { id: "o-greet", text: t("Greet people and introduce yourself in Spanish", "לברך אנשים ולהציג את עצמכם בספרדית") },
        { id: "o-words", text: t("Recognise everyday words: numbers, colours and family", "לזהות מילים יומיומיות: מספרים, צבעים ומשפחה") },
        { id: "o-polite", text: t("Use polite expressions in a shop", "להשתמש בביטויי נימוס בחנות") },
      ],
      conclusion: t(
        "You greeted people, introduced yourself, read numbers, colours and family words and bought bread politely — real Spanish you can use right away. Keep practising a little every day.",
        "בירכתם אנשים, הצגתם את עצמכם, קראתם מספרים, צבעים ומילות משפחה וקניתם לחם בנימוס — ספרדית אמיתית שאפשר להשתמש בה מיד. המשיכו להתאמן קצת בכל יום.",
      ),
      areas: [
        {
          id: "a-plaza", name: t("Village Square", "כיכר הכפר"), size: "medium", layout: "plaza", hazardLevel: "none",
          description: t("A sunny square with a fountain, where everybody greets everybody.", "כיכר שטופת שמש עם מזרקה, שבה כולם מברכים את כולם."),
          intro: t("You have just arrived in a Spanish-speaking village. Time for your first words!", "הרגע הגעתם לכפר דובר ספרדית. הגיע הזמן למילים הראשונות!"),
          stations: [
            challengeStation("s-hello", t("Welcome Sign", "שלט קבלת הפנים"), "c-hello"),
            challengeStation("s-polite", t("Manners Board", "לוח נימוסים"), "c-polite"),
            challengeStation("s-intro", t("Meeting Bench", "ספסל ההיכרות"), "c-intro"),
            challengeStation("s-colors", t("Paint Stall", "דוכן הצבעים"), "c-colors"),
            loreStation("s-lore1", t("Fountain Plaque", "לוח המזרקה"), t("Spanish around the world", "ספרדית בעולם"), t("Spanish is spoken by hundreds of millions of people and is an official language in more than twenty countries — from Spain and Mexico to Argentina and Chile. Learning it opens doors in many places.", "ספרדית מדוברת בפי מאות מיליוני אנשים והיא שפה רשמית ביותר מעשרים מדינות — מספרד ומקסיקו ועד ארגנטינה וצ׳ילה. לימוד שלה פותח דלתות במקומות רבים.")),
          ],
          npcs: [npc("n-sol", "Sol", t("Village greeter", "מברכת הכפר"), "#ffc63d", "human", [
            t("¡Hola! Welcome to our village. I will teach you to say hello properly.", "¡Hola! ברוכים הבאים לכפר שלנו. אלמד אתכם לומר שלום כמו שצריך."),
            t("Don't worry about mistakes. Everybody here loves it when visitors try Spanish!", "אל תדאגו מטעויות. כל מי שכאן אוהב כשמבקרים מנסים ספרדית!"),
          ], t("Stuck? Signs have hints — they cost a few points, but learning is worth it.", "תקועים? בשלטים יש רמזים — הם עולים כמה נקודות, אבל הלמידה שווה את זה."))],
          collectibles: { kind: "star", count: 4, label: t("Word stars", "כוכבי מילים") },
          portal: { toAreaId: "a-market", label: t("Road to Market Street", "הדרך לרחוב השוק"), requiresMissionIds: ["m-meet"] },
        },
        {
          id: "a-market", name: t("Market Street", "רחוב השוק"), size: "medium", layout: "corridor", hazardLevel: "none",
          description: t("A long street of stalls selling bread, fruit and flowers.", "רחוב ארוך של דוכנים שמוכרים לחם, פירות ופרחים."),
          stations: [
            challengeStation("s-num", t("Coin Counter", "מונה המטבעות"), "c-num"),
            challengeStation("s-family", t("Photo Wall", "קיר התמונות"), "c-family"),
            challengeStation("s-food", t("Water Stand", "דוכן המים"), "c-food"),
            challengeStation("s-shop", t("Bakery Counter", "דלפק המאפייה"), "c-shop"),
          ],
          npcs: [npc("n-pedro", "Pedro", t("Baker", "אופה"), "#c0392b", "human", [
            t("Buenos días! Fresh bread, fresh bread!", "Buenos días! לחם טרי, לחם טרי!"),
            t("Say please and thank you and I will always give you the best loaf.", "אמרו בבקשה ותודה ואתן לכם תמיד את הכיכר הטובה ביותר."),
          ])],
          collectibles: { kind: "star", count: 3, label: t("Word stars", "כוכבי מילים") },
        },
      ],
      missions: [
        { id: "m-greet", title: t("Say Hello", "לומר שלום"), areaId: "a-plaza", requires: [], story: t("Sol will teach you the first words of every conversation.", "סול תלמד אתכם את המילים הראשונות בכל שיחה."), objectives: [
          { type: "talk", text: t("Talk to Sol", "דברו עם סול"), npcId: "n-sol" },
          { type: "solve", text: t("Read the sign and the manners board", "קראו את השלט ואת לוח הנימוסים"), challengeIds: ["c-hello", "c-polite"] },
        ] },
        { id: "m-meet", title: t("Meet the Villagers", "להכיר את תושבי הכפר"), areaId: "a-plaza", requires: ["m-greet"], story: t("Time to introduce yourself and learn the colours.", "הגיע הזמן להציג את עצמכם וללמוד את הצבעים."), objectives: [
          { type: "solve", text: t("Build a first conversation and name the colours", "בנו שיחה ראשונה ושמו את הצבעים"), challengeIds: ["c-intro", "c-colors"] },
          { type: "collect", text: t("Collect 2 word stars", "אספו 2 כוכבי מילים"), count: 2 },
          { type: "visit", text: t("Read the fountain plaque", "קראו את לוח המזרקה"), stationIds: ["s-lore1"] },
        ] },
        { id: "m-market", title: t("To the Market", "אל השוק"), areaId: "a-market", requires: ["m-meet"], story: t("Pedro needs a customer who can count and name the family in the photos.", "פדרו צריך לקוח שיודע לספור ולקרוא בשמם את בני המשפחה בתמונות."), objectives: [
          { type: "talk", text: t("Talk to Pedro", "דברו עם פדרו"), npcId: "n-pedro" },
          { type: "solve", text: t("Count the coins and read the photo wall", "ספרו את המטבעות וקראו את קיר התמונות"), challengeIds: ["c-num", "c-family"] },
        ] },
        { id: "m-shop", title: t("Buy Some Bread", "לקנות לחם"), areaId: "a-market", requires: ["m-market"], story: t("Ask for water and buy bread — politely, in Spanish.", "בקשו מים וקנו לחם — בנימוס, בספרדית."), objectives: [
          { type: "solve", text: t("Ask for water and have a polite shop conversation", "בקשו מים וקיימו שיחה מנומסת בחנות"), challengeIds: ["c-food", "c-shop"] },
          { type: "collect", text: t("Collect 2 word stars", "אספו 2 כוכבי מילים"), count: 2 },
        ] },
      ],
      challenges: [
        choice({ id: "c-hello", title: t("Good morning!", "בוקר טוב!"), concept: t("greetings", "ברכות"), level: 1, objectiveId: "o-greet",
          prompt: t("How do you say “Good morning” in Spanish?", "איך אומרים ״בוקר טוב״ בספרדית?"),
          options: [
            ["Buenos días", t("Yes — “Buenos días” is used in the morning.", "נכון — ״Buenos días״ אומרים בבוקר.")],
            ["Buenas noches", t("“Buenas noches” means “Good night”.", "״Buenas noches״ פירושו ״לילה טוב״.")],
            ["Gracias", t("“Gracias” means “Thank you”.", "״Gracias״ פירושו ״תודה״.")],
            ["Adiós", t("“Adiós” means “Goodbye”.", "״Adiós״ פירושו ״להתראות״.")],
          ], correct: 0, hint: t("“Día” means day; “buenos” means good.", "״Día״ פירושו יום; ״buenos״ פירושו טובים."),
          explanation: t("“Buenos días” = “good days” = good morning. In the evening you would say “Buenas tardes” or “Buenas noches”.", "״Buenos días״ = ״ימים טובים״ = בוקר טוב. בערב אומרים ״Buenas tardes״ או ״Buenas noches״.") }),
        match({ id: "c-polite", title: t("Polite words", "מילות נימוס"), concept: t("polite expressions", "ביטויי נימוס"), level: 1, objectiveId: "o-polite",
          prompt: t("Match each Spanish expression with its meaning.", "התאימו כל ביטוי בספרדית למשמעותו."),
          pairs: [
            ["Gracias", t("Thank you", "תודה")],
            ["Por favor", t("Please", "בבקשה (כשמבקשים)")],
            ["De nada", t("You're welcome", "על לא דבר")],
            ["Perdón", t("Sorry / Excuse me", "סליחה")],
          ], hint: t("You will hear “por favor” and “gracias” all day long.", "תשמעו ״por favor״ ו״gracias״ כל היום."),
          explanation: t("“Gracias” says thanks, “De nada” is the reply, “Por favor” asks politely and “Perdón” says sorry.", "״Gracias״ אומר תודה, ״De nada״ הוא התשובה, ״Por favor״ מבקש בנימוס ו״Perdón״ אומר סליחה.") }),
        sequence({ id: "c-intro", title: t("A first conversation", "שיחה ראשונה"), concept: t("introducing yourself", "היכרות"), level: 2, objectiveId: "o-greet",
          prompt: t("Put this first meeting in order: greet, ask the name, answer, and say it is nice to meet you.", "סדרו את הפגישה הראשונה: ברכה, שאלה לשם, תשובה, ואמירה שנעים להכיר."),
          items: ["Hola.", "¿Cómo te llamas?", "Me llamo Ana.", "Mucho gusto."],
          hint: t("First the greeting, then the question, then the answer, then the polite closing.", "קודם הברכה, אחר כך השאלה, אחר כך התשובה, ובסוף הסיום המנומס."),
          explanation: t("“Hola.” (Hello.) “¿Cómo te llamas?” (What is your name?) “Me llamo Ana.” (My name is Ana.) “Mucho gusto.” (Nice to meet you.)", "״Hola.״ (שלום.) ״¿Cómo te llamas?״ (איך קוראים לך?) ״Me llamo Ana.״ (קוראים לי אנה.) ״Mucho gusto.״ (נעים מאוד.)") }),
        match({ id: "c-colors", title: t("Colours", "צבעים"), concept: t("colours", "צבעים"), level: 2, objectiveId: "o-words",
          prompt: t("Match each Spanish colour with its English meaning.", "התאימו כל צבע בספרדית למשמעותו בעברית."),
          pairs: [["rojo", t("red", "אדום")], ["azul", t("blue", "כחול")], ["verde", t("green", "ירוק")], ["amarillo", t("yellow", "צהוב")]],
          hint: t("“Verde” looks a bit like “vegetable”.", "״Verde״ דומה למילה ״ורדור״ — כמו ירוק."),
          explanation: t("rojo = red, azul = blue, verde = green, amarillo = yellow.", "rojo = אדום, azul = כחול, verde = ירוק, amarillo = צהוב.") }),
        numeric({ id: "c-num", title: t("Count the coins", "ספרו את המטבעות"), concept: t("numbers", "מספרים"), level: 1, objectiveId: "o-words", harderId: "c-num-hard",
          prompt: t("Solve and answer with a digit:\ndos + tres = ?", "פתרו וענו בספרה:\ndos + tres = ?"), answer: 5,
          mistakes: [[6, t("“seis” is 6. dos is 2 and tres is 3, so the sum is cinco.", "״seis״ הוא 6. dos הוא 2 ו-tres הוא 3, ולכן הסכום הוא cinco.")], [23, t("Do not write the digits side by side — add them.", "אל תכתבו את הספרות זו ליד זו — חברו אותן.")]],
          hint: t("uno 1, dos 2, tres 3, cuatro 4, cinco 5.", "uno 1, dos 2, tres 3, cuatro 4, cinco 5."), explanation: t("dos (2) + tres (3) = cinco (5).", "dos (2) + tres (3) = cinco (5).") }),
        numeric({ id: "c-num-hard", title: t("Count the coins (challenge)", "ספרו את המטבעות (אתגר)"), concept: t("numbers", "מספרים"), level: 2, objectiveId: "o-words",
          prompt: t("Solve and answer with a digit:\ndiez − seis = ?", "פתרו וענו בספרה:\ndiez − seis = ?"), answer: 4,
          mistakes: [[16, t("You added. The sign is a minus.", "חיברתם. הסימן הוא פחות.")]],
          hint: t("diez is 10 and seis is 6.", "diez הוא 10 ו-seis הוא 6."), explanation: t("diez (10) − seis (6) = cuatro (4).", "diez (10) − seis (6) = cuatro (4).") }),
        match({ id: "c-family", title: t("The family photos", "תמונות המשפחה"), concept: t("family words", "מילות משפחה"), level: 2, objectiveId: "o-words",
          prompt: t("Match each family word with its meaning.", "התאימו כל מילת משפחה למשמעותה."),
          pairs: [["madre", t("mother", "אמא")], ["padre", t("father", "אבא")], ["hermano", t("brother", "אח")], ["hermana", t("sister", "אחות")]],
          hint: t("Words ending in -o are usually masculine, and in -a feminine.", "מילים שמסתיימות ב-o הן בדרך כלל בלשון זכר, וב-a בלשון נקבה."),
          explanation: t("madre = mother, padre = father, hermano = brother, hermana = sister. Notice the -o and -a endings.", "madre = אמא, padre = אבא, hermano = אח, hermana = אחות. שימו לב לסיומות o ו-a.") }),
        choice({ id: "c-food", title: t("Water, please", "מים, בבקשה"), concept: t("food and drink", "אוכל ושתייה"), level: 2, objectiveId: "o-words",
          prompt: t("You are thirsty. Which word means “water”?", "אתם צמאים. איזו מילה פירושה ״מים״?"),
          options: [
            ["agua", t("Yes — “agua” means water.", "נכון — ״agua״ פירושו מים.")],
            ["pan", t("“pan” means bread.", "״pan״ פירושו לחם.")],
            ["leche", t("“leche” means milk.", "״leche״ פירושו חלב.")],
            ["manzana", t("“manzana” means apple.", "״manzana״ פירושו תפוח.")],
          ], correct: 0, hint: t("Think of “aquarium”.", "חשבו על המילה ״אקווריום״."),
          explanation: t("agua = water, pan = bread, leche = milk, manzana = apple.", "agua = מים, pan = לחם, leche = חלב, manzana = תפוח.") }),
        sequence({ id: "c-shop", title: t("At the bakery", "במאפייה"), concept: t("shopping conversation", "שיחה בחנות"), level: 3, objectiveId: "o-polite",
          prompt: t("Put this shop conversation in order.", "סדרו את השיחה בחנות."),
          items: ["Buenos días.", "¿Cuánto cuesta el pan?", "Dos euros, por favor.", "Gracias. ¡Adiós!"],
          hint: t("Greet, ask the price, hear the answer, say thanks and goodbye.", "מברכים, שואלים את המחיר, שומעים את התשובה, אומרים תודה ולהתראות."),
          explanation: t("Good morning. How much is the bread? Two euros, please. Thank you. Goodbye!", "בוקר טוב. כמה עולה הלחם? שני אירו, בבקשה. תודה. להתראות!") }),
      ],
    };
  },

  extensions(lang: Lang) {
    const t = translator(lang);
    return [
      {
        mechanics: ["collect", "dialogue"],
        objectives: [{ id: "o-more", text: t("Talk about the days of the week, the time and animals", "לדבר על ימי השבוע, השעה ובעלי חיים") }],
        conclusion: t(
          "You also learned the days of the week, how to ask the time and the names of common animals — enough for a relaxed chat at a café.",
          "למדתם גם את ימי השבוע, איך לשאול מה השעה ואת שמותיהם של בעלי חיים נפוצים — מספיק לשיחה נינוחה בבית קפה.",
        ),
        areas: [
          {
            id: "a-cafe", name: t("Seaside Café", "בית הקפה שליד הים"), size: "medium", layout: "plaza", hazardLevel: "none",
            description: t("A café by the beach where the menu is a blackboard full of Spanish.", "בית קפה על החוף שבו התפריט הוא לוח שחור מלא בספרדית."),
            stations: [
              challengeStation("s-days", t("Weekly Menu", "תפריט שבועי"), "c-days"),
              challengeStation("s-time", t("Café Clock", "שעון בית הקפה"), "c-time"),
              challengeStation("s-animals", t("Pet Corner", "פינת החיות"), "c-animals"),
            ],
            npcs: [npc("n-lucia", "Lucía", t("Café owner", "בעלת בית הקפה"), "#2dd4bf", "human", [t("¡Bienvenidos! Order whatever you like — in Spanish, of course.", "¡Bienvenidos! הזמינו מה שתרצו — בספרדית, כמובן.")])],
            collectibles: { kind: "star", count: 3, label: t("Word stars", "כוכבי מילים") },
          },
        ],
        missions: [
          { id: "m-cafe", title: t("A Chat at the Café", "שיחה בבית הקפה"), areaId: "a-cafe", requires: [], story: t("Lucía would like to chat about the week, the time and her pets.", "לוסיה רוצה לשוחח על השבוע, על השעה ועל חיות המחמד שלה."), objectives: [
            { type: "talk", text: t("Talk to Lucía", "דברו עם לוסיה"), npcId: "n-lucia" },
            { type: "solve", text: t("Answer the menu, the clock and the pets", "ענו על התפריט, השעון והחיות"), challengeIds: ["c-days", "c-time", "c-animals"] },
          ] },
        ],
        challenges: [
          sequence({ id: "c-days", title: t("Days of the week", "ימי השבוע"), concept: t("days of the week", "ימי השבוע"), level: 2, objectiveId: "o-more",
            prompt: t("Put these days in order, starting with Monday.", "סדרו את הימים האלה, החל מיום שני."),
            items: ["lunes", "martes", "miércoles", "jueves"],
            hint: t("lunes = Monday. The week continues one day at a time.", "lunes = יום שני. השבוע ממשיך יום אחר יום."),
            explanation: t("lunes (Monday), martes (Tuesday), miércoles (Wednesday), jueves (Thursday).", "lunes (יום שני), martes (יום שלישי), miércoles (יום רביעי), jueves (יום חמישי).") }),
          choice({ id: "c-time", title: t("What time is it?", "מה השעה?"), concept: t("asking the time", "לשאול מה השעה"), level: 2, objectiveId: "o-more",
            prompt: t("Which question means “What time is it?”", "איזו שאלה פירושה ״מה השעה?״"),
            options: [
              ["¿Qué hora es?", t("Yes — “hora” means hour or time.", "נכון — ״hora״ פירושו שעה.")],
              ["¿Cómo te llamas?", t("That asks “What is your name?”", "זו שאלה ״איך קוראים לך?״")],
              ["¿Cómo estás?", t("That asks “How are you?”", "זו שאלה ״מה שלומך?״")],
              ["¿Dónde está el baño?", t("That asks “Where is the bathroom?”", "זו שאלה ״איפה השירותים?״")],
            ], correct: 0, hint: t("Look for the word “hora”.", "חפשו את המילה ״hora״."),
            explanation: t("“¿Qué hora es?” literally asks “What hour is it?”", "״¿Qué hora es?״ שואל פשוטו כמשמעו ״איזו שעה זו?״") }),
          match({ id: "c-animals", title: t("Animals", "בעלי חיים"), concept: t("animals", "בעלי חיים"), level: 1, objectiveId: "o-more",
            prompt: t("Match each Spanish animal word with its meaning.", "התאימו כל שם של בעל חיים בספרדית למשמעותו."),
            pairs: [["perro", t("dog", "כלב")], ["gato", t("cat", "חתול")], ["pájaro", t("bird", "ציפור")], ["pez", t("fish", "דג")]],
            hint: t("“Gato” sounds a bit like “gatito”, a kitten.", "״Gato״ נשמע קצת כמו ״gatito״, חתלתול."),
            explanation: t("perro = dog, gato = cat, pájaro = bird, pez = fish.", "perro = כלב, gato = חתול, pájaro = ציפור, pez = דג.") }),
        ],
      },
    ];
  },
};
