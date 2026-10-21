import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Prefix", "letters added to the start of a word that change its meaning", "תחילית", "אותיות שמוסיפים בתחילת מילה והן משנות את משמעותה"],
      ["Suffix", "letters added to the end of a word that change its meaning or its job in a sentence", "סיומת", "אותיות שמוסיפים בסוף מילה והן משנות את משמעותה או את תפקידה במשפט"],
      ["Root word", "the main part of a word that carries its basic meaning, like “play” in “replay”", "מילת בסיס", "החלק העיקרי במילה שנושא את משמעותה הבסיסית, כמו play במילה replay"],
      ["Compound word", "a word made by joining two whole words, like “sunflower”", "מילה מורכבת", "מילה שנוצרת מחיבור של שתי מילים שלמות, כמו sunflower"],
    ],
    q: [
      [["What does the prefix “re-” mean?", "again", ["not", "before", "without"], "Re- means “again”: replay is to play again, and rewrite is to write again."],
        ["מה פירוש התחילית re במילים באנגלית?", "שוב", ["לא", "לפני", "בלי"], "re פירושה ״שוב״: replay זה לשחק שוב, ו־rewrite זה לכתוב מחדש."]],
      [["What does the suffix “-less” mean, as in “helpless”?", "without", ["full of", "again", "more"], "-less means “without”: helpless means without help, and homeless means without a home."],
        ["מה פירוש הסיומת less במילה כמו helpless?", "בלי", ["מלא", "שוב", "יותר"], "less פירושה ״בלי״: helpless פירושה בלי עזרה, ו־homeless פירושה בלי בית."]],
      [["Which of these is a compound word?", "football", ["teacher", "replay", "happiness"], "Football is foot + ball, two whole words joined together. The others are a root word with a prefix or a suffix: teach + er, re + play, happy + ness."],
        ["איזו מהמילים האלה היא מילה מורכבת?", "football", ["teacher", "replay", "happiness"], "football היא foot + ball, שתי מילים שלמות שחוברו יחד. האחרות הן מילת בסיס עם תחילית או סיומת: teach + er, re + play, happy + ness."]],
      [["What does the prefix “pre-” mean, as in “preview”?", "before", ["again", "after", "without"],"Pre- means “before”: a preview is a look at something before it opens, and to preheat an oven is to heat it before cooking. Again is the meaning of re-."],
        ["מה פירוש התחילית pre, כמו במילה preview?", "לפני", ["שוב", "אחרי", "בלי"],"pre פירושה ״לפני״: preview הוא הצצה במשהו לפני שהוא נפתח, ו־preheat פירושו לחמם תנור לפני הבישול. ״שוב״ הוא הפירוש של re."]],
    ],
  },
  i: {
    t: [
      ["Word family", "a group of words that share the same root, like play, player, playful and replay", "משפחת מילים", "קבוצת מילים שיש להן אותו בסיס, כמו play, player, playful ו־replay"],
      ["Negative prefix", "a prefix that means “not” or turns a word into its opposite, like un-, dis- or im-", "תחילית שלילה", "תחילית שפירושה ״לא״ או שהופכת מילה להפך שלה, כמו un, dis או im"],
      ["Noun suffix", "an ending such as -ment or -ion that turns another word into a naming word, like enjoyment", "סיומת של שם עצם", "סיומת כמו ment או ion שהופכת מילה אחרת לשם של דבר, כמו enjoyment"],
      ["Adverb", "a word that tells how something is done, often made by adding -ly, like quickly", "תואר הפועל", "מילה שמתארת איך פעולה נעשית, ובאנגלית נוצרת לעיתים קרובות בעזרת ly, כמו quickly"],
    ],
    q: [
      [["Which prefix makes the opposite of “happy”?", "un-", ["dis-", "re-", "pre-"], "Unhappy means “not happy”. Dis- also means “not”, but it goes with other words, such as dislike and disagree."],
        ["איזו תחילית הופכת את happy להפך שלה?", "un-", ["dis-", "re-", "pre-"], "unhappy פירושה ״לא שמח״. גם dis פירושה ״לא״, אבל היא באה עם מילים אחרות, כמו dislike ו־disagree."]],
      [["Which word means “not possible”?", "impossible", ["unpossible", "dispossible", "possibleless"], "Before p, b or m, the negative prefix in- usually becomes im-: impossible, impolite, impatient."],
        ["איזו מילה פירושה ״לא אפשרי״?", "impossible", ["unpossible", "dispossible", "possibleless"], "לפני p, b או m התחילית השוללת in הופכת בדרך כלל ל־im: impossible, impolite, impatient."]],
      [["Someone who teaches is a teacher. What do we call someone who acts in plays and films?", "an actor", ["an acter", "an actist", "an actful"], "Both -er and -or can mean “a person who does something”. Some words take -or: actor, visitor, sailor."],
        ["מי שמלמד הוא teacher. איך קוראים למי שמשחק בהצגות ובסרטים?", "an actor", ["an acter", "an actist", "an actful"], "גם er וגם or יכולות לציין ״מי שעושה משהו״. יש מילים שמקבלות or: actor, visitor, sailor."]],
      [["What does “careful” mean?", "paying close attention, full of care", ["without any care", "caring again", "caring before"], "The suffix -ful means “full of”: careful, helpful, joyful. Its opposite is often -less: careless."],
        ["מה פירוש המילה careful?", "זהיר, מלא תשומת לב", ["בלי שום אכפתיות", "אכפתי שוב", "אכפתי מראש"], "הסיומת ful פירושה ״מלא ב־״: careful, helpful, joyful. ההפך שלה הוא לעיתים קרובות less: careless."]],
      [["Which suffix turns the adjective “kind” into a noun?", "-ness, as in kindness", ["-ly, as in kindly", "-er, as in kinder", "-ful, as in kindful"], "Kindness names the quality of being kind. Kindly describes how something is done, kinder compares, and “kindful” is not used in English today."],
        ["איזו סיומת הופכת את שם התואר kind לשם עצם?", "ness, כמו ב־kindness", ["ly, כמו ב־kindly", "er, כמו ב־kinder", "ful, כמו ב־kindful"], "kindness היא השם של התכונה ״טוב לב״. kindly מתארת איך משהו נעשה, kinder משווה, ו־kindful אינה בשימוש באנגלית של היום."]],
      [["How do you spell happy + -ness?", "happiness", ["happyness", "hapiness", "happines"], "When a word ends in a consonant and y, the y usually changes to i before a suffix: happy → happiness, busy → business."],
        ["איך כותבים happy + ness?", "happiness", ["happyness", "hapiness", "happines"], "כשמילה מסתיימת בעיצור ואחריו y, בדרך כלל ה־y הופכת ל־i לפני סיומת: happy → happiness, busy → business."]],
    ],
    s: [[["Building a longer word step by step, in order", "Start with the root word “respect”", "Add the suffix -ful to make “respectful”", "Add the prefix dis- to make “disrespectful”", "Add the suffix -ly to make “disrespectfully”"],
      ["בונים מילה ארוכה צעד אחר צעד, לפי הסדר", "מתחילים במילת הבסיס respect", "מוסיפים את הסיומת ful ומקבלים respectful", "מוסיפים את התחילית dis ומקבלים disrespectful", "מוסיפים את הסיומת ly ומקבלים disrespectfully"]]],
  },
  a: {
    t: [
      ["Morpheme", "the smallest part of a word that has a meaning, like un, help and ful in unhelpful", "צורן", "החלק הקטן ביותר במילה שיש לו משמעות, כמו un, help ו־ful במילה unhelpful"],
      ["Latin root", "a word part from Latin found in many English words, like “port” (carry) in transport", "שורש לטיני", "חלק מילה שמקורו בלטינית ונמצא במילים רבות באנגלית, כמו port (לשאת) במילה transport"],
      ["Greek root", "a word part from Greek found in many English words, like “graph” (write) in autograph", "שורש יווני", "חלק מילה שמקורו ביוונית ונמצא במילים רבות באנגלית, כמו graph (לכתוב) במילה autograph"],
      ["Context clue", "a hint in the nearby words or sentences that helps you work out an unknown word", "רמז מההקשר", "רמז במילים או במשפטים שמסביב, שעוזר להבין מילה לא מוכרת"],
    ],
    q: [
      [["“Port” comes from a Latin word meaning “carry”. What does “portable” mean?", "easy to carry", ["belonging to a harbour", "far away", "full of doors"], "Port (carry) + -able (can be) = can be carried. The same root is in transport and export."],
        ["port מגיעה ממילה לטינית שפירושה ״לשאת״. מה פירוש portable?", "קל לנשיאה", ["שייך לנמל", "רחוק", "מלא דלתות"], "port (לשאת) + able (אפשר) = אפשר לשאת אותו. אותו שורש נמצא ב־transport וב־export."]],
      [["“Tele” means “far” and “scope” means “look”. Which word names a tool for looking at faraway things?", "telescope", ["microscope", "telephone", "periscope"], "Tele + scope = look far. A microscope looks at tiny things, and a telephone carries sound (phone) far."],
        ["tele פירושה ״רחוק״ ו־scope פירושה ״להסתכל״. איזו מילה היא שם של כלי להסתכלות על דברים רחוקים?", "telescope", ["microscope", "telephone", "periscope"], "tele + scope = להסתכל למרחוק. microscope מסתכל על דברים זעירים, ו־telephone מעביר קול (phone) למרחוק."]],
      [["“Bio” means “life” and “-logy” means “the study of”. What is biology?", "the study of living things", ["the study of rocks", "the study of the stars", "the study of old buildings"], "Bio + logy = the study of life. The same parts appear in biography (a life written) and geology (the study of the earth)."],
        ["bio פירושה ״חיים״ ו־logy פירושה ״חקר של״. מהי biology?", "חקר היצורים החיים", ["חקר הסלעים", "חקר הכוכבים", "חקר הבניינים העתיקים"], "bio + logy = חקר החיים. אותם חלקים מופיעים ב־biography (סיפור חיים כתוב) וב־geology (חקר כדור הארץ)."]],
      [["In “unlock” and “untie”, the prefix un- does not mean “not”. What does it mean there?", "to reverse an action", ["to do it again", "to do it before", "to do it badly"], "Un- before a verb often means undoing: unlock, untie, unzip, unpack. Before an adjective it usually means “not”: unhappy, unkind."],
        ["במילים unlock ו־untie התחילית un לא פירושה ״לא״. מה פירושה שם?", "לבטל פעולה, לעשות אותה הפוך", ["לעשות אותה שוב", "לעשות אותה מראש", "לעשות אותה גרוע"], "un לפני פועל מציינת לעיתים קרובות ביטול: unlock, untie, unzip, unpack. לפני שם תואר היא בדרך כלל פירושה ״לא״: unhappy, unkind."]],
      [["Which word does NOT begin with the prefix re- meaning “again”?", "ready", ["rewrite", "rebuild", "reread"], "Ready is a whole word: take away “re” and “ady” means nothing. A real prefix leaves a root word you can recognise."],
        ["איזו מילה אינה מתחילה בתחילית re שפירושה ״שוב״?", "ready", ["rewrite", "rebuild", "reread"], "ready היא מילה שלמה: אם מורידים ממנה re, נשאר ady שאין לו משמעות. תחילית אמיתית משאירה מילת בסיס שאפשר לזהות."]],
      [["In “The arid land had not seen rain for many months”, what does “arid” most likely mean?", "very dry", ["very cold", "very green", "very noisy"], "The clue is in the sentence: land with no rain for months is very dry. Context clues help you guess a word before you look it up."],
        ["במשפט ״The arid land had not seen rain for many months״, מה כנראה פירוש המילה arid?", "יבש מאוד", ["קר מאוד", "ירוק מאוד", "רועש מאוד"], "הרמז נמצא במשפט: אדמה שלא ראתה גשם חודשים היא יבשה מאוד. רמזים מההקשר עוזרים לנחש מילה לפני שבודקים במילון."]],
    ],
    n: [[3, ["How many morphemes (parts with a meaning) are in the word “unbelievable”?", "", "un (not) + believe + able (can be): the word has 3 morphemes, so unbelievable means “cannot be believed”."],
      ["כמה צורנים (חלקים בעלי משמעות) יש במילה unbelievable?", "", "un (לא) + believe (להאמין) + able (אפשר): יש במילה 3 צורנים, ולכן unbelievable פירושה ״אי אפשר להאמין לו״."]]],
    s: [[["Working out an unknown long word, in order", "Look for a prefix at the start", "Look for a suffix at the end", "Find the root word that is left in the middle", "Put the meanings of the parts together", "Check that this meaning fits the sentence"],
      ["פענוח מילה ארוכה ולא מוכרת, לפי הסדר", "מחפשים תחילית בהתחלה", "מחפשים סיומת בסוף", "מוצאים את מילת הבסיס שנשארה באמצע", "מחברים את המשמעויות של החלקים", "בודקים שהמשמעות מתאימה למשפט"]]],
  },
};
export default c;
