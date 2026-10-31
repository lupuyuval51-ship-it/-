import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Decade", "a period of ten years", "עשור", "תקופה של עשר שנים"],
      ["Century", "a period of 100 years", "מאה", "תקופה של 100 שנים"],
      ["Millennium", "a period of 1,000 years", "מילניום", "תקופה של 1,000 שנים"],
      ["Timeline", "a line that shows events in the order they happened, with their dates", "ציר זמן", "קו שמסמנים עליו אירועים לפי הסדר שבו קרו, יחד עם התאריכים שלהם"],
    ],
    q: [
      [["How many years are there in a century?", "100", ["1,000", "50", "10"], "A century is 100 years. Ten decades of 10 years each also make 100 years. A thousand years is a millennium, not a century."],
        ["כמה שנים יש במאה?", "100", ["1,000", "50", "10"], "מאה היא 100 שנים. גם עשרה עשורים של 10 שנים כל אחד הם 100 שנים. אלף שנים הן מילניום, לא מאה."]],
      [["Which year came earlier: 300 BCE or 200 BCE?", "300 BCE", ["200 BCE", "Both are the same year"], "Years before the Common Era are counted backwards towards year 1, so a bigger number means longer ago: 300 BCE came 100 years before 200 BCE."],
        ["איזו שנה הייתה מוקדמת יותר: 300 לפני הספירה או 200 לפני הספירה?", "300 לפני הספירה", ["200 לפני הספירה", "שתיהן אותה שנה"], "את השנים שלפני הספירה סופרים לאחור לכיוון שנה 1, ולכן מספר גדול יותר פירושו לפני יותר זמן: 300 לפני הספירה הייתה 100 שנה לפני 200 לפני הספירה."]],
      [["A date has “BCE” written after it. What does that tell you?", "It was before year 1 of the calendar most of the world uses", ["It was after year 1 of the calendar most of the world uses", "It is a date in the future", "It is a date in the Hebrew calendar"], "BCE means Before the Common Era. Those years are counted backwards from year 1; the years from year 1 onwards are CE, the Common Era."],
        ["ליד תאריך כתוב ״לפני הספירה״. מה זה אומר?", "שהשנה הייתה לפני שנה 1 בלוח השנה שרוב העולם משתמש בו", ["שהשנה הייתה אחרי שנה 1 בלוח השנה שרוב העולם משתמש בו", "שזה תאריך בעתיד", "שזה תאריך בלוח השנה העברי"], "״לפני הספירה״ (לפנה״ס) הן השנים שלפני שנה 1, ואותן סופרים לאחור. השנים משנה 1 והלאה הן השנים ״לספירה״."]],
      [["In which decade is the year 1995?", "The 1990s", ["The 1980s", "The 2000s", "The 1950s"], "A decade such as the 1990s holds the ten years from 1990 to 1999, so 1995 is right in the middle of it."],
        ["באיזה עשור נמצאת השנה 1995?", "שנות ה־90 של המאה ה־20", ["שנות ה־80 של המאה ה־20", "העשור הראשון של המאה ה־21", "שנות ה־50 של המאה ה־20"], "שנות ה־90 של המאה ה־20 הן עשר השנים מ־1990 עד 1999, ולכן 1995 נמצאת בדיוק באמצע העשור הזה."]],
      [["Which list is in order from the earliest year to the latest?", "1066, 1492, 1789, 1948", ["1492, 1066, 1789, 1948", "1789, 1948, 1066, 1492", "1948, 1789, 1492, 1066"], "For years of the Common Era a smaller number is earlier, so you sort them from the smallest number to the largest: 1066, 1492, 1789, 1948."],
        ["איזו רשימה מסודרת מהשנה המוקדמת ביותר למאוחרת ביותר?", "1066, 1492, 1789, 1948", ["1492, 1066, 1789, 1948", "1789, 1948, 1066, 1492", "1948, 1789, 1492, 1066"], "בשנים שלספירה מספר קטן יותר פירושו מוקדם יותר, ולכן מסדרים אותן מהמספר הקטן לגדול: 1066, 1492, 1789, 1948."]],
    ],
    n: [
      [8, ["Noa was born in 2012. How old did she turn on her birthday in 2020?", "years", "Subtract the birth year from the later year: 2020 − 2012 = 8, so she turned 8."],
        ["נועה נולדה ב־2012. בת כמה היא נעשתה ביום ההולדת שלה ב־2020?", "שנים", "מחסירים את שנת הלידה מהשנה המאוחרת: 2020 − 2012 = 8, ולכן מלאו לה 8."]],
      [10, ["How many decades are there in one century?", "", "A century is 100 years and a decade is 10 years: 100 ÷ 10 = 10 decades."],
        ["כמה עשורים יש במאה אחת?", "", "מאה היא 100 שנים ועשור הוא 10 שנים: 100 ÷ 10 = 10 עשורים."]],
    ],
    s: [[["From the shortest stretch of time to the longest", "A day", "A week", "A year", "A decade", "A century"],
      ["מפרק הזמן הקצר ביותר לארוך ביותר", "יום", "שבוע", "שנה", "עשור", "מאה"]]],
  },
  i: {
    t: [
      ["Circa (c.)", "a word written before a date to show that it is only approximate", "לערך", "מילה שכותבים לפני תאריך כדי להראות שהוא משוער ולא מדויק"],
      ["Chronology", "the order in which events happened, from first to last", "כרונולוגיה", "סדר הזמנים שבו התרחשו אירועים, מהראשון ועד האחרון"],
      ["Common Era (CE)", "the years counted from year 1 onwards in the calendar most of the world uses today", "לספירה", "השנים שנספרות משנה 1 והלאה, בלוח השנה שרוב העולם משתמש בו היום"],
    ],
    q: [
      [["In which century is the year 1948?", "The 20th century", ["The 19th century", "The 21st century", "The 18th century"], "The 20th century runs from 1901 to 2000, so 1948 belongs to it. A handy rule for most years: add 1 to the first two digits (19 + 1 = 20)."],
        ["באיזו מאה נמצאת השנה 1948?", "במאה ה־20", ["במאה ה־19", "במאה ה־21", "במאה ה־18"], "המאה ה־20 נמשכת מ־1901 עד 2000, ולכן 1948 שייכת אליה. כלל שימושי לרוב השנים: מוסיפים 1 לשתי הספרות הראשונות (19 + 1 = 20)."]],
      [["In which century is the year 450 BCE?", "The 5th century BCE", ["The 4th century BCE", "The 5th century CE", "The 45th century BCE"], "The 5th century BCE runs from 500 BCE down to 401 BCE, so 450 BCE is inside it. The tempting 4th century BCE covers 400 to 301 BCE."],
        ["באיזו מאה נמצאת השנה 450 לפני הספירה?", "במאה ה־5 לפני הספירה", ["במאה ה־4 לפני הספירה", "במאה ה־5 לספירה", "במאה ה־45 לפני הספירה"], "המאה ה־5 לפני הספירה נמשכת מ־500 ועד 401 לפני הספירה, ולכן 450 לפני הספירה נמצאת בתוכה. המאה ה־4 לפני הספירה, שמפתה לבחור בה, היא השנים 400 עד 301 לפני הספירה."]],
      [["A book says the Great Pyramid of Giza was built “c. 2560 BCE”. What does the “c.” tell you?", "The date is approximate: about 2560 BCE", ["The date is exact, right down to the very day", "The date is in the Common Era", "The pyramid took 2,560 years to build"], "“c.” stands for circa, Latin for “about”. Historians use it when a date is an estimate, which is common for very ancient events."],
        ["בספר כתוב שהפירמידה הגדולה בגיזה נבנתה ״לערך 2560 לפני הספירה״. מה המילה ״לערך״ אומרת?", "שהתאריך משוער: בערך 2560 לפני הספירה", ["שהתאריך מדויק לגמרי, עד היום שבו הסתיימה הבנייה", "שהתאריך הוא אחרי שנה 1 לספירה", "שבניית הפירמידה נמשכה 2,560 שנה"], "״לערך״ פירושו ״בערך״. היסטוריונים כותבים כך כשתאריך הוא הערכה, וזה קורה הרבה באירועים עתיקים מאוד. באנגלית כותבים במקומה c., קיצור של המילה הלטינית circa."]],
      [["The Second World War lasted from 1939 to 1945. In which decades did it take place?", "The 1930s and the 1940s", ["Only the 1940s", "The 1940s and the 1950s", "The 1920s and the 1930s"], "1939 is the last year of the 1930s, and 1940 to 1945 are in the 1940s, so the war spans two decades."],
        ["מלחמת העולם השנייה נמשכה מ־1939 עד 1945. באילו עשורים היא התרחשה?", "בשנות ה־30 ובשנות ה־40", ["רק בשנות ה־40", "בשנות ה־40 ובשנות ה־50", "בשנות ה־20 ובשנות ה־30"], "1939 היא השנה האחרונה של שנות ה־30, והשנים 1940 עד 1945 שייכות לשנות ה־40, ולכן המלחמה נמשכה בשני עשורים."]],
      [["Why do historians put events on a timeline?", "To see the order of events and the time between them", ["To show where on a map each of the events took place", "To decide which of the events were good and which were bad", "To count how many people lived at the time"], "A timeline is a picture of time: it makes the order of events clear and, when it is drawn to scale, shows the gaps between them."],
        ["למה היסטוריונים מסמנים אירועים על ציר זמן?", "כדי לראות את סדר האירועים ואת הזמן שעבר ביניהם", ["כדי להראות איפה על המפה התרחש כל אחד מהאירועים", "כדי להחליט אילו מהאירועים היו טובים ואילו היו רעים", "כדי לספור כמה אנשים חיו באותה תקופה"], "ציר זמן הוא תמונה של הזמן: הוא מבהיר את סדר האירועים, וכשהוא משורטט בקנה מידה הוא מראה גם את המרווחים ביניהם."]],
    ],
    n: [
      [5, ["On a timeline, 1 centimetre stands for 10 years. How many centimetres apart are the marks for 1900 and 1950?", "cm", "The gap is 1950 − 1900 = 50 years, and 50 ÷ 10 = 5, so the marks are 5 cm apart."],
        ["בציר זמן, כל סנטימטר מייצג 10 שנים. כמה סנטימטרים יש בין הסימן של 1900 לסימן של 1950?", "ס״מ", "ההפרש הוא 1950 − 1900 = 50 שנה, ו־50 ÷ 10 = 5, ולכן הסימנים רחוקים 5 ס״מ זה מזה."]],
      [456, ["How many years passed from Columbus's first voyage in 1492 to the year 1948?", "years", "Subtract the earlier year from the later one: 1948 − 1492 = 456 years."],
        ["כמה שנים עברו מהמסע הראשון של קולומבוס ב־1492 ועד שנת 1948?", "שנים", "מחסירים את השנה המוקדמת מהמאוחרת: 1948 − 1492 = 456 שנים."]],
    ],
    s: [[["From the earliest event to the latest", "c. 2560 BCE: the Great Pyramid of Giza is built", "776 BCE: the first recorded Olympic Games are held in Greece", "44 BCE: Julius Caesar is killed in Rome", "476 CE: the Western Roman Empire falls", "1492 CE: Columbus reaches the Americas"],
      ["מהאירוע המוקדם ביותר למאוחר ביותר", "לערך 2560 לפנה״ס: נבנית הפירמידה הגדולה בגיזה", "776 לפנה״ס: נערכים ביוון המשחקים האולימפיים הראשונים שתועדו", "44 לפנה״ס: יוליוס קיסר נרצח ברומא", "476 לספירה: האימפריה הרומית המערבית נופלת", "1492 לספירה: קולומבוס מגיע לאמריקה"]]],
  },
  a: {
    t: [
      ["Anachronism", "something placed in a time where it does not belong, like a clock in a story about the Stone Age", "אנכרוניזם", "דבר שמוצב בזמן שאינו שייך אליו, כמו שעון בסיפור על תקופת האבן"],
      ["Anno Domini (AD)", "the older Latin name for the years from 1 onwards, meaning “in the year of the Lord”", "AD (אנו דומיני)", "השם הלטיני הישן לשנים משנה 1 והלאה, שפירושו ״בשנת האדון״"],
      ["Hijri calendar", "the Islamic way of counting years, which starts from Muhammad's move from Mecca to Medina in 622 CE", "הלוח ההיג׳רי", "שיטת ספירת השנים המוסלמית, שמתחילה מהמעבר של מוחמד ממכה למדינה ב־622 לספירה"],
    ],
    q: [
      [["A film about ancient Rome shows a soldier checking a wristwatch. What do historians call a mistake like this?", "An anachronism", ["A chronology", "An approximate date", "A primary source"], "An anachronism puts something in a time where it could not exist: wristwatches were invented many centuries after ancient Rome."],
        ["בסרט על רומא העתיקה נראה חייל שמציץ בשעון יד. איך קוראים היסטוריונים לטעות כזאת?", "אנכרוניזם", ["כרונולוגיה", "תאריך משוער", "מקור ראשוני"], "אנכרוניזם הוא הצבה של דבר בזמן שבו לא יכול היה להתקיים: שעוני יד הומצאו מאות רבות של שנים אחרי רומא העתיקה."]],
      [["Which year is in the 1st century BCE?", "50 BCE", ["150 BCE", "50 CE", "250 BCE"], "The 1st century BCE is the 100 years just before year 1, from 100 BCE to 1 BCE, so 50 BCE is in it. 150 BCE belongs to the 2nd century BCE."],
        ["איזו שנה נמצאת במאה ה־1 לפני הספירה?", "50 לפני הספירה", ["150 לפני הספירה", "50 לספירה", "250 לפני הספירה"], "המאה ה־1 לפני הספירה היא 100 השנים שלפני שנה 1, מ־100 עד 1 לפני הספירה, ולכן 50 לפני הספירה נמצאת בה. 150 לפני הספירה שייכת למאה ה־2 לפני הספירה."]],
      [["Counting strictly, the 1st century ran from year 1 to year 100. In which year did the 2nd century begin?", "In the year 101", ["In the year 100", "In the year 200", "In the year 99"], "There was no year 0, so the first 100 years are 1 to 100 and the 2nd century starts in 101. By the same rule the 21st century began on 1 January 2001."],
        ["בספירה מדויקת, המאה ה־1 נמשכה משנה 1 עד שנה 100. באיזו שנה התחילה המאה ה־2?", "בשנת 101", ["בשנת 100", "בשנת 200", "בשנת 99"], "לא הייתה שנה 0, ולכן 100 השנים הראשונות הן 1 עד 100, והמאה ה־2 מתחילה ב־101. לפי אותו כלל המאה ה־21 התחילה ב־1 בינואר 2001."]],
      [["A historian writes about “the late 18th century”. Which year fits best?", "1790", ["1720", "1890", "1810"], "The 18th century covers 1701 to 1800, so its late part is the 1780s and 1790s. 1890 is the late 19th century, a common mix-up."],
        ["היסטוריונית כותבת על ״סוף המאה ה־18״. איזו שנה מתאימה לכך ביותר?", "1790", ["1720", "1890", "1810"], "המאה ה־18 כוללת את השנים 1701 עד 1800, ולכן סופה הוא שנות ה־80 וה־90 של אותה מאה. 1890 היא סוף המאה ה־19, וזו טעות נפוצה."]],
      [["The Islamic calendar counts its years from 622 CE. Why are its year numbers much smaller than Common Era year numbers?", "It began counting in 622 CE, long after year 1", ["Its years are much longer than the years of the Common Era", "It counts only every second year", "It counts the years backwards"], "Year 1 of the Hijri calendar began in 622 CE, so far fewer years have been counted. Its years are in fact a little shorter (about 354 days), because they follow the Moon."],
        ["הלוח המוסלמי סופר את שנותיו מ־622 לספירה. למה מספרי השנים בו קטנים בהרבה ממספרי השנים לספירה?", "כי הוא התחיל לספור ב־622, הרבה אחרי שנה 1", ["כי השנים בו ארוכות בהרבה מהשנים בלוח הלועזי", "כי הוא סופר רק כל שנה שנייה", "כי הוא סופר את השנים לאחור"], "שנה 1 בלוח ההיג׳רי התחילה ב־622 לספירה, ולכן נספרו בו הרבה פחות שנים. השנים בו אפילו קצרות מעט יותר (כ־354 ימים), כי הן הולכות לפי הירח."]],
    ],
    n: [
      [19, ["How many years passed from 1 January 10 BCE to 1 January 10 CE? Remember that there was no year 0.", "years", "From 10 BCE to 1 CE is 10 years, and from 1 CE to 10 CE is 9 more, because the year after 1 BCE is 1 CE: 10 + 9 = 19 years."],
        ["כמה שנים עברו מ־1 בינואר 10 לפני הספירה ועד 1 בינואר 10 לספירה? זכרו שלא הייתה שנה 0.", "שנים", "מ־10 לפני הספירה עד 1 לספירה עוברות 10 שנים, ומ־1 עד 10 לספירה עוד 9, כי אחרי 1 לפני הספירה באה מיד 1 לספירה: 10 + 9 = 19 שנים."]],
      [57, ["Julius Caesar was killed in 44 BCE and the emperor Augustus died in 14 CE. How many years apart were these events?", "years", "Add the two numbers and subtract 1, because there was no year 0: 44 + 14 − 1 = 57 years."],
        ["יוליוס קיסר נרצח ב־44 לפני הספירה, והקיסר אוגוסטוס מת ב־14 לספירה. כמה שנים עברו בין שני האירועים?", "שנים", "מחברים את שני המספרים ומחסירים 1, כי לא הייתה שנה 0: 44 + 14 − 1 = 57 שנים."]],
      [5708, ["From January until the Jewish New Year, the Hebrew year equals the Common Era year plus 3760. Which Hebrew year was May 1948?", "", "1948 + 3760 = 5708. The State of Israel was declared on 5 Iyar 5708."],
        ["מינואר ועד ראש השנה, השנה העברית שווה לשנה הלועזית ועוד 3760. איזו שנה עברית הייתה במאי 1948?", "", "1948 + 3760 = 5708. מדינת ישראל הוכרזה בה׳ באייר ה׳תש״ח, שנת 5708."]],
    ],
  },
};
export default c;
