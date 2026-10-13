import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Metre", "the basic unit of length in the metric system", "מטר", "יחידת האורך הבסיסית בשיטה המטרית"],
      ["Kilogram", "the basic unit of mass, equal to 1,000 grams", "קילוגרם", "יחידת המסה הבסיסית, ששווה ל־1,000 גרם"],
      ["Litre", "a unit of liquid volume, equal to 1,000 millilitres", "ליטר", "יחידה של נפח נוזל, ששווה ל־1,000 מיליליטר"],
      ["Centimetre", "one hundredth of a metre", "סנטימטר", "מאית של מטר"],
    ],
    q: [
      [["How many centimetres are in 1 metre?", "100", ["10", "1,000", "60"], "Centi- means one hundredth: 100 cm = 1 m."],
        ["כמה סנטימטרים יש במטר אחד?", "100", ["10", "1,000", "60"], "סנטי פירושו מאית: 100 ס״מ = 1 מ׳."]],
      [["Which unit is best to measure the length of a football pitch?", "Metres", ["Millimetres", "Kilograms", "Litres"], "A pitch is about 100 m long; millimetres would be far too small, and kg and litres are not lengths."],
        ["באיזו יחידה הכי מתאים למדוד אורך של מגרש כדורגל?", "מטרים", ["מילימטרים", "קילוגרמים", "ליטרים"], "מגרש באורך של כ־100 מ׳; מילימטרים קטנים מדי, וק״ג וליטרים אינם יחידות אורך."]],
    ],
  },
  i: {
    t: [
      ["Kilo-", "a prefix meaning one thousand, as in kilometre", "קילו", "תחילית שפירושה אלף, כמו בקילומטר"],
      ["Milli-", "a prefix meaning one thousandth, as in millimetre", "מילי", "תחילית שפירושה אלפית, כמו במילימטר"],
      ["Tonne", "a unit of mass equal to 1,000 kilograms", "טון", "יחידת מסה ששווה ל־1,000 קילוגרם"],
      ["Conversion", "changing a measurement from one unit to another without changing its size", "המרת יחידות", "שינוי של מידה מיחידה אחת לאחרת בלי לשנות את הגודל"],
    ],
    q: [
      [["How many metres are in 2.5 km?", "2,500", ["250", "25", "25,000"], "1 km = 1,000 m, so 2.5 × 1,000 = 2,500 m."],
        ["כמה מטרים יש ב־2.5 ק״מ?", "2,500", ["250", "25", "25,000"], "ק״מ אחד = 1,000 מ׳, ולכן 2.5 × 1,000 = 2,500 מ׳."]],
      [["How many grams are in 0.75 kg?", "750", ["75", "7,500", "7.5"], "0.75 × 1,000 = 750 g."],
        ["כמה גרמים יש ב־0.75 ק״ג?", "750", ["75", "7,500", "7.5"], "0.75 × 1,000 = 750 גרם."]],
    ],
    n: [[45, ["How many millimetres are in 4.5 cm?", "mm", "1 cm = 10 mm, so 4.5 × 10 = 45 mm."], ["כמה מילימטרים יש ב־4.5 ס״מ?", "מ״מ", "ס״מ אחד = 10 מ״מ, ולכן 4.5 × 10 = 45 מ״מ."]]],
  },
  a: {
    t: [
      ["SI units", "the international system of units, including the metre, kilogram and second", "יחידות SI", "השיטה הבין־לאומית של יחידות, ובה המטר, הקילוגרם והשנייה"],
      ["Area unit conversion", "converting square units multiplies by the factor squared: 1 m² = 10,000 cm²", "המרת יחידות שטח", "בהמרת יחידות ריבועיות כופלים בגורם בריבוע: 1 מ״ר = 10,000 סמ״ר"],
      ["Compound unit", "a unit made of two units, like km/h or g/cm³", "יחידה מורכבת", "יחידה שבנויה משתי יחידות, כמו קמ״ש או גרם לסמ״ק"],
      ["Density", "mass divided by volume", "צפיפות", "מסה חלקי נפח"],
    ],
    q: [
      [["How many square centimetres are in 1 square metre?", "10,000", ["100", "1,000", "1,000,000"], "1 m = 100 cm, so 1 m² = 100 × 100 = 10,000 cm²."],
        ["כמה סמ״ר יש במ״ר אחד?", "10,000", ["100", "1,000", "1,000,000"], "מטר = 100 ס״מ, ולכן מ״ר = 100 × 100 = 10,000 סמ״ר."]],
      [["Convert 72 km/h to metres per second.", "20 m/s", ["72 m/s", "7.2 m/s", "1.2 m/s"], "72 km/h = 72,000 m ÷ 3,600 s = 20 m/s."],
        ["המירו 72 קמ״ש למטרים לשנייה.", "20 מ׳/ש", ["72 מ׳/ש", "7.2 מ׳/ש", "1.2 מ׳/ש"], "72 קמ״ש = 72,000 מ׳ ÷ 3,600 שניות = 20 מ׳/ש."]],
      [["A 200 cm³ block has a mass of 540 g. What is its density?", "2.7 g/cm³", ["0.37 g/cm³", "108 g/cm³", "740 g/cm³"], "Density = mass ÷ volume = 540 ÷ 200 = 2.7 g/cm³ (the density of aluminium)."],
        ["לגוש בנפח 200 סמ״ק מסה של 540 גרם. מהי הצפיפות שלו?", "2.7 גרם לסמ״ק", ["0.37 גרם לסמ״ק", "108 גרם לסמ״ק", "740 גרם לסמ״ק"], "צפיפות = מסה ÷ נפח = 540 ÷ 200 = 2.7 גרם לסמ״ק (הצפיפות של אלומיניום)."]],
    ],
  },
};
export default c;
