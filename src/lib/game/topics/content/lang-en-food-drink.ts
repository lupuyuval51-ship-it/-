import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["breakfast", "the first meal of the day, eaten in the morning", "breakfast", "הארוחה הראשונה של היום, שאוכלים בבוקר"],
      ["vegetable", "a plant or part of a plant that we eat, like a carrot or a potato", "vegetable", "צמח או חלק מצמח שאוכלים, כמו גזר או תפוח אדמה"],
      ["sweet", "tasting of sugar, like honey or chocolate", "sweet", "בטעם של סוכר, כמו דבש או שוקולד"],
      ["salty", "tasting of salt, like olives, pretzels or sea water", "salty", "בטעם של מלח, כמו זיתים, בייגלה או מי ים"],
    ],
    q: [
      [["Which one is a fruit?", "banana", ["carrot", "cheese", "bread"], "A banana is a fruit: it grows from the flower of the banana plant. A carrot is a vegetable, cheese is made from milk, and bread is baked from flour."],
        ["איזה מהם הוא פרי?", "banana", ["carrot", "cheese", "bread"], "banana, בננה, היא פרי שמתפתח מהפרח של צמח הבננה. carrot (גזר) הוא ירק, cheese (גבינה) עשויה מחלב, ואת bread (לחם) אופים מקמח."]],
      [["What do lemons taste like?", "sour", ["sweet", "salty", "spicy"], "Lemons are sour: they have a sharp taste that makes you screw up your face. Sugar tastes sweet, pretzels taste salty, and chilli tastes spicy."],
        ["איזה טעם יש ללימון?", "sour", ["sweet", "salty", "spicy"], "ללימון יש טעם sour, חמוץ וחד. סוכר הוא sweet (מתוק), בייגלה הוא salty (מלוח), וצ׳ילי הוא spicy (חריף)."]],
      [["Complete: “You eat soup with a ___.”", "spoon", ["fork", "knife", "plate"], "Soup is a liquid, so you need a spoon to scoop it up. Soup would drip through the gaps of a fork, a knife is for cutting, and a plate is something you put food on."],
        ["השלימו: ״You eat soup with a ___.״", "spoon", ["fork", "knife", "plate"], "מרק הוא נוזל, ולכן צריך spoon, כף, כדי לאסוף אותו. בין השיניים של fork (מזלג) המרק נוזל החוצה, knife (סכין) נועדה לחיתוך, ו־plate (צלחת) היא כלי שמניחים עליו אוכל."]],
      [["Which meal do people usually eat in the middle of the day?", "lunch", ["supper", "breakfast", "dessert"], "Lunch is the meal in the middle of the day. Breakfast is eaten in the morning and supper in the evening, and dessert is the sweet dish at the end of a meal."],
        ["איזו ארוחה אוכלים בדרך כלל באמצע היום?", "lunch", ["supper", "breakfast", "dessert"], "lunch היא ארוחת הצהריים. את breakfast אוכלים בבוקר ואת supper בערב, ו־dessert הוא הקינוח, המנה המתוקה שבסוף הארוחה."]],
      [["Complete: “I'm ___. Can I have a glass of water, please?”", "thirsty", ["hungry", "starving", "sleepy"], "Thirsty means you need something to drink, so you ask for water. Hungry and starving are about needing food, and sleepy is about needing sleep."],
        ["השלימו: ״I'm ___. Can I have a glass of water, please?״", "thirsty", ["hungry", "starving", "sleepy"], "thirsty פירושו צמאים, כלומר צריכים לשתות, ולכן מבקשים מים. hungry ו־starving מתארים רעב לאוכל, ו־sleepy פירושו שרוצים לישון."]],
    ],
    n: [
      [3, ["How many of these words are fruits: apple, carrot, grape, potato, pear?", "", "Apple, grape and pear are fruits, so the answer is 3; carrot and potato are vegetables."],
        ["כמה מהמילים האלה הן פירות: apple, carrot, grape, potato, pear?", "", "apple (תפוח), grape (ענב) ו־pear (אגס) הם פירות, ולכן התשובה היא 3; carrot (גזר) ו־potato (תפוח אדמה) הם ירקות."]],
    ],
  },
  i: {
    t: [
      ["boil", "to heat a liquid until it bubbles, or to cook food in bubbling water", "boil", "לחמם נוזל עד שהוא מבעבע, או לבשל אוכל במים מבעבעים"],
      ["chop", "to cut food into small pieces with a knife", "chop", "לחתוך אוכל לחתיכות קטנות בסכין"],
      ["peel", "to take the skin off a fruit or a vegetable", "peel", "להסיר את הקליפה מפרי או מירק"],
      ["loaf", "bread baked in one big piece, before anyone cuts it", "loaf", "לחם שנאפה בחתיכה אחת גדולה, לפני שחותכים אותו"],
    ],
    q: [
      [["Complete: “Can I have a ___ of bread, please?”", "slice", ["carton", "bottle", "can"], "Bread is cut into slices, so you ask for a slice of bread. Bottles and cartons hold drinks like water or milk, and cans hold drinks or soup, not bread."],
        ["השלימו: ״Can I have a ___ of bread, please?״", "slice", ["carton", "bottle", "can"], "את הלחם פורסים לפרוסות, ולכן מבקשים a slice of bread, פרוסת לחם. ב־bottle (בקבוק) וב־carton (קרטון) יש משקאות כמו מים או חלב, וב־can (פחית או קופסת שימורים) יש שתייה או מרק, לא לחם."]],
      [["Complete: “He bought a ___ of chocolate.”", "bar", ["carton", "loaf", "bottle"], "Chocolate is often sold as a flat block called a bar: a bar of chocolate. A bottle and a carton hold drinks, and a loaf is a whole bread."],
        ["השלימו: ״He bought a ___ of chocolate.״", "bar", ["carton", "loaf", "bottle"], "שוקולד נמכר לרוב כחפיסה שטוחה, שבאנגלית נקראת bar: a bar of chocolate. ב־bottle וב־carton יש משקאות, ו־loaf הוא כיכר לחם שלמה."]],
      [["Which sentence about rice is correct?", "I'd like some rice, please.", ["I'd like some rices, please.", "I'd like a rice, please.", "I'd like many rice, please."], "Rice is uncountable: you cannot count single rices, so it takes some, with no a and no -s. For more of it, say a bowl of rice or a lot of rice."],
        ["איזה משפט על rice (אורז) נכון?", "I'd like some rice, please.", ["I'd like some rices, please.", "I'd like a rice, please.", "I'd like many rice, please."], "rice הוא שם עצם שאי אפשר לספור: לא סופרים ״rices״, ולכן אומרים some rice, בלי a ובלי s. כשרוצים הרבה, אומרים a bowl of rice או a lot of rice."]],
      [["You cook an egg in a pan with a little hot oil. What are you doing to it?", "frying it", ["boiling it", "baking it", "freezing it"], "To fry is to cook food in hot oil or fat in a pan. Boiling uses bubbling water, baking uses the dry heat of an oven, and freezing makes food very cold."],
        ["מבשלים ביצה במחבת עם מעט שמן חם. איך אומרים באנגלית מה עושים לה?", "frying it", ["boiling it", "baking it", "freezing it"], "fry פירושו לטגן: לבשל אוכל בשמן חם במחבת. boil זה לבשל במים רותחים, bake זה לאפות בחום היבש של התנור, ו־freeze זה להקפיא."]],
      [["Black coffee without sugar and very dark chocolate taste…", "bitter", ["sour", "salty", "sugary"], "Bitter is the strong, sharp taste of black coffee or very dark chocolate. Sour is the taste of lemons, salty is the taste of salt, and sugary means full of sugar."],
        ["קפה שחור בלי סוכר ושוקולד מריר מאוד הם בטעם…", "bitter", ["sour", "salty", "sugary"], "bitter הוא הטעם המר והחזק של קפה שחור או של שוקולד מריר. sour הוא הטעם החמוץ של לימון, salty הוא הטעם המלוח של מלח, ו־sugary פירושו מלא סוכר."]],
    ],
    n: [
      [12, ["Eggs are often sold by the dozen. How many eggs are in a dozen?", "", "A dozen means 12, so a dozen eggs is 12 eggs, and half a dozen is 6."],
        ["ביצים נמכרות הרבה פעמים ב־dozen. כמה ביצים יש ב־dozen אחד?", "", "dozen פירושו תריסר, כלומר 12, ולכן a dozen eggs הן 12 ביצים, ו־half a dozen הן 6."]],
    ],
    s: [
      [["Making a cheese sandwich, in order", "Take two pieces of bread", "Spread butter on both pieces", "Put some cheese on one piece", "Cover it with the other piece", "Cut the sandwich in half"],
        ["מכינים כריך גבינה, לפי הסדר", "״Take two pieces of bread״ — לוקחים שתי חתיכות לחם", "״Spread butter on both pieces״ — מורחים חמאה על שתיהן", "״Put some cheese on one piece״ — שמים גבינה על אחת מהן", "״Cover it with the other piece״ — מכסים בחתיכה השנייה", "״Cut the sandwich in half״ — חותכים את הכריך לשניים"]],
    ],
  },
  a: {
    t: [
      ["raw", "not cooked, as food is before it is heated", "raw", "לא מבושל, כמו אוכל לפני שמחממים אותו"],
      ["vegetarian", "a person who does not eat meat or fish", "vegetarian", "אדם שלא אוכל בשר ולא דגים"],
      ["stir", "to move a spoon round and round in a liquid to mix it", "stir", "להזיז כף בתנועה סיבובית בתוך נוזל כדי לערבב אותו"],
      ["a piece of cake", "an idiom meaning that something is very easy", "a piece of cake", "ניב שפירושו שמשהו קל מאוד"],
    ],
    q: [
      [["Complete: “How ___ sugar do you take in your tea?”", "much", ["many", "lot", "few"], "Sugar is uncountable, so we ask how much. How many is for things we can count, like how many eggs or how many apples."],
        ["השלימו: ״How ___ sugar do you take in your tea?״", "much", ["many", "lot", "few"], "sugar (סוכר) הוא שם עצם שאי אפשר לספור, ולכן שואלים how much. את how many שואלים על דברים שאפשר לספור, כמו how many eggs או how many apples."]],
      [["Complete: “Add a ___ salt and a few tomatoes.”", "little", ["few", "plenty", "many"], "Salt cannot be counted, so a small amount of it is a little salt; a few goes with plurals you can count, like a few tomatoes. We say plenty of salt, never a plenty, and many is only for plurals."],
        ["השלימו: ״Add a ___ salt and a few tomatoes.״", "little", ["few", "plenty", "many"], "מלח אי אפשר לספור, ולכן כמות קטנה ממנו היא a little salt; a few בא עם רבים שאפשר לספור, כמו a few tomatoes. אומרים plenty of salt ולא a plenty, ו־many בא רק עם רבים."]],
      [["Which of these words can you count, with a number before it?", "apple", ["butter", "flour", "milk"], "You can say one apple, two apples, so apple is countable. Butter, flour and milk are uncountable: we say some butter or a bag of flour, not two flours."],
        ["איזו מהמילים האלה אפשר לספור, עם מספר לפניה?", "apple", ["butter", "flour", "milk"], "אפשר לומר one apple, two apples, ולכן apple הוא שם עצם שנספר. את butter, flour ו־milk אי אפשר לספור: אומרים some butter או a bag of flour, ולא two flours."]],
      [["In a recipe, which verb means to rub cheese on a tool with small sharp holes to make thin strips?", "grate", ["slice", "chop", "melt"], "To grate is to rub food like cheese or carrots on a grater, which turns it into thin strips. Slicing and chopping are done with a knife, and melting is done with heat."],
        ["באיזה פועל משתמשים במתכון כשמשפשפים גבינה על כלי עם חורים קטנים וחדים, כדי לקבל רצועות דקות?", "grate", ["slice", "chop", "melt"], "grate פירושו לגרר: לשפשף אוכל כמו גבינה או גזר על פומפייה, grater, ולקבל רצועות דקות. את slice ו־chop עושים בסכין, ואת melt, ההמסה, עושים בעזרת חום."]],
      [["Which is the most polite way to order in a café?", "I'd like a glass of orange juice, please.", ["I want a glass of orange juice, and I want it now.", "Give me a glass of orange juice, waiter, quickly.", "Bring orange juice to my table, fast."], "I'd like (I would like) with please is the polite way to order. I want… now, Give me and Bring… fast sound rude, even though the words for the drink are right."],
        ["מה הדרך הכי מנומסת להזמין בבית קפה?", "I'd like a glass of orange juice, please.", ["I want a glass of orange juice, and I want it now.", "Give me a glass of orange juice, waiter, quickly.", "Bring orange juice to my table, fast."], "I'd like (כלומר I would like) יחד עם please היא הדרך המנומסת להזמין. I want… now, Give me ו־Bring… fast נשמעים גסים, גם כשהמילים של המשקה נכונות."]],
      [["Which sentence means you want to eat some of the meat, not a whole bird?", "I'd like some chicken.", ["I'd like a chicken.", "I'd like a whole chicken, please.", "I'd like two chickens."], "Without a, chicken is uncountable and means the meat: some chicken. A chicken, a whole chicken and two chickens are whole birds."],
        ["איזה משפט אומר שרוצים לאכול קצת מהבשר, ולא עוף שלם?", "I'd like some chicken.", ["I'd like a chicken.", "I'd like a whole chicken, please.", "I'd like two chickens."], "בלי a, המילה chicken היא שם עצם שלא נספר, ופירושה הבשר: some chicken. לעומת זאת a chicken, a whole chicken ו־two chickens הם עופות שלמים."]],
    ],
    n: [
      [3, ["How many of these words are uncountable: rice, banana, bread, sandwich, water?", "", "Rice, bread and water cannot be counted one by one, so 3 of them are uncountable; you can say two bananas and two sandwiches."],
        ["כמה מהמילים האלה הן שמות עצם שאי אפשר לספור: rice, banana, bread, sandwich, water?", "", "את rice, bread ו־water אי אפשר לספור אחד־אחד, ולכן 3 מהן לא נספרות; אפשר לומר two bananas ו־two sandwiches."]],
    ],
    s: [
      [["Making scrambled eggs, in order", "Crack the eggs into a bowl", "Whisk them with a fork", "Pour them into a hot pan", "Stir until they are cooked", "Serve them on toast"],
        ["מכינים ביצים מקושקשות, לפי הסדר", "״Crack the eggs into a bowl״ — שוברים את הביצים לקערה", "״Whisk them with a fork״ — טורפים אותן במזלג", "״Pour them into a hot pan״ — יוצקים אותן למחבת חמה", "״Stir until they are cooked״ — מערבבים עד שהן מתבשלות", "״Serve them on toast״ — מגישים אותן על טוסט"]],
    ],
  },
};
export default c;
