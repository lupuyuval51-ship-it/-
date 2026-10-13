import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Hardware", "the physical parts of a computer that you can touch", "חומרה", "החלקים הפיזיים של מחשב שאפשר לגעת בהם"],
      ["Software", "the programs that run on a computer", "תוכנה", "התוכניות שרצות במחשב"],
      ["Keyboard", "an input device with keys for typing", "מקלדת", "התקן קלט עם מקשים להקלדה"],
      ["Screen", "an output device that shows pictures and text", "מסך", "התקן פלט שמציג תמונות וטקסט"],
    ],
    q: [
      [["Which of these is an input device?", "A mouse", ["A printer", "A speaker", "A screen"], "A mouse sends information into the computer; printers, speakers and screens give information out."],
        ["מה מהבאים הוא התקן קלט?", "עכבר", ["מדפסת", "רמקול", "מסך"], "עכבר מכניס מידע למחשב; מדפסת, רמקול ומסך מוציאים מידע החוצה."]],
      [["Which of these is software?", "A web browser", ["A keyboard", "A cable", "A hard drive"], "A browser is a program; the others are physical parts."],
        ["מה מהבאים הוא תוכנה?", "דפדפן אינטרנט", ["מקלדת", "כבל", "כונן קשיח"], "דפדפן הוא תוכנית; השאר הם חלקים פיזיים."]],
    ],
  },
  i: {
    t: [
      ["CPU", "the processor: the part that carries out the program's instructions", "מעבד (CPU)", "החלק שמבצע את ההוראות של התוכנית"],
      ["RAM", "fast working memory that is cleared when the power goes off", "זיכרון RAM", "זיכרון עבודה מהיר שנמחק כשהחשמל נכבה"],
      ["Storage", "a drive (SSD or hard disk) that keeps files even when the power is off", "אחסון", "כונן (SSD או דיסק קשיח) ששומר קבצים גם כשהחשמל כבוי"],
      ["Operating system", "the main software that runs the computer and other programs, like Windows or Android", "מערכת הפעלה", "התוכנה הראשית שמפעילה את המחשב ואת שאר התוכניות, כמו Windows או Android"],
    ],
    q: [
      [["You are writing a story and the power goes off before you save. Where was the unsaved work?", "In RAM, so it is lost", ["On the hard drive, so it is safe", "In the printer", "In the keyboard"], "Unsaved work lives in RAM, which loses its contents without power."],
        ["אתם כותבים סיפור והחשמל נופל לפני ששמרתם. איפה הייתה העבודה שלא נשמרה?", "ב־RAM, ולכן היא אבדה", ["בכונן הקשיח, ולכן היא בטוחה", "במדפסת", "במקלדת"], "עבודה שלא נשמרה נמצאת ב־RAM, שמאבד את תוכנו בלי חשמל."]],
      [["Which part is often called the 'brain' of the computer?", "The CPU", ["The screen", "The mouse", "The case"], "The CPU processes the instructions of every program."],
        ["איזה חלק נקרא לעיתים קרובות ״המוח״ של המחשב?", "המעבד", ["המסך", "העכבר", "המארז"], "המעבד מעבד את ההוראות של כל תוכנית."]],
    ],
  },
  a: {
    t: [
      ["Clock speed", "how many basic cycles a processor runs per second, measured in GHz", "מהירות שעון", "כמה מחזורים בסיסיים מעבד מבצע בשנייה, נמדד בג׳יגה־הרץ"],
      ["Multi-core processor", "a processor with several cores that can work on tasks at the same time", "מעבד מרובה ליבות", "מעבד עם כמה ליבות שיכולות לעבוד על משימות במקביל"],
      ["GPU", "a processor built to handle graphics and many similar calculations in parallel", "מעבד גרפי (GPU)", "מעבד שנבנה לטפל בגרפיקה ובחישובים רבים דומים במקביל"],
      ["Cache", "a very small, very fast memory close to the processor for data used often", "זיכרון מטמון", "זיכרון קטן ומהיר מאוד ליד המעבד, לנתונים שמשתמשים בהם לעיתים קרובות"],
    ],
    q: [
      [["Why does a computer with more RAM often feel faster with many programs open?", "It can keep more programs in fast memory instead of swapping to slow storage", ["RAM makes the screen brighter", "RAM speeds up the internet", "RAM replaces the CPU"], "When RAM runs out, data is moved to much slower storage, which slows everything down."],
        ["למה מחשב עם יותר RAM מרגיש לעיתים קרובות מהיר יותר כשפתוחות תוכניות רבות?", "הוא יכול להחזיק יותר תוכניות בזיכרון המהיר במקום להעביר אותן לאחסון האיטי", ["RAM מבהיר את המסך", "RAM מאיץ את האינטרנט", "RAM מחליף את המעבד"], "כשה־RAM נגמר, נתונים מועברים לאחסון איטי הרבה יותר, וכל המערכת מאטה."]],
      [["Why are GPUs used to train AI models?", "They do huge numbers of similar calculations in parallel", ["They have bigger screens", "They use no electricity", "They store more files"], "Neural networks need many matrix multiplications, which GPUs run side by side."],
        ["למה משתמשים במעבדים גרפיים לאימון מודלים של בינה מלאכותית?", "הם מבצעים כמויות עצומות של חישובים דומים במקביל", ["יש להם מסכים גדולים יותר", "הם לא צורכים חשמל", "הם שומרים יותר קבצים"], "רשתות נוירונים דורשות כפלי מטריצות רבים, ומעבדים גרפיים מריצים אותם זה לצד זה."]],
    ],
  },
};
export default c;
