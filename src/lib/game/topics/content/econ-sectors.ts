import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Primary sector", "the part of the economy that takes raw materials from nature, like farming, fishing and mining", "המגזר הראשוני", "החלק בכלכלה שמפיק חומרי גלם מהטבע, כמו חקלאות, דיג וכרייה"],
      ["Secondary sector", "the part of the economy that turns raw materials into products, in factories and in construction", "המגזר המשני", "החלק בכלכלה שהופך חומרי גלם למוצרים, במפעלים ובבנייה"],
      ["Tertiary sector", "the part of the economy that provides services, like shops, schools, hospitals and banks", "המגזר השלישוני", "החלק בכלכלה שמספק שירותים, כמו חנויות, בתי ספר, בתי חולים ובנקים"],
      ["Raw material", "a natural substance used to make products, like wood, cotton or iron ore", "חומר גלם", "חומר מהטבע שמשמש לייצור מוצרים, כמו עץ, כותנה או עפרת ברזל"],
    ],
    q: [
      [["A fisherman catches fish at sea. Which sector does he work in?", "Primary", ["Secondary", "Tertiary", "None of them"], "Fishing takes food straight from nature, just like farming, mining and forestry, so it belongs to the primary sector."],
        ["דייג תופס דגים בים. באיזה מגזר הוא עובד?", "הראשוני", ["המשני", "השלישוני", "באף אחד מהם"], "דיג מפיק מזון ישירות מהטבע, בדיוק כמו חקלאות, כרייה וכריתת עצים, ולכן הוא שייך למגזר הראשוני."]],
      [["A worker in a car factory works in which sector?", "Secondary", ["Primary", "Tertiary", "None of them"], "A factory turns materials such as steel, glass and rubber into a finished product, which is the work of the secondary sector."],
        ["עובד במפעל מכוניות עובד באיזה מגזר?", "המשני", ["הראשוני", "השלישוני", "באף אחד מהם"], "מפעל הופך חומרים כמו פלדה, זכוכית וגומי למוצר מוגמר, וזו העבודה של המגזר המשני."]],
      [["Which job belongs to the tertiary sector?", "A dentist", ["A furniture maker", "A coal miner", "A wheat farmer"], "A dentist provides a service and makes no physical product. A furniture maker is in the secondary sector, and a miner and a farmer are in the primary sector."],
        ["איזו עבודה שייכת למגזר השלישוני?", "רופאת שיניים", ["נגר שמייצר רהיטים", "כורה פחם", "חקלאי שמגדל חיטה"], "רופאת שיניים נותנת שירות ולא מייצרת מוצר. נגר שייך למגזר המשני, וכורה וחקלאי שייכים למגזר הראשוני."]],
      [["A builder putting up a new house is part of which sector?", "Secondary", ["Tertiary", "Primary", "None of them"], "Construction makes something new and solid from materials such as concrete and steel, so it is counted in the secondary sector, together with factories."],
        ["פועל בניין שבונה בית חדש שייך לאיזה מגזר?", "המשני", ["השלישוני", "הראשוני", "לאף אחד מהם"], "בנייה יוצרת משהו חדש וממשי מחומרים כמו בטון ופלדה, ולכן היא נחשבת חלק מהמגזר המשני, יחד עם המפעלים."]],
      [["Which sector employs most workers in rich countries today?", "Tertiary (services)", ["Secondary (factories)", "Primary (farming)", "All three equally"], "In high-income countries most people work in services such as health, education, shops, transport and finance, while machines do much of the farming and factory work."],
        ["איזה מגזר מעסיק את רוב העובדים במדינות עשירות היום?", "השלישוני (שירותים)", ["המשני (מפעלים)", "הראשוני (חקלאות)", "שלושתם באותה מידה"], "במדינות עשירות רוב האנשים עובדים בשירותים כמו בריאות, חינוך, מסחר, תחבורה ופיננסים, ואילו מכונות עושות חלק גדול מעבודת החקלאות והמפעלים."]],
    ],
    n: [
      [60, ["A town has 100 workers: 10 farm, 30 work in factories and the rest work in services. How many work in services?", "workers", "Subtract the other two sectors from the total: 100 − 10 − 30 = 60 workers in services."],
        ["בעיירה יש 100 עובדים: 10 חקלאים, 30 עובדים במפעלים ושאר העובדים בשירותים. כמה עובדים בשירותים?", "עובדים", "מורידים מהסך את שני המגזרים האחרים: 100 − 10 − 30 = 60 עובדים בשירותים."]],
    ],
    s: [
      [["From cotton field to T-shirt", "A farmer grows and picks cotton", "A factory spins the cotton into thread and weaves cloth", "Workers sew the cloth into T-shirts", "A shop sells the T-shirts to customers"],
        ["משדה הכותנה ועד החולצה", "חקלאי מגדל וקוטף כותנה", "מפעל טווה את הכותנה לחוטים ואורג בד", "עובדים תופרים מהבד חולצות", "חנות מוכרת את החולצות ללקוחות"]],
    ],
  },
  i: {
    t: [
      ["Quaternary sector", "the part of the economy based on knowledge and information, like research and software development", "המגזר הרבעוני", "החלק בכלכלה שמבוסס על ידע ומידע, כמו מחקר ופיתוח תוכנה"],
      ["Industrialisation", "the shift of an economy from farming towards factories and manufacturing", "תיעוש", "המעבר של כלכלה מחקלאות לעבר מפעלים וייצור בהיקף גדול"],
      ["Deindustrialisation", "the fall in the share of factory jobs as an economy moves towards services", "דה־תיעוש", "הירידה בחלקן של משרות המפעלים כשהכלכלה עוברת לשירותים"],
      ["Industrial Revolution", "the change to machine and factory production that began in Britain in the second half of the 1700s", "המהפכה התעשייתית", "המעבר לייצור במכונות ובמפעלים, שהחל בבריטניה במחצית השנייה של המאה ה־18"],
    ],
    q: [
      [["Wheat is grown, ground into flour and baked into bread that a café sells. Which step is in the secondary sector?", "Grinding the wheat into flour", ["Delivering the bread to the café", "Growing the wheat", "Selling the bread in the café"], "Milling turns a raw material into a new product, which is secondary. Growing wheat is primary, and delivering and selling are services."],
        ["מגדלים חיטה, טוחנים אותה לקמח ואופים ממנו לחם שבית קפה מוכר. איזה שלב שייך למגזר המשני?", "טחינת החיטה לקמח", ["הובלת הלחם לבית הקפה", "גידול החיטה", "מכירת הלחם בבית הקפה"], "טחינה הופכת חומר גלם למוצר חדש, וזה המגזר המשני. גידול החיטה שייך למגזר הראשוני, והובלה ומכירה הן שירותים."]],
      [["Why did the share of farm workers fall in many countries over the last 200 years?", "Machines let fewer farmers grow more food", ["People began to eat much less food than before", "Farming was banned in most of these countries", "Almost all farmland turned into desert"], "Tractors, fertilisers and better seeds raised the output of each farmer, so far fewer people were needed on farms and many moved to factories and services."],
        ["למה ירד חלקם של העובדים בחקלאות במדינות רבות במהלך 200 השנים האחרונות?", "מכונות אפשרו לפחות חקלאים לגדל יותר מזון", ["אנשים התחילו לאכול הרבה פחות מזון מבעבר", "החקלאות נאסרה ברוב המדינות האלה", "כמעט כל השטחים החקלאיים הפכו למדבר"], "טרקטורים, דשנים וזרעים משופרים הגדילו את התוצרת של כל חקלאי, ולכן נדרשו הרבה פחות אנשים בחקלאות ורבים עברו למפעלים ולשירותים."]],
      [["During the Industrial Revolution, many workers moved from…", "Farms in the countryside to factories in towns", ["Factories in towns to offices in big cities", "Towns to farms in the countryside, to grow food", "Shops and markets to coal mines under the sea"], "New factories and mills needed many workers, so people left village farms for growing industrial towns."],
        ["בזמן המהפכה התעשייתית, עובדים רבים עברו…", "מחוות בכפר למפעלים בערים", ["ממפעלים בערים למשרדים בכרכים גדולים", "מהערים לחוות בכפר, כדי לגדל מזון", "מחנויות ומשווקים למכרות פחם מתחת לים"], "מפעלים וטחנות חדשים היו צריכים עובדים רבים, ולכן אנשים עזבו את החוות בכפרים ועברו לערי התעשייה שגדלו."]],
      [["A country mostly sells raw materials like copper and coffee beans. What could help it earn more from them?", "Processing them at home into finished goods", ["Selling the same amount abroad at a lower price", "Stopping all mining and farming", "Buying back the raw materials it sold"], "Raw materials fetch low prices, while turning them into products such as wire or roasted coffee adds value and creates factory jobs at home."],
        ["מדינה מוכרת בעיקר חומרי גלם כמו נחושת ופולי קפה. מה יכול לעזור לה להרוויח מהם יותר?", "לעבד אותם בבית למוצרים מוגמרים", ["למכור לחו״ל את אותה כמות במחיר נמוך יותר", "להפסיק כל כרייה וחקלאות", "לקנות בחזרה את חומרי הגלם שמכרה"], "חומרי גלם נמכרים במחירים נמוכים, ואילו הפיכתם למוצרים כמו חוטי חשמל או קפה קלוי מוסיפה ערך ויוצרת משרות במפעלים בתוך המדינה."]],
      [["Which job is the best example of the quaternary sector?", "A scientist doing research on new medicines", ["A worker who packs medicines on a factory line", "A pharmacist selling medicines", "A farmer growing medicinal herbs"], "The quaternary sector is about creating knowledge, such as research. Packing is secondary, selling in a pharmacy is tertiary and growing herbs is primary."],
        ["איזו עבודה היא הדוגמה הטובה ביותר למגזר הרבעוני?", "מדענית שחוקרת תרופות חדשות", ["עובד שאורז תרופות בפס ייצור במפעל", "רוקח שמוכר תרופות", "חקלאי שמגדל צמחי מרפא"], "המגזר הרבעוני עוסק ביצירת ידע, כמו מחקר. אריזה שייכת למגזר המשני, מכירה בבית מרקחת לשלישוני וגידול צמחים לראשוני."]],
    ],
    n: [
      [80, ["In a country, 2% of workers are in the primary sector and 18% in the secondary. What percent work in the tertiary and quaternary sectors together?", "%", "All workers make 100%, so the rest is 100 − 2 − 18 = 80%, a typical picture for a rich country."],
        ["במדינה מסוימת 2% מהעובדים נמצאים במגזר הראשוני ו־18% במשני. כמה אחוזים עובדים במגזר השלישוני וברבעוני יחד?", "%", "כל העובדים הם 100%, ולכן השאר הוא 100 − 2 − 18 = 80%, תמונה טיפוסית למדינה עשירה."]],
    ],
  },
  a: {
    t: [
      ["Clark–Fisher model", "the idea that as countries develop, jobs move from the primary to the secondary and then to the tertiary sector", "מודל קלארק־פישר", "הרעיון שככל שמדינות מתפתחות, המשרות עוברות מהמגזר הראשוני למשני ואחר כך לשלישוני"],
      ["Outsourcing", "a firm paying another firm, often abroad, to do part of its work", "מיקור חוץ", "תשלום של חברה לחברה אחרת, לעיתים בחו״ל, כדי שתבצע חלק מעבודתה"],
      ["Value added", "the extra worth created at one stage of production: the price of the output minus the cost of the inputs", "ערך מוסף", "השווי הנוסף שנוצר בשלב ייצור אחד: מחיר התוצר פחות עלות התשומות"],
      ["Subsistence farming", "growing food mainly to feed your own family rather than to sell", "חקלאות לקיום עצמי", "גידול מזון בעיקר כדי להאכיל את המשפחה ולא כדי למכור"],
    ],
    q: [
      [["Factory jobs fall in a rich country while factory output stays the same. What is the most likely reason?", "Machines and robots now do much of the work", ["The factories now make far fewer goods than before", "Workers have all moved into farming", "Output always falls when jobs fall"], "If output holds steady with fewer workers, each worker produces more, usually thanks to automation. Fewer goods would contradict the steady output."],
        ["משרות המפעלים במדינה עשירה יורדות, אבל התפוקה של המפעלים נשארת אותו דבר. מה הסיבה הסבירה ביותר?", "מכונות ורובוטים עושים היום חלק גדול מהעבודה", ["המפעלים מייצרים היום הרבה פחות מוצרים מבעבר", "כל העובדים עברו לחקלאות", "התפוקה תמיד יורדת כשהמשרות יורדות"], "אם התפוקה נשמרת עם פחות עובדים, כל עובד מייצר יותר, בדרך כלל בזכות אוטומציה. ייצור של פחות מוצרים היה סותר את התפוקה הקבועה."]],
      [["According to the Clark–Fisher model, which country is most likely to have most of its workers in farming?", "A low-income country with little industry", ["A rich country where most people work in offices", "A country with large car factories", "A country famous for its banks"], "The model links development to a shift out of the primary sector: the poorer and less industrial a country is, the larger the share of people who farm."],
        ["לפי מודל קלארק־פישר, באיזו מדינה הכי סביר שרוב העובדים עוסקים בחקלאות?", "מדינה ענייה עם מעט תעשייה", ["מדינה עשירה שבה רוב האנשים עובדים במשרדים", "מדינה עם מפעלי מכוניות גדולים", "מדינה שמפורסמת בבנקים שלה"], "המודל קושר פיתוח למעבר מהמגזר הראשוני: ככל שמדינה ענייה יותר ופחות מתועשת, כך גדל חלקם של האנשים שעוסקים בחקלאות."]],
      [["Why can deindustrialisation cause hardship in some towns even when the whole country grows richer?", "New jobs may be elsewhere or need different skills", ["Service jobs are not counted as real work in a town", "Factories reopen in the same place every few years", "Richer countries stop paying any wages at all"], "When a factory town loses its main employer, the new service jobs often appear in other cities or need training the former workers lack, so some places decline while the country grows."],
        ["למה דה־תיעוש יכול לגרום למצוקה בחלק מהערים גם כשהמדינה כולה מתעשרת?", "המשרות החדשות עשויות להיות במקום אחר או לדרוש כישורים אחרים", ["משרות בשירותים לא נחשבות לעבודה אמיתית בעיר", "המפעלים נפתחים מחדש באותו מקום כל כמה שנים", "מדינות עשירות מפסיקות לשלם שכר בכלל"], "כשעיר תעשייה מאבדת את המעסיק העיקרי שלה, משרות השירותים החדשות קמות לעיתים קרובות בערים אחרות או דורשות הכשרה שאין לעובדים לשעבר, ולכן מקומות מסוימים נחלשים בזמן שהמדינה צומחת."]],
      [["Why does the tertiary sector's share often keep rising as people get richer?", "Richer people spend more on services like travel and health", ["Richer people stop buying any goods made in factories", "Services do not need any workers, so they grow by themselves", "The government forbids new factories once a country is rich"], "Once basic needs for food and goods are met, extra income goes increasingly to services such as restaurants, holidays, education and health care, so service jobs grow."],
        ["למה חלקו של המגזר השלישוני ממשיך לעיתים קרובות לגדול ככל שאנשים מתעשרים?", "אנשים עשירים יותר מוציאים יותר על שירותים כמו טיולים ובריאות", ["אנשים עשירים מפסיקים לקנות מוצרים שמיוצרים במפעלים", "שירותים לא צריכים עובדים, ולכן הם גדלים מעצמם", "הממשלה אוסרת מפעלים חדשים כשמדינה מתעשרת"], "אחרי שהצרכים הבסיסיים של מזון ומוצרים מסופקים, ההכנסה הנוספת הולכת יותר ויותר לשירותים כמו מסעדות, חופשות, חינוך ובריאות, ולכן המשרות בשירותים מתרבות."]],
    ],
    n: [
      [250, ["A miller buys wheat for 200 ₪ and sells flour for 350 ₪. A baker turns the flour into bread sold for 600 ₪. What is the baker's value added?", "₪", "The baker's value added is the price of the bread minus the cost of the flour: 600 − 350 = 250 ₪. (The miller added 350 − 200 = 150 ₪.)"],
        ["טוחן קונה חיטה ב־200 ₪ ומוכר קמח ב־350 ₪. אופה הופך את הקמח ללחם שנמכר ב־600 ₪. מהו הערך המוסף של האופה?", "₪", "הערך המוסף של האופה הוא מחיר הלחם פחות עלות הקמח: 600 − 350 = 250 ₪. (הטוחן הוסיף 350 − 200 = 150 ₪.)"]],
    ],
    s: [
      [["How a country's jobs typically shift as it develops", "Most people farm to feed their families", "Factories grow and many people move to towns", "Services become the largest source of jobs", "Knowledge and research jobs grow fast"],
        ["איך משתנות המשרות במדינה בדרך כלל ככל שהיא מתפתחת", "רוב האנשים עובדים בחקלאות כדי להאכיל את משפחתם", "המפעלים גדלים ואנשים רבים עוברים לערים", "השירותים הופכים למקור המשרות הגדול ביותר", "משרות הידע והמחקר גדלות במהירות"]],
    ],
  },
};
export default c;
