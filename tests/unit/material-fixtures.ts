/**
 * Realistic and messy learner notes for the study-engine quality tests: pasted markdown, spreadsheets, vocabulary lists,
 * lecture prose, mixed Hebrew/English, emoji, duplicated lines. The clean sets of the balance corpus are used as well.
 */
export interface Fixture {
  id: string;
  lang: "he" | "en";
  subject: string;
  text: string;
}

export const MESSY: Fixture[] = [
  {
    id: "md-notes", lang: "en", subject: "The solar system",
    text: `# The solar system 🌞

## Inner planets
- **Mercury** - the smallest planet and the closest to the sun
- **Venus** - the hottest planet because of its thick atmosphere
- **Earth** - the only planet known to have life
- **Mars** - the red planet, with the tallest volcano in the solar system

## Facts
* The sun holds 99.8 percent of the mass of the solar system.
* Light from the sun takes about 8 minutes to reach Earth.
* Venus spins in the opposite direction to most planets.
* The surface of Mercury can reach 430 degrees Celsius during the day.

| Planet | Moons |
| --- | --- |
| Earth | 1 |
| Mars | 2 |
| Jupiter | 95 |`,
  },
  {
    id: "he-bullets", lang: "he", subject: "מערכת העיכול",
    text: `מערכת העיכול

• פה – המקום שבו מתחיל העיכול והמזון נלעס
• ושט – צינור שמוביל את המזון מהפה אל הקיבה
• קיבה – שק שרירי שבו המזון מתערבב עם חומצה
• מעי דק – שם נספגים רוב חומרי המזון אל הדם
• מעי גס – סופג מים מהפסולת שנשארה

אורך המעי הדק אצל אדם בוגר הוא כ-6 מטרים.
העיכול בקיבה נמשך בין שעתיים לארבע שעות.
הכבד מייצר מרה שעוזרת לפרק שומנים.
בלוטות הרוק מפרישות אנזים שמתחיל לפרק עמילן כבר בפה.`,
  },
  {
    id: "mixed-he-en", lang: "he", subject: "מבוא לאינטרנט",
    text: `HTML: שפה שמתארת את המבנה של דף אינטרנט.
CSS: שפה שמעצבת את המראה של דף אינטרנט.
JavaScript: שפת תכנות שגורמת לדף להגיב ללחיצות.
HTTP: הפרוטוקול שבו הדפדפן מבקש דפים מהשרת.
DNS: שירות שמתרגם שם של אתר לכתובת מספרית.

כשמקלידים כתובת בדפדפן קורים כמה דברים:
1. הדפדפן שואל את ה-DNS מהי הכתובת של האתר.
2. הדפדפן שולח בקשת HTTP לשרת.
3. השרת שולח בחזרה קובץ HTML.
4. הדפדפן מציג את הדף למשתמש.

האינטרנט נולד בסוף שנות ה-60 תחת השם ARPANET.
הדפדפן הראשון נוצר בשנת 1990.`,
  },
  {
    id: "dates-numbers", lang: "en", subject: "World War II",
    text: `World War II began in 1939 when Germany invaded Poland.
The war in Europe ended in May 1945 after the surrender of Germany.
More than 70 million people died, around 3 percent of the world population.
The temperature at Stalingrad fell to -30 degrees Celsius in the winter of 1942.
The D-Day landings in Normandy took place on 6 June 1944.
The United Nations was founded in 1945 to keep peace between countries.
Winston Churchill was the prime minister of Britain for most of the war.
The Allies included Britain, the Soviet Union and the United States.
The Manhattan Project built the first atomic bombs in about 3 years.`,
  },
  {
    id: "article", lang: "en", subject: "Coral reefs",
    text: `Coral reefs are underwater structures made from the skeletons of tiny animals called polyps. They cover less than one percent of the ocean floor, yet they support about a quarter of all marine species. Reefs grow best in warm, shallow and clear water, where sunlight can reach the algae that live inside the coral. These algae give the coral its colour and supply most of its food through photosynthesis. When the water becomes too warm, the coral expels the algae and turns white, a process known as bleaching. A bleached reef is not dead, but it is starving and can die if the heat continues. Reefs also protect coastlines because they absorb up to 97 percent of the energy of waves. Fishing communities depend on reefs for food and income, and divers bring tourism to many tropical countries. Pollution from farms and cities makes it harder for the coral to recover. Scientists plant young coral on damaged reefs to help them grow back. The Great Barrier Reef in Australia is the largest reef system in the world and can be seen from space.`,
  },
  {
    id: "vocab", lang: "en", subject: "Spanish basics",
    text: `hola = hello
adiós = goodbye
gracias = thank you
por favor = please
agua = water
casa = house
perro = dog
gato = cat
libro = book
escuela = school`,
  },
  {
    id: "he-vocab", lang: "he", subject: "אנגלית בסיסית",
    text: `apple - תפוח
water - מים
house - בית
book - ספר
school - בית ספר
teacher - מורה
friend - חבר
family - משפחה`,
  },
  {
    id: "dupes", lang: "en", subject: "Bees",
    text: `${"Bees make honey from nectar.\n".repeat(30)}Queen: the only bee in the hive that lays eggs.
Queen: the only bee in the hive that lays eggs.
Worker: a female bee that collects nectar and builds the comb.
Drone: a male bee whose job is to mate with the queen.
Hive: the home of a honey bee colony.
A colony can hold up to 50000 bees in summer.
${"Bees make honey from nectar.\n".repeat(10)}`,
  },
  {
    id: "emoji", lang: "en", subject: "Healthy habits",
    text: `💧 Water: the body needs about 8 glasses of water every day to stay hydrated 💧
😴 Sleep: children aged 6 to 12 need between 9 and 12 hours of sleep every night
🥦 Vegetables: they give the body vitamins and fibre that help digestion
🏃 Exercise: moving for 60 minutes a day keeps the heart and muscles strong
Wash your hands with soap for at least 20 seconds before you eat.`,
  },
  {
    id: "lecture", lang: "en", subject: "Photosynthesis",
    text: `Dr. Levi's lecture notes - e.g. what plants need.
Photosynthesis is the process in which plants use sunlight, water and carbon dioxide to make sugar and oxygen.
Chlorophyll is the green pigment in leaves that absorbs sunlight.
Stomata are tiny openings in the leaf, i.e. the places where gases enter and leave.
Roots take in water and minerals from the soil, etc.
The sugar the plant makes is stored as starch in the roots and seeds.
Without light a plant cannot make sugar, so it slowly starves.
Plants release about 21 percent of the oxygen in the air.`,
  },
  {
    id: "one-line", lang: "en", subject: "Gravity",
    text: `Gravity is the force that pulls objects toward each other and it is the reason that things fall to the ground and that the moon stays in orbit around the earth and that the earth stays in orbit around the sun and that tides rise and fall each day along the coast`,
  },
  {
    id: "he-article", lang: "he", subject: "הדבורים",
    text: `דבורי הדבש חיות בכוורות גדולות שבהן יכולות להיות עד חמישים אלף דבורים בקיץ. בכל כוורת יש מלכה אחת שמטילה את כל הביצים. הדבורים הפועלות אוספות צוף מפרחים והופכות אותו לדבש בתוך הכוורת. הדבורים מעבירות זו לזו מידע על מקום הפרחים בעזרת ריקוד מיוחד. בחורף הפועלות מתגודדות סביב המלכה כדי לשמור עליה חמימה. כוורת בריאה מייצרת יותר דבש ממה שהדבורים צריכות לעצמן. הדבורה מבקרת באלפי פרחים ביום אחד. בזכות הדבורים צומחים פירות וירקות רבים כי הן מעבירות אבקה מפרח לפרח.`,
  },
  {
    id: "qa-mixed", lang: "en", subject: "Geography quiz",
    text: `What is the longest river in Africa?
The Nile
What is the largest ocean on Earth?
The Pacific Ocean
Which continent is the Sahara desert in?
Africa
How many oceans are there on Earth? 5
What is the tallest mountain in the world?
Mount Everest
What is the smallest country in the world?
Vatican City`,
  },
];
