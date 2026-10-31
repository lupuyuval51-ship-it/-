import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PAGE_DARK, PAGE_LIGHT } from "../../mobile/src/system-bars";

/**
 * The Android shell's wiring (`mobile/src/native.ts`), run against fakes of Capacitor and of the page. The pure parts (`backAction`,
 * `isShareableText`, `pageColor`, `nativeWakeLock`) have their own tests; what was untested is the glue that decides, on a real press
 * of Back or a real tap on "save backup file", which of them is used and in which order.
 */

const bridge = vi.hoisted(() => ({
  native: true,
  listeners: new Map<string, (e: { canGoBack: boolean }) => void>(),
  minimize: vi.fn(),
  plugins: {} as Record<string, Record<string, unknown>>,
  asked: [] as string[],
}));
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => bridge.native },
  registerPlugin: (name: string) => { bridge.asked.push(name); return (bridge.plugins[name] ??= {}); },
}));
vi.mock("@capacitor/app", () => ({
  App: {
    addListener: (name: string, cb: (e: { canGoBack: boolean }) => void) => { bridge.listeners.set(name, cb); return Promise.resolve({ remove: () => undefined }); },
    minimizeApp: bridge.minimize,
  },
}));
vi.mock("@capacitor/haptics", () => ({ Haptics: {}, ImpactStyle: {}, NotificationType: {} }));
vi.mock("../../mobile/src/app-state", () => ({ getSettings: () => ({ vibration: true }) }));

const { installNativeShell, installBackButton } = await import("../../mobile/src/native");

// ───────────── a page that is just enough for the shell ─────────────

class FakeElement {
  href = "";
  download = "";
  closest(sel: string): FakeElement | null { return sel === "a[download]" && this.download ? this : null; }
}

interface Page {
  win: Record<string, unknown> & { location: { hash: string; replace: ReturnType<typeof vi.fn> }; history: { back: ReturnType<typeof vi.fn> } };
  events: EventTarget;
  clicks: ((e: unknown) => void)[];
  mutation: { cb: () => void };
  media: { matches: boolean; fire: () => void };
  html: { attrs: Record<string, string> };
}
let page: Page;
const originals = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };

function boot(opts: { hash?: string; systemLight?: boolean; theme?: string; wakeLock?: boolean } = {}): Page {
  const events = new EventTarget();
  const mediaListeners: (() => void)[] = [];
  const media = { matches: opts.systemLight ?? false, fire: () => mediaListeners.forEach((l) => l()) };
  const html = { attrs: opts.theme ? { "data-theme": opts.theme } : ({} as Record<string, string>) };
  const mutation = { cb: () => undefined as void };
  const clicks: ((e: unknown) => void)[] = [];
  const win = {
    location: { hash: opts.hash ?? "", replace: vi.fn((h: string) => { win.location.hash = h; }) },
    history: { back: vi.fn() },
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
    matchMedia: () => ({ get matches() { return media.matches; }, addEventListener: (_t: string, l: () => void) => void mediaListeners.push(l) }),
  };
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", {
    addEventListener: (type: string, l: (e: unknown) => void) => { if (type === "click") clicks.push(l); },
    documentElement: { getAttribute: (n: string) => html.attrs[n] ?? null },
  });
  vi.stubGlobal("Element", FakeElement);
  vi.stubGlobal("MutationObserver", class { constructor(cb: () => void) { mutation.cb = cb; } observe() { /* the fake page changes the attribute by hand */ } });
  vi.stubGlobal("navigator", opts.wakeLock ? { wakeLock: { request: vi.fn() } } : {});
  // the three native plugins (a test replaces the one it is about before `installNativeShell`)
  bridge.plugins = {
    LevelUpFiles: { share: vi.fn(async () => undefined) },
    LevelUpSystemBars: { setPageColor: vi.fn(async () => undefined) },
    LevelUpScreen: { setKeepScreenOn: vi.fn(async () => undefined) },
  };
  page = { win: win as Page["win"], events, clicks, mutation, media, html };
  return page;
}

const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const pressBack = (canGoBack = true) => bridge.listeners.get("backButton")!({ canGoBack });

beforeEach(() => {
  bridge.native = true;
  bridge.listeners.clear();
  bridge.plugins = {};
  bridge.asked = [];
  bridge.minimize.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  URL.createObjectURL = originals.create;
  URL.revokeObjectURL = originals.revoke;
});

// ───────────── outside the app ─────────────

describe("the shell in a browser (tests, `npm run mobile:dev`)", () => {
  it("installs nothing: no Back listener, no click handler, no change to the URL functions", () => {
    bridge.native = false;
    const p = boot();
    installNativeShell();
    installBackButton();
    expect(bridge.listeners.size).toBe(0);
    expect(p.clicks).toHaveLength(0);
    expect(URL.createObjectURL).toBe(originals.create);
    expect(bridge.asked).toEqual([]); // no native plugin is even looked up
  });
});

