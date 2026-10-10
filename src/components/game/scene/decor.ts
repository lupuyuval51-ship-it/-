import type { DecorKind } from "@/lib/game/world/types";

export type Geo = "box" | "cyl" | "cone" | "sphere" | "oct" | "torus";
export type ColorKey = "trunk" | "leaf" | "rock" | "crystal" | "metal" | "wall" | "accent" | "accent2" | "sand" | "cloud" | "coral" | "lamp" | "glass" | "stone";

export interface Part {
  geo: Geo;
  /** Local scale of the unit geometry. */
  size: [number, number, number];
  /** Offset from the item's base position. */
  pos: [number, number, number];
  color: ColorKey;
  emissive?: boolean;
}

/** Scenery composed from primitives only: no external assets are ever loaded. */
export const DECOR_PARTS: Record<DecorKind, Part[]> = {
  tree: [
    { geo: "cyl", size: [0.3, 1.8, 0.3], pos: [0, 0.9, 0], color: "trunk" },
    { geo: "sphere", size: [1.7, 1.5, 1.7], pos: [0, 2.5, 0], color: "leaf" },
    { geo: "sphere", size: [1.2, 1.1, 1.2], pos: [0.5, 3.2, 0.2], color: "leaf" },
  ],
  pine: [
    { geo: "cyl", size: [0.25, 1.2, 0.25], pos: [0, 0.6, 0], color: "trunk" },
    { geo: "cone", size: [1.5, 2.2, 1.5], pos: [0, 2.0, 0], color: "leaf" },
    { geo: "cone", size: [1.1, 1.8, 1.1], pos: [0, 3.2, 0], color: "leaf" },
  ],
  rock: [
    { geo: "oct", size: [1.3, 1.0, 1.2], pos: [0, 0.5, 0], color: "rock" },
    { geo: "oct", size: [0.7, 0.55, 0.7], pos: [0.9, 0.25, 0.3], color: "rock" },
  ],
  crystal: [
    { geo: "oct", size: [0.7, 2.2, 0.7], pos: [0, 1.1, 0], color: "crystal", emissive: true },
    { geo: "oct", size: [0.45, 1.4, 0.45], pos: [0.6, 0.7, 0.2], color: "crystal", emissive: true },
  ],
  pillar: [
    { geo: "cyl", size: [0.55, 3.2, 0.55], pos: [0, 1.6, 0], color: "stone" },
    { geo: "box", size: [1.3, 0.3, 1.3], pos: [0, 3.3, 0], color: "stone" },
    { geo: "box", size: [1.3, 0.25, 1.3], pos: [0, 0.12, 0], color: "stone" },
  ],
  tower: [
    { geo: "box", size: [2.2, 9, 2.2], pos: [0, 4.5, 0], color: "metal" },
    { geo: "box", size: [1.2, 3, 1.2], pos: [0, 10.5, 0], color: "metal" },
    { geo: "box", size: [2.3, 0.3, 2.3], pos: [0, 7, 0], color: "accent", emissive: true },
  ],
  crate: [
    { geo: "box", size: [1.2, 1.2, 1.2], pos: [0, 0.6, 0], color: "metal" },
    { geo: "box", size: [1.25, 0.12, 1.25], pos: [0, 0.6, 0], color: "accent", emissive: true },
  ],
  pipe: [
    { geo: "cyl", size: [0.3, 5, 0.3], pos: [0, 2.5, 0], color: "metal" },
    { geo: "torus", size: [0.55, 0.55, 0.3], pos: [0, 3.5, 0], color: "accent" },
  ],
  coral: [
    { geo: "cyl", size: [0.2, 1.6, 0.2], pos: [0, 0.8, 0], color: "coral" },
    { geo: "sphere", size: [0.6, 0.5, 0.6], pos: [0, 1.7, 0], color: "coral" },
    { geo: "cyl", size: [0.15, 1.0, 0.15], pos: [0.5, 0.5, 0.1], color: "coral" },
  ],
  mushroom: [
    { geo: "cyl", size: [0.18, 0.8, 0.18], pos: [0, 0.4, 0], color: "cloud" },
    { geo: "sphere", size: [0.8, 0.45, 0.8], pos: [0, 0.9, 0], color: "accent2" },
  ],
  lamp: [
    { geo: "cyl", size: [0.08, 3.2, 0.08], pos: [0, 1.6, 0], color: "metal" },
    { geo: "sphere", size: [0.35, 0.35, 0.35], pos: [0, 3.3, 0], color: "lamp", emissive: true },
  ],
  arch: [
    { geo: "box", size: [0.7, 4, 0.7], pos: [-1.6, 2, 0], color: "stone" },
    { geo: "box", size: [0.7, 4, 0.7], pos: [1.6, 2, 0], color: "stone" },
    { geo: "box", size: [4, 0.7, 0.8], pos: [0, 4.2, 0], color: "stone" },
  ],
  antenna: [
    { geo: "cyl", size: [0.12, 8, 0.12], pos: [0, 4, 0], color: "metal" },
    { geo: "sphere", size: [0.3, 0.3, 0.3], pos: [0, 8.2, 0], color: "accent2", emissive: true },
  ],
  cactus: [
    { geo: "cyl", size: [0.35, 2.4, 0.35], pos: [0, 1.2, 0], color: "leaf" },
    { geo: "cyl", size: [0.2, 1.0, 0.2], pos: [0.55, 1.5, 0], color: "leaf" },
  ],
  bush: [
    { geo: "sphere", size: [1.1, 0.8, 1.1], pos: [0, 0.4, 0], color: "leaf" },
    { geo: "sphere", size: [0.7, 0.6, 0.7], pos: [0.7, 0.3, 0.3], color: "leaf" },
  ],
  cloud: [
    { geo: "sphere", size: [3, 1.2, 2], pos: [0, 0, 0], color: "cloud" },
    { geo: "sphere", size: [2, 1, 1.5], pos: [2, 0.2, 0.4], color: "cloud" },
    { geo: "sphere", size: [2.2, 0.9, 1.5], pos: [-2, 0, -0.2], color: "cloud" },
  ],
  building: [
    { geo: "box", size: [3, 6, 3], pos: [0, 3, 0], color: "metal" },
    { geo: "box", size: [3.05, 0.25, 3.05], pos: [0, 4.4, 0], color: "accent2", emissive: true },
    { geo: "box", size: [3.05, 0.25, 3.05], pos: [0, 1.8, 0], color: "accent", emissive: true },
  ],
  hologram: [
    { geo: "torus", size: [1.2, 1.2, 0.5], pos: [0, 0.9, 0], color: "accent", emissive: true },
    { geo: "oct", size: [0.7, 0.9, 0.7], pos: [0, 1.0, 0], color: "accent2", emissive: true },
  ],
};

