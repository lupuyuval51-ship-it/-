import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { LevelContent, Question, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 7, G1: nine topics (programming basics, programming languages, video game history, word processing, English adverbs,
 * articles and plurals, body and health, comparatives, conditionals) had items that showed the short answer of a choice
 * question of the same level, which a game shows together: term meanings with the answer as an example ("slowly, carefully or
 * loudly", "cats, boxes", "child → children", "an hour, a university", "happy → happier", "much bigger", "less expensive",
 * "well (from good), fast or hard", "a typed name", "true or false", "coin-operated", "a virtual machine runs"), number prompts
 * that listed it ("play outside happily", "well, quickly, fast, hard", "knew, were, … had", "counted from 0", "Python first
 * released"), orderings that named it ("Super Mario Bros.", "Pick PDF", "(input)", "Wii controllers follow the players'
 * movements") and other questions ("An elephant is ___ than a dog" next to the "than" question, "If I had more time" next to
 * "If I ___ a million dollars"). Those items were reworded or replaced, keeping both languages in step and every fact right.
 *
 * Kept on purpose: tests/unit/w4-C36-english-content.test.ts pins the comparatives questions about "than", "as … as", "less"
 * and "much", so the terms that gave them away changed instead (the "than" term became "Syllable", "as … as" became
 * "Equal comparison", "much / a lot" became "Intensifier").
 */

const IDS = [
  "cs-programming-basics", "cs-programming-languages", "cs-video-game-history", "cs-word-processing", "lang-en-adverbs",
  "lang-en-articles-plurals", "lang-en-body-health", "lang-en-comparatives", "lang-en-conditionals",
] as const;
const LEVELS = ["b", "i", "a"] as const;

/** Mentions of an answer elsewhere in its level that stay because they do not answer the question. */
const KEPT: readonly string[] = [
  // the term label is the concept the question asks the learner to apply; its meaning no longer gives the example away
  "cs-programming-basics/b/en/input", "cs-programming-basics/b/he/קלט",
  "cs-programming-basics/i/en/A string", "cs-programming-basics/i/he/מחרוזת",
  "lang-en-conditionals/b/en/unless", "lang-en-conditionals/b/he/unless",
  // x = 5 + 2: a 7 elsewhere (the integer example, the "7" string question) says nothing about the sum
  "cs-programming-basics/i/en/7", "cs-programming-basics/i/he/7",
  // the list [10, 20, 30] is the data of both index questions
  "cs-programming-basics/a/en/30", "cs-programming-basics/a/he/30",
  // the JVM question names Java; it says nothing about checking types
  "cs-programming-languages/a/en/Java", "cs-programming-languages/a/he/Java",
  // the ordering also lists Pong and Tetris, two of the wrong options
  "cs-video-game-history/b/en/Pac-Man", "cs-video-game-history/b/he/פקמן",
  // all four options are listed together
  "lang-en-adverbs/b/en/When?", "lang-en-adverbs/b/en/Where?",
  "lang-en-adverbs/i/en/never", "lang-en-adverbs/i/he/never",
  "lang-en-articles-plurals/a/en/an hour", "lang-en-articles-plurals/a/he/an hour",
  // "to get over", "means to faint": not after allergic
  "lang-en-body-health/a/en/to", "lang-en-body-health/a/he/to",
  // the label names both less and least (both are options); the question is about the one that goes before than
  "lang-en-comparatives/a/en/less", "lang-en-comparatives/a/he/less",
];

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

function question(lv: LevelContent, text: string): Question {
  const found = (lv.q ?? []).find(([en]) => en[0].includes(text));
  if (!found) throw new Error(`no question with "${text}"`);
  return found;
}

/** Every text a learner sees in a level besides the choice question `skip`, in one language. */
function visibleTexts(lv: LevelContent, lang: 0 | 1, skip?: number): string[] {
  return [
    ...(lv.q ?? []).filter((_, i) => i !== skip).map((pair) => pair[lang][0]),
    ...(lv.n ?? []).map((n) => (lang === 0 ? n[1] : n[2])[0]),
    ...(lv.s ?? []).flatMap((s) => s[lang]),
    ...(lv.t ?? []).flatMap((t) => (lang === 0 ? [t[0], t[1]] : [t[2], t[3]])),
  ];
}

const norm = (s: string) => s.toLowerCase().replace(/^(the|a|an)\s+/, "").replace(/[.,;:!?"“”״׳']/g, "").trim();
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Whether `needle` appears in `hay` as a whole word or phrase. */
const hasWord = (hay: string, needle: string) => new RegExp(`(^|[^\\p{L}\\p{N}])${escape(needle)}($|[^\\p{L}\\p{N}])`, "u").test(hay);
const all = (lv: LevelContent, lang: 0 | 1) => visibleTexts(lv, lang).join(" | ");
/** The terms, numbers and orderings of a level (no choice questions), in one language. */
const nonQuestion = (lv: LevelContent, lang: 0 | 1) => visibleTexts({ ...lv, q: [] }, lang).join(" | ");

describe("G1 topics: full levels, both languages in step", () => {
  it("are all in the catalogue", () => {
    for (const id of IDS) expect(findTopic(id), id).toBeTruthy();
  });

  it.each(IDS)("%s: every level has 8+ items, 4+ of them questions, numbers or orderings", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      const active = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
      expect(active + (lv.t?.length ?? 0), `${id}/${l}`).toBeGreaterThanOrEqual(8);
      expect(active, `${id}/${l}`).toBeGreaterThanOrEqual(4);
    }
  });

  it.each(IDS)("%s: same shape in he and en, 40+ character explanations, no < or > in Hebrew, length tell at most 40 %%", async (id) => {
    const c = await load(id);
    const longest = [0, 0], count = [0, 0];
    for (const l of LEVELS) {
      for (const pair of c[l].q ?? []) {
        expect(pair[0][2].length, `${id}/${l}: ${pair[0][0]}`).toBe(pair[1][2].length);
        pair.forEach(([q, answer, wrong, explanation], lang) => {
          expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
          count[lang]!++;
          if (answer.length > Math.max(...wrong.map((w) => w.length))) longest[lang]!++;
        });
        for (const s of [pair[1][0], pair[1][1], ...pair[1][2], pair[1][3]]) expect(s, `${id}/${l}`).not.toMatch(/[<>]/);
      }
      for (const [answer, en, he] of c[l].n ?? []) for (const [q, , explanation] of [en, he]) {
        expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
        expect([String(answer), answer.toLocaleString("en-US")].some((w) => explanation.includes(w)), `${id}/${l}: ${q}`).toBe(true);
        expect(he[0] + he[2], `${id}/${l}`).not.toMatch(/[<>]/);
      }
      for (const [en, he] of c[l].s ?? []) expect(he.length, `${id}/${l}: ${en[0]}`).toBe(en.length);
      for (const [, , heTerm, heMeaning] of c[l].t ?? []) expect(heTerm + heMeaning, `${id}/${l}`).not.toMatch(/[<>]/);
    }
    expect(longest[0]! / count[0]!, `${id} en`).toBeLessThanOrEqual(0.4);
    expect(longest[1]! / count[1]!, `${id} he`).toBeLessThanOrEqual(0.4);
  });
});

describe("G1 topics: no item shows the answer of a choice question of its level", () => {
  it.each(IDS)("%s: no answer appears as a word in another item of the same level", async (id) => {
    const c = await load(id);
    const found: string[] = [];
    for (const l of LEVELS) for (const lang of [0, 1] as const) {
      (c[l].q ?? []).forEach((pair, qi) => {
        const answer = pair[lang][1];
        if (visibleTexts(c[l], lang, qi).some((t) => hasWord(norm(t), norm(answer)))) found.push(`${id}/${l}/${lang ? "he" : "en"}/${answer}`);
      });
    }
    expect(found.filter((f) => !KEPT.includes(f))).toEqual([]);
  });

  it("programming basics: input and output, Booleans, strings and counting from 0 are no longer spelled out", async () => {
    const c = await load("cs-programming-basics");
    expect(question(c.b, "Typing your name")[0][1]).toBe("input");
    expect(question(c.b, "output from a program")[0][1]).toBe("A message shown on the screen");
    expect(all(c.b, 0)).not.toMatch(/typed name|on the screen|\((input|output)\)/);
    expect(all(c.b, 1)).not.toMatch(/שם מוקלד|על המסך|\((קלט|פלט)\)/);
    expect(question(c.i, "is a Boolean")[0][1]).toBe("true");
    expect(all(c.i, 0)).not.toMatch(/\btrue\b/);
    expect(question(c.i, "written with quotation marks")[0][1]).toBe("A string");
    const str = (c.i.t ?? []).find((t) => t[0] === "String")!;
    expect(str[1] + str[3]).not.toMatch(/quot|מירכאות/);
    expect(question(c.a, "first item of the list")[0][1]).toBe("0");
    expect(c.a.n![0]![0]).toBe(5 - 1);
    expect(c.a.n![0]![1][0] + c.a.n![0]![2][0]).not.toMatch(/from 0|מ־0/);
    const param = (c.a.t ?? []).find((t) => t[0] === "Parameter")!;
    expect(param[1]).not.toMatch(/passed/);
  });

  it("programming languages: the language question answers Java; bytecode and the type question no longer point the way", async () => {
    const c = await load("cs-programming-languages");
    const [en, he] = question(c.b, "Which of these is a programming language?");
    expect([en[1], he[1]]).toEqual(["Java", "Java"]);
    expect(all(c.b, 0)).not.toMatch(/\bJava\b/);
    expect(c.b.n![0]![0]).toBe(1991);
    const bytecode = (c.a.t ?? []).find((t) => t[0] === "Bytecode")!;
    expect(bytecode[1] + bytecode[3]).not.toMatch(/virtual machine|וירטואלית/i);
    expect(question(c.a, "What runs that bytecode?")[0][1]).toBe("The Java Virtual Machine (JVM)");
    const [types, typesHe] = question(c.a, "checks the types of its variables");
    expect(types[1]).toBe("Java");
    expect(types[0] + typesHe[0]).not.toMatch(/compiled|הידור/);
  });

  it("video game history: the ordering has no Mario, the arcade has no coin, the Wii step does not say how it is played", async () => {
    const c = await load("cs-video-game-history");
    expect(question(c.b, "Donkey Kong")[0][1]).toBe("Mario");
    const [order, orderHe] = c.b.s![0]!;
    expect(order.slice(1)).toEqual(["Pong", "Pac-Man", "Tetris", "Minecraft"]);
    expect(orderHe.slice(1)).toEqual(["פונג", "פקמן", "טטריס", "מיינקראפט"]);
    expect(question(c.b, "arcade machine to play")[0][1]).toBe("A coin");
    expect(all(c.b, 0)).not.toMatch(/coin/i);
    expect(all(c.b, 1)).not.toMatch(/מטבע/);
    expect(question(c.a, "Wii")[0][1]).toMatch(/sensed movement/);
    expect(c.a.s![0]![0].join(" ")).not.toMatch(/movement|swing/i);
    expect(c.a.s![0]![1].join(" ")).not.toMatch(/תנוע/);
  });

  it("word processing: the PDF question asks why a PDF looks the same, so no ordering step or term answers it", async () => {
    const c = await load("cs-word-processing");
    const [en, he] = question(c.a, "save your project as a PDF");
    expect(en[1]).toBe("The fonts and page layout are stored in the file");
    expect(he[1]).toBe("הגופנים והפריסה של העמודים שמורים בתוך הקובץ");
    for (const pair of c.a.q ?? []) expect(pair[0][1]).not.toBe("PDF");
    expect(all(c.a, 0)).not.toMatch(/stored in the file/);
  });

  it("adverbs: the examples no longer give carefully, loudly, happily, well, fast, hard or the whole sentence", async () => {
    const c = await load("lang-en-adverbs");
    for (const lang of [0, 1] as const) {
      expect(nonQuestion(c.b, lang)).not.toMatch(/\b(carefully|loudly|happily)\b/);
      expect(nonQuestion(c.i, lang)).not.toMatch(/\b(well|fast|hard)\b/);
    }
    expect(question(c.i, "plays the piano very")[0][1]).toBe("well");
    expect(c.i.n![0]![0]).toBe(3);
    expect(c.i.n![0]![1][0]).toBe("How many of these adverbs do NOT end in -ly: soon, quickly, here, often, softly?");
    const comment = (c.a.t ?? []).find((t) => t[0] === "Comment adverb")!;
    expect(comment[1] + comment[3]).not.toMatch(/sentence|fortunately|luckily|משפט/);
    expect(question(c.a, "What does fortunately describe?")[0][1]).toBe("the whole sentence");
  });

  it("articles and plurals: boxes, children, information, an hour and scissors are no longer the examples", async () => {
    const c = await load("lang-en-articles-plurals");
    for (const lang of [0, 1] as const) {
      expect(all(c.b, lang)).not.toMatch(/\b(boxes|foxes)\b/);
      expect(all(c.i, lang)).not.toMatch(/\bchildren\b/);
      expect((c.i.t ?? []).map((t) => t[1 + 2 * lang]).join(" ")).not.toMatch(/\binformation\b/);
      expect((c.a.t ?? []).map((t) => t[1 + 2 * lang]).join(" ")).not.toMatch(/\b(hour|university|scissors)\b/);
    }
    expect(c.b.n![0]![0]).toBe(2);
    expect(c.b.n![0]![1][0]).toContain("a bus, two cups and three pencils");
    expect(question(c.a, "Which phrase uses a or an correctly?")[0][1]).toBe("an hour");
  });

  it("body and health: sprain no longer says hurt", async () => {
    const c = await load("lang-en-body-health");
    expect(question(c.i, "fell off my bike")[0][1]).toBe("hurt");
    const sprain = (c.i.t ?? []).find((t) => t[0] === "sprain")!;
    expect(sprain[1]).not.toMatch(/\bhurt\b/);
  });

  it("comparatives: than, as, bigger, happier, much and the double comparative are no longer spelled out", async () => {
    const c = await load("lang-en-comparatives");
    for (const lang of [0, 1] as const) {
      expect(all(c.b, lang)).not.toMatch(/\bbigger\b/);
      // "than" now appears only in the cheetah question itself
      expect(visibleTexts(c.b, lang, (c.b.q ?? []).findIndex((p) => p[0][0].includes("cheetah"))).join(" ")).not.toMatch(/\bthan\b/);
      expect((c.i.t ?? []).map((t) => `${t[2 * lang]} ${t[1 + 2 * lang]}`).join(" ")).not.toMatch(/\bas\b|happier/);
      expect((c.a.t ?? []).map((t) => `${t[2 * lang]} ${t[1 + 2 * lang]}`).join(" ")).not.toMatch(/\bmuch\b|less expensive|the better/);
    }
    expect(question(c.b, "blue whale")[0][1]).toBe("bigger");
    expect(question(c.b, "cheetah")[0][1]).toBe("than");
    expect(question(c.i, "as heavy ___ yours")[0][1]).toBe("as");
    expect(question(c.a, "easier than I expected")[0][1]).toBe("much");
  });

  it("conditionals: the number prompt and the 'what does it tell you' question no longer show had or were", async () => {
    const c = await load("lang-en-conditionals");
    expect(question(c.i, "a million dollars")[0][1]).toBe("had");
    expect(question(c.i, "If I ___ you")[0][1]).toBe("were");
    expect(question(c.i, "I wish I ___ a dog")[0][1]).toBe("had");
    for (const lang of [0, 1] as const) {
      const others = (c.i.q ?? []).filter((p) => !/a million dollars|If I ___ you|I wish I ___ a dog/.test(p[0][0])).map((p) => p[lang][0]);
      const number = c.i.n!.map((n) => (lang === 0 ? n[1] : n[2])[0]);
      expect([...others, ...number].join(" ")).not.toMatch(/\b(had|were)\b/);
    }
    expect(c.i.n![0]![0]).toBe(3);
    expect(question(c.i, "If I knew the answer")[0][1]).toBe("The speaker doesn't know the answer now.");
  });
});
