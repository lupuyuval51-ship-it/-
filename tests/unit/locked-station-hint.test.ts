import { describe, expect, it } from "vitest";
import { lockedText } from "@/lib/game/a11y/scene";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import { blockingMission, missionUnlocked, stationActive } from "@/lib/game/state/progress";
import { generateOffline } from "@/lib/offline/generate";
import { DICTIONARIES, makeT } from "@/lib/i18n";

/** A locked question said only "finish the earlier missions first"; on a phone the mission list is folded, so the learner had no idea what to do. */
describe("a locked station names the mission to finish next", () => {
  it("is a mission the learner can do now, and there is none once the station is open", async () => {
    for (const topicId of ["math-fractions", "course-fractions-1"]) {
      const content = (await loadTopicContent(topicId))!;
      const { spec } = generateOffline({ mode: "FAST", subject: "x", learningGoal: "x", difficulty: "beginner", gameType: "adventure", contentLanguage: "he", topicId, device: "phone" }, new Date(0), "A", content);
      const state = { missionsDone: [] as string[], resolvedStations: {} as Record<string, "correct" | "revealed"> };
      const locked = spec.areas[0]!.stations.filter((s) => s.kind === "challenge" && !stationActive(spec, state, s));
      expect(locked.length, topicId).toBeGreaterThan(0);
      for (const s of locked) {
        const m = blockingMission(spec, state, s);
        expect(m, `${topicId}/${s.id}`).not.toBeNull();
        expect(missionUnlocked(state, m!)).toBe(true);
        expect(state.missionsDone).not.toContain(m!.id);
      }
      const open = spec.areas[0]!.stations.find((s) => s.kind === "challenge" && stationActive(spec, state, s));
      if (open) expect(blockingMission(spec, state, open)).toBeNull();
    }
  });

  it("the toast reads naturally in every language and falls back when no mission is known", () => {
    const base = { kind: "station" as const, id: "s1", label: "רונה 1", stationKind: "challenge" as const, status: "locked" as const, x: 0, z: 0 };
    const he = makeT(DICTIONARIES.he);
    expect(lockedText({ ...base, blockedBy: "קודם לומדים" }, he)).toBe("רונה 1 — נעול. כדי לפתוח, קודם: קודם לומדים.");
    expect(lockedText(base, he)).toBe("רונה 1 — נעול. השלימו קודם את המשימות הקודמות.");
    expect(lockedText({ ...base, lockedByBoss: true, blockedBy: "x" }, he)).toContain("סיבובים");
    const en = makeT(DICTIONARIES.en);
    expect(lockedText({ ...base, label: "Rune 1", blockedBy: "Learn first" }, en)).toBe("Rune 1 — locked. To open it, first: Learn first.");
  });
});
