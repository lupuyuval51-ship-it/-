import type { Idea } from '../types';

/**
 * Artificial Intelligence – second batch. Each idea has a mechanism-level
 * differentiator (quote-or-silence, role-based prompts, calibrated judges,
 * on-device inference) rather than a generic chatbot wrapper.
 */
export const ideas: Idea[] = [
  {
    id: 'plainform',
    name: { he: 'Plainform – המכתב בעברית פשוטה', en: 'Plainform' },
    tagline: {
      he: 'מצלמים מכתב רשמי ומקבלים בעברית פשוטה: מה רוצים ממני, עד מתי, ומה כתוב במכתב על אי-מענה – עם ציטוט מאחורי כל שורה.',
      en: 'Photograph an official letter and get plain language: what they want, by when, and what it says if I ignore it – each line backed by a quote.',
    },
    category: 'ai',
    secondaryCategories: ['productivity', 'lifestyle'],
    difficulty: 'beginner',
    effort: { weeksMin: 2, weeksMax: 3 },
    budget: 'low',
    businessModel: 'one-time',
    platforms: ['web'],
    audience: ['consumers'],
    tags: ['official letters', 'plain language', 'hebrew', 'vision', 'document understanding', 'citations', 'bureaucracy', 'credits'],
    identity: { hue: 190, glyph: 'Pn', pattern: 'grid' },
    flags: { beginnerFriendly: true, profitPotential: 'medium', experimental: false, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Plainform מתרגמת מכתבים רשמיים לעברית פשוטה. המשתמש מצלם או מעלה מכתב מהעירייה, מחברת הביטוח, מרשות המסים או מבעל הדירה, ומקבל כרטיס אחד ברור: מי שלח, מה הוא מבקש, עד איזה תאריך, איזה סכום או השלכה מוזכרים במכתב, ולמי פונים בשאלות. כל שורה בכרטיס מצורפת לציטוט מדויק מהמכתב, כך שאפשר לבדוק מול המקור. מה שהמכתב לא אומר, האפליקציה לא ממציאה: היא כותבת "לא מצוין במכתב". זה כלי הסבר ולא ייעוץ משפטי.',
        en: 'Plainform translates official letters into plain language. The user photographs or uploads a letter from the municipality, an insurer, the tax authority or a landlord and gets one clear card: who sent it, what they ask for, by which date, which amount or consequence the letter mentions, and whom to contact with questions. Every line on the card is attached to an exact quote from the letter so it can be checked against the source. What the letter does not say, the app does not invent: it writes "not stated in the letter". It is an explanation tool, not legal advice.',
      },
      problem: {
        he: 'מכתבים רשמיים כתובים בשפה משפטית ועמוסה. יש אנשים שדוחים את הפתיחה שלהם, ויש מי שמפספס תאריך יעד כי הוא קבור בפסקה השלישית. מי שפחות שולט בעברית, מבוגרים או עולים חדשים, תלוי בקרוב משפחה שיסביר.',
        en: 'Official letters are written in dense, legalistic language. Some people postpone opening them, and some miss a deadline because it is buried in the third paragraph. Those less fluent in Hebrew, older adults or new immigrants, depend on a relative to explain.',
      },
      solution: {
        he: 'מצלמים את המכתב, מודל ראייה קורא אותו ומחזיר מבנה קבוע: שולח, בקשה, תאריך יעד, סכום, השלכות שמוזכרות במכתב ופרטי קשר. כל שדה חייב ציטוט תומך; שדה בלי ציטוט לא מוצג. מתאריך היעד אפשר לייצא אירוע ליומן כקובץ ICS.',
        en: 'Photograph the letter and a vision model reads it and returns a fixed structure: sender, request, deadline, amount, consequences the letter mentions and contact details. Every field must carry a supporting quote; a field without one is not shown. The deadline can be exported to a calendar as an ICS file.',
      },
      usp: {
        he: 'כלל "ציטוט או שתיקה": כל טענה בכרטיס מקושרת למשפט מהמכתב עצמו, ואם אין משפט תומך האפליקציה אומרת שהדבר לא מצוין. אפשר לבדוק הכול במבט אחד, בלי לסמוך על המודל בעיניים עצומות.',
        en: 'A "quote or silence" rule: every claim on the card links to a sentence in the letter itself, and if no sentence supports it the app says it is not stated. Everything can be checked at a glance, without trusting the model blindly.',
      },
      targetUsers: {
        he: ['אנשים שמקבלים מכתבים רשמיים ומתקשים בשפה המשפטית', 'עולים חדשים ודוברי עברית כשפה שנייה', 'בני משפחה שעוזרים להורים מבוגרים עם הניירת'],
        en: ['People who receive official letters and struggle with legal language', 'New immigrants and second-language Hebrew speakers', 'Family members helping older parents with paperwork'],
      },
      coreFeatures: {
        he: [
          'צילום או העלאה של מכתב בן עמוד עד שלושה עמודים',
          'כרטיס מובנה: שולח, בקשה, תאריך יעד, סכום ופרטי קשר',
          'ציטוט תומך לכל שדה, עם הדגשה בטקסט שנקרא מהמכתב',
          '"לא מצוין במכתב" במקום ניחוש כשאין ציטוט',
          'ייצוא תאריך היעד ליומן כקובץ ICS',
          'מחיקת התמונה מיד אחרי העיבוד ושמירת כרטיס רק לפי בחירה',
        ],
        en: [
          'Photograph or upload a letter of one to three pages',
          'Structured card: sender, request, deadline, amount and contact details',
          'A supporting quote for every field, highlighted in the text read from the letter',
          '"Not stated in the letter" instead of a guess when there is no quote',
          'Export the deadline to a calendar as an ICS file',
          'Image deleted right after processing; a card is saved only by choice',
        ],
      },
      screens: [
        { name: { he: 'העלאה', en: 'Upload' }, description: { he: 'כפתור צילום גדול, בחירת קובץ וההסבר החד-משמעי: ההסבר אינו ייעוץ משפטי והתמונה נמחקת.', en: 'A big capture button, file picker and a plain note: the explanation is not legal advice and the image is deleted.' } },
        { name: { he: 'קורא את המכתב', en: 'Reading' }, description: { he: 'מסך המתנה קצר עם שלבים (קריאה, חילוץ, בדיקת ציטוטים) כדי שהמשתמש יידע שמשהו קורה.', en: 'A short wait screen with steps (reading, extracting, checking quotes) so the user knows something is happening.' } },
        { name: { he: 'כרטיס המכתב', en: 'Letter card' }, description: { he: 'שאלות בשפה יומיומית עם תשובה תחת כל אחת: מה רוצים ממני, עד מתי, כמה, למי פונים.', en: 'Everyday questions with an answer under each: what do they want, by when, how much, whom to contact.' } },
        { name: { he: 'הטקסט שנקרא', en: 'Text read' }, description: { he: 'הטקסט המלא כפי שנקרא, עם הדגשה של הציטוט שנבחר, כדי לאמת ולתקן טעויות קריאה.', en: 'The full text as read, with the chosen quote highlighted, to verify and catch reading mistakes.' } },
        { name: { he: 'קרדיטים', en: 'Credits' }, description: { he: 'יתרת מכתבים, חבילות רכישה חד-פעמיות והיסטוריית שימוש.', en: 'Letters remaining, one-time packs to buy and usage history.' } },
      ],
      userJourney: {
        he: [
          'המשתמש מקבל מכתב מהעירייה ומצלם אותו בטלפון',
          'מקבל כרטיס שמסביר שנדרש תשלום עד תאריך מסוים',
          'לוחץ על התאריך ורואה את המשפט במכתב ממנו נלקח',
          'מייצא את התאריך ליומן ומשתף את הכרטיס עם בן משפחה',
          'כשנגמרים הקרדיטים החינמיים, קונה חבילה קטנה',
        ],
        en: [
          'The user gets a letter from the municipality and photographs it with a phone',
          'Gets a card explaining that a payment is requested by a certain date',
          'Taps the date and sees the sentence in the letter it came from',
          'Exports the date to the calendar and shares the card with a relative',
          'When the free credits run out, buys a small pack',
        ],
      },
      uxDirection: {
        he: 'רגוע ופשוט, עם גופן גדול וניגודיות גבוהה למבוגרים. הכרטיס בנוי כרשימת שאלות בשפה יומיומית. הציטוטים בצבע נפרד, ולחיצה עליהם מדגישה את המקום בטקסט שנקרא. בלי ז׳רגון משפטי בממשק ובלי אזהרות מפחידות.',
        en: 'Calm and simple, with large type and high contrast for older users. The card is a list of questions in everyday language. Quotes have their own colour, and tapping one highlights its place in the text read. No legal jargon in the interface and no scary warnings.',
      },
      architecture: {
        he: 'אתר Next.js מותאם למובייל. התמונה נשלחת ל-Route Handler שמעביר אותה למודל ראייה עם סכמת JSON קבועה. המודל מחזיר את הטקסט המלא שנקרא ושדות שכל אחד מהם מצביע על שורות בטקסט; ההדגשה היא על הטקסט ולא על התמונה. התמונה נשמרת בזיכרון בזמן הבקשה בלבד. Supabase לאימות ולכרטיסים שנשמרו, ו-Stripe Payment Links לחבילות קרדיטים עם Webhook שמעדכן יתרה בטבלת ledger.',
        en: 'A mobile-friendly Next.js site. The image goes to a Route Handler that passes it to a vision model with a fixed JSON schema. The model returns the full text it read and fields that each point to lines in that text; highlighting is on the text, not the image. The image lives in memory for the request only. Supabase handles auth and saved cards, and Stripe Payment Links sell credit packs with a webhook that updates the balance in a ledger table.',
      },
      stack: ['Next.js', 'TypeScript', 'Supabase', 'Stripe', 'Anthropic or OpenAI vision API', 'Vercel'],
      database: {
        he: ['profiles – משתמש והעדפות', 'credit_ledger – תנועות קרדיטים (רכישה, שימוש, החזר)', 'saved_cards – כרטיסים שנשמרו: שדות, ציטוטים והטקסט שנקרא', 'stripe_events – אירועי תשלום שעובדו, למניעת כפילות'],
        en: ['profiles – user and preferences', 'credit_ledger – credit movements (purchase, use, refund)', 'saved_cards – saved cards: fields, quotes and the text read', 'stripe_events – processed payment events, to prevent duplicates'],
      },
      auth: {
        he: 'קישור קסם באימייל. אפשר לנסות מכתב ראשון בלי הרשמה, עם הגבלת קצב; הרשמה נדרשת לרכישת קרדיטים ולשמירת כרטיסים. RLS לפי משתמש בכל הטבלאות.',
        en: 'Email magic link. A first letter can be tried without signing up, with rate limiting; sign-up is needed to buy credits and save cards. Per-user RLS on every table.',
      },
      monetization: {
        he: ['מכתב ראשון חינם ואחריו חבילות קרדיטים חד-פעמיות דרך Stripe', 'בלי מנוי: מי שמקבל מכתב אחת לכמה חודשים לא משלם דמי חודש'],
        en: ['First letter free, then one-time credit packs through Stripe', 'No subscription: someone who gets a letter once every few months does not pay a monthly fee'],
      },
      mvpMilestones: {
        he: ['העלאת תמונה וקריאה במודל ראייה עם סכמת JSON וציטוטים', 'כרטיס התוצאה ותצוגת הטקסט עם הדגשת ציטוטים', 'קרדיטים: Stripe Payment Link, Webhook ו-ledger', 'ייצוא ICS ושמירת כרטיסים עם אימות', 'בדיקה על מכתבים אמיתיים מושחרים וכיוון ההנחיות'],
        en: ['Image upload and vision-model reading with a JSON schema and quotes', 'Result card and text view with quote highlighting', 'Credits: Stripe Payment Link, webhook and ledger', 'ICS export and saved cards with auth', 'Testing on redacted real letters and tuning the prompts'],
      },
      risks: {
        he: ['טעויות קריאה בכתב יד או בצילום מטושטש – להציג את הטקסט שנקרא כדי לאמת', 'הכרטיס עלול להיתפס כייעוץ משפטי – ניסוח "הסבר בלבד" והפניה לגורם מוסמך', 'מכתבים מכילים פרטים אישיים – לא לשמור תמונות ולהבהיר איזה ספק מודל מקבל את התוכן'],
        en: ['Misreading handwriting or blurry photos – show the text read so it can be verified', 'The card may be mistaken for legal advice – "explanation only" wording and a pointer to a qualified person', 'Letters hold personal details – do not keep images and state which model provider receives the content'],
      },
      expansion: {
        he: ['טיוטת מענה קצרה שהמשתמש עורך ושולח בעצמו', 'הסבר בשפות נוספות, כמו רוסית, ערבית ואנגלית', 'מצב משפחה: מכתבים של הורה מבוגר מגיעים אל בן משפחה שמטפל בהם באישורו'],
        en: ['A short draft reply the user edits and sends themselves', 'Explanations in more languages, such as Russian, Arabic and English', 'Family mode: an older parent’s letters reach a relative who handles them with consent'],
      },
    },
  },
  {
    id: 'altwise',
    name: { he: 'Altwise – טקסט חלופי לתמונות', en: 'Altwise' },
    tagline: {
      he: 'מעלים תמונות לאתר ומקבלים טקסט חלופי בעברית ובאנגלית לפי תפקיד התמונה בעמוד – לא תיאור גנרי אחד לכולן – עם מפתח ה-API שלכם.',
      en: 'Upload site images and get Hebrew and English alt text shaped by each image’s role on the page – not one generic caption – using your own API key.',
    },
    category: 'ai',
    secondaryCategories: ['devtools', 'creativity'],
    difficulty: 'beginner',
    effort: { weeksMin: 1, weeksMax: 2 },
    budget: 'free',
    businessModel: 'open-source',
    platforms: ['web'],
    audience: ['creators', 'developers'],
    tags: ['accessibility', 'alt text', 'images', 'vision', 'bring your own key', 'open source', 'hebrew', 'cms'],
    identity: { hue: 66, glyph: 'Aw', pattern: 'dots' },
    flags: { beginnerFriendly: true, profitPotential: 'low', experimental: false, trending: false, featuredWeight: 2 },
    spec: {
      overview: {
        he: 'Altwise הוא כלי קוד פתוח שכותב טקסט חלופי (alt) לתמונות באתר. לפני שהמודל כותב, המשתמש בוחר מה תפקיד התמונה בעמוד – קישוט, מידע, כפתור או תרשים מורכב – ומזין את המשפט שסביבה. מתמונת קישוט יוצא alt ריק בכוונה, מתמונת מידע משפט קצר שלא חוזר על הכיתוב שלידה, ומתרשים alt קצר ותיאור ארוך נפרד. התוצאות עוברות אישור ידני ויוצאות כ-CSV או JSON לייבוא ל-CMS. הכול רץ בדפדפן עם מפתח ה-API של המשתמש.',
        en: 'Altwise is an open-source tool that writes alt text for website images. Before the model writes, the user picks the image’s role on the page – decoration, information, button or complex chart – and enters the sentence around it. A decorative image yields an intentionally empty alt, an informative one a short sentence that does not repeat the nearby caption, and a chart a short alt plus a separate long description. Results go through manual approval and export as CSV or JSON for a CMS import. Everything runs in the browser with the user’s own API key.',
      },
      problem: {
        he: 'באתרים רבים תמונות נשארות בלי טקסט חלופי או עם תיאור גנרי כמו "תמונה של אדם". קוראי מסך מקריאים את זה, וגולשים עיוורים או לקויי ראייה מפספסים את התוכן. כתיבה ידנית למאות תמונות היא עבודה סיזיפית, ותיאור אוטומטי שלא מכיר את ההקשר חוזר על הכיתוב הקיים.',
        en: 'On many sites images are left without alt text or with a generic description such as "photo of a person". Screen readers read that out, and blind or low-vision visitors miss the content. Writing hundreds by hand is tedious, and automatic descriptions that ignore context repeat the existing caption.',
      },
      solution: {
        he: 'מחולל שמקבל שלושה נתונים: התמונה, תפקידה בעמוד והמשפט שסביבה. לכל תפקיד יש תבנית הנחיה וכלל אורך משלו. אחרי הייצור, בדיקות אוטומטיות מסמנות alt ארוך מדי, alt שמתחיל ב"תמונה של" וחזרה על הכיתוב. שום דבר לא נכנס לקובץ הייצוא לפני אישור אנושי.',
        en: 'A generator that takes three inputs: the image, its role on the page and the sentence around it. Each role has its own prompt template and length rule. After generation, automatic checks flag alt text that is too long, starts with "image of" or repeats the caption. Nothing enters the export file before a human approves it.',
      },
      usp: {
        he: 'הטקסט נקבע לפי תפקיד התמונה בעמוד ולא לפי מה שרואים בה בלבד: קישוט מקבל alt ריק, תרשים מקבל תיאור נפרד, וכפתור מקבל את הפעולה שהוא מבצע.',
        en: 'The text is driven by the image’s role on the page, not only by what is visible: decoration gets an empty alt, a chart gets a separate description, and a button gets the action it performs.',
      },
      targetUsers: {
        he: ['יוצרי תוכן ובעלי אתרים קטנים', 'מפתחים שמנגישים אתר קיים', 'צוותי תוכן שמנהלים ספריית תמונות גדולה'],
        en: ['Content creators and small site owners', 'Developers making an existing site accessible', 'Content teams managing a large image library'],
      },
      coreFeatures: {
        he: [
          'בחירת תפקיד לכל תמונה: קישוט, מידע, פעולה או תרשים',
          'שדה הקשר: המשפט או הכיתוב שסביב התמונה',
          'פלט בעברית ובאנגלית זה לצד זה',
          'בדיקות אוטומטיות: אורך, ביטויי פתיחה מיותרים וחזרה על הכיתוב',
          'תור אישור שבו מאשרים או עורכים כל טקסט',
          'עיבוד מנות של תיקיית תמונות וייצוא CSV או JSON',
          'מפתח API שנשמר בדפדפן בלבד',
        ],
        en: [
          'Pick a role per image: decoration, information, action or chart',
          'A context field: the sentence or caption around the image',
          'Hebrew and English output side by side',
          'Automatic checks: length, redundant opening phrases and caption repetition',
          'A review queue where every text is approved or edited',
          'Batch-process a folder of images and export CSV or JSON',
          'API key stored in the browser only',
        ],
      },
      screens: [
        { name: { he: 'העלאה', en: 'Upload' }, description: { he: 'גרירת תיקיית תמונות, תצוגה מקדימה ומונה תמונות לפני העיבוד.', en: 'Drag in a folder of images, with previews and a counter before processing.' } },
        { name: { he: 'פרטי תמונה', en: 'Image detail' }, description: { he: 'בחירת תפקיד, הזנת משפט הקשר ובחירת שפות הפלט לכל תמונה.', en: 'Choose the role, enter the context sentence and pick output languages for each image.' } },
        { name: { he: 'תור אישור', en: 'Review queue' }, description: { he: 'רשימת טקסטים עם סימוני הבדיקות, עריכה מהירה ואישור במקלדת.', en: 'A list of texts with check flags, quick editing and keyboard approval.' } },
        { name: { he: 'ייצוא', en: 'Export' }, description: { he: 'בחירת פורמט (CSV, JSON), עמודות והורדה של הקובץ המאושר.', en: 'Choose a format (CSV, JSON), columns and download the approved file.' } },
        { name: { he: 'הגדרות', en: 'Settings' }, description: { he: 'ספק המודל, מפתח ה-API, שפת ברירת מחדל וסף אורך.', en: 'Model provider, API key, default language and length threshold.' } },
      ],
      userJourney: {
        he: [
          'המפתחת גוררת תיקיית תמונות של אתר חדשות קטן',
          'מסמנת לכל תמונה תפקיד ומדביקה את הכיתוב הקיים',
          'מריצה עיבוד ומקבלת שתי גרסאות לכל תמונה',
          'עוברת על התור, מתקנת שלושה טקסטים ומאשרת',
          'מייצאת CSV ומייבאת אותו ל-CMS',
        ],
        en: [
          'A developer drags in a folder of images from a small news site',
          'Marks a role for each image and pastes the existing caption',
          'Runs processing and gets two versions per image',
          'Goes through the queue, fixes three texts and approves',
          'Exports a CSV and imports it into the CMS',
        ],
      },
      uxDirection: {
        he: 'כלי עבודה נקי: טבלה צפופה אך קריאה, קיצורי מקלדת לאישור ולדילוג, ותצוגת תמונה גדולה לצד הטקסט. הצבעים מדגישים סטטוס (טיוטה, מאושר, נדרש תיקון). הכלי עצמו נגיש: ניגודיות גבוהה ותמיכה מלאה במקלדת.',
        en: 'A clean working tool: a dense but readable table, keyboard shortcuts for approving and skipping, and a large image view beside the text. Colour marks status (draft, approved, needs fixing). The tool itself is accessible: high contrast and full keyboard support.',
      },
      architecture: {
        he: 'אפליקציית Vite ו-React סטטית שרצה כולה בדפדפן. התמונות נקראות מקומית, מכווצות ונשלחות ישירות לספק מודל ראייה שמאפשר קריאות מהדפדפן, עם המפתח של המשתמש. פרויקטים ותוצאות נשמרים ב-IndexedDB. הבדיקות האוטומטיות הן פונקציות רגילות בלי מודל, ולכן קל לבדוק אותן. אפשר לפרוס לכל אחסון סטטי.',
        en: 'A static Vite and React app that runs entirely in the browser. Images are read locally, compressed and sent straight to a vision-model provider that allows browser calls, using the user’s key. Projects and results are kept in IndexedDB. The automatic checks are ordinary functions with no model, so they are easy to test. It can be deployed to any static host.',
      },
      stack: ['Vite', 'React', 'TypeScript', 'IndexedDB', 'Vision LLM API (bring your own key)'],
      database: {
        he: ['projects – פרויקט וקבוצת תמונות (IndexedDB)', 'images – שם קובץ, תמונה מכווצת, תפקיד ומשפט הקשר', 'alt_results – טקסט שנוצר, שפה וסטטוס (טיוטה או מאושר)', 'settings – ספק, שפת ברירת מחדל וסף אורך'],
        en: ['projects – project and image group (IndexedDB)', 'images – file name, compressed image, role and context sentence', 'alt_results – generated text, language and status (draft or approved)', 'settings – provider, default language and length threshold'],
      },
      auth: {
        he: 'אין חשבונות ואין שרת. המפתח נשמר בדפדפן בלבד, ב-sessionStorage כברירת מחדל וב-localStorage לפי בחירה, ואינו מועבר לאף גורם מלבד ספק המודל שבחר המשתמש.',
        en: 'No accounts and no server. The key is kept in the browser only, in sessionStorage by default and localStorage by choice, and goes to no one except the model provider the user chose.',
      },
      monetization: {
        he: ['קוד פתוח וחינמי, עם תמיכה דרך GitHub Sponsors', 'שירות התקנה והתאמה לאתרים של לקוחות, כשירות ולא כמוצר'],
        en: ['Free and open source, supported through GitHub Sponsors', 'Setup and customisation service for client sites, as a service rather than a product'],
      },
      mvpMilestones: {
        he: ['העלאת תמונות, כיווץ ושמירה ב-IndexedDB', 'ארבע תבניות הנחיה לפי תפקיד התמונה', 'תור אישור ועריכה', 'בדיקות איכות אוטומטיות', 'ייצוא CSV או JSON ופרסום ב-GitHub עם README'],
        en: ['Image upload, compression and IndexedDB storage', 'Four prompt templates by image role', 'Review and edit queue', 'Automatic quality checks', 'CSV or JSON export and a GitHub release with a README'],
      },
      risks: {
        he: ['המודל עלול לטעות בטקסט בתמונה או בזיהוי אנשים – חובת אישור אנושי והנחיה לא לנחש שמות', 'מפתח API בדפדפן חשוף לתוספים זדוניים – אפשרות sessionStorage והסבר ברור', 'התמונות נשלחות לספק חיצוני – לציין זאת בהעלאה ולא להעלות תמונות רגישות'],
        en: ['The model may misread text in images or misidentify people – mandatory human approval and an instruction not to guess names', 'An API key in the browser is exposed to malicious extensions – sessionStorage option and a clear explanation', 'Images go to an external provider – say so at upload and avoid sensitive images'],
      },
      expansion: {
        he: ['תוסף WordPress שמושך תמונות חסרות alt מספריית המדיה', 'סריקת כתובת אתר שמוצאת תמונות בלי alt', 'תבניות הנחיה לשפות נוספות'],
        en: ['A WordPress plugin that pulls images missing alt from the media library', 'A URL scan that finds images without alt', 'Prompt templates for more languages'],
      },
    },
  },
  {
    id: 'premortem',
    name: { he: 'Premortem – מה יכול להשתבש', en: 'Premortem' },
    tagline: {
      he: 'לפני החלטה גדולה – משרה, דירה, רכישה – מקבלים סיפורי כישלון קצרים ובדיקה זולה אחת שאפשר לעשות כבר השבוע.',
      en: 'Before a big decision – a job, a flat, a major purchase – get short failure stories and one cheap test you can run this week.',
    },
    category: 'ai',
    secondaryCategories: ['productivity', 'lifestyle'],
    difficulty: 'intermediate',
    effort: { weeksMin: 4, weeksMax: 6 },
    budget: 'low',
    businessModel: 'freemium',
    platforms: ['cross-platform'],
    audience: ['consumers', 'professionals'],
    tags: ['decision making', 'pre-mortem', 'assumptions', 'reflection', 'llm', 'structured reasoning', 'reminders'],
    identity: { hue: 352, glyph: 'Pr', pattern: 'wave' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: true, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Premortem לוקחת טכניקה מוכרת מניהול פרויקטים – לדמיין שהתוכנית נכשלה ולשאול למה – ומפעילה אותה על החלטות אישיות. המשתמש מתאר החלטה ומה הוא מקווה לקבל. המודל מחלץ מהטקסט את ההנחות הסמויות ("המשכורת תספיק", "המנהל החדש יהיה בסדר"), המשתמש מאשר או מתקן אותן, ואז נכתבים שלושה סיפורי כישלון קצרים, כל אחד נשען על הנחה אחרת. בסוף האפליקציה בונה בדיקה זולה להנחה השברירית ביותר, עם מועד ותזכורת. אחרי המועד המשתמש מתעד מה גילה.',
        en: 'Premortem takes a familiar project-management technique – imagine the plan failed and ask why – and applies it to personal decisions. The user describes a decision and what they hope to gain. The model extracts the hidden assumptions ("the salary will be enough", "the new manager will be fine"), the user confirms or corrects them, and then three short failure stories are written, each hinging on a different assumption. Finally the app builds a cheap test for the most fragile assumption, with a date and a reminder. After the date the user records what they found out.',
      },
      problem: {
        he: 'כשמתלבטים, רוב המחשבה נסובה סביב מה יכול להצליח. ההנחות שהתוכנית נשענת עליהן נשארות בלתי מנוסחות, ולכן אף אחד לא בודק אותן עד שמאוחר. שיחה עם חברים מניבה לעיתים קרובות עצות, לא בדיקה.',
        en: 'When torn, most thinking circles around what could succeed. The assumptions the plan rests on stay unspoken, so nobody checks them until it is late. A chat with friends often produces advice rather than a test.',
      },
      solution: {
        he: 'תהליך של חמישה שלבים עם מבנה קבוע: תיאור ההחלטה, חילוץ והסכמה על הנחות, סיפורי כישלון, בחירת ההנחה השברירית ביותר ובדיקה זולה עם מועד. התוצר איננו המלצה אלא מסמך החלטה קצר שאפשר לחזור אליו.',
        en: 'A five-step process with a fixed structure: describe the decision, extract and agree on assumptions, failure stories, pick the most fragile assumption, and a cheap test with a date. The output is not a recommendation but a short decision record to return to.',
      },
      usp: {
        he: 'האפליקציה לא אומרת "כדאי" או "לא כדאי". היא מפרקת את ההחלטה להנחות ומחייבת בדיקה קטנה של אחת מהן, עם תאריך ותיעוד התוצאה.',
        en: 'The app never says "go" or "don’t go". It breaks the decision into assumptions and requires one small test of one of them, with a date and a record of the result.',
      },
      targetUsers: {
        he: ['אנשים שעומדים לפני החלטה גדולה שאפשר לבדוק חלק ממנה מראש', 'מנהלים ויזמים שרוצים לתעד הנחות לפני יציאה לדרך', 'מי שנוטה לנתח יותר מדי ולא לפעול'],
        en: ['People facing a big decision that can be partly tested beforehand', 'Managers and founders who want to document assumptions before starting', 'Those who tend to over-analyse and not act'],
      },
      coreFeatures: {
        he: [
          'חילוץ הנחות סמויות מתיאור חופשי, עם אישור המשתמש',
          'שלושה סיפורי כישלון קצרים, כל אחד סביב הנחה אחרת',
          'דירוג כל הנחה לפי "כמה אני בטוח" ו"כמה זול לבדוק"',
          'בדיקה זולה עם מועד ותזכורת מקומית בטלפון',
          'תיעוד תוצאה אחרי המועד ועדכון ההנחה',
          'ארכיון החלטות פרטי עם חיפוש',
        ],
        en: [
          'Extract hidden assumptions from free text, with user confirmation',
          'Three short failure stories, each around a different assumption',
          'Rate each assumption by "how sure am I" and "how cheap to test"',
          'A cheap test with a date and a local reminder on the phone',
          'Record the result after the date and update the assumption',
          'A private, searchable archive of decisions',
        ],
      },
      screens: [
        { name: { he: 'החלטה חדשה', en: 'New decision' }, description: { he: 'שדה טקסט חופשי, מה אני מקווה לקבל ועד מתי צריך להחליט.', en: 'A free-text field, what I hope to gain and the deadline for deciding.' } },
        { name: { he: 'ההנחות שלי', en: 'My assumptions' }, description: { he: 'רשימת ההנחות שחולצו, עם אפשרות לערוך, למחוק או להוסיף אחת משלך.', en: 'The extracted assumptions, with options to edit, delete or add one of your own.' } },
        { name: { he: 'סיפורי כישלון', en: 'Failure stories' }, description: { he: 'שלושה סיפורים קצרים בכרטיסים, מסומנים כתרחישים דמיוניים ולא כתחזית.', en: 'Three short stories on cards, marked as imaginary scenarios and not predictions.' } },
        { name: { he: 'הבדיקה הזולה', en: 'The cheap test' }, description: { he: 'ההנחה שנבחרה, הצעה לבדיקה קטנה, בחירת מועד והפעלת תזכורת.', en: 'The chosen assumption, a suggested small test, a date picker and reminder toggle.' } },
        { name: { he: 'מה גיליתי', en: 'What I found' }, description: { he: 'טופס קצר אחרי המועד: מה קרה, איך זה משנה את ההנחה, והחלטה מעודכנת.', en: 'A short form after the date: what happened, how it changes the assumption, and the updated decision.' } },
        { name: { he: 'ארכיון', en: 'Archive' }, description: { he: 'רשימת החלטות עבר עם סטטוס והנחות שהתבררו כנכונות או שגויות.', en: 'Past decisions with status and assumptions that proved right or wrong.' } },
      ],
      userJourney: {
        he: [
          'המשתמשת מתלבטת אם לעבור לעבודה בחברה קטנה ומקלידה את השיקולים',
          'מאשרת שלוש מתוך שש ההנחות שהמודל חילץ ומוסיפה אחת',
          'קוראת שלושה סיפורי כישלון ומבינה שההנחה על הצוות היא השברירית ביותר',
          'קובעת בדיקה: לשוחח השבוע עם שני עובדים לשעבר, ומפעילה תזכורת',
          'אחרי המועד מתעדת את מה ששמעה ומעדכנת את ההחלטה',
        ],
        en: [
          'The user is torn about moving to a small company and types out her considerations',
          'Confirms three of the six extracted assumptions and adds one',
          'Reads three failure stories and realises the assumption about the team is the most fragile',
          'Sets a test: talk to two former employees this week, and turns on a reminder',
          'After the date records what she heard and updates the decision',
        ],
      },
      uxDirection: {
        he: 'שקט ומרוכז: מסך אחד לכל שלב, כרטיסים גדולים וטיפוגרפיה נוחה לקריאה. סיפורי הכישלון מעוצבים כספרון קצר ולא כאזהרה אדומה. אין ציונים ואין אחוזי הצלחה, רק הנחות ובדיקות. הניסוח תמיד "תרחיש" ולא "תחזית".',
        en: 'Quiet and focused: one screen per step, large cards and readable typography. Failure stories look like a short booklet, not a red warning. No scores and no success percentages, only assumptions and tests. The wording is always "scenario", never "forecast".',
      },
      architecture: {
        he: 'Expo עם Expo Router. כל שלב בתהליך הוא קריאה נפרדת ל-Edge Function ב-Supabase עם סכמת פלט קבועה (הנחות, סיפורים, בדיקה), כך שאפשר לערוך כל שלב לפני שממשיכים. תזכורות נקבעות כהתראות מקומיות בעזרת expo-notifications, בלי שרת דחיפה. RevenueCat מנהל את הגישה הבלתי מוגבלת והרכישות בחנויות.',
        en: 'Expo with Expo Router. Each step is a separate call to a Supabase Edge Function with a fixed output schema (assumptions, stories, test), so any step can be edited before moving on. Reminders are scheduled as local notifications with expo-notifications, no push server needed. RevenueCat manages unlimited access and store purchases.',
      },
      stack: ['Expo', 'Expo Router', 'Supabase', 'Supabase Edge Functions', 'Anthropic or OpenAI API', 'expo-notifications', 'RevenueCat'],
      database: {
        he: ['profiles – משתמש והעדפות', 'decisions – כותרת, תיאור, מועד החלטה וסטטוס', 'assumptions – ניסוח, רמת ביטחון ועלות בדיקה', 'failure_stories – סיפור והנחה שהוא נשען עליה', 'experiments – הבדיקה, מועד, תוצאה ומזהה התזכורת'],
        en: ['profiles – user and preferences', 'decisions – title, description, decision date and status', 'assumptions – wording, confidence and cost to test', 'failure_stories – story and the assumption it rests on', 'experiments – the test, date, result and reminder id'],
      },
      auth: {
        he: 'כניסה עם Apple או Google ואימייל. ההחלטות אישיות, ולכן RLS לפי משתמש, ומחיקת חשבון מוחקת את כל הארכיון.',
        en: 'Sign in with Apple or Google, plus email. Decisions are personal, so per-user RLS applies, and deleting the account deletes the whole archive.',
      },
      monetization: {
        he: ['שתי החלטות בחודש חינם', 'מנוי חודשי או שנתי דרך RevenueCat להחלטות בלתי מוגבלות וארכיון עם חיפוש', 'רכישה חד-פעמית בתוך האפליקציה להחלטה בודדת נוספת'],
        en: ['Two decisions a month free', 'Monthly or annual subscription through RevenueCat for unlimited decisions and a searchable archive', 'A one-time in-app purchase for a single extra decision'],
      },
      mvpMilestones: {
        he: ['תהליך חילוץ הנחות ואישורן, בטקסט בלבד', 'סיפורי כישלון ובחירת ההנחה השברירית ביותר', 'בדיקה זולה, מועד ותזכורת מקומית עם expo-notifications', 'ארכיון, תיעוד תוצאה ומחיקת נתונים', 'RevenueCat: מגבלת החינם ומסך מנוי'],
        en: ['Assumption extraction and confirmation flow, text only', 'Failure stories and picking the most fragile assumption', 'Cheap test, date and local reminder with expo-notifications', 'Archive, result logging and data deletion', 'RevenueCat: the free limit and a subscription screen'],
      },
      risks: {
        he: ['נושאים רגישים: האפליקציה אינה ייעוץ מקצועי ואינה תחליף לאיש מקצוע – ניסוח ברור בכניסה', 'סיפורי כישלון עלולים להישמע כחיזוי – לכתוב אותם כתרחישים דמיוניים', 'ערך הליבה תלוי בהנחות שהמודל מחלץ – לדרוש אישור ידני לכל הנחה'],
        en: ['Sensitive topics: the app is not professional advice or a substitute for an expert – clear wording at entry', 'Failure stories may sound like predictions – write them as imaginary scenarios', 'The core value depends on the assumptions the model extracts – require manual confirmation of each'],
      },
      expansion: {
        he: ['מצב זוגי שבו שני אנשים מגדירים הנחות בנפרד ורואים איפה הן שונות', 'תבניות לסוגי החלטות, כמו מעבר דירה או החלפת עבודה', 'סקירה שנתית של הנחות שהתבררו כשגויות'],
        en: ['A couples mode where two people list assumptions separately and see where they differ', 'Templates for decision types such as moving flat or changing jobs', 'An annual review of assumptions that proved wrong'],
      },
    },
  },
  {
    id: 'nikudo',
    name: { he: 'Nikudo – ניקוד אוטומטי עם בקרה', en: 'Nikudo' },
    tagline: {
      he: 'מדביקים טקסט בעברית ומקבלים אותו מנוקד, כשהמילים שיש להן כמה קריאות מסומנות לבחירה, ועוד דף עבודה מוכן להדפסה.',
      en: 'Paste Hebrew text and get it with niqqud, ambiguous words flagged for you to choose, plus a print-ready worksheet.',
    },
    category: 'ai',
    secondaryCategories: ['education', 'creativity'],
    difficulty: 'intermediate',
    effort: { weeksMin: 5, weeksMax: 7 },
    budget: 'low',
    businessModel: 'freemium',
    platforms: ['web'],
    audience: ['parents', 'professionals', 'students'],
    tags: ['hebrew', 'niqqud', 'diacritics', 'reading', 'worksheets', 'printing', 'llm', 'nlp'],
    identity: { hue: 240, glyph: 'Nk', pattern: 'dots' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Nikudo מנקדת טקסט בעברית ועוזרת לבדוק את התוצאה. אחרי שמדביקים טקסט, מודל שפה מוסיף ניקוד, ובדיקה שנייה משווה כל מילה ללקסיקון של צורות מנוקדות ידועות. מילים שיש להן כמה קריאות אפשריות, כמו "ספר", או שבהן המודל והלקסיקון חלוקים, מסומנות בצבע, ולחיצה עליהן מציגה את הקריאות. הבחירה נשמרת במסמך. את התוצאה אפשר להדפיס כדף עבודה בגופן גדול, בניקוד מלא או רק במילים המעורפלות, ולחלק את המילים להברות בצבעים.',
        en: 'Nikudo adds niqqud to Hebrew text and helps check the result. After text is pasted, a language model adds the vowel marks, and a second check compares each word to a lexicon of known vocalised forms. Words with several possible readings, such as "ספר", or where the model and lexicon disagree, are highlighted, and tapping one shows the readings. The choice is saved in the document. The result can be printed as a large-type worksheet with full niqqud or only on the ambiguous words, with words split into coloured syllables.',
      },
      problem: {
        he: 'טקסט מנוקד נחוץ למי שלומד לקרוא, ללומדי עברית ולמי שמכין חומרי לימוד, אבל ניקוד ידני לוקח זמן, והכלים האוטומטיים טועים בלי להודיע איפה. מילה אחת שנוקדה לא נכון עלולה ללמד קריאה שגויה.',
        en: 'Vocalised text is needed by those learning to read, by Hebrew learners and by anyone preparing study material, but manual niqqud takes time, and automatic tools make mistakes without saying where. One wrongly pointed word can teach a wrong reading.',
      },
      solution: {
        he: 'שני מנגנונים: ניקוד מהמודל ולצידו בדיקת לקסיקון שמסמנת אי-ודאות. המשתמש עובר רק על המילים המסומנות ולא על כל הטקסט. אחר כך הוא בוחר פורמט – ניקוד מלא, ניקוד חלקי או חלוקה להברות – ומייצא ל-PDF.',
        en: 'Two mechanisms: niqqud from the model, with a lexicon check beside it that flags uncertainty. The user reviews only the flagged words rather than the whole text. Then they pick a format – full niqqud, partial niqqud or syllable split – and export to PDF.',
      },
      usp: {
        he: 'במקום "ניקוד אוטומטי" שאי אפשר לדעת איפה לסמוך עליו, Nikudo מראה את המילים שהיא לא בטוחה בהן ונותנת למשתמש להכריע, והבחירות נשמרות למסמכים הבאים.',
        en: 'Instead of "automatic niqqud" where you cannot tell what to trust, Nikudo shows the words it is unsure about and lets the user decide, and the choices carry over to later documents.',
      },
      targetUsers: {
        he: ['הורים ומורים שמכינים חומרי קריאה בבית ובכיתה', 'לומדי עברית כשפה שנייה', 'כותבי תוכן שמכינים טקסטים מנוקדים'],
        en: ['Parents and teachers preparing reading material at home and in class', 'Learners of Hebrew as a second language', 'Content writers preparing vocalised texts'],
      },
      coreFeatures: {
        he: [
          'הדבקת טקסט או צילום דף וקריאתו',
          'ניקוד מלא או חלקי, רק במילים המעורפלות',
          'סימון מילים לא בטוחות לפי פער בין המודל ללקסיקון וריבוי קריאות',
          'בחירת קריאה בלחיצה ושמירתה במילון אישי',
          'חלוקה להברות בצבעים מתחלפים',
          'ייצוא דף עבודה ל-PDF בגופן גדול עם מרווח שורות',
          'הקראה בקול העברי של המכשיר, כשיש כזה',
        ],
        en: [
          'Paste text or photograph a page and read it',
          'Full or partial niqqud, only on the ambiguous words',
          'Flag uncertain words by model-versus-lexicon gaps and multiple readings',
          'Choose a reading with a tap and save it in a personal glossary',
          'Syllable split in alternating colours',
          'Export a worksheet to PDF in large type with generous line spacing',
          'Read aloud with the device’s Hebrew voice, when one exists',
        ],
      },
      screens: [
        { name: { he: 'הדבקה', en: 'Paste' }, description: { he: 'שדה טקסט RTL גדול, כפתור צילום דף ובחירת רמת הניקוד לפני ההרצה.', en: 'A large RTL text field, a page-photo button and a niqqud level choice before running.' } },
        { name: { he: 'עורך התוצאה', en: 'Result editor' }, description: { he: 'הטקסט המנוקד עם מילים מסומנות בצבע ומונה של מילים שנותרו לבדיקה.', en: 'The vocalised text with colour-flagged words and a counter of words left to review.' } },
        { name: { he: 'בחירת קריאה', en: 'Reading chooser' }, description: { he: 'חלונית שמציגה את הקריאות האפשריות של מילה, דוגמה במשפט ולחצן שמירה למילון.', en: 'A sheet showing the possible readings of a word, an example in a sentence and a save-to-glossary button.' } },
        { name: { he: 'פריסת הדפסה', en: 'Print layout' }, description: { he: 'תצוגה מקדימה של דף A4, גודל גופן, מרווח, ניקוד מלא או חלקי והברות.', en: 'An A4 preview with font size, spacing, full or partial niqqud and syllables.' } },
        { name: { he: 'מילון אישי', en: 'Personal glossary' }, description: { he: 'כל הבחירות ששמרתי, עם אפשרות לשנות או למחוק.', en: 'All the choices I saved, with options to change or delete them.' } },
        { name: { he: 'ספרייה', en: 'Library' }, description: { he: 'מסמכים שמורים עם תאריך ותצוגה מקדימה, למנויים.', en: 'Saved documents with date and preview, for subscribers.' } },
      ],
      userJourney: {
        he: [
          'מורה מדביקה סיפור קצר שכתבה לכיתה א׳',
          'מקבלת טקסט מנוקד ו-12 מילים מסומנות',
          'עוברת על המילים, בוחרת קריאה לכל אחת ושומרת למילון',
          'בוחרת ניקוד מלא, הברות בצבעים וגופן גדול',
          'מייצאת PDF ומדפיסה לכיתה',
        ],
        en: [
          'A teacher pastes a short story she wrote for first grade',
          'Gets vocalised text and 12 flagged words',
          'Goes through the words, picks a reading for each and saves to the glossary',
          'Chooses full niqqud, coloured syllables and a large font',
          'Exports a PDF and prints it for the class',
        ],
      },
      uxDirection: {
        he: 'נקי וכמעט נייר: רקע בהיר, גופן עברי גדול עם תמיכה מלאה בניקוד, והדגשות עדינות שאינן מסתירות את הסימנים. המילים המסומנות בצבע אחד בלבד, כדי שלא יהיה רעש. מסך ההדפסה הוא המסך המרכזי ולא תוספת.',
        en: 'Clean and almost paper-like: a light background, a large Hebrew font with full niqqud support, and subtle highlights that do not hide the marks. Flagged words use a single colour to avoid noise. The print screen is a primary screen, not an afterthought.',
      },
      architecture: {
        he: 'Next.js עם עורך טקסט RTL. Route Handler שולח את הטקסט (או צילום דף, שנקרא קודם במודל ראייה) למודל שפה עם הוראה להחזיר JSON של מילה, ניקוד וביטחון. שכבת שרת נפרדת בודקת כל מילה מול לקסיקון מנוקד מורשה שנטען ל-Postgres: חוסר התאמה או כמה קריאות מסומנים. חלוקה להברות נעשית בכללים, בלי מודל, על הטקסט המנוקד. ה-PDF נוצר בדפדפן. Stripe Checkout למנוי, ו-Supabase לאימות ולמסמכים.',
        en: 'Next.js with an RTL text editor. A Route Handler sends the text (or a page photo, read first by a vision model) to a language model with an instruction to return JSON of word, vocalisation and confidence. A separate server layer checks each word against a licensed vocalised lexicon loaded into Postgres: a mismatch or several readings get flagged. Syllable splitting is rule-based, with no model, on the vocalised text. The PDF is generated in the browser. Stripe Checkout handles the subscription, and Supabase handles auth and documents.',
      },
      stack: ['Next.js', 'TypeScript', 'Supabase', 'Postgres', 'Stripe', 'Anthropic or OpenAI API', 'Vercel'],
      database: {
        he: ['documents – מסמך, טקסט מקור והגדרות הדפסה', 'words – מילה, צורה מנוקדת וסטטוס (בטוח, מסומן, נבחר)', 'glossary – בחירות אישיות של קריאה לכל משתמש', 'lexicon_forms – צורות מנוקדות מהלקסיקון', 'subscriptions – מצב מנוי מסונכרן מ-Stripe'],
        en: ['documents – document, source text and print settings', 'words – word, vocalised form and status (sure, flagged, chosen)', 'glossary – per-user personal reading choices', 'lexicon_forms – vocalised forms from the lexicon', 'subscriptions – subscription state synced from Stripe'],
      },
      auth: {
        he: 'אימייל וקישור קסם או כניסה עם Google. אין חשבונות לילדים: ילדים רואים רק דף מודפס או מצב קריאה במכשיר של הורה או מורה.',
        en: 'Email magic link or Google sign-in. There are no child accounts: children see only a printed page or a reading mode on a parent’s or teacher’s device.',
      },
      monetization: {
        he: ['חינם עד מספר שורות ליום, בלי שמירה וייצוא עם סימן מים', 'מנוי חודשי או שנתי דרך Stripe לספרייה, ייצוא PDF נקי ומילון אישי', 'רישיון לבית ספר עם כמה מורים'],
        en: ['Free up to a number of lines per day, without saving and with a watermarked export', 'Monthly or annual subscription through Stripe for the library, clean PDF export and a personal glossary', 'A school licence for several teachers'],
      },
      mvpMilestones: {
        he: ['עורך RTL וניקוד ממודל בפלט JSON', 'לקסיקון בדיקה וסימון מילים לא בטוחות', 'בחירת קריאה ומילון אישי', 'חלוקה להברות וייצוא PDF', 'Stripe Checkout ושער בין חינם לתשלום'],
        en: ['RTL editor and model niqqud in JSON output', 'Check lexicon and flagging of uncertain words', 'Reading chooser and personal glossary', 'Syllable split and PDF export', 'Stripe Checkout and a free-to-paid gate'],
      },
      risks: {
        he: ['ניקוד שגוי עלול ללמד קריאה שגויה – סימון אי-ודאות ובדיקה אנושית לפני הדפסה', 'רישיון הלקסיקון והתאמתו לשימוש מסחרי דורשים בירור לפני השקה', 'הקול העברי של המכשיר שונה בין מכשירים – להציג את ההקראה כבונוס'],
        en: ['Wrong niqqud can teach a wrong reading – flag uncertainty and require human review before printing', 'The lexicon licence and its fit for commercial use need clarifying before launch', 'The device’s Hebrew voice varies between devices – present read-aloud as a bonus'],
      },
      expansion: {
        he: ['תוסף דפדפן לניקוד טקסט מסומן בכל אתר', 'ערכות דפי עבודה לפי נושא וסגנון', 'שיתוף מסמך בין מורים בקישור לקריאה בלבד'],
        en: ['A browser extension that adds niqqud to selected text on any site', 'Worksheet kits by topic and style', 'Sharing a document between teachers through a read-only link'],
      },
    },
  },
  {
    id: 'toolbelt',
    name: { he: 'Toolbelt – הצעה מהודעה קולית', en: 'Toolbelt' },
    tagline: {
      he: 'לקוח משאיר הודעה קולית לשרברב או לחשמלאי, ובעל המקצוע מקבל תקציר, דחיפות וטיוטת תשובה על בסיס מחירון שהוא עצמו כתב.',
      en: 'A customer leaves a voicemail for a plumber or electrician; the pro gets a summary, urgency and a draft reply based on their own price list.',
    },
    category: 'ai',
    secondaryCategories: ['business', 'productivity'],
    difficulty: 'intermediate',
    effort: { weeksMin: 7, weeksMax: 10 },
    budget: 'medium',
    businessModel: 'b2b',
    platforms: ['ios', 'android'],
    audience: ['businesses', 'professionals'],
    tags: ['voicemail', 'transcription', 'tradespeople', 'price list', 'whatsapp', 'small business', 'israel', 'extraction'],
    identity: { hue: 38, glyph: 'Tb', pattern: 'diagonal' },
    flags: { beginnerFriendly: false, profitPotential: 'high', experimental: false, trending: false, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Toolbelt מיועדת לבעלי מקצוע שעובדים בשטח ולא תמיד יכולים לענות לטלפון: שרברבים, חשמלאים, מנעולנים, טכנאי מזגנים. לבעל המקצוע יש מספר ייעודי שאליו מועברות שיחות שלא נענו. הלקוח משאיר הודעה קולית, היא מתומללת, והמודל מחלץ ממנה סוג תקלה, כתובת, דחיפות ושם. אחר כך האפליקציה משווה את סוג העבודה למחירון שבעל המקצוע הגדיר ומנסחת טיוטת תשובה. אם העבודה לא במחירון, הטיוטה מציעה ביקור ולא מנחשת מחיר. בעל המקצוע מאשר בלחיצה, והתשובה נפתחת מוכנה בוואטסאפ שלו.',
        en: 'Toolbelt is for tradespeople who work in the field and cannot always answer the phone: plumbers, electricians, locksmiths, AC technicians. The pro has a dedicated number that unanswered calls are forwarded to. The customer leaves a voicemail, it is transcribed, and the model extracts fault type, address, urgency and name. The app then matches the job type to the price list the pro defined and drafts a reply. If the job is not on the list, the draft proposes a visit instead of guessing a price. The pro approves with a tap, and the reply opens ready in their own WhatsApp.',
      },
      problem: {
        he: 'בעל מקצוע שנמצא מתחת לכיור לא יכול לענות לטלפון, וקל לאבד לקוח שחיפש מענה מהיר. הודעות קוליות לעיתים ארוכות ולא ברורות, והחזרה אליהן אחר כך דורשת האזנה, הקלדה וחישוב מחיר בראש.',
        en: 'A pro under a sink cannot answer the phone, and it is easy to lose a customer who wanted a quick response. Voicemails can be long and unclear, and replying later takes listening, typing and working out a price in your head.',
      },
      solution: {
        he: 'מספר ייעודי עם העברה כשאין מענה, תמלול אוטומטי, חילוץ מובנה והצעה מתוך מחירון. כל מחיר בטיוטה חייב להגיע משורה במחירון של בעל המקצוע; אם אין שורה מתאימה, אין מחיר. ההודעה לא נשלחת בלי אישור של בעל המקצוע.',
        en: 'A dedicated number with forwarding when unanswered, automatic transcription, structured extraction and a quote from a price list. Every price in the draft must come from a line in the pro’s own price list; if no line matches, there is no price. Nothing is sent without the pro’s approval.',
      },
      usp: {
        he: 'המודל לא קובע מחירים. הוא מתאים בין תיאור הלקוח לשורות במחירון שבעל המקצוע כתב, ומה שלא מתאים יוצא כהצעת ביקור. כך אין הפתעות בהצעות שיוצאות בשם העסק.',
        en: 'The model never sets prices. It matches the customer’s description to lines in the price list the pro wrote, and whatever does not match becomes a visit proposal. So there are no surprises in quotes sent in the business’s name.',
      },
      targetUsers: {
        he: ['בעלי מקצוע עצמאיים בתחום התיקונים והשירות לבית', 'עסקים קטנים של שניים עד חמישה אנשים', 'בני משפחה שמנהלים את הטלפון של העסק'],
        en: ['Self-employed repair and home-service professionals', 'Small businesses of two to five people', 'Family members who run the business phone'],
      },
      coreFeatures: {
        he: [
          'מספר ייעודי עם העברת שיחה שלא נענתה והודעת פתיחה על תמלול ההודעה',
          'תמלול וסיכום בעברית, כולל מונחים מקצועיים',
          'חילוץ: סוג תקלה, כתובת, דחיפות ומספר חוזר',
          'מחירון: שורות עבודה, מילות מפתח, טווח מחיר ודמי ביקור',
          'טיוטת תשובה שנבנית רק משורות המחירון',
          'התראת דחיפה עם תקציר בשורה אחת',
          'אישור בלחיצה ופתיחת וואטסאפ עם הודעה מוכנה',
          'יומן פניות עם סטטוס: חדש, נענה, נקבע',
        ],
        en: [
          'A dedicated number with unanswered-call forwarding and an opening notice about transcription',
          'Hebrew transcription and summary, including trade terms',
          'Extraction: fault type, address, urgency and callback number',
          'Price list: job lines, keywords, price range and call-out fee',
          'A draft reply built only from price-list lines',
          'Push notification with a one-line summary',
          'One-tap approval that opens WhatsApp with a ready message',
          'A lead log with status: new, answered, booked',
        ],
      },
      screens: [
        { name: { he: 'תיבת פניות', en: 'Inbox' }, description: { he: 'רשימת פניות לפי דחיפות, עם שורת תקציר, זמן ומספר מתקשר.', en: 'Leads by urgency, each with a summary line, time and caller number.' } },
        { name: { he: 'כרטיס פנייה', en: 'Lead card' }, description: { he: 'ההקלטה, התמלול, השדות שחולצו וההתאמה לשורת מחירון.', en: 'The recording, transcript, extracted fields and the matched price-list line.' } },
        { name: { he: 'טיוטת תשובה', en: 'Reply draft' }, description: { he: 'ההודעה המוצעת עם סימון השורות שמהן נלקח המחיר, עריכה וכפתור שליחה בוואטסאפ.', en: 'The proposed message with the source lines for the price marked, editing and a send-in-WhatsApp button.' } },
        { name: { he: 'מחירון', en: 'Price list' }, description: { he: 'עריכת שורות עבודה, מילות מפתח, טווחי מחיר ודמי ביקור.', en: 'Edit job lines, keywords, price ranges and call-out fees.' } },
        { name: { he: 'המספר והברכה', en: 'Number and greeting' }, description: { he: 'המספר הייעודי, הקלטת ברכת הפתיחה ושעות העברה.', en: 'The dedicated number, the opening greeting recording and forwarding hours.' } },
        { name: { he: 'חשבון', en: 'Account' }, description: { he: 'מצב המנוי, מכסת הודעות ופתיחת דף החיוב באתר.', en: 'Subscription status, message quota and a link to the billing page on the web.' } },
      ],
      userJourney: {
        he: [
          'בעל המקצוע מגדיר מחירון ומפעיל העברת שיחות למספר הייעודי',
          'לקוח מתקשר בזמן שבעל המקצוע בעבודה ומשאיר הודעה על ברז שמטפטף',
          'מגיעה התראה: "ברז מטפטף, רמת גן, לא דחוף"',
          'בעל המקצוע פותח את הטיוטה, רואה שהמחיר מגיע משורה "החלפת ברז", ומאשר',
          'וואטסאפ נפתח עם הודעה מוכנה, והוא לוחץ שליחה בעצמו',
        ],
        en: [
          'The pro sets up a price list and turns on forwarding to the dedicated number',
          'A customer calls while the pro is working and leaves a message about a dripping tap',
          'A notification arrives: "Dripping tap, Ramat Gan, not urgent"',
          'The pro opens the draft, sees the price comes from the "replace tap" line, and approves',
          'WhatsApp opens with a ready message and the pro taps send themselves',
        ],
      },
      uxDirection: {
        he: 'מעשי וגדול: כפתורים שאפשר ללחוץ עם כפפות, ניגודיות גבוהה לשימוש בשמש, ומעט טקסט. הדחיפות מסומנת בצבע וצורה ולא רק בצבע. מסך הטיוטה מדגיש מאיפה הגיע המחיר, כדי שבעל המקצוע יסמוך על ההודעה לפני שהוא שולח.',
        en: 'Practical and big: buttons usable with gloves, high contrast for sunlight, and little text. Urgency is shown by colour and shape, not colour alone. The draft screen highlights where the price came from so the pro can trust the message before sending.',
      },
      architecture: {
        he: 'אפליקציית Expo לבעל המקצוע. ספק טלפוניה כמו Twilio מחזיק את המספר, משמיע ברכה ומקליט הודעה. Webhook ב-Supabase Edge Function מוריד את ההקלטה, שולח לתמלול ולמודל שפה עם סכמת JSON, ומשווה למחירון בטבלת Postgres. התוצאה נשמרת ו-Expo Push שולח התראה. ההודעה ללקוח נפתחת במכשיר של בעל המקצוע בקישור wa.me עם טקסט מוכן, כך שאין צורך ב-WhatsApp Business API בגרסה הראשונה. החיוב דרך Stripe באתר.',
        en: 'An Expo app for the pro. A telephony provider such as Twilio holds the number, plays a greeting and records the message. A webhook in a Supabase Edge Function downloads the recording, sends it to transcription and a language model with a JSON schema, and matches against the price list in a Postgres table. The result is saved and Expo Push sends a notification. The customer message opens on the pro’s own device through a wa.me link with prefilled text, so the first version needs no WhatsApp Business API. Billing runs through Stripe on the web.',
      },
      stack: ['Expo', 'Expo Router', 'Supabase', 'Supabase Edge Functions', 'Twilio Voice', 'Speech-to-text API', 'Anthropic or OpenAI API', 'Expo Push Notifications', 'Stripe'],
      database: {
        he: ['businesses – עסק, תחום, מספר ייעודי וברכה', 'price_items – שורת מחירון: תיאור, מילות מפתח, טווח מחיר ודמי ביקור', 'calls – הקלטה, תמלול, מספר מתקשר וזמן', 'extractions – סוג תקלה, כתובת, דחיפות והתאמה לשורת מחירון', 'reply_drafts – טיוטה, שורות מקור וסטטוס', 'push_tokens – מכשירים להתראות'],
        en: ['businesses – business, trade, dedicated number and greeting', 'price_items – price-list line: description, keywords, price range and call-out fee', 'calls – recording, transcript, caller number and time', 'extractions – fault type, address, urgency and price-line match', 'reply_drafts – draft, source lines and status', 'push_tokens – devices for notifications'],
      },
      auth: {
        he: 'כניסה באימייל עם קוד חד-פעמי, בלי SMS כדי לחסוך עלות. כל עסק רואה רק את הפניות שלו (RLS לפי business_id). ההקלטות נשמרות בתיקייה פרטית ונמחקות אחרי תקופה שבעל המקצוע קובע.',
        en: 'Email one-time-code sign-in, no SMS to save cost. Each business sees only its own leads (RLS by business_id). Recordings are stored in a private bucket and deleted after a period the pro sets.',
      },
      monetization: {
        he: ['מנוי חודשי לבעל מקצוע דרך Stripe, כולל מספר ייעודי ומכסת הודעות', 'חבילת הודעות נוספת לעונות עומס', 'תוכנית משרדית לכמה עובדים בעסק אחד'],
        en: ['Monthly subscription per pro through Stripe, including a dedicated number and message quota', 'An extra message pack for busy seasons', 'An office plan for several staff in one business'],
      },
      mvpMilestones: {
        he: ['מספר ייעודי, העברת שיחה והקלטה ל-Supabase', 'תמלול וחילוץ מובנה על הקלטות לדוגמה', 'מחירון והתאמה בלי המצאת מחירים', 'אפליקציית Expo עם Expo Push ותיבת פניות', 'כפתור וואטסאפ עם טיוטה', 'מנוי ב-Stripe'],
        en: ['Dedicated number, call forwarding and recording into Supabase', 'Transcription and structured extraction on sample recordings', 'Price list and matching without invented prices', 'Expo app with Expo Push and a lead inbox', 'WhatsApp button with a draft', 'Stripe subscription'],
      },
      risks: {
        he: ['הקלטת הודעות כפופה לדין ולהסכמות – ברכת פתיחה מפורשת וייעוץ משפטי לפני השקה', 'זמינות, עלות ותקנות של מספרים ישראליים אצל ספקי טלפוניה דורשות בדיקה מוקדמת', 'תמלול עם רעש רקע ומונחים מקצועיים עלול לטעות – להציג תמיד גם את ההקלטה', 'כללי חנויות האפליקציות לגבי חיוב מחוץ לאפליקציה – לבדוק לפני הגשה'],
        en: ['Recording messages is subject to law and consent – an explicit opening greeting and legal advice before launch', 'Availability, cost and regulation of Israeli numbers at telephony providers need early checking', 'Transcription with background noise and trade terms can be wrong – always show the recording too', 'App-store rules on billing outside the app – check before submission'],
      },
      expansion: {
        he: ['שליחה ישירה דרך WhatsApp Business API אחרי אישור תבניות', 'סנכרון ליומן Google לקביעת ביקור', 'דוח חודשי: פניות שנענו מול פניות שהוחמצו'],
        en: ['Direct sending through the WhatsApp Business API after template approval', 'Google Calendar sync for booking a visit', 'A monthly report: leads answered versus missed'],
      },
    },
  },
  {
    id: 'loreledger',
    name: { he: 'Loreledger – ספר העלילה', en: 'Loreledger' },
    tagline: {
      he: 'מנחי משחקי תפקידים מדביקים סיכום מפגש, והספר מסמן סתירות מול מה שכבר נקבע בקמפיין ועונה על שאלות עם מקור.',
      en: 'Game masters paste a session recap; the ledger flags clashes with established canon and answers questions with sources.',
    },
    category: 'ai',
    secondaryCategories: ['games', 'creativity'],
    difficulty: 'intermediate',
    effort: { weeksMin: 6, weeksMax: 9 },
    budget: 'low',
    businessModel: 'subscription',
    platforms: ['cross-platform'],
    audience: ['gamers', 'creators'],
    tags: ['tabletop rpg', 'game master', 'campaign notes', 'continuity', 'embeddings', 'contradiction detection', 'worldbuilding', 'recap'],
    identity: { hue: 285, glyph: 'Lr', pattern: 'grid' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Loreledger הוא ספר עלילה חי למנחי קמפיינים של משחקי תפקידים. אחרי כל מפגש המנחה מדביק או מקליד סיכום, והמודל מפרק אותו לעובדות קטנות: מי, איפה, מה קרה ובאיזה מפגש. כל עובדה חדשה נבדקת מול עובדות קיימות על אותה דמות או אותו מקום, ואם יש סתירה – למשל פונדקאית שמתה במפגש 2 ומופיעה בחיים במפגש 5 – היא מסומנת. המנחה מחליט אם זה ריטקון, תפנית עלילתית או טעות. אפשר גם לשאול "מי הכיר את הנסיך?" ולקבל תשובה עם הפניה למפגשים.',
        en: 'Loreledger is a living campaign ledger for tabletop role-playing game masters. After each session the GM pastes or types a recap and the model breaks it into small facts: who, where, what happened and in which session. Each new fact is checked against existing facts about the same character or place, and a contradiction – say an innkeeper who died in session 2 and appears alive in session 5 – gets flagged. The GM decides whether it is a retcon, a plot twist or a mistake. You can also ask "who knew the prince?" and get an answer referencing the sessions.',
      },
      problem: {
        he: 'קמפיין נמשך חודשים, והמנחה זוכר פחות ממה שהוא כתב. שמות, הבטחות ופרטי עולם מתפזרים בין מחברות וקבצים, וסתירות מתגלות באמצע מפגש, מול שחקנים שזוכרים בדיוק מה נאמר.',
        en: 'A campaign runs for months and the GM remembers less than they wrote. Names, promises and world details scatter across notebooks and files, and contradictions surface mid-session, in front of players who remember exactly what was said.',
      },
      solution: {
        he: 'ספר עובדות מובנה שנבנה מהסיכומים. כל עובדה שמורה עם ישות, סטטוס, מספר מפגש והמשפט המקורי. סתירות נתפסות בשלב ההכנסה ולא באמצע המשחק. לכל עובדה אפשר לסמן אם השחקנים יודעים אותה, וכך נוצר סיכום קריא לשחקנים בלי סודות.',
        en: 'A structured fact ledger built from the recaps. Each fact is stored with an entity, status, session number and the source sentence. Contradictions are caught at entry, not mid-game. Each fact can be marked as known or unknown to the players, producing a readable player recap without secrets.',
      },
      usp: {
        he: 'גילוי סתירות בין עובדות שנשמרו כבר בזמן ההוספה, ותשובות שמצטטות את המפגש והמשפט שמהם נלקחו, במקום סיכום חופשי שאי אפשר לבדוק.',
        en: 'Contradictions between stored facts are detected at the moment of adding, and answers quote the session and sentence they came from, instead of a free-form summary that cannot be checked.',
      },
      targetUsers: {
        he: ['מנחים של קמפיינים ארוכים במשחקי תפקידים שולחניים', 'סופרים שבונים עולם דמיוני ועלילה מורכבת', 'קבוצות משחק שרוצות סיכומים עקביים'],
        en: ['Game masters running long tabletop campaigns', 'Authors building an imaginary world and a complex plot', 'Play groups that want consistent recaps'],
      },
      coreFeatures: {
        he: [
          'הדבקה או הכתבה של סיכום מפגש',
          'פירוק אוטומטי לעובדות עם ישות, סטטוס ומקור',
          'זיהוי סתירות מול עובדות קיימות ופתרון: ריטקון, תפנית או טעות',
          'שאלות בשפה חופשית עם תשובה מצוטטת',
          'שכבות ידיעה: "השחקנים יודעים" מול "רק המנחה"',
          'סיכום לשחקנים מהעובדות הגלויות בלבד, בקישור לקריאה בלבד',
        ],
        en: [
          'Paste or dictate a session recap',
          'Automatic breakdown into facts with entity, status and source',
          'Contradiction detection against existing facts and resolution: retcon, twist or mistake',
          'Free-form questions with a cited answer',
          'Knowledge layers: "players know" versus "GM only"',
          'A player recap from visible facts only, in a read-only link',
        ],
      },
      screens: [
        { name: { he: 'קמפיין', en: 'Campaign' }, description: { he: 'רשימת מפגשים, ישויות מרכזיות וכפתור להוספת סיכום חדש.', en: 'Sessions list, key entities and a button to add a new recap.' } },
        { name: { he: 'ייבוא סיכום', en: 'Recap import' }, description: { he: 'שדה הדבקה או הכתבה עם בחירת מספר המפגש והמשך לעיבוד.', en: 'A paste or dictation field with a session number and a continue-to-process step.' } },
        { name: { he: 'בדיקת עובדות', en: 'Fact review' }, description: { he: 'העובדות שחולצו, כל אחת עם המשפט המקורי, אפשרות לערוך ולסמן אם השחקנים יודעים.', en: 'Extracted facts, each with its source sentence, with editing and a players-know toggle.' } },
        { name: { he: 'סתירות', en: 'Contradictions' }, description: { he: 'זוגות עובדות שמתנגשות זו בזו, עם כפתורי ריטקון, תפנית עלילתית וטעות.', en: 'Pairs of clashing facts with retcon, plot twist and mistake buttons.' } },
        { name: { he: 'שאל את הספר', en: 'Ask the ledger' }, description: { he: 'שאלה חופשית, תשובה קצרה והפניות למפגשים ולמשפטים שמהם נלקחה.', en: 'A free question, a short answer and references to the sessions and sentences it came from.' } },
        { name: { he: 'סיכום לשחקנים', en: 'Player recap' }, description: { he: 'תצוגה מקדימה של הסיכום הגלוי ויצירה וביטול של קישור קריאה בלבד.', en: 'A preview of the visible recap and creating or revoking a read-only link.' } },
      ],
      userJourney: {
        he: [
          'המנחה מסיים מפגש ומדביק סיכום של עמוד',
          'האפליקציה מחלצת 14 עובדות והוא מסמן שלוש מהן כסודיות',
          'מופיעה סתירה: הפונדקאית מתה במפגש 2 וכעת מתוארת בחיים',
          'הוא מסמן "תפנית עלילתית" ורושם שהיא התחזתה',
          'לפני המפגש הבא הוא שולח לשחקנים קישור לסיכום הגלוי',
        ],
        en: [
          'The GM finishes a session and pastes a one-page recap',
          'The app extracts 14 facts and he marks three as secret',
          'A contradiction appears: the innkeeper died in session 2 and is now described as alive',
          'He marks it "plot twist" and notes she was impersonating someone',
          'Before the next session he sends the players a link to the visible recap',
        ],
      },
      uxDirection: {
        he: 'ספר עתיק במראה אך מודרני בשימוש: טיפוגרפיה עם סריף לכותרות, רקע חמים וכרטיסים קומפקטיים. סתירות מסומנות בצבע בולט אך לא מאיים, כי הן חלק מהכיף. מותאם לטאבלט ליד שולחן המשחק ולמסך גדול בהכנה.',
        en: 'An old-book look with modern usability: serif headings, a warm background and compact cards. Contradictions use a striking but not alarming colour, since they are part of the fun. Tuned for a tablet at the game table and a large screen during prep.',
      },
      architecture: {
        he: 'Expo עם תמיכה ב-web, ו-Supabase. Edge Function מקבלת סיכום ומחזירה עובדות בסכמה קבועה. כל עובדה מקבלת embedding ונשמרת עם pgvector. עובדה חדשה מושווית לעובדות דומות של אותה ישות, ומודל שפה מכריע אם יש סתירה ומחזיר את שני הצדדים. שאלות נענות רק מעובדות שנשלפו, עם מזהי מפגש. קישור הסיכום לשחקנים הוא טוקן אקראי לקריאה בלבד. RevenueCat מנהל את המנוי.',
        en: 'Expo with web support, and Supabase. An Edge Function takes a recap and returns facts in a fixed schema. Each fact gets an embedding and is stored with pgvector. A new fact is compared with similar facts about the same entity, and a language model decides whether they conflict and returns both sides. Questions are answered only from retrieved facts, with session ids. The player recap link is a random read-only token. RevenueCat manages the subscription.',
      },
      stack: ['Expo', 'Expo Router', 'Supabase', 'pgvector', 'Supabase Edge Functions', 'Anthropic or OpenAI API', 'RevenueCat'],
      database: {
        he: ['campaigns – קמפיין והגדרות', 'sessions – סיכום גולמי ומספר מפגש', 'entities – דמויות, מקומות וחפצים', 'facts – ניסוח, ישות, סטטוס, מפגש, ציטוט, גלוי לשחקנים ו-embedding', 'conflicts – זוג עובדות והחלטת המנחה', 'share_links – טוקן ותוקף'],
        en: ['campaigns – campaign and settings', 'sessions – raw recap and session number', 'entities – characters, places and items', 'facts – wording, entity, status, session, quote, visible to players and embedding', 'conflicts – a pair of facts and the GM’s decision', 'share_links – token and expiry'],
      },
      auth: {
        he: 'אימייל וכניסה עם Apple או Google למנחה בלבד. לשחקנים אין חשבונות: הם רואים סיכום בקישור קריאה בלבד עם טוקן אקראי שאפשר לבטל, בלי צ׳אט ובלי פרטים אישיים.',
        en: 'Email and Apple or Google sign-in for the GM only. Players have no accounts: they see a recap through a read-only link with a random revocable token, with no chat and no personal details.',
      },
      monetization: {
        he: ['קמפיין אחד ושלושה מפגשים בחינם', 'מנוי חודשי או שנתי דרך RevenueCat לקמפיינים ללא הגבלה ושאילת הספר'],
        en: ['One campaign and three sessions free', 'Monthly or annual subscription through RevenueCat for unlimited campaigns and asking the ledger'],
      },
      mvpMilestones: {
        he: ['ייבוא סיכום ופירוק לעובדות עם מקור', 'ספר עובדות ועריכה ידנית', 'embeddings וגילוי סתירות על קמפיין לדוגמה', 'שאלות עם תשובה מצוטטת', 'קישור לשחקנים ושכבות ידיעה', 'RevenueCat: שער חינם ומנוי'],
        en: ['Recap import and breakdown into facts with sources', 'Fact ledger and manual editing', 'Embeddings and contradiction detection on a sample campaign', 'Questions with a cited answer', 'Player link and knowledge layers', 'RevenueCat: free gate and subscription'],
      },
      risks: {
        he: ['סתירות שווא, כשהמודל מזהה סתירה שאינה כזו – תמיד המנחה מחליט, והמערכת מציגה את שני המשפטים', 'עלות עיבוד של קמפיינים ארוכים – לעבד רק סיכומים חדשים ולשלוף מעט עובדות', 'שחקנים עשויים להיות קטינים – קישורי קריאה בלבד, בלי הזנת תוכן ובלי צ׳אט'],
        en: ['False contradictions when the model sees a conflict that is not one – the GM always decides and both sentences are shown', 'Processing cost for long campaigns – process only new recaps and retrieve few facts', 'Players may be minors – read-only links, no content entry and no chat'],
      },
      expansion: {
        he: ['ייבוא מאפליקציות הערות ומקובצי Markdown', 'מפת קשרים בין דמויות', 'מצב הקלטה שמתמלל את המפגש בהסכמת כל המשתתפים'],
        en: ['Import from note apps and Markdown files', 'A relationship map between characters', 'A recording mode that transcribes the session with every participant’s consent'],
      },
    },
  },
  {
    id: 'cellar',
    name: { he: 'Cellar – המחברת שנשארת אצלך', en: 'Cellar' },
    tagline: {
      he: 'שואלים את ההערות שלכם ומקבלים תשובות ממודל שרץ על הטלפון עצמו – אחרי ההורדה הראשונה אין שרת, אין חשבון ואין ענן.',
      en: 'Ask your own notes questions and get answers from a model running on the phone itself – after the first download, no server, no account, no cloud.',
    },
    category: 'ai',
    secondaryCategories: ['productivity', 'creativity'],
    difficulty: 'advanced',
    effort: { weeksMin: 12, weeksMax: 18 },
    budget: 'low',
    businessModel: 'one-time',
    platforms: ['ios', 'android'],
    audience: ['consumers', 'professionals'],
    tags: ['on-device', 'local llm', 'offline', 'privacy', 'notes', 'embeddings', 'rag', 'sqlite'],
    identity: { hue: 168, glyph: 'Ce', pattern: 'ring' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: true, trending: false, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Cellar היא אפליקציית הערות עם שאלות ותשובות שכולן רצות על המכשיר. המשתמש מייבא קבצי טקסט או Markdown (למשל מ-Obsidian), מודל הטמעה קטן מחשב וקטורים, והם נשמרים ב-SQLite במכשיר. כששואלים "מה החלטתי לגבי הקבלן?", האפליקציה שולפת את הקטעים הרלוונטיים ומודל שפה מקומי כותב תשובה עם הפניה להערות. אחרי הורדת המודל האפליקציה חוסמת את הגישה שלה לרשת, ומסך בדיקה מראה שניסיון חיבור נכשל. המטרה: להשתמש ב-AI על חומר אישי בלי להעביר אותו לצד שלישי.',
        en: 'Cellar is a notes app whose questions and answers all run on the device. The user imports text or Markdown files (for example from Obsidian), a small embedding model computes vectors, and they are stored in SQLite on the device. When asking "what did I decide about the contractor?", the app retrieves the relevant passages and a local language model writes an answer that references the notes. After the model is downloaded the app blocks its own network access, and a check screen shows that a connection attempt fails. The aim: use AI on personal material without handing it to a third party.',
      },
      problem: {
        he: 'הערות אישיות מכילות מידע רגיש: החלטות, יומנים, פרטי לקוחות. כלי AI מבוססי ענן דורשים לשלוח את החומר החוצה, ויש מי שאינם מוכנים לכך. חיפוש מילות מפתח רגיל לא מוצא רעיון שנכתב במילים אחרות.',
        en: 'Personal notes hold sensitive material: decisions, journals, client details. Cloud-based AI tools require sending the material out, and some people are not willing to. Plain keyword search will not find an idea written in different words.',
      },
      solution: {
        he: 'שליפה סמנטית ותשובות על המכשיר: הטמעות מחושבות מקומית, חיפוש וקטורי ב-SQLite, ומודל שפה קטן מקוונטז שרץ בעזרת ספריית הרצה מקומית. הכול עובד במצב טיסה. המודלים מורדים פעם אחת ונשמרים באחסון המכשיר.',
        en: 'On-device semantic retrieval and answers: embeddings computed locally, vector search in SQLite, and a small quantised language model run through a local inference library. Everything works in airplane mode. Models are downloaded once and kept in device storage.',
      },
      usp: {
        he: 'לא "פרטיות" כהבטחה בתנאי השימוש אלא כארכיטקטורה: אין שרת שמקבל את ההערות, אין חשבון, ויש מסך בדיקה שמראה שהאפליקציה לא מצליחה לצאת לרשת אחרי ההורדה.',
        en: 'Not "privacy" as a promise in the terms of service but as architecture: there is no server receiving the notes, no account, and a check screen shows the app failing to reach the network after the download.',
      },
      targetUsers: {
        he: ['אנשים שמנהלים יומן או מחברת רגישה ורוצים AI בלי ענן', 'יועצים ועצמאים שמחזיקים הערות על לקוחות', 'משתמשי Obsidian ו-Markdown שרוצים חיפוש סמנטי בטלפון'],
        en: ['People who keep a sensitive journal or notebook and want AI without a cloud', 'Consultants and freelancers who hold notes on clients', 'Obsidian and Markdown users who want semantic search on a phone'],
      },
      coreFeatures: {
        he: [
          'ייבוא קבצי טקסט ו-Markdown מהמכשיר',
          'חיפוש סמנטי על המכשיר, גם כשהמילים שונות',
          'שאלות ותשובות עם הפניה להערות המקור',
          'סיכום שבועי שנוצר מקומית מההערות החדשות',
          'מנהל מודלים: הורדה, מחיקה ובחירת גודל לפי המכשיר',
          'נעילת רשת ומסך בדיקה של ניסיון חיבור',
          'נעילה ביומטרית לפתיחת האפליקציה',
        ],
        en: [
          'Import text and Markdown files from the device',
          'On-device semantic search, even when the words differ',
          'Questions and answers referencing the source notes',
          'A weekly digest generated locally from new notes',
          'Model manager: download, delete and pick a size for the device',
          'Network lock and a check screen testing a connection attempt',
          'Biometric lock to open the app',
        ],
      },
      screens: [
        { name: { he: 'ספרייה', en: 'Library' }, description: { he: 'קבצי ההערות המיובאים, מצב ההטמעה לכל קובץ וחיפוש מהיר.', en: 'Imported note files, embedding status per file and quick search.' } },
        { name: { he: 'שאלה', en: 'Ask' }, description: { he: 'שדה שאלה, תשובה שמוצגת בהדרגה והצעות לשאלות המשך מההערות.', en: 'A question field, an answer that streams in and follow-up suggestions from the notes.' } },
        { name: { he: 'מקורות התשובה', en: 'Answer sources' }, description: { he: 'הקטעים שנשלפו, עם קישור לפתיחת ההערה במקום המדויק.', en: 'The retrieved passages, with a link to open the note at the exact spot.' } },
        { name: { he: 'מנהל מודלים', en: 'Model manager' }, description: { he: 'מודלים מותקנים, גודל, שימוש בזיכרון והורדה ב-Wi-Fi בלבד.', en: 'Installed models, size, memory use and Wi-Fi-only download.' } },
        { name: { he: 'בדיקת פרטיות', en: 'Privacy check' }, description: { he: 'כפתור שמנסה לפתוח חיבור רשת ומציג את התוצאה, והסבר על מה הבדיקה מוכיחה ומה לא.', en: 'A button that attempts a network connection and shows the result, plus an explanation of what the check shows and what it does not.' } },
        { name: { he: 'ייבוא', en: 'Import' }, description: { he: 'בחירת תיקייה או קבצים, התקדמות חיתוך והטמעה וסיכום מה יובא.', en: 'Pick a folder or files, chunking and embedding progress and a summary of what was imported.' } },
      ],
      userJourney: {
        he: [
          'המשתמש מוריד את האפליקציה ובוחר מודל בגודל מתאים לטלפון',
          'מייבא תיקיית הערות Markdown והאפליקציה מחשבת הטמעות',
          'מפעיל נעילת רשת ומריץ את בדיקת הפרטיות',
          'שואל "מה סיכמנו עם הלקוח בפברואר?" ומקבל תשובה עם שלוש הפניות',
          'פותח את ההערה המקורית ישירות מהמקור',
        ],
        en: [
          'The user downloads the app and picks a model size suited to the phone',
          'Imports a Markdown notes folder and the app computes embeddings',
          'Turns on the network lock and runs the privacy check',
          'Asks "what did we agree with the client in February?" and gets an answer with three references',
          'Opens the original note straight from the source',
        ],
      },
      uxDirection: {
        he: 'ספרייה שקטה בצבעי אדמה ולא "מעבדת AI": אין דמות רובוט ואין אנימציות מבריקות. התשובה מוצגת כפסקה רגילה עם הפניות בצד. מצב הרשת מוצג תמיד כסמל קטן בראש המסך. מסכי הורדה מסבירים בכנות את גודל המודל והשפעתו על הסוללה.',
        en: 'A quiet library in earthy colours, not an "AI lab": no robot character and no shiny animations. The answer is shown as an ordinary paragraph with references to the side. Network state is always a small icon at the top of the screen. Download screens explain honestly the model size and its effect on the battery.',
      },
      architecture: {
        he: 'Expo עם development build (לא Expo Go) כי נדרשים מודולים נטיביים. ספריית הרצה מקומית כמו llama.rn או react-native-executorch מריצה מודל שפה קטן מקוונטז ומודל הטמעה. ההערות נחתכות לקטעים ונשמרות ב-SQLite עם הווקטורים; החיפוש הוא דמיון קוסינוס על קטעים מסוננים, בגודל שמיועד לאוסף אישי של אלפי הערות. המודלים מורדים פעם אחת לאחסון המכשיר. רכישה חד-פעמית דרך RevenueCat.',
        en: 'Expo with a development build (not Expo Go) since native modules are required. A local inference library such as llama.rn or react-native-executorch runs a small quantised language model and an embedding model. Notes are chunked and stored in SQLite with their vectors; search is cosine similarity over filtered chunks, sized for a personal collection of thousands of notes. Models are downloaded once into device storage. A one-time purchase through RevenueCat.',
      },
      stack: ['Expo', 'Expo Dev Client', 'llama.rn or react-native-executorch', 'SQLite', 'Local embedding model', 'expo-local-authentication', 'RevenueCat'],
      database: {
        he: ['notes_files – קובץ מקור, נתיב ותאריך עדכון (SQLite במכשיר)', 'chunks – קטע טקסט ומיקום בקובץ', 'embeddings – וקטור לכל קטע', 'chats – שאלות ותשובות שמורות מקומית', 'models – מודלים שהורדו, גודל וגרסה', 'settings – נעילת רשת, נעילה ביומטרית והעדפות'],
        en: ['notes_files – source file, path and modified date (on-device SQLite)', 'chunks – text chunk and position in the file', 'embeddings – a vector per chunk', 'chats – questions and answers saved locally', 'models – downloaded models, size and version', 'settings – network lock, biometric lock and preferences'],
      },
      auth: {
        he: 'אין חשבון ואין שרת. ההגנה היא במכשיר בלבד: נעילה ביומטרית דרך expo-local-authentication. הרכישה מאומתת על ידי החנות דרך RevenueCat ואינה קשורה לזהות המשתמש.',
        en: 'No account and no server. Protection is on the device only: biometric lock via expo-local-authentication. The purchase is verified by the store through RevenueCat and is not tied to a user identity.',
      },
      monetization: {
        he: ['הורדה חינם עם ספרייה קטנה ומספר שאלות ליום', 'רכישה חד-פעמית בתוך האפליקציה (RevenueCat) לספרייה ללא הגבלה', 'בלי מנוי, כי אין עלות שרת חוזרת'],
        en: ['Free download with a small library and a few questions a day', 'A one-time in-app purchase (RevenueCat) for an unlimited library', 'No subscription, since there is no recurring server cost'],
      },
      mvpMilestones: {
        he: ['Dev build עם הרצת מודל שפה קטן ותשובה ראשונה בטלפון בדיקה', 'ייבוא קבצים, חיתוך והטמעות ב-SQLite', 'שליפה סמנטית ותשובות עם הפניה להערות', 'מנהל מודלים: הורדה, מחיקה ובחירת גודל', 'נעילה ביומטרית ומסך בדיקת רשת', 'רכישה חד-פעמית עם RevenueCat ובדיקות על מכשירים חלשים'],
        en: ['Dev build running a small language model with a first answer on a test phone', 'File import, chunking and embeddings in SQLite', 'Semantic retrieval and answers with references to notes', 'Model manager: download, delete and size choice', 'Biometric lock and a network check screen', 'One-time purchase with RevenueCat and tests on weak devices'],
      },
      risks: {
        he: ['איכות בעברית של מודלים קטנים מוגבלת – להתחיל באנגלית ולסמן עברית כניסיונית', 'זיכרון וחום במכשירים ישנים – להציע כמה גדלי מודל ולבדוק על מכשירים חלשים', 'הורדה גדולה – הורדה ב-Wi-Fi בלבד והסבר ברור', 'מסך הבדיקה מציג נעילה ברמת האפליקציה ולא הבטחה ברמת מערכת ההפעלה – לנסח בזהירות'],
        en: ['Small models are limited in Hebrew – start with English and label Hebrew experimental', 'Memory and heat on older devices – offer several model sizes and test on weak devices', 'Large download – Wi-Fi-only download and a clear explanation', 'The check screen shows an app-level lock, not an OS-level guarantee – word it carefully'],
      },
      expansion: {
        he: ['הכתבה קולית מקומית עם מודל תמלול קטן', 'ייבוא מתיקיית Obsidian שלמה עם סנכרון קבצים', 'גרסת שולחן עבודה שקוראת את אותם קבצים'],
        en: ['Local voice dictation with a small transcription model', 'Import from a whole Obsidian folder with file sync', 'A desktop version that reads the same files'],
      },
    },
  },
  {
    id: 'plumbline',
    name: { he: 'Plumbline – בדיקת רגרסיה לפרומפטים', en: 'Plumbline' },
    tagline: {
      he: 'השופט האוטומטי נבדק קודם מול התיוגים שלכם. רק כשהוא מסכים עם בני אדם הוא מורשה לבדוק את כל הסט ולחסום שינוי פרומפט בעייתי.',
      en: 'The automated judge is first tested against your own labels. Only when it agrees with humans may it score the full set and block a bad prompt change.',
    },
    category: 'ai',
    secondaryCategories: ['devtools', 'business'],
    difficulty: 'advanced',
    effort: { weeksMin: 10, weeksMax: 14 },
    budget: 'medium',
    businessModel: 'b2b',
    platforms: ['web'],
    audience: ['developers', 'teams'],
    tags: ['llm evaluation', 'prompt testing', 'regression', 'llm judge', 'calibration', 'ci', 'github', 'quality'],
    identity: { hue: 248, glyph: 'Pl', pattern: 'grid' },
    flags: { beginnerFriendly: false, profitPotential: 'high', experimental: false, trending: false, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Plumbline היא פלטפורמה לבדיקת שינויים בפרומפטים ובמודלים בצוותים שמפתחים מוצרי AI. הצוות מעלה סט מקרים אמיתיים, מריץ שתי גרסאות של פרומפט ומתייג בעצמו זוגות תשובות במסך השוואה עיוורת. רק אחרי כן מופעל שופט מבוסס מודל לפי קריטריונים שנכתבו בשפה פשוטה, והמערכת מודדת כמה הוא מסכים עם התיוגים האנושיים על חלק שהוחזק בצד. אם ההסכמה מתחת לסף שהצוות קבע, השופט אינו מורשה לחסום שינויים. מעל הסף הוא רץ על כל הסט ומדווח רגרסיות כהערה בבקשת משיכה ב-GitHub.',
        en: 'Plumbline is a platform for testing prompt and model changes in teams that build AI products. The team uploads a set of real cases, runs two prompt versions and labels answer pairs themselves in a blind side-by-side view. Only then is a model-based judge activated, following criteria written in plain language, and the system measures how well it agrees with the human labels on a held-out portion. If agreement is below the threshold the team set, the judge may not block changes. Above it, it runs on the whole set and reports regressions as a comment on a GitHub pull request.',
      },
      problem: {
        he: 'צוותים משנים פרומפטים לפי תחושה ובודקים כמה דוגמאות ידנית. כשמוסיפים שופט אוטומטי, לא תמיד יודעים עד כמה אפשר לסמוך עליו, והשופט עצמו עלול להעדיף תשובות ארוכות או סגנון מסוים. כך רגרסיה עוברת בשקט או שינוי טוב נחסם בטעות.',
        en: 'Teams change prompts by feel and check a few examples by hand. When an automated judge is added, they do not always know how far to trust it, and the judge itself may prefer longer answers or a certain style. So a regression slips through quietly or a good change is blocked by mistake.',
      },
      solution: {
        he: 'תהליך כיול לפני אמון: מתייגים, כותבים קריטריונים, מודדים הסכמה בין השופט לבני אדם על מקרים שלא נראו בכתיבת הקריטריונים, ומשפרים עד שמגיעים לסף. רק אז השופט פעיל ב-CI. כל החלטה מוצגת יחד עם המקרים שבהם השופט ובני האדם חלוקים.',
        en: 'A calibrate-before-trust process: label, write criteria, measure agreement between the judge and humans on cases not seen while writing the criteria, and improve until the threshold is reached. Only then is the judge active in CI. Every decision is shown together with the cases where the judge and humans disagree.',
      },
      usp: {
        he: 'האמון בשופט הוא מדד שנמדד ולא הנחה: הצוות רואה אחוז הסכמה, טבלת אי-הסכמות, ומערכת שמסרבת לחסום שינויים כל עוד הכיול נמוך מהסף.',
        en: 'Trust in the judge is a measured quantity, not an assumption: the team sees an agreement rate, a disagreement table, and a system that refuses to block changes while calibration is below the threshold.',
      },
      targetUsers: {
        he: ['צוותי מוצר שמפתחים תכונות מבוססות מודלי שפה', 'מפתחים עצמאיים שמתחזקים פרומפטים בייצור', 'אנשי מוצר ותוכן שמתייגים תשובות בלי לגעת בקוד'],
        en: ['Product teams building language-model features', 'Independent developers maintaining prompts in production', 'Product and content people who label answers without touching code'],
      },
      coreFeatures: {
        he: [
          'העלאת סט מקרים (CSV או JSON) וגרסאות פרומפט',
          'הרצה מקבילה של גרסאות מול מודלים לבחירה',
          'תיוג בהשוואה עיוורת עם קיצורי מקלדת',
          'קריטריונים בשפה פשוטה ושופט מבוסס מודל',
          'כיול: הסכמה על קבוצת החזקה וטבלת אי-הסכמות',
          'סף אמון שהצוות מגדיר, ומתחתיו השופט אינו חוסם',
          'GitHub Action שמריצה את הסט ומגיבה בבקשת משיכה',
          'תקרת עלות לכל הרצה',
        ],
        en: [
          'Upload a case set (CSV or JSON) and prompt versions',
          'Run versions in parallel against chosen models',
          'Blind side-by-side labelling with keyboard shortcuts',
          'Plain-language criteria and a model-based judge',
          'Calibration: agreement on a held-out group and a disagreement table',
          'A trust threshold set by the team; below it the judge does not block',
          'A GitHub Action that runs the set and comments on the pull request',
          'A cost cap per run',
        ],
      },
      screens: [
        { name: { he: 'פרויקטים', en: 'Projects' }, description: { he: 'רשימת פרויקטים בצוות עם מצב הכיול והרצה אחרונה לכל אחד.', en: 'The team’s projects with calibration state and the latest run for each.' } },
        { name: { he: 'סט מקרים', en: 'Case set' }, description: { he: 'טבלת המקרים, יבוא קבצים, וסימון קבוצת החזקה שלא תשמש לכתיבת הקריטריונים.', en: 'The case table, file import, and marking the held-out group that is not used when writing criteria.' } },
        { name: { he: 'תיוג', en: 'Labelling' }, description: { he: 'שתי תשובות זו לצד זו בלי לדעת איזו גרסה, ובחירה ב-A, ב-B או בתיקו.', en: 'Two answers side by side without knowing which version, and a choice of A, B or tie.' } },
        { name: { he: 'כיול השופט', en: 'Judge calibration' }, description: { he: 'הקריטריונים, אחוז הסכמה, גודל המדגם וטבלת המקרים שבהם השופט וצוות חלוקים.', en: 'The criteria, agreement rate, sample size and the table of cases where judge and team disagree.' } },
        { name: { he: 'דוח הרצה', en: 'Run report' }, description: { he: 'רגרסיות ושיפורים לפי מקרה, עלות ההרצה וקישור לבקשת המשיכה.', en: 'Regressions and improvements per case, run cost and a link to the pull request.' } },
        { name: { he: 'CI והגדרות', en: 'CI and settings' }, description: { he: 'חיבור ל-GitHub, סף אמון, תקרת עלות ומפתחות הספקים.', en: 'GitHub connection, trust threshold, cost cap and provider keys.' } },
        { name: { he: 'חיוב', en: 'Billing' }, description: { he: 'מנוי ה-workspace, שימוש חודשי וחשבוניות.', en: 'The workspace subscription, monthly usage and invoices.' } },
      ],
      userJourney: {
        he: [
          'צוות מעלה 80 מקרים אמיתיים של תכונת סיכום',
          'שני חברי צוות מתייגים זוגות תשובות בהשוואה עיוורת',
          'כותבים קריטריונים, והמערכת מציגה הסכמה של השופט על קבוצת החזקה',
          'ההסכמה נמוכה מהסף, אז הם מחדדים קריטריון ומריצים שוב',
          'אחרי שעברו את הסף, שינוי פרומפט בבקשת משיכה מקבל הערה עם שלוש רגרסיות',
        ],
        en: [
          'A team uploads 80 real cases for a summarisation feature',
          'Two teammates label answer pairs in blind comparison',
          'They write criteria, and the system shows the judge’s agreement on the held-out group',
          'Agreement is below the threshold, so they sharpen a criterion and run again',
          'Once past the threshold, a prompt change in a pull request gets a comment listing three regressions',
        ],
      },
      uxDirection: {
        he: 'כלי עבודה צפוף וממוקד למפתחים: טבלאות, קיצורי מקלדת ומצב כהה. מסך התיוג מסתיר במכוון את זהות הגרסה. הסכמה מוצגת תמיד עם גודל המדגם, כדי שמספר יחיד לא ייראה בטוח מכפי שהוא. צבעים מציינים סטטוס ולא טוב או רע.',
        en: 'A dense, focused tool for developers: tables, keyboard shortcuts and a dark mode. The labelling screen deliberately hides version identity. Agreement is always shown with the sample size, so a single number does not look more certain than it is. Colour marks status, not good or bad.',
      },
      architecture: {
        he: 'Next.js ו-Supabase. מפתחות הספקים של הצוות נשמרים מוצפנים ברמת ה-workspace ונקראים רק בצד שרת. הרצות נכנסות לתור (Supabase Queues או pg_cron עם Edge Functions) ומתבצעות במנות עם הגבלת קצב ותקרת עלות. התיוגים והשיפוטים נשמרים בטבלאות נפרדות כדי לחשב הסכמה. GitHub Action שולחת בקשת הרצה עם מזהה commit וחוזרת עם תוצאה כהערה. Stripe מנהל מנוי לכל workspace.',
        en: 'Next.js and Supabase. The team’s provider keys are stored encrypted per workspace and read only on the server. Runs enter a queue (Supabase Queues or pg_cron with Edge Functions) and execute in batches with rate limiting and a cost cap. Labels and judgements live in separate tables so agreement can be computed. A GitHub Action sends a run request with a commit id and gets the result back as a comment. Stripe manages a subscription per workspace.',
      },
      stack: ['Next.js', 'TypeScript', 'Supabase', 'Supabase Edge Functions', 'Postgres', 'Stripe', 'GitHub Actions', 'Anthropic or OpenAI API'],
      database: {
        he: ['workspaces – צוות, מנוי ותקרות', 'datasets – סט מקרים וגרסאות', 'cases – מקרה, קלט ופלט מצופה', 'prompt_versions – טקסט פרומפט, מודל ופרמטרים', 'runs – הרצה, גרסה, מודל, סטטוס ועלות', 'outputs – תשובה לכל מקרה בכל הרצה', 'human_labels – תיוג, מתייג, מקרה וזוג תשובות', 'judge_scores – שיפוט מודל לכל זוג', 'calibrations – הסכמה, גודל מדגם וסף', 'ci_checks – הרצות מ-GitHub ותוצאתן'],
        en: ['workspaces – team, subscription and caps', 'datasets – case sets and versions', 'cases – case, input and expected output', 'prompt_versions – prompt text, model and parameters', 'runs – run, version, model, status and cost', 'outputs – an answer per case in each run', 'human_labels – label, labeller, case and answer pair', 'judge_scores – model judgement per pair', 'calibrations – agreement, sample size and threshold', 'ci_checks – runs from GitHub and their result'],
      },
      auth: {
        he: 'התחברות עם GitHub או אימייל, וחברות ב-workspace עם תפקידים (מנהל, מתייג, צופה). RLS לפי workspace_id. מפתחות ספקים מוצפנים ולא נחשפים ללקוח, ומחיקת workspace מוחקת גם את סטי הנתונים.',
        en: 'Sign in with GitHub or email, and workspace membership with roles (admin, labeller, viewer). RLS by workspace_id. Provider keys are encrypted and never exposed to the client, and deleting a workspace also deletes its datasets.',
      },
      monetization: {
        he: ['מנוי חודשי לכל workspace לפי מספר מקרים והרצות, דרך Stripe', 'שכבת צוות עם תפקידים ו-CI ללא הגבלה', 'עלות המודלים עוברת למפתחות הלקוח עצמו, כך שאין סיכון למרווח'],
        en: ['Monthly subscription per workspace by cases and runs, through Stripe', 'A team tier with roles and unlimited CI', 'Model costs go to the customer’s own keys, so there is no margin risk'],
      },
      mvpMilestones: {
        he: ['העלאת סט והרצת שתי גרסאות מול מודל אחד', 'מסך תיוג עיוור וקיצורי מקלדת', 'שופט מבוסס קריטריונים וחישוב הסכמה על קבוצת החזקה', 'תור הרצות, תקרת עלות והצפנת מפתחות', 'GitHub Action והערה בבקשת משיכה', 'Stripe: מנוי ל-workspace'],
        en: ['Upload a set and run two versions against one model', 'Blind labelling screen and keyboard shortcuts', 'Criteria-based judge and agreement on a held-out group', 'Run queue, cost cap and key encryption', 'GitHub Action and a pull-request comment', 'Stripe: workspace subscription'],
      },
      risks: {
        he: ['סטי נתונים של לקוחות עלולים לכלול מידע אישי – מחיקה, הצפנה והנחיה לנקות לפני העלאה', 'הרצות גדולות עלולות להתייקר – תקרת עלות והערכה מראש', 'הסכמה גבוהה על סט קטן אינה ראיה חזקה – להציג גודל מדגם ורווח ביטחון פשוט', 'שינויי מודל אצל הספקים משנים תוצאות – לשמור גרסת מודל בכל הרצה'],
        en: ['Customer datasets may hold personal data – deletion, encryption and guidance to clean before upload', 'Large runs can get expensive – cost cap and an upfront estimate', 'High agreement on a small set is weak evidence – show sample size and a simple confidence interval', 'Provider model changes shift results – store the model version in every run'],
      },
      expansion: {
        he: ['הערכה של שרשראות פעולות ושימוש בכלים', 'דגימת קלטים אמיתיים מהייצור אל הסט', 'תבניות קריטריונים לסוגי מוצרים, כמו סיכום, חילוץ ושיחה'],
        en: ['Evaluating multi-step chains and tool use', 'Sampling real production inputs into the set', 'Criteria templates for product types such as summarisation, extraction and conversation'],
      },
    },
  },
];
