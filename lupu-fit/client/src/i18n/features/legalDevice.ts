import { defineFeature } from '../core.ts';

/**
 * Privacy policy and terms for the standalone Device Mode build (no account, no server). `LegalDoc` renders `legalDev.*` instead of
 * `legal.*` when RUN_MODE is `device`. Paragraph keys `a1…` are shown only when the build has an AI proxy (AI_AVAILABLE).
 */
export default defineFeature({
  legalDev: {
    privacy: {
      nav: 'Privacy policy', title: 'Privacy policy',
      intro: 'LUPU-FIT is a strength training and nutrition app. This policy explains in plain words what data the app handles, why, where it is kept and what control you have. This version of the app runs entirely on your device: there is no account and no server that holds your data.',
      s1: {
        h: 'How this app works',
        p1: 'The whole app, including its database, runs on your device. There is no account, no sign-in, no e-mail address and no server operated for the app. Your data is stored only on this device.',
        p2: 'Because of that, nobody else can see, recover or delete your data. If you lose the device or clear the app data, it is gone unless you exported a backup file.',
      },
      s2: {
        h: 'What data is stored on your device',
        p1: 'Only what you enter or generate while using the app:',
        b1: 'Profile: optional display name, sex, age, height, weight, goal, experience, training place and equipment, injuries or sensitive areas, activity level, diet, allergies and restrictions, language, theme and units.',
        b2: 'Workouts: sessions, exercises, sets, reps, weights, effort ratings and personal records.',
        b3: 'Food log: meals and foods you log, with their calories and macros.',
        b4: 'Body weight entries.',
        b5: 'Coach chats: the questions you ask the built-in coach and its replies.',
        b6: 'A random local identifier created on the first start so the app can keep your data apart inside its on-device database. It has no name, e-mail or password you chose, and it is never sent anywhere.',
      },
      s3: {
        h: 'Why the data is used',
        p1: 'To run the features you use: calculating nutrition targets, choosing and adjusting workouts, tracking progress, and showing your history. Your data is not used for advertising or for building a profile about you for others.',
      },
      s4: {
        h: 'Where data is stored',
        p1: 'Only on this device, in the private storage of the app. Clearing the app data or uninstalling the app removes it. The app does not back anything up to a cloud, and the app is marked so that Android does not back it up either. The only backups are the files you export yourself.',
        p2: 'Small preferences such as language, theme, reminder settings and an unfinished setup draft are kept in the app’s local storage on the device.',
      },
      s5: {
        h: 'The coach',
        p1: 'The coach is built into the app. It answers with fixed rules, using the data you logged, entirely on your device. What you type to the coach is not sent anywhere.',
        a1: 'This build was configured with an optional AI service. When you send a message to the coach, ask for a meal photo estimate or translate the app, that content is sent to the configured service together with an anonymised snapshot (an age bracket instead of your exact age, your goal, and recent training, nutrition and weight-trend numbers). Your name is not sent. The service’s own terms apply to what it receives.',
      },
      s6: {
        h: 'Barcode lookup (optional, needs internet)',
        p1: 'This is the only feature that reaches the internet on its own. When you scan or type a barcode number to look up a product, only that number is sent from your device to Open Food Facts (world.openfoodfacts.org). Like any web request, it also lets Open Food Facts see your IP address. If you never use barcode lookup, the app makes no network requests.',
        p2: 'If you allow the camera, it is used only to read a barcode on your device. Pictures are not stored or sent.',
        a1: 'A meal photo is sent for a calorie estimate only when you explicitly ask for an estimate. It is used for that request.',
      },
      s7: {
        h: 'No ads, no sale of data, no trackers',
        p1: 'The app shows no ads, does not sell or rent your data, and includes no third-party analytics or advertising trackers.',
      },
      s8: {
        h: 'How long data is kept',
        p1: 'Your data is kept on the device until you delete it. Profile, then Delete all data, erases everything the app stored at once. It cannot be undone.',
      },
      s9: {
        h: 'Your rights',
        b1: 'Export: save all your data as a JSON file from Profile.',
        b2: 'Delete: erase everything with Profile, then Delete all data. See the data deletion page for details.',
        b3: 'Correct: edit your profile and logged entries at any time inside the app.',
        p1: 'The data never leaves your device, so there is nobody to send a data request to: you hold it and can export or delete it yourself.',
      },
      s10: {
        h: 'Minors',
        p1: 'The minimum age to use the app is 13. Profiles of users under 18 are private by default. There is no open chat with other users and no precise location is collected or shown. For users under 18 the app never sets a calorie deficit and keeps training intensity moderate.',
      },
      s11: {
        h: 'Security',
        p1: 'Your data is protected by the app sandbox of your phone (other apps cannot read it) and by your screen lock. The app adds no password or encryption of its own, so anyone who can unlock your phone can open the app and see your data. Exported backup files are not encrypted: keep them somewhere safe.',
      },
      s12: {
        h: 'Changes to this policy',
        p1: 'If this policy changes in a meaningful way, the updated version will be shown here with a new date.',
      },
    },
    terms: {
      nav: 'Terms of use', title: 'Terms of use',
      intro: 'By using LUPU-FIT you agree to these terms. If you do not agree, please do not use the app.',
      s1: { h: 'Who can use the app', p1: 'You must be at least 13 years old. If you are under 18, use the app with the knowledge of a parent or guardian.' },
      s2: {
        h: 'Not medical advice',
        p1: 'The app provides general fitness and nutrition information. It is not medical advice, diagnosis or treatment, and it does not replace a doctor, physiotherapist or registered dietitian. Talk to a professional before starting a training or nutrition program, especially if you have an injury, a medical condition, are pregnant, or have a history of eating disorders.',
        p2: 'Stop exercising and seek help if you feel pain, dizziness or chest discomfort.',
      },
      s3: {
        h: 'Assumption of risk',
        p1: 'Physical exercise carries a risk of injury. You choose whether and how to follow any workout or suggestion, and you do so at your own risk. Use proper technique, suitable equipment and a safe space, and adjust or skip anything that does not feel right.',
      },
      s4: {
        h: 'Automatic features and estimates',
        p1: 'Coach replies and allergen filtering are automatic and can be wrong. Allergen filtering is conservative but not a guarantee, so always check ingredients yourself. Product data from barcode lookups may be incomplete. Treat all numbers as estimates.',
        a1: 'Calorie estimates from photos use an AI service and can be wrong.',
      },
      s5: {
        h: 'Your data and backups',
        p1: 'There is no account. Your data lives only on this device, and it is your responsibility to export a backup file if you want one. Nobody can recover data that was lost with the device or deleted from the app.',
      },
      s6: {
        h: 'Acceptable use',
        p1: 'Do not use the app to break the law or to harm others, and do not copy or resell the app or its content without permission.',
      },
      s7: {
        h: 'Availability',
        p1: 'The app is provided as is and as available. Features may change, be interrupted or be removed. Barcode lookup depends on an outside service and may be unavailable.',
      },
      s8: {
        h: 'Your content',
        p1: 'Your data remains yours. The app processes it on your device only as needed to provide the features described in the privacy policy.',
      },
      s9: {
        h: 'Liability',
        p1: 'To the extent permitted by law, the publisher and the creators of the app are not liable for injury, loss or damage resulting from use of the app or from reliance on its content. Nothing here limits rights that cannot be limited by law.',
      },
      s10: {
        h: 'Ending use',
        p1: 'You can stop using the app at any time. To remove what it stored, use Profile, then Delete all data, before uninstalling the app.',
      },
      s11: {
        h: 'Changes and governing law',
        p1: 'These terms may be updated, and the new version will be shown here with its date. Continued use means you accept the updated terms. The terms are governed by the law that applies where the publisher of the app is established.',
      },
    },
  },
}, {
  legalDev: {
    privacy: {
      nav: 'מדיניות פרטיות', title: 'מדיניות פרטיות',
      intro: 'LUPU-FIT היא אפליקציה לאימוני כוח ותזונה. המסמך מסביר בשפה פשוטה אילו נתונים האפליקציה מטפלת בהם, למה, איפה הם נשמרים ואיזו שליטה יש לכם. הגרסה הזו רצה כולה על המכשיר: אין חשבון ואין שרת שמחזיק את הנתונים שלכם.',
      s1: {
        h: 'איך האפליקציה עובדת',
        p1: 'האפליקציה כולה, כולל מסד הנתונים שלה, רצה על המכשיר. אין חשבון, אין התחברות, אין כתובת אימייל ואין שרת שמופעל בשביל האפליקציה. הנתונים נשמרים רק על המכשיר הזה.',
        p2: 'לכן אף גורם אחר לא יכול לראות, לשחזר או למחוק את הנתונים שלכם. אם המכשיר אובד או שנתוני האפליקציה נמחקים, הנתונים אבדו, אלא אם ייצאתם קובץ גיבוי.',
      },
      s2: {
        h: 'אילו נתונים נשמרים במכשיר',
        p1: 'רק מה שמזינים או יוצרים בזמן השימוש באפליקציה:',
        b1: 'פרופיל: שם תצוגה (לא חובה), מין, גיל, גובה, משקל, מטרה, ניסיון, מקום אימון וציוד, פציעות או אזורים רגישים, רמת פעילות, תפריט, אלרגיות והגבלות, שפה, עיצוב ויחידות.',
        b2: 'אימונים: אימונים, תרגילים, סטים, חזרות, משקלים, דירוגי מאמץ ושיאים אישיים.',
        b3: 'יומן אוכל: ארוחות ומזונות שנרשמו, עם הקלוריות והמקרו שלהם.',
        b4: 'רישומי משקל גוף.',
        b5: 'שיחות עם המאמן: השאלות שנשלחות למאמן המובנה והתשובות שלו.',
        b6: 'מזהה מקומי אקראי שנוצר בהפעלה הראשונה, כדי שהאפליקציה תפריד את הנתונים בתוך מסד הנתונים שעל המכשיר. אין בו שם, אימייל או סיסמה שבחרתם, והוא לא נשלח לשום מקום.',
      },
      s3: {
        h: 'למה משתמשים בנתונים',
        p1: 'כדי להפעיל את התכונות שבהן משתמשים: חישוב יעדי תזונה, בחירה והתאמה של אימונים, מעקב התקדמות והצגת ההיסטוריה. הנתונים אינם משמשים לפרסום ואינם משמשים לבניית פרופיל עליכם עבור אחרים.',
      },
      s4: {
        h: 'היכן הנתונים נשמרים',
        p1: 'רק על המכשיר הזה, באחסון הפרטי של האפליקציה. ניקוי נתוני האפליקציה או הסרתה מוחקים אותם. האפליקציה לא מגבה שום דבר לענן, והיא מסומנת כך שגם אנדרואיד לא מגבה אותה. הגיבויים היחידים הם הקבצים שאתם מייצאים בעצמכם.',
        p2: 'העדפות קטנות כמו שפה, עיצוב, הגדרות תזכורות וטיוטה של הגדרה שלא הושלמה נשמרות באחסון המקומי של האפליקציה במכשיר.',
      },
      s5: {
        h: 'המאמן',
        p1: 'המאמן מובנה באפליקציה. הוא עונה לפי כללים קבועים ובהתבסס על הנתונים שתיעדתם, כולו על המכשיר. מה שנכתב למאמן לא נשלח לשום מקום.',
        a1: 'הגרסה הזו הוגדרה עם שירות AI אופציונלי. בשליחת הודעה למאמן, בבקשת הערכת קלוריות מתמונת ארוחה או בתרגום האפליקציה, התוכן נשלח לשירות שהוגדר, יחד עם תקציר אנונימי (טווח גילאים במקום הגיל המדויק, המטרה ונתונים אחרונים של אימון, תזונה ומגמת משקל). השם לא נשלח. על מה שהשירות מקבל חלים התנאים של השירות עצמו.',
      },
      s6: {
        h: 'חיפוש ברקוד (אופציונלי, דורש אינטרנט)',
        p1: 'זו התכונה היחידה שפונה לאינטרנט מעצמה. בסריקה או בהקלדה של מספר ברקוד לחיפוש מוצר נשלח מהמכשיר רק המספר הזה אל Open Food Facts‏ (world.openfoodfacts.org). כמו בכל בקשת אינטרנט, גם כתובת ה-IP נחשפת ל-Open Food Facts. מי שלא משתמשים בחיפוש ברקוד לא מפעילים שום בקשת רשת מהאפליקציה.',
        p2: 'אם מאשרים את המצלמה, היא משמשת רק לקריאת ברקוד על המכשיר. תמונות לא נשמרות ולא נשלחות.',
        a1: 'תמונת ארוחה נשלחת להערכת קלוריות רק כשמבקשים הערכה במפורש, ומשמשת לבקשה הזו בלבד.',
      },
      s7: {
        h: 'בלי פרסומות, בלי מכירת מידע, בלי עוקבים',
        p1: 'האפליקציה לא מציגה פרסומות, לא מוכרת ולא משכירה את הנתונים שלכם, ואינה כוללת כלי ניתוח או עוקבי פרסום של צד שלישי.',
      },
      s8: {
        h: 'כמה זמן הנתונים נשמרים',
        p1: 'הנתונים נשמרים במכשיר עד שמוחקים אותם. פרופיל ואז מחיקת כל הנתונים מוחקים בבת אחת את כל מה שהאפליקציה שמרה. אי אפשר לבטל את הפעולה.',
      },
      s9: {
        h: 'הזכויות שלכם',
        b1: 'ייצוא: שמירת כל הנתונים כקובץ JSON מתוך הפרופיל.',
        b2: 'מחיקה: מחיקת הכול דרך פרופיל ואז מחיקת כל הנתונים. פרטים בדף מחיקת הנתונים.',
        b3: 'תיקון: אפשר לערוך את הפרופיל ורשומות שתועדו בכל עת בתוך האפליקציה.',
        p1: 'הנתונים לא עוזבים את המכשיר, ולכן אין למי לשלוח בקשה בנוגע למידע: הוא אצלכם ואפשר לייצא או למחוק אותו בעצמכם.',
      },
      s10: {
        h: 'קטינים',
        p1: 'גיל המינימום לשימוש באפליקציה הוא 13. פרופילים של מי שמתחת לגיל 18 פרטיים כברירת מחדל. אין צ׳אט פתוח עם משתמשים אחרים ולא נאסף או מוצג מיקום מדויק. למי שמתחת לגיל 18 האפליקציה אף פעם לא קובעת גירעון קלורי ושומרת על עצימות אימון מתונה.',
      },
      s11: {
        h: 'אבטחה',
        p1: 'הנתונים מוגנים על ידי בידוד האפליקציות בטלפון (אפליקציות אחרות לא יכולות לקרוא אותם) ועל ידי נעילת המסך. האפליקציה לא מוסיפה סיסמה או הצפנה משלה, ולכן מי שיכול לפתוח את הטלפון יכול לפתוח את האפליקציה ולראות את הנתונים. קבצי גיבוי שיוצאו אינם מוצפנים: כדאי לשמור אותם במקום בטוח.',
      },
      s12: {
        h: 'שינויים במדיניות',
        p1: 'אם המדיניות תשתנה באופן מהותי, הגרסה המעודכנת תוצג כאן עם תאריך חדש.',
      },
    },
    terms: {
      nav: 'תנאי שימוש', title: 'תנאי שימוש',
      intro: 'השימוש ב-LUPU-FIT מהווה הסכמה לתנאים האלה. מי שאינם מסכימים מתבקשים שלא להשתמש באפליקציה.',
      s1: { h: 'מי יכול להשתמש באפליקציה', p1: 'נדרש גיל 13 לפחות. מי שמתחת לגיל 18 צריכים להשתמש באפליקציה בידיעת הורה או אפוטרופוס.' },
      s2: {
        h: 'לא ייעוץ רפואי',
        p1: 'האפליקציה מספקת מידע כללי על כושר ותזונה. היא אינה ייעוץ רפואי, אבחון או טיפול, ואינה מחליפה רופא, פיזיותרפיסט או דיאטן קליני. לפני תחילת תוכנית אימונים או תזונה כדאי להיוועץ באיש מקצוע, במיוחד עם פציעה, מצב רפואי, הריון או היסטוריה של הפרעות אכילה.',
        p2: 'יש להפסיק להתאמן ולפנות לעזרה בעת כאב, סחרחורת או אי נוחות בחזה.',
      },
      s3: {
        h: 'לקיחת סיכון',
        p1: 'פעילות גופנית כרוכה בסיכון לפציעה. ההחלטה אם ואיך לבצע כל אימון או הצעה היא שלכם, ובאחריותכם. יש להשתמש בטכניקה נכונה, בציוד מתאים ובמקום בטוח, ולהתאים או לדלג על כל מה שלא מרגיש נכון.',
      },
      s4: {
        h: 'תכונות אוטומטיות והערכות',
        p1: 'תשובות המאמן וסינון האלרגנים אוטומטיים ועלולים לטעות. סינון האלרגנים שמרני אך אינו מבטיח דבר, ולכן תמיד כדאי לבדוק את המרכיבים בעצמכם. נתוני מוצרים מחיפוש ברקוד עלולים להיות חלקיים. כל המספרים הם הערכות.',
        a1: 'הערכות קלוריות מתמונות משתמשות בשירות AI ועלולות לטעות.',
      },
      s5: {
        h: 'הנתונים והגיבויים שלכם',
        p1: 'אין חשבון. הנתונים נשמרים רק על המכשיר הזה, והאחריות לייצא קובץ גיבוי, אם רוצים אחד, היא שלכם. אף אחד לא יכול לשחזר נתונים שאבדו עם המכשיר או נמחקו מהאפליקציה.',
      },
      s6: {
        h: 'שימוש מותר',
        p1: 'אין להשתמש באפליקציה כדי לעבור על החוק או לפגוע באחרים, ואין להעתיק או למכור את האפליקציה או את התוכן שלה ללא רשות.',
      },
      s7: {
        h: 'זמינות',
        p1: 'האפליקציה ניתנת כמות שהיא ובכפוף לזמינות. תכונות עשויות להשתנות, להיפסק או להיות מוסרות. חיפוש ברקוד תלוי בשירות חיצוני ועשוי להיות לא זמין.',
      },
      s8: {
        h: 'התוכן שלכם',
        p1: 'הנתונים נשארים שלכם. האפליקציה מעבדת אותם על המכשיר שלכם רק כפי שנדרש להפעלת התכונות המתוארות במדיניות הפרטיות.',
      },
      s9: {
        h: 'אחריות',
        p1: 'במידה המותרת בחוק, מפרסם האפליקציה ויוצריה אינם אחראים לפציעה, לאובדן או לנזק שנגרמו משימוש באפליקציה או מהסתמכות על התוכן שלה. אין בכתוב כאן כדי להגביל זכויות שאי אפשר להגביל בחוק.',
      },
      s10: {
        h: 'סיום השימוש',
        p1: 'אפשר להפסיק להשתמש באפליקציה בכל עת. כדי להסיר את מה שהיא שמרה, יש להשתמש בפרופיל ואז במחיקת כל הנתונים, לפני הסרת האפליקציה.',
      },
      s11: {
        h: 'שינויים והדין החל',
        p1: 'התנאים עשויים להתעדכן, והגרסה החדשה תוצג כאן עם תאריכה. המשך שימוש מהווה הסכמה לתנאים המעודכנים. על התנאים חל הדין החל במקום שבו מפרסם האפליקציה מוקם.',
      },
    },
  },
});
