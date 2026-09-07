/**
 * Exercise catalog – Part C2: game / pressure drills (gm-*), end-of-session challenges (generic ch-*)
 * and cool-down items (cd-*).
 * Every entry matches its row in src/content/manifest.ts (id, name, category, skills, roles, participants,
 * equipment, levels, intensity are copied verbatim from the manifest).
 *
 * Conventions shared by this file:
 *  - "gate" = two cones 2 m apart; a throw counts when the disc passes between them on the fly, below 2 m.
 *  - "within 2 m of the cone" = the disc comes to rest inside a 2 m radius of the target cone (solo targets).
 *  - Every challenge (ch-*) states one exact pass criterion and a maximum number of attempts.
 *  - Scores (0–100) always come from 10 reps × 10 points so a set score is comparable across sessions.
 */
import type { Exercise } from "@/lib/types";

const ALL_FIELDS: Exercise["fieldSizes"] = ["small", "medium", "large", "indoor", "park", "beach", "yard"];
/** Needs roughly 20 m × 15 m of clear space – a back yard is too small. */
const OPEN_FIELDS: Exercise["fieldSizes"] = ["small", "medium", "large", "indoor", "park", "beach"];
/** Needs a 60 m+ corridor for full-power throws. */
const DEEP_FIELDS: Exercise["fieldSizes"] = ["medium", "large", "park", "beach"];
const ALL_AGES: Exercise["ageGroups"] = ["kid", "teen", "adult", "senior"];

/* ------------------------------------------------------------------ */
/* Game / pressure drills                                               */
/* ------------------------------------------------------------------ */

