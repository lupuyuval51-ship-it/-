import { defineFeature } from '../core.ts';

export default defineFeature({
  profile: {
    nu: { body: 'Body and goals', prefs: 'Preferences', storage: 'Videos and storage', day: 'day', moreSetup: 'Equipment, injuries and restrictions', advancedKcal: 'Advanced: custom calorie target', instantHint: 'Language and theme apply immediately. Name and units are saved with Save.', redoHint: 'Update your goals and details step by step', saved: 'No changes to save', danger: 'Danger zone', deleteHint: 'Deleting your account removes all your data. You will be asked to confirm on the next screen.', exportHint: 'Download everything as a JSON file', shareHint: 'Send the backup file to another app', restoreHint: 'Replace current data with a backup file' },
    ml: {
      title: 'Language', more: 'Translate the app to another language', moreHint: 'Any language. Done once with machine translation, then saved on this device.', note: 'Machine translation may be imperfect. Exercise and food names stay in English or Hebrew unless translated, and legal pages stay in their original language.',
      sheetTitle: 'Translate the app', search: 'Search languages', noMatch: 'No matching language', other: 'Other language', otherHint: 'Type any language name, in any script', otherGo: 'Translate', otherBad: 'Enter a language name (letters only).',
      downloaded: 'On this device', use: 'Use', del: 'Delete', delLabel: 'Delete {lang} to free space', deleted: '{lang} removed from this device', active: 'In use', now: 'Showing: {lang} (machine translated)', switched: 'App language: {lang}',
      progress: 'Translating {lang}: part {n} of {total}', preparing: 'Preparing…', cancel: 'Cancel', cancelled: 'Cancelled. Finished parts are saved, so you can continue later.', cached: 'Loaded from this device. No internet needed.',
      partial: '{n} texts could not be translated and stay in English.', needAi: 'Translation needs an internet connection and an AI service.', busy: 'The translation service is busy. Try again in a moment.', quota: 'Translation limit reached for now. Try again later.', failed: 'Translation failed. Finished parts are saved; retry to continue.',
      strings: '{n} texts', rtl: 'Right-to-left',
    },
    title: 'Profile', redo: 'Redo the questionnaire', needOnboarding: 'Finish the questionnaire to see your profile.', saved: 'Profile saved', saving: 'Saving…', details: 'Your details',
    targets: 'Daily targets', bmr: 'BMR (kcal)', tdee: 'TDEE (kcal)', dailyKcal: 'Target (kcal)', targetsNote: 'Estimates from standard formulas. Safety floors always apply.',
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
      notJson: 'This file is not valid JSON.', invalid: 'This is not a valid LUPU-FIT backup (problem at: {path}).', unreadable: 'The file could not be read.', rejected: 'The server rejected this backup as invalid.',
      confirmTitle: 'Restore backup?', confirmBody: 'Restoring replaces your current workouts, food log and weight entries with the contents of this file. This cannot be undone.',
      confirmCounts: 'The file contains {w} weight entries, {f} food entries and {s} workouts.', confirmGo: 'Replace my data', restoredToast: 'Backup restored', result: 'Restored {w} weight entries, {f} food entries and {s} workouts.',
    },
    account: {
      title: 'Account and app', mode: 'Data stored', modeDevice: 'On this device', modeHosted: 'In your account', version: 'App version', privacy: 'Privacy', terms: 'Terms', delete: 'Delete account',
      logout: 'Sign out', deviceNote: 'In device mode your data stays on this device and there is no account to log out of.',
    },
  },
}, {
  profile: {
    nu: { body: 'גוף ומטרות', prefs: 'העדפות', storage: 'סרטונים ואחסון', day: 'יום', moreSetup: 'ציוד, פציעות והגבלות', advancedKcal: 'מתקדם: יעד קלוריות מותאם', instantHint: 'שפה וערכת נושא משתנות מיד. שם ויחידות נשמרים עם כפתור השמירה.', redoHint: 'עדכון המטרות והפרטים צעד אחר צעד', saved: 'אין שינויים לשמירה', danger: 'אזור רגיש', deleteHint: 'מחיקת החשבון מסירה את כל הנתונים שלכם. במסך הבא תתבקשו לאשר.', exportHint: 'הורדת כל הנתונים כקובץ JSON', shareHint: 'שליחת קובץ הגיבוי לאפליקציה אחרת', restoreHint: 'החלפת הנתונים הנוכחיים בקובץ גיבוי' },
    ml: {
      title: 'שפה', more: 'לתרגם את האפליקציה לשפה אחרת', moreHint: 'כל שפה. תרגום מכונה חד-פעמי, ואז נשמר במכשיר הזה.', note: 'תרגום מכונה עלול להיות לא מדויק. שמות של תרגילים ומזונות נשארים בעברית או באנגלית אלא אם תורגמו, והמסמכים המשפטיים נשארים בשפת המקור.',
      sheetTitle: 'תרגום האפליקציה', search: 'חיפוש שפה', noMatch: 'לא נמצאה שפה מתאימה', other: 'שפה אחרת', otherHint: 'אפשר להקליד שם של כל שפה, בכל כתב', otherGo: 'לתרגם', otherBad: 'יש להזין שם שפה (אותיות בלבד).',
      downloaded: 'במכשיר הזה', use: 'להשתמש', del: 'למחוק', delLabel: 'מחיקת {lang} לפינוי מקום', deleted: '{lang} הוסרה מהמכשיר', active: 'בשימוש', now: 'מוצגת: {lang} (תרגום מכונה)', switched: 'שפת האפליקציה: {lang}',
      progress: 'מתרגמים {lang}: חלק {n} מתוך {total}', preparing: 'מכינים…', cancel: 'ביטול', cancelled: 'בוטל. החלקים שהסתיימו נשמרו, אפשר להמשיך אחר כך.', cached: 'נטען מהמכשיר. לא צריך אינטרנט.',
      partial: '{n} טקסטים לא תורגמו ונשארים באנגלית.', needAi: 'התרגום דורש חיבור לאינטרנט ושירות בינה מלאכותית.', busy: 'שירות התרגום עמוס. כדאי לנסות שוב בעוד רגע.', quota: 'מגבלת התרגום נוצלה כרגע. כדאי לנסות שוב מאוחר יותר.', failed: 'התרגום נכשל. החלקים שהסתיימו נשמרו; אפשר לנסות שוב כדי להמשיך.',
      strings: '{n} טקסטים', rtl: 'ימין לשמאל',
    },
    title: 'פרופיל', redo: 'מילוי השאלון מחדש', needOnboarding: 'כדי לראות פרופיל צריך להשלים את השאלון.', saved: 'הפרופיל נשמר', saving: 'שמירה…', details: 'הפרטים שלכם',
    targets: 'יעדים יומיים', bmr: 'BMR (קק״ל)', tdee: 'TDEE (קק״ל)', dailyKcal: 'יעד (קק״ל)', targetsNote: 'הערכות לפי נוסחאות סטנדרטיות. רצפות הבטיחות תמיד חלות.',
    clamped: 'ביקשתם {asked} קק״ל, אבל היעד הבטוח עבורכם הוא {got} קק״ל. היעד אף פעם לא יורד מתחת לרצפת הבטיחות לפי הגיל והמין.',
    customKcalHint: 'להשאיר ריק כדי להשתמש ביעד המחושב. ערכים מתחת לרצפת הבטיחות מועלים אוטומטית.', clearCustomKcal: 'שימוש ביעד המחושב',
    imperialHint: '≈ {lb} ליברות · {ft} רגל {inch} אינץ׳', lang: { he: 'עברית', en: 'English' }, theme: { dark: 'כהה', light: 'בהיר', system: 'אוטומטי' }, units: { metric: 'מטרי', imperial: 'אימפריאלי' },
    f: {
      displayName: 'שם לתצוגה', language: 'שפה', theme: 'ערכת נושא', units: 'יחידות', sex: 'מין', age: 'גיל', height: 'גובה', weight: 'משקל', goal: 'מטרה', experience: 'ניסיון', place: 'איפה מתאמנים',
      days: 'ימים בשבוע', minutes: 'דקות לאימון', activity: 'פעילות יומית', equipment: 'ציוד', injuries: 'פציעות שצריך לעבוד סביבן', diet: 'תזונה', allergies: 'אלרגיות', restrictions: 'הגבלות', customKcal: 'יעד קלוריות מותאם',
    },
    note: {
      minor_no_deficit: 'בגילאי 13 עד 17 יעד הקלוריות אף פעם לא נמוך מתחזוקה.', floor_applied: 'יעד הקלוריות הועלה למינימום הבטוח.', custom_clamped: 'יעד הקלוריות המותאם שלכם תוקן כדי להישאר בטוח.',
      carb_floor_raised_kcal: 'הפחמימות נשמרו במינימום, מה שהעלה מעט את הקלוריות.', bmi_adjusted_protein: 'החלבון מבוסס על משקל גוף מתואם.', deficit_capped_at_bmr: 'הגרעון הוגבל כך שהקלוריות יישארו ברמת BMR לפחות.',
    },
    video: {
      title: 'סרטוני תרגילים', wifiOnly: 'ניגון אוטומטי ב-Wi-Fi בלבד', wifiHint: 'סרטונים לא יתנגנו אוטומטית בגלישה סלולרית. אפשר עדיין ללחוץ לניגון.', cacheSize: 'מטמון סרטונים לא מקוון', mb: 'מ״ב', budget: 'מגבלת מטמון', clear: 'ניקוי מטמון הסרטונים',
      cleared: 'מטמון הסרטונים נוקה', noSw: 'המטמון הלא מקוון אינו זמין כרגע.',
    },
    backup: {
      title: 'גיבוי ושחזור', hint: 'אפשר לייצא את הנתונים לקובץ, או לשחזר מייצוא קודם.', export: 'ייצוא נתונים', exported: 'הייצוא מוכן', restore: 'שחזור מקובץ', pick: 'בחירת קובץ גיבוי',
      notJson: 'הקובץ הזה אינו JSON תקין.', invalid: 'זה אינו גיבוי תקין של LUPU-FIT (הבעיה ב: {path}).', unreadable: 'לא ניתן היה לקרוא את הקובץ.', rejected: 'השרת דחה את הגיבוי הזה כלא תקין.',
      confirmTitle: 'לשחזר גיבוי?', confirmBody: 'השחזור מחליף את האימונים, יומן האוכל ורשומות המשקל הנוכחיים בתוכן הקובץ. אי אפשר לבטל.',
      confirmCounts: 'הקובץ מכיל {w} רשומות משקל, {f} רשומות אוכל ו-{s} אימונים.', confirmGo: 'החלפת הנתונים שלי', restoredToast: 'הגיבוי שוחזר', result: 'שוחזרו {w} רשומות משקל, {f} רשומות אוכל ו-{s} אימונים.',
    },
    account: {
      title: 'חשבון ואפליקציה', mode: 'אחסון הנתונים', modeDevice: 'במכשיר הזה', modeHosted: 'בחשבון שלכם', version: 'גרסת האפליקציה', privacy: 'פרטיות', terms: 'תנאי שימוש', delete: 'מחיקת חשבון',
      logout: 'התנתקות', deviceNote: 'במצב מכשיר הנתונים נשארים על המכשיר הזה ואין חשבון להתנתק ממנו.',
    },
  },
});
