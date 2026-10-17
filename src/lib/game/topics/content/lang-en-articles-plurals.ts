import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["a / an", "words for one thing that is not specific: a book, an apple", "a / an", "מילים לדבר אחד שאינו מסוים: a book, an apple"],
      ["Noun", "a word for a person, place, animal or thing", "שם עצם", "מילה לאדם, מקום, בעל חיים או חפץ"],
      ["Plural", "the form for more than one: cats, boxes", "רבים", "הצורה ליותר מאחד: cats, boxes"],
      ["Singular", "the form for exactly one: cat, box", "יחיד", "הצורה לאחד בדיוק: cat, box"],
    ],
    q: [
      [["Choose the correct phrase.", "an orange", ["a orange", "an banana", "a apple"], "Use an before a vowel sound: an orange, an apple; a before a consonant sound: a banana."],
        ["בחרו את הצירוף הנכון.", "an orange", ["a orange", "an banana", "a apple"], "לפני צליל תנועה משתמשים ב־an: an orange, an apple; לפני צליל עיצור ב־a: a banana."]],
      [["What is the plural of “box”?", "boxes", ["boxs", "boxies", "box"], "Nouns ending in -x, -s, -sh or -ch add -es: boxes."],
        ["מהי צורת הרבים של box?", "boxes", ["boxs", "boxies", "box"], "שמות עצם שמסתיימים ב־x, s, sh או ch מקבלים es: boxes."]],
    ],
  },
  i: {
    t: [
      ["the", "used for a specific thing both speakers know, as in “___ sun”", "the", "מילה לדבר מסוים שידוע לשני הדוברים, כמו ב״___ sun״"],
      ["Irregular plural", "a plural that does not just add -s: child → children, mouse → mice", "רבים לא רגיל", "צורת רבים שלא רק מוסיפה s: child → children, mouse → mice"],
      ["Uncountable noun", "a noun with no plural that you cannot count one by one: water, rice, information", "שם עצם שאינו ספיר", "שם עצם בלי צורת רבים שאי אפשר לספור אחד־אחד: water, rice, information"],
      ["-y to -ies", "a noun ending in consonant + y changes to -ies: baby → babies", "y שהופך ל־ies", "שם עצם שמסתיים בעיצור ו־y משתנה ל־ies: baby → babies"],
    ],
    q: [
      [["What is the plural of “child”?", "children", ["childs", "childes", "childrens"], "Child has an irregular plural: children."],
        ["מהי צורת הרבים של child?", "children", ["childs", "childes", "childrens"], "ל־child יש צורת רבים לא רגילה: children."]],
      [["Choose the correct sentence.", "I need some information.", ["I need an information.", "I need two informations.", "I need a informations."], "Information is uncountable: no a/an and no plural."],
        ["בחרו את המשפט הנכון.", "I need some information.", ["I need an information.", "I need two informations.", "I need a informations."], "information הוא שם עצם שאינו ספיר: בלי a/an ובלי רבים."]],
    ],
  },
  a: {
    t: [
      ["Zero article", "using no article, as with general plurals and many names: Dogs are loyal. I live in Israel.", "היעדר יידוע", "שימוש בלי a, an או the, כמו ברבים כלליים ובשמות רבים: Dogs are loyal. I live in Israel."],
      ["Vowel sound rule", "a/an depends on sound, not spelling: an hour, a university", "כלל צליל התנועה", "הבחירה בין a ל־an תלויה בצליל ולא בכתיב: an hour, a university"],
      ["Collective noun", "a singular word for a group: team, family, class", "שם קיבוצי", "מילה ביחיד שמתארת קבוצה: team, family, class"],
      ["Plural-only noun", "a noun used only in the plural: scissors, trousers, glasses", "שם עצם שבא רק ברבים", "שם עצם שמשמש רק בצורת רבים: scissors, trousers, glasses"],
    ],
    q: [
      [["Which phrase uses a or an correctly?", "an hour", ["a hour", "an university", "a honest man"], "Hour starts with a vowel sound (the h is silent), so an hour; university starts with a “you” sound, so a university."],
        ["באיזה צירוף a או an בשימוש נכון?", "an hour", ["a hour", "an university", "a honest man"], "hour מתחיל בצליל תנועה (ה־h שקטה), ולכן an hour; university מתחיל בצליל ״יו״, ולכן a university."]],
      [["Which sentence is correct?", "Cats like milk.", ["The cats like the milk in general.", "A cats like milk.", "Cats like a milk."], "For general statements about a whole kind, English uses the plural with no article."],
        ["איזה משפט נכון?", "Cats like milk.", ["The cats like the milk in general.", "A cats like milk.", "Cats like a milk."], "בטענות כלליות על סוג שלם, האנגלית משתמשת ברבים בלי מילת יידוע."]],
    ],
  },
};
export default c;
