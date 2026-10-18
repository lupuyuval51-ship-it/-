import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Speed", "how far something travels in each unit of time, for example how many kilometres in every hour", "מהירות", "כמה דרך עובר משהו בכל יחידת זמן, למשל כמה קילומטרים בכל שעה"],
      ["Distance", "how long the route from one place to another is, measured in metres or kilometres", "דרך", "האורך של המסלול ממקום למקום, שנמדד במטרים או בקילומטרים"],
      ["Kilometres per hour", "a unit of speed: the number of kilometres covered in one hour, written km/h", "קילומטר לשעה", "יחידת מהירות: מספר הקילומטרים שעוברים בשעה אחת, ונכתבת קמ״ש"],
    ],
    q: [
      [["Which formula gives the distance travelled?", "distance = speed × time", ["distance = speed ÷ time", "distance = time ÷ speed", "distance = speed + time"], "At 50 km/h you cover 50 km in each hour, so in 3 hours you cover 50 × 3 = 150 km: speed times time."],
        ["איזו נוסחה נותנת את הדרך שעברו?", "דרך = מהירות × זמן", ["דרך = מהירות ÷ זמן", "דרך = זמן ÷ מהירות", "דרך = מהירות + זמן"], "במהירות של 50 קמ״ש עוברים 50 ק״מ בכל שעה, ולכן ב־3 שעות עוברים 50 × 3 = 150 ק״מ: מהירות כפול זמן."]],
      [["A cyclist rides 30 km in 2 hours at a steady speed. What is her speed?", "15 km/h", ["60 km/h", "32 km/h", "28 km/h"], "Speed is distance divided by time: 30 ÷ 2 = 15 km/h. Multiplying to get 60 would mean she rode 60 km in every hour."],
        ["רוכבת אופניים עוברת 30 ק״מ ב־2 שעות במהירות קבועה. מהי המהירות שלה?", "15 קמ״ש", ["60 קמ״ש", "32 קמ״ש", "28 קמ״ש"], "מהירות היא דרך חלקי זמן: 30 ÷ 2 = 15 קמ״ש. הכפל, שנותן 60, היה אומר שהיא רכבה 60 ק״מ בכל שעה."]],
      [["How long does it take to walk 12 km at 4 km/h?", "3 hours", ["48 hours", "8 hours", "16 hours"], "Time is distance divided by speed: 12 ÷ 4 = 3 hours. Each hour covers 4 km, and 4 + 4 + 4 = 12."],
        ["כמה זמן לוקח ללכת 12 ק״מ במהירות של 4 קמ״ש?", "3 שעות", ["48 שעות", "8 שעות", "16 שעות"], "זמן הוא דרך חלקי מהירות: 12 ÷ 4 = 3 שעות. בכל שעה עוברים 4 ק״מ, ו־4 + 4 + 4 = 12."]],
      [["Which is faster: 1 km in 5 minutes, or 10 km in 1 hour?", "1 km in 5 minutes", ["10 km in 1 hour", "They are the same speed"], "An hour has 12 lots of 5 minutes, so 1 km every 5 minutes is 12 km in an hour, which is more than 10 km."],
        ["מה מהיר יותר: 1 ק״מ ב־5 דקות או 10 ק״מ בשעה אחת?", "1 ק״מ ב־5 דקות", ["10 ק״מ בשעה אחת", "המהירות של שניהם שווה"], "בשעה יש 12 פעמים 5 דקות, ולכן 1 ק״מ בכל 5 דקות הוא 12 ק״מ בשעה, וזה יותר מ־10 ק״מ."]],
      [["A runner keeps the same speed. If she runs for twice as long, what happens to the distance she covers?", "It doubles", ["It halves", "It stays the same", "It goes up by exactly 2 km"], "At a steady speed, distance = speed × time, so doubling the time doubles the distance: 2 hours at 8 km/h is 16 km, twice the 8 km of 1 hour."],
        ["אצנית שומרת על אותה מהירות. אם היא רצה זמן כפול, מה קורה לדרך שהיא עוברת?", "היא גדלה פי 2", ["היא קטנה פי 2", "היא לא משתנה", "היא גדלה ב־2 ק״מ בדיוק"], "במהירות קבועה, דרך = מהירות × זמן, ולכן כשהזמן גדל פי 2 גם הדרך גדלה פי 2: שעתיים ב־8 קמ״ש הן 16 ק״מ, פי 2 מה־8 ק״מ של שעה אחת."]],
    ],
    n: [
      [180, ["A car drives at 60 km/h for 3 hours. How far does it go?", "km", "In each hour the car covers 60 km, so in 3 hours it covers 60 × 3 = 180 km."],
        ["מכונית נוסעת במהירות של 60 קמ״ש במשך 3 שעות. איזו דרך היא עוברת?", "ק״מ", "בכל שעה המכונית עוברת 60 ק״מ, ולכן ב־3 שעות היא עוברת 60 × 3 = 180 ק״מ."]],
      [50, ["A train travels at 100 km/h. How far does it go in half an hour?", "km", "Half an hour is half of 1 hour, so the train covers half of 100 km: 100 × 0.5 = 50 km."],
        ["רכבת נוסעת במהירות של 100 קמ״ש. איזו דרך היא עוברת בחצי שעה?", "ק״מ", "חצי שעה היא מחצית משעה אחת, ולכן הרכבת עוברת מחצית מ־100 ק״מ: 100 × 0.5 = 50 ק״מ."]],
    ],
    s: [
      [["From slowest to fastest", "A snail", "A person walking", "A cyclist", "A car on a motorway", "A passenger jet in flight"],
        ["מהאיטי ביותר למהיר ביותר", "חילזון", "אדם שהולך ברגל", "רוכב אופניים", "מכונית בכביש מהיר", "מטוס נוסעים בטיסה"]],
    ],
  },
  i: {
    t: [
      ["Average speed", "the total distance of a journey divided by the total time it took", "מהירות ממוצעת", "הדרך הכוללת של מסע חלקי הזמן הכולל שלו"],
      ["Metres per second", "a unit of speed: how many metres are covered in each second, written m/s", "מטר לשנייה", "יחידת מהירות: כמה מטרים עוברים בכל שנייה, ונכתבת m/s"],
      ["Distance–time graph", "a graph of how far something has gone as time passes; a steeper line means a higher speed", "גרף דרך־זמן", "גרף שמראה כמה דרך עברו ככל שהזמן עובר; קו תלול יותר פירושו מהירות גבוהה יותר"],
    ],
    q: [
      [["A bus travels 120 km in 2 hours and then 30 km in 1 hour. What is its average speed for the whole trip?", "50 km/h", ["45 km/h", "75 km/h", "150 km/h"], "Average speed = total distance ÷ total time = 150 ÷ 3 = 50 km/h. Averaging the two speeds, (60 + 30) ÷ 2 = 45, is wrong because the bus spent longer at 60 km/h."],
        ["אוטובוס עובר 120 ק״מ ב־2 שעות, ואחר כך 30 ק״מ בשעה אחת. מהי המהירות הממוצעת שלו בכל הנסיעה?", "50 קמ״ש", ["45 קמ״ש", "75 קמ״ש", "150 קמ״ש"], "מהירות ממוצעת = הדרך הכוללת ÷ הזמן הכולל = 150 ÷ 3 = 50 קמ״ש. הממוצע של שתי המהירויות, (60 + 30) ÷ 2 = 45, שגוי, כי האוטובוס נסע זמן רב יותר במהירות של 60 קמ״ש."]],
      [["What is 36 km/h in metres per second?", "10 m/s", ["36 m/s", "3.6 m/s", "100 m/s"], "36 km is 36,000 m and an hour is 3,600 seconds: 36,000 ÷ 3,600 = 10 m/s. A quick rule: divide a speed in km/h by 3.6 to get m/s."],
        ["כמה זה 36 קמ״ש במטרים לשנייה?", "10 מ׳ לשנייה", ["36 מ׳ לשנייה", "3.6 מ׳ לשנייה", "100 מ׳ לשנייה"], "36 ק״מ הם 36,000 מ׳, ובשעה יש 3,600 שניות: 36,000 ÷ 3,600 = 10 מ׳ לשנייה. כלל מהיר: מחלקים מהירות בקמ״ש ב־3.6 ומקבלים מטרים לשנייה."]],
      [["On a distance–time graph, what does a flat, horizontal part of the line show?", "The object is standing still", ["The object is moving at a steady speed", "The object is speeding up", "The object is going back to the start"], "A flat line means time passes but the distance does not change, so the object is not moving. A straight sloping line would show a steady speed."],
        ["בגרף דרך־זמן, מה מראה קטע שטוח, אופקי, של הקו?", "הגוף עומד במקום", ["הגוף נע במהירות קבועה", "הגוף מאיץ", "הגוף חוזר לנקודת ההתחלה"], "קו שטוח פירושו שהזמן עובר אבל הדרך לא משתנה, ולכן הגוף לא זז. קו ישר משופע היה מראה מהירות קבועה."]],
      [["A car travels 90 km at 60 km/h. How long does the trip take?", "1 hour 30 minutes", ["1 hour 50 minutes", "1 hour 15 minutes", "2 hours 30 minutes"], "Time = 90 ÷ 60 = 1.5 hours. Half an hour is 30 minutes, not 50, so 1.5 hours is 1 hour 30 minutes."],
        ["מכונית עוברת 90 ק״מ במהירות של 60 קמ״ש. כמה זמן נמשכת הנסיעה?", "שעה ו־30 דקות", ["שעה ו־50 דקות", "שעה ו־15 דקות", "שעתיים ו־30 דקות"], "זמן = 90 ÷ 60 = 1.5 שעות. חצי שעה היא 30 דקות ולא 50, ולכן 1.5 שעות הן שעה ו־30 דקות."]],
      [["Two cars leave the same town at the same time, driving in opposite directions at 50 km/h and 70 km/h. How far apart are they after 2 hours?", "240 km", ["40 km", "120 km", "140 km"], "Each hour the gap grows by 50 + 70 = 120 km, so after 2 hours they are 240 km apart. 40 km would be right only if they drove in the same direction."],
        ["שתי מכוניות יוצאות מאותה עיר באותו זמן ונוסעות בכיוונים מנוגדים, במהירות של 50 קמ״ש ושל 70 קמ״ש. מה המרחק ביניהן אחרי 2 שעות?", "240 ק״מ", ["40 ק״מ", "120 ק״מ", "140 ק״מ"], "בכל שעה המרחק ביניהן גדל ב־50 + 70 = 120 ק״מ, ולכן אחרי 2 שעות הן במרחק 240 ק״מ זו מזו. 40 ק״מ היה נכון רק אילו נסעו לאותו כיוון."]],
    ],
    n: [
      [5, ["A runner covers 400 m in 80 seconds at a steady pace. What is her speed in metres per second?", "m/s", "Speed = distance ÷ time = 400 ÷ 80 = 5 m/s: she covers 5 metres every second."],
        ["אצנית עוברת 400 מ׳ ב־80 שניות בקצב קבוע. מהי המהירות שלה במטרים לשנייה?", "מ׳ לשנייה", "מהירות = דרך ÷ זמן = 400 ÷ 80 = 5 מ׳ לשנייה: היא עוברת 5 מטרים בכל שנייה."]],
      [80, ["A train leaves at 10:40 and arrives at 13:10, after travelling 200 km. What is its average speed in km/h?", "km/h", "From 10:40 to 13:10 is 2 hours 30 minutes, or 2.5 hours, and 200 ÷ 2.5 = 80 km/h."],
        ["רכבת יוצאת ב־10:40 ומגיעה ב־13:10, אחרי שעברה 200 ק״מ. מהי המהירות הממוצעת שלה בקמ״ש?", "קמ״ש", "מ־10:40 עד 13:10 עוברות שעתיים ו־30 דקות, כלומר 2.5 שעות, ו־200 ÷ 2.5 = 80 קמ״ש."]],
    ],
  },
  a: {
    t: [
      ["Relative speed", "how fast the gap between two moving objects grows or shrinks", "מהירות יחסית", "הקצב שבו המרחק בין שני גופים נעים גדל או קטן"],
      ["Meeting point", "the place where two travellers heading towards each other come together", "נקודת המפגש", "המקום שבו שני נוסעים שנעים זה לקראת זה נפגשים"],
      ["Constant speed", "covering the same distance in every equal stretch of time, never speeding up or slowing down", "מהירות קבועה", "תנועה שבה עוברים אותה דרך בכל פרק זמן שווה, בלי להאיץ ובלי להאט"],
    ],
    q: [
      [["Two trains 300 km apart travel towards each other at 70 km/h and 80 km/h. After how long do they meet?", "2 hours", ["30 hours", "4 hours", "3 hours"], "Moving towards each other, they close the gap at 70 + 80 = 150 km/h, so they meet after 300 ÷ 150 = 2 hours. 30 hours comes from wrongly using the difference, 10 km/h."],
        ["שתי רכבות שהמרחק ביניהן 300 ק״מ נוסעות זו לקראת זו במהירות של 70 קמ״ש ושל 80 קמ״ש. אחרי כמה זמן הן נפגשות?", "אחרי 2 שעות", ["אחרי 30 שעות", "אחרי 4 שעות", "אחרי 3 שעות"], "כשהן נוסעות זו לקראת זו, המרחק ביניהן קטן ב־70 + 80 = 150 קמ״ש, ולכן הן נפגשות אחרי 300 ÷ 150 = 2 שעות. התשובה 30 שעות מתקבלת משימוש שגוי בהפרש, 10 קמ״ש."]],
      [["You drive to a town at 60 km/h and come back the same way at 40 km/h. What is your average speed for the round trip?", "48 km/h", ["50 km/h", "45 km/h", "100 km/h"], "Say the town is 120 km away: going takes 2 hours and coming back 3 hours, so 240 km in 5 hours is 48 km/h. It is less than 50 because you spend longer at the slower speed."],
        ["נוסעים לעיר במהירות של 60 קמ״ש וחוזרים באותה דרך במהירות של 40 קמ״ש. מהי המהירות הממוצעת בנסיעה הלוך ושוב?", "48 קמ״ש", ["50 קמ״ש", "45 קמ״ש", "100 קמ״ש"], "נניח שהעיר במרחק 120 ק״מ: הנסיעה הלוך לוקחת 2 שעות והחזרה 3 שעות, ולכן 240 ק״מ ב־5 שעות הם 48 קמ״ש. זה פחות מ־50, כי נוסעים זמן רב יותר במהירות האיטית."]],
      [["A cyclist leaves at 9:00 riding at 15 km/h. At 10:00 a car leaves the same place on the same road at 45 km/h. When does the car catch up?", "10:30", ["11:00", "10:20", "12:00"], "At 10:00 the cyclist is 15 km ahead. The car gains 45 − 15 = 30 km every hour, so it needs 15 ÷ 30 = 0.5 hours: it catches up at 10:30."],
        ["רוכב אופניים יוצא ב־9:00 במהירות של 15 קמ״ש. ב־10:00 יוצאת מכונית מאותו מקום, באותו כביש, במהירות של 45 קמ״ש. מתי המכונית משיגה אותו?", "ב־10:30", ["ב־11:00", "ב־10:20", "ב־12:00"], "ב־10:00 הרוכב נמצא 15 ק״מ לפני המכונית. המכונית מצמצמת את הפער ב־45 − 15 = 30 ק״מ בכל שעה, ולכן היא צריכה 15 ÷ 30 = 0.5 שעה: היא משיגה אותו ב־10:30."]],
      [["On a speed–time graph, what does the area under the line show?", "The distance travelled", ["The acceleration of the object", "The average speed of the trip", "The total time taken"], "Area is speed × time, which is distance. For a steady 20 m/s for 10 s the area is a rectangle of 20 × 10 = 200 m. The slope, not the area, shows the acceleration."],
        ["בגרף מהירות־זמן, מה מראה השטח שמתחת לקו?", "את הדרך שעברו", ["את התאוצה של הגוף", "את המהירות הממוצעת בנסיעה", "את הזמן הכולל שעבר"], "השטח הוא מהירות × זמן, וזו הדרך. במהירות קבועה של 20 מ׳ לשנייה במשך 10 שניות השטח הוא מלבן של 20 × 10 = 200 מ׳. את התאוצה מראה השיפוע, ולא השטח."]],
      [["A runner runs the first half of a 10 km race at 10 km/h and the second half at 15 km/h. How long does the race take her?", "50 minutes", ["48 minutes", "1 hour", "40 minutes"], "The first 5 km take 5 ÷ 10 = 0.5 hours (30 minutes) and the second 5 km take 5 ÷ 15 = 1/3 hour (20 minutes): 50 minutes in all. 48 minutes comes from wrongly averaging the speeds to 12.5 km/h."],
        ["אצנית רצה את המחצית הראשונה של מרוץ 10 ק״מ במהירות של 10 קמ״ש ואת המחצית השנייה במהירות של 15 קמ״ש. כמה זמן נמשך המרוץ שלה?", "50 דקות", ["48 דקות", "שעה אחת", "40 דקות"], "5 הק״מ הראשונים לוקחים 5 ÷ 10 = 0.5 שעה (30 דקות) ו־5 הק״מ השניים לוקחים 5 ÷ 15 = 1/3 שעה (20 דקות): 50 דקות בסך הכול. 48 דקות מתקבלות מממוצע שגוי של המהירויות, 12.5 קמ״ש."]],
    ],
    n: [
      [30, ["A train 200 m long travels at 20 m/s. How many seconds does it take to cross a bridge 400 m long completely?", "seconds", "The front must travel the bridge plus the train's own length, 400 + 200 = 600 m, before the back leaves the bridge. 600 ÷ 20 = 30 seconds."],
        ["רכבת שאורכה 200 מ׳ נוסעת במהירות של 20 מ׳ לשנייה. כמה שניות לוקח לה לעבור לגמרי גשר שאורכו 400 מ׳?", "שניות", "החזית צריכה לעבור את הגשר ועוד את אורך הרכבת עצמה, 400 + 200 = 600 מ׳, עד שהסוף יוצא מהגשר. 600 ÷ 20 = 30 שניות."]],
      [1020, ["Taking the speed of sound in air as 340 m/s, how far away is a lightning strike if you hear the thunder 3 seconds after the flash?", "m", "The light arrives almost at once, so the 3 seconds are the time the sound takes: 340 × 3 = 1020 m, about 1 km."],
        ["אם מהירות הקול באוויר היא 340 מ׳ לשנייה, באיזה מרחק היכה הברק כששומעים את הרעם 3 שניות אחרי ההבזק?", "מ׳", "האור מגיע כמעט מיד, ולכן 3 השניות הן הזמן שלוקח לקול להגיע: 340 × 3 = 1020 מ׳, בערך 1 ק״מ."]],
    ],
  },
};
export default c;
