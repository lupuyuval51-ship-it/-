import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Root (shoresh)", "the core letters of a Hebrew word, usually three, that carry its basic meaning", "שורש", "האותיות הבסיסיות של מילה בעברית, לרוב שלוש, שנושאות את משמעותה הבסיסית"],
      ["Word family", "words that share the same root, like כתב, מכתב and כתובת", "משפחת מילים", "מילים בעלות אותו שורש, כמו כתב, מכתב וכתובת"],
      ["Prefix letters", "letters added at the start of a word, like ה, ו, ב, ל, מ, ש", "אותיות השימוש", "אותיות שמצטרפות לתחילת מילה, כמו ה, ו, ב, ל, מ, ש"],
      ["Pattern (mishkal)", "the template of vowels and extra letters that turns a root into a noun", "משקל", "התבנית של תנועות ואותיות נוספות שהופכת שורש לשם עצם"],
    ],
    q: [
      [["What is the root of the word מכתב (letter)?", "כ־ת־ב", ["מ־כ־ת", "כ־ב־ת", "ת־ב־מ"], "מכתב belongs to the family of כתב, כותב and כתובת: the root is כ־ת־ב."],
        ["מהו השורש של המילה ״מכתב״?", "כ־ת־ב", ["מ־כ־ת", "כ־ב־ת", "ת־ב־מ"], "״מכתב״ שייכת למשפחה של כתב, כותב וכתובת: השורש הוא כ־ת־ב."]],
      [["Which word does NOT share a root with לימוד (learning)?", "מלך", ["תלמיד", "מלמד", "למד"], "תלמיד, מלמד and למד all come from ל־מ־ד; מלך comes from מ־ל־ך."],
        ["איזו מילה אינה מאותו שורש כמו ״לימוד״?", "מלך", ["תלמיד", "מלמד", "למד"], "תלמיד, מלמד ולמד באים כולם מהשורש ל־מ־ד; ״מלך״ בא מהשורש מ־ל־ך."]],
    ],
  },
  i: {
    t: [
      ["Binyan", "one of the seven verb patterns of Hebrew, such as pa'al, nif'al and pi'el", "בניין", "אחת משבע התבניות של הפועל בעברית, כמו פעל, נפעל ופיעל"],
      ["Pa'al (kal)", "the basic verb pattern: כתב, שמר, למד", "פעל (קל)", "בניין הפועל הבסיסי: כתב, שמר, למד"],
      ["Nif'al", "a pattern that is often the passive of pa'al: נכתב, נשמר", "נפעל", "בניין שהוא פעמים רבות הסביל של בניין קל: נכתב, נשמר"],
      ["Hitpa'el", "a pattern that is often reflexive, an action done to oneself: התלבש, התרחץ", "התפעל", "בניין שמבטא פעמים רבות פעולה חוזרת, שאדם עושה לעצמו: התלבש, התרחץ"],
    ],
    q: [
      [["What is the root of התלבש (got dressed)?", "ל־ב־ש", ["ת־ל־ב", "ה־ל־ב", "ב־ש־ה"], "ה and ת are part of the hitpa'el pattern; the root is ל־ב־ש, as in לבש and לבוש."],
        ["מהו השורש של ״התלבש״?", "ל־ב־ש", ["ת־ל־ב", "ה־ל־ב", "ב־ש־ה"], "האותיות ה׳ ו־ת׳ הן חלק מתבנית בניין התפעל; השורש הוא ל־ב־ש, כמו בלבש ובלבוש."]],
      [["In which binyan is the verb נשבר (was broken)?", "Nif'al", ["Pa'al", "Pi'el", "Hif'il"], "נשבר follows the נפעל pattern (נ + root), the passive partner of שבר."],
        ["באיזה בניין הפועל ״נשבר״?", "נפעל", ["פעל", "פיעל", "הפעיל"], "״נשבר״ בנוי לפי תבנית נפעל (נ ועוד השורש), שהיא הסביל של ״שבר״."]],
    ],
  },
  a: {
    t: [
      ["Weak root (gizra)", "a root group with a letter that drops or changes, like פ״נ or ל״ה roots", "גזרה", "קבוצת שורשים שבהם אות נשמטת או משתנה, כמו גזרת פ״נ או ל״ה"],
      ["Hollow root (ע״ו/ע״י)", "a root whose middle letter is ו or י and often disappears: קם, שם", "גזרת ע״ו/ע״י", "שורש שהאות האמצעית שלו היא ו או י ולעיתים קרובות נעלמת: קם, שם"],
      ["Hif'il", "a pattern that often means causing someone to do something: הכתיב, הלביש", "הפעיל", "בניין שמבטא פעמים רבות גרימה של פעולה אצל אחר: הכתיב, הלביש"],
      ["Pu'al", "the passive pattern of pi'el: סופר, דובר", "פועל (בניין)", "בניין הסביל של פיעל: סופר, דובר"],
    ],
    q: [
      [["What is the root of the verb הפיל (dropped something)?", "נ־פ־ל", ["ה־פ־ל", "פ־י־ל", "ה־פ־י"], "In hif'il, the נ of a פ״נ root drops: הפיל comes from נ־פ־ל, like נפל."],
        ["מהו השורש של הפועל ״הפיל״?", "נ־פ־ל", ["ה־פ־ל", "פ־י־ל", "ה־פ־י"], "בבניין הפעיל ה־נ של גזרת פ״נ נשמטת: ״הפיל״ בא מהשורש נ־פ־ל, כמו ״נפל״."]],
      [["What is the root of the verb קמתי (I got up)?", "ק־ו־ם", ["ק־מ־ת", "ק־י־מ", "מ־ת־י"], "קם is a hollow (ע״ו) root: the ו of ק־ו־ם is hidden in many forms but returns in קום and תקומה."],
        ["מהו השורש של ״קמתי״?", "ק־ו־ם", ["ק־מ־ת", "ק־י־מ", "מ־ת־י"], "״קם״ הוא מגזרת ע״ו: ה־ו של ק־ו־ם נעלמת בצורות רבות וחוזרת ב״קום״ וב״תקומה״."]],
      [["Which pair shows a pi'el verb and its passive pu'al form?", "סיפר / סופר", ["כתב / נכתב", "הלביש / התלבש", "שמר / נשמר"], "Pi'el סיפר (told) has the passive pu'al סופר (was told)."],
        ["איזה זוג מראה פועל בבניין פיעל ואת צורת הסביל שלו בבניין פועל?", "סיפר / סופר", ["כתב / נכתב", "הלביש / התלבש", "שמר / נשמר"], "לפועל ״סיפר״ בבניין פיעל יש סביל בבניין פועל: ״סופר״."]],
    ],
  },
};
export default c;
