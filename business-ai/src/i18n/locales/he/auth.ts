/** Authentication screens (Hebrew). */
const messages = {
  signIn: {
    title: 'כניסה לחשבון',
    subtitle: 'ממשיכים מאיפה שעצרת. התוכנית, המשימות והמספרים מחכים.',
    submit: 'כניסה',
    forgot: 'שכחת סיסמה?',
    noAccount: 'עוד אין לך חשבון?',
    createAccount: 'יצירת חשבון',
  },
  signUp: {
    title: 'יצירת חשבון',
    subtitle: 'מרעיון לתוכנית עסקית שאפשר לפעול לפיה, צעד אחר צעד.',
    submit: 'יצירת חשבון',
    haveAccount: 'כבר יש לך חשבון?',
    signIn: 'כניסה',
  },
  fields: {
    displayName: 'שם',
    displayNameHint: 'כך נפנה אליך באפליקציה.',
    email: 'אימייל',
    password: 'סיסמה',
    newPassword: 'סיסמה חדשה',
    confirmPassword: 'אימות הסיסמה',
  },
  passwordRules: {
    title: 'הסיסמה צריכה לכלול',
    minLength: 'לפחות 8 תווים',
    letterAndNumber: 'לפחות אות אחת וספרה אחת',
    met: 'הדרישה מתקיימת',
    unmet: 'הדרישה עוד לא מתקיימת',
  },
  confirmEmail: {
    title: 'נשאר רק לאשר את האימייל',
    body: 'שלחנו קישור אישור אל {email}. אחרי האישור אפשר להיכנס לחשבון.',
    backToSignIn: 'חזרה לכניסה',
    useDifferentEmail: 'הרשמה עם אימייל אחר',
  },
  forgot: {
    title: 'איפוס סיסמה',
    subtitle: 'נשלח קישור לבחירת סיסמה חדשה לכתובת שאיתה נרשמת.',
    submit: 'שליחת קישור',
    sentTitle: 'הקישור בדרך',
    sentBody: 'אם קיים חשבון עם הכתובת {email}, יגיע אליה קישור לאיפוס הסיסמה בדקות הקרובות. יש לפתוח אותו במכשיר הזה.',
    backToSignIn: 'חזרה לכניסה',
    resend: 'שליחה חוזרת',
  },
  reset: {
    title: 'בחירת סיסמה חדשה',
    subtitle: 'הסיסמה החדשה תחליף את הקודמת.',
    submit: 'שמירת הסיסמה',
    verifying: 'מאמתים את הקישור…',
    invalidTitle: 'הקישור כבר לא בתוקף',
    invalidBody: 'קישורי איפוס תקפים לזמן מוגבל ולשימוש אחד, ויש לפתוח אותם באותו מכשיר שבו התבקש האיפוס.',
    requestNew: 'בקשת קישור חדש',
    missingTitle: 'צריך לפתוח את הקישור מהאימייל',
    missingBody: 'כדי לבחור סיסמה חדשה, יש לפתוח את קישור האיפוס שנשלח אליך באימייל.',
    success: 'הסיסמה עודכנה',
  },
  language: {
    label: 'שפת הממשק',
  },
} as const;

export default messages;
