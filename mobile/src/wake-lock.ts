/**
 * `navigator.wakeLock` for the Android app. The WebView has no Screen Wake Lock API, so the play screen's request (see
 * `useWakeLock` in src/components/game/hud) would fail silently and the screen would time out while a question is read.
 * This stands in for it with the shell's keep-screen-on flag (`ScreenPlugin.java`): the screen stays on while at least one
 * lock is held, and the flag is cleared when the last one is released. Pure apart from `setOn`, so it is unit-tested.
 */
export interface NativeSentinel {
  readonly type: "screen";
  readonly released: boolean;
  release(): Promise<void>;
  addEventListener(type: "release", listener: () => void): void;
}

export function nativeWakeLock(setOn: (on: boolean) => Promise<void>): { request(type: "screen"): Promise<NativeSentinel> } {
  let held = 0;
  return {
    async request(type) {
      if (type !== "screen") throw new TypeError("only a screen wake lock exists");
      held += 1;
      try {
        await setOn(true);
      } catch (e) {
        held -= 1;
        throw e; // like a browser that refuses: the caller carries on without
      }
      const listeners: (() => void)[] = [];
      let released = false;
      return {
        type: "screen",
        get released() { return released; },
        async release() {
          if (released) return;
          released = true;
          held -= 1;
          if (held === 0) await setOn(false).catch(() => undefined);
          listeners.forEach((l) => l());
        },
        addEventListener(t, listener) { if (t === "release") listeners.push(listener); },
      };
    },
  };
}
