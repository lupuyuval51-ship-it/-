/**
 * Hebrew strings for the `onboarding` feature (default language). Owned by the onboarding feature.
 * Add keys here first, then the same keys to ../en/onboarding.ts (the compiler and
 * src/i18n/__tests__/locales.test.ts enforce identical key sets).
 *
 * Voice: warm, calm and gender-neutral (past tense / "שלך" / impersonal forms), never pushy.
 */
const messages = {
  screenTitle: 'הקמת עסק',
  defaultBusinessName: 'העסק שלי',
  progress: 'שלב {current} מתוך {total}',
  reviewProgress: 'סיכום',
  resumed: 'ממשיכים מאיפה שעצרת.',
  draftRestored: 'שחזרנו את מה שהתחלת לכתוב.',

  actions: {
    continue: 'המשך',
    skip: 'דילוג',
    back: 'חזרה',
    backToReview: 'חזרה לסיכום',
    create: 'יצירת התוכנית העסקית',
  },
  a11y: {
    progress: 'שלב {current} מתוך {total}',
    skipHint: 'השאלה תסומן כדילוג. אפשר לחזור אליה במסך הסיכום.',
    backHint: 'חזרה לשאלה הקודמת',
    editAnswer: 'עריכת התשובה: {question}',
  },

  business_idea: {
    label: 'הרעיון',
    title: 'מה הרעיון שלך?',
    why: 'זו נקודת המוצא של כל התוכנית. כמה משפטים פשוטים מספיקים, ואפשר לדייק בהמשך.',
    ideaLabel: 'הרעיון במילים שלך',
    ideaPlaceholder: 'לדוגמה: מאפייה ביתית שמוכרת לחמי מחמצת בהזמנה מראש לתושבי השכונה',
    nameLabel: 'שם זמני לעסק',
    nameHint: 'לא חובה. אפשר לשנות אותו בכל עת.',
  },
  country: {
    label: 'מדינה',
    title: 'איפה העסק יפעל?',
    why: 'המדינה משפיעה על המטבע, על המיסוי ועל הרישוי, ולכן גם על ההמלצות בתוכנית.',
    searchLabel: 'חיפוש מדינה',
    searchPlaceholder: 'שם המדינה בעברית או באנגלית',
    noResults: 'לא מצאנו מדינה בשם הזה. אפשר לנסות איות אחר, או לדלג על השאלה.',
    currencyNote: 'מטבע העסק יהיה {currency}. אפשר לשנות אותו בכל עת בהגדרות העסק.',
    selected: 'נבחרה: {country}',
  },
  starting_budget: {
    label: 'תקציב התחלתי',
    title: 'כמה כסף אפשר להשקיע בהתחלה?',
    why: 'כך התוכנית תתאים לתקציב האמיתי שלך. גם סכום קטן, או אפס, היא תשובה טובה.',
    amountLabel: 'סכום משוער',
    amountHint: 'הערכה גסה מספיקה.',
    currencyLabel: 'מטבע',
    currencySheetTitle: 'מטבע התקציב',
  },
  experience: {
    label: 'ניסיון',
    title: 'כמה ניסיון יש לך בתחום?',
    why: 'כך נדע כמה להסביר בכל שלב ומה אפשר לקצר.',
    options: {
      none: { label: 'אין לי ניסיון עדיין', description: 'גם התחום וגם ניהול עסק חדשים לי' },
      some: { label: 'קצת ניסיון', description: 'התנסיתי בתחום, אבל לא כמקצוע' },
      industry: { label: 'ניסיון מקצועי בתחום', description: 'יש לי ניסיון מעבודה בתחום הזה' },
      founder: { label: 'כבר הקמתי עסק', description: 'הקמתי או ניהלתי עסק משלי בעבר' },
    },
    detailsLabel: 'משהו שכדאי שנדע?',
    detailsHint: 'לא חובה.',
    detailsPlaceholder: 'לדוגמה: שש שנים במטבח של מסעדה, בלי ניסיון בניהול',
  },
  target_customers: {
    label: 'לקוחות',
    title: 'מי הלקוחות שלך?',
    why: 'תיאור ממוקד של הלקוחות הוא הבסיס לתמחור, לשיווק ולתחזית מכירות מציאותית.',
    inputLabel: 'הלקוחות במילים שלך',
    hint: 'ככל שהתיאור קונקרטי יותר, כך התוכנית מדויקת יותר.',
    example:
      'לדוגמה: הורים צעירים במרכז הארץ שעובדים מהבית ומחפשים ארוחות ערב בריאות במשלוח, פעמיים או שלוש בשבוע.',
  },
  primary_goal: {
    label: 'מטרה',
    title: 'מה המטרה העיקרית שלך?',
    why: 'המטרה קובעת את הקצב, את סדרי העדיפויות ואת היקף התוכנית.',
    options: {
      side_income: { label: 'הכנסה נוספת', description: 'לצד עבודה או לימודים' },
      full_time: { label: 'פרנסה מלאה', description: 'שהעסק יהיה העיסוק העיקרי שלי' },
      scale: { label: 'עסק שצומח', description: 'צוות, השקעות והתרחבות' },
      impact: { label: 'השפעה חברתית', description: 'לפתור בעיה שחשובה לי' },
      other: { label: 'משהו אחר', description: 'אפשר לפרט למטה' },
    },
    detailsLabel: 'רוצה לפרט?',
    detailsHint: 'לא חובה.',
    detailsPlaceholder: 'לדוגמה: להגיע להכנסה של 8,000 ₪ בחודש בתוך שנה',
  },
  weekly_hours: {
    label: 'זמן בשבוע',
    title: 'כמה שעות בשבוע אפשר להקדיש לעסק?',
    why: 'כך המשימות במפת הדרכים יתאימו לזמן שבאמת עומד לרשותך.',
    options: {
      lt5: 'פחות מ-5 שעות',
      h5_10: '5 עד 10 שעות',
      h10_20: '10 עד 20 שעות',
      h20_40: '20 עד 40 שעות',
      gt40: 'יותר מ-40 שעות',
    },
  },
  launch_timeline: {
    label: 'מועד השקה',
    title: 'מתי העסק אמור להתחיל לפעול?',
    why: 'לפי זה נפרוס את מפת הדרכים ל-30, 60 ו-90 הימים הראשונים.',
    options: {
      m1: 'בתוך חודש',
      m3: 'בתוך שלושה חודשים',
      m6: 'בתוך חצי שנה',
      m12: 'בתוך שנה',
      unsure: 'עוד לא ברור',
    },
  },

  currencies: {
    ILS: 'שקל חדש',
    USD: 'דולר אמריקאי',
    EUR: 'אירו',
    GBP: 'לירה שטרלינג',
    CAD: 'דולר קנדי',
    AUD: 'דולר אוסטרלי',
  },

  review: {
    title: 'רגע לפני שמתחילים',
    body: 'אלה התשובות שלך. אפשר לבחור בכל שורה כדי לשנות אותה.',
    skipped: 'דילגת',
    unanswered: 'עוד אין תשובה',
    workingName: 'שם זמני: {name}',
    note: 'התוכנית תיכתב בעזרת AI על סמך התשובות האלה. זו טיוטה לעבודה: אפשר לערוך כל חלק בה, והמספרים בה הם הערכות בלבד.',
  },

  limit: {
    title: 'הגעת למספר העסקים המרבי',
    bodyFree: {
      one: 'במסלול החינמי אפשר לנהל עסק פעיל אחד, ובמסלול Pro עד {pro} עסקים. כדי לפתוח עסק חדש אפשר להעביר עסק קיים לארכיון.',
      two: 'במסלול החינמי אפשר לנהל עד שני עסקים פעילים, ובמסלול Pro עד {pro}. כדי לפתוח עסק חדש אפשר להעביר עסק קיים לארכיון.',
      other:
        'במסלול החינמי אפשר לנהל עד {count} עסקים פעילים, ובמסלול Pro עד {pro}. כדי לפתוח עסק חדש אפשר להעביר עסק קיים לארכיון.',
    },
    bodyPro: 'המסלול שלך מאפשר עד {count} עסקים פעילים. כדי לפתוח עסק חדש אפשר להעביר עסק קיים לארכיון.',
    manage: 'ניהול העסקים',
    subscription: 'פרטי המסלול',
  },

  errors: {
    ideaTooShort: 'כדאי לתאר את הרעיון בכמה מילים (לפחות 3 תווים).',
    chooseOne: 'יש לבחור אחת מהאפשרויות.',
    countryRequired: 'יש לבחור מדינה מהרשימה, או לדלג על השאלה.',
    amountRequired: 'יש להזין סכום, או לדלג על השאלה.',
    customersRequired: 'יש לתאר את הלקוחות, או לדלג על השאלה.',
    saveFailed: 'לא הצלחנו לשמור. מה שכתבת נשאר במכשיר, ואפשר לנסות שוב.',
    loadFailed: 'לא הצלחנו לטעון את התשובות הקודמות.',
    completeFailed: 'לא הצלחנו לסיים את ההגדרה. אפשר לנסות שוב.',
    offline: 'אין חיבור לרשת. מה שכתבת נשמר במכשיר, ואפשר יהיה להמשיך כשהחיבור יחזור.',
  },

  businesses: {
    title: 'העסקים שלי',
    new: 'עסק חדש',
    active: 'פעיל',
    incomplete: 'ההגדרה לא הושלמה',
    makeActiveHint: 'הפיכה לעסק הפעיל ומעבר למסך הבית',
    editA11y: 'עריכת הפרטים של {name}',
    emptyTitle: 'עוד אין כאן עסקים',
    emptyBody: 'כל עסק מקבל תוכנית עסקית, מפת דרכים ומודל פיננסי משלו.',
    emptyAction: 'הקמת עסק',
    loadFailed: 'לא הצלחנו לטעון את רשימת העסקים.',
    edit: {
      title: 'פרטי העסק',
      save: 'שמירת השינויים',
      stageHint: 'השלב עוזר להתאים את ההמלצות למה שהעסק צריך עכשיו.',
      stages: {
        idea: 'עדיין בשלב הרעיון',
        planning: 'בונים תוכנית ובודקים היתכנות',
        launching: 'מתכוננים לצאת לשוק',
        operating: 'העסק פעיל ויש לקוחות',
        growing: 'מרחיבים את הפעילות',
      },
      countryNone: 'לא נבחרה',
      countrySheetTitle: 'בחירת מדינה',
      currencySheetTitle: 'בחירת מטבע',
      currencyHint: 'כל הסכומים של העסק מוצגים במטבע הזה. החלפת מטבע לא ממירה סכומים שכבר הוזנו.',
      useSuggestedCurrency: 'מעבר ל-{currency}, המטבע המקובל ב{country}',
      archiveTitle: 'ארכיון',
      archiveBody: 'עסק בארכיון נשמר עם כל הנתונים שלו, אבל לא מופיע ברשימות ולא נספר במכסת העסקים.',
      notFound: 'העסק לא נמצא. ייתכן שהוא הועבר לארכיון.',
      offline: 'אין חיבור לרשת. אפשר לשמור שינויים כשהחיבור יחזור.',
    },
  },
} as const;

export default messages;
