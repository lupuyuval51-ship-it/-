import { describe, expect, it } from "vitest";
import { findTopic } from "@/lib/game/topics/catalog";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { Question, TopicContent } from "@/lib/game/topics/types";

/**
 * Wave 5, C29: seven history topics (African kingdoms, the aliyot, the American Revolution, the Maya, Aztecs and Incas,
 * ancient China, ancient Egypt, ancient Greece). "The Maya, Aztecs and Incas" gave its answer away by length in 12 of its
 * 14 questions in both languages and "Ancient China" in 5 of 6 (English) and 4 of 6 (Hebrew). Their shortest wrong options
 * were rewritten into real misconceptions: Maya horses and wheeled carts, Columbus conquering Mexico, Aztec wheat fields
 * ploughed by oxen, Inca riders on horses, a base-10 Maya count, European livestock in the Andes, one Maya empire like the
 * Incas', smallpox carried by mosquitoes, hundreds of surviving Maya books, Tenochtitlan as a small town, the Great Wall as
 * the only human-made structure seen from the Moon, Chinese exams as a vote, disasters blamed on the people rather than the
 * ruler. Ancient China, Egypt and Greece had only six or seven items per level (two questions); each level now has eight,
 * four of them questions, numbers or orderings. The answer keys of the existing questions did not move.
 */

const IDS = [
  "history-african-kingdoms", "history-aliyot", "history-american-revolution", "history-americas-civilizations",
  "history-ancient-china", "history-ancient-egypt", "history-ancient-greece",
] as const;
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

describe("history topics (C29)", () => {
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
      const active = (lv.q?.length ?? 0) + (lv.n?.length ?? 0) + (lv.s?.length ?? 0);
      expect(active + (lv.t?.length ?? 0), `${id}/${l}`).toBeGreaterThanOrEqual(8);
      expect(active, `${id}/${l}`).toBeGreaterThanOrEqual(4);
    }
  });

  it.each(IDS)("%s: every answer is explained in 40+ characters; Hebrew has no < or >", async (id) => {
    const c = await load(id);
    for (const l of LEVELS) {
      for (const pair of c[l].q ?? []) for (const [q, , , explanation] of pair) expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
      for (const [answer, en, he] of c[l].n ?? []) for (const [q, , explanation] of [en, he]) {
        expect(explanation.length, `${id}/${l}: ${q}`).toBeGreaterThanOrEqual(40);
        expect(explanation.includes(String(answer)) || explanation.includes(answer.toLocaleString("en-US")), `${id}/${l}: ${q}`).toBe(true);
      }
      for (const [, he] of c[l].q ?? []) for (const s of [he[0], he[1], ...he[2], he[3]]) expect(/[<>]/.test(s), `${id}/${l}: ${s}`).toBe(false);
      for (const [, en, he] of c[l].n ?? []) expect(/[<>]/.test(he[0] + he[2]), `${id}/${l}: ${en[0]}`).toBe(false);
    }
  });

  it("the Maya, Aztecs and Incas: the answer keys stayed and the new distractors are real misconceptions", async () => {
    const c = await load("history-americas-civilizations");
    const keys: [string, string, string, string][] = [
      ["special achievement of the Maya", "They wrote with glyphs and kept detailed calendars", "הם כתבו בגליפים וניהלו לוחות שנה מפורטים", "horses"],
      ["arrived in Mexico in 1519", "Spanish conquistadors led by Hernán Cortés", "כובשים ספרדים בהנהגת הרנן קורטס", "Columbus"],
      ["grow enough food around their island city", "On chinampas, fields built up from mud in the shallow lake", "בצ׳ינמפות, שדות שנבנו מבוץ באגם הרדוד", "oxen"],
      ["run such a huge empire", "With quipus to record numbers and a road network where runners carried messages", "בעזרת קיפו לתיעוד מספרים ורשת דרכים שבה רצים העבירו הודעות", "horses"],
      ["number system did the Maya use", "A system based on 20 that had a sign for zero", "שיטה על בסיס 20 שהיה בה סימן לאפס", "based on 10"],
      ["carry loads and give wool", "Llamas and alpacas", "לאמות ואלפקות", "donkeys"],
      ["How were the Maya organised", "In many city-states, each with its own ruler", "בערי מדינה רבות, ולכל אחת שליט משלה", "single capital"],
      ["smallpox kill so many", "The disease was new there, so no one had immunity to it", "המחלה הייתה חדשה שם, ולכן לאף אחד לא הייתה חסינות נגדה", "mosquitoes"],
      ["burned most Maya books", "From glyphs carved on stone monuments, which scholars have learned to read", "מגליפים שנחקקו על אנדרטאות אבן, שחוקרים למדו לקרוא", "hidden in caves"],
      ["first saw Tenochtitlan", "It was larger than most of them, with perhaps 200,000 people or more", "היא הייתה גדולה מרובן, עם אולי 200,000 תושבים או יותר", "small Spanish town"],
    ];
    for (const [text, en, he, misconception] of keys) {
      const [qe, qh] = question(c, text);
      expect(qe[1], text).toBe(en);
      expect(qh[1], text).toBe(he);
      expect(qe[2].some((w) => w.includes(misconception)), text).toBe(true);
      expect(qe[2].length, text).toBe(qh[2].length);
    }
    // Columbus never reached Mexico; the explanation says so, in both languages
    const [cortesEn, cortesHe] = question(c, "arrived in Mexico in 1519");
    expect(cortesEn[3]).toContain("never came to Mexico");
    expect(cortesHe[3]).toContain("מעולם לא הגיע למקסיקו");
  });

  it("ancient China: the answer keys stayed, the Hebrew spelling is fixed and the new items are answerable", async () => {
    const c = await load("history-ancient-china");
    expect(question(c, "seen from the Moon")[0][1]).toBe("No — that is a popular myth");
    expect(question(c, "seen from the Moon")[0][2][0]).toContain("only human-made structure");
    expect(question(c, "imperial examinations unusual")[0][1]).toBe("Officials could be chosen by tested knowledge rather than only by birth");
    expect(question(c, "floods and famines")[0][1]).toBe("That the ruling dynasty had lost heaven's approval");
    expect(question(c, "first united China")[1][3]).toContain("ואיחד");
    expect(question(c, "first Chinese dynasties")[0][1]).toBe("The Yellow River");
    expect(question(c, "Diamond Sutra")[0][1]).toBe("With carved wooden blocks, a whole page on each block");
    const [years, en, he] = c.i.n![0]!;
    expect(years).toBe(221 - 206);
    expect(en[1] && he[1]).toBeTruthy();
    const [dynEn, dynHe] = c.a.s![0]!;
    expect(dynEn.slice(1).map((s) => s.split(",")[0])).toEqual(["Shang", "Zhou", "Qin", "Han", "Tang", "Ming"]);
    expect(dynHe.length).toBe(dynEn.length);
  });

  it("ancient Egypt and Greece: the new numbers are right", async () => {
    const egypt = await load("history-ancient-egypt");
    expect(egypt.i.n![0]![0]).toBe(1279 - 1213);
    expect(question(egypt, "land of Punt")[0][1]).toBe("Hatshepsut");
    const greece = await load("history-ancient-greece");
    expect(greece.i.n![0]![0]).toBe(7);
    expect(question(greece, "Thermopylae")[0][1]).toBe("The Persian army of Xerxes");
  });
});
