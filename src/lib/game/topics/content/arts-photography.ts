import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Lens", "the curved glass at the front of a camera that bends light to form the picture", "עדשה", "הזכוכית המעוקלת בחזית המצלמה, שמכופפת את האור ויוצרת את התמונה"],
      ["Focus", "making the main subject of a photo look sharp and clear", "פוקוס", "כיוון המצלמה כך שהנושא העיקרי בתמונה ייראה חד וברור"],
      ["Flash", "a short, bright burst of light from the camera for dark places", "מבזק", "הבזק אור קצר וחזק שהמצלמה פולטת במקומות חשוכים"],
      ["Portrait", "a photo of a person, usually showing the face", "דיוקן", "תמונה של אדם, בדרך כלל עם הפנים"],
    ],
    q: [
      [["You photograph a friend standing in front of a bright window. Why may their face come out dark?", "The camera adjusts to the bright window, so the face gets too little light", ["The lens is dirty", "The flash was too strong", "Your friend moved"], "Strong light behind the subject (backlight) fools the camera; move so that the light falls on the face."],
        ["אתם מצלמים חבר שעומד מול חלון מואר. למה הפנים שלו עלולות לצאת כהות?", "המצלמה מתאימה את עצמה לחלון הבהיר, והפנים מקבלות מעט מדי אור", ["העדשה מלוכלכת", "המבזק היה חזק מדי", "החבר זז"], "אור חזק מאחורי הנושא (תאורה אחורית) מטעה את המצלמה; עברו למקום שבו האור נופל על הפנים."]],
      [["Which light usually gives the gentlest outdoor portraits?", "Soft light on a cloudy day or in the shade", ["Harsh sun straight overhead at noon", "A flash fired in bright sunlight only", "Total darkness"], "Soft light makes gentle shadows; strong midday sun makes hard shadows and makes people squint."],
        ["איזה אור נותן בדרך כלל את הדיוקנאות העדינים ביותר בחוץ?", "אור רך ביום מעונן או בצל", ["שמש חזקה ישר מלמעלה בצהריים", "מבזק בשמש חזקה בלבד", "חושך מוחלט"], "אור רך יוצר צללים עדינים; שמש חזקה בצהריים יוצרת צללים חדים וגורמת לאנשים למצמץ."]],
    ],
  },
  i: {
    t: [
      ["Rule of thirds", "imagining a 3 × 3 grid and placing the subject on its lines or where they cross", "כלל השלישים", "דמיון של רשת 3 × 3 והצבת הנושא על הקווים שלה או במקום שבו הם נחתכים"],
      ["Framing", "using things in the scene, like a doorway or branches, to surround the subject", "מסגור", "שימוש בדברים שבסצנה, כמו פתח דלת או ענפים, כדי להקיף את הנושא"],
      ["Exposure", "how much light reaches the sensor: too much looks washed out, too little looks dark", "חשיפה", "כמות האור שמגיעה לחיישן: יותר מדי נראה דהוי, ופחות מדי נראה כהה"],
      ["Sensor", "the part of a digital camera that turns light into electrical signals", "חיישן", "החלק במצלמה דיגיטלית שהופך אור לאותות חשמליים"],
    ],
    q: [
      [["Using the rule of thirds, where should the horizon go in a photo of the sea?", "Along the upper or the lower third line", ["Exactly across the middle", "At the very top edge", "Tilted from corner to corner"], "Placing the horizon on a third line gives more space to the sky or the sea and makes the picture more balanced."],
        ["לפי כלל השלישים, איפה כדאי למקם את קו האופק בתמונה של הים?", "על קו השליש העליון או התחתון", ["בדיוק באמצע", "ממש בקצה העליון", "באלכסון מפינה לפינה"], "הצבת קו האופק על קו שליש נותנת יותר מקום לשמיים או לים ויוצרת תמונה מאוזנת יותר."]],
      [["Why does a photo taken in a dark room often come out blurry?", "The camera keeps the shutter open longer, so any movement smears the picture", ["Dark rooms have no colours", "The lens shrinks in the dark", "The sensor turns off"], "With little light the camera needs a longer exposure; holding it steady or adding light helps."],
        ["למה תמונה שצולמה בחדר חשוך יוצאת לעיתים קרובות מטושטשת?", "המצלמה משאירה את התריס פתוח זמן רב יותר, וכל תנועה מורחת את התמונה", ["בחדר חשוך אין צבעים", "העדשה מתכווצת בחושך", "החיישן נכבה"], "כשיש מעט אור המצלמה צריכה חשיפה ארוכה יותר; החזקה יציבה או תוספת אור עוזרות."]],
    ],
    n: [[4, ["A rule-of-thirds grid has two vertical and two horizontal lines. At how many points do they cross?", "", "Each of the 2 vertical lines crosses each of the 2 horizontal lines: 2 × 2 = 4 points."], ["ברשת של כלל השלישים יש שני קווים אנכיים ושני קווים אופקיים. בכמה נקודות הם נחתכים?", "", "כל אחד משני הקווים האנכיים חותך כל אחד משני הקווים האופקיים: 2 × 2 = 4 נקודות."]]],
  },
  a: {
    t: [
      ["Aperture", "the adjustable opening in the lens that lets light in", "צמצם", "הפתח המתכוונן בעדשה, שדרכו נכנס האור"],
      ["Shutter speed", "how long the shutter stays open to let light reach the sensor", "מהירות תריס", "משך הזמן שהתריס נשאר פתוח ומכניס אור לחיישן"],
      ["ISO", "the setting for how sensitive the camera is to light; high values add grain", "רגישות ISO", "ההגדרה שקובעת עד כמה המצלמה רגישה לאור; ערכים גבוהים מוסיפים גרעיניות"],
      ["Depth of field", "how much of the scene, from near to far, looks sharp", "עומק שדה", "כמה מהסצנה, מקרוב ועד רחוק, נראה חד"],
    ],
    q: [
      [["To freeze a fast-moving football in a photo, you should use…", "a fast shutter speed, like 1/1000 s", ["a slow shutter speed, like 1 s", "a lower ISO in a dark stadium", "a smaller photo size"], "A very short exposure catches the ball before it moves noticeably."],
        ["כדי ״להקפיא״ בתמונה כדורגל שנע מהר, צריך להשתמש…", "במהירות תריס גבוהה, כמו 1/1000 שנייה", ["במהירות תריס איטית, כמו שנייה אחת", "ברגישות נמוכה יותר באצטדיון חשוך", "בגודל תמונה קטן יותר"], "חשיפה קצרה מאוד תופסת את הכדור לפני שהוא מספיק לזוז באופן מורגש."]],
      [["A higher f-number, like f/16 instead of f/2.8, means…", "a smaller aperture: less light and more of the scene in focus", ["a bigger aperture: more light and a blurrier background", "a faster shutter speed", "a more zoomed-in lens"], "The f-number divides the focal length, so a bigger number means a smaller opening and a deeper depth of field."],
        ["מספר f גבוה יותר, כמו f/16 במקום f/2.8, פירושו…", "צמצם קטן יותר: פחות אור ויותר מהסצנה בפוקוס", ["צמצם גדול יותר: יותר אור ורקע מטושטש יותר", "מהירות תריס גבוהה יותר", "עדשה עם יותר זום"], "מספר ה־f מחלק את אורך המוקד, ולכן מספר גדול יותר פירושו פתח קטן יותר ועומק שדה גדול יותר."]],
      [["Who made the oldest surviving photograph taken with a camera, in the 1820s?", "Nicéphore Niépce", ["Thomas Edison", "Alexander Graham Bell", "Leonardo da Vinci"], "Niépce's view from a window in France (about 1826–1827) needed an exposure of many hours."],
        ["מי צילם את התצלום העתיק ביותר ששרד שצולם במצלמה, בשנות העשרים של המאה ה־19?", "ניספור נייפס", ["תומאס אדיסון", "אלכסנדר גרהם בל", "לאונרדו דה וינצ׳י"], "המראה מחלון בצרפת שצילם נייפס (בערך 1826–1827) דרש חשיפה של שעות רבות."]],
    ],
    n: [[2, ["You change the shutter speed from 1/250 s to 1/125 s. How many times more light reaches the sensor?", "", "1/125 s is twice as long as 1/250 s, so 2 times as much light gets in."], ["משנים את מהירות התריס מ־1/250 שנייה ל־1/125 שנייה. פי כמה יותר אור מגיע לחיישן?", "", "1/125 שנייה ארוכה פי 2 מ־1/250 שנייה, ולכן נכנס פי 2 יותר אור."]]],
  },
};
export default c;
