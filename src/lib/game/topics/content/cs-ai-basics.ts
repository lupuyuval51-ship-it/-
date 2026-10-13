import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Artificial intelligence", "computer systems that do tasks which usually need human thinking, like recognising speech", "בינה מלאכותית", "מערכות מחשב שמבצעות משימות שבדרך כלל דורשות חשיבה אנושית, כמו זיהוי דיבור"],
      ["Robot", "a machine that can sense, move and carry out tasks", "רובוט", "מכונה שיכולה לחוש, לזוז ולבצע משימות"],
      ["Voice assistant", "a program that answers spoken questions and commands", "עוזר קולי", "תוכנה שעונה על שאלות ופקודות בדיבור"],
      ["Data", "facts, numbers, pictures or text that computers can store and learn from", "נתונים", "עובדות, מספרים, תמונות או טקסט שמחשבים יכולים לשמור וללמוד מהם"],
    ],
    q: [
      [["Which of these uses AI?", "A photo app that recognises faces", ["A light switch", "A paper book", "A bicycle bell"], "Recognising faces in pictures is a typical AI task."],
        ["מה מהבאים משתמש בבינה מלאכותית?", "אפליקציית תמונות שמזהה פנים", ["מתג אור", "ספר מנייר", "פעמון של אופניים"], "זיהוי פנים בתמונות הוא משימה טיפוסית של בינה מלאכותית."]],
      [["Is an AI chatbot always right?", "No — it can make mistakes, so check important facts", ["Yes, always", "Only on weekends", "Only about maths"], "AI systems can sound confident and still be wrong."],
        ["האם צ׳טבוט של בינה מלאכותית תמיד צודק?", "לא — הוא יכול לטעות, ולכן כדאי לבדוק עובדות חשובות", ["כן, תמיד", "רק בסופי שבוע", "רק במתמטיקה"], "מערכות בינה מלאכותית יכולות להישמע בטוחות ועדיין לטעות."]],
    ],
  },
  i: {
    t: [
      ["Machine learning", "a way for computers to learn patterns from examples instead of following only hand-written rules", "למידת מכונה", "דרך שבה מחשבים לומדים דפוסים מדוגמאות, במקום לפעול רק לפי כללים שנכתבו ביד"],
      ["Training data", "the examples an AI system learns from", "נתוני אימון", "הדוגמאות שמערכת בינה מלאכותית לומדת מהן"],
      ["Model", "what a machine-learning system has learned, used to make predictions", "מודל", "מה שמערכת של למידת מכונה למדה, ומשמש לחיזוי"],
      ["Label", "the correct answer attached to a training example, like “cat” on a cat photo", "תווית", "התשובה הנכונה שמוצמדת לדוגמת אימון, כמו ״חתול״ על תמונה של חתול"],
    ],
    q: [
      [["An AI learned to recognise dogs only from photos of brown dogs. What may happen?", "It may fail on dogs of other colours", ["It will recognise every animal", "It will learn new colours by itself at once", "Nothing, colour never matters"], "A model can only be as good as the variety in its training data."],
        ["מערכת בינה מלאכותית למדה לזהות כלבים רק מתמונות של כלבים חומים. מה עלול לקרות?", "היא עלולה להיכשל בכלבים בצבעים אחרים", ["היא תזהה כל בעל חיים", "היא תלמד מיד צבעים חדשים בעצמה", "כלום, הצבע אף פעם לא משנה"], "מודל טוב רק כמו המגוון שבנתוני האימון שלו."]],
      [["Why do spam filters improve when people mark emails as spam?", "Each mark becomes a new labelled training example", ["People delete the internet", "The computer gets faster", "Spam stops being sent"], "Labelled examples let the model learn better patterns."],
        ["למה מסנני דואר זבל משתפרים כשאנשים מסמנים הודעות כזבל?", "כל סימון הופך לדוגמת אימון חדשה עם תווית", ["אנשים מוחקים את האינטרנט", "המחשב נעשה מהיר יותר", "הפסיקו לשלוח דואר זבל"], "דוגמאות עם תוויות מאפשרות למודל ללמוד דפוסים טובים יותר."]],
    ],
  },
  a: {
    t: [
      ["Neural network", "a model made of many connected simple units whose connection strengths are adjusted during training", "רשת נוירונים", "מודל שבנוי מיחידות פשוטות רבות שמחוברות זו לזו, וחוזק החיבורים ביניהן מכוונן באימון"],
      ["Bias (in AI)", "unfair or skewed results caused by unbalanced data or design choices", "הטיה (בבינה מלאכותית)", "תוצאות לא הוגנות או מעוותות שנגרמות מנתונים לא מאוזנים או מבחירות בתכנון"],
      ["Overfitting", "a model that memorises its training examples and does badly on new ones", "התאמת יתר", "מודל ששינן את דוגמאות האימון ומתפקד רע על דוגמאות חדשות"],
      ["Hallucination", "a confident answer from a language model that is actually false or made up", "הזיה (של מודל)", "תשובה בטוחה של מודל שפה שבפועל שגויה או מומצאת"],
    ],
    q: [
      [["A model scores 99% on its training data but 60% on new data. This is most likely…", "overfitting", ["perfect learning", "too little memory", "a broken screen"], "It learned the training set too closely instead of general patterns."],
        ["מודל מגיע ל־99% על נתוני האימון אבל ל־60% על נתונים חדשים. זו ככל הנראה…", "התאמת יתר", ["למידה מושלמת", "מחסור בזיכרון", "מסך שבור"], "הוא למד את נתוני האימון מקרוב מדי, במקום דפוסים כלליים."]],
      [["Why do AI developers test a system on data it has never seen?", "To check that it works on new cases, not just on what it memorised", ["To make training slower", "Because old data is illegal", "To use less electricity"], "A separate test set is the honest way to measure real performance."],
        ["למה מפתחי בינה מלאכותית בודקים מערכת על נתונים שהיא מעולם לא ראתה?", "כדי לבדוק שהיא עובדת על מקרים חדשים, ולא רק על מה ששיננה", ["כדי להאט את האימון", "כי נתונים ישנים אסורים", "כדי לחסוך בחשמל"], "קבוצת בדיקה נפרדת היא הדרך הכנה למדוד ביצועים אמיתיים."]],
    ],
  },
};
export default c;
