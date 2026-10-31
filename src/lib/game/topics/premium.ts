import { PLANS, PLAN_IDS, type PlanId, type TopicTier } from "@/config/plans";

// ── generated: the Plus and Pro collection
/** The Plus and Pro collection (`catalog-plus-pro.ts`): the half of it that needs Plus or Pro. */
const COLLECTION_PLUS: readonly string[] = [
  // math
  "math-number-bonds", "math-column-arithmetic", "math-times-tables", "math-long-multiplication", "math-division",
  "math-mental-math", "math-money", "math-roman-numerals", "math-hebrew-numerals", "math-properties-of-operations",
  "math-symmetry", "math-word-problems", "math-transformations", "math-sets-venn", "math-speed-distance-time",
  // science
  "science-density", "science-gravity", "science-heat-transfer", "science-plant-parts", "science-insects",
  "science-birds", "science-ocean-life", "science-skin", "science-soil", "science-pollution",
  // history
  "history-timelines", "history-archaeology", "history-feudal-japan", "history-ancient-wonders", "history-pirates",
  "history-aviation", "history-calendars", "history-numbers", "history-olympics", "history-food",
  "history-hebrew-revival", "history-tel-aviv", "civics-israel-symbols", "civics-courts", "civics-local-government",
  // geography
  "geo-negev-eilat", "geo-israel-cities", "geo-israel-climate", "geo-israel-nature", "geo-africa", "geo-islands",
  "geo-lakes", "geo-rainforests", "geo-grasslands", "geo-forests",
  // languages
  "lang-en-verb-to-be", "lang-en-present-continuous", "lang-en-pronouns", "lang-en-adverbs", "lang-en-phonics",
  "lang-en-spelling", "lang-en-homophones", "lang-en-synonyms-antonyms", "lang-en-family-home", "lang-en-food-drink",
  "lang-en-body-health", "lang-en-dates-time", "lang-he-synonyms", "lang-es-articles-gender", "lang-es-family",
  // computing
  "cs-keyboard-skills", "cs-mouse-touch", "cs-word-processing", "cs-presentations", "cs-email", "cs-browsers",
  "prog-scratch", "prog-turtle", "prog-events", "cs-animation", "cs-contactless", "cs-barcodes-qr", "cs-3d-printing",
  "cs-morse-code", "cs-video-game-history",
  // economy
  "econ-goods-services", "econ-sharing-economy", "econ-money-history", "econ-shekel-history", "econ-interest",
  "econ-inflation", "econ-payments", "econ-competition", "econ-production-factors", "econ-sectors",
  "econ-specialisation", "econ-business-types", "econ-break-even", "econ-consumer-rights", "econ-money-scams",
  // health
  "health-muscles", "health-puberty", "health-medicines", "health-care-jobs", "health-animal-safety",
  "health-home-front", "health-safe-play", "health-personal-safety", "health-bullying", "health-friendship",
  // arts
  "arts-rhythm-tempo", "arts-singing-voice", "arts-fairy-tales", "arts-childrens-classics", "arts-masks", "arts-bridges",
  "arts-homes-world", "arts-making-books", "arts-origami", "arts-ceramics",
  // thinking
  "think-asking-questions", "think-growth-mindset", "think-self-control", "think-analogies", "think-classifying",
  "think-observation-inference", "think-cause-effect", "think-number-puzzles", "think-strategy-games", "think-empathy",
  "think-listening", "think-assertiveness", "think-fair-play", "think-mind-maps", "think-resilience",
];

