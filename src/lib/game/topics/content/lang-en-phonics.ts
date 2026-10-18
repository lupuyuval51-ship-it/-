import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Vowel", "one of the letters a, e, i, o and u (y sometimes works as one too)", "אות תנועה", "אחת מהאותיות a, e, i, o ו־u (לפעמים גם y משמשת כך)"],
      ["Consonant", "any letter that is not a vowel, like b, m, s or t", "עיצור", "כל אות שאינה אות תנועה, כמו b, m, s או t"],
      ["Short vowel", "the quick vowel sound in words like cat, bed, sit, hot and cup", "תנועה קצרה", "צליל התנועה הקצר במילים כמו cat, bed, sit, hot ו־cup"],
      ["Long vowel", "a vowel that says its own letter name, like the a in cake or the o in bone", "תנועה ארוכה", "תנועה שנשמעת כמו שם האות שלה, כמו a ב־cake או o ב־bone"],
    ],
    q: [
      [["Which word has a short a sound, like in “cat”?", "map", ["cake", "rain", "play"], "In map the a is short, just like in cat. In cake, rain and play the a is long: it says its name."],
        ["באיזו מילה יש a קצרה, כמו ב־cat?", "map", ["cake", "rain", "play"], "ב־map ה־a קצרה, בדיוק כמו ב־cat. ב־cake, ב־rain וב־play ה־a ארוכה: היא נשמעת כמו שם האות."]],
      [["Which word starts with the same sound as “cheese”?", "chin", ["shin", "kite", "sun"], "Cheese and chin both start with the ch sound. Shin starts with sh, which is a different sound."],
        ["איזו מילה מתחילה באותו צליל כמו cheese?", "chin", ["shin", "kite", "sun"], "cheese ו־chin מתחילות שתיהן בצליל ch. המילה shin מתחילה ב־sh, וזה צליל אחר."]],
      [["Which word rhymes with “cat”?", "hat", ["cot", "cut", "cap"], "Words that rhyme end with the same sound: c-at and h-at both end in -at. Cot and cut change the vowel, and cap changes the last sound."],
        ["איזו מילה מתחרזת עם cat?", "hat", ["cot", "cut", "cap"], "מילים מתחרזות כשהן נגמרות באותו צליל: c-at ו־h-at נגמרות שתיהן ב־at. ב־cot וב־cut התנועה שונה, וב־cap הצליל האחרון שונה."]],
      [["Which word has a long e sound, like in “tree”?", "green", ["bread", "bed", "pet"], "In green, the letters ee make a long e sound, like in tree. In bread, bed and pet the e sound is short."],
        ["באיזו מילה יש e ארוכה, כמו ב־tree?", "green", ["bread", "bed", "pet"], "ב־green האותיות ee יוצרות e ארוכה, כמו ב־tree. ב־bread, ב־bed וב־pet הצליל e קצר."]],
      [["Which letter is a vowel?", "o", ["b", "t", "m"], "The vowel letters are a, e, i, o and u, so o is a vowel. B, t and m are consonants."],
        ["איזו אות היא אות תנועה?", "o", ["b", "t", "m"], "אותיות התנועה הן a, e, i, o ו־u, ולכן o היא אות תנועה. b, t ו־m הן עיצורים."]],
    ],
    n: [
      [26, ["How many letters are in the English alphabet?", "", "The English alphabet has 26 letters, from a to z: 5 vowel letters (a, e, i, o, u) and 21 consonants, though y sometimes works as a vowel."],
        ["כמה אותיות יש באלפבית האנגלי?", "", "באלפבית האנגלי יש 26 אותיות, מ־a ועד z: חמש אותיות תנועה (a, e, i, o, u) ו־21 עיצורים, אף שלפעמים גם y משמשת כתנועה."]],
    ],
    s: [
      [["The sounds of “frog”, in order", "the f sound", "the r sound", "the o sound", "the g sound"],
        ["הצלילים במילה frog, לפי הסדר", "הצליל f", "הצליל r", "הצליל o", "הצליל g"]],
    ],
  },
  i: {
    t: [
      ["Magic e", "a silent e at the end of a word that makes the vowel before it say its name: cap → cape", "ה־e השקטה", "e בסוף מילה שלא הוגים אותה, והיא גורמת לתנועה שלפניה להישמע כמו שם האות: cap → cape"],
      ["Digraph", "two letters that together make one sound, like sh, ch, th or ck", "צמד אותיות", "שתי אותיות שיחד יוצרות צליל אחד, כמו sh, ch, th או ck"],
      ["Blend", "two or three consonants side by side where you still hear each sound, like bl, st or str", "צירוף עיצורים", "שניים או שלושה עיצורים צמודים שעדיין שומעים בהם כל צליל, כמו bl, st או str"],
    ],
    q: [
      [["Add a magic e to “kit”. Which word do you get?", "kite", ["kitt", "kiet", "kites"], "The e at the end is silent, but it makes the i say its name: kit → kite."],
        ["הוסיפו e שקטה בסוף kit. איזו מילה מתקבלת?", "kite", ["kitt", "kiet", "kites"], "את ה־e בסוף לא שומעים, אבל היא גורמת ל־i להישמע כמו שם האות: kit → kite."]],
      [["Which word has a magic e?", "bike", ["bend", "bet", "web"], "In bike the e at the end is silent and makes the i long. In bend, bet and web there is no e at the end; the e there is a short sound."],
        ["באיזו מילה יש e שקטה בסוף?", "bike", ["bend", "bet", "web"], "ב־bike ה־e בסוף שקטה והופכת את ה־i לארוכה. ב־bend, ב־bet וב־web אין e בסוף; ה־e שם היא צליל קצר."]],
      [["Which letters make the f sound in “phone”?", "ph", ["p", "h", "ne"], "The letters p and h together make one sound, f, as in phone and photo."],
        ["אילו אותיות יוצרות את הצליל f במילה phone?", "ph", ["p", "h", "ne"], "האותיות p ו־h יחד יוצרות צליל אחד, f, כמו ב־phone וב־photo."]],
      [["Which letters often end a short word after a short vowel, as in “duck” and “sock”?", "ck", ["kk", "cc", "kc"], "After a short vowel at the end of a short word, the k sound is usually spelled ck: duck, sock, back."],
        ["אילו אותיות מסיימות לעיתים קרובות מילה קצרה אחרי תנועה קצרה, כמו ב־duck וב־sock?", "ck", ["kk", "cc", "kc"], "אחרי תנועה קצרה בסוף מילה קצרה, הצליל k נכתב בדרך כלל ck: duck, sock, back."]],
      [["Which word has a long a sound spelled “ai”?", "rain", ["said", "ran", "rat"], "In rain, ai makes a long a sound. Said also has ai, but it sounds like a short e (sed), so it doesn't fit."],
        ["באיזו מילה יש a ארוכה שנכתבת ai?", "rain", ["said", "ran", "rat"], "ב־rain האותיות ai יוצרות a ארוכה. גם ב־said יש ai, אבל שם הן נשמעות כמו e קצרה (sed), ולכן היא לא מתאימה."]],
      [["Which word begins with a blend?", "stop", ["shop", "chop", "top"], "In stop you can hear both s and t, so st is a blend. In shop and chop the two letters make one new sound."],
        ["איזו מילה מתחילה בצירוף עיצורים?", "stop", ["shop", "chop", "top"], "ב־stop שומעים גם את s וגם את t, ולכן st הוא צירוף עיצורים. ב־shop וב־chop שתי האותיות יוצרות צליל חדש אחד."]],
    ],
    n: [
      [3, ["How many sounds do you hear in “ship”?", "", "There are 3 sounds: sh, i and p. The two letters sh make one sound."],
        ["כמה צלילים שומעים במילה ship?", "", "שומעים 3 צלילים: sh, i ו־p. שתי האותיות sh יוצרות צליל אחד."]],
      [5, ["How many sounds do you hear in “stamp”?", "", "There are 5 sounds: s, t, a, m and p. In a blend you still hear every letter."],
        ["כמה צלילים שומעים במילה stamp?", "", "שומעים 5 צלילים: s, t, a, m ו־p. בצירוף עיצורים שומעים כל אות."]],
    ],
  },
  a: {
    t: [
      ["Silent letter", "a letter that is written but not heard, like the k in knee", "אות שלא הוגים", "אות שכותבים אבל לא שומעים, כמו k ב־knee"],
      ["Soft c", "a c that sounds like s, which often happens before e, i or y: city, face", "c רכה", "c שנשמעת כמו s, מה שקורה לרוב לפני e, i או y: city, face"],
      ["y as a vowel", "at the end of a word, y can sound like a long i (my) or a long e (happy)", "y כתנועה", "בסוף מילה y יכולה להישמע כמו i ארוכה (my) או כמו e ארוכה (happy)"],
    ],
    q: [
      [["Which letter is silent at the start of “write”?", "w", ["r", "i", "t"], "In write we don't say the w, so it sounds just like right. Other words with a silent w are wrong and wrist."],
        ["איזו אות לא נשמעת בתחילת write?", "w", ["r", "i", "t"], "ב־write לא הוגים את ה־w, ולכן המילה נשמעת בדיוק כמו right. מילים נוספות עם w שקטה הן wrong ו־wrist."]],
      [["Which word has a silent b?", "lamb", ["lamp", "bulb", "crab"], "In lamb the b at the end is not said, like in thumb and climb. In bulb and crab we hear the b, and lamp has no b at all."],
        ["באיזו מילה יש b שלא הוגים?", "lamb", ["lamp", "bulb", "crab"], "ב־lamb לא הוגים את ה־b שבסוף, כמו ב־thumb וב־climb. ב־bulb וב־crab שומעים את ה־b, וב־lamp אין b בכלל."]],
      [["In which word does c sound like s?", "city", ["cat", "cup", "cold"], "Before e, i or y, c often sounds like s, so city starts with an s sound. In cat, cup and cold, c sounds like k."],
        ["באיזו מילה c נשמעת כמו s?", "city", ["cat", "cup", "cold"], "לפני e, i או y האות c נשמעת לרוב כמו s, ולכן city מתחילה בצליל s. ב־cat, ב־cup וב־cold האות c נשמעת כמו k."]],
      [["In which word does y sound like a long i?", "sky", ["happy", "baby", "yes"], "In short words like sky, my and fly, the y at the end sounds like a long i. In happy and baby it sounds like a long e, and in yes it is a consonant."],
        ["באיזו מילה y נשמעת כמו i ארוכה?", "sky", ["happy", "baby", "yes"], "במילים קצרות כמו sky, my ו־fly ה־y בסוף נשמעת כמו i ארוכה. ב־happy וב־baby היא נשמעת כמו e ארוכה, וב־yes היא עיצור."]],
      [["Which word has a silent g?", "gnome", ["giant", "goat", "flag"], "In gnome the g is not said, so it sounds like nome. The same happens in gnat and sign. In giant, goat and flag we hear the g."],
        ["באיזו מילה יש g שלא הוגים?", "gnome", ["giant", "goat", "flag"], "ב־gnome לא הוגים את ה־g, ולכן המילה נשמעת כמו nome. כך גם ב־gnat וב־sign. ב־giant, ב־goat וב־flag שומעים את ה־g."]],
      [["What sound do the letters “igh” make in “night”?", "a long i, as in my", ["a short i, as in sit", "a g sound, as in go", "an h sound, as in hat"], "The three letters igh work together to make one long i sound, as in night, light and high."],
        ["איזה צליל יוצרות האותיות igh במילה night?", "i ארוכה, כמו ב־my", ["i קצרה, כמו ב־sit", "הצליל g, כמו ב־go", "הצליל h, כמו ב־hat"], "שלוש האותיות igh עובדות יחד ויוצרות צליל אחד של i ארוכה, כמו ב־night, ב־light וב־high."]],
    ],
    n: [
      [2, ["How many sounds do you hear in “knee”?", "", "There are 2 sounds: n and a long e. The k is silent, and ee makes one sound."],
        ["כמה צלילים שומעים במילה knee?", "", "שומעים 2 צלילים: n ו־e ארוכה. ה־k לא נשמעת, ו־ee יוצרות צליל אחד."]],
    ],
  },
};
export default c;
