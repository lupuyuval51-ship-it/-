import type menuEn from '../en/menu';
import type { Translations } from '../types';

/** Owned by the daily-menu feature. Same keys as en/menu.ts. */
const menu: Translations<typeof menuEn> = {
  title: 'תפריט יומי',
  subtitle: 'מנות מוכנות שנבחרו לפי היעדים שלך',
  back: 'תזונה',
  teaser: {
    title: 'התפריט להיום',
    body: { one: 'מנה אחת · בערך {kcal} קק״ל', two: '{count} מנות · בערך {kcal} קק״ל', other: '{count} מנות · בערך {kcal} קק״ל' },
    open: 'לתפריט',
  },
  summary: {
    title: 'התפריט הזה',
    kcal: '{value} מתוך {target} קק״ל',
    macros: 'חלבון {protein} / {proteinTarget} גרם · פחמימות {carbs} / {carbsTarget} גרם · שומן {fat} / {fatTarget} גרם',
    logAll: 'רישום כל היום',
    logAllDone: 'כל התפריט נרשם',
  },
  notice: {
    estimate: 'הערכים התזונתיים הם הערכה למנה רגילה.',
    filter: 'הסינון לפי תזונה ואלרגיות מבוסס על שמות המרכיבים בלבד. מרכיבים נסתרים (רטבים, ציפויים, אבקות) עלולים לחמוק, ולכן תמיד כדאי לבדוק את המרכיבים בעצמכם.',
    allergyTitle: 'ציינתם אלרגיות',
    allergyBody: 'מנות מוסתרות לפי שמות המרכיבים בלבד, ואין שום מנה שמובטח שהיא נקייה מאלרגן. יש לבדוק כל מרכיב וכל תווית לפני האכילה.',
  },
  dish: {
    log: 'רישום',
    logLabel: 'רישום {name} ל{meal}',
    logAgainLabel: 'רישום נוסף של {name} ל{meal}',
    logged: 'נרשם',
    logAgain: 'רישום נוסף',
    another: 'מנה אחרת',
    anotherLabel: 'מנה אחרת ל{meal}',
    ingredients: 'מרכיבים',
    portion: '{scale} מנות',
    listed: 'מנה אחת כפי שמופיעה: {kcal} קק״ל · ח׳ {protein} · פ׳ {carbs} · ש׳ {fat}',
    photo: 'תמונה של {name}',
  },
  shopping: {
    open: 'רשימת קניות',
    title: 'רשימת קניות',
    intro: 'שמות המרכיבים של המנות בתפריט. הכמויות לא מופיעות; אפשר לראות את המרכיבים בכל מנה.',
    dishes: { one: 'מנה אחת', two: '{count} מנות', other: '{count} מנות' },
    copy: 'העתקת הרשימה',
    copied: 'הרשימה הועתקה',
    copyFailed: 'לא הצלחנו להעתיק את הרשימה',
    empty: 'אין מה לקנות: התפריט ריק.',
  },
  empty: {
    noTargets: 'כדי לקבל תפריט שמתאים ליעדים יש להשלים את הפרופיל',
    noTargetsBody: 'התפריט נבנה לפי יעדי הקלוריות והמאקרו שלך.',
    profile: 'לפרופיל',
    slot: 'אין מנה שמתאימה להעדפות שלך ל{meal}. אפשר לרשום אוכל בעצמכם.',
    all: 'אין מנות שמתאימות לתזונה, לאלרגיות ולמה שלא אוהבים',
    allBody: 'אפשר להקל על אחת ההעדפות בפרופיל, או לרשום אוכל מיומן המזון.',
  },
  tags: {
    hp: 'עשיר בחלבון',
    v: 'צמחוני',
    vg: 'טבעוני',
    q: 'מהיר',
    k: 'אהוב על ילדים',
  },
  logNote: 'מהתפריט היומי',
  logged: '{name} נוספה ל{meal}',
  loggedDay: { one: 'מנה אחת נוספה ליומן', two: '{count} מנות נוספו ליומן', other: '{count} מנות נוספו ליומן' },
  savedOffline: 'נשמר במכשיר ויסונכרן כשתהיה שוב רשת.',
};

export default menu;
