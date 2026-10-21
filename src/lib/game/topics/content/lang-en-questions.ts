import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Question word", "a word that starts a question, like who, what, where, when or why", "מילת שאלה", "מילה שפותחת שאלה, כמו who, what, where, when או why"],
      ["where", "asks about a place", "where", "שואלת על מקום"],
      ["when", "asks about a time", "when", "שואלת על זמן"],
      ["who", "asks about a person", "who", "שואלת על אדם"],
    ],
    q: [
      [["Which question word asks for a reason?", "why", ["where", "who", "how many"], "Why asks for a reason: Why are you late? Where asks about a place, who about a person and how many about a number."],
        ["איזו מילת שאלה שואלת על סיבה?", "why", ["where", "who", "how many"], "why שואלת על סיבה: Why are you late? where שואלת על מקום, who על אדם ו־how many על מספר."]],
      [["Complete: “___ is your birthday?” — “In May.”", "When", ["Where", "Who", "Why"], "The answer, In May, is a time, so the question uses when. Where asks about a place, who about a person and why about a reason."],
        ["השלימו: ״___ is your birthday?״ — ״In May.״", "When", ["Where", "Who", "Why"], "התשובה In May היא זמן, ולכן השאלה משתמשת ב־when. where שואלת על מקום, who על אדם ו־why על סיבה."]],
      [["Complete: “___ is your teacher?” — “Mr Cohen.”", "Who", ["What", "Where", "When"], "The answer is a person, Mr Cohen, so the question uses who. What asks about a thing, where about a place and when about a time."],
        ["השלימו: ״___ is your teacher?״ — ״Mr Cohen.״", "Who", ["What", "Where", "When"], "התשובה היא אדם, Mr Cohen, ולכן השאלה משתמשת ב־who. what שואלת על דבר, where על מקום ו־when על זמן."]],
      [["Complete: “___ do you live?” — “In Haifa.”", "Where", ["When", "Were", "Which"], "The answer is a place, Haifa, so the question starts with where. When asks about a time, which asks you to choose, and were (with no h) is a form of be, not a question word."],
        ["השלימו: ״___ do you live?״ — ״In Haifa.״", "Where", ["When", "Were", "Which"], "התשובה היא מקום, חיפה, ולכן השאלה פותחת ב־where. when שואלת על זמן, which מבקשת לבחור, ו־were (בלי h) היא צורה של be ולא מילת שאלה."]],
      [["Complete: “___ old are you?” — “I'm nine.”", "How", ["How much", "What", "Which"], "To ask about age we say How old are you? How much asks about an amount or a price, and what and which do not come before old."],
        ["השלימו: ״___ old are you?״ — ״I'm nine.״", "How", ["How much", "What", "Which"], "כדי לשאול על גיל אומרים How old are you? המילים how much שואלות על כמות או על מחיר, ו־what ו־which לא באות לפני old."]],
    ],
    n: [
      [3, ["How many question words are in this list: who, chair, where, blue, why?", "", "Who, where and why start questions, so there are 3. Chair is a thing and blue is a colour, not question words."],
        ["כמה מילות שאלה יש ברשימה: who, chair, where, blue, why?", "", "who, where ו־why פותחות שאלות, ולכן יש 3. chair הוא חפץ ו־blue הוא צבע, והם אינם מילות שאלה."]],
    ],
  },
  i: {
    t: [
      ["Yes/no question", "a question answered with yes or no, starting with a helper verb: Do you…? Is she…?", "שאלת כן/לא", "שאלה שעונים עליה בכן או לא, ומתחילה בפועל עזר: Do you…? Is she…?"],
      ["how many / how much", "how many is for things you can count; how much is for amounts you cannot count", "how many / how much", "how many לדברים שאפשר לספור; how much לכמויות שאי אפשר לספור"],
      ["which", "asks to choose from a limited set: ___ colour do you want?", "which", "שואלת על בחירה מתוך קבוצה מוגבלת: ___ colour do you want?"],
      ["Short answer", "a reply that repeats the helper verb: Yes, I do. No, she isn't.", "תשובה קצרה", "תשובה שחוזרת על פועל העזר: Yes, I do. No, she isn't."],
    ],
    q: [
      [["Choose the correct question.", "How much water do you drink?", ["How many water do you drink?", "How much waters do you drink?", "How many waters you drink?"], "Water is uncountable, so we use how much, and water stays without -s. How many is only for things we can count, like apples."],
        ["בחרו את השאלה הנכונה.", "How much water do you drink?", ["How many water do you drink?", "How much waters do you drink?", "How many waters you drink?"], "water הוא שם עצם שאינו ספיר, ולכן משתמשים ב־how much, ו־water נשאר בלי s. את how many אומרים רק על דברים שאפשר לספור, כמו apples."]],
      [["“Do you like apples?” What is the short positive answer?", "Yes, I do.", ["Yes, I like.", "Yes, I am.", "Yes, do I."], "Short answers repeat the helper verb of the question, here do: Yes, I do. Like is not a helper verb, and am does not match the do of the question."],
        ["״Do you like apples?״ מהי התשובה הקצרה החיובית?", "Yes, I do.", ["Yes, I like.", "Yes, I am.", "Yes, do I."], "בתשובה קצרה חוזרים על פועל העזר של השאלה, כאן do: Yes, I do. המילה like אינה פועל עזר, ו־am לא מתאים ל־do שבשאלה."]],
      [["Choose the correct yes/no question with she.", "Does she like football?", ["Does she likes football?", "Do she like football?", "Is she like football?"], "With he, she or it the helper verb is does, and the main verb goes back to its base form: Does she like football? Not likes, and is does not go with like."],
        ["בחרו את שאלת הכן/לא הנכונה עם she.", "Does she like football?", ["Does she likes football?", "Do she like football?", "Is she like football?"], "עם he, she או it פועל העזר הוא does, והפועל העיקרי חוזר לצורת הבסיס: Does she like football? לא likes, ו־is לא בא עם like."]],
      [["“Is your brother at school?” What is the short negative answer?", "No, he isn't.", ["No, he doesn't.", "No, he not.", "No, isn't he."], "The question starts with is, so the short answer repeats is with not: No, he isn't. Doesn't would answer a question that starts with does."],
        ["״Is your brother at school?״ מהי התשובה הקצרה השלילית?", "No, he isn't.", ["No, he doesn't.", "No, he not.", "No, isn't he."], "השאלה פותחת ב־is, ולכן בתשובה הקצרה חוזרים על is עם not: No, he isn't. את doesn't עונים על שאלה שפותחת ב־does."]],
      [["Complete: “How ___ apples are in the bag?”", "many", ["much", "lot", "more"], "Apples can be counted (one apple, two apples), so we ask how many. How much is for things we cannot count, like water or sugar."],
        ["השלימו: ״How ___ apples are in the bag?״", "many", ["much", "lot", "more"], "תפוחים אפשר לספור (one apple, two apples), ולכן שואלים how many. את how much אומרים על דברים שאי אפשר לספור, כמו water או sugar."]],
      [["Complete: “___ bag is yours, the red one or the blue one?”", "Which", ["Who", "Where", "How"], "There are only two bags to choose from, so we ask which. Who asks about a person, where about a place and how about the way something is done."],
        ["השלימו: ״___ bag is yours, the red one or the blue one?״", "Which", ["Who", "Where", "How"], "יש רק שני תיקים לבחור ביניהם, ולכן שואלים which. who שואלת על אדם, where על מקום ו־how על הדרך שבה משהו נעשה."]],
    ],
  },
  a: {
    t: [
      ["Indirect question", "a polite question inside another sentence, with normal word order: Could you tell me where the station is?", "שאלה עקיפה", "שאלה מנומסת בתוך משפט אחר, בסדר מילים רגיל: Could you tell me where the station is?"],
      ["Tag question", "a short question added to the end of a sentence: It's cold, isn't it?", "שאלת זנב", "שאלה קצרה שמוסיפים לסוף משפט: It's cold, isn't it?"],
      ["Subject question", "a question about the subject, which needs no do: Who called you?", "שאלה על הנושא", "שאלה שבה מילת השאלה היא עצמה הנושא, ולכן לא צריך do: Who called you?"],
      ["Object question", "a question about the object, which uses do/does/did: Who did you call?", "שאלה על המושא", "שאלה שבה מילת השאלה מחליפה את המושא, ולכן משתמשים ב־do/does/did: Who did you call?"],
    ],
    q: [
      [["Choose the correct indirect question.", "Do you know what time it is?", ["Do you know what time is it?", "Do you know what is the time it?", "Do you know time what it is?"], "In indirect questions the word order is like a statement: what time it is."],
        ["בחרו את השאלה העקיפה הנכונה.", "Do you know what time it is?", ["Do you know what time is it?", "Do you know what is the time it?", "Do you know time what it is?"], "בשאלה עקיפה סדר המילים כמו במשפט חיווי: what time it is."]],
      [["Complete the tag: “You're coming tomorrow, ___?”", "aren't you", ["don't you", "isn't it", "are you not coming"], "A positive sentence with are takes a negative tag with are: aren't you?"],
        ["השלימו את שאלת הזנב: ״You're coming tomorrow, ___?״", "aren't you", ["don't you", "isn't it", "are you not coming"], "משפט חיובי עם are מקבל שאלת זנב שלילית עם are: aren't you?"]],
      [["Someone broke the window. Which question asks who did it?", "Who broke the window?", ["Who did broke the window?", "Who breaked the window?", "Whom broke the window?"], "Who is the subject here, so the question needs no did and keeps the normal past form: Who broke the window? Did broke uses two past forms, breaked is not a word, and whom is never a subject."],
        ["מישהו שבר את החלון. איזו שאלה שואלת מי עשה את זה?", "Who broke the window?", ["Who did broke the window?", "Who breaked the window?", "Whom broke the window?"], "who הוא כאן הנושא, ולכן בשאלה אין did והפועל נשאר בצורת העבר הרגילה: Who broke the window? ב־did broke יש שתי צורות עבר, breaked אינה מילה, ו־whom אף פעם אינה נושא."]],
      [["Tom called someone. Which question asks about that person?", "Who did Tom call?", ["Who did Tom called?", "Who Tom called?", "Who called Tom?"], "The person Tom called is the object, so the question uses did and the base form: Who did Tom call? Who called Tom? would ask about the person who phoned him."],
        ["תום התקשר למישהו. איזו שאלה שואלת על האדם הזה?", "Who did Tom call?", ["Who did Tom called?", "Who Tom called?", "Who called Tom?"], "האדם שתום התקשר אליו הוא המושא, ולכן השאלה משתמשת ב־did ובצורת הבסיס: Who did Tom call? השאלה Who called Tom? הייתה שואלת מי התקשר אל תום."]],
      [["Complete the tag: “She can't swim, ___?”", "can she", ["can't she", "does she", "isn't she"], "A negative sentence takes a positive tag with the same helper verb: She can't swim, can she? Does and is would need a sentence with does or is."],
        ["השלימו את שאלת הזנב: ״She can't swim, ___?״", "can she", ["can't she", "does she", "isn't she"], "משפט שלילי מקבל שאלת זנב חיובית עם אותו פועל עזר: She can't swim, can she? את does ואת is היה צריך רק במשפט עם does או עם is."]],
      [["Complete the tag: “I'm in your team, ___?”", "aren't I", ["amn't I", "isn't I", "aren't you"], "The usual tag for I am is aren't I: I'm in your team, aren't I? Amn't I is not standard English, I never goes with is, and the tag repeats the subject I, not you."],
        ["השלימו את שאלת הזנב: ״I'm in your team, ___?״", "aren't I", ["amn't I", "isn't I", "aren't you"], "שאלת הזנב הרגילה ל־I am היא aren't I: I'm in your team, aren't I? הצורה amn't I אינה אנגלית תקנית, I לעולם לא בא עם is, ובשאלת הזנב חוזר הנושא I ולא you."]],
    ],
  },
};
export default c;
