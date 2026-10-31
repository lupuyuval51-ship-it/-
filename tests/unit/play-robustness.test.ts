import { afterEach, describe, expect, it, vi } from "vitest";
import { generateOffline } from "@/lib/offline/generate";
import { OfflineStore, storageErrorCode } from "@/lib/offline/store";
import { ApiFailure, flushPosition, httpTransport, type PlayTransport } from "@/components/game/transport";
import { offlineTransport } from "@/components/game/offlineTransport";
import { bootErrorKey, playBackAction } from "@/components/game/playModel";
import { DICTIONARIES, type DictKey } from "@/lib/i18n";
import { flakyKV, NOTES } from "./offline-helpers";
import { request } from "./helpers";

afterEach(() => vi.unstubAllGlobals());

// ───────── Android Back on the play screen ─────────

describe("what Back does on the play screen", () => {
  const playing = { ready: true, webgl: true, busy: false } as const;

  it("pauses while playing, closes a panel, leaves from the pause menu and the finished screen", () => {
    expect(playBackAction({ ...playing, overlay: "none" })).toBe("pause");
    for (const overlay of ["dialogue", "boss", "lore", "challenge"] as const) expect(playBackAction({ ...playing, overlay })).toBe("close");
    for (const overlay of ["pause", "done"] as const) expect(playBackAction({ ...playing, overlay })).toBe("leave");
  });

  it("does nothing while a question is being graded (the answer is on its way)", () => {
    expect(playBackAction({ ...playing, overlay: "challenge", busy: true })).toBe("stay");
  });

  it("leaves at once when the screen has no pause menu to show: still loading, failed to start, or no WebGL", () => {
    for (const overlay of ["none", "pause", "challenge"] as const) {
      expect(playBackAction({ ready: false, webgl: true, overlay, busy: false })).toBe("leave");
      expect(playBackAction({ ready: true, webgl: false, overlay, busy: false })).toBe("leave");
    }
  });
});

// ───────── a phone with no room left ─────────

describe("starting a game on a phone that is full", () => {
  // the Android app's own mapping (mobile/src/app-state.ts storageErrorKey)
  const saveErrorKey = (e: unknown): DictKey | null => {
    const code = storageErrorCode(e);
    return code === "STORAGE_FULL" ? "mob.backup.err.STORAGE_FULL" : code === "STORAGE_UNAVAILABLE" ? "mob.backup.err.STORAGE_UNAVAILABLE" : null;
  };

  function fullPhone() {
    const { kv, ctl } = flakyKV();
    const store = new OfflineStore(kv);
    const game = store.addGame(generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" })).spec);
    return { store, game, ctl, transport: offlineTransport(store, () => "A") };
  }

  it("the start fails with the phone's own message instead of the generic 'could not start'", async () => {
    const { game, ctl, transport } = fullPhone();
    ctl.mode = "full";
    const e = await transport.startSession(game.id, false).then(() => null, (x: unknown) => x);
    expect(e).toBeInstanceOf(ApiFailure);
    expect((e as ApiFailure).code).toBe("STORAGE_FULL");
    expect(bootErrorKey(e, saveErrorKey)).toBe("mob.backup.err.STORAGE_FULL");
    ctl.mode = "blocked";
    const blocked = await transport.startSession(game.id, true).then(() => null, (x: unknown) => x);
    expect(bootErrorKey(blocked, saveErrorKey)).toBe("mob.backup.err.STORAGE_UNAVAILABLE");
  });

  it("any other failure, the website (no mapping) and rate limiting keep their texts", () => {
    expect(bootErrorKey(new Error("boom"), saveErrorKey)).toBe("hud.loading.error");
    expect(bootErrorKey(new ApiFailure(500, "GAME_DAMAGED", "x"), saveErrorKey)).toBe("hud.loading.error");
    expect(bootErrorKey(new ApiFailure(507, "STORAGE_FULL", "x"))).toBe("hud.loading.error");
    expect(bootErrorKey(new ApiFailure(429, "RATE_LIMITED", "x"), saveErrorKey)).toBe("common.error.rateLimited");
  });

  it("the messages exist in Hebrew, English and Spanish", () => {
    for (const locale of ["he", "en", "es"] as const) {
      for (const key of ["mob.backup.err.STORAGE_FULL", "mob.backup.err.STORAGE_UNAVAILABLE", "hud.loading.error", "common.error.rateLimited"] as const) {
        expect(DICTIONARIES[locale][key], `${locale} ${key}`).toBeTruthy();
      }
    }
  });
});

// ───────── saving the position when the app goes to the background ─────────

describe("flushPosition", () => {
  const position = { x: 3, y: 0, z: -2, yaw: 1 };

  it("on the device it writes the position through the transport (there is no server route to beacon to)", () => {
    const sendBeacon = vi.fn(() => true);
    vi.stubGlobal("navigator", { sendBeacon });
    const sendEvent = vi.fn(async () => ({}));
    flushPosition({ sendEvent } as unknown as PlayTransport, "s1", position);
    expect(sendEvent).toHaveBeenCalledWith("s1", { type: "save", position });
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("on the website it hands the save to the browser's beacon and sends nothing itself", async () => {
    const sendBeacon = vi.fn((_url: string, _body: Blob) => true);
    vi.stubGlobal("navigator", { sendBeacon });
    const sendEvent = vi.spyOn(httpTransport, "sendEvent");
    flushPosition(httpTransport, "s2", position);
    expect(sendEvent).not.toHaveBeenCalled();
    expect(sendBeacon).toHaveBeenCalledTimes(1);
    const [url, body] = sendBeacon.mock.calls[0]!;
    expect(url).toBe("/api/play/s2/events");
    expect(JSON.parse(await body.text())).toEqual({ type: "save", position });
    sendEvent.mockRestore();
  });

  it("never throws, whatever the transport does", () => {
    vi.stubGlobal("navigator", {});
    expect(() => flushPosition(httpTransport, "s3", position)).not.toThrow();
    const rejects = { sendEvent: () => Promise.reject(new ApiFailure(507, "STORAGE_FULL", "x")) } as unknown as PlayTransport;
    expect(() => flushPosition(rejects, "s3", position)).not.toThrow();
    const throws = { sendEvent: () => { throw new Error("sync"); } } as unknown as PlayTransport;
    expect(() => flushPosition(throws, "s3", position)).not.toThrow();
  });

  it("the offline store really takes the saved position (the write is synchronous, so it lands before the page can freeze)", () => {
    const { kv } = flakyKV();
    const store = new OfflineStore(kv);
    const game = store.addGame(generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" })).spec);
    const s = store.startSession(game.id, false);
    const transport = offlineTransport(store, () => "A");
    expect(s.client.position).toBeNull(); // a fresh run has not been anywhere yet
    flushPosition(transport, s.session.id, position);
    expect(store.startSession(game.id, false).client.position).toEqual(position);
  });
});
