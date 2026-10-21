import type { TopicContent } from "../types";

const c: TopicContent = {
  b: {
    t: [
      ["Capital city", "the city where a country's government has its main offices", "עיר בירה", "העיר שבה נמצאים משרדי הממשלה המרכזיים של המדינה"],
      ["Asia", "the largest continent in the world, home to Japan, India and China", "אסיה", "היבשת הגדולה ביותר בעולם, שבה נמצאות יפן, הודו וסין"],
      ["Africa", "the second-largest continent, south of Europe, home to Egypt, Kenya and Nigeria", "אפריקה", "היבשת השנייה בגודלה, מדרום לאירופה, שבה נמצאות מצרים, קניה וניגריה"],
      ["Sahara", "the largest hot desert in the world, in the north of Africa", "סהרה", "המדבר החם הגדול בעולם, בצפון אפריקה"],
    ],
    q: [
      [["What is the capital city of Japan?", "Tokyo", ["Beijing", "Seoul", "Bangkok"], "Tokyo is the capital of Japan. Beijing is the capital of China, Seoul of South Korea and Bangkok of Thailand."],
        ["מהי עיר הבירה של יפן?", "טוקיו", ["בייג׳ינג", "סיאול", "בנגקוק"], "טוקיו היא בירת יפן. בייג׳ינג היא בירת סין, סיאול היא בירת דרום קוריאה ובנגקוק היא בירת תאילנד."]],
      [["Which city is the capital of Egypt?", "Cairo", ["Alexandria", "Lagos", "Nairobi"], "Cairo, on the Nile, is the capital and the largest city of Egypt. Alexandria is a big port on the Mediterranean coast, Lagos is the largest city of Nigeria and Nairobi is the capital of Kenya."],
        ["איזו עיר היא בירת מצרים?", "קהיר", ["אלכסנדריה", "לאגוס", "ניירובי"], "קהיר, על גדות הנילוס, היא הבירה והעיר הגדולה ביותר של מצרים. אלכסנדריה היא נמל גדול בחוף הים התיכון, לאגוס היא העיר הגדולה ביותר בניגריה וניירובי היא בירת קניה."]],
      [["What is the capital of China?", "Beijing", ["Shanghai", "Hong Kong", "Tokyo"], "Beijing is the capital of China. Shanghai is a huge port city on China's east coast, and Tokyo is the capital of Japan."],
        ["מהי בירת סין?", "בייג׳ינג", ["שנגחאי", "הונג קונג", "טוקיו"], "בייג׳ינג היא בירת סין. שנגחאי היא עיר נמל ענקית בחוף המזרחי של סין, וטוקיו היא בירת יפן."]],
    ],
  },
  i: {
    t: [
      ["New Delhi", "the capital of India, which lies inside the huge city of Delhi", "ניו דלהי", "בירת הודו, ששוכנת בתוך העיר הענקית דלהי"],
      ["Nairobi", "the capital of Kenya, with a national park full of wild animals at the edge of the city", "ניירובי", "בירת קניה, שבקצה העיר יש פארק לאומי מלא חיות בר"],
      ["Bangkok", "the capital of Thailand, on the Chao Phraya River", "בנגקוק", "בירת תאילנד, על נהר צ׳או פראיה"],
      ["Amman", "the capital of Jordan, Israel's neighbour to the east", "עמאן", "בירת ירדן, השכנה של ישראל ממזרח"],
    ],
    q: [
      [["What is the capital of South Korea?", "Seoul", ["Pyongyang", "Busan", "Tokyo"], "Seoul is the capital of South Korea. Pyongyang is the capital of North Korea, and Busan is a big port city in South Korea."],
        ["מהי בירת דרום קוריאה?", "סיאול", ["פיונגיאנג", "בוסאן", "טוקיו"], "סיאול היא בירת דרום קוריאה. פיונגיאנג היא בירת צפון קוריאה, ובוסאן היא עיר נמל גדולה בדרום קוריאה."]],
      [["Which city is the capital of Turkey?", "Ankara", ["Istanbul", "Izmir", "Athens"], "Istanbul is Turkey's largest and best-known city, but the capital has been Ankara since 1923. Athens is the capital of Greece."],
        ["איזו עיר היא בירת טורקיה?", "אנקרה", ["איסטנבול", "איזמיר", "אתונה"], "איסטנבול היא העיר הגדולה והמוכרת ביותר בטורקיה, אבל הבירה היא אנקרה מאז 1923. אתונה היא בירת יוון."]],
      [["What is the capital of Saudi Arabia?", "Riyadh", ["Mecca", "Jeddah", "Dubai"], "Riyadh is the capital. Mecca is the holiest city of Islam, Jeddah is a port on the Red Sea, and Dubai is in the United Arab Emirates."],
        ["מהי בירת ערב הסעודית?", "ריאד", ["מכה", "ג׳דה", "דובאי"], "ריאד היא הבירה. מכה היא העיר הקדושה ביותר לאסלאם, ג׳דה היא נמל לחוף ים סוף, ודובאי נמצאת באיחוד האמירויות הערביות."]],
      [["Which city is the capital of Vietnam, although Ho Chi Minh City in the south is larger?", "Hanoi", ["Phnom Penh", "Bangkok", "Manila"], "Hanoi, in the north, is the capital of Vietnam. Phnom Penh is the capital of Cambodia, Bangkok of Thailand and Manila of the Philippines."],
        ["איזו עיר היא בירת וייטנאם, אף שהו צ׳י מין סיטי שבדרום גדולה ממנה?", "האנוי", ["פנום פן", "בנגקוק", "מנילה"], "האנוי, בצפון המדינה, היא בירת וייטנאם. פנום פן היא בירת קמבודיה, בנגקוק היא בירת תאילנד ומנילה היא בירת הפיליפינים."]],
    ],
    n: [[17, ["In winter, clocks in Tokyo are 7 hours ahead of clocks in Israel. When it is 10:00 in Tel Aviv, what hour is it in Tokyo?", "", "10 + 7 = 17, so it is 17:00 in Tokyo. In summer, when Israel moves its clocks an hour forward, the gap is only 6 hours."],
      ["בחורף השעון בטוקיו מקדים את השעון בישראל ב־7 שעות. כשהשעה בתל אביב 10:00, מה השעה בטוקיו?", "", "10 + 7 = 17, כלומר בטוקיו השעה 17:00. בקיץ, כשבישראל מקדימים את השעון בשעה, ההפרש הוא רק 6 שעות."]]],
    s: [[["Capitals from west to east", "Dakar (Senegal)", "Cairo (Egypt)", "New Delhi (India)", "Beijing (China)", "Tokyo (Japan)"],
      ["בירות ממערב למזרח", "דקאר (סנגל)", "קהיר (מצרים)", "ניו דלהי (הודו)", "בייג׳ינג (סין)", "טוקיו (יפן)"]]],
  },
  a: {
    t: [
      ["Abuja", "the capital of Nigeria since 1991, a planned city built in the middle of the country to replace Lagos", "אבוג׳ה", "בירת ניגריה מאז 1991, עיר מתוכננת שנבנתה במרכז המדינה במקום לאגוס"],
      ["Rabat", "the capital of Morocco, on the Atlantic coast, although Casablanca is its largest city", "רבאט", "בירת מרוקו, לחוף האוקיינוס האטלנטי, אף שקזבלנקה היא העיר הגדולה בה"],
      ["Addis Ababa", "the capital of Ethiopia, high in the mountains, where the African Union has its headquarters", "אדיס אבבה", "בירת אתיופיה, גבוה בהרים, שבה נמצא המטה של האיחוד האפריקאי"],
      ["Kyoto", "the old capital of Japan, home of the emperors for more than a thousand years until 1869", "קיוטו", "הבירה הישנה של יפן, מקום מושבם של הקיסרים יותר מאלף שנה, עד 1869"],
    ],
    q: [
      [["Which country has three capital cities: Pretoria, Cape Town and Bloemfontein?", "South Africa", ["Nigeria", "Kenya", "Egypt"], "In South Africa the government sits in Pretoria, parliament in Cape Town and an important court of appeal in Bloemfontein. Its largest city, Johannesburg, is not a capital at all."],
        ["לאיזו מדינה יש שלוש ערי בירה: פרטוריה, קייפטאון ובלומפונטיין?", "דרום אפריקה", ["ניגריה", "קניה", "מצרים"], "בדרום אפריקה הממשלה יושבת בפרטוריה, הפרלמנט בקייפטאון ובית משפט חשוב לערעורים בבלומפונטיין. העיר הגדולה בה, יוהנסבורג, אינה בירה בכלל."]],
      [["Mount Kilimanjaro, the highest mountain in Africa, is in Tanzania. What is Tanzania's official capital?", "Dodoma", ["Dar es Salaam", "Nairobi", "Kampala"], "Dar es Salaam is Tanzania's largest city and main port, but the official capital is Dodoma. Nairobi is the capital of Kenya and Kampala of Uganda."],
        ["הר הקילימנג׳רו, ההר הגבוה באפריקה, נמצא בטנזניה. מהי הבירה הרשמית של טנזניה?", "דודומה", ["דאר א־סלאם", "ניירובי", "קמפלה"], "דאר א־סלאם היא העיר הגדולה והנמל הראשי של טנזניה, אבל הבירה הרשמית היא דודומה. ניירובי היא בירת קניה וקמפלה היא בירת אוגנדה."]],
      [["Why did Nigeria move its capital from Lagos to Abuja?", "Lagos was crowded, and a new city in the centre of the country would be closer to all its regions", ["Lagos had been destroyed by a volcano", "Abuja is on the coast, so it is easier to reach by ship", "The president was born in Abuja"], "Lagos, on the coast, was overcrowded. Abuja was planned in the middle of the country, closer to its different regions and peoples, and became the capital in 1991."],
        ["למה ניגריה העבירה את הבירה שלה מלאגוס לאבוג׳ה?", "לאגוס הייתה צפופה, ועיר חדשה במרכז המדינה תהיה קרובה יותר לכל האזורים שלה", ["לאגוס נהרסה בהתפרצות של הר געש", "אבוג׳ה שוכנת לחוף הים, ולכן קל יותר להגיע אליה בספינה", "הנשיא נולד באבוג׳ה"], "לאגוס, שעל חוף הים, הייתה צפופה מאוד. אבוג׳ה תוכננה במרכז המדינה, קרוב יותר לאזורים ולעמים השונים שבה, והפכה לבירה ב־1991."]],
      [["Kathmandu, the capital of Nepal, lies in a valley close to which mountain range?", "The Himalayas", ["The Alps", "The Andes", "The Rocky Mountains"], "Nepal lies along the Himalayas, which include Mount Everest, the highest mountain on Earth. The Alps are in Europe, the Andes in South America and the Rocky Mountains in North America."],
        ["קטמנדו, בירת נפאל, שוכנת בעמק סמוך לאיזה רכס הרים?", "הרי ההימלאיה", ["הרי האלפים", "הרי האנדים", "הרי הרוקי"], "נפאל שוכנת לאורך ההימלאיה, שבהם נמצא האוורסט, ההר הגבוה ביותר על פני כדור הארץ. האלפים נמצאים באירופה, האנדים בדרום אמריקה והרי הרוקי בצפון אמריקה."]],
    ],
    n: [[54, ["How many countries in Africa are members of the United Nations?", "countries", "Africa has 54 UN member countries, more than any other continent."],
      ["כמה מדינות באפריקה חברות באו״ם?", "מדינות", "באפריקה יש 54 מדינות שחברות באו״ם, יותר מבכל יבשת אחרת."]]],
    s: [[["Capitals from north to south", "Tunis (Tunisia)", "Cairo (Egypt)", "Addis Ababa (Ethiopia)", "Nairobi (Kenya)", "Pretoria (South Africa)"],
      ["בירות מצפון לדרום", "תוניס (תוניסיה)", "קהיר (מצרים)", "אדיס אבבה (אתיופיה)", "ניירובי (קניה)", "פרטוריה (דרום אפריקה)"]]],
  },
};
export default c;
