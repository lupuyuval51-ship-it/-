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
      [["A box is built from 2 layers of 6 small cubes each. How many cubes is that?", "12", ["8", "6", "36"], "Each layer has 6 cubes and there are 2 layers, so you multiply: 2 × 6 = 12 cubes."],
        ["קופסה בנויה משתי שכבות, ובכל אחת 6 קוביות קטנות. כמה קוביות יש?", "12", ["8", "6", "36"], "בכל שכבה 6 קוביות ויש 2 שכבות, ולכן כופלים: 2 × 6 = 12 קוביות."]],
      [["How many millilitres are in 1 litre?", "1,000", ["100", "10", "10,000"], "1 litre = 1,000 ml, and every millilitre is the same space as 1 cm³ (1 ml = 1 cm³)."],
        ["כמה מיליליטרים יש בליטר אחד?", "1,000", ["100", "10", "10,000"], "ליטר אחד = 1,000 מ״ל, וכל מיליליטר הוא אותו נפח כמו 1 סמ״ק (מ״ל אחד = סמ״ק אחד)."]],
      [["Which unit is used to measure volume?", "Cubic centimetres (cm³)", ["Square centimetres (cm²)", "Centimetres (cm)", "Kilograms (kg)"], "Volume is the space a solid fills, so it is measured in cubic units such as cm³. Square units measure flat area, and centimetres measure length."],
        ["באיזו יחידה מודדים נפח?", "סנטימטרים מעוקבים (סמ״ק)", ["סנטימטרים רבועים (סמ״ר)", "סנטימטרים (ס״מ)", "קילוגרמים (ק״ג)"], "נפח הוא המקום שגוף תופס, ולכן מודדים אותו ביחידות מעוקבות כמו סמ״ק. יחידות רבועות מודדות שטח שטוח, וסנטימטרים מודדים אורך."]],
      [["Which holds more water: a 1 litre bottle or a 500 ml cup?", "The 1 litre bottle", ["The 500 ml cup, because 500 is more than 1", "They hold the same amount", "It cannot be told without measuring them"], "1 litre is 1,000 ml, which is twice as much as 500 ml. The number 500 only looks bigger than 1 because the units are different."],
        ["מה מכיל יותר מים: בקבוק של ליטר אחד או כוס של 500 מ״ל?", "בקבוק הליטר", ["הכוס של 500 מ״ל, כי 500 יותר מ־1", "שניהם מכילים אותה כמות", "אי אפשר לדעת בלי למדוד אותם"], "ליטר אחד הוא 1,000 מ״ל, וזה פי שניים מ־500 מ״ל. המספר 500 רק נראה גדול יותר מ־1 כי היחידות שונות."]],
      [["A box is 3 cubes long, 3 cubes wide and 2 cubes high. How many small cubes fill it?", "18", ["8", "9", "6"], "One layer has 3 × 3 = 9 cubes, and there are 2 layers: 9 × 2 = 18 cubes. Adding 3 + 3 + 2 = 8 is a common mistake."],
        ["קופסה באורך 3 קוביות, ברוחב 3 קוביות ובגובה 2 קוביות. כמה קוביות קטנות ממלאות אותה?", "18", ["8", "9", "6"], "בשכבה אחת יש 3 × 3 = 9 קוביות, ויש 2 שכבות: 9 × 2 = 18 קוביות. חיבור 3 + 3 + 2 = 8 הוא טעות נפוצה."]],
    ],
    n: [
      [8, ["What is the volume of a cube with edges of 2 cm?", "cm³", "2 × 2 × 2 = 8 cm³. The cube is made of 8 small cubes, each with a volume of 1 cm³."],
        ["מה הנפח של קובייה שאורך המקצוע שלה 2 ס״מ?", "סמ״ק", "2 × 2 × 2 = 8 סמ״ק. הקובייה בנויה מ־8 קוביות קטנות, ולכל אחת נפח של 1 סמ״ק."]],
    ],
    s: [
      [["Filling a box with 1 cm cubes to find its volume", "Put one row of cubes along the length of the bottom", "Add rows until the first layer covers the whole bottom", "Stack more layers until the box is full", "Count all the cubes: that is the volume in cm³"],
        ["מילוי קופסה בקוביות של 1 ס״מ כדי למצוא את הנפח שלה", "מניחים שורה אחת של קוביות לאורך הקרקעית", "מוסיפים שורות עד שהשכבה הראשונה מכסה את כל הקרקעית", "מערימים עוד שכבות עד שהקופסה מלאה", "סופרים את כל הקוביות: זה הנפח בסמ״ק"]],
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
      [["A tank measures 50 cm × 40 cm × 30 cm. How many litres of water does it hold when it is full?", "60 litres", ["6 litres", "600 litres", "60,000 litres"], "Volume = 50 × 40 × 30 = 60,000 cm³. 1,000 cm³ make one litre, so the tank holds 60,000 ÷ 1,000 = 60 litres."],
        ["מיכל במידות 50 ס״מ × 40 ס״מ × 30 ס״מ. כמה ליטרים של מים הוא מכיל כשהוא מלא?", "60 ליטרים", ["6 ליטרים", "600 ליטרים", "60,000 ליטרים"], "נפח = 50 × 40 × 30 = 60,000 סמ״ק. כל 1,000 סמ״ק הם ליטר אחד, ולכן המיכל מכיל 60,000 ÷ 1,000 = 60 ליטרים."]],
      [["A cuboid has a base area of 20 cm² and a height of 4 cm. What is its volume?", "80 cm³", ["24 cm³", "5 cm³", "800 cm³"], "Volume = base area × height = 20 × 4 = 80 cm³. Adding 20 + 4 = 24 mixes up an area and a volume."],
        ["לתיבה יש בסיס ששטחו 20 סמ״ר וגובה 4 ס״מ. מהו הנפח שלה?", "80 סמ״ק", ["24 סמ״ק", "5 סמ״ק", "800 סמ״ק"], "נפח = שטח הבסיס × הגובה = 20 × 4 = 80 סמ״ק. חיבור 20 + 4 = 24 מערבב בין שטח לנפח."]],
    ],
    n: [[27, ["What is the volume of a cube with edges of 3 cm?", "cm³", "3 × 3 × 3 = 27 cm³. A cube has three equal dimensions, so you multiply the edge by itself three times."], ["מה הנפח של קובייה שאורך המקצוע שלה 3 ס״מ?", "סמ״ק", "3 × 3 × 3 = 27 סמ״ק. לקובייה שלושה ממדים שווים, ולכן כופלים את אורך המקצוע בעצמו שלוש פעמים."]],
      [4, ["A box has a volume of 120 cm³. Its length is 6 cm and its width is 5 cm. How high is it?", "cm", "Volume = length × width × height, so 120 = 6 × 5 × height = 30 × height, and the height is 120 ÷ 30 = 4 cm."],
        ["נפח של קופסה הוא 120 סמ״ק, אורכה 6 ס״מ ורוחבה 5 ס״מ. מה גובהה?", "ס״מ", "נפח = אורך × רוחב × גובה, ולכן 120 = 6 × 5 × גובה = 30 × גובה, והגובה הוא 120 ÷ 30 = 4 ס״מ."]],
    ],
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
      [["What is the surface area of a cube with edges of 2 cm?", "24 cm²", ["8 cm²", "12 cm²", "16 cm²"], "A cube has 6 faces. Each face is a square of 2 × 2 = 4 cm², so the surface area is 6 × 4 = 24 cm²."],
        ["מהו שטח הפנים של קובייה שאורך המקצוע שלה 2 ס״מ?", "24 סמ״ר", ["8 סמ״ר", "12 סמ״ר", "16 סמ״ר"], "לקובייה 6 פאות. כל פאה היא ריבוע של 2 × 2 = 4 סמ״ר, ולכן שטח הפנים הוא 6 × 4 = 24 סמ״ר."]],
      [["If every edge of a cube is doubled, its surface area becomes…", "4 times as large", ["2 times as large", "8 times as large", "6 times as large"], "The surface is made of flat squares, which have two dimensions: each face becomes 2 × 2 = 4 times as large. Only the volume grows 8 times."],
        ["אם מכפילים פי 2 כל מקצוע של קובייה, שטח הפנים שלה גדל…", "פי 4", ["פי 2", "פי 8", "פי 6"], "שטח הפנים בנוי מריבועים שטוחים, ולהם שני ממדים: כל פאה גדלה פי 2 × 2 = 4. רק הנפח גדל פי 8."]],
      [["A cylinder has a radius of 3 cm and a height of 4 cm. What is its volume?", "36π cm³", ["12π cm³", "24π cm³", "9π cm³"], "V = π r² h = π × 3² × 4 = π × 9 × 4 = 36π cm³. 12π is π r h, 24π is the area of the curved side, 2π r h, and 9π is the area of only one circular end."],
        ["לגליל יש רדיוס של 3 ס״מ וגובה של 4 ס״מ. מהו הנפח שלו?", "36π סמ״ק", ["12π סמ״ק", "24π סמ״ק", "9π סמ״ק"], "V = π r² h = π × 3² × 4 = π × 9 × 4 = 36π סמ״ק. התשובה 12π היא π r h, התשובה 24π היא שטח הצד המעוקל, 2π r h, והתשובה 9π היא שטח של בסיס עגול אחד בלבד."]],
      [["A cone has a volume of 30 cm³. A cylinder has the same base and the same height. What is the volume of the cylinder?", "90 cm³", ["10 cm³", "60 cm³", "15 cm³"], "The cone holds one third of the cylinder, so the cylinder holds 3 times as much: 3 × 30 = 90 cm³. The answer 10 comes from dividing by 3 instead of multiplying."],
        ["לחרוט יש נפח של 30 סמ״ק. לגליל יש אותו בסיס ואותו גובה. מהו הנפח של הגליל?", "90 סמ״ק", ["10 סמ״ק", "60 סמ״ק", "15 סמ״ק"], "החרוט מכיל שליש מהגליל, ולכן הגליל מכיל פי 3: 3 × 30 = 90 סמ״ק. התשובה 10 מתקבלת מחילוק ב־3 במקום כפל."]],
      [["What is the surface area of a cuboid that is 4 cm long, 3 cm wide and 2 cm high?", "52 cm²", ["24 cm²", "26 cm²", "36 cm²"], "The faces come in three equal pairs: 4 × 3 = 12, 4 × 2 = 8 and 3 × 2 = 6. Together 2 × (12 + 8 + 6) = 2 × 26 = 52 cm². The number 24 is the volume."],
        ["מהו שטח הפנים של תיבה שאורכה 4 ס״מ, רוחבה 3 ס״מ וגובהה 2 ס״מ?", "52 סמ״ר", ["24 סמ״ר", "26 סמ״ר", "36 סמ״ר"], "הפאות באות בשלושה זוגות שווים: 4 × 3 = 12, 4 × 2 = 8 ו־3 × 2 = 6. יחד 2 × (12 + 8 + 6) = 2 × 26 = 52 סמ״ר. המספר 24 הוא הנפח."]],
    ],
    n: [
      [1000, ["Water is poured into an empty box that is 20 cm long, 10 cm wide and 5 cm high. How many millilitres of water fill it?", "ml", "The volume is 20 × 10 × 5 = 1,000 cm³, and 1 cm³ holds 1 ml, so the box holds 1,000 ml, which is exactly 1 litre."],
        ["יוצקים מים לקופסה ריקה שאורכה 20 ס״מ, רוחבה 10 ס״מ וגובהה 5 ס״מ. כמה מיליליטרים של מים ממלאים אותה?", "מ״ל", "הנפח הוא 20 × 10 × 5 = 1,000 סמ״ק, ובכל סמ״ק נכנס מ״ל אחד, ולכן הקופסה מכילה 1,000 מ״ל, כלומר בדיוק ליטר אחד."]],
      [3, ["A cube has a surface area of 54 cm². How long is each edge?", "cm", "A cube has 6 equal square faces, so one face is 54 ÷ 6 = 9 cm². A square with an area of 9 cm² has sides of 3 cm."],
        ["לקובייה יש שטח פנים של 54 סמ״ר. מהו אורך כל מקצוע?", "ס״מ", "לקובייה 6 פאות ריבועיות שוות, ולכן פאה אחת היא 54 ÷ 6 = 9 סמ״ר. לריבוע ששטחו 9 סמ״ר יש צלעות של 3 ס״מ."]],
    ],
  },
};
export default c;
