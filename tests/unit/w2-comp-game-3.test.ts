import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { shownHint } from "@/components/game/PracticeClient";
import { startUnity, type UnityStatus } from "@/components/game/UnityView";
import { BRIDGE_METHODS } from "@/lib/game/unity/bridge";
import { mechanicsForArea } from "@/lib/game/spec/mechanics";
import { COLLECT_POINTS, collectibleIds } from "@/lib/game/state/progress";
import type { UnityFrame } from "@/lib/game/unity/bridge";
import { generateOffline } from "@/lib/offline/generate";
import { memoryKV, OfflineStore } from "@/lib/offline/store";
import { request } from "./helpers";
import { NOTES } from "./offline-helpers";

const src = (file: string) => readFileSync(path.join(import.meta.dirname, "../../src/components/game", file), "utf8");
const tick = () => new Promise((r) => setTimeout(r, 0));

// ───────────────────────── Unity view: one outcome, never a crash ─────────────────────────

interface FakeInstance { SendMessage: ReturnType<typeof vi.fn>; Quit: ReturnType<typeof vi.fn> }

/** A page with a fake Unity build: `onSend` runs inside `SendMessage` (Unity answers synchronously there). */
function fakePage(opts: { defineFactory?: boolean; preloaded?: boolean; onSend?: (method: string, w: Record<string, unknown>) => void; quit?: () => Promise<void>; hold?: Promise<void> } = {}) {
  const scripts: { src: string; onload?: () => void; onerror?: () => void; remove: () => void }[] = [];
  const instances: FakeInstance[] = [];
  const w: Record<string, unknown> = { devicePixelRatio: 3 };
  const factory = vi.fn(async () => {
    const inst: FakeInstance = {
      SendMessage: vi.fn((_obj: string, method: string) => opts.onSend?.(method, w)),
      Quit: vi.fn(opts.quit ?? (async () => undefined)),
    };
    instances.push(inst);
    await opts.hold; // the instance is starting (downloading, compiling) until this settles
    return inst;
  });
  if (opts.preloaded) w.createUnityInstance = factory;
  const doc = {
    createElement: () => {
      const s = { src: "", remove: vi.fn() } as (typeof scripts)[number];
      scripts.push(s);
      return s;
    },
    body: {
      appendChild: (s: (typeof scripts)[number]) => {
        setTimeout(() => {
          if (opts.defineFactory !== false) w.createUnityInstance = factory;
          s.onload?.();
        }, 0);
      },
    },
  };
  vi.stubGlobal("window", w);
  vi.stubGlobal("document", doc);
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ data: { schema: "levelup.unity-scene" } }) })));
  const statuses: UnityStatus[] = [];
  const registered: (((f: UnityFrame) => void) | null)[] = [];
  const stop = startUnity({} as HTMLCanvasElement, {
    gameId: "g1", areaId: "a1",
    register: (fn) => registered.push(fn),
    onStatus: (s) => statuses.push(s),
  });
  return { w, scripts, instances, factory, statuses, registered, stop };
}

const FRAME = { t: 0 } as unknown as UnityFrame;
const settle = async () => { for (let i = 0; i < 6; i++) await tick(); };

describe("Unity view (startUnity)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("boots: loads the scene, then reports ready once and hands the page a frame sender", async () => {
    const page = fakePage();
    await settle();
    expect(page.statuses).toEqual(["ready"]);
    expect(page.instances).toHaveLength(1);
    expect(page.instances[0]!.SendMessage.mock.calls[0]![1]).toBe(BRIDGE_METHODS.loadScene);
    const send = page.registered.at(-1);
    expect(typeof send).toBe("function");
    send!(FRAME);
    expect(page.instances[0]!.SendMessage.mock.calls[1]![1]).toBe(BRIDGE_METHODS.frame);
    page.stop();
    expect(page.registered.at(-1)).toBeNull();
    expect(page.instances[0]!.Quit).toHaveBeenCalledTimes(1);
  });

  it("a scene Unity cannot read (it says so while LoadScene runs) ends in error, never in a ready that would follow it", async () => {
    const page = fakePage({
      onSend: (method, w) => {
        if (method === BRIDGE_METHODS.loadScene) (w.__levelupUnityMessage as (raw: string) => void)(JSON.stringify({ type: "error", message: "unsupported scene version" }));
      },
    });
    await settle();
    expect(page.statuses).toEqual(["error"]);
    expect(page.registered.every((fn) => fn === null)).toBe(true);
  });

  it("a frame the instance can no longer take falls back once, instead of throwing out of the renderer's frame loop", async () => {
    let broken = false;
    const page = fakePage({ onSend: (method) => { if (broken && method === BRIDGE_METHODS.frame) throw new Error("Module is not defined"); } });
    await settle();
    const send = page.registered.at(-1)!;
    broken = true;
    expect(() => send(FRAME)).not.toThrow();
    expect(() => send(FRAME)).not.toThrow();
    expect(page.statuses).toEqual(["ready", "error"]);
  });

  it("a loader that defines no createUnityInstance is an error, not a wait that never ends", async () => {
    const page = fakePage({ defineFactory: false });
    await settle();
    expect(page.statuses).toEqual(["error"]);
  });

  it("the next area's view reuses the loader the page already has instead of adding the script again", async () => {
    const page = fakePage({ preloaded: true });
    await settle();
    expect(page.scripts).toHaveLength(0);
    expect(page.statuses).toEqual(["ready"]);
  });

  it("closed while the instance starts: nothing is reported, the late instance is stopped and its failing Quit is swallowed", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    try {
      let started!: () => void;
      const hold = new Promise<void>((r) => { started = r; });
      const page = fakePage({ preloaded: true, hold, quit: async () => { throw new Error("quit"); } });
      await settle();
      expect(page.factory).toHaveBeenCalledTimes(1); // the scene has arrived; the instance is being created
      page.stop();
      started();
      await settle();
      expect(page.statuses).toEqual([]);
      expect(page.instances).toHaveLength(1);
      expect(page.instances[0]!.Quit).toHaveBeenCalledTimes(1);
      expect(page.instances[0]!.SendMessage).not.toHaveBeenCalled();
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off("unhandledRejection", unhandled);
    }
  });

  it("an error after the view is gone is not reported", async () => {
    const page = fakePage();
    await settle();
    const post = page.w.__levelupUnityMessage as (raw: string) => void;
    page.stop();
    post(JSON.stringify({ type: "error", message: "late" }));
    expect(page.statuses).toEqual(["ready"]);
  });
});

