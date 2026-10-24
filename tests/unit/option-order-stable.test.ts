import { describe, expect, it } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { loadTopicContent } from "@/lib/game/topics/loaders";
import { OfflineStore, memoryKV } from "@/lib/offline/store";

type Opened = { data: { challenge: { options?: { id: string; text: string }[] } } };

describe("the options of a question", () => {
  it("keep their order when the question is opened again, after a hint or a wrong answer (a learner taps by position)", async () => {
    const content = (await loadTopicContent("math-fractions"))!;
    const { spec } = generateOffline({ mode: "FAST", subject: "x", learningGoal: "x", difficulty: "beginner", gameType: "adventure", contentLanguage: "he", topicId: "math-fractions", device: "phone" }, new Date(0), "A", content);
    for (let run = 0; run < 6; run++) {
      const store = new OfflineStore(memoryKV(), () => 1_000);
      const game = store.addGame(spec);
      const { session } = store.startSession(game.id, false);
      const area = spec.areas.find((a) => a.id === session.state.areaId)!;
      let compared = 0;
      for (const st of area.stations.filter((s) => s.kind === "challenge")) {
        let first: Opened;
        try { first = store.applyEvent(session.id, { type: "open", stationId: st.id }) as unknown as Opened; } catch { continue; }
        const options = first.data.challenge.options;
        if (!options) continue;
        const text = (r: Opened) => r.data.challenge.options!.map((o) => o.text).join("|");
        try { store.applyEvent(session.id, { type: "hint", stationId: st.id }); } catch { /* no hint for this one */ }
        expect(text(store.applyEvent(session.id, { type: "open", stationId: st.id }) as unknown as Opened)).toBe(text(first));
        // an answer (right or wrong): opening the question again must show the same order
        store.applyEvent(session.id, { type: "answer", stationId: st.id, answer: { type: "choice", optionId: options[0]!.id }, attempt: 1 });
        try { expect(text(store.applyEvent(session.id, { type: "open", stationId: st.id }) as unknown as Opened)).toBe(text(first)); } catch (e) { if (e instanceof Error && e.name === "AssertionError") throw e; /* resolved by a right guess */ }
        compared++;
      }
      expect(compared).toBeGreaterThan(0);
    }
  });
});