const gmCatchReleaseCircuit: Exercise = {
  id: "gm-catch-release-circuit",
  name: { he: "מעגל Catch & Release", en: "Catch-and-release circuit" },
  category: "game",
  skills: ["release_speed", "catching", "decision_making"],
  roles: ["handler", "cutter", "wing", "hybrid", "allround"],
  levels: ["beginner", "intermediate", "advanced"],
  phases: ["game"],
  goal: { he: "לחבר תפיסה, Pivot וזריקה לתנועה אחת גם כשהרגליים כבר עייפות: מקיפים ארבע תחנות, ובכל תחנה תופסים ומשחררים בתוך שנייה וחצי לצד שהמוסר מסמן.", en: "Link catch, pivot and throw into one movement even on tired legs: move around four stations and at each one catch and release within 1.5 seconds to the side the feeder signals." },
  participants: ["solo", "pair", "group"],
  equipment: ["cones"],
  optionalEquipment: ["discs", "stopwatch"],
  fieldSizes: ALL_FIELDS,
  intensity: "medium",
  offenseDefense: "offense",
  wind: "any",
  ageGroups: ALL_AGES,
  durationMinutes: 8,
  minDurationMinutes: 6,
  maxDurationMinutes: 12,
  sets: 3,
  reps: 8,
  restSeconds: 60,
  setup: {
    he: "ארבעה קונוסים בריבוע של 12 מטר (A, B, C, D). המוסר עומד במרכז הריבוע עם 3–4 דיסקים ליד הרגל. אתם מתחילים ליד A. לבד – הניחו דיסק ליד כל קונוס (ראו גרסת סולו).",
    en: "Four cones in a 12 m square (A, B, C, D). The feeder stands in the centre with 3–4 discs by their foot. You start at A. Solo – place a disc beside each cone (see the solo version)." },
  instructions: [
    { he: "רצים ל-A. המוסר זורק לחזה ברגע שאתם מגיעים לקונוס: תופסים, Pivot אחד ומחזירים למוסר – השחרור בתוך שנייה וחצי (המוסר סופר ״אחת-ו״). מיד ממשיכים בריצה קלה ל-B, ושוב. 2 הקפות = 8 חזרות בסט.", en: "Run to A. The feeder throws to your chest as you reach the cone: catch, one pivot and return to the feeder – release within 1.5 seconds (the feeder counts \"one-and\"). Jog straight on to B, and again. 2 laps = 8 reps per set." },
    { he: "סט 1: מחזירים לחזה של המוסר בזריקה שנוחה לכם. סט 2: כשהדיסק באוויר המוסר מרים יד לצד – יד לצד ה-Backhand שלכם = מחזירים Backhand, לצד ה-Forehand = Forehand.", en: "Set 1: return to the feeder's chest with whichever throw is comfortable. Set 2: while the disc is in the air the feeder raises a hand to one side – your backhand side = return backhand, your forehand side = forehand." },
    { he: "סט 3: אחרי הזריקה המוסר זז 3 מטרים לכיוון כלשהו – אתם צריכים למצוא אותו עם העיניים לפני שהדיסק נוגע בידיים ולפגוע בו בזריקה.", en: "Set 3: after throwing, the feeder moves 3 m in any direction – find them with your eyes before the disc reaches your hands and hit them with the return." },
    { he: "חזרה מוצלחת = תפיסה נקייה, שחרור בתוך שנייה וחצי, והמוסר תופס בלי לזוז יותר מצעד. סופרים מתוך 8 בכל סט, 60 שניות מנוחה, ורושמים את הסכום מתוך 24.", en: "A successful rep = clean catch, release within 1.5 seconds, and the feeder catches without moving more than a step. Count out of 8 per set, rest 60 seconds, and log the total out of 24." },
  ],
  cues: [
    { he: "האחיזה הבאה כבר בתפיסה – היד הזורקת נוחתת על השפה.", en: "The next grip is already in the catch – the throwing hand lands on the rim." },
    { he: "עיניים למטרה לפני שהדיסק נוגע בידיים.", en: "Eyes on the target before the disc touches your hands." },
    { he: "Pivot אחד. לא שניים.", en: "One pivot. Not two." },
  ],
  commonMistakes: [
    { he: "עוצרים, מסדרים אחיזה, מרימים ראש – ושנייה וחצי כבר עברה.", en: "Stopping, fixing the grip, looking up – and 1.5 seconds are gone." },
    { he: "רצים לתחנה הבאה עם הגב למוסר, ואז הדיסק מפתיע.", en: "Running to the next station with your back to the feeder, so the disc surprises you." },
    { he: "מהירות על חשבון דיוק – החזרה מהירה שהמוסר רודף אחריה לא נספרת.", en: "Speed at the expense of accuracy – a fast return the feeder has to chase doesn't count." },
  ],
  successMetric: { type: "ratio", key: "catch_release_pct", label: { he: "תפיסה נקייה ושחרור מדויק בתוך שנייה וחצי, מתוך 24", en: "Clean catch and accurate release within 1.5 seconds, out of 24" }, target: 70, attempts: 24 },
  easierVersion: { he: "ריבוע של 8 מטר, הליכה מהירה בין התחנות, ו-2.5 שניות לשחרור. ילדים: זריקות רכות לחזה בלבד.", en: "An 8 m square, a brisk walk between stations, and 2.5 seconds to release. Kids: soft chest-high throws only." },
  harderVersion: { he: "ריבוע של 15 מטר, ספרינט בין התחנות, שנייה אחת לשחרור, והמוסר זורק מעט הצידה כדי שתצטרכו לזוז לדיסק.", en: "A 15 m square, sprint between stations, one second to release, and the feeder throws slightly off-centre so you have to move to the disc." },
  soloAlternative: { he: "דיסק ליד כל קונוס. בכל תחנה: זורקים את הדיסק לאוויר לפחות 3 מטר מעל הראש (או לקיר במרחק 4 מטר), תופסים, Pivot וזורקים מיד לקונוס הבא – נספר אם הדיסק נעצר בתוך 2 מטר מהקונוס. רצים לתחנה הבאה, מרימים את הדיסק שמחכה שם, וממשיכים. 8 חזרות בסט.", en: "A disc beside each cone. At each station: toss the disc at least 3 m above your head (or at a wall 4 m away), catch, pivot and throw immediately to the next cone – it counts if the disc stops within 2 m of the cone. Run to the next station, pick up the disc waiting there, and continue. 8 reps per set." },
  partnerAlternative: { he: "כמו שכתוב – השותף הוא המוסר במרכז ומתחלפים בסיום כל סט. בקבוצה: שחקן על כל קונוס בלי מוסר, הדיסק עובר A→B→C→D וכל אחד תופס ומשחרר בתוך שנייה וחצי; סופרים הקפות בלי נפילה.", en: "As written – your partner is the feeder in the centre and you swap after each set. In a group: a player on each cone, no feeder; the disc travels A→B→C→D and everyone catches and releases within 1.5 seconds; count laps without a drop." },
  safetyNotes: [
    { he: "לא זורקים לשותף שלא מסתכל – במיוחד בסט 3. קוראים בשמו לפני השחרור.", en: "Never throw to a partner who isn't looking – especially in set 3. Call their name before the release." },
    { he: "בדקו את הריבוע לפני שמתחילים: בורות, ממטרות ותיקים מחוץ למסלול הריצה.", en: "Check the square before you start: holes, sprinklers and bags out of the running path." },
  ],
  diagram: {
    field: "square",
    items: [
      { type: "cone", x: 20, y: 20, label: "A" },
      { type: "cone", x: 80, y: 20, label: "B 12m" },
      { type: "cone", x: 80, y: 80, label: "C" },
      { type: "cone", x: 20, y: 80, label: "D" },
      { type: "partner", x: 50, y: 50 },
      { type: "player", x: 20, y: 28 },
      { type: "run", from: [26, 22], to: [74, 22] },
      { type: "throw", from: [46, 46], to: [24, 26], dashed: true },
    ],
  },
  throwsPerSet: 8,
  catchesPerSet: 8,
};