/** The Plus and Pro collection: the half of it that only Pro opens (the more advanced topics). */
const COLLECTION_PRO: readonly string[] = [
  // math
  "math-number-sets", "math-simultaneous-equations", "math-congruent-triangles", "math-similar-triangles",
  "math-history-of-maths", "math-unit-circle", "math-sine-cosine-rules", "math-exponential", "math-logarithms",
  "math-vectors", "math-derivatives", "math-integrals", "math-data-spread", "math-normal-distribution",
  "math-conditional-probability",
  // science
  "science-periodic-table", "science-mixtures-separation", "science-animal-behaviour", "science-plant-classification",
  "science-atmosphere", "science-tides-currents", "science-static-electricity", "science-conservation",
  "science-lab-skills", "science-famous-scientists",
  // history
  "history-persian-empire", "history-phoenicians", "history-ottoman-empire", "history-mongol-empire",
  "history-silk-road", "history-african-kingdoms", "history-black-death", "history-scientific-revolution",
  "history-american-revolution", "history-french-revolution", "history-world-war-1", "history-world-war-2",
  "history-zionism", "history-aliyot", "history-kibbutz",
  // geography
  "geo-israel-water", "geo-northern-israel", "geo-rift-valley", "geo-south-america", "geo-north-america", "geo-nordic",
  "geo-time-zones", "geo-seasons", "geo-map-projections", "geo-seas-straits",
  // languages
  "lang-en-past-continuous", "lang-en-present-perfect", "lang-en-past-perfect", "lang-en-passive",
  "lang-en-reported-speech", "lang-en-conditionals", "lang-en-gerunds-infinitives", "lang-en-relative-clauses",
  "lang-he-acronyms", "lang-he-sentence-parts", "lang-he-smichut", "lang-he-connectors", "lang-he-new-words",
  "lang-he-history", "lang-es-present-verbs",
  // computing
  "cs-sorting", "cs-data-speeds", "cs-copyright", "cs-open-source", "prog-javascript", "prog-code-style",
  "prog-randomness", "cs-programming-languages", "cs-music-tech", "cs-mobile-networks", "cs-data-cables", "cs-gps",
  "cs-vr-ar", "cs-israeli-tech", "cs-internet-history",
  // economy
  "econ-loans-debt", "econ-gdp", "econ-central-bank", "econ-payslip", "econ-pensions", "econ-insurance",
  "econ-elasticity", "econ-economic-systems", "econ-economic-thinkers", "econ-financial-crises", "econ-israel-economy",
  "econ-marketing", "econ-crypto", "econ-bonds", "econ-externalities",
  // health
  "health-hearing", "health-vitamins-minerals", "health-food-allergies", "health-food-safety", "health-caffeine",
  "health-smoking-vaping", "health-bike-scooter", "health-hiking", "health-natural-hazards", "health-peer-pressure",
  // arts
  "arts-scales-keys", "arts-musicals", "arts-popular-music", "arts-israeli-song", "arts-sound-recording",
  "arts-songwriting", "arts-detective-stories", "arts-sci-fi-fantasy", "arts-film-history", "arts-architects",
  // thinking
  "think-note-taking", "think-reading-strategies", "think-test-taking", "think-research-projects",
  "think-public-speaking", "think-goal-setting", "think-attention", "think-classic-puzzles", "think-chess",
  "think-design-thinking", "think-root-cause", "think-philosophy", "think-feedback", "think-procrastination",
  "think-six-hats",
];
// ── end of the Plus and Pro collection

/**
 * Topics of the library that Free does not open. In the original library (`catalog.ts`) about a third of every category:
 * the 3rd, 6th, 9th… topic of each category in catalogue order, so the first topics of every category stay open to
 * everyone (course chapters, see `courses.ts`, are always free and not counted); two of them in every category need Pro,
 * the rest Plus or Pro. The Plus and Pro collection (`catalog-plus-pro.ts`) is never free: in every category half of
 * its topics need Plus or Pro and half (the more advanced ones) need Pro. Which plan plays which tier is decided in src/config/plans.ts
 * (`features.topicTiers`), never here; the server and the offline generator enforce it.
 */
export const PREMIUM_TOPIC_IDS: ReadonlySet<string> = new Set([
  ...COLLECTION_PLUS,
  ...COLLECTION_PRO,
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

/** The topics that only Pro opens (all of them are also in `PREMIUM_TOPIC_IDS`): two in every category of the original library, and half of the collection. */
export const PRO_ONLY_TOPIC_IDS: ReadonlySet<string> = new Set([
  ...COLLECTION_PRO,
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
