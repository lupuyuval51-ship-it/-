import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Producer", "a living thing, usually a plant, that makes its own food", "יצרן", "יצור חי, לרוב צמח, שמייצר לעצמו מזון"],
      ["Consumer", "an animal that gets energy by eating other living things", "צרכן", "בעל חיים שמקבל אנרגיה מאכילת יצורים חיים אחרים"],
      ["Herbivore", "an animal that eats only plants", "אוכל עשב", "בעל חיים שאוכל רק צמחים"],
      ["Carnivore", "an animal that eats other animals", "אוכל בשר", "בעל חיים שאוכל בעלי חיים אחרים"],
    ],
    q: [
      [["What does a food chain usually start with?", "A plant", ["A lion", "A mushroom", "A human"], "Plants capture the sun's energy, so food chains start with them."],
        ["במה מתחילה בדרך כלל שרשרת מזון?", "בצמח", ["באריה", "בפטרייה", "באדם"], "צמחים קולטים את אנרגיית השמש, ולכן שרשראות מזון מתחילות בהם."]],
      [["Grass → rabbit → fox. Which one is the herbivore?", "The rabbit", ["The grass", "The fox", "The rabbit and the fox"], "The rabbit eats the grass (a plant) and is eaten by the fox."],
        ["עשב ← ארנב ← שועל. מי מהם אוכל עשב?", "הארנב", ["העשב", "השועל", "הארנב והשועל"], "הארנב אוכל את העשב (צמח) והשועל אוכל אותו."]],
      [["Which of these living things is a producer?", "A tomato plant", ["A mushroom growing on a log", "A caterpillar eating a leaf", "A bird eating seeds"], "Producers make their own food from sunlight, water and air. A mushroom is a fungus: it feeds on dead matter and cannot make its own food."],
        ["איזה מהיצורים החיים האלה הוא יצרן?", "צמח עגבנייה", ["פטרייה שגדלה על גזע עץ", "זחל שאוכל עלה", "ציפור שאוכלת זרעים"], "יצרנים מייצרים לעצמם מזון מאור שמש, ממים ומאוויר. פטרייה אינה צמח: היא ניזונה מחומר מת ואינה יכולה לייצר מזון בעצמה."]],
      [["In the food chain “grass → rabbit”, what does the arrow mean?", "Energy passes from the grass to the rabbit that eats it", ["It means “eats”, so the grass eats the rabbit", "It shows that the grass is bigger than the rabbit", "It shows which of the two lives longer, the grass or the rabbit"], "The arrow in a food chain shows where the energy goes: from the food to the animal that eats it. So it points from the grass to the rabbit, not the other way round."],
        ["בשרשרת המזון ״עשב ← ארנב״, מה פירוש החץ?", "האנרגיה עוברת מהעשב אל הארנב שאוכל אותו", ["החץ פירושו ״אוכל״, ולכן העשב אוכל את הארנב", "החץ מראה שהעשב גדול יותר מהארנב", "החץ מראה מי מהשניים חי יותר זמן, העשב או הארנב"], "החץ בשרשרת מזון מראה לאן עוברת האנרגיה: מהמזון אל מי שאוכל אותו. לכן החץ מצביע מהעשב אל הארנב ולא להפך."]],
    ],
    s: [[["A food chain", "Grass", "Grasshopper", "Frog", "Snake"], ["שרשרת מזון", "עשב", "חגב", "צפרדע", "נחש"]]],
  },
  i: {
    t: [
      ["Omnivore", "an animal that eats both plants and animals", "אוכל כול", "בעל חיים שאוכל גם צמחים וגם בעלי חיים"],
      ["Decomposer", "a living thing, like a fungus or bacterium, that breaks down dead matter", "מפרק", "יצור חי, כמו פטרייה או חיידק, שמפורר חומר מת לחומרים פשוטים"],
      ["Food web", "many food chains linked together in one habitat", "מארג מזון", "שרשראות מזון רבות שקשורות זו בזו באותו בית גידול"],
      ["Predator", "an animal that hunts other animals for food", "טורף", "בעל חיים שצד בעלי חיים אחרים למאכל"],
    ],
    q: [
      [["Why are decomposers important?", "They return nutrients from dead matter to the soil", ["They make oxygen for the animals at night", "They hunt the predators at the top", "They give plants the sunlight they need"], "Without decomposers, dead plants and animals would pile up and nutrients would not be recycled."],
        ["למה המפרקים חשובים?", "הם מחזירים חומרי מזון מחומר מת אל הקרקע", ["הם מייצרים חמצן לבעלי החיים בלילה", "הם צדים את הטורפים שבראש השרשרת", "הם נותנים לצמחים את אור השמש"], "בלי מפרקים, צמחים ובעלי חיים מתים היו נערמים וחומרי המזון לא היו ממוחזרים."]],
      [["In a food web, foxes disappear. What will probably happen to the rabbits at first?", "Their number will rise", ["They will disappear too", "Nothing", "They will start eating foxes"], "With fewer predators, more rabbits survive — until food runs short."],
        ["במארג מזון השועלים נעלמים. מה כנראה יקרה לארנבים בהתחלה?", "מספרם יגדל", ["גם הם ייעלמו", "כלום", "הם יתחילו לאכול שועלים"], "כשיש פחות טורפים, יותר ארנבים שורדים — עד שהמזון מתחיל לחסור."]],
      [["A brown bear eats berries, fish and honey. What kind of eater is it?", "An omnivore", ["A herbivore", "A carnivore", "A decomposer"], "Berries come from plants and fish are animals; a bear eats both, so it is an omnivore. Herbivores eat only plants and carnivores eat only animals."],
        ["דוב חום אוכל פירות יער, דגים ודבש. איזה סוג אוכל הוא?", "אוכל כול", ["אוכל עשב", "אוכל בשר", "מפרק"], "פירות יער הם צמחים ודגים הם בעלי חיים; הדוב אוכל את שניהם, ולכן הוא אוכל כול. אוכל עשב אוכל רק צמחים ואוכל בשר רק בעלי חיים."]],
      [["Why do scientists often draw a food web instead of a single food chain?", "Most animals eat several kinds of food, so many chains join up", ["A chain can never have more than three links, but a web can have more", "A chain shows only animals, but a web adds the plants too", "A web is easier to draw, because its arrows can point any way"], "Real animals rarely eat just one thing. A food web shows all these links together, so you can see how a change in one species can affect many others."],
        ["למה מדענים מציירים לעתים קרובות מארג מזון ולא שרשרת מזון אחת?", "רוב בעלי החיים אוכלים כמה סוגי מזון, ולכן שרשראות רבות מתחברות", ["בשרשרת לא יכולות להיות יותר משלוש חוליות, ובמארג יכולות להיות יותר", "שרשרת מראה רק בעלי חיים, ומארג מוסיף גם את הצמחים", "קל יותר לצייר מארג, כי החצים בו יכולים להצביע לכל כיוון"], "בעלי חיים אמיתיים כמעט אף פעם לא אוכלים רק דבר אחד. מארג המזון מראה את כל הקשרים האלה יחד, ולכן אפשר לראות איך שינוי במין אחד משפיע על מינים רבים."]],
    ],
    s: [[["A pond food chain, in order", "Algae", "Water fleas", "Small fish", "A heron"], ["שרשרת מזון בבריכה, לפי הסדר", "אצות", "פרעושי מים", "דגים קטנים", "אנפה"]]],
  },
  a: {
    t: [
      ["Trophic level", "the position of a living thing in a food chain", "רמה טרופית", "המקום של יצור חי בשרשרת מזון"],
      ["Energy pyramid", "a diagram showing how energy shrinks at each level of a food chain", "פירמידת אנרגיה", "תרשים שמראה איך האנרגיה קטנה בכל רמה של שרשרת המזון"],
      ["Bioaccumulation", "the build-up of a poison in living things, growing higher up the food chain", "הצטברות ביולוגית", "הצטברות של רעל ביצורים חיים, שגדלה ככל שעולים בשרשרת המזון"],
      ["Keystone species", "a species whose role holds the whole ecosystem together", "מין מפתח", "מין שתפקידו מחזיק את כל המערכת האקולוגית"],
    ],
    q: [
      [["Only about 10% of the energy passes from one level to the next. Where does most of it go?", "It is used for life processes and lost as heat", ["It is stored in the soil, ready for the next animal to use", "It turns back into sunlight that returns to the Sun", "It is destroyed, because energy disappears when it is used"], "Animals use most of the energy for moving, keeping warm and staying alive, and it ends up as heat. Some is also in parts that are not eaten. Energy is not destroyed, but it is lost to the next level."],
        ["רק כ־10% מהאנרגיה עוברים מרמה לרמה. לאן הולך רוב השאר?", "הוא משמש לתהליכי החיים ואובד כחום", ["הוא נאגר בקרקע, מוכן לבעל החיים הבא", "הוא חוזר להיות אור שמש וחוזר אל השמש", "הוא נהרס, כי אנרגיה נעלמת כשמשתמשים בה"], "בעלי חיים משתמשים ברוב האנרגיה לתנועה, לחום ולקיום, והיא מסתיימת כחום. חלק נשאר גם בחלקים שלא נאכלים. אנרגיה לא נהרסת, אבל היא אובדת לרמה הבאה."]],
      [["Plants hold 10,000 units of energy. About how much reaches the secondary consumers (two steps up)?", "100 units", ["1,000 units", "10 units", "5,000 units"], "10% of 10,000 = 1,000 for the primary consumers, and 10% of that = 100."],
        ["בצמחים יש 10,000 יחידות אנרגיה. בערך כמה מגיע לצרכנים מדרגה שנייה (שתי רמות למעלה)?", "100 יחידות", ["1,000 יחידות", "10 יחידות", "5,000 יחידות"], "10% מ־10,000 = 1,000 לצרכנים מדרגה ראשונה, ו־10% מזה = 100."]],
      [["Why do top predators like eagles carry the most pesticide?", "The poison builds up at each step of the food chain", ["Eagles fly over sprayed fields a lot", "Farmers spray eagles' nests directly", "Eagles drink more water than others"], "Each animal eats many from the level below and keeps their poison, so it concentrates higher up."],
        ["למה טורפי־על כמו עיטים צוברים הכי הרבה חומרי הדברה?", "הרעל מצטבר בכל שלב של שרשרת המזון", ["העיטים עפים הרבה מעל שדות מרוססים", "מרססים ישירות את קני העיטים", "העיטים שותים יותר מים מאחרים"], "כל בעל חיים אוכל רבים מהרמה שמתחתיו ושומר את הרעל שלהם, ולכן הוא מתרכז ככל שעולים."]],
      [["Why do food chains rarely have more than four or five links?", "So little energy is left that it cannot feed one more level", ["Predators at the top grow too big and slow", "Plants can feed only four kinds of animals", "Decomposers break every chain after four links"], "At every step about 90 % of the energy is lost, so very little reaches the fifth link. There is not enough left to keep one more kind of animal alive."],
        ["למה בשרשראות מזון כמעט אף פעם אין יותר מארבע או חמש חוליות?", "נשארת כל כך מעט אנרגיה, שאי אפשר להזין בה רמה נוספת", ["טורפים בראש השרשרת גדלים גדולים ואיטיים מדי", "צמחים יכולים להזין רק ארבעה סוגי בעלי חיים", "המפרקים שוברים כל שרשרת אחרי ארבע חוליות"], "בכל שלב אובדים כ־90% מהאנרגיה, ולכן מעט מאוד מגיע לחוליה החמישית. לא נשאר מספיק כדי לקיים עוד סוג של בעלי חיים."]],
      [["Sea otters eat sea urchins, and sea urchins eat kelp, a giant seaweed. When hunters nearly wiped out the otters, the kelp forests disappeared. Why?", "With no otters, the urchins multiplied and ate the kelp", ["Without otters the water grew warmer, and kelp cannot live in warm water", "The otters used to plant the kelp, and nothing else could do it", "The urchins grew heavy and crushed the kelp under their weight"], "Otters kept the sea urchins in check. Without them the urchins multiplied and ate the kelp, so one missing predator changed the whole ecosystem: that is why the otter is a keystone species."],
        ["לוטרות ים אוכלות קיפודי ים, וקיפודי ים אוכלים קלפ, אצת ענק. כשציידים כמעט השמידו את הלוטרות, יערות הקלפ נעלמו. למה?", "בלי לוטרות קיפודי הים התרבו ואכלו את הקלפ", ["בלי לוטרות המים התחממו, והקלפ לא יכול לחיות במים חמים", "הלוטרות נהגו לשתול את הקלפ, ואף אחד אחר לא יכול לעשות זאת", "קיפודי הים נעשו כבדים וריסקו את הקלפ תחת משקלם"], "הלוטרות שמרו על מספר קיפודי הים. בלעדיהן קיפודי הים התרבו ואכלו את הקלפ, ולכן טורף אחד שחסר שינה את כל המערכת האקולוגית: בגלל זה הלוטרה היא מין מפתח."]],
    ],
    n: [[10, ["Grass holds 100,000 units of energy. Using the 10 % rule, about how many units reach the hawk at the end of the chain grass → grasshopper → frog → snake → hawk?", "units", "Each step keeps 10 %: 10,000 in the grasshopper, 1,000 in the frog, 100 in the snake and 10 in the hawk."],
      ["בעשב יש 100,000 יחידות אנרגיה. לפי כלל ה־10%, בערך כמה יחידות מגיעות לנץ בסוף השרשרת עשב ← חגב ← צפרדע ← נחש ← נץ?", "יחידות", "בכל שלב נשארים 10%: 10,000 בחגב, 1,000 בצפרדע, 100 בנחש ו־10 בנץ."]]],
  },
};
export default c;
