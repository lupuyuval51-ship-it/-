import { afterEach, describe, expect, it, vi } from "vitest";
import { InputState } from "@/components/game/input";
import { bootErrorKey } from "@/components/game/playModel";
import { ApiFailure, httpTransport, isTransientFailure } from "@/components/game/transport";
import { layoutSnapshot } from "@/components/game/useLayout";
import { DICTIONARIES } from "@/lib/i18n";

afterEach(() => vi.unstubAllGlobals());

// ───────── keyboard + drag input (no DOM in the unit project: listeners are captured and called by hand) ─────────

class FakeElement {
  constructor(public tagName: string, public type = "", public isContentEditable = false) {}
}

type Listener = (e: never) => void;
function harness() {
  const on: Record<string, Listener[]> = {};
  const target = () => ({
    addEventListener: (type: string, fn: Listener) => { (on[type] ??= []).push(fn); },
    removeEventListener: (type: string, fn: Listener) => { on[type] = (on[type] ?? []).filter((f) => f !== fn); },
  });
  vi.stubGlobal("HTMLElement", FakeElement);
  vi.stubGlobal("window", target());
  const canvas = new FakeElement("CANVAS");
  const host = { ...target(), querySelector: () => canvas } as unknown as HTMLElement;
  const input = new InputState();
  const detach = input.attach(host);
  const fire = (type: string, init: Record<string, unknown>) => {
    const ev = { repeat: false, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, target: null, preventDefault: vi.fn(), ...init };
    for (const fn of on[type] ?? []) fn(ev as never);
    return ev;
  };
  const key = (code: string, init: Record<string, unknown> = {}) => fire("keydown", { code, key: code, ...init });
  const keyUp = (code: string, init: Record<string, unknown> = {}) => fire("keyup", { code, key: code, ...init });
  return { input, detach, fire, key, keyUp, canvas, on };
}

describe("pause key", () => {
  it("closes the pause menu with Escape while one of its checkboxes has the focus (a checkbox types nothing)", () => {
    const { input, key } = harness();
    const onPause = vi.fn();
    input.onPause = onPause;
    key("Escape", { target: new FakeElement("INPUT", "checkbox") });
    key("Escape", { target: new FakeElement("INPUT", "range") });
    key("Escape", { target: new FakeElement("BUTTON") });
    expect(onPause).toHaveBeenCalledTimes(3);
  });

  it("still leaves Escape and P alone while the player types in a text field", () => {
    const { input, key } = harness();
    const onPause = vi.fn();
    input.onPause = onPause;
    key("Escape", { target: new FakeElement("INPUT", "text") });
    key("KeyP", { target: new FakeElement("INPUT", "number") });
    key("KeyP", { target: new FakeElement("TEXTAREA") });
    key("KeyP", { target: new FakeElement("DIV", "", true) });
    expect(onPause).not.toHaveBeenCalled();
  });

  it("toggles once per press: a held key's repeats do not flicker the menu open and shut", () => {
    const { input, key } = harness();
    const onPause = vi.fn();
    input.onPause = onPause;
    key("Escape");
    for (let i = 0; i < 10; i++) key("Escape", { repeat: true });
    expect(onPause).toHaveBeenCalledTimes(1);
  });
});

describe("browser shortcuts are not game keys", () => {
  it("Ctrl/Cmd/Alt + a key moves, jumps and uses nothing, and is not blocked (Ctrl+F still finds)", () => {
    const { input, key } = harness();
    const find = key("KeyF", { ctrlKey: true });
    const selectAll = key("KeyA", { metaKey: true });
    key("ArrowLeft", { altKey: true });
    key("Space", { ctrlKey: true });
    expect(find.preventDefault).not.toHaveBeenCalled();
    expect(selectAll.preventDefault).not.toHaveBeenCalled();
    expect(input.moving).toBe(false);
    const { sim, interact } = input.poll(1 / 60);
    expect(interact).toBe(false);
    expect(sim.jump).toBe(false);
    expect(sim.moveX).toBe(0);
  });

  it("plain keys and Shift (run) still work", () => {
    const { input, key } = harness();
    key("ShiftLeft", { shiftKey: true });
    key("KeyW", { shiftKey: true });
    key("KeyE");
    const { sim, interact } = input.poll(1 / 60);
    expect(sim.moveY).toBe(1);
    expect(sim.sprint).toBe(true);
    expect(interact).toBe(true);
  });

  it("letting go of Cmd forgets keys whose release macOS never reported", () => {
    const { input, key, keyUp } = harness();
    key("KeyW");
    key("MetaLeft", { key: "Meta", metaKey: true });
    // W is let go while Cmd is down: macOS sends no keyup for it
    keyUp("MetaLeft", { key: "Meta" });
    expect(input.moving).toBe(false);
  });
});

