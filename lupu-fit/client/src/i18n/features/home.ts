import { defineFeature } from '../core.ts';

export default defineFeature({
  home: {
    greeting: 'Welcome back',
    greetingName: 'Hi, {name}',
    resume: { title: 'Workout in progress', sets: '{n} sets logged so far', cta: 'Resume workout' },
    today: {
      title: "Today's workout", exercises: 'exercises', planDay: 'Day {a} of {b} in your plan', open: 'Open workout', noPlan: 'No active plan yet. Best match for your profile:',
      none: 'No ready workout fits your profile right now.', browse: 'Browse workouts',
    },
    splitDay: { full_a: 'Full body A', full_b: 'Full body B', full_c: 'Full body C', upper: 'Upper body', lower: 'Lower body', push: 'Push', pull: 'Pull', legs: 'Legs' },
    readiness: {
      title: 'Readiness check-in', hint: 'Three quick taps tell the app how hard to push today.', today: "Today's check-in", sleep: 'Sleep (1 poor, 5 great)', energy: 'Energy (1 low, 5 high)',
      soreness: 'Soreness (1 none, 5 very sore)', pain: 'Pain in a joint or injury', save: 'Save check-in', update: 'Update check-in',
    },
    week: { title: 'Workouts this week', aria: '{done} of {total} workouts this week', none: 'No workouts logged yet this week.', goalHit: 'Weekly goal reached.', left: '{n} more to reach your weekly goal.' },
    nutrition: { title: "Today's nutrition", none: 'Nothing logged yet today.', kcal: 'Calories', protein: 'Protein', carbs: 'Carbs', fat: 'Fat' },
    menu: { title: "Today's menu", open: 'Full menu', none: 'No dishes match your diet and restrictions.', next: 'Up next', allLogged: 'Every meal on the menu is already logged.' },
    quick: { title: 'Quick actions', workout: 'Start a workout', meal: 'Log a meal', weigh: 'Weigh-in', coach: 'Ask the coach' },
    start: { title: 'Getting started', done: 'Done', todo: 'Not done yet', profile: 'Complete your profile', workout: 'Finish your first workout', food: 'Log your first meal', weigh: 'Log your first weigh-in', coach: 'Chat with the coach' },
  },
}, {
  home: {
    greeting: 'ברוכים השבים',
    greetingName: 'היי {name}',
    resume: { title: 'אימון פעיל', sets: '{n} סטים תועדו עד עכשיו', cta: 'המשך אימון' },
    today: {
      title: 'האימון של היום', exercises: 'תרגילים', planDay: 'יום {a} מתוך {b} בתוכנית', open: 'לפתיחת האימון', noPlan: 'אין עדיין תוכנית פעילה. ההתאמה הטובה ביותר לפרופיל:',
      none: 'כרגע אין אימון מוכן שמתאים לפרופיל.', browse: 'לכל האימונים',
    },
    splitDay: { full_a: 'כל הגוף א׳', full_b: 'כל הגוף ב׳', full_c: 'כל הגוף ג׳', upper: 'פלג גוף עליון', lower: 'פלג גוף תחתון', push: 'דחיפה', pull: 'משיכה', legs: 'רגליים' },
    readiness: {
      title: 'בדיקת מוכנות', hint: 'שלוש לחיצות קצרות מכווננות את עצימות האימון להיום.', today: 'בדיקת המוכנות של היום', sleep: 'שינה (1 גרועה, 5 מצוינת)', energy: 'אנרגיה (1 נמוכה, 5 גבוהה)',
      soreness: 'כאבי שרירים (1 בלי, 5 חזקים)', pain: 'כאב במפרק או בפציעה', save: 'שמירת בדיקה', update: 'עדכון בדיקה',
    },
    week: { title: 'אימונים השבוע', aria: '{done} מתוך {total} אימונים השבוע', none: 'עוד לא תועדו אימונים השבוע.', goalHit: 'היעד השבועי הושג.', left: 'עוד {n} אימונים להשגת היעד השבועי.' },
    nutrition: { title: 'תזונה היום', none: 'עוד לא תועד כלום היום.', kcal: 'קלוריות', protein: 'חלבון', carbs: 'פחמימות', fat: 'שומן' },
    menu: { title: 'התפריט להיום', open: 'לתפריט המלא', none: 'אין מנות שמתאימות לתזונה ולמגבלות.', next: 'הבאה בתור', allLogged: 'כל ארוחות התפריט כבר תועדו.' },
    quick: { title: 'פעולות מהירות', workout: 'התחלת אימון', meal: 'תיעוד ארוחה', weigh: 'שקילה', coach: 'שאלה למאמן' },
    start: { title: 'צעדים ראשונים', done: 'בוצע', todo: 'עוד לא בוצע', profile: 'השלמת הפרופיל', workout: 'סיום האימון הראשון', food: 'תיעוד הארוחה הראשונה', weigh: 'תיעוד השקילה הראשונה', coach: 'שיחה עם המאמן' },
  },
});
