import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Root (shoresh)", "the core letters of a Hebrew word, usually three, that carry its basic meaning", "שורש", "האותיות הבסיסיות של מילה בעברית, לרוב שלוש, שנושאות את משמעותה הבסיסית"],
      ["Word family", "words that share the same root, like כתב, מכתב and כתובת", "משפחת מילים", "מילים בעלות אותו שורש, כמו כתב, מכתב וכתובת"],
      ["Prefix letters", "letters added at the start of a word, like ה, ו, ב, כ, ל, מ, ש", "אותיות השימוש", "אותיות שמצטרפות לתחילת מילה, כמו ה, ו, ב, כ, ל, מ, ש"],
      ["Pattern (mishkal)", "the template of vowels and extra letters that turns a root into a noun", "משקל", "התבנית של תנועות ואותיות נוספות שהופכת שורש לשם עצם"],
    ],
    q: [
      [["What is the root of the word מכתב (letter)?", "כ־ת־ב", ["מ־כ־ת", "כ־ב־ת", "ת־ב־מ"], "מכתב belongs to the family of כתב, כותב and כתובת: the root is כ־ת־ב."],
        ["מהו השורש של המילה ״מכתב״?", "כ־ת־ב", ["מ־כ־ת", "כ־ב־ת", "ת־ב־מ"], "״מכתב״ שייכת למשפחה של כתב, כותב וכתובת: השורש הוא כ־ת־ב."]],
      [["Which word does NOT share a root with לימוד (learning)?", "מלך", ["תלמיד", "מלמד", "למד"], "תלמיד, מלמד and למד all come from ל־מ־ד; מלך comes from מ־ל־ך."],
        ["איזו מילה אינה מאותו שורש כמו ״לימוד״?", "מלך", ["תלמיד", "מלמד", "למד"], "תלמיד, מלמד ולמד באים כולם מהשורש ל־מ־ד; ״מלך״ בא מהשורש מ־ל־ך."]],
      [["Which word comes from the same root as שומר (a guard)?", "משמרת", ["משמעת", "שמחה", "שמנת"], "משמרת (a shift on guard) comes from ש־מ־ר, like שומר and שמירה. משמעת (discipline) comes from ש־מ־ע, שמחה (joy) from ש־מ־ח and שמנת (cream) from ש־מ־ן: they share only the first two letters of the root."],
        ["איזו מילה באה מאותו שורש כמו ״שומר״?", "משמרת", ["משמעת", "שמחה", "שמנת"], "״משמרת״ באה מהשורש ש־מ־ר, כמו ״שומר״ ו״שמירה״. ״משמעת״ באה מהשורש ש־מ־ע, ״שמחה״ מהשורש ש־מ־ח ו״שמנת״ מהשורש ש־מ־ן: משותפות להן רק שתי האותיות הראשונות של השורש."]],
      [["What is the root of the word משחק (a game)?", "ש־ח־ק", ["מ־ש־ח", "מ־ח־ק", "ח־ק־מ"], "The מ at the start of משחק belongs to the pattern, as in מכתב, so it is not a root letter. The root is ש־ח־ק, as in שיחק (played) and שחקן (a player or an actor)."],
        ["מהו השורש של המילה ״משחק״?", "ש־ח־ק", ["מ־ש־ח", "מ־ח־ק", "ח־ק־מ"], "ה־מ שבתחילת ״משחק״ שייכת למשקל, כמו ב״מכתב״, ולכן אינה אות שורש. השורש הוא ש־ח־ק, כמו ב״שיחק״ וב״שחקן״."]],
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
      [["All of these verbs come from the root כ־ת־ב. Which one is in hitpa'el?", "התכתב", ["כתב", "נכתב", "הכתיב"], "Hitpa'el puts ה and ת before the root: התכתב, he wrote letters back and forth with someone. Here the pattern shows an action people do with each other. כתב is pa'al, נכתב (was written) is nif'al and הכתיב (dictated) is hif'il."],
        ["כל הפעלים האלה באים מהשורש כ־ת־ב. איזה מהם בבניין התפעל?", "התכתב", ["כתב", "נכתב", "הכתיב"], "בבניין התפעל באות ה׳ ו־ת׳ לפני השורש: ״התכתב״ – כתב מכתבים הלוך ושוב עם מישהו. כאן הבניין מבטא פעולה הדדית. ״כתב״ הוא בבניין פעל, ״נכתב״ בנפעל, ו״הכתיב״ (אמר למישהו מה לכתוב) בהפעיל."]],
      [["In הילד התרחץ במקלחת (the boy washed in the shower), what does the hitpa'el pattern of התרחץ show?", "That the boy washed himself", ["That he made someone else wash", "That he was washed by his mother", "That he washes every single day"], "Hitpa'el often shows an action done to oneself: in התרחץ the one who washes is also the one who is washed, as in התלבש (got dressed). Making someone else do something is typical of hif'il, as in הלביש (dressed someone)."],
        ["במשפט ״הילד התרחץ במקלחת״, מה מבטא בניין התפעל בפועל ״התרחץ״?", "שהילד רחץ את עצמו", ["שהוא גרם למישהו אחר לרחוץ", "שאמא שלו רחצה אותו", "שהוא מתרחץ בכל יום"], "בניין התפעל מבטא פעמים רבות פעולה חוזרת: ב״התרחץ״ מי שרוחץ הוא גם מי שנרחץ, כמו ב״התלבש״. גרימה של פעולה אצל אחר אופיינית לבניין הפעיל, כמו ב״הלביש״."]],
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
      [["What is the root of the verb קניתי (I bought)?", "ק־נ־ה", ["ק־נ־ת", "נ־י־ת", "ק־נ־ן"], "קניתי belongs to the ל״ה group: the root is ק־נ־ה, as in קנה and קנייה. In many forms the final ה of the root turns into י, and ־תי is only the ending that means I, so ת is not a root letter. ק־נ־ן is a different root, the one of קן (a nest) and קינן (nested)."],
        ["מהו השורש של הפועל ״קניתי״?", "ק־נ־ה", ["ק־נ־ת", "נ־י־ת", "ק־נ־ן"], "״קניתי״ שייך לגזרת ל״ה: השורש הוא ק־נ־ה, כמו ב״קנה״ וב״קנייה״. בצורות רבות ה־ה שבסוף השורש מתחלפת ב־י, ו־תי היא רק הסיומת של ״אני״, ולכן ת אינה אות שורש. ק־נ־ן הוא שורש אחר, של ״קן״ ושל ״קינן״."]],
      [["Which pair shows a pi'el verb and its passive pu'al form?", "סיפר / סופר", ["כתב / נכתב", "הלביש / התלבש", "שמר / נשמר"], "Pi'el סיפר (told) has the passive pu'al סופר (was told)."],
        ["איזה זוג מראה פועל בבניין פיעל ואת צורת הסביל שלו בבניין פועל?", "סיפר / סופר", ["כתב / נכתב", "הלביש / התלבש", "שמר / נשמר"], "לפועל ״סיפר״ בבניין פיעל יש סביל בבניין פועל: ״סופר״."]],
    ],
  },
};
export default c;
