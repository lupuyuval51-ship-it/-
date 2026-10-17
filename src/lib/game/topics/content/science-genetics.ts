import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Inheritance", "getting features from your parents, like eye colour", "תורשה", "קבלת תכונה מההורים, כמו צבע העיניים"],
      ["Trait", "a feature of a living thing, like height or hair colour", "תכונה", "מאפיין של יצור חי, כמו גובה או צבע שיער"],
      ["Offspring", "the young of a living thing", "צאצאים", "הוולדות של יצור חי"],
      ["Variation", "the differences between living things of the same kind", "שונות", "ההבדלים בין יצורים חיים מאותו סוג"],
    ],
    q: [
      [["Which of these is mainly inherited from parents?", "Natural eye colour", ["A scar from a fall", "Speaking French", "Short dyed hair"], "Eye colour comes from genes; scars, languages and haircuts come from life experience."],
        ["מה מהבאים עובר בעיקר בתורשה מההורים?", "צבע העיניים הטבעי", ["צלקת מנפילה", "דיבור בצרפתית", "שיער קצר צבוע"], "צבע העיניים נקבע בגנים; צלקות, שפות ותספורות באים מניסיון החיים."]],
      [["Why do brothers and sisters look alike but not identical (unless they are identical twins)?", "Each child gets a different mix of the parents' genes", ["They eat the same food", "They live in the same house", "Only the mother's genes count"], "Every child receives half of each parent's genes, but a different half each time."],
        ["למה אחים ואחיות דומים אבל לא זהים (אלא אם הם תאומים זהים)?", "כל ילד מקבל צירוף אחר של הגנים של ההורים", ["הם אוכלים אותו אוכל", "הם גרים באותו בית", "רק הגנים של האם קובעים"], "כל ילד מקבל מחצית מהגנים של כל הורה, אבל כל פעם מחצית אחרת."]],
    ],
  },
  i: {
    t: [
      ["DNA", "the long molecule in cells that carries the instructions for building and running a living thing", "DNA", "המולקולה הארוכה בתאים שנושאת את ההוראות לבנייה ולתפקוד של יצור חי"],
      ["Gene", "a section of DNA that carries the instructions for one feature", "גן", "קטע של DNA שנושא הוראות לתכונה אחת"],
      ["Chromosome", "a tightly packed thread of DNA; human cells usually have 46", "כרומוזום", "חוט צפוף של DNA; בתאי אדם יש בדרך כלל 46"],
      ["Mutation", "a change in the DNA", "מוטציה", "שינוי ב־DNA"],
    ],
    q: [
      [["How many chromosomes are in a typical human body cell?", "46 (23 pairs)", ["23", "48", "100"], "We get 23 from each parent: 23 pairs, 46 in total."],
        ["כמה כרומוזומים יש בתא גוף רגיל של אדם?", "46 (23 זוגות)", ["23", "48", "100"], "אנחנו מקבלים 23 מכל הורה: 23 זוגות, 46 בסך הכול."]],
      [["What do the sex chromosomes XY usually mean in humans?", "Male", ["Female", "Twins", "A mutation"], "Usually XX is female and XY is male; the father's sperm carries either an X or a Y."],
        ["מה בדרך כלל פירוש כרומוזומי המין XY בבני אדם?", "זכר", ["נקבה", "תאומים", "מוטציה"], "בדרך כלל XX היא נקבה ו־XY הוא זכר; תא הזרע של האב נושא X או Y."]],
    ],
  },
  a: {
    t: [
      ["Allele", "one version of a gene, like the version for brown eyes or for blue eyes", "אלל", "גרסה אחת של גן, כמו הגרסה לעיניים חומות או לעיניים כחולות"],
      ["Dominant", "an allele that shows its effect even when only one copy is present", "שולט", "אלל שמשפיע גם כשיש ממנו עותק אחד בלבד"],
      ["Recessive", "an allele that shows only when two copies are present", "נסגני", "אלל שמשפיע רק כשיש ממנו שני עותקים"],
      ["Genotype", "the pair of alleles an organism has for a gene, like Bb", "גנוטיפ", "זוג האללים שיש ליצור עבור גן מסוים, כמו Bb"],
    ],
    q: [
      [["Two Bb parents have a child. What is the chance it is bb?", "1/4", ["1/2", "3/4", "0"], "The four equal combinations are BB, Bb, bB and bb: one of four is bb."],
        ["להורים Bb ו־Bb נולד ילד. מה הסיכוי שהוא bb?", "1/4", ["1/2", "3/4", "0"], "יש ארבעה צירופים שווי סיכוי: BB, Bb, bB ו־bb — אחד מארבעה הוא bb."]],
      [["Who discovered the basic laws of inheritance by breeding pea plants?", "Gregor Mendel", ["Charles Darwin", "Louis Pasteur", "Isaac Newton"], "Mendel published his pea experiments in 1866; they founded genetics."],
        ["מי גילה את חוקי התורשה הבסיסיים בהכלאות של צמחי אפונה?", "גרגור מנדל", ["צ׳רלס דרווין", "לואי פסטר", "אייזק ניוטון"], "מנדל פרסם את ניסויי האפונה שלו ב־1866; הם היו הבסיס לגנטיקה."]],
    ],
  },
};
export default c;
