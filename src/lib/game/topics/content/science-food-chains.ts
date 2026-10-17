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
      [["Why are decomposers important?", "They return nutrients from dead matter to the soil", ["They make oxygen at night", "They hunt predators", "They make sunlight"], "Without decomposers, dead plants and animals would pile up and nutrients would not be recycled."],
        ["למה המפרקים חשובים?", "הם מחזירים חומרי מזון מחומר מת אל הקרקע", ["הם מייצרים חמצן בלילה", "הם צדים טורפים", "הם מייצרים אור שמש"], "בלי מפרקים, צמחים ובעלי חיים מתים היו נערמים וחומרי המזון לא היו ממוחזרים."]],
      [["In a food web, foxes disappear. What will probably happen to the rabbits at first?", "Their number will rise", ["They will disappear too", "Nothing", "They will start eating foxes"], "With fewer predators, more rabbits survive — until food runs short."],
        ["במארג מזון השועלים נעלמים. מה כנראה יקרה לארנבים בהתחלה?", "מספרם יגדל", ["גם הם ייעלמו", "כלום", "הם יתחילו לאכול שועלים"], "כשיש פחות טורפים, יותר ארנבים שורדים — עד שהמזון מתחיל לחסור."]],
    ],
  },
  a: {
    t: [
      ["Trophic level", "the position of a living thing in a food chain", "רמה טרופית", "המקום של יצור חי בשרשרת מזון"],
      ["Energy pyramid", "a diagram showing how energy shrinks at each level of a food chain", "פירמידת אנרגיה", "תרשים שמראה איך האנרגיה קטנה בכל רמה של שרשרת המזון"],
      ["Bioaccumulation", "the build-up of a poison in living things, growing higher up the food chain", "הצטברות ביולוגית", "הצטברות של רעל ביצורים חיים, שגדלה ככל שעולים בשרשרת המזון"],
      ["Keystone species", "a species whose role holds the whole ecosystem together", "מין מפתח", "מין שתפקידו מחזיק את כל המערכת האקולוגית"],
    ],
    q: [
      [["Only about 10% of the energy passes from one level to the next. Where does most of it go?", "It is used for life processes and lost as heat", ["It is stored in the soil", "It turns back into sunlight", "It is destroyed"], "Animals use most energy for movement, warmth and living; it ends up as heat, and some is in parts that are not eaten."],
        ["רק כ־10% מהאנרגיה עוברים מרמה לרמה. לאן הולך רוב השאר?", "הוא משמש לתהליכי החיים ואובד כחום", ["הוא נאגר בקרקע", "הוא חוזר להיות אור שמש", "הוא נהרס"], "בעלי חיים משתמשים ברוב האנרגיה לתנועה, לחום ולקיום; היא מסתיימת כחום, וחלק נשאר בחלקים שלא נאכלים."]],
      [["Plants hold 10,000 units of energy. About how much reaches the second consumers (two steps up)?", "100 units", ["1,000 units", "10 units", "5,000 units"], "10% of 10,000 = 1,000 for the first consumers, and 10% of that = 100."],
        ["בצמחים יש 10,000 יחידות אנרגיה. בערך כמה מגיע לצרכנים מדרגה שנייה (שתי רמות למעלה)?", "100 יחידות", ["1,000 יחידות", "10 יחידות", "5,000 יחידות"], "10% מ־10,000 = 1,000 לצרכנים הראשונים, ו־10% מזה = 100."]],
      [["Why do top predators like eagles carry the most pesticide?", "The poison builds up at each step of the food chain", ["Eagles spray crops", "Pesticides attract eagles", "Eagles drink more water"], "Each animal eats many from the level below and keeps their poison, so it concentrates higher up."],
        ["למה טורפי־על כמו נשרים ועיטים צוברים הכי הרבה חומרי הדברה?", "הרעל מצטבר בכל שלב של שרשרת המזון", ["העופות מרססים שדות", "חומרי הדברה מושכים אותם", "הם שותים יותר מים"], "כל בעל חיים אוכל רבים מהרמה שמתחתיו ושומר את הרעל שלהם, ולכן הוא מתרכז ככל שעולים."]],
    ],
  },
};
export default c;
