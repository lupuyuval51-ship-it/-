import { defineFeature } from '../core.ts';

export default defineFeature({
  auth: {
    username: 'Username', usernameHint: '3-24 characters: letters a-z, digits, _ . - (not case sensitive).', password: 'Password', passwordHint: 'At least 10 characters.', showPassword: 'Show password', pwShow: 'Show', pwHide: 'Hide',
    retryPrefix: 'Too many attempts. You can try again in', backToLogin: 'Back to sign in',
    err: { usernameLength: 'The username must be 3 to 24 characters.', usernameChars: 'Use only letters a-z, digits, _ . - and start with a letter or digit.', passwordShort: 'The password must be at least 10 characters.' },
    login: { title: 'Sign in', intro: 'Welcome back. Sign in to continue your training.', submit: 'Sign in', noRecovery: 'There is no password recovery, so keep your password safe.', remember: 'Keep me signed in on this device', rememberHint: 'Saves your username and keeps you signed in. Turn off on a shared device. Your password is never stored by the app.', noAccount: 'New here?', toRegister: 'Create an account' },
    register: {
      title: 'Create an account', intro: 'An account keeps your workouts, food log and progress in one place.', submit: 'Create account', choosePassword: 'Choose a password',
      legalPrefix: 'By creating an account you agree to the', terms: 'Terms of use', and: 'and', privacy: 'Privacy policy', haveAccount: 'Already have an account?', toLogin: 'Sign in',
    },
  },
}, {
  auth: {
    username: 'שם משתמש', usernameHint: '3 עד 24 תווים: אותיות באנגלית, ספרות, \u2066_ . -\u2069 (ללא הבחנה בין אותיות גדולות לקטנות).', password: 'סיסמה', passwordHint: 'לפחות 10 תווים.', showPassword: 'הצגת הסיסמה', pwShow: 'הצגה', pwHide: 'הסתרה',
    retryPrefix: 'יותר מדי ניסיונות. אפשר לנסות שוב בעוד', backToLogin: 'חזרה לכניסה',
    err: { usernameLength: 'שם המשתמש צריך להכיל בין 3 ל-24 תווים.', usernameChars: 'אפשר להשתמש רק באותיות באנגלית, ספרות ו-\u2066_ . -\u2069 ולהתחיל באות או בספרה.', passwordShort: 'הסיסמה חייבת להכיל לפחות 10 תווים.' },
    login: { title: 'כניסה', intro: 'ברוכים השבים. נכנסים וממשיכים להתאמן.', submit: 'כניסה', noRecovery: 'אין אפשרות לשחזר סיסמה, לכן כדאי לשמור אותה במקום בטוח.', remember: 'להישאר מחוברים במכשיר הזה', rememberHint: 'שומר את שם המשתמש ומשאיר אתכם מחוברים. כדאי לכבות במכשיר משותף. הסיסמה עצמה לא נשמרת באפליקציה.', noAccount: 'חדשים כאן?', toRegister: 'יצירת חשבון' },
    register: {
      title: 'יצירת חשבון', intro: 'חשבון שומר את האימונים, יומן האוכל וההתקדמות במקום אחד.', submit: 'יצירת חשבון', choosePassword: 'בחירת סיסמה',
      legalPrefix: 'בעת יצירת חשבון מאשרים את', terms: 'תנאי השימוש', and: 'ואת', privacy: 'מדיניות הפרטיות', haveAccount: 'כבר יש חשבון?', toLogin: 'כניסה',
    },
  },
});
