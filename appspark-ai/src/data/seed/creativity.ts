import type { Idea } from '../types';

/**
 * Creativity – writing, music, design, art and photography. Tools that help
 * people make things of their own, not "AI makes it for you".
 */
export const ideas: Idea[] = [
  {
    id: 'payoff',
    name: { he: 'Payoff – הבטחות לקורא', en: 'Payoff' },
    tagline: {
      he: 'כל רמז, חפץ או שאלה שנטעתם בכתב היד הוא הבטחה לקורא. Payoff עוקב אחרי כל הבטחה, ומראה איזו מהן עדיין פתוחה בפרק 30.',
      en: 'Every clue, object or question you plant in a manuscript is a promise to the reader. Payoff tracks each one and shows which are still open by chapter 30.',
    },
    category: 'creativity',
    secondaryCategories: ['productivity', 'education'],
    difficulty: 'intermediate',
    effort: { weeksMin: 5, weeksMax: 8 },
    budget: 'low',
    businessModel: 'subscription',
    platforms: ['web'],
    audience: ['creators', 'professionals'],
    tags: ['writing', 'fiction', 'novel', 'screenwriting', 'outline', 'plot', 'editing', 'manuscript'],
    identity: { hue: 262, glyph: 'Pf', pattern: 'grid' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: false, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Payoff הוא כלי עריכה מבנית לכותבי רומנים ותסריטים, שבנוי סביב רעיון אחד: כל דבר שנוטעים בסיפור – חפץ מסתורי, שאלה שדמות שואלת, איום שמרחף – הוא הבטחה לקורא, והקורא זוכר. הכותב מייבא את כתב היד (Word, Markdown או Scrivener) או כותב ישירות בעורך, ותוך כדי קריאה מסמן כל הבטחה (setup) וכל פירעון (payoff) ומקשר ביניהם. המערכת מציגה פנקס הבטחות: אילו הבטחות פתוחות, כמה פרקים הן כבר ממתינות, ואילו פירעונות מגיעים בלי שהובטחו קודם. בנוסף, לכל סצנה הכותב ממלא שלוש שורות – מה הדמות רוצה, מה עומד בדרך, מה השתנה – וסצנות שבהן "שום דבר לא השתנה" מסומנות בדוח שמראה איפה הסיפור דורך במקום. אין כאן מודל שכותב במקום הכותב: הכלי רק שואל את השאלות שעורך טוב היה שואל.',
        en: 'Payoff is a structural editing tool for novelists and screenwriters built around one idea: everything you plant in a story – a mysterious object, a question a character asks, a looming threat – is a promise to the reader, and readers remember. The writer imports a manuscript (Word, Markdown or Scrivener) or drafts directly in the editor, and while reading marks every setup and every payoff and links them together. The result is a promise ledger: which promises are still open, how many chapters they have been waiting, and which payoffs arrive without ever being set up. Each scene also gets three lines – what the character wants, what stands in the way, what changed – and scenes where "nothing changed" surface in a report that shows where the story is treading water. No model writes in the author’s place: the tool only asks the questions a good editor would ask.',
      },
      problem: {
        he: 'כותבים מגלים את החורים בעלילה מאוחר מדי – מקוראי בטא, מעורך, או בביקורת. אקדח שהוצג בפרק 2 ונשכח, תעלומה שנפתרת בלי שרמזו עליה, ושלושה פרקים רצופים שבהם הדמות רק הולכת ממקום למקום. כלי הכתיבה הקיימים שומרים טקסט ופתקים, אבל אף אחד מהם לא זוכר מה הכותב הבטיח.',
        en: 'Writers discover plot holes far too late – from beta readers, an editor, or a review. A gun shown in chapter 2 and forgotten, a mystery solved without a single earlier hint, three consecutive chapters where the character merely travels from place to place. Existing writing tools store text and notes, but none of them remember what the author promised.',
      },
      solution: {
        he: 'פנקס הבטחות שמקשר בין הבטחות לפירעונות ומציג אילו מהן פתוחות ואיפה; שלוש שאלות קבועות לכל סצנה שמייצרות מפת מתח של כתב היד; ודוח עריכה מבנית שמצביע על פרקים שדורכים במקום – הכול על הטקסט של הכותב, בלי לכתוב אותו מחדש.',
        en: 'A promise ledger that links setups to payoffs and shows which promises are open and where; three fixed questions per scene that produce a tension map of the manuscript; and a structural report that points at chapters treading water – all on top of the writer’s own text, never rewriting it.',
      },
      usp: {
        he: 'לא עוד עורך טקסט ולא עוד "AI שכותב": Payoff סופר כמה פרקים כל הבטחה לקורא נשארת פתוחה, תופס פירעונות שמעולם לא הובטחו, ומציג את הכול בציר זמן אחד לצד מפת המתח של הסצנות.',
        en: 'Neither another text editor nor another "AI that writes for you": Payoff counts how many chapters each promise to the reader stays open, catches payoffs that were never set up, and shows it all on one timeline next to the scene tension map.',
      },
      targetUsers: {
        he: ['כותבי רומנים בטיוטה שנייה או שלישית', 'תסריטאים שמנהלים כמה קווי עלילה בסדרה', 'עורכים ספרותיים שעובדים על כמה כתבי יד במקביל', 'משתתפים בסדנאות כתיבה'],
        en: ['Novelists on a second or third draft', 'Screenwriters juggling several storylines in a series', 'Literary editors working on multiple manuscripts at once', 'Participants in creative writing workshops'],
      },
      coreFeatures: {
        he: [
          'ייבוא כתב יד מ-Word, Markdown ו-Scrivener עם חלוקה אוטומטית לפרקים ולסצנות',
          'סימון הבטחות ופירעונות בתוך הטקסט וקישור ביניהם',
          'פנקס הבטחות: פתוחות, נפרעו, ופירעונות ללא הבטחה',
          'שלוש שאלות לכל סצנה: רוצה, מפריע, השתנה',
          'מפת מתח של כתב היד לפי פרק ולפי קו עלילה',
          'דוח עריכה מבנית שמסמן פרקים שדורכים במקום',
          'ציר זמן לדמויות: באיזו סצנה כל דמות מופיעה ומה היא כבר יודעת',
          'יצוא הערות העריכה לקובץ Word עם הערות שוליים',
        ],
        en: [
          'Manuscript import from Word, Markdown and Scrivener with automatic chapter and scene splitting',
          'Mark setups and payoffs inside the text and link them',
          'Promise ledger: open, paid off, and payoffs with no setup',
          'Three questions per scene: wants, obstacle, change',
          'A tension map of the manuscript by chapter and by storyline',
          'A structural report flagging chapters that tread water',
          'Character timeline: which scene each character appears in and what they already know',
          'Export editing notes to a Word file with margin comments',
        ],
      },
      screens: [
        { name: { he: 'כתבי יד', en: 'Manuscripts' }, description: { he: 'רשימת הפרויקטים עם מספר ההבטחות הפתוחות, כמה פרקים כבר סומנו ותאריך העריכה האחרון.', en: 'Project list with the open promise count, how many chapters are marked and the last edited date.' } },
        { name: { he: 'עורך', en: 'Editor' }, description: { he: 'הטקסט במרכז, סרגל צד עם הסצנות, וסימון הבטחה או פירעון בבחירת טקסט ולחיצה אחת.', en: 'The text in the centre, a scene sidebar, and setup or payoff marking by selecting text and one click.' } },
        { name: { he: 'פנקס הבטחות', en: 'Promise ledger' }, description: { he: 'טבלה של כל ההבטחות עם פרק ההבטחה, פרק הפירעון, מספר פרקי ההמתנה וסטטוס; לחיצה קופצת לטקסט.', en: 'A table of every promise with setup chapter, payoff chapter, chapters waited and status; clicking jumps to the text.' } },
        { name: { he: 'כרטיס סצנה', en: 'Scene card' }, description: { he: 'שלושת השדות – רוצה, מפריע, השתנה – לצד הדמויות שנמצאות בסצנה ותגית של קו עלילה.', en: 'The three fields – wants, obstacle, change – next to the characters present and a storyline tag.' } },
        { name: { he: 'מפת מתח', en: 'Tension map' }, description: { he: 'גרף לאורך כתב היד שמראה הבטחות שנפתחות ונסגרות וסצנות ללא שינוי, עם סינון לפי קו עלילה.', en: 'A graph along the manuscript showing promises opening and closing and scenes without change, filtered by storyline.' } },
        { name: { he: 'דוח עריכה', en: 'Structural report' }, description: { he: 'רשימת ממצאים ממוינת לפי חומרה: הבטחות שנשכחו, פירעונות ללא הבטחה, רצפים של סצנות סטטיות.', en: 'Findings sorted by severity: forgotten promises, payoffs without a setup, runs of static scenes.' } },
        { name: { he: 'דמויות', en: 'Characters' }, description: { he: 'ציר זמן לכל דמות: הופעות, מה היא יודעת בכל נקודה, ופערים ארוכים שבהם היא נעלמת.', en: 'A timeline per character: appearances, what she knows at each point, and long gaps where she disappears.' } },
      ],
      userJourney: {
        he: [
          'הכותבת מייבאת טיוטה שנייה של רומן בן 28 פרקים',
          'בקריאה חוזרת היא מסמנת 40 הבטחות ומקשרת 31 מהן לפירעון',
          'פנקס ההבטחות מראה 9 הבטחות פתוחות, אחת מהן ממתינה מפרק 3',
          'היא ממלאת את שלוש השאלות לכל סצנה ומגלה רצף של ארבע סצנות בלי שינוי',
          'דוח העריכה מכוון אותה לאחד שתיים מהן ולהוסיף פירעון בפרק 24',
          'היא מייצאת את ההערות ל-Word ושולחת לעורך גרסה עם פחות חורים',
        ],
        en: [
          'The writer imports a second draft of a 28-chapter novel',
          'On a re-read she marks 40 setups and links 31 of them to a payoff',
          'The promise ledger shows nine open promises, one waiting since chapter 3',
          'She fills in the three questions for every scene and finds a run of four scenes with no change',
          'The structural report nudges her to merge two of them and add a payoff in chapter 24',
          'She exports the notes to Word and sends the editor a version with fewer holes',
        ],
      },
      uxDirection: {
        he: 'שולחן עריכה שקט בסגנון כתב עת: טיפוגרפיה סריפית לטקסט, גופן ללא תגים לממשק, ורקע נייר בהיר או דיו כהה. הסימונים בטקסט הם קווים תחתונים עדינים בשני צבעים – הבטחה ופירעון – ולא הדגשות צעקניות. הגרפים חד-צבעיים עם הדגשה אחת. כל ממצא בדוח מנוסח כשאלה ("האם המפתח מפרק 3 עדיין חשוב?") ולא כפסק דין.',
        en: 'A quiet editorial desk: serif type for the manuscript, a sans-serif for the interface, and a paper-light or ink-dark background. In-text marks are thin underlines in two colours – setup and payoff – rather than loud highlights. Charts are monochrome with a single accent. Every finding in the report is phrased as a question ("Does the key from chapter 3 still matter?") rather than a verdict.',
      },
      architecture: {
        he: 'אפליקציית Next.js עם עורך מבוסס Tiptap ששומר את הטקסט כ-ProseMirror JSON, כך שסימוני הבטחה ופירעון הם marks על הטקסט ושורדים עריכה. Supabase לאימות, לכתבי יד ולפנקס ההבטחות, עם שמירה אוטומטית וגרסאות. ייבוא קבצים מתבצע ב-Edge Function שמפרקת Word ו-Scrivener לפרקים ולסצנות. דוח העריכה ומפת המתח מחושבים דטרמיניסטית מהסימונים ומכרטיסי הסצנה – בלי מודל שפה בליבה. מודל שפה אופציונלי מציע מועמדים להבטחות בפרק, והכותב מאשר כל אחד בנפרד.',
        en: 'A Next.js app with a Tiptap-based editor that stores the manuscript as ProseMirror JSON, so setup and payoff marks are marks on the text and survive edits. Supabase for auth, manuscripts and the promise ledger, with autosave and versions. File import runs in an Edge Function that splits Word and Scrivener files into chapters and scenes. The structural report and tension map are computed deterministically from the marks and scene cards – no language model in the core loop. An optional model suggests setup candidates in a chapter, and the writer confirms each one individually.',
      },
      stack: ['Next.js', 'Tiptap', 'Supabase', 'Supabase Edge Functions', 'Tailwind CSS', 'Vercel', 'Stripe'],
      database: {
        he: ['profiles – משתמש, תוכנית, העדפות עורך', 'manuscripts – כתב יד, כותרת, גרסה, סטטוס', 'chapters – פרק, סדר, ספירת מילים', 'scenes – סצנה, פרק, רוצה / מפריע / השתנה, קו עלילה', 'promises – הבטחה, פירעון, פרקי המתנה, סטטוס', 'characters – דמות, הופעות, מה היא יודעת לפי סצנה', 'storylines – קווי עלילה וצבע'],
        en: ['profiles – user, plan, editor preferences', 'manuscripts – manuscript, title, version, status', 'chapters – chapter, order, word count', 'scenes – scene, chapter, wants / obstacle / change, storyline', 'promises – setup, payoff, chapters waited, status', 'characters – character, appearances, knowledge per scene', 'storylines – storylines and colour'],
      },
      auth: {
        he: 'אימייל עם קישור קסם וכניסה עם Google. כתב יד שלא פורסם הוא החומר הרגיש ביותר של כותב – RLS לפי משתמש, הצפנה במנוחה, ובלי אימון מודלים על הטקסט. שיתוף לעורך בקישור לקריאה בלבד עם תפוגה.',
        en: 'Email magic link and Google sign-in. An unpublished manuscript is a writer’s most sensitive material – per-user RLS, encryption at rest, and no model training on the text. Sharing with an editor is a read-only link with an expiry.',
      },
      monetization: {
        he: ['חינם לכתב יד אחד עד 30 אלף מילים', 'מנוי חודשי לכותבים: כתבי יד ללא הגבלה, ייבוא Scrivener ויצוא ל-Word', 'תוכנית לעורכים ולסדנאות כתיבה עם כמה כתבי יד והערות משותפות'],
        en: ['Free for one manuscript up to 30,000 words', 'Monthly writer subscription: unlimited manuscripts, Scrivener import and Word export', 'A plan for editors and writing workshops with multiple manuscripts and shared notes'],
      },
      mvpMilestones: {
        he: ['עורך עם ייבוא Markdown ו-Word וחלוקה לפרקים', 'סימון הבטחות ופירעונות ופנקס הבטחות', 'כרטיסי סצנה עם שלוש השאלות', 'מפת מתח ודוח עריכה', 'שיתוף לקריאה בלבד ויצוא הערות ל-Word', 'מנוי ותשלום'],
        en: ['Editor with Markdown and Word import and chapter splitting', 'Setup and payoff marking plus the promise ledger', 'Scene cards with the three questions', 'Tension map and structural report', 'Read-only sharing and Word export of notes', 'Subscription and billing'],
      },
      risks: {
        he: ['הסימון הידני דורש משמעת – אם הכותב לא מסמן, הפנקס נשאר ריק; ההצעות האוטומטיות חייבות להיות טובות מספיק כדי להצדיק את עצמן כבר בפרק הראשון', 'ייבוא מ-Word ומ-Scrivener שובר מבנה בקלות (כותרות פרקים לא עקביות), ולכן נדרש מסך לתיקון החלוקה', 'כותבים נאמנים לכלי הכתיבה שלהם – Payoff חייב לעבוד לצד Scrivener ו-Word ולא במקומם'],
        en: ['Manual marking takes discipline – if the writer does not mark, the ledger stays empty; automatic suggestions must be good enough to earn their place from the first chapter', 'Word and Scrivener import breaks structure easily (inconsistent chapter headings), so a split-correction screen is required', 'Writers are loyal to their writing tools – Payoff must work alongside Scrivener and Word, not replace them'],
      },
      expansion: {
        he: ['תוספים ל-Scrivener ול-Google Docs שמסנכרנים סימונים בשני הכיוונים', 'מצב סדנה: קוראי בטא מסמנים איפה איבדו הבטחה או התבלבלו', 'תבניות מבנה (מסע הגיבור, שלוש מערכות) כשכבת ייחוס מעל מפת המתח'],
        en: ['Scrivener and Google Docs plugins with two-way sync of marks', 'Workshop mode: beta readers mark where they lost track of a promise or got confused', 'Structure templates (hero’s journey, three acts) as a reference layer over the tension map'],
      },
    },
  },
  {
    id: 'underneath',
    name: { he: 'Underneath – אקורדים מתחת לזמזום', en: 'Underneath' },
    tagline: {
      he: 'מזמזמים מנגינה שמסתובבת לכם בראש, והאפליקציה מוצאת את הסולם, הקצב ושלושה אקורדים שמתאימים מתחתיה – ומנגנת אותה חזרה כשיר.',
      en: 'Hum the melody stuck in your head and the app finds its key, its tempo and three chords that sit underneath it – then plays it back as a song.',
    },
    category: 'creativity',
    secondaryCategories: ['entertainment', 'education'],
    difficulty: 'advanced',
    effort: { weeksMin: 9, weeksMax: 14 },
    budget: 'low',
    businessModel: 'freemium',
    platforms: ['ios', 'android'],
    audience: ['consumers', 'creators'],
    tags: ['music', 'humming', 'chords', 'pitch detection', 'songwriting', 'backing track', 'guitar', 'audio'],
    identity: { hue: 318, glyph: 'Un', pattern: 'wave' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: true, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Underneath מיועדת לאנשים שיש להם מנגינה בראש ואין להם מושג מה לעשות איתה: ברכה לחתונה, שיר יום הולדת לילד, נעימה לסרטון. המשתמש מזמזם או שר כמה שניות לתוך הטלפון, והאפליקציה מזהה את הסולם, את הטמפו ואת תווי המנגינה, ומציעה שתיים-שלוש התקדמויות אקורדים פשוטות שמתיישבות מתחת למנגינה הזאת – לא שיר חדש שמודל המציא, אלא ליווי למה שהמשתמש כבר שר. בלחיצה אחת המנגינה מתנגנת חזרה עם ליווי בסגנון נבחר (פולק, פופ, בוסה נובה), ולכל אקורד מוצג תרשים אצבעות לגיטרה או ליוקללה. התוצאה היא "דף שיר" שאפשר לשלוח לחבר שמנגן, או ללמוד בעצמכם – שלושה אקורדים זה משהו שכל אחד יכול.',
        en: 'Underneath is for people who have a melody in their head and no idea what to do with it: a wedding toast, a birthday song for a child, a tune for a video. The user hums or sings a few seconds into the phone, and the app detects the key, the tempo and the notes of the melody, then proposes two or three simple chord progressions that sit underneath that melody – not a new song a model made up, but accompaniment for what the user already sang. One tap plays the melody back with a backing in a chosen style (folk, pop, bossa nova), and every chord comes with a guitar or ukulele fingering diagram. The result is a "song sheet" you can send to a friend who plays, or learn yourself – three chords is something anyone can manage.',
      },
      problem: {
        he: 'רוב האנשים מסוגלים לזמזם מנגינה אבל לא יודעים באיזה סולם היא, אילו אקורדים מתאימים לה או איך להסביר אותה למישהו שמנגן. אפליקציות "צור שיר ב-AI" מחזירות משהו אחר לגמרי ממה שהיה בראש, ואפליקציות ללימוד נגינה מתחילות מתיאוריה ולא מהמנגינה של המשתמש.',
        en: 'Most people can hum a melody but have no idea what key it is in, which chords fit it or how to explain it to someone who plays. "Make a song with AI" apps return something entirely different from what was in their head, and instrument-learning apps start from theory rather than from the user’s own tune.',
      },
      solution: {
        he: 'זיהוי גובה צליל וטמפו במכשיר, הסקת הסולם מהתווים, והרמוניזציה דטרמיניסטית לפי כללים (אקורדים דיאטוניים, דומיננטה לפני החזרה לטוניקה) שמייצרת כמה ליוויים פשוטים. השמעה חוזרת עם ליווי בסגנון, תרשימי אצבעות, ודף שיר לשיתוף.',
        en: 'On-device pitch and tempo detection, key inference from the detected notes, and rule-based harmonisation (diatonic chords, a dominant before returning to the tonic) that yields a few simple accompaniments. Playback with a styled backing, fingering diagrams, and a shareable song sheet.',
      },
      usp: {
        he: 'המנגינה נשארת של המשתמש: האפליקציה לא ממציאה שיר אלא מגלה מה כבר נמצא מתחתיו – סולם, קצב ואקורדים – ומתרגמת את זה לשלושה תרשימי אצבעות שכל מתחיל יכול לנגן.',
        en: 'The melody stays the user’s own: the app does not invent a song, it reveals what is already underneath it – key, rhythm and chords – and turns that into three fingering diagrams any beginner can play.',
      },
      targetUsers: {
        he: ['אנשים בלי רקע מוזיקלי שרוצים לכתוב שיר לאירוע משפחתי', 'יוצרי תוכן שצריכים נעימה מקורית קצרה לסרטון', 'מתחילים בגיטרה או ביוקללה שרוצים לנגן משהו משלהם', 'הורים שממציאים שירי ערש ורוצים לשמור אותם'],
        en: ['People with no musical background who want to write a song for a family event', 'Content creators who need a short original tune for a video', 'Guitar or ukulele beginners who want to play something of their own', 'Parents who invent lullabies and want to keep them'],
      },
      coreFeatures: {
        he: [
          'הקלטת זמזום של 5–20 שניות עם מד רעש רקע',
          'זיהוי סולם, טמפו ותווי המנגינה במכשיר, עם תיקון תו בגרירה',
          'שתיים-שלוש התקדמויות אקורדים מוצעות, כל אחת ניתנת להשמעה',
          'ליווי בסגנונות: פולק, פופ, בוסה נובה, בלדה',
          'תרשימי אצבעות לגיטרה וליוקללה לכל אקורד, כולל קאפו לסולמות קשים',
          'דף שיר לשיתוף: מנגינה, אקורדים, טמפו וקובץ שמע',
          'מצב "זמזום בלולאה" לפיתוח המנגינה לבית ולפזמון',
        ],
        en: [
          'Record a 5–20 second hum with a background-noise meter',
          'On-device key, tempo and melody-note detection, with drag-to-fix for a wrong note',
          'Two or three suggested chord progressions, each playable',
          'Backing styles: folk, pop, bossa nova, ballad',
          'Guitar and ukulele fingering diagrams per chord, including a capo for hard keys',
          'A shareable song sheet: melody, chords, tempo and an audio file',
          'A "loop the hum" mode for growing the melody into a verse and a chorus',
        ],
      },
      screens: [
        { name: { he: 'הקלטה', en: 'Record' }, description: { he: 'כפתור הקלטה גדול, מד רעש רקע, וטיפ קצר: "זמזמו לה-לה-לה בקצב קבוע".', en: 'A big record button, a background-noise meter and a short tip: "hum la-la-la at a steady pace".' } },
        { name: { he: 'מה שמענו', en: 'What we heard' }, description: { he: 'המנגינה כנקודות על גלילת פסנתר פשוטה, הסולם והטמפו שזוהו, וגרירה לתיקון תו.', en: 'The melody as dots on a simple piano roll, the detected key and tempo, and drag-to-fix for a note.' } },
        { name: { he: 'מתחת למנגינה', en: 'Underneath' }, description: { he: 'כרטיסי התקדמות אקורדים – כל אחד עם נגן קטן – ובחירת סגנון ליווי.', en: 'Chord progression cards – each with a mini player – and a backing-style picker.' } },
        { name: { he: 'דף שיר', en: 'Song sheet' }, description: { he: 'המנגינה עם האקורדים מעליה, תרשימי אצבעות בשורה למטה, וכפתורי השמעה ושיתוף.', en: 'The melody with chords above it, fingering diagrams in a row at the bottom, and play and share buttons.' } },
        { name: { he: 'השירים שלי', en: 'My songs' }, description: { he: 'ספריית ההקלטות עם כותרת, סולם, תאריך, והאם כבר יש להן ליווי.', en: 'The recordings library with title, key, date and whether a backing exists yet.' } },
        { name: { he: 'לימוד אקורד', en: 'Learn a chord' }, description: { he: 'תרשים אצבעות מוגדל, השמעה איטית של המעבר בין שני אקורדים, וטיימר תרגול.', en: 'An enlarged fingering diagram, slow playback of the change between two chords, and a practice timer.' } },
      ],
      userJourney: {
        he: [
          'אבא מזמזם שיר ערש שהמציא לבת שלו, 12 שניות',
          'האפליקציה מזהה סול מז׳ור ב-72 פעימות לדקה ומציגה את התווים',
          'הוא גורר למקום תו אחד שזוהה גבוה מדי',
          'מקבל שלוש הצעות ליווי ובוחר את הפולקית',
          'שומע את שיר הערש שלו עם גיטרה מתחתיו ומתרגש',
          'משתף דף שיר עם אחיו שמנגן, ושומר את ההקלטה בספרייה',
        ],
        en: [
          'A father hums a lullaby he made up for his daughter, 12 seconds long',
          'The app detects G major at 72 beats per minute and shows the notes',
          'He drags one note that was detected too high back into place',
          'Gets three backing suggestions and picks the folk one',
          'Hears his lullaby with a guitar underneath it and gets a little emotional',
          'Shares the song sheet with his brother who plays, and saves the recording to the library',
        ],
      },
      uxDirection: {
        he: 'חם וסלחני – רוב המשתמשים מתביישים לשיר לטלפון. מסך ההקלטה כמעט ריק, עם גל צליל עדין וטיפ אחד. התווים מוצגים כנקודות צבעוניות ולא כתווים קלאסיים, והאקורדים כשמות גדולים (G, D, Em) עם תרשים אצבעות מתחת. כל שגיאת זיהוי ניתנת לתיקון בגרירה, ואין טרמינולוגיה מוזיקלית במסכים הראשונים.',
        en: 'Warm and forgiving – most users are embarrassed to sing at their phone. The record screen is nearly empty, with a gentle waveform and one tip. Notes are shown as coloured dots rather than classical notation, and chords as big names (G, D, Em) with a fingering diagram beneath. Every detection error can be fixed by dragging, and there is no music terminology on the first screens.',
      },
      architecture: {
        he: 'Expo עם expo-audio להקלטה ולהשמעה ו-Reanimated למסך התווים. זיהוי גובה צליל (אלגוריתם YIN או pYIN) וזיהוי טמפו רצים במכשיר כמודול נייטיב או ב-WebAssembly, ומפיקים רצף תווים מקוונטז. הסקת הסולם וההרמוניזציה הן קוד דטרמיניסטי: ניקוד של כל אקורד דיאטוני מול תווי המנגינה בכל פעימה. הליווי מופק מקובצי SoundFont קטנים ומתבניות קצב לכל סגנון, ומעורבב למיקס במכשיר. Supabase לאימות, לספריית השירים ולאחסון קובצי השמע; אין צורך במודל שפה בכלל.',
        en: 'Expo with expo-audio for recording and playback and Reanimated for the notes screen. Pitch detection (YIN or pYIN) and tempo estimation run on device as a native module or in WebAssembly and produce a quantised note sequence. Key inference and harmonisation are deterministic code: scoring every diatonic chord against the melody notes on each beat. The backing is rendered from small SoundFont files and per-style rhythm patterns and mixed on device. Supabase for auth, the song library and audio storage; no language model is needed at all.',
      },
      stack: ['Expo', 'expo-audio', 'Reanimated', 'WebAssembly pitch detection module', 'SoundFont samples', 'Supabase', 'Supabase Storage'],
      database: {
        he: ['profiles – משתמש, כלי מועדף (גיטרה / יוקללה), מכסת חינם', 'recordings – הקלטה, קובץ שמע, משך, רמת רעש', 'melodies – רצף תווים מקוונטז, סולם, טמפו, תיקונים ידניים', 'arrangements – התקדמות אקורדים, סגנון ליווי, קובץ מיקס', 'song_sheets – דף שיר משותף, קישור ציבורי, תפוגה'],
        en: ['profiles – user, preferred instrument (guitar / ukulele), free quota', 'recordings – recording, audio file, duration, noise level', 'melodies – quantised note sequence, key, tempo, manual fixes', 'arrangements – chord progression, backing style, mix file', 'song_sheets – shared sheet, public link, expiry'],
      },
      auth: {
        he: 'אפשר להתחיל בלי חשבון – ההקלטות נשמרות במכשיר. כניסה עם Apple או Google נדרשת רק לשמירה בענן ולשיתוף דף שיר. הקלטות קול הן מידע אישי: RLS לפי משתמש ומחיקה מלאה לפי בקשה.',
        en: 'Start without an account – recordings stay on the device. Apple or Google sign-in is required only for cloud saving and sharing a song sheet. Voice recordings are personal data: per-user RLS and full deletion on request.',
      },
      monetization: {
        he: ['חינם: שלושה שירים שמורים וסגנון ליווי אחד', 'מנוי לכל הסגנונות, יצוא שמע באיכות מלאה ושירים ללא הגבלה', 'חבילות סגנון מיוחדות (ים תיכוני, ילדים, חגים) ברכישה חד-פעמית'],
        en: ['Free: three saved songs and one backing style', 'A subscription for all styles, full-quality audio export and unlimited songs', 'Special style packs (Mediterranean, kids, holidays) as one-time purchases'],
      },
      mvpMilestones: {
        he: ['הקלטה וזיהוי תווים במכשיר עם מסך תיקון', 'הסקת סולם וטמפו', 'הרמוניזציה דטרמיניסטית עם שלוש הצעות', 'השמעת ליווי בסגנון אחד', 'תרשימי אצבעות ודף שיר לשיתוף', 'ספרייה, חשבון ומסך תשלום'],
        en: ['On-device recording and note detection with a correction screen', 'Key and tempo inference', 'Deterministic harmonisation with three suggestions', 'Backing playback in one style', 'Fingering diagrams and a shareable song sheet', 'Library, account and paywall'],
      },
      risks: {
        he: ['זיהוי גובה צליל מזמזום אינו מדויק (ויברטו, רעש רקע, שירה מחוץ לסולם) – מסך התיקון הוא חלק מהמוצר ולא תוספת', 'הרמוניזציה לפי כללים נשמעת גנרית במנגינות לא דיאטוניות – להגביל את ההבטחה לשירים פשוטים', 'עיבוד שמע נייטיב ב-Expo דורש development build ומודול מותאם, מה שמאריך את הפיתוח'],
        en: ['Pitch detection from humming is imprecise (vibrato, background noise, singing out of tune) – the correction screen is part of the product, not an add-on', 'Rule-based harmonisation sounds generic on non-diatonic melodies – limit the promise to simple songs', 'Native audio processing in Expo requires a development build and a custom module, which stretches the timeline'],
      },
      expansion: {
        he: ['יצוא MIDI ו-MusicXML לאפליקציות תווים ול-DAW', 'מצב דואט: שני אנשים מזמזמים בית ופזמון והאפליקציה מחברת ביניהם', 'שיעורי מעבר בין אקורדים שנבנים מהשיר של המשתמש עצמו'],
        en: ['MIDI and MusicXML export to notation apps and DAWs', 'A duet mode where two people hum a verse and a chorus and the app stitches them together', 'Chord-change lessons built from the user’s own song'],
      },
    },
  },
  {
    id: 'sameframe',
    name: { he: 'Sameframe – אותה זווית, כל מוצר', en: 'Sameframe' },
    tagline: {
      he: 'מצלמת מוצרים לחנויות קטנות: מצלמים פריט אחד נכון, והאפליקציה מראה שכבת רפאים של הזווית, המרחק והמסגור כדי שכל פריט הבא ייראה כמוהו.',
      en: 'A product camera for small shops: shoot one item right, and the app overlays a ghost of that angle, distance and framing so every next item matches it.',
    },
    category: 'creativity',
    secondaryCategories: ['ecommerce', 'business'],
    difficulty: 'intermediate',
    effort: { weeksMin: 5, weeksMax: 7 },
    budget: 'low',
    businessModel: 'b2b',
    platforms: ['ios', 'android', 'web'],
    audience: ['businesses', 'creators'],
    tags: ['photography', 'product photos', 'camera', 'ecommerce', 'catalog', 'consistency', 'overlay', 'small business'],
    identity: { hue: 175, glyph: 'Sf', pattern: 'diagonal' },
    flags: { beginnerFriendly: false, profitPotential: 'high', experimental: false, trending: false, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Sameframe פותרת את הבעיה הוויזואלית הנפוצה ביותר של חנויות אונליין קטנות: עמוד קטלוג שבו כל מוצר צולם ביום אחר, מזווית אחרת, בגובה אחר ובאור אחר. במקום לשכור צלם לכל 40 פריטים חדשים, בעל החנות מצלם פריט אחד כמו שצריך ושומר אותו כ"מתכון צילום": זווית המצלמה מהג׳ירוסקופ, מרחק משוער, מסגור, יחס תמונה ורקע. מאותו רגע המצלמה מציגה שכבת רפאים של תמונת הייחוס, פלס חי ומסגרת חיתוך, ומסמנת בירוק כשהטלפון נמצא בזווית ובמרחק הנכונים. אחרי הצילום הסדרה כולה עוברת חיתוך אחיד, יישור רקע והסרת רקע אופציונלית, ומיוצאת בשמות קבצים לפי מק״ט ישירות לחנות. מתכון צילום אפשר לשתף עם עובד או עם ספק, כך שגם מי שמצלם בפעם הראשונה מקבל את אותו פריים.',
        en: 'Sameframe fixes the most common visual problem of small online shops: a catalogue page where every product was shot on a different day, from a different angle, at a different height and in different light. Instead of hiring a photographer for every 40 new items, the shop owner shoots one item properly and saves it as a "shot recipe": camera angle from the gyroscope, approximate distance, framing, aspect ratio and background. From then on the camera shows a ghost overlay of the reference photo, a live level and a crop frame, and turns green when the phone is at the right angle and distance. After the shoot the whole series gets a uniform crop, background levelling and optional background removal, and exports with SKU-based file names straight to the store. A shot recipe can be shared with an employee or a supplier, so even a first-time shooter gets the same frame.',
      },
      problem: {
        he: 'חנויות קטנות מצלמות מוצרים בעצמן, ובלי צלם קבוע התוצאה היא קטלוג לא אחיד: תיקים מזווית מלמעלה ליד תיקים מהצד, רקע לבן ליד רקע קרם, ומוצרים זהים שנראים בגדלים שונים. זה פוגע באמון ובהמרות, ותיקון בדיעבד בעריכה לוקח שעות ואף פעם לא באמת מיישר זוויות.',
        en: 'Small shops photograph products themselves, and without a regular photographer the result is an inconsistent catalogue: bags shot from above next to bags shot from the side, white backgrounds next to cream ones, and identical products that look different sizes. It hurts trust and conversion, and fixing it afterwards in editing takes hours and never truly aligns angles.',
      },
      solution: {
        he: 'מתכון צילום שנשמר מתמונת ייחוס אחת ומנחה את המצלמה בזמן אמת – שכבת רפאים, פלס מהג׳ירוסקופ, סימון ירוק כשמתיישרים – ואחריו עיבוד סדרתי שמחיל את אותו חיתוך ורקע על כל הסדרה ומייצא לפי מק״ט. המתכון משותף עם כל מי שמצלם עבור החנות.',
        en: 'A shot recipe captured from one reference photo that guides the camera in real time – ghost overlay, gyroscope level, a green signal when aligned – followed by batch processing that applies the same crop and background to the whole series and exports by SKU. The recipe is shared with everyone who shoots for the shop.',
      },
      usp: {
        he: 'הנחיה בזמן הצילום ולא תיקון אחריו: הזווית והמרחק נמדדים מהחיישנים ומושווים לתמונת הייחוס, כך שהאחידות נוצרת במצלמה – ומתכון הצילום הופך צלם מזדמן לחלק מפס ייצור.',
        en: 'Guidance at capture time instead of correction afterwards: angle and distance are measured from the sensors and compared to the reference, so consistency is created in the camera – and the shot recipe turns an occasional shooter into part of a production line.',
      },
      targetUsers: {
        he: ['חנויות אונליין קטנות שמצלמות את המלאי בעצמן', 'מוכרים בשוקי יד שנייה ובמרקטפלייסים עם מאות פריטים', 'סוכנויות קטנות שמנהלות קטלוגים לכמה לקוחות', 'מסעדות ובתי קפה שמצלמים תפריט'],
        en: ['Small online shops that photograph their own inventory', 'Second-hand and marketplace sellers with hundreds of items', 'Small agencies managing catalogues for several clients', 'Restaurants and cafés shooting a menu'],
      },
      coreFeatures: {
        he: [
          'שמירת מתכון צילום מתמונת ייחוס: זווית, מרחק, מסגור, יחס תמונה, רקע',
          'מצלמה מונחית: שכבת רפאים, פלס חי וסימון ירוק כשמתיישרים',
          'צילום סדרתי עם מעבר מהיר בין פריטים וסריקת ברקוד למק״ט',
          'עיבוד סדרתי: חיתוך אחיד, יישור רקע, הסרת רקע אופציונלית',
          'יצוא בשמות קבצים לפי מק״ט ובגדלים המתאימים לחנות ולמרקטפלייסים',
          'שיתוף מתכונים עם עובדים וספקים בקישור',
          'לוח קטלוג באינטרנט שמראה אילו מק״טים עדיין בלי תמונה אחידה',
        ],
        en: [
          'Save a shot recipe from a reference photo: angle, distance, framing, aspect ratio, background',
          'Guided camera: ghost overlay, live level and a green signal when aligned',
          'Batch shooting with quick item switching and barcode scanning for SKUs',
          'Batch processing: uniform crop, background levelling, optional background removal',
          'Export with SKU-based file names and sizes for the store and marketplaces',
          'Share recipes with employees and suppliers via a link',
          'A web catalogue board showing which SKUs still lack a consistent photo',
        ],
      },
      screens: [
        { name: { he: 'מתכונים', en: 'Recipes' }, description: { he: 'רשימת מתכוני הצילום של החנות עם תמונת ייחוס, מספר הפריטים שצולמו בכל אחד וכפתור "צלם סדרה".', en: 'The shop’s shot recipes with reference photo, items shot with each, and a "shoot a series" button.' } },
        { name: { he: 'יצירת מתכון', en: 'New recipe' }, description: { he: 'צילום תמונת ייחוס, סימון המוצר במסגרת, ואישור הזווית והמרחק שנמדדו אוטומטית.', en: 'Capture a reference photo, frame the product, and confirm the automatically measured angle and distance.' } },
        { name: { he: 'מצלמה מונחית', en: 'Guided camera' }, description: { he: 'תצוגה חיה עם שכבת רפאים שקופה למחצה, פלס, מד מרחק, ומסגרת שהופכת ירוקה כשהכול מתיישר.', en: 'Live view with a translucent ghost overlay, a level, a distance gauge and a frame that turns green when everything aligns.' } },
        { name: { he: 'סדרה', en: 'Series' }, description: { he: 'רשת של כל הפריטים שצולמו עם מק״ט, סימון של צילומים שחרגו מהמתכון וכפתור צילום חוזר.', en: 'A grid of every item shot with its SKU, flags for off-recipe shots and a reshoot button.' } },
        { name: { he: 'עיבוד', en: 'Processing' }, description: { he: 'תצוגה מקדימה של החיתוך האחיד, בחירת רקע והסרת רקע, והתקדמות העיבוד.', en: 'A preview of the uniform crop, background choice and removal, and processing progress.' } },
        { name: { he: 'יצוא', en: 'Export' }, description: { he: 'בחירת יעד (קובץ ZIP, Shopify, מרקטפלייס), גדלים ותבנית שמות קבצים לפי מק״ט.', en: 'Pick a destination (ZIP file, Shopify, marketplace), sizes and a SKU-based file name template.' } },
        { name: { he: 'לוח קטלוג', en: 'Catalogue board' }, description: { he: 'מסך אינטרנט לבעל החנות: איזה חלק מהקטלוג צולם לפי מתכון, פריטים חסרים ומי צילם מה.', en: 'A web screen for the owner: the share of the catalogue shot on recipe, missing items and who shot what.' } },
      ],
      userJourney: {
        he: [
          'בעלת חנות תכשיטים מצלמת עגיל אחד על רקע לבן ושומרת מתכון "תכשיטים – מלמעלה"',
          'מגיע משלוח של 35 דגמים חדשים והיא פותחת צילום סדרה',
          'לכל דגם היא סורקת את המק״ט, מיישרת לפי שכבת הרפאים ומצלמת כשהמסגרת ירוקה',
          'העיבוד הסדרתי חותך ומיישר את כל 35 התמונות באותו אופן',
          'היא מייצאת לחנות בשמות קבצים לפי מק״ט והתמונות עולות לעמודי המוצר',
          'שולחת את המתכון לעובדת החדשה, שמצלמת את המשלוח הבא בדיוק באותו פריים',
        ],
        en: [
          'A jewellery shop owner shoots one earring on a white background and saves a "jewellery – top-down" recipe',
          'A delivery of 35 new designs arrives and she opens a series shoot',
          'For each design she scans the SKU, aligns to the ghost overlay and shoots when the frame turns green',
          'Batch processing crops and levels all 35 photos the same way',
          'She exports to the store with SKU-based file names and the photos land on the product pages',
          'She sends the recipe to the new employee, who shoots the next delivery in exactly the same frame',
        ],
      },
      uxDirection: {
        he: 'כלי עבודה ולא אפליקציית צילום יצירתית: תצוגת המצלמה תופסת את כל המסך, הכפתורים גדולים לעבודה ביד אחת, והמשוב הוא צבע אחד – אדום, צהוב, ירוק – שרואים גם בזווית העין. שכבת הרפאים שקופה מספיק כדי לא להפריע, והטקסט מצטמצם למספרים: מרחק, זווית, מק״ט. מסך האינטרנט שומר על אותה שפה חזותית ברשת צפופה.',
        en: 'A work tool, not a creative camera app: the live view fills the screen, buttons are large for one-handed use, and feedback is a single colour – red, amber, green – visible from the corner of the eye. The ghost overlay is translucent enough not to get in the way, and text is reduced to numbers: distance, angle, SKU. The web screen keeps the same visual language in a dense grid.',
      },
      architecture: {
        he: 'Expo עם expo-camera לתצוגה החיה, expo-sensors לזווית מהג׳ירוסקופ, ו-Skia לציור שכבת הרפאים והמסגרת. המרחק מוערך לפי גודל המוצר במסגרת ביחס לתמונת הייחוס (ו-LiDAR במכשירים שתומכים בו). עיבוד התמונות – חיתוך, יישור רקע – רץ במכשיר; הסרת רקע נעשית דרך ספק API מנוהל כאופציה בתשלום. Supabase לאימות, לחנויות, למתכונים ולמטא-דאטה של הסדרות, ו-Supabase Storage לתמונות. לוח הקטלוג הוא אפליקציית Next.js קטנה על אותו מסד נתונים, והיצוא לחנות עובר דרך ה-API של Shopify.',
        en: 'Expo with expo-camera for the live view, expo-sensors for the gyroscope angle, and Skia to draw the ghost overlay and frame. Distance is estimated from the product’s size in frame relative to the reference (and LiDAR on supported devices). Image processing – crop, background levelling – runs on device; background removal goes through a managed API as a paid option. Supabase for auth, shops, recipes and series metadata, with Supabase Storage for photos. The catalogue board is a small Next.js app on the same database, and store export goes through the Shopify API.',
      },
      stack: ['Expo', 'expo-camera', 'expo-sensors', 'React Native Skia', 'Supabase', 'Supabase Storage', 'Next.js', 'Shopify API'],
      database: {
        he: ['shops – חנות, חברים, תפקידים, תוכנית', 'recipes – מתכון, תמונת ייחוס, זווית, מרחק, מסגור, רקע', 'series – סדרת צילום, מתכון, מי צילם, תאריך', 'shots – צילום, מק״ט, סטייה מהמתכון, קובץ מקור', 'processed_images – תמונה מעובדת, גודל, יעד יצוא, סטטוס', 'exports – יצוא, יעד, רשימת קבצים, שגיאות'],
        en: ['shops – shop, members, roles, plan', 'recipes – recipe, reference photo, angle, distance, framing, background', 'series – shoot series, recipe, shooter, date', 'shots – shot, SKU, deviation from recipe, source file', 'processed_images – processed image, size, export target, status', 'exports – export, destination, file list, errors'],
      },
      auth: {
        he: 'כניסה עם אימייל או Google לבעל החנות, והזמנת עובדים וספקים בקישור עם תפקיד "צלם" שרואה רק מתכונים וסדרות. RLS לפי חנות, ותמונות המקור בקבוצות אחסון פרטיות.',
        en: 'Email or Google sign-in for the owner, and invitations for employees and suppliers via a link with a "shooter" role that sees only recipes and series. RLS per shop, and source photos in private storage buckets.',
      },
      monetization: {
        he: ['מנוי חודשי לחנות לפי מספר המק״טים המעובדים', 'תוספת בתשלום להסרת רקע וליצוא ישיר ל-Shopify', 'תוכנית לסוכנויות עם כמה חנויות ומתכונים משותפים'],
        en: ['Monthly subscription per shop by number of processed SKUs', 'Paid add-on for background removal and direct Shopify export', 'An agency plan with multiple shops and shared recipes'],
      },
      mvpMilestones: {
        he: ['יצירת מתכון מתמונת ייחוס עם זווית מהחיישנים', 'מצלמה מונחית עם שכבת רפאים ומשוב ירוק', 'צילום סדרה עם הזנת מק״ט ידנית', 'עיבוד סדרתי: חיתוך אחיד ויצוא ZIP', 'שיתוף מתכונים והזמנת צלמים', 'הסרת רקע ויצוא ל-Shopify'],
        en: ['Recipe creation from a reference photo with sensor-based angle', 'Guided camera with ghost overlay and green feedback', 'Series shooting with manual SKU entry', 'Batch processing: uniform crop and ZIP export', 'Recipe sharing and shooter invitations', 'Background removal and Shopify export'],
      },
      risks: {
        he: ['הערכת מרחק ללא LiDAR היא מקורבת – להציג טווח ולא מספר מדויק, ולהישען על גודל המוצר במסגרת', 'תאורה שמשתנה בין ימים שוברת אחידות גם כשהזווית מושלמת – צריך מדידת תאורה והמלצה פשוטה לפני הצילום', 'מצלמה, חיישנים ו-Skia דורשים development build ובדיקות על מגוון מכשירי אנדרואיד'],
        en: ['Distance estimation without LiDAR is approximate – show a range rather than an exact number and lean on product size in frame', 'Light that changes between days breaks consistency even with a perfect angle – a light reading and a simple recommendation before shooting are needed', 'Camera, sensors and Skia require a development build and testing across a range of Android devices'],
      },
      expansion: {
        he: ['מתכוני וידאו קצרים: אותו סיבוב של 360 מעלות לכל מוצר', 'בדיקת איכות אוטומטית מול דרישות המרקטפלייס (רקע, שוליים, רזולוציה)', 'ספריית מתכונים מוכנים לפי סוג מוצר: בגדים, תכשיטים, אוכל, רהיטים'],
        en: ['Short video recipes: the same 360-degree turn for every product', 'Automatic quality checks against marketplace requirements (background, margins, resolution)', 'A library of ready recipes by product type: clothing, jewellery, food, furniture'],
      },
    },
  },
  {
    id: 'dovetail',
    name: { he: 'Dovetail – יומן הבנייה שהופך למדריך', en: 'Dovetail' },
    tagline: {
      he: 'מצלמים תוך כדי העבודה כמו תמיד, עונים על שאלה אחת לכל תמונה, ובסוף יש מדריך מאויר, רשימת חומרים ועלות אמיתית של היצירה.',
      en: 'Snap photos while you build, answer one question per photo, and end up with an illustrated guide, a materials list and the true cost of the piece.',
    },
    category: 'creativity',
    secondaryCategories: ['lifestyle', 'ecommerce'],
    difficulty: 'intermediate',
    effort: { weeksMin: 6, weeksMax: 9 },
    budget: 'medium',
    businessModel: 'marketplace',
    platforms: ['cross-platform'],
    audience: ['creators', 'consumers'],
    tags: ['crafts', 'makers', 'woodworking', 'knitting', 'tutorials', 'build log', 'pricing', 'patterns'],
    identity: { hue: 28, glyph: 'Dt', pattern: 'dots' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: true, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Dovetail מיועדת לאנשים שבונים דברים בידיים – נגרות, סריגה, קרמיקה, תפירה, עור – ואף פעם לא מספיקים לתעד כמו שצריך. ההנחה שבבסיס המוצר: יוצרים ממילא מצלמים תוך כדי עבודה, רק לא עושים עם זה כלום. באפליקציה כל פרויקט הוא יומן בנייה: מצלמים שלב, והאפליקציה שואלת שאלה אחת קצרה ("מה עשית כאן?", "איזה חומר?", "כמה זמן לקח?") שעונים עליה בקול או בכמה מילים. בסוף הפרויקט לוחצים "הפוך למדריך" ומקבלים מדריך מאויר שלב אחר שלב, רשימת חומרים וכלים שנאספה מהתשובות, וסיכום של שעות העבודה ועלות החומרים – המספר שרוב היוצרים לא יודעים כשהם מתמחרים. את המדריך אפשר לשמור, לשתף, או להעמיד למכירה בחנות המדריכים של Dovetail, שבה קונים משלמים על תהליך אמיתי ולא על הוראות גנריות.',
        en: 'Dovetail is for people who make things with their hands – woodworking, knitting, ceramics, sewing, leather – and never get around to documenting properly. The product rests on one assumption: makers already take photos while they work, they just never do anything with them. In the app every project is a build log: you photograph a step and the app asks one short question ("what did you do here?", "which material?", "how long did it take?") that you answer by voice or in a few words. At the end you tap "turn into a guide" and get an illustrated step-by-step guide, a materials and tools list collected from your answers, and a summary of hours worked and material cost – the number most makers do not know when they set a price. The guide can be kept, shared, or listed in Dovetail’s guide shop, where buyers pay for a real process rather than generic instructions.',
      },
      problem: {
        he: 'יוצרים מסיימים פרויקט עם 60 תמונות בגלריה ובלי מדריך, בלי רשימת חומרים ובלי מושג כמה שעות הושקעו. לכתוב מדריך בדיעבד לוקח ערב שלם, ולכן זה לא קורה; ותמחור היצירה נעשה לפי תחושה, בדרך כלל נמוך מדי. המדריכים שנמכרים ברשת נכתבים לרוב על ידי המעטים שיש להם זמן לכתוב, לא על ידי מי שבונה הכי טוב.',
        en: 'Makers finish a project with 60 photos in the camera roll and no guide, no materials list and no idea how many hours went in. Writing a guide afterwards takes a whole evening, so it never happens; and pricing the piece is done by gut feeling, usually too low. The guides sold online are mostly written by the few who have time to write, not by the people who build best.',
      },
      solution: {
        he: 'תיעוד כתוצר לוואי של הבנייה: תמונה, שאלה אחת, תשובה קצרה. מהחומר הזה נבנים אוטומטית מדריך מאויר, רשימת חומרים וכלים, וחישוב עלות אמיתית לפי שעות וחומרים. ומעל זה – חנות מדריכים שבה התהליך המתועד הוא המוצר.',
        en: 'Documentation as a by-product of building: a photo, one question, a short answer. From that material the app assembles an illustrated guide, a materials and tools list, and a true-cost calculation from hours and materials. On top of it, a guide shop where the documented process is the product.',
      },
      usp: {
        he: 'אפס עבודת כתיבה בסוף: המדריך, רשימת החומרים ועלות היצירה נוצרים מהתמונות שהיוצר מצלם ממילא ומתשובה של משפט אחד לכל שלב – ואז אפשר למכור את התהליך עצמו.',
        en: 'Zero write-up at the end: the guide, the materials list and the cost of the piece come out of the photos the maker takes anyway plus a one-sentence answer per step – and then the process itself can be sold.',
      },
      targetUsers: {
        he: ['נגרים חובבים ויוצרי רהיטים קטנים', 'סורגות ותופרות שמוכרות גם דוגמאות', 'קדרים ואמני קרמיקה שמנהלים סטודיו קטן', 'מורים לסדנאות יצירה שצריכים חומר מודפס לתלמידים'],
        en: ['Hobbyist woodworkers and small furniture makers', 'Knitters and sewists who also sell patterns', 'Potters and ceramic artists running a small studio', 'Craft workshop teachers who need printed material for students'],
      },
      coreFeatures: {
        he: [
          'יומן בנייה: תמונה לכל שלב עם שאלה אחת שעונים עליה בקול או בטקסט',
          'טיימר עבודה שרץ ברקע ומשייך זמן לכל שלב',
          'איסוף חומרים וכלים מהתשובות לרשימה אחת עם כמויות ומחירים',
          '"הפוך למדריך": מדריך מאויר שלב אחר שלב עם טקסט שנערך מהתשובות',
          'חישוב עלות אמיתית: שעות × תעריף + חומרים, והצעת מחיר לפי מרווח',
          'יצוא PDF ושיתוף בקישור, כולל תמונות ברזולוציה מלאה',
          'חנות מדריכים עם תצוגה מקדימה של שלושת השלבים הראשונים',
          'ספריית חומרים אישית שזוכרת מחירים וספקים',
        ],
        en: [
          'Build log: a photo per step with one question answered by voice or text',
          'A work timer that runs in the background and attributes time to each step',
          'Materials and tools gathered from the answers into one list with quantities and prices',
          '"Turn into a guide": an illustrated step-by-step guide with text edited from the answers',
          'True-cost calculation: hours × rate + materials, and a suggested price by margin',
          'PDF export and link sharing, including full-resolution photos',
          'A guide shop with a preview of the first three steps',
          'A personal materials library that remembers prices and suppliers',
        ],
      },
      screens: [
        { name: { he: 'הפרויקטים שלי', en: 'My projects' }, description: { he: 'כרטיסי פרויקט עם התמונה האחרונה, מספר השלבים, השעות שנצברו והסטטוס (בבנייה / מדריך / למכירה).', en: 'Project cards with the latest photo, step count, hours logged and status (building / guide / for sale).' } },
        { name: { he: 'שלב חדש', en: 'New step' }, description: { he: 'מצלמה או בחירה מהגלריה, ואז שאלה אחת גדולה עם כפתור הקלטה ושדה טקסט קצר.', en: 'Camera or gallery pick, then one big question with a record button and a short text field.' } },
        { name: { he: 'יומן הבנייה', en: 'Build log' }, description: { he: 'ציר זמן של השלבים עם תמונה, תשובה, משך וחומרים שזוהו; גרירה לסידור מחדש.', en: 'A timeline of steps with photo, answer, duration and detected materials; drag to reorder.' } },
        { name: { he: 'חומרים ועלות', en: 'Materials & cost' }, description: { he: 'רשימת החומרים והכלים עם כמות ומחיר לעריכה, סך השעות, ומחשבון מחיר לפי תעריף ומרווח.', en: 'Materials and tools list with editable quantity and price, total hours, and a price calculator by rate and margin.' } },
        { name: { he: 'עריכת מדריך', en: 'Guide editor' }, description: { he: 'תצוגה מקדימה של המדריך המאויר עם טקסט שאפשר לתקן, הסתרת שלבים ובחירת תמונת שער.', en: 'A preview of the illustrated guide with editable text, hidden steps and a cover photo choice.' } },
        { name: { he: 'פרסום', en: 'Publish' }, description: { he: 'בחירה בין קישור פרטי, PDF או העלאה לחנות עם מחיר, תגיות ורמת קושי.', en: 'Choose between a private link, a PDF or a shop listing with price, tags and difficulty.' } },
        { name: { he: 'חנות המדריכים', en: 'Guide shop' }, description: { he: 'גלריית מדריכים לפי תחום עם תצוגה מקדימה של שלושה שלבים, זמן בנייה ועלות חומרים משוערת.', en: 'A gallery of guides by craft with a three-step preview, build time and estimated material cost.' } },
      ],
      userJourney: {
        he: [
          'נגר חובב פותח פרויקט "שולחן קפה מאלון" ומפעיל טיימר',
          'אחרי כל שלב הוא מצלם ועונה בקול: "חיתוך רגליים, אלון 40 מ״מ, שעה"',
          'אחרי שבועיים יש 23 שלבים, 14 שעות ו-9 פריטי חומר עם מחירים',
          'הוא לוחץ "הפוך למדריך", מתקן שני משפטים ומסתיר שלב שנכשל',
          'מסך העלות מראה שהשולחן עלה לו 380 ש״ח בחומרים ו-14 שעות – והוא מתמחר בהתאם',
          'הוא מעלה את המדריך לחנות ומוכר אותו לנגרים אחרים שרוצים לבנות את אותו שולחן',
        ],
        en: [
          'A hobbyist woodworker opens an "oak coffee table" project and starts the timer',
          'After every step he photographs and answers by voice: "cutting the legs, 40mm oak, one hour"',
          'Two weeks later there are 23 steps, 14 hours and nine material items with prices',
          'He taps "turn into a guide", fixes two sentences and hides a step that failed',
          'The cost screen shows the table took 380 shekels in materials and 14 hours – and he prices it accordingly',
          'He lists the guide in the shop and sells it to other woodworkers who want to build the same table',
        ],
      },
      uxDirection: {
        he: 'מתאים לידיים מלוכלכות: כפתורים ענקיים, הקלטה קולית כברירת מחדל, ומסך שלב חדש שמסתיים בשתי נגיעות. פלטה של עץ, חימר ובד – חום, טרקוטה ואפור חם – ותמונות גדולות בלי מסגרות. המדריך המוכן נראה כמו חוברת מודפסת, עם מספור שלבים ברור וטיפוגרפיה שנוחה להדפסה.',
        en: 'Built for dirty hands: huge buttons, voice recording by default, and a new-step screen that finishes in two taps. A palette of wood, clay and cloth – brown, terracotta and warm grey – with large, frameless photos. The finished guide looks like a printed booklet, with clear step numbering and print-friendly typography.',
      },
      architecture: {
        he: 'Expo עם expo-camera, expo-image-picker ו-expo-audio להקלטת התשובות, ו-expo-background-task לטיימר שממשיך לרוץ. התשובות הקוליות מתומללות ב-Edge Function, ומודל שפה מחלץ מהן חומרים, כמויות ומשכים לסכמה קבועה ומנסח את טקסט המדריך – וכל הפלט נערך על ידי היוצר. Supabase לאימות, לפרויקטים ולשלבים, ו-Supabase Storage לתמונות. חישוב העלות הוא קוד פשוט בצד הלקוח. החנות משתמשת ב-Stripe Connect לתשלומים ליוצרים, וקובצי ה-PDF נוצרים בצד השרת.',
        en: 'Expo with expo-camera, expo-image-picker and expo-audio for recording answers, and expo-background-task for the running timer. Voice answers are transcribed in an Edge Function, and a language model extracts materials, quantities and durations into a fixed schema and drafts the guide text – all of it edited by the maker. Supabase for auth, projects and steps, with Supabase Storage for photos. Cost calculation is simple client-side code. The shop uses Stripe Connect for maker payouts, and PDFs are generated server-side.',
      },
      stack: ['Expo', 'expo-camera', 'expo-audio', 'expo-background-task', 'Supabase', 'Supabase Storage', 'Supabase Edge Functions', 'Anthropic or OpenAI API', 'Stripe Connect'],
      database: {
        he: ['profiles – יוצר, תחומים, תעריף שעתי, חשבון תשלומים', 'projects – פרויקט, תחום, סטטוס, סך שעות', 'steps – שלב, תמונה, תשובה, תמלול, משך, סדר', 'materials – חומר או כלי, כמות, מחיר, ספק, פרויקט', 'guides – מדריך, טקסט ערוך, שער, נראות, מחיר', 'purchases – רכישה, מדריך, קונה, תשלום', 'material_library – חומרים אישיים עם מחיר אחרון וספק'],
        en: ['profiles – maker, crafts, hourly rate, payout account', 'projects – project, craft, status, total hours', 'steps – step, photo, answer, transcript, duration, order', 'materials – material or tool, quantity, price, supplier, project', 'guides – guide, edited text, cover, visibility, price', 'purchases – purchase, guide, buyer, payment', 'material_library – personal materials with last price and supplier'],
      },
      auth: {
        he: 'כניסה עם Apple, Google או אימייל. יומני בנייה פרטיים כברירת מחדל ומוגנים ב-RLS לפי יוצר; מדריכים שפורסמו נגישים לציבור לפי הנראות שנבחרה. מוכרים עוברים אימות זהות דרך Stripe Connect לפני התשלום הראשון.',
        en: 'Apple, Google or email sign-in. Build logs are private by default and protected by per-maker RLS; published guides are public according to the chosen visibility. Sellers complete identity verification through Stripe Connect before a first payout.',
      },
      monetization: {
        he: ['עמלה על כל מדריך שנמכר בחנות', 'מנוי ליוצרים: פרויקטים ללא הגבלה, PDF בלי סימן מים וספריית חומרים', 'חבילה לסדנאות ולבתי מלאכה עם מדריכים משותפים לתלמידים'],
        en: ['A commission on every guide sold in the shop', 'A maker subscription: unlimited projects, watermark-free PDFs and the materials library', 'A plan for workshops and studios with shared guides for students'],
      },
      mvpMilestones: {
        he: ['יומן בנייה עם תמונה, שאלה ותשובה בטקסט', 'הקלטה קולית ותמלול עם חילוץ חומרים ומשכים', 'טיימר ומסך עלות אמיתית', '"הפוך למדריך" עם עריכה ויצוא PDF', 'שיתוף בקישור', 'חנות מדריכים עם Stripe Connect'],
        en: ['Build log with photo, question and text answer', 'Voice recording and transcription with material and duration extraction', 'Timer and true-cost screen', '"Turn into a guide" with editing and PDF export', 'Link sharing', 'Guide shop with Stripe Connect'],
      },
      risks: {
        he: ['חנות בלי מוכרים ובלי קונים היא בעיית ביצה ותרנגולת – להשיק קודם ככלי תיעוד ותמחור, ולפתוח את החנות רק כשיש מדריכים טובים', 'חילוץ חומרים ומשכים מתשובות קוליות בעברית יטעה – כל שדה חייב להיות ניתן לעריכה ומאושר על ידי היוצר', 'מדריכים הם קניין רוחני – נדרשים תנאי שימוש ברורים, סימן מים בתצוגה המקדימה ומדיניות החזרים'],
        en: ['A shop with no sellers and no buyers is a chicken-and-egg problem – launch first as a documentation and pricing tool, and open the shop only once good guides exist', 'Extracting materials and durations from Hebrew voice answers will make mistakes – every field must be editable and confirmed by the maker', 'Guides are intellectual property – clear terms, preview watermarks and a refund policy are required'],
      },
      expansion: {
        he: ['מצב "בונים יחד" לקונים: שלב אחר שלב עם סימון התקדמות ושאלות ליוצר', 'ייבוא יומן מהגלריה: בחירת תמונות קיימות ומענה על השאלות בדיעבד', 'חיבור לספקי חומרים כדי להזמין את רשימת החומרים של מדריך בלחיצה'],
        en: ['A "build along" mode for buyers: step by step with progress ticks and questions to the maker', 'Import a log from the camera roll: pick existing photos and answer the questions after the fact', 'Links to material suppliers to order a guide’s materials list in one tap'],
      },
    },
  },
  {
    id: 'foldover',
    name: { he: 'Foldover – ציור מקופל', en: 'Foldover' },
    tagline: {
      he: 'משחק הציור המקופל, בטלפון: כל שחקן מצייר חלק מהיצור – ראש, גוף, רגליים – כשהוא רואה רק את קווי החיבור של הקודם. ואז פותחים.',
      en: 'The fold-over drawing game, on a phone: everyone draws one part of a creature – head, body, legs – seeing only the joining lines of the previous part.',
    },
    category: 'creativity',
    secondaryCategories: ['games', 'social'],
    difficulty: 'beginner',
    effort: { weeksMin: 2, weeksMax: 3 },
    budget: 'free',
    businessModel: 'one-time',
    platforms: ['ios', 'android'],
    audience: ['kids', 'parents', 'consumers'],
    tags: ['drawing', 'party game', 'kids', 'exquisite corpse', 'canvas', 'family', 'offline', 'doodle'],
    identity: { hue: 52, glyph: 'Fo', pattern: 'ring' },
    flags: { beginnerFriendly: true, profitPotential: 'low', experimental: false, trending: false, featuredWeight: 2 },
    spec: {
      overview: {
        he: 'Foldover מעבירה לטלפון משחק סלון ישן שעובד בכל גיל: מקפלים דף, כל אחד מצייר חלק של דמות בלי לראות מה ציירו לפניו, ובסוף פותחים וצוחקים. בגרסת האפליקציה הקנבס מחולק לשלושה או ארבעה אזורים – ראש, גוף, רגליים, ואולי כובע – ובכל תור השחקן רואה רק את הקווים שחוצים את קו הקיפול מהחלק הקודם, כדי שצוואר יתחבר לצוואר ומותניים למותניים. מעבירים את הטלפון מיד ליד, ובסוף אנימציית "פתיחה" חושפת את היצור המלא, שאפשר לשמור, לשתף כמדבקה או להדפיס. בלי חשבון, בלי אינטרנט ובלי רשת חברתית – רק דף, עיפרון ואנשים באותו חדר.',
        en: 'Foldover brings an old parlour game that works at any age to the phone: fold a sheet, everyone draws part of a figure without seeing what came before, then unfold and laugh. In the app version the canvas is split into three or four zones – head, body, legs, maybe a hat – and on each turn the player sees only the lines that cross the fold from the previous part, so a neck meets a neck and a waist meets a waist. The phone is passed from hand to hand, and at the end an "unfold" animation reveals the full creature, ready to save, share as a sticker or print. No account, no internet and no social network – just paper, a pencil and people in the same room.',
      },
      problem: {
        he: 'משחקי ציור בטלפון הם כמעט תמיד תחרותיים, מקוונים ומלאים בפרסומות, ולא מתאימים לשולחן אחד עם סבתא וילד בן שש. המשחק המקופל האמיתי דורש נייר, עטים ומישהו שמסביר את הכללים – ואת היצירה אי אפשר לשמור או לשלוח.',
        en: 'Phone drawing games are almost always competitive, online and full of ads, and do not suit one table with a grandmother and a six-year-old. The real fold-over game needs paper, pens and someone to explain the rules – and the result cannot be saved or sent.',
      },
      solution: {
        he: 'קנבס מחולק לאזורים עם מכניקת "רק קווי החיבור גלויים", העברת הטלפון מיד ליד, ואנימציית פתיחה שהיא הרגע שבשבילו משחקים. הכול מקומי, בלי חשבון, עם שמירה ויצוא כמדבקה.',
        en: 'A zoned canvas with an "only the joining lines are visible" mechanic, pass-the-phone turns, and an unfold animation that is the moment everyone plays for. Everything local, no account, with saving and sticker export.',
      },
      usp: {
        he: 'המכניקה המקורית של הנייר – רואים רק את קצות הקווים של החלק הקודם – נשמרת במדויק, וזה מה שמייצר את ההפתעה; לא "אפליקציית ציור" אלא משחק של שלוש דקות לשולחן אחד.',
        en: 'The original paper mechanic – you see only the line ends of the previous part – is preserved exactly, and that is what creates the surprise; not a "drawing app" but a three-minute game for one table.',
      },
      targetUsers: {
        he: ['משפחות עם ילדים בגילאי 4–12', 'חברים בערב משחקים או בהמתנה במסעדה', 'גננות ומורות לאמנות שמחפשות פעילות קצרה', 'אנשים שאוהבים לצייר ולא לוקחים את זה ברצינות'],
        en: ['Families with children aged 4–12', 'Friends on a games night or waiting at a restaurant', 'Kindergarten and art teachers looking for a short activity', 'People who like to draw without taking it seriously'],
      },
      coreFeatures: {
        he: [
          'קנבס מחולק ל-3 או 4 אזורים עם קו קיפול, שבו רק קווי החיבור גלויים',
          'העברת טלפון: מסך "תעבירו ל..." בין תורות שמסתיר את הציור הקודם',
          'כלי ציור פשוטים: עיפרון, טוש, מחק, ארבעה צבעים',
          'אנימציית פתיחה שחושפת את היצור חלק אחר חלק',
          'שמירה לגלריה, יצוא כמדבקה לוואטסאפ ושיתוף כתמונה',
          'נושאים: יצור, רובוט, מפלצת, דמות מהחג – כל נושא משנה את מספר האזורים',
          'מצב סולו: חלקים אקראיים מציורים קודמים שלכם',
        ],
        en: [
          'A canvas split into 3 or 4 zones with a fold line, where only the joining lines are visible',
          'Pass-the-phone: a "hand it to..." screen between turns that hides the previous drawing',
          'Simple drawing tools: pencil, marker, eraser, four colours',
          'An unfold animation that reveals the creature part by part',
          'Save to the gallery, export as a WhatsApp sticker and share as an image',
          'Themes: creature, robot, monster, holiday character – each theme changes the zone count',
          'Solo mode: random parts from your own previous drawings',
        ],
      },
      screens: [
        { name: { he: 'התחלה', en: 'Start' }, description: { he: 'בחירת נושא ומספר שחקנים (2–4), הזנת שמות אופציונלית, וכפתור "מתחילים" גדול.', en: 'Pick a theme and player count (2–4), optional names, and a big "start" button.' } },
        { name: { he: 'תור ציור', en: 'Drawing turn' }, description: { he: 'הקנבס של האזור הנוכחי, קווי החיבור מהחלק הקודם מבצבצים מלמעלה, כלי הציור בשורה למטה וכפתור "סיימתי".', en: 'The current zone’s canvas, the previous part’s joining lines peeking in from the top, tools in a row below and a "done" button.' } },
        { name: { he: 'העברה', en: 'Hand over' }, description: { he: 'מסך כיסוי עם "תעבירו את הטלפון ל-X" שמסתיר את הציור עד שהשחקן הבא נוגע במסך.', en: 'A cover screen reading "pass the phone to X" that hides the drawing until the next player taps.' } },
        { name: { he: 'פתיחה', en: 'Unfold' }, description: { he: 'אנימציה שפורשת את הדף חלק אחר חלק, ואז היצור המלא עם כפתורי שמירה, מדבקה ושיתוף.', en: 'An animation that unfolds the sheet part by part, then the full creature with save, sticker and share buttons.' } },
        { name: { he: 'גלריה', en: 'Gallery' }, description: { he: 'רשת של כל היצורים שנוצרו, עם שמות המציירים ותאריך, ומחיקה בלחיצה ארוכה.', en: 'A grid of every creature made, with the drawers’ names and date, and long-press to delete.' } },
      ],
      userJourney: {
        he: [
          'משפחה בהמתנה במסעדה פותחת את האפליקציה ובוחרת "מפלצת" לשלושה שחקנים',
          'אבא מצייר ראש, ולפני שמסיים מוודא שהקווים שלו חוצים את קו הקיפול',
          'מסך ההעברה מסתיר את הציור, והבת בת השבע מציירת גוף שמתחבר לשני הקווים',
          'אמא מציירת רגליים, לוחצת "סיימתי" ואנימציית הפתיחה מתחילה',
          'כולם צוחקים, המפלצת נשמרת בגלריה ונשלחת כמדבקה לקבוצה המשפחתית',
        ],
        en: [
          'A family waiting at a restaurant opens the app and picks "monster" for three players',
          'Dad draws a head and, before finishing, makes sure his lines cross the fold line',
          'The hand-over screen hides the drawing, and the seven-year-old draws a body that connects to the two lines',
          'Mum draws legs, taps "done" and the unfold animation begins',
          'Everyone laughs, the monster is saved to the gallery and sent as a sticker to the family group',
        ],
      },
      uxDirection: {
        he: 'נייר ועפרונות: רקע בגוון נייר עם טקסטורה עדינה, קו הקיפול מצויר כקיפול אמיתי עם צל, וכלי הציור נראים כמו כלים. מעט כפתורים וגדולים, כי ילד בן ארבע צריך להצליח בלי הסבר. הפתיחה היא השיא – אנימציה איטית מספיק כדי שיצעקו "רגע!" לפני החשיפה.',
        en: 'Paper and pencils: a paper-toned background with light texture, the fold line drawn as a real fold with a shadow, and tools that look like tools. Few, large buttons, because a four-year-old must succeed without explanation. The unfold is the climax – slow enough that people shout "wait!" before the reveal.',
      },
      architecture: {
        he: 'Expo עם React Native Skia לקנבס ולמשיכות הציור, ו-Reanimated לאנימציית הפתיחה. כל ציור נשמר כרשימת משיכות (נקודות, עובי, צבע) ב-SQLite, וקווי החיבור מחושבים מהמשיכות שחוצות את קו הקיפול בחלק הקודם. יצוא לתמונה ולמדבקה דרך expo-sharing ו-expo-file-system. אין שרת בכלל – כל מה שצריך נמצא במכשיר.',
        en: 'Expo with React Native Skia for the canvas and strokes, and Reanimated for the unfold animation. Every drawing is stored as a list of strokes (points, width, colour) in SQLite, and the joining lines are computed from the strokes that cross the fold line in the previous part. Image and sticker export via expo-sharing and expo-file-system. No server at all – everything needed lives on the device.',
      },
      stack: ['Expo', 'React Native Skia', 'Reanimated', 'expo-sqlite', 'expo-sharing', 'expo-file-system'],
      database: {
        he: ['games – משחק, נושא, מספר אזורים, שמות שחקנים, תאריך', 'parts – חלק, משחק, אזור, מי צייר', 'strokes – משיכה, חלק, נקודות, עובי, צבע', 'exports – תמונה או מדבקה שנוצרו ונתיב הקובץ'],
        en: ['games – game, theme, zone count, player names, date', 'parts – part, game, zone, drawn by', 'strokes – stroke, part, points, width, colour', 'exports – generated image or sticker and file path'],
      },
      auth: {
        he: 'ללא חשבון וללא הרשמה. אין שרת ואין איסוף נתונים – מתאים לילדים ולהורים שלא רוצים עוד אפליקציה שמבקשת פרטים.',
        en: 'No account and no sign-up. There is no server and no data collection – suitable for children and for parents who do not want another app asking for details.',
      },
      monetization: {
        he: ['המשחק הבסיסי חינם לגמרי, בלי פרסומות', 'רכישה חד-פעמית של חבילות נושאים (חגים, חיות, חלל) וכלי ציור נוספים', 'בהמשך: הדפסת ספרון של היצורים דרך שירות הדפסה'],
        en: ['The basic game is completely free, with no ads', 'A one-time purchase of theme packs (holidays, animals, space) and extra drawing tools', 'Later: print a booklet of creatures through a printing service'],
      },
      mvpMilestones: {
        he: ['קנבס Skia עם עיפרון ומחק ושמירת משיכות', 'חלוקה לאזורים וחישוב קווי החיבור', 'זרימת תורות עם מסך העברה', 'אנימציית פתיחה ושמירה לגלריה', 'יצוא כמדבקה וכתמונה'],
        en: ['Skia canvas with pencil and eraser and stroke saving', 'Zone split and joining-line computation', 'Turn flow with a hand-over screen', 'Unfold animation and gallery saving', 'Sticker and image export'],
      },
      risks: {
        he: ['אם שחקן לא מצייר קווים שחוצים את קו הקיפול, החלק הבא "צף" באוויר – צריך הנחיה עדינה לפני "סיימתי"', 'React Native Skia דורש development build ולא עובד ב-Expo Go', 'ערך חוזר נמוך בלי נושאים חדשים – לתכנן חבילות נושאים עונתיות'],
        en: ['If a player draws no lines across the fold, the next part "floats" in mid-air – a gentle nudge before "done" is needed', 'React Native Skia requires a development build and does not work in Expo Go', 'Low replay value without new themes – plan seasonal theme packs'],
      },
      expansion: {
        he: ['מצב מרחוק: אותו משחק בין שני טלפונים דרך קישור, בלי חשבון', 'כתיבה מקופלת: אותה מכניקה עם משפטים במקום ציור', 'ספרון מודפס של היצורים המשפחתיים לסוף השנה'],
        en: ['Remote mode: the same game between two phones via a link, no account', 'Fold-over writing: the same mechanic with sentences instead of drawings', 'A printed booklet of the family’s creatures at the end of the year'],
      },
    },
  },
];
