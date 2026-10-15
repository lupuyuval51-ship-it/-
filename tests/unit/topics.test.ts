import { beforeAll, describe, expect, it } from "vitest";
import { DIFFICULTIES, SPEC_LIMITS } from "@/lib/game/spec/constants";
import { generateOffline, generateOfflineWithProgress } from "@/lib/offline/generate";
import { generationRequestSchema } from "@/lib/schemas/generation";
import { playThrough } from "@/lib/game/world/flow";
import { findOutliers, simulate } from "@/lib/game/sim-balance/run";
import type { CorpusItem } from "@/lib/game/sim-balance/corpus";
import { TOPICS, TOPIC_CATEGORIES, findTopic, searchTopics } from "@/lib/game/topics/catalog";
import { TOPIC_LOADERS, loadTopicContent } from "@/lib/game/topics/loaders";
import { numberValue, rangeHint } from "@/lib/game/topics/build";
import { translator } from "@/lib/game/demo/builders";
import type { GameSpec } from "@/lib/game/spec/schema";
import type { LevelContent, TopicContent } from "@/lib/game/topics/types";

/**
 * The topic library: the catalogue, the content of every topic and every game it builds. Kept in step with the real
 * number of topics that exist (the catalogue never lists a topic without content).
 */
const EXPECTED_TOPICS = 201;

const contents = new Map<string, TopicContent>();
beforeAll(async () => {
  for (const t of TOPICS) contents.set(t.id, (await loadTopicContent(t.id))!);
});

