import type en from '../en/auth';
import type { Translations } from '../types';

const auth: Translations<typeof en> = {
  login: {
    title: 'טוב לראות אותך שוב',
    subtitle: 'התחברו כדי להמשיך להתאמן',
    submit: 'התחברות',
    noAccount: 'אין לך חשבון?',
    register: 'להרשמה',
    forgot: 'שכחת סיסמה?',
    lockedFor: {
      one: 'יותר מדי ניסיונות כושלים. כדי לשמור על החשבון, אפשר לנסות שוב בעוד דקה — או לאפס את הסיסמה.',
      other: 'יותר מדי ניסיונות כושלים. כדי לשמור על החשבון, אפשר לנסות שוב בעוד {count} דקות — או לאפס את הסיסמה.',
    },
    rateLimitedFor: {
      one: 'יותר מדי ניסיונות מהמכשיר הזה. נא להמתין דקה ולנסות שוב.',
      other: 'יותר מדי ניסיונות מהמכשיר הזה. נא להמתין {count} דקות ולנסות שוב.',
    },
  },
  register: {
    title: 'יצירת חשבון',
    subtitle: 'אימונים ותזונה מותאמים אישית תוך דקות',
    submit: 'יצירת חשבון',
    haveAccount: 'כבר יש לך חשבון?',
    login: 'להתחברות',
    ageNote: 'השימוש ב-FITAI מותר מגיל 13 ומעלה. בשלב הבא נשאל על הגיל כדי שהאימונים והתזונה יהיו בטוחים עבורך.',
    emailTakenLogin: 'להתחברות עם האימייל הזה',
    terms: 'ביצירת החשבון את/ה מאשר/ת שימוש ב-FITAI להכוונת כושר כללית בלבד.',
  },
  fields: {
    email: 'אימייל',
    password: 'סיסמה',
    newPassword: 'סיסמה חדשה',
    currentPassword: 'סיסמה נוכחית',
    displayName: 'שם',
    passwordHint: 'לפחות 8 תווים, כולל אות ומספר.',
    showPassword: 'הצגת סיסמה',
    hidePassword: 'הסתרת סיסמה',
  },
  password: {
    strengthLabel: 'חוזק',
    level: { weak: 'עוד לא שם', fair: 'טוב', strong: 'חזקה' },
    rules: { length: '8 תווים לפחות', letter: 'אות', number: 'ספרה' },
    met: 'הושלם',
    unmet: 'חסר',
  },
  forgot: {
    title: 'איפוס סיסמה',
    subtitle: 'הזינו את כתובת האימייל ונשלח קישור לאיפוס.',
    submit: 'שליחת קישור',
    sent: 'אם קיים חשבון עם כתובת זו, נשלח אליה קישור לאיפוס. הקישור תקף ל-30 דקות.',
    emailNotConfigured: 'לתשומת לב: שליחת אימיילים דורשת הגדרה על ידי מנהל השרת.',
    sentTo: 'בדקו את תיבת הדואר',
    useOther: 'שימוש באימייל אחר',
    backToLogin: 'חזרה להתחברות',
  },
  reset: {
    title: 'בחירת סיסמה חדשה',
    submit: 'עדכון סיסמה',
    success: 'הסיסמה עודכנה. אפשר להתחבר עכשיו.',
    missingToken: 'קישור האיפוס חסר. בקשו קישור חדש.',
    invalidLink: 'קישור האיפוס פג תוקף או שכבר נעשה בו שימוש.',
    requestNew: 'בקשת קישור חדש',
    goLogin: 'להתחברות',
  },
  loggedOut: 'התנתקת מהמערכת.',
  sessionExpired: 'פג תוקף ההתחברות. נא להתחבר שוב.',
};

export default auth;
