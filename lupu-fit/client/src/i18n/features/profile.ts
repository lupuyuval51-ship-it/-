import { defineFeature } from '../core.ts';

export default defineFeature({
  profile: {
    nu: { body: 'Body and goals', prefs: 'Preferences', storage: 'Videos and storage', day: 'day', moreSetup: 'Equipment, injuries and restrictions', advancedKcal: 'Advanced: custom calorie target', instantHint: 'Language and theme apply immediately. Name and units are saved with Save.', redoHint: 'Update your goals and details step by step', saved: 'No changes to save', danger: 'Danger zone', deleteHint: 'Deleting your account removes all your data. You will be asked to confirm on the next screen.', exportHint: 'Download everything as a JSON file', shareHint: 'Send the backup file to another app', restoreHint: 'Replace current data with a backup file' },
    ml: {
      title: 'Language', builtInOnly: 'Hebrew and English are built into the app. Other languages need an AI translation service, which this version does not use.', more: 'Translate the app to another language', moreHint: 'Any language. Done once with machine translation, then saved on this device.', note: 'Machine translation may be imperfect. Exercise and food names stay in English or Hebrew unless translated, and legal pages stay in their original language.',
      sheetTitle: 'Translate the app', search: 'Search languages', noMatch: 'No matching language', other: 'Other language', otherHint: 'Type any language name, in any script', otherGo: 'Translate', otherBad: 'Enter a language name (letters only).',
      downloaded: 'On this device', use: 'Use', del: 'Delete', delLabel: 'Delete {lang} to free space', deleted: '{lang} removed from this device', active: 'In use', now: 'Showing: {lang} (machine translated)', switched: 'App language: {lang}',
      progress: 'Translating {lang}: part {n} of {total}', preparing: 'Preparing…', cancel: 'Cancel', cancelled: 'Cancelled. Finished parts are saved, so you can continue later.', cached: 'Loaded from this device. No internet needed.',
      partial: '{n} texts could not be translated and stay in English.', needAi: 'Translation needs an internet connection and an AI service.', busy: 'The translation service is busy. Try again in a moment.', quota: 'Translation limit reached for now. Try again later.', failed: 'Translation failed. Finished parts are saved; retry to continue.',
      strings: '{n} texts',
    },
    title: 'Profile', redo: 'Redo the questionnaire', needOnboarding: 'Finish the questionnaire to see your profile.', saved: 'Profile saved', saving: 'Saving…',
    targets: 'Daily targets', bmr: 'BMR (kcal)', tdee: 'TDEE (kcal)', targetsNote: 'Estimates from standard formulas. Safety floors always apply.',
    clamped: 'You asked for {asked} kcal, but the safe target for you is {got} kcal. Targets never go below the safety floor for your age and sex.',
    customKcalHint: 'Leave empty to use the calculated target. Values below the safety floor are raised automatically.', clearCustomKcal: 'Use calculated target',
    imperialHint: '≈ {lb} lb · {ft} ft {inch} in', lang: { he: 'עברית', en: 'English' }, theme: { dark: 'Dark', light: 'Light', system: 'System' }, units: { metric: 'Metric', imperial: 'Imperial' },
    f: {
      displayName: 'Display name', language: 'Language', theme: 'Theme', units: 'Units', sex: 'Sex', age: 'Age', height: 'Height', weight: 'Weight', goal: 'Goal', experience: 'Experience', place: 'Where you train',
      days: 'Days per week', minutes: 'Minutes per session', activity: 'Daily activity', equipment: 'Equipment', injuries: 'Injuries to work around', diet: 'Diet', allergies: 'Allergies', restrictions: 'Restrictions', customKcal: 'Custom calorie target',
    },
    note: {
      minor_no_deficit: 'For ages 13 to 17 the calorie target is never below maintenance.', floor_applied: 'The calorie target was raised to the safe minimum.', custom_clamped: 'Your custom calorie target was adjusted to stay safe.',
      carb_floor_raised_kcal: 'Carbs were kept at a minimum, which raised calories slightly.', bmi_adjusted_protein: 'Protein is based on an adjusted body weight.', deficit_capped_at_bmr: 'The deficit was limited so calories stay at or above your BMR.',
    },
    video: {
      title: 'Exercise videos', wifiOnly: 'Autoplay on Wi-Fi only', wifiHint: 'Videos will not autoplay on mobile data. You can still tap to play.', cacheSize: 'Offline video cache', mb: 'MB', budget: 'Cache limit', clear: 'Clear video cache',
      cleared: 'Video cache cleared', noSw: 'The offline cache is not available right now.',
    },
    backup: {
      title: 'Backup and restore', hint: 'Export your data as a file, or restore from a previous export.', export: 'Export data', exported: 'Export ready', restore: 'Restore from file', pick: 'Choose a backup file',
      notJson: 'This file is not valid JSON.', wrongFile: 'This is not a LUPU-FIT backup file.', invalid: 'This is not a valid LUPU-FIT backup (problem at: {path}).', unreadable: 'The file could not be read.', rejected: 'The server rejected this backup as invalid.',
      newer: 'This backup was made by a newer version of the app (file format {v}). Update the app, then try again.', tooLarge: 'This file is too large to restore (the limit is {mb} MB).',
      confirmTitle: 'Restore backup?',
      confirmBody: 'Restoring REPLACES everything in the app with the contents of this file: your profile, workouts, food log, weight entries, check-ins, plans, saved meals, your own foods and coach chats. Anything you added after this backup was made is lost. This cannot be undone.',
      confirmBodyV1: 'This file comes from an older version of the app. Restoring replaces your profile, workouts, food log and weight entries with its contents. Anything you added after it was made is lost. This cannot be undone.',
      confirmFile: 'The file was exported on {date} and contains:', confirmV2Extra: 'XP, personal records, achievements and notifications are replaced together with the workouts.',
      confirmKeep: 'This older file has no plans, saved meals, own foods, coach chats, check-ins or XP. Those stay exactly as they are now.',
      confirmGo: 'Replace my data', restoredToast: 'Backup restored',
      item: {
        profile: 'Profile', settings: 'Settings of this device', workouts: 'Workouts: {n}', foods: 'Food log entries: {n}', weights: 'Weight entries: {n}', readiness: 'Readiness check-ins: {n}',
        plans: 'Training plans: {n}', savedMeals: 'Saved meals: {n}', customFoods: 'Your own foods: {n}', coach: 'Coach chats: {n} ({m} messages)',
      },
      done: { title: 'Backup restored', skipped: 'Not restored', untouched: 'Left as it was, because this older file does not have them: {list}.' },
      skip: {
        profile: 'The profile in the file was not applied: a profile of a minor is never replaced by an adult one.', unknownExercises: 'Exercises this app version does not know: {n}',
        unfinishedWorkouts: 'Workouts that were still in progress: {n}', duplicateDays: 'Days that appeared twice (the last one was kept): {n}', invalidItems: 'Foods with impossible values: {n}',
        xpEvents: 'XP entries the restored data does not support: {n}', achievements: 'Unknown achievements: {n}',
      },
      section: { profile: 'profile', weights: 'weight entries', readiness: 'check-ins', food: 'food log', workouts: 'workouts', plans: 'training plans', savedMeals: 'saved meals', customFoods: 'your own foods', coach: 'coach chats', xp: 'XP and achievements', notifications: 'notifications' },
    },
    account: {
      title: 'Account and app', mode: 'Data stored', modeDevice: 'On this device', modeHosted: 'In your account', version: 'App version', privacy: 'Privacy', terms: 'Terms', delete: 'Delete account',
      logout: 'Sign out', deviceNote: 'Your data stays on this device. There is no account, no sign-in and no cloud copy.',
    },
  },
}, {
  profile: {
    nu: { body: 'גוף ומטרות', prefs: 'העדפות', storage: 'סרטונים ואחסון', day: 'יום', moreSetup: 'ציוד, פציעות והגבלות', advancedKcal: 'מתקדם: יעד קלוריות מותאם', instantHint: 'שפה ועיצוב משתנים מיד. שם ויחידות נשמרים עם כפתור השמירה.', redoHint: 'עדכון המטרות והפרטים צעד אחר צעד', saved: 'אין שינויים לשמירה', danger: 'פעולות בלתי הפיכות', deleteHint: 'מחיקת החשבון מסירה את כל הנתונים שלכם. במסך הבא תתבקשו לאשר.', exportHint: 'הורדת כל הנתונים כקובץ JSON', shareHint: 'שליחת קובץ הגיבוי לאפליקציה אחרת', restoreHint: 'החלפת הנתונים הנוכחיים בקובץ גיבוי' },
    ml: {
      title: 'שפה', builtInOnly: 'עברית ואנגלית מובנות באפליקציה. שפות אחרות דורשות שירות תרגום מבוסס AI, שהגרסה הזו לא משתמשת בו.', more: 'לתרגם את האפליקציה לשפה אחרת', moreHint: 'כל שפה. תרגום מכונה חד-פעמי, ואז נשמר במכשיר הזה.', note: 'תרגום מכונה עלול להיות לא מדויק. שמות של תרגילים ומזונות נשארים בעברית או באנגלית אלא אם תורגמו, והמסמכים המשפטיים נשארים בשפת המקור.',
      sheetTitle: 'תרגום האפליקציה', search: 'חיפוש שפה', noMatch: 'לא נמצאה שפה מתאימה', other: 'שפה אחרת', otherHint: 'אפשר להקליד שם של כל שפה, בכל כתב', otherGo: 'לתרגם', otherBad: 'יש להזין שם שפה (אותיות בלבד).',
      downloaded: 'במכשיר הזה', use: 'להשתמש', del: 'למחוק', delLabel: 'מחיקת {lang} לפינוי מקום', deleted: '{lang} הוסרה מהמכשיר', active: 'בשימוש', now: 'מוצגת: {lang} (תרגום מכונה)', switched: 'שפת האפליקציה: {lang}',
      progress: 'מתרגמים {lang}: חלק {n} מתוך {total}', preparing: 'מכינים…', cancel: 'ביטול', cancelled: 'בוטל. החלקים שהסתיימו נשמרו, אפשר להמשיך אחר כך.', cached: 'נטען מהמכשיר. לא צריך אינטרנט.',
      partial: '{n} טקסטים לא תורגמו ונשארים באנגלית.', needAi: 'התרגום דורש חיבור לאינטרנט ושירות בינה מלאכותית.', busy: 'שירות התרגום עמוס. כדאי לנסות שוב בעוד רגע.', quota: 'מגבלת התרגום נוצלה כרגע. כדאי לנסות שוב מאוחר יותר.', failed: 'התרגום נכשל. החלקים שהסתיימו נשמרו; אפשר לנסות שוב כדי להמשיך.',
      strings: '{n} טקסטים',
    },
    title: 'פרופיל', redo: 'מילוי השאלון מחדש', needOnboarding: 'כדי לראות פרופיל צריך להשלים את השאלון.', saved: 'הפרופיל נשמר', saving: 'שמירה…',
    targets: 'יעדים יומיים', bmr: 'BMR (קק״ל)', tdee: 'TDEE (קק״ל)', targetsNote: 'הערכות לפי נוסחאות סטנדרטיות. המינימום הבטוח תמיד נשמר.',
    clamped: 'ביקשתם {asked} קק״ל, אבל היעד הבטוח עבורכם הוא {got} קק״ל. היעד אף פעם לא יורד מתחת למינימום הבטוח לפי הגיל והמין.',
    customKcalHint: 'להשאיר ריק כדי להשתמש ביעד המחושב. ערכים מתחת למינימום הבטוח מועלים אוטומטית.', clearCustomKcal: 'שימוש ביעד המחושב',
    imperialHint: '≈ {lb} ליברות · {ft} רגל {inch} אינץ׳', lang: { he: 'עברית', en: 'English' }, theme: { dark: 'כהה', light: 'בהיר', system: 'לפי המערכת' }, units: { metric: 'מטרי', imperial: 'אימפריאלי' },
    f: {
      displayName: 'שם לתצוגה', language: 'שפה', theme: 'עיצוב', units: 'יחידות', sex: 'מין', age: 'גיל', height: 'גובה', weight: 'משקל', goal: 'מטרה', experience: 'ניסיון', place: 'איפה מתאמנים',
      days: 'ימים בשבוע', minutes: 'דקות לאימון', activity: 'פעילות יומית', equipment: 'ציוד', injuries: 'פציעות שצריך לעבוד סביבן', diet: 'תזונה', allergies: 'אלרגיות', restrictions: 'הגבלות', customKcal: 'יעד קלוריות מותאם',
    },
    note: {
      minor_no_deficit: 'בגילאי 13 עד 17 יעד הקלוריות לעולם אינו נמוך מרמת התחזוקה.', floor_applied: 'יעד הקלוריות הועלה למינימום הבטוח.', custom_clamped: 'יעד הקלוריות המותאם שלכם תוקן כדי להישאר בטוח.',
      carb_floor_raised_kcal: 'הפחמימות נשמרו במינימום, מה שהעלה מעט את הקלוריות.', bmi_adjusted_protein: 'החלבון מחושב לפי משקל מתוקן.', deficit_capped_at_bmr: 'הגירעון הוגבל כך שהקלוריות יישארו ברמת BMR לפחות.',
    },
    video: {
      title: 'סרטוני תרגילים', wifiOnly: 'ניגון אוטומטי ב-Wi-Fi בלבד', wifiHint: 'סרטונים לא יתנגנו אוטומטית בגלישה סלולרית. אפשר עדיין ללחוץ לניגון.', cacheSize: 'מטמון סרטונים לא מקוון', mb: 'מ״ב', budget: 'מגבלת מטמון', clear: 'ניקוי מטמון הסרטונים',
      cleared: 'מטמון הסרטונים נוקה', noSw: 'המטמון הלא מקוון אינו זמין כרגע.',
    },
    backup: {
      title: 'גיבוי ושחזור', hint: 'אפשר לייצא את הנתונים לקובץ, או לשחזר מייצוא קודם.', export: 'ייצוא נתונים', exported: 'הייצוא מוכן', restore: 'שחזור מקובץ', pick: 'בחירת קובץ גיבוי',
      notJson: 'הקובץ הזה אינו JSON תקין.', wrongFile: 'זה אינו קובץ גיבוי של LUPU-FIT.', invalid: 'זה אינו גיבוי תקין של LUPU-FIT (הבעיה ב: {path}).', unreadable: 'לא ניתן היה לקרוא את הקובץ.', rejected: 'השרת דחה את הגיבוי הזה כלא תקין.',
      newer: 'הגיבוי נוצר בגרסה חדשה יותר של האפליקציה (פורמט קובץ {v}). כדאי לעדכן את האפליקציה ולנסות שוב.', tooLarge: 'הקובץ גדול מדי לשחזור (המגבלה היא {mb} מ״ב).',
      confirmTitle: 'לשחזר גיבוי?',
      confirmBody: 'השחזור מחליף את כל מה שיש כרגע באפליקציה בתוכן הקובץ: הפרופיל, האימונים, יומן האוכל, רשומות המשקל, בדיקות המוכנות, התוכניות, הארוחות השמורות, המזונות האישיים ושיחות המאמן. מה שנוסף אחרי יצירת הגיבוי יימחק. אי אפשר לבטל.',
      confirmBodyV1: 'הקובץ הזה הגיע מגרסה ישנה של האפליקציה. השחזור מחליף את הפרופיל, האימונים, יומן האוכל ורשומות המשקל בתוכן הקובץ. מה שנוסף אחרי יצירתו יימחק. אי אפשר לבטל.',
      confirmFile: 'הקובץ יוצא ב-{date} ומכיל:', confirmV2Extra: 'נקודות ניסיון, שיאים אישיים, הישגים והתראות מוחלפים יחד עם האימונים.',
      confirmKeep: 'בקובץ הישן הזה אין תוכניות, ארוחות שמורות, מזונות אישיים, שיחות מאמן, בדיקות מוכנות או נקודות ניסיון. הם יישארו בדיוק כפי שהם עכשיו.',
      confirmGo: 'החלפת הנתונים שלי', restoredToast: 'הגיבוי שוחזר',
      item: {
        profile: 'פרופיל', settings: 'הגדרות של המכשיר הזה', workouts: 'אימונים: {n}', foods: 'רשומות יומן אוכל: {n}', weights: 'רשומות משקל: {n}', readiness: 'בדיקות מוכנות: {n}',
        plans: 'תוכניות אימון: {n}', savedMeals: 'ארוחות שמורות: {n}', customFoods: 'מזונות אישיים: {n}', coach: 'שיחות מאמן: {n} ({m} הודעות)',
      },
      done: { title: 'הגיבוי שוחזר', skipped: 'לא שוחזר', untouched: 'נשאר כפי שהיה, כי בקובץ הישן הזה אין אותו: {list}.' },
      skip: {
        profile: 'הפרופיל שבקובץ לא הוחל: פרופיל של קטין לעולם לא מוחלף בפרופיל של מבוגר.', unknownExercises: 'תרגילים שהגרסה הזו של האפליקציה לא מכירה: {n}',
        unfinishedWorkouts: 'אימונים שהיו עדיין באמצע: {n}', duplicateDays: 'ימים שהופיעו פעמיים (נשמרה הרשומה האחרונה): {n}', invalidItems: 'מזונות עם ערכים בלתי אפשריים: {n}',
        xpEvents: 'רשומות נקודות ניסיון שהנתונים ששוחזרו לא תומכים בהן: {n}', achievements: 'הישגים לא מוכרים: {n}',
      },
      section: { profile: 'פרופיל', weights: 'רשומות משקל', readiness: 'בדיקות מוכנות', food: 'יומן אוכל', workouts: 'אימונים', plans: 'תוכניות אימון', savedMeals: 'ארוחות שמורות', customFoods: 'מזונות אישיים', coach: 'שיחות מאמן', xp: 'נקודות ניסיון והישגים', notifications: 'התראות' },
    },
    account: {
      title: 'חשבון ואפליקציה', mode: 'אחסון הנתונים', modeDevice: 'במכשיר הזה', modeHosted: 'בחשבון שלכם', version: 'גרסת האפליקציה', privacy: 'פרטיות', terms: 'תנאי שימוש', delete: 'מחיקת חשבון',
      logout: 'התנתקות', deviceNote: 'הנתונים נשארים על המכשיר הזה. אין חשבון, אין התחברות ואין עותק בענן.',
    },
  },
});
