import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Bit", "the smallest unit of data: a single 0 or 1", "ביט", "יחידת המידע הקטנה ביותר: 0 או 1 בודד"],
      ["Byte", "a group of 8 bits, enough to store one simple character such as the letter A", "בית (בייט)", "קבוצה של 8 ביטים, שמספיקה כדי לשמור תו פשוט אחד, כמו האות A"],
      ["Megabyte (MB)", "about a million bytes; a photo from a phone is often a few of these", "מגהבייט (MB)", "בערך מיליון בתים; תמונה מטלפון היא לרוב כמה כאלה"],
      ["Download", "copying a file from the internet onto your own device", "הורדה", "העתקה של קובץ מהאינטרנט אל המכשיר שלכם"],
    ],
    q: [
      [["Which unit is the largest?", "Terabyte", ["Gigabyte", "Megabyte", "Kilobyte"], "From small to large the units go kilobyte, megabyte, gigabyte, terabyte. Each step is about 1,000 times bigger, so a terabyte is about a million megabytes."],
        ["איזו יחידה היא הגדולה ביותר?", "טרהבייט", ["גיגהבייט", "מגהבייט", "קילובייט"], "מהקטנה לגדולה היחידות הן קילובייט, מגהבייט, גיגהבייט וטרהבייט. כל שלב גדול בערך פי 1,000, ולכן טרהבייט הוא בערך מיליון מגהבייט."]],
      [["Which of these usually takes up the most storage space?", "A two-hour HD film", ["A three-minute song", "A photo from a phone", "A short text message"], "An HD film is usually a few gigabytes, while a song or a phone photo is a few megabytes and a short text message is less than a kilobyte."],
        ["מה מבין אלה תופס בדרך כלל הכי הרבה מקום אחסון?", "סרט HD של שעתיים", ["שיר של שלוש דקות", "תמונה ממצלמת הטלפון", "הודעת טקסט קצרה"], "סרט HD תופס בדרך כלל כמה גיגהבייט, שיר או תמונה מטלפון תופסים כמה מגהבייט, והודעת טקסט קצרה תופסת פחות מקילובייט."]],
      [["In which unit is internet speed usually measured?", "Megabits per second", ["Megabytes per minute", "Kilometres per hour", "Pixels per inch"], "Internet providers give speeds in megabits per second (Mbps): how many millions of bits arrive each second. Kilometres per hour measure the speed of cars, and pixels per inch measure how sharp a screen is."],
        ["באיזו יחידה מודדים בדרך כלל מהירות אינטרנט?", "מגהביט לשנייה", ["מגהבייט לדקה", "קילומטר לשעה", "פיקסלים לאינץ׳"], "ספקיות האינטרנט מציינות מהירות במגהביט לשנייה (Mbps): כמה מיליוני ביטים מגיעים בכל שנייה. קילומטר לשעה מודד מהירות של מכוניות, ופיקסלים לאינץ׳ מודדים כמה חד המסך."]],
      [["Your phone says “Storage almost full”. What has run out?", "Space to keep files and apps", ["The speed of your internet connection", "The charge left in the battery", "Credit for calls and messages"], "Storage is the phone's memory for keeping photos, videos, apps and other files. Deleting or moving files frees space; it has nothing to do with the battery or the internet speed."],
        ["הטלפון מודיע ״האחסון כמעט מלא״. מה נגמר?", "מקום לשמירת קבצים ואפליקציות", ["המהירות של חיבור האינטרנט שלכם", "הטעינה שנשארה בסוללה", "יתרת השיחות וההודעות"], "האחסון הוא הזיכרון של הטלפון לשמירת תמונות, סרטונים, אפליקציות וקבצים אחרים. מחיקה או העברה של קבצים מפנה מקום; זה לא קשור לסוללה או למהירות האינטרנט."]],
      [["Sending a video from your phone to a website is called what?", "Uploading", ["Downloading", "Printing", "Deleting"], "Uploading sends data from your device up to the internet; downloading brings data from the internet down to your device."],
        ["איך קוראים לשליחת סרטון מהטלפון שלכם אל אתר אינטרנט?", "העלאה", ["הורדה", "הדפסה", "מחיקה"], "העלאה שולחת מידע מהמכשיר שלכם אל האינטרנט, והורדה מביאה מידע מהאינטרנט אל המכשיר שלכם."]],
    ],
    n: [
      [8, ["How many bits are in one byte?", "", "A byte is a group of 8 bits. With 8 bits there are 256 different patterns of 0s and 1s, enough for one simple character."],
        ["כמה ביטים יש בבית (בייט) אחד?", "", "בית הוא קבוצה של 8 ביטים. ב־8 ביטים יש 256 צירופים שונים של 0 ו־1, וזה מספיק לתו פשוט אחד."]],
      [2000, ["A memory card holds 4 GB and each photo is 2 MB. Counting 1 GB as 1,000 MB, how many photos fit?", "", "4 GB = 4,000 MB, and 4,000 ÷ 2 = 2,000, so 2,000 photos fit on the card."],
        ["כרטיס זיכרון מכיל 4 GB, וכל תמונה היא 2 MB. אם 1 GB הוא 1,000 MB, כמה תמונות ייכנסו?", "", "4 GB הם 4,000 MB, ו־4,000 ÷ 2 = 2,000, ולכן ייכנסו לכרטיס 2,000 תמונות."]],
    ],
    s: [
      [["From the smallest unit to the largest", "Bit", "Byte", "Kilobyte", "Megabyte", "Gigabyte", "Terabyte"],
        ["מהיחידה הקטנה ביותר אל הגדולה ביותר", "ביט", "בית (בייט)", "קילובייט", "מגהבייט", "גיגהבייט", "טרהבייט"]],
    ],
  },
  i: {
    t: [
      ["Bandwidth", "the largest amount of data a connection can carry each second", "רוחב פס", "כמות המידע הגדולה ביותר שחיבור יכול להעביר בכל שנייה"],
      ["Mbps", "millions of bits moving each second: the usual unit of internet speed", "מגהביט לשנייה (Mbps)", "מיליוני ביטים שעוברים בכל שנייה: היחידה הרגילה של מהירות אינטרנט"],
      ["Upload", "sending data from your device to the internet", "העלאה", "שליחת מידע מהמכשיר שלכם אל האינטרנט"],
      ["Streaming", "playing video or music while it is still arriving, without keeping the whole file", "הזרמה (סטרימינג)", "ניגון של וידאו או מוזיקה בזמן שהם עדיין מגיעים, בלי לשמור את הקובץ כולו"],
    ],
    q: [
      [["An internet plan says 100 Mbps. What does the small b mean?", "Bits: 12.5 megabytes per second", ["Bytes: exactly 100 megabytes per second", "Bits: 800 megabytes per second", "Bytes: 800 megabits per second"], "A small b means bits and a capital B means bytes. There are 8 bits in a byte, so 100 megabits per second is 100 ÷ 8 = 12.5 megabytes per second."],
        ["חבילת אינטרנט מבטיחה 100 Mbps. מה פירוש האות b הקטנה?", "ביטים: 12.5 מגהבייט לשנייה", ["בתים: בדיוק 100 מגהבייט לשנייה", "ביטים: 800 מגהבייט לשנייה", "בתים: 800 מגהביט לשנייה"], "b קטנה פירושה ביטים, ו־B גדולה פירושה בתים. בכל בית יש 8 ביטים, ולכן 100 מגהביט לשנייה הם 100 ÷ 8 = 12.5 מגהבייט לשנייה."]],
      [["Why does uploading a video often take longer than downloading one of the same size?", "Home upload speeds are often slower than download speeds", ["A file grows much bigger while it is being uploaded to a site", "Every upload must send each part of the file twice over", "Websites accept uploads only at certain times of day"], "Many home connections are built to download faster than they upload, because most people download much more than they upload. Files do not grow when they are uploaded."],
        ["למה העלאת סרטון לוקחת לעיתים קרובות יותר זמן מהורדת סרטון באותו גודל?", "בחיבורים ביתיים רבים ההעלאה איטית מההורדה", ["הקובץ גדל מאוד בזמן שמעלים אותו לאתר", "בכל העלאה צריך לשלוח כל חלק של הקובץ פעמיים", "אתרים מקבלים העלאות רק בשעות מסוימות ביום"], "חיבורים ביתיים רבים בנויים להורדה מהירה יותר מהעלאה, כי רוב האנשים מורידים הרבה יותר משהם מעלים. קבצים לא גדלים כשמעלים אותם."]],
      [["A plain text file holds 2,000 characters, each stored in 1 byte. About how big is it?", "About 2 KB", ["About 16 KB", "About 2 MB", "About 2 GB"], "2,000 characters × 1 byte = 2,000 bytes, which is about 2 kilobytes. 16 would be the number of kilobits, because each byte has 8 bits."],
        ["קובץ טקסט פשוט מכיל 2,000 תווים, וכל תו נשמר בבית אחד. בערך מה גודל הקובץ?", "בערך 2 KB", ["בערך 16 KB", "בערך 2 MB", "בערך 2 GB"], "2,000 תווים × בית אחד = 2,000 בתים, שהם בערך 2 קילובייט. 16 הוא מספר הקילוביטים, כי בכל בית יש 8 ביטים."]],
      [["In an online game, what does the ping (latency) measure?", "How long data takes to reach the server and come back", ["How much data the game has downloaded since it began", "How many players are online in the game right now", "How many pictures the screen shows each second"], "Ping is a time, measured in milliseconds: how long a tiny message takes to travel to the game server and back. A low ping means the game reacts quickly."],
        ["במשחק רשת, מה מודד הפינג (זמן ההשהיה)?", "כמה זמן לוקח למידע להגיע לשרת ולחזור", ["כמה מידע המשחק הוריד מאז שהתחלתם לשחק", "כמה שחקנים מחוברים עכשיו למשחק", "כמה תמונות המסך מציג בכל שנייה"], "פינג הוא זמן, שנמדד באלפיות שנייה: כמה זמן לוקח להודעה קטנטנה להגיע לשרת המשחק ולחזור. פינג נמוך פירושו שהמשחק מגיב מהר."]],
      [["Why does streaming a film in 4K use more data than in standard quality?", "Every frame has far more pixels, so more bits are sent", ["The 4K film is longer than the same film in standard quality", "A 4K film must be sent twice so that no part of it gets lost", "A 4K film travels along a longer route through the internet"], "A 4K frame has 3840 × 2160 pixels, more than 8 million, many times more than standard quality. More detail in every frame means more bits every second."],
        ["למה צפייה בהזרמה של סרט באיכות 4K צורכת יותר נתונים מאשר באיכות רגילה?", "בכל פריים יש הרבה יותר פיקסלים", ["סרט 4K ארוך יותר מאותו סרט באיכות רגילה", "סרט 4K נשלח פעמיים כדי שאף חלק לא ילך לאיבוד", "סרט 4K עובר במסלול ארוך יותר ברשת האינטרנט"], "בכל פריים של 4K יש 3840 × 2160 פיקסלים, יותר מ־8 מיליון, פי כמה וכמה מאשר באיכות רגילה. יותר פרטים בכל פריים פירושם יותר ביטים בכל שנייה."]],
    ],
    n: [
      [60, ["A 600 MB game downloads at 10 megabytes per second. How many seconds does it take?", "seconds", "600 ÷ 10 = 60, so the download takes 60 seconds, which is exactly one minute."],
        ["משחק בגודל 600 MB יורד במהירות של 10 מגהבייט לשנייה. כמה שניות זה לוקח?", "שניות", "600 ÷ 10 = 60, ולכן ההורדה לוקחת 60 שניות, שהן בדיוק דקה אחת."]],
      [200, ["How many 5 MB songs fit into 1 GB, counting 1 GB as 1,000 MB?", "songs", "1,000 ÷ 5 = 200, so 200 songs of 5 MB fit into 1 GB."],
        ["כמה שירים בגודל 5 MB נכנסים ב־1 GB, אם 1 GB הוא 1,000 MB?", "שירים", "1,000 ÷ 5 = 200, ולכן ב־1 GB נכנסים 200 שירים של 5 MB."]],
    ],
    s: [
      [["From the slowest connection to the fastest", "56 kilobits per second", "8 megabits per second", "100 megabits per second", "1 gigabit per second"],
        ["מהחיבור האיטי ביותר אל המהיר ביותר", "56 קילוביט לשנייה", "8 מגהביט לשנייה", "100 מגהביט לשנייה", "1 גיגהביט לשנייה"]],
    ],
  },
  a: {
    t: [
      ["Kibibyte (KiB)", "exactly 1,024 bytes; computers often show this unit simply as KB", "קיביבייט (KiB)", "בדיוק 1,024 בתים; מחשבים מציגים את היחידה הזאת לעיתים קרובות פשוט כ־KB"],
      ["Compression", "making a file smaller by storing its data in a shorter way", "דחיסה", "הקטנה של קובץ על ידי שמירת הנתונים שלו בדרך קצרה יותר"],
      ["Lossy compression", "shrinking a file by throwing away details people barely notice, as in JPEG and MP3", "דחיסה עם אובדן מידע", "הקטנת קובץ על ידי השמטת פרטים שבני אדם כמעט לא מבחינים בהם, כמו ב־JPEG וב־MP3"],
      ["Lossless compression", "shrinking a file so that the original can be rebuilt exactly, as in ZIP and PNG", "דחיסה ללא אובדן מידע", "הקטנת קובץ באופן שמאפשר לשחזר בדיוק את המקור, כמו ב־ZIP וב־PNG"],
    ],
    q: [
      [["A new 1 TB drive shows only about 931 GB on a computer. Why?", "The maker counts in 1,000s, but the computer counts in 1,024s", ["Hidden files from the factory always fill about 69 GB", "The drive loses a little space every time it is switched on", "The cable cannot reach the last part of the drive"], "The maker's 1 TB is 1,000,000,000,000 bytes. Dividing by 1,024 three times gives about 931, so a computer that counts in 1,024s shows about 931 GB."],
        ["במחשב, כונן חדש של 1 TB מוצג בגודל של כ־931 GB בלבד. למה?", "היצרן סופר באלפים, והמחשב סופר ביחידות של 1,024", ["קבצים נסתרים מהמפעל תמיד תופסים בערך 69 GB", "הכונן מאבד קצת מקום בכל פעם שמדליקים אותו", "הכבל לא מגיע לחלק האחרון של הכונן"], "ה־1 TB של היצרן הוא 1,000,000,000,000 בתים. כשמחלקים ב־1,024 שלוש פעמים מקבלים בערך 931, ולכן מחשב שסופר ביחידות של 1,024 מציג בערך 931 GB."]],
      [["Which kind of compression must be used for a program file?", "Lossless: every bit of a program must come back exactly", ["Lossy: a program still runs if a few details are removed", "Lossy: smaller program files always run more quickly", "None: program files can never be compressed at all"], "Changing even one bit of a program can stop it working, so it may only be squeezed with lossless compression such as ZIP. Lossy compression suits photos and music, where tiny losses are hard to notice."],
        ["באיזו דחיסה חייבים להשתמש בקובץ של תוכנה?", "ללא אובדן מידע: כל ביט בתוכנה חייב לחזור בדיוק", ["עם אובדן מידע: התוכנה תרוץ גם אם יחסרו כמה פרטים", "עם אובדן מידע: תוכנות קטנות תמיד רצות מהר יותר", "בלי דחיסה: אי אפשר לדחוס קבצים של תוכנות בכלל"], "שינוי של ביט אחד בלבד יכול לגרום לתוכנה להפסיק לעבוד, ולכן מותר לדחוס אותה רק בדחיסה ללא אובדן מידע, כמו ZIP. דחיסה עם אובדן מידע מתאימה לתמונות ולמוזיקה, שבהן קשה להבחין באובדן קטן."]],
      [["A photo is saved again and again as JPEG and starts to look blocky. Why?", "JPEG is lossy, so each save can lose more detail", ["JPEG files grow bigger each time until the photo breaks", "The screen wears out from showing the same photo", "Saving a file always removes one colour from it"], "JPEG drops some fine detail every time the picture is compressed again, so the small losses add up. A lossless format such as PNG keeps the picture exactly the same."],
        ["תמונה נשמרת שוב ושוב כ־JPEG ומתחילה להיראות ״מרובעת״. למה?", "JPEG מאבד מידע, ולכן כל שמירה יכולה להוריד עוד פרטים", ["קובצי JPEG גדלים בכל שמירה עד שהתמונה נשברת", "המסך נשחק מכך שהוא מציג את אותה תמונה", "כל שמירה של קובץ מוחקת ממנו צבע אחד"], "JPEG משמיט מעט פרטים עדינים בכל פעם שהתמונה נדחסת מחדש, וההפסדים הקטנים מצטברים. פורמט ללא אובדן מידע, כמו PNG, שומר על התמונה בדיוק כפי שהייתה."]],
      [["Which is faster: 1 gigabit per second or 100 megabytes per second?", "1 gigabit per second", ["100 megabytes per second", "They are exactly the same speed"], "1 gigabit is 1,000 megabits, and 1,000 ÷ 8 = 125 megabytes. So 1 gigabit per second is 125 megabytes per second, which is more than 100."],
        ["מה מהיר יותר: 1 גיגהביט לשנייה או 100 מגהבייט לשנייה?", "1 גיגהביט לשנייה", ["100 מגהבייט לשנייה", "המהירויות זהות בדיוק"], "1 גיגהביט הוא 1,000 מגהביט, ו־1,000 ÷ 8 = 125 מגהבייט. כלומר 1 גיגהביט לשנייה הוא 125 מגהבייט לשנייה, יותר מ־100."]],
      [["Zipping a text document makes it much smaller, but zipping a JPEG photo hardly helps. Why?", "The JPEG is already compressed", ["ZIP can only shrink files that hold text", "Photos are protected so they cannot be zipped", "ZIP makes every file exactly half its size"], "Compression works by finding repeated patterns. Text has many of them, but a JPEG has already been compressed, so there is little repetition left to remove."],
        ["דחיסת ZIP של מסמך טקסט מקטינה אותו מאוד, אבל דחיסת ZIP של תמונת JPEG כמעט לא עוזרת. למה?", "תמונת ה־JPEG כבר דחוסה", ["ZIP יודע לכווץ רק קבצים שיש בהם טקסט", "תמונות מוגנות ולכן אי אפשר לדחוס אותן", "ZIP מקטין כל קובץ בדיוק לחצי מגודלו"], "דחיסה עובדת בעזרת מציאת דפוסים שחוזרים על עצמם. בטקסט יש הרבה כאלה, אבל JPEG כבר נדחס, ולכן כמעט לא נשארה בו חזרה שאפשר להסיר."]],
    ],
    n: [
      [10, ["How many seconds does it take to download a 50 MB file at 40 Mbps?", "seconds", "50 MB × 8 = 400 megabits, and 400 ÷ 40 = 10, so it takes 10 seconds.", "First change megabytes into megabits."],
        ["כמה שניות לוקח להוריד קובץ של 50 MB במהירות של 40 Mbps?", "שניות", "50 MB × 8 = 400 מגהביט, ו־400 ÷ 40 = 10, ולכן זה לוקח 10 שניות.", "קודם המירו מגהבייט למגהביט."]],
      [2250, ["A video streams at 5 Mbps for 1 hour. How many megabytes of data is that?", "MB", "1 hour is 3,600 seconds, so 5 × 3,600 = 18,000 megabits, and 18,000 ÷ 8 = 2,250 MB, about 2.25 GB."],
        ["סרטון מוזרם במהירות של 5 Mbps במשך שעה. כמה מגהבייט של נתונים זה?", "MB", "בשעה יש 3,600 שניות, ולכן 5 × 3,600 = 18,000 מגהביט, ו־18,000 ÷ 8 = 2,250 MB, בערך 2.25 GB."]],
    ],
  },
};
export default c;
