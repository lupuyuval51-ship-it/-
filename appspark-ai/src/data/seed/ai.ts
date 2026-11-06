import type { Idea } from '../types';

/**
 * Artificial Intelligence – ideas whose core value depends on a model, an
 * agent, or AI-driven automation (not "an app with a chatbot bolted on").
 */
export const ideas: Idea[] = [
  {
    id: 'rehearse',
    name: { he: 'Rehearse – חזרה גנרלית', en: 'Rehearse' },
    tagline: {
      he: 'מתאמנים על שיחות קשות – משא ומתן על שכר, שיחת פיטורים, פרידה – מול בן שיח AI שמגיב כמו בן אדם ומסכם מה עבד.',
      en: 'Practice hard conversations – salary negotiations, firing someone, a breakup – with an AI counterpart that reacts like a person and debriefs what worked.',
    },
    category: 'ai',
    secondaryCategories: ['productivity', 'education'],
    difficulty: 'intermediate',
    effort: { weeksMin: 5, weeksMax: 8 },
    budget: 'medium',
    businessModel: 'subscription',
    platforms: ['ios', 'android'],
    audience: ['professionals', 'consumers'],
    tags: ['conversation', 'roleplay', 'negotiation', 'coaching', 'voice', 'llm', 'soft skills'],
    identity: { hue: 84, glyph: 'Rh', pattern: 'ring' },
    flags: { beginnerFriendly: false, profitPotential: 'high', experimental: false, trending: true, featuredWeight: 5 },
    spec: {
      overview: {
        he: 'Rehearse היא אפליקציית אימון לשיחות שאנשים דוחים כי הן מפחידות: בקשת העלאה, שיחה עם שותף שלא מתפקד, הצבת גבול להורה. המשתמש בוחר תרחיש, מגדיר את הצד השני (סגנון, מצב רוח, מה חשוב לו), ומנהל שיחה קולית או בכתב מול בן שיח AI שמחזיק את הדמות בעקביות. בסוף כל חזרה מתקבל דיבריף קצר: רגעים שבהם המשתמש התקפל, משפטים שעבדו, והצעה לניסוי הבא. ההבדל ממוצרי "צ׳אט עם AI" כללי הוא תרחישים שנבנו עם מומחים, דמויות עם זיכרון לאורך חזרות, ומדידה של התקדמות אמיתית.',
        en: 'Rehearse is a training app for conversations people postpone because they are scary: asking for a raise, confronting an under-performing partner, setting a boundary with a parent. The user picks a scenario, shapes the other side (style, mood, what they care about) and runs a voice or text conversation with an AI counterpart that stays in character. Every run ends with a short debrief: moments where the user caved, lines that landed, and a suggestion for the next attempt. Unlike generic "chat with AI" products, scenarios are built with domain experts, characters remember previous rehearsals, and progress is measured.',
      },
      problem: {
        he: 'רוב האנשים נכנסים לשיחות חשובות ללא הכנה כי אין עם מי להתאמן, וחברים לא מגיבים כמו הבוס האמיתי. התוצאה: ויתור על העלאות, עימותים שמתפוצצים, ושיחות שנדחות במשך חודשים.',
        en: 'Most people walk into important conversations unprepared because there is nobody to practise with, and friends never react like the real boss does. The result is raises never asked for, confrontations that blow up, and conversations postponed for months.',
      },
      solution: {
        he: 'בן שיח AI שמחזיק דמות עקבית, מגיב לטון ולתוכן, ומייצר דיבריף מובנה אחרי כל חזרה. ספריית תרחישים לפי תחום (עבודה, זוגיות, משפחה, כסף) עם "קלפי מטרה" שמגדירים מה נחשב הצלחה.',
        en: 'An AI counterpart that holds a consistent character, reacts to tone and content, and produces a structured debrief after every run. A scenario library by domain (work, relationships, family, money) with "goal cards" that define what success looks like.',
      },
      usp: {
        he: 'לא עוד צ׳אט כללי: תרחישים בנויים על ידי מומחים, דמויות עם זיכרון בין חזרות, ומדד התקדמות אישי שמראה שיפור אמיתי בין ניסיון לניסיון.',
        en: 'Not another generic chat: expert-built scenarios, characters that remember previous rehearsals, and a personal progress score that shows real improvement from one attempt to the next.',
      },
      targetUsers: {
        he: ['עובדים לפני שיחת שכר או פידבק', 'מנהלים חדשים שצריכים לנהל שיחות קשות', 'אנשים שמתקשים להציב גבולות במשפחה או בזוגיות'],
        en: ['Employees ahead of a salary or feedback conversation', 'New managers who must run difficult conversations', 'People who struggle to set boundaries with family or partners'],
      },
      coreFeatures: {
        he: [
          'ספריית תרחישים לפי תחום עם רמות קושי',
          'בניית הדמות שמולך: סגנון, מצב רוח, מה חשוב לה',
          'חזרה קולית או טקסטואלית בזמן אמת עם דמות עקבית',
          'דיבריף מובנה: רגעי התקפלות, משפטים שעבדו, ניסוי לפעם הבאה',
          'מעקב התקדמות לאורך חזרות על אותו תרחיש',
          'מצב "הפתעה" שבו הדמות מגיבה בצורה לא צפויה',
        ],
        en: [
          'Scenario library by domain with difficulty levels',
          'Build the counterpart: style, mood, what they care about',
          'Real-time voice or text rehearsal with a consistent character',
          'Structured debrief: caving moments, lines that landed, next experiment',
          'Progress tracking across rehearsals of the same scenario',
          'A "surprise" mode where the character reacts unexpectedly',
        ],
      },
      screens: [
        { name: { he: 'בית', en: 'Home' }, description: { he: 'תרחיש מומלץ להיום, המשך חזרה אחרונה, וכניסה לספרייה.', en: 'Recommended scenario for today, resume the last rehearsal, and entry to the library.' } },
        { name: { he: 'ספריית תרחישים', en: 'Scenario library' }, description: { he: 'כרטיסי תרחישים לפי תחום וקושי, עם סינון וחיפוש.', en: 'Scenario cards by domain and difficulty, with filtering and search.' } },
        { name: { he: 'הגדרת הדמות', en: 'Character setup' }, description: { he: 'סליידרים וצ׳יפים לסגנון, מצב רוח ומטרות של הצד השני, ובחירת מטרת החזרה.', en: 'Sliders and chips for the counterpart’s style, mood and goals, plus the rehearsal objective.' } },
        { name: { he: 'חזרה', en: 'Rehearsal' }, description: { he: 'מסך השיחה: תמלול חי, כפתור דיבור, רמזים עדינים מהמאמן, וסיום בכל רגע.', en: 'The conversation screen: live transcript, push-to-talk, subtle coach hints, and end-anytime.' } },
        { name: { he: 'דיבריף', en: 'Debrief' }, description: { he: 'ציר זמן של השיחה עם רגעים מסומנים, ציון, ושלושה דברים לנסות בפעם הבאה.', en: 'A timeline of the conversation with marked moments, a score, and three things to try next time.' } },
        { name: { he: 'התקדמות', en: 'Progress' }, description: { he: 'גרף שיפור לפי תרחיש, סטרייקים ותגיות של דפוסים חוזרים.', en: 'Improvement graph per scenario, streaks and tags of recurring patterns.' } },
      ],
      userJourney: {
        he: [
          'המשתמש בוחר תרחיש "בקשת העלאה" מהספרייה',
          'מגדיר את הבוס: ענייני, לחוץ בזמן, שונא הפתעות',
          'מנהל חזרה קולית של כ-5 דקות',
          'מקבל דיבריף עם שני רגעי התקפלות ומשפט אחד שעבד',
          'חוזר למחרת לחזרה שנייה ורואה את ציון ההתקדמות עולה',
        ],
        en: [
          'The user picks the "ask for a raise" scenario from the library',
          'Shapes the boss: businesslike, time-pressed, hates surprises',
          'Runs a five-minute voice rehearsal',
          'Gets a debrief with two caving moments and one line that landed',
          'Returns the next day for a second run and sees the progress score rise',
        ],
      },
      uxDirection: {
        he: 'שקט ומרגיע: רקע כהה, טיפוגרפיה גדולה לתמלול, ומינימום אלמנטים במסך החזרה כדי לא להסיח. הדיבריף מוצג כציר זמן אנכי עם סימונים צבעוניים עדינים. בלי מדליות צעקניות – ההתקדמות מוצגת כקו עולה.',
        en: 'Calm and steady: dark background, large transcript typography, and minimal chrome on the rehearsal screen to avoid distraction. The debrief is a vertical timeline with subtle colour marks. No loud badges – progress is a rising line.',
      },
      architecture: {
        he: 'Expo + Expo Router עם Reanimated למסך החזרה. Supabase לאימות, לפרופילים, לתרחישים ולהיסטוריית חזרות. Edge Function שמריצה את מודל השפה עם הנחיות הדמות ומחזירה גם תשובה וגם "אירועי מאמן" מובנים. קול: תמלול ו-TTS דרך ספק מנוהל, עם מצב טקסט כחלופה זולה.',
        en: 'Expo + Expo Router with Reanimated on the rehearsal screen. Supabase for auth, profiles, scenarios and rehearsal history. An Edge Function runs the language model with the character brief and returns both the reply and structured "coach events". Voice via a managed transcription/TTS provider, with text mode as the cheap fallback.',
      },
      stack: ['Expo', 'Expo Router', 'Supabase', 'Supabase Edge Functions', 'Anthropic or OpenAI API', 'Reanimated'],
      database: {
        he: ['profiles – משתמש, מטרות, העדפות קול', 'scenarios – תרחישים, תחום, רמת קושי, קלפי מטרה', 'rehearsals – חזרה, תרחיש, תמלול, ציון', 'debriefs – רגעים מסומנים והמלצות לכל חזרה', 'character_presets – הגדרות דמות שמורות'],
        en: ['profiles – user, goals, voice preferences', 'scenarios – scenario, domain, difficulty, goal cards', 'rehearsals – run, scenario, transcript, score', 'debriefs – marked moments and recommendations per run', 'character_presets – saved counterpart settings'],
      },
      auth: {
        he: 'אימייל + קישור קסם וכניסה עם Apple/Google. התוכן אישי ורגיש, לכן כל טבלה מוגנת ב-RLS לפי המשתמש בלבד.',
        en: 'Email magic link plus Apple/Google sign-in. Content is personal and sensitive, so every table is protected with per-user RLS.',
      },
      monetization: {
        he: ['מנוי חודשי עם 3 חזרות חינם בשבוע', 'חבילות תרחישים ממומחים (למשל: משא ומתן, הורות)', 'רישיון לצוותי HR להכשרת מנהלים'],
        en: ['Monthly subscription with three free rehearsals a week', 'Expert scenario packs (e.g. negotiation, parenting)', 'Team licence for HR departments training managers'],
      },
      mvpMilestones: {
        he: ['10 תרחישים כתובים ומבנה דמות עם 3 פרמטרים', 'חזרה טקסטואלית מלאה עם דיבריף מובנה', 'שמירת היסטוריה וציון התקדמות', 'מצב קולי בסיסי', 'מסך תשלום ומנוי'],
        en: ['Ten written scenarios and a three-parameter character model', 'Full text rehearsal with a structured debrief', 'History and progress score', 'Basic voice mode', 'Paywall and subscription'],
      },
      risks: {
        he: ['עלות קול בזמן אמת עלולה לאכול את המרווח – להתחיל בטקסט', 'דמות שיוצאת מאופי פוגעת באמון – צריך בדיקות עקביות', 'תוכן רגיש מחייב מדיניות פרטיות ברורה ומחיקת תמלולים'],
        en: ['Real-time voice costs can eat the margin – start with text', 'A character breaking persona destroys trust – consistency tests are required', 'Sensitive content needs a clear privacy policy and transcript deletion'],
      },
      expansion: {
        he: ['חזרות משותפות עם חבר שמשחק את הצד השני', 'אינטגרציה ליומן: תזכורת להתאמן לפני פגישה קיימת', 'מצב שפה שנייה לתרגול שיחות באנגלית עסקית'],
        en: ['Shared rehearsals where a friend plays the other side', 'Calendar integration: nudge to rehearse before an existing meeting', 'Second-language mode for practising business English'],
      },
    },
  },
  {
    id: 'threshold',
    name: { he: 'Threshold – תנאי סף', en: 'Threshold' },
    tagline: {
      he: 'מעלים מכרז של 200 עמודים ומקבלים מטריצת דרישות עם הפניה לסעיף, חלוקת אחריות ומעקב אסמכתאות – במקום לקרוא הכול שלוש פעמים.',
      en: 'Upload a 200-page tender and get a requirements matrix with clause citations, owners and evidence tracking – instead of reading everything three times.',
    },
    category: 'ai',
    secondaryCategories: ['business', 'productivity'],
    difficulty: 'advanced',
    effort: { weeksMin: 10, weeksMax: 16 },
    budget: 'medium',
    businessModel: 'b2b',
    platforms: ['web'],
    audience: ['businesses', 'professionals', 'teams'],
    tags: ['tenders', 'rfp', 'compliance', 'document extraction', 'procurement', 'bid management', 'citations', 'b2b'],
    identity: { hue: 215, glyph: 'Th', pattern: 'grid' },
    flags: { beginnerFriendly: false, profitPotential: 'high', experimental: false, trending: false, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Threshold היא שולחן עבודה לצוותים שמגישים הצעות למכרזים ציבוריים ועסקיים. מעלים את חבילת המכרז (PDF, Word, נספחים), והמערכת מחלצת כל דרישה – תנאי סף, דרישות טכניות, מסמכים להגשה, מועדים – לשורה במטריצה, כשכל שורה מקושרת לסעיף ולעמוד המדויקים שמהם נלקחה. מנהל ההצעה מתעד החלטת Go/No-Go על בסיס תנאי הסף, מחלק דרישות לבעלי תפקידים ומצרף אסמכתאות (אישורים, הצהרות, טיוטות תשובה). ספריית תשובות מהגשות קודמות מציעה ניסוח התחלתי לכל דרישה שחוזרת על עצמה. המודל לא כותב את ההצעה במקום הצוות – הוא דואג ששום דרישה לא תיפול בין הכיסאות.',
        en: 'Threshold is a workbench for teams that answer public and commercial tenders. Upload the tender pack (PDF, Word, annexes) and the system extracts every requirement – threshold conditions, technical specs, documents to submit, deadlines – into a matrix row linked to the exact clause and page it came from. The bid manager records a Go/No-Go decision based on the threshold conditions, assigns requirements to owners and attaches evidence (certificates, declarations, draft answers). An answer library built from previous submissions suggests a starting draft for every recurring requirement. The model does not write the proposal for the team – it makes sure no requirement slips through the cracks.',
      },
      problem: {
        he: 'צוותי הצעות קוראים מאות עמודים בלחץ זמן, מעתיקים דרישות לאקסל ידנית, ומגלים דרישה שפספסו יום לפני ההגשה. הצעות נפסלות על תנאי סף טכני אחרי שבועות של עבודה, ותשובות טובות מהגשות קודמות נקברות בתיקיות.',
        en: 'Bid teams read hundreds of pages under deadline pressure, copy requirements into spreadsheets by hand, and discover a missed requirement the day before submission. Proposals get disqualified on a technical threshold condition after weeks of work, and good answers from past submissions are buried in folders.',
      },
      solution: {
        he: 'חילוץ דרישות אוטומטי עם הפניה לסעיף ולעמוד, מטריצת ציות אחת שבה כל דרישה מקבלת סטטוס, בעלים ואסמכתה, והחלטת Go/No-Go מובנית כבר ביום הראשון. ספריית תשובות שגדלה עם כל הגשה ומציעה טיוטה לדרישות שחוזרות על עצמן.',
        en: 'Automatic requirement extraction with clause and page citations, a single compliance matrix where every requirement gets a status, an owner and evidence, and a structured Go/No-Go decision on day one. An answer library that grows with every submission and proposes drafts for recurring requirements.',
      },
      usp: {
        he: 'כל שורה במטריצה מקושרת לסעיף המקורי בלחיצה אחת, כך שהצוות מאמת את המודל במקום להאמין לו, ומפת כיסוי לפי עמודים מסמנת עמודים שלא הניבו אף דרישה כדי שאדם יקרא שוב בדיוק אותם. הכלי בנוי סביב תהליך ההגשה – Go/No-Go, חלוקת אחריות, אסמכתאות – ולא סביב צ׳אט עם מסמך.',
        en: 'Every matrix row links back to the original clause in one click, so the team verifies the model instead of trusting it, and a per-page coverage map flags pages that yielded no requirement so a human re-reads exactly those. The tool is built around the submission workflow – Go/No-Go, ownership, evidence – not around chatting with a document.',
      },
      targetUsers: {
        he: ['מנהלי הצעות ומכרזים בחברות בינוניות', 'משרדי ייעוץ שמגישים מכרזים עבור לקוחות', 'סטארטאפים שמתמודדים לראשונה על מכרז ממשלתי'],
        en: ['Bid and proposal managers at mid-sized companies', 'Consultancies that answer tenders on behalf of clients', 'Startups bidding on a government tender for the first time'],
      },
      coreFeatures: {
        he: [
          'העלאת חבילת מכרז שלמה: PDF, Word ונספחים',
          'חילוץ דרישות למטריצה עם הפניה לסעיף ולעמוד',
          'מסך Go/No-Go שמרכז את תנאי הסף ואת הפערים',
          'שיוך דרישות לבעלי תפקידים עם סטטוס ותאריך יעד',
          'צירוף אסמכתאות לכל דרישה ודוח מוכנות להגשה',
          'ספריית תשובות מהגשות קודמות עם הצעת טיוטה',
          'יצוא המטריצה לאקסל ול-Word לפי מבנה המכרז',
        ],
        en: [
          'Upload a full tender pack: PDF, Word and annexes',
          'Requirement extraction into a matrix with clause and page citations',
          'A Go/No-Go screen that concentrates threshold conditions and gaps',
          'Assign requirements to owners with status and due date',
          'Attach evidence to every requirement and a submission-readiness report',
          'Answer library from past submissions with draft suggestions',
          'Export the matrix to Excel and Word following the tender structure',
        ],
      },
      screens: [
        { name: { he: 'לוח מכרזים', en: 'Tender board' }, description: { he: 'רשימת המכרזים הפעילים עם מועד הגשה, אחוז מוכנות ובעלים, ממוינת לפי דחיפות.', en: 'Active tenders with submission date, readiness percentage and owner, sorted by urgency.' } },
        { name: { he: 'העלאה ועיבוד', en: 'Upload & processing' }, description: { he: 'גרירת קבצים, התקדמות החילוץ לפי מסמך, סיכום של כמה דרישות זוהו מכל סוג, ופס כיסוי לפי עמודים שבו עמוד ללא דרישות מסומן לבדיקה ידנית.', en: 'Drag-and-drop files, extraction progress per document, a count of requirements found by type, and a per-page coverage strip where a page with no requirements is flagged for manual review.' } },
        { name: { he: 'החלטת Go/No-Go', en: 'Go/No-Go' }, description: { he: 'תנאי הסף בלבד, כל אחד מסומן עומדים / לא עומדים / לבדוק, עם הערות חברי הצוות וכפתור החלטה.', en: 'Threshold conditions only, each marked met / not met / to check, with team comments and a decision button.' } },
        { name: { he: 'מטריצת דרישות', en: 'Requirements matrix' }, description: { he: 'טבלה עם סינון לפי סוג, סטטוס ובעלים; לחיצה על שורה פותחת את הסעיף המקורי בפאנל צד.', en: 'A table filtered by type, status and owner; clicking a row opens the original clause in a side panel.' } },
        { name: { he: 'דרישה', en: 'Requirement detail' }, description: { he: 'הציטוט המקורי מהמסמך, טיוטת תשובה מהספרייה, אסמכתאות מצורפות ושרשור הערות.', en: 'The original quote from the document, a draft answer from the library, attached evidence and a comment thread.' } },
        { name: { he: 'ספריית תשובות', en: 'Answer library' }, description: { he: 'תשובות שאושרו בהגשות קודמות, מתויגות לפי נושא, עם חיפוש סמנטי.', en: 'Answers approved in past submissions, tagged by topic, with semantic search.' } },
        { name: { he: 'דוח מוכנות', en: 'Readiness report' }, description: { he: 'סיכום לפני הגשה: דרישות פתוחות, אסמכתאות חסרות ויצוא לאקסל או ל-Word.', en: 'A pre-submission summary: open requirements, missing evidence, and export to Excel or Word.' } },
      ],
      userJourney: {
        he: [
          'מנהלת ההצעות מעלה מכרז חדש של 180 עמודים עם ארבעה נספחים',
          'אחרי כמה דקות מתקבלת מטריצה עם 140 דרישות, 12 מהן תנאי סף',
          'במסך Go/No-Go מתברר שחסר אישור ISO – הצוות מחליט להמשיך ולהשיג אותו',
          'הדרישות מחולקות למהנדס, ליועצת המשפטית ולכספים עם תאריכי יעד',
          'כל בעל תפקיד מצרף אסמכתאות ותשובות; הספרייה מציעה טיוטה ל-40 דרישות חוזרות',
          'דוח המוכנות מראה אפס דרישות פתוחות והמטריצה מיוצאת לאקסל לצירוף להגשה',
        ],
        en: [
          'The bid manager uploads a new 180-page tender with four annexes',
          'A few minutes later a matrix appears with 140 requirements, 12 of them threshold conditions',
          'The Go/No-Go screen reveals a missing ISO certificate – the team decides to proceed and obtain it',
          'Requirements are assigned to the engineer, legal counsel and finance with due dates',
          'Each owner attaches evidence and answers; the library proposes drafts for 40 recurring requirements',
          'The readiness report shows zero open requirements and the matrix is exported to Excel for the submission',
        ],
      },
      uxDirection: {
        he: 'שולחן עבודה צפוף ויעיל בסגנון כלי מקצועי: שורות טבלה דחוסות, פאנל צד קבוע שמציג את המסמך המקורי, וצבע הדגשה אחד ששמור לדרישות פתוחות. בלי אנימציות ובלי "קסם AI" – המודל מופיע כעוזר שמציע, והאדם מאשר. עברית ואנגלית חיות באותה טבלה, כי הרבה חבילות מכרז מערבבות את שתיהן.',
        en: 'A dense, efficient workbench in the spirit of professional tools: compact table rows, a persistent side panel showing the source document, and a single accent colour reserved for open requirements. No animations and no "AI magic" – the model appears as an assistant that proposes while a human confirms. Hebrew and English coexist in the same table, since many tender packs mix both.',
      },
      architecture: {
        he: 'אפליקציית Next.js על Vercel עם Supabase לאימות, לנתונים ולאחסון קבצים. צינור עיבוד ברקע (Inngest או תור על Supabase) מפרק כל מסמך לעמודים, שולח קטעים למודל שפה עם סכמת פלט קשיחה (סוג דרישה, ציטוט, עמוד, סעיף) ושומר את ההפניות. חיפוש סמנטי בספריית התשובות עם pgvector. יצוא לאקסל ול-Word בצד השרת.',
        en: 'A Next.js app on Vercel with Supabase for auth, data and file storage. A background pipeline (Inngest or a Supabase-backed queue) splits each document into pages, sends chunks to a language model with a strict output schema (requirement type, quote, page, clause) and stores the citations. Semantic search over the answer library with pgvector. Excel and Word export generated server-side.',
      },
      stack: ['Next.js', 'Vercel', 'Supabase', 'Supabase Storage', 'pgvector', 'Inngest', 'Anthropic API', 'Tailwind CSS'],
      database: {
        he: ['organizations – ארגון, חברים, תפקידים', 'tenders – מכרז, מועד הגשה, סטטוס, החלטת Go/No-Go', 'documents – קבצים שהועלו, עמודים, סטטוס עיבוד', 'requirements – דרישה, סוג, ציטוט, עמוד, סעיף, בעלים, סטטוס', 'evidence – אסמכתאות שצורפו לדרישה', 'answers – ספריית תשובות עם תגיות ווקטור לחיפוש', 'comments – שרשורי דיון לכל דרישה'],
        en: ['organizations – org, members, roles', 'tenders – tender, deadline, status, Go/No-Go decision', 'documents – uploaded files, pages, processing status', 'requirements – requirement, type, quote, page, clause, owner, status', 'evidence – files attached to a requirement', 'answers – answer library with tags and a search embedding', 'comments – discussion threads per requirement'],
      },
      auth: {
        he: 'כניסה עם Google Workspace או Microsoft, ואימייל לחברות קטנות. הרשאות לפי ארגון ותפקיד (מנהל הצעה, בעל דרישה, צופה) נאכפות ב-RLS על כל טבלה, כי מסמכי מכרז הם מידע עסקי רגיש.',
        en: 'Sign-in with Google Workspace or Microsoft, plus email for small firms. Permissions by organization and role (bid manager, requirement owner, viewer) are enforced with RLS on every table, since tender documents are sensitive business information.',
      },
      monetization: {
        he: ['מנוי חודשי לפי משתמשים לצוותי הצעות', 'תמחור לפי מכרז לחברות שמגישות פעם-פעמיים בשנה', 'תוכנית שנתית עם ספריית תשובות משותפת למשרדי ייעוץ'],
        en: ['Per-seat monthly subscription for bid teams', 'Per-tender pricing for companies that bid once or twice a year', 'Annual plan with a shared answer library for consultancies'],
      },
      mvpMilestones: {
        he: ['העלאת PDF, חילוץ דרישות עם הפניה לעמוד ומפת כיסוי לפי עמודים', 'מטריצה עם סטטוס, בעלים ותאריך יעד', 'מסך Go/No-Go לתנאי סף', 'צירוף אסמכתאות ודוח מוכנות', 'יצוא לאקסל', 'ספריית תשובות בסיסית עם חיפוש'],
        en: ['PDF upload, requirement extraction with page citations and a per-page coverage map', 'Matrix with status, owner and due date', 'Go/No-Go screen for threshold conditions', 'Evidence attachments and readiness report', 'Excel export', 'Basic answer library with search'],
      },
      risks: {
        he: ['דרישה שהמודל פספס היא בדיוק הכישלון שהמוצר מבטיח למנוע – חובה לבנות מסך בדיקה ידנית ולמדוד כיסוי', 'מסמכים סרוקים באיכות נמוכה דורשים OCR מקדים ועלולים לפגוע בדיוק', 'לקוחות ארגוניים ידרשו הסכמי סודיות והבטחות אבטחה לפני שיעלו מכרז אמיתי'],
        en: ['A requirement the model missed is exactly the failure the product promises to prevent – a manual review screen and coverage measurement are mandatory', 'Low-quality scanned documents need OCR pre-processing and can hurt accuracy', 'Enterprise customers will demand NDAs and security assurances before uploading a real tender'],
      },
      expansion: {
        he: ['התראות על מכרזים חדשים ממאגרים ציבוריים לפי פרופיל החברה', 'ניסוח שאלות הבהרה למזמין מתוך הדרישות הלא ברורות', 'שיתוף פעולה עם קבלני משנה: גישה מוגבלת לדרישות שלהם בלבד'],
        en: ['Alerts on new tenders from public registries matched to the company profile', 'Drafting clarification questions to the issuer from ambiguous requirements', 'Subcontractor collaboration: restricted access to their requirements only'],
      },
    },
  },
  {
    id: 'cadence',
    name: { he: 'Cadence – מילים שיושבות על הלחן', en: 'Cadence' },
    tagline: {
      he: 'מקישים או מזמזמים את הקצב של הלחן, ומקבלים שורות שמתיישבות עליו בדיוק – מספר ההברות נכון, ההטעמה נכונה, החרוז נכון.',
      en: 'Tap or hum the rhythm of your melody and get lyric lines that fit it exactly – right syllable count, right stress, right rhyme.',
    },
    category: 'ai',
    secondaryCategories: ['creativity', 'entertainment'],
    difficulty: 'intermediate',
    effort: { weeksMin: 6, weeksMax: 8 },
    budget: 'low',
    businessModel: 'freemium',
    platforms: ['ios', 'android'],
    audience: ['creators', 'consumers'],
    tags: ['lyrics', 'songwriting', 'melody', 'rhythm', 'music', 'rhyme', 'hebrew', 'llm'],
    identity: { hue: 320, glyph: 'Cd', pattern: 'wave' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: true, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Cadence היא שותפת כתיבה למי שיש לו לחן אבל המילים לא מתיישבות עליו. במקום לבקש ממודל "תכתוב לי שיר", המשתמש מקיש את הקצב של כל שורה על המסך (או מזמזם אותה), והאפליקציה הופכת את ההקשות לתבנית: כמה הברות יש בשורה, איפה נופלות ההברות המוטעמות, ואיזה חרוז נדרש. על התבנית הזאת המודל מציע כמה גרסאות לכל שורה, וכל גרסה נבדקת אוטומטית – ספירת הברות ומיקום ההטעמה (כולל מלעיל ומלרע בעברית) – לפני שהיא מוצגת. הכותב בוחר, עורך, ושומע את השורה מוקראת בקצב כדי לוודא שהיא באמת זורמת.',
        en: 'Cadence is a co-writer for people who have a melody but whose words will not sit on it. Instead of asking a model to "write me a song", the user taps the rhythm of each line on the screen (or hums it) and the app turns those taps into a template: how many syllables the line has, where the stressed beats fall, and which rhyme is required. On that template the model proposes several candidates per line, and every candidate is checked automatically – syllable count and stress placement (including Hebrew penultimate and ultimate stress) – before it is shown. The writer picks, edits, and hears the line spoken in rhythm to confirm it truly flows.',
      },
      problem: {
        he: 'כותבי שירים חובבים ומוזיקאים מתחילים נתקעים באותו שלב: יש מנגינה, אבל כל ניסיון למילים יוצא עם הברה אחת יותר מדי או עם הטעמה שנשמעת עקומה. כלי AI כלליים מייצרים טקסט שנראה כמו שיר, אבל לא מתיישב על לחן ספציפי.',
        en: 'Hobbyist songwriters and beginning musicians get stuck at the same point: the melody exists, but every attempt at words comes out one syllable too long or with stress that sounds wrong. General AI tools produce text that looks like a song but never sits on a specific tune.',
      },
      solution: {
        he: 'תבנית ריתמית שנגזרת מהקצב שהמשתמש מקיש, יצירה שמוגבלת לתבנית עם לולאת אימות אוטומטית, וחלופות לכל שורה בנפרד – כך שהשיר נשאר של הכותב והמודל רק ממלא חורים.',
        en: 'A rhythmic template derived from the rhythm the user taps, constrained generation with an automatic verification loop, and alternatives per line – so the song stays the writer’s own and the model only fills gaps.',
      },
      usp: {
        he: 'מתחילים מהלחן ולא מהמילים: כל הצעה נבדקת לספירת הברות ולהטעמה לפני שהיא מוצגת, ובעברית זה כולל את ההבדל בין מלעיל למלרע – בודק דטרמיניסטי אוכף אותו במקום לסמוך על המודל.',
        en: 'Starts from the tune, not the words: every suggestion is verified for syllable count and stress before it is shown, and in Hebrew that includes the penultimate/ultimate stress distinction – a deterministic checker enforces it instead of trusting the model.',
      },
      targetUsers: {
        he: ['כותבי שירים חובבים עם לחנים בלי מילים', 'מוזיקאים שכותבים בעברית ונתקלים בבעיות הטעמה', 'יוצרי תוכן שצריכים ג׳ינגל או שיר קצר לסרטון'],
        en: ['Hobbyist songwriters with melodies and no words', 'Musicians writing in Hebrew who run into stress problems', 'Content creators who need a jingle or a short song for a video'],
      },
      coreFeatures: {
        he: [
          'הקשת קצב לכל שורה עם סימון ויזואלי של ההברות המוטעמות',
          'זמזום שורה והמרה אוטומטית לתבנית הברות (שלב שני, אחרי ה-MVP)',
          'הגדרת נושא, מצב רוח וסכמת חרוזים לבית ולפזמון',
          'שלוש עד חמש חלופות לכל שורה, כולן מאומתות מול התבנית',
          'הקראה בקצב כדי לשמוע אם השורה זורמת',
          'עריכה ידנית עם ספירת הברות חיה',
          'יצוא טקסט עם סימון הטעמות לשיתוף עם מלחין או להקה',
        ],
        en: [
          'Tap the rhythm per line with a visual marker on stressed syllables',
          'Hum a line and convert it automatically to a syllable template (second phase, after the MVP)',
          'Set topic, mood and rhyme scheme for verse and chorus',
          'Three to five alternatives per line, all verified against the template',
          'Spoken playback in rhythm to hear whether the line flows',
          'Manual editing with a live syllable count',
          'Export lyrics with stress marks to share with a composer or band',
        ],
      },
      screens: [
        { name: { he: 'השירים שלי', en: 'My songs' }, description: { he: 'רשימת פרויקטים עם מצב התקדמות (כמה שורות נסגרו מתוך כמה) וכניסה מהירה לשיר האחרון.', en: 'Project list with progress (lines locked out of total) and quick entry to the latest song.' } },
        { name: { he: 'מבנה השיר', en: 'Song structure' }, description: { he: 'בלוקים של בית, פזמון וגשר, גרירה לסידור מחדש, והגדרת סכמת חרוזים לכל בלוק.', en: 'Verse, chorus and bridge blocks, drag to reorder, and a rhyme scheme per block.' } },
        { name: { he: 'הקשת קצב', en: 'Tap the rhythm' }, description: { he: 'משטח הקשה גדול, מטרונום אופציונלי, ותצוגה של ההברות שנרשמו עם סימון חזק/חלש.', en: 'A large tap pad, an optional metronome, and a readout of recorded syllables marked strong or weak.' } },
        { name: { he: 'כתיבת שורה', en: 'Line writer' }, description: { he: 'התבנית למעלה, חלופות מהמודל מתחת, וכפתור "עוד" שמביא גרסאות בכיוון אחר.', en: 'The template on top, model alternatives below, and a "more" button for versions in a different direction.' } },
        { name: { he: 'השיר המלא', en: 'Full lyric' }, description: { he: 'כל הבתים ברצף עם סימון הטעמות, הקראה בקצב, ועריכה חופשית עם ספירת הברות חיה.', en: 'All sections in sequence with stress marks, rhythmic playback, and free editing with a live syllable count.' } },
        { name: { he: 'שיתוף ויצוא', en: 'Share & export' }, description: { he: 'יצוא לטקסט או ל-PDF, קישור לצפייה בלבד למלחין, ושיתוף לאפליקציות תווים.', en: 'Export to text or PDF, a view-only link for a composer, and sharing to notation apps.' } },
      ],
      userJourney: {
        he: [
          'המשתמשת פותחת שיר חדש ומגדירה בית של ארבע שורות בחרוז אבאב',
          'מקישה את הקצב של השורה הראשונה תוך כדי שירה בלב',
          'מקבלת ארבע חלופות, כולן בנות שמונה הברות עם ההטעמה במקום הנכון',
          'בוחרת אחת, מחליפה מילה אחת ורואה שהספירה עדיין תקינה',
          'משלימה את הבית, מקשיבה להקראה בקצב ומתקנת שורה שנשמעת מאולצת',
          'שולחת קישור למלחין כדי שיבדוק את ההתאמה ללחן',
        ],
        en: [
          'The user opens a new song and sets a four-line verse with an ABAB rhyme',
          'Taps the rhythm of the first line while singing it silently',
          'Gets four alternatives, all eight syllables with the stress in the right place',
          'Picks one, swaps a single word and sees the count still holds',
          'Finishes the verse, listens to the rhythmic playback and fixes a line that sounds forced',
          'Sends a link to the composer to check the fit against the melody',
        ],
      },
      uxDirection: {
        he: 'תחושה של מחברת שירים ולא של כלי AI: רקע בגוון נייר, טיפוגרפיה סריפית גדולה למילים, והצעות המודל מופיעות בצבע מעומעם עד שבוחרים בהן. משטח ההקשה הוא הרגע המרכזי – גדול, מגיב ברטט ובצליל, עם אנימציית גל שמסמנת כל הברה מוטעמת.',
        en: 'Feels like a songwriting notebook, not an AI tool: paper-toned background, large serif typography for the lyric, and model suggestions rendered in a muted colour until chosen. The tap pad is the hero moment – big, responsive with haptics and sound, with a wave animation marking each stressed syllable.',
      },
      architecture: {
        he: 'Expo עם Reanimated ו-expo-haptics למשטח ההקשה, ו-expo-audio להקלטה ולהקראה. ההקשות נשמרות כרצף משכים ועוצמות ומומרות לתבנית הברות במכשיר. Supabase לאימות ולשמירת שירים. Edge Function שולחת למודל את התבנית, הנושא והחרוז, מקבלת חלופות ומריצה עליהן בודק הברות והטעמה דטרמיניסטי (מילון עברי עם הטעמות וכללים לאנגלית); חלופות שנכשלות נזרקות ומבוקשות מחדש. זמזום מומר לקצב בזיהוי התחלות צלילים בצד השרת בשלב מאוחר יותר.',
        en: 'Expo with Reanimated and expo-haptics for the tap pad, and expo-audio for recording and playback. Taps are stored as a sequence of durations and intensities and converted to a syllable template on device. Supabase for auth and song storage. An Edge Function sends the template, topic and rhyme to the model, receives candidates and runs a deterministic syllable-and-stress checker on them (a Hebrew lexicon with stress marks plus English rules); failing candidates are discarded and re-requested. Humming becomes rhythm via server-side onset detection in a later phase.',
      },
      stack: ['Expo', 'Reanimated', 'expo-audio', 'expo-haptics', 'Supabase', 'Supabase Edge Functions', 'Anthropic or OpenAI API'],
      database: {
        he: ['profiles – משתמש, שפת כתיבה מועדפת, מכסת יצירה', 'songs – שיר, כותרת, מבנה, מצב התקדמות', 'sections – בית/פזמון/גשר, סכמת חרוזים, סדר', 'lines – שורה, תבנית ריתמית, טקסט סופי', 'candidates – חלופות שהוצעו לכל שורה ותוצאת האימות', 'lexicon – מילים עבריות עם חלוקה להברות והטעמה'],
        en: ['profiles – user, preferred writing language, generation quota', 'songs – song, title, structure, progress', 'sections – verse/chorus/bridge, rhyme scheme, order', 'lines – line, rhythmic template, final text', 'candidates – alternatives proposed per line with verification result', 'lexicon – Hebrew words with syllable breaks and stress'],
      },
      auth: {
        he: 'כניסה עם Apple ו-Google, ואפשרות לעבוד בלי חשבון עם שמירה מקומית בלבד. השירים הם קניין רוחני של הכותב – RLS לפי משתמש, ובלי אימון על תוכן של משתמשים.',
        en: 'Apple and Google sign-in, with a no-account mode that stores songs locally only. Lyrics are the writer’s intellectual property – per-user RLS, and no training on user content.',
      },
      monetization: {
        he: ['חינם לשיר פעיל אחד ומספר מוגבל של חלופות ביום', 'מנוי לכותבים: שירים ללא הגבלה, מצב זמזום ויצוא PDF', 'חבילת "אולפן" לבתי ספר למוזיקה עם ניהול כיתה'],
        en: ['Free for one active song and a limited number of alternatives per day', 'Writer subscription: unlimited songs, humming mode and PDF export', 'A "studio" plan for music schools with class management'],
      },
      mvpMilestones: {
        he: ['משטח הקשה שמפיק תבנית הברות והטעמה', 'בודק הברות והטעמה: כללים לאנגלית ומילון עברי התחלתי, עם סימון "לא בטוח" למילה שלא במילון במקום פסילה', 'יצירת חלופות לשורה עם לולאת אימות', 'מבנה שיר מלא עם חרוזים ושמירה', 'הקראה בקצב', 'מסך תשלום ומכסות'],
        en: ['A tap pad that produces a syllable-and-stress template', 'Syllable and stress checker: English rules plus a starter Hebrew lexicon, with an "unsure" flag for words outside it instead of a rejection', 'Line alternatives with a verification loop', 'Full song structure with rhymes and saving', 'Rhythmic playback', 'Paywall and quotas'],
      },
      risks: {
        he: ['חלוקה להברות והטעמה בעברית ללא ניקוד היא בעיה קשה – המילון לא יכסה הכול ויהיו טעויות', 'מודלים נוטים "לרמות" בספירת הברות, ולכן לולאת האימות חייבת להיות דטרמיניסטית ולא מבוססת מודל', 'זיהוי קצב מזמזום רועש פחות אמין מהקשה – להשאיר אותו מחוץ ל-MVP'],
        en: ['Hebrew syllabification and stress without vowel marks is a hard problem – the lexicon will not cover everything and errors will slip through', 'Models tend to "cheat" on syllable counts, so the verification loop must be deterministic rather than model-based', 'Rhythm detection from noisy humming is less reliable than tapping – keep it out of the MVP'],
      },
      expansion: {
        he: ['ייבוא MIDI או קובץ תווים לחילוץ הקצב ישירות מהלחן', 'מצב שיתופי שבו שני כותבים עובדים על אותו שיר', 'תרגום שיר קיים לשפה אחרת תוך שמירה על הקצב וההטעמה'],
        en: ['Import MIDI or a notation file to extract the rhythm straight from the melody', 'A collaborative mode where two writers work on the same song', 'Translate an existing song into another language while preserving rhythm and stress'],
      },
    },
  },
  {
    id: 'curbcheck',
    name: { he: 'Curbcheck – מותר לחנות כאן?', en: 'Curbcheck' },
    tagline: {
      he: 'מצלמים את שלט החניה ואת צבע המדרכה, ומקבלים תשובה פשוטה: מותר לחנות כאן עכשיו, עד מתי והאם צריך לשלם – כולל ההסבר.',
      en: 'Photograph the parking sign and the curb and get a plain answer: can you park here right now, until when and whether it is paid – with the reasoning shown.',
    },
    category: 'ai',
    secondaryCategories: ['lifestyle', 'productivity'],
    difficulty: 'intermediate',
    effort: { weeksMin: 5, weeksMax: 7 },
    budget: 'low',
    businessModel: 'one-time',
    platforms: ['ios', 'android'],
    audience: ['consumers'],
    tags: ['parking', 'camera', 'vision', 'street signs', 'ocr', 'driving', 'city'],
    identity: { hue: 24, glyph: 'Cb', pattern: 'diagonal' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: true, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Curbcheck עונה על שאלה אחת שכל נהג בעיר שואל: "מותר לי לחנות כאן עכשיו?". המשתמש מצלם את השלט ואת המדרכה, והאפליקציה משלבת שלושה דברים שאף אחד מהם לא מספיק לבד: קריאת השלט (שעות, ימים, מי רשאי), זיהוי סימון המדרכה (כחול-לבן, אדום-לבן, ללא סימון), והשעה, היום והמיקום הנוכחיים. התשובה מוצגת כפסק דין קצר – מותר / אסור / בתשלום עד 19:00 – ומתחתיו ההסבר: איזו שורה בשלט הובילה למסקנה ומה רמת הביטחון. כשהאפליקציה לא בטוחה היא אומרת זאת ומבקשת תמונה נוספת במקום לנחש. בסוף אפשר להפעיל תזכורת לפני שחלון החניה נגמר.',
        en: 'Curbcheck answers the one question every city driver asks: "am I allowed to park here right now?". The user photographs the sign and the curb, and the app combines three things none of which is enough on its own: reading the sign (hours, days, who is permitted), recognising the curb marking (blue-and-white, red-and-white, unmarked), and the current time, weekday and location. The answer is shown as a short verdict – allowed / not allowed / paid until 19:00 – followed by the reasoning: which line on the sign led to the conclusion and how confident the app is. When it is unsure it says so and asks for another photo instead of guessing. A reminder can be set before the parking window ends.',
      },
      problem: {
        he: 'שלטי החניה בעיר עורמים כלל על גבי כלל: תושבי אזור, שעות פריקה וטעינה, חניה בתשלום בימים מסוימים, ומדרכה שצבועה רק בחציה. נהגים מנחשים, חוטפים דוחות, או מוותרים על מקום פנוי כי לא הצליחו לפענח את השלט.',
        en: 'City parking signs stack rules on top of each other: resident zones, loading hours, paid parking on certain days, and a curb painted only halfway. Drivers guess, get tickets, or pass up a free spot because they could not decode the sign.',
      },
      solution: {
        he: 'מודל ראייה קורא את השלט והמדרכה לתוך מבנה נתונים קבוע (סוגי הגבלה, טווחי שעות, חריגים), ושכבת כללים דטרמיניסטית משווה אותו לשעה ולמיקום הנוכחיים. ההפרדה הזאת מאפשרת להסביר כל תשובה ולהציג רמת ביטחון במקום פסק דין של קופסה שחורה.',
        en: 'A vision model reads the sign and the curb into a fixed data structure (restriction types, time ranges, exceptions), and a deterministic rules layer compares it to the current time and location. This separation makes every answer explainable and lets the app show confidence instead of a black-box verdict.',
      },
      usp: {
        he: 'לא "תשאל צ׳אט על השלט": השלט, צבע המדרכה והשעה הנוכחית משולבים לפסק דין אחד עם הסבר ורמת ביטחון – והודאה כנה ב"לא בטוח" כשהתמונה לא מספיקה, במקום ניחוש שעולה דוח.',
        en: 'Not "ask a chatbot about the sign": the sign, the curb colour and the current time are combined into one verdict with reasoning and a confidence level – and an honest "not sure" when the photo is not enough, instead of a guess that costs a ticket.',
      },
      targetUsers: {
        he: ['נהגים בעיר שחונים ברחובות לא מוכרים', 'תיירים ועולים חדשים שלא מכירים את סימוני החניה המקומיים', 'שליחים ונהגים מקצועיים שעוצרים עשרות פעמים ביום'],
        en: ['City drivers parking on unfamiliar streets', 'Tourists and newcomers who do not know the local curb markings', 'Couriers and professional drivers who stop dozens of times a day'],
      },
      coreFeatures: {
        he: [
          'צילום שלט ומדרכה עם הנחיה חיה למסגור נכון',
          'פסק דין ברור: מותר / אסור / בתשלום, עם "עד מתי"',
          'הסבר שמצביע על השורה בשלט שהכריעה את התשובה',
          'רמת ביטחון ובקשה לתמונה נוספת כשצריך',
          'תזכורת לפני סיום חלון החניה',
          'היסטוריית סריקות עם מיקום לחזרה מהירה לאותו רחוב',
          'מילון סימוני חניה מקומיים עם הסברים',
        ],
        en: [
          'Photograph the sign and the curb with live framing guidance',
          'A clear verdict: allowed / not allowed / paid, with "until when"',
          'Reasoning that points at the sign line that decided the answer',
          'A confidence level and a request for another photo when needed',
          'A reminder before the parking window ends',
          'Scan history with location for a quick return to the same street',
          'A glossary of local curb markings with explanations',
        ],
      },
      screens: [
        { name: { he: 'מצלמה', en: 'Camera' }, description: { he: 'מסך הבית הוא המצלמה עצמה, עם מסגרת מנחה לשלט וכפתור מעבר לצילום המדרכה.', en: 'The camera is the home screen, with a guide frame for the sign and a toggle to photograph the curb.' } },
        { name: { he: 'פסק דין', en: 'Verdict' }, description: { he: 'כרטיס גדול בצבע אחד (ירוק / אדום / כתום) עם המסקנה, "עד מתי", האם בתשלום או חינם, וכפתור תזכורת.', en: 'A large single-colour card (green / red / amber) with the verdict, "until when", whether it is paid or free, and a reminder button.' } },
        { name: { he: 'הסבר', en: 'Reasoning' }, description: { he: 'התמונה עם השורה הרלוונטית מודגשת, פירוק הכללים שזוהו, ורמת ביטחון לכל אחד מהם.', en: 'The photo with the relevant line highlighted, a breakdown of the detected rules, and confidence per rule.' } },
        { name: { he: 'תזכורת', en: 'Reminder' }, description: { he: 'בחירה כמה זמן לפני פקיעת החניה להתריע, מיקום הרכב על מפה ומסלול חזרה אליו.', en: 'Pick how long before expiry to be alerted, the car location on a map and a route back to it.' } },
        { name: { he: 'היסטוריה', en: 'History' }, description: { he: 'רשימת סריקות עם תמונה ממוזערת, רחוב, תוצאה ותאריך; סינון לפי "מקומות שחניתי בהם".', en: 'Scans with a thumbnail, street, verdict and date; filter by "places I parked".' } },
        { name: { he: 'מילון סימונים', en: 'Markings glossary' }, description: { he: 'כרטיסים מאוירים לכל צבע מדרכה ושלט נפוץ, עם הסבר בשפה פשוטה.', en: 'Illustrated cards for every common curb colour and sign, explained in plain language.' } },
      ],
      userJourney: {
        he: [
          'הנהגת עוצרת ליד מדרכה כחול-לבן עם שלט של שלוש שורות',
          'מצלמת את השלט ואז את המדרכה לפי ההנחיה על המסך',
          'מקבלת פסק דין: בתשלום עד 19:00, חינם אחר כך, רמת ביטחון גבוהה',
          'פותחת את ההסבר ורואה שהשורה "למעט תושבי אזור 7" לא חלה עליה',
          'מפעילה תזכורת ל-18:45 ושומרת את מיקום הרכב',
          'מקבלת התראה, חוזרת לרכב, והסריקה נשמרת בהיסטוריה לפעם הבאה',
        ],
        en: [
          'The driver pulls over next to a blue-and-white curb with a three-line sign',
          'Photographs the sign, then the curb, following the on-screen guide',
          'Gets a verdict: paid until 19:00, free afterwards, high confidence',
          'Opens the reasoning and sees that the line "except zone 7 residents" does not apply to her',
          'Sets a reminder for 18:45 and saves the car location',
          'Gets the alert, walks back to the car, and the scan is saved in history for next time',
        ],
      },
      uxDirection: {
        he: 'מהיר ככל האפשר – המשתמש עומד ברחוב עם מנוע דולק. המצלמה היא מסך הבית, פסק הדין הוא כרטיס אחד בצבע אחד שקוראים בשנייה, וההסבר נמצא החלקה אחת למטה למי שרוצה. טיפוגרפיה גדולה, ניגודיות גבוהה לשמש ישירה, וכפתור תזכורת בולט. בלי הרשמה חובה.',
        en: 'As fast as possible – the user is standing in the street with the engine running. The camera is the home screen, the verdict is a single-colour card readable in one second, and the reasoning sits one swipe below for whoever wants it. Large type, high contrast for direct sunlight, and a prominent reminder button. No mandatory sign-up.',
      },
      architecture: {
        he: 'Expo עם expo-camera ו-expo-location, ו-expo-notifications לתזכורות. התמונה נשלחת ל-Edge Function שמריצה מודל ראייה עם סכמת פלט מובנית (סוגי הגבלה, טווחי שעות, חריגים, צבע מדרכה, רמת ביטחון). שכבת כללים דטרמיניסטית בקוד משווה את המבנה לשעה, ליום ולמיקום ומפיקה את פסק הדין וההסבר. ההיסטוריה נשמרת מקומית ב-SQLite; Supabase משמש רק לדיווחי טעויות אנונימיים ולמילון הסימונים.',
        en: 'Expo with expo-camera and expo-location, and expo-notifications for reminders. The photo goes to an Edge Function running a vision model with a structured output schema (restriction types, time ranges, exceptions, curb colour, confidence). A deterministic rules layer in code compares that structure to the time, weekday and location and produces the verdict and reasoning. History is stored locally in SQLite; Supabase is used only for anonymous error reports and the markings glossary.',
      },
      stack: ['Expo', 'expo-camera', 'expo-location', 'expo-notifications', 'expo-sqlite', 'Supabase Edge Functions', 'Anthropic or OpenAI vision API'],
      database: {
        he: ['scans – סריקה, תמונות, מבנה הכללים שזוהה, פסק דין, מיקום (מקומי)', 'reminders – תזכורת, זמן פקיעה, מיקום הרכב (מקומי)', 'sign_patterns – תבניות שלטים וסימונים מקומיים שמנחות את המודל', 'error_reports – דיווחי "התשובה הייתה שגויה" אנונימיים, עם התמונה בהסכמה בלבד'],
        en: ['scans – scan, photos, detected rule structure, verdict, location (local)', 'reminders – reminder, expiry time, car location (local)', 'sign_patterns – local sign and marking templates that guide the model', 'error_reports – anonymous "the answer was wrong" reports, with the photo only on consent'],
      },
      auth: {
        he: 'ללא חשבון. הרכישה החד-פעמית מאומתת מול חנות האפליקציות וההיסטוריה נשמרת במכשיר. חשבון אופציונלי בעתיד רק לסנכרון היסטוריה בין מכשירים.',
        en: 'No account. The one-time purchase is verified against the app store and history lives on the device. An optional account later, only for syncing history across devices.',
      },
      monetization: {
        he: ['רכישה חד-פעמית אחרי כמה סריקות חינם', 'חבילת "נהגים מקצועיים" עם סריקות ללא הגבלה כמנוי שנתי', 'רישוי המנוע לאפליקציות חניה ולציי רכב'],
        en: ['One-time purchase after a few free scans', 'A "professional drivers" pack with unlimited scans as an annual subscription', 'Licensing the engine to parking apps and fleet operators'],
      },
      mvpMilestones: {
        he: ['צילום שלט ופלט מובנה ממודל הראייה', 'שכבת כללים שמפיקה פסק דין והסבר לשעה הנוכחית', 'זיהוי צבע מדרכה ושילובו בפסק הדין', 'תזכורת ומיקום רכב', 'היסטוריה מקומית ומילון סימונים', 'רכישה חד-פעמית ומגבלת סריקות חינם'],
        en: ['Sign photo and structured output from the vision model', 'Rules layer producing a verdict and reasoning for the current time', 'Curb colour recognition folded into the verdict', 'Reminder and car location', 'Local history and markings glossary', 'One-time purchase with a free scan limit'],
      },
      risks: {
        he: ['תשובה שגויה עולה למשתמש דוח – רמת הביטחון חייבת להיות גלויה והניסוח צריך להציג את האפליקציה כעזר ולא כתחליף לשלט', 'מחיר חד-פעמי מול עלות שוטפת של מודל ראייה – להגביל סריקות או להעביר קריאה ראשונית למכשיר', 'חוקי עזר שונים בין עיריות ומשתנים לאורך זמן, ולכן תבניות השלטים דורשות תחזוקה'],
        en: ['A wrong answer costs the user a ticket – confidence must be visible and the copy must frame the app as an aid, not a replacement for the sign', 'A one-time price against an ongoing vision-model cost – cap scans or move first-pass reading on device', 'Municipal bylaws differ between cities and change over time, so sign templates need maintenance'],
      },
      expansion: {
        he: ['תשלום על החניה מתוך האפליקציה דרך ספקי החניה הקיימים', 'מפה קהילתית אנונימית של כללי החניה לפי רחוב, מסריקות ששותפו בהסכמה בלבד', 'מצב קולי לנהגים: "מותר לחנות כאן?" בלי לגעת בטלפון'],
        en: ['Pay for parking in-app through existing parking providers', 'An anonymised community map of parking rules per street, built only from scans shared with consent', 'A voice mode for drivers: "can I park here?" without touching the phone'],
      },
    },
  },
  {
    id: 'headsup',
    name: { he: 'Headsup – מהודעת הגן ליומן', en: 'Headsup' },
    tagline: {
      he: 'משתפים הודעה מקבוצת הגן או הכיתה ומקבלים אירוע ביומן ורשימת "מה להביא" – בלי לגלול שוב 80 הודעות.',
      en: 'Share a message from the kindergarten or class group and get a calendar event plus a "what to bring" checklist – no scrolling back through 80 messages.',
    },
    category: 'ai',
    secondaryCategories: ['lifestyle', 'productivity'],
    difficulty: 'beginner',
    effort: { weeksMin: 2, weeksMax: 3 },
    budget: 'free',
    businessModel: 'ads',
    platforms: ['cross-platform'],
    audience: ['parents', 'consumers'],
    tags: ['calendar', 'whatsapp', 'parents', 'extraction', 'reminders', 'share sheet', 'kindergarten', 'school'],
    identity: { hue: 160, glyph: 'Hu', pattern: 'dots' },
    flags: { beginnerFriendly: true, profitPotential: 'low', experimental: false, trending: false, featuredWeight: 2 },
    spec: {
      overview: {
        he: 'Headsup פותרת כאב קטן ויומיומי של הורים: ההודעה החשובה מהגננת או מוועד הכיתה – "ביום חמישי מסיבת חנוכה ב-16:30, להביא חולצה לבנה וסופגנייה" – נקברת בין עשרות הודעות אחרות ונשכחת. ההורה משתף את ההודעה לאפליקציה דרך תפריט השיתוף (או מדביק אותה), ומודל שפה מחלץ ממנה את מה שחשוב: תאריך ושעה, מקום, מה להביא ומה ההורה צריך לעשות. התוצאה מוצגת לאישור בלחיצה אחת ונכנסת ליומן של הטלפון עם תזכורת ערב קודם, ורשימת "מה להביא" הופכת לצ׳קליסט. האפליקציה מבינה ביטויי זמן יחסיים כמו "מחרתיים" ו"יום חמישי הקרוב", ולומדת מהאישורים של ההורה איזה שם גן או חתימת גננת שייכים לאיזה ילד.',
        en: 'Headsup fixes a small daily pain for parents: the important message from the teacher or the class committee – "Thursday 16:30 Hanukkah party, bring a white shirt and a doughnut" – gets buried under dozens of other messages. The parent shares the message to the app through the share sheet (or pastes it), and a language model pulls out what matters: date and time, place, what to bring and what the parent must do. One tap confirms it into the phone calendar with a reminder the evening before, and "what to bring" becomes a checklist. The app understands relative time phrases such as "the day after tomorrow" and "this coming Thursday", and learns from the parent’s confirmations which kindergarten name or teacher signature belongs to which child.',
      },
      problem: {
        he: 'קבוצות וואטסאפ של גנים וכיתות מערבבות הודעות חשובות עם ברכות ותמונות. התאריך של המסיבה, השעה של אסיפת ההורים ומה צריך להביא נעלמים בגלילה, וההורה מגלה בבוקר שהילד היה אמור להגיע בחולצה לבנה.',
        en: 'Kindergarten and class WhatsApp groups mix critical notices with greetings and photos. The party date, the parents’ meeting time and what to bring vanish in the scroll, and the parent finds out in the morning that the child was supposed to arrive in a white shirt.',
      },
      solution: {
        he: 'שיתוף של הודעה אחת לאפליקציה, חילוץ מובנה של אירוע, מקום, פריטים להביא ופעולות נדרשות, ואישור בלחיצה שמכניס הכול ליומן המכשיר. בלי חשבון, בלי להעביר את כל הקבוצה, ובלי להחליף את וואטסאפ.',
        en: 'Share one message to the app, get a structured extraction of the event, place, items to bring and required actions, and confirm with one tap into the device calendar. No account, no forwarding the whole group, and no replacing WhatsApp.',
      },
      usp: {
        he: 'מתמקדת בפעולה אחת שהורים חוזרים עליה עשרות פעמים בשנה: ביטויי זמן בעברית מפוענחים ביחס למועד שליחת ההודעה, "מה להביא" הופך לצ׳קליסט שקופץ בבוקר האירוע, וכל ילד מקבל צבע משלו – לא עוד עוזר כללי שצריך להסביר לו מה רוצים.',
        en: 'Focused on one action parents repeat dozens of times a year: Hebrew time phrases are resolved relative to when the message was sent, "what to bring" becomes a checklist that pops up on the morning of the event, and each child gets a colour of their own – not another general assistant you have to brief.',
      },
      targetUsers: {
        he: ['הורים לילדים בגן ובבית ספר יסודי', 'הורים שמנהלים קבוצות של כמה ילדים במקביל', 'סבים וסבתות או מטפלות שמקבלים הודעות מועברות'],
        en: ['Parents of kindergarten and primary-school children', 'Parents juggling groups for several children at once', 'Grandparents or caregivers who receive forwarded notices'],
      },
      coreFeatures: {
        he: [
          'שיתוף הודעה מכל אפליקציה דרך תפריט השיתוף, או הדבקה',
          'חילוץ תאריך, שעה, מקום, פריטים להביא ופעולות נדרשות',
          'הבנת ביטויי זמן יחסיים בעברית ובאנגלית',
          'אישור בלחיצה והוספה ליומן המכשיר עם תזכורת',
          'צ׳קליסט "מה להביא" שמסמנים בבוקר האירוע',
          'צבע לכל ילד, ולמידה מהאישורים איזה שם גן או גננת שייכים לאיזה ילד',
        ],
        en: [
          'Share a message from any app via the share sheet, or paste it',
          'Extraction of date, time, place, items to bring and required actions',
          'Understanding of relative time phrases in Hebrew and English',
          'One-tap confirmation into the device calendar with a reminder',
          'A "what to bring" checklist ticked off on the morning of the event',
          'A colour per child, and learning from confirmations which kindergarten or teacher name belongs to which child',
        ],
      },
      screens: [
        { name: { he: 'קליטת הודעה', en: 'Capture' }, description: { he: 'שדה הדבקה גדול או ההודעה שהגיעה מהשיתוף, עם בחירת הילד הרלוונטי למעלה.', en: 'A large paste field or the shared message, with the relevant child selected on top.' } },
        { name: { he: 'אישור', en: 'Review' }, description: { he: 'כרטיס אירוע לעריכה: כותרת, תאריך ושעה, מקום ורשימת פריטים; כל שדה ניתן לתיקון לפני השמירה.', en: 'An editable event card: title, date and time, place and item list; every field can be corrected before saving.' } },
        { name: { he: 'הקרובים', en: 'Upcoming' }, description: { he: 'ציר זמן של האירועים שנשמרו לפי ילד, עם הצ׳קליסט פתוח ליד האירועים של מחר.', en: 'A timeline of saved events per child, with the checklist expanded next to tomorrow’s events.' } },
        { name: { he: 'ילדים ומקורות', en: 'Children & sources' }, description: { he: 'רשימת הילדים עם צבע לכל אחד, ושמות הגנים והגננות שהאפליקציה למדה לשייך לכל ילד, עם אפשרות לתקן שיוך שגוי.', en: 'The children with a colour each, and the kindergarten and teacher names the app has learned to associate with each child, with a way to fix a wrong match.' } },
        { name: { he: 'הגדרות', en: 'Settings' }, description: { he: 'זמן תזכורת ברירת מחדל, יומן היעד במכשיר ושפת הממשק.', en: 'Default reminder time, target calendar on the device and interface language.' } },
      ],
      userJourney: {
        he: [
          'הודעה ארוכה מהגננת מגיעה לקבוצה בשעה 21:00',
          'ההורה לוחץ "שתף" בוואטסאפ ובוחר ב-Headsup',
          'האפליקציה מציגה: מסיבת חנוכה, יום חמישי 16:30, להביא חולצה לבנה וסופגנייה',
          'ההורה מתקן את השעה ל-16:00 ומאשר',
          'האירוע נכנס ליומן עם תזכורת ביום רביעי בערב',
          'בבוקר יום חמישי הצ׳קליסט קופץ והחולצה הלבנה כבר בתיק',
        ],
        en: [
          'A long message from the teacher lands in the group at 21:00',
          'The parent taps "share" in WhatsApp and picks Headsup',
          'The app shows: Hanukkah party, Thursday 16:30, bring a white shirt and a doughnut',
          'The parent corrects the time to 16:00 and confirms',
          'The event enters the calendar with a reminder on Wednesday evening',
          'On Thursday morning the checklist pops up and the white shirt is already in the bag',
        ],
      },
      uxDirection: {
        he: 'שני מסכים וזהו: קליטה ואישור. צבעים חמים ורכים, טיפוגרפיה גדולה שנוחה לקריאה בערב במיטה, וכפתור אישור אחד גדול בתחתית. שדות שהמודל לא היה בטוח לגביהם מודגשים בעדינות כדי שההורה יבדוק אותם קודם.',
        en: 'Two screens and done: capture and confirm. Warm, soft colours, large type that is easy to read in bed at night, and one big confirm button at the bottom. Fields the model was unsure about are gently highlighted so the parent checks them first.',
      },
      architecture: {
        he: 'Expo עם Expo Router, expo-calendar להוספת אירועים ליומן המכשיר ו-expo-notifications לתזכורות. קליטה מתפריט השיתוף דרך פלאגין share intent ב-iOS ובאנדרואיד; בגרסת הווב מדביקים את ההודעה ומורידים את האירוע כקובץ ics במקום הוספה ליומן המכשיר. קריאה אחת למודל שפה עם סכמת פלט קבועה (אירוע, פריטים, פעולות, רמת ביטחון לכל שדה) דרך Edge Function קטנה שמסתירה את המפתח. ילדים, קבוצות ואירועים נשמרים מקומית ב-SQLite – אין צורך בשרת מעבר לפונקציה הזאת.',
        en: 'Expo with Expo Router, expo-calendar to add events to the device calendar and expo-notifications for reminders. Share-sheet capture via a share-intent plugin on iOS and Android; on the web build the message is pasted and the event is downloaded as an .ics file instead of going into the device calendar. One language-model call with a fixed output schema (event, items, actions, per-field confidence) through a tiny Edge Function that hides the API key. Children, groups and events are stored locally in SQLite – no server beyond that function is needed.',
      },
      stack: ['Expo', 'Expo Router', 'expo-calendar', 'expo-notifications', 'expo-share-intent', 'expo-sqlite', 'Supabase Edge Functions', 'Anthropic or OpenAI API'],
      database: {
        he: ['children – ילד, שם, צבע', 'sources – שם גן או חתימת גננת כפי שהם מופיעים בהודעות, ילד משויך', 'events – אירוע, תאריך, שעה, מקום, מזהה ביומן המכשיר', 'items – פריט להביא, אירוע, סומן / לא סומן', 'captures – הטקסט המקורי של ההודעה לצורך תיקון ושחזור'],
        en: ['children – child, name, colour', 'sources – kindergarten name or teacher signature as it appears in messages, linked child', 'events – event, date, time, place, device calendar id', 'items – item to bring, event, checked / unchecked', 'captures – the original message text for correction and recovery'],
      },
      auth: {
        he: 'ללא חשבון וללא הרשמה – כל הנתונים נשמרים במכשיר. רק טקסט ההודעה עובר למודל דרך פונקציה בשרת שלא שומרת אותו; שמות הילדים והצבעים שלהם לא עוזבים את המכשיר, וכך הפרטיות של הקבוצה ושל הילדים נשמרת.',
        en: 'No account and no sign-up – everything stays on the device. Only the message text passes through a server function that does not store it; the children’s names and colours never leave the device, keeping the group’s and the children’s privacy intact.',
      },
      monetization: {
        he: ['באנר קטן במסך "הקרובים" בלבד, אף פעם לא במסך האישור', 'רכישה חד-פעמית להסרת פרסומות', 'בהמשך: חבילה משפחתית עם סנכרון בין שני הורים'],
        en: ['A small banner on the "upcoming" screen only, never on the confirm screen', 'One-time purchase to remove ads', 'Later: a family pack with sync between two parents'],
      },
      mvpMilestones: {
        he: ['הדבקת הודעה וחילוץ אירוע עם סכמת פלט קבועה', 'מסך אישור עם עריכת שדות והוספה ליומן', 'צ׳קליסט ותזכורת', 'ילדים ומקורות', 'קליטה מתפריט השיתוף (דורשת development build)'],
        en: ['Paste a message and extract an event with a fixed output schema', 'Review screen with field editing and calendar insertion', 'Checklist and reminder', 'Children and sources', 'Share-sheet capture (needs a development build)'],
      },
      risks: {
        he: ['תאריך שגוי בחילוץ גרוע יותר מאי-חילוץ – להציג רמת ביטחון ולדרוש אישור תמיד', 'ביטויי זמן יחסיים תלויים בתאריך שבו נשלחה ההודעה ולא בתאריך השיתוף – צריך לבקש אותו או להסיק אותו', 'פלאגין שיתוף דורש development build ולא עובד ב-Expo Go'],
        en: ['A wrong extracted date is worse than no extraction – always show confidence and require confirmation', 'Relative time phrases depend on when the message was sent, not when it was shared – ask for it or infer it', 'A share-sheet plugin needs a development build and does not work in Expo Go'],
      },
      expansion: {
        he: ['חילוץ אירועים מצילום מסך של ההודעה', 'סנכרון בין שני הורים עם חלוקת "מי מביא מה"', 'זיהוי אוטומטי של הודעות חשובות בקבוצה (דורש אינטגרציה רשמית)'],
        en: ['Extract events from a screenshot of the message', 'Sync between two parents with "who brings what" assignment', 'Automatic detection of important messages in the group (requires an official integration)'],
      },
    },
  },
];
