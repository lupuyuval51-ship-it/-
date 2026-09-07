/**
 * Local knowledge base for the coach chat: short, basic questions are answered without Claude.
 * A template wins only on a confident match (≥ 2 keyword hits including ≥ 1 specific keyword, message ≤ 120 chars).
 * Answers are written for both languages; the reply language follows the message (Hebrew letters → Hebrew).
 */
import type { ChatAction, Locale, Localized } from "@/lib/types";

export interface CoachTemplate {
  id: string;
  /** Specific keywords (word-boundary match, Hebrew prefixes ו/ה/ב/ל/מ/ש/כ allowed). */
  keywords: { he: string[]; en: string[] };
  answer: Localized;
  /** Action types worth offering after this answer. */
  actions?: ChatAction["type"][];
}

export const TEMPLATE_MAX_MESSAGE_CHARS = 120;

/** Question words that count for one hit at most and never on their own. */
const GENERIC_KEYWORDS = {
  he: ["מה זה", "מהו", "מהי", "מה", "איך", "הסבר", "הסבירו", "למה", "כמה", "האם", "תסביר"],
  en: ["what is", "what's", "what", "how", "explain", "why", "how many", "how long", "should", "do i", "can i"],
};

export const COACH_TEMPLATES: CoachTemplate[] = [
  {
    id: "role_handler",
    keywords: { he: ["handler", "הנדלר", "הנדלרים", "מוסר", "תפקיד handler"], en: ["handler", "handlers"] },
    answer: {
      he: "Handler הוא השחקן שמחזיק את הדיסק הכי הרבה ומנהל את ההתקפה: זריקות Backhand ו-Forehand מדויקות, Pivot ו-Fakes, Break Throws סביב המגן וקבלת החלטות מהירה. Handler טוב שומר על תנועה מתמדת (Give and Go) ומחזיר את הדיסק לצד הפתוח. באימונים שלו נשים דגש על דיוק תחת Stall Count, שחרור מהיר ועבודת רגליים.",
      en: "A handler is the player who holds the disc most and runs the offense: accurate backhands and forehands, pivots and fakes, break throws around the mark and fast decisions. Good handlers keep moving (give and go) and reset the disc to the open side. Their training focuses on accuracy under a stall count, quick release and footwork.",
    },
    actions: ["generate_workout"],
  },
  {
    id: "role_cutter",
    keywords: { he: ["cutter", "קאטר", "cutters", "חותך"], en: ["cutter", "cutters"] },
    answer: {
      he: "Cutter הוא השחקן שיוצר אפשרויות למסירה: ריצות (Cuts) חדות עם שינוי כיוון, יצירת הפרדה מהמגן, תזמון מול ה-Handler ותפיסה בריצה מלאה. Cutter טוב יודע מתי לרוץ לעומק ומתי לחזור קצר, ומתקשר עם המוסר. באימונים: האצה, Stop and Go, תפיסות בריצה ותפיסות תחת לחץ.",
      en: "A cutter creates throwing options: sharp cuts with changes of direction, separation from the defender, timing with the handler and catching at full speed. A good cutter knows when to go deep and when to come back short, and communicates with the thrower. Training: acceleration, stop-and-go, catching on the move and under pressure.",
    },
    actions: ["generate_workout"],
  },
  {
    id: "role_wing",
    keywords: { he: ["כנף", "wing", "כנפיים"], en: ["wing", "wings"] },
    answer: {
      he: "כנף (Wing) משחקת לאורך קווי הצד: ריצות רוחב ועומק, פתיחת המגרש, מסירות Swing ותפיסות בריצה. הכנף צריכה סיבולת גבוהה, תזמון טוב ומעבר מהיר מהגנה להתקפה. באימונים: ריצות לאורך קו הצד, תזמון ריצת עומק, Catch and Continue ואינטרוולים.",
      en: "A wing plays along the sidelines: width and deep runs, opening up the field, swing passes and catching on the move. Wings need high endurance, good timing and a fast transition from defense to offense. Training: sideline lane runs, deep-run timing, catch-and-continue and intervals.",
    },
    actions: ["generate_workout"],
  },
  {
    id: "role_runner",
    keywords: { he: ["רץ", "runner", "רצים"], en: ["runner", "runners"] },
    answer: {
      he: "רץ (Runner) הוא שחקן המהירות של הקבוצה: האצה חדה, ספרינטים לעומק, Cuts מהירים ותפיסה בריצה מלאה בלי להאט. הרץ מנצל את המהירות כדי לפתוח את המגרש ולקבל דיסקים ארוכים. באימונים: ספרינטים קצרים, יציאה מהמקום, שינויי קצב ותפיסות בריצה.",
      en: "A runner is the team's speed player: sharp acceleration, deep sprints, quick cuts and catching at full speed without slowing down. Runners use pace to stretch the field and receive long throws. Training: short sprints, acceleration starts, tempo changes and catching on the move.",
    },
    actions: ["generate_workout"],
  },
  {
    id: "role_defender",
    keywords: { he: ["מגן", "defender", "הגנה", "מגינים"], en: ["defender", "defenders", "defense", "defence"] },
    answer: {
      he: "מגן (Defender) מונע מהיריב לקבל את הדיסק: עבודת רגליים, Mirror (לשקף את תנועת השחקן), Mark על הזורק כדי לחסום כיוון זריקה, תגובה מהירה ל-Fakes ומעבר מהיר להתקפה אחרי חילוף. באימונים: Mirror Drill, Side Shuffle, קדימה-אחורה, תרגילי Mark ו-Recovery Sprint.",
      en: "A defender stops the opponent from getting the disc: footwork, mirroring the player's movement, marking the thrower to take away a throwing lane, reacting quickly to fakes and transitioning fast to offense after a turnover. Training: mirror drill, side shuffles, forward-backpedal, mark drills and recovery sprints.",
    },
    actions: ["generate_workout"],
  },
  {
    id: "role_hybrid",
    keywords: { he: ["היברידי", "hybrid", "כללי", "allround", "all-round"], en: ["hybrid", "all-around", "allround", "all round"] },
    answer: {
      he: "שחקן היברידי משלב זריקה, Cuts והגנה ויכול לשחק בכל מקום במגרש. באימונים שלו נחלק את הזמן בין תרגילי Handler, Cutter ומגן, ונשים יותר דגש על המיומנויות שהסטטיסטיקה מסמנת כחלשות יותר. אם עדיין לא בטוחים בתפקיד – זו נקודת התחלה מצוינת.",
      en: "A hybrid player mixes throwing, cutting and defense and can play anywhere on the field. Their sessions split time between handler, cutter and defender drills, with extra weight on the skills your stats flag as weaker. If you are not sure about your role yet, this is a great starting point.",
    },
    actions: ["generate_workout"],
  },
  {
    id: "stall_count",
    keywords: { he: ["stall", "stall count", "ספירה", "ספירת stall", "סטול"], en: ["stall", "stall count", "stalling"] },
    answer: {
      he: "Stall Count הוא הספירה של המגן שמסמן את הזורק: הוא סופר בקול מ-1 עד 10, ואם הדיסק לא שוחרר עד \"עשר\" – הדיסק עובר ליריב. בפועל יש לזורק כ-8–9 שניות להחליט ולזרוק. לכן מתאמנים על Fake מהיר, Pivot ושחרור בתוך 5 שניות.",
      en: "The stall count is the count called by the defender marking the thrower: they count out loud from 1 to 10, and if the disc has not been released by \"ten\" it turns over. In practice the thrower has about 8–9 seconds to decide and throw, which is why we train quick fakes, pivots and releasing within 5 seconds.",
    },
  },
  {
    id: "pivot",
    keywords: { he: ["pivot", "פיבוט", "רגל ציר", "ציר"], en: ["pivot", "pivoting", "pivot foot"] },
    answer: {
      he: "Pivot הוא סיבוב על רגל ציר קבועה כשמחזיקים את הדיסק: הרגל הקבועה נשארת במקומה והרגל השנייה זזה כדי לפתוח זווית זריקה (Backhand לצד אחד, Forehand לצד השני). הטעות הנפוצה: להרים או לגרור את רגל הציר – זו עבירה (Travel). תרגלו Pivot איטי ומדויק לפני שמוסיפים מהירות.",
      en: "A pivot is rotating on a fixed pivot foot while holding the disc: the pivot foot stays planted and the other foot moves to open a throwing angle (backhand to one side, forehand to the other). The common mistake is lifting or dragging the pivot foot, which is a travel. Practise slow, precise pivots before adding speed.",
    },
  },
  {
    id: "break_throw",
    keywords: { he: ["break", "break throw", "ברייק", "break side"], en: ["break", "break throw", "break side", "break throws"] },
    answer: {
      he: "Break Throw היא זריקה לצד שהמגן מנסה לחסום (ה-Break Side). היא דורשת Pivot רחב, שחרור נמוך או גבוה ולפעמים Fake לפני. זו זריקה שמשנה משחק כי ההגנה לא מצפה לה. מתחילים במרחק קצר עם קונוס שמדמה מגן, ומוסיפים מרחק רק כשמגיעים ל-7 מתוך 10.",
      en: "A break throw goes to the side the mark is trying to take away (the break side). It needs a wide pivot, a low or high release and often a fake first. It changes games because the defense does not expect it. Start at short range with a cone as the mark and add distance only once you hit 7 of 10.",
    },
  },
  {
    id: "grip_backhand",
    keywords: { he: ["backhand", "בקהנד", "אחיזה", "אחיזת", "לאחוז"], en: ["backhand", "grip", "hold", "throw a backhand"] },
    answer: {
      he: "אחיזת Backhand: ארבע אצבעות מתחת לשפה של הדיסק, האגודל למעלה, האצבע המורה יכולה להיות על השפה (למתחילים) או מתחת (לכוח). עומדים עם הכתף לכיוון המטרה, מותחים את הזרוע לאחור ומשחררים עם הצלפה של שורש כף היד. הסוד הוא הסיבוב (Spin) – לא הכוח. התחילו מ-5 מטר ובדקו שהדיסק נשאר שטוח.",
      en: "Backhand grip: four fingers under the rim, thumb on top; the index finger can sit on the rim (beginners) or underneath (more power). Stand with your shoulder toward the target, reach back and release with a snap of the wrist. The secret is spin, not power. Start at 5 metres and check that the disc stays flat.",
    },
  },
  {
    id: "grip_forehand",
    keywords: { he: ["forehand", "פורהנד", "flick", "פליק"], en: ["forehand", "flick", "throw a forehand"] },
    answer: {
      he: "אחיזת Forehand (Flick): שתי אצבעות מתחת לדיסק – האמצעית לחוצה אל השפה מבפנים, המורה לצידה או מתחת – והאגודל למעלה. המרפק צמוד לגוף, כף היד פונה למעלה, והזריקה מגיעה מהצלפה של שורש כף היד, לא מתנועת הכתף. תרגלו \"זריקות שולחן\" קצרות של 3–5 מטר עד שהדיסק יוצא ישר ועם ספין.",
      en: "Forehand (flick) grip: two fingers under the disc – the middle finger pressed against the inside of the rim, the index finger beside or below it – thumb on top. Keep the elbow close to your body, palm up, and throw with a wrist snap rather than a shoulder swing. Practise short 3–5 metre throws until the disc leaves straight with spin.",
    },
  },
  {
    id: "grip_hammer",
    keywords: { he: ["hammer", "האמר", "המר", "זריקה מעל הראש"], en: ["hammer", "overhead", "throw a hammer"] },
    answer: {
      he: "Hammer היא זריקה מעל הראש באחיזת Forehand: הדיסק הפוך, מוחזק בזווית מעל הכתף, ומשוחרר קדימה ומעט למעלה. הדיסק מתהפך באוויר ונוחת הפוך. זו זריקה למתקדמים – ראשית שולטים ב-Forehand, ואז מתחילים ב-8–10 מטר עם מטרה גדולה ומוסיפים מרחק לאט.",
      en: "A hammer is an overhead throw with a forehand grip: the disc is held upside down at an angle above the shoulder and released forward and slightly up. It flips in the air and lands upside down. It is an advanced throw – master the forehand first, then start at 8–10 metres with a big target and add distance slowly.",
    },
  },
  {
    id: "wind",
    keywords: { he: ["רוח", "ברוח", "רוחות", "סערה"], en: ["wind", "windy", "breeze", "gust"] },
    answer: {
      he: "ברוח: זורקים נמוך ושטוח יותר, עם יותר ספין, ומכוונים מעט נגד הרוח. נגד הרוח – זריקות קצרות ומהירות; עם הרוח – הדיסק \"מרחף\" ולכן מכוונים קצר יותר מהרגיל. תפיסות: מתקרבים לדיסק ותופסים בשתי ידיים (Pancake). ברוח חזקה מאוד עדיף להעביר את האימון לתרגילי תנועה ועבודת רגליים.",
      en: "In wind: throw lower and flatter with more spin, and aim slightly into the wind. Into the wind use short, fast throws; with the wind the disc floats, so aim shorter than usual. For catching, attack the disc and use two hands (pancake). In very strong wind, shift the session to movement and footwork drills.",
    },
    actions: ["generate_workout"],
  },
  {
    id: "equipment",
    keywords: { he: ["ציוד", "קונוסים", "צריך לקנות", "מה צריך", "דיסק"], en: ["equipment", "gear", "cones", "need to buy", "what do i need"] },
    answer: {
      he: "הציוד היחיד שחייבים הוא דיסק אחד (175 גרם הוא הסטנדרט ב-Ultimate). כל תרגיל ב-DiscCoach יודע להסתדר בלי ציוד נוסף, אבל 4–6 קונוסים (או בקבוקים), קיר או מטרה וסטופר בטלפון פותחים הרבה יותר תרגילים. עדכנו את הציוד בפרופיל והאימונים יותאמו אוטומטית.",
      en: "The only must-have is a disc (175 g is the Ultimate standard). Every DiscCoach drill works without extra gear, but 4–6 cones (or bottles), a wall or target and a stopwatch on your phone unlock many more drills. Update your equipment in the profile and workouts adapt automatically.",
    },
  },
  {
    id: "workout_length",
    keywords: { he: ["כמה זמן", "אורך האימון", "כמה דקות", "משך האימון", "כמה זמן אימון"], en: ["how long", "workout length", "minutes", "session length", "how long is a workout"] },
    answer: {
      he: "אימון מלא ב-DiscCoach נמשך 90, 105 או 120 דקות ובנוי משלבים קבועים: צ'ק-אין, חימום, זריקות ותפיסות, תנועה, אימון תפקיד, מצבי משחק, אתגר ושחרור. אפשר לבחור את המשך בפרופיל או בכל יצירת אימון. אם יש פחות זמן – עדיף אימון קצר ומלא מאשר לדלג על חימום ושחרור.",
      en: "A full DiscCoach session is 90, 105 or 120 minutes, built from fixed phases: check-in, warm-up, throwing & catching, movement, role training, game situations, challenge and cool-down. Pick the length in your profile or whenever you generate a workout. Short on time? A shorter complete session beats skipping the warm-up and cool-down.",
    },
    actions: ["generate_workout"],
  },
  {
    id: "readiness",
    keywords: { he: ["מוכנות", "ציון מוכנות", "readiness", "אחוז מוכנות"], en: ["readiness", "readiness score", "ready for"] },
    answer: {
      he: "ציון המוכנות לתפקיד מחושב מהתוצאות שמדדתם באימונים: לכל תפקיד יש מיומנויות מפתח (למשל ל-Handler – דיוק Backhand/Forehand, Break Throws ושחרור מהיר), וכל מדד מושווה ליעד לפי הרמה שלכם. הציון עולה כשמודדים יותר תרגילים ומשתפרים בהם. אין כאן ניחוש – רק מספרים שרשמתם.",
      en: "Role readiness is computed from the results you record in sessions: each role has key skills (for a handler – backhand/forehand accuracy, break throws and quick release) and every metric is compared to a target for your level. The score rises as you measure more drills and improve. Nothing is guessed – only numbers you logged.",
    },
  },
  {
    id: "xp",
    keywords: { he: ["xp", "נקודות", "רמה", "לעלות רמה", "ניסיון"], en: ["xp", "points", "level up", "experience", "levels"] },
    answer: {
      he: "XP מגיע מכל פעילות: סיום אימון, רישום תוצאות לתרגילים, השלמת אתגרים יומיים ושבועיים, שיאים אישיים והישגים. צבירת XP מעלה רמה (Rookie → Disc Learner → Skilled Thrower ועד Frisbee Legend). אין כאן קנייה או קיצורי דרך – רק אימונים.",
      en: "XP comes from every activity: finishing a session, logging drill results, completing daily and weekly challenges, personal bests and achievements. XP raises your level (Rookie → Disc Learner → Skilled Thrower up to Frisbee Legend). No purchases or shortcuts – just training.",
    },
  },
  {
    id: "change_role",
    keywords: { he: ["לשנות תפקיד", "להחליף תפקיד", "שינוי תפקיד", "תפקיד אחר", "תפקיד"], en: ["change role", "switch role", "change my role", "another role", "role"] },
    answer: {
      he: "אפשר לשנות תפקיד בכל רגע: פרופיל ← תפקיד ראשי / משני. המערכת שומרת את היסטוריית התפקידים, ההתקדמות לא נמחקת, ותוכנית האימונים מתעדכנת עם הערת התאמה. אם אתם מתלבטים – בחרו \"היברידי\" או \"כללי\" ותנו לסטטיסטיקה להראות איפה אתם חזקים.",
      en: "You can change roles any time: Profile → primary / secondary role. Your role history is kept, progress is never erased and the training plan updates with an adaptation note. Not sure? Pick hybrid or all-around and let your stats show where you are strongest.",
    },
  },
  {
    id: "privacy",
    keywords: { he: ["פרטיות", "הנתונים שלי", "מידע אישי", "נשמר", "מי רואה"], en: ["privacy", "my data", "personal data", "stored", "who can see"] },
    answer: {
      he: "הנתונים שלכם נשמרים קודם כול במכשיר. עם חשבון הם מסונכרנים לשרת כדי לעבור בין מכשירים. למאמן החכם נשלח רק הקשר מצומצם (תפקיד, רמה, מספרים מהאימונים) – ואפשר לכבות כל חלק בהגדרות ← שיתוף נתונים עם המאמן. אפשר לייצא או למחוק את כל הנתונים מהחשבון בכל רגע.",
      en: "Your data is stored on your device first. With an account it syncs to the server so you can switch devices. The AI coach only receives a compact context (role, level, numbers from your sessions) – and every part can be switched off under Settings → data sharing with the coach. You can export or delete all your account data at any time.",
    },
  },
  {
    id: "huck",
    keywords: { he: ["huck", "האק", "זריקה ארוכה", "זריקת עומק"], en: ["huck", "hucks", "long throw", "deep throw"] },
    answer: {
      he: "Huck היא זריקה ארוכה לעומק המגרש. המפתח הוא ספין ומסלול, לא כוח: Pivot רחב, העברת משקל מהרגל האחורית לקדמית, ושחרור עם הצלפה בזווית קלה כלפי מעלה. מתחילים ב-20 מטר עם דגש על דיסק שטוח ומוסיפים 5 מטר בכל פעם שמגיעים ל-7 מתוך 10 בתוך אזור המטרה.",
      en: "A huck is a long throw deep down the field. The key is spin and flight path, not muscle: a wide pivot, weight transfer from the back foot to the front and a snap release at a slight upward angle. Start at 20 metres focusing on a flat disc and add 5 metres every time you hit 7 of 10 inside the target zone.",
    },
  },
  {
    id: "force_mark",
    keywords: { he: ["force", "mark", "מארק", "פורס", "לסמן"], en: ["force", "mark", "marking", "the mark"] },
    answer: {
      he: "ה-Mark הוא המגן שעומד מול הזורק וסופר Stall. ה-Force היא ההחלטה הקבוצתית לאיזה צד \"מרשים\" לזורק לזרוק – ה-Mark חוסם את הצד השני (Break Side). Mark טוב עומד במרחק זרוע, ברכיים כפופות, ידיים למטה ולצדדים, וזז עם ה-Pivot בלי לגעת בזורק.",
      en: "The mark is the defender standing in front of the thrower counting the stall. The force is the team decision about which side the thrower is \"allowed\" to throw to – the mark takes away the other side (the break side). A good mark stands an arm's length away, knees bent, hands low and wide, and moves with the pivot without touching the thrower.",
    },
  },
  {
    id: "warmup",
    keywords: { he: ["חימום", "להתחמם", "לפני האימון", "חימום לפני"], en: ["warm up", "warm-up", "warmup", "before training"] },
    answer: {
      he: "חימום טוב לוקח 10–15 דקות ועולה בהדרגה: ריצה קלה ומוביליטי (3 דק׳), סיבובי כתפיים, מרפקים ושורש כף היד, פתיחת ירכיים עם סקוואט ולאנג׳, High Knees ו-Side Shuffle, האצות קצרות – ורק אז זריקות קלות במרחק עולה. בלי חימום לא עושים ספרינטים או Hucks.",
      en: "A good warm-up takes 10–15 minutes and builds gradually: light jog and mobility (3 min), shoulder, elbow and wrist circles, hip openers with squats and lunges, high knees and side shuffles, short accelerations – and only then easy throws at increasing distance. No sprints or hucks without a warm-up.",
    },
  },
  {
    id: "cooldown",
    keywords: { he: ["שחרור", "מתיחות", "אחרי האימון", "להתקרר"], en: ["cool down", "cool-down", "cooldown", "stretch", "after training"] },
    answer: {
      he: "שחרור של 5 דקות בסוף האימון: הליכה קלה ונשימות עמוקות עד שהדופק יורד, מתיחות עדינות לכתפיים, לאמה, לירכיים ולשוקיים (20–30 שניות לכל מתיחה, בלי קפיצות), ואז רגע קצר לדרג את הקושי ולסכם מה עבד. השחרור עוזר להתאושש טוב יותר לאימון הבא.",
      en: "A 5-minute cool-down at the end: an easy walk with deep breathing until the heart rate drops, gentle stretches for shoulders, forearm, hips and calves (20–30 seconds each, no bouncing), then a moment to rate the difficulty and note what worked. It helps you recover better for the next session.",
    },
  },
  {
    id: "pain",
    keywords: { he: ["כאב", "כואב", "פציעה", "נפצעתי", "סחרחורת"], en: ["pain", "hurts", "injury", "injured", "dizzy", "dizziness"] },
    answer: {
      he: "כאב חד, סחרחורת, קוצר נשימה או דפיקות לב חריגות – עוצרים את האימון מיד, נחים ופונים למבוגר אחראי או לאיש מקצוע. אני מאמן, לא רופא, ולא נותן אבחון. עם כאב קל ומוכר אפשר להמשיך בעצימות נמוכה בלי לעבור דרך הכאב, ולסמן זאת בצ'ק-אין כדי שהאימון יותאם.",
      en: "Sharp pain, dizziness, shortness of breath or an unusual heartbeat – stop the session right away, rest and see a responsible adult or a professional. I am a coach, not a doctor, and I do not diagnose. With mild, familiar discomfort you can continue at low intensity without pushing through pain – mark it in the check-in so the session adapts.",
    },
  },
  {
    id: "solo",
    keywords: { he: ["לבד", "בלי שותף", "אין לי עם מי", "אימון לבד", "סולו"], en: ["alone", "solo", "by myself", "no partner", "without a partner"] },
    answer: {
      he: "לבד אפשר להתאמן מצוין: קיר או מטרה לזריקות ותפיסות חוזרות, זריקה עצמית ותפיסה, קונוסים לשערים ולמסלולי ריצה, ותרגילי תנועה שלא צריכים שותף. כל תרגיל ב-DiscCoach כולל גרסת סולו, והמאמן לעולם לא ישבץ תרגיל זוגי למי שמתאמן לבד – רק תעדכנו \"לבד\" בפרופיל או בצ'ק-אין.",
      en: "You can train very well alone: a wall or target for repeated throws and catches, self-toss and catch, cones for gates and running courses, and movement drills that need no partner. Every DiscCoach drill has a solo version and the coach never schedules a pair drill for a solo athlete – just set \"solo\" in your profile or check-in.",
    },
    actions: ["generate_workout"],
  },
  {
    id: "cut_fake",
    keywords: { he: ["cut", "cuts", "קאט", "fake", "פייק", "הטעיה"], en: ["cut", "cuts", "cutting", "fake", "fakes", "juke"] },
    answer: {
      he: "Cut היא ריצה חדה עם שינוי כיוון שמטרתה ליצור הפרדה מהמגן ולהפוך למטרה למסירה. Fake היא הטעיה – של הזורק (תנועת זריקה בלי לשחרר) או של הרץ (צעד לכיוון אחד ויציאה לכיוון השני). שניהם עובדים כשהם נמכרים באמת: ראש, כתפיים וגוף זזים, לא רק הרגליים.",
      en: "A cut is a sharp run with a change of direction meant to create separation from the defender and become a throwing target. A fake is a deception – by the thrower (a throwing motion without release) or by the cutter (a step one way, then bursting the other). Both work when they are sold for real: head, shoulders and body move, not just the feet.",
    },
  },
  {
    id: "give_and_go",
    keywords: { he: ["give and go", "give & go", "גיב אנד גו", "מסירה וריצה"], en: ["give and go", "give-and-go", "give & go"] },
    answer: {
      he: "Give and Go: מוסרים דיסק קצר ומיד רצים קדימה כדי לקבל אותו בחזרה. זה הכלי הבסיסי של Handler כדי להתקדם במגרש בלי סיכון. המפתח: לרוץ מיד אחרי השחרור, לקבל בריצה ולזרוק במהירות. לבד מתרגלים עם קיר: זריקה, ריצה קצרה, תפיסה חוזרת.",
      en: "Give and go: throw a short pass and immediately run forward to receive it back. It is the handler's basic tool for moving the disc up the field with little risk. The key: run right after the release, catch on the move and throw quickly. Alone, practise it against a wall – throw, short run, catch the rebound.",
    },
  },
  {
    id: "frequency",
    keywords: { he: ["כמה פעמים", "כמה אימונים", "בשבוע", "תדירות", "כל יום"], en: ["how often", "how many times", "per week", "frequency", "every day"] },
    answer: {
      he: "לרוב המתאמנים 2–3 אימונים מלאים בשבוע עם לפחות יום מנוחה ביניהם הם הקצב הנכון: מספיק כדי להתקדם, ולא יותר מדי לכתף ולרגליים. ילדים ונוער – 2 אימונים ויותר משחק. אפשר לזרוק קלות גם בימים שביניהם. הגדירו את הימים בפרופיל ותוכנית האימונים תתאים את עצמה.",
      en: "For most athletes 2–3 full sessions a week with at least a rest day in between is the right rhythm: enough to progress, not too much for the shoulder and legs. Kids and teens – 2 sessions and more play. Light throwing on the days between is fine. Set your days in the profile and the plan adapts.",
    },
    actions: ["add_to_plan"],
  },
  {
    id: "pancake",
    keywords: { he: ["pancake", "פנקייק", "תפיסה בשתי ידיים", "איך לתפוס", "לתפוס"], en: ["pancake", "two-hand catch", "how to catch", "catching"] },
    answer: {
      he: "תפיסת Pancake היא התפיסה הבטוחה ביותר: כף יד אחת מעל הדיסק ואחת מתחתיו, \"לוחצים\" אותו באמצע כמו פנקייק. מתאימה לרוח ולדיסקים במרכז הגוף. תפיסה בשתי ידיים מהצדדים (Crocodile / Rim catch) לדיסקים גבוהים או נמוכים. בכל תפיסה – עיניים על הדיסק עד שהוא ביד, ומתקדמים לקראתו במקום לחכות.",
      en: "The pancake is the safest catch: one hand above the disc and one below, clapping it in the middle like a pancake. Best in wind and for discs at chest height. Use a two-hand rim catch for high or low discs. Every catch: eyes on the disc until it is in your hands, and attack it instead of waiting.",
    },
  },
];

