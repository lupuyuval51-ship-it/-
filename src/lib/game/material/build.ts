/**
 * The study-material engine: learner's text → a complete, valid game spec, with no model and no hand-written
 * questions. Deterministic (same text, same game) and honest: the result is labelled "built from your material" and
 * every question points back at a sentence the learner wrote.
 */
import type { Environment, GameType, SubjectCategory, TimeOfDay } from "../spec/constants";
import type { GameExtension, GameSpec } from "../spec/schema";
import { challengeStation, loreStation, npc, translator, type Lang } from "../demo/builders";
import type { GenerationRequest } from "@/lib/schemas/generation";
import { generateChallenges, type Generated } from "./challenges";
import { parseMaterial, type Knowledge } from "./parse";
import { clip, hashText, sanitizeMaterial } from "./text";
import { mulberry32 } from "../util/prng";

type Raw = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export const MIN_CHALLENGES = 3;
/** Anything shorter than this cannot contain enough to ask three questions about. */
export const MIN_MATERIAL_CHARS = 60;

export class MaterialError extends Error {
  constructor(public readonly code: "TOO_SHORT" | "TOO_LITTLE", private readonly msgs: { en: string; he: string }) {
    super(msgs.en);
    this.name = "MaterialError";
  }
  userMessage(lang: Lang): string {
    return lang === "he" ? this.msgs.he : this.msgs.en;
  }
}

// ───────────────────────────── world flavour ─────────────────────────────

const CATEGORY: [SubjectCategory, RegExp][] = [
  ["programming", /\b(?:python|java(?:script)?|code|coding|program(?:ming)?|algorithm|loop|variable|function|software|computer|html|css|sql)\b|תכנות|קוד|אלגוריתם|מחשב/i],
  ["math", /\b(?:math(?:s|ematics)?|algebra|geometry|fraction|equation|arithmetic|calculus|percent)\b|מתמטיקה|חשבון|שבר|משוואה|גיאומטריה|אחוז/i],
  ["science", /\b(?:science|physics|chemistry|biology|atom|cell|energy|force|planet|space|ecosystem|photosynthesis|gravity|molecule|animal|plant|weather|ocean|sea|climate)\b|מדע|פיזיקה|כימיה|ביולוגיה|אנרגיה|כוח|כוכב|חלל|תא|צמח|חיה|אקלים|ים|אוקיינוס/i],
  ["history", /\b(?:history|ancient|empire|war|revolution|king|queen|dynasty|medieval|civilization|century|egypt|rome|greece)\b|היסטוריה|עתיק|אימפריה|מלחמה|מהפכה|מלך|תקופה|מצרים|רומא|יוון/i],
  ["language", /\b(?:language|vocabulary|grammar|spanish|french|german|english|hebrew|arabic|translate|words?)\b|שפה|אוצר מילים|דקדוק|ספרדית|צרפתית|אנגלית|עברית|ערבית/i],
];

const ENV: [Environment, RegExp][] = [
  ["ocean-floor", /\b(?:ocean|sea|marine|fish|coral|whale|dolphin|underwater|reef)\b|ים|אוקיינוס|דג|אלמוג|לווייתן/i],
  ["space-station", /\b(?:space|planet|star|galaxy|astronaut|rocket|orbit|solar system|moon|mars)\b|חלל|כוכב|גלקסיה|אסטרונאוט|טיל|מסלול|ירח|מאדים/i],
  ["desert-ruins", /\b(?:egypt|pyramid|pharaoh|nile|desert|ancient|mesopotamia|bronze age)\b|מצרים|פירמידה|פרעה|נילוס|מדבר|עתיק/i],
  ["castle", /\b(?:castle|medieval|knight|king|queen|kingdom|rome|roman|greece|greek|empire|math(?:s|ematics)?|algebra|geometry)\b|טירה|ימי הביניים|אביר|מלך|ממלכה|רומא|יוון|אימפריה|מתמטיקה|אלגברה|גיאומטריה/i],
  ["neon-city", /\b(?:code|coding|program|python|java(?:script)?|algorithm|computer|software|internet|network|robot|ai|data)\b|קוד|תכנות|אלגוריתם|מחשב|תוכנה|אינטרנט|רשת|רובוט|נתונים/i],
  ["laboratory", /\b(?:science|physics|chemistry|biology|atom|molecule|cell|energy|force|experiment|lab|body|health)\b|מדע|פיזיקה|כימיה|ביולוגיה|אטום|מולקולה|תא|אנרגיה|כוח|ניסוי|גוף|בריאות/i],
  ["sky-islands", /\b(?:weather|cloud|climate|geography|bird|flight|air|wind|mountain|continent|map)\b|מזג אוויר|ענן|אקלים|גיאוגרפיה|ציפור|טיסה|אוויר|רוח|הר|יבשת|מפה/i],
  ["forest", /\b(?:forest|nature|plant|tree|animal|bees?|insects?|honey|flowers?|garden|farm|ecosystem|habitat|language|vocabulary|grammar|spanish|french|german|english|hebrew|arabic|words?)\b|יער|טבע|צמח|עץ|חיה|דבורה|דבורים|חרק|פרח|גינה|חווה|מערכת אקולוגית|שפה|אוצר מילים|דקדוק|ספרדית|צרפתית|אנגלית|עברית|ערבית/i],
];

