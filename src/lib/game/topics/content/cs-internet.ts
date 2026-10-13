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
      [["Is the internet the same as the World Wide Web?", "No — the web is one service that runs on the internet", ["Yes, exactly the same", "The internet runs on the web", "The web is older"], "The internet is the network; the web (pages and links) is one of many services on it, like email."],
        ["האם האינטרנט והרשת העולמית (Web) הם אותו דבר?", "לא — ה־Web הוא שירות אחד שפועל על גבי האינטרנט", ["כן, בדיוק אותו דבר", "האינטרנט פועל על גבי ה־Web", "ה־Web ותיק יותר"], "האינטרנט הוא הרשת; ה־Web (דפים וקישורים) הוא אחד משירותים רבים בה, כמו דואר אלקטרוני."]],
      [["What does clicking a link usually do?", "Opens another page or place", ["Deletes the page", "Turns off the computer", "Prints the page"], "Links connect pages, which is what makes it a web."],
        ["מה בדרך כלל קורה כשלוחצים על קישור?", "נפתח דף או מקום אחר", ["הדף נמחק", "המחשב נכבה", "הדף מודפס"], "קישורים מחברים בין דפים — זה מה שהופך את זה לרשת."]],
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
      [["What does a DNS server do?", "Turns names like example.com into IP addresses", ["Stores your photos", "Speeds up your keyboard", "Blocks all ads"], "DNS works like a phone book for the internet."],
        ["מה עושה שרת DNS?", "מתרגם שמות כמו example.com לכתובות IP", ["שומר את התמונות שלכם", "מאיץ את המקלדת", "חוסם את כל הפרסומות"], "DNS פועל כמו ספר טלפונים של האינטרנט."]],
      [["Who invented the World Wide Web, around 1989–1991?", "Tim Berners-Lee", ["Bill Gates", "Steve Jobs", "Alan Turing"], "Tim Berners-Lee, working at CERN, created the web, HTML and the first browser."],
        ["מי המציא את ה־World Wide Web, בסביבות 1989–1991?", "טים ברנרס־לי", ["ביל גייטס", "סטיב ג׳ובס", "אלן טיורינג"], "טים ברנרס־לי, שעבד ב־CERN, יצר את ה־Web, את HTML ואת הדפדפן הראשון."]],
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
      [["Why is data sent in packets instead of one long stream?", "Packets can take different routes and lost ones can be re-sent", ["Packets are always encrypted", "It makes files bigger", "Cables can only carry one letter at a time"], "Packet switching shares the network fairly and survives broken links."],
        ["למה נתונים נשלחים בחבילות ולא כזרם ארוך אחד?", "חבילות יכולות לעבור במסלולים שונים, ואת אלה שאבדו אפשר לשלוח שוב", ["חבילות תמיד מוצפנות", "זה מגדיל את הקבצים", "כבלים מעבירים רק אות אחת בכל פעם"], "מיתוג חבילות משתף את הרשת בהוגנות ושורד קווים שנפגעו."]],
      [["A file is 100 megabits and the connection is 20 megabits per second. Ignoring delays, how long does it take?", "5 seconds", ["20 seconds", "2,000 seconds", "0.2 seconds"], "100 ÷ 20 = 5 seconds."],
        ["קובץ בגודל 100 מגה־ביט והחיבור הוא 20 מגה־ביט לשנייה. בלי להתחשב בעיכובים, כמה זמן זה לוקח?", "5 שניות", ["20 שניות", "2,000 שניות", "0.2 שניות"], "100 ÷ 20 = 5 שניות."]],
    ],
  },
};
export default c;
