/**
 * Ready-made notes that show every format the study engine understands (term: meaning, steps, Q/A, numbers,
 * sentences). Each example exists in Hebrew and English; the create screen offers them as buttons that fill the form.
 * The first one (the water cycle) is the default example, also opened by `#/create?example=1`.
 */
export interface ExampleNotes { subject: string; notes: string }
export interface ExampleDef { id: string; he: ExampleNotes; en: ExampleNotes }

export const EXAMPLES: readonly ExampleDef[] = [
  {
    id: "water",
    he: {
      subject: "מחזור המים",
      notes: `אידוי: מים הופכים לאדים בגלל חום השמש.
עיבוי: אדי מים מתקררים והופכים לטיפות זעירות שיוצרות עננים.
משקעים: מים שיורדים מהעננים כגשם, שלג או ברד.
חלחול: מים שנספגים באדמה ומגיעים למי התהום.

שלבי מחזור המים:
1. השמש מחממת את מי הים.
2. המים מתאדים ועולים למעלה.
3. האדים מתקררים ויוצרים עננים.
4. המים יורדים כגשם וחוזרים לים.

ש: מה מניע את מחזור המים?
ת: האנרגיה של השמש.

כ־97 אחוז מהמים בכדור הארץ נמצאים באוקיינוסים.
עננים נוצרים כשאדי מים מתקררים בגובה.`,
    },
    en: {
      subject: "The water cycle",
      notes: `Evaporation: water turns into vapour because of the sun's heat.
Condensation: water vapour cools down and forms tiny droplets that make clouds.
Precipitation: water that falls from clouds as rain, snow or hail.
Infiltration: water that soaks into the ground and reaches groundwater.

Steps of the water cycle:
1. The sun heats the sea.
2. The water evaporates and rises.
3. The vapour cools and forms clouds.
4. The water falls as rain and returns to the sea.

Q: What powers the water cycle?
A: The energy of the sun.

About 97 percent of the water on Earth is in the oceans.
Clouds form when water vapour cools high in the air.`,
    },
  },
  {
    id: "fractions",
    he: {
      subject: "שברים",
      notes: `מונה: המספר העליון בשבר. הוא אומר כמה חלקים לקחנו.
מכנה: המספר התחתון בשבר. הוא אומר לכמה חלקים שווים חילקנו את השלם.
שבר פשוט: שבר שבו המונה קטן מהמכנה.
שברים שקולים: שברים שונים שמייצגים את אותה כמות.

שלבי חיבור שברים עם מכנה זהה:
1. בודקים שהמכנים זהים.
2. מחברים את המונים.
3. משאירים את המכנה כמו שהוא.
4. מצמצמים את התוצאה אם אפשר.

ש: כמה הם רבע ועוד רבע?
ת: חצי.

פיצה שחולקה ל־8 משולשים שווים מורכבת מ־8 שמיניות.
חצי שווה לשני רבעים.`,
    },
    en: {
      subject: "Fractions",
      notes: `Numerator: the top number of a fraction. It says how many parts we took.
Denominator: the bottom number of a fraction. It says how many equal parts the whole was divided into.
Proper fraction: a fraction whose numerator is smaller than its denominator.
Equivalent fractions: different fractions that show the same amount.

Steps to add fractions with the same denominator:
1. Check that the denominators are the same.
2. Add the numerators.
3. Keep the denominator as it is.
4. Simplify the result if you can.

Q: What is a quarter plus a quarter?
A: A half.

A pizza cut into 8 equal slices is made of 8 eighths.
One half is equal to two quarters.`,
    },
  },
  {
    id: "planets",
    he: {
      subject: "מערכת השמש",
      notes: `שמש: הכוכב במרכז מערכת השמש, והיא נותנת לנו אור וחום.
כוכב לכת: גוף גדול שמקיף כוכב ואינו זוהר בעצמו.
ירח: גוף שמקיף כוכב לכת.
מסלול: הדרך שבה גוף בחלל מקיף גוף אחר.

סדר הכוכבים הראשונים מהשמש החוצה:
1. חמה היא הקרובה ביותר לשמש.
2. נוגה באה אחריה.
3. כדור הארץ הוא הכוכב השלישי.
4. מאדים הוא הכוכב האדום.

ש: איזה כוכב לכת הוא הגדול ביותר?
ת: צדק.

במערכת השמש יש 8 כוכבי לכת.
כדור הארץ משלים הקפה אחת סביב השמש בכ־365 ימים.
מאדים נראה אדום בגלל צבע האדמה שלו.`,
    },
    en: {
      subject: "The solar system",
      notes: `Sun: the star at the centre of the solar system. It gives us light and heat.
Planet: a large object that circles a star and does not shine by itself.
Moon: an object that circles a planet.
Orbit: the path an object in space takes around another object.

The first planets, going outwards from the Sun:
1. Mercury is the closest to the Sun.
2. Venus comes after it.
3. Earth is the third planet.
4. Mars is the red planet.

Q: Which planet is the biggest?
A: Jupiter.

There are 8 planets in the solar system.
Earth makes one trip around the Sun in about 365 days.
Mars looks red because of the colour of its soil.`,
    },
  },
  {
    id: "digestion",
    he: {
      subject: "מערכת העיכול",
      notes: `ושט: צינור שמעביר את האוכל מהפה אל הקיבה.
קיבה: איבר שבו האוכל מתערבב עם חומצות ומתפרק.
מעי דק: איבר שבו חומרי המזון נספגים אל הדם.
רוק: נוזל בפה שמתחיל לפרק את האוכל.

הדרך של האוכל בגוף:
1. הפה לועס את האוכל ומערבב אותו ברוק.
2. הושט מעביר את האוכל אל הקיבה.
3. הקיבה מפרקת את האוכל.
4. המעי הדק סופג את חומרי המזון אל הדם.

ש: איפה חומרי המזון נספגים אל הדם?
ת: במעי הדק.

אצל מבוגר המעי הדק אורכו כ־6 מטרים.
לועסים היטב כדי שהקיבה תעבוד פחות קשה.`,
    },
    en: {
      subject: "The digestive system",
      notes: `Oesophagus: the tube that carries food from the mouth to the stomach.
Stomach: the organ where food mixes with acid and breaks down.
Small intestine: the organ where nutrients pass into the blood.
Saliva: the liquid in the mouth that starts to break food down.

The journey of food through the body:
1. The mouth chews the food and mixes it with saliva.
2. The oesophagus carries the food to the stomach.
3. The stomach breaks the food down.
4. The small intestine passes the nutrients into the blood.

Q: Where do nutrients pass into the blood?
A: In the small intestine.

In an adult the small intestine is about 6 metres long.
We chew well so that the stomach has less work to do.`,
    },
  },
];

/** The default example (the water cycle): what `#/create?example=1` fills in. */
export const EXAMPLE_NOTES: Record<"he" | "en", ExampleNotes> = { he: EXAMPLES[0]!.he, en: EXAMPLES[0]!.en };

export const exampleById = (id: string): ExampleDef | undefined => EXAMPLES.find((e) => e.id === id);

/** True when the text is exactly one of the examples (in either language): used to avoid treating it as the learner's own work. */
export function isExampleText(subject: string, notes: string): boolean {
  return EXAMPLES.some((e) => (e.he.subject === subject && e.he.notes === notes) || (e.en.subject === subject && e.en.notes === notes));
}