const ENV_BY_TYPE: Record<GameType, Environment> = { exploration: "forest", puzzle: "castle", platformer: "sky-islands", simulation: "laboratory", adventure: "neon-city" };

export function pickCategory(subject: string): SubjectCategory {
  return CATEGORY.find(([, re]) => re.test(subject))?.[0] ?? "other";
}

/** The subject decides (a word like "queen" deep in the notes must not move a bee lesson into a castle). */
export function pickEnvironment(subject: string, gameType: GameType): Environment {
  return ENV.find(([, re]) => re.test(subject))?.[0] ?? ENV_BY_TYPE[gameType];
}

type Collectible = "gem" | "data-core" | "star" | "leaf" | "coin";
interface Flavour {
  station: [string, string];
  guide: [string, string];
  color: string;
  shape: "robot" | "human" | "creature" | "orb";
  place: [string, string];
  time: TimeOfDay;
  gem: Collectible;
}

const FLAVOUR: Record<Environment, Flavour> = {
  "neon-city": { station: ["Terminal", "מסוף"], guide: ["Byte", "בייט"], color: "#22e6ff", shape: "robot", place: ["Study Plaza", "כיכר הלימוד"], time: "night", gem: "data-core" },
  forest: { station: ["Signpost", "שלט דרך"], guide: ["Sol", "סול"], color: "#ffc63d", shape: "human", place: ["Study Clearing", "קרחת הלימוד"], time: "day", gem: "leaf" },
  "space-station": { station: ["Console", "לוח בקרה"], guide: ["Nova", "נובה"], color: "#a3ff4f", shape: "orb", place: ["Study Deck", "סיפון הלימוד"], time: "night", gem: "star" },
  "desert-ruins": { station: ["Tablet", "לוח אבן"], guide: ["Nefer", "נפר"], color: "#f59e0b", shape: "human", place: ["Study Court", "חצר הלימוד"], time: "day", gem: "coin" },
  "ocean-floor": { station: ["Shell", "צדף"], guide: ["Coral", "קורל"], color: "#ff7b9c", shape: "creature", place: ["Study Reef", "שונית הלימוד"], time: "day", gem: "gem" },
  laboratory: { station: ["Console", "לוח בקרה"], guide: ["Dr. Spark", "ד״ר ניצוץ"], color: "#2fd98a", shape: "human", place: ["Study Lab", "מעבדת הלימוד"], time: "day", gem: "gem" },
  castle: { station: ["Rune", "רונה"], guide: ["Count Sage", "הרוזן החכם"], color: "#f2c14e", shape: "human", place: ["Study Hall", "אולם הלימוד"], time: "dusk", gem: "coin" },
  "sky-islands": { station: ["Cloud marker", "סמן ענן"], guide: ["Zephyr", "זפיר"], color: "#ff7ab6", shape: "creature", place: ["Study Island", "אי הלימוד"], time: "day", gem: "star" },
};

// ───────────────────────────── composition ─────────────────────────────

export interface MaterialBuild {
  raw: Raw;
  notes: string[];
  stats: { challenges: number; terms: number; steps: number; facts: number; statements: number };
}

