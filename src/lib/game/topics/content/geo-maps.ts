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
    ],
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
    ],
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
    ],
  },
};
export default c;
