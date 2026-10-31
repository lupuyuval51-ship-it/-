import { describe, expect, it, vi } from "vitest";
import { ScreenWake } from "@/components/game/hud/useWakeLock";
import { nativeWakeLock } from "../../mobile/src/wake-lock";

describe("the app's stand-in for navigator.wakeLock (the WebView has none)", () => {
  it("keeps the screen on while a lock is held and clears the flag when the last one goes", async () => {
    const setOn = vi.fn(async (_on: boolean) => undefined);
    const lock = nativeWakeLock(setOn);
    const a = await lock.request("screen");
    const b = await lock.request("screen");
    expect(setOn.mock.calls.map((c) => c[0])).toEqual([true, true]);
    const heard = vi.fn();
    a.addEventListener("release", heard);
    await a.release();
    await a.release(); // twice is once
    expect(heard).toHaveBeenCalledTimes(1);
    expect(a.released).toBe(true);
    expect(setOn.mock.calls.map((c) => c[0])).toEqual([true, true]); // b still holds it
    await b.release();
    expect(setOn.mock.calls.map((c) => c[0])).toEqual([true, true, false]);
  });

  it("a shell that refuses is a refused lock, like a browser on battery saver", async () => {
    const lock = nativeWakeLock(async () => { throw new Error("no plugin"); });
    await expect(lock.request("screen")).rejects.toThrow();
  });

  it("works with the play screen's ScreenWake: on while playing, off when paused", async () => {
    const setOn = vi.fn(async (_on: boolean) => undefined);
    const wake = new ScreenWake({ wakeLock: nativeWakeLock(setOn) }, () => true);
    await wake.set(true);
    expect(wake.held).toBe(true);
    await wake.set(false);
    expect(wake.held).toBe(false);
    expect(setOn.mock.calls.map((c) => c[0])).toEqual([true, false]);
  });
});
