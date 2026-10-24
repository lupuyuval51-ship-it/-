import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Comment", "a note in the code for people to read, which the computer skips", "הערה", "פתק בתוך הקוד שנועד לאנשים שקוראים אותו, והמחשב מדלג עליו"],
      ["Indentation", "spaces at the start of a line that show which lines sit inside a block", "הזחה", "רווחים בתחילת שורה שמראים אילו שורות נמצאות בתוך בלוק"],
      ["Readable code", "code that another person can quickly understand and safely change", "קוד קריא", "קוד שאדם אחר יכול להבין מהר ולשנות בבטחה"],
    ],
    q: [
      [["Which variable name tells you the most about what it stores?", "playerScore", ["theNumberValue", "ps", "x"], "playerScore says exactly what is stored. ps and x are too short to explain anything, and theNumberValue could be any number at all."],
        ["איזה שם משתנה אומר הכי הרבה על מה שהוא שומר?", "playerScore", ["theNumberValue", "ps", "x"], "השם playerScore אומר בדיוק מה נשמר בו. ps ו־x קצרים מכדי להסביר משהו, ו־theNumberValue יכול להיות כל מספר שהוא."]],
      [["Why do programmers write comments?", "To explain the code to the people who read it", ["To make the program run faster on old computers", "To give the computer extra commands to follow", "To hide parts of the code from other people"], "The computer skips comments completely. They are there to help people, including the writer later on, understand the code."],
        ["למה מתכנתים כותבים הערות?", "כדי להסביר את הקוד לאנשים שקוראים אותו", ["כדי שהתוכנית תרוץ מהר יותר במחשבים ישנים", "כדי לתת למחשב עוד פקודות לבצע", "כדי להסתיר חלקים מהקוד מאנשים אחרים"], "המחשב מדלג על הערות לגמרי. הן נועדו לעזור לאנשים, כולל מי שכתב את הקוד כשיחזור אליו בעתיד, להבין אותו."]],
      [["Which name is written in camelCase?", "highScore", ["best_time", "MAX_LEVEL", "player-name"], "In camelCase the words are joined with no spaces and each new word starts with a capital letter, like the humps of a camel. best_time is snake_case and MAX_LEVEL is in capitals."],
        ["איזה שם כתוב בסגנון camelCase?", "highScore", ["best_time", "MAX_LEVEL", "player-name"], "ב־camelCase המילים מחוברות בלי רווחים, וכל מילה חדשה מתחילה באות גדולה, כמו הדבשות של גמל. best_time כתוב ב־snake_case, ו־MAX_LEVEL כתוב באותיות גדולות."]],
      [["Which name is written in snake_case?", "lives_left", ["coinCount", "GameBoard", "TOTALSCORE"], "snake_case writes the words in small letters joined by underscores, so the name looks like a snake lying on the ground."],
        ["איזה שם כתוב בסגנון snake_case?", "lives_left", ["coinCount", "GameBoard", "TOTALSCORE"], "ב־snake_case כותבים את המילים באותיות קטנות ומחברים אותן בקווים תחתונים, כך שהשם נראה כמו נחש ששוכב על הקרקע."]],
      [["In Python, why must the lines inside an if be indented?", "Python uses it to know which lines belong to the if", ["Python ignores it; it only makes the code look nicer", "Indented lines are run twice to make sure they work", "Indentation turns those lines into comments"], "In Python, indentation is part of the language: the indented lines after the colon form the block of the if."],
        ["ב־Python, למה צריך להזיח את השורות שבתוך if?", "לפי ההזחה Python יודע אילו שורות שייכות ל־if", ["Python מתעלם מהזחה; היא רק עושה את הקוד יפה יותר", "שורות מוזחות רצות פעמיים כדי לוודא שהן עובדות", "ההזחה הופכת את השורות האלה להערות"], "ב־Python ההזחה היא חלק מהשפה: השורות המוזחות שאחרי הנקודתיים הן הבלוק של ה־if."]],
      [["Which name is best for a true-or-false value that says whether a door is open?", "isOpen", ["doorThing", "open123", "x"], "Names that start with is, has or can read like a yes-or-no question, so isOpen clearly holds true or false."],
        ["איזה שם הכי מתאים לערך של אמת או שקר שאומר אם דלת פתוחה?", "isOpen", ["doorThing", "open123", "x"], "שמות שמתחילים ב־is, has או can נקראים כמו שאלה של כן או לא, ולכן ברור ש־isOpen שומר אמת או שקר."]],
    ],
    n: [
      [4, ["How many spaces does PEP 8, Python's style guide, use for each level of indentation?", "spaces", "PEP 8 says to use 4 spaces for each indentation level, and not to mix tab characters with spaces."],
        ["כמה רווחים משתמש PEP 8, מדריך הסגנון של Python, לכל רמה של הזחה?", "רווחים", "לפי PEP 8 משתמשים ב־4 רווחים לכל רמת הזחה, ולא מערבבים תווי טאב עם רווחים."]],
    ],
  },
  i: {
    t: [
      ["Magic number", "a number written straight into code with no name to explain what it means", "מספר קסם", "מספר שנכתב ישירות בקוד בלי שם שמסביר מה הוא מייצג"],
      ["Constant", "a named value that is set once and stays the same while the program runs", "קבוע", "ערך עם שם שנקבע פעם אחת ונשאר אותו דבר כל זמן שהתוכנית רצה"],
      ["DRY", "short for Don't Repeat Yourself: each piece of knowledge lives in one place only", "עיקרון DRY", "קיצור של Don't Repeat Yourself, ״אל תחזרו על עצמכם״: כל פיסת ידע כתובה במקום אחד בלבד"],
      ["PascalCase", "joining words with a capital at the start of every one of them, like GameBoard", "PascalCase", "חיבור מילים כשכל אחת מהן מתחילה באות גדולה, כמו GameBoard"],
    ],
    q: [
      [["The number 3, for a player's lives, appears in five places in a game. What is the best fix?", "Make one constant MAX_LIVES = 3 and use it everywhere", ["Write a comment saying lives next to each of the five 3s", "Change every 3 to 3.0 so that it stands out", "Leave it, because 3 is a small and simple number"], "With one named constant, the meaning is clear, and a change to the number of lives is made in one place instead of five."],
        ["המספר 3, מספר החיים של השחקן, מופיע בחמישה מקומות במשחק. מה התיקון הטוב ביותר?", "ליצור קבוע אחד MAX_LIVES = 3 ולהשתמש בו בכל מקום", ["לכתוב הערה ״חיים״ ליד כל אחד מחמשת ה־3", "להחליף כל 3 ב־3.0 כדי שיבלוט", "להשאיר כך, כי 3 הוא מספר קטן ופשוט"], "עם קבוע אחד שיש לו שם, המשמעות ברורה, ושינוי של מספר החיים נעשה במקום אחד במקום בחמישה."]],
      [["Which naming style is often used for constants, such as MAX_SPEED?", "Capital letters joined by underscores", ["Small first letter, then a capital for each word", "Small letters joined by dashes", "A capital at the start of every word"], "Writing constants in capitals with underscores, like MAX_SPEED, is a common rule in Python, JavaScript and Java, so they stand out from ordinary variables."],
        ["באיזה סגנון כותבים לעיתים קרובות קבועים, כמו MAX_SPEED?", "אותיות גדולות שמחוברות בקווים תחתונים", ["אות ראשונה קטנה, ואז אות גדולה בכל מילה", "אותיות קטנות שמחוברות במקפים", "אות גדולה בתחילת כל מילה"], "כתיבת קבועים באותיות גדולות עם קווים תחתונים, כמו MAX_SPEED, היא כלל נפוץ ב־Python, ב־JavaScript וב־Java, כדי שיבלטו לעומת משתנים רגילים."]],
      [["Python's style guide, PEP 8, says that one thing happens to code much more often than writing it. What is it?", "It is read", ["It is copied", "It is deleted", "It is printed"], "PEP 8 repeats an idea of Python's creator, Guido van Rossum: code is read much more often than it is written, so making it easy to read is worth the effort."],
        ["מדריך הסגנון של Python, PEP 8, אומר שדבר אחד קורה לקוד הרבה יותר פעמים מכתיבה. מהו?", "קוראים אותו", ["מעתיקים אותו", "מוחקים אותו", "מדפיסים אותו"], "PEP 8 חוזר על רעיון של יוצר Python, גידו ואן רוסום: קוראים קוד הרבה יותר פעמים ממה שכותבים אותו, ולכן שווה להשקיע כדי שיהיה קל לקריאה."]],
      [["A comment  # add 1 to x  sits above  x = x + 1 . What is wrong with it?", "It only repeats what the line already says", ["Comments must always be written in capital letters", "Comments are not allowed directly above code", "It makes the program run more slowly"], "Good comments explain the reason behind code. This one only says again what anyone can already read in the line itself."],
        ["ההערה  # add 1 to x  כתובה מעל  x = x + 1 . מה הבעיה בה?", "היא רק חוזרת על מה שהשורה כבר אומרת", ["הערות צריכות תמיד להיכתב באותיות גדולות", "אסור לכתוב הערה ישירות מעל שורת קוד", "היא גורמת לתוכנית לרוץ לאט יותר"], "הערות טובות מסבירות את הסיבה שמאחורי הקוד. ההערה הזאת רק אומרת שוב את מה שכל אחד יכול לקרוא בשורה עצמה."]],
      [["In JavaScript, which naming style do most programmers use for variables and functions?", "camelCase, like totalScore", ["snake_case, like total_score", "UPPER_CASE, like TOTALSCORE", "kebab-case, like total-score"], "camelCase is the usual style for JavaScript names. A dash cannot even be used in a JavaScript name, because it means minus."],
        ["ב־JavaScript, באיזה סגנון רוב המתכנתים כותבים שמות של משתנים ופונקציות?", "camelCase, כמו totalScore", ["snake_case, כמו total_score", "UPPER_CASE, כמו TOTALSCORE", "kebab-case, כמו total-score"], "camelCase הוא הסגנון המקובל לשמות ב־JavaScript. מקף בכלל אי אפשר לכתוב בשם ב־JavaScript, כי הוא מסמן מינוס."]],
    ],
    n: [
      [79, ["PEP 8, Python's style guide, says lines should be at most how many characters long?", "characters", "PEP 8 limits lines to 79 characters, so code is easy to read and two files fit side by side on a screen."],
        ["לפי PEP 8, מדריך הסגנון של Python, מה האורך המרבי של שורה, בתווים?", "תווים", "PEP 8 מגביל שורות ל־79 תווים, כדי שיהיה קל לקרוא את הקוד ואפשר יהיה להציג שני קבצים זה לצד זה על המסך."]],
    ],
  },
  a: {
    t: [
      ["Refactoring", "changing how code is organised to make it clearer, without changing what it does", "שכתוב מבני (refactoring)", "שינוי האופן שבו הקוד מאורגן כדי שיהיה ברור יותר, בלי לשנות את מה שהוא עושה"],
      ["Linter", "a tool that reads code without running it and warns about style problems and likely bugs", "לינטר (linter)", "כלי שקורא קוד בלי להריץ אותו ומזהיר מבעיות סגנון ומבאגים אפשריים"],
      ["Single responsibility", "the idea that each function or class should have one clear job", "אחריות יחידה", "הרעיון שלכל פונקציה או מחלקה צריך להיות תפקיד ברור אחד"],
    ],
    q: [
      [["A JavaScript function called  processData  loads a file, sorts it, prints a report and sends an e-mail. What is the main style problem?", "It does several jobs and should be split into smaller functions", ["Its name is too long and should be shortened to pd to save typing", "It should use snake_case instead of camelCase", "Functions are not allowed to print anything"], "A function with one clear job is easier to name, test and reuse. Splitting this one gives four small functions with clear names."],
        ["פונקציה ב־JavaScript בשם  processData  טוענת קובץ, ממיינת אותו, מדפיסה דוח ושולחת דואר אלקטרוני. מהי בעיית הסגנון העיקרית?", "היא עושה כמה תפקידים, וכדאי לפצל אותה לפונקציות קטנות", ["השם שלה ארוך מדי, וכדאי לקצר אותו ל־pd כדי שיהיה נוח יותר להקליד", "צריך לכתוב אותה ב־snake_case במקום ב־camelCase", "אסור לפונקציות להדפיס שום דבר"], "קל יותר לתת שם, לבדוק ולהשתמש שוב בפונקציה שיש לה תפקיד ברור אחד. פיצול של הפונקציה הזאת ייתן ארבע פונקציות קטנות עם שמות ברורים."]],
      [["Which comment adds the most value?", "# binary search is fine here: names are kept sorted", ["# go through the list of names one by one and check each", "# set the variable i to 0 before the loop starts", "# this is a function"], "It explains why the code can work this way, which the code itself cannot say. The others only repeat what the lines already show."],
        ["איזו הערה מוסיפה הכי הרבה?", "# חיפוש בינארי מתאים כאן: השמות נשמרים ממוינים", ["# עוברים על רשימת השמות אחד אחד ובודקים כל אחד", "# מאפסים את המשתנה i לפני שהלולאה מתחילה", "# זו פונקציה"], "היא מסבירה למה הקוד יכול לעבוד כך, ואת זה הקוד עצמו לא יכול להגיד. ההערות האחרות רק חוזרות על מה שהשורות כבר מראות."]],
      [["What is the main difference between a linter and a formatter?", "A linter warns of problems; a formatter fixes layout", ["A linter runs the program; a formatter compiles it", "They are the same tool with two different names", "A formatter finds the bugs; a linter only changes the colours"], "A linter points out likely bugs and broken rules. A formatter, such as Black for Python, rewrites spacing and line breaks so that all the code looks the same."],
        ["מה ההבדל העיקרי בין לינטר לבין כלי עיצוב קוד (formatter)?", "לינטר מזהיר מבעיות; כלי עיצוב מסדר את הפריסה", ["לינטר מריץ את התוכנית; כלי עיצוב מהדר אותה", "זה אותו כלי בשני שמות שונים", "כלי עיצוב מוצא את הבאגים; לינטר רק משנה את הצבעים"], "לינטר מצביע על באגים אפשריים ועל כללים שהופרו. כלי עיצוב, כמו Black ל־Python, כותב מחדש רווחים ושבירות שורה כך שכל הקוד ייראה אותו דבר."]],
      [["Why do teams agree on one style and often use an automatic formatter?", "So code looks alike and reviews focus on what it does", ["Because programs written in mixed styles do not run at all", "Because formatters make the program run much faster", "Because the compiler checks every style rule"], "Style does not change what a program does, but a shared style makes code easier to read and stops arguments about spaces in reviews."],
        ["למה צוותים מסכימים על סגנון אחד ומשתמשים לעיתים קרובות בכלי עיצוב אוטומטי?", "כדי שהקוד ייראה דומה והסקירות יתמקדו במה שהוא עושה", ["כי תוכניות שכתובות בסגנונות מעורבים לא רצות בכלל", "כי כלי עיצוב גורמים לתוכנית לרוץ הרבה יותר מהר", "כי המהדר בודק כל כלל של סגנון"], "הסגנון לא משנה את מה שתוכנית עושה, אבל סגנון משותף הופך את הקוד לקל יותר לקריאה ומונע ויכוחים על רווחים בסקירות קוד."]],
      [["What does PEP 8 recommend for the name of a Python function?", "load_scores, in small letters with underscores", ["loadScores, in camelCase", "LoadScores, in PascalCase", "LOAD-SCORES, in capitals with dashes"], "PEP 8 asks for function names in small letters with the words joined by underscores. PascalCase is kept for class names and capitals for constants."],
        ["מה ממליץ PEP 8 לשם של פונקציה ב־Python?", "load_scores, באותיות קטנות עם קווים תחתונים", ["loadScores, בסגנון camelCase", "LoadScores, בסגנון PascalCase", "LOAD-SCORES, באותיות גדולות עם מקפים"], "PEP 8 מבקש שמות פונקציות באותיות קטנות, עם קווים תחתונים בין המילים. PascalCase שמור לשמות של מחלקות, ואותיות גדולות לקבועים."]],
      [["Instead of wrapping a whole function in  if the user is logged in , what does a guard clause do?", "Returns early when the user is not logged in", ["Wraps the whole function in a second, deeper if", "Repeats the check in every line of the function", "Deletes the check, so the function always runs"], "A guard clause handles the bad case first and leaves the function at once, so the main code is not pushed one level deeper."],
        ["במקום לעטוף פונקציה שלמה בתנאי  if the user is logged in , מה עושה פסוקית שמירה (guard clause)?", "יוצאת מוקדם כשהמשתמש לא מחובר", ["עוטפת את כל הפונקציה ב־if שני, עמוק יותר", "חוזרת על הבדיקה בכל שורה של הפונקציה", "מוחקת את הבדיקה, כך שהפונקציה תמיד רצה"], "פסוקית שמירה מטפלת קודם במקרה הבעייתי ויוצאת מיד מהפונקציה, כך שהקוד הראשי לא נדחף עוד רמה פנימה."]],
    ],
    n: [
      [16, ["A line sits 4 indentation levels deep, with PEP 8's 4 spaces per level. How many spaces come before it?", "spaces", "Each level adds 4 spaces, so 4 levels give 4 × 4 = 16 spaces."],
        ["שורה נמצאת בעומק של 4 רמות הזחה, עם 4 רווחים לכל רמה לפי PEP 8. כמה רווחים יש לפניה?", "רווחים", "כל רמה מוסיפה 4 רווחים, ולכן 4 רמות הן 4 × 4 = 16 רווחים."]],
    ],
    s: [
      [["Refactoring safely, step by step", "Check that all the tests pass before you start", "Make one small change to the structure", "Run the tests again", "If they pass, go on to the next small change"],
        ["שכתוב מבני בבטחה, צעד אחר צעד", "בודקים שכל הבדיקות עוברות לפני שמתחילים", "עושים שינוי קטן אחד במבנה", "מריצים שוב את הבדיקות", "אם הן עוברות, ממשיכים לשינוי הקטן הבא"]],
    ],
  },
};
export default c;
