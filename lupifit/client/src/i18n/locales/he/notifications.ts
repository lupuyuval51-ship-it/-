import type en from '../en/notifications';
import type { Translations } from '../types';

const notifications: Translations<typeof en> = {
  title: 'התראות',
  subtitle: 'אבני דרך, שיאים ויעדים מהאימונים שלך.',
  markAllRead: 'סימון הכול כנקרא',
  markRead: 'סימון כנקרא',
  allRead: 'כל ההתראות סומנו כנקראו',
  delete: 'מחיקת ההתראה',
  deleteTitle: 'למחוק את ההתראה?',
  deleted: 'ההתראה נמחקה',
  unread: 'לא נקרא',
  unreadCount: { zero: 'אין התראות שלא נקראו', one: 'התראה אחת שלא נקראה', two: '2 התראות שלא נקראו', other: '{count} התראות שלא נקראו' },
  bellLabel: { zero: 'התראות', one: 'התראות, אחת שלא נקראה', two: 'התראות, 2 שלא נקראו', other: 'התראות, {count} שלא נקראו' },
  empty: {
    title: 'אין התראות חדשות',
    body: 'הישגים, שיאים אישיים ויעדים שבועיים יופיעו כאן.',
  },
  kinds: {
    achievement: 'הישג חדש נפתח: {title}',
    level_up: 'עלית רמה! הגעת לרמה {level}.',
    personal_record: 'שיא אישי חדש בתרגיל {exercise} — {recordType}: {value}',
    personal_record_previous: 'שיא אישי חדש בתרגיל {exercise} — {recordType}: {value} (קודם: {previous})',
    weekly_goal: 'היעד השבועי הושג: {completed} מתוך {goal} אימונים השבוע.',
    reminder: 'תזכורת',
    info: 'עדכון מ-LUPU-FIT',
  },
  relative: {
    justNow: 'עכשיו',
  },
  reminders: {
    workoutTitle: 'זמן להתאמן',
    workoutBody: 'היום הוא אחד מימי האימון שלך — האימון הבא מחכה.',
    mealTitle: 'זמן לתעד ארוחה',
    mealBody: 'תיעוד עכשיו עוזר לשמור על התזונה במסלול.',
    open: 'פתיחה',
    channelName: 'תזכורות',
    channelDescription: 'תזכורות לאימון ולתיעוד ארוחות שהוגדרו ב-LUPU-FIT.',
  },
};

export default notifications;
