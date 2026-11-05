/** Settings screen (Hebrew). */
const messages = {
  title: 'הגדרות',
  sections: {
    account: 'חשבון',
    language: 'שפה',
    appearance: 'מראה',
    subscription: 'מסלול',
    usage: 'שימוש ב-AI החודש',
    session: 'התחברות',
  },
  account: {
    displayName: 'שם תצוגה',
    displayNameHint: 'השם שמופיע באפליקציה.',
    save: 'שמירת השם',
    saved: 'השם נשמר',
    email: 'אימייל',
  },
  language: {
    restartHint: 'החלפת שפה מפעילה את האפליקציה מחדש כדי להפוך את כיוון התצוגה.',
    confirmTitle: 'להחליף שפה?',
    confirmBody: 'האפליקציה תופעל מחדש. שפת הממשק תהיה: {language}.',
    confirm: 'החלפה והפעלה מחדש',
    saved: 'השפה עודכנה',
  },
  appearance: {
    label: 'ערכת צבעים',
  },
  subscription: {
    current: 'המסלול שלך',
    tier: {
      free: 'חינמי',
      pro: 'Pro',
    },
    businesses: { one: 'עסק אחד', two: 'עד שני עסקים', other: 'עד {count} עסקים' },
    businessesLabel: 'עסקים',
    forecast: 'עד {count} חודשים',
    forecastLabel: 'טווח תחזית',
    validUntil: 'בתוקף עד {date}',
    upgradeUnavailable: 'שדרוג המסלול עדיין לא זמין בגרסה הזו.',
  },
  usage: {
    of: '{used} מתוך {limit}',
    resets: 'המכסות מתחדשות בתחילת כל חודש.',
    features: {
      plan_generation: 'יצירת תוכנית עסקית',
      section_regeneration: 'כתיבה מחדש של פרקים',
      roadmap_generation: 'יצירת מפת דרכים',
      roadmap_recommendation: 'המלצות למשימות',
      advisor_message: 'הודעות ליועץ',
      marketing_generation: 'תוכן שיווקי',
      finance_proposal: 'הצעות להנחות פיננסיות',
    },
  },
  signOut: {
    button: 'יציאה מהחשבון',
    confirmTitle: 'לצאת מהחשבון?',
    confirmBody: 'הנתונים שנשמרו במכשיר יימחקו ממנו. הם נשארים שמורים בחשבון.',
    confirm: 'יציאה',
  },
  about: {
    version: 'גרסה {version}',
  },
} as const;

export default messages;
