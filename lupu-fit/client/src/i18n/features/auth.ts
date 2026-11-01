import { defineFeature } from '../core.ts';

export default defineFeature({
  auth: {
    email: 'E-mail', password: 'Password', passwordHint: 'At least 10 characters.', showPassword: 'Show password',
    retryPrefix: 'Too many attempts. You can try again in', backToLogin: 'Back to sign in',
    err: { email: 'Enter a valid e-mail address.', passwordShort: 'The password must be at least 10 characters.', tokenInvalid: 'This reset link is invalid or has expired. Request a new one.' },
    login: { title: 'Sign in', intro: 'Welcome back. Sign in to continue your training.', submit: 'Sign in', forgot: 'Forgot your password?', noAccount: 'New here?', toRegister: 'Create an account' },
    register: {
      title: 'Create an account', intro: 'An account keeps your workouts, food log and progress in one place.', submit: 'Create account',
      legalPrefix: 'By creating an account you agree to the', terms: 'Terms of use', and: 'and', privacy: 'Privacy policy', haveAccount: 'Already have an account?', toLogin: 'Sign in',
    },
    forgot: {
      title: 'Reset your password', intro: 'Enter the e-mail you registered with and we will send a reset link if an account exists.', submit: 'Send reset link',
      sent: 'If an account exists for this e-mail, a reset link is on its way. The link is valid for one hour.',
    },
    reset: { title: 'Choose a new password', intro: 'Choose a new password for your account.', newPassword: 'New password', submit: 'Update password', done: 'Your password was updated. You can now sign in.', toLogin: 'Go to sign in', requestNew: 'Request a new link' },
  },
}, {
  auth: {
    email: 'אימייל', password: 'סיסמה', passwordHint: 'לפחות 10 תווים.', showPassword: 'הצגת הסיסמה',
    retryPrefix: 'יותר מדי ניסיונות. אפשר לנסות שוב בעוד', backToLogin: 'חזרה לכניסה',
    err: { email: 'יש להזין כתובת אימייל תקינה.', passwordShort: 'הסיסמה חייבת להכיל לפחות 10 תווים.', tokenInvalid: 'קישור האיפוס אינו תקין או שפג תוקפו. אפשר לבקש קישור חדש.' },
    login: { title: 'כניסה', intro: 'ברוכים השבים. נכנסים וממשיכים להתאמן.', submit: 'כניסה', forgot: 'שכחתם את הסיסמה?', noAccount: 'חדשים כאן?', toRegister: 'יצירת חשבון' },
    register: {
      title: 'יצירת חשבון', intro: 'חשבון שומר את האימונים, יומן האוכל וההתקדמות במקום אחד.', submit: 'יצירת חשבון',
      legalPrefix: 'בעת יצירת חשבון מאשרים את', terms: 'תנאי השימוש', and: 'ואת', privacy: 'מדיניות הפרטיות', haveAccount: 'כבר יש חשבון?', toLogin: 'כניסה',
    },
    forgot: {
      title: 'איפוס סיסמה', intro: 'מזינים את האימייל שאיתו נרשמתם, ואם קיים חשבון יישלח קישור לאיפוס.', submit: 'שליחת קישור לאיפוס',
      sent: 'אם קיים חשבון עבור האימייל הזה, קישור לאיפוס בדרך אליכם. הקישור תקף לשעה אחת.',
    },
    reset: { title: 'בחירת סיסמה חדשה', intro: 'קובעים סיסמה חדשה לחשבון.', newPassword: 'סיסמה חדשה', submit: 'עדכון הסיסמה', done: 'הסיסמה עודכנה. עכשיו אפשר להיכנס.', toLogin: 'מעבר לכניסה', requestNew: 'בקשת קישור חדש' },
  },
});
