import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Sketch", "a quick, rough drawing used to try out an idea", "סקיצה", "רישום מהיר וראשוני שבעזרתו בודקים רעיון"],
      ["Outline", "a line that shows the outer edge of a shape", "קו מתאר", "קו שמראה את הגבול החיצוני של צורה"],
      ["Shading", "making areas darker to show light, shadow and roundness", "הצללה", "השחרה של אזורים כדי להראות אור, צל ונפח"],
      ["Still life", "a picture of objects that do not move, like fruit or a vase", "טבע דומם", "תמונה של חפצים שאינם זזים, כמו פירות או אגרטל"],
    ],
    q: [
      [["In a drawing, a tree that is far away should usually look…", "smaller than a tree close by", ["bigger than a tree close by", "the same size as a tree close by", "upside down"], "Things look smaller the farther away they are, so drawing them smaller shows distance."],
        ["בציור, עץ שנמצא רחוק צריך בדרך כלל להיראות…", "קטן יותר מעץ קרוב", ["גדול יותר מעץ קרוב", "באותו גודל כמו עץ קרוב", "הפוך"], "דברים נראים קטנים יותר ככל שהם רחוקים יותר, ולכן ציור שלהם בקטן מראה מרחק."]],
      [["A lamp shines on a ball from the left. Where is the darkest part of the ball?", "On the right side, facing away from the light", ["On the left side, facing the light", "Exactly in the middle", "Every part is equally dark"], "The side turned away from the light gets the least light, and the ball's shadow falls to the right too."],
        ["מנורה מאירה על כדור משמאל. איפה החלק הכהה ביותר של הכדור?", "בצד ימין, הפונה הרחק מהאור", ["בצד שמאל, הפונה אל האור", "בדיוק באמצע", "כל החלקים כהים באותה מידה"], "הצד שפונה הרחק מהאור מקבל הכי מעט אור, וגם הצל של הכדור נופל ימינה."]],
    ],
  },
  i: {
    t: [
      ["Horizon line", "a level line across the picture at the viewer's eye level", "קו האופק", "קו ישר לרוחב התמונה בגובה העיניים של הצופה"],
      ["Vanishing point", "the point where parallel lines going into the distance seem to meet", "נקודת מגוז", "הנקודה שבה קווים מקבילים שמתרחקים נראים כאילו הם נפגשים"],
      ["Foreground", "the part of a picture that seems closest to the viewer", "קדמת התמונה", "החלק בתמונה שנראה הכי קרוב לצופה"],
      ["Background", "the part of a picture that seems farthest away", "רקע", "החלק בתמונה שנראה הכי רחוק"],
    ],
    q: [
      [["In a drawing, railway tracks going into the distance seem to…", "meet at a point on the horizon", ["get wider apart", "stay the same distance apart on the paper", "curve upwards into the sky"], "Parallel lines going away from us seem to come together at a vanishing point."],
        ["בציור, פסי רכבת שמתרחקים נראים כאילו הם…", "נפגשים בנקודה על קו האופק", ["מתרחקים זה מזה", "נשארים באותו מרחק על הדף", "מתעקלים למעלה לשמיים"], "קווים מקבילים שמתרחקים מאיתנו נראים כאילו הם מתקרבים זה לזה ונפגשים בנקודת מגוז."]],
      [["What is one-point perspective most useful for drawing?", "A road or a corridor seen straight on", ["A building seen from its corner", "A flat map of a city", "A single circle"], "When you look straight down a road, its edges run to one vanishing point in the middle."],
        ["למה פרספקטיבה של נקודה אחת מתאימה במיוחד?", "לציור כביש או מסדרון שמביטים בו ישר קדימה", ["לציור בניין שרואים מהפינה שלו", "לציור מפה שטוחה של עיר", "לציור עיגול בודד"], "כשמביטים ישר לאורך כביש, השוליים שלו נמשכים אל נקודת מגוז אחת באמצע."]],
    ],
    s: [[["Drawing a box in one-point perspective", "Draw the horizon line", "Mark one vanishing point on it", "Draw the front of the box as a square", "Draw lines from its corners to the vanishing point", "Draw the back edges parallel to the front and erase the extra lines"],
      ["ציור קופסה בפרספקטיבה של נקודה אחת", "משרטטים את קו האופק", "מסמנים עליו נקודת מגוז אחת", "מציירים את חזית הקופסה כריבוע", "מותחים קווים מהפינות שלו אל נקודת המגוז", "מציירים את הקצוות האחוריים במקביל לחזית ומוחקים את הקווים המיותרים"]]],
  },
  a: {
    t: [
      ["Two-point perspective", "drawing with two vanishing points, for objects seen from a corner", "פרספקטיבה של שתי נקודות", "שיטת רישום עם שתי נקודות מגוז, לעצמים שרואים מהפינה"],
      ["Atmospheric perspective", "showing distance by making far things paler, bluer and less detailed", "פרספקטיבה אווירית", "הראיית מרחק בכך שעצמים רחוקים מצוירים בהירים, כחלחלים ופחות מפורטים"],
      ["Foreshortening", "drawing an object that points toward the viewer shorter than its real length", "קיצור פרספקטיבי", "ציור של עצם שמופנה אל הצופה כקצר יותר מאורכו האמיתי"],
      ["Cross-hatching", "shading with layers of crossing lines, where more layers look darker", "הצללה בקווים מוצלבים", "הצללה בשכבות של קווים שחוצים זה את זה, וככל שיש יותר שכבות זה נראה כהה יותר"],
    ],
    q: [
      [["Which Renaissance architect is credited with showing how linear perspective works, in Florence in the early 1400s?", "Filippo Brunelleschi", ["Leonardo da Vinci", "Vincent van Gogh", "Pablo Picasso"], "Brunelleschi demonstrated linear perspective around 1415–1420; Leon Battista Alberti then described it in writing in 1435."],
        ["איזה אדריכל מתקופת הרנסנס נחשב למי שהדגים איך פועלת פרספקטיבה קווית, בפירנצה בתחילת המאה ה־15?", "פיליפו ברונלסקי", ["לאונרדו דה וינצ׳י", "וינסנט ואן גוך", "פבלו פיקאסו"], "ברונלסקי הדגים את הפרספקטיבה הקווית בסביבות 1415–1420, ולאון בטיסטה אלברטי תיאר אותה בכתב ב־1435."]],
      [["Distant mountains in a landscape painting are often painted paler and bluer. Why?", "Air and haze between us and far objects soften and cool their colours", ["Mountains are really blue", "Paint fades faster at the top of a canvas", "It is a rule that only applies to oil paint"], "This is atmospheric perspective: the more air there is between us and an object, the less contrast and the bluer it looks."],
        ["הרים רחוקים בציור נוף מצוירים לעיתים קרובות בהירים וכחולים יותר. למה?", "האוויר והאובך שבינינו לבין עצמים רחוקים מרככים ומקררים את הצבעים שלהם", ["הרים הם באמת כחולים", "צבע דוהה מהר יותר בחלק העליון של הבד", "זה כלל שנכון רק לצבעי שמן"], "זו פרספקטיבה אווירית: ככל שיש יותר אוויר בינינו לבין העצם, הניגודיות קטנה והוא נראה כחול יותר."]],
      [["Artists often use a guide that an adult's whole body is about how many heads tall?", "About 7 to 8 heads", ["About 3 heads", "About 12 heads", "Exactly 2 heads"], "Using the head as a unit of measure keeps a figure in proportion; children's figures have fewer heads, because their heads are bigger compared with their bodies."],
        ["אמנים משתמשים לעיתים קרובות בכלל אצבע שלפיו גובה הגוף של אדם מבוגר הוא בערך כמה ראשים?", "בערך 7 עד 8 ראשים", ["בערך 3 ראשים", "בערך 12 ראשים", "בדיוק 2 ראשים"], "השימוש בראש כיחידת מידה שומר על הפרופורציות של הדמות; לילדים יש פחות ״ראשים״, כי הראש שלהם גדול יחסית לגוף."]],
    ],
  },
};
export default c;
