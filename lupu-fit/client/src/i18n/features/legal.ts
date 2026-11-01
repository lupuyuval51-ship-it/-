import { defineFeature } from '../core.ts';

export default defineFeature({
  legal: {
    updated: 'Last updated: November 2026',
    navLabel: 'Legal pages',
    contact: {
      h: 'Contact', withEmail: 'Questions or requests about your data can be sent to:',
      noEmail: 'The operator of this deployment is responsible for your data. Their contact details are shown by the deployment where you use the app.',
    },
    privacy: {
      nav: 'Privacy policy', title: 'Privacy policy',
      intro: 'LUPU-FIT is a strength training and nutrition app. This policy explains in plain words what data the app handles, why, where it is kept and what control you have.',
      s1: {
        h: 'Two ways the app can run',
        p1: 'Device Mode: the whole app, including its database, runs inside your browser. Your data is stored only on this device, in the browser database, and is not sent to any server operated by the app.',
        p2: 'Hosted: the app talks to a server run by an operator. Your account and data are stored on that operator server. The operator is the party responsible for that server and for your data there.',
      },
      s2: {
        h: 'What data is collected',
        p1: 'Only what you enter or generate while using the app:',
        b1: 'Profile: optional display name, sex, age, height, weight, goal, experience, training place and equipment, injuries or sensitive areas, activity level, diet, allergies and restrictions, language, theme and units.',
        b2: 'Workouts: sessions, exercises, sets, reps, weights, effort ratings and personal records.',
        b3: 'Food log: meals and foods you log, with their calories and macros.',
        b4: 'Body weight entries.',
        b5: 'Coach chats: only if you choose to use the optional AI coach.',
        b6: 'Account details (Hosted only): your e-mail address and a salted hash of your password. The password itself is never stored.',
      },
      s3: {
        h: 'Why the data is used',
        p1: 'To run the features you use: calculating nutrition targets, choosing and adjusting workouts, tracking progress, and showing your history. Your data is not used for advertising or for building a profile about you for others.',
      },
      s4: {
        h: 'Where data is stored',
        p1: 'Device Mode: only on this device, in the browser database. Clearing the browser site data, or uninstalling the app, removes it. It is not backed up anywhere unless you export it yourself.',
        p2: 'Hosted: on the operator server. Your browser keeps a session cookie so you stay signed in, and may keep small preferences such as language, theme and an unfinished setup draft. No access tokens are kept in web storage.',
      },
      s5: {
        h: 'The AI coach',
        p1: 'The coach is optional. When you send a message, only an anonymised snapshot of your data is sent to the AI provider: an age bracket instead of your exact age, plus training and nutrition context. Your name, e-mail address and password are never sent.',
        p2: 'Depending on how the operator configured the app, the coach uses Google Gemini or Anthropic Claude. On the free tier of Gemini, Google may use prompts to improve its products. Requests sent to Claude are handled privately under the provider API terms. If you do not want this, do not use the coach.',
      },
      s6: {
        h: 'Meal photos and barcodes',
        p1: 'A meal photo is sent for a calorie estimate only when you explicitly ask for an estimate. It is used for that request.',
        p2: 'When you scan or enter a barcode, only the barcode number is sent to Open Food Facts to look up the product. No other data is sent.',
      },
      s7: {
        h: 'No ads, no sale of data, no trackers',
        p1: 'The app shows no ads, does not sell or rent your data, and includes no third-party analytics or advertising trackers.',
      },
      s8: {
        h: 'How long data is kept',
        p1: 'Your data is kept until you delete it or delete your account. Deleting your account is immediate and removes your profile, workouts, food log, weight entries and coach chats from the app database. Password reset links expire after one hour, and sign-in sessions expire after a limited time.',
      },
      s9: {
        h: 'Your rights',
        b1: 'Export: download all your data as a JSON file from Profile.',
        b2: 'Delete: remove everything with Profile, then Delete account. See the account deletion page for details.',
        b3: 'Correct: edit your profile and logged entries at any time inside the app.',
        p1: 'In Hosted mode you can also contact the operator about your data using the contact details below.',
      },
      s10: {
        h: 'Minors',
        p1: 'The minimum age to use the app is 13. Profiles of users under 18 are private by default. There is no open chat with other users and no precise location is collected or shown. For users under 18 the app never sets a calorie deficit and keeps training intensity moderate.',
      },
      s11: {
        h: 'Security',
        p1: 'Passwords are stored only as salted hashes. Connections to a hosted server should use HTTPS. Sign-in uses a protected session cookie, and requests that change data carry anti-forgery protection. Repeated failed sign-in attempts are rate limited. No system is perfectly secure, so keep your password private and use a unique one.',
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
        h: 'AI features and estimates',
        p1: 'Coach replies, calorie estimates from photos and allergen filtering are automatic and can be wrong. Allergen filtering is conservative but not a guarantee, so always check ingredients yourself. Treat all numbers as estimates.',
      },
      s5: {
        h: 'Your account',
        p1: 'In Hosted mode you are responsible for keeping your password private and for activity under your account. Tell the operator if you suspect unauthorized access.',
      },
      s6: {
        h: 'Acceptable use',
        p1: 'Do not use the app to break the law, to harm others, to attempt to access other accounts or the server without permission, to overload or disrupt the service, or to upload content you do not have the right to share.',
      },
      s7: {
        h: 'Availability',
        p1: 'The app is provided as is and as available. Features may change, be interrupted or be removed. In Device Mode, your data lives on your device and it is your responsibility to export a backup if you want one.',
      },
      s8: {
        h: 'Your content',
        p1: 'Your data remains yours. You allow the app to process it only as needed to provide the features described in the privacy policy.',
      },
      s9: {
        h: 'Liability',
        p1: 'To the extent permitted by law, the operator and the creators of the app are not liable for injury, loss or damage resulting from use of the app or from reliance on its content. Nothing here limits rights that cannot be limited by law.',
      },
      s10: {
        h: 'Ending use',
        p1: 'You can stop using the app and delete your account at any time. An operator may suspend access for misuse of the service.',
      },
      s11: {
        h: 'Changes and governing law',
        p1: 'These terms may be updated, and the new version will be shown here with its date. Continued use means you accept the updated terms. The terms are governed by the law that applies where the operator of the deployment is established.',
      },
    },
    deletion: {
      nav: 'Account deletion', title: 'Delete your account and data',
      intro: 'You can delete your LUPU-FIT account and all of its data yourself, at any time, without contacting anyone.',
      pathH: 'How to delete', path: 'Open the app and go to Profile, then Delete account. You will be asked to type DELETE to confirm.',
      whatH: 'What is deleted', what: 'Deletion is immediate and permanent, and it cascades to everything linked to your account:',
      b1: 'Your profile and preferences.', b2: 'Your workouts, plans, sets and personal records, your food log and your body weight entries.', b3: 'Your coach chats, notifications and sign-in sessions, and the account itself.',
      immediate: 'It cannot be undone.',
      exportH: 'Export first', export: 'If you want a copy, export your data as a JSON file from Profile before deleting.',
      nowH: 'Delete now', warn: 'This permanently deletes your account and everything in it.', open: 'Delete my account',
      signedOut: 'You are not signed in. To delete an account you first need to sign in, then use Profile, Delete account, or use the button that will appear here.',
      toLogin: 'Sign in',
      sheetTitle: 'Delete account', sheetBody: 'All your data will be deleted immediately and cannot be recovered.', typeLabel: 'Type DELETE to confirm', typeHint: 'Capital letters, exactly DELETE.', confirm: 'Delete everything',
    },
  },
}, {
  legal: {
    updated: 'עודכן לאחרונה: נובמבר 2026',
    navLabel: 'דפים משפטיים',
    contact: {
      h: 'יצירת קשר', withEmail: 'שאלות או בקשות בנוגע למידע אפשר לשלוח אל:',
      noEmail: 'מפעיל הפריסה הזו אחראי למידע שלכם. פרטי הקשר שלו מוצגים בפריסה שבה משתמשים באפליקציה.',
    },
    privacy: {
      nav: 'מדיניות פרטיות', title: 'מדיניות פרטיות',
      intro: 'LUPU-FIT היא אפליקציה לאימוני כוח ותזונה. המסמך מסביר בשפה פשוטה אילו נתונים האפליקציה מטפלת בהם, למה, איפה הם נשמרים ואיזו שליטה יש לכם.',
      s1: {
        h: 'שתי דרכים להפעלת האפליקציה',
        p1: 'מצב מכשיר: האפליקציה כולה, כולל מסד הנתונים שלה, רצה בתוך הדפדפן. הנתונים נשמרים רק על המכשיר הזה, במסד הנתונים של הדפדפן, ואינם נשלחים לשום שרת שמופעל על ידי האפליקציה.',
        p2: 'מצב מתארח: האפליקציה פועלת מול שרת שמפעיל גורם מפעיל. החשבון והנתונים נשמרים בשרת של המפעיל. המפעיל אחראי לשרת הזה ולנתונים שלכם בו.',
      },
      s2: {
        h: 'אילו נתונים נאספים',
        p1: 'רק מה שמזינים או יוצרים בזמן השימוש באפליקציה:',
        b1: 'פרופיל: שם תצוגה (לא חובה), מין, גיל, גובה, משקל, מטרה, ניסיון, מקום אימון וציוד, פציעות או אזורים רגישים, רמת פעילות, תפריט, אלרגיות והגבלות, שפה, עיצוב ויחידות.',
        b2: 'אימונים: אימונים, תרגילים, סטים, חזרות, משקלים, דירוגי מאמץ ושיאים אישיים.',
        b3: 'יומן אוכל: ארוחות ומזונות שנרשמו, עם הקלוריות והמקרו שלהם.',
        b4: 'רישומי משקל גוף.',
        b5: 'שיחות עם המאמן: רק אם בוחרים להשתמש במאמן ה-AI האופציונלי.',
        b6: 'פרטי חשבון (במצב מתארח בלבד): כתובת האימייל ותקציר מומלח (hash) של הסיסמה. הסיסמה עצמה אינה נשמרת לעולם.',
      },
      s3: {
        h: 'למה משתמשים בנתונים',
        p1: 'כדי להפעיל את התכונות שבהן משתמשים: חישוב יעדי תזונה, בחירה והתאמה של אימונים, מעקב התקדמות והצגת ההיסטוריה. הנתונים אינם משמשים לפרסום ואינם משמשים לבניית פרופיל עליכם עבור אחרים.',
      },
      s4: {
        h: 'היכן הנתונים נשמרים',
        p1: 'מצב מכשיר: רק על המכשיר הזה, במסד הנתונים של הדפדפן. ניקוי נתוני האתר בדפדפן או הסרת האפליקציה מוחקים אותם. אין גיבוי בשום מקום, אלא אם מייצאים בעצמכם.',
        p2: 'מצב מתארח: בשרת של המפעיל. הדפדפן שומר עוגיית הפעלה כדי שתישארו מחוברים, ועשוי לשמור העדפות קטנות כמו שפה, עיצוב וטיוטה של הגדרה שלא הושלמה. אסימוני גישה אינם נשמרים באחסון הדפדפן.',
      },
      s5: {
        h: 'מאמן ה-AI',
        p1: 'המאמן הוא אופציונלי. בעת שליחת הודעה נשלח לספק ה-AI רק תקציר אנונימי של הנתונים: טווח גילאים במקום הגיל המדויק, יחד עם הקשר של אימון ותזונה. השם, כתובת האימייל והסיסמה אינם נשלחים לעולם.',
        p2: 'בהתאם להגדרת המפעיל, המאמן משתמש ב-Google Gemini או ב-Anthropic Claude. במסלול החינמי של Gemini, גוגל עשויה להשתמש בהנחיות לשיפור המוצרים שלה. בקשות שנשלחות ל-Claude מטופלות באופן פרטי לפי תנאי ה-API של הספק. מי שאינם מעוניינים בכך יכולים שלא להשתמש במאמן.',
      },
      s6: {
        h: 'תמונות ארוחה וברקודים',
        p1: 'תמונת ארוחה נשלחת להערכת קלוריות רק כשמבקשים הערכה במפורש, והיא משמשת לבקשה הזו בלבד.',
        p2: 'בסריקה או בהזנה של ברקוד נשלח ל-Open Food Facts רק מספר הברקוד, לצורך זיהוי המוצר. שום מידע אחר אינו נשלח.',
      },
      s7: {
        h: 'בלי פרסומות, בלי מכירת מידע, בלי מעקבים',
        p1: 'האפליקציה אינה מציגה פרסומות, אינה מוכרת או משכירה מידע, ואינה כוללת כלי ניתוח או מעקב פרסומי של צד שלישי.',
      },
      s8: {
        h: 'כמה זמן המידע נשמר',
        p1: 'המידע נשמר עד שמוחקים אותו או מוחקים את החשבון. מחיקת חשבון היא מיידית ומסירה ממסד הנתונים של האפליקציה את הפרופיל, האימונים, יומן האוכל, רישומי המשקל ושיחות המאמן. קישורי איפוס סיסמה פגים אחרי שעה, והפעלות כניסה פגות אחרי זמן מוגבל.',
      },
      s9: {
        h: 'הזכויות שלכם',
        b1: 'ייצוא: הורדת כל הנתונים כקובץ JSON מתוך הפרופיל.',
        b2: 'מחיקה: הסרת הכול דרך הפרופיל ואז מחיקת חשבון. פרטים בדף מחיקת החשבון.',
        b3: 'תיקון: אפשר לערוך את הפרופיל ואת הרישומים בכל עת בתוך האפליקציה.',
        p1: 'במצב מתארח אפשר גם לפנות למפעיל בנוגע למידע, לפי פרטי הקשר שלמטה.',
      },
      s10: {
        h: 'קטינים',
        p1: 'הגיל המינימלי לשימוש באפליקציה הוא 13. פרופילים של מי שמתחת לגיל 18 פרטיים כברירת מחדל. אין צ׳אט פתוח עם משתמשים אחרים, ולא נאסף או מוצג מיקום מדויק. למי שמתחת לגיל 18 האפליקציה אף פעם לא קובעת גירעון קלורי ושומרת על עצימות אימון מתונה.',
      },
      s11: {
        h: 'אבטחה',
        p1: 'סיסמאות נשמרות רק כתקצירים מומלחים. החיבור לשרת מתארח אמור להיות ב-HTTPS. הכניסה מבוססת על עוגיית הפעלה מוגנת, ובקשות שמשנות נתונים כוללות הגנה מפני זיוף בקשות. ניסיונות כניסה כושלים חוזרים מוגבלים בקצב. אין מערכת מאובטחת לחלוטין, ולכן כדאי לשמור על הסיסמה בסוד ולהשתמש בסיסמה ייחודית.',
      },
      s12: {
        h: 'שינויים במדיניות',
        p1: 'אם המדיניות תשתנה באופן משמעותי, הגרסה המעודכנת תוצג כאן עם תאריך חדש.',
      },
    },
    terms: {
      nav: 'תנאי שימוש', title: 'תנאי שימוש',
      intro: 'בשימוש ב-LUPU-FIT מאשרים את התנאים האלה. מי שאינם מסכימים מתבקשים שלא להשתמש באפליקציה.',
      s1: { h: 'מי יכול להשתמש', p1: 'השימוש מותר מגיל 13. מי שמתחת לגיל 18 מתבקשים להשתמש באפליקציה בידיעת הורה או אפוטרופוס.' },
      s2: {
        h: 'אין כאן ייעוץ רפואי',
        p1: 'האפליקציה מספקת מידע כללי על כושר ותזונה. היא אינה ייעוץ רפואי, אבחון או טיפול, ואינה מחליפה רופא, פיזיותרפיסט או דיאטן קליני. לפני תחילת תוכנית אימון או תזונה כדאי להתייעץ עם איש מקצוע, במיוחד במקרה של פציעה, מצב רפואי, הריון או היסטוריה של הפרעות אכילה.',
        p2: 'במקרה של כאב, סחרחורת או אי נוחות בחזה, יש להפסיק את האימון ולפנות לעזרה.',
      },
      s3: {
        h: 'לקיחת סיכון',
        p1: 'פעילות גופנית כרוכה בסיכון לפציעה. ההחלטה אם ואיך לבצע אימון או הצעה כלשהי היא שלכם, והיא באחריותכם. חשוב להקפיד על טכניקה נכונה, ציוד מתאים ומרחב בטוח, ולהתאים או לדלג על כל דבר שאינו מרגיש נכון.',
      },
      s4: {
        h: 'תכונות AI והערכות',
        p1: 'תשובות המאמן, הערכות קלוריות מתמונות וסינון אלרגנים הם אוטומטיים ועלולים להיות שגויים. סינון האלרגנים שמרני אך אינו מבטיח דבר, ולכן תמיד כדאי לוודא את הרכיבים בעצמכם. כל המספרים הם הערכות.',
      },
      s5: {
        h: 'החשבון שלכם',
        p1: 'במצב מתארח האחריות לשמירת הסיסמה בסוד ולפעילות בחשבון היא שלכם. אם יש חשד לגישה לא מורשית, יש לעדכן את המפעיל.',
      },
      s6: {
        h: 'שימוש הוגן',
        p1: 'אסור להשתמש באפליקציה כדי להפר את החוק, לפגוע באחרים, לנסות לגשת לחשבונות אחרים או לשרת ללא הרשאה, להעמיס על השירות או להפריע לו, או להעלות תוכן שאין לכם זכות לשתף.',
      },
      s7: {
        h: 'זמינות',
        p1: 'האפליקציה ניתנת כמות שהיא וכפי שהיא זמינה. תכונות עשויות להשתנות, להיפסק או להיות מוסרות. במצב מכשיר הנתונים נמצאים במכשיר, והאחריות לייצא גיבוי, אם רוצים, היא שלכם.',
      },
      s8: {
        h: 'התוכן שלכם',
        p1: 'המידע נשאר שלכם. אתם מתירים לאפליקציה לעבד אותו רק במידה הנדרשת להפעלת התכונות המתוארות במדיניות הפרטיות.',
      },
      s9: {
        h: 'אחריות',
        p1: 'במידה המותרת בחוק, המפעיל ויוצרי האפליקציה אינם אחראים לפציעה, לאובדן או לנזק שנגרמו משימוש באפליקציה או מהסתמכות על התוכן שלה. אין באמור כדי לצמצם זכויות שאי אפשר לצמצם על פי דין.',
      },
      s10: {
        h: 'סיום השימוש',
        p1: 'אפשר להפסיק להשתמש באפליקציה ולמחוק את החשבון בכל עת. מפעיל רשאי להשעות גישה במקרה של שימוש לרעה בשירות.',
      },
      s11: {
        h: 'שינויים ודין חל',
        p1: 'התנאים עשויים להתעדכן, והגרסה החדשה תוצג כאן עם התאריך שלה. המשך שימוש מבטא הסכמה לתנאים המעודכנים. על התנאים חל הדין החל במקום שבו מוקם מפעיל הפריסה.',
      },
    },
    deletion: {
      nav: 'מחיקת חשבון', title: 'מחיקת חשבון ונתונים',
      intro: 'אפשר למחוק את חשבון LUPU-FIT ואת כל הנתונים שבו באופן עצמאי, בכל עת, בלי לפנות לאף אחד.',
      pathH: 'איך מוחקים', path: 'פותחים את האפליקציה ועוברים אל פרופיל ואז מחיקת חשבון. לאישור יש להקליד DELETE.',
      whatH: 'מה נמחק', what: 'המחיקה מיידית וקבועה, והיא משפיעה על כל מה שמקושר לחשבון:',
      b1: 'הפרופיל וההעדפות.', b2: 'האימונים, התוכניות, הסטים והשיאים האישיים, יומן האוכל ורישומי משקל הגוף.', b3: 'שיחות המאמן, ההתראות והפעלות הכניסה, והחשבון עצמו.',
      immediate: 'אי אפשר לבטל את הפעולה.',
      exportH: 'כדאי לייצא קודם', export: 'מי שרוצים עותק של המידע יכולים לייצא אותו כקובץ JSON מתוך הפרופיל לפני המחיקה.',
      nowH: 'מחיקה עכשיו', warn: 'הפעולה מוחקת לצמיתות את החשבון ואת כל מה שבו.', open: 'מחיקת החשבון שלי',
      signedOut: 'לא מחוברים כרגע. כדי למחוק חשבון צריך להיכנס אליו, ואז להשתמש בפרופיל ובמחיקת חשבון, או בכפתור שיופיע כאן.',
      toLogin: 'כניסה',
      sheetTitle: 'מחיקת חשבון', sheetBody: 'כל הנתונים יימחקו מיד ואי אפשר יהיה לשחזר אותם.', typeLabel: 'להקלדת DELETE לאישור', typeHint: 'אותיות גדולות, בדיוק DELETE.', confirm: 'מחיקת הכול',
    },
  },
});
