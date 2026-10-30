import type en from '../en/device';
import type { Translations } from '../types';

const device: Translations<typeof en> = {
  defaultName: 'אני',
  boot: {
    title: 'מכינים את LUPU-FIT',
    database: 'פותחים את הנתונים שלך בטלפון…',
    migrating: 'מעדכנים את הנתונים לגרסה החדשה…',
    firstLaunch: 'מתקינים את LUPU-FIT בטלפון. הפתיחה הראשונה לוקחת קצת יותר זמן.',
    content: 'טוענים תרגילים, מזונות ומנות…',
    account: 'עוד רגע…',
    local: 'הנתונים שלך נשמרים בטלפון הזה. לא צריך חשבון ולא צריך שרת.',
  },
  locked: {
    title: 'LUPU-FIT כבר פתוח בכרטיסייה אחרת',
    body: 'אפשר לפתוח את הנתונים רק במקום אחד בכל פעם. סגרו את LUPU-FIT בכרטיסייה או בחלון האחר, והוא ייפתח כאן מעצמו.',
  },
  failed: {
    title: 'לא הצלחנו להפעיל את LUPU-FIT',
    unsupported: 'הדפדפן הזה לא יכול להריץ את הגרסה שפועלת על הטלפון (נדרשים WebAssembly‏, IndexedDB ו-Web Locks). עדכנו את הדפדפן או את Android System WebView.',
    storage_full: 'האחסון בטלפון מלא. פנו מקום ונסו שוב. הנתונים שלך לא נמחקו.',
    storage: 'לא הצלחנו לפתוח את האחסון של האפליקציה בטלפון. אם זה חלון גלישה פרטית, פתחו את LUPU-FIT בחלון רגיל.',
    migration: 'עדכון הנתונים לגרסה החדשה נכשל. הנתונים שלך נשמרו, נסו שוב.',
    account: 'האפליקציה לא הצליחה להתחבר בטלפון. נסו שוב.',
    unknown: 'משהו השתבש בהפעלה. נסו שוב.',
    retry: 'נסו שוב',
    details: 'פרטים טכניים',
  },
};

export default device;
