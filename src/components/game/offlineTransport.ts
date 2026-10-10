import { RENDER_PROFILES } from "@/config/graphics";
import type { GraphicsTier } from "@/config/plans";
import { OfflineError, type OfflineStore } from "@/lib/offline/store";
import { ApiFailure, type PlayTransport } from "./transport";

/** Pseudo session id for the cross-game "review my mistakes" deck. */
export const DECK_SESSION = "deck";

/** Same contract as the server API, answered on the device. Errors keep the server's status/code shape. */
export function offlineTransport(store: OfflineStore, tier: () => GraphicsTier, opts: { testHooks?: boolean } = {}): PlayTransport {
  const wrap = async <T>(fn: () => T): Promise<T> => {
    try {
      return fn();
    } catch (e) {
      if (e instanceof OfflineError) throw new ApiFailure(e.status, e.code, e.message);
      throw e;
    }
  };
  return {
    startSession: (gameId, restart) =>
      wrap(() => {
        const s = store.startSession(gameId, restart);
        const g = s.game.spec.meta.generator;
        const t = tier();
        return {
          sessionId: s.session.id, resumed: s.resumed,
          game: { id: s.game.id, title: s.game.title, revision: s.game.revision, generator: { kind: g?.kind ?? "demo", provider: g?.provider ?? "demo" } },
          spec: s.spec, state: s.client, maxScore: s.maxScore,
          render: { tier: t, plan: "OFFLINE", profile: RENDER_PROFILES[t] },
          testHooks: opts.testHooks === true,
        };
      }),
    sendEvent: <T,>(sessionId: string, event: Record<string, unknown>) => wrap(() => store.applyEvent(sessionId, event) as unknown as T),
    practice: <T,>(sessionId: string, body: unknown) => wrap(() => (sessionId === DECK_SESSION ? store.deckPractice(body) : store.practice(sessionId, body)) as T),
  };
}
