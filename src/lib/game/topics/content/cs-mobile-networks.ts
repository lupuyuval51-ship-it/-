import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Cell", "the area served by one antenna site; many of them together cover a whole country", "תא", "האזור שמקבל שירות מאתר אנטנות אחד; הרבה כאלה יחד מכסים מדינה שלמה"],
      ["Cell tower", "a tall mast with antennas that sends and receives the radio signals of nearby phones", "אנטנה סלולרית", "תורן גבוה עם משדרים, ששולח וקולט את אותות הרדיו של טלפונים קרובים"],
      ["SIM card", "a small chip card that tells the network which customer and phone number a phone belongs to", "כרטיס סים", "כרטיס קטן עם שבב שאומר לרשת לאיזה לקוח ולאיזה מספר טלפון שייך המכשיר"],
      ["SMS", "a short text message sent through the mobile network", "מסרון (SMS)", "הודעת טקסט קצרה שנשלחת דרך הרשת הסלולרית"],
    ],
    q: [
      [["How does a mobile phone send your voice to the nearest antenna?", "Using radio waves", ["Through a hidden cable", "With sound waves, like shouting", "With beams of visible light"], "Phones turn your voice into digital data and send it by radio waves, which travel through the air to the antenna."],
        ["איך טלפון נייד שולח את הקול שלכם לאנטנה הקרובה?", "בגלי רדיו", ["דרך כבל מוסתר", "בגלי קול, כמו צעקה", "בקרני אור שאפשר לראות"], "הטלפון הופך את הקול שלכם לנתונים דיגיטליים ושולח אותם בגלי רדיו, שעוברים באוויר עד האנטנה."]],
      [["Why is a mobile network called cellular?", "The land is split into areas, each with an antenna", ["Phones were first built from tiny living cells", "Each phone has a battery cell that powers its radio", "It was invented by a scientist named Cell"], "The covered land is divided into many small areas called cells, and each one is served by its own antenna site. A phone talks to one nearby."],
        ["למה רשת טלפונים ניידים נקראת סלולרית?", "השטח מחולק לאזורים, ולכל אחד יש אנטנה", ["הטלפונים הראשונים נבנו מתאים חיים זעירים", "בכל טלפון יש תא סוללה שמפעיל את הרדיו", "היא הומצאה בידי מדען בשם סלולר"], "השטח שהרשת מכסה מחולק להרבה אזורים קטנים שנקראים תאים, ובאנגלית cells, ולכל אחד יש אתר אנטנות משלו. הטלפון מדבר עם אחד קרוב."]],
      [["What does the G in 4G and 5G stand for?", "Generation", ["Gigabytes per second", "Gigahertz", "Global"], "Each G is a generation of mobile network technology: 2G was the second generation, and 5G is the fifth."],
        ["מה מסמנת האות G בשמות 4G ו־5G?", "דור (Generation)", ["גיגה־בייט לשנייה", "גיגה־הרץ", "גלובלי"], "כל G הוא דור של טכנולוגיית רשתות סלולריות: 2G היה הדור השני, ו־5G הוא הדור החמישי."]],
      [["What is roaming?", "Using another company's network when you are abroad", ["Walking from room to room at home while you are on a call", "Sending one message to many people at the same time", "Turning off the phone's radio during a flight"], "Abroad, your own company usually has no antennas, so your phone uses a local network that has a deal with your company."],
        ["מהי נדידה (roaming)?", "שימוש ברשת של חברה אחרת כשאתם בחו״ל", ["הליכה מחדר לחדר בבית בזמן שיחה בטלפון", "שליחה של הודעה אחת להרבה אנשים בבת אחת", "כיבוי הרדיו של הטלפון בזמן טיסה"], "בחו״ל לחברה שלכם בדרך כלל אין אנטנות, ולכן הטלפון משתמש ברשת מקומית שיש לה הסכם עם החברה שלכם."]],
      [["You walk further and further away from every antenna. What happens to the signal?", "It gets weaker and may be lost", ["It gets stronger the further you go", "It stays the same everywhere on Earth", "It turns into a Wi-Fi signal"], "Radio signals spread out and weaken with distance, and hills and buildings can block them, so far from all antennas there is no service."],
        ["אתם מתרחקים עוד ועוד מכל האנטנות. מה קורה לקליטה?", "היא נחלשת ועלולה להיעלם", ["היא מתחזקת ככל שמתרחקים", "היא נשארת אותו דבר בכל מקום בעולם", "היא הופכת לאות Wi-Fi"], "אותות רדיו מתפזרים ונחלשים עם המרחק, וגבעות ובניינים יכולים לחסום אותם, ולכן רחוק מכל האנטנות אין קליטה."]],
    ],
    n: [
      [1973, ["In which year did Martin Cooper of Motorola make the first call from a handheld mobile phone?", "", "On 3 April 1973, Martin Cooper called a rival engineer from a street in New York using a Motorola prototype."],
        ["באיזו שנה ביצע מרטין קופר מחברת מוטורולה את השיחה הראשונה מטלפון נייד שאפשר להחזיק ביד?", "", "ב־3 באפריל 1973 התקשר מרטין קופר מרחוב בניו יורק למהנדס מחברה מתחרה, בעזרת אב־טיפוס של מוטורולה."]],
    ],
  },
  i: {
    t: [
      ["Handover", "passing a call from one antenna to the next as the phone moves, without cutting it off", "העברה בין תאים", "מסירה של שיחה מאנטנה אחת לבאה בזמן שהטלפון זז, בלי לנתק אותה"],
      ["Mobile data", "using the phone network to reach the internet for apps and websites", "גלישה סלולרית", "שימוש ברשת הסלולרית כדי להתחבר לאינטרנט, לאפליקציות ולאתרים"],
      ["Operator", "a company that runs a mobile network and sells phone plans", "מפעיל סלולרי", "חברה שמפעילה רשת טלפונים ניידים ומוכרת חבילות שימוש"],
    ],
    q: [
      [["A single SMS holds fewer characters when it is written in Hebrew than in English. Why?", "Each Hebrew letter needs a bigger code, so fewer fit", ["Hebrew words are always longer than English ones", "The network blocks long messages in Hebrew", "Hebrew is written right to left, which needs extra space"], "Simple English text uses 7 bits per character, but other alphabets need 16 bits per character, so fewer characters fit in the same 140 bytes."],
        ["מסרון אחד מכיל פחות תווים כשהוא כתוב בעברית מאשר באנגלית. למה?", "כל אות עברית צריכה קוד גדול יותר, ולכן נכנסות פחות", ["מילים בעברית תמיד ארוכות יותר ממילים באנגלית", "הרשת חוסמת הודעות ארוכות בעברית", "עברית נכתבת מימין לשמאל, וזה דורש מקום נוסף"], "טקסט פשוט באנגלית משתמש ב־7 ביטים לכל תו, אבל אלפביתים אחרים צריכים 16 ביטים לכל תו, ולכן פחות תווים נכנסים באותם 140 בתים."]],
      [["Why are cells in a busy city usually smaller than cells in the countryside?", "Each antenna can serve only so many phones at once", ["City phones have much stronger radios than other phones", "Tall buildings make every radio signal travel further", "Small cells are easier to see on a map"], "More people means more calls and data in each area, so the city is split into many small cells, each with its own share of phones."],
        ["למה התאים בעיר עמוסה קטנים בדרך כלל מהתאים באזור כפרי?", "כל אנטנה יכולה לשרת רק מספר מוגבל של טלפונים בבת אחת", ["לטלפונים בעיר יש רדיו חזק בהרבה מלטלפונים אחרים", "בניינים גבוהים גורמים לכל אות רדיו להגיע רחוק יותר", "קל יותר לראות תאים קטנים על מפה"], "יותר אנשים פירושם יותר שיחות ונתונים בכל אזור, ולכן העיר מחולקת להרבה תאים קטנים, ולכל אחד יש חלק משלו מהטלפונים."]],
      [["Which generation of mobile network is also known as LTE?", "4G", ["3G", "5G", "2G"], "LTE, short for Long Term Evolution, is the technology of most 4G networks, which made fast mobile data and video common."],
        ["איזה דור של רשת סלולרית נקרא גם LTE?", "4G", ["3G", "5G", "2G"], "LTE, קיצור של Long Term Evolution, היא הטכנולוגיה של רוב רשתות ה־4G, שהפכו גלישה מהירה וצפייה בווידאו בטלפון לדבר נפוץ."]],
      [["What does a SIM card hold that lets the network recognise you?", "An identity number and a secret key", ["A backup of all your photos and videos", "The settings of the phone's screen", "A copy of every app on the phone"], "The SIM stores a subscriber identity number and a secret key. The network uses them to check that the phone really belongs to one of its customers."],
        ["מה שמור בכרטיס הסים שמאפשר לרשת לזהות אתכם?", "מספר זיהוי ומפתח סודי", ["גיבוי של כל התמונות והסרטונים שלכם", "ההגדרות של מסך הטלפון", "עותק של כל אפליקציה בטלפון"], "בכרטיס הסים שמורים מספר זיהוי של המנוי ומפתח סודי. הרשת משתמשת בהם כדי לבדוק שהטלפון באמת שייך לאחד הלקוחות שלה."]],
    ],
    n: [
      [160, ["How many characters of simple English text fit in one standard SMS?", "characters", "One SMS carries 140 bytes, and simple text uses 7 bits per character, so 140 × 8 ÷ 7 = 160 characters."],
        ["כמה תווים של טקסט פשוט באנגלית נכנסים במסרון רגיל אחד?", "תווים", "מסרון אחד נושא 140 בתים, וטקסט פשוט משתמש ב־7 ביטים לכל תו, ולכן 140 × 8 ÷ 7 = 160 תווים."]],
      [1992, ["In which year was the first SMS text message sent?", "", "The first SMS, which said Merry Christmas, was sent from a computer to a phone in the UK on 3 December 1992."],
        ["באיזו שנה נשלח המסרון הראשון?", "", "המסרון הראשון, עם הברכה Merry Christmas, נשלח ממחשב לטלפון בבריטניה ב־3 בדצמבר 1992."]],
    ],
    s: [
      [["Mobile network generations, from oldest to newest", "1G: analogue voice calls", "2G: digital calls and text messages", "3G: much faster mobile internet", "4G: fast data for video and apps", "5G: even faster data with very short delays"],
        ["דורות הרשת הסלולרית, מהוותיק לחדש", "דור 1G: שיחות קול אנלוגיות", "דור 2G: שיחות דיגיטליות ומסרונים", "דור 3G: אינטרנט נייד מהיר בהרבה", "דור 4G: נתונים מהירים לווידאו ולאפליקציות", "דור 5G: נתונים מהירים עוד יותר עם השהיה קצרה מאוד"]],
    ],
  },
  a: {
    t: [
      ["Frequency reuse", "using the same radio channels again in cells far enough apart not to disturb each other", "שימוש חוזר בתדרים", "שימוש באותם ערוצי רדיו שוב בתאים שרחוקים מספיק זה מזה כדי לא להפריע זה לזה"],
      ["Latency", "the delay between data being sent and it arriving at the other end", "השהיה (latency)", "הזמן שעובר מהרגע שנתונים נשלחים ועד שהם מגיעים לצד השני"],
      ["IMEI", "a unique serial number of the phone itself, separate from anything on the SIM", "מספר IMEI", "מספר סידורי ייחודי של מכשיר הטלפון עצמו, בנפרד מכל מה שיש בכרטיס הסים"],
    ],
    q: [
      [["Why do 5G networks that use very high frequencies need many more antennas?", "Those waves reach shorter distances and are blocked by walls", ["Each antenna can send only one message every second", "5G phones may connect to each antenna only once a day", "Very high frequencies travel faster than light and must be slowed"], "The higher the radio frequency, the shorter its range and the more easily walls, leaves and even rain weaken it, so antennas must be closer together."],
        ["למה רשתות 5G שמשתמשות בתדרים גבוהים מאוד צריכות הרבה יותר אנטנות?", "הגלים האלה מגיעים למרחק קצר יותר ונחסמים בקירות", ["כל אנטנה יכולה לשלוח רק הודעה אחת בכל שנייה", "טלפון 5G יכול להתחבר לכל אנטנה רק פעם אחת ביום", "תדרים גבוהים מאוד נעים מהר יותר מהאור וצריך להאט אותם"], "ככל שתדר הרדיו גבוה יותר, הטווח שלו קצר יותר וקל יותר לקירות, לעלים ואפילו לגשם להחליש אותו, ולכן האנטנות צריכות להיות קרובות יותר זו לזו."]],
      [["In older networks such as 2G, why were two cells side by side given different radio channels?", "Their signals would interfere and mix up the calls", ["Every phone would then connect to both cells at the same time", "Each channel could be used only once in a country", "The antennas would run out of electricity"], "Neighbouring cells overlap at the edges, so the same channel there would clash, while cells further apart could reuse it safely. Newer networks such as 4G and 5G use other methods that let even neighbouring cells share frequencies."],
        ["ברשתות ותיקות כמו 2G, למה שני תאים סמוכים קיבלו ערוצי רדיו שונים?", "האותות היו מפריעים זה לזה ומשבשים שיחות", ["כל טלפון היה מתחבר אז לשני התאים באותו זמן", "היה מותר להשתמש בכל ערוץ רק פעם אחת בכל מדינה", "לאנטנות היה נגמר החשמל"], "תאים שכנים חופפים בשוליים, ולכן אותו ערוץ היה מתנגש שם, ואילו תאים שרחוקים יותר זה מזה יכלו להשתמש בו שוב בבטחה. ברשתות חדשות יותר, כמו 4G ו־5G, יש שיטות אחרות שמאפשרות גם לתאים שכנים לחלוק תדרים."]],
      [["A phone in Israel calls a phone in Japan. Which part of the trip usually goes by radio?", "Only each phone's link to its own antenna", ["The whole way, straight through the air to Japan", "Only the part of the trip that crosses the sea", "None of it, because phones are joined by cables"], "Radio covers only the short hop between each phone and its nearby antenna. In between, the call travels through the operators' networks, mostly by cables such as fibre under the sea."],
        ["טלפון בישראל מתקשר לטלפון ביפן. איזה חלק מהדרך עובר בדרך כלל בגלי רדיו?", "רק הקשר של כל טלפון לאנטנה שלו", ["כל הדרך, ישר באוויר עד יפן", "רק החלק של הדרך שעובר מעל הים", "שום חלק, כי טלפונים מחוברים בכבלים"], "גלי הרדיו מכסים רק את הקטע הקצר שבין כל טלפון לאנטנה הקרובה אליו. בין לבין השיחה עוברת ברשתות של המפעילים, בעיקר בכבלים, כמו סיבים אופטיים מתחת לים."]],
      [["Why do online games often feel more responsive on 5G than on 4G?", "Lower latency: actions reach the server sooner", ["5G phones always have bigger and faster screens", "5G sends the whole game to the phone in advance", "Games are only allowed to run on 5G networks"], "5G networks can have a much shorter delay between sending data and its arrival, so each move reaches the game server and comes back sooner."],
        ["למה משחקים ברשת מרגישים לעיתים קרובות מהירים יותר בתגובה ב־5G מאשר ב־4G?", "השהיה נמוכה יותר: הפעולות מגיעות לשרת מהר יותר", ["לטלפונים של 5G תמיד יש מסכים גדולים ומהירים יותר", "רשת 5G שולחת מראש את כל המשחק לטלפון", "מותר להריץ משחקים רק ברשתות 5G"], "ברשתות 5G ההשהיה בין שליחת הנתונים להגעתם יכולה להיות קצרה בהרבה, ולכן כל מהלך מגיע לשרת המשחק וחוזר מהר יותר."]],
      [["You move your SIM card into a new phone. What moves with it?", "Your phone number and your plan", ["The serial number (IMEI) of the old phone", "All the apps from the old phone", "The battery level of the old phone"], "The number and the subscription belong to the SIM, but the IMEI belongs to the device and stays with the old phone."],
        ["מעבירים את כרטיס הסים לטלפון חדש. מה עובר יחד איתו?", "מספר הטלפון והחבילה שלכם", ["המספר הסידורי (IMEI) של הטלפון הישן", "כל האפליקציות מהטלפון הישן", "מצב הסוללה של הטלפון הישן"], "המספר והמנוי שייכים לכרטיס הסים, אבל ה־IMEI שייך למכשיר ונשאר בטלפון הישן."]],
    ],
    n: [
      [0.1, ["A radio wave travels about 300,000 km per second. How many milliseconds does it take to cover 30 km?", "ms", "30 ÷ 300,000 = 0.0001 seconds, and 0.0001 seconds is 0.1 milliseconds."],
        ["גל רדיו עובר בערך 300,000 ק״מ בשנייה. כמה אלפיות שנייה לוקח לו לעבור 30 ק״מ?", "אלפיות שנייה", "מחשבים 30 ÷ 300,000 = 0.0001 שניות, ו־0.0001 שניות הן 0.1 אלפיות שנייה."]],
      [1120, ["One SMS holds 160 characters of 7 bits each. How many bits is that?", "bits", "160 × 7 = 1120 bits, which is exactly 140 bytes of 8 bits each."],
        ["מסרון אחד מחזיק 160 תווים של 7 ביטים כל אחד. כמה ביטים זה?", "ביטים", "כופלים 160 × 7 = 1120 ביטים, שהם בדיוק 140 בתים של 8 ביטים כל אחד."]],
    ],
    s: [
      [["How a call reaches a friend's phone", "Your phone sends radio signals to the nearest antenna", "The antenna site passes the call into the operator's network", "The network finds the antenna nearest your friend's phone", "That antenna sends radio signals and your friend's phone rings"],
        ["איך שיחה מגיעה לטלפון של חבר", "הטלפון שלכם שולח אותות רדיו לאנטנה הקרובה", "אתר האנטנה מעביר את השיחה לרשת של המפעיל", "הרשת מוצאת את האנטנה הקרובה לטלפון של החבר", "האנטנה הזאת משדרת אותות רדיו והטלפון של החבר מצלצל"]],
    ],
  },
};
export default c;