describe("drag to look", () => {
  const down = (h: ReturnType<typeof harness>, init: Record<string, unknown> = {}) =>
    h.fire("pointerdown", { target: h.canvas, pointerId: 1, pointerType: "mouse", button: 0, buttons: 1, clientX: 100, clientY: 100, ...init });
  const move = (h: ReturnType<typeof harness>, x: number, buttons = 1, pointerType = "mouse") =>
    h.fire("pointermove", { pointerId: 1, pointerType, buttons, clientX: x, clientY: 100 });

  it("turns the camera while the button is held", () => {
    const h = harness();
    down(h);
    move(h, 140);
    expect(h.input.yaw).not.toBe(0);
  });

  it("stops when the release happened out of sight (another window): a bare mouse move does not turn the camera", () => {
    const h = harness();
    down(h);
    move(h, 140, 0); // no button down any more, the pointerup never reached the page
    move(h, 400, 0);
    expect(h.input.yaw).toBe(0);
  });

  it("a finger on the screen keeps turning (touch has no mouse buttons to check)", () => {
    const h = harness();
    down(h, { pointerType: "touch" });
    move(h, 140, 1, "touch");
    expect(h.input.yaw).not.toBe(0);
  });

  it("ends when the window loses focus or a panel opens", () => {
    for (const end of [(h: ReturnType<typeof harness>) => h.fire("blur", {}), (h: ReturnType<typeof harness>) => h.input.reset()]) {
      const h = harness();
      down(h);
      end(h);
      move(h, 400);
      expect(h.input.yaw).toBe(0);
    }
  });

  it("detach removes every listener", () => {
    const h = harness();
    h.detach();
    for (const list of Object.values(h.on)) expect(list).toHaveLength(0);
  });
});

// ───────── website transport: an answer that cannot be read is not a result ─────────

describe("httpTransport", () => {
  const respond = (status: number, body: string) => vi.stubGlobal("fetch", vi.fn(async () => new Response(body, { status, headers: { "content-type": "application/json" } })));

  it("a success whose body cannot be read (cut off, a portal page) fails like no answer at all instead of returning {}", async () => {
    for (const body of ["{\"state\":", "<html>Sign in to the Wi-Fi</html>", "null", ""]) {
      respond(200, body);
      const e = await httpTransport.sendEvent("s1", { type: "talk", npcId: "n" }).then(() => null, (x: unknown) => x);
      expect(e, body).toBeInstanceOf(Error);
      expect(e, body).not.toBeInstanceOf(ApiFailure);
      expect(isTransientFailure(e), body).toBe(true);
    }
  });

  it("a readable success is returned as it is", async () => {
    respond(200, JSON.stringify({ state: { score: 3 }, newlyCompletedMissions: [] }));
    await expect(httpTransport.sendEvent("s1", { type: "save" })).resolves.toMatchObject({ state: { score: 3 } });
  });

  it("an error keeps its status and code, and an unreadable error body still gives an ApiFailure", async () => {
    respond(403, JSON.stringify({ error: { code: "TOPIC_LOCKED", message: "locked" } }));
    await expect(httpTransport.startSession("g1", false)).rejects.toMatchObject({ status: 403, code: "TOPIC_LOCKED" });
    for (const body of ["null", "<html>502</html>", ""]) {
      respond(502, body);
      const e = await httpTransport.practice("s1", {}).then(() => null, (x: unknown) => x);
      expect(e, body).toBeInstanceOf(ApiFailure);
      expect((e as ApiFailure).status).toBe(502);
    }
    respond(403, "null"); // a refusal must stay a refusal (not retried), even with a body that says nothing
    const refused = await httpTransport.practice("s1", {}).then(() => null, (x: unknown) => x);
    expect(isTransientFailure(refused)).toBe(false);
  });
});

// ───────── the play screen's "could not start" card ─────────

describe("bootErrorKey", () => {
  it("an expired sign-in says so instead of the generic text (Retry alone would fail again)", () => {
    expect(bootErrorKey(new ApiFailure(401, "UNAUTHORIZED", "x"))).toBe("common.error.unauthorized");
    for (const locale of ["he", "en", "es"] as const) expect(DICTIONARIES[locale]["common.error.unauthorized"]).toBeTruthy();
  });

  it("other failures keep their texts", () => {
    expect(bootErrorKey(new ApiFailure(404, "NOT_FOUND", "x"))).toBe("hud.loading.error");
    expect(bootErrorKey(new ApiFailure(429, "RATE_LIMITED", "x"))).toBe("common.error.rateLimited");
    expect(bootErrorKey(new TypeError("Failed to fetch"))).toBe("hud.loading.error");
  });
});

// ───────── viewport snapshot ─────────

describe("layoutSnapshot", () => {
  it("returns the same object while the window keeps its size, also for a 0 × 0 window (a WebView before its first layout)", () => {
    // computeLayout normalises 0 to a default phone size; comparing its output with the raw size built a new object on every call,
    // which useSyncExternalStore takes for a store that never stops changing (an endless re-render)
    for (const [w, h] of [[0, 0], [0, 700], [390, 844], [740, 360]] as const) {
      vi.stubGlobal("window", { innerWidth: w, innerHeight: h });
      const a = layoutSnapshot();
      expect(layoutSnapshot()).toBe(a);
      expect(layoutSnapshot()).toBe(a);
    }
  });

  it("follows a real change of size", () => {
    vi.stubGlobal("window", { innerWidth: 360, innerHeight: 640 });
    const portrait = layoutSnapshot();
    vi.stubGlobal("window", { innerWidth: 740, innerHeight: 360 });
    const sideways = layoutSnapshot();
    expect(sideways).not.toBe(portrait);
    expect(sideways.shortLandscape).toBe(true);
    expect(portrait.shortLandscape).toBe(false);
  });
});
