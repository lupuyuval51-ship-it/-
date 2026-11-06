import type { Idea } from '../types';

/**
 * Developer Tools – products developers happily pay for: companions to the
 * terminal, monitoring micro-SaaS, AI-coding workflow tooling, onboarding
 * docs that stay correct, and small utilities that are fun to build.
 */
export const ideas: Idea[] = [
  {
    id: 'kettle',
    name: { he: 'Kettle – הטרמינל מצלצל לנייד', en: 'Kettle' },
    tagline: {
      he: 'עוטפים פקודה ארוכה ב-kettle, הולכים לקפה, והנייד מקבל התראה עם קוד היציאה, השורות האחרונות של הפלט וכפתור להריץ שוב.',
      en: 'Wrap a long command in kettle, go get coffee, and your phone gets a push with the exit code, the last lines of output and a one-tap re-run.',
    },
    category: 'devtools',
    secondaryCategories: ['productivity'],
    difficulty: 'intermediate',
    effort: { weeksMin: 5, weeksMax: 8 },
    budget: 'low',
    businessModel: 'freemium',
    platforms: ['ios', 'android'],
    audience: ['developers'],
    tags: ['cli', 'terminal', 'notifications', 'builds', 'push', 'companion app', 'devops'],
    identity: { hue: 200, glyph: 'Kt', pattern: 'wave' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: true, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Kettle היא אפליקציית נייד שמגיעה עם כלי שורת פקודה קטן. במקום לבהות בטרמינל ולחכות שבילד, סט טסטים, מיגרציה או ריצה של סוכן קוד ייגמרו, המפתח מקדים לפקודה את המילה kettle והולך לעשות משהו אחר. כשהפקודה מסתיימת, הנייד מקבל התראה עם משך הריצה, קוד היציאה ו-50 השורות האחרונות של הפלט, בצבעי ANSI ואחרי הסתרה אוטומטית של סודות. מתוך ההתראה אפשר להפעיל פעולות המשך שהוגדרו מראש בקובץ קונפיגורציה בפרויקט – להריץ שוב, להריץ את פקודת התיקון, לפתוח את הלוג המלא – בלי שהנייד מקבל אי פעם shell חופשי על המחשב. ההבדל מכלי התראות גנריים הוא התוכן: לא "הפקודה נגמרה" אלא מה קרה ומה עושים עכשיו.',
        en: 'Kettle is a mobile app paired with a tiny command-line tool. Instead of watching a build, a test suite, a migration or a coding-agent run finish, the developer prefixes the command with kettle and walks away. When it ends, the phone gets a push with the duration, the exit code and the last 50 lines of output, in ANSI colour with secrets redacted. From the notification the developer can fire follow-up actions declared in a project config file – re-run, run the fix command, open the full log – without the phone ever getting a free shell on the machine. Unlike generic notification tools, the content is the point: not "the command finished" but what happened and what to do next.',
      },
      problem: {
        he: 'מפתחים מבזבזים שעות על בהייה בטרמינל, או חוזרים אליו כל כמה דקות כדי לבדוק אם הבילד נגמר. מי שמתרחק מגלה כישלון רק אחרי חצי שעה, והפתרונות המקובלים (webhook ל-Slack, סקריפט שמשמיע צליל) מודיעים שמשהו קרה אבל לא מה, ודורשים חיווט ידני מחדש בכל פרויקט.',
        en: 'Developers waste hours staring at a terminal or wandering back every few minutes to see whether the build is done. Step away and a failure is discovered half an hour late, and the usual fixes (a Slack webhook, a script that plays a sound) say that something happened but not what, and need to be wired up by hand in every project.',
      },
      solution: {
        he: 'כלי CLI קטן שעוטף כל פקודה, אוסף משך, קוד יציאה ופלט אחרון, מסתיר סודות לפי תבניות ושולח הכול לאפליקציית נייד דרך Supabase. האפליקציה מציגה פיד חי של ריצות לכל מכונה ומאפשרת להפעיל מהנייד פעולות המשך בטוחות שהוגדרו בקובץ kettle.json בפרויקט.',
        en: 'A small CLI that wraps any command, captures duration, exit code and the output tail, redacts secrets by pattern, and ships everything to a mobile app through Supabase. The app shows a live feed of runs per machine and lets the developer fire safe follow-up actions that were declared in a kettle.json file in the project.',
      },
      usp: {
        he: 'ההתראה מכילה את התשובה ולא רק את השאלה: פלט אחרון בצבע, סיבת הכישלון ופעולת המשך בלחיצה אחת – בלי לתת לנייד אף פעם shell חופשי על המחשב.',
        en: 'The notification carries the answer, not just the question: a colour-rendered output tail, the failure reason and a one-tap follow-up action – without ever giving the phone a free shell on the machine.',
      },
      targetUsers: {
        he: ['מפתחים עם בילד ארוך וטסטים איטיים (מובייל, מונורפו, שפות מקומפלות)', 'מהנדסי דאטה ו-ML שמריצים ג׳ובים של שעות', 'מפתחים שמריצים סוכני קוד ורוצים לדעת מתי הם סיימו או נתקעו'],
        en: ['Developers with long builds and slow test suites (mobile, monorepos, compiled languages)', 'Data and ML engineers running jobs that take hours', 'Developers running coding agents who want to know when they finish or stall'],
      },
      coreFeatures: {
        he: [
          'עטיפת פקודה: kettle npm test – בלי לשנות שום דבר בפרויקט',
          'התראת פוש עם משך, קוד יציאה ו-50 שורות הפלט האחרונות בצבעי ANSI',
          'הסתרת סודות לפי תבניות (טוקנים, מפתחות, כתובות עם סיסמה) לפני שהפלט עוזב את המחשב',
          'פעולות המשך בטוחות מתוך kettle.json: הרצה מחדש, פקודת תיקון, פתיחת לוג',
          'פיד ריצות לפי מכונה ופרויקט עם סטטוס חי',
          'שעות שקט וכללים: רק כישלונות, רק ריצות שנמשכו מעל 2 דקות',
          'צימוד מכונה בסריקת QR, עם רוטציה אוטומטית של הטוקן',
        ],
        en: [
          'Wrap a command: kettle npm test – no project changes required',
          'Push notification with duration, exit code and the last 50 lines in ANSI colour',
          'Secret redaction by pattern (tokens, keys, URLs with passwords) before output leaves the machine',
          'Safe follow-up actions from kettle.json: re-run, fix command, open log',
          'Run feed per machine and project with live status',
          'Quiet hours and rules: failures only, runs longer than two minutes only',
          'Pair a machine by scanning a QR code, with automatic token rotation',
        ],
      },
      screens: [
        { name: { he: 'ריצות', en: 'Runs' }, description: { he: 'פיד של ריצות פעילות ואחרונות, מקובץ לפי מכונה, עם משך חי, סטטוס ומסנן לכישלונות בלבד.', en: 'Feed of active and recent runs grouped by machine, with live duration, status and a failures-only filter.' } },
        { name: { he: 'פרטי ריצה', en: 'Run detail' }, description: { he: 'הפקודה המלאה, משך, קוד יציאה, 50 שורות הפלט האחרונות בצבע, וכפתורי פעולות ההמשך שהוגדרו לפרויקט.', en: 'Full command, duration, exit code, the last 50 lines of output in colour, and the follow-up action buttons declared for the project.' } },
        { name: { he: 'מכונות', en: 'Machines' }, description: { he: 'רשימת המכונות המצומדות עם סטטוס חיבור, מערכת הפעלה, ריצה אחרונה ואפשרות לנתק.', en: 'List of paired machines with connection status, OS, last run and a disconnect option.' } },
        { name: { he: 'צימוד מכונה', en: 'Pair machine' }, description: { he: 'סורק שקורא את קוד ה-QR שהכלי מדפיס בטרמינל, עם אפשרות להקליד קוד קצר במקום; אחרי האישור המכונה מופיעה ברשימה תוך שניות.', en: 'A scanner that reads the QR code the CLI prints in the terminal, with a short typed code as a fallback; once confirmed, the machine appears in the list within seconds.' } },
        { name: { he: 'כללי התראות', en: 'Notification rules' }, description: { he: 'שעות שקט, ספים לפי משך, בחירת פרויקטים, ואפשרות לקבל רק כישלונות או גם הצלחות.', en: 'Quiet hours, duration thresholds, project selection, and whether to receive failures only or successes too.' } },
        { name: { he: 'הגדרות וחשבון', en: 'Settings' }, description: { he: 'התוכנית הנוכחית, השימוש החודשי, ההיסטוריה השמורה, וייצוא של קובץ kettle.json לדוגמה.', en: 'Current plan, usage this month, retained history, and an exportable sample kettle.json.' } },
      ],
      userJourney: {
        he: [
          'המפתח מתקין את הכלי ומצמיד את המחשב לנייד בסריקת QR',
          'מריץ kettle npm run build ויוצא להפסקה',
          'אחרי 11 דקות הנייד מצלצל: הבילד נכשל, קוד יציאה 1, ושגיאת טיפוסים מופיעה בשורות הפלט',
          'לוחץ על "הרץ שוב" אחרי תיקון מהיר מהלפטופ, והריצה השנייה עוברת',
          'מגדיר כלל: התראות רק על ריצות מעל 2 דקות, ובלילה רק על כישלונות',
        ],
        en: [
          'The developer installs the CLI and pairs the laptop with the phone by scanning a QR code',
          'Runs kettle npm run build and heads out for a break',
          'Eleven minutes later the phone buzzes: build failed, exit code 1, a type error visible in the output tail',
          'Taps "re-run" after a quick fix from the laptop, and the second run passes',
          'Sets a rule: notify only on runs over two minutes, and failures only at night',
        ],
      },
      uxDirection: {
        he: 'אסתטיקה של טרמינל בלי גימיקים: מונוספייס רק לפלט, רקע כהה וצבעי ANSI נאמנים למקור. ההתראה עצמה מעוצבת כך שהעובדות החשובות – הצלחה או כישלון ומשך – נקראות בלי לפתוח את האפליקציה. מעט מסכים ובלי אשפי הגדרה.',
        en: 'Terminal aesthetics without the gimmick: monospace only for output, dark background, faithful ANSI colours. The notification itself is designed so the key facts – pass or fail, and duration – are readable without opening the app. Few screens, no setup wizards.',
      },
      architecture: {
        he: 'כלי CLI ב-TypeScript (מופץ דרך npm) שמריץ את הפקודה כתהליך בן, שומר את הפלט בבאפר מעגלי של 50 שורות, מסתיר סודות ושולח אירועי התחלה וסיום ל-Supabase. אפליקציית Expo מאזינה דרך Realtime ומקבלת פוש דרך Expo Notifications. פעולות המשך נשמרות כשורות בטבלה; הכלי במחשב עושה polling קצר ומריץ רק פקודות שמופיעות ב-kettle.json המקומי.',
        en: 'A TypeScript CLI (distributed on npm) runs the command as a child process, keeps a 50-line ring buffer of output, redacts secrets and posts start and finish events to Supabase. The Expo app subscribes via Realtime and receives push through Expo Notifications. Follow-up actions are stored as rows; the CLI on the machine polls briefly and only executes commands that exist in the local kettle.json.',
      },
      stack: ['Expo', 'Expo Router', 'Expo Notifications', 'Supabase', 'Supabase Realtime', 'TypeScript', 'Node.js'],
      database: {
        he: ['profiles – משתמש, תוכנית, העדפות התראה', 'machines – מכונה, טוקן מוצפן, מערכת הפעלה, נראתה לאחרונה', 'runs – פקודה, פרויקט, התחלה, סיום, קוד יציאה, משך', 'run_outputs – השורות האחרונות אחרי הסתרה, לכל ריצה', 'actions – פעולת המשך שהתבקשה, מצב, תוצאה', 'notification_rules – שעות שקט, ספים, פרויקטים'],
        en: ['profiles – user, plan, notification preferences', 'machines – machine, encrypted token, OS, last seen', 'runs – command, project, started, finished, exit code, duration', 'run_outputs – redacted output tail per run', 'actions – requested follow-up action, state, result', 'notification_rules – quiet hours, thresholds, projects'],
      },
      auth: {
        he: 'כניסה עם GitHub או קישור קסם באימייל. הכלי בטרמינל מקבל טוקן מכונה נפרד דרך צימוד QR, עם אפשרות ביטול מהאפליקציה. RLS מבטיח שכל מכונה וריצה שייכות למשתמש אחד בלבד.',
        en: 'GitHub sign-in or an email magic link. The CLI receives its own machine token through QR pairing, revocable from the app. RLS guarantees every machine and run belongs to exactly one user.',
      },
      monetization: {
        he: ['חינם למכונה אחת ו-24 שעות היסטוריה', 'מנוי Pro: מכונות ללא הגבלה, 30 ימי היסטוריה ופעולות המשך', 'תוכנית צוות עם פיד משותף לריצות של כל הצוות'],
        en: ['Free for one machine and 24 hours of history', 'Pro subscription: unlimited machines, 30 days of history and follow-up actions', 'Team plan with a shared feed of everyone’s runs'],
      },
      mvpMilestones: {
        he: ['CLI שעוטף פקודה ושולח אירוע סיום עם קוד יציאה', 'אפליקציה עם צימוד QR ופיד ריצות', 'התראות פוש עם פלט אחרון והסתרת סודות', 'פעולות המשך מ-kettle.json', 'מסך תשלום ומגבלות תוכנית'],
        en: ['CLI that wraps a command and posts a finish event with the exit code', 'App with QR pairing and a run feed', 'Push notifications with the output tail and secret redaction', 'Follow-up actions from kettle.json', 'Paywall and plan limits'],
      },
      risks: {
        he: ['פלט של פקודות מכיל סודות – ההסתרה חייבת לקרות במחשב, לפני השליחה, ולהיות ניתנת להרחבה', 'כלים חינמיים כמו ntfy מכסים את המקרה הבסיסי – הערך חייב להגיע מפעולות ההמשך ומהפוליש', 'פוש לא תמיד מגיע בזמן בכל מכשיר – צריך גם מצב "משוך עכשיו" בתוך האפליקציה'],
        en: ['Command output contains secrets – redaction must happen on the machine, before upload, and be extensible', 'Free tools like ntfy cover the basic case – the value has to come from follow-up actions and polish', 'Push is not always timely on every device – an in-app "pull now" mode is needed as well'],
      },
      expansion: {
        he: ['קליטת סטטוס מ-GitHub Actions ומ-CI אחרים לאותו פיד', 'אפליקציה ל-Apple Watch שמציגה את הריצה הפעילה', 'ממסר של בקשות אישור מסוכני קוד: הסוכן מבקש להריץ פקודה, המפתח מאשר מהנייד'],
        en: ['Ingest status from GitHub Actions and other CI into the same feed', 'An Apple Watch app showing the active run', 'A relay for coding-agent approval prompts: the agent asks to run a command, the developer approves from the phone'],
      },
    },
  },
  {
    id: 'driftwatch',
    name: { he: 'Driftwatch – כש-API חיצוני משתנה', en: 'Driftwatch' },
    tagline: {
      he: 'מנטר את ה-APIs של הספקים שאתם תלויים בהם ומתריע כשמבנה התשובה משתנה – שדה שנעלם, טיפוס שהתחלף, ערך enum חדש – לפני שהקוד שלכם נשבר.',
      en: 'Monitors the third-party APIs you rely on and alerts when the response shape drifts – a missing field, a new type, a new enum value – before your code breaks.',
    },
    category: 'devtools',
    secondaryCategories: ['business'],
    difficulty: 'advanced',
    effort: { weeksMin: 10, weeksMax: 15 },
    budget: 'medium',
    businessModel: 'subscription',
    platforms: ['web'],
    audience: ['developers', 'teams', 'businesses'],
    tags: ['api', 'monitoring', 'schema', 'json', 'alerts', 'integrations', 'saas'],
    identity: { hue: 20, glyph: 'Dw', pattern: 'grid' },
    flags: { beginnerFriendly: false, profitPotential: 'high', experimental: false, trending: false, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Driftwatch הוא שירות ניטור ל-APIs שאתם לא שולטים בהם: ספקי תשלומים, מערכות משלוחים, CRM של לקוח, API של שותף עסקי. במקום לבדוק רק זמינות וקוד סטטוס, השירות מריץ לפי לוח זמנים בקשות אמיתיות שהוקלטו מ-curl או מקובץ HAR, מסיק מכל תשובה סכמת JSON ומשווה אותה לסכמה שאושרה. כשמשהו זז – שדה שנעלם, מספר שהפך למחרוזת, ערך enum חדש, מערך שחוזר ריק – מגיעה התראה שמצביעה על הנתיב המדויק ומסווגת את החומרה: שובר, תוספתי או קוסמטי. הסודות של הבקשות נשמרים בכספת מוצפנת, גוף התשובה המלא לא נשמר, ולכל נקודת קצה יש ציר זמן של גרסאות סכמה.',
        en: 'Driftwatch is a monitoring service for the APIs you do not control: payment providers, shipping systems, a customer’s CRM, a partner’s API. Rather than checking only uptime and status codes, it replays real requests captured from curl or a HAR file on a schedule, infers a JSON schema from every response and compares it with the approved one. When something moves – a field disappears, a number becomes a string, a new enum value shows up, an array comes back empty – an alert points at the exact path and grades the severity: breaking, additive or cosmetic. Request secrets live in an encrypted vault, full response bodies are never stored, and every endpoint keeps a timeline of schema versions.',
      },
      problem: {
        he: 'ספקי API משנים תשובות בלי להודיע, או מודיעים במייל שאף אחד לא קורא. הקוד שלכם ממשיך לעבוד עד שמגיע תשלום עם שדה חסר, ואז אתם שומעים על זה מלקוח. ניטור זמינות רגיל רואה 200 OK ושותק.',
        en: 'API vendors change responses without warning, or announce it in an email nobody reads. Your code keeps working until a payment arrives with a missing field, and you hear about it from a customer. Ordinary uptime monitoring sees 200 OK and stays silent.',
      },
      solution: {
        he: 'מקליטים בקשה אמיתית פעם אחת; Driftwatch מריץ אותה לפי לוח זמנים מכמה אזורים, מסיק סכמה מהתשובה ומשווה לגרסה המאושרת. כל סטייה מתועדת כדיף קריא עם נתיב, חומרה ומה כדאי לבדוק, ונשלחת ל-Slack, למייל או ל-webhook.',
        en: 'Capture a real request once; Driftwatch replays it on a schedule from several regions, infers a schema from the response and compares it with the approved version. Every deviation is recorded as a readable diff with path, severity and what to check, and delivered to Slack, email or a webhook.',
      },
      usp: {
        he: 'ניטור של מבנה ולא רק של זמינות: סכמה שמוסקת אוטומטית, דיף סמנטי עם חומרה, וציר זמן של גרסאות לכל API חיצוני – בלי לכתוב אף בדיקה ידנית.',
        en: 'Monitoring of shape, not just uptime: automatically inferred schemas, a semantic diff with severity, and a version timeline for every external API – without writing a single manual check.',
      },
      targetUsers: {
        he: ['צוותי מוצר שתלויים בחמישה APIs חיצוניים או יותר (תשלומים, משלוחים, מפות)', 'סוכנויות פיתוח שמתחזקות אינטגרציות אצל לקוחות', 'מפתחים עצמאיים שבונים על API של פלטפורמה אחת (Shopify, Stripe, HubSpot)'],
        en: ['Product teams depending on five or more external APIs (payments, shipping, maps)', 'Development agencies maintaining integrations for clients', 'Independent developers building on a single platform API (Shopify, Stripe, HubSpot)'],
      },
      coreFeatures: {
        he: [
          'ייבוא בקשה מפקודת curl או מקובץ HAR',
          'הרצה מתוזמנת מכמה אזורים עם מדידת זמן תגובה',
          'הסקת סכמת JSON אוטומטית, כולל מעקב אחרי ערכי enum',
          'דיף סמנטי בין גרסאות עם סיווג חומרה: שובר, תוספתי, קוסמטי',
          'התראות ל-Slack, למייל ול-webhook עם הנתיב המדויק ששונה',
          'כספת סודות מוצפנת לכותרות ולטוקנים של הבקשות',
          'אישור גרסת סכמה חדשה בלחיצה אחת ("זה בסדר, זו הנורמה החדשה")',
        ],
        en: [
          'Import a request from a curl command or a HAR file',
          'Scheduled replays from several regions with latency measurement',
          'Automatic JSON schema inference, including enum value tracking',
          'Semantic diff between versions graded as breaking, additive or cosmetic',
          'Alerts to Slack, email and webhooks naming the exact path that changed',
          'Encrypted secret vault for request headers and tokens',
          'One-click approval of a new schema version ("this is fine, it is the new normal")',
        ],
      },
      screens: [
        { name: { he: 'לוח בקרה', en: 'Dashboard' }, description: { he: 'כל נקודות הקצה המנוטרות עם מצב הסכמה, זמן תגובה אחרון וסטיות שלא טופלו, ממוינות לפי חומרה.', en: 'Every watched endpoint with schema status, latest latency and unresolved drifts, sorted by severity.' } },
        { name: { he: 'הוספת נקודת קצה', en: 'Add endpoint' }, description: { he: 'הדבקת curl או העלאת HAR, זיהוי אוטומטי של כותרות רגישות להעברה לכספת, ובחירת תדירות ואזורים.', en: 'Paste a curl command or upload a HAR, automatic detection of sensitive headers to move into the vault, and a choice of frequency and regions.' } },
        { name: { he: 'פרטי נקודת קצה', en: 'Endpoint detail' }, description: { he: 'ציר זמן של דגימות, גרף זמן תגובה, הסכמה הנוכחית כעץ מתקפל, וכפתור להצמדת דגימה כבסיס להשוואה.', en: 'Timeline of samples, a latency chart, the current schema as a collapsible tree, and a button to pin a sample as the comparison baseline.' } },
        { name: { he: 'דיף סכמה', en: 'Schema diff' }, description: { he: 'השוואה צד לצד של הגרסה המאושרת מול החדשה, הנתיבים ששונו מודגשים, חומרה לכל שינוי, ואישור או סימון כתקלה.', en: 'Side-by-side comparison of the approved version and the new one, changed paths highlighted, severity per change, and approve or flag as an incident.' } },
        { name: { he: 'כללי התראה', en: 'Alert rules' }, description: { he: 'ערוצים לכל רמת חומרה, השתקה זמנית, וקיבוץ התראות כדי לא להציף את הצוות בלילה.', en: 'Channels per severity, temporary snooze, and alert grouping so the team is not flooded overnight.' } },
        { name: { he: 'כספת', en: 'Vault' }, description: { he: 'רשימת סודות מוצפנים עם היכן כל אחד בשימוש, תאריך רוטציה אחרון, והחלפה בלי לערוך את הבקשות.', en: 'List of encrypted secrets with where each one is used, last rotation date, and replacement without editing the requests.' } },
        { name: { he: 'צוות וחיוב', en: 'Team & billing' }, description: { he: 'חברי סביבת העבודה והרשאותיהם, ניצול המכסה החודשית ושדרוג תוכנית.', en: 'Workspace members and their roles, monthly quota usage and plan upgrades.' } },
      ],
      userJourney: {
        he: [
          'מפתחת בצוות התשלומים מדביקה curl של קריאת "פרטי עסקה" מספק הסליקה',
          'מסמנת את מפתח ה-API ככותרת רגישה והוא עובר לכספת',
          'בוחרת הרצה כל 30 דקות משני אזורים ומאשרת את הסכמה הראשונה',
          'שבועיים אחר כך מגיעה התראה ב-Slack: השדה fee_amount הפך ממספר למחרוזת',
          'הצוות מתקן את הפרסר לפני שעסקה אמיתית נכשלת, ומאשר את הגרסה החדשה בלחיצה',
        ],
        en: [
          'A developer on the payments team pastes the curl for the "transaction details" call of their processor',
          'Marks the API key as a sensitive header and it moves into the vault',
          'Picks a replay every 30 minutes from two regions and approves the first schema',
          'Two weeks later a Slack alert arrives: fee_amount changed from number to string',
          'The team fixes the parser before a real transaction fails, and approves the new version with one click',
        ],
      },
      uxDirection: {
        he: 'ממשק צפוף ומדויק בסגנון כלי תשתית: טבלאות עם מיון, עצים מתקפלים לסכמות, ודיף בצבעים שמרניים (אדום לשבירה, כתום לתוספת, אפור לקוסמטי). בלי אנימציות מיותרות; מצב כהה כברירת מחדל ונגישות מלאה למקלדת.',
        en: 'Dense, precise infrastructure-tool UI: sortable tables, collapsible trees for schemas, and a diff in conservative colours (red for breaking, orange for additive, grey for cosmetic). No decorative animation; dark mode by default and full keyboard accessibility.',
      },
      architecture: {
        he: 'אפליקציית Next.js עם Supabase ל-Postgres, לאימות ול-RLS לפי סביבת עבודה. ההרצות המתוזמנות רצות ב-Cloudflare Workers עם Cron Triggers מכמה אזורים; כל Worker מבצע את הבקשה, מחשב hash וסכמה, ושולח ל-Postgres רק את הסכמה ודגימה חתוכה. מנוע הדיף כתוב ב-TypeScript ומריץ השוואה רקורסיבית עם כללי חומרה. הסודות מוצפנים בהצפנת מעטפת עם מפתח לכל סביבת עבודה. התראות דרך Resend ו-webhooks, חיוב דרך Stripe.',
        en: 'A Next.js app with Supabase for Postgres, auth and per-workspace RLS. Scheduled replays run on Cloudflare Workers with Cron Triggers from several regions; each worker performs the request, computes a hash and a schema, and sends only the schema and a truncated sample to Postgres. The diff engine is TypeScript running a recursive comparison with severity rules. Secrets use envelope encryption with a key per workspace. Alerts go through Resend and webhooks, billing through Stripe.',
      },
      stack: ['Next.js', 'TypeScript', 'Supabase', 'Postgres', 'Cloudflare Workers', 'Resend', 'Stripe'],
      database: {
        he: ['workspaces – סביבת עבודה, תוכנית, מכסה', 'members – משתמשים, תפקידים', 'endpoints – כתובת, שיטה, כותרות, גוף, תדירות, אזורים', 'secrets – הפניות לסודות מוצפנים ותאריך רוטציה', 'samples – hash, סכמה מוסקת, זמן תגובה, סטטוס, אזור', 'schema_versions – גרסאות מאושרות לכל נקודת קצה', 'drifts – דיף, חומרה, מצב (פתוח, אושר, תקלה)', 'alert_channels – Slack, מייל, webhook וכללי ניתוב'],
        en: ['workspaces – workspace, plan, quota', 'members – users, roles', 'endpoints – URL, method, headers, body, frequency, regions', 'secrets – references to encrypted secrets and rotation date', 'samples – hash, inferred schema, latency, status, region', 'schema_versions – approved versions per endpoint', 'drifts – diff, severity, state (open, approved, incident)', 'alert_channels – Slack, email, webhook and routing rules'],
      },
      auth: {
        he: 'כניסה עם GitHub או Google, ואימייל לארגונים. כל שורה שייכת לסביבת עבודה ומוגנת ב-RLS; לצוותים יש תפקידי צופה, עורך ומנהל, ומפתחות API לשימוש ב-CI.',
        en: 'GitHub or Google sign-in, plus email for organisations. Every row belongs to a workspace and is protected by RLS; teams get viewer, editor and admin roles, and API keys for CI usage.',
      },
      monetization: {
        he: ['מנוי חודשי לפי מספר נקודות קצה ותדירות ההרצה', 'תוספת לאזורים מרובים ולהיסטוריה ארוכה', 'תוכנית סוכנויות עם סביבות עבודה נפרדות ללקוחות'],
        en: ['Monthly subscription by number of endpoints and replay frequency', 'Add-on for multiple regions and long history', 'Agency plan with separate workspaces per client'],
      },
      mvpMilestones: {
        he: ['ייבוא curl, כספת סודות והרצה מתוזמנת מאזור אחד', 'הסקת סכמה ודיף עם סיווג חומרה', 'לוח בקרה, פרטי נקודת קצה ואישור גרסה', 'התראות Slack ומייל', 'תוכניות וחיוב ב-Stripe', 'אזור שני והיסטוריה מורחבת'],
        en: ['curl import, secret vault and a scheduled replay from one region', 'Schema inference and diff with severity grading', 'Dashboard, endpoint detail and version approval', 'Slack and email alerts', 'Plans and Stripe billing', 'Second region and extended history'],
      },
      risks: {
        he: ['שמירת מפתחות API של לקוחות היא סיכון אבטחה – הצפנת מעטפת, בלי לוגים של גופי תשובות, וביקורת חיצונית מוקדם ככל האפשר', 'הרצות עולות כסף או נספרות במכסה אצל הספק – להציג עלות משוערת ולהגביל תדירות', 'תשובות שמבנן משתנה באופן טבעי יוצרות רעש – צריך תקופת למידה וסובלנות לשדות אופציונליים', 'הרצה חוזרת של בקשה שאינה אידמפוטנטית (POST שיוצר עסקה) עלולה לגרום לתופעות לוואי אצל הספק – ברירת מחדל ל-GET ואזהרה מפורשת לפני תזמון של בקשות כתיבה'],
        en: ['Holding customers’ API keys is a security liability – envelope encryption, no response-body logging, and an external audit as early as possible', 'Replays may cost money or count against the vendor’s quota – show estimated cost and cap frequency', 'Naturally variable responses create noise – a learning period and tolerance for optional fields are required', 'Replaying a non-idempotent request (a POST that creates a transaction) can cause side effects at the vendor – default to GET and warn explicitly before scheduling write requests'],
      },
      expansion: {
        he: ['תמיכה ב-GraphQL ובניטור של webhooks נכנסים', 'ייצוא בדיקות חוזה ל-CI מתוך הדגימות', 'יומן שינויים שנכתב אוטומטית, עם הצעת תיקון לקוד', 'דף סטטוס פנימי או ציבורי לכל האינטגרציות של הצוות'],
        en: ['GraphQL support and monitoring of inbound webhooks', 'Export contract tests for CI from the samples', 'Auto-written changelog with a suggested code patch', 'An internal or public status page for all of the team’s integrations'],
      },
    },
  },
  {
    id: 'primer',
    name: { he: 'Primer – חוקי הבית לסוכני קוד', en: 'Primer' },
    tagline: {
      he: 'לומד מהערות ה-code review של הצוות, מציע חוקים ל-CLAUDE.md ול-AGENTS.md כ-PR, ומודד אם אותה הערה באמת הפסיקה לחזור.',
      en: 'Mines your code review comments, proposes rules for CLAUDE.md and AGENTS.md as a PR, and measures whether that feedback really stopped recurring.',
    },
    category: 'devtools',
    secondaryCategories: ['ai', 'business'],
    difficulty: 'advanced',
    effort: { weeksMin: 10, weeksMax: 16 },
    budget: 'medium',
    businessModel: 'b2b',
    platforms: ['web'],
    audience: ['teams', 'developers'],
    tags: ['ai coding', 'agents', 'code review', 'github', 'claude code', 'rules', 'context engineering'],
    identity: { hue: 280, glyph: 'Pm', pattern: 'dots' },
    flags: { beginnerFriendly: false, profitPotential: 'high', experimental: true, trending: true, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Primer הוא GitHub App ולוח בקרה לצוותים שעובדים עם סוכני קוד. קובצי ההנחיות שלהם – CLAUDE.md, AGENTS.md, .cursor/rules – נכתבים פעם אחת ביום טוב ואז מתיישנים: הם מפנים לסקריפטים שכבר לא קיימים ולא כוללים את הדברים שהמבקרים מתקנים שוב ושוב. Primer קורא את הערות ה-review על PRs שמוזגו, מקבץ אותן לנושאים חוזרים ("לא משתמשים ב-any", "כל endpoint חדש צריך טסט אינטגרציה"), מנסח מכל נושא חוק מוצע עם דוגמאות אמיתיות ופותח PR לקובץ ההנחיות. אחרי שהחוק ממוזג, Primer עוקב אם אותו סוג הערה אכן פוחת ומסמן חוקים שהתיישנו. כל שינוי עובר דרך PR – אף פעם לא commit ישיר.',
        en: 'Primer is a GitHub App and dashboard for teams that work with coding agents. Their guidance files – CLAUDE.md, AGENTS.md, .cursor/rules – get written once and then rot: they point at scripts that no longer exist and miss the things reviewers keep correcting. Primer reads review comments on merged pull requests, groups them into recurring themes ("do not use any", "every new endpoint needs an integration test"), drafts a proposed rule from each theme with real examples, and opens a PR against the guidance file. Once a rule is merged, it tracks whether that type of comment actually declines, and flags rules that have gone stale. Every change goes through a PR – never a direct commit.',
      },
      problem: {
        he: 'צוותים כותבים הנחיות לסוכני קוד פעם אחת ושוכחים מהן. הסוכן ממשיך לחזור על אותן טעויות, המבקרים כותבים את אותה הערה בפעם העשירית, ואף אחד לא יודע אילו חוקים בקובץ בכלל עובדים ואילו רק שורפים קונטקסט.',
        en: 'Teams write guidance for coding agents once and forget it. The agent keeps making the same mistakes, reviewers type the same comment for the tenth time, and nobody knows which rules in the file actually work and which just burn context window.',
      },
      solution: {
        he: 'פייפליין שמנרמל הערות review, מקבץ אותן בעזרת embeddings ומודל שפה לנושאים חוזרים, מנסח חוק קצר עם דוגמאות מהקוד של הצוות ופותח PR. אחרי המיזוג, מדד חזרתיות לכל חוק מראה אם ההערה פחתה, ובדיקת התיישנות מזהה חוקים שמפנים לקבצים או לפקודות שכבר לא קיימים.',
        en: 'A pipeline that normalises review comments, clusters them with embeddings and a language model into recurring themes, drafts a short rule with examples from the team’s own code and opens a PR. After the merge, a recurrence metric per rule shows whether the comment declined, and a rot check finds rules pointing at files or commands that no longer exist.',
      },
      usp: {
        he: 'קובץ ההנחיות הופך ממסמך שנכתב פעם אחת למערכת עם לולאת משוב: כל חוק נולד מהערה אמיתית, נמדד לפי התוצאה שלו, ונגנז כשהוא מתיישן.',
        en: 'The guidance file turns from a write-once document into a system with a feedback loop: every rule is born from a real comment, measured by its outcome, and retired when it goes stale.',
      },
      targetUsers: {
        he: ['צוותי פיתוח של 5–50 מפתחים שעובדים עם Claude Code, Codex או Cursor', 'ראשי צוותים שאחראים לאיכות הקוד שהסוכנים מייצרים', 'מתחזקים של פרויקטי קוד פתוח שמקבלים הרבה PRs שנכתבו עם AI'],
        en: ['Engineering teams of 5–50 developers using Claude Code, Codex or Cursor', 'Team leads accountable for the quality of agent-written code', 'Open-source maintainers receiving many AI-written pull requests'],
      },
      coreFeatures: {
        he: [
          'התקנת GitHub App וסריקת הערות review מ-PRs שמוזגו',
          'קיבוץ הערות לנושאים חוזרים עם תדירות ודוגמאות',
          'ניסוח חוק מוצע לכל נושא, בפורמט של הכלי שהצוות עובד איתו',
          'פתיחת PR לקובץ ההנחיות עם הסבר ומקורות',
          'מדד חזרתיות לכל חוק: לפני המיזוג ואחריו',
          'זיהוי התיישנות: חוקים שמפנים לקבצים, לפקודות או לספריות שכבר לא קיימים',
          'אנונימיזציה של מחברי ההערות לפני שהן מגיעות למודל',
        ],
        en: [
          'Install a GitHub App and scan review comments from merged PRs',
          'Cluster comments into recurring themes with frequency and examples',
          'Draft a proposed rule per theme, in the format of the tool the team uses',
          'Open a PR against the guidance file with rationale and sources',
          'Recurrence metric per rule: before and after the merge',
          'Rot detection: rules pointing at files, commands or libraries that no longer exist',
          'Anonymisation of comment authors before anything reaches the model',
        ],
      },
      screens: [
        { name: { he: 'ריפו מחוברים', en: 'Connected repos' }, description: { he: 'רשימת הריפו המחוברים עם ציון בריאות לקובץ ההנחיות, מספר ההצעות הפתוחות והחוקים שהתיישנו.', en: 'Connected repositories with a health score for the guidance file, open proposals and stale rules.' } },
        { name: { he: 'נושאים חוזרים', en: 'Recurring themes' }, description: { he: 'כרטיסי נושאים ממוינים לפי תדירות, עם שלוש הערות לדוגמה, מגמה של 90 יום וכפתור "נסח חוק".', en: 'Theme cards sorted by frequency, with three example comments, a 90-day trend and a "draft rule" button.' } },
        { name: { he: 'הצעת חוק', en: 'Rule proposal' }, description: { he: 'טקסט החוק המוצע לעריכה, הקבצים שאליהם הוא מתייחס, תצוגה מקדימה של הדיף וכפתור לפתיחת PR.', en: 'Editable proposed rule text, the files it applies to, a diff preview and a button to open the PR.' } },
        { name: { he: 'בריאות החוקים', en: 'Rule health' }, description: { he: 'כל החוקים הקיימים בקובץ עם סטטוס: פעיל, מיושן, לא נמדד – והסבר לכל סימון.', en: 'Every existing rule in the file with a status: active, stale, unmeasured – and the reason for each flag.' } },
        { name: { he: 'השפעה', en: 'Impact' }, description: { he: 'גרף חזרתיות לכל חוק לפני המיזוג ואחריו, וסיכום חודשי של הערות שנחסכו.', en: 'Recurrence chart per rule before and after the merge, plus a monthly summary of comments avoided.' } },
        { name: { he: 'הגדרות', en: 'Settings' }, description: { he: 'אילו קובצי הנחיות לנהל, אילו כלים (Claude Code, Codex, Cursor), ספי תדירות ומדיניות האנונימיזציה.', en: 'Which guidance files to manage, which tools (Claude Code, Codex, Cursor), frequency thresholds and the anonymisation policy.' } },
      ],
      userJourney: {
        he: [
          'ראשת צוות מתקינה את ה-App על הריפו הראשי ובוחרת את CLAUDE.md לניהול',
          'אחרי סריקה של שלושה חודשי PRs מופיעים 12 נושאים חוזרים; הראשון: "חסר טיפול בשגיאות סביב קריאות fetch"',
          'היא לוחצת "נסח חוק", עורכת משפט אחד ופותחת PR; שני מפתחים מאשרים',
          'אחרי שישה שבועות מסך ההשפעה מראה ירידה ברורה בהערות מהסוג הזה',
          'בדיקת ההתיישנות מסמנת חוק ישן שמפנה לסקריפט שנמחק – היא מאשרת את המחיקה שלו ב-PR',
        ],
        en: [
          'A team lead installs the app on the main repo and selects CLAUDE.md for management',
          'After scanning three months of PRs, twelve recurring themes appear; the top one is "missing error handling around fetch calls"',
          'She taps "draft rule", edits one sentence and opens the PR; two developers approve',
          'Six weeks later the impact screen shows a clear drop in that type of comment',
          'A rot check flags an old rule pointing at a deleted script – she approves its removal via PR',
        ],
      },
      uxDirection: {
        he: 'לוח בקרה שקט שמרגיש כמו GitHub עצמו: טיפוגרפיה ברורה, כרטיסים עם מספרים גדולים ודיפים בסגנון מוכר. השקיפות היא העיצוב – לכל הצעה מצורפות ההערות שהולידו אותה, ולכל מדד מצורף ההסבר איך הוא חושב.',
        en: 'A quiet dashboard that feels like GitHub itself: clear typography, cards with large numbers, familiar diff styling. Transparency is the design – every proposal carries the comments that produced it, and every metric carries how it was computed.',
      },
      architecture: {
        he: 'Next.js ללוח הבקרה ו-GitHub App (Octokit) ל-webhooks של PRs ו-reviews. עבודות רקע ב-Inngest: נרמול הערות, embeddings, קיבוץ וניסוח חוקים דרך Anthropic API. Supabase ל-Postgres עם pgvector, לאימות ול-RLS לפי ארגון. מדד החזרתיות מחושב כמספר הערות לכל 100 שורות שהשתנו, לפני תאריך המיזוג של החוק ואחריו.',
        en: 'Next.js for the dashboard and a GitHub App (Octokit) for PR and review webhooks. Background jobs in Inngest: comment normalisation, embeddings, clustering and rule drafting through the Anthropic API. Supabase for Postgres with pgvector, auth and per-organisation RLS. The recurrence metric is computed as comments per 100 changed lines, before and after the rule’s merge date.',
      },
      stack: ['Next.js', 'TypeScript', 'GitHub App (Octokit)', 'Inngest', 'Supabase', 'pgvector', 'Anthropic API', 'Stripe'],
      database: {
        he: ['organizations – ארגון, תוכנית, מדיניות אנונימיזציה', 'installations – התקנות GitHub App וריפו מחוברים', 'review_comments – הערה מנורמלת, embedding, קובץ, PR, תאריך', 'themes – נושא חוזר, תדירות, דוגמאות מקושרות', 'rule_proposals – טקסט, קובץ יעד, מצב, PR מקושר', 'rules – חוקים קיימים שנותחו מקובץ ההנחיות', 'rule_metrics – חזרתיות לפי חוק ולפי שבוע', 'members – משתמשים ותפקידים'],
        en: ['organizations – org, plan, anonymisation policy', 'installations – GitHub App installs and connected repos', 'review_comments – normalised comment, embedding, file, PR, date', 'themes – recurring theme, frequency, linked examples', 'rule_proposals – text, target file, state, linked PR', 'rules – existing rules parsed from the guidance file', 'rule_metrics – recurrence per rule per week', 'members – users and roles'],
      },
      auth: {
        he: 'התקנת GitHub App ברמת הארגון וכניסת משתמשים עם GitHub OAuth; החברות בארגון ב-GitHub קובעת את ההרשאות. RLS לפי ארגון, והמודל מקבל הערות רק אחרי אנונימיזציה.',
        en: 'GitHub App installation at the organisation level and user sign-in with GitHub OAuth; GitHub org membership determines permissions. RLS per organisation, and the model only ever sees anonymised comments.',
      },
      monetization: {
        he: ['מנוי B2B חודשי לפי מספר הריפו הפעילים', 'חינם לריפו ציבוריים של קוד פתוח', 'תוכנית ארגונית עם מודל פרטי (Bedrock / Vertex) ושמירת נתונים באזור הלקוח'],
        en: ['Monthly B2B subscription by number of active repositories', 'Free for public open-source repositories', 'Enterprise plan with a private model (Bedrock / Vertex) and data residency'],
      },
      mvpMilestones: {
        he: ['GitHub App שאוסף הערות review מ-PRs שמוזגו', 'קיבוץ לנושאים ומסך נושאים חוזרים', 'ניסוח חוק ופתיחת PR ל-CLAUDE.md', 'מדד חזרתיות בסיסי ומסך השפעה', 'זיהוי התיישנות של נתיבים ופקודות', 'חיוב לפי ריפו'],
        en: ['GitHub App that collects review comments from merged PRs', 'Theme clustering and the recurring themes screen', 'Rule drafting and PR creation against CLAUDE.md', 'Basic recurrence metric and the impact screen', 'Rot detection for paths and commands', 'Per-repository billing'],
      },
      risks: {
        he: ['הערות review הן רועשות ולפעמים אישיות – צריך סינון, אנונימיזציה ומדיניות שקופה', 'מדידת ההשפעה מושפעת מגורמים אחרים (צוות שגדל, שינויים אחרים) – להציג אי-ודאות ולא להבטיח סיבתיות', 'צוותים יחששו מחוקים שנכתבו אוטומטית – הכול דרך PR ועם עורך אנושי בתמונה', 'עלות המודל גדלה עם נפח ה-PRs – עיבוד הדרגתי ו-batching'],
        en: ['Review comments are noisy and sometimes personal – filtering, anonymisation and a transparent policy are required', 'Impact measurement is confounded (team growth, other changes) – show uncertainty, never claim causation', 'Teams will distrust auto-written rules – everything goes through a PR with a human editor in the loop', 'Model cost grows with PR volume – incremental processing and batching'],
      },
      expansion: {
        he: ['תמיכה בפורמטים של Cursor, Codex ו-Gemini CLI', 'תוסף IDE שמציג איזה חוק חל על הקובץ הפתוח', 'בדיקת CI שנכשלת כשחוק מפנה לנתיב שנמחק', 'חבילות חוקים משותפות לפי סטאק', 'זיהוי חוקים סותרים או כפולים בין קבצים ובין כלים'],
        en: ['Support for Cursor, Codex and Gemini CLI rule formats', 'An IDE extension showing which rule applies to the open file', 'A CI check that fails when a rule points at a deleted path', 'Shared rule packs by stack', 'Detection of contradictory or duplicate rules across files and tools'],
      },
    },
  },
  {
    id: 'firstday',
    name: { he: 'Firstday – אונבורדינג שמתקן את עצמו', en: 'Firstday' },
    tagline: {
      he: 'מסלול קליטה למפתח חדש שנבנה מהריפו עצמו – כל צעד מגיע עם פקודת בדיקה, וכשצעד נכשל אצל שני מצטרפים ברצף, המתחזק מקבל התראה.',
      en: 'Developer onboarding generated from the repo – every step has a check command, and when it fails for two newcomers in a row the maintainer gets pinged.',
    },
    category: 'devtools',
    secondaryCategories: ['education', 'productivity'],
    difficulty: 'intermediate',
    effort: { weeksMin: 6, weeksMax: 8 },
    budget: 'low',
    businessModel: 'open-source',
    platforms: ['web'],
    audience: ['teams', 'developers'],
    tags: ['onboarding', 'documentation', 'developer experience', 'open source', 'github', 'runbook', 'cli'],
    identity: { hue: 130, glyph: 'Fd', pattern: 'diagonal' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Firstday הופך את מסמך ה"איך מתחילים" המיושן למשהו שאפשר להריץ. כלי CLI בקוד פתוח סורק את הריפו – סקריפטים ב-package.json, Makefile, docker-compose, קובצי .env.example, תיקיות עם CODEOWNERS – ומייצר מסלול קליטה: סדרה של צעדים קצרים, כל אחד עם הסבר, קובץ מקושר, פקודת בדיקה ותוצאה צפויה. המצטרף החדש עובר את המסלול בדפדפן, מריץ firstday check בכל צעד ולוחץ "נתקעתי" כשמשהו לא עובד. לוח המתחזקים מראה איפה אנשים נתקעים ואילו בדיקות נכשלות, ומסמן צעדים שהתיישנו כשהקובץ או הסקריפט שהם מפנים אליו השתנה. התיעוד נשאר נכון כי יש לו לולאת משוב.',
        en: 'Firstday turns the stale "getting started" document into something you can run. An open-source CLI scans the repository – package.json scripts, Makefile, docker-compose, .env.example files, folders with CODEOWNERS – and generates an onboarding trail: a series of short steps, each with an explanation, a linked file, a check command and an expected result. The newcomer walks the trail in the browser, runs firstday check at every step and taps "I am stuck" when something fails. The maintainer dashboard shows where people get stuck and which checks fail, and flags steps that went stale when the file or script they reference changed. The docs stay correct because they have a feedback loop.',
      },
      problem: {
        he: 'מסמכי קליטה נכתבים פעם אחת ומתיישנים תוך חודש. כל מצטרף חדש שורף ימים על סביבת פיתוח שלא עולה, שואל את אותן שאלות ב-Slack, והידע על מה בעצם נשבר נשאר בראש של מי שעזר לו.',
        en: 'Onboarding docs are written once and go stale within a month. Every newcomer burns days on a dev environment that will not start, asks the same questions in Slack, and the knowledge of what actually broke stays in the head of whoever helped.',
      },
      solution: {
        he: 'מסלול קליטה שנוצר מהריפו, עם פקודת בדיקה לכל צעד. הכלי אומר למצטרף אם הצעד הצליח, ולמתחזק – איפה אנשים נתקעים. צעדים שמפנים לקובץ או לפקודה שהשתנו מסומנים אוטומטית לבדיקה.',
        en: 'An onboarding trail generated from the repo, with a check command for every step. The CLI tells the newcomer whether a step passed and tells the maintainer where people get stuck. Steps that reference a changed file or command are flagged automatically for review.',
      },
      usp: {
        he: 'תיעוד קליטה שמתקן את עצמו: כל צעד ניתן להרצה, כל כישלון נמדד, וכל צעד שהתיישן מסומן – במקום מסמך סטטי שאף אחד לא מעדכן.',
        en: 'Self-healing onboarding docs: every step is executable, every failure is measured, and every stale step is flagged – instead of a static document nobody updates.',
      },
      targetUsers: {
        he: ['צוותי פיתוח שמגייסים כמה מפתחים בשנה ומשלמים על כל קליטה בימי עבודה אבודים', 'מתחזקים של פרויקטי קוד פתוח שרוצים שתורמים יגיעו ל-PR ראשון מהר', 'סוכנויות שמעבירות פרויקטים בין מפתחים לעיתים קרובות'],
        en: ['Engineering teams that hire a few developers a year and pay for every onboarding in lost days', 'Open-source maintainers who want contributors to reach a first PR quickly', 'Agencies that hand projects between developers frequently'],
      },
      coreFeatures: {
        he: [
          'firstday init: סריקת הריפו ויצירת מסלול התחלתי מהסקריפטים ומהקונפיגורציה הקיימים',
          'צעדים עם הסבר, קובץ מקושר, פקודת בדיקה ותוצאה צפויה',
          'firstday check: הרצת הבדיקה של הצעד הנוכחי ודיווח על הצלחה או כישלון',
          'כפתור "נתקעתי" ששולח למתחזק את פלט הכישלון אחרי הסתרת סודות',
          'לוח מתחזקים: איפה נתקעים, אילו בדיקות נכשלות וכמה זמן לוקח כל צעד',
          'התראה למתחזק כשאותו צעד נכשל אצל שני מצטרפים ברצף',
          'זיהוי צעדים שהתיישנו כשהקובץ או הסקריפט שהם מפנים אליו השתנה',
          'מפת ריפו: התיקיות והמודולים שהמסלול נוגע בהם, לפי סדר הצעדים, עם בעלים מ-CODEOWNERS',
        ],
        en: [
          'firstday init: scan the repo and generate a starter trail from existing scripts and config',
          'Steps with an explanation, a linked file, a check command and an expected result',
          'firstday check: run the current step’s check and report pass or fail',
          'An "I am stuck" button that sends the failure output (secrets redacted) to the maintainer',
          'Maintainer dashboard: where people get stuck, which checks fail, how long each step takes',
          'Maintainer alert when the same step fails for two newcomers in a row',
          'Stale-step detection when the referenced file or script changes',
          'Repo map: the folders and modules the trail touches, in step order, with owners from CODEOWNERS',
        ],
      },
      screens: [
        { name: { he: 'המסלול', en: 'Trail' }, description: { he: 'רשימת הצעדים עם סימוני הצלחה, הצעד הנוכחי מודגש, ואומדן זמן שנותר לפי מצטרפים קודמים.', en: 'The list of steps with pass marks, the current step highlighted, and an estimate of time left based on previous newcomers.' } },
        { name: { he: 'פרטי צעד', en: 'Step detail' }, description: { he: 'ההסבר, הקובץ המקושר עם קטע קוד, פקודת הבדיקה להעתקה, התוצאה הצפויה וכפתור "נתקעתי".', en: 'The explanation, the linked file with a code excerpt, the copyable check command, the expected result and the "I am stuck" button.' } },
        { name: { he: 'מפת הריפו', en: 'Repo map' }, description: { he: 'תיקיות ומודולים לפי הצעד הראשון שנוגע בהם, עם בעלים מ-CODEOWNERS ומשפט תיאור לכל אחד.', en: 'Folders and modules ordered by the first step that touches them, with owners from CODEOWNERS and a one-line description each.' } },
        { name: { he: 'לוח מתחזקים', en: 'Maintainer dashboard' }, description: { he: 'משפך של מצטרפים לפי צעד, בדיקות שנכשלו לאחרונה, דיווחי "נתקעתי" פתוחים וצעדים שסומנו כמיושנים.', en: 'A funnel of newcomers by step, recently failed checks, open "stuck" reports and steps flagged as stale.' } },
        { name: { he: 'עורך צעדים', en: 'Step editor' }, description: { he: 'עריכת הטקסט, קישור לקובץ או לשורה, הגדרת פקודת בדיקה ותוצאה צפויה, וסידור מחדש בגרירה.', en: 'Edit the text, link a file or line, define the check command and expected result, and reorder by drag.' } },
        { name: { he: 'צוות', en: 'Team' }, description: { he: 'מי נמצא כרגע בקליטה ובאיזה צעד, הזמנות, וחיבור של ריפו נוסף.', en: 'Who is onboarding right now and at which step, invitations, and connecting another repository.' } },
      ],
      userJourney: {
        he: [
          'מתחזקת מריצה firstday init בריפו ומקבלת מסלול של 14 צעדים שנוצר מהסקריפטים הקיימים',
          'היא עורכת שלושה צעדים, מוסיפה תוצאה צפויה לכל אחד ומפרסמת',
          'מפתח חדש פותח את המסלול ביום הראשון ומריץ firstday check אחרי כל צעד',
          'בצעד 6 הבדיקה נכשלת; הוא לוחץ "נתקעתי" והפלט מגיע למתחזקת אחרי הסתרת סודות',
          'המתחזקת מגלה שהסקריפט דורש גרסת Node חדשה יותר, מתקנת את הצעד, והמצטרף הבא עובר חלק',
        ],
        en: [
          'A maintainer runs firstday init in the repo and gets a 14-step trail generated from the existing scripts',
          'She edits three steps, adds an expected result to each and publishes',
          'A new developer opens the trail on day one and runs firstday check after every step',
          'At step 6 the check fails; he taps "I am stuck" and the redacted output reaches the maintainer',
          'She discovers the script needs a newer Node version, fixes the step, and the next newcomer sails through',
        ],
      },
      uxDirection: {
        he: 'תחושה של מדריך מודפס טוב: עמודה אחת, טיפוגרפיה נדיבה, בלוקים של קוד עם כפתור העתקה בולט, וסימוני התקדמות ירוקים ושקטים. לוח המתחזקים הוא ההפך – צפוף, טבלאי וממוקד בחריגות.',
        en: 'Feels like a well-printed manual: a single column, generous typography, code blocks with a prominent copy button, and quiet green progress marks. The maintainer dashboard is the opposite – dense, tabular, focused on exceptions.',
      },
      architecture: {
        he: 'CLI ב-TypeScript (קוד פתוח, npm) שמייצר ומריץ צעדים מקובץ firstday.yaml בריפו, כך שהמסלול מנוהל בגיט יחד עם הקוד. לוח הבקרה ב-Next.js עם MDX לרינדור הצעדים. Supabase לאימות, להתקדמות המצטרפים, לתוצאות הבדיקות ולדיווחי "נתקעתי". GitHub API מזהה שינויים בקבצים המקושרים ומסמן צעדים שהתיישנו.',
        en: 'A TypeScript CLI (open source, on npm) that generates and runs steps from a firstday.yaml file in the repo, so the trail is versioned with the code. A Next.js dashboard renders steps with MDX. Supabase handles auth, newcomer progress, check results and "stuck" reports. The GitHub API detects changes to linked files and flags stale steps.',
      },
      stack: ['TypeScript', 'Node.js', 'Next.js', 'MDX', 'Supabase', 'GitHub API'],
      database: {
        he: ['workspaces – צוות, תוכנית, ריפו מחוברים', 'trails – מסלול, ריפו, גרסה, תאריך פרסום', 'steps – טקסט, קובץ מקושר, פקודת בדיקה, תוצאה צפויה, סדר', 'runs – מצטרף, מסלול, התחלה, צעד נוכחי', 'check_results – צעד, הצלחה או כישלון, משך, פלט מקוצר', 'stuck_reports – צעד, פלט אחרי הסתרה, מצב טיפול', 'members – משתמשים ותפקידים'],
        en: ['workspaces – team, plan, connected repos', 'trails – trail, repo, version, published at', 'steps – text, linked file, check command, expected result, order', 'runs – newcomer, trail, started, current step', 'check_results – step, pass or fail, duration, truncated output', 'stuck_reports – step, redacted output, handling state', 'members – users and roles'],
      },
      auth: {
        he: 'כניסה עם GitHub שמעניקה גישה לפי הרשאות הריפו; הכלי בטרמינל מתחבר דרך device code flow. RLS לפי סביבת עבודה, ותורמים חיצוניים יכולים לעבור מסלול ציבורי גם בלי חשבון.',
        en: 'GitHub sign-in that grants access according to repository permissions; the CLI authenticates through a device-code flow. RLS per workspace, and external contributors can walk a public trail without an account.',
      },
      monetization: {
        he: ['הכלי בקוד פתוח, ולוח הבקרה חינמי למי שמתקין אותו בעצמו', 'לוח מתחזקים מנוהל בענן בתשלום לפי מושב', 'תמיכה ו-SLA לארגונים גדולים'],
        en: ['The CLI is open source, and the dashboard is free when self-hosted', 'Hosted maintainer dashboard priced per seat', 'Support and SLA for larger organisations'],
      },
      mvpMilestones: {
        he: ['CLI עם init ו-check וקובץ firstday.yaml', 'תצוגת מסלול וצעד בדפדפן', 'שמירת התקדמות ותוצאות בדיקות', 'דיווח "נתקעתי" ולוח מתחזקים בסיסי', 'זיהוי צעדים שהתיישנו דרך GitHub API'],
        en: ['CLI with init and check plus the firstday.yaml file', 'Trail and step views in the browser', 'Progress and check-result storage', '"I am stuck" reports and a basic maintainer dashboard', 'Stale-step detection via the GitHub API'],
      },
      risks: {
        he: ['צעדים שנוצרו אוטומטית עלולים להיות שגויים (סקריפט שעובד רק ב-macOS) – לולאת הבדיקה היא רשת הביטחון, אבל מתחזק חייב לעבור עליהם', 'קליטה היא אירוע נדיר בצוותים קטנים – תמחור לפי מושב עשוי להתאים יותר ממנוי חודשי', 'בלי מתחזק שמשקיע במסלול הראשון אין ערך – האונבורדינג של המוצר עצמו חייב להיגמר ב-15 דקות'],
        en: ['Auto-generated steps can be wrong (a script that only works on macOS) – the check loop is the safety net, but a maintainer must review them', 'Onboarding is rare in small teams – per-seat pricing may fit better than a monthly subscription', 'Without a maintainer investing in the first trail there is no value – the product’s own onboarding must take 15 minutes'],
      },
      expansion: {
        he: ['מסלולים לפי משימה: מה לקרוא לפני שנוגעים במודול X', 'אינטגרציית Slack לדיווחי "נתקעתי"', 'ניסוח טיוטות צעדים מהיסטוריית ה-commits בעזרת מודל שפה', 'תמיכה ב-GitLab וב-Bitbucket'],
        en: ['Task-scoped trails: what to read before touching module X', 'Slack integration for "stuck" reports', 'Draft step text from commit history with a language model', 'GitLab and Bitbucket support'],
      },
    },
  },
  {
    id: 'hookbox',
    name: { he: 'Hookbox – תיבת דואר ל-Webhooks', en: 'Hookbox' },
    tagline: {
      he: 'כתובת חד-פעמית שקולטת webhooks, מציגה כל בקשה בנייד עם JSON מעוצב, ומייצאת אותה כ-fixture לטסט וכטיפוס TypeScript – עם סודות מוסתרים.',
      en: 'A throwaway URL that catches webhooks, shows each one on your phone as pretty JSON, and exports it as a test fixture and TypeScript type – secrets masked.',
    },
    category: 'devtools',
    secondaryCategories: ['education'],
    difficulty: 'beginner',
    effort: { weeksMin: 2, weeksMax: 3 },
    budget: 'free',
    businessModel: 'one-time',
    platforms: ['cross-platform'],
    audience: ['developers', 'students'],
    tags: ['webhooks', 'debugging', 'json', 'fixtures', 'typescript', 'testing', 'beginner project'],
    identity: { hue: 50, glyph: 'Hb', pattern: 'ring' },
    flags: { beginnerFriendly: true, profitPotential: 'low', experimental: false, trending: false, featuredWeight: 2 },
    spec: {
      overview: {
        he: 'Hookbox הוא פרויקט ראשון מצוין למי שרוצה לבנות כלי אמיתי למפתחים בשבועיים. האפליקציה יוצרת כתובת ייחודית (תיבה), וכל בקשת HTTP שמגיעה אליה – webhook מ-Stripe, מ-GitHub, מ-Shopify או מכל שירות אחר – מופיעה מיד בנייד עם השיטה, הכותרות וגוף ה-JSON כעץ מתקפל. התוספת שהופכת את זה למועיל באמת: לחיצה אחת מייצאת את הבקשה כ-fixture ל-Vitest או ל-Jest ומייצרת טיפוס TypeScript מהמבנה שלה, כשטוקנים וכתובות אימייל מוסתרים לפי תבניות. במקום להעתיק JSON ידנית מדפי תיעוד, המפתח מקבל טיפוסים ודוגמאות מהתעבורה האמיתית.',
        en: 'Hookbox is a great first project for anyone who wants to ship a real developer tool in two weeks. The app creates a unique URL (an inbox), and every HTTP request that hits it – a Stripe, GitHub, Shopify or any other webhook – shows up on the phone right away with the method, the headers and the JSON body as a collapsible tree. The twist that makes it genuinely useful: one tap exports the request as a Vitest or Jest fixture and generates a TypeScript type from its shape, with tokens and email addresses masked by pattern. Instead of copying JSON out of documentation pages by hand, the developer gets types and examples from real traffic.',
      },
      problem: {
        he: 'כשמחברים webhook חדש, הדבר הראשון שרוצים הוא לראות מה באמת נשלח – ובדרך כלל זה קורה מול שרת מקומי שהאינטרנט לא מגיע אליו. הכלים הקיימים מציגים את הבקשה בדפדפן ונגמרים שם; את הטיפוסים ואת ה-fixtures לטסטים עדיין כותבים ביד.',
        en: 'The first thing you want when wiring a new webhook is to see what is actually being sent – usually against a local server the internet cannot reach. Existing tools show the request in a browser and stop there; the types and the test fixtures still get written by hand.',
      },
      solution: {
        he: 'תיבה עם כתובת ייחודית שנקלטת ב-Edge Function, נשמרת ב-Supabase ונדחפת לאפליקציה ב-Realtime. מסך הבקשה מציג את ה-JSON כעץ, מעתיק כ-curl או כ-fetch, ומייצא fixture וטיפוס TypeScript אחרי הסתרת סודות לפי תבניות שהמשתמש מגדיר.',
        en: 'An inbox with a unique URL received by an Edge Function, stored in Supabase and pushed to the app over Realtime. The request screen renders the JSON as a tree, copies it as curl or fetch, and exports a fixture plus a TypeScript type after masking secrets by user-defined patterns.',
      },
      usp: {
        he: 'לא רק לראות את ה-webhook אלא להפוך אותו לקוד: fixture לטסט וטיפוס TypeScript מהתעבורה האמיתית, עם סודות מוסתרים, בלחיצה אחת מהנייד.',
        en: 'Not just seeing the webhook but turning it into code: a test fixture and a TypeScript type from real traffic, secrets masked, in one tap from your phone.',
      },
      targetUsers: {
        he: ['מפתחים שמחברים אינטגרציה חדשה (תשלומים, CI, מסחר) ורוצים לראות את הבקשות האמיתיות', 'סטודנטים ומפתחים מתחילים שלומדים איך webhooks עובדים', 'מפתחים שכותבים טסטים ורוצים fixtures מנתונים אמיתיים'],
        en: ['Developers wiring a new integration (payments, CI, commerce) who want to see the real requests', 'Students and beginners learning how webhooks work', 'Developers writing tests who want fixtures from real data'],
      },
      coreFeatures: {
        he: [
          'יצירת תיבה עם כתובת ייחודית ו-QR להעתקה מהירה',
          'פיד חי של בקשות נכנסות עם שיטה, גודל וזמן',
          'תצוגת בקשה: כותרות, גוף JSON כעץ מתקפל וטקסט גולמי',
          'העתקה כ-curl או כ-fetch',
          'ייצוא כ-fixture ל-Vitest או ל-Jest וכטיפוס TypeScript',
          'הסתרת סודות לפי תבניות (טוקנים, אימיילים, מספרי כרטיס)',
          'תפוגה אוטומטית של בקשות אחרי 24 שעות',
        ],
        en: [
          'Create an inbox with a unique URL and a QR code for quick copying',
          'Live feed of incoming requests with method, size and time',
          'Request view: headers, JSON body as a collapsible tree, and raw text',
          'Copy as curl or as fetch',
          'Export as a Vitest or Jest fixture and as a TypeScript type',
          'Secret masking by pattern (tokens, emails, card numbers)',
          'Automatic expiry of requests after 24 hours',
        ],
      },
      screens: [
        { name: { he: 'תיבות', en: 'Inboxes' }, description: { he: 'רשימת התיבות עם הכתובת, מספר הבקשות היום וכפתורי העתקה ו-QR; יצירת תיבה חדשה בלחיצה.', en: 'The list of inboxes with their URL, today’s request count and copy/QR buttons; create a new inbox with one tap.' } },
        { name: { he: 'פיד בקשות', en: 'Request feed' }, description: { he: 'בקשות נכנסות בזמן אמת עם שיטה, קוד צבע, גודל וזמן, וסינון לפי שיטה או מילת חיפוש בגוף.', en: 'Incoming requests in real time with method, colour code, size and time, filterable by method or a search term in the body.' } },
        { name: { he: 'פרטי בקשה', en: 'Request detail' }, description: { he: 'לשוניות לכותרות, לגוף כעץ מתקפל ולטקסט גולמי; שורת פעולות להעתקה כ-curl או fetch ולייצוא.', en: 'Tabs for headers, the body as a collapsible tree and raw text; an action bar to copy as curl or fetch and to export.' } },
        { name: { he: 'ייצוא', en: 'Export' }, description: { he: 'תצוגה מקדימה של ה-fixture והטיפוס שנוצרו, מתגי הסתרה לכל תבנית ושם לטיפוס, והעתקה או שיתוף כקובץ.', en: 'Preview of the generated fixture and type, masking toggles per pattern and a type name, then copy or share as a file.' } },
        { name: { he: 'הגדרות', en: 'Settings' }, description: { he: 'תבניות הסתרה, משך שמירה לכל תיבה, והשדרוג החד-פעמי עם מה שהוא פותח.', en: 'Masking patterns, per-inbox retention length, and the one-time upgrade with what it unlocks.' } },
      ],
      userJourney: {
        he: [
          'מפתחת יוצרת תיבה ומדביקה את הכתובת כ-endpoint של webhook ב-Stripe',
          'שולחת תשלום בדיקה; הבקשה מופיעה בפיד בנייד תוך שנייה',
          'פותחת את הבקשה, מרחיבה את עץ ה-JSON ומוצאת את השדה שהיא צריכה',
          'מייצאת fixture ל-Vitest וטיפוס StripeInvoicePaid, כשהאימייל של הלקוח מוסתר',
          'מדביקה את שניהם בפרויקט וכותבת את הטסט הראשון בלי לנחש את המבנה',
        ],
        en: [
          'A developer creates an inbox and pastes its URL as a webhook endpoint in Stripe',
          'Sends a test payment; the request shows up in the feed on the phone within a second',
          'Opens the request, expands the JSON tree and finds the field she needs',
          'Exports a Vitest fixture and a StripeInvoicePaid type with the customer email masked',
          'Pastes both into the project and writes the first test without guessing the shape',
        ],
      },
      uxDirection: {
        he: 'כלי עבודה פשוט ובהיר: רקע כהה, מונוספייס לכל מה שהוא קוד, צבע אחד לכל שיטת HTTP, ועץ JSON שנפתח ונסגר בלחיצה עם אנימציה קצרה. כל פעולה חשובה נמצאת בשורת פעולות אחת בתחתית המסך.',
        en: 'A simple, clear work tool: dark background, monospace for anything that is code, one colour per HTTP method, and a JSON tree that expands and collapses with a short animation. Every important action lives in a single action bar at the bottom of the screen.',
      },
      architecture: {
        he: 'Expo עם Expo Router לכל הפלטפורמות. Supabase Edge Function מקבלת כל בקשה לכתובת התיבה, אוכפת מגבלות גודל וקצב, מסתירה סודות ושומרת בטבלת requests; האפליקציה מאזינה ב-Realtime, והרכישה החד-פעמית עוברת דרך RevenueCat. יצירת הטיפוסים נעשית בצד הלקוח בפונקציה קטנה שמסיקה טיפוס מ-JSON – קטע מצוין להתאמן עליו.',
        en: 'Expo with Expo Router for every platform. A Supabase Edge Function receives each request to an inbox URL, enforces size and rate limits, masks secrets and stores it in a requests table; the app subscribes over Realtime, and the one-time purchase goes through RevenueCat. Type generation happens on the client in a small function that infers a type from JSON – a perfect piece to learn on.',
      },
      stack: ['Expo', 'Expo Router', 'Supabase', 'Supabase Edge Functions', 'Supabase Realtime', 'RevenueCat', 'TypeScript'],
      database: {
        he: ['profiles – משתמש, תוכנית, תבניות הסתרה', 'inboxes – slug ייחודי, בעלים, משך שמירה', 'requests – תיבה, שיטה, כותרות, גוף, גודל, זמן קבלה', 'exports – ה-fixture והטיפוס שנוצרו ושם הטיפוס'],
        en: ['profiles – user, plan, masking patterns', 'inboxes – unique slug, owner, retention', 'requests – inbox, method, headers, body, size, received at', 'exports – generated fixture and type plus the type name'],
      },
      auth: {
        he: 'כניסה אנונימית של Supabase בהפעלה הראשונה, כדי שאפשר יהיה ליצור תיבה בלי הרשמה, עם שדרוג לאימייל או ל-GitHub כדי לשמור את התיבות בין מכשירים. RLS לפי בעלים, וה-slug של התיבה ארוך ולא ניתן לניחוש.',
        en: 'Supabase anonymous sign-in on first launch so an inbox can be created without registering, upgradeable to email or GitHub to keep inboxes across devices. RLS per owner, and inbox slugs are long and unguessable.',
      },
      monetization: {
        he: ['חינם לשתי תיבות ו-24 שעות שמירה', 'רכישה חד-פעמית: תיבות ללא הגבלה, 7 ימי שמירה ו-slug מותאם אישית', 'אפשרות למכור את קוד המקור כתבנית התחלה למפתחים שלומדים Supabase'],
        en: ['Free for two inboxes and 24 hours of retention', 'One-time purchase: unlimited inboxes, seven days of retention and a custom slug', 'Optionally sell the source as a starter template for developers learning Supabase'],
      },
      mvpMilestones: {
        he: ['Edge Function שקולטת בקשה ושומרת אותה', 'מסכי תיבות ופיד עם Realtime', 'מסך בקשה עם עץ JSON והעתקה כ-curl', 'ייצוא fixture וטיפוס עם הסתרת סודות', 'תפוגה אוטומטית ורכישה חד-פעמית דרך RevenueCat'],
        en: ['Edge Function that receives a request and stores it', 'Inbox and feed screens with Realtime', 'Request screen with a JSON tree and copy as curl', 'Fixture and type export with secret masking', 'Automatic expiry and the one-time unlock through RevenueCat'],
      },
      risks: {
        he: ['ניצול לרעה של התיבות כאחסון או כממסר חינמי – מגבלות גודל וקצב כבר ב-Edge Function', 'סודות אמיתיים בתוך ה-payloads – הסתרה בצד השרת ושמירה קצרה כברירת מחדל', 'cold start של הפונקציה עלול לגרום לבקשה הראשונה להיראות כאילו לא הגיעה'],
        en: ['Abuse of inboxes as free storage or a relay – size and rate limits enforced in the Edge Function', 'Real secrets inside payloads – server-side masking and short retention by default', 'Cold starts on the function can make the first request look like it never arrived'],
      },
      expansion: {
        he: ['כלי CLI קטן שמעביר בקשות מהתיבה לשרת המקומי', 'תיבות משותפות לצוות', 'הסקת סכמה מצטברת מכל הבקשות של תיבה', 'תוסף דפדפן שמציג את התיבה ליד התיעוד של הספק', 'התראת פוש כשמגיעה בקשה לתיבה שמסומנת למעקב'],
        en: ['A small CLI that forwards inbox requests to a local server', 'Shared inboxes for a team', 'Cumulative schema inference across all of an inbox’s requests', 'A browser extension that shows the inbox next to the vendor’s docs', 'Push notification when a request lands in a watched inbox'],
      },
    },
  },
];
