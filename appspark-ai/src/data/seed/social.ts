import type { Idea } from '../types';

/**
 * Social – communities, connections and sharing. Every idea here is built
 * around people meeting people, deliberately without an endless feed, and
 * with minors protected by design (no open chat, no precise location).
 */
export const ideas: Idea[] = [
  {
    id: 'corkboard',
    name: { he: 'Corkboard – לוח השכונה', en: 'Corkboard' },
    tagline: {
      he: 'לוח המודעות של המכולת, הגינה ובית הכנסת – בדיגיטל: מודעות שמוצמדות למקום אמיתי, נראות רק במרחק הליכה ונעלמות אחרי שבועיים.',
      en: 'The corner-shop, park and synagogue noticeboard, digitised: posts pinned to a real place, visible only within walking distance, gone after two weeks.',
    },
    category: 'social',
    secondaryCategories: ['lifestyle', 'business'],
    difficulty: 'intermediate',
    effort: { weeksMin: 6, weeksMax: 8 },
    budget: 'low',
    businessModel: 'b2b',
    platforms: ['ios', 'android'],
    audience: ['consumers', 'businesses'],
    tags: ['hyperlocal', 'neighbourhood', 'noticeboard', 'community', 'local business', 'qr', 'ephemeral'],
    identity: { hue: 36, glyph: 'Ck', pattern: 'grid' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: true, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Corkboard לוקחת את לוח השעם שתלוי במכולת, בכניסה לגינה הציבורית ובלובי של הבניין, ומעבירה אותו לטלפון בלי להפוך אותו לרשת חברתית. כל מודעה מוצמדת למקום פיזי – לא לפרופיל של אדם – ונראית רק למי שנמצא במרחק הליכה ממנו. למודעות יש תאריך תפוגה (ברירת מחדל: 14 יום), לכל מקום יש מספר מוגבל של "נעצים", ובעל המקום – המכולת, המרכז הקהילתי, ועד הבית – הוא זה שמאשר מה נתלה אצלו. בלי פיד אינסופי, בלי לייקים, בלי אלגוריתם: רק מה שקורה ברחוב שלכם, השבוע. מדבקת QR על הלוח האמיתי מחברת בין העולמות: סורקים, ורואים את אותו לוח בטלפון.',
        en: 'Corkboard takes the cork noticeboard hanging in the corner shop, at the park gate and in the building lobby and moves it to the phone without turning it into a social network. Every post is pinned to a physical place – not to a person’s profile – and is visible only to people within walking distance. Posts expire (14 days by default), each place has a limited number of "pins", and the place owner – the shop, the community centre, the building committee – approves what goes up. No endless feed, no likes, no algorithm: just what is happening on your street this week. A QR sticker on the real board bridges the two worlds: scan it and see the same board on your phone.',
      },
      problem: {
        he: 'קבוצות הוואטסאפ של השכונה מתפוצצות מהודעות, מודעות על הלוח הפיזי נרטבות ונעלמות, ורשתות "שכונתיות" הופכות מהר לפיד של תלונות ופרסומות. אין היום מקום שקט שבו דייר, חנות או גן ילדים יכולים לתלות הודעה שרלוונטית רק למי שגר ממש כאן – ורק לשבועיים.',
        en: 'Neighbourhood WhatsApp groups drown in messages, paper notices get rained on and vanish, and "neighbourhood" networks quickly turn into a feed of complaints and promotions. There is no quiet place today where a resident, a shop or a kindergarten can post something that matters only to people who actually live here – and only for two weeks.',
      },
      solution: {
        he: 'לוחות דיגיטליים שמוצמדים למקומות אמיתיים, עם מגבלת נעצים, תפוגה אוטומטית ומנהל לוח אנושי. הנראות נקבעת לפי תא שכונתי גס שמחושב במכשיר – לא לפי מיקום מדויק של אף אחד – והמודעה שייכת למקום, לא למפרסם.',
        en: 'Digital boards pinned to real places, with a pin limit, automatic expiry and a human board keeper. Visibility is decided by a coarse neighbourhood cell computed on the device – never by anyone’s exact location – and the post belongs to the place, not to the poster.',
      },
      usp: {
        he: 'ההפך מרשת שכונתית: מחסור במקום מנוע המלצות, מקומות במקום פרופילים, ותפוגה במקום ארכיון. בעלי המקומות מקבלים לוח מאומת עם כלי ניהול – והם גם אלה שמשלמים.',
        en: 'The opposite of a neighbourhood network: scarcity instead of a recommendation engine, places instead of profiles, expiry instead of an archive. Place owners get a verified board with management tools – and they are the ones who pay.',
      },
      targetUsers: {
        he: ['דיירים שרוצים לדעת מה קורה ברחוב בלי להצטרף לעוד קבוצה', 'חנויות שכונתיות, בתי קפה ומרכזים קהילתיים שרוצים ערוץ מקומי שקט', 'ועדי בתים וגנים ששולחים הודעות תפעוליות לקהל קטן ומוגדר', 'עיריות ומינהלים קהילתיים שמנהלים אשכול של לוחות'],
        en: ['Residents who want to know what is happening on their street without joining another group', 'Corner shops, cafés and community centres that want a quiet local channel', 'Building committees and kindergartens sending operational notices to a small, defined audience', 'Municipalities and community councils managing a cluster of boards'],
      },
      coreFeatures: {
        he: [
          'לוחות מוצמדים למקומות אמיתיים עם מדבקת QR לסריקה',
          'נראות לפי תא שכונתי גס שמחושב במכשיר, בלי שיתוף מיקום מדויק',
          'מגבלת נעצים לכל לוח ותפוגה אוטומטית של מודעות',
          'מנהל לוח: אישור, הסרה ונעיצה של מודעה בראש הלוח',
          'סוגי מודעות: אבד/נמצא, מכירה, אירוע, הודעת ועד, דרושים',
          'תגובה פרטית למפרסם דרך קישור חד-פעמי, בלי צ׳אט פתוח',
          'לוח מאומת לעסקים ולמוסדות עם נתוני צפייה בסיסיים',
        ],
        en: [
          'Boards pinned to real places with a scannable QR sticker',
          'Visibility by a coarse neighbourhood cell computed on the device, no precise location sharing',
          'Pin limit per board and automatic post expiry',
          'Board keeper tools: approve, remove and pin a post to the top',
          'Post types: lost & found, for sale, event, committee notice, help wanted',
          'Private reply to the poster through a one-time link, no open chat',
          'Verified board for businesses and institutions with basic view statistics',
        ],
      },
      screens: [
        { name: { he: 'הלוחות שלי', en: 'My boards' }, description: { he: 'רשימת הלוחות במרחק הליכה, ממוינים לפי קרבה גסה, עם מספר המודעות החדשות בכל לוח.', en: 'The boards within walking distance, sorted by coarse proximity, with the count of new posts on each.' } },
        { name: { he: 'לוח', en: 'Board' }, description: { he: 'רשת של כרטיסי מודעות על רקע שעם, מודעות נעוצות למעלה, ותאריך תפוגה על כל כרטיס.', en: 'A grid of post cards on a cork background, pinned posts on top, and an expiry date on every card.' } },
        { name: { he: 'מודעה', en: 'Post' }, description: { he: 'המודעה במלואה עם תמונה אחת, סוג, תאריך תפוגה וכפתור "השב בפרטי" שפותח קישור חד-פעמי.', en: 'The full post with one image, its type, expiry date and a "reply privately" button that opens a one-time link.' } },
        { name: { he: 'תליית מודעה', en: 'Pin a post' }, description: { he: 'טופס קצר: בחירת לוח, סוג מודעה, טקסט, תמונה ותאריך תפוגה, עם ציון כמה נעצים נותרו בלוח.', en: 'A short form: board, post type, text, image and expiry date, with a note of how many pins are left on that board.' } },
        { name: { he: 'סריקה', en: 'Scan' }, description: { he: 'מצלמה לסריקת מדבקת QR שפותחת ישירות את הלוח של המקום שבו אתם עומדים.', en: 'A camera view that scans the QR sticker and opens the board of the place you are standing in.' } },
        { name: { he: 'ניהול לוח', en: 'Board keeper' }, description: { he: 'תור של מודעות שממתינות לאישור, מודעות פעילות עם הסרה בהחלקה, והגדרות הלוח: מגבלת נעצים ותפוגה.', en: 'A queue of posts awaiting approval, active posts with swipe-to-remove, and board settings: pin limit and expiry.' } },
        { name: { he: 'הגדרות ופרטיות', en: 'Settings & privacy' }, description: { he: 'בחירת תא שכונתי ידנית במקום מיקום, ניהול התראות לכל לוח, ומחיקת חשבון.', en: 'Pick a neighbourhood cell by hand instead of using location, manage per-board notifications, and delete the account.' } },
      ],
      userJourney: {
        he: [
          'דיירת חדשה סורקת מדבקת QR בכניסה למכולת ורואה את לוח השכונה בטלפון',
          'היא מסמנת את הלוח כמועדף ומקבלת התראה אחת ביום על מודעות חדשות',
          'כעבור שבוע היא תולה מודעה "אבד – חתול ג׳ינג׳י" עם תמונה ותפוגה של 10 ימים',
          'בעל המכולת מאשר את המודעה בלחיצה והיא מופיעה אצל כל מי שבמרחק הליכה',
          'שכן משיב דרך קישור חד-פעמי, החתול נמצא, והמודעה מוסרת לפני התפוגה',
        ],
        en: [
          'A new resident scans the QR sticker at the corner-shop entrance and sees the neighbourhood board on her phone',
          'She favourites the board and gets one notification a day about new posts',
          'A week later she posts "lost – ginger cat" with a photo and a ten-day expiry',
          'The shop owner approves it with one tap and it appears for everyone within walking distance',
          'A neighbour replies through a one-time link, the cat is found, and the post is taken down before it expires',
        ],
      },
      uxDirection: {
        he: 'מוחשי וחם: רקע בטקסטורת שעם עדינה, כרטיסים שנראים כמו פתקים עם נעץ, וטיפוגרפיה גדולה שנוח לקרוא גם כשעומדים ברחוב. בלי מונה לייקים ובלי אווטארים – שם המקום הוא הכותרת. תאריך התפוגה מוצג על כל כרטיס כדי להרגיל את המשתמשים לארעיות.',
        en: 'Tactile and warm: a subtle cork texture, cards that look like pinned notes, and large typography that is easy to read while standing on the street. No like counters and no avatars – the place name is the headline. The expiry date sits on every card so users get used to impermanence.',
      },
      architecture: {
        he: 'Expo עם Expo Router ו-expo-camera לסריקת QR. Supabase ל-Auth, ללוחות, למודעות ולתורי האישור, עם RLS שמבדיל בין דייר, מפרסם ומנהל לוח. המיקום לא נשלח לשרת: המכשיר ממיר את המיקום לתא שכונתי גס (למשל geohash קצר) ושולח רק את מזהה התא, או שהמשתמש בוחר תא ידנית. Edge Function מריצה תפוגה יומית ומנקה קישורי תגובה שפג תוקפם.',
        en: 'Expo with Expo Router and expo-camera for QR scanning. Supabase for auth, boards, posts and approval queues, with RLS separating residents, posters and board keepers. Location never reaches the server: the device converts it into a coarse neighbourhood cell (a short geohash, for example) and sends only the cell id, or the user picks a cell manually. An Edge Function runs daily expiry and cleans up expired reply links.',
      },
      stack: ['Expo', 'Expo Router', 'expo-camera', 'expo-location', 'Supabase', 'Supabase Edge Functions', 'Expo Notifications'],
      database: {
        he: ['places – מקום, סוג, בעלים מאומת, תא שכונתי', 'boards – לוח, מקום, מגבלת נעצים, ברירת מחדל לתפוגה', 'posts – מודעה, לוח, סוג, תוכן, תמונה, תפוגה, סטטוס אישור', 'board_keepers – המשתמשים שמנהלים לוח וההרשאות שלהם', 'reply_links – קישורי תגובה חד-פעמיים עם תוקף', 'board_follows – לוחות שהמשתמש סימן והעדפות התראה'],
        en: ['places – place, type, verified owner, neighbourhood cell', 'boards – board, place, pin limit, default expiry', 'posts – post, board, type, content, image, expiry, approval status', 'board_keepers – users who manage a board and their permissions', 'reply_links – one-time reply links with a validity window', 'board_follows – boards the user follows and notification preferences'],
      },
      auth: {
        he: 'כניסה עם מספר טלפון (OTP) כדי לצמצם חשבונות מזויפים, וכניסה עם Apple/Google כחלופה. מנהלי לוח עוברים אימות ידני של בעלות על המקום. האפליקציה מיועדת לבגירים בלבד, ומיקום מדויק לא נשמר בשום טבלה.',
        en: 'Phone number sign-in (OTP) to limit fake accounts, with Apple/Google as an alternative. Board keepers go through manual verification of place ownership. The app is for adults only, and precise location is never stored in any table.',
      },
      monetization: {
        he: ['לוח מאומת בתשלום חודשי לעסקים ולמוסדות: נעצים נוספים, מודעה נעוצה ונתוני צפייה', 'חבילה לעיריות ולמינהלים קהילתיים לניהול אשכול לוחות', 'מדבקות QR ממותגות ושילוט פיזי כמוצר נלווה'],
        en: ['Monthly verified-board plan for businesses and institutions: extra pins, a pinned post and view data', 'Municipality and community-council package for managing a cluster of boards', 'Branded QR stickers and physical signage as an add-on product'],
      },
      mvpMilestones: {
        he: ['לוח אחד, מודעות עם תפוגה ומסך ניהול בסיסי', 'תא שכונתי במכשיר ורשימת לוחות במרחק הליכה', 'סריקת QR שפותחת לוח, ומדבקות לשכונת פיילוט אחת', 'קישורי תגובה חד-פעמיים והתראה יומית מרוכזת', 'לוח מאומת לעסק עם עמוד ניהול, בחיוב ידני בשלב הפיילוט'],
        en: ['One board, posts with expiry and a basic keeper screen', 'On-device neighbourhood cell and the walking-distance board list', 'QR scanning that opens a board, plus stickers for one pilot neighbourhood', 'One-time reply links and a daily digest notification', 'Verified business board with a management page, invoiced manually during the pilot'],
      },
      risks: {
        he: ['בעיית הביצה והתרנגולת ברמת רחוב – חייבים להתחיל משכונה אחת עם בעלי מקומות מחויבים', 'מנהלי לוח לא פעילים משאירים מודעות תקועות – נדרש אישור אוטומטי אחרי זמן קצוב', 'שימוש לרעה (ספאם, הטרדה) מחייב דיווח, חסימה ותגובה מהירה', 'מדבקות QR נתלשות או מזויפות – צריך קוד מאומת לכל לוח'],
        en: ['A street-level chicken-and-egg problem – it has to start with one neighbourhood and committed place owners', 'Inactive board keepers leave posts stuck – an auto-approve after a timeout is required', 'Abuse (spam, harassment) needs reporting, blocking and a fast response', 'QR stickers get torn off or faked – every board needs a verified code'],
      },
      expansion: {
        he: ['לוחות זמניים לאירועים: שוק שכונתי, פסטיבל, יום קהילה', 'חיבור למערכות של ועדי בתים ושל מינהלים קהילתיים', 'מצב קיוסק שמציג את הלוח על טאבלט בכניסה למכולת או למרכז הקהילתי'],
        en: ['Temporary boards for events: a street market, a festival, a community day', 'Integration with building-committee and community-council systems', 'A kiosk mode that shows the board on a tablet at the shop or community-centre entrance'],
      },
    },
  },
  {
    id: 'cuttings',
    name: { he: 'Cuttings – ייחורים', en: 'Cuttings' },
    tagline: {
      he: 'קהילת ייחורים לחובבי צמחי בית: מבקשים ייחור מצמח אם של מישהו בסביבה, מגדלים, מעבירים הלאה – והאפליקציה זוכרת את כל השושלת של הצמח.',
      en: 'A cuttings community for houseplant people: request a cutting from a mother plant nearby, grow it, pass it on – and the app keeps the plant’s whole lineage.',
    },
    category: 'social',
    secondaryCategories: ['lifestyle'],
    difficulty: 'intermediate',
    effort: { weeksMin: 6, weeksMax: 8 },
    budget: 'low',
    businessModel: 'freemium',
    platforms: ['ios', 'android', 'web'],
    audience: ['consumers'],
    tags: ['houseplants', 'propagation', 'swap', 'gifting', 'community', 'lineage', 'gardening'],
    identity: { hue: 150, glyph: 'Ct', pattern: 'dots' },
    flags: { beginnerFriendly: false, profitPotential: 'low', experimental: false, trending: true, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Cuttings בנויה סביב מנהג שכבר קיים בקבוצות פייסבוק ובוואטסאפ: אנשים שמגדלים צמחי בית נותנים ייחורים בחינם. הבעיה היא שהקבוצות האלה הן פיד כאוטי – אי אפשר לדעת למי יש מה, מי אמין, ומה קרה לייחור אחרי שנמסר. באפליקציה לכל משתמש יש "מדף צמחי אם" עם מה שהוא מוכן לחלוק, אחרים שולחים בקשה, והמסירה מתואמת בנקודה ציבורית בשכונה. הרגע שבו ייחור נמסר יוצר קשר קבוע בין שני הצמחים, וכך נוצרת שושלת: עץ משפחה חי שמראה שהמונסטרה שלכם היא "נכדה" של צמח מחיפה ויש לה צאצאים בשלוש ערים. בלי מכירה, בלי לייקים – רק נתינה, גידול והעברה הלאה.',
        en: 'Cuttings is built around a habit that already lives in Facebook groups and WhatsApp threads: houseplant people give cuttings away for free. But those groups are a chaotic feed: nobody knows who has what, who is reliable, or what became of a cutting once it changed hands. Every member keeps a "mother plant shelf" of what they are willing to share, others send a request, and a handover is arranged at a public spot nearby. Each handover creates a permanent link between the two plants, and a lineage emerges: a living family tree showing that your monstera is a "grandchild" of a plant from Haifa and has descendants in three cities. No selling, no likes – just giving, growing and passing it on.',
      },
      problem: {
        he: 'חובבי צמחים רוצים לשתף ייחורים, אבל הקבוצות הקיימות מערבבות מכירות, שאלות וייחורים בפיד אחד; קשה לדעת למי יש צמח אם מסוים, אם הוא יגיע למסירה, ומה קרה לצמח אחר כך. הנתינה נעלמת בתוך הרעש.',
        en: 'Plant people want to share cuttings, but the existing groups mix sales, questions and cuttings in one feed; it is hard to know who has a particular mother plant, whether they will show up, and what became of the plant afterwards. The generosity gets lost in the noise.',
      },
      solution: {
        he: 'מדף צמחי אם לכל משתמש, בקשות מובנות במקום פוסטים, תיאום מסירה בנקודה ציבורית לפי שכונה גסה, ורישום שושלת אוטומטי בכל מסירה. אמינות נבנית ממסירות שהושלמו, לא מלייקים.',
        en: 'A mother-plant shelf per member, structured requests instead of posts, handovers arranged at a public spot by coarse neighbourhood, and automatic lineage recording on every handover. Reputation is built from completed handovers, not likes.',
      },
      usp: {
        he: 'הייחור הוא יחידת החיבור: כל מסירה הופכת לענף בעץ משפחה של צמחים שחוצה ערים. זה מוצר של נתינה עם זיכרון – לא עוד לוח מודעות ולא עוד חנות.',
        en: 'The cutting is the unit of connection: every handover becomes a branch in a plant family tree that crosses cities. It is a product of giving with a memory – not another noticeboard and not another shop.',
      },
      targetUsers: {
        he: ['חובבי צמחי בית שכבר נותנים ייחורים בקבוצות ורוצים סדר ואמינות', 'מתחילים שרוצים צמח ראשון בלי לקנות ובלי להרגיש זרים בקהילה', 'משתלות קטנות וגינות קהילתיות שמריצות ימי החלפה'],
        en: ['Houseplant enthusiasts who already give cuttings in groups and want order and trust', 'Beginners who want a first plant without buying one and without feeling like outsiders', 'Small nurseries and community gardens that run swap days'],
      },
      coreFeatures: {
        he: [
          'מדף צמחי אם עם תמונה, שיטת הריבוי ומתי יהיה ייחור זמין',
          'בקשת ייחור מובנית: למה, מתי אפשר לאסוף, ואיזה גודל מתאים',
          'תיאום מסירה בנקודה ציבורית בשכונה, בלי לחשוף כתובת',
          'רישום שושלת אוטומטי: כל ייחור שנמסר מקושר לצמח האם',
          'עץ השושלת: תצוגה אינטראקטיבית של ההורים והצאצאים של כל צמח',
          'מוניטין ממסירות שהושלמו והתראת "הייחור שלך השריש"',
          'ימי החלפה: אירוע עם רשימת הצמחים שמגיעים ומי מביא אותם',
        ],
        en: [
          'A mother-plant shelf with photo, propagation method and when a cutting will be ready',
          'Structured cutting request: why, when you can collect, and which size suits',
          'Handover arranged at a public spot in the neighbourhood, without revealing an address',
          'Automatic lineage recording: every handed-over cutting links to its mother plant',
          'The lineage tree: an interactive view of each plant’s parents and descendants',
          'Reputation from completed handovers and a "your cutting rooted" notification',
          'Swap days: an event with the list of plants coming and who brings them',
        ],
      },
      screens: [
        { name: { he: 'המדף שלי', en: 'My shelf' }, description: { he: 'רשת תמונות של צמחי האם שלכם, עם תג "ייחור זמין" ומונה צאצאים על כל צמח.', en: 'A photo grid of your mother plants, with a "cutting available" tag and a descendants counter on each plant.' } },
        { name: { he: 'גילוי', en: 'Discover' }, description: { he: 'רשימת צמחי אם זמינים בשכונות הקרובות, מסוננת לפי סוג צמח ומועד זמינות, בלי מפה מדויקת.', en: 'Available mother plants in nearby neighbourhoods, filtered by plant type and availability date, without a precise map.' } },
        { name: { he: 'בקשה', en: 'Request' }, description: { he: 'טופס קצר עם שלוש שאלות וחלון זמן לאיסוף, ואחריו שרשור תיאום סגור בין שני הצדדים בלבד.', en: 'A short form with three questions and a collection window, followed by a closed coordination thread between the two parties only.' } },
        { name: { he: 'מסירה', en: 'Handover' }, description: { he: 'מסך האישור: שני הצדדים מאשרים שהייחור נמסר, מצלמים אותו, והשושלת מתעדכנת מיד.', en: 'The confirmation screen: both sides confirm the cutting was handed over, photograph it, and the lineage updates immediately.' } },
        { name: { he: 'עץ השושלת', en: 'Lineage tree' }, description: { he: 'גרף אנכי עם צמח האם למעלה והצאצאים למטה; לחיצה על ענף פותחת את הצמח ואת העיר שבה הוא גדל.', en: 'A vertical graph with the mother plant on top and descendants below; tapping a branch opens that plant and the city where it grows.' } },
        { name: { he: 'יום החלפה', en: 'Swap day' }, description: { he: 'עמוד אירוע עם מיקום ציבורי, רשימת הצמחים שמגיעים, וכפתור "אני מביא" שמוסיף את הצמח שלכם.', en: 'An event page with a public venue, the list of plants coming, and an "I’m bringing" button that adds your plant.' } },
        { name: { he: 'פרופיל', en: 'Profile' }, description: { he: 'הצמחים, המסירות שהושלמו ואזורי השכונה הגסים שבהם אתם מוכנים להיפגש.', en: 'Plants, completed handovers and the coarse neighbourhood areas where you are willing to meet.' } },
      ],
      userJourney: {
        he: [
          'משתמשת חדשה מחפשת "פילודנדרון" ורואה שלושה צמחי אם זמינים בשכונות הסמוכות',
          'היא שולחת בקשה קצרה ומציינת שהיא יכולה לאסוף בסופי שבוע',
          'הנותן מאשר ומציע מסירה בכניסה לגינה הציבורית ביום שישי',
          'שניהם מאשרים את המסירה באפליקציה, והייחור נרשם כצאצא של צמח האם',
          'אחרי חודש היא מסמנת "השריש", הנותן מקבל התראה, ובעוד שנה היא עצמה מוסרת ייחור הלאה',
        ],
        en: [
          'A new member searches "philodendron" and sees three mother plants available in nearby neighbourhoods',
          'She sends a short request and notes she can collect on weekends',
          'The giver accepts and suggests a handover at the park entrance on Friday',
          'Both confirm the handover in the app, and the cutting is recorded as a child of the mother plant',
          'A month later she marks "rooted", the giver gets a notification, and a year on she passes a cutting forward herself',
        ],
      },
      uxDirection: {
        he: 'בוטני ורגוע: רקע בהיר בגוון נייר, ירוקים מאופקים, תמונות גדולות של עלים, וטיפוגרפיה סריפית לכותרות הצמחים. עץ השושלת הוא הרגע הוויזואלי של המוצר – קווים אורגניים דקים בין צמתים עגולים עם תמונות. בלי מונה עוקבים בשום מקום.',
        en: 'Botanical and calm: a light paper-toned background, restrained greens, big leaf photos, and a serif face for plant titles. The lineage tree is the product’s visual moment – thin organic lines between round photo nodes. No follower counts anywhere.',
      },
      architecture: {
        he: 'Expo עם Expo Router, expo-image לתמונות ו-react-native-svg לציור עץ השושלת. Supabase לאימות, לצמחים, לבקשות ולמסירות; הקשר הורה–צאצא נשמר בטבלת קשרים ונשלף רקורסיבית בפונקציית SQL. אתר Next.js קטן מציג עמודי שושלת ציבוריים לשיתוף. מיקום נשמר רק כאזור שכונה גס שהמשתמש בוחר, ושרשור התיאום נפתח רק אחרי אישור בקשה. מנוי "גנן" נמכר כרכישה בתוך האפליקציה דרך RevenueCat.',
        en: 'Expo with Expo Router, expo-image for photos and react-native-svg to draw the lineage tree. Supabase for auth, plants, requests and handovers; the parent–child relation lives in an edges table and is fetched recursively with a SQL function. A small Next.js site serves public, shareable lineage pages. Location is stored only as a coarse neighbourhood area the user picks, and the coordination thread opens only after a request is accepted. The "gardener" plan is sold as an in-app purchase through RevenueCat.',
      },
      stack: ['Expo', 'Expo Router', 'expo-image', 'react-native-svg', 'Supabase', 'Next.js', 'RevenueCat'],
      database: {
        he: ['profiles – משתמש, אזורי שכונה גסים, מוניטין', 'plants – צמח, בעלים, מין, תמונה, זמינות ייחור', 'plant_edges – צמח הורה וצמח צאצא, תאריך המסירה', 'requests – בקשה, צמח, מבקש, סטטוס, חלון איסוף', 'handovers – מסירה שאושרה משני הצדדים, תמונה, נקודה ציבורית', 'swap_days – אירועי החלפה, מיקום ציבורי, רשימת צמחים', 'messages – הודעות תיאום בין שני הצדדים של בקשה שאושרה'],
        en: ['profiles – member, coarse neighbourhood areas, reputation', 'plants – plant, owner, species, photo, cutting availability', 'plant_edges – parent plant and child plant, handover date', 'requests – request, plant, requester, status, collection window', 'handovers – handover confirmed by both sides, photo, public spot', 'swap_days – swap events, public venue, plant list', 'messages – coordination messages between the two sides of an accepted request'],
      },
      auth: {
        he: 'כניסה עם Apple/Google או קישור קסם באימייל. גיל מינימלי 16, ופרופילים של משתמשים מתחת לגיל 18 פרטיים כברירת מחדל ולא מופיעים בגילוי. אין צ׳אט פתוח: הודעות נפתחות רק בין שני הצדדים של בקשה שאושרה, ו-RLS מגביל כל שרשור לשני הצדדים בלבד.',
        en: 'Apple/Google sign-in or an email magic link. Minimum age 16, and profiles of members under 18 are private by default and hidden from discovery. There is no open chat: messages open only between the two sides of an accepted request, and RLS limits every thread to those two members.',
      },
      monetization: {
        he: ['מנוי "גנן" אופציונלי: מדף ללא הגבלה, שושלות ציבוריות מעוצבות ופוסטר שושלת להדפסה', 'שיתופי פעולה עם משתלות: ייחורים נדירים שמחולקים בימי החלפה, מסומנים בבירור כממומנים', 'כלי ניהול לימי החלפה עבור גינות קהילתיות ומשתלות'],
        en: ['Optional "gardener" plan: unlimited shelf, styled public lineages and a printable lineage poster', 'Nursery partnerships: rare cuttings given away on swap days, clearly marked as sponsored', 'Swap-day management tools for community gardens and nurseries'],
      },
      mvpMilestones: {
        he: ['מדף צמחי אם וחיפוש לפי מין ואזור שכונה גס', 'בקשות, אישור ושרשור תיאום סגור', 'מסירה מאושרת משני הצדדים ורישום שושלת', 'עץ שושלת אינטראקטיבי ועמוד שיתוף ציבורי', 'ימי החלפה ומנוי "גנן"'],
        en: ['Mother-plant shelf and search by species and coarse neighbourhood area', 'Requests, acceptance and a closed coordination thread', 'Two-sided handover confirmation and lineage recording', 'Interactive lineage tree and a public share page', 'Swap days and the "gardener" plan'],
      },
      risks: {
        he: ['קהילה שמתחילה ריקה – להתחיל מעיר אחת ומכמה נותנים פעילים', 'מסירות שלא מתקיימות פוגעות באמון – מוניטין ממסירות שהושלמו ותזכורות אוטומטיות', 'נתינה שהופכת למסחר תהרוס את האווירה – מדיניות ברורה של "בלי מכירה" ודיווח', 'צמחים רעילים לחיות מחמד או לילדים – תוויות אזהרה לפי מין'],
        en: ['A community that starts empty – begin with one city and a handful of active givers', 'No-show handovers erode trust – reputation from completed handovers and automatic reminders', 'Giving turning into trading would kill the atmosphere – a clear no-selling policy and reporting', 'Plants toxic to pets or children – warning labels by species'],
      },
      expansion: {
        he: ['פספורט צמח: עמוד שושלת שעובר יחד עם הצמח כשמוסרים אותו', 'מדריכי ריבוי קצרים לכל מין, עם תזכורת מתי לחתוך', 'הרחבה לזרעים ולשתילי ירק לגינות קהילתיות'],
        en: ['A plant passport: a lineage page that travels with the plant when it is given away', 'Short propagation guides per species, with a reminder of when to cut', 'Expansion to seeds and vegetable seedlings for community gardens'],
      },
    },
  },
  {
    id: 'sevev',
    name: { he: 'סבב – הערב הקבוע של החבר׳ה', en: 'Sevev' },
    tagline: {
      he: 'אפליקציה לקבוצה קטנה עם מסורת קבועה – ארוחת שישי, פוקר, מועדון קריאה: מי מארח, מי מגיע, מי מביא מה – ובלי עוד קבוצת וואטסאפ.',
      en: 'For small groups with a standing ritual – Friday dinner, poker night, book club: who hosts, who’s in, who brings what – and no new WhatsApp group.',
    },
    category: 'social',
    secondaryCategories: ['lifestyle', 'productivity'],
    difficulty: 'intermediate',
    effort: { weeksMin: 4, weeksMax: 6 },
    budget: 'free',
    businessModel: 'one-time',
    platforms: ['ios', 'android'],
    audience: ['consumers', 'teams'],
    tags: ['friends', 'rituals', 'dinner club', 'rotation', 'rsvp', 'small group', 'hosting'],
    identity: { hue: 230, glyph: 'Sv', pattern: 'ring' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: false, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'סבב לא מנסה להיות רשת חברתית או עוד צ׳אט – זו שכבת התפעול של מסורת קבוצתית קטנה. קבוצה של 4–12 אנשים מגדירה מסורת אחת (ארוחת שישי פעם בחודש, פוקר בימי שלישי, ריצה בשבת בבוקר), והאפליקציה עושה את מה שוואטסאפ גרוע בו: מחזיקה סבב אירוח הוגן, פותחת אוטומטית את המפגש הבא, סופרת מי מגיע כשברירת המחדל היא "מגיע", מחלקת "מי מביא מה" ושומרת ארכיון של כל המפגשים – תמונה אחת, מתכון אחד, משפט אחד לכל ערב. הצ׳אט נשאר בוואטסאפ: סבב מייצרת הודעת סיכום קצרה שמדביקים בקבוצה. בלי פיד, בלי לייקים, בלי "מצב מקוון". רק "מתי הפעם הבאה, אצל מי, ומה אני מביא".',
        en: 'Sevev is neither a social network nor another chat – it is the operations layer for a small group’s standing ritual. A group of 4–12 people defines one ritual (monthly Friday dinner, Tuesday poker, Saturday morning run), and the app does what WhatsApp is bad at: keeps a fair hosting rotation, opens the next gathering automatically, counts who is coming with "in" as the default, splits who brings what, and keeps an archive of every gathering – one photo, one recipe, one line per evening. The chat stays on WhatsApp: Sevev produces a short summary message you paste into the group. No feed, no likes, no "online" status. Just "when is the next one, at whose place, and what do I bring".',
      },
      problem: {
        he: 'מסורות של חברים מתות מהתשה לוגיסטית: אף אחד לא זוכר מי אירח בפעם הקודמת, סקר התאריכים נקבר בקבוצה, שלושה אנשים מביאים חומוס, ואת התמונות מהערב אף אחד לא מוצא אחרי חודש. הכלים הקיימים הם או צ׳אט או יומן – לא מסורת.',
        en: 'Friend rituals die of logistical fatigue: nobody remembers who hosted last time, the date poll gets buried in the group, three people bring hummus, and a month later nobody can find the photos. The existing tools are either a chat or a calendar – not a ritual.',
      },
      solution: {
        he: 'קבוצה סגורה עם מסורת אחת: סבב אירוח אוטומטי, מפגש הבא שנפתח לבד עם ברירת מחדל "מגיע", רשימת "מי מביא מה" בלי כפילויות, וארכיון מינימלי לכל ערב. הודעת סיכום בלחיצה אחת לקבוצת הוואטסאפ הקיימת.',
        en: 'A closed group with one ritual: automatic hosting rotation, the next gathering opens by itself with "in" as the default, a no-duplicates "who brings what" list, and a minimal archive per evening. A one-tap summary message for the existing WhatsApp group.',
      },
      usp: {
        he: 'מוצר שמתוכנן להיות משעמם בכוונה: בלי צ׳אט, בלי פיד, בלי הצפת התראות – רק המנגנונים שגורמים למסורת להחזיק שנים. ברירת המחדל היא "מגיע", ולכן קל יותר להופיע מאשר להיעלם.',
        en: 'A product designed to be boring on purpose: no chat, no feed, no notification spam – only the mechanisms that keep a ritual alive for years. The default answer is "in", so showing up is easier than fading away.',
      },
      targetUsers: {
        he: ['חבורות חברים עם ערב קבוע: ארוחת שישי, פוקר, משחקי קופסה, מועדון קריאה', 'משפחות מורחבות שמתחלפות באירוח של ארוחת חג או שבת', 'צוותים קטנים עם מסורת מחוץ לעבודה, כמו ריצה או ארוחת צהריים חודשית'],
        en: ['Friend groups with a standing evening: Friday dinner, poker, board games, book club', 'Extended families that take turns hosting a holiday or Shabbat meal', 'Small teams with an out-of-work ritual such as a run or a monthly lunch'],
      },
      coreFeatures: {
        he: [
          'קבוצה סגורה בהזמנה בלבד, עם מסורת אחת ותדירות קבועה',
          'סבב אירוח הוגן עם דילוג והחלפה בלי לשבור את הסדר',
          'המפגש הבא נפתח אוטומטית ו"מגיע" הוא ברירת המחדל',
          'רשימת "מי מביא מה" עם קטגוריות, כדי שלא יגיעו שלושה חומוסים',
          'ארכיון לכל ערב: תמונה אחת, מתכון או משחק, ומשפט אחד לזיכרון',
          'הודעת סיכום בלחיצה אחת להדבקה בקבוצת הוואטסאפ',
          'מצב "חבר חדש" שמצרף מישהו לסבב בלי לשבש את התור',
        ],
        en: [
          'Invite-only closed group with one ritual and a fixed cadence',
          'Fair hosting rotation with skip and swap that keeps the order intact',
          'The next gathering opens automatically and "in" is the default answer',
          'A "who brings what" list with categories so three hummuses never show up',
          'An archive per evening: one photo, a recipe or game, and one line to remember it by',
          'One-tap summary message to paste into the WhatsApp group',
          'A "new member" mode that joins someone into the rotation without breaking the queue',
        ],
      },
      screens: [
        { name: { he: 'המפגש הבא', en: 'Next up' }, description: { he: 'כרטיס גדול אחד: תאריך, מי מארח, מי מגיע (ברירת המחדל "מגיע") ומה עוד חסר ברשימת ההבאה.', en: 'One big card: date, who hosts, who is in (defaulting to "in") and what is still missing from the bring list.' } },
        { name: { he: 'הסבב', en: 'The rotation' }, description: { he: 'טבעת של אווטארים לפי סדר האירוח, עם סימון מי הבא בתור ואפשרות לגרור כדי להחליף.', en: 'A ring of avatars in hosting order, marking who is next and allowing a drag to swap.' } },
        { name: { he: 'מי מביא מה', en: 'Bring list' }, description: { he: 'רשימה לפי קטגוריות (עיקרית, סלט, שתייה, קינוח) שבה כל אחד מסמן מה הוא לוקח, ומשבצות ריקות מודגשות.', en: 'A list by category (main, salad, drinks, dessert) where each person claims an item, with empty slots highlighted.' } },
        { name: { he: 'ארכיון', en: 'Archive' }, description: { he: 'ציר זמן אנכי של כל המפגשים, כל אחד עם תמונה אחת, המארח ומשפט אחד – בלי תגובות ובלי לייקים.', en: 'A vertical timeline of every gathering, each with one photo, the host and one line – no comments, no likes.' } },
        { name: { he: 'הגדרות המסורת', en: 'Ritual settings' }, description: { he: 'תדירות, יום מועדף, גודל קבוצה, קטגוריות ברירת מחדל ל"מי מביא מה" ומדיניות דילוג, עם תצוגה מקדימה של המפגשים הבאים.', en: 'Cadence, preferred day, group size, default "who brings what" categories and skip policy, with a preview of the upcoming gatherings.' } },
        { name: { he: 'הזמנה', en: 'Invite' }, description: { he: 'קישור או QR להצטרפות, רשימת החברים, ובחירת המקום בסבב לחבר חדש.', en: 'A join link or QR code, the member list, and where in the rotation a new member slots in.' } },
      ],
      userJourney: {
        he: [
          'ניר פותח קבוצה "ארוחת שישי" לשמונה חברים ומגדיר פעם בחודש',
          'האפליקציה מגרילה סדר אירוח, וניר משתף את קישור ההצטרפות בקבוצת הוואטסאפ',
          'שבועיים לפני המפגש הראשון נפתח הכרטיס "אצל דנה", וכולם מסומנים "מגיע" אלא אם יסירו את עצמם',
          'כל אחד מסמן מה הוא מביא; המשבצת "קינוח" נשארת ריקה ומודגשת עד שמישהו לוקח אותה',
          'אחרי הערב דנה מעלה תמונה אחת ומשפט, והסבב מתקדם אוטומטית לרועי לחודש הבא',
        ],
        en: [
          'Nir opens a "Friday dinner" group for eight friends and sets it to once a month',
          'The app draws a hosting order, and Nir shares the join link in the WhatsApp group',
          'Two weeks before the first gathering, the "at Dana’s" card opens and everyone is marked "in" unless they opt out',
          'Each person claims what they bring; the "dessert" slot stays empty and highlighted until someone takes it',
          'After the evening Dana adds one photo and one line, and the rotation moves on to Roy for next month',
        ],
      },
      uxDirection: {
        he: 'חם ומאופק כמו הזמנה מודפסת: רקע קרם, כותרות סריפיות, אווטארים עגולים וכרטיס אחד דומיננטי במסך הבית. מעט מאוד כפתורים – הפעולה העיקרית בכל מסך ברורה. בלי תגי התראה אדומים; תזכורת אחת בשבוע לכל היותר.',
        en: 'Warm and restrained like a printed invitation: cream background, serif headings, round avatars and one dominant card on the home screen. Very few buttons – the primary action on every screen is obvious. No red notification badges; at most one reminder a week.',
      },
      architecture: {
        he: 'Expo עם Expo Router ו-Zustand למצב מקומי. Supabase לאימות, לקבוצות, למפגשים ולרשימות ההבאה, עם Realtime כדי שהרשימה תתעדכן אצל כולם מיד. Edge Function מתוזמנת פותחת את המפגש הבא לפי התדירות ומקדמת את הסבב. התראות דרך Expo Notifications, ושיתוף הסיכום דרך גיליון השיתוף של מערכת ההפעלה. הרכישה החד-פעמית עוברת דרך חנויות האפליקציות עם RevenueCat.',
        en: 'Expo with Expo Router and Zustand for local state. Supabase for auth, groups, gatherings and bring lists, with Realtime so the list updates for everyone instantly. A scheduled Edge Function opens the next gathering by cadence and advances the rotation. Notifications through Expo Notifications, and the summary is shared through the system share sheet. The one-time purchase goes through the app stores with RevenueCat.',
      },
      stack: ['Expo', 'Expo Router', 'Zustand', 'Supabase', 'Supabase Realtime', 'Supabase Edge Functions', 'Expo Notifications', 'RevenueCat'],
      database: {
        he: ['groups – קבוצה, שם המסורת, תדירות, יום מועדף', 'members – חברי הקבוצה והמיקום שלהם בסבב', 'gatherings – מפגש, תאריך, מארח, סטטוס', 'attendance – התשובה של כל חבר לכל מפגש, ברירת מחדל "מגיע"', 'bring_items – פריט, קטגוריה, מי לוקח', 'memories – תמונה, משפט ומתכון לכל מפגש'],
        en: ['groups – group, ritual name, cadence, preferred day', 'members – group members and their position in the rotation', 'gatherings – gathering, date, host, status', 'attendance – each member’s answer per gathering, defaulting to "in"', 'bring_items – item, category, who claims it', 'memories – photo, line and recipe per gathering'],
      },
      auth: {
        he: 'כניסה עם Apple/Google או מספר טלפון. הצטרפות לקבוצה רק דרך קישור הזמנה עם תוקף, ו-RLS מגביל כל טבלה לחברי הקבוצה בלבד. אין פרופילים ציבוריים ואין חיפוש משתמשים.',
        en: 'Apple/Google or phone sign-in. Joining a group only through an expiring invite link, and RLS restricts every table to that group’s members. There are no public profiles and no user search.',
      },
      monetization: {
        he: ['רכישה חד-פעמית לקבוצה שפותחת ארכיון ללא הגבלה ומסורות נוספות', 'הדפסת "ספר השנה" של הקבוצה מתוך הארכיון כמוצר פיזי', 'גרסה לצוותים בחברות: מסורת צוותית שמחויבת למעסיק'],
        en: ['One-time purchase per group that unlocks an unlimited archive and extra rituals', 'A printed "yearbook" of the group from the archive as a physical product', 'A team edition for companies: a team ritual billed to the employer'],
      },
      mvpMilestones: {
        he: ['קבוצה, חברים וסבב אירוח עם דילוג והחלפה', 'מפגש שנפתח אוטומטית עם ברירת מחדל "מגיע"', 'רשימת "מי מביא מה" בזמן אמת', 'ארכיון עם תמונה ומשפט, והודעת סיכום לשיתוף', 'רכישה חד-פעמית דרך חנויות האפליקציות'],
        en: ['Group, members and hosting rotation with skip and swap', 'A gathering that opens automatically with "in" as the default', 'Real-time "who brings what" list', 'Archive with photo and line, plus the shareable summary message', 'One-time purchase through the app stores'],
      },
      risks: {
        he: ['בלי צ׳אט, חלק מהמשתמשים יצפו שהאפליקציה תחליף את וואטסאפ – צריך למסגר את המוצר נכון', 'קבוצות שמתפרקות אחרי שלושה מפגשים – תזכורות עדינות ו"מצב הפסקה" במקום לחץ', 'מודל חד-פעמי מגביל הכנסה – ההימור הוא שרוב הערך נמצא בשקט ובאמינות'],
        en: ['Without chat, some users will expect the app to replace WhatsApp – the product needs careful framing', 'Groups that fizzle after three gatherings – gentle reminders and a "pause mode" rather than pressure', 'A one-time model caps revenue – the bet is that most of the value lies in calm and reliability'],
      },
      expansion: {
        he: ['ייצוא ליומן והצעת תאריך חכמה לפי הזמינות של חברי הקבוצה', 'תבניות מסורת: ליל סדר מתחלף, טורניר פוקר, מועדון סרטים', 'כמה מסורות לאותה קבוצה עם סבבים נפרדים'],
        en: ['Calendar export and a smart date suggestion based on members’ availability', 'Ritual templates: rotating Seder night, poker tournament, film club', 'Multiple rituals for the same group with separate rotations'],
      },
    },
  },
  {
    id: 'rough-cut',
    name: { he: 'Rough Cut – הקרנה מוקדמת', en: 'Rough Cut' },
    tagline: {
      he: 'הקרנת מבחן ליוצרים: מעגל פנימי של מעריצים צופה בגרסה הגולמית לפני הפרסום ומסמן על ציר הזמן איפה זה ריתק, איפה זה נמרח ומה לא היה ברור.',
      en: 'Test screenings for creators: an inner circle of fans watches the rough version before release and marks where it gripped, dragged or confused.',
    },
    category: 'social',
    secondaryCategories: ['creativity', 'business'],
    difficulty: 'advanced',
    effort: { weeksMin: 10, weeksMax: 16 },
    budget: 'medium',
    businessModel: 'subscription',
    platforms: ['web', 'ios', 'android'],
    audience: ['creators', 'professionals'],
    tags: ['creators', 'superfans', 'feedback', 'video', 'podcast', 'community', 'saas', 'early access'],
    identity: { hue: 300, glyph: 'Rc', pattern: 'wave' },
    flags: { beginnerFriendly: false, profitPotential: 'high', experimental: false, trending: true, featuredWeight: 5 },
    spec: {
      overview: {
        he: 'Rough Cut מביאה את הפרקטיקה של הקרנות מבחן מהוליווד ליוצרי יוטיוב, פודקאסטים וניוזלטרים. היוצר מזמין מעגל פנימי קטן של מעריצים – עשרות, לא אלפים – שמקבלים גישה לגרסה הגולמית יום-יומיים לפני הפרסום. במקום תגובות חופשיות, המעריצים מגיבים על ציר הזמן: לחיצה על "נשאבתי", "נמרח" או "לא הבנתי" תוך כדי צפייה, ועוד שאלה או שתיים שהיוצר בחר. התוצאה היא מפת חום של הפרק עם הרגעים שבהם הקהל נשר – ולא ערימה של "אחלה סרטון". המעריצים מקבלים משהו שאי אפשר לקנות: להיות בחדר לפני כולם ולראות את השם שלהם בקרדיטים. היוצר מקבל כלי עריכה מבוסס קהל ומערכת יחסים עמוקה עם האנשים שהכי אכפת להם.',
        en: 'Rough Cut brings the Hollywood practice of test screenings to YouTubers, podcasters and newsletter writers. The creator invites a small inner circle of fans – dozens, not thousands – who get the rough version a day or two before release. Instead of comments, fans react on the timeline: tapping "hooked", "dragging" or "lost" while watching, plus one or two questions the creator chose. The result is an episode heatmap showing where the audience dropped, not a pile of "great video". Fans get something money cannot buy: being in the room before everyone else, and their name in the credits. The creator gets an audience-driven editing tool and a deeper bond with the people who care most.',
      },
      problem: {
        he: 'יוצרים מפרסמים לתוך החושך: הפידבק מגיע אחרי שכבר מאוחר מדי לערוך, בתגובות רועשות שלא אומרות איפה בדיוק הצופים נטשו. בינתיים המעריצים הכי נאמנים מקבלים את אותה חוויה כמו צופה מזדמן – ואין להם דרך אמיתית להשפיע על היצירה.',
        en: 'Creators publish into the dark: feedback arrives after it is too late to edit, in noisy comments that never say exactly where viewers bailed. Meanwhile the most loyal fans get the same experience as a casual viewer – and have no real way to shape the work.',
      },
      solution: {
        he: 'מעגל פנימי סגור עם גישה מוקדמת לגרסאות גולמיות, תגובות מובנות על ציר הזמן במקום טקסט חופשי, מפת חום ושאלות ממוקדות ליוצר, וקרדיט אוטומטי למעריצים שהשתתפו. היוצר משלם מנוי לפי גודל המעגל.',
        en: 'A closed inner circle with early access to rough versions, structured timeline reactions instead of free text, a heatmap and focused questions for the creator, and automatic credits for participating fans. The creator pays a subscription by circle size.',
      },
      usp: {
        he: 'לא פלטפורמת תמיכה ולא קהילה כללית: המוצר הוא פידבק מובנה על ציר זמן, לפני הפרסום, ממעריצים שהיוצר בחר אישית. הערך למעריץ הוא השתתפות ביצירה – לא עוד הטבה.',
        en: 'Not a patronage platform and not a generic community: the product is structured, timeline-based feedback before release, from hand-picked fans. The value for the fan is participating in the work – not another perk.',
      },
      targetUsers: {
        he: ['יוטיוברים ופודקאסטרים בינוניים שעורכים בעצמם ורוצים לדעת איפה הפרק נחלש', 'כותבי ניוזלטרים וסופרים עצמאיים שמחפשים קוראי טיוטה אמינים', 'סוכנויות ומנהלי יוצרים שמנהלים כמה ערוצים במקביל'],
        en: ['Mid-sized YouTubers and podcasters who edit themselves and want to know where an episode goes soft', 'Newsletter writers and independent authors looking for reliable draft readers', 'Agencies and creator managers running several channels at once'],
      },
      coreFeatures: {
        he: [
          'מעגל פנימי בהזמנה אישית עם מכסת מקומות שהיוצר קובע',
          'העלאת גרסה גולמית (וידאו או אודיו) עם חלון צפייה מוגבל בזמן',
          'תגובות על ציר הזמן: נשאבתי, נמרח, לא הבנתי, צחקתי – בלחיצה אחת',
          'מפת חום של הפרק ורשימת רגעי הנשירה, עם ציטוטים מתגובות קצרות',
          'שאלות ממוקדות שהיוצר בוחר, עם תשובות שנראות ליוצר בלבד',
          'קרדיט אוטומטי: רשימת המעגל לתיאור הפרק ותג "צפיתי לפני כולם"',
          'סבב פידבק שני על גרסה מתוקנת והשוואה בין הגרסאות',
          'הגנה על התוכן: סימן מים אישי וקישורים שפגים',
        ],
        en: [
          'Personally invited inner circle with a seat cap set by the creator',
          'Upload a rough version (video or audio) with a time-limited viewing window',
          'Timeline reactions: hooked, dragging, lost, laughed – with one tap',
          'Episode heatmap and a list of drop-off moments, with quotes from short reactions',
          'Focused questions chosen by the creator, with answers visible to the creator only',
          'Automatic credits: the circle list for the episode description and a "watched it first" badge',
          'A second feedback round on a revised version and a comparison between versions',
          'Content protection: personal watermark and expiring links',
        ],
      },
      screens: [
        { name: { he: 'לוח היוצר', en: 'Creator dashboard' }, description: { he: 'תצוגת ווב: הפרקים שבהקרנה, אחוז המעגל שכבר צפה, ומפת החום של הפרק האחרון במרכז.', en: 'Web view: episodes in screening, the share of the circle that has watched, and the latest episode’s heatmap front and centre.' } },
        { name: { he: 'העלאת גרסה', en: 'Upload a cut' }, description: { he: 'גרירת קובץ, בחירת חלון זמן לצפייה, שאלות ממוקדות ומכסת מקומות לסבב הזה.', en: 'Drag in a file, pick the viewing window, set focused questions and the seat cap for this round.' } },
        { name: { he: 'המעגל', en: 'The circle' }, description: { he: 'רשימת המעריצים במעגל עם שיעור ההשתתפות שלהם, הזמנות ממתינות ואפשרות לפנות מקום.', en: 'The fans in the circle with their participation rate, pending invites and the option to free a seat.' } },
        { name: { he: 'חדר ההקרנה', en: 'Screening room' }, description: { he: 'באפליקציית המעריץ: נגן עם ארבעה כפתורי תגובה גדולים מתחתיו, בלי תגובות של אחרים, ועם סימן מים אישי.', en: 'In the fan app: a player with four big reaction buttons beneath it, no one else’s reactions visible, and a personal watermark.' } },
        { name: { he: 'שאלות היוצר', en: 'Creator questions' }, description: { he: 'שתיים-שלוש שאלות אחרי הצפייה עם תשובות קצרות, וציון שהתשובות נראות ליוצר בלבד.', en: 'Two or three post-viewing questions with short answers, and a note that answers are visible to the creator only.' } },
        { name: { he: 'ניתוח הפרק', en: 'Episode analysis' }, description: { he: 'מפת חום על ציר הזמן, רשימת רגעי הנשירה, וסינון לפי סוג תגובה או סבב.', en: 'Heatmap over the timeline, a list of drop-off moments, and filtering by reaction type or round.' } },
        { name: { he: 'הקרדיטים שלי', en: 'My credits' }, description: { he: 'אצל המעריץ: הפרקים שבהם השתתפתם, התג "צפיתי לפני כולם", והמעגלים שאתם חברים בהם.', en: 'For the fan: the episodes you took part in, the "watched it first" badge, and the circles you belong to.' } },
      ],
      userJourney: {
        he: [
          'פודקאסטרית מזמינה 40 מאזינים ותיקים למעגל הפנימי דרך קישור אישי',
          'היא מעלה את הגרסה הגולמית של הפרק הבא עם חלון של 48 שעות ושאלה אחת: "איפה הייתם מקצרים?"',
          'המאזינים שומעים באפליקציה ומקישים "נמרח" בדקות 12–15 ו"נשאבתי" בפתיחה',
          'מפת החום מראה נשירה ברורה בדקה 13; היא מקצרת את הקטע ומעלה גרסה שנייה',
          'הפרק יוצא עם רשימת המעגל בתיאור, והמאזינים מקבלים את התג "צפיתי לפני כולם"',
        ],
        en: [
          'A podcaster invites 40 long-time listeners to her inner circle through a personal link',
          'She uploads the rough cut of the next episode with a 48-hour window and one question: "where would you trim?"',
          'Listeners play it in the app and tap "dragging" around minutes 12–15 and "hooked" on the opening',
          'The heatmap shows a clear drop at minute 13; she trims the segment and uploads a second cut',
          'The episode goes out with the circle listed in the description, and listeners get the "watched it first" badge',
        ],
      },
      uxDirection: {
        he: 'צד היוצר: ממשק ווב כהה ומקצועי ברוח חדר עריכה, עם מפת חום צבעונית על ציר זמן רחב. צד המעריץ: מסך צפייה נקי שבו ארבעה כפתורים גדולים הם הדבר היחיד מלבד הנגן, כדי שהתגובה תהיה רפלקס ולא מאמץ. בלי פיד, בלי תגובות של אחרים, בלי דירוגים ציבוריים.',
        en: 'Creator side: a dark, professional web interface in the spirit of an edit suite, with a colour heatmap over a wide timeline. Fan side: a clean screening screen where four large buttons are the only thing besides the player, so reacting is a reflex rather than an effort. No feed, no one else’s comments, no public ratings.',
      },
      architecture: {
        he: 'לוח יוצר ב-Next.js, אפליקציית מעריצים ב-Expo עם expo-video. Supabase ל-Auth, למעגלים, לפרקים ולתגובות, עם RLS שמפריד לחלוטין בין יוצרים למעריצים. וידאו ואודיו דרך Mux או Cloudflare Stream עם קישורים חתומים שפגים; סימן מים אישי גלוי מוצג כשכבה בנגן (לא סימן מים פורנזי). Edge Function מצרפת את התגובות לדליים של 5 שניות לבניית מפת החום. תשלומים ב-Stripe לפי גודל המעגל.',
        en: 'Creator dashboard in Next.js, fan app in Expo with expo-video. Supabase for auth, circles, episodes and reactions, with RLS fully separating creators from fans. Video and audio through Mux or Cloudflare Stream with expiring signed links; a visible per-viewer watermark is overlaid in the player (not forensic watermarking). An Edge Function aggregates reactions into five-second buckets to build the heatmap. Payments with Stripe, priced by circle size.',
      },
      stack: ['Next.js', 'Expo', 'expo-video', 'Supabase', 'Supabase Edge Functions', 'Mux or Cloudflare Stream', 'Stripe'],
      database: {
        he: ['creators – יוצר, ערוצים, תוכנית מנוי', 'circles – מעגל, יוצר, מכסת מקומות', 'circle_members – מעריץ, מעגל, שיעור השתתפות', 'episodes – פרק, גרסה, סוג מדיה, חלון צפייה', 'reactions – מעריץ, פרק, חותמת זמן, סוג תגובה', 'questions – שאלות היוצר ותשובות שנראות ליוצר בלבד', 'heatmap_buckets – ספירת תגובות לכל 5 שניות לכל גרסה', 'credits – השתתפות מאושרת של מעריץ בפרק'],
        en: ['creators – creator, channels, subscription plan', 'circles – circle, creator, seat cap', 'circle_members – fan, circle, participation rate', 'episodes – episode, version, media type, viewing window', 'reactions – fan, episode, timestamp, reaction type', 'questions – creator questions and answers visible to the creator only', 'heatmap_buckets – reaction counts per five seconds per version', 'credits – a fan’s confirmed participation in an episode'],
      },
      auth: {
        he: 'יוצרים נכנסים עם אימייל או Google בלוח הווב; מעריצים מצטרפים רק דרך הזמנה אישית מהיוצר, בלי הרשמה פתוחה ובלי גילוי מעגלים. גיל מינימלי 16, אין הודעות בין מעריצים, וכל טבלה מוגנת ב-RLS לפי מעגל.',
        en: 'Creators sign in with email or Google on the web dashboard; fans join only through a personal invite from the creator, with no open sign-up and no circle discovery. Minimum age 16, no messaging between fans, and every table is protected with per-circle RLS.',
      },
      monetization: {
        he: ['מנוי חודשי ליוצר לפי גודל המעגל: עד 25, עד 100 או עד 500 מקומות', 'תוכנית לסוכנויות ולרשתות יוצרים עם כמה ערוצים ולוח מאוחד', 'תוספים בתשלום: סבב שני ודוחות ניתוח מורחבים'],
        en: ['Monthly creator subscription by circle size: up to 25, 100 or 500 seats', 'Agency and creator-network plan with multiple channels and a combined dashboard', 'Paid add-ons: a second round and extended analysis reports'],
      },
      mvpMilestones: {
        he: ['לוח יוצר, מעגל אחד והזמנות אישיות', 'העלאת וידאו או אודיו עם קישורים חתומים וחלון צפייה', 'אפליקציית מעריצים עם ארבע תגובות על ציר הזמן', 'מפת חום ורשימת רגעי נשירה', 'שאלות ממוקדות וקרדיטים אוטומטיים', 'מנוי Stripe לפי גודל המעגל'],
        en: ['Creator dashboard, one circle and personal invites', 'Video or audio upload with signed links and a viewing window', 'Fan app with four timeline reactions', 'Heatmap and drop-off list', 'Focused questions and automatic credits', 'Stripe subscription by circle size'],
      },
      risks: {
        he: ['דליפה של גרסאות גולמיות תפגע באמון היוצרים – סימן מים אישי וקישורים שפגים הם תנאי בסיס', 'עלות אחסון ושידור וידאו עלולה לשחוק את המרווח – להתחיל במעגלי אודיו בלבד', 'מעגל שלא מגיב מייצר מפת חום ריקה – תזכורות ומכסה קטנה בהתחלה', 'מעריצים עלולים להרגיש שהם עובדים בחינם – המסגור חייב להיות השתתפות וקרדיט, לא משימות'],
        en: ['Leaked rough cuts would destroy creator trust – personal watermarks and expiring links are table stakes', 'Video storage and streaming costs can erode the margin – start with audio-only circles', 'A circle that does not respond produces an empty heatmap – reminders and a small cap at first', 'Fans may feel like unpaid labour – the framing must be participation and credit, not tasks'],
      },
      expansion: {
        he: ['השוואה בין גרסאות: האם הקיצור באמת תיקן את הנשירה בדקה 13', 'מצב קריאה לניוזלטרים ולפרקי ספרים עם סימון ברמת פסקה', 'אינטגרציה לתוכנות עריכה: ייצוא רגעי הנשירה כסמנים על ציר הזמן'],
        en: ['Version comparison: did the trim actually fix the drop at minute 13', 'A reading mode for newsletters and book chapters with paragraph-level marks', 'Editing-software integration: export drop-off moments as timeline markers'],
      },
    },
  },
  {
    id: 'doorstep',
    name: { he: 'Doorstep – סיר חם על סף הדלת', en: 'Doorstep' },
    tagline: {
      he: 'מארגנים ארוחות למשפחה שצריכה עזרה – לידה, מחלה, שבעה, מילואים – עם קישור אחד: מי מביא, באיזה יום, בלי כפילויות ובלי לחשוף כתובת.',
      en: 'Meals for a family that needs help – birth, illness, shiva, reserve duty – with one link: who brings what, on which day, no duplicates, no address exposed.',
    },
    category: 'social',
    secondaryCategories: ['lifestyle', 'productivity'],
    difficulty: 'beginner',
    effort: { weeksMin: 2, weeksMax: 3 },
    budget: 'free',
    businessModel: 'open-source',
    platforms: ['cross-platform'],
    audience: ['consumers', 'parents', 'teams'],
    tags: ['meal train', 'community care', 'support', 'shiva', 'new parents', 'volunteers', 'scheduling'],
    identity: { hue: 70, glyph: 'Ds', pattern: 'diagonal' },
    flags: { beginnerFriendly: true, profitPotential: 'low', experimental: false, trending: false, featuredWeight: 2 },
    spec: {
      overview: {
        he: 'כשמשפחה עוברת תקופה קשה – תינוק חדש, ניתוח, שבעה, בן זוג במילואים – הקהילה רוצה לעזור, ובדרך כלל זה נראה ככה: שלושה סירי מרק ביום שלישי, כלום ביום חמישי, ועשרים הודעות "מה אתם אוהבים לאכול?". Doorstep הוא כלי קטן ומדויק: מארגן אחד (חבר, שכנה, רכזת קהילה) פותח "שרשרת ארוחות" עם טווח תאריכים, העדפות תזונה ומספר סועדים, ומשתף קישור אחד. מי שרוצה לעזור בוחר יום פנוי, כותב מה הוא מביא, ורק אז מקבל את הכתובת ואת חלון ההגעה. המשפחה לא צריכה לעשות כלום חוץ מלאכול. אין פיד, אין פרופילים, אין צורך בחשבון למתנדבים – רק לוח שבועי שמתמלא.',
        en: 'When a family is going through a hard stretch – a newborn, surgery, shiva, a partner on reserve duty – the community wants to help, and it usually looks like this: three pots of soup on Tuesday, nothing on Thursday, and twenty messages of "what do you like to eat?". Doorstep is a small, precise tool: one organiser (a friend, a neighbour, a community coordinator) opens a "meal chain" with a date range, dietary preferences and how many to feed, and shares a single link. Helpers pick a free day, say what they are bringing, and only then get the address and drop-off window. The family does nothing except eat. No feed, no profiles, no account for volunteers – just a weekly board that fills up.',
      },
      problem: {
        he: 'עזרה קהילתית מתארגנת בוואטסאפ: כפילויות, ימים ריקים, שאלות חוזרות על אלרגיות, וכתובת של משפחה פגיעה שמסתובבת בקבוצה של חמישים איש. המשפחה, שצריכה מנוחה, הופכת למוקד התיאום.',
        en: 'Community support gets organised on WhatsApp: duplicates, empty days, the same allergy questions over and over, and a vulnerable family’s address floating around a fifty-person group. The family that needs rest becomes the coordination desk.',
      },
      solution: {
        he: 'לוח ארוחות שבועי מאחורי קישור אחד: משבצת אחת ליום, העדפות תזונה שמוצגות למתנדב לפני שהוא בוחר, כתובת וחלון הגעה שנחשפים רק למי שנרשם, ותזכורת יום לפני. בלי חשבון למתנדבים ובלי צ׳אט.',
        en: 'A weekly meal board behind one link: one slot per day, dietary preferences shown to the volunteer before they choose, address and drop-off window revealed only to whoever signs up, and a reminder the day before. No account for volunteers and no chat.',
      },
      usp: {
        he: 'קטן בכוונה: קישור אחד, לוח אחד, אפס חיכוך למתנדבים – והמשפחה אף פעם לא צריכה לתאם. בניגוד לאתרי "רכבת הארוחות" האמריקאיים, Doorstep בעברית מהיום הראשון, עם שדות כשרות ואלרגיות, בלי חשבון למתנדבים, בלי פרסומות ובקוד פתוח – והכתובת משתחררת מהשרת רק למי שלקח משבצת, לא לקבוצה כולה.',
        en: 'Deliberately small: one link, one board, zero friction for volunteers – and the family never has to coordinate. Unlike the American meal-train sites, Doorstep is Hebrew-first, with kashrut and allergy fields, no volunteer accounts, no ads and open source – and the address is released by the server only to whoever claims a slot, never to the whole group.',
      },
      targetUsers: {
        he: ['חברים ושכנים שרוצים לארגן עזרה למשפחה אחרי לידה, ניתוח או אבל', 'רכזי קהילה, בתי כנסת וועדי הורים שמארגנים תמיכה באופן קבוע', 'צוותים בעבודה שתומכים בעמית או בעמיתה בתקופה קשה'],
        en: ['Friends and neighbours organising help for a family after a birth, surgery or loss', 'Community coordinators, synagogues and parent committees who organise support regularly', 'Workplace teams supporting a colleague through a hard time'],
      },
      coreFeatures: {
        he: [
          'פתיחת שרשרת ארוחות בדקה: טווח תאריכים, מספר סועדים, כשרות, העדפות ואלרגיות',
          'קישור שיתוף אחד שנפתח בדפדפן, בלי התקנה ובלי חשבון',
          'משבצת אחת ליום עם "מה אני מביא" כדי למנוע כפילויות',
          'כתובת וחלון הגעה שנחשפים רק למי שלקח משבצת',
          'תזכורת אוטומטית באימייל יום לפני, עם אפשרות לפנות את המשבצת',
          'הודעת סיכום שבועית למארגן ולמשפחה: מי מגיע ומתי',
        ],
        en: [
          'Open a meal chain in a minute: date range, people to feed, kashrut, preferences and allergies',
          'One share link that opens in the browser with no install and no account',
          'One slot per day with "what I’m bringing" to prevent duplicates',
          'Address and drop-off window revealed only to whoever claims a slot',
          'Automatic email reminder the day before, with an option to release the slot',
          'Weekly summary message for the organiser and the family: who is coming when',
        ],
      },
      screens: [
        { name: { he: 'פתיחת שרשרת', en: 'Start a chain' }, description: { he: 'טופס בשלושה צעדים: למי ולמה, טווח תאריכים ומספר סועדים, העדפות תזונה וכתובת (שנשמרת מוסתרת).', en: 'A three-step form: who and why, date range and people to feed, dietary preferences and the address (stored hidden).' } },
        { name: { he: 'לוח הארוחות', en: 'Meal board' }, description: { he: 'תצוגת שבוע עם משבצת לכל יום – ריקה, תפוסה או "לא צריך" – והעדפות המשפחה בראש המסך.', en: 'A week view with a slot for each day – empty, claimed or "not needed" – with the family’s preferences at the top.' } },
        { name: { he: 'לקיחת משבצת', en: 'Claim a slot' }, description: { he: 'שם, טלפון, אימייל לתזכורת ומה אתם מביאים; אחרי האישור נחשפים הכתובת וחלון ההגעה.', en: 'Name, phone, an email for the reminder and what you are bringing; after confirming, the address and drop-off window appear.' } },
        { name: { he: 'המשבצת שלי', en: 'My slot' }, description: { he: 'פרטי ההתחייבות, כפתור ניווט, הוספה ליומן ואפשרות לפנות את המשבצת אם משהו השתנה.', en: 'The details of your commitment, a navigation button, add-to-calendar and the option to release the slot if plans change.' } },
        { name: { he: 'ניהול למארגן', en: 'Organiser view' }, description: { he: 'רשימת המשבצות עם מי לקח מה, שליחת הודעת סיכום, עריכת העדפות וסגירת השרשרת.', en: 'The slot list with who took what, sending the summary message, editing preferences and closing the chain.' } },
      ],
      userJourney: {
        he: [
          'שכנה פותחת שרשרת ארוחות לשבועיים עבור משפחה עם תינוק חדש ומסמנת "ללא גלוטן"',
          'היא משתפת את הקישור בקבוצת הבניין ובקבוצת ההורים',
          'מתנדב פותח את הקישור בדפדפן, רואה שיום רביעי ריק, ולוקח אותו עם "לזניית ירקות"',
          'רק אחרי האישור הוא מקבל את הכתובת ואת חלון ההגעה 17:00–19:00',
          'יום לפני מגיעה תזכורת באימייל, והמארגנת שולחת למשפחה סיכום של השבוע',
        ],
        en: [
          'A neighbour opens a two-week meal chain for a family with a newborn and marks "gluten-free"',
          'She shares the link in the building group and the parents’ group',
          'A volunteer opens the link in the browser, sees Wednesday is empty, and claims it with "vegetable lasagne"',
          'Only after confirming does he receive the address and the 17:00–19:00 drop-off window',
          'The day before, an email reminder arrives, and the organiser sends the family a summary of the week',
        ],
      },
      uxDirection: {
        he: 'חם ופשוט, כמו פתק על המקרר: רקע בהיר, טיפוגרפיה גדולה, ולוח שבועי בשורה אחת של משבצות גדולות שנוח ללחוץ עליהן באגודל. כל מסך עושה דבר אחד. הטון מכבד ושקט – בלי קונפטי, בלי גיימיפיקציה.',
        en: 'Warm and plain, like a note on the fridge: light background, large type, and a weekly board as a single row of big, thumb-friendly slots. Every screen does one thing. The tone is respectful and quiet – no confetti, no gamification.',
      },
      architecture: {
        he: 'אפליקציית Expo אחת עם Expo Router שרצה גם כאתר ווב, כך שהקישור נפתח בדפדפן בלי התקנה. Supabase לשרשראות, למשבצות ולמתנדבים; הכתובת נשמרת בטבלה נפרדת שנגישה רק דרך פונקציית RPC אחרי לקיחת משבצת. המארגן נכנס עם קישור קסם; מתנדבים נשארים אנונימיים עם טוקן משבצת. Edge Function מתוזמנת שולחת תזכורות באימייל דרך Resend; תזכורות SMS דרך Twilio הן שדרוג אופציונלי כשיש תקציב.',
        en: 'One Expo app with Expo Router that also runs as a website, so the link opens in the browser with no install. Supabase for chains, slots and volunteers; the address lives in a separate table reachable only through an RPC function after a slot is claimed. The organiser signs in with a magic link; volunteers stay anonymous with a slot token. A scheduled Edge Function sends email reminders through Resend; SMS reminders through Twilio are an optional upgrade once there is budget.',
      },
      stack: ['Expo', 'Expo Router', 'Supabase', 'Supabase Edge Functions', 'Resend'],
      database: {
        he: ['chains – שרשרת, מארגן, סיבה, טווח תאריכים, העדפות', 'chain_addresses – כתובת וחלון הגעה, נגישים רק דרך RPC', 'slots – יום, סטטוס, מה מביאים', 'volunteers – שם, טלפון, אימייל, טוקן משבצת', 'reminders – תזכורות שנשלחו והסטטוס שלהן'],
        en: ['chains – chain, organiser, reason, date range, preferences', 'chain_addresses – address and drop-off window, reachable only through RPC', 'slots – day, status, what is being brought', 'volunteers – name, phone, email, slot token', 'reminders – sent reminders and their status'],
      },
      auth: {
        he: 'המארגן נכנס עם קישור קסם באימייל; מתנדבים לא נרשמים בכלל – המשבצת נשמרת עם טוקן חתום, מספר טלפון ואימייל לתזכורת. אין פרופילים ציבוריים ואין חיפוש שרשראות: רק מי שיש לו את הקישור רואה את הלוח.',
        en: 'The organiser signs in with an email magic link; volunteers never register – a slot is held with a signed token, a phone number and an email for the reminder. There are no public profiles and no chain search: only people with the link see the board.',
      },
      monetization: {
        he: ['קוד פתוח וחינמי למשפחות; גרסה מנוהלת בתשלום לקהילות, לבתי כנסת ולמחלקות משאבי אנוש', 'תרומות וחסויות של ארגונים קהילתיים ורשויות מקומיות', 'תוספי משלוח: הזמנה ממסעדה מקומית למשבצת שנשארה ריקה'],
        en: ['Open source and free for families; a paid hosted edition for communities, synagogues and HR departments', 'Donations and sponsorships from community organisations and local councils', 'Delivery add-ons: ordering from a local restaurant to fill a slot that stayed empty'],
      },
      mvpMilestones: {
        he: ['פתיחת שרשרת ולוח שבועי עם משבצות', 'קישור ציבורי ולקיחת משבצת בלי חשבון', 'חשיפת כתובת רק אחרי לקיחה, דרך RPC', 'תזכורת באימייל יום לפני והודעת סיכום'],
        en: ['Chain creation and a weekly board with slots', 'Public link and slot claiming without an account', 'Address revealed only after a claim, through RPC', 'Email reminder the day before and the summary message'],
      },
      risks: {
        he: ['קישור שמגיע לידיים לא נכונות – טוקן עם תוקף, אפשרות לסגור שרשרת וחשיפת כתובת רק למי שהתחייב', 'מתנדבים שלא מגיעים – תזכורות ופינוי משבצת בלחיצה כדי שאחרים ייכנסו', 'תזכורת באימייל קל לפספס – לצרף אירוע יומן למשבצת ולהוסיף SMS כשיש תקציב'],
        en: ['A link reaching the wrong hands – expiring tokens, the ability to close a chain, and address exposure only to committed volunteers', 'Volunteers who do not show up – reminders and one-tap slot release so others can step in', 'An email reminder is easy to miss – attach a calendar event to the slot and add SMS once there is budget'],
      },
      expansion: {
        he: ['סוגי עזרה נוספים: הסעות לטיפולים, שמירה על ילדים, הוצאת הכלב', 'תבניות לפי אירוע: שבעה, לידה, מילואים, עם הנחיות מכבדות למתנדבים', 'חיבור לארגוני התנדבות שמריצים הרבה שרשראות במקביל'],
        en: ['More kinds of help: rides to treatment, childcare, dog walking', 'Event templates: shiva, birth, reserve duty, with respectful guidance for volunteers', 'Integration for volunteer organisations running many chains at once'],
      },
    },
  },
];
