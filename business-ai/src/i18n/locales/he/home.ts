/**
 * Hebrew strings for the `home` feature (default language). Owned by the home feature.
 * Covers the Home tab, the next-action engine and the Workspace tab.
 * Add keys here first, then the same keys to ../en/home.ts (the compiler and
 * src/i18n/__tests__/locales.test.ts enforce identical key sets).
 */
const messages = {
  title: 'בית',
  businessA11y: 'העסק הפעיל: {name}, שלב {stage}. הקשה פותחת את רשימת העסקים.',
  noBusiness: {
    title: 'עדיין אין עסק פעיל',
    body: 'אפשר לבחור עסק קיים מהרשימה או להתחיל עסק חדש.',
    action: 'לרשימת העסקים',
  },
  next: {
    heading: 'הצעד הבא',
    continueOnboarding: {
      title: 'נשלים את פרטי העסק',
      body: 'עוד כמה תשובות, ונוכל לנסח טיוטה של התוכנית העסקית.',
      cta: 'המשך ההגדרה',
    },
    generatePlan: {
      title: 'יצירת התוכנית העסקית',
      body: 'נכין טיוטה מתוך התשובות שלך. אפשר לערוך כל פרק, ולכל נתון מצוין מקורו.',
      cta: 'יצירת התוכנית',
    },
    planGenerating: {
      title: 'התוכנית בכתיבה',
      body: 'זה לוקח בדרך כלל דקה או שתיים. בינתיים אפשר להמשיך לעבוד באפליקציה.',
      cta: 'מעקב אחרי ההתקדמות',
    },
    retryPlan: {
      title: 'יצירת התוכנית לא הושלמה',
      body: 'שום מידע לא אבד. אפשר לנסות שוב עכשיו.',
      cta: 'ניסיון נוסף',
    },
    createRoadmap: {
      title: 'בניית מפת דרכים ל־90 הימים הקרובים',
      body: 'נפרק את התוכנית למשימות מוחשיות עם תאריכי יעד, בשלושה שלבים של 30 יום.',
      cta: 'למפת הדרכים',
    },
    overdueTask: {
      title: '{title}',
      body: {
        one: 'באיחור של יום. זו המשימה הדחופה ביותר כרגע.',
        two: 'באיחור של יומיים. זו המשימה הדחופה ביותר כרגע.',
        other: 'באיחור של {count} ימים. זו המשימה הדחופה ביותר כרגע.',
      },
      cta: 'לפתיחת המשימה',
    },
    nextTask: {
      title: '{title}',
      dueToday: 'מתוכננת להיום.',
      dueTomorrow: 'מתוכננת למחר.',
      dueInDays: {
        one: 'מתוכננת לעוד יום.',
        two: 'מתוכננת לעוד יומיים.',
        other: 'מתוכננת לעוד {count} ימים.',
      },
      milestone: 'מקדמת את אבן הדרך {milestone}.',
      noDate: 'המשימה הבאה במפת הדרכים, לפי תאריך ועדיפות.',
      cta: 'לפתיחת המשימה',
    },
    setupFinances: {
      title: 'הגדרת התמונה הפיננסית',
      body: 'הון התחלתי, עלויות ותמחור — כדי לראות לכמה זמן יספיק הכסף ומתי העסק מגיע לאיזון.',
      cta: 'להגדרת הכספים',
    },
    askAdvisor: {
      title: 'כל המשימות במפת הדרכים הושלמו',
      body: 'אפשר לשאול את היועץ במה כדאי להתמקד עכשיו, לפי המצב הנוכחי של העסק.',
      cta: 'שאלה ליועץ',
      prompt: 'השלמתי את כל המשימות במפת הדרכים. לפי המצב הנוכחי של העסק, מה שלושת סדרי העדיפויות הבאים שלי, ואילו משימות כדאי להוסיף?',
    },
  },
  today: {
    heading: 'היום',
    allTasks: 'כל המשימות',
    empty: 'אין משימות להיום.',
    more: {
      one: 'ועוד משימה אחת',
      two: 'ועוד שתי משימות',
      other: 'ועוד {count} משימות',
    },
  },
  roadmap: {
    heading: 'מפת דרכים',
    open: 'למפת הדרכים',
    phase: {
      days_30: '30 הימים הראשונים',
      days_60: 'ימים 31–60',
      days_90: 'ימים 61–90',
    },
    progress: '{done} מתוך {total}',
    progressA11y: '{phase}: הושלמו {done} מתוך {total} משימות',
    noTasks: 'אין משימות',
    empty: 'עדיין אין מפת דרכים. היא תיבנה מתוך התוכנית העסקית.',
  },
  budget: {
    heading: 'תקציב',
    open: 'לכספים',
    estimateNote: 'הערכות לפי ההנחות שלך, בתרחיש הצפוי. אין בהן התחייבות לתוצאות.',
    startingCapital: 'הון התחלתי',
    startupCosts: 'עלויות הקמה',
    monthlyFixed: 'הוצאות קבועות בחודש',
    runway: 'לכמה זמן יספיק הכסף',
    runwayMonths: {
      one: 'חודש אחד',
      two: 'חודשיים',
      other: '{count} חודשים',
    },
    runwayLessThanMonth: 'פחות מחודש',
    runwayBeyond: {
      one: 'יותר מחודש',
      two: 'יותר מחודשיים',
      other: 'יותר מ־{count} חודשים',
    },
    empty: 'עדיין לא הוזנו נתונים פיננסיים.',
    setup: 'להגדרת הכספים',
    actualHeading: 'בפועל, {month}',
    actualIncome: 'הכנסות',
    actualExpenses: 'הוצאות',
    actualNet: 'נטו',
    actualOpen: 'לביצועים',
  },
  milestones: {
    heading: 'אבני דרך קרובות',
    empty: 'אין אבני דרך פתוחות.',
    noDate: 'ללא תאריך',
  },
  workspace: {
    title: 'מרחב עבודה',
    groups: {
      work: 'עבודה',
      grow: 'צמיחה',
      manage: 'ניהול',
      account: 'חשבון',
    },
    tasks: {
      title: 'משימות',
      description: 'כל המשימות של העסק, לפי תאריך ועדיפות',
      count: {
        one: '{count} פתוחה',
        other: '{count} פתוחות',
      },
      none: 'אין פתוחות',
    },
    roadmap: {
      title: 'מפת דרכים',
      description: 'שלבי 30/60/90 הימים ואבני הדרך',
    },
    marketing: {
      title: 'סטודיו שיווק',
      description: 'טקסטים למודעות, לרשתות החברתיות ולדף הנחיתה',
    },
    launch: {
      title: 'מרכז ההשקה',
      description: 'רישום, מיסוי ורישוי, עם הפניות למקורות רשמיים',
    },
    performance: {
      title: 'ביצועים',
      description: 'הכנסות והוצאות בפועל, מול התוכנית',
    },
    transactions: {
      title: 'תנועות',
      description: 'רישום ההכנסות וההוצאות של העסק',
    },
    goals: {
      title: 'יעדים',
      description: 'יעדים עסקיים ומעקב אחרי ההתקדמות',
      count: {
        one: '{count} פעיל',
        other: '{count} פעילים',
      },
    },
    businesses: {
      title: 'עסקים',
      description: 'החלפה בין עסקים, עריכה ועסק חדש',
    },
    subscription: {
      title: 'מסלול',
      description: 'המגבלות של המסלול והשימוש החודש',
    },
    settings: {
      title: 'הגדרות',
      description: 'שפה, מראה וחשבון',
    },
  },
} as const;

export default messages;
