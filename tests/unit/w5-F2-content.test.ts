import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { LevelContent, Question, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 5, F2: ten geography topics (continents and oceans, deserts, Israel's cities, nature, water, lakes, the Negev and
 * Eilat, northern Israel, population, rainforests). "Continents and oceans" had only 6–7 items per level: each level gains
 * fact-checked questions and numbers. Elsewhere a term, ordering step or number prompt spelled out the answer of a choice
 * question of the same level (a game shows most of a level at once): those items were rephrased or swapped for others,
 * and every answer key stayed right. A few topical mentions that do not answer anything were left on purpose (listed
 * below in TOPICAL).
 */

const IDS = ["geo-continents-oceans", "geo-deserts", "geo-israel-cities", "geo-israel-nature", "geo-israel-water", "geo-lakes", "geo-negev-eilat", "geo-northern-israel", "geo-population", "geo-rainforests"] as const;
const LEVELS = ["b", "i", "a"] as const;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

/** The question of a level whose English text contains `text`. */
function question(lv: LevelContent, text: string): Question {
  const found = (lv.q ?? []).find(([en]) => en[0].includes(text));
  if (!found) throw new Error(`no question with "${text}"`);
  return found;
}

const termMeaning = (lv: LevelContent, en: string, lang: 0 | 1) => {
  const t = (lv.t ?? []).find((x) => x[0] === en);
  if (!t) throw new Error(`no term ${en}`);
  return lang ? t[3] : t[1];
};
const terms = (lv: LevelContent) => (lv.t ?? []).map((t) => t[0]);
const steps = (lv: LevelContent, lang: 0 | 1) => (lv.s ?? []).flatMap((s) => s[lang]).join(" | ");
const numberPrompts = (lv: LevelContent, lang: 0 | 1) => (lv.n ?? []).map((n) => n[lang + 1 as 1 | 2][0]).join(" | ");

const norm = (s: string) => s.toLowerCase().replace(/[\p{P}\p{S}]+/gu, " ").replace(/\s+/g, " ").trim();
/** Answers that still appear in another item of their level because the mention does not answer the question. */
const TOPICAL = new Set([
  "geo-israel-cities/b/Jerusalem", // the Old City and the Knesset are in Jerusalem; neither says it has the most people
  "geo-israel-cities/b/ירושלים",
  "geo-israel-cities/b/Haifa", // a city in the north-to-south ordering, not where the Technion is
  "geo-israel-cities/b/חיפה",
  "geo-israel-cities/i/In Tel Aviv", // the White City, Tel Aviv-Yafo and the founding years say nothing about 1948
  "geo-negev-eilat/b/Be'er Sheva", // first in the north-to-south ordering, which does not call it the capital
  "geo-negev-eilat/b/באר שבע",
  "geo-northern-israel/i/The Lower Galilee", // a term, like the wrong option "The Upper Galilee"; neither says where Tabor is
  "geo-northern-israel/i/בגליל התחתון",
]);

describe("geography topics (F2)", () => {
  it("are all in the catalogue", () => {
    for (const id of IDS) expect(findTopic(id), id).toBeTruthy();
  });

  it.each(IDS)("%s: every level has 8+ items, 4+ of them questions, numbers or orderings", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
      expect((lv.t?.length ?? 0) + items, `${id}/${l}`).toBeGreaterThanOrEqual(8);
      expect(items, `${id}/${l}`).toBeGreaterThanOrEqual(4);
    }
  });

  it.each(IDS)("%s: the right answer is the longest option in at most 40 % of the questions, in each language", async (id) => {
    const c = await load(id);
    const longest = [0, 0], all = [0, 0];
    for (const l of LEVELS) for (const pair of c[l].q ?? []) pair.forEach(([, answer, wrong], lang) => {
      all[lang]!++;
      if (answer.length > Math.max(...wrong.map((w) => w.length))) longest[lang]!++;
    });
    expect(longest[0]! / all[0]!, `${id} en`).toBeLessThanOrEqual(0.4);
    expect(longest[1]! / all[1]!, `${id} he`).toBeLessThanOrEqual(0.4);
  });

  it.each(IDS)("%s: explanations of 40+ characters (numbers explained with their answer), no < or > in Hebrew", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      for (const [en, he] of c[l].q ?? []) {
        expect(en[2].length, `${id}/${l}: ${en[0]}`).toBe(he[2].length);
        for (const [q, answer, wrong, explanation] of [en, he]) {
          expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
          expect(new Set([answer, ...wrong]).size, `${id}/${l}: ${q}`).toBe(wrong.length + 1);
        }
        for (const s of [he[0], he[1], ...he[2], he[3]]) expect(s, `${id}/${l}`).not.toMatch(/[<>]/);
      }
      for (const [answer, en, he] of c[l].n ?? []) {
        for (const text of [en[2], he[2]]) {
          expect(text.length, `${id}/${l}: ${en[0]}`).toBeGreaterThanOrEqual(40);
          expect([String(answer), answer.toLocaleString("en-US")].some((w) => text.includes(w)), `${id}/${l}: ${text}`).toBe(true);
        }
        for (const s of [he[0], he[1], he[2]]) expect(s, `${id}/${l}`).not.toMatch(/[<>]/);
      }
      for (const [, he] of c[l].s ?? []) for (const s of he) expect(s, `${id}/${l}`).not.toMatch(/[<>]/);
    }
  });

  it.each(IDS)("%s: no term, ordering step or number prompt spells out a choice answer of its level", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      for (const lang of [0, 1] as const) {
        const others = norm([...(lv.t ?? []).map((t) => (lang ? `${t[2]} ${t[3]}` : `${t[0]} ${t[1]}`)), steps(lv, lang), numberPrompts(lv, lang)].join(" | "));
        for (const pair of lv.q ?? []) {
          const answer = pair[lang][1];
          const key = norm(answer).replace(/^(the|in|on|a|an) /, "");
          if (key.length < 5 || /^\d/.test(key) || TOPICAL.has(`${id}/${l}/${answer}`)) continue;
          expect(others.includes(key), `${id}/${l}/${lang ? "he" : "en"}: "${answer}"`).toBe(false);
        }
      }
    }
  });

  it("continents and oceans: the new items are worked out right, Pangaea no longer gives away the drifting coasts", async () => {
    const c = await load("geo-continents-oceans");
    expect(question(c.b, "covered by water")[0][1]).toBe("About 70 percent");
    expect(c.b.n?.[0]?.[0]).toBe(5);
    expect(question(c.i, "Spain in Europe from Morocco")[0][1]).toBe("The Strait of Gibraltar");
    expect([question(c.i, "named after a country")[0][1], question(c.i, "named after a country")[1][1]]).toEqual(["The Indian Ocean", "האוקיינוס ההודי"]);
    expect(c.i.n?.[0]?.[0]).toBe(40000 / 800);
    expect(c.a.n?.[0]?.[0]).toBe(11000 - 8850);
    expect(question(c.a, "Ring of Fire")[0][1]).toContain("ocean floor sinks");
    expect(terms(c.a)).not.toContain("Pangaea");
    expect(question(c.a, "puzzle pieces")[0][3]).toContain("Pangaea");
    expect(termMeaning(c.b, "Ocean", 0)).not.toContain("most of the Earth");
  });

  it("deserts: terms and the ordering no longer name the answers about rain, Antarctica, floods, grazing and the Atacama", async () => {
    const c = await load("geo-deserts");
    expect(termMeaning(c.b, "Desert", 0)).not.toMatch(/rain/);
    expect(termMeaning(c.b, "Desert", 1)).not.toContain("גשם");
    expect(termMeaning(c.i, "Polar desert", 0)).not.toContain("Antarctica");
    expect(termMeaning(c.i, "Polar desert", 1)).not.toContain("אנטארקטיקה");
    expect(termMeaning(c.i, "Flash flood", 0)).not.toContain("far away");
    expect(question(c.i, "raining hard on the mountains")[0][1]).not.toMatch(/flash flood/i);
    expect(termMeaning(c.a, "Desertification", 0)).not.toMatch(/graz|cutting/);
    expect(steps(c.a, 0)).not.toMatch(/graz|cut/);
    expect(termMeaning(c.a, "Coastal desert", 0)).not.toMatch(/current|fog/);
    expect(terms(c.a)).not.toContain("Drip irrigation");
    expect(question(c.i, "largest desert in the world")[0][1]).toBe("Antarctica");
  });

  it("Israel's cities: Tel Aviv, the immigrants and 1878 are no longer spelled out next to their questions", async () => {
    const c = await load("geo-israel-cities");
    expect(numberPrompts(c.b, 0)).not.toContain("Tel Aviv");
    expect(numberPrompts(c.b, 1)).not.toContain("תל אביב");
    expect(steps(c.b, 0)).not.toContain("Tel Aviv");
    expect(c.b.n?.[0]?.[0]).toBe(1948 - 1909);
    expect(termMeaning(c.i, "Development town", 0)).not.toContain("immigrants");
    expect(termMeaning(c.i, "White City", 1)).not.toContain("בתל אביב");
    const mother = question(c.i, "mother of the moshavot");
    expect(mother[0][1]).not.toContain("1878");
    expect(mother[0][3]).toContain("1878");
  });

  it("Israel's nature: Ein Gedi, rubbish, Masada and the reintroduction answer are no longer given away", async () => {
    const c = await load("geo-israel-nature");
    expect(termMeaning(c.b, "Rock hyrax", 0)).not.toContain("Ein Gedi");
    expect(termMeaning(c.b, "Rock hyrax", 1)).not.toContain("עין גדי");
    expect(steps(c.b, 0)).not.toMatch(/rubbish/);
    expect(termMeaning(c.i, "National park", 0)).not.toContain("Masada");
    expect(terms(c.i)).not.toContain("Reintroduction");
    expect(question(c.i, "Masada")[0][2].filter((w) => w.includes("ruins")).length).toBeGreaterThan(0);
    expect(termMeaning(c.a, "Ecological corridor", 0)).not.toContain("animals can move");
  });

  it("Israel's water: the Jordan, the Hula, the Dead Sea, desalination and reuse answers are no longer spelled out", async () => {
    const c = await load("geo-israel-water");
    expect(termMeaning(c.b, "Kinneret", 0)).not.toContain("Jordan");
    expect(termMeaning(c.b, "Kinneret", 1)).not.toContain("הירדן");
    expect((c.b.q ?? []).some(([en]) => en[0] === "What does a desalination plant do?")).toBe(false);
    expect([question(c.b, "most rain")[0][1], question(c.b, "most rain")[1][1]]).toEqual(["The north, around the Upper Galilee", "הצפון, באזור הגליל העליון"]);
    expect(question(c.b, "desalination plants built")[0][2]).toContain("On the shore of the Dead Sea");
    expect(steps(c.i, 0)).not.toMatch(/Hula|Dead Sea/);
    expect(steps(c.i, 1)).not.toMatch(/החולה|ים המלח/);
    expect(termMeaning(c.i, "Drip irrigation", 0)).not.toContain("roots");
    expect(termMeaning(c.i, "Treated wastewater", 0)).not.toContain("crops");
    expect(terms(c.a)).not.toContain("Seawater intrusion");
    expect(terms(c.a)).not.toContain("Brine");
  });

  it("lakes: the Jordan's journey, Baikal's depth and Superior's area are no longer given away", async () => {
    const c = await load("geo-lakes");
    expect(steps(c.b, 0)).not.toMatch(/Jordan|Dead Sea/);
    expect(question(c.b, "flows into the Kinneret from the north")[0][1]).toBe("The Jordan");
    expect(numberPrompts(c.i, 0)).not.toContain("Baikal");
    expect(c.i.n?.[1]?.[0]).toBe(3);
    expect(question(c.i, "a fifth of the fresh water")[0][0]).not.toContain("Superior");
    expect(question(c.i, "largest freshwater lake by area")[0][1]).toBe("Lake Superior");
  });

  it("the Negev and Eilat: corals, rain, floods, makhtesh formation and runoff farming are no longer spelled out", async () => {
    const c = await load("geo-negev-eilat");
    expect(terms(c.b)).not.toContain("Desert");
    expect(termMeaning(c.b, "Coral reef", 0)).not.toMatch(/animals|skeleton/);
    expect(termMeaning(c.i, "Flash flood", 0)).not.toContain("far away");
    expect(termMeaning(c.i, "Incense Route", 0)).not.toMatch(/incense/i);
    expect(numberPrompts(c.i, 0)).not.toContain("Makhtesh Ramon");
    expect(c.i.n?.[0]?.[0]).toBe(60 * 4);
    expect(question(c.a, "ammonites")[0][1]).toContain("sea covered the area");
    expect((c.a.q ?? []).some(([en]) => en[1].includes("soft rock"))).toBe(false);
    expect(numberPrompts(c.a, 0)).not.toMatch(/rain/);
    expect(c.a.n?.[0]?.[0]).toBe(40 / 5);
    expect(terms(c.a)).not.toContain("Runoff farming");
  });

  it("northern Israel: Mount Hermon, farmland, basalt and the re-flooded Hula are no longer given away", async () => {
    const c = await load("geo-northern-israel");
    expect(steps(c.b, 0)).not.toContain("Hermon");
    expect(question(c.b, "highest in the region")[0][1]).toBe("Mount Hermon");
    expect(termMeaning(c.i, "Drainage of the Hula", 0)).not.toContain("farmland");
    expect(termMeaning(c.i, "Lower Galilee", 0)).not.toMatch(/valley|plain/);
    expect(terms(c.a)).not.toContain("Basalt");
    expect((c.a.q ?? []).some(([en]) => en[1].includes("flooded again"))).toBe(false);
    expect(question(c.a, "corn for the cranes")[0][1]).toContain("crops");
  });

  it("population and rainforests: urbanisation, pull factors, the equator, the dark floor and worn-out soil are no longer spelled out", async () => {
    const p = await load("geo-population");
    expect(question(p.i, "more than half of the world's people")[0][1]).toBe("About 2007");
    expect(termMeaning(p.a, "Pull factors", 0)).not.toContain("jobs");
    expect(question(p.a, "pull factor")[0][1]).toBe("More job opportunities");
    const r = await load("geo-rainforests");
    expect(termMeaning(r.b, "Rainforest", 0)).not.toContain("equator");
    expect(termMeaning(r.b, "Rainforest", 1)).not.toContain("קו המשווה");
    expect(steps(r.b, 0)).not.toMatch(/dark/);
    expect(question(r.b, "foods comes from a tree")[0][0]).not.toContain("Amazon");
    expect(terms(r.a)).not.toContain("Carbon sink");
    expect(steps(r.a, 0)).not.toMatch(/wears out/);
  });
});
