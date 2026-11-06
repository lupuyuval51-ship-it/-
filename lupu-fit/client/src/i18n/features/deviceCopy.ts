import { defineFeature } from '../core.ts';

/**
 * Device Mode copy overrides. In the standalone build (RUN_MODE `device`, see `lookup()` in i18n/index.tsx) the key `dev.<key>` replaces
 * `<key>` whenever it exists. Hosted-only wording ("account", "server", "sign in", "sync") must not reach the device build, so every
 * such string has its device twin here. Hosted behaviour is unchanged (these keys are never read there).
 */
export default defineFeature({
  dev: {
    profile: {
      account: { title: 'App and data', delete: 'Delete all data' },
      nu: { deleteHint: 'Deleting all data erases your profile, workouts, food log and everything else stored on this device. You will be asked to confirm on the next screen.' },
      backup: {
        hint: 'There is no cloud copy of your data. Export saves one file with all of it: your profile, workouts with records and XP, food log, weight entries, plans, saved meals, your own foods, coach chats and the settings of this device. Keep that file somewhere safe, such as a cloud drive or an e-mail to yourself. Restore REPLACES what is in the app with the contents of such a file, so it is also the way to move to a new phone.',
        rejected: 'This backup file is not valid.',
      },
    },
    error: {
      internal_error: 'Something went wrong. Try again.',
      unauthorized: 'Something went wrong. Close and reopen the app.',
      csrf_invalid: 'Something went wrong. Close and reopen the app.',
      network: 'Something went wrong. Close and reopen the app.',
    },
    video: { needsNetwork: 'The video could not be loaded' },
    legal: {
      contact: {
        withEmail: 'Questions about the app can be sent to:',
        noEmail: 'Your data is only on this device, so there is nobody who holds it for you. You can export or delete it yourself in Profile.',
      },
      deletion: {
        nav: 'Delete data', title: 'Delete all your data',
        intro: 'This app has no account. You can erase everything it stores on your device yourself, at any time, without contacting anyone.',
        path: 'Open the app and go to Profile, then Delete all data. You will be asked to type DELETE to confirm.',
        what: 'Deletion is immediate and permanent. The whole on-device database is wiped and a new, empty one is created:',
        b3: 'Your coach chats and notifications.',
        warn: 'This permanently deletes everything the app stored on this device.',
        open: 'Delete all my data',
        signedOut: 'The app data is not available right now. Close and reopen the app, then try again.',
        sheetTitle: 'Delete all data', sheetBody: 'Everything the app stored on this device will be deleted immediately and cannot be recovered.',
      },
    },
  },
}, {
  dev: {
    profile: {
      account: { title: 'אפליקציה ונתונים', delete: 'מחיקת כל הנתונים' },
      nu: { deleteHint: 'מחיקת כל הנתונים מוחקת את הפרופיל, האימונים, יומן האוכל וכל מה ששמור במכשיר הזה. במסך הבא תתבקשו לאשר.' },
      backup: {
        hint: 'אין עותק של הנתונים בענן. הייצוא שומר קובץ אחד עם הכול: הפרופיל, האימונים עם השיאים ונקודות הניסיון, יומן האוכל, רשומות המשקל, התוכניות, הארוחות השמורות, המזונות האישיים, שיחות המאמן והגדרות המכשיר הזה. כדאי לשמור אותו במקום בטוח, למשל בכונן ענן או באימייל לעצמכם. השחזור מחליף את מה שיש באפליקציה בתוכן קובץ כזה, ולכן זו גם הדרך לעבור לטלפון חדש.',
        rejected: 'קובץ הגיבוי הזה לא תקין.',
      },
    },
    error: {
      internal_error: 'משהו השתבש. כדאי לנסות שוב.',
      unauthorized: 'משהו השתבש. כדאי לסגור את האפליקציה ולפתוח אותה מחדש.',
      csrf_invalid: 'משהו השתבש. כדאי לסגור את האפליקציה ולפתוח אותה מחדש.',
      network: 'משהו השתבש. כדאי לסגור את האפליקציה ולפתוח אותה מחדש.',
    },
    video: { needsNetwork: 'לא הצלחנו לטעון את הסרטון' },
    legal: {
      contact: {
        withEmail: 'שאלות על האפליקציה אפשר לשלוח אל:',
        noEmail: 'הנתונים נמצאים רק במכשיר הזה, ולכן אין גורם שמחזיק אותם עבורכם. אפשר לייצא או למחוק אותם בעצמכם בפרופיל.',
      },
      deletion: {
        nav: 'מחיקת נתונים', title: 'מחיקת כל הנתונים',
        intro: 'באפליקציה הזו אין חשבון. אפשר למחוק בעצמכם את כל מה שהיא שומרת במכשיר, בכל עת, בלי לפנות לאף אחד.',
        path: 'פותחים את האפליקציה ועוברים אל פרופיל ואז מחיקת כל הנתונים. לאישור יש להקליד DELETE.',
        what: 'המחיקה מיידית וקבועה. כל מסד הנתונים שבמכשיר נמחק ונוצר חדש וריק:',
        b3: 'שיחות המאמן וההתראות.',
        warn: 'הפעולה מוחקת לצמיתות את כל מה שהאפליקציה שמרה במכשיר הזה.',
        open: 'מחיקת כל הנתונים שלי',
        signedOut: 'נתוני האפליקציה לא זמינים כרגע. כדאי לסגור את האפליקציה ולפתוח אותה מחדש, ואז לנסות שוב.',
        sheetTitle: 'מחיקת כל הנתונים', sheetBody: 'כל מה שהאפליקציה שמרה במכשיר הזה יימחק מיד ואי אפשר יהיה לשחזר אותו.',
      },
    },
  },
});
