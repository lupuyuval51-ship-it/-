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
    let disposed = false;
    let instance: UnityInstance | null = null;
    let script: HTMLScriptElement | null = null;
    const ctl = new AbortController();

    window.__levelupUnityMessage = (raw) => {
      const msg = parseUnityMessage(raw);
      if (!msg) return;
      if (msg.type === "error") status.current("error", msg.message);
    };

    const boot = async () => {
      try {
        const res = await fetch(`/api/games/${encodeURIComponent(gameId)}/unity?area=${encodeURIComponent(areaId)}`, { signal: ctl.signal, credentials: "same-origin" });
        if (!res.ok) throw new Error(`scene ${res.status}`);
        const scene = (await res.json()) as unknown;
        await new Promise<void>((resolve, reject) => {
          script = document.createElement("script");
          script.src = `${UNITY_BUILD_BASE}.loader.js`;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("loader"));
          document.body.appendChild(script);
        });
        if (disposed || !window.createUnityInstance) return;
        instance = await window.createUnityInstance(el, {
          dataUrl: `${UNITY_BUILD_BASE}.data`,
          frameworkUrl: `${UNITY_BUILD_BASE}.framework.js`,
          codeUrl: `${UNITY_BUILD_BASE}.wasm`,
          companyName: "LEVEL UP",
          productName: "LEVEL UP",
          devicePixelRatio: Math.min(window.devicePixelRatio, 2),
        });
        if (disposed) { void instance.Quit(); return; }
        instance.SendMessage(BRIDGE_OBJECT, BRIDGE_METHODS.loadScene, JSON.stringify((scene as { data?: unknown }).data ?? scene));
        const inst = instance;
        register((frame) => inst.SendMessage(BRIDGE_OBJECT, BRIDGE_METHODS.frame, JSON.stringify(frame)));
        status.current("ready");
      } catch (e) {
        if (!disposed) status.current("error", e instanceof Error ? e.message : "unity");
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
  }, [gameId, areaId, register]);

  return <canvas ref={canvas} data-testid="unity-canvas" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />;
}
