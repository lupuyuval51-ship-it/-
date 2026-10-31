import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { sameProgress } from "@/components/game/clientState";
import { StaticBackdrop, StaticLife, StaticLights, StaticParticles, StaticPlayerAvatar, StaticSky, StaticWorldView } from "@/components/game/scene/staticScene";
import { Backdrop } from "@/components/game/scene/Backdrop";
import { Life } from "@/components/game/scene/Life";
import { Particles } from "@/components/game/scene/Particles";
import { PlayerAvatar } from "@/components/game/scene/PlayerAvatar";
import { Lights, Sky } from "@/components/game/scene/Sky";
import { WorldView } from "@/components/game/scene/WorldView";
import type { ClientState } from "@/lib/game/state/progress";
import { generateOffline } from "@/lib/offline/generate";
import { memoryKV, OfflineStore } from "@/lib/offline/store";
import { NOTES } from "./offline-helpers";
import { request } from "./helpers";

/** A started run on a phone: the client state after each event is what the play screen would be handed. */
function run() {
  const store = new OfflineStore(memoryKV(), () => 1_000);
  const game = store.addGame(generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" })).spec);
  const s = store.startSession(game.id, false);
  return { store, sessionId: s.session.id, client: s.client as ClientState };
}

describe("an autosave does not re-render the play screen", () => {
  // The autosave runs every few seconds of walking and answers with a fresh state object that differs only in the position.
  it("a save answer differs from the last state only in the position, and is recognised as the same", () => {
    const { store, sessionId, client } = run();
    const res = store.applyEvent(sessionId, { type: "save", position: { x: 4, y: 1, z: -3, yaw: 0.5 } });
    const next = res.state as ClientState;
    expect(next).not.toBe(client);
    expect(next.position).toEqual({ x: 4, y: 1, z: -3, yaw: 0.5 });
    expect(sameProgress(client, next)).toBe(true);
    // and again, from the state the previous save left behind
    const again = store.applyEvent(sessionId, { type: "save", position: { x: 9, y: 1, z: 2, yaw: 1 } }).state as ClientState;
    expect(sameProgress(next, again)).toBe(true);
  });

  it("anything the screen shows still counts: progress, score, area, and the first state", () => {
    const { client } = run();
    expect(sameProgress(null, client)).toBe(false);
    expect(sameProgress(client, { ...client, collected: [...client.collected, "item-1"] })).toBe(false);
    expect(sameProgress(client, { ...client, score: client.score + 10 })).toBe(false);
    expect(sameProgress(client, { ...client, areaId: `${client.areaId}-2` })).toBe(false);
    expect(sameProgress(client, { ...client, streak: client.streak + 1 })).toBe(false);
    expect(sameProgress(client, { ...client, position: { x: 1, y: 2, z: 3, yaw: 0 } })).toBe(true);
  });

  it("the play screen applies a save answer only when it differs in more than the position", () => {
    const src = readFileSync(path.join(import.meta.dirname, "../../src/components/game/PlayClient.tsx"), "utf8");
    expect(src).toMatch(/event\.type !== "save" \|\| !sameProgress\(clientRef\.current, res\.state\)/);
  });
});

describe("the parts of the scene that never read progress are memoised", () => {
  const MEMO = Symbol.for("react.memo");
  const pairs = [
    ["Sky", StaticSky, Sky], ["Lights", StaticLights, Lights], ["Backdrop", StaticBackdrop, Backdrop], ["Life", StaticLife, Life],
    ["WorldView", StaticWorldView, WorldView], ["Particles", StaticParticles, Particles], ["PlayerAvatar", StaticPlayerAvatar, PlayerAvatar],
  ] as const;

  for (const [name, wrapped, original] of pairs) {
    it(`${name} is the original component wrapped in memo`, () => {
      expect((wrapped as unknown as { $$typeof: symbol }).$$typeof).toBe(MEMO);
      expect((wrapped as unknown as { type: unknown }).type).toBe(original);
    });
  }

  it("the canvas draws those memoised parts, not the plain ones", () => {
    const src = readFileSync(path.join(import.meta.dirname, "../../src/components/game/scene/GameCanvas.tsx"), "utf8");
    for (const [name] of pairs) {
      expect(src, name).toContain(`<Static${name} `);
      expect(src, name).not.toMatch(new RegExp(`<${name}[ />]`));
    }
  });
});
