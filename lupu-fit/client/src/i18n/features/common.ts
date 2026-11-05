import { defineFeature } from '../core.ts';

export default defineFeature({
  app: { name: 'LUPU-FIT', tagline: 'Know exactly what to train today.', loading: 'Loading…', retry: 'Retry', offline: 'You are offline. Changes will sync when you reconnect.' },
  lang: { switchTo: 'Switch language', short: 'EN', other: 'עב', current: 'English' },
  nav: { home: 'Home', workouts: 'Workouts', nutrition: 'Nutrition', coach: 'Coach', progress: 'Progress', exercises: 'Exercises', profile: 'Profile', notifications: 'Notifications', menu: 'Main navigation', skip: 'Skip to content', activeWorkout: 'Workout in progress: resume' },
  action: {
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', back: 'Back', next: 'Next', done: 'Done', close: 'Close', confirm: 'Confirm', add: 'Add', remove: 'Remove',
    undo: 'Undo', start: 'Start', finish: 'Finish', skip: 'Skip', search: 'Search', clear: 'Clear', copy: 'Copy', share: 'Share', download: 'Download', upload: 'Upload', more: 'More', seeAll: 'See all', open: 'Open', apply: 'Apply',
  },
  state: { empty: 'Nothing here yet', noData: 'Not enough data yet', error: 'Something went wrong', saved: 'Saved', deleted: 'Deleted', required: 'Required', invalid: 'Invalid value', loadFailed: 'Could not load this. Try again.' },
  unit: { kg: 'kg', cm: 'cm', kcal: 'kcal', g: 'g', min: 'min', sec: 'sec', reps: 'reps', sets: 'sets', years: 'years', perWeek: '/week', percent: '%', m: 'm' },
  date: { today: 'Today', yesterday: 'Yesterday', tomorrow: 'Tomorrow', days: { d7: '7 days', d30: '30 days', d90: '90 days' } },
  error: {
    network: 'No connection. Check your network and try again.', unauthorized: 'Please sign in again.', invalid_credentials: 'Wrong username or password.', invalid_language: 'That language is not supported.', too_many_attempts: 'Too many attempts. Try again in a while.',
    username_taken: 'This username is already taken. Try another one.', validation_error: 'Some fields are not valid.', quota_exceeded: 'You reached the message limit. Try again later.', rate_limited: 'Too many requests. Slow down a little.',
    not_found: 'Not found.', internal_error: 'Server error. Try again.', payload_too_large: 'The file is too large.', ai_unavailable: 'AI is not available right now.', csrf_invalid: 'Session expired. Reload the page.',
    session_in_progress: 'A workout is already in progress.', lookup_failed: 'Lookup failed. Check your connection.', product_not_found: 'Product not found.', generic: 'Request failed.',
    bad_request: 'That request was not valid.', forbidden: 'You do not have access to this.', date_required: 'Pick a date first.', range_required: 'Pick a date range first.',
    macros_exceed_100g: 'The macros add up to more than 100 g per 100 g. Check the values.', ai_busy: 'AI is busy right now. Try again in a moment.', ai_failed: 'AI could not complete this. Try again.',
    invalid_media: 'This file type is not supported.', invalid_barcode: 'This barcode is not valid.', no_nutrition_data: 'This product has no nutrition data.', bad_estimate: 'Could not estimate this meal. Add it manually.',
    unknown_exercise: 'That exercise was not found.', session_finished: 'This workout is already finished.', too_many_sets: 'Too many sets in one exercise.', too_many_exercises: 'Too many exercises in one workout.',
    exercise_has_sets: 'This exercise already has logged sets.', profile_required: 'Complete your profile first.',
  },
  disclaimer: { health: 'This app gives general fitness information, not medical advice. Stop and see a professional if you feel pain, dizziness or chest discomfort.', allergen: 'Allergen filtering is automatic and conservative. Always verify ingredients yourself.' },
}, {
  app: { name: 'LUPU-FIT', tagline: 'לדעת בדיוק מה מתאמנים היום.', loading: 'טוען…', retry: 'לנסות שוב', offline: 'אין חיבור. השינויים יסונכרנו כשהחיבור יחזור.' },
  lang: { switchTo: 'החלפת שפה', short: 'עב', other: 'EN', current: 'עברית' },
  nav: { home: 'בית', workouts: 'אימונים', nutrition: 'תזונה', coach: 'מאמן', progress: 'התקדמות', exercises: 'תרגילים', profile: 'פרופיל', notifications: 'התראות', menu: 'ניווט ראשי', skip: 'דילוג לתוכן', activeWorkout: 'אימון פעיל: להמשך' },
  action: {
    save: 'שמירה', cancel: 'ביטול', delete: 'מחיקה', edit: 'עריכה', back: 'חזרה', next: 'הבא', done: 'סיום', close: 'סגירה', confirm: 'אישור', add: 'הוספה', remove: 'הסרה',
    undo: 'ביטול פעולה', start: 'התחלה', finish: 'סיום', skip: 'דילוג', search: 'חיפוש', clear: 'ניקוי', copy: 'העתקה', share: 'שיתוף', download: 'הורדה', upload: 'העלאה', more: 'עוד', seeAll: 'לכל הרשימה', open: 'פתיחה', apply: 'החלה',
  },
  state: { empty: 'אין כאן כלום עדיין', noData: 'אין מספיק נתונים עדיין', error: 'משהו השתבש', saved: 'נשמר', deleted: 'נמחק', required: 'שדה חובה', invalid: 'ערך לא תקין', loadFailed: 'לא הצלחנו לטעון. כדאי לנסות שוב.' },
  unit: { kg: 'ק״ג', cm: 'ס״מ', kcal: 'קק״ל', g: 'ג׳', min: 'דק׳', sec: 'שנ׳', reps: 'חזרות', sets: 'סטים', years: 'שנים', perWeek: 'בשבוע', percent: '%', m: 'מ׳' },
  date: { today: 'היום', yesterday: 'אתמול', tomorrow: 'מחר', days: { d7: '7 ימים', d30: '30 יום', d90: '90 יום' } },
  error: {
    network: 'אין חיבור. כדאי לבדוק את הרשת ולנסות שוב.', unauthorized: 'כדאי להתחבר מחדש.', invalid_credentials: 'שם המשתמש או הסיסמה שגויים.', invalid_language: 'השפה הזו אינה נתמכת.', too_many_attempts: 'יותר מדי ניסיונות. כדאי לנסות שוב בעוד זמן מה.',
    username_taken: 'שם המשתמש הזה כבר תפוס. כדאי לנסות אחר.', validation_error: 'חלק מהשדות אינם תקינים.', quota_exceeded: 'הגעתם למכסת ההודעות. כדאי לנסות מאוחר יותר.', rate_limited: 'יותר מדי בקשות. כדאי להאט מעט.',
    not_found: 'לא נמצא.', internal_error: 'שגיאת שרת. כדאי לנסות שוב.', payload_too_large: 'הקובץ גדול מדי.', ai_unavailable: 'ה-AI אינו זמין כרגע.', csrf_invalid: 'פג תוקף ההפעלה. כדאי לרענן את הדף.',
    session_in_progress: 'כבר יש אימון פעיל.', lookup_failed: 'החיפוש נכשל. כדאי לבדוק את החיבור.', product_not_found: 'המוצר לא נמצא.', generic: 'הבקשה נכשלה.',
    bad_request: 'הבקשה אינה תקינה.', forbidden: 'אין הרשאה לפעולה הזו.', date_required: 'כדאי לבחור תאריך קודם.', range_required: 'כדאי לבחור טווח תאריכים קודם.',
    macros_exceed_100g: 'סכום המאקרו גדול מ-100 ג׳ ל-100 ג׳. כדאי לבדוק את הערכים.', ai_busy: 'ה-AI עסוק כרגע. כדאי לנסות שוב בעוד רגע.', ai_failed: 'ה-AI לא הצליח להשלים. כדאי לנסות שוב.',
    invalid_media: 'סוג הקובץ אינו נתמך.', invalid_barcode: 'הברקוד אינו תקין.', no_nutrition_data: 'למוצר הזה אין נתוני תזונה.', bad_estimate: 'לא הצלחנו להעריך את הארוחה. כדאי להוסיף ידנית.',
    unknown_exercise: 'התרגיל לא נמצא.', session_finished: 'האימון הזה כבר הסתיים.', too_many_sets: 'יותר מדי סטים בתרגיל אחד.', too_many_exercises: 'יותר מדי תרגילים באימון אחד.',
    exercise_has_sets: 'בתרגיל הזה כבר תועדו סטים.', profile_required: 'כדאי להשלים את הפרופיל קודם.',
  },
  disclaimer: { health: 'האפליקציה נותנת מידע כללי על כושר ואינה ייעוץ רפואי. במקרה של כאב, סחרחורת או אי נוחות בחזה, לעצור ולפנות לאיש מקצוע.', allergen: 'סינון האלרגנים אוטומטי ושמרני. תמיד כדאי לוודא את הרכיבים בעצמכם.' },
});
