/**
 * Exercise catalog – Part C1: movement drills (mv-*): sprints, change of direction, agility, footwork, endurance.
 * Every entry here matches its row in src/content/manifest.ts (id, name, category, skills, roles,
 * participants, equipment, levels, intensity are copied verbatim from the manifest).
 *
 * Timing conventions shared by every timed drill in this file, so personal bests stay comparable:
 *  - sprint_time_s        = 20 m from a staggered standing start, hand-timed from the first movement
 *                           until the chest crosses the cone line (mv-short-sprints, mv-acceleration-starts).
 *  - cod_time_s           = a 20 m course with two direction changes: 5-10-5 lateral (mv-cone-cod) or
 *                           10-5-5 stop-and-go – sprint, dead stop, go, 180° turn (mv-stop-and-go).
 *  - t_drill_time_s       = the 10 m × 10 m T (40 m total).
 *  - lateral_shuffle_time_s = 4 shuffle lengths of 5 m (20 m), hand touch at each end.
 *  - agility_time_s       = a timed course: 5-10-15 forward/backpedal, 60 m (mv-forward-backpedal) or
 *                           3 ladder passes + a 5 m sprint (mv-ladder-agility) – each label names its course.
 *  - repeat_sprint_drop_pct = (slowest − fastest) ÷ fastest × 100 over 6 × 30 m; lower is better, so it is
 *                           stored as a "score" whose value IS the drop percent (engine: personalBests/readiness).
 *  Self-timing with a phone in hand adds roughly 0.2 s; every drill tells the player to compare like with like.
 */
import type { Exercise } from "@/lib/types";

const ALL_FIELDS: Exercise["fieldSizes"] = ["small", "medium", "large", "indoor", "park", "beach", "yard"];
/** Needs a straight 30–40 m lane (20 m + slow-down) – a back yard is too short. */
const LANE_FIELDS: Exercise["fieldSizes"] = ["small", "medium", "large", "indoor", "park", "beach"];
/** Needs a straight 40 m+ lane – no indoor hall or yard. */
const LONG_LANE_FIELDS: Exercise["fieldSizes"] = ["small", "medium", "large", "park", "beach"];
const ALL_AGES: Exercise["ageGroups"] = ["kid", "teen", "adult", "senior"];

/* ------------------------------------------------------------------ */
/* Speed                                                                */
/* ------------------------------------------------------------------ */

