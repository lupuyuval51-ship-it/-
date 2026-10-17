import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Fact", "a statement that can be checked and shown to be true", "עובדה", "טענה שאפשר לבדוק ולהראות שהיא נכונה"],
      ["Opinion", "what someone thinks or feels, which others may disagree with", "דעה", "מה שמישהו חושב או מרגיש, ואחרים יכולים לא להסכים איתו"],
      ["Evidence", "information that shows whether something is true", "ראיה", "מידע שמראה אם משהו נכון"],
      ["Source", "where information comes from, like a book, website or person", "מקור מידע", "המקום שממנו מגיע מידע, כמו ספר, אתר או אדם"],
    ],
    q: [
      [["Which is a fact?", "Jerusalem is in Israel.", ["Pizza is the best food.", "Summer is more fun than winter.", "Cats are nicer than dogs."], "It can be checked; the others are opinions."],
        ["מה מהבאים הוא עובדה?", "ירושלים נמצאת בישראל.", ["פיצה היא האוכל הכי טוב.", "הקיץ כיפי יותר מהחורף.", "חתולים נחמדים יותר מכלבים."], "את זה אפשר לבדוק; השאר הן דעות."]],
      [["A website with no author says chocolate cures colds. What should you do?", "Check other reliable sources before believing it", ["Believe it, it is online", "Share it with everyone at once", "Eat only chocolate"], "Unsigned claims need checking against trustworthy sources."],
        ["אתר בלי שם כותב טוען ששוקולד מרפא הצטננות. מה כדאי לעשות?", "לבדוק במקורות אמינים אחרים לפני שמאמינים", ["להאמין, זה באינטרנט", "לשתף מיד עם כולם", "לאכול רק שוקולד"], "טענות בלי כותב צריך לבדוק מול מקורות אמינים."]],
    ],
  },
  i: {
    t: [
      ["Bias", "a leaning that makes a source present only one side", "הטיה", "נטייה שגורמת למקור להציג רק צד אחד"],
      ["Argument", "a claim supported by reasons", "טיעון", "טענה שנתמכת בנימוקים"],
      ["Assumption", "something taken as true without proof", "הנחה", "משהו שמקבלים כנכון בלי הוכחה"],
      ["Cross-checking", "comparing several independent sources to see if they agree", "הצלבת מקורות", "השוואה בין כמה מקורות בלתי תלויים כדי לראות אם הם מסכימים"],
    ],
    q: [
      [["An advert for a drink says “9 out of 10 kids love it!” What is the best question to ask?", "Who asked the kids, and how many?", ["What colour is the can?", "Is the advert long?", "Do adults drink water?"], "Knowing who ran the survey and the sample size shows whether the claim means much."],
        ["פרסומת למשקה אומרת ״9 מתוך 10 ילדים אוהבים אותו!״. מה השאלה הכי טובה לשאול?", "מי שאל את הילדים, וכמה ילדים נשאלו?", ["באיזה צבע הפחית?", "האם הפרסומת ארוכה?", "האם מבוגרים שותים מים?"], "כשיודעים מי ערך את הסקר ומה גודל המדגם, אפשר להבין כמה הטענה שווה."]],
      [["Two independent news sources report the same event with the same details. This…", "makes the report more likely to be accurate", ["proves it is false", "means both copied a rumour for sure", "tells nothing at all"], "Agreement between independent sources is a good sign, though still not absolute proof."],
        ["שני מקורות חדשות בלתי תלויים מדווחים על אותו אירוע עם אותם פרטים. זה…", "מגדיל את הסיכוי שהדיווח מדויק", ["מוכיח שהוא שקרי", "אומר שבוודאות שניהם העתיקו שמועה", "לא אומר כלום"], "הסכמה בין מקורות בלתי תלויים היא סימן טוב, אם כי עדיין לא הוכחה מוחלטת."]],
    ],
  },
  a: {
    t: [
      ["Logical fallacy", "a mistake in reasoning that makes an argument weak", "כשל לוגי", "טעות בהיגיון שמחלישה טיעון"],
      ["Ad hominem", "attacking the person instead of their argument", "טיעון נגד האדם", "התקפה על האדם במקום על הטיעון שלו"],
      ["Straw man", "arguing against a weaker, twisted version of what someone said", "איש קש", "ויכוח נגד גרסה מעוותת וחלשה יותר של מה שמישהו אמר"],
      ["False dilemma", "pretending there are only two choices when there are more", "דילמה כוזבת", "הצגה כאילו יש רק שתי אפשרויות כשיש יותר"],
    ],
    q: [
      [["“You can't trust her idea about recycling — she can't even keep her room tidy.” This is…", "an ad hominem fallacy", ["a strong argument", "a false dilemma", "a fact"], "It attacks the person, not the reasons for or against the idea."],
        ["״אי אפשר לסמוך על הרעיון שלה על מיחזור — היא אפילו לא מסדרת את החדר שלה.״ זה…", "טיעון נגד האדם", ["טיעון חזק", "דילמה כוזבת", "עובדה"], "זו התקפה על האדם, לא על הנימוקים בעד הרעיון או נגדו."]],
      [["“Either we ban all phones at school, or pupils will never learn anything.” What is wrong with this?", "It is a false dilemma: other options exist", ["Nothing, it is perfectly logical", "It is an ad hominem", "It uses too many numbers"], "There are many middle options, such as rules for when phones may be used."],
        ["״או שנאסור כל טלפון בבית הספר, או שתלמידים לא ילמדו כלום לעולם.״ מה הבעיה בזה?", "זו דילמה כוזבת: יש אפשרויות אחרות", ["אין בעיה, זה הגיוני לגמרי", "זה טיעון נגד האדם", "יש בזה יותר מדי מספרים"], "יש אפשרויות ביניים רבות, כמו כללים מתי מותר להשתמש בטלפון."]],
    ],
  },
};
export default c;
