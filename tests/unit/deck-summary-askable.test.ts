import { describe, expect, it } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { memoryKV, OfflineStore } from "@/lib/offline/store";
import { findArea, stationActive } from "@/lib/game/state/progress";
import { correctAnswer, request, wrongAnswer } from "./helpers";

const NOTES = `Photosynthesis: the process plants use to turn light into chemical energy.
Chlorophyll: the green pigment that absorbs light.
Stomata: small pores in leaves that let gases in and out.
Glucose: the sugar plants make in photosynthesis.
Xylem: the tissue that carries water up from the roots.`;

/** A store with one missed-then-solved question in the deck. */
function withOneCard() {
  const kv = memoryKV();
  const store = new OfflineStore(kv, () => 1_000_000);
  const a = store.addGame(generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" })).spec);
  const s = store.startSession(a.id, false);
  const area = findArea(a.spec, s.client.areaId)!;
  const st = area.stations.find((x) => x.kind === "challenge" && stationActive(a.spec, s.client, x))!;
  const opened = store.applyEvent(s.session.id, { type: "open", stationId: st.id });
  const ch = a.spec.challenges.find((c) => c.id === (opened.data as { challenge: { id: string } }).challenge.id)!;
  store.applyEvent(s.session.id, { type: "answer", stationId: st.id, answer: wrongAnswer(ch, s.session.id) });
  store.applyEvent(s.session.id, { type: "answer", stationId: st.id, answer: correctAnswer(ch, s.session.id) });
  return { kv, store, game: a, ch };
}

describe("deck summary counts only questions a round can ask", () => {
  it("agrees with the round when the game is readable", () => {
    const { store } = withOneCard();
    expect(store.deckSummary()).toMatchObject({ total: 1, due: 1 });
    expect((store.deckPractice({ action: "start" }) as { items: unknown[] }).items).toHaveLength(1);
  });

  it("leaves out a card whose game can no longer be read", () => {
    const { kv, store, game } = withOneCard();
    const key = kv.keys!().find((k) => k.endsWith(`game.${game.id}`))!;
    kv.set(key, "{not json");
    expect((store.deckPractice({ action: "start" }) as { items: unknown[] }).items).toHaveLength(0);
    expect(store.deckSummary()).toMatchObject({ total: 0, due: 0, nextDue: null });
  });

  it("leaves out a card whose question is no longer in its game", () => {
    const { kv, store, game, ch } = withOneCard();
    const key = kv.keys!().find((k) => k.endsWith(`game.${game.id}`))!;
    kv.set(key, kv.get(key)!.replaceAll(`"${ch.id}"`, `"${ch.id}-gone"`));
    expect((store.deckPractice({ action: "start" }) as { items: unknown[] }).items).toHaveLength(0);
    expect(store.deckSummary().due).toBe(0);
  });
});
