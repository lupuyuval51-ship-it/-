import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Internet", "a worldwide network that connects millions of computers", "אינטרנט", "רשת עולמית שמחברת מיליוני מחשבים"],
      ["Website", "a set of web pages under one address", "אתר אינטרנט", "אוסף של דפי רשת תחת כתובת אחת"],
      ["Browser", "a program for viewing web pages", "דפדפן", "תוכנה להצגת דפי רשת"],
      ["Wi-Fi", "a way of connecting devices to a network without cables, using radio waves", "Wi-Fi", "דרך לחבר מכשירים לרשת בלי כבלים, בעזרת גלי רדיו"],
    ],
    q: [
      [["Is the internet the same as the World Wide Web?", "No — the web is one service on the internet", ["Yes, they are two names for exactly the same thing", "No — the internet is a service that runs on the web", "No — the web is older than the internet"], "The internet is the network; the web (pages and links) is one of many services on it, like email."],
        ["האם האינטרנט והרשת העולמית (Web) הם אותו דבר?", "לא — ה־Web הוא שירות אחד באינטרנט", ["כן, אלה שני שמות לאותו דבר בדיוק", "לא — האינטרנט הוא שירות שפועל על גבי ה־Web", "לא — ה־Web ותיק יותר מהאינטרנט"], "האינטרנט הוא הרשת; ה־Web (דפים וקישורים) הוא אחד משירותים רבים בה, כמו דואר אלקטרוני."]],
      [["What does clicking a link usually do?", "Opens another page or place", ["Downloads the whole website onto your computer", "Deletes the page you are reading", "Turns the computer off"], "A link holds the address of another page, and clicking it tells the browser to open that address. Links joining pages to one another are what make it a web."],
        ["מה בדרך כלל קורה כשלוחצים על קישור?", "נפתח דף או מקום אחר", ["כל האתר יורד ונשמר במחשב שלכם", "הדף שאתם קוראים נמחק", "המחשב נכבה"], "קישור מחזיק את הכתובת של דף אחר, ולחיצה עליו אומרת לדפדפן לפתוח את הכתובת הזאת. קישורים שמחברים בין דפים הם מה שהופך את זה לרשת."]],
      [["Is Wi-Fi the same as the internet?", "No: Wi-Fi only links you to the router", ["Yes: Wi-Fi is just another name for the internet", "No: Wi-Fi is a website you visit to get online", "Yes, but only when you are outdoors"], "Wi-Fi is a short-range radio link from your device to a router, the box that passes the data on to the internet. If the router loses its internet connection, the Wi-Fi signal still shows, but no pages load."],
        ["האם Wi-Fi והאינטרנט הם אותו דבר?", "לא: Wi-Fi רק מחבר אתכם לנתב", ["כן: Wi-Fi הוא פשוט שם אחר לאינטרנט", "לא: Wi-Fi הוא אתר שנכנסים אליו כדי להתחבר", "כן, אבל רק כשנמצאים בחוץ"], "Wi-Fi הוא קשר רדיו לטווח קצר בין המכשיר שלכם לנתב, הקופסה שמעבירה את הנתונים הלאה לאינטרנט. אם הנתב מאבד את החיבור לאינטרנט, עדיין רואים קליטת Wi-Fi, אבל שום דף לא נטען."]],
      [["Every website has an address. Which of these is a website address?", "www.example.com", ["hello@example.com", "@example", "#example"], "A website address, typed into the browser's address bar, often starts with www and ends with an ending such as .com or .co.il. hello@example.com has an @ sign, so it is an email address."],
        ["לכל אתר יש כתובת. איזו מהאלה היא כתובת של אתר?", "www.example.com", ["hello@example.com", "@example", "#example"], "כתובת של אתר, שמקלידים בשורת הכתובת של הדפדפן, מתחילה לעיתים קרובות ב־www ונגמרת בסיומת כמו .com או .co.il. ב־hello@example.com יש את הסימן @, ולכן זו כתובת של דואר אלקטרוני."]],
    ],
  },
  i: {
    t: [
      ["URL", "the address of a web page, like https://example.com/page", "כתובת URL", "הכתובת של דף רשת, כמו https://example.com/page"],
      ["IP address", "a number that identifies a device on a network", "כתובת IP", "מספר שמזהה מכשיר ברשת"],
      ["Router", "a device that passes data between networks, for example between your home and the internet", "נתב", "מכשיר שמעביר נתונים בין רשתות, למשל בין הבית לאינטרנט"],
      ["Server", "a computer that stores websites or services and sends them to other computers", "שרת", "מחשב ששומר אתרים או שירותים ושולח אותם למחשבים אחרים"],
    ],
    q: [
      [["What does a DNS server do?", "Turns a name like example.com into an IP address", ["Stores a copy of every website so that pages load faster", "Gives your computer a fast connection to the internet", "Blocks every advert before it reaches your screen"], "DNS works like a phone book for the internet: you give it a name such as example.com, and it answers with the number, the IP address, that computers use to reach the site."],
        ["מה עושה שרת DNS?", "מתרגם שם כמו example.com לכתובת IP", ["שומר עותק של כל אתר כדי שדפים ייטענו מהר יותר", "נותן למחשב שלכם חיבור מהיר לאינטרנט", "חוסם כל פרסומת לפני שהיא מגיעה למסך"], "DNS פועל כמו ספר טלפונים של האינטרנט: נותנים לו שם כמו example.com, והוא עונה עם המספר, כתובת ה־IP, שבעזרתו מחשבים מגיעים לאתר."]],
      [["Who invented the World Wide Web, around 1989–1991?", "Tim Berners-Lee", ["Mark Zuckerberg", "Bill Gates", "Alan Turing", "Steve Jobs"], "Tim Berners-Lee, working at CERN, created the web, HTML and the first browser. Mark Zuckerberg started Facebook much later, in 2004, on top of the web."],
        ["מי המציא את ה־World Wide Web, בסביבות 1989–1991?", "טים ברנרס־לי", ["מארק צוקרברג", "ביל גייטס", "אלן טיורינג", "סטיב ג׳ובס"], "טים ברנרס־לי, שעבד ב־CERN, יצר את ה־Web, את HTML ואת הדפדפן הראשון. מארק צוקרברג הקים את פייסבוק הרבה יותר מאוחר, ב־2004, על גבי ה־Web."]],
      [["In the address https://example.com/games, what does the part example.com tell the browser?", "Which website to go to", ["Which page on the website to open", "That the connection is encrypted", "Which country made the website"], "A web address has parts: https is the protocol, here the secure one; example.com is the domain name, which says which website to visit; and /games is the page or place on that site."],
        ["בכתובת https://example.com/games, מה אומר לדפדפן החלק example.com?", "לאיזה אתר להיכנס", ["איזה דף באתר לפתוח", "שהחיבור מוצפן", "איזו מדינה בנתה את האתר"], "לכתובת של אתר יש חלקים: https הוא הפרוטוקול, כאן הפרוטוקול המאובטח; example.com הוא שם המתחם, שאומר לאיזה אתר להיכנס; ו־/games הוא הדף או המקום באתר."]],
      [["When thousands of people open the same website at once, it may slow down or stop. Why?", "Its servers must answer every visitor's request", ["The site's address changes when too many people type it", "The internet allows only a thousand users on a site at once", "Each visitor's browser removes a small piece of the website"], "A website lives on servers, computers that send a copy of each page to everyone who asks. Every request takes some work, so a huge crowd at once can overload them; big sites use many servers to share the load."],
        ["כשאלפי אנשים פותחים את אותו אתר בבת אחת, הוא יכול להאט או לקרוס. למה?", "השרתים שלו צריכים לענות לבקשה של כל מבקר", ["הכתובת של האתר משתנה כשיותר מדי אנשים מקלידים אותה", "באינטרנט מותרים רק אלף משתמשים בכל אתר בבת אחת", "הדפדפן של כל מבקר מוחק מהאתר עוד חלק קטן"], "אתר נמצא על שרתים, מחשבים ששולחים עותק של כל דף לכל מי שמבקש. כל בקשה דורשת קצת עבודה, ולכן קהל עצום בבת אחת יכול להעמיס עליהם מדי; אתרים גדולים משתמשים בהרבה שרתים כדי לחלק ביניהם את העומס."]],
    ],
  },
  a: {
    t: [
      ["Packet", "a small chunk of data; messages are split into packets that travel separately", "חבילת נתונים", "פיסה קטנה של נתונים; הודעות מפוצלות לפיסות שנעות בנפרד"],
      ["Protocol", "an agreed set of rules for how devices communicate, like HTTP or TCP/IP", "פרוטוקול", "סט כללים מוסכם לאופן שבו מכשירים מתקשרים, כמו HTTP או TCP/IP"],
      ["Bandwidth", "how much data a connection can carry per second", "רוחב פס", "כמה נתונים חיבור יכול להעביר בשנייה"],
      ["Latency", "the delay before data starts to arrive", "השהיה", "העיכוב עד שהנתונים מתחילים להגיע"],
    ],
    q: [
      [["Why is data sent in packets instead of one long stream?", "Packets can take different routes and lost ones can be re-sent", ["Splitting a file into packets makes it smaller and quicker to send", "Packets are always encrypted, so nobody can read them on the way", "Cables can carry only one letter of a message at a time"], "Packets from many users share the same links, each can find its own way round a broken link, and only the lost ones are sent again. Splitting data into packets does not make it smaller or encrypt it."],
        ["למה נתונים נשלחים בחבילות ולא כזרם ארוך אחד?", "חבילות עוברות במסלולים שונים, ואת מה שאבד שולחים שוב", ["חלוקה לחבילות מקטינה את הקובץ ומזרזת את השליחה שלו", "חבילות תמיד מוצפנות, ולכן אף אחד לא יכול לקרוא אותן בדרך", "כבלים מעבירים רק אות אחת של ההודעה בכל פעם"], "חבילות של משתמשים רבים חולקות את אותם קווים, כל אחת יכולה למצוא דרך משלה סביב קו שנפגע, ורק החבילות שאבדו נשלחות שוב. חלוקה לחבילות לא מקטינה את הנתונים ולא מצפינה אותם."]],
      [["A file is 100 megabits and the connection is 20 megabits per second. Ignoring delays, how long does it take?", "5 seconds", ["20 seconds", "2,000 seconds", "0.2 seconds"], "Each second carries 20 megabits, so 100 megabits need 100 ÷ 20 = 5 seconds. In real life delays and other users make it a little slower."],
        ["קובץ בגודל 100 מגה־ביט והחיבור הוא 20 מגה־ביט לשנייה. בלי להתחשב בעיכובים, כמה זמן זה לוקח?", "5 שניות", ["20 שניות", "2,000 שניות", "0.2 שניות"], "בכל שנייה עוברים 20 מגה־ביט, ולכן 100 מגה־ביט צריכים 100 ÷ 20 = 5 שניות. במציאות עיכובים ומשתמשים אחרים מאטים את זה מעט."]],
      [["In an online game your moves show up a moment late, although big downloads on the same connection are fast. What is most likely to blame?", "High latency, a long delay for each message", ["Low bandwidth, too little data fitting through each second", "A full hard drive on the game's server", "A screen that shows too many colours at once"], "Bandwidth is how much data gets through each second, which decides how fast a big download is. Latency is the delay before each message arrives, which matters most in games and calls, where many small messages must arrive quickly."],
        ["במשחק רשת התנועות שלכם מופיעות ברגע של איחור, למרות שהורדות גדולות באותו חיבור מהירות. מה כנראה הסיבה?", "השהיה גבוהה, עיכוב ארוך לכל הודעה", ["רוחב פס נמוך, מעט מדי נתונים שעוברים בכל שנייה", "כונן קשיח מלא בשרת של המשחק", "מסך שמציג יותר מדי צבעים בבת אחת"], "רוחב פס הוא כמה נתונים עוברים בכל שנייה, וזה קובע כמה מהר יורד קובץ גדול. השהיה היא העיכוב עד שכל הודעה מגיעה, והיא חשובה במיוחד במשחקים ובשיחות, שבהם הודעות קטנות רבות צריכות להגיע מהר."]],
    ],
    n: [
      [2, ["A 10-megabyte file is sent over a connection of 40 megabits per second. One byte is 8 bits. Ignoring delays, how many seconds does it take?", "seconds", "10 megabytes × 8 = 80 megabits, and 80 ÷ 40 = 2 seconds. Connection speeds are given in megabits but file sizes in megabytes, so remember to multiply by 8.", "First turn the megabytes into megabits."],
        ["קובץ בגודל 10 מגה־בייט נשלח בחיבור של 40 מגה־ביט לשנייה. בייט אחד הוא 8 ביטים. בלי להתחשב בעיכובים, כמה שניות זה לוקח?", "שניות", "10 מגה־בייט × 8 = 80 מגה־ביט, ו־80 ÷ 40 = 2 שניות. מהירות של חיבור נמדדת במגה־ביט, אבל גודל של קובץ במגה־בייט, ולכן צריך לזכור לכפול ב־8.", "קודם הפכו את המגה־בייט למגה־ביט."]],
    ],
  },
};
export default c;
