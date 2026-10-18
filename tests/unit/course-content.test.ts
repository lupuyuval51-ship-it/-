import { beforeAll, describe, expect, it } from "vitest";
import { DIFFICULTIES } from "@/lib/game/spec/constants";
import type { GameSpec } from "@/lib/game/spec/schema";
import { playThrough } from "@/lib/game/world/flow";
import { generateOffline } from "@/lib/offline/generate";
import { TOPICS, findTopic } from "@/lib/game/topics/catalog";
import { COURSES, chapterOf, courseChapters, findCourse, isCourseChapter } from "@/lib/game/topics/courses";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import type { LessonText, TopicContent } from "@/lib/game/topics/types";

/**
 * Courses are held to a stricter bar than the rest of the topic library (`topics.test.ts` still checks them like every
 * topic): a lesson that teaches before the questions, enough practice at every level, explanations that explain, and
 * answers that cannot be guessed from their length.
 */
const contents = new Map<string, TopicContent>();
beforeAll(async () => {
  for (const course of COURSES) for (const id of course.chapters) contents.set(id, (await loadTopicContent(id))!);
});

const HEBREW = /\p{Script=Hebrew}/u;
const LEVELS = ["b", "i", "a"] as const;
const lessonTexts = (l: LessonText) => [l.title, ...l.text, l.example, l.task];

describe("the course catalogue", () => {
  it("every course has 8–10 chapters that are real topics, in order, marked with the course and found again", () => {
    expect(COURSES.length).toBeGreaterThan(0);
    for (const course of COURSES) {
      expect(findCourse(course.id)).toBe(course);
      expect(course.chapters.length).toBeGreaterThanOrEqual(8);
      expect(course.chapters.length).toBeLessThanOrEqual(10);
      expect(new Set(course.chapters).size).toBe(course.chapters.length);
      expect(courseChapters(course, findTopic).map((t) => t.id)).toEqual(course.chapters);
      course.chapters.forEach((id, i) => {
        expect(findTopic(id)?.course, id).toBe(course.id);
        expect(chapterOf(id)).toEqual({ course, number: i + 1 });
        expect(isCourseChapter(id)).toBe(true);
      });
      for (const [title, desc, who] of [course.en, course.he]) {
        expect(title.length).toBeLessThanOrEqual(60);
        expect(desc.length).toBeLessThanOrEqual(200);
        expect(who.length).toBeLessThanOrEqual(60);
      }
      expect(HEBREW.test(course.he.join(" "))).toBe(true);
      expect(HEBREW.test(course.en.join(" "))).toBe(false);
    }
    // every topic marked as a chapter is listed in its course
    for (const t of TOPICS.filter((x) => x.course)) expect(findCourse(t.course!)?.chapters, t.id).toContain(t.id);
    expect(isCourseChapter("math-fractions")).toBe(false);
  });
});

describe("course content", () => {
  it("every chapter has a lesson in both languages: one or two paragraphs, a worked example and a hands-on task, each fitting one board", () => {
    for (const [id, c] of contents) {
      expect(c.l, id).toBeDefined();
      for (const lang of ["en", "he"] as const) {
        const l = c.l![lang];
        expect(l.title.length, id).toBeLessThanOrEqual(70);
        expect(l.text.length, id).toBeGreaterThanOrEqual(1);
        expect(l.text.length, id).toBeLessThanOrEqual(2);
        for (const p of l.text) { expect(p.length, `${id}/${lang}: ${p}`).toBeLessThanOrEqual(420); expect(p.length, id).toBeGreaterThanOrEqual(150); }
        for (const s of [l.example, l.task]) { expect(s.length, `${id}/${lang}: ${s}`).toBeLessThanOrEqual(420); expect(s.length, id).toBeGreaterThanOrEqual(120); }
        for (const s of lessonTexts(l)) {
          expect(/[\u0000-\u001F\u007F‎‏‪-‮⁦-⁩]/.test(s), `${id}/${lang}: ${s}`).toBe(false);
          expect(HEBREW.test(s), `${id}/${lang}: ${s}`).toBe(lang === "he");
        }
      }
    }
  });

  it("Hebrew text never uses < or > (a right-to-left line draws them mirrored, which would flip a comparison)", () => {
    for (const [id, c] of contents) {
      const he = [...lessonTexts(c.l!.he), ...LEVELS.flatMap((lv) => [
        ...(c[lv].t ?? []).flatMap((x) => [x[2], x[3]]),
        ...(c[lv].q ?? []).flatMap(([, h]) => [h[0], h[1], ...h[2], h[3], h[4] ?? ""]),
        ...(c[lv].n ?? []).flatMap(([, , h]) => [h[0], h[2], h[3] ?? ""]),
        ...(c[lv].s ?? []).flatMap(([, h]) => h),
      ])];
      for (const s of he) expect(/[<>]/.test(s), `${id}: ${s}`).toBe(false);
    }
  });

  it("every level has at least 8 items of practice, mostly questions and calculations", () => {
    for (const [id, c] of contents) {
      for (const lv of LEVELS) {
        const l = c[lv];
        const items = (l.t?.length ?? 0) + (l.q?.length ?? 0) + (l.n?.length ?? 0) + (l.s?.length ?? 0);
        expect(items, `${id}/${lv}`).toBeGreaterThanOrEqual(8);
        expect((l.q?.length ?? 0) + (l.n?.length ?? 0), `${id}/${lv}`).toBeGreaterThanOrEqual(6);
      }
    }
  });

  it("every question and calculation explains its answer in a real sentence (50+ characters) in both languages", () => {
    for (const [id, c] of contents) {
      for (const lv of LEVELS) {
        for (const pair of c[lv].q ?? []) for (const [q, , , explanation] of pair) expect(explanation.length, `${id}/${lv}: ${q}`).toBeGreaterThanOrEqual(50);
        for (const [, en, he] of c[lv].n ?? []) for (const [q, , explanation] of [en, he]) expect(explanation.length, `${id}/${lv}: ${q}`).toBeGreaterThanOrEqual(50);
      }
    }
  });

  it("the right answer is the longest option in at most 35 % of a course's questions, in each language", () => {
    for (const course of COURSES) {
      for (const lang of [0, 1] as const) {
        let all = 0, longest = 0;
        for (const id of course.chapters) for (const lv of LEVELS) for (const pair of contents.get(id)![lv].q ?? []) {
          const [, answer, wrong] = pair[lang];
          all++;
          if (answer.length > Math.max(...wrong.map((w) => w.length))) longest++;
        }
        expect(all).toBeGreaterThanOrEqual(course.chapters.length * 15);
        expect(longest / all, `${course.id}/${lang ? "he" : "en"}`).toBeLessThanOrEqual(0.35);
      }
    }
  });
});

