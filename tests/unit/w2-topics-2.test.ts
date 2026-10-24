import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PLAN_IDS } from "@/config/plans";
import { DIFFICULTIES } from "@/lib/game/spec/constants";
import { generateOffline } from "@/lib/offline/generate";
import { TOPICS, TOPIC_CATEGORIES, findTopic } from "@/lib/game/topics/catalog";
import { PLUS_PRO_TOPICS } from "@/lib/game/topics/catalog-plus-pro";
import { COURSES, chapterOf, courseChapters, findCourse, isCourseChapter } from "@/lib/game/topics/courses";
import { TOPIC_LOADERS, loadTopicContent } from "@/lib/game/topics/loaders";
import { PRO_ONLY_TOPIC_IDS, planOpeningTopic, topicOpenFor, topicTier } from "@/lib/game/topics/premium";
import type { TopicContent } from "@/lib/game/topics/types";

/**
 * Topic library plumbing (wave 2, topics-2): the loaders map each topic to its own module, nothing a request can send
 * reaches a loader that is not a topic, building a game never changes the shared content module, the documented
 * "every third topic" rule of `premium.ts`, and the course manifest's lookups and guarantees.
 */

const root = path.resolve(__dirname, "../..");
const PROTOTYPE_KEYS = ["__proto__", "constructor", "toString", "hasOwnProperty", "valueOf", "isPrototypeOf"];
const collection = new Set(PLUS_PRO_TOPICS.map((t) => t.id));

describe("topic loaders", () => {
  it("every loader imports the module named after its own topic id, and that module exists", () => {
    // `topics.test.ts` checks that the keys are the catalogue and `bundle-boundary.test.ts` that the imports are distinct
    // literals; neither notices two loaders whose modules are swapped, which would teach topic A with topic B's content.
    const source = readFileSync(path.join(root, "src/lib/game/topics/loaders.ts"), "utf8");
    const pairs = [...source.matchAll(/^\s*"([^"]+)": \(\) => import\("\.\/content\/([^"]+)"\),?\s*$/gm)].map((m) => [m[1]!, m[2]!] as const);
    expect(pairs.length).toBe(Object.keys(TOPIC_LOADERS).length);
    expect(pairs.length).toBe(TOPICS.length);
    for (const [key, file] of pairs) {
      expect(file, key).toBe(key);
      expect(existsSync(path.join(root, "src/lib/game/topics/content", `${file}.ts`)), key).toBe(true);
    }
  });

  it("loads nothing for an id that is not a topic, the names of Object's own properties included", async () => {
    for (const id of ["", "math-nope", "MATH-FRACTIONS", " math-fractions", "../content/math-fractions", ...PROTOTYPE_KEYS]) {
      expect(await loadTopicContent(id), JSON.stringify(id)).toBeNull();
    }
  });

  it("a topic is loaded once: loading it again hands back the same content", async () => {
    const id = TOPICS[0]!.id;
    const a = await loadTopicContent(id);
    expect(a).not.toBeNull();
    expect(await loadTopicContent(id)).toBe(a);
  });
});

describe("building a game leaves the shared topic content as it was", () => {
  // The content module is one object per process (the server's whole life on the website): a build that sorted,
  // shuffled or clipped it in place would change every later game of that topic.
  const sample = [
    ...TOPIC_CATEGORIES.map((cat) => TOPICS.find((t) => t.cat === cat && !t.course && !collection.has(t.id))!),
    ...TOPIC_CATEGORIES.map((cat) => PLUS_PRO_TOPICS.find((t) => t.cat === cat)!),
    ...COURSES.flatMap((c) => c.chapters.map((id) => findTopic(id)!)),
  ];
  const contents = new Map<string, TopicContent>();
  beforeAll(async () => {
    for (const t of sample) contents.set(t.id, (await loadTopicContent(t.id))!);
  });

  it("at every level, in both languages, as a Fast Quest and as a Full Adventure", () => {
    expect(sample.length).toBeGreaterThanOrEqual(TOPIC_CATEGORIES.length * 2 + 8);
    for (const t of sample) {
      const content = contents.get(t.id)!;
      const before = JSON.stringify(content);
      for (const difficulty of DIFFICULTIES) {
        for (const lang of ["he", "en"] as const) {
          for (const mode of ["FAST", "FULL"] as const) {
            const req = { mode, subject: t[lang][0], learningGoal: t[lang][1], difficulty, gameType: "adventure", contentLanguage: lang, topicId: t.id, device: "phone" };
            generateOffline(req, new Date(0), "A", content);
          }
        }
      }
      expect(JSON.stringify(content), t.id).toBe(before);
    }
  });
});

describe("premium.ts: which topics Free does not open", () => {
  it("in the original library, exactly every third topic of a category (the 3rd, 6th, 9th…), course chapters left out", () => {
    for (const cat of TOPIC_CATEGORIES) {
      const inCat = TOPICS.filter((t) => t.cat === cat && !t.course && !collection.has(t.id));
      inCat.forEach((t, i) => expect(topicTier(t.id) !== "free", `${cat} #${i + 1} ${t.id}`).toBe((i + 1) % 3 === 0));
      // the Pro-only two are among them, so the first two of a category are open to everyone
      expect(inCat.filter((t) => PRO_ONLY_TOPIC_IDS.has(t.id)).length, cat).toBe(2);
    }
  });
});

describe("the course manifest", () => {
  it("finds nothing for an unknown id or the names of Object's own properties", () => {
    for (const id of ["", "fractions", "FRACTIONS-5-6", ...PROTOTYPE_KEYS]) {
      expect(findCourse(id), id).toBeUndefined();
      expect(chapterOf(id), id).toBeNull();
      expect(isCourseChapter(id), id).toBe(false);
    }
  });

  it("course ids are unique and a topic is a chapter of one course at most (so its chapter number is unambiguous)", () => {
    expect(new Set(COURSES.map((c) => c.id)).size).toBe(COURSES.length);
    const all = COURSES.flatMap((c) => c.chapters);
    expect(new Set(all).size).toBe(all.length);
  });

  it("a course's chapters share one category and are meant for the course's ages", () => {
    for (const course of COURSES) {
      const rows = courseChapters(course, findTopic);
      expect(new Set(rows.map((t) => t.cat)).size, course.id).toBe(1);
      for (const t of rows) {
        expect(t.ages[0], t.id).toBeGreaterThanOrEqual(course.ages[0]);
        expect(t.ages[1], t.id).toBeLessThanOrEqual(course.ages[1]);
      }
      // the audience line names the ages, in both languages
      for (const who of [course.en[2], course.he[2]]) expect(who, course.id).toContain(`${course.ages[0]}–${course.ages[1]}`);
    }
  });

  it("every chapter is open on every plan, and the cheapest plan that opens it is Free", () => {
    for (const course of COURSES) {
      for (const id of course.chapters) {
        for (const plan of PLAN_IDS) expect(topicOpenFor(plan, id), `${id} ${plan}`).toBe(true);
        expect(planOpeningTopic(id), id).toBe("FREE");
      }
    }
  });

  it("courseChapters keeps the teaching order and leaves out a chapter the catalogue does not have", () => {
    const course = COURSES[0]!;
    const missing = course.chapters[1]!;
    const rows = courseChapters(course, (id) => (id === missing ? undefined : findTopic(id)));
    expect(rows.map((t) => t.id)).toEqual(course.chapters.filter((id) => id !== missing));
  });
});
