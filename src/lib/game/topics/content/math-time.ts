import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Hour", "a unit of time equal to 60 minutes", "שעה", "יחידת זמן ששווה ל־60 דקות"],
      ["Minute", "a unit of time equal to 60 seconds", "דקה", "יחידת זמן ששווה ל־60 שניות"],
      ["Week", "seven days in a row", "שבוע", "שבעה ימים ברצף"],
      ["Clock hands", "the pointers on a clock: the short one shows hours, the long one minutes", "מחוגי השעון", "המחוגים בשעון: הקצר מראה שעות והארוך דקות"],
    ],
    q: [
      [["How many minutes are in half an hour?", "30", ["50", "15", "60"], "An hour has 60 minutes, and half of 60 is 30, so half an hour is 30 minutes."],
        ["כמה דקות יש בחצי שעה?", "30", ["50", "15", "60"], "בשעה יש 60 דקות, וחצי מ־60 הוא 30, ולכן בחצי שעה יש 30 דקות."]],
      [["A film starts at 4:00 and lasts 2 hours. When does it end?", "6:00", ["5:00", "4:02", "8:00"], "The film lasts 2 hours, so add 2 hours to the start: 4:00 + 2 hours = 6:00. Adding only 2 minutes would give 4:02."],
        ["סרט מתחיל ב־4:00 ונמשך שעתיים. מתי הוא נגמר?", "6:00", ["5:00", "4:02", "8:00"], "הסרט נמשך שעתיים, ולכן מוסיפים שעתיים לשעת ההתחלה: 4:00 ועוד שעתיים = 6:00. הוספה של 2 דקות בלבד הייתה נותנת 4:02."]],
      [["The short hand points at 3 and the long hand points at 12. What time is it?", "3:00", ["12:15", "3:15", "12:03"], "The short hand shows the hour, so it is 3 o'clock. The long hand on 12 shows 0 minutes, so it is exactly 3:00. With the two hands swapped it would be 12:15."],
        ["המחוג הקצר מצביע על 3 והמחוג הארוך מצביע על 12. מה השעה?", "3:00", ["12:15", "3:15", "12:03"], "המחוג הקצר מראה את השעה, ולכן השעה 3. המחוג הארוך על 12 מראה 0 דקות, ולכן השעה בדיוק 3:00. אם המחוגים היו מוחלפים, השעה הייתה 12:15."]],
      [["Which of these is the longest time?", "1 week", ["100 hours", "1,000 minutes", "2 days"], "Compare them in hours: 1 week is 7 × 24 = 168 hours, which is more than 100 hours, 2 days (48 hours) and 1,000 minutes (about 17 hours)."],
        ["איזה מהבאים הוא משך הזמן הארוך ביותר?", "שבוע אחד", ["100 שעות", "1,000 דקות", "יומיים"], "משווים בשעות: שבוע הוא 7 × 24 = 168 שעות, יותר מ־100 שעות, מיומיים (48 שעות) ומ־1,000 דקות (בערך 17 שעות)."]],
      [["A lesson starts at 8:15 and lasts 45 minutes. When does it end?", "9:00", ["8:60", "9:15", "8:30"], "15 + 45 = 60 minutes, and 60 minutes make one whole hour, so the lesson ends at 9:00. A clock never shows 8:60."],
        ["שיעור מתחיל ב־8:15 ונמשך 45 דקות. מתי הוא נגמר?", "9:00", ["8:60", "9:15", "8:30"], "15 + 45 = 60 דקות, ו־60 דקות הן שעה שלמה, ולכן השיעור נגמר ב־9:00. בשעון אף פעם לא מופיע 8:60."]],
    ],
    n: [
      [14, ["How many days are there in 2 weeks?", "", "One week has 7 days, so 2 weeks have 7 + 7 = 14 days."],
        ["כמה ימים יש ב־2 שבועות?", "", "בשבוע אחד יש 7 ימים, ולכן ב־2 שבועות יש 7 + 7 = 14 ימים."]],
    ],
    s: [
      [["From the shortest time to the longest", "1 minute", "1 hour", "1 day", "1 week", "1 year"],
        ["מהזמן הקצר ביותר לארוך ביותר", "דקה אחת", "שעה אחת", "יום אחד", "שבוע אחד", "שנה אחת"]],
    ],
  },
  i: {
    t: [
      ["24-hour clock", "a way of telling time from 00:00 to 23:59 without a.m. or p.m.", "שעון 24 שעות", "דרך לציין שעה מ־00:00 עד 23:59, בלי ״לפני הצהריים״ ו״אחרי הצהריים״"],
      ["Leap year", "a year with 366 days, with 29 February added", "שנה מעוברת (לועזית)", "שנה של 366 ימים, שבה נוסף 29 בפברואר"],
      ["Duration", "how long something lasts", "משך זמן", "כמה זמן משהו נמשך"],
      ["Decade", "a period of ten years", "עשור", "תקופה של עשר שנים"],
    ],
    q: [
      [["What is 15:45 in the 12-hour clock?", "3:45 p.m.", ["5:45 p.m.", "3:45 a.m.", "1:45 p.m."], "Subtract 12 from hours after noon: 15 − 12 = 3, so 3:45 p.m."],
        ["מה השעה 15:45 בשיטת 12 השעות?", "3:45 אחר הצהריים", ["5:45 אחר הצהריים", "3:45 לפנות בוקר", "1:45 אחר הצהריים"], "משעות אחר הצהריים מחסרים 12: 15 − 12 = 3, כלומר 3:45 אחר הצהריים."]],
      [["A lesson runs from 10:50 to 11:35. How long is it?", "45 minutes", ["85 minutes", "55 minutes", "35 minutes"], "10:50 → 11:00 is 10 minutes, then 35 more: 45 minutes."],
        ["שיעור נמשך מ־10:50 עד 11:35. כמה זמן הוא?", "45 דקות", ["85 דקות", "55 דקות", "35 דקות"], "מ־10:50 עד 11:00 יש 10 דקות, ועוד 35: בסך הכול 45 דקות."]],
      [["What is 7:30 p.m. on the 24-hour clock?", "19:30", ["07:30", "17:30", "21:30"], "After noon, add 12 to the hour: 7 + 12 = 19, so 7:30 p.m. is 19:30. The time 07:30 is half past seven in the morning."],
        ["מה השעה 7:30 בערב בשעון 24 שעות?", "19:30", ["07:30", "17:30", "21:30"], "אחרי הצהריים מוסיפים 12 לשעה: 7 + 12 = 19, ולכן 7:30 בערב היא 19:30. השעה 07:30 היא שבע וחצי בבוקר."]],
      [["Which of these years has 366 days?", "2024", ["2022", "2025", "2026"], "A year with 366 days is a leap year, and leap years come every 4 years: 2020, 2024, 2028. Only 2024 divides exactly by 4, so only it has the extra day, 29 February."],
        ["באיזו מהשנים האלה יש 366 ימים?", "2024", ["2022", "2025", "2026"], "שנה של 366 ימים היא שנה מעוברת, ושנים מעוברות באות אחת ל־4 שנים: 2020, 2024, 2028. רק 2024 מתחלקת ב־4 בלי שארית, ולכן רק בה יש יום נוסף, 29 בפברואר."]],
      [["A bus leaves at 22:15 and arrives at 01:05 the next morning. How long is the journey?", "2 hours 50 minutes", ["3 hours 10 minutes", "21 hours 10 minutes", "2 hours 10 minutes"], "From 22:15 to midnight is 1 hour 45 minutes, and from midnight to 01:05 is another 1 hour 5 minutes: 2 hours 50 minutes in all."],
        ["אוטובוס יוצא ב־22:15 ומגיע ב־01:05 למחרת. כמה זמן נמשכת הנסיעה?", "שעתיים ו־50 דקות", ["3 שעות ו־10 דקות", "21 שעות ו־10 דקות", "שעתיים ו־10 דקות"], "מ־22:15 עד חצות עוברות שעה ו־45 דקות, ומחצות עד 01:05 עוברות עוד שעה ו־5 דקות: בסך הכול שעתיים ו־50 דקות."]],
    ],
    n: [
      [3600, ["How many seconds are in one hour?", "", "An hour has 60 minutes and each minute has 60 seconds: 60 × 60 = 3,600 seconds."], ["כמה שניות יש בשעה אחת?", "", "בשעה יש 60 דקות ובכל דקה 60 שניות: 60 × 60 = 3,600 שניות."]],
      [95, ["A film starts at 18:40 and ends at 20:15. How many minutes does it last?", "min", "From 18:40 to 20:00 is 80 minutes, and from 20:00 to 20:15 is 15 more minutes: 80 + 15 = 95 minutes."],
        ["סרט מתחיל ב־18:40 ונגמר ב־20:15. כמה דקות הוא נמשך?", "דקות", "מ־18:40 עד 20:00 עוברות 80 דקות, ומ־20:00 עד 20:15 עוד 15 דקות: 80 + 15 = 95 דקות."]],
    ],
    s: [
      [["From the shortest time to the longest, in different units", "90 seconds", "2 minutes", "A quarter of an hour", "1,000 seconds", "1 hour"],
        ["מהזמן הקצר ביותר לארוך ביותר, ביחידות שונות", "90 שניות", "2 דקות", "רבע שעה", "1,000 שניות", "שעה אחת"]],
    ],
  },
  a: {
    t: [
      ["Time zone", "a region that uses the same clock time; most zones differ from UTC by whole hours", "אזור זמן", "אזור שבו משתמשים באותה שעה; רוב האזורים שונים מ־UTC בשעות שלמות"],
      ["UTC", "Coordinated Universal Time, the reference time from which time zones are counted", "UTC", "הזמן האוניברסלי המתואם, שממנו סופרים את אזורי הזמן"],
      ["Daylight saving time", "moving clocks one hour forward in summer to get more evening light", "שעון קיץ", "הקדמת השעון בשעה אחת בקיץ כדי ליהנות מיותר אור בערב"],
      ["Century", "a period of one hundred years", "מאה (שנים)", "תקופה של 100 שנים"],
    ],
    q: [
      [["Which of these years is a leap year?", "2000", ["1900", "2100", "2023"], "Years divisible by 4 are leap years, except century years not divisible by 400: 2000 is a leap year, 1900 and 2100 are not."],
        ["איזו מהשנים הבאות היא שנה מעוברת (לועזית)?", "2000", ["1900", "2100", "2023"], "שנים שמתחלקות ב־4 הן מעוברות, חוץ משנות מאה שאינן מתחלקות ב־400: 2000 היא מעוברת, 1900 ו־2100 לא."]],
      [["The year 1948 is in which century?", "The 20th century", ["The 19th century", "The 21st century", "The 18th century"], "The 20th century covers the years 1901 to 2000, so the year 1948 belongs to it, not to the 19th century."],
        ["השנה 1948 נמצאת באיזו מאה?", "במאה ה־20", ["במאה ה־19", "במאה ה־21", "במאה ה־18"], "המאה ה־20 כוללת את השנים 1901 עד 2000, ולכן השנה 1948 שייכת לה ולא למאה ה־19."]],
      [["It is 12:00 UTC. Israel in winter is UTC+2 and New York in winter is UTC−5. What time is it in New York?", "07:00", ["17:00", "10:00", "14:00"], "12:00 − 5 hours = 07:00 in New York (and 14:00 in Israel)."],
        ["השעה 12:00 לפי UTC. ישראל בחורף היא UTC+2 וניו יורק בחורף UTC−5. מה השעה בניו יורק?", "07:00", ["17:00", "10:00", "14:00"], "12:00 פחות 5 שעות = 07:00 בניו יורק (ו־14:00 בישראל)."]],
      [["A plane leaves Tel Aviv at 09:00 Israel time and flies for 5 hours. London time is 2 hours behind Israel time. What time is it in London when the plane lands?", "12:00", ["14:00", "16:00", "07:00"], "The plane lands at 09:00 + 5 hours = 14:00 Israel time. London is 2 hours behind Israel, so the local time there is 14:00 − 2 hours = 12:00."],
        ["מטוס ממריא מתל אביב ב־09:00 לפי שעון ישראל וטס 5 שעות. השעה בלונדון מאחרת בשעתיים לעומת ישראל. מה השעה בלונדון כשהמטוס נוחת?", "12:00", ["14:00", "16:00", "07:00"], "המטוס נוחת ב־09:00 ועוד 5 שעות = 14:00 לפי שעון ישראל. לונדון מאחרת בשעתיים, ולכן השעה שם 14:00 פחות שעתיים = 12:00."]],
      [["The year 2000 belongs to which century?", "The 20th century", ["The 21st century", "The 19th century"], "Centuries are counted from the year 1, so the 20th century runs from 1901 to 2000 and the year 2000 is its last year. The 21st century begins in 2001."],
        ["השנה 2000 שייכת לאיזו מאה?", "למאה ה־20", ["למאה ה־21", "למאה ה־19"], "סופרים מאות מהשנה 1, ולכן המאה ה־20 נמשכת מ־1901 עד 2000, והשנה 2000 היא השנה האחרונה שלה. המאה ה־21 מתחילה ב־2001."]],
      [["Why does the calendar have a leap day every four years?", "A year is about 365¼ days long, so a day is added to keep the calendar in step with the seasons", ["Months have different lengths, so a day is added to make up for the short months, such as February", "The Moon goes around the Earth in about 29 days, which does not fit exactly into a year", "Each day gets a little longer in winter, so a day is added to balance the year"], "The Earth takes about 365 days and 6 hours to go around the Sun. The 6 extra hours add up to about one day every four years, and without it the calendar would slowly drift away from the seasons."],
        ["למה יש בלוח השנה יום נוסף אחת לארבע שנים?", "שנה נמשכת בערך 365 ימים ורבע, ולכן מוסיפים יום כדי שלוח השנה יישאר מתואם עם עונות השנה", ["לחודשים יש אורכים שונים, ולכן מוסיפים יום כדי לפצות על החודשים הקצרים, כמו פברואר", "הירח מקיף את כדור הארץ בערך ב־29 ימים, וזה לא מתחלק בדיוק בשנה", "בחורף כל יום ארוך מעט יותר, ולכן מוסיפים יום כדי לאזן את השנה"], "כדור הארץ משלים הקפה סביב השמש בערך ב־365 ימים ו־6 שעות. השעות הנוספות מצטברות בערך ליום אחד אחת לארבע שנים, ובלעדיו לוח השנה היה זז לאט ומתרחק מעונות השנה."]],
    ],
    n: [
      [1096, ["A common year has 365 days. How many days are there in the three years 2023, 2024 and 2025 together?", "days", "Only 2024 is a leap year with 366 days, so the total is 365 + 366 + 365 = 1,096 days."],
        ["בשנה רגילה יש 365 ימים. כמה ימים יש בשלוש השנים 2023, 2024 ו־2025 יחד?", "ימים", "רק 2024 היא שנה מעוברת של 366 ימים, ולכן הסך הכול הוא 365 + 366 + 365 = 1,096 ימים."]],
      [14, ["It is 21:00 in Tokyo, which is UTC+9. Israel in winter is UTC+2. What is the hour in Israel, on the 24-hour clock?", "", "Tokyo is 9 − 2 = 7 hours ahead of Israel in winter, so 21:00 in Tokyo is 21 − 7 = 14:00 in Israel."],
        ["השעה 21:00 בטוקיו, שנמצאת ב־UTC+9. ישראל בחורף היא UTC+2. מה השעה בישראל, בשעון 24 שעות?", "", "טוקיו מקדימה את ישראל בחורף ב־9 − 2 = 7 שעות, ולכן 21:00 בטוקיו היא 21 − 7 = 14:00 בישראל."]],
    ],
    s: [
      [["Converting a time from one time zone to another", "Find the UTC offset of the place where you know the time", "Subtract that offset from the local time to get the UTC time", "Find the UTC offset of the other place", "Add that offset to the UTC time to get the local time there"],
        ["המרת שעה מאזור זמן אחד לאחר", "מוצאים את הפרש השעות מ־UTC במקום שבו השעה ידועה", "מחסרים את ההפרש הזה מהשעה המקומית ומקבלים את שעת UTC", "מוצאים את הפרש השעות מ־UTC במקום השני", "מוסיפים את ההפרש הזה לשעת UTC ומקבלים את השעה המקומית שם"]],
    ],
  },
};
export default c;
