import { describe, expect, it, vi } from "vitest";
import { ScreenWake, type WakeLockSentinelLike } from "@/components/game/hud/useWakeLock";

function fake() {
  const sentinels: (WakeLockSentinelLike & { released: boolean; fireRelease: () => void })[] = [];
  const listeners = new Map<object, () => void>();
  const request = vi.fn(async () => {
    const s = {
      released: false,
      async release() { this.released = true; },
      addEventListener(_t: "release", cb: () => void) { listeners.set(s, cb); },
      fireRelease() { this.released = true; listeners.get(s)?.(); },
    };
    sentinels.push(s);
    return s;
  });
  return { nav: { wakeLock: { request } }, request, sentinels };
}

describe("screen wake lock while playing", () => {
  it("takes the lock when wanted and gives it back when not", async () => {
    const { nav, request, sentinels } = fake();
    const w = new ScreenWake(nav, () => true);
    await w.set(true);
    expect(request).toHaveBeenCalledWith("screen");
    expect(w.held).toBe(true);
    await w.set(false);
    expect(w.held).toBe(false);
    expect(sentinels[0]!.released).toBe(true);
  });

  it("asks only once while it holds the lock", async () => {
    const { nav, request } = fake();
    const w = new ScreenWake(nav, () => true);
    await Promise.all([w.set(true), w.set(true), w.refresh()]);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("does not ask while the page is in the background, and asks again when it returns", async () => {
    const { nav, request } = fake();
    let visible = false;
    const w = new ScreenWake(nav, () => visible);
    await w.set(true);
    expect(request).not.toHaveBeenCalled();
    visible = true;
    await w.refresh();
    expect(request).toHaveBeenCalledTimes(1);
    expect(w.held).toBe(true);
  });

  it("takes the lock again after the browser dropped it (screen off, background)", async () => {
    const { nav, request, sentinels } = fake();
    const w = new ScreenWake(nav, () => true);
    await w.set(true);
    sentinels[0]!.fireRelease();
    expect(w.held).toBe(false);
    await w.refresh();
    expect(request).toHaveBeenCalledTimes(2);
    expect(w.held).toBe(true);
  });

  it("lets go of a lock that arrives after it was no longer wanted", async () => {
    const { nav, sentinels } = fake();
    const w = new ScreenWake(nav, () => true);
    const first = w.set(true); // the request is in flight ...
    await w.set(false); // ... when the player pauses
    await first;
    expect(w.held).toBe(false);
    expect(sentinels[0]!.released).toBe(true);
  });

  it("stays quiet when the browser has no wake lock or refuses it", async () => {
    await expect(new ScreenWake(undefined, () => true).set(true)).resolves.toBeUndefined();
    await expect(new ScreenWake({}, () => true).set(true)).resolves.toBeUndefined();
    const denied = { wakeLock: { request: vi.fn(async () => { throw new Error("NotAllowedError"); }) } };
    const w = new ScreenWake(denied, () => true);
    await w.set(true);
    expect(w.held).toBe(false);
    expect(denied.wakeLock.request).toHaveBeenCalledTimes(1); // no retry loop
  });
});