// ───────────────────────────── the games they build ─────────────────────────────

const request = (topicId: string, difficulty: string, lang: "he" | "en", mode: "FAST" | "FULL") =>
  ({ mode, subject: "ignored", learningGoal: "ignored", difficulty, gameType: "adventure", contentLanguage: lang, topicId, device: "phone" });

function lessonOrder(spec: GameSpec, label: string) {
  const first = spec.areas[0]!;
  const boards = first.stations.filter((s) => s.kind === "lore" && /lesson|example/.test(s.id)).map((s) => s.id);
  expect(boards.length, label).toBeGreaterThanOrEqual(2);
  const learn = spec.missions.find((m) => m.id === "m-1-0")!;
  expect(learn, label).toBeDefined();
  expect(learn.requires).toEqual([]);
  expect(learn.objectives.flatMap((o) => (o.type === "visit" ? o.stationIds : []))).toEqual(boards);
  // nothing that asks a question opens before the lesson has been read
  for (const m of spec.missions.filter((x) => x.id !== "m-1-0" && x.objectives.some((o) => o.type === "solve"))) {
    const chain = new Set<string>();
    const walk = (id: string) => { for (const r of spec.missions.find((x) => x.id === id)?.requires ?? []) { chain.add(r); walk(r); } };
    walk(m.id);
    expect(chain.has("m-1-0"), `${label}: ${m.id}`).toBe(true);
  }
  const last = spec.areas[spec.areas.length - 1]!;
  expect(last.stations.some((s) => s.kind === "lore" && s.id.endsWith("-task")), label).toBe(true);
  expect(playThrough(spec).finished, label).toBe(true);
}

describe("course chapters build games that teach first", () => {
  it("at every level, FULL and FAST, in both languages: lesson boards first, questions after, the hands-on task at the end", () => {
    for (const [id, c] of contents) {
      for (const d of DIFFICULTIES) {
        for (const lang of ["he", "en"] as const) {
          for (const mode of ["FULL", "FAST"] as const) {
            const spec = generateOffline(request(id, d, lang, mode), new Date(0), "A", c).spec;
            const label = `${id}/${d}/${lang}/${mode}`;
            lessonOrder(spec, label);
            expect(spec.meta.generator?.kind, label).toBe("catalog");
            if (mode === "FULL") {
              expect(spec.areas.length, label).toBe(2);
              // a Full Adventure plays (nearly) all of the level's practice
              const placed = spec.areas.flatMap((a) => a.stations).filter((s) => s.kind === "challenge").length;
              expect(placed, label).toBeGreaterThanOrEqual(9);
            }
            const lesson = spec.areas[0]!.stations.find((s) => s.id === "s-1-lesson-1");
            expect(lesson?.loreText, label).toBe(c.l![lang].text[0]);
          }
        }
      }
    }
  });

  it("a topic without a lesson keeps its old shape (no lesson mission, the guide's mission first)", () => {
    const entry = TOPICS.find((t) => !t.course)!;
    return loadTopicContent(entry.id).then((c) => {
      const spec = generateOffline(request(entry.id, "beginner", "he", "FULL"), new Date(0), "A", c!).spec;
      expect(spec.missions.some((m) => m.id === "m-1-0")).toBe(false);
      expect(spec.missions[0]!.objectives[0]!.type).toBe("talk");
    });
  });
});