const mvShortSprints: Exercise = {
  id: "mv-short-sprints",
  name: { he: "ספרינטים קצרים", en: "Short sprints" },
  category: "movement",
  skills: ["speed", "acceleration"],
  roles: ["runner", "wing", "cutter", "defender", "hybrid", "allround"],
  levels: ["beginner", "intermediate", "advanced"],
  phases: ["movement", "challenge"],
  goal: { he: "לפתח מהירות מרבית על 20 מטר – המרחק שבו מוכרעים רוב ה-Cuts והריצות לדיסק – ולקבל מספר אמין למעקב משבוע לשבוע.", en: "Build top speed over 20 m – the distance most cuts and runs to the disc are decided in – and get a reliable number to track week to week." },
  participants: ["solo", "pair", "group"],
  equipment: ["cones"],
  optionalEquipment: ["stopwatch"],
  fieldSizes: LANE_FIELDS,
  intensity: "high",
  offenseDefense: "both",
  wind: "any",
  ageGroups: ALL_AGES,
  durationMinutes: 6,
  minDurationMinutes: 4,
  maxDurationMinutes: 8,
  sets: 2,
  reps: 5,
  restSeconds: 45,
  setup: {
    he: "סמנו קו זינוק בקונוס וקונוס נוסף במרחק 20 מטר בדיוק (מדדו – 20 צעדים גדולים או אפליקציית מדידה בטלפון; מרחק לא מדויק הורס את המעקב). השאירו לפחות 10 מטר פנויים אחרי קו הסיום להאטה וסמנו אותם בקונוס שלישי. מי שמודד עומד בקו ה-20 מטר.",
    en: "Set a start cone and a second cone exactly 20 m away (measure it – 20 big steps or a phone measuring app; an imprecise distance ruins the tracking). Leave at least 10 m free past the finish for slowing down and mark it with a third cone. Whoever is timing stands at the 20 m line.",
  },
  instructions: [
    { he: "עמידת זינוק מדורגת: רגל אחת על הקו, השנייה חצי צעד מאחור, המשקל על הרגל הקדמית, הידיים מוכנות.", en: "Staggered start: one foot on the line, the other half a step back, weight on the front foot, arms ready." },
    { he: "ספרינט 20 מטר ב-100%. השעון מתחיל בתנועה הראשונה של הגוף ונעצר כשהחזה חוצה את קו הקונוס – לא כשמתחילים להאט.", en: "Sprint 20 m at 100%. The clock starts on the body's first movement and stops when the chest crosses the cone line – not when you start slowing." },
    { he: "מאיטים בהדרגה לאורך 10 המטרים הפנויים והולכים חזרה לקו – ההליכה היא המנוחה (45 שניות לפחות).", en: "Ease down over the free 10 m and walk back to the line – the walk is the rest (at least 45 seconds)." },
    { he: "5 ספרינטים בסט, 2 סטים, 90 שניות בין הסטים. רושמים את הזמן הטוב ביותר מתוך 10 – זה המספר שמשווים משבוע לשבוע.", en: "5 sprints per set, 2 sets, 90 seconds between sets. Log the best time out of 10 – that's the number you compare week to week." },
    { he: "תזמון עצמי (לבד): לוחצים Start באותה תנועה של היציאה ו-Stop במעבר הקונוס. זה מוסיף בערך 0.2 שניות – משווים רק לזמנים שנמדדו באותה שיטה.", en: "Self-timing (solo): press start with the same movement as your first step and stop as you pass the cone. It adds roughly 0.2 s – only compare with times measured the same way." },
  ],
  cues: [
    { he: "5 הצעדים הראשונים קצרים וחזקים, הגוף נוטה קדימה ב-45°.", en: "First 5 steps short and powerful, body leaning forward at 45°." },
    { he: "הידיים עובדות מהמותן עד הסנטר, מרפקים ב-90°.", en: "Arms drive from hip to chin, elbows at 90°." },
    { he: "רצים דרך הקו, לא אל הקו.", en: "Run through the line, not to the line." },
  ],
  commonMistakes: [
    { he: "מזדקפים אחרי שני צעדים ומאבדים את ההאצה.", en: "Standing up after two steps and losing the acceleration." },
    { he: "מאיטים מטר לפני הקונוס כי ״כבר הגענו״ – זה עולה 0.2 שניות בכל ריצה.", en: "Slowing a metre before the cone because \"we're there\" – that costs 0.2 s every run." },
    { he: "מנוחה קצרה מדי, והספרינט הרביעי כבר לא באמת ספרינט.", en: "Resting too little, so the fourth sprint is no longer a real sprint." },
  ],
  successMetric: { type: "time_s", key: "sprint_time_s", label: { he: "הזמן הטוב ביותר ל-20 מטר (שניות), מהתנועה הראשונה עד חציית הקונוס", en: "Best 20 m time (seconds), from first movement to crossing the cone" }, target: 3.6 },
  easierVersion: { he: "3 ספרינטים בסט על 15 מטר ב-85% מהמהירות, עם דקה מנוחה.", en: "3 sprints per set over 15 m at 85% speed, with a minute's rest." },
  harderVersion: { he: "8 ספרינטים בסט עם 30 שניות מנוחה בלבד, או יציאה מתוך Shuffle צדי של 3 מטר לפני קו הזינוק.", en: "8 sprints per set with only 30 seconds rest, or start out of a 3 m side shuffle before the start line." },
  soloAlternative: { he: "עובד לבד כפי שהוא: שעון עצר בטלפון ביד – Start ביציאה, Stop בקונוס. אפשרות מדויקת יותר: מניחים את הטלפון על הקונוס ב-20 מטר, מצלמים וידאו וקוראים את הזמן מהצילום.", en: "Works solo as written: phone stopwatch in hand – start on the first step, stop at the cone. More accurate option: prop the phone at the 20 m cone, film the run and read the time off the video." },
  partnerAlternative: { he: "השותף עומד בקו ה-20 מטר עם השעון, מוריד יד כסימן ליציאה ועוצר את השעון במעבר החזה. מתחלפים כל 5 ספרינטים – המנוחה של האחד היא הריצה של השני.", en: "Your partner stands at the 20 m line with the watch, drops a hand as the go signal and stops the clock as your chest passes. Swap every 5 sprints – one rests while the other runs." },
  safetyNotes: [
    { he: "רק אחרי חימום מלא שכולל האצות הדרגתיות. ספרינט על שרירים קרים הוא הדרך הבטוחה לפציעת Hamstring.", en: "Only after a full warm-up that includes progressive accelerations. Sprinting on cold muscles is the surest way to a hamstring injury." },
    { he: "10 מטר פנויים אחרי הקו – בלי גדר, קיר או מדרכה. כאב חד מאחורי הירך – עוצרים מיד ומדווחים.", en: "10 m clear past the line – no fence, wall or kerb. Sharp pain at the back of the thigh – stop immediately and note it." },
  ],
  diagram: {
    field: "lane",
    items: [
      { type: "player", x: 8, y: 50 },
      { type: "cone", x: 10, y: 40, label: "0" },
      { type: "cone", x: 62, y: 40, label: "20m" },
      { type: "cone", x: 90, y: 40, label: "30m" },
      { type: "partner", x: 62, y: 66, label: "timer" },
      { type: "run", from: [12, 50], to: [60, 50], label: "sprint" },
      { type: "run", from: [64, 50], to: [88, 50], dashed: true, label: "slow down" },
    ],
  },
  throwsPerSet: 0,
  catchesPerSet: 0,
};

