import type { Idea } from '../types';

/**
 * Entertainment – content, media, events and culture. Products built around
 * what people listen to, watch, read and go out for, with a concrete twist
 * rather than "another events board" or "another watchlist".
 */
export const ideas: Idea[] = [
  {
    id: 'stint',
    name: { he: 'Stint – הקטע נגמר כשהנסיעה נגמרת', en: 'Stint' },
    tagline: {
      he: 'אומרים כמה זמן יש לכם – 25 דקות לנסיעה – ומקבלים סשן האזנה מקטעים שלמים מהפודקאסטים שלכם, בלי להיתקע באמצע מחשבה.',
      en: 'Tell it how long you have – a 25-minute drive – and get a listening session built from complete segments of your own podcasts, never cut off mid-thought.',
    },
    category: 'entertainment',
    secondaryCategories: ['lifestyle', 'ai'],
    difficulty: 'intermediate',
    effort: { weeksMin: 6, weeksMax: 8 },
    budget: 'medium',
    businessModel: 'subscription',
    platforms: ['ios', 'android'],
    audience: ['consumers', 'professionals'],
    tags: ['podcasts', 'audio', 'commute', 'chapters', 'transcription', 'player', 'rss', 'listening'],
    identity: { hue: 265, glyph: 'St', pattern: 'wave' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: true, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Stint הוא נגן פודקאסטים שמתחיל מהשאלה "כמה זמן יש לך?" ולא מ"מה בא לך לשמוע?". פרקים רבים נמשכים שעה ויותר, אבל הנסיעה לעבודה נמשכת 25 דקות, ולכן מאזינים נעצרים תמיד באמצע קטע ומתחילים פרק חדש לפני שסיימו את הקודם. המשתמש מגדיר חלון זמן, והאפליקציה מרכיבה סשן מקטעים שלמים מתוך המינויים שלו: פרקים שמגיעים עם סימוני פרקי משנה מפורקים לפי הסימונים, ופרקים בלי סימונים – רבים מהפודקאסטים בעברית – מפורקים לפי התמלול וזיהוי מעברי נושא. כל תוכנית נשמרת בדיוק בנקודה שבה עצרה, והסשן הבא ממשיך משם. כשהנסיעה נגמרת אין "איפה הייתי?" – רק הקטע הבא.',
        en: 'Stint is a podcast player that starts from "how long do you have?" instead of "what do you want to hear?". Many episodes run an hour or more, but a commute takes 25 minutes, so listeners keep stopping mid-segment and starting a new episode before finishing the last. The user sets a time window and the app assembles a session from complete segments across their subscriptions: episodes with chapter markers are split along the markers, and episodes without them – many Hebrew shows – are split by transcript and topic-shift detection. Every show is saved exactly where it stopped, and the next session picks up there. When the drive ends there is no "where was I?" – only the next segment.',
      },
      problem: {
        he: 'פרקי פודקאסט נבנים לאורך של שעה ויותר, אבל ההאזנה קורית בחלונות קצרים: נסיעה, הליכה עם הכלב, שטיפת כלים. התוצאה היא עשרות פרקים "באמצע", עצירות חדות בלב סיפור, ותחושה שאף פעם לא מסיימים כלום – ואז מפסיקים להאזין.',
        en: 'Podcast episodes are built to run an hour or more, but listening happens in short windows: a drive, walking the dog, the dishes. The result is dozens of half-finished episodes, hard stops in the middle of a story, and a feeling of never finishing anything – so people stop listening.',
      },
      solution: {
        he: 'סשן האזנה שנבנה לאורך הזמן שיש, מקטעים שלמים בלבד, לפי סדר עדיפויות שהמשתמש קובע (קודם חדשות, אחר כך ראיונות ארוכים). פרקים בלי סימוני פרקי משנה מפורקים אוטומטית לפי התמלול, והפירוק מחושב פעם אחת לכל פרק ומשרת את כל המאזינים.',
        en: 'A listening session sized to the time available, built only from complete segments, in a priority order the user sets (news first, long interviews after). Episodes without chapter markers are split automatically from the transcript, and each split is computed once per episode and shared by every listener.',
      },
      usp: {
        he: 'לא עוד נגן עם כפתור 1.5x, ולא עוד "פרקים אוטומטיים" בתוך פרק שעדיין צריך לשמוע מההתחלה: היחידה הבסיסית היא קטע ולא פרק, אלגוריתם אריזה מתאים את הסשן לאורך הנסיעה בדיוק, ופודקאסטים בעברית – שרבים מהם מגיעים בלי סימוני פרקי משנה – מקבלים חלוקה אמיתית לנושאים.',
        en: 'Not another player with a 1.5x button, and not auto-chapters inside an episode you still have to hear from the top: the basic unit is a segment rather than an episode, a packing algorithm fits the session to the exact length of the drive, and Hebrew podcasts – many of which ship without chapter markers – get a real split by topic.',
      },
      targetUsers: {
        he: ['נוסעים יומיומיים עם 20–40 דקות נסיעה לכל כיוון', 'מאזינים כבדים עם עשרות פרקים שהתחילו ולא סיימו', 'מאזינים לפודקאסטים בעברית שרוצים לקפוץ ישר לקטע שמעניין אותם'],
        en: ['Daily commuters with 20–40 minutes of travel each way', 'Heavy listeners with dozens of started-but-unfinished episodes', 'Hebrew podcast listeners who want to jump straight to the segment that interests them'],
      },
      coreFeatures: {
        he: [
          'הגדרת חלון זמן ("יש לי 25 דקות") ובניית סשן מקטעים שלמים',
          'פירוק פרקים לפי סימוני פרקי משנה קיימים (Podcasting 2.0)',
          'פירוק אוטומטי לפי תמלול לפרקים בלי סימונים, כולל בעברית',
          'סדר עדיפויות בין תוכניות: מה נכנס תמיד ראשון ומה ממלא את הזמן שנשאר',
          'שמירת המקום המדויק של כל תוכנית והמשך משם בסשן הבא',
          'דילוג על קטע שלם בהחלקה, עם סימון "לא מעניין" שמשפיע על הסשנים הבאים',
          'נגן מלא: הורדה מראש, האזנה ברקע ושליטה ממסך הנעילה',
        ],
        en: [
          'Set a time window ("I have 25 minutes") and build a session from complete segments',
          'Split episodes along existing chapter markers (Podcasting 2.0)',
          'Automatic transcript-based splitting for episodes without markers, Hebrew included',
          'Priority order between shows: what always goes first and what fills the remaining time',
          'Save the exact position of every show and resume from it in the next session',
          'Swipe to skip a whole segment, with a "not interested" mark that shapes future sessions',
          'A full player: pre-download, background playback and lock-screen controls',
        ],
      },
      screens: [
        { name: { he: 'כמה זמן יש?', en: 'How long?' }, description: { he: 'מסך הבית: חוגה גדולה לבחירת אורך הסשן, שלושה קיצורים (נסיעה, הליכה, כלים) וכפתור "בנה סשן".', en: 'Home: a large dial for the session length, three presets (drive, walk, dishes) and a "build session" button.' } },
        { name: { he: 'הסשן', en: 'Session' }, description: { he: 'רשימת הקטעים שנבחרו עם אורך כל אחד, שם התוכנית ומשך כולל; גרירה לשינוי סדר והחלפת קטע בלחיצה.', en: 'The chosen segments with their length, show name and total duration; drag to reorder and tap to swap a segment.' } },
        { name: { he: 'נגן', en: 'Player' }, description: { he: 'תמלול חי של הקטע הנוכחי, פס התקדמות של הקטע ולא של הפרק, וכפתור "דלג על הקטע" גדול לשימוש ברכב.', en: 'Live transcript of the current segment, a progress bar for the segment rather than the episode, and a big "skip segment" button for use in the car.' } },
        { name: { he: 'המינויים', en: 'Subscriptions' }, description: { he: 'התוכניות שלך לפי סדר עדיפויות (גרירה), מצב הפירוק של כל פרק ואילו פרקים נעצרו באמצע.', en: 'Your shows in priority order (drag), the split status of each episode and which episodes were stopped mid-way.' } },
        { name: { he: 'פרק', en: 'Episode' }, description: { he: 'ציר הקטעים של פרק בודד עם כותרות שנוצרו מהתמלול, קטעים שכבר נשמעו מעומעמים, ולחיצה להוספת קטע לסשן הבא.', en: 'The segment timeline of a single episode with titles generated from the transcript, heard segments dimmed, and tap to add a segment to the next session.' } },
        { name: { he: 'חיפוש תוכניות', en: 'Find shows' }, description: { he: 'חיפוש בספריות הפודקאסטים הציבוריות והוספה לפי כתובת RSS, עם סימון לתוכניות שכבר מגיעות עם סימוני פרקי משנה.', en: 'Search public podcast directories and add by RSS URL, with a badge on shows that already ship chapter markers.' } },
      ],
      userJourney: {
        he: [
          'המשתמש מוסיף חמש תוכניות, שתיים מהן בעברית בלי סימוני פרקי משנה',
          'בבוקר הוא מגדיר "נסיעה – 25 דקות" ומקבל סשן של שלושה קטעים: חדשות, קטע ראיון ופינה קצרה',
          'הפרק הארוך בעברית פורק בלילה לפי התמלול, ולכן קטע הראיון מתחיל ונגמר בנקודות טבעיות',
          'באמצע הנסיעה הוא מדלג על קטע משעמם והאפליקציה מושכת קטע קצר במקומו',
          'הנסיעה נגמרת בדיוק עם סוף הקטע האחרון, והתוכניות נשמרות במקום שבו עצרו',
          'בדרך חזרה הסשן ממשיך מאותו ראיון, בלי לחפש איפה הוא היה',
        ],
        en: [
          'The user adds five shows, two of them Hebrew with no chapter markers',
          'In the morning he sets "drive – 25 minutes" and gets a three-segment session: news, an interview segment and a short feature',
          'The long Hebrew episode was split overnight from its transcript, so the interview segment starts and ends at natural points',
          'Mid-drive he skips a dull segment and the app pulls in a short one instead',
          'The drive ends exactly as the last segment does, and every show is saved where it stopped',
          'On the way home the session picks up the same interview, with no hunting for where he was',
        ],
      },
      uxDirection: {
        he: 'ממשק שנבנה לשימוש בלי להסתכל: חוגה אחת גדולה במסך הבית, כפתורי ענק בנגן, ותמלול בטיפוגרפיה גדולה למי שמציץ ברמזור. פס ההתקדמות מייצג תמיד קטע ולא פרק, כדי שהסוף ירגיש קרוב. רקע כהה כברירת מחדל ושקט – בלי תגיות "חדש" ובלי מונים מלחיצים.',
        en: 'Built to be used without looking: one big dial on the home screen, oversized player buttons, and transcript in large type for a glance at a red light. The progress bar always represents a segment, not an episode, so the end feels near. Dark by default and quiet – no "new" badges and no anxious counters.',
      },
      architecture: {
        he: 'Expo עם expo-audio להשמעה ברקע ו-expo-file-system להורדות. Supabase לאימות, למינויים ולמצב ההאזנה. Edge Function מושכת פידי RSS, קוראת סימוני פרקי משנה קיימים, ולפרקים בלי סימונים מריצה תמלול (Whisper או ספק מנוהל שתומך בעברית) ואחריו מודל שפה שמזהה מעברי נושא ומחזיר קטעים עם כותרות. הפירוק נשמר בטבלה גלובלית לכל פרק, כך שכל מאזין נוסף לאותו פרק לא עולה כלום. בניית הסשן היא אלגוריתם דטרמיניסטי במכשיר: אריזת קטעים לחלון הזמן לפי עדיפויות.',
        en: 'Expo with expo-audio for background playback and expo-file-system for downloads. Supabase for auth, subscriptions and listening state. An Edge Function fetches RSS feeds, reads chapter markers, and for episodes without them runs transcription (Whisper or a managed provider with Hebrew support) followed by a language model that detects topic shifts and returns titled segments. Splits are stored in a global per-episode table, so each extra listener of the same episode costs nothing. Session building is a deterministic on-device algorithm: packing segments into the time window by priority.',
      },
      stack: ['Expo', 'expo-audio', 'expo-file-system', 'Supabase', 'Supabase Edge Functions', 'OpenAI Whisper API', 'Anthropic or OpenAI API'],
      database: {
        he: ['profiles – משתמש, קיצורי זמן, העדפות מהירות', 'shows – תוכנית, כתובת RSS, האם מגיעה עם סימוני פרקי משנה', 'episodes – פרק, קובץ שמע, משך, מצב פירוק (גלובלי)', 'segments – קטע, פרק, התחלה, סוף, כותרת, מקור (סימון / תמלול)', 'subscriptions – משתמש, תוכנית, עדיפות', 'positions – משתמש, פרק, הקטע והשנייה שבהם נעצר', 'sessions – סשן, אורך מבוקש, הקטעים שנבחרו ומה נשמע בפועל'],
        en: ['profiles – user, time presets, speed preferences', 'shows – show, RSS URL, whether it ships chapter markers', 'episodes – episode, audio file, duration, split status (global)', 'segments – segment, episode, start, end, title, source (marker / transcript)', 'subscriptions – user, show, priority', 'positions – user, episode, the segment and second where it stopped', 'sessions – session, requested length, chosen segments and what was actually heard'],
      },
      auth: {
        he: 'כניסה עם Apple ו-Google, ואפשרות להתחיל בלי חשבון עם מינויים שנשמרים במכשיר. חשבון נדרש רק לסנכרון בין מכשירים ולמנוי. מצבי ההאזנה מוגנים ב-RLS לפי משתמש; טבלאות הפרקים והקטעים משותפות וקריאות לכולם.',
        en: 'Apple and Google sign-in, with a no-account start that keeps subscriptions on the device. An account is needed only for cross-device sync and the subscription. Listening state is protected with per-user RLS; the episode and segment tables are shared and readable by everyone.',
      },
      monetization: {
        he: ['חינם: סשנים מתוכניות שכבר מגיעות עם סימוני פרקי משנה', 'מנוי חודשי: פירוק אוטומטי לפי תמלול ללא הגבלה, הורדות וסנכרון', 'חבילה לרשתות פודקאסטים: פירוק וכותרות לקטעים לכל הקטלוג שלהן'],
        en: ['Free: sessions from shows that already ship chapter markers', 'Monthly subscription: unlimited transcript-based splitting, downloads and sync', 'A plan for podcast networks: splitting and segment titles across their whole catalogue'],
      },
      mvpMilestones: {
        he: ['נגן בסיסי עם RSS, הורדה והשמעה ברקע', 'קריאת סימוני פרקי משנה ובניית סשן לפי חלון זמן', 'שמירת מיקום לכל תוכנית והמשך בסשן הבא', 'צינור תמלול ופירוק לפרקים בלי סימונים, עם מטמון גלובלי', 'סדר עדיפויות ודילוג על קטעים', 'מסך תשלום ומנוי'],
        en: ['Basic player with RSS, download and background playback', 'Chapter-marker parsing and session building by time window', 'Per-show position saving and resume in the next session', 'Transcription and splitting pipeline for marker-less episodes, with a global cache', 'Priority order and segment skipping', 'Paywall and subscription'],
      },
      risks: {
        he: ['תמלול של פרקים באורך שעתיים יקר – לפרק רק פרקים שמישהו באמת מנוי עליהם, ורק פעם אחת לכל פרק', 'פירוק לפי מעברי נושא עלול לחתוך באמצע סיפור – צריך כלל אורך מינימלי לקטע ובדיקה אנושית על מדגם', 'תוכניות בלעדיות של פלטפורמות סגורות לא זמינות ב-RSS, ומאזינים עלולים להתגעגע אליהן', 'השמעה ברקע ב-iOS וב-Android דורשת development build ועבודה עדינה על מצבי שמע'],
        en: ['Transcribing two-hour episodes is expensive – split only episodes someone is actually subscribed to, and only once per episode', 'Topic-shift splitting can cut in the middle of a story – a minimum segment length rule and human review on a sample are needed', 'Exclusive shows on closed platforms are not available via RSS, and listeners may miss them', 'Background playback on iOS and Android needs a development build and careful audio-session handling'],
      },
      expansion: {
        he: ['CarPlay ו-Android Auto עם מסך "בנה סשן" אחד', 'סיכום קולי של 30 שניות לקטע שדילגו עליו', 'ייבוא היסטוריה מנגנים אחרים כדי לא להתחיל מאפס', 'שיתוף קטע בודד עם חבר כקישור שמתחיל בשנייה הנכונה', 'קריאת סימוני פרקי משנה המוטמעים בקובצי MP3 (ID3)'],
        en: ['CarPlay and Android Auto with a single "build session" screen', 'A 30-second spoken recap of a segment that was skipped', 'Import history from other players so nobody starts from zero', 'Share a single segment with a friend as a link that starts at the right second', 'Read chapter markers embedded in MP3 files (ID3)'],
      },
    },
  },
  {
    id: 'standby',
    name: { he: 'Standby – כיסאות שנשארו ריקים הערב', en: 'Standby' },
    tagline: {
      he: 'מועדונים, תיאטראות פרינג׳ וערבי סטנד-אפ משחררים מקומות שלא נמכרו שעתיים לפני ההתחלה – למי שנמצא קרוב ואוהב את הז׳אנר. המושב מתמלא, המחיר הוגן.',
      en: 'Clubs, fringe theatres and comedy nights release unsold seats two hours before showtime to nearby fans of the genre – seats fill, prices stay fair.',
    },
    category: 'entertainment',
    secondaryCategories: ['business', 'lifestyle'],
    difficulty: 'advanced',
    effort: { weeksMin: 12, weeksMax: 16 },
    budget: 'medium',
    businessModel: 'b2b',
    platforms: ['ios', 'android', 'web'],
    audience: ['consumers', 'businesses'],
    tags: ['events', 'nightlife', 'tickets', 'venues', 'last minute', 'tel aviv', 'theatre', 'comedy'],
    identity: { hue: 12, glyph: 'Sb', pattern: 'diagonal' },
    flags: { beginnerFriendly: false, profitPotential: 'high', experimental: false, trending: false, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Standby מחברת בין שני צדדים של אותו ערב: מקום קטן – מועדון מוזיקה, תיאטרון פרינג׳, מועדון סטנד-אפ – שיודע בשש בערב שיישארו לו עשרים כיסאות ריקים, ואנשים שנמצאים במרחק הליכה ומחפשים מה לעשות הערב. המקום מגדיר פעם אחת כלל שחרור: אם עד שעה מסוימת נמכרו פחות מאחוז מסוים מהמקומות, משחררים כמות מוגדרת במחיר מוזל לאנשים ברדיוס נתון שעוקבים אחרי הז׳אנר. האפליקציה שולחת התראה ממוקדת, מחזיקה את המקום כמה דקות, גובה תשלום ומנפיקה קוד כניסה. המקום רואה בזמן אמת כמה מושבים התמלאו, ומקבל אחרי כל ערב דוח קצר על כמה הגיעו ומתי. בלי מכירת כרטיסים רגילה ובלי להתחרות בחברות הכרטוס – רק המושבים שהיו נשארים ריקים.',
        en: 'Standby connects both sides of one evening: a small venue – a music club, fringe theatre or comedy club – that knows by six that twenty seats will stay empty, and people within walking distance looking for plans tonight. The venue sets a release rule once: if less than a given share has sold by a given hour, release a set number at a reduced price to nearby people who follow the genre. The app sends a targeted alert, holds the seat briefly, takes payment and issues an entry code. The venue watches seats fill in real time and gets a short report after every show on how many came and when. No regular ticketing and no competing with ticketing companies – only seats that would have stayed empty.',
      },
      problem: {
        he: 'מקומות קטנים חיים על ערבים מלאים, אבל בערבים רבים נשארים כיסאות שלא נמכרו, ואין דרך טובה למכור אותם ברגע האחרון בלי לפגוע במי שקנה מראש במחיר מלא. מהצד השני, מי שרוצה לצאת "הערב" מגלגל בין אינסטגרם, קבוצות וואטסאפ ואתרי כרטיסים – ובסוף נשאר בבית.',
        en: 'Small venues live on full rooms, yet on many nights some seats stay unsold, and there is no good way to move them last-minute without undercutting people who bought in advance at full price. On the other side, anyone who wants to go out "tonight" bounces between Instagram, WhatsApp groups and ticket sites – and ends up staying home.',
      },
      solution: {
        he: 'כלל שחרור שהמקום מגדיר פעם אחת ורץ אוטומטית, התראות ממוקדות לפי מרחק וז׳אנר במקום פרסום לכולם, החזקת מקום לדקות ספורות ותשלום בלחיצה, וקוד כניסה שסורקים בדלת. המקום שולט במחיר, בכמות ובתזמון; המשתמש רואה רק הצעות שהוא באמת יכול להגיע אליהן.',
        en: 'A release rule the venue sets once and that runs automatically, targeted alerts by distance and genre instead of blasting everyone, a short seat hold with one-tap payment, and an entry code scanned at the door. The venue controls price, quantity and timing; the user only sees offers they can actually reach.',
      },
      usp: {
        he: 'לא עוד לוח אירועים ולא עוד רשימת "דילים לרגע האחרון" שמישהו במקום צריך לעדכן כל ערב: Standby מוכרת רק את מה שאחרת היה נשאר ריק, לפי כלל תפוסה שהמקום מגדיר פעם אחת ורץ לבד, ורק לאנשים שנמצאים קרוב מספיק כדי להגיע תוך שעה. למקום זו הכנסה שולית בלי עבודה ידנית; למשתמש זה ערב ספונטני במחיר הוגן.',
        en: 'Not another events board, and not another "last-minute deals" list someone at the venue has to update every night: Standby sells only what would otherwise stay empty, under an occupancy rule the venue defines once and that runs on its own, and only to people close enough to arrive within the hour. For the venue it is marginal revenue without manual work; for the user it is a spontaneous night out at a fair price.',
      },
      targetUsers: {
        he: ['מועדוני מוזיקה, תיאטראות פרינג׳ ומועדוני סטנד-אפ עם 50–400 מקומות', 'מפיקים עצמאיים של ערבי מוזיקה וקומדיה', 'תושבי העיר שמחליטים ברגע האחרון לצאת', 'סטודנטים וצעירים שרגישים למחיר אבל אוהבים תרבות חיה'],
        en: ['Music clubs, fringe theatres and comedy clubs with 50–400 seats', 'Independent producers of music and comedy nights', 'City residents who decide to go out at the last minute', 'Students and young adults who are price-sensitive but love live culture'],
      },
      coreFeatures: {
        he: [
          'לוח ניהול למקום: אירועים, תפוסה נוכחית וכללי שחרור אוטומטיים',
          'כלל שחרור: תפוסה מתחת לסף בשעה מסוימת → שחרור כמות במחיר מוזל',
          'התראות ממוקדות למשתמשים ברדיוס שעוקבים אחרי הז׳אנר',
          'החזקת מקום לשבע דקות ותשלום בלחיצה אחת',
          'קוד QR לכניסה וסורק דלת מתוך אותה אפליקציה',
          'מפת "הערב" עם מה שמשוחרר עכשיו ובכמה דקות הליכה',
          'דוח אחרי כל ערב: מושבים שהתמלאו, הכנסה שולית ושעות הגעה',
        ],
        en: [
          'Venue dashboard: events, current occupancy and automatic release rules',
          'Release rule: occupancy below a threshold at a given hour → release a quantity at a reduced price',
          'Targeted alerts to users within a radius who follow the genre',
          'A seven-minute seat hold and one-tap payment',
          'QR entry code and a door scanner inside the same app',
          'A "tonight" map showing what is released right now and how many minutes away on foot',
          'Post-show report: seats filled, marginal revenue and arrival times',
        ],
      },
      screens: [
        { name: { he: 'הערב', en: 'Tonight' }, description: { he: 'מסך הבית למשתמש: מפה וכרטיסים של מה שמשוחרר עכשיו, זמן הליכה, מחיר, וכמה מקומות נשארו.', en: 'The user home: a map and cards of what is released right now, walking time, price and how many seats remain.' } },
        { name: { he: 'הצעה', en: 'Offer' }, description: { he: 'פרטי האירוע, שעת התחלה, כמה מילים על המקום, טיימר ההחזקה וכפתור תשלום אחד.', en: 'Event details, start time, a few words on the venue, the hold timer and a single pay button.' } },
        { name: { he: 'הכרטיס שלי', en: 'My ticket' }, description: { he: 'קוד QR גדול בניגודיות גבוהה, ניווט למקום, וכפתור "אני מאחר/ת" שמעדכן את הדלת.', en: 'A large high-contrast QR code, directions to the venue, and an "I am running late" button that updates the door.' } },
        { name: { he: 'העדפות', en: 'Preferences' }, description: { he: 'ז׳אנרים שעוקבים אחריהם, רדיוס קבוע או לפי המיקום הנוכחי, והימים והשעות שבהם רוצים לקבל התראות.', en: 'Followed genres, a fixed radius or the current location, and the days and hours when alerts are welcome.' } },
        { name: { he: 'לוח המקום', en: 'Venue dashboard' }, description: { he: 'ממשק ווב למקום: האירועים הקרובים, תפוסה נוכחית, כללי השחרור הפעילים וההכנסה השולית מהחודש.', en: 'The venue web console: upcoming events, current occupancy, active release rules and marginal revenue this month.' } },
        { name: { he: 'כלל שחרור', en: 'Release rule' }, description: { he: 'טופס קצר: סף תפוסה, שעת בדיקה, כמות לשחרור, הנחה ורדיוס – עם תצוגה מקדימה של ההתראה שתישלח.', en: 'A short form: occupancy threshold, check time, quantity to release, discount and radius – with a preview of the alert that will go out.' } },
        { name: { he: 'סורק דלת', en: 'Door scanner' }, description: { he: 'מצלמה בטלפון של הסדרן, אישור ירוק או אדום, וספירה חיה של כמה מהמקומות המשוחררים כבר נכנסו.', en: 'The usher’s phone camera, a green or red confirmation, and a live count of how many released seats are already inside.' } },
        { name: { he: 'דוח ערב', en: 'Show report' }, description: { he: 'סיכום אחרי האירוע: מושבים שהתמלאו דרך Standby, הכנסה, שעות הגעה ושיעור ההגעה בפועל.', en: 'The post-show summary: seats filled through Standby, revenue, arrival times and the actual show-up rate.' } },
      ],
      userJourney: {
        he: [
          'מועדון סטנד-אפ מגדיר כלל: אם עד 18:00 נמכרו פחות מ-70%, לשחרר 25 מקומות ב-40% הנחה ברדיוס 3 ק״מ',
          'ב-18:00 התפוסה עומדת על 55% והכלל מופעל אוטומטית',
          'משתמשת שעוקבת אחרי "סטנד-אפ" ונמצאת במשרד במרחק 12 דקות הליכה מקבלת התראה',
          'היא פותחת את ההצעה, המקום מוחזק לשבע דקות, והיא משלמת בלחיצה',
          'בדלת הסדרן סורק את הקוד שלה, והלוח של המקום מראה 19 מתוך 25 מקומות שהתמלאו',
          'למחרת בבוקר המקום מקבל דוח קצר ומוריד את ההנחה ל-30% לערב הבא',
        ],
        en: [
          'A comedy club sets a rule: if under 70% is sold by 18:00, release 25 seats at 40% off within 3 km',
          'At 18:00 occupancy stands at 55% and the rule fires automatically',
          'A user who follows "comedy" and is at her office 12 minutes away on foot gets an alert',
          'She opens the offer, the seat is held for seven minutes, and she pays with one tap',
          'At the door the usher scans her code, and the venue dashboard shows 19 of 25 seats filled',
          'The next morning the venue gets a short report and lowers the discount to 30% for the following night',
        ],
      },
      uxDirection: {
        he: 'צד המשתמש: מהיר ולילי – רקע כהה, כרטיסים גדולים עם המספרים שחשובים (מחיר, זמן הליכה, כמה נשאר) וטיימר החזקה שמורגש אבל לא מלחיץ. צד המקום: לוח ווב ענייני בסגנון כלי קופה, עם כלל שמוגדר בשלושה שדות ונראה מיד בתצוגה מקדימה. בשני הצדדים אין תחושה של מכירת חיסול – השפה היא "מקומות אחרונים", לא "הנחה".',
        en: 'User side: fast and nocturnal – dark background, big cards with the numbers that matter (price, walking time, seats left) and a hold timer that is felt but not stressful. Venue side: a no-nonsense web console in the spirit of point-of-sale tools, with a rule defined in three fields and previewed instantly. On both sides nothing feels like a clearance sale – the language is "last seats", not "discount".',
      },
      architecture: {
        he: 'אפליקציית Expo למשתמשים ולסדרנים (הסורק הוא מצב בתוך אותה אפליקציה), ולוח ווב ב-Next.js למקומות. Supabase לנתונים, לאימות ול-Realtime כדי שהתפוסה והספירה בדלת יתעדכנו חי. מנוע הכללים רץ כ-cron ב-Edge Function: בודק תפוסה, משחרר מקומות ושולח התראות לפי שאילתת מרחק ב-PostGIS על מיקומי משתמשים מעוגלים. תשלומים דרך ספק סליקה ישראלי (למשל PayPlus או Tranzila) עם החזקה ושחרור אוטומטי כשהטיימר נגמר. קודי ה-QR חתומים כדי שהסורק יעבוד גם בלי קליטה.',
        en: 'An Expo app for users and ushers (the scanner is a mode inside the same app), and a Next.js web console for venues. Supabase for data, auth and Realtime so occupancy and the door count update live. The rules engine runs as a cron in an Edge Function: it checks occupancy, releases seats and sends alerts via a PostGIS distance query over coarsened user locations. Payments through an Israeli payment provider (e.g. PayPlus or Tranzila) with a hold and automatic release when the timer expires. QR codes are signed so the scanner works even without reception.',
      },
      stack: ['Expo', 'Next.js', 'Supabase', 'Supabase Realtime', 'Supabase Edge Functions', 'PostGIS', 'expo-location', 'expo-notifications', 'PayPlus or Tranzila'],
      database: {
        he: ['venues – מקום, כתובת, קיבולת, ז׳אנרים, פרטי סליקה', 'events – אירוע, מקום, תאריך, שעה, תפוסה נוכחית', 'release_rules – כלל, אירוע או ברירת מחדל למקום, סף, שעה, כמות, הנחה, רדיוס', 'releases – שחרור שבוצע, כמות, מחיר, זמן', 'holds – החזקה, משתמש, שחרור, פקיעה, סטטוס', 'tickets – כרטיס, משתמש, קוד חתום, סטטוס כניסה', 'user_preferences – ז׳אנרים, רדיוס, שעות התראה, מיקום מעוגל אחרון', 'staff – חברי צוות של מקום ותפקידם (מנהל / סדרן)'],
        en: ['venues – venue, address, capacity, genres, payout details', 'events – event, venue, date, time, current occupancy', 'release_rules – rule, event or venue default, threshold, hour, quantity, discount, radius', 'releases – executed release, quantity, price, time', 'holds – hold, user, release, expiry, status', 'tickets – ticket, user, signed code, entry status', 'user_preferences – genres, radius, alert hours, last coarse location', 'staff – venue team members and their role (manager / usher)'],
      },
      auth: {
        he: 'משתמשים: כניסה עם Apple, Google או טלפון – חשבון נדרש רק ברגע התשלום. מקומות: הזמנה באימייל לחשבון ארגוני עם תפקידים (מנהל, סדרן) שנאכפים ב-RLS. מיקום המשתמש נשמר מעוגל, ורק כל עוד ההתראות פעילות.',
        en: 'Users: Apple, Google or phone sign-in – an account is required only at the moment of payment. Venues: email invitation to an organisation account with roles (manager, usher) enforced through RLS. User location is stored coarsened, and only while alerts are enabled.',
      },
      monetization: {
        he: ['מנוי חודשי למקום לפי מספר האירועים בחודש', 'עמלה על כל מושב שהתמלא דרך שחרור', 'חבילה למפיקים עם כמה מקומות וכללים משותפים', 'בהמשך: מיקום מקודם ב"הערב" לאירועים שנפתחו בלי כלל'],
        en: ['Monthly venue subscription tiered by events per month', 'A commission on every seat filled through a release', 'A producer plan covering several venues with shared rules', 'Later: promoted placement in "tonight" for events opened without a rule'],
      },
      mvpMilestones: {
        he: ['לוח ווב למקום עם אירועים ותפוסה ידנית', 'מנוע כללים שמשחרר מקומות ושולח התראות לפי רדיוס וז׳אנר', 'אפליקציית משתמש: מסך "הערב", הצעה, החזקה ותשלום', 'קוד QR חתום וסורק דלת', 'דוח אחרי אירוע', 'פיילוט עם שלושה-ארבעה מקומות בעיר אחת'],
        en: ['Venue web console with events and manual occupancy', 'Rules engine that releases seats and sends alerts by radius and genre', 'User app: "tonight", offer, hold and payment', 'Signed QR code and door scanner', 'Post-show report', 'A pilot with three or four venues in one city'],
      },
      risks: {
        he: ['ביצה ותרנגולת: בלי מקומות אין הצעות ובלי משתמשים אין ערך למקומות – להתחיל בעיר אחת ובז׳אנר אחד', 'התפוסה הנוכחית יושבת אצל חברות הכרטוס – ב-MVP המקום מעדכן ידנית, והאינטגרציות מגיעות אחר כך', 'הנחות קבועות עלולות ללמד קהל לחכות לרגע האחרון – כללים לפי תפוסה ולא לפי שעה בלבד, וכמות מוגבלת', 'תשלומים, החזרים ואירועים שבוטלו דורשים מדיניות ברורה ותמיכה אנושית בערבים'],
        en: ['Chicken and egg: no venues means no offers and no users means no value for venues – start with one city and one genre', 'Current occupancy lives with the ticketing companies – in the MVP the venue updates it by hand, and integrations come later', 'Routine discounts can train an audience to wait for the last minute – rules keyed to occupancy rather than time alone, with capped quantities', 'Payments, refunds and cancelled shows need a clear policy and human support in the evenings'],
      },
      expansion: {
        he: ['אינטגרציה עם מערכות כרטוס לעדכון תפוסה אוטומטי', 'שחרור "פלוס אחד": מי שכבר מחזיק כרטיס מזמין חבר למקום משוחרר', 'הרחבה למסעדות ולבתי קולנוע עצמאיים עם אותו מנוע כללים', 'נתוני תפוסה מצטברים כשירות למקומות לתמחור שלהם'],
        en: ['Ticketing-system integrations for automatic occupancy updates', 'A "plus one" release: an existing ticket holder invites a friend into a released seat', 'Extending to restaurants and independent cinemas with the same rules engine', 'Aggregated occupancy data as a service to inform venues’ own pricing'],
      },
    },
  },
  {
    id: 'alibi',
    name: { he: 'Alibi – סיפור שמתפצל בין חברים', en: 'Alibi' },
    tagline: {
      he: 'תעלומת רצח בהמשכים לקבוצה של חברים: כל אחד מקבל ראיות שרק הוא רואה, אחד מכם מקבל סוד, והקבוצה מצביעה איך הסיפור ממשיך.',
      en: 'A serialised whodunit for a friend group: each player sees evidence nobody else gets, one of you holds a secret, and the group votes on what happens next.',
    },
    category: 'entertainment',
    secondaryCategories: ['games', 'social'],
    difficulty: 'intermediate',
    effort: { weeksMin: 6, weeksMax: 8 },
    budget: 'low',
    businessModel: 'one-time',
    platforms: ['ios', 'android'],
    audience: ['consumers', 'gamers'],
    tags: ['interactive fiction', 'mystery', 'friends', 'multiplayer', 'story', 'branching', 'social deduction', 'ink'],
    identity: { hue: 200, glyph: 'Ab', pattern: 'dots' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: true, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Alibi היא תעלומה אינטראקטיבית שמשחקים בקבוצה של שלושה עד שישה חברים לאורך שבוע, בלי להיפגש. כל "תיק" הוא סיפור כתוב מראש שמחולק לימים: בכל יום כולם מקבלים סצנה משותפת, ובנוסף כל שחקן מקבל ראיות פרטיות שרק הוא רואה – הודעה קולית, תמונה, עמוד מיומן. שחקן אחד, שנבחר בסתר, מקבל גם סוד ומטרה: להסיט את החקירה בלי להיתפס. הקבוצה מתווכחת איפה שהיא מתווכחת ממילא – בוואטסאפ – וחוזרת לאפליקציה כדי להצביע בנקודת ההסתעפות של אותו יום. ההצבעה קובעת איזו סצנה תיפתח מחר, ובסוף השבוע מגיעים הגילוי, הניקוד ומה כל אחד ידע ולא סיפר. אין צ׳אט בתוך האפליקציה, בכוונה: הסיפור נותן סיבה לדבר, והדיבור קורה בחוץ.',
        en: 'Alibi is an interactive mystery for three to six friends, played over a week without meeting up. Each "case" is a pre-written story split into days: everyone gets a shared scene each day, plus private evidence only they can see – a voice note, a photo or a diary page. One player, picked in secret, gets a secret and an objective: steer the investigation without being caught. The group argues where it already argues – on WhatsApp – and returns to the app to vote at the day’s fork. The vote decides which scene unlocks tomorrow; the week ends with the reveal, the scores and who kept quiet about what. No in-app chat, deliberately: the story gives people a reason to talk, and the talking happens outside.',
      },
      problem: {
        he: 'חברים שגרים בערים שונות או עם לוחות זמנים הפוכים מתקשים למצוא משהו משותף לעשות שהוא לא "לשלוח ממים". משחקי חברה דורשים להיפגש, סיפורים אינטראקטיביים הם חוויה של אדם אחד, ומשחקי ניחוש בקבוצה נגמרים אחרי ערב אחד.',
        en: 'Friends who live in different cities or on opposite schedules struggle to find something shared to do that is not "sending memes". Party games require meeting up, interactive stories are a solo experience, and group guessing games are over after one evening.',
      },
      solution: {
        he: 'סיפור מסועף שנכתב לקבוצה: ראיות אסימטריות שמחייבות שיתוף, תפקיד סודי אחד שמכניס ספק לכל דיון, ונקודת הצבעה יומית שמקדמת את העלילה גם אם לא כולם פעילים. מנוע הסיפור רץ על פורמט כתיבה קיים, כך שכותבים יכולים להוסיף תיקים חדשים בלי מפתח.',
        en: 'A branching story written for a group: asymmetric evidence that forces sharing, one secret role that injects doubt into every discussion, and a daily vote that moves the plot even if not everyone is active. The story engine runs on an existing writing format, so authors can add new cases without a developer.',
      },
      usp: {
        he: 'לא סיפור "בחר את ההמשך" לאדם אחד ולא משחק תפקידים חד-פעמי: המידע מחולק בין השחקנים, אחד מהם משקר באישור האפליקציה, והעלילה מתקדמת יום-יום לפי הצבעת הקבוצה – מה שהופך את קבוצת הוואטסאפ עצמה לחדר החקירה.',
        en: 'Not a solo "choose what happens next" story and not a one-night role-play: information is split between players, one of them is lying with the app’s blessing, and the plot advances day by day on the group’s vote – which turns the WhatsApp group itself into the interrogation room.',
      },
      targetUsers: {
        he: ['חבורות של חברים שמפוזרים בין ערים או מדינות', 'זוגות וחברים שמחפשים משהו משותף לערבי חול', 'חובבי משחקי חשיבה, תעלומות וחדרי בריחה', 'כותבים שרוצים לפרסם סיפור אינטראקטיבי בלי לבנות אפליקציה'],
        en: ['Friend groups scattered across cities or countries', 'Couples and friends looking for something shared on weeknights', 'Fans of puzzle games, mysteries and escape rooms', 'Writers who want to publish an interactive story without building an app'],
      },
      coreFeatures: {
        he: [
          'תיקים בהמשכים של 5–7 ימים לקבוצה של 3–6 שחקנים',
          'סצנה משותפת יומית וראיות פרטיות לכל שחקן: טקסט, תמונה, הודעה קולית',
          'תפקיד סודי אחד עם מטרה משלו, שמוקצה בסתר',
          'הצבעה יומית בנקודת ההסתעפות עם מועד סיום שמקדם את העלילה גם בלי כולם',
          'לוח ראיות אישי שבו מסמנים מה שיתפתם ומה שמרתם לעצמכם',
          'גילוי בסוף השבוע: הפתרון, מי ידע מה, וניקוד לקבוצה ולמשקר',
          'מנוע סיפור מבוסס ink, שמאפשר לכותבים להוסיף תיקים חדשים',
        ],
        en: [
          'Serialised cases of 5–7 days for a group of 3–6 players',
          'A daily shared scene plus private evidence per player: text, image, voice note',
          'One secret role with its own objective, assigned in secret',
          'A daily vote at the branch point with a deadline that advances the plot even without everyone',
          'A personal evidence board to mark what you shared and what you kept to yourself',
          'The end-of-week reveal: the solution, who knew what, and scores for the group and the liar',
          'An ink-based story engine that lets writers add new cases',
        ],
      },
      screens: [
        { name: { he: 'התיקים', en: 'Cases' }, description: { he: 'ספריית תיקים עם אורך, מספר שחקנים ומצב רוח (נואר, קומי, אימה קלה), וכפתור "פתח קבוצה חדשה".', en: 'A library of cases with length, player count and mood (noir, comic, light horror), and a "start a new group" button.' } },
        { name: { he: 'לובי', en: 'Lobby' }, description: { he: 'קישור הזמנה, רשימת המצטרפים, בחירת דמות לכל אחד, וספירה לאחור ליום הראשון.', en: 'An invite link, the list of who joined, a character choice for each, and a countdown to day one.' } },
        { name: { he: 'היום', en: 'Today' }, description: { he: 'הסצנה המשותפת של היום כטקסט מעוצב, ומתחתיה המעטפה הפרטית – ראיות שרק אתם רואים, עם סימון "לא לשתף" ליד הסוד.', en: 'Today’s shared scene as styled text, and beneath it the private envelope – evidence only you see, with a "do not share" mark next to the secret.' } },
        { name: { he: 'לוח ראיות', en: 'Evidence board' }, description: { he: 'כל מה שקיבלתם עד עכשיו על לוח שחור עם מגנטים, פתק קצר ליד כל ראיה, וסימון של מה שכבר שיתפתם.', en: 'Everything you received so far on a blackboard with magnets, a short note next to each piece of evidence, and marks for what you already shared.' } },
        { name: { he: 'הצבעה', en: 'Vote' }, description: { he: 'שתיים-שלוש אפשרויות להמשך, מי כבר הצביע (בלי לחשוף מה), ומועד סיום ברור.', en: 'Two or three options for what happens next, who has already voted (without revealing how), and a clear deadline.' } },
        { name: { he: 'גילוי', en: 'Reveal' }, description: { he: 'הפתרון כסצנה אחרונה, מפת ההסתעפויות שהקבוצה עברה, חשיפת המשקר וניקוד לכל אחד.', en: 'The solution as a final scene, the map of branches the group took, the liar unmasked and a score for everyone.' } },
      ],
      userJourney: {
        he: [
          'משתמשת פותחת את התיק "לילה בפנסיון" ושולחת קישור לארבעה חברים',
          'כל אחד בוחר דמות; האפליקציה מקצה בסתר לאחד מהם את תפקיד המשקר',
          'ביום הראשון כולם קוראים את הסצנה, ואחד מהם מקבל הודעה קולית פרטית שסותרת אותה',
          'קבוצת הוואטסאפ מתפוצצת: מי שיתף מה, מי מתחמק, ולמה הוא בטוח שזה הגנן',
          'עד 21:00 ארבעה מתוך חמישה מצביעים לחקור את הגנן, והיום השני נפתח בהתאם',
          'ביום השביעי הגילוי מראה שהמשקר הצליח להסיט אותם פעמיים – ומיד פותחים תיק חדש',
        ],
        en: [
          'A user opens the case "A Night at the Guesthouse" and sends the link to four friends',
          'Everyone picks a character; the app secretly assigns one of them the liar role',
          'On day one everyone reads the scene, and one player receives a private voice note that contradicts it',
          'The WhatsApp group erupts: who shared what, who is dodging, and why he is sure it was the gardener',
          'By 21:00 four of the five vote to investigate the gardener, and day two unlocks accordingly',
          'On day seven the reveal shows the liar steered them wrong twice – and a new case is opened right away',
        ],
      },
      uxDirection: {
        he: 'תחושה של תיק חקירה פיזי: נייר בגוון קרם, טיפוגרפיה סריפית, חותמות "סודי" ואנימציית פתיחת מעטפה לראיות הפרטיות. כל תיק מביא פלטת צבעים משלו. אין פיד ואין התראות שיווקיות – רק "היום נפתח" ו"ההצבעה נסגרת בעוד שעה". מסך ההצבעה מוצג כפתק מקופל, והגילוי כסצנת סיום עם מוזיקת רקע עדינה.',
        en: 'Feels like a physical case file: cream paper, serif typography, "confidential" stamps and an envelope-opening animation for private evidence. Each case brings its own colour palette. No feed and no marketing notifications – only "today is open" and "the vote closes in an hour". The vote screen is a folded note, and the reveal is a closing scene with gentle background music.',
      },
      architecture: {
        he: 'Expo עם Expo Router ו-Reanimated לאנימציות המעטפה והלוח. התיקים נכתבים ב-ink (שפת תסריט פתוחה לסיפורים מסועפים) ומורצים בצד השרת עם inkjs, כך שהמצב של כל קבוצה – איזה ענף נבחר, מה כל שחקן כבר קיבל – נשמר ב-Supabase ואף שחקן לא יכול לראות ענפים או ראיות שלא יועדו לו. Edge Function סוגרת הצבעות במועד, מקדמת את הסיפור ושולחת פוש דרך expo-notifications. מדיה (קול, תמונות) ב-Supabase Storage עם כתובות חתומות לכל שחקן.',
        en: 'Expo with Expo Router and Reanimated for the envelope and board animations. Cases are written in ink (an open scripting language for branching stories) and executed server-side with inkjs, so each group’s state – which branch was chosen, what each player has received – lives in Supabase and no player can see branches or evidence not meant for them. An Edge Function closes votes on deadline, advances the story and sends push notifications via expo-notifications. Media (audio, images) sits in Supabase Storage behind per-player signed URLs.',
      },
      stack: ['Expo', 'Expo Router', 'Reanimated', 'ink', 'inkjs', 'Supabase', 'Supabase Storage', 'Supabase Edge Functions', 'expo-notifications'],
      database: {
        he: ['cases – תיק, כותרת, אורך בימים, טווח שחקנים, קובץ ink מהודר, מחיר', 'groups – קבוצה, תיק, יום נוכחי, מצב מנוע הסיפור', 'players – שחקן, קבוצה, דמות, האם הוא בעל התפקיד הסודי', 'deliveries – סצנה או ראיה שנמסרה לשחקן, יום, האם נצפתה', 'votes – הצבעה, קבוצה, יום, שחקן, בחירה', 'board_notes – פתקים וסימונים על לוח הראיות של כל שחקן', 'purchases – רכישת תיק, מי שילם ולאיזו קבוצה'],
        en: ['cases – case, title, length in days, player range, compiled ink file, price', 'groups – group, case, current day, story engine state', 'players – player, group, character, whether they hold the secret role', 'deliveries – a scene or piece of evidence delivered to a player, day, seen or not', 'votes – vote, group, day, player, choice', 'board_notes – notes and marks on each player’s evidence board', 'purchases – case purchase, who paid and for which group'],
      },
      auth: {
        he: 'כניסה עם Apple, Google או טלפון – שם תצוגה בלבד, בלי פרופיל ציבורי. מצטרפים לקבוצה רק דרך קישור הזמנה. ראיות פרטיות מוגשות מהשרת לפי שחקן ולעולם לא נשלחות ללקוח של שחקן אחר, גם לא בצורה מוצפנת.',
        en: 'Apple, Google or phone sign-in – display name only, no public profile. Groups are joined only through an invite link. Private evidence is served per player from the server and never sent to another player’s client, not even in encrypted form.',
      },
      monetization: {
        he: ['התיק הראשון חינם לכל קבוצה', 'רכישה חד-פעמית של תיק – קונה אחד פותח אותו לכל הקבוצה', 'חבילות של שלושה תיקים ותיקים עונתיים (חגים, קיץ)', 'חלוקת הכנסות עם כותבים חיצוניים שמפרסמים תיקים'],
        en: ['The first case is free for every group', 'One-time case purchase – one buyer unlocks it for the whole group', 'Three-case bundles and seasonal cases (holidays, summer)', 'Revenue share with outside writers who publish cases'],
      },
      mvpMilestones: {
        he: ['מנוע ink בצד השרת עם מצב לכל קבוצה ומסירה לפי שחקן', 'תיק אחד שלם של חמישה ימים, בעברית ובאנגלית', 'לובי, קישור הזמנה ובחירת דמויות', 'מסך "היום" עם מעטפה פרטית והצבעה עם מועד סיום', 'תפקיד סודי וגילוי עם ניקוד', 'רכישה חד-פעמית של תיק שני'],
        en: ['Server-side ink engine with per-group state and per-player delivery', 'One complete five-day case, in Hebrew and English', 'Lobby, invite link and character selection', 'The "today" screen with a private envelope and a deadline vote', 'The secret role and a scored reveal', 'One-time purchase of a second case'],
      },
      risks: {
        he: ['התוכן הוא המוצר: כל תיק דורש כותב, עריכה ובדיקות משחק עם קבוצות אמיתיות, וזה עולה יותר מהקוד', 'קבוצות נתקעות כשמישהו לא מגיב – מועד ההצבעה הקבוע והיכולת להמשיך בלי כולם חייבים להיות ב-MVP', 'ספוילרים: שחקן שסיים תיק עלול להרוס אותו לקבוצה אחרת, ולכן צריך ענפים מרובים וסיום שמשתנה', 'חוויה אסינכרונית של שבוע קשה לשיווק – ההדגמה חייבת להיות "משחק מהיר" של שעה'],
        en: ['Content is the product: every case needs a writer, editing and playtests with real groups, and that costs more than the code', 'Groups stall when someone goes quiet – the fixed vote deadline and the ability to proceed without everyone must ship in the MVP', 'Spoilers: a player who finished a case can ruin it for another group, so multiple branches and a variable ending are needed', 'A week-long asynchronous experience is hard to market – the demo must be a one-hour "quick play"'],
      },
      expansion: {
        he: ['מצב "ערב אחד": תיק דחוס ל-90 דקות סביב שולחן', 'כלי כתיבה לכותבים עם תצוגה מקדימה של הראיות לפי דמות', 'תיקים ממותגים לסדרות ולספרים כקמפיין שיווקי', 'מצב משפחתי עם תעלומות לילדים ובלי תפקיד משקר', 'חוטים על לוח הראיות שמחברים ראיות לחשודים, כמו בסדרות בלשים'],
        en: ['A "one evening" mode: a case compressed into 90 minutes around a table', 'An authoring tool for writers with a per-character evidence preview', 'Branded cases for TV series and books as marketing campaigns', 'A family mode with kid-friendly mysteries and no liar role', 'String on the evidence board linking evidence to suspects, detective-show style'],
      },
    },
  },
  {
    id: 'shelf-life',
    name: { he: 'Shelf Life – לראות ולקרוא לפני שזה פג', en: 'Shelf Life' },
    tagline: {
      he: 'מעקב סדרות וספרים שמתחיל מהשאלה "עד מתי?": מועד ההחזרה לספרייה, מועדון הקריאה ביום חמישי, הפרק שמשודר ביום ראשון – מול הקצב האמיתי שלכם.',
      en: 'A watch-and-read tracker built around "by when?": library due dates, Thursday’s book club, the episode airing Sunday – all checked against your real pace.',
    },
    category: 'entertainment',
    secondaryCategories: ['lifestyle', 'productivity'],
    difficulty: 'intermediate',
    effort: { weeksMin: 5, weeksMax: 7 },
    budget: 'low',
    businessModel: 'freemium',
    platforms: ['ios', 'android'],
    audience: ['consumers', 'students'],
    tags: ['tv shows', 'books', 'tracker', 'backlog', 'deadlines', 'reading pace', 'spoilers', 'library'],
    identity: { hue: 48, glyph: 'Sl', pattern: 'grid' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Shelf Life היא אפליקציית מעקב אחרי סדרות וספרים שמתייחסת לרשימת "לראות / לקרוא" כאל לוח זמנים ולא כאל ערימה אינסופית. לכל פריט יש "תאריך תפוגה": ספר שצריך לחזור לספרייה, ספר למועדון הקריאה, סדרה שהפרק הבא שלה משודר בעוד ארבעה ימים ואז כולם במשרד ידברו עליו. האפליקציה מודדת את הקצב האמיתי של המשתמש מצ׳ק-אינים קצרים (עמוד או פרק, ומתי) ומחשבת: בקצב הנוכחי הספר ייגמר ביום שלישי – שלושה ימים אחרי מועדון הקריאה. מכאן היא מציעה מה להתחיל עכשיו, מה אפשר לדחות ומה כדאי להחליף בפריט קצר יותר. במקום דירוגים ורשימות "הטובים ביותר", המסך הראשי עונה על שאלה אחת: מה לפתוח הערב כדי לא לפספס כלום.',
        en: 'Shelf Life is a tracker for TV shows and books that treats the "to watch / to read" list as a schedule, not an endless pile. Every item has an expiry: a book due back at the library, a book-club pick, a series whose next episode airs in four days, when the whole office will be talking about it. The app measures the user’s real pace from quick check-ins (a page or an episode, and when) and does the maths: at this pace the book is finished on Tuesday – three days after book club. From there it suggests what to start now, what can wait and what to swap for something shorter. Instead of ratings and "best of" lists, the home screen answers one question: what to open tonight so nothing is missed.',
      },
      problem: {
        he: 'רשימות "לראות אחר כך" רק גדלות, ובינתיים דברים פגים בשקט: הספר חוזר לספרייה חצי-קרוא, את ספר המועדון קוראים בלילה שלפני, ופרק הסיום נחשף בקבוצת העבודה לפני שהספקתם. אפליקציות מעקב קיימות סופרות מה כבר ראיתם – לא מה עומד לברוח לכם.',
        en: 'The "watch later" lists only grow while things quietly expire: the library book goes back half-read, the book-club pick gets crammed the night before, and the finale gets spoiled in the work group chat before you got there. Existing trackers count what you have already seen – not what is about to slip away.',
      },
      solution: {
        he: 'תאריך תפוגה לכל פריט (ידני, מהספרייה, ממועדון הקריאה או מלוח השידורים), מדידת קצב אמיתית מצ׳ק-אינים של שתי שניות, וחישוב "תסיים ב-" לכל פריט. מסך הבית מסדר את הערימה לפי מה שפג קודם ומה שעוד אפשר להספיק, ומציע החלפות כשהחשבון לא מסתדר.',
        en: 'An expiry per item (manual, from the library, from book club or from the broadcast schedule), real pace measurement from two-second check-ins, and a "you will finish on" estimate for every item. The home screen orders the pile by what expires first and what can still be done in time, and proposes swaps when the maths does not work out.',
      },
      usp: {
        he: 'תחזית "תסיים ב-" לבדה כבר קיימת בטיימרים של קריאה; הטוויסט של Shelf Life הוא שהמועד מגיע מבחוץ – הספרייה, מועדון הקריאה, לוח השידורים – ומסך "הערב" מסדר את הערימה מחדש לפי מה שפג קודם. האפליקציה יודעת שהספר הזה לא ייגמר לפני יום חמישי ואומרת את זה היום, לא ביום חמישי – ומתייחסת לפרק שעומד להישרף בקבוצת הוואטסאפ של העבודה בדיוק כמו למועד ההחזרה לספרייה.',
        en: 'A "you will finish on" forecast by itself already exists in reading timers; Shelf Life’s twist is that the deadline comes from outside – the library, the book club, the broadcast schedule – and the "tonight" screen re-orders the pile by what expires first. The app knows this book will not be finished before Thursday and says so today, not on Thursday – and treats the episode about to be spoiled in the work WhatsApp group exactly like a library due date.',
      },
      targetUsers: {
        he: ['קוראים שמשאילים ספרים מהספרייה הציבורית', 'חברי מועדוני קריאה עם מועד קבוע', 'צופי סדרות שרוצים להישאר לפני הספוילרים', 'סטודנטים עם רשימת קריאה ותאריכים'],
        en: ['Readers who borrow from the public library', 'Book-club members with a fixed meeting date', 'Series watchers who want to stay ahead of spoilers', 'Students with a reading list and dates'],
      },
      coreFeatures: {
        he: [
          'הוספת ספר או סדרה בחיפוש, עם מספר עמודים ואורך פרקים אמיתיים',
          'תאריך תפוגה לכל פריט: החזרה לספרייה, מועדון קריאה או תאריך שידור הפרק הבא',
          'צ׳ק-אין של שניות: "עמוד 148" או "פרק 4" – והקצב מחושב לבד',
          'תחזית "תסיים ב-" לכל פריט ואזהרה כשהיא חורגת מהתפוגה',
          'מסך "הערב" שממליץ מה לפתוח כדי שהכול יסתדר',
          'הצעות החלפה: פריט קצר יותר שנכנס בזמן שנשאר',
          'ארכיון שמראה מה הספקתם בזמן ומה פג – בלי שיפוטיות',
        ],
        en: [
          'Add a book or series via search, with real page counts and episode lengths',
          'An expiry per item: library return, book club, or the next episode’s air date',
          'Two-second check-ins: "page 148" or "episode 4" – pace is computed automatically',
          'A "you will finish on" forecast per item and a warning when it passes the expiry',
          'A "tonight" screen recommending what to open so everything fits',
          'Swap suggestions: a shorter item that fits the remaining time',
          'An archive showing what you finished in time and what expired – without judgement',
        ],
      },
      screens: [
        { name: { he: 'הערב', en: 'Tonight' }, description: { he: 'מסך הבית: שניים-שלושה פריטים מומלצים להערב עם הסיבה ("פג בעוד 3 ימים", "פרק חדש ביום ראשון") ואורך משוער של הישיבה.', en: 'Home: two or three picks for tonight with the reason ("expires in 3 days", "new episode Sunday") and the estimated length of the sitting.' } },
        { name: { he: 'המדף', en: 'The shelf' }, description: { he: 'כל הפריטים הפעילים ממוינים לפי תפוגה, עם פס התקדמות ותחזית סיום בירוק או בכתום.', en: 'All active items sorted by expiry, with a progress bar and a finish forecast in green or amber.' } },
        { name: { he: 'פריט', en: 'Item' }, description: { he: 'עטיפה, תפוגה ומקורה, גרף של הצ׳ק-אינים, הקצב הממוצע וכפתור צ׳ק-אין מהיר.', en: 'Cover, expiry and its source, a graph of check-ins, the average pace and a quick check-in button.' } },
        { name: { he: 'צ׳ק-אין', en: 'Check-in' }, description: { he: 'גלגלת למספר העמוד או לפרק, שדה אופציונלי "כמה זמן זה לקח", ואישור בלחיצה אחת.', en: 'A wheel for the page number or episode, an optional "how long did it take" field, and a one-tap confirm.' } },
        { name: { he: 'הוספה', en: 'Add' }, description: { he: 'חיפוש ספרים וסדרות, בחירת מקור התפוגה (ספרייה / מועדון / שידור / ידני) ותאריך.', en: 'Search for books and series, choose the expiry source (library / club / broadcast / manual) and the date.' } },
        { name: { he: 'ארכיון', en: 'Archive' }, description: { he: 'מה הסתיים בזמן ומה פג, לפי חודשים, עם סיכום קצב שנתי ובלי כוכבים.', en: 'What finished in time and what expired, by month, with a yearly pace summary and no stars.' } },
      ],
      userJourney: {
        he: [
          'המשתמש מוסיף ספר של 420 עמודים שחוזר לספרייה בעוד 12 ימים',
          'אחרי שלושה ערבים של צ׳ק-אינים האפליקציה מחשבת 28 עמודים לישיבה ומזהירה: "תסיים יומיים אחרי המועד"',
          'מסך "הערב" מציע להשהות את הסדרה שאין לה תפוגה ולקרוא ארבעה ערבים ברצף',
          'במקביל מתווסף פרק חדש בסדרה שהוא עוקב אחריה, עם תפוגה ביום ראשון בערב',
          'ביום חמישי הוא מסיים את הספר יום לפני ההחזרה, ובשבת מסמן את הפרק החמישי',
          'הארכיון מראה חודש שלם בלי פריט שפג, וההמלצה הבאה כבר מחכה',
        ],
        en: [
          'The user adds a 420-page book due back at the library in 12 days',
          'After three evenings of check-ins the app computes 28 pages per sitting and warns: "you will finish two days after the due date"',
          'The "tonight" screen suggests pausing the series with no expiry and reading four evenings in a row',
          'Meanwhile a new episode of a series he follows is added, expiring Sunday evening',
          'On Thursday he finishes the book a day before the return date, and on Saturday ticks off episode five',
          'The archive shows a full month with nothing expired, and the next pick is already waiting',
        ],
      },
      uxDirection: {
        he: 'מדף ספרים שקט: רקע בגוון נייר, עטיפות אמיתיות בגודל נדיב, וצבע אחד – כתום – לכל מה שעומד לפוג. הצ׳ק-אין חייב להיות מהיר יותר מפתיחת הספר: לחיצה אחת מהמסך הראשי, גלגלת, אישור. בלי סטרייקים ובלי "השבוע קראת פחות" – הטון הוא של ספרן ידידותי שמזכיר, לא של מאמן.',
        en: 'A quiet bookshelf: paper-toned background, real covers at a generous size, and a single colour – amber – for anything about to expire. Checking in must be faster than opening the book: one tap from the home screen, a wheel, confirm. No streaks and no "you read less this week" – the tone is a friendly librarian who reminds, not a coach.',
      },
      architecture: {
        he: 'Expo עם Expo Router ו-expo-sqlite לאחסון מקומי – האפליקציה עובדת במלואה בלי חשבון. מטא-דאטה של ספרים מ-Open Library או Google Books, ושל סדרות (אורך פרקים ותאריכי שידור) מ-TMDB. חישוב הקצב והתחזית הוא פונקציה טהורה במכשיר: ממוצע משוקלל של הצ׳ק-אינים האחרונים מול העמודים או הפרקים שנותרו, עם "ימים טיפוסיים" שהמשתמש מגדיר. expo-notifications לתזכורת בערב שלפני תפוגה. Supabase רק לסנכרון אופציונלי בין מכשירים ולמשתמשי פרימיום.',
        en: 'Expo with Expo Router and expo-sqlite for local storage – the app works fully without an account. Book metadata from Open Library or Google Books, and series data (episode lengths and air dates) from TMDB. Pace and forecast are a pure on-device function: a weighted average of recent check-ins against the pages or episodes left, with "typical days" the user defines. expo-notifications for a reminder the evening before an expiry. Supabase only for optional cross-device sync and premium users.',
      },
      stack: ['Expo', 'Expo Router', 'expo-sqlite', 'expo-notifications', 'TMDB API', 'Open Library API', 'Supabase'],
      database: {
        he: ['items – פריט, סוג (ספר / סדרה), כותרת, עמודים או פרקים, מקור המטא-דאטה', 'expiries – תפוגה, פריט, סוג (ספרייה / מועדון / שידור / ידני), תאריך', 'checkins – צ׳ק-אין, פריט, עמוד או פרק, זמן, משך אופציונלי', 'forecasts – תחזית סיום מחושבת לכל פריט ומועד החישוב', 'settings – ימים טיפוסיים, שעת תזכורת, העדפות תצוגה'],
        en: ['items – item, type (book / series), title, pages or episodes, metadata source', 'expiries – expiry, item, type (library / club / broadcast / manual), date', 'checkins – check-in, item, page or episode, time, optional duration', 'forecasts – computed finish forecast per item and when it was computed', 'settings – typical days, reminder hour, display preferences'],
      },
      auth: {
        he: 'ללא חשבון כברירת מחדל – הכול נשמר במכשיר. כניסה עם Apple או Google רק למי שרוצה סנכרון בין הטלפון לטאבלט, ואז הנתונים מוגנים ב-RLS לפי משתמש.',
        en: 'No account by default – everything stays on the device. Apple or Google sign-in only for people who want sync between phone and tablet, and then data is protected with per-user RLS.',
      },
      monetization: {
        he: ['חינם: עד חמישה פריטים פעילים עם תפוגה', 'פרימיום שנתי: פריטים ללא הגבלה, סנכרון, ייבוא מרשימות קיימות ווידג׳ט', 'שיתוף פעולה עם ספריות ציבוריות: ייבוא אוטומטי של מועדי החזרה'],
        en: ['Free: up to five active items with an expiry', 'Annual premium: unlimited items, sync, import from existing lists and a widget', 'Partnerships with public libraries: automatic import of due dates'],
      },
      mvpMilestones: {
        he: ['הוספת ספרים וסדרות עם מטא-דאטה אמיתית', 'תפוגה לכל פריט וצ׳ק-אין מהיר', 'חישוב קצב ותחזית סיום עם אזהרה', 'מסך "הערב" עם המלצות והחלפות', 'תזכורות לפני תפוגה', 'ארכיון ומסך תשלום לפרימיום'],
        en: ['Add books and series with real metadata', 'An expiry per item and a quick check-in', 'Pace computation and finish forecast with a warning', 'The "tonight" screen with picks and swaps', 'Reminders before an expiry', 'Archive and premium paywall'],
      },
      risks: {
        he: ['תחזית על סמך שני צ׳ק-אינים תהיה שגויה – להציג טווח ולא תאריך אחד עד שיש מספיק נתונים', 'אפליקציה שאומרת "לא תספיק" עלולה להלחיץ – הטון והאפשרות להסיר תפוגה חייבים להיות עדינים', 'תאריכי שידור משתנים ושירותי סטרימינג משחררים עונות שלמות בבת אחת – התפוגה לסדרות צריכה להיות גמישה', 'ספריות ציבוריות לרוב לא חושפות API – מועד ההחזרה נשאר ידני בהתחלה'],
        en: ['A forecast made from two check-ins will be wrong – show a range rather than a single date until there is enough data', 'An app that says "you will not make it" can feel stressful – the tone and the option to remove an expiry must be gentle', 'Air dates shift and streaming services drop whole seasons at once – series expiries need to be flexible', 'Public libraries rarely expose an API – the return date stays manual at first'],
      },
      expansion: {
        he: ['תפוגה חברתית: חברים באפליקציה מסמנים איפה הם, והאפליקציה מחשבת מתי הקבוצה "תעקוף" אתכם', 'ייבוא מ-Goodreads, מ-Letterboxd ומאפליקציות מעקב סדרות', 'מצב מועדון קריאה: חברי המועדון רואים את ההתקדמות של כולם לפני הפגישה', 'פודקאסטים ומשחקים כפריטים עם אורך ידוע'],
        en: ['Social expiry: friends in the app mark where they are and the app computes when the group will "pass" you', 'Import from Goodreads, Letterboxd and series trackers', 'A book-club mode where members see everyone’s progress before the meeting', 'Podcasts and games as items with a known length'],
      },
    },
  },
  {
    id: 'deep-cut',
    name: { he: 'Deep Cut – בינגו של ההופעה', en: 'Deep Cut' },
    tagline: {
      he: 'בינגו לרשימת השירים של ההופעה: בוחרים אמן, מקבלים כרטיס של 25 שירים – להיטים בטוחים לצד דיפ-קאטס – ומסמנים תוך כדי. קוד אחד מחלק כרטיסים לכל החבר׳ה.',
      en: 'Setlist bingo for the show: pick the artist, get a 25-song card of sure-thing hits and deep cuts, tick them off live, and one code lets the whole crew play.',
    },
    category: 'entertainment',
    secondaryCategories: ['games', 'social'],
    difficulty: 'beginner',
    effort: { weeksMin: 2, weeksMax: 3 },
    budget: 'free',
    businessModel: 'free',
    platforms: ['cross-platform'],
    audience: ['consumers'],
    tags: ['concerts', 'setlist', 'bingo', 'music', 'live music', 'party game', 'friends', 'offline'],
    identity: { hue: 320, glyph: 'Dc', pattern: 'ring' },
    flags: { beginnerFriendly: true, profitPotential: 'low', experimental: false, trending: false, featuredWeight: 2 },
    spec: {
      overview: {
        he: 'Deep Cut הופכת את ההמתנה להופעה, ואת ההופעה עצמה, למשחק קטן בין חברים. בוחרים אמן, והאפליקציה מושכת את הקטלוג שלו ממאגר מוזיקה פתוח ובונה כרטיס בינגו של 25 שירים: כמה "להיטים בטוחים" שהמשתמש מסמן בעצמו, והשאר שירים פחות מוכרים (דיפ-קאטס) שההגרלה בוחרת. במהלך ההופעה מסמנים כל שיר שמנוגן, והכרטיס חוגג שורה, עמודה או אלכסון. הטריק שמאפשר לכל החבר׳ה לשחק בלי שרת: מי שיוצר את המשחק מקבל קישור עם קוד של שש אותיות, וכל מי שפותח אותו – בטלפון או בדפדפן – מסמן "בטוחים" משלו ומקבל כרטיס משלו מאותו מאגר שירים, שנגזר מהקוד ומהשם שלו בצורה דטרמיניסטית. בסוף הערב משתפים תמונה של הכרטיס עם השירים שנוגנו, ומי שצעק "בינגו" ראשון זוכה בסיבוב הבא בבר.',
        en: 'Deep Cut turns a concert – and the wait for it – into a small game among friends. Pick an artist and the app pulls their catalogue from an open music database and builds a 25-song bingo card: a few "sure-thing hits" you mark yourself, the rest random deep cuts. During the show you tick each song as it plays, and the card celebrates a row, column or diagonal. The trick that lets everyone play with no server: the game’s creator gets a share link with a six-letter code, and anyone who opens it – phone or browser – marks their own "sure" songs and gets their own card from the same pool, derived deterministically from the code and their name. Afterwards you share the card with the played songs marked, and whoever shouted "bingo" first wins the next round at the bar.',
      },
      problem: {
        he: 'ההמתנה להופעה ארוכה, החוויה באולם היא של כל אחד לעצמו, והוויכוח "הם ינגנו את השיר הישן?" נגמר תמיד בלי מנצח ברור. משחקים לנייד לא יודעים כלום על ההופעה שאתם עומדים בה.',
        en: 'The wait before a show is long, the experience in the hall is everyone on their own, and the argument "will they play the old one?" never ends with a clear winner. Mobile games know nothing about the concert you are standing in.',
      },
      solution: {
        he: 'כרטיס בינגו שנבנה מהקטלוג האמיתי של האמן, עם שליטה של המשתמש על מה נחשב "בטוח", קוד משותף שמחלק כרטיסים שונים מאותו מאגר בלי שרת, וסימון בלחיצה אחת שעובד גם בלי קליטה באולם.',
        en: 'A bingo card built from the artist’s real catalogue, with the user deciding what counts as "sure", a shared code that deals different cards from the same pool without a server, and one-tap ticking that works even with no reception in the venue.',
      },
      usp: {
        he: 'לא עוד מחולל כרטיסי בינגו גנרי לאינטרנט: הכרטיסים נבנים מהקטלוג האמיתי של האמן ונגזרים מקוד משותף ולא משרת, ולכן הכול עובד אופליין בתוך האולם, בלי הרשמה ובלי עלויות שוטפות – ועדיין כל החבר׳ה משחקים על אותו מאגר שירים עם כרטיסים שונים.',
        en: 'Not another generic web bingo-card generator: cards are built from the artist’s real catalogue and derived from a shared code rather than a server, so everything works offline inside the venue, with no sign-up and no running costs – and the whole crew still plays off the same song pool with different cards.',
      },
      targetUsers: {
        he: ['חבורות שהולכות להופעות ביחד', 'מעריצים שמכירים את הקטלוג לעומק ורוצים לבדוק את הניחושים שלהם', 'מפתחים מתחילים שמחפשים פרויקט ראשון קטן ומשעשע'],
        en: ['Friend groups that go to concerts together', 'Fans who know the catalogue deeply and want to test their predictions', 'Beginner developers looking for a small, fun first project'],
      },
      coreFeatures: {
        he: [
          'חיפוש אמן ומשיכת הקטלוג ממאגר מוזיקה פתוח',
          'סימון "להיטים בטוחים" שתמיד נכנסים לכרטיס, והשאר בהגרלה',
          'כרטיס 5×5 עם סימון בלחיצה וזיהוי שורה, עמודה ואלכסון',
          'קוד משחק של שש אותיות שמחלק כרטיסים שונים מאותו מאגר',
          'עבודה מלאה אופליין אחרי שהקטלוג נטען',
          'שיתוף תמונה של הכרטיס הסופי עם סימון השירים שנוגנו',
          'היסטוריית הופעות עם הכרטיסים הישנים',
        ],
        en: [
          'Artist search and catalogue fetch from an open music database',
          'Mark "sure-thing hits" that always make the card, the rest is drawn',
          'A 5×5 card with one-tap ticking and row, column and diagonal detection',
          'A six-letter game code that deals different cards from the same pool',
          'Fully offline once the catalogue is loaded',
          'Share an image of the final card with the played songs marked',
          'A history of shows with the old cards',
        ],
      },
      screens: [
        { name: { he: 'בחירת אמן', en: 'Pick an artist' }, description: { he: 'שדה חיפוש גדול, תוצאות עם תמונה ושנות פעילות, וההופעות האחרונות שלכם למטה.', en: 'A big search field, results with a picture and active years, and your recent shows at the bottom.' } },
        { name: { he: 'בטוחים', en: 'Sure things' }, description: { he: 'הקטלוג כרשימה עם צ׳יפים לסימון עד חמישה שירים "בטוחים", וכפתור "צור משחק".', en: 'The catalogue as a list with chips to mark up to five "sure" songs, and a "create game" button.' } },
        { name: { he: 'הכרטיס', en: 'The card' }, description: { he: 'רשת 5×5 במסך מלא, הקשה לסימון עם רטט, קוד המשחק בכותרת ואנימציית בינגו.', en: 'A full-screen 5×5 grid, tap to tick with haptics, the game code in the header and a bingo animation.' } },
        { name: { he: 'הצטרפות', en: 'Join' }, description: { he: 'פתיחת הקישור, או חיפוש האמן והקלדת הקוד בשישה תאים; שם שחקן, סימון ה"בטוחים" שלכם – והכרטיס נוצר מיד.', en: 'Open the link, or search the artist and type the code into six boxes; a player name, your own "sure" picks – and the card appears instantly.' } },
        { name: { he: 'סיכום', en: 'Recap' }, description: { he: 'הכרטיס הסופי כתמונה לשיתוף, כמה שירים ניחשתם, ומי בחבורה סגר בינגו ראשון לפי מה שדיווחו.', en: 'The final card as a shareable image, how many songs you guessed, and who in the crew got bingo first as reported.' } },
      ],
      userJourney: {
        he: [
          'שעה לפני ההופעה משתמש מחפש את האמן ומסמן ארבעה שירים בטוחים',
          'הוא מקבל כרטיס וקישור עם הקוד, ושולח אותו לקבוצת הוואטסאפ',
          'שלושה חברים פותחים את הקישור, מסמנים "בטוחים" משלהם ומקבלים כרטיסים שונים מאותו מאגר',
          'במהלך ההופעה כל אחד מסמן תוך כדי; בשיר התשיעי מישהי סוגרת אלכסון',
          'בסוף הערב כולם משתפים את תמונת הכרטיס, ומי שניחש הכי הרבה דיפ-קאטס זוכה בכבוד',
        ],
        en: [
          'An hour before the show a user searches for the artist and marks four sure songs',
          'He gets a card and a link with the code, and drops it in the WhatsApp group',
          'Three friends open the link, mark their own sure songs and get different cards from the same pool',
          'During the show everyone ticks along; on song nine someone closes a diagonal',
          'At the end of the night everyone shares their card image, and whoever guessed the most deep cuts takes the glory',
        ],
      },
      uxDirection: {
        he: 'רועש וחשוך כמו אולם הופעות: רקע שחור, תאים גדולים עם טקסט לבן, וצבע ניאון אחד לסימון שמגיע עם רטט. הכול חייב לעבוד ביד אחת, בחושך ובצפיפות – בלי תפריטים עמוקים. הקוד מוצג באותיות ענק כדי שאפשר להראות אותו לחבר במקום לצעוק.',
        en: 'Loud and dark like a concert hall: black background, large cells with white text, and one neon colour for ticks that lands with haptics. Everything must work one-handed, in the dark and in a crowd – no deep menus. The code is shown in giant letters so it can be flashed at a friend instead of shouted.',
      },
      architecture: {
        he: 'אפליקציית Expo אחת לנייד ולווב, בלי שרת. הקטלוג נמשך מ-MusicBrainz (API ציבורי וחינמי) ונשמר במכשיר. קוד המשחק הוא זרע אקראי של שש אותיות ותו לא – קצר מכדי להכיל מזהה אמן – ולכן קישור השיתוף נושא את מזהה האמן ב-MusicBrainz יחד עם הקוד, ומי שמקליד את הקוד ידנית מחפש קודם את האמן. מזהה האמן והקוד מזינים מחולל מספרים דטרמיניסטי שקובע את מאגר השירים המשותף, ושם השחקן מזין את ההגרלה של הכרטיס שלו מתוך המאגר – כך כל שחקן מקבל כרטיס שונה בלי שום תקשורת, וה"בטוחים" שסימן נכנסים לכרטיס שלו בלבד. סימונים והיסטוריה ב-AsyncStorage; שיתוף תמונה עם react-native-view-shot ו-expo-sharing.',
        en: 'One Expo app for mobile and web, with no server. The catalogue is fetched from MusicBrainz (a free public API) and cached on the device. The game code is a six-letter random seed and nothing more – too short to carry an artist id – so the share link carries the MusicBrainz artist id together with the code, and anyone typing the code by hand searches the artist first. Artist id plus code seed a deterministic random generator that fixes the shared song pool, and the player’s name seeds the draw of their own card from that pool – so every player gets a different card with no communication at all, and the "sure" songs they marked land on their card only. Ticks and history live in AsyncStorage; image sharing uses react-native-view-shot with expo-sharing.',
      },
      stack: ['Expo', 'Expo Router', 'MusicBrainz API', 'AsyncStorage', 'react-native-view-shot', 'expo-sharing', 'expo-haptics'],
      database: {
        he: ['artists – אמן שנשמר, מזהה MusicBrainz, הקטלוג שנמשך (מקומי)', 'games – משחק, אמן, קוד, תאריך (מקומי)', 'cards – כרטיס, משחק, שם שחקן, השירים ה"בטוחים" שסומנו, 25 השירים והסימונים (מקומי)'],
        en: ['artists – saved artist, MusicBrainz id, fetched catalogue (local)', 'games – game, artist, code, date (local)', 'cards – card, game, player name, the marked "sure" songs, the 25 songs and their ticks (local)'],
      },
      auth: {
        he: 'ללא חשבון, ללא שרת וללא איסוף נתונים. הקוד המשותף הוא כל מה שצריך כדי לשחק ביחד.',
        en: 'No account, no server and no data collection. The shared code is all it takes to play together.',
      },
      monetization: {
        he: ['חינם לגמרי – פרויקט פורטפוליו שנועד לאסוף משוב', 'בהמשך: רכישה חד-פעמית של ערכות נושא וכרטיסים מעוצבים לשיתוף', 'שיתוף פעולה עם אולמות או אמנים לכרטיסים ממותגים לסיבוב הופעות'],
        en: ['Completely free – a portfolio project built to gather feedback', 'Later: a one-time purchase of themes and designed cards for sharing', 'Partnerships with venues or artists for branded tour cards'],
      },
      mvpMilestones: {
        he: ['חיפוש אמן ומשיכת קטלוג מ-MusicBrainz', 'כרטיס 5×5 עם סימון וזיהוי בינגו', 'קוד משחק דטרמיניסטי והצטרפות', 'שיתוף תמונה של הכרטיס', 'היסטוריית הופעות'],
        en: ['Artist search and catalogue fetch from MusicBrainz', 'A 5×5 card with ticking and bingo detection', 'Deterministic game code and joining', 'Card image sharing', 'Show history'],
      },
      risks: {
        he: ['קטלוגים גדולים כוללים גרסאות חיות ורמיקסים – צריך סינון כפילויות לפי שם השיר', 'MusicBrainz מגביל את קצב הבקשות ודורש כותרת User-Agent תקינה – לכבד זאת ולשמור במטמון', 'אולמות בלי קליטה: כל מה שאחרי יצירת הכרטיס חייב לעבוד אופליין'],
        en: ['Large catalogues include live versions and remixes – duplicates must be filtered by song title', 'MusicBrainz rate-limits requests and requires a proper User-Agent header – respect it and cache', 'Venues with no reception: everything after card creation must work offline'],
      },
      expansion: {
        he: ['ייבוא רשימות שירים מההופעות האחרונות בסיבוב כדי לכייל מה "בטוח"', 'מצב פסטיבל עם כרטיס לכל אמן בכל יום', 'מצב מקוון אופציונלי: מי באמת סגר בינגו ראשון, עם Supabase Realtime'],
        en: ['Import setlists from recent shows on the tour to calibrate what is "sure"', 'A festival mode with a card per artist per day', 'An optional online mode: who truly got bingo first, with Supabase Realtime'],
      },
    },
  },
];
