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
      [["Why do programmers use version control?", "To keep a history of changes and go back to an older version if something breaks", ["To make the code run faster", "To check the spelling in comments", "To delete old files automatically"], "Every commit is kept, so a working version can always be found again and compared with the new one."],
        ["למה מתכנתים משתמשים בניהול גרסאות?", "כדי לשמור היסטוריה של שינויים ולחזור לגרסה ישנה אם משהו נשבר", ["כדי שהקוד ירוץ מהר יותר", "כדי לבדוק את האיות בהערות", "כדי למחוק קבצים ישנים אוטומטית"], "כל קומיט נשמר, ולכן תמיד אפשר למצוא שוב גרסה שעבדה ולהשוות אותה לחדשה."]],
      [["What should a good commit message say?", "What changed and why, in a few words", ["Only the date and time", "The name of the computer", "The programmer's password"], "Git records the date and author by itself; the message is for people, to explain the change."],
        ["מה צריכה לומר הודעת קומיט טובה?", "מה השתנה ולמה, בכמה מילים", ["רק את התאריך והשעה", "את השם של המחשב", "את הסיסמה של המתכנת"], "Git רושם בעצמו את התאריך ואת הכותב; ההודעה נועדה לאנשים, כדי להסביר את השינוי."]],
      [["Two days ago the game worked; today it is broken. How does version control help?", "You can compare today's code with the last working commit to find what changed", ["It fixes the bug by itself", "It stops you from saving broken code", "It deletes the newest files"], "Git cannot fix bugs, but it shows exactly which lines changed since the version that worked."],
        ["לפני יומיים המשחק עבד, והיום הוא שבור. איך ניהול גרסאות עוזר?", "אפשר להשוות את הקוד של היום לקומיט האחרון שעבד ולמצוא מה השתנה", ["הוא מתקן את הבאג לבד", "הוא לא נותן לשמור קוד שבור", "הוא מוחק את הקבצים החדשים ביותר"], "Git לא מתקן באגים, אבל הוא מראה בדיוק אילו שורות השתנו מאז הגרסה שעבדה."]],
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
      [["What does  git commit  save?", "The changes that were staged with git add", ["Every file on the computer", "Only the last line you typed", "The changes on your teammates' computers"], "git add chooses the changes, and git commit saves them as one snapshot with a message."],
        ["מה שומר  git commit ?", "את השינויים שהוכנו לשמירה עם git add", ["כל קובץ במחשב", "רק את השורה האחרונה שהקלדתם", "את השינויים במחשבים של חברי הצוות"], "git add בוחר את השינויים, ו־git commit שומר אותם כתמונת מצב אחת עם הודעה."]],
      [["A feature is finished on its own branch. How do its changes get into the main branch?", "By merging the branch into main", ["They appear there automatically", "By deleting the main branch", "By cloning the repository again"], "Until it is merged, a branch's work stays only on that branch."],
        ["תכונה הושלמה בענף משלה. איך השינויים שלה מגיעים לענף הראשי?", "ממזגים את הענף לתוך main", ["הם מופיעים שם אוטומטית", "מוחקים את הענף הראשי", "משבטים שוב את המאגר"], "עד שממזגים אותו, העבודה של ענף נשארת רק בענף הזה."]],
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
      [["Two teammates changed the same line of the same file on different branches. What happens when the branches are merged?", "A merge conflict: a person must choose or combine the lines", ["Git always keeps the newest line", "Both lines are deleted", "The whole repository is lost"], "Git merges different lines by itself, but for the same line it marks a conflict and waits for a person to decide."],
        ["שני חברי צוות שינו את אותה שורה באותו קובץ בענפים שונים. מה קורה כשממזגים את הענפים?", "התנגשות במיזוג: אדם צריך לבחור שורה או לשלב ביניהן", ["Git תמיד שומר את השורה החדשה יותר", "שתי השורות נמחקות", "כל המאגר הולך לאיבוד"], "Git ממזג לבד שורות שונות, אבל על אותה שורה הוא מסמן התנגשות ומחכה שאדם יחליט."]],
      [["Why should each commit be small and about one change?", "It is easier to understand, review and undo if needed", ["Git accepts only commits of under 10 lines", "Big commits delete the history", "Small commits make the program run faster"], "A commit that does one thing has a clear message and can be undone without losing other work."],
        ["למה כדאי שכל קומיט יהיה קטן ויעסוק בשינוי אחד?", "קל יותר להבין אותו, לבדוק אותו ולבטל אותו אם צריך", ["Git מקבל רק קומיטים של פחות מ־10 שורות", "קומיטים גדולים מוחקים את ההיסטוריה", "קומיטים קטנים גורמים לתוכנית לרוץ מהר יותר"], "קומיט שעושה דבר אחד מקבל הודעה ברורה, ואפשר לבטל אותו בלי לאבד עבודה אחרת."]],
      [["A teammate pushed new commits to the shared repository. Which command brings them to your computer?", "git pull", ["git push", "git commit", "git add"], "pull brings commits from the remote to you; push sends yours the other way."],
        ["חבר צוות שלח קומיטים חדשים למאגר המשותף. איזו פקודה מביאה אותם למחשב שלכם?", "git pull", ["git push", "git commit", "git add"], "pull מביא קומיטים מהמאגר המרוחק אליכם; push שולח את שלכם בכיוון ההפוך."]],
    ],
  },
};
export default c;
