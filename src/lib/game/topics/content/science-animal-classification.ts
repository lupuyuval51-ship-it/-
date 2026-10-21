import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Vertebrate", "an animal that has a backbone", "בעל חוליות", "בעל חיים שיש לו עמוד שדרה"],
      ["Invertebrate", "an animal with no backbone, such as a snail, a spider or a jellyfish", "חסר חוליות", "בעל חיים בלי עמוד שדרה, כמו חילזון, עכביש או מדוזה"],
      ["Mammal", "a warm-blooded animal that feeds its babies with the mother's milk, such as a dog or a whale", "יונק", "בעל חיים בעל דם חם שמניק את צאצאיו בחלב אם, כמו כלב או לווייתן"],
      ["Bird", "an animal with feathers and a beak that lays eggs", "עוף", "בעל חיים עם נוצות ומקור, שמטיל ביצים"],
    ],
    q: [
      [["A bat has wings and flies, but scientists call it a mammal. Why?", "It has fur and feeds its babies with milk", ["It lives in dark caves and sleeps hanging upside down", "It only comes out at night, as owls do", "It lays eggs, but only in dark caves"], "Mammals have fur or hair and feed their young with milk, and a bat does both. Flying does not decide the group, because some insects and birds fly too."],
        ["לעטלף יש כנפיים והוא עף, אבל מדענים מסווגים אותו כיונק. למה?", "יש לו פרווה והוא מניק את גוריו בחלב", ["הוא חי במערות חשוכות וישן כשהוא תלוי הפוך", "הוא יוצא רק בלילה, כמו ינשוף", "הוא מטיל ביצים, אבל רק במערות חשוכות"], "ליונקים יש פרווה או שיער והם מניקים את הצאצאים בחלב, ועטלף עושה את שני הדברים. טיסה לא קובעת את הקבוצה, כי גם חרקים ועופות עפים."]],
      [["Which of these animals has no backbone?", "A spider", ["A frog", "A snake", "A goldfish"], "A spider has no backbone; a hard outer skeleton protects its body. A frog, a snake and a goldfish are all vertebrates."],
        ["לאיזה מבעלי החיים האלה אין עמוד שדרה?", "לעכביש", ["לצפרדע", "לנחש", "לדג זהב"], "לעכביש אין עמוד שדרה; שלד חיצוני קשיח מגן על גופו. צפרדע, נחש ודג זהב הם כולם בעלי חוליות."]],
      [["Which of these animals is a bird?", "A penguin", ["A bat", "A butterfly", "A flying fish"], "A penguin cannot fly, but it has feathers and a beak and lays eggs, so it is a bird. A bat is a mammal, a butterfly is an insect and a flying fish is a fish."],
        ["איזה מבעלי החיים האלה הוא עוף?", "פינגווין", ["עטלף", "פרפר", "דג מעופף"], "פינגווין לא יכול לעוף, אבל יש לו נוצות ומקור והוא מטיל ביצים, ולכן הוא עוף. עטלף הוא יונק, פרפר הוא חרק ודג מעופף הוא דג."]],
      [["A snake has no legs. Why is it still a vertebrate?", "It has a backbone made of many small bones in a row", ["It has scaly skin that is hard like armour", "It lays eggs, as every vertebrate does", "It moves along the ground, so it needs strong bones"], "Vertebrates are the animals with a backbone, whether or not they have legs. A snake's long backbone has many small bones in a row, so it can bend and wriggle."],
        ["לנחש אין רגליים. למה הוא בכל זאת בעל חוליות?", "יש לו עמוד שדרה שבנוי מהרבה עצמות קטנות בשורה", ["יש לו עור מכוסה קשקשים שקשה כמו שריון", "הוא מטיל ביצים, כמו כל בעלי החוליות", "הוא נע על הקרקע, ולכן הוא צריך עצמות חזקות"], "בעלי חוליות הם בעלי החיים שיש להם עמוד שדרה, בין שיש להם רגליים ובין שלא. בעמוד השדרה הארוך של נחש יש הרבה עצמות קטנות בשורה, ולכן הוא יכול להתכופף ולהתפתל."]],
      [["Which of these animals is an invertebrate?", "A starfish", ["A seahorse", "A sea turtle", "A dolphin"], "Despite its name, a starfish is not a fish. It has no backbone, so it is an invertebrate. A seahorse is a fish, a sea turtle is a reptile and a dolphin is a mammal."],
        ["איזה מבעלי החיים האלה הוא חסר חוליות?", "כוכב ים", ["סוסון ים", "צב ים", "דולפין"], "למרות שמו, כוכב ים אינו דג. אין לו עמוד שדרה, ולכן הוא חסר חוליות. סוסון ים הוא דג, צב ים הוא זוחל ודולפין הוא יונק."]],
    ],
  },
  i: {
    t: [
      ["Reptile", "a vertebrate with dry, scaly skin that usually lays eggs on land, such as a lizard, a snake or a turtle", "זוחל", "בעל חוליות עם עור יבש ומכוסה קשקשים, שבדרך כלל מטיל ביצים ביבשה, כמו לטאה, נחש או צב"],
      ["Amphibian", "a vertebrate that usually hatches in water breathing with gills, then grows lungs and can live on land, such as a frog", "דו־חי", "בעל חוליות שבדרך כלל בוקע במים ונושם בזימים, ואחר כך מפתח ריאות ויכול לחיות ביבשה, כמו צפרדע"],
      ["Fish", "a vertebrate that lives in water, breathes with gills and usually has fins and scales", "דג", "בעל חוליות שחי במים, נושם בזימים ובדרך כלל יש לו סנפירים וקשקשים"],
      ["Insect", "an invertebrate with six legs and a body in three parts: head, thorax and abdomen", "חרק", "חסר חוליות עם שש רגליים וגוף משלושה חלקים: ראש, חזה ובטן"],
    ],
    q: [
      [["A dolphin lives in the sea and has fins. Why is it a mammal and not a fish?", "It breathes air with lungs and feeds its young with milk", ["It swims faster than almost every fish, so scientists put it in its own group", "It eats fish, and only mammals eat other animals", "It lives in big groups, and fish always swim alone"], "Fish breathe with gills, but a dolphin must come up to breathe air through the blowhole on its head, and the mother feeds her calf with milk. Those are mammal features."],
        ["דולפין חי בים ויש לו סנפירים. למה הוא יונק ולא דג?", "הוא נושם אוויר בריאות ומניק את צאצאיו בחלב", ["הוא שוחה מהר יותר כמעט מכל דג, ולכן מדענים שמים אותו בקבוצה נפרדת", "הוא אוכל דגים, ורק יונקים אוכלים בעלי חיים אחרים", "הוא חי בלהקות גדולות, ודגים תמיד שוחים לבד"], "דגים נושמים בזימים, אבל דולפין חייב לעלות אל פני המים כדי לנשום אוויר דרך נחיר הנשימה שבראשו, והאם מניקה את הגור שלה בחלב. אלה תכונות של יונקים."]],
      [["Is a spider an insect?", "No: it has eight legs and a body in two parts", ["Yes: it has six legs, like all insects", "Yes: every small animal with legs is an insect", "No: it is a reptile"], "Insects have six legs and three body parts. Spiders have eight legs and two body parts, and they belong to a different group, together with scorpions."],
        ["האם עכביש הוא חרק?", "לא: יש לו שמונה רגליים וגוף משני חלקים", ["כן: יש לו שש רגליים, כמו לכל החרקים", "כן: כל בעל חיים קטן שיש לו רגליים הוא חרק", "לא: הוא שייך לקבוצת הזוחלים"], "לחרקים יש שש רגליים ושלושה חלקי גוף. לעכבישים יש שמונה רגליים ושני חלקי גוף, והם שייכים לקבוצה אחרת, יחד עם העקרבים."]],
      [["Lizards and snakes often lie in the sun in the morning. Why?", "Their body temperature depends on their surroundings, so they warm up in the sun", ["The sunlight feeds them through their skin, in the same way as it feeds the leaves of plants", "They are drying their scales after a night in the water", "They are getting ready to shed their skin, which only happens in the sun"], "Reptiles do not make enough body heat of their own, as mammals and birds do. They warm up in the sun and move into the shade when it gets too hot."],
        ["לטאות ונחשים שוכבים לעיתים קרובות בשמש בבוקר. למה?", "טמפרטורת הגוף שלהם תלויה בסביבה, ולכן הם מתחממים בשמש", ["אור השמש מזין אותם דרך העור, כמו שהוא מזין את העלים של צמחים", "הם מייבשים את הקשקשים אחרי לילה במים", "הם מתכוננים להשיל את העור, וזה קורה רק בשמש"], "זוחלים לא מייצרים מספיק חום גוף בעצמם, כמו שיונקים ועופות עושים. הם מתחממים בשמש ועוברים לצל כשנעשה חם מדי."]],
      [["Which of these animals is an amphibian?", "A frog", ["A desert lizard", "A crocodile", "A shark"], "A frog starts life in water as a tadpole with gills and later lives on land as well. Lizards and crocodiles are reptiles, and a shark is a fish."],
        ["איזה מבעלי החיים האלה הוא דו־חי?", "צפרדע", ["לטאת מדבר", "תנין", "כריש"], "צפרדע מתחילה את חייה במים כראשן עם זימים, ואחר כך חיה גם ביבשה. לטאה ותנין הם זוחלים, וכריש הוא דג."]],
    ],
    n: [[34, ["An insect has 6 legs and a spider has 8. How many legs do 3 insects and 2 spiders have altogether?", "legs", "3 × 6 = 18 and 2 × 8 = 16, so 18 + 16 = 34 legs."],
      ["לחרק יש 6 רגליים ולעכביש יש 8. כמה רגליים יש בסך הכול ל־3 חרקים ול־2 עכבישים?", "רגליים", "3 × 6 = 18 ו־2 × 8 = 16, ולכן 18 + 16 = 34 רגליים."]]],
    s: [[["The life of a frog, in order", "Eggs laid in water", "A tadpole that breathes with gills", "The tadpole grows legs", "A young frog with a short tail", "An adult frog"],
      ["מחזור החיים של צפרדע, לפי הסדר", "ביצים שהוטלו במים", "ראשן שנושם בזימים", "לראשן צומחות רגליים", "צפרדע צעירה עם זנב קצר", "צפרדע בוגרת"]]],
  },
  a: {
    t: [
      ["Species", "a group of living things so alike that they can breed together and have young that can breed too", "מין", "קבוצה של יצורים חיים דומים כל כך שהם יכולים להתרבות זה עם זה ולהוליד צאצאים פוריים"],
      ["Genus", "a group of closely related species, named in the first part of a scientific name", "סוג", "קבוצה של מינים קרובים מאוד, ששמה הוא החלק הראשון בשם המדעי"],
      ["Kingdom", "one of the largest groups that scientists sort living things into, such as animals, plants or fungi", "ממלכה", "אחת הקבוצות הגדולות ביותר שמדענים ממיינים אליהן יצורים חיים, כמו בעלי חיים, צמחים או פטריות"],
      ["Exoskeleton", "a hard outer covering that supports and protects the body of animals such as insects, spiders and crabs", "שלד חיצוני", "כיסוי קשה מבחוץ שתומך בגוף ומגן עליו אצל בעלי חיים כמו חרקים, עכבישים וסרטנים"],
    ],
    q: [
      [["The platypus lays eggs, yet scientists call it a mammal. Why?", "It has fur, and the mother feeds her young with milk", ["It has a flat bill like a duck, which only mammals have", "It swims in rivers, like many fish do", "It has four legs, which only mammals have"], "Fur and milk are what make an animal a mammal. The platypus and the echidnas are the only mammals alive today that lay eggs."],
        ["הברווזן מטיל ביצים, ובכל זאת מדענים מסווגים אותו כיונק. למה?", "יש לו פרווה, והאם מניקה את צאצאיה בחלב", ["יש לו מקור שטוח כמו של ברווז, ורק ליונקים יש מקור כזה", "הוא שוחה בנהרות, כמו דגים רבים", "יש לו ארבע רגליים, ורק ליונקים יש ארבע רגליים"], "פרווה וחלב הם מה שהופך בעל חיים ליונק. הברווזן והקיפודנים הם היונקים היחידים שחיים היום ומטילים ביצים."]],
      [["Who created the system of giving every species a two-part scientific name, such as Homo sapiens for humans?", "Carl Linnaeus", ["Charles Darwin", "Gregor Mendel", "Isaac Newton"], "The Swedish scientist Carl Linnaeus published his naming system in the 1700s, and scientists still use it. Darwin explained evolution, Mendel discovered rules of heredity and Newton studied forces and gravity."],
        ["מי יצר את השיטה שבה כל מין מקבל שם מדעי בן שני חלקים, כמו Homo sapiens לאדם?", "קרל לינאוס", ["צ׳רלס דרווין", "גרגור מנדל", "אייזק ניוטון"], "המדען השוודי קרל לינאוס פרסם את שיטת השמות שלו במאה ה־18, ומדענים משתמשים בה עד היום. דרווין הסביר את האבולוציה, מנדל גילה חוקים של תורשה וניוטון חקר כוחות וכוח משיכה."]],
      [["In the scientific name of humans, Homo sapiens, what does the word Homo name?", "The genus", ["The species", "The kingdom", "The class"], "A scientific name gives the genus first (Homo) and then a second word (sapiens) that marks one species within that genus."],
        ["בשם המדעי של האדם, Homo sapiens, מה מציינת המילה Homo?", "את הסוג", ["את המין", "את הממלכה", "את המחלקה"], "שם מדעי מציין קודם את הסוג (Homo), ואחריו מילה שנייה (sapiens) שמסמנת מין אחד בתוך הסוג הזה."]],
      [["A shark's skeleton is not made of bone. What is it made of?", "Cartilage, the bendy material in your ears and nose", ["A hard shell on the outside, like a crab's", "Keratin, the material that hair and nails are made of", "Hard plates of calcium under the skin, like a turtle's shell"], "Sharks are fish whose skeletons are made of cartilage, which is lighter and more flexible than bone. They still have a backbone, so they are vertebrates."],
        ["השלד של כריש אינו עשוי עצם. ממה הוא עשוי?", "מסחוס, החומר הגמיש שיש באוזניים ובאף שלכם", ["משריון קשה מבחוץ, כמו של סרטן", "מקרטין, החומר שהשיער והציפורניים עשויים ממנו", "מלוחות סידן קשים מתחת לעור, כמו השריון של צב"], "כרישים הם דגים שהשלד שלהם עשוי סחוס, קל וגמיש יותר מעצם. עדיין יש להם עמוד שדרה, ולכן הם בעלי חוליות."]],
      [["Which statement about the animals of the world is true?", "Most known animal species are invertebrates, and most of those are insects", ["Most known animal species are mammals", "Mammals, birds and fish together have more known species than the insects do", "Vertebrates and invertebrates have about the same number of species"], "Scientists have described about a million species of insects, far more than all the vertebrate species together, which number in the tens of thousands."],
        ["איזו טענה על בעלי החיים בעולם נכונה?", "רוב מיני בעלי החיים המוכרים הם חסרי חוליות, ורובם חרקים", ["רוב מיני בעלי החיים המוכרים הם יונקים", "ליונקים, לעופות ולדגים יחד יש יותר מינים מוכרים מאשר לחרקים", "לבעלי חוליות ולחסרי חוליות יש בערך אותו מספר מינים"], "מדענים תיארו כמיליון מינים של חרקים, הרבה יותר מכל מיני בעלי החוליות יחד, שמספרם עשרות אלפים."]],
    ],
    s: [[["Groups that humans belong to, from the largest to the smallest", "Animals", "Vertebrates", "Mammals", "Primates", "The genus Homo", "The species Homo sapiens"],
      ["קבוצות שהאדם שייך אליהן, מהגדולה ביותר ועד הקטנה ביותר", "בעלי חיים", "בעלי חוליות", "יונקים", "פרימטים", "הסוג אדם", "המין אדם נבון"]]],
  },
};
export default c;
