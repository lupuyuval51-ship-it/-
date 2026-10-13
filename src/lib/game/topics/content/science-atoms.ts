import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Atom", "the tiny particle that all matter is built from", "אטום", "החלקיק הזעיר שממנו בנוי כל החומר"],
      ["Element", "a pure substance made of only one kind of atom, like gold or oxygen", "יסוד", "חומר טהור שבנוי מסוג אחד בלבד של אטומים, כמו זהב או חמצן"],
      ["Molecule", "two or more atoms joined together, like a water particle", "מולקולה", "שני אטומים או יותר שמחוברים יחד, כמו חלקיק של מים"],
      ["Compound", "a substance made of two or more different elements joined chemically", "תרכובת", "חומר שבנוי משני יסודות שונים או יותר שקשורים בקשר כימי"],
    ],
    q: [
      [["Water is H₂O. Which atoms is it made of?", "Two hydrogen atoms and one oxygen atom", ["One hydrogen and two oxygen atoms", "Only oxygen", "Helium and oxygen"], "H stands for hydrogen and O for oxygen; the small 2 means two hydrogen atoms."],
        ["מים הם H₂O. מאילו אטומים הם בנויים?", "שני אטומי מימן ואטום חמצן אחד", ["אטום מימן אחד ושני אטומי חמצן", "רק חמצן", "הליום וחמצן"], "H מסמל מימן ו־O חמצן; ה־2 הקטן פירושו שני אטומי מימן."]],
      [["Can you see a single atom with your eyes?", "No, atoms are far too small", ["Yes, with good eyesight", "Only in sunlight", "Only big atoms like gold"], "Atoms are about a ten-millionth of a millimetre across; even ordinary microscopes cannot show them."],
        ["אפשר לראות אטום בודד בעין?", "לא, אטומים קטנים מדי", ["כן, עם ראייה טובה", "רק באור השמש", "רק אטומים גדולים כמו זהב"], "קוטר של אטום הוא בערך עשירית מיליונית של מילימטר; אפילו מיקרוסקופ רגיל לא מראה אותו."]],
    ],
  },
  i: {
    t: [
      ["Nucleus (atom)", "the tiny, heavy centre of an atom, made of protons and neutrons", "גרעין האטום", "המרכז הזעיר והכבד של האטום, שבנוי מפרוטונים ומנייטרונים"],
      ["Proton", "a positively charged particle in the nucleus", "פרוטון", "חלקיק בעל מטען חיובי שנמצא בגרעין"],
      ["Neutron", "a particle with no charge in the nucleus", "נייטרון", "חלקיק ללא מטען שנמצא בגרעין"],
      ["Electron", "a very light, negatively charged particle that moves around the nucleus", "אלקטרון", "חלקיק קל מאוד בעל מטען שלילי שנע סביב הגרעין"],
    ],
    q: [
      [["What decides which element an atom is?", "The number of protons", ["The number of neutrons", "The number of molecules", "Its colour"], "The proton number (atomic number) defines the element: every carbon atom has 6 protons."],
        ["מה קובע לאיזה יסוד שייך אטום?", "מספר הפרוטונים", ["מספר הנייטרונים", "מספר המולקולות", "הצבע שלו"], "מספר הפרוטונים (המספר האטומי) מגדיר את היסוד: לכל אטום פחמן יש 6 פרוטונים."]],
      [["A neutral atom has 8 protons. How many electrons does it have?", "8", ["16", "0", "4"], "In a neutral atom the negative electrons balance the positive protons: 8 and 8."],
        ["לאטום נייטרלי יש 8 פרוטונים. כמה אלקטרונים יש לו?", "8", ["16", "0", "4"], "באטום נייטרלי האלקטרונים השליליים מאזנים את הפרוטונים החיוביים: 8 מול 8."]],
    ],
  },
  a: {
    t: [
      ["Isotope", "atoms of the same element with different numbers of neutrons", "איזוטופ", "אטומים של אותו יסוד עם מספר שונה של נייטרונים"],
      ["Ion", "an atom that has gained or lost electrons and so carries a charge", "יון", "אטום שקיבל או איבד אלקטרונים ולכן יש לו מטען"],
      ["Mass number", "the total number of protons and neutrons in a nucleus", "מספר מסה", "סך הפרוטונים והנייטרונים בגרעין"],
      ["Electron shell", "an energy level around the nucleus where electrons are found", "קליפת אלקטרונים", "רמת אנרגיה סביב הגרעין שבה נמצאים אלקטרונים"],
    ],
    q: [
      [["Carbon-14 has 6 protons. How many neutrons does it have?", "8", ["14", "6", "20"], "Mass number 14 − 6 protons = 8 neutrons."],
        ["לפחמן־14 יש 6 פרוטונים. כמה נייטרונים יש לו?", "8", ["14", "6", "20"], "מספר מסה 14 פחות 6 פרוטונים = 8 נייטרונים."]],
      [["A sodium atom loses one electron. What does it become?", "A positive ion, Na⁺", ["A negative ion, Na⁻", "A different element", "A neutron"], "Losing a negative electron leaves one more proton than electrons, so the charge is +1."],
        ["אטום נתרן מאבד אלקטרון אחד. למה הוא הופך?", "ליון חיובי, Na⁺", ["ליון שלילי, Na⁻", "ליסוד אחר", "לנייטרון"], "כשאלקטרון שלילי הולך, יש פרוטון אחד יותר מאלקטרונים, ולכן המטען הוא 1+."]],
      [["Most of an atom's volume is…", "empty space", ["the nucleus", "neutrons", "solid matter"], "Rutherford's experiment (1911) showed a tiny, dense nucleus; the electrons move in a region far larger than it."],
        ["רוב הנפח של אטום הוא…", "חלל ריק", ["הגרעין", "נייטרונים", "חומר מוצק"], "הניסוי של רתרפורד (1911) הראה גרעין זעיר וצפוף; האלקטרונים נעים באזור גדול ממנו בהרבה."]],
    ],
  },
};
export default c;