const gmThrowAfterSprint: Exercise = {
  id: "gm-throw-after-sprint",
  name: { he: "זריקה מיד אחרי ספרינט", en: "Throw after sprint" },
  category: "game",
  skills: ["accuracy", "speed", "endurance"],
  roles: [],
  levels: ["beginner", "intermediate", "advanced"],
  phases: ["game"],
  goal: { he: "לזרוק מדויק כשהדופק ב-170 – בדיוק כמו Cut שנגמר בתפיסה ומיד צריך להמשיך את הדיסק. ספרינט של 20 מטר, עצירה בשליטה וזריקה בתוך 3 שניות.", en: "Throw accurately with your heart rate at 170 – exactly like a cut that ends in a catch and the disc has to move on. A 20 m sprint, a controlled stop and a throw within 3 seconds." },
  participants: ["solo", "pair", "group"],
  equipment: ["cones"],
  optionalEquipment: ["discs", "stopwatch"],
  fieldSizes: OPEN_FIELDS,
  intensity: "high",
  offenseDefense: "offense",
  wind: "any",
  ageGroups: ALL_AGES,
  durationMinutes: 10,
  minDurationMinutes: 6,
  maxDurationMinutes: 14,
  sets: 4,
  reps: 5,
  restSeconds: 90,
  setup: {
    he: "קונוס זינוק, וקונוס ״נקודת זריקה״ במרחק 20 מטר ממנו עם 5 דיסקים לידו. שער של 2 מטר (שני קונוסים) במרחק 12 מטר מנקודת הזריקה, בזווית של 90 מעלות לכיוון הריצה – כך שאחרי העצירה חייבים Pivot לפני הזריקה. השאירו 5 מטר פנויים אחרי נקודת הזריקה לבלימה.",
    en: "A start cone, and a \"throwing spot\" cone 20 m away with 5 discs beside it. A 2 m gate (two cones) 12 m from the throwing spot at 90 degrees to the running direction – so after the stop you must pivot before throwing. Leave 5 m clear beyond the throwing spot for braking." },
  instructions: [
    { he: "ספרינט 20 מטר ב-90–100%. שלושת הצעדים האחרונים קצרים ונמוכים – עוצרים בשליטה ליד הקונוס, הרגליים לא חוצות אותו.", en: "Sprint 20 m at 90–100%. The last three steps short and low – stop under control at the cone, feet not crossing it." },
    { he: "מרימים דיסק, נשימה אחת, Pivot וזריקה לשער בתוך 3 שניות מהמגע בדיסק. חזרות אי-זוגיות Backhand, זוגיות Forehand.", en: "Pick up a disc, one breath, pivot and throw to the gate within 3 seconds of touching the disc. Odd reps backhand, even reps forehand." },
    { he: "הולכים חזרה לקונוס הזינוק – זו המנוחה בין חזרות (בערך 30 שניות). 5 חזרות בסט, 4 סטים, 90 שניות בין הסטים; בזמן המנוחה אוספים את הדיסקים.", en: "Walk back to the start cone – that's the rest between reps (about 30 seconds). 5 reps per set, 4 sets, 90 seconds between sets; collect the discs during the rest." },
    { he: "סופרים זריקות שעברו בשער מתוך 20. השוו למספר שלכם ב-Backhand/Forehand דרך שער כשאתם רעננים – היעד: ירידה של לא יותר מ-15 נקודות אחוז.", en: "Count throws through the gate out of 20. Compare with your fresh backhand/forehand gate number – the goal: a drop of no more than 15 percentage points." },
  ],
  cues: [
    { he: "עוצרים ואז זורקים – לא זורקים תוך כדי בלימה.", en: "Stop, then throw – never throw while still braking." },
    { he: "ה-Snap לא משתנה כשהדופק גבוה. אותו שורש כף יד, אותה זווית.", en: "The snap doesn't change when the heart rate is high. Same wrist, same angle." },
    { he: "3 שניות זה הרבה זמן – נשימה, מטרה, זריקה.", en: "3 seconds is plenty – breath, target, throw." },
  ],
  commonMistakes: [
    { he: "מאיטים בספרינט ״כדי לשמור כוח לזריקה״ – ואז לא מתאמנים על כלום.", en: "Easing off the sprint \"to save energy for the throw\" – and then you're training nothing." },
    { he: "זורקים על רגל אחת באמצע הבלימה, והדיסק יוצא מתנדנד.", en: "Throwing on one leg mid-brake, and the disc leaves wobbling." },
    { he: "מבזבזים 6 שניות על סידור האחיזה – במשחק ה-Stall כבר ב-5.", en: "Spending 6 seconds fixing the grip – in a game the stall is already at 5." },
  ],
  successMetric: { type: "ratio", key: "throw_accuracy", label: { he: "זריקות בשער בתוך 3 שניות אחרי ספרינט של 20 מטר, מתוך 20", en: "Throws through the gate within 3 seconds after a 20 m sprint, out of 20" }, target: 60, attempts: 20 },
  easierVersion: { he: "15 מטר ב-80%, שער של 3 מטר, ו-5 שניות לזריקה. ילדים: 3 סטים של 4 עם דקה מנוחה בין החזרות.", en: "15 m at 80%, a 3 m gate, and 5 seconds to throw. Kids: 3 sets of 4 with a minute's rest between reps." },
  harderVersion: { he: "25 מטר, שער של 1.5 מטר, 2 שניות לזריקה, ו-30 שניות בלבד בין החזרות – או שותף שעושה Mark בלי מגע בנקודת הזריקה.", en: "25 m, a 1.5 m gate, 2 seconds to throw, and only 30 seconds between reps – or a partner marking (no contact) at the throwing spot." },
  soloAlternative: { he: "עובד לבד כפי שהוא: 5 דיסקים בנקודת הזריקה, סופרים ״אחת-שתיים-שלוש״ בקול מרגע המגע בדיסק, ואוספים את הדיסקים בהליכה במנוחה שבין הסטים.", en: "Works solo as written: 5 discs at the throwing spot, count \"one-two-three\" out loud from the moment you touch the disc, and collect the discs at a walk in the rest between sets." },
  partnerAlternative: { he: "השותף עומד מאחורי השער, סופר ״3-2-1״ בקול מהמגע בדיסק, קורא ״בפנים/בחוץ״ ומחזיר את הדיסק לנקודת הזריקה. מתחלפים כל סט – אחד רץ, אחד סופר.", en: "Your partner stands behind the gate, counts \"3-2-1\" out loud from the moment you touch the disc, calls \"in/out\" and returns the disc to the throwing spot. Swap every set – one runs, one counts." },
  safetyNotes: [
    { he: "רק אחרי חימום שכולל האצות. 5 מטר פנויים אחרי נקודת הזריקה – בלי גדר או קיר; על דשא רטוב מקצרים את הבלימה ומורידים ל-80%.", en: "Only after a warm-up that includes accelerations. 5 m clear beyond the throwing spot – no fence or wall; on wet grass shorten the braking and drop to 80%." },
    { he: "ודאו ש-20 מטר מאחורי השער פנויים מאנשים.", en: "Make sure 20 m behind the gate is clear of people." },
  ],
  diagram: {
    field: "square",
    items: [
      { type: "player", x: 10, y: 85 },
      { type: "cone", x: 10, y: 92, label: "0" },
      { type: "cone", x: 70, y: 92, label: "20m" },
      { type: "disc", x: 76, y: 86 },
      { type: "cone", x: 62, y: 15 },
      { type: "cone", x: 78, y: 15, label: "12m" },
      { type: "run", from: [16, 85], to: [66, 85], label: "sprint" },
      { type: "throw", from: [70, 78], to: [70, 20], dashed: true },
    ],
  },
  throwsPerSet: 5,
  catchesPerSet: 0,
};

