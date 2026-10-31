import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Synonyms", "words with the same or almost the same meaning, like יפה and נאה", "מילים נרדפות", "מילים שמשמעותן זהה או כמעט זהה, כמו ״יפה״ ו״נאה״"],
      ["Opposites (antonyms)", "words with contrary meanings, like גבוה and נמוך", "הפכים", "מילים שמשמעותן מנוגדת, כמו ״גבוה״ ו״נמוך״"],
      ["Word with several meanings", "one word that means more than one thing, like עין: an eye, and also a spring of water", "מילה רב־משמעית", "מילה אחת שיש לה כמה משמעויות, כמו ״עין״: איבר הראייה וגם מעיין"],
      ["Precise word", "the word that says exactly what you mean, chosen from several similar ones", "מילה מדויקת", "המילה שאומרת בדיוק את מה שמתכוונים אליו, מבין כמה מילים דומות"],
    ],
    q: [
      [["Which word means almost the same as שמח (happy)?", "עליז", ["עצוב", "עייף", "שקט"], "עליז (cheerful) means almost the same as שמח, so the two are synonyms. עצוב (sad) is its opposite, and עייף (tired) and שקט (quiet) mean other things."],
        ["איזו מילה קרובה במשמעותה למילה ״שמח״?", "עליז", ["עצוב", "עייף", "שקט"], "״עליז״ פירושו כמעט כמו ״שמח״, ולכן הן מילים נרדפות. ״עצוב״ הוא ההפך של ״שמח״, ו״עייף״ ו״שקט״ מתארים דברים אחרים."]],
      [["What is the opposite of חם (hot)?", "קר", ["חמים", "רטוב", "יבש"], "קר (cold) is the opposite of חם. חמים (warm) is close in meaning to חם, and רטוב and יבש (wet and dry) are a different pair of opposites."],
        ["מה ההפך של ״חם״?", "קר", ["חמים", "רטוב", "יבש"], "״קר״ הוא ההפך של ״חם״. ״חמים״ קרוב במשמעותו ל״חם״, ו״רטוב״ ו״יבש״ הם זוג הפכים אחר."]],
      [["What is the opposite of the verb פתח (opened)?", "סגר", ["פתר", "פרץ", "שבר"], "סגר (closed) is the opposite of פתח. פתר means solved and only looks similar, and פרץ and שבר mean broke in and broke."],
        ["מה ההפך של הפועל ״פתח״?", "סגר", ["פתר", "פרץ", "שבר"], "״סגר״ הוא ההפך של ״פתח״. ״פתר״ פירושו מצא פתרון ורק נראה דומה, ו״פרץ״ ו״שבר״ פירושם דברים אחרים לגמרי."]],
      [["Fill in, when the ball goes to Danny: נתתי ___ את הכדור.", "לו", ["לא", "לה", "לי"], "לו means to him, so נתתי לו את הכדור. It sounds exactly like לא (no), which is why the two are often confused; לה is to her and לי is to me."],
        ["השלימו, כשהכדור עובר לדני: ״נתתי ___ את הכדור״.", "לו", ["לא", "לה", "לי"], "״לו״ פירושו אליו, ולכן ״נתתי לו את הכדור״. המילה נשמעת בדיוק כמו ״לא״, ולכן מתבלבלים ביניהן; ״לה״ פירושו אליה, ו״לי״ – אליי."]],
      [["Which word can replace מהר (quickly) in הוא רץ מהר without changing the meaning?", "בזריזות", ["בזהירות", "בשקט", "לאט"], "בזריזות means quickly and nimbly, so הוא רץ בזריזות keeps the meaning. בזהירות (carefully) and בשקט (quietly) change it, and לאט (slowly) is the opposite."],
        ["איזו מילה יכולה לבוא במקום ״מהר״ במשפט ״הוא רץ מהר״ בלי לשנות את המשמעות?", "בזריזות", ["בזהירות", "בשקט", "לאט"], "״בזריזות״ פירושו במהירות ובקלילות, ולכן ״הוא רץ בזריזות״ שומר על המשמעות. ״בזהירות״ ו״בשקט״ משנים אותה, ו״לאט״ הוא ההפך."]],
      [["Which pair are opposites?", "ארוך – קצר", ["ארוך – גבוה", "ארוך – רחב", "ארוך – כבד"], "קצר (short) is the opposite of ארוך (long). גבוה (tall), רחב (wide) and כבד (heavy) describe other measures, not the opposite of length."],
        ["איזה זוג הוא זוג הפכים?", "ארוך – קצר", ["ארוך – גבוה", "ארוך – רחב", "ארוך – כבד"], "״קצר״ הוא ההפך של ״ארוך״. ״גבוה״, ״רחב״ ו״כבד״ מתארים מידות אחרות, ולא את ההפך של אורך."]],
    ],
  },
  i: {
    t: [
      ["Homophones", "words that sound the same but are spelled differently and mean different things, like עט (pen) and עת (time)", "הומופונים", "מילים שנשמעות אותו דבר אבל נכתבות אחרת ומשמעותן שונה, כמו ״עט״ ו״עת״"],
      ["Homographs", "words spelled with the same letters but read differently, like סֵפֶר (a book) and סַפָּר (a barber)", "הומוגרפים", "מילים שנכתבות באותן אותיות אבל נקראות אחרת, כמו סֵפֶר וסַפָּר"],
      ["Gradable opposites", "opposites with steps in between, like חם and קר, with פושר in the middle", "הפכים מדורגים", "הפכים שיש ביניהם דרגות, כמו ״חם״ ו״קר״, ובאמצע ״פושר״"],
    ],
    q: [
      [["In הספר הישן מונח על המדף (the old book lies on the shelf), which word is the opposite of ישן?", "חדש", ["ער", "צעיר", "גדול"], "Here ישן means old, so its opposite is חדש (new). ער (awake) is the opposite of the other meaning of ישן, asleep, and צעיר (young) is used for people, not for books."],
        ["במשפט ״הספר הישן מונח על המדף״, מה ההפך של ״ישן״?", "חדש", ["ער", "צעיר", "גדול"], "כאן ״ישן״ פירושו לא חדש, ולכן ההפך הוא ״חדש״. ״ער״ הוא ההפך של המשמעות האחרת של ״ישן״ – מי שנמצא בשינה, ו״צעיר״ נאמר על אנשים ולא על ספרים."]],
      [["עט (pen) and עת (time) sound the same. Which sentence is written correctly?", "שכחתי את העט בבית", ["שכחתי את העת בבית", "בכל עט אני מוכן לעזור", "הגיע העט ללכת הביתה"], "In this sentence someone forgot a pen at home, so it is עט. The other sentences need עת, time: בכל עת (at any time) and הגיעה העת (the time has come)."],
        ["״עט״ ו״עת״ נשמעות אותו דבר. איזה משפט כתוב נכון?", "שכחתי את העט בבית", ["שכחתי את העת בבית", "בכל עט אני מוכן לעזור", "הגיע העט ללכת הביתה"], "במשפט הזה מישהו שכח בבית כלי כתיבה, ולכן ״עט״. המשפטים האחרים צריכים את ״עת״, כלומר זמן: ״בכל עת״ ו״הגיעה העת״."]],
      [["Fill in: אני הולך לסרט ___ חברים (I am going to a film ___ friends).", "עם", ["אם", "הם", "את"], "עם means with. אם (if) sounds the same in everyday speech, so the two are easy to confuse; הם means they, and את is a different word that does not fit here."],
        ["השלימו: ״אני הולך לסרט ___ חברים״.", "עם", ["אם", "הם", "את"], "״עם״ פירושו ״ביחד עם, בחברת״. ״אם״ נשמעת בדיבור כמעט אותו דבר, ולכן קל להתבלבל ביניהן; ״הם״ הוא כינוי גוף, ו״את״ היא מילה אחרת שאינה מתאימה כאן."]],
      [["In הספר גזז לי את השיער (the ___ cut my hair), how is ספר read?", "סַפָּר – a barber", ["סֵפֶר – a book", "סִפֵּר – told a story", "סְפָר – a border region"], "Only a barber fits a sentence about cutting hair, so here it is סַפָּר. The same letters can be read סֵפֶר (a book), סִפֵּר (told) or סְפָר (a frontier area); the sentence decides."],
        ["במשפט ״הספר גזז לי את השיער״, איך קוראים את המילה ״ספר״?", "סַפָּר – מי שגוזר שיער", ["סֵפֶר – דפים כרוכים לקריאה", "סִפֵּר – אמר סיפור", "סְפָר – אזור גבול"], "רק בעל מקצוע שגוזר שיער מתאים למשפט, ולכן קוראים כאן סַפָּר. את אותן אותיות אפשר לקרוא גם סֵפֶר, סִפֵּר או סְפָר (אזור גבול), וההקשר מכריע."]],
      [["What is the precise word for a large group of bees flying together?", "נחיל", ["להקה", "עדר", "צוות"], "A group of bees is a נחיל. להקה is used for birds or wolves, עדר for sheep or cattle, and צוות for people working together."],
        ["מהי המילה המדויקת לקבוצה גדולה של דבורים שעפות יחד?", "נחיל", ["להקה", "עדר", "צוות"], "קבוצה של דבורים היא ״נחיל״. ״להקה״ נאמרת על ציפורים או זאבים, ״עדר״ על כבשים או בקר, ו״צוות״ על אנשים שעובדים יחד."]],
      [["Which pair are synonyms?", "אמיץ – נועז", ["אמיץ – פחדן", "אמיץ – זריז", "אמיץ – שקט"], "אמיץ (brave) and נועז (daring) mean nearly the same. פחדן (a coward) is the opposite, and זריז (quick) and שקט (quiet) describe other qualities."],
        ["איזה זוג הוא זוג מילים נרדפות?", "אמיץ – נועז", ["אמיץ – פחדן", "אמיץ – זריז", "אמיץ – שקט"], "״אמיץ״ ו״נועז״ קרובות מאוד במשמעותן. ״פחדן״ הוא ההפך, ו״זריז״ ו״שקט״ מתארים תכונות אחרות."]],
    ],
    s: [[["Put the words in order from the coldest to the hottest", "קפוא", "קר", "פושר", "חם", "רותח"], ["סדרו את המילים מהקר ביותר לחם ביותר", "קפוא", "קר", "פושר", "חם", "רותח"]]],
  },
  a: {
    t: [
      ["Complementary opposites", "a pair with nothing in between: whatever is not one is the other, like זוגי and אי־זוגי", "הפכים משלימים", "זוג מילים שאין ביניהן אמצע: מה שאינו האחד הוא בהכרח השני, כמו ״זוגי״ ו״אי־זוגי״"],
      ["Connotation", "the feeling or judgement a word carries beyond its plain meaning, as in רזה (slim) versus כחוש (skinny)", "משמעות נלווית", "התחושה או ההערכה שמילה נושאת מעבר למשמעות הפשוטה שלה, כמו ההבדל בין ״רזה״ ל״כחוש״"],
      ["Register", "the level of language a word belongs to, like the spoken אחלה and the formal מצוין", "משלב", "רמת הלשון שמילה שייכת אליה, כמו ״אחלה״ שבדיבור ו״מצוין״ שבלשון הרשמית"],
      ["Context", "the words and situation around a word, which decide which of its meanings is meant", "הקשר", "המילים והמצב שסביב מילה, שקובעים לאיזו מבין משמעויותיה הכוונה"],
    ],
    q: [
      [["Which word praises someone who asks a lot of questions, rather than criticising them?", "סקרן", ["חטטן", "טרדן", "פטפטן"], "סקרן (curious) is a positive or neutral word for someone who wants to know. חטטן (nosy) says something similar with criticism, טרדן is a pest and פטפטן talks too much."],
        ["איזו מילה משבחת אדם ששואל הרבה שאלות, ולא מבקרת אותו?", "סקרן", ["חטטן", "טרדן", "פטפטן"], "״סקרן״ מתארת באופן חיובי או ניטרלי מי שרוצה לדעת. ״חטטן״ אומרת דבר דומה בביקורת, ״טרדן״ הוא מי שמטריד, ו״פטפטן״ מדבר יותר מדי."]],
      [["Which pair of opposites has NO middle ground between its two words?", "נוכח – נעדר", ["חם – קר", "גבוה – נמוך", "מהיר – איטי"], "A pupil is either present (נוכח) or absent (נעדר): there is no step in between. Hot and cold, tall and short, fast and slow all have degrees, like פושר between חם and קר."],
        ["לאיזה זוג הפכים אין אמצע בין שתי המילים?", "נוכח – נעדר", ["חם – קר", "גבוה – נמוך", "מהיר – איטי"], "תלמיד הוא נוכח או נעדר, ואין דרגה ביניהם. ״חם״ ו״קר״, ״גבוה״ ו״נמוך״, ״מהיר״ ו״איטי״ הם הפכים מדורגים, כמו ״פושר״ שבין ״חם״ ל״קר״."]],
      [["In אחי הגדול לומד באוניברסיטה, the word הגדול is about age. Which word can replace it?", "המבוגר", ["הגבוה", "המגודל", "הענק"], "Here גדול is about age, not size, so only המבוגר (the older) keeps the meaning. הגבוה (tall), המגודל (overgrown) and הענק (huge) are synonyms of גדול only when it describes size."],
        ["במשפט ״אחי הגדול לומד באוניברסיטה״ המילה ״הגדול״ מתארת גיל. איזו מילה יכולה לבוא במקומה?", "המבוגר", ["הגבוה", "המגודל", "הענק"], "כאן ״גדול״ מתאר גיל ולא גודל, ולכן רק ״המבוגר״ שומרת על המשמעות. ״הגבוה״, ״המגודל״ ו״הענק״ נרדפות ל״גדול״ רק כשמדובר בגודל."]],
      [["Which word fits all three: ___ השנה, ___ העיר and כאב ___?", "ראש", ["לב", "סוף", "יום"], "ראש means a beginning (ראש השנה, the new year), a leader (ראש העיר, the mayor) and the head (כאב ראש, a headache). Each other word fails at least one: there is no כאב סוף, כאב יום or לב השנה."],
        ["איזו מילה משלימה את שלושת הצירופים: ___ השנה, ___ העיר, כאב ___?", "ראש", ["לב", "סוף", "יום"], "״ראש״ פירושו התחלה (ראש השנה), מנהיג (ראש העיר) וגם איבר בגוף (כאב ראש). כל מילה אחרת נכשלת לפחות בצירוף אחד: אין ״כאב סוף״, ״כאב יום״ או ״לב השנה״."]],
      [["Which word can mean both a group of birds flying together and a group of musicians?", "להקה", ["נחיל", "תזמורת", "עדר"], "להקה is used for a flock of birds, a pack of wolves and a band of musicians or dancers. תזמורת is only an orchestra, נחיל is a swarm of bees and עדר is a herd."],
        ["איזו מילה יכולה לציין גם קבוצת ציפורים שעפות יחד וגם קבוצת נגנים?", "להקה", ["נחיל", "תזמורת", "עדר"], "״להקה״ נאמרת על ציפורים, על זאבים וגם על קבוצה של נגנים או רקדנים. ״תזמורת״ היא רק קבוצת נגנים, ״נחיל״ הוא של דבורים, ו״עדר״ של כבשים או בקר."]],
      [["Which word for a car is colloquial: spoken and informal, not used in formal writing?", "אוטו", ["מכונית", "רכב", "כלי רכב"], "אוטו is the everyday, spoken word for a car. מכונית is the standard word, and רכב and כלי רכב belong to official language, as on signs and forms."],
        ["איזו מילה שמציינת מכונית היא מילה מדוברת ובלתי רשמית, שלא כותבים בטקסט רשמי?", "אוטו", ["מכונית", "רכב", "כלי רכב"], "״אוטו״ היא המילה המדוברת והיומיומית. ״מכונית״ היא המילה התקנית, ו״רכב״ ו״כלי רכב״ שייכים ללשון רשמית, כמו בשלטים ובטפסים."]],
    ],
  },
};
export default c;
