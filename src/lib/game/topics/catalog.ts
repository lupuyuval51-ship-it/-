/**
 * The topic library's catalogue: what the picker shows (id, titles, one-line descriptions, category, ages). It is
 * small and may sit in the first chunk; the content of a topic is a separate module loaded only when it is picked
 * (`loaders.ts`). Every id listed here has content for all three levels — tests enforce it, and nothing is listed
 * before its content exists.
 */
import type { Difficulty } from "../spec/constants";
import { TOPIC_CATEGORIES, type TopicCategory, type TopicEntry } from "./types";

export { TOPIC_CATEGORIES, type TopicCategory, type TopicEntry };

export const TOPICS: readonly TopicEntry[] = [
  // ── math
  { id: "math-fractions", cat: "math", ages: [8, 13], en: ["Fractions", "Parts of a whole: numerators, denominators, equivalent fractions and fraction arithmetic."], he: ["שברים", "חלקים של שלם: מונה, מכנה, שברים שקולים וחשבון בשברים."] },
  { id: "math-percentages", cat: "math", ages: [10, 15], en: ["Percentages", "Percent as parts of a hundred, discounts, increases and reverse percentages."], he: ["אחוזים", "אחוז כחלק ממאה, הנחות, עליות ומציאת הכמות המקורית."] },
  { id: "math-equations", cat: "math", ages: [10, 15], en: ["Solving equations", "Unknowns, inverse operations, like terms, brackets and equations with no or many solutions."], he: ["פתרון משוואות", "נעלמים, פעולות הפוכות, כינוס איברים דומים, סוגריים ומשוואות בלי פתרון או עם אינסוף פתרונות."] },
  { id: "math-angles", cat: "math", ages: [8, 15], en: ["Angles", "Kinds of angles, angles on a line and at a point, triangles, parallel lines and polygons."], he: ["זוויות", "סוגי זוויות, זוויות צמודות וקודקודיות, משולשים, ישרים מקבילים ומצולעים."] },
  { id: "math-probability", cat: "math", ages: [9, 16], en: ["Probability", "Chance from impossible to certain, simple events, complements, independent events and expected value."], he: ["הסתברות", "סיכוי מבלתי אפשרי ועד ודאי, מאורעות פשוטים, מאורע משלים, מאורעות בלתי תלויים ותוחלת."] },
  { id: "math-area-perimeter", cat: "math", ages: [8, 15], en: ["Area and perimeter", "Perimeter and area of rectangles, triangles, parallelograms, trapeziums, circles and composite shapes."], he: ["שטח והיקף", "היקף ושטח של מלבנים, משולשים, מקביליות, טרפזים, עיגולים וצורות מורכבות."] },
  { id: "math-decimals", cat: "math", ages: [8, 14], en: ["Decimals", "Tenths and hundredths, comparing and rounding decimals, and calculating with them."], he: ["מספרים עשרוניים", "עשיריות ומאיות, השוואה ועיגול של מספרים עשרוניים, וחישובים בהם."] },
  { id: "math-negative-numbers", cat: "math", ages: [9, 15], en: ["Negative numbers", "The number line below zero, adding and subtracting negatives, absolute value and the sign rules."], he: ["מספרים שליליים", "ציר המספרים מתחת לאפס, חיבור וחיסור של מספרים שליליים, ערך מוחלט וכללי הסימנים."] },
  { id: "math-order-of-operations", cat: "math", ages: [8, 15], en: ["Order of operations", "Which part of a calculation comes first: brackets, powers, × and ÷, then + and −."], he: ["סדר פעולות חשבון", "מה מחשבים קודם: סוגריים, חזקות, כפל וחילוק, ואז חיבור וחיסור."] },
  { id: "math-primes-factors", cat: "math", ages: [9, 15], en: ["Primes, factors and multiples", "Even and odd, factors and multiples, primes, divisibility rules, GCD and LCM."], he: ["ראשוניים, מחלקים וכפולות", "זוגי ואי־זוגי, מחלקים וכפולות, מספרים ראשוניים, סימני התחלקות, מחלק משותף וכפולה משותפת."] },
  { id: "math-pythagoras", cat: "math", ages: [12, 17], en: ["Pythagoras' theorem", "Right triangles, squares and square roots, the theorem and its converse, distances and diagonals."], he: ["משפט פיתגורס", "משולשים ישרי־זווית, ריבועים ושורשים, המשפט והמשפט ההפוך, מרחקים ואלכסונים."] },
  { id: "math-statistics", cat: "math", ages: [9, 17], en: ["Statistics and data", "Collecting and showing data, mode, mean, median and range, outliers, samples and correlation."], he: ["סטטיסטיקה ונתונים", "איסוף והצגה של נתונים, שכיח, ממוצע, חציון וטווח, ערכים חריגים, מדגמים ומתאם."] },
  { id: "math-ratio", cat: "math", ages: [9, 16], en: ["Ratio and proportion", "Comparing amounts, sharing in a ratio, rates and unit prices, scale, direct and inverse proportion."], he: ["יחס ופרופורציה", "השוואת כמויות, חלוקה לפי יחס, קצב ומחיר ליחידה, קנה מידה, יחס ישר ויחס הפוך."] },
  // ── science
  { id: "science-states-of-matter", cat: "science", ages: [7, 15], en: ["States of matter", "Solids, liquids and gases, changes of state, particles and latent heat."], he: ["מצבי צבירה", "מוצק, נוזל וגז, מעברים בין מצבי צבירה, חלקיקים וחום כמוס."] },
  { id: "science-water-cycle", cat: "science", ages: [7, 14], en: ["The water cycle", "Evaporation, condensation, precipitation, groundwater and how people affect the cycle."], he: ["מחזור המים", "התאדות, עיבוי, משקעים, מי תהום ואיך האדם משפיע על המחזור."] },
  { id: "science-solar-system", cat: "science", ages: [7, 15], en: ["The solar system", "The sun, the planets and their moons, orbits, distances and the reason for seasons."], he: ["מערכת השמש", "השמש, כוכבי הלכת והירחים שלהם, מסלולים, מרחקים והסיבה לעונות השנה."], env: "space-station" },
  { id: "science-cells", cat: "science", ages: [9, 16], en: ["Cells", "The building blocks of life: cell parts, plant and animal cells, bacteria, diffusion and osmosis."], he: ["התא", "אבני הבניין של החיים: חלקי התא, תאי צמח ובעלי חיים, חיידקים, דיפוזיה ואוסמוזה."] },
  { id: "science-photosynthesis", cat: "science", ages: [9, 16], en: ["Photosynthesis", "How plants make food from light, water and carbon dioxide, and what limits the process."], he: ["פוטוסינתזה", "איך צמחים מייצרים מזון מאור, ממים ומפחמן דו־חמצני, ומה מגביל את התהליך."], env: "forest" },
  { id: "science-digestion", cat: "science", ages: [8, 15], en: ["The digestive system", "The journey of food from mouth to intestines, enzymes, bile and absorption."], he: ["מערכת העיכול", "המסע של המזון מהפה ועד המעיים, אנזימים, מרה וספיגה."] },
  { id: "science-electricity", cat: "science", ages: [8, 16], en: ["Electric circuits", "Circuits, conductors and insulators, series and parallel, current, voltage, Ohm's law and safety."], he: ["מעגלים חשמליים", "מעגלים, מוליכים ומבודדים, חיבור בטור ובמקביל, זרם, מתח, חוק אוהם ובטיחות."] },
  { id: "science-forces", cat: "science", ages: [8, 16], en: ["Forces and motion", "Pushes and pulls, gravity, friction, mass and weight, inertia and Newton's laws."], he: ["כוחות ותנועה", "דחיפה ומשיכה, כוח המשיכה, חיכוך, מסה ומשקל, התמדה וחוקי ניוטון."] },
  { id: "science-atoms", cat: "science", ages: [10, 17], en: ["Atoms and molecules", "Elements and compounds, protons, neutrons and electrons, isotopes and ions."], he: ["אטומים ומולקולות", "יסודות ותרכובות, פרוטונים, נייטרונים ואלקטרונים, איזוטופים ויונים."] },
  { id: "science-acids-bases", cat: "science", ages: [10, 17], en: ["Acids and bases", "Sour and slippery substances, indicators, the pH scale, neutralisation and ocean acidification."], he: ["חומצות ובסיסים", "חומרים חמוצים וחלקלקים, אינדיקטורים, סולם ה־pH, סתירה והחמצת האוקיינוסים."] },
  { id: "science-light", cat: "science", ages: [7, 16], en: ["Light", "Light sources and shadows, reflection and refraction, colours, rainbows and the speed of light."], he: ["אור", "מקורות אור וצללים, החזרה ושבירה, צבעים, קשת בענן ומהירות האור."] },
  { id: "science-sound", cat: "science", ages: [7, 16], en: ["Sound", "Vibrations, loudness and pitch, echoes, how sound travels, ultrasound and the Doppler effect."], he: ["קול", "רטט, עוצמה וגובה צליל, הד, איך קול מתפשט, על־קול ואפקט דופלר."] },
  { id: "science-heart-blood", cat: "science", ages: [8, 16], en: ["The heart and blood", "The heart as a pump, pulse, blood vessels, blood cells and the double circulation."], he: ["הלב והדם", "הלב כמשאבה, דופק, כלי דם, תאי הדם ומחזור הדם הכפול."] },
  { id: "science-food-chains", cat: "science", ages: [7, 15], en: ["Food chains and webs", "Producers and consumers, predators, decomposers, energy pyramids and bioaccumulation."], he: ["שרשראות ומארגי מזון", "יצרנים וצרכנים, טורפים, מפרקים, פירמידות אנרגיה והצטברות ביולוגית."], env: "forest" },
  { id: "science-genetics", cat: "science", ages: [10, 17], en: ["Genetics and heredity", "Inherited traits, DNA, genes and chromosomes, dominant and recessive alleles and Mendel."], he: ["גנטיקה ותורשה", "תכונות תורשתיות, DNA, גנים וכרומוזומים, אללים שולטים ונסגניים ומנדל."] },
  { id: "science-earth-volcanoes", cat: "science", ages: [8, 16], en: ["Earth's layers, volcanoes and earthquakes", "Crust, mantle and core, magma and lava, plates, earthquake safety, magnitude and tsunamis."], he: ["שכבות כדור הארץ, הרי געש ורעידות אדמה", "קרום, מעטפת וליבה, מאגמה ולבה, לוחות, בטיחות ברעידת אדמה, עוצמה וצונאמי."], env: "desert-ruins" },
  { id: "science-weather", cat: "science", ages: [7, 16], en: ["Weather", "Temperature, wind and rain, weather tools, air pressure, sea breezes, fronts and forecasts."], he: ["מזג האוויר", "טמפרטורה, רוח וגשם, מכשירי מדידה, לחץ אוויר, בריזה, חזיתות ותחזיות."], env: "sky-islands" },
  // ── history and civics
  { id: "history-ancient-egypt", cat: "history", ages: [8, 15], en: ["Ancient Egypt", "The Nile, pharaohs and pyramids, hieroglyphs and the kingdoms of ancient Egypt."], he: ["מצרים העתיקה", "הנילוס, פרעונים ופירמידות, הירוגליפים והממלכות של מצרים העתיקה."] },
  { id: "history-ancient-rome", cat: "history", ages: [9, 16], en: ["Ancient Rome", "From republic to empire: emperors, the Senate, legions, roads, Pompeii and the fall of the West."], he: ["רומא העתיקה", "מרפובליקה לאימפריה: קיסרים, הסנאט, לגיונות, דרכים, פומפיי ונפילת המערב."], env: "castle" },
  { id: "history-ancient-greece", cat: "history", ages: [9, 16], en: ["Ancient Greece", "City-states, Athenian democracy, myths, the Olympics, philosophers and Alexander's world."], he: ["יוון העתיקה", "ערי־מדינה, הדמוקרטיה האתונאית, מיתוסים, האולימפיאדה, פילוסופים ועולמו של אלכסנדר."], env: "castle" },
  { id: "history-israel-independence", cat: "history", ages: [9, 17], en: ["The founding of Israel", "From Herzl and the Zionist movement to the Declaration of Independence and the first years of the state."], he: ["הקמת מדינת ישראל", "מהרצל והתנועה הציונית ועד מגילת העצמאות והשנים הראשונות של המדינה."] },
  { id: "civics-democracy", cat: "history", ages: [10, 17], en: ["Democracy", "Elections, majority rule and minority rights, separation of powers, the rule of law and a free press."], he: ["דמוקרטיה", "בחירות, הכרעת הרוב וזכויות המיעוט, הפרדת רשויות, שלטון החוק ועיתונות חופשית."], env: "neon-city" },
  { id: "civics-israel-government", cat: "history", ages: [10, 17], en: ["How Israel is governed", "The Knesset, the government and the President, elections, coalitions, the Basic Laws and the courts."], he: ["משטר ושלטון בישראל", "הכנסת, הממשלה והנשיא, בחירות, קואליציה, חוקי היסוד ובתי המשפט."], env: "neon-city" },
  // ── geography
  { id: "geo-continents-oceans", cat: "geography", ages: [7, 14], en: ["Continents and oceans", "The seven continents, the oceans, the equator and hemispheres, and how the continents move."], he: ["יבשות ואוקיינוסים", "שבע היבשות, האוקיינוסים, קו המשווה וחצאי הכדור, ואיך היבשות נעות."] },
  { id: "geo-israel", cat: "geography", ages: [8, 16], en: ["The geography of Israel", "Seas, lakes and rivers, the Negev and the Galilee, climate, the Rift Valley and water."], he: ["הגאוגרפיה של ישראל", "ימים, אגמים ונהרות, הנגב והגליל, אקלים, השבר הסורי־אפריקני ומים."] },
  // ── languages
  { id: "lang-en-past-simple", cat: "languages", ages: [9, 15], en: ["English: past simple", "Regular and irregular verbs, did in questions and negatives, was/were, and other past forms."], he: ["אנגלית: עבר פשוט", "פעלים רגילים ולא רגילים, did בשאלות ובשלילה, was/were וצורות עבר נוספות."] },
  { id: "lang-he-roots", cat: "languages", ages: [9, 16], en: ["Hebrew roots and verb patterns", "The shoresh, word families, mishkal and the binyanim, including weak roots."], he: ["שורשים ובניינים בעברית", "השורש, משפחות מילים, משקלים והבניינים, כולל גזרות."] },
  // ── computing
  { id: "cs-binary", cat: "computing", ages: [9, 17], en: ["Binary numbers", "Bits and bytes, base 2 and place value, converting numbers, hexadecimal and text codes."], he: ["מספרים בינאריים", "ביטים ובתים, בסיס 2 וערך המקום, המרת מספרים, בסיס הקסדצימלי וקידוד טקסט."] },
  { id: "cs-algorithms", cat: "computing", ages: [8, 17], en: ["Algorithms", "Step-by-step instructions, loops and conditions, searching and sorting, efficiency and recursion."], he: ["אלגוריתמים", "הוראות צעד אחר צעד, לולאות ותנאים, חיפוש ומיון, יעילות ורקורסיה."] },
  { id: "cs-internet-safety", cat: "computing", ages: [7, 16], en: ["Internet safety", "Personal information, strong passwords, phishing, cyberbullying, privacy and your digital footprint."], he: ["בטיחות ברשת", "מידע אישי, סיסמאות חזקות, דיוג, בריונות ברשת, פרטיות וטביעת הרגל הדיגיטלית."] },
  // ── economy and personal finance
  { id: "econ-budgeting", cat: "economy", ages: [9, 17], en: ["Budgeting and saving", "Income and expenses, needs and wants, saving goals, deficits and smart spending choices."], he: ["תקציב וחיסכון", "הכנסות והוצאות, צרכים ורצונות, יעדי חיסכון, גירעון והחלטות קנייה נבונות."] },
  // ── health, nutrition and safety
  { id: "health-nutrition", cat: "health", ages: [7, 16], en: ["Healthy eating", "Food groups and nutrients, vitamins and minerals, food labels and energy in food."], he: ["תזונה נכונה", "קבוצות מזון ורכיבי תזונה, ויטמינים ומינרלים, סימון תזונתי והאנרגיה שבמזון."], env: "forest" },
  // ── arts, music and literature
  { id: "arts-music-basics", cat: "arts", ages: [7, 16], en: ["Music basics", "Rhythm, melody and tempo, notes and the staff, scales, chords and time signatures."], he: ["יסודות המוזיקה", "מקצב, לחן וטמפו, תווים וחמשה, סולמות, אקורדים ומשקלים."] },
  // ── thinking and study skills
  { id: "think-study-skills", cat: "thinking", ages: [9, 18], en: ["How to study well", "Planning, focus and sleep, summaries, retrieval practice, spaced repetition and learning about learning."], he: ["איך ללמוד נכון", "תכנון, ריכוז ושינה, סיכומים, תרגול שליפה, חזרה מרווחת ולמידה על הלמידה."] },
  { id: "lang-en-present-simple", cat: "languages", ages: [8, 14], en: ["English: present simple", "Habits and facts, he/she/it + s, do and does in questions and negatives, and when not to use it."], he: ["אנגלית: הווה פשוט", "הרגלים ועובדות, s בגוף שלישי, do ו־does בשאלות ובשלילה, ומתי לא משתמשים בו."] },
];

/** Every level exists for every topic. */
export const TOPIC_LEVELS: readonly Difficulty[] = ["beginner", "intermediate", "advanced"];

const BY_ID = new Map(TOPICS.map((t) => [t.id, t]));

export const findTopic = (id: string): TopicEntry | undefined => BY_ID.get(id);
export const isTopicId = (id: unknown): id is string => typeof id === "string" && BY_ID.has(id);

export const topicsIn = (cat: TopicCategory): TopicEntry[] => TOPICS.filter((t) => t.cat === cat);

/** Search over both languages' titles and descriptions (case- and accent-insensitive; Hebrew niqqud ignored). */
export function searchTopics(query: string, cat: TopicCategory | "all" = "all"): TopicEntry[] {
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-֑ͯ-ׇ]/g, "").toLowerCase();
  const words = norm(query).split(/\s+/).filter(Boolean);
  return TOPICS.filter((t) => (cat === "all" || t.cat === cat) && words.every((w) => norm(`${t.en[0]} ${t.en[1]} ${t.he[0]} ${t.he[1]}`).includes(w)));
}
