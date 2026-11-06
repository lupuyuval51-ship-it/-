import type { Idea } from '../types';

/**
 * Productivity, second batch – every idea picks one narrow mechanism (a range
 * instead of a number, a send-time hook, a points-per-minute yield, a fairness
 * ledger, on-device speech) instead of adding another list of tasks.
 */
export const ideas: Idea[] = [
  {
    id: 'gauge',
    name: { he: 'Gauge – כמה זה באמת ייקח', en: 'Gauge' },
    tagline: {
      he: 'מעריכים משימה כטווח עם רמת ביטחון, ו-Gauge לומדת עד כמה אתם חורגים – ומציגה לכל הערכה חדשה טווח מכויל שאפשר לתכנן לפיו.',
      en: 'Estimate a task as a range with a confidence level, and Gauge learns how far off you tend to be – then shows a calibrated range you can plan around.',
    },
    category: 'productivity',
    secondaryCategories: ['business', 'devtools'],
    difficulty: 'beginner',
    effort: { weeksMin: 2, weeksMax: 3 },
    budget: 'free',
    businessModel: 'open-source',
    platforms: ['cross-platform'],
    audience: ['professionals', 'developers', 'creators'],
    tags: ['estimation', 'calibration', 'time tracking', 'freelance', 'planning', 'quotes', 'sprint', 'local-first'],
    identity: { hue: 168, glyph: 'Gg', pattern: 'ring' },
    flags: { beginnerFriendly: true, profitPotential: 'low', experimental: false, trending: false, featuredWeight: 2 },
    spec: {
      overview: {
        he: 'Gauge מבקשת מכם להפסיק לנחש מספר אחד ולהתחיל להעריך טווח. לפני שמתחילים משימה כותבים "ברמת ביטחון של 80%, זה ייקח בין שעה לשלוש שעות" ומתייגים את סוג העבודה: עריכת וידאו, הצעת מחיר, תיקון באג. בסיום מזינים כמה זמן זה לקח בפועל, ולכל סוג עבודה נבנה פרופיל אישי: באיזה חלק מהמקרים הטווח שלכם החזיק, ובכמה אתם נוטים לחרוג מאמצע הטווח. אחרי כמה משימות מאותו סוג, Gauge מציגה ליד כל הערכה חדשה טווח מכויל שמבוסס על ההיסטוריה שלכם בלבד. אין כאן מודל חיזוי ואין שרת – רק חשבון פשוט על המספרים שלכם, שמחזיר לכם מראה כנה של האופן שבו אתם מעריכים.',
        en: 'Gauge asks you to stop guessing a single number and start estimating a range. Before starting a task you write "I’m 80% sure this takes between one and three hours" and tag the kind of work: video editing, a quote, a bug fix. When you finish you enter the real time, and a personal profile builds up for each kind of work: how often your range held, and how far you tend to overshoot the middle of it. After a few tasks of the same kind, Gauge shows a calibrated range next to each new estimate, based only on your own history. There is no prediction model and no server – just simple arithmetic on your numbers that hands you an honest mirror of how you estimate.',
      },
      problem: {
        he: 'הערכות זמן נוטות לא פעם להיות אופטימיות, ומי שמציע ללקוח מחיר או מבטיח לצוות תאריך משלם על כך בערבים ארוכים. גם כשמודדים זמן, בדרך כלל לא משווים אותו להערכה המקורית, והערכה של מספר בודד מסתירה עד כמה לא היינו בטוחים.',
        en: 'Time estimates are often optimistic, and anyone who quotes a client a price or promises a team a date pays for it in long evenings. Even when people track time, they rarely compare it with the original estimate, and a single-number guess hides how uncertain it was.',
      },
      solution: {
        he: 'שלושה צעדים קצרים: טווח עם רמת ביטחון לפני תחילת העבודה, זמן בפועל בסיומה, וכיול אוטומטי שמתעדכן מההיסטוריה. הכיול עובד לפי סוג עבודה, ובסוגים שעדיין אין בהם מספיק נתונים הוא נעזר בכלל ההיסטוריה שלכם ומסמן זאת בבירור. תזכורת מקומית אחת מבקשת לתעד זמן בפועל כשהעבודה עברה את הגבול העליון של הטווח.',
        en: 'Three short steps: a range with a confidence level before you start, the actual time when you finish, and an automatic calibration that updates from your history. Calibration works per kind of work, and for kinds without enough data it falls back to your overall history and says so clearly. One local reminder asks you to log the real time once the work has passed the upper bound of the range.',
      },
      usp: {
        he: 'לא מעקב זמן ולא מנוע חיזוי: Gauge מודדת עד כמה אתם מדייקים בהערכה, ולא את הזמן עצמו. הטווח הוא ההבטחה, והוא נבדק מול המציאות בכל פעם מחדש – בלי חשבון ובלי שרת.',
        en: 'Not a time tracker and not a prediction engine: Gauge measures how well you estimate, not the time itself. The range is the promise, and it is checked against reality every time – with no account and no server.',
      },
      targetUsers: {
        he: ['פרילנסרים ועצמאים שמתמחרים פרויקטים לפי שעות', 'מפתחים ומעצבים שמעריכים משימות לספרינט', 'כותבים ויוצרים שרוצים לדעת כמה זמן באמת לוקחת טיוטה'],
        en: ['Freelancers who price projects by the hour', 'Developers and designers estimating tasks for a sprint', 'Writers and creators who want to know how long a draft really takes'],
      },
      coreFeatures: {
        he: [
          'הערכה כטווח עם רמת ביטחון לבחירה: 50%, 80% או 90%',
          'סוגי עבודה שמגדירים בעצמכם, עם סוג ברירת מחדל לכל משימה חדשה',
          'טיימר אופציונלי או הזנה ידנית של הזמן בפועל',
          'טווח מכויל שמוצג ליד כל הערכה חדשה, מבוסס על ההיסטוריה שלכם בלבד',
          'מדד פגיעה: באיזה חלק מהמשימות הזמן בפועל נפל בתוך הטווח שהערכתם',
          'תזכורת מקומית לתעד זמן בפועל כשהמשימה עברה את הגבול העליון',
          'ייצוא CSV של ההיסטוריה המלאה',
        ],
        en: [
          'Estimate as a range with a chosen confidence level: 50%, 80% or 90%',
          'Kinds of work you define yourself, with a default kind for each new task',
          'Optional timer or manual entry of the actual time',
          'A calibrated range shown next to each new estimate, based only on your own history',
          'Hit rate: in what share of tasks the actual time fell inside the range you gave',
          'Local reminder to log the actual time once a task passes the upper bound',
          'CSV export of the full history',
        ],
      },
      screens: [
        { name: { he: 'הערכה חדשה', en: 'New estimate' }, description: { he: 'שני סליידרים לגבול התחתון והעליון, בורר רמת ביטחון ושורת סוגי עבודה; כשיש היסטוריה מוצג מתחת הטווח המכויל.', en: 'Two sliders for the lower and upper bound, a confidence picker and a row of work kinds; once there is history, the calibrated range appears underneath.' } },
        { name: { he: 'בעבודה', en: 'In progress' }, description: { he: 'משימות פתוחות עם טיימר אופציונלי והטווח שהערכתם כפס; הפס משנה גוון כשעוברים את הגבול העליון.', en: 'Open tasks with an optional timer and the range you estimated drawn as a bar; the bar shifts tone when the upper bound is passed.' } },
        { name: { he: 'סיום משימה', en: 'Wrap-up' }, description: { he: 'הזנת הזמן בפועל ומיקומו על הפס ביחס לטווח, בשתי נגיעות.', en: 'Enter the actual time and see where it lands on the bar relative to the range, in two taps.' } },
        { name: { he: 'כיול', en: 'Calibration' }, description: { he: 'לכל סוג עבודה: מדד פגיעה, גורם חריגה אופייני ותרשים פשוט של הערכה מול בפועל, עם מספר המשימות שעומדות מאחורי כל נתון.', en: 'Per kind of work: hit rate, typical overshoot factor and a simple estimate-versus-actual chart, with the number of tasks behind each figure.' } },
        { name: { he: 'היסטוריה', en: 'History' }, description: { he: 'רשימה של משימות שהסתיימו עם הטווח, הזמן בפועל וסימון אם נפל בפנים; סינון לפי סוג עבודה.', en: 'A list of finished tasks with the range, the actual time and a mark for whether it fell inside; filter by kind of work.' } },
        { name: { he: 'הגדרות', en: 'Settings' }, description: { he: 'סוגי עבודה, רמת ביטחון ברירת מחדל, מספר משימות מינימלי לפני הצגת כיול, תזכורות וייצוא.', en: 'Work kinds, default confidence level, minimum task count before calibration is shown, reminders and export.' } },
      ],
      userJourney: {
        he: [
          'מעצבת עצמאית מעריכה עיצוב של דף נחיתה: "ברמת ביטחון של 80%, בין ארבע לשש שעות"',
          'היא מסיימת אחרי תשע שעות ומזינה את הזמן בפועל',
          'אחרי שש משימות מאותו סוג Gauge מראה שהטווח שלה החזיק רק בשלוש מהן ושהיא חורגת בדרך כלל מעל אמצע הטווח',
          'בהצעת המחיר הבאה היא רואה ליד ההערכה שלה טווח מכויל רחב יותר',
          'היא מציעה ללקוח את הגבול העליון של הטווח המכויל במקום את אמצע ההערכה המקורית',
        ],
        en: [
          'A freelance designer estimates a landing-page design: "80% confident, between four and six hours"',
          'She finishes after nine hours and enters the actual time',
          'After six tasks of the same kind, Gauge shows her range held in only three of them and that she usually lands above the middle of it',
          'On the next quote she sees a wider calibrated range next to her own estimate',
          'She quotes the client from the upper end of the calibrated range instead of the middle of her original guess',
        ],
      },
      uxDirection: {
        he: 'שקט וחשבונאי: רקע בהיר, ספרות ברוחב אחיד ופס טווח אופקי כאלמנט הוויזואלי המרכזי. כל הערכה היא פס, והזמן בפועל הוא נקודה עליו – בירוק כשהיא בפנים ובענבר כשהיא מחוץ לטווח. בלי ציונים, בלי רצפים ובלי חגיגות: המטרה היא כיול ולא תחרות.',
        en: 'Quiet and ledger-like: a light canvas, tabular figures and a horizontal range bar as the central visual. Every estimate is a bar and the actual time is a dot on it – green inside, amber outside. No scores, no streaks, no celebrations: the point is calibration, not competition.',
      },
      architecture: {
        he: 'Expo עם Expo Router, כל הנתונים ב-expo-sqlite על המכשיר ובלי שרת. החישוב הוא פונקציות טהורות: מדד הפגיעה הוא חלק המשימות שהזמן בפועל נפל בטווח מכלל המשימות בסוג, והגורם המכויל נגזר מחציון היחס בין הזמן בפועל לאמצע הטווח, עם סף מינימום של משימות לפני שהוא מוצג. expo-notifications מתזמנת תזכורת מקומית אחת לכל משימה פתוחה. ההיסטוריה מיוצאת ל-CSV דרך expo-sharing, ותרשימי הכיול מצוירים ב-react-native-svg.',
        en: 'Expo with Expo Router, all data in expo-sqlite on the device and no server. The maths is pure functions: hit rate is the share of tasks in a kind whose actual time fell inside the range, and the calibration factor comes from the median ratio of actual time to the middle of the range, with a minimum task count before it is shown. expo-notifications schedules one local reminder per open task. History is exported as CSV through expo-sharing, and the calibration charts are drawn with react-native-svg.',
      },
      stack: ['Expo', 'Expo Router', 'expo-sqlite', 'expo-notifications', 'expo-sharing', 'react-native-svg'],
      database: {
        he: ['task_types – שם, צבע, סוג ברירת מחדל', 'estimates – משימה, סוג עבודה, גבול תחתון, גבול עליון, רמת ביטחון, תאריך', 'outcomes – הערכה, זמן בפועל, האם נפל בטווח', 'calibrations – סוג עבודה, מדד פגיעה, גורם חריגה, מספר משימות', 'settings – רמת ביטחון ברירת מחדל, סף מינימום, העדפות תזכורת'],
        en: ['task_types – name, colour, default kind', 'estimates – task, work kind, lower bound, upper bound, confidence level, date', 'outcomes – estimate, actual time, whether it fell inside the range', 'calibrations – work kind, hit rate, overshoot factor, task count', 'settings – default confidence level, minimum threshold, reminder preferences'],
      },
      auth: {
        he: 'אין חשבון ואין כניסה: הכול נשמר על המכשיר. גיבוי אפשרי דרך גיבוי המכשיר של מערכת ההפעלה, וייצוא CSV למי שרוצה לעבוד בגיליון.',
        en: 'No account and no sign-in: everything stays on the device. Backup is possible through the OS device backup, and a CSV export is there for anyone who prefers a spreadsheet.',
      },
      monetization: {
        he: ['קוד פתוח ברישיון מתירני, ממומן בתרומות ובחסויות', 'שירותי ייעוץ והטמעה לצוותים שרוצים לכייל הערכות בקנה מידה ארגוני'],
        en: ['Open source under a permissive licence, funded by donations and sponsorships', 'Consulting and onboarding for teams that want to calibrate estimates at organisation scale'],
      },
      mvpMilestones: {
        he: ['מודל נתונים מקומי: סוגי עבודה, הערכות ותוצאות', 'מסך הערכה חדשה וסיום משימה עם טיימר אופציונלי', 'חישוב מדד הפגיעה והטווח המכויל עם בדיקות יחידה', 'מסך כיול והיסטוריה, וייצוא CSV', 'תזכורות מקומיות וליטוש RTL'],
        en: ['Local data model: work kinds, estimates and outcomes', 'New-estimate and wrap-up screens with an optional timer', 'Hit-rate and calibrated-range maths with unit tests', 'Calibration and history screens, plus CSV export', 'Local reminders and RTL polish'],
      },
      risks: {
        he: ['בהתחלה יש מעט נתונים והכיול חלש; חייבים להראות בבירור על כמה משימות כל מספר מבוסס, אחרת האמון יישבר', 'תיעוד הזמן בפועל דורש משמעת – אם הוא מרגיש כמו מטלה, אנשים ינטשו אחרי שבוע', 'סוגי עבודה רחבים מדי מטשטשים את הכיול, ולכן צריך לעודד סוגים צרים'],
        en: ['There is little data at first and calibration is weak; each figure must clearly show how many tasks stand behind it, or trust breaks', 'Logging actual time takes discipline – if it feels like a chore, people drop off after a week', 'Work kinds that are too broad blur the calibration, so narrow kinds must be encouraged'],
      },
      expansion: {
        he: ['סנכרון מתארח אופציונלי בתשלום בין מכשירים', 'ייבוא משימות מיומן או ממעקב זמן קיים', 'תצוגת צוות אנונימית של דיוק הערכות לפני ספרינט'],
        en: ['Optional paid hosted sync across devices', 'Import tasks from a calendar or an existing time tracker', 'Anonymous team view of estimate accuracy ahead of a sprint'],
      },
    },
  },
  {
    id: 'sieve',
    name: { he: 'Sieve – מסנן קבוצת ההורים', en: 'Sieve' },
    tagline: {
      he: 'מדביקים הודעות מקבוצת הגן או הכיתה, ו-Sieve שולפת מהן מועדים, מה להביא ומה לשלם – ישר ליומן ולרשימה, בלי לגלול אחורה.',
      en: 'Paste messages from the kindergarten or class group and Sieve pulls out the dates, what to bring and what to pay – straight into your calendar and a checklist.',
    },
    category: 'productivity',
    secondaryCategories: ['lifestyle', 'ai'],
    difficulty: 'beginner',
    effort: { weeksMin: 2, weeksMax: 3 },
    budget: 'low',
    businessModel: 'subscription',
    platforms: ['ios', 'android'],
    audience: ['parents', 'consumers'],
    tags: ['parents', 'school', 'kindergarten', 'calendar', 'group chat', 'hebrew', 'llm', 'checklist', 'israel'],
    identity: { hue: 78, glyph: 'Si', pattern: 'diagonal' },
    flags: { beginnerFriendly: true, profitPotential: 'medium', experimental: false, trending: true, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'קבוצות ההורים של הגן והכיתה מלאות במידע שחשוב באמת – "ביום שלישי מגיעים בלבן", "לשלם 40 ש״ח לטיול עד חמישי", "הטיול נדחה ליום רביעי" – והוא שוקע בין עשרות הודעות. Sieve מקבלת טקסט שמדביקים מהקבוצה ומחזירה רשימה קצרה של שלושה סוגי פריטים: מועדים, דברים להביא ותשלומים. כל פריט מצורף לשורה המקורית שממנה נשלף, כך שאפשר לבדוק אותו במבט. כשהודעה מאוחרת מתקנת תאריך שכבר נשלף, Sieve מציגה את השינוי ("היה: שלישי, עכשיו: רביעי") ושואלת אם לעדכן את האירוע ביומן. שום דבר לא נכתב ליומן בלי אישור, ושמות הילדים מוחלפים בכינויים על המכשיר לפני שהטקסט נשלח לעיבוד.',
        en: 'Kindergarten and class parent groups are full of information that really matters – "Tuesday we all wear white", "pay 40 NIS for the trip by Thursday", "the trip moved to Wednesday" – and it sinks among dozens of messages. Sieve takes text you paste from the group and returns a short list of three kinds of items: dates, things to bring and payments. Each item is attached to the original line it came from, so you can check it at a glance. When a later message corrects a date that was already extracted, Sieve shows the change ("was: Tuesday, now: Wednesday") and asks whether to update the calendar event. Nothing is written to the calendar without your approval, and children’s names are swapped for aliases on the device before the text is sent for processing.',
      },
      problem: {
        he: 'מידע מהגן ומבית הספר מגיע בזרם של הודעות קצרות, וחלקן תיקונים להודעות קודמות. כדי לדעת מה להביא מחר צריך לגלול אחורה, להשוות תאריכים ולקוות שלא פספסתם עדכון. ההודעות כתובות בעברית יומיומית עם תאריכים יחסיים ("ביום ראשון הקרוב"), ולכן העתקה ליומן דורשת קריאה זהירה.',
        en: 'Information from the kindergarten and school arrives as a stream of short messages, some of them corrections to earlier ones. To know what to bring tomorrow you scroll back, compare dates and hope you did not miss an update. The messages are written in everyday Hebrew with relative dates ("this coming Sunday"), so copying them into a calendar takes careful reading.',
      },
      solution: {
        he: 'מדביקים, מקבלים רשימה לבדיקה, מאשרים. העיבוד מחזיר מבנה JSON קבוע מראש עם סוג, כותרת, תאריך ושעה אם קיימים, והציטוט המקורי. תאריכים יחסיים מחושבים לפי תאריך ההודעה, ואם אי אפשר להכריע מסומן "לא ברור" במקום ניחוש. פריטים מאושרים הופכים לאירועים ביומן עם תזכורת בערב שלפני, ולפריטי "להביא" ו"לשלם" נוצרת רשימת סימון.',
        en: 'Paste, get a list to review, approve. The processing returns a fixed JSON structure with a type, a title, a date and time when present, and the original quote. Relative dates are resolved against the date of the message, and when that is impossible the item is marked "unclear" instead of guessed. Approved items become calendar events with an alarm the evening before, and "bring" and "pay" items get a checklist.',
      },
      usp: {
        he: 'לא עוד צ׳אט עם בינה מלאכותית: Sieve עושה דבר צר אחד – הופכת הודעות קבוצה לפריטים שאפשר לבדוק מול הציטוט המקורי – ומזהה תיקונים, כך שהיומן שלכם נשאר מעודכן ולא רק מלא.',
        en: 'Not another AI chat: Sieve does one narrow thing – turns group messages into items you can check against the original quote – and it spots corrections, so your calendar stays up to date and not just full.',
      },
      targetUsers: {
        he: ['הורים לילדים בכמה מסגרות במקביל', 'סבים, סבתות ומטפלים שאוספים ילדים ורוצים לדעת מה צריך להביא', 'הורים חדשים בגן שעדיין לומדים את הקצב של הקבוצה'],
        en: ['Parents with children in several settings at once', 'Grandparents and carers who pick children up and want to know what to bring', 'New kindergarten parents still learning the rhythm of the group'],
      },
      coreFeatures: {
        he: [
          'הדבקת טקסט מהלוח וחילוץ מועדים, פריטים להבאה ותשלומים',
          'ציטוט מקור ליד כל פריט, ופריט שהעיבוד לא בטוח בו מסומן לבדיקה',
          'זיהוי תיקונים: הודעה חדשה שסותרת תאריך קיים מציעה עדכון של האירוע',
          'פענוח תאריכים יחסיים בעברית ("ביום ראשון הקרוב", "בשבוע הבא") לפי תאריך ההודעה',
          'כינויים לשמות ילדים וטשטוש מספרי טלפון על המכשיר לפני שליחה לעיבוד',
          'כתיבה ליומן עם תזכורת בערב שלפני, רק אחרי אישור',
          'רשימת סימון ל"להביא" ול"לשלם" עם סימון בוצע',
        ],
        en: [
          'Paste text from the clipboard and extract dates, things to bring and payments',
          'A source quote beside each item, with uncertain items flagged for review',
          'Correction detection: a new message that contradicts an existing date offers to update the event',
          'Resolving relative Hebrew dates ("this coming Sunday", "next week") against the message date',
          'Aliases for children’s names and phone-number masking on the device before anything is sent for processing',
          'Calendar writing with an alarm the evening before, only after approval',
          'A checklist for "bring" and "pay" items with a done mark',
        ],
      },
      screens: [
        { name: { he: 'הדבקה', en: 'Paste' }, description: { he: 'כפתור גדול אחד "הדבק מהלוח", תצוגה מקדימה של הטקסט אחרי הטשטוש וכפתור עיבוד.', en: 'One big "paste from clipboard" button, a preview of the text after masking and a process button.' } },
        { name: { he: 'בדיקה', en: 'Review' }, description: { he: 'רשימת פריטים לפי סוג, ומתחת לכל אחד הציטוט המקורי באפור; פריטים לא ברורים מסומנים ואפשר להשלים אותם ביד.', en: 'Items grouped by type, with the original quote in grey under each; unclear items are flagged and can be completed by hand.' } },
        { name: { he: 'שינויים', en: 'Changes' }, description: { he: 'השוואה של "היה" ו"עכשיו" לכל תאריך שהתעדכן, עם כפתורי עדכון או השארה.', en: 'A was-and-now comparison for every date that changed, with update or keep buttons.' } },
        { name: { he: 'השבוע', en: 'This week' }, description: { he: 'אירועים ורשימת סימון לשבוע הקרוב, מקובצים לפי יום, עם סימון בוצע.', en: 'Events and checklist items for the coming week, grouped by day, with a done mark.' } },
        { name: { he: 'כינויים', en: 'Aliases' }, description: { he: 'הגדרת שמות הילדים והכינויים שיחליפו אותם, והסבר קצר מה נשלח ומה נשאר במכשיר.', en: 'Setting up children’s names and the aliases that replace them, with a short explanation of what is sent and what stays on the device.' } },
        { name: { he: 'מנוי', en: 'Subscription' }, description: { he: 'מצב הניסיון והמנוי, שימוש החודש ושחזור רכישה.', en: 'Trial and subscription state, this month’s usage and restore purchase.' } },
      ],
      userJourney: {
        he: [
          'אמא לשני ילדים חוזרת בערב לקבוצת הגן ומעתיקה את ההודעות מהיומיים האחרונים',
          'היא מדביקה אותן ב-Sieve ומקבלת ארבעה פריטים, כל אחד עם ציטוט',
          'אחד הפריטים מסומן "לא ברור" כי ההודעה אומרת "בשבוע הבא" בלי יום, והיא משלימה אותו בעצמה',
          'היא מאשרת, והאירועים נכנסים ליומן עם תזכורת בערב שלפני',
          'למחרת מגיעה הודעה שמזיזה את הטיול ליום רביעי; Sieve מציעה לעדכן את האירוע והיא מאשרת בנגיעה',
        ],
        en: [
          'A mother of two returns to the kindergarten group in the evening and copies the last two days of messages',
          'She pastes them into Sieve and gets four items, each with a quote',
          'One item is flagged "unclear" because the message says "next week" with no day, and she fills it in herself',
          'She approves, and the events land in her calendar with an alarm the evening before',
          'The next day a message moves the trip to Wednesday; Sieve offers to update the event and she approves with a tap',
        ],
      },
      uxDirection: {
        he: 'חם ופשוט, כי משתמשים בו בערב עם ילד על הברכיים: כפתור גדול אחד להדבקה, ורשימת בדיקה עם ציטוטים באפור מתחת לכל פריט. שלושת סוגי הפריטים נבדלים באייקון ובגוון עדין אחד לכל סוג. RTL כברירת מחדל, וימי השבוע בכתיב עברי (יום ג׳) במקום קיצורים לועזיים.',
        en: 'Warm and simple, because it is used in the evening with a child on your lap: one big paste button and a review list with grey quotes under each item. The three item types differ by icon and one soft tint each. RTL by default, with weekdays in Hebrew form (יום ג׳) rather than foreign abbreviations.',
      },
      architecture: {
        he: 'Expo עם Expo Router ונתונים ב-expo-sqlite על המכשיר. ההדבקה נעשית דרך expo-clipboard; לפני השליחה רצה על המכשיר פונקציה שמחליפה שמות ילדים שהוגדרו ומספרי טלפון בסימנים. הטקסט המוסווה נשלח ל-Edge Function של Supabase שקוראת למודל שפה עם סכמת JSON קשיחה ומחזירה פריטים; הפונקציה לא שומרת את גוף ההודעות ולא רושמת אותו בלוגים, ובוחרים ספק מודל עם תנאי שמירת נתונים מינימליים. כתיבה ליומן דרך expo-calendar עם התראה בערב שלפני האירוע. מכסת שימוש נאכפת בפונקציה לפי מזהה אנונימי של RevenueCat, שמנהלת גם את המנוי.',
        en: 'Expo with Expo Router and data in expo-sqlite on the device. Pasting goes through expo-clipboard; before anything is sent, a function on the device replaces the children’s names you defined and phone numbers with placeholders. The masked text goes to a Supabase Edge Function that calls a language model with a strict JSON schema and returns items; the function does not store message bodies or write them to logs, and a model provider with minimal data-retention terms is chosen. Calendar writing uses expo-calendar with an alarm the evening before the event. A usage quota is enforced in the function by RevenueCat’s anonymous user id, and RevenueCat also manages the subscription.',
      },
      stack: ['Expo', 'Expo Router', 'expo-sqlite', 'expo-calendar', 'expo-clipboard', 'Supabase', 'Supabase Edge Functions', 'Anthropic or OpenAI API', 'RevenueCat'],
      database: {
        he: ['batches – תאריך הדבקה וסטטוס, בלי שמירה של הטקסט הגולמי כברירת מחדל', 'items – סוג (מועד/להביא/תשלום), כותרת, תאריך, ציטוט מקור, סטטוס אישור', 'kid_aliases – שם אמיתי וכינוי, נשמר רק במכשיר', 'calendar_links – פריט ומזהה האירוע ביומן', 'usage_counters – מזהה אנונימי, חודש וספירה, בשרת וללא תוכן'],
        en: ['batches – paste date and status, with the raw text not kept by default', 'items – type (date/bring/payment), title, date, source quote, approval status', 'kid_aliases – real name and alias, stored on the device only', 'calendar_links – item and the calendar event id', 'usage_counters – anonymous id, month and count, on the server with no content'],
      },
      auth: {
        he: 'בלי הרשמה: האפליקציה משתמשת במזהה אנונימי של RevenueCat שמשמש למכסה ולמנוי בלבד. אין פרופיל, אין גישה לאנשי קשר ואין חיבור לקבוצות; המשתמשים בוחרים בעצמם מה להדביק.',
        en: 'No sign-up: the app uses an anonymous RevenueCat id that serves only the quota and the subscription. There is no profile, no contacts access and no connection to the groups; users choose what to paste themselves.',
      },
      monetization: {
        he: ['מנוי שנתי עם שבוע ניסיון, מנוהל ב-RevenueCat', 'מנוי חודשי לעונת הלימודים למי שלא רוצה להתחייב לשנה'],
        en: ['Yearly subscription with a one-week trial, managed in RevenueCat', 'Monthly subscription for the school season for anyone who does not want a yearly commitment'],
      },
      mvpMilestones: {
        he: ['מסך הדבקה, כינויים וטשטוש מספרי טלפון על המכשיר', 'Edge Function עם סכמת JSON ובדיקה על הודעות לדוגמה שנכתבו ידנית', 'מסך בדיקה עם ציטוטי מקור וכתיבה ליומן', 'זיהוי תיקונים ומסך השינויים', 'מנוי ב-RevenueCat ומכסת שימוש'],
        en: ['Paste screen, aliases and phone-number masking on the device', 'Edge Function with the JSON schema, tested on hand-written sample messages', 'Review screen with source quotes and calendar writing', 'Correction detection and the Changes screen', 'RevenueCat subscription and usage quota'],
      },
      risks: {
        he: ['מודל שפה עלול לטעות בתאריך, ולכן שום דבר לא נכתב ליומן בלי אישור והציטוט תמיד גלוי', 'הודעות קבוצה כוללות פרטים של אנשים אחרים – הטשטוש על המכשיר והבהרה למשתמשים מה נשלח הם חלק מהמוצר', 'עלות הקריאות למודל עלולה לצמצם את המרווח במנוי זול, ולכן כדאי למדוד עלות לכל הדבקה מוקדם'],
        en: ['A language model can get a date wrong, so nothing is written to the calendar without approval and the quote is always visible', 'Group messages include other people’s details – masking on the device and telling users exactly what is sent are part of the product', 'Model-call costs can squeeze the margin on a cheap subscription, so cost per paste should be measured early'],
      },
      expansion: {
        he: ['ייבוא קובץ ייצוא צ׳אט במקום הדבקה ידנית', 'ווידג׳ט "מה להביא מחר" במסך הבית', 'שיתוף רשימת הסימון עם בן או בת הזוג'],
        en: ['Import a chat export file instead of manual pasting', 'A "what to bring tomorrow" home-screen widget', 'Share the checklist with a partner'],
      },
    },
  },
  {
    id: 'headroom',
    name: { he: 'Headroom – כמה באמת יש לנו השבוע', en: 'Headroom' },
    tagline: {
      he: 'מחשבים קיבולת צוות לפי לוח השנה הישראלי – חגים, ערבי חג, פגרות והיעדרויות – ומשווים אותה למה שהתחייבתם לספק בכל שבוע.',
      en: 'Work out team capacity from the Israeli calendar – holidays, eves, school breaks and absences – and compare it with what you committed to deliver each week.',
    },
    category: 'productivity',
    secondaryCategories: ['business', 'devtools'],
    difficulty: 'intermediate',
    effort: { weeksMin: 6, weeksMax: 8 },
    budget: 'low',
    businessModel: 'b2b',
    platforms: ['web'],
    audience: ['teams', 'businesses'],
    tags: ['capacity', 'planning', 'israel', 'hebrew calendar', 'holidays', 'sprint', 'team', 'google calendar', 'rtl'],
    identity: { hue: 240, glyph: 'Hr', pattern: 'wave' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'כלי תכנון רבים מניחים שכל שבוע הוא חמישה ימי עבודה מלאים של שמונה שעות. בישראל זה לעיתים קרובות לא כך: שבוע העבודה מתחיל בראשון, יום שישי קצר או חופשי, ערבי חג מסתיימים מוקדם, וחופשות בית הספר משנות את הזמינות של הורים בצוות. Headroom בונה לכל שבוע את הקיבולת האמיתית של הצוות מלוח השנה העברי והישראלי, מימי "לא זמין" שחברי הצוות מסמנים בלי לציין סיבה, ומעומס הפגישות שנקרא מהיומן, ומשווה אותה למה שהצוות התחייב לספק בשעות. התוצאה היא מספר אחד לשבוע – כמה מרווח נשאר – וגם תשובה לשאלה "מה יחליק אם דנה תיעדר ביום חמישי". סיכום מקדים מגיע במייל לפני תכנון השבוע.',
        en: 'Many planning tools assume every week is five full eight-hour days. In Israel that is often not so: the working week starts on Sunday, Friday is short or free, holiday eves end early, and school breaks change the availability of parents on the team. Headroom builds each week’s real team capacity from the Hebrew and Israeli calendar, from "unavailable" days that team members mark without giving a reason, and from meeting load read from the calendar, and compares it with what the team committed to deliver in hours. The result is one number per week – how much headroom is left – and an answer to "what slips if Dana is out on Thursday". A preview summary arrives by email before the week is planned.',
      },
      problem: {
        he: 'צוותים מתחייבים לספרינט או לרבעון לפי קיבולת גנרית, ואז מגלים שחג, ימי היעדרות וחופשת בית ספר אכלו חלק גדול מהשבוע. את החישוב עושים בראש או בגיליון שמישהו מעדכן ביד, ובקצוות – ערב חג, יום שישי, מילואים – נכנסות טעויות. חברי צוות לא תמיד מרגישים בנוח להסביר למה הם לא זמינים, וזה פוגע בתכנון.',
        en: 'Teams commit to a sprint or a quarter against generic capacity, then discover that a holiday, absences and a school break ate a large part of the week. The sum is done in someone’s head or in a spreadsheet updated by hand, and errors creep in at the edges – a holiday eve, a Friday, reserve duty. Team members do not always feel comfortable explaining why they are unavailable, and that hurts planning.',
      },
      solution: {
        he: 'Headroom מחשבת קיבולת שבועית מארבעה מקורות: דפוס עבודה לכל אדם, חגים וערבי חג מספרייה פתוחה, ימי "לא זמין" בלי סיבה, ועומס פגישות מנתוני פנוי/תפוס של היומן. הצוות מזין התחייבויות בשעות, ו-Headroom מציגה את המרווח ומדמה היעדרות של אדם אחד. מי שרוצה מפעיל מייל סיכום שבועי.',
        en: 'Headroom computes weekly capacity from four sources: a working pattern for each person, holidays and holiday eves from an open-source library, "unavailable" days with no reason, and meeting load from calendar free/busy data. The team enters commitments in hours, and Headroom shows the headroom and simulates one person’s absence. A weekly summary email can be switched on.',
      },
      usp: {
        he: 'כלי קיבולת שבנוי סביב הלוח העברי והשבוע הישראלי, ושומר על פרטיות: מנהלים רואים "לא זמין" ולעולם לא סיבה, ואין צורך לתת גישה לתוכן היומן – רק לפנוי/תפוס.',
        en: 'A capacity tool built around the Hebrew calendar and the Israeli week, and careful with privacy: managers see "unavailable" and never a reason, and there is no need to grant access to calendar content – only free/busy.',
      },
      targetUsers: {
        he: ['צוותי פיתוח ומוצר ישראליים של חמישה עד ארבעים אנשים', 'סטודיואים וסוכנויות עם לקוחות בחו״ל ושבוע עבודה מעורב', 'מנהלי פרויקטים שמתכננים ספרינטים סביב החגים'],
        en: ['Israeli product and engineering teams of five to forty people', 'Studios and agencies with clients abroad and a mixed working week', 'Project managers planning sprints around the holidays'],
      },
      coreFeatures: {
        he: [
          'דפוס עבודה אישי: ימים, שעות, ויום שישי קצר או מלא',
          'חגים וערבי חג מהלוח העברי, עם שעות מקוצרות שאפשר לערוך',
          'ימי "לא זמין" שמסומנים ללא סיבה ונראים לצוות רק ככאלה',
          'עומס פגישות מנתוני פנוי/תפוס של Google Calendar, בלי גישה לתוכן',
          'התחייבויות בשעות לכל שבוע והשוואה לקיבולת',
          'סימולציה "מה יחליק אם מישהו נעדר", לפי סדר העדיפויות של הצוות',
          'מייל סיכום לפני תכנון השבוע, ולוח פגרות בית ספר שהצוות מעדכן ידנית',
        ],
        en: [
          'A personal working pattern: days, hours, and a short or full Friday',
          'Holidays and holiday eves from the Hebrew calendar, with shortened hours that can be edited',
          '"Unavailable" days marked with no reason and shown to the team only as such',
          'Meeting load from Google Calendar free/busy data, with no access to content',
          'Commitments in hours per week, compared with capacity',
          'A "what slips if someone is out" simulation, following the team’s priority order',
          'A summary email before the week is planned, and a school-break calendar the team maintains by hand',
        ],
      },
      screens: [
        { name: { he: 'השבוע', en: 'This week' }, description: { he: 'פס אופקי לכל אדם עם ימי השבוע, חגים כרצועות רקע עדינות והמרווח של הצוות כמספר אחד גדול.', en: 'One horizontal bar per person across the week, holidays as soft background bands and the team’s headroom as one big number.' } },
        { name: { he: 'הצוות', en: 'Team' }, description: { he: 'חברי הצוות עם דפוס עבודה, שעות בשבוע וחיבור יומן; מי שלא חיבר יומן מזין עומס פגישות ידנית.', en: 'Team members with working pattern, weekly hours and calendar connection; anyone without a connection enters meeting load by hand.' } },
        { name: { he: 'התחייבויות', en: 'Commitments' }, description: { he: 'רשימת התחייבויות בשעות לשבוע, עם בעלים וסדר עדיפויות שנגרר ומשתנה.', en: 'A list of commitments in hours for the week, with owner and a draggable priority order.' } },
        { name: { he: 'מה אם', en: 'What if' }, description: { he: 'בוחרים אדם ויום ורואים איזה פריט יורד ראשון מהתוכנית ובכמה המרווח משתנה.', en: 'Pick a person and a day and see which item drops off the plan first and how much the headroom changes.' } },
        { name: { he: 'חגים ופגרות', en: 'Holidays and breaks' }, description: { he: 'לוח השנה של השנה עם חגים ממאגר פתוח ופגרות בית ספר שהצוות מוסיף, כולל מקדם שעות לכל יום.', en: 'The year’s calendar with holidays from an open library and school breaks the team adds, including an hours factor for each day.' } },
        { name: { he: 'הגדרות ומנוי', en: 'Settings and billing' }, description: { he: 'מייל הסיכום, שפה, אזור זמן ותשלום הצוות.', en: 'Summary email, language, time zone and team billing.' } },
      ],
      userJourney: {
        he: [
          'ראש צוות פיתוח פותחת את Headroom ביום חמישי לפני תכנון השבוע הבא',
          'השבוע שאחרי כולל ערב חג וכמה ימי "לא זמין", והמרווח מוצג בכתום',
          'היא מזינה התחייבויות של 120 שעות מול קיבולת של 98 ורואה את הפער',
          'היא מריצה "מה אם" על היעדרות של המפתח הבכיר ורואה איזו משימה יורדת ראשונה לפי העדיפויות',
          'היא מורידה פריט מהתוכנית לפני שהוא נשבר, ובשבוע שאחרי המרווח חוזר לירוק',
        ],
        en: [
          'A development team lead opens Headroom on Thursday before planning the next week',
          'The coming week includes a holiday eve and several "unavailable" days, and the headroom is shown in amber',
          'She enters commitments of 120 hours against a capacity of 98 and sees the gap',
          'She runs "what if" on the senior developer being out and sees which task drops off first by priority',
          'She removes an item from the plan before it breaks, and the following week the headroom is green again',
        ],
      },
      uxDirection: {
        he: 'ווב קליל, עברית ב-RTL כברירת מחדל ואנגלית ב-LTR מלאה לצוותים מעורבים. מסך השבוע הוא פס אופקי לכל אדם עם ימים, וחגים כרצועות רקע עדינות; המרווח מוצג כמספר גדול אחד בצבע אחד. בשום מקום בממשק לא מופיעה סיבת היעדרות, ואין תצוגה שמדרגת אנשים.',
        en: 'Lightweight web, Hebrew in RTL by default and full English in LTR for mixed teams. The week screen is one horizontal bar per person across the days, with holidays as soft background bands; headroom is a single large number in a single colour. No reason for an absence appears anywhere in the interface, and no view ranks people.',
      },
      architecture: {
        he: 'Next.js עם TypeScript ו-Supabase (Postgres ו-Auth) עם RLS לפי צוות. חישוב הקיבולת הוא פונקציה טהורה שמקבלת דפוס עבודה, חגים ולוח היעדרויות ומחזירה שעות לפי יום; החגים מגיעים מהספרייה הפתוחה @hebcal/core, ופגרות בית הספר הן טבלה שהצוות מעדכן ידנית. עומס הפגישות נקרא מ-Google Calendar API בהרשאת פנוי/תפוס בלבד. תשלום ומנויים דרך Stripe, ומייל הסיכום השבועי נשלח ב-Resend בהפעלה של cron ב-Supabase.',
        en: 'Next.js with TypeScript and Supabase (Postgres and Auth) with per-team RLS. Capacity is a pure function that takes a working pattern, holidays and an absence calendar and returns hours per day; holidays come from the open-source @hebcal/core library, and school breaks are a table the team maintains by hand. Meeting load is read from the Google Calendar API with free/busy permission only. Payment and subscriptions go through Stripe, and the weekly summary email is sent with Resend, triggered by a Supabase cron job.',
      },
      stack: ['Next.js', 'TypeScript', 'Supabase', 'Supabase Auth', '@hebcal/core', 'Google Calendar API', 'Stripe', 'Resend'],
      database: {
        he: ['teams – שם, אזור זמן, תבנית שבוע ברירת מחדל', 'members – צוות, תפקיד, שעות בשבוע, דפוס עבודה', 'away_blocks – חבר צוות, טווח תאריכים, "לא זמין" בלבד וללא סיבה', 'holiday_overrides – תאריך, שם, מקדם שעות', 'commitments – צוות, שבוע, תיאור, שעות, בעלים, עדיפות', 'calendar_connections – חבר צוות, אסימון מוצפן, סנכרון אחרון', 'subscriptions – צוות ומצב Stripe'],
        en: ['teams – name, time zone, default week template', 'members – team, role, weekly hours, working pattern', 'away_blocks – team member, date range, "unavailable" only with no reason', 'holiday_overrides – date, name, hours factor', 'commitments – team, week, description, hours, owner, priority', 'calendar_connections – team member, encrypted token, last sync', 'subscriptions – team and Stripe status'],
      },
      auth: {
        he: 'אימייל עם קישור קסם או כניסה עם Google; חיבור היומן הוא הסכמה נפרדת בהרשאת פנוי/תפוס בלבד. מנהלי צוות רואים "לא זמין" ולא סיבות, ו-RLS מגביל כל טבלה לחברי הצוות.',
        en: 'Email magic link or Google sign-in; connecting the calendar is a separate consent with free/busy permission only. Team managers see "unavailable" and never reasons, and RLS limits every table to team members.',
      },
      monetization: {
        he: ['מנוי חודשי לצוות לפי מספר חברים, עם שבועיים ניסיון בחינם', 'תוכנית שנתית עם הנחה לסוכנויות ולמשרדים שמנהלים כמה צוותים'],
        en: ['Monthly per-team subscription by member count, with a two-week free trial', 'Yearly plan with a discount for agencies and firms running several teams'],
      },
      mvpMilestones: {
        he: ['מודל צוות ודפוסי עבודה וחישוב קיבולת שבועית עם חגים מ-Hebcal', 'ימי "לא זמין" והתחייבויות בשעות, עם מסך השבוע', 'חיבור פנוי/תפוס מ-Google Calendar לעומס פגישות', 'סימולציית "מה אם" ולוח פגרות ידני', 'Stripe, מייל סיכום שבועי וליטוש RTL'],
        en: ['Team model, working patterns and weekly capacity calculation with Hebcal holidays', '"Unavailable" days and commitments in hours, with the week screen', 'Google Calendar free/busy connection for meeting load', 'The "what if" simulation and a manual school-break calendar', 'Stripe, the weekly summary email and RTL polish'],
      },
      risks: {
        he: ['אישור אפליקציה של Google להרשאות יומן דורש תהליך אימות, ולכן כדאי להתחיל בו מוקדם ובינתיים להסתמך על הזנה ידנית', 'פגרות ושעות מקוצרות משתנות בין ארגונים ובין שנים – הן חייבות להיות ניתנות לעריכה ולא מוטמעות בקוד', 'קיבולת מחושבת עלולה להפוך לכלי שליטה; ההקפדה על "לא זמין" בלי סיבה היא חלק מהמוצר'],
        en: ['Google’s app verification for calendar permissions takes a review process, so start it early and rely on manual entry in the meantime', 'School breaks and shortened hours differ between organisations and years – they must be editable, not hard-coded', 'Computed capacity can turn into a control tool; insisting on "unavailable" with no reason is part of the product'],
      },
      expansion: {
        he: ['תמיכה בחגים של מדינות נוספות לצוותים בין-לאומיים', 'ייבוא התחייבויות מ-Jira או Linear', 'חיבור ל-Microsoft 365 בנוסף ל-Google'],
        en: ['Holidays of other countries for international teams', 'Import commitments from Jira or Linear', 'Microsoft 365 connection in addition to Google'],
      },
    },
  },
  {
    id: 'preflight',
    name: { he: 'Preflight – שאלות ההמשך מראש', en: 'Preflight' },
    tagline: {
      he: 'מדביקים טיוטה של מייל חשוב, ו-Preflight מנחשת אילו שאלות הנמען יחזיר – כדי שתענו עליהן עוד לפני השליחה.',
      en: 'Paste a draft of an important email and Preflight predicts the follow-up questions the reader may send back, so you can answer them before sending.',
    },
    category: 'productivity',
    secondaryCategories: ['ai', 'business'],
    difficulty: 'intermediate',
    effort: { weeksMin: 4, weeksMax: 6 },
    budget: 'medium',
    businessModel: 'freemium',
    platforms: ['web'],
    audience: ['professionals', 'businesses'],
    tags: ['email', 'writing', 'llm', 'communication', 'async', 'clarity', 'follow-up', 'hebrew', 'proposals'],
    identity: { hue: 355, glyph: 'Pv', pattern: 'grid' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: true, trending: true, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'לפני ששולחים מייל חשוב – בקשת תקציב, הצעה ללקוח, תגובה למנהל – מדביקים אותו ב-Preflight ומציינים מי הנמען ומה רוצים שיקרה: "אישור עד יום חמישי". Preflight קוראת את הטיוטה מנקודת המבט של הקורא ומחזירה עד חמש שאלות המשך סבירות, כל אחת צמודה למשפט בטיוטה שמעורר אותה: "כמה זה עולה בדיוק?", "מי מאשר את זה אצלכם?". בנוסף היא בודקת שלושה דברים פשוטים: האם יש בקשה ברורה, האם יש מועד, והאם ברור מי צריך לפעול. Preflight לא כותבת במקומכם ולא ממציאה עובדות; היא משאירה סימונים שבהם אתם משלימים את התשובה. אחרי השליחה אפשר לסמן אילו מהשאלות חזרו בפועל, והיסטוריה זו מכווננת את ההצעות הבאות לאותו סוג נמען.',
        en: 'Before you send an important email – a budget request, a proposal to a client, a reply to a manager – you paste it into Preflight and say who the reader is and what you want to happen: "approval by Thursday". Preflight reads the draft from the reader’s point of view and returns up to five plausible follow-up questions, each tied to the sentence in the draft that triggers it: "How much exactly?", "Who approves this on your side?". It also checks three simple things: is there a clear ask, is there a date, and is it clear who has to act. Preflight does not write for you and does not invent facts; it leaves markers where you fill in the answer. After sending you can mark which questions actually came back, and that history tunes later suggestions for the same kind of reader.',
      },
      problem: {
        he: 'הודעות חשובות נשלחות לעיתים קרובות עם פער קטן – מועד חסר, סכום לא ברור, גורם מאשר שלא הוזכר – והתוצאה היא סבב נוסף של שאלות שעולה ימים. הכותב מכיר את ההקשר טוב מדי מכדי לראות את הפער, וקורא שני לא תמיד זמין. בדיקות איות ותיקוני סגנון לא מזהים פער במידע.',
        en: 'Important messages are often sent with a small gap – a missing date, an unclear amount, an approver who is never mentioned – and the result is another round of questions that costs days. The writer knows the context too well to see the gap, and a second reader is not always around. Spell-checkers and style fixers do not detect missing information.',
      },
      solution: {
        he: 'קלט של טיוטה, תפקיד הנמען והתוצאה הרצויה. פלט: שאלות המשך מדורגות שכל אחת מקושרת למשפט, בדיקת בקשה-מועד-אחראי, וסימוני השלמה בטיוטה. כתובות מייל, מספרי טלפון ומספרי זהות מטושטשים בדפדפן לפני השליחה למודל. אפשר לשמור תפקידי נמענים, ולסמן אחרי השליחה אילו שאלות חזרו.',
        en: 'Input is a draft, the reader’s role and the desired outcome. Output is ranked follow-up questions each linked to a sentence, an ask-date-owner check, and fill-in markers in the draft. Email addresses, phone numbers and ID numbers are masked in the browser before anything goes to the model. Reader roles can be saved, and after sending you can mark which questions came back.',
      },
      usp: {
        he: 'לא עורך סגנון ולא כותב מיילים: Preflight מדמה את הקורא ומצביעה על מה שחסר, ואת התשובות אתם מביאים. ההצעות מתכווננות לפי ההיסטוריה שאתם מסמנים בעצמכם.',
        en: 'Not a style editor and not an email writer: Preflight simulates the reader and points at what is missing, while you bring the answers. Suggestions are tuned by the history you mark yourself.',
      },
      targetUsers: {
        he: ['עצמאים ובעלי עסקים קטנים ששולחים הצעות ובקשות ללקוחות', 'מנהלי מוצר ופרויקטים שצריכים אישורים מגורמים בכירים', 'דוברי עברית שכותבים באנגלית ורוצים לוודא שההודעה שלמה'],
        en: ['Freelancers and small-business owners sending proposals and requests to clients', 'Product and project managers who need approvals from senior people', 'Hebrew speakers writing in English who want to be sure a message is complete'],
      },
      coreFeatures: {
        he: [
          'הדבקת טיוטה בעברית או באנגלית, עם בחירת תפקיד הנמען והתוצאה הרצויה',
          'עד חמש שאלות המשך סבירות, כל אחת מקושרת למשפט שמעורר אותה',
          'בדיקת בקשה-מועד-אחראי: מה חסר כדי שהנמען ידע מה לעשות',
          'סימוני השלמה בטיוטה במקום תשובות שהמודל ממציא',
          'טשטוש מיילים, טלפונים ומספרי זהות בדפדפן לפני השליחה למודל',
          'יומן תוצאות: סימון אילו שאלות חזרו בפועל והתאמת ההצעות לסוג הנמען',
          'שמירת טיוטות ותוצאות רק אם בחרתם בכך',
        ],
        en: [
          'Paste a draft in Hebrew or English, choosing the reader’s role and the desired outcome',
          'Up to five plausible follow-up questions, each linked to the sentence that triggers it',
          'An ask-date-owner check: what is missing for the reader to know what to do',
          'Fill-in markers in the draft instead of answers the model invents',
          'Masking of emails, phone numbers and ID numbers in the browser before anything goes to the model',
          'Outcome log: mark which questions actually came back and tune suggestions to the type of reader',
          'Drafts and results saved only if you choose to',
        ],
      },
      screens: [
        { name: { he: 'טיוטה', en: 'Draft' }, description: { he: 'שדה טקסט גדול, בורר תפקיד הנמען, שורת "מה אני רוצה שיקרה" וכפתור בדיקה.', en: 'A large text field, a reader-role picker, a "what I want to happen" line and a check button.' } },
        { name: { he: 'שאלות', en: 'Questions' }, description: { he: 'שאלות ההמשך כרשימה מדורגת; מעבר על שאלה מדגיש בצבע את המשפט המעורר בטיוטה.', en: 'Follow-up questions as a ranked list; hovering over one highlights the triggering sentence in the draft.' } },
        { name: { he: 'השלמות', en: 'Fill-ins' }, description: { he: 'הטיוטה עם סימונים להשלמה, כמו [סכום?] ו-[מי מאשר?], ושדה קצר לכל סימון.', en: 'The draft with fill-in markers such as [amount?] and [who approves?], and a short field for each marker.' } },
        { name: { he: 'תפקידי נמענים', en: 'Reader roles' }, description: { he: 'תפקידים שמורים כמו מנהלת כספים או בעל דירה, עם הערות סגנון והשאלות שחזרו הכי הרבה.', en: 'Saved roles such as finance manager or landlord, with style notes and the questions that came back most often.' } },
        { name: { he: 'יומן תוצאות', en: 'Outcome log' }, description: { he: 'רשימת בדיקות שנשלחו, ולכל אחת סימון אילו שאלות חזרו ואילו שאלות חדשות הגיעו.', en: 'A list of sent checks, each with a mark of which questions came back and which new ones arrived.' } },
        { name: { he: 'חשבון ותוכנית', en: 'Account and plan' }, description: { he: 'שימוש השבוע, שדרוג ל-Pro והגדרות פרטיות ומחיקה.', en: 'This week’s usage, upgrade to Pro, and privacy and deletion settings.' } },
      ],
      userJourney: {
        he: [
          'יועץ עצמאי מדביק הצעת מחיר ללקוח חדש ומציין "מנהלת כספים, רוצה אישור עד יום חמישי"',
          'Preflight מחזירה ארבע שאלות, ביניהן "האם המחיר כולל מע״מ?" שמקושרת למשפט עם הסכום',
          'הוא מוסיף משפט הבהרה על מע״מ ומציין תנאי תשלום, ובודק שהבקשה והמועד נשארו ברורים',
          'אחרי השליחה הוא מסמן שהלקוחה שאלה על לוח זמנים, שאלה שלא הוצעה',
          'בפעם הבאה שהוא כותב למנהלת כספים, שאלות לוח זמנים מופיעות גבוה ברשימה',
        ],
        en: [
          'A freelance consultant pastes a quote for a new client and notes "finance manager, wants approval by Thursday"',
          'Preflight returns four questions, among them "Does the price include VAT?" linked to the sentence with the amount',
          'He adds a sentence clarifying VAT and payment terms, and checks that the ask and the date remain clear',
          'After sending, he marks that the client asked about the schedule, a question that was not suggested',
          'The next time he writes to a finance manager, schedule questions appear higher on the list',
        ],
      },
      uxDirection: {
        he: 'טיפוגרפי ונקי, בלי סמל רובוט ובלי שיחה – זה כלי בדיקה ולא צ׳אט. בדסקטופ הטיוטה בצד אחד והשאלות בצד השני, כשמעבר על שאלה מדגיש בצבע את המשפט המעורר. במובייל מחליפים בין לשוניות. השאלות מנוסחות כהשערות ("ייתכן שישאלו"), לא כעובדות.',
        en: 'Typographic and clean, with no robot icon and no conversation – this is a checking tool, not a chat. On desktop the draft sits on one side and the questions on the other, and hovering over a question highlights the triggering sentence. On mobile you switch between tabs. Questions are worded as hypotheses ("they may ask"), not as facts.',
      },
      architecture: {
        he: 'Next.js עם TypeScript ו-Supabase Auth ו-Postgres. מסלול API בצד השרת מקבל את הטיוטה אחרי הטשטוש בדפדפן ושולח אותה למודל שפה עם הנחיה שדורשת פלט JSON: שאלות, המשפט המעורר ובדיקת בקשה-מועד-אחראי. הטיוטה לא נשמרת אלא אם המשתמש לוחץ שמירה, ואין רישום של גוף הטיוטה בלוגים. יומן התוצאות נשמר ב-Postgres, ושלוש התוצאות האחרונות לכל תפקיד נמען נכנסות כדוגמאות להנחיה הבאה. מכסות ותשלום דרך Stripe, עם הגבלת קצב לפי משתמש כדי לשלוט בעלות.',
        en: 'Next.js with TypeScript and Supabase Auth and Postgres. A server-side API route receives the draft after masking in the browser and sends it to a language model with a prompt that demands JSON output: questions, the triggering sentence and the ask-date-owner check. The draft is not stored unless the user presses save, and draft bodies are not written to logs. The outcome log lives in Postgres, and the last three outcomes for each reader role go in as examples in the next prompt. Quotas and payment go through Stripe, with per-user rate limiting to control cost.',
      },
      stack: ['Next.js', 'TypeScript', 'Supabase', 'Supabase Auth', 'Anthropic or OpenAI API', 'Stripe'],
      database: {
        he: ['profiles – משתמש, שפה, תוכנית', 'recipient_roles – שם תפקיד, הערות סגנון', 'checks – תפקיד, תוצאה רצויה, תאריך, בלי גוף הטיוטה כברירת מחדל', 'questions – בדיקה, טקסט השאלה, משפט מעורר, האם חזרה בפועל', 'saved_drafts – טיוטות שנשמרו במפורש', 'usage – משתמש, שבוע, מספר בדיקות'],
        en: ['profiles – user, language, plan', 'recipient_roles – role name, style notes', 'checks – role, desired outcome, date, with no draft body by default', 'questions – check, question text, triggering sentence, whether it came back', 'saved_drafts – drafts saved explicitly', 'usage – user, week, number of checks'],
      },
      auth: {
        he: 'אימייל עם קישור קסם או כניסה עם Google. טיוטות עלולות להיות רגישות, ולכן הן לא נשמרות כברירת מחדל וכל הטבלאות מוגנות ב-RLS לפי משתמש.',
        en: 'Email magic link or Google sign-in. Drafts can be sensitive, so they are not stored by default and every table is protected by per-user RLS.',
      },
      monetization: {
        he: ['חינם: חמש בדיקות בשבוע', 'Pro חודשי או שנתי דרך Stripe לבדיקות ללא מגבלה מעשית ולשמירת תפקידי נמענים', 'מסלול צוות שבו ארגון מגדיר תפקידי נמענים משותפים'],
        en: ['Free: five checks a week', 'Monthly or yearly Pro through Stripe for no practical limit on checks and saved reader roles', 'A team plan where an organisation defines shared reader roles'],
      },
      mvpMilestones: {
        he: ['טופס טיוטה וטשטוש בדפדפן', 'מסלול API והנחיה עם פלט JSON וקישור שאלה למשפט', 'מסכי שאלות והשלמות, ובדיקה על טיוטות לדוגמה בעברית ובאנגלית', 'יומן תוצאות והזנת דוגמאות להנחיה', 'Stripe, מכסות והגבלת קצב'],
        en: ['Draft form and masking in the browser', 'API route and prompt with JSON output and question-to-sentence linking', 'Questions and fill-ins screens, tested on sample drafts in Hebrew and English', 'Outcome log and feeding examples into the prompt', 'Stripe, quotas and rate limiting'],
      },
      risks: {
        he: ['שאלות לא רלוונטיות פוגעות באמון במהירות; צריך קבוצת טיוטות לבדיקה והערכה ידנית לפני השקה', 'משתמשים עלולים לסמוך על הכלי במקום לחשוב על הקורא, ולכן הממשק מציג את השאלות כהשערות', 'טיוטות מסחריות רגישות – נדרשים בחירת ספק מודל, מדיניות שימוש בנתונים ודרך מחיקה ברורה, ועלות כל בדיקה צריכה להישאר מתחת למחיר המנוי'],
        en: ['Irrelevant questions erode trust quickly; a set of test drafts and manual evaluation are needed before launch', 'Users may lean on the tool instead of thinking about the reader, so the interface presents questions as hypotheses', 'Business drafts are sensitive – a model provider, a data-use policy and a clear deletion path are required, and the cost of each check must stay under the subscription price'],
      },
      expansion: {
        he: ['תוסף ל-Gmail ול-Outlook שמריץ בדיקה בלחיצה לפני שליחה', 'ספריית תפקידי נמענים משותפת לצוות', 'השוואה בין השאלות שחזרו לשאלות שנחזו, לאורך זמן'],
        en: ['A Gmail and Outlook add-on that runs a check with one click before sending', 'A shared reader-role library for a team', 'A comparison over time between questions that came back and questions that were predicted'],
      },
    },
  },
  {
    id: 'pledge',
    name: { he: 'Pledge – ההבטחות שכתבתם בדרך', en: 'Pledge' },
    tagline: {
      he: 'הרחבה לדפדפן שמזהה "אשלח לך עד יום חמישי" ברגע השליחה ושומרת את זה כהתחייבות עם תאריך – בלי להעתיק דבר לרשימה.',
      en: 'A browser extension that spots "I’ll send it by Thursday" the moment you hit send and saves it as a dated commitment – no copying anything into a list.',
    },
    category: 'productivity',
    secondaryCategories: ['business'],
    difficulty: 'intermediate',
    effort: { weeksMin: 5, weeksMax: 7 },
    budget: 'low',
    businessModel: 'one-time',
    platforms: ['web'],
    audience: ['professionals', 'businesses'],
    tags: ['email', 'browser extension', 'commitments', 'follow-up', 'gmail', 'outlook', 'hebrew', 'privacy', 'reminders'],
    identity: { hue: 135, glyph: 'Pg', pattern: 'dots' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Pledge היא הרחבה לדפדפן שיושבת ב-Gmail וב-Outlook באינטרנט ורואה דבר אחד: ההודעה שאתם עומדים לשלוח. כשאתם כותבים "אשלח לך את החוזה עד יום חמישי" או "I’ll get back to you tomorrow" ולוחצים על שליחה, מופיע פס קטן: "לשמור כהתחייבות? שליחת חוזה – חמישי". לחיצה אחת שומרת את זה עם הנמען, התאריך והציטוט. הזיהוי רץ כולו בדפדפן, לפי תבניות לשוניות בעברית ובאנגלית, בלי לקרוא את תיבת הדואר ובלי לשלוח טקסט החוצה. בחלון ההרחבה יש פנקס של כל ההבטחות הפתוחות, מקובצות לפי נמען ולפי מועד, ותזכורת בדפדפן ביום היעד. כשמסמנים "בוצע" ההבטחה נסגרת, וכך ברור מה עדיין תלוי ועומד.',
        en: 'Pledge is a browser extension that sits in Gmail and Outlook on the web and sees one thing: the message you are about to send. When you write "I’ll send you the contract by Thursday" or "אחזור אליך מחר" and press send, a small bar appears: "Save as a commitment? Send contract – Thursday". One click saves it with the recipient, the date and the quote. Detection runs entirely in the browser, using language patterns for Hebrew and English, without reading the mailbox and without sending text anywhere. The extension window holds a ledger of every open promise, grouped by recipient and by date, and a browser reminder on the due day. Marking "done" closes the promise, so it is clear what is still pending.',
      },
      problem: {
        he: 'הבטחות קטנות נולדות באמצע כתיבה – "אחזור אליך", "אעביר את זה לדנה", "ניפגש בשבוע הבא" – ואיש לא מעתיק אותן לרשימה. הן נשארות בתיבת הנשלחים, בין מאות הודעות, ומתגלות רק כשהצד השני שואל. כלים שקוראים את כל תיבת הדואר דורשים הרשאות רחבות, ויש מי שלא מוכנים להעניק אותן.',
        en: 'Small promises are born mid-sentence – "I’ll get back to you", "I’ll pass it to Dana", "let’s meet next week" – and nobody copies them to a list. They stay in the sent folder among hundreds of messages and surface only when the other side asks. Tools that read the whole mailbox need broad permissions, and some people are not willing to grant them.',
      },
      solution: {
        he: 'זיהוי ברגע השליחה במקום סריקה של תיבת הדואר. מנוע תבניות מקומי מחפש פעלי התחייבות ("אשלח", "אחזור", "I’ll send") וביטויי זמן ("עד יום חמישי", "מחר", "by Friday"), מציע כותרת קצרה ותאריך, ומשאיר את האישור בידי המשתמש. ההבטחות נשמרות בדפדפן, עם תזכורת ביום היעד.',
        en: 'Detection at the moment of sending instead of scanning the mailbox. A local pattern engine looks for commitment verbs ("I’ll send", "אחזור") and time expressions ("by Friday", "עד יום חמישי"), proposes a short title and a date, and leaves approval to the user. Promises are stored in the browser, with a reminder on the due day.',
      },
      usp: {
        he: 'הרחבה שלא קוראת את תיבת הדואר: היא רואה רק את ההודעה שבשליחה, מעבדת אותה בדפדפן, ומתחילה מהמקום שבו ההבטחה נולדת ולא מהמקום שבו היא כבר נשכחה.',
        en: 'An extension that does not read the mailbox: it sees only the message being sent, processes it in the browser, and starts where a promise is born rather than where it has already been forgotten.',
      },
      targetUsers: {
        he: ['עצמאים ויועצים שמנהלים לקוחות במייל', 'אנשי מכירות, גיוס ומוצר שכותבים עשרות הודעות ביום', 'מי שעובד בעברית ובאנגלית במקביל ורוצה זיהוי בשתיהן'],
        en: ['Freelancers and consultants who manage clients by email', 'Sales, recruiting and product people writing dozens of messages a day', 'People working in Hebrew and English side by side who want detection in both'],
      },
      coreFeatures: {
        he: [
          'זיהוי התחייבות ברגע השליחה בעברית ובאנגלית, מקומית בדפדפן',
          'פס אישור בלחיצה אחת עם כותרת, תאריך ונמען מוצעים וניתנים לעריכה',
          'פנקס הבטחות פתוחות לפי נמען ולפי מועד',
          'תזכורת בדפדפן ביום היעד ותג עם מספר ההבטחות להיום',
          'סגירה בלחיצה ("בוצע") או דחייה לתאריך חדש',
          'ביטויים מותאמים אישית: מוסיפים ביטוי שהזיהוי החמיץ',
          'ייצוא וגיבוי לקובץ JSON',
        ],
        en: [
          'Commitment detection at send time in Hebrew and English, locally in the browser',
          'A one-click confirmation bar with a proposed, editable title, date and recipient',
          'A ledger of open promises by recipient and by date',
          'A browser reminder on the due day and a badge with the number of promises due today',
          'Close with one click ("done") or snooze to a new date',
          'Custom phrases: add a phrase the detection missed',
          'Export and backup to a JSON file',
        ],
      },
      screens: [
        { name: { he: 'פס האישור', en: 'Confirmation bar' }, description: { he: 'פס קטן ליד כפתור השליחה עם הכותרת והתאריך המוצעים, כפתורי שמירה והתעלמות, שנעלם לבד אחרי כמה שניות.', en: 'A small bar next to the send button with the proposed title and date, save and ignore buttons, that disappears by itself after a few seconds.' } },
        { name: { he: 'פנקס', en: 'Ledger' }, description: { he: 'רשימת הבטחות פתוחות לפי יום יעד, עם הנמען והציטוט, ופס אדום עדין על הבטחות שעבר מועדן.', en: 'A list of open promises by due day, with the recipient and the quote, and a soft red bar on promises past their date.' } },
        { name: { he: 'הבטחה', en: 'Promise' }, description: { he: 'פרט של הבטחה אחת: ציטוט, נמען, תאריך, פעולות בוצע/דחה/מחק.', en: 'Detail of a single promise: quote, recipient, date, and done, snooze and delete actions.' } },
        { name: { he: 'להיום', en: 'Due today' }, description: { he: 'תצוגה צרה של מה שמגיע היום ומחר, שנפתחת מלחיצה על התג בסרגל הדפדפן.', en: 'A narrow view of what is due today and tomorrow, opened by clicking the badge in the browser toolbar.' } },
        { name: { he: 'ביטויים', en: 'Phrases' }, description: { he: 'רשימת הביטויים שהזיהוי מכיר, ואפשרות להוסיף ביטוי אישי או להשבית ביטוי שמפריע.', en: 'The list of phrases the detection knows, with a way to add a personal phrase or switch off one that gets in the way.' } },
        { name: { he: 'הגדרות ורישיון', en: 'Settings and licence' }, description: { he: 'שפות פעילות, שעת תזכורת, אתרים פעילים והזנת מפתח הרישיון.', en: 'Active languages, reminder time, enabled sites and licence key entry.' } },
      ],
      userJourney: {
        he: [
          'יועצת עצמאית כותבת ללקוח "אשלח לך הצעה מעודכנת עד יום חמישי" ולוחצת שליחה',
          'מעל חלון ההודעה מופיע פס: "לשמור? שליחת הצעה מעודכנת – חמישי", והיא מאשרת',
          'ביום חמישי בבוקר מופיעה תזכורת בדפדפן',
          'היא שולחת את ההצעה ולוחצת "בוצע" בפנקס',
          'בסוף השבוע היא מציצה בפנקס ורואה שהבטחה ללקוח אחר מתקרבת למועדה',
        ],
        en: [
          'A freelance consultant writes to a client "I’ll send you an updated proposal by Thursday" and presses send',
          'A bar appears above the message window: "Save? Send updated proposal – Thursday", and she confirms',
          'On Thursday morning a browser reminder appears',
          'She sends the proposal and clicks "done" in the ledger',
          'At the end of the week she glances at the ledger and sees that a promise to another client is nearing its date',
        ],
      },
      uxDirection: {
        he: 'שקט ולא מפריע: הפס מופיע ליד כפתור השליחה, נעלם לבד, ולא חוסם את השליחה. חלון ההרחבה הוא רשימה פשוטה עם צבע אחד לפיגור. טיפוגרפיה שמתאימה לעברית ולאנגלית באותה שורה, ותמיכה מלאה ב-RTL בפס ובפנקס.',
        en: 'Quiet and unobtrusive: the bar appears next to the send button, disappears by itself and never blocks sending. The extension window is a plain list with one colour for overdue. Typography that suits Hebrew and English in the same line, and full RTL support in the bar and the ledger.',
      },
      architecture: {
        he: 'הרחבת Manifest V3 שנבנית ב-WXT עם TypeScript. סקריפט תוכן מאזין לאירוע השליחה ב-Gmail וב-Outlook באינטרנט וקורא רק את גוף ההודעה והנמענים של ההודעה הנשלחת. מנוע התבניות רץ בדפדפן: רשימת ביטויי התחייבות ופענוח תאריכים יחסיים בעברית ובאנגלית, עם בדיקות יחידה. ההבטחות נשמרות ב-IndexedDB דרך Dexie; chrome.alarms מתזמן תזכורות ו-chrome.notifications מציג אותן. התשלום החד-פעמי עובר ב-Stripe Checkout, ופונקציית Edge ב-Supabase מנפיקה ומאמתת מפתח רישיון.',
        en: 'A Manifest V3 extension built with WXT and TypeScript. A content script listens for the send event in Gmail and Outlook on the web and reads only the body and recipients of the message being sent. The pattern engine runs in the browser: a list of commitment phrases and relative-date parsing in Hebrew and English, with unit tests. Promises are stored in IndexedDB through Dexie; chrome.alarms schedules reminders and chrome.notifications shows them. The one-time payment goes through Stripe Checkout, and a Supabase Edge Function issues and verifies a licence key.',
      },
      stack: ['WXT', 'Chrome Extension Manifest V3', 'TypeScript', 'IndexedDB', 'Dexie', 'Stripe', 'Supabase Edge Functions'],
      database: {
        he: ['promises – כותרת, ציטוט, נמען, תאריך יעד, מצב', 'phrases – ביטוי מותאם, שפה, סוג', 'reminders – הבטחה, זמן ואם הוצגה', 'settings – שפות פעילות, שעת תזכורת, אתרים פעילים', 'licenses – מפתח, מצב ותאריך אימות אחרון, בשרת'],
        en: ['promises – title, quote, recipient, due date, status', 'phrases – custom phrase, language, type', 'reminders – promise, time and whether it was shown', 'settings – active languages, reminder time, enabled sites', 'licenses – key, status and last verification date, on the server'],
      },
      auth: {
        he: 'אין חשבון משתמש. הרחבה מקומית עם מפתח רישיון שמתקבל אחרי התשלום ואימות אחד מול השרת בהפעלה. ההבטחות עצמן לא עוזבות את הדפדפן.',
        en: 'No user account. A local extension with a licence key issued after payment and one check against the server on activation. The promises themselves never leave the browser.',
      },
      monetization: {
        he: ['ניסיון חינם עד עשר הבטחות פעילות, ואחריו רישיון חד-פעמי דרך Stripe Checkout', 'שדרוגים חינם בתוך גרסה ראשית אחת, ושדרוג מוזל לגרסה הבאה'],
        en: ['Free trial up to ten active promises, then a one-time licence through Stripe Checkout', 'Free updates within one major version and a discounted upgrade to the next'],
      },
      mvpMilestones: {
        he: ['הרחבה בסיסית ואיתור כפתור השליחה ב-Gmail', 'מנוע תבניות בעברית ובאנגלית עם בדיקות יחידה', 'פס אישור ופנקס ב-IndexedDB', 'תזכורות עם chrome.alarms ותמיכה ב-Outlook באינטרנט', 'רישיון ב-Stripe וב-Supabase והגשה לחנות Chrome'],
        en: ['Basic extension and locating the send button in Gmail', 'Pattern engine for Hebrew and English with unit tests', 'Confirmation bar and ledger in IndexedDB', 'Reminders with chrome.alarms and Outlook on the web support', 'Licence through Stripe and Supabase and Chrome Web Store submission'],
      },
      risks: {
        he: ['הממשק של Gmail ו-Outlook משתנה, והרחבה שנשענת על מבנה הדף תישבר מדי פעם – נדרשת בדיקה אוטומטית של בורר השליחה', 'דיוק הזיהוי בעברית משתנה בגלל הטיות ולשון דיבור; עדיף פס שמפספס לפעמים על פס שמפריע בכל הודעה', 'בדיקת חנות Chrome על הרשאות עלולה לעכב את ההשקה, ולכן כדאי לבקש רק את המינימום'],
        en: ['Gmail and Outlook interfaces change, and an extension that leans on page structure will break now and then – an automated check of the send selector is needed', 'Detection accuracy in Hebrew varies because of inflection and colloquial speech; a bar that sometimes misses is better than one that interrupts every message', 'Chrome Web Store permission review can delay launch, so ask for the minimum only'],
      },
      expansion: {
        he: ['תמיכה בסלאק וב-LinkedIn', 'סנכרון מוצפן אופציונלי בין מכשירים', 'ייצוא התחייבויות ליומן'],
        en: ['Support for Slack and LinkedIn', 'Optional encrypted sync across devices', 'Export commitments to a calendar'],
      },
    },
  },
  {
    id: 'scoreclock',
    name: { he: 'Scoreclock – דקה לכל נקודה', en: 'Scoreclock' },
    tagline: {
      he: 'מזינים את מבנה המבחן, מקבלים תקציב דקות לכל שאלה לפי הניקוד, ומתאמנים על לדלג בזמן – עם דוח נקודות לדקה אחרי כל מבחן דמה.',
      en: 'Enter an exam’s structure, get a minute budget per question by its marks, and practise skipping on time – with a points-per-minute report after every mock.',
    },
    category: 'productivity',
    secondaryCategories: ['education'],
    difficulty: 'intermediate',
    effort: { weeksMin: 4, weeksMax: 6 },
    budget: 'free',
    businessModel: 'freemium',
    platforms: ['ios', 'android'],
    audience: ['students'],
    tags: ['exams', 'time management', 'study', 'mock exam', 'bagrut', 'pacing', 'students', 'israel', 'local-first'],
    identity: { hue: 33, glyph: 'Sc', pattern: 'wave' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Scoreclock מניחה עיקרון פשוט: במבחן הזמן הוא תקציב והניקוד הוא התשואה. מזינים את מבנה המבחן – כמה שאלות, כמה נקודות בכל אחת וכמה דקות יש – והאפליקציה מחלקת את הזמן לפי משקל השאלות ומציגה "דקה לכל נקודה". במצב מבחן דמה השעון מראה לכל שאלה את התקציב שנותר, וכשעוברים אותו בסף שהגדרתם מוצעת פעולה אחת: לסמן ולדלג. אחרי המבחן מזינים לפי מפתח התשובות כמה נקודות קיבלתם בכל שאלה, ו-Scoreclock מחשבת נקודות לדקה לכל שאלה ולכל סוג שאלה. לפי הנתונים האישיים האלה היא מציעה סדר התקפה למבחן הבא – מה לפתור ראשון ומה להשאיר לסוף. התבניות ניתנות לעריכה ואינן מניחות מבנה רשמי כלשהו.',
        en: 'Scoreclock rests on a simple principle: in an exam time is the budget and marks are the return. You enter the exam structure – how many questions, how many marks each, how many minutes – and the app divides time by the weight of the questions and shows a "minute per mark". In mock mode the clock shows each question’s remaining budget, and when you pass it by a threshold you set, one action is offered: flag and skip. After the exam you enter, from the answer key, how many marks you got on each question, and Scoreclock computes points per minute for each question and each question type. From that personal data it proposes an order of attack for the next mock – what to solve first and what to leave for last. Templates are editable and assume no official structure.',
      },
      problem: {
        he: 'תלמידים מפסידים נקודות לפעמים לא מחוסר ידע אלא מחוסר זמן: שאלה קשה של עשרים נקודות בולעת חצי שעה, ושתי שאלות קלות באותו ניקוד נשארות בלי נגיעה. תרגול מבחנים בבית נעשה לרוב בלי שעון, או עם שעון כולל אחד שאינו אומר כמה זמן מגיע לכל שאלה, וקשה לדעת אילו שאלות הניבו הכי הרבה נקודות לדקה.',
        en: 'Students sometimes lose marks not for lack of knowledge but for lack of time: one hard twenty-mark question swallows half an hour and two easy ones with the same marks are left untouched. Practising at home is often done without a clock, or with one overall clock that does not say how much time each question deserves, and it is hard to see which questions gave the most marks per minute.',
      },
      solution: {
        he: 'מבנה מבחן ניתן לעריכה, תקציב דקות לכל שאלה לפי ניקוד, מצב מבחן דמה עם שעון לכל שאלה ופעולת "סמן ודלג", וניתוח אחרי המבחן של נקודות לדקה. הניתוח מחזיר סדר התקפה מוצע, לפי המבחנים האישיים שלכם, ואפשר לתרגל אותו במבחן הבא.',
        en: 'An editable exam structure, a minute budget per question by marks, a mock mode with a clock per question and a "flag and skip" action, and a post-exam points-per-minute analysis. The analysis returns a proposed order of attack based on your own mocks, which you can practise on the next one.',
      },
      usp: {
        he: 'לא טיימר ולא אפליקציית תרגול שאלות: Scoreclock מלמדת לנהל את המבחן עצמו – איפה להשקיע דקות ואיפה לוותר – על סמך הנתונים שלכם, בלי חשבון ובלי להעלות שום דבר.',
        en: 'Not a timer and not a question-practice app: Scoreclock teaches you to manage the exam itself – where to spend minutes and where to let go – from your own data, with no account and nothing uploaded.',
      },
      targetUsers: {
        he: ['תלמידי תיכון שמתכוננים לבחינות בגרות', 'נבחנים בבחינות כניסה ובחינות מקצועיות עם זמן קבוע', 'מורים פרטיים ומדריכי הכנה שרוצים להראות לתלמיד לאן הזמן הולך'],
        en: ['High-school students preparing for matriculation exams', 'Candidates for entrance and professional exams with fixed time', 'Private tutors and prep instructors who want to show a student where the time goes'],
      },
      coreFeatures: {
        he: [
          'עורך מבנה מבחן: שאלות, ניקוד, פרקים וזמן כולל',
          'תקציב דקות לכל שאלה לפי ניקוד, עם מרווח ביטחון שנשמר לסוף',
          'מצב מבחן דמה עם שעון לכל שאלה ותצוגה של התקציב שנותר',
          'פעולת "סמן ודלג" כשהשאלה עוברת את הסף שהגדרתם',
          'הזנת נקודות לפי מפתח התשובות אחרי המבחן',
          'דוח נקודות לדקה לכל שאלה ולכל סוג שאלה, וסדר התקפה מוצע למבחן הבא',
          'ייצוא וייבוא של תבנית מבחן כקובץ, לשיתוף עם חברים או מורה',
        ],
        en: [
          'Exam structure editor: questions, marks, sections and total time',
          'Minute budget per question by marks, with a safety margin kept for the end',
          'Mock mode with a clock per question and a view of the remaining budget',
          'A "flag and skip" action when a question passes the threshold you set',
          'Entering marks from the answer key after the exam',
          'Points-per-minute report per question and per question type, and a proposed order of attack for the next mock',
          'Export and import of an exam template as a file, to share with friends or a teacher',
        ],
      },
      screens: [
        { name: { he: 'תבניות', en: 'Templates' }, description: { he: 'תבניות המבחן השמורות עם זמן כולל ומספר שאלות, וכפתור ליצירת תבנית חדשה או ייבוא מקובץ.', en: 'Saved exam templates with total time and number of questions, and a button to create a new one or import from a file.' } },
        { name: { he: 'עורך מבנה', en: 'Structure editor' }, description: { he: 'רשימת שאלות עם ניקוד, פרק וסוג, והתקציב המחושב לכל שאלה מתעדכן בזמן אמת.', en: 'A list of questions with marks, section and type, and the computed budget for each updates live.' } },
        { name: { he: 'מבחן דמה', en: 'Mock exam' }, description: { he: 'שעון גדול, פס תקציב לשאלה הנוכחית ושלושה כפתורים: שאלה הבאה, סמן ודלג וחזור לשאלה.', en: 'A large clock, a budget bar for the current question and three buttons: next question, flag and skip, and go back.' } },
        { name: { he: 'הזנת ניקוד', en: 'Enter marks' }, description: { he: 'רשימת השאלות עם שדה נקודות לכל אחת, מלא במהירות בעזרת מקלדת מספרים.', en: 'The list of questions with a marks field for each, quick to fill with a number pad.' } },
        { name: { he: 'דוח', en: 'Report' }, description: { he: 'פסים של נקודות לדקה לכל שאלה, השוואה בין מבחנים וסוגי שאלות, והדגשה של מה שהניב הכי הרבה ומה הכי מעט.', en: 'Bars of points per minute for each question, a comparison between mocks and question types, highlighting what gave the most and the least.' } },
        { name: { he: 'סדר התקפה', en: 'Order of attack' }, description: { he: 'הרשימה המוצעת למבחן הבא עם הנימוק לכל מקום, וכפתור להפעלה כברירת מחדל במבחן הדמה הבא.', en: 'The proposed list for the next exam with the reason for each place, and a button to use it as the default in the next mock.' } },
      ],
      userJourney: {
        he: [
          'תלמידת י״ב מגדירה תבנית של מבחן מתמטיקה: ארבע שאלות, 25 נקודות כל אחת, שלוש שעות',
          'Scoreclock מציעה 40 דקות לכל שאלה ומשאירה עשרים דקות מרווח בסוף',
          'במבחן דמה היא עוברת את התקציב בשאלה השנייה, והאפליקציה מציעה לסמן ולדלג',
          'אחרי המבחן היא מזינה את הניקוד לפי המפתח ורואה שהשאלה הראשונה הניבה יותר נקודות לדקה מהשנייה',
          'במבחן הבא היא מתחילה בשאלה המשתלמת וחוזרת לשנייה בסוף, ושולחת את התבנית לחברה כקובץ',
        ],
        en: [
          'A twelfth-grade student sets up a maths exam template: four questions, 25 marks each, three hours',
          'Scoreclock proposes 40 minutes per question and leaves twenty minutes of margin at the end',
          'In a mock she passes the budget on question two, and the app suggests flagging and skipping',
          'After the exam she enters her marks from the key and sees that question one gave more marks per minute than question two',
          'In the next mock she starts with the rewarding question and returns to the second at the end, and sends the template to a friend as a file',
        ],
      },
      uxDirection: {
        he: 'רגוע ונקי לתלמידים בלחץ: מסך המבחן הוא שעון גדול אחד ופס תקציב לשאלה, בלי התראות קופצות. צבע משמש רק לשאלה שחרגה מהתקציב. ניגודיות גבוהה וכפתורים גדולים, כדי שיהיה קריא תחת לחץ. עברית ב-RTL כברירת מחדל ואנגלית ב-LTR מלאה.',
        en: 'Calm and clean for students under pressure: the exam screen is one large clock and a per-question budget bar, with no pop-up alerts. Colour is used only for a question that went over budget. High contrast and large buttons so it stays readable under stress. Hebrew in RTL by default and full English in LTR.',
      },
      architecture: {
        he: 'Expo עם Expo Router, כל הנתונים ב-expo-sqlite על המכשיר ובלי שרת. התקציב, ספי הדילוג והדוח הם פונקציות טהורות על מבנה המבחן והזמנים, עם בדיקות יחידה לתבניות מבחן שונות. expo-keep-awake שומר על המסך דולק במבחן דמה, ו-react-native-svg מצייר את תרשימי נקודות לדקה. ייצוא וייבוא תבניות כקובץ JSON דרך expo-sharing ו-expo-document-picker. הפתיחה החד-פעמית והגבלות התוכנית החינמית מנוהלות ב-RevenueCat.',
        en: 'Expo with Expo Router, all data in expo-sqlite on the device and no server. The budget, the skip thresholds and the report are pure functions over the exam structure and the timings, with unit tests for different exam templates. expo-keep-awake keeps the screen on during a mock, and react-native-svg draws the points-per-minute charts. Templates are exported and imported as JSON files through expo-sharing and expo-document-picker. The one-time unlock and the limits of the free plan are managed in RevenueCat.',
      },
      stack: ['Expo', 'Expo Router', 'expo-sqlite', 'expo-keep-awake', 'expo-sharing', 'expo-document-picker', 'react-native-svg', 'RevenueCat'],
      database: {
        he: ['exam_templates – שם, זמן כולל, מרווח ביטחון', 'questions – תבנית, סדר, ניקוד, סוג שאלה, פרק', 'mock_runs – תבנית, תאריך, זמן כולל בפועל', 'run_questions – ריצה, שאלה, דקות בפועל, נקודות שהושגו, האם דולגה', 'settings – סף דילוג ושפה'],
        en: ['exam_templates – name, total time, safety margin', 'questions – template, order, marks, question type, section', 'mock_runs – template, date, actual total time', 'run_questions – run, question, actual minutes, marks earned, whether skipped', 'settings – skip threshold and language'],
      },
      auth: {
        he: 'בלי חשבון ובלי איסוף נתונים: הכול נשמר על המכשיר. אין צ׳אט ואין תכונות חברתיות, וייצוא תבנית הוא פעולה יזומה של המשתמש בלבד, כך שהאפליקציה אינה מחזיקה מידע אישי על קטינים.',
        en: 'No account and no data collection: everything is stored on the device. There is no chat and no social features, and exporting a template is a deliberate user action only, so the app holds no personal information about minors.',
      },
      monetization: {
        he: ['חינם: תבנית פעילה אחת ושלושה מבחני דמה בהיסטוריה', 'פתיחה חד-פעמית ב-RevenueCat לתבניות ללא הגבלה, היסטוריה מלאה וייצוא וייבוא'],
        en: ['Free: one active template and three mocks in history', 'A one-time unlock through RevenueCat for unlimited templates, full history and export and import'],
      },
      mvpMilestones: {
        he: ['עורך מבנה מבחן ומחשבון התקציב עם בדיקות יחידה', 'מצב מבחן דמה עם שעון לכל שאלה וסמן-ודלג', 'הזנת ניקוד ודוח נקודות לדקה', 'סדר התקפה מוצע, היסטוריה וייצוא תבניות', 'RevenueCat והגבלות התוכנית החינמית'],
        en: ['Exam structure editor and budget calculator with unit tests', 'Mock mode with a per-question clock and flag-and-skip', 'Entering marks and the points-per-minute report', 'Proposed order of attack, history and template export', 'RevenueCat and the free-plan limits'],
      },
      risks: {
        he: ['המלצה לדלג עלולה להטעות תלמיד שדילג על שאלה שהייתה קרובה לפתרון; ההצעות הן חישוב על הנתונים שלו ולא הנחיה פדגוגית, וצריך לומר זאת בבירור', 'הזנת ניקוד ידנית אחרי מבחן היא חיכוך, ואם היא ארוכה מדי אנשים לא יעשו אותה', 'מבני מבחן משתנים בין מוסדות ושנים, ולכן אין להבטיח תבניות רשמיות'],
        en: ['A skip suggestion can mislead a student who skipped a question that was close to solved; suggestions are arithmetic on their own data, not pedagogical guidance, and that must be stated clearly', 'Entering marks by hand after a mock is friction, and if it takes too long people will not do it', 'Exam structures differ between institutions and years, so official templates must not be promised'],
      },
      expansion: {
        he: ['תבניות משותפות שמורים מפיצים לתלמידיהם בקובץ', 'ניתוח לפי נושאים: איפה הנקודות הולכות לאיבוד', 'דוח שהתלמיד בוחר לשתף עם המורה שלו'],
        en: ['Shared templates that teachers hand out to their students as a file', 'Analysis by topic: where marks get lost', 'A report the student chooses to share with their teacher'],
      },
    },
  },
  {
    id: 'turnabout',
    name: { he: 'Turnabout – תור לשעה הלא נוחה', en: 'Turnabout' },
    tagline: {
      he: 'קובעים פגישות בין אזורי זמן ומחלקים את השעות המוקדמות והמאוחרות בהוגנות: כל אחד נושא בתורו, ולא תמיד אותם אנשים.',
      en: 'Schedule meetings across time zones and share the awkward early and late hours fairly: everyone takes a turn, not always the same people.',
    },
    category: 'productivity',
    secondaryCategories: ['business', 'social'],
    difficulty: 'advanced',
    effort: { weeksMin: 9, weeksMax: 12 },
    budget: 'medium',
    businessModel: 'subscription',
    platforms: ['web'],
    audience: ['teams', 'businesses'],
    tags: ['scheduling', 'time zones', 'fairness', 'remote work', 'meetings', 'israel', 'google calendar', 'rotation', 'distributed teams'],
    identity: { hue: 248, glyph: 'Tb', pattern: 'ring' },
    flags: { beginnerFriendly: false, profitPotential: 'high', experimental: true, trending: false, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'צוותים שמפוזרים בין ישראל, ארצות הברית והודו מכירים את התחושה שתמיד מישהו משלם: מי שנשאר בערב כדי להתחבר לסנכרון של חוף המערב, או מי שקם מוקדם מדי בבוקר. לא פעם אלה אותם אנשים, כי אף אחד לא עוקב. Turnabout מנהלת "ספר אי-נוחות" לצוות: כל חצי שעה מחוץ לשעות הנוחות של אדם עולה לו נקודות לפי כללים שהוא קובע בעצמו, והנקודות מצטברות בספר מתגלגל של תשעים יום. כשמבקשים לקבוע פגישה, Turnabout בודקת חלונות פנויים ביומנים ובוחרת את המועד שבו הצבירה הגבוהה ביותר בצוות אחרי הפגישה היא הנמוכה ביותר – כלומר מי שנשא פחות מהאחרים לוקח הפעם את השעה הלא נוחה. פגישה חוזרת יכולה להתחלף בין שני מועדים, ומסך "למה דווקא השעה הזאת" מראה לכולם מי שילם בפעם הקודמת.',
        en: 'Teams spread across Israel, the United States and India know the feeling that someone always pays: the person who stays late to join a West Coast sync, or the one who gets up too early. Often it is the same people, because nobody keeps track. Turnabout keeps a "discomfort ledger" for the team: every half hour outside a person’s comfortable hours costs them points by rules they set themselves, and the points accumulate in a rolling ninety-day ledger. When someone asks for a meeting, Turnabout checks free windows in the calendars and picks the slot after which the highest accumulated total in the team is the lowest – meaning whoever carried less than the others takes the awkward hour this time. A recurring meeting can alternate between two slots, and a "why this slot" screen shows everyone who paid last time.',
      },
      problem: {
        he: 'פגישה משותפת בין אזורי זמן רחוקים נופלת בדרך כלל בשעה לא נוחה למישהו. כשאין מי שמנהל את זה, העול נופל על מי שמסכים בקלות או על הצד שנמצא באזור הזמן "הקטן", ושאר הצוות לא רואה את זה. כלי תיאום פשוטים מוצאים חלון פנוי אבל לא זוכרים מי שילם בפעם הקודמת. הפרשי שבוע עבודה (ראשון עד חמישי מול שני עד שישי) וחגים שונים מוסיפים סיבוכים.',
        en: 'A shared meeting across distant time zones usually lands at an awkward hour for someone. When nobody manages it, the burden falls on whoever agrees easily or on the side in the "smaller" time zone, and the rest of the team does not see it. Simple scheduling tools find a free window but do not remember who paid last time. Differences in the working week (Sunday to Thursday versus Monday to Friday) and in holidays add complications.',
      },
      solution: {
        he: 'ספר אי-נוחות לצוות, מנוע בחירת מועד שמקטין את הצבירה הגבוהה ביותר, ותבנית רוטציה לפגישות חוזרות. הזמינות נלקחת מ-Google Calendar בהרשאת פנוי/תפוס, או מלוח שעות שבועי שמי שאין לו חיבור יומן מגדיר בעצמו. חגים לפי מדינה ושבוע עבודה לכל אדם נכנסים לחישוב. כל הצעה מגיעה עם הסבר קצר, ואישור יוצר את האירוע ביומן ושולח הזמנות.',
        en: 'A discomfort ledger for the team, a slot-picking engine that minimises the highest accumulated total, and a rotation pattern for recurring meetings. Availability comes from Google Calendar with free/busy permission, or from a weekly availability grid that anyone without a calendar connection fills in themselves. Holidays by country and each person’s working week go into the calculation. Every suggestion comes with a short explanation, and approval creates the calendar event and sends invitations.',
      },
      usp: {
        he: 'הוגנות כמדד ממשי: במקום עוד כלי שמוצא חלון פנוי, Turnabout זוכרת מי נשא את השעה הלא נוחה וממקמת את הפגישה הבאה כך שהנטל מתאזן עם הזמן. כל החלטה מוצגת עם נימוק, ולכל אחד יש מילה על מה נחשב לא נוח עבורו.',
        en: 'Fairness as a real measure: instead of one more tool that finds a free window, Turnabout remembers who carried the awkward hour and places the next meeting so the burden evens out over time. Every decision is shown with its reasoning, and everyone has a say in what counts as uncomfortable for them.',
      },
      targetUsers: {
        he: ['צוותי פיתוח ומוצר ישראליים שעובדים עם לקוחות וצוותים בארצות הברית ובאירופה', 'חברות הזנק עם עובדים בכמה יבשות', 'קהילות ומיזמים התנדבותיים בין-לאומיים'],
        en: ['Israeli product and engineering teams working with clients and teams in the United States and Europe', 'Start-ups with employees on several continents', 'International volunteer communities and projects'],
      },
      coreFeatures: {
        he: [
          'שעות עבודה ופרופיל אי-נוחות אישי: מה נחשב מוקדם, מאוחר או סוף שבוע עבורי',
          'ספר אי-נוחות מתגלגל של תשעים יום לכל צוות, עם נקודות לחצי שעה',
          'בחירת מועד שמקטינה את הצבירה הגבוהה ביותר, עם הסבר "למה דווקא עכשיו"',
          'פגישות חוזרות עם רוטציה בין שני מועדים או שלושה',
          'חגים לפי מדינה, כולל חגי ישראל, ושבוע עבודה שונה לכל אדם',
          'פנוי/תפוס מ-Google Calendar או לוח שעות שבועי ידני למי שאין חיבור יומן',
          'יצירת האירוע והזמנות במייל בלחיצה אחת אחרי אישור המארגן',
          'שקיפות: כל חבר צוות רואה את הספר ואת הנקודות שלו',
        ],
        en: [
          'Working hours and a personal discomfort profile: what counts as early, late or weekend for me',
          'A rolling ninety-day discomfort ledger per team, with points per half hour',
          'Slot selection that minimises the highest accumulated total, with a "why this time" explanation',
          'Recurring meetings with rotation between two or three slots',
          'Holidays by country, including Israeli holidays, and a different working week for each person',
          'Free/busy from Google Calendar or a manual weekly grid for anyone without a calendar connection',
          'One-click event creation and email invitations after the organiser approves',
          'Transparency: every team member sees the ledger and their own points',
        ],
      },
      screens: [
        { name: { he: 'ספר הצוות', en: 'Team ledger' }, description: { he: 'עמודה לכל אדם עם פס נקודות מצטבר ל-90 הימים האחרונים, ופירוט הפגישות שגרמו לכל נקודה.', en: 'A column per person with a points bar accumulated over the last 90 days, and a breakdown of the meetings behind each point.' } },
        { name: { he: 'בקשת פגישה', en: 'Meeting request' }, description: { he: 'בוחרים משתתפים, משך וטווח תאריכים, ומסמנים אם הפגישה חוזרת.', en: 'Pick participants, duration and a date range, and mark whether the meeting recurs.' } },
        { name: { he: 'הצעות', en: 'Suggestions' }, description: { he: 'שלושה מועדים כשלוש שורות, ולכל אחד מי נושא בנקודות הפעם, איך הספר ייראה אחרי הפגישה ומשפט הסבר.', en: 'Three slots as three rows, each showing who carries the points this time, how the ledger will look afterwards and a one-line explanation.' } },
        { name: { he: 'פגישה חוזרת', en: 'Recurring meeting' }, description: { he: 'תצוגת הרוטציה: איזה מועד בכל שבוע לשבועות הקרובים, ומתי הנטל מתחלף.', en: 'The rotation view: which slot each week for the coming weeks, and when the burden switches.' } },
        { name: { he: 'פרופיל אישי', en: 'Personal profile' }, description: { he: 'שעות עבודה, שבוע עבודה, אזור זמן וכללי אי-נוחות עם נקודות לכל טווח שעות.', en: 'Working hours, working week, time zone and discomfort rules with points for each range of hours.' } },
        { name: { he: 'הגדרות צוות ומנוי', en: 'Team settings and billing' }, description: { he: 'חלון הספר בימים, חיבורי יומן, חברי צוות ותשלום לפי מושב.', en: 'Ledger window in days, calendar connections, team members and per-seat billing.' } },
      ],
      userJourney: {
        he: [
          'ראש צוות בתל אביב רוצה לקבוע סנכרון שבועי עם שני עמיתים בניו יורק ואחד בבנגלור',
          'Turnabout מציגה את הספר: בחודשים האחרונים הצוות בבנגלור נשא את רוב נקודות הערב',
          'היא מציעה שלושה מועדים; המועד שנבחר מטיל את הנקודות הפעם על תל אביב וניו יורק',
          'הצוות רואה את ההסבר ומאשר, והאירוע נוצר ביומנים עם הזמנות',
          'הפגישה השבועית מתחלפת בין שני מועדים כדי שהנטל לא יישאר אצל אותם אנשים',
        ],
        en: [
          'A team lead in Tel Aviv wants a weekly sync with two colleagues in New York and one in Bangalore',
          'Turnabout shows the ledger: in recent months the Bangalore team carried most of the evening points',
          'It offers three slots; the chosen one puts the points on Tel Aviv and New York this time',
          'The team sees the explanation and approves, and the event is created in the calendars with invitations',
          'The weekly meeting alternates between two slots so the burden does not stay with the same people',
        ],
      },
      uxDirection: {
        he: 'מרגיש כמו ספר חשבונות ידידותי ולא כמו לוח שנה: לכל אדם עמודה עם פס אי-נוחות מצטבר, ומסך ההצעות מציג שלושה מועדים כשלוש שורות עם שם מי שנושא בהם. צבעים מתונים ובלי אדום אזהרה על אדם – אי-נוחות היא נתון משותף ולא ציון. עברית ב-RTL ואנגלית ב-LTR, עם שעון 24 שעות כברירת מחדל.',
        en: 'Feels like a friendly ledger rather than a calendar: each person has a column with an accumulating discomfort bar, and the suggestions screen shows three slots as three rows with the name of whoever carries them. Moderate colours and no warning red on a person – discomfort is shared data, not a grade. Hebrew in RTL and English in LTR, with a 24-hour clock by default.',
      },
      architecture: {
        he: 'Next.js עם TypeScript ו-Supabase (Postgres ו-Auth) עם RLS לפי צוות. קריאות פנוי/תפוס מ-Google Calendar API נעשות בצד השרת עם אסימוני OAuth מוצפנים, ויצירת אירוע דורשת הרשאה נפרדת. בחירת המועד היא פונקציה טהורה ב-TypeScript: היא מייצרת חלונות מועמדים בצעדים של חצי שעה בטווח, מחשבת נקודות לכל משתתף לפי הפרופיל שלו, ובוחרת את החלון שמקטין את הצבירה הגבוהה ביותר אחרי הפגישה, עם שבירת שוויון לפי סך הנקודות. שעות ומעברי שעון קיץ ב-Luxon, חגי ישראל ב-@hebcal/core וחגי מדינות אחרות בספריית date-holidays. מנוי לפי מושב ב-Stripe, והזמנות וסיכומים במייל דרך Resend.',
        en: 'Next.js with TypeScript and Supabase (Postgres and Auth) with per-team RLS. Free/busy reads from the Google Calendar API happen on the server with encrypted OAuth tokens, and creating an event needs a separate permission. Slot selection is a pure TypeScript function: it generates candidate windows in half-hour steps across the range, computes points for each participant from their profile, and picks the window that minimises the highest accumulated total after the meeting, breaking ties by the total points. Hours and daylight-saving changes use Luxon, Israeli holidays use @hebcal/core and other countries’ holidays use the date-holidays library. Per-seat subscription in Stripe, and invitations and summaries by email through Resend.',
      },
      stack: ['Next.js', 'TypeScript', 'Supabase', 'Supabase Auth', 'Google Calendar API', 'Luxon', '@hebcal/core', 'date-holidays', 'Stripe', 'Resend'],
      database: {
        he: ['teams – שם, אזור ראשי, חלון הספר בימים', 'members – צוות, אזור זמן, שבוע עבודה, שעות נוחות', 'discomfort_rules – חבר צוות, טווחי שעות, נקודות לחצי שעה', 'meetings – צוות, כותרת, משתתפים, מועד, סוג רוטציה', 'ledger_entries – פגישה, חבר צוות, נקודות', 'calendar_connections – חבר צוות, אסימון מוצפן, הרשאות', 'holidays_cache – מדינה, תאריך, שם', 'subscriptions – צוות ומצב Stripe'],
        en: ['teams – name, home region, ledger window in days', 'members – team, time zone, working week, comfortable hours', 'discomfort_rules – team member, hour ranges, points per half hour', 'meetings – team, title, participants, slot, rotation type', 'ledger_entries – meeting, team member, points', 'calendar_connections – team member, encrypted token, permissions', 'holidays_cache – country, date, name', 'subscriptions – team and Stripe status'],
      },
      auth: {
        he: 'כניסה עם Google או קישור קסם. חיבור היומן הוא הסכמה נפרדת: פנוי/תפוס בלבד לחישוב, והרשאת יצירת אירועים רק למארגן שמפעיל אותה. RLS לפי צוות, ואורחים ללא חשבון מזינים זמינות דרך קישור אישי בתוקף מוגבל.',
        en: 'Google or magic-link sign-in. Connecting the calendar is a separate consent: free/busy only for the calculation, and event-creation permission only for an organiser who turns it on. Per-team RLS, and guests without an account enter availability through a personal link with limited validity.',
      },
      monetization: {
        he: ['מנוי חודשי לפי מושב עם ניסיון חינם לצוות קטן', 'תוכנית שנתית לצוותים של יותר מעשרה חברים'],
        en: ['Monthly per-seat subscription with a free trial for a small team', 'A yearly plan for teams of more than ten members'],
      },
      mvpMilestones: {
        he: ['מודל צוות, שעות נוחות וכללי נקודות, וספר חשבונות עם נתוני בדיקה', 'פותר בחירת המועד עם בדיקות יחידה לאזורי זמן, שעון קיץ וחגים', 'חיבור Google Calendar לקריאת פנוי/תפוס ולוח זמינות ידני', 'מסכי הצעות והסבר, יצירת אירוע והזמנות', 'פגישות חוזרות עם רוטציה, Stripe ומסך ספר הצוות'],
        en: ['Team model, comfortable hours and points rules, and a ledger with test data', 'The slot-picking solver with unit tests for time zones, daylight saving and holidays', 'Google Calendar free/busy connection and a manual availability grid', 'Suggestions and explanation screens, event creation and invitations', 'Recurring meetings with rotation, Stripe and the team ledger screen'],
      },
      risks: {
        he: ['אימות OAuth של Google להרשאות יומן לוקח זמן וכדאי להתחיל בו מוקדם; עד אז אפשר להסתמך על לוח זמינות ידני', 'אזורי זמן ושעון קיץ הם מקור קלאסי לשגיאות, ולכן בדיקות יחידה יסודיות הן חלק מה-MVP', 'שקיפות יתר על "מי נושא יותר" עלולה ליצור חיכוך בצוות; הספר צריך להיות כלי משותף ולא ציון', 'כלל הוגנות פשוט אינו אופטימלי מבחינה מתמטית, ויש להציג אותו כנוהל עבודה ברור'],
        en: ['Google OAuth verification for calendar permissions takes time and should start early; until then a manual availability grid can fill in', 'Time zones and daylight saving are a classic source of bugs, so thorough unit tests are part of the MVP', 'Too much transparency about "who carries more" can create friction in a team; the ledger must be a shared tool, not a grade', 'A simple fairness rule is not mathematically optimal, and it should be presented as a clear working rule'],
      },
      expansion: {
        he: ['חיבור ל-Microsoft 365 ול-Outlook', 'ספר משותף לפגישות של כמה צוותים', 'הצעה לפגישה אסינכרונית כשהנטל מצטבר יותר מדי'],
        en: ['Microsoft 365 and Outlook connection', 'A shared ledger for meetings across several teams', 'Suggest an asynchronous alternative when the burden accumulates too much'],
      },
    },
  },
  {
    id: 'thinkwalk',
    name: { he: 'Thinkwalk – לחשוב בהליכה', en: 'Thinkwalk' },
    tagline: {
      he: 'מדברים אל הטלפון תוך כדי הליכה, והוא מתמלל על המכשיר ומחלק את הדיבור לטענות, שאלות ומשימות – מתווה מוכן כשחוזרים לשולחן.',
      en: 'Talk to your phone as you walk; it transcribes on the device and splits your speech into claims, questions and tasks – an outline waiting at your desk.',
    },
    category: 'productivity',
    secondaryCategories: ['creativity', 'ai'],
    difficulty: 'advanced',
    effort: { weeksMin: 8, weeksMax: 12 },
    budget: 'free',
    businessModel: 'one-time',
    platforms: ['ios', 'android'],
    audience: ['professionals', 'creators', 'students'],
    tags: ['voice', 'transcription', 'on-device', 'whisper', 'walking', 'outline', 'privacy', 'hebrew', 'thinking'],
    identity: { hue: 100, glyph: 'Tw', pattern: 'grid' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: true, trending: true, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'חלק מהמחשבות הטובות מגיעות בהליכה ונעלמות עד שמגיעים לשולחן. Thinkwalk מאפשרת לדבר אל הטלפון בזמן שהולכים, והדיבור מתומלל כולו על המכשיר, בלי העלאה לענן. במקום תמלול ארוך וגולמי, האפליקציה מחלקת את הדיבור לקטעים לפי הפסקות ולפי מילות פקודה שאתם אומרים בקול: "שאלה" פותחת שאלה, "משימה" פותחת פעולה לביצוע, "סמן" קובעת פרק חדש. ההקלטה ממשיכה גם כשהמסך כבוי. כשחוזרים לשולחן מקבלים מסך סקירה: קטעי אודיו עם הטקסט שלהם ממוינים לשלוש עמודות – טענות, שאלות ומשימות – ועליהם מאשרים, עורכים או מוחקים. בסוף מייצאים מתווה מסודר ל-Markdown. אין חשבון, אין ענן, והתשלום חד-פעמי.',
        en: 'Some of the best thoughts arrive on a walk and vanish by the time you reach the desk. Thinkwalk lets you talk to your phone while you walk, and the speech is transcribed entirely on the device, with nothing uploaded. Instead of a long raw transcript, the app splits speech into segments by pauses and by command words you say out loud: "question" opens a question, "task" opens an action item, "mark" starts a new chapter. Recording continues with the screen off. Back at the desk you get a review screen: audio segments with their text sorted into three columns – claims, questions and tasks – where you approve, edit or delete. At the end you export a tidy outline to Markdown. No account, no cloud and a one-time payment.',
      },
      problem: {
        he: 'חשיבה בהליכה היא שיטה ותיקה, אבל קשה לתעד אותה: להקליד תוך כדי הליכה לא נוח, והקלטות קוליות נשארות תיקיית אודיו ארוכה שלא תמיד חוזרים להאזין לה. תמלול בענן פותר חלק מהבעיה, אך מעלה לשרת מחשבות לא גמורות, לפעמים על עבודה או על חיים אישיים.',
        en: 'Thinking on a walk is an old method, but hard to capture: typing while walking is awkward, and voice recordings turn into a long audio folder that people do not always go back to listen to. Cloud transcription solves part of the problem but uploads unfinished thoughts to a server, sometimes about work or about personal life.',
      },
      solution: {
        he: 'הקלטה ברקע עם מסך כבוי, תמלול בקטעים על המכשיר עם מודל Whisper, ופיצול לקטעים לפי הפסקות ופקודות קוליות. הפקודות מוגדרות בעברית ובאנגלית ואפשר להחליף אותן. מסך סקירה ממיין את הקטעים לעמודות, והאודיו המקורי נשמר לצד הטקסט עד שתמחקו אותו, כדי שתוכלו לבדוק תמלול לא ברור.',
        en: 'Background recording with the screen off, segment-by-segment transcription on the device with a Whisper model, and splitting by pauses and voice commands. Commands are defined in Hebrew and English and can be replaced. A review screen sorts the segments into columns, and the original audio is kept beside the text until you delete it, so you can check an unclear transcription.',
      },
      usp: {
        he: 'לא עוד מקליט קול ולא עוד תמלול בענן: Thinkwalk מבנה את הדיבור בזמן ההליכה עצמו, ומשאירה את האודיו ואת הטקסט על המכשיר.',
        en: 'Not just another voice recorder and not cloud transcription: Thinkwalk structures your speech during the walk itself and keeps both audio and text on the device.',
      },
      targetUsers: {
        he: ['כותבים, חוקרים ויוצרים שחושבים בקול', 'מנהלים ובעלי מקצוע שמסכמים את היום בדרך הביתה', 'סטודנטים שמכינים עבודה או חוזרים על חומר בהליכה'],
        en: ['Writers, researchers and creators who think out loud', 'Managers and professionals who sum up the day on the way home', 'Students preparing an assignment or revising on a walk'],
      },
      coreFeatures: {
        he: [
          'הקלטה ברקע עם מסך כבוי ותמלול על המכשיר',
          'פקודות קוליות בעברית ובאנגלית: "שאלה", "משימה", "סמן", וניתן לשנות אותן',
          'פיצול אוטומטי לקטעים לפי הפסקות דיבור',
          'מסך סקירה בשולחן: שלוש עמודות של טענות, שאלות ומשימות',
          'האזנה לקטע האודיו המקורי ליד כל משפט לבדיקת התמלול',
          'ייצוא מתווה ל-Markdown ולמסמך שמשתפים',
          'ניהול מודל התמלול: הורדה חד-פעמית ב-Wi-Fi ובחירת גודל',
        ],
        en: [
          'Background recording with the screen off and transcription on the device',
          'Voice commands in Hebrew and English: "question", "task", "mark", which can be changed',
          'Automatic splitting into segments by speech pauses',
          'Desk review screen: three columns of claims, questions and tasks',
          'Listen to the original audio segment beside each sentence to check the transcription',
          'Export an outline to Markdown and to a document you share',
          'Transcription model management: a one-time download over Wi-Fi and a choice of size',
        ],
      },
      screens: [
        { name: { he: 'הליכה', en: 'Walk' }, description: { he: 'נקודה פועמת אחת, שעון וכפתור "סמן" גדול; משוב קולי קצר באוזניות כשפקודה נקלטת.', en: 'One pulsing dot, a clock and a large "mark" button; a short audio cue in the headphones when a command is recognised.' } },
        { name: { he: 'סקירה', en: 'Review' }, description: { he: 'שלוש עמודות של טענות, שאלות ומשימות, וכל קטע כרטיס עם הטקסט, נגן קצר ופעולות אישור ועריכה.', en: 'Three columns of claims, questions and tasks, each segment a card with the text, a short player and approve and edit actions.' } },
        { name: { he: 'קטע', en: 'Segment' }, description: { he: 'עריכת קטע בודד: תיקון הטקסט, שינוי סוג, פיצול או מיזוג עם הקטע הסמוך.', en: 'Editing a single segment: fix the text, change its type, split it or merge it with the neighbouring one.' } },
        { name: { he: 'ייצוא', en: 'Export' }, description: { he: 'תצוגה מקדימה של המתווה ב-Markdown, בחירת מה לכלול ושיתוף דרך חלון השיתוף של המערכת.', en: 'A preview of the Markdown outline, a choice of what to include and sharing through the system share sheet.' } },
        { name: { he: 'מודל ואחסון', en: 'Model and storage' }, description: { he: 'המודל המותקן, גודלו, ההורדה, ושטח האחסון שתופסים קובצי האודיו עם מחיקה לפי הליכה.', en: 'The installed model, its size, the download, and the storage taken by audio files with deletion by walk.' } },
        { name: { he: 'פקודות', en: 'Commands' }, description: { he: 'רשימת מילות הפקודה בכל שפה, עם אפשרות להחליף מילה ולבדוק איך היא מזוהה.', en: 'The list of command words in each language, with a way to replace a word and test how it is recognised.' } },
      ],
      userJourney: {
        he: [
          'סופרת יוצאת להליכה של חצי שעה עם אוזניות ופותחת את Thinkwalk',
          'היא אומרת "שאלה: איך הדמות מגיעה לעיר בלי כסף" וממשיכה לדבר, ובהמשך "משימה: לכתוב סצנת הגעה"',
          'המסך כבוי והאפליקציה ממשיכה להקליט ולתמלל',
          'בשולחן היא רואה שמונה קטעים בשלוש עמודות, ומתקנת שני תמלולים אחרי האזנה',
          'היא מייצאת מתווה ל-Markdown ופותחת אותו במעבד התמלילים',
        ],
        en: [
          'A novelist heads out for a half-hour walk with earphones and opens Thinkwalk',
          'She says "question: how does the character reach the city without money" and keeps talking, later "task: write the arrival scene"',
          'The screen is off and the app keeps recording and transcribing',
          'At her desk she sees eight segments in three columns, and fixes two transcriptions after listening',
          'She exports an outline to Markdown and opens it in her word processor',
        ],
      },
      uxDirection: {
        he: 'כמעט בלי מסך: מסך ההליכה הוא נקודה פועמת אחת, שעון וכפתור "סמן" גדול, והכול מתבצע בשמיעה – משוב קולי קצר ("שאלה נקלטה") באוזניות. מסך הסקירה הוא עמודות מסודרות עם עריכה בנגיעה וטיפוגרפיה נעימה לקריאה ארוכה. עברית ב-RTL ואנגלית ב-LTR, גם באותו משפט.',
        en: 'Almost no screen: the walk screen is one pulsing dot, a clock and a large "mark" button, and everything is done by ear – a short audio cue ("question captured") in the earphones. The review screen is tidy columns with tap-to-edit and typography that is pleasant for long reading. Hebrew in RTL and English in LTR, even in the same sentence.',
      },
      architecture: {
        he: 'Expo עם development build, כי תמלול על המכשיר דורש מודול נייטיב: whisper.rn מריץ את whisper.cpp עם מודל שמורד בפעם הראשונה ב-Wi-Fi. expo-audio מקליט, עם הקלטה ברקע ב-iOS ושירות חזית ב-Android שמוגדרים בתוסף הגדרות. זיהוי הפסקות פשוט לפי עוצמת האות חותך את ההקלטה, וכל קטע מתומלל בנפרד ונשמר ב-expo-sqlite. זיהוי הפקודות הוא התאמת מילות מפתח ברמת הקטע, בלי מודל שפה, ולכן גם הוא מקומי. ייצוא Markdown דרך expo-sharing, והפתיחה החד-פעמית ב-RevenueCat.',
        en: 'Expo with a development build, because on-device transcription needs a native module: whisper.rn runs whisper.cpp with a model downloaded over Wi-Fi the first time. expo-audio records, with background recording on iOS and a foreground service on Android configured in a config plugin. Simple pause detection from signal level cuts the recording, and each segment is transcribed separately and stored in expo-sqlite. Command recognition is keyword matching at segment level, with no language model, so it is also local. Markdown export goes through expo-sharing, and the one-time unlock through RevenueCat.',
      },
      stack: ['Expo', 'Expo Router', 'whisper.rn', 'expo-audio', 'expo-file-system', 'expo-sqlite', 'expo-sharing', 'RevenueCat'],
      database: {
        he: ['sessions – התחלה, משך, שפה, מודל', 'segments – הליכה, תחילה, סוף, קובץ אודיו, טקסט', 'blocks – קטע, סוג (טענה/שאלה/משימה), מצב אישור', 'commands – מילת פקודה, שפה, סוג', 'exports – הליכה, פורמט, זמן'],
        en: ['sessions – start, duration, language, model', 'segments – walk, start, end, audio file, text', 'blocks – segment, type (claim/question/task), approval state', 'commands – command word, language, type', 'exports – walk, format, time'],
      },
      auth: {
        he: 'אין חשבון וההקלטות לא עוזבות את המכשיר. הרשאת מיקרופון בלבד, בלי מיקום ובלי אנשי קשר. מחיקת הליכה מוחקת גם את קובצי האודיו שלה.',
        en: 'No account, and recordings never leave the device. Microphone permission only, with no location and no contacts. Deleting a walk also deletes its audio files.',
      },
      monetization: {
        he: ['הורדה חינם עם שלוש הליכות מתומללות, ואחריהן פתיחה חד-פעמית ב-RevenueCat', 'שדרוג מוזל בגרסה ראשית הבאה'],
        en: ['Free download with three transcribed walks, then a one-time unlock through RevenueCat', 'A discounted upgrade in the next major version'],
      },
      mvpMilestones: {
        he: ['development build עם הקלטה ברקע ב-iOS וב-Android', 'שילוב whisper.rn, הורדת מודל ותמלול קטעים לדוגמה בעברית ובאנגלית', 'חיתוך לפי הפסקות ופקודות קוליות, עם בדיקות על הקלטות לדוגמה', 'מסך סקירה, עריכה והאזנה לקטע', 'ייצוא Markdown ופתיחה ב-RevenueCat'],
        en: ['Development build with background recording on iOS and Android', 'whisper.rn integration, model download and transcription of sample segments in Hebrew and English', 'Cutting by pauses and voice commands, tested on sample recordings', 'Review screen, editing and segment playback', 'Markdown export and the RevenueCat unlock'],
      },
      risks: {
        he: ['איכות התמלול בעברית משתנה לפי מודל, רעש ברחוב ומבטא; צריך לבדוק על הקלטות אמיתיות ולסמן בעדינות מקומות לא בטוחים', 'צריכת סוללה וחימום בתמלול ארוך – לתמלל בקטעים ואפשר להציע תמלול בזמן טעינה', 'הקלטה ברקע כפופה למגבלות מערכת ההפעלה ולהצהרות בחנויות, וכדאי להתחיל בבדיקת חנות מוקדמת', 'משתמשים עלולים להקליט אנשים אחרים בלי ידיעתם, ולכן יש להבהיר בממשק שמדובר בהקלטה אישית'],
        en: ['Hebrew transcription quality varies by model, street noise and accent; test on real recordings and gently flag uncertain places', 'Battery use and heat during long transcription – transcribe in segments and offer to transcribe while charging', 'Background recording is subject to OS limits and store declarations, so start a store review early', 'Users may record other people without their knowledge, so the interface should make clear this is for personal recording'],
      },
      expansion: {
        he: ['שליטה דרך כפתור האוזניות או שעון חכם', 'ייבוא ישיר לאפליקציות פתקים ולמנהלי משימות', 'מודלי תמלול מותאמים לעברית כשיהיה מודל מתאים וקל מספיק'],
        en: ['Control through the headset button or a smartwatch', 'Direct export to note apps and task managers', 'Hebrew-tuned transcription models when a suitable and light enough model exists'],
      },
    },
  },
];
