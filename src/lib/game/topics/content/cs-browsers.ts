import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Web browser", "a program for visiting and viewing websites, such as Chrome, Safari or Edge", "דפדפן", "תוכנה לביקור ולצפייה באתרי אינטרנט, כמו Chrome, Safari או Edge"],
      ["Tab", "one page open inside a browser window; you can switch between several", "לשונית", "דף אחד שפתוח בתוך חלון הדפדפן; אפשר לעבור בין כמה כאלה"],
      ["Address bar", "the box at the top where you type a website's address", "שורת הכתובת", "התיבה בחלק העליון שבה מקלידים את כתובת האתר"],
      ["Bookmark", "a saved link to a page, so you can return to it quickly", "סימנייה", "קישור שמור לדף, כדי לחזור אליו מהר"],
    ],
    q: [
      [["Which of these is a web browser?", "Firefox", ["Google", "Wikipedia", "YouTube"], "Firefox is a browser: a program for opening websites. Google is a search engine (its browser is called Chrome), while Wikipedia and YouTube are websites you visit with a browser."],
        ["מה מבין אלה הוא דפדפן?", "Firefox", ["Google", "ויקיפדיה", "YouTube"], "Firefox הוא דפדפן: תוכנה לפתיחת אתרים. Google הוא מנוע חיפוש (הדפדפן של החברה נקרא Chrome), וויקיפדיה ו־YouTube הם אתרים שמבקרים בהם בעזרת דפדפן."]],
      [["What does the Back button do?", "Goes to the page you saw before", ["Opens the page you will see next", "Loads the same page again", "Closes the whole browser"], "Back returns you to the previous page in this tab. Refresh loads the current page again, and Forward goes on again after you went back."],
        ["מה עושה כפתור ״הקודם״ (החזרה)?", "חוזר לדף שראיתם קודם", ["פותח את הדף שתראו אחר כך", "טוען שוב את אותו הדף", "סוגר את כל הדפדפן"], "״הקודם״ מחזיר אתכם לדף הקודם בלשונית הזאת. רענון טוען שוב את הדף הנוכחי, ו״הבא״ מתקדם שוב אחרי שחזרתם."]],
      [["A page did not load properly. Which button loads it again?", "Refresh", ["Back", "Home", "Bookmark"], "Refresh, also called Reload and shown as a round arrow, asks the website for the page again. Back would take you to a different page."],
        ["דף לא נטען כמו שצריך. איזה כפתור טוען אותו שוב?", "רענון", ["הקודם", "דף הבית", "סימנייה"], "רענון, שמסומן בחץ מעגלי, מבקש מהאתר את הדף פעם נוספת. ״הקודם״ היה לוקח אתכם לדף אחר."]],
      [["You want to open a second page without closing the first. What can you open?", "A new tab", ["A new bookmark", "The history list", "The downloads list"], "A new tab opens another page inside the same window, and you can click between the tabs. The first page stays open in its own tab."],
        ["אתם רוצים לפתוח דף שני בלי לסגור את הראשון. מה אפשר לפתוח?", "לשונית חדשה", ["סימנייה חדשה", "את רשימת ההיסטוריה", "את רשימת ההורדות"], "לשונית חדשה פותחת דף נוסף באותו חלון, ואפשר ללחוץ כדי לעבור בין הלשוניות. הדף הראשון נשאר פתוח בלשונית שלו."]],
      [["How do you close one tab?", "Click the X on that tab", ["Click the Refresh button", "Click the Back button", "Switch off the screen"], "Each tab has its own small X. Clicking it closes only that tab; the other tabs and the window stay open."],
        ["איך סוגרים לשונית אחת?", "לוחצים על ה־X שבלשונית", ["לוחצים על כפתור הרענון", "לוחצים על כפתור ״הקודם״", "מכבים את המסך"], "לכל לשונית יש X קטן משלה. לחיצה עליו סוגרת רק את הלשונית הזאת; שאר הלשוניות והחלון נשארים פתוחים."]],
    ],
    n: [
      [5, ["You have 3 tabs open. You open 4 more and then close 2. How many tabs are open now?", "tabs", "3 + 4 = 7 tabs, and after closing 2 there are 7 − 2 = 5 tabs open."],
        ["פתוחות אצלכם 3 לשוניות. אתם פותחים עוד 4 ואז סוגרים 2. כמה לשוניות פתוחות עכשיו?", "לשוניות", "3 + 4 = 7 לשוניות, ואחרי שסוגרים 2 נשארות פתוחות 7 − 2 = 5 לשוניות."]],
    ],
    s: [
      [["Visit a website", "Open the browser", "Click in the address bar", "Type the website's address", "Press Enter", "Wait for the page to load"],
        ["כניסה לאתר אינטרנט", "פותחים את הדפדפן", "לוחצים בתוך שורת הכתובת", "מקלידים את כתובת האתר", "לוחצים Enter", "מחכים שהדף ייטען"]],
    ],
  },
  i: {
    t: [
      ["URL", "the full address of a page on the web, such as https://example.org/news", "כתובת URL", "הכתובת המלאה של דף ברשת, למשל https://example.org/news"],
      ["Browsing history", "the list of pages you have visited, which the browser keeps", "היסטוריית גלישה", "רשימת הדפים שביקרתם בהם, שהדפדפן שומר"],
      ["Home page", "the page a browser shows when it starts or when you press its Home button", "דף הבית", "הדף שהדפדפן מציג כשהוא נפתח או כשלוחצים על כפתור הבית שלו"],
      ["Link", "a word or picture you click to go to another page", "קישור", "מילה או תמונה שלוחצים עליה כדי לעבור לדף אחר"],
    ],
    q: [
      [["In many browsers a padlock appears next to the web address. What does it show?", "The connection to the site is encrypted", ["The website has been checked and is honest", "The page can never be changed", "The website is closed and locked"], "The padlock means HTTPS: data between you and the site is scrambled so others on the way cannot read it. It does not prove that the site itself is honest; fake sites can use HTTPS too."],
        ["בדפדפנים רבים מופיע סמל של מנעול ליד כתובת האתר. מה הוא מראה?", "החיבור לאתר מוצפן", ["האתר נבדק ונמצא אמין וישר", "אי אפשר לשנות את הדף לעולם", "האתר סגור ונעול"], "המנעול פירושו HTTPS: המידע בינכם לבין האתר מוצפן, כך שמי שבדרך לא יכול לקרוא אותו. הוא לא מוכיח שהאתר עצמו אמין; גם אתרים מזויפים יכולים להשתמש ב־HTTPS."]],
      [["In https://www.example.com/games, which part is the domain name?", "example.com", ["example.com/games", "https://www", "www.example"], "The domain names the website; here it is example.com, and www is just a part in front of it. https is the way the page is sent, and /games is a page inside the site."],
        ["בכתובת https://www.example.com/games, איזה חלק הוא שם הדומיין?", "example.com", ["example.com/games", "https://www", "www.example"], "הדומיין הוא שם האתר; כאן הוא example.com, ו־www הוא רק חלק שבא לפניו. https הוא הדרך שבה הדף נשלח, ו־/games הוא דף בתוך האתר."]],
      [["What does private (incognito) browsing do?", "It does not save your history on this device", ["It hides what you do from your school or internet provider", "It protects your device from every kind of virus", "It makes every page load much faster"], "Private browsing only stops the browser from keeping your history, cookies and form data after you close the window. The websites, your school's network and your internet provider can still see what you visit."],
        ["מה עושה גלישה בסתר (״אינקוגניטו״)?", "היא לא שומרת את ההיסטוריה שלכם במכשיר", ["היא מסתירה את מה שאתם עושים מבית הספר ומספק האינטרנט", "היא מגינה על המכשיר מכל סוג של וירוס", "היא גורמת לכל דף להיטען מהר הרבה יותר"], "גלישה בסתר רק מונעת מהדפדפן לשמור היסטוריה, עוגיות ומידע מטפסים אחרי שסוגרים את החלון. האתרים, הרשת של בית הספר וספק האינטרנט עדיין יכולים לראות באילו אתרים ביקרתם."]],
      [["What are cookies on the web?", "Small files sites save to remember you", ["Viruses that always damage your computer", "Pictures that load before the page", "Adverts that pop up in a new window"], "A cookie is a small piece of data a website stores in your browser, for example to keep you logged in or to remember what is in your shopping basket."],
        ["מה הן עוגיות (cookies) ברשת?", "קבצים קטנים שאתרים שומרים כדי לזכור אתכם", ["וירוסים שתמיד מזיקים למחשב", "תמונות שנטענות לפני הדף", "פרסומות שקופצות בחלון חדש"], "עוגייה היא פיסת מידע קטנה שאתר שומר בדפדפן שלכם, למשל כדי שתישארו מחוברים או כדי לזכור מה יש בסל הקניות."]],
      [["You clicked a link and a file was saved. Where do browsers usually put it?", "In the Downloads folder", ["In the browsing history", "In the bookmarks bar", "In the address bar"], "Unless you choose another place, downloaded files go to the Downloads folder. The browser's list of downloads shows them too, with a button to open the folder."],
        ["לחצתם על קישור, וקובץ נשמר. איפה דפדפנים שמים אותו בדרך כלל?", "בתיקיית ההורדות", ["בהיסטוריית הגלישה", "בסרגל הסימניות", "בשורת הכתובת"], "אם לא בוחרים מקום אחר, קבצים שהורדו נשמרים בתיקיית ההורדות. גם רשימת ההורדות של הדפדפן מציגה אותם, עם כפתור לפתיחת התיקייה."]],
    ],
    n: [
      [50, ["A 400 MB file downloads at 8 MB per second. How many seconds does it take?", "seconds", "400 ÷ 8 = 50, so the download takes 50 seconds."],
        ["קובץ של 400 MB יורד במהירות של 8 MB לשנייה. כמה שניות זה לוקח?", "שניות", "400 ÷ 8 = 50, ולכן ההורדה לוקחת 50 שניות."]],
    ],
    s: [
      [["Bookmark a page", "Open the page you want to keep", "Click the star in the address bar", "Choose a name and a folder", "Confirm to save the bookmark"],
        ["שמירת דף בסימניות", "פותחים את הדף שרוצים לשמור", "לוחצים על הכוכב בשורת הכתובת", "בוחרים שם ותיקייה", "מאשרים כדי לשמור את הסימנייה"]],
    ],
  },
  a: {
    t: [
      ["HTTPS", "the secure version of the web's rules for sending pages, which encrypts the data on the way", "פרוטוקול HTTPS", "הגרסה המאובטחת של כללי השליחה של דפי אינטרנט, שמצפינה את המידע בדרך"],
      ["Cache", "copies of parts of pages kept on your device so that sites load faster next time", "מטמון", "עותקים של חלקי דפים שנשמרים במכשיר, כדי שאתרים ייטענו מהר יותר בפעם הבאה"],
      ["Extension", "a small add-on that gives a browser a new feature", "תוסף", "תוכנה קטנה שמוסיפה לדפדפן יכולת חדשה"],
      ["Pop-up", "a window that opens by itself on top of the page you are viewing", "חלון קופץ", "חלון שנפתח מעצמו מעל הדף שבו צופים"],
    ],
    q: [
      [["A site still looks old even after its owner updated it. What may help?", "Clearing the cache", ["Adding the site to your bookmarks", "Opening the browser's history page", "Turning up the screen brightness"], "The browser may be showing old copies of files saved in its cache. Clearing the cache, or a hard refresh (often Ctrl+F5 or Ctrl+Shift+R), makes it download fresh copies."],
        ["אתר עדיין נראה ישן גם אחרי שהבעלים שלו עדכנו אותו. מה יכול לעזור?", "ניקוי המטמון", ["הוספת האתר לסימניות", "פתיחת דף ההיסטוריה של הדפדפן", "הגברת הבהירות של המסך"], "ייתכן שהדפדפן מציג עותקים ישנים של קבצים ששמורים במטמון. ניקוי המטמון, או רענון מלא (לרוב Ctrl+F5 או Ctrl+Shift+R), גורם לו להוריד עותקים חדשים."]],
      [["Which address really belongs to the site example.com?", "https://shop.example.com/login", ["https://example.com.shop-login.net", "https://example-com.login.net", "https://login.net/example.com"], "Read the site's name, the part before the first single slash, from its right end: shop.example.com ends in example.com. The others end in shop-login.net or login.net, so they belong to someone else."],
        ["איזו כתובת באמת שייכת לאתר example.com?", "https://shop.example.com/login", ["https://example.com.shop-login.net", "https://example-com.login.net", "https://login.net/example.com"], "קוראים את שם האתר, החלק שלפני הלוכסן הבודד הראשון, מהקצה הימני שלו: shop.example.com מסתיים ב־example.com. האחרות מסתיימות ב־shop-login.net או ב־login.net, ולכן הן שייכות למישהו אחר."]],
      [["Why should you install only browser extensions you trust?", "An extension may be able to read the pages you visit", ["Every extension makes the browser crash after a while", "Extensions can be used only once", "Extensions change the colours of websites"], "Many extensions ask for permission to read and change the pages you open, which could include passwords and messages. A bad extension can misuse that access."],
        ["למה כדאי להתקין רק תוספים לדפדפן שאתם סומכים עליהם?", "תוסף עשוי להיות מסוגל לקרוא את הדפים שאתם פותחים", ["כל תוסף גורם לדפדפן לקרוס אחרי זמן מה", "אפשר להשתמש בתוסף רק פעם אחת", "תוספים משנים את הצבעים של אתרים"], "תוספים רבים מבקשים הרשאה לקרוא ולשנות את הדפים שאתם פותחים, ואלה יכולים לכלול סיסמאות והודעות. תוסף זדוני יכול לנצל את הגישה הזאת לרעה."]],
      [["You looked at shoes on one site and now see shoe adverts on many other sites. What is the likely cause?", "Tracking cookies recorded your visit across sites", ["Each of those sites guessed the very same thing by chance", "Your printer sent your history to the shops", "Your screen remembered the picture of the shoes"], "Advertising companies place their cookies on many sites, so they can recognise your browser on each of them and show matching adverts. Many browsers let you block these third-party cookies."],
        ["הסתכלתם על נעליים באתר אחד, ועכשיו אתם רואים פרסומות לנעליים באתרים רבים אחרים. מה הסיבה הסבירה?", "עוגיות מעקב תיעדו את הביקור שלכם באתרים שונים", ["כל אחד מהאתרים ניחש במקרה בדיוק את אותו דבר", "המדפסת שלכם שלחה את ההיסטוריה לחנויות", "המסך זכר את התמונה של הנעליים"], "חברות פרסום שמות עוגיות משלהן באתרים רבים, וכך הן מזהות את הדפדפן שלכם בכל אחד מהם ומציגות פרסומות מתאימות. דפדפנים רבים מאפשרים לחסום את עוגיות הצד השלישי האלה."]],
      [["A site you do not know offers free_game.exe, and the browser warns you about the download. What is the best choice?", "Delete it and do not run it", ["Run it once to see what it does", "Rename it and then run it", "Send it to a friend to test"], "Browsers warn about files that are often harmful. An .exe file is a program, and running one from an unknown site can install malware; renaming it does not make it safe."],
        ["אתר שאתם לא מכירים מציע את הקובץ free_game.exe, והדפדפן מזהיר אתכם מההורדה. מה הבחירה הטובה ביותר?", "למחוק אותו ולא להפעיל אותו", ["להפעיל אותו פעם אחת כדי לראות מה הוא עושה", "לשנות את השם שלו ואז להפעיל", "לשלוח אותו לחבר שיבדוק"], "דפדפנים מזהירים מקבצים שלעיתים קרובות מזיקים. קובץ exe הוא תוכנה, והפעלה של תוכנה מאתר לא מוכר יכולה להתקין תוכנה זדונית; שינוי השם לא הופך אותה לבטוחה."]],
    ],
    n: [
      [0.5, ["A page is made of 2 MB of files. On a later visit the cache supplies 1.5 MB of them. How many MB must be downloaded on that visit?", "MB", "Only the files that are not in the cache are downloaded: 2 − 1.5 = 0.5 MB."],
        ["דף בנוי מקבצים בגודל 2 MB. בביקור מאוחר יותר המטמון מספק 1.5 MB מהם. כמה MB צריך להוריד בביקור הזה?", "MB", "מורידים רק את הקבצים שאינם במטמון: 2 − 1.5 = 0.5 MB."]],
    ],
    s: [
      [["What happens after you type an address and press Enter", "The browser looks up the site's IP address (DNS)", "It connects to the website's server", "It asks the server for the page", "The server sends back the page's files", "The browser draws the page on the screen"],
        ["מה קורה אחרי שמקלידים כתובת ולוחצים Enter", "הדפדפן מוצא את כתובת ה־IP של האתר (DNS)", "הוא מתחבר לשרת של האתר", "הוא מבקש מהשרת את הדף", "השרת שולח בחזרה את הקבצים של הדף", "הדפדפן מצייר את הדף על המסך"]],
    ],
  },
};
export default c;
