"use client";

import { useEffect, useRef } from "react";
import { BRIDGE_METHODS, BRIDGE_OBJECT, parseUnityMessage, type UnityFrame } from "@/lib/game/unity/bridge";

/** Where a Unity WebGL build (see `unity/README.md`) is expected. It is optional: without it the Three.js renderer is used. */
export const UNITY_BUILD_BASE = "/unity/levelup/Build/levelup";

interface UnityInstance {
  SendMessage(object: string, method: string, value?: string): void;
  Quit(): Promise<void>;
}
declare global {
  interface Window {
    createUnityInstance?: (canvas: HTMLCanvasElement, config: Record<string, unknown>, onProgress?: (p: number) => void) => Promise<UnityInstance>;
    /** Unity's .jslib calls this with a JSON string. */
    __levelupUnityMessage?: (raw: unknown) => void;
  }
}

/** True when a Unity build has been deployed next to the app. */
export async function unityBuildAvailable(signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(`${UNITY_BUILD_BASE}.loader.js`, { method: "HEAD", signal, cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export type UnityStatus = "ready" | "error";

export interface UnityViewProps {
  gameId: string;
  areaId: string;
  /** The page hands this a function it can call with each frame (≈20 Hz). */
  register: (send: ((frame: UnityFrame) => void) | null) => void;
  onStatus: (status: UnityStatus, detail?: string) => void;
}

export interface UnityBootOptions extends UnityViewProps {
  /** Where the build lives (tests point it elsewhere). */
  base?: string;
}

/**
 * Boots one Unity instance on `el` for one area and returns its cleanup. The page hears at most one outcome:
 * - `error` wins and is final. Unity reports a scene it cannot read while `LoadScene` is still running, so without this the
 *   `ready` that follows would switch the page's own renderer off in favour of a Unity view that shows nothing.
 * - a frame Unity can no longer take (the instance crashed) is an `error` too, instead of an exception thrown out of the
 *   renderer's frame loop, so the page falls back to its own renderer and the game goes on.
 * - a loader that defines no `createUnityInstance` is an `error`, not a wait that never ends.
 * - nothing is reported once the view is gone.
 */
export function startUnity(el: HTMLCanvasElement, { gameId, areaId, register, onStatus, base = UNITY_BUILD_BASE }: UnityBootOptions): () => void {
  let disposed = false;
  let failed = false;
  let instance: UnityInstance | null = null;
  let script: HTMLScriptElement | null = null;
  const ctl = new AbortController();
  const fail = (detail: string) => {
    if (disposed || failed) return;
    failed = true;
    register(null);
    onStatus("error", detail);
  };

  window.__levelupUnityMessage = (raw) => {
    const msg = parseUnityMessage(raw);
    if (msg?.type === "error") fail(msg.message);
  };

  const boot = async () => {
    try {
      const res = await fetch(`/api/games/${encodeURIComponent(gameId)}/unity?area=${encodeURIComponent(areaId)}`, { signal: ctl.signal, credentials: "same-origin" });
      if (!res.ok) throw new Error(`scene ${res.status}`);
      const scene = (await res.json()) as unknown;
      // the loader defines `createUnityInstance` once for the page: the next area's view uses it instead of loading the script again
      if (!window.createUnityInstance) {
        await new Promise<void>((resolve, reject) => {
          script = document.createElement("script");
          script.src = `${base}.loader.js`;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("loader"));
          document.body.appendChild(script);
        });
      }
      if (disposed || failed) return;
      if (!window.createUnityInstance) throw new Error("loader");
      const inst = await window.createUnityInstance(el, {
        dataUrl: `${base}.data`,
        frameworkUrl: `${base}.framework.js`,
        codeUrl: `${base}.wasm`,
        companyName: "LEVEL UP",
        productName: "LEVEL UP",
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      });
      instance = inst;
      // gone while it started: the cleanup has already run (and found no instance), so it is stopped here
      if (disposed) { void inst.Quit().catch(() => undefined); return; }
      if (failed) return;
      inst.SendMessage(BRIDGE_OBJECT, BRIDGE_METHODS.loadScene, JSON.stringify((scene as { data?: unknown }).data ?? scene));
      if (failed) return; // Unity could not read the scene and said so while loading it
      register((frame) => {
        if (failed || disposed) return;
        try { inst.SendMessage(BRIDGE_OBJECT, BRIDGE_METHODS.frame, JSON.stringify(frame)); } catch (e) { fail(e instanceof Error ? e.message : "frame"); }
      });
      onStatus("ready");
    } catch (e) {
      fail(e instanceof Error ? e.message : "unity");
    }
  };
  void boot();

  return () => {
    disposed = true;
    ctl.abort();
    register(null);
    delete window.__levelupUnityMessage;
    script?.remove();
    void instance?.Quit().catch(() => undefined);
  };
}

/**
 * Draws the world with a Unity WebGL build. Display only: it receives the scene description and frames from the page
 * and reports back `ready` / `error` / `stats`. It cannot influence score, progress or access.
 */
export function UnityView({ gameId, areaId, register, onStatus }: UnityViewProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const status = useRef(onStatus);
  useEffect(() => { status.current = onStatus; }, [onStatus]);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    return startUnity(el, { gameId, areaId, register, onStatus: (s, detail) => status.current(s, detail) });
  }, [gameId, areaId, register]);

  return <canvas ref={canvas} data-testid="unity-canvas" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />;
}
