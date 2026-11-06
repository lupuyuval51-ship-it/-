import type { Idea } from '../types';

/**
 * Lifestyle – home, family, travel and routines. Ideas that live in the
 * everyday: who picks up the kids, whether the hike is on this Saturday, the
 * new apartment's paperwork, the balcony, and the evening before tomorrow.
 */
export const ideas: Idea[] = [
  {
    id: 'tagteam',
    name: { he: 'TagTeam – מי עם הילדים', en: 'TagTeam' },
    tagline: {
      he: 'לוח כיסוי משפחתי: מי עם כל ילד בכל שעה, איפה יש חור, ולחיצה אחת לאישור מסירה – במקום להתחשבן בוואטסאפ.',
      en: 'A family coverage board: who has each child at every hour, where the gaps are, and a tap to confirm each handoff – instead of hashing it out on WhatsApp.',
    },
    category: 'lifestyle',
    secondaryCategories: ['productivity'],
    difficulty: 'intermediate',
    effort: { weeksMin: 5, weeksMax: 8 },
    budget: 'low',
    businessModel: 'subscription',
    platforms: ['ios', 'android'],
    audience: ['parents'],
    tags: ['family', 'parents', 'kids', 'pickup', 'carpool', 'scheduling', 'coordination', 'handoff'],
    identity: { hue: 332, glyph: 'Tt', pattern: 'dots' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: false, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'TagTeam מחליפה את השאלה היומית "מי לוקח היום את נועה מהשחייה?" בלוח כיסוי: לכל ילד יש ציר זמן יומי, וכל מבוגר במעגל – הורים, סבים וסבתות, בייביסיטר, ההורה מההסעה המשותפת – "תופס" קטע בציר. האפליקציה מזהה חורים (אף אחד לא רשום על נועה בין 16:00 ל-17:30 ביום שלישי), התנגשויות (אבא רשום בשני מקומות במקביל) ומבקשת אישור קצר ברגע המסירה עצמו. תבנית שבועית לימים א׳–ה׳ ויום שישי קצר נבנית פעם אחת, ושינויים נקודתיים – חוג שבוטל, יום הורים – נכנסים בהודעה אחת. ההבדל מיומן משותף: יומן מראה אירועים, TagTeam מראה אחריות.',
        en: 'TagTeam replaces the daily “who is picking Noa up from swimming?” with a coverage board: every child has a daily timeline, and every adult in the circle – parents, grandparents, the babysitter, the carpool parent – claims a segment of it. The app spots gaps (nobody is on Noa between 16:00 and 17:30 on Tuesday), conflicts (Dad is booked in two places at once) and asks for a one-tap confirmation at the moment of handoff. A weekly template for Sunday–Thursday plus the short Friday is built once; one-off changes – a cancelled class, a parent-teacher day – take a single message. The difference from a shared calendar: a calendar shows events, TagTeam shows responsibility.',
      },
      problem: {
        he: 'הלוגיסטיקה של ילדים מפוזרת בין קבוצות וואטסאפ של הגן, של הכיתה ושל החוג, יומן משותף שאף אחד לא מעדכן, והסכמות בעל-פה עם סבתא. התוצאה: ילד שמחכה בשער כי כל אחד היה בטוח שהשני לוקח, וריבים חוזרים על "אמרתי לך".',
        en: 'Kids’ logistics are scattered across the kindergarten WhatsApp group, the class group, the after-school club, a shared calendar nobody updates, and verbal deals with grandma. The result: a child waiting at the gate because each parent was sure the other one had it, and recurring “I told you” fights.',
      },
      solution: {
        he: 'ציר זמן לכל ילד שמבוגרים תופסים בו קטעים, מנוע שמזהה חורים והתנגשויות לפני שהם קורים, ואישור מסירה ברגע המסירה. תבנית שבועית חוזרת, שינוי נקודתי בהודעה אחת, ושיתוף מוגבל לסבים ולבייביסיטר שרואים רק את מה שרלוונטי להם.',
        en: 'A timeline per child that adults claim segments of, an engine that flags gaps and conflicts before they happen, and a handoff confirmation at the moment of handoff. A recurring weekly template, one-message exceptions, and limited sharing so grandparents and the babysitter see only what concerns them.',
      },
      usp: {
        he: 'לא עוד יומן משותף: TagTeam מנהלת אחריות, לא אירועים. היא יודעת להגיד "ביום חמישי אין מי שייקח את עידו" שלושה ימים מראש, ומוציאה את ההתחשבנות מהשיחה הזוגית.',
        en: 'Not another shared calendar: TagTeam manages responsibility, not events. It can say “nobody is picking Ido up on Thursday” three days ahead, and takes the scorekeeping out of the couple’s conversation.',
      },
      targetUsers: {
        he: ['הורים לשני ילדים ומעלה עם חוגים ומסגרות אחר הצהריים', 'הורים גרושים או פרודים שמנהלים חלוקת זמנים', 'משפחות שסבים וסבתות או בייביסיטר הם חלק קבוע מהשגרה'],
        en: ['Parents of two or more kids with after-school activities', 'Separated or divorced parents managing a custody schedule', 'Families where grandparents or a babysitter are a fixed part of the routine'],
      },
      coreFeatures: {
        he: [
          'ציר זמן יומי לכל ילד עם קטעים שמבוגרים תופסים',
          'זיהוי חורים והתנגשויות עם התראה שלושה ימים מראש',
          'אישור מסירה בלחיצה אחת ברגע המסירה, עם היסטוריה',
          'תבנית שבועית לימים א׳–ה׳ ושישי קצר, ושינוי נקודתי בהודעה אחת',
          'מעגל מבוגרים עם הרשאות: הורים, סבים, בייביסיטר, הסעה משותפת',
          'הודעה מוכנה להדבקה בוואטסאפ: "היום: סבתא לוקחת את נועה ב-16:00"',
        ],
        en: [
          'A daily timeline per child with segments adults claim',
          'Gap and conflict detection with a heads-up three days ahead',
          'One-tap handoff confirmation at the moment of handoff, with history',
          'A Sunday–Thursday weekly template plus short Friday, and one-message exceptions',
          'An adult circle with permissions: parents, grandparents, babysitter, carpool',
          'A ready-to-paste WhatsApp line: “Today: Grandma picks Noa up at 16:00”',
        ],
      },
      screens: [
        { name: { he: 'היום', en: 'Today' }, description: { he: 'כרטיס לכל ילד עם שרשרת המבוגרים של היום, החור הקרוב מודגש באדום וכפתור "קיבלתי" למסירה הבאה.', en: 'A card per child with today’s adult chain, the nearest gap highlighted in red, and a “got them” button for the next handoff.' } },
        { name: { he: 'שבוע', en: 'Week' }, description: { he: 'רשת של ימים מול ילדים, כל תא צבוע לפי המבוגר האחראי, וחורים מסומנים לפני שהם קורים.', en: 'A grid of days by children, each cell coloured by the responsible adult, with gaps marked before they happen.' } },
        { name: { he: 'תפיסת קטע', en: 'Claim a segment' }, description: { he: 'גרירה על ציר הזמן לבחירת שעות, בחירת מבוגר ומקום מסירה, ושמירה כחד-פעמי או כחלק מהתבנית.', en: 'Drag on the timeline to pick hours, choose the adult and the handoff spot, and save as one-off or as part of the template.' } },
        { name: { he: 'שינוי נקודתי', en: 'Exception' }, description: { he: 'טופס קצר: מה השתנה (חוג בוטל, יום הורים), על מי זה משפיע, ומה ההצעה של המערכת לסגירת החור.', en: 'A short form: what changed (class cancelled, parent-teacher day), who it affects, and the system’s suggestion for closing the gap.' } },
        { name: { he: 'המעגל', en: 'Circle' }, description: { he: 'רשימת המבוגרים עם תפקיד והרשאות, הזמנה בקישור, וסימון מי רואה אילו ילדים.', en: 'The list of adults with role and permissions, invite by link, and which children each one can see.' } },
        { name: { he: 'היסטוריה', en: 'History' }, description: { he: 'יומן מסירות מאושרות לפי ילד ושבוע – שימושי להורים פרודים ולהסכמות עם בייביסיטר.', en: 'A log of confirmed handoffs by child and week – useful for separated parents and babysitter agreements.' } },
      ],
      userJourney: {
        he: [
          'הורה פותח משפחה, מוסיף שני ילדים ומזמין את בת הזוג וסבתא בקישור',
          'בונה תבנית שבועית: גן עד 16:00, חוג שחייה בשלישי, שישי קצר',
          'האפליקציה מסמנת חור ביום שלישי אחרי השחייה',
          'סבתא תופסת את הקטע מהטלפון שלה ומקבלת תזכורת ביום עצמו',
          'ברגע האיסוף סבתא לוחצת "קיבלתי" ושני ההורים רואים שהשרשרת נסגרה',
        ],
        en: [
          'A parent creates the family, adds two kids and invites their partner and grandma by link',
          'Builds the weekly template: kindergarten until 16:00, swimming on Tuesday, short Friday',
          'The app flags a gap on Tuesday after swimming',
          'Grandma claims the segment from her own phone and gets a reminder on the day',
          'At pickup grandma taps “got her” and both parents see the chain is closed',
        ],
      },
      uxDirection: {
        he: 'חם ומהיר: המסך הראשי חייב לענות תוך שנייה על "מי עם מי עכשיו". צבע קבוע לכל מבוגר לאורך כל האפליקציה, אדום שמור לחורים בלבד, ושאר הממשק רגוע. טקסט גדול וכפתורים גדולים כי משתמשים בה בחניה עם ילד ביד. RTL מלא, כשציר הזמן רץ בכוונה משמאל לימין, כמו שעון.',
        en: 'Warm and fast: the main screen must answer “who has whom right now” within a second. A fixed colour per adult across the whole app, red reserved for gaps, everything else calm. Large text and big buttons because it is used in a parking lot with a child in one hand. Full RTL, with the time axis deliberately running left to right, like a clock.',
      },
      architecture: {
        he: 'Expo + Expo Router, Supabase לאימות ולנתונים עם RLS לפי משפחה. חישוב החורים וההתנגשויות רץ בצד השרת ב-Edge Function על התבנית והחריגים, ומייצר התראות דרך Expo Notifications. הלוח השבועי נשמר כתבנית חוזרת ורשומות חריגה, לא כאירועים בודדים, כדי שעריכה של התבנית לא תשכתב היסטוריה.',
        en: 'Expo + Expo Router, Supabase for auth and data with per-family RLS. Gap and conflict detection runs server-side in an Edge Function over template + exceptions and sends alerts through Expo Notifications. The weekly schedule is stored as a recurring template plus exception rows, not as individual events, so editing the template never rewrites history.',
      },
      stack: ['Expo', 'Expo Router', 'Supabase', 'Supabase Edge Functions', 'Expo Notifications', 'Reanimated'],
      database: {
        he: ['families – משפחה, אזור זמן, הגדרות שבוע', 'members – מבוגר, תפקיד, הרשאות לפי ילד', 'children – ילד, גיל, מסגרות קבועות (גן, חוגים)', 'template_segments – קטעי אחריות חוזרים לפי יום בשבוע', 'exceptions – שינויים נקודתיים לתאריך ספציפי', 'handoffs – מסירות מאושרות עם זמן ומי אישר'],
        en: ['families – family, time zone, week settings', 'members – adult, role, per-child permissions', 'children – child, age, regular programs (kindergarten, activities)', 'template_segments – recurring responsibility segments by weekday', 'exceptions – one-off changes for a specific date', 'handoffs – confirmed handoffs with time and who confirmed'],
      },
      auth: {
        he: 'כניסה בטלפון (OTP) כי סבים וסבתות לא יזכרו סיסמה, פלוס Apple/Google. הזמנה למשפחה בקישור חד-פעמי, ו-RLS שמגביל כל מבוגר לילדים שהוגדרו לו. לילדים אין פרופיל ציבורי ואין מעקב מיקום – רק שם, גיל ומסגרות.',
        en: 'Phone OTP sign-in because grandparents will not remember a password, plus Apple/Google. Family invites via single-use links, and RLS that limits every adult to the children assigned to them. Children have no public profile and no location tracking – just a name, an age and their programs.',
      },
      monetization: {
        he: ['מנוי משפחתי חודשי אחרי חודש ניסיון – מעגל ללא הגבלה והיסטוריה מלאה', 'גרסה חינמית לשני מבוגרים וילד אחד', 'אפשרות עתידית: חבילה לגני ילדים ולצהרונים שמעדכנים הורים ישירות'],
        en: ['Monthly family subscription after a trial month – unlimited circle and full history', 'Free tier for two adults and one child', 'Possible later: a package for kindergartens and after-school programs that update parents directly'],
      },
      mvpMilestones: {
        he: ['מודל משפחה, ילדים ומעגל מבוגרים עם הזמנה בקישור', 'תבנית שבועית וציר זמן יומי לכל ילד', 'מנוע חורים והתנגשויות עם התראות', 'אישור מסירה והיסטוריה', 'מסך מנוי'],
        en: ['Family, children and adult-circle model with link invites', 'Weekly template and daily timeline per child', 'Gap and conflict engine with alerts', 'Handoff confirmation and history', 'Subscription screen'],
      },
      risks: {
        he: ['אם רק הורה אחד מעדכן, הלוח הופך ללא אמין – זרימת ההזמנה חייבת להביא את כולם ביום הראשון', 'כדי להחליף את וואטסאפ צריך להיות מהירים יותר מהודעה – כל חיכוך הורג', 'מצבים משפחתיים רגישים (גירושין) מחייבים הרשאות מדויקות ושקיפות לגבי מי רואה מה'],
        en: ['If only one parent updates, the board becomes untrustworthy – onboarding must bring everyone in on day one', 'Replacing WhatsApp means being faster than a message – any friction kills it', 'Sensitive family situations (divorce) require precise permissions and transparency about who sees what'],
      },
      expansion: {
        he: ['שיתוף סבב ההסעה המשותפת עם הורים מחוץ למשפחה', 'ייבוא הודעות מהגן: שיתוף הודעה לאפליקציה והצעת שינוי אוטומטית', 'ווידג׳ט למסך הנעילה עם המסירה הבאה'],
        en: ['Sharing the carpool rota with parents outside the family', 'Importing kindergarten messages: share a message to the app and get a suggested change', 'A lock-screen widget with the next handoff'],
      },
    },
  },
  {
    id: 'trailcheck',
    name: { he: 'Trailcheck – יוצאים לטיול?', en: 'Trailcheck' },
    tagline: {
      he: 'תשובה אחת לשאלה "אפשר לצאת לשם בשבת?": עומס חום, שטחי אש, סגירות של שמורות וזרימה בנחלים – למסלול ולתאריך ספציפיים.',
      en: 'One answer to “can we hike there this Saturday?”: heat stress, firing zones, reserve closures and stream flow for a specific trail and date.',
    },
    category: 'lifestyle',
    secondaryCategories: ['health', 'business'],
    difficulty: 'advanced',
    effort: { weeksMin: 12, weeksMax: 18 },
    budget: 'medium',
    businessModel: 'b2b',
    platforms: ['cross-platform'],
    audience: ['consumers', 'professionals', 'businesses'],
    tags: ['hiking', 'travel', 'israel', 'trails', 'weather', 'outdoors', 'guides', 'trip planning'],
    identity: { hue: 196, glyph: 'Tc', pattern: 'diagonal' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: true, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'טיול בארץ נופל בדרך כלל לא על המסלול אלא על הפרטים: עומס חום שהופך נחל למסוכן, שטח אש שסגור בימי חול, שמורה שנסגרה אחרי שריפה, או נחל שזורם רק אחרי גשם. המידע קיים – בתחזית, באתרי הרשויות, בקבוצות פייסבוק – אבל מפוזר ומתיישן. Trailcheck מחברת מסלול לתאריך ומחזירה תשובה אחת: ירוק, צהוב או אדום, עם הסיבות. למטיילים זה חינם. מדריכי טיולים, בתי ספר, תנועות נוער ומפעילי טיולים משלמים על מצב קבוצתי: תכנון לכמה קבוצות, תיעוד הבדיקות שנעשו לפני היציאה, ושיתוף דף בטיחות עם ההורים או הלקוחות. ההבדל מאפליקציות מפה: הן מראות איפה השביל, Trailcheck אומרת אם לצאת אליו היום.',
        en: 'A trip in Israel usually fails on the details, not the route: a heat-stress day that turns a wadi dangerous, a firing zone closed on weekdays, a reserve shut after a fire, or a stream that only flows after rain. The information exists in forecasts, official sites and Facebook groups, but it is scattered and goes stale. Trailcheck ties a route to a date and returns one answer: green, amber or red, with the reasons. Hikers use it for free. Guides, schools, youth movements and tour operators pay for a group mode: planning several groups, documenting pre-departure checks, and sharing a safety page with parents or clients. Map apps show where the trail is; Trailcheck says whether to go today.',
      },
      problem: {
        he: 'מטייל ממוצע בודק את התחזית, אולי מציץ באתר רשות הטבע והגנים, ושוכח את שטחי האש. מדריך מקצועי עושה את אותן בדיקות ידנית לכל קבוצה ולכל תאריך, ואין לו דרך פשוטה להוכיח אחר כך שבדק. התוצאה: טיולים שמתבטלים בשער, קבוצות שנתקעות מול מחסום, ומקרי חום שאפשר היה למנוע.',
        en: 'The average hiker checks the forecast, maybe glances at the Nature and Parks Authority site, and forgets the firing zones. A professional guide repeats those checks by hand for every group and every date, with no simple way to prove afterwards that they were done. The result: trips cancelled at the gate, groups stuck at a checkpoint, and heat incidents that could have been prevented.',
      },
      solution: {
        he: 'מנוע כללים שמצליב מסלול, תאריך וקהל (ילדים, מבוגרים, רמת ניסיון) עם שכבות מידע: תחזית ועומס חום, שטחי אש ותיאומים, סגירות ושעות פעילות של שמורות, זרימה והתראות שיטפון בנחלים, שעות אור ושבת. הפלט הוא רמזור עם הסברים וחלופות קרובות, ולמקצוענים גם תיק בטיחות לכל יציאה.',
        en: 'A rules engine that crosses a route, a date and an audience (kids, adults, experience level) with data layers: forecast and heat stress, firing zones and coordination, reserve closures and opening hours, stream flow and flash-flood alerts, daylight hours and Shabbat. The output is a traffic light with explanations and nearby alternatives, and for professionals a safety file per departure.',
      },
      usp: {
        he: 'אפליקציות מפה עונות "איפה", קבוצות פייסבוק עונות "איך היה שם לפני חודש". Trailcheck עונה "האם לצאת לשם בשבת הקרובה" – ומתעדת את התשובה למי שאחראי על אחרים.',
        en: 'Map apps answer “where”, Facebook groups answer “how it was a month ago”. Trailcheck answers “should we go there this coming Saturday” – and documents the answer for whoever is responsible for others.',
      },
      targetUsers: {
        he: ['משפחות ומטיילי סופ״ש שמתכננים טיול יום', 'מדריכי טיולים ומפעילי טיולים מאורגנים', 'רכזי טיולים בבתי ספר ובתנועות נוער'],
        en: ['Families and weekend hikers planning a day trip', 'Trail guides and organised-tour operators', 'Trip coordinators at schools and youth movements'],
      },
      coreFeatures: {
        he: [
          'רמזור ירוק/צהוב/אדום למסלול ותאריך, עם הסיבות',
          'שכבות מידע: עומס חום, שטחי אש, סגירות שמורות, זרימת נחלים, שעות אור',
          'התאמה לקהל: סף שונה לילדים, למבוגרים ולמנוסים',
          'חלופות קרובות כשהמסלול אדום',
          'מצב קבוצתי: כמה קבוצות, תיק בטיחות לכל יציאה ודף שיתוף להורים',
          'התראה אם הסטטוס השתנה מאז שתכננתם',
          'מצב לא מקוון למסלול שנשמר, כולל נקודות יציאה',
        ],
        en: [
          'Green/amber/red for a route and date, with the reasons',
          'Data layers: heat stress, firing zones, reserve closures, stream flow, daylight hours',
          'Audience-aware thresholds for kids, adults and experienced hikers',
          'Nearby alternatives when a route is red',
          'Group mode: several groups, a safety file per departure and a share page for parents',
          'An alert if the status changed since you planned',
          'Offline mode for a saved route, including exit points',
        ],
      },
      screens: [
        { name: { he: 'בדיקה', en: 'Check' }, description: { he: 'בחירת מסלול מחיפוש או מהמפה, בחירת תאריך וקהל, וכפתור אחד שמחזיר רמזור.', en: 'Pick a route from search or the map, choose a date and audience, and one button returns the traffic light.' } },
        { name: { he: 'תוצאה', en: 'Result' }, description: { he: 'רמזור גדול למעלה, ומתחתיו שורה לכל שכבה (חום, שטח אש, סגירה, נחל) עם מקור ושעת עדכון.', en: 'A big traffic light on top, then one row per layer (heat, firing zone, closure, stream) with source and last-updated time.' } },
        { name: { he: 'חלופות', en: 'Alternatives' }, description: { he: 'שלושה מסלולים קרובים עם רמזור משלהם, מרחק נסיעה ואורך, לבחירה בלחיצה.', en: 'Three nearby routes with their own light, driving distance and length, pickable with one tap.' } },
        { name: { he: 'מפה', en: 'Map' }, description: { he: 'שכבות שאפשר להדליק ולכבות: שטחי אש, שמורות, נחלים, עם סימון המסלול שנבחר.', en: 'Toggleable layers: firing zones, reserves, streams, with the chosen route drawn on top.' } },
        { name: { he: 'הטיולים שלי', en: 'My trips' }, description: { he: 'רשימת טיולים מתוכננים עם הרמזור העדכני לכל אחד והתראה על שינוי.', en: 'Planned trips with the current light for each and a change alert.' } },
        { name: { he: 'קבוצות (מקצועי)', en: 'Groups (pro)' }, description: { he: 'לוח של קבוצות ותאריכים, סטטוס תיק הבטיחות לכל יציאה, ושיתוף דף להורים עם המסלול, השעות והבדיקות – בלי שמות משתתפים.', en: 'A board of groups and dates, safety-file status per departure, and a parent share page with the route, times and checks – no participant names.' } },
        { name: { he: 'תיק בטיחות', en: 'Safety file' }, description: { he: 'רשימת הבדיקות שבוצעו עם חותמת זמן, הערות המדריך, וייצוא ל-PDF.', en: 'The list of checks performed with timestamps, guide notes, and PDF export.' } },
      ],
      userJourney: {
        he: [
          'משפחה מחפשת "נחל עמוד" לשבת הקרובה עם ילדים',
          'הרמזור צהוב: עומס חום בינוני אחרי 11:00, עם המלצה לצאת ב-7:00',
          'המשפחה שומרת את הטיול ומקבלת התראה ביום חמישי שהסטטוס נשאר צהוב',
          'מדריכת טיולים מתכננת את אותו מסלול לשלוש קבוצות ביום שלישי',
          'המערכת מסמנת שטח אש פעיל בימי חול ומציעה מסלול חלופי',
          'המדריכה מייצאת תיק בטיחות ושולחת דף שיתוף להורים',
        ],
        en: [
          'A family searches “Nahal Amud” for the coming Saturday with kids',
          'The light is amber: moderate heat stress after 11:00, with a suggestion to start at 7:00',
          'The family saves the trip and gets a Thursday alert that the status is still amber',
          'A guide plans the same route for three groups on a Tuesday',
          'The system flags a firing zone active on weekdays and suggests an alternative',
          'The guide exports a safety file and sends a share page to the parents',
        ],
      },
      uxDirection: {
        he: 'ברור כמו שלט בכניסה לשמורה: רמזור גדול, צבעים שעובדים גם באור שמש ישיר, וכל "לא" מלווה בסיבה ובחלופה. הטקסט קצר ונקרא בעמידה. מצב מקצועי נפרד בטון רציני יותר, עם טבלאות וייצוא. עברית RTL כברירת מחדל, ושמות מסלולים גם באנגלית.',
        en: 'As clear as the sign at a reserve entrance: a big traffic light, colours that work in direct sunlight, and every “no” comes with a reason and an alternative. Short text that can be read standing up. A separate, more serious professional mode with tables and exports. Hebrew RTL by default, with trail names also in English.',
      },
      architecture: {
        he: 'Expo + Expo Router לאפליקציה ולמצב הקבוצתי בדפדפן מאותו קוד (Expo web), Supabase עם PostGIS לפוליגונים של שטחי אש, שמורות ומסלולים. עבודות רקע (Cron) מושכות תחזיות, סגירות והתראות שיטפונות ושומרות אותן עם חותמת זמן ומקור; מנוע הכללים רץ ב-Edge Function ומחזיר רמזור והסברים. מפות דרך MapLibre עם אריחים שמורים לשימוש לא מקוון.',
        en: 'Expo + Expo Router for the app and for the browser group mode from one codebase (Expo web), Supabase with PostGIS for firing-zone, reserve and route polygons. Background jobs (Cron) pull forecasts, closures and flash-flood alerts and store them with timestamp and source; the rules engine runs in an Edge Function and returns the light with explanations. Maps through MapLibre with tiles cached for offline use.',
      },
      stack: ['Expo', 'Expo Router', 'Supabase', 'PostGIS', 'Supabase Edge Functions', 'MapLibre', 'Expo Notifications'],
      database: {
        he: ['routes – מסלול, גאומטריה, אורך, רמת קושי, נקודות יציאה', 'zones – שטחי אש ושמורות כפוליגונים עם שעות וימים', 'conditions – תצפיות מצב לפי אזור ותאריך: חום, זרימה, סגירה, מקור', 'checks – בדיקה שבוצעה: מסלול, תאריך, קהל, תוצאה והסברים', 'trips – טיולים שמורים של משתמש או קבוצה', 'organizations – ארגונים, חברים, מנוי', 'safety_files – תיקי בטיחות עם רשימת בדיקות וחותמות זמן'],
        en: ['routes – route, geometry, length, difficulty, exit points', 'zones – firing zones and reserves as polygons with hours and days', 'conditions – condition observations by area and date: heat, flow, closure, source', 'checks – a performed check: route, date, audience, result and explanations', 'trips – saved trips of a user or a group', 'organizations – organisations, members, subscription', 'safety_files – safety files with check lists and timestamps'],
      },
      auth: {
        he: 'מטיילים יכולים להשתמש בלי חשבון; שמירת טיולים דורשת כניסה עם Apple/Google או אימייל. ארגונים מקבלים חשבון צוות עם תפקידים (מנהל, מדריך) ו-RLS לפי ארגון.',
        en: 'Hikers can use it without an account; saving trips requires Apple/Google or email sign-in. Organisations get a team account with roles (admin, guide) and per-organisation RLS.',
      },
      monetization: {
        he: ['מנוי שנתי לארגונים לפי מספר מדריכים – מצב קבוצתי, תיקי בטיחות ודפי שיתוף', 'מנוי למדריך עצמאי', 'אפשרות: שיתופי פעולה עם חברות ביטוח טיולים וחנויות ציוד', 'האפליקציה למטיילים נשארת חינמית'],
        en: ['Annual organisation subscription priced per guide – group mode, safety files and share pages', 'Solo-guide subscription', 'Possible: partnerships with trip insurers and gear shops', 'The hiker app stays free'],
      },
      mvpMilestones: {
        he: ['50 מסלולים פופולריים עם גאומטריה ונקודות יציאה', 'שכבת חום ושכבת סגירות עם מנוע כללים ורמזור', 'שכבת שטחי אש ונחלים', 'טיולים שמורים והתראות על שינוי', 'מצב קבוצתי בסיסי עם תיק בטיחות ו-PDF', 'חשבון ארגוני ומנוי'],
        en: ['Fifty popular routes with geometry and exit points', 'Heat and closures layers with the rules engine and traffic light', 'Firing-zone and stream layers', 'Saved trips and change alerts', 'Basic group mode with safety file and PDF', 'Organisation account and subscription'],
      },
      risks: {
        he: ['רמזור ירוק שגוי הוא סיכון בטיחותי ומשפטי – חובה להציג מקור, שעת עדכון והצהרה ברורה שהאחריות על המטייל', 'מקורות המידע משתנים ונשברים, ולחלק מהשכבות (שטחי אש) אין פיד רשמי אלא עדכון ידני – צריך ניטור, ו"לא ידוע" חייב להיות סטטוס לגיטימי', 'ארגונים גדולים קונים לאט – להתחיל ממדריכים עצמאיים ומתנועות נוער'],
        en: ['A wrong green light is a safety and legal risk – source, update time and a clear responsibility disclaimer are mandatory', 'Data sources change and break, and some layers (firing zones) have no official feed and need manual curation – monitoring is needed, and “unknown” must be a legitimate status', 'Large organisations buy slowly – start with solo guides and youth movements'],
      },
      expansion: {
        he: ['דיווחי שטח ממטיילים עם תפוגה אוטומטית ("הנחל יבש היום")', 'תכנון מסלול רב-יומי עם לינות וחניוני לילה', 'גרסה לטיולי חו״ל קצרים של ישראלים: יוון, קפריסין, איטליה'],
        en: ['Field reports from hikers with automatic expiry (“the stream is dry today”)', 'Multi-day planning with overnight campsites', 'A version for Israelis’ short trips abroad: Greece, Cyprus, Italy'],
      },
    },
  },
  {
    id: 'bedek',
    name: { he: 'Bedek – תיק הדירה', en: 'Bedek' },
    tagline: {
      he: 'יומן ליקויים לדירה חדשה מהקבלן: תיעוד עם תמונות וחותמת זמן, מעקב אחרי תקופת הבדק לכל רכיב ומכתב דרישה מוכן – ואחר כך תיק התחזוקה של הדירה.',
      en: 'Defect ledger for a new-build apartment: timestamped photos, warranty tracking per component, a ready notice to the developer – then a home file for life.',
    },
    category: 'lifestyle',
    secondaryCategories: ['finance', 'business'],
    difficulty: 'intermediate',
    effort: { weeksMin: 6, weeksMax: 8 },
    budget: 'low',
    businessModel: 'one-time',
    platforms: ['ios', 'android', 'web'],
    audience: ['consumers', 'professionals'],
    tags: ['home', 'apartment', 'maintenance', 'defects', 'warranty', 'real estate', 'inspection', 'documentation'],
    identity: { hue: 28, glyph: 'Bd', pattern: 'grid' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'קבלת מפתח לדירה חדשה מהקבלן פותחת את תקופת הבדק – מה שכולם קוראים לו "שנת הבדק", אף שלסוגי ליקויים שונים יש תקופות שונות לפי חוק המכר. בתקופה הזאת כל סדק, דלת שלא נסגרת ורטיבות הם לא "נתקן מתישהו" אלא זכות עם תאריך תפוגה, והזכות לתיקון תלויה בדיווח מסודר ובזמן. Bedek הופכת את התקופה הזאת לתהליך: סריקת הדירה חדר-חדר עם תמונות, מיקום וחותמת זמן; שיוך כל ליקוי לסוג ולתקופת הבדק שלו; מכתב דרישה מנוסח שנשלח לקבלן; ומעקב אחרי תיקונים, ביקורים ומה נשאר פתוח. אחרי תום הבדק האפליקציה נשארת תיק הדירה: מערכות, אחריות, בעלי מקצוע שתיקנו ומסמכים – שעובר לקונה הבא יחד עם הדירה.',
        en: 'Getting the keys to a new apartment starts the warranty period – what everyone calls “the bedek year”, though the Sales Law gives different defect types different periods. During it, every crack, sticking door and damp patch is a right with an expiry date – one that depends on reporting it properly and on time. Bedek turns that period into a process: a room-by-room scan with photos, location and timestamp; each defect tagged by type and its warranty period; a drafted notice sent to the developer; and tracking of repairs and open items. After the warranty period the app stays on as the home’s file: systems, warranties, tradespeople and documents – handed on with the apartment.',
      },
      problem: {
        he: 'קונים מגלים ליקויים בטפטופים: היום סדק, בעוד חודש דלת, ומדווחים בוואטסאפ לנציג הקבלן בלי תיעוד, בלי תאריכים ובלי לדעת מה מכוסה. כשמגיע ויכוח, אין הוכחה מתי דווח ומה סוכם, ותקופות הבדק עוברות בשקט.',
        en: 'Buyers discover defects in drips: a crack today, a door next month, reported over WhatsApp to the developer’s rep with no documentation, no dates and no idea what is covered. When a dispute comes, there is no proof of when it was reported or what was agreed, and warranty periods quietly lapse.',
      },
      solution: {
        he: 'סריקה מודרכת של הדירה עם צ׳קליסט לפי חדר, ליקוי = תמונה + מיקום + סוג + חותמת זמן, טבלת תקופות בדק שניתנת לעריכה עם ציון המקור, מכתב דרישה שמופק בלחיצה ונשלח במייל עם אישור מסירה, ולוח מעקב של פתוח / תוקן / במחלוקת. בסוף התקופה – ייצוא תיק מלא ומעבר למצב תחזוקה.',
        en: 'A guided scan of the apartment with a per-room checklist, a defect = photo + location + type + timestamp, an editable warranty-period table with its source, a demand notice generated in one tap and emailed with a delivery receipt, and an open / fixed / disputed tracking board. At the end of the period – full export and a switch to maintenance mode.',
      },
      usp: {
        he: 'לא עוד רשימת מטלות עם תמונות: Bedek יודעת לאיזו תקופת בדק כל ליקוי שייך, מתי הזכות פגה, ומפיקה את הדרישה הרשמית – והיא נשארת עם הדירה גם הרבה אחרי שהבדק נגמר.',
        en: 'Not a to-do list with photos: Bedek knows which warranty period each defect falls under, when the right expires, and produces the formal notice – and it stays with the apartment long after the warranty ends.',
      },
      targetUsers: {
        he: ['קונים של דירה חדשה מקבלן או מפרויקט פינוי-בינוי', 'חברות בדק בית שרוצות למסור ללקוח דוח חי במקום PDF', 'בעלי דירות שרוצים תיק תחזוקה מסודר לקראת מכירה או השכרה'],
        en: ['Buyers of a new apartment from a developer or an urban-renewal project', 'Home-inspection firms that want to hand clients a live report instead of a PDF', 'Owners who want an orderly maintenance file for selling or renting out'],
      },
      coreFeatures: {
        he: [
          'סריקה מודרכת חדר-חדר עם צ׳קליסט של ליקויים נפוצים',
          'ליקוי עם תמונות, מיקום על תוכנית הדירה וחותמת זמן שאי אפשר לערוך',
          'שיוך אוטומטי לסוג ליקוי ולתקופת הבדק, עם ספירה לאחור',
          'מכתב דרישה שמופק מהרשימה ונשלח במייל עם תיעוד שליחה',
          'לוח מעקב: פתוח, נקבע ביקור, תוקן, במחלוקת',
          'ייבוא דוח בדק בית חיצוני לתוך הרשימה (קובץ מובנה או הקלדה מודרכת)',
          'מצב תחזוקה: מערכות, אחריות מוצרים, בעלי מקצוע ומסמכים',
        ],
        en: [
          'Guided room-by-room scan with a checklist of common defects',
          'A defect with photos, location on the floor plan and a non-editable timestamp',
          'Automatic tagging by defect type and warranty period, with a countdown',
          'A demand notice generated from the list and emailed with send records',
          'Tracking board: open, visit scheduled, fixed, disputed',
          'Import of an external home-inspection report into the list (structured file or guided entry)',
          'Maintenance mode: systems, product warranties, tradespeople and documents',
        ],
      },
      screens: [
        { name: { he: 'הדירה שלי', en: 'My apartment' }, description: { he: 'סיכום: כמה ליקויים פתוחים, כמה ימים נשארו לתקופת הבדק הקרובה, והפעולה הבאה.', en: 'Summary: open defects, days left in the nearest warranty period, and the next action.' } },
        { name: { he: 'סריקה', en: 'Scan' }, description: { he: 'מעבר חדר-חדר עם צ׳קליסט, צילום מהיר והוספת ליקוי בשתי לחיצות.', en: 'A room-by-room pass with a checklist, quick capture and adding a defect in two taps.' } },
        { name: { he: 'ליקוי', en: 'Defect' }, description: { he: 'תמונות, מיקום על התוכנית, סוג, תקופת בדק, סטטוס, והיסטוריה של דיווחים וביקורים.', en: 'Photos, location on the plan, type, warranty period, status, and a history of reports and visits.' } },
        { name: { he: 'רשימת ליקויים', en: 'Defect list' }, description: { he: 'טבלה מסוננת לפי חדר, סוג וסטטוס, עם מיון לפי מועד פקיעה.', en: 'A table filtered by room, type and status, sortable by expiry date.' } },
        { name: { he: 'מכתב דרישה', en: 'Demand notice' }, description: { he: 'תצוגה מקדימה של המכתב עם הליקויים שנבחרו, פרטי הקבלן, ושליחה במייל עם אישור.', en: 'A preview of the notice with the selected defects, developer details, and email sending with confirmation.' } },
        { name: { he: 'תיק הדירה', en: 'Home file' }, description: { he: 'מערכות הדירה (מזגנים, דוד, אינטרקום), אחריות, בעלי מקצוע ומסמכים סרוקים.', en: 'The home’s systems (air conditioners, water heater, intercom), warranties, tradespeople and scanned documents.' } },
        { name: { he: 'ייצוא', en: 'Export' }, description: { he: 'PDF מלא של כל הליקויים וההתכתבות, ושיתוף תיק הדירה עם הקונה הבא.', en: 'A full PDF of all defects and correspondence, and sharing the home file with the next buyer.' } },
      ],
      userJourney: {
        he: [
          'זוג מקבל מפתח ופותח דירה באפליקציה עם תוכנית הדירה',
          'בסריקה הראשונה הם מתעדים 23 ליקויים בחצי שעה',
          'האפליקציה משייכת כל ליקוי לתקופת הבדק שלו ומסמנת שניים כדחופים',
          'הם מפיקים מכתב דרישה ושולחים לקבלן במייל',
          'הקבלן מתקן 18; חמישה נשארים "במחלוקת" עם תיעוד מלא',
          'בתום התקופה הדירה עוברת למצב תחזוקה עם כל ההיסטוריה',
        ],
        en: [
          'A couple gets the keys and opens an apartment in the app with its floor plan',
          'In the first scan they document 23 defects in half an hour',
          'The app assigns each defect to its warranty period and flags two as urgent',
          'They generate a demand notice and email it to the developer',
          'The developer fixes 18; five stay “disputed” with full documentation',
          'When the period ends the apartment switches to maintenance mode with its full history',
        ],
      },
      uxDirection: {
        he: 'רציני ומדויק, כמו מסמך משפטי שנעים להשתמש בו: רקע בהיר, טיפוגרפיה ברורה, ומספרים בולטים לימים שנשארו. הצילום צריך להרגיש כמו מצלמה, לא כמו טופס. תוכנית הדירה היא הניווט הראשי. אדום שמור לפקיעת זכות בלבד.',
        en: 'Serious and precise, like a legal document that is pleasant to use: light background, clear typography, prominent numbers for days remaining. Capturing should feel like a camera, not a form. The floor plan is the primary navigation. Red is reserved for an expiring right only.',
      },
      architecture: {
        he: 'Expo + Expo Router, Supabase לנתונים ולאחסון תמונות עם RLS לפי דירה. חותמת הזמן נקבעת בצד השרת בעת ההעלאה ואי אפשר לערוך אותה. מכתבי הדרישה מופקים ל-PDF ב-Edge Function ונשלחים דרך Resend עם רישום אירועי מסירה. Next.js לדף השיתוף, ואחרי ה-MVP גם לגרסת הדפדפן של חברות בדק בית.',
        en: 'Expo + Expo Router, Supabase for data and photo storage with per-apartment RLS. Timestamps are set server-side on upload and cannot be edited. Demand notices are rendered to PDF in an Edge Function and sent through Resend with delivery events logged. Next.js for the share page and, after the MVP, the inspection firms’ browser version.',
      },
      stack: ['Expo', 'Expo Router', 'Supabase', 'Supabase Storage', 'Supabase Edge Functions', 'Resend', 'Next.js'],
      database: {
        he: ['apartments – דירה, פרויקט, קבלן, תאריך מסירה, תוכנית', 'rooms – חדרים לפי תוכנית הדירה', 'defects – ליקוי, חדר, סוג, תקופת בדק, סטטוס, חותמת זמן', 'defect_photos – תמונות עם מיקום על התוכנית', 'warranty_rules – טבלת סוגי ליקויים ותקופות, עם מקור וגרסה', 'notices – מכתבי דרישה, נמענים, אירועי שליחה ומסירה', 'home_items – מערכות, אחריות מוצרים, בעלי מקצוע, מסמכים'],
        en: ['apartments – apartment, project, developer, handover date, floor plan', 'rooms – rooms per floor plan', 'defects – defect, room, type, warranty period, status, timestamp', 'defect_photos – photos with position on the plan', 'warranty_rules – defect types and periods table, with source and version', 'notices – demand notices, recipients, send and delivery events', 'home_items – systems, product warranties, tradespeople, documents'],
      },
      auth: {
        he: 'כניסה עם Apple/Google או אימייל; שני בני הזוג שותפים באותה דירה. חברות בדק מקבלות חשבון צוות עם גישה לדירות של הלקוחות שלהן בלבד. RLS לפי דירה.',
        en: 'Apple/Google or email sign-in; both partners share the same apartment. Inspection firms get a team account scoped to their clients’ apartments only. Per-apartment RLS.',
      },
      monetization: {
        he: ['רכישה חד-פעמית לדירה שפותחת סריקה ללא הגבלה, מכתבים וייצוא', 'גרסה חינמית עד 10 ליקויים, בלי מכתב', 'רישיון לחברות בדק בית לפי מספר דוחות', 'אפשרות עתידית: הפניה לבעלי מקצוע בתשלום'],
        en: ['One-time purchase per apartment unlocking unlimited scanning, notices and export', 'Free tier up to 10 defects, without the notice', 'Licence for home-inspection firms priced per report', 'Possible later: paid referrals to tradespeople'],
      },
      mvpMilestones: {
        he: ['מודל דירה, חדרים וליקויים עם תמונות וחותמת זמן שרתית', 'טבלת תקופות בדק וספירה לאחור', 'מכתב דרישה ל-PDF ושליחה במייל', 'לוח מעקב סטטוסים', 'רכישה חד-פעמית וייצוא'],
        en: ['Apartment, rooms and defects model with photos and server timestamps', 'Warranty-period table and countdown', 'Demand notice to PDF and email sending', 'Status tracking board', 'One-time purchase and export'],
      },
      risks: {
        he: ['טבלת תקופות הבדק חייבת להיות מדויקת ומעודכנת – לעבוד עם עו״ד ולהציג את המקור, בלי להציג את האפליקציה כייעוץ משפטי', 'קונים משתמשים תקופה אחת ועוזבים – מצב התחזוקה הוא מה שמשאיר אותם', 'קבלנים עלולים להתעלם ממיילים – להוסיף דואר רשום דרך ספק'],
        en: ['The warranty table must be accurate and current – work with a lawyer and show the source, without presenting the app as legal advice', 'Buyers use it for one period and leave – maintenance mode is what keeps them', 'Developers may ignore emails – add registered mail through a provider'],
      },
      expansion: {
        he: ['תיק משותף לוועד הבית לליקויים ברכוש המשותף', 'אינטגרציה עם מפקחי בנייה שסוקרים לפני המסירה', 'חבילת מכירה: ייצוא תיק דירה מרשים כחלק ממודעת מכירה'],
        en: ['A shared file for the building committee for common-property defects', 'Integration with construction supervisors who inspect before handover', 'A selling pack: export the home file as part of a sale listing'],
      },
    },
  },
  {
    id: 'sunhours',
    name: { he: 'Sunhours – השקיה לפי המרפסת שלכם', en: 'Sunhours' },
    tagline: {
      he: 'תוכנית השקיה שמחושבת משעות השמש האמיתיות של המרפסת שלכם ומהתחזית של השבוע – לא "כל שלושה ימים" לכולם – כולל דף מסירה לשכן כשאתם נוסעים.',
      en: 'Watering computed from your balcony’s real sun hours and this week’s forecast – not “every three days” for everyone – plus a handoff sheet when you travel.',
    },
    category: 'lifestyle',
    secondaryCategories: ['productivity'],
    difficulty: 'intermediate',
    effort: { weeksMin: 5, weeksMax: 8 },
    budget: 'low',
    businessModel: 'freemium',
    platforms: ['ios', 'android'],
    audience: ['consumers'],
    tags: ['plants', 'balcony', 'watering', 'gardening', 'sun', 'weather', 'heatwave', 'sensors'],
    identity: { hue: 96, glyph: 'Sh', pattern: 'wave' },
    flags: { beginnerFriendly: false, profitPotential: 'low', experimental: true, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'אפליקציות צמחים נוטות להגיד "השקו כל שלושה ימים" – וזה בדיוק מה שהורג עציצים במרפסת ישראלית: מרפסת דרומית בשרב ביולי ומרפסת צפונית בינואר הן שני עולמות. Sunhours מתחילה מהמקום, לא מהצמח: בכיול חד-פעמי מצביעים עם הטלפון על קו האופק מהמרפסת, והאפליקציה בונה מהמצפן, מהג׳ירו וממסלול השמש מפה של שעות שמש ישירה לכל פינה. על זה היא מניחה את הצמחים, גודל העציץ והתחזית של השבוע (כולל עומס חום), ומייצרת תקציב מים יומי שמשתנה לפי מזג האוויר במקום לוח קבוע. כשנוסעים, היא מפיקה דף מסירה לשכן: איזה עציץ, כמה, מתי. החלק הניסיוני: מיפוי השמש בלי חיישן, רק עם הטלפון.',
        en: 'Plant apps tend to say “water every three days” – exactly what kills balcony pots in Israel: a south-facing balcony in a July heatwave and a north-facing one in January are different worlds. Sunhours starts from the place, not the plant: a one-time calibration (point the phone along the horizon) lets the app build a map of direct-sun hours for every corner from the compass, gyroscope and the sun’s path. It then layers your plants, pot sizes and this week’s forecast (including heat stress) into a daily water budget that shifts with the weather. For trips it generates a handoff sheet for the neighbour: which pot, how much, when. The experimental part: mapping the sun with nothing but the phone.',
      },
      problem: {
        he: 'לוחות השקיה קבועים מתעלמים ממה שבאמת קובע: כמה שעות שמש ישירה העציץ מקבל, ומה מזג האוויר עושה השבוע. התוצאה: ריקבון שורשים בחורף, עציצים שרופים אחרי שרב אחד, ושכן שמקבל הוראות מעורפלות ומשקה הכול "קצת".',
        en: 'Fixed watering schedules ignore what actually matters: how many hours of direct sun the pot gets, and what the weather is doing this week. The result: root rot in winter, pots scorched after a single heatwave, and a neighbour with vague instructions who waters everything “a bit”.',
      },
      solution: {
        he: 'מפת שמש למרפסת שנבנית בכיול של דקה עם המצפן והג׳ירו, צמחים שמונחים על המפה עם גודל עציץ וסוג אדמה, ותחזית מקומית שמתורגמת לתקציב מים יומי לכל עציץ. תזכורת אחת ביום עם רשימה מדויקת, ודף מסירה לנסיעות.',
        en: 'A balcony sun map built in a one-minute calibration with the compass and gyroscope, plants placed on the map with pot size and soil type, and a local forecast translated into a daily water budget per pot. One reminder a day with an exact list, and a handoff sheet for trips.',
      },
      usp: {
        he: 'מתחילים מהמרפסת, לא מהצמח: שעות השמש האמיתיות של הפינה שלכם פלוס התחזית של השבוע הופכות ל"היום 300 מ״ל לבזיליקום, אפס לסוקולנטים" – ומשתנות כשמגיע שרב.',
        en: 'Starts from the balcony, not the plant: your corner’s real sun hours plus this week’s forecast become “today 300 ml for the basil, nothing for the succulents” – and change when a heatwave arrives.',
      },
      targetUsers: {
        he: ['דיירי דירות עם מרפסת או אדן חלון שכבר הרגו כמה עציצים', 'חובבי גינון עירוני שמגדלים עשבי תיבול וירקות בעציצים', 'משפחות שנוסעות בקיץ ומשאירות את הצמחים לשכן'],
        en: ['Apartment dwellers with a balcony or window sill who have already killed a few pots', 'Urban gardeners growing herbs and vegetables in containers', 'Families who travel in summer and leave the plants with a neighbour'],
      },
      coreFeatures: {
        he: [
          'כיול שמש של דקה: מצביעים על קו האופק ומקבלים מפת שעות שמש למרפסת',
          'הנחת צמחים על המפה עם גודל עציץ, סוג אדמה וחומר העציץ',
          'תקציב מים יומי לכל עציץ לפי שמש + תחזית + עומס חום',
          'תזכורת אחת ביום עם רשימה מדויקת, ו"דילוג" אם ירד גשם',
          'דף מסירה לנסיעה: מי משקה מה, כמה, מתי, עם תמונות',
          'יומן: מה הושקה, מה נראה רע, עם תמונה להשוואה',
          'מצב "שרב": התראה והתאמה אוטומטית של התקציב',
        ],
        en: [
          'One-minute sun calibration: point at the horizon, get a sun-hours map of the balcony',
          'Place plants on the map with pot size, soil type and pot material',
          'Daily water budget per pot from sun + forecast + heat stress',
          'One reminder a day with an exact list, and “skip” if it rained',
          'Travel handoff sheet: who waters what, how much, when, with photos',
          'Journal: what was watered, what looks off, with comparison photos',
          '“Heatwave” mode: an alert and automatic budget adjustment',
        ],
      },
      screens: [
        { name: { he: 'כיול המרפסת', en: 'Balcony calibration' }, description: { he: 'מצלמה חיה עם קו אופק וירטואלי, הנחיה לסרוק מצד לצד, ומפת שמש שמצטיירת בזמן אמת.', en: 'Live camera with a virtual horizon line, guidance to sweep side to side, and a sun map that draws itself in real time.' } },
        { name: { he: 'המרפסת', en: 'Balcony' }, description: { he: 'מפה עילית של המרפסת עם אזורי שמש בצבעים, והעציצים כעיגולים שאפשר לגרור.', en: 'A top-down map of the balcony with sun zones in colour, and pots as draggable circles.' } },
        { name: { he: 'היום', en: 'Today' }, description: { he: 'רשימת ההשקיה של היום לפי עציץ עם כמות במ״ל, סיבה קצרה ("שרב, +40%") וסימון בוצע.', en: 'Today’s watering list by pot with ml amounts, a short reason (“heatwave, +40%”) and a done checkmark.' } },
        { name: { he: 'עציץ', en: 'Pot' }, description: { he: 'כרטיס צמח: שעות שמש, גודל עציץ, היסטוריית השקיה ותמונות לאורך זמן.', en: 'A plant card: sun hours, pot size, watering history and photos over time.' } },
        { name: { he: 'נסיעה', en: 'Travel' }, description: { he: 'בחירת תאריכים, בחירת מי משקה, והפקת דף מסירה להדפסה או לשיתוף בוואטסאפ.', en: 'Pick dates, pick who waters, and generate a handoff sheet for printing or WhatsApp sharing.' } },
        { name: { he: 'הגדרות', en: 'Settings' }, description: { he: 'מיקום, יחידות, שעת התזכורת, ובחירה בין מצב מדויק למצב פשוט בלי כיול.', en: 'Location, units, reminder time, and a choice between precise mode and a simple mode without calibration.' } },
      ],
      userJourney: {
        he: [
          'משתמשת פותחת את האפליקציה במרפסת ומכיילת את קו האופק בדקה',
          'מניחה על המפה שישה עציצים: בזיליקום, נענע, שני סוקולנטים, לימון ופלפל',
          'מקבלת תזכורת ב-7:00 עם כמות שונה לכל עציץ',
          'ביום רביעי מגיע שרב והתקציב קופץ אוטומטית, עם הסבר',
          'לפני טיסה באוגוסט היא מפיקה דף מסירה ושולחת לשכן בוואטסאפ',
        ],
        en: [
          'A user opens the app on the balcony and calibrates the horizon in a minute',
          'Places six pots on the map: basil, mint, two succulents, a lemon tree and a pepper',
          'Gets a 7:00 reminder with a different amount per pot',
          'On Wednesday a heatwave hits and the budget jumps automatically, with an explanation',
          'Before an August flight she generates a handoff sheet and sends it to the neighbour on WhatsApp',
        ],
      },
      uxDirection: {
        he: 'ירוק חם ושמשי בלי להיות ילדותי: מפת המרפסת היא הגיבורה, עם צבעי שמש מצהוב ועד צל. מספרים גדולים למ״ל, ותמיד סיבה קצרה ליד כל כמות כדי לבנות אמון. הכיול צריך להרגיש כמו משחק קצר של 60 שניות. RTL מלא, יחידות מטריות.',
        en: 'Warm green and sunny without being childish: the balcony map is the hero, with sun colours from yellow to shade. Big numbers for millilitres, and always a short reason next to every amount to build trust. Calibration should feel like a 60-second mini-game. Full RTL, metric units.',
      },
      architecture: {
        he: 'Expo עם expo-sensors (מצפן, ג׳ירו) ו-expo-camera לכיול; חישוב מסלול השמש רץ מקומית עם SunCalc. Supabase לפרופיל, למרפסות ולצמחים, ו-Edge Function יומית שמושכת תחזית ממקור מזג אוויר ומחשבת תקציב מים לכל עציץ. תזכורות דרך Expo Notifications. המצב הפשוט בלי כיול עובד גם בלי חיישנים בכלל.',
        en: 'Expo with expo-sensors (compass, gyroscope) and expo-camera for calibration; sun-path maths runs locally with SunCalc. Supabase for profile, balconies and plants, plus a daily Edge Function that pulls the forecast from a weather source and computes a water budget per pot. Reminders through Expo Notifications. The simple mode without calibration works with no sensors at all.',
      },
      stack: ['Expo', 'expo-sensors', 'expo-camera', 'SunCalc', 'Supabase', 'Supabase Edge Functions', 'Expo Notifications'],
      database: {
        he: ['balconies – מרפסת, מיקום, כיוון, מפת שעות שמש', 'plants – צמח, סוג, גודל עציץ, אדמה, מיקום על המפה', 'plant_types – צורכי מים בסיסיים לפי סוג צמח', 'forecasts – תחזית יומית לפי מיקום, כולל מדד עומס חום', 'water_plans – תקציב מים יומי לכל עציץ עם הסבר', 'waterings – מה הושקה בפועל, מתי, כמה', 'handoffs – דפי מסירה לנסיעות עם טווח תאריכים'],
        en: ['balconies – balcony, location, orientation, sun-hours map', 'plants – plant, type, pot size, soil, position on the map', 'plant_types – baseline water needs per plant type', 'forecasts – daily forecast by location, including heat-stress index', 'water_plans – daily water budget per pot with explanation', 'waterings – what was actually watered, when, how much', 'handoffs – travel handoff sheets with date ranges'],
      },
      auth: {
        he: 'כניסה אנונימית בהתחלה כדי לא לחסום את הכיול, עם שדרוג לחשבון Apple/Google לסנכרון בין מכשירים. דף המסירה נפתח בקישור ציבורי עם תפוגה.',
        en: 'Anonymous sign-in first so calibration is never blocked, upgradable to an Apple/Google account for syncing across devices. The handoff sheet opens via a public link with expiry.',
      },
      monetization: {
        he: ['חינם עד שלושה עציצים ומצב פשוט', 'מנוי שנתי זול לעציצים ללא הגבלה, מצב שרב ודפי מסירה', 'אפשרות: שיתופי פעולה עם משתלות ויצרני מחשבי השקיה'],
        en: ['Free up to three pots and simple mode', 'Inexpensive annual subscription for unlimited pots, heatwave mode and handoff sheets', 'Possible: partnerships with nurseries and irrigation-controller makers'],
      },
      mvpMilestones: {
        he: ['מצב פשוט: צמחים, גודל עציץ, תחזית ותקציב מים יומי', 'תזכורת יומית ויומן השקיה', 'כיול שמש ניסיוני עם מצפן וג׳ירו', 'מפת מרפסת עם גרירת עציצים', 'דף מסירה לנסיעה', 'מסך מנוי'],
        en: ['Simple mode: plants, pot size, forecast and daily water budget', 'Daily reminder and watering journal', 'Experimental sun calibration with compass and gyroscope', 'Balcony map with draggable pots', 'Travel handoff sheet', 'Subscription screen'],
      },
      risks: {
        he: ['כיול שמש עם מצפן של טלפון עלול להיות לא מדויק – להציג את התוצאה כהערכה ולאפשר תיקון ידני', 'נוסחת תקציב המים חייבת להיות שמרנית – עדיף קצת פחות מדי מאשר ריקבון שורשים', 'שימוש עונתי: פעילות גבוהה בקיץ ונמוכה בחורף'],
        en: ['Sun calibration with a phone compass can be inaccurate – present the result as an estimate and allow manual correction', 'The water-budget formula must be conservative – slightly under-watering beats root rot', 'Seasonal usage: high in summer, low in winter'],
      },
      expansion: {
        he: ['חיבור למחשב השקיה ביתי כדי לבצע את התקציב אוטומטית', 'זיהוי צמח מתמונה כדי לדלג על ההקלדה', 'מרפסות משותפות: גינת גג של בניין עם כמה משקים'],
        en: ['Connecting to a home irrigation controller to execute the budget automatically', 'Plant identification from a photo to skip typing', 'Shared balconies: a building rooftop garden with several waterers'],
      },
    },
  },
  {
    id: 'machar',
    name: { he: 'מחר – להתארגן בערב', en: 'Machar' },
    tagline: {
      he: 'תזכורת אחת בערב עם מה שצריך למחר – בגד ים לחוג, מטען למחשב, טופס חתום – שנבנית לבד מהיומן שלכם ומכללים שהגדרתם פעם אחת.',
      en: 'One evening nudge with what tomorrow needs – swimsuit, laptop charger, signed form – built from your calendar and rules you set once.',
    },
    category: 'lifestyle',
    secondaryCategories: ['productivity'],
    difficulty: 'beginner',
    effort: { weeksMin: 2, weeksMax: 3 },
    budget: 'free',
    businessModel: 'free',
    platforms: ['ios', 'android'],
    audience: ['consumers', 'parents'],
    tags: ['routine', 'evening', 'checklist', 'calendar', 'reminders', 'packing', 'local-first'],
    identity: { hue: 258, glyph: 'Mc', pattern: 'ring' },
    flags: { beginnerFriendly: true, profitPotential: 'low', experimental: false, trending: false, featuredWeight: 2 },
    spec: {
      overview: {
        he: '"מחר" עושה דבר אחד: בכל ערב, בשעה שבחרתם, היא שולחת תזכורת אחת עם מה שצריך להכין למחר. הטריק הוא שהרשימה לא נכתבת כל יום אלא נגזרת מכללים: "כשיש ביומן אירוע עם המילה שחייה – בגד ים ומגבת", "ביום ראשון – טופס לגננת", "לפני פגישה מחוץ למשרד – מטען ותג כניסה". האפליקציה קוראת את יומן המכשיר (קריאה בלבד), מתאימה כללים לאירועים של מחר, מוסיפה את הקבועים של יום השבוע, ובבוקר מציגה צ׳קליסט קצר ליד הדלת. בלי חשבון, בלי שרת, הכול נשמר במכשיר – פרויקט קטן ושלם שמלמד יומן, התראות ואחסון מקומי.',
        en: 'Machar does one thing: every evening, at the time you choose, it sends one reminder with what needs preparing for tomorrow. The trick: the list is never written by hand, it is derived from rules: “when a calendar event contains the word swimming – swimsuit and towel”, “on Sundays – the kindergarten form”, “before an off-site meeting – charger and access badge”. The app reads the device calendar (read-only), matches rules against tomorrow’s events, adds the fixed items for that weekday, and in the morning shows a short checklist by the door. No account, no server, everything stays on the device – a small, complete project that teaches calendars, notifications and local storage.',
      },
      problem: {
        he: 'הערב הוא הזמן היחיד להתארגן למחר, אבל זה בדיוק הרגע שבו אין כוח לחשוב. רשימות קבועות לא עוזרות כי כל יום שונה, ויומן מראה אירועים – לא מה צריך לקחת אליהם. התוצאה: בוקר של "איפה המגבת" וטופס שנשכח שבוע שלישי ברציפות.',
        en: 'Evening is the only time to get ready for tomorrow, and it is exactly when nobody has the energy to think. Static lists do not help because every day is different, and a calendar shows events – not what you need to bring to them. The result: a “where is the towel” morning and a form forgotten for the third week running.',
      },
      solution: {
        he: 'כללים פשוטים מסוג "אם ביומן יש X – להכין Y" ו"ביום Z – תמיד W", מנוע קטן שמריץ אותם מול אירועי מחר, תזכורת ערב אחת עם הרשימה המאוחדת, וצ׳קליסט בוקר. הכול מקומי במכשיר, ונפתח בשתי לחיצות מההתראה.',
        en: 'Simple rules of the form “if the calendar has X – prepare Y” and “on day Z – always W”, a tiny engine that runs them against tomorrow’s events, one evening reminder with the merged list, and a morning checklist. All local on the device, reachable in two taps from the notification.',
      },
      usp: {
        he: 'לא עוד רשימת מטלות: הרשימה כותבת את עצמה מהיומן ומכללים שמגדירים פעם אחת. ככל שהשבוע משעמם יותר, האפליקציה שקטה יותר – היא מדברת רק כשמחר שונה מהרגיל.',
        en: 'Not another to-do list: the list writes itself from the calendar and rules you define once. The more boring the week, the quieter the app – it only speaks up when tomorrow is different from usual.',
      },
      targetUsers: {
        he: ['הורים שמכינים ילדים לגן ולחוגים', 'עובדים עם ימים לא אחידים: פגישות מחוץ למשרד, ימי עבודה מהבית', 'מפתחים מתחילים שרוצים פרויקט ראשון שלם שאפשר להעלות לחנות'],
        en: ['Parents preparing kids for kindergarten and activities', 'Workers with uneven days: off-site meetings, work-from-home days', 'Beginner developers who want a first complete project they can ship to the store'],
      },
      coreFeatures: {
        he: [
          'כללים מסוג "מילה ביומן → פריטים" ו"יום בשבוע → פריטים"',
          'קריאת יומן המכשיר בלבד, בלי חשבון ובלי שרת',
          'תזכורת ערב אחת בשעה קבועה עם הרשימה של מחר',
          'צ׳קליסט בוקר עם סימון וביטול, שמתאפס כל יום',
          'תצוגה מקדימה של "מה מחר מביא" לשבעת הימים הבאים',
          'ייצוא וייבוא כללים כקובץ לשיתוף בין בני זוג',
        ],
        en: [
          '“Word in calendar → items” and “weekday → items” rules',
          'Reads the device calendar only, no account and no server',
          'One evening reminder at a fixed time with tomorrow’s list',
          'A morning checklist with check/uncheck that resets daily',
          'A preview of “what tomorrow brings” for the next seven days',
          'Export and import rules as a file to share between partners',
        ],
      },
      screens: [
        { name: { he: 'מחר', en: 'Tomorrow' }, description: { he: 'הרשימה של מחר כפריטים גדולים לסימון, עם האירוע שיצר כל פריט בשורה קטנה מתחתיו.', en: 'Tomorrow’s list as large checkable items, with the event that produced each item in a small line beneath it.' } },
        { name: { he: 'כללים', en: 'Rules' }, description: { he: 'רשימת כללים עם מתג הפעלה לכל אחד, מקובצים לפי סוג: מילה ביומן או יום בשבוע.', en: 'A list of rules with an on/off switch for each, grouped by type: calendar word or weekday.' } },
        { name: { he: 'כלל חדש', en: 'New rule' }, description: { he: 'שני שדות בלבד: הטריגר (מילה או יום) והפריטים, עם הצעות ממילים שמופיעות ביומן.', en: 'Just two fields: the trigger (a word or a day) and the items, with suggestions pulled from words that appear in the calendar.' } },
        { name: { he: 'השבוע', en: 'This week' }, description: { he: 'שבעה ימים קדימה עם מספר הפריטים לכל יום, כדי לראות מראש ערב עמוס.', en: 'Seven days ahead with the item count per day, to spot a heavy evening in advance.' } },
        { name: { he: 'הגדרות', en: 'Settings' }, description: { he: 'שעת התזכורת, בחירת היומנים שנקראים, וייצוא/ייבוא כללים.', en: 'Reminder time, which calendars to read, and rule export/import.' } },
      ],
      userJourney: {
        he: [
          'המשתמש מאשר גישה ליומן ובוחר תזכורת ב-20:30',
          'מוסיף כלל: "שחייה" → בגד ים, מגבת, משקפת',
          'מוסיף כלל: יום ראשון → טופס לגננת',
          'במוצאי שבת ב-20:30, כי ביומן של יום ראשון יש "שחייה", מגיעה תזכורת: "מחר: בגד ים, מגבת, משקפת, טופס לגננת"',
          'בבוקר הוא מסמן את ארבעת הפריטים ליד הדלת',
        ],
        en: [
          'The user grants calendar access and picks a 20:30 reminder',
          'Adds a rule: “swimming” → swimsuit, towel, goggles',
          'Adds a rule: Sunday → form for the kindergarten teacher',
          'On Saturday night at 20:30, because Sunday’s calendar has “swimming”, a reminder arrives: “Tomorrow: swimsuit, towel, goggles, kindergarten form”',
          'In the morning he checks off the four items by the door',
        ],
      },
      uxDirection: {
        he: 'מסך אחד, טיפוגרפיה גדולה, מצב כהה כברירת מחדל כי משתמשים בה בערב. בלי אונבורדינג ארוך – הכלל הראשון נוצר מתוך האירוע הקרוב ביומן. אנימציית סימון מספקת ושקטה. עברית RTL, ובאנגלית בדיוק אותו הדבר.',
        en: 'One screen, large typography, dark mode by default because it is used in the evening. No long onboarding – the first rule is created from the nearest calendar event. A satisfying, quiet check-off animation. Hebrew RTL, and exactly the same in English.',
      },
      architecture: {
        he: 'Expo + Expo Router, expo-calendar לקריאת האירועים, expo-notifications לתזכורת ערב מתוזמנת, ואחסון מקומי ב-SQLite או AsyncStorage לכללים ולסימונים. אין שרת ואין חשבון. מנוע הכללים הוא פונקציה טהורה שמקבלת אירועים ומחזירה פריטים – קל לבדיקת יחידה.',
        en: 'Expo + Expo Router, expo-calendar to read events, expo-notifications for the scheduled evening reminder, and local storage in SQLite or AsyncStorage for rules and checkmarks. No server, no account. The rules engine is a pure function that takes events and returns items – easy to unit test.',
      },
      stack: ['Expo', 'Expo Router', 'expo-calendar', 'expo-notifications', 'expo-sqlite'],
      database: {
        he: ['rules – טריגר (מילה/יום), פריטים, פעיל', 'items – פריטי הרשימה של מחר עם מקור וסימון', 'settings – שעת תזכורת ויומנים שנבחרו'],
        en: ['rules – trigger (word/day), items, enabled', 'items – tomorrow’s list items with source and checked state', 'settings – reminder time and selected calendars'],
      },
      auth: {
        he: 'אין חשבון בכלל. ההרשאות היחידות הן קריאה מהיומן ושליחת התראות, והכול נשאר על המכשיר.',
        en: 'No account at all. The only permissions are calendar read and notifications, and everything stays on the device.',
      },
      monetization: {
        he: ['חינם לחלוטין – פרויקט פורטפוליו', 'אפשרות: "טיפ" חד-פעמי או ערכת אייקונים בתשלום'],
        en: ['Completely free – a portfolio project', 'Possible: a one-time “tip” or a paid icon pack'],
      },
      mvpMilestones: {
        he: ['קריאת יומן ותצוגת אירועי מחר', 'מנוע כללים ומסך כללים', 'תזכורת ערב מתוזמנת', 'צ׳קליסט בוקר עם איפוס יומי'],
        en: ['Calendar read and tomorrow’s events view', 'Rules engine and rules screen', 'Scheduled evening reminder', 'Morning checklist with daily reset'],
      },
      risks: {
        he: ['הרשאת יומן שנדחית משאירה את האפליקציה ריקה – צריך מצב "רק ימים בשבוע" שעובד בלעדיה', 'התאמת מילים פשוטה תפספס ניסוחים – להציע מילים מהיומן בזמן יצירת כלל', 'קל לסיים, קשה לבלוט – העיצוב והשקט הם המוצר'],
        en: ['A denied calendar permission leaves the app empty – a “weekdays only” mode must work without it', 'Simple word matching will miss phrasings – suggest words from the calendar when creating a rule', 'Easy to finish, hard to stand out – the design and the quietness are the product'],
      },
      expansion: {
        he: ['ווידג׳ט למסך הבית עם הרשימה של מחר', 'כללים משותפים בין בני זוג דרך iCloud/Drive', 'כלל לפי מזג אוויר: גשם מחר → מטרייה'],
        en: ['A home-screen widget with tomorrow’s list', 'Shared rules between partners via iCloud/Drive', 'A weather rule: rain tomorrow → umbrella'],
      },
    },
  },
];
