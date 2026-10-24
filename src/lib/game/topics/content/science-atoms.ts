import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Atom", "a particle with a nucleus at its centre and electrons moving around it", "אטום", "חלקיק שבמרכזו גרעין, וסביבו נעים אלקטרונים"],
      ["Element", "a pure substance made of only one kind of atom, like iron or oxygen", "יסוד", "חומר טהור שבנוי מסוג אחד בלבד של אטומים, כמו ברזל או חמצן"],
      ["Molecule", "two or more atoms joined together, like a water particle", "מולקולה", "שני אטומים או יותר שמחוברים יחד, כמו חלקיק של מים"],
      ["Compound", "a substance made of two or more different elements joined chemically", "תרכובת", "חומר שבנוי משני יסודות שונים או יותר שקשורים בקשר כימי"],
    ],
    q: [
      [["Water is H₂O. Which atoms is it made of?", "Two hydrogen atoms and one oxygen atom", ["One hydrogen and two oxygen atoms", "Only oxygen", "Helium and oxygen"], "H stands for hydrogen and O for oxygen; the small 2 means two hydrogen atoms."],
        ["מים הם H₂O. מאילו אטומים הם בנויים?", "שני אטומי מימן ואטום חמצן אחד", ["אטום מימן אחד ושני אטומי חמצן", "רק חמצן", "הליום וחמצן"], "H מסמל מימן ו־O חמצן; ה־2 הקטן פירושו שני אטומי מימן."]],
      [["Can you see a single atom with your eyes?", "No, atoms are far too small", ["Yes, with good eyesight", "Only in sunlight", "Only heavy atoms, such as lead"], "Atoms are about a ten-millionth of a millimetre across; even ordinary microscopes cannot show them."],
        ["אפשר לראות אטום בודד בעין?", "לא, אטומים קטנים מדי", ["כן, עם ראייה טובה", "רק באור השמש", "רק אטומים כבדים, כמו עופרת"], "קוטר של אטום הוא בערך עשירית מיליונית של מילימטר; אפילו מיקרוסקופ רגיל לא מראה אותו."]],
      [["Which of these is an element?", "Gold", ["Table salt", "Water", "Carbon dioxide"], "Gold is made of only one kind of atom, so it is an element. Salt, water and carbon dioxide are compounds: each is made of atoms of different elements joined together."],
        ["איזה מהבאים הוא יסוד?", "זהב", ["מלח שולחן", "מים", "פחמן דו־חמצני"], "זהב בנוי מסוג אחד בלבד של אטומים, ולכן הוא יסוד. מלח, מים ופחמן דו־חמצני הם תרכובות: כל אחת בנויה מאטומים של יסודות שונים שקשורים זה לזה."]],
      [["Oxygen gas is written O₂. What is one molecule of it made of?", "Two oxygen atoms joined together", ["One oxygen atom and one hydrogen atom", "Two different elements", "One oxygen atom and one nitrogen atom"], "The small 2 means two atoms. A molecule can be made of atoms of the same element, as in O₂, or of different elements, as in water."],
        ["גז חמצן נכתב O₂. ממה בנויה מולקולה אחת שלו?", "משני אטומי חמצן שקשורים זה לזה", ["מאטום חמצן אחד ואטום מימן אחד", "משני יסודות שונים", "מאטום חמצן אחד ואטום חנקן אחד"], "ה־2 הקטן פירושו שני אטומים. מולקולה יכולה להיבנות מאטומים של אותו יסוד, כמו ב־O₂, או מיסודות שונים, כמו במים."]],
      [["Which of these things is the smallest?", "An atom", ["A grain of sand", "A bacterium", "A red blood cell"], "A bacterium is thousands of times wider than an atom, and it holds billions of atoms. A grain of sand and a blood cell are bigger still."],
        ["מה מהדברים האלה הוא הקטן ביותר?", "אטום", ["גרגר חול", "חיידק", "תא דם אדום"], "חיידק רחב פי אלפים מאטום, והוא מכיל מיליארדי אטומים. גרגר חול ותא דם אדום גדולים עוד יותר."]],
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
      [["What keeps the electrons of an atom close to its nucleus?", "The pull between the negative electrons and the positive protons", ["Gravity, which pulls the electrons in towards the centre of the atom", "The neutrons, which push the electrons back towards the centre", "A thin, hard skin around the atom that the electrons cannot cross"], "Opposite charges attract, so the positive protons in the nucleus pull on the negative electrons. Gravity between such tiny particles is far too weak to matter, and neutrons have no charge at all."],
        ["מה מחזיק את האלקטרונים של אטום קרוב לגרעין שלו?", "המשיכה בין האלקטרונים השליליים לפרוטונים החיוביים", ["כוח הכבידה, שמושך את האלקטרונים פנימה אל מרכז האטום", "הנייטרונים, שדוחפים את האלקטרונים בחזרה אל המרכז", "קליפה דקה וקשה סביב האטום, שהאלקטרונים לא יכולים לעבור"], "מטענים הפוכים נמשכים זה לזה, ולכן הפרוטונים החיוביים שבגרעין מושכים את האלקטרונים השליליים. כוח הכבידה בין חלקיקים זעירים כאלה חלש מכדי להשפיע, ולנייטרונים אין מטען בכלל."]],
      [["Which particle has by far the smallest mass?", "The electron", ["The proton", "The neutron", "All three have about the same mass"], "A proton or a neutron is about 1,800 times heavier than an electron, so almost all of an atom's mass is in its nucleus."],
        ["לאיזה חלקיק יש המסה הקטנה ביותר, בהפרש גדול?", "לאלקטרון", ["לפרוטון", "לנייטרון", "לשלושתם יש בערך אותה מסה"], "פרוטון או נייטרון כבדים בערך פי 1,800 מאלקטרון, ולכן כמעט כל המסה של אטום נמצאת בגרעין שלו."]],
      [["Which scientist discovered the electron in 1897?", "J. J. Thomson", ["Marie Curie", "Albert Einstein", "Dmitri Mendeleev"], "Thomson showed that atoms contain tiny negatively charged particles. Mendeleev arranged the elements in a table, Curie studied radioactivity and Einstein explained light and the relation of mass to energy."],
        ["איזה מדען גילה את האלקטרון ב־1897?", "ג׳וזף ג׳ון תומסון", ["מארי קירי", "אלברט איינשטיין", "דמיטרי מנדלייב"], "תומסון הראה שבאטומים יש חלקיקים זעירים בעלי מטען שלילי. מנדלייב סידר את היסודות בטבלה, קירי חקרה רדיואקטיביות ואיינשטיין הסביר את האור ואת הקשר בין מסה לאנרגיה."]],
    ],
    n: [
      [26, ["An iron atom has atomic number 26. How many protons does it have?", "", "The atomic number is the number of protons in the nucleus, so every iron atom has 26 protons."],
        ["למספר האטומי של אטום ברזל יש ערך 26. כמה פרוטונים יש לו?", "", "המספר האטומי הוא מספר הפרוטונים בגרעין, ולכן בכל אטום ברזל יש 26 פרוטונים."]],
    ],
  },
  a: {
    t: [
      ["Isotope", "atoms of the same element that differ in mass, such as carbon-12 and carbon-14", "איזוטופ", "אטומים של אותו יסוד שנבדלים זה מזה במסה, כמו פחמן־12 ופחמן־14"],
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
      [["Chlorine has two common isotopes, chlorine-35 and chlorine-37. How do their atoms differ?", "Chlorine-37 has 2 more neutrons", ["Chlorine-37 has 2 more protons", "They are two different elements", "Chlorine-37 has 2 more electrons when neutral"], "Isotopes of one element have the same number of protons (17 for chlorine) but different numbers of neutrons: 37 − 17 = 20 neutrons, against 35 − 17 = 18."],
        ["לכלור יש שני איזוטופים נפוצים, כלור־35 וכלור־37. במה האטומים שלהם שונים?", "בכלור־37 יש 2 נייטרונים יותר", ["בכלור־37 יש 2 פרוטונים יותר", "אלה שני יסודות שונים", "בכלור־37 יש 2 אלקטרונים יותר כשהוא נייטרלי"], "לאיזוטופים של אותו יסוד יש אותו מספר פרוטונים (17 בכלור) אבל מספר שונה של נייטרונים: 37 − 17 = 20 נייטרונים, לעומת 35 − 17 = 18."]],
      [["An oxygen atom gains two electrons. What does it become?", "A negative ion, O²⁻", ["A positive ion, O²⁺", "A neutral atom of a different element", "A positive ion, O⁺"], "Electrons are negative, so gaining two leaves two more electrons than protons: the charge is 2−. Gaining or losing electrons never changes the element, because the protons stay the same."],
        ["אטום חמצן מקבל שני אלקטרונים. למה הוא הופך?", "ליון שלילי, O²⁻", ["ליון חיובי, O²⁺", "לאטום נייטרלי של יסוד אחר", "ליון חיובי, O⁺"], "אלקטרונים הם שליליים, ולכן קבלת שניים משאירה שני אלקטרונים יותר מפרוטונים: המטען הוא 2−. קבלת אלקטרונים או איבודם אף פעם לא משנים את היסוד, כי הפרוטונים נשארים אותם פרוטונים."]],
      [["Which part of an atom takes part when atoms join in a chemical reaction?", "The outermost electrons", ["The nucleus", "The neutrons", "All of the protons"], "In a chemical reaction atoms gain, lose or share their outer electrons. The nucleus stays unchanged, which is why a reaction never turns one element into another."],
        ["איזה חלק של אטום משתתף כשאטומים מתחברים בתגובה כימית?", "האלקטרונים החיצוניים ביותר", ["הגרעין", "הנייטרונים", "כל הפרוטונים"], "בתגובה כימית אטומים מקבלים, מאבדים או חולקים את האלקטרונים החיצוניים שלהם. הגרעין נשאר ללא שינוי, ולכן תגובה כימית אף פעם לא הופכת יסוד אחד לאחר."]],
    ],
    n: [
      [18, ["A sulfur atom has 16 protons. How many electrons does a sulfide ion, S²⁻, have?", "", "A neutral sulfur atom has 16 electrons, balancing its 16 protons. The charge 2− means 2 electrons more than protons, so the ion has 16 + 2 = 18 electrons."],
        ["לאטום גופרית יש 16 פרוטונים. כמה אלקטרונים יש ליון סולפיד, S²⁻?", "", "לאטום גופרית נייטרלי יש 16 אלקטרונים, שמאזנים את 16 הפרוטונים שלו. המטען 2− פירושו 2 אלקטרונים יותר מפרוטונים, ולכן ליון יש 16 + 2 = 18 אלקטרונים."]],
    ],
  },
};
export default c;
