import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Event", "something that happens while a program runs, such as a click or a key press", "אירוע", "משהו שקורה בזמן שתוכנית רצה, כמו לחיצה או הקשה על מקש"],
      ["Event handler", "the piece of code that runs when one particular thing happens, for example a click", "מטפל אירוע", "קטע הקוד שרץ כשדבר מסוים אחד קורה, למשל לחיצה"],
      ["Timer", "a tool that runs code after a set time, or again and again at a steady pace", "קוצב זמן", "כלי שמריץ קוד אחרי זמן שנקבע מראש, או שוב ושוב בקצב קבוע"],
    ],
    q: [
      [["Which of these is an event?", "The player presses the space bar", ["A variable that stores the score", "A list of five colours", "The name of a function"], "An event is something that happens while the program runs. A key press is one; a variable, a list and a name are just things in the code."],
        ["איזה מאלה הוא אירוע?", "השחקן לוחץ על מקש הרווח", ["משתנה ששומר את מספר הנקודות", "רשימה של חמישה צבעים", "השם של פונקציה"], "אירוע הוא משהו שקורה בזמן שהתוכנית רצה. הקשה על מקש היא אירוע; משתנה, רשימה ושם הם רק דברים שנמצאים בקוד."]],
      [["In Scratch, which of these blocks is an event block?", "when this sprite clicked", ["change color effect by 25", "move 10 steps", "repeat 10"], "Event blocks like this one, called hat blocks, have a rounded top and wait for something to happen, such as a click on the sprite. The others are looks, motion and control blocks."],
        ["בסקראץ׳, איזו מהלבנים האלה היא לבנת אירוע?", "״כאשר לוחצים על דמות זו״", ["״שנה אפקט צבע ב־25״", "״זוז 10 צעדים״", "״חזור 10 פעמים״"], "ללבני אירוע כמו זו, שנקראות לבני כובע, יש חלק עליון מעוגל, והן מחכות שמשהו יקרה, כמו לחיצה על הדמות. השאר הן לבני מראה, תנועה ובקרה."]],
      [["What does an event-driven program spend most of its time doing?", "Waiting for something to happen, then reacting", ["Running every line once from top to bottom, then stopping", "Restarting itself from the first line again and again", "Asking the user the same question over and over"], "Programs like games and apps wait for events such as clicks and key presses, and run the matching code each time one arrives."],
        ["במה עוסקת תוכנית מונחית אירועים רוב הזמן?", "מחכה שמשהו יקרה, ואז מגיבה", ["מריצה כל שורה פעם אחת מלמעלה למטה, ואז נעצרת", "מתחילה את עצמה מחדש מהשורה הראשונה שוב ושוב", "שואלת את המשתמש את אותה שאלה שוב ושוב"], "תוכניות כמו משחקים ואפליקציות מחכות לאירועים כמו לחיצות והקשות, ומריצות את הקוד המתאים בכל פעם שאחד מהם מגיע."]],
      [["A one-time timer is set to 3 seconds. When does its code run?", "Once, about 3 seconds after the timer is set", ["Every 3 seconds, again and again, forever", "Straight away, three times in a row, very quickly", "Only when the player clicks the mouse"], "A one-time timer, also called a timeout, waits for its delay and then runs its code a single time. A repeating timer is a different kind."],
        ["קוצב זמן חד־פעמי מכוון ל־3 שניות. מתי רץ הקוד שלו?", "פעם אחת, בערך 3 שניות אחרי שכיוונו אותו", ["כל 3 שניות, שוב ושוב, בלי סוף", "מיד, שלוש פעמים ברצף ומהר מאוד", "רק כשהשחקן לוחץ על העכבר"], "קוצב זמן חד־פעמי מחכה עד שעובר הזמן שנקבע לו, ואז מריץ את הקוד שלו פעם אחת בלבד. קוצב זמן שחוזר על עצמו הוא סוג אחר."]],
      [["In a game, the message  You win!  appears only after the player clicks the gold coin. What starts that code?", "The click event on the coin", ["The game starting up", "The computer's clock reaching midnight", "Typing the code in a second time"], "The code is a handler for the coin's click event, so it waits and runs only when that click happens."],
        ["במשחק, ההודעה ״ניצחתם!״ מופיעה רק אחרי שהשחקן לוחץ על מטבע הזהב. מה מפעיל את הקוד הזה?", "אירוע הלחיצה על המטבע", ["העלייה של המשחק בהתחלה", "השעון של המחשב כשהוא מגיע לחצות", "הקלדה של הקוד בפעם השנייה"], "הקוד הוא מטפל של אירוע הלחיצה על המטבע, ולכן הוא מחכה ורץ רק כשהלחיצה הזאת קורית."]],
    ],
    n: [
      [2, ["A timer waits 2000 milliseconds. How many seconds is that?", "seconds", "1000 milliseconds make 1 second, so 2000 milliseconds are 2 seconds."],
        ["קוצב זמן מחכה 2000 אלפיות שנייה. כמה שניות זה?", "שניות", "1000 אלפיות שנייה הן שנייה אחת, ולכן 2000 אלפיות שנייה הן 2 שניות."]],
    ],
    s: [
      [["What happens when you click a button on a web page", "You press and release the mouse over the button", "The browser notices a click event on that button", "The click handler of the button runs", "The page changes, for example a message appears"],
        ["מה קורה כשלוחצים על כפתור בדף אינטרנט", "לוחצים על העכבר מעל הכפתור ומשחררים", "הדפדפן מזהה אירוע לחיצה על הכפתור הזה", "המטפל של הלחיצה על הכפתור רץ", "הדף משתנה, למשל מופיעה הודעה"]],
    ],
  },
  i: {
    t: [
      ["Event listener", "code set up to watch one element for one kind of event and call a function each time it happens", "מאזין לאירוע", "קוד שמוגדר לעקוב אחרי רכיב אחד וסוג אחד של אירוע, ולהפעיל פונקציה בכל פעם שהוא קורה"],
      ["Callback", "a function handed to other code so that it can be called later", "פונקציית קריאה חוזרת (callback)", "פונקציה שמעבירים לקוד אחר כדי שיפעיל אותה מאוחר יותר"],
      ["Polling", "checking again and again whether something has happened, instead of waiting to be told", "תשאול חוזר (polling)", "בדיקה שוב ושוב אם משהו קרה, במקום לחכות שיודיעו על כך"],
    ],
    q: [
      [['In JavaScript,  button.addEventListener("click", sayHi);  runs once. When does sayHi run?', "Each time the button is clicked", ["Once, straight away, when this line runs", "Only the first time the button is clicked", "Every second, whether anyone clicks or not"], "addEventListener does not call sayHi itself; it tells the button to call sayHi on every click from now on."],
        ['ב־JavaScript השורה  button.addEventListener("click", sayHi);  רצה פעם אחת. מתי תרוץ sayHi?', "בכל פעם שלוחצים על הכפתור", ["פעם אחת, מיד כשהשורה הזאת רצה", "רק בפעם הראשונה שלוחצים על הכפתור", "כל שנייה, בין אם לוחצים ובין אם לא"], "addEventListener לא מפעילה את sayHi בעצמה; היא אומרת לכפתור להפעיל את sayHi בכל לחיצה, מעכשיו והלאה."]],
      [["What is the difference between  setTimeout  and  setInterval  in JavaScript?", "setTimeout runs once after a delay; setInterval keeps repeating", ["setTimeout keeps repeating; setInterval runs once after a delay", "setTimeout counts in seconds; setInterval counts in minutes", "None: they are two names for exactly the same thing"], "Both take a delay in milliseconds. setTimeout calls its function a single time, while setInterval calls it again after every delay until clearInterval stops it."],
        ["מה ההבדל בין  setTimeout  לבין  setInterval  ב־JavaScript?", "setTimeout רצה פעם אחת אחרי השהיה; setInterval חוזרת שוב ושוב", ["setTimeout חוזרת שוב ושוב; setInterval רצה פעם אחת אחרי השהיה", "setTimeout סופרת בשניות; setInterval סופרת בדקות", "אין הבדל: אלה שני שמות לאותו דבר בדיוק"], "שתיהן מקבלות השהיה באלפיות שנייה. setTimeout מפעילה את הפונקציה שלה פעם אחת, ו־setInterval מפעילה אותה שוב אחרי כל השהיה, עד ש־clearInterval עוצרת אותה."]],
      [["When you press a key and let it go, which event comes first?", "keydown", ["keyup", "click", "load"], "keydown fires as soon as the key goes down, and keyup only when it is released. click is a mouse event and load is about the page."],
        ["כשלוחצים על מקש ומשחררים אותו, איזה אירוע מגיע ראשון?", "keydown", ["keyup", "click", "load"], "keydown מופעל ברגע שהמקש יורד, ו־keyup רק כשמשחררים אותו. click הוא אירוע של העכבר, ו־load קשור לטעינת הדף."]],
      [["Why does a handler get an event object, as in  function (e) { ... } ?", "It holds details such as which key was pressed", ["It is needed to switch the event off after one use", "It stores a copy of the whole page for the handler", "It tells the browser how fast to run the handler"], "The event object e carries facts about what happened, for example e.key for a key press or the mouse position for a click."],
        ["למה מטפל אירוע מקבל אובייקט אירוע, כמו בקוד  function (e) { ... } ?", "הוא מכיל פרטים כמו איזה מקש נלחץ", ["הוא נחוץ כדי לכבות את האירוע אחרי שימוש אחד", "הוא שומר עותק של הדף כולו בשביל המטפל", "הוא אומר לדפדפן באיזו מהירות להריץ את המטפל"], "אובייקט האירוע e נושא מידע על מה שקרה, למשל e.key בהקשה על מקש או את מיקום העכבר בלחיצה."]],
    ],
    n: [
      [4, ["setInterval(tick, 250)  is running. How many times does tick run each second?", "", "The delay is 250 milliseconds and a second has 1000, so tick runs 1000 ÷ 250 = 4 times."],
        ["הקוד  setInterval(tick, 250)  רץ. כמה פעמים בשנייה מופעלת tick?", "", "ההשהיה היא 250 אלפיות שנייה, ובשנייה יש 1000, ולכן tick מופעלת 1000 ÷ 250 = 4 פעמים."]],
      [1.5, ["After  setTimeout(go, 1500) , about how many seconds pass before go runs?", "seconds", "The delay is given in milliseconds, so 1500 ÷ 1000 = 1.5 seconds."],
        ["אחרי  setTimeout(go, 1500) , בערך כמה שניות עוברות עד ש־go רצה?", "שניות", "ההשהיה נתונה באלפיות שנייה, ולכן 1500 ÷ 1000 = 1.5 שניות."]],
    ],
    s: [
      [["The mouse events of one click, in order", "mousedown: the mouse button is pressed", "mouseup: the mouse button is released", "click: both happened on the same element"],
        ["אירועי העכבר של לחיצה אחת, לפי הסדר", "mousedown: לחצן העכבר נלחץ", "mouseup: לחצן העכבר משתחרר", "click: שניהם קרו על אותו רכיב"]],
    ],
  },
  a: {
    t: [
      ["Event loop", "the part of a system that takes waiting events one by one and runs their handlers", "לולאת אירועים", "החלק במערכת שלוקח את האירועים הממתינים אחד אחד ומריץ את המטפלים שלהם"],
      ["Event queue", "the waiting line where events are kept, first in first out, until they are handled", "תור אירועים", "רשימת ההמתנה שבה אירועים נשמרים, הראשון שנכנס הוא הראשון שיוצא, עד שמטפלים בהם"],
      ["Event bubbling", "an event on an inner element travelling outward to the elements that contain it", "בעבוע אירועים", "מעבר של אירוע מרכיב פנימי החוצה, אל הרכיבים שמכילים אותו"],
    ],
    q: [
      [['What does this print?  console.log("A"); setTimeout(showB, 0); console.log("C");  (showB prints B)', "A, C, B", ["A, B, C", "B, A, C", "C, B, A"], "Even with a 0 ms delay, setTimeout only queues showB. The event loop runs it after the current code finishes, so C comes before B."],
        ['מה מודפס?  console.log("A"); setTimeout(showB, 0); console.log("C");  (הפונקציה showB מדפיסה B)', "A, C, B", ["A, B, C", "B, A, C", "C, B, A"], "גם עם השהיה של 0 אלפיות שנייה, setTimeout רק מכניסה את showB לתור. לולאת האירועים מריצה אותה אחרי שהקוד הנוכחי מסתיים, ולכן C מודפס לפני B."]],
      [["A click handler runs a loop that takes 5 seconds. What happens to other clicks during those 5 seconds?", "They wait in the queue until the loop ends", ["They are handled at the same time, side by side", "They are thrown away and never handled", "They stop the loop in the middle of its work"], "JavaScript in a page runs one handler at a time. New events wait in the queue, so the page seems frozen until the long handler finishes."],
        ["מטפל לחיצה מריץ לולאה שנמשכת 5 שניות. מה קורה ללחיצות אחרות במשך 5 השניות האלה?", "הן מחכות בתור עד שהלולאה מסתיימת", ["מטפלים בהן באותו זמן, במקביל ללולאה", "הן נזרקות ואף אחד לא מטפל בהן", "הן עוצרות את הלולאה באמצע העבודה"], "בדף אינטרנט JavaScript מריצה מטפל אחד בכל פעם. אירועים חדשים מחכים בתור, ולכן הדף נראה תקוע עד שהמטפל הארוך מסתיים."]],
      [["A button sits inside a div, and both have click listeners. With normal bubbling, which runs first when you click the button?", "The button's listener, then the div's", ["The div's listener, then the button's", "Only the div's listener", "Only the button's listener"], "The event starts at the element that was clicked and then bubbles outward, so the button's listener runs before the div's."],
        ["כפתור נמצא בתוך div, ולשניהם יש מאזינים ללחיצה. בבעבוע רגיל, מה רץ קודם כשלוחצים על הכפתור?", "המאזין של הכפתור, ואחריו של ה־div", ["המאזין של ה־div, ואחריו של הכפתור", "רק המאזין של ה־div", "רק המאזין של הכפתור"], "האירוע מתחיל ברכיב שעליו לחצו, ואז מבעבע החוצה, ולכן המאזין של הכפתור רץ לפני המאזין של ה־div."]],
      [["Which method stops a click from bubbling up to the elements around it?", "stopPropagation()", ["preventDefault()", "removeEventListener()", "clearInterval()"], "stopPropagation ends the bubbling. preventDefault only cancels the browser's normal action, such as following a link, and the event still bubbles."],
        ["איזו מתודה עוצרת לחיצה מלבעבע אל הרכיבים שמסביב?", "stopPropagation()", ["preventDefault()", "removeEventListener()", "clearInterval()"], "stopPropagation עוצרת את הבעבוע. preventDefault רק מבטלת את הפעולה הרגילה של הדפדפן, כמו מעבר בקישור, והאירוע עדיין מבעבע."]],
      [["A search box waits until the user has stopped typing for 300 ms before it searches. Why?", "To avoid starting a new search on every single key press", ["A computer cannot read keys faster than once every 300 ms", "keydown events always arrive 300 ms late", "To make the user type more slowly"], "This trick, called debouncing, waits for a pause, so one search runs after the user finishes instead of one search for every letter."],
        ["תיבת חיפוש מחכה שהמשתמש יפסיק להקליד למשך 300 אלפיות שנייה, ורק אז מחפשת. למה?", "כדי לא להתחיל חיפוש חדש בכל הקשה על מקש", ["מחשב לא יכול לקרוא מקשים מהר יותר מפעם ב־300 אלפיות שנייה", "אירועי keydown תמיד מגיעים באיחור של 300 אלפיות שנייה", "כדי לגרום למשתמש להקליד לאט יותר"], "הטריק הזה, שנקרא debouncing, מחכה להפסקה, כך שחיפוש אחד רץ כשהמשתמש מסיים, במקום חיפוש על כל אות."]],
    ],
    n: [
      [2, ['Two different functions are added with  addEventListener("click", ...)  to the same button. How many functions run on one click?', "", "Listeners do not replace each other: each one that was added is called, so one click runs 2 functions."],
        ['לאותו כפתור מוסיפים שתי פונקציות שונות בעזרת  addEventListener("click", ...) . כמה פונקציות רצות בלחיצה אחת?', "", "מאזינים לא מחליפים זה את זה: כל אחד שנוסף מופעל, ולכן לחיצה אחת מריצה 2 פונקציות."]],
      [30, ["setInterval(spawn, 2000)  adds one enemy every 2 seconds. How many enemies has it added after 1 minute?", "", "1 minute is 60 seconds, and one enemy comes every 2 seconds, so 60 ÷ 2 = 30 enemies."],
        ["הקוד  setInterval(spawn, 2000)  מוסיף אויב אחד כל 2 שניות. כמה אויבים נוספו אחרי דקה?", "", "בדקה יש 60 שניות, ואויב מגיע כל 2 שניות, ולכן נוספים 60 ÷ 2 = 30 אויבים."]],
    ],
    s: [
      [["A click arrives while a long handler is still running", "The user clicks while the long handler is still running", "The browser puts the click event in the event queue", "The long handler finishes its work", "The event loop takes the click from the queue", "The handler of the click runs"],
        ["לחיצה מגיעה כשמטפל ארוך עדיין רץ", "המשתמש לוחץ בזמן שהמטפל הארוך עדיין רץ", "הדפדפן מכניס את אירוע הלחיצה לתור האירועים", "המטפל הארוך מסיים את עבודתו", "לולאת האירועים לוקחת את הלחיצה מהתור", "המטפל של הלחיצה רץ"]],
    ],
  },
};
export default c;
