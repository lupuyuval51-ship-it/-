/**
 * Courses: a few topic-library topics taught in a fixed order, each one a chapter with a short lesson (`TopicContent.l`)
 * before its questions. A chapter is an ordinary topic (same build, validation, tier clamp, phone fit and "Topic library"
 * label, never AI); this file only says which topics make up a course and in what order. Chapters are free on every plan
 * (`premium.ts` never lists them) and are not counted in a category's paid third.
 *
 * Small on purpose: the app's home screen shows the course card, so this sits in the first chunk. It does not import the
 * catalogue (hundreds of rows, kept out of the app's first chunk): the chapters' rows are looked up by the caller.
 */
import type { TopicEntry } from "./types";

export interface Course {
  id: string;
  /** [title, one-line description, who it is for] */
  en: readonly [string, string, string];
  he: readonly [string, string, string];
  ages: readonly [number, number];
  /** Topic ids of the chapters, in teaching order. */
  chapters: readonly string[];
}

export const COURSES: readonly Course[] = [
  {
    id: "fractions-5-6",
    en: ["Fractions, decimals and percentages", "Nine chapters from “what is a fraction” to discounts and price rises: a short lesson, a worked example, a hands-on task and practice with explanations.", "For grades 5–6 (ages 10–12)"],
    he: ["שברים, מספרים עשרוניים ואחוזים", "תשעה פרקים מ״מהו שבר״ ועד הנחות והתייקרויות: שיעור קצר, דוגמה פתורה, משימה מעשית ותרגול עם הסברים.", "לכיתות ה׳–ו׳ (גילאי 10–12)"],
    ages: [10, 12],
    chapters: [
      "course-fractions-1", "course-fractions-2", "course-fractions-3",
      "course-fractions-4", "course-fractions-5", "course-fractions-6",
      "course-fractions-7", "course-fractions-8", "course-fractions-9",
    ],
  },
];

const BY_ID = new Map(COURSES.map((c) => [c.id, c]));

export const findCourse = (id: string): Course | undefined => BY_ID.get(id);

/** The chapters of a course as catalogue rows, in order (`find` is the catalogue's `findTopic`). */
export const courseChapters = (course: Course, find: (id: string) => TopicEntry | undefined): TopicEntry[] =>
  course.chapters.map((id) => find(id)).filter((t): t is TopicEntry => Boolean(t));

/** The course a topic is a chapter of, and its 1-based chapter number. */
export function chapterOf(topicId: string): { course: Course; number: number } | null {
  for (const course of COURSES) {
    const i = course.chapters.indexOf(topicId);
    if (i >= 0) return { course, number: i + 1 };
  }
  return null;
}

export const isCourseChapter = (topicId: string): boolean => chapterOf(topicId) !== null;
