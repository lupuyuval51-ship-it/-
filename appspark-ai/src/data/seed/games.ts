import type { Idea } from '../types';

/**
 * Mobile Games – small games with a tight loop and a clear hook, each one
 * buildable by a single developer. Every idea describes its core loop
 * concretely: what the player does, what pushes back, and why they return.
 */
export const ideas: Idea[] = [
  {
    id: 'shoresh',
    name: { he: 'Shoresh – משחק השורשים', en: 'Shoresh' },
    tagline: {
      he: 'מקבלים שורש אחד – כ.ת.ב – ומגלים כמה מילים מסתתרות בו: כותב, מכתב, כתובת, הכתבה. משחק מילים שאפשר לבנות רק בעברית.',
      en: 'Get one root – K.T.V – and uncover the words hiding inside it: write, letter, address, dictation. A word game that only Hebrew makes possible.',
    },
    category: 'games',
    secondaryCategories: ['education', 'entertainment'],
    difficulty: 'intermediate',
    effort: { weeksMin: 4, weeksMax: 6 },
    budget: 'low',
    businessModel: 'freemium',
    platforms: ['ios', 'android'],
    audience: ['consumers', 'students'],
    tags: ['word game', 'hebrew', 'roots', 'vocabulary', 'puzzle', 'language learning', 'daily puzzle'],
    identity: { hue: 42, glyph: 'Sh', pattern: 'grid' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: false, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Shoresh הוא משחק מילים שבנוי על התכונה הכי ייחודית של העברית: כמעט כל מילה נגזרת משורש של שלוש אותיות. בכל סיבוב מקבלים שורש אחד ולוח של משקלים ריקים, וצריך למלא אותם במילים אמיתיות שנגזרות מהשורש – מהשורש ח.ש.ב יוצאים מחשב, חשבון, מחשבה, התחשבות ועוד. כל מילה שנמצאת מדליקה משקל בלוח, ומילים נדירות שוות יותר. הרגע שבשבילו המשחק קיים הוא ה"וואו" שבו מגלים ששתי מילים שמכירים מגיל שלוש הן בעצם אחיות. מתאים לדוברי עברית שרוצים אתגר חדש, ולתלמידי אולפן שלומדים דרך המשחק איך השפה בנויה.',
        en: 'Shoresh is a word game built on the most distinctive trait of Hebrew: almost every word grows out of a three-letter root. Each round hands you one root and a board of empty word patterns, and you fill them with real words derived from that root – from H.Sh.V come computer, bill, thought and consideration. Every word you find lights up a pattern on the board, and rare words are worth more. The moment the game exists for is the "wait, what?" when you realise two words you have known since age three are siblings. Built for native speakers who want a fresh challenge, and for ulpan students who learn how the language is assembled by playing with it.',
      },
      problem: {
        he: 'משחקי המילים הגדולים – וורדל, תשבצים, חיפוש מילים – תורגמו לעברית בלי לנצל שום דבר מהמבנה שלה, ולרוב האותיות הסופיות והכתיב החסר הופכים אותם למתסכלים. דוברי עברית שמחפשים משחק מילים חכם מקבלים גרסה חיוורת של משחק אנגלי, ולומדי עברית מקבלים כרטיסיות שינון.',
        en: 'The big word games – Wordle, crosswords, word search – were translated into Hebrew without using anything about how the language works, and final letters and spelling variants usually make them frustrating. Hebrew speakers looking for a clever word game get a pale copy of an English one, and Hebrew learners get flashcards.',
      },
      solution: {
        he: 'מכניקה שנולדה מהמורפולוגיה: שורש אחד, לוח של משקלים ובניינים, ומילון שממפה כל מילה בעברית לשורש ולתבנית שלה. הלוח מגלה כמה מילים חסרות ובאילו משקלים, כך שתמיד יש רמז מבני ולא סתם ניחוש. רמת הקושי נקבעת לפי פוריות השורש ולפי הגזרה – שורשים שבהם אות נעלמת קשים יותר.',
        en: 'A mechanic born from the morphology: one root, a board of noun and verb patterns, and a lexicon that maps every Hebrew word to its root and pattern. The board reveals how many words are missing and in which patterns, so there is always a structural hint rather than blind guessing. Difficulty follows how productive the root is and its class – roots where a letter disappears are harder.',
      },
      usp: {
        he: 'משחק מילים שאי אפשר לשכפל מאנגלית: המכניקה היא השורש והמשקל, המילון המורפולוגי הוא החפיר, וכל פתרון מלמד משהו אמיתי על השפה – בלי להרגיש כמו שיעור.',
        en: 'A word game that cannot be cloned from English: root and pattern are the mechanic, the morphological lexicon is the moat, and every solve teaches something true about the language – without feeling like a lesson.',
      },
      targetUsers: {
        he: ['דוברי עברית שמחפשים משחק מילים יומי חכם', 'תלמידי אולפן ולומדי עברית מתקדמים', 'מורים לעברית שרוצים תרגול שורשים שלא מרגיש כמו שיעורי בית', 'משפחות שמשחקות יחד בשישי בערב'],
        en: ['Hebrew speakers who want a clever daily word game', 'Ulpan students and advanced Hebrew learners', 'Hebrew teachers who want root practice that does not feel like homework', 'Families who play together on Friday night'],
      },
      coreFeatures: {
        he: [
          'שורש יומי אחד שכולם משחקים, עם לוח משקלים משותף',
          'לוח משקלים שמראה כמה מילים חסרות ובאיזו תבנית',
          'בדיקת מילים מול מילון מורפולוגי שמקבל כתיב מלא וחסר',
          'ניקוד לפי נדירות המילה ובונוס על השלמת משקל שלם',
          'כרטיס "ידעת ש…" שמחבר שתי מילים מפתיעות מאותו שורש',
          'מצב אולפן: רמז ראשון חינם והסבר קצר על כל משקל',
          'חבילות שורשים לפי נושא: מטבח, עבודה, מילים מהתנ"ך',
          'שיתוף התוצאה כלוח אמוג׳י בלי לחשוף את המילים',
        ],
        en: [
          'One daily root everyone plays, with a shared pattern board',
          'A pattern board that shows how many words are missing and in which template',
          'Word validation against a morphological lexicon that accepts full and defective spelling',
          'Scoring by word rarity with a bonus for completing a whole pattern',
          'A "did you know" card linking two surprising words from the same root',
          'Ulpan mode: a free first hint and a short explanation of each pattern',
          'Root packs by theme: kitchen, workplace, words from the Bible',
          'Share your result as an emoji board without revealing the words',
        ],
      },
      screens: [
        { name: { he: 'בית', en: 'Home' }, description: { he: 'השורש של היום בגדול, הסטרייק הנוכחי, וכניסה לחבילות ולארכיון.', en: 'Today’s root front and centre, the current streak, and entry to packs and the archive.' } },
        { name: { he: 'לוח המשקלים', en: 'Pattern board' }, description: { he: 'השורש למעלה, מתחתיו רשת של משקלים ריקים שמתמלאים ונדלקים עם כל מילה שנמצאה, ומקלדת עברית מותאמת בתחתית.', en: 'The root on top, a grid of empty patterns below that fill and light up with every word found, and a tailored Hebrew keyboard at the bottom.' } },
        { name: { he: 'מילה נמצאה', en: 'Word found' }, description: { he: 'כרטיס קופץ עם המילה, המשקל שלה, הניקוד, ולפעמים "ידעת ש…" שמחבר אותה למילה אחות.', en: 'A pop-up card with the word, its pattern, the points, and sometimes a "did you know" linking it to a sibling word.' } },
        { name: { he: 'סיכום היום', en: 'Daily recap' }, description: { he: 'כל המילים שנמצאו מול המילים שפוספסו, לוח אמוג׳י לשיתוף וספירה לאחור לשורש הבא.', en: 'Words found versus words missed, the emoji board to share, and a countdown to the next root.' } },
        { name: { he: 'חבילות וארכיון', en: 'Packs & archive' }, description: { he: 'חבילות שורשים לפי נושא עם מצב התקדמות, והארכיון של השורשים היומיים הקודמים.', en: 'Themed root packs with progress, and the archive of past daily roots.' } },
        { name: { he: 'מצב אולפן', en: 'Ulpan mode' }, description: { he: 'הסבר קצר על כל משקל עם דוגמאות, ומעבר בין עברית לאנגלית בממשק בלבד – המילים תמיד בעברית.', en: 'A short explanation of each pattern with examples, and an interface toggle between Hebrew and English – the words themselves stay Hebrew.' } },
      ],
      userJourney: {
        he: [
          'המשתמשת פותחת את האפליקציה בבוקר ורואה את השורש של היום: ח.ש.ב',
          'מקלידה "מחשב" והמשקל הראשון בלוח נדלק',
          'נתקעת, לוקחת רמז ומגלה שגם "התחשבות" שייכת לשורש',
          'משלימה 9 מתוך 12 מילים ומקבלת כרטיס "ידעת ש…" על חשבון ומחשבה',
          'משתפת את לוח האמוג׳י בקבוצת המשפחה ואחותה מנסה לנצח אותה',
          'בערב פותחת את חבילת "מטבח" ומשחקת עוד שני שורשים',
        ],
        en: [
          'The user opens the app in the morning and sees today’s root: H.Sh.V',
          'Types "machshev" (computer) and the first pattern on the board lights up',
          'Gets stuck, takes a hint and discovers that "hitchashvut" (consideration) belongs to the root too',
          'Finishes 9 of 12 words and gets a "did you know" card about bill and thought',
          'Shares the emoji board in the family group and her sister tries to beat her',
          'In the evening opens the "kitchen" pack and plays two more roots',
        ],
      },
      uxDirection: {
        he: 'תחושה של מחברת עברית ישנה עם נגיעה מודרנית: רקע נייר חם, אותיות דפוס גדולות ונקיות, ולוח משקלים שנדלק באנימציה רכה כשמילה נמצאת. המקלדת היא עברית בלבד עם אותיות סופיות גלויות, ואין טיימר – הסיבוב נגמר כשנגמרים הרעיונות, לא הזמן.',
        en: 'An old Hebrew notebook with a modern touch: warm paper background, large clean type, and a pattern board that lights up with a soft animation when a word lands. The keyboard is Hebrew-only with final letters visible, and there is no timer – a round ends when the ideas run out, not the clock.',
      },
      architecture: {
        he: 'Expo עם Expo Router ו-Reanimated ללוח. המילון המורפולוגי (מילה → שורש, משקל, שכיחות) נבנה מראש מנתוני מורפולוגיה עברית פתוחים ונארז כ-SQLite בתוך האפליקציה, כך שבדיקת מילים עובדת גם בלי אינטרנט. השורש היומי, החבילות והסטרייקים מגיעים מ-Supabase, ופונקציה מתוזמנת בוחרת את שורש המחר ומוודאת שיש לו מספיק מילים בכל רמת קושי.',
        en: 'Expo with Expo Router and Reanimated for the board. The morphological lexicon (word → root, pattern, frequency) is built ahead of time from open Hebrew morphology data and shipped as SQLite inside the app, so word validation works offline. The daily root, packs and streaks come from Supabase, and a scheduled function picks tomorrow’s root and checks it has enough words at every difficulty level.',
      },
      stack: ['Expo', 'Expo Router', 'Reanimated', 'expo-sqlite', 'Supabase', 'Supabase Edge Functions'],
      database: {
        he: ['lexicon – מילה, שורש, משקל, שכיחות, כתיב חלופי (מקומי)', 'roots – שורש, רמת קושי, גזרה, מספר מילים', 'daily_puzzles – תאריך, שורש, המילים המצופות', 'attempts – משתמש, פאזל, מילים שנמצאו, ניקוד', 'packs – חבילה נושאית, רשימת שורשים, מחיר', 'streaks – משתמש, רצף נוכחי, רצף שיא'],
        en: ['lexicon – word, root, pattern, frequency, alternate spelling (on device)', 'roots – root, difficulty, root class, word count', 'daily_puzzles – date, root, expected words', 'attempts – user, puzzle, words found, score', 'packs – themed pack, root list, price', 'streaks – user, current streak, best streak'],
      },
      auth: {
        he: 'אפשר לשחק בלי חשבון – ההתקדמות נשמרת במכשיר. כניסה עם Apple או Google מסנכרנת סטרייקים וחבילות בין מכשירים, עם RLS לפי משתמש.',
        en: 'Play without an account – progress is stored on the device. Signing in with Apple or Google syncs streaks and packs across devices, with per-user RLS.',
      },
      monetization: {
        he: ['השורש היומי חינם לתמיד', 'חבילות שורשים נושאיות ברכישה חד-פעמית', 'מנוי "אולפן" עם הסברים, רמזים ללא הגבלה וארכיון מלא', 'רישיון לבתי ספר ולאולפנים עם לוח כיתה'],
        en: ['The daily root is free forever', 'Themed root packs as one-time purchases', 'An "ulpan" subscription with explanations, unlimited hints and the full archive', 'A licence for schools and ulpanim with a class board'],
      },
      mvpMilestones: {
        he: ['בניית המילון המורפולוגי ואריזתו ל-SQLite', 'לוח משקלים עם בדיקת מילים וניקוד', 'שורש יומי מ-Supabase עם סטרייקים', 'סיכום יומי ושיתוף לוח אמוג׳י', 'חבילה נושאית ראשונה ורכישה בתוך האפליקציה'],
        en: ['Build the morphological lexicon and pack it into SQLite', 'Pattern board with word validation and scoring', 'Daily root from Supabase with streaks', 'Daily recap and emoji-board sharing', 'First themed pack and in-app purchase'],
      },
      risks: {
        he: ['נתוני מורפולוגיה פתוחים מכילים שגיאות ומילים נדירות מדי בשביל להיות כיף – צריך סינון ידני לפי שכיחות לפני ההשקה', 'גזרות כמו פ"נ ול"י, שבהן אות מהשורש נעלמת, יבלבלו שחקנים – להסביר אותן בפעם הראשונה שהן מופיעות', 'כתיב מלא מול חסר: שחקן שיקליד "תכנית" במקום "תוכנית" יתעצבן אם המילה לא תתקבל – לקבל את שני הכתיבים', 'המילון הוא היתרון התחרותי, אבל אם הוא נארז באפליקציה הוא גם ניתן לחילוץ'],
        en: ['Open morphology data contains errors and words too rare to be fun – manual filtering by frequency is needed before launch', 'Root classes where a letter vanishes will confuse players – explain them the first time they appear', 'Full versus defective spelling: a player who types a variant spelling will be annoyed if it is rejected – accept both', 'The lexicon is the competitive edge, but shipping it inside the app also makes it extractable'],
      },
      expansion: {
        he: ['דו-קרב שורשים: שני שחקנים, אותו שורש, מי מוצא יותר מילים ב-90 שניות', 'מצב ערבית: אותה מכניקה על שורשים ערביים, לדוברי ערבית וללומדים', 'שורשים משותפים לעברית ולערבית כגשר בין השפות', 'לוח כיתה למורים עם שורשים לפי תוכנית הלימודים'],
        en: ['Root duel: two players, same root, who finds more words in 90 seconds', 'Arabic mode: the same mechanic on Arabic roots, for native speakers and learners', 'Roots shared by Hebrew and Arabic as a bridge between the languages', 'A class board for teachers with roots following the curriculum'],
      },
    },
  },
  {
    id: 'placecard',
    name: { he: 'Placecard – פאזל ההושבה היומי', en: 'Placecard' },
    tagline: {
      he: 'פאזל אחד ביום: להושיב שמונה אורחים סביב שולחן כשסבתא לא מוכנה לשבת ליד האקס של דנה. לוגיקה טהורה בתחפושת של רכילות משפחתית.',
      en: 'One puzzle a day: seat eight guests around a table when Grandma refuses to sit next to Dana’s ex. Pure logic dressed up as family gossip.',
    },
    category: 'games',
    secondaryCategories: ['entertainment', 'business'],
    difficulty: 'intermediate',
    effort: { weeksMin: 4, weeksMax: 7 },
    budget: 'low',
    businessModel: 'b2b',
    platforms: ['web', 'ios', 'android'],
    audience: ['consumers', 'businesses'],
    tags: ['daily puzzle', 'logic', 'seating chart', 'constraints', 'wedding', 'white label', 'publishers', 'streaks'],
    identity: { hue: 338, glyph: 'Pc', pattern: 'ring' },
    flags: { beginnerFriendly: false, profitPotential: 'high', experimental: false, trending: true, featuredWeight: 5 },
    spec: {
      overview: {
        he: 'Placecard הוא טקס יומי קטן: בכל יום מתפרסם סידור הושבה אחד, זהה לכל השחקנים, עם שולחן, רשימת אורחים ושש עד עשר "דרישות" שנשמעות כמו רכילות – "נועה ותומר נפרדו השבוע", "סבא חייב לשבת ליד הדלת", "התאומים לא יושבים יחד". גוררים אורחים לכיסאות עד שכל הדרישות מתמלאות, והפתרון תמיד יחיד. הקושי עולה לאורך השבוע כמו בתשבצים: ראשון קליל, שבת מפלצת. בסוף משתפים לוח אמוג׳י של השולחן בלי לחשוף את הפתרון. האירועים מתחלפים – שישי משפחתי, חתונה, ישיבת דירקטוריון, מסיבת גן – וזה מה שהופך לוגיקה יבשה לסיפור קטן שבא לחזור אליו.',
        en: 'Placecard is a small daily ritual: every day one seating chart is published, identical for every player, with a table, a guest list and six to ten "demands" that read like gossip – "Noa and Tomer broke up this week", "Grandpa must sit by the door", "the twins never sit together". You drag guests onto chairs until every demand holds, and the solution is always unique. Difficulty climbs through the week like a crossword: Sunday is a breeze, Saturday is a monster. At the end you share an emoji board of the table without spoiling the answer. The events rotate – Friday dinner, a wedding, a board meeting, a kindergarten party – which turns dry logic into a tiny story worth coming back for.',
      },
      problem: {
        he: 'משחקי הפאזל היומיים הגדולים מגיעים מאנגלית ומניחים שבוע שמתחיל בשני ושפה אחת. מי שרוצה טקס יומי קטן בעברית מקבל תשבצים מתורגמים או משחקי מילים שנלחמים באותיות הסופיות. ואתרי תוכן ישראליים שרוצים משחק יומי משלהם – כמו שיש לעיתונים הגדולים בעולם – צריכים לבנות אותו מאפס.',
        en: 'The big daily puzzle games come from English and assume a week that starts on Monday and a single language. Anyone wanting a small daily ritual in Hebrew gets translated crosswords or word games that fight with final letters. And Israeli content sites that want a daily game of their own – the way major newspapers abroad have one – must build it from scratch.',
      },
      solution: {
        he: 'פאזל לוגי שלא תלוי בשפה: הושבה, דרישות, שולחן. מנוע שמייצר כל יום סידור עם פתרון יחיד ומדרג אותו לפי קושי אמיתי (כמה הסקות נדרשות), כך שעקומת השבוע עקבית. גרסת ווב ניתנת להטמעה בכל אתר תוכן, וגרסת מובייל לשחקנים הישירים – אותו פאזל בשתיהן.',
        en: 'A logic puzzle that does not depend on language: seating, demands, a table. An engine that generates one chart a day with a unique solution and grades it by real difficulty (how many deductions it takes), so the weekly curve stays consistent. A web version embeds in any content site, and a mobile app serves direct players – the same puzzle in both.',
      },
      usp: {
        he: 'הדרישות מנוסחות כרכילות, לא כמשוואות – זה מה שגורם לאנשים ש"לא אוהבים פאזלי לוגיקה" לפתור אחד כל בוקר. ומאחורי הקלעים: מנוע יצירה עם פתרון יחיד מוכח ודירוג קושי מדיד, שאפשר למכור כמשחק יומי ממותג לכל אתר תוכן.',
        en: 'The demands read as gossip, not as equations – which is why people who "don’t do logic puzzles" solve one every morning. Behind the scenes: a generator with provably unique solutions and measurable difficulty that can be sold as a branded daily game to any content site.',
      },
      targetUsers: {
        he: ['אנשים שכבר יש להם טקס פאזל יומי ורוצים עוד אחד קצר', 'חובבי סודוקו שרוצים משהו עם סיפור', 'אתרי תוכן ואפליקציות חדשות שרוצים משחק יומי משלהם', 'מתכנני אירועים ואולמות שרוצים משחק ממותג להזמנות'],
        en: ['People who already have a daily puzzle ritual and want one more short one', 'Sudoku fans who want something with a story', 'Content sites and news apps that want a daily game of their own', 'Event planners and venues that want a branded game for invitations'],
      },
      coreFeatures: {
        he: [
          'פאזל יומי אחד, זהה לכולם, עם פתרון יחיד מוכח',
          'גרירת אורחים לכיסאות עם סימון חי של דרישות שמולאו ושהופרו',
          'עקומת קושי שבועית: ראשון קל, שבת קשה',
          'מצב "ריכוז" שמציג רק את הדרישות שעדיין פתוחות',
          'שיתוף לוח אמוג׳י של השולחן בלי ספוילר',
          'סטרייקים, זמן פתרון ממוצע ומספר שגיאות לכל יום',
          'ארכיון של פאזלים קודמים',
          'ווידג׳ט ווב להטמעה באתרים עם המיתוג של הלקוח',
        ],
        en: [
          'One daily puzzle, identical for everyone, with a provably unique solution',
          'Drag guests onto chairs with live marking of satisfied and broken demands',
          'A weekly difficulty curve: easy on Sunday, hard on Saturday',
          'A "focus" mode that shows only the demands still open',
          'Share an emoji board of the table without spoilers',
          'Streaks, average solve time and mistake count per day',
          'An archive of past puzzles',
          'An embeddable web widget with the client’s branding',
        ],
      },
      screens: [
        { name: { he: 'היום', en: 'Today' }, description: { he: 'כותרת האירוע ("שישי אצל סבתא"), השולחן במרכז, האורחים כקלפים בתחתית והדרישות ברשימה מתקפלת.', en: 'The event title ("Friday at Grandma’s"), the table in the centre, guests as cards at the bottom and the demands in a collapsible list.' } },
        { name: { he: 'דרישות', en: 'Demands' }, description: { he: 'רשימת הדרישות במלואה, כל אחת עם סימון ירוק, אדום או אפור לפי המצב הנוכחי של השולחן.', en: 'The full demand list, each marked green, red or grey according to the current state of the table.' } },
        { name: { he: 'נפתר', en: 'Solved' }, description: { he: 'השולחן הסופי עם אנימציה קטנה, זמן, שגיאות, והכפתור לשיתוף לוח האמוג׳י.', en: 'The final table with a small animation, time, mistakes, and the share-emoji-board button.' } },
        { name: { he: 'סטטיסטיקה', en: 'Stats' }, description: { he: 'סטרייק נוכחי ושיא, התפלגות זמני פתרון לפי יום בשבוע, והשוואה לממוצע של כל השחקנים.', en: 'Current and best streak, solve-time distribution by weekday, and a comparison to the average of all players.' } },
        { name: { he: 'ארכיון', en: 'Archive' }, description: { he: 'לוח שנה שבו כל יום מסומן נפתר או לא נפתר, עם כניסה לכל פאזל קודם.', en: 'A calendar where each day is marked solved or unsolved, with entry to any past puzzle.' } },
        { name: { he: 'הגדרות', en: 'Settings' }, description: { he: 'שעת תזכורת יומית, ערכת נושא, שפה, ואיפוס סטטיסטיקה.', en: 'Daily reminder time, theme, language, and stats reset.' } },
        { name: { he: 'ניהול לקוחות (ווב)', en: 'Client admin (web)' }, description: { he: 'לבעלי רישיון: מיתוג הווידג׳ט, תצוגה מקדימה של הפאזלים לשבוע הבא ונתוני שימוש בסיסיים.', en: 'For licence holders: widget branding, a preview of next week’s puzzles and basic usage figures.' } },
      ],
      userJourney: {
        he: [
          'בבוקר יום שלישי מגיעה תזכורת: "סידור ההושבה של היום מוכן – חתונה"',
          'המשתמש קורא שבע דרישות ומזהה שהדרישה "הכלה בראש השולחן" סוגרת כיסא אחד',
          'גורר ארבעה אורחים, דרישה אחת מאדימה, הוא מחליף בין שניים והיא מוריקה',
          'פותר תוך 3:40 עם שגיאה אחת ורואה שהוא מהיר מהממוצע',
          'משתף את לוח האמוג׳י בקבוצת העבודה וקולגה עונה עם 2:55',
          'ביום שבת הוא נתקע 20 דקות על פאזל ה"מפלצת" ומסיים עם תחושת ניצחון',
        ],
        en: [
          'On Tuesday morning a reminder arrives: "today’s seating chart is ready – a wedding"',
          'The user reads seven demands and notices that "the bride at the head of the table" locks one chair',
          'Drags four guests, one demand turns red, he swaps two and it turns green',
          'Solves in 3:40 with one mistake and sees he is faster than average',
          'Shares the emoji board in the work group and a colleague replies with 2:55',
          'On Saturday he is stuck for 20 minutes on the "monster" puzzle and finishes with a sense of victory',
        ],
      },
      uxDirection: {
        he: 'שולחן אחד, בלי רעש: רקע בהיר, שולחן מצויר בקו דק, כיסאות עגולים ואורחים כעיגולים צבעוניים עם ראשי תיבות. הדרישות מנוסחות בגוף שלישי בטון מחויך, והמשוב היחיד הוא צבע הדרישה. בלי טיימר בולט – הזמן נמדד בשקט ומוצג רק בסוף. האנימציה היחידה היא ה"התיישבות" של אורח בכיסא.',
        en: 'One table, no noise: a light background, a thin-line table, round chairs and guests as coloured circles with initials. Demands are written in the third person with a smile, and the only feedback is the colour of each demand. No prominent timer – time is measured quietly and shown only at the end. The single animation is a guest "settling" into a chair.',
      },
      architecture: {
        he: 'מנוע הפאזלים כתוב ב-TypeScript טהור ומשותף לכל הפלטפורמות: מייצר סידור אקראי, מגריל דרישות, פותר בחיפוש מבוסס הסקות כדי לוודא פתרון יחיד, ומדרג קושי לפי עומק ההסקה. פונקציה מתוזמנת ב-Supabase מייצרת מראש את הפאזלים של השבוע הבא. האפליקציה ב-Expo עם Reanimated לגרירה, גרסת הווב היא Expo לווב, והווידג׳ט להטמעה הוא בנדל קטן של אותו קוד שטוען מיתוג לפי מפתח לקוח.',
        en: 'The puzzle engine is pure TypeScript shared across platforms: it generates a random arrangement, draws demands, solves by deduction-based search to confirm a unique solution, and grades difficulty by deduction depth. A scheduled Supabase function pre-generates next week’s puzzles. The app is Expo with Reanimated for dragging, the web version is Expo for web, and the embeddable widget is a small bundle of the same code that loads branding by client key.',
      },
      stack: ['Expo', 'Expo Router', 'Reanimated', 'TypeScript', 'Supabase', 'Supabase Edge Functions', 'Vercel'],
      database: {
        he: ['puzzles – תאריך, אירוע, רשימת אורחים, דרישות, פתרון, דירוג קושי', 'attempts – משתמש, פאזל, זמן, שגיאות, נפתר', 'streaks – משתמש, רצף נוכחי, רצף שיא', 'clients – לקוח עסקי, מפתח הטמעה, מיתוג, דומיינים מורשים', 'client_stats – לקוח, יום, מספר פתרונות (מצטבר ואנונימי)', 'event_templates – סוגי אירועים, שמות אורחים ונוסחי דרישות לפי שפה'],
        en: ['puzzles – date, event, guest list, demands, solution, difficulty grade', 'attempts – user, puzzle, time, mistakes, solved', 'streaks – user, current streak, best streak', 'clients – business client, embed key, branding, allowed domains', 'client_stats – client, day, number of solves (aggregated and anonymous)', 'event_templates – event types, guest names and demand phrasings per language'],
      },
      auth: {
        he: 'שחקנים לא צריכים חשבון – הסטרייק נשמר במכשיר, וכניסה אופציונלית עם Apple או Google מסנכרנת בין מכשירים. לקוחות עסקיים מזוהים במפתח הטמעה שמוגבל לדומיינים שלהם ונכנסים לניהול עם אימייל.',
        en: 'Players need no account – the streak lives on the device, and optional Apple or Google sign-in syncs across devices. Business clients are identified by an embed key restricted to their domains and sign in to the admin with email.',
      },
      monetization: {
        he: ['רישיון חודשי לאתרי תוכן ולאפליקציות חדשות להטמעת המשחק היומי במיתוג שלהם', 'חבילות פאזלים ממותגות לחתונות ולאירועי חברה', 'גרסת הצרכן נשארת חינם – היא השיווק של הרישיון'],
        en: ['A monthly licence for content sites and news apps to embed the daily game under their branding', 'Branded puzzle packs for weddings and company events', 'The consumer version stays free – it is the marketing for the licence'],
      },
      mvpMilestones: {
        he: ['מנוע יצירה ופתירה עם אימות פתרון יחיד', 'מסך הפאזל עם גרירה ומשוב דרישות', 'פאזל יומי מתוזמן ועקומת קושי שבועית', 'סטרייקים, סיכום ושיתוף', 'ווידג׳ט ווב להטמעה עם מפתח לקוח', 'מסך ניהול בסיסי ללקוחות'],
        en: ['Generator and solver with unique-solution verification', 'Puzzle screen with dragging and demand feedback', 'Scheduled daily puzzle with a weekly difficulty curve', 'Streaks, recap and sharing', 'Embeddable web widget with a client key', 'Basic client admin screen'],
      },
      risks: {
        he: ['דירוג קושי אוטומטי שלא תואם את התחושה האנושית יהרוס את עקומת השבוע – לבדוק פאזלים ידנית לפני הפרסום', 'פאזל יומי חי או מת לפי ההרגל – בלי תזכורות ושיתוף טוב אין שימור', 'מכירה לאתרי תוכן היא מחזור מכירה ארוך לעומת פיתוח קצר – להתחיל עם לקוח פיילוט אחד', 'ניסוחי הרכילות חייבים להישאר נחמדים – דרישה שנשמעת כמו לעג תרחיק שחקנים'],
        en: ['Automatic difficulty grading that does not match human feel will ruin the weekly curve – puzzles need manual review before publishing', 'A daily puzzle lives or dies by habit – without reminders and good sharing there is no retention', 'Selling to content sites is a long sales cycle next to a short build – start with one pilot client', 'The gossip phrasing must stay kind – a demand that sounds like mockery will drive players away'],
      },
      expansion: {
        he: ['מצב "עורך": לשלוח לחבר סידור הושבה שבניתם עם האורחים האמיתיים שלכם', 'תבניות דרישות בערבית, ברוסית ובאנגלית לאותו פאזל', 'שולחנות מרובים ומבנים חדשים: אוטובוס, מטוס, כיתה', 'ליגות שבועיות פרטיות לקבוצות עבודה ולמשפחות'],
        en: ['An "editor" mode: send a friend a seating chart you built with your real guests', 'Demand templates in Arabic, Russian and English for the same puzzle', 'Multiple tables and new layouts: a bus, a plane, a classroom', 'Private weekly leagues for work groups and families'],
      },
    },
  },
  {
    id: 'matkot',
    name: { he: 'Matkot – הראלי שלא נגמר', en: 'Matkot' },
    tagline: {
      he: 'משחק מטקות של שני אגודלים על טלפון אחד: המטרה היא לא לנצח – אלא להחזיק את הכדור באוויר יחד, מול רוח, גלים וילד שרץ לתוך הראלי.',
      en: 'Two thumbs, one phone: beach paddleball where nobody wins – you just keep the ball in the air together, against wind, waves and a kid crossing the court.',
    },
    category: 'games',
    secondaryCategories: ['entertainment', 'lifestyle'],
    difficulty: 'intermediate',
    effort: { weeksMin: 5, weeksMax: 8 },
    budget: 'free',
    businessModel: 'one-time',
    platforms: ['ios', 'android'],
    audience: ['kids', 'parents', 'gamers'],
    tags: ['beach', 'paddleball', 'physics', 'local co-op', 'arcade', 'one phone', 'kids', 'haptics'],
    identity: { hue: 196, glyph: 'Mk', pattern: 'wave' },
    flags: { beginnerFriendly: false, profitPotential: 'low', experimental: false, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Matkot לוקח את המשחק הכי ישראלי שיש בחוף והופך אותו למשחק פיזיקה לשניים על מכשיר אחד: הטלפון נשכב לרוחב, כל שחקן מחזיק צד ושולט במטקה שלו באגודל, והמטרה המשותפת היא ראלי ארוך ככל האפשר. אין נקודות נגד יריב – יש מונה חבטות אחד לשניכם. הפיזיקה פשוטה אבל כנה: זווית המטקה וקצב התנופה קובעים את הגובה והסיבוב של הכדור, הרוח משתנה כל כמה חבטות, גל מגיע ומזיז את החול, ולפעמים ילד או כלב חוצים את המגרש. מצב סולו מול קיר מאפשר להתאמן לבד, ו"החוף של היום" הוא תנאי רוח קבועים לכולם עם טבלת שיא יומית. ממכר בדיוק כמו בחוף: עוד ראלי אחד, הפעם שוברים את ה-50.',
        en: 'Matkot takes the most Israeli beach game and turns it into a two-player physics game on one device: the phone lies in landscape, each player holds a side and controls a paddle with a thumb, and the shared goal is the longest rally possible. No points against an opponent – one hit counter for the two of you. The physics is simple but honest: paddle angle and swing speed set the ball’s height and spin, the wind shifts every few hits, a wave moves the sand, and sometimes a kid or a dog crosses the court. A solo wall mode lets you practise alone, and "today’s beach" sets the same wind for everyone with a daily leaderboard. Addictive like the real thing: one more rally, this time we break 50.',
      },
      problem: {
        he: 'משחקי מובייל לשניים כמעט תמיד דורשים שני מכשירים ואינטרנט, ומשחקי "מכה בכדור" בנויים על ניצחון – מישהו תמיד מפסיד, וילדים קטנים נוטשים. מטקות הוא ספורט שיתופי מטבעו, אבל אף משחק לא תפס את הרגע הזה של שני אנשים שמנסים יחד להציל ראלי.',
        en: 'Two-player mobile games almost always require two devices and a connection, and ball games are built around winning – someone always loses, and younger kids walk away. Paddleball is cooperative by nature, yet no game has captured that moment of two people trying together to save a rally.',
      },
      solution: {
        he: 'משחק שיתופי על מכשיר אחד: שני אגודלים, מטקה לכל צד, מונה אחד. פיזיקה כנה שמתגמלת תזמון וזווית, הפרעות סביבה שמתחלפות כדי שכל ראלי ירגיש אחרת, ומצב סולו מול קיר ו"החוף של היום" למי שמשחק לבד. הכול עובד בלי אינטרנט ובלי חשבון.',
        en: 'A cooperative game on one device: two thumbs, a paddle per side, one counter. Honest physics that rewards timing and angle, environmental interference that changes so every rally feels different, plus a solo wall mode and "today’s beach" for whoever plays alone. Everything works offline and without an account.',
      },
      usp: {
        he: 'הדבר היחיד שחשוב הוא הראלי המשותף: משחק פיזיקה לשניים על טלפון אחד שבו אין מפסיד, ולכן הורה וילד בן חמש, או שני חברים בתור לרופא, משחקים את אותו משחק עם אותה כמות של כיף.',
        en: 'The only thing that matters is the shared rally: a two-player physics game on one phone with no loser, so a parent and a five-year-old, or two friends in a waiting room, play the same game with the same amount of fun.',
      },
      targetUsers: {
        he: ['הורים וילדים שמחפשים משחק לשניים בלי מסך לכל אחד', 'חברים שמחכים יחד – בתור, באוטובוס, בחוף בלי מטקות', 'שחקנים שאוהבים משחקי ארקייד פיזיקליים קצרים'],
        en: ['Parents and kids looking for a two-player game without a screen each', 'Friends waiting together – in a queue, on a bus, at a beach without paddles', 'Players who love short physics-driven arcade games'],
      },
      coreFeatures: {
        he: [
          'שליטה באגודל אחד לכל שחקן על מסך לרוחב: גרירה מזיזה, החלקה חובטת',
          'פיזיקת כדור עם גובה, סיבוב ורוח שמשתנה כל כמה חבטות',
          'הפרעות חוף: גל שמזיז את החול, ילד שחוצה, כלב, שמשייה שעפה',
          'מונה ראלי משותף עם ציון דרך כל עשר חבטות ורטט חגיגי',
          'מצב סולו מול קיר',
          '"החוף של היום": תנאים זהים לכולם וטבלת שיא יומית',
          'מצב ילדים: כדור איטי יותר ומטקה גדולה יותר',
          'סאונד של חוף אמיתי ורטט קטן לכל חבטה',
        ],
        en: [
          'One thumb per player on a landscape screen: drag to move, flick to hit',
          'Ball physics with height, spin and wind that shifts every few hits',
          'Beach interference: a wave that moves the sand, a kid crossing, a dog, a parasol flying off',
          'A shared rally counter with a milestone every ten hits and a celebratory buzz',
          'A solo wall mode',
          '"Today’s beach": identical conditions for everyone and a daily high-score table',
          'Kids mode: slower ball and a bigger paddle',
          'Real beach sound and a haptic tick for every hit',
        ],
      },
      screens: [
        { name: { he: 'חוף', en: 'Beach' }, description: { he: 'מסך הבית הוא החוף עצמו: שתי מטקות מחכות, כפתורי "שניים" ו"סולו", והתנאים של היום בפינה.', en: 'The home screen is the beach itself: two paddles waiting, "duo" and "solo" buttons, and today’s conditions in a corner.' } },
        { name: { he: 'ראלי', en: 'Rally' }, description: { he: 'מסך לרוחב, מטקה בכל צד, מונה גדול במרכז העליון, חץ רוח קטן, והפרעות שנכנסות מהצדדים.', en: 'Landscape screen, a paddle on each side, a big counter top-centre, a small wind arrow, and interference entering from the sides.' } },
        { name: { he: 'הכדור נפל', en: 'Ball down' }, description: { he: 'סיכום הראלי: מספר חבטות, השיא של הצמד, כפתור "עוד אחד" גדול ושיתוף קליפ קצר של עשר החבטות האחרונות.', en: 'Rally summary: hit count, the pair’s record, one big "again" button and a short shareable clip of the last ten hits.' } },
        { name: { he: 'החוף של היום', en: 'Today’s beach' }, description: { he: 'תנאי הרוח והגלים של היום, טבלת השיא היומית, ולוח השבוע.', en: 'Today’s wind and wave conditions, the daily high-score table, and the week’s board.' } },
        { name: { he: 'הגדרות', en: 'Settings' }, description: { he: 'מצב ילדים, צד שמאל או ימין לכל שחקן, סאונד ורטט, ושחזור רכישה.', en: 'Kids mode, left or right side per player, sound and haptics, and restore purchase.' } },
      ],
      userJourney: {
        he: [
          'אבא וילדה בת שבע מחכים במרפאה; אבא משכיב את הטלפון לרוחב ובוחר "שניים"',
          'מפעיל מצב ילדים כדי שהכדור יעוף לאט יותר',
          'הראלי מגיע ל-12 חבטות, כלב חוצה את המגרש והכדור נופל – שניהם צוחקים',
          'בראלי הבא הרוח מתחזקת והם לומדים לחבוט נמוך יותר',
          'שוברים 30 ומקבלים רטט חגיגי ומונה זהוב',
          'בערב אבא משחק סולו ב"חוף של היום" ומנסה להיכנס לטבלת השיא',
        ],
        en: [
          'A dad and his seven-year-old wait at the clinic; he lays the phone flat in landscape and picks "duo"',
          'Turns on kids mode so the ball flies slower',
          'The rally reaches 12, a dog crosses the court and the ball drops – both laugh',
          'In the next rally the wind picks up and they learn to hit lower',
          'They break 30 and get a celebratory buzz and a golden counter',
          'In the evening dad plays solo on "today’s beach" and tries to make the high-score table',
        ],
      },
      uxDirection: {
        he: 'צבעי חוף שטוחים – חול חם, ים טורקיז, שמיים בהירים – עם דמויות פשוטות בסגנון איור לילדים. אפס תפריטים בזמן המשחק: רק הכדור, שתי המטקות והמונה. המשוב הוא רטט וצליל, לא טקסט. המסך תמיד לרוחב, והאזור של כל שחקן ברור גם בלי להסתכל.',
        en: 'Flat beach colours – warm sand, turquoise sea, bright sky – with simple characters in a children’s-illustration style. Zero menus during play: just the ball, two paddles and the counter. Feedback is haptic and audible, not text. The screen is always landscape, and each player’s zone is obvious without looking.',
      },
      architecture: {
        he: 'Expo עם react-native-skia לציור ו-Reanimated ללולאת המשחק על ה-UI thread. הפיזיקה כתובה ידנית: כדור עם מיקום, מהירות וסיבוב, כבידה, גרר רוח, וחבטה שמחושבת מזווית המטקה וממהירות ההחלקה – בלי מנוע פיזיקה חיצוני. שני מגעים במקביל דרך Gesture Handler. expo-haptics ו-expo-audio למשוב. טבלת "החוף של היום" ב-Supabase עם seed יומי לתנאים, והשיאים המקומיים ב-AsyncStorage.',
        en: 'Expo with react-native-skia for drawing and Reanimated for the game loop on the UI thread. Physics is hand-written: a ball with position, velocity and spin, gravity, wind drag, and a hit computed from paddle angle and flick speed – no external physics engine. Two simultaneous touches via Gesture Handler. expo-haptics and expo-audio for feedback. The "today’s beach" table lives in Supabase with a daily conditions seed, and local records in AsyncStorage.',
      },
      stack: ['Expo', 'react-native-skia', 'Reanimated', 'React Native Gesture Handler', 'expo-haptics', 'expo-audio', 'AsyncStorage', 'Supabase'],
      database: {
        he: ['local_records – שיא זוגי, שיא סולו, הגדרות (מקומי)', 'daily_conditions – תאריך, seed של רוח וגלים, רשימת הפרעות', 'daily_scores – תאריך, כינוי, מספר חבטות, מצב (סולו או שניים)', 'purchases – מזהה מכשיר אנונימי, רכישה מאומתת'],
        en: ['local_records – duo record, solo record, settings (on device)', 'daily_conditions – date, wind and wave seed, interference list', 'daily_scores – date, nickname, hits, mode (solo or duo)', 'purchases – anonymous device id, verified purchase'],
      },
      auth: {
        he: 'בלי חשבון. טבלת השיא היומית משתמשת בכינוי ובמזהה מכשיר אנונימי בלבד, כי חלק מהשחקנים הם ילדים. הרכישה החד-פעמית מאומתת מול חנות האפליקציות.',
        en: 'No account. The daily high-score table uses a nickname and an anonymous device id only, because some players are children. The one-time purchase is verified against the app store.',
      },
      monetization: {
        he: ['רכישה חד-פעמית אחרי חוף הניסיון החינמי – בלי פרסומות, מתאים להורים', 'חבילת חופים נוספים (אילת, חיפה, תל אביב בחורף) ברכישה אחת', 'גרסת "חוף ממותג" לרשתות גלידה או משקאות כקמפיין קיץ'],
        en: ['One-time purchase after the free trial beach – no ads, parent-friendly', 'A pack of extra beaches (Eilat, Haifa, Tel Aviv in winter) as one purchase', 'A "branded beach" version for ice-cream or drinks brands as a summer campaign'],
      },
      mvpMilestones: {
        he: ['לולאת משחק עם פיזיקת כדור ומטקה אחת מול קיר', 'שני מגעים במקביל ומצב שניים', 'רוח, גל והפרעה אחת', 'מונה, רטט, סאונד ומסך "הכדור נפל"', '"החוף של היום" עם טבלת שיא', 'רכישה חד-פעמית וחוף ניסיון'],
        en: ['Game loop with ball physics and one paddle against a wall', 'Two simultaneous touches and duo mode', 'Wind, a wave and one interference type', 'Counter, haptics, sound and the "ball down" screen', '"Today’s beach" with a high-score table', 'One-time purchase and a trial beach'],
      },
      risks: {
        he: ['פיזיקה שמרגישה לא הוגנת הורגת את המשחק – הכדור חייב ליפול תמיד "באשמת" השחקן ולא בגלל אקראיות', 'שני מגעים בו-זמנית על מסך קטן מתנגשים – צריך גבולות אזור ברורים ובדיקות על טלפונים קטנים', 'משחק בתשלום חד-פעמי צריך לשווק את עצמו דרך השיתוף – הקליפ של הראלי חייב להיות טוב', 'עונתיות: חוף מוכר בקיץ, וצריך חופים "חורפיים" כדי להחזיק עניין'],
        en: ['Physics that feels unfair kills the game – the ball must always drop because of the player, never randomness', 'Two simultaneous touches on a small screen collide – clear zone boundaries and testing on small phones are required', 'A paid game has to market itself through sharing – the rally clip must be good', 'Seasonality: a beach sells in summer, so "winter" beaches are needed to keep interest'],
      },
      expansion: {
        he: ['מצב ארבעה אגודלים על טאבלט', 'משחק מקוון מול חבר דרך קישור, עם פיצוי להשהיה', 'טורנירי חוף שבועיים עם תנאים מיוחדים', 'מטקות אמיתיות: הטלפון עצמו כמטקה באמצעות חיישני התנועה'],
        en: ['A four-thumb mode on a tablet', 'Online play with a friend via a link, with lag compensation', 'Weekly beach tournaments with special conditions', 'Real paddles: the phone itself as a paddle using the motion sensors'],
      },
    },
  },
  {
    id: 'nightfall',
    name: { he: 'Nightfall – מאפיה בקצב של פעם ביום', en: 'Nightfall' },
    tagline: {
      he: 'מאפיה בקצב של קבוצת וואטסאפ: סיבוב אחד ביום, האפליקציה מנחה, והחשד מבעבע כל השבוע בין פגישות לארוחות ערב.',
      en: 'Social deduction at the pace of a group chat: one round a day, the app plays narrator, and the suspicion simmers all week between meetings and dinners.',
    },
    category: 'games',
    secondaryCategories: ['social', 'entertainment'],
    difficulty: 'advanced',
    effort: { weeksMin: 8, weeksMax: 12 },
    budget: 'medium',
    businessModel: 'subscription',
    platforms: ['cross-platform'],
    audience: ['gamers', 'teams', 'consumers'],
    tags: ['social deduction', 'werewolf', 'mafia', 'async', 'group chat', 'party game', 'multiplayer', 'push notifications'],
    identity: { hue: 262, glyph: 'Nf', pattern: 'diagonal' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: true, trending: true, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Nightfall לוקח את משחק המאפיה – המשחק החברתי שכולם אוהבים ואף פעם לא מצליחים לארגן – ופורש אותו על שבוע. מישהו פותח "כפר", שולח קישור לקבוצה, וכל אחד מצטרף מהטלפון מתי שנוח לו. האפליקציה מחלקת תפקידים בסוד, פותחת כל ערב "לילה" שבו המאפיה בוחרת קורבן והבלש בודק חשוד, ובבוקר מכריזה מה קרה ופותחת יום של דיון והצבעה עם דדליין ב-21:00. אף אחד לא צריך להיות פנוי באותו רגע: כל פעולה לוקחת חצי דקה, והדיון מתנהל בשרשור של המשחק או בקבוצת הוואטסאפ הקיימת. המנחה האוטומטי מוסיף קטע סיפור קצר לכל בוקר, מזכיר למי ששכח להצביע, ומסכם בסוף השבוע מי שיקר הכי טוב. זה המשחק שמחזיר קבוצת חברים שכבר לא נפגשת לדבר כל יום.',
        en: 'Nightfall takes Mafia – the party game everyone loves and nobody can organise – and spreads it over a week. Someone opens a "village" and sends a link; players join whenever it suits them. The app deals roles in secret, runs a "night" each evening – the mafia picks a victim, the detective checks a suspect – and each morning opens a day of debate with a 21:00 deadline. Nobody has to be online at once: each move takes half a minute, and the arguing happens in the game thread or the group’s WhatsApp. An automatic narrator adds a daily story beat, nudges whoever forgot to vote, and closes the week with a recap of who lied best. The game that gets friends who no longer meet talking every day.',
      },
      problem: {
        he: 'משחקי חברה מבוססי חשד עובדים נהדר בסלון, אבל דורשים שמונה אנשים באותו חדר באותה שעה ומישהו שמוותר על המשחק כדי להנחות. בגיל שבו לכולם יש ילדים ועבודה זה כמעט בלתי אפשרי, והגרסאות המקוונות הקיימות הן משחקים של עשר דקות מול זרים – בלי האנשים שבאמת כיף לחשוד בהם.',
        en: 'Social deduction games are brilliant in a living room, but they need eight people in the same place at the same hour and someone who gives up playing to be the narrator. At the age when everyone has kids and jobs that is nearly impossible, and the existing online versions are ten-minute matches against strangers – without the people it is actually fun to suspect.',
      },
      solution: {
        he: 'משחק מאפיה אסינכרוני שנמשך שבוע: סיבוב ביום, דדליינים קבועים, מנחה אוטומטי שמחלק תפקידים ומנהל לילה ויום, ושכבת סיפור קלה שמחזיקה את המתח. מצטרפים בקישור בלי התקנה, והדיון יכול להישאר בקבוצה שכבר קיימת.',
        en: 'An asynchronous Mafia game that lasts a week: one round a day, fixed deadlines, an automatic narrator that deals roles and runs night and day, and a light story layer that keeps the tension alive. Joining is a link with no install, and the debate can stay in the group that already exists.',
      },
      usp: {
        he: 'לא עוד מאפיה מקוונת של עשר דקות מול זרים: משחק שנבנה לקבוצות אמיתיות שלא מצליחות להיפגש, עם סיבוב יומי שמתאים ללוח זמנים של מבוגרים, מנחה שאף אחד לא צריך להיות, ושילוב בקבוצת הצ׳אט הקיימת במקום להחליף אותה.',
        en: 'Not another ten-minute online Mafia against strangers: built for real groups that cannot meet, with a daily round that fits adult schedules, a narrator nobody has to be, and integration with the existing chat group instead of replacing it.',
      },
      targetUsers: {
        he: ['קבוצות חברים ותיקות שמתכתבות כל יום אבל נפגשות פעם בשנה', 'צוותי עבודה היברידיים שמחפשים משחק גיבוש שלא דורש פגישה', 'משפחות מורחבות עם ילדים בוגרים', 'קהילות וקבוצות דיסקורד שאוהבות משחקי חשד'],
        en: ['Long-standing friend groups that text daily but meet once a year', 'Hybrid work teams looking for a team game that needs no meeting', 'Extended families with grown-up kids', 'Communities and Discord groups that love social deduction'],
      },
      coreFeatures: {
        he: [
          'פתיחת כפר ושליחת קישור הצטרפות – בלי התקנה לשחקנים',
          'חלוקת תפקידים סודית: מאפיה, בלש, רופא, אזרחים ותפקידים מיוחדים',
          'לילה ויום אוטומטיים עם דדליינים שהמארח קובע',
          'הצבעה יומית עם חשיפה דרמטית בשעה קבועה',
          'מנחה אוטומטי עם קטע סיפור קצר בבוקר ותזכורות למתמהמהים',
          'שרשור דיון בתוך המשחק או קישור לקבוצת וואטסאפ קיימת',
          'ערכות נושא: כפר קלאסי, משרד, חתונה, תחנת חלל',
          'סיכום סוף משחק: מי שיקר הכי טוב, מי חשד נכון, קו הזמן המלא',
        ],
        en: [
          'Open a village and send a join link – no install for players',
          'Secret role dealing: mafia, detective, doctor, villagers and special roles',
          'Automatic night and day with host-set deadlines',
          'A daily vote with a dramatic reveal at a fixed hour',
          'An automatic narrator with a short morning story beat and nudges for stragglers',
          'A discussion thread inside the game or a link to an existing WhatsApp group',
          'Theme packs: classic village, the office, a wedding, a space station',
          'End-of-game recap: who lied best, who suspected right, the full timeline',
        ],
      },
      screens: [
        { name: { he: 'הכפרים שלי', en: 'My villages' }, description: { he: 'רשימת המשחקים הפעילים עם השלב הנוכחי (לילה או יום), כמה זמן נשאר להצביע, ומשחקים שהסתיימו.', en: 'Active games with their current phase (night or day), how long is left to vote, and finished games.' } },
        { name: { he: 'יצירת כפר', en: 'Create a village' }, description: { he: 'שם, ערכת נושא, הרכב תפקידים לפי מספר שחקנים, שעות הלילה והיום, וקישור לשיתוף.', en: 'Name, theme pack, role composition by player count, night and day hours, and a share link.' } },
        { name: { he: 'התפקיד שלך', en: 'Your role' }, description: { he: 'כרטיס סודי שנפתח בלחיצה ארוכה, עם הסבר קצר על מה מותר לך לעשות בלילה.', en: 'A secret card revealed on long-press, with a short explanation of what you may do at night.' } },
        { name: { he: 'לילה', en: 'Night' }, description: { he: 'מסך כהה עם פעולה אחת: המאפיה בוחרת, הבלש בודק, הרופא מגן; אזרחים רואים "לכו לישון".', en: 'A dark screen with one action: the mafia chooses, the detective checks, the doctor protects; villagers see "go to sleep".' } },
        { name: { he: 'יום', en: 'Day' }, description: { he: 'קטע הסיפור של הבוקר, מי נעלם, שרשור הדיון, וכפתור ההצבעה עם ספירה לאחור.', en: 'The morning story beat, who disappeared, the discussion thread, and the vote button with a countdown.' } },
        { name: { he: 'חשיפה', en: 'Reveal' }, description: { he: 'אנימציה של ספירת הקולות, מי הודח ומה היה התפקיד שלו, וספירה לאחור ללילה הבא.', en: 'The vote-count animation, who was expelled and what their role was, and a countdown to the next night.' } },
        { name: { he: 'סיכום המשחק', en: 'Game recap' }, description: { he: 'קו זמן של כל השבוע, "השקרן הטוב ביותר", "החשד המדויק ביותר", וכפתור למשחק חוזר עם אותה קבוצה.', en: 'A timeline of the whole week, "best liar", "sharpest suspicion", and a rematch button with the same group.' } },
      ],
      userJourney: {
        he: [
          'יובל פותח כפר בערכת "משרד" ושולח קישור לקבוצת החברים מהצבא',
          'תשעה מצטרפים לאורך היום, וכל אחד פותח את כרטיס התפקיד בלחיצה ארוכה',
          'בלילה הראשון המאפיה בוחרת קורבן, והבלש בודק את מי שהכי שקט בקבוצה',
          'בבוקר המנחה מודיע שרועי "נעלם", והקבוצה מתפוצצת מתיאוריות עד הערב',
          'ב-21:00 החשיפה: הודח אזרח תמים, והמאפיה מתפקעת מצחוק בשקט',
          'ביום השישי האזרחים מנצחים, והסיכום מכתיר את נעה כשקרנית של השבוע',
        ],
        en: [
          'Yuval opens a village with the "office" theme and sends the link to his army friends’ group',
          'Nine people join over the day, each long-pressing to reveal their role card',
          'On the first night the mafia picks a victim and the detective checks the quietest member of the group',
          'In the morning the narrator announces that Roy has "disappeared", and the group explodes with theories until evening',
          'At 21:00 the reveal: an innocent villager is expelled, and the mafia quietly dies laughing',
          'On day six the villagers win, and the recap crowns Noa as the liar of the week',
        ],
      },
      uxDirection: {
        he: 'לילה ויום כשני עולמות: מסך הלילה כהה ושקט עם פעולה אחת בלבד; מסך היום בהיר ורועש עם השרשור במרכז. כרטיס התפקיד מרגיש כמו קלף אמיתי שמסתירים מאחרים. הטיפוגרפיה משחקית אבל לא ילדותית, והסיפור כתוב בטון של מספר סיפורים מחויך ולא של מערכת.',
        en: 'Night and day as two worlds: the night screen is dark and quiet with a single action; the day screen is bright and loud with the thread at its centre. The role card feels like a real card you hide from others. The typography is playful but not childish, and the narration is written in the voice of a wry storyteller, not a system.',
      },
      architecture: {
        he: 'Expo עם Expo Router לאפליקציה ולגרסת הווב, כך שאפשר להצטרף מקישור בלי התקנה. Supabase: Postgres לכפרים, שחקנים, תפקידים ופעולות; Realtime לשרשור הדיון ולחשיפה; פונקציות מתוזמנות שסוגרות לילה ויום בדיוק בשעה שנקבעה ומחשבות את התוצאות בצד השרת. התפקידים מוצפנים בשורה של השחקן ונחשפים רק דרך פונקציה שמאמתת זהות. Push דרך expo-notifications, והסיפור מגיע מתבניות לפי ערכת נושא (עם אפשרות למודל שפה בהמשך).',
        en: 'Expo with Expo Router for the app and the web build, so joining from a link needs no install. Supabase: Postgres for villages, players, roles and actions; Realtime for the discussion thread and the reveal; scheduled functions that close night and day exactly on time and resolve outcomes server-side. Roles are stored encrypted on the player’s row and revealed only through a function that verifies identity. Push via expo-notifications, and narration comes from templates per theme pack (with a language model as a later option).',
      },
      stack: ['Expo', 'Expo Router', 'Supabase', 'Supabase Realtime', 'Supabase Edge Functions', 'expo-notifications', 'Vercel'],
      database: {
        he: ['villages – כפר, מארח, ערכת נושא, שעות לילה ויום, שלב נוכחי', 'players – שחקן, כפר, תפקיד (מוצפן), חי או הודח, מועד הצטרפות', 'rounds – כפר, מספר יום, שעת פתיחה, דדליין, תוצאה', 'night_actions – סיבוב, שחקן, סוג פעולה, יעד', 'votes – סיבוב, מצביע, יעד, זמן', 'messages – כפר, שחקן, תוכן, זמן', 'theme_packs – ערכה, תפקידים זמינים, תבניות סיפור', 'subscriptions – מארח, תוכנית, תוקף'],
        en: ['villages – village, host, theme pack, night and day hours, current phase', 'players – player, village, role (encrypted), alive or expelled, joined at', 'rounds – village, day number, opened at, deadline, outcome', 'night_actions – round, player, action type, target', 'votes – round, voter, target, time', 'messages – village, player, content, time', 'theme_packs – pack, available roles, narration templates', 'subscriptions – host, plan, valid until'],
      },
      auth: {
        he: 'שחקנים מצטרפים בקישור עם שם בלבד (משתמש אנונימי של Supabase שנשמר במכשיר); המארח נכנס עם Apple, Google או אימייל כדי לשמור על הכפרים שלו. RLS מבטיח ששחקן רואה רק את התפקיד שלו ואת ההודעות של הכפר שלו.',
        en: 'Players join via link with a name only (a Supabase anonymous user kept on the device); the host signs in with Apple, Google or email to keep their villages. RLS guarantees a player sees only their own role and their own village’s messages.',
      },
      monetization: {
        he: ['חינם: כפר פעיל אחד, עד 8 שחקנים, ערכת הכפר הקלאסי', 'Host Pass במנוי חודשי – רק המארח משלם: כפרים ללא הגבלה, עד 20 שחקנים, כל הערכות והתפקידים המיוחדים', 'ערכות נושא ממותגות לאירועי גיבוש של חברות', 'תוכנית לקהילות גדולות עם כמה מארחים'],
        en: ['Free: one active village, up to 8 players, the classic village pack', 'A monthly Host Pass – only the host pays: unlimited villages, up to 20 players, every pack and special role', 'Branded theme packs for company team-building events', 'A community plan for large groups with several hosts'],
      },
      mvpMilestones: {
        he: ['יצירת כפר, הצטרפות בקישור וחלוקת תפקידים מוצפנת', 'מכונת מצבים של לילה ויום עם פונקציות מתוזמנות', 'פעולות לילה, הצבעה וחשיפה', 'שרשור דיון ב-Realtime ו-Push לתזכורות', 'סיפור מתבניות וסיכום משחק', 'Host Pass ומסך תשלום'],
        en: ['Village creation, link joining and encrypted role dealing', 'Night and day state machine with scheduled functions', 'Night actions, voting and reveal', 'Realtime discussion thread and push reminders', 'Template narration and game recap', 'Host Pass and paywall'],
      },
      risks: {
        he: ['שחקן אחד שלא מצביע תוקע את כולם – חייבים ברירות מחדל חכמות (הימנעות אוטומטית) ותזכורות', 'באג אחד שחושף תפקיד הורס את המשחק ואת האמון – התפקידים חייבים להישאר בצד השרת בלבד', 'שבוע שלם הוא התחייבות ארוכה – כפר שמת באמצע צריך סיום אלגנטי', 'משחקי חשד יכולים להידרדר לעלבונות אמיתיים – כלי מארח להשתקה ולסיום מוקדם'],
        en: ['One player who never votes blocks everyone – smart defaults (auto-abstain) and reminders are mandatory', 'A single bug that leaks a role destroys the game and the trust – roles must stay server-side only', 'A full week is a long commitment – a village that dies midway needs a graceful ending', 'Suspicion games can slide into real offence – host tools for muting and early ending'],
      },
      expansion: {
        he: ['בוט וואטסאפ או טלגרם שמנהל את המשחק ישירות בקבוצה', 'עורך תפקידים לקהילות שרוצות כללים משלהן', 'עונות: ליגה של כמה כפרים עם טבלת דירוג', 'מצב "ספרינט" של יום אחד לאירועים חיים'],
        en: ['A WhatsApp or Telegram bot that runs the game directly in the group', 'A role editor for communities that want their own rules', 'Seasons: a league of several villages with a ranking table', 'A one-day "sprint" mode for live events'],
      },
    },
  },
  {
    id: 'marco',
    name: { he: 'Marco – מרקו פולו על המסך', en: 'Marco' },
    tagline: {
      he: 'המסך שחור, האצבע מחפשת, והטלפון רועד חזק יותר ככל שמתקרבים: משחק "חם-קר" שמשחקים בעיניים עצומות – וגם עיוורים יכולים לנצח בו.',
      en: 'A black screen, a searching finger, and a phone that buzzes harder as you get closer: hot-and-cold with your eyes shut – and blind players can win it too.',
    },
    category: 'games',
    secondaryCategories: ['entertainment'],
    difficulty: 'beginner',
    effort: { weeksMin: 1, weeksMax: 2 },
    budget: 'free',
    businessModel: 'free',
    platforms: ['ios', 'android'],
    audience: ['kids', 'consumers'],
    tags: ['haptics', 'accessibility', 'hot and cold', 'blind', 'one finger', 'tiny game', 'reaction'],
    identity: { hue: 130, glyph: 'Mc', pattern: 'dots' },
    flags: { beginnerFriendly: true, profitPotential: 'low', experimental: true, trending: false, featuredWeight: 2 },
    spec: {
      overview: {
        he: 'Marco הוא משחק קטן שמשחקים בלי להסתכל: על מסך שחור מוסתרת נקודה, מניחים אצבע ומזיזים אותה, והטלפון רועד בעדינות כשרחוקים ובחוזקה כשמתקרבים – "חם-קר" שמדבר אליכם דרך כף היד. ברגע שמוצאים מגיע רטט ארוך, והנקודה הבאה מתחבאת. סיבוב הוא חמש נקודות, והציון הוא הזמן. אפשר לשחק לבד נגד השיא, או ב"מרקו של היום" – אותן חמש נקודות לכולם. בגלל שאין שום דבר לראות, שחקנים עיוורים ולקויי ראייה משחקים בדיוק באותם תנאים כמו כולם, ומשחק של שתי דקות הופך לדרך נחמדה להסביר לילדים מה זו נגישות. פרויקט ראשון מושלם: מסך אחד, מחווה אחת, ו-API אחד של רטט.',
        en: 'Marco is a small game you play without looking: a point is hidden on a black screen, you put a finger down and move it, and the phone buzzes softly when you are far and hard when you are close – hot-and-cold spoken through your palm. Find it and you get a long buzz, then the next point hides. A round is five points and the score is your time. Play alone against your record, or "today’s Marco" – the same five points for everyone. Because there is nothing to see, blind and low-vision players compete on exactly the same terms as everyone else, and a two-minute game becomes a nice way to explain accessibility to kids. A perfect first project: one screen, one gesture, one vibration API.',
      },
      problem: {
        he: 'כמעט כל משחק מובייל הוא ויזואלי מהשנייה הראשונה, ולכן שחקנים עיוורים נשארים בחוץ, ומשחקים ל"רגע קטן של שעמום" דורשים את כל תשומת הלב של העיניים. גם מפתחים מתחילים מחפשים פרויקט ראשון שאפשר לסיים בשבועיים ושיש מאחוריו רעיון אמיתי, לא עוד שיבוט של משחק הנחש.',
        en: 'Nearly every mobile game is visual from the first second, so blind players are left out, and games for "a small moment of boredom" demand all of your eyes’ attention. New developers, too, are looking for a first project that can be finished in two weeks and has a real idea behind it, not another Snake clone.',
      },
      solution: {
        he: 'משחק שבו הרטט הוא כל הממשק: עוצמה שגדלה ככל שמתקרבים לנקודה, רטט ייחודי למציאה, ומצב קול אופציונלי שבו גובה הצליל מחליף את הרטט במכשירים חלשים. אפס גרפיקה, אפס תפריטים מורכבים, אפס שרת.',
        en: 'A game where vibration is the entire interface: intensity that grows as you approach the point, a distinct buzz for finding it, and an optional sound mode where pitch replaces vibration on weak devices. Zero graphics, zero complex menus, zero server.',
      },
      usp: {
        he: 'משחק מובייל שבו הראייה לא נותנת שום יתרון: רטט בלבד, נגיש מהיום הראשון, עם "מרקו של היום" שמאפשר להשוות זמנים בין חברים – ואפשר לבנות אותו מאפס בשבועיים.',
        en: 'A mobile game in which sight gives no advantage at all: haptics only, accessible from day one, with "today’s Marco" for comparing times with friends – and buildable from scratch in two weeks.',
      },
      targetUsers: {
        he: ['מפתחים מתחילים שרוצים משחק ראשון קטן ומוגמר', 'שחקנים עיוורים ולקויי ראייה שמחפשים משחק שנבנה בשבילם', 'הורים שרוצים משחק שקט לילדים באוטו או לפני השינה'],
        en: ['Beginner developers who want a small, finished first game', 'Blind and low-vision players looking for a game built for them', 'Parents who want a quiet game for kids in the car or before bed'],
      },
      coreFeatures: {
        he: [
          'מסך שחור ומגע אחד: הרטט מתחזק ככל שמתקרבים לנקודה',
          'רטט "מצאתי" ייחודי ומעבר אוטומטי לנקודה הבאה',
          'סיבוב של חמש נקודות עם סטופר',
          '"מרקו של היום": אותו seed לכולם ושיתוף הזמן',
          'מצב קול: גובה הצליל מחליף את הרטט',
          'תמיכה מלאה בקורא מסך ובהודעות קוליות',
          'שיא אישי ו"מצב לילה" שבו המסך נשאר שחור לגמרי',
        ],
        en: [
          'A black screen and one touch: the buzz strengthens as you near the point',
          'A distinct "found it" buzz and an automatic move to the next point',
          'A five-point round with a stopwatch',
          '"Today’s Marco": the same seed for everyone and time sharing',
          'Sound mode: pitch replaces vibration',
          'Full screen-reader support and spoken announcements',
          'A personal record and a "night mode" in which the screen stays entirely black',
        ],
      },
      screens: [
        { name: { he: 'פתיחה', en: 'Start' }, description: { he: 'כפתור אחד גדול "מרקו!", השיא האישי, וכניסה ל"מרקו של היום".', en: 'One big "Marco!" button, the personal record, and entry to "today’s Marco".' } },
        { name: { he: 'משחק', en: 'Play' }, description: { he: 'מסך שחור לגמרי; סטופר קטן בפינה שאפשר להסתיר, והרטט הוא כל המשוב.', en: 'A fully black screen; a small stopwatch in a corner that can be hidden, and the buzz is the only feedback.' } },
        { name: { he: 'מצאת!', en: 'Found!' }, description: { he: 'הזמן של הסיבוב, השוואה לשיא, מפת חום קטנה של המסלול שהאצבע עשתה, וכפתור שיתוף.', en: 'The round time, comparison to the record, a small heat map of the path your finger took, and a share button.' } },
        { name: { he: 'הגדרות', en: 'Settings' }, description: { he: 'עוצמת רטט, מצב קול, הקראה קולית, ובדיקת רטט למכשירים חלשים.', en: 'Vibration strength, sound mode, spoken announcements, and a vibration test for weak devices.' } },
      ],
      userJourney: {
        he: [
          'המשתמשת פותחת את האפליקציה בלילה במיטה ולוחצת "מרקו!"',
          'מניחה אצבע, מרגישה רטט חלש, מזיזה שמאלה והרטט מתחזק',
          'מוצאת את הנקודה הראשונה אחרי 6 שניות ומקבלת רטט ארוך',
          'משלימה חמש נקודות ב-31 שניות – שיא חדש',
          'משחקת "מרקו של היום" ומשתפת 28 שניות בקבוצה',
          'למחרת אחיה, שמשתמש בקורא מסך, מנצח אותה ב-4 שניות',
        ],
        en: [
          'The user opens the app in bed at night and taps "Marco!"',
          'Puts a finger down, feels a faint buzz, moves left and it grows stronger',
          'Finds the first point after 6 seconds and gets a long buzz',
          'Completes five points in 31 seconds – a new record',
          'Plays "today’s Marco" and shares 28 seconds in the group',
          'The next day her brother, who uses a screen reader, beats her by 4 seconds',
        ],
      },
      uxDirection: {
        he: 'כמעט בלי ממשק: שחור מלא בזמן המשחק, טיפוגרפיה לבנה גדולה במסכי הפתיחה והסיום, ואף אלמנט שקורא מסך לא יכול להקריא. אין צבע שנושא מידע – רק רטט, צליל ומילים. כפתור ההתחלה תופס חצי מסך כדי שאפשר יהיה למצוא אותו בלי להסתכל.',
        en: 'Almost no interface: full black during play, large white type on the start and end screens, and no element a screen reader cannot read. No colour carries information – only buzz, sound and words. The start button fills half the screen so it can be found without looking.',
      },
      architecture: {
        he: 'Expo עם מסך אחד ו-Gesture Handler למעקב אחרי האצבע. בכל פריים מחושב המרחק לנקודה ומתורגם לעוצמת רטט דרך expo-haptics (דרגות עוצמה ב-iOS, תבניות רטט באורכים שונים באנדרואיד). "מרקו של היום" נגזר מ-seed לפי התאריך, בלי שרת; השיאים ב-AsyncStorage. מצב הקול משתמש ב-expo-audio עם צליל שמשנה גובה. כל הלוגיקה של האפליקציה היא כמה מאות שורות.',
        en: 'Expo with a single screen and Gesture Handler to track the finger. Every frame the distance to the point is computed and mapped to vibration intensity via expo-haptics (intensity levels on iOS, vibration patterns of varying length on Android). "Today’s Marco" is derived from a date-based seed with no server; records live in AsyncStorage. Sound mode uses expo-audio with a pitch-shifting tone. The whole app is a few hundred lines of logic.',
      },
      stack: ['Expo', 'expo-haptics', 'React Native Gesture Handler', 'expo-audio', 'AsyncStorage'],
      database: {
        he: ['records – שיא אישי, היסטוריית סיבובים (מקומי)', 'settings – עוצמת רטט, מצב קול, הקראה (מקומי)', 'daily_results – תאריך, זמן, שותף או לא (מקומי)'],
        en: ['records – personal record, round history (on device)', 'settings – vibration strength, sound mode, announcements (on device)', 'daily_results – date, time, shared or not (on device)'],
      },
      auth: {
        he: 'בלי חשבון ובלי שרת. הכול נשמר במכשיר, ו"מרקו של היום" מחושב מהתאריך בלבד.',
        en: 'No account and no server. Everything is stored on the device, and "today’s Marco" is computed from the date alone.',
      },
      monetization: {
        he: ['חינם לחלוטין – פרויקט תיק עבודות וקהילה', 'אפשרות עתידית: "טיפ" חד-פעמי למפתח', 'קוד פתוח כדוגמה למשחק נגיש ב-Expo'],
        en: ['Completely free – a portfolio and community project', 'Future option: a one-time "tip" for the developer', 'Open source as a reference accessible game in Expo'],
      },
      mvpMilestones: {
        he: ['מסך שחור, מעקב אצבע ורטט לפי מרחק', 'סיבוב של חמש נקודות עם סטופר ושיא', '"מרקו של היום" ושיתוף', 'מצב קול והגדרות נגישות'],
        en: ['Black screen, finger tracking and distance-based buzz', 'Five-point round with a stopwatch and a record', '"Today’s Marco" and sharing', 'Sound mode and accessibility settings'],
      },
      risks: {
        he: ['רטט באנדרואיד לא אחיד – במכשירים זולים ההבדל בין "קרוב" ל"רחוק" לא מורגש, ולכן מצב הקול הוא חובה', 'משחק של דקה בלי תוכן חדש נשכח מהר – "מרקו של היום" הוא הדבר היחיד שמחזיר שחקנים', 'בדיקת נגישות אמיתית דורשת שחקנים עיוורים – לא להסתפק בניחוש'],
        en: ['Android haptics are inconsistent – on cheap devices "near" and "far" feel the same, so sound mode is mandatory', 'A one-minute game with no new content is forgotten quickly – "today’s Marco" is the only thing bringing players back', 'Real accessibility testing needs blind players – do not settle for guessing'],
      },
      expansion: {
        he: ['מצב שני שחקנים: אחד מחביא את הנקודה באצבע, השני מחפש', 'מסלולים: למצוא נקודות בסדר מסוים בלי להרים את האצבע', 'טבלת זמנים עולמית ל"מרקו של היום" עם שרת קטן'],
        en: ['Two-player mode: one hides the point with a finger, the other searches', 'Trails: find points in order without lifting the finger', 'A global time table for "today’s Marco" with a small server'],
      },
    },
  },
];