// ───────────── the Back key ─────────────

describe("the Android Back key", () => {
  it("is registered once, on the backButton event", () => {
    boot();
    installNativeShell();
    expect([...bridge.listeners.keys()]).toEqual(["backButton"]);
  });

  it("goes to the open screen first: a first-launch question that goes one step back takes the press", () => {
    const p = boot({ hash: "#/create" });
    installBackButton();
    p.events.addEventListener("levelup:screen-back", (e) => e.preventDefault());
    pressBack();
    expect(p.win.history.back).not.toHaveBeenCalled();
    expect(p.win.location.replace).not.toHaveBeenCalled();
    expect(bridge.minimize).not.toHaveBeenCalled();
  });

  it("inside a game the game decides; when it answers, nothing else happens (the route does not move)", () => {
    const p = boot({ hash: "#/play/g1" });
    installBackButton();
    p.events.addEventListener("levelup:back", (e) => e.preventDefault());
    pressBack();
    expect(p.win.location.replace).not.toHaveBeenCalled();
    expect(p.win.history.back).not.toHaveBeenCalled();
    expect(bridge.minimize).not.toHaveBeenCalled();
  });

  it("inside a game nobody answers for (loading, deleted game, crashed screen): the library opens, the press is not swallowed", () => {
    const p = boot({ hash: "#/play/g1" });
    installBackButton();
    pressBack(true);
    expect(p.win.location.replace).toHaveBeenCalledWith("#/");
    expect(p.win.history.back).not.toHaveBeenCalled();
  });

  it("the query of the hash never changes the screen it decides for (a game opened with a flag is still a game)", () => {
    const p = boot({ hash: "#/play/g1?x=1" });
    installBackButton();
    p.events.addEventListener("levelup:back", (e) => e.preventDefault());
    pressBack();
    expect(p.win.location.replace).not.toHaveBeenCalled();
    const q = boot({ hash: "#/?welcome=1" });
    installBackButton();
    pressBack(true);
    expect(bridge.minimize).toHaveBeenCalledTimes(1);
    expect(q.win.history.back).not.toHaveBeenCalled();
  });

  it("other screens go one screen back; with no history behind them they open the library instead of doing nothing", () => {
    const p = boot({ hash: "#/settings" });
    installBackButton();
    pressBack(true);
    expect(p.win.history.back).toHaveBeenCalledTimes(1);
    expect(p.win.location.replace).not.toHaveBeenCalled();
    pressBack(false);
    expect(p.win.location.replace).toHaveBeenCalledWith("#/");
    expect(p.win.history.back).toHaveBeenCalledTimes(1);
  });

  it("the results of a finished run go to the library, never back into the game (that entry would start a new run)", () => {
    const p = boot({ hash: "#/games/g1/results/s1" });
    installBackButton();
    pressBack(true);
    expect(p.win.location.replace).toHaveBeenCalledWith("#/");
    expect(p.win.history.back).not.toHaveBeenCalled();
  });

  it("from the library (and from an empty hash) the app goes to the background", () => {
    for (const hash of ["", "#/", "#/games"]) {
      bridge.minimize.mockReset();
      const p = boot({ hash });
      installBackButton();
      pressBack(true);
      expect(bridge.minimize, hash).toHaveBeenCalledTimes(1);
      expect(p.win.location.replace).not.toHaveBeenCalled();
    }
  });
});

// ───────────── "save backup file" ─────────────

describe("saving a backup file in the app's WebView", () => {
  const link = (href: string, download = "levelup-backup.json") => Object.assign(new FakeElement(), { href, download });
  const click = (target: unknown) => {
    const event = { target, preventDefault: vi.fn() };
    for (const l of page.clicks) l(event);
    return event;
  };
  const share = () => {
    const fn = vi.fn(async (_o: { name: string; mime: string; text: string }) => undefined);
    bridge.plugins.LevelUpFiles = { share: fn };
    return fn;
  };

  it("hands the text of a JSON blob to the native share sheet, with the file's name and type, and takes the click over", async () => {
    boot();
    const shared = share();
    installNativeShell();
    const url = URL.createObjectURL(new Blob(['{"games":[]}'], { type: "application/json" }));
    const event = click(link(url));
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    await tick();
    expect(shared).toHaveBeenCalledTimes(1);
    expect(shared).toHaveBeenCalledWith({ name: "levelup-backup.json", mime: "application/json", text: '{"games":[]}' });
  });

  it("leaves every other download to the WebView: images and audio blobs are not remembered, and a link without `download` is not ours", async () => {
    boot();
    const shared = share();
    installNativeShell();
    const png = URL.createObjectURL(new Blob([new Uint8Array(8)], { type: "image/png" }));
    expect(click(link(png, "pic.png")).preventDefault).not.toHaveBeenCalled();
    const json = URL.createObjectURL(new Blob(["{}"], { type: "application/json" }));
    expect(click(link(json, "")).preventDefault).not.toHaveBeenCalled(); // a plain link to the same blob
    expect(click({}).preventDefault).not.toHaveBeenCalled(); // a click on something that is not an element
    await tick();
    expect(shared).not.toHaveBeenCalled();
  });

  it("forgets a blob when the page revokes its URL, so a stale link is not intercepted", async () => {
    boot();
    const shared = share();
    installNativeShell();
    const url = URL.createObjectURL(new Blob(["{}"], { type: "application/json" }));
    URL.revokeObjectURL(url);
    expect(click(link(url)).preventDefault).not.toHaveBeenCalled();
    await tick();
    expect(shared).not.toHaveBeenCalled();
  });

  it("a share that fails (the sheet was closed, no app to take it) is swallowed: the learner can tap again", async () => {
    boot();
    const shared = share();
    shared.mockRejectedValueOnce(new Error("cancelled"));
    installNativeShell();
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    const url = URL.createObjectURL(new Blob(["{}"], { type: "application/json" }));
    click(link(url));
    await tick();
    click(link(url));
    await tick();
    process.off("unhandledRejection", unhandled);
    expect(shared).toHaveBeenCalledTimes(2);
    expect(unhandled).not.toHaveBeenCalled();
  });
});

