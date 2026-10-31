import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { LevelContent, Question, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 5, F3: ten topics (the rift valley, seas and straits, time zones, animal safety, first aid, sleep, African kingdoms,
 * the aliyot, the American Revolution, ancient China) had items that gave away the answer of a choice question of the same
 * level, which a game shows together: an ordering that listed the answer (Atlantic → Gibraltar → Suez → Eilat, "Mali, in the
 * time of Mansa Musa", "George Washington becomes the first President", "Ask the owner if you may stroke the dog"), number
 * prompts that named it (Qin Shi Huang, the energy drink, "Israel is 2 hours ahead of London", "the Earth turns 15° every
 * 60 minutes", Tanganyika "1,470 metres deep"), and term meanings that spelled it out (the Arabian Plate "moves north", the
 * salt dome "like Mount Sodom", "in Israel 101 is Magen David Adom", "a trusted adult … teacher or lifeguard", cooling a burn
 * under running water, the AED "with spoken instructions", blue light delaying melatonin, sleep and memory, merit exams,
 * yawning and lip licking as calming signals). Those items were rephrased or replaced; every fact was re-checked.
 *
 * One giveaway is kept on purpose: in first aid, "What should you check first?" is answered by the first step of the
 * ordering ("Check that it is safe for you to go closer"), which tests/unit/w5-C25-health-content.test.ts requires.
 */

const IDS = [
  "geo-rift-valley", "geo-seas-straits", "geo-time-zones", "health-animal-safety", "health-first-aid", "health-sleep",
  "history-african-kingdoms", "history-aliyot", "history-american-revolution", "history-ancient-china",
] as const;
const LEVELS = ["b", "i", "a"] as const;

/** Mentions of an answer elsewhere in its level that are kept because they do not answer the question. */
const KEPT: readonly string[] = [
  // the width of the Strait of Gibraltar says nothing about which seas it joins (the Bosphorus is named in the level too)
  "geo-seas-straits/b/en/The Strait of Gibraltar",
  "geo-seas-straits/b/he/מצר גיברלטר",
  // pinned by the C25 test: safety comes first in the question and in the ordering
  "health-first-aid/b/he/שבטוח לכם להתקרב",
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

describe("F3 topics: full levels, both languages in step", () => {
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
    const longest = [0, 0], all = [0, 0];
    for (const l of LEVELS) {
      for (const pair of c[l].q ?? []) {
        expect(pair[0][2].length, `${id}/${l}: ${pair[0][0]}`).toBe(pair[1][2].length);
        pair.forEach(([q, answer, wrong, explanation], lang) => {
          expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
          all[lang]!++;
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
    }
    expect(longest[0]! / all[0]!, `${id} en`).toBeLessThanOrEqual(0.4);
    expect(longest[1]! / all[1]!, `${id} he`).toBeLessThanOrEqual(0.4);
  });
});

describe("F3 topics: no item spells out the answer of a choice question of its level", () => {
  it.each(IDS)("%s: no answer is repeated in another item of the same level", async (id) => {
    const c = await load(id);
    const found: string[] = [];
    for (const l of LEVELS) for (const lang of [0, 1] as const) {
      (c[l].q ?? []).forEach((pair, qi) => {
        const answer = pair[lang][1];
        if (visibleTexts(c[l], lang, qi).some((t) => norm(t).includes(norm(answer)))) found.push(`${id}/${l}/${lang ? "he" : "en"}/${answer}`);
      });
    }
    expect(found.filter((f) => !KEPT.includes(f))).toEqual([]);
  });

  it("the rift valley: the ordering names the Dead Sea, so the question asks about Jericho; the terms no longer answer", async () => {
    const c = await load("geo-rift-valley");
    const [en, he] = question(c.b, "floor of the rift valley");
    expect([en[1], he[1]]).toEqual(["Jericho", "יריחו"]);
    const shores = question(c.b, "shores of the Dead Sea");
    expect(shores[0][1]).toBe("They are the lowest land on Earth");
    expect(shores[0][2][0]).toContain("Death Valley");
    const terms = Object.fromEntries((c.i.t ?? []).map((t) => [t[0], `${t[1]} ${t[3]}`]));
    expect(terms["Arabian Plate"]).not.toMatch(/north|צפונה/);
    expect(terms["Salt dome"]).not.toMatch(/Sodom|סדום/);
    expect(terms["Sinkhole"]).not.toMatch(/dissolve|salt|ממיס|מלח/);
    expect(visibleTexts(c.i, 0).join(" ")).not.toMatch(/falls by|drops/);
    expect(c.i.n!.map(([a]) => a)).toEqual([105, 430 - 210]);
    expect(visibleTexts(c.a, 0).join(" ")).not.toContain("Tanganyika is");
    expect(c.a.n![1]![0]).toBe(700 - 470);
    expect(c.a.n![1]![1][0]).toContain("Lake Malawi");
  });

  it("seas and straits: the route now runs from Eilat to Mumbai; Eilat's gulf is asked by its other name; Q3 asks the country", async () => {
    const c = await load("geo-seas-straits");
    const [route, routeHe] = c.b.s![0]!;
    expect(route.join(" ")).not.toMatch(/Gibraltar|Suez|Aqaba|Bab-el-Mandeb|Mediterranean/);
    expect(routeHe.join(" ")).not.toMatch(/גיברלטר|סואץ|עקבה|באב אל־מנדב|הים התיכון/);
    const [aqaba, aqabaHe] = question(c.b, "Gulf of Eilat");
    expect([aqaba[1], aqabaHe[1]]).toEqual(["The Gulf of Aqaba", "מפרץ עקבה"]);
    expect(question(c.b, "Which strait connects the Mediterranean")[0][1]).toBe("The Strait of Gibraltar");
    const [turkey, turkeyHe] = question(c.i, "Dardanelles");
    expect([turkey[1], turkeyHe[1]]).toEqual(["Turkey", "טורקיה"]);
    expect(turkey[3]).toContain("1936");
  });

  it("time zones: the numbers no longer tell that Israel is ahead, how fast the Earth turns, or 23:00 on Monday", async () => {
    const c = await load("geo-time-zones");
    expect(c.b.n![1]![0]).toBe(9 + 4);
    expect(c.b.n![1]![1][0]).not.toMatch(/Israel/);
    expect(c.b.n![1]![2][0]).not.toMatch(/ישראל/);
    const degree = c.i.n![1]!;
    expect(degree[0]).toBe(60 / (360 / 24));
    expect(degree[1][0] + degree[2][0]).not.toMatch(/15°|360°|east|מזרח/);
    const sydney = c.a.n![1]!;
    expect(sydney[0]).toBe((22 + 8 + 15 + 11) % 24);
    expect(sydney[1][0] + sydney[2][0]).not.toContain("23:00");
  });

  it("animal safety: the dog question asks why, the snakebite answer is not 'keep still', the terms do not describe the answers", async () => {
    const c = await load("health-animal-safety");
    const [dog, dogHe] = question(c.b, "ask the owner");
    expect(dog[1]).toBe("Only the owner knows whether this dog is calm with strangers");
    expect(dogHe[1]).toBe("רק הבעלים יודעים אם הכלב הזה רגוע עם זרים");
    const [snake, snakeHe] = question(c.a, "bitten on the leg");
    expect(snake[1]).not.toMatch(/still/);
    expect(snakeHe[1]).not.toMatch(/יזוז/);
    expect(snake[2].join(" ")).toMatch(/tight band/);
    const terms = Object.fromEntries((c.a.t ?? []).map((t) => [t[0], `${t[1]} ${t[3]}`]));
    expect(terms["Rabies"]).not.toMatch(/vaccin|deadly|חיסון|קטלנית/);
    expect(terms["Calming signals"]).not.toMatch(/yawn|lick|פיהוק|ליקוק/);
  });

  it("first aid: the terms no longer give 101, the trusted adult, running water or the AED's voice", async () => {
    const c = await load("health-first-aid");
    expect(visibleTexts(c.b, 0).join(" ")).not.toMatch(/101|teacher|lifeguard/);
    expect(visibleTexts(c.b, 1).join(" ")).not.toMatch(/101|מורה|מציל/);
    expect(question(c.b, "Which number")[0][1]).toBe("101");
    // (the ordering still rinses a small cut under running water: it says nothing about burns)
    expect((c.i.t ?? []).map((t) => `${t[0]} ${t[1]}`).join(" ")).not.toMatch(/running water|burn under/);
    expect(question(c.i, "small burn")[0][1]).toMatch(/running water/);
    expect(visibleTexts(c.a, 0).join(" ")).not.toMatch(/voice|spoken/);
    expect(visibleTexts(c.a, 1).join(" ")).not.toMatch(/קול/);
  });

  it("sleep: the energy drink, blue light, the 90-minute cycle and sleep's role in memory are no longer spelled out", async () => {
    const c = await load("health-sleep");
    expect(question(c.i, "evening drink")[0][1]).toBe("An energy drink");
    expect(visibleTexts(c.i, 0).join(" ")).not.toMatch(/energy/i);
    expect(visibleTexts(c.i, 1).join(" ")).not.toMatch(/אנרגיה/);
    expect(visibleTexts(c.i, 0).join(" ")).not.toMatch(/screen|delay/);
    expect(c.i.n![0]![0]).toBe(80 / 2 / 2);
    expect(visibleTexts(c.a, 0).join(" ")).not.toMatch(/90 minutes/);
    const memory = (c.a.t ?? []).find((t) => t[0] === "Memory consolidation")!;
    expect(memory[1] + memory[3]).not.toMatch(/sleep|שינה/);
  });

  it("history: the orderings and numbers no longer name Mansa Musa, Rishon LeZion, Washington or Qin Shi Huang", async () => {
    const africa = await load("history-african-kingdoms");
    expect(africa.b.s![0]![0].join(" ")).not.toMatch(/Mansa Musa|Ezana/);
    expect(africa.b.s![0]![1].join(" ")).not.toMatch(/מנסא מוסא|עזאנה/);
    expect(question(africa.b, "pilgrimage to Mecca")[0][1]).toBe("Mansa Musa");

    const aliyot = await load("history-aliyot");
    expect(aliyot.b.s![0]![0].slice(1)).toEqual(["Zikhron Ya'akov", "Rehovot", "Tel Aviv", "Ein Harod"]);
    expect(question(aliyot.b, "founded by immigrants of the First Aliyah")[0][1]).toBe("Rishon LeZion");

    const usa = await load("history-american-revolution");
    expect(usa.b.s![0]![0].join(" ")).not.toMatch(/Washington/);
    expect(usa.b.s![0]![1].join(" ")).not.toMatch(/וושינגטון/);
    expect(question(usa.b, "Continental Army")[0][1]).toBe("George Washington");
    // every other item of the level speaks of British rule, so the first question now asks about France's help
    const [france, franceHe] = question(usa.b, "European country");
    expect([france[1], franceHe[1]]).toEqual(["France", "צרפת"]);
    expect(question(usa.i, "Yorktown")[0][0]).not.toMatch(/French/);

    const china = await load("history-ancient-china");
    expect(china.i.n![0]![1][0] + china.i.n![0]![2][0]).not.toMatch(/Qin|צ׳ין/);
    expect(china.i.n![0]![0]).toBe(221 - 206);
    expect(question(china.i, "first united China")[0][2]).not.toContain("Confucius");
    const exams = (china.a.t ?? []).find((t) => t[0] === "Imperial examinations")!;
    expect(exams[1]).not.toMatch(/merit|official/);
    const mandate = (china.a.t ?? []).find((t) => t[0] === "Mandate of Heaven")!;
    expect(mandate[1]).not.toMatch(/take it away|bad/);
  });
});
