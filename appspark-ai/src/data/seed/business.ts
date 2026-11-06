import type { Idea } from '../types';

/**
 * Business & Startups – products for business owners, founders, freelancers
 * and teams. Each idea has a concrete wedge and a clear monetization path.
 */
export const ideas: Idea[] = [
  {
    id: 'sagur',
    name: { he: 'Sagur – הצעת מחיר שסוגרת עבודה', en: 'Sagur' },
    tagline: {
      he: 'הצעות מחיר שסוגרות: הלקוח מאשר, חותם ומשלם מקדמה בעמוד אחד שנפתח מוואטסאפ, והעבודה נכנסת ישר ליומן שלך.',
      en: 'Quotes that close: the customer approves, signs and pays a deposit on one WhatsApp-friendly page, and the job lands straight in your calendar.',
    },
    category: 'business',
    secondaryCategories: ['finance', 'productivity'],
    difficulty: 'advanced',
    effort: { weeksMin: 8, weeksMax: 12 },
    budget: 'medium',
    businessModel: 'freemium',
    platforms: ['ios', 'android'],
    audience: ['businesses', 'professionals'],
    tags: ['quotes', 'deposits', 'whatsapp', 'invoicing', 'scheduling', 'tradespeople', 'israel', 'small business'],
    identity: { hue: 20, glyph: 'Sg', pattern: 'diagonal' },
    flags: { beginnerFriendly: false, profitPotential: 'high', experimental: false, trending: false, featuredWeight: 5 },
    spec: {
      overview: {
        he: 'Sagur נבנתה לבעלי מקצוע ונותני שירות בישראל – חשמלאים, מעצבות פנים, צלמים, מאמני כושר – שמאבדים עבודות לא בגלל המחיר אלא בגלל ההמשך: הצעת המחיר נשלחת כתמונה בוואטסאפ, הלקוח כותב "מעולה, נדבר", ואז שתיקה. באפליקציה בונים הצעה בדקה מתוך פריטים שמורים ושולחים קישור בוואטסאפ. הלקוח רואה עמוד נקי עם הפירוט, מע״מ (או הערת עוסק פטור), תוקף ההצעה ותנאי הביטול, מאשר בחתימה אחת ומשלם מקדמה דרך קישור תשלום. ברגע האישור העבודה נכנסת ליומן של בעל המקצוע, והלקוח מקבל תזכורת יום לפני. הפרט החשוב: Sagur לא מייצרת מסמכי מס בעצמה אלא מפיקה חשבונית עסקה או קבלה דרך ספק חשבוניות מוסמך שהעסק כבר עובד איתו – כך אף לקוח לא נתקע עם מסמך לא תקין.',
        en: 'Sagur is built for Israeli tradespeople and service providers – electricians, designers, photographers, trainers – who lose jobs not on price but on follow-through: the quote goes out as a photo on WhatsApp, the customer replies "great, let’s talk" and then goes quiet. In the app you build a quote in a minute from saved items and send a WhatsApp link. The customer sees a clean page with the breakdown, VAT (or an exempt-dealer note), the quote’s expiry and the cancellation terms, approves with one signature and pays a deposit through a payment link. On approval the job lands in the provider’s calendar and the customer gets a reminder the day before. The important detail: Sagur never generates tax documents itself – it issues the invoice or receipt through a certified invoicing provider the business already uses, so nobody is left holding a non-compliant document.',
      },
      problem: {
        he: 'בעלי מקצוע קטנים מנהלים הצעות מחיר בצילומי מסך ובהודעות קוליות. אין תוקף להצעה, אין מקדמה שמחייבת את הלקוח, ואין קשר בין ה"סגרנו" לבין היומן. התוצאה: ביטולים ברגע האחרון, ימים ריקים, והרבה שעות שהולכות על לרדוף אחרי לקוחות במקום לעבוד.',
        en: 'Small service businesses run quotes through screenshots and voice notes. Quotes have no expiry, there is no deposit to commit the customer, and "we’re on" never makes it into the calendar. The result is last-minute cancellations, empty days, and hours spent chasing customers instead of working.',
      },
      solution: {
        he: 'הצעת מחיר כעמוד אינטרנט אחד שנשלח כקישור מוואטסאפ: פירוט, תוקף, חתימה, מקדמה ושיבוץ ביומן בזרימה אחת. מסמכי המס מופקים דרך ספק חשבוניות מוסמך בחיבור API, והאפליקציה מתמקדת במה שאף אחד לא פותר – הסגירה עצמה.',
        en: 'A quote as a single web page sent as a WhatsApp link: breakdown, expiry, signature, deposit and calendar booking in one flow. Tax documents are issued through a certified invoicing provider over an API, so the app focuses on the part nobody solves – the close itself.',
      },
      usp: {
        he: 'הסגירה כולה – אישור, חתימה, מקדמה ושיבוץ – קורית בעמוד אחד שהלקוח פותח מוואטסאפ בלי להתקין כלום, עם טיפול נכון במע״מ ובעוסק פטור, ובלי להמציא חשבוניות מחדש.',
        en: 'The whole close – approval, signature, deposit and booking – happens on one page the customer opens from WhatsApp without installing anything, with VAT and exempt-dealer status handled correctly and no reinvented invoicing.',
      },
      targetUsers: {
        he: ['בעלי מקצוע עצמאיים: חשמלאים, אינסטלטורים, שיפוצניקים', 'נותני שירות לאירועים: צלמים, די-ג׳ייז, מעצבות', 'מטפלים ומאמנים שמוכרים סדרות של מפגשים'],
        en: ['Independent tradespeople: electricians, plumbers, renovators', 'Event service providers: photographers, DJs, designers', 'Therapists and coaches who sell session packages'],
      },
      coreFeatures: {
        he: [
          'בניית הצעה בדקה מפריטים שמורים, עם מע״מ או הערת עוסק פטור',
          'קישור הצעה שנפתח מוואטסאפ עם מעקב "נצפה / אושר"',
          'חתימה דיגיטלית ותנאי ביטול שהלקוח מאשר במפורש',
          'מקדמה דרך קישור תשלום של ספק סליקה ישראלי',
          'שיבוץ אוטומטי ביומן ותזכורת ללקוח יום לפני',
          'הפקת חשבונית עסקה או קבלה דרך ספק חשבוניות מוסמך',
          'תוקף להצעה ותזכורת עדינה ללקוח לפני שהיא פגה',
        ],
        en: [
          'Build a quote in a minute from saved line items, with VAT or an exempt-dealer note',
          'A quote link that opens from WhatsApp with "viewed / approved" tracking',
          'Digital signature and cancellation terms the customer explicitly accepts',
          'Deposit through a payment link from an Israeli payment provider',
          'Automatic calendar booking and a customer reminder the day before',
          'Transaction invoice or receipt issued through a certified invoicing provider',
          'Quote expiry with a gentle customer nudge before it lapses',
        ],
      },
      screens: [
        { name: { he: 'היום', en: 'Today' }, description: { he: 'העבודות של היום והשבוע, הצעות שממתינות לאישור ומקדמות שהתקבלו – במבט אחד.', en: 'Today’s and this week’s jobs, quotes awaiting approval and deposits received – at a glance.' } },
        { name: { he: 'הצעה חדשה', en: 'New quote' }, description: { he: 'בחירת פריטים שמורים, כמות ומחיר, מקדמה באחוזים או בסכום, ותוקף; סיכום המע״מ מתעדכן תוך כדי.', en: 'Pick saved line items, quantity and price, a deposit as a percentage or an amount, and expiry; the VAT summary updates as you go.' } },
        { name: { he: 'עמוד הלקוח', en: 'Customer page' }, description: { he: 'עמוד אינטרנט נקי לנייד עם הפירוט, תנאי הביטול, כפתור חתימה וכפתור תשלום מקדמה – בלי התקנה ובלי הרשמה.', en: 'A clean mobile web page with the breakdown, cancellation terms, a signature button and a deposit button – no install and no sign-up.' } },
        { name: { he: 'מעקב הצעות', en: 'Quote tracker' }, description: { he: 'רשימת ההצעות לפי סטטוס: נשלחה, נצפתה, אושרה, פגה; לחיצה ארוכה שולחת תזכורת בוואטסאפ.', en: 'Quotes by status: sent, viewed, approved, expired; a long press sends a WhatsApp nudge.' } },
        { name: { he: 'יומן', en: 'Calendar' }, description: { he: 'תצוגת שבוע עם עבודות שאושרו, זמני נסיעה בין כתובות וחסימת שעות ידנית.', en: 'A week view of approved jobs, travel time between addresses and manual hour blocking.' } },
        { name: { he: 'פריטים ומחירון', en: 'Items & price list' }, description: { he: 'ספריית הפריטים והחבילות של העסק עם מחיר ברירת מחדל והתיאור שהלקוח יראה.', en: 'The business’s library of items and packages with a default price and the description the customer will see.' } },
        { name: { he: 'הגדרות העסק', en: 'Business settings' }, description: { he: 'סוג העוסק (פטור / מורשה), חיבור לספק חשבוניות ולספק סליקה, לוגו ותנאי ביטול ברירת מחדל.', en: 'Dealer type (exempt / licensed), connections to the invoicing and payment providers, logo and default cancellation terms.' } },
      ],
      userJourney: {
        he: [
          'חשמלאי מסיים ביקור אצל לקוחה ובונה הצעה לשלושה פריטים בדקה מהרכב',
          'שולח קישור בוואטסאפ; האפליקציה מראה שהלקוחה פתחה אותו בערב',
          'הלקוחה מאשרת, חותמת ומשלמת מקדמה של 20% דרך קישור התשלום',
          'העבודה נכנסת ליומן ליום שלישי, והלקוחה מקבלת תזכורת ביום שני בערב',
          'בסיום העבודה החשמלאי לוחץ "סיום", וקבלה על המקדמה והיתרה מופקת דרך ספק החשבוניות',
        ],
        en: [
          'An electrician finishes a site visit and builds a three-item quote from the car in a minute',
          'He sends the link over WhatsApp; the app shows the customer opened it in the evening',
          'The customer approves, signs and pays a 20% deposit through the payment link',
          'The job lands in the calendar for Tuesday and the customer gets a reminder on Monday evening',
          'When the job is done he taps "complete", and a receipt for the deposit and balance is issued through the invoicing provider',
        ],
      },
      uxDirection: {
        he: 'שני קהלים, שני סגנונות: לבעל המקצוע – אפליקציה מהירה עם כפתורים גדולים שאפשר להפעיל ביד אחת מהרכב; ללקוח – עמוד אינטרנט שקט ואמין שנראה כמו מסמך רשמי, עם חתימה ותשלום בתחתית. עברית ו-RTL כברירת מחדל, ובלי ז׳רגון חשבונאי – "מקדמה" ולא "תשלום ראשון על חשבון".',
        en: 'Two audiences, two styles: for the provider, a fast app with large one-handed controls usable from the car; for the customer, a calm, trustworthy web page that reads like an official document, with signature and payment at the bottom. Hebrew and RTL by default, and no accounting jargon – "deposit", not "first payment on account".',
      },
      architecture: {
        he: 'אפליקציית Expo לבעל המקצוע ועמוד לקוח ב-Next.js שמוגש מקישור קצר. Supabase לאימות, לנתונים ולאחסון חתימות; Edge Functions מקבלות webhooks מספק הסליקה, מסמנות את המקדמה כשולמה ואז קוראות ל-API של ספק החשבוניות להפקת המסמך. היומן מסתנכרן ליומן המכשיר דרך expo-calendar, ותזכורות ללקוח נשלחות כקישור וואטסאפ מוכן או ב-SMS דרך ספק מקומי.',
        en: 'An Expo app for the provider and a Next.js customer page served from a short link. Supabase for auth, data and signature storage; Edge Functions receive webhooks from the payment provider, mark the deposit as paid and then call the invoicing provider’s API to issue the document. The calendar syncs to the device calendar through expo-calendar, and customer reminders go out as a pre-filled WhatsApp link or by SMS through a local provider.',
      },
      stack: ['Expo', 'Expo Router', 'Next.js', 'Supabase', 'Supabase Edge Functions', 'expo-calendar', 'Meshulam or PayPlus payment links', 'Green Invoice or iCount API'],
      database: {
        he: ['businesses – עסק, סוג עוסק, לוגו, תנאי ביטול, חיבורים לספקים', 'customers – לקוח, טלפון, כתובת, היסטוריית הצעות', 'items – פריטים וחבילות עם מחיר ברירת מחדל', 'quotes – הצעה, שורות, מע״מ, מקדמה, תוקף, סטטוס, קישור', 'approvals – חתימה, זמן, כתובת IP, גרסת התנאים שאושרה', 'payments – מקדמה, ספק, מזהה עסקה, סטטוס מה-webhook', 'jobs – עבודה משובצת, מועד, כתובת, מזהה ביומן המכשיר', 'documents – מסמכי מס שהופקו דרך הספק, מזהה חיצוני, PDF'],
        en: ['businesses – business, dealer type, logo, cancellation terms, provider connections', 'customers – customer, phone, address, quote history', 'items – line items and packages with a default price', 'quotes – quote, lines, VAT, deposit, expiry, status, link', 'approvals – signature, timestamp, IP address, accepted terms version', 'payments – deposit, provider, transaction id, webhook status', 'jobs – booked job, time, address, device calendar id', 'documents – tax documents issued via the provider, external id, PDF'],
      },
      auth: {
        he: 'בעל המקצוע נכנס עם טלפון (OTP) או Google. הלקוח לא נרשם בכלל – הקישור להצעה הוא טוקן חד-פעמי עם תוקף, והחתימה נשמרת יחד עם הזמן וגרסת התנאים. RLS לפי עסק על כל הטבלאות.',
        en: 'The provider signs in with a phone OTP or Google. The customer never registers – the quote link is a single-use token with an expiry, and the signature is stored with the timestamp and the accepted terms version. Per-business RLS on every table.',
      },
      monetization: {
        he: ['חינם עד כמה הצעות בחודש, עם מיתוג Sagur בעמוד הלקוח', 'מנוי חודשי לעסק: הצעות ללא הגבלה, מיתוג משלך ותזכורות אוטומטיות', 'תוכנית לצוותים קטנים עם כמה בעלי מקצוע ויומן משותף'],
        en: ['Free for a handful of quotes a month, with Sagur branding on the customer page', 'Monthly business plan: unlimited quotes, your own branding and automatic reminders', 'A small-team plan with several providers and a shared calendar'],
      },
      mvpMilestones: {
        he: ['בניית הצעה ועמוד לקוח עם אישור וחתימה', 'מקדמה דרך ספק סליקה אחד עם webhook', 'שיבוץ ביומן ותזכורת ללקוח', 'הפקת מסמך דרך ספק חשבוניות אחד', 'מעקב סטטוס הצעות ותוקף', 'מסך תשלום ומנוי'],
        en: ['Quote builder and customer page with approval and signature', 'Deposit through one payment provider with a webhook', 'Calendar booking and customer reminder', 'Document issuance through one invoicing provider', 'Quote status tracking and expiry', 'Paywall and subscription'],
      },
      risks: {
        he: ['כללי מסמכי המס בישראל משתנים – חובה להישען על ספק מוסמך ולא להפיק מסמכים בעצמנו', 'ספקי סליקה דורשים אישור עסק וגובים עמלה – לתמחר את המקדמה בהתאם ולהבהיר ללקוח מי המסלק', 'שליחת הודעות ללקוחות ללא הסכמה עלולה להפר את חוק הספאם – תזכורות רק אחרי אישור ההצעה', 'המשקל המשפטי של חתימה דיגיטלית פשוטה תלוי בהקשר – לשמור ראיות (זמן, IP, גרסת תנאים) ולהציג זאת בשקיפות'],
        en: ['Israeli tax-document rules change – rely on a certified provider instead of issuing documents ourselves', 'Payment providers require merchant approval and charge a fee – price the deposit accordingly and tell the customer who the processor is', 'Messaging customers without consent can breach anti-spam law – reminders only after the quote is approved', 'The legal weight of a simple digital signature depends on context – keep evidence (time, IP, terms version) and be transparent about it'],
      },
      expansion: {
        he: ['יתרת התשלום בסיום העבודה מאותו עמוד, כולל חלוקה לתשלומים', 'תבניות הצעה לפי מקצוע שנבנו עם אנשי מקצוע מנוסים', 'ביקורות לקוח קצרות אחרי כל עבודה שמוצגות בהצעות הבאות'],
        en: ['Balance payment on completion from the same page, including instalments', 'Quote templates per trade built with experienced practitioners', 'Short customer reviews after each job shown on future quotes'],
      },
    },
  },
  {
    id: 'groundtruth',
    name: { he: 'Groundtruth – ראיונות לקוחות בלי אשליות', en: 'Groundtruth' },
    tagline: {
      he: 'ראיונות גילוי לקוחות כמו ניסויים: כל ראיון בוחן הנחה, מחמאות נרשמות כרעש, ורק התחייבויות אמיתיות – זמן, כסף, היכרות – נספרות.',
      en: 'Discovery interviews run like experiments: each tests a hypothesis, compliments are logged as noise, and only commitments – time, money, intros – score.',
    },
    category: 'business',
    secondaryCategories: ['productivity'],
    difficulty: 'intermediate',
    effort: { weeksMin: 4, weeksMax: 7 },
    budget: 'free',
    businessModel: 'subscription',
    platforms: ['cross-platform'],
    audience: ['professionals', 'teams'],
    tags: ['startup', 'customer discovery', 'interviews', 'validation', 'hypotheses', 'founders', 'product research', 'lean'],
    identity: { hue: 230, glyph: 'Gt', pattern: 'dots' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: true, trending: true, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Groundtruth היא מחברת מעבדה ליזמים בשלב הגילוי. במקום מסמך גוגל עם סיכומי שיחות שאף אחד לא קורא שוב, כל ראיון נפתח מתוך הנחה מוגדרת ("בעלי חנויות קטנות מפסידים מכירות בגלל ניהול מלאי ידני"), מתנהל עם מדריך שאלות קצר, ונסגר בשלוש שאלות קבועות: מה למדנו שסותר את ההנחה, מה המרואיין עושה היום כדי לפתור את הבעיה, ולאיזו התחייבות הוא הסכים – זמן לשיחה נוספת, היכרות עם מישהו, תשלום מראש, או כלום. פנקס ההתחייבויות הוא הלב: הוא מראה כמה מהראיונות הסתיימו בהתחייבות אמיתית לעומת "נשמע מעניין". לוח ההנחות נצבע לפי ראיות בעד ונגד, והיזם רואה מתי הנחה אושרה, הופרכה או פשוט לא נבדקה מספיק.',
        en: 'Groundtruth is a lab notebook for founders in the discovery phase. Instead of a Google Doc of call summaries nobody rereads, every interview starts from a stated hypothesis ("small shop owners lose sales because of manual stock tracking"), runs with a short question guide, and closes with three fixed questions: what did we learn that contradicts the hypothesis, what does the interviewee do today to solve the problem, and what commitment did they agree to – time for another call, an intro, a prepayment, or nothing. The commitment ledger is the heart: it shows how many interviews ended in a real commitment versus "sounds interesting". The hypothesis board colours itself by evidence for and against, so the founder sees when a hypothesis is confirmed, refuted or simply under-tested.',
      },
      problem: {
        he: 'יזמים מראיינים לקוחות פוטנציאליים ושומעים בעיקר נימוס. "רעיון מעולה" נרשם כאישור, שאלות מובילות מייצרות תשובות מובילות, וכעבור חודש אי אפשר לזכור מי אמר מה ואיזו הנחה בכלל נבדקה. התוצאה: מוצר שנבנה על בסיס מחמאות.',
        en: 'Founders interview prospects and mostly hear politeness. "Great idea" gets logged as validation, leading questions produce leading answers, and a month later nobody remembers who said what or which hypothesis was being tested. The result is a product built on compliments.',
      },
      solution: {
        he: 'מבנה כפוי אבל עדין: ראיון נפתח מהנחה, מדריך השאלות מסמן ניסוחים מובילים תוך כדי כתיבה, והסיום מחייב לבחור מה קרה באמת – סתירה, פתרון קיים, התחייבות. לוח ההנחות ופנקס ההתחייבויות הופכים את הראיונות לנתונים שאפשר להחליט לפיהם.',
        en: 'Gentle but enforced structure: an interview opens from a hypothesis, the question guide flags leading phrasing as you type, and closing requires choosing what really happened – a contradiction, an existing workaround, a commitment. The hypothesis board and the commitment ledger turn interviews into data you can decide on.',
      },
      usp: {
        he: 'לא עוד כלי לרישום הערות: המוצר בנוי סביב ההבחנה בין מחמאה להתחייבות, וכל ראיון חייב להסתיים בפסק דין על ההנחה – כך שהיזם רואה את הפער בין "כולם אהבו" ל"שניים הסכימו לשלם".',
        en: 'Not another note-taking tool: the product is built around the difference between a compliment and a commitment, and every interview must end with a verdict on the hypothesis – so the founder sees the gap between "everyone loved it" and "two agreed to pay".',
      },
      targetUsers: {
        he: ['יזמים בשלב טרום-מוצר שמראיינים לקוחות ראשונים', 'מנהלי מוצר שבודקים פיצ׳ר או שוק חדש', 'תוכניות האצה ומנטורים שמלווים כמה צוותים במקביל'],
        en: ['Pre-product founders interviewing their first customers', 'Product managers validating a new feature or market', 'Accelerators and mentors following several teams at once'],
      },
      coreFeatures: {
        he: [
          'לוח הנחות עם ראיות בעד ונגד וסטטוס: לא נבדקה / מתחזקת / הופרכה',
          'מדריך שאלות לכל הנחה עם סימון אוטומטי של שאלות מובילות',
          'רישום ראיון מהיר בזמן אמת, גם מהנייד, עם תיוג ציטוטים להנחות',
          'סגירת ראיון חובה: סתירה, פתרון קיים, וההתחייבות שהושגה',
          'פנקס התחייבויות: מי הבטיח מה, ומה קרה עם זה בפועל',
          'סיכום שבועי: כמה ראיונות, כמה התחייבויות, איזו הנחה לבדוק הבא',
          'שיתוף לקריאה בלבד עם שותף, משקיע או מנטור',
        ],
        en: [
          'A hypothesis board with evidence for and against and a status: untested / strengthening / refuted',
          'A question guide per hypothesis that automatically flags leading questions',
          'Fast real-time interview capture, also on mobile, with quotes tagged to hypotheses',
          'Mandatory interview close: contradiction, existing workaround, and the commitment obtained',
          'A commitment ledger: who promised what, and what actually happened next',
          'A weekly summary: interviews run, commitments won, which hypothesis to test next',
          'Read-only sharing with a co-founder, investor or mentor',
        ],
      },
      screens: [
        { name: { he: 'לוח הנחות', en: 'Hypothesis board' }, description: { he: 'כרטיסי הנחות בצבע לפי מצב הראיות, מונה ראיונות לכל אחת, וכפתור "ראיון חדש" ישירות מהכרטיס.', en: 'Hypothesis cards coloured by evidence state, an interview counter on each, and a "new interview" button straight from the card.' } },
        { name: { he: 'הכנה לראיון', en: 'Interview prep' }, description: { he: 'בחירת ההנחה, מדריך שאלות שניתן לערוך, ואזהרה אדומה ליד כל שאלה שמנוסחת בצורה מובילה.', en: 'Pick the hypothesis, an editable question guide, and a red warning beside any question phrased in a leading way.' } },
        { name: { he: 'ראיון חי', en: 'Live interview' }, description: { he: 'שדה הערות מהיר, כפתורי תיוג "ציטוט / כאב / פתרון קיים / מחמאה", וטיימר שקט בפינה.', en: 'A fast notes field, tagging buttons for "quote / pain / existing workaround / compliment", and a quiet timer in the corner.' } },
        { name: { he: 'סגירת ראיון', en: 'Interview close' }, description: { he: 'שלוש שאלות חובה עם בחירה מוגדרת, ובחירת סוג ההתחייבות: זמן, היכרות, כסף, או כלום.', en: 'Three mandatory questions with fixed choices, and the commitment type: time, intro, money, or none.' } },
        { name: { he: 'פנקס התחייבויות', en: 'Commitment ledger' }, description: { he: 'טבלה של כל ההתחייבויות עם תאריך יעד וסטטוס מימוש, וסינון לפי "הבטיחו ולא קרה".', en: 'A table of every commitment with due date and fulfilment status, filterable by "promised but never happened".' } },
        { name: { he: 'סיכום שבועי', en: 'Weekly review' }, description: { he: 'מספרים פשוטים לשבוע, ההנחה החלשה ביותר, והצעה למי לראיין בשבוע הבא.', en: 'Simple numbers for the week, the weakest hypothesis, and a suggestion for whom to interview next week.' } },
      ],
      userJourney: {
        he: [
          'היזמת פותחת פרויקט ומנסחת שלוש הנחות על בעלי חנויות קטנות',
          'מכינה מדריך שאלות; האפליקציה מסמנת ש"היית משלם על זה?" היא שאלה מובילה ומציעה נוסח אחר',
          'מראיינת חמישה בעלי חנויות במהלך שבוע ומתייגת ציטוטים תוך כדי',
          'שלושה ראיונות נסגרים כ"מחמאה בלבד", שניים עם התחייבות להיכרות עם ספק',
          'לוח ההנחות מראה שההנחה על המלאי מתחזקת ואילו ההנחה על התמחור הופרכה',
          'הסיכום השבועי נשלח כקישור למנטור בתוכנית ההאצה',
        ],
        en: [
          'The founder opens a project and writes three hypotheses about small shop owners',
          'She prepares a question guide; the app flags "would you pay for this?" as leading and suggests another phrasing',
          'She interviews five shop owners over a week, tagging quotes as she goes',
          'Three interviews close as "compliment only", two with a commitment to an intro to a supplier',
          'The hypothesis board shows the stock hypothesis strengthening while the pricing hypothesis is refuted',
          'The weekly summary goes to her accelerator mentor as a link',
        ],
      },
      uxDirection: {
        he: 'מחברת מעבדה, לא דשבורד: רקע בהיר, גופן מונוספייס עדין למספרים, וצבע ששמור לשלושה מצבים בלבד – מתחזקת, הופרכה, לא נבדקה. במסך הראיון החי הכול בהישג אגודל, כדי לא לבהות בטלפון בזמן שהמרואיין מדבר. בלי קונפטי על "אושרה" – הפרכה זוכה לאותה חגיגיות כמו אישור.',
        en: 'A lab notebook, not a dashboard: light background, a subtle monospace face for numbers, and colour reserved for three states only – strengthening, refuted, untested. On the live interview screen everything sits within thumb reach so you are not staring at the phone while the interviewee talks. No confetti for "confirmed" – a refutation gets the same ceremony as a confirmation.',
      },
      architecture: {
        he: 'Expo עם Expo Router, שרץ גם כאתר כדי שאפשר יהיה לכתוב ראיונות מהמחשב. Supabase לאימות, לנתונים ולשיתוף לקריאה בלבד דרך מדיניות RLS לפי פרויקט. זיהוי שאלות מובילות הוא רשימת תבניות דטרמיניסטית בצד הלקוח (למשל "היית…", "נכון ש…") ולא מודל שפה – זול, מיידי וקל להסביר. הסיכום השבועי מחושב בשאילתת SQL אחת ונשלח כהתראה.',
        en: 'Expo with Expo Router, also running on the web so interviews can be written up from a laptop. Supabase for auth, data and read-only sharing through per-project RLS policies. Leading-question detection is a deterministic client-side pattern list (e.g. "would you…", "isn’t it true that…") rather than a language model – cheap, instant and easy to explain. The weekly summary is one SQL query delivered as a notification.',
      },
      stack: ['Expo', 'Expo Router', 'React Native Web', 'Supabase', 'expo-notifications', 'Zustand'],
      database: {
        he: ['projects – פרויקט, בעלים, חברים, קישור שיתוף', 'hypotheses – הנחה, סטטוס, ספירת ראיות בעד ונגד', 'question_guides – שאלות לכל הנחה וסימון שאלות מובילות', 'interviews – ראיון, מרואיין, הנחה, תאריך, הערות', 'quotes – ציטוט מתויג: כאב / פתרון קיים / מחמאה, מקושר להנחה', 'commitments – סוג, תאריך יעד, סטטוס מימוש, ראיון מקור'],
        en: ['projects – project, owner, members, share link', 'hypotheses – hypothesis, status, evidence counts for and against', 'question_guides – questions per hypothesis with leading flags', 'interviews – interview, interviewee, hypothesis, date, notes', 'quotes – tagged quote: pain / workaround / compliment, linked to a hypothesis', 'commitments – type, due date, fulfilment status, source interview'],
      },
      auth: {
        he: 'כניסה עם Google או אימייל בקישור קסם. שיתוף לקריאה בלבד דרך קישור עם טוקן שמעניק גישה לפרויקט אחד; שמות המרואיינים נשמרים מוצפנים, כי מדובר במידע אישי של צדדים שלישיים.',
        en: 'Google or email magic-link sign-in. Read-only sharing via a tokenised link scoped to a single project; interviewee names are stored encrypted, since they are third-party personal data.',
      },
      monetization: {
        he: ['חינם לפרויקט אחד ולמספר מוגבל של ראיונות', 'מנוי חודשי ליזם: פרויקטים ללא הגבלה, שיתוף וסיכומים', 'רישיון לתוכניות האצה ולסדנאות עם תצוגת מנטור על כמה צוותים'],
        en: ['Free for one project and a limited number of interviews', 'Monthly founder plan: unlimited projects, sharing and summaries', 'A licence for accelerators and workshops with a mentor view across teams'],
      },
      mvpMilestones: {
        he: ['לוח הנחות וראיון עם סגירה חובה', 'תיוג ציטוטים ופנקס התחייבויות', 'מדריך שאלות עם זיהוי ניסוח מוביל', 'סיכום שבועי והתראה', 'שיתוף לקריאה בלבד', 'מסך תשלום'],
        en: ['Hypothesis board and interview with mandatory close', 'Quote tagging and the commitment ledger', 'Question guide with leading-phrase detection', 'Weekly summary and notification', 'Read-only sharing', 'Paywall'],
      },
      risks: {
        he: ['המבנה הכפוי עלול להרגיש מעיק – להשאיר דרך מהירה לרשום ראיון "מלוכלך" ולהשלים אותו אחר כך', 'יזמים בודדים לא ישלמו הרבה – המודל העסקי נשען על תוכניות האצה ועל צוותי מוצר', 'זיהוי שאלות מובילות לפי תבניות יפספס ניסוחים ויתריע לשווא – לאפשר לבטל אזהרה בלחיצה'],
        en: ['Enforced structure can feel heavy – keep a fast way to log a "messy" interview and complete it later', 'Solo founders will not pay much – the business model leans on accelerators and product teams', 'Pattern-based leading-question detection will miss phrasings and raise false alarms – let the user dismiss a warning with one tap'],
      },
      expansion: {
        he: ['הקלטה ותמלול של הראיון עם הצעת ציטוטים לתיוג', 'תבניות הנחות לפי סוג מיזם, שנבנו עם מנטורים', 'ייצוא "דוח גילוי" לחומרי גיוס או לסדנאות'],
        en: ['Interview recording and transcription with suggested quotes to tag', 'Hypothesis templates per venture type, built with mentors', 'Export a "discovery report" for fundraising decks or workshops'],
      },
    },
  },
  {
    id: 'lossbook',
    name: { he: 'Lossbook – למה הפסדנו את העסקה', en: 'Lossbook' },
    tagline: {
      he: 'כל עסקה שאבדה מקבלת תחקיר מובנה של דקה, ואחרי חודש רואים מה באמת מפיל עסקאות: מחיר, מתחרה, תזמון, או שפשוט אף אחד לא החליט.',
      en: 'Every lost deal gets a one-minute structured debrief, so after a month you see what really kills deals: price, a rival, timing, or no decision.',
    },
    category: 'business',
    secondaryCategories: ['productivity'],
    difficulty: 'intermediate',
    effort: { weeksMin: 4, weeksMax: 6 },
    budget: 'low',
    businessModel: 'b2b',
    platforms: ['web'],
    audience: ['businesses', 'teams'],
    tags: ['sales', 'crm', 'lost deals', 'win loss', 'pipeline', 'analytics', 'b2b', 'hubspot'],
    identity: { hue: 310, glyph: 'Lb', pattern: 'grid' },
    flags: { beginnerFriendly: false, profitPotential: 'high', experimental: false, trending: false, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Lossbook היא מיקרו-מוצר שעושה דבר אחד שכל CRM מאפשר ואף צוות מכירות לא עושה באמת: לתעד למה עסקאות אובדות. כשעסקה מסומנת "הפסד" ב-HubSpot או ב-Pipedrive, איש המכירות מקבל קישור לתחקיר של דקה – לא שדה טקסט חופשי אלא עץ בחירה קצר: סיבה ראשית (מחיר, מתחרה, תזמון, אין החלטה, לא מתאים), למי הפסדנו, מה היה הרגע שבו העסקה התקררה, ומה היינו עושים אחרת. עד שהתחקיר לא הושלם העסקה מופיעה כ"פתוחה" בדוח השבועי של המנהל. אחרי כמה שבועות הדוחות מתחילים לדבר: אילו סיבות חוזרות לפי סגמנט, לפי מקור ליד ולפי איש מכירות, ואילו עסקאות "ללא החלטה" ראויות לניסיון נוסף בעוד רבעון. המוצר לא מנסה להחליף את ה-CRM – הוא נתלה עליו ומוסיף את השכבה שחסרה.',
        en: 'Lossbook is a micro-product that does the one thing every CRM allows and no sales team actually does: record why deals are lost. When a deal is marked lost in HubSpot or Pipedrive, the rep gets a link to a one-minute debrief – not a free-text box but a short decision tree: primary reason (price, competitor, timing, no decision, bad fit), who we lost to, the moment the deal went cold, and what we would do differently. Until the debrief is done the deal shows as "open" in the manager’s weekly report. After a few weeks the reports start talking: which reasons recur by segment, by lead source and by rep, and which "no decision" deals deserve another attempt next quarter. The product does not try to replace the CRM – it hangs off it and adds the missing layer.',
      },
      problem: {
        he: 'בכל CRM יש שדה "סיבת הפסד", ובפועל הוא ריק או מלא ב"אחר". אנשי מכירות לא כותבים תחקיר כשהם מתוסכלים, מנהלים מנחשים למה הרבעון היה חלש, ואותה טעות – תמחור, דמו מאוחר מדי, אין אלוף פנימי אצל הלקוח – חוזרת על עצמה.',
        en: 'Every CRM has a "lost reason" field, and in practice it is empty or set to "other". Reps do not write post-mortems when they are frustrated, managers guess why the quarter was weak, and the same mistake – pricing, a demo that came too late, no internal champion – repeats itself.',
      },
      solution: {
        he: 'תחקיר מובנה של דקה שמופעל אוטומטית מה-CRM ברגע ההפסד, עם עץ סיבות קבוע שאפשר באמת לנתח, ודוח מנהל שמסמן תחקירים חסרים. הנתונים נכתבים חזרה ל-CRM כדי שלא ייווצר מאגר נוסף.',
        en: 'A one-minute structured debrief triggered automatically from the CRM the moment a deal is lost, with a fixed reason tree that can actually be analysed, and a manager report that flags missing debriefs. The data is written back to the CRM so no second silo is created.',
      },
      usp: {
        he: 'במקום עוד דשבורד, המוצר תוקף את הסיבה שהנתונים לא קיימים: טריגר אוטומטי, שאלון שלוקח דקה, ולחץ חברתי עדין דרך דוח המנהל. עץ סיבות קבוע הופך את "אחר" לתובנה שאפשר לפעול לפיה.',
        en: 'Instead of another dashboard, the product attacks the reason the data does not exist: an automatic trigger, a questionnaire that takes a minute, and gentle social pressure through the manager report. A fixed reason tree turns "other" into something you can act on.',
      },
      targetUsers: {
        he: ['צוותי מכירות B2B של 3–15 אנשים שעובדים על HubSpot או Pipedrive', 'מייסדים שמוכרים בעצמם ורוצים להבין למה עסקאות נופלות', 'סמנכ״לי מכירות בסטארטאפים שמכינים סקירה רבעונית'],
        en: ['B2B sales teams of three to fifteen people on HubSpot or Pipedrive', 'Founders doing their own sales who want to know why deals die', 'Heads of sales at startups preparing a quarterly review'],
      },
      coreFeatures: {
        he: [
          'חיבור ל-HubSpot ול-Pipedrive עם webhook על מעבר לשלב "הפסד"',
          'תחקיר של דקה: עץ סיבות, מתחרה, רגע ההתקררות, מה היינו עושים אחרת',
          'תזכורת עדינה לאיש המכירות ודוח תחקירים חסרים למנהל',
          'ניתוח סיבות לפי סגמנט, מקור ליד, גודל עסקה ואיש מכירות',
          'רשימת "ללא החלטה" לניסיון חוזר אחרי רבעון',
          'כתיבת הסיבה חזרה לשדה ב-CRM כדי לא ליצור מאגר כפול',
          'סיכום חודשי מוכן להדבקה בסקירת הצוות',
        ],
        en: [
          'HubSpot and Pipedrive connection with a webhook on the move to "lost"',
          'A one-minute debrief: reason tree, competitor, the moment it went cold, what we would do differently',
          'A gentle rep reminder and a missing-debriefs report for the manager',
          'Reason analysis by segment, lead source, deal size and rep',
          'A "no decision" list for a second attempt after a quarter',
          'Write the reason back to the CRM field so there is no duplicate silo',
          'A monthly summary ready to paste into the team review',
        ],
      },
      screens: [
        { name: { he: 'תחקיר', en: 'Debrief' }, description: { he: 'מסך אחד שנפתח מקישור: פרטי העסקה מה-CRM למעלה, עץ בחירה עם כפתורים גדולים, ושדה חופשי קצר בסוף.', en: 'A single screen opened from a link: deal details from the CRM on top, a decision tree with big buttons, and a short free-text field at the end.' } },
        { name: { he: 'התור שלי', en: 'My queue' }, description: { he: 'עסקאות שאבדו וממתינות לתחקיר, עם כמה זמן עבר מאז ההפסד.', en: 'Lost deals awaiting a debrief, with how long it has been since the loss.' } },
        { name: { he: 'דוח מנהל', en: 'Manager report' }, description: { he: 'תחקירים חסרים לפי איש מכירות, סיבות ההפסד של השבוע, ומגמה לעומת החודש הקודם.', en: 'Missing debriefs by rep, this week’s loss reasons, and the trend against last month.' } },
        { name: { he: 'ניתוח', en: 'Analysis' }, description: { he: 'פירוק הסיבות לפי סגמנט, מקור ליד וגודל עסקה, עם לחיצה שמובילה לרשימת העסקאות מאחורי כל פלח.', en: 'Reasons broken down by segment, lead source and deal size, with a click through to the deals behind each slice.' } },
        { name: { he: 'ניסיון חוזר', en: 'Second attempt' }, description: { he: 'עסקאות "ללא החלטה" ו"תזמון" שמגיעות לבשלות, עם כפתור ליצירת משימת מעקב ב-CRM.', en: '"No decision" and "timing" deals coming due, with a button that creates a follow-up task in the CRM.' } },
        { name: { he: 'הגדרות', en: 'Settings' }, description: { he: 'חיבור CRM, התאמת ניסוח עץ הסיבות לשפת הצוות, ותדירות הדוחות.', en: 'CRM connection, reason-tree wording adapted to the team’s language, and report frequency.' } },
      ],
      userJourney: {
        he: [
          'איש מכירות מסמן עסקה כ"הפסד" ב-HubSpot אחרי שיחה מאכזבת',
          'תוך דקה מגיע לו קישור בסלאק או במייל לתחקיר של העסקה',
          'הוא בוחר "מחיר", מציין את המתחרה, ומסמן שהעסקה התקררה אחרי הצעת המחיר',
          'הסיבה נכתבת חזרה ל-HubSpot והעסקה נעלמת מדוח "חסרים" של המנהלת',
          'בסוף החודש המנהלת רואה שרוב ההפסדים בסגמנט הקטן הם על מחיר – ובוחנת חבילה זולה יותר',
          'ברבעון הבא רשימת "ללא החלטה" מייצרת ארבע שיחות חוזרות',
        ],
        en: [
          'A rep marks a deal as lost in HubSpot after a disappointing call',
          'Within a minute a link to the deal’s debrief arrives in Slack or email',
          'He picks "price", names the competitor and marks that the deal went cold after the quote',
          'The reason is written back to HubSpot and the deal disappears from the manager’s missing list',
          'At month end the manager sees most small-segment losses are on price – and tests a cheaper tier',
          'Next quarter the "no decision" list produces four follow-up calls',
        ],
      },
      uxDirection: {
        he: 'מסך התחקיר חייב להרגיש קל יותר מלהתעלם ממנו: כפתורים גדולים, בלי גלילה, בלי שדות חובה מעבר לעץ, ואישור שמופיע מיד. דוחות המנהלים הם טבלאות נקיות עם צבע הדגשה אחד; בלי מדי "בריאות" ובלי ציונים שמביכים אנשי מכירות מול הצוות.',
        en: 'The debrief screen must feel easier than ignoring it: large buttons, no scrolling, no required fields beyond the tree, and instant confirmation. Manager reports are clean tables with a single accent colour; no "health" gauges and no scores that embarrass reps in front of the team.',
      },
      architecture: {
        he: 'אפליקציית Next.js על Vercel עם Supabase לנתונים ולאימות. Webhooks מ-HubSpot ומ-Pipedrive נקלטים ב-Route Handlers, יוצרים רשומת תחקיר ושולחים קישור בסלאק או במייל דרך Resend. השלמת תחקיר כותבת חזרה לשדה מותאם ב-CRM דרך ה-API שלו. הדוחות הם תצוגות SQL מחושבות; עבודות מתוזמנות (Vercel Cron) שולחות את התזכורות ואת הסיכום השבועי.',
        en: 'A Next.js app on Vercel with Supabase for data and auth. HubSpot and Pipedrive webhooks land in Route Handlers, create a debrief record and send a link via Slack or email through Resend. Completing a debrief writes back to a custom CRM field through its API. Reports are computed SQL views; scheduled jobs (Vercel Cron) send the reminders and the weekly summary.',
      },
      stack: ['Next.js', 'Vercel', 'Supabase', 'HubSpot API', 'Pipedrive API', 'Slack API', 'Resend', 'Tailwind CSS'],
      database: {
        he: ['organizations – ארגון, חברים, תפקידים, חיבור CRM', 'reason_tree – עץ הסיבות של הארגון עם ניסוח מותאם', 'deals – עסקה מה-CRM: מזהה חיצוני, סכום, סגמנט, מקור, איש מכירות', 'debriefs – תחקיר: סיבה, מתחרה, רגע ההתקררות, טקסט חופשי, סטטוס', 'reminders – תזכורות שנשלחו ולמי', 'followups – עסקאות לניסיון חוזר ותאריך יעד'],
        en: ['organizations – org, members, roles, CRM connection', 'reason_tree – the org’s reason tree with custom wording', 'deals – CRM deal: external id, amount, segment, source, rep', 'debriefs – debrief: reason, competitor, cold moment, free text, status', 'reminders – reminders sent and to whom', 'followups – deals flagged for a second attempt with a due date'],
      },
      auth: {
        he: 'כניסה עם Google Workspace או Microsoft, ו-OAuth מול ה-CRM לחיבור הארגון. קישורי התחקיר חתומים ותקפים לזמן מוגבל, כדי שאיש מכירות ימלא בלי להתחבר. RLS לפי ארגון, ותפקיד מנהל לדוחות.',
        en: 'Google Workspace or Microsoft sign-in, plus OAuth against the CRM to connect the org. Debrief links are signed and time-limited so a rep can fill one in without logging in. Per-org RLS, with a manager role for reports.',
      },
      monetization: {
        he: ['מנוי חודשי לפי מושב לצוותי מכירות', 'תוכנית לסטארטאפים קטנים במחיר קבוע עד מספר מוגדר של אנשי מכירות', 'תוספת בתשלום: ניתוח win/loss גם על עסקאות שנסגרו בהצלחה'],
        en: ['Per-seat monthly subscription for sales teams', 'A flat small-startup plan up to a set number of reps', 'Paid add-on: win/loss analysis on deals that were won as well'],
      },
      mvpMilestones: {
        he: ['חיבור HubSpot עם webhook ומסך תחקיר', 'תזכורות ודוח תחקירים חסרים', 'כתיבה חזרה ל-CRM', 'מסך ניתוח לפי סגמנט ומקור', 'חיבור Pipedrive', 'תמחור וחיוב'],
        en: ['HubSpot connection with a webhook and the debrief screen', 'Reminders and the missing-debriefs report', 'Write-back to the CRM', 'Analysis screen by segment and source', 'Pipedrive connection', 'Pricing and billing'],
      },
      risks: {
        he: ['אם התחקיר לוקח יותר מדקה אנשי המכירות יפסיקו למלא – למדוד זמן השלמה ולקצץ', 'עץ סיבות קבוע עלול לפספס ניואנסים – לאפשר "סיבה משנית" במקום טקסט חופשי ארוך', 'ספקי CRM משנים API ומגבילים webhooks – לבנות סנכרון לפי polling כגיבוי'],
        en: ['If a debrief takes more than a minute reps will stop – measure completion time and cut', 'A fixed reason tree can miss nuance – allow a secondary reason rather than long free text', 'CRM vendors change APIs and limit webhooks – build a polling sync as a fallback'],
      },
      expansion: {
        he: ['ראיונות קצרים עם לקוחות שהפסדנו, בהסכמתם, לצד התחקיר הפנימי', 'אינטגרציה ל-Salesforce ול-monday.com', 'התראות מנחות בזמן אמת: "שלוש עסקאות דומות אבדו על מחיר החודש"'],
        en: ['Short interviews with lost prospects, with their consent, alongside the internal debrief', 'Salesforce and monday.com integrations', 'Real-time coaching alerts: "three similar deals lost on price this month"'],
      },
    },
  },
  {
    id: 'nigmar',
    name: { he: 'נגמר – מה אזל במטבח, בזמן אמת', en: 'Nigmar' },
    tagline: {
      he: 'המטבח מקיש "נגמר" על המנה, ותוך שנייה המלצרים ואפליקציות המשלוחים יודעים – בלי צעקות דרך הפס ובלי לקוח שמזמין מנה שאין.',
      en: 'The kitchen taps "out" on a dish and within seconds the floor and the delivery apps know – no shouting over the pass, no guest ordering a dish that is gone.',
    },
    category: 'business',
    secondaryCategories: ['productivity'],
    difficulty: 'intermediate',
    effort: { weeksMin: 4, weeksMax: 6 },
    budget: 'low',
    businessModel: 'subscription',
    platforms: ['ios', 'android', 'web'],
    audience: ['businesses', 'teams'],
    tags: ['restaurants', 'kitchen', 'inventory', 'real-time', 'menu', 'hospitality', 'delivery', 'operations'],
    identity: { hue: 150, glyph: 'Ng', pattern: 'wave' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: false, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'נגמר פותרת את הרגע המביך ביותר בשירות: המלצרית לוקחת הזמנה לפילה, חוזרת למטבח ומגלה שהדג נגמר לפני חצי שעה. באפליקציה יש לוח אחד משותף לכל המסעדה – טאבלט על הפס במטבח, טלפונים אצל המלצרים ומסך בעמדת הקופה. הטבח מקיש על מנה, בוחר "נגמר" או "נשארו 3", וכולם רואים את זה באותה שנייה עם צליל קצר. לפני השירות השף מסמן מה בכלל קיים היום ומה הספיישל, ולוח ההכנות של הבוקר נבנה מתוך מה שנגמר אתמול. בסוף הערב מתקבל דוח קצר: אילו מנות נגמרו, באיזו שעה, וכמה פעמים לקוחות ביקשו אותן אחרי שנגמרו – נתון שעוזר להזמין נכון מהספק. אפליקציות המשלוחים מתעדכנות במקביל, כך שגם הזמנה מבחוץ לא נופלת על מנה שאין.',
        en: 'Nigmar fixes the most awkward moment in service: the waiter takes an order for the sea bass, walks back to the kitchen and learns the fish ran out half an hour ago. The app is one shared board for the whole restaurant – a tablet on the pass, phones in the waiters’ pockets and a screen at the POS station. A cook taps a dish, picks "out" or "3 left", and everyone sees it the same second with a short sound. Before service the chef marks what exists today and what the special is, and the morning prep list builds itself from what ran out last night. At close a short report shows which dishes ran out, at what time, and how many times guests asked for them afterwards – a number that helps order correctly from the supplier. Delivery apps are updated alongside, so an outside order never lands on a dish that is gone.',
      },
      problem: {
        he: 'מסעדות מנהלות "מה נגמר" בצעקות, בפתק על הפס ובהודעה בקבוצת הוואטסאפ של הצוות שאף אחד לא רואה באמצע שירות. התוצאה: לקוחות מאוכזבים, מנות שחוזרות, הזמנות משלוח שמתבטלות, ואף אחד לא יודע למחרת כמה פעמים ביקשו את המנה שנגמרה.',
        en: 'Restaurants manage "what’s out" by shouting, a note on the pass and a message in the staff WhatsApp group nobody reads mid-service. The result: disappointed guests, dishes sent back, cancelled delivery orders, and no one knowing the next day how many times the missing dish was requested.',
      },
      solution: {
        he: 'לוח מנות אחד בזמן אמת עם שלושה מצבים – זמין, נשארו X, נגמר – שמתעדכן מהפס ונראה מיד אצל כל הצוות, עדכון מקביל לאפליקציות המשלוחים, ודוח ערב שהופך את ה"נגמר" לנתון להזמנה מהספק.',
        en: 'One real-time dish board with three states – available, X left, out – updated from the pass and visible to the whole team instantly, mirrored to the delivery apps, plus a nightly report that turns "out" into a number for the supplier order.',
      },
      usp: {
        he: 'לא מערכת ניהול מסעדה שלמה אלא מסך אחד שבנוי לשתי שניות של תשומת לב באמצע שירות – ידיים רטובות, רעש, לחץ – ובכל זאת מייצר בסוף הערב את הנתון שאף קופה לא נותנת: ביקוש למנות שלא היו.',
        en: 'Not a full restaurant management suite but one screen built for two seconds of attention mid-service – wet hands, noise, pressure – that still produces, by the end of the night, the number no POS gives you: demand for dishes you did not have.',
      },
      targetUsers: {
        he: ['מסעדות וביסטרואים עם תפריט משתנה וצוות של 5–30 אנשים', 'בתי קפה ודוכנים שמוכרים גם דרך אפליקציות משלוחים', 'קייטרינג ואולמות עם שירות בכמה עמדות במקביל'],
        en: ['Restaurants and bistros with a changing menu and a staff of five to thirty', 'Cafés and stalls that also sell through delivery apps', 'Caterers and venues serving from several stations at once'],
      },
      coreFeatures: {
        he: [
          'לוח מנות משותף בזמן אמת: זמין / נשארו X / נגמר',
          'טאבלט מטבח עם כפתורים ענקיים שעובדים גם עם ידיים רטובות',
          'התראה קולית ועדכון מיידי בטלפונים של המלצרים',
          'רשימת "היום בתפריט" והספיישלים שהשף מסמן לפני השירות',
          'עדכון מקביל של אפליקציות המשלוחים כשמנה נגמרת',
          'מונה "ביקשו אחרי שנגמר" בלחיצה אחת מהמלצר',
          'דוח ערב ורשימת הכנות לבוקר שמבוססת על מה שנגמר',
        ],
        en: [
          'A shared real-time dish board: available / X left / out',
          'A kitchen tablet with huge buttons that work with wet hands',
          'A sound alert and instant update on the waiters’ phones',
          'A "today’s menu" and specials list the chef marks before service',
          'Mirrored updates to delivery apps when a dish runs out',
          'A one-tap "asked for it after it ran out" counter for waiters',
          'A nightly report and a morning prep list based on what ran out',
        ],
      },
      screens: [
        { name: { he: 'לוח הפס', en: 'Pass board' }, description: { he: 'מצב טאבלט: רשת של מנות בכפתורים גדולים בצבע לפי מצב; הקשה אחת משנה מצב, הקשה ארוכה מגדירה כמות.', en: 'Tablet mode: a grid of dishes as big colour-coded buttons; one tap changes the state, a long press sets a quantity.' } },
        { name: { he: 'המלצרים', en: 'Floor view' }, description: { he: 'רשימה קומפקטית לטלפון עם המנות שנגמרו למעלה, חיפוש מהיר וכפתור "ביקשו" ליד כל מנה שנגמרה.', en: 'A compact phone list with out-of-stock dishes on top, quick search and an "asked for it" button beside each.' } },
        { name: { he: 'לפני השירות', en: 'Pre-service' }, description: { he: 'השף מסמן מה בתפריט היום, מה הספיישל וכמה מנות יש ממנו – בפחות מדקה.', en: 'The chef marks what is on today, the special and how many portions of it there are – in under a minute.' } },
        { name: { he: 'משלוחים', en: 'Delivery sync' }, description: { he: 'מצב הסנכרון מול כל אפליקציית משלוחים, מנות שהושהו, וכפתור ידני למקרה שהחיבור נפל.', en: 'Sync status per delivery app, paused dishes, and a manual button for when the connection drops.' } },
        { name: { he: 'דוח ערב', en: 'Nightly report' }, description: { he: 'ציר זמן של מה נגמר ומתי, מונה "ביקשו אחרי שנגמר" לכל מנה, והמלצת הזמנה מהספק.', en: 'A timeline of what ran out and when, the "asked after" counter per dish, and a supplier-order suggestion.' } },
        { name: { he: 'תפריט וצוות', en: 'Menu & team' }, description: { he: 'ניהול המנות והקטגוריות, קוד הצטרפות לצוות, והגדרת תפקידים: מטבח, מלצרות, ניהול.', en: 'Manage dishes and categories, a team join code, and roles: kitchen, floor, management.' } },
      ],
      userJourney: {
        he: [
          'השף פותח את הערב ומסמן שהספיישל הוא קציצות דג ויש 12 מנות',
          'ב-20:40 הטבח מקיש "נשארו 3" ואחרי עשר דקות "נגמר"',
          'הטלפונים של המלצרים משמיעים צליל קצר והמנה נצבעת באפור',
          'מלצרית ששני לקוחות ביקשו ממנה את הקציצות לוחצת "ביקשו" פעמיים',
          'אפליקציית המשלוחים משהה את המנה ולא נכנסת עליה הזמנה חדשה',
          'בסוף הערב הדוח מראה שהספיישל נגמר ב-20:50 עם 7 בקשות – מחר מכינים 20',
        ],
        en: [
          'The chef opens the evening and marks the special as fish cakes with 12 portions',
          'At 20:40 the cook taps "3 left" and ten minutes later "out"',
          'The waiters’ phones play a short sound and the dish turns grey',
          'A waitress who was asked twice for the fish cakes taps "asked for it" twice',
          'The delivery app pauses the dish and no new orders come in for it',
          'At close the report shows the special ran out at 20:50 with 7 requests – tomorrow they make 20',
        ],
      },
      uxDirection: {
        he: 'עיצוב לסביבה עוינת: מסך מטבח בניגודיות גבוהה שנקרא גם מבעד לכיסוי ניילון, כפתורים בגודל כף יד, ושלושה צבעים בלבד – ירוק, כתום, אפור – בלי אדום שמלחיץ בשירות. בטלפון של המלצר הכול קריא בגלילה אחת במסדרון חשוך. בלי טקסט מיותר: שם המנה, מצב, כמות.',
        en: 'Designed for a hostile environment: a high-contrast kitchen screen readable through a plastic cover, palm-sized buttons, and only three colours – green, amber, grey – with no red that adds stress in service. On the waiter’s phone everything is readable in one scroll in a dark corridor. No surplus text: dish name, state, quantity.',
      },
      architecture: {
        he: 'Expo עם Expo Router, שרץ בטלפונים כאפליקציה ובטאבלט המטבח כאתר במסך מלא. Supabase Realtime מפיץ כל שינוי מצב לכל המכשירים של המסעדה דרך ערוץ לפי סניף; הטבלאות מוגנות ב-RLS לפי מסעדה ותפקיד. Edge Function מעדכנת את זמינות המנה בפלטפורמות משלוחים שחושפות API למסעדות, ומסמנת "לעדכן ידנית" אצל אלה שלא. דוח הערב ורשימת ההכנות מחושבים ב-SQL ונשלחים כהתראה למנהל.',
        en: 'Expo with Expo Router, running as an app on phones and as a full-screen web page on the kitchen tablet. Supabase Realtime broadcasts every state change to all of the restaurant’s devices over a per-location channel; tables are protected with RLS by restaurant and role. An Edge Function updates dish availability on delivery platforms that expose a merchant API and marks "update manually" for those that do not. The nightly report and prep list are computed in SQL and pushed to the manager as a notification.',
      },
      stack: ['Expo', 'Expo Router', 'React Native Web', 'Supabase', 'Supabase Realtime', 'Supabase Edge Functions', 'expo-notifications', 'expo-audio'],
      database: {
        he: ['restaurants – מסעדה, סניף, קוד הצטרפות, הגדרות', 'members – משתמש, מסעדה, תפקיד: מטבח / מלצרות / ניהול', 'dishes – מנה, קטגוריה, מחיר, האם ספיישל', 'dish_states – מצב נוכחי: זמין / כמות / נגמר, מי עדכן ומתי', 'state_events – היסטוריית שינויים לדוח הערב', 'requests – לחיצות "ביקשו אחרי שנגמר" לפי מנה וזמן', 'delivery_links – מזהה המנה בפלטפורמת משלוחים וסטטוס סנכרון'],
        en: ['restaurants – restaurant, location, join code, settings', 'members – user, restaurant, role: kitchen / floor / management', 'dishes – dish, category, price, is special', 'dish_states – current state: available / quantity / out, who updated and when', 'state_events – change history for the nightly report', 'requests – "asked after it ran out" taps per dish and time', 'delivery_links – the dish’s id on a delivery platform and sync status'],
      },
      auth: {
        he: 'המנהל נרשם עם טלפון או Google ומקבל קוד הצטרפות לצוות; עובדים נכנסים עם הקוד ושם בלבד, כי במטבח אף אחד לא מקליד סיסמאות. טאבלט המטבח מחובר כמכשיר משותף עם תפקיד "מטבח" קבוע.',
        en: 'The manager signs up with a phone number or Google and gets a team join code; staff join with the code and a name only, because nobody types passwords in a kitchen. The kitchen tablet is a shared device pinned to the "kitchen" role.',
      },
      monetization: {
        he: ['מנוי חודשי לסניף עם מספר מכשירים ללא הגבלה', 'תוכנית לרשתות קטנות עם כמה סניפים ודוח מרכז', 'תוספת בתשלום: סנכרון לאפליקציות משלוחים ולמערכת הקופה'],
        en: ['Monthly subscription per location with unlimited devices', 'A small-chain plan with several locations and a central report', 'Paid add-on: delivery-app and POS sync'],
      },
      mvpMilestones: {
        he: ['לוח מנות בזמן אמת בין טאבלט לטלפונים', 'תפריט היום, ספיישלים וכמויות', 'מונה "ביקשו" ודוח ערב', 'רשימת הכנות לבוקר', 'סנכרון לפלטפורמת משלוחים אחת', 'מנוי לסניף'],
        en: ['Real-time dish board between tablet and phones', 'Today’s menu, specials and quantities', 'The "asked for it" counter and nightly report', 'Morning prep list', 'Sync with one delivery platform', 'Per-location subscription'],
      },
      risks: {
        he: ['הוויי-פיי במטבח לא יציב – המכשיר חייב להציג מצב אחרון ידוע עם חותמת זמן ולסנכרן כשהקשר חוזר', 'אם הצוות לא מעדכן תוך שניות הלוח מאבד אמון – העדכון חייב להיות מהיר יותר מצעקה', 'ממשקי המשלוחים שונים בין פלטפורמות ולא לכולן יש API פתוח – להתחיל עם אחת ולהציג מצב "ידני" בכנות'],
        en: ['Kitchen Wi-Fi is flaky – the device must show the last known state with a timestamp and sync when the connection returns', 'If the team does not update within seconds the board loses trust – updating must be faster than shouting', 'Delivery integrations differ by platform and not all have an open API – start with one and show "manual" honestly'],
      },
      expansion: {
        he: ['ספירת מלאי חומרי גלם פשוטה שמנבאת מתי מנה תיגמר', 'תצוגת לקוח: תפריט QR שמסתיר מנות שנגמרו בזמן אמת', 'חיבור למערכות קופה כדי לחסום הזמנה של מנה שנגמרה'],
        en: ['Simple raw-ingredient counts that predict when a dish will run out', 'A guest view: a QR menu that hides sold-out dishes in real time', 'POS integrations that block ordering a dish that is out'],
      },
    },
  },
  {
    id: 'closeout',
    name: { he: 'Closeout – סופרים קופה', en: 'Closeout' },
    tagline: {
      he: 'ספירת קופה בסוף יום בלי מחשבון: מקישים כמה שטרות ומטבעות יש מכל סוג, רואים את הפער מול הקופה הרושמת, ושולחים את החודש לרואה החשבון.',
      en: 'Count the till at closing without a calculator: tap the notes and coins of each kind, see the gap against the register, and send the month to your accountant.',
    },
    category: 'business',
    secondaryCategories: ['finance'],
    difficulty: 'beginner',
    effort: { weeksMin: 1, weeksMax: 3 },
    budget: 'free',
    businessModel: 'one-time',
    platforms: ['ios', 'android'],
    audience: ['businesses'],
    tags: ['cash', 'till', 'retail', 'closing', 'shop', 'bookkeeping', 'offline'],
    identity: { hue: 60, glyph: 'Co', pattern: 'ring' },
    flags: { beginnerFriendly: true, profitPotential: 'low', experimental: false, trending: false, featuredWeight: 2 },
    spec: {
      overview: {
        he: 'Closeout היא אפליקציה קטנה לבעלי חנויות, בתי קפה ודוכנים שסוגרים קופה כל ערב. במקום לספור מזומן על הדלפק עם מחשבון ולכתוב את התוצאה על פתק, מקישים כמה שטרות של 200, 100, 50 ו-20 יש, כמה מטבעות מכל סוג, והאפליקציה מחשבת את הסכום תוך כדי. מזינים את סכום המזומן שהקופה הרושמת מצפה לו ואת הכסף הקטן שנשאר למחר, והפער מופיע מיד – ירוק, או אדום עם הסכום החסר. כל ספירה נשמרת עם שעה, שם הסוגר ותמונה אופציונלית של דוח ה-Z, ובסוף החודש מייצאים טבלה אחת לרואה החשבון. הכול עובד במכשיר, בלי חשבון ובלי אינטרנט – פרויקט מושלם למפתח ראשון שרוצה לשלוח אפליקציה אמיתית לחנות אמיתית.',
        en: 'Closeout is a small app for shop owners, cafés and market stalls that close a till every evening. Instead of counting cash on the counter with a calculator and writing the result on a slip, you tap how many 200, 100, 50 and 20 notes there are, how many coins of each kind, and the total updates as you go. Enter the cash the register expects and the float you leave for tomorrow, and the variance appears immediately – green, or red with the missing amount. Every count is saved with the time, who closed and an optional photo of the Z report, and at month end you export one table for the accountant. Everything runs on the device, with no account and no internet – a perfect project for a first-time developer who wants to ship a real app to a real shop.',
      },
      problem: {
        he: 'סגירת קופה היא טקס יומי שנעשה עייפים, בלחץ ועם טעויות חיבור. הפתקים הולכים לאיבוד, אף אחד לא זוכר אם הפער של יום שלישי היה 40 או 140 שקל, ורואה החשבון מקבל בסוף החודש ערימת צילומים.',
        en: 'Closing the till is a daily ritual done tired, in a hurry, with arithmetic mistakes. The slips get lost, nobody remembers whether Tuesday’s gap was 40 or 140 shekels, and the accountant receives a pile of photos at month end.',
      },
      solution: {
        he: 'מסך ספירה לפי ערכי שטרות ומטבעות עם סכום שמתעדכן חי, חישוב פער אוטומטי מול הקופה ומול הכסף הקטן, היסטוריה עם תמונה ושם סוגר, ויצוא חודשי לטבלה. בלי שרת ובלי הרשמה.',
        en: 'A count screen by note and coin denomination with a live total, automatic variance against the register and the float, a history with photo and closer name, and a monthly table export. No server and no sign-up.',
      },
      usp: {
        he: 'אפליקציה של מסך אחד שעושה את הטקס הזה מהר יותר ממחשבון, זוכרת את הכסף הקטן של אתמול, ומייצרת בסוף החודש בדיוק את הקובץ שרואה החשבון ביקש – ולא עוד מערכת ניהול חנות שלמה שאף אחד לא יטמיע בשביל זה.',
        en: 'A one-screen app that makes the ritual faster than a calculator, remembers yesterday’s float, and produces at month end exactly the file the accountant asked for – not a full shop-management system nobody would adopt just for this.',
      },
      targetUsers: {
        he: ['בעלי חנויות קטנות ובתי קפה שסוגרים קופה בעצמם', 'דוכנים בשווקים ובאירועים עם הרבה מזומן', 'מנהלי משמרת שסוגרים קופה עבור בעל העסק'],
        en: ['Small shop and café owners who close the till themselves', 'Market and event stalls that handle a lot of cash', 'Shift managers closing the till on behalf of the owner'],
      },
      coreFeatures: {
        he: [
          'ספירה לפי ערכי שטרות ומטבעות עם סכום חי',
          'פער אוטומטי מול הסכום שהקופה מצפה לו',
          'הגדרת כסף קטן שנשאר למחר ונספר מחדש בפתיחה',
          'תמונה של דוח ה-Z ושם הסוגר לכל ספירה',
          'היסטוריה עם סימון ימים בפער חריג',
          'יצוא חודשי ל-CSV או ל-PDF ושליחה לרואה החשבון',
        ],
        en: [
          'Count by note and coin denomination with a live total',
          'Automatic variance against what the register expects',
          'A float that stays for tomorrow and is recounted at opening',
          'A Z-report photo and the closer’s name on every count',
          'History with days of unusual variance highlighted',
          'Monthly CSV or PDF export sent to the accountant',
        ],
      },
      screens: [
        { name: { he: 'ספירה', en: 'Count' }, description: { he: 'עמודה של שטרות ומטבעות עם כפתורי פלוס ומינוס והקלדה ישירה, סכום גדול שמתעדכן למעלה, וכפתור "הלאה" בתחתית.', en: 'A column of notes and coins with plus and minus buttons and direct entry, a big running total on top, and a "next" button at the bottom.' } },
        { name: { he: 'סיכום', en: 'Summary' }, description: { he: 'סכום שנספר, סכום צפוי מהקופה, כסף קטן למחר והפער בצבע; שדה הערה ותמונה של דוח ה-Z.', en: 'Counted total, expected total from the register, float for tomorrow and the variance in colour; a note field and a Z-report photo.' } },
        { name: { he: 'היסטוריה', en: 'History' }, description: { he: 'רשימת ספירות לפי תאריך עם הפער, שם הסוגר ואייקון תמונה; ימים חריגים מסומנים.', en: 'Counts by date with the variance, closer name and a photo icon; unusual days flagged.' } },
        { name: { he: 'יצוא חודשי', en: 'Monthly export' }, description: { he: 'בחירת חודש, תצוגה מקדימה של הטבלה, ושליחה כ-CSV או PDF דרך תפריט השיתוף.', en: 'Pick a month, preview the table, and send it as CSV or PDF through the share sheet.' } },
        { name: { he: 'הגדרות', en: 'Settings' }, description: { he: 'מטבע וערכים פעילים, שמות הסוגרים, כסף קטן ברירת מחדל ושפה.', en: 'Currency and active denominations, closer names, default float and language.' } },
      ],
      userJourney: {
        he: [
          'בעלת בית קפה סוגרת ב-19:30 ופותחת את Closeout',
          'מקישה 3 שטרות של 200, 11 של 100 ו-14 מטבעות של 10 תוך כדי שהיא סופרת',
          'מזינה שהקופה מצפה ל-2,640 ושומרת 300 ככסף קטן למחר',
          'הפער מופיע באדום: חסרים 40 שקל; היא מוסיפה הערה "החזר ללקוח ללא קבלה"',
          'מצלמת את דוח ה-Z ושומרת; הספירה מצטרפת להיסטוריה',
          'ב-1 לחודש היא שולחת את טבלת החודש לרואה החשבון בוואטסאפ',
        ],
        en: [
          'A café owner closes at 19:30 and opens Closeout',
          'She taps 3 notes of 200, 11 of 100 and 14 coins of 10 as she counts',
          'She enters that the register expects 2,640 and keeps 300 as tomorrow’s float',
          'The variance shows in red: 40 shekels short; she adds the note "customer refund without receipt"',
          'She photographs the Z report and saves; the count joins the history',
          'On the 1st she sends the month’s table to the accountant over WhatsApp',
        ],
      },
      uxDirection: {
        he: 'מסך אחד, יד אחת, תאורת ניאון של חנות בלילה: מספרים ענקיים, כפתורי פלוס ומינוס גדולים, ומקלדת מספרית שנפתחת רק כשמקישים על הכמות. ירוק ואדום לפער בלבד. בלי אונבורדינג – הספירה הראשונה היא ההדרכה.',
        en: 'One screen, one hand, shop lighting at night: huge numbers, large plus and minus buttons, and a numeric keypad that opens only when you tap a quantity. Green and red for the variance only. No onboarding – the first count is the tutorial.',
      },
      architecture: {
        he: 'Expo עם Expo Router ושלושה מסכים עיקריים. כל הנתונים ב-SQLite במכשיר דרך expo-sqlite; התמונות נשמרות בתיקיית האפליקציה. היצוא נבנה במכשיר (CSV כטקסט, PDF דרך expo-print) ונשלח בתפריט השיתוף. אין שרת ואין מפתחות API, ולכן גם אין עלויות שוטפות – כל המורכבות היא בחישוב נכון ובמסך ספירה שנעים להשתמש בו.',
        en: 'Expo with Expo Router and three main screens. All data lives in SQLite on the device via expo-sqlite; photos are stored in the app’s folder. Export is built on device (CSV as text, PDF via expo-print) and sent through the share sheet. No server and no API keys, so no running costs – all the complexity is in getting the arithmetic right and a count screen that feels good to use.',
      },
      stack: ['Expo', 'Expo Router', 'expo-sqlite', 'expo-print', 'expo-image-picker', 'expo-sharing'],
      database: {
        he: ['closings – ספירה, תאריך, סוגר, סכום שנספר, סכום צפוי, כסף קטן, פער, הערה (מקומי)', 'closing_lines – כמות לכל ערך שטר או מטבע בכל ספירה', 'photos – נתיב לתמונת דוח ה-Z של כל ספירה', 'settings – ערכים פעילים, שמות סוגרים, כסף קטן ברירת מחדל'],
        en: ['closings – count, date, closer, counted total, expected total, float, variance, note (local)', 'closing_lines – quantity per note or coin denomination for each count', 'photos – path to the Z-report photo per count', 'settings – active denominations, closer names, default float'],
      },
      auth: {
        he: 'ללא חשבון. קוד נעילה אופציונלי של ארבע ספרות בפתיחת האפליקציה, כי מספרי הקופה הם מידע עסקי. גיבוי ידני לקובץ דרך תפריט השיתוף.',
        en: 'No account. An optional four-digit lock on launch, since till figures are business data. Manual backup to a file through the share sheet.',
      },
      monetization: {
        he: ['רכישה חד-פעמית אחרי שבועיים של שימוש חופשי', 'גרסת "כמה קופות" לעסקים עם כמה עמדות, כרכישה נפרדת', 'בהמשך: סנכרון ענן בין בעל העסק למנהלי המשמרת כמנוי קטן'],
        en: ['One-time purchase after two weeks of free use', 'A "multiple tills" edition for businesses with several stations, as a separate purchase', 'Later: cloud sync between the owner and shift managers as a small subscription'],
      },
      mvpMilestones: {
        he: ['מסך ספירה עם סכום חי לערכי השקל', 'סיכום עם סכום צפוי, כסף קטן ופער', 'היסטוריה מקומית', 'תמונה ושם סוגר', 'יצוא CSV ושיתוף', 'רכישה חד-פעמית'],
        en: ['Count screen with a live total for shekel denominations', 'Summary with expected total, float and variance', 'Local history', 'Photo and closer name', 'CSV export and sharing', 'One-time purchase'],
      },
      risks: {
        he: ['טעות בעיגול או בחישוב הפער תשבור אמון מיד – לכתוב בדיקות לחישובים לפני כל דבר אחר', 'הנתונים במכשיר בלבד – אובדן טלפון הוא אובדן היסטוריה, לכן הגיבוי לקובץ חייב להיות בולט', 'שוק קטן ומחיר נמוך – זה פרויקט ללימוד ולהכנסה צנועה, לא לסטארטאפ'],
        en: ['Wrong rounding or variance arithmetic breaks trust immediately – write tests for the calculations before anything else', 'Data lives only on the device – a lost phone is lost history, so file backup must be prominent', 'A small market and a low price – this is a project for learning and modest income, not a startup'],
      },
      expansion: {
        he: ['פתיחת קופה בבוקר עם ספירת הכסף הקטן ואישור', 'תמיכה במטבעות נוספים לעסקים באזורי תיירות', 'קריאת הסכום הצפוי מצילום דוח ה-Z'],
        en: ['Morning opening with a float count and confirmation', 'Additional currencies for businesses in tourist areas', 'Reading the expected total from the Z-report photo'],
      },
    },
  },
];
