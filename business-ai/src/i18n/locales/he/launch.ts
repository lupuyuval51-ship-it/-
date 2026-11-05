/**
 * Hebrew strings for the `launch` feature (default language). Owned by the launch feature.
 * Add keys here first, then the same keys to ../en/launch.ts (the compiler and
 * src/i18n/__tests__/locales.test.ts enforce identical key sets).
 */
const messages = {
  title: 'מרכז ההשקה',
  header: {
    country: 'המדינה של העסק',
    noCountry: 'לא נבחרה מדינה',
    change: 'שינוי',
    changeA11y: 'שינוי המדינה בהגדרות העסק',
  },
  disclaimer: {
    title: 'מידע להכוונה בלבד',
    body: 'המידע כאן כללי ונועד לעזור לך להתמצא. הוא אינו ייעוץ משפטי, מיסויי או פיננסי. הדרישות תלויות בסוג העסק ובמיקום שלו ומשתנות מעת לעת, ולכן לפני כל החלטה כדאי לבדוק במקור הרשמי או מול איש מקצוע מוסמך.',
  },
  seed: {
    action: 'הוספת הפריטים המומלצים עבור {country}',
    more: {
      one: 'יש פריט מומלץ אחד שעוד לא ברשימה',
      two: 'יש שני פריטים מומלצים שעוד לא ברשימה',
      other: 'יש {count} פריטים מומלצים שעוד לא ברשימה',
    },
    added: {
      zero: 'כל הפריטים המומלצים כבר ברשימה',
      one: 'נוסף פריט אחד לרשימה',
      two: 'נוספו שני פריטים לרשימה',
      other: 'נוספו {count} פריטים לרשימה',
    },
    reviewed: 'המקורות נבדקו לאחרונה ב-{date}',
  },
  generic: {
    title: 'נושאים שכדאי לבדוק',
    note: 'עדיין אין לנו מקורות רשמיים מאומתים עבור {country}, ולכן לא נוספו פריטים מומלצים. אלה הנושאים שבדרך כלל כדאי לבדוק לפני פתיחת עסק – כדאי לברר אותם בפורטל הממשלתי הרשמי של המדינה או מול איש מקצוע.',
    noCountryNote: 'כדי לקבל פריטים מומלצים לפי מיקום צריך לבחור מדינה בהגדרות העסק. בינתיים, אלה הנושאים שבדרך כלל כדאי לבדוק לפני פתיחת עסק.',
    setCountry: 'בחירת מדינה',
    registration: 'איך רושמים עסק ואילו מבנים משפטיים קיימים',
    tax: 'רישום לרשויות המס ודיווחים שוטפים',
    licensing: 'רישיונות והיתרים לפי סוג הפעילות והמיקום',
    privacy: 'כללים לשמירה ולשימוש במידע אישי של לקוחות ועובדים',
    insurance: 'ביטוחים שנדרשים או שכדאי לשקול',
    banking: 'פתיחת חשבון בנק עסקי והפרדה בין כספי העסק לכספים אישיים',
  },
  categories: {
    registration: 'רישום',
    tax: 'מסים',
    licensing: 'רישוי',
    privacy: 'פרטיות ומידע',
    insurance: 'ביטוח',
    banking: 'בנקאות',
    other: 'אחר',
  },
  status: {
    todo: 'לביצוע',
    done: 'בוצע',
    not_applicable: 'לא רלוונטי',
  },
  progress: '{done} מתוך {total} בוצעו',
  progressA11y: 'התקדמות ברשימת ההשקה: {done} מתוך {total} בוצעו',
  progressNotApplicable: {
    one: 'פריט אחד סומן כלא רלוונטי',
    two: 'שני פריטים סומנו כלא רלוונטיים',
    other: '{count} פריטים סומנו כלא רלוונטיים',
  },
  row: {
    source: 'מקור: {name}',
    openSourceA11y: 'פתיחת המקור: {name}',
    toggleA11y: 'סימון הפריט כבוצע',
    openItemA11y: 'פרטי הפריט',
  },
  empty: {
    title: 'הרשימה עדיין ריקה',
    body: 'כאן אפשר לעקוב אחרי הצעדים הרשמיים לפתיחת העסק – רישום, מסים, רישוי, פרטיות, ביטוח ובנקאות – עם קישור למקור הרשמי של כל פריט.',
  },
  addCustom: 'הוספת פריט משלך',
  updated: 'הסטטוס עודכן',
  offline: 'אין חיבור לרשת. אפשר לצפות ברשימה, ושינויים יתאפשרו כשהחיבור יחזור.',
  openSourceFailed: 'לא הצלחנו לפתוח את הקישור. אפשר לנסות שוב.',
  noBusiness: 'כדי להשתמש במרכז ההשקה צריך קודם להגדיר עסק.',
  item: {
    newTitle: 'פריט חדש',
    editTitle: 'פריט ברשימה',
    titleLabel: 'כותרת',
    descriptionLabel: 'תיאור',
    categoryLabel: 'נושא',
    statusLabel: 'סטטוס',
    notesLabel: 'הערות',
    notesHint: 'הערות פרטיות שלך, למשל מה כבר ביררת ועם מי דיברת',
    sourceTitle: 'מקור (לא חובה)',
    sourceNameLabel: 'שם המקור',
    sourceUrlLabel: 'קישור',
    sourceUrlHint: 'כתובת שמתחילה ב-https://',
    openSource: 'פתיחת המקור',
    templateNote: 'הפריט מבוסס על מקור רשמי שנבדק ב-{date}. כדאי לוודא במקור שהמידע עדיין עדכני.',
    create: 'הוספה לרשימה',
    created: 'הפריט נוסף',
    saved: 'השינויים נשמרו',
    delete: 'מחיקת הפריט',
    deleteConfirmTitle: 'למחוק את הפריט?',
    deleteConfirmBody: 'הפריט יוסר מהרשימה. אפשר להוסיף פריטים מומלצים שוב בכל רגע.',
    deleted: 'הפריט נמחק',
    notFoundTitle: 'הפריט לא נמצא',
    notFoundBody: 'ייתכן שהוא נמחק.',
    back: 'חזרה למרכז ההשקה',
  },
  form: {
    sourceUrlInvalid: 'יש להזין קישור שמתחיל ב-http:// או https://',
    sourceUrlRequired: 'יש להוסיף קישור למקור',
  },
} as const;

export default messages;
