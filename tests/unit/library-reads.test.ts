import { describe, expect, it, vi } from "vitest";
import { COURSES } from "@/lib/game/topics/courses";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import { generateOffline } from "@/lib/offline/generate";
import { memoryKV, OfflineStore, type KV } from "@/lib/offline/store";
import { loadCourseProgress } from "../../mobile/src/course-model";
import { loadLibrary } from "../../mobile/src/library-model";
import { NOTES, PREFIX } from "./offline-helpers";
import { request } from "./helpers";

vi.mock("@/lib/offline/entitlement", () => ({ getOfflinePlan: () => "PRO", getOfflineTier: () => "A" }));

const course = COURSES[0]!;
const chapter = course.chapters[0]!;

/** An in-memory KV that counts how often each stored game is read (each read parses the whole spec). */
function countingKV() {
  const inner = memoryKV();
  const reads = new Map<string, number>();
  const kv: KV = {
    get: (k) => {
      if (k.startsWith(`${PREFIX}game.`)) reads.set(k, (reads.get(k) ?? 0) + 1);
      return inner.get(k);
    },
    set: (k, v) => inner.set(k, v),
    remove: (k) => inner.remove(k),
    keys: () => inner.keys!(),
  };
  return { kv, reads };
}

async function library() {
  const { kv, reads } = countingKV();
  const store = new OfflineStore(kv, () => 1_000);
  const topic = generateOffline({ mode: "FAST", subject: "x", learningGoal: "x", difficulty: "beginner", gameType: "adventure", contentLanguage: "en", topicId: chapter, device: "phone" }, new Date(0), "A", (await loadTopicContent(chapter))!);
  const chapterGame = store.addGame(topic.spec);
  store.startSession(chapterGame.id, false);
  const notes = [1, 2].map(() => store.addGame(generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" })).spec));
  return { store, reads, chapterGame, notes };
}

describe("the home screen reads each stored game once", () => {
  it("a library row carries the game's level and topic, so no spec is read again for them", async () => {
    const { store, chapterGame } = await library();
    const row = store.listGames().find((g) => g.id === chapterGame.id)!;
    expect(row).toMatchObject({ generatorKind: "catalog", difficulty: "beginner", templateId: chapter });
  });

  it("loading the library and the course progress parses every game spec once, not once per screen part", async () => {
    const { store, reads } = await library();
    reads.clear();
    const lib = loadLibrary(store);
    if (!lib.ok) throw new Error("load failed");
    const progress = loadCourseProgress(store, course, lib.games);
    expect(reads.size).toBe(3);
    for (const [key, n] of reads) expect(n, key).toBe(1);
    // the same answer as reading the games a second time
    expect(progress).toEqual(loadCourseProgress(store, course));
    expect(progress.chapters[0]!.resume).not.toBeNull();
    expect(lib.games.every((g) => g.difficulty === "beginner")).toBe(true);
  });

  it("one game's row (the results screen's best score) reads only that game", async () => {
    const { store, reads, chapterGame } = await library();
    reads.clear();
    const one = store.gameSummary(chapterGame.id);
    expect([...reads.keys()]).toEqual([`${PREFIX}game.${chapterGame.id}`]);
    expect(one).toEqual(store.listGames().find((g) => g.id === chapterGame.id));
    expect(store.gameSummary("nope")).toBeNull();
  });
});
