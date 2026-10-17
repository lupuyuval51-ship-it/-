import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Volume", "how much space a solid object takes up", "נפח", "כמה מקום גוף תלת־ממדי תופס"],
      ["Cube", "a solid with six equal square faces", "קובייה", "גוף עם שש פאות ריבועיות שוות"],
      ["Cubic centimetre", "a unit of volume: a cube with edges of 1 cm", "סמ״ק", "יחידת נפח: קובייה שאורך כל מקצוע שלה 1 ס״מ"],
      ["Capacity", "how much a container can hold, often measured in litres", "קיבולת", "כמה כלי יכול להכיל, נמדד לרוב בליטרים"],
    ],
    q: [
      [["A box is built from 2 layers of 6 small cubes each. How many cubes is that?", "12", ["8", "6", "36"], "2 layers × 6 cubes = 12 cubes."],
        ["קופסה בנויה משתי שכבות, ובכל אחת 6 קוביות קטנות. כמה קוביות יש?", "12", ["8", "6", "36"], "2 שכבות × 6 קוביות = 12 קוביות."]],
      [["How many millilitres are in 1 litre?", "1,000", ["100", "10", "10,000"], "1 litre = 1,000 ml (and 1 ml = 1 cm³)."],
        ["כמה מיליליטרים יש בליטר אחד?", "1,000", ["100", "10", "10,000"], "ליטר אחד = 1,000 מ״ל (ומ״ל אחד = סמ״ק אחד)."]],
    ],
  },
  i: {
    t: [
      ["Cuboid", "a box shape with six rectangular faces", "תיבה", "גוף בצורת קופסה עם שש פאות מלבניות"],
      ["Edge", "a line where two faces of a solid meet", "מקצוע", "קו שבו נפגשות שתי פאות של גוף"],
      ["Face", "a flat surface of a solid", "פאה", "משטח שטוח של גוף"],
      ["Vertex", "a corner of a solid, where edges meet", "קודקוד", "פינה של גוף, שבה נפגשים מקצועות"],
    ],
    q: [
      [["What is the volume of a box 5 cm × 4 cm × 3 cm?", "60 cm³", ["12 cm³", "47 cm³", "20 cm³"], "Volume = length × width × height = 5 × 4 × 3 = 60 cm³."],
        ["מה הנפח של תיבה 5 ס״מ × 4 ס״מ × 3 ס״מ?", "60 סמ״ק", ["12 סמ״ק", "47 סמ״ק", "20 סמ״ק"], "נפח = אורך × רוחב × גובה = 5 × 4 × 3 = 60 סמ״ק."]],
      [["How many edges does a cube have?", "12", ["6", "8", "24"], "A cube has 6 faces, 8 vertices and 12 edges."],
        ["כמה מקצועות יש לקובייה?", "12", ["6", "8", "24"], "לקובייה 6 פאות, 8 קודקודים ו־12 מקצועות."]],
    ],
    n: [[27, ["What is the volume of a cube with edges of 3 cm?", "cm³", "3 × 3 × 3 = 27 cm³."], ["מה הנפח של קובייה שאורך המקצוע שלה 3 ס״מ?", "סמ״ק", "3 × 3 × 3 = 27 סמ״ק."]]],
  },
  a: {
    t: [
      ["Prism", "a solid with the same cross-section all along its length", "מנסרה", "גוף שחתך הרוחב שלו זהה לכל אורכו"],
      ["Cylinder", "a prism-like solid with two equal circular ends; volume = π r² h", "גליל", "גוף עם שני בסיסים עגולים שווים; נפח = π r² h"],
      ["Cone", "a solid with a circular base that narrows to a point; volume = ⅓ π r² h", "חרוט", "גוף עם בסיס עגול שמצטמצם לנקודה; נפח = ⅓ π r² h"],
      ["Surface area", "the total area of all the outside faces of a solid", "שטח פנים", "השטח הכולל של כל הפאות החיצוניות של גוף"],
    ],
    q: [
      [["If every edge of a cube is doubled, its volume becomes…", "8 times as large", ["2 times as large", "4 times as large", "6 times as large"], "Each of the three dimensions doubles: 2 × 2 × 2 = 8."],
        ["אם מכפילים פי 2 כל מקצוע של קובייה, הנפח שלה גדל…", "פי 8", ["פי 2", "פי 4", "פי 6"], "כל אחד משלושת הממדים מוכפל: 2 × 2 × 2 = 8."]],
      [["A cone and a cylinder have the same base and height. How do their volumes compare?", "The cone holds one third of the cylinder", ["They are equal", "The cone holds half", "The cone holds twice as much"], "V(cone) = ⅓ π r² h, exactly one third of V(cylinder) = π r² h."],
        ["לחרוט ולגליל אותו בסיס ואותו גובה. מה היחס בין הנפחים?", "החרוט מכיל שליש מהגליל", ["הם שווים", "החרוט מכיל חצי", "החרוט מכיל פי שניים"], "נפח החרוט ⅓ π r² h, בדיוק שליש מנפח הגליל π r² h."]],
      [["What is the surface area of a cube with edges of 2 cm?", "24 cm²", ["8 cm²", "12 cm²", "16 cm²"], "6 faces × (2 × 2) cm² = 24 cm²."],
        ["מהו שטח הפנים של קובייה שאורך המקצוע שלה 2 ס״מ?", "24 סמ״ר", ["8 סמ״ר", "12 סמ״ר", "16 סמ״ר"], "6 פאות × (2 × 2) סמ״ר = 24 סמ״ר."]],
    ],
  },
};
export default c;
