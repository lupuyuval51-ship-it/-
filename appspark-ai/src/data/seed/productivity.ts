import type { Idea } from '../types';

/**
 * Productivity – tools that help people finish things. Every idea here has a
 * structural twist (the unit of work is a question, an interruption, a lesson
 * segment, a handoff between people, a single daily number) instead of being
 * another list of tasks or habits.
 */
export const ideas: Idea[] = [
  {
    id: 'lemma',
    name: { he: 'Lemma – מחברת של שאלות פתוחות', en: 'Lemma' },
    tagline: {
      he: 'מחברת שבה כל פתק נכתב כתשובה לשאלה ששאלתם את עצמכם – ובסיס הידע שלכם הופך לרשימה חיה של מה שעדיין לא ידוע לכם.',
      en: 'A notebook where every entry must answer a question you asked yourself – so your knowledge base is a living list of what you still don’t know.',
    },
    category: 'productivity',
    secondaryCategories: ['education', 'creativity'],
    difficulty: 'intermediate',
    effort: { weeksMin: 5, weeksMax: 8 },
    budget: 'low',
    businessModel: 'subscription',
    platforms: ['ios', 'android', 'web'],
    audience: ['students', 'professionals', 'creators'],
    tags: ['notes', 'knowledge', 'research', 'questions', 'pkm', 'second brain', 'writing', 'learning'],
    identity: { hue: 220, glyph: 'Lm', pattern: 'dots' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: true, trending: false, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Lemma היא אפליקציית פתקים שבנויה על כלל אחד: אי אפשר לכתוב פתק בלי לחבר אותו לשאלה. "למה הנטישה קפצה במרץ?", "האם ספר הלימוד החדש באמת טוב יותר?", "איך לתמחר את חבילת המשפחה?" מסך הבית הוא לא ערימת מסמכים אלא רשימה מדורגת של שאלות פתוחות, ולכל שאלה רואים כמה ראיות הצטברו מתחתיה וכמה זמן היא כבר מחכה. כשיש תשובה, סוגרים את השאלה במשפט אחד, והתשובה הופכת ל-Lemma: אבן בניין מוסכמת ששאלות עתידיות יכולות לצטט. אם פתק חדש סותר Lemma קיימת, השאלה נפתחת מחדש. המבנה הזה נותן לחוקרים, לאנליסטים וליזמים משהו שתיקיות וקישורים הדדיים מעולם לא נתנו: תמונה כנה של מה הם יודעים, מה עדיין פתוח, ואילו אמונות כבר התיישנו.',
        en: 'Lemma is a note-taking app built on one rule: you cannot write a note without attaching it to a question. "Why did churn jump in March?", "Is the new textbook actually better?", "How should we price the family plan?" The home screen is not a pile of documents but a ranked list of open questions, each showing how much evidence has piled up under it and how long it has been waiting. When you can answer a question you close it with a one-line answer, and that answer becomes a lemma: a settled building block that later questions can cite. If a new note contradicts a lemma, the question reopens. The structure gives researchers, analysts and founders what folders and backlinks never did: an honest picture of what they know, what they are still working out, and which beliefs are getting old.',
      },
      problem: {
        he: 'רוב מערכות הפתקים מותאמות ללכידה, ולכן הן מתמלאות בהדגשות ובסיכומי פגישות שאף אחד לא פותח שוב. תיקיות עונות על "איפה זה יושב?", תגיות עונות על "על מה זה?", אבל אף אחת מהן לא עונה על השאלה שבאמת חשובה כשמנסים לסיים חשיבה: מה אני עדיין לא יודע? השאלות הפתוחות נשארות בראש, נשכחות, ונחקרות מחדש כעבור חודשים.',
        en: 'Most note systems optimise for capture, so they fill up with highlights and meeting notes that nobody reads again. Folders answer "where does this go?", tags answer "what is this about?", but neither answers the question that matters when you are trying to finish a piece of thinking: what do I still not know? Open questions live in people’s heads, get forgotten, and get re-researched months later.',
      },
      solution: {
        he: 'השאלה היא יחידת הארגון. כל פתק מתויק תחת שאלה, השאלות מדורגות לפי גיל ולפי כמות הראיות שהצטברו, ותשובה לשאלה הופכת אותה ל-Lemma שאפשר לצטט. סקירה שבועית של Lemmas מתיישנות מעלה תשובות ישנות כדי שייבדקו מחדש במקום להתאבן. הלכידה עדיין לוקחת שלוש שניות: מקלידים פתק, בוחרים שאלה מההצעות או כותבים חדשה.',
        en: 'Make the question the unit of organisation. Every note is filed under a question, questions are ranked by age and by accumulated evidence, and answering a question turns it into a citable lemma. A weekly "stale lemma" review resurfaces old answers so beliefs get re-checked instead of fossilising. Quick capture still takes three seconds: type the note, pick a question from the suggestions or write a new one.',
      },
      usp: {
        he: 'לא עוד מחברת של תיקיות וקישורים: Lemma מראה לכם את קו הגבול של הידע שלכם, מדרגת על מה כדאי לחשוב עכשיו, ושומרת על היושרה של תשובות סגורות – היא פותחת אותן מחדש כשמגיעות ראיות חדשות.',
        en: 'Not another folder-and-backlink notebook: Lemma shows you the frontier of your own knowledge, ranks what to think about next, and keeps settled answers honest by reopening them when new evidence lands.',
      },
      targetUsers: {
        he: ['סטודנטים לתארים מתקדמים וחוקרים שמנהלים מחקר ארוך', 'מנהלי מוצר ואנליסטים בשלב הדיסקברי', 'כותבי עיון ויזמים שחושבים דרך כתיבה'],
        en: ['Graduate students and researchers running a long investigation', 'Product managers and analysts doing discovery work', 'Non-fiction writers and founders who think in writing'],
      },
      coreFeatures: {
        he: [
          'לכידה ששואלת תמיד "על איזו שאלה זה עונה?" עם הצעות חכמות',
          'מסך בית של שאלות פתוחות, מדורג לפי גיל וכמות ראיות',
          'סגירת שאלה בתשובה של שורה אחת שהופכת ל-Lemma שאפשר לצטט',
          'סימון סתירה: פתק שסותר Lemma פותח את השאלה מחדש',
          'סקירה שבועית של Lemmas ישנות מסף גיל שבוחרים',
          'עץ שאלות: תת-שאלות מתגלגלות לשאלת האם',
          'חיפוש טקסט מלא בשאלות, בפתקים וב-Lemmas',
        ],
        en: [
          'Capture that always asks "which question does this answer?" with smart suggestions',
          'Open-questions home ranked by age and evidence count',
          'Close a question with a one-line answer that becomes a citable lemma',
          'Contradiction flag: a note that disagrees with a lemma reopens the question',
          'Weekly review of stale lemmas older than a chosen threshold',
          'Question tree: sub-questions roll up into the parent',
          'Full-text search across questions, notes and lemmas',
        ],
      },
      screens: [
        { name: { he: 'שאלות פתוחות', en: 'Open questions' }, description: { he: 'רשימה מדורגת של שאלות פתוחות, לכל אחת מונה ראיות, גיל ורמז התקדמות; משיכה למטה פותחת לכידה מהירה.', en: 'Ranked list of open questions, each with an evidence count, age and a progress hint; pull down for quick capture.' } },
        { name: { he: 'לכידה מהירה', en: 'Quick capture' }, description: { he: 'שדה טקסט אחד ומתחתיו שורת צ׳יפים של שאלות מוצעות; שאלה חדשה נכתבת באותו מקום.', en: 'A single text field with a chip row of suggested questions underneath; a new question can be typed inline.' } },
        { name: { he: 'שאלה', en: 'Question' }, description: { he: 'השאלה למעלה, הפתקים ערומים לפי זמן מתחתיה, תת-שאלות בצד, וכפתור "לסגור עם תשובה".', en: 'The question at the top, notes stacked chronologically beneath it, sub-questions on the side, and a "close with an answer" action.' } },
        { name: { he: 'ספריית Lemmas', en: 'Lemma library' }, description: { he: 'תשובות סגורות ככרטיסים קומפקטיים עם מונה ראיות ותאריך הבדיקה האחרונה; הישנות מסומנות בגוון.', en: 'Settled answers as compact cards with their evidence count and the date they were last checked; stale ones are tinted.' } },
        { name: { he: 'סקירה שבועית', en: 'Weekly review' }, description: { he: 'מעבר בהחלקה על Lemmas מתיישנות: להשאיר, לפתוח מחדש או לגנוז, עם ספירה של מה שנשאר.', en: 'A swipe-through of stale lemmas: keep, reopen, or retire, with a running count of what is left.' } },
        { name: { he: 'חיפוש', en: 'Search' }, description: { he: 'חיפוש אחד בשאלות, בפתקים וב-Lemmas עם סינון לפי סטטוס ותאריך.', en: 'One search across questions, notes and lemmas with filters by status and date.' } },
      ],
      userJourney: {
        he: [
          'מנהלת מוצר פותחת את האפליקציה עם השאלה "למה משתמשי ניסיון נוטשים ביום השלישי?"',
          'במשך שבועיים היא מתייקת תחתיה שבעה פתקים מראיונות ומאנליטיקס',
          'השאלה מטפסת לראש מסך הבית ככל שהראיות מצטברות',
          'היא סוגרת אותה בתשובה של שורה אחת, שהופכת ל-Lemma ששאלת התמחור שלה יכולה לצטט',
          'חודש אחר כך פתק מראיון חדש סותר את ה-Lemma והשאלה נפתחת מחדש',
        ],
        en: [
          'A product manager opens the app with the question "why do trial users drop off on day three?"',
          'Over two weeks she files seven notes from interviews and analytics under it',
          'The question climbs to the top of the home screen as evidence accumulates',
          'She closes it with a one-line answer, which becomes a lemma her pricing question can cite',
          'A month later a new interview note contradicts the lemma and the question reopens',
        ],
      },
      uxDirection: {
        he: 'עריכתי וממוקד טקסט: רקע שמנת חמים, סריף לשאלות וסאנס אנושי לפתקים, ריווח שורות נדיב. לכל שאלה פתוחה פס גיל דק שמתכהה עם הזמן. בלי תצוגות גרף ובלי אימוג׳ים – הממשק צריך להרגיש כמו יומן מחקר מסודר.',
        en: 'Editorial and text-first: a warm off-white canvas, a serif for questions and a humanist sans for notes, generous line height. Open questions carry a thin age bar that darkens over time. No graph views and no emojis – the interface should feel like a well-kept research journal.',
      },
      architecture: {
        he: 'Expo עם Expo Router למובייל וגרסת ווב מאותו קוד. אחסון local-first ב-expo-sqlite כדי שהלכידה לעולם לא תחכה לרשת, עם Supabase (Postgres + Auth) כיעד סנכרון ומיזוג last-write-wins פשוט לכל שורה. חיפוש טקסט מלא רץ מקומית על SQLite. הדירוג וזיהוי ההתיישנות הם פונקציות טהורות על נתונים מקומיים, כך שהאפליקציה עובדת לגמרי אופליין.',
        en: 'Expo with Expo Router for mobile and a web build from the same codebase. Local-first storage in expo-sqlite so capture never waits on the network, with Supabase (Postgres + Auth) as the sync target and a simple last-write-wins merge per row. Full-text search runs locally over SQLite. Ranking and stale detection are pure functions over local data, so the app works fully offline.',
      },
      stack: ['Expo', 'Expo Router', 'expo-sqlite', 'Supabase', 'Supabase Auth', 'Zustand'],
      database: {
        he: ['questions – טקסט, סטטוס (פתוחה/סגורה/גנוזה), שאלת אם, תאריכי יצירה וסגירה', 'notes – גוף, שאלה, מקור, סימון סתירה', 'lemmas – שאלה, תשובה בשורה אחת, תאריך בדיקה אחרון', 'citations – Lemma שמצוטטת מפתק או משאלה אחרת', 'reviews – ריצות סקירה שבועית וההחלטות בהן'],
        en: ['questions – text, status (open/closed/retired), parent question, created and closed dates', 'notes – body, question, source, contradiction flag', 'lemmas – question, one-line answer, last-checked date', 'citations – a lemma referenced by a note or another question', 'reviews – weekly review runs and their decisions'],
      },
      auth: {
        he: 'עובד בלי חשבון במצב מקומי בלבד. כניסה עם Apple, Google או קישור קסם באימייל פותחת סנכרון; כל הטבלאות מוגנות ב-RLS לפי משתמש והפתקים לעולם לא משותפים.',
        en: 'Works without an account in local-only mode. Signing in with Apple, Google or an email magic link unlocks sync; all tables use per-user RLS and notes are never shared.',
      },
      monetization: {
        he: ['גרסה מקומית חינם; מנוי חודשי או שנתי לסנכרון, לגישה מהווב ולגיבויים', 'תמחור אקדמי למעבדות ולקבוצות מחקר', 'תבניות שאלות בתשלום לדיסקברי, לסקירת ספרות ולבדיקת נאותות'],
        en: ['Free local-only tier; monthly or yearly subscription for sync, web access and backups', 'Education pricing for labs and research groups', 'Paid question templates for discovery, literature review and due diligence'],
      },
      mvpMilestones: {
        he: ['מודל נתונים מקומי: שאלות, פתקים, Lemmas, עם לכידה ומסך השאלות הפתוחות', 'תהליך סגירה-עם-תשובה וספריית ה-Lemmas', 'דירוג לפי גיל וראיות, פלוס סימון סתירה', 'סקירה שבועית של Lemmas מתיישנות', 'סנכרון Supabase ומסך מנוי'],
        en: ['Local data model: questions, notes, lemmas, with capture and the open-questions home', 'Close-with-answer flow and the lemma library', 'Ranking by age and evidence, plus the contradiction flag', 'Weekly stale-lemma review', 'Supabase sync and subscription paywall'],
      },
      risks: {
        he: ['הכלל "קודם שאלה" מוסיף חיכוך בלכידה – ההצעות חייבות להיות מצוינות, אחרת אנשים ינטשו', 'משתמשים כבדים יבקשו תיקיות ותגיות רגילות; להגיד לא זה חלק מהמוצר', 'קונפליקטים בסנכרון באפליקציה עתירת טקסט דורשים בדיקות קפדניות לפני השקה'],
        en: ['The question-first rule adds friction at capture – suggestions must be very good or people will abandon it', 'Power users will ask for the usual folders and tags; saying no is part of the product', 'Sync conflicts in a text-heavy app need careful testing before launch'],
      },
      expansion: {
        he: ['לוחות שאלות משותפים לצוותי מחקר קטנים', 'ייבוא הדגשות מאפליקציות קריאה-מאוחר-יותר ישירות לתוך שאלה', 'ייצוא שאלה סגורה עם הראיות שלה כמסמך של עמוד אחד'],
        en: ['Shared question boards for small research teams', 'Import highlights from read-later apps straight into a question', 'Export a closed question with its evidence as a one-page memo'],
      },
    },
  },
  {
    id: 'leftoff',
    name: { he: 'Leftoff – להמשיך מאיפה שעצרת', en: 'Leftoff' },
    tagline: {
      he: 'שומרים את נקודת העצירה בלחיצה אחת לפני ההפרעה, וחוזרים לעבודה תוך שניות – עם מפה שבועית של מי ומה מוציא אתכם מהריכוז.',
      en: 'Park what you were doing in one tap before an interruption, and get back into it in seconds – with a weekly map of who and what keeps pulling you out.',
    },
    category: 'productivity',
    secondaryCategories: ['devtools', 'business'],
    difficulty: 'intermediate',
    effort: { weeksMin: 3, weeksMax: 5 },
    budget: 'free',
    businessModel: 'one-time',
    platforms: ['ios', 'android'],
    audience: ['professionals', 'developers'],
    tags: ['focus', 'interruptions', 'context switching', 'deep work', 'attention', 'time tracking', 'flow'],
    identity: { hue: 20, glyph: 'Lo', pattern: 'wave' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: true, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Leftoff מתייחסת להפרעה – לא למשימה – כיחידת העבודה. כשעמית מגיע לשולחן, פגישה מתחילה או הילד קורא, לוחצים על כפתור אחד ומקלידים שורה אחת: מה עשיתם ומה הצעד הבא ממש. השורה נדחפת לערימה. כשחוזרים, הערימה מציגה בדיוק את המשפט שצריך כדי להמשיך, והאפליקציה מודדת בשקט כמה זמן נעדרתם וכמה זמן לקח לכם באמת לחזור לעבודה. במהלך שבוע המדידות האלה הופכות למפת הפרעות: אילו שעות, אילו אנשים ואילו סוגי עבודה מתפצלים הכי הרבה. במקום לנדנד לכם להתרכז, היא נותנת לכם את הראיות שצריך כדי לנהל מחדש את היום – להזיז פגישה קבועה, לרכז את הסלאק, או להגן על השעה שתמיד הולכת לאיבוד.',
        en: 'Leftoff treats the interruption, not the task, as the unit of work. When a colleague taps you on the shoulder, a meeting starts or a child calls, you hit one button and type a single line: what you were doing and the very next step. That line is pushed onto a stack. When you come back, the stack shows the exact sentence you need to resume, and the app quietly measures how long you were away and how long it took you to actually pick the work back up. Over a week those measurements become an interruption map: which hours, which people and which kinds of work get fragmented most. Instead of nagging you to focus, it hands you the evidence you need to renegotiate your day – move a recurring meeting, batch Slack, or protect the one hour that is always lost.',
      },
      problem: {
        he: 'עובדי ידע מפסידים זמן לא רק בהפרעה עצמה אלא בעיקר בחזרה ממנה: אחרי שאלה של חמש דקות, למצוא שוב את המקום, לפתוח את הקבצים הנכונים ולבנות מחדש את המודל בראש יכול לקחת יותר מהשאלה עצמה. טיימרים לריכוז מניחים שאתם שולטים ביומן; לרוב האנשים אין שליטה כזאת. ולאף אחד אין נתונים על מה באמת מפצל לו את היום, אז שום דבר לא משתנה.',
        en: 'Knowledge workers lose time not only to the interruption itself but to re-entry: after a five-minute question, finding your place again, reopening the right files and rebuilding the mental model can take longer than the question did. Focus timers assume you control your calendar; most people do not. And nobody has data on what actually fragments their day, so nothing changes.',
      },
      solution: {
        he: 'כפתור "עצירה" אחד שלוכד מה עשיתם ומה הצעד הבא, ערימת חזרה שמציבה את המשפט הזה מולכם כשאתם חוזרים, ומדידה פסיבית של זמן ההיעדרות וזמן החזרה לעבודה. מפת ההפרעות השבועית מקבצת הפרעות לפי שעה, מקור וסוג עבודה, עם רשימה קצרה של שינויים קונקרטיים לנסות. אינטגרציה ליומן יכולה לעצור אוטומטית כשפגישה מתחילה.',
        en: 'A one-tap "park" that captures what you were doing and the next step, a resume stack that puts that sentence in front of you when you return, and passive measurement of time away and re-entry time. The weekly interruption map groups interruptions by hour, source and type of work, with a short list of concrete changes to try. Calendar integration can auto-park when a meeting starts.',
      },
      usp: {
        he: 'לא טיימר ריכוז ולא חוסם אפליקציות: Leftoff היא הכלי היחיד שהאובייקט המרכזי שלו הוא ההפרעה, ולכן היא עובדת גם בימים שלא אתם שולטים בהם – ונותנת ראיות במקום רגשות אשם.',
        en: 'Not a focus timer and not a blocker: Leftoff is the only tool whose core object is the interruption, so it works on the days you do not control – and gives you evidence instead of guilt.',
      },
      targetUsers: {
        he: ['מפתחים ומעצבים שהעבודה שלהם דורשת רצפים ארוכים של ריכוז', 'מנהלים שקופצים בין פגישות לבין תוצרים משלהם', 'הורים שעובדים מהבית עם הפרעות בלתי צפויות'],
        en: ['Developers and designers whose work needs long stretches of concentration', 'Managers who bounce between meetings and their own deliverables', 'Parents working from home with unpredictable interruptions'],
      },
      coreFeatures: {
        he: [
          'עצירה בלחיצה אחת ממסך הנעילה או מווידג׳ט: מה עשיתי + הצעד הבא',
          'ערימת חזרה שמציגה בדיוק את המשפט שממנו ממשיכים',
          'תזמון פסיבי של זמן ההיעדרות וזמן החזרה לעבודה לכל הפרעה',
          'תיוג המקור בלחיצה: אדם, פגישה, סלאק, בית, אני',
          'מפת הפרעות שבועית לפי שעה, מקור וסוג עבודה',
          'ניסויים מוצעים: להזיז פגישה, לרכז הודעות, להגן על שעה אחת',
          'עצירה אוטומטית כשאירוע ביומן מתחיל',
        ],
        en: [
          'One-tap park from the lock screen or a widget: what I was doing + next step',
          'Resume stack that surfaces the exact sentence to pick up from',
          'Passive timing of time away and re-entry time per interruption',
          'Tag the source in one tap: person, meeting, Slack, home, self',
          'Weekly interruption map by hour, source and type of work',
          'Suggested experiments: move a meeting, batch messages, protect one hour',
          'Auto-park when a calendar event starts',
        ],
      },
      screens: [
        { name: { he: 'עצירה', en: 'Park' }, description: { he: 'שדה טקסט במסך מלא עם השאלה "מה עשית ומה הצעד הבא?", שורת צ׳יפים למקור וכפתור עצירה אחד גדול.', en: 'A full-screen text field with the prompt "What were you doing and what is the next step?", a row of source chips and one big Park button.' } },
        { name: { he: 'ערימת חזרה', en: 'Resume stack' }, description: { he: 'כרטיסים בערימה, החדש למעלה; הכרטיס העליון מציג את משפט החזרה, זמן ההיעדרות וכפתור "חזרתי" שעוצר את השעון.', en: 'Cards stacked newest-first; the top card shows the resume sentence, time away and a "picked up" button that stops the clock.' } },
        { name: { he: 'היום', en: 'Today' }, description: { he: 'ציר זמן אופקי של היום עם בלוקים של עבודה ופערי הפרעות בקנה מידה אמיתי.', en: 'A horizontal timeline of the day with work blocks and interruption gaps drawn to scale.' } },
        { name: { he: 'מפת השבוע', en: 'Weekly map' }, description: { he: 'רשת חום של שעות לפי יום, רשימה מדורגת של מקורות, ושלושת הניסויים המוצעים לשבוע הבא.', en: 'A heat grid of hours by weekday, a ranked list of sources, and the three experiments suggested for next week.' } },
        { name: { he: 'הקשרים שננטשו', en: 'Abandoned' }, description: { he: 'הקשרים שנעצרו ומעולם לא חזרו אליהם, כדי שעבודה שנשכחה תוכל להינצל או להיסגר.', en: 'Contexts that were parked but never resumed, so forgotten work can be rescued or closed.' } },
        { name: { he: 'הגדרות', en: 'Settings' }, description: { he: 'חיבור יומן, הגדרת ווידג׳ט, רשימת מקורות וייצוא נתונים; הכול נשאר במכשיר.', en: 'Calendar connection, widget setup, source list and data export; everything stays on the device.' } },
      ],
      userJourney: {
        he: [
          'מפתחת באמצע באג מסובך כשחבר לצוות מבקש עזרה',
          'היא לוחצת על הווידג׳ט, מקלידה "באג: משתמש null בצ׳ק-אאוט – הבא: לבדוק את ה-session hook" ומתייגת "אדם"',
          'אחרי עשרים דקות היא פותחת את ערימת החזרה וממשיכה בדיוק מהמשפט הזה',
          'ביום שישי מפת השבוע מראה שרוב ההפרעות נוחתות בין 10 ל-11',
          'היא מזיזה את הסנכרון היומי ומגנה על השעה הזאת בשבוע שאחרי',
        ],
        en: [
          'A developer is mid-way through a tricky bug when a teammate asks for help',
          'She taps the widget, types "bug: null user in checkout – next: check the session hook" and tags "person"',
          'Twenty minutes later she opens the resume stack and continues from that exact sentence',
          'On Friday the weekly map shows that most interruptions land between 10 and 11',
          'She moves her daily sync and protects that hour the following week',
        ],
      },
      uxDirection: {
        he: 'בנוי ליד שכבר נמשכת החוצה: מסך העצירה נפתח בפחות משנייה, עם שדה קלט ענק וכפתור אחד, ולעולם לא שואל שאלה שנייה. ניטרלים חמים עם צבע הדגשה אחד להקשר הפעיל. מפת השבוע שואלת ממפות חום של יומנים ולא מדשבורדים; מסך אחד, בלי גרפים שגוללים.',
        en: 'Built for a hand that is already being pulled away: the park screen opens in under a second, uses a huge input and one button, and never asks a second question. Warm neutrals with a single accent for the active context. The weekly map borrows from calendar heat maps rather than dashboards; one screen, no scrolling charts.',
      },
      architecture: {
        he: 'Expo עם Expo Router; כל הנתונים ב-expo-sqlite על המכשיר, בלי שרת בכלל. ווידג׳טים למסך הנעילה ולמסך הבית דרך הרחבות ווידג׳ט נייטיב (אבן דרך מאוחרת ב-iOS). expo-calendar קורא אירועים לעצירה אוטומטית; expo-notifications מזכיר הקשר שלא חזרו אליו. הצבירה השבועית רצה מקומית; הייצוא הוא קובץ CSV דרך ה-share sheet.',
        en: 'Expo with Expo Router; all data in expo-sqlite on the device, no server at all. Lock-screen and home-screen widgets through native widget extensions (a later milestone on iOS). expo-calendar reads events to auto-park; expo-notifications reminds you of a context that was never picked up. Weekly aggregation runs locally; export is a CSV through the share sheet.',
      },
      stack: ['Expo', 'Expo Router', 'expo-sqlite', 'expo-calendar', 'expo-notifications', 'Reanimated'],
      database: {
        he: ['contexts – משפט חזרה, צעד הבא, זמן עצירה, זמן חזרה, מקור', 'sources – מקורות הפרעה שהמשתמש הגדיר, עם צבע', 'sessions – בלוקים של עבודה שנגזרים מזוגות עצירה/חזרה', 'experiments – שינוי מוצע, שבוע, האם נוסה', 'settings – מזהי יומן, העדפות ווידג׳ט'],
        en: ['contexts – resume sentence, next step, parked at, resumed at, source', 'sources – user-defined interruption sources with a colour', 'sessions – work blocks derived from park/resume pairs', 'experiments – suggested change, week, whether it was tried', 'settings – calendar ids, widget preferences'],
      },
      auth: {
        he: 'בלי חשבון ובלי כניסה: הכול חי על המכשיר. גיבוי אופציונלי דרך מערכת ההפעלה, וייצוא מקומי למי שמחליף טלפון.',
        en: 'No account and no sign-in: everything lives on the device. Optional device backup through the OS, and a local export for people who switch phones.',
      },
      monetization: {
        he: ['רכישה חד-פעמית אחרי תקופת ניסיון, בלי מנוי', 'אפליקציית דסקטופ נלווית שנמכרת בנפרד', 'תוסף אופציונלי לדוח צוותי עם דפוסים מצטברים ואנונימיים'],
        en: ['One-time purchase after a free trial, no subscription', 'Paid desktop companion app sold separately', 'Optional team report add-on with aggregated, anonymised patterns'],
      },
      mvpMilestones: {
        he: ['תהליך עצירה וחזרה עם אחסון מקומי', 'תזמון פסיבי וציר הזמן של היום', 'תיוג מקורות ומפת ההפרעות השבועית', 'עצירה אוטומטית מהיומן ותזכורות על הקשרים שלא חזרו אליהם', 'ווידג׳טים ופתיחה בתשלום'],
        en: ['Park and resume flow with local storage', 'Passive timing and the Today timeline', 'Source tagging and the weekly interruption map', 'Calendar auto-park and never-resumed reminders', 'Widgets and paid unlock'],
      },
      risks: {
        he: ['כל המודל תלוי בלחיצה על עצירה לפני ההפרעה – הווידג׳ט חייב להיות מהיר יותר מהרפלקס פשוט להסתובב', 'מדידת החזרה דורשת לחיצת "חזרתי" כנה; לחיצות עצלניות יעוותו את המפה', 'ווידג׳טים נייטיב הם החלק הקשה ביותר בבנייה למפתח Expo'],
        en: ['The whole model depends on tapping park before the interruption – the widget must be faster than the reflex to just turn around', 'Measuring re-entry needs an honest "picked up" tap; lazy tapping will skew the map', 'Native widgets are the hardest part of the build for an Expo developer'],
      },
      expansion: {
        he: ['אפליקציית דסקטופ שלוכדת אוטומטית את החלונות והקבצים הפתוחים בזמן העצירה', 'סטטוס סלאק שמתעדכן כשאתם בשעה מוגנת', 'תצוגת "נימוסי הפרעה" משותפת לצוותים שרוצים לרכז שאלות'],
        en: ['Desktop app that captures the open windows and files automatically on park', 'Slack status that updates when you are in a protected hour', 'Shared "interruption etiquette" view for teams that want to batch questions'],
      },
    },
  },
  {
    id: 'runsheet',
    name: { he: 'Runsheet – השיעור נגמר בזמן', en: 'Runsheet' },
    tagline: {
      he: 'תוכנית שיעור שמריצה את עצמה בכיתה: מקטעים מתוזמנים על שעון גדול, וכשהדיון מתארך היא מתכננת מחדש את שארית השיעור ואומרת מה לקצר.',
      en: 'A lesson plan that runs itself in class: timed segments on a big clock that re-plan the rest of the period when a discussion runs long.',
    },
    category: 'productivity',
    secondaryCategories: ['education'],
    difficulty: 'intermediate',
    effort: { weeksMin: 4, weeksMax: 6 },
    budget: 'low',
    businessModel: 'freemium',
    platforms: ['cross-platform'],
    audience: ['professionals'],
    tags: ['teachers', 'lesson plan', 'classroom', 'timer', 'pacing', 'education', 'school'],
    identity: { hue: 150, glyph: 'Rs', pattern: 'grid' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Runsheet לוקחת רעיון משידור חי בטלוויזיה: כל שיעור הוא רצף של מקטעים מתוזמנים – פתיחה, הסבר, עבודה בקבוצות, כרטיס יציאה – והאפליקציה מריצה אותו על שעון גדול וקריא בטלפון או בטאבלט של המורה. העיקר הוא מה קורה כשהתוכנית נשברת. דיון שהיה אמור לקחת חמש דקות לוקח שתים-עשרה; במקום טיימר סטטי שפשוט נהיה אדום, Runsheet מחשבת מחדש את המקטעים שנותרו, מכווצת את אלה שסומנו כגמישים ומראה למורה בדיוק מה לקצר, כדי שהשיעור עדיין ייגמר בכרטיס יציאה ולפני הצלצול. אחרי השיעור, לחיצה אחת מתעדת מה קרה בפועל לעומת התוכנית, כך שהגרסה של השיעור בשנה הבאה מתחילה מהמציאות ולא מאופטימיות. המקטעים ניתנים לשימוש חוזר, כך שמורה בונה לעצמו בנק אישי של פתיחות, פעילויות וסיומים שמתחברים לשיעורים חדשים תוך דקות.',
        en: 'Runsheet borrows an idea from live television: every lesson is a run sheet of timed segments – warm-up, explanation, group work, exit ticket – and the app runs it on a big, glanceable clock on the teacher’s phone or tablet. The point is what happens when the plan breaks. A discussion that should have taken five minutes takes twelve; instead of a static timer quietly going red, Runsheet recalculates the remaining segments, shrinks the ones marked flexible, and shows the teacher exactly what to cut so the lesson still ends with the exit ticket, before the bell. After class, one tap records what actually happened versus the plan, so next year’s version of the lesson starts from reality instead of optimism. Segments are reusable, so a teacher builds a personal bank of openers, activities and closers that snap together into new lessons in minutes.',
      },
      problem: {
        he: 'שיעורים כמעט אף פעם לא הולכים לפי התוכנית, והקורבן הוא כמעט תמיד הסוף: הסיכום, כרטיס היציאה, הסבר שיעורי הבית. מורים מתכננים על נייר או במסמך, ואז מנהלים את הזמן במבט לשעון הקיר תוך כדי ניהול שלושים ילדים. טיימרים רגילים לא יודעים מה הבא בתור, ולכן לא יכולים להגיד על מה לוותר.',
        en: 'Lessons rarely go to plan, and the casualty is almost always the end: the summary, the exit ticket, the homework explanation. Teachers plan on paper or in a doc, then manage time by glancing at a wall clock while also managing thirty people. Generic timers do not know what comes next, so they cannot tell you what to drop.',
      },
      solution: {
        he: 'רצף מקטעים עם משך, רמת גמישות והערה אופציונלית, שרץ על שעון חי וגדול. כשמקטע חורג, שארית התוכנית מאוזנת מחדש אוטומטית והקיצוץ מוצג כהצעה אחת. יומן אחרי-שיעור לוכד תזמונים בפועל, ובנק מקטעים הופך שיעורים קודמים לאבני בניין.',
        en: 'A run sheet of segments with a duration, a flexibility level and an optional note, executed on a large live clock. When a segment overruns, the remaining plan is re-balanced automatically and the cut is shown as a single suggestion. A post-lesson log captures actual timings, and a segment bank turns past lessons into building blocks.',
      },
      usp: {
        he: 'הטיימר היחיד לכיתה שמכיר את שארית השיעור: הוא מתכנן מחדש תוך כדי תנועה במקום רק להאדים, ולומד ממה שקרה בפועל כדי שהתוכניות ייעשו כנות יותר משנה לשנה.',
        en: 'The only classroom timer that knows the rest of the lesson: it re-plans on the fly instead of just turning red, and it learns from what actually happened so plans get more honest every year.',
      },
      targetUsers: {
        he: ['מורים בחטיבה ובתיכון שמלמדים שיעורים של 45–90 דקות', 'מורים חדשים וסטודנטים להוראה שמתקשים בקצב', 'מרצים, מנחי סדנאות ומדריכים בארגונים'],
        en: ['Middle- and high-school teachers running 45–90 minute periods', 'New teachers and student teachers who struggle with pacing', 'Lecturers, workshop facilitators and corporate trainers'],
      },
      coreFeatures: {
        he: [
          'בניית שיעור ממקטעים מתוזמנים עם רמת גמישות (קבוע, גמיש, אופציונלי)',
          'מצב ריצה חי עם שעון גדול, המקטע הנוכחי והבא בתור בתצוגה',
          'תכנון מחדש אוטומטי כשמקטע חורג, עם הצעת "מה לקצר" אחת וברורה',
          'תבניות שיעור לפי מערכת השעות של בית הספר, כולל שיעורים כפולים',
          'יומן אחרי-שיעור: מתוכנן מול בפועל, עם משפט רפלקציה אחד',
          'בנק מקטעים של פתיחות, פעילויות וסיומים לשימוש חוזר',
          'רמזים שקטים: רטט או שינוי צבע עדין במקום צלצולים',
        ],
        en: [
          'Build a lesson from timed segments with a flexibility level (fixed, flexible, optional)',
          'Live run mode with a large clock, the current segment and the next one in view',
          'Automatic re-plan when a segment overruns, with one clear "what to cut" suggestion',
          'Period presets for the school timetable, including double periods',
          'Post-lesson log: planned versus actual, with a one-line reflection',
          'Segment bank of reusable openers, activities and closers',
          'Silent cues: vibration or a subtle colour change instead of alarms',
        ],
      },
      screens: [
        { name: { he: 'שיעורים', en: 'Lessons' }, description: { he: 'השיעורים של היום לפי שעה, עם כפתור "הרצה" על הבא בתור וגישה מהירה לבנק המקטעים.', en: 'Today’s lessons by period, with a "run" button on the next one and quick access to the segment bank.' } },
        { name: { he: 'בונה שיעור', en: 'Lesson builder' }, description: { he: 'רשימה אנכית של מקטעים עם בוררי משך ומתג גמישות; הסכום מתעדכן מול אורך השיעור.', en: 'A vertical list of segments with duration steppers and a flexibility toggle; the total updates against the period length.' } },
        { name: { he: 'הרצה', en: 'Run' }, description: { he: 'שעון ענק, שם המקטע הנוכחי, המקטע הבא ופס התקדמות דק לכל השיעור; לחיצה כדי להתקדם מוקדם.', en: 'A huge clock, the current segment name, the next segment and a thin progress bar for the whole period; tap to advance early.' } },
        { name: { he: 'תכנון מחדש', en: 'Re-plan sheet' }, description: { he: 'עולה מלמטה כשיש חריגה: הקיצוץ המוצע, התזמונים החדשים ושני כפתורים – לאשר או להמשיך כרגיל.', en: 'Slides up on overrun: the proposed cut, the new timings and two buttons – accept or keep going.' } },
        { name: { he: 'דיבריף', en: 'Debrief' }, description: { he: 'פסים של מתוכנן מול בפועל לכל מקטע ושדה טקסט אחד לרפלקציה, שנשמר לשיעור.', en: 'Planned versus actual bars per segment and a single text field for a reflection, saved to the lesson.' } },
        { name: { he: 'בנק מקטעים', en: 'Segment bank' }, description: { he: 'כרטיסים ניתנים לחיפוש של מקטעים לשימוש חוזר, מקובצים לפי תפקיד: פתיחה, ליבה, תרגול, סיום.', en: 'Searchable cards of reusable segments grouped by role: opener, core, practice, closer.' } },
      ],
      userJourney: {
        he: [
          'מורה להיסטוריה בונה שיעור של 45 דקות מחמישה מקטעים בערב שלפני',
          'בכיתה היא מעמידה את הטאבלט על השולחן ולוחצת על הרצה',
          'מקטע הדיון חורג בשש דקות; מסך התכנון מחדש מציע לקצר את דף העבודה',
          'היא מאשרת, וכרטיס היציאה עדיין מתקיים לפני הצלצול',
          'אחרי השיעור היא מתעדת את התזמונים בפועל ושומרת את מקטע הדיון לבנק שלה',
        ],
        en: [
          'A history teacher builds a 45-minute lesson from five segments the evening before',
          'In class she props the tablet on the desk and taps run',
          'The debate segment overruns by six minutes; the re-plan sheet suggests shortening the worksheet',
          'She accepts, and the exit ticket still happens before the bell',
          'After class she logs the actual timings and saves the debate segment to her bank',
        ],
      },
      uxDirection: {
        he: 'מעוצב כך שאפשר לקרוא אותו ממרחק שני מטרים: מסך הריצה הוא בעיקר מספר אחד בפונט כבד, ניגודיות גבוהה, בלי קישוטים. כל השאר רגוע ודמוי טופס. צבע משמש רק לרמות גמישות ולמצב חריגה; שום דבר לא מהבהב, כי שלושים תלמידים מסתכלים על אותו מסך.',
        en: 'Designed to be read from two metres away: the run screen is mostly a single number in a heavy typeface, high contrast, no decoration. Everything else is calm and form-like. Colour is used only for flexibility levels and the overrun state; nothing flashes, because thirty students are watching the same screen.',
      },
      architecture: {
        he: 'Expo עם Expo Router, רץ על טלפון, טאבלט וווב מאותו קוד. שיעורים ומקטעים ב-expo-sqlite כדי שמצב הריצה לעולם לא יהיה תלוי ב-Wi-Fi של בית הספר; expo-keep-awake משאיר את המסך דולק בזמן ריצה. Supabase מסנכרן את בנק המקטעים ואת היסטוריית השיעורים למשתמשים משלמים. לוגיקת התכנון מחדש היא פונקציה טהורה קטנה על משכי מקטעים ורמות גמישות, עם בדיקות יחידה מול אורכי השיעור המקובלים.',
        en: 'Expo with Expo Router, running on phone, tablet and the web from one codebase. Lessons and segments in expo-sqlite so run mode never depends on school Wi-Fi; expo-keep-awake keeps the screen on during a run. Supabase syncs the segment bank and lesson history for paying users. The re-plan logic is a small pure function over segment durations and flexibility levels, unit-tested against the standard period lengths.',
      },
      stack: ['Expo', 'Expo Router', 'expo-sqlite', 'expo-keep-awake', 'Supabase', 'RevenueCat'],
      database: {
        he: ['lessons – כותרת, מקצוע, אורך שיעור, תאריך, כיתה', 'segments – שיעור, סדר, שם, דקות מתוכננות, גמישות, הערות', 'runs – שיעור, זמן התחלה, זמן סיום', 'run_segments – ריצה, מקטע, דקות בפועל, האם קוצץ', 'bank_segments – מקטע לשימוש חוזר עם תפקיד ותגיות', 'profiles – תבניות מערכת שעות וסטטוס מנוי'],
        en: ['lessons – title, subject, period length, date, class', 'segments – lesson, order, name, planned minutes, flexibility, notes', 'runs – lesson, started at, ended at', 'run_segments – run, segment, actual minutes, was cut', 'bank_segments – reusable segment with a role and tags', 'profiles – timetable presets and subscription status'],
      },
      auth: {
        he: 'שמיש לחלוטין בלי חשבון. קישור קסם באימייל או כניסה עם Google פותחים סנכרון של הבנק וההיסטוריה; הנתונים נפרדים לכל מורה עם RLS ולעולם לא כוללים שמות של תלמידים.',
        en: 'Fully usable without an account. An email magic link or Google sign-in unlocks sync of the bank and history; data is per teacher with RLS and never includes student names.',
      },
      monetization: {
        he: ['חינם: בנייה והרצה של שיעורים במכשיר אחד', 'מסלול Pro שנתי: סנכרון, היסטוריית שיעורים, בנק מקטעים בין מכשירים, ייצוא ל-PDF', 'מסלול לבתי ספר עם בנק מקטעים משותף לצוות מקצוע', 'חבילות פתיחה בתשלום של מקטעים למקצועות נפוצים'],
        en: ['Free: build and run lessons on one device', 'Pro yearly plan: sync, lesson history, segment bank across devices, PDF export', 'School plan with shared segment banks for a department', 'Paid starter packs of segments for common subjects'],
      },
      mvpMilestones: {
        he: ['בונה שיעורים עם מקטעים, משכים וגמישות', 'מצב ריצה עם השעון הגדול והתקדמות ידנית', 'זיהוי חריגה ומסך התכנון מחדש', 'דיבריף אחרי שיעור ובנק מקטעים', 'סנכרון, מסך Pro וייצוא ל-PDF'],
        en: ['Lesson builder with segments, durations and flexibility', 'Run mode with the big clock and manual advance', 'Overrun detection and the re-plan sheet', 'Post-lesson debrief and segment bank', 'Sync, Pro paywall and PDF export'],
      },
      risks: {
        he: ['מורים כבר מתמודדים עם המון; אם בניית שיעור לוקחת יותר זמן מלכתוב אותו על נייר, האימוץ ימות', 'מערכות שעות שונות מאוד בין בתי ספר – התבניות חייבות להיות ניתנות לעריכה, לא מונחות מראש', 'מורים כיחידים רגישים למחיר; ייתכן שהמסלול לבתי ספר הוא העסק האמיתי'],
        en: ['Teachers already juggle a lot; if building a lesson takes longer than writing it on paper, adoption dies', 'School timetables vary wildly – presets must be editable, not assumed', 'Individual teachers are price-sensitive; the school plan may be the real business'],
      },
      expansion: {
        he: ['שיתוף תוכנית השיעור עם מורה מחליף בקישור אחד', 'מצב תצוגה לכיתה שמראה רק את הפעילות הנוכחית והזמן שנותר', 'אינטגרציה עם פלטפורמות תכנון השיעורים שבתי ספר כבר משתמשים בהן'],
        en: ['Share a lesson run sheet with a substitute teacher as a single link', 'Class-facing display mode that shows only the current activity and time left', 'Integration with the lesson-planning platforms schools already use'],
      },
    },
  },
  {
    id: 'holdup',
    name: { he: 'Holdup – על מי הצוות מחכה', en: 'Holdup' },
    tagline: {
      he: 'כלי קטן שמתחיל בסלאק ועוקב מי מחכה למי בצוות, מזכיר לאדם הנכון פעם ביום, ומודד כמה זמן לוקח לשחרר חסימה.',
      en: 'A tiny Slack-first tool that tracks who is waiting on whom across a team, nudges the right person once a day, and measures time-to-unblock.',
    },
    category: 'productivity',
    secondaryCategories: ['business', 'devtools'],
    difficulty: 'advanced',
    effort: { weeksMin: 8, weeksMax: 12 },
    budget: 'medium',
    businessModel: 'b2b',
    platforms: ['web'],
    audience: ['teams', 'businesses'],
    tags: ['slack', 'blockers', 'dependencies', 'team', 'async', 'waiting', 'workflow', 'b2b'],
    identity: { hue: 290, glyph: 'Hu', pattern: 'diagonal' },
    flags: { beginnerFriendly: false, profitPotential: 'high', experimental: false, trending: true, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Holdup עושה דבר אחד שכלי ניהול פרויקטים עושים גרוע: היא ממדלת את ההמתנה בין אנשים. כל אחד בצוות יכול להקליד בסלאק /holdup – "מחכה לדנה לאפיון של ה-API" – והבקשה הופכת לתלות עם שעון. דנה מקבלת דייג׳סט יומי אחד של כל מה שהיא מעכבת, מדורג לפי כמה אנשים וכמה ימים נערמו מאחוריה – במקום זרם של פינגים. דשבורד ווב קטן מציג את שרשראות ההמתנה של הצוות, כולל כאלה שעוברות דרך שניים-שלושה אנשים, ואת המדד היחיד שמעניין את Holdup: הזמן עד שחרור החסימה. מנהלים רואים אילו מסירות נתקעות באופן כרוני בלי לקרוא כל ערוץ, ולעובדים יש דרך קלה ונטולת האשמות להגיד "אני תקוע עליך" בלי שזה ירגיש כמו נדנוד.',
        en: 'Holdup does one thing project tools do badly: it models the waiting between people. Anyone on the team can type /holdup in Slack – "waiting on Dana for the API spec" – and the request becomes a tracked dependency with a clock on it. Dana gets a single daily digest of everything she is holding up, ranked by how many people and how many days are stacked behind her, rather than a stream of pings. A small web dashboard shows the team’s waiting chains, including the ones that pass through two or three people, and the one metric Holdup cares about: time-to-unblock. Managers see which handoffs chronically stall without reading every channel, and individuals get an easy, blame-free way to say "I’m stuck on you" that does not feel like nagging.',
      },
      problem: {
        he: 'רוב העיכובים בצוות לא נובעים מעבודה קשה אלא מהמתנה: לסקירה, לתשובה, לאישור, לקובץ. לוחות פרויקטים עוקבים אחרי משימות, לא אחרי המסירות ביניהן, ולכן המתנה של שלושה ימים נשארת בלתי נראית עד שהדדליין מחליק. לשאול עמית שוב מרגיש לא נעים, אז אנשים מחכים בשקט – ומי שחוסם חמישה אחרים בדרך כלל בכלל לא יודע.',
        en: 'Most delays in a team are not caused by hard work but by waiting: a review, an answer, an approval, a file. Project boards track tasks, not the handoffs between them, so a three-day wait is invisible until the deadline slips. Asking a colleague again feels rude, so people wait silently, and the person blocking five others usually has no idea.',
      },
      solution: {
        he: 'פקודת סלאק ופעולה על הודעה שהופכות "מחכה ל-X" לתלות עם מעקב, דייג׳סט יומי לכל חוסם מדורג לפי השפעה, זיהוי שרשראות המתנה בין אנשים, ודשבורד שבנוי סביב הזמן עד שחרור החסימה. סגירה היא לחיצה אחת מכל צד, ושום דבר ב-Holdup לא דורש לשנות את האופן שבו הצוות כבר מנהל משימות.',
        en: 'A Slack command and message action that turn "waiting on X" into a tracked dependency, a once-a-day digest to each blocker ranked by impact, waiting-chain detection across people, and a dashboard built around time-to-unblock. Resolving is one click from either side, and nothing in Holdup requires changing how the team already manages tasks.',
      },
      usp: {
        he: 'היחידה היא המסירה, לא המשימה: Holdup יושבת לצד Jira או Linear במקום להחליף אותם, מצמצמת נדנודים לדייג׳סט יומי מדורג אחד, וחושפת שרשראות המתנה של כמה אנשים ששום לוח לא מראה.',
        en: 'The unit is the handoff, not the task: Holdup sits beside Jira or Linear instead of replacing them, reduces nagging to one ranked daily digest, and surfaces multi-person waiting chains that no board can show.',
      },
      targetUsers: {
        he: ['צוותי מוצר ופיתוח של 10–80 אנשים שחיים בסלאק', 'סוכנויות וסטודיואים שמתמודדים עם אישורי לקוחות', 'צוותי תפעול עם תהליכים עתירי אישורים'],
        en: ['Product and engineering teams of 10–80 people that live in Slack', 'Agencies and studios juggling client approvals', 'Operations teams with approval-heavy workflows'],
      },
      coreFeatures: {
        he: [
          'פקודת /holdup ופעולה על הודעה לרישום "מחכה ל-@אדם ל-X"',
          'דייג׳סט יומי אחד לכל חוסם, מדורג לפי כמות האנשים והימים שנערמו מאחוריו',
          'זיהוי שרשראות המתנה: א׳ מחכה לב׳ שמחכה לג׳',
          'סגירה בלחיצה אחת מסלאק או מהדשבורד, מכל צד',
          'מדד זמן-עד-שחרור לכל אדם, צוות וסוג בקשה',
          'שעות שקט ומודעות לחופשות, כך שתזכורות לעולם לא נוחתות ביום חופש',
          'סיכום שבועי לצוות של מסירות כרוניות שמתפרסם בערוץ',
        ],
        en: [
          '/holdup command and a message action to log "waiting on @person for X"',
          'One daily digest per blocker, ranked by people and days stacked behind them',
          'Waiting-chain detection: A waits on B who waits on C',
          'One-click resolve from Slack or the dashboard, by either side',
          'Time-to-unblock metric per person, team and request type',
          'Quiet hours and vacation awareness so nudges never land on a day off',
          'Weekly team summary of chronic handoffs posted to a channel',
        ],
      },
      screens: [
        { name: { he: 'דייג׳סט בסלאק', en: 'Slack digest' }, description: { he: 'הודעת סלאק לכל חוסם בבוקר: רשימה מדורגת של מה שהוא מעכב, עם כפתורי סגירה ו"צריך עוד זמן".', en: 'A Slack message per blocker each morning: a ranked list of what they are holding up, with resolve and "need more time" buttons.' } },
        { name: { he: 'לוח הצוות', en: 'Team board' }, description: { he: 'תצוגת ווב של כל ההמתנות הפתוחות כשורות: מי, על מי, מאז מתי, וסימון שרשרת כשההמתנה תלויה בהמתנה אחרת.', en: 'Web view of all open waits as rows: who, on whom, since when, and a chain indicator when the wait depends on another wait.' } },
        { name: { he: 'אדם', en: 'Person' }, description: { he: 'מה אדם אחד חוסם ומה חוסם אותו, עם זמן-עד-שחרור מתגלגל שלו.', en: 'What one person is blocking and what they are blocked by, with their rolling time-to-unblock.' } },
        { name: { he: 'שרשראות', en: 'Chains' }, description: { he: 'דיאגרמה פשוטה של שרשראות ההמתנה הפעילות הארוכות ביותר והאדם האחד ששחרור שלו יפתח הכי הרבה.', en: 'A simple diagram of the longest active waiting chains and the single person whose unblock would free the most.' } },
        { name: { he: 'תובנות', en: 'Insights' }, description: { he: 'מגמת זמן-עד-שחרור לפי שבוע וסוגי הבקשות שנתקעים הכי הרבה, עם סינון לפי צוות.', en: 'Time-to-unblock trend per week and the request types that stall most, filterable by team.' } },
        { name: { he: 'הגדרות סביבת עבודה', en: 'Workspace settings' }, description: { he: 'חיבור סלאק, שעות שקט, סנכרון חופשות, שעת הדייג׳סט וחיוב.', en: 'Slack connection, quiet hours, vacation sync, digest time and billing.' } },
      ],
      userJourney: {
        he: [
          'מעצבת מקלידה /holdup מחכה ל-@דנה לאפיון ה-API, עד יום חמישי',
          'הדייג׳סט של דנה בבוקר מציג את זה תחת שתי בקשות אחרות, מדורג לפי כמה אנשים מחכים',
          'היא סוגרת אחת בסלאק ומסמנת שהאפיון "צריך עוד יומיים", מה שמעדכן את המעצבת',
          'לוח הצוות מראה שההמתנה של המעצבת חוסמת בעצמה מפתח – שרשרת',
          'הסיכום של יום שישי מציין שאפיוני API הם המסירה האיטית ביותר של הצוות החודש',
        ],
        en: [
          'A designer types /holdup waiting on @Dana for the API spec, due Thursday',
          'Dana’s morning digest lists it under two other requests, ranked by how many people are waiting',
          'She resolves one in Slack and marks the spec "needs two more days", which notifies the designer',
          'The team board shows the designer’s wait is itself blocking a developer – a chain',
          'Friday’s summary notes that API specs are the team’s slowest handoff this month',
        ],
      },
      uxDirection: {
        he: 'סלאק הוא הממשק הראשי, ולכן רוב מאמץ העיצוב הולך לפריסת ההודעות: קצרות, מדורגות, עם שני כפתורים לכל היותר. דשבורד הווב הוא טבלה צפופה וניתנת למיון בפלטה ארגונית ניטרלית עם צבע הדגשה אחד להמתנות באיחור. בלי גיימיפיקציה ובלי טבלאות דירוג – זמן-עד-שחרור מוצג כמגמה של הצוות, אף פעם לא כדירוג של אנשים.',
        en: 'Slack is the primary interface, so most of the design effort goes into message layout: short, ranked, with two buttons at most. The web dashboard is a dense, sortable table in an enterprise-neutral palette with one accent for overdue waits. No gamification and no leaderboards – time-to-unblock is shown as a team trend, never as a ranking of people.',
      },
      architecture: {
        he: 'Next.js על Vercel לדשבורד ול-webhooks של סלאק, עם Slack Bolt שמטפל בפקודות, בפעולות על הודעות ובכפתורים אינטראקטיביים. Supabase Postgres שומר סביבות עבודה, המתנות ואירועים, עם משימה מתוזמנת שבונה כל דייג׳סט ומזהה שרשראות דרך שאילתה רקורסיבית. Stripe מטפל בחיוב לכל סביבת עבודה; Resend שולח את הסיכום השבועי במייל למי שלא נמצא בסלאק כל יום.',
        en: 'Next.js on Vercel for the dashboard and the Slack webhooks, with Slack Bolt handling commands, message actions and interactive buttons. Supabase Postgres stores workspaces, waits and events, with a scheduled job that builds each digest and detects chains via a recursive query. Stripe handles per-workspace billing; Resend sends the weekly summary email for people who are not on Slack daily.',
      },
      stack: ['Next.js', 'Slack Bolt', 'Supabase', 'Vercel', 'Stripe', 'Resend', 'Tailwind CSS'],
      database: {
        he: ['workspaces – מזהה צוות בסלאק, מסלול, שעת דייג׳סט, שעות שקט', 'members – מזהה משתמש בסלאק, אזור זמן, תאריכי חופשה', 'waits – מבקש, חוסם, תיאור, תאריך יעד, סטטוס, זמן סגירה', 'wait_links – המתנה שתלויה בהמתנה אחרת (שרשראות)', 'digests – חוסם, זמן שליחה, פריטים שנכללו', 'events – כל שינוי מצב, למדדים'],
        en: ['workspaces – Slack team id, plan, digest time, quiet hours', 'members – Slack user id, timezone, vacation dates', 'waits – requester, blocker, description, due date, status, resolved at', 'wait_links – a wait that depends on another wait (chains)', 'digests – blocker, sent at, items included', 'events – every state change, for metrics'],
      },
      auth: {
        he: 'כניסה עם סלאק בלבד; התקנת האפליקציה בסביבת העבודה מעניקה לבוט את ההרשאות, וכל שאילתה בדשבורד מוגבלת למזהה הצוות בסלאק. תפקידי אדמין משקפים את האדמינים של סלאק.',
        en: 'Sign in with Slack only; the workspace install grants the bot its scopes and every dashboard query is scoped to the Slack team id. Admin roles mirror Slack admins.',
      },
      monetization: {
        he: ['מנוי חודשי לכל סביבת עבודה עם מסלול חינמי לצוותים קטנים', 'מסלול גבוה יותר עם היסטוריית תובנות, ניתוח שרשראות וייצוא', 'מסלולים שנתיים לסוכנויות עם כמה סביבות עבודה של לקוחות'],
        en: ['Per-workspace monthly subscription with a free tier for small teams', 'Higher tier with insights history, chain analytics and exports', 'Annual plans for agencies with several client workspaces'],
      },
      mvpMilestones: {
        he: ['אפליקציית סלאק עם /holdup, פעולה על הודעה וכפתורי סגירה', 'משימת דייג׳סט יומי עם דירוג ושעות שקט', 'לוח ווב של המתנות פתוחות עם כניסה דרך סלאק', 'זיהוי שרשראות ותצוגת האדם', 'תובנות זמן-עד-שחרור, חיוב ב-Stripe והסיכום השבועי'],
        en: ['Slack app with /holdup, message action and resolve buttons', 'Daily digest job with ranking and quiet hours', 'Web board of open waits with sign-in-with-Slack', 'Chain detection and the person view', 'Time-to-unblock insights, Stripe billing and the weekly summary'],
      },
      risks: {
        he: ['אם רישום המתנה מרגיש כמו הלשנה על עמית, אף אחד לא ישתמש – הטון והפרטיות של הדייג׳סט קריטיים למוצר', 'אישור האפליקציה בסלאק והגדרת ההרשאות לוקחים זמן אמיתי ביומן', 'צוותים עשויים לצפות לסנכרון עם Jira או Linear מהיום הראשון; המוצר חייב להיות שווה גם בלעדיו'],
        en: ['If logging a wait feels like reporting a colleague, nobody will use it – tone and privacy of the digest are product-critical', 'Slack app review and permission scopes take real calendar time', 'Teams may expect Jira or Linear sync from day one; the wedge must be valuable without it'],
      },
      expansion: {
        he: ['גרסאות ל-Microsoft Teams ול-Google Chat', 'המתנות אוטומטיות מסקירות pull request ומתגובות במסמכים', 'המתנות בין חברות לסוכנויות וללקוחות שלהן'],
        en: ['Microsoft Teams and Google Chat versions', 'Automatic waits from pull-request reviews and document comments', 'Cross-company waits for agencies and their clients'],
      },
    },
  },
  {
    id: 'quota',
    name: { he: 'Quota – כמה צריך לעשות היום', en: 'Quota' },
    tagline: {
      he: 'מטרה אחת, דדליין אחד, מספר אחד: Quota אומרת כמה צריך לעשות היום ומחשבת מחדש בכל ערב לפי מה שבאמת עשיתם.',
      en: 'One goal, one deadline, one number: Quota tells you how much to do today and recalculates every evening from what you actually did.',
    },
    category: 'productivity',
    secondaryCategories: ['education', 'lifestyle'],
    difficulty: 'beginner',
    effort: { weeksMin: 1, weeksMax: 3 },
    budget: 'free',
    businessModel: 'free',
    platforms: ['ios', 'android'],
    audience: ['students', 'consumers', 'creators'],
    tags: ['deadline', 'pacing', 'goal', 'thesis', 'writing', 'exam prep', 'burndown', 'countdown'],
    identity: { hue: 50, glyph: 'Q', pattern: 'ring' },
    flags: { beginnerFriendly: true, profitPotential: 'low', experimental: false, trending: false, featuredWeight: 2 },
    spec: {
      overview: {
        he: 'Quota היא מחשבון קצב לתוצר גדול אחד: עבודת תזה של 80 עמודים, 600 כרטיסיות לפני המבחן, טיוטה של 50,000 מילים, 120 שעות תרגול לפני הבחינה. מזינים את הסך הכול, את הדדליין ואת הימים שבהם לא עובדים – סופי שבוע, חגים, החתונה ההיא – ו-Quota מחזירה מספר אחד: המכסה של היום. בכל ערב מתעדים מה נעשה, והמספר מחושב מחדש למחר, כך שיום גרוע מעלה קצת את המכסה במקום להרוס בשקט את התוכנית. גרף ה-burndown מראה במבט אם אתם לפני הקצב או אחריו, וההתראה היומית היא התזכורת היחידה. בלי פרויקטים, בלי תתי-משימות, בלי סטריקים: זו בכוונה אפליקציה של מטרה אחת, וזה בדיוק מה שהופך אותה לאפליקציה ראשונה טובה לבנות ולשחרר.',
        en: 'Quota is a single-purpose pacing calculator for one big deliverable: an 80-page thesis, 600 flashcards before the exam, a 50,000-word draft, 120 hours of practice before the test. You enter the total, the deadline and the days you will not work – weekends, holidays, that wedding – and Quota gives you one number: today’s quota. Each evening you log what you did and the number is recalculated for tomorrow, so a bad day raises the quota a little instead of silently wrecking the plan. The burndown chart shows whether you are ahead or behind at a glance, and the daily notification is the only reminder. No projects, no sub-tasks, no streaks: it is deliberately a one-goal app, which is exactly what makes it a good first app to build and ship.',
      },
      problem: {
        he: 'תוצרים גדולים נכשלים בשקט: הדדליין רחוק, אין מספר יומי, וכשהפאניקה מתחילה הקצב שנותר כבר בלתי אפשרי. גיליונות אלקטרוניים יודעים לחשב, אבל אף אחד לא פותח אותם, ומנהלי משימות הופכים מטרה אחת לרשימה של תתי-משימות מלאכותיות.',
        en: 'Big deliverables fail quietly: the deadline is months away, there is no daily number, and by the time the panic starts the remaining pace is impossible. Spreadsheets can do the maths but nobody opens them, and task managers turn one goal into a list of fake sub-tasks.',
      },
      solution: {
        he: 'הגדרה של שלושה שדות (סך הכול, דדליין, ימי חופש), תיעוד לילי של ההתקדמות, ומכסה יומית שמחושבת מחדש עם גרף burndown. האפליקציה מוגבלת בכוונה למטרה פעילה אחת, כך שכל החוויה נכנסת בשני מסכים והתראה אחת.',
        en: 'A three-field setup (total, deadline, days off), a nightly log of progress, and a recalculated daily quota with a burndown chart. The app is intentionally limited to one active goal, so the whole experience fits in two screens and a notification.',
      },
      usp: {
        he: 'לא מנהל משימות: Quota הופכת תוצר אחד מפחיד למספר אחד כן שמתעדכן כל יום, ומסרבת להוסיף פיצ׳רים שיהפכו אותה בחזרה לרשימת מטלות.',
        en: 'Not a task manager: Quota turns one scary deliverable into a single honest number that adapts every day, and refuses to add features that would turn it back into a to-do list.',
      },
      targetUsers: {
        he: ['סטודנטים שכותבים תזה או מתכוננים למבחן גדול', 'כותבים שעובדים לקראת ספירת מילים עם דדליין', 'כל מי שיש לו מטרה מדידה אחת ותאריך קשיח: קורס, הסמכה, תוכנית אימונים'],
        en: ['Students writing a thesis or preparing for a big exam', 'Writers working towards a word count on a deadline', 'Anyone with one measurable goal and a hard date: a course, a certification, a training plan'],
      },
      coreFeatures: {
        he: [
          'הגדרה בשלושה שדות: סך היחידות, דדליין וימי חופש',
          'מכסה יומית שמחושבת מחדש בכל ערב לפי ההתקדמות שתועדה',
          'גרף burndown עם קו אידיאלי מול קו בפועל',
          'התראה יומית אחת עם המספר של היום',
          'חיווי לפני/אחרי הקצב במילים פשוטות, לא באחוזים',
          'ארכיון של מטרות שהושלמו עם הגרף הסופי',
        ],
        en: [
          'Three-field setup: total units, deadline and days off',
          'Daily quota recalculated every evening from logged progress',
          'Burndown chart with the ideal line versus the actual line',
          'A single daily notification with today’s number',
          'Ahead/behind indicator in plain words, not percentages',
          'Archive of finished goals with the final chart',
        ],
      },
      screens: [
        { name: { he: 'הגדרה', en: 'Setup' }, description: { he: 'שלושה שדות גדולים – מה, כמה, עד מתי – ולוח שנה ללחיצה על ימי חופש; המכסה הראשונה מופיעה בזמן אמת תוך כדי הקלדה.', en: 'Three large inputs – what, how much, by when – plus a calendar to tap days off; the first quota appears live as you type.' } },
        { name: { he: 'היום', en: 'Today' }, description: { he: 'המכסה כמספר ענק אחד, מתחתיו בורר תיעוד בלחיצה, ושורה קצרה בסגנון "אתם יומיים לפני הקצב".', en: 'The quota as one giant number, a one-tap log stepper underneath, and a short "you are two days ahead" line.' } },
        { name: { he: 'גרף', en: 'Chart' }, description: { he: 'גרף burndown ברוחב מלא של אידיאלי מול בפועל, עם ימי חופש מוצללים והדדליין מסומן.', en: 'A full-width burndown of ideal versus actual, with days off shaded and the deadline marked.' } },
        { name: { he: 'ארכיון', en: 'Archive' }, description: { he: 'מטרות שהושלמו ככרטיסים קטנים עם הגרף הסופי שלהן; לחיצה על אחד מתחילה מטרה דומה.', en: 'Finished goals as small cards with their final chart; tapping one starts a similar goal.' } },
      ],
      userJourney: {
        he: [
          'סטודנטית מזינה "תזה – 80 עמודים – עד 30 ביוני" ומסמנת סופי שבוע וחג כימי חופש',
          'Quota מציגה מכסה יומית של קצת פחות משני עמודים',
          'בכל ערב היא מתעדת כמה כתבה; אחרי שבוע איטי המספר עולה מעט',
          'הגרף מראה שהיא מאחורי הקצב, אז היא מוסיפה שתי שבתות עבודה והמכסה יורדת בחזרה',
          'ביום הדדליין המטרה עוברת לארכיון עם הגרף הסופי שלה',
        ],
        en: [
          'A student enters "thesis – 80 pages – due 30 June" and taps her weekends and a holiday as days off',
          'Quota shows a daily quota of just under two pages',
          'Each evening she logs what she wrote; after a slow week the number rises slightly',
          'The chart shows she is behind, so she adds two working Saturdays and the quota drops back',
          'On deadline day the goal moves to the archive with its final chart',
        ],
      },
      uxDirection: {
        he: 'מספר אחד, ענק, במרכז, בפונט תצוגה בטוח; כל השאר טקסט משני. צבע הדגשה צהוב חם שנוטה לירוק כשמקדימים ולענבר כשמפגרים – אף פעם לא אדום. בלי מסכי אונבורדינג: מסך ההגדרה הוא האונבורדינג.',
        en: 'One number, huge, centred, in a confident display typeface; everything else is secondary text. A warm yellow accent that shifts towards green when ahead and amber when behind – never red. No onboarding slides: the setup screen is the onboarding.',
      },
      architecture: {
        he: 'Expo עם Expo Router ובסיס נתונים מקומי אחד ב-SQLite דרך expo-sqlite; בלי backend, בלי חשבונות. המכסה היא פונקציה טהורה של (יחידות שנותרו, ימי עבודה שנותרו) שקל לכסות בבדיקות יחידה. react-native-svg מצייר את ה-burndown; expo-notifications מתזמן את התזכורת היומית האחת. פרויקט ראשון טוב כי כל חלק קטן, והחלק הקשה הוא האיפוק.',
        en: 'Expo with Expo Router and a single local SQLite database via expo-sqlite; no backend, no accounts. The quota is a pure function of (remaining units, remaining working days) that is easy to unit-test. react-native-svg draws the burndown; expo-notifications schedules the one daily reminder. A good first project because every piece is small and the hard part is restraint.',
      },
      stack: ['Expo', 'Expo Router', 'expo-sqlite', 'react-native-svg', 'expo-notifications'],
      database: {
        he: ['goals – כותרת, שם היחידה, סך הכול, דדליין, תאריך יצירה, תאריך ארכוב', 'days_off – מטרה, תאריך', 'logs – מטרה, תאריך, יחידות שבוצעו', 'settings – שעת התראה, היום הראשון בשבוע'],
        en: ['goals – title, unit name, total, deadline, created at, archived at', 'days_off – goal, date', 'logs – goal, date, units done', 'settings – notification time, first weekday'],
      },
      auth: {
        he: 'בלי חשבונות בכלל. הנתונים נשארים במכשיר, עם ייצוא וייבוא JSON למעבר לטלפון חדש.',
        en: 'No accounts at all. Data stays on the device, with a JSON export and import for moving to a new phone.',
      },
      monetization: {
        he: ['חינם ובלי פרסומות; רכישה אופציונלית של "קפה" כתמיכה', 'אפשרות עתידית: פתיחה חד-פעמית למטרה פעילה שנייה ולערכות צבע לגרף'],
        en: ['Free with no ads; an optional tip-jar in-app purchase', 'Possible later: a one-time unlock for a second active goal and chart themes'],
      },
      mvpMilestones: {
        he: ['מסך הגדרה וחישוב מכסה עם ימי חופש', 'מסך היום עם תיעוד וחישוב מחדש', 'גרף burndown', 'התראה יומית, ארכיון ועמוד בחנות'],
        en: ['Setup screen and quota calculation with days off', 'Today screen with logging and recalculation', 'Burndown chart', 'Daily notification, archive and store listing'],
      },
      risks: {
        he: ['קל להעתיק – היתרון הוא טעם ואיפוק, לא טכנולוגיה', 'משתמשים יבקשו כמה מטרות ותתי-משימות; הוספתן מכרסמת בכל הרעיון', 'בלי מחיר ובלי מנוי ההכנסה צנועה; להתייחס לזה קודם כול כפרויקט לתיק עבודות'],
        en: ['Easy to copy – the moat is taste and restraint, not technology', 'Users will ask for multiple goals and sub-tasks; adding them erodes the whole point', 'Free and subscription-free means modest income; treat it as a portfolio piece first'],
      },
      expansion: {
        he: ['ווידג׳ט למסך הבית עם המספר של היום', 'מטרות משותפות לשותפי למידה שמתכוננים לאותו מבחן', 'ייבוא סילבוס או תוכן עניינים כדי להגדיר את הסך הכול אוטומטית'],
        en: ['Home-screen widget with today’s number', 'Shared goals for study partners pacing the same exam', 'Import a syllabus or table of contents to set the total automatically'],
      },
    },
  },
];
