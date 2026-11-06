import type { Idea } from '../types';

/**
 * Finance – personal money, budgeting, invoicing and investing education.
 * Nothing here promises returns; every monetization list is a set of
 * possibilities, not a forecast.
 */
export const ideas: Idea[] = [
  {
    id: 'earmark',
    name: { he: 'Earmark – המשכורת שכבר תפוסה', en: 'Earmark' },
    tagline: {
      he: 'תקציב שמסתכל קדימה: הוראות קבע, תשלומים ומנויים על ציר זמן אחד, כדי לראות כמה מכל משכורת עתידית כבר תפוס עוד לפני שהיא נכנסת.',
      en: 'Forward-looking budgeting: standing orders, instalments and subscriptions on one timeline, showing how much of each future salary is already spoken for.',
    },
    category: 'finance',
    secondaryCategories: ['productivity', 'lifestyle'],
    difficulty: 'intermediate',
    effort: { weeksMin: 4, weeksMax: 7 },
    budget: 'low',
    businessModel: 'freemium',
    platforms: ['ios', 'android'],
    audience: ['consumers'],
    tags: ['budgeting', 'installments', 'commitments', 'cash flow', 'forecast', 'subscriptions', 'salary'],
    identity: { hue: 160, glyph: 'Em', pattern: 'grid' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: false, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Earmark היא אפליקציית תקציב שלא מבקשת לקטלג כל קפה. במקום להסתכל אחורה על הוצאות, היא מסתכלת קדימה על התחייבויות: הוראות קבע, מנויים, החזרי הלוואה, ובעיקר תשלומים – הרכישה שחולקה ל-12 תשלומים ועדיין "חיה" בכרטיס גם אחרי ששכחתם ממנה. מזינים פעם אחת את ההכנסה הקבועה ואת ההתחייבויות, והאפליקציה פורשת את 12 החודשים הבאים כרצועה: כמה מכל משכורת כבר תפוס, כמה באמת פנוי, ומתי סדרת תשלומים מסתיימת ומשחררת כסף. לפני רכישה גדולה מריצים "מה אם": איך ייראה מרץ אם אקנה את זה ב-10 תשלומים? ההבדל ממעקב הוצאות רגיל הוא שהתשובה מגיעה לפני ההוצאה, לא אחריה.',
        en: 'Earmark is a budgeting app that never asks you to categorise a coffee. Instead of looking back at spending, it looks forward at commitments: standing orders, subscriptions, loan repayments and above all instalment plans – the purchase split into twelve payments that keeps living on your card long after you forgot it. You enter regular income and commitments once, and the app lays out the next twelve months as a strip: how much of each salary is already taken, how much is genuinely free, and when an instalment series ends and releases money. Before a big purchase you run a "what if": what does March look like if I buy this in ten payments? The answer arrives before the spend, not after it.',
      },
      problem: {
        he: 'מעקב הוצאות מספר מה כבר קרה, אבל הבעיה האמיתית היא העתיד: תשלומים שנפרשו, מנויים שהצטברו והוראות קבע שאף אחד לא סופר. בחודש שבו כמה סדרות תשלומים נפגשות, המשכורת נגמרת ב-15 לחודש ואף אחד לא מבין למה.',
        en: 'Expense tracking tells you what already happened, but the real problem is the future: instalment plans that were spread out, subscriptions that piled up and standing orders nobody counts. In the month when several instalment series collide, the salary runs out by the 15th and nobody understands why.',
      },
      solution: {
        he: 'ציר התחייבויות קדימה: כל הוראת קבע, מנוי ותשלום מוזנים פעם אחת עם תאריך סיום, והאפליקציה מחשבת לכל חודש עתידי את ה"תפוס" מול ה"פנוי". סימולציית "מה אם" לרכישה בתשלומים, והתראה כשחודש מסוים עומד להיות צפוף.',
        en: 'A forward commitments timeline: every standing order, subscription and instalment is entered once with an end date, and the app computes "taken" versus "free" for each future month. A "what if" simulation for buying in instalments, and an alert when a specific month is about to get crowded.',
      },
      usp: {
        he: 'רוב האפליקציות מודדות את העבר; Earmark מראה כמה מהמשכורת של מרץ כבר הוצאה בנובמבר. בלי חיבור לבנק, בלי קטלוג קבלות – רק התחייבויות ותאריכי סיום.',
        en: 'Most apps measure the past; Earmark shows how much of March’s salary was already spent in November. No bank connection, no receipt sorting – just commitments and their end dates.',
      },
      targetUsers: {
        he: ['שכירים שמשלמים הרבה בתשלומים ומאבדים את התמונה הכוללת', 'משפחות צעירות עם הרבה הוראות קבע ומנויים', 'מי שמתכנן רכישה גדולה ורוצה לדעת מה היא תעשה לחודשים הבאים'],
        en: ['Salaried people who pay in instalments and lose the overall picture', 'Young families juggling many standing orders and subscriptions', 'Anyone planning a big purchase who wants to know what it does to the coming months'],
      },
      coreFeatures: {
        he: [
          'הזנה מהירה של התחייבות: סכום, יום חיוב, תאריך סיום או מספר תשלומים שנותרו',
          'רצועת 12 חודשים: תפוס מול פנוי לכל משכורת עתידית',
          'סימולציית "מה אם" לרכישה חדשה בתשלומים או למנוי חדש',
          'התראת "חודש צפוף" כשכמה סדרות תשלומים נפגשות',
          'חגיגה קטנה כשסדרת תשלומים מסתיימת וכסף משתחרר',
          'ייצוא של ציר ההתחייבויות לשיתוף עם בן או בת זוג או עם יועץ',
        ],
        en: [
          'Quick commitment entry: amount, billing day, end date or payments remaining',
          'Twelve-month strip: taken versus free for each future salary',
          '"What if" simulation for a new instalment purchase or subscription',
          '"Crowded month" alert when several instalment series overlap',
          'A small celebration when an instalment series ends and money is released',
          'Export of the commitments timeline to share with a partner or an adviser',
        ],
      },
      screens: [
        { name: { he: 'בית', en: 'Home' }, description: { he: 'המשכורת הבאה כטבעת: כמה תפוס, כמה פנוי, ושלוש ההתחייבויות הקרובות.', en: 'The next salary as a ring: how much is taken, how much is free, and the three nearest commitments.' } },
        { name: { he: 'ציר השנה', en: 'Year strip' }, description: { he: 'רצועה אופקית של 12 חודשים עם עמודת תפוס/פנוי לכל חודש; נגיעה פותחת את פירוט החודש.', en: 'A horizontal strip of twelve months with a taken/free bar per month; tapping opens the month’s breakdown.' } },
        { name: { he: 'התחייבויות', en: 'Commitments' }, description: { he: 'רשימה מקובצת לפי סוג (הוראת קבע, מנוי, תשלומים, הלוואה) עם תאריך סיום ויתרה.', en: 'A list grouped by type (standing order, subscription, instalments, loan) with end date and remaining balance.' } },
        { name: { he: 'הוספת התחייבות', en: 'Add commitment' }, description: { he: 'טופס של שלושה שדות עם מקלדת מספרים גדולה ובחירת יום חיוב מתוך לוח.', en: 'A three-field form with a large numeric keypad and a billing-day picker.' } },
        { name: { he: 'מה אם', en: 'What if' }, description: { he: 'מזינים רכישה ומספר תשלומים ורואים את הרצועה משתנה בזמן אמת, עם החודש הצפוף ביותר מודגש.', en: 'Enter a purchase and a number of payments and watch the strip change in real time, with the tightest month highlighted.' } },
        { name: { he: 'הגדרות', en: 'Settings' }, description: { he: 'הכנסה קבועה, יום משכורת, מטבע ושפה, ייצוא ומחיקת נתונים.', en: 'Regular income, salary day, currency and language, export and data deletion.' } },
      ],
      userJourney: {
        he: [
          'המשתמש מזין משכורת נטו ויום משכורת',
          'מוסיף שמונה התחייבויות: שכר דירה, שני מנויים, החזר הלוואה וארבע סדרות תשלומים',
          'רואה ברצועה שבפברואר שלוש סדרות נפגשות ורק רבע מהמשכורת פנוי',
          'מריץ "מה אם" על טלוויזיה ב-12 תשלומים ומחליט לחכות לאפריל',
          'מקבל התראה באפריל שסדרת תשלומים הסתיימה ו-400 ש״ח התפנו',
        ],
        en: [
          'The user enters net salary and salary day',
          'Adds eight commitments: rent, two subscriptions, a loan repayment and four instalment series',
          'Sees on the strip that in February three series collide and only a quarter of the salary is free',
          'Runs a "what if" on a TV in twelve payments and decides to wait for April',
          'Gets an alert in April that an instalment series ended and 400 shekels were freed up',
        ],
      },
      uxDirection: {
        he: 'רגוע וברור, כמו לוח שנה ולא כמו דוח בנק: רצועת החודשים היא הגיבורה, עם שני צבעים בלבד – תפוס ופנוי. מספרים גדולים, בלי גרפים מסובכים, ומיקרו-אנימציה כשסדרת תשלומים "נסגרת". כל פעולה נפוצה נגמרת בשתי נגיעות לכל היותר.',
        en: 'Calm and legible, more like a calendar than a bank statement: the month strip is the hero, with only two colours – taken and free. Large numbers, no complex charts, and a micro-animation when an instalment series "closes". Every common action takes at most two taps.',
      },
      architecture: {
        he: 'Expo + Expo Router עם SQLite מקומי (expo-sqlite) כמקור האמת, כך שהאפליקציה עובדת בלי חשבון ובלי רשת. חישוב התפוס/פנוי הוא פונקציה טהורה שרצה על המכשיר על בסיס חוקי חזרה (יום חיוב, תאריך סיום, תשלומים שנותרו). סנכרון בין מכשירים דרך Supabase כשכבה אופציונלית בגרסה בתשלום; בית משותף ייבנה על אותה שכבה בהמשך. התראות מקומיות מתוזמנות לפי תאריכי החיוב.',
        en: 'Expo + Expo Router with local SQLite (expo-sqlite) as the source of truth, so the app works without an account or network. The taken/free computation is a pure function running on device over recurrence rules (billing day, end date, payments remaining). Cross-device sync goes through Supabase as an optional layer in the paid tier; a shared household can build on that same layer later. Local notifications are scheduled from billing dates.',
      },
      stack: ['Expo', 'Expo Router', 'expo-sqlite', 'Zustand', 'Reanimated', 'Supabase', 'RevenueCat'],
      database: {
        he: ['commitments – סוג, סכום, יום חיוב, תאריך סיום, תשלומים שנותרו', 'incomes – הכנסה קבועה ויום קבלה', 'scenarios – סימולציות "מה אם" שמורות', 'month_snapshots – תוצאות חישוב שמורות להצגה מהירה'],
        en: ['commitments – type, amount, billing day, end date, payments remaining', 'incomes – regular income and pay day', 'scenarios – saved "what if" simulations', 'month_snapshots – cached computation results for fast rendering'],
      },
      auth: {
        he: 'ללא חשבון בגרסה החינמית – הכול נשמר על המכשיר. כניסה עם Apple/Google או קישור קסם במייל רק כשמפעילים סנכרון, עם RLS לפי משתמש.',
        en: 'No account in the free tier – everything stays on device. Apple/Google sign-in or an email magic link only when enabling sync, with per-user RLS.',
      },
      monetization: {
        he: ['חינם עד 10 התחייבויות; מנוי שנתי פותח הזנה ללא הגבלה, סימולציות וסנכרון', 'אפשרות בהמשך: תוספת "בית משותף" לזוגות', 'ייצוא מעוצב ליועצים ולמאמנים פיננסיים'],
        en: ['Free up to ten commitments; an annual subscription unlocks unlimited entries, simulations and sync', 'Possible later: a "shared household" add-on for couples', 'Formatted export for advisers and financial coaches'],
      },
      mvpMilestones: {
        he: ['מודל התחייבות וחישוב תפוס/פנוי עם בדיקות יחידה', 'מסכי בית, רצועת שנה והוספת התחייבות', 'סימולציית "מה אם"', 'התראות מקומיות על חודש צפוף ועל סיום סדרה', 'חומת תשלום ומנוי'],
        en: ['Commitment model and taken/free computation with unit tests', 'Home, year strip and add-commitment screens', '"What if" simulation', 'Local notifications for crowded months and series endings', 'Paywall and subscription'],
      },
      risks: {
        he: ['הזנה ידנית דורשת משמעת – ההזנה חייבת לקחת 20 שניות ונדרשת תזכורת חודשית עדינה', 'בלי חיבור לבנק הנתונים מתיישנים – לשקול ייבוא של קובץ פירוט כרטיס אשראי', 'משתמשים עלולים לבלבל בין נטו לברוטו – להסביר במסך ההגדרות'],
        en: ['Manual entry needs discipline – entry must take twenty seconds and a gentle monthly nudge is required', 'Without a bank connection data goes stale – consider importing a card statement file', 'Users may confuse net and gross income – explain it on the settings screen'],
      },
      expansion: {
        he: ['ייבוא פירוט כרטיס אשראי לזיהוי אוטומטי של סדרות תשלומים', 'מצב "יעד": כמה חודשים עד שסכום מסוים מתפנה', 'גרסת בית משותף עם חלוקת התחייבויות בין בני זוג'],
        en: ['Card statement import to detect instalment series automatically', 'A "goal" mode: how many months until a given amount frees up', 'A shared-household version that splits commitments between partners'],
      },
    },
  },
  {
    id: 'sitdown',
    name: { he: 'Sitdown – שיחת הכסף החודשית', en: 'Sitdown' },
    tagline: {
      he: 'פגישת כסף חודשית של 20 דקות לזוגות: הכנה פרטית, סדר יום מוכן, החלטות שנרשמות ומעקב עד הפעם הבאה – במקום ריב בעשר בלילה.',
      en: 'A twenty-minute monthly money sit-down for couples: private prep, a ready agenda, decisions on record and follow-up – instead of a fight at 10pm.',
    },
    category: 'finance',
    secondaryCategories: ['lifestyle', 'social'],
    difficulty: 'intermediate',
    effort: { weeksMin: 4, weeksMax: 7 },
    budget: 'low',
    businessModel: 'subscription',
    platforms: ['cross-platform'],
    audience: ['consumers', 'professionals'],
    tags: ['couples', 'money talk', 'shared finances', 'ritual', 'agreements', 'family budget', 'relationships'],
    identity: { hue: 340, glyph: 'Sd', pattern: 'ring' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: true, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Sitdown הופכת את "צריך לדבר על כסף" לריטואל קבוע שלא כואב. פעם בחודש כל אחד מבני הזוג ממלא לבד, בשתי דקות, צ׳ק-אין פרטי: שלושה מספרים (מה נכנס, מה יצא, מה מדאיג), מצב רוח כלכלי, ונושא אחד שרוצים להעלות. האפליקציה מרכיבה מזה סדר יום לפגישה קצרה – כולל הנושאים שחוזרים כל חודש ולא נסגרים – ומנחה את השיחה שלב אחר שלב עם טיימר. כל החלטה נרשמת ביומן הסכמות ("עד 300 ש״ח לא שואלים"), ובין הפגישות מגיעה תזכורת עדינה למי שלקח משימה. אין חיבור לבנק ואין מעקב הוצאות: המוצר הוא השיחה עצמה, לא הטבלה.',
        en: 'Sitdown turns "we need to talk about money" into a fixed ritual that does not hurt. Once a month each partner fills in a private two-minute check-in: three numbers (what came in, what went out, what worries me), a money mood, and one topic to raise. The app assembles an agenda for a short meeting – including the topics that return every month and never get closed – and guides the conversation step by step with a timer. Every decision goes into an agreements log ("under 300 shekels, no need to ask"), and between meetings a gentle reminder reaches whoever took a task. No bank connection, no expense tracking: the product is the conversation, not the spreadsheet.',
      },
      problem: {
        he: 'זוגות לא רבים על כסף כי אין להם נתונים, אלא כי אין להם פורום: השיחה קורית בלחץ, אחרי הוצאה מפתיעה, בלי הכנה ובלי זיכרון של מה כבר סוכם. אפליקציות תקציב משותפות מוסיפות מעקב, לא מבנה – ומי שפחות אוהב טבלאות פשוט נוטש.',
        en: 'Couples do not fight about money because they lack data, but because they lack a forum: the conversation happens under pressure, after a surprise expense, with no preparation and no memory of what was already agreed. Shared budgeting apps add tracking, not structure – and the partner who dislikes spreadsheets simply drops out.',
      },
      solution: {
        he: 'ריטואל חודשי מובנה: צ׳ק-אין פרטי לכל אחד, סדר יום שנבנה אוטומטית, שיחה מונחית עם טיימר, יומן הסכמות שנשאר נגיש, ומשימות עם תזכורות עד הפגישה הבאה. פורמט שעובד גם כשרק אחד מבני הזוג "אוהב כסף".',
        en: 'A structured monthly ritual: a private check-in for each partner, an auto-built agenda, a guided conversation with a timer, an agreements log that stays accessible, and tasks with reminders until the next meeting. A format that works even when only one partner "likes money".',
      },
      usp: {
        he: 'לא עוד תקציב משותף: Sitdown מוכרת את הפגישה, לא את המעקב. הצ׳ק-אין הפרטי לפני השיחה מוריד את הטונים, ויומן ההסכמות מסיים את ה"אבל אמרנו ש…".',
        en: 'Not another joint budget: Sitdown sells the meeting, not the tracking. The private check-in before the talk lowers the temperature, and the agreements log ends the "but we said that…" loop.',
      },
      targetUsers: {
        he: ['זוגות שעברו לגור יחד ומתחילים לערבב כסף', 'הורים צעירים שכל חודש מגלים הוצאה שלא תוכננה', 'מאמנים פיננסיים ומטפלים זוגיים שרוצים כלי בין הפגישות'],
        en: ['Couples who just moved in together and are starting to mix money', 'Young parents who discover an unplanned expense every month', 'Financial coaches and couples therapists who want a tool between sessions'],
      },
      coreFeatures: {
        he: [
          'צ׳ק-אין פרטי של שתי דקות לכל אחד מבני הזוג לפני הפגישה',
          'סדר יום אוטומטי: נושאים חדשים, נושאים שחוזרים ונושאים שנסגרו',
          'שיחה מונחית עם טיימר ושאלה מכוונת לכל שלב',
          'יומן הסכמות עם תאריך, ניסוח מוסכם ואפשרות לעדכן',
          'משימות בין פגישות עם תזכורת למי שלקח אותן',
          'תבניות סדר יום לרגעים מיוחדים: מעבר דירה, לידה, שינוי בעבודה',
        ],
        en: [
          'A private two-minute check-in for each partner before the meeting',
          'Automatic agenda: new topics, recurring topics and closed ones',
          'Guided conversation with a timer and a focused question for each step',
          'Agreements log with date, agreed wording and the option to update',
          'Tasks between meetings with a reminder for whoever owns them',
          'Agenda templates for special moments: moving home, a new baby, a job change',
        ],
      },
      screens: [
        { name: { he: 'בית', en: 'Home' }, description: { he: 'הפגישה הבאה כספירה לאחור, סטטוס הצ׳ק-אין של כל אחד, והמשימות הפתוחות.', en: 'The next meeting as a countdown, each partner’s check-in status, and open tasks.' } },
        { name: { he: 'צ׳ק-אין פרטי', en: 'Private check-in' }, description: { he: 'שלושה שדות מספריים, בורר מצב רוח ושדה טקסט אחד – נשמר כפרטי עד שהפגישה מתחילה.', en: 'Three numeric fields, a mood picker and a single text field – kept private until the meeting begins.' } },
        { name: { he: 'סדר יום', en: 'Agenda' }, description: { he: 'רשימת נושאים ממוספרת עם זמן מוצע לכל אחד, גרירה לשינוי סדר ואפשרות לדחות נושא לחודש הבא.', en: 'A numbered topic list with suggested time per item, drag to reorder, and the option to defer a topic to next month.' } },
        { name: { he: 'פגישה', en: 'Meeting' }, description: { he: 'מסך אחד לשני בני הזוג: הנושא הנוכחי, טיימר, שאלה מנחה וכפתור "החלטנו" שפותח את יומן ההסכמות.', en: 'One screen for both partners: the current topic, a timer, a guiding question and a "we decided" button that opens the agreements log.' } },
        { name: { he: 'יומן הסכמות', en: 'Agreements' }, description: { he: 'הסכמות לפי תאריך עם חיפוש, סימון "עדיין בתוקף" ועריכה שדורשת אישור של שניהם.', en: 'Agreements by date with search, a "still in force" marker and edits that both partners confirm.' } },
        { name: { he: 'סיכום', en: 'Recap' }, description: { he: 'סיכום הפגישה כעמוד אחד: החלטות, משימות ומצב הרוח של כל אחד לפני ואחרי.', en: 'The meeting as a one-page recap: decisions, tasks and each partner’s mood before and after.' } },
      ],
      userJourney: {
        he: [
          'בני הזוג מצטרפים לאותו "בית" דרך קישור הזמנה',
          'יומיים לפני הפגישה כל אחד מקבל תזכורת לצ׳ק-אין הפרטי',
          'האפליקציה בונה סדר יום של ארבעה נושאים, כולל "החיסכון לטיול" שחוזר כבר חודש שלישי',
          'בפגישה הם מחליטים על סכום חודשי לטיול והוא נרשם ביומן ההסכמות',
          'אחד מהם לוקח משימה לפתוח חשבון חיסכון ומקבל תזכורת אחרי שבוע',
          'בחודש הבא הנושא מופיע כ"נסגר" ומפנה מקום לנושא חדש',
        ],
        en: [
          'Both partners join the same "home" via an invite link',
          'Two days before the meeting each gets a reminder for the private check-in',
          'The app builds a four-topic agenda, including "the trip savings" that is back for the third month',
          'In the meeting they decide on a monthly amount for the trip and it goes into the agreements log',
          'One of them takes the task of opening a savings account and gets a reminder a week later',
          'Next month the topic shows as "closed" and makes room for a new one',
        ],
      },
      uxDirection: {
        he: 'חמים ולא בנקאי: צבעי שקיעה, טיפוגרפיה רכה ושפה של שיחה ("מה מדאיג אותך החודש?") במקום שפה של דוחות. מסך הפגישה מיועד לטלפון אחד שמונח על השולחן בין שניים, לכן טקסט גדול וכפתור אחד בכל רגע. בלי גרפים – הצלחה נמדדת בפגישות שהתקיימו, לא בשקלים.',
        en: 'Warm, not bank-like: sunset colours, soft typography and conversational language ("what worries you this month?") instead of report language. The meeting screen is built for one phone lying on the table between two people, so large text and one button at a time. No charts – success is measured in meetings held, not in shekels.',
      },
      architecture: {
        he: 'Expo + Expo Router לכל הפלטפורמות, Supabase לאימות, לבתים משותפים ולנתונים, עם Realtime כדי שסטטוס הצ׳ק-אין והמשימות יתעדכנו מיד גם אצל בן הזוג; הפגישה עצמה רצה על טלפון אחד. הצ׳ק-אין הפרטי נשמר בטבלה נפרדת עם RLS שחושפת אותו לבן הזוג רק אחרי תחילת הפגישה. הרכבת סדר היום היא לוגיקה דטרמיניסטית (חוקים, לא מודל), כדי שהתוצאה תהיה צפויה וניתנת להסבר. התראות דרך Expo Notifications מתוזמנות מצד השרת.',
        en: 'Expo + Expo Router across platforms, Supabase for auth, shared homes and data, with Realtime so check-in status and tasks update instantly on the partner’s phone; the meeting itself runs on one phone. The private check-in lives in a separate table with RLS that reveals it to the partner only once the meeting starts. Agenda assembly is deterministic logic (rules, not a model) so the result is predictable and explainable. Notifications via Expo Notifications, scheduled server-side.',
      },
      stack: ['Expo', 'Expo Router', 'Supabase', 'Supabase Realtime', 'Expo Notifications', 'RevenueCat'],
      database: {
        he: ['homes – בית משותף, תדירות פגישה, מטבע', 'members – משתמשים בבית ותפקיד', 'checkins – צ׳ק-אין פרטי לכל חבר לכל מחזור', 'meetings – פגישה, תאריך, שלב נוכחי, משך', 'agenda_items – נושא, מקור, סטטוס (חדש/חוזר/נסגר)', 'agreements – ניסוח מוסכם, תאריך, תוקף', 'tasks – משימה, אחראי, תזכורת, סטטוס'],
        en: ['homes – shared home, meeting cadence, currency', 'members – users in the home and their role', 'checkins – private check-in per member per cycle', 'meetings – meeting, date, current step, duration', 'agenda_items – topic, origin, status (new/recurring/closed)', 'agreements – agreed wording, date, validity', 'tasks – task, owner, reminder, status'],
      },
      auth: {
        he: 'כניסה עם Apple/Google או קישור קסם; הצטרפות לבית דרך קישור הזמנה חד-פעמי. RLS מבטיחה שרק חברי הבית רואים את הנתונים שלו, והצ׳ק-אין נשאר פרטי עד תחילת הפגישה.',
        en: 'Apple/Google sign-in or an email magic link; joining a home through a one-time invite link. RLS ensures only home members see its data, and the check-in stays private until the meeting starts.',
      },
      monetization: {
        he: ['מנוי זוגי חודשי או שנתי אחרי פגישה ראשונה חינם', 'תבניות סדר יום שנבנו עם מאמנים פיננסיים ומטפלים זוגיים', 'רישיון למאמנים ולמטפלים שמלווים כמה זוגות במקביל'],
        en: ['A monthly or annual couple plan after a free first meeting', 'Agenda templates built with financial coaches and couples therapists', 'A practitioner licence for coaches and therapists who follow several couples'],
      },
      mvpMilestones: {
        he: ['בית משותף, הזמנה וצ׳ק-אין פרטי', 'הרכבת סדר יום וקובצי חוקים לנושאים חוזרים', 'מסך פגישה מונחה עם טיימר ושאלה מכוונת לכל שלב', 'יומן הסכמות ומשימות עם תזכורות', 'חומת תשלום אחרי הפגישה הראשונה'],
        en: ['Shared home, invite flow and private check-in', 'Agenda assembly and rule files for recurring topics', 'Guided meeting screen with a timer and a focused question per step', 'Agreements log and tasks with reminders', 'Paywall after the first meeting'],
      },
      risks: {
        he: ['המוצר דורש שני משתמשים – אם אחד לא מצטרף אין ערך, לכן צריך מצב "סולו" להתחלה', 'ריטואל חודשי נשבר בקלות – התזכורות חייבות להרגיש כמו הזמנה ולא כמו נדנוד', 'נושאים רגישים (חובות, הכנסה לא שווה) דורשים ניסוח זהיר ואפשרות להסתיר מספרים'],
        en: ['The product needs two users – without the partner there is no value, so a "solo" starter mode is required', 'A monthly ritual breaks easily – reminders must feel like an invitation, not nagging', 'Sensitive topics (debt, unequal income) need careful wording and the option to hide numbers'],
      },
      expansion: {
        he: ['גרסת שותפים לדירה: פגישת בית עם חלוקת חשבונות', 'מצב משפחה: הילדים מצטרפים לנושא אחד בסדר היום', 'ייצוא יומן ההסכמות למאמן או ליועץ לפני פגישה אמיתית'],
        en: ['A roommates version: a house meeting with bill splitting', 'Family mode: the kids join one agenda topic', 'Exporting the agreements log to a coach or adviser before a real session'],
      },
    },
  },
  {
    id: 'incoming',
    name: { he: 'Incoming – מתי הכסף באמת נכנס', en: 'Incoming' },
    tagline: {
      he: 'תחזית תזרים לפרילנסרים שמבינה "שוטף+60": כל חשבונית מקבלת תאריך תשלום צפוי, הפרשה למע״מ ולמקדמות, ותמונה של 90 הימים הבאים.',
      en: 'Cash-flow forecasting for freelancers that understands net-60 terms: each invoice gets an expected pay date, a tax set-aside and a ninety-day outlook.',
    },
    category: 'finance',
    secondaryCategories: ['business', 'productivity'],
    difficulty: 'advanced',
    effort: { weeksMin: 10, weeksMax: 16 },
    budget: 'medium',
    businessModel: 'b2b',
    platforms: ['web'],
    audience: ['professionals', 'businesses'],
    tags: ['freelancers', 'cash flow', 'invoices', 'payment terms', 'tax set-aside', 'accountants', 'forecast'],
    identity: { hue: 210, glyph: 'In', pattern: 'wave' },
    flags: { beginnerFriendly: false, profitPotential: 'high', experimental: false, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Incoming היא שכבת תזרים שיושבת ליד תוכנת החשבוניות של הפרילנסר ועונה על השאלה היחידה שחשובה: כמה כסף באמת יהיה לי, ומתי. כל חשבונית מקבלת תנאי תשלום – שוטף+30, שוטף+60 – ותאריך צפוי שמתעדכן לפי ההיסטוריה של הלקוח: לקוח שתמיד מאחר בשבועיים מקבל תחזית עם שבועיים איחור. מכל תקבול האפליקציה מפרישה את מה שלא שלכם – מע״מ, מקדמות מס הכנסה, ביטוח לאומי – ומציגה "שלי" מול "של המדינה". התוצאה היא קו של 90 יום קדימה שמראה את השבוע שבו היתרה יורדת מתחת לקו האדום, מספיק מוקדם כדי לדחות הוצאה או להזכיר ללקוח. לרואי חשבון יש לוח של כל הלקוחות עם דגלים על מי בדרך לבעיה.',
        en: 'Incoming is a cash-flow layer that sits beside a freelancer’s invoicing tool and answers the question that matters: how much money will I really have, and when. Every invoice gets payment terms – net-30, net-60 – and an expected date that adjusts to the client’s history: a client who always pays two weeks late is forecast two weeks late. From every receipt it sets aside what is not yours – VAT, tax advances, national insurance – and shows "mine" versus "the state’s". The result: a ninety-day line that reveals the week you dip below your red line, early enough to postpone a purchase or nudge a client. Accountants get a board of all their clients with flags on who is heading for trouble.',
      },
      problem: {
        he: 'הכסף בחשבון של פרילנסר הוא אשליה: חלק ממנו מע״מ, חלק מקדמות, וחלק עוד לא נכנס כי הלקוח עובד בשוטף+60. תוכנות חשבוניות יודעות מה הונפק, לא מתי ייכנס, ורואה החשבון רואה את התמונה רק בסוף השנה – כשכבר מאוחר.',
        en: 'The money in a freelancer’s account is an illusion: part of it is VAT, part is tax advances, and part has not arrived because the client pays net-60. Invoicing tools know what was issued, not when it will land, and the accountant sees the picture only at year end – when it is too late.',
      },
      solution: {
        he: 'תחזית תזרים שמבוססת על חשבוניות ותנאי תשלום, עם תאריך צפוי שלומד כל לקוח, הפרשת מס אוטומטית לכל תקבול, קו אדום אישי והתראה מוקדמת על שבוע בעייתי. לוח לרואי חשבון שמראה את כל הלקוחות ומי מהם צריך שיחה.',
        en: 'A cash-flow forecast driven by invoices and payment terms, with an expected date that learns each client, automatic tax set-aside per receipt, a personal red line and an early warning for a bad week. A board for accountants showing all their clients and which of them needs a call.',
      },
      usp: {
        he: 'לא עוד תוכנת חשבוניות: Incoming מתחילה מהשאלה "מתי זה נכנס" ולא "מה הנפקתי". תחזית לפי ההתנהגות של הלקוח בפועל, הפרדה של "שלי" מ"של המדינה", וערוץ הפצה דרך רואי החשבון שהפרילנסרים ממילא סומכים עליהם.',
        en: 'Not another invoicing tool: Incoming starts from "when does it land" rather than "what did I issue". Forecasts based on how clients actually behave, a clean split of "mine" from "the state’s", and distribution through the accountants freelancers already trust.',
      },
      targetUsers: {
        he: ['פרילנסרים עם לקוחות עסקיים שמשלמים בשוטף+30 עד שוטף+90', 'עוסקים מורשים שכל תקופה מופתעים מגובה המע״מ', 'משרדי רואי חשבון שרוצים לראות בעיות תזרים של לקוחות לפני שהן קורות'],
        en: ['Freelancers with business clients on net-30 to net-90 terms', 'Sole traders surprised by their VAT bill every period', 'Accounting firms that want to see client cash-flow trouble before it happens'],
      },
      coreFeatures: {
        he: [
          'כל חשבונית מקבלת תנאי תשלום ותאריך צפוי שלומד מההיסטוריה של הלקוח',
          'הפרשה אוטומטית למע״מ, למקדמות ולביטוח לאומי לפי פרופיל העוסק',
          'קו 90 יום קדימה: "שלי" מול "של המדינה" עם קו אדום אישי',
          'התראה מוקדמת על שבוע שבו היתרה צפויה לרדת מתחת לקו האדום',
          'תזכורת תשלום ללקוח בנוסח מנומס ומוכן מראש',
          'לוח רואי חשבון: כל הלקוחות, דגלי סיכון ושיתוף מבוקר',
          'ייבוא חשבוניות מקובץ CSV או מתוכנת חשבוניות נתמכת',
        ],
        en: [
          'Every invoice gets payment terms and an expected date that learns from the client’s history',
          'Automatic set-aside for VAT, tax advances and national insurance by business profile',
          'A ninety-day line: "mine" versus "the state’s" with a personal red line',
          'Early warning for a week when the balance is expected to fall below the red line',
          'Client payment reminder in a polite, ready-made wording',
          'Accountant board: all clients, risk flags and controlled sharing',
          'Invoice import from CSV or a supported invoicing tool',
        ],
      },
      screens: [
        { name: { he: 'תזרים', en: 'Cash flow' }, description: { he: 'קו 90 יום עם שתי שכבות (שלי/של המדינה), קו אדום ונקודות תקבול צפויות שאפשר לגרור כדי לבדוק תרחיש.', en: 'A ninety-day line with two layers (mine/the state’s), a red line and expected receipts you can drag to test a scenario.' } },
        { name: { he: 'חשבוניות', en: 'Invoices' }, description: { he: 'רשימה ממוינת לפי תאריך צפוי ולא לפי תאריך הנפקה, עם סטטוס (פתוחה, באיחור, שולמה) ולקוח.', en: 'A list sorted by expected date rather than issue date, with status (open, late, paid) and client.' } },
        { name: { he: 'לקוח', en: 'Client' }, description: { he: 'היסטוריית התשלומים של הלקוח, האיחור האופייני שלו, ותנאי התשלום שסוכמו.', en: 'The client’s payment history, their typical delay, and the agreed payment terms.' } },
        { name: { he: 'הפרשות', en: 'Set-asides' }, description: { he: 'כמה הופרש החודש למע״מ, למקדמות ולביטוח לאומי, ומתי כל סכום צריך לצאת.', en: 'How much was set aside this month for VAT, tax advances and national insurance, and when each amount is due.' } },
        { name: { he: 'התראות', en: 'Alerts' }, description: { he: 'שבועות בעייתיים קדימה עם הצעות לפעולה: לשלוח תזכורת, לדחות הוצאה, לשנות תנאי תשלום.', en: 'Problem weeks ahead with suggested actions: send a reminder, postpone an expense, change payment terms.' } },
        { name: { he: 'לוח רואה חשבון', en: 'Accountant board' }, description: { he: 'טבלת לקוחות עם דגל סיכון, תאריך בדיקה אחרון וכפתור לפתיחת התזרים של הלקוח.', en: 'A client table with a risk flag, last-reviewed date and a button to open a client’s cash flow.' } },
        { name: { he: 'הגדרות עוסק', en: 'Business settings' }, description: { he: 'סוג עוסק, שיעורי הפרשה, קו אדום אישי וחיבור לתוכנת החשבוניות.', en: 'Business type, set-aside rates, personal red line and the invoicing tool connection.' } },
      ],
      userJourney: {
        he: [
          'הפרילנסרית מגדירה סוג עוסק, שיעורי הפרשה וקו אדום של 8,000 ש״ח',
          'מייבאת 14 חשבוניות פתוחות מקובץ CSV',
          'האפליקציה מתקנת תאריכים צפויים לפי ההיסטוריה: לקוח אחד תמיד מאחר ב-12 יום',
          'הקו מראה שבעוד חמישה שבועות היתרה יורדת מתחת לקו האדום בדיוק ביום תשלום המע״מ',
          'היא שולחת תזכורת מוכנה לשני לקוחות ודוחה רכישת מחשב',
          'רואה החשבון רואה את הדגל בלוח ומתקשר להציע שינוי בתדירות המקדמות',
        ],
        en: [
          'The freelancer sets her business type, set-aside rates and a red line of 8,000 shekels',
          'Imports fourteen open invoices from a CSV file',
          'The app adjusts expected dates from history: one client always pays twelve days late',
          'The line shows that in five weeks the balance dips below the red line right on VAT day',
          'She sends a ready-made reminder to two clients and postpones a laptop purchase',
          'Her accountant sees the flag on the board and calls to suggest changing the advance schedule',
        ],
      },
      uxDirection: {
        he: 'שקט ומקצועי, בהשראת כלי תכנון ולא תוכנת הנהלת חשבונות: קו 90 הימים הוא המסך הראשי ותופס את רוב הגובה, עם צבע אחד ל"שלי" וצבע מעומעם ל"של המדינה". מספרים מעוגלים לאלפים בתצוגה הראשית, פירוט רק בנגיעה. הלוח לרואי חשבון בנוי לדסקטופ עם טבלה צפופה וסינון מהיר.',
        en: 'Quiet and professional, inspired by planning tools rather than bookkeeping software: the ninety-day line is the main screen and takes most of the height, with one colour for "mine" and a muted one for "the state’s". Numbers are rounded to thousands in the main view, detail on tap. The accountant board is desktop-first with a dense table and quick filters.',
      },
      architecture: {
        he: 'אפליקציית Next.js אחת ורספונסיבית, שמשרתת גם את הפרילנסר בטלפון וגם את לוח רואי החשבון בדסקטופ, מול Supabase: Postgres עם RLS לפי ארגון (משרד רואי חשבון) ולפי עוסק. מנוע התחזית רץ ב-Edge Function: תאריך צפוי לפי תנאי תשלום בתוספת האיחור החציוני של הלקוח, ומפיק סדרה יומית של יתרה חזויה. ההפרשות מחושבות לפי טבלת שיעורים שאפשר לעדכן בלי דיפלוי. ייבוא CSV עם מיפוי עמודות, ואינטגרציה ראשונה לתוכנת חשבוניות אחת דרך API. אפליקציית Expo נדחית לשלב הבא – קודם בסיס קוד אחד.',
        en: 'One responsive Next.js app serving both the freelancer on the phone and the accountant board on desktop, on Supabase: Postgres with RLS per organisation (accounting firm) and per business. The forecast engine runs in an Edge Function: expected date from payment terms plus the client’s median delay, producing a daily projected-balance series. Set-asides come from a rates table that can be updated without a deploy. CSV import with column mapping, and a first API integration with one invoicing tool. An Expo app waits for a later phase – one codebase first.',
      },
      stack: ['Next.js', 'Supabase', 'Supabase Edge Functions', 'PostgreSQL', 'Recharts', 'Resend', 'Stripe'],
      database: {
        he: ['organisations – משרד רואי חשבון וחברי הצוות', 'businesses – העוסק, סוג, שיעורי הפרשה, קו אדום', 'clients – לקוח של העוסק, תנאי תשלום, איחור חציוני', 'invoices – סכום, הנפקה, תנאים, תאריך צפוי, סטטוס', 'receipts – תקבולים בפועל וההפרשות שנגזרו מהם', 'set_asides – מע״מ, מקדמות, ביטוח לאומי ותאריכי יעד', 'forecast_days – יתרה חזויה ליום, מחושבת מראש', 'alerts – שבוע בעייתי, סיבה, פעולה שנבחרה'],
        en: ['organisations – accounting firm and team members', 'businesses – the freelancer’s business, type, set-aside rates, red line', 'clients – the business’s client, payment terms, median delay', 'invoices – amount, issue date, terms, expected date, status', 'receipts – actual payments and the set-asides derived from them', 'set_asides – VAT, advances, national insurance and due dates', 'forecast_days – projected balance per day, precomputed', 'alerts – problem week, reason, chosen action'],
      },
      auth: {
        he: 'כניסה במייל עם קישור קסם או עם Google; רואה חשבון מזמין עוסק דרך קישור, והעוסק מאשר במפורש מה המשרד רואה (תזרים ודגלים, לא פרטי לקוחות). RLS כפולה: לפי עוסק ולפי ארגון, עם לוג גישה.',
        en: 'Email magic link or Google sign-in; an accountant invites a business via a link, and the business explicitly approves what the firm can see (cash flow and flags, not client details). Dual RLS: per business and per organisation, with an access log.',
      },
      monetization: {
        he: ['רישיון למשרדי רואי חשבון לפי מספר לקוחות מחוברים, עם מיתוג המשרד', 'מנוי ישיר לפרילנסרים שמגיעים בלי רואה חשבון', 'תוספים: אינטגרציות לתוכנות חשבוניות ותזכורות אוטומטיות ללקוחות'],
        en: ['A licence for accounting firms priced by connected clients, with the firm’s branding', 'A direct subscription for freelancers who arrive without an accountant', 'Add-ons: invoicing tool integrations and automatic client reminders'],
      },
      mvpMilestones: {
        he: ['מודל נתונים, RLS כפולה וייבוא CSV', 'מנוע תחזית עם איחור חציוני לכל לקוח ובדיקות', 'מסכי התזרים והחשבוניות לפרילנסר, רספונסיביים לטלפון', 'הפרשות אוטומטיות והתראות על שבוע בעייתי', 'לוח רואי חשבון עם הזמנות ואישור שיתוף', 'אינטגרציה ראשונה לתוכנת חשבוניות אחת'],
        en: ['Data model, dual RLS and CSV import', 'Forecast engine with per-client median delay and tests', 'Cash-flow and invoices screens for the freelancer, responsive on the phone', 'Automatic set-asides and problem-week alerts', 'Accountant board with invites and sharing approval', 'First integration with one invoicing tool'],
      },
      risks: {
        he: ['שיעורי הפרשה משתנים ותלויים במצב אישי – חובה להציג אותם כברירת מחדל ניתנת לעריכה ולא כייעוץ מס', 'תחזית טובה דורשת היסטוריה – בחודשים הראשונים להסתמך על תנאי התשלום בלבד ולהגיד זאת', 'משרדי רואי חשבון מאמצים לאט – פיילוט עם משרד אחד לפני בניית הלוח המלא', 'שיתוף נתונים פיננסיים בין עוסק למשרד דורש הסכמה מפורשת ומסמך פרטיות ברור'],
        en: ['Set-aside rates change and depend on personal circumstances – they must be shown as editable defaults, never as tax advice', 'A good forecast needs history – in the first months rely on payment terms alone and say so', 'Accounting firms adopt slowly – pilot with one firm before building the full board', 'Sharing financial data between a business and a firm requires explicit consent and a clear privacy document'],
      },
      expansion: {
        he: ['חיבור לחשבון הבנק דרך בנקאות פתוחה לסימון תקבולים אוטומטי', 'תרחישים: "מה אם אקח עוד לקוח בשוטף+90" או "מה אם אעלה מחיר"', 'מצב סטודיו קטן: כמה פרילנסרים שחולקים הוצאות', 'ייצוא דוח תזרים לבנק לבקשת מסגרת אשראי', 'אפליקציית Expo לפרילנסר עם התראות דחיפה על שבוע בעייתי'],
        en: ['Bank connection via open banking to mark receipts automatically', 'Scenarios: "what if I take another net-90 client" or "what if I raise my rate"', 'Small studio mode: a few freelancers sharing expenses', 'Cash-flow report export for a bank credit line application', 'An Expo app for the freelancer with push alerts for problem weeks'],
      },
    },
  },
  {
    id: 'hindsight',
    name: { he: 'Hindsight – עשור בשוק ב-10 דקות', en: 'Hindsight' },
    tagline: {
      he: 'לחיות עשור מהיסטוריית השווקים ב-10 דקות בלי לדעת איזה עשור זה – ולהרגיש באמת מה זה תנודתיות, עמלות וזמן. בלי ייעוץ ובלי בחירת מניות.',
      en: 'Live a decade of market history in ten minutes without knowing which decade it is – and feel volatility, fees and time. No advice, no stock picks.',
    },
    category: 'finance',
    secondaryCategories: ['education', 'games'],
    difficulty: 'intermediate',
    effort: { weeksMin: 6, weeksMax: 8 },
    budget: 'medium',
    businessModel: 'one-time',
    platforms: ['web'],
    audience: ['consumers', 'students', 'businesses'],
    tags: ['investing', 'education', 'simulation', 'market history', 'index funds', 'fees', 'financial literacy'],
    identity: { hue: 45, glyph: 'Hs', pattern: 'diagonal' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: true, trending: true, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Hindsight הוא משחק למידה על השקעות שלא ממליץ על כלום. מקבלים סכום דמיוני ושלושה "אפיקים" כלליים – מדד מניות עולמי, אג״ח ממשלתי ופיקדון – ונזרקים לנקודת זמן אמיתית בהיסטוריה, בלי לדעת איזו שנה זו. כל סיבוב הוא חודש: כותרות מהתקופה (מעובדות כך שלא יסגירו את השנה), שינויי מחיר אמיתיים מנתוני מדדים ציבוריים, ופיתוי לפעול – למכור בנפילה, להגדיל אחרי עלייה, לברוח לפיקדון. אחרי עשר דקות העשור נגמר, השנה נחשפת, והדיבריף משווה את מה שעשיתם ל"לא לגעת", מראה כמה עלו העמלות וכמה אכלה האינפלציה. המטרה היא לא לנחש נכון אלא להרגיש בגוף את ההטיות שספרי הלימוד רק מתארים.',
        en: 'Hindsight is a learning game about investing that recommends nothing. You get an imaginary sum and three generic "buckets" – a global equity index, government bonds and a deposit – and land at a real point in history without knowing the year. Each round is one month: headlines from the period (edited so they do not reveal the year), real price moves from public index data, and the temptation to act – sell in a crash, pile in after a rally, run to the deposit. After ten minutes the decade ends, the year is revealed, and the debrief compares you with "never touch it" and shows what fees and inflation cost. The goal is not to guess right but to feel the biases that textbooks only describe.',
      },
      problem: {
        he: 'רוב תוכן ההשקעות למתחילים הוא או ייעוץ מוסווה או תיאוריה יבשה. אנשים קוראים על "זמן בשוק" ועל עמלות, ואז מוכרים בנפילה הראשונה כי מעולם לא חוו אחת. סימולטורי מסחר קיימים מלמדים לבחור מניות – בדיוק ההרגל שאף אחד לא רוצה לעודד.',
        en: 'Most beginner investing content is either disguised advice or dry theory. People read about "time in the market" and fees, then sell in the first crash because they have never lived through one. Existing trading simulators teach stock picking – exactly the habit nobody wants to encourage.',
      },
      solution: {
        he: 'עשור עיוור: נחיתה בשנה אמיתית לא ידועה עם שלושה נכסים כלליים בלבד, חודש בכל סיבוב, פיתויים מובנים, ודיבריף שמשווה לתרחיש "לא לגעת" ומכמת עמלות ואינפלציה. שום מניה בודדת, שום המלצה, שום "מה לקנות עכשיו".',
        en: 'The blind decade: a drop into an unknown real year with only three generic assets, one month per round, built-in temptations, and a debrief that compares you with "never touch it" and quantifies fees and inflation. No single stock, no recommendation, no "what to buy now".',
      },
      usp: {
        he: 'הסתרת השנה היא כל הרעיון: בלי חוכמה שבדיעבד, ההחלטות שלכם חושפות את ההטיות שלכם. חינוך דרך חוויה במקום דרך ייעוץ – ולכן זה מתאים גם לבתי ספר ולמעסיקים.',
        en: 'Hiding the year is the whole idea: with no hindsight, your decisions expose your biases. Education through experience rather than advice – which also makes it suitable for schools and employers.',
      },
      targetUsers: {
        he: ['צעירים שפתחו לראשונה תיק או קרן השתלמות ולא יודעים מה לעשות בנפילה', 'סטודנטים ותלמידי תיכון בתוכניות לחינוך פיננסי', 'מעסיקים שרוצים סדנת חינוך פיננסי בלי להיכנס לייעוץ', 'אנשים שרוצים לבדוק את עצמם לפני שהם מתחילים להשקיע'],
        en: ['Young adults who just opened a first portfolio or savings fund and do not know what to do in a crash', 'Students and high-schoolers in financial literacy programmes', 'Employers who want a financial-literacy workshop without crossing into advice', 'People who want to test themselves before they start investing'],
      },
      coreFeatures: {
        he: [
          'נחיתה בשנה אקראית אמיתית מתוך כמה עשורים, בלי לחשוף אותה',
          'שלושה נכסים כלליים בלבד: מדד מניות עולמי, אג״ח ממשלתי, פיקדון',
          'סיבוב = חודש: כותרות מעובדות, מחירים אמיתיים, החלטה אחת',
          'מחוון עמלות: בוחרים מסלול זול או יקר ורואים את ההפרש בסוף',
          'דיבריף: ההחלטות שלכם מול "לא לגעת", עם סימון רגעי פאניקה ואופוריה',
          'כרטיס תוצאה לשיתוף בלי מספרים מביכים – רק הדפוסים שהתגלו',
          'מצב כיתה: מורה מריץ את אותו עשור לכל התלמידים ומשווה דפוסים',
        ],
        en: [
          'A drop into a real random year across several decades, without revealing it',
          'Only three generic assets: a global equity index, government bonds, a deposit',
          'One round = one month: edited headlines, real prices, one decision',
          'A fee slider: pick a cheap or expensive track and see the gap at the end',
          'Debrief: your decisions versus "never touch it", with panic and euphoria moments marked',
          'A shareable result card without embarrassing numbers – only the patterns revealed',
          'Classroom mode: a teacher runs the same decade for every student and compares patterns',
        ],
      },
      screens: [
        { name: { he: 'לובי', en: 'Lobby' }, description: { he: 'בחירת מצב (עשור עיוור, עשור ידוע, כיתה), מחוון עמלות והסבר של שלוש שורות על מה זה לא.', en: 'Mode selection (blind decade, known decade, classroom), the fee slider and a three-line explanation of what this is not.' } },
        { name: { he: 'החודש', en: 'The month' }, description: { he: 'כותרת מהתקופה, שינוי המחירים של שלושת הנכסים, שווי התיק וכפתורי פעולה: להחזיק, להזיז, להוסיף.', en: 'A headline from the period, the three assets’ price moves, portfolio value and action buttons: hold, move, add.' } },
        { name: { he: 'ציר העשור', en: 'Decade timeline' }, description: { he: 'גרף שמתגלה חודש אחרי חודש עם נקודות ההחלטה שלכם מסומנות עליו.', en: 'A chart that reveals itself month by month with your decision points marked on it.' } },
        { name: { he: 'החשיפה', en: 'The reveal' }, description: { he: 'השנה האמיתית נחשפת עם הקשר היסטורי קצר ומה קרה "באמת" בעשור הזה.', en: 'The real year is revealed with brief historical context and what "really" happened in that decade.' } },
        { name: { he: 'דיבריף', en: 'Debrief' }, description: { he: 'שלוש עמודות: אתם, "לא לגעת", ואתם בלי עמלות; רגעי פאניקה ואופוריה מסומנים על הגרף.', en: 'Three columns: you, "never touch it", and you without fees; panic and euphoria moments marked on the chart.' } },
        { name: { he: 'הדפוסים שלי', en: 'My patterns' }, description: { he: 'אחרי כמה עשורים: אילו הטיות חוזרות אצלכם ואיזה עשור היה הכי קשה לכם.', en: 'After several decades: which biases keep showing up for you and which decade was hardest.' } },
        { name: { he: 'מצב כיתה', en: 'Classroom' }, description: { he: 'מורה יוצר מפגש עם קוד, רואה את ההתקדמות של כל התלמידים ומציג השוואת דפוסים אנונימית.', en: 'A teacher creates a session with a code, sees every student’s progress and shows an anonymous pattern comparison.' } },
      ],
      userJourney: {
        he: [
          'המשתמש בוחר "עשור עיוור" ומחוון עמלות בינוני',
          'אחרי 14 חודשים הכותרות מדברות על משבר והתיק יורד בשליש',
          'הוא מעביר הכול לפיקדון ומרגיש הקלה',
          'העשור נגמר, השנה נחשפת, והדיבריף מראה את רגע הפאניקה ואת הפער מול "לא לגעת"',
          'הוא משתף כרטיס תוצאה עם הדפוס "מוכר בנפילה" ומנסה עשור נוסף',
          'בעשור השלישי הוא מחזיק מעמד לאורך הנפילה ורואה את הדפוס משתנה',
        ],
        en: [
          'The user picks "blind decade" and a mid-level fee slider',
          'After fourteen months the headlines speak of a crisis and the portfolio drops by a third',
          'They move everything to the deposit and feel relieved',
          'The decade ends, the year is revealed, and the debrief shows the panic moment and the gap versus "never touch it"',
          'They share a result card with the pattern "sells in a crash" and try another decade',
          'By the third decade they hold through the crash and see the pattern change',
        ],
      },
      uxDirection: {
        he: 'אווירה של מכונת זמן ולא של אפליקציית מסחר: טיפוגרפיה עיתונאית לכותרות, גרף אחד שמצטייר בזמן אמת, ושלושה כפתורי פעולה גדולים. בלי אדום-ירוק מהבהב ובלי מספרים מרצדים – המתח נבנה מהכותרות ומהגרף. כל מסך מזכיר בשורה אחת שזו סימולציה חינוכית ולא ייעוץ.',
        en: 'Time-machine mood rather than trading-app mood: newspaper typography for headlines, a single chart drawing itself in real time, and three large action buttons. No flashing red and green and no flickering numbers – tension comes from the headlines and the chart. Every screen carries a one-line reminder that this is an educational simulation, not advice.',
      },
      architecture: {
        he: 'אפליקציית Next.js שבה הסימולציה רצה כולה בדפדפן: סדרות חודשיות של מדדים ציבוריים ומדד מחירים נארזות מראש כקובצי JSON לפי עשור, והכותרות המעובדות נשמרות עם תגי תקופה. זרעי האקראיות נשמרים כדי שאפשר יהיה לשחזר עשור ולשתף אותו. Supabase לחשבונות אופציונליים, לכרטיסי תוצאה ולמפגשי כיתה; תשלום חד-פעמי דרך Stripe. מודל העמלות והאינפלציה כפונקציות טהורות עם בדיקות.',
        en: 'A Next.js app with the simulation running entirely in the browser: monthly series of public indices and a price index are pre-packaged as JSON per decade, and edited headlines are stored with period tags. Random seeds are saved so a decade can be replayed and shared. Supabase for optional accounts, result cards and classroom sessions; one-time payment via Stripe. Fee and inflation models as pure functions with tests.',
      },
      stack: ['Next.js', 'TypeScript', 'Supabase', 'Stripe', 'Recharts', 'Vercel'],
      database: {
        he: ['decades – חבילת נתונים לעשור: סדרות חודשיות ותגי תקופה', 'headlines – כותרת מעובדת, חודש יחסי, תג תקופה', 'runs – ריצה של משתמש: זרע, עשור, החלטות, תוצאה', 'result_cards – כרטיס לשיתוף עם דפוסים בלבד', 'classrooms – מפגש, קוד, מורה, עשור נבחר', 'classroom_runs – ריצות התלמידים במפגש, אנונימיות להשוואה'],
        en: ['decades – a decade’s data pack: monthly series and period tags', 'headlines – edited headline, relative month, period tag', 'runs – a user run: seed, decade, decisions, outcome', 'result_cards – shareable card with patterns only', 'classrooms – session, code, teacher, chosen decade', 'classroom_runs – student runs in a session, anonymised for comparison'],
      },
      auth: {
        he: 'המשחק הראשון בלי חשבון בכלל. כניסה עם Google או קישור קסם רק כדי לשמור דפוסים לאורך זמן; תלמידים מצטרפים לכיתה עם קוד מפגש וכינוי בלבד, בלי חשבון ובלי מייל, ומורים מאומתים במייל מוסדי. לא נאספים נתונים פיננסיים אמיתיים.',
        en: 'The first game needs no account at all. Google sign-in or a magic link only to keep patterns over time; students join a classroom with a session code and a nickname only, no account and no email, and teachers verify with an institutional email. No real financial data is ever collected.',
      },
      monetization: {
        he: ['עשור אחד חינם; רכישה חד-פעמית פותחת את כל העשורים ואת מצב הדפוסים', 'רישיון כיתה לבתי ספר ולתוכניות חינוך פיננסי', 'סדנאות למעסיקים עם מפגש מונחה ודוח דפוסים אנונימי'],
        en: ['One decade free; a one-time purchase unlocks all decades and the patterns mode', 'A classroom licence for schools and financial literacy programmes', 'Employer workshops with a guided session and an anonymous patterns report'],
      },
      mvpMilestones: {
        he: ['חבילות נתונים לשלושה עשורים וכותרות מעובדות', 'מנוע סימולציה בדפדפן עם מודל עמלות ואינפלציה ובדיקות', 'מסכי החודש, ציר העשור והחשיפה', 'דיבריף עם השוואה ל"לא לגעת" וסימון רגעים', 'כרטיס תוצאה לשיתוף ותשלום חד-פעמי', 'מצב כיתה בסיסי עם קוד מפגש'],
        en: ['Data packs for three decades and edited headlines', 'Browser simulation engine with fee and inflation models and tests', 'Month, decade timeline and reveal screens', 'Debrief with the "never touch it" comparison and marked moments', 'Shareable result card and one-time payment', 'Basic classroom mode with a session code'],
      },
      risks: {
        he: ['הגבול בין חינוך לייעוץ דק – חובה בדיקה משפטית של הניסוחים ושל ההיעדר המוחלט של המלצות', 'רישוי נתוני מדדים: להשתמש רק במקורות ציבוריים עם תנאי שימוש ברורים', 'ביצועי עבר לא מנבאים כלום – המוצר חייב להגיד זאת שוב ושוב בלי להרוס את החוויה', 'כותרות שמסגירות את השנה הורסות את "העשור העיוור" – נדרש תהליך עריכה קפדני'],
        en: ['The line between education and advice is thin – legal review of the wording and of the total absence of recommendations is mandatory', 'Index data licensing: use only public sources with clear terms of use', 'Past performance predicts nothing – the product must keep saying so without ruining the experience', 'Headlines that give away the year ruin the "blind decade" – a strict editing process is required'],
      },
      expansion: {
        he: ['עשורים נוספים ושווקים נוספים, כולל נתונים מישראל', 'מצב "שניים": שני שחקנים באותו עשור עם דיבריף משווה', 'ספריית מושגים קצרה שנפתחת לפי מה שקרה לכם במשחק', 'אפליקציית מובייל עם ריצה יומית של חודש אחד'],
        en: ['More decades and more markets, including Israeli data', 'A "duo" mode: two players in the same decade with a comparative debrief', 'A short concept library that unlocks based on what happened to you in the game', 'A mobile app with a daily one-month run'],
      },
    },
  },
  {
    id: 'charged',
    name: { he: 'Charged – כמה באמת ירד בכרטיס', en: 'Charged' },
    tagline: {
      he: 'ממיר מטבע שמראה מה באמת יירד מהכרטיס, לא את השער שבחדשות: מזינים פעם אחת את עמלת ההמרה שלכם, וכל מחיר בחו״ל הופך לשקלים אמיתיים.',
      en: 'A converter that shows what actually hits your card, not the headline rate: enter your card’s fee once and every price abroad becomes real shekels.',
    },
    category: 'finance',
    secondaryCategories: ['lifestyle'],
    difficulty: 'beginner',
    effort: { weeksMin: 2, weeksMax: 3 },
    budget: 'free',
    businessModel: 'free',
    platforms: ['android', 'ios'],
    audience: ['consumers'],
    tags: ['currency', 'exchange rate', 'travel', 'card fees', 'converter', 'calculator', 'offline'],
    identity: { hue: 275, glyph: 'Ch', pattern: 'dots' },
    flags: { beginnerFriendly: true, profitPotential: 'low', experimental: false, trending: false, featuredWeight: 2 },
    spec: {
      overview: {
        he: 'Charged הוא ממיר מטבע קטן עם טוויסט אחד: הוא יודע כמה הכרטיס שלכם מוסיף. בפעם הראשונה בוחרים את סוג הכרטיס ומזינים את עמלת ההמרה שלו (או מקבלים ברירת מחדל), ומאז כל סכום שמקלידים בחו״ל מוצג בשני מספרים – השער הרשמי והמחיר שבאמת יופיע בדף הפירוט, כולל הפער. מצב "מסוף" עוזר להחליט במקום: לשלם במטבע המקומי או בשקלים כשהמסוף מציע המרה, ומה ההפרש בין שני כרטיסים שיש בארנק. השערים נשמרים למצב לא מקוון, כי דווקא בחו״ל אין גלישה. פרויקט ראשון מושלם: מסך ראשי אחד, חישוב פשוט, ואפשר לסיים בשבועיים-שלושה.',
        en: 'Charged is a small currency converter with one twist: it knows how much your card adds. On first launch you pick your card type and enter its conversion fee (or accept a default), and from then on every amount you type abroad shows two numbers – the official rate and the price that will really appear on your statement, with the gap. A "terminal" mode helps decide on the spot: pay in local currency or in shekels when the terminal offers conversion, and what the difference is between two cards in your wallet. Rates are cached for offline use, because abroad is exactly where you have no data. A perfect first project: one main screen, simple maths, finishable in two to three weeks.',
      },
      problem: {
        he: 'ממירי מטבע מראים את השער היציג, אבל אף אחד לא משלם אותו: הכרטיס מוסיף עמלת המרה, המסוף בחו״ל מציע "לשלם בשקלים" בשער גרוע, וההפתעה מגיעה רק בדף הפירוט חודש אחרי הטיול.',
        en: 'Currency converters show the mid-market rate, but nobody pays it: the card adds a conversion fee, the terminal abroad offers to "pay in shekels" at a poor rate, and the surprise arrives only on the statement a month after the trip.',
      },
      solution: {
        he: 'ממיר שמחשב את המחיר הסופי לפי עמלת הכרטיס שהוגדרה פעם אחת, מציג את הפער מהשער הרשמי, ומשווה בין "מטבע מקומי" ל"שקלים במסוף" ובין שני כרטיסים. עובד בלי רשת עם שערים שמורים.',
        en: 'A converter that computes the final price from a card fee set once, shows the gap from the official rate, and compares "local currency" versus "shekels at the terminal" and one card against another. Works offline with cached rates.',
      },
      usp: {
        he: 'לא עוד ממיר: Charged מתחיל מהכרטיס שלכם ולא מהשער. המספר שהוא מראה הוא זה שיופיע בדף הפירוט – ובמסוף הוא עונה בשנייה על השאלה "מקומי או שקלים?".',
        en: 'Not another converter: Charged starts from your card, not the rate. The number it shows is the one that lands on your statement – and at the terminal it answers "local or shekels?" in a second.',
      },
      targetUsers: {
        he: ['מטיילים שרוצים לדעת מה המחיר האמיתי לפני שהם מקישים', 'מי שמחזיק שני כרטיסים ורוצה לדעת עם איזה לשלם בחו״ל', 'קונים באתרים זרים שמשלמים במטבע חוץ'],
        en: ['Travellers who want the real price before they tap', 'People with two cards who want to know which to use abroad', 'Shoppers on foreign sites paying in foreign currency'],
      },
      coreFeatures: {
        he: [
          'הגדרה חד-פעמית של כרטיס: סוג ועמלת המרה באחוזים',
          'המרה מיידית עם שני מספרים: שער רשמי ומחיר בפועל',
          'מצב מסוף: "מטבע מקומי" מול "שקלים" לפי השער שהמסוף מציע',
          'השוואה בין שני כרטיסים לאותו סכום',
          'שערים שמורים למצב לא מקוון עם חותמת זמן של העדכון האחרון',
          'היסטוריה קצרה של ההמרות האחרונות בטיול',
        ],
        en: [
          'One-time card setup: type and conversion fee in percent',
          'Instant conversion with two numbers: official rate and actual price',
          'Terminal mode: "local currency" versus "shekels" using the rate the terminal offers',
          'Comparison of two cards for the same amount',
          'Cached rates for offline use with a last-updated timestamp',
          'A short history of recent conversions on the trip',
        ],
      },
      screens: [
        { name: { he: 'ממיר', en: 'Converter' }, description: { he: 'מקלדת מספרים גדולה, בורר מטבע, ושני מספרים בולטים: שער רשמי ומה באמת יירד.', en: 'A large numeric keypad, a currency picker, and two prominent numbers: official rate and what will really be charged.' } },
        { name: { he: 'מסוף', en: 'Terminal' }, description: { he: 'מזינים את הסכום ואת השער שהמסוף מציע ומקבלים תשובה אחת גדולה: "מקומי" או "שקלים".', en: 'Enter the amount and the rate the terminal offers and get one big answer: "local" or "shekels".' } },
        { name: { he: 'הכרטיסים שלי', en: 'My cards' }, description: { he: 'עד שלושה כרטיסים עם שם, עמלה וסימון של ברירת המחדל.', en: 'Up to three cards with a name, a fee and a default marker.' } },
        { name: { he: 'היסטוריה', en: 'History' }, description: { he: 'רשימת ההמרות האחרונות עם סכום, מטבע ופער, ואפשרות לנקות.', en: 'A list of recent conversions with amount, currency and gap, and the option to clear it.' } },
        { name: { he: 'הגדרות', en: 'Settings' }, description: { he: 'מטבע בית, רענון שערים ידני, שפה, ומקור השערים.', en: 'Home currency, manual rate refresh, language, and the rates source.' } },
      ],
      userJourney: {
        he: [
          'המשתמשת מגדירה כרטיס עם עמלת המרה של 3%',
          'בבית קפה בליסבון היא מקלידה 12 אירו ורואה את המחיר האמיתי בשקלים ואת הפער',
          'במסוף מציעים לה לשלם בשקלים; היא מזינה את השער המוצע ומקבלת "שלמי במקומי"',
          'בשדה התעופה בלי גלישה – השערים השמורים עדיין עובדים',
          'בחזרה הביתה היא משווה את ההיסטוריה לדף הפירוט ורואה שהמספרים תואמים',
        ],
        en: [
          'The user sets up a card with a 3% conversion fee',
          'At a café in Lisbon she types 12 euros and sees the real shekel price and the gap',
          'The terminal offers to charge in shekels; she enters the offered rate and gets "pay in local"',
          'At the airport with no data – cached rates still work',
          'Back home she compares the history with the statement and the numbers match',
        ],
      },
      uxDirection: {
        he: 'מסך אחד שמשתמשים בו בעמידה וביד אחת: מקלדת ענקית, שני מספרים גדולים, ניגודיות גבוהה לשמש. מצב מסוף נותן תשובה של מילה אחת בצבע ברור. בלי אונבורדינג ארוך – ההגדרה היחידה היא עמלת הכרטיס, ואפשר לדלג עליה.',
        en: 'One screen used standing up with one hand: a huge keypad, two big numbers, high contrast for sunlight. Terminal mode gives a one-word answer in a clear colour. No long onboarding – the only setting is the card fee, and it can be skipped.',
      },
      architecture: {
        he: 'Expo + Expo Router בלי שרת משלנו: שערי חליפין נמשכים מ-API ציבורי חינמי ונשמרים מקומית עם חותמת זמן; החישוב הוא פונקציה טהורה של סכום, שער ועמלה, עם בדיקות יחידה. הכרטיסים וההיסטוריה ב-AsyncStorage. בלי חשבון, ובלי אנליטיקה מעבר לדיווח קריסות.',
        en: 'Expo + Expo Router with no server of our own: exchange rates come from a free public API and are cached locally with a timestamp; the calculation is a pure function of amount, rate and fee, with unit tests. Cards and history live in AsyncStorage. No account, and no analytics beyond crash reporting.',
      },
      stack: ['Expo', 'Expo Router', 'AsyncStorage', 'Frankfurter API', 'TypeScript'],
      database: {
        he: ['cards – שם, עמלת המרה, סימון ברירת מחדל (מקומי)', 'rates_cache – שערים לפי מטבע וחותמת זמן (מקומי)', 'conversions – היסטוריית ההמרות האחרונות (מקומי)'],
        en: ['cards – name, conversion fee, default flag (local)', 'rates_cache – rates per currency with a timestamp (local)', 'conversions – recent conversion history (local)'],
      },
      auth: {
        he: 'אין חשבון ואין כניסה: כל הנתונים נשמרים על המכשיר בלבד, ואפשר למחוק הכול בלחיצה אחת ממסך ההגדרות.',
        en: 'No account and no sign-in: all data stays on the device only, and everything can be wiped with one tap from the settings screen.',
      },
      monetization: {
        he: ['חינם לחלוטין בגרסה הראשונה – פרויקט פורטפוליו שמלמד Expo מקצה לקצה', 'אפשרות עתידית: רכישה חד-פעמית קטנה שפותחת יותר משלושה כרטיסים וערכות צבע', 'אפשרות עתידית: צנצנת טיפים למי שהאפליקציה חסכה לו בטיול'],
        en: ['Completely free in the first version – a portfolio project that teaches Expo end to end', 'Possible later: a small one-time purchase that unlocks more than three cards and colour themes', 'Possible later: a tip jar for people the app saved money on a trip'],
      },
      mvpMilestones: {
        he: ['חישוב טהור של המחיר בפועל עם בדיקות יחידה', 'מסך הממיר עם מקלדת ובורר מטבע', 'משיכת שערים, שמירה מקומית ומצב לא מקוון', 'הגדרת כרטיסים ומצב מסוף', 'עמוד חנות וצילומי מסך'],
        en: ['Pure actual-price calculation with unit tests', 'Converter screen with keypad and currency picker', 'Rate fetching, local caching and offline mode', 'Card setup and terminal mode', 'Store listing and screenshots'],
      },
      risks: {
        he: ['עמלות הכרטיסים שונות בין מנפיקים ומשתנות לאורך זמן – המשתמש חייב להזין אותן בעצמו ולא לסמוך על ברירת מחדל', 'API חינמי עלול להיעלם – להפריד את מקור השערים מאחורי ממשק אחד', 'ההבדל בין שער המסוף לשער הכרטיס מבלבל – דרוש הסבר של משפט אחד במסך המסוף'],
        en: ['Card fees differ between issuers and change over time – the user must enter them and not rely on a default', 'A free API can disappear – keep the rates source behind a single interface', 'The difference between the terminal rate and the card rate is confusing – a one-sentence explanation is needed on the terminal screen'],
      },
      expansion: {
        he: ['ווידג׳ט למסך הבית עם המטבע של הטיול הנוכחי', 'סריקת תג מחיר עם המצלמה והמרה מיידית', 'סיכום טיול: כמה העמלות עלו בסך הכול'],
        en: ['A home-screen widget with the current trip’s currency', 'Price-tag scanning with the camera and instant conversion', 'Trip summary: what the fees cost in total'],
      },
    },
  },
];
