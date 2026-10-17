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
      [["Which question word asks for a reason?", "why", ["where", "who", "how many"], "Why asks for a reason: Why are you late?"],
        ["איזו מילת שאלה שואלת על סיבה?", "why", ["where", "who", "how many"], "why שואלת על סיבה: Why are you late?"]],
      [["Complete: “___ is your birthday?” — “In May.”", "When", ["Where", "Who", "Why"], "The answer is a time, so the question uses when."],
        ["השלימו: ״___ is your birthday?״ — ״In May.״", "When", ["Where", "Who", "Why"], "התשובה היא זמן, ולכן השאלה משתמשת ב־when."]],
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
      [["Choose the correct question.", "How much water do you drink?", ["How many water do you drink?", "How much waters do you drink?", "How many waters you drink?"], "Water is uncountable, so use how much."],
        ["בחרו את השאלה הנכונה.", "How much water do you drink?", ["How many water do you drink?", "How much waters do you drink?", "How many waters you drink?"], "water הוא שם עצם שאינו ספיר, ולכן משתמשים ב־how much."]],
      [["“Do you like apples?” What is the short positive answer?", "Yes, I do.", ["Yes, I like.", "Yes, I am.", "Yes, do I."], "Short answers repeat the helper verb: do."],
        ["״Do you like apples?״ מהי התשובה הקצרה החיובית?", "Yes, I do.", ["Yes, I like.", "Yes, I am.", "Yes, do I."], "בתשובה קצרה חוזרים על פועל העזר: do."]],
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
    ],
  },
};
export default c;
