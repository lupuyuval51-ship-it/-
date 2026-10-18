import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Connective (milat kishur)", "a word that links two ideas and shows how they are related, like אבל, כי or לכן", "מילת קישור", "מילה שמחברת בין שני רעיונות ומראה מה היחס ביניהם, כמו ״אבל״, ״כי״ או ״לכן״"],
      ["Contrast", "a relation between two ideas that differ or clash, shown by אבל or אולם", "ניגוד", "יחס בין שני רעיונות שונים או סותרים, שמבטאים אותו ב״אבל״ או ב״אולם״"],
      ["Cause", "the reason that something happens, shown by כי or מפני ש", "סיבה", "הגורם לכך שמשהו קורה, שמבטאים אותו ב״כי״ או ב״מפני ש״"],
      ["Result", "what happens because of something else, shown by לכן or ולכן", "תוצאה", "מה שקורה בעקבות דבר אחר, שמבטאים אותו ב״לכן״ או ב״ולכן״"],
    ],
    q: [
      [["Which connective fits: רציתי לצאת, ___ ירד גשם חזק (I wanted to go out, ___ it rained hard)?", "אבל", ["לכן", "כי", "וגם"], "The rain worked against the wish to go out, so the relation is contrast: אבל. לכן would make the rain a result of wanting to go out, and כי would make it the reason for wanting to."],
        ["איזו מילת קישור מתאימה: ״רציתי לצאת, ___ ירד גשם חזק״?", "אבל", ["לכן", "כי", "וגם"], "הגשם עמד בניגוד לרצון לצאת, ולכן היחס הוא ניגוד: ״אבל״. ״לכן״ הייתה הופכת את הגשם לתוצאה של הרצון לצאת, ו״כי״ הייתה הופכת אותו לסיבה לרצון הזה."]],
      [["Which connective introduces a cause, a reason?", "משום ש", ["לפיכך", "אולם", "יתר על כן"], "משום ש means because, so it introduces a reason. לפיכך (therefore) introduces a result, אולם (however) a contrast and יתר על כן (moreover) an addition."],
        ["איזו מילת קישור פותחת סיבה?", "משום ש", ["לפיכך", "אולם", "יתר על כן"], "״משום ש״ פירושה ״בגלל ש״, ולכן היא פותחת סיבה. ״לפיכך״ פותחת תוצאה, ״אולם״ ניגוד, ו״יתר על כן״ הוספה."]],
      [["In הייתי עייף, לכן הלכתי לישון מוקדם (I was tired, so I went to bed early), what relation does לכן show?", "Result", ["Cause", "Contrast", "Addition"], "Going to bed early happened because of being tired, so what follows לכן is the result. The cause, being tired, comes before it."],
        ["במשפט ״הייתי עייף, לכן הלכתי לישון מוקדם״, איזה יחס מבטאת ״לכן״?", "תוצאה", ["סיבה", "ניגוד", "הוספה"], "ההליכה לישון מוקדם קרתה בגלל העייפות, ולכן מה שבא אחרי ״לכן״ הוא התוצאה. הסיבה, העייפות, באה לפניה."]],
      [["Which connective fits: ___ תתאמנו כל יום, תשתפרו מהר (___ you practise every day, you will improve fast)?", "אם", ["כי", "אבל", "לכן"], "Improving depends on practising, so the relation is a condition: אם (if). The other words cannot open this kind of sentence."],
        ["איזו מילת קישור מתאימה: ״___ תתאמנו כל יום, תשתפרו מהר״?", "אם", ["כי", "אבל", "לכן"], "השיפור תלוי באימון, ולכן היחס הוא תנאי: ״אם״. המילים האחרות אינן יכולות לפתוח משפט כזה."]],
      [["Which connective adds another point in the same direction?", "וגם", ["אולם", "לכן", "כדי"], "וגם adds information, as in הסרט היה מצחיק וגם מרגש. אולם shows contrast, לכן shows a result and כדי shows a purpose."],
        ["איזו מילת קישור מוסיפה עוד טענה באותו כיוון?", "וגם", ["אולם", "לכן", "כדי"], "״וגם״ מוסיפה מידע, כמו ב״הסרט היה מצחיק וגם מרגש״. ״אולם״ מבטאת ניגוד, ״לכן״ תוצאה ו״כדי״ תכלית."]],
      [["Which word fits: קמתי מוקדם ___ להספיק לאוטובוס (I got up early ___ catch the bus)?", "כדי", ["כי", "אם", "אבל"], "Catching the bus was the goal of getting up early, so the relation is purpose: כדי. כי would need a reason in a full clause, such as כי רציתי להספיק."],
        ["איזו מילה מתאימה: ״קמתי מוקדם ___ להספיק לאוטובוס״?", "כדי", ["כי", "אם", "אבל"], "להספיק לאוטובוס הייתה המטרה של הקימה המוקדמת, ולכן היחס הוא תכלית: ״כדי״. ״כי״ דורשת סיבה במשפט שלם, כמו ״כי רציתי להספיק״."]],
    ],
  },
  i: {
    t: [
      ["Concession", "a relation in which something happens even though a reason pointed the other way, as with למרות ש", "ויתור", "יחס שבו משהו קורה אף שהייתה סיבה שלא יקרה, כמו אחרי ״למרות ש״"],
      ["Purpose", "the goal an action is meant to reach, shown by כדי or על מנת", "תכלית", "המטרה שפעולה נועדה להשיג, שמבטאים אותה ב״כדי״ או ב״על מנת״"],
      ["Condition", "something that must be true for something else to happen, as after אם", "תנאי", "דבר שצריך להתקיים כדי שדבר אחר יקרה, כמו אחרי ״אם״"],
      ["Addition", "a relation that adds a point in the same direction, shown by וגם or בנוסף", "הוספה", "יחס שמוסיף טענה או פרט באותו כיוון, שמבטאים אותו ב״וגם״ או ב״בנוסף״"],
    ],
    q: [
      [["Which word fits: ___ שירד גשם כל היום, המשחק התקיים כרגיל (___ it rained all day, the game went ahead as usual)?", "למרות", ["כיוון", "מפני", "בגלל"], "Rain would normally stop a game, yet it went ahead: that is concession, למרות ש (even though). כיוון ש, מפני ש and בגלל ש would make the rain the reason the game went ahead, which does not fit."],
        ["איזו מילה מתאימה: ״___ שירד גשם כל היום, המשחק התקיים כרגיל״?", "למרות", ["כיוון", "מפני", "בגלל"], "גשם בדרך כלל מבטל משחק, ובכל זאת הוא התקיים: זה ויתור, ״למרות ש״. ״כיוון ש״, ״מפני ש״ ו״בגלל ש״ היו הופכות את הגשם לסיבה לכך שהמשחק התקיים, וזה אינו מתאים."]],
      [["Which sentence shows concession?", "אף שהתאמנה מעט, היא ניצחה במרוץ", ["היא התאמנה הרבה, ולכן ניצחה במרוץ", "היא ניצחה במרוץ כי התאמנה הרבה", "היא התאמנה כדי לנצח במרוץ"], "Little training would make a win unlikely, yet she won: אף ש (although) shows concession. The other sentences show a result, a cause and a purpose."],
        ["איזה משפט מבטא ויתור?", "אף שהתאמנה מעט, היא ניצחה במרוץ", ["היא התאמנה הרבה, ולכן ניצחה במרוץ", "היא ניצחה במרוץ כי התאמנה הרבה", "היא התאמנה כדי לנצח במרוץ"], "מעט אימונים היו אמורים להקשות על הניצחון, ובכל זאת היא ניצחה: ״אף ש״ מבטאת ויתור. המשפטים האחרים מבטאים תוצאה, סיבה ותכלית."]],
      [["In נרדמתי בשיעור כי לא ישנתי בלילה (I fell asleep in class because I did not sleep at night), what is the cause?", "לא ישנתי בלילה", ["נרדמתי בשיעור", "השיעור היה משעמם", "Both parts together"], "כי opens the cause: not sleeping at night is why I fell asleep. נרדמתי בשיעור is the result, and the sentence never says that the lesson was boring."],
        ["במשפט ״נרדמתי בשיעור כי לא ישנתי בלילה״, מהי הסיבה?", "לא ישנתי בלילה", ["נרדמתי בשיעור", "השיעור היה משעמם", "שני החלקים יחד"], "״כי״ פותחת את הסיבה: חוסר השינה בלילה הוא הסיבה להירדמות. ״נרדמתי בשיעור״ היא התוצאה, והמשפט אינו אומר שהשיעור היה משעמם."]],
      [["Which connective can replace כי without changing the meaning?", "מפני ש", ["כדי ש", "אף על פי ש", "לכן"], "כי and מפני ש both open a reason, so they can swap. כדי ש opens a purpose, אף על פי ש a concession, and לכן comes before a result, not a reason."],
        ["איזו מילת קישור יכולה לבוא במקום ״כי״ בלי לשנות את המשמעות?", "מפני ש", ["כדי ש", "אף על פי ש", "לכן"], "״כי״ ו״מפני ש״ פותחות שתיהן סיבה, ולכן אפשר להחליף ביניהן. ״כדי ש״ פותחת תכלית, ״אף על פי ש״ ויתור, ו״לכן״ באה לפני תוצאה ולא לפני סיבה."]],
      [["In הוא למד הרבה כדי לעבור את המבחן (he studied a lot in order to pass the test), what relation does כדי show?", "Purpose", ["Cause", "Result", "Condition"], "כדי tells the goal of studying, passing the test, so the relation is purpose. A cause would explain what made him study, as in כי המבחן קשה."],
        ["במשפט ״הוא למד הרבה כדי לעבור את המבחן״, איזה יחס מבטאת ״כדי״?", "תכלית", ["סיבה", "תוצאה", "תנאי"], "״כדי״ מציינת את המטרה של הלמידה – לעבור את המבחן – ולכן היחס הוא תכלית. סיבה הייתה מסבירה מה גרם לו ללמוד, כמו ״כי המבחן קשה״."]],
      [["Which sentence states a condition?", "נצא לטיול בתנאי שלא ירד גשם", ["יצאנו לטיול אף שירד גשם", "לא יצאנו לטיול כי ירד גשם", "יצאנו לטיול, ואחר כך ירד גשם"], "בתנאי ש (on condition that) makes the trip depend on the weather: a condition. The others show concession, cause and order in time."],
        ["איזה משפט מבטא תנאי?", "נצא לטיול בתנאי שלא ירד גשם", ["יצאנו לטיול אף שירד גשם", "לא יצאנו לטיול כי ירד גשם", "יצאנו לטיול, ואחר כך ירד גשם"], "״בתנאי ש״ קושרת את הטיול למזג האוויר: זה תנאי. המשפטים האחרים מבטאים ויתור, סיבה ורצף בזמן."]],
    ],
  },
  a: {
    t: [
      ["Hypothetical condition", "a condition that did not or cannot come true, opened by אילו or לו", "תנאי בטל", "תנאי שלא התקיים או שאינו יכול להתקיים, שנפתח ב״אילו״ או ב״לו״"],
      ["Logical relation", "the meaning link between two parts of a text, such as cause, result or contrast", "קשר לוגי", "היחס בין שני חלקים בטקסט מבחינת המשמעות, כמו סיבה, תוצאה או ניגוד"],
      ["Restriction", "a relation that limits what was said or names an exception, shown by אלא אם כן or מלבד", "הסתייגות", "יחס שמגביל את מה שנאמר או מציין יוצא מן הכלל, כמו ב״אלא אם כן״ וב״מלבד״"],
      ["Clarification", "a relation that says an idea again in clearer words, shown by כלומר or דהיינו", "הבהרה", "יחס שבו חוזרים על רעיון במילים ברורות יותר, כמו ב״כלומר״ וב״דהיינו״"],
    ],
    q: [
      [["Which connective shows the same relation as לפיכך?", "על כן", ["הואיל ו", "אולם", "אילו"], "לפיכך and על כן both mean therefore and introduce a result. הואיל ו (since) introduces a cause, the other side of the same link; אולם shows contrast and אילו a hypothetical condition."],
        ["איזו מילת קישור מבטאת את אותו יחס כמו ״לפיכך״?", "על כן", ["הואיל ו", "אולם", "אילו"], "״לפיכך״ ו״על כן״ פותחות שתיהן תוצאה. ״הואיל ו״ פותחת סיבה, הצד השני של אותו קשר; ״אולם״ מבטאת ניגוד, ו״אילו״ תנאי בטל."]],
      [["Rewrite המשחק בוטל כי ירד גשם (the game was cancelled because it rained) with לכן, keeping the meaning.", "ירד גשם, ולכן המשחק בוטל", ["המשחק בוטל, ולכן ירד גשם", "ירד גשם, אבל המשחק בוטל", "אם ירד גשם, המשחק יבוטל"], "כי comes before the cause, but לכן comes before the result, so the parts must swap: first the rain, then ולכן and the cancelled game. Keeping the old order would make the rain a result of the cancellation."],
        ["כתבו מחדש את ״המשחק בוטל כי ירד גשם״ עם ״לכן״, בלי לשנות את המשמעות.", "ירד גשם, ולכן המשחק בוטל", ["המשחק בוטל, ולכן ירד גשם", "ירד גשם, אבל המשחק בוטל", "אם ירד גשם, המשחק יבוטל"], "״כי״ באה לפני הסיבה, ו״לכן״ באה לפני התוצאה, ולכן צריך להחליף את סדר החלקים: קודם הגשם, ואחריו ״ולכן״ והמשחק שבוטל. בסדר הישן הגשם היה נעשה תוצאה של הביטול."]],
      [["Which sentence imagines a situation that did not really happen?", "אילו הקשבת, היית מבין", ["אם תקשיב בשיעור, תבין אותו", "כיוון שהקשבת, הבנת הכול", "אף שהקשבת, לא הבנת הכול"], "אילו with היית מבין describes something that did not happen: the listener did not listen, so did not understand. אם תקשיב is a real, open condition about the future."],
        ["איזה משפט מתאר מצב שלא קרה באמת?", "אילו הקשבת, היית מבין", ["אם תקשיב בשיעור, תבין אותו", "כיוון שהקשבת, הבנת הכול", "אף שהקשבת, לא הבנת הכול"], "״אילו״ עם ״היית מבין״ מתארת דבר שלא קרה: מי שמדברים אליו לא הקשיב, ולכן לא הבין. ״אם תקשיב״ הוא תנאי פתוח שנוגע לעתיד."]],
      [["Fill in: אחי אוהב ספורט, ___ אני מעדיף לקרוא (my brother loves sport, ___ I prefer reading).", "ואילו", ["ולכן", "כיוון ש", "כדי ש"], "The sentence compares two people with different tastes, which is contrast: ואילו (whereas). ולכן would make my reading a result of my brother's love of sport."],
        ["השלימו: ״אחי אוהב ספורט, ___ אני מעדיף לקרוא״.", "ואילו", ["ולכן", "כיוון ש", "כדי ש"], "המשפט משווה בין שני אנשים בעלי טעם שונה, וזה ניגוד: ״ואילו״. ״ולכן״ הייתה הופכת את הקריאה שלי לתוצאה של אהבת הספורט של אחי."]],
      [["Fill in: התאמנו מעט, ___ ניצחנו (we trained very little, ___ we won).", "ובכל זאת", ["ומשום כך", "כיוון ש", "כדי ש"], "Winning after little training goes against what we would expect, so the second part needs ובכל זאת (and yet), a concession. ומשום כך would claim that we won because we trained little."],
        ["השלימו: ״התאמנו מעט, ___ ניצחנו״.", "ובכל זאת", ["ומשום כך", "כיוון ש", "כדי ש"], "ניצחון אחרי מעט אימונים מנוגד למה שמצפים, ולכן החלק השני צריך ״ובכל זאת״ – ויתור. ״ומשום כך״ הייתה טוענת שניצחנו בגלל שהתאמנו מעט."]],
      [["Which sentence uses its connective in a way that makes no sense?", "הוא נכשל במבחן כי למד הרבה", ["הוא נכשל במבחן אף שלמד הרבה", "הוא למד הרבה, ולכן הצליח במבחן", "הוא למד הרבה כדי להצליח במבחן"], "Studying a lot is not a reason to fail, so כי makes the sentence illogical; the right link is concession, אף ש. The other three sentences are logical."],
        ["באיזה משפט מילת הקישור אינה הגיונית?", "הוא נכשל במבחן כי למד הרבה", ["הוא נכשל במבחן אף שלמד הרבה", "הוא למד הרבה, ולכן הצליח במבחן", "הוא למד הרבה כדי להצליח במבחן"], "למידה רבה אינה סיבה להיכשל, ולכן ״כי״ הופכת את המשפט לבלתי הגיוני; הקשר הנכון הוא ויתור, ״אף ש״. שלושת המשפטים האחרים הגיוניים."]],
    ],
  },
};
export default c;