const gmErrorFreeSequence: Exercise = {
  id: "gm-error-free-sequence",
  name: { he: "רצף ללא טעות", en: "Error-free sequence" },
  category: "game",
  skills: ["accuracy", "decision_making", "catching"],
  roles: [],
  levels: ["beginner", "intermediate", "advanced"],
  phases: ["game", "challenge"],
  goal: { he: "שרשרת של פעולות משחק – זריקה, תפיסה, Pivot, זריקה – שנשארת נקייה כמה שיותר זמן. טעות אחת מאפסת, בדיוק כמו Turnover.", en: "A chain of game actions – throw, catch, pivot, throw – kept clean for as long as possible. One error resets to zero, just like a turnover." },
  participants: ["solo", "pair", "group"],
  equipment: ["cones"],
  optionalEquipment: ["discs", "wall"],
  fieldSizes: ALL_FIELDS,
  intensity: "medium",
  offenseDefense: "offense",
  wind: "any",
  ageGroups: ALL_AGES,
  durationMinutes: 8,
  minDurationMinutes: 5,
  maxDurationMinutes: 12,
  sets: 3,
  reps: 12,
  restSeconds: 45,
  setup: {
    he: "שער 1 (2 מטר) במרחק 10 מטר ישר מולכם, ושער 2 (2 מטר) במרחק 8 מטר בזווית של 45 מעלות לצד ה-Forehand. השותף עומד מאחורי שער 1 ומחזיר. 3–5 דיסקים ליד הרגל. לבד – ראו גרסת סולו.",
    en: "Gate 1 (2 m) 10 m straight ahead, and gate 2 (2 m) 8 m away at 45 degrees on your forehand side. Your partner stands behind gate 1 and returns. 3–5 discs by your foot. Solo – see the solo version." },
  instructions: [
    { he: "סבב אחד = 4 פעולות, וכל פעולה שווה 1 ברצף: (1) Backhand דרך שער 1, (2) תפיסה נקייה של ההחזרה, (3) Pivot ו-Forehand דרך שער 2, (4) תפיסה נקייה של ההחזרה. ואז שוב מההתחלה.", en: "One round = 4 actions, and each action adds 1 to the streak: (1) backhand through gate 1, (2) clean catch of the return, (3) pivot and forehand through gate 2, (4) clean catch of the return. Then again from the top." },
    { he: "מה מאפס: זריקה מחוץ לשער, נפילה או דיסק שנגע בקרקע, יותר מצעד Pivot אחד (Travel), או יותר מ-5 שניות בין התפיסה לזריקה.", en: "What resets: a throw outside the gate, a drop or a disc touching the ground, more than one pivot step (travel), or more than 5 seconds between catch and throw." },
    { he: "כל ניסיון נגמר בטעות או ב-20 פעולות. 3 ניסיונות, 45 שניות מנוחה ביניהם. סופרים בקול.", en: "Each attempt ends on an error or at 20 actions. 3 attempts, 45 seconds rest between them. Count out loud." },
    { he: "רושמים את הרצף הארוך ביותר של האימון. יעד: 12 (3 סבבים מלאים).", en: "Log the longest streak of the session. Target: 12 (3 full rounds)." },
  ],
  cues: [
    { he: "פעולה 15 באותו קצב של פעולה 1 – הרצף לא משנה את הטמפו.", en: "Action 15 at the same tempo as action 1 – the streak doesn't change the tempo." },
    { he: "מחליטים על המטרה הבאה לפני שהדיסק מגיע לידיים.", en: "Decide the next target before the disc reaches your hands." },
    { he: "אחרי כל תפיסה – רגליים מסודרות מחדש ואז Pivot.", en: "After every catch – reset the feet, then pivot." },
  ],
  commonMistakes: [
    { he: "מאיצים כשהמספר עולה, ובפעולה 11 הדיסק כבר מתנדנד.", en: "Speeding up as the number climbs, and by action 11 the disc is wobbling." },
    { he: "תפיסה עצלה ביד אחת בפעולה 4 – הנפילה מגיעה תמיד בתפיסה ״הקלה״.", en: "A lazy one-hand catch on action 4 – the drop always comes on the \"easy\" catch." },
    { he: "חוגגים ב-10 ומפילים את 11.", en: "Celebrating at 10 and dropping 11." },
  ],
  successMetric: { type: "streak", key: "error_free_streak", label: { he: "הרצף הארוך ביותר של פעולות נקיות (זריקה בשער / תפיסה) – טעות אחת מאפסת", en: "Longest streak of clean actions (throw through the gate / catch) – one error resets to zero" }, target: 12 },
  easierVersion: { he: "שערים של 3 מטר, בלי מגבלת זמן, ויעד רצף 8. ילדים: שער 1 בלבד – Backhand, תפיסה, Forehand, תפיסה, כולם דרך אותו שער במרחק 7 מטר.", en: "3 m gates, no time cap, and a streak target of 8. Kids: gate 1 only – backhand, catch, forehand, catch, all through the same gate at 7 m." },
  harderVersion: { he: "שערים של 1.5 מטר, 3 שניות בין תפיסה לזריקה, שותף שעושה Mark בלי מגע, ויעד רצף 20.", en: "1.5 m gates, 3 seconds between catch and throw, a partner marking without contact, and a streak target of 20." },
  soloAlternative: { he: "בלי שותף: פעולה 1 – Backhand דרך שער 1 לקונוס מטרה (נספר אם הדיסק נעצר בתוך 2 מטר מהקונוס). פעולה 2 – הולכים לדיסק, זורקים אותו לאוויר לפחות 3 מטר מעל הראש ותופסים. פעולה 3 – Pivot ו-Forehand דרך שער 2 לקונוס שלו. פעולה 4 – שוב זריקה עצמית ותפיסה. עם קיר: זורקים מ-5 מטר דרך שער שמסומן מטר לפני הקיר ותופסים את החזרה.", en: "Without a partner: action 1 – backhand through gate 1 to a target cone (counts if the disc stops within 2 m of the cone). Action 2 – walk to the disc, toss it at least 3 m above your head and catch. Action 3 – pivot and forehand through gate 2 to its cone. Action 4 – another self-toss and catch. With a wall: throw from 5 m through a gate marked 1 m in front of the wall and catch the rebound." },
  partnerAlternative: { he: "כמו שכתוב: השותף מאחורי שער 1 מחזיר לחזה וסופר בקול. מתחלפים בסוף כל ניסיון – גם ההחזרות שלו צריכות להיות נקיות, אחרת הרצף שלו מתאפס.", en: "As written: your partner behind gate 1 returns to your chest and counts out loud. Swap at the end of each attempt – their returns have to be clean too, otherwise their streak resets." },
  safetyNotes: [
    { he: "20 מטר פנויים מאחורי שני השערים. קיר – בלי חלונות ולפחות 4 מטר מרחק.", en: "20 m clear behind both gates. A wall – no windows and at least 4 m away." },
  ],
  diagram: {
    field: "square",
    items: [
      { type: "player", x: 50, y: 85 },
      { type: "cone", x: 44, y: 20 },
      { type: "cone", x: 56, y: 20, label: "1 · 10m" },
      { type: "cone", x: 86, y: 40 },
      { type: "cone", x: 86, y: 54, label: "2 · 8m" },
      { type: "partner", x: 50, y: 8 },
      { type: "throw", from: [50, 80], to: [50, 24], dashed: true, label: "BH" },
      { type: "throw", from: [54, 82], to: [84, 48], dashed: true, label: "FH" },
    ],
  },
  throwsPerSet: 10,
  catchesPerSet: 10,
};