// ───────────── the colour behind the system bars ─────────────

describe("the page colour behind the system bars", () => {
  const colours = () => (bridge.plugins.LevelUpSystemBars!.setPageColor as ReturnType<typeof vi.fn>).mock.calls.map((c) => (c[0] as { color: string }).color);

  it("is told once at start and only again when it really changes", () => {
    const p = boot({ hash: "#/", systemLight: true });
    installNativeShell();
    expect(colours()).toEqual([PAGE_LIGHT]);
    p.events.dispatchEvent(new Event("hashchange")); // same colour: nothing is sent
    expect(colours()).toEqual([PAGE_LIGHT]);
    p.win.location.hash = "#/play/g1"; // the 3D screen is always dark
    p.events.dispatchEvent(new Event("hashchange"));
    expect(colours()).toEqual([PAGE_LIGHT, PAGE_DARK]);
    p.win.location.hash = "#/settings";
    p.events.dispatchEvent(new Event("hashchange"));
    expect(colours()).toEqual([PAGE_LIGHT, PAGE_DARK, PAGE_LIGHT]);
  });

  it("follows the in-app theme and the system's light/dark switch", () => {
    const p = boot({ hash: "#/", systemLight: false });
    installNativeShell();
    expect(colours()).toEqual([PAGE_DARK]);
    p.html.attrs["data-theme"] = "light";
    p.mutation.cb();
    expect(colours()).toEqual([PAGE_DARK, PAGE_LIGHT]);
    delete p.html.attrs["data-theme"]; // back to "match the device", which is dark
    p.mutation.cb();
    p.media.matches = true;
    p.media.fire();
    expect(colours()).toEqual([PAGE_DARK, PAGE_LIGHT, PAGE_DARK, PAGE_LIGHT]);
  });

  it("a colour the shell refused is sent again at the next change instead of being remembered as sent", async () => {
    const p = boot({ hash: "#/", systemLight: false });
    bridge.plugins.LevelUpSystemBars = { setPageColor: vi.fn().mockRejectedValueOnce(new Error("busy")).mockResolvedValue(undefined) };
    installNativeShell();
    await tick(); // the rejection is handled
    p.events.dispatchEvent(new Event("hashchange"));
    expect(colours()).toEqual([PAGE_DARK, PAGE_DARK]);
  });
});

// ───────────── the screen stays on while a question is read ─────────────

describe("keeping the screen on", () => {
  it("a WebView without the Screen Wake Lock API gets one that drives the shell's keep-screen-on flag", async () => {
    boot();
    const setKeepScreenOn = vi.fn(async (_o: { on: boolean }) => undefined);
    bridge.plugins.LevelUpScreen = { setKeepScreenOn };
    installNativeShell();
    const wakeLock = (navigator as unknown as { wakeLock: { request(t: "screen"): Promise<{ release(): Promise<void> }> } }).wakeLock;
    const lock = await wakeLock.request("screen");
    await lock.release();
    expect(setKeepScreenOn.mock.calls.map((c) => c[0].on)).toEqual([true, false]);
  });

  it("a WebView that has the real API keeps it", () => {
    boot({ wakeLock: true });
    const real = (navigator as unknown as { wakeLock: unknown }).wakeLock;
    bridge.plugins.LevelUpScreen = { setKeepScreenOn: vi.fn() };
    installNativeShell();
    expect((navigator as unknown as { wakeLock: unknown }).wakeLock).toBe(real);
    expect(bridge.plugins.LevelUpScreen.setKeepScreenOn).not.toHaveBeenCalled();
  });
});
