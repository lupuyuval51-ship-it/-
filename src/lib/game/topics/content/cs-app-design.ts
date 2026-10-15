import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["App", "a program made for a phone, tablet or computer to help people do one kind of thing, like chat or play", "אפליקציה", "תוכנה שנבנתה לטלפון, לטאבלט או למחשב כדי לעזור לאנשים לעשות סוג מסוים של דברים, כמו לשוחח או לשחק"],
      ["User", "a person who opens a program or a website to do something", "משתמש", "אדם שפותח תוכנה או אתר כדי לעשות משהו"],
      ["Button", "a part of the screen that you tap or click to make something happen", "כפתור", "חלק במסך שנוגעים בו או לוחצים עליו כדי שמשהו יקרה"],
      ["Icon", "a small picture that stands for an action or a program, such as a house for the main page", "סמל", "תמונה קטנה שמייצגת פעולה או תוכנה, כמו בית שמסמן את הדף הראשי"],
    ],
    q: [
      [["You tap a small house icon in an app. Where does it usually take you?", "To the home screen, the main page", ["To the settings page", "To a list of your friends", "To the page that deletes the app"], "A house icon almost always means “home”. Icons are small pictures that people can understand without reading."],
        ["אתם נוגעים בסמל של בית קטן באפליקציה. לאן הוא בדרך כלל מוביל?", "למסך הבית, הדף הראשי", ["לדף ההגדרות", "לרשימת החברים שלכם", "לדף שמוחק את האפליקציה"], "סמל של בית כמעט תמיד אומר ״בית״. סמלים הם תמונות קטנות שאפשר להבין בלי לקרוא."]],
      [["Why are buttons on a phone screen made big enough for a fingertip?", "So people can tap them easily without pressing something else by mistake", ["So the app uses less battery", "So the screen looks more crowded", "Because small buttons are forbidden by law"], "A finger is much wider than a mouse pointer, so tiny buttons are hard to hit and cause mistakes."],
        ["למה כפתורים על מסך טלפון נעשים גדולים מספיק לקצה אצבע?", "כדי שאפשר יהיה ללחוץ עליהם בקלות בלי ללחוץ בטעות על משהו אחר", ["כדי שהאפליקציה תצרוך פחות סוללה", "כדי שהמסך ייראה עמוס יותר", "כי חוק אוסר על כפתורים קטנים"], "אצבע רחבה בהרבה ממצביע העכבר, ולכן קשה לפגוע בכפתורים זעירים וקל לטעות."]],
      [["Designers are making a reading app for 7-year-olds. Which design is best?", "Big buttons, short simple words and clear pictures", ["Tiny text with long, complicated sentences", "Flashing ads on every screen", "Hidden buttons that appear only if you guess where they are"], "Good design starts with the people who will use it. Young children need things that are easy to see, read and tap."],
        ["מעצבים בונים אפליקציית קריאה לילדים בני 7. איזה עיצוב הכי מתאים?", "כפתורים גדולים, מילים קצרות ופשוטות ותמונות ברורות", ["טקסט זעיר עם משפטים ארוכים ומסובכים", "פרסומות מהבהבות בכל מסך", "כפתורים נסתרים שמופיעים רק אם מנחשים איפה הם"], "עיצוב טוב מתחיל באנשים שישתמשו בו. ילדים צעירים צריכים דברים שקל לראות, לקרוא וללחוץ עליהם."]],
    ],
    s: [[["Making an app, in order", "Find out what the people who will use it need", "Sketch the screens on paper", "Build a simple first version", "Let real people try it", "Improve the app using what you learned"],
      ["בניית אפליקציה, לפי הסדר", "מבררים מה צריכים האנשים שישתמשו בה", "משרטטים את המסכים על נייר", "בונים גרסה ראשונה ופשוטה", "נותנים לאנשים אמיתיים לנסות אותה", "משפרים את האפליקציה לפי מה שלמדנו"]]],
  },
  i: {
    t: [
      ["Layout", "the way text, pictures and buttons are arranged on a screen", "פריסה", "האופן שבו טקסט, תמונות וכפתורים מסודרים על המסך"],
      ["Menu", "a list of choices from which the user picks what to do or where to go", "תפריט", "רשימת אפשרויות שממנה המשתמש בוחר מה לעשות או לאן לעבור"],
      ["Feedback", "a sign from an app that an action worked or failed, such as a sound, a tick or a message", "משוב", "סימן מהאפליקציה שפעולה הצליחה או נכשלה, כמו צליל, סימן וי או הודעה"],
      ["Prototype", "an early, simple version of an app, used to test ideas before building it fully", "אב טיפוס", "גרסה מוקדמת ופשוטה של אפליקציה, שבודקים בה רעיונות לפני שבונים אותה עד הסוף"],
    ],
    q: [
      [["After you press “Send” in a chat app, a small tick appears next to your message. Why does the app show it?", "To let you know that the message was sent", ["To make the message longer", "To delete the message", "To change the app's language"], "This is feedback: a quick sign that an action worked. Without it, people press the button again and again, not sure whether anything happened."],
        ["אחרי שלוחצים על ״שליחה״ באפליקציית צ׳אט, מופיע סימן וי קטן ליד ההודעה. למה האפליקציה מציגה אותו?", "כדי להודיע לכם שההודעה נשלחה", ["כדי להאריך את ההודעה", "כדי למחוק את ההודעה", "כדי לשנות את שפת האפליקציה"], "זה משוב: סימן מהיר שהפעולה הצליחה. בלעדיו אנשים לוחצים על הכפתור שוב ושוב, כי הם לא בטוחים שמשהו קרה."]],
      [["Which text is easiest to read on a phone screen?", "Dark text on a light background, in a clear size", ["Light grey text on a white background", "Tiny text in a curly, decorative font", "Red text on a bright green background"], "Text is easiest to read when it stands out strongly from its background, which is called contrast, and when the letters are big and simple."],
        ["איזה טקסט הכי קל לקרוא על מסך טלפון?", "טקסט כהה על רקע בהיר, בגודל ברור", ["טקסט אפור בהיר על רקע לבן", "טקסט זעיר בגופן מסולסל ומקושט", "טקסט אדום על רקע ירוק בוהק"], "הכי קל לקרוא טקסט שבולט מאוד על הרקע שלו, מה שנקרא ניגודיות, וכשהאותיות גדולות ופשוטות."]],
      [["In an app, the “Back” button sits in a different corner on every screen. What is the problem?", "Users get confused, because it is never where they expect it", ["The app will run more slowly", "The app will take up more storage", "There is no problem, because users enjoy searching"], "Good design is consistent: the same thing looks the same and stays in the same place, so people learn it once and then use it without thinking."],
        ["באפליקציה מסוימת כפתור ״חזרה״ נמצא בפינה אחרת בכל מסך. מה הבעיה?", "המשתמשים מתבלבלים, כי הכפתור אף פעם לא נמצא איפה שהם מצפים", ["האפליקציה תפעל לאט יותר", "האפליקציה תתפוס יותר מקום בזיכרון", "אין בעיה, כי משתמשים נהנים לחפש"], "עיצוב טוב הוא עקבי: אותו דבר נראה אותו דבר ונשאר באותו מקום, וכך לומדים אותו פעם אחת ומשתמשים בו בלי לחשוב."]],
      [["In a test, five out of six children cannot find the “Start” button. What should the designers do?", "Change the design so the button is easier to find", ["Tell the children that they used the app wrongly", "Make the button smaller so it fits in better", "Keep testing only with the one child who found it"], "When most testers struggle, the problem is the design, not the people. Testing shows designers what to fix."],
        ["בבדיקה, חמישה מתוך שישה ילדים לא מוצאים את כפתור ״התחל״. מה המעצבים צריכים לעשות?", "לשנות את העיצוב כך שיהיה קל יותר למצוא את הכפתור", ["להגיד לילדים שהם השתמשו באפליקציה לא נכון", "להקטין את הכפתור כדי שישתלב טוב יותר", "להמשיך לבדוק רק עם הילד היחיד שמצא אותו"], "כשרוב הבודקים מתקשים, הבעיה היא בעיצוב ולא באנשים. הבדיקה מראה למעצבים מה צריך לתקן."]],
      [["Which error message helps the user most?", "“The password needs at least 8 characters. Please add more.”", ["“Something went wrong.”", "“Wrong!”", "“Error 4021.”"], "A helpful message says what went wrong and how to fix it, in plain words. A code number means nothing to most users."],
        ["איזו הודעת שגיאה עוזרת למשתמש הכי הרבה?", "״הסיסמה צריכה לכלול לפחות 8 תווים. הוסיפו עוד.״", ["״משהו השתבש.״", "״טעות!״", "״שגיאה 4021.״"], "הודעה מועילה אומרת מה השתבש ואיך לתקן את זה, במילים פשוטות. מספר קוד לא אומר כלום לרוב המשתמשים."]],
    ],
    n: [[75, ["A designer tests an app with 20 people, and 15 of them finish the task without help. What percentage finished without help?", "%", "15 ÷ 20 = 0.75, which is 75%."],
      ["מעצבת בודקת אפליקציה עם 20 אנשים, ו־15 מהם מסיימים את המשימה בלי עזרה. כמה אחוזים סיימו בלי עזרה?", "%", "15 ÷ 20 = 0.75, כלומר 75%."]]],
    s: [[["Testing an app with users, in order", "Decide what you want to find out", "Choose testers who are like the real users", "Give them a task and watch without helping", "Write down where they get stuck", "Fix the problems and test again"],
      ["בדיקת אפליקציה עם משתמשים, לפי הסדר", "מחליטים מה רוצים לגלות", "בוחרים בודקים שדומים למשתמשים האמיתיים", "נותנים להם משימה וצופים בלי לעזור", "רושמים איפה הם נתקעים", "מתקנים את הבעיות ובודקים שוב"]]],
  },
  a: {
    t: [
      ["Accessibility", "designing a product so that people with disabilities, such as poor sight or hearing, can use it too", "נגישות", "תכנון מוצר כך שגם אנשים עם מוגבלויות, כמו ראייה או שמיעה חלשות, יוכלו להשתמש בו"],
      ["Screen reader", "a program that reads aloud what is on the screen, for people who are blind or cannot see well", "קורא מסך", "תוכנה שמקריאה בקול את מה שמופיע על המסך, בשביל אנשים עיוורים או לקויי ראייה"],
      ["Alt text", "a short written description of a picture that a screen reader can read aloud", "טקסט חלופי", "תיאור כתוב קצר של תמונה, שקורא מסך יכול להקריא בקול"],
      ["Wireframe", "a simple plan of a screen drawn with boxes and lines, without colours or real pictures", "וויירפריים", "תוכנית פשוטה של מסך שמשורטטת בתיבות ובקווים, בלי צבעים ובלי תמונות אמיתיות"],
    ],
    q: [
      [["An app shows a wrong answer only by turning a box red, and a right answer only by turning it green. Who may have trouble using it?", "People with colour blindness, who may not tell red from green", ["People who use the app on a big tablet", "People who type very quickly", "People who use the app in the morning"], "Red-green colour blindness is common, especially among boys and men. Adding an icon or a word as well, such as a tick or “Correct”, lets everyone understand."],
        ["אפליקציה מסמנת תשובה שגויה רק בכך שתיבה הופכת לאדומה, ותשובה נכונה רק בכך שהיא הופכת לירוקה. למי זה עלול להפריע?", "לאנשים עם עיוורון צבעים, שעלולים לא להבחין בין אדום לירוק", ["לאנשים שמשתמשים באפליקציה בטאבלט גדול", "לאנשים שמקלידים מהר מאוד", "לאנשים שמשתמשים באפליקציה בבוקר"], "עיוורון צבעים לאדום ולירוק נפוץ, במיוחד אצל בנים וגברים. כשמוסיפים גם סמל או מילה, כמו וי או ״נכון״, כולם יכולים להבין."]],
      [["Why should every important picture in an app have alt text?", "So that a screen reader can describe it to people who cannot see it", ["So that the picture loads in brighter colours", "So that nobody can copy the picture", "So that the picture becomes bigger"], "A screen reader cannot see pictures; it can only read text. Alt text such as “A girl holding a red kite” tells blind users what the picture shows."],
        ["למה כל תמונה חשובה באפליקציה צריכה טקסט חלופי?", "כדי שקורא מסך יוכל לתאר אותה לאנשים שלא יכולים לראות אותה", ["כדי שהתמונה תיטען בצבעים בהירים יותר", "כדי שאף אחד לא יוכל להעתיק את התמונה", "כדי שהתמונה תגדל"], "קורא מסך לא רואה תמונות, הוא יכול לקרוא רק טקסט. טקסט חלופי כמו ״ילדה מחזיקה עפיפון אדום״ מספר למשתמשים עיוורים מה רואים בתמונה."]],
      [["A game makes the “Buy” button huge and bright, but hides the “No thanks” choice in tiny grey text. What is this kind of design called?", "A dark pattern: a design that tricks users into choices they did not mean to make", ["Accessibility: a design that helps everyone use the app", "A wireframe: an early plan of the screen", "Feedback: a sign that an action worked"], "Dark patterns push people, often into spending money or sharing data. Honest design makes every choice just as easy to find."],
        ["משחק מציג כפתור ״קנה״ ענק ובוהק, אבל מסתיר את האפשרות ״לא, תודה״ בטקסט אפור זעיר. איך קוראים לעיצוב כזה?", "דפוס אפל: עיצוב שמרמה משתמשים כדי שיבחרו במשהו שלא התכוונו אליו", ["נגישות: עיצוב שעוזר לכולם להשתמש באפליקציה", "וויירפריים: תוכנית מוקדמת של המסך", "משוב: סימן שפעולה הצליחה"], "דפוסים אפלים דוחפים אנשים, לרוב לבזבז כסף או למסור מידע. עיצוב הוגן מאפשר למצוא כל בחירה באותה קלות."]],
      [["Why do designers often start with a wireframe before choosing colours and pictures?", "It is quick to change, so the layout can be fixed before the detailed work", ["Users prefer apps with no colours at all", "The wireframe is the final app that users download", "Phones choose an app's colours by themselves"], "Moving a box in a simple sketch takes seconds. Fixing the layout after everything has been coloured and built takes much longer."],
        ["למה מעצבים מתחילים לעיתים קרובות בוויירפריים, לפני שהם בוחרים צבעים ותמונות?", "קל ומהיר לשנות אותו, וכך אפשר לתקן את הפריסה לפני העבודה המפורטת", ["משתמשים מעדיפים אפליקציות בלי צבעים בכלל", "הוויירפריים הוא האפליקציה הסופית שמורידים", "הטלפון בוחר בעצמו את הצבעים של האפליקציה"], "להזיז תיבה בשרטוט פשוט לוקח שניות. לתקן את הפריסה אחרי שהכול כבר צבוע ובנוי לוקח הרבה יותר זמן."]],
      [["A designer shows half the users a green “Start” button and the other half a blue one, then compares how many people tap it. What is this method called?", "An A/B test", ["A screen reader", "A dark pattern", "Alt text"], "In an A/B test, two versions are compared with real users, and the numbers show which version works better."],
        ["מעצב מציג לחצי מהמשתמשים כפתור ״התחל״ ירוק ולחצי השני כפתור כחול, ואז משווה כמה אנשים לחצו עליו. איך נקראת השיטה הזאת?", "מבחן A/B", ["קורא מסך", "דפוס אפל", "טקסט חלופי"], "במבחן A/B משווים שתי גרסאות בעזרת משתמשים אמיתיים, והמספרים מראים איזו גרסה עובדת טוב יותר."]],
    ],
    n: [[40, ["With the old design a task took users 50 seconds; with the new design it takes 30 seconds. By what percentage did the time go down?", "%", "(50 − 30) ÷ 50 = 20 ÷ 50 = 0.4, which is 40%."],
      ["בעיצוב הישן משימה לקחה למשתמשים 50 שניות, ובעיצוב החדש היא לוקחת 30 שניות. בכמה אחוזים ירד הזמן?", "%", "(50 − 30) ÷ 50 = 20 ÷ 50 = 0.4, כלומר 40%."]]],
  },
};
export default c;
