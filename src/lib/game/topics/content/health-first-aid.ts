import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["First aid", "the first help given to someone who is hurt or ill, until professionals arrive", "עזרה ראשונה", "הטיפול הראשון שנותנים למי שנפצע או חלה, עד שמגיעים אנשי מקצוע"],
      ["Emergency number", "the phone number for urgent help; in Israel 101 is Magen David Adom", "מספר חירום", "מספר הטלפון לעזרה דחופה; בישראל 101 הוא מגן דוד אדום"],
      ["Plaster", "a small sticky bandage for a minor cut", "פלסטר", "תחבושת דביקה קטנה לחתך קל"],
      ["Trusted adult", "a grown-up you can call for help, like a parent, teacher or lifeguard", "מבוגר אחראי", "אדם מבוגר שאפשר לקרוא לו לעזרה, כמו הורה, מורה או מציל"],
    ],
    q: [
      [["Which number do you call in Israel for an ambulance (Magen David Adom)?", "101", ["100", "102", "911"], "101 is MDA; 100 is the police and 102 the fire service."],
        ["לאיזה מספר מתקשרים בישראל להזמנת אמבולנס (מגן דוד אדום)?", "101", ["100", "102", "911"], "101 הוא מד״א; 100 הוא המשטרה ו־102 כבאות והצלה."]],
      [["Someone is hurt. What should you check first?", "That it is safe for you to approach", ["What time it is", "Whether they have a phone", "Their name and address"], "Make sure there is no danger to you (traffic, fire, electricity) before helping, then get help."],
        ["מישהו נפגע. מה צריך לבדוק קודם?", "שבטוח לך להתקרב", ["מה השעה", "אם יש לו טלפון", "את שמו וכתובתו"], "מוודאים שאין סכנה (תנועה, אש, חשמל) לפני שעוזרים, ואז קוראים לעזרה."]],
    ],
  },
  i: {
    t: [
      ["Pressure on a wound", "pressing firmly on a bleeding cut with a clean cloth to slow the bleeding", "לחץ על פצע", "לחיצה חזקה על חתך שמדמם בעזרת בד נקי כדי להאט את הדימום"],
      ["Cooling a burn", "holding a burn under cool running water for about 20 minutes", "קירור כווייה", "החזקת כווייה מתחת למים זורמים קרירים כ־20 דקות"],
      ["Recovery position", "lying an unconscious person who is breathing on their side to keep the airway open", "תנוחת התאוששות", "השכבה על הצד של אדם מחוסר הכרה שנושם, כדי לשמור על נתיב האוויר פתוח"],
      ["First aid kit", "a box of supplies such as bandages, gauze and gloves", "ערכת עזרה ראשונה", "קופסה עם ציוד כמו תחבושות, גזה וכפפות"],
    ],
    q: [
      [["What is the right first aid for a small burn from a hot pan?", "Cool it under cool running water for about 20 minutes", ["Put butter on it", "Put ice straight on it for an hour", "Pop any blisters"], "Cool running water lowers the heat in the skin; butter and direct ice can make it worse."],
        ["מה העזרה הראשונה הנכונה לכווייה קטנה ממחבת חמה?", "לקרר אותה תחת מים זורמים קרירים כ־20 דקות", ["למרוח עליה חמאה", "לשים עליה קרח ישירות לשעה", "לפוצץ שלפוחיות"], "מים זורמים קרירים מורידים את החום מהעור; חמאה וקרח ישיר עלולים להחמיר."]],
      [["A friend's nose is bleeding. What should they do?", "Sit, lean forward and pinch the soft part of the nose", ["Lie flat on their back", "Tilt the head far back", "Blow the nose hard"], "Leaning forward stops blood running down the throat; pinch for about 10–15 minutes."],
        ["לחבר יורד דם מהאף. מה עליו לעשות?", "לשבת, להתכופף קדימה וללחוץ על החלק הרך של האף", ["לשכב על הגב", "להטות את הראש הרבה אחורה", "לקנח את האף בחוזקה"], "התכופפות קדימה מונעת מהדם לזרום לגרון; לוחצים כ־10–15 דקות."]],
    ],
  },
  a: {
    t: [
      ["CPR", "chest compressions (and rescue breaths) given when someone is not breathing normally", "החייאה", "לחיצות חזה (והנשמות) שנותנים כשאדם לא נושם כרגיל"],
      ["Defibrillator (AED)", "a device that gives an electric shock to restart a normal heart rhythm, with spoken instructions", "דפיברילטור", "מכשיר שנותן מכת חשמל כדי להחזיר קצב לב תקין, ונותן הוראות קוליות"],
      ["Choking", "something blocking the airway so the person cannot breathe or speak", "חנק", "משהו שחוסם את נתיב האוויר, כך שהאדם לא יכול לנשום או לדבר"],
      ["Chain of survival", "the linked steps that save lives: call for help, early CPR, early defibrillation and advanced care", "שרשרת ההישרדות", "הצעדים המקושרים שמצילים חיים: קריאה לעזרה, החייאה מוקדמת, דפיברילציה מוקדמת וטיפול מתקדם"],
    ],
    q: [
      [["In adult CPR, about how fast should chest compressions be?", "100 to 120 per minute", ["20 to 30 per minute", "200 per minute", "One every 10 seconds"], "Guidelines recommend 100–120 compressions a minute, pressing hard in the centre of the chest."],
        ["בהחייאת מבוגר, באיזה קצב בערך צריכות להיות לחיצות החזה?", "100 עד 120 בדקה", ["20 עד 30 בדקה", "200 בדקה", "אחת כל 10 שניות"], "ההנחיות ממליצות על 100–120 לחיצות בדקה, בלחיצה חזקה במרכז החזה."]],
      [["Why can anyone use a public defibrillator (AED)?", "It analyses the heart rhythm and only shocks if needed, guiding the user by voice", ["It works only for doctors", "It always gives a shock", "It needs a password"], "AEDs are designed for untrained people; using one early greatly improves survival."],
        ["למה כל אחד יכול להשתמש בדפיברילטור ציבורי?", "הוא מנתח את קצב הלב, נותן מכה רק כשצריך ומדריך את המשתמש בקול", ["הוא עובד רק לרופאים", "הוא תמיד נותן מכה", "צריך סיסמה כדי להפעיל אותו"], "דפיברילטורים ציבוריים מתוכננים לאנשים בלי הכשרה; שימוש מוקדם משפר מאוד את סיכויי ההישרדות."]],
    ],
  },
};
export default c;
