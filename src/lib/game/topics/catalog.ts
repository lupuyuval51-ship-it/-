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
