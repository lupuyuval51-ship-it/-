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
      [["Someone you met in a game asks for your home address. What should you do?", "Not share it, and tell a trusted adult", ["Share it if they seem nice", "Share only the street name", "Send a photo of your house instead"], "Never give personal information to people you only know online; telling an adult keeps you safe."],
        ["מישהו שהכרתם במשחק מבקש את כתובת הבית שלכם. מה עושים?", "לא משתפים, ומספרים למבוגר אמין", ["משתפים אם הוא נראה נחמד", "משתפים רק את שם הרחוב", "שולחים במקום זה תמונה של הבית"], "אף פעם לא מוסרים מידע אישי לאנשים שמכירים רק מהרשת; סיפור למבוגר שומר עליכם."]],
      [["Who should know your password?", "Only you (and a parent, for young children)", ["Your best friend", "Anyone who asks politely", "Everyone in your class"], "A shared password can be misused, even by accident; keep it to yourself and your parents."],
        ["מי צריך לדעת את הסיסמה שלכם?", "רק אתם (ובגיל צעיר — גם ההורים)", ["החבר הכי טוב", "כל מי שמבקש יפה", "כל הכיתה"], "סיסמה ששותפה יכולה לשמש לרעה, אפילו בטעות; שמרו אותה לעצמכם ולהוריכם."]],
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
      [["Which password is the strongest?", "a long passphrase like “purple-cactus-rides-9-trains”", ["123456", "your name and birthday", "password"], "Long, unusual phrases are hard to guess; names, birthdays and common words are tried first by attackers."],
        ["איזו סיסמה הכי חזקה?", "צירוף ארוך כמו ״purple-cactus-rides-9-trains״", ["123456", "השם ותאריך הלידה שלכם", "password"], "צירופים ארוכים ולא צפויים קשים לניחוש; שמות, תאריכי לידה ומילים נפוצות הם הדברים הראשונים שתוקפים מנסים."]],
      [["A message says “Your account will be closed! Click here and enter your password.” This is probably…", "phishing", ["a normal security update", "a prize", "a message from a friend"], "Urgent threats plus a request for your password are classic signs of phishing; go to the real site yourself instead."],
        ["הודעה אומרת: ״החשבון שלך ייסגר! לחצו כאן והקלידו את הסיסמה.״ זה כנראה…", "ניסיון דיוג (פישינג)", ["עדכון אבטחה רגיל", "פרס", "הודעה מחבר"], "איום דחוף יחד עם בקשת סיסמה הם סימנים מובהקים של דיוג; היכנסו לאתר האמיתי בעצמכם."]],
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
      [["What does the padlock and “https” in a browser address tell you?", "The connection to the site is encrypted", ["The site is definitely honest", "The site has no ads", "The site is run by the government"], "HTTPS protects data on the way, but a scam site can have it too — still check who runs the site."],
        ["מה אומרים המנעול ו־״https״ בשורת הכתובת?", "החיבור לאתר מוצפן", ["האתר בוודאות אמין", "אין באתר פרסומות", "האתר שייך לממשלה"], "HTTPS מגן על המידע בדרך, אבל גם לאתר הונאה יכול להיות כזה — עדיין בודקים מי מפעיל את האתר."]],
      [["Why should you think before posting a photo, even in a private group?", "Anyone in the group can copy or share it, and it may stay online for years", ["Private groups delete photos after a day", "Photos cannot be copied", "Only adults can see private groups"], "Once shared, you lose control: screenshots and forwards are part of your digital footprint."],
        ["למה כדאי לחשוב לפני שמפרסמים תמונה, אפילו בקבוצה פרטית?", "כל אחד בקבוצה יכול להעתיק או להפיץ אותה, והיא יכולה להישאר ברשת שנים", ["קבוצות פרטיות מוחקות תמונות אחרי יום", "אי אפשר להעתיק תמונות", "רק מבוגרים רואים קבוצות פרטיות"], "אחרי השיתוף מאבדים שליטה: צילומי מסך והעברות הופכים לחלק מטביעת הרגל הדיגיטלית."]],
    ],
  },
};
export default c;
