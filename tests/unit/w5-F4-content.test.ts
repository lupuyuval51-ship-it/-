import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { LevelContent, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 5, F4: nine history topics and everyday English phrases. A game shows most items of a level together, so no
 * ordering step, number prompt, term or other question of a level may give away the answer of one of its choice
 * questions. Removed giveaways: the Olympic term said "every four years"; the aviation, inventions and Mongol beginner
 * levels named the Wright brothers and Genghis Khan in every other item (those questions now ask who built the first
 * passenger balloon, who made the 1879 light bulb and Genghis Khan's own name); the Persian beginner level named Cyrus
 * everywhere and printed 539 in a prompt; orderings named Louis XVI, the first vaccine, Salamis, Darius III, "The Jewish
 * State", Mount Herzl, Herzl's job and the pogroms; terms spelled out "rebirth" and Italy, Galileo's view, Hippocrates'
 * teaching, the Basel Program's goal, practical and cultural Zionism, the patent, drip irrigation, democracy in Athens,
 * the Hellenistic spread of Greek culture and three English phrases; a Zionism number gave away Herzl's fifty years.
 */

const IDS = [
  "history-ancient-greece", "history-aviation", "history-french-revolution", "history-inventions", "history-medicine",
  "history-mongol-empire", "history-persian-empire", "history-renaissance", "history-zionism", "lang-en-everyday",
] as const;
const LEVELS = ["b", "i", "a"] as const;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

/** Everything a learner reads in a level besides the choice questions' options: prompts, number prompts, steps and terms. */
function shown(lv: LevelContent, lang: 0 | 1): string[] {
  return [
    ...(lv.q ?? []).map((p) => p[lang][0]),
    ...(lv.n ?? []).map((n) => n[lang + 1 as 1 | 2][0]),
    ...(lv.s ?? []).flatMap((o) => o[lang].slice(1)),
    ...(lv.t ?? []).flatMap((t) => (lang ? [t[2], t[3]] : [t[0], t[1]])),
  ];
}

const answers = (lv: LevelContent, lang: 0 | 1) => (lv.q ?? []).map((p) => p[lang][1]);
const text = (lv: LevelContent, lang: 0 | 1) => shown(lv, lang).join(" | ");

/** A topical mention that does not answer its question: Aristotle's term calls him "a student of Plato". */
const TOPICAL = new Set(["history-ancient-greece/a/Plato", "history-ancient-greece/a/אפלטון"]);

describe("wave 5 F4: history and everyday English topics", () => {
  it.each(IDS)("%s: 8+ items per level, 4+ of them questions, numbers or orderings", async (id) => {
    expect(findTopic(id), id).toBeTruthy();
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      const active = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
      expect(active + (lv.t?.length ?? 0), `${id}/${l}`).toBeGreaterThanOrEqual(8);
      expect(active, `${id}/${l}`).toBeGreaterThanOrEqual(4);
    }
  });

  it.each(IDS)("%s: explanations of 40+ characters, numbers in their explanations, no < or > in Hebrew, right answer longest in at most 40 %%", async (id) => {
    const c = await load(id);
    const longest = [0, 0], all = [0, 0];
    for (const l of LEVELS) {
      for (const pair of c[l].q ?? []) {
        expect(pair[0][2].length, `${id}/${l}: ${pair[0][0]}`).toBe(pair[1][2].length);
        pair.forEach(([q, answer, wrong, explanation], lang) => {
          expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
          all[lang]!++;
          if (answer.length > Math.max(...wrong.map((w) => w.length))) longest[lang]!++;
        });
        const he = pair[1];
        for (const s of [he[0], he[1], ...he[2], he[3]]) expect(/[<>]/.test(s), `${id}/${l}: ${s}`).toBe(false);
      }
      for (const [answer, en, he] of c[l].n ?? []) for (const [q, , explanation] of [en, he]) {
        expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
        expect(explanation.includes(String(answer)) || explanation.includes(answer.toLocaleString("en-US")), `${id}/${l}: ${q}`).toBe(true);
      }
      expect(/[<>]/.test(text(c[l], 1)), `${id}/${l}`).toBe(false);
    }
    expect(longest[0]! / all[0]!, `${id} en`).toBeLessThanOrEqual(0.4);
    expect(longest[1]! / all[1]!, `${id} he`).toBeLessThanOrEqual(0.4);
  });

  it.each(IDS)("%s: no prompt, step or term of a level spells out the answer of one of its questions or numbers", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) for (const lang of [0, 1] as const) {
      const lv = c[l];
      for (const pair of lv.q ?? []) {
        const [q, answer] = pair[lang];
        if (answer.length < 5 || /^[\d\s,.−–-]+$/.test(answer) || TOPICAL.has(`${id}/${l}/${answer}`)) continue;
        const key = answer.toLowerCase().replace(/[.!?]$/, "");
        for (const p of shown(lv, lang)) if (p !== q) expect(p.toLowerCase().includes(key), `${id}/${l}: "${answer}" in "${p}"`).toBe(false);
      }
      for (const [num, en, he] of lv.n ?? []) {
        const own = (lang ? he : en)[0];
        const written = new RegExp(`(^|[^\\d,.])${num}(?![\\d]|[,.]\\d)`);
        for (const p of shown(lv, lang)) if (p !== own) expect(written.test(p), `${id}/${l}: ${num} in "${p}"`).toBe(false);
      }
    }
  });

  it("the beginner levels no longer name the answers everywhere: Wright brothers, Genghis Khan, Cyrus the Great", async () => {
    const aviation = await load("history-aviation");
    expect(answers(aviation.b, 0)).not.toContain("The Wright brothers");
    expect(answers(aviation.b, 0)).toContain("The Montgolfier brothers");
    expect(aviation.b.n![0]![0]).toBe(1903 - 1783);
    expect(aviation.i.n![0]![1][0]).not.toMatch(/Paris/); // the Lindbergh question's answer is "New York to Paris"
    expect(aviation.i.n![0]![2][0]).not.toMatch(/פריז/);
    expect(aviation.i.n![0]![0]).toBe(33.5 * 60);

    const inventions = await load("history-inventions");
    expect(answers(inventions.b, 0)).not.toContain("The Wright brothers");
    expect(answers(inventions.b, 0)).toContain("Thomas Edison");
    expect(inventions.b.n![0]![1][0]).toContain("in 1783 and the Wright brothers");
    expect(answers(inventions.i, 0)).not.toContain("The printing press"); // it is a step of the level's ordering
    expect(text(inventions.i, 0)).not.toMatch(/control an invention|Morse code/);
    expect(text(inventions.a, 0)).not.toMatch(/roots/);

    const mongols = await load("history-mongol-empire");
    expect(answers(mongols.b, 0)).not.toContain("Genghis Khan");
    expect(answers(mongols.b, 0)).toContain("Temüjin");
    expect(answers(mongols.b, 1)).toContain("טמוג׳ין");
    expect(text(mongols.b, 0)).not.toMatch(/Temüjin/);
    expect(text(mongols.b, 1)).not.toMatch(/טמוג׳ין/);
    expect(text(mongols.b, 0)).not.toMatch(/with their herds/);

    const persia = await load("history-persian-empire");
    expect(answers(persia.b, 0)).not.toContain("Cyrus the Great");
    expect((persia.b.q ?? []).map((p) => p[0][0]).join(" ")).not.toMatch(/539/);
    expect(persia.b.n![0]![0]).toBe(539);
    expect(text(persia.i, 0)).not.toMatch(/Salamis/);
    expect(text(persia.i, 1)).not.toMatch(/סלמיס/);
    expect(text(persia.a, 0)).not.toMatch(/Darius III/);
    expect(text(persia.a, 1)).not.toMatch(/דריווש השלישי/);
  });

  it("orderings and terms no longer answer their level's questions", async () => {
    const greece = await load("history-ancient-greece");
    expect(text(greece.b, 0)).not.toMatch(/four years/);
    expect(text(greece.b, 1)).not.toMatch(/ארבע שנים/);
    expect(text(greece.i, 0)).not.toMatch(/male citizens/);
    // the level asks why Greek culture spread to Egypt and Persia (Alexander's conquests)
    expect([...(greece.a.t ?? []).flat(), ...(greece.a.s ?? []).flatMap(([en, he]) => [...en, ...he])].join(" | ")).not.toMatch(/culture spread|conquests|התפשטה|כיבושי/);

    const france = await load("history-french-revolution");
    expect(text(france.b, 0)).not.toMatch(/Louis XVI/);
    expect(text(france.b, 1)).not.toMatch(/לואי ה־16/);
    expect(text(france.b, 0)).not.toMatch(/1789/); // the level's number asks the year the Revolution began
    expect(text(france.i, 0)).not.toMatch(/Robespierre|for bread/);
    expect(text(france.a, 0)).not.toMatch(/under an emperor|for all citizens|suspected enemies/);
    expect(text(france.a, 1)).not.toMatch(/תחת קיסר/);

    const medicine = await load("history-medicine");
    expect(text(medicine.b, 0)).not.toMatch(/first vaccine|natural causes|observe their patients/);
    expect(text(medicine.b, 1)).not.toMatch(/החיסון הראשון|סיבות טבעיות/);

    const renaissance = await load("history-renaissance");
    expect(text(renaissance.b, 0)).not.toMatch(/rebirth|Ital/i);
    expect(text(renaissance.b, 1)).not.toMatch(/לידה מחדש|איטל/);
    expect((renaissance.i.t ?? []).map((t) => t[0])).not.toContain("Perspective");
    expect((renaissance.a.t ?? []).map((t) => t[0])).toContain("Perspective");
    expect(text(renaissance.a, 0)).not.toMatch(/Earth moves/);

    const zionism = await load("history-zionism");
    expect(text(zionism.b, 0)).not.toMatch(/Jewish State|Mount Herzl|journalist|Swiss|Switzerland/);
    expect(text(zionism.b, 1)).not.toMatch(/מדינת היהודים|הר הרצל|עיתונאי|שווייץ/);
    expect(text(zionism.i, 0)).not.toMatch(/public law|pogrom/);
    expect(text(zionism.i, 1)).not.toMatch(/המשפט הציבורי|פוגרום/);
    const advancedTerms = (zionism.a.t ?? []).flat().join(" | ");
    expect(advancedTerms).not.toMatch(/Practical Zionism|Cultural Zionism|Ahad Ha'am|at once|spiritual/); // the level's own questions
    expect(text(zionism.a, 0)).not.toMatch(/1948/); // the level asks why Herzl's "in fifty years" was a striking prediction
    const pinsker = zionism.a.n!.find(([, en]) => en[0].includes("Auto-Emancipation"))!;
    expect(pinsker[0]).toBe(1897 - 1882);
  });

  it("everyday English: the questions apply the phrases instead of repeating their meanings", async () => {
    const c = await load("lang-en-everyday");
    expect(answers(c.b, 0)).not.toContain("Nice to meet you.");
    expect(answers(c.b, 0)).toContain("Nice to see you again.");
    expect(answers(c.i, 0)).not.toContain("How much is it?");
    expect(answers(c.i, 0).some((a) => a.startsWith("Could I have"))).toBe(false);
    expect(answers(c.a, 0)).not.toContain("Very easy");
    expect(answers(c.a, 0)).not.toContain("My friend feels a little ill.");
    expect(answers(c.a, 1)).not.toContain("קל מאוד");
    for (const l of LEVELS) for (const [en, he] of c[l].q ?? []) {
      expect(he[1], en[0]).toBe(en[1]); // English options stay English in the Hebrew version
      expect(he[2], en[0]).toEqual(en[2]);
    }
  });
});