function prepare(req: GenerationRequest, max: number, idPrefix = ""): { know: Knowledge; gen: Generated; lang: Lang; material: string } {
  const material = sanitizeMaterial(req.material ?? "");
  const lang: Lang = req.contentLanguage === "he" ? "he" : "en";
  if (material.length < MIN_MATERIAL_CHARS) {
    throw new MaterialError("TOO_SHORT", {
      en: "Your study material is too short to build a game from. Paste at least a few sentences, a list of “term: meaning” lines or numbered steps.",
      he: "חומר הלימוד קצר מדי כדי לבנות ממנו משחק. הדביקו לפחות כמה משפטים, רשימת שורות ״מושג: הסבר״ או שלבים ממוספרים.",
    });
  }
  const know = parseMaterial(material);
  const gen = generateChallenges(know, { lang, rnd: mulberry32(hashText(material)), max, idPrefix });
  if (gen.challenges.length < MIN_CHALLENGES) {
    throw new MaterialError("TOO_LITTLE", {
      en: `Your material only has enough for ${gen.challenges.length} question(s); a game needs at least ${MIN_CHALLENGES}. Add more sentences, “term: meaning” lines, numbered steps or facts with numbers.`,
      he: `החומר שלכם מספיק רק ל-${gen.challenges.length} שאלות; משחק צריך לפחות ${MIN_CHALLENGES}. הוסיפו עוד משפטים, שורות ״מושג: הסבר״, שלבים ממוספרים או עובדות עם מספרים.`,
    });
  }
  return { know, gen, lang, material };
}

function loreFor(know: Knowledge, t: ReturnType<typeof translator>): { title: string; text: string } | null {
  let lines = know.definitions.length >= 2 ? know.definitions.slice(0, 3).map((d) => `${d.term} — ${d.meaning}`) : know.all.slice(0, 3);
  if (lines.length === 0 && know.steps[0]) lines = [know.steps[0].join(" → ")];
  const text = clip(lines.join(" · "), 420);
  return text ? { title: clip(know.title ?? t("Key ideas", "רעיונות מרכזיים"), 70), text } : null;
}

function chunk<T>(arr: T[], sizes: number[]): T[][] {
  const out: T[][] = [];
  let at = 0;
  for (const n of sizes) {
    out.push(arr.slice(at, at + n));
    at += n;
  }
  return out.filter((c) => c.length > 0);
}

interface AreaOpts {
  /** Used in station / npc ids so several areas never clash. */
  index: number;
  id: string;
  name: string;
  description: string;
  intro?: string;
  challenges: Raw[];
  flavour: Flavour;
  lang: Lang;
  know: Knowledge;
  subject: string;
  withLore: boolean;
  portalTo?: { id: string; label: string; mission: string };
}

function buildArea(o: AreaOpts): Raw {
  const t = translator(o.lang);
  const f = o.flavour;
  const stations: Raw[] = o.challenges.map((c, i) => challengeStation(`s-${o.index}-${i + 1}`, clip(`${t(...f.station)} ${i + 1}`, 40), String(c.id)));
  const lore = o.withLore ? loreFor(o.know, t) : null;
  if (lore) stations.push(loreStation(`s-${o.index}-lore`, t("Study notes", "פתקי לימוד"), lore.title, lore.text));
  const first = o.know.all[0] ?? o.subject;
  return {
    id: o.id, name: clip(o.name, 60), description: clip(o.description, 260), size: "medium", layout: "plaza", hazardLevel: "none",
    ...(o.intro ? { intro: clip(o.intro, 260) } : {}),
    stations,
    npcs: [npc(`n-${o.index}`, t(...f.guide), t("Your study guide", "המדריך שלכם ללמידה"), f.color, f.shape, [
      clip(t(`Welcome! Together we will explore: ${o.subject}.`, `ברוכים הבאים! יחד נחקור את: ${o.subject}.`), 240),
      clip(t(`From your notes: “${first}”`, `מתוך הפתקים שלכם: ״${first}״`), 240),
      t("Solve the challenges at the glowing stations. Stuck? Ask for a hint — it costs a few points.", "פתרו את האתגרים בתחנות הזוהרות. תקועים? בקשו רמז — הוא עולה כמה נקודות."),
    ], t("Every answer is explained afterwards using your own notes — read the explanation.", "אחרי כל תשובה יש הסבר מתוך הפתקים שלכם — קראו אותו."))],
    collectibles: { kind: f.gem, count: Math.min(5, Math.max(2, Math.ceil(o.challenges.length * 0.7))), label: t("Knowledge gems", "אבני ידע") },
    ...(o.portalTo ? { portal: { toAreaId: o.portalTo.id, label: clip(o.portalTo.label, 50), requiresMissionIds: [o.portalTo.mission] } } : {}),
  };
}

