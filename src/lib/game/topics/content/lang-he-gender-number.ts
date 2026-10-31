import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Masculine", "one of the two genders of Hebrew nouns, as in ילד and ספר; words for boys and men belong to it", "זכר", "אחד משני המינים של שמות העצם בעברית, כמו ״ילד״ ו״ספר״; המילים לבנים ולגברים שייכות לו"],
      ["Feminine", "the other gender of Hebrew nouns; words for girls and women belong to it, and many of its words end in ה or ת", "נקבה", "המין השני של שמות העצם בעברית; המילים לבנות ולנשים שייכות לו, ורבות מהמילים בו מסתיימות ב־ה או ב־ת"],
      ["Singular", "the form of a word that means just one", "יחיד", "צורת המילה שמתכוונת לאחד בלבד"],
      ["Plural", "the form of a word that means more than one", "רבים", "צורת המילה שמתכוונת ליותר מאחד"],
    ],
    q: [
      [["What is the plural of ילד (a boy)?", "ילדים", ["ילדות", "ילדה", "ילדון"], "Most masculine words take the ending ־ים in the plural, so ילד becomes ילדים. The ending ־ות usually belongs to feminine words: ילדות means girls."],
        ["מהו הרבים של ״ילד״?", "ילדים", ["ילדות", "ילדה", "ילדון"], "רוב המילים בזכר מקבלות ברבים את הסיום ־ים, ולכן מ״ילד״ נעשה ״ילדים״. הסיום ־ות שייך בדרך כלל למילים בנקבה: ״ילדות״ הן בנות."]],
      [["Which of these words is feminine?", "מחברת (a notebook)", ["ספר (a book)", "שולחן (a table)", "כיסא (a chair)"], "מחברת is feminine: it ends in ־ת, and we say מחברת חדשה. ספר, שולחן and כיסא are masculine."],
        ["איזו מהמילים האלה היא בנקבה?", "מחברת", ["ספר", "שולחן", "כיסא"], "״מחברת״ היא בנקבה: היא מסתיימת ב־ת, ואומרים ״מחברת חדשה״. ״ספר״, ״שולחן״ ו״כיסא״ הם בזכר."]],
      [["Which sentence correctly says “The girl is big”?", "הילדה גדולה", ["הילדה גדול", "הילדה גדולים", "הילדה גדולות"], "The adjective matches the noun in gender and number. ילדה is feminine singular, so the adjective is גדולה."],
        ["איזה משפט נכון בעברית?", "הילדה גדולה", ["הילדה גדול", "הילדה גדולים", "הילדה גדולות"], "שם התואר מתאים לשם העצם במין ובמספר. ״ילדה״ היא נקבה ביחיד, ולכן שם התואר הוא ״גדולה״."]],
      [["What is the plural of שמלה (a dress)?", "שמלות", ["שמלים", "שמלהות", "שמלתים"], "Feminine words that end in ה usually drop the ה and take ־ות in the plural: שמלה becomes שמלות, just as ילדה becomes ילדות."],
        ["מהו הרבים של ״שמלה״?", "שמלות", ["שמלים", "שמלהות", "שמלתים"], "מילים בנקבה שמסתיימות ב־ה בדרך כלל משמיטות את ה־ה ומקבלות ברבים את הסיום ־ות: ״שמלה״ נעשית ״שמלות״, כמו ש״ילדה״ נעשית ״ילדות״."]],
    ],
  },
  i: {
    t: [
      ["Agreement", "the rule that adjectives and verbs take the same gender and number as the noun they describe", "התאמה", "הכלל ששם התואר והפועל באים באותו מין ובאותו מספר כמו שם העצם שהם מתארים"],
      ["Dual", "a special form that means exactly two, ending in ־יים, as in שבועיים (two weeks) and שעתיים (two hours)", "זוגי", "צורה מיוחדת שמשמעותה בדיוק שניים, בסיום ־יים, כמו ״שבועיים״ ו״שעתיים״"],
      ["Irregular plural", "a plural that does not follow the usual pattern, such as שנים (years) from שנה", "צורת רבים חריגה", "צורת רבים שלא בנויה לפי הכלל הרגיל, כמו ״שנים״ מ״שנה״"],
      ["Pronoun", "a short word that stands in for a noun, such as הוא, היא, הם and הן", "כינוי גוף", "מילה קצרה שבאה במקום שם עצם, כמו הוא, היא, הם והן"],
    ],
    q: [
      [["What is the plural of אב (a father)?", "אבות", ["אבים", "אביות", "אבה"], "אב is masculine, yet its plural takes ־ות: אבות. A word's plural ending does not change its gender, so we say אבות טובים."],
        ["מהו הרבים של ״אב״?", "אבות", ["אבים", "אביות", "אבה"], "״אב״ הוא בזכר, ובכל זאת הרבים שלו מסתיים ב־ות: ״אבות״. סיום הרבים לא משנה את מין המילה, ולכן אומרים ״אבות טובים״."]],
      [["What is the plural of אישה (a woman)?", "נשים", ["אישות", "אישים", "אישהים"], "אישה has a completely irregular plural: נשים. Although it ends in ־ים, it stays feminine: נשים חכמות."],
        ["מהו הרבים של ״אישה״?", "נשים", ["אישות", "אישים", "אישהים"], "ל״אישה״ יש צורת רבים חריגה לגמרי: ״נשים״. אף שהוא מסתיים ב־ים, הוא נשאר בנקבה: ״נשים חכמות״."]],
      [["Which form correctly says “two days”?", "יומיים", ["שתי ימים", "שני יומיים", "שתיים יום"], "Hebrew has a special dual form for some words of time: יומיים, שבועיים, שנתיים. It already means two, so no number is added before it."],
        ["איזו מהצורות הבאות כתובה נכון?", "יומיים", ["שתי ימים", "שני יומיים", "שתיים יום"], "לחלק ממילות הזמן יש בעברית צורת זוגי מיוחדת: ״יומיים״, ״שבועיים״, ״שנתיים״. היא כבר אומרת שניים, ולכן לא מוסיפים לפניה מספר."]],
      [["Which sentence correctly says “The tables are new”?", "השולחנות חדשים", ["השולחנות חדשות", "השולחנות חדש", "השולחנות חדשה"], "שולחן is masculine. Its plural ends in ־ות, but the adjective follows the noun's gender, not its ending, so it is חדשים."],
        ["איזה משפט נכון: השולחנות...?", "השולחנות חדשים", ["השולחנות חדשות", "השולחנות חדש", "השולחנות חדשה"], "״שולחן״ הוא בזכר. הרבים שלו מסתיים ב־ות, אבל שם התואר הולך לפי מין המילה ולא לפי הסיום שלה, ולכן ״חדשים״."]],
      [["Which of these words is masculine even though it ends in ה?", "לילה (night)", ["שמלה (a dress)", "מכונית (a car)", "ילדה (a girl)"], "We say לילה טוב, so לילה is masculine despite its ending. שמלה, מכונית and ילדה are all feminine."],
        ["איזו מהמילים האלה היא בזכר, אף שהיא מסתיימת ב־ה?", "לילה", ["שמלה", "מכונית", "ילדה"], "אומרים ״לילה טוב״, ולכן ״לילה״ היא בזכר למרות הסיום שלה. ״שמלה״, ״מכונית״ ו״ילדה״ הן כולן בנקבה."]],
      [["Which sentence correctly says “The girls are writing”?", "הבנות כותבות", ["הבנות כותבים", "הבנות כותבת", "הבנות כותב"], "The verb agrees with the noun too. בנות is feminine plural, so the verb is כותבות."],
        ["איזה משפט נכון: הבנות...?", "הבנות כותבות", ["הבנות כותבים", "הבנות כותבת", "הבנות כותב"], "גם הפועל מתאים לשם העצם. ״בנות״ הן נקבה ברבים, ולכן הפועל הוא ״כותבות״."]],
    ],
  },
  a: {
    t: [
      ["Gender of numbers", "the rule that numbers change form to match the noun: ארבעה כיסאות but ארבע כיתות", "מין המספר", "הכלל שלפיו המספר משנה צורה כדי להתאים לשם העצם: ״ארבעה כיסאות״ אבל ״ארבע כיתות״"],
      ["Plural-only noun", "a noun that has only a plural form, even when it names one thing, like מים and שמיים", "שם עצם ברבים בלבד", "שם עצם שיש לו רק צורה של רבים, גם כשמדובר בדבר אחד, כמו ״מים״ ו״שמיים״"],
      ["Collective noun", "a singular noun that names a whole group, such as משפחה (a family) or צוות (a team)", "שם קיבוצי", "שם עצם ביחיד שמציין קבוצה שלמה, כמו ״משפחה״ או ״צוות״"],
    ],
    q: [
      [["Which is correct for “three books”?", "שלושה ספרים", ["שלוש ספרים", "שלושה ספר", "שלוש ספר"], "With a masculine noun the number takes the form with ־ה: שלושה ספרים. The noun stays plural after the number."],
        ["איך אומרים נכון את המספר שלוש עם ״ספרים״?", "שלושה ספרים", ["שלוש ספרים", "שלושה ספר", "שלוש ספר"], "עם שם עצם בזכר המספר בא בצורה עם ה׳ בסוף: ״שלושה ספרים״. שם העצם נשאר ברבים אחרי המספר."]],
      [["Which is correct for “five notebooks”?", "חמש מחברות", ["חמישה מחברות", "חמש מחברת", "חמישה מחברת"], "With a feminine noun the number has no ־ה at the end: חמש מחברות. It looks the opposite of what you might expect, which is why it is a common mistake."],
        ["איך אומרים נכון את המספר חמש עם ״מחברות״?", "חמש מחברות", ["חמישה מחברות", "חמש מחברת", "חמישה מחברת"], "עם שם עצם בנקבה המספר בא בלי ה׳ בסוף: ״חמש מחברות״. זה נראה הפוך ממה שאפשר לצפות, ולכן זו טעות נפוצה."]],
      [["Which of these words is feminine, although it does not end in ה or ת?", "עיר (a city)", ["בית (a house)", "ספר (a book)", "יום (a day)"], "We say עיר גדולה, so עיר is feminine. Other feminine words without a feminine ending include ארץ, אבן and many body parts that come in pairs, like יד and עין."],
        ["איזו מהמילים האלה היא בנקבה, אף שהיא לא מסתיימת ב־ה או ב־ת?", "עיר", ["בית", "ספר", "יום"], "אומרים ״עיר גדולה״, ולכן ״עיר״ היא בנקבה. מילים נוספות בנקבה בלי סיומת של נקבה הן ״ארץ״, ״אבן״ ואיברים רבים שבאים בזוגות, כמו ״יד״ ו״עין״."]],
      [["Which sentence correctly says “The water is cold”?", "המים קרים", ["המים קר", "המים קרה", "המים קרות"], "מים exists only in the plural and is masculine, so the adjective is masculine plural: קרים."],
        ["איזה משפט נכון: המים...?", "המים קרים", ["המים קר", "המים קרה", "המים קרות"], "״מים״ באה רק ברבים והיא בזכר, ולכן שם התואר בא בזכר ברבים: ״קרים״."]],
      [["A group of five girls and one boy is walking to school. By the standard rule of Hebrew grammar, which sentence describes them?", "הם הולכים לבית הספר", ["הן הולכות לבית הספר", "הם הולכות לבית הספר", "הן הולכים לבית הספר"], "By the standard rule, a mixed group of males and females is described in the masculine plural, even when most of its members are female."],
        ["קבוצה של חמש בנות ובן אחד הולכת לבית הספר. לפי הכלל המקובל בדקדוק העברי, איזה משפט מתאר אותם?", "הם הולכים לבית הספר", ["הן הולכות לבית הספר", "הם הולכות לבית הספר", "הן הולכים לבית הספר"], "לפי הכלל המקובל, קבוצה מעורבת של זכרים ונקבות מתוארת בזכר ברבים, גם כשרוב חבריה הן נקבות."]],
      [["Which sentence correctly says “The team won”?", "הצוות ניצח", ["הצוות ניצחה", "הצוות ניצחת", "הצוות ניצחנו"], "צוות names a group of people, but the word itself is masculine singular, so the verb is masculine singular too: ניצח."],
        ["איזה משפט נכון: הצוות...?", "הצוות ניצח", ["הצוות ניצחה", "הצוות ניצחת", "הצוות ניצחנו"], "״צוות״ מציין קבוצה של אנשים, אבל המילה עצמה היא בזכר ביחיד, ולכן גם הפועל בזכר ביחיד: ״ניצח״."]],
    ],
  },
};
export default c;