const mvRepeatSprints: Exercise = {
  id: "mv-repeat-sprints",
  name: { he: "ספרינטים חוזרים", en: "Repeat sprints" },
  category: "movement",
  skills: ["speed", "endurance", "acceleration"],
  roles: ["runner", "wing", "cutter", "hybrid"],
  levels: ["intermediate", "advanced"],
  phases: ["movement"],
  goal: { he: "לשמור על המהירות גם בספרינט השישי – סיבולת מהירות, היכולת שמפרידה בין מי ש״נגמר״ אחרי שני Cuts למי שעדיין פתוח בסוף נקודה ארוכה.", en: "Hold your speed on the sixth sprint as well as the first – speed endurance, the quality that separates a player who is spent after two cuts from one who is still open late in a long point." },
  participants: ["solo", "pair", "group"],
  equipment: ["cones", "stopwatch"],
  optionalEquipment: [],
  fieldSizes: LONG_LANE_FIELDS,
  intensity: "high",
  offenseDefense: "both",
  wind: "any",
  ageGroups: ["teen", "adult", "senior"],
  durationMinutes: 8,
  minDurationMinutes: 6,
  maxDurationMinutes: 10,
  sets: 2,
  reps: 6,
  restSeconds: 35,
  setup: {
    he: "קונוס בקו הזינוק, קונוס ב-30 מטר וקונוס שלישי ב-40 מטר לסימון ההאטה. שעון עצר או טיימר בטלפון שרואים ממנו את השניות. עובדים ״על השעון״: ספרינט יוצא כל 40 שניות בדיוק – ב-0:00, 0:40, 1:20 וכן הלאה.",
    en: "One cone on the start line, one at 30 m and a third at 40 m to mark the slow-down. A stopwatch or a phone timer whose seconds you can read. Work \"on the clock\": a sprint leaves every 40 seconds exactly – at 0:00, 0:40, 1:20 and so on.",
  },
  instructions: [
    { he: "יציאה מעמידה מדורגת. ספרינט 30 מטר ב-100% – בכל אחת מ-6 הריצות מנסים לרוץ באותה מהירות.", en: "Staggered start. Sprint 30 m at 100% – on each of the 6 runs try to hit the same speed." },
    { he: "תזמון: השעון מתחיל בתנועה הראשונה ונעצר כשהחזה חוצה את קונוס ה-30. השותף מקריא את הזמן ואתם רושמים; לבד – Start ביד ו-Stop במעבר הקונוס.", en: "Timing: the clock starts on the first movement and stops as the chest crosses the 30 m cone. Your partner reads out the time and you log it; solo – start in hand, stop as you pass the cone." },
    { he: "מאיטים ב-10 המטרים שאחרי הקונוס והולכים ישר חזרה לקו – מגיעים 5 שניות לפני היציאה הבאה. 6 ספרינטים = סט אחד.", en: "Ease down in the 10 m past the cone and walk straight back to the line – arrive 5 seconds before the next start. 6 sprints = one set." },
    { he: "3 דקות מנוחה ואז הסט השני. בסיום מחשבים לכל סט את הדעיכה: (הזמן האיטי ביותר פחות המהיר ביותר) חלקי המהיר ביותר, כפול 100.", en: "Rest 3 minutes, then the second set. At the end, work out each set's drop-off: (slowest time minus fastest) divided by the fastest, times 100." },
    { he: "דוגמה: המהיר ביותר 4.6 שניות, האיטי ביותר 5.0 – הדעיכה היא 0.4 ÷ 4.6 × 100 = 9%. מתחת ל-10% זה מצוין; מעל 20% – המנוחה קצרה מדי בשבילכם כרגע. רושמים את הדעיכה של הסט הטוב יותר.", en: "Example: fastest 4.6 s, slowest 5.0 – the drop is 0.4 ÷ 4.6 × 100 = 9%. Under 10% is excellent; over 20% means the rest is too short for you right now. Log the drop of your better set." },
  ],
  cues: [
    { he: "אותה טכניקה בכל ריצה – זווית גוף, ידיים, אורך צעד. כשהעייפות מגיעה, הטכניקה היא מה שמחזיק את המהירות.", en: "Same technique on every run – body angle, arms, stride. When fatigue arrives, technique is what holds the speed." },
    { he: "בהליכה חזרה: שתי נשימות עמוקות ומכוונות, בלי להתכופף עם הידיים על הברכיים.", en: "On the walk back: two deep, deliberate breaths – don't fold over with hands on knees." },
    { he: "לצאת בזמן. יציאה מאוחרת בשלוש שניות זה שלוש שניות מנוחה בגניבה.", en: "Leave on time. A start three seconds late is three seconds of stolen rest." },
  ],
  commonMistakes: [
    { he: "הראשון ב-100% והשני ב-90% ״כדי לשמור כוחות״ – כל ספרינט חייב לצאת מלא.", en: "First sprint at 100%, second at 90% \"to save energy\" – every sprint has to be a full effort." },
    { he: "ריצה קלה חזרה במקום הליכה – הדופק לא יורד וכל הסדרה מתמוטטת.", en: "Jogging back instead of walking – the heart rate never drops and the whole series collapses." },
    { he: "מדידה לא עקבית (פעם מהיציאה, פעם מהקריאה) – המספרים לא ניתנים להשוואה.", en: "Inconsistent timing (from the first move one run, from the call the next) – the numbers can't be compared." },
  ],
  successMetric: { type: "score", key: "repeat_sprint_drop_pct", label: { he: "דעיכה בספרינטים חוזרים (%): (הזמן האיטי ביותר − המהיר ביותר) ÷ המהיר ביותר × 100, מתוך 6 ספרינטים של 30 מטר – נמוך יותר = טוב יותר", en: "Repeat-sprint drop-off (%): (slowest − fastest) ÷ fastest × 100 over 6 × 30 m sprints – lower is better" }, target: 10 },
  easierVersion: { he: "4 ספרינטים על 20 מטר, יציאה כל 45 שניות, סט אחד.", en: "4 sprints over 20 m, leaving every 45 seconds, one set." },
  harderVersion: { he: "8 ספרינטים על 30 מטר, יציאה כל 30 שניות; או יעד דעיכה של 5% במקום 10%.", en: "8 sprints over 30 m leaving every 30 seconds; or a 5% drop-off target instead of 10%." },
  soloAlternative: { he: "עובד לבד: מפעילים טיימר אינטרוולים בטלפון שמצפצף כל 40 שניות, ומודדים כל ריצה עם שעון עצר ביד. תזמון עצמי מוסיף כ-0.2 שניות באופן שווה לכל הריצות, אז חישוב הדעיכה נשאר תקף.", en: "Works solo: set a phone interval timer that beeps every 40 seconds and time each run with a stopwatch in hand. Self-timing adds about 0.2 s equally to every run, so the drop-off calculation still holds." },
  partnerAlternative: { he: "השותף עומד בקונוס ה-30 עם השעון, קורא ״צא!״ לפי הטיימר, עוצר את השעון במעבר החזה ורושם. אחרי 6 ריצות מתחלפים – ההחלפה היא בדיוק 3 הדקות של המנוחה בין הסטים.", en: "Your partner stands at the 30 m cone with the watch, calls \"go!\" off the timer, stops the clock as your chest passes and writes it down. Swap after 6 runs – the swap is exactly the 3-minute rest between sets." },
  safetyNotes: [
    { he: "תרגיל עומס גבוה – לא ביום שבו הרגליים כבדות מאימון קודם, ולא בחום כבד בלי מים ליד הקו.", en: "A high-load drill – not on a day the legs are heavy from a previous session, and not in heavy heat without water at the line." },
    { he: "ירידה של יותר מ-20% בין ריצה לריצה, סחרחורת או צריבה בירך האחורית – מסיימים את הסט שם.", en: "A drop of more than 20% from one run to the next, dizziness or a burn in the hamstring – end the set there." },
  ],
  diagram: {
    field: "lane",
    items: [
      { type: "player", x: 6, y: 50 },
      { type: "cone", x: 8, y: 40, label: "0" },
      { type: "cone", x: 68, y: 40, label: "30m" },
      { type: "cone", x: 90, y: 40, label: "40m" },
      { type: "partner", x: 68, y: 66, label: "timer" },
      { type: "run", from: [10, 50], to: [66, 50], label: "sprint ×6" },
      { type: "run", from: [70, 50], to: [88, 50], dashed: true, label: "slow down" },
    ],
  },
  throwsPerSet: 0,
  catchesPerSet: 0,
};