function missionsFor(o: { area: Raw; index: number; challenges: Raw[]; lang: Lang; previous?: string }): Raw[] {
  // a "read the notes" objective only exists when the area really has a notes station
  const withLore = (o.area.stations as { kind: string }[]).some((s) => s.kind === "lore");
  const t = translator(o.lang);
  const ids = o.challenges.map((c) => String(c.id));
  const half = Math.max(1, Math.ceil(ids.length / 2));
  const a = ids.slice(0, half), b = ids.slice(half);
  const collect = Math.min(2, (o.area.collectibles as { count: number }).count);
  const m1 = `m-${o.index}-1`, m2 = `m-${o.index}-2`;
  return [
    {
      id: m1, title: t("Warm up", "חימום"), areaId: o.area.id, requires: o.previous ? [o.previous] : [],
      story: t("Meet your guide and answer the first questions from your own notes.", "פגשו את המדריך וענו על השאלות הראשונות מתוך הפתקים שלכם."),
      objectives: [
        { type: "talk", text: t("Talk to your guide", "דברו עם המדריך"), npcId: `n-${o.index}` },
        { type: "solve", text: t("Answer the first questions", "ענו על השאלות הראשונות"), challengeIds: a.slice(0, 6) },
      ],
    },
    {
      id: m2, title: t("Go deeper", "מעמיקים"), areaId: o.area.id, requires: [m1],
      story: t("Finish the remaining questions and collect the knowledge gems.", "סיימו את שאר השאלות ואספו את אבני הידע."),
      objectives: [
        ...(b.length ? [{ type: "solve", text: t("Answer the remaining questions", "ענו על שאר השאלות"), challengeIds: b.slice(0, 6) }] : []),
        ...(collect > 0 ? [{ type: "collect", text: t(`Collect ${collect} knowledge gems`, `אספו ${collect} אבני ידע`), count: collect }] : []),
        ...(withLore ? [{ type: "visit", text: t("Read the study notes", "קראו את פתקי הלימוד"), stationIds: [`s-${o.index}-lore`] }] : []),
      ],
    },
  ];
}