const PALETTES: Record<ColorKey, string[]> = {
  trunk: ["#6b4a2b", "#5c3f25", "#7a5632", "#654529"],
  leaf: ["#2f7d3a", "#3f9b45", "#5aae4a", "#2a6b46"],
  rock: ["#8b8f98", "#767b85", "#9a9387", "#6f747d"],
  stone: ["#bdb7a8", "#aaa592", "#c9c2ad", "#9f9a89"],
  crystal: ["#7df9ff", "#b388ff", "#69f0ae", "#ff80ab"],
  metal: ["#4a5578", "#3b4663", "#566086", "#2f3957"],
  wall: ["#6b7280", "#5b6270", "#7a8191", "#4f5666"],
  accent: ["#22e6ff", "#22e6ff", "#22e6ff", "#22e6ff"],
  accent2: ["#ff4fd8", "#ff4fd8", "#ff4fd8", "#ff4fd8"],
  sand: ["#d8c08a", "#cdb27a", "#e3cd9a", "#c2a56c"],
  cloud: ["#ffffff", "#f4f8ff", "#e9f1ff", "#ffffff"],
  coral: ["#ff7b9c", "#ff9e7b", "#c77bff", "#ffb347"],
  lamp: ["#fff3b0", "#fff3b0", "#fff3b0", "#fff3b0"],
  glass: ["#9fd8ff", "#9fd8ff", "#9fd8ff", "#9fd8ff"],
};

export function decorColor(key: ColorKey, tint: number, accent: string, accent2: string): string {
  if (key === "accent") return accent;
  if (key === "accent2") return accent2;
  return PALETTES[key][tint % 4]!;
}
