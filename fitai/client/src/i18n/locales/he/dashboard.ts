import type en from '../en/dashboard';
import type { Translations } from '../types';

const dashboard: Translations<typeof en> = {
  title: 'לוח בקרה',
  greeting: {
    morning: 'בוקר טוב, {name}',
    afternoon: 'צהריים טובים, {name}',
    evening: 'ערב טוב, {name}',
    night: 'היי, {name}',
  },
  resume: {
    title: 'אימון בתהליך',
    inProgress: '{name} · התחיל ב-{time}',
    paused: '{name} · מושהה',
    action: 'חזרה לאימון',
  },
  nextWorkout: {
    title: 'האימון הבא',
    exercises: { one: 'תרגיל אחד', two: 'שני תרגילים', other: '{count} תרגילים' },
    minutes: '≈ {count} דק׳',
    fromPlan: 'מתוך התוכנית: {plan}',
    start: 'התחלת אימון',
    started: 'האימון התחיל. בהצלחה!',
    viewPlan: 'לתוכנית',
    resume: 'חזרה לאימון',
    noPlanTitle: 'אין תוכנית אימונים פעילה',
    noPlanBody: 'אפשר ליצור תוכנית מותאמת אישית לפי המטרה, הציוד ולוח הזמנים שלך.',
    generate: 'יצירת תוכנית',
    emptyPlanTitle: 'בתוכנית הפעילה עדיין אין אימונים',
    emptyPlanBody: 'הוספת אימונים לתוכנית תציג כאן את האימון הבא.',
    lastWorkout: 'אימון אחרון: {name} · {when}',
  },
  nutrition: {
    title: 'התזונה היום',
    ringLabel: 'קלוריות היום: {value} מתוך {target}',
    ofTarget: 'מתוך {target} קק״ל',
    remaining: 'נותרו {value} קק״ל',
    over: '{value} קק״ל מעל היעד',
    consumed: '{value} קק״ל',
    macro: '{value} / {target} ג׳',
    noTargets: 'השלמת הפרופיל תאפשר חישוב יעדים יומיים.',
    nothingLogged: 'עדיין לא תועד מזון היום.',
    entries: { one: 'פריט אחד תועד היום', two: 'שני פריטים תועדו היום', other: '{count} פריטים תועדו היום' },
    logFood: 'תיעוד מזון',
  },
  weekly: {
    title: 'השבוע',
    progress: '{completed} מתוך {target} אימונים',
    progressLabel: 'התקדמות ביעד השבועי',
    met: 'היעד השבועי הושג — כל הכבוד!',
    remaining: { one: 'עוד אימון אחד ליעד', two: 'עוד שני אימונים ליעד', other: 'עוד {count} אימונים ליעד' },
    rule: 'אימונים של 10 דקות ומעלה עם 3 סטים שהושלמו ומעלה נספרים ליעד.',
    days: 'אימונים השבוע',
    dayTrained: '{day}: בוצע אימון',
    dayRest: '{day}: ללא אימון',
    streak: { one: 'רצף של שבוע', two: 'רצף של שבועיים', other: 'רצף של {count} שבועות' },
    noStreak: 'עדיין אין רצף',
  },
  records: {
    title: 'שיאים אישיים אחרונים',
    empty: 'השלמת אימונים ושבירת שיאים קודמים יציגו כאן שיאים חדשים.',
    viewAll: 'להתקדמות',
  },
  insights: {
    title: 'תובנות',
    viewAll: 'כל התובנות',
  },
  quick: {
    title: 'פעולות מהירות',
    logWeight: 'רישום משקל גוף',
    askCoach: 'שאלה למאמן',
    library: 'ספריית תרגילים',
    progress: 'צפייה בהתקדמות',
  },
  errors: {
    session_already_active: 'כבר יש לך אימון פעיל.',
    plan_workout_not_found: 'האימון הזה כבר לא נמצא בתוכנית שלך.',
  },
};

export default dashboard;