export function buildMaterialSpec(req: GenerationRequest): MaterialBuild {
  const full = req.mode === "FULL";
  const { know, gen, lang, material } = prepare(req, full ? 10 : 4);
  const t = translator(lang);
  const env = pickEnvironment(req.subject, req.gameType);
  const f = FLAVOUR[env];
  const twoAreas = full && gen.challenges.length >= 6;
  const groups = twoAreas ? chunk(gen.challenges, [Math.ceil(gen.challenges.length / 2), Math.floor(gen.challenges.length / 2)]) : [gen.challenges];

  const areas: Raw[] = [];
  const missions: Raw[] = [];
  let previous: string | undefined;
  groups.forEach((cs, gi) => {
    const index = gi + 1;
    const last = gi === groups.length - 1;
    const next = groups[gi + 1] ? { id: `a-${index + 1}`, label: t("Path to the next chapter", "הדרך לפרק הבא"), mission: `m-${index}-2` } : undefined;
    const area = buildArea({
      index, id: `a-${index}`, name: gi === 0 ? t(...f.place) : t(`${f.place[0]} · part 2`, `${f.place[1]} · חלק 2`),
      description: t(`A place to practise “${req.subject}” with questions made from your own notes.`, `מקום לתרגל את ״${req.subject}״ בעזרת שאלות שנבנו מהפתקים שלכם.`),
      intro: gi === 0 ? t("Your notes have become a game. Follow the guide!", "הפתקים שלכם הפכו למשחק. עקבו אחרי המדריך!") : undefined,
      challenges: cs, flavour: f, lang, know, subject: req.subject, withLore: last, portalTo: next,
    });
    areas.push(area);
    const ms = missionsFor({ area, index, challenges: cs, lang, previous });
    missions.push(...ms);
    previous = ms[ms.length - 1]!.id as string;
  });

  const placed = gen.challenges.length;
  const raw: Raw = {
    schemaVersion: 1,
    meta: {
      title: clip(`${t("Study Quest", "משימת למידה")}: ${req.subject}`, 80),
      tagline: clip(t(`A game built from your own notes: ${placed} questions about ${req.subject}.`, `משחק שנבנה מהפתקים שלכם: ${placed} שאלות על ${req.subject}.`), 160),
      subject: clip(req.subject, 120), subjectCategory: pickCategory(req.subject) !== "other" ? pickCategory(req.subject) : pickCategory(material.slice(0, 300)), gameType: req.gameType, difficulty: req.difficulty, language: lang,
      estimatedMinutes: Math.max(4, Math.min(40, placed * 2 + 2)),
    },
    learning: {
      goal: clip(req.learningGoal, 320),
      objectives: gen.objectives,
      conclusion: clip(t(
        `You worked through ${placed} questions built from your own notes on “${req.subject}”. Revisit the explanations of anything that felt tricky — they quote your notes — and try again to beat your score.`,
        `עברתם ${placed} שאלות שנבנו מהפתקים שלכם על ״${req.subject}״. חיזרו להסברים של כל מה שהרגיש קשה — הם מצטטים את הפתקים שלכם — ונסו שוב לשפר את הציון.`,
      ), 700),
    },
    theme: { environment: env, timeOfDay: f.time },
    mechanics: twoAreas ? ["collect", "dialogue", "portals", "checkpoints"] : ["collect", "dialogue", "checkpoints"],
    areas, missions, challenges: gen.challenges,
  };
  const notes = [
    t("Built from your own material by the rule-based study engine — not by AI. Every question quotes your text, so check the material itself for accuracy.", "נבנה מהחומר שלכם בידי מנוע הלימוד מבוסס הכללים — לא בינה מלאכותית. כל שאלה מצטטת את הטקסט שלכם, ולכן כדאי לוודא את דיוק החומר עצמו."),
    t(`Found ${know.definitions.length} term(s), ${know.steps.length} list(s) of steps, ${know.facts.length} fact(s) with numbers and ${know.sentences.length} statement(s); made ${placed} challenge(s).`, `נמצאו ${know.definitions.length} מושגים, ${know.steps.length} רשימות שלבים, ${know.facts.length} עובדות עם מספרים ו-${know.sentences.length} משפטים; נוצרו ${placed} אתגרים.`),
  ];
  if (full && !twoAreas) notes.push(t("There was not enough material for a second area. Add more text to get a bigger adventure.", "לא היה מספיק חומר לאזור שני. הוסיפו עוד טקסט כדי לקבל הרפתקה גדולה יותר."));
  if (req.contentLanguage !== "he" && req.contentLanguage !== "en") notes.push(`The game's interface wording is in English; your material stays in its own language ("${req.contentLanguage}" was requested).`);
  return { raw, notes, stats: { challenges: placed, terms: know.definitions.length, steps: know.steps.length, facts: know.facts.length, statements: know.sentences.length } };
}

/** "Extend Existing Game" for material games: a new area built from additional material. */
export function buildMaterialExtension(base: GameSpec, req: GenerationRequest): { ext: GameExtension; notes: string[] } {
  const n = base.areas.length + 1;
  const { know, gen, lang } = prepare(req, 6, `x${n}-`);
  const t = translator(lang);
  const f = FLAVOUR[base.theme.environment];
  const index = 100 + n;
  const area = buildArea({
    index, id: `a-x${n}`, name: t(`${f.place[0]} · chapter ${n}`, `${f.place[1]} · פרק ${n}`),
    description: t("More questions, made from the extra material you added.", "עוד שאלות, שנבנו מהחומר הנוסף שהוספתם."),
    challenges: gen.challenges, flavour: f, lang, know, subject: base.meta.subject, withLore: true,
  });
  const missions = missionsFor({ area, index, challenges: gen.challenges, lang });
  const ext = {
    mechanics: ["collect", "dialogue"],
    objectives: gen.objectives,
    conclusion: clip(t(`${base.learning.conclusion} You also worked through ${gen.challenges.length} more questions from the material you added.`, `${base.learning.conclusion} עברתם גם ${gen.challenges.length} שאלות נוספות מהחומר שהוספתם.`), 700),
    areas: [area], missions, challenges: gen.challenges,
  } as unknown as GameExtension;
  return { ext, notes: [t("Extended with a new area built from the extra material (rule-based study engine, not AI).", "הורחב באזור חדש שנבנה מהחומר הנוסף (מנוע לימוד מבוסס כללים, לא בינה מלאכותית).")] };
}
