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
  // ── science
  { id: "science-states-of-matter", cat: "science", ages: [7, 15], en: ["States of matter", "Solids, liquids and gases, changes of state, particles and latent heat."], he: ["מצבי צבירה", "מוצק, נוזל וגז, מעברים בין מצבי צבירה, חלקיקים וחום כמוס."] },
  { id: "science-water-cycle", cat: "science", ages: [7, 14], en: ["The water cycle", "Evaporation, condensation, precipitation, groundwater and how people affect the cycle."], he: ["מחזור המים", "התאדות, עיבוי, משקעים, מי תהום ואיך האדם משפיע על המחזור."] },
  { id: "science-solar-system", cat: "science", ages: [7, 15], en: ["The solar system", "The sun, the planets and their moons, orbits, distances and the reason for seasons."], he: ["מערכת השמש", "השמש, כוכבי הלכת והירחים שלהם, מסלולים, מרחקים והסיבה לעונות השנה."], env: "space-station" },
  { id: "science-cells", cat: "science", ages: [9, 16], en: ["Cells", "The building blocks of life: cell parts, plant and animal cells, bacteria, diffusion and osmosis."], he: ["התא", "אבני הבניין של החיים: חלקי התא, תאי צמח ובעלי חיים, חיידקים, דיפוזיה ואוסמוזה."] },
  { id: "science-photosynthesis", cat: "science", ages: [9, 16], en: ["Photosynthesis", "How plants make food from light, water and carbon dioxide, and what limits the process."], he: ["פוטוסינתזה", "איך צמחים מייצרים מזון מאור, ממים ומפחמן דו־חמצני, ומה מגביל את התהליך."], env: "forest" },
  { id: "science-digestion", cat: "science", ages: [8, 15], en: ["The digestive system", "The journey of food from mouth to intestines, enzymes, bile and absorption."], he: ["מערכת העיכול", "המסע של המזון מהפה ועד המעיים, אנזימים, מרה וספיגה."] },
  { id: "science-electricity", cat: "science", ages: [8, 16], en: ["Electric circuits", "Circuits, conductors and insulators, series and parallel, current, voltage, Ohm's law and safety."], he: ["מעגלים חשמליים", "מעגלים, מוליכים ומבודדים, חיבור בטור ובמקביל, זרם, מתח, חוק אוהם ובטיחות."] },
  { id: "science-forces", cat: "science", ages: [8, 16], en: ["Forces and motion", "Pushes and pulls, gravity, friction, mass and weight, inertia and Newton's laws."], he: ["כוחות ותנועה", "דחיפה ומשיכה, כוח המשיכה, חיכוך, מסה ומשקל, התמדה וחוקי ניוטון."] },
  // ── history and civics
  { id: "history-ancient-egypt", cat: "history", ages: [8, 15], en: ["Ancient Egypt", "The Nile, pharaohs and pyramids, hieroglyphs and the kingdoms of ancient Egypt."], he: ["מצרים העתיקה", "הנילוס, פרעונים ופירמידות, הירוגליפים והממלכות של מצרים העתיקה."] },
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
