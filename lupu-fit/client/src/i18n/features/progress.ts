import { defineFeature } from '../core.ts';

export default defineFeature({
  progress: {
    take: {
      empty: 'Finish a workout and your progress will show up here.', sessions: 'In this range: {n} workouts, {g} planned.', sessionsNoGoal: 'In this range: {n} workouts.', weight: 'Body weight changed by {d} kg ({from} to {to}).',
      volume: 'Most work went to {group}: {n} sets.', strength: 'Estimated 1RM {from} to {to} kg ({d})', weightTrend: 'Trend: {d} kg in this range',
    },
    kpi: { workouts: 'Workouts', sets: 'Sets', prs: 'New records', weight: 'Weight change' },
    chartAxis: 'Chart axis: {a} to {b}', showAll: 'Show all ({n})', prsRecent: 'New', prsReps: '{n} reps best', prsHold: '{n} s hold', unlocked: '{a} of {b} unlocked', lockedAria: 'Locked achievement', moreWeighIns: 'Earlier weigh-ins ({n})',
    range: 'Time range', date: 'Date', week: 'Week', workouts: 'Workouts', group: 'Muscle group',
    consistency: { title: 'Consistency', sessions: 'workouts in this range', aria: '{done} workouts out of {total} planned in this range', none: 'No workouts logged in this range.', goal: 'Weekly goal: {n} workouts', weeks: 'Workouts per week', weeksAria: 'Bar chart of workouts per week' },
    volume: { title: 'Sets per muscle group', hint: 'Counts every logged set by the main muscle group it trains.', aria: 'Bar chart of logged sets per muscle group' },
    strength: { title: 'Strength curves', hint: 'Estimated one-rep max per session, for exercises with at least two logged days.', minor: 'Strength estimates are not shown for users under 18.', aria: '{name}: estimated 1RM from {from} to {to} kg' },
    weight: {
      title: 'Body weight', today: "Today's weight", add: 'Save weight', saved: 'Weight saved', raw: 'Weigh-ins', trend: 'Smoothed trend', aria: 'Line chart of {n} weigh-ins, from {from} to {to} kg',
      needMore: 'At least two weigh-ins are needed to draw a trend.', suggestionTitle: 'Calorie suggestion', suggestionKcal: 'Daily target {from} to {to} kcal ({delta})',
      reason: {
        loss_too_slow: 'Weight is dropping slower than a steady pace. A small calorie cut could help.', loss_too_fast: 'Weight is dropping faster than recommended. Adding calories helps protect muscle and energy.',
        gain_too_slow: 'Weight is rising slower than needed for your goal. A small calorie increase could help.', gain_too_fast: 'Weight is rising faster than needed. A small calorie cut could keep the gain lean.',
      },
      suggestionOnly: 'Suggestion only. Nothing changes unless you edit your target.', editTarget: 'Edit target', deleteEntry: 'Delete weigh-in from {date}', deleteTitle: 'Delete weigh-in?', deleteBody: 'The {kg} kg entry from {date} will be removed.',
    },
    nutrition: { title: 'Nutrition adherence', loggedDays: 'Days logged', proteinDays: 'Days on protein target', avgKcal: 'Average calories', avgProtein: 'Average protein (g)', target: '(target {n})' },
    prs: { title: 'Personal records', est1rm: 'Est. 1RM' },
    xp: { title: 'Level and XP', level: 'Level', xp: 'XP', bar: '{a} of {b} XP in this level', toNext: '{n} XP to the next level' },
    ach: { title: 'Achievements', locked: 'Locked', unlockedSr: 'Unlocked' },
    glossary: {
      title: 'Glossary',
      rpe: { term: 'RPE', def: 'Rate of perceived exertion, 1 to 10. RPE 8 means about two reps left in the tank.' },
      oneRm: { term: '1RM', def: 'One-rep max: the heaviest weight you could lift once. Here it is estimated from your sets.' },
      pr: { term: 'PR', def: 'Personal record: your best weight, reps or time for an exercise.' },
      deload: { term: 'Deload', def: 'A planned lighter week that lets your body recover so progress can continue.' },
      tdee: { term: 'TDEE', def: 'Total daily energy expenditure: the calories you burn in a day including activity.' },
      bmr: { term: 'BMR', def: 'Basal metabolic rate: calories your body burns at complete rest.' },
      volume: { term: 'Volume', def: 'Total work, usually the number of hard sets (or sets times reps times weight).' },
      tally: { term: 'Tally marks', def: 'Four strokes and a diagonal make a group of five workouts. Each mark is a real finished session.' },
    },
  },
  notifications: {
    generic: 'Notification', unreadCount: '{n} unread', group: { today: 'Today', week: 'Earlier this week', earlier: 'Earlier' }, markAll: 'Mark all as read', empty: 'No notifications yet', emptyHint: 'Unlocked achievements show up here.', unread: 'Unread',
    localReminders: 'Workout and meal reminders are local: they are scheduled on this device and are not sent from a server.',
  },
}, {
  progress: {
    take: {
      empty: 'אחרי האימון הראשון ההתקדמות תופיע כאן.', sessions: 'בטווח הזה: {n} אימונים, {g} מתוכננים.', sessionsNoGoal: 'בטווח הזה: {n} אימונים.', weight: 'משקל הגוף השתנה ב-{d} ק״ג ({from} עד {to}).',
      volume: 'רוב העבודה הלכה על {group}: {n} סטים.', strength: 'הערכת 1RM {from} עד {to} ק״ג ({d})', weightTrend: 'מגמה: {d} ק״ג בטווח הזה',
    },
    kpi: { workouts: 'אימונים', sets: 'סטים', prs: 'שיאים חדשים', weight: 'שינוי משקל' },
    chartAxis: 'ציר התרשים: {a} עד {b}', showAll: 'להצגת הכול ({n})', prsRecent: 'חדש', prsReps: 'שיא {n} חזרות', prsHold: 'החזקה {n} שנ׳', unlocked: '{a} מתוך {b} נפתחו', lockedAria: 'הישג נעול', moreWeighIns: 'שקילות קודמות ({n})',
    range: 'טווח זמן', date: 'תאריך', week: 'שבוע', workouts: 'אימונים', group: 'קבוצת שרירים',
    consistency: { title: 'עקביות', sessions: 'אימונים בטווח הזה', aria: '{done} אימונים מתוך {total} מתוכננים בטווח הזה', none: 'לא תועדו אימונים בטווח הזה.', goal: 'יעד שבועי: {n} אימונים', weeks: 'אימונים בכל שבוע', weeksAria: 'תרשים עמודות של אימונים לפי שבוע' },
    volume: { title: 'סטים לפי קבוצת שרירים', hint: 'כל סט שתועד נספר לפי קבוצת השרירים הראשית שהוא מאמן.', aria: 'תרשים עמודות של סטים שתועדו לפי קבוצת שרירים' },
    strength: { title: 'עקומות כוח', hint: 'הערכת מקסימום חזרה אחת לכל אימון, לתרגילים עם לפחות שני ימי תיעוד.', minor: 'הערכות כוח לא מוצגות למתחת לגיל 18.', aria: '{name}: הערכת 1RM מ-{from} עד {to} ק״ג' },
    weight: {
      title: 'משקל גוף', today: 'המשקל של היום', add: 'שמירת משקל', saved: 'המשקל נשמר', raw: 'שקילות', trend: 'מגמה מוחלקת', aria: 'תרשים קו של {n} שקילות, מ-{from} עד {to} ק״ג',
      needMore: 'כדי לצייר מגמה צריך לפחות שתי שקילות.', suggestionTitle: 'הצעה לקלוריות', suggestionKcal: 'יעד יומי {from} עד {to} קק״ל ({delta})',
      reason: {
        loss_too_slow: 'הירידה במשקל איטית מקצב יציב. הפחתה קטנה בקלוריות יכולה לעזור.', loss_too_fast: 'הירידה במשקל מהירה מהמומלץ. תוספת קלוריות תעזור לשמור על שריר ואנרגיה.',
        gain_too_slow: 'העלייה במשקל איטית מהנדרש ליעד. תוספת קטנה בקלוריות יכולה לעזור.', gain_too_fast: 'העלייה במשקל מהירה מהנדרש. הפחתה קטנה בקלוריות תשמור על עלייה נקייה.',
      },
      suggestionOnly: 'זו הצעה בלבד. שום דבר לא משתנה בלי עריכת היעד.', editTarget: 'עריכת היעד', deleteEntry: 'מחיקת שקילה מ-{date}', deleteTitle: 'למחוק את השקילה?', deleteBody: 'הרישום של {kg} ק״ג מ-{date} יימחק.',
    },
    nutrition: { title: 'עמידה ביעדי תזונה', loggedDays: 'ימי תיעוד', proteinDays: 'ימים ביעד החלבון', avgKcal: 'ממוצע קלוריות', avgProtein: 'ממוצע חלבון (ג׳)', target: '(יעד {n})' },
    prs: { title: 'שיאים אישיים', est1rm: 'הערכת 1RM' },
    xp: { title: 'רמה ו-XP', level: 'רמה', xp: 'XP', bar: '{a} מתוך {b} XP ברמה הזו', toNext: '{n} XP לרמה הבאה' },
    ach: { title: 'הישגים', locked: 'נעול', unlockedSr: 'נפתח' },
    glossary: {
      title: 'מילון מונחים',
      rpe: { term: 'RPE', def: 'דירוג מאמץ נתפס, 1 עד 10. RPE 8 אומר שנשארו בערך שתי חזרות במאגר.' },
      oneRm: { term: '1RM', def: 'מקסימום חזרה אחת: המשקל הכבד ביותר שאפשר להרים פעם אחת. כאן הוא מוערך מהסטים שלכם.' },
      pr: { term: 'PR', def: 'שיא אישי: המשקל, החזרות או הזמן הטובים ביותר שלכם בתרגיל.' },
      deload: { term: 'דילואד', def: 'שבוע קל מתוכנן שמאפשר לגוף להתאושש כדי שההתקדמות תימשך.' },
      tdee: { term: 'TDEE', def: 'ההוצאה האנרגטית היומית הכוללת: הקלוריות שנשרפות ביום כולל פעילות.' },
      bmr: { term: 'BMR', def: 'קצב חילוף חומרים בסיסי: הקלוריות שהגוף שורף במנוחה מלאה.' },
      volume: { term: 'נפח', def: 'סך העבודה, בדרך כלל מספר הסטים הקשים (או סטים כפול חזרות כפול משקל).' },
      tally: { term: 'סימוני ספירה', def: 'ארבעה קווים ואלכסון הם קבוצה של חמישה אימונים. כל סימון הוא אימון שהסתיים בפועל.' },
    },
  },
  notifications: {
    generic: 'התראה', unreadCount: '{n} שלא נקראו', group: { today: 'היום', week: 'מוקדם יותר השבוע', earlier: 'קודם' }, markAll: 'סימון הכול כנקרא', empty: 'אין התראות עדיין', emptyHint: 'הישגים שנפתחו יופיעו כאן.', unread: 'לא נקרא',
    localReminders: 'תזכורות לאימון ולארוחות הן מקומיות: הן נקבעות במכשיר הזה ולא נשלחות משרת.',
  },
});
