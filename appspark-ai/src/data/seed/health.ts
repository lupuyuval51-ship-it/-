import type { Idea } from '../types';

/**
 * Health & Fitness – habits, training, nutrition, sleep and mental wellbeing.
 * Every idea here is a behaviour tool, not a medical device: no diagnoses,
 * no treatment claims, no "clinically proven" copy.
 */
export const ideas: Idea[] = [
  {
    id: 'relay',
    name: { he: 'Relay – מרוץ שליחים', en: 'Relay' },
    tagline: {
      he: 'מרוץ שליחים בין חברים: מי שמחזיק את המקל יוצא לאימון ומעביר אותו הלאה, והקבוצה מתקדמת יחד על מסלול אמיתי – בלי טבלת מובילים.',
      en: 'A relay race between friends: whoever holds the baton trains and passes it on, and the team advances together along a real route – no leaderboard.',
    },
    category: 'health',
    secondaryCategories: ['social', 'games'],
    difficulty: 'intermediate',
    effort: { weeksMin: 6, weeksMax: 8 },
    budget: 'low',
    businessModel: 'freemium',
    platforms: ['ios', 'android'],
    audience: ['consumers', 'teams'],
    tags: ['fitness', 'running', 'walking', 'relay', 'team', 'social', 'game', 'apple health'],
    identity: { hue: 18, glyph: 'Ry', pattern: 'diagonal' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: true, trending: true, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Relay הופכת אימון לעניין קבוצתי בלי להפוך אותו לתחרות. חברים מקימים קבוצה של שלושה עד שישה אנשים ובוחרים מסלול אמיתי על המפה – למשל מאילת למטולה. בכל רגע רק אדם אחד מחזיק את "המקל": הוא צריך לצאת לריצה, להליכה או לרכיבה תוך 36 שעות, והמרחק שעשה מזיז את כל הקבוצה קדימה על המסלול. כשהוא מסיים, המקל עובר לחבר הבא. אם המקל נופל, הקבוצה לא נענשת בנקודות אלא עושה מעקף קצר – ההפסד משותף, כמו ההישג. אין טבלת מובילים: המספרים היחידים שמוצגים הם כמה מסירות הקבוצה השלימה ברצף ואיפה היא על המפה. האימונים מסתנכרנים אוטומטית מ-Apple Health או מ-Health Connect, כך שכל אחד תורם בקצב שלו – הליכה של עשרים דקות נחשבת מסירה מוצלחת בדיוק כמו ריצה של עשרה קילומטרים.',
        en: 'Relay turns training into a group affair without turning it into a competition. Friends form a team of three to six and pick a real route on the map – say, Eilat to Metula. Only one person holds the "baton" at a time: they have 36 hours to run, walk or ride, and the distance they cover moves the whole team along the route. Then the baton passes to the next teammate. If it drops, nobody is docked points – the team takes a short detour, so the setback is shared just like the progress. There is no leaderboard: the only numbers shown are how many hand-offs the team has completed in a row and where it is on the map. Workouts sync from Apple Health or Health Connect, so everyone contributes at their own pace – a twenty-minute walk is a completed hand-off exactly like a ten-kilometre run.',
      },
      problem: {
        he: 'אפליקציות כושר חברתיות בנויות על טבלאות מובילים, וטבלאות מובילים מדרבנות רק את מי שכבר בראש. מי שמתחיל, איטי או עסוק רואה את עצמו בתחתית ומהר מאוד מוותר. אתגרי צעדים במקומות עבודה מתים מאותה סיבה: אותם שלושה רצים מנצחים כל חודש.',
        en: 'Social fitness apps are built on leaderboards, and leaderboards only motivate the people already at the top. Beginners, slow movers and busy people see themselves at the bottom and soon give up. Workplace step challenges die for the same reason: the same three runners win every month.',
      },
      solution: {
        he: 'מכניקת מרוץ שליחים שבה האחריות עוברת מאדם לאדם: לא "מי עשה הכי הרבה" אלא "האם לא הפלת את המקל". כל אימון, בכל עוצמה, נחשב מסירה מוצלחת, וההתקדמות נמדדת רק ברמת הקבוצה – על מסלול אמיתי שכולם רואים על המפה.',
        en: 'A relay mechanic where responsibility passes from person to person: not "who did the most" but "did you keep the baton moving". Any workout at any intensity counts as a successful hand-off, and progress is measured only at team level – along a real route everyone can see on the map.',
      },
      usp: {
        he: 'לחץ חברתי חיובי במקום תחרות: יוצאים לאימון כי החברים מחכים למקל, לא כדי לעקוף אותם. מסלולים אמיתיים, מעקפים במקום עונשים ואפס טבלאות מובילים – מה שמחזיק גם את החבר שהולך ולא רץ.',
        en: 'Positive social pressure instead of competition: you train because your friends are waiting for the baton, not to beat them. Real routes, detours instead of penalties and zero leaderboards – which keeps the friend who walks rather than runs.',
      },
      targetUsers: {
        he: ['חברים שרוצים להתאמן יחד אבל גרים בערים שונות', 'מתחילים שאפליקציות תחרותיות מייאשות אותם', 'צוותים במקומות עבודה שמחפשים אתגר שלא תמיד אותם אנשים מנצחים בו'],
        en: ['Friends who want to train together but live in different cities', 'Beginners who find competitive apps discouraging', 'Workplace teams looking for a challenge the same people do not always win'],
      },
      coreFeatures: {
        he: [
          'הקמת קבוצה של 3–6 חברים ובחירת מסלול אמיתי על המפה',
          'מקל אחד בכל רגע, עם טיימר של 36 שעות ותזכורות עדינות',
          'סנכרון אוטומטי של אימונים מ-Apple Health ומ-Health Connect, או רישום ידני',
          'מעקף משותף במקום עונש כשהמקל נופל',
          'מפת התקדמות חיה עם נקודות ציון ו"תחנות" שהקבוצה חוגגת יחד',
          'עידוד בלחיצה אחת למי שמחזיק את המקל, בלי צ׳אט פתוח',
          'סיכום שבועי קבוצתי: מסירות ברצף, קילומטרים משותפים, מי העביר למי',
        ],
        en: [
          'Create a team of 3–6 friends and pick a real route on the map',
          'One baton at a time, with a 36-hour timer and gentle reminders',
          'Automatic workout sync from Apple Health and Health Connect, or manual logging',
          'A shared detour instead of a penalty when the baton drops',
          'A live progress map with landmarks and "stages" the team celebrates together',
          'One-tap encouragement for the baton holder, with no open chat',
          'Weekly team recap: hand-offs in a row, shared kilometres, who passed to whom',
        ],
      },
      screens: [
        { name: { he: 'המפה', en: 'Route map' }, description: { he: 'מסך הבית: המסלול על המפה, מיקום הקבוצה, מי מחזיק את המקל כרגע וכמה זמן נשאר לו.', en: 'The home screen: the route on the map, the team’s position, who holds the baton right now and how much time they have left.' } },
        { name: { he: 'המקל אצלי', en: 'Your leg' }, description: { he: 'כשהמקל אצלך: טיימר גדול, כפתור "יצאתי לאימון", והאימונים שזוהו מהטלפון מחכים לאישור.', en: 'When the baton is yours: a big timer, a "heading out" button, and workouts detected from the phone waiting to be confirmed.' } },
        { name: { he: 'מסירה', en: 'Hand-off' }, description: { he: 'אחרי האימון: סיכום המרחק, בחירה למי להעביר (או לפי סדר קבוע), והודעת עידוד קצרה לחבר הבא.', en: 'After the workout: the distance summary, choosing who to pass to (or a fixed order), and a short cheer for the next runner.' } },
        { name: { he: 'הקבוצה', en: 'Team' }, description: { he: 'רשימת החברים עם סטטוס (מחזיק, ממתין, במעקף), היסטוריית המסירות והרצף הנוכחי.', en: 'Teammates with status (holding, waiting, on detour), the hand-off history and the current streak.' } },
        { name: { he: 'תחנה', en: 'Stage finish' }, description: { he: 'מסך חגיגה כשהקבוצה מגיעה לנקודת ציון: תמונת המקום, מי תרם מה, וכרטיס שיתוף לקבוצת הוואטסאפ.', en: 'A celebration screen when the team reaches a landmark: a photo of the place, who contributed what, and a share card for the WhatsApp group.' } },
        { name: { he: 'הגדרות קבוצה', en: 'Team settings' }, description: { he: 'משך המקל, סוגי האימון שנחשבים, סדר המסירה והזמנת חברים בקישור.', en: 'Baton duration, which activity types count, hand-off order and inviting friends by link.' } },
      ],
      userJourney: {
        he: [
          'דנה מקימה קבוצה עם ארבעה חברים מהצבא ובוחרת את מסלול "מאילת למטולה"',
          'המקל מתחיל אצלה; היא יוצאת להליכה של 4 ק"מ והאפליקציה מזהה אותה מ-Apple Health',
          'היא מאשרת את המסירה ליונתן ושולחת לו "תורך, אל תפיל"',
          'יונתן מתעכב, מקבל תזכורת בשעה ה-30, ורץ 6 ק"מ בלילה',
          'אחרי שבועיים הקבוצה מגיעה לתחנת "ים המלח" ומשתפת את כרטיס החגיגה',
          'כשאיתי מפיל את המקל, הקבוצה עושה מעקף של 10 ק"מ – ואף אחד לא יורד בדירוג, כי אין דירוג',
        ],
        en: [
          'Dana sets up a team with four friends from her army days and picks the "Eilat to Metula" route',
          'The baton starts with her; she walks 4 km and the app detects it from Apple Health',
          'She confirms the hand-off to Yonatan and sends him "your turn, don’t drop it"',
          'Yonatan stalls, gets a reminder at hour 30, and runs 6 km that night',
          'Two weeks later the team reaches the "Dead Sea" stage and shares the celebration card',
          'When Itai drops the baton, the team takes a 10 km detour – and nobody falls in the ranking, because there is none',
        ],
      },
      uxDirection: {
        he: 'תחושה של מסע ולא של דשבורד: המפה היא המסך הראשי, בצבעי אדמה חמים, והקבוצה מיוצגת כנקודה אחת שזזה – לא חמש נקודות. המקל הוא אובייקט פיזי: אנימציה של מסירה מיד ליד, רטט בקבלה, וטיימר שמחליף צבע בהדרגה במקום להבהב באדום. בלי מספרים אישיים במסכים משותפים.',
        en: 'Feels like a journey, not a dashboard: the map is the main screen, in warm earth tones, and the team is one moving dot – not five. The baton is a physical object: a hand-to-hand pass animation, haptics on receipt, and a timer that shifts colour gradually instead of flashing red. No personal numbers on shared screens.',
      },
      architecture: {
        he: 'Expo עם Expo Router ו-react-native-maps למסלול. קריאת אימונים דרך מודולים קהילתיים ל-HealthKit ול-Health Connect (דורש development build), עם רישום ידני כחלופה. Supabase מחזיק קבוצות, מסלולים, מצב המקל והיסטוריית מסירות; Supabase Realtime מעדכן את כולם כשהמקל עובר. Edge Function שרצה ב-cron מטפלת בתזכורות של 36 שעות ובנפילת המקל, כדי שהלוגיקה לא תהיה תלויה בטלפון של מי שמחזיק אותו. המסלולים הם קובצי GeoJSON סטטיים עם נקודות ציון.',
        en: 'Expo with Expo Router and react-native-maps for the route. Workouts are read through community modules for HealthKit and Health Connect (requires a development build), with manual logging as the fallback. Supabase holds teams, routes, baton state and hand-off history; Supabase Realtime updates everyone when the baton moves. An Edge Function on a cron schedule handles the 36-hour reminders and baton drops, so the logic never depends on the holder’s phone. Routes are static GeoJSON files with landmarks.',
      },
      stack: ['Expo', 'Expo Router', 'react-native-maps', 'react-native-health', 'react-native-health-connect', 'Supabase', 'Supabase Realtime', 'Supabase Edge Functions', 'expo-notifications'],
      database: {
        he: ['profiles – משתמש, שם תצוגה, מקור נתוני הכושר', 'teams – קבוצה, מסלול, משך מקל, סדר מסירה', 'members – שיוך משתמש לקבוצה וסטטוס נוכחי', 'routes – מסלול, GeoJSON, נקודות ציון ומרחק כולל', 'legs – מקטע: מי החזיק, מתי קיבל, מרחק, הושלם / נפל', 'workouts – אימונים שסונכרנו או נרשמו ידנית', 'cheers – עידודים שנשלחו למחזיק המקל'],
        en: ['profiles – user, display name, fitness data source', 'teams – team, route, baton duration, hand-off order', 'members – user-to-team membership and current status', 'routes – route, GeoJSON, landmarks and total distance', 'legs – a leg: who held, when received, distance, completed / dropped', 'workouts – synced or manually logged workouts', 'cheers – encouragements sent to the baton holder'],
      },
      auth: {
        he: 'כניסה עם Apple ו-Google, והצטרפות לקבוצה דרך קישור הזמנה. נתוני אימונים הם מידע בריאותי – נשמרים רק המרחק והמשך של כל אימון, לא מסלול ה-GPS, ו-RLS מגביל כל חבר לקבוצות שלו בלבד.',
        en: 'Apple and Google sign-in, with team joining via an invite link. Workout data is health data – only distance and duration are stored per workout, never the GPS track, and RLS restricts every member to their own teams.',
      },
      monetization: {
        he: ['חינם לקבוצת חברים אחת ולמסלולים הבסיסיים', 'מנוי "מועדון" לכמה קבוצות במקביל, מסלולים ארוכים ותחנות עם תוכן', 'רישיון למקומות עבודה: מרוץ שליחים לכל החברה עם לוח מנהלים ומסלול ממותג'],
        en: ['Free for one friends’ team and the basic routes', 'A "club" subscription for several teams at once, long routes and stages with content', 'Workplace licence: a company-wide relay with an admin board and a branded route'],
      },
      mvpMilestones: {
        he: ['קבוצה, הזמנה בקישור ומסלול אחד על מפה', 'מצב מקל עם טיימר, מסירה ידנית ונפילה', 'רישום אימון ידני שמזיז את הקבוצה על המסלול', 'סנכרון מ-Apple Health ומ-Health Connect', 'תזכורות ומעקפים אוטומטיים בצד השרת', 'תחנות, כרטיס שיתוף וסיכום שבועי'],
        en: ['Team, invite link and one route on a map', 'Baton state with timer, manual hand-off and drop', 'Manual workout logging that moves the team along the route', 'Sync from Apple Health and Health Connect', 'Server-side reminders and automatic detours', 'Stages, share card and weekly recap'],
      },
      risks: {
        he: ['קבוצה של חברים אמיתיים קורסת כשאדם אחד נעלם – צריך "דילוג" מובנה כדי שהמקל לא ייתקע אצל מי שטס לחו"ל', 'קריאת נתוני בריאות מחייבת development build והרשאות שמשתמשים מהססים לתת – הרישום הידני חייב להיות טוב באמת', 'בלי תחרות ייתכן שחלק מהמשתמשים ישתעממו – לבדוק מוקדם אם המסלול והתחנות מספיקים כמנוע'],
        en: ['A team of real friends collapses when one person disappears – a built-in "skip" is needed so the baton does not get stuck with someone abroad', 'Reading health data requires a development build and permissions users hesitate to grant – manual logging must be genuinely good', 'Without competition some users may get bored – test early whether the route and stages are enough of an engine'],
      },
      expansion: {
        he: ['מסלולים ממותגים של מרתונים ואירועי ריצה עם רישום מוקדם', 'מרוץ שליחים בין קבוצות: שתי חברות או שני משרדים על אותו מסלול', 'מצב "משפחה" עם מקלות קצרים להליכות של סבא וסבתא ושל הילדים'],
        en: ['Branded routes from marathons and running events with early registration', 'Relay between teams: two companies or two offices on the same route', 'A "family" mode with short batons for grandparents’ walks and for kids'],
      },
    },
  },
  {
    id: 'mosaic',
    name: { he: 'Mosaic – פסיפס בצלחת', en: 'Mosaic' },
    tagline: {
      he: 'במקום לספור קלוריות סופרים גיוון: כמה סוגי צמחים שונים אכלתם השבוע. מתעדים מנות – חומוס, שקשוקה, סלט – והאפליקציה כבר יודעת מה יש בפנים.',
      en: 'Count variety, not calories: how many different plants you ate this week. Log dishes – hummus, shakshuka, salad – and the app already knows what is inside.',
    },
    category: 'health',
    secondaryCategories: ['lifestyle'],
    difficulty: 'intermediate',
    effort: { weeksMin: 5, weeksMax: 7 },
    budget: 'low',
    businessModel: 'one-time',
    platforms: ['ios', 'android'],
    audience: ['consumers', 'parents'],
    tags: ['nutrition', 'plants', 'variety', 'food log', 'vegetables', 'seasonal', 'shopping list', 'family'],
    identity: { hue: 105, glyph: 'Mo', pattern: 'dots' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: true, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Mosaic מציעה מדד תזונתי אחד שאפשר לעמוד בו בלי לשקול כלום: מספר סוגי הצמחים השונים – ירקות, פירות, קטניות, דגנים מלאים, אגוזים, זרעים, עשבי תיבול ותבלינים – שאכלתם בשבוע האחרון. היעד הנפוץ הוא שלושים, אבל כל אחד בוחר יעד משלו. הטריק הוא בתיעוד: לא רושמים מרכיבים אלא מנות. מילון מנות מקומי יודע שסביח תורם חציל, טחינה, פטרוזיליה, עגבנייה ומלפפון, ושעדשים אדומות ועדשים ירוקות נספרות פעם אחת. כל צמח חדש מוסיף אריח ל"פסיפס" השבועי – לוח צבעוני שמתמלא – והאפליקציה מציעה מה זול ועונתי בשוק כדי למלא את החורים. אין טוב ורע, אין מגבלות, אין משקל: רק עוד אריח.',
        en: 'Mosaic offers one nutrition metric you can hit without weighing anything: the number of different plants – vegetables, fruit, legumes, whole grains, nuts, seeds, herbs and spices – you ate in the past week. Thirty is the common target, but everyone picks their own. The trick is in the logging: you record dishes, not ingredients. A local dish dictionary knows that a sabich contributes eggplant, tahini, parsley, tomato and cucumber, and that red and green lentils count once. Every new plant adds a tile to the weekly "mosaic" – a colourful board that fills up – and the app suggests what is cheap and in season at the market to fill the gaps. No good or bad, no limits, no scale: just another tile.',
      },
      problem: {
        he: 'רוב אפליקציות התזונה מבקשות לשקול, לסרוק ברקודים ולספור קלוריות – עבודה שרוב האנשים נוטשים מהר, ושמייצרת יחס מתוח לאוכל. מי שרוצה פשוט "לאכול יותר מגוון" לא מקבל שום כלי שמודד את זה, ומנות ישראליות מעורבות כמו חמין או מג׳דרה לא קיימות במאגרים הבינלאומיים.',
        en: 'Most nutrition apps ask you to weigh, scan barcodes and count calories – work most people abandon quickly, and which breeds an anxious relationship with food. Anyone who simply wants to "eat more variety" gets no tool that measures it, and mixed Israeli dishes like hamin or mujadara do not exist in international databases.',
      },
      solution: {
        he: 'מדד אחד – כמה צמחים שונים השבוע – עם תיעוד ברמת המנה דרך מילון מנות מקומי שמתורגם אוטומטית לרשימת צמחים. לוח פסיפס שמתמלא, הצעות עונתיות למילוי פערים, ורשימת קניות שנבנית מהצמחים שעדיין חסרים.',
        en: 'One metric – how many different plants this week – with dish-level logging through a local dish dictionary that expands automatically into a plant list. A mosaic board that fills up, seasonal suggestions for closing gaps, and a shopping list built from the plants still missing.',
      },
      usp: {
        he: 'מתעדים "שקשוקה" ולא "עגבנייה, פלפל, בצל, שום, כוסברה" – מילון מנות ישראלי שהופך תיעוד של חמש שניות לנתון אמיתי. ומכיוון שהמדד הוא גיוון ולא כמות, אי אפשר "להיכשל" – אפשר רק להוסיף.',
        en: 'You log "shakshuka", not "tomato, pepper, onion, garlic, coriander" – an Israeli dish dictionary turns a five-second entry into real data. And because the metric is variety rather than quantity, you cannot "fail" – you can only add.',
      },
      targetUsers: {
        he: ['אנשים שנשרפו מספירת קלוריות ורוצים מדד פשוט יותר', 'משפחות שמבשלות בבית ורוצות לגוון את התפריט השבועי', 'צמחונים וטבעונים שרוצים לוודא שהם לא אוכלים את אותם חמישה דברים'],
        en: ['People burnt out on calorie counting who want a simpler metric', 'Families who cook at home and want to vary the weekly menu', 'Vegetarians and vegans who want to make sure they are not eating the same five things'],
      },
      coreFeatures: {
        he: [
          'תיעוד מנות בחיפוש מהיר, עם מילון מנות ישראלי שמפרק כל מנה לצמחים',
          'ספירה שבועית מתגלגלת של צמחים שונים, עם יעד אישי',
          'לוח פסיפס שמקבל אריח לכל צמח חדש',
          'הצעות "מה חסר": צמחים זולים ועונתיים שעוד לא הופיעו השבוע',
          'רשימת קניות שנבנית מהפערים ומסתנכרנת בין בני הבית',
          'הוספת מנה ביתית פעם אחת ושימוש חוזר בה לנצח',
          'תצוגה משפחתית: פסיפס משותף לכל מי שאוכל מאותו סיר',
        ],
        en: [
          'Log dishes with a quick search, backed by an Israeli dish dictionary that breaks each dish into plants',
          'A rolling weekly count of distinct plants, with a personal target',
          'A mosaic board that gains a tile for every new plant',
          '"What is missing" suggestions: cheap, seasonal plants not seen this week yet',
          'A shopping list built from the gaps and synced between household members',
          'Add a home dish once and reuse it forever',
          'Family view: a shared mosaic for everyone eating from the same pot',
        ],
      },
      screens: [
        { name: { he: 'הפסיפס', en: 'Mosaic' }, description: { he: 'מסך הבית: לוח האריחים של השבוע, המונה הגדול (למשל 18 מתוך 30), וכפתור "אכלתי" צף.', en: 'The home screen: this week’s tile board, the big counter (say 18 of 30), and a floating "I ate" button.' } },
        { name: { he: 'תיעוד מנה', en: 'Log a dish' }, description: { he: 'שדה חיפוש עם השלמה אוטומטית, המנות האחרונות שלך למעלה, ותצוגה מקדימה של הצמחים שהמנה תוסיף.', en: 'A search field with autocomplete, your recent dishes on top, and a preview of the plants the dish will add.' } },
        { name: { he: 'מה חסר', en: 'Gaps' }, description: { he: 'קטגוריות שלא נגעתם בהן השבוע (למשל: אפס זרעים), עם הצעות עונתיות וזולות לכל קטגוריה.', en: 'Categories untouched this week (say, zero seeds), with seasonal, affordable suggestions for each.' } },
        { name: { he: 'רשימת קניות', en: 'Shopping list' }, description: { he: 'הצמחים החסרים כרשימה שמסמנים בשוק, משותפת לבני הבית, עם הצעה למנה אחת שסוגרת כמה פערים.', en: 'The missing plants as a list to tick off at the market, shared with the household, plus one dish that closes several gaps at once.' } },
        { name: { he: 'המנות שלי', en: 'My dishes' }, description: { he: 'מנות ביתיות שהגדרתם פעם אחת, עם עריכת הרכיבים ותדירות השימוש.', en: 'Home dishes you defined once, with ingredient editing and how often you use them.' } },
        { name: { he: 'היסטוריה', en: 'History' }, description: { he: 'פסיפסים של שבועות קודמים זה לצד זה, וצמחים שלא הופיעו כבר חודש.', en: 'Previous weeks’ mosaics side by side, and plants that have not appeared for a month.' } },
      ],
      userJourney: {
        he: [
          'נועה מורידה את האפליקציה אחרי שנטשה שוב ספירת קלוריות',
          'ביום ראשון בערב היא מתעדת "שקשוקה וסלט" ורואה שבעה אריחים נדלקים',
          'באמצע השבוע המונה על 14; מסך "מה חסר" מראה אפס קטניות ואפס זרעים',
          'היא מוסיפה לרשימת הקניות עדשים וגרעיני חמנייה וסוגרת שני פערים בארוחה אחת',
          'בשישי היא שומרת את "המרק של אמא" כמנה ביתית עם שמונה צמחים',
          'השבוע נסגר על 27; בשבוע הבא היא מכוונת ל-30 בלי לשקול כלום',
        ],
        en: [
          'Noa installs the app after abandoning calorie counting yet again',
          'On Sunday evening she logs "shakshuka and salad" and watches seven tiles light up',
          'Mid-week the counter reads 14; the gaps screen shows zero legumes and zero seeds',
          'She adds lentils and sunflower seeds to the shopping list and closes two gaps in one meal',
          'On Friday she saves "mum’s soup" as a home dish with eight plants',
          'The week ends at 27; next week she aims for 30 without weighing a thing',
        ],
      },
      uxDirection: {
        he: 'שמח ומוחשי: הפסיפס הוא לוח אריחים בצבעי ירקות אמיתיים, כל צמח עם איור קטן, והאריחים "נוחתים" באנימציה כשמנה מתועדת. אין אדום, אין גרפים של משקל, והמילה "דיאטה" לא מופיעה בשום מקום. התיעוד חייב להיגמר בשתי נגיעות, כי אנשים מתעדים ליד הכיור.',
        en: 'Cheerful and tactile: the mosaic is a tile board in real vegetable colours, every plant with a small illustration, and tiles "land" with an animation when a dish is logged. No red, no weight graphs, and the word "diet" appears nowhere. Logging must finish in two taps, because people log standing at the sink.',
      },
      architecture: {
        he: 'Expo עם Expo Router. מילון המנות והצמחים הוא קובץ JSON מנוהל שמגיע עם האפליקציה ומתעדכן מ-Supabase Storage, כך שחיפוש ופירוק מנה קורים במכשיר ללא רשת. התיעוד נשמר ב-SQLite ומסתנכרן ל-Supabase רק למשתמשים שמפעילים שיתוף משפחתי. רשימת הקניות המשותפת עוברת דרך Supabase Realtime. ההצעות העונתיות הן טבלה סטטית לפי חודש, בלי שום מודל.',
        en: 'Expo with Expo Router. The dish-and-plant dictionary is a managed JSON file bundled with the app and refreshed from Supabase Storage, so searching and expanding a dish happen on device without a network. Logs live in SQLite and sync to Supabase only for users who turn on family sharing. The shared shopping list runs over Supabase Realtime. Seasonal suggestions are a static month-indexed table, no model involved.',
      },
      stack: ['Expo', 'Expo Router', 'expo-sqlite', 'Supabase', 'Supabase Storage', 'Supabase Realtime', 'Reanimated'],
      database: {
        he: ['plants – צמח, קטגוריה, עונות, איור', 'dishes – מנה במילון, רשימת צמחים, אזור', 'user_dishes – מנות ביתיות של המשתמש והרכיבים שלהן', 'entries – תיעוד: מנה, תאריך, צמחים שנגזרו', 'households – משק בית, חברים, פסיפס משותף', 'shopping_items – פריט ברשימה, מי הוסיף, סומן'],
        en: ['plants – plant, category, seasons, illustration', 'dishes – dictionary dish, plant list, region', 'user_dishes – the user’s home dishes and their ingredients', 'entries – a log: dish, date, derived plants', 'households – household, members, shared mosaic', 'shopping_items – list item, who added it, checked'],
      },
      auth: {
        he: 'ללא חשבון בשימוש אישי – הכול במכשיר. חשבון (Apple/Google) נדרש רק כשמפעילים משק בית משותף, ואז RLS מגביל כל חבר לנתוני משק הבית שלו בלבד.',
        en: 'No account for personal use – everything stays on the device. An account (Apple/Google) is needed only when a shared household is turned on, and then RLS restricts every member to their own household’s data.',
      },
      monetization: {
        he: ['רכישה חד-פעמית אחרי שבועיים ניסיון, בלי מנוי', 'חבילות מנות אזוריות (מטבח מרוקאי, פרסי, עיראקי) שמרחיבות את המילון', 'בהמשך: תוכנית לדיאטניות שרוצות לראות את הפסיפס של המטופלים שלהן'],
        en: ['One-time purchase after a two-week trial, no subscription', 'Regional dish packs (Moroccan, Persian, Iraqi kitchens) that extend the dictionary', 'Later: a plan for dietitians who want to see their clients’ mosaics'],
      },
      mvpMilestones: {
        he: ['מילון של 300 מנות ו-150 צמחים בעברית ובאנגלית', 'תיעוד מנה ומונה שבועי מתגלגל', 'לוח פסיפס עם אנימציית אריחים', 'מנות ביתיות ועריכת רכיבים', 'מסך "מה חסר" ורשימת קניות', 'משק בית משותף וסנכרון'],
        en: ['A dictionary of 300 dishes and 150 plants in Hebrew and English', 'Dish logging and a rolling weekly counter', 'Mosaic board with tile animation', 'Home dishes and ingredient editing', 'Gaps screen and shopping list', 'Shared household and sync'],
      },
      risks: {
        he: ['איכות מילון המנות היא המוצר – מנה שמפורקת לא נכון פוגעת באמון, ולכן צריך עריכה ידנית ודיווח על טעויות', 'הגבול בין "צמח" ל"מוצר מעובד" (קטשופ? שמן זית?) חייב להיות כלל אחד ברור ומוסבר', 'בלי נימה זהירה המוצר עלול להישמע כהבטחה בריאותית – הניסוח צריך להישאר "גיוון" ולא "בריאות"'],
        en: ['The dish dictionary is the product – a wrongly expanded dish erodes trust, so manual editing and error reporting are essential', 'The line between "plant" and "processed product" (ketchup? olive oil?) must be one clear, explained rule', 'Without careful tone the product can sound like a health promise – the copy must stay about "variety", not "health"'],
      },
      expansion: {
        he: ['זיהוי מנה מצילום כמסלול מהיר לתיעוד', 'ייבוא היסטוריית הזמנות מאפליקציות משלוחים', 'אתגר חודשי קהילתי: "צמח השבוע" שכולם מנסים לשלב'],
        en: ['Dish recognition from a photo as a fast path to logging', 'Importing order history from delivery apps', 'A monthly community challenge: a "plant of the week" everyone tries to include'],
      },
    },
  },
  {
    id: 'shelf',
    name: { he: 'Shelf – לשים על המדף', en: 'Shelf' },
    tagline: {
      he: 'דאגה שצצה ב-23:00 נכנסת למדף במשפט אחד וחוזרת רק ב"חלון הדאגות" של מחר – רבע שעה קבועה שבה מחליטים: לפעול, לחכות או לשחרר.',
      en: 'A worry that pops up at 23:00 goes on the shelf in one line and returns only in tomorrow’s "worry window" – a fixed quarter hour to act, wait or let go.',
    },
    category: 'health',
    secondaryCategories: ['productivity', 'lifestyle'],
    difficulty: 'intermediate',
    effort: { weeksMin: 4, weeksMax: 7 },
    budget: 'free',
    businessModel: 'open-source',
    platforms: ['ios', 'android'],
    audience: ['consumers', 'students', 'professionals'],
    tags: ['worry', 'journaling', 'mental wellbeing', 'cbt', 'habits', 'privacy', 'sleep', 'notifications'],
    identity: { hue: 215, glyph: 'Sh', pattern: 'wave' },
    flags: { beginnerFriendly: false, profitPotential: 'low', experimental: false, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Shelf בנויה סביב טכניקה פשוטה אחת: לא להילחם בדאגה ברגע שהיא מופיעה, אלא לדחות אותה לזמן קבוע. כשמשהו מתחיל להסתובב בראש, כותבים אותו במשפט אחד ושמים אותו על המדף. האפליקציה לא מציעה טיפים, לא מבקשת לדרג מצב רוח ולא פותחת צ׳אט – היא רק מאשרת: "נשמר, נחזור לזה מחר ב-18:00". בחלון הדאגות היומי, רבע שעה שהמשתמש קובע, המדף נפתח: כל דאגה מוצגת בנפרד עם שלוש אפשרויות – להפוך לפעולה אחת קטנה, להשאיר למחר, או לסמן "כבר לא רלוונטי". המספר שהאפליקציה מדגישה הוא כמה דאגות פגו בעצמן: אחרי כמה שבועות רואים בעיניים כמה ממה שהעסיק אתכם בלילה באמת דרש משהו. הכול נשמר במכשיר בלבד.',
        en: 'Shelf is built around one simple technique: do not fight a worry the moment it shows up – postpone it to a fixed time. When something starts spinning in your head, you write it in one line and put it on the shelf. The app offers no tips, asks for no mood rating and opens no chat – it simply confirms: "saved, back to this tomorrow at 18:00". In the daily worry window, a quarter hour the user sets, the shelf opens: each worry appears alone with three options – turn it into one small action, keep it for tomorrow, or mark it "no longer relevant". The number the app highlights is how many worries expired on their own: after a few weeks you see for yourself how much of what kept you up at night actually needed anything. Everything stays on the device.',
      },
      problem: {
        he: 'דאגות מגיעות בדיוק כשאי אפשר לעשות איתן כלום – במיטה, בפקק, באמצע פגישה – ומסתובבות בראש שעות. אפליקציות "רווחה נפשית" מציעות מדיטציות, דירוג מצב רוח וצ׳אט עם בוט, אבל לא עוזרות ברגע עצמו, ולרוב הופכות לעוד דבר להרגיש אשמים עליו.',
        en: 'Worries arrive exactly when nothing can be done about them – in bed, in traffic, mid-meeting – and then spin for hours. "Wellbeing" apps offer meditations, mood ratings and a chatbot, but none of that helps in the moment, and most become one more thing to feel guilty about.',
      },
      solution: {
        he: 'מנגנון אחד ויחיד: קליטה במשפט אחד, נעילה עד חלון הדאגות הקבוע, ובחלון – החלטה מהירה לכל דאגה. בלי תוכן, בלי בוט, בלי דירוגים. התובנה היחידה שהאפליקציה מציגה היא כמה דאגות פגו בלי שום פעולה.',
        en: 'One mechanism and nothing else: capture in one line, lock until the fixed worry window, and in the window a quick decision per worry. No content, no bot, no ratings. The only insight the app shows is how many worries expired without any action.',
      },
      usp: {
        he: 'האפליקציה שלא רוצה עוד מהזמן שלכם: אין פיד, אין סטרייקים, אין "תוכן יומי". רק מדף שנשאר סגור עד החלון, רבע שעה של החלטות, ומספר אחד שמלמד אתכם משהו על הדאגות שלכם – וכל זה בלי שאף מילה עוזבת את הטלפון.',
        en: 'The app that does not want more of your time: no feed, no streaks, no "daily content". Just a shelf that stays closed until the window, a quarter hour of decisions, and one number that teaches you something about your own worries – and not a word of it ever leaves the phone.',
      },
      targetUsers: {
        he: ['אנשים שנרדמים קשה כי הראש לא נרגע', 'סטודנטים ועובדים בתקופות לחוצות עם המון "מה אם"', 'מי שעובד עם מטפל ורוצה כלי קטן בין הפגישות, לא במקומן'],
        en: ['People who struggle to fall asleep because their head will not settle', 'Students and employees in stressful periods full of "what ifs"', 'People working with a therapist who want a small tool between sessions, not instead of them'],
      },
      coreFeatures: {
        he: [
          'קליטת דאגה במשפט אחד מהמסך הנעול, מווידג׳ט או מפקודה קולית',
          'חלון דאגות יומי בשעה קבועה עם תזכורת עדינה',
          'שלוש החלטות לכל דאגה: פעולה קטנה, להשאיר, או "פג תוקף"',
          'מונה "פגו בעצמן" עם תצוגה שבועית וחודשית',
          'פעולות שנבחרו עוברות לרשימת משימות קטנה או ליומן המכשיר',
          'מצב לילה שנועל את המדף עד הבוקר ומציג רק "נשמר"',
          'ייצוא סיכום אנונימי לשיתוף עם מטפל או מטפלת',
        ],
        en: [
          'Capture a worry in one line from the lock screen, a widget or a voice command',
          'A daily worry window at a fixed time with a gentle reminder',
          'Three decisions per worry: a small action, keep it, or "expired"',
          'An "expired on their own" counter with weekly and monthly views',
          'Chosen actions flow into a small task list or the device calendar',
          'A night mode that locks the shelf until morning and shows only "saved"',
          'Export an anonymised summary to share with a therapist',
        ],
      },
      screens: [
        { name: { he: 'קליטה', en: 'Capture' }, description: { he: 'מסך כמעט ריק עם שדה טקסט אחד, מקלדת פתוחה, וכפתור "על המדף". אחרי השמירה: אישור קצר ושעת החלון הבא.', en: 'An almost empty screen with one text field, keyboard open, and a "shelve it" button. After saving: a short confirmation and the time of the next window.' } },
        { name: { he: 'המדף', en: 'Shelf' }, description: { he: 'בין החלונות המדף סגור: רואים רק כמה דברים מחכים ומתי החלון נפתח, בלי לקרוא אותם.', en: 'Between windows the shelf is closed: you only see how many items are waiting and when the window opens, without reading them.' } },
        { name: { he: 'חלון הדאגות', en: 'Worry window' }, description: { he: 'טיימר של רבע שעה, דאגה אחת בכל פעם כקלף, ושלושה כפתורים גדולים: פעולה, להשאיר, פג תוקף.', en: 'A quarter-hour timer, one worry at a time as a card, and three big buttons: action, keep, expired.' } },
        { name: { he: 'פעולה', en: 'Action' }, description: { he: 'כשבוחרים "פעולה": מגדירים צעד אחד קטן, בוחרים מועד, ואפשר לשלוח ליומן.', en: 'When "action" is chosen: define one small step, pick a time, and optionally send it to the calendar.' } },
        { name: { he: 'דפוסים', en: 'Patterns' }, description: { he: 'כמה דאגות נכנסו, כמה פגו, כמה הפכו לפעולה – בשבוע ובחודש, עם השעות שבהן הדאגות נוטות להגיע.', en: 'How many worries came in, how many expired, how many became actions – by week and month, with the hours when worries tend to arrive.' } },
        { name: { he: 'הגדרות', en: 'Settings' }, description: { he: 'שעת החלון, משך החלון, מצב לילה, נעילה ביומטרית וייצוא למטפל.', en: 'Window time, window length, night mode, biometric lock and therapist export.' } },
      ],
      userJourney: {
        he: [
          'ב-23:40 עומר נזכר במייל שלא ענה עליו והראש מתחיל לטחון',
          'הוא פותח את Shelf מהמסך הנעול, כותב "המייל של רועי" ולוחץ "על המדף"',
          'האפליקציה מאשרת: נשמר, נחזור לזה מחר ב-18:00 – והוא נרדם',
          'למחרת ב-18:00 החלון נפתח עם ארבע דאגות מהיום',
          'שתיים הופכות לפעולה קטנה, אחת נשארת, ו"המייל של רועי" מסומן פג תוקף – רועי כבר ענה בעצמו',
          'אחרי חודש מסך הדפוסים מראה שרוב הדאגות שלו פגו בלי שעשה דבר',
        ],
        en: [
          'At 23:40 Omer remembers an email he has not answered and starts spiralling',
          'He opens Shelf from the lock screen, types "Roi’s email" and taps "shelve it"',
          'The app confirms: saved, back to this tomorrow at 18:00 – and he falls asleep',
          'The next day at 18:00 the window opens with four worries from the day',
          'Two become small actions, one is kept, and "Roi’s email" is marked expired – Roi already replied himself',
          'After a month the patterns screen shows that most of his worries expired without him doing anything',
        ],
      },
      uxDirection: {
        he: 'כמעט ריק בכוונה: רקע כהה וחם, גופן אחד, מסך קליטה שנפתח עם מקלדת פתוחה ונסגר שנייה אחרי השמירה. המדף הסגור מצויר כקו אופקי עם מספר קטן מעליו. בחלון הדאגות הקלפים גדולים ואיטיים, בלי קונפטי כשדאגה פגה – רק הקלף שמתפוגג. שום התראה חוץ מפתיחת החלון.',
        en: 'Deliberately almost empty: a dark warm background, one typeface, a capture screen that opens with the keyboard up and closes a second after saving. The closed shelf is drawn as a horizontal line with a small number above it. In the worry window the cards are large and slow, with no confetti when a worry expires – just the card fading out. No notifications other than the window opening.',
      },
      architecture: {
        he: 'Expo עם Expo Router, אחסון מקומי ב-SQLite עם הצפנה במנוחה, ונעילה ביומטרית דרך expo-local-authentication. תזמון החלון ומצב הלילה עם התראות מקומיות של expo-notifications – אין שרת בכלל בגרסה הבסיסית. ווידג׳ט ופקודת קליטה דרך App Intents ב-iOS וקיצור דרך באנדרואיד. גיבוי מוצפן אופציונלי ל-iCloud או ל-Google Drive, כשהמפתח נשאר אצל המשתמש. הייצוא למטפל מפיק PDF במכשיר.',
        en: 'Expo with Expo Router, local storage in SQLite encrypted at rest, and biometric lock via expo-local-authentication. Window scheduling and night mode use local expo-notifications – there is no server at all in the base version. A widget and a capture command via App Intents on iOS and a shortcut on Android. Optional encrypted backup to iCloud or Google Drive, with the key staying with the user. The therapist export generates a PDF on device.',
      },
      stack: ['Expo', 'Expo Router', 'expo-sqlite', 'expo-notifications', 'expo-local-authentication', 'expo-calendar', 'expo-print'],
      database: {
        he: ['worries – דאגה, טקסט, זמן קליטה, סטטוס (על המדף / פעולה / נשאר / פג)', 'windows – חלון: תאריך, שעת התחלה, כמה דאגות טופלו', 'actions – הצעד הקטן שנגזר מדאגה, מועד, מזהה ביומן', 'settings – שעת החלון, משך, מצב לילה, נעילה'],
        en: ['worries – worry, text, capture time, status (shelved / action / kept / expired)', 'windows – a window: date, start time, how many worries were handled', 'actions – the small step derived from a worry, due time, calendar id', 'settings – window time, length, night mode, lock'],
      },
      auth: {
        he: 'אין חשבון ואין שרת: הכול במכשיר, עם נעילה ביומטרית אופציונלית. זה לא רק עיקרון של פרטיות אלא חלק מהערך – אנשים כותבים בכנות רק כשהם בטוחים שאף אחד לא קורא.',
        en: 'No account and no server: everything stays on the device, with an optional biometric lock. That is not just a privacy principle but part of the value – people write honestly only when they are sure nobody is reading.',
      },
      monetization: {
        he: ['הקוד פתוח כדי שכל אחד יוכל לוודא ששום דבר לא עוזב את הטלפון, והגרסה בחנויות נמכרת ברכישה חד-פעמית סמלית', 'חסויות ותרומות מקהילת הפרטיות והקוד הפתוח', 'בהמשך: תוסף "מטפל" בתשלום עם סיכומים מובנים לפגישה'],
        en: ['Open source so anyone can verify nothing leaves the phone, with the store build sold as a small one-time purchase', 'Sponsorships and donations from the privacy and open-source community', 'Later: a paid "therapist" add-on with structured summaries for a session'],
      },
      mvpMilestones: {
        he: ['קליטה במשפט אחד ושמירה מקומית', 'חלון דאגות מתוזמן עם שלוש ההחלטות', 'מונה "פגו בעצמן" ומסך דפוסים', 'מצב לילה ונעילה ביומטרית', 'ווידג׳ט וקיצור קליטה', 'ייצוא PDF למטפל'],
        en: ['One-line capture with local storage', 'Scheduled worry window with the three decisions', '"Expired on their own" counter and patterns screen', 'Night mode and biometric lock', 'Widget and capture shortcut', 'PDF export for a therapist'],
      },
      risks: {
        he: ['המוצר נוגע במצוקה אמיתית – חייב להציג בבירור שהוא כלי ולא טיפול, ולהפנות לקווי סיוע כשמופיעות מילים מסוימות', 'אפליקציה עם מסך אחד נראית "קטנה מדי" לחנויות ולמשתמשים – השיווק צריך להסביר למה הריקנות היא הפיצ׳ר', 'בלי שרת אין שחזור: אובדן טלפון בלי גיבוי מוחק הכול, ולכן הגיבוי המוצפן הוא הדבר הראשון שבונים אחרי ה-MVP'],
        en: ['The product touches real distress – it must state clearly that it is a tool, not treatment, and point to helplines when certain words appear', 'A one-screen app looks "too small" to stores and users – marketing has to explain why the emptiness is the feature', 'No server means no recovery: losing a phone without a backup wipes everything, so the encrypted backup is the first thing to build after the MVP'],
      },
      expansion: {
        he: ['חלון משותף לזוגות: דאגות על הבית שנפתחות יחד פעם ביום', 'אינטגרציה עם אפליקציות שינה: המדף ננעל אוטומטית בשעת השינה', 'גרסת שולחן עבודה לקליטה מהמחשב באמצע יום עבודה'],
        en: ['A shared window for couples: household worries opened together once a day', 'Sleep app integration: the shelf locks automatically at bedtime', 'A desktop version for capturing from the computer in the middle of a workday'],
      },
    },
  },
  {
    id: 'handoff',
    name: { he: 'Handoff – מסירת משמרת', en: 'Handoff' },
    tagline: {
      he: 'אחים ומטפלים של הורה מבוגר חולקים יומן טיפול אחד: כל ביקור מסתיים בהודעה קולית של דקה שהופכת למסירת משמרת מסודרת למי שמגיע אחריכם.',
      en: 'Siblings and carers of an ageing parent share one care log: each visit ends with a one-minute voice note that becomes a structured handoff for whoever is next.',
    },
    category: 'health',
    secondaryCategories: ['business', 'lifestyle'],
    difficulty: 'advanced',
    effort: { weeksMin: 10, weeksMax: 16 },
    budget: 'medium',
    businessModel: 'b2b',
    platforms: ['ios', 'android', 'web'],
    audience: ['consumers', 'businesses', 'professionals'],
    tags: ['caregivers', 'elderly', 'family', 'care coordination', 'home care', 'voice notes', 'b2b', 'handoff'],
    identity: { hue: 275, glyph: 'Hf', pattern: 'grid' },
    flags: { beginnerFriendly: false, profitPotential: 'high', experimental: false, trending: false, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Handoff נולדה מקבוצת הוואטסאפ המשפחתית שמנהלת את הטיפול בהורה מבוגר: שלושה אחים, מטפלת צמודה ונכדה שקופצת בימי שישי – ואף אחד לא יודע בוודאות אם אבא אכל היום, מי ראה אותו אחרון, ומה הרופאה אמרה בביקור. האפליקציה מחליפה את הקבוצה בטקס אחד קבוע: בסוף כל ביקור מקליטים הודעה קולית של דקה, והיא מתומללת ומסודרת אוטומטית לכרטיס מסירה עם שדות קבועים – מצב רוח, אכילה ושתייה, שינה, ניידות, מה נעשה, מה מדאיג, ומה צריך לקרות לפני הביקור הבא. מי שמגיע אחר כך פותח את האפליקציה ורואה בשלושים שניות את התמונה המלאה. בנוסף: בנק שאלות משותף לביקור הרופא הבא, לוח ביקורים שמראה חורים בשבוע, ותפקיד "מטפל" עם תצוגה מצומצמת בשפה שלו. המוצר לא נותן ייעוץ רפואי – הוא מסדר את מה שהמשפחה כבר יודעת.',
        en: 'Handoff was born out of the family WhatsApp group that runs the care of an ageing parent: three siblings, a live-in carer and a granddaughter who drops by on Fridays – and nobody knows for sure whether Dad ate today, who saw him last, or what the doctor said. The app replaces the group with one fixed ritual: at the end of every visit you record a one-minute voice note, which is transcribed and sorted into a handoff card with fixed fields – mood, eating and drinking, sleep, mobility, what was done, what is worrying, what must happen before the next visit. Whoever comes next sees the full picture in thirty seconds. Around that: a shared question bank for the next doctor’s appointment, a visit board that exposes gaps in the week, and a "carer" role with a reduced view in their own language. No medical advice – it organises what the family already knows.',
      },
      problem: {
        he: 'טיפול בהורה מבוגר מתחלק בין כמה אנשים שאף פעם לא נמצאים באותו מקום, והמידע חי בוואטסאפ: הודעות קוליות ארוכות שאף אחד לא שומע עד הסוף, שאלות לרופא שנשכחות, ואח אחד שנושא בעול כי הוא היחיד שיודע מה קורה. מטפלים זרים נשארים מחוץ לשיחה כי השפה והקבוצה לא שלהם.',
        en: 'Care for an ageing parent is split between several people who are never in the same place, and the information lives in WhatsApp: long voice messages nobody listens to the end, questions for the doctor that get forgotten, and one sibling carrying the load because they are the only one who knows what is going on. Foreign carers stay out of the conversation because neither the language nor the group is theirs.',
      },
      solution: {
        he: 'טקס מסירה קבוע בסוף כל ביקור – הודעה קולית שהופכת לכרטיס מובנה – במקום שיחה חופשית. לוח ביקורים, בנק שאלות לרופא ותפקידים עם הרשאות שונות לאחים ולמטפלים, כולל תרגום אוטומטי של הכרטיס לשפת המטפל.',
        en: 'A fixed handoff ritual at the end of every visit – a voice note that becomes a structured card – instead of free-form chat. A visit board, a question bank for the doctor and roles with different permissions for siblings and carers, including automatic translation of the card into the carer’s language.',
      },
      usp: {
        he: 'לא עוד קבוצת וואטסאפ ולא "אפליקציית בריאות": הכרטיס המובנה נוצר מדקה של דיבור, המטפל רואה אותו בשפה שלו, ובנק השאלות הופך את ביקור הרופא הבא למסודר. סוכנויות סיעוד מקבלות את אותו יומן כמוצר לכל הלקוחות שלהן.',
        en: 'Neither another WhatsApp group nor a "health app": the structured card is created from one minute of talking, the carer sees it in their own language, and the question bank turns the next doctor’s visit into an organised one. Home-care agencies get the same log as a product for all of their clients.',
      },
      targetUsers: {
        he: ['אחים ואחיות שחולקים את הטיפול בהורה מבוגר', 'מטפלים ומטפלות סיעודיים שרוצים להיות חלק מהתמונה', 'סוכנויות סיעוד וחברות כוח אדם שמעסיקות מטפלים', 'נכדים ובני משפחה רחוקים שרוצים לעזור בלי להפריע'],
        en: ['Siblings sharing the care of an ageing parent', 'Home carers who want to be part of the picture', 'Home-care agencies and staffing companies that employ carers', 'Grandchildren and distant relatives who want to help without getting in the way'],
      },
      coreFeatures: {
        he: [
          'מסירת משמרת קולית של דקה שמתומללת לכרטיס עם שדות קבועים',
          'ציר זמן של כל הביקורים והכרטיסים, עם סינון לפי "מה מדאיג"',
          'לוח ביקורים שבועי שמראה מי מגיע מתי ואיפה יש חור',
          'בנק שאלות משותף לביקור הרופא הבא, עם סימון מה נענה',
          'תפקידי אח, מטפל וצופה עם הרשאות ותצוגות שונות',
          'תרגום אוטומטי של כרטיסים לשפת המטפל ובחזרה',
          'משימות קטנות שנגזרות מהכרטיס: לקנות, להתקשר, לקבוע תור',
          'לוח מנהלים לסוכנויות: כל הלקוחות, כרטיסים חסרים, התראות',
        ],
        en: [
          'A one-minute voice handoff transcribed into a card with fixed fields',
          'A timeline of all visits and cards, filterable by "what is worrying"',
          'A weekly visit board showing who comes when and where there is a gap',
          'A shared question bank for the next doctor’s appointment, marking what was answered',
          'Sibling, carer and viewer roles with different permissions and views',
          'Automatic translation of cards into the carer’s language and back',
          'Small tasks derived from the card: buy, call, book an appointment',
          'An agency dashboard: all clients, missing cards, alerts',
        ],
      },
      screens: [
        { name: { he: 'היום', en: 'Today' }, description: { he: 'מסך הבית של בן המשפחה: הכרטיס האחרון בקצרה, מי מגיע היום, והמשימות הפתוחות שלי.', en: 'The family member’s home screen: the latest card in brief, who is visiting today, and my open tasks.' } },
        { name: { he: 'מסירה', en: 'Handoff' }, description: { he: 'כפתור הקלטה גדול, הנחיה קולית קצרה ("ספרו על מצב הרוח, האוכל, מה נעשה"), ואחרי התמלול – הכרטיס לעריכה ולאישור.', en: 'A big record button, a short spoken prompt ("tell us about mood, food, what was done"), and after transcription the card to edit and confirm.' } },
        { name: { he: 'ציר זמן', en: 'Timeline' }, description: { he: 'כל הכרטיסים לפי תאריך עם תמצית, צבע לפי רמת הדאגה, וסינון לפי שדה.', en: 'All cards by date with a summary, colour by level of concern, and filtering by field.' } },
        { name: { he: 'לוח ביקורים', en: 'Visit board' }, description: { he: 'תצוגת שבוע עם משבצות לכל אחד, חורים מודגשים, ולחיצה כדי לקחת ביקור.', en: 'A week view with slots per person, highlighted gaps, and a tap to claim a visit.' } },
        { name: { he: 'שאלות לרופא', en: 'Doctor questions' }, description: { he: 'רשימה משותפת שכולם מוסיפים אליה, מסודרת לפי התור הקרוב, עם מקום לתשובה אחרי הביקור.', en: 'A shared list everyone adds to, sorted by upcoming appointment, with room for the answer after the visit.' } },
        { name: { he: 'תצוגת מטפל', en: 'Carer view' }, description: { he: 'ממשק מצומצם בשפת המטפל: הכרטיס הקודם, הקלטת מסירה, והמשימות שהוקצו לו בלבד.', en: 'A reduced interface in the carer’s language: the previous card, record a handoff, and only the tasks assigned to them.' } },
        { name: { he: 'לוח הסוכנות', en: 'Agency dashboard' }, description: { he: 'גרסת ווב: כל הלקוחות, מטפלים משויכים, ביקורים בלי כרטיס, והתראות על מילים מדאיגות.', en: 'The web version: all clients, assigned carers, visits without a card, and alerts on worrying words.' } },
      ],
      userJourney: {
        he: [
          'מיכל, האחות הבכורה, פותחת "מעגל טיפול" לאבא ומזמינה את שני אחיה ואת המטפלת',
          'אחרי ביקור יום שלישי היא מקליטה: "היה עייף, אכל חצי צהריים, הרופאה שינתה משהו – לא הבנתי מה"',
          'הכרטיס נוצר עם "מדאיג: שינוי לא ברור בטיפול" והשאלה נכנסת לבנק השאלות',
          'המטפלת רואה את הכרטיס בשפה שלה ומוסיפה למחרת: ישן טוב, הלך לגינה',
          'לוח הביקורים מראה חור בשבת; האח הצעיר לוקח את הביקור מהטלפון',
          'בביקור הרופא הבא מיכל פותחת את בנק השאלות ומתעדת את התשובות לכולם',
        ],
        en: [
          'Michal, the eldest sister, opens a "care circle" for Dad and invites her two brothers and the carer',
          'After Tuesday’s visit she records: "he was tired, ate half his lunch, the doctor changed something – I did not catch what"',
          'The card is created with "worrying: unclear change in treatment" and the question goes into the question bank',
          'The carer sees the card in her own language and adds the next day: slept well, went to the garden',
          'The visit board shows a gap on Saturday; the younger brother claims it from his phone',
          'At the next doctor’s visit Michal opens the question bank and records the answers for everyone',
        ],
      },
      uxDirection: {
        he: 'רגוע ומכבד, בלי אסתטיקה של בית חולים: צבעים חמים ונייטרליים, טיפוגרפיה גדולה כי חלק מהמשתמשים הם בעצמם בני 60 ומעלה, ומסך מסירה שהוא כפתור אחד. רמת הדאגה מסומנת בצבע עדין ולא באדום מהבהב. תצוגת המטפל היא ממשק נפרד ופשוט יותר, לא "גרסה חתוכה" של המשפחה.',
        en: 'Calm and respectful, with no hospital aesthetic: warm neutral colours, large type because some users are themselves over 60, and a handoff screen that is one button. The level of concern is marked with a subtle colour, not flashing red. The carer view is a separate, simpler interface, not a "cut-down" version of the family one.',
      },
      architecture: {
        he: 'Expo עם Expo Router למובייל ו-Next.js ללוח הסוכנות, שניהם על Supabase. ההקלטה (expo-audio) עולה ל-Supabase Storage, ו-Edge Function שולחת אותה לתמלול ואז למודל שפה עם סכמת פלט קבועה (שדות הכרטיס, רמת דאגה, משימות, שאלות לרופא) ולתרגום לשפות המטפלים. הרשאות לפי מעגל טיפול ותפקיד נאכפות ב-RLS. התראות פוש על כרטיס חדש ועל חורים בלוח דרך expo-notifications. ההקלטה המקורית נמחקת אחרי אישור הכרטיס.',
        en: 'Expo with Expo Router for mobile and Next.js for the agency dashboard, both on Supabase. The recording (expo-audio) uploads to Supabase Storage, and an Edge Function sends it for transcription and then to a language model with a fixed output schema (card fields, level of concern, tasks, doctor questions) and for translation into the carers’ languages. Permissions per care circle and role are enforced with RLS. Push notifications for a new card and for gaps on the board via expo-notifications. The original recording is deleted once the card is confirmed.',
      },
      stack: ['Expo', 'Expo Router', 'expo-audio', 'expo-notifications', 'Next.js', 'Supabase', 'Supabase Storage', 'Supabase Edge Functions', 'Anthropic or OpenAI API', 'Speech-to-text API'],
      database: {
        he: ['circles – מעגל טיפול: האדם המטופל, הגדרות, סוכנות משויכת', 'members – משתמש, מעגל, תפקיד (אח / מטפל / צופה), שפה', 'visits – ביקור: מי, מתי, משך, האם הוגש כרטיס', 'cards – כרטיס מסירה: שדות קבועים, רמת דאגה, תמלול, תרגומים', 'questions – שאלות לרופא: מי שאל, לאיזה תור, תשובה', 'tasks – משימות שנגזרו מכרטיס, אחראי, סטטוס', 'agencies – סוכנות, לקוחות, מנהלים', 'alerts – התראות על מילים מדאיגות או ביקורים חסרים'],
        en: ['circles – a care circle: the cared-for person, settings, linked agency', 'members – user, circle, role (sibling / carer / viewer), language', 'visits – a visit: who, when, duration, whether a card was filed', 'cards – a handoff card: fixed fields, level of concern, transcript, translations', 'questions – doctor questions: who asked, for which appointment, answer', 'tasks – tasks derived from a card, owner, status', 'agencies – agency, clients, managers', 'alerts – alerts on worrying words or missing visits'],
      },
      auth: {
        he: 'כניסה עם Apple/Google לבני משפחה, וקוד הזמנה קצר בלי אימייל למטפלים, שלעיתים אין להם חשבון. סוכנויות נכנסות דרך הווב עם אימייל וסיסמה. המידע רגיש במיוחד – RLS לפי מעגל ותפקיד, הקלטות נמחקות אחרי אישור, ומחיקת מעגל מוחקת הכול.',
        en: 'Apple/Google sign-in for family members, and a short invite code with no email for carers, who often have no account. Agencies sign in on the web with email and password. The data is especially sensitive – RLS per circle and role, recordings deleted after confirmation, and deleting a circle deletes everything.',
      },
      monetization: {
        he: ['רישיון לסוכנויות סיעוד לפי לקוח פעיל, כולל לוח המנהלים', 'מנוי משפחתי למשפחות בלי סוכנות: היסטוריה מלאה, תרגום וייצוא', 'חבילות לבתי אבות ולמרכזי יום שרוצים לשתף את המשפחות'],
        en: ['Per-active-client licence for home-care agencies, including the dashboard', 'A family subscription for families without an agency: full history, translation and export', 'Packages for nursing homes and day centres that want to share with families'],
      },
      mvpMilestones: {
        he: ['מעגל טיפול, תפקידים והזמנה בקוד', 'מסירה קולית שהופכת לכרטיס מובנה לעריכה', 'ציר זמן ולוח ביקורים', 'בנק שאלות לרופא ומשימות', 'תצוגת מטפל עם תרגום', 'לוח סוכנות בווב וחיוב'],
        en: ['Care circle, roles and code invites', 'Voice handoff that becomes an editable structured card', 'Timeline and visit board', 'Doctor question bank and tasks', 'Carer view with translation', 'Agency web dashboard and billing'],
      },
      risks: {
        he: ['המוצר קרוב מאוד למידע רפואי – חייב להישאר "יומן" ולא "המלצה", עם ניסוח זהיר ובלי פרשנות של המודל', 'תמלול של עברית מדוברת עם שמות תרופות ומבטאים שונים יטעה לפעמים – הכרטיס תמיד מאושר ידנית', 'מכירה לסוכנויות היא מחזור ארוך שדורש פיילוט – להתחיל ממשפחות ולהשתמש בהן כהוכחה', 'מטפלים עלולים לחוות את הכלי כפיקוח – התצוגה שלהם צריכה לתת להם ערך ולא רק לדרוש דיווח', 'ההורה הוא נושא היומן אבל לרוב לא משתמש בו – צריך לבקש את הסכמתו ככל שאפשר ולשמור על ניסוח מכבד בכל כרטיס'],
        en: ['The product sits very close to medical information – it must remain a "log", not a "recommendation", with careful copy and no interpretation by the model', 'Transcribing spoken Hebrew with medication names and varied accents will sometimes get it wrong – the card is always confirmed by hand', 'Selling to agencies is a long cycle that needs a pilot – start with families and use them as proof', 'Carers may experience the tool as surveillance – their view must give them value, not only demand reports', 'The parent is the subject of the log but usually not a user – ask for their consent wherever possible and keep every card respectful in tone'],
      },
      expansion: {
        he: ['ייצוא תקופתי מסודר לרופאת המשפחה לפני תור', 'חיישנים ביתיים פשוטים (דלת, קומקום) כאיתות שקט בין ביקורים', 'מצב "הורים לילד עם צרכים מיוחדים" – אותו מבנה מסירה בין הורים, סייעת ובית ספר'],
        en: ['A tidy periodic export for the family doctor ahead of an appointment', 'Simple home sensors (door, kettle) as a quiet signal between visits', 'A "parents of a child with special needs" mode – the same handoff structure between parents, aide and school'],
      },
    },
  },
  {
    id: 'last-call',
    name: { he: 'Last Call – הקפה האחרון', en: 'Last Call' },
    tagline: {
      he: 'מתעדים כל קפה בנגיעה אחת ורואים ספירה לאחור ל"שעת הקפה האחרון" – השעה שאחריה הכוס הבאה כנראה תלווה אתכם למיטה.',
      en: 'Log every coffee with one tap and watch a countdown to "last call" – the hour after which your next cup will probably follow you to bed.',
    },
    category: 'health',
    secondaryCategories: ['lifestyle', 'productivity'],
    difficulty: 'beginner',
    effort: { weeksMin: 2, weeksMax: 3 },
    budget: 'free',
    businessModel: 'free',
    platforms: ['cross-platform'],
    audience: ['consumers', 'students', 'parents'],
    tags: ['caffeine', 'sleep', 'coffee', 'tracker', 'bedtime', 'widget', 'habits'],
    identity: { hue: 340, glyph: 'Lc', pattern: 'ring' },
    flags: { beginnerFriendly: true, profitPotential: 'low', experimental: false, trending: false, featuredWeight: 2 },
    spec: {
      overview: {
        he: 'Last Call היא גשר קטן בין שני הרגלים שכולם מרגישים שקשורים ואף אחד לא מודד: קפה ושינה. במקום מעקב שינה עם חיישנים, האפליקציה עוקבת רק אחרי ההחלטה שבשליטתכם – מתי שתיתם את הקפה האחרון. כל כוס נרשמת בנגיעה אחת (אספרסו, הפוך, תה, משקה אנרגיה – כל אחד עם "עוצמה" משוערת), ומסך הבית מציג דבר אחד: ספירה לאחור לשעת הקפה האחרון, שנגזרת משעת השינה שהגדרתם ומ"חלון" אישי שאתם קובעים. אחרי השעה הזאת האפליקציה לא אוסרת כלום – היא רק מראה שהכוס תיספר כ"מאוחרת". בבוקר מגיעה שאלה אחת: איך ישנת, מ-1 עד 5. אחרי שבועיים מופיע גרף פשוט שמציב את שעת הקפה האחרון מול איכות השינה שדיווחתם – התשובה האישית שלכם, לא כלל מהאינטרנט.',
        en: 'Last Call is a small bridge between two habits everyone feels are linked and nobody measures: coffee and sleep. No sensors: the app tracks only the decision you control – when you drank your last coffee. Every cup is logged with one tap (espresso, latte, tea, energy drink – each with a rough "strength"), and the home screen shows one thing: a countdown to last call, derived from the bedtime you set and a personal "window" you choose. After that hour nothing is forbidden – the cup is simply counted as "late". In the morning comes one question: how did you sleep, from 1 to 5. After two weeks a simple chart plots the time of your last coffee against the sleep quality you reported – your own answer, not a rule from the internet.',
      },
      problem: {
        he: 'כולם שמעו שקפה אחר הצהריים "לא טוב לשינה", אבל אף אחד לא יודע מה השעה האמיתית שלו – ואפליקציות שינה מודדות את התוצאה בלי לגעת בסיבה. התוצאה: ויכוח עם עצמכם ליד המכונה ב-16:30, ולילה שלם שלא ברור למה היה גרוע.',
        en: 'Everyone has heard that afternoon coffee is "bad for sleep", but nobody knows their own real cut-off hour – and sleep apps measure the outcome without touching the cause. The result: arguing with yourself at the machine at 16:30, and a whole night that was bad for no clear reason.',
      },
      solution: {
        he: 'מעקב אחרי ההחלטה ולא אחרי השינה: תיעוד קפה בנגיעה, ספירה לאחור לשעת הקפה האחרון, ושאלת בוקר אחת. אחרי שבועיים – גרף אישי שמראה אם יש קשר אצלכם, בלי חיישנים ובלי הבטחות.',
        en: 'Track the decision, not the sleep: one-tap coffee logging, a countdown to last call, and a single morning question. After two weeks – a personal chart that shows whether there is a link for you, with no sensors and no promises.',
      },
      usp: {
        he: 'כל הטריק הוא במסגור: לא "כמה קפה שתית" אלא "מתי היה האחרון". ספירה לאחור אחת על מסך הבית ובווידג׳ט הופכת כלל מעורפל להחלטה קונקרטית בזמן אמת – וההשוואה לשאלת הבוקר נותנת תשובה אישית במקום כלל אצבע.',
        en: 'A framing trick: not "how much coffee did you drink" but "when was the last one". A single countdown on the home screen and widget turns a vague rule into a concrete real-time decision – and the comparison with the morning question gives a personal answer instead of a rule of thumb.',
      },
      targetUsers: {
        he: ['אנשים שישנים לא טוב, חושדים בקפה, אבל לא בטוחים', 'סטודנטים ועובדי משמרות עם שעות שינה משתנות', 'הורים לתינוקות שחיים על קפה ורוצים לפחות לשמור על השינה שנשארה להם'],
        en: ['People who sleep badly, suspect the coffee, but are not sure', 'Students and shift workers with changing sleep hours', 'Parents of babies living on coffee who at least want to protect the sleep they have left'],
      },
      coreFeatures: {
        he: [
          'תיעוד משקה בנגיעה אחת עם ארבעה סוגים ועוצמה משוערת',
          'ספירה לאחור לשעת הקפה האחרון לפי שעת השינה והחלון שבחרתם',
          'ווידג׳ט במסך הבית עם הספירה והכוס האחרונה',
          'שאלת בוקר אחת: איך ישנת (1–5)',
          'גרף אישי אחרי שבועיים: שעת הקפה האחרון מול איכות השינה',
          'מצב "סוף שבוע" עם שעת שינה אחרת',
        ],
        en: [
          'One-tap drink logging with four types and a rough strength',
          'A countdown to last call based on your bedtime and chosen window',
          'A home-screen widget with the countdown and the last cup',
          'One morning question: how did you sleep (1–5)',
          'A personal chart after two weeks: last-coffee time against sleep quality',
          'A "weekend" mode with a different bedtime',
        ],
      },
      screens: [
        { name: { he: 'ספירה לאחור', en: 'Countdown' }, description: { he: 'מסך הבית: שעון גדול שסופר לאחור לשעת הקפה האחרון, הכוס האחרונה שתועדה, וארבעה כפתורי משקה בתחתית.', en: 'The home screen: a big clock counting down to last call, the last logged cup, and four drink buttons at the bottom.' } },
        { name: { he: 'תיעוד', en: 'Log' }, description: { he: 'חלונית שעולה מלמטה אחרי נגיעה: אישור השעה (אפשר לתקן אחורה), עוצמה, וכפתור "זהו".', en: 'A bottom sheet after a tap: confirm the time (adjustable backwards), strength, and a "done" button.' } },
        { name: { he: 'בוקר טוב', en: 'Good morning' }, description: { he: 'התראת בוקר שפותחת מסך אחד עם חמישה כפתורים: איך ישנת? נסגר מיד אחרי הבחירה.', en: 'A morning notification opening one screen with five buttons: how did you sleep? It closes right after the pick.' } },
        { name: { he: 'הגרף שלך', en: 'Your chart' }, description: { he: 'פיזור נקודות של שעת הקפה האחרון מול דירוג השינה, נעול עד שיש 14 לילות, עם משפט אחד שמסכם את המגמה.', en: 'A scatter of last-coffee time against sleep rating, locked until there are 14 nights, with one sentence summarising the trend.' } },
        { name: { he: 'הגדרות', en: 'Settings' }, description: { he: 'שעת שינה בימי חול ובסוף שבוע, גודל החלון, סוגי משקאות, שעת שאלת הבוקר וייצוא CSV.', en: 'Weekday and weekend bedtime, window size, drink types, the morning question time and CSV export.' } },
      ],
      userJourney: {
        he: [
          'יעל מגדירה שעת שינה 23:30 וחלון של 8 שעות; שעת הקפה האחרון נקבעת ל-15:30',
          'ב-10:00 היא מתעדת הפוך בנגיעה אחת; הווידג׳ט מראה "עוד 5 שעות וחצי לקפה האחרון"',
          'ב-16:10 היא שוקלת עוד כוס, רואה שהספירה הסתיימה, ומסתפקת בחליטה',
          'בבוקר היא עונה "4" לשאלה היחידה',
          'אחרי שבועיים הגרף נפתח: הלילות הגרועים מתרכזים בימים עם קפה אחרי 17:00',
          'היא מזיזה את החלון ל-7 שעות ובודקת שוב בעוד שבועיים',
        ],
        en: [
          'Yael sets bedtime to 23:30 and a window of 8 hours; last call lands at 15:30',
          'At 10:00 she logs a latte with one tap; the widget reads "5h 30m to last call"',
          'At 16:10 she considers another cup, sees the countdown has ended, and settles for a herbal tea',
          'In the morning she answers "4" to the only question',
          'After two weeks the chart unlocks: the bad nights cluster on days with coffee after 17:00',
          'She moves the window to 7 hours and checks again in another two weeks',
        ],
      },
      uxDirection: {
        he: 'מסך אחד שמבינים בשנייה: ספירה לאחור ענקית, צבע רקע שעובר בהדרגה מצהוב של בוקר לכחול של ערב ככל שהשעה מתקרבת, וארבעה כפתורים גדולים לתיעוד. שום טבלה ושום יומן – ההיסטוריה מוסתרת מאחורי הגרף. הווידג׳ט הוא המוצר האמיתי: רוב התיעוד יקרה ממנו.',
        en: 'One screen you understand in a second: a huge countdown, a background colour that shifts gradually from morning yellow to evening blue as the hour approaches, and four big logging buttons. No table and no diary – history hides behind the chart. The widget is the real product: most logging will happen from it.',
      },
      architecture: {
        he: 'Expo עם Expo Router, בלי שרת בכלל: התיעוד נשמר ב-SQLite, והתראת הבוקר מתוזמנת מקומית עם expo-notifications. הספירה לאחור היא חישוב פשוט משעת השינה ומהחלון. הגרף מצויר עם react-native-svg. ווידג׳ט במסך הבית דורש מודול נייטיבי ו-development build – להשאיר לשלב האחרון; האפליקציה עובדת מצוין גם בלעדיו, כולל בדפדפן.',
        en: 'Expo with Expo Router and no server at all: logs are stored in SQLite, and the morning notification is scheduled locally with expo-notifications. The countdown is a simple calculation from bedtime and the window. The chart is drawn with react-native-svg. A home-screen widget needs a native module and a development build – leave it for the final step; the app works fine without it, including in the browser.',
      },
      stack: ['Expo', 'Expo Router', 'expo-notifications', 'expo-sqlite', 'react-native-svg', 'expo-haptics'],
      database: {
        he: ['drinks – משקה: סוג, עוצמה, זמן', 'nights – לילה: תאריך, דירוג שינה, שעת הקפה האחרון באותו יום', 'settings – שעת שינה בחול ובסוף שבוע, חלון, שעת שאלת הבוקר'],
        en: ['drinks – a drink: type, strength, time', 'nights – a night: date, sleep rating, last-coffee time that day', 'settings – weekday and weekend bedtime, window, morning question time'],
      },
      auth: {
        he: 'ללא חשבון, ללא הרשמה וללא רשת. הכול במכשיר, ואפשר לייצא CSV מתי שרוצים.',
        en: 'No account, no sign-up and no network. Everything on the device, with CSV export whenever you want.',
      },
      monetization: {
        he: ['חינם לגמרי ובלי פרסומות – פרויקט ראשון שבונים כדי לסיים', 'צנצנת טיפים או "תקנו לי קפה" בתוך האפליקציה', 'אם יש ביקוש: חבילת ווידג׳טים וערכות צבע ברכישה חד-פעמית'],
        en: ['Completely free and ad-free – a first project you build in order to finish it', 'A tip jar or "buy me a coffee" inside the app', 'If there is demand: a widget and colour pack as a one-time purchase'],
      },
      mvpMilestones: {
        he: ['תיעוד בנגיעה ושמירה מקומית', 'ספירה לאחור משעת השינה והחלון', 'התראת בוקר ושאלה אחת', 'גרף פיזור אחרי 14 לילות', 'ווידג׳ט (אופציונלי, בסוף)'],
        en: ['One-tap logging with local storage', 'Countdown from bedtime and window', 'Morning notification and one question', 'Scatter chart after 14 nights', 'Widget (optional, last)'],
      },
      risks: {
        he: ['האפליקציה לא יכולה לטעון שום דבר על קפאין ושינה – הניסוח חייב להישאר "מה קורה אצלך", בלי מספרים "רפואיים" על זמן פירוק', 'דירוג שינה עצמי הוא נתון רועש – 14 לילות הם מינימום, והגרף צריך להודות כשאין מגמה', 'קל מאוד להפוך את זה לעוד אפליקציית מעקב כללית – לשמור על משקה אחד, שאלה אחת, גרף אחד'],
        en: ['The app cannot claim anything about caffeine and sleep – copy must stay about "what happens for you", with no "medical" numbers about clearance time', 'Self-rated sleep is noisy data – 14 nights is a minimum and the chart must admit when there is no trend', 'It is very easy to turn this into yet another general tracker – keep it to one drink, one question, one chart'],
      },
      expansion: {
        he: ['ייבוא משך השינה מ-Apple Health במקום הדירוג הידני', 'מצב "ניסוי": שבועיים עם חלון אחד, שבועיים עם אחר, והשוואה', 'תמיכה בעוד הרגל ערב אחד בלבד (למשל מסכים) באותו מבנה בדיוק'],
        en: ['Import sleep duration from Apple Health instead of the manual rating', 'An "experiment" mode: two weeks with one window, two with another, and a comparison', 'Support for exactly one more evening habit (say, screens) with the identical structure'],
      },
    },
  },
];
