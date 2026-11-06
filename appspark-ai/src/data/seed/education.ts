import type { Idea } from '../types';

/**
 * Education – learning, practice, teaching and exam prep. Every idea here has
 * a mechanism beyond "flashcards with a streak": tagged misconceptions, an
 * error notebook that schedules itself, prosody overlays, assignments born
 * from real conditions, and scoring that rewards reasoning over recall.
 */
export const ideas: Idea[] = [
  {
    id: 'lastfive',
    name: { he: 'Lastfive – חמש דקות לפני הצלצול', en: 'Lastfive' },
    tagline: {
      he: 'כרטיס יציאה של שתי שאלות בסוף השיעור, והמורה רואה לא רק מי טעה אלא למה: הכיתה מקובצת לפי תפיסה שגויה, עם פתיח מוכן לשיעור הבא.',
      en: 'Two-question exit tickets that show a teacher not just who got it wrong but why: the class grouped by misconception, plus an opener for the next lesson.',
    },
    category: 'education',
    secondaryCategories: ['productivity', 'business'],
    difficulty: 'intermediate',
    effort: { weeksMin: 5, weeksMax: 8 },
    budget: 'low',
    businessModel: 'b2b',
    platforms: ['web'],
    audience: ['professionals', 'teams', 'students'],
    tags: ['teachers', 'classroom', 'formative assessment', 'exit ticket', 'misconceptions', 'quiz', 'school', 'b2b'],
    identity: { hue: 262, glyph: 'Lf', pattern: 'grid' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: false, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Lastfive הופכת את חמש הדקות האחרונות של השיעור לכלי העבודה הכי שימושי של המורה. המורה בוחרת מהמאגר או כותבת שתי שאלות קצרות, שבהן כל מסיח מתויג מראש בתפיסה השגויה שהוא חושף – "חיבר במקום לחסר", "בלבל בין מסה למשקל". התלמידים עונים מהטלפון דרך קוד או QR, בלי חשבון ובלי התקנה. במקום אחוז הצלחה כיתתי, המורה מקבלת מפה של הכיתה לפי תפיסות שגויות: מי נפל איפה, אילו טעויות משותפות לרבים, ועם אילו שלושה תלמידים כדאי לשבת מחר. לכל תפיסה שגויה נפוצה מצורף פתיח של חמש דקות לשיעור הבא, והמאגר המתויג משותף למורי המקצוע בבית הספר, כך שהוא משתבח עם כל כרטיס.',
        en: 'Lastfive turns the last five minutes of a lesson into the teacher’s most useful tool. The teacher picks or writes two short questions in which every distractor is pre-tagged with the misconception it reveals – "added instead of subtracting", "confused mass with weight". Students answer from their phones via a code or QR, with no account and nothing to install. Instead of a percent correct, the teacher gets a map of the class by misconception: who fell where, which mistakes many share, which three students to sit with tomorrow. Each common misconception comes with a five-minute opener for the next lesson, and the tagged bank is shared among the school’s subject teachers, so it improves with every ticket.',
      },
      problem: {
        he: 'מורים מסיימים שיעור בלי לדעת מה באמת נקלט, ומגלים את הפערים רק במבחן – שבועות מאוחר מדי. כלי חידונים קיימים מציגים אחוז הצלחה ומדליות, אבל "60% ענו נכון" לא אומר למורה מה ללמד מחר. בנוסף, רבים מהכלים דורשים חשבונות לתלמידים, מה שמסבך בתי ספר שמקפידים על פרטיות קטינים.',
        en: 'Teachers end a lesson without knowing what actually landed and discover the gaps on the test – weeks too late. Existing quiz tools show percent correct and medals, but "60% answered correctly" does not tell a teacher what to teach tomorrow. Many of them also require student accounts, which complicates things for schools strict about minors’ privacy.',
      },
      solution: {
        he: 'כרטיס יציאה של שתי שאלות שהמסיחים שלהן מתויגים לפי תפיסה שגויה, מענה מהטלפון בכינוי בלבד ובלי חשבון, ולוח למורה שמקבץ את הכיתה לפי סוג הטעות במקום לפי ציון. לכל תפיסה שגויה נפוצה – פתיח מוכן לשיעור הבא, ומאגר משותף למורי המקצוע בבית הספר.',
        en: 'A two-question exit ticket whose distractors are tagged by misconception, answering from a phone under a nickname only and without an account, and a teacher board that groups the class by error type rather than by score. Each common misconception ships with a ready opener for the next lesson, and the bank is shared among the school’s subject teachers.',
      },
      usp: {
        he: 'הערך לא בחידון אלא במסיחים המתויגים: במקום "מי צדק", המורה רואה "מי חושב מה ולמה", ומקבלת פעולה קונקרטית למחר. בלי חשבונות תלמידים, ובלי להחליף את מערכת הניהול של בית הספר.',
        en: 'The value is not the quiz but the tagged distractors: instead of "who was right", the teacher sees "who thinks what and why" and gets a concrete action for tomorrow. No student accounts, and no replacing the school’s management system.',
      },
      targetUsers: {
        he: ['מורים למתמטיקה ולמדעים בחטיבה ובתיכון', 'רכזי מקצוע שרוצים מאגר שאלות משותף לצוות', 'בתי ספר שמחפשים הערכה מעצבת בלי לאסוף נתוני תלמידים'],
        en: ['Maths and science teachers in middle and high school', 'Subject coordinators who want a shared question bank for their team', 'Schools looking for formative assessment without collecting student data'],
      },
      coreFeatures: {
        he: [
          'כתיבת שאלה עם תיוג כל מסיח בתפיסה שגויה',
          'הפעלת כרטיס בכיתה דרך קוד או QR, מענה בלי חשבון',
          'לוח כיתה שמקבץ תלמידים לפי סוג טעות ולא לפי ציון',
          'פתיח של חמש דקות לשיעור הבא לכל תפיסה שגויה נפוצה',
          'מעקב אחרי תפיסה שגויה לאורך זמן: נעלמה או חזרה',
          'מאגר שאלות מתויג משותף למורי המקצוע בבית הספר',
          'יצוא סיכום לרכזת או לישיבת צוות',
        ],
        en: [
          'Write a question and tag every distractor with a misconception',
          'Launch a ticket in class via code or QR, answered without an account',
          'A class board that groups students by error type, not by score',
          'A five-minute opener for the next lesson per common misconception',
          'Track a misconception over time: gone or back again',
          'A tagged question bank shared among the school’s subject teachers',
          'Export a summary for the coordinator or a team meeting',
        ],
      },
      screens: [
        { name: { he: 'הכיתות שלי', en: 'My classes' }, description: { he: 'רשימת הכיתות עם הכרטיס האחרון, התפיסה השגויה הבולטת בכל אחת וכפתור "הפעל כרטיס".', en: 'The classes with their last ticket, the standout misconception in each and a "launch ticket" button.' } },
        { name: { he: 'בניית כרטיס', en: 'Ticket builder' }, description: { he: 'בחירת שתי שאלות מהמאגר או כתיבה חדשה, עם שדה תיוג תפיסה שגויה ליד כל מסיח.', en: 'Pick two questions from the bank or write new ones, with a misconception tag field beside every distractor.' } },
        { name: { he: 'מסך הקרנה', en: 'Projector view' }, description: { he: 'קוד ו-QR גדולים להקרנה, מונה תשובות שנכנסות וטיימר של חמש דקות.', en: 'A large code and QR for the projector, a live count of incoming answers and a five-minute timer.' } },
        { name: { he: 'מענה תלמיד', en: 'Student answer' }, description: { he: 'דף ווב קליל: שם פרטי או כינוי שהמורה הגדירה, שתי שאלות, שליחה – בלי הרשמה.', en: 'A lightweight web page: a first name or teacher-defined nickname, two questions, submit – no sign-up.' } },
        { name: { he: 'מפת הכיתה', en: 'Class map' }, description: { he: 'התלמידים מקובצים לאשכולות לפי תפיסה שגויה, עם גודל אשכול, שמות והשוואה לכרטיס הקודם.', en: 'Students clustered by misconception, with cluster size, names and a comparison to the previous ticket.' } },
        { name: { he: 'פתיח לשיעור הבא', en: 'Next-lesson opener' }, description: { he: 'כרטיס מוכן להקרנה: שאלה מנוגדת, הסבר של שתי שורות ותרגיל קצר, לעריכה חופשית.', en: 'A ready-to-project card: a contrasting question, a two-line explanation and a short exercise, freely editable.' } },
        { name: { he: 'מאגר בית הספר', en: 'School bank' }, description: { he: 'שאלות מתויגות לפי נושא ותפיסה שגויה, עם מי כתב אותן וכמה פעמים שימשו.', en: 'Questions tagged by topic and misconception, with who wrote them and how often they were used.' } },
      ],
      userJourney: {
        he: [
          'המורה מסיימת ללמד שברים ובוחרת שתי שאלות מהמאגר, חמש דקות לפני הצלצול',
          'מקרינה את הקוד; התלמידים עונים מהטלפון תוך שתי דקות',
          'במפת הכיתה מתברר ש-11 תלמידים חיברו מונים ומכנים בלי למצוא מכנה משותף',
          'בערב היא פותחת את הפתיח המוכן, מתקנת ניסוח אחד ושומרת',
          'בשיעור הבא הפתיח מוקרן, ובכרטיס החדש האשכול התכווץ לשלושה תלמידים',
          'הרכזת רואה במאגר שהשאלה הזאת חשפה את אותה טעות גם בכיתה מקבילה',
        ],
        en: [
          'The teacher finishes a lesson on fractions and picks two questions from the bank, five minutes before the bell',
          'Projects the code; students answer from their phones within two minutes',
          'The class map shows that 11 students added numerators and denominators without finding a common denominator',
          'That evening she opens the ready opener, fixes one phrasing and saves it',
          'Next lesson the opener is projected, and on the new ticket the cluster has shrunk to three students',
          'The coordinator sees in the bank that the same question exposed the same error in a parallel class',
        ],
      },
      uxDirection: {
        he: 'שני קצבים שונים: בכיתה הכול גדול, מהיר ובלחיצה אחת – קוד ענק, טיימר וכפתור סיום; בערב, לוח שקט בסגנון מחברת עם צבע אחד לכל תפיסה שגויה. מפת הכיתה היא המסך המרכזי ומוצגת כאשכולות ולא כטבלת ציונים, כדי שהעין תתפוס קודם את הדפוס ולא את התלמיד החלש.',
        en: 'Two different tempos: in class everything is large, fast and one tap – a huge code, a timer and an end button; in the evening, a quiet notebook-style board with one colour per misconception. The class map is the hero screen and is drawn as clusters rather than a grade table, so the eye catches the pattern before the weak student.',
      },
      architecture: {
        he: 'אפליקציית Next.js רספונסיבית למורה, כך שאפשר להפעיל כרטיס גם מהטלפון בכיתה, עם דף מענה ציבורי קליל לתלמידים. Supabase לאימות מורים, לכיתות, לשאלות ולתשובות, עם Realtime לעדכון מונה התשובות במסך ההקרנה. הקיבוץ לאשכולות הוא דטרמיניסטי – תגית המסיח שנבחר – ולא דורש מודל. מודל שפה משמש רק להצעת ניסוח ראשוני לפתיח, והמורה עורכת תמיד. התלמידים מזוהים בכינוי בלבד, והכינויים נמחקים אוטומטית בסוף שנת הלימודים.',
        en: 'A responsive Next.js app for teachers, so a ticket can be launched from a phone in class too, with a lightweight public answer page for students. Supabase for teacher auth, classes, questions and answers, with Realtime updating the answer counter on the projector view. Clustering is deterministic – the tag of the chosen distractor – and needs no model. A language model is used only to draft the opener, which the teacher always edits. Students are identified by nickname only, and nicknames are wiped automatically at the end of the school year.',
      },
      stack: ['Next.js', 'Supabase', 'Supabase Realtime', 'Tailwind CSS', 'Anthropic or OpenAI API', 'Vercel'],
      database: {
        he: ['schools – בית ספר, מקצועות, מורים', 'classes – כיתה, מורה, רשימת כינויים', 'questions – שאלה, נושא, מסיחים עם תגית תפיסה שגויה לכל אחד', 'tickets – כרטיס, כיתה, שתי שאלות, קוד, זמן הפעלה', 'responses – תשובה, כרטיס, כינוי, מסיח שנבחר', 'openers – פתיח לשיעור הבא, תפיסה שגויה, הגרסה הערוכה של המורה'],
        en: ['schools – school, subjects, teachers', 'classes – class, teacher, nickname list', 'questions – question, topic, distractors each tagged with a misconception', 'tickets – ticket, class, two questions, code, launch time', 'responses – answer, ticket, nickname, chosen distractor', 'openers – next-lesson opener, misconception, the teacher’s edited version'],
      },
      auth: {
        he: 'מורים נכנסים עם Google Workspace של בית הספר או באימייל. תלמידים לא נרשמים בכלל – הם עונים דרך קוד כרטיס זמני וכינוי. RLS לפי בית ספר ומורה, ומדיניות מחיקה אוטומטית לתשובות ישנות.',
        en: 'Teachers sign in with the school’s Google Workspace or by email. Students never register – they answer through a temporary ticket code and a nickname. RLS by school and teacher, with an automatic deletion policy for old responses.',
      },
      monetization: {
        he: ['חינם למורה בודדת עם שתי כיתות ומאגר אישי', 'רישיון בית ספרי שנתי עם מאגר משותף ודוחות לרכזים', 'חבילות שאלות מתויגות לפי תוכנית הלימודים משותפי תוכן'],
        en: ['Free for a single teacher with two classes and a personal bank', 'Annual school licence with a shared bank and coordinator reports', 'Curriculum-aligned tagged question packs from content partners'],
      },
      mvpMilestones: {
        he: ['בניית שאלה עם תיוג מסיחים ומאגר אישי', 'הפעלת כרטיס עם קוד ודף מענה לתלמידים', 'מפת כיתה לפי אשכולות עם Realtime', 'פתיח לשיעור הבא עם טיוטה ממודל שפה', 'מאגר משותף ברמת בית הספר', 'רישיון בית ספרי ותשלום'],
        en: ['Question builder with distractor tagging and a personal bank', 'Ticket launch with a code and the student answer page', 'Class map by cluster with Realtime', 'Next-lesson opener with a language-model draft', 'School-level shared bank', 'School licence and billing'],
      },
      risks: {
        he: ['תיוג מסיחים דורש מחשבה מהמורה – בלי מאגר התחלתי טוב המוצר נראה ריק, לכן צריך לכתוב מראש כמה מאות שאלות מתויגות לנושאים הנפוצים', 'בתי ספר קונים לאט ודרך רכזים ומנהלים – המסלול למורה בודדת צריך להיות חינמי כדי ליצור משיכה מלמטה', 'תשובות תלמידים הן מידע על קטינים גם בכינוי – חובה למזער נתונים, לפרסם מדיניות ולמחוק בסוף שנה'],
        en: ['Tagging distractors takes teacher effort – without a strong starter bank the product looks empty, so a few hundred tagged questions on common topics must be written up front', 'Schools buy slowly and through coordinators and principals – the single-teacher tier must be free to create bottom-up pull', 'Student answers are data about minors even under a nickname – minimise data, publish the policy and delete at year end'],
      },
      expansion: {
        he: ['שאלות פתוחות קצרות שמסווגות לתפיסות שגויות בעזרת מודל, באישור המורה', 'חיבור למערכות ניהול למידה כדי למשוך רשימות כיתה', 'מאגר בין-בית-ספרי עם דפוסי תפיסות שגויות לפי נושא'],
        en: ['Short open-ended questions classified into misconceptions by a model, with teacher approval', 'Integration with learning-management systems to pull class rosters', 'A cross-school bank with misconception patterns by topic'],
      },
    },
  },
  {
    id: 'retake',
    name: { he: 'Retake – מחברת הטעויות שלך', en: 'Retake' },
    tagline: {
      he: 'מצלמים שאלה שנפלתם בה בבגרות או בפסיכומטרי, מתייגים למה, ומקבלים שאלות תאומות במרווחים הולכים וגדלים – עד שהטעות הזאת כבר לא חוזרת.',
      en: 'Photograph a bagrut or psychometric question you got wrong, tag why, and get twin questions at growing intervals – until that mistake stops coming back.',
    },
    category: 'education',
    secondaryCategories: ['productivity', 'ai'],
    difficulty: 'intermediate',
    effort: { weeksMin: 6, weeksMax: 8 },
    budget: 'medium',
    businessModel: 'freemium',
    platforms: ['ios', 'android'],
    audience: ['students', 'parents'],
    tags: ['bagrut', 'psychometric', 'exam prep', 'spaced repetition', 'error log', 'students', 'israel', 'math'],
    identity: { hue: 15, glyph: 'Rt', pattern: 'diagonal' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: true, featuredWeight: 4 },
    spec: {
      overview: {
        he: 'Retake בנויה על ההרגל שמורים פרטיים טובים מנסים להשריש ובדרך כלל נכשלים: מחברת טעויות. במקום עוד מאגר של אלפי שאלות, התלמיד מצלם רק את השאלות שהוא נפל בהן – ממבחן בכיתה, מבגרות קודמת או מסימולציית פסיכומטרי – ומתייג בלחיצה למה: טעות חישוב, לא הבנתי את השאלה, חסר לי חומר, או נגמר הזמן. האפליקציה מזהה את המיומנות ומתזמנת "שאלה תאומה" – אותה מיומנות, מספרים או ניסוח אחרים – למחרת, אחרי שלושה ימים, אחרי שבוע. שבוע לפני המבחן היא מרכיבה מבחן אישי מהחולשות של אותו תלמיד בלבד, ובפסיכומטרי נוסף אימון קצב: תקציב זמן לשאלה ודוח "איפה שרפת זמן" אחרי כל פרק.',
        en: 'Retake is built on the habit good private tutors try to instil and usually fail to: an error notebook. Instead of another bank of thousands of questions, the student photographs only the questions they got wrong – from a class test, a past bagrut or a psychometric mock – and tags why with one tap: calculation slip, misread the question, missing material, or ran out of time. The app detects the skill and schedules a "twin" question – same skill, different numbers or wording – for tomorrow, in three days, in a week. A week before the exam it builds a personal test from that student’s weak spots only; for the psychometric exam it adds pacing training – a time budget per question and a "where you burned time" report per section.',
      },
      problem: {
        he: 'תלמידים פותרים עוד ועוד שאלות אבל חוזרים על אותן טעויות, כי אף אחד לא עוקב אחרי מה שהם נפלו בו. מאגרי שאלות מתייחסים לכולם אותו דבר, ומחברת טעויות ידנית מתה אחרי שבוע. בפסיכומטרי הבעיה הגדולה היא לא רק ידע אלא קצב, ואין דרך לאמן אותו בלי מבחן מלא.',
        en: 'Students solve more and more questions yet repeat the same mistakes, because nobody tracks what they fell on. Question banks treat everyone the same, and a handwritten error notebook dies after a week. In the psychometric exam the biggest problem is not only knowledge but pace, and there is no way to train it without a full mock test.',
      },
      solution: {
        he: 'צילום של השאלה שנכשלה, תיוג סיבת הטעות בלחיצה, זיהוי המיומנות, ותזמון שאלות תאומות במרווחים הולכים וגדלים. מבחן אישי לפני המועד שמורכב מהחולשות בלבד, ואימון קצב לפסיכומטרי עם תקציב זמן לשאלה.',
        en: 'Photograph the failed question, tag the cause with one tap, detect the skill, and schedule twin questions at growing intervals. A personal pre-exam test made only of weak spots, and psychometric pacing training with a time budget per question.',
      },
      usp: {
        he: 'לא עוד מאגר – מחברת טעויות שמתזמנת את עצמה: היא מתחילה מהשאלות שהתלמיד באמת נפל בהן, מפרידה בין חוסר ידע לבין טעות קצב, וחוזרת אליו בדיוק כשהוא עומד לשכוח.',
        en: 'Not another bank – a self-scheduling error notebook: it starts from the questions the student actually got wrong, separates missing knowledge from pacing errors, and comes back exactly when they are about to forget.',
      },
      targetUsers: {
        he: ['תלמידי י״א–י״ב לפני בגרות במתמטיקה, בפיזיקה ובאנגלית', 'נבחני פסיכומטרי שמתכוננים לבד או במקביל לקורס', 'הורים שרוצים לראות התקדמות בלי לנדנד', 'מורים פרטיים שמחפשים דרך לעקוב בין שיעור לשיעור'],
        en: ['11th and 12th graders ahead of maths, physics and English bagrut exams', 'Psychometric candidates preparing alone or alongside a course', 'Parents who want to see progress without nagging', 'Private tutors looking for a way to follow up between lessons'],
      },
      coreFeatures: {
        he: [
          'צילום שאלה ופתרון שגוי עם חיתוך אוטומטי של הדף',
          'תיוג סיבת הטעות בלחיצה: חישוב, הבנה, חומר, זמן',
          'זיהוי נושא ומיומנות לפי תוכנית הבגרות או פרקי הפסיכומטרי',
          'שאלות תאומות במרווחים הולכים וגדלים',
          'מבחן אישי לפני המועד שמורכב רק מהחולשות',
          'אימון קצב עם תקציב זמן לשאלה ודוח "איפה שרפת זמן" (שלב שני, אחרי ה-MVP)',
          'דוח שבועי להורה או למורה הפרטי, בהסכמת התלמיד',
        ],
        en: [
          'Photograph a question and the wrong solution with automatic page cropping',
          'One-tap error cause tagging: calculation, comprehension, material, time',
          'Topic and skill detection mapped to the bagrut syllabus or psychometric sections',
          'Twin questions at growing intervals',
          'A personal pre-exam test made only of weak spots',
          'Pacing training with a time budget per question and a "where you burned time" report (second phase, after the MVP)',
          'A weekly report for a parent or tutor, with the student’s consent',
        ],
      },
      screens: [
        { name: { he: 'היום', en: 'Today' }, description: { he: 'השאלות התאומות שמחכות היום, ימים עד המבחן הקרוב, וכפתור צילום גדול לטעות חדשה.', en: 'Today’s twin questions, days until the next exam, and a big camera button for a new mistake.' } },
        { name: { he: 'צילום טעות', en: 'Capture a mistake' }, description: { he: 'מצלמה עם חיתוך אוטומטי של השאלה, ואחריה ארבעה כפתורי סיבה גדולים ושדה הערה אופציונלי.', en: 'Camera with automatic cropping of the question, followed by four big cause buttons and an optional note.' } },
        { name: { he: 'אישור זיהוי', en: 'Confirm detection' }, description: { he: 'הנושא והמיומנות שזוהו, עם אפשרות לתקן מתוך רשימת תוכנית הלימודים.', en: 'The detected topic and skill, with a fix option from the syllabus list.' } },
        { name: { he: 'שאלה תאומה', en: 'Twin question' }, description: { he: 'השאלה החדשה עם פס זמן עדין, שדה תשובה, ואחרי השליחה – פתרון מלא לצד הטעות המקורית.', en: 'The new question with a subtle time bar, an answer field, and after submission the full solution beside the original mistake.' } },
        { name: { he: 'מחברת הטעויות', en: 'Error notebook' }, description: { he: 'כל הטעויות לפי נושא וסיבה, עם סימון "נסגרה" כשתאומה נפתרה נכון שלוש פעמים ברצף.', en: 'All mistakes by topic and cause, marked "closed" once a twin was solved correctly three times in a row.' } },
        { name: { he: 'אימון קצב', en: 'Pacing drill' }, description: { he: 'פרק מדומה של 20 שאלות עם תקציב זמן לכל אחת, ובסוף גרף של זמן מול תקציב לכל שאלה.', en: 'A simulated 20-question section with a time budget each, ending in a time-versus-budget graph per question.' } },
        { name: { he: 'המבחן האישי', en: 'Personal test' }, description: { he: 'מבחן שמורכב מהחולשות הפתוחות בלבד, עם זמן כולל וסיכום לפי סיבת טעות.', en: 'A test built only from open weak spots, with a total time and a summary by error cause.' } },
        { name: { he: 'שיתוף', en: 'Share' }, description: { he: 'הפעלת דוח שבועי להורה או למורה פרטי, בחירה מה לשתף, והפסקה בלחיצה.', en: 'Turn on a weekly report for a parent or tutor, choose what to share, and stop with one tap.' } },
      ],
      userJourney: {
        he: [
          'תלמידת י״ב נכשלת בשאלת וקטורים במבחן כיתתי ומצלמת אותה בערב',
          'מתייגת "לא הבנתי את השאלה"; האפליקציה מזהה: וקטורים, מכפלה סקלרית',
          'למחרת מקבלת שאלה תאומה עם ניסוח אחר, פותרת נכון ומשווה לפתרון המלא',
          'אחרי שבוע התאומה השלישית נפתרת נכון והטעות מסומנת "נסגרה"',
          'שבוע לפני הבגרות היא פותרת מבחן אישי של 12 שאלות מהחולשות שנותרו',
          'אמא שלה מקבלת דוח שבועי קצר – בלי ציונים, רק אילו נושאים נסגרו',
        ],
        en: [
          'A 12th grader fails a vectors question on a class test and photographs it that evening',
          'Tags "misread the question"; the app detects: vectors, dot product',
          'Next day she gets a twin with different wording, solves it correctly and compares with the full solution',
          'A week later the third twin is solved correctly and the mistake is marked "closed"',
          'A week before the bagrut she takes a personal test of 12 questions from the remaining weak spots',
          'Her mother receives a short weekly report – no grades, only which topics were closed',
        ],
      },
      uxDirection: {
        he: 'כמו מחברת ולא כמו אפליקציית חידונים: רקע בהיר, פונט קריא לנוסחאות, בלי קונפטי ובלי סטרייקים צעקניים. הרגע החשוב הוא "נסגרה" – אנימציה קטנה של שורה שנמחקת במחברת. בפסיכומטרי פס הזמן נשאר עדין בכוונה כדי לאמן קצב בלי להלחיץ. עברית כברירת מחדל, עם תמיכה מלאה בנוסחאות משמאל לימין בתוך טקסט מימין לשמאל.',
        en: 'Like a notebook, not a quiz app: light background, a formula-friendly typeface, no confetti and no loud streaks. The key moment is "closed" – a small animation of a line being struck through in the notebook. In psychometric mode the time bar stays deliberately subtle to train pace without stress. Hebrew by default, with full support for left-to-right formulas inside right-to-left text.',
      },
      architecture: {
        he: 'Expo עם expo-camera וחיתוך דף, Reanimated לאנימציות המחברת ו-expo-notifications לתזכורות התאומות. Supabase לאימות, למחברת ולמאגר המיומנויות. Edge Function מריצה מודל ראייה שמחלץ את טקסט השאלה ומסווג אותה למיומנות מתוך רשימה סגורה של תוכנית הלימודים. שאלות תאומות מגיעות ממאגר מתויג שנכתב על ידי מורים; מודל שפה משמש רק לווריאציות של מספרים וניסוח בתבניות שאומתו מראש, ולא ליצירת שאלות חופשית. תזמון החזרות הוא אלגוריתם מרווחים פשוט במכשיר.',
        en: 'Expo with expo-camera and page cropping, Reanimated for the notebook animations and expo-notifications for twin reminders. Supabase for auth, the notebook and the skills bank. An Edge Function runs a vision model that extracts the question text and classifies it into a skill from a closed syllabus list. Twin questions come from a teacher-written tagged bank; a language model is used only for number and wording variations on pre-verified templates, never for free question generation. Spacing is a simple interval algorithm on device.',
      },
      stack: ['Expo', 'expo-camera', 'expo-notifications', 'Reanimated', 'Supabase', 'Supabase Edge Functions', 'Anthropic or OpenAI vision API'],
      database: {
        he: ['profiles – תלמיד, מסלול (בגרות/פסיכומטרי), תאריכי מבחנים', 'skills – מיומנות, נושא, מקצוע, פרק בתוכנית הלימודים', 'mistakes – טעות, תמונה, סיבה, מיומנות, סטטוס פתוחה/נסגרה', 'templates – תבניות שאלות תאומות לכל מיומנות עם פתרון', 'attempts – ניסיון, תאומה, נכון/שגוי, זמן פתרון', 'reports – דוחות שבועיים שאושרו לשיתוף'],
        en: ['profiles – student, track (bagrut/psychometric), exam dates', 'skills – skill, topic, subject, syllabus chapter', 'mistakes – mistake, photo, cause, skill, open/closed status', 'templates – twin question templates per skill with a solution', 'attempts – attempt, twin, correct/incorrect, solve time', 'reports – weekly reports approved for sharing'],
      },
      auth: {
        he: 'כניסה עם Apple, Google או טלפון. חלק גדול מהמשתמשים קטינים, לכן הפרופיל פרטי כברירת מחדל, אין פיד ואין צ׳אט, ושיתוף דוח להורה מופעל רק על ידי התלמיד. תמונות הטעויות נשמרות ב-Storage פרטי עם RLS לפי משתמש.',
        en: 'Sign-in with Apple, Google or phone. Many users are minors, so profiles are private by default, there is no feed and no chat, and sharing a report with a parent is enabled only by the student. Mistake photos live in private Storage with per-user RLS.',
      },
      monetization: {
        he: ['חינם: מחברת טעויות ללא הגבלה ושאלה תאומה אחת ביום', 'מנוי לעונת מבחנים: תאומות ללא הגבלה, מבחן אישי ואימון קצב', 'חבילה למורים פרטיים: מעקב אחרי כמה תלמידים ומאגר תבניות משלהם'],
        en: ['Free: unlimited error notebook and one twin question a day', 'Exam-season subscription: unlimited twins, personal test and pacing drills', 'A tutor plan: follow several students and keep a template bank of their own'],
      },
      mvpMilestones: {
        he: ['צילום, חיתוך ותיוג סיבה עם שמירה במחברת', 'זיהוי מיומנות ממודל ראייה עם אישור ידני', 'מאגר תבניות ל-30 מיומנויות במתמטיקה 4–5 יח״ל', 'תזמון תאומות ותזכורות', 'דוח שבועי להורה או למורה פרטי שהתלמיד מפעיל ומכבה', 'מבחן אישי ומסך מנוי'],
        en: ['Capture, crop and cause tagging saved to the notebook', 'Skill detection from a vision model with manual confirmation', 'A template bank for 30 skills in 4–5 unit maths', 'Twin scheduling and reminders', 'Weekly parent or tutor report that the student switches on and off', 'Personal test and subscription screen'],
      },
      risks: {
        he: ['שאלה תאומה עם פתרון שגוי הורסת אמון – לכן תבניות נכתבות ונבדקות על ידי מורים, ומודל השפה לא מחבר שאלות בעצמו', 'זכויות השימוש בשאלות ממבחנים רשמיים דורשות בדיקה – המוצר מתחיל מצילומים של התלמיד עצמו ומתבניות מקוריות', 'עונתיות חזקה: רוב השימוש בחודשים שלפני המועדים, והמנוי צריך להיות מתומחר לעונה ולא לשנה'],
        en: ['A twin question with a wrong solution destroys trust – templates are therefore written and checked by teachers, and the language model never composes questions on its own', 'Usage rights for questions from official exams need checking – the product starts from the student’s own photos and original templates', 'Strong seasonality: most use happens in the months before exam dates, so the subscription must be priced per season, not per year'],
      },
      expansion: {
        he: ['הרחבה לפיזיקה, לכימיה ולאנגלית עם מאגרי תבניות ייעודיים', 'מצב כיתתי: מורה רואה אילו טעויות חוזרות אצל רוב התלמידים', 'ייבוא סימולציות מלאות של פסיכומטרי כדי לתפוס טעויות אוטומטית'],
        en: ['Expansion to physics, chemistry and English with dedicated template banks', 'Class mode: a teacher sees which mistakes recur across most students', 'Import full psychometric simulations to capture mistakes automatically'],
      },
    },
  },
  {
    id: 'chorus',
    name: { he: 'Chorus – מדברים ביחד עם הדובר', en: 'Chorus' },
    tagline: {
      he: 'לומדים להישמע מקומיים בשיטת השאדואינג: מדברים יחד עם קטע אמיתי, ורואים את המנגינה והקצב שלכם מונחים על אלה של הדובר – הנגנה, לא רק אוצר מילים.',
      en: 'Learn to sound local with shadowing: speak along with a real clip and see your melody and rhythm laid over the speaker’s – intonation, not just vocabulary.',
    },
    category: 'education',
    secondaryCategories: ['ai', 'lifestyle'],
    difficulty: 'advanced',
    effort: { weeksMin: 10, weeksMax: 14 },
    budget: 'low',
    businessModel: 'subscription',
    platforms: ['ios', 'android'],
    audience: ['consumers', 'students'],
    tags: ['language learning', 'shadowing', 'pronunciation', 'intonation', 'english', 'hebrew', 'speech', 'audio'],
    identity: { hue: 300, glyph: 'Ch', pattern: 'wave' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: true, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Chorus מתמקדת בדבר שגורם לאנשים להישמע "זרים" גם כשהדקדוק שלהם מושלם: המנגינה של השפה – איפה עולים, איפה יורדים, איפה מאריכים הברה ואיפה ממהרים. השיטה היא שאדואינג: הלומד מדבר בו-זמנית עם קטע קצר של דובר אמיתי – ראיון, פודקאסט, שיחה ברחוב – ולא אחריו. אחרי כל ניסיון האפליקציה מציירת את קו הגובה ואת הקצב שלו מעל אלה של הדובר, ומסמנת איפה הוא "נפל מהמנגינה": הטעמה שהוחמצה, הברה שנבלעה, משפט שנגמר בעלייה במקום בירידה. הקטעים מתחילים במהירות 0.7 ומאיצים עד למהירות טבעית, ו"ציון המקהלה" מודד קצב והנגנה ולא נכונות מילים. שתי השפות הראשונות: אנגלית לדוברי עברית, ועברית מדוברת – לא של ספרי הלימוד – לעולים חדשים.',
        en: 'Chorus targets what makes people sound "foreign" even with perfect grammar: the melody of the language – where the voice rises and falls, which syllable stretches and which rushes. The method is shadowing: the learner speaks simultaneously with a short clip of a real speaker – an interview, a podcast, a street conversation – not after it. After every take the app draws the learner’s pitch line and rhythm over the speaker’s and marks where they "fell off the tune": a missed stress, a swallowed syllable, a sentence that ended on a rise instead of a fall. Clips start at 0.7 speed and build up to natural pace, and the "chorus score" measures rhythm and intonation, not word correctness. The first two languages: English for Hebrew speakers, and spoken Israeli Hebrew – not the textbook kind – for new immigrants.',
      },
      problem: {
        he: 'אפליקציות שפה מתרגלות מילים ומשפטים, אבל מי שלמד בהן עדיין נשמע כמו תרגום: הדגשים במקום הלא נכון, קצב מונוטוני, ומשפטים שנגמרים בעלייה. מורים פרטיים מתקנים את זה, אבל ביוקר ובשיעור אחד בשבוע. ולעולים, העברית של האולפן רחוקה מאוד מזו שמדברים בסופר.',
        en: 'Language apps drill words and sentences, but people who learned with them still sound like a translation: stress in the wrong place, a flat rhythm, sentences ending on a rise. Private teachers fix this, but expensively and one lesson a week. And for immigrants, ulpan Hebrew is a long way from what is spoken at the supermarket.',
      },
      solution: {
        he: 'שאדואינג על קטעים אמיתיים, עם שכבת-על חזותית של גובה וקצב שמראה בדיוק איפה הלומד סוטה מהדובר, והדרגה במהירות. הציון מודד הנגנה וקצב ולא נכונות מילים, ולכן אפשר להתאמן על קטע של 15 שניות עשר פעמים ולראות שיפור ממשי.',
        en: 'Shadowing over real clips, with a visual overlay of pitch and rhythm that shows exactly where the learner drifts from the speaker, and graded speed. The score measures intonation and rhythm rather than word correctness, so a 15-second clip can be practised ten times with visible improvement.',
      },
      usp: {
        he: 'ההבדל הוא מה נמדד: לא "האם אמרת את המילה נכון" אלא "האם המנגינה שלך דומה למנגינה של הדובר". קטעים של דוברים אמיתיים במקום הקלטות אולפן, ועברית מדוברת כשפת יעד ולא רק כשפת ממשק.',
        en: 'The difference is what gets measured: not "did you say the word correctly" but "does your melody match the speaker’s". Real speakers instead of studio recordings, and spoken Hebrew as a target language, not just an interface language.',
      },
      targetUsers: {
        he: ['דוברי עברית שמדברים אנגלית שוטפת אבל נשמעים זרים בפגישות', 'עולים חדשים שסיימו אולפן ורוצים להישמע ישראלים', 'סטודנטים לפני ראיון או הרצאה באנגלית', 'שחקנים ויוצרי תוכן שעובדים על מבטא'],
        en: ['Hebrew speakers fluent in English who still sound foreign in meetings', 'New immigrants who finished ulpan and want to sound Israeli', 'Students ahead of an interview or a talk in English', 'Actors and content creators working on an accent'],
      },
      coreFeatures: {
        he: [
          'ספריית קטעים של 10–30 שניות מדוברים אמיתיים, עם תמלול ותרגום',
          'מצב שאדואינג: מדברים בו-זמנית עם הקטע ולא אחריו',
          'שכבת-על של גובה וקצב: הקו שלך מעל הקו של הדובר',
          'סימון נקודות סטייה: הטעמה שהוחמצה, הברה שנבלעה, סיום שגוי',
          'מדרגות מהירות מ-0.7 עד מהירות טבעית',
          'ציון מקהלה להנגנה ולקצב, עם היסטוריה לכל קטע',
          'מסלולים לפי מצב: פגישת עבודה, שיחת חולין, שירות לקוחות',
        ],
        en: [
          'A library of 10–30 second clips from real speakers, with transcript and translation',
          'Shadowing mode: speak simultaneously with the clip, not after it',
          'A pitch and rhythm overlay: your line over the speaker’s',
          'Drift markers: missed stress, swallowed syllable, wrong sentence ending',
          'Speed steps from 0.7 up to natural pace',
          'A chorus score for intonation and rhythm, with history per clip',
          'Tracks by situation: work meeting, small talk, customer service',
        ],
      },
      screens: [
        { name: { he: 'היום', en: 'Today' }, description: { he: 'קטע היום לפי המסלול שנבחר, הקטע האחרון שהתאמנתם עליו וציון המקהלה השבועי.', en: 'Today’s clip from the chosen track, the last clip practised and this week’s chorus score.' } },
        { name: { he: 'ספריית קטעים', en: 'Clip library' }, description: { he: 'קטעים לפי מצב, מבטא ורמת מהירות, עם תצוגה מקדימה של הגל והתמלול.', en: 'Clips by situation, accent and speed level, with a waveform preview and the transcript.' } },
        { name: { he: 'האזנה', en: 'Listen' }, description: { he: 'הקטע עם התמלול מודגש מילה-מילה וקו ההנגנה של הדובר, לפני שמדברים.', en: 'The clip with the transcript highlighted word by word and the speaker’s intonation line, before speaking.' } },
        { name: { he: 'שאדואינג', en: 'Shadow' }, description: { he: 'ספירה לאחור, הקטע מתנגן באוזניות והלומד מדבר יחד איתו; המסך מציג רק את התמלול הזורם.', en: 'A countdown, the clip plays in the earphones and the learner speaks along; the screen shows only the flowing transcript.' } },
        { name: { he: 'שכבת-על', en: 'Overlay' }, description: { he: 'שני קווי גובה זה על זה, פסי קצב, ונקודות סטייה שאפשר ללחוץ עליהן כדי לשמוע את שתי הגרסאות.', en: 'Two pitch lines on top of each other, rhythm bars, and drift points that can be tapped to hear both versions.' } },
        { name: { he: 'התקדמות', en: 'Progress' }, description: { he: 'ציון מקהלה לאורך זמן, הקטעים שנסגרו במהירות טבעית, ודפוסי סטייה חוזרים.', en: 'Chorus score over time, clips completed at natural speed, and recurring drift patterns.' } },
      ],
      userJourney: {
        he: [
          'מנהלת מוצר ישראלית בוחרת את מסלול "פגישת עבודה באנגלית"',
          'מאזינה לקטע של 15 שניות מראיון אמיתי ורואה את קו ההנגנה של הדוברת',
          'מדברת יחד איתו במהירות 0.7 ומקבלת שכבת-על: שתי הטעמות הוחמצו והמשפט נגמר בעלייה',
          'לוחצת על נקודת סטייה, שומעת את עצמה מול הדוברת, ומנסה שוב',
          'אחרי שישה ניסיונות הקטע נסגר במהירות טבעית וציון המקהלה קופץ',
          'בשבוע הבא היא רואה שדפוס "עלייה בסוף משפט" כמעט נעלם',
        ],
        en: [
          'An Israeli product manager picks the "work meeting in English" track',
          'Listens to a 15-second clip from a real interview and sees the speaker’s intonation line',
          'Speaks along at 0.7 speed and gets the overlay: two stresses missed and the sentence ended on a rise',
          'Taps a drift point, hears herself against the speaker, and tries again',
          'After six takes the clip is completed at natural speed and the chorus score jumps',
          'The following week she sees the "rise at sentence end" pattern has almost disappeared',
        ],
      },
      uxDirection: {
        he: 'מסך השאדואינג כמעט ריק – רק תמלול זורם, כי כל גרפיקה מסיחה את הדעת מההקשבה. המידע החזותי כולו נשמר למסך שכבת-העל: שני קווים צבעוניים, אחד לדובר ואחד ללומד, שמתקרבים זה לזה ככל שמשתפרים. ניסוח הפידבק הוא על צליל ולא על "טעויות", כי מבטא הוא נושא רגיש.',
        en: 'The shadowing screen is almost empty – only a flowing transcript, since any graphic distracts from listening. All the visual information is saved for the overlay screen: two coloured lines, one for the speaker and one for the learner, that move closer as the learner improves. Feedback is phrased about sound, never about "mistakes", because accent is a sensitive subject.',
      },
      architecture: {
        he: 'Expo עם expo-audio להשמעה ולהקלטה בו-זמנית באוזניות, ו-Skia לציור קווי ההנגנה. ההקלטה נשמרת כ-WAV ומעובדת במכשיר אחרי כל ניסיון: זיהוי גובה באלגוריתם YIN, מעטפת אנרגיה להברות, ויישור לדובר בעזרת DTW; כל זה רץ במודול Expo קטן בקוד נייטיב כדי לא לחסום את ה-JS. קווי ההנגנה של הדוברים מחושבים מראש בצד השרת. Supabase לאימות, לקטעים ולהיסטוריה, ו-Storage לקובצי האודיו. בלי מודל שפה בלולאה המרכזית – רק לתרגום התמלולים.',
        en: 'Expo with expo-audio for simultaneous playback and recording through earphones, and Skia for drawing the intonation lines. The recording is saved as WAV and processed on device after every take: pitch tracking with the YIN algorithm, an energy envelope for syllables, and alignment to the speaker with DTW; all of it runs in a small native Expo module so the JS thread is never blocked. Speaker intonation lines are precomputed server-side. Supabase for auth, clips and history, and Storage for the audio files. No language model in the core loop – only for translating transcripts.',
      },
      stack: ['Expo', 'expo-audio', 'Expo Modules API', 'React Native Skia', 'Supabase', 'Supabase Storage', 'Python'],
      database: {
        he: ['profiles – משתמש, שפת אם, שפת יעד, מסלול', 'clips – קטע, שפה, מבטא, מצב, תמלול, תרגום, קו הנגנה מחושב', 'takes – ניסיון, קטע, מהירות, קובץ אודיו, ציון מקהלה', 'drifts – נקודות סטייה לכל ניסיון: סוג, זמן, חומרה', 'tracks – מסלולים לפי מצב עם סדר הקטעים', 'licenses – מקור הקטע ותנאי השימוש בו'],
        en: ['profiles – user, native language, target language, track', 'clips – clip, language, accent, situation, transcript, translation, precomputed intonation line', 'takes – take, clip, speed, audio file, chorus score', 'drifts – drift points per take: type, time, severity', 'tracks – situation tracks with clip order', 'licenses – the clip’s source and its usage terms'],
      },
      auth: {
        he: 'כניסה עם Apple או Google. הקלטות קול עלולות להיחשב מידע ביומטרי – הן נשמרות ב-Storage פרטי עם RLS, נמחקות לפי בקשה בלחיצה אחת, ולא משמשות לאימון מודלים.',
        en: 'Apple or Google sign-in. Voice recordings may count as biometric data – they are stored in private Storage with RLS, deletable on request with one tap, and never used to train models.',
      },
      monetization: {
        he: ['שבוע ניסיון ואז מנוי חודשי או שנתי', 'מסלולים מקצועיים בתשלום נפרד: רפואה, היי-טק, שירות לקוחות', 'חבילה לארגונים שקולטים עובדים מחו״ל או עולים'],
        en: ['A free trial week, then a monthly or annual subscription', 'Professional tracks sold separately: medicine, tech, customer service', 'A plan for organisations onboarding employees from abroad or new immigrants'],
      },
      mvpMilestones: {
        he: ['השמעה והקלטה בו-זמנית עם WAV תקין בשתי הפלטפורמות', 'מודול נייטיב לזיהוי גובה ולמעטפת אנרגיה', 'יישור DTW ושכבת-על של שני קווים', 'סימון נקודות סטייה וציון מקהלה', '40 קטעים באנגלית ו-40 בעברית מדוברת עם רישיון מסודר', 'מדרגות מהירות, התקדמות ומסך מנוי'],
        en: ['Simultaneous playback and recording with valid WAV on both platforms', 'A native module for pitch tracking and energy envelope', 'DTW alignment and a two-line overlay', 'Drift markers and the chorus score', '40 English and 40 spoken-Hebrew clips with proper licensing', 'Speed steps, progress and subscription screen'],
      },
      risks: {
        he: ['זיהוי גובה ברעש רקע או באוזניות זולות עלול להיות רועש – לדרוש אוזניות בהתחלה ולהציג רמת ביטחון של הניתוח', 'עדיין לא הוכח שציון מקהלה גבוה מתורגם לדיבור טבעי יותר מחוץ לאפליקציה – זה החלק הניסויי ביותר, וצריך לבדוק אותו עם מאמני מבטא', 'זכויות על קטעים של דוברים אמיתיים – להתחיל מפודקאסטים ברישיון פתוח ומהקלטות שהוזמנו במיוחד'],
        en: ['Pitch tracking in background noise or with cheap earphones can be noisy – require earphones at first and show a confidence level for the analysis', 'It is unproven that a higher chorus score translates into more natural speech outside the app – this is the most experimental part and needs testing with accent coaches', 'Rights to clips of real speakers – start from openly licensed podcasts and specially commissioned recordings'],
      },
      expansion: {
        he: ['שפות נוספות שבהן ההנגנה קריטית: רוסית, ערבית, צרפתית', 'קטעים מהחיים של הלומד: הקלטה של עמית או חבר שמסכים לשמש כדובר', 'מצב דיאלוג שבו הלומד משיב לדובר ולא רק חוזר אחריו'],
        en: ['More languages where intonation is critical: Russian, Arabic, French', 'Clips from the learner’s own life: a recording of a colleague or friend who agrees to be the speaker', 'A dialogue mode where the learner answers the speaker instead of echoing them'],
      },
    },
  },
  {
    id: 'fieldwork',
    name: { he: 'Fieldwork – משימת צילום להיום', en: 'Fieldwork' },
    tagline: {
      he: 'לומדים לצלם מצילום ולא מצפייה: משימה יומית שמותאמת לאור שיש לכם עכשיו, ופידבק על התמונה האמיתית שלכם מתוך נתוני הקובץ עצמו.',
      en: 'Learn photography by shooting, not watching: a daily assignment for the light you have right now, and feedback on your real photo read from the file itself.',
    },
    category: 'education',
    secondaryCategories: ['creativity', 'lifestyle'],
    difficulty: 'intermediate',
    effort: { weeksMin: 5, weeksMax: 7 },
    budget: 'low',
    businessModel: 'one-time',
    platforms: ['ios', 'android'],
    audience: ['consumers', 'creators'],
    tags: ['photography', 'learn by doing', 'assignments', 'exif', 'camera', 'hobby', 'adults', 'feedback'],
    identity: { hue: 45, glyph: 'Fw', pattern: 'dots' },
    flags: { beginnerFriendly: false, profitPotential: 'medium', experimental: false, trending: false, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Fieldwork מיועדת למבוגרים שקנו מצלמה (או שיש להם טלפון טוב) וצפו בעשרות סרטוני הדרכה בלי שהיד שלהם למדה משהו. במקום קורס, האפליקציה נותנת כל יום משימה אחת שמתאימה לתנאים הנוכחיים – שעת השקיעה במיקום שלכם, מזג האוויר והציוד שהגדרתם: "בעוד 40 דקות שעת זהב: פורטרט עם אור אחורי בחשיפה ידנית", או "ערב גשום בבית: חפץ אחד באור חלון יחיד". המשתמש מצלם ומעלה את הקובץ, והפידבק מגיע בשתי שכבות: קודם נתוני הקובץ עצמו – מהירות תריס, צמצם, ISO, אורך מוקד – שנבדקים מול המשימה ("1/60 ביד ב-200 מ״מ – סיכון לטשטוש תנועה"), ואחריהם הערות קומפוזיציה ממודל ראייה. כל משימה מתרגלת החלטה אחת, והמסלול בונה אותן זו על גבי זו.',
        en: 'Fieldwork is for adults who bought a camera (or own a good phone) and watched dozens of tutorials without their hands learning anything. Instead of a course, the app gives one assignment a day that fits the current conditions – sunset time at your location, the weather and the gear you set up: "golden hour in 40 minutes: a backlit portrait on manual exposure", or "rainy evening at home: a single object in window light". The user shoots and uploads the file, and feedback comes in two layers: first the file’s own data – shutter speed, aperture, ISO, focal length – checked against the assignment ("1/60 handheld at 200 mm – motion blur risk"), then composition notes from a vision model. Each assignment practises one decision, and the path stacks them one on top of another.',
      },
      problem: {
        he: 'הרבה אנשים לומדים צילום פסיבית – סרטונים, מאמרים, קבוצות – ואז יוצאים לצלם ומגלים שהם לא זוכרים כלום. קורסים נותנים ידע בלי תרגול בתנאים אמיתיים, ופידבק בקבוצות הוא "יפה!" או ביקורת לא מנומקת שלא אומרת מה לשנות בהגדרות.',
        en: 'Many people learn photography passively – videos, articles, groups – then go out to shoot and find they remember nothing. Courses give knowledge without practice in real conditions, and feedback in groups is either "nice!" or unexplained criticism that never says which setting to change.',
      },
      solution: {
        he: 'משימה יומית אחת שנגזרת מהתנאים האמיתיים של המשתמש, פידבק שמתחיל מנתוני הקובץ ולכן תמיד מנומק ("ה-ISO היה 3200 כשהיה מקום לפתוח צמצם"), ומסלול שבו כל משימה מתרגלת החלטה אחת שנבנית על הקודמת.',
        en: 'One daily assignment derived from the user’s real conditions, feedback that starts from the file data and is therefore always explainable ("ISO was 3200 when there was room to open the aperture"), and a path where each assignment practises one decision that builds on the previous one.',
      },
      usp: {
        he: 'שכבת הפידבק הראשונה היא עובדתית ולא עניין של טעם: היא נקראת מנתוני הקובץ ומושווית למשימה, ולכן המשתמש תמיד יודע איזו הגדרה לשנות. והמשימות נולדות מהשעה, מהמיקום וממזג האוויר, אז "אין לי מה לצלם" מפסיק להיות תירוץ.',
        en: 'The first layer of feedback is factual, not taste: it is read from the file data and compared with the assignment, so the user always knows which setting to change. And assignments are born from the time, the location and the weather, so "there is nothing to shoot" stops being an excuse.',
      },
      targetUsers: {
        he: ['מבוגרים שקנו מצלמה ראשונה ונתקעו במצב אוטומטי', 'צלמי טלפון שרוצים להבין אור וקומפוזיציה', 'הורים שמצלמים את הילדים ורוצים תוצאות עקביות', 'מי שמתכנן טיול גדול ורוצה להגיע אליו מוכן עם המצלמה'],
        en: ['Adults who bought a first camera and got stuck in auto mode', 'Phone photographers who want to understand light and composition', 'Parents photographing their kids who want consistent results', 'Anyone planning a big trip who wants to arrive camera-ready'],
      },
      coreFeatures: {
        he: [
          'משימה יומית שנגזרת משעת השקיעה, ממזג האוויר ומהציוד שהגדרתם',
          'מסלולים של החלטה אחת ליום: חשיפה, אור, קומפוזיציה, תנועה',
          'בדיקת נתוני הקובץ מול המשימה עם הסבר מה לשנות',
          'הערות קומפוזיציה ממודל ראייה, תמיד אחרי הבדיקה העובדתית',
          'השוואת "לפני/אחרי": אותה משימה שבוע מאוחר יותר',
          'תזכורת חכמה: "שעת זהב בעוד 40 דקות" רק בימים שבהם זה אפשרי',
          'יומן שדה עם כל המשימות, הצילומים והלקחים',
        ],
        en: [
          'A daily assignment derived from sunset time, weather and the gear you set up',
          'One-decision-a-day paths: exposure, light, composition, motion',
          'File-data check against the assignment with an explanation of what to change',
          'Composition notes from a vision model, always after the factual check',
          'A "before/after" comparison: the same assignment a week later',
          'A smart nudge: "golden hour in 40 minutes" only on days when it is possible',
          'A field journal with every assignment, photo and lesson',
        ],
      },
      screens: [
        { name: { he: 'המשימה של היום', en: 'Today’s assignment' }, description: { he: 'כרטיס אחד גדול: מה לצלם, באילו תנאים, איזו החלטה מתרגלים, וחלון הזמן שבו זה אפשרי.', en: 'One big card: what to shoot, in which conditions, which decision is practised, and the time window when it is possible.' } },
        { name: { he: 'הגדרת ציוד', en: 'Gear setup' }, description: { he: 'בחירת מצלמה או טלפון, עדשות זמינות ורמת ניסיון, כדי שהמשימות יתאימו למה שיש.', en: 'Pick camera or phone, available lenses and experience level, so assignments fit what you own.' } },
        { name: { he: 'העלאה', en: 'Upload' }, description: { he: 'בחירת הצילום מהגלריה, תצוגה של נתוני הקובץ שנקראו, ואישור שזה הצילום להגשה.', en: 'Pick the photo from the gallery, a readout of the file data that was read, and confirmation that this is the submission.' } },
        { name: { he: 'פידבק', en: 'Feedback' }, description: { he: 'קודם שורת העובדות מנתוני הקובץ בירוק/כתום, אחריה שלוש הערות קומפוזיציה, ולבסוף "לנסות מחר".', en: 'First the facts row from the file data in green/amber, then three composition notes, and finally "try tomorrow".' } },
        { name: { he: 'מסלולים', en: 'Paths' }, description: { he: 'רשימת מסלולים לפי החלטה, עם התקדמות וההחלטה שנפתחת בהמשך.', en: 'Paths listed by decision, with progress and the decision that unlocks next.' } },
        { name: { he: 'יומן שדה', en: 'Field journal' }, description: { he: 'גריד של כל ההגשות עם ההגדרות שנבחרו, ו"לפני/אחרי" לכל משימה שחזרה.', en: 'A grid of every submission with the chosen settings, and "before/after" for every repeated assignment.' } },
      ],
      userJourney: {
        he: [
          'המשתמש מגדיר מצלמה ללא מראה עם עדשת 50 מ״מ ורמה "מתחיל"',
          'ב-16:10 מגיעה הודעה: שעת זהב בעוד 40 דקות, משימה: פורטרט עם אור אחורי',
          'מצלם את בת הזוג בגינה ומעלה את הקובץ',
          'הפידבק: צמצם 1.8 בסדר, ISO 100 בסדר, אבל 1/4000 – חשיפת חסר; "לפתוח בשני סטופים"',
          'מודל הראייה מעיר שהפנים בצל ושאפשר לחתוך את העץ בצד',
          'שבוע אחר כך אותה משימה חוזרת, וביומן השדה שתי התמונות זו לצד זו',
        ],
        en: [
          'The user sets up a mirrorless camera with a 50 mm lens and the "beginner" level',
          'At 16:10 a notification arrives: golden hour in 40 minutes, assignment: a backlit portrait',
          'Photographs his partner in the garden and uploads the file',
          'The feedback: f/1.8 fine, ISO 100 fine, but 1/4000 – underexposed; "open up by two stops"',
          'The vision model notes the face is in shadow and the tree on the side could be cropped',
          'A week later the same assignment returns, and the field journal shows both photos side by side',
        ],
      },
      uxDirection: {
        he: 'כמו מחברת של צלם ולא כמו רשת חברתית: אין לייקים, אין פיד, אין השוואה לאחרים. המסך המרכזי הוא כרטיס משימה אחד עם טיפוגרפיה גדולה וחלון זמן בולט. מסך הפידבק מפריד חזותית בין עובדות (שורות קצרות בירוק/כתום) לבין טעם (טקסט רגיל), כדי שהמשתמש ידע מה ודאי ומה הצעה.',
        en: 'A photographer’s notebook, not a social network: no likes, no feed, no comparison with others. The hero screen is one assignment card with large type and a prominent time window. The feedback screen visually separates facts (short rows in green/amber) from taste (regular text), so the user knows what is certain and what is a suggestion.',
      },
      architecture: {
        he: 'Expo עם expo-image-picker ו-expo-media-library לקריאת הצילום ונתוני ה-EXIF שלו במכשיר, expo-location לחישוב שעת השקיעה (נוסחה מקומית, בלי API) ו-expo-notifications לתזכורות. מזג אוויר מ-API חינמי פעם ביום. בדיקת הנתונים מול המשימה היא כללים דטרמיניסטיים בקוד. התמונה נשלחת ל-Edge Function רק להערות קומפוזיציה, בגרסה מוקטנת. Supabase לאימות, למשימות ולהגשות; הקבצים המלאים נשארים במכשיר.',
        en: 'Expo with expo-image-picker and expo-media-library to read the photo and its EXIF data on device, expo-location to compute sunset time (a local formula, no API) and expo-notifications for nudges. Weather from a free API once a day. The data check against the assignment is deterministic rules in code. The image goes to an Edge Function only for composition notes, downscaled. Supabase for auth, assignments and submissions; full-size files stay on the device.',
      },
      stack: ['Expo', 'expo-image-picker', 'expo-media-library', 'expo-location', 'expo-notifications', 'Supabase', 'Supabase Edge Functions', 'Anthropic or OpenAI vision API', 'RevenueCat'],
      database: {
        he: ['profiles – משתמש, ציוד, רמה, מיקום משוער', 'assignments – משימה, החלטה מתורגלת, תנאים נדרשים, כללי בדיקה', 'paths – מסלולים וסדר המשימות בהם', 'submissions – הגשה, משימה, נתוני EXIF, תוצאות הבדיקה, הערות', 'journal – לקחים שהמשתמש כתב לעצמו לכל הגשה'],
        en: ['profiles – user, gear, level, approximate location', 'assignments – assignment, practised decision, required conditions, check rules', 'paths – paths and the order of assignments in them', 'submissions – submission, assignment, EXIF data, check results, notes', 'journal – lessons the user wrote to themselves per submission'],
      },
      auth: {
        he: 'כניסה עם Apple או Google, ואפשרות להתחיל בלי חשבון עם שמירה מקומית. המיקום נשמר ברמת עיר בלבד לחישוב השקיעה, והתמונות המלאות לא עוזבות את המכשיר – רק גרסה מוקטנת נשלחת לניתוח.',
        en: 'Apple or Google sign-in, with a no-account start that stores locally. Location is kept at city level only for sunset calculation, and full-size photos never leave the device – only a downscaled copy is sent for analysis.',
      },
      monetization: {
        he: ['רכישה חד-פעמית של מסלול "יסודות" אחרי שבוע ניסיון', 'מסלולים נוספים ברכישה נפרדת: פורטרט, רחוב, נוף, אור מלאכותי', 'מהדורה לחנויות צילום ולסדנאות כמתנה לרוכשי מצלמה'],
        en: ['One-time purchase of the "foundations" path after a trial week', 'Additional paths sold separately: portrait, street, landscape, artificial light', 'An edition for camera shops and workshops as a gift to camera buyers'],
      },
      mvpMilestones: {
        he: ['קריאת EXIF ובדיקה דטרמיניסטית מול 20 משימות יסוד', 'משימה יומית לפי שעת שקיעה ומזג אוויר', 'מסך פידבק עם הפרדה בין עובדות לטעם', 'הערות קומפוזיציה ממודל ראייה', 'יומן שדה והשוואת לפני/אחרי', 'רכישה חד-פעמית'],
        en: ['EXIF reading and a deterministic check against 20 foundation assignments', 'Daily assignment by sunset time and weather', 'Feedback screen separating facts from taste', 'Composition notes from a vision model', 'Field journal and before/after comparison', 'One-time purchase'],
      },
      risks: {
        he: ['צילומי טלפון מגיעים לעיתים עם EXIF חלקי או אחרי עיבוד אוטומטי – צריך משימות שמתאימות גם לטלפון ולהסביר כשנתון חסר', 'הערות קומפוזיציה ממודל יכולות להיות גנריות – להגביל אותן לשלוש, לקשור אותן למשימה ולהציג אותן כהצעה', 'מחיר חד-פעמי מול עלות ניתוח תמונה – להגביל להגשה אחת ליום ולשלוח תמונה מוקטנת בלבד'],
        en: ['Phone photos often arrive with partial EXIF or after automatic processing – assignments must suit phones too and explain when a value is missing', 'Composition notes from a model can be generic – cap them at three, tie them to the assignment and present them as a suggestion', 'A one-time price against per-image analysis cost – limit to one submission a day and send a downscaled image only'],
      },
      expansion: {
        he: ['משימות לפי מקום: מסלול צילום לעיר שאתם מבקרים בה', 'מצב זוגי: שני אנשים מקבלים אותה משימה ומשווים', 'מסלול וידאו קצר עם בדיקת קצב פריימים ומהירות תריס'],
        en: ['Place-based assignments: a photo walk for the city you are visiting', 'A duo mode: two people get the same assignment and compare', 'A short-video path checking frame rate and shutter speed'],
      },
    },
  },
  {
    id: 'ballpark',
    name: { he: 'Ballpark – בערך כמה?', en: 'Ballpark' },
    tagline: {
      he: 'חמש שאלות הערכה ביום, עם ניקוד לפי כמה קרובים הייתם בסדר הגודל – לא לפי ידע טריוויה – ופירוק שמראה איך היה אפשר להגיע לתשובה בהיגיון.',
      en: 'Five estimation questions a day, scored by how close your order of magnitude was – not by trivia – with a breakdown of how you could have reasoned it out.',
    },
    category: 'education',
    secondaryCategories: ['games', 'entertainment'],
    difficulty: 'beginner',
    effort: { weeksMin: 1, weeksMax: 3 },
    budget: 'free',
    businessModel: 'free',
    platforms: ['cross-platform'],
    audience: ['consumers', 'students', 'kids'],
    tags: ['estimation', 'numeracy', 'daily quiz', 'fermi', 'game', 'math', 'beginner', 'share'],
    identity: { hue: 150, glyph: 'Bp', pattern: 'ring' },
    flags: { beginnerFriendly: true, profitPotential: 'low', experimental: false, trending: true, featuredWeight: 3 },
    spec: {
      overview: {
        he: 'Ballpark הוא משחק יומי קטן שמלמד מיומנות שבית הספר כמעט לא מלמד: להעריך מספר שאין לכם מושג לגביו. כל יום חמש שאלות – כמה פסנתרים יש בעיר, כמה פעימות לב בחיים, כמה ליטרים בבריכה אולימפית – והשחקן מזין הערכה. הניקוד לא "נכון/לא נכון" אלא לפי המרחק בסדרי גודל: לנחש 800 כשהתשובה 1,000 שווה כמעט את מלוא הנקודות, ולנחש מיליון – אפס. אחרי כל שאלה מוצג פירוק של שלושה-ארבעה צעדים שמראה איך היה אפשר להגיע לתשובה בהיגיון, ובסוף מתקבלת רשת של חמישה ריבועים לשיתוף, כמו במשחקי המילה היומיים. אין חשבון ואין שרת – פרויקט ראשון מושלם שאפשר לשחרר תוך שבועיים-שלושה.',
        en: 'Ballpark is a small daily game that teaches a skill school barely touches: estimating a number you have no idea about. Every day five questions – how many pianos are in the city, how many heartbeats in a lifetime, how many litres in an Olympic pool – and the player enters a guess. Scoring is not right/wrong but distance in orders of magnitude: guessing 800 when the answer is 1,000 earns nearly full points, guessing a million earns zero. After each question a three-to-four-step breakdown shows how the answer could have been reasoned out, and the round ends with a five-square grid to share, in the spirit of daily word games. No account and no server – a perfect first project that can ship within two or three weeks.',
      },
      problem: {
        he: 'הרבה אנשים קופאים מול שאלה כמו "כמה בערך?" ועונים "אין לי מושג", למרות שהערכה בסדרי גודל היא מיומנות נלמדת ושימושית – בראיונות עבודה, בקריאת חדשות עם מספרים ובהחלטות כסף. חידוני טריוויה מתגמלים זיכרון ולא חשיבה, ומי שלא יודע את העובדה פשוט מפסיד.',
        en: 'Many people freeze at a question like "roughly how many?" and answer "no idea", even though order-of-magnitude estimation is a learnable, useful skill – in job interviews, in reading news full of numbers and in money decisions. Trivia quizzes reward memory rather than reasoning, and whoever does not know the fact simply loses.',
      },
      solution: {
        he: 'חמש שאלות ביום עם ניקוד לוגריתמי שמתגמל הערכה סבירה ולא ידיעה מדויקת, פירוק מנומק אחרי כל שאלה שמלמד את שיטת החשיבה, ורשת שיתוף יומית שיוצרת הרגל. הכול במכשיר, בלי חשבון.',
        en: 'Five questions a day with logarithmic scoring that rewards a reasonable estimate rather than exact knowledge, a reasoned breakdown after every question that teaches the method of thinking, and a daily share grid that builds a habit. Everything on device, no account.',
      },
      usp: {
        he: 'הניקוד הוא המוצר: סולם לוגריתמי שבו "קרוב בסדר גודל" מנצח, ופירוק שמלמד שיטה במקום לחשוף עובדה. זה חידון שאפשר להשתפר בו גם בלי לדעת כלום.',
        en: 'The scoring is the product: a logarithmic scale where "close in order of magnitude" wins, and a breakdown that teaches a method instead of revealing a fact. It is a quiz you can get better at without knowing anything.',
      },
      targetUsers: {
        he: ['מי שאוהב משחקי מילה יומיים ורוצה אתגר חדש', 'תלמידים וסטודנטים שמתכוננים לראיונות עם שאלות הערכה', 'הורים שרוצים משחק מספרים קצר עם הילדים', 'מורים למתמטיקה שמחפשים פתיח לשיעור'],
        en: ['Fans of daily word games looking for a new challenge', 'Students preparing for interviews that include estimation questions', 'Parents who want a short numbers game with their kids', 'Maths teachers looking for a lesson opener'],
      },
      coreFeatures: {
        he: [
          'חמש שאלות הערכה חדשות כל יום מתוך מאגר מקומי',
          'ניקוד לוגריתמי: המרחק בסדרי גודל קובע, לא דיוק מוחלט',
          'פירוק של שלושה-ארבעה צעדים לכל תשובה',
          'רשת ריבועים לשיתוף שלא חושפת את השאלות',
          'רצף ימים וסטטיסטיקה אישית: באילו תחומים אתם מעריכים טוב',
          'מצב "כיתה": קוד קצר שמייצר אותן חמש שאלות לכל מי שמזין אותו – בלי שרת',
        ],
        en: [
          'Five new estimation questions a day from a local bank',
          'Logarithmic scoring: distance in orders of magnitude counts, not exact precision',
          'A three-to-four-step breakdown for every answer',
          'A share grid of squares that gives away no questions',
          'Day streak and personal stats: which domains you estimate well',
          'A "class" mode: a short code that yields the same five questions for everyone who enters it – no server',
        ],
      },
      screens: [
        { name: { he: 'היום', en: 'Today' }, description: { he: 'מספר היום, רצף הימים וכפתור התחלה גדול; אם כבר שיחקתם – הרשת של היום וספירה לאחור למחר.', en: 'Today’s number, the streak and a big start button; if already played, today’s grid and a countdown to tomorrow.' } },
        { name: { he: 'שאלה', en: 'Question' }, description: { he: 'השאלה בטיפוגרפיה גדולה, מקלדת מספרית עם כפתורי "×10" ו-"÷10" לכוונון מהיר, ושליחה.', en: 'The question in large type, a numeric keypad with "×10" and "÷10" buttons for quick tuning, and submit.' } },
        { name: { he: 'תוצאה', en: 'Result' }, description: { he: 'סרגל לוגריתמי שמראה את ההערכה שלכם מול התשובה, הנקודות, והפירוק צעד אחר צעד.', en: 'A logarithmic bar showing your estimate against the answer, the points, and the step-by-step breakdown.' } },
        { name: { he: 'סיכום', en: 'Summary' }, description: { he: 'חמשת הריבועים, הניקוד הכולל, כפתור שיתוף, ומה היה התחום החזק של היום.', en: 'The five squares, total score, a share button, and the day’s strongest domain.' } },
        { name: { he: 'סטטיסטיקה', en: 'Stats' }, description: { he: 'רצף, ממוצע נקודות ופירוט לפי תחום: גיאוגרפיה, גוף האדם, כסף, טבע.', en: 'Streak, average score and a breakdown by domain: geography, the human body, money, nature.' } },
        { name: { he: 'מצב כיתה', en: 'Class mode' }, description: { he: 'הזנת קוד או יצירת קוד חדש, והסבר קצר למורה איך להקרין את הסיכום.', en: 'Enter a code or create a new one, with a short explanation for a teacher on projecting the summary.' } },
      ],
      userJourney: {
        he: [
          'המשתמשת פותחת את האפליקציה עם הקפה ולוחצת "התחל"',
          'שאלה ראשונה: כמה פעימות לב בחיים ממוצעים? היא מנחשת 100 מיליון',
          'התוצאה: התשובה בסדר גודל של מיליארדים, 2 נקודות מתוך 10, והפירוק: 70 פעימות בדקה × 60 × 24 × 365 × 80',
          'בשאלה הרביעית היא כבר בונה את החישוב לבד ופוגעת בסדר הגודל',
          'משתפת את רשת הריבועים בקבוצה המשפחתית',
          'למחרת אחיה שולח קוד כיתה כדי שיתחרו על אותן שאלות',
        ],
        en: [
          'The user opens the app with her coffee and taps "start"',
          'First question: how many heartbeats in an average lifetime? She guesses 100 million',
          'The result: the answer is in the billions, 2 points out of 10, and the breakdown: 70 beats a minute × 60 × 24 × 365 × 80',
          'By the fourth question she builds the calculation herself and lands the order of magnitude',
          'Shares the square grid in the family group',
          'Next day her brother sends a class code so they compete on the same questions',
        ],
      },
      uxDirection: {
        he: 'מסך אחד בכל פעם, בלי תפריטים: שאלה, תשובה, תוצאה. טיפוגרפיה ענקית למספרים, צבע אחד לכל תחום, והסרגל הלוגריתמי הוא האנימציה היחידה – הנקודה שלכם מחליקה לכיוון התשובה. הרשת לשיתוף משתמשת באימוג׳י ריבועים כדי שתיראה טוב בכל אפליקציית הודעות.',
        en: 'One screen at a time, no menus: question, answer, result. Huge type for numbers, one colour per domain, and the logarithmic bar is the only animation – your dot slides toward the answer. The share grid uses square emoji so it looks right in any messaging app.',
      },
      architecture: {
        he: 'Expo עם Expo Router, בלי שרת בכלל. מאגר השאלות הוא קובץ JSON אחד בתוך האפליקציה עם שאלה, תשובה, יחידה, תחום ופירוק בשתי השפות; חמש השאלות היומיות נבחרות מהתאריך בעזרת זרע דטרמיניסטי, כך שכולם מקבלים אותן שאלות באותו יום. קוד כיתה הוא פשוט זרע אחר. רצף וסטטיסטיקה נשמרים ב-AsyncStorage, והשיתוף עובר דרך expo-sharing. עדכוני שאלות נשלחים עם EAS Update בלי גרסה חדשה בחנות.',
        en: 'Expo with Expo Router and no server at all. The question bank is a single JSON file inside the app with question, answer, unit, domain and breakdown in both languages; the five daily questions are chosen from the date with a deterministic seed, so everyone gets the same questions on the same day. A class code is simply another seed. Streak and stats are stored in AsyncStorage, and sharing goes through expo-sharing. Question updates ship with EAS Update without a new store release.',
      },
      stack: ['Expo', 'Expo Router', 'AsyncStorage', 'expo-sharing', 'EAS Update', 'Reanimated'],
      database: {
        he: ['questions.json – שאלה, תשובה, יחידה, תחום, פירוק, בשתי השפות (קובץ מקומי)', 'results – ניקוד לכל יום ותשובות השחקן (AsyncStorage)', 'stats – רצף, ממוצע וניקוד לפי תחום (AsyncStorage)'],
        en: ['questions.json – question, answer, unit, domain, breakdown, in both languages (local file)', 'results – score per day and the player’s answers (AsyncStorage)', 'stats – streak, average and score per domain (AsyncStorage)'],
      },
      auth: {
        he: 'ללא חשבון וללא איסוף מידע. כל ההתקדמות נשמרת במכשיר, מה שמתאים גם לילדים ולבתי ספר.',
        en: 'No account and no data collection. All progress lives on the device, which also suits kids and schools.',
      },
      monetization: {
        he: ['חינם לחלוטין בהתחלה – המטרה היא הרגל יומי ושיתוף', 'חבילות שאלות נושאיות ברכישה חד-פעמית, למשל "מדע" או "היסטוריה"', 'בהמשך: גרסה לכיתות עם מאגר למורים בתשלום שנתי קטן'],
        en: ['Completely free at first – the goal is a daily habit and sharing', 'Themed question packs as a one-time purchase, e.g. "science" or "history"', 'Later: a classroom edition with a teacher bank for a small annual fee'],
      },
      mvpMilestones: {
        he: ['60 שאלות עם פירוקים בשתי השפות בקובץ JSON', 'בחירה יומית דטרמיניסטית וניקוד לוגריתמי', 'שלושת המסכים: שאלה, תוצאה, סיכום', 'רשת שיתוף ורצף ימים', 'מצב כיתה עם קוד-זרע'],
        en: ['60 questions with breakdowns in both languages in a JSON file', 'Deterministic daily selection and logarithmic scoring', 'The three screens: question, result, summary', 'Share grid and day streak', 'Class mode with a seed code'],
      },
      risks: {
        he: ['התשובות חייבות להיות מגובות במקור ובטווח סביר – שאלה עם תשובה שגויה מתפשטת מהר בקבוצות ופוגעת באמון', 'בלי שרת אין מניעת רמאות במצב כיתה – לקבל את זה ולמסגר אותו כמשחק ולא כמבחן', 'מאגר של 60 שאלות נגמר תוך פחות משבועיים בקצב של חמש ביום – כדאי להגיע להשקה עם חודשיים של שאלות כתובות מראש, ואחר כך לשמור על קצב כתיבה קבוע או על תרומות קהילה עם בדיקה'],
        en: ['Answers must be sourced and within a reasonable range – a question with a wrong answer spreads fast in groups and hurts trust', 'Without a server there is no cheat prevention in class mode – accept it and frame it as a game, not a test', 'A bank of 60 questions lasts under two weeks at five a day – reach launch with two months of questions written ahead, then keep a steady writing pace or vetted community contributions'],
      },
      expansion: {
        he: ['שאלות שהתשובה שלהן תלויה בעיר שבוחרים: "כמה אנשים גרים בעיר שלכם"', 'מצב דו-קרב בזמן אמת בין שני טלפונים דרך קוד', 'ארכיון של ימים קודמים למי שמתחיל באמצע'],
        en: ['Questions whose answer depends on a chosen city: "how many people live in your city"', 'A real-time duel between two phones through a code', 'An archive of past days for people who start late'],
      },
    },
  },
];