const HEBREW = /\p{Script=Hebrew}/u;
const LETTER = /\p{L}/u;
const sameKey = (s: string) => s.toLowerCase().replace(/[\p{P}\p{S}\s]+/gu, " ").trim();
const LEVELS = ["b", "i", "a"] as const;
/** The term as whole words in the text (Hebrew may glue up to two prefix letters such as ה, ו, ב, ל, מ, ש, כ to it). */
const namesTerm = (text: string, term: string) => {
  const esc = sameKey(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^\\p{L}])(?:[והבלמשכ]{0,2})${esc}(?![\\p{L}])`, "u").test(sameKey(text));
};

/** Every text of a level, by language. */
function textsOf(level: LevelContent): { en: string[]; he: string[] } {
  const en: string[] = [], he: string[] = [];
  // Hebrew terms and options may be English on purpose (an English-grammar topic asks about English sentences), so on the
  // Hebrew side only the explaining text is checked; on the English side everything is.
  for (const [a, b, c, d] of level.t ?? []) { en.push(a, b); he.push(d); void c; }
  for (const [e, h] of level.q ?? []) {
    en.push(e[0], e[1], ...e[2], e[3], ...(e[4] ? [e[4]] : []));
    he.push(h[0], h[3], ...(h[4] ? [h[4]] : []));
  }
  for (const [, e, h] of level.n ?? []) {
    en.push(e[0], e[2], ...(e[3] ? [e[3]] : []), ...(e[1] ? [e[1]] : []));
    he.push(h[0], h[2], ...(h[3] ? [h[3]] : []), ...(h[1] ? [h[1]] : []));
  }
  for (const [e, h] of level.s ?? []) { en.push(...e); he.push(...h); }
  return { en, he };
}

describe("topic catalogue", () => {
  it(`has exactly ${EXPECTED_TOPICS} topics with unique, safe ids`, () => {
    expect(TOPICS.length).toBe(EXPECTED_TOPICS);
    const ids = TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]{2,39}$/);
  });

  it("every topic has he + en titles and descriptions, a valid category and an age range", () => {
    for (const t of TOPICS) {
      expect(TOPIC_CATEGORIES).toContain(t.cat);
      for (const [title, desc] of [t.en, t.he]) {
        expect(title.trim().length).toBeGreaterThan(2);
        expect(title.length).toBeLessThanOrEqual(60);
        expect(desc.trim().length).toBeGreaterThan(15);
        expect(desc.length).toBeLessThanOrEqual(200);
      }
      expect(HEBREW.test(t.he[0]) && HEBREW.test(t.he[1])).toBe(true);
      for (const s of [...t.en, ...t.he]) expect(/[\u0000-\u001F\u007F‎‏‪-‮⁦-⁩]/.test(s), `${t.id}: "${s}"`).toBe(false);
      expect(HEBREW.test(t.en[0]) || HEBREW.test(t.en[1])).toBe(false);
      expect(t.ages[0]).toBeGreaterThanOrEqual(6);
      expect(t.ages[1]).toBeLessThanOrEqual(18);
      expect(t.ages[0]).toBeLessThan(t.ages[1]);
    }
    expect(new Set(TOPICS.map((t) => sameKey(t.en[0]))).size).toBe(TOPICS.length);
    expect(new Set(TOPICS.map((t) => sameKey(t.he[0]))).size).toBe(TOPICS.length);
  });

  it("every listed topic has a lazily loaded module, and every module is listed", () => {
    expect(Object.keys(TOPIC_LOADERS).sort()).toEqual(TOPICS.map((t) => t.id).sort());
  });

  it("every topic has all three levels with enough content for a full game", () => {
    for (const t of TOPICS) {
      const c = contents.get(t.id)!;
      for (const l of LEVELS) {
        const lv = c[l];
        expect(lv, `${t.id}/${l}`).toBeDefined();
        const terms = lv.t?.length ?? 0;
        const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
        // enough for a two-area Full Adventure: terms give name / meaning / match questions
        expect(terms + items, `${t.id}/${l}`).toBeGreaterThanOrEqual(6);
        expect(items, `${t.id}/${l}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("the request schema accepts catalogue ids only and never with material or as an extension", () => {
    const base = { mode: "FAST", subject: "x", learningGoal: "y", difficulty: "beginner", gameType: "adventure", contentLanguage: "en" };
    expect(generationRequestSchema.safeParse({ ...base, topicId: TOPICS[0]!.id }).success).toBe(true);
    for (const bad of ["../etc/passwd", "math-nope", "", "x".repeat(80)]) expect(generationRequestSchema.safeParse({ ...base, topicId: bad }).success).toBe(false);
    expect(generationRequestSchema.safeParse({ ...base, topicId: TOPICS[0]!.id, material: "some notes that are long enough to count" }).success).toBe(false);
    expect(generationRequestSchema.safeParse({ ...base, mode: "EXTEND", targetGameId: "g1", topicId: TOPICS[0]!.id }).success).toBe(false);
  });

  it("search finds topics in both languages and by category", () => {
    const first = TOPICS[0]!;
    expect(searchTopics(first.en[0].toUpperCase())).toContain(first);
    expect(searchTopics(first.he[0])).toContain(first);
    expect(searchTopics("", first.cat).every((t) => t.cat === first.cat)).toBe(true);
    expect(searchTopics("zzzz-no-such-topic")).toEqual([]);
    expect(findTopic("nope")).toBeUndefined();
  });
});