const gmFatigueAccuracy: Exercise = {
  id: "gm-fatigue-accuracy",
  name: { he: "דיוק תחת עייפות", en: "Accuracy under fatigue" },
  category: "game",
  skills: ["accuracy", "endurance"],
  roles: [],
  levels: ["intermediate", "advanced"],
  phases: ["game"],
  goal: { he: "לשמור על מכניקת זריקה כשהרגליים והריאות גמורות – כמו בנקודה האחרונה של משחק. מודדים כמה הדיוק יורד מרענן לעייף, ומצמצמים את הפער.", en: "Keep your throwing mechanics when the legs and lungs are gone – like the last point of a game. Measure how much accuracy drops from fresh to fatigued, and shrink the gap." },
  participants: ["solo", "pair", "group"],
  equipment: ["cones"],
  optionalEquipment: ["discs", "stopwatch"],
  fieldSizes: OPEN_FIELDS,
  intensity: "high",
  offenseDefense: "offense",
  wind: "any",
  ageGroups: ALL_AGES,
  durationMinutes: 10,
  minDurationMinutes: 7,
  maxDurationMinutes: 14,
  sets: 4,
  reps: 5,
  restSeconds: 30,
  workSeconds: 40,
  setup: {
    he: "שער של 2 מטר במרחק 10 מטר מנקודת הזריקה. לצד נקודת הזריקה – שני קונוסים במרחק 10 מטר זה מזה למסלול Shuttle, במקביל לשער ולא לכיוונו. 5 דיסקים בנקודת הזריקה. שעון בטלפון.",
    en: "A 2 m gate 10 m from the throwing spot. Beside the throwing spot – two cones 10 m apart for a shuttle lane, parallel to the gate and not toward it. 5 discs at the throwing spot. A phone timer." },
  instructions: [
    { he: "בסיס: רעננים, 10 זריקות לשער – 5 Backhand ו-5 Forehand. רושמים כמה נכנסו. זה המספר שמשווים אליו.", en: "Baseline: fresh, 10 throws to the gate – 5 backhands and 5 forehands. Write down how many went in. That's the number you compare against." },
    { he: "סבב: 40 שניות ריצות Shuttle בין שני הקונוסים ב-85–90% (נוגעים בקונוס ביד בכל פנייה), ומיד – בלי לעצור לנשום – 5 זריקות לשער, לכל היותר 4 שניות לזריקה. מתחלפים Backhand/Forehand.", en: "Round: 40 seconds of shuttle runs between the two cones at 85–90% (touch the cone with a hand at every turn), then immediately – without stopping to breathe – 5 throws to the gate, at most 4 seconds per throw. Alternate backhand/forehand." },
    { he: "30 שניות מנוחה (הולכים לאסוף את הדיסקים), ושוב. 4 סבבים = 20 זריקות עייפות.", en: "30 seconds rest (walk to collect the discs), and again. 4 rounds = 20 fatigued throws." },
    { he: "רושמים זריקות בשער מתוך 20. היעד: ירידה של לא יותר מ-20 נקודות אחוז מהבסיס (למשל 80% רענן → לפחות 60% עייף).", en: "Log throws through the gate out of 20. The goal: a drop of no more than 20 percentage points from the baseline (e.g. 80% fresh → at least 60% fatigued)." },
  ],
  cues: [
    { he: "נשימה אחת לפני כל זריקה – הדופק גבוה, המכניקה זהה.", en: "One breath before every throw – high heart rate, identical mechanics." },
    { he: "רגליים פעילות: Pivot רחב ויציב גם כשהן רועדות.", en: "Active legs: a wide, stable pivot even when they're shaking." },
    { he: "המרפק ושורש כף היד עושים את העבודה – לא הכתף העייפה.", en: "The elbow and wrist do the work – not the tired shoulder." },
  ],
  commonMistakes: [
    { he: "זורקים מיד אחרי ה-Shuttle בלי לסדר את הרגליים – הדיסק יוצא גבוה.", en: "Throwing straight off the shuttle without setting the feet – the disc leaves high." },
    { he: "זווית הדיסק עולה עם העייפות והזריקה מתנדנדת.", en: "The disc angle rises with fatigue and the throw wobbles." },
    { he: "״מרמים״ ב-Shuttle כדי לשמור על הדיוק – ואז לא מדדתם עייפות.", en: "Cheating the shuttles to protect the accuracy – then you measured no fatigue at all." },
  ],
  successMetric: { type: "ratio", key: "throw_accuracy", label: { he: "זריקות בשער מיד אחרי 40 שניות Shuttle, מתוך 20 (השוו ל-10 הזריקות הרעננות)", en: "Throws through the gate straight after 40 seconds of shuttles, out of 20 (compare with the 10 fresh throws)" }, target: 60, attempts: 20 },
  easierVersion: { he: "25 שניות Shuttle ב-75%, 3 סבבים, שער של 3 מטר, ודקה מנוחה. ילדים ונוער: 20 שניות ריצה בלבד.", en: "25 seconds of shuttles at 75%, 3 rounds, a 3 m gate, and a minute's rest. Kids and teens: 20 seconds of running only." },
  harderVersion: { he: "60 שניות Shuttle, 6 סבבים, 15 שניות מנוחה, שער של 1.5 מטר ו-3 שניות לזריקה.", en: "60 seconds of shuttles, 6 rounds, 15 seconds rest, a 1.5 m gate and 3 seconds per throw." },
  soloAlternative: { he: "עובד לבד כפי שהוא: טיימר בטלפון ל-40 שניות עם צפצוף, 5 דיסקים בנקודת הזריקה, וסופרים בקול את הזריקות שנכנסו.", en: "Works solo as written: a 40-second phone timer with a beep, 5 discs at the throwing spot, and count the throws that went in out loud." },
  partnerAlternative: { he: "השותף מאחורי השער סופר את הפגיעות ומחזיר את הדיסקים; מתחלפים כל סבב – אחד רץ וזורק, אחד סופר ונח. בקבוצה: שניים רצים בו-זמנית במסלולי Shuttle נפרדים ומתחלקים בשער.", en: "Your partner behind the gate counts the hits and returns the discs; swap every round – one runs and throws, one counts and rests. In a group: two run at the same time in separate shuttle lanes and share the gate." },
  safetyNotes: [
    { he: "מסלול ה-Shuttle ומסלול הזריקה נפרדים – אף אחד לא רץ דרך קו הזריקה. סחרחורת, בחילה או כאב חד = עוצרים.", en: "The shuttle lane and the throwing lane are separate – nobody runs through the throwing line. Dizziness, nausea or sharp pain = stop." },
    { he: "מתחת לגיל 16 או בחזרה מפציעה – הגרסה הקלה בלבד. עומס מרבי הוא לא חובה.", en: "Under 16 or coming back from injury – the easier version only. Maximal load is never mandatory." },
  ],
  diagram: {
    field: "square",
    items: [
      { type: "player", x: 30, y: 80 },
      { type: "cone", x: 12, y: 80, label: "shuttle" },
      { type: "cone", x: 12, y: 20, label: "10m" },
      { type: "run", from: [12, 76], to: [12, 24], label: "40s" },
      { type: "disc", x: 34, y: 88 },
      { type: "cone", x: 85, y: 72 },
      { type: "cone", x: 85, y: 88, label: "10m" },
      { type: "throw", from: [36, 80], to: [83, 80], dashed: true },
    ],
  },
  throwsPerSet: 5,
  catchesPerSet: 0,
};
