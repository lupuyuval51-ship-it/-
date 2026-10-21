import { beforeAll, describe, expect, it } from "vitest";
import { DIFFICULTIES } from "@/lib/game/spec/constants";
import { generateOffline } from "@/lib/offline/generate";
import { TOPICS, TOPIC_CATEGORIES, findTopic, searchTopics } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import { orderPrompt, rangeHint } from "@/lib/game/topics/build";
import { translator } from "@/lib/game/builders";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Topic library build and catalogue (wave 2, topics-1): range hints never hand over the answer, the two-option warm-up
 * keeps the wrong option the content lists last even when number options are sorted, generated sentences have one
 * full stop, ordering prompts read as sentences, a course chapter's last mission names both boards, and search ignores
 * the hyphens, maqaf, quotes and geresh that a keyboard types differently.
 */

const en = translator("en");
const he = translator("he");
// (in Hebrew "ל-10" is "to 10": the hyphen joins the prefix, it is not a minus)
const bounds = (text: string) => text.replace(/ל-/g, "ל ").match(/-?\d+(?:\.\d+)?/g)!.map(Number) as [number, number];

const request = (topicId: string, difficulty: string, lang: "he" | "en", mode: "FAST" | "FULL") =>
  ({ mode, subject: "ignored", learningGoal: "ignored", difficulty, gameType: "adventure", contentLanguage: lang, topicId });

describe("rangeHint", () => {
  it("never puts the answer on a bound (0 aside), so a round answer is not given away", () => {
    const values = [
      ...Array.from({ length: 400 }, (_, i) => i + 1), // 1…400, every round number among them
      450, 500, 550, 900, 1000, 1200, 1948, 2000, 3600, 6800, 10000, 32000, 100000, 1_000_000,
      0.5, 2.75, 9.5, 12.5, 99.9, 1234.5,
    ];
    for (const v of [...values, ...values.map((x) => -x)]) {
      for (const t of [en, he]) {
        const [lo, hi] = bounds(rangeHint(v, t, ""));
        expect(lo, `${v}`).toBeLessThan(v);
        expect(hi, `${v}`).toBeGreaterThan(v);
        // still a useful hint: never wider than three steps of the answer's size
        expect(hi - lo, `${v}`).toBeLessThanOrEqual(Math.max(10, 0.3 * Math.abs(v) + 30));
      }
    }
    const [lo0, hi0] = bounds(rangeHint(0, en, ""));
    expect([lo0, hi0]).toEqual([0, 10]);
  });

  it("gives round answers a window that is not centred on them", () => {
    expect(rangeHint(90, en, "degrees")).toBe("The answer is between 80 and 110 degrees.");
    expect(rangeHint(3600, en, "")).toBe("The answer is between 3400 and 3700.");
    expect(rangeHint(100, en, "")).toBe("The answer is between 80 and 110.");
    expect(rangeHint(45, en, "")).toBe("The answer is between 40 and 50."); // not round: unchanged
    for (const v of [10, 20, 30, 40, 90, 100, 360, 1000, 3600]) {
      const [lo, hi] = bounds(rangeHint(v, en, ""));
      expect((lo + hi) / 2, `${v}`).not.toBe(v);
    }
  });

  it("writes a negative upper bound in Hebrew without a double hyphen", () => {
    expect(rangeHint(-40, he, "")).toBe("התשובה בין -50 לבין -20.");
    expect(rangeHint(-15, he, "")).toBe("התשובה בין -20 לבין -10.");
    expect(rangeHint(-10, he, "")).toBe("התשובה בין -30 ל-0.");
    for (let v = -500; v <= 500; v += 7) expect(rangeHint(v, he, ""), `${v}`).not.toMatch(/--/);
  });
});

