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
      [["Which of these is software?", "A web browser", ["The hard drive inside a laptop", "A keyboard", "A cable"], "A browser is a program, a set of instructions that you install and run. A hard drive, a keyboard and a cable are physical parts that you can touch."],
        ["מה מהבאים הוא תוכנה?", "דפדפן אינטרנט", ["הכונן הקשיח שבתוך מחשב נייד", "מקלדת", "כבל"], "דפדפן הוא תוכנית, אוסף של הוראות שמתקינים ומריצים. כונן קשיח, מקלדת וכבל הם חלקים פיזיים שאפשר לגעת בהם."]],
      [["Which of these devices lets you hear music from a computer?", "Headphones", ["A microphone", "A webcam", "A keyboard"], "Headphones and speakers are output devices: they turn the computer's signals into sound. A microphone does the opposite: it is an input device that brings sound into the computer."],
        ["איזה מההתקנים האלה מאפשר לשמוע מוזיקה מהמחשב?", "אוזניות", ["מיקרופון", "מצלמת רשת", "מקלדת"], "אוזניות ורמקולים הם התקני פלט: הם הופכים את האותות של המחשב לצליל. מיקרופון עושה את ההפך: הוא התקן קלט שמכניס צלילים למחשב."]],
      [["What kind of device is the touch screen of a phone?", "Both an input and an output device", ["Only an output device, like a TV screen", "Only an input device, like a keyboard", "Software that runs on the phone"], "A touch screen shows pictures and text, which is output, and it also senses where your finger touches it, which is input. So it is both at the same time."],
        ["איזה סוג של התקן הוא מסך המגע של טלפון?", "גם התקן קלט וגם התקן פלט", ["רק התקן פלט, כמו מסך טלוויזיה", "רק התקן קלט, כמו מקלדת", "תוכנה שרצה בטלפון"], "מסך מגע מציג תמונות וטקסט, וזה פלט, והוא גם מרגיש איפה האצבע נוגעת בו, וזה קלט. לכן הוא גם וגם באותו זמן."]],
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
      [["You are writing a story and the power goes off before you save. Where was the unsaved work?", "In RAM, so it is lost", ["On the hard drive, so it is safe", "In the printer", "In the keyboard"], "Unsaved work lives only in RAM, which loses its contents without power. Saving copies it to storage, which keeps files when the power is off."],
        ["אתם כותבים סיפור והחשמל נופל לפני ששמרתם. איפה הייתה העבודה שלא נשמרה?", "ב־RAM, ולכן היא אבדה", ["בכונן הקשיח, ולכן היא בטוחה", "במדפסת", "במקלדת"], "עבודה שלא נשמרה נמצאת רק ב־RAM, שמאבד את תוכנו בלי חשמל. שמירה מעתיקה אותה לאחסון, ששומר קבצים גם כשהחשמל כבוי."]],
      [["Which part is often called the 'brain' of the computer?", "The CPU", ["The screen", "The mouse", "The case"], "The CPU carries out the instructions of every program, billions of simple steps each second. The case is only the box that the parts sit in."],
        ["איזה חלק נקרא לעיתים קרובות ״המוח״ של המחשב?", "המעבד", ["המסך", "העכבר", "המארז"], "המעבד מבצע את ההוראות של כל תוכנית, מיליארדי צעדים פשוטים בכל שנייה. המארז הוא רק הקופסה שבתוכה יושבים החלקים."]],
      [["You want a photo to stay safe after the computer is switched off. Where must it be saved?", "On a storage drive, such as an SSD", ["In RAM, the fast working memory", "In the CPU, which runs the programs", "On the screen, where you can see it"], "Only storage keeps files when the power is off. RAM is cleared when the computer shuts down, and the CPU only works on data; it does not keep your files."],
        ["אתם רוצים שתמונה תישאר שמורה גם אחרי שהמחשב נכבה. איפה צריך לשמור אותה?", "בכונן אחסון, כמו SSD", ["ב־RAM, זיכרון העבודה המהיר", "במעבד, שמריץ את התוכניות", "על המסך, שבו רואים אותה"], "רק אחסון שומר קבצים כשהחשמל כבוי. ה־RAM נמחק כשהמחשב נכבה, והמעבד רק עובד על נתונים ולא שומר את הקבצים שלכם."]],
      [["Which of these is an operating system?", "iOS", ["Google Chrome", "Microsoft Word", "WhatsApp"], "iOS is the operating system of the iPhone: it starts the phone, manages its memory and runs every other app. Chrome, Word and WhatsApp are programs that run on top of an operating system."],
        ["מה מהבאים הוא מערכת הפעלה?", "iOS", ["גוגל כרום", "מיקרוסופט וורד", "וואטסאפ"], "iOS היא מערכת ההפעלה של האייפון: היא מפעילה את הטלפון, מנהלת את הזיכרון שלו ומריצה את כל שאר האפליקציות. כרום, וורד ווואטסאפ הן תוכנות שרצות על גבי מערכת הפעלה."]],
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
      [["Why does a computer with more RAM often feel faster with many programs open?", "More programs fit in fast memory, so less is moved to slow storage", ["Extra RAM raises the processor's clock speed, so each instruction runs faster", "Extra RAM speeds up the internet connection of every open program", "RAM takes over part of the CPU's work when it is busy"], "When RAM is full, the computer moves data it is not using to storage, which is much slower, and fetching it back makes everything wait. More RAM does not change the clock speed; it means less of this moving."],
        ["למה מחשב עם יותר RAM מרגיש לעיתים קרובות מהיר יותר כשפתוחות תוכניות רבות?", "יותר תוכניות נכנסות לזיכרון המהיר, ולכן פחות מועבר לאחסון האיטי", ["תוספת RAM מעלה את מהירות השעון של המעבד, ולכן כל הוראה רצה מהר יותר", "תוספת RAM מאיצה את חיבור האינטרנט של כל תוכנית פתוחה", "ה־RAM לוקח על עצמו חלק מהעבודה של המעבד כשהוא עמוס"], "כשה־RAM מלא, המחשב מעביר נתונים שלא משתמשים בהם לאחסון, שאיטי הרבה יותר, וכשצריך להחזיר אותם הכול מחכה. יותר RAM לא משנה את מהירות השעון; הוא פשוט מקטין את ההעברות האלה."]],
      [["Why are GPUs used to train AI models?", "They do huge numbers of similar calculations in parallel", ["Each GPU core is much faster than a CPU core", "They can store far more files than a hard drive can hold", "They use no electricity while they calculate"], "Training a neural network means multiplying huge tables of numbers (matrices). A GPU has thousands of simple cores, each slower than a CPU core, that work on these sums side by side."],
        ["למה משתמשים במעבדים גרפיים לאימון מודלים של בינה מלאכותית?", "הם מבצעים כמויות עצומות של חישובים דומים במקביל", ["כל ליבה של מעבד גרפי מהירה הרבה יותר מליבה של מעבד רגיל", "הם שומרים הרבה יותר קבצים ממה שנכנס בכונן קשיח", "הם לא צורכים חשמל בזמן שהם מחשבים"], "אימון של רשת נוירונים פירושו כפל של טבלאות ענקיות של מספרים (מטריצות). במעבד גרפי יש אלפי ליבות פשוטות, כל אחת איטית יותר מליבה של מעבד רגיל, והן עובדות על החישובים האלה זו לצד זו."]],
      [["Why does a processor keep a small cache right next to its cores?", "The cache is much quicker to reach than RAM", ["The cache is bigger than RAM, so more data fits in it", "The cache keeps data safe when the power goes off", "Without a cache the processor cannot add numbers"], "RAM is fast, but a processor doing billions of steps a second would waste time waiting for it. Data used often is kept in the small cache beside the cores, which answers many times faster. Like RAM, the cache is emptied when the power goes off."],
        ["למה מעבד מחזיק זיכרון מטמון קטן ממש ליד הליבות שלו?", "הרבה יותר מהר להגיע לזיכרון המטמון מאשר ל־RAM", ["זיכרון המטמון גדול מה־RAM, ולכן נכנסים בו יותר נתונים", "זיכרון המטמון שומר נתונים גם כשהחשמל נכבה", "בלי זיכרון מטמון המעבד לא יכול לחבר מספרים"], "ה־RAM מהיר, אבל מעבד שמבצע מיליארדי צעדים בשנייה היה מבזבז זמן בהמתנה לו. נתונים שמשתמשים בהם לעיתים קרובות נשמרים בזיכרון המטמון הקטן שליד הליבות, והוא עונה מהר פי כמה וכמה. כמו ה־RAM, גם זיכרון המטמון מתרוקן כשהחשמל נכבה."]],
    ],
    n: [
      [2, ["A job that can be split into equal parts takes 8 seconds on one core. In the best case, how many seconds does it take on 4 cores?", "seconds", "8 ÷ 4 = 2 seconds, if the work splits perfectly into four equal parts that run at the same time. In real programs some steps must wait for others, so the speed-up is usually smaller."],
        ["משימה שאפשר לחלק לחלקים שווים לוקחת 8 שניות על ליבה אחת. במקרה הטוב ביותר, כמה שניות היא תיקח על 4 ליבות?", "שניות", "8 ÷ 4 = 2 שניות, אם העבודה מתחלקת בדיוק לארבעה חלקים שווים שרצים באותו זמן. בתוכניות אמיתיות חלק מהצעדים חייבים לחכות לאחרים, ולכן השיפור בדרך כלל קטן יותר."]],
    ],
  },
};
export default c;