/* ------------------------------------------------------------------ */
/* Change of direction & agility                                        */
/* ------------------------------------------------------------------ */

const mvConeCod: Exercise = {
  id: "mv-cone-cod",
  name: { he: "שינויי כיוון בין קונוסים (5-10-5)", en: "Cone change-of-direction (5-10-5)" },
  category: "movement",
  skills: ["change_of_direction", "agility", "footwork"],
  roles: [],
  levels: ["beginner", "intermediate", "advanced"],
  phases: ["movement", "challenge"],
  goal: { he: "לחתוך כיוון במהירות בלי לאבד שיווי משקל – מבחן ה-Pro Agility הסטנדרטי, שמסכם האצה, בלימה ויציאה מחדש במספר אחד.", en: "Change direction fast without losing balance – the standard Pro Agility test that boils acceleration, braking and re-acceleration down to one number." },
  participants: ["solo", "pair", "group"],
  equipment: ["cones"],
  optionalEquipment: ["stopwatch", "discs"],
  fieldSizes: ALL_FIELDS,
  intensity: "high",
  offenseDefense: "both",
  wind: "any",
  ageGroups: ALL_AGES,
  durationMinutes: 6,
  minDurationMinutes: 4,
  maxDurationMinutes: 8,
  sets: 2,
  reps: 3,
  restSeconds: 60,
  setup: {
    he: "שלושה קונוסים בקו ישר במרווח של 5 מטר: שמאלי, אמצעי, ימני (10 מטר מקצה לקצה). סמנו קו קצר ליד כל קונוס (דיסק, גיר או קונוס שני) – בקו הזה נוגעים ביד. מי שמודד עומד מול הקונוס האמצעי, 3 מטר ממנו.",
    en: "Three cones in a straight line 5 m apart: left, middle, right (10 m end to end). Mark a short line at each cone (a disc, chalk or a second cone) – that's the line you touch with your hand. The timer stands 3 m in front of the middle cone.",
  },
  instructions: [
    { he: "עמידה: רגליים משני צדי הקונוס האמצעי, פנים למודד, יד אחת נוגעת בקרקע (עמידת 3 נקודות). שקט לשנייה, ואז יוצאים – השעון מתחיל בתנועה הראשונה.", en: "Stance: feet either side of the middle cone, facing the timer, one hand on the ground (3-point stance). Hold still for a second, then go – the clock starts on the first movement." },
    { he: "ספרינט 5 מטר לקונוס הימני, נוגעים בקו ביד ימין, מסתובבים ורצים 10 מטר לקונוס השמאלי, נוגעים בקו ביד שמאל.", en: "Sprint 5 m to the right cone, touch the line with your right hand, turn and run 10 m to the left cone, touch the line with your left hand." },
    { he: "מסתובבים ויוצאים 5 מטר דרך הקונוס האמצעי. השעון נעצר כשהחזה חוצה את קו הקונוס האמצעי. סך הכול 20 מטר.", en: "Turn and drive 5 m through the middle cone. The clock stops as the chest crosses the middle cone line. 20 m in total." },
    { he: "3 ריצות בסט, מחליפים את כיוון היציאה בכל ריצה (ימין, שמאל, ימין). דקה מנוחה בין ריצות, 2 דקות בין הסטים. רושמים את הזמן הטוב ביותר.", en: "3 runs per set, alternating the first direction each run (right, left, right). One minute between runs, 2 minutes between sets. Log the best time." },
    { he: "יד שהחמיצה את הקו = הריצה לא נספרת; חוזרים עליה אחרי המנוחה.", en: "A hand that misses the line = the run doesn't count; repeat it after the rest." },
  ],
  cues: [
    { he: "לפני הקונוס: 3 צעדים קצרים, יורדים נמוך, הרגל החיצונית נטועה מעבר לקו.", en: "Before the cone: 3 short chopping steps, get low, outside foot planted past the line." },
    { he: "הכתפיים לא עוברות את הברך החיצונית – מי שנוטה יותר מדי מחליק.", en: "Shoulders never go past the outside knee – lean too far and you slip." },
    { he: "הצעד הראשון אחרי הסיבוב קצר ונמוך, כמו יציאה מחדש מהמקום.", en: "The first step after the turn is short and low, like a fresh start." },
  ],
  commonMistakes: [
    { he: "בלימה על רגל אחת ישרה – הברך סופגת במקום הירכיים, ובפועל זו עצירה מלאה.", en: "Braking on a straight single leg – the knee absorbs instead of the hips, and it becomes a full stop." },
    { he: "מתכופפים לקו עם הגב במקום לרדת בירכיים – חצי שנייה הולכת לאיבוד בכל נגיעה.", en: "Bending to the line with the back instead of dropping the hips – half a second lost at every touch." },
    { he: "יוצאים מהעמידה עם ניתור קטן במקום צעד – ״צעד שקר״ שעולה זמן.", en: "Starting with a little hop instead of a step – a false step that costs time." },
  ],
  successMetric: { type: "time_s", key: "cod_time_s", label: { he: "הזמן הטוב ביותר ב-5-10-5 (שניות), מהתנועה הראשונה עד חציית הקונוס האמצעי", en: "Best 5-10-5 time (seconds), from first movement to crossing the middle cone" }, target: 5.5 },
  easierVersion: { he: "קונוסים במרווח של 3 מטר, נגיעה ברגל במקום ביד, ו-2 ריצות בסט.", en: "Cones 3 m apart, touch with the foot instead of the hand, 2 runs per set." },
  harderVersion: { he: "יציאה על קריאה של השותף בלי לדעת לאיזה כיוון (״ימין!״ / ״שמאל!״), או 4 ריצות עם 40 שניות מנוחה.", en: "Start on a partner's call without knowing the direction (\"right!\" / \"left!\"), or 4 runs with 40 seconds rest." },
  soloAlternative: { he: "עובד לבד כפי שהוא: שעון עצר ביד שלא נוגעת בקרקע, Start ביציאה ו-Stop במעבר הקונוס האמצעי. השתמשו בקונוסים נמוכים או בדיסקים כדי לא לעוף עליהם.", en: "Works solo as written: stopwatch in the hand that isn't on the ground, start on the first move, stop as you cross the middle cone. Use low cones or discs so you don't trip over them." },
  partnerAlternative: { he: "השותף מודד ובודק את הנגיעות, ואחר כך מתחלפים. גרסת תחרות: יוצאים יחד משני קונוסים אמצעיים במרחק 5 מטר זה מזה – מי חוצה ראשון.", en: "Your partner times and checks the touches, then you swap. Race version: start together from two middle cones 5 m apart – first across wins." },
  safetyNotes: [
    { he: "משטח יבש ואחיד – על דשא רטוב או חול טובעני מוותרים על הנגיעה ביד ועובדים ב-80%.", en: "A dry, even surface – on wet grass or soft sand drop the hand touch and work at 80%." },
    { he: "לפחות 3 מטר מכל קונוס קצה לגדר, עץ או שער.", en: "At least 3 m from each end cone to any fence, tree or goal." },
  ],
  diagram: {
    field: "lane",
    items: [
      { type: "cone", x: 15, y: 50, label: "0" },
      { type: "cone", x: 50, y: 50, label: "5m" },
      { type: "cone", x: 85, y: 50, label: "10m" },
      { type: "player", x: 50, y: 68, label: "start" },
      { type: "partner", x: 50, y: 22, label: "timer" },
      { type: "run", from: [54, 64], to: [84, 58], label: "5m" },
      { type: "run", from: [84, 42], to: [16, 42], label: "10m" },
      { type: "run", from: [18, 60], to: [50, 64], label: "5m" },
    ],
  },
  throwsPerSet: 0,
  catchesPerSet: 0,
};

