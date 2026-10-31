import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Version control", "a system that records each saved version of your files, so you can see what changed and go back", "ניהול גרסאות", "מערכת ששומרת כל גרסה שנשמרה של הקבצים, כדי שאפשר יהיה לראות מה השתנה ולחזור אחורה"],
      ["Git", "a free tool, used by most programmers, that tracks the changes in a project's files", "Git", "כלי חינמי, שרוב המתכנתים משתמשים בו, שעוקב אחרי השינויים בקבצים של פרויקט"],
      ["Repository", "the folder of a project together with its full history of changes", "מאגר (repository)", "התיקייה של פרויקט יחד עם כל היסטוריית השינויים שלה"],
      ["Commit", "a saved snapshot of the project with a short message that says what changed", "קומיט (commit)", "תמונת מצב שמורה של הפרויקט, עם הודעה קצרה שמתארת מה השתנה"],
    ],
    q: [
      [["Why do programmers use version control?", "To keep a history of changes and go back to an older version if something breaks", ["To make a full backup of the whole computer, including photos and music, every night", "To run the program on other people's computers without installing it there", "To protect the code with a password so that nobody else can open it"], "Every commit is kept, so a working version can always be found again and compared with the new one."],
        ["למה מתכנתים משתמשים בניהול גרסאות?", "כדי לשמור היסטוריה של שינויים ולחזור לגרסה ישנה אם משהו נשבר", ["כדי לגבות את כל המחשב, כולל תמונות ומוזיקה, בכל לילה", "כדי להריץ את התוכנית על מחשבים של אנשים אחרים בלי להתקין אותה", "כדי להגן על הקוד בסיסמה כך שאף אחד אחר לא יוכל לפתוח אותו"], "כל קומיט נשמר, ולכן תמיד אפשר למצוא שוב גרסה שעבדה ולהשוות אותה לחדשה."]],
      [["What should a good commit message say?", "What changed and why, in a few words", ["Only the date and the time of the save", "Just the word update, so that every message looks the same", "The name of the computer"], "Git records the date and author by itself; the message is for people, to explain the change."],
        ["מה צריכה לומר הודעת קומיט טובה?", "מה השתנה ולמה, בכמה מילים", ["רק את התאריך ואת השעה של השמירה", "רק את המילה ״עדכון״, כדי שכל ההודעות ייראו אותו דבר", "את השם של המחשב"], "Git רושם בעצמו את התאריך ואת הכותב; ההודעה נועדה לאנשים, כדי להסביר את השינוי."]],
      [["Two days ago the game worked; today it is broken. How does version control help?", "You can compare today's code with the last working commit to find what changed", ["It finds the bug and fixes it by itself, then saves the repaired code as a new commit", "It stops you from saving code that has a bug in it, so this could not have happened", "It deletes the newest files by itself, and then the game works again"], "Git cannot fix bugs, but it shows exactly which lines changed since the version that worked."],
        ["לפני יומיים המשחק עבד, והיום הוא שבור. איך ניהול גרסאות עוזר?", "אפשר להשוות את הקוד של היום לקומיט האחרון שעבד ולמצוא מה השתנה", ["הוא מוצא את הבאג ומתקן אותו בעצמו, ואז שומר את הקוד המתוקן בקומיט חדש", "הוא לא נותן לשמור קוד שיש בו באג, ולכן זה לא היה יכול לקרות", "הוא מוחק בעצמו את הקבצים החדשים ביותר, ואז המשחק עובד שוב"], "Git לא מתקן באגים, אבל הוא מראה בדיוק אילו שורות השתנו מאז הגרסה שעבדה."]],
      [["Which command turns the current folder into a new Git repository?", "git init", ["git clone", "git push", "git start"], "git init creates a new, empty repository in the folder. git clone copies a repository that already exists, and git push sends commits to a shared one."],
        ["איזו פקודה הופכת את התיקייה הנוכחית למאגר Git חדש?", "git init", ["git clone", "git push", "git start"], "git init יוצרת מאגר חדש וריק בתיקייה. git clone מעתיקה מאגר שכבר קיים, ו־git push שולחת קומיטים למאגר משותף."]],
      [["A game file was deleted by mistake last week, but it had been committed earlier. How can Git help?", "It is still saved in an earlier commit, so it can be restored", ["It cannot help, because Git forgets a file as soon as it is deleted from the folder", "It guesses the content of the file from the other files in the project", "It asks the computer's recycle bin to restore the file"], "Every commit keeps a full snapshot of the files, so a file that was committed once can be restored from that commit even after it is deleted later."],
        ["קובץ של המשחק נמחק בטעות לפני שבוע, אבל הוא נשמר בקומיט קודם. איך Git עוזר?", "הוא עדיין שמור בקומיט קודם, ולכן אפשר לשחזר אותו", ["Git לא יכול לעזור, כי Git שוכח קובץ ברגע שהוא נמחק מהתיקייה", "Git מנחש את תוכן הקובץ לפי שאר הקבצים בפרויקט", "Git מבקש מסל המחזור של המחשב לשחזר את הקובץ"], "כל קומיט שומר תמונת מצב מלאה של הקבצים, ולכן קובץ שנשמר פעם בקומיט אפשר לשחזר ממנו גם אחרי שנמחק בהמשך."]],
    ],
  },
  i: {
    t: [
      ["Branch", "a separate line of work where you can change things without touching the main version", "ענף (branch)", "קו עבודה נפרד שבו אפשר לשנות דברים בלי לגעת בגרסה הראשית"],
      ["Merge", "joining the changes made on one branch into another", "מיזוג (merge)", "צירוף השינויים שנעשו בענף אחד לתוך ענף אחר"],
      ["Staging area", "the set of changes chosen to go into the next commit; git add puts them there", "אזור ההכנה (staging)", "קבוצת השינויים שנבחרו להיכנס לקומיט הבא; git add מכניס אותם לשם"],
      ["Clone", "a full copy of a repository, with all its history, made on your own computer", "שיבוט (clone)", "עותק מלא של מאגר, עם כל ההיסטוריה שלו, שנוצר במחשב שלכם"],
    ],
    q: [
      [["You want to try a risky new feature without breaking the working game. What do you do in Git?", "Create a new branch and work there", ["Edit the main branch directly", "Delete the repository and start again", "Stop using Git for a while"], "Work on a branch does not touch the main version; if the idea fails, the branch can simply be dropped."],
        ["רוצים לנסות תכונה חדשה ומסוכנת בלי לשבור את המשחק שעובד. מה עושים ב־Git?", "יוצרים ענף חדש ועובדים בו", ["עורכים ישירות את הענף הראשי", "מוחקים את המאגר ומתחילים מחדש", "מפסיקים להשתמש ב־Git לזמן מה"], "עבודה בענף לא נוגעת בגרסה הראשית; אם הרעיון לא מצליח, אפשר פשוט לוותר על הענף."]],
      [["What does  git commit  save?", "The changes that were staged with git add", ["Every file on the computer, even those outside the project", "Only the last line you typed", "The changes on your teammates' computers"], "git add chooses the changes, and git commit saves them as one snapshot with a message."],
        ["מה שומר  git commit ?", "את השינויים שהוכנו לשמירה עם git add", ["כל קובץ במחשב, גם כאלה שנמצאים מחוץ לפרויקט", "רק את השורה האחרונה שהקלדתם", "את השינויים במחשבים של חברי הצוות"], "git add בוחר את השינויים, ו־git commit שומר אותם כתמונת מצב אחת עם הודעה."]],
      [["A feature is finished on its own branch. How do its changes get into the main branch?", "By merging the branch into main", ["They appear there automatically", "By deleting the main branch", "By cloning the repository again"], "Until it is merged, a branch's work stays only on that branch."],
        ["תכונה הושלמה בענף משלה. איך השינויים שלה מגיעים לענף הראשי?", "ממזגים את הענף לתוך main", ["הם מופיעים שם אוטומטית", "מוחקים את הענף הראשי ויוצרים אותו מחדש", "משבטים שוב את המאגר"], "עד שממזגים אותו, העבודה של ענף נשארת רק בענף הזה."]],
      [["Which command shows which files have changed and which of them are already staged?", "git status", ["git log", "git branch", "git clone"], "git status lists the changed files and says which are staged for the next commit. git log shows the earlier commits, and git branch lists the branches."],
        ["איזו פקודה מראה אילו קבצים השתנו ואילו מהם כבר הוכנו לקומיט?", "git status", ["git log", "git branch", "git clone"], "git status מציגה את הקבצים ששונו ואומרת אילו מהם הוכנו לקומיט הבא. git log מציגה את הקומיטים הקודמים, ו־git branch מציגה את הענפים."]],
      [["You join a team and want your own copy of its project, with the whole history. Which command do you use?", "git clone", ["git commit", "git init", "git add"], "git clone downloads a full copy of the repository, history included. git init would start a new empty repository instead, so none of the team's history would come with it."],
        ["מצטרפים לצוות ורוצים עותק משלכם של הפרויקט שלו, עם כל ההיסטוריה. באיזו פקודה משתמשים?", "git clone", ["git commit", "git init", "git add"], "git clone מורידה עותק מלא של המאגר, כולל ההיסטוריה. git init הייתה פותחת מאגר חדש וריק, ושום דבר מההיסטוריה של הצוות לא היה מגיע איתה."]],
    ],
    s: [
      [["Saving a change with Git", "Edit a file", "Stage the change with git add", "Commit it with a message (git commit)", "Send it to the shared copy (git push)"],
        ["שמירת שינוי עם Git", "עורכים קובץ", "מכינים את השינוי לשמירה עם git add", "שומרים אותו עם הודעה (git commit)", "שולחים אותו לעותק המשותף (git push)"]],
    ],
  },
  a: {
    t: [
      ["Merge conflict", "when two branches changed the same lines in different ways and Git cannot choose, so a person must decide", "התנגשות במיזוג (conflict)", "מצב שבו שני ענפים שינו את אותן שורות בדרכים שונות ו־Git לא יכול לבחור, ולכן אדם צריך להחליט"],
      ["Remote", "a copy of the repository on a server, such as GitHub, that a team shares", "מאגר מרוחק (remote)", "עותק של המאגר על שרת, כמו GitHub, שהצוות משתף"],
      ["Pull", "bringing the newest commits from the shared copy into your own", "pull", "הבאת הקומיטים החדשים ביותר מהעותק המשותף אל העותק שלכם"],
      ["Push", "sending your new commits to the shared copy on the server", "push", "שליחת הקומיטים החדשים שלכם אל העותק המשותף שעל השרת"],
    ],
    q: [
      [["Two teammates changed the same line of the same file on different branches. What happens when the branches are merged?", "A merge conflict: a person must choose or combine the lines", ["Git always keeps the line that was saved last and throws the other one away", "Both lines are deleted and the file is left with a gap in that place", "The whole repository is lost and has to be downloaded again"], "Git merges different lines by itself, but for the same line it marks a conflict and waits for a person to decide."],
        ["שני חברי צוות שינו את אותה שורה באותו קובץ בענפים שונים. מה קורה כשממזגים את הענפים?", "התנגשות במיזוג: אדם צריך לבחור שורה או לשלב ביניהן", ["Git תמיד שומר את השורה שנשמרה אחרונה וזורק את השנייה", "שתי השורות נמחקות והקובץ נשאר עם חור באותו מקום", "כל המאגר הולך לאיבוד וצריך להוריד אותו מחדש"], "Git ממזג לבד שורות שונות, אבל על אותה שורה הוא מסמן התנגשות ומחכה שאדם יחליט."]],
      [["Why should each commit be small and about one change?", "It is easier to understand, review and undo if needed", ["Git refuses every commit that changes more than ten lines at once", "Big commits delete the older history of the project, so it cannot be read", "Small commits make the finished program run faster"], "A commit that does one thing has a clear message and can be undone without losing other work."],
        ["למה כדאי שכל קומיט יהיה קטן ויעסוק בשינוי אחד?", "קל יותר להבין אותו, לבדוק אותו ולבטל אותו אם צריך", ["Git מסרב לכל קומיט ששינה יותר מעשר שורות בבת אחת", "קומיטים גדולים מוחקים את ההיסטוריה הישנה של הפרויקט, ואי אפשר לקרוא אותה", "קומיטים קטנים גורמים לתוכנית המוגמרת לרוץ מהר יותר עבור המשתמש"], "קומיט שעושה דבר אחד מקבל הודעה ברורה, ואפשר לבטל אותו בלי לאבד עבודה אחרת."]],
      [["A teammate pushed new commits to the shared repository. Which command brings them to your computer?", "git pull", ["git push", "git commit", "git add"], "pull brings commits from the remote to you; push sends yours the other way."],
        ["חבר צוות שלח קומיטים חדשים למאגר המשותף. איזו פקודה מביאה אותם למחשב שלכם?", "git pull", ["git push", "git commit", "git add"], "pull מביא קומיטים מהמאגר המרוחק אליכם; push שולח את שלכם בכיוון ההפוך."]],
      [["Git reports a merge conflict in a file. What does the person do?", "Edit the file to keep the right lines and remove Git's markers, then stage and commit it", ["Run git push again and again, because every attempt gives Git another chance to settle it", "Delete the whole repository and clone it again from the server", "Wait a few minutes, because Git settles the conflict by itself"], "Git marks the clashing lines in the file. The person chooses or combines them, deletes the markers, then uses git add and git commit to finish the merge."],
        ["Git מדווח על התנגשות במיזוג בקובץ. מה האדם עושה?", "עורך את הקובץ, משאיר את השורות הנכונות, מוחק את הסימנים ושומר בקומיט", ["מריץ שוב ושוב push, כי כל ניסיון נותן ל־Git עוד הזדמנות ליישב את ההתנגשות", "מוחק את כל המאגר ומשבט אותו מחדש מהשרת, כדי להתחיל מגרסה נקייה", "מחכה כמה דקות, כי Git מיישב את ההתנגשות לבד"], "Git מסמן בקובץ את השורות שמתנגשות. האדם בוחר או משלב ביניהן, מוחק את הסימנים, ואז משתמש ב־git add וב־git commit כדי לסיים את המיזוג."]],
      [["You try to push, but Git refuses because the remote has commits you do not have yet. What should you do first?", "Pull the new commits, fix any conflicts, then push again", ["Force the push, so that your version replaces what your teammates saved", "Delete your branch and start again from an empty folder", "Copy your files by hand into the server's folder"], "Git protects the shared history: a push is refused until your copy contains the newer commits of the team. A forced push could overwrite a teammate's work.", "Git is protecting something your teammates already saved. What must your copy contain before it may add its own commits?"],
        ["אתם מנסים לבצע push, אבל Git מסרב כי במאגר המרוחק יש קומיטים שעדיין אין לכם. מה עושים קודם?", "מבצעים pull לקומיטים החדשים, פותרים התנגשויות אם יש, ואז שוב push", ["כופים את ה־push כדי שהגרסה שלכם תחליף את כל מה שחברי הצוות שמרו", "מוחקים את הענף ומתחילים מחדש מתיקייה ריקה, כאילו כלום לא קרה בכלל", "מעתיקים את הקבצים ביד לתיקייה של השרת ומקווים ש־Git לא ישים לב"], "Git שומר על ההיסטוריה המשותפת: ה־push נדחה עד שהעותק שלכם מכיל את הקומיטים החדשים של הצוות. כפיית push עלולה לדרוס עבודה של חבר צוות.", "Git מגן על מה שחברי הצוות כבר שמרו. מה צריך להיות בעותק שלכם לפני שהוא יכול להוסיף קומיטים משלו?"]],
    ],
    s: [
      [["A day of work with Git in a team", "Pull the newest commits of main from the remote", "Create a branch for your feature", "Make your changes and commit them on that branch", "Push the branch to the remote", "Merge it into main when the feature is finished"],
        ["יום עבודה בצוות עם Git", "מבצעים pull לקומיטים החדשים של main מהמאגר המרוחק", "יוצרים ענף לתכונה שלכם", "עורכים את הקוד ושומרים אותו בקומיטים בענף הזה", "מבצעים push לענף אל המאגר המרוחק", "ממזגים אותו ל־main כשהתכונה מוכנה"]],
    ],
  },
};
export default c;
