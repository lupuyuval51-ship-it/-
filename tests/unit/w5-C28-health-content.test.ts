import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { Question, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 5, C28: seven health topics (road safety, safe play, sleep, smoking and vaping, sun and water, teeth, vitamins and
 * minerals). Every fact was re-checked and no existing answer key moved. In four original-library topics the right answer
 * was the longest option in up to 86 % of the questions (teeth 86 %, sun and water 75 %, sleep 67 %, road safety 50 %); the
 * shortest wrong options are now real misconceptions ("swim straight back to the shore", "clouds block the sun's rays",
 * "the phone's radio signals keep the brain awake", "only brush on days with sweets"...). Road safety and sleep had only two
 * questions per level and sun and water three at the beginner level; they now meet the collection's bar with checked items
 * (walking where there is no pavement, a helmet on every ride, wet roads, stopping distance, crossing in order; a dark,
 * quiet bedroom, caffeine, sleep and memory, the first sleep cycle; pink skin in the sun), and two teeth numbers are
 * explained in full.
 */

const IDS = ["health-road-safety", "health-safe-play", "health-sleep", "health-smoking-vaping", "health-sun-water", "health-teeth", "health-vitamins-minerals"] as const;
const LEVELS = ["b", "i", "a"] as const;

async function load(id: string): Promise<TopicContent> {
  const c = await loadTopicContent(id);
  if (!c) throw new Error(`no content for ${id}`);
  return c;
}

/** The question of a topic whose English text contains `text`. */
function question(c: TopicContent, text: string): Question {
  const found = LEVELS.flatMap((l) => c[l].q ?? []).find(([en]) => en[0].includes(text));
  if (!found) throw new Error(`no question with "${text}"`);
  return found;
}

describe("health topics (C28)", () => {
  it("are all in the catalogue", () => {
    for (const id of IDS) expect(findTopic(id), id).toBeTruthy();
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

  it.each(IDS)("%s: every level has 8+ items, 4+ of them questions, numbers or orderings", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      const lv = c[l];
      const items = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
      expect((lv.t?.length ?? 0) + items, `${id}/${l}`).toBeGreaterThanOrEqual(8);
      expect(items, `${id}/${l}`).toBeGreaterThanOrEqual(4);
    }
  });

  it.each(IDS)("%s: every answer and number is explained in 40+ characters, options are distinct, Hebrew has no < or >", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      for (const pair of c[l].q ?? []) {
        expect(pair[0][2].length, `${id}/${l}: ${pair[0][0]}`).toBe(pair[1][2].length);
        for (const [q, answer, wrong, explanation] of pair) {
          expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
          expect(new Set([answer, ...wrong]).size, `${id}/${l}: ${q}`).toBe(wrong.length + 1);
        }
        for (const s of [pair[1][0], pair[1][1], ...pair[1][2], pair[1][3]]) expect(s, `${id}/${l}`).not.toMatch(/[<>]/);
      }
      for (const [answer, en, he] of c[l].n ?? []) for (const [q, , explanation] of [en, he]) {
        expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
        expect([String(answer), answer.toLocaleString("en-US")].some((w) => explanation.includes(w)), `${id}/${l}: ${q}`).toBe(true);
        expect(q, `${id}/${l}`).not.toMatch(/[<>]/);
      }
      for (const [en, he] of c[l].s ?? []) {
        expect(en.length, `${id}/${l}: ${en[0]}`).toBe(he.length);
        for (const s of he) expect(s, `${id}/${l}`).not.toMatch(/[<>]/);
      }
    }
  });

  it("the answers whose wrong options were rewritten keep their keys", async () => {
    const road = await load("health-road-safety");
    expect(question(road, "Before crossing at a crosswalk")[0][1]).toBe("Stop, look both ways and listen, then cross when it is safe");
    expect(question(road, "large truck that is reversing")[1][1]).toBe("ייתכן שאתם בשטח המת של הנהג");
    const sleep = await load("health-sleep");
    expect(question(sleep, "using a phone in bed")[0][1]).toBe("Its light and content keep the brain alert and delay melatonin");
    expect(question(sleep, "teenagers naturally feel sleepy")[0][1]).toBe("Their body clock shifts later during puberty");
    const sun = await load("health-sun-water");
    expect(question(sun, "rip current is pulling")[0][1]).toBe("Stay calm, do not fight it, swim parallel to the shore and signal for help");
    expect(question(sun, "sun's burning strongest")[1][1]).toBe("באמצע היום, בערך בין 10:00 ל־16:00");
    expect(question(sun, "plain water alone")[0][1]).toBe("Sweat also carries away salts that the body needs");
    const teeth = await load("health-teeth");
    expect(question(teeth, "How long and how often")[0][1]).toBe("For about two minutes, twice a day");
    expect(question(teeth, "replace your toothbrush")[0][1]).toBe("About every three months, or sooner if the bristles are bent and frayed");
    expect(question(teeth, "How does fluoride protect")[1][1]).toBe("הוא עוזר לאמייל לתקן נזק מוקדם ולעמוד בפני חומצה");
  });

  it("the new numbers add up", async () => {
    const number = (c: TopicContent, text: string) => LEVELS.flatMap((l) => c[l].n ?? []).find(([, en]) => en[0].includes(text))?.[0];
    const road = await load("health-road-safety");
    expect(number(road, "18 km/h")).toBe((18 * 1000) / 3600);
    expect(number(road, "stopping distance")).toBe(14 + 14);
    const sleep = await load("health-sleep");
    expect(number(sleep, "9 pm")).toBe(24 - 21 + 7);
    expect(number(sleep, "caffeine")).toBe(80 / 2 / 2);
  });
});
