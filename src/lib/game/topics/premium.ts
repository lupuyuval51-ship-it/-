import { PLANS, PLAN_IDS, type PlanId } from "@/config/plans";

/**
 * Topics of the library that only Plus and Pro open (about a third of every category: the 3rd, 6th, 9th… topic of each
 * category in catalogue order, so the first topics of every category stay open to everyone). Which plan opens them is
 * decided in src/config/plans.ts (`features.premiumTopics`), never here; the server and the offline generator enforce it.
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

export const isPremiumTopic = (id: string): boolean => PREMIUM_TOPIC_IDS.has(id);

/** Can a learner on `plan` play this topic? Free plays every topic that is not premium; Plus and Pro play all of them. */
export const topicOpenFor = (plan: PlanId, id: string): boolean => !isPremiumTopic(id) || PLANS[plan].features.premiumTopics;

/** The cheapest plan that opens premium topics (for the "Plus" lock label). */
export const premiumTopicsPlan = (): PlanId => PLAN_IDS.find((p) => PLANS[p].features.premiumTopics) ?? "PRO";
