import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Password", "a secret word or phrase that protects your account", "סיסמה", "מילה או צירוף סודיים שמגינים על החשבון שלכם"],
      ["Personal information", "details that identify you, like your full name, address, school or phone number", "מידע אישי", "פרטים שמזהים אתכם, כמו שם מלא, כתובת, בית ספר או מספר טלפון"],
      ["Trusted adult", "a parent, teacher or other grown-up you can tell when something online worries you", "מבוגר אמין", "הורה, מורה או מבוגר אחר שאפשר לספר לו כשמשהו ברשת מדאיג אתכם"],
      ["Stranger online", "someone you only know from the internet, who may not be who they say", "זר ברשת", "מישהו שמכירים רק מהאינטרנט, שאולי אינו מי שהוא טוען שהוא"],
    ],
    q: [
      [["Someone you met in a game asks for your home address. What should you do?", "Not share it, and tell a trusted adult", ["Share it if they seem nice and have been kind to you", "Share only the street name, not the house number", "Send a photo of your house instead"], "Never give personal information to people you only know online; telling an adult keeps you safe. A street name or a photo of your house can be enough to find where you live."],
        ["מישהו שהכרתם במשחק מבקש את כתובת הבית שלכם. מה עושים?", "לא משתפים, ומספרים למבוגר אמין", ["משתפים אם הוא נראה נחמד והיה אדיב אליכם", "משתפים רק את שם הרחוב, בלי מספר הבית", "שולחים במקום זה תמונה של הבית"], "אף פעם לא מוסרים מידע אישי לאנשים שמכירים רק מהרשת; סיפור למבוגר שומר עליכם. גם שם של רחוב או תמונה של הבית יכולים להספיק כדי למצוא איפה אתם גרים."]],
      [["Who should know your password?", "Only you (and a parent, for young children)", ["Your best friend, if you promise each other to keep it secret", "Anyone who asks politely and says they work for the game", "Everyone in your class"], "A shared password can be misused, even by accident; keep it to yourself and your parents. Real companies and games never ask you for your password."],
        ["מי צריך לדעת את הסיסמה שלכם?", "רק אתם (ובגיל צעיר — גם ההורים)", ["החבר הכי טוב, אם מבטיחים זה לזה לשמור סוד", "כל מי שמבקש יפה ואומר שהוא עובד בחברת המשחק", "כל הכיתה"], "סיסמה ששותפה יכולה לשמש לרעה, אפילו בטעות; שמרו אותה לעצמכם ולהוריכם. חברות ומשחקים אמיתיים אף פעם לא מבקשים מכם את הסיסמה."]],
      [["A pop-up window says you have won a free tablet and asks for your name and address. What should you do?", "Close it and tell a trusted adult", ["Fill it in, since it says you have already won", "Ask a friend to fill it in for you instead", "Give only your name and phone number"], "Surprise prizes that ask for personal details are a common trick to collect information or money. Close the window without clicking anything inside it, and tell a trusted adult."],
        ["חלון קופץ אומר שזכיתם בטאבלט בחינם ומבקש את השם והכתובת שלכם. מה עושים?", "סוגרים ומספרים למבוגר אמין", ["ממלאים את הפרטים, כי כתוב שכבר זכיתם", "מבקשים מחבר שימלא את הפרטים במקומכם", "ממלאים רק את השם ואת מספר הטלפון"], "פרסים מפתיעים שמבקשים פרטים אישיים הם תרגיל נפוץ לאיסוף מידע או כסף. סוגרים את החלון בלי ללחוץ על שום דבר בתוכו, ומספרים למבוגר אמין."]],
      [["Which of these is personal information that you should keep private online?", "The name of your school", ["The name of a film you like", "Your favourite colour", "How many legs a spider has"], "The name of your school, together with your name, can help a stranger find you in real life. A favourite colour or film does not tell anyone where you are."],
        ["מה מהבאים הוא מידע אישי שכדאי לשמור לעצמכם ברשת?", "שם בית הספר שלכם", ["שם של סרט שאתם אוהבים", "הצבע האהוב עליכם", "כמה רגליים יש לעכביש"], "שם בית הספר, יחד עם השם שלכם, יכול לעזור לזר למצוא אתכם בחיים האמיתיים. צבע או סרט אהובים לא מגלים לאף אחד איפה אתם נמצאים."]],
    ],
  },
  i: {
    t: [
      ["Phishing", "a fake message that pretends to be from a trusted source to steal passwords or money", "דיוג (פישינג)", "הודעה מזויפת שמתחזה למקור אמין כדי לגנוב סיסמאות או כסף"],
      ["Two-factor authentication", "logging in with a password plus a second proof, like a code sent to your phone", "אימות דו־שלבי", "כניסה עם סיסמה ועוד הוכחה נוספת, כמו קוד שנשלח לטלפון"],
      ["Cyberbullying", "using phones or the internet to hurt, threaten or embarrass someone", "בריונות ברשת", "שימוש בטלפון או באינטרנט כדי לפגוע במישהו, לאיים עליו או להשפיל אותו"],
      ["Privacy settings", "options that control who can see what you post and share", "הגדרות פרטיות", "אפשרויות ששולטות במי יכול לראות את מה שאתם מפרסמים ומשתפים"],
    ],
    q: [
      [["Which password is the strongest?", "purple-cactus-rides-9-trains", ["P@ssw0rd, a common word with symbols", "dana2012, a name and a birth year", "123456", "password"], "Long, unusual phrases are hard to guess. Attackers first try common passwords, names, birthdays and words with letters swapped for symbols, like P@ssw0rd."],
        ["איזו סיסמה הכי חזקה?", "purple-cactus-rides-9-trains", ["P@ssw0rd, מילה נפוצה עם סימנים", "dana2012, שם ושנת לידה", "123456", "password"], "צירופים ארוכים ולא צפויים קשים לניחוש. תוקפים מנסים קודם סיסמאות נפוצות, שמות, תאריכי לידה ומילים שהוחלפו בהן אותיות בסימנים, כמו P@ssw0rd."]],
      [["A message says “Your account will be closed! Click here and enter your password.” This is probably…", "phishing", ["a normal security update from the company", "a prize", "a message from a friend"], "Urgent threats plus a request for your password are classic signs of phishing; go to the real site yourself instead."],
        ["הודעה אומרת: ״החשבון שלך ייסגר! לחצו כאן והקלידו את הסיסמה.״ זה כנראה…", "ניסיון דיוג (פישינג)", ["עדכון אבטחה רגיל מהחברה", "פרס", "הודעה מחבר"], "איום דחוף יחד עם בקשת סיסמה הם סימנים מובהקים של דיוג; היכנסו לאתר האמיתי בעצמכם."]],
      [["Someone keeps posting mean comments about a classmate in your class group. What is the best thing to do?", "Save the messages and tell a trusted adult", ["Share the posts so more people see how bad they are", "Ignore it, because words online cannot really hurt", "Reply with mean comments of your own so they stop"], "Screenshots are proof that helps parents and the school act. Hitting back or sharing the posts spreads the hurt, and words online can hurt as much as words said face to face."],
        ["מישהו מפרסם שוב ושוב תגובות מעליבות על ילד בקבוצה של הכיתה. מה הכי נכון לעשות?", "שומרים את ההודעות ומספרים למבוגר אמין", ["משתפים את הפוסטים כדי שעוד אנשים יראו כמה הם רעים", "מתעלמים, כי מילים ברשת לא באמת פוגעות", "עונים בתגובות מעליבות משלכם כדי שיפסיקו"], "צילומי מסך הם הוכחה שעוזרת להורים ולבית הספר לפעול. תגובה מעליבה או שיתוף של הפוסטים מפיצים את הפגיעה, ומילים ברשת יכולות לפגוע בדיוק כמו מילים שנאמרות פנים אל פנים."]],
      [["Your password was stolen, but your account has two-factor authentication. Why is it still hard to break into?", "The thief also needs the code that is sent to your phone", ["Two-factor authentication changes your password every day", "The account shuts down for ever once a password is stolen", "Thieves are not allowed to use passwords they stole"], "With two-factor authentication a password alone is not enough: logging in also needs a second proof, such as a code sent to your phone. A thief who has only the password is stuck."],
        ["הסיסמה שלכם נגנבה, אבל בחשבון מופעל אימות דו־שלבי. למה עדיין קשה לפרוץ אליו?", "הגנב צריך גם את הקוד שנשלח לטלפון שלכם", ["אימות דו־שלבי מחליף את הסיסמה שלכם כל יום", "החשבון נסגר לתמיד ברגע שהסיסמה נגנבת", "אסור לגנבים להשתמש בסיסמאות שגנבו"], "באימות דו־שלבי סיסמה לבדה לא מספיקה: כדי להיכנס צריך גם הוכחה שנייה, כמו קוד שנשלח לטלפון. גנב שיש לו רק את הסיסמה נתקע."]],
    ],
  },
  a: {
    t: [
      ["Digital footprint", "the trail of information you leave online, which can last for years", "טביעת רגל דיגיטלית", "עקבות המידע שאתם משאירים ברשת, שיכולים להישאר שנים"],
      ["Encryption", "scrambling data so only someone with the right key can read it", "הצפנה", "ערבול מידע כך שרק מי שיש לו את המפתח המתאים יכול לקרוא אותו"],
      ["Malware", "software made to harm a device or steal data, like viruses and ransomware", "נוזקה", "תוכנה שנועדה להזיק למכשיר או לגנוב מידע, כמו וירוסים וכופרות"],
      ["Social engineering", "tricking people, rather than computers, into giving away access or information", "הנדסה חברתית", "הטעיה של אנשים, ולא של מחשבים, כדי לקבל גישה או מידע"],
    ],
    q: [
      [["What does the padlock and “https” in a browser address tell you?", "The connection to the site is encrypted", ["The site has been checked and is definitely honest", "The site cannot show ads or collect any data", "The site is run by the government or a bank"], "HTTPS protects data on the way, but a scam site can have it too — still check who runs the site."],
        ["מה אומרים המנעול ו־״https״ בשורת הכתובת?", "החיבור לאתר מוצפן", ["האתר נבדק והוא בוודאות אמין", "האתר לא יכול להציג פרסומות או לאסוף מידע", "האתר שייך לממשלה או לבנק"], "HTTPS מגן על המידע בדרך, אבל גם לאתר הונאה יכול להיות כזה — עדיין בודקים מי מפעיל את האתר."]],
      [["Why should you think before posting a photo, even in a private group?", "Anyone in the group can copy or forward it", ["Private groups delete every photo by themselves after a day", "Photos in a private group cannot be copied or saved", "Only adults can see what is posted in private groups"], "Once shared, you lose control: a screenshot or a forward can carry it anywhere, and it may stay online for years as part of your digital footprint."],
        ["למה כדאי לחשוב לפני שמפרסמים תמונה, אפילו בקבוצה פרטית?", "כל אחד בקבוצה יכול להעתיק אותה או להעביר אותה הלאה", ["קבוצות פרטיות מוחקות כל תמונה מעצמן אחרי יום אחד בלבד", "אי אפשר להעתיק או לשמור תמונות שנמצאות בקבוצה פרטית", "רק מבוגרים יכולים לראות את מה שמפרסמים בקבוצות פרטיות"], "אחרי השיתוף מאבדים שליטה: צילום מסך או העברה יכולים לקחת אותה לכל מקום, והיא יכולה להישאר ברשת שנים כחלק מטביעת הרגל הדיגיטלית."]],
      [["Someone phones, says they are from your internet company and asks for the code that was just texted to you, 'to fix your account'. What is this most likely?", "A trick to get into your account", ["A normal check that every internet company makes", "A friendly call from a real worker, so the code is safe to give", "A virus spreading through the phone line"], "Real companies never ask for a code that was sent to you: that code is the second proof that lets someone log in as you. Tricking people instead of computers is called social engineering; hang up and contact the company yourself."],
        ["מישהו מתקשר, אומר שהוא מחברת האינטרנט שלכם ומבקש את הקוד שנשלח אליכם עכשיו בהודעה, ״כדי לתקן את החשבון״. מה זה כנראה?", "תרגיל שנועד להיכנס לחשבון שלכם", ["בדיקה רגילה שכל חברת אינטרנט עושה", "שיחה ידידותית מעובד אמיתי, ולכן מותר למסור את הקוד", "וירוס שמתפשט דרך קו הטלפון"], "חברות אמיתיות אף פעם לא מבקשות קוד שנשלח אליכם: הקוד הזה הוא ההוכחה השנייה שמאפשרת למישהו להיכנס בשמכם. הטעיה של אנשים במקום מחשבים נקראת הנדסה חברתית; מנתקים ופונים לחברה בעצמכם."]],
    ],
    n: [
      [10000, ["A PIN code has 4 digits, and each digit can be anything from 0 to 9. How many different PIN codes are possible?", "", "Each digit has 10 choices, so there are 10 × 10 × 10 × 10 = 10,000 codes. A 6-digit code has 1,000,000, a hundred times as many, so a longer code is much harder to guess."],
        ["לקוד סודי יש 4 ספרות, וכל ספרה יכולה להיות כל מספר מ־0 עד 9. כמה קודים שונים אפשריים?", "", "לכל ספרה יש 10 אפשרויות, ולכן יש 10 × 10 × 10 × 10 = 10,000 קודים. לקוד בן 6 ספרות יש 1,000,000, פי מאה, ולכן הרבה יותר קשה לנחש קוד ארוך יותר."]],
    ],
  },
};
export default c;
