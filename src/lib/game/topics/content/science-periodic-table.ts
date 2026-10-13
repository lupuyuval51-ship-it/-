import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Periodic table", "the chart that arranges all the known elements in order of their atomic number", "הטבלה המחזורית", "התרשים שמסדר את כל היסודות הידועים לפי המספר האטומי שלהם"],
      ["Chemical symbol", "a short code of one or two letters for an element, like O for oxygen", "סמל כימי", "קיצור של אות אחת או שתיים ליסוד, כמו O לחמצן"],
      ["Metal", "a shiny element that conducts heat and electricity well, like iron or copper", "מתכת", "יסוד מבריק שמוליך היטב חום וחשמל, כמו ברזל או נחושת"],
      ["Gas element", "an element that is a gas at room temperature, like oxygen or helium", "יסוד גזי", "יסוד שהוא גז בטמפרטורת החדר, כמו חמצן או הליום"],
    ],
    q: [
      [["What is the chemical symbol for gold?", "Au", ["Go", "Gd", "Ag"], "Au comes from the Latin aurum; Ag is silver (argentum)."],
        ["מהו הסמל הכימי של זהב?", "Au", ["Go", "Gd", "Ag"], "Au בא מהמילה הלטינית aurum; Ag הוא כסף (argentum)."]],
      [["Which element is the first in the periodic table?", "Hydrogen", ["Helium", "Oxygen", "Carbon"], "Hydrogen has atomic number 1: one proton."],
        ["איזה יסוד הוא הראשון בטבלה המחזורית?", "מימן", ["הליום", "חמצן", "פחמן"], "למימן מספר אטומי 1: פרוטון אחד."]],
    ],
  },
  i: {
    t: [
      ["Group", "a column of the periodic table; elements in it behave in similar ways", "טור (קבוצה)", "עמודה בטבלה המחזורית; ליסודות בה תכונות דומות"],
      ["Period", "a row of the periodic table", "מחזור", "שורה בטבלה המחזורית"],
      ["Noble gases", "the very unreactive gases in the last column, like helium and neon", "הגזים האצילים", "הגזים שכמעט אינם מגיבים, בעמודה האחרונה, כמו הליום ונאון"],
      ["Alkali metals", "soft, very reactive metals in the first column, like sodium", "מתכות אלקליות", "מתכות רכות שמגיבות מאוד, בעמודה הראשונה, כמו נתרן"],
    ],
    q: [
      [["Who published the first widely used periodic table, in 1869, leaving gaps for undiscovered elements?", "Dmitri Mendeleev", ["Marie Curie", "Isaac Newton", "John Dalton"], "Mendeleev's gaps correctly predicted elements such as gallium and germanium."],
        ["מי פרסם ב־1869 את הטבלה המחזורית הראשונה שהתקבלה בהרחבה, והשאיר בה מקומות ריקים ליסודות שלא התגלו?", "דמיטרי מנדלייב", ["מארי קירי", "אייזק ניוטון", "ג׳ון דלטון"], "המקומות הריקים של מנדלייב חזו נכון יסודות כמו גליום וגרמניום."]],
      [["Why are balloons filled with helium rather than hydrogen today?", "Helium is a noble gas and does not burn", ["Helium is heavier", "Hydrogen is a metal", "Helium is cheaper to make"], "Hydrogen is lighter but highly flammable; helium is unreactive."],
        ["למה היום ממלאים בלונים בהליום ולא במימן?", "הליום הוא גז אציל ואינו בוער", ["הליום כבד יותר", "מימן הוא מתכת", "ייצור הליום זול יותר"], "מימן קל יותר אבל דליק מאוד; הליום כמעט אינו מגיב."]],
    ],
  },
  a: {
    t: [
      ["Atomic number", "the number of protons in an atom, which fixes its place in the table", "מספר אטומי", "מספר הפרוטונים באטום, שקובע את מקומו בטבלה"],
      ["Valence electrons", "the electrons in the outer shell, which decide how an element reacts", "אלקטרוני ערכיות", "האלקטרונים בקליפה החיצונית, שקובעים איך יסוד מגיב"],
      ["Halogens", "the reactive non-metals in group 17, like chlorine", "הלוגנים", "האל־מתכות הפעילות בטור 17, כמו כלור"],
      ["Transition metals", "the block of metals in the middle of the table, like iron, copper and gold", "מתכות המעבר", "גוש המתכות שבאמצע הטבלה, כמו ברזל, נחושת וזהב"],
    ],
    q: [
      [["Elements in the same group react similarly because…", "they have the same number of outer-shell electrons", ["they have the same mass", "they were found in the same year", "they are the same colour"], "Outer electrons take part in reactions, so the same number gives similar chemistry."],
        ["יסודות באותו טור מגיבים באופן דומה, כי…", "יש להם אותו מספר אלקטרונים בקליפה החיצונית", ["יש להם אותה מסה", "הם התגלו באותה שנה", "יש להם אותו צבע"], "האלקטרונים החיצוניים משתתפים בתגובות, ולכן מספר זהה שלהם נותן כימיה דומה."]],
      [["Sodium (Na) reacts strongly with water. Which element below it in group 1 reacts even more strongly?", "Potassium (K)", ["Lithium (Li)", "Hydrogen (H)", "Neon (Ne)"], "Going down group 1 the outer electron is farther from the nucleus and lost more easily."],
        ["נתרן (Na) מגיב חזק עם מים. איזה יסוד שמתחתיו בטור 1 מגיב אפילו חזק יותר?", "אשלגן (K)", ["ליתיום (Li)", "מימן (H)", "נאון (Ne)"], "ככל שיורדים בטור 1 האלקטרון החיצוני רחוק יותר מהגרעין ומשתחרר בקלות רבה יותר."]],
    ],
  },
};
export default c;
