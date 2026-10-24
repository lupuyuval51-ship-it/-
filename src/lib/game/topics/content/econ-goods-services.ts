import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Goods", "things you can touch that people make, grow or buy, like bread or shoes", "מוצרים", "דברים שאפשר לגעת בהם, שאנשים מכינים, מגדלים או קונים, כמו לחם או נעליים"],
      ["Services", "work that one person does for another, like cutting hair or teaching", "שירותים", "עבודה שאדם אחד עושה בשביל אדם אחר, כמו תספורת או הוראה"],
      ["Customer", "a person who pays a shop or a worker for something", "לקוח", "אדם שמשלם לחנות או לבעל מקצוע תמורת משהו"],
    ],
    q: [
      [["Which of these is a good?", "A loaf of bread", ["A visit to the dentist", "A piano lesson", "A haircut"], "Bread is a thing you can hold, eat and take home, so it is a good. A dentist visit, a lesson and a haircut are work done for you: they are services."],
        ["איזה מאלה הוא מוצר?", "כיכר לחם", ["ביקור אצל רופא השיניים", "שיעור פסנתר", "תספורת"], "לחם הוא דבר שאפשר להחזיק, לאכול ולקחת הביתה, ולכן הוא מוצר. ביקור אצל רופא שיניים, שיעור ותספורת הם עבודה שמישהו עושה בשבילכם: הם שירותים."]],
      [["Which of these is a service?", "A check-up at the doctor's", ["A box of colouring pencils", "A new bicycle helmet", "A bag of apples"], "At a check-up the doctor does work for you: that is a service. Pencils, a helmet and apples are things you can touch and keep, so they are goods."],
        ["איזה מאלה הוא שירות?", "בדיקה אצל הרופאה", ["קופסת עפרונות צבעוניים", "קסדה חדשה לאופניים", "שקית תפוחים"], "בבדיקה הרופאה עושה בשבילכם עבודה: זה שירות. עפרונות, קסדה ותפוחים הם דברים שאפשר לגעת בהם ולשמור אותם, ולכן הם מוצרים."]],
      [["A farmer grows tomatoes and sells them at the market. Who is the producer?", "The farmer", ["The family that buys the tomatoes", "The child who eats the salad", "The rain that waters the field"], "A producer makes or grows goods, or gives a service. The farmer grows the tomatoes; the family that buys them and eats them are the consumers."],
        ["חקלאית מגדלת עגבניות ומוכרת אותן בשוק. מי היצרנית?", "החקלאית", ["המשפחה שקונה את העגבניות", "הילד שאוכל את הסלט", "הגשם שמשקה את השדה"], "יצרן הוא מי שמכין או מגדל מוצרים, או נותן שירות. החקלאית מגדלת את העגבניות; המשפחה שקונה אותן ואוכלת אותן היא הצרכנית."]],
      [["A factory makes ice cream, a truck brings it to a kiosk and a girl buys a cone. Who is the consumer here?", "The girl who buys the cone", ["The worker at the ice-cream factory", "The driver of the delivery truck", "The ice-cream cone itself"], "A consumer is the person who buys and uses the good. The factory worker and the driver are producers: one makes the ice cream and the other gives a delivery service."],
        ["מפעל מכין גלידה, משאית מביאה אותה לקיוסק וילדה קונה גביע. מי הצרכנית בסיפור?", "הילדה שקונה את הגביע", ["העובדת במפעל הגלידה", "הנהג של משאית המשלוחים", "גביע הגלידה עצמו"], "צרכן הוא מי שקונה את המוצר ומשתמש בו. העובדת במפעל והנהג הם יצרנים: היא מכינה את הגלידה והוא נותן שירות של הובלה."]],
      [["Why do the people in a town need each other?", "No one can make everything they need by themselves", ["Because every person in a town does the very same job", "Because nobody is allowed to grow food at home", "Because people cannot do any work at all"], "A baker needs a farmer for wheat, the farmer needs a doctor when ill, and the doctor needs bread. Each person does some jobs and gets the rest from others."],
        ["למה האנשים ביישוב צריכים זה את זה?", "אף אחד לא יכול להכין לבד את כל מה שהוא צריך", ["כי כל האנשים ביישוב עושים בדיוק את אותה עבודה", "כי אסור לגדל אוכל בבית", "כי אנשים לא יכולים לעבוד בכלל"], "האופה צריכה חקלאי בשביל החיטה, החקלאי צריך רופאה כשהוא חולה, והרופאה צריכה לחם. כל אחד עושה חלק מהעבודות ומקבל את השאר מאחרים."]],
    ],
    n: [[12, ["A hairdresser gives 3 haircuts every hour. How many haircuts does she give in 4 hours?", "", "3 haircuts each hour for 4 hours: 3 × 4 = 12 haircuts. Each haircut is a service."],
      ["ספרית עושה 3 תספורות בכל שעה. כמה תספורות היא עושה ב־4 שעות?", "", "3 תספורות בכל שעה במשך 4 שעות: 3 × 4 = 12 תספורות. כל תספורת היא שירות."]]],
    s: [[["From wheat to bread on your table, in order", "A farmer grows wheat in a field", "The wheat is ground into flour at a mill", "A baker mixes the flour into dough and bakes bread", "A truck brings the bread to the shop", "A family buys the bread and eats it"],
      ["מחיטה ועד לחם על השולחן, לפי הסדר", "חקלאי מגדל חיטה בשדה", "טוחנים את החיטה לקמח בטחנה", "אופה לשה מהקמח בצק ואופה לחם", "משאית מביאה את הלחם לחנות", "משפחה קונה את הלחם ואוכלת אותו"]]],
  },
  i: {
    t: [
      ["Producer", "a person or business that makes goods or gives services to others", "יצרן", "אדם או עסק שמכינים מוצרים או נותנים שירותים לאחרים"],
      ["Consumer", "a person who uses goods or services for their own needs", "צרכן", "מי שמשתמש במוצרים או בשירותים לעצמו"],
      ["Need", "something you must have to live, such as food, water and a home", "צורך", "משהו שחייבים כדי לחיות, כמו אוכל, מים ובית"],
      ["Want", "something nice to have that you can live without, such as a toy", "רצון", "משהו שנעים שיהיה, אבל אפשר לחיות גם בלעדיו, כמו צעצוע"],
    ],
    q: [
      [["A bus driver takes children to school. What does the driver produce?", "A service: the ride to school", ["A good: the bus that the children sit in", "A good: the paper tickets", "Nothing, because driving is not real work"], "The driver does work for the passengers by taking them where they need to go, so the ride is a service. The bus is a tool the driver uses; it is not what the driver sells."],
        ["נהג אוטובוס מסיע ילדים לבית הספר. מה הנהג מייצר?", "שירות: הנסיעה לבית הספר", ["מוצר: האוטובוס שהילדים יושבים בו", "מוצר: כרטיסי הנייר", "שום דבר, כי נהיגה היא לא עבודה אמיתית"], "הנהג עושה עבודה בשביל הנוסעים כשהוא מביא אותם למקום שהם צריכים, ולכן הנסיעה היא שירות. האוטובוס הוא כלי שהנהג משתמש בו, ולא מה שהוא מוכר."]],
      [["A baker is a producer. When is she a consumer too?", "When she pays a plumber to fix a pipe in her bakery", ["When she bakes bread to sell in her own shop", "When she sells a cake to a customer", "When she opens her shop in the morning"], "Most working people are both. The baker produces bread, but when she pays for someone else's work or goods, like a plumber's repair, she is the consumer."],
        ["אופה היא יצרנית. מתי היא גם צרכנית?", "כשהיא משלמת לשרברב שיתקן צינור במאפייה", ["כשהיא אופה לחם כדי למכור בחנות שלה", "כשהיא מוכרת עוגה ללקוח", "כשהיא פותחת את החנות בבוקר"], "רוב האנשים שעובדים הם גם וגם. האופה מייצרת לחם, אבל כשהיא משלמת על עבודה או על מוצר של מישהו אחר, כמו תיקון של שרברב, היא הצרכנית."]],
      [["Which of these is a need rather than a want?", "Clean drinking water", ["A ticket to an amusement park", "A second pair of trendy trainers", "A new video game"], "People cannot live without clean water, so it is a need. A theme park, extra trainers and a video game are nice to have, but you can live without them: they are wants."],
        ["איזה מאלה הוא צורך ולא רצון?", "מי שתייה נקיים", ["כרטיס לפארק שעשועים", "זוג שני של נעלי ספורט אופנתיות", "משחק מחשב חדש"], "אי אפשר לחיות בלי מים נקיים, ולכן הם צורך. פארק שעשועים, נעליים נוספות ומשחק מחשב נעים שיהיו, אבל אפשר לחיות בלעדיהם: הם רצונות."]],
      [["What do you get when you pay for a service?", "Work done for you, like a repair or a lesson", ["An object that you can keep on a shelf forever", "Your money back from the person who did the work", "Nothing, because services are always free"], "A service is someone's work or skill. You do not take an object home, but something is done for you: a tap is fixed, a lesson is taught or a ride is given."],
        ["מה מקבלים כשמשלמים על שירות?", "עבודה שמישהו עושה בשבילכם, כמו תיקון או שיעור", ["חפץ שלוקחים איתכם הביתה ושאפשר לשמור על המדף לתמיד", "את הכסף בחזרה ממי שעשה את העבודה", "שום דבר, כי שירותים הם תמיד בחינם"], "שירות הוא עבודה או מיומנות של מישהו. לא לוקחים הביתה חפץ, אבל משהו נעשה בשבילכם: ברז מתוקן, שיעור נלמד או נסיעה מתבצעת."]],
      [["The only bakery in a small town closes for a month. Who is affected?", "The families who buy bread there, and the mill that sells it flour", ["Only the baker and her family, because nobody else in town is connected to a bakery", "Nobody, because bread appears in the shops by itself", "Only the people who live right next door to it"], "The bakery links many people: its customers lose their bread, and its suppliers, like the mill, lose a buyer. That is how people in a town depend on each other."],
        ["המאפייה היחידה בעיירה קטנה נסגרת לחודש. על מי זה משפיע?", "על המשפחות שקונות שם לחם, ועל הטחנה שמוכרת לה קמח", ["רק על האופה ועל המשפחה שלה, כי אף אחד אחר בעיירה לא קשור למאפייה", "על אף אחד, כי לחם מגיע לחנויות מעצמו", "רק על האנשים שגרים ממש לידה"], "המאפייה מחברת בין הרבה אנשים: הלקוחות שלה נשארים בלי לחם, והספקים שלה, כמו הטחנה, מאבדים קונה. כך אנשים ביישוב תלויים זה בזה."]],
      [["Which pair is one good and one service?", "A pair of shoes and a shoe repair", ["A pair of shoes and a pair of socks", "A shoe repair and a haircut", "A haircut and a bus ride"], "Shoes are a good you can touch; repairing shoes is work done for you, so it is a service. Shoes and socks are both goods, and the other pairs are both services."],
        ["איזה זוג הוא מוצר אחד ושירות אחד?", "זוג נעליים ותיקון נעליים", ["זוג נעליים וזוג גרביים חדשים", "תיקון נעליים ותספורת", "תספורת ונסיעה באוטובוס"], "נעליים הן מוצר שאפשר לגעת בו; תיקון נעליים הוא עבודה שעושים בשבילכם, ולכן הוא שירות. נעליים וגרביים הם שני מוצרים, ובשאר הזוגות יש שני שירותים."]],
    ],
    n: [[200, ["A town has 5 bakers. Each one bakes 40 loaves a day. How many loaves do they bake in a day altogether?", "", "5 bakers × 40 loaves = 200 loaves a day for the whole town."],
      ["בעיירה יש 5 אופים. כל אחד אופה 40 כיכרות לחם ביום. כמה כיכרות הם אופים ביחד ביום?", "", "5 אופים × 40 כיכרות = 200 כיכרות ביום לכל העיירה."]]],
  },
  a: {
    t: [
      ["Specialisation", "each person doing one kind of job well and trading for the rest", "התמחות", "מצב שבו כל אדם עושה סוג אחד של עבודה היטב ומקבל את השאר מאחרים בתמורה"],
      ["Interdependence", "people relying on one another to get the goods and services they need", "תלות הדדית", "מצב שבו אנשים זקוקים זה לזה כדי לקבל את המוצרים והשירותים שהם צריכים"],
      ["Raw material", "a natural thing, like wood or milk, that is used to make goods", "חומר גלם", "משהו מהטבע, כמו עץ או חלב, שמשתמשים בו כדי להכין מוצרים"],
      ["Public service", "work that a town or country does for everyone, paid for with taxes, like collecting rubbish", "שירות ציבורי", "עבודה שהעירייה או המדינה עושות למען כולם וממומנת ממסים, כמו פינוי אשפה"],
    ],
    q: [
      [["What is the raw material for a wooden table?", "Wood from trees", ["The carpenter's work", "The shop that sells the table", "The family that buys it"], "A raw material comes from nature and is turned into goods. The carpenter's work is what turns the wood into a table, the shop is the seller and the family is the consumer."],
        ["מהו חומר הגלם של שולחן עץ?", "עץ מהיער", ["העבודה של הנגר", "החנות שמוכרת את השולחן", "המשפחה שקונה אותו"], "חומר גלם מגיע מהטבע והופכים אותו למוצרים. העבודה של הנגר היא מה שהופך את העץ לשולחן, החנות היא המוכרת והמשפחה היא הצרכנית."]],
      [["Why is it usually better for a town to have a baker, a tailor and a builder than for every family to do all three jobs?", "Each person gets skilled at one job, so more and better work gets done", ["Because bakers, tailors and builders are not able to learn any other job at all", "Because then nobody in the town ever needs to buy anything", "Because one job is always more fun than three"], "This is specialisation: practice makes each worker faster and better at one job, and people trade with each other for everything else."],
        ["למה בדרך כלל עדיף שבעיירה יהיו אופה, חייט ובנאי, במקום שכל משפחה תעשה את שלוש העבודות?", "כל אחד נעשה מיומן בעבודה אחת, וכך נעשית יותר עבודה וטובה יותר", ["כי אופים, חייטים ובנאים לא מסוגלים ללמוד שום עבודה אחרת", "כי אז אף אחד בעיירה לא צריך לקנות שום דבר", "כי עבודה אחת תמיד כיפית יותר משלוש"], "זו התמחות: האימון הופך כל עובד למהיר וטוב יותר בעבודה אחת, והאנשים מחליפים ביניהם את כל השאר."]],
      [["Rubbish collection in a city is a public service. Who pays for it?", "Everyone, through taxes paid to the city", ["Only the rubbish collectors themselves", "Nobody: the rubbish trucks run for free", "Each family pays the driver in cash every day"], "The city collects taxes from its residents and uses that money to pay for services everyone shares, such as rubbish collection, street lights and parks."],
        ["פינוי האשפה בעיר הוא שירות ציבורי. מי משלם עליו?", "כל התושבים, דרך המסים שהם משלמים לעירייה", ["רק העובדים שמפנים את האשפה", "אף אחד: משאיות הזבל נוסעות בחינם", "כל משפחה משלמת לנהג המשאית במזומן בכל יום"], "העירייה גובה מסים מהתושבים ומשתמשת בכסף כדי לשלם על שירותים שכולם נהנים מהם, כמו פינוי אשפה, תאורת רחוב וגינות ציבוריות."]],
      [["A storm closes the only road into a village for a week. What problem will the village most likely have?", "Shops will run short of goods brought in from outside, like fresh milk", ["Prices in the village shops will fall because people buy less", "The village will suddenly have more goods than it needs", "Nothing will change, because every village makes all it needs"], "Most goods in a village shop come by truck from farms and factories elsewhere. Without the road, the village cannot get them, which shows how places depend on each other."],
        ["סערה חוסמת לשבוע את הכביש היחיד שמגיע לכפר. איזו בעיה סביר שתהיה בכפר?", "בחנויות ייגמרו מוצרים שמגיעים מבחוץ, כמו חלב טרי", ["המחירים בחנויות הכפר יירדו כי אנשים יקנו פחות", "פתאום יהיו בכפר יותר מוצרים ממה שצריך", "שום דבר לא ישתנה, כי כל כפר מכין את כל מה שהוא צריך"], "רוב המוצרים בחנות של כפר מגיעים במשאיות מחוות וממפעלים במקומות אחרים. בלי הכביש הכפר לא מקבל אותם, וזה מראה כמה מקומות תלויים זה בזה."]],
      [["A mechanic fixes a car and puts on a new tyre. What did the customer pay for?", "Both a good (the tyre) and a service (the repair work)", ["Only a good, because the tyre is the only thing left behind", "Only a service, because tyres are not goods", "Neither, because a repair is not something you buy"], "The tyre is a good you can touch, and the mechanic's time and skill are a service. Many bills, like a plumber's, include both."],
        ["מכונאית מתקנת מכונית ומרכיבה צמיג חדש. על מה הלקוח שילם?", "גם על מוצר (הצמיג) וגם על שירות (עבודת התיקון)", ["רק על מוצר, כי הצמיג הוא הדבר היחיד שנשאר", "רק על שירות, כי צמיגים הם לא מוצרים", "על שום דבר, כי תיקון הוא לא משהו שקונים"], "הצמיג הוא מוצר שאפשר לגעת בו, והזמן והמיומנות של המכונאית הם שירות. בחשבונות רבים, כמו של שרברב, יש את שניהם."]],
    ],
    n: [
      [30, ["A tailor sews 3 shirts a day and works 5 days a week. How many shirts does she sew in 2 weeks?", "", "In one week: 3 × 5 = 15 shirts. In two weeks: 15 × 2 = 30 shirts."],
        ["חייטת תופרת 3 חולצות ביום ועובדת 5 ימים בשבוע. כמה חולצות היא תופרת בשבועיים?", "", "בשבוע אחד: 3 × 5 = 15 חולצות. בשבועיים: 15 × 2 = 30 חולצות."]],
      [100, ["A bakery sells 50 rolls a day at 2 shekels each. How many shekels does it take in a day?", "₪", "50 rolls × 2 ₪ = 100 ₪ a day. That money pays for flour, the baker's work and the shop."],
        ["מאפייה מוכרת 50 לחמניות ביום, כל אחת ב־2 שקלים. כמה שקלים היא מקבלת ביום?", "₪", "50 לחמניות × 2 ₪ = 100 ₪ ביום. מהכסף הזה משלמים על הקמח, על עבודת האופה ועל החנות."]],
    ],
  },
};
export default c;