const HEBREW_PREFIXES = "[והבלמשכ]{0,2}";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeMessage(text: string): string {
  return ` ${text
    .toLowerCase()
    .replace(/[֑-ׇ]/g, "") // niqqud
    .replace(/[^\p{L}\p{N}\s&-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

const regexCache = new Map<string, RegExp>();

function keywordRegex(kw: string): RegExp {
  let re = regexCache.get(kw);
  if (!re) {
    re = new RegExp(`(?:^|\\s)${HEBREW_PREFIXES}${escapeRegExp(kw.toLowerCase())}(?:e?s|ים|ות)?(?=\\s|$)`, "u");
    regexCache.set(kw, re);
  }
  return re;
}

export function hasKeyword(normalized: string, kw: string): boolean {
  return keywordRegex(kw).test(normalized);
}

export interface TemplateMatch {
  template: CoachTemplate;
  reply: string;
  locale: Locale;
  hits: number;
  specificHits: number;
}

/** Language of the answer: Hebrew letters → he, Latin letters → en, otherwise the caller's locale. */
export function detectLocale(message: string, fallback: Locale): Locale {
  if (/[֐-׿]/.test(message)) return "he";
  if (/[A-Za-z]/.test(message)) return "en";
  return fallback;
}

function score(template: CoachTemplate, normalized: string): { specific: number; total: number } {
  const specific = [...new Set([...template.keywords.he, ...template.keywords.en])].filter((kw) => hasKeyword(normalized, kw)).length;
  const generic = [...GENERIC_KEYWORDS.he, ...GENERIC_KEYWORDS.en].some((kw) => hasKeyword(normalized, kw)) ? 1 : 0;
  return { specific, total: specific + generic };
}

/** Confident match or null. */
export function matchTemplate(message: string, locale: Locale = "he"): TemplateMatch | null {
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > TEMPLATE_MAX_MESSAGE_CHARS) return null;
  const normalized = normalizeMessage(trimmed);
  const scored = COACH_TEMPLATES.map((template) => ({ template, ...score(template, normalized) }))
    .filter((s) => s.specific >= 1 && s.total >= 2)
    .sort((a, b) => b.total - a.total || b.specific - a.specific);
  const best = scored[0];
  if (!best) return null;
  const second = scored[1];
  if (second && second.total === best.total && second.specific === best.specific) return null;
  const answerLocale = detectLocale(trimmed, locale);
  return { template: best.template, reply: best.template.answer[answerLocale], locale: answerLocale, hits: best.total, specificHits: best.specific };
}

/** True for short messages that touch a known basic topic – such answers may be cached across users. */
export function isTemplateEligible(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > TEMPLATE_MAX_MESSAGE_CHARS) return false;
  const normalized = normalizeMessage(trimmed);
  return COACH_TEMPLATES.some((t) => score(t, normalized).specific >= 1);
}
