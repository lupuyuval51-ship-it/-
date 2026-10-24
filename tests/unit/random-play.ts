import { generateOffline } from "@/lib/offline/generate";
import { OfflineError, type OfflineStore } from "@/lib/offline/store";
import type { GameSpec } from "@/lib/game/spec/schema";
import { findArea, findChallenge, stationActive } from "@/lib/game/state/progress";
import { correctAnswer, request, wrongAnswer, deckSeedOf } from "./helpers";

/** Small deterministic random generator so a failing run can be reproduced from its seed. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A few ready games (a full adventure and two quick ones, one in Hebrew) to add to a store. */
export const POOL: GameSpec[] = [
  generateOffline(request({ subject: "Fractions" })).spec,
  generateOffline(request({ subject: "Decimals", mode: "FAST" })).spec,
  generateOffline(request({ subject: "Percent", mode: "FAST", contentLanguage: "he" })).spec,
];

/**
 * One random thing a learner could do on this device: add a game, start or restart a run, move around, miss a question (which
 * puts it in the review deck), review a card, or delete a game. Returns a short label for the log. Moves the game refuses
 * (wrong place, already done) are normal and are swallowed.
 */
export function randomAction(store: OfflineStore, rand: () => number): string {
  const roll = (n: number) => Math.floor(rand() * n);
  const pick = <T,>(xs: T[]): T => xs[roll(xs.length)]!;
  const games = store.listGames();
  const op = roll(10);
  try {
    if (op === 0 || games.length === 0) {
      store.addGame(pick(POOL));
      return "add";
    }
    if (op === 1) {
      store.startSession(pick(games).id, rand() < 0.5);
      return "start";
    }
    if (op <= 4) {
      const g = pick(games);
      const s = store.startSession(g.id, false); // resumes the run in progress (or begins one)
      const area = findArea(store.getGame(g.id)!.spec, s.client.areaId)!;
      const state = store.getSession(s.session.id)!.state;
      const free = Array.from({ length: area.collectibles.count }, (_, k) => `${area.id}:c${k}`).filter((id) => !state.collected.includes(id));
      if (rand() < 0.5 && free.length > 0) store.applyEvent(s.session.id, { type: "collect", itemId: free[0] });
      else if (area.npcs.length > 0) store.applyEvent(s.session.id, { type: "talk", npcId: pick(area.npcs).id });
      return "move";
    }
    if (op === 5 && rand() < 0.5) {
      store.deleteGame(pick(games).id);
      return "delete";
    }
    const g = pick(games);
    const s = store.startSession(g.id, false);
    const spec = store.getGame(g.id)!.spec;
    const area = findArea(spec, s.client.areaId)!;
    const st = area.stations.find((x) => x.kind === "challenge" && stationActive(spec, s.client, x) && !s.client.resolvedStations[x.id]);
    if (st && rand() < 0.6) {
      const opened = store.applyEvent(s.session.id, { type: "open", stationId: st.id });
      const ch = spec.challenges.find((c) => c.id === (opened.data as { challenge: { id: string } }).challenge.id)!;
      store.applyEvent(s.session.id, { type: "answer", stationId: st.id, answer: wrongAnswer(ch, s.session.id) });
      store.applyEvent(s.session.id, { type: "answer", stationId: st.id, answer: correctAnswer(ch, s.session.id) });
      store.deckSummary();
      return "miss";
    }
    const card = Object.values(store.syncDeck()).find((c) => !c.mastered);
    const cardGame = card && store.getGame(card.gameId);
    const ch = card && cardGame && findChallenge(cardGame.spec, card.challengeId);
    if (card && ch) store.deckPractice({ action: "answer", challengeId: card.key, answer: correctAnswer(ch, deckSeedOf(store, card.key)), attempt: 1 });
    return "review";
  } catch (e) {
    if (!(e instanceof OfflineError)) throw e;
    return "refused";
  }
}
