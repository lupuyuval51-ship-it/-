import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Suffix", "letters added to the end of a word to make a new word or form, like -ing, -ed or -ful", "סיומת", "אותיות שמוסיפים לסוף מילה כדי ליצור מילה או צורה חדשה, כמו ing, ed או ful"],
      ["Base word", "the word you start from before adding any letters, like jump in jumping", "מילת בסיס", "המילה שממנה מתחילים לפני שמוסיפים לה אותיות, כמו jump ב־jumping"],
      ["Silent e", "an e at the end of a word that is written but not said, as in make or hope", "e שקטה", "e בסוף מילה שכותבים אבל לא הוגים, כמו ב־make או ב־hope"],
    ],
    q: [
      [["Add -s or -es: one box, two ___.", "boxes", ["boxs", "boxies", "boxxes"], "Words ending in s, x, z, ch or sh add -es to make the plural, because boxs would be hard to say: boxes."],
        ["הוסיפו s או es: one box, two ___.", "boxes", ["boxs", "boxies", "boxxes"], "מילים שמסתיימות ב־s, x, z, ch או sh מקבלות es ברבים, כי את boxs קשה לבטא: boxes."]],
      [["Add -ing to “read”.", "reading", ["readding", "readeing", "readin"], "Read has two vowels before the d, so nothing changes: just add -ing to get reading."],
        ["הוסיפו ing ל־read.", "reading", ["readding", "readeing", "readin"], "ב־read יש שתי תנועות לפני ה־d, ולכן שום דבר לא משתנה: פשוט מוסיפים ing ומקבלים reading."]],
      [["Add -ed to “jump”.", "jumped", ["jumpped", "jumpt", "jumpd"], "Jump ends in two consonants, m and p, so we just add -ed: jumped."],
        ["הוסיפו ed ל־jump.", "jumped", ["jumpped", "jumpt", "jumpd"], "jump מסתיים בשני עיצורים, m ו־p, ולכן פשוט מוסיפים ed: jumped."]],
      [["Add -ing to “make”.", "making", ["makeing", "makking", "makin"], "Make ends in a silent e, and we drop the e before -ing: make → making."],
        ["הוסיפו ing ל־make.", "making", ["makeing", "makking", "makin"], "make מסתיים ב־e שקטה, ומורידים אותה לפני ing: make → making."]],
      [["Which word is spelled correctly?", "because", ["becuase", "becaus", "beacause"], "The correct spelling is because. A trick to remember it: Big Elephants Can Always Understand Small Elephants."],
        ["איזו מילה כתובה נכון?", "because", ["becuase", "becaus", "beacause"], "הכתיב הנכון הוא because. טריק שעוזר לזכור: Big Elephants Can Always Understand Small Elephants — האות הראשונה של כל מילה."]],
      [["Which day of the week is spelled correctly?", "Wednesday", ["Wensday", "Wendsday", "Wednsday"], "Wednesday has a d we don't hear: Wed-nes-day. Saying it slowly in three parts helps you spell it."],
        ["איזה יום בשבוע כתוב נכון?", "Wednesday", ["Wensday", "Wendsday", "Wednsday"], "ב־Wednesday יש d שלא שומעים: Wed-nes-day. אם אומרים את המילה לאט בשלושה חלקים, קל יותר לכתוב אותה."]],
    ],
    n: [
      [3, ["How many of these words add -es in the plural: fox, cat, bus, dog, wish?", "", "3 of them: foxes, buses and wishes. Cat and dog just add -s: cats, dogs."],
        ["כמה מהמילים האלה מקבלות es ברבים: fox, cat, bus, dog, wish?", "", "3 מהן: foxes, buses ו־wishes. המילים cat ו־dog מקבלות רק s: cats, dogs."]],
    ],
  },
  i: {
    t: [
      ["Doubling rule", "for a short word ending in one vowel + one consonant (not w, x or y), write that consonant twice before -ing or -ed: hop → hopping", "כלל ההכפלה", "במילה קצרה שמסתיימת בתנועה אחת ועיצור אחד (לא w, x או y) כותבים את העיצור פעמיים לפני ing או ed: hop → hopping"],
      ["y to i rule", "when a word ends in a consonant + y, change the y to i before most endings: carry → carried", "החלפת y ב־i", "כשמילה מסתיימת בעיצור ואחריו y, הופכים את ה־y ל־i לפני רוב הסיומות: carry → carried"],
      ["i before e", "a spelling rhyme for ie and ei words that ends “except after c”, as in piece and ceiling", "i before e", "חרוז כתיב למילים עם ie ו־ei, שמסתיים ב״except after c״, כמו piece ו־ceiling"],
    ],
    q: [
      [["Add -er to “big”.", "bigger", ["biger", "bigeer", "biggr"], "Big is short and ends in one vowel + one consonant (i + g), so we double the g: bigger."],
        ["הוסיפו er ל־big.", "bigger", ["biger", "bigeer", "biggr"], "big היא מילה קצרה שמסתיימת בתנועה אחת ועיצור אחד (i ו־g), ולכן מכפילים את ה־g: bigger."]],
      [["What is the past form of “cry”?", "cried", ["cryed", "creid", "criied"], "Cry ends in a consonant + y, so the y changes to i before -ed: cried."],
        ["מהי צורת העבר של cry?", "cried", ["cryed", "creid", "criied"], "cry מסתיים בעיצור ואחריו y, ולכן ה־y הופכת ל־i לפני ed: cried."]],
      [["Add -ing to “cry”.", "crying", ["criing", "cryying", "criying"], "Before -ing the y stays, so that we don't get two i's in a row: crying."],
        ["הוסיפו ing ל־cry.", "crying", ["criing", "cryying", "criying"], "לפני ing ה־y נשארת, כדי שלא יהיו שתי אותיות i ברצף: crying."]],
      [["Why is “played” not spelled “plaied”?", "because there is a vowel before the y", ["because y never changes when we add -ed", "because play is too short to change", "because -ed never changes the word before it"], "We change y to i only after a consonant (carry → carried). In play a vowel, a, comes before the y, so the y stays: played."],
        ["למה כותבים played ולא plaied?", "כי לפני ה־y יש תנועה", ["כי y אף פעם לא משתנה כשמוסיפים ed", "כי play היא מילה קצרה מדי", "כי ed אף פעם לא משנה את המילה שלפניה"], "מחליפים y ב־i רק אחרי עיצור (carry → carried). ב־play לפני ה־y יש תנועה, a, ולכן ה־y נשארת: played."]],
      [["Which word is spelled correctly, as the i-before-e rule says?", "believe", ["beleive", "belive", "beleave"], "Believe follows the rule: i before e when there is no c just before. Beleive puts the e first, which breaks the rule."],
        ["איזו מילה כתובה נכון, לפי הכלל i before e?", "believe", ["beleive", "belive", "beleave"], "believe שומר על הכלל: i לפני e כשאין c ממש לפניהן. ב־beleive ה־e באה ראשונה, וזה שובר את הכלל."]],
      [["Which spelling is correct?", "receive", ["recieve", "receve", "resieve"], "After c the order is e then i: receive, ceiling, receipt. That is the except after c part of the rhyme."],
        ["איזה כתיב נכון?", "receive", ["recieve", "receve", "resieve"], "אחרי c הסדר הוא e ואחריה i: receive, ceiling, receipt. זה החלק ״except after c״ שבחרוז."]],
    ],
    n: [
      [3, ["How many of these words double the last letter before -ing: swim, jump, shop, read, get?", "", "3 of them: swimming, shopping and getting. Jump ends in two consonants and read has two vowels, so they don't double."],
        ["כמה מהמילים האלה מכפילות את האות האחרונה לפני ing: swim, jump, shop, read, get?", "", "3 מהן: swimming, shopping ו־getting. jump מסתיים בשני עיצורים וב־read יש שתי תנועות, ולכן אין בהן הכפלה."]],
    ],
    s: [
      [["Adding -ed to “carry”, in order", "Look at the last two letters: r and y", "See that a consonant comes before the y", "Change the y to i: carri", "Add -ed to get carried"],
        ["מוסיפים ed ל־carry, לפי הסדר", "מסתכלים על שתי האותיות האחרונות: r ו־y", "רואים שלפני ה־y יש עיצור", "מחליפים את ה־y ב־i: carri", "מוסיפים ed ומקבלים carried"]],
    ],
  },
  a: {
    t: [
      ["Stressed syllable", "the part of a word said with more force, like the second part of begin", "הברה מוטעמת", "החלק במילה שאומרים בחוזק רב יותר, כמו החלק השני במילה begin"],
      ["-ful", "an ending that often means full of, always spelled with one l: helpful, careful", "הסיומת ful", "סיומת שפירושה לרוב ״מלא ב־״, ותמיד נכתבת עם l אחת: helpful, careful"],
      ["Mnemonic", "a trick that helps you remember something, like “a piece of pie” for spelling piece", "סימן זיכרון", "תרגיל שעוזר לזכור משהו, כמו ״a piece of pie״ לכתיב של piece"],
    ],
    q: [
      [["Add -ing to “forget”.", "forgetting", ["forgeting", "forgetteing", "forgettting"], "Forget is stressed on its last part (for-GET) and ends in one vowel + one consonant, so the t is doubled: forgetting."],
        ["הוסיפו ing ל־forget.", "forgetting", ["forgeting", "forgetteing", "forgettting"], "ב־forget ההטעמה על החלק האחרון (for-GET), והמילה מסתיימת בתנועה אחת ועיצור אחד, ולכן מכפילים את ה־t: forgetting."]],
      [["Add -ed to “visit”.", "visited", ["visitted", "visitied", "visitd"], "Visit is stressed on its first part (VIS-it), so the t is not doubled: visited."],
        ["הוסיפו ed ל־visit.", "visited", ["visitted", "visitied", "visitd"], "ב־visit ההטעמה על החלק הראשון (VIS-it), ולכן לא מכפילים את ה־t: visited."]],
      [["Choose the correct spelling of the word that means “needed”.", "necessary", ["neccessary", "necesary", "neccesary"], "Necessary has one c and two s's. A trick: a shirt has one collar (c) and two sleeves (s, s)."],
        ["בחרו את הכתיב הנכון של המילה שפירושה ״נחוץ״.", "necessary", ["neccessary", "necesary", "neccesary"], "ב־necessary יש c אחת ושתי s. טריק: לחולצה יש צווארון אחד (c, collar) ושני שרוולים (s, s — sleeves)."]],
      [["Complete: “Keep the two piles ___.”", "separate", ["seperate", "separete", "seperete"], "The correct spelling is separate, with par in the middle. A trick: there is a rat in sepaRATe."],
        ["השלימו: ״Keep the two piles ___.״", "separate", ["seperate", "separete", "seperete"], "הכתיב הנכון הוא separate, עם par באמצע. טריק: יש עכברוש (rat) בתוך sepaRATe."]],
      [["Which word with -ful is spelled correctly?", "beautiful", ["beautifull", "beautyful", "beutiful"], "Beauty ends in a consonant + y, so the y changes to i, and -ful always has one l: beautiful."],
        ["איזו מילה עם ful כתובה נכון?", "beautiful", ["beautifull", "beautyful", "beutiful"], "beauty מסתיימת בעיצור ואחריו y, ולכן ה־y הופכת ל־i, והסיומת ful תמיד עם l אחת: beautiful."]],
      [["Why does “noticeable” keep the e of “notice”?", "the e keeps the c soft, so it still sounds like s", ["the e makes the i before it a long vowel sound", "words ending in -able always keep every letter of the base", "the e shows that the word is a plural noun"], "Without the e, the c would come before a and sound like k (noticable). Keeping the e keeps the soft s sound."],
        ["למה noticeable שומרת על ה־e של notice?", "ה־e שומרת על c רכה, כך שהיא עדיין נשמעת כמו s", ["ה־e הופכת את ה־i שלפניה לתנועה ארוכה", "מילים עם able תמיד שומרות על כל האותיות של מילת הבסיס", "ה־e מראה שהמילה היא שם עצם ברבים"], "בלי ה־e, ה־c הייתה באה לפני a ונשמעת כמו k (noticable). כשמשאירים את ה־e, נשמר הצליל הרך s."]],
    ],
    n: [
      [4, ["How many times does the letter s appear in “possession”?", "", "The letter s appears 4 times: possession has two pairs of s's (po-ss-e-ss-ion)."],
        ["כמה פעמים מופיעה האות s במילה possession?", "", "האות s מופיעה 4 פעמים: ב־possession יש שני זוגות של s (po-ss-e-ss-ion)."]],
    ],
  },
};
export default c;
