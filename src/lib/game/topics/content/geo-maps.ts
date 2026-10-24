import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Map", "a flat drawing of a place as seen from above", "מפה", "ציור שטוח של מקום כפי שהוא נראה מלמעלה"],
      ["Compass", "a tool whose needle points north", "מצפן", "כלי שהמחט שלו מצביעה לצפון"],
      ["Legend", "the box on a map that explains what its symbols mean", "מקרא", "התיבה במפה שמסבירה מה פירוש הסמלים"],
      ["Symbol", "a small picture or sign on a map that stands for something real", "סמל", "ציור קטן או סימן במפה שמייצג משהו אמיתי"],
    ],
    q: [
      [["On most maps, which direction is at the top?", "North", ["South", "East", "West"], "By convention most maps put north at the top."],
        ["ברוב המפות, איזה כיוון נמצא למעלה?", "צפון", ["דרום", "מזרח", "מערב"], "לפי מוסכמה, ברוב המפות הצפון נמצא למעלה."]],
      [["If you face north, what is on your right?", "East", ["West", "South", "North"], "Facing north: east is to the right, west to the left, south behind you."],
        ["אם אתם פונים צפונה, מה נמצא מימינכם?", "מזרח", ["מערב", "דרום", "צפון"], "כשפונים צפונה: המזרח מימין, המערב משמאל והדרום מאחור."]],
      [["On a map, what does a blue line usually stand for?", "A river or stream", ["A road", "A railway", "A border between countries"], "Mapmakers use blue for water such as rivers, lakes and seas. The legend of the map tells you what each colour and line means."],
        ["במפה, מה מסמן בדרך כלל קו כחול?", "נהר או נחל", ["כביש", "מסילת רכבת", "גבול בין מדינות"], "יוצרי מפות משתמשים בכחול כדי לסמן מים, כמו נהרות, אגמים וימים. המקרא של המפה אומר מה פירוש כל צבע וכל קו."]],
    ],
    s: [[["The compass directions, turning clockwise from north", "North", "East", "South", "West"],
      ["כיווני המצפן, כשמסתובבים עם כיוון השעון מהצפון", "צפון", "מזרח", "דרום", "מערב"]]],
  },
  i: {
    t: [
      ["Scale", "the ratio that shows how distances on the map relate to real distances", "קנה מידה", "היחס שמראה איך מרחקים במפה קשורים למרחקים במציאות"],
      ["Contour lines", "lines on a map joining points of equal height", "קווי גובה", "קווים במפה שמחברים נקודות באותו גובה"],
      ["Latitude", "distance north or south of the equator, in degrees", "קו רוחב", "המרחק צפונה או דרומה מקו המשווה, במעלות"],
      ["Longitude", "distance east or west of the Greenwich line, in degrees", "קו אורך", "המרחק מזרחה או מערבה מקו גריניץ׳, במעלות"],
    ],
    q: [
      [["On a map, contour lines are very close together. What does that show?", "A steep slope", ["Flat land", "A lake", "A road"], "Close lines mean height changes quickly over a short distance."],
        ["במפה, קווי הגובה צפופים מאוד. מה זה מראה?", "מדרון תלול", ["שטח מישורי", "אגם", "כביש"], "קווים צפופים פירושם שהגובה משתנה מהר במרחק קצר."]],
      [["What is the latitude of the equator?", "0°", ["90°", "180°", "45°"], "Latitude is measured from the equator (0°) to the poles (90° N and 90° S)."],
        ["מהו קו הרוחב של קו המשווה?", "0°", ["90°", "180°", "45°"], "קווי הרוחב נמדדים מקו המשווה (0°) עד הקטבים (90° צפון ו־90° דרום)."]],
      [["Tel Aviv lies at a latitude of about 32° north. What does that tell you?", "It is north of the equator", ["It is south of the equator", "It is 32 km from the equator", "It is 32° from the North Pole"], "Latitude counts degrees north or south of the equator, from 0° at the equator to 90° at each pole. So Tel Aviv is north of the equator and about 58° from the North Pole."],
        ["תל אביב נמצאת בקו רוחב של כ־32° צפון. מה זה אומר?", "שהיא מצפון לקו המשווה", ["שהיא מדרום לקו המשווה", "שהיא 32 ק״מ מקו המשווה", "שהיא 32° מהקוטב הצפוני"], "קו רוחב סופר מעלות צפונה או דרומה מקו המשווה, מ־0° בקו המשווה עד 90° בכל קוטב. לכן תל אביב נמצאת מצפון לקו המשווה, ובערך 58° מהקוטב הצפוני."]],
    ],
    n: [[5, ["A map has a scale of 1:100,000. Two towns are 5 cm apart on it. How many kilometres apart are they really?", "km", "On this map 1 cm stands for 100,000 cm, which is 1 km, so 5 cm on the map are 5 km on the ground."],
      ["למפה יש קנה מידה של 1:100,000. המרחק בין שתי ערים במפה הוא 5 ס״מ. כמה קילומטרים ביניהן באמת?", "ק״מ", "במפה הזאת 1 ס״מ מייצג 100,000 ס״מ, כלומר 1 ק״מ, ולכן 5 ס״מ במפה הם 5 ק״מ בשטח."]]],
  },
  a: {
    t: [
      ["Map projection", "a method of drawing the round Earth on a flat surface, which always distorts something", "היטל מפה", "שיטה לשרטט את כדור הארץ העגול על משטח שטוח, שתמיד מעוותת משהו"],
      ["Prime meridian", "the 0° line of longitude, passing through Greenwich in London", "קו האורך הראשי", "קו האורך 0°, שעובר בגריניץ׳ שבלונדון"],
      ["GPS", "a satellite system that tells a receiver its exact position", "GPS", "מערכת לוויינים שאומרת למקלט את המיקום המדויק שלו"],
      ["Bearing", "a direction given as an angle clockwise from north, like 090° for east", "אזימוט", "כיוון שניתן כזווית עם כיוון השעון מהצפון, כמו 090° למזרח"],
    ],
    q: [
      [["On the common Mercator map, Greenland looks about as big as Africa. In reality Africa is…", "about 14 times larger", ["the same size", "half the size", "about 2 times larger"], "The Mercator projection stretches areas near the poles; Africa is roughly 14 times Greenland's area."],
        ["במפת מרקטור הנפוצה גרינלנד נראית גדולה כמעט כמו אפריקה. במציאות אפריקה…", "גדולה ממנה בערך פי 14", ["באותו גודל", "בחצי מגודלה", "גדולה ממנה בערך פי 2"], "היטל מרקטור מותח שטחים ליד הקטבים; שטח אפריקה גדול בערך פי 14 משטח גרינלנד."]],
      [["Which bearing points south-west?", "225°", ["135°", "315°", "45°"], "North 0°, east 90°, south 180°, west 270°; halfway between south and west is 225°."],
        ["איזה אזימוט מצביע לדרום־מערב?", "225°", ["135°", "315°", "45°"], "צפון 0°, מזרח 90°, דרום 180°, מערב 270°; באמצע בין דרום למערב יש 225°."]],
      [["How many GPS satellites must a receiver hear from to work out both its position and its height?", "At least 4", ["Just 1", "Exactly 2", "At least 24"], "From each satellite's time signal the receiver works out how far away that satellite is. With 4 of them it can find where it is, how high it is, and correct its own clock."],
        ["מכמה לווייני GPS צריך מקלט לקלוט אותות כדי לחשב גם את מיקומו וגם את גובהו?", "מ־4 לפחות", ["מאחד בלבד", "משניים בדיוק", "מ־24 לפחות"], "לפי אות הזמן של כל לוויין המקלט מחשב כמה הוא רחוק ממנו. בעזרת 4 לוויינים הוא יכול למצוא איפה הוא נמצא, באיזה גובה, ולתקן את השעון שלו."]],
    ],
    n: [[1110, ["Each degree of latitude is about 111 km. About how many kilometres from the equator is a place at latitude 10° north?", "km", "Latitude counts degrees from the equator, so 10° north is 10 steps of about 111 km: 10 × 111 = 1,110 km."],
      ["כל מעלת רוחב היא כ־111 ק״מ. בערך כמה קילומטרים מקו המשווה נמצא מקום בקו רוחב 10° צפון?", "ק״מ", "קו רוחב סופר מעלות מקו המשווה, ולכן 10° צפון הם 10 צעדים של כ־111 ק״מ: 10 × 111 = 1,110 ק״מ."], 20]],
  },
};
export default c;
