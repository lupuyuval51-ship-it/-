import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Programming language", "a set of words, symbols and rules for writing instructions that a computer can carry out", "שפת תכנות", "אוסף של מילים, סימנים וכללים לכתיבת הוראות שמחשב יכול לבצע"],
      ["Source code", "the instructions a programmer writes, as text that people can read", "קוד מקור", "ההוראות שמתכנתים כותבים, כטקסט שבני אדם יכולים לקרוא"],
      ["Syntax", "the rules for how the words and symbols of a language must be put together", "תחביר", "הכללים שקובעים איך צריך לחבר את המילים והסימנים של שפה"],
    ],
    q: [
      [["Which of these is a programming language?", "Python", ["HTML", "Wi-Fi", "Bluetooth"], "Python can calculate, decide and repeat. HTML only describes the parts of a web page, while Wi-Fi and Bluetooth are ways for devices to connect without wires."],
        ["איזו מאלה היא שפת תכנות?", "Python", ["HTML", "Wi-Fi", "Bluetooth"], "ב־Python אפשר לחשב, להחליט ולחזור על פעולות. HTML רק מתארת את החלקים של דף אינטרנט, ו־Wi-Fi ו־Bluetooth הן דרכים לחבר מכשירים בלי חוטים."]],
      [["What is a syntax error?", "Code that breaks the rules, like a missing bracket", ["A program that runs to the end but gives the wrong answer", "A computer that is too slow for the program", "A virus that secretly changes the code"], "A syntax error means the code is not written the way the language allows, so it cannot run at all. A wrong answer from working code is a logic error."],
        ["מהי שגיאת תחביר?", "קוד שמפר את הכללים, כמו סוגר שחסר", ["תוכנית שרצה עד הסוף אבל נותנת תשובה שגויה", "מחשב שאיטי מדי בשביל התוכנית", "וירוס שמשנה את הקוד בסתר"], "שגיאת תחביר פירושה שהקוד לא כתוב בדרך שהשפה מרשה, ולכן הוא לא יכול לרוץ בכלל. תשובה שגויה מקוד שרץ היא שגיאה לוגית."]],
      [["What is the language Python named after?", "The comedy show Monty Python", ["A large snake found in Africa and Asia", "The family name of its inventor", "The first computer that ran it"], "Guido van Rossum, who created Python, named it after the British comedy series Monty Python's Flying Circus, not after the snake."],
        ["על שם מה נקראת השפה Python?", "על שם תוכנית הקומדיה מונטי פייתון", ["על שם נחש גדול שחי באפריקה ובאסיה", "על שם המשפחה של מי שהמציא אותה", "על שם המחשב הראשון שהריץ אותה"], "גידו ואן רוסום, שיצר את Python, קרא לה על שם סדרת הקומדיה הבריטית ״הקרקס המעופף של מונטי פייתון״, ולא על שם הנחש."]],
      [["Why do programmers usually write in languages like Python instead of 0s and 1s?", "They are much easier for people to read and fix", ["Modern computers cannot run 0s and 1s any more", "Python programs always run faster than any others", "Programs written in Python never have any bugs"], "Processors still run 0s and 1s, but writing them by hand is slow and full of mistakes. A compiler or an interpreter does the translation instead."],
        ["למה מתכנתים כותבים בדרך כלל בשפות כמו Python ולא באפסים ואחדות?", "הרבה יותר קל לבני אדם לקרוא אותן ולתקן אותן", ["מחשבים מודרניים כבר לא יכולים להריץ אפסים ואחדות", "תוכניות ב־Python תמיד רצות מהר יותר מכל תוכנית אחרת", "בתוכניות שכתובות ב־Python אף פעם אין באגים"], "מעבדים עדיין מריצים אפסים ואחדות, אבל לכתוב אותם ביד זה איטי ומלא טעויות. מהדר או מפרש עושים את התרגום במקום."]],
      [["Which language is built from blocks that you drag and snap together?", "Scratch", ["Python", "C", "Assembly"], "Scratch, made at MIT, uses colourful blocks instead of typed text, so there are no spelling mistakes in the code."],
        ["איזו שפה בנויה מלבנים שגוררים ומחברים זו לזו?", "Scratch", ["Python", "C", "Assembly"], "Scratch, שפותחה ב־MIT, משתמשת בלבנים צבעוניות במקום בטקסט מוקלד, ולכן אין בקוד שגיאות כתיב."]],
    ],
    n: [
      [1991, ["In which year was Python first released?", "", "Guido van Rossum released the first version of Python in 1991, and it later became one of the most popular languages."],
        ["באיזו שנה שוחררה לראשונה Python?", "", "גידו ואן רוסום שחרר את הגרסה הראשונה של Python ב־1991, ולימים היא הפכה לאחת השפות הפופולריות ביותר."]],
    ],
    s: [
      [["From closest to the processor to closest to people", "Machine code (0s and 1s)", "Assembly language (short words like ADD)", "A high-level language such as Python"],
        ["מהקרוב ביותר למעבד אל הקרוב ביותר לבני אדם", "שפת מכונה (אפסים ואחדות)", "שפת סף (מילים קצרות כמו ADD)", "שפה עילית כמו Python"]],
    ],
  },
  i: {
    t: [
      ["Machine code", "instructions written as 0s and 1s that a processor can run directly", "שפת מכונה", "הוראות שכתובות באפסים ובאחדות ושמעבד יכול להריץ ישירות"],
      ["Assembly language", "a low-level language with short words like ADD and MOV, one for each processor instruction", "שפת סף", "שפה ברמה נמוכה עם מילים קצרות כמו ADD ו־MOV, אחת לכל הוראה של המעבד"],
      ["Compiler", "a program that translates a whole program into machine code before it runs", "מהדר", "תוכנה שמתרגמת תוכנית שלמה לשפת מכונה לפני שהיא רצה"],
      ["Interpreter", "a program that carries out code step by step while the program is running", "מפרש", "תוכנה שמבצעת קוד צעד אחר צעד בזמן שהתוכנית רצה"],
    ],
    q: [
      [["Who built one of the very first compilers, called A-0, in 1952?", "Grace Hopper", ["Ada Lovelace", "Alan Turing", "Bill Gates"], "Grace Hopper, an American computer scientist who was also a US Navy officer, wrote A-0 in 1952 and later helped create the language COBOL."],
        ["בידי מי נבנה ב־1952 אחד המהדרים הראשונים, שנקרא A-0?", "גרייס הופר", ["עדה לאבלייס", "אלן טיורינג", "ביל גייטס"], "גרייס הופר, מדענית מחשב אמריקאית שהייתה גם קצינה בצי האמריקאי, כתבה את A-0 ב־1952, ומאוחר יותר עזרה ליצור את שפת COBOL."]],
      [["Which language did Dennis Ritchie create at Bell Labs in the early 1970s?", "C", ["Java", "Python", "Scratch"], "Dennis Ritchie created C around 1972 and, with Ken Thompson, used it to rewrite the Unix operating system."],
        ["איזו שפה יצר דניס ריצ׳י במעבדות בל בתחילת שנות ה־70?", "C", ["Java", "Python", "Scratch"], "דניס ריצ׳י יצר את C בסביבות 1972, ויחד עם קן תומפסון השתמש בה כדי לכתוב מחדש את מערכת ההפעלה Unix."]],
      [["What is the main difference between a compiler and an interpreter?", "A compiler translates all the code first; an interpreter runs it bit by bit", ["A compiler is for games; an interpreter is for websites", "A compiler finds no errors; an interpreter finds all of them", "An interpreter can only read machine code"], "A compiler turns the whole program into machine code before it runs. An interpreter reads the code and carries it out piece by piece while it runs."],
        ["מה ההבדל העיקרי בין מהדר לבין מפרש?", "מהדר מתרגם קודם את כל הקוד; מפרש מריץ אותו חלק אחר חלק", ["מהדר מיועד למשחקים, ומפרש מיועד לאתרים", "מהדר לא מוצא שגיאות, ומפרש מוצא את כולן", "מפרש יכול לקרוא רק שפת מכונה"], "מהדר הופך את כל התוכנית לשפת מכונה לפני שהיא רצה. מפרש קורא את הקוד ומבצע אותו חלק אחר חלק בזמן הריצה."]],
      [["Which was one of the first widely used high-level languages, released in 1957?", "FORTRAN", ["COBOL", "Python", "JavaScript"], "FORTRAN, made by a team at IBM led by John Backus, appeared in 1957 for scientific calculations. COBOL followed in 1959."],
        ["איזו הייתה אחת השפות העיליות הנפוצות הראשונות, ששוחררה ב־1957?", "FORTRAN", ["COBOL", "Python", "JavaScript"], "FORTRAN, שפיתח צוות ב־IBM בהובלת ג׳ון בקוס, הופיעה ב־1957 לחישובים מדעיים. COBOL הגיעה אחריה, ב־1959."]],
      [["Who wrote what is often called the first computer program, in 1843?", "Ada Lovelace", ["Grace Hopper", "Alan Turing", "Steve Jobs"], "Ada Lovelace published a method for Charles Babbage's planned Analytical Engine to calculate Bernoulli numbers, and it is often called the first program."],
        ["בידי מי נכתבה ב־1843 התוכנית שלעיתים קרובות מכנים אותה תוכנית המחשב הראשונה?", "עדה לאבלייס", ["גרייס הופר", "אלן טיורינג", "סטיב ג׳ובס"], "עדה לאבלייס פרסמה שיטה שבה המנוע האנליטי שתכנן צ׳ארלס בבג׳ יחשב את מספרי ברנולי, ולעיתים קרובות קוראים לה תוכנית המחשב הראשונה."]],
    ],
    n: [
      [1995, ["In which year did Sun Microsystems release Java?", "", "Java, designed by James Gosling's team at Sun Microsystems, was released in 1995 with the idea of write once, run anywhere."],
        ["באיזו שנה שחררה חברת Sun Microsystems את Java?", "", "Java, שתוכננה בידי הצוות של ג׳יימס גוסלינג בחברת Sun Microsystems, שוחררה ב־1995 עם הרעיון ״כותבים פעם אחת, מריצים בכל מקום״."]],
    ],
  },
  a: {
    t: [
      ["Bytecode", "a compact in-between code that a virtual machine runs instead of the real processor", "קוד ביניים (bytecode)", "קוד קומפקטי שנמצא בשלב שבין קוד המקור לשפת המכונה, ושמכונה וירטואלית מריצה במקום המעבד האמיתי"],
      ["Portability", "how easily a program can be moved to run on a different kind of computer", "ניידות", "עד כמה קל להעביר תוכנית כדי שתרוץ על סוג אחר של מחשב"],
      ["Assembler", "the program that turns assembly language into machine code", "אסמבלר", "התוכנה שמתרגמת שפת סף לשפת מכונה"],
    ],
    q: [
      [["Java programs are usually compiled into bytecode. What runs that bytecode?", "The Java Virtual Machine (JVM)", ["The HTML engine of the web browser", "The computer's graphics card", "The keyboard driver"], "The JVM is a program that runs Java bytecode, so the same compiled program can run on any computer that has a JVM."],
        ["תוכניות Java מהודרות בדרך כלל לקוד ביניים (bytecode). מה מריץ את הקוד הזה?", "המכונה הווירטואלית של Java (JVM)", ["מנוע ה־HTML של הדפדפן", "כרטיס המסך של המחשב", "מנהל ההתקן של המקלדת"], "ה־JVM היא תוכנה שמריצה קוד ביניים של Java, ולכן אותה תוכנית מהודרת יכולה לרוץ על כל מחשב שיש בו JVM."]],
      [["Why can't a C program compiled for a Windows PC simply run on a phone with a different processor?", "It was turned into machine code for one kind of processor and system", ["C programs can run only once before they are compiled again", "Phones cannot run compiled programs of any kind", "The phone needs the comments from the source code"], "Machine code is different for each family of processors, and the program also expects one operating system. It must be compiled again for the phone."],
        ["למה תוכנית C שהודרה למחשב Windows לא יכולה פשוט לרוץ בטלפון עם מעבד אחר?", "היא תורגמה לשפת מכונה של סוג אחד של מעבד ומערכת", ["תוכנית C יכולה לרוץ רק פעם אחת, ואז צריך להדר אותה שוב", "טלפונים לא יכולים להריץ שום תוכנית מהודרת", "הטלפון צריך את ההערות מקוד המקור"], "שפת המכונה שונה בכל משפחה של מעבדים, והתוכנית גם מצפה למערכת הפעלה מסוימת. צריך להדר אותה מחדש בשביל הטלפון."]],
      [["A program has correct syntax, but it adds where it should subtract. What kind of error is that?", "A logic error", ["A syntax error", "A compiler error", "A hardware fault"], "The code follows the rules of the language, so it runs, but it does the wrong thing. The compiler cannot spot this kind of error; careful testing is how it is usually found."],
        ["התחביר של תוכנית נכון, אבל היא מחברת במקום שהיא צריכה לחסר. איזו שגיאה זו?", "שגיאה לוגית", ["שגיאת תחביר", "שגיאת מהדר", "תקלת חומרה"], "הקוד עומד בכללי השפה ולכן הוא רץ, אבל הוא עושה את הדבר הלא נכון. המהדר לא יכול לזהות שגיאה מהסוג הזה, ובדרך כלל מגלים אותה בבדיקות קפדניות."]],
      [["Which language checks the types of its variables before the program runs, when it is compiled?", "Java", ["Python", "JavaScript", "Ruby"], "Java is statically typed: each variable has a declared type, and the compiler rejects mismatches. Python, JavaScript and Ruby check types only while the program runs."],
        ["איזו שפה בודקת את הסוגים של המשתנים שלה לפני שהתוכנית רצה, בזמן ההידור?", "Java", ["Python", "JavaScript", "Ruby"], "Java היא שפה עם טיפוסים סטטיים: לכל משתנה יש סוג מוצהר, והמהדר דוחה אי־התאמות. Python, JavaScript ו־Ruby בודקות סוגים רק בזמן הריצה."]],
      [["Which language did Bjarne Stroustrup create by adding classes to C?", "C++", ["C#", "Java", "Python"], "Stroustrup started C with Classes in 1979, and it was renamed C++ in 1983. C# is a different language, announced by Microsoft in 2000."],
        ["איזו שפה יצר ביארנה סטרוסטרופ כשהוסיף מחלקות לשפת C?", "C++", ["C#", "Java", "Python"], "סטרוסטרופ התחיל את ״C עם מחלקות״ ב־1979, וב־1983 שונה שמה ל־C++. C# היא שפה אחרת, ש־Microsoft הכריזה עליה ב־2000."]],
    ],
    n: [
      [16, ["A tiny processor uses 4 bits to number its instructions. At most how many different instructions can it have?", "", "Each bit is 0 or 1, so 4 bits give 2 × 2 × 2 × 2 = 16 different patterns, one for each instruction."],
        ["מעבד קטן משתמש ב־4 ביטים כדי למספר את ההוראות שלו. לכל היותר כמה הוראות שונות יכולות להיות לו?", "", "כל ביט הוא 0 או 1, ולכן 4 ביטים נותנים 2 × 2 × 2 × 2 = 16 צירופים שונים, אחד לכל הוראה."]],
    ],
    s: [
      [["From C source code to a running program", "The programmer writes the source code", "The compiler checks the syntax and translates the code", "A file of machine code, called an executable, is made", "The processor runs the machine code"],
        ["מקוד מקור ב־C ועד תוכנית שרצה", "המתכנתים כותבים את קוד המקור", "המהדר בודק את התחביר ומתרגם את הקוד", "נוצר קובץ בשפת מכונה, שנקרא קובץ הרצה", "המעבד מריץ את שפת המכונה"]],
    ],
  },
};
export default c;
