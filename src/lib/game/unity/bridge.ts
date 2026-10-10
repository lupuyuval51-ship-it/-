/**
 * Browser ↔ Unity WebGL message protocol.
 *
 * Direction of trust:
 *  - host → Unity: scene description once per area, then ~20 Hz frames with positions/progress flags (display only).
 *  - Unity → host: `ready`, `error`, `stats`. Nothing coming from Unity is trusted: it is schema-validated, size-limited,
 *    and can never change score, progress or access. Gameplay input stays in the browser and the server stays authoritative.
 */
import { z } from "zod";
import type { PublicSpec } from "../spec/public";
import { stationActive, stationDone, type ClientState } from "../state/progress";

export const BRIDGE_OBJECT = "LevelUpBridge";
export const BRIDGE_METHODS = { loadScene: "LoadScene", frame: "OnFrame", fx: "OnFx", setQuality: "SetQuality" } as const;

export interface UnityFrame {
  t: number;
  player: { x: number; y: number; z: number; yaw: number; speed: number; grounded: boolean };
  camera: { x: number; y: number; z: number; lx: number; ly: number; lz: number };
  nearby: { kind: "station" | "npc" | "portal"; id: string } | null;
  collected: string[];
  /** stationId → status, as already shown in the browser HUD. */
  stations: Record<string, "active" | "locked" | "done">;
  openGates: string[];
}

export type FxName = "correct" | "wrong" | "collect" | "gate" | "complete";

const num = z.number().finite();

/** Messages Unity may send to the page. Strict: unknown shapes are rejected. */
export const unityInboundSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ready"), version: z.string().max(40).optional() }).strict(),
  z.object({ type: z.literal("error"), message: z.string().max(300) }).strict(),
  z.object({ type: z.literal("stats"), fps: num.min(0).max(1000), triangles: num.min(0).max(1e9).optional() }).strict(),
]);
export type UnityInbound = z.infer<typeof unityInboundSchema>;

/** Parse whatever Unity sent (a JSON string). Returns null for anything invalid or oversized. */
export function parseUnityMessage(raw: unknown): UnityInbound | null {
  if (typeof raw !== "string" || raw.length > 2000) return null;
  try {
    const parsed = unityInboundSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

const r3 = (n: number) => Math.round(n * 1000) / 1000;

export interface FrameSource {
  sim: { time: number; player: { x: number; y: number; z: number; yaw: number; speed: number; grounded: boolean } };
  nearby: { kind: "station" | "npc" | "portal"; id: string } | null;
  client: { collected: string[] };
  world: { stations: { stationId: string }[]; gates: { id: string }[] };
  stationStatus(stationId: string): "active" | "locked" | "done";
  gateOpen(gateId: string): boolean;
}

export function buildFrame(src: FrameSource, camera: UnityFrame["camera"]): UnityFrame {
  const p = src.sim.player;
  const stations: UnityFrame["stations"] = {};
  for (const s of src.world.stations) stations[s.stationId] = src.stationStatus(s.stationId);
  return {
    t: r3(src.sim.time),
    player: { x: r3(p.x), y: r3(p.y), z: r3(p.z), yaw: r3(p.yaw), speed: r3(p.speed), grounded: p.grounded },
    camera: { x: r3(camera.x), y: r3(camera.y), z: r3(camera.z), lx: r3(camera.lx), ly: r3(camera.ly), lz: r3(camera.lz) },
    nearby: src.nearby ? { kind: src.nearby.kind, id: src.nearby.id } : null,
    collected: src.client.collected,
    stations,
    openGates: src.world.gates.filter((g) => src.gateOpen(g.id)).map((g) => g.id),
  };
}

/** Same status the HUD shows (and the runtime's `nearby` uses): done → active → locked. */
export function stationStatusOf(spec: PublicSpec, client: ClientState, stationId: string): "active" | "locked" | "done" {
  if (stationDone(client, stationId)) return "done";
  for (const a of spec.areas) {
    const def = a.stations.find((x) => x.id === stationId);
    if (def) return stationActive(spec, client, def) ? "active" : "locked";
  }
  return "locked";
}