// ───────────────────────── practice: a hint stays with its question ─────────────────────────

describe("practice hints", () => {
  it("a hint is shown only with the question it was asked for", () => {
    expect(shownHint(null, "c1")).toBeNull();
    expect(shownHint({ challengeId: "c1", text: "Think of light." }, "c1")).toBe("Think of light.");
    // asked just before moving on: it arrives while the next question is on screen
    expect(shownHint({ challengeId: "c1", text: "Think of light." }, "c2")).toBeNull();
    expect(shownHint({ challengeId: "c2", text: null }, "c2")).toBeNull();
  });

  it("the practice screen stores each hint with its question and shows it through shownHint", () => {
    const s = src("PracticeClient.tsx");
    expect(s).toMatch(/hint=\{shownHint\(hint, current\.id\)\}/);
    expect(s).toMatch(/setHint\(\{ challengeId, text: r\.hint \}\)/);
    expect(s).not.toMatch(/setHint\(r\.hint\)/);
  });
});

// ───────────────────────── play screen: replies of a run the screen has left ─────────────────────────

describe("play screen event replies", () => {
  const play = src("PlayClient.tsx");
  const sendBody = play.slice(play.indexOf("const send = useCallback("), play.indexOf("const handleError = useCallback("));

  it("send reads the current runtime (the runtime's own callbacks keep the send of the area before)", () => {
    expect(sendBody).toMatch(/const rt = runtimeRef\.current;/);
    expect(sendBody).not.toMatch(/\bruntime\?\./);
    expect(sendBody).toMatch(/\}, \[audio, emitter, t, toast, transport\]\);/);
    expect(play).toMatch(/runtimeRef\.current = runtime;/);
  });

  it("a reply (or failure) for a run the screen has left is dropped, before any state of it is shown", () => {
    // checked before sending, after a failure and after an answer, and before the first setClient
    expect(sendBody.match(/if \(dataRef\.current !== d\) throw new SupersededRun\(\);/g)).toHaveLength(3);
    expect(sendBody.indexOf("throw new SupersededRun")).toBeLessThan(sendBody.indexOf("setClient(res.state)"));
    // a (re)start marks the old run as left at once, not a render later
    expect(play).toMatch(/const start = useCallback\(\(restart = false\) => \{\s*dataRef\.current = null;/);
    // and nobody is told about it: no "connection problem" toast for the old run
    const handle = play.slice(play.indexOf("const handleError = useCallback("));
    expect(handle.split("\n")[1]).toMatch(/if \(e instanceof SupersededRun\) return;/);
  });

  it("an updated game is reloaded once, however many events it caught in flight", () => {
    expect(play).toMatch(/if \(staleReload\.current\) return;\s*staleReload\.current = true;/);
    expect(play).toMatch(/finally \{\s*staleReload\.current = false;/);
  });

  it("the pickup popup shows the points the reducer gave, which the collect reply carries", () => {
    expect(play).not.toMatch(/hud\.points", \{ n: 10 \}/);
    expect(play).toMatch(/const points = res\.data\.points;/);
    const store = new OfflineStore(memoryKV(), () => 1_000);
    const game = store.addGame(generateOffline(request({ material: NOTES, subject: "Plants", mode: "FULL" })).spec);
    const s = store.startSession(game.id, false);
    const area = game.spec.areas.find((a) => a.id === s.client.areaId)!;
    const ids = collectibleIds(area);
    expect(mechanicsForArea(game.spec, area.id).has("collect")).toBe(true);
    expect(ids.length).toBeGreaterThan(0);
    const res = store.applyEvent(s.session.id, { type: "collect", itemId: ids[0]! }) as { data: { points?: unknown } };
    expect(res.data.points).toBe(COLLECT_POINTS);
  });
});
