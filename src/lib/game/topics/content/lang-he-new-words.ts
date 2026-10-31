import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Blend (helchem)", "a new word made by fusing parts of two words, like מדרחוב from מדרכה and רחוב", "הלחם", "מילה חדשה שנוצרת מחיבור של חלקים משתי מילים, כמו ״מדרחוב״ מ״מדרכה״ ו״רחוב״"],
      ["Loanword", "a word taken from another language, like פיצה or רדיו", "מילה שאולה", "מילה שנלקחה משפה אחרת, כמו ״פיצה״ או ״רדיו״"],
      ["New coinage (chidush)", "a word invented to name something new, such as מחשב for a computer", "חידוש", "מילה שהומצאה כדי לתת שם לדבר חדש, כמו ״מחשב״"],
      ["Old word, new meaning", "an ancient word given a modern sense, like רשת, a net, which now also means a network", "מילה ישנה במשמעות חדשה", "מילה עתיקה שקיבלה מובן מודרני, כמו ״רשת״, שפירושה היום גם חיבור בין מחשבים"],
    ],
    q: [
      [["Which two words were blended to make רמזור (a traffic light)?", "רמז + אור", ["רם + זוהר", "רמה + זרם", "רמות + זר"], "A traffic light gives a hint, רמז, by means of light, אור. The two words were blended into רמזור, and the א of אור was dropped."],
        ["מאילו שתי מילים נוצרה המילה ״רמזור״?", "רמז + אור", ["רם + זוהר", "רמה + זרם", "רמות + זר"], "הרמזור נותן רמז בעזרת אור. שתי המילים הולחמו ל״רמזור״, וה־א של ״אור״ נשמטה."]],
      [["Which of these words is a loanword from another language?", "טלפון", ["מחשב", "שולחן", "ספר"], "טלפון came into Hebrew from European languages, which built it from Greek parts meaning far and sound. מחשב is a Hebrew coinage, and שולחן and ספר are ancient Hebrew words."],
        ["איזו מהמילים האלה היא מילה שאולה משפה אחרת?", "טלפון", ["מחשב", "שולחן", "ספר"], "״טלפון״ הגיעה לעברית משפות אירופה, שבנו אותה ממילים יווניות שפירושן ״רחוק״ ו״קול״. ״מחשב״ היא חידוש עברי, ו״שולחן״ ו״ספר״ הן מילים עבריות עתיקות."]],
      [["What is the Academy of the Hebrew Language?", "The official body that sets rules for Hebrew and suggests new words", ["A school in Jerusalem where children learn to read and write Hebrew", "A museum that keeps the oldest Hebrew books and scrolls in Israel", "A newspaper that prints the news in easy Hebrew for new immigrants"], "The Academy, in Jerusalem, decides on grammar and spelling and proposes Hebrew words for new things, for example in computing and sport. It was set up by a law of the Knesset."],
        ["מהי האקדמיה ללשון העברית?", "הגוף הרשמי שקובע כללים לעברית ומציע מילים חדשות", ["בית ספר בירושלים שבו ילדים לומדים לקרוא ולכתוב עברית", "מוזיאון ששומר את הספרים והמגילות העבריים העתיקים ביותר", "עיתון שמדפיס חדשות בעברית קלה לעולים חדשים"], "האקדמיה, שבירושלים, מחליטה על כללי דקדוק וכתיב ומציעה מילים עבריות לדברים חדשים, למשל בתחומי המחשב והספורט. היא הוקמה בחוק של הכנסת."]],
      [["What does מגדלור, a blend of מגדל (tower) and אור (light), mean?", "A tower that shines a light for ships", ["A tall lamp post at the side of a road", "A watchtower where guards look out", "The sunrise seen over the sea"], "A מגדלור is a lighthouse: a tower with a strong light that guides ships at night. Its two parts say just that: a tower of light."],
        ["מה פירוש ״מגדלור״, הלחם של ״מגדל״ ו״אור״?", "מבנה שמאיר לספינות בלילה", ["עמוד תאורה גבוה בצד הכביש", "מגדל שבו שומרים צופים למרחוק", "זריחת השמש מעל הים"], "מגדלור הוא מגדל עם אור חזק שמכוון ספינות בלילה. שני חלקי המילה אומרים בדיוק את זה: מגדל של אור."]],
      [["Which word from the world of computers is an old Hebrew word with a new meaning?", "עכבר", ["מקלדת", "מחשב", "טאבלט"], "עכבר is the ancient word for a mouse, and today it also names the device you move to point on the screen. מקלדת and מחשב are new coinages, and טאבלט is a loanword."],
        ["איזו מילה מעולם המחשב היא מילה עברית ישנה שקיבלה משמעות חדשה?", "עכבר", ["מקלדת", "מחשב", "טאבלט"], "״עכבר״ היא המילה העתיקה לבעל החיים, והיום היא גם שם המכשיר שמזיזים כדי להצביע על המסך. ״מקלדת״ ו״מחשב״ הם חידושים, ו״טאבלט״ היא מילה שאולה."]],
      [["Which of these words is a blend of two words?", "מחזמר", ["מחזה", "זמר", "מזמרה"], "מחזמר (a musical) blends מחזה (a play) and זמר (singing). The others are each a single word: מחזה is a play, זמר is singing, and מזמרה is pruning shears."],
        ["איזו מהמילים האלה היא הלחם של שתי מילים?", "מחזמר", ["מחזה", "זמר", "מזמרה"], "״מחזמר״ מלחים את ״מחזה״ ואת ״זמר״. האחרות הן מילה אחת כל אחת: ״מחזה״ הוא הצגה, ״זמר״ הוא שירה, ו״מזמרה״ היא כלי גיזום."]],
    ],
  },
  i: {
    t: [
      ["Pattern (mishkal)", "a fixed template of vowels and added letters into which a root is put to make a word", "משקל", "תבנית קבועה של תנועות ואותיות נוספות, שמכניסים לתוכה שורש כדי ליצור מילה"],
      ["Suffix", "an ending added to a word to make a new one, like ־ון in מילון or ־אי in חשמלאי", "סיומת", "תוספת בסוף מילה שיוצרת ממנה מילה חדשה, כמו ־ון ב״מילון״ או ־אי ב״חשמלאי״"],
      ["Va'ad HaLashon", "the Hebrew Language Committee, founded in 1890 to create Hebrew words, which later became the Academy", "ועד הלשון", "הגוף שנוסד ב־1890 כדי לחדש מילים בעברית, ושהפך לימים לאקדמיה ללשון העברית"],
    ],
    q: [
      [["שפעת (flu), אדמת (rubella) and צהבת (jaundice) are built in the same pattern. What does this pattern usually name?", "An illness", ["A workplace", "A tool", "A job"], "The pattern of שפעת, אדמת, צהבת and דלקת (inflammation) is used for illnesses, so a name for a new disease can be made by putting a root into it."],
        ["״שפעת״, ״אדמת״ ו״צהבת״ בנויות באותו משקל. מה מציין המשקל הזה בדרך כלל?", "מחלה", ["מקום עבודה", "כלי", "מקצוע"], "המשקל של שפעת, אדמת, צהבת ודלקת משמש לשמות של מחלות, ולכן אפשר ליצור שם למחלה חדשה כשמכניסים לתוכו שורש."]],
      [["Which word for a place is built like מספרה (a barbershop) and מכבסה (a laundry)?", "מסעדה", ["מספריים", "מכונה", "מסירה"], "מסעדה (a restaurant) has the same pattern as מספרה and מכבסה, one often used for places where a certain kind of work is done. מספריים are scissors, מכונה is a machine and מסירה is a handing over."],
        ["איזו מילה שמציינת מקום בנויה כמו ״מספרה״ ו״מכבסה״?", "מסעדה", ["מספריים", "מכונה", "מסירה"], "״מסעדה״ בנויה באותו משקל כמו ״מספרה״ ו״מכבסה״, משקל שמשמש פעמים רבות למקומות שעושים בהם עבודה מסוימת. ״מספריים״ הם כלי גזירה, ״מכונה״ היא מכשיר, ו״מסירה״ היא נתינה."]],
      [["Which of these words, all from the same root, names a job, like נגר (a carpenter) and צייר (a painter)?", "טייס", ["טיסה", "מטוס", "מטס"], "Jobs are often in the pattern of נַגָּר, צַיָּר and טַבָּח, and טַיָּס (a pilot) follows it. The same root also gives טיסה (a flight), מטוס (a plane) and מטס (a flypast)."],
        ["איזו מהמילים האלה, כולן מאותו שורש, היא שם של מקצוע, כמו ״נגר״ ו״צייר״?", "טייס", ["טיסה", "מטוס", "מטס"], "שמות מקצועות באים פעמים רבות במשקל של נַגָּר, צַיָּר וטַבָּח, וגם טַיָּס בנוי כך. מאותו שורש באות גם ״טיסה״, ״מטוס״ ו״מטס״."]],
      [["Which word was made by adding the suffix ־ון to the word עת (time)?", "עיתון", ["עיתוי", "עתיד", "עתיק"], "עיתון (a newspaper) comes out at fixed times: it was built from עת and the suffix ־ון. עיתוי (timing) also comes from עת but in another way, and עתיד and עתיק come from different roots."],
        ["איזו מילה נוצרה מהמילה ״עת״ ומהסיומת ־ון?", "עיתון", ["עיתוי", "עתיד", "עתיק"], "״עיתון״ יוצא לאור בזמנים קבועים: הוא נוצר מ״עת״ ומהסיומת ־ון. גם ״עיתוי״ בא מ״עת״ אבל בדרך אחרת, ו״עתיד״ ו״עתיק״ באים משורשים אחרים."]],
      [["Which modern word took its meaning from an ancient word that appears in the book of Ezekiel?", "חשמל", ["טלפון", "מחשב", "רמזור"], "In Ezekiel, חשמל names something that glows in a vision. Modern Hebrew gave this old word a new job: electricity. טלפון is a loanword, מחשב a coinage and רמזור a blend."],
        ["איזו מילה מודרנית קיבלה את משמעותה ממילה עתיקה שמופיעה בספר יחזקאל?", "חשמל", ["טלפון", "מחשב", "רמזור"], "ביחזקאל ״חשמל״ הוא דבר זוהר שנראה במראה הנבואי. העברית החדשה נתנה למילה הישנה תפקיד חדש: אנרגיה חשמלית. ״טלפון״ היא מילה שאולה, ״מחשב״ חידוש ו״רמזור״ הלחם."]],
      [["Which everyday Hebrew word was borrowed from Arabic?", "יאללה", ["קדימה", "מגניב", "בסדר"], "יאללה (come on, let's go) comes from Arabic. קדימה means much the same but is a Hebrew word, and מגניב and בסדר are Hebrew too."],
        ["איזו מילה יומיומית בעברית נשאלה מערבית?", "יאללה", ["קדימה", "מגניב", "בסדר"], "״יאללה״ (קדימה, בואו נזוז) באה מערבית. ״קדימה״ פירושה דומה, אבל היא מילה עברית, וגם ״מגניב״ ו״בסדר״ הן עבריות."]],
    ],
    n: [[1953, ["In which year did the Knesset pass the law that founded the Academy of the Hebrew Language?", "", "The law was passed in 1953. The Academy took over the work of the Hebrew Language Committee, which had been creating words since 1890."], ["באיזו שנה חוקקה הכנסת את החוק שהקים את האקדמיה ללשון העברית?", "", "החוק נחקק ב־1953. האקדמיה המשיכה את עבודתו של ועד הלשון, שחידש מילים מאז 1890."]]],
  },
  a: {
    t: [
      ["Calque (loan translation)", "a phrase translated word for word from another language, like גורד שחקים from skyscraper", "תרגום שאילה", "צירוף שתורגם מילה במילה משפה אחרת, כמו ״גורד שחקים״ מהמילה האנגלית skyscraper"],
      ["Root from a loanword", "a new root taken from a borrowed word in order to make verbs, like the letters of טלפון in טלפן", "שורש ממילה שאולה", "שורש חדש שנלקח ממילה שאולה כדי ליצור ממנו פעלים, כמו האותיות של ״טלפון״ בפועל ״טלפן״"],
      ["Compounding", "making one word out of two whole words, as in כדורגל from כדור and רגל", "הרכב", "יצירת מילה אחת משתי מילים שלמות, כמו ״כדורגל״ מ״כדור״ ו״רגל״"],
    ],
    q: [
      [["Which of these is made of two WHOLE words joined, rather than a blend of parts of words?", "כדורסל", ["רמזור", "מחזמר", "מדרחוב"], "כדורסל keeps all of כדור and all of סל. רמזור drops the א of אור, מחזמר drops the ה of מחזה, and מדרחוב keeps only part of מדרכה, so they are blends."],
        ["איזו מהמילים בנויה משתי מילים שלמות, ולא מהלחם של חלקי מילים?", "כדורסל", ["רמזור", "מחזמר", "מדרחוב"], "״כדורסל״ שומרת על כל ״כדור״ ועל כל ״סל״. ב״רמזור״ נשמטה ה־א של ״אור״, ב״מחזמר״ נשמטה ה־ה של ״מחזה״, וב״מדרחוב״ נשאר רק חלק מ״מדרכה״, ולכן הן הלחמים."]],
      [["Which phrase was formed by translating a foreign expression part by part (a calque)?", "ירח דבש", ["בית כנסת", "בית ספר", "ראש השנה"], "ירח דבש matches the English honeymoon part by part: ירח is moon and דבש is honey. בית כנסת, בית ספר and ראש השנה are old Hebrew expressions from the time of the sages."],
        ["איזה צירוף נוצר בתרגום חלק אחר חלק של ביטוי לועזי?", "ירח דבש", ["בית כנסת", "בית ספר", "ראש השנה"], "״ירח דבש״ מתאים ל־honeymoon חלק אחר חלק: moon הוא ירח ו־honey הוא דבש. ״בית כנסת״, ״בית ספר״ ו״ראש השנה״ הם צירופים עבריים ותיקים מימי חז״ל."]],
      [["What is the root of the verb סימס (sent a text message)?", "ס־מ־ס", ["ס־י־מ", "מ־ס־ס", "ס־מ־י"], "סימס comes from the English letters SMS: ס־מ־ס were treated as a root and put into the pi'el pattern, like דיבר and סיפר."],
        ["מהו השורש של הפועל ״סימס״ (שלח הודעת טקסט)?", "ס־מ־ס", ["ס־י־מ", "מ־ס־ס", "ס־מ־י"], "״סימס״ בא מראשי התיבות האנגליים SMS: האותיות ס־מ־ס נעשו שורש והוכנסו לבניין פיעל, כמו ״דיבר״ ו״סיפר״."]],
      [["The Academy proposed מרשתת as the Hebrew word for the internet. What happened?", "Most speakers went on saying אינטרנט", ["It completely replaced the word אינטרנט", "It became the word for a fishing net", "A law forbade people to use it"], "Not every proposal catches on. מרשתת (from רשת, a net) is an official word, but most people still say אינטרנט, while many other proposals of the Academy did enter everyday use."],
        ["האקדמיה הציעה את המילה ״מרשתת״ במקום ״אינטרנט״. מה קרה?", "רוב הדוברים המשיכו לומר ״אינטרנט״", ["היא החליפה לגמרי את המילה ״אינטרנט״", "היא נעשתה המילה לרשת דייגים", "חוק אסר על הציבור להשתמש בה"], "לא כל הצעה נקלטת. ״מרשתת״ (מ״רשת״) היא מילה רשמית, אבל רוב האנשים עדיין אומרים ״אינטרנט״, ואילו הצעות רבות אחרות של האקדמיה נקלטו בשפה היומיומית."]],
      [["תקליטור (a CD) is a blend. Which two words make it up?", "תקליט + אור", ["תקליט + טור", "תקל + טור", "קליט + תור"], "A CD is a record, תקליט, that is read by a beam of light, אור. The two words were blended into תקליטור, and the א of אור was dropped, just as in רמזור."],
        ["״תקליטור״ הוא הלחם. מאילו שתי מילים הוא בנוי?", "תקליט + אור", ["תקליט + טור", "תקל + טור", "קליט + תור"], "תקליטור הוא תקליט שקוראים אותו בקרן אור. שתי המילים הולחמו ל״תקליטור״, וה־א של ״אור״ נשמטה, בדיוק כמו ב״רמזור״."]],
      [["Why did Hebrew need so many new words around the year 1900?", "It was becoming a spoken language again and lacked words for modern life", ["Its old words had all been lost, so every word had to be invented from nothing", "A law forbade using words from the Bible, so new ones had to replace them all", "It had only a few hundred words in total, too few to write any book at all"], "Hebrew had a huge store of words from the Bible, the Mishnah and later writing, but as people began to speak it at home and at school they needed words for things like ice cream, cameras and trains."],
        ["למה נזקקה העברית למילים חדשות רבות כל כך בסביבות שנת 1900?", "כי היא חזרה להיות שפת דיבור, וחסרו בה מילים לחיים המודרניים", ["כי כל המילים הישנות שלה אבדו, והיה צריך להמציא כל מילה מחדש", "כי חוק אסר להשתמש במילים מהתנ״ך, והיה צריך להחליף את כולן", "כי היו בה רק כמה מאות מילים, מעט מדי כדי לכתוב ספר כלשהו"], "בעברית היה אוצר מילים עצום מהתנ״ך, מהמשנה ומהספרות המאוחרת, אבל כשהתחילו לדבר בה בבית ובבית הספר נזקקו למילים לדברים כמו גלידה, מצלמה ורכבת."]],
    ],
    s: [[["Put these events in the revival of Hebrew in time order, earliest first", "Eliezer Ben-Yehuda settles in the Land of Israel and works to spread spoken Hebrew", "The Hebrew Language Committee (Va'ad HaLashon) is founded", "Hebrew becomes an official language of British Mandatory Palestine, with English and Arabic", "The Knesset passes the law that founds the Academy of the Hebrew Language"], ["סדרו את האירועים בתחיית העברית לפי סדר הזמן, מהמוקדם למאוחר", "אליעזר בן־יהודה מתיישב בארץ ישראל ופועל להפצת הדיבור העברי", "ועד הלשון העברית נוסד", "העברית נעשית שפה רשמית בארץ ישראל המנדטורית, לצד האנגלית והערבית", "הכנסת מחוקקת את החוק שמקים את האקדמיה ללשון העברית"]]],
  },
};
export default c;
