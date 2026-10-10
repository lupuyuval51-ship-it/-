import type { CollectibleKind, Environment, Layout, NpcShape } from "../spec/constants";

export type BoxKind = "floor" | "platform" | "wall" | "prop" | "gate" | "bounds";

export interface Mover {
  axis: "x" | "z";
  amplitude: number;
  period: number;
  phase: number;
}

export interface WorldBox {
  id: string;
  kind: BoxKind;
  x0: number; x1: number; y0: number; y1: number; z0: number; z1: number;
  /** Rendered? (`bounds` boxes are invisible collision walls.) */
  visible: boolean;
  /** Blocks horizontal movement when the player is lower than its top. */
  solid: boolean;
  /** The player can stand on its top surface. */
  walkable: boolean;
  style: string;
  mover?: Mover;
  gateId?: string;
}

export type DecorKind =
  | "tree" | "pine" | "rock" | "crystal" | "pillar" | "tower" | "crate" | "pipe" | "coral" | "mushroom" | "lamp" | "arch" | "antenna" | "cactus" | "bush" | "cloud" | "building" | "hologram";

export interface DecorItem {
  kind: DecorKind;
  x: number; y: number; z: number;
  scale: number;
  rot: number;
  /** 0..1 — shown only when the render profile's environmentDetail is greater than this rank. */
  rank: number;
  /** Solid decor also has a collision box in `boxes`. */
  solid: boolean;
  tint: number;
}

export interface Placed { x: number; y: number; z: number }
export interface WorldStation extends Placed { stationId: string; kind: "challenge" | "lore"; label: string; facing: number }
export interface WorldNpc extends Placed { npcId: string; name: string; color: string; shape: NpcShape; facing: number }
export interface WorldCollectible extends Placed { itemId: string; kind: CollectibleKind }
export interface WorldCheckpoint extends Placed { checkpointId: string }
export interface WorldHazard { id: string; x0: number; x1: number; z0: number; z1: number; y: number; kind: "lava" | "electric" }
export interface WorldGate { id: string; opensWhenStationsDone: string[] }
export interface WorldPortal extends Placed { toAreaId: string; label: string; requiresMissionIds: string[] }

export interface EnvTheme {
  skyTop: string;
  skyBottom: string;
  fog: string;
  ground: string;
  groundAlt: string;
  wall: string;
  platform: string;
  accent: string;
  accent2: string;
  sun: string;
  sunIntensity: number;
  ambient: number;
  stars: boolean;
}

export interface WorldModel {
  areaId: string;
  layout: Layout;
  environment: Environment;
  seed: number;
  bounds: { x0: number; x1: number; z0: number; z1: number };
  killY: number;
  spawn: { x: number; y: number; z: number; yaw: number };
  boxes: WorldBox[];
  decor: DecorItem[];
  stations: WorldStation[];
  npcs: WorldNpc[];
  collectibles: WorldCollectible[];
  checkpoints: WorldCheckpoint[];
  hazards: WorldHazard[];
  gates: WorldGate[];
  portal: WorldPortal | null;
  theme: EnvTheme;
  /** Whether the area plays as a platformer (void below, jump required). */
  hasVoid: boolean;
}
