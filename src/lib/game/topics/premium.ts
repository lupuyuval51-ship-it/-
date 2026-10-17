import { PLANS, PLAN_IDS, type PlanId, type TopicTier } from "@/config/plans";

/**
 * Topics of the library that Free does not open (about a third of every category: the 3rd, 6th, 9th… topic of each
 * category in catalogue order, so the first topics of every category stay open to everyone). Of these, `PRO_ONLY_TOPIC_IDS`
 * (two in every category) need Pro; the rest need Plus or Pro. Which plan plays which tier is decided in src/config/plans.ts
 * (`features.topicTiers`), never here; the server and the offline generator enforce it.
 */
export const PREMIUM_TOPIC_IDS: ReadonlySet<string> = new Set([
  // math
  "math-equations",
  "math-area-perimeter",
  "math-order-of-operations",
  "math-statistics",
  "math-powers-roots",
  "math-shapes",
  "math-place-value",
  "math-inequalities",
  // science
  "science-solar-system",
  "science-digestion",
  "science-atoms",
  "science-sound",
  "science-genetics",
  "science-energy",
  "science-moon",
  "science-microorganisms",
  "science-animal-classification",
  "science-materials",
  "science-life-cycles",
  // history
  "history-ancient-greece",
  "civics-israel-government",
  "history-exploration",
  "history-ancient-china",
  "history-mesopotamia",
  "civics-human-rights",
  "history-ancient-india",
  // geography
  "geo-continents-oceans",
  "geo-climate-zones",
  "geo-capitals-asia-africa",
  "geo-polar-regions",
  // languages
  "lang-en-future",
  "lang-en-past-simple",
  "lang-he-gender-number",
  "lang-writing-skills",
  "lang-en-everyday",
  // computing
  "cs-internet-safety",
  "cs-internet",
  "cs-cryptography",
  "prog-conditions",
  "prog-lists",
  "prog-python",
  "prog-oop",
  "cs-data-databases",
  "cs-operating-systems",
  "cs-iot",
  "cs-boolean-logic",
  "cs-cloud-computing",
  // economy
  "econ-supply-demand",
  "econ-smart-shopping",
  "econ-work-jobs",
  "econ-stock-market",
  // health
  "health-road-safety",
  "health-first-aid",
  "health-home-safety",
  "health-immune-system",
  // arts
  "arts-literature",
  "arts-photography",
  "arts-poetry",
  "arts-comics",
  "arts-dance",
  // thinking
  "think-problem-solving",
  "think-time-management",
  "think-teamwork",
  "think-scientific-method",
]);

/** Two topics in every category that only Pro opens (all of them are also in `PREMIUM_TOPIC_IDS`). */
export const PRO_ONLY_TOPIC_IDS: ReadonlySet<string> = new Set([
  "math-statistics", "math-inequalities",
  "science-genetics", "science-microorganisms",
  "history-ancient-india", "civics-human-rights",
  "geo-capitals-asia-africa", "geo-polar-regions",
  "lang-writing-skills", "lang-en-everyday",
  "prog-oop", "cs-cryptography",
  "econ-stock-market", "econ-work-jobs",
  "health-immune-system", "health-first-aid",
  "arts-poetry", "arts-dance",
  "think-scientific-method", "think-teamwork",
]);

/** Not open to Free (Plus-and-up or Pro-only). */
export const isPremiumTopic = (id: string): boolean => PREMIUM_TOPIC_IDS.has(id);

export const topicTier = (id: string): TopicTier => (PRO_ONLY_TOPIC_IDS.has(id) ? "pro" : PREMIUM_TOPIC_IDS.has(id) ? "plus" : "free");

/** Can a learner on `plan` play this topic? */
export const topicOpenFor = (plan: PlanId, id: string): boolean => PLANS[plan].features.topicTiers.includes(topicTier(id));

/** The cheapest plan that opens this topic (for the lock label and the refusal): Free, Plus or Pro. */
export const planOpeningTopic = (id: string): PlanId => PLAN_IDS.find((p) => topicOpenFor(p, id)) ?? "PRO";

/** The cheapest plan that opens the Plus tier of topics. */
export const premiumTopicsPlan = (): PlanId => PLAN_IDS.find((p) => PLANS[p].features.topicTiers.includes("plus")) ?? "PRO";
