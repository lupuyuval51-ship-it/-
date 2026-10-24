import { generateOffline } from "@/lib/offline/generate";
import { memoryKV, OfflineStore, type KV } from "@/lib/offline/store";
import type { CloudApi, CloudCard, CloudGame, CloudRows, CloudSession, PushBatch } from "@/lib/offline/sync";
import { syncOnce } from "@/lib/offline/sync";
import { findArea, stationActive } from "@/lib/game/state/progress";
import { correctAnswer, request, wrongAnswer } from "./helpers";

export const NOTES = `Photosynthesis: the process plants use to turn light into chemical energy.
Chlorophyll: the green pigment in leaves that absorbs light.
Stomata: tiny pores on a leaf that let gases in and out.
Xylem: the tissue that carries water from the roots up the plant.
Phloem: the tissue that carries sugar around the plant.
Glucose: the sugar plants make during photosynthesis.`;

export const PREFIX = "levelup.offline.";

/** A phone: a store on an in-memory KV with a clock the test controls. */
export function phone(startMs: number, kv: KV = memoryKV()) {
  const t = { now: startMs };
  const store = new OfflineStore(kv, () => (t.now += 10));
  return { t, kv, store, sync: (cloud: CloudApi, user = "u1") => syncOnce(store, kv, cloud, user, () => t.now) };
}

/** A game with one run in which one question was missed and then solved, so the review deck has a card. */
export function populated(startMs = 1_000_000, kv: KV = memoryKV()) {
  const p = phone(startMs, kv);
  const game = p.store.addGame(generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" })).spec);
  const s = p.store.startSession(game.id, false);
  const area = findArea(game.spec, s.client.areaId)!;
  const st = area.stations.find((x) => x.kind === "challenge" && stationActive(game.spec, s.client, x))!;
  const opened = p.store.applyEvent(s.session.id, { type: "open", stationId: st.id });
  const ch = game.spec.challenges.find((c) => c.id === (opened.data as { challenge: { id: string } }).challenge.id)!;
  p.store.applyEvent(s.session.id, { type: "answer", stationId: st.id, answer: wrongAnswer(ch, s.session.id) });
  p.store.applyEvent(s.session.id, { type: "answer", stationId: st.id, answer: correctAnswer(ch, s.session.id) });
  p.store.syncDeck();
  return { ...p, game, sessionId: s.session.id };
}

/** Rewrites one stored value in place (to simulate what an older app version, or damage, left behind). */
export function editStored(kv: KV, key: string, edit: (value: Record<string, unknown>) => void): void {
  const value = JSON.parse(kv.get(PREFIX + key)!) as Record<string, unknown>;
  edit(value);
  kv.set(PREFIX + key, JSON.stringify(value));
}

/** The cloud, in memory: the server stamps updatedAt with its own monotonic clock (like the database trigger does). */
export class FakeCloud implements CloudApi {
  games = new Map<string, CloudGame>();
  sessions = new Map<string, CloudSession>();
  cards = new Map<string, CloudCard>();
  tick = Date.parse("2030-01-01T00:00:00Z");
  fail = false;
  pushes = 0;
  private stamp() { this.tick += 1000; return new Date(this.tick).toISOString(); }
  async pull(since: string | null): Promise<CloudRows> {
    if (this.fail) throw new Error("offline");
    const after = <T extends { updatedAt: string }>(m: Map<string, T>) => [...m.values()].filter((r) => since === null || r.updatedAt > since).sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    return structuredClone({ games: after(this.games), sessions: after(this.sessions), cards: after(this.cards) });
  }
  async pullGameData(gameIds: string[]): Promise<Pick<CloudRows, "sessions" | "cards">> {
    if (this.fail) throw new Error("offline");
    const ids = new Set(gameIds);
    return structuredClone({ sessions: [...this.sessions.values()].filter((s) => ids.has(s.gameId)), cards: [...this.cards.values()].filter((c) => ids.has(c.gameId)) });
  }
  async push(b: PushBatch): Promise<void> {
    if (this.fail) throw new Error("offline");
    this.pushes++;
    for (const g of b.games) this.games.set(g.localId, { ...structuredClone(g), updatedAt: this.stamp(), deletedAt: null });
    for (const s of b.sessions) {
      if (!this.games.has(s.gameId)) throw new Error("foreign key");
      this.sessions.set(s.localId, { ...structuredClone(s), updatedAt: this.stamp() });
    }
    for (const c of b.cards) this.cards.set(c.cardKey, { ...structuredClone(c), updatedAt: this.stamp() });
    for (const id of b.deletedGames) { const g = this.games.get(id); if (g) this.games.set(id, { ...g, deletedAt: this.stamp(), updatedAt: this.stamp() }); }
  }
}

/** A KV that can be made to fail like a full or blocked localStorage. `failOn` limits the failure to some keys. */
export function flakyKV(inner: KV = memoryKV()) {
  const ctl = { mode: "ok" as "ok" | "full" | "blocked", failOn: null as null | ((key: string) => boolean), failedWrites: 0 };
  const kv: KV = {
    get: (k) => inner.get(k),
    set: (k, v) => {
      if (ctl.mode !== "ok" && (!ctl.failOn || ctl.failOn(k))) {
        ctl.failedWrites++;
        throw ctl.mode === "full" ? new DOMException("The quota has been exceeded.", "QuotaExceededError") : new DOMException("The operation is insecure.", "SecurityError");
      }
      inner.set(k, v);
    },
    remove: (k) => inner.remove(k),
    keys: () => inner.keys!(),
  };
  return { kv, inner, ctl };
}