describe("the two-option warm-up of a question with number options", () => {
  // Number options are shown in ascending order; the warm-up must still keep the wrong option the content lists last
  // (the easiest to rule out), not whichever wrong number is now in the last place.
  const q = (prompt: string, answer: string, wrong: string[]) =>
    [[prompt, answer, wrong, `The answer is ${answer}, worked out step by step.`], [`שאלה: ${prompt}`, answer, wrong, `התשובה היא ${answer}, וזה החישוב.`]] as const;
  const level = {
    t: [
      ["numerator", "the number above the line", "מונה", "המספר שמעל הקו"],
      ["denominator", "the number below the line", "מכנה", "המספר שמתחת לקו"],
      ["fraction", "a part of a whole", "שבר", "חלק משלם"],
      ["whole", "all of something", "שלם", "כל הדבר"],
    ],
    q: [q("What is 3 × 4?", "12", ["14", "120", "2"]), q("What is 6 + 7?", "13", ["12", "67", "1"]), q("What is 9 − 4?", "5", ["4", "94", "13"])],
  } as const;
  const content = { b: level, i: level, a: level } as unknown as TopicContent;

  for (const lang of ["en", "he"] as const) it(`keeps the last-listed wrong option (${lang})`, () => {
    const { spec } = generateOffline(request("math-fractions", "beginner", lang, "FULL"), new Date(0), "A", content);
    const byId = new Map(spec.challenges.map((c) => [c.id, c]));
    const expected: Record<string, string> = { "12": "2", "13": "1", "5": "13" };
    let checked = 0;
    for (const c of spec.challenges) {
      if (c.type !== "choice" || !c.easierId || c.id.endsWith("-hard")) continue;
      const right = c.options.find((o) => o.id === c.correctOptionId)!.text;
      if (!(right in expected)) continue;
      const easy = byId.get(c.easierId)!;
      if (easy.type !== "choice") throw new Error("the warm-up of a choice question is a choice question");
      expect(easy.options.map((o) => o.text).sort(), c.prompt).toEqual([right, expected[right]!].sort());
      // still in ascending order, and the right answer is still the right one
      expect(easy.options.map((o) => Number(o.text))).toEqual([...easy.options.map((o) => Number(o.text))].sort((a, b) => a - b));
      expect(easy.options.find((o) => o.id === easy.correctOptionId)!.text).toBe(right);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe("ordering prompts", () => {
  it("follow a name with a colon, and a sentence with a sentence", () => {
    expect(orderPrompt("The water cycle", en)).toBe("The water cycle: put the steps in the right order.");
    expect(orderPrompt("A fair test: which material is waterproof?", en)).toBe("A fair test: which material is waterproof? Put the steps in the right order.");
    expect(orderPrompt("מבחן הוגן: איזה חומר אטום למים?", he)).toBe("מבחן הוגן: איזה חומר אטום למים? סדרו את השלבים בסדר הנכון.");
    expect(orderPrompt("“By the time the police arrived, the thief had run away.” Put the events in order.", en)).toBe("“By the time the police arrived, the thief had run away.” Put the events in order.");
  });
});

describe("generated text in every topic game", () => {
  const contents = new Map<string, TopicContent>();
  beforeAll(async () => {
    for (const t of TOPICS) contents.set(t.id, (await loadTopicContent(t.id))!);
  }, 120_000);

  const DOUBLE_STOP = /(?:[?!…:]|[^.]\.)\.$/; // "Who called you?." · "a.m. or p.m.." · "0.333…." (but "…" alone is fine)

  for (const cat of TOPIC_CATEGORIES) it(`term explanations and feedback end with one full stop, and no ordering prompt has a stray colon (${cat})`, () => {
    let games = 0;
    const topics = TOPICS.filter((x) => x.cat === cat);
    for (const t of topics) {
      DIFFICULTIES.forEach((d, di) => {
        const lang = (di + games) % 2 ? "he" : "en";
        const { spec } = generateOffline(request(t.id, d, lang, "FULL"), new Date(0), "A", contents.get(t.id)!);
        games++;
        for (const c of spec.challenges) {
          const named = c.title.startsWith("Name the term") || c.title.startsWith("What does it mean") || c.title.startsWith("איך קוראים לזה") || c.title.startsWith("מה זה אומר");
          if (named) expect(c.explanation, `${t.id}/${d}/${lang}: ${c.id}`).not.toMatch(DOUBLE_STOP);
          if (named && c.type === "choice") for (const o of c.options) expect(o.feedback, `${t.id}/${d}/${lang}: ${c.id}`).not.toMatch(DOUBLE_STOP);
          if (c.type === "sequence") expect(c.prompt, `${t.id}/${d}/${lang}: ${c.id}`).not.toMatch(/[.?!…]:/);
        }
      });
    }
    expect(games).toBe(topics.length * 3);
  }, 120_000);

  it("the meaning of a term that is a question keeps its own question mark", () => {
    const { spec } = generateOffline(request("lang-en-questions", "advanced", "en", "FULL"), new Date(0), "A", contents.get("lang-en-questions")!);
    const texts = spec.challenges.flatMap((c) => [c.explanation, ...(c.type === "choice" ? c.options.map((o) => o.feedback) : [])]);
    expect(texts.some((s) => /\?$/.test(s))).toBe(true);
    expect(texts.some((s) => /\?\.$/.test(s))).toBe(false);
  });

  it("the second area of a course chapter asks to read the task and the key ideas, and names both", () => {
    for (const lang of ["en", "he"] as const) {
      const { spec } = generateOffline(request("course-fractions-1", "intermediate", lang, "FULL"), new Date(0), "A", contents.get("course-fractions-1")!);
      const last = spec.missions.find((m) => m.id === "m-2-2")!;
      const visit = last.objectives.find((o) => o.type === "visit");
      if (!visit || visit.type !== "visit") throw new Error("the last mission has a visit objective");
      const kinds = visit.stationIds.map((id) => (id.endsWith("-task") ? "task" : id.endsWith("-lore") ? "lore" : id));
      expect(kinds.sort()).toEqual(["lore", "task"]);
      expect(visit.text).toBe(lang === "en" ? "Read the hands-on task and the key ideas" : "קראו את המשימה המעשית ואת הרעיונות המרכזיים");
    }
  });
});

describe("topic search", () => {
  const ids = (q: string) => searchTopics(q).map((t) => t.id);

  it("ignores hyphens, the maqaf, quotes and the geresh as a keyboard types them", () => {
    expect(findTopic("math-inequalities")!.he[0]).toContain("אי־שוויונות");
    expect(ids("אי-שוויונות")).toContain("math-inequalities"); // hyphen for the maqaf
    expect(ids("אי שוויונות")).toContain("math-inequalities");
    expect(ids('נאס"א')).toContain("history-space-race"); // " for ״
    expect(ids("ג'ינגיס חאן")).toContain("history-mongol-empire"); // ' for ׳
    expect(ids("newtons laws")).toContain("science-forces"); // Newton's
    expect(ids("two-factor")).toContain("cs-cybersecurity");
    expect(ids("two factor")).toContain("cs-cybersecurity");
  });

  it("still matches across languages, ignores niqqud and case, and filters by category", () => {
    expect(ids("שָׁבְרִים")).toContain("math-fractions");
    expect(ids("FRACTIONS")).toContain("math-fractions");
    expect(searchTopics("", "math").every((t) => t.cat === "math")).toBe(true);
    expect(searchTopics("-").length).toBe(TOPICS.length);
    expect(ids("zzzz-no-such-topic")).toEqual([]);
    expect(searchTopics("fractions", "history").map((t) => t.id)).not.toContain("math-fractions");
  });
});
