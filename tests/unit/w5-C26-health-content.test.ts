import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { Question, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 5, C26: seven health topics (friendship, hearing, hiking, sirens and protected spaces, fire and home safety, hygiene,
 * the immune system). Every fact was re-checked and no answer key moved. Three topics gave the answer away by its length:
 * "Fire and home safety" in 12 of its 13 English questions, "The immune system" in 10 of 14 and "Hygiene" in 4 of 6 (for
 * example "Get out at once and call 102 from a safe place outside" stood against "Try to put it out yourself"). Their
 * shortest wrong options became real misconceptions (fight the fire with a bucket, water
 * floats on burning oil, electricity cannot pass through skin, hold your breath in smoke, a vaccine is a cure, only
 * children catch chickenpox, a stronger antibiotic for a cold, polio as the eradicated disease). "Hygiene" had only two
 * questions per level and "Fire and home safety" three at the beginner level; both are now held to the collection's bar
 * (soap, used tissues, plaque, what is contagious, taking antibiotics as prescribed, the family meeting place).
 */

const IDS = ["health-friendship", "health-hearing", "health-hiking", "health-home-front", "health-home-safety", "health-hygiene", "health-immune-system"] as const;
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

describe("health topics (C26)", () => {
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
        expect(explanation, `${id}/${l}: ${q}`).toContain(String(answer));
      }
    }
  });

  it("home safety: the rewritten questions keep their answers, and the wrong options are real misconceptions", async () => {
    const c = await load("health-home-safety");
    const fire = question(c, "There is a fire at home");
    expect(fire[0][1]).toBe("Get out at once and call 102 from a safe place outside");
    expect(fire[1][1]).toBe("יוצאים מיד ומתקשרים ל־102 ממקום בטוח בחוץ");
    expect(fire[0][2]).toContain("Fill a bucket with water and try to put the fire out yourself first");
    const oil = question(c, "A pan of oil catches fire");
    expect(oil[0][1]).toBe("The water turns to steam at once and throws burning oil everywhere");
    expect(oil[0][2][0]).toMatch(/floats on top of the oil/);
    // The explanation refutes that misconception: water sinks under the oil.
    expect(oil[0][3]).toMatch(/Water sinks under the hot oil/);
    const co = question(c, "carbon monoxide especially dangerous");
    expect(co[0][1]).toBe("It has no colour or smell, so people may not notice it");
    expect(co[1][1]).toBe("אין לו צבע ואין לו ריח, ולכן אנשים עלולים לא לשים לב אליו");
    const meet = question(c, "meeting place outside the home");
    expect(meet[0][1]).toBe("So everyone can see at once that nobody is still inside");
    expect(meet[1][1]).toBe("כדי שכולם יראו מיד שאף אחד לא נשאר בפנים");
  });

  it("the last wrong option, which the two-option warm-up keeps and the hint names, stays the easiest one to rule out", async () => {
    const last = (c: TopicContent, text: string) => question(c, text).map(([, , wrong]) => wrong[wrong.length - 1]);
    const safety = await load("health-home-safety"), immune = await load("health-immune-system"), hygiene = await load("health-hygiene");
    expect(last(safety, "carbon monoxide especially dangerous")).toEqual(["It only appears in summer", "הוא מופיע רק בקיץ"]);
    expect(last(safety, "meeting place outside the home")).toEqual(["So you have a good spot to watch the fire from", "כדי שיהיה מקום טוב לצפות ממנו בשריפה"]);
    expect(last(immune, "tiny hairs inside your nose")).toEqual(["They keep the brain warm", "הם שומרים על המוח חם"]);
    expect(last(hygiene, "When should you wash your hands")).toEqual(["Only once a week", "רק פעם בשבוע"]);
    expect(last(hygiene, "Why don't antibiotics help with a common cold")).toEqual(["Antibiotics only work in summer", "אנטיביוטיקה עובדת רק בקיץ"]);
    expect(last(hygiene, "with soap, and not only with water")).toEqual(["Soap glues the germs to the skin so they cannot get into the mouth", "הסבון מדביק את החיידקים לעור כדי שלא ייכנסו לפה"]);
  });

  it("immune system: smallpox stays the eradicated disease, with polio (not yet eradicated) as a wrong option", async () => {
    const [en, he] = question(await load("health-immune-system"), "wiped out from the whole world");
    expect(en[1]).toBe("Smallpox");
    expect(he[1]).toBe("אבעבועות שחורות");
    expect(en[2]).toContain("Polio");
    expect(he[2]).toContain("פוליו (שיתוק ילדים)");
    expect(en[3]).toMatch(/only human disease eliminated/);
  });

  it("immune system: the rewritten questions keep their answers", async () => {
    const c = await load("health-immune-system");
    expect(question(c, "What does a vaccine do")[0][1]).toBe("It teaches the immune system to recognise a germ before you meet the real one");
    expect(question(c, "chickenpox only once")[0][1]).toBe("After the first time, the immune system remembers the virus and stops it quickly");
    expect(question(c, "Why will antibiotics not help")[0][1]).toBe("Antibiotics work against bacteria, not against viruses");
    expect(question(c, "new flu vaccine made every year")[0][1]).toBe("Flu viruses keep changing, and the protection from a flu shot fades within months");
    expect(question(c, "second infection with the same germ")[1][1]).toBe("תאי זיכרון מזהים אותו, ולכן הגוף מייצר את הנוגדנים המתאימים הרבה יותר מהר");
  });

  it("hygiene: the years between the first vaccine and penicillin are worked out, and do not name the penicillin answer", async () => {
    const c = await load("health-hygiene");
    const [answer, en, he] = c.a.n![0]!;
    expect(answer).toBe(1928 - 1796);
    expect(en[2]).toContain("1928 − 1796 = 132");
    expect(he[2]).toContain("1928 − 1796 = 132");
    // The level also asks who discovered penicillin: the number item must not give that name away.
    expect(en[0]).not.toMatch(/Fleming/);
    expect(he[0]).not.toMatch(/פלמינג/);
    expect(question(c, "Who discovered penicillin")[0][1]).toBe("Alexander Fleming");
  });

  it("hygiene: antibiotics are taken as the doctor said, never shared or saved", async () => {
    const [en, he] = question(await load("health-hygiene"), "A doctor prescribes antibiotics");
    expect(en[1]).toMatch(/as the doctor said/);
    expect(he[1]).toMatch(/כמו שהרופא אמר/);
    expect(en[2].join(" ")).toMatch(/friend/);
    expect(en[3]).toMatch(/resistant/);
  });
});