describe("topic content hygiene", () => {
  it("no empty strings; Hebrew text is Hebrew and English text has no Hebrew", () => {
    for (const t of TOPICS) {
      for (const l of LEVELS) {
        const { en, he } = textsOf(contents.get(t.id)![l]);
        for (const s of [...en, ...he]) expect(s.trim().length, `${t.id}/${l}: "${s}"`).toBeGreaterThan(0);
        // no control or bidi-override characters (the spec validator rejects them)
        for (const s of [...en, ...he]) expect(/[\u0000-\u001F\u007F‎‏‪-‮⁦-⁩]/.test(s), `${t.id}/${l}: "${s}"`).toBe(false);
        // (a topic about Hebrew grammar quotes Hebrew words in its English version)
        if (!t.id.startsWith("lang-he-")) for (const s of en) expect(HEBREW.test(s), `${t.id}/${l} en: "${s}"`).toBe(false);
        // symbols and numbers ("25%", "3/4") are the same in both languages; anything with letters must be Hebrew
        for (const s of he) if (LETTER.test(s.replace(/[A-Za-z]+/g, (w) => (w.length <= 6 ? "" : w)))) expect(HEBREW.test(s), `${t.id}/${l} he: "${s}"`).toBe(true);
      }
    }
  });

  it("questions have distinct options, the answer is never a wrong option, and both languages match in shape", () => {
    for (const t of TOPICS) {
      for (const l of LEVELS) {
        for (const pair of contents.get(t.id)![l].q ?? []) {
          for (const [q, answer, wrong, explanation] of pair) {
            const keys = [answer, ...wrong].map((o) => o.trim().toLowerCase().replace(/\s+/g, " "));
            expect(new Set(keys).size, `${t.id}/${l}: ${q}`).toBe(keys.length);
            expect(wrong.length, `${t.id}/${l}: ${q}`).toBeGreaterThanOrEqual(1);
            expect(wrong.length).toBeLessThanOrEqual(4);
            expect(q.length).toBeLessThanOrEqual(600);
            expect(explanation.length).toBeLessThanOrEqual(600);
            for (const o of [answer, ...wrong]) expect(o.length).toBeLessThanOrEqual(220);
          }
          expect(pair[0][2].length, `${t.id}/${l}: ${pair[0][0]}`).toBe(pair[1][2].length);
        }
      }
    }
  });

  it("terms: a meaning never names its own term, and no two terms or meanings repeat in a topic", () => {
    for (const t of TOPICS) {
      const c = contents.get(t.id)!;
      const all = LEVELS.flatMap((l) => c[l].t ?? []);
      for (const [en, enM, he, heM] of all) {
        expect(namesTerm(enM, en), `${t.id}: ${en}`).toBe(false);
        expect(namesTerm(heM, he), `${t.id}: ${he}`).toBe(false);
        expect(en.length).toBeLessThanOrEqual(60);
        expect(he.length).toBeLessThanOrEqual(60);
        expect(enM.length).toBeLessThanOrEqual(140);
        expect(heM.length).toBeLessThanOrEqual(140);
      }
      for (const i of [0, 1, 2, 3]) {
        const keys = all.map((x) => sameKey(x[i]!));
        expect(new Set(keys).size, `${t.id}: duplicate term/meaning`).toBe(keys.length);
      }
    }
  });

  it("no duplicated or near-duplicate questions inside a topic", () => {
    for (const t of TOPICS) {
      const c = contents.get(t.id)!;
      for (const lang of [0, 1] as const) {
        const prompts = LEVELS.flatMap((l) => [...(c[l].q ?? []).map((p) => p[lang][0]), ...(c[l].n ?? []).map((n) => n[lang + 1 as 1 | 2][0])]).map((s) => s.toLowerCase().replace(/\s+/g, " ").replace(/[.?!:,;״"“”]+/g, "").trim()); // symbols stay: "2 + 3 × 4" and "(2 + 3) × 4" are different questions
        expect(new Set(prompts).size, `${t.id}`).toBe(prompts.length);
      }
    }
  });

  it("numeric answers are finite, appear in their explanation, and carry a unit in both languages or in neither", () => {
    for (const t of TOPICS) {
      for (const l of LEVELS) {
        for (const [answer, en, he, tol] of contents.get(t.id)![l].n ?? []) {
          expect(Number.isFinite(answer)).toBe(true);
          expect(tol ?? 0).toBeGreaterThanOrEqual(0);
          expect(Boolean(en[1])).toBe(Boolean(he[1]));
          expect(en[1].length).toBeLessThanOrEqual(12);
          expect(he[1].length).toBeLessThanOrEqual(12);
          const written = [String(answer), answer.toLocaleString("en-US")];
          for (const [lang, text] of [["en", en[2]], ["he", he[2]]] as const) expect(written.some((w) => text.includes(w)), `${t.id}/${l} ${lang}: ${en[0]} → ${answer}`).toBe(true);
        }
      }
    }
  });

  it("orderings have 3–6 steps, the same number in both languages, and no repeated step", () => {
    for (const t of TOPICS) {
      for (const l of LEVELS) {
        for (const [en, he] of contents.get(t.id)![l].s ?? []) {
          expect(en.length).toBe(he.length);
          expect(en.length - 1).toBeGreaterThanOrEqual(3);
          expect(en.length - 1).toBeLessThanOrEqual(6);
          for (const steps of [en.slice(1), he.slice(1)]) {
            expect(new Set(steps.map(sameKey)).size).toBe(steps.length);
            for (const s of steps) expect(s.length).toBeLessThanOrEqual(180);
          }
        }
      }
    }
  });

  it("number helpers read fractions, mixed numbers and percentages, and range hints contain the answer", () => {
    expect(numberValue("3/4")).toBe(0.75);
    expect(numberValue("1 1/2")).toBe(1.5);
    expect(numberValue("40%")).toBe(40);
    expect(numberValue("1,200")).toBe(1200);
    expect(Number.isNaN(numberValue("abc"))).toBe(true);
    const t = translator("en");
    for (const n of [0, 3, 7, 45, 100, 1948, 0.5, 2.75, -4]) {
      const [lo, hi] = rangeHint(n, t, "").match(/-?\d+(?:\.\d+)?/g)!.map(Number);
      expect(n).toBeGreaterThanOrEqual(lo!);
      expect(n).toBeLessThanOrEqual(hi!);
    }
  });
});

// ───────────────────────────── games ─────────────────────────────

const request = (topicId: string, difficulty: string, lang: "he" | "en", mode: "FAST" | "FULL", gameType = "adventure") =>
  ({ mode, subject: "ignored", learningGoal: "ignored", difficulty, gameType, contentLanguage: lang, topicId });

function checkGame(spec: GameSpec, label: string) {
  expect(spec.meta.generator, label).toMatchObject({ kind: "catalog", provider: "topic-library" });
  const ids = spec.challenges.map((c) => c.id);
  expect(new Set(ids).size, label).toBe(ids.length);
  expect(spec.challenges.length).toBeLessThanOrEqual(SPEC_LIMITS.challenges);
  const placed = spec.areas.flatMap((a) => a.stations).filter((s) => s.kind === "challenge").map((s) => (s as { challengeId: string }).challengeId);
  expect(new Set(placed).size, label).toBe(placed.length);
  const variants = new Set(spec.challenges.flatMap((c) => [c.easierId, c.harderId]).filter(Boolean));
  for (const c of spec.challenges) expect(placed.includes(c.id) !== variants.has(c.id), `${label}: ${c.id} placed exactly once or a variant`).toBe(true);
  expect(playThrough(spec).finished, label).toBe(true);
}

describe("every topic builds a valid, finishable game at every level", () => {
  it("FAST in both languages, FULL in one language per level (alternating), at tier A", () => {
    let n = 0;
    for (const t of TOPICS) {
      const c = contents.get(t.id)!;
      DIFFICULTIES.forEach((d, di) => {
        for (const lang of ["en", "he"] as const) {
          const fast = generateOffline(request(t.id, d, lang, "FAST"), new Date(0), "A", c).spec;
          checkGame(fast, `${t.id}/${d}/${lang}/FAST`);
          expect(fast.meta.difficulty).toBe(d);
          expect(fast.meta.language).toBe(lang);
          expect(fast.meta.subject).toBe(lang === "he" ? t.he[0] : t.en[0]);
          n++;
        }
        const lang = (di + n) % 2 ? "he" : "en";
        const full = generateOffline(request(t.id, d, lang, "FULL"), new Date(0), "A", c).spec;
        checkGame(full, `${t.id}/${d}/${lang}/FULL`);
        expect(full.areas.length, `${t.id}/${d}`).toBe(2);
        expect(full.bosses.length).toBeGreaterThan(0);
        // the game rises within the chosen level
        const levels = full.challenges.filter((ch) => !ch.id.endsWith("-easy") && !ch.id.endsWith("-hard")).map((ch) => ch.level);
        expect(Math.max(...levels)).toBeGreaterThanOrEqual(d === "beginner" ? 2 : 3);
      });
    }
  });

  it("the tier clamp holds for B and C, and a phone request is fitted", () => {
    for (const t of TOPICS) {
      const c = contents.get(t.id)!;
      for (const d of DIFFICULTIES) {
        const b = generateOffline(request(t.id, d, "he", "FULL", "platformer"), new Date(0), "B", c).spec;
        checkGame(b, `${t.id}/${d}/B`);
        expect(b.meta.featureTier).toBe("B");
        expect(b.challenges.some((ch) => ch.easierId || ch.harderId)).toBe(false);
        const cc = generateOffline({ ...request(t.id, d, "en", "FAST", "exploration"), device: "phone" }, new Date(0), "C", c).spec;
        checkGame(cc, `${t.id}/${d}/C`);
        expect(cc.meta.featureTier).toBe("C");
        expect(cc.challenges.every((ch) => ch.type !== "match")).toBe(true);
        expect(cc.challenges.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("is deterministic and the levels really differ", () => {
    const t = TOPICS[0]!;
    const c = contents.get(t.id)!;
    const a = generateOffline(request(t.id, "beginner", "en", "FULL"), new Date(0), "A", c).spec;
    const again = generateOffline(request(t.id, "beginner", "en", "FULL"), new Date(0), "A", c).spec;
    expect(again).toEqual(a);
    const adv = generateOffline(request(t.id, "advanced", "en", "FULL"), new Date(0), "A", c).spec;
    const prompts = (s: GameSpec) => new Set(s.challenges.filter((ch) => ch.type !== "match").map((ch) => ch.prompt));
    expect([...prompts(a)].filter((p) => prompts(adv).has(p))).toEqual([]);
  });

  it("the offline app's path loads the topic on demand, fits the game to the phone and labels it", async () => {
    const stages: string[] = [];
    const { spec } = await generateOfflineWithProgress({ ...request(TOPICS[0]!.id, "intermediate", "he", "FULL", "platformer"), device: "phone" }, (_p, s) => stages.push(s), new Date(0), "A");
    expect(stages).toEqual(["reading", "building", "checking"]);
    checkGame(spec, "offline");
    expect(spec.meta.generator).toMatchObject({ kind: "catalog", provider: "topic-library", templateId: TOPICS[0]!.id });
    expect(spec.meta.language).toBe("he");
    await expect(generateOfflineWithProgress({ ...request(TOPICS[0]!.id, "beginner", "en", "FULL"), topicId: "nope" }, () => undefined)).rejects.toThrow();
    // a tier that lacks the mode is refused before anything is built
    await expect(generateOfflineWithProgress(request(TOPICS[0]!.id, "beginner", "en", "FULL"), () => undefined, new Date(0), "C")).rejects.toMatchObject({ code: "TIER_LOCKED" });
  });

  it("refuses a topic request whose content was not loaded", () => {
    expect(() => generateOffline(request(TOPICS[0]!.id, "beginner", "en", "FAST"))).toThrow(/topic/i);
  });
});

describe("balance of topic games", () => {
  it("a sample of topic games has no stuck runs and no outliers", () => {
    const items: CorpusItem[] = [];
    TOPICS.forEach((t, i) => {
      if (i % 3 !== 0 && TOPICS.length > 12) return;
      const c = contents.get(t.id)!;
      const d = DIFFICULTIES[i % 3]!;
      for (const mode of ["FAST", "FULL"] as const) {
        const lang = i % 2 ? "he" : "en";
        items.push({ id: `${t.id}/${d}/${mode}`, kind: "engine", lang, mode, spec: generateOffline(request(t.id, d, lang, mode, i % 2 ? "platformer" : "adventure"), new Date(0), "A", c).spec });
      }
    });
    expect(items.length).toBeGreaterThan(2);
    expect(findOutliers(simulate(items, ["a", "b"]))).toEqual([]);
  });
});
