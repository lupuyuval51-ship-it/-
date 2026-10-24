"use client";

import { useEffect, useRef } from "react";

export interface WakeLockSentinelLike {
  release(): Promise<void>;
  addEventListener?(type: "release", listener: () => void): void;
}
export interface WakeLockNavigator {
  wakeLock?: { request(type: "screen"): Promise<WakeLockSentinelLike> };
}

/**
 * Keeps a phone's screen on while a game is being played: reading a question or a story card takes longer than the
 * screen timeout, and nothing is touched meanwhile. The browser drops the lock when the page goes to the background, so
 * it is asked for again when the page comes back. Every failure (no support, battery saver, denied) is silent: the screen
 * then simply times out as it always did.
 */
export class ScreenWake {
  private sentinel: WakeLockSentinelLike | null = null;
  private wanted = false;
  private pending = false;
  private generation = 0;

  constructor(private readonly nav: WakeLockNavigator | undefined, private readonly visible: () => boolean) {}

  /** Ask for (true) or give up (false) the lock. */
  set(on: boolean): Promise<void> {
    this.wanted = on;
    this.generation += 1;
    return this.sync();
  }

  /** Call when the page becomes visible again. */
  refresh(): Promise<void> {
    return this.sync();
  }

  get held(): boolean {
    return this.sentinel !== null;
  }

  private async sync(): Promise<void> {
    if (this.wanted && this.visible()) {
      if (this.sentinel || this.pending || !this.nav?.wakeLock) return;
      this.pending = true;
      const gen = this.generation;
      try {
        const s = await this.nav.wakeLock.request("screen");
        if (this.wanted && this.visible()) {
          this.sentinel = s;
          s.addEventListener?.("release", () => { if (this.sentinel === s) this.sentinel = null; });
        } else {
          await s.release().catch(() => undefined); // not wanted any more by the time the browser answered
        }
      } catch {
        /* unsupported, denied or battery saver: carry on without */
      } finally {
        this.pending = false;
      }
      if (gen !== this.generation) await this.sync(); // the wish changed while waiting: follow it once
    } else if (this.sentinel) {
      const s = this.sentinel;
      this.sentinel = null;
      try { await s.release(); } catch { /* already released */ }
    }
  }
}

/** Hold the screen awake while `on` is true. */
export function useWakeLock(on: boolean): void {
  const holder = useRef<ScreenWake | null>(null);
  useEffect(() => {
    const h = new ScreenWake(typeof navigator === "undefined" ? undefined : (navigator as unknown as WakeLockNavigator), () => document.visibilityState === "visible");
    holder.current = h;
    const onVisibility = () => void h.refresh();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      void h.set(false);
      holder.current = null;
    };
  }, []);
  useEffect(() => { void holder.current?.set(on); }, [on]);
}
