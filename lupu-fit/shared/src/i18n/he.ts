import type { Dict } from './index.js';

export const he: Dict = {
  app: { name: 'LUPU-FIT', tagline: 'לדעת בדיוק מה מתאמנים היום.' },
  unit: { kg: 'ק״ג', cm: 'ס״מ', kcal: 'קק״ל', g: 'ג׳', min: 'דק׳', sec: 'שנ׳' },
  nav: { home: 'בית', workouts: 'אימונים', nutrition: 'תזונה', coach: 'מאמן', progress: 'התקדמות', profile: 'פרופיל' },
  action: {
    startWorkout: 'להתחיל אימון', finishSet: 'סיום סט', saveMeal: 'שמירת ארוחה', chooseEquipment: 'בחירת ציוד',
    retry: 'לנסות שוב', undo: 'ביטול הפעולה', save: 'שמירה', cancel: 'ביטול',
  },
  empty: { noData: 'אין מספיק נתונים עדיין' },
  video: { needsNetwork: 'הסרטון זמין בחיבור לרשת', clearCache: 'ניקוי מטמון סרטונים' },
  allergen: { disclaimer: 'סינון האלרגנים אוטומטי ושמרני. תמיד כדאי לוודא את הרכיבים בעצמכם.' },
  notice: {
    minorNoDeficit: 'הרגלים בריאים וצמיחה קודמים לכול, ולכן לא נקבע גירעון קלורי.',
    injuryDisclaimer: 'החלפת תרגילים מפחיתה סיכון אך אינה ייעוץ רפואי. במקרה של כאב, לעצור.',
  },
  note: {
    recovery_day_added: 'התבקשו שבעה ימים: שישה ימי כוח ויום התאוששות.',
    exercise_swapped: 'תרגיל הוחלף באלטרנטיבה בטוחה יותר.',
    exercise_dropped: 'תרגיל הוסר כי אין לו חלופה בטוחה.',
    time_trimmed: 'האימון קוצר כדי להתאים לזמן שהוקצה.',
    slot_unfilled: 'לא נמצא תרגיל מתאים לאחד המקטעים.',
  },
  coach: {
    crisisTitle: 'קודם כול תמיכה',
    freeTierPrivacy: 'בשכבה החינמית של Google ייתכן שימוש בשאלות לשיפור המוצרים שלה.',
  },
  sport: {
    soccer: 'כדורגל', basketball: 'כדורסל', volleyball: 'כדורעף', racquet: 'טניס / פאדל', running: 'ריצה',
    cycling: 'אופניים', swimming: 'שחייה', combat_striking: 'איגרוף / קיקבוקס / קרב מגע', grappling: 'ג׳ודו / BJJ / היאבקות',
    climbing: 'טיפוס', surfing: 'גלישה', calisthenics: 'קליסטניקס', general: 'כללי',
  },
};
