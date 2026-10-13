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
      [["How many minutes are in half an hour?", "30", ["50", "15", "60"], "An hour has 60 minutes; half of 60 is 30."],
        ["כמה דקות יש בחצי שעה?", "30", ["50", "15", "60"], "בשעה יש 60 דקות; חצי מ־60 הוא 30."]],
      [["A film starts at 4:00 and lasts 2 hours. When does it end?", "6:00", ["5:00", "4:02", "8:00"], "4:00 + 2 hours = 6:00."],
        ["סרט מתחיל ב־4:00 ונמשך שעתיים. מתי הוא נגמר?", "6:00", ["5:00", "4:02", "8:00"], "4:00 ועוד שעתיים = 6:00."]],
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
    ],
    n: [[3600, ["How many seconds are in one hour?", "", "60 minutes × 60 seconds = 3,600 seconds."], ["כמה שניות יש בשעה אחת?", "", "60 דקות × 60 שניות = 3,600 שניות."]]],
  },
  a: {
    t: [
      ["Time zone", "a region that uses the same clock time; most zones differ from UTC by whole hours", "אזור זמן", "אזור שבו משתמשים באותה שעה; רוב האזורים שונים מ־UTC בשעות שלמות"],
      ["UTC", "Coordinated Universal Time, the reference time from which time zones are counted", "UTC", "הזמן האוניברסלי המתואם, שממנו סופרים את אזורי הזמן"],
      ["Daylight saving time", "moving clocks one hour forward in summer to get more evening light", "שעון קיץ", "הקדמת השעון בשעה אחת בקיץ כדי ליהנות מיותר אור בערב"],
      ["Century", "a period of one hundred years", "מאה (שנים)", "תקופה של מאה שנים"],
    ],
    q: [
      [["Which of these years was a leap year?", "2000", ["1900", "2100", "2023"], "Years divisible by 4 are leap years, except century years not divisible by 400: 2000 was, 1900 was not."],
        ["איזו מהשנים הבאות הייתה שנה מעוברת (לועזית)?", "2000", ["1900", "2100", "2023"], "שנים שמתחלקות ב־4 הן מעוברות, חוץ משנות מאה שאינן מתחלקות ב־400: 2000 הייתה, 1900 לא."]],
      [["The year 1948 is in which century?", "The 20th century", ["The 19th century", "The 21st century", "The 18th century"], "The 20th century covers the years 1901–2000."],
        ["השנה 1948 נמצאת באיזו מאה?", "במאה ה־20", ["במאה ה־19", "במאה ה־21", "במאה ה־18"], "המאה ה־20 כוללת את השנים 1901–2000."]],
      [["It is 12:00 UTC. Israel in winter is UTC+2 and New York in winter is UTC−5. What time is it in New York?", "07:00", ["17:00", "10:00", "14:00"], "12:00 − 5 hours = 07:00 in New York (and 14:00 in Israel)."],
        ["השעה 12:00 לפי UTC. ישראל בחורף היא UTC+2 וניו יורק בחורף UTC−5. מה השעה בניו יורק?", "07:00", ["17:00", "10:00", "14:00"], "12:00 פחות 5 שעות = 07:00 בניו יורק (ו־14:00 בישראל)."]],
    ],
  },
};
export default c;