const mvTDrill: Exercise = {
  id: "mv-t-drill",
  name: { he: "T-Drill", en: "T-drill" },
  category: "movement",
  skills: ["agility", "change_of_direction", "footwork"],
  roles: ["defender", "cutter", "runner", "hybrid", "allround"],
  levels: ["beginner", "intermediate", "advanced"],
  phases: ["movement"],
  goal: { he: "לחבר ספרינט, Shuffle צדי ו-Backpedal לתנועה אחת רציפה – בדיוק מה שמגן עושה כשהוא נצמד ל-Cutter שמשנה כיוון.", en: "Link a sprint, side shuffles and a backpedal into one continuous movement – exactly what a defender does while staying with a cutter who keeps changing direction." },
  participants: ["solo", "pair", "group"],
  equipment: ["cones"],
  optionalEquipment: ["stopwatch"],
  fieldSizes: LANE_FIELDS,
  intensity: "high",
  offenseDefense: "both",
  wind: "any",
  ageGroups: ALL_AGES,
  durationMinutes: 7,
  minDurationMinutes: 5,
  maxDurationMinutes: 10,
  sets: 2,
  reps: 3,
  restSeconds: 75,
  setup: {
    he: "קונוס A בקו ההתחלה. קונוס B 10 מטר ישר לפניו. קונוסים C ו-D במרחק 5 מטר משני צדי B, באותו קו – יחד הם יוצרים T. השאירו 3 מטר פנויים מאחורי A ל-Backpedal. המודד עומד ליד A.",
    en: "Cone A on the start line. Cone B 10 m straight ahead. Cones C and D 5 m either side of B on the same line – together they form a T. Leave 3 m clear behind A for the backpedal. The timer stands beside A.",
  },
  instructions: [
    { he: "יציאה מ-A: ספרינט 10 מטר ל-B ונגיעה בבסיס הקונוס ביד ימין. השעון מתחיל בתנועה הראשונה.", en: "From A: sprint 10 m to B and touch the base of the cone with the right hand. The clock starts on the first movement." },
    { he: "Shuffle צדי שמאלה 5 מטר ל-C ונגיעה ביד שמאל; Shuffle ימינה 10 מטר ל-D ונגיעה ביד ימין; Shuffle שמאלה 5 מטר חזרה ל-B ונגיעה ביד שמאל. הפנים כל הזמן קדימה, הרגליים לא מצטלבות.", en: "Side shuffle left 5 m to C, touch with the left hand; shuffle right 10 m to D, touch with the right hand; shuffle left 5 m back to B, touch with the left hand. Face forward the whole time, feet never cross." },
    { he: "Backpedal 10 מטר מ-B ל-A. השעון נעצר כשעוברים את קו A. סך הכול 40 מטר.", en: "Backpedal 10 m from B to A. The clock stops as you pass the A line. 40 m in total." },
    { he: "3 ריצות בסט, 75 שניות מנוחה בין ריצות ו-2 דקות בין הסטים. בסט השני מתחילים את ה-Shuffle לימין (C ו-D מתחלפים).", en: "3 runs per set, 75 seconds between runs and 2 minutes between sets. In the second set start the shuffle to the right (C and D swap)." },
    { he: "רגליים שהצטלבו ב-Shuffle או נגיעה שהוחמצה – הריצה לא נספרת. רושמים את הזמן הטוב ביותר.", en: "Crossed feet on a shuffle or a missed touch – the run doesn't count. Log your best time." },
  ],
  cues: [
    { he: "ב-Shuffle: ירכיים נמוכות, המשקל על כריות כפות הרגליים, דוחפים מהרגל האחורית.", en: "On the shuffle: hips low, weight on the balls of the feet, push off the trailing leg." },
    { he: "ב-Backpedal: ישבן נמוך, כתפיים מעל הברכיים, המבט על B.", en: "On the backpedal: hips low, shoulders over the knees, eyes on B." },
    { he: "הנגיעה באה מירידה בירכיים, לא מכיפוף הגב.", en: "The touch comes from dropping the hips, not bending the back." },
  ],
  commonMistakes: [
    { he: "מסתובבים ורצים במקום Shuffle – זמן טוב יותר, אבל לא אימנתם כלום.", en: "Turning and running instead of shuffling – a faster time, but you trained nothing." },
    { he: "עומדים זקוף ב-Backpedal ונופלים אחורה בעצירה.", en: "Standing tall on the backpedal and falling backwards at the stop." },
    { he: "מרפים ב-Backpedal כי ״זה הסוף״ – שם מסתתרת שנייה שלמה.", en: "Coasting the backpedal because \"it's the end\" – a full second hides there." },
  ],
  successMetric: { type: "time_s", key: "t_drill_time_s", label: { he: "הזמן הטוב ביותר ב-T-Drill (שניות), מהתנועה הראשונה עד החזרה מעבר לקו A", en: "Best T-drill time (seconds), from first movement until you are back over line A" }, target: 11 },
  easierVersion: { he: "T של 5 מטר (B במרחק 5, C ו-D במרחק 3), הליכה לאחור במקום Backpedal, 2 ריצות בסט.", en: "A 5 m T (B at 5 m, C and D at 3 m), walk backwards instead of backpedalling, 2 runs per set." },
  harderVersion: { he: "מחזיקים דיסק בשתי הידיים כל הדרך (נוגעים בקונוס עם הדיסק), או 4 ריצות עם 45 שניות מנוחה.", en: "Hold a disc in both hands the whole way (touch the cone with the disc), or 4 runs with 45 seconds rest." },
  soloAlternative: { he: "עובד לבד כפי שהוא: שעון עצר ביד, Start ביציאה ו-Stop במעבר קו A. שפטו את עצמכם ב-Shuffle – בלי שותף אין מי שיפסול הצלבת רגליים.", en: "Works solo as written: stopwatch in hand, start on the first move, stop as you cross line A. Police your own shuffles – with no partner nobody will flag crossed feet." },
  partnerAlternative: { he: "השותף מודד, פוסל רגליים מוצלבות ונגיעות שהוחמצו, ומתחלף אחרי כל ריצה – זו בדיוק המנוחה.", en: "Your partner times, flags crossed feet and missed touches, and swaps after every run – that's exactly the rest." },
  safetyNotes: [
    { he: "בדקו שמסלול ה-Backpedal (3 מטר מאחורי A) נקי – בורות, תיקים, אנשים.", en: "Check the backpedal path (3 m behind A) is clear – holes, bags, people." },
    { he: "קונוסים נמוכים ורכים בלבד; קונוס גבוה בין הרגליים ב-Shuffle מפיל.", en: "Low, soft cones only; a tall cone between the feet on a shuffle will trip you." },
  ],
  diagram: {
    field: "square",
    items: [
      { type: "player", x: 50, y: 92, label: "A" },
      { type: "cone", x: 50, y: 30, label: "B 10m" },
      { type: "cone", x: 15, y: 30, label: "C" },
      { type: "cone", x: 85, y: 30, label: "D" },
      { type: "run", from: [50, 86], to: [50, 36], label: "sprint" },
      { type: "shuffle", from: [46, 32], to: [19, 32] },
      { type: "shuffle", from: [19, 26], to: [81, 26], label: "10m" },
      { type: "run", from: [54, 36], to: [54, 86], dashed: true, label: "backpedal" },
    ],
  },
  throwsPerSet: 0,
  catchesPerSet: 0,
};
