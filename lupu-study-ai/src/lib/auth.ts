/**
 * הרשמה בלי אימייל: התלמיד בוחר שם משתמש וסיסמה. מאחורי הקלעים Supabase דורש כתובת, ולכן
 * מייצרים כתובת פנימית מזויפת מהשם. לא נשלח אליה שום מייל ולא נאסף מידע אישי.
 * (נדרש לכבות "Confirm email" בהגדרות Auth של הפרויקט. אין שחזור סיסמה במייל.)
 */
export const AUTH_DOMAIN = "users.lupu-study.app";

export const USERNAME_RE = /^[a-z0-9][a-z0-9_.-]{2,19}$/;

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function validateUsername(input: string): string | null {
  const u = normalizeUsername(input);
  if (!USERNAME_RE.test(u)) return "שם משתמש: 3 עד 20 תווים באנגלית, ספרות, נקודה, קו תחתון או מקף (מתחיל באות או ספרה).";
  if (/\.\.|\.$/.test(u)) return "שם המשתמש לא יכול להכיל שתי נקודות רצופות או להסתיים בנקודה.";
  return null;
}

export const usernameToEmail = (u: string) => `${normalizeUsername(u)}@${AUTH_DOMAIN}`;

export const emailToUsername = (email: string | undefined | null) => (email ?? "").replace(new RegExp(`@${AUTH_DOMAIN.replace(/\./g, "\\.")}$`), "");
