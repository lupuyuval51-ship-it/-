import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["To-do list", "a list of the tasks you need to do", "רשימת משימות", "רשימה של הדברים שצריך לעשות"],
      ["Deadline", "the last time or date by which a task must be finished", "מועד אחרון", "השעה או התאריך שעד אליהם צריך לסיים משימה"],
      ["Routine", "things you do in the same order every day, like a morning plan", "שגרה", "דברים שעושים באותו סדר בכל יום, כמו תוכנית בוקר"],
      ["Planner", "a notebook or an app where you write tasks and dates", "יומן", "מחברת או אפליקציה שבה כותבים משימות ותאריכים"],
    ],
    q: [
      [["You have homework due tomorrow and a game you want to play. What is a smart plan?", "Do the homework first, then play", ["Play first and hope there is time left", "Skip the homework", "Do both at the same time"], "Finishing what must be done first means you can enjoy the game without worrying."],
        ["יש לכם שיעורי בית להגשה מחר ומשחק שאתם רוצים לשחק. מהי תוכנית חכמה?", "קודם שיעורי הבית, ואחר כך משחקים", ["קודם משחקים ומקווים שיישאר זמן", "מוותרים על שיעורי הבית", "עושים את שניהם בבת אחת"], "כשמסיימים קודם את מה שחייבים, אפשר ליהנות מהמשחק בלי לדאוג."]],
      [["Why does writing a to-do list help?", "You do not have to keep every task in your head, and you can tick tasks off", ["It makes tasks disappear by themselves", "It means you never need to start", "Lists are only for adults"], "A written list frees your mind and shows what is done and what is left."],
        ["למה כתיבת רשימת משימות עוזרת?", "לא צריך לזכור כל משימה בראש, ואפשר לסמן משימות שהושלמו", ["היא גורמת למשימות להיעלם מעצמן", "היא אומרת שלא צריך להתחיל אף פעם", "רשימות הן רק למבוגרים"], "רשימה כתובה משחררת את הראש ומראה מה כבר נעשה ומה נשאר."]],
    ],
    n: [[45, ["You start your homework at 16:15 and finish at 17:00. How many minutes did it take?", "minutes", "From 16:15 to 17:00 is 45 minutes."], ["התחלתם להכין שיעורים ב־16:15 וסיימתם ב־17:00. כמה דקות זה לקח?", "דקות", "מ־16:15 עד 17:00 עוברות 45 דקות."]]],
  },
  i: {
    t: [
      ["Priorities", "deciding what matters most and should be done first", "סדר עדיפויות", "החלטה מה הכי חשוב ומה צריך לעשות קודם"],
      ["Procrastination", "putting off a task you should do, often by doing easier or more fun things", "דחיינות", "דחייה של משימה שצריך לעשות, לרוב בשביל דברים קלים או כיפיים יותר"],
      ["Time estimate", "a guess of how long a task will take", "הערכת זמן", "ניחוש של כמה זמן תימשך משימה"],
      ["Distraction", "something that pulls your attention away from the task", "הסחת דעת", "משהו שמושך את תשומת הלב הרחק מהמשימה"],
    ],
    q: [
      [["A project is due in 10 days. What is the best way to handle it?", "Break it into small steps and give each step a date", ["Start it the night before", "Wait until you feel like doing it", "Do all of it on the first day without breaks"], "Small steps with dates turn a big, scary task into something you can manage a bit at a time."],
        ["יש פרויקט להגשה בעוד 10 ימים. מהי הדרך הטובה ביותר להתמודד איתו?", "לפרק אותו לשלבים קטנים ולתת לכל שלב תאריך", ["להתחיל אותו בלילה שלפני", "לחכות עד שיתחשק", "לעשות את כולו ביום הראשון בלי הפסקות"], "שלבים קטנים עם תאריכים הופכים משימה גדולה ומפחידה למשהו שאפשר לנהל קצת בכל פעם."]],
      [["While you study, where is the best place for your phone?", "Out of sight, for example in another room or switched to silent in a bag", ["Next to your book with sound on", "In your hand, just in case", "On your laptop keyboard"], "Even a phone that is only in view pulls attention; keeping it away reduces distractions."],
        ["בזמן הלמידה, איפה המקום הכי טוב לטלפון?", "מחוץ לטווח הראייה, למשל בחדר אחר או על שקט בתוך תיק", ["ליד הספר עם צלצול", "ביד, ליתר ביטחון", "על המקלדת של המחשב"], "גם טלפון שרק נמצא מול העיניים מושך את תשומת הלב; כשמרחיקים אותו, יש פחות הסחות דעת."]],
    ],
    n: [[6, ["A task takes 3 hours in total. You work on it for 30 minutes a day. How many days do you need?", "days", "3 hours = 180 minutes, and 180 ÷ 30 = 6 days."], ["משימה דורשת 3 שעות בסך הכול. אתם עובדים עליה 30 דקות ביום. כמה ימים תצטרכו?", "ימים", "3 שעות = 180 דקות, ו־180 ÷ 30 = 6 ימים."]]],
    s: [[["Planning a school project", "Write down the deadline", "List all the steps", "Estimate how long each step will take", "Put the steps in your planner with dates", "Check your progress and adjust the plan"],
      ["תכנון עבודה לבית הספר", "רושמים את מועד ההגשה", "כותבים את כל השלבים", "מעריכים כמה זמן ייקח כל שלב", "מכניסים את השלבים ליומן עם תאריכים", "בודקים את ההתקדמות ומעדכנים את התוכנית"]]],
  },
  a: {
    t: [
      ["Eisenhower matrix", "a grid that sorts tasks by urgent or not and important or not", "מטריצת אייזנהאואר", "טבלה שממיינת משימות לפי דחוף או לא ולפי חשוב או לא"],
      ["Pomodoro technique", "working in short focused blocks, often 25 minutes, with short breaks between them", "שיטת פומודורו", "עבודה בפרקי זמן קצרים ומרוכזים, לרוב 25 דקות, עם הפסקות קצרות ביניהם"],
      ["Multitasking", "trying to do several tasks at once, which usually makes each one slower and less accurate", "ריבוי משימות", "ניסיון לעשות כמה דברים בבת אחת, שבדרך כלל מאט כל אחד מהם ומגדיל את הטעויות"],
      ["Planning fallacy", "the common habit of guessing that tasks will take less time than they really do", "כשל התכנון", "הנטייה הנפוצה להעריך שמשימות יימשכו פחות זמן ממה שהן נמשכות באמת"],
    ],
    q: [
      [["In the Eisenhower matrix, where does “study for a test in two weeks” belong?", "Important but not urgent: plan a time for it", ["Urgent and important: drop everything now", "Urgent but not important: hand it to someone else", "Neither: delete it"], "It matters a lot but is not due yet, so the best move is to schedule it before it becomes urgent."],
        ["במטריצת אייזנהאואר, לאן שייכת המשימה ״ללמוד למבחן שיהיה בעוד שבועיים״?", "חשוב אבל לא דחוף: קובעים לזה זמן", ["דחוף וחשוב: עוזבים הכול עכשיו", "דחוף אבל לא חשוב: מעבירים למישהו אחר", "לא זה ולא זה: מוחקים"], "זה חשוב מאוד אבל עוד לא הגיע הזמן, ולכן הצעד הטוב ביותר הוא לתכנן זמן לפני שזה הופך לדחוף."]],
      [["Why is it wise to add extra buffer time to a plan?", "Tasks often take longer than we expect", ["Buffer time makes tasks easier", "Teachers always move deadlines", "Planning is not useful anyway"], "Because of the planning fallacy we tend to underestimate; extra time protects the deadline."],
        ["למה חכם להוסיף לתוכנית זמן ביטחון?", "משימות לוקחות לעיתים קרובות יותר זמן ממה שאנחנו מצפים", ["זמן ביטחון הופך משימות לקלות יותר", "מורים תמיד דוחים מועדי הגשה", "תכנון ממילא לא מועיל"], "בגלל כשל התכנון אנחנו נוטים להעריך בחסר; זמן נוסף שומר על מועד ההגשה."]],
    ],
    n: [[115, ["Pomodoro: you work 4 blocks of 25 minutes with a 5-minute break between each block (3 breaks). How many minutes is that in total?", "minutes", "4 × 25 = 100 minutes of work plus 3 × 5 = 15 minutes of breaks: 115 minutes."], ["פומודורו: עובדים 4 פרקים של 25 דקות עם הפסקה של 5 דקות בין פרק לפרק (3 הפסקות). כמה דקות זה בסך הכול?", "דקות", "4 × 25 = 100 דקות עבודה ועוד 3 × 5 = 15 דקות הפסקה: 115 דקות."]]],
  },
};
export default c;
