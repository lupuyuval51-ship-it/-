import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Email address", "the name that tells where a message should be delivered, like dana@example.com", "כתובת דואר אלקטרוני", "השם שקובע לאן תגיע ההודעה, למשל dana@example.com"],
      ["Inbox", "the folder where new emails arrive", "תיבת הדואר הנכנס", "התיקייה שאליה מגיעות הודעות חדשות"],
      ["Subject line", "a few words that tell what an email is about", "שורת הנושא", "כמה מילים שמספרות במה עוסקת ההודעה"],
      ["Attachment", "a file, such as a photo, sent together with an email", "קובץ מצורף", "קובץ, למשל תמונה, שנשלח יחד עם ההודעה"],
    ],
    q: [
      [["Which symbol is in every email address?", "@", ["#", "&", "%"], "Every email address has the at sign, @, between the user name and the name of the mail service, as in dana@example.com."],
        ["איזה סימן מופיע בכל כתובת דואר אלקטרוני?", "@", ["#", "&", "%"], "בכל כתובת דואר יש את הסימן @ (״שטרודל״), בין שם המשתמש לבין שם שירות הדואר, כמו ב־dana@example.com."]],
      [["In dana@example.com, what does the part after the @ show?", "The mail service or organisation", ["The user name of the person who owns it", "The password of the account", "The subject of the message"], "The part before the @ is the user name, and the part after it, the domain, names the mail service or organisation that handles the mail. A password is never part of an address."],
        ["בכתובת dana@example.com, מה מציין החלק שאחרי ה־@?", "את שירות הדואר או את הארגון", ["את שם המשתמש של מי שהכתובת שלו", "את הסיסמה של החשבון", "את הנושא של ההודעה"], "החלק שלפני ה־@ הוא שם המשתמש, והחלק שאחריו, הדומיין, מציין את שירות הדואר או את הארגון שמטפל בדואר. סיסמה אף פעם לא נמצאת בתוך כתובת."]],
      [["Which subject line is best for an email to your teacher about homework?", "Maths homework, page 12: a question", ["Hi! It's me again, can you help me?", "URGENT!!! PLEASE READ THIS NOW!!!", "(no subject)"], "A good subject line tells the reader in a few words what the email is about, so it is easy to find and answer. Shouting in capitals or leaving it empty does not help."],
        ["איזו שורת נושא הכי מתאימה להודעה למורה על שיעורי הבית?", "שיעורי בית במתמטיקה, עמוד 12: שאלה", ["היי! זה שוב אני, אפשר בבקשה קצת עזרה?", "דחוף!!! לקרוא את זה עכשיו!!!", "(ללא נושא)"], "שורת נושא טובה מספרת בכמה מילים במה עוסקת ההודעה, וכך קל למצוא אותה ולענות עליה. סימני קריאה רבים או נושא ריק לא עוזרים."]],
      [["A stranger emails you: you have won a prize, just send your password. What should you do?", "Do not reply, and tell a trusted adult", ["Click the link to find out what you won", "Reply with your password to get the prize", "Forward it to all your friends"], "No real prize ever needs your password. Messages like this try to trick you into giving away your account, so do not answer or click, and show it to an adult you trust."],
        ["מישהו שאתם לא מכירים כותב לכם: זכיתם בפרס, רק שלחו את הסיסמה שלכם. מה עושים?", "לא עונים, ומספרים למבוגר שסומכים עליו", ["לוחצים על הקישור כדי לראות במה זכיתם", "עונים עם הסיסמה כדי לקבל את הפרס", "מעבירים את ההודעה לכל החברים"], "פרס אמיתי אף פעם לא דורש סיסמה. הודעות כאלה מנסות לרמות אתכם כדי לקחת את החשבון שלכם, ולכן לא עונים ולא לוחצים, ומראים אותן למבוגר שאתם סומכים עליו."]],
      [["Where does an email usually go when you delete it?", "Into the trash folder for a while", ["Back to the person who sent it", "To the folder of emails you sent", "To every person in your contacts"], "Most email services first move deleted emails to a trash (bin) folder, where you can still rescue them for some time before they are removed for good."],
        ["לאן הולכת בדרך כלל הודעה שמוחקים?", "לתיקיית האשפה, לזמן מה", ["חזרה אל מי ששלח אותה", "לתיקיית ההודעות שנשלחו", "לכל אנשי הקשר שלכם"], "רוב שירותי הדואר מעבירים קודם הודעות שנמחקו לתיקיית האשפה, ושם אפשר עוד להציל אותן במשך זמן מה, לפני שהן נמחקות לתמיד."]],
    ],
    n: [
      [7, ["You have 25 new emails and you have read 18 of them. How many are still unread?", "", "25 − 18 = 7, so 7 emails are still waiting to be read."],
        ["קיבלתם 25 הודעות חדשות וקראתם 18 מהן. כמה הודעות עוד לא נקראו?", "", "25 − 18 = 7, ולכן 7 הודעות עדיין מחכות שיקראו אותן."]],
    ],
    s: [
      [["Send an email", "Open your email app", "Click Compose to start a new email", "Fill in the address, the subject and the message", "Check what you wrote", "Click Send"],
        ["שליחת הודעת דואר", "פותחים את אפליקציית הדואר", "לוחצים ״כתיבה״ כדי להתחיל הודעה חדשה", "ממלאים את הכתובת, את הנושא ואת ההודעה", "בודקים את מה שכתבתם", "לוחצים ״שליחה״"]],
    ],
  },
  i: {
    t: [
      ["CC", "short for carbon copy: a copy goes to another person, and everyone can see they got it", "העתק (CC)", "עותק של ההודעה שנשלח לאדם נוסף, וכל הנמענים רואים שהוא קיבל אותו"],
      ["BCC", "short for blind carbon copy: a copy goes to someone without the others seeing who got it", "העתק מוסתר (BCC)", "עותק שנשלח לאדם נוסף בלי ששאר הנמענים יראו מי קיבל אותו"],
      ["Reply all", "answering the sender and everyone else listed in To and CC", "השב לכולם", "תשובה לשולח ולכל מי שמופיע בשורות ״אל״ ו״העתק״"],
      ["Forward", "sending an email you received on to someone new", "העברה", "שליחה הלאה של הודעה שקיבלתם, אל אדם חדש"],
    ],
    q: [
      [["You email the whole class about a party, but people should not see each other's addresses. Where do you put the addresses?", "In the BCC field", ["In the CC field", "In the To field", "In the subject line"], "Addresses in BCC are hidden from the other receivers, so each person sees only their own. Addresses in To and CC can be seen by everyone who gets the email."],
        ["אתם שולחים לכל הכיתה הודעה על מסיבה, אבל אסור שהתלמידים יראו את הכתובות זה של זה. איפה שמים את הכתובות?", "בשדה ״העתק מוסתר״", ["בשדה ״העתק״", "בשדה ״אל״", "בשורת הנושא"], "כתובות בשדה ״העתק מוסתר״ מוסתרות משאר הנמענים, ולכן כל אחד רואה רק את הכתובת שלו. כתובות בשדות ״אל״ ו״העתק״ גלויות לכל מי שמקבל את ההודעה."]],
      [["Why might an email with a big video bounce back with an error?", "The attachment is bigger than the size limit", ["Videos can never be sent by email in any form", "The subject line was written too short", "Emails cannot be delivered at night"], "Most email services limit the size of attachments, often to about 20 to 25 MB. For bigger files, share a link from a cloud storage service instead."],
        ["למה הודעה עם סרטון גדול עלולה לחזור אליכם עם הודעת שגיאה?", "הקובץ המצורף גדול ממגבלת הגודל", ["אי אפשר לשלוח סרטונים בדואר בשום צורה", "שורת הנושא הייתה קצרה מדי", "אי אפשר למסור הודעות בלילה"], "רוב שירותי הדואר מגבילים את גודל הקבצים המצורפים, לרוב לבערך 20 עד 25 MB. לקבצים גדולים יותר שולחים במקום זאת קישור משירות אחסון בענן."]],
      [["What is spam?", "Unwanted mass emails", ["Emails you saved but have not sent yet", "Emails you have already opened and read", "Emails from your teachers about homework"], "Spam is unwanted email sent to huge numbers of people at once, usually adverts or tricks. Emails you saved but have not sent are called drafts."],
        ["מהו דואר זבל (ספאם)?", "הודעות המוניות לא רצויות", ["הודעות ששמרתם ועוד לא שלחתם", "הודעות שכבר פתחתם וקראתם", "הודעות מהמורים על שיעורי בית"], "דואר זבל הוא הודעות לא רצויות שנשלחות בבת אחת להמון אנשים, בדרך כלל פרסומות או תרמיות. הודעות ששמרתם ועוד לא שלחתם נקראות טיוטות."]],
      [["Which greeting is best for an email to your school's head teacher?", "Dear Ms Cohen,", ["Hey there, head teacher!!!", "Yo!", "(no greeting at all)"], "A polite email starts with a proper greeting and the person's name. Very casual greetings suit friends, not a head teacher."],
        ["איזו פתיחה מתאימה ביותר להודעה למנהלת בית הספר?", "שלום רב, גברת כהן,", ["היי מנהלת, מה קורה???", "יו!", "(בלי פתיחה בכלל)"], "הודעה מנומסת פותחת בברכה מתאימה ובשם של האדם. פתיחות מאוד חופשיות מתאימות לחברים, לא למנהלת בית הספר."]],
      [["What is the difference between Reply and Reply all?", "Reply answers only the sender; Reply all also answers everyone in To and CC", ["Reply all sends your answer to every single contact saved in your address book", "Reply answers everyone; Reply all answers only the sender", "There is no difference between the two buttons"], "Reply all is useful for group planning, but think before you use it: a message meant for one person can end up in many inboxes. Someone in BCC does not get another receiver's Reply all, because the others cannot see that address."],
        ["מה ההבדל בין ״השב״ לבין ״השב לכולם״?", "״השב״ עונה רק לשולח; ״השב לכולם״ עונה גם לכל מי שב״אל״ וב״העתק״", ["״השב לכולם״ שולח את התשובה לכל איש קשר ששמור אצלכם בפנקס הכתובות", "״השב״ עונה לכולם; ״השב לכולם״ עונה רק לשולח", "אין שום הבדל בין שני הכפתורים"], "״השב לכולם״ שימושי לתיאום בקבוצה, אבל חשבו לפני שאתם משתמשים בו: הודעה שנועדה לאדם אחד עלולה להגיע לתיבות של רבים. מי שקיבל העתק מוסתר לא מקבל ״השב לכולם״ של נמען אחר, כי שאר הנמענים לא רואים את הכתובת שלו."]],
    ],
    n: [
      [3, ["Your email service allows attachments up to 25 MB in total. Each photo is 7 MB. How many photos at most can you attach to one email?", "photos", "3 photos are 3 × 7 = 21 MB, which fits, but 4 photos are 28 MB, which is too big. So the answer is 3."],
        ["שירות הדואר שלכם מתיר קבצים מצורפים עד 25 MB בסך הכול. כל תמונה היא 7 MB. כמה תמונות לכל היותר אפשר לצרף להודעה אחת?", "תמונות", "3 תמונות הן 3 × 7 = 21 MB, וזה נכנס, אבל 4 תמונות הן 28 MB, וזה יותר מדי. לכן התשובה היא 3."]],
    ],
    s: [
      [["Attach a file to an email", "Start a new email", "Click the paper clip (Attach) button", "Choose the file on your device", "Wait until the file has finished uploading", "Click Send"],
        ["צירוף קובץ להודעת דואר", "פותחים הודעה חדשה", "לוחצים על סמל מהדק הנייר (צירוף)", "בוחרים את הקובץ במכשיר", "מחכים שהקובץ יסיים לעלות", "לוחצים ״שליחה״"]],
    ],
  },
  a: {
    t: [
      ["Phishing", "a fake message that pretends to come from a trusted company in order to steal passwords or money", "דיוג (פישינג)", "הודעה מזויפת שמתחזה לחברה מוכרת כדי לגנוב סיסמאות או כסף"],
      ["Spam filter", "a program that moves unwanted mass emails into a separate folder", "מסנן דואר זבל", "תוכנה שמעבירה הודעות המוניות לא רצויות לתיקייה נפרדת"],
      ["Email signature", "a few lines added automatically at the end of your emails, such as your name", "חתימה", "כמה שורות שמתווספות אוטומטית בסוף ההודעות שלכם, למשל השם שלכם"],
      ["Domain", "the part of an address after the @, which names the mail service or organisation", "דומיין", "החלק בכתובת שאחרי ה־@, שמציין את שירות הדואר או את הארגון"],
    ],
    q: [
      [["An email claims to be from your bank and asks you to “confirm your password” through a link. Which clue shows it is probably phishing?", "Banks do not ask for passwords by email", ["It shows the bank's real logo at the very top", "It arrived early in the morning", "It has a subject line"], "A real bank will never ask for your password in an email. A logo proves nothing, because anyone can copy a picture. Go to the bank's site yourself instead of clicking the link."],
        ["הודעה טוענת שהיא מהבנק שלכם ומבקשת ״לאשר את הסיסמה״ דרך קישור. איזה רמז מראה שזה כנראה דיוג?", "בנקים לא מבקשים סיסמאות בדואר", ["יש בה את הסמל האמיתי של הבנק בראש ההודעה", "היא הגיעה מוקדם בבוקר", "יש לה שורת נושא"], "בנק אמיתי לעולם לא יבקש את הסיסמה שלכם בהודעת דואר. סמל לא מוכיח כלום, כי כל אחד יכול להעתיק תמונה. היכנסו בעצמכם לאתר של הבנק במקום ללחוץ על הקישור."]],
      [["You send an email To: Noa, CC: Tal, BCC: Dad. Noa clicks Reply all. Who gets Noa's reply?", "You and Tal", ["You, Tal and Dad", "Only you", "Only Tal and Dad"], "Reply all goes to the sender and to everyone Noa can see in To and CC. Noa cannot see Dad's address, because BCC is hidden, so Dad gets nothing."],
        ["שלחתם הודעה אל: נועה, העתק: טל, העתק מוסתר: אבא. נועה לוחצת ״השב לכולם״. מי מקבל את התשובה של נועה?", "אתם וטל", ["אתם, טל ואבא", "רק אתם", "רק טל ואבא"], "״השב לכולם״ נשלח לשולח ולכל מי שנועה רואה בשורות ״אל״ ו״העתק״. נועה לא רואה את הכתובת של אבא, כי העתק מוסתר נסתר ממנה, ולכן אבא לא מקבל כלום."]],
      [["Why is it risky to open an attachment named invoice.pdf.exe from a stranger?", "It is a program pretending to be a PDF", ["It is a PDF that may be too big to open", "It is a picture that may contain rude words", "It is a document full of spelling mistakes"], "The real file type is the last part, .exe, which means a program that could install harmful software. The fake “.pdf” in the middle tries to make it look like a harmless document."],
        ["למה מסוכן לפתוח קובץ מצורף בשם invoice.pdf.exe שהגיע מאדם זר?", "זו תוכנה שמתחפשת לקובץ PDF", ["זה קובץ PDF שאולי גדול מדי לפתיחה", "זו תמונה שאולי יש בה מילים גסות", "זה מסמך מלא בשגיאות כתיב"], "סוג הקובץ האמיתי נקבע לפי הסיומת האחרונה, exe, שפירושה תוכנה שיכולה להתקין משהו מזיק. הסיומת pdf המזויפת שבאמצע מנסה לגרום לקובץ להיראות כמו מסמך תמים."]],
      [["You wrote an angry email. What is the wise thing to do before sending it?", "Wait, read it again calmly, then decide", ["Send it at once while you still feel strongly", "Send it to everyone with Reply all", "Add more capital letters so it is clear"], "Once an email is sent you usually cannot take it back, and it can be forwarded to others. Waiting a little often leads to a calmer, kinder message, or to not sending it at all."],
        ["כתבתם הודעה בכעס. מה הדבר החכם לעשות לפני ששולחים אותה?", "לחכות, לקרוא אותה שוב ברוגע ואז להחליט", ["לשלוח מיד, כל עוד הרגש עדיין חזק", "לשלוח אותה לכולם עם ״השב לכולם״", "להוסיף עוד סימני קריאה כדי שיהיה ברור"], "אחרי ששולחים הודעה בדרך כלל אי אפשר להחזיר אותה, ואפשר גם להעביר אותה לאחרים. המתנה קצרה מובילה לעיתים קרובות להודעה רגועה ואדיבה יותר, או להחלטה לא לשלוח אותה בכלל."]],
      [["What does Unsubscribe at the bottom of a newsletter you signed up for do?", "Stops that newsletter coming to you", ["Deletes your whole email account", "Sends the newsletter to all your friends", "Marks every email in your inbox as read"], "Unsubscribe takes your address off that sender's mailing list. In a suspicious email it is safer not to click anything and to mark it as spam instead."],
        ["מה עושה הקישור ״הסרה מרשימת התפוצה״ בתחתית ידיעון שנרשמתם אליו?", "מפסיק את המשלוח של הידיעון אליכם", ["מוחק את כל חשבון הדואר שלכם", "שולח את הידיעון לכל החברים שלכם", "מסמן כל הודעה בתיבה כנקראה"], "ההסרה מוציאה את הכתובת שלכם מרשימת התפוצה של השולח. בהודעה חשודה בטוח יותר לא ללחוץ על שום דבר ולסמן אותה כדואר זבל."]],
    ],
    n: [
      [180, ["A school newsletter goes to 1,200 people and 15% of them open it. How many people open it?", "people", "15% of 1,200 is 0.15 × 1,200 = 180, so 180 people open it."],
        ["ידיעון של בית הספר נשלח ל־1,200 אנשים, ו־15% מהם פותחים אותו. כמה אנשים פותחים אותו?", "אנשים", "15% מתוך 1,200 הם 0.15 × 1,200 = 180, ולכן 180 אנשים פותחים אותו."]],
    ],
    s: [
      [["What happens after you click Send, in order", "Your email app hands the message to your mail server", "Your server looks up the server for the domain after the @", "It passes the message on to the receiver's mail server", "That server stores the message in the receiver's inbox", "The receiver opens it in their own email app"],
        ["מה קורה אחרי שלוחצים ״שליחה״, לפי הסדר", "אפליקציית הדואר מוסרת את ההודעה לשרת הדואר שלכם", "השרת שלכם מחפש את השרת של הדומיין שאחרי ה־@", "הוא מעביר את ההודעה לשרת הדואר של הנמען", "השרת ההוא שומר את ההודעה בתיבת הדואר של הנמען", "הנמען פותח אותה באפליקציית הדואר שלו"]],
    ],
  },
};
export default c;
